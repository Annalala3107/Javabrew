import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

mkdirSync('api', { recursive: true });

const SHARED_OPTIONS = {
  bundle: true,
  treeShaking: true,
  minify: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  external: ['@vercel/functions', '@vercel/oidc'],
};

await Promise.all([
  build({
    ...SHARED_OPTIONS,
    entryPoints: ['server/java-run.ts'],
    outfile: 'api/java-run.mjs',
    banner: {
      js: '// Auto-generated from server/java-run.ts via scripts/build-api.mjs\nimport { createRequire as __jbReq } from "node:module"; const require = __jbReq(import.meta.url);',
    },
  }),
  build({
    ...SHARED_OPTIONS,
    entryPoints: ['server/ai-mentor.ts'],
    outfile: 'api/ai-mentor.mjs',
    banner: {
      js: '// Auto-generated from server/ai-mentor.ts via scripts/build-api.mjs\nimport { createRequire as __jbReq } from "node:module"; const require = __jbReq(import.meta.url);',
    },
  }),
]);

console.log('Built api/java-run.mjs and api/ai-mentor.mjs (tree-shaken native ESM)');
