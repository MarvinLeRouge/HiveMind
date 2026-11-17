import { execSync } from 'node:child_process';

/**
 * Throws unless the database URL targets a dedicated test database
 * (name ending with `_test`). CI is exempt: its database is a throwaway service.
 */
export function assertTestDatabase(
  url: string | undefined,
  isCi: boolean,
): void {
  if (isCi) return;
  const name = url ? new URL(url).pathname.slice(1) : '';
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against "${name || 'no database'}": ` +
        'set DATABASE_URL_TEST to a database whose name ends with "_test" ' +
        '(see apps/api/.env.test.example).',
    );
  }
}

/**
 * Redirects DATABASE_URL to the isolated test database when DATABASE_URL_TEST is set,
 * then applies migrations and seed to it. Outside CI, only `_test` databases are accepted.
 */
export function setup(): void {
  const testUrl = process.env['DATABASE_URL_TEST'];
  if (testUrl) process.env['DATABASE_URL'] = testUrl;

  assertTestDatabase(process.env['DATABASE_URL'], !!process.env['CI']);
  if (!testUrl) return;

  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  execSync('npx prisma db seed', { stdio: 'inherit' });
}
