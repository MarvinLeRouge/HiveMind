import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createPrismaClient } from '../../src/lib/prisma-client.js';
import { buildApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';

// Mutable copy of the validated env, so each test can tune NODE_ENV or SMTP settings
vi.mock('../../src/config/env.js', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../../src/config/env.js')>();
  return { env: { ...original.env } };
});

const prisma = createPrismaClient();
const originalEnv = { ...env };
const EMAIL = 'default-mailer@example.com';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
  Object.assign(env, originalEnv);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.$disconnect();
});

describe('buildApp', () => {
  it('uses the SMTP mailer when no mailer is injected', async () => {
    env.SMTP_HOST = undefined;
    app = await buildApp();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        username: 'default-mailer',
        email: EMAIL,
        password: 'Password123!',
      },
    });

    expect(res.statusCode).toBe(502);
    expect(res.json().message).toContain('Email service is not configured');
  });

  it('serves Swagger UI outside production', async () => {
    app = await buildApp();

    const res = await app.inject({ method: 'GET', url: '/docs' });

    expect(res.statusCode).not.toBe(404);
  });

  it('does not expose Swagger UI in production', async () => {
    env.NODE_ENV = 'production';
    app = await buildApp();

    const res = await app.inject({ method: 'GET', url: '/docs' });

    expect(res.statusCode).toBe(404);
  });
});
