import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Same alias tsconfig hands the site: @/ is src/.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Throwaway worktrees under .claude/ and the gitignored scratch/ are
    // not part of this tree's test suite.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**', 'scratch/**'],
  },
});
