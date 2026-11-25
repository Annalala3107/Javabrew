import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { SlidingPillTabs } from '../components/lucian/SlidingPillTabs';
import { useApp } from '../context/AppContext';
import { useRevealSection } from '../hooks/useMotion';
import { stageFileToSlug } from '../utils/text';

type PeFilter = 'all' | 'oop' | 'collections' | 'file';

const PE_TAB_OPTIONS = [
  { id: 'challenges' as const, label: 'Kho Đề PE' },
  { id: 'mistakes' as const, label: 'Lỗi AI nhắc' },
];

const PE_FILTER_OPTIONS = [
  { id: 'all' as const, label: 'Tất cả' },
  { id: 'oop' as const, label: 'OOP & Encapsulation' },
  { id: 'collections' as const, label: 'Collections & Sort' },
  { id: 'file' as const, label: 'File I/O & String' },
];

export function PeHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pro192, progress, toggleMistakeResolved, pushToast } = useApp();
  const listScopeRef = useRef<HTMLDivElement>(null);

  const initialTab = searchParams.get('tab') === 'mistakes' ? 'mistakes' : 'challenges';
  const [activeTab, setActiveTab] = useState<'challenges' | 'mistakes'>(initialTab);
  const [filter, setFilter] = useState<PeFilter>('all');

  const challenges = useMemo(() => pro192?.peChallenges ?? [], [pro192]);

  const initialPe = Number(searchParams.get('challenge')) || 1;
  const [selectedId, setSelectedId] = useState<number>(initialPe);

  const filtered = useMemo(() => {
    return challenges.filter((c) => {
      if (filter === 'all') return true;
      if (filter === 'file') {
        return c.cat === 'file' || /file|csv|string|chuỗi/i.test(`${c.title} ${c.meta}`);
      }
      return c.cat === filter;
    });
  }, [challenges, filter]);

  useRevealSection(listScopeRef, {
    selector: '[data-reveal]',
    y: 12,
    duration: 0.35,
    stagger: 0.04,
    dependencies: [activeTab, filter],
  });

  const selected = useMemo(
    () => filtered.find((c) => c.id === selectedId) || filtered[0] || challenges[0] || null,
    [filtered, selectedId, challenges]
  );

  const passedCount = challenges.filter((c) => progress.peStatus[c.id] === 'pass').length;

  const getStatusMeta = (id: number) => {
    const st = progress.peStatus[id];
    if (st === 'pass') {
      return {
        label: '✔ Đã Pass',
        cls: 'border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success-text)]',
      };
    }
    if (st === 'in-progress' || id === 1) {
      return {
        label: 'Đang luyện',
        cls: 'border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent-text)]',
      };
    }
    return {
      label: 'Chưa làm',
      cls: 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-dim)]',
    };
  };

  const relatedSlotObj = useMemo(() => {
    if (!selected || !pro192 || selected.relatedSlots.length === 0) return null;
    return pro192.slots.find((s) => s.slot === selected.relatedSlots[0]) || null;
  }, [selected, pro192]);

  const switchTab = (tab: 'challenges' | 'mistakes') => {
    setActiveTab(tab);
    setSearchParams(tab === 'mistakes' ? { tab: 'mistakes' } : {});
  };

  const tabOptionsWithCounts = useMemo(
    () => [
      { id: 'challenges' as const, label: `${PE_TAB_OPTIONS[0].label} (${challenges.length})` },
      { id: 'mistakes' as const, label: `${PE_TAB_OPTIONS[1].label} (${progress.mistakes.length})` },
    ],
    [challenges.length, progress.mistakes.length]
  );

  return (
    <div ref={listScopeRef} className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      {/* Header & Sliding Pill Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Kho Đề Thực hành PE (PRO192)
          </h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Luyện đề theo cấu trúc thi thật của trường — bấm vào đề để code trực tiếp cùng AI Mentor.
          </p>
        </div>

        <SlidingPillTabs
          options={tabOptionsWithCounts}
          value={activeTab}
          onChange={switchTab}
          ariaLabel="Chuyển mục Kho Đề PE hoặc Lỗi AI nhắc"
        />
      </div>

      {activeTab === 'challenges' ? (
        <div className="space-y-4">
          {/* Topic Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <SlidingPillTabs
              options={PE_FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
              ariaLabel="Lọc đề PE theo chủ đề"
              tone="neutral"
            />

            <span className="font-mono text-[var(--text-muted)] tabular-nums">
              Tiến độ:{' '}
              <strong className="text-[var(--success)]">
                {passedCount}/{challenges.length} Đề mẫu Pass
              </strong>
            </span>
          </div>

          {/* 12-Col Master-Detail Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left List */}
            <div className="space-y-3 text-xs lg:col-span-7">
              {filtered.map((p) => {
                const active = selected?.id === p.id;
                const badge = getStatusMeta(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-reveal
                    onClick={() => setSelectedId(p.id)}
                    className={[
                      'flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors',
                      active
                        ? 'border-[var(--accent)] bg-[var(--bg-surface)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-surface)]/60 hover:border-[var(--border-strong)]',
                    ].join(' ')}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-[var(--text-primary)]">
                        {p.code}: {p.title}
                      </div>
                      <div className="text-[var(--text-muted)]">{p.meta}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2.5 py-0.5 text-xs ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Detail Preview */}
            {selected && (
              <div className="flex flex-col justify-between space-y-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 lg:col-span-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-md bg-[var(--border-default)] px-2 py-0.5 font-mono text-[var(--accent-text)]">
                      {selected.code}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs ${getStatusMeta(selected.id).cls}`}
                    >
                      {getStatusMeta(selected.id).label}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {selected.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                    {selected.desc}
                  </p>

                  <div className="space-y-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-xs">
                    <div className="font-semibold text-[var(--text-primary)]">
                      Checklist tiêu chí chấm PE:
                    </div>
                    <ul className="space-y-1 text-[var(--text-muted)]">
                      {selected.checklist.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[var(--border-default)] pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => navigate(`/studio/${selected.id}`)}
                    className="min-h-[42px] w-full rounded-lg bg-[var(--accent)] py-2.5 font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
                  >
                    Bắt đầu Code trên Studio (M7) →
                  </button>

                  {relatedSlotObj ? (
                    <Link
                      to={`/pro192/${stageFileToSlug(relatedSlotObj.file)}?slot=${relatedSlotObj.slot}`}
                      className="block w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2.5 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)]"
                    >
                      Xem lại lý thuyết Slot {relatedSlotObj.slot} trước
                    </Link>
                  ) : (
                    <Link
                      to="/pro192"
                      className="block w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2.5 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)]"
                    >
                      Xem lại lý thuyết PRO192 trước
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Lỗi AI nhắc */
        <div className="space-y-3 text-xs">
          {progress.mistakes.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-muted)]">
              Chưa có lỗi nào được ghi nhận. Hãy chạy thử đề PE trên Code Studio!
            </div>
          ) : (
            progress.mistakes.map((m) => (
              <div
                key={m.id}
                data-reveal
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        'rounded border px-2 py-0.5 text-xs',
                        m.type === 'runtime'
                          ? 'border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger-text)]'
                          : 'border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--accent-text)]',
                      ].join(' ')}
                    >
                      {m.type === 'runtime' ? 'Runtime Error' : 'Clean Code'}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">{m.title}</span>
                    {m.resolved && (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--success-soft)] px-2 py-0.5 text-xs text-[var(--success-text)]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã khắc phục
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-muted)]">{m.detail}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toggleMistakeResolved(m.id);
                      pushToast({
                        title: m.resolved ? 'Đã mở lại ghi chú lỗi' : 'Đã đánh dấu khắc phục lỗi',
                        description: m.title,
                        tone: m.resolved ? 'info' : 'success',
                      });
                    }}
                    className="min-h-[38px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {m.resolved ? 'Mở lại' : 'Đánh dấu đã sửa'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/studio/${m.peId}`)}
                    className="min-h-[38px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 py-2 text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
                  >
                    Mở lại PE {String(m.peId).padStart(2, '0')} →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
