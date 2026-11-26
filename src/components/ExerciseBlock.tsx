import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, Eye, EyeOff, Sparkles, Square } from 'lucide-react';
import { LucianAccordion } from './lucian/LucianAccordion';
import { StreamingAiBubble } from './lucian/StreamingAiBubble';
import { useApp } from '../context/AppContext';
import { streamExerciseGrade } from '../services/aiMentorService';
import type { Pro192Exercise } from '../types/content';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ExerciseBlockProps {
  exercise: Pro192Exercise;
  currentRel: string;
  forceReveal?: boolean | null;
}

export function ExerciseBlock({
  exercise,
  currentRel,
  forceReveal = null,
}: ExerciseBlockProps) {
  const {
    progress,
    toggleExerciseSolved,
    pushToast,
    byokKey,
    aiModel,
    aiServerStatus,
    refreshAiServerStatus,
    updateAiServerQuota,
    setIsSettingsOpen,
  } = useApp();
  const [showSolution, setShowSolution] = useState(false);
  const [graderOpen, setGraderOpen] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [gradingBusy, setGradingBusy] = useState(false);
  const [gradePrompt, setGradePrompt] = useState('');
  const [gradeReply, setGradeReply] = useState('');
  const [gradeTone, setGradeTone] = useState<'ai' | 'error'>('ai');
  const [gradeBadge, setGradeBadge] = useState('');
  const [gradeStreaming, setGradeStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (forceReveal !== null) {
      setShowSolution(forceReveal);
    }
  }, [forceReveal]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleToggleGrader = () => {
    setGraderOpen((prev) => {
      const next = !prev;
      if (next && !aiServerStatus) {
        void refreshAiServerStatus();
      }
      return next;
    });
  };

  const handleStopGrading = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGradingBusy(false);
    setGradeStreaming(false);
  };

  const handleGradeSubmit = async () => {
    const cleanAnswer = userAnswer.trim();
    if (!cleanAnswer || gradingBusy) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!aiServerStatus) {
      await refreshAiServerStatus();
    }

    const targetModel = byokKey ? aiModel : aiServerStatus?.defaultModel || aiModel;
    setGradingBusy(true);
    setGradeStreaming(true);
    setGradeTone('ai');
    setGradePrompt(`Chấm bài ${exercise.id}: ${exercise.title}`);
    setGradeReply('');
    setGradeBadge(byokKey ? targetModel : `AI Tự động · ${targetModel}`);

    try {
      const res = await streamExerciseGrade({
        apiKey: byokKey || undefined,
        model: targetModel,
        exerciseContext: {
          exerciseId: exercise.id,
          slot: exercise.slot,
          title: exercise.title,
          promptMd: exercise.promptMd,
          solutionMd: exercise.solutionMd,
          userAnswer: cleanAnswer,
        },
        signal: controller.signal,
        onMeta: (meta) => {
          if (abortRef.current !== controller) return;
          setGradeBadge(meta.source === 'byok' ? meta.model : `AI Tự động · ${meta.model}`);
          if (typeof meta.remaining === 'number') {
            updateAiServerQuota(meta.remaining, meta.limit);
          }
        },
        onDelta: (chunk) => {
          if (abortRef.current !== controller) return;
          setGradeReply((prev) => prev + chunk);
        },
      });

      if (abortRef.current !== controller) return;

      if (res.ok) {
        setGradeReply(res.reply);
        setGradeStreaming(false);
        if (typeof res.remaining === 'number') {
          updateAiServerQuota(res.remaining, res.limit);
        }
      } else {
        setGradeTone('error');
        setGradeReply(res.errorMessage);
        setGradeStreaming(false);
        setGradeBadge(
          res.quotaExceeded
            ? 'Hết lượt hôm nay'
            : res.status
              ? `Lỗi HTTP ${res.status}`
              : 'Chưa kết nối AI'
        );
        if (res.quotaExceeded) {
          updateAiServerQuota(0, res.limit);
        } else if (typeof res.remaining === 'number') {
          updateAiServerQuota(res.remaining, res.limit);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGradeStreaming(false);
        setGradeReply((prev) => prev || 'Đã dừng chấm bài.');
      } else {
        setGradeTone('error');
        setGradeStreaming(false);
        setGradeReply('Không thể hoàn tất chấm bài AI lúc này. Hãy thử lại.');
        setGradeBadge('Lỗi mạng');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setGradingBusy(false);
      }
    }
  };

  const solved = progress.solvedExercises.includes(exercise.id);

  return (
    <section
      id={`exercise-${exercise.id}`}
      className="my-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-default)] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-[var(--accent-text)]">
              Slot {exercise.slot} · Bài {exercise.id}
            </span>
            {solved && (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--success-text)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Done</span>
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold leading-snug text-[var(--text-primary)]">
            {exercise.title}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => {
            toggleExerciseSolved(exercise.id);
            pushToast({
              title: solved
                ? `Bỏ đánh dấu Bài ${exercise.id}`
                : `Hoàn thành Bài ${exercise.id}!`,
              description: exercise.title,
              tone: solved ? 'info' : 'success',
            });
          }}
          aria-pressed={solved}
          className={[
            'inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
            solved
              ? 'border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success-text)]'
              : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]',
          ].join(' ')}
        >
          {solved ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          <span>{solved ? 'Đã hoàn thành' : 'Đánh dấu đã làm'}</span>
        </button>
      </div>

      <div className="mt-3 text-xs">
        <MarkdownRenderer content={exercise.promptMd} currentRel={currentRel} />
      </div>

      {/* Inline AI Grader toggle */}
      <div data-no-ai-popover className="mt-3 space-y-2.5 border-t border-[var(--border-default)] pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            aria-expanded={graderOpen}
            onClick={handleToggleGrader}
            className={[
              'inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors',
              graderOpen
                ? 'border-[var(--info)] bg-[var(--info-soft)] text-[var(--info-text)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--info-text)] hover:border-[var(--info)]',
            ].join(' ')}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{graderOpen ? 'Ẩn khung AI chấm bài' : '✨ Tự làm & AI chấm'}</span>
          </button>
          {graderOpen && aiServerStatus?.available && !byokKey && (
            <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
              AI Tự động ({aiServerStatus.remaining}/{aiServerStatus.dailyLimit})
            </span>
          )}
        </div>

        {graderOpen && (
          <div className="space-y-2.5 rounded-xl border border-[var(--info)]/35 bg-[var(--bg-surface)] p-3 text-xs">
            <label
              htmlFor={`ex-draft-${exercise.id}`}
              className="block font-medium text-[var(--text-secondary)]"
            >
              Gõ lời giải hoặc đoạn code nháp của bạn (không cần hoàn hảo):
            </label>
            <textarea
              id={`ex-draft-${exercise.id}`}
              rows={3}
              maxLength={3000}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              spellCheck={false}
              aria-label={`Câu trả lời thử cho Bài ${exercise.id}`}
              placeholder="Ví dụ: Em dùng HashMap<String, Integer> để đếm tần suất..."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-2.5 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
            />
            <div className="flex flex-wrap items-center gap-2">
              {gradingBusy ? (
                <button
                  type="button"
                  onClick={handleStopGrading}
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[var(--danger)]/45 bg-[var(--danger-soft)] px-3 py-1 font-bold text-[var(--danger-text)]"
                >
                  <Square className="h-3 w-3" aria-hidden="true" />
                  <span>Dừng</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!userAnswer.trim()}
                  onClick={() => void handleGradeSubmit()}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--info)] px-3.5 py-1 font-bold text-[#1C1917] hover:opacity-90 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>✨ AI chấm &amp; nhận xét</span>
                </button>
              )}
              {!solved && gradeReply && !gradingBusy && gradeTone === 'ai' && (
                <button
                  type="button"
                  onClick={() => {
                    toggleExerciseSolved(exercise.id);
                    pushToast({
                      title: `Hoàn thành Bài ${exercise.id}!`,
                      description: exercise.title,
                      tone: 'success',
                    });
                  }}
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[var(--success)]/45 bg-[var(--success-soft)] px-3 py-1 font-semibold text-[var(--success-text)]"
                >
                  ✔ Đánh dấu đã hoàn thành Bài {exercise.id}
                </button>
              )}
            </div>

            {gradePrompt && (
              <StreamingAiBubble
                prompt={gradePrompt}
                reply={gradeReply}
                thinking={gradingBusy && gradeReply.length === 0}
                streaming={gradeStreaming}
                liveStreamed
                allowJavaRun
                tone={gradeTone}
                badgeLabel={gradeBadge}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onAbortStream={gradeStreaming ? handleStopGrading : undefined}
              />
            )}
          </div>
        )}
      </div>

      {exercise.solutionMd && (
        <div className="mt-3 pt-1">
          <LucianAccordion
            open={showSolution}
            unmountWhenClosed
            onToggle={() => setShowSolution((prev) => !prev)}
            title={
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                {showSolution ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span>Ẩn lời giải chi tiết</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Xem lời giải chi tiết</span>
                  </>
                )}
              </span>
            }
          >
            <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--accent-text)]">
                Lời giải phân tích chi tiết
              </div>
              <MarkdownRenderer content={exercise.solutionMd} currentRel={currentRel} />
            </div>
          </LucianAccordion>
        </div>
      )}
    </section>
  );
}
