import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FolderArchive,
  GraduationCap,
  Search,
  Timer,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeSearchText, stageFileToSlug } from '../utils/text';

type SidebarMode = 'pro192' | 'docs';

export function Sidebar() {
  const location = useLocation();
  const {
    navigation,
    pro192,
    lang,
    progress,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useApp();

  const routeSuggestsDocs = location.pathname.startsWith('/docs');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(
    routeSuggestsDocs ? 'docs' : 'pro192'
  );
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({ 1: true });
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({ java: true });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'java/basis': true,
  });
  const [treeFilter, setTreeFilter] = useState('');

  // Keep sidebar mode aligned when navigating across top-level hubs
  useEffect(() => {
    if (location.pathname.startsWith('/docs')) {
      setSidebarMode('docs');
    } else if (
      location.pathname.startsWith('/pro192') ||
      location.pathname.startsWith('/pe') ||
      location.pathname.startsWith('/resources')
    ) {
      setSidebarMode('pro192');
    }
  }, [location.pathname]);

  // Auto-expand current PRO192 stage
  useEffect(() => {
    if (!pro192) return;
    if (location.pathname.startsWith('/pro192/')) {
      const slug = location.pathname.slice('/pro192/'.length);
      const match = pro192.stages.find((s) => stageFileToSlug(s.file) === slug);
      if (match) {
        setExpandedStages((prev) => ({ ...prev, [match.id]: true }));
      }
    }
  }, [location.pathname, pro192]);

  // Auto-expand active JavaGuide domain & group
  useEffect(() => {
    if (!navigation) return;
    if (location.pathname.startsWith('/docs/')) {
      const rel = location.pathname.slice('/docs/'.length);
      for (const dom of navigation.domains) {
        for (const grp of dom.groups) {
          if (grp.articles.some((a) => a.rel === rel)) {
            setExpandedDomains((prev) => ({ ...prev, [dom.id]: true }));
            setExpandedGroups((prev) => ({ ...prev, [`${dom.id}/${grp.id}`]: true }));
            return;
          }
        }
      }
    }
  }, [location.pathname, navigation]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname, location.search, setIsMobileSidebarOpen]);

  const normalizedFilter = useMemo(() => normalizeSearchText(treeFilter), [treeFilter]);

  const activeDocRel = location.pathname.startsWith('/docs/')
    ? location.pathname.slice('/docs/'.length)
    : '';

  const totalSlots = pro192?.course.totalSlots ?? 30;
  const totalExercises = pro192?.course.totalExercises ?? 150;
  const completedSlotsCount = progress.completedSlots.length;
  const solvedExercisesCount = progress.solvedExercises.length;

  const sidebarBody = (
    <div className="flex h-full flex-col bg-[var(--bg-sidebar)]">
      {/* Mode switch & mobile top nav */}
      <div className="border-b border-[var(--border-default)] p-3">
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {lang === 'vi' ? 'Điều hướng' : 'Navigation'}
          </span>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Đóng thanh bên"
            className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
          <button
            type="button"
            onClick={() => setSidebarMode('pro192')}
            className={[
              'inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
              sidebarMode === 'pro192'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>PRO192</span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarMode('docs')}
            className={[
              'inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
              sidebarMode === 'docs'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>JavaGuide</span>
          </button>
        </div>
      </div>

      {/* Scrollable tree */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {sidebarMode === 'pro192' ? (
          <div className="space-y-4">
            {/* Compact PRO192 progress strip */}
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
                <span>Tiến độ PRO192</span>
                <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                  {completedSlotsCount}/{totalSlots} Slots
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                  style={{ width: `${Math.round((completedSlotsCount / totalSlots) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)] tabular-nums">
                <span>Bài tập đã làm</span>
                <span>
                  {solvedExercisesCount}/{totalExercises}
                </span>
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-1">
              <NavLink
                to="/pro192"
                end
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>Tổng quan 30 Slots</span>
              </NavLink>
              <NavLink
                to="/pe"
                className={({ isActive }) =>
                  [
                    'flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Timer className="h-4 w-4 shrink-0" />
                  <span>Phòng luyện đề PE</span>
                </span>
                <span className="tabular-nums text-xs text-[var(--text-muted)]">
                  {progress.completedPe.length}/{pro192?.course.totalPeChallenges ?? 4}
                </span>
              </NavLink>
              <NavLink
                to="/resources"
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <FolderArchive className="h-4 w-4 shrink-0" />
                <span>Kho Slide PDF & PPTX</span>
              </NavLink>
            </div>

            {/* 8 Stages & 30 Slots */}
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                8 Giai đoạn giáo trình
              </div>
              {pro192?.stages.map((stage) => {
                const slug = stageFileToSlug(stage.file);
                const stagePath = `/pro192/${slug}`;
                const isStageActive = location.pathname === stagePath;
                const isExpanded = Boolean(expandedStages[stage.id]);
                const stageSlots = pro192.slots.filter((s) => s.stage === stage.id);

                return (
                  <div key={stage.id} className="space-y-0.5">
                    <div
                      className={[
                        'flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm transition-colors',
                        isStageActive
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)] font-medium',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStages((prev) => ({
                            ...prev,
                            [stage.id]: !prev[stage.id],
                          }))
                        }
                        aria-label={`Mở rộng Giai đoạn ${stage.id}`}
                        className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <Link to={stagePath} className="flex-1 truncate text-left leading-snug">
                        <span className="tabular-nums">GĐ {stage.id}</span> · Slot{' '}
                        {stage.slots[0]}–{stage.slots[stage.slots.length - 1]}
                      </Link>
                    </div>

                    {isExpanded && (
                      <ul className="ml-5 space-y-0.5 border-l border-[var(--border-default)] pl-2">
                        {stageSlots.map((slot) => {
                          const done = progress.completedSlots.includes(slot.slot);
                          return (
                            <li key={slot.slot}>
                              <Link
                                to={`${stagePath}?slot=${slot.slot}`}
                                className="flex items-start justify-between gap-2 rounded-md px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                              >
                                <span className="line-clamp-2 leading-relaxed">
                                  <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                                    S{slot.slot}:
                                  </span>{' '}
                                  {slot.title}
                                </span>
                                {done && (
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
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
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick filter for 354 articles */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="search"
                value={treeFilter}
                onChange={(e) => setTreeFilter(e.target.value)}
                placeholder={
                  lang === 'vi' ? 'Lọc nhanh 354 bài...' : 'Filter 354 articles...'
                }
                aria-label="Lọc danh mục JavaGuide"
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <Link
              to="/docs"
              className={[
                'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                location.pathname === '/docs'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <span>{lang === 'vi' ? 'Tất cả 10 cụm kiến thức' : 'All 10 Knowledge Domains'}</span>
              <span className="tabular-nums text-[var(--text-muted)]">
                {progress.completedArticles.length}/{navigation?.totalArticles ?? 354}
              </span>
            </Link>

            <div className="space-y-1">
              {navigation?.domains.map((domain) => {
                const domainTitle = lang === 'vi' ? domain.labelVi : domain.labelEn;
                const matchingGroups = domain.groups
                  .map((grp) => {
                    const filteredArticles = normalizedFilter
                      ? grp.articles.filter((art) => {
                          const hay = normalizeSearchText(
                            `${art.titleVi} ${art.titleEn} ${art.rel}`
                          );
                          return hay.includes(normalizedFilter);
                        })
                      : grp.articles;
                    return { grp, filteredArticles };
                  })
                  .filter((x) => x.filteredArticles.length > 0);

                if (normalizedFilter && matchingGroups.length === 0) return null;

                const isDomainOpen = normalizedFilter
                  ? true
                  : Boolean(expandedDomains[domain.id]);

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
                      aria-expanded={isDomainOpen}
                      className="flex w-full items-center justify-between gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)]"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isDomainOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                        )}
                        <span className="truncate">{domainTitle}</span>
                      </span>
                      <span className="tabular-nums text-[11px] font-normal text-[var(--text-muted)]">
                        {domain.totalArticles}
                      </span>
                    </button>

                    {isDomainOpen && (
                      <div className="ml-3 space-y-1 border-l border-[var(--border-default)] pl-2">
                        {matchingGroups.map(({ grp, filteredArticles }) => {
                          const grpKey = `${domain.id}/${grp.id}`;
                          const grpTitle = lang === 'vi' ? grp.labelVi : grp.labelEn;
                          const isGrpOpen = normalizedFilter
                            ? true
                            : Boolean(expandedGroups[grpKey]);

                          return (
                            <div key={grpKey} className="space-y-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedGroups((prev) => ({
                                    ...prev,
                                    [grpKey]: !prev[grpKey],
                                  }))
                                }
                                aria-expanded={isGrpOpen}
                                className="flex w-full items-center justify-between gap-1 rounded px-1.5 py-1 text-left text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                              >
                                <span className="flex items-center gap-1 truncate">
                                  {isGrpOpen ? (
                                    <ChevronDown className="h-3 w-3 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 shrink-0" />
                                  )}
                                  <span className="truncate">{grpTitle}</span>
                                </span>
                                <span className="tabular-nums text-[10px] text-[var(--text-muted)]">
                                  {filteredArticles.length}
                                </span>
                              </button>

                              {isGrpOpen && (
                                <ul className="ml-2 space-y-0.5">
                                  {filteredArticles.map((art) => {
                                    const active = activeDocRel === art.rel;
                                    const done = progress.completedArticles.includes(art.rel);
                                    const title =
                                      lang === 'vi'
                                        ? art.titleVi || art.titleEn
                                        : art.titleEn || art.titleVi;
                                    return (
                                      <li key={art.rel}>
                                        <Link
                                          to={`/docs/${art.rel}`}
                                          aria-current={active ? 'page' : undefined}
                                          className={[
                                            'flex items-start justify-between gap-1.5 rounded-md px-2 py-1 text-xs leading-snug transition-colors',
                                            active
                                              ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent-text)]'
                                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                                          ].join(' ')}
                                        >
                                          <span className="line-clamp-2">{title}</span>
                                          {done && (
                                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--success)]" />
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-[var(--border-default)] lg:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">{sidebarBody}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/45"
            aria-hidden="true"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 h-full w-80 max-w-[85vw] border-r border-[var(--border-default)] bg-[var(--bg-sidebar)] shadow-[var(--shadow-overlay)]">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}
