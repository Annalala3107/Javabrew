import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, Lock } from 'lucide-react';
import { SlidingPillTabs } from '../components/lucian/SlidingPillTabs';
import { useApp } from '../context/AppContext';
import { useRevealSection } from '../hooks/useMotion';
import { stageFileToSlug } from '../utils/text';

type PaperFilter = 'all' | 'PE1' | 'PE2' | 'PE3' | 'PE4' | 'PE5';
type QuestionFilter = 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

const PE_TAB_OPTIONS = [
  { id: 'challenges' as const, label: 'Kho Đề PE' },
  { id: 'mistakes' as const, label: 'Lỗi AI nhắc' },
];

const QUESTION_FILTER_OPTIONS = [
  { id: 'all' as const, label: 'Tất cả dạng' },
  { id: 'Q1' as const, label: 'Q1 · Encapsulation' },
  { id: 'Q2' as const, label: 'Q2 · Kế thừa' },
  { id: 'Q3' as const, label: 'Q3 · Collections' },
  { id: 'Q4' as const, label: 'Q4 · String / Interface' },
];

function inferPaper(code: string, explicit?: string): string {
  if (explicit) return explicit;
  const m = code.match(/^(PE\d+)/i);
  return m ? m[1].toUpperCase() : 'PE1';
}

function inferQuestionNo(code: string, explicit?: string, cat?: string): string {
  if (explicit) return explicit;
  const m = code.match(/-(Q\d+)/i);
  if (m) return m[1].toUpperCase();
  if (cat === 'collections') return 'Q3';
  if (cat === 'string' || cat === 'file') return 'Q4';
  return 'Q1';
}

export function PeHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pro192, progress, toggleMistakeResolved, pushToast } = useApp();
  const listScopeRef = useRef<HTMLDivElement>(null);

  const initialTab = searchParams.get('tab') === 'mistakes' ? 'mistakes' : 'challenges';
  const [activeTab, setActiveTab] = useState<'challenges' | 'mistakes'>(initialTab);
  const [paperFilter, setPaperFilter] = useState<PaperFilter>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionFilter>('all');

  const challenges = useMemo(() => pro192?.peChallenges ?? [], [pro192]);

  const initialPe = Number(searchParams.get('challenge')) || 1;
  const [selectedId, setSelectedId] = useState<number>(initialPe);

  const paperOptions = useMemo(() => {
    const counts: Record<string, number> = { PE1: 0, PE2: 0, PE3: 0, PE4: 0, PE5: 0 };
    for (const c of challenges) {
      const p = inferPaper(c.code, c.paper);
      if (p in counts) counts[p] += 1;
    }
    return [
      { id: 'all' as const, label: `Tất cả (${challenges.length})` },
      { id: 'PE1' as const, label: `PE1 (${counts.PE1})` },
      { id: 'PE2' as const, label: `PE2 (${counts.PE2})` },
      { id: 'PE3' as const, label: `PE3 (${counts.PE3})` },
      { id: 'PE4' as const, label: `PE4 (${counts.PE4})` },
      { id: 'PE5' as const, label: `PE5 (${counts.PE5})` },
    ];
  }, [challenges]);

  const filtered = useMemo(() => {
    return challenges.filter((c) => {
      const p = inferPaper(c.code, c.paper);
      const q = inferQuestionNo(c.code, c.questionNo, c.cat);
      if (paperFilter !== 'all' && p !== paperFilter) return false;
      if (typeFilter !== 'all' && q !== typeFilter) return false;
      return true;
    });
  }, [challenges, paperFilter, typeFilter]);

  useRevealSection(listScopeRef, {
    selector: '[data-reveal]',
    y: 12,
    duration: 0.35,
    stagger: 0.03,
    dependencies: [activeTab, paperFilter, typeFilter],
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
    if (st === 'in-progress') {
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
            Kho Đề Thực hành PE (PRO192 · PE1–PE5)
          </h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            19 câu đề thi thật chuẩn Java JDK 1.8 &amp; default package (PE2 có Q1–Q3) — chọn đề để code và chấm trên Code Studio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/pro192/pe-patterns"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--info-text)] transition-opacity hover:opacity-90"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>📘 Bí kíp &amp; 7 Khuôn mẫu PE (JDK 8)</span>
          </Link>
          <Link
            to="/studio/playground"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-text)] transition-opacity hover:opacity-90"
          >
            ☕ Java Playground (Tự do)
          </Link>
          <SlidingPillTabs
            options={tabOptionsWithCounts}
            value={activeTab}
            onChange={switchTab}
            ariaLabel="Chuyển mục Kho Đề PE hoặc Lỗi AI nhắc"
          />
        </div>
      </div>

      {activeTab === 'challenges' ? (
        <div className="space-y-4">
          {/* Paper & Question Type Filters */}
          <div className="space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SlidingPillTabs
                options={paperOptions}
                value={paperFilter}
                onChange={setPaperFilter}
                ariaLabel="Lọc theo bộ đề PE1 đến PE5"
                tone="neutral"
              />

              <span className="font-mono text-[var(--text-muted)] tabular-nums">
                Tiến độ:{' '}
                <strong className="text-[var(--success)]">
                  {passedCount}/{challenges.length} Câu Đề Pass
                </strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <SlidingPillTabs
                options={QUESTION_FILTER_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
                ariaLabel="Lọc theo dạng câu Q1 đến Q4"
                tone="neutral"
              />
              <span className="text-[var(--text-dim)] tabular-nums">
                Đang hiển thị {filtered.length}/{challenges.length} câu
              </span>
            </div>
          </div>

          {/* 12-Col Master-Detail Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left List */}
            <div className="max-h-[680px] space-y-2.5 overflow-y-auto pr-1 text-xs lg:col-span-7">
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
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)]">
                          {p.code}: {p.title}
                        </span>
                        {p.marks && (
                          <span className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--accent-text)]">
                            {p.marks}đ
                          </span>
                        )}
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
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-[var(--border-default)] px-2 py-0.5 font-mono text-[var(--accent-text)]">
                        {selected.code}
                      </span>
                      {selected.marks && (
                        <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[var(--accent-text)]">
                          {selected.marks} điểm
                        </span>
                      )}
                    </div>
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

                  {selected.interfaceFileName && (
                    <div className="flex items-start gap-2 rounded-lg border border-[var(--info)]/35 bg-[var(--info-soft)] p-3 text-xs text-[var(--info-text)]">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        <strong>{selected.interfaceFileName}</strong> đã biên dịch sẵn dạng bytecode — trên PEA/EOS <strong>không tạo lại file Interface</strong> này khi nộp bài.
                      </span>
                    </div>
                  )}

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

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {relatedSlotObj ? (
                      <Link
                        to={`/pro192/${stageFileToSlug(relatedSlotObj.file)}`}
                        className="block rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)]"
                      >
                        Lý thuyết Slot {relatedSlotObj.slot}
                      </Link>
                    ) : (
                      <Link
                        to="/pro192"
                        className="block rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-center text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)]"
                      >
                        Giáo trình PRO192
                      </Link>
                    )}

                    <Link
                      to="/pro192/pe-patterns"
                      className="block rounded-lg border border-[var(--info)]/35 bg-[var(--info-soft)] px-3 py-2 text-center font-medium text-[var(--info-text)] transition-opacity hover:opacity-90"
                    >
                      📘 Khuôn mẫu JDK 8 →
                    </Link>
                  </div>
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
