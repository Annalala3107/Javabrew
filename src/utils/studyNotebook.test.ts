import { describe, expect, it } from 'vitest';
import type { NavigationData, Pro192Data } from '../types/content';
import { buildNotesMarkdownExport, resolveStudyItem } from './studyNotebook';

const MOCK_PRO192: Pro192Data = {
  generatedAt: '2026-11-26',
  course: {
    code: 'PRO192',
    name: 'OOP Java',
    totalSlots: 1,
    totalStages: 1,
    totalExercises: 1,
    totalPeChallenges: 0,
    totalImages: 0,
    totalSlides: 0,
    totalResources: 0,
    lang: 'vi',
  },
  stages: [
    {
      id: 1,
      title: 'Giai đoạn 1: Nhập môn Java & OOP',
      file: 'README.md',
      slots: [1],
      slides: [],
      studyBridge: [],
    },
  ],
  slots: [
    {
      slot: 1,
      stage: 1,
      title: 'Tổng quan JDK & OOP',
      file: 'slots/slot-01.md',
      slidePdf: '',
      slidePptx: '',
      objectives: [],
      examFocus: ['OOP'],
      studyBridge: [],
      exercisesCount: 1,
    },
  ],
  peChallenges: [],
  assets: { images: [], slides: [], resources: [] },
};

const MOCK_NAV: NavigationData = {
  generatedAt: '2026-11-26',
  totalDomains: 1,
  totalArticles: 1,
  domains: [
    {
      id: 'java',
      labelVi: 'Java',
      labelEn: 'Java',
      totalArticles: 1,
      groups: [
        {
          id: 'basis',
          labelVi: 'Java Cơ bản',
          labelEn: 'Java Basics',
          count: 1,
          articles: [
            {
              rel: 'java/basis/bigdecimal.md',
              titleZh: 'BigDecimal',
              titleVi: 'Giải thích chi tiết BigDecimal',
              titleEn: 'BigDecimal Explained',
              chars: 1200,
              lines: 50,
              images: 0,
              status: { zhRef: 'ready', en: 'done', vi: 'done' },
            },
          ],
        },
      ],
    },
  ],
};

describe('studyNotebook utilities', () => {
  it('resolves pro192 slot, stage, pe-patterns, docs articles, and unknown keys cleanly', () => {
    const slotItem = resolveStudyItem('pro192:slots/slot-01', MOCK_PRO192, MOCK_NAV, 'vi', [1], []);
    expect(slotItem).toEqual({
      key: 'pro192:slots/slot-01',
      kind: 'pro192',
      title: 'Slot 01: Tổng quan JDK & OOP',
      badge: 'PRO192 · GĐ 1',
      route: '/pro192/slots/slot-01',
      completed: true,
    });

    const patterns = resolveStudyItem('pro192:pe-patterns', MOCK_PRO192, MOCK_NAV, 'vi');
    expect(patterns.route).toBe('/pro192/pe-patterns');
    expect(patterns.title).toContain('7 Khuôn mẫu PE');

    const docVi = resolveStudyItem(
      'docs:java/basis/bigdecimal.md',
      MOCK_PRO192,
      MOCK_NAV,
      'vi',
      [],
      ['java/basis/bigdecimal.md']
    );
    expect(docVi.title).toBe('Giải thích chi tiết BigDecimal');
    expect(docVi.badge).toBe('JavaGuide · Java / Java Cơ bản');
    expect(docVi.completed).toBe(true);

    const docEn = resolveStudyItem('docs:java/basis/bigdecimal.md', MOCK_PRO192, MOCK_NAV, 'en');
    expect(docEn.title).toBe('BigDecimal Explained');

    const unknown = resolveStudyItem('other:xyz', MOCK_PRO192, MOCK_NAV, 'vi');
    expect(unknown.route).toBe('/dashboard');
  });

  it('builds grouped Markdown export for notes', () => {
    const md = buildNotesMarkdownExport(
      [
        {
          title: 'Slot 01: Tổng quan JDK & OOP',
          badge: 'PRO192 · GĐ 1',
          route: '/pro192/slots/slot-01',
          kind: 'pro192',
          note: 'Nhớ kiểm tra null đầu hàm.',
        },
        {
          title: 'BigDecimal Explained',
          badge: 'JavaGuide · Java / Java Basics',
          route: '/docs/java/basis/bigdecimal.md',
          kind: 'docs',
          note: 'Không dùng double cho tiền tệ.',
        },
      ],
      '2026-11-26T12:00:00.000Z'
    );

    expect(md).toContain('# Sổ tay Học tập JavaBrew');
    expect(md).toContain('## PRO192 (30 Slots & Bí kíp PE) (1)');
    expect(md).toContain('Nhớ kiểm tra null đầu hàm.');
    expect(md).toContain('## JavaGuide (Kiến thức chuyên sâu) (1)');
    expect(md).toContain('Không dùng double cho tiền tệ.');
  });
});
