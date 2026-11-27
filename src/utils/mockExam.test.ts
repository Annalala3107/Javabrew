import { beforeEach, describe, expect, it } from 'vitest';
import type { Pro192PeChallengeMeta } from '../types/content';
import {
  appendMockExamHistory,
  buildMockExamPapers,
  clearMockExamDrafts,
  computeQuestionEarnedMarks,
  readMockExamDrafts,
  readMockExamHistory,
  saveMockExamDraft,
  type MockExamHistoryRecord,
} from './mockExam';

function makeChallenge(
  id: number,
  paper: string,
  marks: number
): Pro192PeChallengeMeta {
  return {
    id,
    code: `${paper}-Q${id}`,
    paper,
    questionNo: `Q${id}`,
    marks,
    cat: 'oop',
    title: `Câu ${id}`,
    meta: `${paper} · Q${id} · ${marks} điểm`,
    relatedSlots: [1],
    desc: 'Mô tả',
    checklist: ['Checklist'],
    entityFileName: '',
    entityCode: '',
    starterCode: `public class Q${id} {}`,
    cleanCode: `public class Q${id} {}`,
  };
}

describe('mockExam utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('groups PE challenges into ordered exam papers with 85m (10 marks) and 60m Mini Mock (7 marks)', () => {
    const challenges: Pro192PeChallengeMeta[] = [
      makeChallenge(5, 'PE2', 2),
      makeChallenge(6, 'PE2', 3),
      makeChallenge(7, 'PE2', 2),
      makeChallenge(1, 'PE1', 2),
      makeChallenge(2, 'PE1', 3),
      makeChallenge(3, 'PE1', 3),
      makeChallenge(4, 'PE1', 2),
      makeChallenge(8, 'PE3', 2),
      makeChallenge(9, 'PE3', 3),
      makeChallenge(10, 'PE3', 2),
      makeChallenge(11, 'PE3', 3),
    ];

    const papers = buildMockExamPapers(challenges);
    expect(papers.map((p) => p.paper)).toEqual(['PE1', 'PE3', 'PE2']);

    const pe1 = papers[0];
    expect(pe1.durationMinutes).toBe(85);
    expect(pe1.maxScore).toBe(10);
    expect(pe1.isMini).toBe(false);
    expect(pe1.questions).toHaveLength(4);

    const pe2 = papers[2];
    expect(pe2.durationMinutes).toBe(60);
    expect(pe2.maxScore).toBe(7);
    expect(pe2.isMini).toBe(true);
    expect(pe2.questions).toHaveLength(3);
  });

  it('computes partial question earned marks proportionally rounded to 2 decimals', () => {
    expect(computeQuestionEarnedMarks(3, 3, 2.5)).toBe(2.5);
    expect(computeQuestionEarnedMarks(2, 3, 3)).toBe(2);
    expect(computeQuestionEarnedMarks(1, 3, 2)).toBe(0.67);
    expect(computeQuestionEarnedMarks(0, 3, 2)).toBe(0);
    expect(computeQuestionEarnedMarks(1, 0, 2)).toBe(0);
  });

  it('persists mock exam drafts isolated from studio drafts and keeps latest 20 history records', () => {
    saveMockExamDraft('PE1', 1, 'class MainA {}', 'class EntityA {}');
    saveMockExamDraft('PE2', 5, 'class MainB {}', '');

    expect(readMockExamDrafts('PE1')[1]).toEqual({
      main: 'class MainA {}',
      entity: 'class EntityA {}',
    });
    expect(localStorage.getItem('javabrew:pe_drafts_v1')).toBeNull();

    clearMockExamDrafts('pe1');
    expect(readMockExamDrafts('PE1')).toEqual({});
    expect(readMockExamDrafts('PE2')[5]?.main).toBe('class MainB {}');

    for (let i = 1; i <= 22; i++) {
      const rec: MockExamHistoryRecord = {
        id: `rec-${i}`,
        paper: 'PE1',
        totalScore: 7,
        maxScore: 10,
        passed: true,
        elapsedSeconds: 1800,
        submittedAt: `2026-11-27T00:${String(i).padStart(2, '0')}:00Z`,
        questions: [],
      };
      appendMockExamHistory(rec);
    }

    const hist = readMockExamHistory();
    expect(hist).toHaveLength(20);
    expect(hist[0].id).toBe('rec-22');
    expect(hist[19].id).toBe('rec-3');
  });
});
