interface LogoProps {
  subtitle?: string;
  showBadge?: string;
}

export function Logo({ subtitle = 'PRO192 × JavaGuide', showBadge }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm transition-colors">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 2v2" />
          <path d="M14 2v2" />
          <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
          <path d="M6 2v2" />
        </svg>
      </span>
      <span className="text-left">
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold leading-none text-[var(--text-primary)]">
            JavaBrew
          </span>
          {showBadge && (
            <span className="hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] sm:inline-block">
              {showBadge}
            </span>
          )}
        </span>
        {subtitle && (
          <span className="mt-0.5 block text-xs leading-none text-[var(--text-muted)]">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
