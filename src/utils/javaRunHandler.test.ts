// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GET, POST } from '../../server/java-run';

const ENV_KEYS = [
  'VERCEL_OIDC_TOKEN',
  'VERCEL_TOKEN',
  'VERCEL_PROJECT_ID',
  'VERCEL_TEAM_ID',
  'JAVA_RUNNER_URL',
] as const;

describe('server/java-run HTTP handler', () => {
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('GET reports sandbox availability accurately with and without OIDC token header', async () => {
    const resNoCreds = await GET(new Request('https://javabrew.test/api/java-run'));
    expect(resNoCreds.status).toBe(200);
    const dataNoCreds = (await resNoCreds.json()) as { available: boolean; runtime: string };
    expect(dataNoCreds.available).toBe(false);

    const resWithOidc = await GET(
      new Request('https://javabrew.test/api/java-run', {
        headers: { 'x-vercel-oidc-token': 'test-oidc-token' },
      })
    );
    expect(resWithOidc.status).toBe(200);
    const dataWithOidc = (await resWithOidc.json()) as { available: boolean; runtime: string };
    expect(dataWithOidc.available).toBe(true);
    expect(dataWithOidc.runtime).toContain('OpenJDK');
  });

  it('POST returns 503 when neither Vercel Sandbox nor JAVA_RUNNER_URL is configured', async () => {
    const res = await POST(
      new Request('https://javabrew.test/api/java-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '198.51.100.1',
        },
        body: JSON.stringify({
          mode: 'run',
          files: [{ name: 'Main.java', content: 'public class Main {}' }],
          stdin: '',
        }),
      })
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { unavailable?: boolean };
    expect(body.unavailable).toBe(true);
  });

  it('POST returns 400 on malformed JSON body', async () => {
    const res = await POST(
      new Request('https://javabrew.test/api/java-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-oidc-token': 'test-oidc-token',
          'x-forwarded-for': '198.51.100.2',
        },
        body: '{broken-json',
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/JSON/i);
  });

  it('POST returns 400 on invalid payload (empty files list)', async () => {
    const res = await POST(
      new Request('https://javabrew.test/api/java-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-oidc-token': 'test-oidc-token',
          'x-forwarded-for': '198.51.100.3',
        },
        body: JSON.stringify({ mode: 'run', files: [], stdin: '' }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  it('POST blocks forbidden package declarations cleanly with compile diagnostic on line 1', async () => {
    const res = await POST(
      new Request('https://javabrew.test/api/java-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-oidc-token': 'test-oidc-token',
          'x-forwarded-for': '198.51.100.4',
        },
        body: JSON.stringify({
          mode: 'run',
          files: [
            {
              name: 'Main.java',
              content: 'package forbidden.pkg;\npublic class Main { public static void main(String[] a) {} }',
            },
          ],
          stdin: '',
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      phase: string;
      diagnostics: Array<{ file: string; line: number; message: string }>;
    };
    expect(body.ok).toBe(false);
    expect(body.phase).toBe('compile');
    expect(body.diagnostics[0]).toMatchObject({ file: 'Main.java', line: 1 });
  });

  it('POST blocks Integer.toBinaryString in PE3-Q4 (peId=11) grade mode with POLICY testResult', async () => {
    const res = await POST(
      new Request('https://javabrew.test/api/java-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-oidc-token': 'test-oidc-token',
          'x-forwarded-for': '198.51.100.5',
        },
        body: JSON.stringify({
          mode: 'grade',
          peId: 11,
          files: [
            {
              name: 'MyStringNumberTool.java',
              content:
                'public class MyStringNumberTool {\n  public String decimalToBinary(int n) {\n    return Integer.toBinaryString(n);\n  }\n}',
            },
          ],
          stdin: '',
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      testResults: Array<{ id: string; passed: boolean }>;
    };
    expect(body.ok).toBe(false);
    expect(body.testResults[0]).toMatchObject({ id: 'POLICY', passed: false });
  });

  it('POST enforces per-IP rate limiting (429 after 20 requests)', async () => {
    const ip = '198.51.100.99';
    for (let i = 0; i < 20; i++) {
      const res = await POST(
        new Request('https://javabrew.test/api/java-run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-vercel-oidc-token': 'test-oidc-token',
            'x-forwarded-for': ip,
          },
          body: '{invalid-json',
        })
      );
      expect(res.status).toBe(400);
    }

    const limitedRes = await POST(
      new Request('https://javabrew.test/api/java-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-oidc-token': 'test-oidc-token',
          'x-forwarded-for': ip,
        },
        body: '{invalid-json',
      })
    );
    expect(limitedRes.status).toBe(429);
  });
});
