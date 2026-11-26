import type { JavaDiagnostic, JavaTestCaseResult } from './javaCompilerService';

export type AiMentorModel = 'gemini-4-hydrogen' | 'gemini-3.5-flash-lite';

export const DEFAULT_AI_MODEL: AiMentorModel = 'gemini-4-hydrogen';

export const AI_MENTOR_MODELS: ReadonlyArray<{ id: AiMentorModel; label: string }> = [
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen (Khuyên dùng)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (Nhanh / Tiết kiệm)' },
];

export const GEMINI_INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/interactions';
export const GEMINI_API_REVISION = '2026-05-20';

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

const SYSTEM_INSTRUCTION = [
  'Bạn là AI Code Mentor chuyên môn Java OOP (môn PRO192 chuẩn JDK 1.8 và default package).',
  'Hãy trả lời ngắn gọn, chính xác, sư phạm bằng tiếng Việt và định dạng Markdown (dùng khối ```java ... ``` khi minh họa code).',
  'Ưu tiên chỉ rõ nguyên nhân lỗi biên dịch javac, test case đang fail hoặc lỗ hổng dữ liệu biên (null, chuỗi rỗng, chỉ số mảng) và gợi ý hướng sửa từng bước.',
  'Với các bài PE PRO192, không dùng API Java 9+ (như var, List.of, isBlank, toList) và nhắc bỏ package nếu có.',
].join(' ');

export function isValidAiMentorModel(value: string | null | undefined): value is AiMentorModel {
  return value === 'gemini-4-hydrogen' || value === 'gemini-3.5-flash-lite';
}

export function buildContextPrompt(prompt: string, context: AiMentorContext): string {
  const sections: string[] = [];

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

  if (context.files.length > 0) {
    const fileBlocks = context.files
      .map((f) => `--- ${f.name} ---\n\`\`\`java\n${f.content.slice(0, 6000)}\n\`\`\``)
      .join('\n\n');
    sections.push(`Mã nguồn hiện tại:\n${fileBlocks}`);
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

  if (context.diagnosisHints.length > 0) {
    sections.push(`Nhận xét phân tích tĩnh:\n${context.diagnosisHints.map((h) => `- ${h}`).join('\n')}`);
  }

  sections.push(`Câu hỏi của học viên:\n${prompt}`);
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

export async function askGeminiMentor(params: {
  apiKey: string;
  model: AiMentorModel;
  prompt: string;
  context: AiMentorContext;
  previousInteractionId?: string | null;
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
      system_instruction: SYSTEM_INSTRUCTION,
      input: buildContextPrompt(params.prompt, params.context),
      store: true,
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
