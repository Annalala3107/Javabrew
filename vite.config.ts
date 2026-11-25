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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-slug', 'js-yaml'],
          'highlight-vendor': ['rehype-highlight', 'highlight.js'],
          'motion-vendor': ['gsap', '@gsap/react'],
          'codemirror-vendor': [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/language',
            '@codemirror/commands',
            '@codemirror/autocomplete',
            '@codemirror/lang-java',
            '@codemirror/lint',
            '@lezer/highlight',
          ],
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
