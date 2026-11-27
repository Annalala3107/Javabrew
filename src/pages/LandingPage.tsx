import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Compass,
  Layers,
  PenTool,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { GlowCtaCard } from '../components/lucian/GlowCtaCard';
import { GridBeamHeroBg } from '../components/lucian/GridBeamHeroBg';
import { InteractiveHeroDemo } from '../components/lucian/InteractiveHeroDemo';
import { MobileLandingMenu } from '../components/lucian/MobileLandingMenu';
import { ScrollTimeline, type TimelineStep } from '../components/lucian/ScrollTimeline';
import { ThemeToggleButton } from '../components/lucian/ThemeToggleButton';
import { TypewriterKeyword } from '../components/lucian/TypewriterKeyword';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useRevealSection } from '../hooks/useMotion';

const HERO_KEYWORDS = [
  { text: 'Java OOP', color: 'var(--accent)' },
  { text: 'Collections', color: 'var(--info)' },
  { text: 'JVM Memory', color: 'var(--success-text)' },
  { text: 'Đề thi PE', color: 'var(--accent-text)' },
];

const HOW_STEPS: TimelineStep[] = [
  {
    num: '01',
    title: '1. Pha nền tảng (Slot + Bridge)',
    description:
      'Đọc lý thuyết theo từng Slot trên lớp, làm 150 bài tập ẩn đáp án và bấm 1 nút mở rộng cơ chế ngầm qua JavaGuide.',
  },
  {
    num: '02',
    title: '2. Luyện PE cùng AI Mentor',
    description:
      'Mở đề PE trên Code Studio, viết code với nháp tự lưu, chạy test tĩnh và đối chiếu Diff Clean Code ngay lập tức.',
  },
  {
    num: '03',
    title: '3. Bứt phá FE qua AnanQuiz ↗',
    description:
      'Chuyển sang web trắc nghiệm vệ tinh để luyện phản xạ câu hỏi lý thuyết FE trước ngày thi.',
  },
];

export function LandingPage() {
  const { navigation, pro192, progress } = useApp();
  const { user } = useAuth();
  const heroScopeRef = useRef<HTMLDivElement>(null);
  const roadmapScopeRef = useRef<HTMLElement>(null);
  const featuresScopeRef = useRef<HTMLElement>(null);

  useRevealSection(heroScopeRef, {
    selector: '[data-hero-stagger]',
    y: 16,
    duration: 0.45,
    stagger: 0.06,
  });

  useRevealSection(roadmapScopeRef, {
    selector: '[data-reveal]',
    y: 18,
    duration: 0.42,
    stagger: 0.06,
    scrollTrigger: true,
  });

  useRevealSection(featuresScopeRef, {
    selector: '[data-reveal]',
    y: 18,
    duration: 0.42,
    stagger: 0.06,
    scrollTrigger: true,
  });

  const totalSlots = pro192?.course.totalSlots ?? 30;
  const totalExercises = pro192?.course.totalExercises ?? 150;
  const totalPe = pro192?.course.totalPeChallenges ?? 19;
  const totalArticles = navigation?.totalArticles ?? 354;

  const resumeLabel = progress.lastVisited
    ? `Vào bàn học (${progress.lastVisited.title.slice(0, 32)}${progress.lastVisited.title.length > 32 ? '...' : ''}) →`
    : 'Vào bàn học (Dashboard) →';

  return (
    <div className="flex-1 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* M1 Landing Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-canvas)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="min-w-0 rounded-lg focus-visible:outline-2">
            <Logo subtitle="" showBadge="Night Coffee Lab" />
          </Link>

          <nav aria-label="Điều hướng trang giới thiệu" className="hidden items-center gap-6 text-xs text-[var(--text-muted)] md:flex">
            <a href="#m1-sources" className="transition-colors hover:text-[var(--text-primary)]">
              Nguồn tài liệu
            </a>
            <a href="#m1-roadmap" className="transition-colors hover:text-[var(--text-primary)]">
              Lộ trình
            </a>
            <a href="#m1-features" className="transition-colors hover:text-[var(--text-primary)]">
              Tính năng
            </a>
            <a href="#m1-how" className="transition-colors hover:text-[var(--text-primary)]">
              Cách học
            </a>
            <a
              href="https://anan-mocha.vercel.app/quizzes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-[var(--accent-text)]"
            >
              <span>Ôn FE (AnanQuiz)</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggleButton />
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex min-h-[40px] items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                Vào Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden min-h-[40px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] sm:inline-flex"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex min-h-[40px] items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
                >
                  Học ngay →
                </Link>
              </>
            )}
            <MobileLandingMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-8 md:px-6 md:py-12">
        {/* Hero Section with Lucian #226 Grid-Beam Background & #216 Staggered Entrance */}
        <GridBeamHeroBg className="p-5 sm:p-7 md:p-9">
          <section
            ref={heroScopeRef}
            className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
          >
            <div className="space-y-5 lg:col-span-6">
              <div
                data-hero-stagger
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--accent-text)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                <span>PRO192 Giáo trình trường × JavaGuide · Học liệu nội bộ</span>
              </div>

              <h1
                data-hero-stagger
                className="text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-4xl"
              >
                Pha ly cà phê đêm, làm chủ{' '}
                <TypewriterKeyword words={HERO_KEYWORDS} /> cùng AI Mentor.
              </h1>

              <p
                data-hero-stagger
                className="text-sm leading-relaxed text-[var(--text-muted)]"
              >
                Không gian học tập không quảng cáo kết hợp trọn bộ {totalSlots} Slots PRO192 ({totalExercises} bài tập có lời giải), {totalArticles} bài JavaGuide song ngữ Anh – Việt và Code Studio giúp bạn bắt lỗi, hiểu bản chất và viết code gọn sạch hơn mỗi ngày.
              </p>

              <div data-hero-stagger className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={progress.lastVisited ? progress.lastVisited.path : '/dashboard'}
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-bold text-[var(--accent-contrast)] shadow-sm transition-colors hover:bg-[var(--accent-hover)]"
                >
                  {resumeLabel}
                </Link>
                <Link
                  to="/studio"
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                >
                  Thử Code Studio ngay
                </Link>
                <Link
                  to="/studio/playground?example=demo-intro"
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--success)]/35 bg-[var(--success-soft)] px-4 py-2.5 text-xs font-medium text-[var(--success-text)] transition-opacity hover:opacity-90"
                >
                  ☕ JavaBrew Live Lab
                </Link>
              </div>

              <p data-hero-stagger className="text-xs text-[var(--text-dim)]">
                Cần luyện trắc nghiệm FE trước kỳ thi? Ghé ngay hệ thống vệ tinh{' '}
                <a
                  href="https://anan-mocha.vercel.app/quizzes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] underline hover:text-[var(--accent-text)]"
                >
                  AnanQuiz Quizzes ↗
                </a>
              </p>
            </div>

            {/* Interactive Hero Studio Preview (#229 Self-typing Terminal + PE/Beginner tabs) */}
            <div data-hero-stagger className="lg:col-span-6">
              <InteractiveHeroDemo />
            </div>
          </section>
        </GridBeamHeroBg>

        {/* Block 1: Nguồn tài liệu tin cậy */}
        <section id="m1-sources" className="space-y-4">
          <div className="font-mono text-xs uppercase text-[var(--accent)]">
            01 · Nguồn học liệu tin cậy
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Giáo trình chuẩn trường (PRO192)
              </h2>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Hệ thống hóa {totalSlots} Slots trên lớp cùng {totalExercises} bài tập tự luyện, 14 slide PDF/PPTX và {totalPe} câu đề thực hành PE thật (PE1–PE5).
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Repo mã nguồn mở JavaGuide
              </h2>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                {totalArticles} bài song ngữ Anh – Việt đào sâu Collections, JVM Memory, Concurrency, Database và kiến thức phỏng vấn thực tế.
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Gọn sạch • Không sao nhãng
              </h2>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Không quảng cáo, ảnh &amp; tài liệu nội bộ 100%, mọi tiến độ học, bookmark và ghi chú lưu an toàn trên trình duyệt của bạn.
              </p>
            </div>
          </div>
        </section>

        {/* Block 1.5: Student Level Roadmap Picker */}
        <section id="m1-roadmap" ref={roadmapScopeRef} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="font-mono text-xs uppercase text-[var(--accent)]">
                02 · Chọn lộ trình theo trình độ của bạn
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Dù bạn mới cài JDK buổi đầu hay đang ôn nước rút kỳ thi thực hành PE, chọn đúng điểm bắt đầu bên dưới.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              to="/pro192/slots/slot-01"
              data-reveal
              className="group flex flex-col justify-between space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--success)]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--success-soft)] text-[var(--success-text)]">
                    <Compass className="h-4 w-4" />
                  </span>
                  <span className="rounded-md border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--success-text)]">
                    Cơ bản · Slot 01–05
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--success-text)]">
                  Mới học từ số 0
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  Cài đặt JDK &amp; NetBeans, biến, vòng lặp, mảng, Class &amp; Constructor đầu tiên kèm bài tập tự luyện ẩn đáp án.
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--success-text)]">
                Bắt đầu Slot 01 →
              </span>
            </Link>

            <Link
              to="/pro192/slots/slot-10"
              data-reveal
              className="group flex flex-col justify-between space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--info)]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--info-soft)] text-[var(--info-text)]">
                    <Layers className="h-4 w-4" />
                  </span>
                  <span className="rounded-md border border-[var(--info)]/30 bg-[var(--info-soft)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--info-text)]">
                    Nền tảng · Slot 06–20
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--info-text)]">
                  Đang học OOP &amp; Collections
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  Kế thừa, Đa hình, Interface, ArrayList/HashMap &amp; Comparator kèm cầu nối Study Bridge sang JavaGuide song ngữ.
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--info-text)]">
                Mở OOP &amp; Study Bridge →
              </span>
            </Link>

            <Link
              to="/pe"
              data-reveal
              className="group flex flex-col justify-between space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--accent)]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
                    <Rocket className="h-4 w-4" />
                  </span>
                  <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--accent-text)]">
                    Thực chiến · PE Q1–Q4
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">
                  Ôn nước rút thi PE
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  Thực hành {totalPe} câu đề thi thật chuẩn Java JDK 1.8 (PE1–PE5) trong Code Studio, bấm giờ thi thật, xem Diff Clean Code và bí kíp 7 khuôn mẫu.
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--accent-text)]">
                Vào Kho Đề PE →
              </span>
            </Link>
          </div>
        </section>

        {/* Block 2: 4 Tính năng cốt lõi (Bento Grid + GSAP Reveal) */}
        <section id="m1-features" ref={featuresScopeRef} className="space-y-4">
          <div className="font-mono text-xs uppercase text-[var(--accent)]">
            03 · Tính năng cốt lõi trong lớp học
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/pro192"
              data-reveal
              className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--border-default)] text-[var(--accent)]">
                <BookOpen className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Cầu nối Study Bridge
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Đọc xong lý thuyết trên lớp → bấm 1 nút sang bài đào sâu JavaGuide song ngữ đối chiếu 2 cột.
              </p>
            </Link>

            <Link
              to="/pe"
              data-reveal
              className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--border-default)] text-[var(--accent)]">
                <Code2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Kho Đề PE Thực chiến
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Luyện đề OOP, Comparator, File I/O kèm Checklist tiêu chí chấm điểm PE.
              </p>
            </Link>

            <Link
              to="/studio"
              data-reveal
              className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--info)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--border-default)] text-[var(--info)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Code Studio + AI Mentor
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Tự động lưu nháp bài làm, cột số dòng, so sánh Diff Clean Code &amp; AI gợi ý theo từng dòng.
              </p>
            </Link>

            <Link
              to="/pe?tab=mistakes"
              data-reveal
              className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--success)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--border-default)] text-[var(--success)]">
                <PenTool className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Lưu lỗi code &amp; Bookmark
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Gom các lỗi sai hay gặp khi làm PE và đánh dấu bài cần ôn lại nhanh.
              </p>
            </Link>
          </div>
        </section>

        {/* Block 3: Scroll Timeline (#370) + Glow CTA Card (#425) */}
        <section
          id="m1-how"
          className="space-y-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 md:p-6"
        >
          <div className="font-mono text-xs uppercase text-[var(--accent)]">
            04 · Cách học hiệu quả trong 3 bước
          </div>

          <ScrollTimeline steps={HOW_STEPS} />

          <GlowCtaCard
            promptText="Tách Espresso đã sẵn sàng — cùng vào bàn học nhé?"
            ctaLabel="Vào Dashboard ngay →"
            ctaTo="/dashboard"
          />
        </section>
      </div>
    </div>
  );
}
