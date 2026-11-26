import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Eye, EyeOff, Play, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Pro192CodingDrill } from '../types/content';
import { prepareJavaPlaygroundFiles, savePlaygroundWorkspace } from '../utils/javaPlayground';
import { LucianAccordion } from './lucian/LucianAccordion';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CodingDrillBlockProps {
  drill: Pro192CodingDrill;
  currentRel: string;
  forceReveal?: boolean | null;
}

export function CodingDrillBlock({
  drill,
  currentRel,
  forceReveal = null,
}: CodingDrillBlockProps) {
  const { progress, toggleDrillCompleted, pushToast } = useApp();
  const navigate = useNavigate();
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (forceReveal !== null) {
      setShowSolution(forceReveal);
    }
  }, [forceReveal]);

  const completed = progress.completedDrills.includes(drill.id);
  const slotSlug = `slot-${String(drill.slot).padStart(2, '0')}`;
  const drillBackUrl = `/pro192/slots/${slotSlug}#drill-${drill.id}`;

  const handleOpenInLiveLab = () => {
    const rawCode =
      drill.starterCode ||
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("JavaBrew Live Lab!");\n    }\n}';
    const prepared = prepareJavaPlaygroundFiles(rawCode, currentRel);
    const drillContext = {
      id: drill.id,
      slot: drill.slot,
      title: drill.title,
      goal: drill.goal,
      expectedOutputLines: drill.expectedOutputLines,
      backUrl: drillBackUrl,
    };
    const nextState = {
      files: prepared.files,
      activeFileId: prepared.files[0].id,
      stdin: '',
      sourceLabel: `Thực hành ${drill.id}: ${drill.title}`,
      drillContext,
    };
    savePlaygroundWorkspace(nextState);
    pushToast({
      title: `Đã nạp Thực hành ${drill.id} vào JavaBrew Live Lab`,
      description: 'Mục tiêu & Expected Output đã được đính kèm bên trong Studio.',
      tone: 'info',
    });
    navigate('/studio/playground', {
      state: {
        playgroundImport: nextState,
        note: `Thực hành ${drill.id} · ${drill.goal}`,
        drillContext,
      },
    });
  };

  return (
    <section
      id={`drill-${drill.id}`}
      className="my-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-default)] pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-[var(--info)]/35 bg-[var(--info-soft)] px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-[var(--info-text)]">
              Slot {drill.slot} · Thực hành {drill.id}
            </span>
            <span
              className={
                drill.level === 'basic'
                  ? 'rounded border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--success-text)]'
                  : 'rounded border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-text)]'
              }
            >
              {drill.level === 'basic' ? 'Cơ bản' : 'Nâng cao'}
            </span>
            {completed && (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--success-text)]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Done</span>
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold leading-snug text-[var(--text-primary)]">
            {drill.title}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenInLiveLab}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-contrast)] transition-opacity hover:opacity-90"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Mở trong JavaBrew Live Lab</span>
          </button>

          <button
            type="button"
            onClick={() => {
              toggleDrillCompleted(drill.id);
              pushToast({
                title: completed
                  ? `Bỏ đánh dấu Thực hành ${drill.id}`
                  : `Hoàn thành Thực hành ${drill.id}!`,
                description: drill.title,
                tone: completed ? 'info' : 'success',
              });
            }}
            aria-pressed={completed}
            className={[
              'inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              completed
                ? 'border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success-text)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Circle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{completed ? 'Đã hoàn thành' : 'Đánh dấu đã làm'}</span>
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 text-xs">
        <div className="flex items-start gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-secondary)]">
          <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Mục tiêu: </span>
            <span>{drill.goal}</span>
          </div>
        </div>

        {drill.expectedOutputLines.length > 0 && (
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3">
            <div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              Expected Output
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--success-text)]">
              {drill.expectedOutputLines.join('\n')}
            </pre>
          </div>
        )}

        {drill.starterCode && (
          <MarkdownRenderer
            content={`\`\`\`java\n${drill.starterCode}\n\`\`\``}
            currentRel={currentRel}
            compact
          />
        )}
      </div>

      {drill.solutionMd && (
        <div className="mt-3 pt-1">
          <LucianAccordion
            open={showSolution}
            unmountWhenClosed
            onToggle={() => setShowSolution((prev) => !prev)}
            title={
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                {showSolution ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                    <span>Ẩn lời giải chuẩn &amp; giải thích</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                    <span>Xem lời giải chuẩn &amp; giải thích</span>
                  </>
                )}
              </span>
            }
          >
            <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--accent-text)]">
                Lời giải chuẩn (JavaBrew Live Lab {drill.id})
              </div>
              <MarkdownRenderer content={drill.solutionMd} currentRel={currentRel} />
            </div>
          </LucianAccordion>
        </div>
      )}
    </section>
  );
}
