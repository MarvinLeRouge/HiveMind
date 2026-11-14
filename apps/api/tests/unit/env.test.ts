import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function loadEnv(): Promise<typeof import('../../src/config/env.js')> {
  vi.resetModules();
  return import('../../src/config/env.js');
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${String(code)})`);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('env validation', () => {
  it('exposes parsed values with defaults when the environment is valid', async () => {
    vi.stubEnv('PORT', undefined);
    vi.stubEnv('SMTP_SECURE', 'true');

    const { env } = await loadEnv();

    expect(env.PORT).toBe(3000);
    expect(env.SMTP_SECURE).toBe(true);
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('exits with code 1 and names each invalid variable', async () => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'too-short');
    vi.stubEnv('CORS_ORIGIN', 'not-a-url');

    await expect(loadEnv()).rejects.toThrow('process.exit(1)');

    const messages = vi
      .mocked(console.error)
      .mock.calls.map((call) => String(call[0]));
    expect(messages).toContainEqual(
      expect.stringContaining(
        'JWT_ACCESS_SECRET: JWT_ACCESS_SECRET must be at least 32 characters',
      ),
    );
    expect(messages).toContainEqual(
      expect.stringContaining('CORS_ORIGIN: CORS_ORIGIN must be a valid URL'),
    );
  });
});
