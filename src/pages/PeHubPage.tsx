import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { stageFileToSlug } from '../utils/text';

type PeFilter = 'all' | 'oop' | 'collections' | 'file';

export function PeHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pro192, progress, toggleMistakeResolved } = useApp();

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

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      {/* Header & Sub-tabs (matches view-m5) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Kho Đề Thực hành PE (PRO192)
          </h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Luyện đề theo cấu trúc thi thật của trường — bấm vào đề để code trực tiếp cùng AI Mentor.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 text-xs">
          <button
            type="button"
            onClick={() => switchTab('challenges')}
            className={[
              'rounded-lg px-3.5 py-1.5 transition-colors',
              activeTab === 'challenges'
                ? 'bg-[var(--accent)] font-semibold text-[var(--accent-contrast)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            Kho Đề PE ({challenges.length})
          </button>
          <button
            type="button"
            onClick={() => switchTab('mistakes')}
            className={[
              'rounded-lg px-3.5 py-1.5 transition-colors',
              activeTab === 'mistakes'
                ? 'bg-[var(--accent)] font-semibold text-[var(--accent-contrast)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            Lỗi AI nhắc ({progress.mistakes.length})
          </button>
        </div>
      </div>

      {activeTab === 'challenges' ? (
        <div className="space-y-4">
          {/* Topic Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'oop', label: 'OOP & Encapsulation' },
                  { id: 'collections', label: 'Collections & Sort' },
                  { id: 'file', label: 'File I/O & String' },
                ] as const
              ).map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={[
                      'rounded-lg px-3 py-1.5 transition-colors',
                      active
                        ? 'bg-[var(--text-primary)] font-semibold text-[var(--bg-canvas)]'
                        : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

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
                      className={`rounded-md border px-2 py-0.5 ${getStatusMeta(selected.id).cls}`}
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
                    className="w-full rounded-lg bg-[var(--accent)] py-2.5 font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
                  >
                    Bắt đầu Code trên Studio (M7) →
                  </button>

                  {relatedSlotObj ? (
                    <Link
                      to={`/pro192/${stageFileToSlug(relatedSlotObj.file)}?slot=${relatedSlotObj.slot}`}
                      className="block w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)]"
                    >
                      Xem lại lý thuyết Slot {relatedSlotObj.slot} trước
                    </Link>
                  ) : (
                    <Link
                      to="/pro192"
                      className="block w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)]"
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
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        'rounded border px-2 py-0.5',
                        m.type === 'runtime'
                          ? 'border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger-text)]'
                          : 'border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[#FDE68A]',
                      ].join(' ')}
                    >
                      {m.type === 'runtime' ? 'Runtime Error' : 'Clean Code'}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">{m.title}</span>
                    {m.resolved && (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--success-soft)] px-2 py-0.5 text-[11px] text-[var(--success-text)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã khắc phục
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-muted)]">{m.detail}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMistakeResolved(m.id)}
                    className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {m.resolved ? 'Mở lại' : 'Đánh dấu đã sửa'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/studio/${m.peId}`)}
                    className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 py-2 text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
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
