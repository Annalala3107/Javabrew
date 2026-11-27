import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Code2,
  FileText,
  GraduationCap,
  HelpCircle,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useApp, type PdfPreviewState } from '../context/AppContext';
import { useModalA11y } from '../hooks/useModalA11y';
import { SkeletonCard } from './lucian/SkeletonCard';
import { StreamingAiBubble } from './lucian/StreamingAiBubble';
import { streamRagSearch, type RagSearchSource } from '../services/aiMentorService';
import { retrieveRagSources } from '../utils/ragRetrieval';
import { normalizeSearchText, stageFileToSlug } from '../utils/text';

type FilterTab = 'all' | 'docs' | 'slots' | 'exercises' | 'pe' | 'lab' | 'slides';

interface SearchResultItem {
  key: string;
  kind: Exclude<FilterTab, 'all'>;
  title: string;
  subtitle: string;
  badge: string;
  to?: string;
  pdfPreview?: PdfPreviewState;
  score: number;
}

function matchesTokens(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.every((t) => haystack.includes(t));
}

export function SearchModal() {
  const navigate = useNavigate();
  const {
    isSearchOpen,
    setIsSearchOpen,
    loadSearchIndex,
    searchIndex,
    pro192,
    ensureMetadataLoaded,
    lang,
    openPdfPreview,
    byokKey,
    aiModel,
    aiServerStatus,
    refreshAiServerStatus,
    updateAiServerQuota,
    setIsSettingsOpen,
  } = useApp();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [ragState, setRagState] = useState<{
    query: string;
    loading: boolean;
    streaming: boolean;
    liveStreamed: boolean;
    reply: string;
    tone: 'ai' | 'offline' | 'error';
    badge?: string;
    sources: RagSearchSource[];
  } | null>(null);
  const ragAbortRef = useRef<AbortController | null>(null);

  const handleAskAiRag = useCallback(async () => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 6) return;

    ragAbortRef.current?.abort();
    const controller = new AbortController();
    ragAbortRef.current = controller;

    if (!pro192) {
      await ensureMetadataLoaded().catch(() => undefined);
    }
    const currentIndex = searchIndex || (await loadSearchIndex());
    const sources = retrieveRagSources(cleanQuery, currentIndex, pro192, lang, 5);

    setRagState({
      query: cleanQuery,
      loading: true,
      streaming: false,
      liveStreamed: false,
      reply: '',
      tone: 'ai',
      sources,
    });

    const statusSnapshot = aiServerStatus || (await refreshAiServerStatus());
    if (ragAbortRef.current !== controller) return;

    const targetModel = byokKey ? aiModel : statusSnapshot?.defaultModel || aiModel;
    let firstDeltaSeen = false;

    try {
      const res = await streamRagSearch({
        apiKey: byokKey || undefined,
        model: targetModel,
        ragContext: {
          query: cleanQuery,
          lang,
          sources,
        },
        signal: controller.signal,
        onMeta: (meta) => {
          if (ragAbortRef.current !== controller) return;
          if (!meta.cached && typeof meta.remaining === 'number') {
            updateAiServerQuota(meta.remaining, meta.limit);
          }
          const badge = meta.cached
            ? 'Cache · 0 lượt'
            : meta.source === 'server'
              ? `${meta.model}${typeof meta.remaining === 'number' ? ` · Còn ${meta.remaining}/${meta.limit} lượt` : ''}`
              : `BYOK · ${meta.model}`;
          setRagState((prev) => (prev ? { ...prev, badge } : prev));
        },
        onDelta: (chunk) => {
          if (ragAbortRef.current !== controller) return;
          firstDeltaSeen = true;
          setRagState((prev) =>
            prev
              ? {
                  ...prev,
                  loading: false,
                  streaming: true,
                  liveStreamed: true,
                  reply: prev.reply + chunk,
                }
              : prev
          );
        },
      });

      if (ragAbortRef.current !== controller) return;

      if (res.ok) {
        if (!res.cached && typeof res.remaining === 'number') {
          updateAiServerQuota(res.remaining, res.limit);
        }
        const finalBadge = res.cached
          ? 'Cache · 0 lượt'
          : res.source === 'server'
            ? `${res.model}${typeof res.remaining === 'number' ? ` · Còn ${res.remaining}/${res.limit} lượt` : ''}`
            : `BYOK · ${res.model}`;
        setRagState((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                streaming: false,
                liveStreamed: firstDeltaSeen,
                reply: res.reply,
                tone: 'ai',
                badge: finalBadge,
              }
            : prev
        );
      } else {
        setRagState((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                streaming: false,
                liveStreamed: false,
                reply: res.errorMessage,
                tone: res.quotaExceeded ? 'offline' : 'error',
                badge: res.quotaExceeded ? 'Hết lượt hôm nay' : 'AI lỗi',
              }
            : prev
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (ragAbortRef.current !== controller) return;
      setRagState((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              streaming: false,
              reply: 'Không kết nối được AI RAG lúc này. Hãy thử lại sau.',
              tone: 'error',
              badge: 'Lỗi kết nối',
            }
          : prev
      );
    }
  }, [
    aiModel,
    aiServerStatus,
    byokKey,
    ensureMetadataLoaded,
    lang,
    loadSearchIndex,
    pro192,
    query,
    refreshAiServerStatus,
    searchIndex,
    updateAiServerQuota,
  ]);

  useEffect(() => {
    if (!isSearchOpen) {
      ragAbortRef.current?.abort();
      ragAbortRef.current = null;
      setRagState(null);
      return;
    }

    const onShiftEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey && query.trim().length >= 6) {
        e.preventDefault();
        e.stopPropagation();
        void handleAskAiRag();
      }
    };
    window.addEventListener('keydown', onShiftEnter, true);
    return () => {
      window.removeEventListener('keydown', onShiftEnter, true);
    };
  }, [handleAskAiRag, isSearchOpen, query]);

  useEffect(() => {
    if (ragState && ragState.query !== query.trim()) {
      ragAbortRef.current?.abort();
      ragAbortRef.current = null;
      setRagState(null);
    }
  }, [query, ragState]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  useModalA11y({
    open: isSearchOpen,
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    onClose: () => setIsSearchOpen(false),
  });

  useEffect(() => {
    if (!isSearchOpen) return;
    setActiveIndex(0);
    if (!searchIndex) {
      setLoading(true);
      void loadSearchIndex().finally(() => setLoading(false));
    }
  }, [isSearchOpen, searchIndex, loadSearchIndex]);

  const results = useMemo<SearchResultItem[]>(() => {
    if (!searchIndex) return [];
    const q = normalizeSearchText(query);
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    const items: SearchResultItem[] = [];

    const includeDocs = tab === 'all' || tab === 'docs';
    const includeSlots = tab === 'all' || tab === 'slots';
    const includeExercises = tab === 'all' || tab === 'exercises';
    const includePe = tab === 'all' || tab === 'pe';
    const includeLab = tab === 'all' || tab === 'lab';
    const includeSlides = tab === 'all' || tab === 'slides';

    if (includeSlots) {
      for (const s of searchIndex.pro192Slots) {
        const hay = normalizeSearchText(`slot ${s.slot} giai doan ${s.stage} ${s.title}`);
        if (matchesTokens(hay, tokens)) {
          const titleNorm = normalizeSearchText(s.title);
          const score =
            tokens.length === 0
              ? 70
              : titleNorm.includes(q)
                ? 115
                : matchesTokens(titleNorm, tokens)
                  ? 98
                  : 82;
          items.push({
            key: `slot-${s.slot}`,
            kind: 'slots',
            title: `Slot ${s.slot}: ${s.title}`,
            subtitle: `PRO192 · Giai đoạn ${s.stage}`,
            badge: 'PRO192',
            to: `/pro192/${stageFileToSlug(s.file)}`,
            score,
          });
        }
      }
    }

    if (includePe) {
      for (const pe of searchIndex.peChallenges) {
        const hay = normalizeSearchText(`${pe.title} ${pe.meta}`);
        if (matchesTokens(hay, tokens)) {
          const numId = Number(pe.id) || 1;
          const peCodeMatch = pe.title.match(/(PE\d+-Q\d+)/i);
          items.push({
            key: `pe-${pe.id}`,
            kind: 'pe',
            title: pe.title,
            subtitle: pe.meta,
            badge: peCodeMatch
              ? peCodeMatch[1].toUpperCase()
              : `PE ${String(numId).padStart(2, '0')}`,
            to: `/studio/${numId}`,
            score: tokens.length === 0 ? 65 : hay.includes(q) ? 110 : 95,
          });
        }
      }
    }

    if (includeLab && Array.isArray(searchIndex.playgroundTemplates)) {
      for (const tpl of searchIndex.playgroundTemplates) {
        const hay = normalizeSearchText(
          `${tpl.title} ${tpl.subtitle} ${tpl.category} ${tpl.slotRef} ${tpl.id}`
        );
        if (matchesTokens(hay, tokens)) {
          const titleNorm = normalizeSearchText(tpl.title);
          const score =
            tokens.length === 0
              ? 55
              : titleNorm.includes(q)
                ? 105
                : matchesTokens(titleNorm, tokens)
                  ? 90
                  : 76;
          items.push({
            key: `lab-${tpl.id}`,
            kind: 'lab',
            title: tpl.title,
            subtitle: `${tpl.slotRef} · ${tpl.subtitle}`,
            badge: 'Live Lab',
            to: `/studio/playground?example=${encodeURIComponent(tpl.id)}`,
            score,
          });
        }
      }
    }

    if (includeSlides && Array.isArray(searchIndex.slides)) {
      for (const sl of searchIndex.slides) {
        const slotHints = sl.slots.map((n) => `slot ${n}`).join(' ');
        const hay = normalizeSearchText(`slide pdf pptx ${sl.title} ${slotHints}`);
        if (matchesTokens(hay, tokens)) {
          const titleNorm = normalizeSearchText(sl.title);
          items.push({
            key: `slide-${sl.pdfUrl}`,
            kind: 'slides',
            title: `Slide: ${sl.title}`,
            subtitle:
              sl.slots.length > 0
                ? `Dùng cho Slot ${sl.slots.join(', ')} (Mở PDF)`
                : 'Tài liệu Slide gốc PRO192 (Mở PDF)',
            badge: 'Slide PDF',
            pdfPreview: {
              title: sl.title,
              pdfUrl: sl.pdfUrl,
              pptxUrl: sl.pptxUrl,
            },
            score: tokens.length === 0 ? 52 : titleNorm.includes(q) ? 100 : 80,
          });
        }
      }
    }

    if (includeExercises) {
      const slotFileMap = new Map(
        searchIndex.pro192Slots.map((s) => [s.slot, stageFileToSlug(s.file)])
      );
      for (const ex of searchIndex.pro192Exercises) {
        const hay = normalizeSearchText(`bai tap ${ex.id} slot ${ex.slot} ${ex.title}`);
        if (matchesTokens(hay, tokens)) {
          const titleNorm = normalizeSearchText(ex.title);
          const score =
            tokens.length === 0
              ? 45
              : titleNorm.includes(q)
                ? 95
                : matchesTokens(titleNorm, tokens)
                  ? 84
                  : 68;
          const slotSlug =
            slotFileMap.get(ex.slot) ?? `slots/slot-${String(ex.slot).padStart(2, '0')}`;
          items.push({
            key: `ex-${ex.id}`,
            kind: 'exercises',
            title: `Bài ${ex.id}: ${ex.title}`,
            subtitle: `Bài tập PRO192 · Slot ${ex.slot} (Giai đoạn ${ex.stageId})`,
            badge: `Bài ${ex.id}`,
            to: `/pro192/${slotSlug}?exercise=${ex.id}`,
            score,
          });
        }
      }
    }

    if (includeDocs) {
      for (const art of searchIndex.articles) {
        const primaryTitle = lang === 'vi' ? art.titleVi : art.titleEn;
        const secondaryTitle = lang === 'vi' ? art.titleEn : art.titleVi;
        const primaryNorm = normalizeSearchText(primaryTitle);
        const secondaryNorm = normalizeSearchText(secondaryTitle);
        const headingsNorm = normalizeSearchText(
          [...art.headingsVi, ...art.headingsEn, ...art.tags].join(' ')
        );
        const descNorm = normalizeSearchText(`${art.descriptionVi} ${art.descriptionEn}`);
        const relNorm = normalizeSearchText(art.rel);
        const combinedHay = `${primaryNorm} ${secondaryNorm} ${headingsNorm} ${descNorm} ${relNorm}`;

        if (!matchesTokens(combinedHay, tokens)) continue;

        let score = 0;
        if (tokens.length === 0) {
          score = 50;
        } else if (primaryNorm === q || secondaryNorm === q) {
          score = 150;
        } else if (primaryNorm.startsWith(q) || secondaryNorm.startsWith(q)) {
          score = 130;
        } else if (primaryNorm.includes(q) || secondaryNorm.includes(q)) {
          score = 108;
        } else if (matchesTokens(primaryNorm, tokens) || matchesTokens(secondaryNorm, tokens)) {
          score = 96;
        } else if (headingsNorm.includes(q) || matchesTokens(headingsNorm, tokens)) {
          score = 80;
        } else {
          score = 64;
        }

        items.push({
          key: `doc-${art.rel}`,
          kind: 'docs',
          title: primaryTitle,
          subtitle: `${lang === 'vi' ? art.domainLabelVi : art.domainLabelEn} · ${secondaryTitle}`,
          badge: 'JavaGuide',
          to: `/docs/${art.rel}`,
          score,
        });
      }
    }

    items.sort((a, b) => b.score - a.score);
    return items.slice(0, 30);
  }, [searchIndex, query, tab, lang]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, tab]);

  useEffect(() => {
    if (!isSearchOpen || results.length === 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, isSearchOpen, results.length]);

  if (!isSearchOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    setIsSearchOpen(false);
    if (item.pdfPreview) {
      openPdfPreview(item.pdfPreview);
      return;
    }
    if (item.to) {
      navigate(item.to);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (results.length === 0 ? 0 : (prev + 1) % results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        results.length === 0 ? 0 : (prev - 1 + results.length) % results.length
      );
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  const labCount = searchIndex?.playgroundTemplates?.length ?? searchIndex?.totalPlaygroundTemplates ?? 45;
  const slideCount = searchIndex?.slides?.length ?? searchIndex?.totalSlides ?? 14;

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'docs', label: `JavaGuide (${searchIndex?.totalArticles ?? 354})` },
    { id: 'slots', label: `Slots (${searchIndex?.pro192Slots.length ?? 30})` },
    { id: 'lab', label: `Live Lab (${labCount})` },
    { id: 'slides', label: `Slide (${slideCount})` },
    { id: 'exercises', label: `Bài tập (${searchIndex?.totalExercises ?? 150})` },
    { id: 'pe', label: `Đề PE (${searchIndex?.totalPeChallenges ?? 19})` },
  ];

  const activeOptionId = results[activeIndex] ? `jb-search-opt-${activeIndex}` : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm toàn cục JavaBrew"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-16 sm:pt-20 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSearchOpen(false);
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] p-3.5">
          <Search className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="jb-search-listbox"
            aria-activedescendant={activeOptionId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="Tìm đa từ khóa: VD 'hashmap internal', 'slot 09', 'da hinh', 'Get Start'…"
            aria-label="Nhập từ khóa tìm kiếm"
            className="min-h-[36px] flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Đóng hộp tìm kiếm"
            className="min-h-[36px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-0.5 font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ESC
          </button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-[var(--border-default)] bg-[var(--bg-canvas)]/70 px-3 py-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  'min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain p-3">
          {query.trim().length >= 6 && (
            <div className="mb-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void handleAskAiRag()}
                  disabled={ragState?.loading || ragState?.streaming}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-wait disabled:opacity-70"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>✨ Hỏi AI từ kho học liệu JavaBrew</span>
                </button>
                <span className="text-[11px] text-[var(--text-dim)]">
                  Shift + Enter để hỏi nhanh · Tự động đính kèm trích dẫn nội bộ
                </span>
              </div>

              {ragState && (
                <div
                  className="mt-2.5 space-y-2"
                  onClick={(e) => {
                    const anchor = (e.target as HTMLElement | null)?.closest('a[href]');
                    if (anchor && !anchor.getAttribute('target')) {
                      setIsSearchOpen(false);
                    }
                  }}
                >
                  {ragState.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-[var(--text-dim)]">
                        Nguồn đối chiếu:
                      </span>
                      {ragState.sources.map((src) => (
                        <button
                          key={src.route}
                          type="button"
                          onClick={() => {
                            setIsSearchOpen(false);
                            navigate(src.route);
                          }}
                          className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-text)] transition hover:border-[var(--accent)]"
                        >
                          {src.badge} · {src.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <StreamingAiBubble
                    prompt={ragState.query}
                    reply={ragState.reply}
                    thinking={ragState.loading && !ragState.reply}
                    streaming={ragState.streaming}
                    liveStreamed={ragState.liveStreamed}
                    tone={ragState.tone}
                    badgeLabel={ragState.badge}
                    onAbortStream={() => {
                      ragAbortRef.current?.abort();
                      ragAbortRef.current = null;
                      setRagState((prev) =>
                        prev ? { ...prev, loading: false, streaming: false } : prev
                      );
                    }}
                    onOpenSettings={() => {
                      setIsSearchOpen(false);
                      setIsSettingsOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {loading ? (
            <SkeletonCard variant="list" />
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--text-dim)]">
              Không tìm thấy kết quả cho “{query}”. Thử tìm “HashMap internal” hoặc “Slot 09”.
            </div>
          ) : (
            <ul id="jb-search-listbox" role="listbox" aria-label="Kết quả tìm kiếm" className="space-y-2 text-xs">
              {results.map((item, idx) => {
                const selected = idx === activeIndex;
                const Icon =
                  item.kind === 'docs'
                    ? BookOpen
                    : item.kind === 'slots'
                      ? GraduationCap
                      : item.kind === 'pe'
                        ? Terminal
                        : item.kind === 'lab'
                          ? Code2
                          : item.kind === 'slides'
                            ? FileText
                            : HelpCircle;

                return (
                  <li
                    key={item.key}
                    id={`jb-search-opt-${idx}`}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(item)}
                    className={[
                      'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--bg-canvas)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-canvas)] hover:border-[var(--accent)]',
                    ].join(' ')}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[var(--text-primary)]">
                          {item.title}
                        </div>
                        <div className="truncate text-xs text-[var(--text-muted)]">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs text-[var(--accent-text)]">
                      {item.badge} →
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
