import { useEffect, useRef, type RefObject } from 'react';

let openModalCount = 0;
let prevBodyOverflow = '';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('disabled')
  );
}

interface UseModalA11yOptions {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/**
 * Provides WCAG modal accessibility: reference-counted body scroll lock,
 * initial focus, Tab/Shift+Tab focus trap, Escape dismissal, and focus restoration.
 */
export function useModalA11y({
  open,
  containerRef,
  initialFocusRef,
  onClose,
}: UseModalA11yOptions): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const previousActive = document.activeElement as HTMLElement | null;

    if (openModalCount === 0) {
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openModalCount += 1;

    const focusTimer = window.setTimeout(() => {
      const target = initialFocusRef?.current;
      if (target && typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusableElements(container);
      focusables[0]?.focus({ preventScroll: true });
    }, 10);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;

      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (!active || active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);

      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = prevBodyOverflow;
      }

      if (previousActive && previousActive.isConnected && typeof previousActive.focus === 'function') {
        window.setTimeout(() => {
          previousActive.focus({ preventScroll: true });
        }, 0);
      }
    };
  }, [open, containerRef, initialFocusRef]);
}
