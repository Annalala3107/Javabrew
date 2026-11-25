// Lucian UX/UI Prompt #012 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#012
import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-012.css';

interface BookmarkRibbonButtonProps {
  saved: boolean;
  onToggle: () => void;
  className?: string;
}

const SPARK_ANGLES = [
  { a: '0deg', c: '#F59E0B' },
  { a: '60deg', c: '#38BDF8' },
  { a: '120deg', c: '#22C55E' },
  { a: '180deg', c: '#F59E0B' },
  { a: '240deg', c: '#38BDF8' },
  { a: '300deg', c: '#22C55E' },
];

export function BookmarkRibbonButton({
  saved,
  onToggle,
  className = '',
}: BookmarkRibbonButtonProps) {
  const [burst, setBurst] = useState(false);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const handleClick = () => {
    const nextSaved = !saved;
    onToggle();
    if (nextSaved && !getPrefersReducedMotion()) {
      setBurst(false);
      window.requestAnimationFrame(() => setBurst(true));
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setBurst(false), 750);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      className={`ux u012-btn ${saved ? 'is-on' : ''} ${burst ? 'is-burst' : ''} ${className}`}
    >
      <span className="u012-ico" aria-hidden="true">
        <svg viewBox="0 0 44 56">
          <path className="u012-in" d="M6 4h32a2 2 0 0 1 2 2v46l-18-12L4 52V6a2 2 0 0 1 2-2z" />
          <path className="u012-out" d="M6 4h32a2 2 0 0 1 2 2v46l-18-12L4 52V6a2 2 0 0 1 2-2z" />
        </svg>
        {SPARK_ANGLES.map((sp) => (
          <span
            key={sp.a}
            className="u012-p"
            style={{ '--a': sp.a, '--c': sp.c } as React.CSSProperties}
          />
        ))}
      </span>
      <span>{saved ? '★ Đã lưu' : '☆ Lưu bài'}</span>
    </button>
  );
}
