import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, HelpCircle, Search, Terminal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SkeletonCard } from './lucian/SkeletonCard';
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
            badge: `PRO192`,
            to: `/pro192/${stageFileToSlug(s.file)}`,
            score,
          });
        }
      }
    }

    if (includePe) {
      for (const pe of searchIndex.peChallenges) {
        const hay = normalizeSearchText(`${pe.title} ${pe.meta}`);
        if (!q || hay.includes(q)) {
          const numId = Number(pe.id) || 1;
          items.push({
            key: `pe-${pe.id}`,
            kind: 'pe',
            title: pe.title,
            subtitle: pe.meta,
            badge: `PE ${String(numId).padStart(2, '0')}`,
            to: `/studio/${numId}`,
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
            badge: 'JavaGuide',
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSearchOpen(false);
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] p-3.5">
          <Search className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài học PRO192, JavaGuide hoặc Đề PE (VD: HashMap, da hinh, Student)..."
            aria-label="Nhập từ khóa tìm kiếm"
            className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
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

        <div className="max-h-80 overflow-y-auto p-3">
          {loading ? (
            <SkeletonCard variant="list" />
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--text-dim)]">
              Không tìm thấy kết quả cho “{query}”. Thử tìm “HashMap” hoặc “Student”.
            </div>
          ) : (
            <ul role="listbox" className="space-y-2 text-xs">
              {results.map((item, idx) => {
                const selected = idx === activeIndex;
                const Icon =
                  item.kind === 'docs'
                    ? BookOpen
                    : item.kind === 'slots'
                      ? GraduationCap
                      : item.kind === 'pe'
                        ? Terminal
                        : HelpCircle;

                return (
                  <li key={item.key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelect(item)}
                      className={[
                        'flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                        selected
                          ? 'border-[var(--accent)] bg-[var(--bg-canvas)]'
                          : 'border-[var(--border-default)] bg-[var(--bg-canvas)] hover:border-[var(--accent)]',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
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
                    </button>
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
