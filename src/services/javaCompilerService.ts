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

export interface JavaSandboxHealth {
  available: boolean;
  runtime: string;
  region?: string;
  reason?: string;
}

export interface JavaCloudRunRequest {
  mode: 'run' | 'grade';
  peId?: number;
  files: JavaSourceFile[];
  stdin?: string;
}

export interface JavaCloudExecutionResult {
  unavailable?: boolean;
  unavailableReason?: string;
  ok: boolean;
  phase: 'compile' | 'run';
  jdkVersion?: string;
  compileMs: number;
  runMs: number;
  exitCode: number;
  timedOut?: boolean;
  stdout: string;
  stderr: string;
  diagnostics: JavaDiagnostic[];
  testResults?: JavaTestCaseResult[];
}

export async function checkJavaSandboxHealth(signal?: AbortSignal): Promise<JavaSandboxHealth> {
  try {
    const res = await fetch('/api/java-run', {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        available: false,
        runtime: 'Static Pattern Evaluator',
        reason: 'local-spa',
      };
    }
    const data = (await res.json()) as Partial<JavaSandboxHealth>;
    return {
      available: Boolean(data.available),
      runtime: data.runtime || 'OpenJDK 21 (Vercel Sandbox)',
      region: data.region,
      reason: data.reason,
    };
  } catch {
    return {
      available: false,
      runtime: 'Static Pattern Evaluator',
      reason: 'network-error',
    };
  }
}

export async function runJavaInCloud(
  req: JavaCloudRunRequest,
  signal?: AbortSignal
): Promise<JavaCloudExecutionResult> {
  try {
    const res = await fetch('/api/java-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: req.mode,
        peId: req.peId,
        files: req.files,
        stdin: req.stdin ?? '',
      }),
      signal,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        unavailable: true,
        unavailableReason: 'Chế độ local chưa khởi chạy Vercel Function — đã chuyển sang Static Evaluator.',
        ok: false,
        phase: 'compile',
        compileMs: 0,
        runMs: 0,
        exitCode: -1,
        stdout: '',
        stderr: '',
        diagnostics: [],
      };
    }

    const payload = (await res.json()) as Partial<JavaCloudExecutionResult> & {
      error?: string;
      unavailableReason?: string;
    };

    if (res.status === 503 || res.status === 429 || payload.unavailable) {
      return {
        unavailable: true,
        unavailableReason:
          payload.unavailableReason ||
          payload.error ||
          (res.status === 429
            ? 'Bạn chạy quá nhanh, vui lòng đợi vài giây hoặc dùng chế độ Static tức thì.'
            : 'OpenJDK Sandbox tạm thời chưa sẵn sàng — đã tự động chấm bằng Static Evaluator.'),
        ok: false,
        phase: 'compile',
        compileMs: 0,
        runMs: 0,
        exitCode: res.status,
        stdout: '',
        stderr: '',
        diagnostics: [],
      };
    }

    if (!res.ok) {
      return {
        unavailable: true,
        unavailableReason: payload.error || `Sandbox HTTP ${res.status}`,
        ok: false,
        phase: 'compile',
        compileMs: 0,
        runMs: 0,
        exitCode: res.status,
        stdout: '',
        stderr: '',
        diagnostics: [],
      };
    }

    return {
      ok: Boolean(payload.ok),
      phase: payload.phase === 'compile' ? 'compile' : 'run',
      jdkVersion: payload.jdkVersion,
      compileMs: Number(payload.compileMs) || 0,
      runMs: Number(payload.runMs) || 0,
      exitCode: Number(payload.exitCode ?? 0),
      timedOut: Boolean(payload.timedOut),
      stdout: typeof payload.stdout === 'string' ? payload.stdout : '',
      stderr: typeof payload.stderr === 'string' ? payload.stderr : '',
      diagnostics: Array.isArray(payload.diagnostics) ? payload.diagnostics : [],
      testResults: Array.isArray(payload.testResults) ? payload.testResults : undefined,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    return {
      unavailable: true,
      unavailableReason: 'Không kết nối được tới máy chủ OpenJDK Sandbox — đã chuyển sang Static Evaluator.',
      ok: false,
      phase: 'compile',
      compileMs: 0,
      runMs: 0,
      exitCode: -1,
      stdout: '',
      stderr: '',
      diagnostics: [],
    };
  }
}
