// Lucian UX/UI Prompt #435 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#435
import { useEffect, useRef, useState } from 'react';
import { useApp, type ToastItem } from '../../context/AppContext';
import './lucian-435.css';

const TOAST_LIFE = 4200;

function ToastRow({
  item,
  indexFromFront,
  expanded,
  paused,
  onDismiss,
}: {
  item: ToastItem;
  indexFromFront: number;
  expanded: boolean;
  paused: boolean;
  onDismiss: (id: string) => void;
}) {
  const [undone, setUndone] = useState(false);
  const timerRef = useRef<number>(0);
  const remainingRef = useRef(TOAST_LIFE);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (paused) {
      window.clearTimeout(timerRef.current);
      remainingRef.current = Math.max(
        600,
        remainingRef.current - (Date.now() - startedAtRef.current)
      );
      return;
    }

    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      onDismiss(item.id);
    }, remainingRef.current);

    return () => window.clearTimeout(timerRef.current);
  }, [paused, undone, item.id, onDismiss]);

  const y = expanded ? -indexFromFront * 64 : -indexFromFront * 10;
  const s = expanded ? 1 : Math.max(0.88, 1 - indexFromFront * 0.05);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`u435-t ${!expanded && indexFromFront > 0 ? 'is-back' : ''}`}
      style={
        {
          '--y': `${y}px`,
          '--s': s.toFixed(3),
          '--o': indexFromFront < 3 ? 1 : 0,
          zIndex: 20 - indexFromFront,
        } as React.CSSProperties
      }
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onDismiss(item.id);
        }
      }}
    >
      <span className="u435-ic" data-tone={item.tone || 'success'} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="m6 12.5 4 4 8-9" />
        </svg>
      </span>

      <span className="u435-tx">
        <b>{undone ? 'Đã hoàn tác' : item.title}</b>
        {item.description && !undone && <small>{item.description}</small>}
      </span>

      {item.onUndo && !undone && (
        <button
          type="button"
          onClick={() => {
            setUndone(true);
            item.onUndo?.();
            remainingRef.current = 1200;
          }}
          className="u435-un"
        >
          {item.undoLabel || 'Hoàn tác'}
        </button>
      )}

      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Đóng thông báo"
        className="u435-x"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <span className="u435-pb" aria-hidden="true">
        <i />
      </span>
    </div>
  );
}

export function LucianToastStack() {
  const { toasts, dismissToast } = useApp();
  const [expanded, setExpanded] = useState(false);

  if (toasts.length === 0) return null;

  const visible = toasts.slice(0, 3);
  const stackHeight = expanded ? visible.length * 64 : 60 + Math.max(0, visible.length - 1) * 10;

  return (
    <div className="ux u435-host">
      <section
        aria-label="Thông báo hệ thống"
        className={`u435-rg ${expanded ? 'is-paused' : ''}`}
        style={{ height: `${stackHeight}px` }}
        onPointerEnter={() => setExpanded(true)}
        onPointerLeave={() => setExpanded(false)}
        onFocusCapture={() => setExpanded(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setExpanded(false);
          }
        }}
      >
        {visible.map((item, idx) => (
          <ToastRow
            key={item.id}
            item={item}
            indexFromFront={idx}
            expanded={expanded}
            paused={expanded}
            onDismiss={dismissToast}
          />
        ))}
      </section>
    </div>
  );
}
