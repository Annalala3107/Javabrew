import { describe, expect, it } from 'vitest';
import type { Pro192Data, SearchIndexData } from '../types/content';
import { extractRagTokens, retrieveRagSources } from './ragRetrieval';

const SAMPLE_PRO192: Pro192Data = {
  generatedAt: '2026-11-27T00:00:00Z',
  course: {
    code: 'PRO192',
    name: 'OOP with Java',
    totalSlots: 2,
    totalStages: 1,
    totalExercises: 10,
    totalPeChallenges: 2,
    totalImages: 0,
    totalSlides: 0,
    totalResources: 0,
    lang: 'vi',
  },
  stages: [],
  slots: [
    {
      slot: 14,
      stage: 4,
      title: 'Java Collections Framework: List, Set và Map',
      file: 'pro192/slots/slot-14.md',
      slidePdf: '',
      slidePptx: '',
      exercisesCount: 5,
      studyBridge: ['java/collection/hashmap-source-code.md'],
      objectives: ['Phân biệt ArrayList và LinkedList trong quản lý danh sách PE'],
      examTraps: ['Dùng Iterator.remove() khi xóa phần tử khỏi List'],
      examFocus: ['ArrayList', 'HashMap', 'Comparator'],
    },
    {
      slot: 3,
      stage: 1,
      title: 'Lớp, Đối tượng và Encapsulation',
      file: 'pro192/slots/slot-03.md',
      slidePdf: '',
      slidePptx: '',
      exercisesCount: 5,
      studyBridge: [],
      objectives: ['Thiết kế getter/setter chuẩn JavaBean'],
      examFocus: ['OOP'],
    },
  ],
  peChallenges: [
    {
      id: 4,
      code: 'PE1-Q4',
      paper: 'PE1',
      questionNo: 'Q4',
      marks: 2,
      cat: 'strings',
      title: 'IProcess — Xử lý chuỗi nâng cao',
      meta: 'PE1 · Q4 · 2 điểm',
      relatedSlots: [9],
      desc: 'Xử lý đảo từ bằng StringBuilder và split.',
      checklist: ['Dùng StringBuilder'],
      entityFileName: '',
      entityCode: '',
      starterCode: 'class MyProcess {}',
      cleanCode: 'class MyProcess {}',
    },
  ],
  assets: { images: [], slides: [], resources: [] },
};

const SAMPLE_INDEX: SearchIndexData = {
  generatedAt: '2026-11-27T00:00:00Z',
  totalArticles: 3,
  totalExercises: 0,
  totalPeChallenges: 1,
  articles: [
    {
      rel: 'java/collection/hashmap-source-code.md',
      domain: 'java',
      domainLabelVi: 'Java Cốt lõi',
      domainLabelEn: 'Java Core',
      group: 'collection',
      groupLabelVi: 'Collections',
      groupLabelEn: 'Collections',
      titleVi: 'Phân tích mã nguồn HashMap JDK 8',
      titleEn: 'HashMap Source Code Analysis',
      descriptionVi: 'Cơ chế bucket, hashCode, equals và red-black tree trong HashMap.',
      descriptionEn: 'HashMap internals with bucket and red-black tree.',
      tags: ['HashMap', 'Collection'],
      headingsVi: ['Mảng + Danh sách liên kết + Cây đỏ đen'],
      headingsEn: ['Array + LinkedList + Red-Black Tree'],
      chars: 3000,
      lines: 120,
      images: 2,
    },
    {
      rel: 'java/collection/arraylist-vs-linkedlist.md',
      domain: 'java',
      domainLabelVi: 'Java Cốt lõi',
      domainLabelEn: 'Java Core',
      group: 'collection',
      groupLabelVi: 'Collections',
      groupLabelEn: 'Collections',
      titleVi: 'So sánh ArrayList và LinkedList chi tiết',
      titleEn: 'ArrayList vs LinkedList Comparison',
      descriptionVi: 'Khác biệt cấu trúc mảng động và danh sách liên kết đôi.',
      descriptionEn: 'Dynamic array vs doubly linked list.',
      tags: ['ArrayList', 'LinkedList'],
      headingsVi: ['Độ phức tạp get/add/remove'],
      headingsEn: ['Time complexity'],
      chars: 2500,
      lines: 90,
      images: 0,
    },
    {
      rel: 'database/mysql/mysql-index.md',
      domain: 'database',
      domainLabelVi: 'Cơ sở dữ liệu',
      domainLabelEn: 'Database',
      group: 'mysql',
      groupLabelVi: 'MySQL',
      groupLabelEn: 'MySQL',
      titleVi: 'B-Tree Index trong MySQL',
      titleEn: 'MySQL B-Tree Index',
      descriptionVi: 'Tối ưu truy vấn SQL bằng Clustered Index.',
      descriptionEn: 'SQL query index optimization.',
      tags: ['MySQL', 'Index'],
      headingsVi: ['Clustered Index'],
      headingsEn: ['Clustered Index'],
      chars: 2000,
      lines: 80,
      images: 0,
    },
  ],
  pro192Slots: [],
  pro192Exercises: [],
  peChallenges: [],
};

describe('ragRetrieval', () => {
  it('strips Vietnamese & English stopwords and accents in extractRagTokens', () => {
    const tokens = extractRagTokens('So sánh ArrayList và LinkedList là gì trong Java?');
    expect(tokens).toContain('arraylist');
    expect(tokens).toContain('linkedlist');
    expect(tokens).toContain('java');
    expect(tokens).not.toContain('la');
    expect(tokens).not.toContain('gi');
    expect(tokens).not.toContain('va');
  });

  it('ranks matching PRO192 slots, PE challenges, and JavaGuide articles without duplicates', () => {
    const res1 = retrieveRagSources(
      'ArrayList và LinkedList khác nhau thế nào?',
      SAMPLE_INDEX,
      SAMPLE_PRO192,
      'vi',
      5
    );
    expect(res1.length).toBeGreaterThanOrEqual(2);
    const routes = res1.map((r) => r.route);
    expect(routes).toContain('/docs/java/collection/arraylist-vs-linkedlist.md');
    expect(routes).toContain('/pro192/slots/slot-14');
    expect(new Set(routes).size).toBe(routes.length);

    const limited = retrieveRagSources('HashMap', SAMPLE_INDEX, SAMPLE_PRO192, 'vi', 1);
    expect(limited).toHaveLength(1);
    expect(limited[0].route).toBe('/docs/java/collection/hashmap-source-code.md');

    expect(retrieveRagSources('  ', SAMPLE_INDEX, SAMPLE_PRO192, 'vi')).toEqual([]);
  });
});
