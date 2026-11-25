export interface JavaSourceFile {
  name: string;
  content: string;
}

export interface JavaDiagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface JavaTestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  expected?: string;
  actual?: string;
  error?: string;
}

export interface CompileRequestPayload {
  mode: 'run' | 'grade';
  peId?: number;
  files: JavaSourceFile[];
  stdin: string;
}

export const MAX_SOURCE_FILES = 5;
export const MAX_PE_ID = 19;
export const MAX_FILE_CHARS = 10_000;
export const MAX_TOTAL_SOURCE_BYTES = 65_536; // 64 KB
export const MAX_STDIN_BYTES = 8_192; // 8 KB

const FILE_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*\.java$/;
const utf8Encoder = new TextEncoder();

export function utf8ByteLength(text: string): number {
  return utf8Encoder.encode(text).length;
}

export function stripJavaComments(code: string): string {
  return code.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n\r]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (match) => (match.startsWith('//') || match.startsWith('/*') ? match.replace(/[^\n\r]/g, ' ') : match)
  );
}

export function inferJavaFileName(sourceCode: string, fallbackName = 'Main.java'): string {
  const cleaned = stripJavaComments(sourceCode);
  const match = cleaned.match(
    /\bpublic\s+(?:(?:final|abstract|sealed|non-sealed)\s+)*(?:class|interface|enum|record)\s+([A-Za-z_][A-Za-z0-9_]*)\b/
  );
  if (match && match[1]) {
    const candidate = `${match[1]}.java`;
    if (FILE_NAME_REGEX.test(candidate)) {
      return candidate;
    }
  }
  return fallbackName;
}

export function hasMainMethod(sourceCode: string): boolean {
  const cleaned = stripJavaComments(sourceCode);
  return (
    /\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(\s*String(?:\s*\[\s*\]|\s*\.\.\.)\s+[A-Za-z_][A-Za-z0-9_]*\s*\)/.test(
      cleaned
    ) ||
    /\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(\s*String\s+[A-Za-z_][A-Za-z0-9_]*\s*\[\s*\]\s*\)/.test(
      cleaned
    )
  );
}

export function validateCompilePayload(
  raw: unknown
): { ok: true; data: CompileRequestPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Payload phải là JSON object hợp lệ.' };
  }

  const record = raw as Record<string, unknown>;
  const mode = record.mode;
  if (mode !== 'run' && mode !== 'grade') {
    return { ok: false, error: 'Chế độ chạy (mode) phải là "run" hoặc "grade".' };
  }

  let peId: number | undefined;
  if (record.peId !== undefined && record.peId !== null) {
    if (
      typeof record.peId !== 'number' ||
      !Number.isInteger(record.peId) ||
      record.peId < 1 ||
      record.peId > MAX_PE_ID
    ) {
      return { ok: false, error: `peId không hợp lệ (chỉ hỗ trợ đề PE 1 đến ${MAX_PE_ID}).` };
    }
    peId = record.peId;
  } else if (mode === 'grade') {
    return { ok: false, error: 'Chế độ chấm test PE yêu cầu peId hợp lệ.' };
  }

  if (!Array.isArray(record.files) || record.files.length === 0) {
    return { ok: false, error: 'Cần ít nhất 1 tệp mã nguồn .java.' };
  }
  if (record.files.length > MAX_SOURCE_FILES) {
    return { ok: false, error: `Tối đa ${MAX_SOURCE_FILES} tệp mã nguồn mỗi lần biên dịch.` };
  }

  const seenLower = new Set<string>();
  const validatedFiles: JavaSourceFile[] = [];
  let totalBytes = 0;

  for (const item of record.files) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, error: 'Mỗi phần tử trong files phải gồm { name, content }.' };
    }
    const f = item as Record<string, unknown>;
    if (typeof f.name !== 'string' || !FILE_NAME_REGEX.test(f.name)) {
      return {
        ok: false,
        error: `Tên tệp không hợp lệ (${String(f.name)}). Chỉ chấp nhận tên lớp Java chuẩn (*.java).`,
      };
    }
    if (f.name.startsWith('__JavaBrew')) {
      return { ok: false, error: `Tên tệp ${f.name} được dành riêng cho hệ thống chấm.` };
    }
    const lower = f.name.toLowerCase();
    if (seenLower.has(lower)) {
      return { ok: false, error: `Trùng tên tệp mã nguồn: ${f.name}.` };
    }
    seenLower.add(lower);

    if (typeof f.content !== 'string') {
      return { ok: false, error: `Nội dung tệp ${f.name} phải là chuỗi văn bản.` };
    }
    if (f.content.length > MAX_FILE_CHARS) {
      return {
        ok: false,
        error: `Tệp ${f.name} vượt quá giới hạn tối đa ${MAX_FILE_CHARS.toLocaleString('vi-VN')} ký tự. Hãy rút gọn mã nguồn rồi thử lại.`,
      };
    }

    totalBytes += utf8ByteLength(f.content);
    if (totalBytes > MAX_TOTAL_SOURCE_BYTES) {
      return { ok: false, error: 'Tổng dung lượng mã nguồn vượt quá giới hạn 64 KB.' };
    }

    validatedFiles.push({ name: f.name, content: f.content });
  }

  let stdin = '';
  if (record.stdin !== undefined && record.stdin !== null) {
    if (typeof record.stdin !== 'string') {
      return { ok: false, error: 'stdin phải là chuỗi văn bản.' };
    }
    if (utf8ByteLength(record.stdin) > MAX_STDIN_BYTES) {
      return { ok: false, error: 'Dữ liệu stdin vượt quá giới hạn 8 KB.' };
    }
    stdin = record.stdin;
  }

  return {
    ok: true,
    data: {
      mode,
      peId,
      files: validatedFiles,
      stdin,
    },
  };
}

const JAVAC_HEADER_REGEX =
  /^(?:.*[/\\])?([A-Za-z_][A-Za-z0-9_]*\.java):(\d+):\s*(error|warning|note):\s*(.+)$/;

export function parseJavacDiagnostics(
  stderr: string,
  fallbackPrimaryFile = 'Main.java'
): JavaDiagnostic[] {
  if (!stderr) return [];

  const lines = stderr.split(/\r?\n/);
  const diagnostics: JavaDiagnostic[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(JAVAC_HEADER_REGEX);
    if (!match) continue;

    const rawFile = match[1];
    const lineNum = Math.max(1, Number.parseInt(match[2], 10) || 1);
    const rawSeverity = match[3];
    const message = match[4].trim();

    if (rawSeverity === 'note') {
      continue;
    }

    const severity: 'error' | 'warning' = rawSeverity === 'error' ? 'error' : 'warning';

    // Map grader compilation errors cleanly back to the student's primary file
    if (rawFile.startsWith('__JavaBrew')) {
      if (severity === 'error') {
        diagnostics.push({
          file: fallbackPrimaryFile,
          line: 1,
          column: 1,
          severity: 'error',
          message: `Chữ ký class hoặc phương thức chưa khớp đề bài PE (${message}).`,
        });
      }
      continue;
    }

    let column = 1;
    for (let lookahead = 1; lookahead <= 3 && i + lookahead < lines.length; lookahead++) {
      const nextLine = lines[i + lookahead];
      if (JAVAC_HEADER_REGEX.test(nextLine)) break;
      const caretMatch = nextLine.match(/^([ \t]*)\^/);
      if (caretMatch) {
        column = caretMatch[1].length + 1;
        break;
      }
    }

    diagnostics.push({
      file: rawFile,
      line: lineNum,
      column,
      severity,
      message,
    });
  }

  return diagnostics;
}
