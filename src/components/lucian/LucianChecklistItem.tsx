// Lucian UX/UI Prompt #014 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#014
import type { ReactNode } from 'react';
import './lucian-014.css';

interface LucianChecklistItemProps {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  label: ReactNode;
  trailing?: ReactNode;
  strikethrough?: boolean;
  className?: string;
}

export function LucianChecklistItem({
  checked,
  onToggle,
  ariaLabel,
  label,
  trailing,
  strikethrough = false,
  className = '',
}: LucianChecklistItemProps) {
  return (
    <div className={`ux u014-row ${checked ? 'is-checked' : ''} ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-label={ariaLabel}
          aria-pressed={checked}
          className="u014-trigger"
        >
          <span className="u014-box" aria-hidden="true">
            <svg viewBox="0 0 26 26">
              <path d="M7.5 13.5l3.8 3.8 7.4-8" />
            </svg>
          </span>
        </button>
        <div className="u014-t min-w-0 flex-1" data-strike={strikethrough ? 'true' : 'false'}>
          {label}
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
