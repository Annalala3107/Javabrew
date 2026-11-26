import fs from 'node:fs';
import fsp from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { loadEnv, type Connect, type Plugin, type ViteDevServer } from 'vite';

const SERVER_ENV_KEYS = [
  'GEMINI_API_KEY',
  'GEMINI_DEFAULT_MODEL',
  'AI_DAILY_LIMIT',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ALLOWED_ORIGINS',
  'JAVA_RUNNER_URL',
  'JAVA_RUNNER_PROVIDER',
  'JAVA_RUNNER_API_KEY',
  'JUDGE0_JAVA_LANGUAGE_ID',
  'VERCEL_OIDC_TOKEN',
  'VERCEL_TOKEN',
  'VERCEL_PROJECT_ID',
  'VERCEL_TEAM_ID',
] as const;

const MAX_DEV_BODY_BYTES = 262_144; // 256 KB

const MIME_TYPES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function readNodeRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_DEV_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function toWebRequest(
  req: IncomingMessage,
  res: ServerResponse,
  pathnameWithQuery: string
): Promise<Request> {
  const method = (req.method || 'GET').toUpperCase();
  const host = req.headers.host || 'localhost:5173';
  const url = `http://${host}${pathnameWithQuery}`;
  const headers = new Headers();

  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      headers.set(k, v.join(', '));
    } else {
      headers.set(k, v);
    }
  }

  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  if (method === 'GET' || method === 'HEAD') {
    return new Request(url, { method, headers, signal: abortController.signal });
  }

  const bodyBuf = await readNodeRequestBody(req);
  return new Request(url, {
    method,
    headers,
    body: bodyBuf.length > 0 ? new Uint8Array(bodyBuf) : undefined,
    signal: abortController.signal,
  });
}

async function sendWebResponse(webRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.flushHeaders?.();

  if (!webRes.body) {
    res.end();
    return;
  }

  const reader = webRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (res.writableEnded || res.destroyed) {
        await reader.cancel().catch(() => {});
        break;
      }
      if (value && value.length > 0) {
        res.write(Buffer.from(value));
      }
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
}

function createApiDevMiddleware(server: ViteDevServer): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url) return next();
    const pathname = req.url.split('?')[0];
    if (pathname !== '/api/ai-mentor' && pathname !== '/api/java-run') {
      return next();
    }

    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    void (async () => {
      try {
        const webReq = await toWebRequest(req, res, req.url || pathname);
        let webRes: Response;

        if (pathname === '/api/ai-mentor') {
          const mod = (await server.ssrLoadModule('/server/ai-mentor.ts')) as {
            GET: (r: Request) => Promise<Response>;
            POST: (r: Request) => Promise<Response>;
          };
          webRes = method === 'GET' ? await mod.GET(webReq) : await mod.POST(webReq);
        } else {
          const hasCloudOrExternal = Boolean(
            process.env.JAVA_RUNNER_URL?.trim() ||
              process.env.VERCEL_OIDC_TOKEN?.trim() ||
              (process.env.VERCEL_TOKEN &&
                process.env.VERCEL_PROJECT_ID &&
                process.env.VERCEL_TEAM_ID)
          );

          if (!hasCloudOrExternal) {
            const localMod = (await server.ssrLoadModule('/server/localJdkRunner.ts')) as {
              detectLocalJdk: () => { available: boolean; version: string };
              executeLocalJdkRequest: (r: Request) => Promise<Response>;
            };
            const localJdk = localMod.detectLocalJdk();
            if (localJdk.available) {
              if (method === 'GET') {
                webRes = Response.json(
                  {
                    available: true,
                    runtime: `Local ${localJdk.version}`,
                    region: 'local-dev',
                    nodeVersion: process.version,
                  },
                  { status: 200, headers: { 'Cache-Control': 'no-store' } }
                );
              } else {
                webRes = await localMod.executeLocalJdkRequest(webReq);
              }
              await sendWebResponse(webRes, res);
              return;
            }
          }

          const javaMod = (await server.ssrLoadModule('/server/java-run.ts')) as {
            GET: (r: Request) => Promise<Response>;
            POST: (r: Request) => Promise<Response>;
          };
          webRes = method === 'GET' ? await javaMod.GET(webReq) : await javaMod.POST(webReq);
        }

        await sendWebResponse(webRes, res);
      } catch (err) {
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Local API middleware error',
            })
          );
        }
      }
    })();
  };
}

function createStaticMountHandler(rootDir: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url) return next();
    let pathname: string;
    try {
      pathname = decodeURIComponent(req.url.split('?')[0]);
    } catch {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

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
      const loaded = loadEnv(config.mode, rootDir, '');
      for (const key of SERVER_ENV_KEYS) {
        if (process.env[key] === undefined && loaded[key] !== undefined && loaded[key] !== '') {
          process.env[key] = loaded[key];
        }
      }
    },
    configureServer(server) {
      server.middlewares.use(createApiDevMiddleware(server));
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
