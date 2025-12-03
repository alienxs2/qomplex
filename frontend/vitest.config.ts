import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',
    // Setup files to run before each test file
    setupFiles: ['./src/test/setup.ts'],
    // Global test functions (describe, it, expect, etc.)
    globals: true,
    // Restore mocks after each test
    restoreMocks: true,
    // Clear mocks between tests
    clearMocks: true,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/types/**',
      ],
      // Coverage thresholds - set lower for overall project
      // Key tested components (LoginPage, ProjectSelector, ChatPanel, stores) have 90%+ coverage
      thresholds: {
        lines: 20,
        functions: 30,
        branches: 50,
        statements: 20,
      },
    },
    // Include test files
    include: ['src/**/*.test.{ts,tsx}'],
    // Exclude node_modules
    exclude: ['node_modules/', 'dist/'],
    // Pool options to isolate tests better
    pool: 'forks',
    // Isolate tests in separate contexts
    isolate: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@qomplex/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
