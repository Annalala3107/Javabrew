import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, HelpCircle, Search, Timer, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeSearchText, stageFileToSlug } from '../utils/text';

type FilterTab = 'all' | 'docs' | 'slots' | 'exercises' | 'pe';

interface SearchResultItem {
  key: string;
  kind: 'docs' | 'slots' | 'exercises' | 'pe';
  title: string;
  subtitle: string;
  badge: string;
  to: string;
  score: number;
}

export function SearchModal() {
  const navigate = useNavigate();
  const { isSearchOpen, setIsSearchOpen, loadSearchIndex, searchIndex, lang } = useApp();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSearchOpen) return;
    setActiveIndex(0);
    if (!searchIndex) {
      setLoading(true);
      void loadSearchIndex().finally(() => setLoading(false));
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [isSearchOpen, searchIndex, loadSearchIndex]);

  const results = useMemo<SearchResultItem[]>(() => {
    if (!searchIndex) return [];
    const q = normalizeSearchText(query);
    const items: SearchResultItem[] = [];

    const includeDocs = tab === 'all' || tab === 'docs';
    const includeSlots = tab === 'all' || tab === 'slots';
    const includeExercises = tab === 'all' || tab === 'exercises';
    const includePe = tab === 'all' || tab === 'pe';

    if (includeSlots) {
      for (const s of searchIndex.pro192Slots) {
        const hay = normalizeSearchText(`slot ${s.slot} giai doan ${s.stage} ${s.title}`);
        if (!q || hay.includes(q)) {
          const titleNorm = normalizeSearchText(s.title);
          const score = !q ? 70 : titleNorm.includes(q) ? 110 : 80;
          items.push({
            key: `slot-${s.slot}`,
            kind: 'slots',
            title: `Slot ${s.slot}: ${s.title}`,
            subtitle: `PRO192 · Giai đoạn ${s.stage}`,
            badge: `Slot ${s.slot}`,
            to: `/pro192/${stageFileToSlug(s.file)}?slot=${s.slot}`,
            score,
          });
        }
      }
    }

    if (includePe) {
      for (const pe of searchIndex.peChallenges) {
        const hay = normalizeSearchText(`${pe.title} ${pe.meta}`);
        if (!q || hay.includes(q)) {
          items.push({
            key: `pe-${pe.id}`,
            kind: 'pe',
            title: pe.title,
            subtitle: pe.meta,
            badge: `PE ${pe.id}`,
            to: `/pe?challenge=${pe.id}`,
            score: q ? 105 : 65,
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
        if (!q || hay.includes(q)) {
          const score = !q ? 45 : normalizeSearchText(ex.title).includes(q) ? 95 : 65;
          const stageSlug = slotFileMap.get(ex.slot) ?? `giai-doan-${ex.stageId}`;
          items.push({
            key: `ex-${ex.id}`,
            kind: 'exercises',
            title: `Bài ${ex.id}: ${ex.title}`,
            subtitle: `Bài tập PRO192 · Slot ${ex.slot} (Giai đoạn ${ex.stageId})`,
            badge: `Bài ${ex.id}`,
            to: `/pro192/${stageSlug}?exercise=${ex.id}`,
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

        let score = 0;
        if (!q) {
          score = 50;
        } else if (primaryNorm === q || secondaryNorm === q) {
          score = 150;
        } else if (primaryNorm.startsWith(q) || secondaryNorm.startsWith(q)) {
          score = 130;
        } else if (primaryNorm.includes(q) || secondaryNorm.includes(q)) {
          score = 100;
        } else if (headingsNorm.includes(q)) {
          score = 75;
        } else if (descNorm.includes(q) || normalizeSearchText(art.rel).includes(q)) {
          score = 60;
        }

        if (score > 0) {
          items.push({
            key: `doc-${art.rel}`,
            kind: 'docs',
            title: primaryTitle,
            subtitle: `${lang === 'vi' ? art.domainLabelVi : art.domainLabelEn} · ${secondaryTitle}`,
            badge: lang === 'vi' ? art.groupLabelVi : art.groupLabelEn,
            to: `/docs/${art.rel}`,
            score,
          });
        }
      }
    }

    items.sort((a, b) => b.score - a.score);
    return items.slice(0, 30);
  }, [searchIndex, query, tab, lang]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, tab]);

  if (!isSearchOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    setIsSearchOpen(false);
    navigate(item.to);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
    } else if (e.key === 'ArrowDown') {
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

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'docs', label: `JavaGuide (${searchIndex?.totalArticles ?? 354})` },
    { id: 'slots', label: `Slots (${searchIndex?.pro192Slots.length ?? 30})` },
    { id: 'exercises', label: `Bài tập (${searchIndex?.totalExercises ?? 150})` },
    { id: 'pe', label: `Đề PE (${searchIndex?.totalPeChallenges ?? 4})` },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm toàn cục JavaBrew"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[8vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSearchOpen(false);
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]">
        {/* Search input */}
        <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo từ khóa (hỗ trợ không dấu: da hinh, hashmap, jvm, try-catch)..."
            aria-label="Nhập từ khóa tìm kiếm"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Đóng hộp tìm kiếm"
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 border-b border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-3 py-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="max-h-[56vh] overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-3">
              <div className="h-10 animate-pulse rounded-lg bg-[var(--bg-surface-muted)]" />
              <div className="h-10 animate-pulse rounded-lg bg-[var(--bg-surface-muted)]" />
              <div className="h-10 animate-pulse rounded-lg bg-[var(--bg-surface-muted)]" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              Không tìm thấy kết quả phù hợp cho “{query}”. Hãy thử từ khóa ngắn hơn (ví dụ:{' '}
              <code className="rounded bg-[var(--bg-code)] px-1.5 py-0.5">HashMap</code>,{' '}
              <code className="rounded bg-[var(--bg-code)] px-1.5 py-0.5">JVM</code>,{' '}
              <code className="rounded bg-[var(--bg-code)] px-1.5 py-0.5">Slot 14</code>).
            </div>
          ) : (
            <ul role="listbox" className="space-y-1">
              {results.map((item, idx) => {
                const selected = idx === activeIndex;
                const Icon =
                  item.kind === 'docs'
                    ? BookOpen
                    : item.kind === 'slots'
                      ? GraduationCap
                      : item.kind === 'pe'
                        ? Timer
                        : HelpCircle;

                return (
                  <li key={item.key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelect(item)}
                      className={[
                        'flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        selected
                          ? 'bg-[var(--accent-soft)]'
                          : 'hover:bg-[var(--bg-surface-muted)]',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <Icon
                          className={[
                            'mt-0.5 h-4 w-4 shrink-0',
                            selected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                          ].join(' ')}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {item.title}
                          </div>
                          <div className="truncate text-xs text-[var(--text-secondary)]">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                        {item.badge}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
          <span>
            Dùng <kbd className="rounded border border-[var(--border-default)] px-1">↑</kbd>{' '}
            <kbd className="rounded border border-[var(--border-default)] px-1">↓</kbd> để chọn ·{' '}
            <kbd className="rounded border border-[var(--border-default)] px-1">Enter</kbd> để mở
          </span>
          <span className="tabular-nums">Hiển thị {results.length} kết quả hàng đầu</span>
        </div>
      </div>
    </div>
  );
}
