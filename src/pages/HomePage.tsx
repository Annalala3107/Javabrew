import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FolderArchive,
  GraduationCap,
  RotateCcw,
  Search,
  Timer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { stageFileToSlug } from '../utils/text';

export function HomePage() {
  const {
    navigation,
    pro192,
    lang,
    progress,
    resetProgress,
    setIsSearchOpen,
    metaLoading,
  } = useApp();

  const totalArticles = navigation?.totalArticles ?? 354;
  const totalSlots = pro192?.course.totalSlots ?? 30;
  const totalExercises = pro192?.course.totalExercises ?? 150;
  const totalPe = pro192?.course.totalPeChallenges ?? 4;

  const hasAnyProgress =
    progress.completedArticles.length > 0 ||
    progress.completedSlots.length > 0 ||
    progress.solvedExercises.length > 0 ||
    progress.completedPe.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Header action bar (Content-first Operate surface) */}
      <section className="border-b border-[var(--border-default)] pb-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {lang === 'vi'
                ? 'Không gian học tập PRO192 × JavaGuide'
                : 'JavaBrew — PRO192 × JavaGuide Workspace'}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              {lang === 'vi'
                ? 'Giáo trình PRO192 chuẩn hóa 30 Slots kèm 150 bài tập tự luyện, 4 bộ đề thi PE thực chiến, kho slide PDF/PPTX offline và 354 bài chuyên sâu JavaGuide song ngữ Anh – Việt.'
                : 'Structured PRO192 curriculum (30 slots, 150 exercises, 4 PE challenges, offline slides) connected via Study Bridge to 354 bilingual EN/VI JavaGuide technical articles.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/pro192"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Học PRO192</span>
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
            >
              <BookOpen className="h-4 w-4 text-[var(--accent)]" />
              <span>Kho JavaGuide</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Search className="h-4 w-4" />
              <span>Tìm nhanh</span>
            </button>
          </div>
        </div>
      </section>

      {/* Continue learning banner */}
      {progress.lastVisited && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-text)]">
              Tiếp tục phiên học gần nhất
            </div>
            <div className="truncate text-base font-semibold text-[var(--text-primary)]">
              {progress.lastVisited.title}
            </div>
          </div>
          <Link
            to={progress.lastVisited.path}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-muted)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
          >
            <span>Mở lại ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      {/* Compact tabular progress strip */}
      <section aria-label="Tổng quan tiến độ học tập" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Tiến độ cá nhân (lưu cục bộ)
          </h2>
          {hasAnyProgress && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn muốn đặt lại toàn bộ tiến độ học tập đã lưu?')) {
                  resetProgress();
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--danger)]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Đặt lại tiến độ</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 divide-y divide-[var(--border-default)] overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-4">
            <div className="text-xs text-[var(--text-secondary)]">PRO192 Slots</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">
              {progress.completedSlots.length}
              <span className="text-sm font-normal text-[var(--text-muted)]">/{totalSlots}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-[var(--text-secondary)]">Bài tập tự luyện</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">
              {progress.solvedExercises.length}
              <span className="text-sm font-normal text-[var(--text-muted)]">/{totalExercises}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-[var(--text-secondary)]">Đề thi thử PE</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">
              {progress.completedPe.length}
              <span className="text-sm font-normal text-[var(--text-muted)]">/{totalPe}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-[var(--text-secondary)]">Bài JavaGuide đã đọc</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">
              {progress.completedArticles.length}
              <span className="text-sm font-normal text-[var(--text-muted)]">/{totalArticles}</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRO192 8-Stage Roadmap */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Lộ trình PRO192 — 8 Giai đoạn ({totalSlots} Slots)
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Mỗi giai đoạn tích hợp bài giảng sạch, Study Bridge nối sang JavaGuide và bộ bài tập tự luyện ẩn đáp án.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              to="/pe"
              className="inline-flex items-center gap-1.5 text-[var(--accent-text)] hover:underline"
            >
              <Timer className="h-4 w-4" />
              <span>Phòng luyện PE</span>
            </Link>
            <Link
              to="/resources"
              className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
            >
              <FolderArchive className="h-4 w-4" />
              <span>Kho Slide & PDF</span>
            </Link>
          </div>
        </div>

        {metaLoading && !pro192 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pro192?.stages.map((stage) => {
              const slug = stageFileToSlug(stage.file);
              const doneInStage = stage.slots.filter((s) =>
                progress.completedSlots.includes(s)
              ).length;
              const allDone = doneInStage === stage.slots.length;

              return (
                <Link
                  key={stage.id}
                  to={`/pro192/${slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--accent)]"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold tabular-nums text-[var(--accent-text)]">
                        Giai đoạn {stage.id} · Slot {stage.slots[0]}–
                        {stage.slots[stage.slots.length - 1]}
                      </span>
                      <span
                        className={[
                          'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium tabular-nums',
                          allDone
                            ? 'bg-[var(--success-soft)] text-[var(--success)]'
                            : 'bg-[var(--bg-surface-muted)] text-[var(--text-muted)]',
                        ].join(' ')}
                      >
                        {allDone && <CheckCircle2 className="h-3 w-3" />}
                        <span>
                          {doneInStage}/{stage.slots.length} Slots
                        </span>
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">
                      {stage.title.replace(/^Giai đoạn \d+:\s*/, '')}
                    </h3>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[var(--border-default)] pt-2.5 text-xs text-[var(--text-muted)]">
                    <span className="tabular-nums">
                      {stage.slides.length} slide · {stage.studyBridge.length} bài Study Bridge
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--accent-text)]">
                      <span>Học ngay</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* JavaGuide 10 Domains */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Kho tri thức JavaGuide — 10 Cụm chuyên sâu ({totalArticles} bài EN/VI)
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Đọc song ngữ Anh – Việt và chuyển đổi trực tiếp ngay trong từng bài viết.
            </p>
          </div>
          <Link
            to="/docs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-text)] hover:underline"
          >
            <span>Xem danh mục đầy đủ</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="divide-y divide-[var(--border-default)]">
            {navigation?.domains.map((domain) => {
              const title = lang === 'vi' ? domain.labelVi : domain.labelEn;
              const subTitle = lang === 'vi' ? domain.labelEn : domain.labelVi;
              const domainArticles = domain.groups.flatMap((g) => g.articles);
              const readInDomain = domainArticles.filter((a) =>
                progress.completedArticles.includes(a.rel)
              ).length;

              return (
                <Link
                  key={domain.id}
                  to={`/docs?domain=${domain.id}`}
                  className="flex flex-col justify-between gap-2 px-4 py-3.5 transition-colors hover:bg-[var(--bg-surface-muted)] sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {title}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{subTitle}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--text-secondary)]">
                      {domain.groups
                        .filter((g) => g.id !== '_overview')
                        .slice(0, 4)
                        .map((g) => (
                          <span
                            key={g.id}
                            className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-1.5 py-0.5"
                          >
                            {lang === 'vi' ? g.labelVi : g.labelEn}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 text-xs tabular-nums text-[var(--text-muted)]">
                    <span>
                      Đã đọc: <strong className="text-[var(--text-primary)]">{readInDomain}</strong>/
                      {domain.totalArticles}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
