import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Columns2,
  Eraser,
  FilePlus2,
  Pause,
  Play,
  RotateCcw,
  Rows2,
  Share2,
  Timer,
  Trash2,
} from 'lucide-react';
import { JavaCodeEditor, MAX_CODE_CHARS, type JumpTarget } from '../components/JavaCodeEditor';
import { TryitSplitPane } from '../components/TryitSplitPane';
import { CodeCharLimitMeter } from '../components/lucian/CodeCharLimitMeter';
import { CopyCodeButton } from '../components/lucian/CopyCodeButton';
import { LucianChecklistItem } from '../components/lucian/LucianChecklistItem';
import { MorphActionButton } from '../components/lucian/MorphActionButton';
import { SlidingPillTabs } from '../components/lucian/SlidingPillTabs';
import { StreamingAiBubble } from '../components/lucian/StreamingAiBubble';
import { StretchySwitch } from '../components/lucian/StretchySwitch';
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
  decodePlaygroundShareParam,
  encodePlaygroundShareParam,
  findPlaygroundTemplate,
  readPlaygroundWorkspace,
  savePlaygroundWorkspace,
  validateNewJavaFileName,
  type PlaygroundFile,
  type PlaygroundTemplateCategory,
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

const STORAGE_ORIENTATION = 'javabrew:studio_orientation';
const STORAGE_SPLIT = 'javabrew:studio_split';
const STORAGE_AUTORUN = 'javabrew:studio_autorun';

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function readStoredOrientation(): 'horizontal' | 'vertical' {
  try {
    return localStorage.getItem(STORAGE_ORIENTATION) === 'vertical' ? 'vertical' : 'horizontal';
  } catch {
    return 'horizontal';
  }
}

function readStoredSplit(): number {
  try {
    const raw = Number(localStorage.getItem(STORAGE_SPLIT));
    if (Number.isFinite(raw) && raw >= 28 && raw <= 72) return Math.round(raw);
  } catch {
    // ignore
  }
  return 52;
}

function readStoredAutoRun(): boolean {
  try {
    return localStorage.getItem(STORAGE_AUTORUN) !== '0';
  } catch {
    return true;
  }
}

function computeEffectiveFiles(files: PlaygroundFile[]) {
  const used = new Set<string>();
  return files.map((f) => {
    const inferred = inferJavaFileName(f.content, f.name);
    const effective = used.has(inferred.toLowerCase()) ? f.name : inferred;
    used.add(effective.toLowerCase());
    return { id: f.id, name: effective, content: f.content };
  });
}

const LEFT_TAB_OPTIONS = [
  { id: 'spec' as const, label: 'Đề bài PE' },
  { id: 'theory' as const, label: 'Lý thuyết nhanh' },
];

const ENGINE_MODE_OPTIONS = [
  { id: 'cloud' as const, label: 'OpenJDK 21 + Clean Code' },
  { id: 'static' as const, label: 'Chỉ Static (Tức thì)' },
];

const EXAMPLE_CATEGORIES: Array<'Tất cả' | PlaygroundTemplateCategory> = [
  'Tất cả',
  'Cơ bản',
  'OOP',
  'Collections',
  'Exception & File I/O',
  'Thực chiến PE',
];

export function CodeStudioPage({ isPlayground = false }: CodeStudioPageProps) {
  const { peId } = useParams<{ peId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { pro192, theme, byokKey, markPeStatus, addMistake, recordVisit, pushToast } = useApp();

  const playgroundMode = isPlayground || peId === 'playground';
  const urlExampleId = searchParams.get('example');
  const urlSharedCode = searchParams.get('code');

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
  const [activeFile, setActiveFile] = useState<'main' | 'entity' | 'interface'>('main');
  const [showAiPane, setShowAiPane] = useState(() => !playgroundMode);
  const [showExamplesDrawer, setShowExamplesDrawer] = useState(
    () => playgroundMode && !urlExampleId && !(location.state as PlaygroundRouteState | null)?.playgroundImport?.files?.length
  );
  const [exampleCategory, setExampleCategory] = useState<'Tất cả' | PlaygroundTemplateCategory>('Tất cả');
  const [exampleSearch, setExampleSearch] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>(readStoredOrientation);
  const [splitPercent, setSplitPercent] = useState<number>(readStoredSplit);
  const [autoRun, setAutoRun] = useState<boolean>(readStoredAutoRun);

  const [engineMode, setEngineMode] = useState<'cloud' | 'static'>('cloud');
  const [sandboxHealth, setSandboxHealth] = useState<'checking' | 'ready' | 'offline'>('checking');
  const [sandboxRuntimeLabel, setSandboxRuntimeLabel] = useState<string>('OpenJDK 21 Sandbox');
  const [isExecuting, setIsExecuting] = useState(false);

  const initialBootstrap = useMemo<{
    state: PlaygroundWorkspaceState;
    activeExampleId: string | null;
    fromShareOrExample: boolean;
  }>(() => {
    const routeState = location.state as PlaygroundRouteState | null;
    if (routeState?.playgroundImport?.files?.length) {
      return {
        state: routeState.playgroundImport,
        activeExampleId: null,
        fromShareOrExample: true,
      };
    }
    if (playgroundMode && urlExampleId) {
      const tpl = findPlaygroundTemplate(urlExampleId);
      if (tpl) {
        const cloned = cloneTemplateFiles(tpl.id);
        return {
          state: {
            files: cloned.files,
            activeFileId: cloned.files[0].id,
            stdin: cloned.template.stdin,
            sourceLabel: cloned.template.title,
          },
          activeExampleId: cloned.template.id,
          fromShareOrExample: true,
        };
      }
    }
    if (playgroundMode && urlSharedCode) {
      const decoded = decodePlaygroundShareParam(urlSharedCode);
      if (decoded) {
        return {
          state: decoded,
          activeExampleId: null,
          fromShareOrExample: true,
        };
      }
    }
    const saved = readPlaygroundWorkspace();
    if (saved) {
      return {
        state: saved,
        activeExampleId: null,
        fromShareOrExample: false,
      };
    }
    const starter = cloneTemplateFiles(PLAYGROUND_TEMPLATES[0].id);
    return {
      state: {
        files: starter.files,
        activeFileId: starter.files[0].id,
        stdin: starter.template.stdin,
      },
      activeExampleId: starter.template.id,
      fromShareOrExample: Boolean(playgroundMode),
    };
    // Intentionally evaluated once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialPg = initialBootstrap.state;

  const [activeExampleId, setActiveExampleId] = useState<string | null>(
    initialBootstrap.activeExampleId
  );
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
  const [charLimitHitNonce, setCharLimitHitNonce] = useState(0);

  const draftTimerRef = useRef<number>(0);
  const pgDraftTimerRef = useRef<number>(0);
  const charLimitToastAtRef = useRef<number>(0);
  const runAbortRef = useRef<AbortController | null>(null);
  const appliedImportKeyRef = useRef<string | null>(null);
  const appliedQueryKeyRef = useRef<string>(
    playgroundMode
      ? urlExampleId
        ? `ex:${urlExampleId}`
        : urlSharedCode
          ? `code:${urlSharedCode}`
          : ''
      : ''
  );
  const pendingAutoRunRef = useRef<string | null>(
    playgroundMode && urlExampleId ? `ex:${urlExampleId}` : null
  );
  const lastAutoRanKeyRef = useRef<string | null>(null);
  const prevPlaygroundModeRef = useRef<boolean>(playgroundMode);

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

  // Sync AI Mentor, drawer, and run state cleanly when switching between PE <-> Playground
  useEffect(() => {
    if (prevPlaygroundModeRef.current === playgroundMode) return;
    prevPlaygroundModeRef.current = playgroundMode;
    runAbortRef.current?.abort();
    setShowDiff(false);
    setDiagnostics([]);
    setCloudTestResults([]);
    setLastTiming(null);
    setShowAiPane(!playgroundMode);
    if (!playgroundMode) {
      setShowExamplesDrawer(false);
    }
  }, [playgroundMode]);

  // Persist Tryit preferences cleanly
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORIENTATION, splitOrientation);
    } catch {
      // ignore
    }
  }, [splitOrientation]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SPLIT, String(splitPercent));
    } catch {
      // ignore
    }
  }, [splitPercent]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUTORUN, autoRun ? '1' : '0');
    } catch {
      // ignore
    }
  }, [autoRun]);

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
    setActiveExampleId(null);
    setShowExamplesDrawer(false);
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
    pendingAutoRunRef.current = null;
  }, [playgroundMode, location.key, location.state]);

  // Handle URL query changes (?example=... or ?code=...)
  useEffect(() => {
    if (!playgroundMode) return;
    const routeState = location.state as PlaygroundRouteState | null;
    if (routeState?.playgroundImport?.files?.length) return;

    const queryKey = urlExampleId
      ? `ex:${urlExampleId}`
      : urlSharedCode
        ? `code:${urlSharedCode}`
        : '';
    if (!queryKey || appliedQueryKeyRef.current === queryKey) return;

    if (urlExampleId) {
      const tpl = findPlaygroundTemplate(urlExampleId);
      if (tpl) {
        appliedQueryKeyRef.current = queryKey;
        const cloned = cloneTemplateFiles(tpl.id);
        const nextState: PlaygroundWorkspaceState = {
          files: cloned.files,
          activeFileId: cloned.files[0].id,
          stdin: cloned.template.stdin,
          sourceLabel: cloned.template.title,
        };
        setPlaygroundFiles(cloned.files);
        setPgActiveFileId(cloned.files[0].id);
        setStdinInput(cloned.template.stdin);
        setShowStdin(cloned.template.stdin.length > 0);
        setPgSourceLabel(cloned.template.title);
        setPgImportBanner(cloned.template.subtitle);
        setActiveExampleId(cloned.template.id);
        setPgDraftState('clean');
        latestPgRef.current = { state: nextState, dirty: false };
        savePlaygroundWorkspace(nextState);
        setDiagnostics([]);
        setLastTiming(null);
        setConsoleStatus(`Đã nạp mẫu "${cloned.template.title}"`);
        setConsoleTone('muted');
        setConsoleOutput('Nhấn "▶ Run Code" để biên dịch và xem kết quả bên khung Output.');
        pendingAutoRunRef.current = queryKey;
      }
      return;
    }

    if (urlSharedCode) {
      const decoded = decodePlaygroundShareParam(urlSharedCode);
      if (decoded) {
        appliedQueryKeyRef.current = queryKey;
        setPlaygroundFiles(decoded.files);
        setPgActiveFileId(decoded.activeFileId);
        setStdinInput(decoded.stdin);
        setShowStdin(decoded.stdin.length > 0);
        setPgSourceLabel(decoded.sourceLabel);
        setPgImportBanner('Đã nạp mã nguồn từ liên kết chia sẻ.');
        setActiveExampleId(null);
        setPgDraftState('saved');
        latestPgRef.current = { state: decoded, dirty: false };
        savePlaygroundWorkspace(decoded);
        pendingAutoRunRef.current = queryKey;
      }
    }
  }, [playgroundMode, urlExampleId, urlSharedCode, location.state]);

  // Probe sandbox health on mount
  useEffect(() => {
    const controller = new AbortController();
    void checkJavaSandboxHealth(controller.signal).then((health) => {
      if (!controller.signal.aborted) {
        setSandboxHealth(health.available ? 'ready' : 'offline');
        if (health.runtime && /piston|judge0|external/i.test(health.runtime)) {
          setSandboxRuntimeLabel(health.runtime);
        } else {
          setSandboxRuntimeLabel('OpenJDK 21 Sandbox');
        }
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
      recordVisit({
        path: activeExampleId ? `/studio/playground?example=${activeExampleId}` : '/studio/playground',
        title: activeExampleId ? `Java Tryit (${activeExampleId})` : 'Java Tryit Playground',
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
  }, [playgroundMode, activePe, activeExampleId, recordVisit]);

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

  const handleCodeLimitReached = useCallback(() => {
    setCharLimitHitNonce((n) => n + 1);
    const now = Date.now();
    if (now - charLimitToastAtRef.current > 3000) {
      charLimitToastAtRef.current = now;
      pushToast({
        title: 'Đã đạt giới hạn 10.000 ký tự',
        description: 'Mỗi tệp Java giới hạn tối đa 10.000 ký tự để biên dịch nhanh và ổn định.',
        tone: 'warn',
      });
    }
  }, [pushToast]);

  const updatePlaygroundCode = (fileId: string, nextContent: string) => {
    const safeContent =
      nextContent.length > MAX_CODE_CHARS ? nextContent.slice(0, MAX_CODE_CHARS) : nextContent;
    const nextFiles = playgroundFiles.map((f) =>
      f.id === fileId ? { ...f, content: safeContent } : f
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

  const updateCodeAndScheduleDraft = (
    target: 'main' | 'entity' | 'interface',
    nextValue: string
  ) => {
    if (!activePe || target === 'interface') return;
    const safeValue =
      nextValue.length > MAX_CODE_CHARS ? nextValue.slice(0, MAX_CODE_CHARS) : nextValue;
    const nextMain = target === 'main' ? safeValue : mainCode;
    const nextEntity = target === 'entity' ? safeValue : entityCode;

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
  const hasEntityFile = Boolean(activePe?.entityCode?.trim());
  const hasInterfaceFile = Boolean(activePe?.interfaceFileName && activePe?.interfaceCode);

  const mainFileName = useMemo(() => {
    if (!activePe) return 'Main.java';
    const fallback = inferJavaFileName(activePe.starterCode, 'Main.java');
    return inferJavaFileName(mainCode, fallback);
  }, [activePe, mainCode]);

  const entityFileName = useMemo(() => {
    if (!activePe || !hasEntityFile) return '';
    return inferJavaFileName(entityCode, activePe.entityFileName || 'Entity.java');
  }, [activePe, hasEntityFile, entityCode]);

  const peFileTabs = useMemo(() => {
    const tabs: Array<{ id: 'main' | 'entity' | 'interface'; label: string }> = [
      { id: 'main', label: mainFileName },
    ];
    if (hasEntityFile && entityFileName) {
      tabs.push({ id: 'entity', label: entityFileName });
    }
    if (hasInterfaceFile && activePe?.interfaceFileName) {
      tabs.push({ id: 'interface', label: `🔒 ${activePe.interfaceFileName}` });
    }
    return tabs;
  }, [mainFileName, hasEntityFile, entityFileName, hasInterfaceFile, activePe?.interfaceFileName]);

  // Playground Effective File Names (sync with edited public class declaration cleanly)
  const playgroundEffectiveFiles = useMemo(
    () => computeEffectiveFiles(playgroundFiles),
    [playgroundFiles]
  );

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
      : activeFile === 'entity'
        ? entityCode
        : activePe?.interfaceCode ?? '';

  const activeFileName = playgroundMode
    ? activePgFile?.name ?? 'Main.java'
    : activeFile === 'main'
      ? mainFileName
      : activeFile === 'entity'
        ? entityFileName || mainFileName
        : activePe?.interfaceFileName ?? mainFileName;

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
    const targetTab: 'main' | 'entity' =
      hasEntityFile && diag.file === entityFileName ? 'entity' : 'main';
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

  const runPlaygroundCloud = async (
    overrideFiles?: PlaygroundFile[],
    overrideStdin?: string,
    forceAbort = false
  ): Promise<boolean> => {
    if (isExecuting && !forceAbort) return false;
    flushPlaygroundDraft();

    const targetFiles = computeEffectiveFiles(overrideFiles ?? playgroundFiles);
    const targetStdin = overrideStdin !== undefined ? overrideStdin : stdinInput;

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    setIsExecuting(true);
    setDiagnostics([]);
    setCloudTestResults([]);
    setLastTiming(null);
    setConsoleStatus('☕ Đang biên dịch & chạy trên OpenJDK Sandbox...');
    setConsoleTone('amber');
    setConsoleOutput('Đang khởi chạy biên dịch javac và thực thi trên JVM...');

    try {
      const res = await runJavaInCloud(
        {
          mode: 'run',
          files: targetFiles.map(({ name, content }) => ({ name, content })),
          stdin: targetStdin,
        },
        controller.signal
      );

      if (controller.signal.aborted) return false;

      if (res.unavailable) {
        setSandboxHealth('offline');
        setConsoleStatus('⚡ OpenJDK Sandbox chưa khả dụng Offline');
        setConsoleTone('amber');
        setConsoleOutput(
          `${res.unavailableReason || 'Không kết nối được tới OpenJDK Sandbox.'}\n\nMẹo: Bấm "Copy lệnh javac" để chạy trực tiếp bộ ${targetFiles.length} tệp này trên NetBeans / Terminal máy bạn (hoặc cấu hình biến JAVA_RUNNER_URL).`
        );
        return false;
      }

      setSandboxHealth('ready');
      setLastTiming({
        compileMs: res.compileMs,
        runMs: res.runMs,
        engineLabel: res.jdkVersion || sandboxRuntimeLabel,
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
      setConsoleStatus('⚡ Không kết nối được OpenJDK Sandbox');
      setConsoleTone('amber');
      setConsoleOutput('Mất kết nối tới Sandbox — hãy thử lại hoặc dùng nút Copy lệnh javac.');
      return false;
    } finally {
      if (runAbortRef.current === controller) {
        runAbortRef.current = null;
        setIsExecuting(false);
      }
    }
  };

  // Trigger Auto-Run once per newly loaded example / lesson import when runner is healthy
  useEffect(() => {
    if (!playgroundMode || !autoRun || sandboxHealth !== 'ready' || isExecuting) return;
    const pendingKey = pendingAutoRunRef.current;
    if (!pendingKey || lastAutoRanKeyRef.current === pendingKey) return;

    lastAutoRanKeyRef.current = pendingKey;
    pendingAutoRunRef.current = null;
    void runPlaygroundCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playgroundMode, autoRun, sandboxHealth, isExecuting, playgroundFiles]);

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
    setConsoleStatus('☕ Đang biên dịch trên OpenJDK Sandbox...');
    setConsoleTone('amber');
    setConsoleOutput('Đang khởi chạy môi trường OpenJDK và biên dịch mã nguồn...');

    try {
      const filesToSend =
        !hasEntityFile || !entityFileName || mainFileName === entityFileName
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
        setIsExecuting(false);
      }
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
    const prevExampleId = activeExampleId;
    const { template, files } = cloneTemplateFiles(templateId);

    appliedQueryKeyRef.current = `ex:${template.id}`;
    setSearchParams({ example: template.id }, { replace: true });
    setPlaygroundFiles(files);
    setPgActiveFileId(files[0].id);
    setStdinInput(template.stdin);
    setShowStdin(template.stdin.length > 0);
    setPgSourceLabel(template.title);
    setPgImportBanner(template.subtitle);
    setActiveExampleId(template.id);
    setDiagnostics([]);
    setLastTiming(null);
    setConsoleStatus(`Đã nạp mẫu "${template.title}"`);
    setConsoleTone('muted');
    setConsoleOutput('Nhấn "▶ Run Code" để biên dịch và chạy mẫu này trên OpenJDK.');
    schedulePlaygroundSave(
      {
        files,
        activeFileId: files[0].id,
        stdin: template.stdin,
        sourceLabel: template.title,
      },
      true
    );

    if (autoRun && sandboxHealth === 'ready') {
      lastAutoRanKeyRef.current = `ex:${template.id}:manual-${Date.now()}`;
      pendingAutoRunRef.current = null;
      void runPlaygroundCloud(files, template.stdin, true);
    }

    pushToast({
      title: `Đã chuyển sang mẫu: ${template.title}`,
      tone: 'info',
      undoLabel: 'Hoàn tác',
      onUndo: () => {
        setActiveExampleId(prevExampleId);
        setPlaygroundFiles(prevState.files);
        setPgActiveFileId(prevState.activeFileId);
        setStdinInput(prevState.stdin);
        setShowStdin(prevState.stdin.length > 0);
        setPgSourceLabel(prevState.sourceLabel);
        schedulePlaygroundSave(prevState, true);
      },
    });
  };

  const handleSharePlayground = async () => {
    const matchedTemplate = activeExampleId ? findPlaygroundTemplate(activeExampleId) : null;
    const isUnmodifiedTemplate =
      matchedTemplate &&
      playgroundEffectiveFiles.length === matchedTemplate.files.length &&
      playgroundEffectiveFiles.every(
        (f, i) =>
          f.name === matchedTemplate.files[i]?.name &&
          f.content === matchedTemplate.files[i]?.content
      ) &&
      stdinInput === matchedTemplate.stdin;

    let shareUrl: string;
    if (isUnmodifiedTemplate) {
      shareUrl = `${window.location.origin}/studio/playground?example=${encodeURIComponent(matchedTemplate.id)}`;
    } else {
      const encoded = encodePlaygroundShareParam({
        files: playgroundEffectiveFiles,
        stdin: stdinInput,
      });
      if (!encoded) {
        pushToast({
          title: 'Đoạn mã quá dài để tạo link chia sẻ',
          description: 'Hãy rút gọn dưới 16 KB rồi thử lại.',
          tone: 'warn',
        });
        return;
      }
      shareUrl = `${window.location.origin}/studio/playground?code=${encoded}`;
    }

    try {
      await navigator.clipboard?.writeText(shareUrl);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
    pushToast({
      title: 'Đã chép liên kết Java Tryit!',
      description: isUnmodifiedTemplate ? `Mẫu: ${matchedTemplate.title}` : 'Link chứa đầy đủ mã nguồn của bạn.',
      tone: 'success',
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
      const targetId = activeExampleId || PLAYGROUND_TEMPLATES[0].id;
      const { template, files } = cloneTemplateFiles(targetId);
      window.clearTimeout(pgDraftTimerRef.current);
      clearPlaygroundWorkspace();
      setPlaygroundFiles(files);
      setPgActiveFileId(files[0].id);
      setStdinInput(template.stdin);
      setShowStdin(template.stdin.length > 0);
      setPgSourceLabel(template.title);
      setPgImportBanner(null);
      setPgDraftState('clean');
      latestPgRef.current = {
        state: { files, activeFileId: files[0].id, stdin: template.stdin, sourceLabel: template.title },
        dirty: false,
      };
      setDiagnostics([]);
      setJumpTarget(null);
      setLastTiming(null);
      setConsoleStatus(`Java Tryit · Đã khôi phục mẫu ${template.title}`);
      setConsoleTone('muted');
      setConsoleOutput('Nhấn "▶ Run Code" để biên dịch và chạy mẫu này.');
      pushToast({
        title: 'Đã khôi phục mẫu mặc định',
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
        : `AI Mentor (Playground): Tệp ${activeFileName} đang chạy trên OpenJDK. Nếu chương trình đọc bàn phím (\`Scanner\`), hãy mở mục "+ Nhập stdin" bên khung Output để truyền dữ liệu đầu vào.`
      : /tối ưu|ngắn|clean/i.test(cleanPrompt)
        ? `AI Mentor: Với ${activePe!.code}, hãy ưu tiên kiểm tra dữ liệu biên (null / mảng rỗng) ở đầu hàm bằng Early Return, sau đó tách phần kiểm tra hoặc dùng Comparator / Iterator để giảm độ sâu if-else.`
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

  const challengesByPaper = useMemo(() => {
    const groups = new Map<string, typeof challenges>();
    for (const c of challenges) {
      const p = c.paper || c.code.match(/^(PE\d+)/i)?.[1]?.toUpperCase() || 'Đề PE';
      const arr = groups.get(p) ?? [];
      arr.push(c);
      groups.set(p, arr);
    }
    return Array.from(groups.entries());
  }, [challenges]);

  const filteredTemplates = useMemo(() => {
    const q = exampleSearch.trim().toLowerCase();
    return PLAYGROUND_TEMPLATES.filter((t) => {
      if (exampleCategory !== 'Tất cả' && t.category !== exampleCategory) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.slotRef.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [exampleCategory, exampleSearch]);

  const currentLineCount = mainCode.split(/\r?\n/).length;
  const cleanLineCount = activePe ? activePe.cleanCode.split(/\r?\n/).length : 0;

  if (!playgroundMode && !activePe) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-xs text-[var(--text-muted)]">
        Đang tải dữ liệu Code Studio…
      </div>
    );
  }

  const entryMainClass = mainFileName.replace(/\.java$/, '');
  const peJavacFiles = [entityFileName, mainFileName].filter(Boolean).join(' ');
  const javacCommand = playgroundMode
    ? `javac ${playgroundEffectiveFiles.map((f) => f.name).join(' ')} && java ${pgEntryClass}`
    : `javac ${peJavacFiles} && java ${entryMainClass}`;

  const engineBadgeLabel = playgroundMode
    ? sandboxHealth === 'ready'
      ? `☕ ${sandboxRuntimeLabel}`
      : sandboxHealth === 'checking'
        ? '☕ Đang kiểm tra Sandbox'
        : '⚡ Offline (Chạy bằng javac local)'
    : engineMode === 'static'
      ? '⚡ Static Pattern Evaluator'
      : sandboxHealth === 'ready'
        ? `☕ ${sandboxRuntimeLabel}`
        : sandboxHealth === 'checking'
          ? '☕ Đang kiểm tra Sandbox'
          : '⚡ Static Pattern Evaluator (Fallback)';

  const primaryEditorPane = (
    <>
      {playgroundMode && pgSourceLabel && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--info)]/30 bg-[var(--info-soft)] px-3 py-1.5 text-xs">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--info-text)]">
              {activeExampleId ? `☕ Mẫu Tryit (${activeExampleId})` : 'Đang chạy thử từ bài học'}
            </span>
            <span className="truncate font-mono text-[var(--text-secondary)]">
              {pgSourceLabel}
            </span>
            {pgImportBanner && (
              <span className="hidden text-[var(--text-muted)] sm:inline">— {pgImportBanner}</span>
            )}
          </div>
          {!showExamplesDrawer && (
            <button
              type="button"
              onClick={() => setShowExamplesDrawer(true)}
              className="shrink-0 font-semibold text-[var(--info-text)] underline"
            >
              Đổi mẫu khác ({PLAYGROUND_TEMPLATES.length})
            </button>
          )}
        </div>
      )}

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
            <span className="hidden font-mono text-xs text-[var(--text-dim)] xl:inline">
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
              autoComplete="off"
              spellCheck={false}
              placeholder="Ví dụ: Student hoặc Student.java…"
              className="min-h-[38px] sm:min-h-[34px] flex-1 rounded border border-[var(--border-default)] bg-[var(--bg-code)] px-2.5 py-1 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
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

      {!playgroundMode && !showDiff && activeFile === 'interface' && hasInterfaceFile ? (
        <div className="flex min-h-[290px] flex-1 flex-col gap-3 overflow-auto p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--info)]/35 bg-[var(--info-soft)] p-3">
            <div className="space-y-0.5">
              <div className="font-semibold text-[var(--info-text)]">
                🔒 {activePe!.interfaceFileName} — Interface biên dịch sẵn (Chỉ đọc)
              </div>
              <p className="text-[var(--text-secondary)]">
                Trên máy chấm PEA/EOS thật, file này đã có sẵn dạng bytecode (.class). Chỉ dùng để tham chiếu chữ ký hàm — không tạo lại file khi nộp bài.
              </p>
            </div>
            <CopyCodeButton
              code={activePe!.interfaceCode!}
              label="Copy Interface"
              copiedLabel="Đã chép"
            />
          </div>
          <pre className="flex-1 whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 font-mono leading-relaxed text-[var(--text-primary)]">
            {activePe!.interfaceCode}
          </pre>
        </div>
      ) : playgroundMode || !showDiff ? (
        <>
          <JavaCodeEditor
            value={activeCode}
            onChange={(val) =>
              playgroundMode && activePgFile
                ? updatePlaygroundCode(activePgFile.id, val)
                : updateCodeAndScheduleDraft(activeFile, val)
            }
            onBlur={playgroundMode ? flushPlaygroundDraft : flushLatestDraft}
            onRunShortcut={() => void handleRunCode()}
            onLimitReached={handleCodeLimitReached}
            maxLength={MAX_CODE_CHARS}
            theme={theme}
            diagnostics={activeFileDiagnostics}
            jumpTarget={jumpTarget}
            minHeight={playgroundMode ? 320 : 280}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs">
            <div className="flex min-w-0 items-center gap-2 text-[var(--text-muted)]">
              <span
                translate="no"
                className="truncate font-mono font-semibold text-[var(--text-primary)]"
              >
                {activeFileName}
              </span>
              <span className="font-mono tabular-nums text-[var(--text-dim)]">
                {activeCode.split(/\r?\n/).length} dòng
              </span>
              <span className="hidden font-mono text-[var(--text-dim)] xl:inline">
                Ctrl+Enter để chạy
              </span>
            </div>
            <CodeCharLimitMeter
              current={activeCode.length}
              max={MAX_CODE_CHARS}
              limitHitNonce={charLimitHitNonce}
            />
          </div>
        </>
      ) : (
        <div className="grid min-h-[320px] flex-1 grid-cols-1 gap-3 overflow-auto p-4 text-xs md:grid-cols-2">
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
    </>
  );

  const secondaryOutputPane = (
    <div className="flex flex-1 flex-col gap-2.5 p-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            {playgroundMode ? 'Kết quả chạy (Output)' : 'Console & Kết quả Test PE'}
          </span>
          <span
            title="Biên dịch & chạy thật trên Vercel OpenJDK Sandbox hoặc Piston/Judge0 Fallback."
            className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)]"
          >
            {engineBadgeLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
          <button
            type="button"
            onClick={() => {
              setConsoleOutput('');
              setDiagnostics([]);
              setCloudTestResults([]);
              setConsoleStatus('Đã xóa Output');
              setConsoleTone('muted');
            }}
            aria-label="Xóa output console"
            className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <Eraser className="h-3 w-3" aria-hidden="true" />
            <span>Xóa</span>
          </button>
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
            spellCheck={false}
            placeholder="Ví dụ: An&#10;9.25…"
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-code)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
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
          className="grid grid-cols-1 gap-2"
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

      <pre
        data-testid="studio-output-terminal"
        className="min-h-[180px] flex-1 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3.5 font-mono text-[13px] leading-relaxed text-[var(--text-primary)]"
      >
        {consoleOutput || '(Output trống)'}
      </pre>

      <p className="text-xs text-[var(--text-dim)]">
        {playgroundMode ? (
          <>
            W3Schools-style Tryit · OpenJDK Sandbox &amp; Fallback Runner. Lệnh máy local:{' '}
            <code className="text-[var(--text-muted)]">{javacCommand}</code>
          </>
        ) : (
          <>
            Hybrid 2 lớp: biên dịch &amp; chấm Test Case thật trên{' '}
            <strong>OpenJDK Sandbox</strong> + phân tích Clean Code tức thì bởi{' '}
            <strong>Static Pattern Evaluator</strong>. Lệnh máy local:{' '}
            <code className="text-[var(--text-muted)]">{javacCommand}</code>
          </>
        )}
      </p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Studio Sub-toolbar */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 sm:px-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <Link
              to="/pe"
              className="inline-flex min-h-[40px] sm:min-h-[36px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← Kho đề PE
            </Link>

            <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-0.5">
              <button
                type="button"
                onClick={() => {
                  flushLatestDraft();
                  navigate('/studio/playground?example=demo-intro');
                }}
                className={[
                  'min-h-[36px] sm:min-h-[32px] rounded-md px-2.5 py-1 font-semibold transition-colors',
                  playgroundMode
                    ? 'bg-[var(--success)] font-bold text-[#1C1917]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                ☕ Java Tryit
              </button>
              <button
                type="button"
                onClick={() => {
                  flushPlaygroundDraft();
                  navigate(`/studio/${activePe?.id ?? 1}`);
                }}
                className={[
                  'min-h-[36px] sm:min-h-[32px] rounded-md px-2.5 py-1 font-semibold transition-colors',
                  !playgroundMode
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                🎯 Luyện Đề PE
              </button>
            </div>

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
              className="min-h-[40px] sm:min-h-[36px] min-w-0 w-full sm:w-auto sm:max-w-[260px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-bold text-[var(--text-primary)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <option value="playground">
                ☕ Java Tryit (Tự do · tối đa {MAX_PLAYGROUND_FILES} file)
              </option>
              {challengesByPaper.map(([paperName, groupItems]) => (
                <optgroup key={paperName} label={`Bộ đề ${paperName}`}>
                  {groupItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {!playgroundMode && (
              <div className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono tabular-nums">
                <Timer className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
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
                  {timerRunning ? <Pause className="h-3 w-3" aria-hidden="true" /> : <Play className="h-3 w-3" aria-hidden="true" />}
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
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <span
              role="status"
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-muted)]"
            >
              {playgroundMode
                ? pgDraftState === 'saving'
                  ? 'Đang lưu…'
                  : pgDraftState === 'saved'
                    ? '✓ Đã lưu Playground'
                    : 'Mẫu gốc'
                : draftState === 'saving'
                  ? 'Đang lưu nháp…'
                  : draftState === 'saved'
                    ? '✓ Đã lưu nháp'
                    : 'Code gốc'}
            </span>

            {playgroundMode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowExamplesDrawer((s) => !s)}
                  aria-expanded={showExamplesDrawer}
                  className={[
                    'inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition-colors',
                    showExamplesDrawer
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mẫu ({PLAYGROUND_TEMPLATES.length})</span>
                </button>

                <StretchySwitch
                  checked={autoRun}
                  onChange={setAutoRun}
                  label="Auto-Run"
                  title="Tự động chạy khi mở mẫu mới"
                />

                <button
                  type="button"
                  onClick={() => void handleSharePlayground()}
                  className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Chia sẻ</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() =>
                setSplitOrientation((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))
              }
              aria-label="Xoay bố cục Ngang hoặc Dọc"
              title={
                splitOrientation === 'horizontal'
                  ? 'Đang chia Trái / Phải — bấm để xếp Trên / Dưới'
                  : 'Đang xếp Trên / Dưới — bấm để chia Trái / Phải'
              }
              className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {splitOrientation === 'horizontal' ? (
                <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Rows2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{splitOrientation === 'horizontal' ? 'Ngang ⇄ Dọc' : 'Dọc ⇄ Ngang'}</span>
            </button>

            <MorphActionButton
              label="▶ Run Code"
              variant={playgroundMode ? 'primary' : 'secondary'}
              className={playgroundMode ? '!bg-[var(--success)] !text-[#1C1917] hover:opacity-90' : ''}
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
                  ? 'Khôi phục mẫu hiện tại về bản gốc'
                  : 'Khôi phục code gốc (Starter Code)'
              }
              className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {playgroundMode ? '↺ Khôi phục mẫu' : '↺ Khôi phục gốc'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Pane Workspace with Optional Side Drawers */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
        {/* Left Drawer: 15 Playground Examples OR PE Problem & Theory */}
        {(!playgroundMode || showExamplesDrawer) && (
          <aside className="w-full shrink-0 space-y-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 text-xs lg:w-72 lg:border-b-0 lg:border-r">
            {playgroundMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      Java Tryit ({PLAYGROUND_TEMPLATES.length} mẫu)
                    </div>
                    <p className="text-[var(--text-muted)]">Chọn mẫu để nạp vào Split-Pane</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExamplesDrawer(false)}
                    aria-label="Đóng danh sách mẫu"
                    className="rounded border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    ✕
                  </button>
                </div>

                <input
                  type="search"
                  value={exampleSearch}
                  onChange={(e) => setExampleSearch(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Tìm mẫu Java theo tên hoặc Slot"
                  placeholder="Tìm theo Slot (vd: Slot 09) hoặc từ khóa…"
                  className="min-h-[38px] sm:min-h-[34px] w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                />

                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_CATEGORIES.map((cat) => {
                    const active = exampleCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setExampleCategory(cat)}
                        className={[
                          'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                            : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                        ].join(' ')}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                <div className="max-h-[480px] space-y-1.5 overflow-y-auto overscroll-contain pr-1">
                  {filteredTemplates.length === 0 ? (
                    <div className="space-y-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 text-center text-[var(--text-muted)]">
                      <div>Không tìm thấy mẫu khớp "{exampleSearch}".</div>
                      <button
                        type="button"
                        onClick={() => {
                          setExampleSearch('');
                          setExampleCategory('Tất cả');
                        }}
                        className="rounded border border-[var(--border-default)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-text)] hover:border-[var(--accent)]"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  ) : (
                    filteredTemplates.map((tpl) => {
                      const isSelected = activeExampleId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectPlaygroundTemplate(tpl.id)}
                          className={[
                            'w-full rounded-lg border p-2.5 text-left transition-colors',
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                              : 'border-[var(--border-default)] bg-[var(--bg-canvas)] hover:border-[var(--accent)]',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {tpl.title}
                            </span>
                            <span className="shrink-0 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent-text)]">
                              {tpl.slotRef}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {tpl.subtitle}
                          </div>
                        </button>
                      );
                    })
                  )}
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
                    <div className="flex flex-col gap-1.5 pt-1">
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
                      <Link
                        to="/pro192/pe-patterns"
                        className="inline-block font-medium text-[var(--accent-text)] underline"
                      >
                        📘 Bí kíp &amp; 7 Khuôn mẫu PE (JDK 8) →
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        )}

        {/* Center Tryit Split-Pane: Resizable Code Editor <-> Live Output Terminal */}
        <TryitSplitPane
          orientation={splitOrientation}
          splitPercent={splitPercent}
          onSplitChange={setSplitPercent}
          primaryPane={primaryEditorPane}
          secondaryPane={secondaryOutputPane}
        />

        {/* Right Drawer: AI Code Mentor */}
        {showAiPane && (
          <aside className="flex w-full shrink-0 flex-col justify-between gap-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs lg:w-80 lg:border-l lg:border-t-0">
            <div className="max-h-[460px] space-y-3 overflow-y-auto overscroll-contain pr-1">
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
                      ☕ Trợ lý Java Tryit Playground
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
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Hỏi AI Mentor về mã nguồn Java"
                  placeholder="Hỏi AI về code của bạn…"
                  className="min-h-[40px] sm:min-h-[36px] flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
                />
                <button
                  type="submit"
                  disabled={aiBusy}
                  className="min-h-[40px] sm:min-h-[36px] rounded-lg bg-[var(--info)] px-3 py-1.5 font-bold text-[#1C1917] disabled:opacity-50"
                >
                  {aiBusy ? '…' : 'Gửi'}
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
