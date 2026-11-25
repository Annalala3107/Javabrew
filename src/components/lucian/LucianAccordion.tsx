// Lucian UX/UI Prompt #044 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#044
import { useId, type ReactNode } from 'react';
import './lucian-044.css';

interface LucianAccordionProps {
  open: boolean;
  onToggle: () => void;
  title: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  unmountWhenClosed?: boolean;
  className?: string;
}

export function LucianAccordion({
  open,
  onToggle,
  title,
  trailing,
  children,
  unmountWhenClosed = false,
  className = '',
}: LucianAccordionProps) {
  const uid = useId();
  const bodyId = `${uid}-body`;
  const btnId = `${uid}-btn`;

  return (
    <div className={`ux u044-it ${open ? 'open' : ''} ${className}`}>
      <div className="u044-head">
        <button
          id={btnId}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="u044-q"
        >
          <span className="u044-pm" aria-hidden="true" />
          <span className="min-w-0 flex-1">{title}</span>
        </button>
        {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      </div>

      {unmountWhenClosed ? (
        open ? (
          <div id={bodyId} role="region" aria-labelledby={btnId} className="u044-reveal">
            {children}
          </div>
        ) : null
      ) : (
        <div id={bodyId} role="region" aria-labelledby={btnId} className="u044-body">
          <div>{children}</div>
        </div>
      )}
    </div>
  );
}
