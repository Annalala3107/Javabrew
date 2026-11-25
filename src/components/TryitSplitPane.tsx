import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { GripHorizontal, GripVertical } from 'lucide-react';

interface TryitSplitPaneProps {
  orientation: 'horizontal' | 'vertical';
  splitPercent: number;
  onSplitChange: (nextPercent: number) => void;
  primaryPane: ReactNode;
  secondaryPane: ReactNode;
}

const MIN_SPLIT = 28;
const MAX_SPLIT = 72;

function clampSplit(val: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, Math.round(val)));
}

export function TryitSplitPane({
  orientation,
  splitPercent,
  onSplitChange,
  primaryPane,
  secondaryPane,
}: TryitSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const onSplitChangeRef = useRef(onSplitChange);
  onSplitChangeRef.current = onSplitChange;

  const clamped = clampSplit(splitPercent);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (ev: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (orientation === 'horizontal' && rect.width > 0) {
        const pct = ((ev.clientX - rect.left) / rect.width) * 100;
        onSplitChangeRef.current(clampSplit(pct));
      } else if (orientation === 'vertical' && rect.height > 0) {
        const pct = ((ev.clientY - rect.top) / rect.height) * 100;
        onSplitChangeRef.current(clampSplit(pct));
      }
    };

    const stopDrag = () => setDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, [dragging, orientation]);

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      data-testid="tryit-split-pane"
      data-orientation={orientation}
      style={
        {
          '--tryit-split': `${clamped}%`,
        } as CSSProperties
      }
      className={[
        'flex min-h-0 flex-1 flex-col',
        isHorizontal ? 'lg:flex-row' : '',
        dragging ? 'select-none' : '',
      ].join(' ')}
    >
      <div
        className={[
          'flex min-w-0 flex-col bg-[var(--bg-code)]',
          isHorizontal
            ? 'min-h-[340px] lg:min-h-[500px] lg:w-[var(--tryit-split)] lg:shrink-0'
            : 'min-h-[320px] lg:h-[var(--tryit-split)] lg:shrink-0',
        ].join(' ')}
      >
        {primaryPane}
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-label="Kéo để chỉnh tỷ lệ khung Code và Output (nhấp đúp để cân 50/50)"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-valuemin={MIN_SPLIT}
        aria-valuemax={MAX_SPLIT}
        aria-valuenow={clamped}
        title="Kéo để chia lại tỷ lệ Code / Output (nhấp đúp đặt về 50%)"
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDoubleClick={() => onSplitChange(50)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            onSplitChange(clampSplit(clamped - 4));
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            onSplitChange(clampSplit(clamped + 4));
          } else if (e.key === 'Home') {
            e.preventDefault();
            onSplitChange(50);
          }
        }}
        className={[
          'group flex shrink-0 items-center justify-center border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-dim)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)] focus-visible:outline-2',
          isHorizontal
            ? 'h-2.5 w-full cursor-row-resize border-y lg:h-auto lg:w-2.5 lg:cursor-col-resize lg:border-x lg:border-y-0'
            : 'h-2.5 w-full cursor-row-resize border-y',
          dragging ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]' : '',
        ].join(' ')}
      >
        {isHorizontal ? (
          <>
            <GripVertical className="hidden h-4 w-3 lg:block" aria-hidden="true" />
            <GripHorizontal className="h-3 w-4 lg:hidden" aria-hidden="true" />
          </>
        ) : (
          <GripHorizontal className="h-3 w-4" aria-hidden="true" />
        )}
      </div>

      <div className="flex min-h-[280px] min-w-0 flex-1 flex-col bg-[var(--bg-canvas)] lg:min-h-[300px]">
        {secondaryPane}
      </div>
    </div>
  );
}
