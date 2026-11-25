import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { JavaCodeEditor, type JumpTarget } from '../components/JavaCodeEditor';
import { CopyCodeButton } from '../components/lucian/CopyCodeButton';
import { LucianChecklistItem } from '../components/lucian/LucianChecklistItem';
import { MorphActionButton } from '../components/lucian/MorphActionButton';
import { SlidingPillTabs } from '../components/lucian/SlidingPillTabs';
import { StreamingAiBubble } from '../components/lucian/StreamingAiBubble';
import { useApp } from '../context/AppContext';
import {
  checkJavaSandboxHealth,
  runJavaInCloud,
  type JavaDiagnostic,
  type JavaTestCaseResult,
} from '../services/javaCompilerService';
import { inferJavaFileName } from '../utils/javaFiles';
import { evaluatePeCode, type PeDiagnosisCard, type PeEvaluationResult } from '../utils/peEvaluator';
import { clearPeDraft, readPeDraft, savePeDraft } from '../utils/studioDrafts';
import { stageFileToSlug } from '../utils/text';

interface ChatMessage {
  id: string;
  prompt: string;
  reply: string;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const LEFT_TAB_OPTIONS = [
  { id: 'spec' as const, label: 'Đề bài PE' },
  { id: 'theory' as const, label: 'Lý thuyết nhanh' },
];

const ENGINE_MODE_OPTIONS = [
  { id: 'cloud' as const, label: 'OpenJDK 21 + Clean Code' },
  { id: 'static' as const, label: 'Chỉ Static (Tức thì)' },
];

export function CodeStudioPage() {
  const { peId } = useParams<{ peId?: string }>();
  const navigate = useNavigate();
  const { pro192, theme, byokKey, markPeStatus, addMistake, recordVisit, pushToast } = useApp();

  const challenges = useMemo(() => pro192?.peChallenges ?? [], [pro192]);
  const numericId = Number(peId) || 1;
  const activePe = useMemo(
    () => challenges.find((c) => c.id === numericId) || challenges[0] || null,
    [challenges, numericId]
  );

  const [leftTab, setLeftTab] = useState<'spec' | 'theory'>('spec');
  const [activeFile, setActiveFile] = useState<'main' | 'entity'>('main');
  const [showAiPane, setShowAiPane] = useState(true);
  const [showDiff, setShowDiff] = useState(false);

  const [engineMode, setEngineMode] = useState<'cloud' | 'static'>('cloud');
  const [sandboxHealth, setSandboxHealth] = useState<'checking' | 'ready' | 'offline'>('checking');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showStdin, setShowStdin] = useState(false);
  const [stdinInput, setStdinInput] = useState('');

  const [loadedPeId, setLoadedPeId] = useState<number | null>(null);
  const [mainCode, setMainCode] = useState('');
  const [entityCode, setEntityCode] = useState('');
  const [draftState, setDraftState] = useState<'clean' | 'saving' | 'saved'>('clean');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});

  const [consoleStatus, setConsoleStatus] = useState('Sẵn sàng biên dịch OpenJDK 21');
  const [consoleTone, setConsoleTone] = useState<'muted' | 'amber' | 'green' | 'red'>('muted');
  const [consoleOutput, setConsoleOutput] = useState(
    'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để biên dịch & chấm bài thật.'
  );
  const [diagnostics, setDiagnostics] = useState<JavaDiagnostic[]>([]);
  const [jumpTarget, setJumpTarget] = useState<JumpTarget | null>(null);
  const [cloudTestResults, setCloudTestResults] = useState<JavaTestCaseResult[]>([]);
  const [lastTiming, setLastTiming] = useState<{
    compileMs: number;
    runMs: number;
    engineLabel: string;
  } | null>(null);

  const [diagnosisCards, setDiagnosisCards] = useState<PeDiagnosisCard[]>([]);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [chatInput, setChatInput] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  const draftTimerRef = useRef<number>(0);
  const runAbortRef = useRef<AbortController | null>(null);
  const latestDraftRef = useRef<{ peId: number; main: string; entity: string; dirty: boolean } | null>(
    null
  );

  const suggestedMinutes = useMemo(() => {
    if (!activePe) return 25;
    const m = activePe.meta.match(/(\d+)\s*phút/i);
    return m ? Number(m[1]) : 35;
  }, [activePe]);

  const [secondsLeft, setSecondsLeft] = useState(suggestedMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Sync starter/draft immediately when activePe changes to prevent 1-frame empty flash
  if (activePe && loadedPeId !== activePe.id) {
    const draft = readPeDraft(activePe.id);
    const initMain = draft ? draft.mainCode : activePe.starterCode;
    const initEntity = draft ? draft.entityCode : activePe.entityCode;
    const isModified =
      draft !== null &&
      (draft.mainCode !== activePe.starterCode || draft.entityCode !== activePe.entityCode);

    setLoadedPeId(activePe.id);
    setMainCode(initMain);
    setEntityCode(initEntity);
    setDraftState(isModified ? 'saved' : 'clean');
    setCheckedCriteria({});
    setActiveFile('main');
    setShowDiff(false);
    setDiagnostics([]);
    setJumpTarget(null);
    setCloudTestResults([]);
    setLastTiming(null);
    setConsoleStatus('Sẵn sàng biên dịch OpenJDK 21');
    setConsoleTone('muted');
    setConsoleOutput(
      'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để biên dịch & chấm bài thật.'
    );
    setRevealedHints({});
    setChatHistory([]);
    setPendingPrompt('');
    setTimerRunning(false);
    setSecondsLeft(suggestedMinutes * 60);
  }

  // Probe sandbox health on mount
  useEffect(() => {
    const controller = new AbortController();
    void checkJavaSandboxHealth(controller.signal).then((health) => {
      if (!controller.signal.aborted) {
        setSandboxHealth(health.available ? 'ready' : 'offline');
      }
    });
    return () => controller.abort();
  }, []);

  const flushLatestDraft = () => {
    window.clearTimeout(draftTimerRef.current);
    const snap = latestDraftRef.current;
    if (snap && snap.dirty) {
      savePeDraft(snap.peId, snap.main, snap.entity);
      snap.dirty = false;
    }
  };

  useEffect(() => {
    if (!activePe) return;
    runAbortRef.current?.abort();

    if (latestDraftRef.current && latestDraftRef.current.peId !== activePe.id) {
      flushLatestDraft();
    }

    const draft = readPeDraft(activePe.id);
    const initMain = draft ? draft.mainCode : activePe.starterCode;
    const initEntity = draft ? draft.entityCode : activePe.entityCode;

    if (!latestDraftRef.current || latestDraftRef.current.peId !== activePe.id) {
      latestDraftRef.current = {
        peId: activePe.id,
        main: initMain,
        entity: initEntity,
        dirty: false,
      };
    }

    const initialEval = evaluatePeCode(activePe.id, initMain, initEntity);
    setDiagnosisCards(initialEval.diagnosisCards);

    recordVisit({
      path: `/studio/${activePe.id}`,
      title: `${activePe.code}: ${activePe.title}`,
      kind: 'studio',
      updatedAt: new Date().toISOString(),
    });
  }, [activePe, recordVisit]);

  useEffect(() => {
    return () => {
      runAbortRef.current?.abort();
      flushLatestDraft();
    };
  }, []);

  const updateCodeAndScheduleDraft = (target: 'main' | 'entity', nextValue: string) => {
    if (!activePe) return;
    const nextMain = target === 'main' ? nextValue : mainCode;
    const nextEntity = target === 'entity' ? nextValue : entityCode;

    if (target === 'main') setMainCode(nextValue);
    else setEntityCode(nextValue);

    setDiagnostics([]);
    setDraftState('saving');
    latestDraftRef.current = {
      peId: activePe.id,
      main: nextMain,
      entity: nextEntity,
      dirty: true,
    };

    window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      savePeDraft(activePe.id, nextMain, nextEntity);
      if (latestDraftRef.current) latestDraftRef.current.dirty = false;
      setDraftState(
        nextMain === activePe.starterCode && nextEntity === activePe.entityCode ? 'clean' : 'saved'
      );
    }, 180);
  };

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && timerRunning) setTimerRunning(false);
  }, [secondsLeft, timerRunning]);

  const relatedSlot = useMemo(() => {
    if (!activePe || !pro192 || activePe.relatedSlots.length === 0) return null;
    return pro192.slots.find((s) => s.slot === activePe.relatedSlots[0]) || null;
  }, [activePe, pro192]);

  const mainFileName = useMemo(() => {
    if (!activePe) return 'Main.java';
    const fallback = inferJavaFileName(activePe.starterCode, 'Main.java');
    return inferJavaFileName(mainCode, fallback);
  }, [activePe, mainCode]);

  const entityFileName = useMemo(() => {
    if (!activePe) return 'Student.java';
    return inferJavaFileName(entityCode, activePe.entityFileName);
  }, [activePe, entityCode]);

  const fileTabs = useMemo(
    () => [
      { id: 'main' as const, label: mainFileName },
      { id: 'entity' as const, label: entityFileName },
    ],
    [mainFileName, entityFileName]
  );

  const activeFileName = activeFile === 'main' ? mainFileName : entityFileName;
  const activeFileDiagnostics = useMemo(
    () => diagnostics.filter((d) => d.file === activeFileName),
    [diagnostics, activeFileName]
  );

  const handleJumpToDiagnostic = (diag: JavaDiagnostic) => {
    const targetTab: 'main' | 'entity' = diag.file === entityFileName ? 'entity' : 'main';
    setActiveFile(targetTab);
    setShowDiff(false);
    setJumpTarget((prev) => ({
      line: diag.line,
      column: diag.column,
      nonce: (prev?.nonce ?? 0) + 1,
    }));
  };

  const applyStaticFallback = (
    mode: 'run' | 'grade',
    staticRes: PeEvaluationResult,
    prefixNote?: string
  ): boolean => {
    if (!activePe) return false;
    setDiagnostics([]);
    setCloudTestResults([]);
    setLastTiming(null);

    const rawOut = mode === 'run' ? staticRes.consoleRunOutput : staticRes.consoleTestOutput;
    setConsoleOutput(prefixNote ? `${prefixNote}\n\n${rawOut}` : rawOut);

    if (mode === 'run') {
      if (staticRes.allPassed) {
        setConsoleStatus('✔ Static Check đạt tiêu chí');
        setConsoleTone('green');
        return true;
      }
      setConsoleStatus('✕ Cảnh báo Runtime / Thiếu điều kiện (Static)');
      setConsoleTone('red');
      if (staticRes.detectedMistake) addMistake(staticRes.detectedMistake);
      return false;
    }

    setConsoleStatus(staticRes.statusText);
    if (staticRes.allPassed) {
      setConsoleTone('green');
      markPeStatus(activePe.id, 'pass');
      pushToast({
        title: `Chúc mừng! Đã Pass ${activePe.code}`,
        description: `${staticRes.passedCount}/${staticRes.totalCount} tiêu chí Clean Code`,
        tone: 'success',
      });
      return true;
    }

    setConsoleTone('amber');
    markPeStatus(activePe.id, 'in-progress');
    if (staticRes.detectedMistake) addMistake(staticRes.detectedMistake);
    return false;
  };

  const executeJava = async (mode: 'run' | 'grade'): Promise<boolean> => {
    if (!activePe || isExecuting) return false;
    flushLatestDraft();

    // Layer 1 (0ms): Instant Clean Code + AI Mentor analysis
    const staticRes = evaluatePeCode(activePe.id, mainCode, entityCode);
    setDiagnosisCards(staticRes.diagnosisCards);

    if (engineMode === 'static') {
      return applyStaticFallback(mode, staticRes);
    }

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    setIsExecuting(true);
    setDiagnostics([]);
    setCloudTestResults([]);
    setLastTiming(null);
    setConsoleStatus('☕ Đang biên dịch trên OpenJDK 21 Sandbox...');
    setConsoleTone('amber');
    setConsoleOutput('Đang khởi chạy Firecracker microVM OpenJDK 21 và biên dịch mã nguồn...');

    try {
      const filesToSend =
        mainFileName === entityFileName
          ? [{ name: mainFileName, content: mainCode }]
          : [
              { name: mainFileName, content: mainCode },
              { name: entityFileName, content: entityCode },
            ];

      const res = await runJavaInCloud(
        {
          mode,
          peId: activePe.id,
          files: filesToSend,
          stdin: mode === 'run' ? stdinInput : '',
        },
        controller.signal
      );

      if (controller.signal.aborted) return false;

      if (res.unavailable) {
        setSandboxHealth('offline');
        return applyStaticFallback(mode, staticRes, `⚡ ${res.unavailableReason}`);
      }

      setSandboxHealth('ready');
      setLastTiming({
        compileMs: res.compileMs,
        runMs: res.runMs,
        engineLabel: res.jdkVersion || 'OpenJDK 21',
      });

      if (res.phase === 'compile') {
        setDiagnostics(res.diagnostics);
        setCloudTestResults([]);
        setConsoleStatus(`✕ Lỗi biên dịch javac (${res.compileMs}ms)`);
        setConsoleTone('red');
        setConsoleOutput(res.stderr || res.stdout || 'Biên dịch javac thất bại.');
        if (mode === 'grade') {
          markPeStatus(activePe.id, 'in-progress');
        }
        addMistake({
          type: 'runtime',
          title: `Lỗi biên dịch javac (${activePe.code})`,
          detail:
            res.diagnostics[0]?.message || 'Kiểm tra cú pháp Java, dấu chấm phẩy và tên class.',
          peId: activePe.id,
        });
        return false;
      }

      setDiagnostics(res.diagnostics);

      if (mode === 'grade') {
        const tests = res.testResults ?? [];
        setCloudTestResults(tests);

        const passedCount = tests.filter((t) => t.passed).length;
        const totalCount = tests.length;
        const allPassed = totalCount > 0 && passedCount === totalCount && res.ok;

        const outputChunks: string[] = [];
        if (res.stdout.trim()) outputChunks.push(res.stdout.trim());
        if (res.stderr.trim()) outputChunks.push(`[stderr]\n${res.stderr.trim()}`);
        if (outputChunks.length === 0) {
          outputChunks.push(
            allPassed
              ? `Biên dịch javac (${res.compileMs}ms) & chạy JVM (${res.runMs}ms) hoàn tất.`
              : `Hoàn tất chạy kiểm thử (${passedCount}/${totalCount} đạt).`
          );
        }
        setConsoleOutput(outputChunks.join('\n\n'));

        if (res.timedOut) {
          setConsoleStatus('⏱ Quá thời gian thực thi JVM (8s)');
          setConsoleTone('red');
          markPeStatus(activePe.id, 'in-progress');
          return false;
        }

        if (allPassed) {
          setConsoleStatus(`✔ ${passedCount}/${totalCount} Test Cases PASSED! (OpenJDK 21)`);
          setConsoleTone('green');
          markPeStatus(activePe.id, 'pass');
          pushToast({
            title: `Chúc mừng! Đã Pass ${activePe.code}`,
            description: `${passedCount}/${totalCount} test cases thật trên OpenJDK 21`,
            tone: 'success',
          });
          return true;
        }

        setConsoleStatus(`${passedCount}/${totalCount || 3} Test Cases Passed (OpenJDK 21)`);
        setConsoleTone('amber');
        markPeStatus(activePe.id, 'in-progress');
        const firstFail = tests.find((t) => !t.passed);
        if (firstFail) {
          addMistake({
            type: 'runtime',
            title: `${firstFail.id} chưa đạt (${activePe.code})`,
            detail: firstFail.error || firstFail.actual || firstFail.name,
            peId: activePe.id,
          });
        } else if (staticRes.detectedMistake) {
          addMistake(staticRes.detectedMistake);
        }
        return false;
      }

      // Free / smoke run mode
      setCloudTestResults([]);
      const runText =
        [res.stdout.trim(), res.stderr.trim() ? `[stderr]\n${res.stderr.trim()}` : '']
          .filter(Boolean)
          .join('\n\n') || '(Chương trình chạy xong với đầu ra trống)';
      setConsoleOutput(runText);

      if (res.timedOut) {
        setConsoleStatus('⏱ Quá thời gian thực thi JVM (8s)');
        setConsoleTone('red');
        return false;
      }

      if (res.exitCode === 0) {
        setConsoleStatus(`✔ Biên dịch & Chạy thật thành công (${res.compileMs + res.runMs}ms)`);
        setConsoleTone('green');
        return true;
      }

      setConsoleStatus(`✕ Lỗi Runtime JVM (exit ${res.exitCode})`);
      setConsoleTone('red');
      addMistake({
        type: 'runtime',
        title: `Lỗi Runtime JVM (${activePe.code})`,
        detail: res.stderr.split(/\r?\n/)[0] || `JVM thoát với mã ${res.exitCode}`,
        peId: activePe.id,
      });
      return false;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return false;
      }
      setSandboxHealth('offline');
      return applyStaticFallback(
        mode,
        staticRes,
        '⚡ Gặp sự cố kết nối OpenJDK Sandbox — đã tự động chấm bằng Static Evaluator.'
      );
    } finally {
      if (runAbortRef.current === controller) {
        runAbortRef.current = null;
      }
      setIsExecuting(false);
    }
  };

  const handleRunCode = () => executeJava('run');
  const handleSubmitTests = () => executeJava('grade');

  const handleApplyCleanCode = () => {
    if (!activePe) return;
    setMainCode(activePe.cleanCode);
    savePeDraft(activePe.id, activePe.cleanCode, entityCode);
    setDraftState('saved');
    if (latestDraftRef.current) {
      latestDraftRef.current = {
        peId: activePe.id,
        main: activePe.cleanCode,
        entity: entityCode,
        dirty: false,
      };
    }
    setActiveFile('main');
    setShowDiff(false);
    setDiagnostics([]);
    setCloudTestResults([]);
    const res = evaluatePeCode(activePe.id, activePe.cleanCode, entityCode);
    setDiagnosisCards(res.diagnosisCards);
    setConsoleStatus('Đã áp dụng bản tối ưu ✨');
    setConsoleTone('green');
    setConsoleOutput(
      'Code đã gọn hơn! Hãy bấm "✔ Chấm Test Case PE" để xác nhận Pass trên OpenJDK 21.'
    );
    pushToast({
      title: 'Đã áp dụng Clean Code',
      description: 'Nháp của bạn đã được cập nhật tự động.',
      tone: 'success',
    });
  };

  const handleReset = () => {
    if (!activePe) return;
    runAbortRef.current?.abort();
    const prevMain = mainCode;
    const prevEntity = entityCode;
    const hadChanges = prevMain !== activePe.starterCode || prevEntity !== activePe.entityCode;

    window.clearTimeout(draftTimerRef.current);
    clearPeDraft(activePe.id);
    setMainCode(activePe.starterCode);
    setEntityCode(activePe.entityCode);
    setDraftState('clean');
    latestDraftRef.current = {
      peId: activePe.id,
      main: activePe.starterCode,
      entity: activePe.entityCode,
      dirty: false,
    };

    setActiveFile('main');
    setShowDiff(false);
    setDiagnostics([]);
    setJumpTarget(null);
    setCloudTestResults([]);
    setLastTiming(null);
    setConsoleStatus('Sẵn sàng biên dịch OpenJDK 21');
    setConsoleTone('muted');
    setConsoleOutput(
      'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để biên dịch & chấm bài thật.'
    );
    setDiagnosisCards(
      evaluatePeCode(activePe.id, activePe.starterCode, activePe.entityCode).diagnosisCards
    );

    if (hadChanges) {
      pushToast({
        title: `Đã khôi phục code gốc (${activePe.code})`,
        tone: 'info',
        undoLabel: 'Hoàn tác',
        onUndo: () => {
          setMainCode(prevMain);
          setEntityCode(prevEntity);
          savePeDraft(activePe.id, prevMain, prevEntity);
          setDraftState('saved');
        },
      });
    }
  };

  const sendAiPrompt = async (promptText: string) => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt || !activePe) return;
    setChatInput('');

    if (byokKey) {
      setPendingPrompt(cleanPrompt);
      setAiBusy(true);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(byokKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Bạn là AI Code Mentor cho môn PRO192 (Java OOP). Hãy trả lời ngắn gọn, thực tế bằng tiếng Việt cho câu hỏi "${cleanPrompt}" dựa trên đề ${activePe.code} (${activePe.title}) và code hiện tại:\n\n${mainCode}`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Không nhận được phản hồi từ Gemini API.';
          setChatHistory((prev) => [
            ...prev,
            { id: `msg-${Date.now()}`, prompt: cleanPrompt, reply },
          ]);
          setAiBusy(false);
          setPendingPrompt('');
          return;
        }
      } catch {
        // fall through to offline smart mentor
      }
      setAiBusy(false);
      setPendingPrompt('');
    }

    const fallbackReply =
      /tối ưu|ngắn|clean/i.test(cleanPrompt)
        ? `AI Mentor: Với ${activePe.code}, hãy ưu tiên kiểm tra dữ liệu biên (null / mảng rỗng) ở đầu hàm bằng Early Return, sau đó tách phần kiểm tra hoặc dùng Comparator / try-with-resources để giảm độ sâu if-else.`
        : `AI Mentor: Đoạn code ${activePe.code} tập trung vào ${activePe.meta}. Kiểm tra kỹ tiêu chí: ${activePe.checklist[0] || 'xử lý null an toàn'} và bấm "⚡ So sánh Bản Tối ưu (Diff)" để đối chiếu trực quan.`;

    setChatHistory((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, prompt: cleanPrompt, reply: fallbackReply },
    ]);
  };

  const statusColorCls =
    consoleTone === 'green'
      ? 'text-[var(--success-text)]'
      : consoleTone === 'red'
        ? 'text-[var(--danger-text)]'
        : consoleTone === 'amber'
          ? 'text-[var(--accent-text)]'
          : 'text-[var(--text-muted)]';

  const activeCode = activeFile === 'main' ? mainCode : entityCode;
  const currentLineCount = mainCode.split(/\r?\n/).length;
  const cleanLineCount = activePe ? activePe.cleanCode.split(/\r?\n/).length : 0;

  if (!activePe) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-xs text-[var(--text-muted)]">
        Đang tải dữ liệu Code Studio...
      </div>
    );
  }

  const entryMainClass = mainFileName.replace(/\.java$/, '');
  const javacCommand = `javac ${entityFileName} ${mainFileName} && java ${entryMainClass}`;

  const engineBadgeLabel =
    engineMode === 'static'
      ? '⚡ Static Pattern Evaluator'
      : sandboxHealth === 'ready'
        ? '☕ OpenJDK 21 Sandbox'
        : sandboxHealth === 'checking'
          ? '☕ Đang kiểm tra Sandbox'
          : '⚡ Static Pattern Evaluator (Fallback)';

  return (
    <div className="flex flex-1 flex-col">
      {/* Studio Sub-toolbar */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/pe"
              className="inline-flex min-h-[36px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← Kho đề PE
            </Link>

            <select
              aria-label="Chọn đề PE trong Code Studio"
              value={activePe.id}
              onChange={(e) => {
                flushLatestDraft();
                navigate(`/studio/${e.target.value}`);
              }}
              className="min-h-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-bold text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>

            <div className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono tabular-nums">
              <Timer className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span
                className={
                  secondsLeft === 0
                    ? 'text-[var(--danger-text)]'
                    : secondsLeft <= 300
                      ? 'text-[var(--accent-text)]'
                      : 'text-[var(--text-primary)]'
                }
              >
                {formatClock(secondsLeft)}
              </span>
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                aria-label={timerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu bấm giờ'}
                className="ml-1 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(suggestedMinutes * 60);
                }}
                aria-label="Đặt lại đồng hồ"
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              role="status"
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-muted)]"
            >
              {draftState === 'saving'
                ? 'Đang lưu nháp...'
                : draftState === 'saved'
                  ? '✓ Đã lưu nháp'
                  : 'Code gốc'}
            </span>

            <MorphActionButton
              label="▶ Run Code"
              variant="secondary"
              disabled={isExecuting}
              onClick={handleRunCode}
            />
            <MorphActionButton
              label="✔ Chấm Test Case PE"
              variant="primary"
              disabled={isExecuting}
              onClick={handleSubmitTests}
            />
            <button
              type="button"
              onClick={() => setShowAiPane((s) => !s)}
              className="min-h-[36px] rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3 py-1.5 font-medium text-[var(--info-text)] transition-colors hover:opacity-90"
            >
              ✨ AI Review &amp; Tối ưu
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Khôi phục code gốc (Starter Code)"
              className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ↺ Khôi phục gốc
            </button>
          </div>
        </div>
      </div>

      {/* 3-Pane Studio Workspace */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left Pane: Problem & Theory */}
        <aside className="space-y-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 text-xs lg:col-span-3 lg:border-b-0 lg:border-r">
          <SlidingPillTabs
            options={LEFT_TAB_OPTIONS}
            value={leftTab}
            onChange={setLeftTab}
            ariaLabel="Chuyển đề bài PE hoặc lý thuyết nhanh"
            tone="neutral"
          />

          {leftTab === 'spec' ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Yêu cầu bài toán:
              </div>
              <p className="leading-relaxed text-[var(--text-muted)]">{activePe.desc}</p>

              <div className="space-y-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3">
                <div className="font-semibold text-[var(--text-primary)]">Checklist tiêu chí:</div>
                <div className="space-y-1.5">
                  {activePe.checklist.map((criterion) => {
                    const checked = Boolean(checkedCriteria[criterion]);
                    return (
                      <LucianChecklistItem
                        key={criterion}
                        checked={checked}
                        strikethrough
                        ariaLabel={`Đánh dấu tiêu chí: ${criterion}`}
                        onToggle={() =>
                          setCheckedCriteria((prev) => ({
                            ...prev,
                            [criterion]: !prev[criterion],
                          }))
                        }
                        label={<span className="leading-snug">{criterion}</span>}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3 font-mono text-[var(--text-muted)]">
                <div className="mb-1 text-[var(--text-dim)]">Thông tin đề:</div>
                <div>{activePe.meta}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 leading-relaxed text-[var(--text-muted)]">
              <div className="font-semibold text-[var(--accent-text)]">
                Mẹo làm nhanh {activePe.code}:
              </div>
              <p>
                1. Luôn kiểm tra dữ liệu biên (<code className="text-[var(--accent-text)]">null</code>, chuỗi rỗng, giới hạn mảng) ngay dòng đầu tiên của hàm.
              </p>
              <p>
                2. Chú ý annotation <code className="text-[var(--accent-text)]">@Override</code>, đóng luồng bằng <code className="text-[var(--accent-text)]">try-with-resources</code> và định dạng <code className="text-[var(--accent-text)]">toString()</code> chính xác từng ký tự.
              </p>
              {relatedSlot ? (
                <Link
                  to={`/pro192/${stageFileToSlug(relatedSlot.file)}?slot=${relatedSlot.slot}`}
                  className="inline-block text-[var(--info)] underline"
                >
                  Mở đầy đủ Slot {relatedSlot.slot} →
                </Link>
              ) : (
                <Link to="/pro192" className="inline-block text-[var(--info)] underline">
                  Mở giáo trình PRO192 →
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* Center Pane: CodeMirror 6 Editor / Diff View + Bottom Console */}
        <div
          className={[
            'flex flex-col border-b border-[var(--border-default)] bg-[var(--bg-code)] lg:border-b-0',
            showAiPane ? 'lg:col-span-6 lg:border-r' : 'lg:col-span-9',
          ].join(' ')}
        >
          {/* File Tabs & Diff Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-xs">
            <SlidingPillTabs
              options={fileTabs}
              value={activeFile}
              onChange={setActiveFile}
              ariaLabel="Chọn tệp mã nguồn Java"
              tone="neutral"
              className="font-mono"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden font-mono text-xs text-[var(--text-dim)] sm:inline">
                Ctrl+Enter để chạy
              </span>
              <button
                type="button"
                onClick={() => setShowDiff((d) => !d)}
                className="min-h-[36px] rounded-md border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent-text)] hover:opacity-90"
              >
                ⚡ {showDiff ? 'Quay lại Code Editor' : 'So sánh Bản Tối ưu (Diff)'}
              </button>
            </div>
          </div>

          {!showDiff ? (
            <JavaCodeEditor
              value={activeCode}
              onChange={(val) => updateCodeAndScheduleDraft(activeFile, val)}
              onBlur={flushLatestDraft}
              onRunShortcut={() => void handleRunCode()}
              theme={theme}
              diagnostics={activeFileDiagnostics}
              jumpTarget={jumpTarget}
            />
          ) : (
            <div className="grid min-h-[290px] flex-1 grid-cols-1 gap-3 overflow-auto p-4 text-xs md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--bg-surface)] p-3">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
                  <span className="font-semibold text-[var(--danger-text)]">
                    Code hiện tại
                  </span>
                  <span className="font-mono tabular-nums text-[var(--text-dim)]">
                    {currentLineCount} dòng
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[var(--text-secondary)]">
                  {mainCode}
                </pre>
              </div>

              <div className="flex flex-col justify-between space-y-2 rounded-lg border border-[var(--success)]/50 bg-[var(--bg-surface)] p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
                    <span className="font-semibold text-[var(--success-text)]">
                      Gợi ý Clean Code (Tối ưu)
                    </span>
                    <span className="font-mono tabular-nums text-[var(--text-dim)]">
                      {cleanLineCount} dòng
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[var(--text-primary)]">
                    {activePe.cleanCode}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={handleApplyCleanCode}
                  className="min-h-[38px] w-full rounded-lg bg-[var(--success)] py-2 font-bold text-[#1C1917] transition-opacity hover:opacity-90"
                >
                  ✔ Áp dụng đoạn code tối ưu này
                </button>
              </div>
            </div>
          )}

          {/* Bottom Console + Engine Switcher + Diagnostics + Test Results */}
          <div className="space-y-2.5 border-t border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)]">
                  Console &amp; Kết quả Test PE
                </span>
                <span
                  title="Hybrid 2 lớp: biên dịch thật trên OpenJDK 21 Sandbox kết hợp Static Pattern Evaluator cho Clean Code."
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)]"
                >
                  {engineBadgeLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SlidingPillTabs
                  options={ENGINE_MODE_OPTIONS}
                  value={engineMode}
                  onChange={setEngineMode}
                  ariaLabel="Chọn chế độ biên dịch"
                  tone="neutral"
                />
                <CopyCodeButton
                  code={javacCommand}
                  label="Copy lệnh javac"
                  copiedLabel="Đã chép"
                  ariaLabel="Sao chép lệnh biên dịch javac local"
                  onCopied={() =>
                    pushToast({
                      title: 'Đã chép lệnh javac local',
                      description: javacCommand,
                      tone: 'success',
                    })
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`font-mono font-medium ${statusColorCls}`}>{consoleStatus}</span>
              <div className="flex flex-wrap items-center gap-2">
                {lastTiming && (
                  <span className="font-mono text-xs text-[var(--text-dim)]">
                    {lastTiming.engineLabel} · javac {lastTiming.compileMs}ms · jvm {lastTiming.runMs}ms
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowStdin((s) => !s)}
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showStdin ? 'Ẩn stdin' : '+ Nhập stdin'}
                </button>
              </div>
            </div>

            {showStdin && (
              <div className="space-y-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2.5">
                <label htmlFor="studio-stdin-box" className="block font-medium text-[var(--text-secondary)]">
                  Dữ liệu đầu vào chuẩn (stdin) cho hàm <code className="font-mono">main()</code> tự viết:
                </label>
                <textarea
                  id="studio-stdin-box"
                  rows={2}
                  value={stdinInput}
                  onChange={(e) => setStdinInput(e.target.value)}
                  placeholder="Ví dụ: An&#10;8.5"
                  className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-code)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            )}

            {/* Clickable javac compiler diagnostics */}
            {diagnostics.length > 0 && (
              <div
                aria-label="Danh sách lỗi biên dịch javac"
                className="space-y-1.5 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-2.5"
              >
                <div className="font-semibold text-[var(--danger-text)]">
                  Lỗi biên dịch javac ({diagnostics.length}) — bấm để nhảy tới dòng:
                </div>
                <div className="space-y-1">
                  {diagnostics.map((diag, idx) => (
                    <button
                      key={`${diag.file}-${diag.line}-${idx}`}
                      type="button"
                      onClick={() => handleJumpToDiagnostic(diag)}
                      className="flex w-full items-start gap-2 rounded px-2 py-1 text-left font-mono text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/70"
                    >
                      <span className="shrink-0 font-semibold text-[var(--danger-text)]">
                        {diag.file}:{diag.line}:{diag.column}
                      </span>
                      <span className="break-words text-[var(--text-secondary)]">{diag.message}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Structured OpenJDK test case results */}
            {cloudTestResults.length > 0 && (
              <div
                aria-label="Kết quả từng Test Case OpenJDK 21"
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                {cloudTestResults.map((tc) => (
                  <div
                    key={tc.id}
                    className={[
                      'space-y-1 rounded-lg border p-2.5',
                      tc.passed
                        ? 'border-[var(--success)]/40 bg-[var(--success-soft)]'
                        : 'border-[var(--danger)]/40 bg-[var(--danger-soft)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between font-mono font-semibold">
                      <span className={tc.passed ? 'text-[var(--success-text)]' : 'text-[var(--danger-text)]'}>
                        {tc.passed ? '✔' : '✕'} {tc.id}
                      </span>
                      <span className="text-[var(--text-dim)]">{tc.durationMs}ms</span>
                    </div>
                    <div className="font-medium text-[var(--text-primary)]">{tc.name}</div>
                    {!tc.passed && (
                      <div className="space-y-0.5 font-mono text-xs text-[var(--text-muted)]">
                        {tc.expected && <div>Kỳ vọng: {tc.expected}</div>}
                        {tc.actual && <div>Thực tế: {tc.actual}</div>}
                        {tc.error && <div className="text-[var(--danger-text)]">{tc.error}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <pre className="min-h-[72px] whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3 font-mono text-xs text-[var(--text-muted)]">
              {consoleOutput}
            </pre>

            <p className="text-xs text-[var(--text-dim)]">
              Hybrid 2 lớp: biên dịch &amp; chấm Test Case thật trên <strong>OpenJDK 21 Sandbox</strong> + phân tích Clean Code tức thì bởi <strong>Static Pattern Evaluator</strong>. Lệnh máy local: <code className="text-[var(--text-muted)]">{javacCommand}</code>
            </p>
          </div>
        </div>

        {/* Right Pane: AI Code Mentor (#086 Streaming Answer) */}
        {showAiPane && (
          <aside className="flex flex-col justify-between gap-3 bg-[var(--bg-surface)] p-4 text-xs lg:col-span-3">
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                <span className="flex items-center gap-1.5 font-bold text-[var(--info-text)]">
                  ✨ AI Code Mentor
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiPane(false)}
                  aria-label="Ẩn AI Code Mentor"
                  className="rounded border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {diagnosisCards.map((card) => {
                  const toneClasses =
                    card.tone === 'sky'
                      ? 'border-[var(--info)]/35 bg-[var(--info-soft)]'
                      : card.tone === 'green'
                        ? 'border-[var(--success)]/35 bg-[var(--success-soft)]'
                        : 'border-[var(--warning)]/35 bg-[var(--warning-soft)]';
                  const headingColor =
                    card.tone === 'sky'
                      ? 'text-[var(--info-text)]'
                      : card.tone === 'green'
                        ? 'text-[var(--success-text)]'
                        : 'text-[var(--accent-text)]';
                  const hintOpen = Boolean(revealedHints[card.id]);

                  return (
                    <div
                      key={card.id}
                      className={`space-y-2 rounded-xl border p-3 ${toneClasses}`}
                    >
                      <div className={`font-semibold ${headingColor}`}>{card.title}</div>
                      <p className="leading-relaxed text-[var(--text-secondary)]">
                        {card.description}
                      </p>

                      {card.tone === 'sky' && card.hintCode && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedHints((prev) => ({
                                ...prev,
                                [card.id]: !prev[card.id],
                              }))
                            }
                            className="min-h-[34px] w-full rounded-lg border border-[var(--info)]/40 bg-[var(--bg-canvas)] py-1.5 font-medium text-[var(--info-text)]"
                          >
                            {hintOpen ? 'Ẩn gợi ý (Lớp 2)' : 'Xem gợi ý cách sửa (Lớp 2)'}
                          </button>
                          {hintOpen && (
                            <pre className="whitespace-pre-wrap rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2 font-mono text-xs text-[var(--text-primary)]">
                              {card.hintCode}
                            </pre>
                          )}
                        </>
                      )}

                      {card.tone === 'amber' && (
                        <button
                          type="button"
                          onClick={() => setShowDiff(true)}
                          className="min-h-[34px] w-full rounded-lg bg-[var(--accent)] py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                        >
                          So sánh Trước / Sau (Diff)
                        </button>
                      )}
                    </div>
                  );
                })}

                {chatHistory.map((msg) => (
                  <StreamingAiBubble key={msg.id} prompt={msg.prompt} reply={msg.reply} />
                ))}

                {aiBusy && pendingPrompt && (
                  <StreamingAiBubble prompt={pendingPrompt} thinking />
                )}
              </div>
            </div>

            {/* Ask AI Input */}
            <div className="space-y-2 border-t border-[var(--border-default)] pt-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => void sendAiPrompt('Giải thích đoạn code này giúp em')}
                  className="min-h-[32px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Giải thích code
                </button>
                <button
                  type="button"
                  onClick={() => void sendAiPrompt('Làm sao tối ưu ngắn hơn nữa?')}
                  className="min-h-[32px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cách tối ưu?
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendAiPrompt(chatInput);
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi AI về code của bạn..."
                  className="min-h-[36px] flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={aiBusy}
                  className="min-h-[36px] rounded-lg bg-[var(--info)] px-3 py-1.5 font-bold text-[#1C1917] disabled:opacity-50"
                >
                  {aiBusy ? '...' : 'Gửi'}
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
