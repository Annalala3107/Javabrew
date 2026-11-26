import { Eraser } from 'lucide-react';
import type { JavaDiagnostic, JavaTestCaseResult } from '../../services/javaCompilerService';
import { CopyCodeButton } from '../lucian/CopyCodeButton';
import { SlidingPillTabs } from '../lucian/SlidingPillTabs';

const ENGINE_MODE_OPTIONS = [
  { id: 'cloud' as const, label: 'OpenJDK 21 + Clean Code' },
  { id: 'static' as const, label: 'Chỉ Static (Tức thì)' },
];

interface StudioOutputConsoleProps {
  playgroundMode: boolean;
  engineBadgeLabel: string;
  engineMode: 'cloud' | 'static';
  onEngineModeChange: (mode: 'cloud' | 'static') => void;
  javacCommand: string;
  onCopiedCommand: () => void;
  onClearOutput: () => void;
  consoleStatus: string;
  consoleTone: 'muted' | 'amber' | 'green' | 'red';
  consoleOutput: string;
  lastTiming: { compileMs: number; runMs: number; engineLabel: string } | null;
  showStdin: boolean;
  onToggleStdin: () => void;
  stdinInput: string;
  onStdinChange: (value: string) => void;
  onStdinBlur: () => void;
  diagnostics: JavaDiagnostic[];
  onJumpToDiagnostic: (diag: JavaDiagnostic) => void;
  cloudTestResults: JavaTestCaseResult[];
  aiBusy?: boolean;
  onAskDiagnostic?: (diag: JavaDiagnostic) => void;
  onAskFailedTest?: (tc: JavaTestCaseResult) => void;
}

export function StudioOutputConsole({
  playgroundMode,
  engineBadgeLabel,
  engineMode,
  onEngineModeChange,
  javacCommand,
  onCopiedCommand,
  onClearOutput,
  consoleStatus,
  consoleTone,
  consoleOutput,
  lastTiming,
  showStdin,
  onToggleStdin,
  stdinInput,
  onStdinChange,
  onStdinBlur,
  diagnostics,
  onJumpToDiagnostic,
  cloudTestResults,
  aiBusy = false,
  onAskDiagnostic,
  onAskFailedTest,
}: StudioOutputConsoleProps) {
  const statusColorCls =
    consoleTone === 'green'
      ? 'text-[var(--success-text)]'
      : consoleTone === 'red'
        ? 'text-[var(--danger-text)]'
        : consoleTone === 'amber'
          ? 'text-[var(--accent-text)]'
          : 'text-[var(--text-muted)]';

  return (
    <div className="flex flex-1 flex-col gap-2.5 p-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            {playgroundMode ? 'Kết quả chạy (Output)' : 'Console & Kết quả Test PE'}
          </span>
          <span
            title="Biên dịch & chạy thật trên Vercel OpenJDK Sandbox hoặc Piston/Judge0 Fallback."
            className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)]"
          >
            {engineBadgeLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {!playgroundMode && (
            <SlidingPillTabs
              options={ENGINE_MODE_OPTIONS}
              value={engineMode}
              onChange={onEngineModeChange}
              ariaLabel="Chọn chế độ biên dịch"
              tone="neutral"
            />
          )}
          <CopyCodeButton
            code={javacCommand}
            label="Copy lệnh javac"
            copiedLabel="Đã chép"
            ariaLabel="Sao chép lệnh biên dịch javac local"
            onCopied={onCopiedCommand}
          />
          <button
            type="button"
            onClick={onClearOutput}
            aria-label="Xóa output console"
            className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <Eraser className="h-3 w-3" aria-hidden="true" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`font-mono font-medium ${statusColorCls}`}>{consoleStatus}</span>
        <div className="flex flex-wrap items-center gap-2">
          {lastTiming && (
            <span className="font-mono text-xs text-[var(--text-dim)]">
              {lastTiming.engineLabel} · javac {lastTiming.compileMs}ms · jvm {lastTiming.runMs}ms
            </span>
          )}
          <button
            type="button"
            onClick={onToggleStdin}
            className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {showStdin ? 'Ẩn stdin' : '+ Nhập stdin'}
          </button>
        </div>
      </div>

      {showStdin && (
        <div className="space-y-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2.5">
          <label
            htmlFor="studio-stdin-box"
            className="block font-medium text-[var(--text-secondary)]"
          >
            Dữ liệu đầu vào chuẩn (<code className="font-mono">stdin</code>) cho{' '}
            <code className="font-mono">Scanner(System.in)</code>:
          </label>
          <textarea
            id="studio-stdin-box"
            rows={2}
            value={stdinInput}
            onChange={(e) => onStdinChange(e.target.value)}
            onBlur={onStdinBlur}
            spellCheck={false}
            placeholder="Ví dụ: An&#10;9.25…"
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-code)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
      )}

      {/* Clickable javac compiler diagnostics */}
      {diagnostics.length > 0 && (
        <div
          aria-label="Danh sách lỗi biên dịch javac"
          className="space-y-1.5 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-2.5"
        >
          <div className="font-semibold text-[var(--danger-text)]">
            Chẩn đoán javac ({diagnostics.length}) — bấm để nhảy tới dòng:
          </div>
          <div className="space-y-1">
            {diagnostics.map((diag, idx) => (
              <div
                key={`${diag.file}-${diag.line}-${idx}`}
                className="flex items-start justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-[var(--bg-surface)]/70"
              >
                <button
                  type="button"
                  onClick={() => onJumpToDiagnostic(diag)}
                  className="flex min-w-0 flex-1 items-start gap-2 py-0.5 text-left font-mono text-xs text-[var(--text-primary)]"
                >
                  <span
                    className={
                      diag.severity === 'error'
                        ? 'shrink-0 font-semibold text-[var(--danger-text)]'
                        : 'shrink-0 font-semibold text-[var(--accent-text)]'
                    }
                  >
                    {diag.file}:{diag.line}:{diag.column}
                  </span>
                  <span className="break-words text-[var(--text-secondary)]">{diag.message}</span>
                </button>
                {onAskDiagnostic && (
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={() => onAskDiagnostic(diag)}
                    aria-label={`Hỏi AI về lỗi dòng ${diag.line}`}
                    className="shrink-0 rounded border border-[var(--info)]/40 bg-[var(--info-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--info-text)] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    ✨ Hỏi AI
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured OpenJDK test case results (PE mode) */}
      {!playgroundMode && cloudTestResults.length > 0 && (
        <div aria-label="Kết quả từng Test Case OpenJDK 21" className="grid grid-cols-1 gap-2">
          {cloudTestResults.map((tc) => (
            <div
              key={tc.id}
              className={[
                'space-y-1 rounded-lg border p-2.5',
                tc.passed
                  ? 'border-[var(--success)]/40 bg-[var(--success-soft)]'
                  : 'border-[var(--danger)]/40 bg-[var(--danger-soft)]',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2 font-mono font-semibold">
                <span
                  className={
                    tc.passed ? 'text-[var(--success-text)]' : 'text-[var(--danger-text)]'
                  }
                >
                  {tc.passed ? '✔' : '✕'} {tc.id}
                </span>
                <div className="flex items-center gap-2">
                  {!tc.passed && onAskFailedTest && (
                    <button
                      type="button"
                      disabled={aiBusy}
                      onClick={() => onAskFailedTest(tc)}
                      className="rounded border border-[var(--warning)]/45 bg-[var(--warning-soft)] px-2 py-0.5 font-sans text-[11px] font-semibold text-[var(--accent-text)] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      ✨ Tại sao {tc.id} fail?
                    </button>
                  )}
                  <span className="text-[var(--text-dim)]">{tc.durationMs}ms</span>
                </div>
              </div>
              <div className="font-medium text-[var(--text-primary)]">{tc.name}</div>
              {!tc.passed && (
                <div className="space-y-0.5 font-mono text-xs text-[var(--text-muted)]">
                  {tc.expected && <div>Kỳ vọng: {tc.expected}</div>}
                  {tc.actual && <div>Thực tế: {tc.actual}</div>}
                  {tc.error && <div className="text-[var(--danger-text)]">{tc.error}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <pre
        data-testid="studio-output-terminal"
        className="min-h-[180px] flex-1 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3.5 font-mono text-[13px] leading-relaxed text-[var(--text-primary)]"
      >
        {consoleOutput || '(Output trống)'}
      </pre>

      <p className="text-xs text-[var(--text-dim)]">
        {playgroundMode ? (
          <>
            JavaBrew Live Lab · OpenJDK Sandbox &amp; Fallback Runner. Lệnh máy local:{' '}
            <code className="text-[var(--text-muted)]">{javacCommand}</code>
          </>
        ) : (
          <>
            Dual-Track Hybrid: kiểm thử <strong>OpenJDK (--release 8)</strong> song song{' '}
            <strong>Static Policy &amp; Clean-Code Coach</strong>. Lệnh máy local:{' '}
            <code className="text-[var(--text-muted)]">{javacCommand}</code>
          </>
        )}
      </p>
    </div>
  );
}
