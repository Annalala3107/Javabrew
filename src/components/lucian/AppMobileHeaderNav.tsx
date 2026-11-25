// Lucian UX/UI Prompt #412 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#412
import { useEffect, useId, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './lucian-412.css';

export interface MobileNavRoute {
  to: string;
  label: string;
  match: (pathname: string) => boolean;
}

interface AppMobileHeaderTriggerProps {
  open: boolean;
  onToggle: () => void;
  panelId: string;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export function AppMobileHeaderTrigger({
  open,
  onToggle,
  panelId,
  buttonRef,
}: AppMobileHeaderTriggerProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
      className="ux u412-bg md:hidden"
    >
      <i aria-hidden="true" />
      <i aria-hidden="true" />
    </button>
  );
}

interface AppMobileHeaderDrawerProps {
  open: boolean;
  onClose: (restoreFocus?: boolean) => void;
  panelId: string;
  items: readonly MobileNavRoute[];
}

export function AppMobileHeaderDrawer({
  open,
  onClose,
  panelId,
  items,
}: AppMobileHeaderDrawerProps) {
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (open) onClose(false);
    }
  }, [location.pathname, open, onClose]);

  useEffect(() => {
    const el = navRef.current;
    if (el) {
      el.inert = !open;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <nav
      ref={navRef}
      id={panelId}
      aria-label="Điều hướng di động"
      aria-hidden={!open}
      className={`ux u412-sh md:hidden ${open ? 'is-open' : ''}`}
    >
      <div>
        <ul className="u412-ln">
          {items.map((item, idx) => {
            const active = item.match(location.pathname);
            return (
              <li key={item.to} style={{ '--i': idx } as React.CSSProperties}>
                <NavLink
                  to={item.to}
                  tabIndex={open ? 0 : -1}
                  onClick={() => onClose(false)}
                  className={active ? 'is-active' : undefined}
                >
                  <span>{item.label}</span>
                  <svg viewBox="0 0 14 14" aria-hidden="true">
                    <path d="m5.5 3 4 4-4 4" />
                  </svg>
                </NavLink>
              </li>
            );
          })}
          <li style={{ '--i': items.length } as React.CSSProperties}>
            <Link
              to="/studio/playground?example=demo-intro"
              tabIndex={open ? 0 : -1}
              onClick={() => onClose(false)}
              className={
                location.pathname.startsWith('/studio/playground') ? 'is-active' : undefined
              }
            >
              <span>Java Tryit (W3Schools)</span>
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path d="m5.5 3 4 4-4 4" />
              </svg>
            </Link>
          </li>
          <li style={{ '--i': items.length + 1 } as React.CSSProperties}>
            <a
              href="https://anan-mocha.vercel.app/quizzes"
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={open ? 0 : -1}
              onClick={() => onClose(false)}
            >
              <span>Ôn FE (AnanQuiz)</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export function useMobileHeaderMenuId() {
  return useId();
}
