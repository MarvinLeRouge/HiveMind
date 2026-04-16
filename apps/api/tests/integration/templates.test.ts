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
let adminToken: string;
let otherToken: string;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  // The seed uses SHA-256 for the admin password, but AuthService uses bcrypt.
  // Re-hash the admin password with bcrypt so login works in tests.
  const bcryptHash = await bcrypt.hash('change_me_admin', 1);
  await prisma.user.update({
    where: { email: 'admin@HiveMind.local' },
    data: { passwordHash: bcryptHash },
  });
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean non-system templates and test users
  await prisma.template.deleteMany({ where: { isSystem: false } });
  await prisma.user.deleteMany({ where: { isAdmin: false } });

  // Register regular user
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

  // Register another regular user
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

  // Login as admin
  const adminRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@HiveMind.local', password: 'change_me_admin' },
  });
  adminToken = adminRes.json().accessToken as string;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createUserTemplate(token: string, name = 'My Template') {
  return app.inject({
    method: 'POST',
    url: '/templates',
    headers: { authorization: `Bearer ${token}` },
    payload: { name, description: 'A test template' },
  });
}

// ── GET /templates ────────────────────────────────────────────────────────────

describe('GET /templates', () => {
  it('returns system templates for any authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/templates',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Array<{ isSystem: boolean }>;
    expect(body.some((t) => t.isSystem)).toBe(true);
  });

  it('returns own templates in the list', async () => {
    await createUserTemplate(userToken, 'Owned Template');
    const res = await app.inject({
      method: 'GET',
      url: '/templates',
      headers: { authorization: `Bearer ${userToken}` },
    });
    const body = res.json() as Array<{ name: string }>;
    expect(body.some((t) => t.name === 'Owned Template')).toBe(true);
  });

  it('does not expose private templates from another user', async () => {
    await createUserTemplate(otherToken, 'Other Private Template');
    const res = await app.inject({
      method: 'GET',
      url: '/templates',
      headers: { authorization: `Bearer ${userToken}` },
    });
    const body = res.json() as Array<{ name: string }>;
    expect(body.some((t) => t.name === 'Other Private Template')).toBe(false);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/templates' });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /templates/:id ────────────────────────────────────────────────────────

describe('GET /templates/:id', () => {
  it('returns a template by ID', async () => {
    const createRes = await createUserTemplate(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'GET',
      url: `/templates/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it('returns 404 for unknown ID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/templates/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── POST /templates ───────────────────────────────────────────────────────────

describe('POST /templates', () => {
  it('creates a user template and returns 201', async () => {
    const res = await createUserTemplate(userToken);
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe('My Template');
    expect(body.isSystem).toBe(false);
    expect(body.createdBy).toBeTruthy();
  });

  it('returns 400 for missing name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/templates',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { description: 'No name' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/templates',
      payload: { name: 'Anon Template' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PATCH /templates/:id ──────────────────────────────────────────────────────

describe('PATCH /templates/:id', () => {
  it('updates own template', async () => {
    const createRes = await createUserTemplate(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/templates/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Updated Name' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Updated Name');
  });

  it('returns 403 when updating another user template', async () => {
    const createRes = await createUserTemplate(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/templates/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { name: 'Stolen Update' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for unknown template', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/templates/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Ghost' },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── DELETE /templates/:id ─────────────────────────────────────────────────────

describe('DELETE /templates/:id', () => {
  it('deletes own template and returns 204', async () => {
    const createRes = await createUserTemplate(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/templates/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 403 when deleting another user template', async () => {
    const createRes = await createUserTemplate(userToken);
    const id = createRes.json().id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/templates/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

// ── POST /templates/system ────────────────────────────────────────────────────

describe('POST /templates/system', () => {
  it('creates a system template when caller is admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/templates/system',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'New System Template', useGcCode: true },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.isSystem).toBe(true);
    expect(body.useGcCode).toBe(true);
  });

  it('returns 403 when caller is not admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/templates/system',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Fake System Template' },
    });
    expect(res.statusCode).toBe(403);
  });
});

// ── PATCH /templates/system/:id ───────────────────────────────────────────────

describe('PATCH /templates/system/:id', () => {
  it('updates a system template when caller is admin', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/templates/system/system-template-generic',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { description: 'Updated description' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().description).toBe('Updated description');
  });

  it('returns 403 when caller is not admin', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/templates/system/system-template-generic',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { description: 'Unauthorized update' },
    });
    expect(res.statusCode).toBe(403);
  });
});
