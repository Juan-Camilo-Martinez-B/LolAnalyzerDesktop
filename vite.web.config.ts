import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Website build: only the landing page with the download button.
 * The desktop build (vite.config.ts) never includes it, so the app
 * itself never shows a download prompt.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, 'web'),
  publicDir: resolve(import.meta.dirname, 'public'),
  plugins: [react()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist-web'),
    emptyOutDir: true,
  },
});
