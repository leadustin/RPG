import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    include: ['react-rnd', 'clsx'],
  },

  server: {
    port: 3000,
  },

  css: {
    devSourcemap: true,
  },

  build: {
    minify: false,
    cssMinify: false,
    sourcemap: true,
  },
});
