import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../../src/app.js';

const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
});

let app: FastifyInstance;
let userToken: string;
let otherToken: string;
let adminToken: string;

let systemTemplateId: string;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  const bcryptHash = await bcrypt.hash('change_me_admin', 1);
  await prisma.user.update({
    where: { email: process.env['SEED_ADMIN_EMAIL'] ?? 'admin@HiveMind.local' },
    data: { passwordHash: bcryptHash },
  });

  const sysTemplate = await prisma.template.findFirst({
    where: { isSystem: true },
  });
  systemTemplateId = sysTemplate!.id;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Delete collections first (cascade to members, invitations, puzzles)
  await prisma.collection.deleteMany({});
  // Delete non-system templates (includes orphaned snapshots)
  await prisma.template.deleteMany({ where: { isSystem: false } });
  // Delete non-admin users
  await prisma.user.deleteMany({ where: { isAdmin: false } });

  const userRes = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      username: 'user1',
      email: 'user1@example.com',
      password: 'Password123!',
    },
  });
  userToken = userRes.json().accessToken as string;

  const otherRes = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      username: 'user2',
      email: 'user2@example.com',
      password: 'Password123!',
    },
  });
  otherToken = otherRes.json().accessToken as string;

  const adminRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@HiveMind.local', password: 'change_me_admin' },
  });
  adminToken = adminRes.json().accessToken as string;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createCollection(token: string, name = 'Test Collection') {
  return app.inject({
    method: 'POST',
    url: '/collections',
    headers: { authorization: `Bearer ${token}` },
    payload: { name, templateId: systemTemplateId },
  });
}

// ── GET /collections ──────────────────────────────────────────────────────────

describe('GET /collections', () => {
  it('returns only collections where the user is a member', async () => {
    await createCollection(userToken, 'My Collection');
    await createCollection(otherToken, 'Other Collection');

    const res = await app.inject({
      method: 'GET',
      url: '/collections',
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as Array<{ name: string }>;
    expect(body.some((c) => c.name === 'My Collection')).toBe(true);
    expect(body.some((c) => c.name === 'Other Collection')).toBe(false);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/collections' });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /collections ─────────────────────────────────────────────────────────

describe('POST /collections', () => {
  it('creates a collection and returns 201 with templateSnapshot', async () => {
    const res = await createCollection(userToken);

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe('Test Collection');
    expect(body.id).toBeTruthy();
    expect(body.templateSnapshot).toBeTruthy();
    expect(body.templateSnapshot.id).not.toBe(systemTemplateId);
  });

  it('auto-joins the creator as owner', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const membersRes = await app.inject({
      method: 'GET',
      url: `/collections/${id}/members`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    const members = membersRes.json() as Array<{ role: string }>;
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe('owner');
  });

  it('returns 404 when the template does not exist', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: { authorization: `Bearer ${userToken}` },
      payload: {
        name: 'My Collection',
        templateId: '00000000-0000-0000-0000-000000000000',
      },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for missing name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { templateId: systemTemplateId },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/collections',
      payload: { name: 'Anon', templateId: systemTemplateId },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /collections/:id ──────────────────────────────────────────────────────

describe('GET /collections/:id', () => {
  it('returns the collection for a member', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'GET',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it('returns 403 for a non-member', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'GET',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for an unknown collection', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/collections/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── PATCH /collections/:id ────────────────────────────────────────────────────

describe('PATCH /collections/:id', () => {
  it('updates name and description for the owner', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Renamed', description: 'A description' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Renamed');
    expect(res.json().description).toBe('A description');
  });

  it('returns 403 for a non-owner', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { name: 'Stolen' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when body is empty', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });
});

// ── DELETE /collections/:id ───────────────────────────────────────────────────

describe('DELETE /collections/:id', () => {
  it('deletes the collection and returns 204 for the owner', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(204);

    // Verify it's gone — collection no longer exists, so 404
    const getRes = await app.inject({
      method: 'GET',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(getRes.statusCode).toBe(404);
  });

  it('returns 403 for a non-owner', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });
});

// ── GET /collections/:id/members ──────────────────────────────────────────────

describe('GET /collections/:id/members', () => {
  it('returns the owner in the member list', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'GET',
      url: `/collections/${id}/members`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(200);
    const members = res.json() as Array<{
      userId: string;
      role: string;
      username: string;
    }>;
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe('owner');
    expect(members[0]!.username).toBe('user1');
  });

  it('returns 403 for a non-member', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'GET',
      url: `/collections/${id}/members`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });
});

// ── DELETE /collections/:id/members/:userId ───────────────────────────────────

describe('DELETE /collections/:id/members/:userId', () => {
  it('removes a member and returns 204', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    // Manually add otherUser as member
    const otherUser = await prisma.user.findUnique({
      where: { email: 'user2@example.com' },
    });
    await prisma.collectionMember.create({
      data: { collectionId: id, userId: otherUser!.id, role: 'member' },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${id}/members/${otherUser!.id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(204);
  });

  it('returns 409 when removing the last owner', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const ownerUser = await prisma.user.findUnique({
      where: { email: 'user1@example.com' },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${id}/members/${ownerUser!.id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(409);
  });

  it('returns 403 for a non-owner', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const otherUser = await prisma.user.findUnique({
      where: { email: 'user2@example.com' },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${id}/members/${otherUser!.id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for a user who is not a member', async () => {
    const createRes = await createCollection(userToken);
    const id = createRes.json().id as string;

    const otherUser = await prisma.user.findUnique({
      where: { email: 'user2@example.com' },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${id}/members/${otherUser!.id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(404);
  });
});

// ── Template snapshot isolation ───────────────────────────────────────────────

describe('Template snapshot isolation', () => {
  it('collection keeps its snapshot when the original template is deleted', async () => {
    // Create a user template, then create a collection from it
    const tplRes = await app.inject({
      method: 'POST',
      url: '/templates',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Ephemeral Template', useGcCode: true },
    });
    const templateId = tplRes.json().id as string;

    const colRes = await createCollection(userToken);
    // Re-create with the user template
    const colRes2 = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Snapshot Test', templateId },
    });
    const colId = colRes2.json().id as string;
    const snapshotId = colRes2.json().templateSnapshot.id as string;

    // Delete the original template
    await app.inject({
      method: 'DELETE',
      url: `/templates/${templateId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    // Fetch collection — snapshot should still be intact
    const getRes = await app.inject({
      method: 'GET',
      url: `/collections/${colId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().templateSnapshot.id).toBe(snapshotId);
    expect(getRes.json().templateSnapshot.name).toBe('Ephemeral Template');

    // Suppress unused variable warning
    void colRes;
  });
});

// ── Admin cross-collection access ─────────────────────────────────────────────

describe('Admin access', () => {
  it('admin can list collections they belong to', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/collections',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
  });
});
