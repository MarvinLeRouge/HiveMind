import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Local runs only: CI sets its variables in the workflow, and existing variables are never overridden
const localEnvFile = fileURLToPath(new URL('.env.test', import.meta.url));
if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
    globalSetup: ['./tests/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // Bootstrap entry point (only starts the server, covered via buildApp) and the generated Prisma client
      exclude: ['src/index.ts', 'src/generated/**'],
    },
  },
});
