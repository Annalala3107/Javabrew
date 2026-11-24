import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';

const MIME_TYPES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function createStaticMountHandler(rootDir: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url) return next();
    const pathname = decodeURIComponent(req.url.split('?')[0]);

    let subPath: string | null = null;
    if (pathname.startsWith('/content/')) {
      subPath = pathname.slice(1);
    } else if (pathname === '/metadata/navigation.json' || pathname === '/metadata/pro192.json') {
      subPath = pathname.slice(1);
    }

    if (!subPath) return next();

    const resolved = path.resolve(rootDir, subPath);
    // Prevent directory traversal outside content/ or metadata/
    const allowedContent = path.resolve(rootDir, 'content') + path.sep;
    const allowedMeta = path.resolve(rootDir, 'metadata') + path.sep;
    if (!resolved.startsWith(allowedContent) && !resolved.startsWith(allowedMeta)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(fs.readFileSync(resolved));
  };
}

export function javabrewContentPlugin(): Plugin {
  let rootDir = process.cwd();
  let outDir = 'dist';

  return {
    name: 'vite-plugin-javabrew-content',
    configResolved(config) {
      rootDir = config.root;
      outDir = config.build.outDir;
    },
    configureServer(server) {
      server.middlewares.use(createStaticMountHandler(rootDir));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createStaticMountHandler(rootDir));
    },
    async closeBundle() {
      const targetOut = path.resolve(rootDir, outDir);
      if (!fs.existsSync(targetOut)) return;

      for (const lang of ['en', 'vi']) {
        const src = path.join(rootDir, 'content', lang);
        const dest = path.join(targetOut, 'content', lang);
        if (fs.existsSync(src)) {
          await fsp.cp(src, dest, { recursive: true });
        }
      }

      const metaDest = path.join(targetOut, 'metadata');
      await fsp.mkdir(metaDest, { recursive: true });
      for (const file of ['navigation.json', 'pro192.json']) {
        const src = path.join(rootDir, 'metadata', file);
        if (fs.existsSync(src)) {
          await fsp.copyFile(src, path.join(metaDest, file));
        }
      }
    },
  };
}
