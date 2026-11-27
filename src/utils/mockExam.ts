import type { Pro192PeChallengeMeta } from '../types/content';

export interface MockExamPaperMeta {
  paper: string;
  label: string;
  durationMinutes: number;
  maxScore: number;
  isMini: boolean;
  questions: Pro192PeChallengeMeta[];
}

export interface MockExamDraftEntry {
  main: string;
  entity: string;
}

export type MockExamDraftMap = Record<number, MockExamDraftEntry>;

export interface MockExamQuestionResult {
  peId: number;
  code: string;
  title: string;
  marks: number;
  earnedMarks: number;
  passedTests: number;
  totalTests: number;
  status: 'pass' | 'partial' | 'fail';
  engineLabel: string;
  diagnostics: string[];
  failedTests: string[];
}

export interface MockExamHistoryRecord {
  id: string;
  paper: string;
  totalScore: number;
  maxScore: number;
  passed: boolean;
  elapsedSeconds: number;
  submittedAt: string;
  questions: MockExamQuestionResult[];
}

const STORAGE_MOCK_DRAFTS = 'javabrew:mock_exam_drafts_v1';
const STORAGE_MOCK_HISTORY = 'javabrew:mock_exam_history_v1';

const PAPER_ORDER = ['PE1', 'PE3', 'PE4', 'PE5', 'PE2'];

function inferPaperCode(c: Pro192PeChallengeMeta): string {
  if (c.paper) return c.paper.toUpperCase();
  const m = c.code.match(/^(PE\d+)/i);
  return m ? m[1].toUpperCase() : 'PE1';
}

export function buildMockExamPapers(challenges: Pro192PeChallengeMeta[]): MockExamPaperMeta[] {
  const byPaper = new Map<string, Pro192PeChallengeMeta[]>();
  for (const c of challenges) {
    const p = inferPaperCode(c);
    const list = byPaper.get(p) ?? [];
    list.push(c);
    byPaper.set(p, list);
  }

  const orderedKeys = [
    ...PAPER_ORDER.filter((p) => byPaper.has(p)),
    ...Array.from(byPaper.keys())
      .filter((p) => !PAPER_ORDER.includes(p))
      .sort(),
  ];

  return orderedKeys.map((paper) => {
    const qs = [...(byPaper.get(paper) ?? [])].sort((a, b) => a.id - b.id);
    const maxScore = qs.reduce((sum, q) => sum + (q.marks ?? 2.5), 0);
    const isMini = maxScore < 10;
    const durationMinutes = isMini ? 60 : 85;
    return {
      paper,
      label: isMini
        ? `Đề ${paper} · Mini Mock (${qs.length} câu · ${maxScore}đ · ${durationMinutes}p)`
        : `Đề ${paper} · Đề chuẩn (${qs.length} câu · ${maxScore}đ · ${durationMinutes}p)`,
      durationMinutes,
      maxScore,
      isMini,
      questions: qs,
    };
  });
}

export function computeQuestionEarnedMarks(
  passedTests: number,
  totalTests: number,
  marks: number
): number {
  if (totalTests <= 0 || marks <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, passedTests / totalTests));
  return Math.round(ratio * marks * 100) / 100;
}

function readAllMockDrafts(): Record<string, MockExamDraftMap> {
  try {
    const raw = localStorage.getItem(STORAGE_MOCK_DRAFTS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, MockExamDraftMap>)
      : {};
  } catch {
    return {};
  }
}

export function readMockExamDrafts(paper: string): MockExamDraftMap {
  const all = readAllMockDrafts();
  return all[paper.toUpperCase()] ?? {};
}

export function saveMockExamDraft(
  paper: string,
  peId: number,
  main: string,
  entity: string
): void {
  try {
    const all = readAllMockDrafts();
    const key = paper.toUpperCase();
    const existing = all[key] ?? {};
    all[key] = { ...existing, [peId]: { main, entity } };
    localStorage.setItem(STORAGE_MOCK_DRAFTS, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

export function clearMockExamDrafts(paper: string): void {
  try {
    const all = readAllMockDrafts();
    delete all[paper.toUpperCase()];
    localStorage.setItem(STORAGE_MOCK_DRAFTS, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

export function readMockExamHistory(): MockExamHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_MOCK_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MockExamHistoryRecord[]) : [];
  } catch {
    return [];
  }
}

export function appendMockExamHistory(record: MockExamHistoryRecord): MockExamHistoryRecord[] {
  const prev = readMockExamHistory();
  const next = [record, ...prev].slice(0, 20);
  try {
    localStorage.setItem(STORAGE_MOCK_HISTORY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}
