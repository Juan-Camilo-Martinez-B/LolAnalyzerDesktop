import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        desktop: resolve(__dirname, 'index.html'),
        overlay: resolve(__dirname, 'overlay.html'),
        background: resolve(__dirname, 'background.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    cors: true,
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
