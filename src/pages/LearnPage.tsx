import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderArchive,
  GraduationCap,
  Image as ImageIcon,
  Languages,
  Presentation,
  RefreshCw,
  Search,
} from 'lucide-react';
import { ExerciseBlock } from '../components/ExerciseBlock';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { TableOfContents } from '../components/TableOfContents';
import { useApp } from '../context/AppContext';
import type { NavArticle, TocHeading } from '../types/content';
import { parseMarkdownDocument, splitPro192StageContent } from '../utils/markdown';
import {
  estimateReadingMinutes,
  findArticleTitle,
  normalizeSearchText,
  stageFileToSlug,
} from '../utils/text';

type LearnMode = 'pro192' | 'docs' | 'resources';

export function LearnPage({ mode }: { mode: LearnMode }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    navigation,
    pro192,
    lang,
    setLang,
    progress,
    toggleSlotCompleted,
    toggleArticleCompleted,
    toggleBookmark,
    saveNote,
    openPdfPreview,
    recordVisit,
    metaLoading,
  } = useApp();

  // M3/M4 UI states matching prototype-buoc-5.html
  const [savedFilterOnly, setSavedFilterOnly] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [bridgeExpanded, setBridgeExpanded] = useState(true);
  const [treeFilter, setTreeFilter] = useState('');
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({ 1: true });
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({ java: true });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'java/basis': true,
  });

  // Docs directory filters
  const selectedDomainId = searchParams.get('domain') || 'all';
  const [dirQuery, setDirQuery] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [resourceQuery, setResourceQuery] = useState('');

  // Markdown reader state
  const slug = mode === 'pro192' ? params.slug || '' : '';
  const docRel = mode === 'docs' ? params['*'] || '' : '';
  const isReaderView = Boolean(slug || docRel);

  const [rawMd, setRawMd] = useState('');
  const [loadedLang, setLoadedLang] = useState<'vi' | 'en'>(lang);
  const [fallbackNotice, setFallbackNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [forceRevealAll, setForceRevealAll] = useState<boolean | null>(null);
  const [domHeadings, setDomHeadings] = useState<TocHeading[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);

  const activeStage = useMemo(() => {
    if (!pro192 || !slug) return null;
    return pro192.stages.find((s) => stageFileToSlug(s.file) === slug) ?? null;
  }, [pro192, slug]);

  // Auto-expand sidebar tree for active stage/doc
  useEffect(() => {
    if (activeStage) {
      setExpandedStages((prev) => ({ ...prev, [activeStage.id]: true }));
    }
  }, [activeStage]);

  useEffect(() => {
    if (!navigation || !docRel) return;
    for (const dom of navigation.domains) {
      for (const grp of dom.groups) {
        if (grp.articles.some((a) => a.rel === docRel)) {
          setExpandedDomains((prev) => ({ ...prev, [dom.id]: true }));
          setExpandedGroups((prev) => ({ ...prev, [`${dom.id}/${grp.id}`]: true }));
          return;
        }
      }
    }
  }, [navigation, docRel]);

  // Fetch Markdown when in stage or doc reader view
  useEffect(() => {
    if (!isReaderView) {
      setRawMd('');
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setFallbackNotice(false);
    setForceRevealAll(null);

    if (mode === 'pro192' && slug) {
      fetch(`/content/vi/pro192/${slug}.md`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`Không tìm thấy giáo trình "${slug}.md" (HTTP ${res.status}).`);
          return res.text();
        })
        .then((text) => {
          if (!cancelled) {
            setRawMd(text);
            setLoadedLang('vi');
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Lỗi tải giáo trình PRO192.');
            setLoading(false);
          }
        });
    } else if (mode === 'docs' && docRel) {
      const otherLang: 'vi' | 'en' = lang === 'vi' ? 'en' : 'vi';
      fetch(`/content/${lang}/${docRel}`)
        .then(async (res): Promise<{ text: string; actualLang: 'vi' | 'en'; fallback: boolean }> => {
          if (res.ok) return { text: await res.text(), actualLang: lang, fallback: false };
          const altRes = await fetch(`/content/${otherLang}/${docRel}`);
          if (altRes.ok) {
            return { text: await altRes.text(), actualLang: otherLang, fallback: true };
          }
          throw new Error(`Không tìm thấy bài viết "${docRel}" (HTTP ${res.status}).`);
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
    }

    return () => {
      cancelled = true;
    };
  }, [isReaderView, mode, slug, docRel, lang, reloadTick]);

  const parsed = useMemo(() => (rawMd ? parseMarkdownDocument(rawMd) : null), [rawMd]);
  const proSegments = useMemo(
    () => (mode === 'pro192' && parsed ? splitPro192StageContent(parsed.body) : []),
    [mode, parsed]
  );
  const stageExercises = useMemo(
    () => proSegments.filter((s) => s.type === 'exercise').map((s) => s.exercise),
    [proSegments]
  );

  // Flattened JavaGuide list for prev/next
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

  const currentDocIndex = useMemo(
    () => (docRel ? flatArticleList.findIndex((i) => i.rel === docRel) : -1),
    [flatArticleList, docRel]
  );
  const currentDocInfo = currentDocIndex >= 0 ? flatArticleList[currentDocIndex] : null;
  const prevDocInfo = currentDocIndex > 0 ? flatArticleList[currentDocIndex - 1] : null;
  const nextDocInfo =
    currentDocIndex >= 0 && currentDocIndex < flatArticleList.length - 1
      ? flatArticleList[currentDocIndex + 1]
      : null;

  const displayTitle = useMemo(() => {
    if (mode === 'pro192' && activeStage) return activeStage.title;
    if (parsed?.meta.title) return parsed.meta.title;
    if (currentDocInfo) {
      return loadedLang === 'vi'
        ? currentDocInfo.article.titleVi || currentDocInfo.article.titleEn
        : currentDocInfo.article.titleEn || currentDocInfo.article.titleVi;
    }
    if (mode === 'resources') return 'Kho Slide PDF & PPTX (Offline)';
    if (mode === 'docs') return 'Kho tri thức JavaGuide (354 bài)';
    return 'PRO192 — Lộ trình 30 Slots & 150 Bài tập';
  }, [mode, activeStage, parsed, currentDocInfo, loadedLang]);

  // Bookmark & Note keys
  const itemKey =
    mode === 'pro192' && slug
      ? `pro192:${slug}`
      : mode === 'docs' && docRel
        ? `docs:${docRel}`
        : '';
  const isBookmarked = itemKey ? progress.bookmarks.includes(itemKey) : false;
  const currentNote = itemKey ? progress.notes[itemKey] || '' : '';

  // Record last visited
  useEffect(() => {
    if (mode === 'pro192' && activeStage && slug) {
      recordVisit({
        path: `/pro192/${slug}`,
        title: activeStage.title,
        kind: 'pro192',
        updatedAt: new Date().toISOString(),
      });
    } else if (mode === 'docs' && docRel && !loading && !error && parsed) {
      recordVisit({
        path: `/docs/${docRel}`,
        title: displayTitle,
        kind: 'docs',
        updatedAt: new Date().toISOString(),
      });
    }
  }, [mode, activeStage, slug, docRel, loading, error, parsed, displayTitle, recordVisit]);

  // Extract rendered DOM headings + scroll to ?slot=, ?exercise=, or #hash
  useEffect(() => {
    if (loading || !parsed || !articleRef.current) {
      setDomHeadings([]);
      return;
    }

    const container = articleRef.current;
    const headingEls = Array.from(container.querySelectorAll('h1[id], h2[id], h3[id]'));
    setDomHeadings(
      headingEls
        .filter((el) => !el.closest('section[id^="exercise-"]'))
        .map((el) => ({
          id: el.id,
          text: el.textContent?.trim() || '',
          level: (el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3) as 1 | 2 | 3,
        }))
        .filter((h) => h.text.length > 0)
    );

    const targetExercise = searchParams.get('exercise');
    const targetSlot = searchParams.get('slot');

    const timer = window.setTimeout(() => {
      if (targetExercise) {
        const exEl = document.getElementById(`exercise-${targetExercise}`);
        if (exEl) {
          exEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (targetSlot) {
        const slotNum = targetSlot.trim();
        const slotRegex = new RegExp(`\\bslot\\s+${slotNum}\\s*:`, 'i');
        const matchEl = headingEls.find((el) => {
          const txt = el.textContent || '';
          return slotRegex.test(txt) && !/bài\s+tập/i.test(txt);
        });
        if (matchEl) {
          matchEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (location.hash) {
        const targetId = decodeURIComponent(location.hash.slice(1));
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);

    return () => window.clearTimeout(timer);
  }, [loading, parsed, searchParams, location.hash]);

  // Determine related PE challenge for "▶ Thử code bài này" button
  const relatedPeId = useMemo(() => {
    if (!activeStage || !pro192?.peChallenges) return 1;
    const match = pro192.peChallenges.find((pe) =>
      pe.relatedSlots.some((s) => activeStage.slots.includes(s))
    );
    return match?.id ?? 1;
  }, [activeStage, pro192]);

  // Resources data
  const slideDecks = useMemo(() => {
    if (!pro192) return [];
    const q = normalizeSearchText(resourceQuery);
    return pro192.assets.slides
      .map((pptxUrl) => {
        const fileName = decodeURIComponent(pptxUrl.split('/').pop() || '');
        const baseName = fileName.replace(/\.pptx$/i, '');
        const pdfUrl = `/media/pro192/resources/${encodeURIComponent(`${baseName}.pdf`)}`;
        const matchingStages = pro192.stages
          .filter((st) => st.slides.includes(fileName))
          .map((st) => ({ id: st.id, slug: stageFileToSlug(st.file) }));
        const matchingSlots = pro192.slots
          .filter((sl) => decodeURIComponent(sl.slidePptx).endsWith(`/${fileName}`))
          .map((sl) => sl.slot);
        return { name: baseName, pdfUrl, pptxUrl, stages: matchingStages, slots: matchingSlots };
      })
      .filter((d) =>
        !q ? true : normalizeSearchText(`${d.name} slot ${d.slots.join(' ')}`).includes(q)
      );
  }, [pro192, resourceQuery]);

  const bankingArchive = pro192?.assets.resources.find((r) => r.endsWith('.rar'));

  const breadcrumbText = useMemo(() => {
    if (mode === 'pro192') {
      return activeStage
        ? `PRO192 > Giai đoạn ${activeStage.id} > Slot ${activeStage.slots[0]}–${activeStage.slots[activeStage.slots.length - 1]}`
        : 'PRO192 > Tổng quan 30 Slots';
    }
    if (mode === 'docs') {
      return currentDocInfo
        ? `JavaGuide > ${currentDocInfo.domainLabel} > ${currentDocInfo.groupLabel}`
        : 'JavaGuide > Tất cả 354 bài';
    }
    return 'PRO192 > Kho Slide PDF & PPTX';
  }, [mode, activeStage, currentDocInfo]);

  const stageSlots =
    pro192 && activeStage ? pro192.slots.filter((s) => s.stage === activeStage.id) : [];
  const prevStage =
    pro192 && activeStage ? pro192.stages.find((s) => s.id === activeStage.id - 1) ?? null : null;
  const nextStage =
    pro192 && activeStage ? pro192.stages.find((s) => s.id === activeStage.id + 1) ?? null : null;

  const solvedInStage = stageExercises.filter((ex) =>
    progress.solvedExercises.includes(ex.id)
  ).length;

  const normTreeFilter = normalizeSearchText(treeFilter);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Reader Top Toolbar (matches view-m34) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[var(--text-muted)]">
            <Link
              to="/dashboard"
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            >
              ← Dashboard
            </Link>
            <span className="truncate">{breadcrumbText}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Switch between PRO192 / JavaGuide / Slides */}
            <div className="inline-flex rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] p-0.5">
              <Link
                to="/pro192"
                className={[
                  'rounded px-2 py-0.5 font-medium transition-colors',
                  mode === 'pro192'
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                PRO192
              </Link>
              <Link
                to="/docs"
                className={[
                  'rounded px-2 py-0.5 font-medium transition-colors',
                  mode === 'docs'
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                JavaGuide
              </Link>
              <Link
                to="/resources"
                className={[
                  'rounded px-2 py-0.5 font-medium transition-colors',
                  mode === 'resources'
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                Slides
              </Link>
            </div>

            {itemKey && (
              <button
                type="button"
                onClick={() => toggleBookmark(itemKey)}
                aria-pressed={isBookmarked}
                className={[
                  'rounded-md border px-2.5 py-1 transition-colors',
                  isBookmarked
                    ? 'border-[var(--accent)] bg-[var(--bg-canvas)] text-[var(--accent-text)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent)]',
                ].join(' ')}
              >
                {isBookmarked ? '★ Đã lưu' : '☆ Lưu bài'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setFocusMode((f) => !f)}
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
            >
              {focusMode ? '✕ Thoát Focus' : '⛶ Focus Mode'}
            </button>
          </div>
        </div>

        {/* Split Sidebar + Reader Content */}
        <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-12">
          {/* M3 Left Sidebar (hidden in Focus Mode) */}
          {!focusMode && (
            <aside className="space-y-3 border-b border-[var(--border-default)] bg-[var(--bg-canvas)]/50 p-4 text-xs md:col-span-3 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold uppercase text-[var(--text-muted)]">
                  Lộ trình học
                </span>
                <button
                  type="button"
                  onClick={() => setSavedFilterOnly((s) => !s)}
                  aria-pressed={savedFilterOnly}
                  className={[
                    'rounded-md border px-2 py-0.5 transition-colors',
                    savedFilterOnly
                      ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--accent-text)]',
                  ].join(' ')}
                >
                  ☆ Đã lưu
                </button>
              </div>

              {mode === 'docs' ? (
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-dim)]" />
                    <input
                      type="search"
                      value={treeFilter}
                      onChange={(e) => setTreeFilter(e.target.value)}
                      placeholder="Lọc 354 bài..."
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div className="max-h-[600px] space-y-1 overflow-y-auto pr-1">
                    {navigation?.domains.map((domain) => {
                      const matchingGroups = domain.groups
                        .map((grp) => {
                          const filteredArticles = grp.articles.filter((art) => {
                            const key = `docs:${art.rel}`;
                            if (savedFilterOnly && !progress.bookmarks.includes(key)) return false;
                            if (!normTreeFilter) return true;
                            return normalizeSearchText(
                              `${art.titleVi} ${art.titleEn} ${art.rel}`
                            ).includes(normTreeFilter);
                          });
                          return { grp, filteredArticles };
                        })
                        .filter((g) => g.filteredArticles.length > 0);

                      if ((normTreeFilter || savedFilterOnly) && matchingGroups.length === 0) {
                        return null;
                      }
                      const domOpen =
                        Boolean(normTreeFilter || savedFilterOnly) ||
                        Boolean(expandedDomains[domain.id]);

                      return (
                        <div key={domain.id} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDomains((prev) => ({
                                ...prev,
                                [domain.id]: !prev[domain.id],
                              }))
                            }
                            className="flex w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-left font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              {domOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span className="truncate">
                                {lang === 'vi' ? domain.labelVi : domain.labelEn}
                              </span>
                            </span>
                            <span className="tabular-nums text-[var(--text-dim)]">
                              {domain.totalArticles}
                            </span>
                          </button>

                          {domOpen && (
                            <div className="ml-2.5 space-y-1 border-l border-[var(--border-default)] pl-2">
                              {matchingGroups.map(({ grp, filteredArticles }) => {
                                const gk = `${domain.id}/${grp.id}`;
                                const grpOpen =
                                  Boolean(normTreeFilter || savedFilterOnly) ||
                                  Boolean(expandedGroups[gk]);
                                return (
                                  <div key={gk} className="space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedGroups((prev) => ({
                                          ...prev,
                                          [gk]: !prev[gk],
                                        }))
                                      }
                                      className="flex w-full items-center justify-between gap-1 rounded px-1.5 py-1 text-left text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                      <span className="truncate">
                                        {lang === 'vi' ? grp.labelVi : grp.labelEn}
                                      </span>
                                      <span className="tabular-nums">{filteredArticles.length}</span>
                                    </button>

                                    {grpOpen && (
                                      <ul className="space-y-1">
                                        {filteredArticles.map((art) => {
                                          const active = docRel === art.rel;
                                          const saved = progress.bookmarks.includes(
                                            `docs:${art.rel}`
                                          );
                                          const title =
                                            lang === 'vi'
                                              ? art.titleVi || art.titleEn
                                              : art.titleEn || art.titleVi;
                                          return (
                                            <li key={art.rel}>
                                              <Link
                                                to={`/docs/${art.rel}`}
                                                className={[
                                                  'flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 transition-colors',
                                                  active
                                                    ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                                                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                                                ].join(' ')}
                                              >
                                                <span className="line-clamp-2">{title}</span>
                                                {saved && <span className="shrink-0">★</span>}
                                              </Link>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="max-h-[640px] space-y-1.5 overflow-y-auto pr-1">
                  {pro192?.stages.map((stage) => {
                    const stSlug = stageFileToSlug(stage.file);
                    const saved = progress.bookmarks.includes(`pro192:${stSlug}`);
                    if (savedFilterOnly && !saved) return null;

                    const active = slug === stSlug;
                    const isExpanded = Boolean(expandedStages[stage.id]);
                    const slots = pro192.slots.filter((s) => s.stage === stage.id);

                    return (
                      <div key={stage.id} className="space-y-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStages((prev) => ({
                                ...prev,
                                [stage.id]: !prev[stage.id],
                              }))
                            }
                            aria-label={`Mở rộng Giai đoạn ${stage.id}`}
                            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <Link
                            to={`/pro192/${stSlug}`}
                            className={[
                              'flex flex-1 items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors',
                              active
                                ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                            ].join(' ')}
                          >
                            <span className="truncate">
                              GĐ {stage.id} (Slot {stage.slots[0]}–
                              {stage.slots[stage.slots.length - 1]})
                            </span>
                            {saved && <span>★</span>}
                          </Link>
                        </div>

                        {isExpanded && (
                          <ul className="ml-5 space-y-1 border-l border-[var(--border-default)] pl-2">
                            {slots.map((sl) => {
                              const done = progress.completedSlots.includes(sl.slot);
                              return (
                                <li key={sl.slot}>
                                  <Link
                                    to={`/pro192/${stSlug}?slot=${sl.slot}`}
                                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                                  >
                                    <span className="truncate">
                                      <strong className="text-[var(--text-primary)]">
                                        S{sl.slot}:
                                      </strong>{' '}
                                      {sl.title}
                                    </span>
                                    {done && (
                                      <CheckCircle2 className="h-3 w-3 shrink-0 text-[var(--success)]" />
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}

                  <div className="space-y-1 border-t border-[var(--border-default)] pt-2">
                    <Link
                      to="/pro192"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-2 text-[var(--text-secondary)] hover:border-[var(--accent)]"
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <span>Ma trận 30 Slots</span>
                    </Link>
                    <Link
                      to="/resources"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-2 text-[var(--text-secondary)] hover:border-[var(--accent)]"
                    >
                      <FolderArchive className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <span>Kho Slide PDF &amp; PPTX</span>
                    </Link>
                  </div>
                </div>
              )}
            </aside>
          )}

          {/* M4 Main Content Pane */}
          <div className={focusMode ? 'p-6 md:col-span-12 md:p-8' : 'p-5 md:col-span-9 md:p-8'}>
            {/* 1. Resources Vault View (/resources) */}
            {mode === 'resources' && (
              <div className="mx-auto max-w-4xl space-y-6">
                <header className="space-y-1.5 border-b border-[var(--border-default)] pb-4">
                  <span className="inline-block rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-text)]">
                    Tài nguyên Offline · PRO192
                  </span>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    Kho Slide PDF, PowerPoint &amp; Source Code
                  </h1>
                  <p className="text-xs text-[var(--text-muted)]">
                    Toàn bộ {pro192?.course.totalSlides ?? 14} slide PDF (xem trực tiếp), 14 tệp .pptx gốc và dự án mẫu MVC lưu nội bộ 100%.
                  </p>
                </header>

                {bankingArchive && (
                  <div className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--accent-soft)] p-2.5 text-[var(--accent)]">
                        <Archive className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                          banking.rar — Dự án mẫu kiến trúc MVC Java OOP
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          Source code mẫu đi kèm giáo trình PRO192 để tham khảo tách lớp.
                        </div>
                      </div>
                    </div>
                    <a
                      href={bankingArchive}
                      download
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Tải banking.rar</span>
                    </a>
                  </div>
                )}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-dim)]" />
                  <input
                    type="search"
                    value={resourceQuery}
                    onChange={(e) => setResourceQuery(e.target.value)}
                    placeholder="Tìm theo tên slide hoặc số Slot (VD: Collections, Inheritance)..."
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
                        <tr>
                          <th className="px-4 py-3 font-semibold uppercase text-[var(--text-muted)]">
                            Bộ Slide bài giảng
                          </th>
                          <th className="px-4 py-3 font-semibold uppercase text-[var(--text-muted)]">
                            Giai đoạn &amp; Slots
                          </th>
                          <th className="px-4 py-3 text-right font-semibold uppercase text-[var(--text-muted)]">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-default)]">
                        {slideDecks.map((deck) => (
                          <tr key={deck.name} className="hover:bg-[var(--bg-surface)]/50">
                            <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                              <div className="flex items-center gap-2">
                                <Presentation className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                                <span>{deck.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {deck.stages.map((st) => (
                                  <Link
                                    key={st.id}
                                    to={`/pro192/${st.slug}`}
                                    className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 text-[var(--text-secondary)] hover:border-[var(--accent)]"
                                  >
                                    GĐ {st.id}
                                  </Link>
                                ))}
                                {deck.slots.length > 0 && (
                                  <span className="tabular-nums text-[var(--text-dim)]">
                                    Slot {deck.slots.join(', ')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPdfPreview({
                                      title: deck.name,
                                      pdfUrl: deck.pdfUrl,
                                      pptxUrl: deck.pptxUrl,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                                >
                                  <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                                  <span>Xem PDF</span>
                                </button>
                                <a
                                  href={deck.pptxUrl}
                                  download
                                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>PPTX</span>
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PRO192 Overview 30-Slot Matrix (/pro192 without slug) */}
            {mode === 'pro192' && !slug && (
              <div className="mx-auto max-w-4xl space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-default)] pb-4">
                  <div className="space-y-1.5">
                    <span className="inline-block rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-text)]">
                      PRO192 · 30 Slots · 150 Bài tập
                    </span>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                      Giáo trình PRO192 &amp; Cầu nối Study Bridge
                    </h1>
                    <p className="text-xs text-[var(--text-muted)]">
                      Chọn bất kỳ Slot nào để đọc lý thuyết chuẩn, mở Slide PDF, làm bài tập ẩn đáp án hoặc nhảy thẳng sang bài chuyên sâu JavaGuide.
                    </p>
                  </div>
                  <Link
                    to="/pro192/giai-doan-1-slot-01-05"
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                  >
                    Bắt đầu GĐ 1 →
                  </Link>
                </header>

                <div className="space-y-5">
                  {pro192?.stages.map((stage) => {
                    const stSlug = stageFileToSlug(stage.file);
                    const slots = pro192.slots.filter((s) => s.stage === stage.id);
                    return (
                      <section
                        key={stage.id}
                        className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                          <div>
                            <div className="font-mono text-[11px] font-semibold text-[var(--accent-text)]">
                              Giai đoạn {stage.id} · Slot {stage.slots[0]}–
                              {stage.slots[stage.slots.length - 1]}
                            </div>
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">
                              {stage.title.replace(/^Giai đoạn \d+:\s*/, '')}
                            </h2>
                          </div>
                          <Link
                            to={`/pro192/${stSlug}`}
                            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                          >
                            Mở bài giảng →
                          </Link>
                        </div>

                        <div className="divide-y divide-[var(--border-default)]">
                          {slots.map((sl) => {
                            const done = progress.completedSlots.includes(sl.slot);
                            return (
                              <div
                                key={sl.slot}
                                className="flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center"
                              >
                                <div className="flex min-w-0 items-start gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleSlotCompleted(sl.slot)}
                                    aria-label={`Đánh dấu Slot ${sl.slot}`}
                                    aria-pressed={done}
                                    className="mt-0.5 shrink-0"
                                  >
                                    {done ? (
                                      <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-[var(--text-dim)]" />
                                    )}
                                  </button>
                                  <div className="min-w-0 space-y-1.5">
                                    <Link
                                      to={`/pro192/${stSlug}?slot=${sl.slot}`}
                                      className="block text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)]"
                                    >
                                      <span className="font-mono text-[var(--accent-text)]">
                                        Slot {sl.slot}:
                                      </span>{' '}
                                      {sl.title}
                                    </Link>
                                    <div className="flex flex-wrap gap-1.5">
                                      {sl.studyBridge.map((rel) => (
                                        <Link
                                          key={rel}
                                          to={`/docs/${rel}`}
                                          className="inline-flex items-center gap-1 rounded border border-[var(--info)]/30 bg-[var(--info-soft)] px-2 py-0.5 text-[11px] text-[var(--info-text)] hover:opacity-90"
                                        >
                                          <BookOpen className="h-3 w-3" />
                                          <span className="max-w-[200px] truncate">
                                            {findArticleTitle(navigation, rel, lang)}
                                          </span>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1.5 pl-6 sm:pl-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPdfPreview({
                                        title: `Slot ${sl.slot} — Slide PDF`,
                                        pdfUrl: sl.slidePdf,
                                        pptxUrl: sl.slidePptx,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] text-[var(--text-primary)] hover:border-[var(--accent)]"
                                  >
                                    <FileText className="h-3 w-3 text-[var(--accent)]" />
                                    <span>PDF</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. JavaGuide Directory (/docs without rel) */}
            {mode === 'docs' && !docRel && (
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
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-dim)]" />
                      <input
                        type="search"
                        value={dirQuery}
                        onChange={(e) => setDirQuery(e.target.value)}
                        placeholder="Tìm theo tên bài Việt/Anh hoặc đường dẫn..."
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none"
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
                  <div className="h-40 animate-pulse rounded-xl bg-[var(--bg-canvas)]" />
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
                              const done = progress.completedArticles.includes(art.rel);
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
                                    const done = progress.completedArticles.includes(art.rel);
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
                                            <div className="truncate text-[11px] text-[var(--text-dim)]">
                                              {secondary}
                                            </div>
                                          </Link>
                                        </div>

                                        <div className="hidden shrink-0 items-center gap-3 text-[11px] tabular-nums text-[var(--text-dim)] sm:flex">
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
            )}

            {/* 4. Reader View (PRO192 Stage OR JavaGuide Article) */}
            {isReaderView && (
              <div className="flex gap-8">
                <div className="mx-auto min-w-0 max-w-3xl flex-1 space-y-6">
                  {/* Top Badge + Title + Controls */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-block rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-text)]">
                        {mode === 'pro192' && activeStage
                          ? `Slot ${activeStage.slots[0]}–${activeStage.slots[activeStage.slots.length - 1]} · PRO192`
                          : `${currentDocInfo?.domainLabel || 'JavaGuide'} · ${loadedLang.toUpperCase()}`}
                      </span>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {mode === 'docs' && docRel && (
                          <>
                            <button
                              type="button"
                              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                            >
                              <Languages className="h-3.5 w-3.5 text-[var(--accent)]" />
                              <span>
                                {lang === 'vi' ? 'Đọc bản English' : 'Đọc bản Tiếng Việt'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleArticleCompleted(docRel)}
                              aria-pressed={progress.completedArticles.includes(docRel)}
                              className={[
                                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold transition-colors',
                                progress.completedArticles.includes(docRel)
                                  ? 'border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success-text)]'
                                  : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                              ].join(' ')}
                            >
                              {progress.completedArticles.includes(docRel)
                                ? '✔ Đã đọc xong'
                                : 'Đánh dấu đã đọc'}
                            </button>
                          </>
                        )}

                        {mode === 'pro192' && activeStage && (
                          <button
                            type="button"
                            onClick={() => navigate(`/studio/${relatedPeId}`)}
                            className="rounded-md bg-[var(--accent)] px-3 py-1 font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                          >
                            ▶ Thử code bài này
                          </button>
                        )}
                      </div>
                    </div>

                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{displayTitle}</h1>
                    {parsed?.meta.description && (
                      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                        {parsed.meta.description}
                      </p>
                    )}

                    {fallbackNotice && (
                      <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--accent-text)]">
                        Bài viết này chưa có bản {lang.toUpperCase()}, đang hiển thị bản {loadedLang.toUpperCase()}.
                      </div>
                    )}
                  </div>

                  {/* PRO192 Quick Slot Jump & Exercise Controls */}
                  {mode === 'pro192' && activeStage && (
                    <div className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-muted)]">
                          Nhảy nhanh Slot &amp; đánh dấu hoàn thành:
                        </span>
                        {stageExercises.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums text-[var(--text-muted)]">
                              Bài tập:{' '}
                              <strong className="text-[var(--text-primary)]">
                                {solvedInStage}
                              </strong>
                              /{stageExercises.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => setForceRevealAll(true)}
                              className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Mở đáp án</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setForceRevealAll(false)}
                              className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              <EyeOff className="h-3 w-3" />
                              <span>Ẩn đáp án</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {stageSlots.map((sl) => {
                          const done = progress.completedSlots.includes(sl.slot);
                          return (
                            <div
                              key={sl.slot}
                              className="inline-flex items-center overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]"
                            >
                              <button
                                type="button"
                                onClick={() => toggleSlotCompleted(sl.slot)}
                                aria-label={`Đánh dấu Slot ${sl.slot}`}
                                aria-pressed={done}
                                className="border-r border-[var(--border-default)] px-2 py-1 hover:bg-[var(--bg-canvas)]"
                              >
                                {done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                                )}
                              </button>
                              <Link
                                to={`/pro192/${slug}?slot=${sl.slot}`}
                                className="px-2.5 py-1 font-mono font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)]"
                              >
                                Slot {sl.slot}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sky-Blue Study Bridge Card + Slides (matches view-m34) */}
                  {mode === 'pro192' && activeStage && (
                    <div className="space-y-2.5 rounded-xl border border-[var(--info)]/35 bg-[var(--info-soft)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--info-text)]">
                          🌉 Study Bridge — Đào sâu bản chất (JavaGuide) &amp; Slide
                        </span>
                        <button
                          type="button"
                          onClick={() => setBridgeExpanded((e) => !e)}
                          className="rounded-lg border border-[var(--info)]/40 bg-[var(--bg-canvas)] px-3 py-1 text-xs font-medium text-[var(--info-text)]"
                        >
                          {bridgeExpanded ? 'Thu gọn ↑' : 'Đọc phần chuyên sâu ↓'}
                        </button>
                      </div>

                      {bridgeExpanded && (
                        <div className="space-y-2.5 border-t border-[var(--info)]/25 pt-2.5 text-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {activeStage.studyBridge.map((rel) => (
                              <Link
                                key={rel}
                                to={`/docs/${rel}`}
                                className="inline-flex items-center gap-1 rounded-md border border-[var(--info)]/30 bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-secondary)] hover:border-[var(--info)] hover:text-[var(--info-text)]"
                              >
                                <BookOpen className="h-3 w-3 text-[var(--info)]" />
                                <span>{findArticleTitle(navigation, rel, lang)}</span>
                              </Link>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {activeStage.slides.map((slideName) => {
                              const pdfName = slideName.replace(/\.pptx$/i, '.pdf');
                              return (
                                <button
                                  key={slideName}
                                  type="button"
                                  onClick={() =>
                                    openPdfPreview({
                                      title: slideName.replace(/\.pptx$/i, ''),
                                      pdfUrl: `/media/pro192/resources/${encodeURIComponent(pdfName)}`,
                                      pptxUrl: `/media/pro192/slides/${encodeURIComponent(slideName)}`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-primary)] hover:border-[var(--accent)]"
                                >
                                  <FileText className="h-3 w-3 text-[var(--accent)]" />
                                  <span>Slide: {slideName.replace(/\.pptx$/i, '')}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Markdown Body */}
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--bg-canvas)]" />
                      <div className="h-4 w-full animate-pulse rounded bg-[var(--bg-canvas)]" />
                      <div className="h-40 animate-pulse rounded-xl bg-[var(--bg-canvas)]" />
                    </div>
                  ) : error ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-xs text-[var(--danger-text)]"
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReloadTick((t) => t + 1)}
                        className="mt-3 inline-flex items-center gap-1 rounded-md border border-current px-3 py-1 font-semibold"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Tải lại</span>
                      </button>
                    </div>
                  ) : (
                    <div ref={articleRef}>
                      {mode === 'pro192' ? (
                        proSegments.map((seg, idx) =>
                          seg.type === 'markdown' ? (
                            <MarkdownRenderer
                              key={`md-${idx}`}
                              content={seg.content}
                              currentRel={`pro192/${slug}.md`}
                            />
                          ) : (
                            <ExerciseBlock
                              key={`ex-${seg.exercise.id}`}
                              exercise={seg.exercise}
                              currentRel={`pro192/${slug}.md`}
                              forceReveal={forceRevealAll}
                            />
                          )
                        )
                      ) : (
                        <MarkdownRenderer content={parsed?.body || ''} currentRel={docRel} />
                      )}
                    </div>
                  )}

                  {/* Quick Check CTA (PE inside + FE outside, matches view-m34) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4 text-xs">
                    <span className="text-[var(--text-muted)]">
                      Vừa học xong lý thuyết? Chọn cách kiểm tra ngay:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/studio/${relatedPeId}`}
                        className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                      >
                        Làm bài code PE →
                      </Link>
                      <a
                        href="https://anan-mocha.vercel.app/quizzes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-1.5 text-[var(--text-secondary)] hover:border-[var(--accent)]"
                      >
                        Ôn Quiz FE (AnanQuiz) ↗
                      </a>
                    </div>
                  </div>

                  {/* Personal Local Notes (matches view-m34) */}
                  {itemKey && (
                    <div className="space-y-2 text-xs">
                      <label
                        htmlFor="lesson-personal-note"
                        className="block font-semibold text-[var(--text-primary)]"
                      >
                        🗒 Ghi chú cá nhân cho bài này (Lưu trên máy):
                      </label>
                      <textarea
                        id="lesson-personal-note"
                        rows={2}
                        value={currentNote}
                        onChange={(e) => saveNote(itemKey, e.target.value)}
                        placeholder="Ghi lại ý bạn tự hiểu hoặc chỗ hay quên..."
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Prev / Next navigation */}
                  <footer className="grid gap-3 border-t border-[var(--border-default)] pt-4 sm:grid-cols-2">
                    {mode === 'pro192' ? (
                      <>
                        {prevStage ? (
                          <Link
                            to={`/pro192/${stageFileToSlug(prevStage.file)}`}
                            className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-xs hover:border-[var(--accent)]"
                          >
                            <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                            <span className="truncate font-semibold">{prevStage.title}</span>
                          </Link>
                        ) : (
                          <div />
                        )}
                        {nextStage ? (
                          <Link
                            to={`/pro192/${stageFileToSlug(nextStage.file)}`}
                            className="flex items-center justify-end gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-right text-xs hover:border-[var(--accent)]"
                          >
                            <span className="truncate font-semibold">{nextStage.title}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                          </Link>
                        ) : (
                          <Link
                            to="/pe"
                            className="flex items-center justify-end gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3.5 text-right text-xs font-bold text-[var(--accent-text)]"
                          >
                            <span>Vào Kho Đề Thực hành PE →</span>
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        {prevDocInfo ? (
                          <Link
                            to={`/docs/${prevDocInfo.rel}`}
                            className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-xs hover:border-[var(--accent)]"
                          >
                            <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                            <span className="truncate font-semibold">
                              {lang === 'vi'
                                ? prevDocInfo.article.titleVi || prevDocInfo.article.titleEn
                                : prevDocInfo.article.titleEn || prevDocInfo.article.titleVi}
                            </span>
                          </Link>
                        ) : (
                          <div />
                        )}
                        {nextDocInfo ? (
                          <Link
                            to={`/docs/${nextDocInfo.rel}`}
                            className="flex items-center justify-end gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-right text-xs hover:border-[var(--accent)]"
                          >
                            <span className="truncate font-semibold">
                              {lang === 'vi'
                                ? nextDocInfo.article.titleVi || nextDocInfo.article.titleEn
                                : nextDocInfo.article.titleEn || nextDocInfo.article.titleVi}
                            </span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                          </Link>
                        ) : (
                          <div />
                        )}
                      </>
                    )}
                  </footer>
                </div>

                {!focusMode && <TableOfContents headings={domHeadings} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
