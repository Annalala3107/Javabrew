export interface RateLimitOptions {
  namespace: string;
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  backend: 'redis' | 'memory';
}

const REDIS_TIMEOUT_MS = 2_000;
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export function resetMemoryRateLimitsForTest(): void {
  memoryBuckets.clear();
}

export function getUtcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getTrustedClientIp(request: Request): string {
  const vercelFwd = request.headers.get('x-vercel-forwarded-for');
  if (vercelFwd) {
    const first = vercelFwd.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'anonymous';
}

function isDevLocalhostOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}

export function validateOrigin(
  request: Request
): { ok: true } | { ok: false; reason: string } {
  const secFetchSite = request.headers.get('sec-fetch-site')?.trim().toLowerCase();
  if (secFetchSite === 'cross-site') {
    return { ok: false, reason: 'Cross-site request rejected.' };
  }

  const allowedOrigins = new Set<string>();
  try {
    allowedOrigins.add(new URL(request.url).origin);
  } catch {
    // ignore malformed request.url
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const hostHeader = forwardedHost || request.headers.get('host')?.trim();
  if (hostHeader && /^[A-Za-z0-9.:-]+$/.test(hostHeader)) {
    allowedOrigins.add(`https://${hostHeader}`);
    allowedOrigins.add(`http://${hostHeader}`);
  }

  const extraRaw = process.env.ALLOWED_ORIGINS;
  if (extraRaw) {
    for (const entry of extraRaw.split(',')) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      try {
        allowedOrigins.add(new URL(trimmed).origin);
      } catch {
        // ignore invalid configured origin
      }
    }
  }

  const isProd = process.env.VERCEL_ENV === 'production';
  const originHeader = request.headers.get('origin')?.trim();

  if (originHeader) {
    let normalizedOrigin: string;
    try {
      normalizedOrigin = new URL(originHeader).origin;
    } catch {
      return { ok: false, reason: 'Nguồn truy cập (Origin) không được phép.' };
    }
    const allowed =
      allowedOrigins.has(normalizedOrigin) ||
      (!isProd && isDevLocalhostOrigin(normalizedOrigin));
    if (!allowed) {
      return { ok: false, reason: 'Nguồn truy cập (Origin) không được phép.' };
    }
  } else if (request.method.toUpperCase() === 'POST' && isProd) {
    return { ok: false, reason: 'Thiếu header Origin hợp lệ.' };
  }

  return { ok: true };
}

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/+$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function callUpstashPipeline(
  config: { url: string; token: string },
  commands: Array<Array<string | number>>
): Promise<Array<{ result?: unknown; error?: string }>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REDIS_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Redis HTTP ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error('Unexpected Redis pipeline response');
    }
    return data as Array<{ result?: unknown; error?: string }>;
  } finally {
    clearTimeout(timer);
  }
}

function pruneExpiredMemoryBuckets(now: number): void {
  if (memoryBuckets.size <= 500) return;
  for (const [k, bucket] of memoryBuckets.entries()) {
    if (bucket.resetAt <= now) {
      memoryBuckets.delete(k);
    }
  }
}

function consumeMemoryRateLimit(
  bucketKey: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  pruneExpiredMemoryBuckets(now);

  const existing = memoryBuckets.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryBuckets.set(bucketKey, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      limit,
      resetAt,
      backend: 'memory',
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: existing.resetAt,
      backend: 'memory',
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    limit,
    resetAt: existing.resetAt,
    backend: 'memory',
  };
}

function peekMemoryRateLimit(
  bucketKey: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    return {
      allowed: limit > 0,
      remaining: Math.max(0, limit),
      limit,
      resetAt: now + windowSeconds * 1000,
      backend: 'memory',
    };
  }
  const remaining = Math.max(0, limit - existing.count);
  return {
    allowed: existing.count < limit,
    remaining,
    limit,
    resetAt: existing.resetAt,
    backend: 'memory',
  };
}

export async function consumeRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const bucketKey = `jb:rl:${opts.namespace}:${opts.key}`;
  const redis = getRedisConfig();
  if (redis) {
    try {
      const results = await callUpstashPipeline(redis, [
        ['INCR', bucketKey],
        ['EXPIRE', bucketKey, opts.windowSeconds, 'NX'],
        ['TTL', bucketKey],
      ]);
      const count = Number(results[0]?.result);
      const rawTtl = Number(results[2]?.result);
      if (Number.isFinite(count)) {
        const ttlSec = Number.isFinite(rawTtl) && rawTtl > 0 ? rawTtl : opts.windowSeconds;
        const remaining = Math.max(0, opts.limit - count);
        return {
          allowed: count <= opts.limit,
          remaining,
          limit: opts.limit,
          resetAt: Date.now() + ttlSec * 1000,
          backend: 'redis',
        };
      }
    } catch (err) {
      console.warn(
        '[requestGuard] Upstash Redis rate-limit fallback to memory:',
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  return consumeMemoryRateLimit(bucketKey, opts.limit, opts.windowSeconds);
}

export async function peekRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const bucketKey = `jb:rl:${opts.namespace}:${opts.key}`;
  const redis = getRedisConfig();
  if (redis) {
    try {
      const results = await callUpstashPipeline(redis, [
        ['GET', bucketKey],
        ['TTL', bucketKey],
      ]);
      const rawCount = results[0]?.result;
      const count = rawCount === null || rawCount === undefined ? 0 : Number(rawCount);
      const rawTtl = Number(results[1]?.result);
      if (Number.isFinite(count)) {
        const ttlSec = Number.isFinite(rawTtl) && rawTtl > 0 ? rawTtl : opts.windowSeconds;
        return {
          allowed: count < opts.limit,
          remaining: Math.max(0, opts.limit - count),
          limit: opts.limit,
          resetAt: Date.now() + ttlSec * 1000,
          backend: 'redis',
        };
      }
    } catch (err) {
      console.warn(
        '[requestGuard] Upstash Redis peek fallback to memory:',
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  return peekMemoryRateLimit(bucketKey, opts.limit, opts.windowSeconds);
}
