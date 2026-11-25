import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Lang,
  LearningProgress,
  MistakeItem,
  NavigationData,
  Pro192Data,
  SearchIndexData,
  Theme,
} from '../types/content';

export interface PdfPreviewState {
  title: string;
  pdfUrl: string;
  pptxUrl?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: 'success' | 'info' | 'warn';
  undoLabel?: string;
  onUndo?: () => void;
}

const STORAGE_LANG = 'javabrew:lang';
const STORAGE_THEME = 'javabrew:theme';
const STORAGE_PROGRESS = 'javabrew:progress';
const STORAGE_BYOK = 'javabrew:byok_key';

const DEFAULT_MISTAKES: MistakeItem[] = [
  {
    id: 'seed-pe1-npe',
    type: 'runtime',
    title: 'NullPointerException khi chưa kiểm tra list hoặc object null',
    detail:
      'Hay gặp ở bài PE 01 (filterHonor). Luôn kiểm tra `if (list == null || list.isEmpty())` ở đầu hàm xử lý và `s != null` trước khi gọi getter.',
    peId: 1,
    createdAt: '2026-11-24T00:00:00.000Z',
    resolved: false,
  },
  {
    id: 'seed-pe1-cleancode',
    type: 'cleancode',
    title: 'Gộp nhập, lọc và sắp xếp vào chung 1 hàm dài với nhiều vòng if lồng nhau',
    detail:
      'Nên tách điều kiện hợp lệ thành helper nhỏ hoặc dùng Early Return + Comparator chain để giảm độ sâu lồng khối, dễ debug khi chấm PE.',
    peId: 1,
    createdAt: '2026-11-24T00:00:00.000Z',
    resolved: false,
  },
];

const DEFAULT_PROGRESS: LearningProgress = {
  completedArticles: [],
  completedSlots: [],
  solvedExercises: [],
  completedPe: [],
  bookmarks: [],
  notes: {},
  mistakes: DEFAULT_MISTAKES,
  peStatus: {},
  lastVisited: null,
};

function readInitialLang(): Lang {
  try {
    const val = localStorage.getItem(STORAGE_LANG);
    return val === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
}

function readInitialTheme(): Theme {
  try {
    const val = localStorage.getItem(STORAGE_THEME);
    if (val === 'light' || val === 'dark') return val;
  } catch {
    // ignore storage errors
  }
  return 'dark';
}

function readInitialByokKey(): string {
  try {
    return localStorage.getItem(STORAGE_BYOK) || '';
  } catch {
    return '';
  }
}

function sanitizeProgress(raw: unknown): LearningProgress {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROGRESS;
  const parsed = raw as Partial<LearningProgress>;
  return {
    completedArticles: Array.isArray(parsed.completedArticles) ? parsed.completedArticles : [],
    completedSlots: Array.isArray(parsed.completedSlots) ? parsed.completedSlots : [],
    solvedExercises: Array.isArray(parsed.solvedExercises) ? parsed.solvedExercises : [],
    completedPe: Array.isArray(parsed.completedPe) ? parsed.completedPe : [],
    bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
    notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : DEFAULT_MISTAKES,
    peStatus: parsed.peStatus && typeof parsed.peStatus === 'object' ? parsed.peStatus : {},
    lastVisited: parsed.lastVisited ?? null,
  };
}

function readInitialProgress(): LearningProgress {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS);
    if (!raw) return DEFAULT_PROGRESS;
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function toggleStringItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function toggleNumberItem(list: number[], item: number): number[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

interface AppContextValue {
  navigation: NavigationData | null;
  pro192: Pro192Data | null;
  metaLoading: boolean;
  metaError: string | null;
  retryMeta: () => void;
  searchIndex: SearchIndexData | null;
  loadSearchIndex: () => Promise<SearchIndexData | null>;
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  byokKey: string;
  setByokKey: (key: string) => void;
  progress: LearningProgress;
  toggleArticleCompleted: (rel: string) => void;
  toggleSlotCompleted: (slot: number) => void;
  toggleExerciseSolved: (exId: string) => void;
  togglePeCompleted: (peId: string) => void;
  markPeStatus: (peId: number, status: 'pass' | 'in-progress') => void;
  toggleBookmark: (key: string) => void;
  saveNote: (key: string, value: string) => void;
  addMistake: (item: Omit<MistakeItem, 'id' | 'createdAt'>) => void;
  toggleMistakeResolved: (id: string) => void;
  recordVisit: (visit: NonNullable<LearningProgress['lastVisited']>) => void;
  resetProgress: () => void;
  exportProgressJson: () => string;
  importProgressJson: (raw: string) => boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  pdfPreview: PdfPreviewState | null;
  openPdfPreview: (preview: PdfPreviewState) => void;
  closePdfPreview: () => void;
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [navigation, setNavigation] = useState<NavigationData | null>(null);
  const [pro192, setPro192] = useState<Pro192Data | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [searchIndex, setSearchIndex] = useState<SearchIndexData | null>(null);
  const searchPromiseRef = useRef<Promise<SearchIndexData | null> | null>(null);

  const [lang, setLangState] = useState<Lang>(readInitialLang);
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);
  const [byokKey, setByokKeyState] = useState<string>(readInitialByokKey);
  const [progress, setProgress] = useState<LearningProgress>(readInitialProgress);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeqRef = useRef(0);

  const fetchMetadata = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const [navRes, proRes] = await Promise.all([
        fetch('/metadata/navigation.json'),
        fetch('/metadata/pro192.json'),
      ]);
      if (!navRes.ok || !proRes.ok) {
        throw new Error(`Không thể tải dữ liệu chỉ mục (${navRes.status}/${proRes.status}).`);
      }
      const [navData, proData] = (await Promise.all([
        navRes.json(),
        proRes.json(),
      ])) as [NavigationData, Pro192Data];
      setNavigation(navData);
      setPro192(proData);
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : 'Lỗi tải metadata.');
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetadata();
  }, [fetchMetadata]);

  const loadSearchIndex = useCallback(async (): Promise<SearchIndexData | null> => {
    if (searchIndex) return searchIndex;
    if (searchPromiseRef.current) return searchPromiseRef.current;

    const promise = fetch('/data/search-index.json')
      .then(async (res) => {
        if (!res.ok) throw new Error('Search index unavailable');
        const data = (await res.json()) as SearchIndexData;
        setSearchIndex(data);
        return data;
      })
      .catch(() => null)
      .finally(() => {
        searchPromiseRef.current = null;
      });

    searchPromiseRef.current = promise;
    return promise;
  }, [searchIndex]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_LANG, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.setAttribute('data-theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'light' ? '#faf8f5' : '#121110');
    }
    try {
      localStorage.setItem(STORAGE_THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setByokKey = useCallback((key: string) => {
    const trimmed = key.trim();
    setByokKeyState(trimmed);
    try {
      if (trimmed) localStorage.setItem(STORAGE_BYOK, trimmed);
      else localStorage.removeItem(STORAGE_BYOK);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  const toggleArticleCompleted = useCallback((rel: string) => {
    setProgress((prev) => ({
      ...prev,
      completedArticles: toggleStringItem(prev.completedArticles, rel),
    }));
  }, []);

  const toggleSlotCompleted = useCallback((slot: number) => {
    setProgress((prev) => ({
      ...prev,
      completedSlots: toggleNumberItem(prev.completedSlots, slot),
    }));
  }, []);

  const toggleExerciseSolved = useCallback((exId: string) => {
    setProgress((prev) => ({
      ...prev,
      solvedExercises: toggleStringItem(prev.solvedExercises, exId),
    }));
  }, []);

  const togglePeCompleted = useCallback((peId: string) => {
    setProgress((prev) => {
      const nextCompleted = toggleStringItem(prev.completedPe, peId);
      const numId = Number(peId);
      const nextStatus = { ...prev.peStatus };
      if (!Number.isNaN(numId)) {
        if (nextCompleted.includes(peId)) nextStatus[numId] = 'pass';
        else nextStatus[numId] = 'in-progress';
      }
      return {
        ...prev,
        completedPe: nextCompleted,
        peStatus: nextStatus,
      };
    });
  }, []);

  const markPeStatus = useCallback((peId: number, status: 'pass' | 'in-progress') => {
    const strId = String(peId).padStart(2, '0');
    setProgress((prev) => {
      const nextStatus = { ...prev.peStatus, [peId]: status };
      const hasCompleted =
        prev.completedPe.includes(strId) || prev.completedPe.includes(String(peId));
      let nextCompleted = prev.completedPe;
      if (status === 'pass' && !hasCompleted) {
        nextCompleted = [...prev.completedPe, strId];
      } else if (status !== 'pass' && hasCompleted) {
        nextCompleted = prev.completedPe.filter(
          (x) => x !== strId && x !== String(peId)
        );
      }
      return {
        ...prev,
        peStatus: nextStatus,
        completedPe: nextCompleted,
      };
    });
  }, []);

  const toggleBookmark = useCallback((key: string) => {
    setProgress((prev) => ({
      ...prev,
      bookmarks: toggleStringItem(prev.bookmarks, key),
    }));
  }, []);

  const saveNote = useCallback((key: string, value: string) => {
    setProgress((prev) => ({
      ...prev,
      notes: { ...prev.notes, [key]: value },
    }));
  }, []);

  const addMistake = useCallback((item: Omit<MistakeItem, 'id' | 'createdAt'>) => {
    setProgress((prev) => {
      const exists = prev.mistakes.some(
        (m) => m.peId === item.peId && m.title === item.title
      );
      if (exists) return prev;
      const entry: MistakeItem = {
        ...item,
        id: `mistake-${item.peId}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        resolved: false,
      };
      return {
        ...prev,
        mistakes: [entry, ...prev.mistakes],
      };
    });
  }, []);

  const toggleMistakeResolved = useCallback((id: string) => {
    setProgress((prev) => ({
      ...prev,
      mistakes: prev.mistakes.map((m) =>
        m.id === id ? { ...m, resolved: !m.resolved } : m
      ),
    }));
  }, []);

  const recordVisit = useCallback((visit: NonNullable<LearningProgress['lastVisited']>) => {
    setProgress((prev) => {
      if (prev.lastVisited?.path === visit.path && prev.lastVisited?.title === visit.title) {
        return prev;
      }
      return { ...prev, lastVisited: visit };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const exportProgressJson = useCallback(() => {
    return JSON.stringify(progress, null, 2);
  }, [progress]);

  const importProgressJson = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw);
      setProgress(sanitizeProgress(parsed));
      return true;
    } catch {
      return false;
    }
  }, []);

  const openPdfPreview = useCallback((preview: PdfPreviewState) => {
    setPdfPreview(preview);
  }, []);

  const closePdfPreview = useCallback(() => {
    setPdfPreview(null);
  }, []);

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
    toastSeqRef.current += 1;
    const id = `toast-${Date.now()}-${toastSeqRef.current}`;
    const entry: ToastItem = { ...toast, id };
    setToasts((prev) => [entry, ...prev].slice(0, 3));
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
        return;
      }
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        return;
      }
      if (e.key === '/' && !isSearchOpen && !isSettingsOpen && !pdfPreview) {
        const active = document.activeElement;
        const tag = active?.tagName.toLowerCase();
        const isEditable =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          (active instanceof HTMLElement && active.isContentEditable);
        if (!isEditable) {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, isSettingsOpen, pdfPreview]);

  const value = useMemo<AppContextValue>(
    () => ({
      navigation,
      pro192,
      metaLoading,
      metaError,
      retryMeta: fetchMetadata,
      searchIndex,
      loadSearchIndex,
      lang,
      setLang,
      theme,
      setTheme,
      toggleTheme,
      byokKey,
      setByokKey,
      progress,
      toggleArticleCompleted,
      toggleSlotCompleted,
      toggleExerciseSolved,
      togglePeCompleted,
      markPeStatus,
      toggleBookmark,
      saveNote,
      addMistake,
      toggleMistakeResolved,
      recordVisit,
      resetProgress,
      exportProgressJson,
      importProgressJson,
      isSearchOpen,
      setIsSearchOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      pdfPreview,
      openPdfPreview,
      closePdfPreview,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      navigation,
      pro192,
      metaLoading,
      metaError,
      fetchMetadata,
      searchIndex,
      loadSearchIndex,
      lang,
      setLang,
      theme,
      setTheme,
      toggleTheme,
      byokKey,
      setByokKey,
      progress,
      toggleArticleCompleted,
      toggleSlotCompleted,
      toggleExerciseSolved,
      togglePeCompleted,
      markPeStatus,
      toggleBookmark,
      saveNote,
      addMistake,
      toggleMistakeResolved,
      recordVisit,
      resetProgress,
      exportProgressJson,
      importProgressJson,
      isSearchOpen,
      isSettingsOpen,
      isMobileSidebarOpen,
      pdfPreview,
      openPdfPreview,
      closePdfPreview,
      toasts,
      pushToast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return ctx;
}
