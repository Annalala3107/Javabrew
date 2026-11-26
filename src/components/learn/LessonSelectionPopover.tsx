import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { LearnTutorIntent } from '../../services/aiMentorService';

interface LessonSelectionPopoverProps {
  containerRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  isJavaOrPro192: boolean;
  isEnglishContext: boolean;
  onSelectAction: (selectedText: string, intent: LearnTutorIntent, displayPrompt: string) => void;
}

interface PopoverState {
  text: string;
  top: number;
  left: number;
}

function isInsideIgnoredElement(node: Node | null): boolean {
  if (!node) return false;
  const el = node instanceof Element ? node : node.parentElement;
  if (!el) return false;
  return Boolean(el.closest('input, textarea, button, select, [data-no-ai-popover]'));
}

export function LessonSelectionPopover({
  containerRef,
  enabled,
  isJavaOrPro192,
  isEnglishContext,
  onSelectAction,
}: LessonSelectionPopoverProps) {
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const inspectSelection = useCallback(() => {
    if (!enabled) {
      setPopover(null);
      return;
    }
    const container = containerRef.current;
    const selection = window.getSelection();
    if (!container || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setPopover(null);
      return;
    }

    const rawText = selection.toString().trim();
    if (rawText.length < 3 || rawText.length > 800) {
      setPopover(null);
      return;
    }

    const { anchorNode, focusNode } = selection;
    if (!container.contains(anchorNode) || !container.contains(focusNode)) {
      setPopover(null);
      return;
    }
    if (isInsideIgnoredElement(anchorNode) || isInsideIgnoredElement(focusNode)) {
      setPopover(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const hasBox = rect.width > 0 || rect.height > 0;
    const rawCenterX = hasBox ? rect.left + rect.width / 2 : 240;
    const rawTop = hasBox ? rect.top - 48 : 140;

    const clampedLeft = Math.max(
      140,
      Math.min(window.innerWidth - 150, rawCenterX)
    );
    const clampedTop = Math.max(68, Math.min(window.innerHeight - 60, rawTop));

    setPopover({
      text: rawText,
      top: clampedTop,
      left: clampedLeft,
    });
  }, [containerRef, enabled]);

  useEffect(() => {
    if (!enabled) {
      setPopover(null);
      return;
    }

    const onMouseUp = () => window.setTimeout(inspectSelection, 10);
    const onKeyUp = () => window.setTimeout(inspectSelection, 10);
    const onScroll = () => setPopover(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopover(null);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (toolbarRef.current && target && toolbarRef.current.contains(target)) {
        return;
      }
      setPopover(null);
    };

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [enabled, inspectSelection]);

  if (!popover) return null;

  const trigger = (intent: LearnTutorIntent, displayPrompt: string) => {
    const selected = popover.text;
    setPopover(null);
    window.getSelection()?.removeAllRanges();
    onSelectAction(selected, intent, displayPrompt);
  };

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Hỏi AI về đoạn đã chọn"
      style={{
        top: `${popover.top}px`,
        left: `${popover.left}px`,
        transform: 'translateX(-50%)',
      }}
      className="fixed z-40 flex flex-wrap items-center gap-1 rounded-xl border border-[var(--info)]/45 bg-[var(--bg-surface)] px-2 py-1.5 text-xs shadow-[var(--shadow-overlay)]"
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          trigger('explain-simple', `Giải thích dễ hiểu đoạn này giúp mình`)
        }
        className="rounded-lg bg-[var(--info-soft)] px-2.5 py-1 font-semibold text-[var(--info-text)] hover:opacity-90"
      >
        ✨ Giải thích dễ hiểu
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          trigger('java-example', 'Cho 1 ví dụ Java ngắn chạy thử được cho khái niệm này')
        }
        className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 font-semibold text-[var(--accent-text)] hover:opacity-90"
      >
        ☕ Ví dụ Java
      </button>
      {isJavaOrPro192 && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            trigger('exam-relevance', 'Phần này có hay ra thi FE/PE PRO192 không và bẫy thường gặp là gì?')
          }
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
        >
          🎯 Hay ra thi?
        </button>
      )}
      {isEnglishContext && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            trigger('glossary-en-vi', 'Dịch và giải thích thuật ngữ chuyên ngành trong đoạn này')
          }
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-medium text-[var(--text-primary)] hover:border-[var(--info)]"
        >
          🔤 Dịch thuật ngữ
        </button>
      )}
    </div>
  );
}
