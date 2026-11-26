import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Circle, Clock, FileText } from 'lucide-react';
import type { PdfPreviewState } from '../../context/AppContext';
import type { Lang, NavigationData, Pro192Data } from '../../types/content';
import { findArticleTitle, stageEntrySlug, stageFileToSlug } from '../../utils/text';

interface Pro192OverviewViewProps {
  pro192: Pro192Data | null;
  navigation: NavigationData | null;
  lang: Lang;
  completedSlots: number[];
  toggleSlotCompleted: (slot: number) => void;
  openPdfPreview: (preview: PdfPreviewState) => void;
}

export function Pro192OverviewView({
  pro192,
  navigation,
  lang,
  completedSlots,
  toggleSlotCompleted,
  openPdfPreview,
}: Pro192OverviewViewProps) {
  return (
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
            Chọn bất kỳ Slot nào để đọc lý thuyết chuẩn, mở Slide PDF, làm bài tập ẩn đáp án hoặc
            nhảy thẳng sang bài chuyên sâu JavaGuide.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/pro192/pe-patterns"
            className="rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--info-text)] hover:opacity-90"
          >
            📘 Bí kíp &amp; 7 Khuôn mẫu PE →
          </Link>
          <Link
            to="/pro192/slots/slot-01"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
          >
            Bắt đầu Slot 01 →
          </Link>
        </div>
      </header>

      <div className="space-y-5">
        {pro192?.stages.map((stage) => {
          const stSlug = stageEntrySlug(stage);
          const slots = pro192.slots.filter((s) => s.stage === stage.id);
          return (
            <section
              key={stage.id}
              className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                <div>
                  <div className="font-mono text-xs font-semibold text-[var(--accent-text)]">
                    Giai đoạn {stage.id} · Slot {stage.slots[0]}–{stage.slots[stage.slots.length - 1]}
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
                  const done = completedSlots.includes(sl.slot);
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
                            to={`/pro192/${stageFileToSlug(sl.file)}`}
                            className="block text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)]"
                          >
                            <span className="font-mono text-[var(--accent-text)]">
                              Slot {sl.slot}:
                            </span>{' '}
                            {sl.title}
                          </Link>
                          {(sl.examFocus?.length || sl.estimatedMinutes) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                              {sl.examFocus?.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-1.5 py-0.5 font-medium text-[var(--accent-text)]"
                                >
                                  {tag}
                                </span>
                              ))}
                              {sl.estimatedMinutes && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />~{sl.estimatedMinutes} phút
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {sl.studyBridge.map((rel) => (
                              <Link
                                key={rel}
                                to={`/docs/${rel}`}
                                className="inline-flex items-center gap-1 rounded border border-[var(--info)]/30 bg-[var(--info-soft)] px-2 py-0.5 text-xs text-[var(--info-text)] hover:opacity-90"
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
                          className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)] hover:border-[var(--accent)]"
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
  );
}
