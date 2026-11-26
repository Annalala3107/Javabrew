import { execFile, execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { extractTestMarkerBlock } from './externalRunner';
import {
  hasMainMethod,
  parseJavacDiagnostics,
  utf8ByteLength,
  validateCompilePayload,
  validateJavaPolicy,
  type JavaDiagnostic,
  type JavaSourceFile,
} from './javaValidation';
import { buildPeHarness, getPeInterfaceFiles } from './peHarnesses';

const execFileAsync = promisify(execFile);
const MAX_OUTPUT_BYTES = 32_768;
const RUN_TIMEOUT_MS = 8_000;
const COMPILE_TIMEOUT_MS = 12_000;

let cachedJdkInfo: { available: boolean; version: string } | null = null;

export function detectLocalJdk(): { available: boolean; version: string } {
  if (cachedJdkInfo) return cachedJdkInfo;
  try {
    const out = execFileSync('javac', ['-version'], {
      encoding: 'utf8',
      timeout: 3_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    cachedJdkInfo = { available: true, version: out || 'Local OpenJDK' };
  } catch (err) {
    const maybe = err as { stderr?: string; stdout?: string; code?: string };
    const text = (maybe?.stderr || maybe?.stdout || '').trim();
    if (maybe?.code !== 'ENOENT' && /javac\s+\d+/i.test(text)) {
      cachedJdkInfo = { available: true, version: text };
    } else {
      cachedJdkInfo = { available: false, version: '' };
    }
  }
  return cachedJdkInfo;
}

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: false });

function truncateOutput(text: string): string {
  if (!text) return '';
  if (utf8ByteLength(text) <= MAX_OUTPUT_BYTES) return text;
  const encoded = utf8Encoder.encode(text);
  let cut = MAX_OUTPUT_BYTES;
  while (cut > 0 && (encoded[cut] & 0xc0) === 0x80) {
    cut -= 1;
  }
  const sliced = utf8Decoder.decode(encoded.subarray(0, cut));
  return `${sliced}\n... [đầu ra bị cắt bớt do vượt quá 32 KB]`;
}

function runJavaChild(
  args: string[],
  cwd: string,
  stdinText: string,
  signal?: AbortSignal
): Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = spawn('java', args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, RUN_TIMEOUT_MS);

    const onAbort = () => {
      child.kill();
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES * 2) {
        stdout += chunk.toString('utf8');
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES * 2) {
        stderr += chunk.toString('utf8');
      }
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve({ exitCode: 1, stdout, stderr: err.message, timedOut });
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve({
        exitCode: timedOut ? 124 : code ?? 1,
        stdout,
        stderr: timedOut
          ? stderr || 'Chương trình vượt quá giới hạn thời gian thực thi (8s). Hãy kiểm tra vòng lặp vô hạn.'
          : stderr,
        timedOut,
      });
    });

    if (stdinText) {
      child.stdin.write(stdinText);
    }
    child.stdin.end();
  });
}

export async function executeLocalJdkRequest(request: Request): Promise<Response> {
  const jdk = detectLocalJdk();
  if (!jdk.available) {
    return Response.json(
      {
        unavailable: true,
        unavailableReason: 'Máy local chưa cài đặt javac/OpenJDK.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: 'Request body phải là JSON hợp lệ.' }, { status: 400 });
  }

  const validated = validateCompilePayload(rawBody);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const payload = validated.data;
  const primaryFileName = payload.files[0].name;
  const policyViolations = validateJavaPolicy(payload.files, payload.peId);
  const pkgViolation = policyViolations.find((v) => v.code === 'PACKAGE_FORBIDDEN');
  if (pkgViolation) {
    return Response.json(
      {
        ok: false,
        phase: 'compile',
        jdkVersion: payload.peId ? `${jdk.version} (--release 8)` : jdk.version,
        compileMs: 0,
        runMs: 0,
        exitCode: 1,
        stdout: '',
        stderr: pkgViolation.message,
        diagnostics: [
          {
            file: pkgViolation.file,
            line: pkgViolation.line,
            column: 1,
            severity: 'error',
            message: pkgViolation.message,
          },
        ] satisfies JavaDiagnostic[],
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (payload.mode === 'grade') {
    const binViolation = policyViolations.find((v) => v.code === 'PE3_Q4_BINARY_API');
    if (binViolation) {
      return Response.json(
        {
          ok: false,
          phase: 'run',
          jdkVersion: `${jdk.version} (--release 8)`,
          compileMs: 0,
          runMs: 0,
          exitCode: 1,
          timedOut: false,
          stdout: '',
          stderr: binViolation.message,
          diagnostics: [
            {
              file: binViolation.file,
              line: binViolation.line,
              column: 1,
              severity: 'error',
              message: binViolation.message,
            },
          ] satisfies JavaDiagnostic[],
          testResults: [
            {
              id: 'POLICY',
              name: 'Quy chế PE3-Q4: Tự viết thuật toán đổi nhị phân thủ công',
              passed: false,
              durationMs: 0,
              expected: 'Dùng vòng lặp % 2 và / 2',
              actual: 'Phát hiện Integer.toBinaryString / Integer.toString(..., 2)',
              error: binViolation.message,
            },
          ],
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  const markerToken = payload.mode === 'grade' ? randomBytes(12).toString('hex') : undefined;
  const effectiveFiles: JavaSourceFile[] = payload.files.map((f) => ({
    name: f.name,
    content: f.content,
  }));
  const seenNames = new Set(effectiveFiles.map((f) => f.name.toLowerCase()));

  const appendExtraFiles = (extraFiles?: Array<{ path: string; content: string }>) => {
    if (!extraFiles) return;
    for (const extra of extraFiles) {
      const baseName = path.posix.basename(extra.path);
      if (!baseName.endsWith('.java') || seenNames.has(baseName.toLowerCase())) continue;
      seenNames.add(baseName.toLowerCase());
      effectiveFiles.push({ name: baseName, content: extra.content });
    }
  };

  let entryClass = primaryFileName.replace(/\.java$/, '');
  let useUserStdin = false;

  if (payload.mode === 'grade') {
    const harness = buildPeHarness(payload.peId!, 'grade', markerToken);
    if (!harness) {
      return Response.json(
        { error: `Không tìm thấy bộ chấm cho PE ${payload.peId}.` },
        { status: 400 }
      );
    }
    effectiveFiles.push({ name: harness.fileName, content: harness.content });
    appendExtraFiles(harness.extraFiles);
    entryClass = harness.entryClass;
  } else {
    const fileWithMain = payload.files.find((f) => hasMainMethod(f.content));
    if (fileWithMain) {
      entryClass = fileWithMain.name.replace(/\.java$/, '');
      useUserStdin = payload.stdin.length > 0;
      if (payload.peId) {
        appendExtraFiles(getPeInterfaceFiles(payload.peId));
      }
    } else if (payload.peId) {
      const smoke = buildPeHarness(payload.peId, 'run');
      if (smoke) {
        effectiveFiles.push({ name: smoke.fileName, content: smoke.content });
        appendExtraFiles(smoke.extraFiles);
        entryClass = smoke.entryClass;
      }
    } else {
      return Response.json(
        {
          ok: false,
          phase: 'compile',
          jdkVersion: jdk.version,
          compileMs: 0,
          runMs: 0,
          exitCode: 1,
          stdout: '',
          stderr: 'Không tìm thấy hàm public static void main(String[] args) để chạy thử.',
          diagnostics: [
            {
              file: primaryFileName,
              line: 1,
              column: 1,
              severity: 'error',
              message: 'Cần có hàm public static void main(String[] args) để chạy ở chế độ tự do.',
            },
          ] satisfies JavaDiagnostic[],
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  const tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'jb-dev-'));
  const outDir = path.join(tmpRoot, 'out');

  try {
    await fsp.mkdir(outDir, { recursive: true });
    for (const file of effectiveFiles) {
      await fsp.writeFile(path.join(tmpRoot, file.name), file.content, 'utf8');
    }

    const tCompile = performance.now();
    const javacArgs = [
      ...(payload.peId ? ['--release', '8'] : []),
      '-encoding',
      'UTF-8',
      '-Xlint:all',
      '-d',
      outDir,
      ...effectiveFiles.map((f) => f.name),
    ];

    let compileStdout = '';
    let compileStderr = '';
    let compileExit = 0;

    try {
      const compRes = await execFileAsync('javac', javacArgs, {
        cwd: tmpRoot,
        timeout: COMPILE_TIMEOUT_MS,
        encoding: 'utf8',
      });
      compileStdout = compRes.stdout || '';
      compileStderr = compRes.stderr || '';
    } catch (err) {
      const compErr = err as { stdout?: string; stderr?: string; code?: number };
      compileExit = typeof compErr.code === 'number' ? compErr.code : 1;
      compileStdout = compErr.stdout || '';
      compileStderr = compErr.stderr || 'Biên dịch javac thất bại.';
    }

    const compileMs = Math.round(performance.now() - tCompile);
    const diagnostics = parseJavacDiagnostics(compileStderr, primaryFileName);
    const jdkLabel = payload.peId ? `${jdk.version} (--release 8)` : jdk.version;

    if (compileExit !== 0) {
      return Response.json(
        {
          ok: false,
          phase: 'compile',
          jdkVersion: jdkLabel,
          compileMs,
          runMs: 0,
          exitCode: compileExit,
          stdout: truncateOutput(compileStdout),
          stderr: truncateOutput(compileStderr),
          diagnostics,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const tRun = performance.now();
    const jvmArgs = ['-Xms32m', '-Xmx256m', '-Dfile.encoding=UTF-8', '-cp', outDir, entryClass];
    const runRes = await runJavaChild(
      jvmArgs,
      tmpRoot,
      useUserStdin ? payload.stdin : '',
      request.signal
    );
    const runMs = Math.round(performance.now() - tRun);
    const { cleanedStdout, testResults } = extractTestMarkerBlock(runRes.stdout, markerToken);

    const ok =
      payload.mode === 'grade'
        ? !runRes.timedOut &&
          runRes.exitCode === 0 &&
          Boolean(testResults && testResults.length > 0 && testResults.every((t) => t.passed))
        : !runRes.timedOut && runRes.exitCode === 0;

    return Response.json(
      {
        ok,
        phase: 'run',
        jdkVersion: jdkLabel,
        compileMs,
        runMs,
        exitCode: runRes.exitCode,
        timedOut: runRes.timedOut,
        stdout: truncateOutput(cleanedStdout),
        stderr: truncateOutput(runRes.stderr),
        diagnostics,
        testResults,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } finally {
    await fsp.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
  }
}
