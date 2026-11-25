import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

mkdirSync('api', { recursive: true });

await build({
  entryPoints: ['server/java-run.ts'],
  outfile: 'api/java-run.mjs',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  packages: 'external',
  banner: {
    js: '// Auto-generated from server/java-run.ts via scripts/build-api.mjs',
  },
});

console.log('Built api/java-run.mjs (native ESM)');
