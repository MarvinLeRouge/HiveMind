import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { NoopMailerService } from '../../src/services/mailer.service.js';

describe('security headers', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ mailer: new NoopMailerService() });
    await app.ready();
  });

  afterAll(() => app.close());

  it('sends a CSP without upgrade-insecure-requests', async () => {
    // helmet also sets headers on 404 responses, so no route or DB access is needed
    const res = await app.inject({
      method: 'GET',
      url: '/security-headers-probe',
    });
    const csp = res.headers['content-security-policy'];

    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});
