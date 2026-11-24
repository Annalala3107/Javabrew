export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 text-[var(--accent)]"
      >
        <rect
          x="1.5"
          y="1.5"
          width="25"
          height="25"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.75"
          fill="var(--accent-soft)"
        />
        <path
          d="M10.5 9.5L7.5 14L10.5 18.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.5 9.5L20.5 14L17.5 18.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.2 8.5L12.8 19.5"
          stroke="var(--text-primary)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
            JavaBrew
          </span>
          <span className="hidden sm:inline text-[11px] font-medium text-[var(--text-muted)]">
            PRO192 × JavaGuide
          </span>
        </span>
      )}
    </span>
  );
}
