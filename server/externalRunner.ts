import {
  parseJavacDiagnostics,
  type JavaDiagnostic,
  type JavaSourceFile,
  type JavaTestCaseResult,
} from './javaValidation';

export type ExternalRunnerProvider = 'piston' | 'judge0';

export interface ExternalRunnerConfig {
  provider: ExternalRunnerProvider;
  url: string;
  apiKey?: string;
  judge0LanguageId: number;
}

export interface ExternalExecutionOutput {
  ok: boolean;
  phase: 'compile' | 'run';
  jdkVersion: string;
  compileMs: number;
  runMs: number;
  exitCode: number;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  diagnostics: JavaDiagnostic[];
  testResults?: JavaTestCaseResult[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractTestMarkerBlock(
  rawStdout: string,
  markerToken?: string
): {
  cleanedStdout: string;
  testResults?: JavaTestCaseResult[];
} {
  const startTag = markerToken ? `__JB_TESTS_${markerToken}_START__` : '__JB_TESTS_START__';
  const endTag = markerToken ? `__JB_TESTS_${markerToken}_END__` : '__JB_TESTS_END__';
  const blockRegex = new RegExp(
    `${escapeRegex(startTag)}\\s*([\\s\\S]*?)\\s*${escapeRegex(endTag)}\\r?\\n?`,
    'g'
  );
  const matches = Array.from(rawStdout.matchAll(blockRegex));
  if (matches.length === 0) {
    return { cleanedStdout: rawStdout };
  }
  const cleanedStdout = rawStdout.replace(blockRegex, '').trimEnd();
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(matches[i][1]) as JavaTestCaseResult[];
      if (Array.isArray(parsed)) {
        return { cleanedStdout, testResults: parsed };
      }
    } catch {
      // Ignore malformed marker output and try preceding block
    }
  }
  return { cleanedStdout };
}

export function resolveExternalRunnerConfig(
  env: Record<string, string | undefined> = {}
): ExternalRunnerConfig | null {
  const rawUrl = env.JAVA_RUNNER_URL?.trim();
  if (!rawUrl) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return null;
  }

  const rawProvider = env.JAVA_RUNNER_PROVIDER?.trim().toLowerCase();
  let provider: ExternalRunnerProvider;
  if (rawProvider === 'judge0' || rawProvider === 'piston') {
    provider = rawProvider;
  } else if (/judge0|rapidapi|\/submissions/i.test(rawUrl)) {
    provider = 'judge0';
  } else {
    provider = 'piston';
  }

  const parsedLangId = Number.parseInt(env.JUDGE0_JAVA_LANGUAGE_ID || '', 10);
  const judge0LanguageId = Number.isFinite(parsedLangId) && parsedLangId > 0 ? parsedLangId : 91;

  return {
    provider,
    url: rawUrl.replace(/\/+$/, ''),
    apiKey: env.JAVA_RUNNER_API_KEY?.trim() || undefined,
    judge0LanguageId,
  };
}

export function buildPistonPayload(
  files: JavaSourceFile[],
  entryClass: string,
  stdin: string
): {
  language: string;
  version: string;
  files: Array<{ name: string; content: string }>;
  stdin: string;
  compile_timeout: number;
  run_timeout: number;
} {
  const targetName = `${entryClass}.java`.toLowerCase();
  const entryIdx = files.findIndex((f) => f.name.toLowerCase() === targetName);
  const ordered =
    entryIdx > 0
      ? [files[entryIdx], ...files.slice(0, entryIdx), ...files.slice(entryIdx + 1)]
      : [...files];

  return {
    language: 'java',
    version: '*',
    files: ordered.map((f) => ({ name: f.name, content: f.content })),
    stdin,
    compile_timeout: 10_000,
    run_timeout: 8_000,
  };
}

export function mergeJavaFilesForJudge0(files: JavaSourceFile[], entryClass: string): string {
  if (files.length === 1 && entryClass === 'Main') {
    return files[0].content;
  }

  const imports = new Set<string>();
  const bodyChunks: string[] = [];

  for (const file of files) {
    const cleanedLines: string[] = [];
    for (const line of file.content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (/^package\s+[A-Za-z_][A-Za-z0-9_.]*\s*;/.test(trimmed)) {
        continue;
      }
      if (/^import\s+(?:static\s+)?[A-Za-z_][A-Za-z0-9_.*]*\s*;/.test(trimmed)) {
        imports.add(trimmed);
        continue;
      }
      cleanedLines.push(line);
    }

    let body = cleanedLines.join('\n').trim();
    body = body.replace(
      /^([ \t]*)public\s+((?:final\s+|abstract\s+|static\s+|sealed\s+|non-sealed\s+)*(?:class|interface|enum|record)\s+([A-Za-z_][A-Za-z0-9_]*)\b)/gm,
      (full, indent: string, decl: string, typeName: string) => {
        if (entryClass === 'Main' && typeName === 'Main') {
          return full;
        }
        return `${indent}${decl}`;
      }
    );

    if (body) {
      bodyChunks.push(`// --- ${file.name} ---\n${body}`);
    }
  }

  const parts: string[] = [];
  if (imports.size > 0) {
    parts.push(Array.from(imports).join('\n'));
  }
  parts.push(...bodyChunks);

  if (entryClass !== 'Main') {
    parts.push(
      `public class Main {\n    public static void main(String[] args) throws Exception {\n        ${entryClass}.main(args);\n    }\n}`
    );
  }

  return `${parts.join('\n\n')}\n`;
}

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function fromBase64Utf8(encoded?: string | null): string {
  if (!encoded) return '';
  try {
    const binary = atob(encoded.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return encoded;
  }
}

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 12_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 140)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

interface PistonResponse {
  language?: string;
  version?: string;
  compile?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    output?: string;
    signal?: string | null;
  };
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    output?: string;
    signal?: string | null;
  };
}

interface Judge0Response {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  status?: {
    id?: number;
    description?: string;
  };
}

export async function executeViaExternalRunner(params: {
  config: ExternalRunnerConfig;
  files: JavaSourceFile[];
  entryClass: string;
  primaryFileName: string;
  stdin: string;
  mode: 'run' | 'grade';
  markerToken?: string;
}): Promise<ExternalExecutionOutput> {
  const { config, files, entryClass, primaryFileName, stdin, mode, markerToken } = params;
  const startedAt = performance.now();

  if (config.provider === 'judge0') {
    const mergedSource = mergeJavaFilesForJudge0(files, entryClass);
    const endpoint = config.url.includes('/submissions')
      ? `${config.url}${config.url.includes('?') ? '&' : '?'}base64_encoded=true&wait=true`
      : `${config.url}/submissions?base64_encoded=true&wait=true`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      const host = new URL(config.url).host;
      if (host.includes('rapidapi.com')) {
        headers['X-RapidAPI-Key'] = config.apiKey;
        headers['X-RapidAPI-Host'] = host;
      } else {
        headers['X-Auth-Token'] = config.apiKey;
      }
    }

    const data = await fetchJsonWithTimeout<Judge0Response>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language_id: config.judge0LanguageId,
        source_code: toBase64Utf8(mergedSource),
        stdin: toBase64Utf8(stdin),
      }),
    });

    const elapsedMs = Math.round(performance.now() - startedAt);
    const statusId = data.status?.id ?? 3;
    const compileOut = fromBase64Utf8(data.compile_output);
    const rawStdout = fromBase64Utf8(data.stdout);
    const rawStderr = fromBase64Utf8(data.stderr) || fromBase64Utf8(data.message);
    const jdkLabel = `OpenJDK (Judge0 #${config.judge0LanguageId})`;

    if (statusId === 6) {
      return {
        ok: false,
        phase: 'compile',
        jdkVersion: jdkLabel,
        compileMs: elapsedMs,
        runMs: 0,
        exitCode: 1,
        timedOut: false,
        stdout: '',
        stderr: compileOut || rawStderr || 'Compilation error.',
        diagnostics: parseJavacDiagnostics(compileOut || rawStderr, primaryFileName),
      };
    }

    const timedOut = statusId === 5;
    const { cleanedStdout, testResults } = extractTestMarkerBlock(rawStdout, markerToken);
    const runOk = !timedOut && statusId === 3;
    const ok =
      mode === 'grade'
        ? runOk && Boolean(testResults && testResults.length > 0 && testResults.every((t) => t.passed))
        : runOk;

    return {
      ok,
      phase: 'run',
      jdkVersion: jdkLabel,
      compileMs: Math.round(elapsedMs * 0.4),
      runMs: Math.round(Number.parseFloat(data.time || '0') * 1000) || Math.round(elapsedMs * 0.6),
      exitCode: runOk ? 0 : timedOut ? 124 : 1,
      timedOut,
      stdout: cleanedStdout,
      stderr: timedOut
        ? rawStderr || 'Chương trình vượt quá giới hạn thời gian thực thi (Time Limit Exceeded).'
        : rawStderr,
      diagnostics: [],
      testResults,
    };
  }

  // Piston v2
  const endpoint = /\/execute$/i.test(config.url) ? config.url : `${config.url}/api/v2/execute`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const data = await fetchJsonWithTimeout<PistonResponse>(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildPistonPayload(files, entryClass, stdin)),
  });

  const totalMs = Math.round(performance.now() - startedAt);
  const jdkLabel = `OpenJDK ${data.version || ''} (Piston Fallback)`.trim();

  if (data.compile && data.compile.code !== 0) {
    const compStderr = data.compile.stderr || data.compile.output || 'Biên dịch javac thất bại.';
    return {
      ok: false,
      phase: 'compile',
      jdkVersion: jdkLabel,
      compileMs: totalMs,
      runMs: 0,
      exitCode: data.compile.code ?? 1,
      timedOut: false,
      stdout: data.compile.stdout || '',
      stderr: compStderr,
      diagnostics: parseJavacDiagnostics(compStderr, primaryFileName),
    };
  }

  const runCode = data.run?.code ?? 0;
  const timedOut = data.run?.signal === 'SIGKILL' || data.run?.signal === 'SIGTERM';
  const rawStdout = data.run?.stdout || '';
  const rawStderr = data.run?.stderr || '';
  const { cleanedStdout, testResults } = extractTestMarkerBlock(rawStdout, markerToken);

  const ok =
    mode === 'grade'
      ? !timedOut &&
        runCode === 0 &&
        Boolean(testResults && testResults.length > 0 && testResults.every((t) => t.passed))
      : !timedOut && runCode === 0;

  return {
    ok,
    phase: 'run',
    jdkVersion: jdkLabel,
    compileMs: Math.round(totalMs * 0.35),
    runMs: Math.round(totalMs * 0.65),
    exitCode: runCode,
    timedOut,
    stdout: cleanedStdout,
    stderr: rawStderr,
    diagnostics: [],
    testResults,
  };
}
