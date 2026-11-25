import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

mkdirSync('api', { recursive: true });

await build({
  entryPoints: ['server/java-run.ts'],
  outfile: 'api/java-run.mjs',
  bundle: true,
  treeShaking: true,
  minify: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  external: ['@vercel/functions', '@vercel/oidc'],
  banner: {
    js: '// Auto-generated from server/java-run.ts via scripts/build-api.mjs\nimport { createRequire as __jbReq } from "node:module"; const require = __jbReq(import.meta.url);',
  },
});

console.log('Built api/java-run.mjs (tree-shaken native ESM)');
