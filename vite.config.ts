/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'creeaza/index.html'),
        viewer: resolve(__dirname, 'i/index.html'),
      },
    },
  },
  test: { environment: 'jsdom' },
});
