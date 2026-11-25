import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CommandKButton } from './lucian/CommandKButton';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { to: '/', label: 'Giới thiệu', match: (p: string) => p === '/' },
  { to: '/dashboard', label: 'Dashboard', match: (p: string) => p.startsWith('/dashboard') },
  {
    to: '/pro192',
    label: 'Học bài',
    match: (p: string) =>
      p.startsWith('/pro192') || p.startsWith('/docs') || p.startsWith('/resources'),
  },
  { to: '/pe', label: 'Luyện PE', match: (p: string) => p.startsWith('/pe') },
  { to: '/studio', label: 'Code Studio', match: (p: string) => p.startsWith('/studio') },
];

export function TopBar() {
  const location = useLocation();
  const { lang, setLang, setIsSearchOpen, setIsSettingsOpen } = useApp();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <Link
            to="/"
            title="Về Trang Giới thiệu (M1)"
            className="group rounded-lg focus-visible:outline-2"
          >
            <Logo />
          </Link>

          <nav aria-label="Điều hướng chính" className="flex flex-wrap items-center gap-1.5 text-xs">
            {NAV_ITEMS.map((item) => {
              const active = item.match(location.pathname);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={[
                    'inline-flex min-h-[36px] items-center rounded-lg px-3 py-1.5 font-medium transition-colors',
                    active
                      ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {item.label}
                </NavLink>
              );
            })}

            <a
              href="https://anan-mocha.vercel.app/quizzes"
              target="_blank"
              rel="noopener noreferrer"
              title="Mở tab mới sang AnanQuiz ôn trắc nghiệm FE"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
            >
              <span>Ôn FE</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <CommandKButton onClick={() => setIsSearchOpen(true)} />

          <div
            role="group"
            aria-label="Ngôn ngữ JavaGuide"
            className="inline-flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-0.5"
          >
            {(['vi', 'en'] as const).map((code) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={active}
                  className={[
                    'min-h-[32px] rounded-md px-2.5 py-1 text-xs font-bold uppercase transition-colors',
                    active
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {code}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Cài đặt AI Key (BYOK) & Giao diện"
            aria-label="Cài đặt AI Key và Giao diện"
            className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
