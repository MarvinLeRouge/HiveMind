import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
});

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.attempt.deleteMany();
  await prisma.note.deleteMany();
  await prisma.puzzle.deleteMany();
  await prisma.collectionMember.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany({ where: { isAdmin: false } });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function registerUser(
  overrides: Partial<{
    username: string;
    email: string;
    password: string;
  }> = {},
) {
  return app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      ...overrides,
    },
  });
}

async function loginUser(
  email = 'test@example.com',
  password = 'Password123!',
) {
  return app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });
}

// ── POST /auth/register ───────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('returns 201 with accessToken and user on success', async () => {
    const res = await registerUser();
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.email).toBe('test@example.com');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('sets httpOnly refreshToken cookie', async () => {
    const res = await registerUser();
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookie).toContain('refreshToken=');
    expect(cookie).toContain('HttpOnly');
  });

  it('returns 409 if email is already registered', async () => {
    await registerUser();
    const res = await registerUser();
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBeTruthy();
  });

  it('returns 400 for invalid body (missing fields)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'bad' },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('returns 200 with accessToken and user on valid credentials', async () => {
    const res = await loginUser();
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.email).toBe('test@example.com');
  });

  it('sets httpOnly refreshToken cookie on login', async () => {
    const res = await loginUser();
    const setCookie = res.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookie).toContain('refreshToken=');
    expect(cookie).toContain('HttpOnly');
  });

  it('returns 401 for unknown email', async () => {
    const res = await loginUser('ghost@example.com');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    const res = await loginUser('test@example.com', 'wrongpassword');
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('returns 200 with a new accessToken when cookie is valid', async () => {
    const loginRes = await registerUser();
    const setCookie = loginRes.headers['set-cookie'];
    const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const cookieHeader = rawCookie?.split(';')[0] ?? '';

    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: cookieHeader },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeTruthy();
  });

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/refresh' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for an invalid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: 'refreshToken=this.is.garbage' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('returns 204 and clears the refresh cookie', async () => {
    await registerUser();
    const loginRes = await loginUser();
    const token = loginRes.json().accessToken as string;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
    const setCookie = res.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookie).toContain('refreshToken=;');
  });

  it('returns 401 without a valid access token', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  it('returns the current user profile', async () => {
    await registerUser();
    const loginRes = await loginUser();
    const token = loginRes.json().accessToken as string;

    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.email).toBe('test@example.com');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    expect(res.statusCode).toBe(401);
  });
});
