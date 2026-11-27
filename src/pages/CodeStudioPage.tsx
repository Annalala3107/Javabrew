import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FilePlus2,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { CodeDiffView } from '../components/CodeDiffView';
import { JavaCodeEditor, MAX_CODE_CHARS, type JumpTarget } from '../components/JavaCodeEditor';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { TryitSplitPane } from '../components/TryitSplitPane';
import { CodeCharLimitMeter } from '../components/lucian/CodeCharLimitMeter';
import { CopyCodeButton } from '../components/lucian/CopyCodeButton';
import { LucianChecklistItem } from '../components/lucian/LucianChecklistItem';
import { SlidingPillTabs } from '../components/lucian/SlidingPillTabs';
import { StudioAiMentorPane } from '../components/studio/StudioAiMentorPane';
import { StudioExamplesDrawer } from '../components/studio/StudioExamplesDrawer';
import { StudioOutputConsole } from '../components/studio/StudioOutputConsole';
import { StudioToolbar } from '../components/studio/StudioToolbar';
import { useApp } from '../context/AppContext';
import { useStudioAiMentor } from '../hooks/useStudioAiMentor';
import { useStudioTimer } from '../hooks/useStudioTimer';
import {
  checkJavaSandboxHealth,
  runJavaInCloud,
  type JavaDiagnostic,
  type JavaTestCaseResult,
} from '../services/javaCompilerService';
import { hasMainMethod, inferJavaFileName, validateJavaPolicy } from '../utils/javaFiles';
import {
  MAX_PLAYGROUND_FILES,
  PLAYGROUND_TEMPLATES,
  clearPlaygroundWorkspace,
  cloneTemplateFiles,
  decodePlaygroundShareParam,
  encodePlaygroundShareParam,
  evaluateExpectedOutput,
  findPlaygroundTemplate,
  readPlaygroundWorkspace,
  savePlaygroundWorkspace,
  validateNewJavaFileName,
  type PlaygroundDrillContext,
  type PlaygroundFile,
  type PlaygroundWorkspaceState,
} from '../utils/javaPlayground';
import { evaluatePeCode, type PeDiagnosisCard, type PeEvaluationResult } from '../utils/peEvaluator';
import { clearPeDraft, readPeDraft, savePeDraft } from '../utils/studioDrafts';
import { stageFileToSlug } from '../utils/text';

interface CodeStudioPageProps {
  isPlayground?: boolean;
}

interface PlaygroundRouteState {
  playgroundImport?: PlaygroundWorkspaceState;
  note?: string;
  drillContext?: PlaygroundDrillContext;
}

const STORAGE_ORIENTATION = 'javabrew:studio_orientation';
const STORAGE_SPLIT = 'javabrew:studio_split';
const STORAGE_AUTORUN = 'javabrew:studio_autorun';

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

export function CodeStudioPage({ isPlayground = false }: CodeStudioPageProps) {
  const { peId } = useParams<{ peId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    pro192,
    metaError,
    retryMeta,
    theme,
    byokKey,
    aiModel,
    aiServerStatus,
    refreshAiServerStatus,
    updateAiServerQuota,
    progress,
    setIsSettingsOpen,
    markPeStatus,
    toggleDrillCompleted,
    addMistake,
    recordVisit,
    pushToast,
  } = useApp();

  const playgroundMode = isPlayground || peId === 'playground';
  const urlExampleId = searchParams.get('example');
  const urlSharedCode = searchParams.get('code');

  const challenges = useMemo(() => pro192?.peChallenges ?? [], [pro192]);
  const rawPeParam = peId;
  const parsedPeId = rawPeParam ? Number(rawPeParam) : 1;
  const isInvalidPeParam =
    !playgroundMode &&
    rawPeParam !== undefined &&
    (!Number.isInteger(parsedPeId) ||
      parsedPeId < 1 ||
      (challenges.length > 0 && !challenges.some((c) => c.id === parsedPeId)));
  const numericId = Number.isInteger(parsedPeId) && parsedPeId > 0 ? parsedPeId : 1;
  const activePe = useMemo(
    () =>
      playgroundMode || isInvalidPeParam
        ? null
        : challenges.find((c) => c.id === numericId) || challenges[0] || null,
    [playgroundMode, isInvalidPeParam, challenges, numericId]
  );

  const [leftTab, setLeftTab] = useState<'spec' | 'theory'>('spec');
  const [activeFile, setActiveFile] = useState<'main' | 'entity' | 'interface'>('main');
  const [showAiPane, setShowAiPane] = useState(() => !playgroundMode);
  const [showExamplesDrawer, setShowExamplesDrawer] = useState(
    () => playgroundMode && !urlExampleId && !(location.state as PlaygroundRouteState | null)?.playgroundImport?.files?.length
  );
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
  const [activeDrillContext, setActiveDrillContext] = useState<PlaygroundDrillContext | null>(() => {
    const routeState = location.state as PlaygroundRouteState | null;
    return routeState?.drillContext || routeState?.playgroundImport?.drillContext || initialPg.drillContext || null;
  });
  const [drillMatchResult, setDrillMatchResult] = useState<{
    matched: boolean;
    firstMismatch?: { lineIndex: number; expected: string; actual: string };
  } | null>(null);
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

  const {
    secondsLeft,
    timerRunning,
    toggleTimer,
    resetTimer,
    formattedClock,
  } = useStudioTimer({
    initialSeconds: suggestedMinutes * 60,
    autoStart: false,
    disabled: playgroundMode,
    onExpire: () =>
      pushToast({
        title: 'Hết giờ làm bài PE!',
        description: 'Bạn vẫn có thể tiếp tục hoàn thiện code và bấm Chấm Test Case.',
        tone: 'warn',
      }),
  });

  useEffect(() => {
    void refreshAiServerStatus();
  }, [refreshAiServerStatus]);

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

  // Handle incoming code from "Chạy thử" in lesson/docs pages
  useEffect(() => {
    if (!playgroundMode) return;
    const routeState = location.state as PlaygroundRouteState | null;
    if (!routeState?.playgroundImport?.files?.length) return;
    if (appliedImportKeyRef.current === location.key) return;

    appliedImportKeyRef.current = location.key;
    const incoming = routeState.playgroundImport;
    const incomingDrill = routeState.drillContext || incoming.drillContext || null;
    window.clearTimeout(pgDraftTimerRef.current);
    setPlaygroundFiles(incoming.files);
    setPgActiveFileId(incoming.activeFileId || incoming.files[0].id);
    setStdinInput(incoming.stdin || '');
    setShowStdin(Boolean(incoming.stdin));
    setPgSourceLabel(incoming.sourceLabel);
    setActiveDrillContext(incomingDrill);
    setDrillMatchResult(null);
    setPgImportBanner(routeState.note || 'Đã nạp đoạn mã từ bài học vào Java Playground.');
    setActiveExampleId(null);
    setShowExamplesDrawer(false);
    setPgDraftState('saved');
    const persistedImport: PlaygroundWorkspaceState = {
      ...incoming,
      drillContext: incomingDrill || undefined,
    };
    latestPgRef.current = { state: persistedImport, dirty: false };
    savePlaygroundWorkspace(persistedImport);

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
        setActiveDrillContext(null);
        setDrillMatchResult(null);
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
        setActiveDrillContext(null);
        setDrillMatchResult(null);
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

  // Record last visited route for Dashboard resume banner
  useEffect(() => {
    if (playgroundMode) {
      recordVisit({
        path: activeExampleId ? `/studio/playground?example=${activeExampleId}` : '/studio/playground',
        title: activeExampleId ? `JavaBrew Live Lab (${activeExampleId})` : 'JavaBrew Live Lab',
        kind: 'studio',
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (!activePe) return;
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
    const mergedState: PlaygroundWorkspaceState =
      'drillContext' in nextState || !activeDrillContext
        ? nextState
        : { ...nextState, drillContext: activeDrillContext };
    latestPgRef.current = { state: mergedState, dirty: !immediate };
    window.clearTimeout(pgDraftTimerRef.current);
    if (immediate) {
      savePlaygroundWorkspace(mergedState);
      setPgDraftState('saved');
      return;
    }
    setPgDraftState('saving');
    pgDraftTimerRef.current = window.setTimeout(() => {
      savePlaygroundWorkspace(mergedState);
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
      drillContext: activeDrillContext || undefined,
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

    if (target === 'main') setMainCode(safeValue);
    else setEntityCode(safeValue);

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

  const relatedSlotsList = useMemo(() => {
    if (!activePe || !pro192 || activePe.relatedSlots.length === 0) return [];
    return pro192.slots.filter((s) => activePe.relatedSlots.includes(s.slot));
  }, [activePe, pro192]);

  const relatedSlot = relatedSlotsList[0] ?? null;

  const theoryTraps = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const sl of relatedSlotsList) {
      for (const trap of sl.examTraps ?? []) {
        if (trap && !seen.has(trap)) {
          seen.add(trap);
          out.push(trap);
        }
      }
    }
    return out.slice(0, 4);
  }, [relatedSlotsList]);

  const theoryObjectives = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const sl of relatedSlotsList) {
      for (const obj of sl.objectives ?? []) {
        if (obj && !seen.has(obj)) {
          seen.add(obj);
          out.push(obj);
        }
      }
    }
    return out.slice(0, 3);
  }, [relatedSlotsList]);

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

  const getFilesForAiContext = (): Array<{ name: string; content: string }> =>
    playgroundMode
      ? playgroundEffectiveFiles.map((f) => ({ name: f.name, content: f.content }))
      : [
          { name: mainFileName, content: mainCode },
          ...(hasEntityFile && entityFileName ? [{ name: entityFileName, content: entityCode }] : []),
          ...(hasInterfaceFile && activePe?.interfaceFileName && activePe.interfaceCode
            ? [{ name: activePe.interfaceFileName, content: activePe.interfaceCode }]
            : []),
        ];

  const {
    chatInput,
    setChatInput,
    pendingPrompt,
    chatHistory,
    aiBusy,
    mentorStyle,
    clearChat,
    resetTrackingOnModeSwitch,
    resetSessionOnPeChange,
    handleMentorStyleChange,
    sendAiPrompt,
    handleAskDiagnostic,
    handleAskFailedTest,
    handleAskCleanCodeReview,
    abortActiveAi,
  } = useStudioAiMentor({
    playgroundMode,
    canRunContext: playgroundMode || Boolean(activePe),
    title: playgroundMode
      ? pgSourceLabel || `JavaBrew Live Lab (${activeFileName})`
      : `${activePe?.code ?? 'PE'}: ${activePe?.title ?? ''}`,
    description: playgroundMode ? undefined : activePe?.desc,
    checklist: playgroundMode ? undefined : activePe?.checklist,
    activeFileName,
    getFilesForAiContext,
    diagnostics,
    testResults: cloudTestResults,
    diagnosisCards,
    byokKey,
    aiModel,
    aiServerStatus,
    updateAiServerQuota,
    onOpenAiPane: () => setShowAiPane(true),
  });

  // Sync AI Mentor, drawer, and run state cleanly when switching between PE <-> Playground
  useEffect(() => {
    if (prevPlaygroundModeRef.current === playgroundMode) return;
    prevPlaygroundModeRef.current = playgroundMode;
    runAbortRef.current?.abort();
    resetTrackingOnModeSwitch();
    setShowDiff(false);
    setDiagnostics([]);
    setCloudTestResults([]);
    setLastTiming(null);
    setShowAiPane(!playgroundMode);
    if (!playgroundMode) {
      setShowExamplesDrawer(false);
    }
  }, [playgroundMode, resetTrackingOnModeSwitch]);

  // Hydrate PE starter/draft cleanly on PE selection without mutating state during render
  useEffect(() => {
    if (playgroundMode || !activePe || loadedPeId === activePe.id) return;

    runAbortRef.current?.abort();
    resetSessionOnPeChange();
    if (latestDraftRef.current && latestDraftRef.current.peId !== activePe.id) {
      flushLatestDraft();
    }

    const draft = readPeDraft(activePe.id);
    const initMain = draft ? draft.mainCode : activePe.starterCode;
    const initEntity = draft ? draft.entityCode : activePe.entityCode;
    const isModified =
      draft !== null &&
      (draft.mainCode !== activePe.starterCode || draft.entityCode !== activePe.entityCode);

    latestDraftRef.current = {
      peId: activePe.id,
      main: initMain,
      entity: initEntity,
      dirty: false,
    };

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
    resetTimer(suggestedMinutes * 60, false);

    const initialEval = evaluatePeCode(activePe.id, initMain, initEntity);
    setDiagnosisCards(initialEval.diagnosisCards);
  }, [playgroundMode, activePe, loadedPeId, suggestedMinutes, resetSessionOnPeChange, resetTimer]);

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
        setConsoleStatus('✔ Static Preview đạt cấu trúc (chưa chạy JVM)');
        setConsoleTone('green');
        return true;
      }
      setConsoleStatus('✕ Cảnh báo cấu trúc / Thiếu điều kiện (Static Preview)');
      setConsoleTone('red');
      if (staticRes.detectedMistake) addMistake(staticRes.detectedMistake);
      return false;
    }

    setConsoleStatus(staticRes.statusText);
    if (progress.peStatus[activePe.id] !== 'pass') {
      markPeStatus(activePe.id, 'in-progress');
    }

    if (staticRes.allPassed) {
      setConsoleTone('amber');
      pushToast({
        title: `Static Preview ${activePe.code} đạt 3/3 cấu trúc`,
        description:
          'Chế độ Static không cấp Pass chính thức — hãy chạy OpenJDK hoặc dùng lệnh javac local để kiểm chứng.',
        tone: 'info',
      });
      return false;
    }

    setConsoleTone('amber');
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
    setDrillMatchResult(null);
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
        if (activeDrillContext) {
          setDrillMatchResult(
            evaluateExpectedOutput(res.stdout, activeDrillContext.expectedOutputLines)
          );
        }
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

    const filesToSend =
      !hasEntityFile || !entityFileName || mainFileName === entityFileName
        ? [{ name: mainFileName, content: mainCode }]
        : [
            { name: mainFileName, content: mainCode },
            { name: entityFileName, content: entityCode },
          ];

    // Track 1 (0ms): Dual-Track Static Policy Gate + Clean-Code Coach
    const staticRes = evaluatePeCode(activePe.id, mainCode, entityCode);
    const policyViolations = validateJavaPolicy(filesToSend, activePe.id);
    setDiagnosisCards(staticRes.diagnosisCards);

    if (engineMode === 'static') {
      return applyStaticFallback(mode, staticRes);
    }

    const pkgViolation = policyViolations.find((v) => v.code === 'PACKAGE_FORBIDDEN');
    const binViolation =
      mode === 'grade' ? policyViolations.find((v) => v.code === 'PE3_Q4_BINARY_API') : undefined;
    const blockingViolation = pkgViolation || binViolation;

    if (blockingViolation) {
      setLastTiming(null);
      setDiagnostics([
        {
          file: blockingViolation.file,
          line: blockingViolation.line,
          column: 1,
          severity: 'error',
          message: blockingViolation.message,
        },
      ]);
      setCloudTestResults(
        mode === 'grade'
          ? [
              {
                id: 'POLICY',
                name:
                  blockingViolation.code === 'PACKAGE_FORBIDDEN'
                    ? 'Quy chế default package (không khai báo package)'
                    : 'Quy chế PE3-Q4: Tự viết thuật toán đổi nhị phân thủ công',
                passed: false,
                durationMs: 0,
                expected:
                  blockingViolation.code === 'PACKAGE_FORBIDDEN'
                    ? 'Không có câu lệnh package'
                    : 'Dùng vòng lặp % 2 và / 2',
                actual: `${blockingViolation.file}:${blockingViolation.line}`,
                error: blockingViolation.message,
              },
            ]
          : []
      );
      setConsoleStatus('✕ Vi phạm quy chế PE (Hard Policy Gate)');
      setConsoleTone('red');
      setConsoleOutput(blockingViolation.message);
      if (progress.peStatus[activePe.id] !== 'pass') {
        markPeStatus(activePe.id, 'in-progress');
      }
      addMistake({
        type: 'runtime',
        title: `Vi phạm quy chế ${activePe.code}`,
        detail: blockingViolation.message,
        peId: activePe.id,
      });
      return false;
    }

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    setIsExecuting(true);
    setDiagnostics([]);
    setCloudTestResults([]);
    setLastTiming(null);
    setConsoleStatus('☕ Đang biên dịch trên OpenJDK Sandbox (--release 8)...');
    setConsoleTone('amber');
    setConsoleOutput('Đang khởi chạy môi trường OpenJDK (--release 8) và biên dịch mã nguồn...');

    try {
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
        engineLabel: res.jdkVersion || 'OpenJDK 21 (--release 8)',
      });

      if (res.phase === 'compile') {
        setDiagnostics(res.diagnostics);
        setCloudTestResults([]);
        setConsoleStatus(`✕ Lỗi biên dịch javac (${res.compileMs}ms)`);
        setConsoleTone('red');
        setConsoleOutput(res.stderr || res.stdout || 'Biên dịch javac thất bại.');
        if (mode === 'grade' && progress.peStatus[activePe.id] !== 'pass') {
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
          if (progress.peStatus[activePe.id] !== 'pass') {
            markPeStatus(activePe.id, 'in-progress');
          }
          return false;
        }

        if (allPassed) {
          setConsoleStatus(`✔ ${passedCount}/${totalCount} Test Cases PASSED! (OpenJDK 21)`);
          setConsoleTone('green');
          markPeStatus(activePe.id, 'pass');
          setDiagnosisCards([
            {
              id: `pe${activePe.id}-cloud-pass`,
              tone: 'green',
              title: `✔ OpenJDK JDK 8 xác nhận PASS ${passedCount}/${totalCount} Test Cases!`,
              description:
                staticRes.softWarnings.length > 0
                  ? 'Bài làm đã vượt qua toàn bộ kiểm thử thật trên JVM. Xem thêm gợi ý phòng test ẩn bên dưới.'
                  : 'Bài làm chuẩn xác cả logic thực thi JDK 1.8 lẫn quy chế PE.',
            },
            ...staticRes.softWarnings,
          ]);
          pushToast({
            title: `Chúc mừng! Đã Pass ${activePe.code}`,
            description: `${passedCount}/${totalCount} test cases thật trên OpenJDK (JDK 8)`,
            tone: 'success',
          });
          return true;
        }

        setConsoleStatus(`${passedCount}/${totalCount || 3} Test Cases Passed (OpenJDK 21)`);
        setConsoleTone('amber');
        if (progress.peStatus[activePe.id] !== 'pass') {
          markPeStatus(activePe.id, 'in-progress');
        }
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
        '⚡ Gặp sự cố kết nối OpenJDK Sandbox — đã tự động chuyển về Static Preview.'
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
      drillContext: activeDrillContext || undefined,
    };
    const prevExampleId = activeExampleId;
    const prevDrillContext = activeDrillContext;
    const { template, files } = cloneTemplateFiles(templateId);

    appliedQueryKeyRef.current = `ex:${template.id}`;
    setSearchParams({ example: template.id }, { replace: true });
    setPlaygroundFiles(files);
    setPgActiveFileId(files[0].id);
    setStdinInput(template.stdin);
    setShowStdin(template.stdin.length > 0);
    setPgSourceLabel(template.title);
    setActiveDrillContext(null);
    setDrillMatchResult(null);
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
        drillContext: undefined,
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
        setActiveDrillContext(prevDrillContext);
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
      title: 'Đã chép liên kết JavaBrew Live Lab!',
      description: isUnmodifiedTemplate ? `Mẫu: ${matchedTemplate.title}` : 'Link chứa đầy đủ mã nguồn của bạn.',
      tone: 'success',
    });
  };

  const handleApplyCleanCode = () => {
    if (!activePe) return;
    const prevMain = mainCode;
    const prevEntity = entityCode;
    const nextEntity = hasEntityFile ? activePe.entityCode : entityCode;

    setMainCode(activePe.cleanCode);
    if (hasEntityFile) {
      setEntityCode(nextEntity);
    }
    savePeDraft(activePe.id, activePe.cleanCode, nextEntity);
    setDraftState('saved');
    if (latestDraftRef.current) {
      latestDraftRef.current = {
        peId: activePe.id,
        main: activePe.cleanCode,
        entity: nextEntity,
        dirty: false,
      };
    }
    setActiveFile('main');
    setShowDiff(false);
    setDiagnostics([]);
    setCloudTestResults([]);
    const res = evaluatePeCode(activePe.id, activePe.cleanCode, nextEntity);
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
      undoLabel: 'Hoàn tác',
      onUndo: () => {
        setMainCode(prevMain);
        setEntityCode(prevEntity);
        savePeDraft(activePe.id, prevMain, prevEntity);
        setDraftState('saved');
        latestDraftRef.current = {
          peId: activePe.id,
          main: prevMain,
          entity: prevEntity,
          dirty: false,
        };
        setDiagnosisCards(evaluatePeCode(activePe.id, prevMain, prevEntity).diagnosisCards);
      },
    });
  };

  const handleRestoreEntityCode = () => {
    if (!activePe || !hasEntityFile) return;
    const prevEntity = entityCode;
    setEntityCode(activePe.entityCode);
    savePeDraft(activePe.id, mainCode, activePe.entityCode);
    setDraftState('saved');
    latestDraftRef.current = {
      peId: activePe.id,
      main: mainCode,
      entity: activePe.entityCode,
      dirty: false,
    };
    setDiagnostics([]);
    pushToast({
      title: `Đã khôi phục ${entityFileName} gốc đề bài`,
      tone: 'info',
      undoLabel: 'Hoàn tác',
      onUndo: () => {
        setEntityCode(prevEntity);
        savePeDraft(activePe.id, mainCode, prevEntity);
        setDraftState('saved');
        latestDraftRef.current = {
          peId: activePe.id,
          main: mainCode,
          entity: prevEntity,
          dirty: false,
        };
      },
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
        drillContext: activeDrillContext || undefined,
      };
      const prevDrillContext = activeDrillContext;
      const targetId = activeExampleId || PLAYGROUND_TEMPLATES[0].id;
      const { template, files } = cloneTemplateFiles(targetId);
      window.clearTimeout(pgDraftTimerRef.current);
      clearPlaygroundWorkspace();
      setPlaygroundFiles(files);
      setPgActiveFileId(files[0].id);
      setStdinInput(template.stdin);
      setShowStdin(template.stdin.length > 0);
      setPgSourceLabel(template.title);
      setActiveDrillContext(null);
      setDrillMatchResult(null);
      setPgImportBanner(null);
      setPgDraftState('clean');
      latestPgRef.current = {
        state: { files, activeFileId: files[0].id, stdin: template.stdin, sourceLabel: template.title },
        dirty: false,
      };
      setDiagnostics([]);
      setJumpTarget(null);
      setLastTiming(null);
      setConsoleStatus(`JavaBrew Live Lab · Đã khôi phục mẫu ${template.title}`);
      setConsoleTone('muted');
      setConsoleOutput('Nhấn "▶ Run Code" để biên dịch và chạy mẫu này.');
      pushToast({
        title: 'Đã khôi phục mẫu mặc định',
        tone: 'info',
        undoLabel: 'Hoàn tác',
        onUndo: () => {
          setActiveDrillContext(prevDrillContext);
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

  if (isInvalidPeParam) {
    return (
      <div
        role="alert"
        className="mx-auto my-8 max-w-lg space-y-3 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-6 text-center text-xs"
      >
        <h1 className="text-base font-bold text-[var(--text-primary)]">
          Không tìm thấy đề PE “{rawPeParam}”
        </h1>
        <p className="text-[var(--text-muted)]">
          Mã đề PE không hợp lệ hoặc nằm ngoài bộ 19 câu đề PE hiện có (PE1–PE5).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Link
            to="/pe"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
          >
            ← Về Kho Đề PE
          </Link>
          <Link
            to="/studio/1"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3.5 py-1.5 font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
          >
            Mở PE1-Q1
          </Link>
        </div>
      </div>
    );
  }

  if (!playgroundMode && (!activePe || loadedPeId !== activePe.id)) {
    if (!activePe && metaError) {
      return (
        <div
          role="alert"
          className="mx-auto my-8 max-w-lg space-y-3 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-6 text-center text-xs"
        >
          <p className="font-semibold text-[var(--danger-text)]">{metaError}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={retryMeta}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
            >
              Thử lại
            </button>
            <Link
              to="/studio/playground"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3.5 py-1.5 font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
            >
              Mở JavaBrew Live Lab
            </Link>
          </div>
        </div>
      );
    }
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

  const isActiveDrillDone = activeDrillContext
    ? progress.completedDrills.includes(activeDrillContext.id)
    : false;

  const primaryEditorPane = (
    <>
      {playgroundMode && pgSourceLabel && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--info)]/30 bg-[var(--info-soft)] px-3 py-1.5 text-xs">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--info-text)]">
              {activeExampleId ? `☕ Mẫu Live Lab (${activeExampleId})` : 'Đang chạy thử từ bài học'}
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

      {playgroundMode && activeDrillContext && (
        <div
          data-testid="live-lab-drill-card"
          className="space-y-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Target className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span className="font-bold text-[var(--text-primary)]">
                Thực hành {activeDrillContext.id}: {activeDrillContext.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={activeDrillContext.backUrl}
                className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                <span>Quay lại Slot {activeDrillContext.slot}</span>
              </Link>
              <button
                type="button"
                aria-label="Đóng thẻ mục tiêu thực hành"
                onClick={() => {
                  setActiveDrillContext(null);
                  setDrillMatchResult(null);
                  schedulePlaygroundSave(
                    {
                      files: playgroundFiles,
                      activeFileId: pgActiveFileId,
                      stdin: stdinInput,
                      sourceLabel: pgSourceLabel,
                      drillContext: undefined,
                    },
                    true
                  );
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p className="text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Mục tiêu:</strong>{' '}
            {activeDrillContext.goal}
          </p>

          {activeDrillContext.expectedOutputLines.length > 0 && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] px-2.5 py-2">
              <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                Expected Output
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--success-text)]">
                {activeDrillContext.expectedOutputLines.join('\n')}
              </pre>
            </div>
          )}

          {drillMatchResult && (
            <div
              role="status"
              className={
                drillMatchResult.matched
                  ? 'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--success)]/35 bg-[var(--success-soft)] px-2.5 py-1.5 text-[var(--success-text)]'
                  : 'rounded-lg border border-[var(--warning)]/35 bg-[var(--warning-soft)] px-2.5 py-1.5 text-[var(--accent-text)]'
              }
            >
              {drillMatchResult.matched ? (
                <>
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>✔ Output khớp Expected Output!</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDrillCompleted(activeDrillContext.id)}
                    aria-pressed={isActiveDrillDone}
                    className="min-h-[30px] rounded-md bg-[var(--success)] px-2.5 py-1 text-xs font-bold text-[#1C1917] hover:opacity-90"
                  >
                    {isActiveDrillDone
                      ? `✔ Đã hoàn thành Thực hành ${activeDrillContext.id}`
                      : `Đánh dấu hoàn thành Thực hành ${activeDrillContext.id}`}
                  </button>
                </>
              ) : (
                <span>
                  ⚠ Dòng {drillMatchResult.firstMismatch?.lineIndex ?? 1} chưa khớp — Kỳ vọng:{' '}
                  <code>{drillMatchResult.firstMismatch?.expected}</code> · Thực tế:{' '}
                  <code>{drillMatchResult.firstMismatch?.actual}</code>
                </span>
              )}
            </div>
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
            docKey={
              playgroundMode
                ? `pg:${activePgFile?.id || 'main'}`
                : `pe:${activePe!.id}:${activeFile}`
            }
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
                Ctrl+Enter chạy · Esc → Tab thoát
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
        <CodeDiffView
          mainFileName={mainFileName}
          currentMain={mainCode}
          cleanMain={activePe!.cleanCode}
          entityFileName={hasEntityFile ? entityFileName : undefined}
          currentEntity={entityCode}
          cleanEntity={activePe!.entityCode}
          onApplyCleanCode={handleApplyCleanCode}
          onRestoreEntityCode={handleRestoreEntityCode}
        />
      )}
    </>
  );

  const secondaryOutputPane = (
    <StudioOutputConsole
      playgroundMode={playgroundMode}
      engineBadgeLabel={engineBadgeLabel}
      engineMode={engineMode}
      onEngineModeChange={setEngineMode}
      javacCommand={javacCommand}
      onCopiedCommand={() =>
        pushToast({
          title: 'Đã chép lệnh javac local',
          description: javacCommand,
          tone: 'success',
        })
      }
      onClearOutput={() => {
        setConsoleOutput('');
        setDiagnostics([]);
        setCloudTestResults([]);
        setConsoleStatus('Đã xóa Output');
        setConsoleTone('muted');
      }}
      consoleStatus={consoleStatus}
      consoleTone={consoleTone}
      consoleOutput={consoleOutput}
      lastTiming={lastTiming}
      showStdin={showStdin}
      onToggleStdin={() => setShowStdin((s) => !s)}
      stdinInput={stdinInput}
      onStdinChange={(nextStdin) => {
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
      onStdinBlur={() => {
        if (playgroundMode) flushPlaygroundDraft();
      }}
      diagnostics={diagnostics}
      onJumpToDiagnostic={handleJumpToDiagnostic}
      cloudTestResults={cloudTestResults}
      aiBusy={aiBusy}
      onAskDiagnostic={handleAskDiagnostic}
      onAskFailedTest={handleAskFailedTest}
    />
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Studio Sub-toolbar */}
      <StudioToolbar
        playgroundMode={playgroundMode}
        activePeId={activePe?.id}
        challengesByPaper={challengesByPaper}
        maxPlaygroundFiles={MAX_PLAYGROUND_FILES}
        examplesCount={PLAYGROUND_TEMPLATES.length}
        draftState={draftState}
        pgDraftState={pgDraftState}
        secondsLeft={secondsLeft}
        timerRunning={timerRunning}
        formattedClock={formattedClock}
        onToggleTimer={toggleTimer}
        onResetTimer={() => resetTimer(suggestedMinutes * 60, false)}
        showExamplesDrawer={showExamplesDrawer}
        onToggleExamplesDrawer={() => setShowExamplesDrawer((s) => !s)}
        autoRun={autoRun}
        onAutoRunChange={setAutoRun}
        onSharePlayground={() => void handleSharePlayground()}
        splitOrientation={splitOrientation}
        onToggleOrientation={() =>
          setSplitOrientation((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))
        }
        isExecuting={isExecuting}
        onRunCode={handleRunCode}
        onSubmitTests={handleSubmitTests}
        onToggleAiPane={() => setShowAiPane((s) => !s)}
        onReset={handleReset}
        onSwitchToPlayground={() => {
          flushLatestDraft();
          navigate('/studio/playground?example=demo-intro');
        }}
        onSwitchToPe={(peNum) => {
          flushPlaygroundDraft();
          navigate(`/studio/${peNum}`);
        }}
        onSelectModeOrPe={(value) => {
          flushLatestDraft();
          flushPlaygroundDraft();
          if (value === 'playground') {
            navigate('/studio/playground');
          } else {
            navigate(`/studio/${value}`);
          }
        }}
      />

      {/* Main Split-Pane Workspace with Optional Side Drawers */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
        {/* Left Drawer: 15 Playground Examples OR PE Problem & Theory */}
        {(!playgroundMode || showExamplesDrawer) && (
          <aside className="w-full shrink-0 space-y-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 text-xs lg:w-72 lg:border-b-0 lg:border-r">
            {playgroundMode ? (
              <StudioExamplesDrawer
                activeExampleId={activeExampleId}
                onSelectTemplate={handleSelectPlaygroundTemplate}
                onClose={() => setShowExamplesDrawer(false)}
              />
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
                  <div className="space-y-3 leading-relaxed text-[var(--text-muted)]">
                    {theoryTraps.length > 0 ? (
                      <div className="space-y-2">
                        <div className="font-semibold text-[var(--accent-text)]">
                          ⚠ Bẫy thi PE &amp; JDK 8 ({activePe!.code}):
                        </div>
                        <ul className="space-y-1.5">
                          {theoryTraps.map((trap) => (
                            <li
                              key={trap}
                              className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-2.5 text-[var(--text-primary)]"
                            >
                              <MarkdownRenderer content={trap} currentRel="pro192/README.md" compact />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                          <code className="text-[var(--accent-text)]">@Override</code>, chữ ký hàm chuẩn JDK 8 và định
                          dạng <code className="text-[var(--accent-text)]">toString()</code> chính xác
                          từng ký tự.
                        </p>
                      </div>
                    )}

                    {theoryObjectives.length > 0 && (
                      <div className="space-y-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3">
                        <div className="font-semibold text-[var(--text-primary)]">
                          🎯 Mục tiêu kiến thức liên quan:
                        </div>
                        <ul className="space-y-1">
                          {theoryObjectives.map((obj) => (
                            <li key={obj} className="text-[var(--text-secondary)]">
                              <MarkdownRenderer
                                content={`- ${obj}`}
                                currentRel="pro192/README.md"
                                compact
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 pt-1">
                      {relatedSlotsList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {relatedSlotsList.map((sl) => (
                            <Link
                              key={sl.slot}
                              to={`/pro192/${stageFileToSlug(sl.file)}`}
                              className="inline-flex items-center rounded-md border border-[var(--info)]/35 bg-[var(--info-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--info-text)] hover:opacity-90"
                            >
                              Mở Slot {String(sl.slot).padStart(2, '0')} →
                            </Link>
                          ))}
                        </div>
                      ) : relatedSlot ? (
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
          <StudioAiMentorPane
            playgroundMode={playgroundMode}
            activeFileName={activeFileName}
            byokKey={byokKey}
            aiModel={aiModel}
            aiServerStatus={aiServerStatus}
            mentorStyle={mentorStyle}
            onMentorStyleChange={handleMentorStyleChange}
            onAskCleanCodeReview={handleAskCleanCodeReview}
            hasDiagnostics={diagnostics.length > 0}
            hasFailedTests={cloudTestResults.some((t) => !t.passed)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            chatHistory={chatHistory}
            onClearChat={clearChat}
            onClose={() => setShowAiPane(false)}
            diagnosisCards={diagnosisCards}
            revealedHints={revealedHints}
            onToggleHint={(cardId) =>
              setRevealedHints((prev) => ({
                ...prev,
                [cardId]: !prev[cardId],
              }))
            }
            onOpenDiff={() => setShowDiff(true)}
            aiBusy={aiBusy}
            pendingPrompt={pendingPrompt}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendPrompt={(prompt) => void sendAiPrompt(prompt)}
            onAbortAi={abortActiveAi}
          />
        )}
      </div>
    </div>
  );
}
