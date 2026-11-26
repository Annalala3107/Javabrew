// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumeRateLimit,
  getTrustedClientIp,
  peekRateLimit,
  resetMemoryRateLimitsForTest,
  validateOrigin,
} from '../../server/requestGuard';

const ENV_KEYS = [
  'VERCEL_ENV',
  'ALLOWED_ORIGINS',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

describe('server/requestGuard', () => {
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    resetMemoryRateLimitsForTest();
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    vi.stubGlobal('fetch', origFetch);
    vi.restoreAllMocks();
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  it('prioritizes x-vercel-forwarded-for > x-real-ip > x-forwarded-for > anonymous', () => {
    const req1 = new Request('https://javabrew.test/api/ai-mentor', {
      headers: {
        'x-vercel-forwarded-for': '203.0.113.10, 10.0.0.1',
        'x-real-ip': '198.51.100.2',
        'x-forwarded-for': '192.0.2.3',
      },
    });
    expect(getTrustedClientIp(req1)).toBe('203.0.113.10');

    const req2 = new Request('https://javabrew.test/api/ai-mentor', {
      headers: { 'x-real-ip': '198.51.100.2', 'x-forwarded-for': '192.0.2.3' },
    });
    expect(getTrustedClientIp(req2)).toBe('198.51.100.2');

    const req3 = new Request('https://javabrew.test/api/ai-mentor', {
      headers: { 'x-forwarded-for': '192.0.2.3, 192.0.2.4' },
    });
    expect(getTrustedClientIp(req3)).toBe('192.0.2.3');

    const req4 = new Request('https://javabrew.test/api/ai-mentor');
    expect(getTrustedClientIp(req4)).toBe('anonymous');
  });

  it('validates Origin and Sec-Fetch-Site in dev vs production', () => {
    const crossSite = new Request('https://javabrew.test/api/ai-mentor', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'cross-site', origin: 'https://javabrew.test' },
    });
    expect(validateOrigin(crossSite).ok).toBe(false);

    const evilOrigin = new Request('https://javabrew.test/api/ai-mentor', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    });
    expect(validateOrigin(evilOrigin).ok).toBe(false);

    const sameOrigin = new Request('https://javabrew.test/api/ai-mentor', {
      method: 'POST',
      headers: { origin: 'https://javabrew.test' },
    });
    expect(validateOrigin(sameOrigin).ok).toBe(true);

    process.env.ALLOWED_ORIGINS = 'https://study.example.edu';
    const allowedExtra = new Request('https://javabrew.test/api/ai-mentor', {
      method: 'POST',
      headers: { origin: 'https://study.example.edu' },
    });
    expect(validateOrigin(allowedExtra).ok).toBe(true);

    // Local dev allows localhost even on different port
    const devLocal = new Request('https://javabrew.test/api/ai-mentor', {
      method: 'POST',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(validateOrigin(devLocal).ok).toBe(true);

    // Production requires Origin on POST
    process.env.VERCEL_ENV = 'production';
    const prodNoOrigin = new Request('https://javabrew.test/api/ai-mentor', { method: 'POST' });
    expect(validateOrigin(prodNoOrigin).ok).toBe(false);
  });

  it('tracks memory rate limits accurately without peek mutating remaining count', async () => {
    const opts = { namespace: 'test', key: 'ip-1', limit: 3, windowSeconds: 60 };
    const p0 = await peekRateLimit(opts);
    expect(p0.remaining).toBe(3);
    expect(p0.allowed).toBe(true);

    const c1 = await consumeRateLimit(opts);
    expect(c1.allowed).toBe(true);
    expect(c1.remaining).toBe(2);
    expect(c1.backend).toBe('memory');

    const p1 = await peekRateLimit(opts);
    expect(p1.remaining).toBe(2);

    const c2 = await consumeRateLimit(opts);
    const c3 = await consumeRateLimit(opts);
    expect(c2.allowed).toBe(true);
    expect(c3.allowed).toBe(true);
    expect(c3.remaining).toBe(0);

    const c4 = await consumeRateLimit(opts);
    expect(c4.allowed).toBe(false);
    expect(c4.remaining).toBe(0);
  });

  it('uses Upstash Redis REST pipeline when configured and falls back cleanly on Redis error', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'secret-token';

    let capturedBody = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = String(init?.body || '');
        return new Response(
          JSON.stringify([{ result: 2 }, { result: 1 }, { result: 3600 }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    const redisRes = await consumeRateLimit({
      namespace: 'ai-daily:2026-11-26',
      key: '198.51.100.1',
      limit: 30,
      windowSeconds: 86_400,
    });
    expect(redisRes.backend).toBe('redis');
    expect(redisRes.allowed).toBe(true);
    expect(redisRes.remaining).toBe(28);
    expect(capturedBody).toContain('INCR');

    // Simulate Upstash outage -> should fall back gracefully to in-memory
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Redis unreachable');
      })
    );
    const fallbackRes = await consumeRateLimit({
      namespace: 'ai-daily:2026-11-26',
      key: '198.51.100.1',
      limit: 30,
      windowSeconds: 86_400,
    });
    expect(fallbackRes.backend).toBe('memory');
    expect(fallbackRes.allowed).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });
});
