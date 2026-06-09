import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 15000,
    pool: 'forks',         // isolate each test file — no shared module state
    reporters: ['verbose'],
  },
});
