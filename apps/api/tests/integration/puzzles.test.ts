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

async function createPuzzle(
  token: string,
  collectionId: string,
  title = 'My Puzzle',
) {
  const res = await app.inject({
    method: 'POST',
    url: `/collections/${collectionId}/puzzles`,
    headers: { authorization: `Bearer ${token}` },
    payload: { title },
  });
  return res;
}

// ── POST /collections/:id/puzzles ─────────────────────────────────────────────

describe('POST /collections/:id/puzzles', () => {
  it('creates a puzzle and returns 201', async () => {
    const collectionId = await createCollection(userToken);
    const res = await createPuzzle(userToken, collectionId);

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.title).toBe('My Puzzle');
    expect(body.status).toBe('open');
    expect(body.sortOrder).toBe(0);
  });

  it('auto-increments sortOrder for subsequent puzzles', async () => {
    const collectionId = await createCollection(userToken);
    await createPuzzle(userToken, collectionId, 'Puzzle A');
    const res = await createPuzzle(userToken, collectionId, 'Puzzle B');

    expect(res.json().sortOrder).toBe(1);
  });

  it('returns 403 for a non-owner (unauthenticated member)', async () => {
    const collectionId = await createCollection(userToken);
    const res = await createPuzzle(otherToken, collectionId);
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for missing title', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles`,
      payload: { title: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /collections/:id/puzzles ──────────────────────────────────────────────

describe('GET /collections/:id/puzzles', () => {
  it('returns the list of puzzles for a member', async () => {
    const collectionId = await createCollection(userToken);
    await createPuzzle(userToken, collectionId, 'P1');
    await createPuzzle(userToken, collectionId, 'P2');

    const res = await app.inject({
      method: 'GET',
      url: `/collections/${collectionId}/puzzles`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });

  it('returns 403 for a non-member', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'GET',
      url: `/collections/${collectionId}/puzzles`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'GET',
      url: `/collections/${collectionId}/puzzles`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /collections/:id/puzzles/:pid ─────────────────────────────────────────

describe('GET /collections/:id/puzzles/:pid', () => {
  it('returns the puzzle for a member', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'GET',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(puzzleId);
  });

  it('returns 404 for an unknown puzzle', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'GET',
      url: `/collections/${collectionId}/puzzles/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'GET',
      url: `/collections/${collectionId}/puzzles/00000000-0000-0000-0000-000000000000`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PATCH /collections/:id/puzzles/:pid ───────────────────────────────────────

describe('PATCH /collections/:id/puzzles/:pid', () => {
  it('updates a puzzle and returns 200', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { title: 'Updated Title' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().title).toBe('Updated Title');
  });

  it('allows a valid forward status transition', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { status: 'in_progress' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('in_progress');
  });

  it('returns 422 for an invalid status transition', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { status: 'verified' },
    });

    expect(res.statusCode).toBe(422);
  });

  it('returns 400 for an empty body', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 for a non-member', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { title: 'x' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for an unknown puzzle', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { title: 'x' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/00000000-0000-0000-0000-000000000000`,
      payload: { title: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── DELETE /collections/:id/puzzles/:pid ──────────────────────────────────────

describe('DELETE /collections/:id/puzzles/:pid', () => {
  it('deletes a puzzle and returns 204', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(204);

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    expect(puzzle).toBeNull();
  });

  it('returns 403 for a non-owner', async () => {
    const collectionId = await createCollection(userToken);
    // Add user2 as member
    await prisma.collectionMember.create({
      data: { collectionId, userId: otherUserId, role: 'member' },
    });
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${collectionId}/puzzles/${puzzleId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for an unknown puzzle', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${collectionId}/puzzles/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${collectionId}/puzzles/00000000-0000-0000-0000-000000000000`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PATCH /collections/:id/puzzles/reorder ────────────────────────────────────

describe('PATCH /collections/:id/puzzles/reorder', () => {
  it('reorders puzzles and returns 204', async () => {
    const collectionId = await createCollection(userToken);
    const p1 = (await createPuzzle(userToken, collectionId, 'P1')).json()
      .id as string;
    const p2 = (await createPuzzle(userToken, collectionId, 'P2')).json()
      .id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/reorder`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: {
        puzzles: [
          { id: p1, sortOrder: 10 },
          { id: p2, sortOrder: 5 },
        ],
      },
    });

    expect(res.statusCode).toBe(204);

    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles[0].id).toBe(p2);
    expect(puzzles[1].id).toBe(p1);
  });

  it('returns 403 for a non-owner', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/reorder`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: {
        puzzles: [{ id: '00000000-0000-0000-0000-000000000000', sortOrder: 0 }],
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const res = await app.inject({
      method: 'PATCH',
      url: `/collections/${collectionId}/puzzles/reorder`,
      payload: {
        puzzles: [{ id: '00000000-0000-0000-0000-000000000000', sortOrder: 0 }],
      },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /collections/:id/puzzles/:pid/claim ──────────────────────────────────

describe('POST /collections/:id/puzzles/:pid/claim', () => {
  it('claims a puzzle and returns 204', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(204);

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    expect(puzzle!.workingOnId).toBe(userId);
  });

  it('returns 409 when already claimed', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    // First claim
    await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    // Second claim attempt
    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(409);
  });

  it('returns 403 for a non-member', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
    });

    expect(res.statusCode).toBe(401);
  });
});

// ── DELETE /collections/:id/puzzles/:pid/claim ────────────────────────────────

describe('DELETE /collections/:id/puzzles/:pid/claim', () => {
  it('releases the claim and returns 204', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    // Claim first
    await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(204);

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    expect(puzzle!.workingOnId).toBeNull();
  });

  it('returns 403 when the user is not the claimant', async () => {
    const collectionId = await createCollection(userToken);
    // Add user2 as member
    await prisma.collectionMember.create({
      data: { collectionId, userId: otherUserId, role: 'member' },
    });
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    // user1 claims
    await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    // user2 tries to unclaim
    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const puzzleId = (await createPuzzle(userToken, collectionId)).json()
      .id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/collections/${collectionId}/puzzles/${puzzleId}/claim`,
    });

    expect(res.statusCode).toBe(401);
  });
});
