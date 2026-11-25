// Lucian UX/UI Prompt #438 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#438
import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-438.css';

interface MorphActionButtonProps {
  label: string;
  onClick: () => boolean | void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function MorphActionButton({
  label,
  onClick,
  variant = 'primary',
  className = '',
}: MorphActionButtonProps) {
  const [stage, setStage] = useState<'idle' | 'busy' | 'ok'>('idle');
  const [down, setDown] = useState(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const handleClick = () => {
    // Run caller handler synchronously so UI & test assertions reflect immediately
    const succeeded = onClick();
    if (getPrefersReducedMotion()) return;

    clearTimers();
    setDown(false);
    setStage('busy');

    const t1 = window.setTimeout(() => {
      setStage(succeeded === false ? 'idle' : 'ok');
      const t2 = window.setTimeout(() => {
        setStage('idle');
      }, 650);
      timersRef.current.push(t2);
    }, 220);

    timersRef.current.push(t1);
  };

  const baseTone =
    variant === 'primary'
      ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] border border-transparent'
      : 'border border-[var(--border-strong)] bg-[var(--bg-canvas)] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]';

  return (
    <button
      type="button"
      data-s={stage}
      aria-label={label}
      onClick={handleClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      className={`ux u438-b ${down ? 'is-down' : ''} ${baseTone} ${className}`}
    >
      <span className="u438-l" aria-hidden={stage !== 'idle'}>
        {label}
      </span>
      <i className="u438-sp" aria-hidden="true" />
      <svg className="u438-ck" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5.5 12.5 4.5 4.5 8.5-9.5" />
      </svg>
    </button>
  );
}
