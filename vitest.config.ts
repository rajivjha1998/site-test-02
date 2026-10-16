import { fileURLToPath } from 'node:url';
import { getViteConfig } from 'astro/config';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// Uses the website's Astro config so `astro/zod` and `astro:*` modules resolve in tests.
export default getViteConfig(
  {
    test: {
      dir: repoRoot,
      include: ['packages/**/src/**/*.test.ts', 'apps/**/src/**/*.test.ts', 'scripts/**/*.test.ts'],
      exclude: ['**/tests/e2e/**', '**/node_modules/**'],
    },
  },
  { root: './apps/website' },
);
