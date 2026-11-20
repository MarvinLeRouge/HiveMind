import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer reads .env: load the local file when there is one (dev, tests);
// CI and containers pass DATABASE_URL through the environment
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Optional on purpose: `prisma generate` (image build, CI lint) needs no database,
  // migrate and seed still fail with a clear error when it is missing
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
