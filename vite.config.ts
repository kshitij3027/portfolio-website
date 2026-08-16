import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  server: {
    port: 5180,
    strictPort: true,
  },
});
