import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../../src/app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_GPX = readFileSync(
  join(__dirname, '../fixtures/sample.gpx'),
  'utf-8',
);

const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
});

let app: FastifyInstance;
let userToken: string;
let otherToken: string;
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

function makeMultipartBody(content: string, boundary: string): string {
  return [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="import.gpx"',
    'Content-Type: application/xml',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');
}

// ── POST /collections/:id/import/gpx ─────────────────────────────────────────

describe('POST /collections/:id/import/gpx', () => {
  it('imports puzzles from a valid GPX file and returns 201', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/gpx`,
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(FIXTURE_GPX, boundary),
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().created).toBe(3);

    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles).toHaveLength(3);
    expect(puzzles[0].title).toBe('GC12345');
    expect(puzzles[0].gcCode).toBe('GC12345');
    expect(puzzles[0].coords).toBe('48.850293,2.349241');
    expect(puzzles[0].difficulty).toBe(2);
    expect(puzzles[0].terrain).toBe(1.5);
    expect(puzzles[0].hint).toBe('Look under the bridge');
    expect(puzzles[0].sortOrder).toBe(0);
    expect(puzzles[2].title).toBe('Regular Waypoint');
    expect(puzzles[2].gcCode).toBeNull();
  });

  it('appends to existing puzzles with correct sortOrder', async () => {
    const collectionId = await createCollection(userToken);

    // Create one puzzle first
    await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/puzzles`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { title: 'Existing Puzzle' },
    });

    const boundary = 'testboundary';
    await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/gpx`,
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(FIXTURE_GPX, boundary),
    });

    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles).toHaveLength(4);
    expect(puzzles[0].title).toBe('Existing Puzzle');
    expect(puzzles[0].sortOrder).toBe(0);
    expect(puzzles[1].sortOrder).toBe(1);
  });

  it('returns 400 for invalid XML content', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/gpx`,
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody('not valid gpx <<<', boundary),
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 for a non-owner', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/gpx`,
      headers: {
        authorization: `Bearer ${otherToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(FIXTURE_GPX, boundary),
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/gpx`,
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(FIXTURE_GPX, boundary),
    });

    expect(res.statusCode).toBe(401);
  });
});
