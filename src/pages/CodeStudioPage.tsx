import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FilePlus2, Pause, Play, RotateCcw, Timer, Trash2 } from 'lucide-react';
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
import { hasMainMethod, inferJavaFileName } from '../utils/javaFiles';
import {
  MAX_PLAYGROUND_FILES,
  PLAYGROUND_TEMPLATES,
  clearPlaygroundWorkspace,
  cloneTemplateFiles,
  readPlaygroundWorkspace,
  savePlaygroundWorkspace,
  validateNewJavaFileName,
  type PlaygroundFile,
  type PlaygroundWorkspaceState,
} from '../utils/javaPlayground';
import { evaluatePeCode, type PeDiagnosisCard, type PeEvaluationResult } from '../utils/peEvaluator';
import { clearPeDraft, readPeDraft, savePeDraft } from '../utils/studioDrafts';
import { stageFileToSlug } from '../utils/text';

interface ChatMessage {
  id: string;
  prompt: string;
  reply: string;
}

interface CodeStudioPageProps {
  isPlayground?: boolean;
}

interface PlaygroundRouteState {
  playgroundImport?: PlaygroundWorkspaceState;
  note?: string;
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

export function CodeStudioPage({ isPlayground = false }: CodeStudioPageProps) {
  const { peId } = useParams<{ peId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { pro192, theme, byokKey, markPeStatus, addMistake, recordVisit, pushToast } = useApp();

  const playgroundMode = isPlayground || peId === 'playground';
  const challenges = useMemo(() => pro192?.peChallenges ?? [], [pro192]);
  const numericId = Number(peId) || 1;
  const activePe = useMemo(
    () =>
      playgroundMode
        ? null
        : challenges.find((c) => c.id === numericId) || challenges[0] || null,
    [playgroundMode, challenges, numericId]
  );

  const [leftTab, setLeftTab] = useState<'spec' | 'theory'>('spec');
  const [activeFile, setActiveFile] = useState<'main' | 'entity'>('main');
  const [showAiPane, setShowAiPane] = useState(true);
  const [showDiff, setShowDiff] = useState(false);

  const [engineMode, setEngineMode] = useState<'cloud' | 'static'>('cloud');
  const [sandboxHealth, setSandboxHealth] = useState<'checking' | 'ready' | 'offline'>('checking');
  const [isExecuting, setIsExecuting] = useState(false);

  const initialPg = useMemo<PlaygroundWorkspaceState>(() => {
    const routeState = location.state as PlaygroundRouteState | null;
    if (routeState?.playgroundImport?.files?.length) {
      return routeState.playgroundImport;
    }
    const saved = readPlaygroundWorkspace();
    if (saved) return saved;
    const starter = cloneTemplateFiles(PLAYGROUND_TEMPLATES[0].id);
    return {
      files: starter.files,
      activeFileId: starter.files[0].id,
      stdin: starter.template.stdin,
    };
    // Intentionally evaluated once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showStdin, setShowStdin] = useState(() => playgroundMode && initialPg.stdin.length > 0);
  const [stdinInput, setStdinInput] = useState(() => (playgroundMode ? initialPg.stdin : ''));

  // PE Mode state
  const [loadedPeId, setLoadedPeId] = useState<number | null>(null);
  const [mainCode, setMainCode] = useState('');
  const [entityCode, setEntityCode] = useState('');
  const [draftState, setDraftState] = useState<'clean' | 'saving' | 'saved'>('clean');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});

  // Free Playground Mode state
  const [playgroundFiles, setPlaygroundFiles] = useState<PlaygroundFile[]>(initialPg.files);
  const [pgActiveFileId, setPgActiveFileId] = useState<string>(initialPg.activeFileId);
  const [pgSourceLabel, setPgSourceLabel] = useState<string | undefined>(initialPg.sourceLabel);
  const [pgImportBanner, setPgImportBanner] = useState<string | null>(() => {
    const routeState = location.state as PlaygroundRouteState | null;
    return routeState?.note || null;
  });
  const [pgDraftState, setPgDraftState] = useState<'clean' | 'saving' | 'saved'>(() =>
    readPlaygroundWorkspace() ? 'saved' : 'clean'
  );
  const [newFileInputVisible, setNewFileInputVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileError, setNewFileError] = useState<string | null>(null);

  const [consoleStatus, setConsoleStatus] = useState('Sẵn sàng biên dịch OpenJDK 21');
  const [consoleTone, setConsoleTone] = useState<'muted' | 'amber' | 'green' | 'red'>('muted');
  const [consoleOutput, setConsoleOutput] = useState(
    'Nhấn "▶ Run Code" để biên dịch & chạy thử bằng OpenJDK 21.'
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
  const pgDraftTimerRef = useRef<number>(0);
  const runAbortRef = useRef<AbortController | null>(null);
  const appliedImportKeyRef = useRef<string | null>(null);
  const latestDraftRef = useRef<{ peId: number; main: string; entity: string; dirty: boolean } | null>(
    null
  );
  const latestPgRef = useRef<{
    state: PlaygroundWorkspaceState;
    dirty: boolean;
  }>({
    state: initialPg,
    dirty: false,
  });

  const suggestedMinutes = useMemo(() => {
    if (!activePe) return 25;
    const m = activePe.meta.match(/(\d+)\s*phút/i);
    return m ? Number(m[1]) : 35;
  }, [activePe]);

  const [secondsLeft, setSecondsLeft] = useState(suggestedMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Sync starter/draft immediately when switching PE challenge
  if (!playgroundMode && activePe && loadedPeId !== activePe.id) {
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

  // Handle incoming code from "Chạy thử" in lesson/docs pages
  useEffect(() => {
    if (!playgroundMode) return;
    const routeState = location.state as PlaygroundRouteState | null;
    if (!routeState?.playgroundImport?.files?.length) return;
    if (appliedImportKeyRef.current === location.key) return;

    appliedImportKeyRef.current = location.key;
    const incoming = routeState.playgroundImport;
    window.clearTimeout(pgDraftTimerRef.current);
    setPlaygroundFiles(incoming.files);
    setPgActiveFileId(incoming.activeFileId || incoming.files[0].id);
    setStdinInput(incoming.stdin || '');
    setShowStdin(Boolean(incoming.stdin));
    setPgSourceLabel(incoming.sourceLabel);
    setPgImportBanner(routeState.note || 'Đã nạp đoạn mã từ bài học vào Java Playground.');
    setPgDraftState('saved');
    latestPgRef.current = { state: incoming, dirty: false };
    savePlaygroundWorkspace(incoming);

    setShowDiff(false);
    setDiagnostics([]);
    setJumpTarget(null);
    setCloudTestResults([]);
    setLastTiming(null);
    setConsoleStatus('Đã nạp đoạn mã — sẵn sàng chạy thử OpenJDK 21');
    setConsoleTone('muted');
    setConsoleOutput('Nhấn "▶ Run Code" (hoặc Ctrl+Enter) để biên dịch & chạy ngay đoạn mã này.');
  }, [playgroundMode, location.key, location.state]);

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

  const flushPlaygroundDraft = () => {
    window.clearTimeout(pgDraftTimerRef.current);
    if (latestPgRef.current.dirty) {
      savePlaygroundWorkspace(latestPgRef.current.state);
      latestPgRef.current.dirty = false;
    }
  };

  useEffect(() => {
    if (playgroundMode) {
      runAbortRef.current?.abort();
      setShowDiff(false);
      setDiagnostics([]);
      setCloudTestResults([]);
      setLastTiming(null);
      setConsoleStatus('Java Playground · Sẵn sàng chạy OpenJDK 21');
      setConsoleTone('muted');
      setConsoleOutput('Tạo hoặc chỉnh sửa tối đa 5 tệp .java rồi nhấn "▶ Run Code" để chạy thật.');
      recordVisit({
        path: '/studio/playground',
        title: 'Java Playground (Tự do)',
        kind: 'studio',
        updatedAt: new Date().toISOString(),
      });
      return;
    }

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
  }, [playgroundMode, activePe, recordVisit]);

  useEffect(() => {
    return () => {
      runAbortRef.current?.abort();
      flushLatestDraft();
      flushPlaygroundDraft();
    };
  }, []);

  const schedulePlaygroundSave = (nextState: PlaygroundWorkspaceState, immediate = false) => {
    latestPgRef.current = { state: nextState, dirty: !immediate };
    window.clearTimeout(pgDraftTimerRef.current);
    if (immediate) {
      savePlaygroundWorkspace(nextState);
      setPgDraftState('saved');
      return;
    }
    setPgDraftState('saving');
    pgDraftTimerRef.current = window.setTimeout(() => {
      savePlaygroundWorkspace(nextState);
      latestPgRef.current.dirty = false;
      setPgDraftState('saved');
    }, 180);
  };

  const updatePlaygroundCode = (fileId: string, nextContent: string) => {
    const nextFiles = playgroundFiles.map((f) =>
      f.id === fileId ? { ...f, content: nextContent } : f
    );
    setPlaygroundFiles(nextFiles);
    setDiagnostics([]);
    schedulePlaygroundSave({
      files: nextFiles,
      activeFileId: fileId,
      stdin: stdinInput,
      sourceLabel: pgSourceLabel,
    });
  };

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
    if (!timerRunning || playgroundMode) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, playgroundMode]);

  useEffect(() => {
    if (secondsLeft === 0 && timerRunning) setTimerRunning(false);
  }, [secondsLeft, timerRunning]);

  const relatedSlot = useMemo(() => {
    if (!activePe || !pro192 || activePe.relatedSlots.length === 0) return null;
    return pro192.slots.find((s) => s.slot === activePe.relatedSlots[0]) || null;
  }, [activePe, pro192]);

  // PE File Names
  const mainFileName = useMemo(() => {
    if (!activePe) return 'Main.java';
    const fallback = inferJavaFileName(activePe.starterCode, 'Main.java');
    return inferJavaFileName(mainCode, fallback);
  }, [activePe, mainCode]);

  const entityFileName = useMemo(() => {
    if (!activePe) return 'Student.java';
    return inferJavaFileName(entityCode, activePe.entityFileName);
  }, [activePe, entityCode]);

  const peFileTabs = useMemo(
    () => [
      { id: 'main' as const, label: mainFileName },
      { id: 'entity' as const, label: entityFileName },
    ],
    [mainFileName, entityFileName]
  );

  // Playground Effective File Names (sync with edited public class declaration cleanly)
  const playgroundEffectiveFiles = useMemo(() => {
    const used = new Set<string>();
    return playgroundFiles.map((f) => {
      const inferred = inferJavaFileName(f.content, f.name);
      const effective = used.has(inferred.toLowerCase()) ? f.name : inferred;
      used.add(effective.toLowerCase());
      return { id: f.id, name: effective, content: f.content };
    });
  }, [playgroundFiles]);

  const playgroundTabs = useMemo(
    () => playgroundEffectiveFiles.map((f) => ({ id: f.id, label: f.name })),
    [playgroundEffectiveFiles]
  );

  const activePgFile = useMemo(
    () =>
      playgroundEffectiveFiles.find((f) => f.id === pgActiveFileId) || playgroundEffectiveFiles[0],
    [playgroundEffectiveFiles, pgActiveFileId]
  );

  const activeCode = playgroundMode
    ? activePgFile?.content ?? ''
    : activeFile === 'main'
      ? mainCode
      : entityCode;

  const activeFileName = playgroundMode
    ? activePgFile?.name ?? 'Main.java'
    : activeFile === 'main'
      ? mainFileName
      : entityFileName;

  const activeFileDiagnostics = useMemo(
    () => diagnostics.filter((d) => d.file === activeFileName),
    [diagnostics, activeFileName]
  );

  const handleJumpToDiagnostic = (diag: JavaDiagnostic) => {
    if (playgroundMode) {
      const targetFile = playgroundEffectiveFiles.find((f) => f.name === diag.file);
      if (targetFile) {
        setPgActiveFileId(targetFile.id);
      }
      setJumpTarget((prev) => ({
        line: diag.line,
        column: diag.column,
        nonce: (prev?.nonce ?? 0) + 1,
      }));
      return;
    }
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

  const runPlaygroundCloud = async (): Promise<boolean> => {
    if (isExecuting) return false;
    flushPlaygroundDraft();

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    setIsExecuting(true);
    setDiagnostics([]);
    setCloudTestResults([]);
    setLastTiming(null);
    setConsoleStatus('☕ Đang biên dịch & chạy trên OpenJDK 21 Sandbox...');
    setConsoleTone('amber');
    setConsoleOutput('Đang khởi chạy Firecracker microVM OpenJDK 21...');

    try {
      const res = await runJavaInCloud(
        {
          mode: 'run',
          files: playgroundEffectiveFiles.map(({ name, content }) => ({ name, content })),
          stdin: stdinInput,
        },
        controller.signal
      );

      if (controller.signal.aborted) return false;

      if (res.unavailable) {
        setSandboxHealth('offline');
        setConsoleStatus('⚡ OpenJDK Sandbox chưa khả dụng Offline');
        setConsoleTone('amber');
        setConsoleOutput(
          `${res.unavailableReason || 'Không kết nối được tới OpenJDK 21 Sandbox.'}\n\nMẹo: Bấm "Copy lệnh javac" bên trên để chạy trực tiếp bộ ${playgroundEffectiveFiles.length} tệp này trên NetBeans / Terminal máy bạn.`
        );
        return false;
      }

      setSandboxHealth('ready');
      setLastTiming({
        compileMs: res.compileMs,
        runMs: res.runMs,
        engineLabel: res.jdkVersion || 'OpenJDK 21',
      });

      if (res.phase === 'compile') {
        setDiagnostics(res.diagnostics);
        setConsoleStatus(`✕ Lỗi biên dịch javac (${res.compileMs}ms)`);
        setConsoleTone('red');
        setConsoleOutput(res.stderr || res.stdout || 'Biên dịch javac thất bại.');
        return false;
      }

      setDiagnostics(res.diagnostics);
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
      return false;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return false;
      }
      setSandboxHealth('offline');
      setConsoleStatus('⚡ Không kết nối được OpenJDK 21 Sandbox');
      setConsoleTone('amber');
      setConsoleOutput('Mất kết nối tới Sandbox — hãy thử lại hoặc dùng nút Copy lệnh javac.');
      return false;
    } finally {
      if (runAbortRef.current === controller) {
        runAbortRef.current = null;
      }
      setIsExecuting(false);
    }
  };

  const executeJava = async (mode: 'run' | 'grade'): Promise<boolean> => {
    if (playgroundMode) {
      return runPlaygroundCloud();
    }
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

  const handleAddPlaygroundFile = () => {
    const res = validateNewJavaFileName(
      newFileName,
      playgroundEffectiveFiles.map((f) => f.name)
    );
    if (!res.ok) {
      setNewFileError(res.error);
      return;
    }
    const className = res.fileName.replace(/\.java$/, '');
    const added: PlaygroundFile = {
      id: `pg-file-${Date.now()}`,
      name: res.fileName,
      content: `public class ${className} {\n    public String greet() {\n        return "Hello from ${className}";\n    }\n}\n`,
    };
    const nextFiles = [...playgroundFiles, added];
    setPlaygroundFiles(nextFiles);
    setPgActiveFileId(added.id);
    setNewFileName('');
    setNewFileError(null);
    setNewFileInputVisible(false);
    setDiagnostics([]);
    schedulePlaygroundSave(
      {
        files: nextFiles,
        activeFileId: added.id,
        stdin: stdinInput,
        sourceLabel: pgSourceLabel,
      },
      true
    );
    pushToast({ title: `Đã thêm tệp ${res.fileName}`, tone: 'success' });
  };

  const handleDeleteActivePlaygroundFile = () => {
    if (!activePgFile || playgroundFiles.length <= 1) return;
    const prevFiles = playgroundFiles;
    const prevActive = pgActiveFileId;
    const removedName = activePgFile.name;
    const nextFiles = playgroundFiles.filter((f) => f.id !== activePgFile.id);
    const nextActiveId = nextFiles[0].id;

    setPlaygroundFiles(nextFiles);
    setPgActiveFileId(nextActiveId);
    setDiagnostics([]);
    schedulePlaygroundSave(
      {
        files: nextFiles,
        activeFileId: nextActiveId,
        stdin: stdinInput,
        sourceLabel: pgSourceLabel,
      },
      true
    );

    pushToast({
      title: `Đã xóa tệp ${removedName}`,
      tone: 'info',
      undoLabel: 'Hoàn tác',
      onUndo: () => {
        setPlaygroundFiles(prevFiles);
        setPgActiveFileId(prevActive);
        schedulePlaygroundSave(
          {
            files: prevFiles,
            activeFileId: prevActive,
            stdin: stdinInput,
            sourceLabel: pgSourceLabel,
          },
          true
        );
      },
    });
  };

  const handleSelectPlaygroundTemplate = (templateId: string) => {
    const prevState: PlaygroundWorkspaceState = {
      files: playgroundFiles,
      activeFileId: pgActiveFileId,
      stdin: stdinInput,
      sourceLabel: pgSourceLabel,
    };
    const { template, files } = cloneTemplateFiles(templateId);
    setPlaygroundFiles(files);
    setPgActiveFileId(files[0].id);
    setStdinInput(template.stdin);
    setShowStdin(template.stdin.length > 0);
    setPgSourceLabel(undefined);
    setPgImportBanner(null);
    setDiagnostics([]);
    setLastTiming(null);
    setConsoleStatus(`Đã nạp mẫu "${template.title}"`);
    setConsoleTone('muted');
    setConsoleOutput('Nhấn "▶ Run Code" để biên dịch và chạy mẫu này trên OpenJDK 21.');
    schedulePlaygroundSave(
      {
        files,
        activeFileId: files[0].id,
        stdin: template.stdin,
      },
      true
    );

    pushToast({
      title: `Đã chuyển sang mẫu: ${template.title}`,
      tone: 'info',
      undoLabel: 'Hoàn tác',
      onUndo: () => {
        setPlaygroundFiles(prevState.files);
        setPgActiveFileId(prevState.activeFileId);
        setStdinInput(prevState.stdin);
        setShowStdin(prevState.stdin.length > 0);
        setPgSourceLabel(prevState.sourceLabel);
        schedulePlaygroundSave(prevState, true);
      },
    });
  };

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
    runAbortRef.current?.abort();

    if (playgroundMode) {
      const prevState: PlaygroundWorkspaceState = {
        files: playgroundFiles,
        activeFileId: pgActiveFileId,
        stdin: stdinInput,
        sourceLabel: pgSourceLabel,
      };
      const { template, files } = cloneTemplateFiles(PLAYGROUND_TEMPLATES[0].id);
      window.clearTimeout(pgDraftTimerRef.current);
      clearPlaygroundWorkspace();
      setPlaygroundFiles(files);
      setPgActiveFileId(files[0].id);
      setStdinInput(template.stdin);
      setShowStdin(template.stdin.length > 0);
      setPgSourceLabel(undefined);
      setPgImportBanner(null);
      setPgDraftState('clean');
      latestPgRef.current = {
        state: { files, activeFileId: files[0].id, stdin: template.stdin },
        dirty: false,
      };
      setDiagnostics([]);
      setJumpTarget(null);
      setLastTiming(null);
      setConsoleStatus('Java Playground · Đã khôi phục mẫu mặc định');
      setConsoleTone('muted');
      setConsoleOutput('Nhấn "▶ Run Code" để chạy mẫu Cơ bản (Hello + Scanner stdin).');
      pushToast({
        title: 'Đã khôi phục Playground mặc định',
        tone: 'info',
        undoLabel: 'Hoàn tác',
        onUndo: () => {
          setPlaygroundFiles(prevState.files);
          setPgActiveFileId(prevState.activeFileId);
          setStdinInput(prevState.stdin);
          setShowStdin(prevState.stdin.length > 0);
          setPgSourceLabel(prevState.sourceLabel);
          schedulePlaygroundSave(prevState, true);
        },
      });
      return;
    }

    if (!activePe) return;
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
    if (!cleanPrompt) return;
    if (!playgroundMode && !activePe) return;
    setChatInput('');

    const contextTitle = playgroundMode
      ? `Java Playground (${activeFileName})`
      : `${activePe!.code} (${activePe!.title})`;

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
                      text: `Bạn là AI Code Mentor cho môn Java OOP (PRO192). Hãy trả lời ngắn gọn, thực tế bằng tiếng Việt cho câu hỏi "${cleanPrompt}" dựa trên ngữ cảnh ${contextTitle} và mã nguồn hiện tại:\n\n${activeCode}`,
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

    const fallbackReply = playgroundMode
      ? /tối ưu|ngắn|clean/i.test(cleanPrompt)
        ? `AI Mentor (Playground): Trong ${activeFileName}, hãy đặt tên tệp trùng chính xác với \`public class\`, đóng Scanner/BufferedReader cẩn thận và kiểm tra tham số null ở đầu phương thức.`
        : `AI Mentor (Playground): Tệp ${activeFileName} đang chạy trên OpenJDK 21. Nếu chương trình đọc bàn phím (\`Scanner\`), hãy mở mục "+ Nhập stdin" bên dưới Console để truyền dữ liệu đầu vào.`
      : /tối ưu|ngắn|clean/i.test(cleanPrompt)
        ? `AI Mentor: Với ${activePe!.code}, hãy ưu tiên kiểm tra dữ liệu biên (null / mảng rỗng) ở đầu hàm bằng Early Return, sau đó tách phần kiểm tra hoặc dùng Comparator / try-with-resources để giảm độ sâu if-else.`
        : `AI Mentor: Đoạn code ${activePe!.code} tập trung vào ${activePe!.meta}. Kiểm tra kỹ tiêu chí: ${activePe!.checklist[0] || 'xử lý null an toàn'} và bấm "⚡ So sánh Bản Tối ưu (Diff)" để đối chiếu trực quan.`;

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

  const pgEntryClass = useMemo(() => {
    const found = playgroundEffectiveFiles.find((f) => hasMainMethod(f.content));
    return (found || playgroundEffectiveFiles[0])?.name.replace(/\.java$/, '') || 'Main';
  }, [playgroundEffectiveFiles]);

  const currentLineCount = mainCode.split(/\r?\n/).length;
  const cleanLineCount = activePe ? activePe.cleanCode.split(/\r?\n/).length : 0;

  if (!playgroundMode && !activePe) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-xs text-[var(--text-muted)]">
        Đang tải dữ liệu Code Studio...
      </div>
    );
  }

  const entryMainClass = mainFileName.replace(/\.java$/, '');
  const javacCommand = playgroundMode
    ? `javac ${playgroundEffectiveFiles.map((f) => f.name).join(' ')} && java ${pgEntryClass}`
    : `javac ${entityFileName} ${mainFileName} && java ${entryMainClass}`;

  const engineBadgeLabel = playgroundMode
    ? sandboxHealth === 'ready'
      ? '☕ OpenJDK 21 Sandbox'
      : sandboxHealth === 'checking'
        ? '☕ Đang kiểm tra Sandbox'
        : '⚡ Offline (Chạy bằng javac local)'
    : engineMode === 'static'
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
              aria-label="Chọn chế độ hoặc đề PE trong Code Studio"
              value={playgroundMode ? 'playground' : String(activePe?.id ?? 1)}
              onChange={(e) => {
                flushLatestDraft();
                flushPlaygroundDraft();
                if (e.target.value === 'playground') {
                  navigate('/studio/playground');
                } else {
                  navigate(`/studio/${e.target.value}`);
                }
              }}
              className="min-h-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-bold text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="playground">
                ☕ Java Playground (Tự do · tối đa {MAX_PLAYGROUND_FILES} file)
              </option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>

            {!playgroundMode && (
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
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              role="status"
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-muted)]"
            >
              {playgroundMode
                ? pgDraftState === 'saving'
                  ? 'Đang lưu...'
                  : pgDraftState === 'saved'
                    ? '✓ Đã lưu Playground'
                    : 'Mẫu gốc'
                : draftState === 'saving'
                  ? 'Đang lưu nháp...'
                  : draftState === 'saved'
                    ? '✓ Đã lưu nháp'
                    : 'Code gốc'}
            </span>

            <MorphActionButton
              label="▶ Run Code"
              variant={playgroundMode ? 'primary' : 'secondary'}
              disabled={isExecuting}
              onClick={handleRunCode}
            />
            {!playgroundMode && (
              <MorphActionButton
                label="✔ Chấm Test Case PE"
                variant="primary"
                disabled={isExecuting}
                onClick={handleSubmitTests}
              />
            )}
            <button
              type="button"
              onClick={() => setShowAiPane((s) => !s)}
              className="min-h-[36px] rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3 py-1.5 font-medium text-[var(--info-text)] transition-colors hover:opacity-90"
            >
              {playgroundMode ? '✨ Hỏi AI Mentor' : '✨ AI Review & Tối ưu'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              title={
                playgroundMode
                  ? 'Khôi phục mẫu Playground mặc định'
                  : 'Khôi phục code gốc (Starter Code)'
              }
              className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {playgroundMode ? '↺ Khôi phục mẫu' : '↺ Khôi phục gốc'}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Pane Studio Workspace */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left Pane: Playground Templates OR PE Problem & Theory */}
        <aside className="space-y-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 text-xs lg:col-span-3 lg:border-b-0 lg:border-r">
          {playgroundMode ? (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  Java Playground (Tự do)
                </div>
                <p className="mt-1 leading-relaxed text-[var(--text-muted)]">
                  Tạo tới {MAX_PLAYGROUND_FILES} lớp <code className="font-mono">.java</code>, nhập{' '}
                  <code className="font-mono">stdin</code> và biên dịch trực tiếp bằng{' '}
                  <strong>OpenJDK 21</strong>.
                </p>
              </div>

              {pgSourceLabel && (
                <div className="space-y-1 rounded-lg border border-[var(--info)]/35 bg-[var(--info-soft)] p-2.5">
                  <div className="font-semibold text-[var(--info-text)]">
                    Đang chạy thử từ bài học
                  </div>
                  <div className="truncate font-mono text-xs text-[var(--text-secondary)]">
                    {pgSourceLabel}
                  </div>
                  {pgImportBanner && (
                    <p className="leading-snug text-[var(--text-muted)]">{pgImportBanner}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="font-semibold text-[var(--text-primary)]">
                  Mẫu khởi động nhanh:
                </div>
                <div className="space-y-1.5">
                  {PLAYGROUND_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectPlaygroundTemplate(tpl.id)}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2.5 text-left transition-colors hover:border-[var(--accent)]"
                    >
                      <div className="font-semibold text-[var(--text-primary)]">{tpl.title}</div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">{tpl.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3 leading-relaxed text-[var(--text-muted)]">
                <div className="font-semibold text-[var(--accent-text)]">Mẹo dùng Playground:</div>
                <p>• Lớp <code className="text-[var(--accent-text)]">public class</code> nào cần tự đổi tên tệp sẽ tự đồng bộ theo tên lớp đó.</p>
                <p>• Sandbox hỗ trợ tối đa {MAX_PLAYGROUND_FILES} tệp (64 KB), giới hạn 8 giây chạy JVM &amp; tắt mạng.</p>
              </div>
            </div>
          ) : (
            <>
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
                  <p className="leading-relaxed text-[var(--text-muted)]">{activePe!.desc}</p>

                  <div className="space-y-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3">
                    <div className="font-semibold text-[var(--text-primary)]">
                      Checklist tiêu chí:
                    </div>
                    <div className="space-y-1.5">
                      {activePe!.checklist.map((criterion) => {
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
                    <div>{activePe!.meta}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 leading-relaxed text-[var(--text-muted)]">
                  <div className="font-semibold text-[var(--accent-text)]">
                    Mẹo làm nhanh {activePe!.code}:
                  </div>
                  <p>
                    1. Luôn kiểm tra dữ liệu biên (
                    <code className="text-[var(--accent-text)]">null</code>, chuỗi rỗng, giới hạn
                    mảng) ngay dòng đầu tiên của hàm.
                  </p>
                  <p>
                    2. Chú ý annotation{' '}
                    <code className="text-[var(--accent-text)]">@Override</code>, đóng luồng bằng{' '}
                    <code className="text-[var(--accent-text)]">try-with-resources</code> và định
                    dạng <code className="text-[var(--accent-text)]">toString()</code> chính xác
                    từng ký tự.
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
            </>
          )}
        </aside>

        {/* Center Pane: CodeMirror 6 Editor / Diff View + Bottom Console */}
        <div
          className={[
            'flex flex-col border-b border-[var(--border-default)] bg-[var(--bg-code)] lg:border-b-0',
            showAiPane ? 'lg:col-span-6 lg:border-r' : 'lg:col-span-9',
          ].join(' ')}
        >
          {/* File Tabs & File Controls / Diff Toggle */}
          <div className="flex flex-col gap-2 border-b border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {playgroundMode ? (
                <SlidingPillTabs
                  options={playgroundTabs}
                  value={activePgFile?.id || playgroundTabs[0]?.id || ''}
                  onChange={setPgActiveFileId}
                  ariaLabel="Chọn tệp mã nguồn Java trong Playground"
                  tone="neutral"
                  className="font-mono"
                />
              ) : (
                <SlidingPillTabs
                  options={peFileTabs}
                  value={activeFile}
                  onChange={setActiveFile}
                  ariaLabel="Chọn tệp mã nguồn Java"
                  tone="neutral"
                  className="font-mono"
                />
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden font-mono text-xs text-[var(--text-dim)] sm:inline">
                  Ctrl+Enter để chạy
                </span>
                {playgroundMode ? (
                  <>
                    <span className="font-mono text-xs text-[var(--text-dim)]">
                      {playgroundFiles.length}/{MAX_PLAYGROUND_FILES} tệp
                    </span>
                    {playgroundFiles.length < MAX_PLAYGROUND_FILES && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewFileError(null);
                          setNewFileInputVisible((v) => !v);
                        }}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>+ Thêm tệp</span>
                      </button>
                    )}
                    {playgroundFiles.length > 1 && activePgFile && (
                      <button
                        type="button"
                        onClick={handleDeleteActivePlaygroundFile}
                        aria-label={`Xóa tệp ${activePgFile.name}`}
                        title={`Xóa tệp ${activePgFile.name}`}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-[var(--danger)]/40 bg-[var(--danger-soft)] px-2 py-1 font-medium text-[var(--danger-text)] hover:opacity-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Xóa {activePgFile.name}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDiff((d) => !d)}
                    className="min-h-[36px] rounded-md border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent-text)] hover:opacity-90"
                  >
                    ⚡ {showDiff ? 'Quay lại Code Editor' : 'So sánh Bản Tối ưu (Diff)'}
                  </button>
                )}
              </div>
            </div>

            {playgroundMode && newFileInputVisible && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddPlaygroundFile();
                }}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2"
              >
                <label htmlFor="pg-new-file-input" className="font-medium text-[var(--text-secondary)]">
                  Tên lớp mới:
                </label>
                <input
                  id="pg-new-file-input"
                  type="text"
                  value={newFileName}
                  onChange={(e) => {
                    setNewFileName(e.target.value);
                    setNewFileError(null);
                  }}
                  placeholder="Ví dụ: Student hoặc Student.java"
                  className="min-h-[34px] flex-1 rounded border border-[var(--border-default)] bg-[var(--bg-code)] px-2.5 py-1 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-[34px] rounded bg-[var(--accent)] px-3 py-1 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                >
                  Tạo tệp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFileInputVisible(false);
                    setNewFileError(null);
                  }}
                  className="min-h-[34px] rounded px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Hủy
                </button>
                {newFileError && (
                  <div className="w-full text-xs text-[var(--danger-text)]">{newFileError}</div>
                )}
              </form>
            )}
          </div>

          {playgroundMode || !showDiff ? (
            <JavaCodeEditor
              value={activeCode}
              onChange={(val) =>
                playgroundMode && activePgFile
                  ? updatePlaygroundCode(activePgFile.id, val)
                  : updateCodeAndScheduleDraft(activeFile, val)
              }
              onBlur={playgroundMode ? flushPlaygroundDraft : flushLatestDraft}
              onRunShortcut={() => void handleRunCode()}
              theme={theme}
              diagnostics={activeFileDiagnostics}
              jumpTarget={jumpTarget}
            />
          ) : (
            <div className="grid min-h-[290px] flex-1 grid-cols-1 gap-3 overflow-auto p-4 text-xs md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--bg-surface)] p-3">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
                  <span className="font-semibold text-[var(--danger-text)]">Code hiện tại</span>
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
                    {activePe!.cleanCode}
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
                  {playgroundMode ? 'Console (OpenJDK 21 Sandbox)' : 'Console & Kết quả Test PE'}
                </span>
                <span
                  title={
                    playgroundMode
                      ? 'Biên dịch & chạy đa tệp Java thật trên OpenJDK 21 Firecracker microVM.'
                      : 'Hybrid 2 lớp: biên dịch thật trên OpenJDK 21 Sandbox kết hợp Static Pattern Evaluator cho Clean Code.'
                  }
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)]"
                >
                  {engineBadgeLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!playgroundMode && (
                  <SlidingPillTabs
                    options={ENGINE_MODE_OPTIONS}
                    value={engineMode}
                    onChange={setEngineMode}
                    ariaLabel="Chọn chế độ biên dịch"
                    tone="neutral"
                  />
                )}
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
                <label
                  htmlFor="studio-stdin-box"
                  className="block font-medium text-[var(--text-secondary)]"
                >
                  Dữ liệu đầu vào chuẩn (<code className="font-mono">stdin</code>) cho{' '}
                  <code className="font-mono">Scanner(System.in)</code>:
                </label>
                <textarea
                  id="studio-stdin-box"
                  rows={2}
                  value={stdinInput}
                  onChange={(e) => {
                    const nextStdin = e.target.value;
                    setStdinInput(nextStdin);
                    if (playgroundMode) {
                      schedulePlaygroundSave({
                        files: playgroundFiles,
                        activeFileId: pgActiveFileId,
                        stdin: nextStdin,
                        sourceLabel: pgSourceLabel,
                      });
                    }
                  }}
                  onBlur={() => {
                    if (playgroundMode) flushPlaygroundDraft();
                  }}
                  placeholder="Ví dụ: An&#10;9.25"
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
                  Chẩn đoán javac ({diagnostics.length}) — bấm để nhảy tới dòng:
                </div>
                <div className="space-y-1">
                  {diagnostics.map((diag, idx) => (
                    <button
                      key={`${diag.file}-${diag.line}-${idx}`}
                      type="button"
                      onClick={() => handleJumpToDiagnostic(diag)}
                      className="flex w-full items-start gap-2 rounded px-2 py-1 text-left font-mono text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/70"
                    >
                      <span
                        className={
                          diag.severity === 'error'
                            ? 'shrink-0 font-semibold text-[var(--danger-text)]'
                            : 'shrink-0 font-semibold text-[var(--accent-text)]'
                        }
                      >
                        {diag.file}:{diag.line}:{diag.column}
                      </span>
                      <span className="break-words text-[var(--text-secondary)]">
                        {diag.message}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Structured OpenJDK test case results (PE mode) */}
            {!playgroundMode && cloudTestResults.length > 0 && (
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
                      <span
                        className={
                          tc.passed ? 'text-[var(--success-text)]' : 'text-[var(--danger-text)]'
                        }
                      >
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
              {playgroundMode ? (
                <>
                  Biên dịch &amp; thực thi thật trên <strong>OpenJDK 21 Sandbox</strong>. Lệnh máy local:{' '}
                  <code className="text-[var(--text-muted)]">{javacCommand}</code>
                </>
              ) : (
                <>
                  Hybrid 2 lớp: biên dịch &amp; chấm Test Case thật trên{' '}
                  <strong>OpenJDK 21 Sandbox</strong> + phân tích Clean Code tức thì bởi{' '}
                  <strong>Static Pattern Evaluator</strong>. Lệnh máy local:{' '}
                  <code className="text-[var(--text-muted)]">{javacCommand}</code>
                </>
              )}
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
                {playgroundMode ? (
                  <div className="space-y-2 rounded-xl border border-[var(--info)]/35 bg-[var(--info-soft)] p-3">
                    <div className="font-semibold text-[var(--info-text)]">
                      ☕ Trợ lý Java Playground
                    </div>
                    <p className="leading-relaxed text-[var(--text-secondary)]">
                      Đang chỉnh sửa <code className="font-mono">{activeFileName}</code>. Bạn có thể
                      tạo thêm class OOP qua nút <strong>+ Thêm tệp</strong>, nhập dữ liệu đầu vào
                      với <strong>+ Nhập stdin</strong> hoặc hỏi AI bên dưới.
                    </p>
                  </div>
                ) : (
                  diagnosisCards.map((card) => {
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
                  })
                )}

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
