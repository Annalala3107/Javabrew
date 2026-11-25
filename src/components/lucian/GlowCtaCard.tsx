// Lucian UX/UI Prompt #425 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#425
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './lucian-425.css';

interface GlowCtaCardProps {
  promptText: string;
  ctaLabel: string;
  ctaTo: string;
}

export function GlowCtaCard({ promptText, ctaLabel, ctaTo }: GlowCtaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cd = cardRef.current;
    if (!cd) return;

    const onPointerMove = (e: PointerEvent) => {
      const r = cd.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cd.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      cd.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    cd.addEventListener('pointermove', onPointerMove);
    return () => cd.removeEventListener('pointermove', onPointerMove);
  }, []);

  return (
    <div
      ref={cardRef}
      className="ux u425-cd flex flex-wrap items-center justify-between gap-4 p-4 md:p-5"
    >
      <i className="b b1" aria-hidden="true" />
      <i className="b b2" aria-hidden="true" />
      <span className="u425-gl" aria-hidden="true" />
      <span className="text-xs font-medium text-[var(--text-secondary)] md:text-sm">
        {promptText}
      </span>
      <Link to={ctaTo} className="u425-go">
        {ctaLabel}
      </Link>
    </div>
  );
}
