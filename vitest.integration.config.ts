import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    // test.env is propagated to forked worker processes; process.env mutations are not.
    // CI overrides these by setting the vars before invoking the test command.
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://growpath:growpath@localhost:5432/growpath',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Run all integration tests in a single worker so DB state is predictable
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
