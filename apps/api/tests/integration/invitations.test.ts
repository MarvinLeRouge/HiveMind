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
let userId: string;
let otherUserId: string;
let systemTemplateId: string;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  const bcryptHash = await bcrypt.hash('change_me_admin', 1);
  await prisma.user.update({
    where: { email: 'admin@HiveMind.local' },
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
  await prisma.collection.deleteMany({});
  await prisma.template.deleteMany({ where: { isSystem: false } });
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
  userId = userRes.json().user.id as string;

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
  otherUserId = otherRes.json().user.id as string;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createCollection(token: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/collections',
    headers: { authorization: `Bearer ${token}` },
    payload: { name: 'Test Collection', templateId: systemTemplateId },
  });
  return res.json().id as string;
}

async function sendInvitation(
  token: string,
  collectionId: string,
  email: string,
) {
  return app.inject({
    method: 'POST',
    url: `/collections/${collectionId}/invitations`,
    headers: { authorization: `Bearer ${token}` },
    payload: { email },
  });
}

// ── POST /collections/:id/invitations ─────────────────────────────────────────

describe('POST /collections/:id/invitations', () => {
  it('creates an invitation and returns 201', async () => {
    const collectionId = await createCollection(userToken);
    const res = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.inviteeEmail).toBe('user2@example.com');
    expect(body.status).toBe('pending');
    expect(body.expiresAt).toBeTruthy();
  });

  it('returns 403 for a non-owner', async () => {
    const collectionId = await createCollection(userToken);
    const res = await sendInvitation(
      otherToken,
      collectionId,
      'someone@example.com',
    );
    expect(res.statusCode).toBe(403);
  });

  it('returns 409 when a pending invitation already exists for the email', async () => {
    const collectionId = await createCollection(userToken);
    await sendInvitation(userToken, collectionId, 'user2@example.com');
    const res = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    expect(res.statusCode).toBe(409);
  });

  it('returns 409 when the invitee is already a member', async () => {
    const collectionId = await createCollection(userToken);
    // Add user2 as member directly
    await prisma.collectionMember.create({
      data: { collectionId, userId: otherUserId, role: 'member' },
    });

    const res = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 for invalid email', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/invitations`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/invitations`,
      payload: { email: 'user2@example.com' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /invitations/:id ──────────────────────────────────────────────────────

describe('GET /invitations/:id', () => {
  it('returns the invitation for any authenticated user', async () => {
    const collectionId = await createCollection(userToken);
    const invRes = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    const invId = invRes.json().id as string;

    const res = await app.inject({
      method: 'GET',
      url: `/invitations/${invId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(invId);
    expect(res.json().status).toBe('pending');
  });

  it('returns 404 for an unknown invitation', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/invitations/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/invitations/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /invitations/:id/accept ──────────────────────────────────────────────

describe('POST /invitations/:id/accept', () => {
  it('accepts the invitation and adds the invitee as a member', async () => {
    const collectionId = await createCollection(userToken);
    const invRes = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    const invId = invRes.json().id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/accept`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(204);

    // Verify user2 is now a member
    const membership = await prisma.collectionMember.findUnique({
      where: { collectionId_userId: { collectionId, userId: otherUserId } },
    });
    expect(membership).not.toBeNull();
    expect(membership!.role).toBe('member');

    // Verify invitation status updated
    const invitation = await prisma.invitation.findUnique({
      where: { id: invId },
    });
    expect(invitation!.status).toBe('accepted');
  });

  it('returns 403 when the accepting user email does not match', async () => {
    const collectionId = await createCollection(userToken);
    const invRes = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    const invId = invRes.json().id as string;

    // user1 tries to accept an invitation sent to user2
    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/accept`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 410 for an expired invitation', async () => {
    const collectionId = await createCollection(userToken);
    // Insert a past-expired invitation directly
    const expired = await prisma.invitation.create({
      data: {
        collectionId,
        invitedBy: userId,
        inviteeEmail: 'user2@example.com',
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${expired.id}/accept`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(410);
  });

  it('returns 409 when the invitation was already accepted', async () => {
    const collectionId = await createCollection(userToken);
    const invRes = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    const invId = invRes.json().id as string;

    // Accept once
    await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/accept`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    // Try to accept again
    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/accept`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(409);
  });

  it('returns 404 for an unknown invitation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/invitations/00000000-0000-0000-0000-000000000000/accept',
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/invitations/00000000-0000-0000-0000-000000000000/accept',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /invitations/:id/decline ─────────────────────────────────────────────

describe('POST /invitations/:id/decline', () => {
  it('declines the invitation and returns 204', async () => {
    const collectionId = await createCollection(userToken);
    const invRes = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    const invId = invRes.json().id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/decline`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(204);

    const invitation = await prisma.invitation.findUnique({
      where: { id: invId },
    });
    expect(invitation!.status).toBe('declined');
  });

  it('returns 403 when the declining user email does not match', async () => {
    const collectionId = await createCollection(userToken);
    const invRes = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    const invId = invRes.json().id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/decline`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 409 when the invitation was already declined', async () => {
    const collectionId = await createCollection(userToken);
    const invRes = await sendInvitation(
      userToken,
      collectionId,
      'user2@example.com',
    );
    const invId = invRes.json().id as string;

    await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/decline`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${invId}/decline`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(409);
  });

  it('returns 410 for an expired invitation', async () => {
    const collectionId = await createCollection(userToken);
    const expired = await prisma.invitation.create({
      data: {
        collectionId,
        invitedBy: userId,
        inviteeEmail: 'user2@example.com',
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/invitations/${expired.id}/decline`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(410);
  });
});
