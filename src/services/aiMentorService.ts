import type { JavaDiagnostic, JavaTestCaseResult } from './javaCompilerService';

export type AiMentorModel = 'gemini-4-hydrogen' | 'gemini-3.5-flash-lite';
export type AiMentorStyle = 'socratic' | 'deep';
export type LearnTutorIntent =
  | 'explain-simple'
  | 'java-example'
  | 'exam-relevance'
  | 'summarize'
  | 'compare-table'
  | 'glossary-en-vi'
  | 'custom';

export const DEFAULT_AI_MODEL: AiMentorModel = 'gemini-3.5-flash-lite';

export const AI_MENTOR_MODELS: ReadonlyArray<{ id: AiMentorModel; label: string }> = [
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (Nhanh / Tiết kiệm)' },
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen (Chuyên sâu)' },
];

export const GEMINI_INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/interactions';
export const GEMINI_API_REVISION = '2026-05-20';

const STORAGE_MENTOR_STYLE = 'javabrew:ai_mentor_style';
const STORAGE_SLOT_QUIZZES = 'javabrew:slot_quizzes_v1';

export interface AiServerStatus {
  available: boolean;
  mode: 'server' | 'byok-only';
  defaultModel: AiMentorModel;
  dailyLimit: number;
  remaining: number;
}

export interface AiMentorContext {
  mode: 'pe' | 'playground';
  title: string;
  description?: string;
  checklist?: string[];
  activeFileName: string;
  files: Array<{ name: string; content: string }>;
  diagnostics: JavaDiagnostic[];
  testResults: JavaTestCaseResult[];
  diagnosisHints: string[];
}

export interface LearnTutorContext {
  kind: 'pro192' | 'docs';
  itemKey: string;
  title: string;
  lang: 'vi' | 'en';
  domainLabel?: string;
  slotNumber?: number;
  objectives?: string[];
  examTraps?: string[];
  excerpt?: string;
  selectedText?: string;
  intent?: LearnTutorIntent;
}

export interface ExerciseGradeContext {
  exerciseId: string;
  slot: number;
  title: string;
  promptMd: string;
  solutionMd: string;
  userAnswer: string;
}

export interface SlotQuizContext {
  slot: number;
  title: string;
  objectives?: string[];
  examTraps?: string[];
  examFocus?: string[];
  excerpt?: string;
  regenerate?: boolean;
}

export interface SlotQuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  topicTag: string;
}

export interface SlotQuizSet {
  slot: number;
  title: string;
  generatedAt: string;
  questions: SlotQuizQuestion[];
}

export interface CachedSlotQuizRecord {
  quiz: SlotQuizSet;
  selectedAnswers?: Record<string, number>;
  submitted?: boolean;
  score?: number;
  updatedAt: string;
}

export type AskGeminiResult =
  | {
      ok: true;
      reply: string;
      interactionId?: string;
      model: AiMentorModel;
    }
  | {
      ok: false;
      status: number;
      errorMessage: string;
    };

export type StreamAiMeta = {
  source: 'server' | 'byok';
  model: AiMentorModel;
  remaining?: number;
  limit?: number;
  cached?: boolean;
};

export type StreamAiMentorResult = AskGeminiResult & {
  source?: 'server' | 'byok';
  remaining?: number;
  limit?: number;
  quotaExceeded?: boolean;
  cached?: boolean;
};

export type SlotQuizResult =
  | {
      ok: true;
      quiz: SlotQuizSet;
      cached: boolean;
      source: 'server' | 'byok';
      model: AiMentorModel;
      remaining?: number;
      limit?: number;
    }
  | {
      ok: false;
      status: number;
      errorMessage: string;
      quotaExceeded?: boolean;
      remaining?: number;
      limit?: number;
    };

const SYSTEM_INSTRUCTION = [
  'Bạn là AI Code Mentor chuyên môn Java OOP (môn PRO192 chuẩn JDK 1.8 và default package).',
  'Hãy trả lời ngắn gọn, chính xác, sư phạm bằng tiếng Việt và định dạng Markdown (dùng khối ```java ... ``` khi minh họa code).',
  'Ưu tiên chỉ rõ nguyên nhân lỗi biên dịch javac, test case đang fail hoặc lỗ hổng dữ liệu biên (null, chuỗi rỗng, chỉ số mảng) và gợi ý hướng sửa từng bước.',
  'Với các bài PE PRO192, không dùng API Java 9+ (như var, List.of, isBlank, toList) và nhắc bỏ package nếu có.',
].join(' ');

const SOCRATIC_ADDENDUM = [
  'CHẾ ĐỘ GIA SƯ (SOCRATIC): Ở lượt trả lời đầu tiên, TUYỆT ĐỐI KHÔNG viết sẵn toàn bộ file hoặc full hàm đáp án để sinh viên chép.',
  'Thay vào đó: (1) chỉ rõ dòng code hoặc điều kiện logic bị lỗi, (2) giải thích bản chất OOP/JDK 8 vì sao sai, (3) đưa gợi ý sửa theo 1–3 bước (có thể minh họa 1 đoạn tối đa 3–5 dòng), và (4) kết thúc bằng 1 câu hỏi gợi mở để sinh viên tự sửa code.',
].join(' ');

const LEARN_SYSTEM_INSTRUCTION = [
  'Bạn là Trợ lý Học tập AI của JavaBrew (PRO192 JDK 1.8 & JavaGuide CS/Backend).',
  'Trả lời súc tích, rõ ràng, dễ hiểu bằng tiếng Việt định dạng Markdown, bám sát ngữ cảnh bài học được cung cấp.',
  'Nếu minh họa bằng mã Java hoặc được yêu cầu ví dụ Java chạy thử được, luôn viết trong khối ```java ... ``` một chương trình hoàn chỉnh độc lập gồm `public class Main { public static void main(String[] args) { ... } }` (không dùng `package`, tương thích JDK 8) để người học bấm "Chạy thử" ngay trên Live Lab.',
].join(' ');

const GRADE_EXERCISE_SYSTEM_INSTRUCTION = [
  'Bạn là trợ giảng chấm bài PRO192 Java OOP công tâm.',
  'So sánh bài làm nháp của học viên với đề bài và đáp án chuẩn theo 4 mục ngắn gọn bằng Markdown tiếng Việt: **Đánh giá: X/10**, **Điểm làm đúng**, **Chỗ còn thiếu / sai & bẫy JDK 8** (không lộ nguyên văn toàn bộ đáp án nếu làm dở), **Gợi ý bước tiếp theo**.',
].join(' ');

const SLOT_QUIZ_SYSTEM_INSTRUCTION = [
  'Bạn là giảng viên ra đề trắc nghiệm Final Exam (FE) môn PRO192 (Java Core & OOP, chuẩn JDK 8).',
  'Tạo đúng 5 câu hỏi trắc nghiệm khách quan bám sát mục tiêu và bẫy thi của Slot, trả về DUY NHẤT JSON { "questions": [{ "id", "question", "codeSnippet", "options", "correctIndex", "explanation", "topicTag" }] }.',
].join(' ');

export function readMentorStyle(): AiMentorStyle {
  try {
    return localStorage.getItem(STORAGE_MENTOR_STYLE) === 'deep' ? 'deep' : 'socratic';
  } catch {
    return 'socratic';
  }
}

export function saveMentorStyle(style: AiMentorStyle): void {
  try {
    localStorage.setItem(STORAGE_MENTOR_STYLE, style);
  } catch {
    // ignore storage errors
  }
}

function readSlotQuizMap(): Record<string, CachedSlotQuizRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_SLOT_QUIZZES);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, CachedSlotQuizRecord>)
      : {};
  } catch {
    return {};
  }
}

export function readCachedSlotQuiz(slot: number): CachedSlotQuizRecord | null {
  const map = readSlotQuizMap();
  const entry = map[String(slot)];
  if (!entry || !entry.quiz || !Array.isArray(entry.quiz.questions) || entry.quiz.questions.length < 3) {
    return null;
  }
  return entry;
}

export function saveCachedSlotQuiz(slot: number, record: CachedSlotQuizRecord): void {
  try {
    const map = readSlotQuizMap();
    map[String(slot)] = record;
    localStorage.setItem(STORAGE_SLOT_QUIZZES, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function isValidAiMentorModel(value: string | null | undefined): value is AiMentorModel {
  return value === 'gemini-4-hydrogen' || value === 'gemini-3.5-flash-lite';
}

export function buildContextPrompt(
  prompt: string,
  context: AiMentorContext,
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
      .map((f) => `--- ${f.name} ---\n\`\`\`java\n${f.content.slice(0, 6000)}\n\`\`\``)
      .join('\n\n');
    sections.push(`${compact ? 'Mã nguồn vừa cập nhật' : 'Mã nguồn hiện tại'}:\n${fileBlocks}`);
  }

  if (context.diagnostics.length > 0) {
    const diagLines = context.diagnostics
      .slice(0, 8)
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

function formatHttpErrorMessage(status: number, model: AiMentorModel, rawDetail: string): string {
  const detailSuffix = rawDetail ? ` (${rawDetail})` : '';
  if (status === 401 || status === 403) {
    return `API Key không hợp lệ hoặc chưa được cấp quyền truy cập Gemini API (HTTP ${status}). Hãy kiểm tra lại khóa trong Cài đặt.`;
  }
  if (status === 404) {
    return `Model \`${model}\` không khả dụng trên tài khoản API Key này (HTTP 404). Hãy mở Cài đặt để đổi model khác.`;
  }
  if (status === 429) {
    return `Đã vượt hạn mức gọi Gemini API (HTTP 429). Vui lòng đợi ít phút hoặc thử chuyển sang \`gemini-3.5-flash-lite\`.`;
  }
  if (status === 400) {
    return `Yêu cầu gửi tới Gemini API chưa hợp lệ (HTTP 400)${detailSuffix}.`;
  }
  return `Gemini API trả về lỗi HTTP ${status}${detailSuffix}.`;
}

export async function checkAiMentorStatus(signal?: AbortSignal): Promise<AiServerStatus> {
  const fallback: AiServerStatus = {
    available: false,
    mode: 'byok-only',
    defaultModel: DEFAULT_AI_MODEL,
    dailyLimit: 30,
    remaining: 0,
  };
  try {
    const res = await fetch('/api/ai-mentor', {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return fallback;
    }
    const data = (await res.json()) as Partial<AiServerStatus>;
    return {
      available: Boolean(data.available),
      mode: data.available ? 'server' : 'byok-only',
      defaultModel: isValidAiMentorModel(data.defaultModel) ? data.defaultModel : DEFAULT_AI_MODEL,
      dailyLimit: typeof data.dailyLimit === 'number' && data.dailyLimit > 0 ? data.dailyLimit : 30,
      remaining: typeof data.remaining === 'number' && data.remaining >= 0 ? data.remaining : 0,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    return fallback;
  }
}

async function callGeminiDirectText(params: {
  apiKey: string;
  model: AiMentorModel;
  systemInstruction: string;
  input: string;
  previousInteractionId?: string | null;
  store?: boolean;
  signal?: AbortSignal;
}): Promise<AskGeminiResult> {
  const cleanKey = params.apiKey.trim();
  if (!cleanKey) {
    return {
      ok: false,
      status: 400,
      errorMessage: 'Chưa có Gemini API Key. Hãy nhập khóa trong Cài đặt để kích hoạt AI Mentor.',
    };
  }

  try {
    const payload: Record<string, unknown> = {
      model: params.model,
      system_instruction: params.systemInstruction,
      input: params.input,
      store: params.store !== false,
    };
    if (params.previousInteractionId) {
      payload.previous_interaction_id = params.previousInteractionId;
    }

    const res = await fetch(GEMINI_INTERACTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
        'Api-Revision': GEMINI_API_REVISION,
      },
      body: JSON.stringify(payload),
      signal: params.signal,
    });

    if (!res.ok) {
      let apiDetail = '';
      try {
        const errJson = (await res.json()) as { error?: { message?: string } };
        if (typeof errJson?.error?.message === 'string') {
          apiDetail = errJson.error.message.slice(0, 180);
        }
      } catch {
        // ignore JSON parse failure on error body
      }
      return {
        ok: false,
        status: res.status,
        errorMessage: formatHttpErrorMessage(res.status, params.model, apiDetail),
      };
    }

    const data = (await res.json()) as InteractionApiResponse;
    const reply = extractInteractionReply(data);
    if (!reply) {
      return {
        ok: false,
        status: 502,
        errorMessage: 'Gemini API phản hồi trống (không tìm thấy nội dung trả lời). Hãy thử hỏi lại.',
      };
    }

    return {
      ok: true,
      reply,
      interactionId: typeof data.id === 'string' ? data.id : undefined,
      model: params.model,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    return {
      ok: false,
      status: 0,
      errorMessage:
        'Không kết nối được tới Gemini API (lỗi mạng hoặc trình duyệt chặn kết nối). Hãy kiểm tra mạng và thử lại.',
    };
  }
}

export async function askGeminiMentor(params: {
  apiKey: string;
  model: AiMentorModel;
  prompt: string;
  context: AiMentorContext;
  mentorStyle?: AiMentorStyle;
  previousInteractionId?: string | null;
  compactFollowUp?: boolean;
  codeChanged?: boolean;
  signal?: AbortSignal;
}): Promise<AskGeminiResult> {
  const systemInstruction =
    params.mentorStyle === 'socratic'
      ? `${SYSTEM_INSTRUCTION} ${SOCRATIC_ADDENDUM}`
      : SYSTEM_INSTRUCTION;
  const input = buildContextPrompt(params.prompt, params.context, {
    compactFollowUp: params.compactFollowUp ?? Boolean(params.previousInteractionId),
    codeChanged: params.codeChanged,
  });
  return callGeminiDirectText({
    apiKey: params.apiKey,
    model: params.model,
    systemInstruction,
    input,
    previousInteractionId: params.previousInteractionId,
    store: true,
    signal: params.signal,
  });
}

function parseClientSseBlock(rawBlock: string): { eventName: string; dataStr: string } | null {
  const lines = rawBlock.split(/\r?\n/);
  let eventName = 'message';
  const dataLines: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  const dataStr = dataLines.join('\n').trim();
  if (!dataStr) return null;
  return { eventName, dataStr };
}

async function postAiProxyStream(params: {
  apiKey?: string;
  model: AiMentorModel;
  requestBody: Record<string, unknown>;
  signal?: AbortSignal;
  onMeta?: (meta: StreamAiMeta) => void;
  onDelta?: (chunk: string) => void;
  fallbackDirect: (cleanKey: string) => Promise<AskGeminiResult>;
}): Promise<StreamAiMentorResult> {
  const cleanKey = params.apiKey?.trim() || '';

  const runDirectFallback = async (): Promise<StreamAiMentorResult> => {
    if (!cleanKey) {
      return {
        ok: false,
        status: 503,
        errorMessage:
          'Dịch vụ AI tự động chưa khả dụng trên môi trường này. Hãy nhập Gemini API Key trong Cài đặt.',
      };
    }
    const direct = await params.fallbackDirect(cleanKey);
    if (direct.ok) {
      params.onMeta?.({ source: 'byok', model: direct.model });
      params.onDelta?.(direct.reply);
      return { ...direct, source: 'byok' };
    }
    return { ...direct, source: 'byok' };
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cleanKey) {
      headers['x-javabrew-byok-key'] = cleanKey;
    }

    const res = await fetch('/api/ai-mentor', {
      method: 'POST',
      headers,
      body: JSON.stringify(params.requestBody),
      signal: params.signal,
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    if (
      res.status === 404 ||
      (!contentType.includes('text/event-stream') && !contentType.includes('application/json'))
    ) {
      return runDirectFallback();
    }

    if (!res.ok) {
      let errPayload: {
        error?: string;
        quotaExceeded?: boolean;
        remaining?: number;
        dailyLimit?: number;
        limit?: number;
      } = {};
      try {
        errPayload = (await res.json()) as typeof errPayload;
      } catch {
        // ignore JSON parse errors
      }
      return {
        ok: false,
        status: res.status,
        errorMessage:
          errPayload.error || formatHttpErrorMessage(res.status, params.model, ''),
        quotaExceeded: Boolean(errPayload.quotaExceeded),
        remaining: typeof errPayload.remaining === 'number' ? errPayload.remaining : undefined,
        limit:
          typeof errPayload.dailyLimit === 'number'
            ? errPayload.dailyLimit
            : typeof errPayload.limit === 'number'
              ? errPayload.limit
              : undefined,
      };
    }

    if (contentType.includes('text/event-stream') && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullReply = '';
      let interactionId: string | undefined;
      let finalModel: AiMentorModel = params.model;
      let source: 'server' | 'byok' = cleanKey ? 'byok' : 'server';
      let remaining: number | undefined;
      let limit: number | undefined;
      let cached = false;
      let streamError: { status: number; message: string } | null = null;

      const handleBlock = (rawBlock: string) => {
        const parsed = parseClientSseBlock(rawBlock);
        if (!parsed) return;
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(parsed.dataStr) as Record<string, unknown>;
        } catch {
          return;
        }

        if (parsed.eventName === 'meta') {
          if (data.source === 'byok' || data.source === 'server') {
            source = data.source;
          }
          if (typeof data.model === 'string' && isValidAiMentorModel(data.model)) {
            finalModel = data.model;
          }
          if (typeof data.remaining === 'number') remaining = data.remaining;
          if (typeof data.limit === 'number') limit = data.limit;
          if (data.cached === true) cached = true;
          params.onMeta?.({
            source,
            model: finalModel,
            remaining,
            limit,
            ...(cached ? { cached: true } : {}),
          });
          return;
        }

        if (parsed.eventName === 'delta') {
          if (typeof data.text === 'string' && data.text.length > 0) {
            fullReply += data.text;
            params.onDelta?.(data.text);
          }
          return;
        }

        if (parsed.eventName === 'done') {
          if (typeof data.interactionId === 'string') {
            interactionId = data.interactionId;
          }
          if (typeof data.model === 'string' && isValidAiMentorModel(data.model)) {
            finalModel = data.model;
          }
          if (data.source === 'byok' || data.source === 'server') {
            source = data.source;
          }
          if (typeof data.remaining === 'number') remaining = data.remaining;
          if (typeof data.limit === 'number') limit = data.limit;
          if (data.cached === true) cached = true;
          return;
        }

        if (parsed.eventName === 'error') {
          streamError = {
            status: typeof data.status === 'number' ? data.status : 502,
            message:
              typeof data.message === 'string'
                ? data.message
                : 'Gemini API gặp sự cố trong lúc stream phản hồi.',
          };
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() ?? '';
          for (const block of blocks) {
            if (block.trim()) handleBlock(block);
          }
        }
        const tail = buffer + decoder.decode();
        if (tail.trim()) {
          handleBlock(tail);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          await reader.cancel().catch(() => {});
          throw err;
        }
        throw err;
      }

      if (streamError) {
        const errObj = streamError as { status: number; message: string };
        return {
          ok: false,
          status: errObj.status,
          errorMessage: errObj.message,
          source,
          remaining,
          limit,
        };
      }

      const trimmed = fullReply.trim();
      if (!trimmed) {
        return {
          ok: false,
          status: 502,
          errorMessage: 'Gemini API phản hồi trống (không tìm thấy nội dung trả lời). Hãy thử hỏi lại.',
          source,
          remaining,
          limit,
        };
      }

      return {
        ok: true,
        reply: trimmed,
        interactionId,
        model: finalModel,
        source,
        remaining,
        limit,
        ...(cached ? { cached: true } : {}),
      };
    }

    const jsonPayload = (await res.json()) as {
      ok?: boolean;
      reply?: string;
      interactionId?: string;
      model?: AiMentorModel;
      source?: 'server' | 'byok';
      remaining?: number;
      limit?: number;
      cached?: boolean;
      error?: string;
    };

    if (jsonPayload.ok && typeof jsonPayload.reply === 'string' && jsonPayload.reply.trim()) {
      const modelUsed = isValidAiMentorModel(jsonPayload.model) ? jsonPayload.model : params.model;
      const src = jsonPayload.source ?? (cleanKey ? 'byok' : 'server');
      const isCached = Boolean(jsonPayload.cached);
      params.onMeta?.({
        source: src,
        model: modelUsed,
        remaining: jsonPayload.remaining,
        limit: jsonPayload.limit,
        ...(isCached ? { cached: true } : {}),
      });
      params.onDelta?.(jsonPayload.reply);
      return {
        ok: true,
        reply: jsonPayload.reply.trim(),
        interactionId: jsonPayload.interactionId,
        model: modelUsed,
        source: src,
        remaining: jsonPayload.remaining,
        limit: jsonPayload.limit,
        ...(isCached ? { cached: true } : {}),
      };
    }

    return {
      ok: false,
      status: 502,
      errorMessage:
        jsonPayload.error ||
        'Gemini API phản hồi trống (không tìm thấy nội dung trả lời). Hãy thử hỏi lại.',
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    return runDirectFallback();
  }
}

export async function streamAiMentor(params: {
  apiKey?: string;
  model: AiMentorModel;
  mentorStyle?: AiMentorStyle;
  prompt: string;
  context: AiMentorContext;
  previousInteractionId?: string | null;
  codeChanged?: boolean;
  signal?: AbortSignal;
  onMeta?: (meta: StreamAiMeta) => void;
  onDelta?: (chunk: string) => void;
}): Promise<StreamAiMentorResult> {
  return postAiProxyStream({
    apiKey: params.apiKey,
    model: params.model,
    requestBody: {
      action: 'chat',
      model: params.model,
      mentorStyle: params.mentorStyle ?? 'socratic',
      prompt: params.prompt,
      context: params.context,
      stream: true,
      previousInteractionId: params.previousInteractionId || undefined,
      codeChanged: params.codeChanged,
    },
    signal: params.signal,
    onMeta: params.onMeta,
    onDelta: params.onDelta,
    fallbackDirect: (cleanKey) =>
      askGeminiMentor({
        apiKey: cleanKey,
        model: params.model,
        mentorStyle: params.mentorStyle,
        prompt: params.prompt,
        context: params.context,
        previousInteractionId: params.previousInteractionId,
        codeChanged: params.codeChanged,
        signal: params.signal,
      }),
  });
}

function buildDirectLearnInput(prompt: string, ctx: LearnTutorContext): string {
  return [
    `Bài học (${ctx.kind === 'pro192' ? 'PRO192' : 'JavaGuide'}): ${ctx.title}`,
    ctx.objectives?.length ? `Mục tiêu:\n${ctx.objectives.map((o) => `- ${o}`).join('\n')}` : '',
    ctx.examTraps?.length ? `Bẫy thi:\n${ctx.examTraps.map((t) => `- ${t}`).join('\n')}` : '',
    ctx.excerpt ? `Trích đoạn:\n${ctx.excerpt.slice(0, 5500)}` : '',
    ctx.selectedText ? `Đoạn đã bôi đen:\n"""\n${ctx.selectedText}\n"""` : '',
    `Câu hỏi (${ctx.intent || 'custom'}):\n${prompt}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function streamLearnTutor(params: {
  apiKey?: string;
  model: AiMentorModel;
  prompt: string;
  learnContext: LearnTutorContext;
  previousInteractionId?: string | null;
  signal?: AbortSignal;
  onMeta?: (meta: StreamAiMeta) => void;
  onDelta?: (chunk: string) => void;
}): Promise<StreamAiMentorResult> {
  return postAiProxyStream({
    apiKey: params.apiKey,
    model: params.model,
    requestBody: {
      action: 'learn',
      model: params.model,
      prompt: params.prompt,
      learnContext: params.learnContext,
      stream: true,
      previousInteractionId: params.previousInteractionId || undefined,
    },
    signal: params.signal,
    onMeta: params.onMeta,
    onDelta: params.onDelta,
    fallbackDirect: (cleanKey) =>
      callGeminiDirectText({
        apiKey: cleanKey,
        model: params.model,
        systemInstruction: LEARN_SYSTEM_INSTRUCTION,
        input: buildDirectLearnInput(params.prompt, params.learnContext),
        previousInteractionId: params.previousInteractionId,
        store: true,
        signal: params.signal,
      }),
  });
}

export async function streamExerciseGrade(params: {
  apiKey?: string;
  model: AiMentorModel;
  exerciseContext: ExerciseGradeContext;
  signal?: AbortSignal;
  onMeta?: (meta: StreamAiMeta) => void;
  onDelta?: (chunk: string) => void;
}): Promise<StreamAiMentorResult> {
  return postAiProxyStream({
    apiKey: params.apiKey,
    model: params.model,
    requestBody: {
      action: 'grade-exercise',
      model: params.model,
      exerciseContext: params.exerciseContext,
      stream: true,
    },
    signal: params.signal,
    onMeta: params.onMeta,
    onDelta: params.onDelta,
    fallbackDirect: (cleanKey) =>
      callGeminiDirectText({
        apiKey: cleanKey,
        model: params.model,
        systemInstruction: GRADE_EXERCISE_SYSTEM_INSTRUCTION,
        input: [
          `Bài tập ${params.exerciseContext.exerciseId} (Slot ${params.exerciseContext.slot}): ${params.exerciseContext.title}`,
          `Đề bài:\n${params.exerciseContext.promptMd}`,
          params.exerciseContext.solutionMd ? `Đáp án tham khảo:\n${params.exerciseContext.solutionMd}` : '',
          `Bài làm của học viên:\n${params.exerciseContext.userAnswer}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        store: false,
        signal: params.signal,
      }),
  });
}

function parseClientQuizJson(rawText: string, slot: number, title: string): SlotQuizSet | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;
  let parsed: unknown = null;
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  parsed = tryParse(trimmed);
  if (!parsed) {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1]) parsed = tryParse(fence[1].trim());
  }
  if (!parsed) {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) parsed = tryParse(trimmed.slice(first, last + 1));
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>).questions)
      ? ((parsed as Record<string, unknown>).questions as unknown[])
      : null;
  if (!list) return null;

  const questions: SlotQuizQuestion[] = [];
  for (const item of list.slice(0, 5)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const q = item as Record<string, unknown>;
    const qText = typeof q.question === 'string' ? q.question.trim() : '';
    const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
    const idx = Number(q.correctIndex);
    if (!qText || !explanation || !Number.isInteger(idx) || idx < 0 || idx > 3) continue;
    if (!Array.isArray(q.options) || q.options.length !== 4) continue;
    const opts = q.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (opts.some((o) => !o)) continue;
    const snippet = typeof q.codeSnippet === 'string' ? q.codeSnippet.trim() : '';
    questions.push({
      id: typeof q.id === 'string' && q.id.trim() ? q.id.trim() : `q${questions.length + 1}`,
      question: qText,
      codeSnippet: snippet || undefined,
      options: [opts[0], opts[1], opts[2], opts[3]],
      correctIndex: idx,
      explanation,
      topicTag:
        typeof q.topicTag === 'string' && q.topicTag.trim()
          ? q.topicTag.trim()
          : `Slot ${String(slot).padStart(2, '0')}`,
    });
  }
  if (questions.length < 3) return null;
  return { slot, title, generatedAt: new Date().toISOString(), questions };
}

export async function generateSlotFeQuiz(params: {
  apiKey?: string;
  model: AiMentorModel;
  quizContext: SlotQuizContext;
  signal?: AbortSignal;
}): Promise<SlotQuizResult> {
  const cleanKey = params.apiKey?.trim() || '';

  const fallbackDirectQuiz = async (): Promise<SlotQuizResult> => {
    if (!cleanKey) {
      return {
        ok: false,
        status: 503,
        errorMessage:
          'Dịch vụ AI tự động chưa khả dụng. Hãy nhập Gemini API Key trong Cài đặt để sinh Mini-Quiz.',
      };
    }
    const direct = await callGeminiDirectText({
      apiKey: cleanKey,
      model: params.model,
      systemInstruction: SLOT_QUIZ_SYSTEM_INSTRUCTION,
      input: [
        `Tạo đúng 5 câu hỏi trắc nghiệm FE PRO192 (JDK 8) cho Slot ${String(params.quizContext.slot).padStart(2, '0')}: ${params.quizContext.title}`,
        params.quizContext.examFocus?.length
          ? `Trọng tâm: ${params.quizContext.examFocus.join(', ')}`
          : '',
        params.quizContext.objectives?.length
          ? `Mục tiêu:\n${params.quizContext.objectives.map((o) => `- ${o}`).join('\n')}`
          : '',
        params.quizContext.examTraps?.length
          ? `Bẫy thi:\n${params.quizContext.examTraps.map((t) => `- ${t}`).join('\n')}`
          : '',
        params.quizContext.excerpt ? `Tài liệu:\n${params.quizContext.excerpt.slice(0, 3500)}` : '',
        'Chỉ trả về JSON hợp lệ dạng { "questions": [...] }.',
      ]
        .filter(Boolean)
        .join('\n\n'),
      store: false,
      signal: params.signal,
    });
    if (!direct.ok) {
      return { ok: false, status: direct.status, errorMessage: direct.errorMessage };
    }
    const quiz = parseClientQuizJson(
      direct.reply,
      params.quizContext.slot,
      params.quizContext.title
    );
    if (!quiz) {
      return {
        ok: false,
        status: 502,
        errorMessage: 'AI trả về bộ câu hỏi chưa đúng định dạng JSON. Hãy bấm thử lại.',
      };
    }
    return {
      ok: true,
      quiz,
      cached: false,
      source: 'byok',
      model: direct.model,
    };
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cleanKey) {
      headers['x-javabrew-byok-key'] = cleanKey;
    }

    const res = await fetch('/api/ai-mentor', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'slot-quiz',
        model: params.model,
        quizContext: params.quizContext,
        stream: false,
      }),
      signal: params.signal,
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (res.status === 404 || !contentType.includes('application/json')) {
      return fallbackDirectQuiz();
    }

    const payload = (await res.json()) as {
      ok?: boolean;
      quiz?: SlotQuizSet;
      cached?: boolean;
      source?: 'server' | 'byok';
      model?: AiMentorModel;
      remaining?: number;
      dailyLimit?: number;
      limit?: number;
      quotaExceeded?: boolean;
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        errorMessage: payload.error || formatHttpErrorMessage(res.status, params.model, ''),
        quotaExceeded: Boolean(payload.quotaExceeded),
        remaining: typeof payload.remaining === 'number' ? payload.remaining : undefined,
        limit:
          typeof payload.dailyLimit === 'number'
            ? payload.dailyLimit
            : typeof payload.limit === 'number'
              ? payload.limit
              : undefined,
      };
    }

    if (payload.ok && payload.quiz && Array.isArray(payload.quiz.questions)) {
      return {
        ok: true,
        quiz: payload.quiz,
        cached: Boolean(payload.cached),
        source: payload.source === 'byok' ? 'byok' : 'server',
        model: isValidAiMentorModel(payload.model) ? payload.model : params.model,
        remaining: typeof payload.remaining === 'number' ? payload.remaining : undefined,
        limit: typeof payload.limit === 'number' ? payload.limit : undefined,
      };
    }

    return {
      ok: false,
      status: 502,
      errorMessage: payload.error || 'Không thể tạo Mini-Quiz lúc này. Hãy thử lại.',
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    return fallbackDirectQuiz();
  }
}

export async function testGeminiApiKey(
  apiKey: string,
  model: AiMentorModel,
  signal?: AbortSignal
): Promise<{ ok: true; model: AiMentorModel } | { ok: false; errorMessage: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { ok: false, errorMessage: 'Vui lòng nhập Gemini API Key trước khi kiểm tra.' };
  }

  try {
    const proxyRes = await fetch('/api/ai-mentor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-javabrew-byok-key': cleanKey,
      },
      body: JSON.stringify({
        action: 'test',
        model,
      }),
      signal,
    });

    const contentType = (proxyRes.headers.get('content-type') || '').toLowerCase();
    if (proxyRes.status !== 404 && contentType.includes('application/json')) {
      if (!proxyRes.ok) {
        let apiDetail = '';
        try {
          const errJson = (await proxyRes.json()) as {
            error?: string | { message?: string };
            errorMessage?: string;
          };
          if (typeof errJson.errorMessage === 'string') {
            return { ok: false, errorMessage: errJson.errorMessage };
          }
          if (typeof errJson.error === 'string') {
            return { ok: false, errorMessage: errJson.error };
          }
          if (typeof errJson?.error?.message === 'string') {
            apiDetail = errJson.error.message.slice(0, 160);
          }
        } catch {
          // ignore
        }
        return {
          ok: false,
          errorMessage: formatHttpErrorMessage(proxyRes.status, model, apiDetail),
        };
      }

      const data = (await proxyRes.json()) as {
        ok?: boolean;
        model?: AiMentorModel;
        errorMessage?: string;
        id?: string;
      };
      if (data.ok === true) {
        return { ok: true, model: data.model || model };
      }
      if (data.ok === false) {
        return {
          ok: false,
          errorMessage: data.errorMessage || 'API Key không hợp lệ.',
        };
      }
      if (typeof data.id === 'string') {
        return { ok: true, model };
      }
    }

    // Fallback directly to Gemini Interactions API when no serverless proxy is mounted
    const res = await fetch(GEMINI_INTERACTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
        'Api-Revision': GEMINI_API_REVISION,
      },
      body: JSON.stringify({
        model,
        input: 'Reply with OK',
        store: false,
      }),
      signal,
    });

    if (!res.ok) {
      let apiDetail = '';
      try {
        const errJson = (await res.json()) as { error?: { message?: string } };
        if (typeof errJson?.error?.message === 'string') {
          apiDetail = errJson.error.message.slice(0, 160);
        }
      } catch {
        // ignore
      }
      return {
        ok: false,
        errorMessage: formatHttpErrorMessage(res.status, model, apiDetail),
      };
    }

    return { ok: true, model };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    return {
      ok: false,
      errorMessage: 'Không kết nối được tới Gemini API để kiểm tra khóa.',
    };
  }
}

export function buildOfflineMentorReply(prompt: string, context: AiMentorContext): string {
  const wantsCleanCode = /tối ưu|ngắn|clean|refactor/i.test(prompt);
  const bullets: string[] = [];

  if (context.diagnostics.length > 0) {
    const first = context.diagnostics[0];
    bullets.push(
      `**Lỗi biên dịch đầu tiên cần sửa tại \`${first.file}:${first.line}\`:**\n- \`${first.message}\``
    );
    if (/cannot find symbol/i.test(first.message)) {
      bullets.push(
        'Kiểm tra lại chính tả tên biến/hàm, câu lệnh `import java.util.*;`, hoặc đảm bảo tên lớp trùng khớp với đề bài.'
      );
    } else if (/package/i.test(first.message)) {
      bullets.push('Xóa dòng `package ...;` ở đầu tệp để giữ đúng chuẩn **default package** của PRO192.');
    }
  } else {
    const failedTests = context.testResults.filter((t) => !t.passed);
    if (failedTests.length > 0) {
      const firstFail = failedTests[0];
      bullets.push(`**Test Case chưa đạt (${firstFail.id}):** ${firstFail.name}`);
      if (firstFail.expected || firstFail.actual) {
        bullets.push(
          `- Kỳ vọng: \`${firstFail.expected || '—'}\`\n- Thực tế: \`${firstFail.actual || '—'}\``
        );
      }
      if (firstFail.error) {
        bullets.push(`- Gợi ý: ${firstFail.error}`);
      }
    }
  }

  if (bullets.length === 0) {
    if (context.mode === 'playground') {
      bullets.push(
        wantsCleanCode
          ? `Trong \`${context.activeFileName}\`, ưu tiên đặt tên tệp trùng chính xác với \`public class\`, đóng \`Scanner\`/\`BufferedReader\` bằng \`try-with-resources\` và kiểm tra tham số \`null\` ngay đầu phương thức.`
          : `Tệp \`${context.activeFileName}\` đang chạy trên **JavaBrew Live Lab**. Nếu bài cần đọc từ \`Scanner(System.in)\`, hãy mở nút **+ Nhập stdin** ngay phía trên khung Output.`
      );
    } else if (context.diagnosisHints.length > 0) {
      bullets.push(
        `**Gợi ý ưu tiên cho ${context.title}:**\n${context.diagnosisHints
          .slice(0, 2)
          .map((h) => `- ${h}`)
          .join('\n')}`
      );
    } else if (wantsCleanCode) {
      bullets.push(
        `Với **${context.title}**, hãy ưu tiên **Early Return** cho các nhánh \`null\` / rỗng ở đầu hàm, dùng \`StringBuilder\` khi nối chuỗi trong vòng lặp và dùng \`Iterator.remove()\` khi xóa phần tử khỏi \`List\`.`
      );
    } else {
      const checkTip = context.checklist?.[0] || 'Kiểm tra xử lý null an toàn và chữ ký hàm chuẩn JDK 8';
      bullets.push(
        `Kiểm tra lại tiêu chí trọng tâm của **${context.title}**: ${checkTip}. Bạn có thể bấm **⚡ So sánh Bản Tối ưu (Diff)** để đối chiếu trực quan.`
      );
    }
  }

  bullets.push(
    '*Chế độ Gợi ý cục bộ — nhập Gemini API Key miễn phí trong Cài đặt để trao đổi trực tiếp với AI Mentor theo từng dòng code.*'
  );

  return bullets.join('\n\n');
}
