// Lucian UX/UI Prompt #438 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#438
import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-438.css';

interface MorphActionButtonProps {
  label: string;
  onClick: () => boolean | void | Promise<boolean | void>;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export function MorphActionButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: MorphActionButtonProps) {
  const [stage, setStage] = useState<'idle' | 'busy' | 'ok'>('idle');
  const [down, setDown] = useState(false);
  const timersRef = useRef<number[]>([]);
  const mountedRef = useRef(true);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, []);

  const handleClick = async () => {
    if (disabled || stage === 'busy') return;

    const reduced = getPrefersReducedMotion();
    const rawResult = onClick();

    if (rawResult && typeof (rawResult as Promise<unknown>).then === 'function') {
      clearTimers();
      setDown(false);
      setStage('busy');
      try {
        const succeeded = await rawResult;
        if (!mountedRef.current) return;
        if (reduced) {
          setStage('idle');
          return;
        }
        setStage(succeeded === false ? 'idle' : 'ok');
        const t2 = window.setTimeout(() => {
          if (mountedRef.current) setStage('idle');
        }, 650);
        timersRef.current.push(t2);
      } catch {
        if (mountedRef.current) setStage('idle');
      }
      return;
    }

    if (reduced) return;

    clearTimers();
    setDown(false);
    setStage('busy');

    const t1 = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setStage(rawResult === false ? 'idle' : 'ok');
      const t2 = window.setTimeout(() => {
        if (mountedRef.current) setStage('idle');
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
      disabled={disabled || stage === 'busy'}
      aria-busy={stage === 'busy'}
      aria-label={label}
      onClick={() => void handleClick()}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      className={`ux u438-b ${down ? 'is-down' : ''} ${baseTone} disabled:cursor-wait disabled:opacity-75 ${className}`}
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
