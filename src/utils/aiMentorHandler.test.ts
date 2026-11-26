// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../server/ai-mentor';
import { resetMemoryRateLimitsForTest } from '../../server/requestGuard';

const ENV_KEYS = [
  'GEMINI_API_KEY',
  'GEMINI_DEFAULT_MODEL',
  'AI_DAILY_LIMIT',
  'VERCEL_ENV',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

const SAMPLE_CHAT_BODY = {
  action: 'chat',
  model: 'gemini-3.5-flash-lite',
  stream: true,
  prompt: 'Giải thích lỗi biên dịch giúp em',
  context: {
    mode: 'pe',
    title: 'PE1-Q1: Crocus',
    description: 'Xóa chữ số cuối trong getName()',
    checklist: ['Kiểm tra name == null'],
    activeFileName: 'Crocus.java',
    files: [{ name: 'Crocus.java', content: 'public class Crocus { String name; }' }],
    diagnostics: [],
    testResults: [],
    diagnosisHints: [],
  },
};

function makeSseResponse(events: Array<{ event?: string; data: unknown }>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const evt of events) {
        const prefix = evt.event ? `event: ${evt.event}\n` : '';
        controller.enqueue(encoder.encode(`${prefix}data: ${JSON.stringify(evt.data)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
  });
}

describe('server/ai-mentor HTTP handler', () => {
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

  it('GET reports server availability and remaining quota accurately', async () => {
    const resUnset = await GET(new Request('https://javabrew.test/api/ai-mentor'));
    expect(resUnset.status).toBe(200);
    const dataUnset = (await resUnset.json()) as { available: boolean; mode: string };
    expect(dataUnset.available).toBe(false);
    expect(dataUnset.mode).toBe('byok-only');

    process.env.GEMINI_API_KEY = 'server-secret-key';
    const resSet = await GET(
      new Request('https://javabrew.test/api/ai-mentor', {
        headers: { 'x-vercel-forwarded-for': '203.0.113.5' },
      })
    );
    const dataSet = (await resSet.json()) as {
      available: boolean;
      mode: string;
      defaultModel: string;
      dailyLimit: number;
      remaining: number;
    };
    expect(dataSet.available).toBe(true);
    expect(dataSet.mode).toBe('server');
    expect(dataSet.defaultModel).toBe('gemini-3.5-flash-lite');
    expect(dataSet.dailyLimit).toBe(30);
    expect(dataSet.remaining).toBe(30);
  });

  it('POST rejects cross-site origins with 403 and missing keys with 503', async () => {
    const crossRes = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'sec-fetch-site': 'cross-site',
        },
        body: JSON.stringify(SAMPLE_CHAT_BODY),
      })
    );
    expect(crossRes.status).toBe(403);

    const noKeyRes = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SAMPLE_CHAT_BODY),
      })
    );
    expect(noKeyRes.status).toBe(503);
  });

  it('streams SSE delta chunks using server GEMINI_API_KEY and decrements daily quota', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    let capturedUrl = '';
    let capturedKeyHeader = '';

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = typeof url === 'string' ? url : url.toString();
        capturedKeyHeader = (init?.headers as Record<string, string>)['x-goog-api-key'] || '';
        return makeSseResponse([
          { data: { event_type: 'interaction.created', interaction: { id: 'int_stream_1' } } },
          { data: { event_type: 'step.delta', delta: { type: 'text', text: 'Xin chào ' } } },
          { data: { event_type: 'step.delta', delta: { type: 'text', text: 'bạn nhé!' } } },
          { data: { event_type: 'interaction.completed', interaction: { id: 'int_stream_1' } } },
        ]);
      })
    );

    const res = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': '203.0.113.20',
        },
        body: JSON.stringify(SAMPLE_CHAT_BODY),
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(capturedUrl).toBe('https://generativelanguage.googleapis.com/v1/interactions?alt=sse');
    expect(capturedKeyHeader).toBe('AIzaServerDemo');

    const sseText = await res.text();
    expect(sseText).toContain('event: meta');
    expect(sseText).toContain('Xin chào ');
    expect(sseText).toContain('bạn nhé!');
    expect(sseText).toContain('"interactionId":"int_stream_1"');
    expect(sseText).toContain('"remaining":29');
  });

  it('compacts follow-up prompt when previousInteractionId is present and codeChanged is false', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    let capturedInput = '';

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || '{}')) as { input?: string };
        capturedInput = parsed.input || '';
        return makeSseResponse([
          { data: { event_type: 'step.delta', delta: { type: 'text', text: 'Gợi ý tiếp theo.' } } },
          { data: { event_type: 'interaction.completed', interaction: { id: 'int_2' } } },
        ]);
      })
    );

    const res = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': '203.0.113.21',
        },
        body: JSON.stringify({
          ...SAMPLE_CHAT_BODY,
          previousInteractionId: 'int_1',
          codeChanged: false,
          prompt: 'Viết ngắn hơn nữa được không?',
        }),
      })
    );
    expect(res.status).toBe(200);
    await res.text();
    expect(capturedInput).toContain('Ngữ cảnh tiếp nối:');
    expect(capturedInput).not.toContain('Xóa chữ số cuối trong getName()');
    expect(capturedInput).not.toContain('public class Crocus');
    expect(capturedInput).toContain('Viết ngắn hơn nữa được không?');
  });

  it('auto-falls back from gemini-4-hydrogen to gemini-3.5-flash-lite on upstream 429', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    const triedModels: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || '{}')) as { model: string };
        triedModels.push(parsed.model);
        if (parsed.model === 'gemini-4-hydrogen') {
          return new Response(JSON.stringify({ error: { message: 'rate limit' } }), { status: 429 });
        }
        return makeSseResponse([
          { data: { event_type: 'step.delta', delta: { type: 'text', text: 'Fallback thành công' } } },
        ]);
      })
    );

    const res = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': '203.0.113.22',
        },
        body: JSON.stringify({
          ...SAMPLE_CHAT_BODY,
          model: 'gemini-4-hydrogen',
        }),
      })
    );
    expect(res.status).toBe(200);
    const bodyText = await res.text();
    expect(triedModels).toEqual(['gemini-4-hydrogen', 'gemini-3.5-flash-lite']);
    expect(bodyText).toContain('Fallback thành công');
    expect(bodyText).toContain('"model":"gemini-3.5-flash-lite"');
  });

  it('enforces AI_DAILY_LIMIT and allows BYOK header to bypass server daily quota', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    process.env.AI_DAILY_LIMIT = '2';

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        makeSseResponse([
          { data: { event_type: 'step.delta', delta: { type: 'text', text: 'OK' } } },
        ])
      )
    );

    const ip = '203.0.113.77';
    for (let i = 0; i < 2; i++) {
      const okRes = await POST(
        new Request('https://javabrew.test/api/ai-mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': ip },
          body: JSON.stringify(SAMPLE_CHAT_BODY),
        })
      );
      expect(okRes.status).toBe(200);
      await okRes.text();
    }

    const blockedRes = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': ip },
        body: JSON.stringify(SAMPLE_CHAT_BODY),
      })
    );
    expect(blockedRes.status).toBe(429);
    const blockedJson = (await blockedRes.json()) as { quotaExceeded?: boolean };
    expect(blockedJson.quotaExceeded).toBe(true);

    // Request with BYOK key should still succeed without hitting server daily quota
    const byokRes = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': ip,
          'x-javabrew-byok-key': 'AIzaPersonalByokKey',
        },
        body: JSON.stringify(SAMPLE_CHAT_BODY),
      })
    );
    expect(byokRes.status).toBe(200);
    const byokText = await byokRes.text();
    expect(byokText).toContain('"source":"byok"');
  });

  it('validates keys via action=test', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'ping' }), { status: 200 }))
    );

    const res = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-javabrew-byok-key': 'AIzaUserKey',
        },
        body: JSON.stringify({ action: 'test', model: 'gemini-3.5-flash-lite' }),
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, model: 'gemini-3.5-flash-lite' });
  });
});
