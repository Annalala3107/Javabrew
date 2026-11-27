import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askGeminiMentor,
  buildContextPrompt,
  buildOfflineMentorReply,
  checkAiMentorStatus,
  extractInteractionReply,
  GEMINI_API_REVISION,
  GEMINI_INTERACTIONS_ENDPOINT,
  generateSlotFeQuiz,
  readCachedSlotQuiz,
  readMentorStyle,
  saveCachedSlotQuiz,
  saveMentorStyle,
  streamAiMentor,
  streamExerciseGrade,
  streamLearnTutor,
  streamMockExamReview,
  streamRagSearch,
  streamStudyCoach,
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

  it('checks /api/ai-mentor status cleanly and falls back safely on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            available: true,
            mode: 'server',
            defaultModel: 'gemini-3.5-flash-lite',
            dailyLimit: 30,
            remaining: 27,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    const okStatus = await checkAiMentorStatus();
    expect(okStatus).toEqual({
      available: true,
      mode: 'server',
      defaultModel: 'gemini-3.5-flash-lite',
      dailyLimit: 30,
      remaining: 27,
    });

    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not found', { status: 404 })));
    const fallbackStatus = await checkAiMentorStatus();
    expect(fallbackStatus.available).toBe(false);
    expect(fallbackStatus.mode).toBe('byok-only');
  });

  it('streams incremental SSE chunks from /api/ai-mentor without BYOK key and compacts follow-up context', async () => {
    const compactText = buildContextPrompt('Ngắn hơn được không?', SAMPLE_CONTEXT, {
      compactFollowUp: true,
      codeChanged: false,
    });
    expect(compactText).toContain('Ngữ cảnh tiếp nối');
    expect(compactText).not.toContain('Xóa chữ số cuối trong getName()');
    expect(compactText).not.toContain('public class Crocus');

    const encoder = new TextEncoder();
    const sseBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'event: meta\ndata: {"source":"server","model":"gemini-3.5-flash-lite","remaining":29,"limit":30}\n\n'
          )
        );
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":"Hãy dùng "}\n\n'));
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":"Character.isDigit."}\n\n'));
        controller.enqueue(
          encoder.encode(
            'event: done\ndata: {"interactionId":"int_sse_9","model":"gemini-3.5-flash-lite","source":"server","remaining":29,"limit":30}\n\n'
          )
        );
        controller.close();
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(sseBody, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        })
      )
    );

    const deltas: string[] = [];
    let metaSeen: unknown = null;
    const res = await streamAiMentor({
      model: 'gemini-3.5-flash-lite',
      prompt: 'Giải thích lỗi giúp em',
      context: SAMPLE_CONTEXT,
      onMeta: (m) => {
        metaSeen = m;
      },
      onDelta: (chunk) => {
        deltas.push(chunk);
      },
    });

    expect(metaSeen).toEqual({
      source: 'server',
      model: 'gemini-3.5-flash-lite',
      remaining: 29,
      limit: 30,
    });
    expect(deltas).toEqual(['Hãy dùng ', 'Character.isDigit.']);
    expect(res).toEqual({
      ok: true,
      reply: 'Hãy dùng Character.isDigit.',
      interactionId: 'int_sse_9',
      model: 'gemini-3.5-flash-lite',
      source: 'server',
      remaining: 29,
      limit: 30,
    });
  });

  it('falls back to direct Gemini Interactions API when /api/ai-mentor returns 404 and BYOK is set', async () => {
    const calledUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        calledUrls.push(url);
        if (url === '/api/ai-mentor') {
          return new Response('Not found', { status: 404 });
        }
        return new Response(
          JSON.stringify({
            id: 'int_direct_1',
            output_text: 'Trả lời trực tiếp qua BYOK.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    const chunks: string[] = [];
    const res = await streamAiMentor({
      apiKey: 'AIzaUserKey',
      model: 'gemini-4-hydrogen',
      prompt: 'Tối ưu code',
      context: SAMPLE_CONTEXT,
      onDelta: (c) => chunks.push(c),
    });

    expect(calledUrls).toEqual(['/api/ai-mentor', GEMINI_INTERACTIONS_ENDPOINT]);
    expect(chunks).toEqual(['Trả lời trực tiếp qua BYOK.']);
    expect(res).toEqual({
      ok: true,
      reply: 'Trả lời trực tiếp qua BYOK.',
      interactionId: 'int_direct_1',
      model: 'gemini-4-hydrogen',
      source: 'byok',
    });
  });

  it('supports streamLearnTutor, streamExerciseGrade, generateSlotFeQuiz, and localStorage helpers', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    });

    expect(readMentorStyle()).toBe('socratic');
    saveMentorStyle('deep');
    expect(readMentorStyle()).toBe('deep');

    const encoder = new TextEncoder();
    const makeStreamRes = (text: string, cached = false) =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                `event: meta\ndata: ${JSON.stringify({
                  source: 'server',
                  model: 'gemini-3.5-flash-lite',
                  remaining: 25,
                  limit: 30,
                  ...(cached ? { cached: true } : {}),
                })}\n\n`
              )
            );
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`));
            controller.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({
                  source: 'server',
                  model: 'gemini-3.5-flash-lite',
                  remaining: 25,
                  limit: 30,
                  ...(cached ? { cached: true } : {}),
                })}\n\n`
              )
            );
            controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }
      );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || '{}')) as { action?: string };
        if (parsed.action === 'learn') {
          return makeStreamRes('5 ý chính:\n- Tính đóng gói', true);
        }
        if (parsed.action === 'grade-exercise') {
          return makeStreamRes('**Đánh giá: 9/10**\nChuẩn OOP.');
        }
        return new Response(
          JSON.stringify({
            ok: true,
            cached: true,
            source: 'server',
            model: 'gemini-3.5-flash-lite',
            remaining: 25,
            limit: 30,
            quiz: {
              slot: 2,
              title: 'Slot 2',
              generatedAt: '2026-11-26',
              questions: [
                {
                  id: 'q1',
                  question: 'Câu 1',
                  options: ['A', 'B', 'C', 'D'],
                  correctIndex: 0,
                  explanation: 'Đúng vì A.',
                  topicTag: 'OOP',
                },
                {
                  id: 'q2',
                  question: 'Câu 2',
                  options: ['A', 'B', 'C', 'D'],
                  correctIndex: 1,
                  explanation: 'Đúng vì B.',
                  topicTag: 'OOP',
                },
                {
                  id: 'q3',
                  question: 'Câu 3',
                  options: ['A', 'B', 'C', 'D'],
                  correctIndex: 2,
                  explanation: 'Đúng vì C.',
                  topicTag: 'OOP',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    const learnRes = await streamLearnTutor({
      model: 'gemini-3.5-flash-lite',
      prompt: 'Tóm tắt',
      learnContext: {
        kind: 'pro192',
        itemKey: 'pro192:slots/slot-02',
        title: 'Slot 2',
        lang: 'vi',
        intent: 'summarize',
      },
    });
    expect(learnRes.ok).toBe(true);
    if (learnRes.ok) {
      expect(learnRes.cached).toBe(true);
      expect(learnRes.reply).toContain('Tính đóng gói');
    }

    const gradeRes = await streamExerciseGrade({
      model: 'gemini-3.5-flash-lite',
      exerciseContext: {
        exerciseId: '2.1',
        slot: 2,
        title: 'Bài 2.1',
        promptMd: 'Đề',
        solutionMd: 'Đáp án',
        userAnswer: 'class Demo {}',
      },
    });
    expect(gradeRes.ok).toBe(true);
    if (gradeRes.ok) {
      expect(gradeRes.reply).toContain('9/10');
    }

    const quizRes = await generateSlotFeQuiz({
      model: 'gemini-3.5-flash-lite',
      quizContext: { slot: 2, title: 'Slot 2' },
    });
    expect(quizRes.ok).toBe(true);
    if (quizRes.ok) {
      expect(quizRes.quiz.questions).toHaveLength(3);
      saveCachedSlotQuiz(2, {
        quiz: quizRes.quiz,
        selectedAnswers: { q1: 0 },
        submitted: true,
        score: 1,
        updatedAt: '2026-11-26',
      });
      const cached = readCachedSlotQuiz(2);
      expect(cached?.score).toBe(1);
    }
  });

  it('streams mock-exam-review, study-coach, and cached rag-search via proxy', async () => {
    const encoder = new TextEncoder();
    const seenMetas: Array<{ cached?: boolean; remaining?: number }> = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body || '{}')) as { action?: string };
        const isRag = body.action === 'rag-search';
        const replyText =
          body.action === 'mock-exam-review'
            ? 'Giám khảo: Cần rà null Q2.'
            : body.action === 'study-coach'
              ? '10p đầu: sửa lỗi PE.'
              : 'Xem [Slot 14](/pro192/slots/slot-14).';
        const stream = new ReadableStream<Uint8Array>({
          start(ctrl) {
            ctrl.enqueue(
              encoder.encode(
                `event: meta\ndata: ${JSON.stringify({
                  source: 'server',
                  model: 'gemini-3.5-flash-lite',
                  remaining: 12,
                  limit: 15,
                  cached: isRag,
                })}\n\n`
              )
            );
            ctrl.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: replyText })}\n\n`));
            ctrl.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({
                  source: 'server',
                  model: 'gemini-3.5-flash-lite',
                  remaining: 12,
                  limit: 15,
                  cached: isRag,
                })}\n\n`
              )
            );
            ctrl.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        });
      })
    );

    const mockRes = await streamMockExamReview({
      model: 'gemini-3.5-flash-lite',
      mockReviewContext: {
        paper: 'PE1',
        totalScore: 6,
        maxScore: 10,
        elapsedSeconds: 1200,
        questions: [],
      },
    });
    expect(mockRes.ok && mockRes.reply).toContain('Giám khảo');

    const coachRes = await streamStudyCoach({
      model: 'gemini-3.5-flash-lite',
      studyCoachContext: {
        completedSlotsCount: 1,
        totalSlots: 30,
        solvedExercisesCount: 2,
        totalExercises: 150,
        passedPeCount: 0,
        totalPe: 19,
        unresolvedMistakes: [],
        suggestedDocs: [],
      },
    });
    expect(coachRes.ok && coachRes.reply).toContain('10p đầu');

    const ragRes = await streamRagSearch({
      model: 'gemini-3.5-flash-lite',
      ragContext: {
        query: 'Collections là gì',
        lang: 'vi',
        sources: [],
      },
      onMeta: (m) => seenMetas.push({ cached: m.cached, remaining: m.remaining }),
    });
    expect(ragRes.ok).toBe(true);
    if (ragRes.ok) {
      expect(ragRes.cached).toBe(true);
      expect(ragRes.reply).toContain('/pro192/slots/slot-14');
    }
    expect(seenMetas).toEqual([{ cached: true, remaining: 12 }]);
  });
});
