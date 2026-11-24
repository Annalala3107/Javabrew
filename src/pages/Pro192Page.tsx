import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Download,
  Eye,
  EyeOff,
  FileText,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { ExerciseBlock } from '../components/ExerciseBlock';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { TableOfContents } from '../components/TableOfContents';
import { useApp } from '../context/AppContext';
import type { TocHeading } from '../types/content';
import { parseMarkdownDocument, splitPro192StageContent } from '../utils/markdown';
import { findArticleTitle, stageFileToSlug } from '../utils/text';

export function Pro192Page() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const {
    pro192,
    navigation,
    lang,
    progress,
    toggleSlotCompleted,
    openPdfPreview,
    recordVisit,
  } = useApp();

  const [rawMd, setRawMd] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [forceRevealAll, setForceRevealAll] = useState<boolean | null>(null);
  const [domHeadings, setDomHeadings] = useState<TocHeading[]>([]);

  const articleBodyRef = useRef<HTMLDivElement>(null);

  const activeStage = useMemo(() => {
    if (!pro192 || !slug) return null;
    return pro192.stages.find((s) => stageFileToSlug(s.file) === slug) ?? null;
  }, [pro192, slug]);

  // Fetch stage Markdown when slug is provided
  useEffect(() => {
    if (!slug) {
      setRawMd('');
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setForceRevealAll(null);

    fetch(`/content/vi/pro192/${slug}.md`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Không tìm thấy giáo trình "${slug}.md" (HTTP ${res.status}).`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setRawMd(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Lỗi tải giáo trình PRO192.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, reloadTick]);

  const parsed = useMemo(() => {
    if (!rawMd) return null;
    return parseMarkdownDocument(rawMd);
  }, [rawMd]);

  const segments = useMemo(() => {
    if (!parsed) return [];
    return splitPro192StageContent(parsed.body);
  }, [parsed]);

  const stageExercises = useMemo(
    () => segments.filter((s) => s.type === 'exercise').map((s) => s.exercise),
    [segments]
  );

  // Record last visited stage
  useEffect(() => {
    if (activeStage && slug) {
      recordVisit({
        path: `/pro192/${slug}`,
        title: activeStage.title,
        kind: 'pro192',
        updatedAt: new Date().toISOString(),
      });
    }
  }, [activeStage, slug, recordVisit]);

  // Extract real DOM headings for 100% accurate TOC + scroll to ?slot= or ?exercise=
  useEffect(() => {
    if (loading || !parsed || !articleBodyRef.current) {
      setDomHeadings([]);
      return;
    }

    const container = articleBodyRef.current;
    const headingEls = Array.from(container.querySelectorAll('h1[id], h2[id], h3[id]'));
    const extracted: TocHeading[] = headingEls
      .filter((el) => !el.closest('section[id^="exercise-"]'))
      .map((el) => ({
        id: el.id,
        text: el.textContent?.trim() || '',
        level: (el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3) as 1 | 2 | 3,
      }))
      .filter((h) => h.text.length > 0);
    setDomHeadings(extracted);

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
        }
      }
    }, 60);

    return () => window.clearTimeout(timer);
  }, [loading, parsed, searchParams]);

  // Overview mode: /pro192 (no stage slug)
  if (!slug) {
    const totalSlots = pro192?.course.totalSlots ?? 30;
    const completedSlots = progress.completedSlots.length;
    const solvedExercises = progress.solvedExercises.length;
    const totalExercises = pro192?.course.totalExercises ?? 150;

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border-default)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              PRO192 — Lập trình Hướng đối tượng với Java
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              30 Slots chia thành 8 giai đoạn, 150 bài tập có phân tích lời giải, 14 slide bài giảng offline và Study Bridge nối thẳng sang JavaGuide.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/pro192/giai-doan-1-slot-01-05"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              <span>Bắt đầu Giai đoạn 1</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pe"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            >
              <Timer className="h-4 w-4 text-[var(--accent)]" />
              <span>Đề thi PE</span>
            </Link>
          </div>
        </header>

        {/* Progress overview */}
        <div className="grid gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
              <span>Tiến độ 30 Slots</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                {completedSlots}/{totalSlots}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${Math.round((completedSlots / totalSlots) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
              <span>Bài tập tự luyện đã làm</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                {solvedExercises}/{totalExercises}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--success)] transition-all"
                style={{ width: `${Math.round((solvedExercises / totalExercises) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 8 Stages & 30 Slots Matrix */}
        <div className="space-y-6">
          {pro192?.stages.map((stage) => {
            const stageSlug = stageFileToSlug(stage.file);
            const slots = pro192.slots.filter((s) => s.stage === stage.id);

            return (
              <section
                key={stage.id}
                className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-4 py-3">
                  <div>
                    <div className="font-mono text-xs font-semibold tabular-nums text-[var(--accent-text)]">
                      Giai đoạn {stage.id} · Slot {stage.slots[0]}–
                      {stage.slots[stage.slots.length - 1]}
                    </div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      {stage.title.replace(/^Giai đoạn \d+:\s*/, '')}
                    </h2>
                  </div>

                  <Link
                    to={`/pro192/${stageSlug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                  >
                    <span>Mở giáo trình</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-[var(--border-default)]">
                  {slots.map((slot) => {
                    const done = progress.completedSlots.includes(slot.slot);
                    return (
                      <div
                        key={slot.slot}
                        className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSlotCompleted(slot.slot)}
                            aria-label={`Đánh dấu hoàn thành Slot ${slot.slot}`}
                            aria-pressed={done}
                            className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--success)]"
                          >
                            {done ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-[var(--success)]" />
                            ) : (
                              <Circle className="h-4.5 w-4.5" />
                            )}
                          </button>

                          <div className="min-w-0 space-y-1.5">
                            <Link
                              to={`/pro192/${stageSlug}?slot=${slot.slot}`}
                              className="block text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)] hover:underline"
                            >
                              <span className="font-mono tabular-nums text-[var(--accent-text)]">
                                Slot {slot.slot}:
                              </span>{' '}
                              {slot.title}
                            </Link>

                            {slot.studyBridge.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                                  Study Bridge:
                                </span>
                                {slot.studyBridge.map((rel) => (
                                  <Link
                                    key={rel}
                                    to={`/docs/${rel}`}
                                    className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                                  >
                                    <BookOpen className="h-3 w-3 shrink-0" />
                                    <span className="max-w-[220px] truncate">
                                      {findArticleTitle(navigation, rel, lang)}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
                          <button
                            type="button"
                            onClick={() =>
                              openPdfPreview({
                                title: `Slot ${slot.slot} — Slide PDF`,
                                pdfUrl: slot.slidePdf,
                                pptxUrl: slot.slidePptx,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                          >
                            <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                            <span>Slide PDF</span>
                          </button>
                          <a
                            href={slot.slidePptx}
                            download
                            title="Tải slide PowerPoint (.pptx)"
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>PPTX</span>
                          </a>
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
    );
  }

  // Stage Reader view: /pro192/:slug
  const stageSlots =
    pro192 && activeStage ? pro192.slots.filter((s) => s.stage === activeStage.id) : [];
  const prevStage =
    pro192 && activeStage
      ? pro192.stages.find((s) => s.id === activeStage.id - 1) ?? null
      : null;
  const nextStage =
    pro192 && activeStage
      ? pro192.stages.find((s) => s.id === activeStage.id + 1) ?? null
      : null;

  const solvedInStage = stageExercises.filter((ex) =>
    progress.solvedExercises.includes(ex.id)
  ).length;

  return (
    <div className="mx-auto flex max-w-6xl gap-8">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link to="/pro192" className="hover:text-[var(--accent-text)] hover:underline">
            PRO192
          </Link>
          <span>/</span>
          <span className="font-medium text-[var(--text-secondary)]">
            {activeStage ? `Giai đoạn ${activeStage.id}` : slug}
          </span>
        </nav>

        {/* Stage Quick-Jump & Study Bridge Header */}
        {activeStage && (
          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <div className="space-y-1">
              <div className="font-mono text-xs font-semibold tabular-nums text-[var(--accent-text)]">
                Giai đoạn {activeStage.id} · Slot {activeStage.slots[0]}–
                {activeStage.slots[activeStage.slots.length - 1]}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                {activeStage.title.replace(/^Giai đoạn \d+:\s*/, '')}
              </h1>
            </div>

            {/* Slot quick jump & completion toggles */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[var(--text-muted)]">
                Nhảy nhanh đến Slot & đánh dấu hoàn thành:
              </div>
              <div className="flex flex-wrap gap-2">
                {stageSlots.map((slot) => {
                  const done = progress.completedSlots.includes(slot.slot);
                  return (
                    <div
                      key={slot.slot}
                      className="inline-flex items-center overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSlotCompleted(slot.slot)}
                        aria-label={`Đánh dấu Slot ${slot.slot}`}
                        aria-pressed={done}
                        className="border-r border-[var(--border-default)] px-2 py-1.5 hover:bg-[var(--bg-surface-muted)]"
                      >
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        )}
                      </button>
                      <Link
                        to={`/pro192/${slug}?slot=${slot.slot}`}
                        className="px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)] hover:text-[var(--accent-text)]"
                      >
                        <span className="font-mono tabular-nums font-semibold">
                          Slot {slot.slot}
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Slides & Study Bridge */}
            <div className="grid gap-3 border-t border-[var(--border-default)] pt-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[var(--text-muted)]">
                  Slide bài giảng ({activeStage.slides.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeStage.slides.map((slideName) => {
                    const pdfName = slideName.replace(/\.pptx$/i, '.pdf');
                    const pdfUrl = `/media/pro192/resources/${encodeURIComponent(pdfName)}`;
                    const pptxUrl = `/media/pro192/slides/${encodeURIComponent(slideName)}`;
                    return (
                      <button
                        key={slideName}
                        type="button"
                        onClick={() =>
                          openPdfPreview({
                            title: slideName.replace(/\.pptx$/i, ''),
                            pdfUrl,
                            pptxUrl,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                      >
                        <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                        <span>{slideName.replace(/\.pptx$/i, '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[var(--text-muted)]">
                  Study Bridge → JavaGuide ({activeStage.studyBridge.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeStage.studyBridge.map((rel) => (
                    <Link
                      key={rel}
                      to={`/docs/${rel}`}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                    >
                      <BookOpen className="h-3 w-3 shrink-0" />
                      <span className="max-w-[240px] truncate">
                        {findArticleTitle(navigation, rel, lang)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Exercise bulk controls */}
            {stageExercises.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3 text-xs">
                <span className="font-medium text-[var(--text-secondary)] tabular-nums">
                  Bài tập trong giai đoạn:{' '}
                  <strong className="text-[var(--text-primary)]">{solvedInStage}</strong>/
                  {stageExercises.length} đã hoàn thành
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForceRevealAll(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Mở tất cả lời giải</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForceRevealAll(false)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Ẩn tất cả lời giải</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stage Content Body */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[var(--bg-surface-muted)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--bg-surface-muted)]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--bg-surface-muted)]" />
            <div className="h-48 animate-pulse rounded-xl bg-[var(--bg-surface-muted)]" />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-[var(--border-default)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger)]"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>Không thể tải tài liệu</span>
            </div>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => setReloadTick((t) => t + 1)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        ) : (
          <div ref={articleBodyRef}>
            {segments.map((seg, idx) =>
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
            )}
          </div>
        )}

        {/* Prev / Next Stage navigation */}
        <footer className="grid gap-3 border-t border-[var(--border-default)] pt-6 sm:grid-cols-2">
          {prevStage ? (
            <Link
              to={`/pro192/${stageFileToSlug(prevStage.file)}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-left transition-colors hover:border-[var(--accent)]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-muted)]">Giai đoạn trước</div>
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {prevStage.title}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextStage ? (
            <Link
              to={`/pro192/${stageFileToSlug(nextStage.file)}`}
              className="flex items-center justify-end gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-right transition-colors hover:border-[var(--accent)]"
            >
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-muted)]">Giai đoạn tiếp theo</div>
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {nextStage.title}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </Link>
          ) : (
            <Link
              to="/pe"
              className="flex items-center justify-end gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-right transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-[var(--accent-text)]">
                  Hoàn tất 8 Giai đoạn
                </div>
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  Vào Phòng luyện đề Practical Exam (PE)
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            </Link>
          )}
        </footer>
      </div>

      <TableOfContents headings={domHeadings} />
    </div>
  );
}
