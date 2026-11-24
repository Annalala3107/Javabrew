import { useEffect, useState } from 'react';
import type { TocHeading } from '../types/content';

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;
    setActiveId(headings[0].id);

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-72px 0px -70% 0px', threshold: 0.1 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside
      aria-label="Mục lục bài viết"
      className="hidden w-56 shrink-0 xl:block"
    >
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Trong trang này
        </div>
        <ul className="space-y-1 border-l border-[var(--border-default)]">
          {headings.map((h) => {
            const active = activeId === h.id;
            const indent =
              h.level === 3 ? 'pl-5 text-xs' : h.level === 2 ? 'pl-3 text-[13px]' : 'pl-2.5 text-[13px] font-medium';
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(h.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setActiveId(h.id);
                    }
                  }}
                  className={[
                    '-ml-px block border-l py-1 leading-snug transition-colors',
                    indent,
                    active
                      ? 'border-[var(--accent)] font-medium text-[var(--accent-text)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
