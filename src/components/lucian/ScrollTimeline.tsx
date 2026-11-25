// Lucian UX/UI Prompt #370 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#370
import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-370.css';

export interface TimelineStep {
  num: string;
  title: string;
  description: string;
}

export function ScrollTimeline({ steps }: { steps: TimelineStep[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [litIndex, setLitIndex] = useState<number>(steps.length);
  const [lineProgress, setLineProgress] = useState<number>(1);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || getPrefersReducedMotion() || typeof window === 'undefined') {
      setLitIndex(steps.length);
      setLineProgress(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const start = vh * 0.88;
      const end = vh * 0.32;
      const raw = (start - rect.top) / Math.max(1, start - end);
      const p = Math.max(0.15, Math.min(1, raw));
      setLineProgress(p);
      setLitIndex(Math.max(1, Math.ceil(p * steps.length)));
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [steps.length]);

  return (
    <div ref={rootRef} className="ux u370-tl">
      <span className="u370-ln" aria-hidden="true">
        <i style={{ '--p': lineProgress } as React.CSSProperties} />
      </span>
      {steps.map((step, idx) => {
        const active = idx < litIndex;
        return (
          <div key={step.num} className={`u370-ev ${active ? 'on' : ''}`}>
            <span className="u370-dot" aria-hidden="true" />
            <div className="u370-cd space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <span className="font-mono text-[var(--accent-text)]">{step.num}</span>
                <span>{step.title}</span>
              </div>
              <p className="leading-relaxed text-[var(--text-muted)]">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
