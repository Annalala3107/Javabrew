import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
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
  const { progress, toggleExerciseSolved } = useApp();
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
      className="my-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-default)] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[var(--accent-text)]">
              Slot {exercise.slot} · Bài {exercise.id}
            </span>
            {solved && (
              <span className="inline-flex items-center gap-1 rounded bg-[var(--success-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--success)]">
                <CheckCircle2 className="h-3 w-3" />
                <span>Đã làm</span>
              </span>
            )}
          </div>
          <h4 className="text-base font-semibold leading-snug text-[var(--text-primary)]">
            {exercise.title}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => toggleExerciseSolved(exercise.id)}
          aria-pressed={solved}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
            solved
              ? 'border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]'
              : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
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

      <div className="mt-3">
        <MarkdownRenderer content={exercise.promptMd} currentRel={currentRel} />
      </div>

      {exercise.solutionMd && (
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={() => setShowSolution((prev) => !prev)}
            aria-expanded={showSolution}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
          >
            {showSolution ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                <span>Ẩn lời giải chi tiết</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>Xem lời giải chi tiết</span>
              </>
            )}
          </button>

          {showSolution && (
            <div className="mt-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent-text)]">
                Lời giải phân tích chi tiết
              </div>
              <MarkdownRenderer content={exercise.solutionMd} currentRel={currentRel} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
