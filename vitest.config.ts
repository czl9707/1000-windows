import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Throwaway worktrees under .claude/ are not part of this tree's test suite.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
});
