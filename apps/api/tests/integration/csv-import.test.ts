import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../../src/app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_CSV = readFileSync(
  join(__dirname, '../fixtures/sample.csv'),
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

function makeMultipartBody(
  parts: { name: string; value: string; filename?: string }[],
  boundary: string,
): string {
  const body = parts
    .map((p) => {
      const disposition = p.filename
        ? `Content-Disposition: form-data; name="${p.name}"; filename="${p.filename}"\r\nContent-Type: text/plain`
        : `Content-Disposition: form-data; name="${p.name}"`;
      return `--${boundary}\r\n${disposition}\r\n\r\n${p.value}`;
    })
    .join('\r\n');
  return `${body}\r\n--${boundary}--\r\n`;
}

// ── POST /collections/:id/import/csv/preview ──────────────────────────────────

describe('POST /collections/:id/import/csv/preview', () => {
  it('returns columns and up to 3 sample rows', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/csv/preview`,
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(
        [{ name: 'file', value: FIXTURE_CSV, filename: 'sample.csv' }],
        boundary,
      ),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.columns).toEqual([
      'title',
      'gcCode',
      'difficulty',
      'terrain',
      'coords',
      'hint',
    ]);
    expect(body.rows).toHaveLength(3);
    expect(body.rows[0].title).toBe('Mystery Cache 1');
  });

  it('returns 403 for a non-owner', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/csv/preview`,
      headers: {
        authorization: `Bearer ${otherToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(
        [{ name: 'file', value: FIXTURE_CSV, filename: 'sample.csv' }],
        boundary,
      ),
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/csv/preview`,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: makeMultipartBody(
        [{ name: 'file', value: FIXTURE_CSV, filename: 'sample.csv' }],
        boundary,
      ),
    });

    expect(res.statusCode).toBe(401);
  });
});

// ── POST /collections/:id/import/csv ──────────────────────────────────────────

describe('POST /collections/:id/import/csv', () => {
  const IDENTITY_MAPPING = JSON.stringify({
    title: 'title',
    gcCode: 'gcCode',
    difficulty: 'difficulty',
    terrain: 'terrain',
    coords: 'coords',
    hint: 'hint',
  });

  it('imports puzzles from a valid CSV and returns 201', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/csv`,
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(
        [
          { name: 'file', value: FIXTURE_CSV, filename: 'sample.csv' },
          { name: 'mapping', value: IDENTITY_MAPPING },
        ],
        boundary,
      ),
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().created).toBe(3);

    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles).toHaveLength(3);
    expect(puzzles[0].title).toBe('Mystery Cache 1');
    expect(puzzles[0].gcCode).toBe('GC12345');
    expect(puzzles[0].difficulty).toBe(2);
    expect(puzzles[0].terrain).toBe(1.5);
    expect(puzzles[0].coords).toBe('48.850293-2.349241');
    expect(puzzles[0].hint).toBe('Under the bridge');
    expect(puzzles[2].title).toBe('Plain Puzzle');
    expect(puzzles[2].gcCode).toBeNull();
  });

  it('returns 400 when mapping has no title field', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/csv`,
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(
        [
          { name: 'file', value: FIXTURE_CSV, filename: 'sample.csv' },
          { name: 'mapping', value: JSON.stringify({ gcCode: 'gcCode' }) },
        ],
        boundary,
      ),
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 for a non-owner', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/csv`,
      headers: {
        authorization: `Bearer ${otherToken}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: makeMultipartBody(
        [
          { name: 'file', value: FIXTURE_CSV, filename: 'sample.csv' },
          { name: 'mapping', value: IDENTITY_MAPPING },
        ],
        boundary,
      ),
    });

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 without token', async () => {
    const collectionId = await createCollection(userToken);
    const boundary = 'testboundary';

    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/import/csv`,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: makeMultipartBody(
        [
          { name: 'file', value: FIXTURE_CSV, filename: 'sample.csv' },
          { name: 'mapping', value: IDENTITY_MAPPING },
        ],
        boundary,
      ),
    });

    expect(res.statusCode).toBe(401);
  });
});
