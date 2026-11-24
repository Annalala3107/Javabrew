import { Link, NavLink } from 'react-router-dom';
import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { to: '/', labelVi: 'Trang chủ', labelEn: 'Home', end: true },
  { to: '/pro192', labelVi: 'PRO192', labelEn: 'PRO192', end: false },
  { to: '/docs', labelVi: 'JavaGuide', labelEn: 'JavaGuide', end: false },
  { to: '/pe', labelVi: 'Ôn thi PE', labelEn: 'PE Arena', end: false },
  { to: '/resources', labelVi: 'Tài nguyên', labelEn: 'Resources', end: false },
];

export function TopBar() {
  const {
    lang,
    setLang,
    theme,
    toggleTheme,
    setIsSearchOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[var(--border-default)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label={isMobileSidebarOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={isMobileSidebarOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] lg:hidden"
          >
            {isMobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link to="/" className="rounded-md focus-visible:outline-2">
            <Logo />
          </Link>
        </div>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')
              }
            >
              {lang === 'vi' ? item.labelVi : item.labelEn}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label={lang === 'vi' ? 'Mở tìm kiếm toàn cục (Ctrl+K)' : 'Open global search (Ctrl+K)'}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:w-52 sm:justify-between"
          >
            <span className="inline-flex items-center gap-2 truncate">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span className="hidden sm:inline truncate">
                {lang === 'vi' ? 'Tìm bài, slot, bài tập...' : 'Search docs, slots...'}
              </span>
            </span>
            <kbd className="hidden rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)] sm:inline-block">
              Ctrl K
            </kbd>
          </button>

          <div
            role="group"
            aria-label="Ngôn ngữ tài liệu JavaGuide"
            className="inline-flex h-9 items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5"
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
                    'rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
                    active
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {code}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
