/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { javabrewContentPlugin } from './vite-plugin-javabrew';

export default defineConfig({
  plugins: [react(), tailwindcss(), javabrewContentPlugin()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, '/');
          if (!norm.includes('/node_modules/')) return undefined;
          if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(norm)) {
            return 'react-vendor';
          }
          if (/\/node_modules\/(@codemirror|@lezer)\//.test(norm)) {
            return 'codemirror-vendor';
          }
          if (/\/node_modules\/(lowlight|highlight\.js)\//.test(norm)) {
            return 'highlight-vendor';
          }
          if (
            /\/node_modules\/(react-markdown|remark-|rehype-|unified|mdast-|hast-|micromark|js-yaml)\//.test(
              norm
            )
          ) {
            return 'markdown-vendor';
          }
          if (/\/node_modules\/(gsap|@gsap)\//.test(norm)) {
            return 'motion-vendor';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
