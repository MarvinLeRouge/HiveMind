import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { NoopMailerService } from '../../src/services/mailer.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
});

let app: FastifyInstance;
let mailer: NoopMailerService;

beforeAll(async () => {
  mailer = new NoopMailerService();
  app = await buildApp({ mailer });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.verificationToken.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.note.deleteMany();
  await prisma.puzzle.deleteMany();
  await prisma.collectionMember.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.refreshToken.deleteMany();
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

/** Registers a user and verifies their email so they can log in. */
async function registerAndVerify(
  overrides: Partial<{
    username: string;
    email: string;
    password: string;
  }> = {},
) {
  await registerUser(overrides);
  const token = mailer.lastVerificationToken!;
  await app.inject({
    method: 'POST',
    url: '/auth/verify-email',
    payload: { token },
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
  it('returns 201 with a message and user (no access token)', async () => {
    const res = await registerUser();
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.message).toBeTruthy();
    expect(body.user.email).toBe('test@example.com');
    expect(body).not.toHaveProperty('accessToken');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('sends a verification email via the mailer', async () => {
    await registerUser();
    expect(mailer.lastVerificationToken).toBeTruthy();
  });

  it('does not set a refresh cookie', async () => {
    const res = await registerUser();
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeUndefined();
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

// ── POST /auth/verify-email ───────────────────────────────────────────────────

describe('POST /auth/verify-email', () => {
  it('returns 200 and verifies the user when the token is valid', async () => {
    await registerUser();
    const token = mailer.lastVerificationToken!;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBeTruthy();
  });

  it('allows the user to log in after verification', async () => {
    await registerAndVerify();
    const res = await loginUser();
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeTruthy();
  });

  it('returns 400 for an invalid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token: 'totally-invalid-token' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if the token is used a second time', async () => {
    await registerUser();
    const token = mailer.lastVerificationToken!;

    await app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('returns 403 if the user email is not verified', async () => {
    await registerUser();
    const res = await loginUser();
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with accessToken after email is verified', async () => {
    await registerAndVerify();
    const res = await loginUser();
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.email).toBe('test@example.com');
  });

  it('sets httpOnly refreshToken cookie on login', async () => {
    await registerAndVerify();
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
    await registerAndVerify();
    const res = await loginUser('test@example.com', 'wrongpassword');
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('returns 200 with a new accessToken when cookie is valid', async () => {
    await registerAndVerify();
    const loginRes = await loginUser();
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

  it('returns 401 after the refresh token has been used (rotation)', async () => {
    await registerAndVerify();
    const loginRes = await loginUser();
    const setCookie = loginRes.headers['set-cookie'];
    const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const cookieHeader = rawCookie?.split(';')[0] ?? '';

    // Use the refresh token once — it gets rotated
    await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: cookieHeader },
    });

    // Trying to use the same old token should fail
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: cookieHeader },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('returns 204 and clears the refresh cookie', async () => {
    await registerAndVerify();
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

  it('invalidates the refresh token after logout', async () => {
    await registerAndVerify();
    const loginRes = await loginUser();
    const setCookie = loginRes.headers['set-cookie'];
    const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const cookieHeader = rawCookie?.split(';')[0] ?? '';
    const accessToken = loginRes.json().accessToken as string;

    // Logout
    await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: cookieHeader,
      },
    });

    // Refresh should now be rejected
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: cookieHeader },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 without a valid access token', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  it('returns the current user profile', async () => {
    await registerAndVerify();
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
    expect(body.language).toBe('en');
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

// ── PATCH /auth/me ────────────────────────────────────────────────────────────

describe('PATCH /auth/me', () => {
  it('updates the user language and returns the updated profile', async () => {
    await registerAndVerify();
    const loginRes = await loginUser();
    const token = loginRes.json().accessToken as string;

    const res = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { language: 'fr' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.language).toBe('fr');
    expect(body.email).toBe('test@example.com');
  });

  it('returns 400 for an unsupported language code', async () => {
    await registerAndVerify();
    const loginRes = await loginUser();
    const token = loginRes.json().accessToken as string;

    const res = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { language: 'de' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      payload: { language: 'fr' },
    });
    expect(res.statusCode).toBe(401);
  });
});
