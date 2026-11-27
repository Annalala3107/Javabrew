import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Square,
  Timer,
  XCircle,
} from 'lucide-react';
import { JavaCodeEditor, MAX_CODE_CHARS } from '../components/JavaCodeEditor';
import { StreamingAiBubble } from '../components/lucian/StreamingAiBubble';
import { useApp } from '../context/AppContext';
import { formatClock, useStudioTimer } from '../hooks/useStudioTimer';
import { streamMockExamReview } from '../services/aiMentorService';
import { runJavaInCloud, type JavaDiagnostic } from '../services/javaCompilerService';
import { inferJavaFileName, validateJavaPolicy } from '../utils/javaFiles';
import {
  appendMockExamHistory,
  buildMockExamPapers,
  clearMockExamDrafts,
  computeQuestionEarnedMarks,
  readMockExamDrafts,
  readMockExamHistory,
  saveMockExamDraft,
  type MockExamDraftMap,
  type MockExamHistoryRecord,
  type MockExamQuestionResult,
} from '../utils/mockExam';
import { evaluatePeCode } from '../utils/peEvaluator';

type ExamPhase = 'active' | 'grading' | 'submitted';

export function MockExamPage() {
  const { paper: rawPaperParam } = useParams();
  const navigate = useNavigate();
  const {
    pro192,
    theme,
    byokKey,
    aiModel,
    aiServerStatus,
    refreshAiServerStatus,
    updateAiServerQuota,
    addMistake,
    markPeStatus,
    setIsSettingsOpen,
    pushToast,
  } = useApp();

  const papers = useMemo(
    () => buildMockExamPapers(pro192?.peChallenges ?? []),
    [pro192?.peChallenges]
  );

  const normalizedPaper = rawPaperParam?.trim().toUpperCase() || '';
  const activePaper = useMemo(
    () => (normalizedPaper ? papers.find((p) => p.paper === normalizedPaper) ?? null : null),
    [normalizedPaper, papers]
  );

  const [history, setHistory] = useState<MockExamHistoryRecord[]>(readMockExamHistory);
  const [phase, setPhase] = useState<ExamPhase>('active');
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [activeFile, setActiveFile] = useState<'main' | 'entity' | 'interface'>('main');
  const [drafts, setDrafts] = useState<MockExamDraftMap>({});
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Per-question syntax check console (only compile diagnostics — no Diff, no AI during exam)
  const [checkingCompile, setCheckingCompile] = useState(false);
  const [compileStatus, setCompileStatus] = useState('Chưa kiểm tra biên dịch');
  const [compileOutput, setCompileOutput] = useState('');
  const [compileDiagnostics, setCompileDiagnostics] = useState<JavaDiagnostic[]>([]);

  // Post-submit grading + AI Examiner state
  const [gradingProgress, setGradingProgress] = useState('');
  const [latestRecord, setLatestRecord] = useState<MockExamHistoryRecord | null>(null);
  const [aiReviewPrompt, setAiReviewPrompt] = useState('');
  const [aiReviewReply, setAiReviewReply] = useState('');
  const [aiReviewTone, setAiReviewTone] = useState<'ai' | 'error'>('ai');
  const [aiReviewBadge, setAiReviewBadge] = useState('');
  const [aiReviewStreaming, setAiReviewStreaming] = useState(false);
  const [aiReviewBusy, setAiReviewBusy] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const submittedPaperRef = useRef<string | null>(null);
  const initializedPaperRef = useRef<string | null>(null);

  const handleSubmitExamRef = useRef<(timedOut?: boolean) => void>(() => {});

  const { secondsLeft, timerRunning, toggleTimer, resetTimer, formattedClock } = useStudioTimer({
    initialSeconds: (activePaper?.durationMinutes ?? 85) * 60,
    autoStart: Boolean(activePaper),
    disabled: !activePaper || phase !== 'active',
    onExpire: () => handleSubmitExamRef.current(true),
  });

  // Initialize isolated drafts & state when switching papers
  useEffect(() => {
    if (!activePaper) {
      initializedPaperRef.current = null;
      aiAbortRef.current?.abort();
      aiAbortRef.current = null;
      setDrafts({});
      return;
    }

    if (initializedPaperRef.current === activePaper.paper) {
      return;
    }
    initializedPaperRef.current = activePaper.paper;

    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAiReviewBusy(false);
    setAiReviewStreaming(false);
    setAiReviewPrompt('');
    setAiReviewReply('');
    setLatestRecord(null);
    setConfirmSubmitOpen(false);
    setCompileDiagnostics([]);
    setCompileOutput('');
    setCompileStatus('Chưa kiểm tra biên dịch');

    submittedPaperRef.current = null;
    const saved = readMockExamDrafts(activePaper.paper);
    const initial: MockExamDraftMap = {};
    for (const q of activePaper.questions) {
      initial[q.id] = saved[q.id] ?? {
        main: q.starterCode,
        entity: q.entityCode,
      };
    }
    setDrafts(initial);
    setActiveQIndex(0);
    setActiveFile('main');
    setPhase('active');
    resetTimer(activePaper.durationMinutes * 60, true);
  }, [activePaper, resetTimer]);

  useEffect(() => {
    return () => {
      aiAbortRef.current?.abort();
    };
  }, []);

  const currentQuestion = activePaper?.questions[activeQIndex] ?? null;
  const currentDraft = currentQuestion
    ? drafts[currentQuestion.id] ?? {
        main: currentQuestion.starterCode,
        entity: currentQuestion.entityCode,
      }
    : { main: '', entity: '' };

  const currentMainFileName = currentQuestion
    ? inferJavaFileName(currentDraft.main, `MainQ${activeQIndex + 1}.java`)
    : 'Main.java';
  const currentEntityFileName = currentQuestion?.entityFileName || '';
  const hasEntity = Boolean(currentEntityFileName && currentQuestion?.entityCode);
  const hasInterface = Boolean(currentQuestion?.interfaceFileName && currentQuestion?.interfaceCode);

  const updateCurrentDraft = (target: 'main' | 'entity', value: string) => {
    if (!activePaper || !currentQuestion || phase !== 'active') return;
    const safeVal = value.length > MAX_CODE_CHARS ? value.slice(0, MAX_CODE_CHARS) : value;
    const nextEntry = {
      main: target === 'main' ? safeVal : currentDraft.main,
      entity: target === 'entity' ? safeVal : currentDraft.entity,
    };
    setDrafts((prev) => ({ ...prev, [currentQuestion.id]: nextEntry }));
    saveMockExamDraft(activePaper.paper, currentQuestion.id, nextEntry.main, nextEntry.entity);
    setCompileDiagnostics([]);
  };

  const handleCompileCheck = async () => {
    if (!currentQuestion || checkingCompile) return;
    const files = [
      { name: currentMainFileName, content: currentDraft.main },
      ...(hasEntity && currentEntityFileName
        ? [{ name: currentEntityFileName, content: currentDraft.entity }]
        : []),
      ...(hasInterface && currentQuestion.interfaceFileName && currentQuestion.interfaceCode
        ? [{ name: currentQuestion.interfaceFileName, content: currentQuestion.interfaceCode }]
        : []),
    ];

    const policyErrors = validateJavaPolicy(files, currentQuestion.id);
    if (policyErrors.length > 0) {
      setCompileDiagnostics(
        policyErrors.map((e) => ({
          file: e.file,
          line: e.line,
          column: 1,
          severity: 'error' as const,
          message: e.message,
        }))
      );
      setCompileStatus(`⚠ Vi phạm quy chuẩn PRO192 (${policyErrors.length})`);
      setCompileOutput(policyErrors.map((e) => `- ${e.file}:${e.line}: ${e.message}`).join('\n'));
      return;
    }

    setCheckingCompile(true);
    setCompileStatus('Đang biên dịch thử với OpenJDK…');
    try {
      const res = await runJavaInCloud({
        mode: 'run',
        peId: currentQuestion.id,
        files,
      });
      if (res.unavailable) {
        setCompileDiagnostics([]);
        setCompileStatus('✔ Static Policy hợp lệ (Sandbox offline — sẽ chấm bằng Static lúc nộp)');
        setCompileOutput('Không phát hiện từ khóa cấm Java 9+ hoặc khai báo package.');
      } else if (!res.ok && res.phase === 'compile') {
        setCompileDiagnostics(res.diagnostics);
        setCompileStatus(`✕ Lỗi biên dịch javac (${res.diagnostics.length})`);
        setCompileOutput(res.stderr || 'Biên dịch thất bại.');
      } else {
        setCompileDiagnostics(res.diagnostics);
        setCompileStatus('✔ Biên dịch thành công (OpenJDK JDK 8 mode)');
        setCompileOutput(res.stdout || res.stderr || 'Biên dịch & chạy thử thành công.');
      }
    } finally {
      setCheckingCompile(false);
    }
  };

  const handleSubmitExam = useCallback(
    async (timedOut = false) => {
      if (!activePaper || phase !== 'active') return;
      if (submittedPaperRef.current === activePaper.paper) return;
      submittedPaperRef.current = activePaper.paper;

      setConfirmSubmitOpen(false);
      setPhase('grading');
      const totalSeconds = activePaper.durationMinutes * 60;
      const elapsedSeconds = Math.max(1, totalSeconds - secondsLeft);

      const results: MockExamQuestionResult[] = [];

      for (let i = 0; i < activePaper.questions.length; i++) {
        const q = activePaper.questions[i];
        setGradingProgress(`Đang chấm câu ${i + 1}/${activePaper.questions.length}: ${q.code}…`);
        const d = drafts[q.id] ?? { main: q.starterCode, entity: q.entityCode };
        const qMainFile = inferJavaFileName(d.main, `Q${i + 1}.java`);
        const files = [
          { name: qMainFile, content: d.main },
          ...(q.entityFileName && q.entityCode ? [{ name: q.entityFileName, content: d.entity }] : []),
          ...(q.interfaceFileName && q.interfaceCode
            ? [{ name: q.interfaceFileName, content: q.interfaceCode }]
            : []),
        ];

        const marks = q.marks ?? 2.5;
        let passedTests = 0;
        let totalTests = 3;
        let diagnostics: string[] = [];
        let failedTests: string[] = [];
        let engineLabel = 'Static Evaluator';

        const policyErrs = validateJavaPolicy(files, q.id);
        if (policyErrs.length > 0) {
          diagnostics = policyErrs.map((e) => `${e.file}:${e.line}: ${e.message}`);
          totalTests = 3;
          passedTests = 0;
        } else {
          const cloudRes = await runJavaInCloud({
            mode: 'grade',
            peId: q.id,
            files,
          });

          if (!cloudRes.unavailable && Array.isArray(cloudRes.testResults) && cloudRes.testResults.length > 0) {
            engineLabel = cloudRes.jdkVersion || 'OpenJDK 21 Sandbox';
            totalTests = cloudRes.testResults.length;
            passedTests = cloudRes.testResults.filter((t) => t.passed).length;
            diagnostics = cloudRes.diagnostics.map((diag) => `${diag.file}:${diag.line}: ${diag.message}`);
            failedTests = cloudRes.testResults
              .filter((t) => !t.passed)
              .map((t) => `${t.id} (${t.name}): kỳ vọng "${t.expected ?? ''}" nhưng ra "${t.actual ?? t.error ?? ''}"`);
          } else if (!cloudRes.unavailable && !cloudRes.ok && cloudRes.phase === 'compile') {
            engineLabel = cloudRes.jdkVersion || 'OpenJDK 21 Sandbox';
            diagnostics = cloudRes.diagnostics.map((diag) => `${diag.file}:${diag.line}: ${diag.message}`);
            if (diagnostics.length === 0 && cloudRes.stderr) {
              diagnostics = [cloudRes.stderr.slice(0, 220)];
            }
          } else {
            const evalRes = evaluatePeCode(q.id, d.main, d.entity);
            engineLabel = 'Static Evaluator (Fallback)';
            totalTests = evalRes.totalCount;
            passedTests = evalRes.passedCount;
            if (!evalRes.allPassed) {
              failedTests = [evalRes.statusText];
            }
            if (evalRes.detectedMistake) {
              addMistake(evalRes.detectedMistake);
            }
          }
        }

        const earnedMarks = computeQuestionEarnedMarks(passedTests, totalTests, marks);
        const status: MockExamQuestionResult['status'] =
          passedTests === totalTests && totalTests > 0
            ? 'pass'
            : passedTests > 0
              ? 'partial'
              : 'fail';

        if (status === 'pass') {
          markPeStatus(q.id, 'pass');
        } else {
          addMistake({
            type: diagnostics.length > 0 ? 'runtime' : 'cleancode',
            peId: q.id,
            title: `Thi thử ${activePaper.paper} · ${q.code} (${passedTests}/${totalTests} TC)`,
            detail:
              diagnostics[0] ||
              failedTests[0] ||
              `Chưa đạt toàn bộ test case trong đề ${q.code}.`,
          });
        }

        results.push({
          peId: q.id,
          code: q.code,
          title: q.title,
          marks,
          earnedMarks,
          passedTests,
          totalTests,
          status,
          engineLabel,
          diagnostics,
          failedTests,
        });
      }

      const totalScore =
        Math.round(results.reduce((acc, r) => acc + r.earnedMarks, 0) * 100) / 100;
      const passed = totalScore >= activePaper.maxScore * 0.5;
      const record: MockExamHistoryRecord = {
        id: `mock-${activePaper.paper}-${Date.now()}`,
        paper: activePaper.paper,
        totalScore,
        maxScore: activePaper.maxScore,
        passed,
        elapsedSeconds,
        submittedAt: new Date().toISOString(),
        questions: results,
      };

      const nextHistory = appendMockExamHistory(record);
      setHistory(nextHistory);
      setLatestRecord(record);
      setPhase('submitted');
      pushToast({
        title: timedOut
          ? `Hết giờ! Đã tự động nộp ${activePaper.paper}: ${totalScore}/${activePaper.maxScore}đ`
          : `Đã chấm xong ${activePaper.paper}: ${totalScore}/${activePaper.maxScore}đ`,
        tone: passed ? 'success' : 'warn',
      });
    },
    [activePaper, phase, secondsLeft, drafts, addMistake, markPeStatus, pushToast]
  );

  handleSubmitExamRef.current = (timedOut?: boolean) => {
    void handleSubmitExam(timedOut);
  };

  const handleRequestAiExaminer = async () => {
    if (!latestRecord || aiReviewBusy) return;
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    const statusSnapshot = aiServerStatus || (await refreshAiServerStatus());
    if (aiAbortRef.current !== controller) return;
    const targetModel = byokKey ? aiModel : statusSnapshot?.defaultModel || aiModel;

    setAiReviewBusy(true);
    setAiReviewStreaming(true);
    setAiReviewTone('ai');
    setAiReviewPrompt(`Nhận xét phiếu điểm thi thử ${latestRecord.paper} (${latestRecord.totalScore}/${latestRecord.maxScore}đ)`);
    setAiReviewReply('');
    setAiReviewBadge(byokKey ? targetModel : `AI Giám khảo · ${targetModel}`);

    try {
      const res = await streamMockExamReview({
        apiKey: byokKey || undefined,
        model: targetModel,
        mockReviewContext: {
          paper: latestRecord.paper,
          totalScore: latestRecord.totalScore,
          maxScore: latestRecord.maxScore,
          elapsedSeconds: latestRecord.elapsedSeconds,
          questions: latestRecord.questions,
        },
        signal: controller.signal,
        onMeta: (meta) => {
          if (aiAbortRef.current !== controller) return;
          setAiReviewBadge(meta.source === 'byok' ? meta.model : `AI Giám khảo · ${meta.model}`);
          if (typeof meta.remaining === 'number') {
            updateAiServerQuota(meta.remaining, meta.limit);
          }
        },
        onDelta: (chunk) => {
          if (aiAbortRef.current !== controller) return;
          setAiReviewReply((prev) => prev + chunk);
        },
      });

      if (aiAbortRef.current !== controller) return;

      if (res.ok) {
        setAiReviewReply(res.reply);
        setAiReviewStreaming(false);
        if (typeof res.remaining === 'number') {
          updateAiServerQuota(res.remaining, res.limit);
        }
      } else {
        setAiReviewTone('error');
        setAiReviewReply(res.errorMessage);
        setAiReviewStreaming(false);
        setAiReviewBadge(res.quotaExceeded ? 'Hết lượt hôm nay' : `Lỗi HTTP ${res.status || 0}`);
        if (res.quotaExceeded) updateAiServerQuota(0, res.limit);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setAiReviewStreaming(false);
        setAiReviewReply((prev) => prev || 'Đã dừng nhận xét AI Giám khảo.');
      } else {
        setAiReviewTone('error');
        setAiReviewStreaming(false);
        setAiReviewReply('Không thể kết nối tới AI Giám khảo PE lúc này.');
      }
    } finally {
      if (aiAbortRef.current === controller) {
        aiAbortRef.current = null;
        setAiReviewBusy(false);
      }
    }
  };

  // Case 1: /pe/mock selection screen (or invalid paper)
  if (!rawPaperParam) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]">
              <Timer className="h-4 w-4" aria-hidden="true" />
              <span>Phòng thi thử PE PRO192 (Chuẩn EOS / PEA · JDK 1.8)</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Phòng thi PE ảo — 85 phút trọn bộ đề
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-[var(--text-muted)]">
              Mô phỏng áp lực phòng thi thật: làm liên tiếp cả Q1–Q4 (thang 10 điểm),{' '}
              <strong>khóa Diff Clean Code &amp; AI giải hộ</strong> trong suốt thời gian thi. Sau khi nộp bài, hệ thống tự chấm toàn bộ đề, cập nhật lỗi vào Sổ tay và mời AI Giám khảo nhận xét.
            </p>
          </div>
          <Link
            to="/pe"
            className="inline-flex min-h-[38px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
          >
            ← Về Kho Đề PE
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {papers.map((p) => {
            const attempts = history.filter((h) => h.paper === p.paper);
            const best = attempts.reduce<number | null>(
              (max, h) => (max === null || h.totalScore > max ? h.totalScore : max),
              null
            );
            return (
              <div
                key={p.paper}
                className="flex flex-col justify-between space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono font-bold text-[var(--accent-text)]">
                      {p.paper}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[var(--text-muted)]">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{p.durationMinutes} phút · {p.maxScore}đ</span>
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">{p.label}</h2>
                  <ul className="space-y-1 text-[var(--text-muted)]">
                    {p.questions.map((q) => (
                      <li key={q.id} className="truncate">
                        • <strong>{q.code}</strong> ({q.marks ?? 2.5}đ): {q.title}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                    <span>Đã thi: {attempts.length} lần</span>
                    {best !== null && (
                      <span className="font-mono font-semibold text-[var(--success-text)]">
                        Cao nhất: {best}/{p.maxScore}đ
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/pe/mock/${p.paper}`)}
                    className="min-h-[38px] w-full rounded-lg bg-[var(--accent)] px-3.5 py-2 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                  >
                    Bắt đầu thi {p.paper} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {history.length > 0 && (
          <section className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 text-xs">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Lịch sử thi thử gần đây
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {history.slice(0, 6).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2.5"
                >
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">
                      {h.paper} · {h.totalScore}/{h.maxScore}đ
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)]">
                      {formatClock(h.elapsedSeconds)} · {new Date(h.submittedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <span
                    className={`rounded border px-2 py-0.5 font-semibold ${
                      h.passed
                        ? 'border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success-text)]'
                        : 'border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--danger-text)]'
                    }`}
                  >
                    {h.passed ? 'Đạt' : 'Chưa đạt'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (!activePaper) {
    return (
      <div
        role="alert"
        className="mx-auto my-8 max-w-lg space-y-3 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-6 text-center text-xs"
      >
        <h1 className="text-base font-bold text-[var(--text-primary)]">
          Không tìm thấy bộ đề thi thử “{rawPaperParam}”
        </h1>
        <p className="text-[var(--text-muted)]">
          Hãy chọn một bộ đề hợp lệ từ PE1 đến PE5 trong danh sách Phòng thi ảo.
        </p>
        <Link
          to="/pe/mock"
          className="inline-flex min-h-[36px] items-center rounded-lg bg-[var(--accent)] px-4 py-1.5 font-bold text-[var(--accent-contrast)]"
        >
          ← Chọn đề thi thử PE
        </Link>
      </div>
    );
  }

  // Case 2: Grading transition state
  if (phase === 'grading') {
    return (
      <div className="mx-auto my-12 max-w-md space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center text-xs">
        <Timer className="mx-auto h-8 w-8 animate-pulse text-[var(--accent)]" aria-hidden="true" />
        <h1 className="text-base font-bold text-[var(--text-primary)]">
          Đang chấm bài thi {activePaper.paper}…
        </h1>
        <p className="font-mono text-[var(--text-muted)]">{gradingProgress}</p>
      </div>
    );
  }

  // Case 3: Submitted scorecard & AI Examiner report
  if (phase === 'submitted' && latestRecord) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-text)]">
              <Award className="h-4 w-4" aria-hidden="true" />
              <span>Phiếu điểm Phòng thi PE ảo · {latestRecord.paper}</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Tổng điểm:{' '}
              <span
                className={
                  latestRecord.passed ? 'text-[var(--success-text)]' : 'text-[var(--danger-text)]'
                }
              >
                {latestRecord.totalScore}/{latestRecord.maxScore}
              </span>{' '}
              ({latestRecord.passed ? 'Đạt yêu cầu ≥ 50%' : 'Cần ôn thêm'})
            </h1>
            <p className="text-[var(--text-muted)]">
              Thời gian làm bài: {formatClock(latestRecord.elapsedSeconds)} · Các câu chưa đạt đã được tự động thêm vào mục Lỗi cần tránh trong Sổ tay.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearMockExamDrafts(activePaper.paper);
                const fresh: MockExamDraftMap = {};
                for (const q of activePaper.questions) {
                  fresh[q.id] = { main: q.starterCode, entity: q.entityCode };
                }
                submittedPaperRef.current = null;
                setDrafts(fresh);
                setLatestRecord(null);
                setAiReviewReply('');
                setAiReviewPrompt('');
                setActiveQIndex(0);
                setPhase('active');
                resetTimer(activePaper.durationMinutes * 60, true);
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 py-1.5 font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>↺ Thi lại {activePaper.paper}</span>
            </button>
            <Link
              to="/notes"
              className="inline-flex min-h-[38px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3.5 py-1.5 font-medium text-[var(--text-primary)] hover:border-[var(--info)]"
            >
              Mở Sổ tay lỗi →
            </Link>
            <Link
              to="/pe/mock"
              className="inline-flex min-h-[38px] items-center rounded-lg bg-[var(--accent)] px-3.5 py-1.5 font-bold text-[var(--accent-contrast)]"
            >
              Chọn đề khác
            </Link>
          </div>
        </div>

        {/* Per-question Scorecard */}
        <div className="grid gap-3 md:grid-cols-2">
          {latestRecord.questions.map((qr) => (
            <div
              key={qr.peId}
              className="flex flex-col justify-between space-y-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {qr.code}: {qr.title}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono font-bold ${
                      qr.status === 'pass'
                        ? 'border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success-text)]'
                        : qr.status === 'partial'
                          ? 'border-[var(--warning)]/40 bg-[var(--warning-soft)] text-[var(--accent-text)]'
                          : 'border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--danger-text)]'
                    }`}
                  >
                    {qr.status === 'pass' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>
                      {qr.earnedMarks}/{qr.marks}đ ({qr.passedTests}/{qr.totalTests} TC)
                    </span>
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-dim)]">{qr.engineLabel}</div>
                {(qr.diagnostics.length > 0 || qr.failedTests.length > 0) && (
                  <div className="space-y-1 rounded-lg border border-[var(--danger)]/35 bg-[var(--danger-soft)] p-2.5 font-mono text-[11px] text-[var(--danger-text)]">
                    {qr.diagnostics.map((d, idx) => (
                      <div key={idx}>{d}</div>
                    ))}
                    {qr.failedTests.map((t, idx) => (
                      <div key={idx}>{t}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-1">
                <Link
                  to={`/studio/${qr.peId}`}
                  className="inline-flex items-center font-semibold text-[var(--info-text)] hover:underline"
                >
                  Mở trên Code Studio (Xem Diff Clean Code) →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* AI Examiner Review */}
        <section className="space-y-3 rounded-xl border border-[var(--info)]/40 bg-[var(--bg-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-[var(--info-text)]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>AI Giám khảo PE PRO192</span>
              </h2>
              <p className="text-[var(--text-muted)]">
                Phân tích nguyên nhân mất điểm, cảnh báo bẫy hidden test trên EOS/PEA và gợi ý kế hoạch ôn lại.
              </p>
            </div>
            {aiReviewBusy ? (
              <button
                type="button"
                onClick={() => aiAbortRef.current?.abort()}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--danger)]/45 bg-[var(--danger-soft)] px-3 py-1.5 font-bold text-[var(--danger-text)]"
              >
                <Square className="h-3 w-3" aria-hidden="true" />
                <span>Dừng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleRequestAiExaminer()}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--info)] px-3.5 py-1.5 font-bold text-[#1C1917] hover:opacity-90"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>✨ Nhận xét của AI Giám khảo PE</span>
              </button>
            )}
          </div>

          {aiReviewPrompt && (
            <StreamingAiBubble
              prompt={aiReviewPrompt}
              reply={aiReviewReply}
              thinking={aiReviewBusy && aiReviewReply.length === 0}
              streaming={aiReviewStreaming}
              liveStreamed
              tone={aiReviewTone}
              badgeLabel={aiReviewBadge}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onAbortStream={aiReviewStreaming ? () => aiAbortRef.current?.abort() : undefined}
            />
          )}
        </section>
      </div>
    );
  }

  // Case 4: Active Exam UI (Diff & AI Mentor strictly locked)
  return (
    <div className="flex flex-1 flex-col text-xs">
      {/* Exam Header */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 sm:px-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--warning)]/40 bg-[var(--warning-soft)] px-2.5 py-1 font-bold text-[var(--accent-text)]">
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span>Chế độ Thi thật · {activePaper.paper}</span>
            </span>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-1 font-mono font-bold tabular-nums">
              <Timer className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              <span
                className={
                  secondsLeft <= 180
                    ? 'text-[var(--danger-text)]'
                    : secondsLeft <= 600
                      ? 'text-[var(--accent-text)]'
                      : 'text-[var(--text-primary)]'
                }
              >
                {formattedClock}
              </span>
              <button
                type="button"
                onClick={toggleTimer}
                className="ml-1 rounded px-1.5 py-0.5 font-sans text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {timerRunning ? 'Tạm dừng' : 'Tiếp tục'}
              </button>
            </div>

            <div role="tablist" aria-label="Chuyển câu hỏi trong đề thi" className="flex flex-wrap gap-1">
              {activePaper.questions.map((q, idx) => {
                const active = idx === activeQIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveQIndex(idx);
                      setActiveFile('main');
                      setCompileDiagnostics([]);
                      setCompileOutput('');
                    }}
                    className={[
                      'min-h-[34px] rounded-lg border px-2.5 py-1 font-mono font-semibold transition-colors',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
                    ].join(' ')}
                  >
                    Q{idx + 1} ({q.marks ?? 2.5}đ)
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1 text-[var(--text-dim)] md:inline-flex">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đã khóa Diff &amp; AI trong lúc thi</span>
            </span>

            <button
              type="button"
              disabled={checkingCompile}
              onClick={() => void handleCompileCheck()}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 py-1 font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-50"
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              <span>{checkingCompile ? 'Đang kiểm tra…' : '▶ Kiểm tra biên dịch'}</span>
            </button>

            {confirmSubmitOpen ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleSubmitExam(false)}
                  className="min-h-[36px] rounded-lg bg-[var(--danger)] px-3 py-1 font-bold text-white"
                >
                  Xác nhận nộp ngay
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(false)}
                  className="min-h-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)]"
                >
                  Tiếp tục làm
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(true)}
                className="min-h-[36px] rounded-lg bg-[var(--accent)] px-3.5 py-1 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
              >
                ✔ Nộp bài thi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Exam Workspace */}
      {currentQuestion && (
        <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 lg:grid-cols-12">
          <aside className="space-y-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 lg:col-span-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-[var(--border-default)] px-2 py-0.5 font-mono font-bold text-[var(--accent-text)]">
                {currentQuestion.code}
              </span>
              <span className="font-mono text-[var(--text-muted)]">
                {currentQuestion.marks ?? 2.5} điểm
              </span>
            </div>
            <h1 className="text-base font-bold text-[var(--text-primary)]">
              {currentQuestion.title}
            </h1>
            <p className="leading-relaxed text-[var(--text-secondary)]">{currentQuestion.desc}</p>
            <div className="space-y-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3">
              <div className="font-semibold text-[var(--text-primary)]">Yêu cầu bắt buộc:</div>
              <ul className="space-y-1 text-[var(--text-muted)]">
                {currentQuestion.checklist.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="flex flex-col lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
              <div role="tablist" aria-label="Tệp mã nguồn câu hiện tại" className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFile === 'main'}
                  onClick={() => setActiveFile('main')}
                  className={`rounded-md border px-2.5 py-1 font-mono font-semibold ${
                    activeFile === 'main'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)]'
                  }`}
                >
                  {currentMainFileName}
                </button>
                {hasEntity && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeFile === 'entity'}
                    onClick={() => setActiveFile('entity')}
                    className={`rounded-md border px-2.5 py-1 font-mono font-semibold ${
                      activeFile === 'entity'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)]'
                    }`}
                  >
                    {currentEntityFileName}
                  </button>
                )}
                {hasInterface && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeFile === 'interface'}
                    onClick={() => setActiveFile('interface')}
                    className={`rounded-md border px-2.5 py-1 font-mono font-semibold ${
                      activeFile === 'interface'
                        ? 'border-[var(--info)] bg-[var(--info-soft)] text-[var(--info-text)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)]'
                    }`}
                  >
                    🔒 {currentQuestion.interfaceFileName}
                  </button>
                )}
              </div>
              <span className="text-[11px] text-[var(--text-dim)]">
                Lưu nháp thi tự động (độc lập với Code Studio)
              </span>
            </div>

            <div className="flex-1">
              {activeFile === 'interface' && hasInterface ? (
                <pre className="h-full overflow-auto bg-[var(--bg-code)] p-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
                  <code>{currentQuestion.interfaceCode}</code>
                </pre>
              ) : (
                <JavaCodeEditor
                  docKey={`mock:${activePaper.paper}:${currentQuestion.id}:${activeFile}`}
                  value={activeFile === 'entity' ? currentDraft.entity : currentDraft.main}
                  onChange={(val) =>
                    updateCurrentDraft(activeFile === 'entity' ? 'entity' : 'main', val)
                  }
                  onRunShortcut={() => void handleCompileCheck()}
                  theme={theme}
                  diagnostics={compileDiagnostics}
                  ariaLabel={`Trình soạn thảo thi thử ${currentQuestion.code}`}
                  minHeight={360}
                />
              )}
            </div>

            <div className="space-y-1.5 border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <div className="font-mono font-semibold text-[var(--text-secondary)]">
                {compileStatus}
              </div>
              {compileOutput && (
                <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-2.5 font-mono text-[11px] text-[var(--text-primary)]">
                  {compileOutput}
                </pre>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
