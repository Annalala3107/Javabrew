import {
  consumeRateLimit,
  getTrustedClientIp,
  getUtcDateKey,
  peekRateLimit,
  validateOrigin,
} from './requestGuard';

export type AiMentorModel = 'gemini-4-hydrogen' | 'gemini-3.5-flash-lite';

export const GEMINI_INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/interactions';
export const GEMINI_API_REVISION = '2026-05-20';

export const AI_MENTOR_MODELS: ReadonlyArray<{ id: AiMentorModel; label: string }> = [
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (Nhanh / Tiết kiệm)' },
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen (Chuyên sâu)' },
];

const DEFAULT_DAILY_LIMIT = 30;
const BURST_SERVER_LIMIT = 10;
const BURST_BYOK_LIMIT = 30;
const BURST_WINDOW_SECONDS = 60;
const DAILY_WINDOW_SECONDS = 86_400;

const MAX_PROMPT_CHARS = 4_000;
const MAX_FILES = 5;
const MAX_FILE_CHARS = 6_000;
const MAX_DIAGNOSTICS = 8;
const MAX_TEST_RESULTS = 10;

const SYSTEM_INSTRUCTION = [
  'Bạn là AI Code Mentor chuyên môn Java OOP (môn PRO192 chuẩn JDK 1.8 và default package).',
  'Hãy trả lời ngắn gọn, chính xác, sư phạm bằng tiếng Việt và định dạng Markdown (dùng khối ```java ... ``` khi minh họa code).',
  'Ưu tiên chỉ rõ nguyên nhân lỗi biên dịch javac, test case đang fail hoặc lỗ hổng dữ liệu biên (null, chuỗi rỗng, chỉ số mảng) và gợi ý hướng sửa từng bước.',
  'Với các bài PE PRO192, không dùng API Java 9+ (như var, List.of, isBlank, toList) và nhắc bỏ package nếu có.',
].join(' ');

export interface AiDiagnosticInput {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface AiTestCaseInput {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  expected?: string;
  actual?: string;
  error?: string;
}

export interface AiMentorContextPayload {
  mode: 'pe' | 'playground';
  title: string;
  description?: string;
  checklist?: string[];
  activeFileName: string;
  files: Array<{ name: string; content: string }>;
  diagnostics: AiDiagnosticInput[];
  testResults: AiTestCaseInput[];
  diagnosisHints: string[];
}

interface ValidatedAiRequest {
  action: 'chat' | 'test';
  model: AiMentorModel;
  stream: boolean;
  previousInteractionId?: string;
  codeChanged: boolean;
  prompt: string;
  context?: AiMentorContextPayload;
}

export function isValidAiMentorModel(value: unknown): value is AiMentorModel {
  return value === 'gemini-4-hydrogen' || value === 'gemini-3.5-flash-lite';
}

export function resolveDefaultServerModel(): AiMentorModel {
  const raw = process.env.GEMINI_DEFAULT_MODEL?.trim();
  return isValidAiMentorModel(raw) ? raw : 'gemini-3.5-flash-lite';
}

export function resolveDailyLimit(): number {
  const parsed = Number.parseInt(process.env.AI_DAILY_LIMIT || '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_DAILY_LIMIT;
  }
  return Math.min(500, parsed);
}

function sanitizeDiagnostic(raw: unknown): AiDiagnosticInput | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.message !== 'string') return null;
  return {
    file: typeof r.file === 'string' ? r.file.slice(0, 120) : 'Main.java',
    line: Number.isFinite(Number(r.line)) ? Math.max(1, Math.trunc(Number(r.line))) : 1,
    column: Number.isFinite(Number(r.column)) ? Math.max(1, Math.trunc(Number(r.column))) : 1,
    severity: r.severity === 'warning' ? 'warning' : 'error',
    message: r.message.slice(0, 400),
  };
}

function sanitizeTestResult(raw: unknown): AiTestCaseInput | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string') return null;
  return {
    id: r.id.slice(0, 40),
    name: r.name.slice(0, 200),
    passed: Boolean(r.passed),
    durationMs: Number.isFinite(Number(r.durationMs)) ? Math.max(0, Number(r.durationMs)) : 0,
    expected: typeof r.expected === 'string' ? r.expected.slice(0, 300) : undefined,
    actual: typeof r.actual === 'string' ? r.actual.slice(0, 300) : undefined,
    error: typeof r.error === 'string' ? r.error.slice(0, 400) : undefined,
  };
}

function validateAiPayload(
  raw: unknown
): { ok: true; data: ValidatedAiRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Payload phải là JSON object hợp lệ.' };
  }
  const rec = raw as Record<string, unknown>;
  const action = rec.action === 'test' ? 'test' : 'chat';
  const model = isValidAiMentorModel(rec.model) ? rec.model : resolveDefaultServerModel();

  if (action === 'test') {
    return {
      ok: true,
      data: {
        action: 'test',
        model,
        stream: false,
        codeChanged: false,
        prompt: '',
      },
    };
  }

  if (typeof rec.prompt !== 'string') {
    return { ok: false, error: 'Thiếu câu hỏi (prompt) gửi tới AI Mentor.' };
  }
  const prompt = rec.prompt.trim();
  if (!prompt) {
    return { ok: false, error: 'Câu hỏi không được để trống.' };
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return {
      ok: false,
      error: `Câu hỏi vượt quá giới hạn ${MAX_PROMPT_CHARS.toLocaleString('vi-VN')} ký tự.`,
    };
  }

  if (!rec.context || typeof rec.context !== 'object' || Array.isArray(rec.context)) {
    return { ok: false, error: 'Thiếu ngữ cảnh mã nguồn (context).' };
  }
  const ctxRec = rec.context as Record<string, unknown>;

  const files: Array<{ name: string; content: string }> = [];
  if (Array.isArray(ctxRec.files)) {
    for (const item of ctxRec.files.slice(0, MAX_FILES)) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const f = item as Record<string, unknown>;
      if (typeof f.name !== 'string' || typeof f.content !== 'string') continue;
      files.push({
        name: f.name.slice(0, 120),
        content: f.content.slice(0, MAX_FILE_CHARS),
      });
    }
  }

  const diagnostics: AiDiagnosticInput[] = [];
  if (Array.isArray(ctxRec.diagnostics)) {
    for (const d of ctxRec.diagnostics.slice(0, MAX_DIAGNOSTICS)) {
      const clean = sanitizeDiagnostic(d);
      if (clean) diagnostics.push(clean);
    }
  }

  const testResults: AiTestCaseInput[] = [];
  if (Array.isArray(ctxRec.testResults)) {
    for (const t of ctxRec.testResults.slice(0, MAX_TEST_RESULTS)) {
      const clean = sanitizeTestResult(t);
      if (clean) testResults.push(clean);
    }
  }

  const checklist = Array.isArray(ctxRec.checklist)
    ? ctxRec.checklist
        .filter((c): c is string => typeof c === 'string')
        .slice(0, 12)
        .map((c) => c.slice(0, 250))
    : undefined;

  const diagnosisHints = Array.isArray(ctxRec.diagnosisHints)
    ? ctxRec.diagnosisHints
        .filter((h): h is string => typeof h === 'string')
        .slice(0, 6)
        .map((h) => h.slice(0, 300))
    : [];

  const previousInteractionId =
    typeof rec.previousInteractionId === 'string' && rec.previousInteractionId.trim()
      ? rec.previousInteractionId.trim().slice(0, 200)
      : undefined;

  const context: AiMentorContextPayload = {
    mode: ctxRec.mode === 'playground' ? 'playground' : 'pe',
    title: typeof ctxRec.title === 'string' ? ctxRec.title.slice(0, 200) : 'JavaBrew Code Studio',
    description: typeof ctxRec.description === 'string' ? ctxRec.description.slice(0, 2000) : undefined,
    checklist,
    activeFileName:
      typeof ctxRec.activeFileName === 'string' ? ctxRec.activeFileName.slice(0, 120) : 'Main.java',
    files,
    diagnostics,
    testResults,
    diagnosisHints,
  };

  return {
    ok: true,
    data: {
      action: 'chat',
      model,
      stream: rec.stream !== false,
      previousInteractionId,
      codeChanged: rec.codeChanged !== false,
      prompt,
      context,
    },
  };
}

export function buildServerContextPrompt(
  prompt: string,
  context: AiMentorContextPayload,
  options?: { compactFollowUp?: boolean; codeChanged?: boolean }
): string {
  const sections: string[] = [];
  const compact = Boolean(options?.compactFollowUp);
  const includeCode = !compact || options?.codeChanged !== false;

  if (compact) {
    sections.push(`Ngữ cảnh tiếp nối: ${context.title} · Tệp đang mở: ${context.activeFileName}`);
  } else {
    sections.push(
      `Ngữ cảnh: ${context.mode === 'pe' ? 'Luyện đề PE PRO192 (chuẩn JDK 1.8)' : 'JavaBrew Live Lab (OpenJDK 21)'} — ${context.title}`,
      `Tệp đang mở: ${context.activeFileName}`
    );
    if (context.description) {
      sections.push(`Đề bài:\n${context.description}`);
    }
    if (context.checklist && context.checklist.length > 0) {
      sections.push(`Checklist chấm bài:\n${context.checklist.map((c) => `- ${c}`).join('\n')}`);
    }
  }

  if (includeCode && context.files.length > 0) {
    const fileBlocks = context.files
      .map((f) => `--- ${f.name} ---\n\`\`\`java\n${f.content.slice(0, MAX_FILE_CHARS)}\n\`\`\``)
      .join('\n\n');
    sections.push(`${compact ? 'Mã nguồn vừa cập nhật' : 'Mã nguồn hiện tại'}:\n${fileBlocks}`);
  }

  if (context.diagnostics.length > 0) {
    const diagLines = context.diagnostics
      .slice(0, MAX_DIAGNOSTICS)
      .map((d) => `- ${d.file}:${d.line}:${d.column} [${d.severity}] ${d.message}`)
      .join('\n');
    sections.push(`Lỗi biên dịch javac gần nhất:\n${diagLines}`);
  }

  const failedTests = context.testResults.filter((t) => !t.passed);
  if (failedTests.length > 0) {
    const testLines = failedTests
      .map((t) => {
        const parts = [`- ${t.id} (${t.name}): FAIL`];
        if (t.expected) parts.push(`  Kỳ vọng: ${t.expected}`);
        if (t.actual) parts.push(`  Thực tế: ${t.actual}`);
        if (t.error) parts.push(`  Ghi chú: ${t.error}`);
        return parts.join('\n');
      })
      .join('\n');
    sections.push(`Test Case chưa đạt:\n${testLines}`);
  }

  if (!compact && context.diagnosisHints.length > 0) {
    sections.push(`Nhận xét phân tích tĩnh:\n${context.diagnosisHints.map((h) => `- ${h}`).join('\n')}`);
  }

  sections.push(`${compact ? 'Câu hỏi tiếp theo của học viên' : 'Câu hỏi của học viên'}:\n${prompt}`);
  return sections.join('\n\n');
}

interface InteractionContentBlock {
  type?: string;
  text?: string;
}

interface InteractionStep {
  type?: string;
  content?: InteractionContentBlock[];
}

interface InteractionApiResponse {
  id?: string;
  output_text?: string;
  steps?: InteractionStep[];
  outputs?: InteractionContentBlock[];
  error?: { message?: string };
}

export function extractInteractionReply(data: InteractionApiResponse): string {
  if (Array.isArray(data.steps) && data.steps.length > 0) {
    const textChunks: string[] = [];
    for (let i = data.steps.length - 1; i >= 0; i--) {
      const step = data.steps[i];
      if (step?.type === 'model_output' && Array.isArray(step.content)) {
        const chunk = step.content
          .filter((b) => (!b?.type || b.type === 'text') && typeof b?.text === 'string')
          .map((b) => b.text as string)
          .join('');
        if (chunk) {
          textChunks.unshift(chunk);
        }
      } else if (textChunks.length > 0) {
        break;
      }
    }
    const combined = textChunks.join('\n').trim();
    if (combined) return combined;
  }

  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.outputs)) {
    const fromOutputs = data.outputs
      .filter((b) => typeof b?.text === 'string')
      .map((b) => b.text as string)
      .join('\n')
      .trim();
    if (fromOutputs) return fromOutputs;
  }

  return '';
}

function formatHttpErrorMessage(
  status: number,
  model: AiMentorModel,
  rawDetail: string,
  source: 'server' | 'byok'
): string {
  const detailSuffix = rawDetail ? ` (${rawDetail})` : '';
  if (status === 401 || status === 403) {
    return source === 'byok'
      ? `API Key cá nhân không hợp lệ hoặc chưa được cấp quyền Gemini API (HTTP ${status}). Hãy kiểm tra lại khóa trong Cài đặt.`
      : `Khóa Gemini API của máy chủ chưa hợp lệ hoặc bị từ chối quyền (HTTP ${status}). Bạn có thể nhập API Key cá nhân trong Cài đặt để dùng ngay.`;
  }
  if (status === 404) {
    return `Model \`${model}\` không khả dụng trên tài khoản API Key này (HTTP 404). Hãy mở Cài đặt để đổi model khác.`;
  }
  if (status === 429) {
    return `Gemini API đang quá tải hoặc vượt hạn mức (HTTP 429). Vui lòng đợi ít phút hoặc thử lại.`;
  }
  if (status === 400) {
    return `Yêu cầu gửi tới Gemini API chưa hợp lệ (HTTP 400)${detailSuffix}.`;
  }
  return `Gemini API trả về lỗi HTTP ${status}${detailSuffix}.`;
}

async function emitMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
): Promise<void> {
  try {
    const fnPkg = await import('@vercel/functions');
    fnPkg.metric(name, value, tags);
  } catch {
    // Metrics are best-effort outside supported Vercel runtimes
  }
}

const textEncoder = new TextEncoder();

function encodeSseEvent(event: string, data: unknown): Uint8Array {
  return textEncoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

interface GeminiSseEventPayload {
  event_type?: string;
  id?: string;
  interaction?: InteractionApiResponse & { id?: string };
  delta?: { type?: string; text?: string };
  error?: { message?: string };
}

function parseSseDataBlock(
  rawBlock: string
): { sseEvent: string; dataJson: string } | null {
  const lines = rawBlock.split(/\r?\n/);
  let sseEvent = '';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      sseEvent = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  const dataJson = dataLines.join('\n').trim();
  if (!dataJson || dataJson === '[DONE]') return null;
  return { sseEvent, dataJson };
}

export async function GET(request: Request): Promise<Response> {
  const serverKey = process.env.GEMINI_API_KEY?.trim() || '';
  const available = Boolean(serverKey);
  const dailyLimit = resolveDailyLimit();
  const defaultModel = resolveDefaultServerModel();
  const clientIp = getTrustedClientIp(request);

  const quota = available
    ? await peekRateLimit({
        namespace: `ai-daily:${getUtcDateKey()}`,
        key: clientIp,
        limit: dailyLimit,
        windowSeconds: DAILY_WINDOW_SECONDS,
      })
    : { remaining: 0, limit: dailyLimit, allowed: false, resetAt: 0, backend: 'memory' as const };

  return Response.json(
    {
      available,
      mode: available ? 'server' : 'byok-only',
      defaultModel,
      dailyLimit,
      remaining: available ? quota.remaining : 0,
      models: AI_MENTOR_MODELS,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: Request): Promise<Response> {
  const originCheck = validateOrigin(request);
  if (!originCheck.ok) {
    await emitMetric('ai_mentor.request', 1, { outcome: 'origin_blocked' });
    return Response.json(
      { error: originCheck.reason },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      { error: 'Request body phải là JSON hợp lệ.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const validated = validateAiPayload(rawBody);
  if (!validated.ok) {
    return Response.json(
      { error: validated.error },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const payload = validated.data;
  const byokKey = request.headers.get('x-javabrew-byok-key')?.trim() || '';
  const serverKey = process.env.GEMINI_API_KEY?.trim() || '';
  const source: 'byok' | 'server' | null = byokKey ? 'byok' : serverKey ? 'server' : null;
  const apiKey = byokKey || serverKey;

  if (!source || !apiKey) {
    await emitMetric('ai_mentor.request', 1, { outcome: 'no_credentials' });
    return Response.json(
      {
        unavailable: true,
        error:
          'Server chưa cấu hình GEMINI_API_KEY. Hãy nhập Gemini API Key cá nhân trong Cài đặt để sử dụng AI Mentor.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const clientIp = getTrustedClientIp(request);
  const burst = await consumeRateLimit({
    namespace: source === 'byok' ? 'ai-burst-byok' : 'ai-burst-srv',
    key: clientIp,
    limit: source === 'byok' ? BURST_BYOK_LIMIT : BURST_SERVER_LIMIT,
    windowSeconds: BURST_WINDOW_SECONDS,
  });
  if (!burst.allowed) {
    await emitMetric('ai_mentor.request', 1, { source, outcome: 'burst_limited' });
    return Response.json(
      { error: 'Bạn gửi câu hỏi quá nhanh. Vui lòng đợi ít giây rồi thử lại.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (payload.action === 'test') {
    try {
      const testRes = await fetch(GEMINI_INTERACTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'Api-Revision': GEMINI_API_REVISION,
        },
        body: JSON.stringify({
          model: payload.model,
          input: 'Reply with OK',
          store: false,
        }),
        signal: request.signal,
      });

      if (!testRes.ok) {
        let apiDetail = '';
        try {
          const errJson = (await testRes.json()) as { error?: { message?: string } };
          if (typeof errJson?.error?.message === 'string') {
            apiDetail = errJson.error.message.slice(0, 160);
          }
        } catch {
          // ignore
        }
        return Response.json(
          {
            ok: false,
            status: testRes.status,
            errorMessage: formatHttpErrorMessage(testRes.status, payload.model, apiDetail, source),
          },
          { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      return Response.json(
        { ok: true, model: payload.model },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      return Response.json(
        {
          ok: false,
          status: 0,
          errorMessage: 'Không kết nối được tới Gemini API để kiểm tra khóa.',
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  let dailyLimit: number | undefined;
  let remaining: number | undefined;

  if (source === 'server') {
    dailyLimit = resolveDailyLimit();
    const quota = await consumeRateLimit({
      namespace: `ai-daily:${getUtcDateKey()}`,
      key: clientIp,
      limit: dailyLimit,
      windowSeconds: DAILY_WINDOW_SECONDS,
    });
    if (!quota.allowed) {
      await emitMetric('ai_mentor.request', 1, { source, outcome: 'quota_exceeded' });
      return Response.json(
        {
          error: `Bạn đã dùng hết ${dailyLimit} lượt AI miễn phí hôm nay. Bạn có thể quay lại vào ngày mai hoặc nhập Gemini API Key cá nhân trong Cài đặt để dùng không giới hạn.`,
          quotaExceeded: true,
          dailyLimit,
          remaining: 0,
        },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    remaining = quota.remaining;
  }

  const builtInput = buildServerContextPrompt(payload.prompt, payload.context!, {
    compactFollowUp: Boolean(payload.previousInteractionId),
    codeChanged: payload.codeChanged,
  });

  const callGeminiUpstream = (targetModel: AiMentorModel, wantStream: boolean) => {
    const endpoint = wantStream
      ? `${GEMINI_INTERACTIONS_ENDPOINT}?alt=sse`
      : GEMINI_INTERACTIONS_ENDPOINT;

    const bodyPayload: Record<string, unknown> = {
      model: targetModel,
      system_instruction: SYSTEM_INSTRUCTION,
      input: builtInput,
      store: true,
    };
    if (wantStream) {
      bodyPayload.stream = true;
    }
    if (payload.previousInteractionId) {
      bodyPayload.previous_interaction_id = payload.previousInteractionId;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
      'Api-Revision': GEMINI_API_REVISION,
    };
    if (wantStream) {
      headers.Accept = 'text/event-stream';
    }

    return fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: request.signal,
    });
  };

  let activeModel: AiMentorModel = payload.model;
  let upstream: Response;

  try {
    upstream = await callGeminiUpstream(activeModel, payload.stream);
    if (
      !upstream.ok &&
      upstream.status === 429 &&
      source === 'server' &&
      activeModel === 'gemini-4-hydrogen'
    ) {
      activeModel = 'gemini-3.5-flash-lite';
      upstream = await callGeminiUpstream(activeModel, payload.stream);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    await emitMetric('ai_mentor.request', 1, { source, model: activeModel, outcome: 'network_error' });
    return Response.json(
      { error: 'Không kết nối được tới Gemini API. Hãy kiểm tra kết nối mạng và thử lại.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!upstream.ok) {
    let apiDetail = '';
    try {
      const errJson = (await upstream.json()) as { error?: { message?: string } };
      if (typeof errJson?.error?.message === 'string') {
        apiDetail = errJson.error.message.slice(0, 180);
      }
    } catch {
      // ignore error body parse errors
    }
    await emitMetric('ai_mentor.request', 1, {
      source,
      model: activeModel,
      outcome: `http_${upstream.status}`,
    });
    return Response.json(
      {
        error: formatHttpErrorMessage(upstream.status, activeModel, apiDetail, source),
        status: upstream.status,
        remaining,
        limit: dailyLimit,
      },
      { status: upstream.status, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const contentType = (upstream.headers.get('content-type') || '').toLowerCase();

  // Non-streaming path or upstream returned plain JSON instead of SSE
  if (!payload.stream || !contentType.includes('text/event-stream') || !upstream.body) {
    let data: InteractionApiResponse;
    try {
      data = (await upstream.json()) as InteractionApiResponse;
    } catch {
      return Response.json(
        { error: 'Gemini API trả về định dạng không hợp lệ.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const reply = extractInteractionReply(data);
    if (!reply) {
      await emitMetric('ai_mentor.request', 1, { source, model: activeModel, outcome: 'empty' });
      return Response.json(
        { error: 'Gemini API phản hồi trống (không tìm thấy nội dung trả lời). Hãy thử hỏi lại.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    await emitMetric('ai_mentor.request', 1, { source, model: activeModel, outcome: 'ok' });

    if (payload.stream) {
      const singleStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encodeSseEvent('meta', {
              source,
              model: activeModel,
              remaining,
              limit: dailyLimit,
            })
          );
          controller.enqueue(encodeSseEvent('delta', { text: reply }));
          controller.enqueue(
            encodeSseEvent('done', {
              interactionId: typeof data.id === 'string' ? data.id : undefined,
              model: activeModel,
              source,
              remaining,
              limit: dailyLimit,
            })
          );
          controller.close();
        },
      });
      return new Response(singleStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-store, no-transform',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    return Response.json(
      {
        ok: true,
        reply,
        interactionId: typeof data.id === 'string' ? data.id : undefined,
        model: activeModel,
        source,
        remaining,
        limit: dailyLimit,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Real SSE Streaming translation from Gemini Interactions API
  const upstreamReader = upstream.body.getReader();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const decoder = new TextDecoder('utf-8');
      let sseBuffer = '';
      let interactionId: string | undefined;
      let hasEmittedText = false;
      let errored = false;

      const safeEnqueue = (bytes: Uint8Array) => {
        try {
          controller.enqueue(bytes);
        } catch {
          // stream already closed by consumer
        }
      };

      const processBlock = (block: string) => {
        const parsedBlock = parseSseDataBlock(block);
        if (!parsedBlock) return;

        let evt: GeminiSseEventPayload;
        try {
          evt = JSON.parse(parsedBlock.dataJson) as GeminiSseEventPayload;
        } catch {
          return;
        }

        const eventType = evt.event_type || parsedBlock.sseEvent;
        if (typeof evt.interaction?.id === 'string') {
          interactionId = evt.interaction.id;
        } else if (typeof evt.id === 'string') {
          interactionId = evt.id;
        }

        if (eventType === 'step.delta' || eventType === 'content.delta') {
          const deltaType = evt.delta?.type;
          if ((!deltaType || deltaType === 'text') && typeof evt.delta?.text === 'string' && evt.delta.text.length > 0) {
            hasEmittedText = true;
            safeEnqueue(encodeSseEvent('delta', { text: evt.delta.text }));
          }
          return;
        }

        if (eventType === 'interaction.completed' || eventType === 'interaction.complete') {
          if (!hasEmittedText && evt.interaction) {
            const fallbackReply = extractInteractionReply(evt.interaction);
            if (fallbackReply) {
              hasEmittedText = true;
              safeEnqueue(encodeSseEvent('delta', { text: fallbackReply }));
            }
          }
          return;
        }

        if (eventType === 'error' || evt.error?.message) {
          errored = true;
          safeEnqueue(
            encodeSseEvent('error', {
              status: 502,
              message: evt.error?.message || 'Gemini API gặp lỗi khi đang stream phản hồi.',
            })
          );
        }
      };

      safeEnqueue(
        encodeSseEvent('meta', {
          source,
          model: activeModel,
          remaining,
          limit: dailyLimit,
        })
      );

      try {
        while (true) {
          const { done, value } = await upstreamReader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const blocks = sseBuffer.split(/\r?\n\r?\n/);
          sseBuffer = blocks.pop() ?? '';
          for (const block of blocks) {
            if (block.trim()) {
              processBlock(block);
            }
          }
        }

        const tail = sseBuffer + decoder.decode();
        if (tail.trim()) {
          processBlock(tail);
        }

        if (!errored && !hasEmittedText) {
          safeEnqueue(
            encodeSseEvent('error', {
              status: 502,
              message: 'Gemini API phản hồi trống (không tìm thấy nội dung trả lời). Hãy thử hỏi lại.',
            })
          );
          await emitMetric('ai_mentor.request', 1, { source, model: activeModel, outcome: 'empty' });
        } else if (!errored) {
          safeEnqueue(
            encodeSseEvent('done', {
              interactionId,
              model: activeModel,
              source,
              remaining,
              limit: dailyLimit,
            })
          );
          await emitMetric('ai_mentor.request', 1, { source, model: activeModel, outcome: 'ok' });
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          safeEnqueue(
            encodeSseEvent('error', {
              status: 502,
              message: 'Mất kết nối luồng phản hồi từ Gemini API.',
            })
          );
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      void upstreamReader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
