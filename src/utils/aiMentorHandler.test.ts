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

  it('appends Socratic guidance when mentorStyle is socratic', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    let systemInstruction = '';

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || '{}')) as { system_instruction?: string };
        systemInstruction = parsed.system_instruction || '';
        return makeSseResponse([
          { data: { event_type: 'step.delta', delta: { type: 'text', text: 'Gợi ý từng bước...' } } },
        ]);
      })
    );

    const res = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': '203.0.113.31',
        },
        body: JSON.stringify({
          ...SAMPLE_CHAT_BODY,
          mentorStyle: 'socratic',
        }),
      })
    );
    expect(res.status).toBe(200);
    await res.text();
    expect(systemInstruction).toContain('SOCRATIC');
    expect(systemInstruction).toContain('TUYỆT ĐỐI KHÔNG');
  });

  it('streams action=learn and serves cached summary without burning daily quota', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    process.env.AI_DAILY_LIMIT = '10';
    let upstreamCalls = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        upstreamCalls += 1;
        return makeSseResponse([
          {
            data: {
              event_type: 'step.delta',
              delta: { type: 'text', text: '- Ý 1: OOP là gì\n- Ý 2: Tính đóng gói\n- Ý 3: Constructor' },
            },
          },
        ]);
      })
    );

    const learnBody = {
      action: 'learn',
      model: 'gemini-3.5-flash-lite',
      stream: true,
      prompt: 'Tóm tắt 5 ý cốt lõi',
      learnContext: {
        kind: 'pro192',
        itemKey: 'pro192:slots/slot-01',
        title: 'Slot 01: OOP & JVM',
        lang: 'vi',
        slotNumber: 1,
        intent: 'summarize',
        excerpt: 'Java chạy trên JVM nhờ bytecode.',
      },
    };

    const res1 = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.41' },
        body: JSON.stringify(learnBody),
      })
    );
    expect(res1.status).toBe(200);
    const body1 = await res1.text();
    expect(body1).toContain('Ý 1: OOP là gì');
    expect(body1).toContain('"remaining":9');
    expect(upstreamCalls).toBe(1);

    // 2nd identical summary call hits cache -> upstreamCalls stays 1 & remaining stays 9
    const res2 = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.41' },
        body: JSON.stringify(learnBody),
      })
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.text();
    expect(upstreamCalls).toBe(1);
    expect(body2).toContain('"cached":true');
    expect(body2).toContain('"remaining":9');
  });

  it('validates and streams action=grade-exercise', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    const badRes = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade-exercise',
          exerciseContext: {
            exerciseId: '1.1',
            slot: 1,
            title: 'Demo',
            promptMd: 'Viết lớp Student',
            solutionMd: 'class Student {}',
            userAnswer: '   ',
          },
        }),
      })
    );
    expect(badRes.status).toBe(400);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        makeSseResponse([
          { data: { event_type: 'step.delta', delta: { type: 'text', text: '**Đánh giá: 8/10**\nTốt.' } } },
        ])
      )
    );

    const okRes = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.42' },
        body: JSON.stringify({
          action: 'grade-exercise',
          model: 'gemini-3.5-flash-lite',
          exerciseContext: {
            exerciseId: '1.1',
            slot: 1,
            title: 'Demo',
            promptMd: 'Viết lớp Student',
            solutionMd: 'class Student {}',
            userAnswer: 'public class Student { private String name; }',
          },
        }),
      })
    );
    expect(okRes.status).toBe(200);
    expect(await okRes.text()).toContain('Đánh giá: 8/10');
  });

  it('handles action=slot-quiz with structured output, 400 retry fallback, cache hit, and regenerate', async () => {
    process.env.GEMINI_API_KEY = 'AIzaServerDemo';
    process.env.AI_DAILY_LIMIT = '15';
    let upstreamAttempts = 0;

    const sampleQuizJson = JSON.stringify({
      questions: [
        {
          id: 'q1',
          question: 'Từ khóa nào khai báo lớp trong Java?',
          codeSnippet: '',
          options: ['struct', 'class', 'interface', 'object'],
          correctIndex: 1,
          explanation: 'class dùng để khai báo lớp đối tượng.',
          topicTag: 'OOP',
        },
        {
          id: 'q2',
          question: 'Kiểu mặc định của số thực dấu phẩy động 3.14 là gì?',
          codeSnippet: '',
          options: ['float', 'double', 'BigDecimal', 'long'],
          correctIndex: 1,
          explanation: 'Literal số thực mặc định là double.',
          topicTag: 'Kiểu dữ liệu',
        },
        {
          id: 'q3',
          question: 'JDK 8 có hỗ trợ từ khóa var không?',
          codeSnippet: 'var x = 10;',
          options: ['Có', 'Không', 'Chỉ trong static', 'Chỉ JDK 7'],
          correctIndex: 1,
          explanation: 'var chỉ có từ Java 10 trở lên.',
          topicTag: 'JDK 8',
        },
      ],
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        upstreamAttempts += 1;
        const body = JSON.parse(String(init?.body || '{}')) as { response_format?: unknown };
        // Simulate upstream rejecting response_format with 400 on 1st call -> retries without it
        if (upstreamAttempts === 1 && body.response_format) {
          return new Response(JSON.stringify({ error: { message: 'unsupported schema' } }), { status: 400 });
        }
        return new Response(
          JSON.stringify({ id: 'quiz_1', output_text: sampleQuizJson }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    const quizReqBody = {
      action: 'slot-quiz',
      model: 'gemini-3.5-flash-lite',
      quizContext: {
        slot: 3,
        title: 'Lớp & Đối tượng',
        objectives: ['Hiểu constructor'],
        examTraps: ['Không dùng var ở JDK 8'],
        examFocus: ['OOP', 'JDK 8'],
      },
    };

    const res1 = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.55' },
        body: JSON.stringify(quizReqBody),
      })
    );
    expect(res1.status).toBe(200);
    const data1 = (await res1.json()) as {
      ok: boolean;
      cached: boolean;
      remaining: number;
      quiz: { questions: unknown[] };
    };
    expect(data1.ok).toBe(true);
    expect(data1.cached).toBe(false);
    expect(data1.remaining).toBe(14);
    expect(data1.quiz.questions).toHaveLength(3);
    expect(upstreamAttempts).toBe(2); // 1st with response_format failed 400, 2nd succeeded

    // 2nd call hits cache -> does not call fetch or consume quota
    const res2 = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.55' },
        body: JSON.stringify(quizReqBody),
      })
    );
    const data2 = (await res2.json()) as { cached: boolean; remaining: number };
    expect(data2.cached).toBe(true);
    expect(data2.remaining).toBe(14);
    expect(upstreamAttempts).toBe(2);

    // regenerate=true bypasses cache
    const res3 = await POST(
      new Request('https://javabrew.test/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.55' },
        body: JSON.stringify({
          ...quizReqBody,
          quizContext: { ...quizReqBody.quizContext, regenerate: true },
        }),
      })
    );
    const data3 = (await res3.json()) as { cached: boolean; remaining: number };
    expect(data3.cached).toBe(false);
    expect(data3.remaining).toBe(13);
    expect(upstreamAttempts).toBe(3);
  });
});
