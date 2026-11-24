import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Code2, PenTool, Sparkles } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useApp } from '../context/AppContext';

export function LandingPage() {
  const { navigation, pro192, progress } = useApp();

  const totalSlots = pro192?.course.totalSlots ?? 30;
  const totalExercises = pro192?.course.totalExercises ?? 150;
  const totalArticles = navigation?.totalArticles ?? 354;

  const resumeLabel = progress.lastVisited
    ? `Vào bàn học (${progress.lastVisited.title.slice(0, 32)}${progress.lastVisited.title.length > 32 ? '...' : ''}) →`
    : 'Vào bàn học (Dashboard) →';

  return (
    <div className="flex-1 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* M1 Landing Header (matches prototype-buoc-5.html) */}
      <header className="sticky top-0 z-20 border-b border-[var(--border-default)] bg-[var(--bg-canvas)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <Link to="/" className="rounded-lg focus-visible:outline-2">
            <Logo subtitle="" showBadge="Night Coffee Lab" />
          </Link>

          <nav className="hidden items-center gap-6 text-xs text-[var(--text-muted)] md:flex">
            <a href="#m1-sources" className="transition-colors hover:text-[var(--text-primary)]">
              Nguồn tài liệu
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

          <Link
            to="/dashboard"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            Học ngay →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 md:px-6 md:py-14">
        {/* Hero Section */}
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--accent-text)]">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              <span>PRO192 Giáo trình trường × JavaGuide · Đọc Offline</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-4xl">
              Pha ly cà phê đêm, cày chắc <span className="text-[var(--accent)]">Java OOP</span>{' '}
              và chinh phục <span className="text-[var(--accent)]">đề PE</span> cùng AI Mentor.
            </h1>

            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Không gian học tập không quảng cáo kết hợp trọn bộ {totalSlots} Slots PRO192 ({totalExercises} bài tập có lời giải), {totalArticles} bài JavaGuide song ngữ Anh – Việt và Code Studio giúp bạn bắt lỗi, hiểu bản chất và viết code gọn sạch hơn mỗi ngày.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to={progress.lastVisited ? progress.lastVisited.path : '/dashboard'}
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-bold text-[var(--accent-contrast)] shadow-sm transition-colors hover:bg-[var(--accent-hover)]"
              >
                {resumeLabel}
              </Link>
              <Link
                to="/studio"
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
              >
                Thử Code Studio ngay
              </Link>
            </div>

            <p className="text-xs text-[var(--text-dim)]">
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

          {/* Interactive Hero Studio Preview Card */}
          <div className="lg:col-span-6">
            <div className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5 text-xs">
                <div className="flex items-center gap-2 font-mono text-[var(--text-muted)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                  <span className="ml-2 text-[var(--text-primary)]">StudentManager.java · PE 01</span>
                </div>
                <span className="rounded-md border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 text-[var(--success-text)]">
                  ✔ 3/3 Test Pass
                </span>
              </div>

              <div className="space-y-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3.5 font-mono text-xs overflow-x-auto">
                <div>
                  <span className="mr-3 text-[var(--text-dim)]">01</span>
                  <span className="text-[var(--accent)]">public List&lt;Student&gt;</span>{' '}
                  <span className="text-[var(--text-primary)]">getHonorList(List&lt;Student&gt; list) {'{'}</span>
                </div>
                <div>
                  <span className="mr-3 text-[var(--text-dim)]">02</span>
                  {'  '}
                  <span className="text-[var(--info)]">if</span> (list == null){' '}
                  <span className="text-[var(--info)]">return</span> List.of();
                </div>
                <div>
                  <span className="mr-3 text-[var(--text-dim)]">03</span>
                  {'  '}
                  <span className="text-[var(--info)]">return</span> list.stream().filter(s -&gt; s.getGpa() &gt;= 8.0).toList();
                </div>
                <div>
                  <span className="mr-3 text-[var(--text-dim)]">04</span>
                  {'}'}
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-[var(--info)]/35 bg-[var(--info-soft)] p-3 text-xs">
                <div className="font-semibold text-[var(--info-text)]">
                  ✨ AI Mentor (Góc Cà Phê Review):
                </div>
                <p className="text-[var(--text-secondary)]">
                  Gọn hơn hẳn rồi! Tách điều kiện kiểm tra null ngay đầu hàm giúp bạn tránh lỗi{' '}
                  <code className="rounded bg-[var(--bg-code)] px-1 py-0.5 text-[var(--accent-text)]">
                    NullPointerException
                  </code>{' '}
                  kinh điển khi chấm PE.
                </p>
              </div>
            </div>
          </div>
        </section>

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
                Hệ thống hóa {totalSlots} Slots trên lớp cùng {totalExercises} bài tập tự luyện, 14 slide PDF/PPTX và 4 bộ đề thực hành PE.
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

        {/* Block 2: 4 Tính năng cốt lõi */}
        <section id="m1-features" className="space-y-4">
          <div className="font-mono text-xs uppercase text-[var(--accent)]">
            02 · Tính năng cốt lõi trong lớp học
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/pro192"
              className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--border-default)] text-[var(--accent)]">
                <BookOpen className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Cầu nối Study Bridge
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Đọc xong lý thuyết trên lớp → bấm 1 nút sang bài đào sâu JavaGuide tương ứng.
              </p>
            </Link>

            <Link
              to="/pe"
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
              className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--info)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--border-default)] text-[var(--info)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Code Studio + AI Mentor
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Chấm test case PE, so sánh Diff Clean Code &amp; gợi ý cách sửa ngay lập tức.
              </p>
            </Link>

            <Link
              to="/pe?tab=mistakes"
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

        {/* Block 3: How It Works + Final CTA */}
        <section
          id="m1-how"
          className="space-y-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6"
        >
          <div className="font-mono text-xs uppercase text-[var(--accent)]">
            03 · Cách học hiệu quả trong 3 bước
          </div>
          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
            <div className="space-y-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4">
              <div className="font-bold text-[var(--text-primary)]">
                1. Pha nền tảng (Slot + Bridge)
              </div>
              <p className="text-[var(--text-muted)]">
                Đọc lý thuyết theo Slot trên lớp và mở rộng cơ chế ngầm qua JavaGuide.
              </p>
            </div>
            <div className="space-y-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4">
              <div className="font-bold text-[var(--text-primary)]">
                2. Luyện PE cùng AI Mentor
              </div>
              <p className="text-[var(--text-muted)]">
                Mở đề PE trên Code Studio, chạy test và để AI góp ý cách viết code sạch hơn.
              </p>
            </div>
            <div className="space-y-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4">
              <div className="font-bold text-[var(--text-primary)]">
                3. Bứt phá FE qua AnanQuiz ↗
              </div>
              <p className="text-[var(--text-muted)]">
                Chuyển sang web trắc nghiệm vệ tinh để luyện phản xạ câu hỏi lý thuyết FE.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] pt-3">
            <span className="text-xs text-[var(--text-muted)]">
              Tách Espresso đã sẵn sàng — cùng vào bàn học nhé?
            </span>
            <Link
              to="/dashboard"
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              Vào Dashboard ngay →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
