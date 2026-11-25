import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import { LucianAccordion } from './lucian/LucianAccordion';
import { useApp } from '../context/AppContext';
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
  const { progress, toggleExerciseSolved, pushToast } = useApp();
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (forceReveal !== null) {
      setShowSolution(forceReveal);
    }
  }, [forceReveal]);

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
