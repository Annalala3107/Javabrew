import type { Sandbox as SandboxType } from '@vercel/sandbox';
import {
  hasMainMethod,
  parseJavacDiagnostics,
  utf8ByteLength,
  validateCompilePayload,
  type JavaDiagnostic,
  type JavaTestCaseResult,
} from './javaValidation';
import { buildPeHarness } from './peHarnesses';

const BASE_SANDBOX_NAME = 'javabrew-openjdk21-base';
const SANDBOX_REGION = 'sin1' as const;
const MAX_OUTPUT_BYTES = 32_768;
const RUN_TIMEOUT_MS = 15_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const ipBuckets = new Map<string, { count: number; resetAt: number }>();
let bootstrapPromise: Promise<void> | null = null;

function hasExplicitTokenParams(): boolean {
  return Boolean(
    process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID && process.env.VERCEL_TEAM_ID
  );
}

function getExplicitCredentials():
  | { token: string; projectId: string; teamId: string }
  | Record<string, never> {
  if (hasExplicitTokenParams()) {
    return {
      token: process.env.VERCEL_TOKEN!,
      projectId: process.env.VERCEL_PROJECT_ID!,
      teamId: process.env.VERCEL_TEAM_ID!,
    };
  }
  return {};
}

function hasSandboxCredentials(request: Request): boolean {
  return Boolean(
    request.headers.get('x-vercel-oidc-token') ||
      process.env.VERCEL_OIDC_TOKEN ||
      hasExplicitTokenParams()
  );
}

function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    return fwd.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'anonymous';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (ipBuckets.size > 500) {
    for (const [key, bucket] of ipBuckets.entries()) {
      if (bucket.resetAt <= now) {
        ipBuckets.delete(key);
      }
    }
  }
  const existing = ipBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return false;
  }
  existing.count += 1;
  return true;
}

function truncateOutput(text: string): string {
  if (!text) return '';
  if (utf8ByteLength(text) <= MAX_OUTPUT_BYTES) return text;
  const sliced = text.slice(0, MAX_OUTPUT_BYTES);
  return `${sliced}\n... [đầu ra bị cắt bớt do vượt quá 32 KB]`;
}

function sanitizeErrorSummary(raw: string): string {
  return raw
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
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
    // Metrics are best-effort and no-op outside supported Vercel runtimes
  }
}

function extractTestMarkerBlock(rawStdout: string): {
  cleanedStdout: string;
  testResults?: JavaTestCaseResult[];
} {
  const match = rawStdout.match(/__JB_TESTS_START__\s*([\s\S]*?)\s*__JB_TESTS_END__/);
  if (!match) {
    return { cleanedStdout: rawStdout };
  }
  const cleanedStdout = rawStdout
    .replace(/__JB_TESTS_START__[\s\S]*?__JB_TESTS_END__\r?\n?/g, '')
    .trimEnd();
  try {
    const parsed = JSON.parse(match[1]) as JavaTestCaseResult[];
    if (Array.isArray(parsed)) {
      return { cleanedStdout, testResults: parsed };
    }
  } catch {
    // Ignore malformed marker output and surface stdout directly
  }
  return { cleanedStdout };
}

async function ensureOpenJdkBaseSandbox(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  bootstrapPromise = (async () => {
    const { Sandbox } = await import('@vercel/sandbox');
    const creds = getExplicitCredentials();
    const base = await Sandbox.getOrCreate({
      ...creds,
      name: BASE_SANDBOX_NAME,
      region: SANDBOX_REGION,
      resources: { vcpus: 2 },
      timeout: 180_000,
      keepLastSnapshots: { count: 1, expiration: 0 },
      onCreate: async (sbx) => {
        const upd = await sbx.runCommand({ cmd: 'apt-get', args: ['update'], sudo: true });
        if (upd.exitCode !== 0) {
          throw new Error(`apt-get update failed: ${await upd.stderr()}`);
        }
        const inst = await sbx.runCommand({
          cmd: 'bash',
          args: [
            '-c',
            'DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends openjdk-21-jdk-headless || DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends default-jdk-headless',
          ],
          sudo: true,
        });
        if (inst.exitCode !== 0) {
          throw new Error(`OpenJDK install failed: ${await inst.stderr()}`);
        }
        const ver = await sbx.runCommand('javac', ['-version']);
        if (ver.exitCode !== 0) {
          throw new Error(`javac verification failed: ${await ver.stderr()}`);
        }
        await sbx.stop();
      },
    });
    try {
      await base.stop();
    } catch {
      // Already stopped & snapshotted
    }
  })().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
}

async function acquireForkedSandbox(): Promise<{
  sandbox: SandboxType;
  jdkVersion: string;
}> {
  const { APIError, Sandbox } = await import('@vercel/sandbox');
  const creds = getExplicitCredentials();

  const forkOnce = () =>
    Sandbox.fork({
      ...creds,
      sourceSandbox: BASE_SANDBOX_NAME,
      persistent: false,
      networkPolicy: 'deny-all',
      timeout: 60_000,
      resources: { vcpus: 2 },
    });

  let sandbox: SandboxType;
  try {
    sandbox = await forkOnce();
  } catch (err) {
    if (err instanceof APIError && (err.response.status === 404 || err.response.status === 409)) {
      await ensureOpenJdkBaseSandbox();
      sandbox = await forkOnce();
    } else {
      throw err;
    }
  }

  const verCmd = await sandbox.runCommand('javac', ['-version']);
  if (verCmd.exitCode !== 0) {
    await sandbox.stop().catch(() => {});
    await sandbox.delete().catch(() => {});
    try {
      const stale = await Sandbox.get({ ...creds, name: BASE_SANDBOX_NAME });
      await stale.delete({ deleteOrphanSnapshots: true });
    } catch {
      // Ignore if absent
    }
    await ensureOpenJdkBaseSandbox();
    sandbox = await forkOnce();
    const retryVer = await sandbox.runCommand('javac', ['-version']);
    const verText = ((await retryVer.stdout()) || (await retryVer.stderr())).trim();
    return { sandbox, jdkVersion: verText || 'OpenJDK 21' };
  }

  const verText = ((await verCmd.stdout()) || (await verCmd.stderr())).trim();
  return { sandbox, jdkVersion: verText || 'OpenJDK 21' };
}

export async function GET(request: Request): Promise<Response> {
  return Response.json(
    {
      available: hasSandboxCredentials(request),
      runtime: 'OpenJDK 21 (Vercel Sandbox)',
      region: SANDBOX_REGION,
      nodeVersion: process.version,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = performance.now();

  if (!hasSandboxCredentials(request)) {
    await emitMetric('java_sandbox.run', 1, { mode: 'unknown', outcome: 'no_credentials' });
    return Response.json(
      {
        unavailable: true,
        unavailableReason: 'Chưa phát hiện VERCEL_OIDC_TOKEN trên môi trường này.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    await emitMetric('java_sandbox.run', 1, { mode: 'unknown', outcome: 'rate_limited' });
    return Response.json(
      {
        error:
          'Bạn gửi yêu cầu biên dịch quá nhanh. Vui lòng đợi tối đa 1 phút hoặc dùng Static Evaluator.',
      },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
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
  let sandbox: SandboxType | null = null;

  try {
    const acquired = await acquireForkedSandbox();
    sandbox = acquired.sandbox;
    const jdkVersion = acquired.jdkVersion;

    await sandbox.mkDir('/vercel/sandbox/work');
    await sandbox.mkDir('/vercel/sandbox/out');

    const workFiles: Array<{ path: string; content: string }> = payload.files.map((f) => ({
      path: `/vercel/sandbox/work/${f.name}`,
      content: f.content,
    }));
    const compileTargets: string[] = payload.files.map((f) => f.name);

    let entryClass = primaryFileName.replace(/\.java$/, '');
    let useUserStdin = false;

    if (payload.mode === 'grade') {
      const harness = buildPeHarness(payload.peId!, 'grade');
      if (!harness) {
        return Response.json(
          { error: `Không tìm thấy bộ chấm cho PE ${payload.peId}.` },
          { status: 400 }
        );
      }
      workFiles.push({
        path: `/vercel/sandbox/work/${harness.fileName}`,
        content: harness.content,
      });
      if (harness.extraFiles) {
        for (const extra of harness.extraFiles) {
          workFiles.push(extra);
        }
      }
      compileTargets.push(harness.fileName);
      entryClass = harness.entryClass;
    } else {
      const fileWithMain = payload.files.find((f) => hasMainMethod(f.content));
      if (fileWithMain) {
        entryClass = fileWithMain.name.replace(/\.java$/, '');
        useUserStdin = payload.stdin.length > 0;
        if (useUserStdin) {
          workFiles.push({
            path: '/vercel/sandbox/work/__stdin.txt',
            content: payload.stdin,
          });
        }
      } else if (payload.peId) {
        const smoke = buildPeHarness(payload.peId, 'run');
        if (smoke) {
          workFiles.push({
            path: `/vercel/sandbox/work/${smoke.fileName}`,
            content: smoke.content,
          });
          compileTargets.push(smoke.fileName);
          entryClass = smoke.entryClass;
        }
      } else {
        return Response.json(
          {
            ok: false,
            phase: 'compile',
            jdkVersion,
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

    await sandbox.writeFiles(workFiles);

    const tCompile = performance.now();
    const compileRes = await sandbox.runCommand({
      cmd: 'javac',
      args: ['-encoding', 'UTF-8', '-Xlint:all', '-d', '/vercel/sandbox/out', ...compileTargets],
      cwd: '/vercel/sandbox/work',
    });
    const compileMs = Math.round(performance.now() - tCompile);
    const compileStdout = await compileRes.stdout();
    const compileStderr = await compileRes.stderr();
    const diagnostics = parseJavacDiagnostics(compileStderr, primaryFileName);

    if (compileRes.exitCode !== 0) {
      const durationMs = Math.round(performance.now() - startedAt);
      await emitMetric('java_sandbox.run', 1, { mode: payload.mode, outcome: 'compile_error' });
      await emitMetric('java_sandbox.duration_ms', durationMs, { mode: payload.mode });

      return Response.json(
        {
          ok: false,
          phase: 'compile',
          jdkVersion,
          compileMs,
          runMs: 0,
          exitCode: compileRes.exitCode,
          stdout: truncateOutput(compileStdout),
          stderr: truncateOutput(compileStderr),
          diagnostics,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const controller = new AbortController();
    const hardTimer = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS);
    const tRun = performance.now();
    let runExitCode = 0;
    let runStdout = '';
    let runStderr = '';
    let timedOut = false;

    try {
      const jvmArgs = [
        '-Xms32m',
        '-Xmx256m',
        '-XX:ActiveProcessorCount=2',
        '-Dfile.encoding=UTF-8',
        '-cp',
        '/vercel/sandbox/out',
      ];
      const runRes = useUserStdin
        ? await sandbox.runCommand({
            cmd: 'bash',
            args: [
              '-c',
              'exec timeout -k 1s 8s java "$@" < /vercel/sandbox/work/__stdin.txt',
              '--',
              ...jvmArgs,
              entryClass,
            ],
            cwd: '/vercel/sandbox/work',
            signal: controller.signal,
            timeoutMs: RUN_TIMEOUT_MS,
          })
        : await sandbox.runCommand({
            cmd: 'timeout',
            args: ['-k', '1s', '8s', 'java', ...jvmArgs, entryClass],
            cwd: '/vercel/sandbox/work',
            signal: controller.signal,
            timeoutMs: RUN_TIMEOUT_MS,
          });
      runExitCode = runRes.exitCode;
      runStdout = await runRes.stdout();
      runStderr = await runRes.stderr();
      if (runExitCode === 124 || runExitCode === 137) {
        timedOut = true;
      }
    } catch (err) {
      if (controller.signal.aborted) {
        timedOut = true;
        runExitCode = 124;
        runStderr =
          'Chương trình vượt quá giới hạn thời gian thực thi (8s). Hãy kiểm tra vòng lặp vô hạn.';
      } else {
        throw err;
      }
    } finally {
      clearTimeout(hardTimer);
    }

    const runMs = Math.round(performance.now() - tRun);
    const { cleanedStdout, testResults } = extractTestMarkerBlock(runStdout);

    let outcome: string;
    let ok = runExitCode === 0 && !timedOut;
    if (timedOut) {
      outcome = 'timeout';
      ok = false;
    } else if (payload.mode === 'grade') {
      const hasAllPassed =
        Boolean(testResults && testResults.length > 0 && testResults.every((t) => t.passed)) &&
        runExitCode === 0;
      ok = hasAllPassed;
      outcome = hasAllPassed ? 'pass' : 'fail';
    } else {
      outcome = ok ? 'pass' : 'runtime_error';
    }

    const durationMs = Math.round(performance.now() - startedAt);
    await emitMetric('java_sandbox.run', 1, { mode: payload.mode, outcome });
    await emitMetric('java_sandbox.duration_ms', durationMs, { mode: payload.mode });

    return Response.json(
      {
        ok,
        phase: 'run',
        jdkVersion,
        compileMs,
        runMs,
        exitCode: runExitCode,
        timedOut,
        stdout: truncateOutput(cleanedStdout),
        stderr: truncateOutput(runStderr),
        diagnostics,
        testResults,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[api/java-run]', error);
    const durationMs = Math.round(performance.now() - startedAt);
    await emitMetric('java_sandbox.run', 1, { mode: payload.mode, outcome: 'error' });
    await emitMetric('java_sandbox.duration_ms', durationMs, { mode: payload.mode });

    let detail = '';
    try {
      const { APIError } = await import('@vercel/sandbox');
      if (error instanceof APIError) {
        detail = `Vercel Sandbox API ${error.response.status}: ${sanitizeErrorSummary(error.message)}`;
      }
    } catch {
      // ignore
    }
    if (!detail) {
      detail = sanitizeErrorSummary(error instanceof Error ? error.message : String(error));
    }

    return Response.json(
      {
        unavailable: true,
        unavailableReason: `${detail || 'Không thể khởi chạy OpenJDK Sandbox lúc này.'} — Hệ thống đã chuyển về Static Pattern Evaluator.`,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  } finally {
    if (sandbox) {
      await sandbox.stop().catch(() => {});
      await sandbox.delete().catch(() => {});
    }
  }
}
