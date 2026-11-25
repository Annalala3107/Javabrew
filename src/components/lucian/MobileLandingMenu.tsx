// Lucian UX/UI Prompt #045 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#045
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './lucian-045.css';

const ANCHOR_ITEMS = [
  { href: '#m1-sources', num: '01', label: 'Nguồn tài liệu' },
  { href: '#m1-roadmap', num: '02', label: 'Chọn lộ trình' },
  { href: '#m1-features', num: '03', label: 'Tính năng lớp học' },
  { href: '#m1-how', num: '04', label: 'Cách học 3 bước' },
];

export function MobileLandingMenu() {
  const [open, setOpen] = useState(false);
  const hamRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const syncOrigin = () => {
    const ham = hamRef.current;
    const sheet = sheetRef.current;
    if (!ham || !sheet) return;
    const r = ham.getBoundingClientRect();
    sheet.style.setProperty('--cx', `${Math.round(r.left + r.width / 2)}px`);
    sheet.style.setProperty('--cy', `${Math.round(r.top + r.height / 2)}px`);
  };

  useEffect(() => {
    if (!open) return;
    syncOrigin();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus({ preventScroll: true });
    }, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        hamRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const focusables = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>('button, a')
      );
      if (focusables.length === 0) return;
      const idx = focusables.indexOf(document.activeElement as HTMLElement);
      if (idx < 0) {
        e.preventDefault();
        focusables[0].focus();
        return;
      }
      e.preventDefault();
      const next =
        focusables[(idx + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length];
      next.focus();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    hamRef.current?.focus();
  };

  const sheetNode = (
    <div
      id="m1-mobile-menu-sheet"
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu điều hướng JavaBrew"
      aria-hidden={!open}
      className={`ux u045-sheet ${open ? 'is-open' : ''}`}
    >
      <div className="u045-sheet-head">
        <small>JavaBrew · Điều hướng nhanh</small>
        <button
          ref={closeBtnRef}
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={closeMenu}
          aria-label="Đóng menu điều hướng"
          className="u045-ham is-open"
        >
          <i />
          <i />
          <i />
        </button>
      </div>

      <ul className="u045-nav">
        {ANCHOR_ITEMS.map((item, idx) => (
          <li key={item.href}>
            <a
              href={item.href}
              tabIndex={open ? 0 : -1}
              style={{ '--i': idx } as React.CSSProperties}
              onClick={() => setOpen(false)}
              className="u045-ln"
            >
              <em>{item.num}</em>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
        <li>
          <a
            href="https://anan-mocha.vercel.app/quizzes"
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={open ? 0 : -1}
            style={{ '--i': 4 } as React.CSSProperties}
            onClick={() => setOpen(false)}
            className="u045-ln"
          >
            <em>05</em>
            <span className="inline-flex items-center gap-1.5">
              Ôn FE (AnanQuiz)
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </a>
        </li>
      </ul>

      <div className="u045-foot">
        <Link to="/studio" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
          Thử Code Studio
        </Link>
        <Link
          to="/dashboard"
          className="go"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        >
          Vào Dashboard ngay →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="ux md:hidden">
      <button
        ref={hamRef}
        type="button"
        onClick={() => {
          syncOrigin();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls="m1-mobile-menu-sheet"
        aria-label={open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        className={`u045-ham ${open ? 'is-open' : ''}`}
      >
        <i />
        <i />
        <i />
      </button>

      {typeof document !== 'undefined' ? createPortal(sheetNode, document.body) : sheetNode}
    </div>
  );
}
