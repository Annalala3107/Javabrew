export type Lang = 'vi' | 'en';
export type Theme = 'light' | 'dark';

export interface ArticleStatus {
  zhRef: string;
  en: string;
  vi: string;
}

export interface NavArticle {
  rel: string;
  titleZh: string;
  titleEn: string;
  titleVi: string;
  chars: number;
  lines: number;
  images: number;
  status: ArticleStatus;
}

export interface NavGroup {
  id: string;
  labelEn: string;
  labelVi: string;
  count: number;
  articles: NavArticle[];
}

export interface NavDomain {
  id: string;
  labelEn: string;
  labelVi: string;
  totalArticles: number;
  groups: NavGroup[];
}

export interface NavigationData {
  generatedAt: string;
  totalDomains: number;
  totalArticles: number;
  domains: NavDomain[];
}

export interface Pro192Stage {
  id: number;
  slots: number[];
  title: string;
  file?: string;
  slotFiles?: string[];
  slides: string[];
  studyBridge: string[];
}

export interface Pro192Slot {
  slot: number;
  stage: number;
  title: string;
  file: string;
  slidePdf: string;
  slidePptx: string;
  exercisesCount: number;
  studyBridge: string[];
  examFocus?: string[];
  estimatedMinutes?: number;
  objectives?: string[];
  examTraps?: string[];
  peRefs?: string[];
  slideImages?: string[];
}

export interface Pro192PeChallengeMeta {
  id: number;
  code: string;
  paper?: string;
  questionNo?: string;
  marks?: number;
  cat: string;
  title: string;
  meta: string;
  relatedSlots: number[];
  desc: string;
  checklist: string[];
  entityFileName: string;
  entityCode: string;
  interfaceFileName?: string;
  interfaceCode?: string;
  starterCode: string;
  cleanCode: string;
}

export interface Pro192Data {
  generatedAt: string;
  course: {
    code: string;
    name: string;
    totalSlots: number;
    totalStages: number;
    totalExercises: number;
    totalPeChallenges: number;
    totalImages: number;
    totalSlides: number;
    totalResources: number;
    lang: string;
    structure?: string;
    totalSlotFiles?: number;
  };
  stages: Pro192Stage[];
  slots: Pro192Slot[];
  peChallenges?: Pro192PeChallengeMeta[];
  assets: {
    images: string[];
    slides: string[];
    resources: string[];
  };
}

export interface SearchArticleEntry {
  rel: string;
  domain: string;
  domainLabelVi: string;
  domainLabelEn: string;
  group: string;
  groupLabelVi: string;
  groupLabelEn: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  tags: string[];
  headingsVi: string[];
  headingsEn: string[];
  chars: number;
  lines: number;
  images: number;
}

export interface SearchSlotEntry {
  slot: number;
  stage: number;
  title: string;
  file: string;
}

export interface SearchExerciseEntry {
  id: string;
  stageId: number;
  slot: number;
  indexInSlot: number;
  title: string;
}

export interface SearchPeEntry {
  id: string;
  title: string;
  meta: string;
}

export interface SearchIndexData {
  generatedAt: string;
  totalArticles: number;
  totalExercises: number;
  totalPeChallenges: number;
  articles: SearchArticleEntry[];
  pro192Slots: SearchSlotEntry[];
  pro192Exercises: SearchExerciseEntry[];
  peChallenges: SearchPeEntry[];
}

export interface TocHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export interface FrontmatterMeta {
  title?: string;
  description?: string;
  category?: string;
  slots?: string;
  lang?: string;
  tags: string[];
}

export interface Pro192Exercise {
  id: string;
  slot: number;
  indexInSlot: number;
  title: string;
  promptMd: string;
  solutionMd: string;
}

export interface PeChallenge {
  id: string;
  title: string;
  meta: string;
  durationMinutes: number;
  requirementsMd: string;
  pitfallsMd: string;
  solutionMd: string;
}

export interface MistakeItem {
  id: string;
  type: 'runtime' | 'cleancode';
  title: string;
  detail: string;
  peId: number;
  createdAt: string;
  resolved?: boolean;
}

export interface LearningProgress {
  completedArticles: string[];
  completedSlots: number[];
  solvedExercises: string[];
  completedPe: string[];
  bookmarks: string[];
  notes: Record<string, string>;
  mistakes: MistakeItem[];
  peStatus: Record<number, 'pass' | 'in-progress'>;
  lastVisited: {
    path: string;
    title: string;
    kind: 'pro192' | 'docs' | 'pe' | 'studio';
    updatedAt: string;
  } | null;
}
