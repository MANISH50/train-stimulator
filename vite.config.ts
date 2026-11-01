import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages serves the site from /train-stimulator/; the deploy workflow sets PAGES_BASE.
  base: process.env.PAGES_BASE ?? '/',
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
