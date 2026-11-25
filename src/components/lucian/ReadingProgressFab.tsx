// Lucian UX/UI Prompt #450 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#450
import { useEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-450.css';

interface ReadingProgressFabProps {
  focusMode?: boolean;
}

export function ReadingProgressFab({ focusMode = false }: ReadingProgressFabProps) {
  const [progress, setProgress] = useState(0);
  const [flying, setFlying] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      if (maxScroll <= 120) {
        setProgress(window.scrollY > 80 ? 1 : 0);
        return;
      }
      setProgress(Math.max(0, Math.min(1, window.scrollY / maxScroll)));
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const showTop = progress > 0.08;

  const scrollToTop = () => {
    const rm = getPrefersReducedMotion();
    if (!rm) {
      setFlying(true);
      window.setTimeout(() => setFlying(false), 700);
    }
    window.scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' });
  };

  return (
    <div className={`ux u450-root ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Lên đầu trang"
        className={`u450-top ${!showTop || open ? 'is-hide' : ''} ${flying ? 'is-fly' : ''}`}
        style={{ '--p': progress.toFixed(3) } as React.CSSProperties}
      >
        <svg className="rg" viewBox="0 0 44 44" aria-hidden="true">
          <circle className="tr" cx="22" cy="22" r="19.5" />
          <circle className="pr" cx="22" cy="22" r="19.5" />
        </svg>
        <svg className="ar" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M9 14.5V4M4.5 8 9 3.5 13.5 8" />
        </svg>
      </button>

      {!focusMode && (
        <div className="u450-fab">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở phím tắt & mẹo học"
            aria-expanded={open}
            className="u450-open"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <div
            role="dialog"
            aria-label="Phím tắt học tập JavaBrew"
            aria-hidden={!open}
            className="u450-panel text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setOpen(false);
              }
            }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
              <span className="font-bold text-[var(--accent-text)]">Phím tắt &amp; Mẹo học</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng bảng phím tắt"
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-1.5 text-[var(--text-secondary)]">
              <li className="flex items-center justify-between gap-2">
                <span>Tìm nhanh toàn hệ</span>
                <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-mono text-xs">
                  Ctrl+K
                </kbd>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Mở tìm nhanh từ đâu cũng được</span>
                <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-mono text-xs">
                  /
                </kbd>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Ẩn sidebar khi đọc sâu</span>
                <span className="font-mono text-xs text-[var(--info-text)]">Focus Mode</span>
              </li>
            </ul>
            <div className="text-xs text-[var(--text-dim)]">
              Tiến độ cuộn trang: <strong className="text-[var(--text-primary)]">{Math.round(progress * 100)}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
