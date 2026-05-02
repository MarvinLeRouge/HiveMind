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
let collectionId: string;
let puzzleId: string;

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

  // Create a collection and a puzzle owned by user1
  const colRes = await app.inject({
    method: 'POST',
    url: '/collections',
    headers: { authorization: `Bearer ${userToken}` },
    payload: { name: 'Test Collection', templateId: systemTemplateId },
  });
  collectionId = colRes.json().id as string;

  const puzRes = await app.inject({
    method: 'POST',
    url: `/collections/${collectionId}/puzzles`,
    headers: { authorization: `Bearer ${userToken}` },
    payload: { title: 'Test Puzzle' },
  });
  puzzleId = puzRes.json().id as string;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function addNote(token: string, content = 'A note') {
  return app.inject({
    method: 'POST',
    url: `/puzzles/${puzzleId}/notes`,
    headers: { authorization: `Bearer ${token}` },
    payload: { content },
  });
}

async function addAttempt(
  token: string,
  valueTested = 'ABCDE',
  checkerResult = false,
) {
  return app.inject({
    method: 'POST',
    url: `/puzzles/${puzzleId}/attempts`,
    headers: { authorization: `Bearer ${token}` },
    payload: { valueTested, checkerResult },
  });
}

// ── POST /puzzles/:pid/notes ──────────────────────────────────────────────────

describe('POST /puzzles/:pid/notes', () => {
  it('adds a note and returns 201', async () => {
    const res = await addNote(userToken, 'Hello world');

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.content).toBe('Hello world');
    expect(body.userId).toBe(userId);
    expect(body.puzzleId).toBe(puzzleId);
  });

  it('returns 403 for a non-member', async () => {
    const res = await addNote(otherToken);
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for an unknown puzzle', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/puzzles/00000000-0000-0000-0000-000000000000/notes',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { content: 'x' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for empty content', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/puzzles/${puzzleId}/notes`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { content: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/puzzles/${puzzleId}/notes`,
      payload: { content: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /puzzles/:pid/notes ───────────────────────────────────────────────────

describe('GET /puzzles/:pid/notes', () => {
  it('returns the list of notes for a member', async () => {
    await addNote(userToken, 'Note 1');
    await addNote(userToken, 'Note 2');

    const res = await app.inject({
      method: 'GET',
      url: `/puzzles/${puzzleId}/notes`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });

  it('returns 403 for a non-member', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/puzzles/${puzzleId}/notes`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/puzzles/${puzzleId}/notes`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PATCH /puzzles/:pid/notes/:nid ────────────────────────────────────────────

describe('PATCH /puzzles/:pid/notes/:nid', () => {
  it('updates the note when the user is the author', async () => {
    const noteId = (await addNote(userToken)).json().id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/puzzles/${puzzleId}/notes/${noteId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { content: 'Updated content' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().content).toBe('Updated content');
  });

  it('returns 403 when the user is a member but not the author', async () => {
    // Add user2 as member
    await prisma.collectionMember.create({
      data: { collectionId, userId: otherUserId, role: 'member' },
    });
    const noteId = (await addNote(userToken)).json().id as string;

    const res = await app.inject({
      method: 'PATCH',
      url: `/puzzles/${puzzleId}/notes/${noteId}`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { content: 'Hack' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for an unknown note', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/puzzles/${puzzleId}/notes/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { content: 'x' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const noteId = (await addNote(userToken)).json().id as string;
    const res = await app.inject({
      method: 'PATCH',
      url: `/puzzles/${puzzleId}/notes/${noteId}`,
      payload: { content: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── DELETE /puzzles/:pid/notes/:nid ───────────────────────────────────────────

describe('DELETE /puzzles/:pid/notes/:nid', () => {
  it('deletes the note when the user is the author', async () => {
    const noteId = (await addNote(userToken)).json().id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/puzzles/${puzzleId}/notes/${noteId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(204);

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    expect(note).toBeNull();
  });

  it('returns 403 when the user is a member but not the author', async () => {
    await prisma.collectionMember.create({
      data: { collectionId, userId: otherUserId, role: 'member' },
    });
    const noteId = (await addNote(userToken)).json().id as string;

    const res = await app.inject({
      method: 'DELETE',
      url: `/puzzles/${puzzleId}/notes/${noteId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for an unknown note', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/puzzles/${puzzleId}/notes/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const noteId = (await addNote(userToken)).json().id as string;
    const res = await app.inject({
      method: 'DELETE',
      url: `/puzzles/${puzzleId}/notes/${noteId}`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /puzzles/:pid/attempts ───────────────────────────────────────────────

describe('POST /puzzles/:pid/attempts', () => {
  it('records an attempt and returns 201', async () => {
    const res = await addAttempt(userToken, 'FGHIJ', true);

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.valueTested).toBe('FGHIJ');
    expect(body.checkerResult).toBe(true);
    expect(body.userId).toBe(userId);
    expect(body.comment).toBeNull();
  });

  it('records an attempt with a comment', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/puzzles/${puzzleId}/attempts`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { valueTested: 'XYZ', checkerResult: false, comment: 'Close!' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().comment).toBe('Close!');
  });

  it('returns 403 for a non-member', async () => {
    const res = await addAttempt(otherToken);
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/puzzles/${puzzleId}/attempts`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { valueTested: 'ABC' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/puzzles/${puzzleId}/attempts`,
      payload: { valueTested: 'ABC', checkerResult: false },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /puzzles/:pid/attempts ────────────────────────────────────────────────

describe('GET /puzzles/:pid/attempts', () => {
  it('returns the list of attempts for a member', async () => {
    await addAttempt(userToken, 'AAA', false);
    await addAttempt(userToken, 'BBB', true);

    const res = await app.inject({
      method: 'GET',
      url: `/puzzles/${puzzleId}/attempts`,
      headers: { authorization: `Bearer ${userToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });

  it('returns 403 for a non-member', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/puzzles/${puzzleId}/attempts`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/puzzles/${puzzleId}/attempts`,
    });
    expect(res.statusCode).toBe(401);
  });
});
