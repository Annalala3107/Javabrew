import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askGeminiMentor,
  buildOfflineMentorReply,
  extractInteractionReply,
  GEMINI_API_REVISION,
  GEMINI_INTERACTIONS_ENDPOINT,
  testGeminiApiKey,
  type AiMentorContext,
} from './aiMentorService';

const SAMPLE_CONTEXT: AiMentorContext = {
  mode: 'pe',
  title: 'PE1-Q1: Crocus',
  description: 'Xóa chữ số cuối trong getName()',
  checklist: ['Kiểm tra name == null'],
  activeFileName: 'Crocus.java',
  files: [{ name: 'Crocus.java', content: 'public class Crocus { private String name; }' }],
  diagnostics: [
    {
      file: 'Crocus.java',
      line: 5,
      column: 12,
      severity: 'error',
      message: "';' expected",
    },
  ],
  testResults: [
    {
      id: 'TC1',
      name: 'getName("crocus3")',
      passed: false,
      durationMs: 4,
      expected: 'crocus',
      actual: 'crocus3',
      error: 'Chưa cắt chữ số cuối',
    },
  ],
  diagnosisHints: ['Kiểm tra vòng lặp từ phải sang trái'],
};

describe('aiMentorService (Gemini Interactions API + Offline Mentor)', () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    vi.stubGlobal('fetch', origFetch);
    vi.restoreAllMocks();
  });

  it('calls Interactions API with x-goog-api-key header, model, previous_interaction_id, and full context', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = typeof input === 'string' ? input : input.toString();
        capturedInit = init;
        return new Response(
          JSON.stringify({
            id: 'int_next_123',
            steps: [
              {
                type: 'thought',
                content: [{ type: 'text', text: 'internal reasoning' }],
              },
              {
                type: 'model_output',
                content: [{ type: 'text', text: 'Hãy duyệt ngược bằng `Character.isDigit`.' }],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    const res = await askGeminiMentor({
      apiKey: '  AIzaDemoKey  ',
      model: 'gemini-4-hydrogen',
      prompt: 'Tại sao TC1 bị fail?',
      context: SAMPLE_CONTEXT,
      previousInteractionId: 'int_prev',
    });

    expect(capturedUrl).toBe(GEMINI_INTERACTIONS_ENDPOINT);
    expect(capturedUrl).not.toContain('key=');
    expect(capturedInit?.method).toBe('POST');

    const headers = capturedInit?.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe('AIzaDemoKey');
    expect(headers['Api-Revision']).toBe(GEMINI_API_REVISION);

    const body = JSON.parse(String(capturedInit?.body));
    expect(body.model).toBe('gemini-4-hydrogen');
    expect(body.store).toBe(true);
    expect(body.previous_interaction_id).toBe('int_prev');
    expect(body.system_instruction).toContain('JDK 1.8');
    expect(body.input).toContain('Crocus.java');
    expect(body.input).toContain("';' expected");
    expect(body.input).toContain('TC1 (getName("crocus3")): FAIL');
    expect(body.input).toContain('Tại sao TC1 bị fail?');

    expect(res).toEqual({
      ok: true,
      reply: 'Hãy duyệt ngược bằng `Character.isDigit`.',
      interactionId: 'int_next_123',
      model: 'gemini-4-hydrogen',
    });
  });

  it('extracts replies from steps, output_text, and outputs shapes', () => {
    expect(
      extractInteractionReply({
        steps: [{ type: 'model_output', content: [{ type: 'text', text: 'From steps' }] }],
      })
    ).toBe('From steps');
    expect(extractInteractionReply({ output_text: 'From output_text' })).toBe('From output_text');
    expect(extractInteractionReply({ outputs: [{ text: 'Part 1' }, { text: 'Part 2' }] })).toBe(
      'Part 1\nPart 2'
    );
  });

  it('returns clear Vietnamese error messages for HTTP 401, 404, 429, and network failures', async () => {
    for (const [status, pattern] of [
      [401, /HTTP 401/],
      [404, /HTTP 404/],
      [429, /HTTP 429/],
    ] as const) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          new Response(JSON.stringify({ error: { message: 'api err' } }), { status })
        )
      );

      const res = await askGeminiMentor({
        apiKey: 'AIzaDemoKey',
        model: 'gemini-3.5-flash-lite',
        prompt: 'Giúp em',
        context: SAMPLE_CONTEXT,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.status).toBe(status);
        expect(res.errorMessage).toMatch(pattern);
      }
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      })
    );
    const netRes = await askGeminiMentor({
      apiKey: 'AIzaDemoKey',
      model: 'gemini-4-hydrogen',
      prompt: 'Giúp em',
      context: SAMPLE_CONTEXT,
    });
    expect(netRes.ok).toBe(false);
    if (!netRes.ok) {
      expect(netRes.status).toBe(0);
      expect(netRes.errorMessage).toContain('Không kết nối được');
    }
  });

  it('validates API keys via testGeminiApiKey for empty, HTTP 200, and HTTP 401', async () => {
    const emptyRes = await testGeminiApiKey('   ', 'gemini-4-hydrogen');
    expect(emptyRes.ok).toBe(false);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'ping' }), { status: 200 }))
    );
    const okRes = await testGeminiApiKey('AIzaGood', 'gemini-3.5-flash-lite');
    expect(okRes).toEqual({ ok: true, model: 'gemini-3.5-flash-lite' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { message: 'bad' } }), { status: 401 }))
    );
    const failRes = await testGeminiApiKey('AIzaBad', 'gemini-4-hydrogen');
    expect(failRes.ok).toBe(false);
    if (!failRes.ok) {
      expect(failRes.errorMessage).toContain('HTTP 401');
    }
  });

  it('builds offline mentor replies grounded in diagnostics or failed test cases', () => {
    const diagReply = buildOfflineMentorReply('Sửa giúp em', SAMPLE_CONTEXT);
    expect(diagReply).toContain('Crocus.java:5');
    expect(diagReply).toContain("';' expected");
    expect(diagReply).toContain('Chế độ Gợi ý cục bộ');

    const failTestReply = buildOfflineMentorReply('Tại sao fail?', {
      ...SAMPLE_CONTEXT,
      diagnostics: [],
    });
    expect(failTestReply).toContain('Test Case chưa đạt (TC1)');
    expect(failTestReply).toContain('crocus');
    expect(failTestReply).toContain('Chế độ Gợi ý cục bộ');
  });
});
