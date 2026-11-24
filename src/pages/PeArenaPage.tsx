import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useApp } from '../context/AppContext';
import { parseMarkdownDocument, parsePeChallenges } from '../utils/markdown';

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PeArenaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { progress, togglePeCompleted, recordVisit } = useApp();

  const [rawMd, setRawMd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [showPitfalls, setShowPitfalls] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/content/vi/pro192/pe-challenges.md')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Không thể tải pe-challenges.md (HTTP ${res.status}).`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setRawMd(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Lỗi tải bộ đề PE.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const challenges = useMemo(() => {
    if (!rawMd) return [];
    const parsed = parseMarkdownDocument(rawMd);
    return parsePeChallenges(parsed.body);
  }, [rawMd]);

  const requestedId = searchParams.get('challenge') || '01';
  const activeChallenge = useMemo(() => {
    if (challenges.length === 0) return null;
    return (
      challenges.find((c) => Number(c.id) === Number(requestedId)) || challenges[0]
    );
  }, [challenges, requestedId]);

  // Reset timer and reveal states when switching challenge
  useEffect(() => {
    if (!activeChallenge) return;
    setTimerRunning(false);
    setSecondsLeft(activeChallenge.durationMinutes * 60);
    setShowPitfalls(false);
    setShowSolution(false);
    recordVisit({
      path: `/pe?challenge=${activeChallenge.id}`,
      title: activeChallenge.title,
      kind: 'pe',
      updatedAt: new Date().toISOString(),
    });
  }, [activeChallenge, recordVisit]);

  // Countdown tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
    }
  }, [secondsLeft, timerRunning]);

  const isLowTime = secondsLeft > 0 && secondsLeft <= 300;
  const isTimeUp = secondsLeft === 0;
  const isDone = activeChallenge ? progress.completedPe.includes(activeChallenge.id) : false;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1.5 border-b border-[var(--border-default)] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Phòng luyện thi Practical Exam (PRO192 PE)
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          4 bộ đề thực chiến chuẩn cấu trúc chấm tự động (Q1–Q4). Bật đồng hồ bấm giờ, tự giải trước khi mở bẫy thường gặp và lời giải chuẩn.
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="h-14 animate-pulse rounded-xl bg-[var(--bg-surface-muted)]" />
          <div className="h-64 animate-pulse rounded-xl bg-[var(--bg-surface-muted)]" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-[var(--border-default)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger)]"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        <>
          {/* Challenge selector */}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {challenges.map((ch) => {
              const selected = activeChallenge?.id === ch.id;
              const completed = progress.completedPe.includes(ch.id);

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSearchParams({ challenge: ch.id })}
                  className={[
                    'flex flex-col justify-between rounded-xl border p-3.5 text-left transition-colors',
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--accent-text)]">
                      Đề PE {ch.id}
                    </span>
                    {completed && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                    {ch.title.replace(/^Đề PE \d+\s+—\s+/, '')}
                  </div>
                  <div className="mt-2 text-[11px] text-[var(--text-muted)]">{ch.meta}</div>
                </button>
              );
            })}
          </div>

          {/* Active Challenge Workspace */}
          {activeChallenge && (
            <div className="space-y-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6">
              {/* Header + Timer */}
              <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-default)] pb-5 md:flex-row md:items-center">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {activeChallenge.title}
                  </h2>
                  <div className="text-xs font-medium text-[var(--text-muted)]">
                    {activeChallenge.meta}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div
                    className={[
                      'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold tabular-nums',
                      isTimeUp
                        ? 'border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]'
                        : isLowTime
                          ? 'border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]'
                          : 'border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[var(--text-primary)]',
                    ].join(' ')}
                    aria-live="off"
                  >
                    <Timer className="h-4 w-4" />
                    <span>{isTimeUp ? '00:00 (Hết giờ)' : formatClock(secondsLeft)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTimerRunning((r) => !r)}
                    disabled={isTimeUp}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Bắt đầu bấm giờ</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setSecondsLeft(activeChallenge.durationMinutes * 60);
                    }}
                    aria-label="Đặt lại đồng hồ"
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Đặt lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePeCompleted(activeChallenge.id)}
                    aria-pressed={isDone}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                      isDone
                        ? 'border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                    ].join(' ')}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    <span>{isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  Yêu cầu đề bài
                </h3>
                <MarkdownRenderer
                  content={activeChallenge.requirementsMd}
                  currentRel="pro192/pe-challenges.md"
                />
              </div>

              {/* Action toggles for Pitfalls & Reference Solution */}
              <div className="flex flex-wrap gap-2.5 border-t border-[var(--border-default)] pt-4">
                {activeChallenge.pitfallsMd && (
                  <button
                    type="button"
                    onClick={() => setShowPitfalls((v) => !v)}
                    aria-expanded={showPitfalls}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--warning-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--warning)]"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{showPitfalls ? 'Ẩn bẫy thường gặp' : 'Gợi ý: Bẫy hay mất điểm'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowSolution((v) => !v)}
                  aria-expanded={showSolution}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                >
                  {showSolution ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Ẩn lời giải chuẩn</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <span>Xem lời giải chuẩn</span>
                    </>
                  )}
                </button>
              </div>

              {showPitfalls && activeChallenge.pitfallsMd && (
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--warning-soft)] p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--warning)]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Các bẫy hay mất điểm khi chấm tự động</span>
                  </div>
                  <MarkdownRenderer
                    content={activeChallenge.pitfallsMd}
                    currentRel="pro192/pe-challenges.md"
                  />
                </div>
              )}

              {showSolution && activeChallenge.solutionMd && (
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-4 sm:p-5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--accent-text)]">
                    Lời giải mẫu chuẩn hóa
                  </div>
                  <MarkdownRenderer
                    content={activeChallenge.solutionMd}
                    currentRel="pro192/pe-challenges.md"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
