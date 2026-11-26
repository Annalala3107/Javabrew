import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, Image as ImageIcon, Search } from 'lucide-react';
import type { Lang, NavigationData } from '../../types/content';
import { estimateReadingMinutes, normalizeSearchText } from '../../utils/text';
import { SkeletonCard } from '../lucian/SkeletonCard';

interface DocsDirectoryViewProps {
  navigation: NavigationData | null;
  lang: Lang;
  metaLoading: boolean;
  completedArticles: string[];
  toggleArticleCompleted: (rel: string) => void;
}

export function DocsDirectoryView({
  navigation,
  lang,
  metaLoading,
  completedArticles,
  toggleArticleCompleted,
}: DocsDirectoryViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDomainId = searchParams.get('domain') || 'all';
  const [dirQuery, setDirQuery] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="space-y-1.5 border-b border-[var(--border-default)] pb-4">
        <span className="inline-block rounded-md border border-[var(--info)]/30 bg-[var(--info-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--info-text)]">
          JavaGuide · {navigation?.totalArticles ?? 354} bài song ngữ EN/VI
        </span>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Danh mục Kho Tri thức JavaGuide
        </h1>
      </header>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-dim)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={dirQuery}
              onChange={(e) => setDirQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-label="Tìm theo tên bài hoặc đường dẫn"
              placeholder="Tìm theo tên bài Việt/Anh hoặc đường dẫn…"
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            />
          </div>
          <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-0.5 text-xs">
            {(['all', 'unread', 'read'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setReadFilter(status)}
                className={[
                  'rounded-md px-3 py-1.5 transition-colors',
                  readFilter === status
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {status === 'all' ? 'Tất cả' : status === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={[
              'rounded-lg border px-2.5 py-1 transition-colors',
              selectedDomainId === 'all'
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)]',
            ].join(' ')}
          >
            Tất cả ({navigation?.totalArticles ?? 354})
          </button>
          {navigation?.domains.map((dom) => (
            <button
              key={dom.id}
              type="button"
              onClick={() => setSearchParams({ domain: dom.id })}
              className={[
                'rounded-lg border px-2.5 py-1 transition-colors',
                selectedDomainId === dom.id
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)]',
              ].join(' ')}
            >
              {lang === 'vi' ? dom.labelVi : dom.labelEn} ({dom.totalArticles})
            </button>
          ))}
        </div>
      </div>

      {metaLoading && !navigation ? (
        <SkeletonCard variant="article" />
      ) : (
        <div className="space-y-5">
          {(navigation?.domains || [])
            .filter((d) => selectedDomainId === 'all' || d.id === selectedDomainId)
            .map((dom) => {
              const q = normalizeSearchText(dirQuery);
              const groups = dom.groups
                .map((grp) => ({
                  grp,
                  articles: grp.articles.filter((art) => {
                    const done = completedArticles.includes(art.rel);
                    if (readFilter === 'read' && !done) return false;
                    if (readFilter === 'unread' && done) return false;
                    if (!q) return true;
                    return normalizeSearchText(
                      `${art.titleVi} ${art.titleEn} ${art.rel}`
                    ).includes(q);
                  }),
                }))
                .filter((g) => g.articles.length > 0);
              if (groups.length === 0) return null;

              return (
                <section key={dom.id} className="space-y-3">
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {lang === 'vi' ? dom.labelVi : dom.labelEn}{' '}
                    <span className="font-normal text-[var(--text-dim)]">
                      · {lang === 'vi' ? dom.labelEn : dom.labelVi}
                    </span>
                  </h2>

                  {groups.map(({ grp, articles }) => (
                    <div
                      key={`${dom.id}-${grp.id}`}
                      className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)]"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">
                        <span>{lang === 'vi' ? grp.labelVi : grp.labelEn}</span>
                        <span className="tabular-nums">{articles.length} bài</span>
                      </div>
                      <ul className="divide-y divide-[var(--border-default)]">
                        {articles.map((art) => {
                          const done = completedArticles.includes(art.rel);
                          const primary =
                            lang === 'vi'
                              ? art.titleVi || art.titleEn
                              : art.titleEn || art.titleVi;
                          const secondary =
                            lang === 'vi'
                              ? art.titleEn || art.titleVi
                              : art.titleVi || art.titleEn;

                          return (
                            <li
                              key={art.rel}
                              className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--bg-surface)]/50"
                            >
                              <div className="flex min-w-0 items-start gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => toggleArticleCompleted(art.rel)}
                                  aria-label={`Đánh dấu đã đọc ${primary}`}
                                  aria-pressed={done}
                                  className="mt-0.5 shrink-0"
                                >
                                  {done ? (
                                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-[var(--text-dim)]" />
                                  )}
                                </button>
                                <Link to={`/docs/${art.rel}`} className="min-w-0">
                                  <div className="text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)]">
                                    {primary}
                                  </div>
                                  <div className="truncate text-xs text-[var(--text-dim)]">
                                    {secondary}
                                  </div>
                                </Link>
                              </div>

                              <div className="hidden shrink-0 items-center gap-3 text-xs tabular-nums text-[var(--text-dim)] sm:flex">
                                {art.images > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    {art.images}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {estimateReadingMinutes(art.chars)} phút
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}
