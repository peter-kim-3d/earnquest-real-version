import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Environment for testing
    environment: 'jsdom',

    // Setup files to run before each test file
    setupFiles: ['./vitest.setup.ts'],

    // Include patterns for test files
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.next', 'supabase'],

    // Global test utilities (optional)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['lib/**/*.ts', 'lib/**/*.tsx'],
      exclude: [
        'lib/**/*.d.ts',
        'lib/**/types.ts',
        'lib/**/types/**',
        'lib/supabase/**',
        'lib/services/**',
      ],
    },

    // Timeout for tests
    testTimeout: 10000,

    // Reporter
    reporters: ['default'],
  },
});
