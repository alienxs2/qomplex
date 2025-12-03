import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
    // Timeout for async tests
    testTimeout: 10000,
    // Ensure mocks are reset between tests
    clearMocks: true,
    mockReset: false,  // Don't reset mock implementations
    restoreMocks: false,  // Keep mock implementations between tests
  },
  resolve: {
    alias: {
      '@qomplex/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});
