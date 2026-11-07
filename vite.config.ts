import { readFileSync } from 'fs';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Cloud API of the release build, from package.json "config.cloudApiUrl" (one source for Vite and Electron). */
function releaseCloudUrl(): string {
  const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8')) as { config?: { cloudApiUrl?: string } };
  return pkg.config?.cloudApiUrl ?? '';
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: mode === 'desktop' && releaseCloudUrl()
    ? { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(releaseCloudUrl()) }
    : {},
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        desktop: resolve(import.meta.dirname, 'index.html'),
        overlay: resolve(import.meta.dirname, 'overlay.html'),
        background: resolve(import.meta.dirname, 'background.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts', 'electron/**/*.test.ts'],
  },
}));
