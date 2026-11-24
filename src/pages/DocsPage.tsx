import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Image as ImageIcon,
  Languages,
  RefreshCw,
  Search,
} from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { TableOfContents } from '../components/TableOfContents';
import { useApp } from '../context/AppContext';
import type { NavArticle, TocHeading } from '../types/content';
import { parseMarkdownDocument } from '../utils/markdown';
import { estimateReadingMinutes, normalizeSearchText } from '../utils/text';

export function DocsPage() {
  const params = useParams();
  const location = useLocation();
  const rel = params['*'] || '';
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    navigation,
    lang,
    setLang,
    progress,
    toggleArticleCompleted,
    recordVisit,
    metaLoading,
  } = useApp();

  // Directory filters
  const selectedDomainId = searchParams.get('domain') || 'all';
  const [dirQuery, setDirQuery] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Reader state
  const [rawMd, setRawMd] = useState('');
  const [loadedLang, setLoadedLang] = useState<'vi' | 'en'>(lang);
  const [fallbackNotice, setFallbackNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [domHeadings, setDomHeadings] = useState<TocHeading[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);

  const flatArticleList = useMemo(() => {
    if (!navigation) return [];
    const list: {
      rel: string;
      article: NavArticle;
      domainId: string;
      domainLabel: string;
      groupLabel: string;
    }[] = [];

    for (const dom of navigation.domains) {
      for (const grp of dom.groups) {
        for (const art of grp.articles) {
          list.push({
            rel: art.rel,
            article: art,
            domainId: dom.id,
            domainLabel: lang === 'vi' ? dom.labelVi : dom.labelEn,
            groupLabel: lang === 'vi' ? grp.labelVi : grp.labelEn,
          });
        }
      }
    }
    return list;
  }, [navigation, lang]);

  const currentIndex = useMemo(
    () => (rel ? flatArticleList.findIndex((item) => item.rel === rel) : -1),
    [flatArticleList, rel]
  );

  const currentInfo = currentIndex >= 0 ? flatArticleList[currentIndex] : null;
  const prevInfo = currentIndex > 0 ? flatArticleList[currentIndex - 1] : null;
  const nextInfo =
    currentIndex >= 0 && currentIndex < flatArticleList.length - 1
      ? flatArticleList[currentIndex + 1]
      : null;

  // Fetch article markdown when `rel` is non-empty
  useEffect(() => {
    if (!rel) {
      setRawMd('');
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setFallbackNotice(false);

    const otherLang: 'vi' | 'en' = lang === 'vi' ? 'en' : 'vi';

    fetch(`/content/${lang}/${rel}`)
      .then(async (res): Promise<{ text: string; actualLang: 'vi' | 'en'; fallback: boolean }> => {
        if (res.ok) {
          return { text: await res.text(), actualLang: lang, fallback: false };
        }
        const altRes = await fetch(`/content/${otherLang}/${rel}`);
        if (altRes.ok) {
          return { text: await altRes.text(), actualLang: otherLang, fallback: true };
        }
        throw new Error(`Không tìm thấy bài viết "${rel}" (HTTP ${res.status}).`);
      })
      .then(({ text, actualLang, fallback }) => {
        if (!cancelled) {
          setRawMd(text);
          setLoadedLang(actualLang);
          setFallbackNotice(fallback);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Lỗi tải bài viết JavaGuide.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rel, lang, reloadTick]);

  const parsed = useMemo(() => {
    if (!rawMd) return null;
    return parseMarkdownDocument(rawMd);
  }, [rawMd]);

  const displayTitle = useMemo(() => {
    if (parsed?.meta.title) return parsed.meta.title;
    if (currentInfo) {
      return loadedLang === 'vi'
        ? currentInfo.article.titleVi || currentInfo.article.titleEn
        : currentInfo.article.titleEn || currentInfo.article.titleVi;
    }
    return rel.split('/').pop()?.replace(/\.md$/, '') || 'JavaGuide';
  }, [parsed, currentInfo, loadedLang, rel]);

  // Record visit
  useEffect(() => {
    if (rel && !loading && !error && parsed) {
      recordVisit({
        path: `/docs/${rel}`,
        title: displayTitle,
        kind: 'docs',
        updatedAt: new Date().toISOString(),
      });
    }
  }, [rel, loading, error, parsed, displayTitle, recordVisit]);

  // Extract rendered DOM headings for TOC and scroll to #hash anchor once loaded
  useEffect(() => {
    if (loading || !parsed || !articleRef.current) {
      setDomHeadings([]);
      return;
    }

    const container = articleRef.current;
    const els = Array.from(container.querySelectorAll('h2[id], h3[id]'));
    setDomHeadings(
      els
        .map((el) => ({
          id: el.id,
          text: el.textContent?.trim() || '',
          level: (el.tagName === 'H2' ? 2 : 3) as 2 | 3,
        }))
        .filter((h) => h.text.length > 0)
    );

    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      const timer = window.setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [loading, parsed, location.hash]);

  // Directory mode: /docs
  if (!rel) {
    const q = normalizeSearchText(dirQuery);

    const visibleDomains = (navigation?.domains || [])
      .filter((d) => selectedDomainId === 'all' || d.id === selectedDomainId)
      .map((dom) => {
        const groups = dom.groups
          .map((grp) => {
            const articles = grp.articles.filter((art) => {
              const isDone = progress.completedArticles.includes(art.rel);
              if (readFilter === 'read' && !isDone) return false;
              if (readFilter === 'unread' && isDone) return false;
              if (!q) return true;
              const hay = normalizeSearchText(
                `${art.titleVi} ${art.titleEn} ${art.rel} ${grp.labelVi} ${grp.labelEn}`
              );
              return hay.includes(q);
            });
            return { grp, articles };
          })
          .filter((g) => g.articles.length > 0);
        return { dom, groups };
      })
      .filter((d) => d.groups.length > 0);

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2 border-b border-[var(--border-default)] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {lang === 'vi'
              ? 'Kho tri thức JavaGuide (354 bài song ngữ)'
              : 'JavaGuide Knowledge Base (354 Bilingual Articles)'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {lang === 'vi'
              ? 'Chọn cụm chuyên đề hoặc lọc từ khóa để đọc bản dịch tiếng Việt hoặc tiếng Anh.'
              : 'Select a domain or filter articles to study in English or Vietnamese.'}
          </p>
        </header>

        {/* Filter bar */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="search"
                value={dirQuery}
                onChange={(e) => setDirQuery(e.target.value)}
                placeholder={
                  lang === 'vi'
                    ? 'Lọc theo tiêu đề Việt/Anh hoặc đường dẫn (ví dụ: hashmap, jvm, rag)...'
                    : 'Filter by title or path (e.g. hashmap, jvm, rag)...'
                }
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5 text-xs font-medium">
              {(['all', 'unread', 'read'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setReadFilter(status)}
                  className={[
                    'rounded-md px-3 py-1.5 transition-colors',
                    readFilter === status
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {status === 'all' ? 'Tất cả' : status === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
                </button>
              ))}
            </div>
          </div>

          {/* Domain filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={[
                'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                selectedDomainId === 'all'
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Tất cả ({navigation?.totalArticles ?? 354})
            </button>

            {navigation?.domains.map((dom) => {
              const active = selectedDomainId === dom.id;
              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => setSearchParams({ domain: dom.id })}
                  className={[
                    'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {lang === 'vi' ? dom.labelVi : dom.labelEn} ({dom.totalArticles})
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles list */}
        {metaLoading && !navigation ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
              />
            ))}
          </div>
        ) : visibleDomains.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--text-muted)]">
            Không có bài viết nào khớp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="space-y-6">
            {visibleDomains.map(({ dom, groups }) => (
              <section key={dom.id} className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-[var(--border-default)] pb-2">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {lang === 'vi' ? dom.labelVi : dom.labelEn}
                  </h2>
                  <span className="text-xs text-[var(--text-muted)]">
                    {lang === 'vi' ? dom.labelEn : dom.labelVi}
                  </span>
                </div>

                <div className="space-y-3">
                  {groups.map(({ grp, articles }) => (
                    <div
                      key={`${dom.id}-${grp.id}`}
                      className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                        <span>{lang === 'vi' ? grp.labelVi : grp.labelEn}</span>
                        <span className="tabular-nums text-[var(--text-muted)]">
                          {articles.length} bài
                        </span>
                      </div>
                      <ul className="divide-y divide-[var(--border-default)]">
                        {articles.map((art) => {
                          const done = progress.completedArticles.includes(art.rel);
                          const primary =
                            lang === 'vi' ? art.titleVi || art.titleEn : art.titleEn || art.titleVi;
                          const secondary =
                            lang === 'vi' ? art.titleEn || art.titleVi : art.titleVi || art.titleEn;

                          return (
                            <li
                              key={art.rel}
                              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-surface-muted)]"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleArticleCompleted(art.rel)}
                                  aria-label={`Đánh dấu đã đọc ${primary}`}
                                  aria-pressed={done}
                                  className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--success)]"
                                >
                                  {done ? (
                                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                                  ) : (
                                    <Circle className="h-4 w-4" />
                                  )}
                                </button>
                                <Link to={`/docs/${art.rel}`} className="min-w-0 space-y-0.5">
                                  <div className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)]">
                                    {primary}
                                  </div>
                                  <div className="truncate text-xs text-[var(--text-muted)]">
                                    {secondary}
                                  </div>
                                </Link>
                              </div>

                              <div className="hidden shrink-0 items-center gap-3 text-xs tabular-nums text-[var(--text-muted)] sm:flex">
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
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Reader mode: /docs/*
  const isCompleted = progress.completedArticles.includes(rel);
  const readingMins = currentInfo
    ? estimateReadingMinutes(currentInfo.article.chars)
    : estimateReadingMinutes(rawMd.length);

  return (
    <div className="mx-auto flex max-w-6xl gap-8">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link to="/docs" className="hover:text-[var(--accent-text)] hover:underline">
            JavaGuide
          </Link>
          {currentInfo && (
            <>
              <span>/</span>
              <Link
                to={`/docs?domain=${currentInfo.domainId}`}
                className="hover:text-[var(--accent-text)] hover:underline"
              >
                {currentInfo.domainLabel}
              </Link>
              <span>/</span>
              <span className="text-[var(--text-secondary)]">{currentInfo.groupLabel}</span>
            </>
          )}
        </nav>

        {/* Article Header Card */}
        <header className="space-y-4 border-b border-[var(--border-default)] pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {displayTitle}
              </h1>
              {parsed?.meta.description && (
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {parsed.meta.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="h-3.5 w-3.5" />
                <span>~{readingMins} phút đọc</span>
              </span>
              {currentInfo && currentInfo.article.images > 0 && (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{currentInfo.article.images} minh họa</span>
                </span>
              )}
              {parsed?.meta.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              >
                <Languages className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{lang === 'vi' ? 'Đọc bản English' : 'Đọc bản Tiếng Việt'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleArticleCompleted(rel)}
                aria-pressed={isCompleted}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                  isCompleted
                    ? 'border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                <span>{isCompleted ? 'Đã đọc xong' : 'Đánh dấu đã đọc'}</span>
              </button>
            </div>
          </div>

          {fallbackNotice && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--warning)]">
              Bài viết này chưa có ở ngôn ngữ đang chọn, hệ thống đang hiển thị bản ngôn ngữ thay thế ({loadedLang.toUpperCase()}).
            </div>
          )}
        </header>

        {/* Body */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-5 w-full animate-pulse rounded bg-[var(--bg-surface-muted)]" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-[var(--bg-surface-muted)]" />
            <div className="h-44 animate-pulse rounded-xl bg-[var(--bg-surface-muted)]" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-[var(--bg-surface-muted)]" />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-[var(--border-default)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger)]"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>Không thể mở bài viết</span>
            </div>
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReloadTick((t) => t + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Thử lại</span>
              </button>
              <Link
                to="/docs"
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
              >
                Về danh mục JavaGuide
              </Link>
            </div>
          </div>
        ) : (
          <div ref={articleRef}>
            <MarkdownRenderer content={parsed?.body || ''} currentRel={rel} />
          </div>
        )}

        {/* Prev / Next article footer */}
        <footer className="grid gap-3 border-t border-[var(--border-default)] pt-6 sm:grid-cols-2">
          {prevInfo ? (
            <Link
              to={`/docs/${prevInfo.rel}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-left transition-colors hover:border-[var(--accent)]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-muted)]">Bài trước</div>
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {lang === 'vi'
                    ? prevInfo.article.titleVi || prevInfo.article.titleEn
                    : prevInfo.article.titleEn || prevInfo.article.titleVi}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextInfo ? (
            <Link
              to={`/docs/${nextInfo.rel}`}
              className="flex items-center justify-end gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-right transition-colors hover:border-[var(--accent)]"
            >
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-muted)]">Bài tiếp theo</div>
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {lang === 'vi'
                    ? nextInfo.article.titleVi || nextInfo.article.titleEn
                    : nextInfo.article.titleEn || nextInfo.article.titleVi}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </Link>
          ) : (
            <div />
          )}
        </footer>
      </div>

      <TableOfContents headings={domHeadings} />
    </div>
  );
}
