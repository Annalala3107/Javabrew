// Lucian UX/UI Prompt #229 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#229
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import { SlidingPillTabs } from './SlidingPillTabs';
import './lucian-229.css';

type DemoTab = 'pe' | 'beginner';

const DEMO_TABS = [
  { id: 'pe' as const, label: 'Thực chiến PE' },
  { id: 'beginner' as const, label: 'Cơ bản Slot 01' },
];

const SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

interface DemoScenario {
  fileName: string;
  badgeText: string;
  badgeTone: 'success' | 'info';
  cmd: string;
  steps: string[];
  finalLine: string;
  mentorLabel: string;
  mentorBody: string;
  tryPath: string;
  tryLabel: string;
}

const SCENARIOS: Record<DemoTab, DemoScenario> = {
  pe: {
    fileName: 'StudentManager.java · PE 01',
    badgeText: '✔ 3/3 Test Pass',
    badgeTone: 'success',
    cmd: 'javac Student.java Main.java && java Main',
    steps: ['Biên dịch lớp Student & Main', 'Chạy TC1 & TC2 (Null-safe check)'],
    finalLine: 'PASS 3/3 · Clean Code đạt chuẩn PE 01 (0.4s)',
    mentorLabel: '✨ AI Mentor (Góc Cà Phê Review):',
    mentorBody:
      'Gọn hơn hẳn rồi! Tách điều kiện kiểm tra null ngay đầu hàm giúp bạn tránh lỗi NullPointerException kinh điển khi chấm PE.',
    tryPath: '/studio/1',
    tryLabel: 'Mở đề này trong Studio →',
  },
  beginner: {
    fileName: 'HelloJava.java · Slot 01',
    badgeText: '✔ JDK Ready',
    badgeTone: 'info',
    cmd: 'javac HelloJava.java && java HelloJava',
    steps: ['Khởi tạo Class & Constructor', 'Tạo đối tượng Student("An", 8.5)'],
    finalLine: 'Output: Xin chào PRO192! Sinh viên An - GPA 8.5',
    mentorLabel: '☕ Gợi ý cho người mới (Slot 01):',
    mentorBody:
      'Từ khóa this.name giúp phân biệt thuộc tính của đối tượng với tham số truyền vào Constructor. Nắm chắc phần này trước khi qua Kế thừa.',
    tryPath: '/pro192/slots/slot-01',
    tryLabel: 'Học Slot 01 ngay →',
  },
};

export function InteractiveHeroDemo() {
  const [tab, setTab] = useState<DemoTab>('pe');
  const [replaySeed, setReplaySeed] = useState(0);
  const [typedCmd, setTypedCmd] = useState(SCENARIOS.pe.cmd);
  const [typingActive, setTypingActive] = useState(false);
  const [stepStates, setStepStates] = useState<('pending' | 'spin' | 'done')[]>(['done', 'done']);
  const [spinChar, setSpinChar] = useState('⠋');
  const [progress, setProgress] = useState(1);
  const [showResult, setShowResult] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasPlayedInitialRef = useRef(false);

  const scenario = SCENARIOS[tab];

  useEffect(() => {
    const activeScenario = SCENARIOS[tab];
    const reduced = getPrefersReducedMotion();

    if (reduced || (tab === 'pe' && replaySeed === 0 && !hasPlayedInitialRef.current && typeof IntersectionObserver === 'undefined')) {
      setTypedCmd(activeScenario.cmd);
      setTypingActive(false);
      setStepStates(activeScenario.steps.map(() => 'done'));
      setProgress(1);
      setShowResult(true);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const id = window.setTimeout(() => {
          if (cancelled) reject(new Error('cancelled'));
          else resolve();
        }, ms);
        timers.push(id);
      });

    const startSequence = async () => {
      hasPlayedInitialRef.current = true;
      setTypedCmd('');
      setTypingActive(true);
      setStepStates(activeScenario.steps.map(() => 'pending'));
      setProgress(0);
      setShowResult(false);

      try {
        await wait(160);
        for (let i = 1; i <= activeScenario.cmd.length; i++) {
          if (document.hidden) await wait(200);
          setTypedCmd(activeScenario.cmd.slice(0, i));
          await wait(16 + Math.random() * 14);
        }
        setTypingActive(false);
        await wait(150);

        for (let idx = 0; idx < activeScenario.steps.length; idx++) {
          setStepStates((prev) => prev.map((st, sIdx) => (sIdx === idx ? 'spin' : st)));
          for (let frame = 0; frame < 6; frame++) {
            setSpinChar(SPIN[frame % SPIN.length]);
            await wait(55);
          }
          setStepStates((prev) => prev.map((st, sIdx) => (sIdx === idx ? 'done' : st)));
          setProgress((idx + 1) / activeScenario.steps.length);
          await wait(90);
        }
        setShowResult(true);
      } catch {
        // cancelled cleanly on unmount or re-run
      }
    };

    const el = rootRef.current;
    if (el && typeof IntersectionObserver !== 'undefined') {
      let triggered = false;
      const io = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && !triggered) {
          triggered = true;
          io.disconnect();
          void startSequence();
        }
      });
      io.observe(el);
      return () => {
        cancelled = true;
        io.disconnect();
        timers.forEach((id) => window.clearTimeout(id));
      };
    }

    void startSequence();
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [tab, replaySeed]);

  return (
    <div ref={rootRef} className="ux u229-wrap p-4 space-y-3">
      {/* Top window bar — stays crisp on 390px without 2-line wrap mess */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2.5 text-xs">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[var(--text-muted)]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#EF4444]" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#F59E0B]" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#22C55E]" />
          <span className="ml-1 truncate text-[var(--text-primary)]">{scenario.fileName}</span>
        </div>
        <span
          className={[
            'shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium',
            scenario.badgeTone === 'success'
              ? 'border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success-text)]'
              : 'border-[var(--info)]/30 bg-[var(--info-soft)] text-[var(--info-text)]',
          ].join(' ')}
        >
          {scenario.badgeText}
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SlidingPillTabs
          options={DEMO_TABS}
          value={tab}
          onChange={setTab}
          ariaLabel="Chế độ xem trước Java"
          shape="pill"
        />
        <button
          type="button"
          onClick={() => setReplaySeed((s) => s + 1)}
          aria-label="Chạy lại demo terminal"
          className="u229-re"
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M10 4.6A4.2 4.2 0 1 0 10.4 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M10.5 1.8v3H7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Replay</span>
        </button>
      </div>

      {/* Java Code Block */}
      <div className="space-y-1 overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3.5 font-mono text-xs">
        {tab === 'pe' ? (
          <>
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
          </>
        ) : (
          <>
            <div>
              <span className="mr-3 text-[var(--text-dim)]">01</span>
              <span className="text-[var(--accent)]">public class</span>{' '}
              <span className="text-[var(--text-primary)]">Student {'{'}</span>
            </div>
            <div>
              <span className="mr-3 text-[var(--text-dim)]">02</span>
              {'  '}
              <span className="text-[var(--info)]">private</span> String name;{' '}
              <span className="text-[var(--info)]">private</span> double gpa;
            </div>
            <div>
              <span className="mr-3 text-[var(--text-dim)]">03</span>
              {'  '}
              <span className="text-[var(--accent)]">public</span> Student(String name, double gpa) {'{'}
              <span className="text-[var(--info)]"> this</span>.name = name;{' '}
              <span className="text-[var(--info)]">this</span>.gpa = gpa; {'}'}
            </div>
            <div>
              <span className="mr-3 text-[var(--text-dim)]">04</span>
              {'}'}
            </div>
          </>
        )}
      </div>

      {/* Lucian #229 Self-Typing Terminal Runner */}
      <div className="u229-tm" role="log" aria-label="Java terminal preview">
        <div className="u229-bd space-y-1">
          <div className="u229-l">
            <span className="p">❯</span> {typedCmd}
            {typingActive && <span className="u229-cu" aria-hidden="true" />}
          </div>
          {stepStates.map((st, idx) => {
            if (st === 'pending') return null;
            return (
              <div key={scenario.steps[idx]} className="u229-l">
                {st === 'spin' ? (
                  <span className="sp" aria-hidden="true">
                    {spinChar}
                  </span>
                ) : (
                  <span className="ok">✔</span>
                )}{' '}
                <span className="d">{scenario.steps[idx]}</span>
              </div>
            );
          })}
          {!showResult && progress < 1 && (
            <div className="u229-l">
              <span className="u229-pb" aria-hidden="true">
                <i style={{ '--prog': progress } as React.CSSProperties} />
              </span>
              <span className="d">{Math.round(progress * 100)}%</span>
            </div>
          )}
          {showResult && (
            <div className="u229-l">
              <span className="ok">▲</span> {scenario.finalLine}
            </div>
          )}
        </div>
      </div>

      {/* Mentor Note */}
      <div className="space-y-1.5 rounded-lg border border-[var(--info)]/35 bg-[var(--info-soft)] p-3 text-xs">
        <div className="font-semibold text-[var(--info-text)]">{scenario.mentorLabel}</div>
        <p className="text-[var(--text-secondary)]">{scenario.mentorBody}</p>
        <div className="pt-0.5">
          <Link
            to={scenario.tryPath}
            className="inline-flex items-center font-semibold text-[var(--accent-text)] hover:underline"
          >
            {scenario.tryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
