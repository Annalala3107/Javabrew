// Lucian UX/UI Prompt #219 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#219
import { useApp } from '../../context/AppContext';
import './lucian-219.css';

export function ThemeToggleButton() {
  const { theme, setTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-pressed={isDark}
      title={isDark ? 'Giao diện Tối (bấm để chuyển Sáng)' : 'Giao diện Sáng (bấm để chuyển Tối)'}
      className={`ux u219-tg ${isDark ? 'is-dark' : ''}`}
    >
      <svg className="u219-sun" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
        </g>
      </svg>
      <svg className="u219-moon" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M13.5 9.8A5.6 5.6 0 0 1 6.2 2.5a5.6 5.6 0 1 0 7.3 7.3z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
