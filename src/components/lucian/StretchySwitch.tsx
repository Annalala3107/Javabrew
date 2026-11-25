// Lucian UX/UI Prompt #013 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#013
import { useEffect, useId, useRef, useState } from 'react';
import './lucian-013.css';

interface StretchySwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  title?: string;
  className?: string;
}

export function StretchySwitch({
  checked,
  onChange,
  label,
  title,
  className = '',
}: StretchySwitchProps) {
  const switchId = useId();
  const labelId = useId();
  const [stretching, setStretching] = useState(false);
  const [dragging, setDragging] = useState(false);
  const knobRef = useRef<HTMLSpanElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);
  const stretchTimerRef = useRef<number>(0);
  const skipClickRef = useRef(false);
  const dragRef = useRef<{ x: number; moved: boolean; start: number } | null>(null);

  useEffect(() => {
    return () => window.clearTimeout(stretchTimerRef.current);
  }, []);

  const triggerStretch = () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    setStretching(true);
    window.clearTimeout(stretchTimerRef.current);
    stretchTimerRef.current = window.setTimeout(() => setStretching(false), 170);
  };

  const commitValue = (next: boolean) => {
    if (next !== checked) {
      triggerStretch();
      onChange(next);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, moved: false, start: checked ? 22 : 2 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const sw = switchRef.current;
    const knob = knobRef.current;
    if (!drag || !sw || !knob) return;

    const k = sw.getBoundingClientRect().width / (sw.offsetWidth || 44) || 1;
    const dx = (e.clientX - drag.x) / k;
    if (Math.abs(dx) > 4) drag.moved = true;
    if (!drag.moved) return;

    setDragging(true);
    const x = Math.max(2, Math.min(22, drag.start + dx));
    knob.style.left = `${x}px`;
    knob.style.width = `${20 + Math.min(8, Math.abs(dx) * 0.25)}px`;
  };

  const finishDrag = () => {
    const drag = dragRef.current;
    const knob = knobRef.current;
    if (!drag || !knob) return;
    dragRef.current = null;
    setDragging(false);
    const x = Number.parseFloat(knob.style.left || (checked ? '22' : '2'));
    knob.style.left = '';
    knob.style.width = '';
    if (drag.moved) {
      skipClickRef.current = true;
      commitValue(x > 12);
    }
  };

  return (
    <div
      title={title}
      className={`ux u013-compact ${checked ? 'is-on' : ''} ${stretching ? 'is-stretch' : ''} ${dragging ? 'is-drag' : ''} ${className}`}
    >
      <button
        ref={switchRef}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClick={() => {
          if (skipClickRef.current) {
            skipClickRef.current = false;
            return;
          }
          commitValue(!checked);
        }}
        className="u013-sw"
      >
        <span ref={knobRef} className="u013-knob" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path className="u013-x" d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
            <path className="u013-v" d="M5.5 12.5l4.5 4.5 8.5-9" />
          </svg>
        </span>
      </button>
      <label id={labelId} htmlFor={switchId} className="u013-lab">
        {label}
      </label>
    </div>
  );
}
