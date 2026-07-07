import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Minimal integration test confirming @fastify/rate-limit returns 429 when
 * the per-route limit is exceeded. Uses an isolated Fastify instance to avoid
 * the elevated test limit applied in buildApp (NODE_ENV=test).
 */
describe('rate limiting', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(rateLimit, { max: 100, timeWindow: 60000 });
    app.post('/auth/login', {
      config: { rateLimit: { max: 2, timeWindow: 60000 } },
      handler: async () => 'ok',
    });
    await app.ready();
  });

  afterAll(() => app.close());

  it('returns 429 after exceeding the per-route limit', async () => {
    const first = await app.inject({ method: 'POST', url: '/auth/login' });
    expect(first.statusCode).not.toBe(429);

    const second = await app.inject({ method: 'POST', url: '/auth/login' });
    expect(second.statusCode).not.toBe(429);

    const third = await app.inject({ method: 'POST', url: '/auth/login' });
    expect(third.statusCode).toBe(429);
  });
});
