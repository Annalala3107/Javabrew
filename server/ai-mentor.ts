import {
  consumeRateLimit,
  getCachedValue,
  getTrustedClientIp,
  getUtcDateKey,
  peekRateLimit,
  setCachedValue,
  validateOrigin,
} from './requestGuard';

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
const LEARN_SUMMARY_TTL_SECONDS = 86_400;
const SLOT_QUIZ_TTL_SECONDS = 604_800;
const RAG_SEARCH_TTL_SECONDS = 43_200;

const MAX_PROMPT_CHARS = 4_000;
const MAX_FILES = 5;
const MAX_FILE_CHARS = 6_000;
const MAX_DIAGNOSTICS = 8;
const MAX_TEST_RESULTS = 10;
const MAX_LEARN_EXCERPT_CHARS = 6_000;
const MAX_SELECTED_TEXT_CHARS = 1_000;
const MAX_EXERCISE_FIELD_CHARS = 3_000;
const MAX_RAG_SOURCES = 5;

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
  'Nếu minh họa bằng mã Java hoặc được yêu cầu ví dụ Java chạy thử được, luôn viết trong khối ```java ... ``` một chương trình hoàn chỉnh độc lập gồm `public class Main { public static void main(String[] args) { ... } }` (không dùng dòng `package`, ưu tiên tương thích JDK 8) để người học bấm "Chạy thử" ngay trên JavaBrew Live Lab.',
].join(' ');

const GRADE_EXERCISE_SYSTEM_INSTRUCTION = [
  'Bạn là trợ giảng chấm bài PRO192 Java OOP công tâm, khuyến khích người học tự tư duy.',
  'So sánh câu trả lời/code nháp của học viên với đề bài và đáp án chuẩn. Trình bày theo 4 mục ngắn gọn bằng Markdown tiếng Việt:',
  '(1) **Đánh giá: X/10** kèm 1 câu nhận xét tổng quan;',
  '(2) **Điểm làm đúng**;',
  '(3) **Chỗ còn thiếu / sai & bẫy JDK 8** (không ném nguyên văn toàn bộ lời giải chuẩn nếu học viên mới viết dở);',
  '(4) **Gợi ý bước sửa tiếp theo** (có thể minh họa đoạn nhỏ trong ```java ... ``` tương thích Live Lab).',
].join(' ');

const SLOT_QUIZ_SYSTEM_INSTRUCTION = [
  'Bạn là giảng viên ra đề trắc nghiệm Final Exam (FE) môn PRO192 (Java Core & OOP, chuẩn JDK 8).',
  'Hãy tạo đúng 5 câu hỏi trắc nghiệm khách quan bám sát mục tiêu học tập và bẫy thi của Slot hiện tại (ưu tiên câu dự đoán output, phát hiện lỗi biên dịch JDK 8, bẫy đa hình/override/static/collections).',
  'Trả về DUY NHẤT JSON hợp lệ theo schema { "questions": [{ "id", "question", "codeSnippet", "options", "correctIndex", "explanation", "topicTag" }] }, không thêm chữ ngoài JSON.',
].join(' ');

const MOCK_EXAM_REVIEW_SYSTEM_INSTRUCTION = [
  'Bạn là Giám khảo chấm thi thực hành PE môn PRO192 (FPTU, chuẩn JDK 1.8).',
  'Hãy nhận xét kết quả thi thử của sinh viên ngắn gọn, sắc bén bằng Markdown tiếng Việt theo 4 mục:',
  '(1) **Tổng quan điểm & phân bố Q1–Q4**;',
  '(2) **Điểm mất đáng tiếc** (lỗi biên dịch javac, sai format toString/printf, thiếu kiểm tra null/chuỗi rỗng);',
  '(3) **Rủi ro hidden test khi thi thật trên PEA/EOS**;',
  '(4) **Lộ trình ôn lại trong 2 ngày** (chèn link Markdown nội bộ dạng `[Tên](/pe)` hoặc `[Code Studio](/studio/...)` theo danh sách câu yếu).',
].join(' ');

const STUDY_COACH_SYSTEM_INSTRUCTION = [
  'Bạn là Cố vấn Học tập PRO192 × JavaGuide cá nhân hóa trên JavaBrew.',
  'Từ tiến độ học và danh sách lỗi thực tế của sinh viên, hãy lập **Kế hoạch học 30 phút hôm nay** gồm đúng 3 chặng (0–10p, 10–20p, 20–30p) bằng Markdown tiếng Việt súc tích.',
  'Khi dẫn link học liệu, CHỈ dùng chính xác các đường dẫn nội bộ được cung cấp trong prompt (dạng `[Tiêu đề](/route)`), tuyệt đối không tự bịa URL mới.',
].join(' ');

const RAG_SEARCH_SYSTEM_INSTRUCTION = [
  'Bạn là trợ lý tra cứu tri thức nội bộ của JavaBrew (PRO192 × JavaGuide).',
  'Trả lời trực tiếp câu hỏi bằng tiếng Việt Markdown súc tích (dưới 250 từ), dựa sát trên các nguồn nội bộ được cung cấp bên dưới (kèm kiến thức JDK 8 cốt lõi nếu cần nối ý).',
  'BẮT BUỘC chèn link trích dẫn nội bộ bằng đúng đường dẫn có trong danh sách nguồn, ví dụ `[Tiêu đề](/docs/...)` hoặc `[Slot 09](/pro192/slots/slot-09)`. Không bịa đường dẫn không có trong danh sách.',
].join(' ');

const SLOT_QUIZ_JSON_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      description: 'Đúng 5 câu hỏi trắc nghiệm FE PRO192 (JDK 8).',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Mã câu hỏi như q1..q5' },
          question: { type: 'string', description: 'Câu hỏi ngắn gọn bằng tiếng Việt.' },
          codeSnippet: {
            type: 'string',
            description: 'Đoạn mã Java ngắn minh họa cho câu hỏi (chuỗi rỗng nếu câu lý thuyết thuần).',
          },
          options: {
            type: 'array',
            description: 'Đúng 4 lựa chọn phương án (không cần tiền tố A./B.).',
            items: { type: 'string' },
          },
          correctIndex: { type: 'integer', description: 'Chỉ số đáp án đúng từ 0 đến 3.' },
          explanation: {
            type: 'string',
            description: 'Giải thích rõ lý do đúng và bẫy hay gặp bằng tiếng Việt.',
          },
          topicTag: { type: 'string', description: 'Nhãn chủ đề ngắn, ví dụ OOP, JDK 8, Exception.' },
        },
        required: [
          'id',
          'question',
          'codeSnippet',
          'options',
          'correctIndex',
          'explanation',
          'topicTag',
        ],
      },
    },
  },
  required: ['questions'],
};

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

export interface LearnTutorContextPayload {
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

export interface ExerciseGradeContextPayload {
  exerciseId: string;
  slot: number;
  title: string;
  promptMd: string;
  solutionMd: string;
  userAnswer: string;
}

export interface SlotQuizContextPayload {
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

export interface MockExamQuestionSummary {
  peId: number;
  code: string;
  title: string;
  marks: number;
  earnedMarks: number;
  passedTests: number;
  totalTests: number;
  diagnostics?: string[];
  failedTests?: string[];
}

export interface MockExamReviewContextPayload {
  paper: string;
  totalScore: number;
  maxScore: number;
  elapsedSeconds: number;
  questions: MockExamQuestionSummary[];
}

export interface StudyCoachContextPayload {
  completedSlotsCount: number;
  totalSlots: number;
  nextSlot?: { slot: number; title: string; route: string };
  solvedExercisesCount: number;
  totalExercises: number;
  passedPeCount: number;
  totalPe: number;
  unresolvedMistakes: Array<{ peId: number; code?: string; title: string; detail: string }>;
  recentMock?: { paper: string; score: number; maxScore: number };
  suggestedDocs: Array<{ title: string; route: string }>;
}

export interface RagSearchSourcePayload {
  title: string;
  route: string;
  badge: string;
  snippet: string;
}

export interface RagSearchContextPayload {
  query: string;
  lang: 'vi' | 'en';
  sources: RagSearchSourcePayload[];
}

interface ValidatedAiRequest {
  action:
    | 'chat'
    | 'test'
    | 'learn'
    | 'grade-exercise'
    | 'slot-quiz'
    | 'mock-exam-review'
    | 'study-coach'
    | 'rag-search';
  model: AiMentorModel;
  mentorStyle: AiMentorStyle;
  stream: boolean;
  previousInteractionId?: string;
  codeChanged: boolean;
  prompt: string;
  context?: AiMentorContextPayload;
  learnContext?: LearnTutorContextPayload;
  exerciseContext?: ExerciseGradeContextPayload;
  quizContext?: SlotQuizContextPayload;
  mockReviewContext?: MockExamReviewContextPayload;
  studyCoachContext?: StudyCoachContextPayload;
  ragContext?: RagSearchContextPayload;
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

function isValidLearnIntent(val: unknown): val is LearnTutorIntent {
  return (
    val === 'explain-simple' ||
    val === 'java-example' ||
    val === 'exam-relevance' ||
    val === 'summarize' ||
    val === 'compare-table' ||
    val === 'glossary-en-vi' ||
    val === 'custom'
  );
}

function sanitizeStringArray(raw: unknown, maxItems: number, maxChars: number): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map((item) => item.trim().slice(0, maxChars));
  return cleaned.length > 0 ? cleaned : undefined;
}

export function sanitizeCacheKeyPart(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'default';
}

function validateAiPayload(
  raw: unknown
): { ok: true; data: ValidatedAiRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Payload phải là JSON object hợp lệ.' };
  }
  const rec = raw as Record<string, unknown>;
  const rawAction = rec.action;
  const action: ValidatedAiRequest['action'] =
    rawAction === 'test' ||
    rawAction === 'learn' ||
    rawAction === 'grade-exercise' ||
    rawAction === 'slot-quiz' ||
    rawAction === 'mock-exam-review' ||
    rawAction === 'study-coach' ||
    rawAction === 'rag-search'
      ? rawAction
      : 'chat';
  const model = isValidAiMentorModel(rec.model) ? rec.model : resolveDefaultServerModel();
  const mentorStyle: AiMentorStyle = rec.mentorStyle === 'socratic' ? 'socratic' : 'deep';
  const previousInteractionId =
    typeof rec.previousInteractionId === 'string' && rec.previousInteractionId.trim()
      ? rec.previousInteractionId.trim().slice(0, 200)
      : undefined;

  if (action === 'test') {
    return {
      ok: true,
      data: {
        action: 'test',
        model,
        mentorStyle,
        stream: false,
        codeChanged: false,
        prompt: '',
      },
    };
  }

  if (action === 'learn') {
    if (typeof rec.prompt !== 'string' || !rec.prompt.trim()) {
      return { ok: false, error: 'Thiếu câu hỏi (prompt) gửi tới AI Trợ lý bài học.' };
    }
    const prompt = rec.prompt.trim();
    if (prompt.length > MAX_PROMPT_CHARS) {
      return {
        ok: false,
        error: `Câu hỏi vượt quá giới hạn ${MAX_PROMPT_CHARS.toLocaleString('vi-VN')} ký tự.`,
      };
    }
    if (!rec.learnContext || typeof rec.learnContext !== 'object' || Array.isArray(rec.learnContext)) {
      return { ok: false, error: 'Thiếu ngữ cảnh bài học (learnContext).' };
    }
    const lc = rec.learnContext as Record<string, unknown>;
    const itemKey = typeof lc.itemKey === 'string' && lc.itemKey.trim() ? lc.itemKey.trim().slice(0, 160) : '';
    const title = typeof lc.title === 'string' && lc.title.trim() ? lc.title.trim().slice(0, 240) : '';
    if (!itemKey || !title) {
      return { ok: false, error: 'Thiếu mã hoặc tiêu đề bài học (itemKey / title).' };
    }
    const slotNumRaw = Number(lc.slotNumber);
    const learnContext: LearnTutorContextPayload = {
      kind: lc.kind === 'docs' ? 'docs' : 'pro192',
      itemKey,
      title,
      lang: lc.lang === 'en' ? 'en' : 'vi',
      domainLabel: typeof lc.domainLabel === 'string' ? lc.domainLabel.slice(0, 120) : undefined,
      slotNumber: Number.isInteger(slotNumRaw) && slotNumRaw >= 1 && slotNumRaw <= 30 ? slotNumRaw : undefined,
      objectives: sanitizeStringArray(lc.objectives, 10, 250),
      examTraps: sanitizeStringArray(lc.examTraps, 10, 250),
      excerpt: typeof lc.excerpt === 'string' ? lc.excerpt.slice(0, MAX_LEARN_EXCERPT_CHARS) : undefined,
      selectedText:
        typeof lc.selectedText === 'string' && lc.selectedText.trim()
          ? lc.selectedText.trim().slice(0, MAX_SELECTED_TEXT_CHARS)
          : undefined,
      intent: isValidLearnIntent(lc.intent) ? lc.intent : 'custom',
    };
    return {
      ok: true,
      data: {
        action: 'learn',
        model,
        mentorStyle,
        stream: rec.stream !== false,
        previousInteractionId,
        codeChanged: false,
        prompt,
        learnContext,
      },
    };
  }

  if (action === 'grade-exercise') {
    if (
      !rec.exerciseContext ||
      typeof rec.exerciseContext !== 'object' ||
      Array.isArray(rec.exerciseContext)
    ) {
      return { ok: false, error: 'Thiếu ngữ cảnh bài tập cần chấm (exerciseContext).' };
    }
    const ec = rec.exerciseContext as Record<string, unknown>;
    const exerciseId = typeof ec.exerciseId === 'string' ? ec.exerciseId.trim().slice(0, 40) : '';
    const title = typeof ec.title === 'string' ? ec.title.trim().slice(0, 240) : '';
    const promptMd = typeof ec.promptMd === 'string' ? ec.promptMd.trim().slice(0, MAX_EXERCISE_FIELD_CHARS) : '';
    const solutionMd =
      typeof ec.solutionMd === 'string' ? ec.solutionMd.trim().slice(0, MAX_EXERCISE_FIELD_CHARS) : '';
    const userAnswer =
      typeof ec.userAnswer === 'string' ? ec.userAnswer.trim().slice(0, MAX_EXERCISE_FIELD_CHARS) : '';
    if (!exerciseId || !title || !promptMd) {
      return { ok: false, error: 'Thiếu thông tin đề bài tập để AI chấm.' };
    }
    if (!userAnswer) {
      return { ok: false, error: 'Bạn hãy nhập câu trả lời hoặc đoạn code nháp trước khi nhờ AI chấm.' };
    }
    const slotNumRaw = Number(ec.slot);
    const exerciseContext: ExerciseGradeContextPayload = {
      exerciseId,
      slot: Number.isInteger(slotNumRaw) && slotNumRaw >= 1 && slotNumRaw <= 30 ? slotNumRaw : 1,
      title,
      promptMd,
      solutionMd,
      userAnswer,
    };
    return {
      ok: true,
      data: {
        action: 'grade-exercise',
        model,
        mentorStyle,
        stream: rec.stream !== false,
        codeChanged: false,
        prompt: 'Chấm bài tập',
        exerciseContext,
      },
    };
  }

  if (action === 'slot-quiz') {
    if (!rec.quizContext || typeof rec.quizContext !== 'object' || Array.isArray(rec.quizContext)) {
      return { ok: false, error: 'Thiếu ngữ cảnh Slot để sinh Mini-Quiz (quizContext).' };
    }
    const qc = rec.quizContext as Record<string, unknown>;
    const slotNum = Number(qc.slot);
    const title = typeof qc.title === 'string' ? qc.title.trim().slice(0, 240) : '';
    if (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 30 || !title) {
      return { ok: false, error: 'Thông tin Slot (1–30) hoặc tiêu đề không hợp lệ.' };
    }
    const quizContext: SlotQuizContextPayload = {
      slot: slotNum,
      title,
      objectives: sanitizeStringArray(qc.objectives, 10, 250),
      examTraps: sanitizeStringArray(qc.examTraps, 10, 250),
      examFocus: sanitizeStringArray(qc.examFocus, 8, 80),
      excerpt: typeof qc.excerpt === 'string' ? qc.excerpt.slice(0, 4_000) : undefined,
      regenerate: Boolean(qc.regenerate),
    };
    return {
      ok: true,
      data: {
        action: 'slot-quiz',
        model,
        mentorStyle,
        stream: false,
        codeChanged: false,
        prompt: 'Sinh Mini-Quiz FE',
        quizContext,
      },
    };
  }

  if (action === 'mock-exam-review') {
    if (
      !rec.mockReviewContext ||
      typeof rec.mockReviewContext !== 'object' ||
      Array.isArray(rec.mockReviewContext)
    ) {
      return { ok: false, error: 'Thiếu dữ liệu kết quả thi thử (mockReviewContext).' };
    }
    const mc = rec.mockReviewContext as Record<string, unknown>;
    const paper = typeof mc.paper === 'string' && mc.paper.trim() ? mc.paper.trim().slice(0, 20) : '';
    const maxScore = Number(mc.maxScore);
    const totalScore = Number(mc.totalScore);
    const elapsedSeconds = Number(mc.elapsedSeconds);
    if (!paper || !Number.isFinite(maxScore) || maxScore <= 0 || !Array.isArray(mc.questions) || mc.questions.length === 0) {
      return { ok: false, error: 'Dữ liệu bài thi thử PE chưa hợp lệ.' };
    }
    const questions: MockExamQuestionSummary[] = [];
    for (const rawQ of mc.questions.slice(0, 6)) {
      if (!rawQ || typeof rawQ !== 'object' || Array.isArray(rawQ)) continue;
      const q = rawQ as Record<string, unknown>;
      const code = typeof q.code === 'string' ? q.code.trim().slice(0, 24) : '';
      const title = typeof q.title === 'string' ? q.title.trim().slice(0, 160) : '';
      if (!code || !title) continue;
      questions.push({
        peId: Number(q.peId) || 1,
        code,
        title,
        marks: Math.max(0, Number(q.marks) || 0),
        earnedMarks: Math.max(0, Number(q.earnedMarks) || 0),
        passedTests: Math.max(0, Number(q.passedTests) || 0),
        totalTests: Math.max(0, Number(q.totalTests) || 0),
        diagnostics: sanitizeStringArray(q.diagnostics, 6, 200),
        failedTests: sanitizeStringArray(q.failedTests, 6, 220),
      });
    }
    if (questions.length === 0) {
      return { ok: false, error: 'Danh sách câu hỏi thi thử đang trống.' };
    }
    return {
      ok: true,
      data: {
        action: 'mock-exam-review',
        model,
        mentorStyle,
        stream: rec.stream !== false,
        codeChanged: false,
        prompt: `Nhận xét bài thi thử ${paper}`,
        mockReviewContext: {
          paper,
          totalScore: Math.max(0, Number.isFinite(totalScore) ? totalScore : 0),
          maxScore,
          elapsedSeconds: Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0),
          questions,
        },
      },
    };
  }

  if (action === 'study-coach') {
    if (
      !rec.studyCoachContext ||
      typeof rec.studyCoachContext !== 'object' ||
      Array.isArray(rec.studyCoachContext)
    ) {
      return { ok: false, error: 'Thiếu dữ liệu tiến độ học tập (studyCoachContext).' };
    }
    const sc = rec.studyCoachContext as Record<string, unknown>;
    const rawNext =
      sc.nextSlot && typeof sc.nextSlot === 'object' && !Array.isArray(sc.nextSlot)
        ? (sc.nextSlot as Record<string, unknown>)
        : null;
    const rawMock =
      sc.recentMock && typeof sc.recentMock === 'object' && !Array.isArray(sc.recentMock)
        ? (sc.recentMock as Record<string, unknown>)
        : null;
    const unresolvedMistakes: StudyCoachContextPayload['unresolvedMistakes'] = [];
    if (Array.isArray(sc.unresolvedMistakes)) {
      for (const item of sc.unresolvedMistakes.slice(0, 8)) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        const m = item as Record<string, unknown>;
        if (typeof m.title !== 'string') continue;
        unresolvedMistakes.push({
          peId: Number(m.peId) || 1,
          code: typeof m.code === 'string' ? m.code.slice(0, 24) : undefined,
          title: m.title.slice(0, 140),
          detail: typeof m.detail === 'string' ? m.detail.slice(0, 220) : '',
        });
      }
    }
    const suggestedDocs: StudyCoachContextPayload['suggestedDocs'] = [];
    if (Array.isArray(sc.suggestedDocs)) {
      for (const item of sc.suggestedDocs.slice(0, 5)) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        const d = item as Record<string, unknown>;
        if (typeof d.title !== 'string' || typeof d.route !== 'string') continue;
        suggestedDocs.push({
          title: d.title.slice(0, 140),
          route: d.route.slice(0, 180),
        });
      }
    }
    return {
      ok: true,
      data: {
        action: 'study-coach',
        model,
        mentorStyle,
        stream: rec.stream !== false,
        codeChanged: false,
        prompt: 'Lập kế hoạch 30 phút học tập hôm nay',
        studyCoachContext: {
          completedSlotsCount: Math.max(0, Number(sc.completedSlotsCount) || 0),
          totalSlots: Math.max(1, Number(sc.totalSlots) || 30),
          nextSlot:
            rawNext && typeof rawNext.title === 'string' && typeof rawNext.route === 'string'
              ? {
                  slot: Math.max(1, Number(rawNext.slot) || 1),
                  title: rawNext.title.slice(0, 140),
                  route: rawNext.route.slice(0, 140),
                }
              : undefined,
          solvedExercisesCount: Math.max(0, Number(sc.solvedExercisesCount) || 0),
          totalExercises: Math.max(1, Number(sc.totalExercises) || 150),
          passedPeCount: Math.max(0, Number(sc.passedPeCount) || 0),
          totalPe: Math.max(1, Number(sc.totalPe) || 19),
          unresolvedMistakes,
          recentMock:
            rawMock && typeof rawMock.paper === 'string'
              ? {
                  paper: rawMock.paper.slice(0, 20),
                  score: Math.max(0, Number(rawMock.score) || 0),
                  maxScore: Math.max(1, Number(rawMock.maxScore) || 10),
                }
              : undefined,
          suggestedDocs,
        },
      },
    };
  }

  if (action === 'rag-search') {
    if (!rec.ragContext || typeof rec.ragContext !== 'object' || Array.isArray(rec.ragContext)) {
      return { ok: false, error: 'Thiếu dữ liệu tìm kiếm (ragContext).' };
    }
    const rc = rec.ragContext as Record<string, unknown>;
    const query = typeof rc.query === 'string' ? rc.query.trim().slice(0, 500) : '';
    if (!query || query.length < 3) {
      return { ok: false, error: 'Câu hỏi tìm kiếm quá ngắn (tối thiểu 3 ký tự).' };
    }
    const sources: RagSearchSourcePayload[] = [];
    if (Array.isArray(rc.sources)) {
      for (const s of rc.sources.slice(0, MAX_RAG_SOURCES)) {
        if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
        const sr = s as Record<string, unknown>;
        if (typeof sr.title !== 'string' || typeof sr.route !== 'string') continue;
        sources.push({
          title: sr.title.trim().slice(0, 180),
          route: sr.route.trim().slice(0, 200),
          badge: typeof sr.badge === 'string' ? sr.badge.trim().slice(0, 40) : 'JavaBrew',
          snippet: typeof sr.snippet === 'string' ? sr.snippet.trim().slice(0, 800) : '',
        });
      }
    }
    return {
      ok: true,
      data: {
        action: 'rag-search',
        model,
        mentorStyle,
        stream: rec.stream !== false,
        codeChanged: false,
        prompt: query,
        ragContext: {
          query,
          lang: rc.lang === 'en' ? 'en' : 'vi',
          sources,
        },
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

  const checklist = sanitizeStringArray(ctxRec.checklist, 12, 250);
  const diagnosisHints = sanitizeStringArray(ctxRec.diagnosisHints, 6, 300) ?? [];

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
      mentorStyle,
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

export function buildLearnTutorPrompt(
  prompt: string,
  ctx: LearnTutorContextPayload,
  compactFollowUp = false
): string {
  const sections: string[] = [];
  const label =
    ctx.kind === 'pro192' && ctx.slotNumber
      ? `PRO192 Slot ${String(ctx.slotNumber).padStart(2, '0')} (JDK 1.8)`
      : `JavaGuide (${ctx.domainLabel || 'Java'}, bản ${ctx.lang.toUpperCase()})`;

  sections.push(`Ngữ cảnh bài học (${label}): ${ctx.title}`);

  if (!compactFollowUp) {
    if (ctx.objectives && ctx.objectives.length > 0) {
      sections.push(`Mục tiêu trọng tâm:\n${ctx.objectives.map((o) => `- ${o}`).join('\n')}`);
    }
    if (ctx.examTraps && ctx.examTraps.length > 0) {
      sections.push(`Bẫy thi hay gặp:\n${ctx.examTraps.map((t) => `- ${t}`).join('\n')}`);
    }
    if (ctx.excerpt && ctx.excerpt.trim()) {
      sections.push(`Trích đoạn nội dung bài học:\n${ctx.excerpt.slice(0, MAX_LEARN_EXCERPT_CHARS)}`);
    }
  }

  if (ctx.selectedText) {
    sections.push(`Đoạn văn bản / code người học vừa bôi đen:\n"""\n${ctx.selectedText}\n"""`);
  }

  const intentDirective: Record<LearnTutorIntent, string> = {
    'explain-simple':
      'Yêu cầu: Giải thích đoạn kiến thức trên thật dễ hiểu cho sinh viên mới học, kèm ví dụ đời thường ngắn.',
    'java-example':
      'Yêu cầu: Viết 1 ví dụ Java ngắn gọn, hoàn chỉnh chạy thử được ngay trong JavaBrew Live Lab (bắt buộc có `public class Main` và `public static void main(String[] args)`, không dùng `package`).',
    'exam-relevance':
      'Yêu cầu: Phân tích kiến thức này có hay ra thi FE/PE PRO192 không, ra dưới dạng câu hỏi nào và bẫy cần tránh.',
    summarize:
      'Yêu cầu: Tóm tắt thành đúng 5 ý cốt lõi súc tích nhất bằng gạch đầu dòng tiếng Việt để ôn nhanh trước giờ thi.',
    'compare-table':
      'Yêu cầu: Lập bảng so sánh Markdown (các khái niệm, ưu/nhược điểm hoặc bẫy thường gặp trong bài) để dễ ghi nhớ.',
    'glossary-en-vi':
      'Yêu cầu: Giải thích các thuật ngữ tiếng Anh chuyên ngành liên quan kèm nghĩa tiếng Việt chuẩn và ngữ cảnh dùng trong Java.',
    custom: 'Yêu cầu: Trả lời trực tiếp câu hỏi bên dưới dựa sát trên nội dung bài học.',
  };

  sections.push(intentDirective[ctx.intent || 'custom']);
  sections.push(`Câu hỏi của người học:\n${prompt}`);
  return sections.join('\n\n');
}

export function buildGradeExercisePrompt(ctx: ExerciseGradeContextPayload): string {
  return [
    `Bài tập ${ctx.exerciseId} (PRO192 Slot ${String(ctx.slot).padStart(2, '0')}): ${ctx.title}`,
    `Đề bài:\n${ctx.promptMd}`,
    ctx.solutionMd ? `Đáp án chuẩn tham khảo:\n${ctx.solutionMd}` : '',
    `Câu trả lời / code nháp của học viên:\n${ctx.userAnswer}`,
    'Hãy chấm điểm (0–10), chỉ ra điểm đúng, lỗi cần sửa và gợi ý bước tiếp theo.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildSlotQuizPrompt(ctx: SlotQuizContextPayload): string {
  const sections = [
    `Tạo đúng 5 câu hỏi trắc nghiệm FE (Final Exam PRO192, chuẩn JDK 8) cho Slot ${String(ctx.slot).padStart(2, '0')}: ${ctx.title}`,
  ];
  if (ctx.examFocus && ctx.examFocus.length > 0) {
    sections.push(`Trọng tâm đề thi: ${ctx.examFocus.join(', ')}`);
  }
  if (ctx.objectives && ctx.objectives.length > 0) {
    sections.push(`Mục tiêu kiến thức:\n${ctx.objectives.map((o) => `- ${o}`).join('\n')}`);
  }
  if (ctx.examTraps && ctx.examTraps.length > 0) {
    sections.push(`Bẫy thi thường gặp:\n${ctx.examTraps.map((t) => `- ${t}`).join('\n')}`);
  }
  if (ctx.excerpt && ctx.excerpt.trim()) {
    sections.push(`Tài liệu tham khảo của Slot:\n${ctx.excerpt.slice(0, 4_000)}`);
  }
  if (ctx.regenerate) {
    sections.push('Hãy ra bộ 5 câu hỏi MỚI khác biệt tình huống/ví dụ code so với đề mặc định.');
  }
  sections.push(
    'Trả về DUY NHẤT JSON hợp lệ dạng { "questions": [{ "id": "q1", "question": "...", "codeSnippet": "", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "...", "topicTag": "..." }] }.'
  );
  return sections.join('\n\n');
}

export function buildMockExamReviewPrompt(ctx: MockExamReviewContextPayload): string {
  const mins = Math.floor(ctx.elapsedSeconds / 60);
  const secs = ctx.elapsedSeconds % 60;
  const qBlocks = ctx.questions.map((q) => {
    const parts = [
      `- **${q.code}: ${q.title}** (${q.earnedMarks}/${q.marks}đ · Pass ${q.passedTests}/${q.totalTests} TC · Link ôn: \`/studio/${q.peId}\`)`,
    ];
    if (q.diagnostics?.length) {
      parts.push(`  Lỗi biên dịch: ${q.diagnostics.join(' | ')}`);
    }
    if (q.failedTests?.length) {
      parts.push(`  Test fail: ${q.failedTests.join(' | ')}`);
    }
    return parts.join('\n');
  });
  return [
    `Kết quả Phòng thi PE ảo **${ctx.paper}**: ${ctx.totalScore}/${ctx.maxScore} điểm (thời gian làm: ${mins} phút ${secs} giây).`,
    `Chi tiết từng câu:\n${qBlocks.join('\n')}`,
    'Hãy chấm & nhận xét như Giám khảo PE PRO192 thực thụ, cảnh báo lỗi ẩn dễ mất điểm và gợi ý 2–3 đường dẫn ôn lại chính xác.',
  ].join('\n\n');
}

export function buildStudyCoachPrompt(ctx: StudyCoachContextPayload): string {
  const parts = [
    `Tiến độ hiện tại: ${ctx.completedSlotsCount}/${ctx.totalSlots} Slots PRO192 · ${ctx.solvedExercisesCount}/${ctx.totalExercises} bài tập · ${ctx.passedPeCount}/${ctx.totalPe} câu PE Pass.`,
  ];
  if (ctx.nextSlot) {
    parts.push(
      `Slot kế tiếp chưa xong: Slot ${String(ctx.nextSlot.slot).padStart(2, '0')} (${ctx.nextSlot.title}) -> Link: \`${ctx.nextSlot.route}\``
    );
  }
  if (ctx.recentMock) {
    parts.push(
      `Điểm thi thử PE gần nhất: ${ctx.recentMock.paper} đạt ${ctx.recentMock.score}/${ctx.recentMock.maxScore} -> Link: \`/pe/mock\``
    );
  }
  if (ctx.unresolvedMistakes.length > 0) {
    parts.push(
      `Lỗi PE chưa khắc phục (${ctx.unresolvedMistakes.length}):\n${ctx.unresolvedMistakes
        .map(
          (m) =>
            `- [${m.code || `PE #${m.peId}`}] ${m.title}: ${m.detail} -> Link: \`/studio/${m.peId}\``
        )
        .join('\n')}`
    );
  }
  if (ctx.suggestedDocs.length > 0) {
    parts.push(
      `Bài JavaGuide gợi ý phù hợp:\n${ctx.suggestedDocs
        .map((d) => `- ${d.title} -> Link: \`${d.route}\``)
        .join('\n')}`
    );
  }
  parts.push(
    'Hãy lập kế hoạch học đúng 30 phút hôm nay (3 chặng: 0–10p, 10–20p, 20–30p), chèn link Markdown từ danh sách trên.'
  );
  return parts.join('\n\n');
}

export function buildRagSearchPrompt(ctx: RagSearchContextPayload): string {
  const sourceLines =
    ctx.sources.length > 0
      ? ctx.sources
          .map(
            (s, i) =>
              `[${i + 1}] (${s.badge}) **${s.title}** — Route: \`${s.route}\`\nNội dung: ${s.snippet}`
          )
          .join('\n\n')
      : 'Không có tài liệu nội bộ khớp trực tiếp; hãy hướng dẫn theo chuẩn JDK 8 PRO192 và gợi ý tìm thêm trong `/pro192` hoặc `/docs`.';

  return [
    `Câu hỏi của người học (${ctx.lang.toUpperCase()}): ${ctx.query}`,
    `Kho nguồn nội bộ JavaBrew:\n${sourceLines}`,
    'Hãy trả lời chính xác, dễ hiểu và trích dẫn link nội bộ bằng Markdown `[Tiêu đề](Route)`.',
  ].join('\n\n');
}

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // try extracting fenced JSON block
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // fall through to brace slice
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }

  return null;
}

export function validateSlotQuizPayload(
  raw: unknown,
  slot: number,
  title: string
): SlotQuizSet | null {
  let rawList: unknown[] | null = null;
  let generatedAt = new Date().toISOString();

  if (Array.isArray(raw)) {
    rawList = raw;
  } else if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    if (Array.isArray(rec.questions)) {
      rawList = rec.questions;
    }
    if (typeof rec.generatedAt === 'string' && rec.generatedAt.trim()) {
      generatedAt = rec.generatedAt.trim();
    }
  }

  if (!rawList) return null;

  const questions: SlotQuizQuestion[] = [];
  for (let i = 0; i < rawList.length && questions.length < 5; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const q = item as Record<string, unknown>;

    const questionText = typeof q.question === 'string' ? q.question.trim() : '';
    const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
    const idxNum = typeof q.correctIndex === 'number' ? q.correctIndex : Number(q.correctIndex);

    if (!questionText || !explanation || !Number.isInteger(idxNum) || idxNum < 0 || idxNum > 3) {
      continue;
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) continue;
    const cleanOpts = q.options.map((opt) =>
      typeof opt === 'string' ? opt.trim().slice(0, 300) : ''
    );
    if (cleanOpts.some((opt) => !opt)) continue;

    const codeSnippetRaw = typeof q.codeSnippet === 'string' ? q.codeSnippet.trim() : '';
    const topicTag =
      typeof q.topicTag === 'string' && q.topicTag.trim()
        ? q.topicTag.trim().slice(0, 60)
        : `Slot ${String(slot).padStart(2, '0')}`;
    const id =
      typeof q.id === 'string' && q.id.trim()
        ? q.id.trim().slice(0, 24)
        : `q${questions.length + 1}`;

    questions.push({
      id,
      question: questionText.slice(0, 800),
      codeSnippet: codeSnippetRaw ? codeSnippetRaw.slice(0, 1_200) : undefined,
      options: [cleanOpts[0], cleanOpts[1], cleanOpts[2], cleanOpts[3]],
      correctIndex: idxNum,
      explanation: explanation.slice(0, 800),
      topicTag,
    });
  }

  if (questions.length < 3) return null;

  return {
    slot,
    title,
    generatedAt,
    questions,
  };
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

const SSE_RESPONSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-store, no-transform',
  'X-Accel-Buffering': 'no',
} as const;

function buildSseSingleShotResponse(opts: {
  text: string;
  interactionId?: string;
  model: AiMentorModel;
  source: 'server' | 'byok';
  remaining?: number;
  limit?: number;
  cached?: boolean;
}): Response {
  const singleStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encodeSseEvent('meta', {
          source: opts.source,
          model: opts.model,
          remaining: opts.remaining,
          limit: opts.limit,
          ...(opts.cached ? { cached: true } : {}),
        })
      );
      controller.enqueue(encodeSseEvent('delta', { text: opts.text }));
      controller.enqueue(
        encodeSseEvent('done', {
          interactionId: opts.interactionId,
          model: opts.model,
          source: opts.source,
          remaining: opts.remaining,
          limit: opts.limit,
          ...(opts.cached ? { cached: true } : {}),
        })
      );
      controller.close();
    },
  });
  return new Response(singleStream, {
    status: 200,
    headers: SSE_RESPONSE_HEADERS,
  });
}

async function peekServerQuota(clientIp: string): Promise<{ dailyLimit: number; remaining: number }> {
  const dailyLimit = resolveDailyLimit();
  const q = await peekRateLimit({
    namespace: `ai-daily:${getUtcDateKey()}`,
    key: clientIp,
    limit: dailyLimit,
    windowSeconds: DAILY_WINDOW_SECONDS,
  });
  return { dailyLimit, remaining: q.remaining };
}

async function consumeServerQuota(
  clientIp: string,
  source: 'server' | 'byok'
): Promise<{ ok: true; dailyLimit?: number; remaining?: number } | { ok: false; response: Response }> {
  if (source !== 'server') {
    return { ok: true };
  }
  const dailyLimit = resolveDailyLimit();
  const quota = await consumeRateLimit({
    namespace: `ai-daily:${getUtcDateKey()}`,
    key: clientIp,
    limit: dailyLimit,
    windowSeconds: DAILY_WINDOW_SECONDS,
  });
  if (!quota.allowed) {
    await emitMetric('ai_mentor.request', 1, { source, outcome: 'quota_exceeded' });
    return {
      ok: false,
      response: Response.json(
        {
          error: `Bạn đã dùng hết ${dailyLimit} lượt AI miễn phí hôm nay. Bạn có thể quay lại vào ngày mai hoặc nhập Gemini API Key cá nhân trong Cài đặt để dùng không giới hạn.`,
          quotaExceeded: true,
          dailyLimit,
          remaining: 0,
        },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      ),
    };
  }
  return { ok: true, dailyLimit, remaining: quota.remaining };
}

async function callGeminiWithFallback(opts: {
  initialModel: AiMentorModel;
  wantStream: boolean;
  systemInstruction: string;
  input: string;
  previousInteractionId?: string;
  store: boolean;
  responseFormat?: unknown;
  apiKey: string;
  source: 'server' | 'byok';
  signal: AbortSignal;
}): Promise<{ upstream: Response; activeModel: AiMentorModel }> {
  const sendOnce = (targetModel: AiMentorModel, responseFormat?: unknown): Promise<Response> => {
    const endpoint = opts.wantStream
      ? `${GEMINI_INTERACTIONS_ENDPOINT}?alt=sse`
      : GEMINI_INTERACTIONS_ENDPOINT;

    const bodyPayload: Record<string, unknown> = {
      model: targetModel,
      system_instruction: opts.systemInstruction,
      input: opts.input,
      store: opts.store,
    };
    if (opts.wantStream) {
      bodyPayload.stream = true;
    }
    if (opts.previousInteractionId) {
      bodyPayload.previous_interaction_id = opts.previousInteractionId;
    }
    if (responseFormat !== undefined) {
      bodyPayload.response_format = responseFormat;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': opts.apiKey,
      'Api-Revision': GEMINI_API_REVISION,
    };
    if (opts.wantStream) {
      headers.Accept = 'text/event-stream';
    }

    return fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: opts.signal,
    });
  };

  let activeModel = opts.initialModel;
  let upstream = await sendOnce(activeModel, opts.responseFormat);

  if (!upstream.ok && upstream.status === 400 && opts.responseFormat !== undefined) {
    upstream = await sendOnce(activeModel, undefined);
  }

  if (
    !upstream.ok &&
    upstream.status === 429 &&
    opts.source === 'server' &&
    activeModel === 'gemini-4-hydrogen'
  ) {
    activeModel = 'gemini-3.5-flash-lite';
    upstream = await sendOnce(activeModel, opts.responseFormat);
    if (!upstream.ok && upstream.status === 400 && opts.responseFormat !== undefined) {
      upstream = await sendOnce(activeModel, undefined);
    }
  }

  return { upstream, activeModel };
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

  const isCacheableLearnSummary =
    payload.action === 'learn' &&
    payload.learnContext?.intent === 'summarize' &&
    !payload.previousInteractionId &&
    !payload.learnContext.selectedText;
  const learnSummaryCacheKey = isCacheableLearnSummary
    ? `learn-summary:v1:${sanitizeCacheKeyPart(payload.learnContext!.itemKey)}:${payload.learnContext!.lang}`
    : null;

  if (learnSummaryCacheKey) {
    const cachedSummary = await getCachedValue(learnSummaryCacheKey);
    if (cachedSummary) {
      const peek = source === 'server' ? await peekServerQuota(clientIp) : undefined;
      await emitMetric('ai_mentor.request', 1, {
        source,
        model: payload.model,
        action: 'learn',
        outcome: 'cache_hit',
      });
      return buildSseSingleShotResponse({
        text: cachedSummary,
        model: payload.model,
        source,
        remaining: peek?.remaining,
        limit: peek?.dailyLimit,
        cached: true,
      });
    }
  }

  const slotQuizCacheKey =
    payload.action === 'slot-quiz' && payload.quizContext
      ? `slot-quiz:v1:slot-${payload.quizContext.slot}`
      : null;

  const ragSearchCacheKey =
    payload.action === 'rag-search' && payload.ragContext
      ? `rag-search:v1:${payload.ragContext.lang}:${sanitizeCacheKeyPart(payload.ragContext.query)}`
      : null;

  if (ragSearchCacheKey) {
    const cachedRag = await getCachedValue(ragSearchCacheKey);
    if (cachedRag) {
      const peek = source === 'server' ? await peekServerQuota(clientIp) : undefined;
      await emitMetric('ai_mentor.request', 1, {
        source,
        model: payload.model,
        action: 'rag-search',
        outcome: 'cache_hit',
      });
      return buildSseSingleShotResponse({
        text: cachedRag,
        model: payload.model,
        source,
        remaining: peek?.remaining,
        limit: peek?.dailyLimit,
        cached: true,
      });
    }
  }

  if (slotQuizCacheKey && !payload.quizContext?.regenerate) {
    const cachedQuizRaw = await getCachedValue(slotQuizCacheKey);
    if (cachedQuizRaw) {
      try {
        const parsedCached = JSON.parse(cachedQuizRaw) as unknown;
        const validQuiz = validateSlotQuizPayload(
          parsedCached,
          payload.quizContext!.slot,
          payload.quizContext!.title
        );
        if (validQuiz) {
          const peek = source === 'server' ? await peekServerQuota(clientIp) : undefined;
          await emitMetric('ai_mentor.request', 1, {
            source,
            model: payload.model,
            action: 'slot-quiz',
            outcome: 'cache_hit',
          });
          return Response.json(
            {
              ok: true,
              quiz: validQuiz,
              cached: true,
              source,
              model: payload.model,
              remaining: peek?.remaining,
              limit: peek?.dailyLimit,
            },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
          );
        }
      } catch {
        // ignore malformed cache entry and regenerate cleanly
      }
    }
  }

  const quotaResult = await consumeServerQuota(clientIp, source);
  if (!quotaResult.ok) {
    return quotaResult.response;
  }
  const dailyLimit = quotaResult.dailyLimit;
  const remaining = quotaResult.remaining;

  let systemInstruction = SYSTEM_INSTRUCTION;
  let builtInput = '';
  let storeInteraction = true;
  let wantStream = payload.stream;
  let responseFormat: unknown = undefined;

  if (payload.action === 'learn' && payload.learnContext) {
    systemInstruction = LEARN_SYSTEM_INSTRUCTION;
    builtInput = buildLearnTutorPrompt(
      payload.prompt,
      payload.learnContext,
      Boolean(payload.previousInteractionId)
    );
  } else if (payload.action === 'grade-exercise' && payload.exerciseContext) {
    systemInstruction = GRADE_EXERCISE_SYSTEM_INSTRUCTION;
    builtInput = buildGradeExercisePrompt(payload.exerciseContext);
    storeInteraction = false;
  } else if (payload.action === 'slot-quiz' && payload.quizContext) {
    systemInstruction = SLOT_QUIZ_SYSTEM_INSTRUCTION;
    builtInput = buildSlotQuizPrompt(payload.quizContext);
    storeInteraction = false;
    wantStream = false;
    responseFormat = {
      type: 'text',
      mime_type: 'application/json',
      schema: SLOT_QUIZ_JSON_SCHEMA,
    };
  } else if (payload.action === 'mock-exam-review' && payload.mockReviewContext) {
    systemInstruction = MOCK_EXAM_REVIEW_SYSTEM_INSTRUCTION;
    builtInput = buildMockExamReviewPrompt(payload.mockReviewContext);
    storeInteraction = false;
  } else if (payload.action === 'study-coach' && payload.studyCoachContext) {
    systemInstruction = STUDY_COACH_SYSTEM_INSTRUCTION;
    builtInput = buildStudyCoachPrompt(payload.studyCoachContext);
    storeInteraction = false;
  } else if (payload.action === 'rag-search' && payload.ragContext) {
    systemInstruction = RAG_SEARCH_SYSTEM_INSTRUCTION;
    builtInput = buildRagSearchPrompt(payload.ragContext);
    storeInteraction = false;
  } else {
    systemInstruction =
      payload.mentorStyle === 'socratic'
        ? `${SYSTEM_INSTRUCTION} ${SOCRATIC_ADDENDUM}`
        : SYSTEM_INSTRUCTION;
    builtInput = buildServerContextPrompt(payload.prompt, payload.context!, {
      compactFollowUp: Boolean(payload.previousInteractionId),
      codeChanged: payload.codeChanged,
    });
  }

  let activeModel: AiMentorModel = payload.model;
  let upstream: Response;

  try {
    const called = await callGeminiWithFallback({
      initialModel: payload.model,
      wantStream,
      systemInstruction,
      input: builtInput,
      previousInteractionId: storeInteraction ? payload.previousInteractionId : undefined,
      store: storeInteraction,
      responseFormat,
      apiKey,
      source,
      signal: request.signal,
    });
    upstream = called.upstream;
    activeModel = called.activeModel;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    await emitMetric('ai_mentor.request', 1, {
      source,
      model: activeModel,
      action: payload.action,
      outcome: 'network_error',
    });
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
      action: payload.action,
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

  if (payload.action === 'slot-quiz' && payload.quizContext) {
    let data: InteractionApiResponse;
    try {
      data = (await upstream.json()) as InteractionApiResponse;
    } catch {
      return Response.json(
        { error: 'Gemini API trả về định dạng không hợp lệ khi tạo Mini-Quiz.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const rawReply = extractInteractionReply(data);
    const parsedJson = rawReply ? extractJsonObject(rawReply) : null;
    const quiz = validateSlotQuizPayload(
      parsedJson,
      payload.quizContext.slot,
      payload.quizContext.title
    );
    if (!quiz) {
      await emitMetric('ai_mentor.request', 1, {
        source,
        model: activeModel,
        action: 'slot-quiz',
        outcome: 'invalid_json',
      });
      return Response.json(
        { error: 'AI trả về bộ câu hỏi chưa đúng định dạng JSON. Hãy bấm thử lại.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (slotQuizCacheKey) {
      await setCachedValue(slotQuizCacheKey, JSON.stringify(quiz), SLOT_QUIZ_TTL_SECONDS);
    }
    await emitMetric('ai_mentor.request', 1, {
      source,
      model: activeModel,
      action: 'slot-quiz',
      outcome: 'ok',
    });
    return Response.json(
      {
        ok: true,
        quiz,
        cached: false,
        source,
        model: activeModel,
        remaining,
        limit: dailyLimit,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const contentType = (upstream.headers.get('content-type') || '').toLowerCase();

  // Non-streaming path or upstream returned plain JSON instead of SSE
  if (!wantStream || !contentType.includes('text/event-stream') || !upstream.body) {
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
      await emitMetric('ai_mentor.request', 1, {
        source,
        model: activeModel,
        action: payload.action,
        outcome: 'empty',
      });
      return Response.json(
        { error: 'Gemini API phản hồi trống (không tìm thấy nội dung trả lời). Hãy thử hỏi lại.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (learnSummaryCacheKey && reply.trim().length > 20) {
      await setCachedValue(learnSummaryCacheKey, reply.trim(), LEARN_SUMMARY_TTL_SECONDS);
    }
    if (ragSearchCacheKey && reply.trim().length > 20) {
      await setCachedValue(ragSearchCacheKey, reply.trim(), RAG_SEARCH_TTL_SECONDS);
    }
    await emitMetric('ai_mentor.request', 1, {
      source,
      model: activeModel,
      action: payload.action,
      outcome: 'ok',
    });

    if (wantStream) {
      return buildSseSingleShotResponse({
        text: reply,
        interactionId: typeof data.id === 'string' ? data.id : undefined,
        model: activeModel,
        source,
        remaining,
        limit: dailyLimit,
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
      let collectedText = '';
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
          if (
            (!deltaType || deltaType === 'text') &&
            typeof evt.delta?.text === 'string' &&
            evt.delta.text.length > 0
          ) {
            hasEmittedText = true;
            collectedText += evt.delta.text;
            safeEnqueue(encodeSseEvent('delta', { text: evt.delta.text }));
          }
          return;
        }

        if (eventType === 'interaction.completed' || eventType === 'interaction.complete') {
          if (!hasEmittedText && evt.interaction) {
            const fallbackReply = extractInteractionReply(evt.interaction);
            if (fallbackReply) {
              hasEmittedText = true;
              collectedText += fallbackReply;
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
          await emitMetric('ai_mentor.request', 1, {
            source,
            model: activeModel,
            action: payload.action,
            outcome: 'empty',
          });
        } else if (!errored) {
          if (learnSummaryCacheKey && collectedText.trim().length > 20) {
            await setCachedValue(
              learnSummaryCacheKey,
              collectedText.trim(),
              LEARN_SUMMARY_TTL_SECONDS
            );
          }
          if (ragSearchCacheKey && collectedText.trim().length > 20) {
            await setCachedValue(
              ragSearchCacheKey,
              collectedText.trim(),
              RAG_SEARCH_TTL_SECONDS
            );
          }
          safeEnqueue(
            encodeSseEvent('done', {
              interactionId,
              model: activeModel,
              source,
              remaining,
              limit: dailyLimit,
            })
          );
          await emitMetric('ai_mentor.request', 1, {
            source,
            model: activeModel,
            action: payload.action,
            outcome: 'ok',
          });
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
    headers: SSE_RESPONSE_HEADERS,
  });
}
