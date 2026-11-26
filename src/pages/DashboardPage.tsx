import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Code2,
  FolderArchive,
  Sparkles,
} from 'lucide-react';
import { LucianAccordion } from '../components/lucian/LucianAccordion';
import { LucianChecklistItem } from '../components/lucian/LucianChecklistItem';
import { useApp } from '../context/AppContext';
import { useRevealSection } from '../hooks/useMotion';
import { findArticleTitle, stageEntrySlug, stageFileToSlug } from '../utils/text';

function getTimeGreeting(hour = new Date().getHours()): string {
  if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function DashboardPage() {
  const { navigation, pro192, lang, progress, toggleSlotCompleted, pushToast } = useApp();
  const [expandedStageId, setExpandedStageId] = useState<number>(1);
  const dashRef = useRef<HTMLDivElement>(null);

  useRevealSection(dashRef, {
    selector: '[data-reveal]',
    y: 14,
    duration: 0.4,
    stagger: 0.05,
  });

  const totalSlots = pro192?.course.totalSlots ?? 30;
  const doneSlots = progress.completedSlots.length;
  const totalExercises = pro192?.course.totalExercises ?? 150;
  const doneExercises = progress.solvedExercises.length;
  const doneDrills = progress.completedDrills.length;
  const totalDrills = 60;
  const proPct = Math.round((doneSlots / totalSlots) * 100);

  const totalArticles = navigation?.totalArticles ?? 354;
  const doneArticles = progress.completedArticles.length;
  const jgPct = Math.round((doneArticles / totalArticles) * 100);

  const totalPe = pro192?.peChallenges?.length ?? pro192?.course.totalPeChallenges ?? 19;
  const passedPeCount = pro192?.peChallenges
    ? pro192.peChallenges.filter((p) => progress.peStatus[p.id] === 'pass').length
    : progress.completedPe.length;

  // Next uncompleted slot for Hero resume banner
  const nextSlot =
    pro192?.slots.find((s) => !progress.completedSlots.includes(s.slot)) || pro192?.slots[0];
  const resumePath =
    progress.lastVisited?.path ||
    (nextSlot ? `/pro192/${stageFileToSlug(nextSlot.file)}` : '/pro192');
  const resumeLabel = progress.lastVisited
    ? `Tiếp tục: ${progress.lastVisited.title}`
    : nextSlot
      ? `Học tiếp Slot ${String(nextSlot.slot).padStart(2, '0')} →`
      : 'Vào giáo trình PRO192 →';

  const greeting = getTimeGreeting();
  const javaDomain = navigation?.domains.find((d) => d.id === 'java');
  const groupCount = (id: string) =>
    javaDomain?.groups.find((g) => g.id === id)?.articles.length ?? 0;

  const basicsCount = javaDomain ? groupCount('basis') + groupCount('new-features') : 33;
  const collectionsCount = javaDomain ? groupCount('collection') : 12;
  const jvmCount = javaDomain ? groupCount('jvm') : 11;
  const concIoCount = javaDomain ? groupCount('concurrent') + groupCount('io') : 22;

  const bridgeCandidates = nextSlot?.studyBridge ?? [];
  const suggestedBridgeRel =
    bridgeCandidates.find((rel) => !progress.completedArticles.includes(rel)) ||
    bridgeCandidates[0] ||
    'java/collection/hashmap-source-code.md';
  const suggestedBridgeTitle = findArticleTitle(navigation, suggestedBridgeRel, lang);

  const featuredClusters = [
    {
      domainId: 'java',
      title: `Java Basics & OOP (${basicsCount})`,
      desc: 'String Pool, equals, Generics & Proxy',
      to: '/docs/java/basis/java-basic-questions-01.md',
    },
    {
      domainId: 'java',
      title: `Collections (${collectionsCount})`,
      desc: 'ArrayList, HashMap, HashSet & Comparator',
      to: '/docs/java/collection/hashmap-source-code.md',
    },
    {
      domainId: 'java',
      title: `JVM & GC (${jvmCount})`,
      desc: 'Stack/Heap, Metaspace, G1 & ZGC',
      to: '/docs/java/jvm/memory-area.md',
    },
    {
      domainId: 'java',
      title: `Concurrency & IO (${concIoCount})`,
      desc: 'Thread, AQS, File I/O & Serialization',
      to: '/docs/java/io/io-basis.md',
    },
  ];

  return (
    <div ref={dashRef} className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Hero Action Banner (matches view-m2) */}
      <section data-reveal className="flex flex-col justify-between gap-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 lg:flex-row lg:items-center">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 text-xs text-[var(--accent-text)]">
            <span>☕ Góc Cà Phê Code Đêm</span>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="text-[var(--text-muted)]">Học liệu nội bộ sẵn sàng</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {nextSlot
              ? `${greeting}, học tiếp từ Slot ${String(nextSlot.slot).padStart(2, '0')} nhé!`
              : `${greeting}, cùng pha cà phê và luyện Java OOP nhé!`}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            {nextSlot ? (
              <>
                Đang tới:{' '}
                <strong className="text-[var(--text-primary)]">{nextSlot.title}</strong> — nền tảng quan trọng để làm trọn bộ đề thực hành PE.
              </>
            ) : (
              'Trọn bộ 30 Slots PRO192, 354 bài JavaGuide EN/VI và Code Studio đã sẵn sàng.'
            )}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link
              to={resumePath}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              {resumeLabel}
            </Link>
            <Link
              to="/pe"
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
            >
              Vào Kho Đề PE
            </Link>
          </div>
        </div>

        {/* 3 Compact Stat Cards */}
        <div className="grid shrink-0 grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] px-4 py-3 text-center">
            <div className="text-xl font-bold tabular-nums text-[var(--accent)]">{proPct}%</div>
            <div className="mt-0.5 text-xs tabular-nums text-[var(--text-muted)]">
              PRO192 ({doneSlots}/{totalSlots})
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] px-4 py-3 text-center">
            <div className="text-xl font-bold tabular-nums text-[var(--info)]">{jgPct}%</div>
            <div className="mt-0.5 text-xs tabular-nums text-[var(--text-muted)]">
              JavaGuide ({doneArticles}/{totalArticles})
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] px-4 py-3 text-center">
            <div className="text-xl font-bold tabular-nums text-[var(--success)]">
              {passedPeCount} / {totalPe}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">Đề PE Pass</div>
          </div>
        </div>
      </section>

      {/* 2 Balanced Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: PRO192 Checklist (8 Stages / 30 Slots, no strikethrough!) */}
        <section data-reveal className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Lộ trình PRO192 (30 Slots)
              </h2>
              <p className="text-xs text-[var(--text-dim)]">
                Bấm ô tròn để cập nhật tiến độ (không gạch ngang để dễ ôn lại)
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="font-mono text-xs font-semibold tabular-nums text-[var(--accent)]">
                {doneSlots}/{totalSlots} ({proPct}%)
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[var(--text-secondary)]">
                Bài tập: {doneExercises}/{totalExercises}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[var(--info-text)]">
                Thực hành Live Lab: {doneDrills}/{totalDrills}
              </span>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-default)]">
            <div
              className="h-full w-full origin-left rounded-full bg-[var(--accent)] transition-transform duration-300"
              style={{ transform: `scaleX(${Math.max(0, Math.min(1, proPct / 100))})` }}
            />
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 text-xs">
            {pro192?.stages.map((stage) => {
              const slug = stageEntrySlug(stage);
              const stageSlots = pro192.slots.filter((s) => s.stage === stage.id);
              const doneInStage = stageSlots.filter((s) =>
                progress.completedSlots.includes(s.slot)
              ).length;
              const isOpen = expandedStageId === stage.id;
              const stageAllDone = doneInStage === stageSlots.length;

              return (
                <LucianAccordion
                  key={stage.id}
                  open={isOpen}
                  onToggle={() => setExpandedStageId(isOpen ? 0 : stage.id)}
                  title={
                    <span className="block truncate font-semibold text-[var(--text-primary)]">
                      Slot {stage.slots[0]}–{stage.slots[stage.slots.length - 1]}:{' '}
                      {stage.title.replace(/^Giai đoạn \d+:\s*/, '')}
                    </span>
                  }
                  trailing={
                    <>
                      <span
                        className={[
                          'rounded-md border px-2 py-0.5 text-xs tabular-nums',
                          stageAllDone
                            ? 'border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success-text)]'
                            : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]',
                        ].join(' ')}
                      >
                        {doneInStage}/{stageSlots.length}
                      </span>
                      <Link
                        to={`/pro192/${slug}`}
                        className="text-xs text-[var(--accent-text)] hover:underline"
                      >
                        Mở →
                      </Link>
                    </>
                  }
                >
                  <div className="space-y-1.5 border-t border-[var(--border-default)] bg-[var(--bg-surface)]/40 p-2.5">
                    {stageSlots.map((slot) => {
                      const done = progress.completedSlots.includes(slot.slot);
                      return (
                        <LucianChecklistItem
                          key={slot.slot}
                          checked={done}
                          strikethrough={false}
                          ariaLabel={`Đánh dấu Slot ${slot.slot}`}
                          onToggle={() => {
                            toggleSlotCompleted(slot.slot);
                            pushToast({
                              title: done
                                ? `Đã bỏ đánh dấu Slot ${String(slot.slot).padStart(2, '0')}`
                                : `Hoàn thành Slot ${String(slot.slot).padStart(2, '0')}`,
                              description: slot.title,
                              tone: done ? 'info' : 'success',
                            });
                          }}
                          label={
                            <Link
                              to={`/pro192/${stageFileToSlug(slot.file)}`}
                              className={[
                                'block truncate hover:text-[var(--accent-text)]',
                                done
                                  ? 'text-[var(--text-secondary)]'
                                  : 'font-medium text-[var(--text-primary)]',
                              ].join(' ')}
                            >
                              Slot {String(slot.slot).padStart(2, '0')}: {slot.title}
                            </Link>
                          }
                          trailing={
                            <span
                              className={[
                                'shrink-0 rounded-md px-2 py-0.5 text-xs',
                                done
                                  ? 'border border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success-text)]'
                                  : 'text-[var(--text-dim)]',
                              ].join(' ')}
                            >
                              {done ? 'Done' : 'Mở →'}
                            </span>
                          }
                        />
                      );
                    })}
                  </div>
                </LucianAccordion>
              );
            })}
          </div>
        </section>

        {/* Right Card: JavaGuide Core Track */}
        <section data-reveal className="flex flex-col justify-between space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  JavaGuide Chuyên sâu ({lang.toUpperCase()})
                </h2>
                <p className="text-xs text-[var(--text-dim)]">
                  Đào sâu bản chất JVM, Collections &amp; {totalArticles} bài phỏng vấn Java
                </p>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[var(--info)]">
                {doneArticles}/{totalArticles} ({jgPct}%)
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-default)]">
              <div
                className="h-full w-full origin-left rounded-full bg-[var(--info)] transition-transform duration-300"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, jgPct / 100))})` }}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1 text-xs sm:grid-cols-2">
              {featuredClusters.map((c) => (
                <Link
                  key={c.title}
                  to={c.to}
                  className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-left transition-colors hover:border-[var(--accent)]"
                >
                  <div className="font-semibold text-[var(--text-primary)]">{c.title}</div>
                  <div className="mt-1 text-[var(--text-muted)]">{c.desc}</div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {navigation?.domains
                .filter((dom) => dom.id !== 'java')
                .map((dom) => (
                  <Link
                    key={dom.id}
                    to={`/docs?domain=${dom.id}`}
                    className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                  >
                    {lang === 'vi' ? dom.labelVi : dom.labelEn} ({dom.totalArticles})
                  </Link>
                ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3 text-xs">
            <span className="min-w-0 truncate text-[var(--text-muted)]">
              🌉 Cầu nối gợi ý{nextSlot ? ` (Slot ${String(nextSlot.slot).padStart(2, '0')})` : ''}:{' '}
              <strong className="text-[var(--text-primary)]">{suggestedBridgeTitle}</strong>
            </span>
            <Link
              to={`/docs/${suggestedBridgeRel}`}
              className="shrink-0 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-1.5 text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
            >
              Đọc bài ngay →
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom Quick Actions (matches view-m2 + Slide Resources link) */}
      <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
        <Link
          to="/pe"
          className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-left transition-colors hover:border-[var(--accent)]"
        >
          <span className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
            <Code2 className="h-4 w-4" />
          </span>
          <div>
            <div className="font-semibold text-[var(--text-primary)]">
              Kho Đề PE &amp; Lỗi hay mắc
            </div>
            <div className="mt-0.5 text-[var(--text-muted)]">
              Luyện bộ đề OOP, Collections và ôn lại {progress.mistakes.length} lỗi AI nhắc
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-2">
          <Link
            to="/studio"
            className="flex flex-1 items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-left transition-colors hover:border-[var(--info)]"
          >
            <span className="rounded-lg bg-[var(--info-soft)] p-2 text-[var(--info)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                Mở JavaBrew Code Studio
              </div>
              <div className="mt-0.5 text-[var(--text-muted)]">
                Code trực tiếp, Diff Clean Code &amp; nhận góp ý từ AI Mentor
              </div>
            </div>
          </Link>
          <Link
            to="/studio/playground?example=demo-intro"
            className="inline-flex items-center justify-between rounded-lg border border-[var(--success)]/35 bg-[var(--success-soft)] px-3 py-1.5 text-[11px] font-medium text-[var(--success-text)] transition-opacity hover:opacity-90"
          >
            <span>☕ JavaBrew Live Lab — Chạy thử Java trực tiếp</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-2">
          <a
            href="https://anan-mocha.vercel.app/quizzes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5 text-left transition-colors hover:border-[var(--accent)]"
          >
            <span className="rounded-lg bg-[var(--border-default)] p-2 text-[var(--accent-text)]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                Luyện trắc nghiệm FE tại AnanQuiz ↗
              </div>
              <div className="mt-0.5 text-[var(--text-muted)]">
                Mở tab mới sang hệ thống thi thử FE đa môn
              </div>
            </div>
          </a>

          <Link
            to="/resources"
            className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2 text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <FolderArchive className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Kho 14 Slide PDF/PPTX &amp; banking.rar</span>
            </span>
            <span className="text-[var(--accent-text)]">Mở →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
