// Lucian UX/UI Prompt #039 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#039
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import './lucian-039.css';

export interface SlidingTabOption<T extends string> {
  id: T;
  label: string;
}

interface SlidingPillTabsProps<T extends string> {
  options: readonly SlidingTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  shape?: 'rounded' | 'pill';
  tone?: 'accent' | 'neutral';
  className?: string;
}

export function SlidingPillTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  shape = 'rounded',
  tone = 'accent',
  className = '',
}: SlidingPillTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const firstMeasureRef = useRef(true);

  const movePill = useCallback(
    (animate: boolean) => {
      const pill = pillRef.current;
      const idx = options.findIndex((o) => o.id === value);
      const target = idx >= 0 ? tabRefs.current[idx] : tabRefs.current[0];
      if (!pill || !target) return;

      if (!animate) pill.style.transition = 'none';
      pill.style.setProperty('--x', `${target.offsetLeft}px`);
      pill.style.setProperty('--w', `${target.offsetWidth}px`);
      pill.style.opacity = target.offsetWidth > 0 ? '1' : '0';
      if (!animate) {
        void pill.offsetWidth;
        pill.style.transition = '';
      }
    },
    [options, value]
  );

  useLayoutEffect(() => {
    const animate = !firstMeasureRef.current;
    firstMeasureRef.current = false;
    movePill(animate);
  }, [movePill]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => movePill(false));
    ro.observe(list);
    return () => ro.disconnect();
  }, [movePill]);

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      data-tone={tone}
      className={`ux u039-tabs ${shape === 'pill' ? 'is-pill' : ''} ${className}`}
    >
      <span ref={pillRef} className="u039-pill" aria-hidden="true" />
      {options.map((opt, idx) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => {
              const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const nextIdx = (idx + dir + options.length) % options.length;
              onChange(options[nextIdx].id);
              tabRefs.current[nextIdx]?.focus();
            }}
            className="u039-tab"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
