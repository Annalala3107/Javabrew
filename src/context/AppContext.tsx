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

const STORAGE_LANG = 'javabrew:lang';
const STORAGE_THEME = 'javabrew:theme';
const STORAGE_PROGRESS = 'javabrew:progress';

const DEFAULT_PROGRESS: LearningProgress = {
  completedArticles: [],
  completedSlots: [],
  solvedExercises: [],
  completedPe: [],
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
    if (val === 'dark' || val === 'light') return val;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // ignore storage errors
  }
  return 'light';
}

function readInitialProgress(): LearningProgress {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<LearningProgress>;
    return {
      completedArticles: Array.isArray(parsed.completedArticles) ? parsed.completedArticles : [],
      completedSlots: Array.isArray(parsed.completedSlots) ? parsed.completedSlots : [],
      solvedExercises: Array.isArray(parsed.solvedExercises) ? parsed.solvedExercises : [],
      completedPe: Array.isArray(parsed.completedPe) ? parsed.completedPe : [],
      lastVisited: parsed.lastVisited ?? null,
    };
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
  toggleTheme: () => void;
  progress: LearningProgress;
  toggleArticleCompleted: (rel: string) => void;
  toggleSlotCompleted: (slot: number) => void;
  toggleExerciseSolved: (exId: string) => void;
  togglePeCompleted: (peId: string) => void;
  recordVisit: (visit: NonNullable<LearningProgress['lastVisited']>) => void;
  resetProgress: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  pdfPreview: PdfPreviewState | null;
  openPdfPreview: (preview: PdfPreviewState) => void;
  closePdfPreview: () => void;
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
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [progress, setProgress] = useState<LearningProgress>(readInitialProgress);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState | null>(null);

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
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
    setProgress((prev) => ({
      ...prev,
      completedPe: toggleStringItem(prev.completedPe, peId),
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

  const openPdfPreview = useCallback((preview: PdfPreviewState) => {
    setPdfPreview(preview);
  }, []);

  const closePdfPreview = useCallback(() => {
    setPdfPreview(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
        return;
      }
      if (e.key === '/' && !isSearchOpen && !pdfPreview) {
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
  }, [isSearchOpen, pdfPreview]);

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
      toggleTheme,
      progress,
      toggleArticleCompleted,
      toggleSlotCompleted,
      toggleExerciseSolved,
      togglePeCompleted,
      recordVisit,
      resetProgress,
      isSearchOpen,
      setIsSearchOpen,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      pdfPreview,
      openPdfPreview,
      closePdfPreview,
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
      toggleTheme,
      progress,
      toggleArticleCompleted,
      toggleSlotCompleted,
      toggleExerciseSolved,
      togglePeCompleted,
      recordVisit,
      resetProgress,
      isSearchOpen,
      isMobileSidebarOpen,
      pdfPreview,
      openPdfPreview,
      closePdfPreview,
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
