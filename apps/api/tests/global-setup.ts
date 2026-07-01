import { execSync } from 'node:child_process';

/** Redirects DATABASE_URL to the isolated test database when DATABASE_URL_TEST is set. */
export function setup(): void {
  const testUrl = process.env['DATABASE_URL_TEST'];
  if (!testUrl) return;

  process.env['DATABASE_URL'] = testUrl;
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}
