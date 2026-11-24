import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { ExerciseBlock } from './ExerciseBlock';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AppProvider } from '../context/AppContext';
import type { NavigationData, Pro192Data, SearchIndexData } from '../types/content';

const MOCK_NAV: NavigationData = {
  generatedAt: '2026-11-24T00:00:00Z',
  totalDomains: 1,
  totalArticles: 1,
  domains: [
    {
      id: 'java',
      labelEn: 'Java Core',
      labelVi: 'Java Cốt lõi',
      totalArticles: 1,
      groups: [
        {
          id: 'basis',
          labelEn: 'Java Basics',
          labelVi: 'Java Cơ bản',
          count: 1,
          articles: [
            {
              rel: 'java/basis/bigdecimal.md',
              titleZh: 'BigDecimal',
              titleEn: 'BigDecimal Explained',
              titleVi: 'Giải thích chi tiết về BigDecimal',
              chars: 2400,
              lines: 100,
              images: 1,
              status: { zhRef: 'ready', en: 'done', vi: 'done' },
            },
          ],
        },
      ],
    },
  ],
};

const MOCK_PRO192: Pro192Data = {
  generatedAt: '2026-11-24T00:00:00Z',
  course: {
    code: 'PRO192',
    name: 'OOP with Java',
    totalSlots: 1,
    totalStages: 1,
    totalExercises: 1,
    totalPeChallenges: 4,
    totalImages: 1,
    totalSlides: 1,
    totalResources: 1,
    lang: 'vi',
  },
  stages: [
    {
      id: 1,
      slots: [1],
      title: 'Giai đoạn 1: Khởi động Java',
      file: 'pro192/giai-doan-1-slot-01-05.md',
      slides: ['Get Start.pptx'],
      studyBridge: ['java/basis/bigdecimal.md'],
    },
  ],
  slots: [
    {
      slot: 1,
      stage: 1,
      title: 'Tổng quan Java',
      file: 'pro192/giai-doan-1-slot-01-05.md',
      slidePdf: '/media/pro192/resources/Get%20Start.pdf',
      slidePptx: '/media/pro192/slides/Get%20Start.pptx',
      exercisesCount: 1,
      studyBridge: ['java/basis/bigdecimal.md'],
    },
  ],
  assets: {
    images: ['/media/pro192/images/JVM.png'],
    slides: ['/media/pro192/slides/Get%20Start.pptx'],
    resources: ['/media/pro192/resources/Get%20Start.pdf', '/media/pro192/resources/banking.rar'],
  },
};

const MOCK_SEARCH: SearchIndexData = {
  generatedAt: '2026-11-24T00:00:00Z',
  totalArticles: 1,
  totalExercises: 1,
  totalPeChallenges: 1,
  articles: [
    {
      rel: 'java/basis/bigdecimal.md',
      domain: 'java',
      domainLabelVi: 'Java Cốt lõi',
      domainLabelEn: 'Java Core',
      group: 'basis',
      groupLabelVi: 'Java Cơ bản',
      groupLabelEn: 'Java Basics',
      titleVi: 'Giải thích chi tiết về Đa hình và BigDecimal',
      titleEn: 'BigDecimal & Polymorphism Explained',
      descriptionVi: 'Tính toán chính xác',
      descriptionEn: 'Precision math',
      tags: ['Java'],
      headingsVi: ['Giới thiệu'],
      headingsEn: ['Introduction'],
      chars: 2400,
      lines: 100,
      images: 1,
    },
  ],
  pro192Slots: [
    {
      slot: 1,
      stage: 1,
      title: 'Tổng quan Java',
      file: 'pro192/giai-doan-1-slot-01-05.md',
    },
  ],
  pro192Exercises: [
    {
      id: '1.1',
      stageId: 1,
      slot: 1,
      indexInSlot: 1,
      title: 'Vai trò Bytecode',
    },
  ],
  peChallenges: [
    {
      id: '01',
      title: 'Đề PE 01 — Quản lý Sinh viên',
      meta: 'Q1–Q2 · 25 phút',
    },
  ],
};

const MOCK_PE_MD = `---
title: "PE"
---
## Đề PE 01 — Quản lý Sinh viên (Q1–Q2 · 25 phút)
### Yêu cầu đề bài
Xây dựng lớp Student.
### Bẫy thường gặp
- Quên kiểm tra null.
### Lời giải chuẩn
\`\`\`java
public class Student {}
\`\`\`

## Đề PE 02 — Thư viện Sách (Q2–Q3 · 35 phút)
### Yêu cầu đề bài
Tạo lớp Book và EBook.
### Lời giải chuẩn
\`\`\`java
public class Book {}
\`\`\`
`;

function installFetchMock() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/metadata/navigation.json')) {
        return new Response(JSON.stringify(MOCK_NAV), { status: 200 });
      }
      if (url.endsWith('/metadata/pro192.json')) {
        return new Response(JSON.stringify(MOCK_PRO192), { status: 200 });
      }
      if (url.endsWith('/data/search-index.json')) {
        return new Response(JSON.stringify(MOCK_SEARCH), { status: 200 });
      }
      if (url.endsWith('/content/vi/pro192/pe-challenges.md')) {
        return new Response(MOCK_PE_MD, { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    })
  );
}

describe('JavaBrew UI Components', () => {
  beforeEach(() => {
    localStorage.clear();
    installFetchMock();
  });

  it('renders ExerciseBlock with hidden solution by default and toggles solved + solution state', () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ExerciseBlock
            currentRel="pro192/giai-doan-1-slot-01-05.md"
            exercise={{
              id: '1.1',
              slot: 1,
              indexInSlot: 1,
              title: 'Vai trò Bytecode',
              promptMd: 'Trình biên dịch `javac` tạo ra file gì?',
              solutionMd: 'Tạo ra tệp `.class` chứa Java Bytecode.',
            }}
          />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Vai trò Bytecode')).toBeInTheDocument();
    expect(screen.queryByText(/Tạo ra tệp/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Xem lời giải chi tiết/i }));
    expect(screen.getByText(/Tạo ra tệp/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Đánh dấu đã làm/i }));
    expect(screen.getByRole('button', { name: /Đã hoàn thành/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('renders MarkdownRenderer tables, callouts, unknown code fence languages, and internal links safely', () => {
    const md = `
> [!TIP] Mẹo tối ưu
> Luôn đóng tài nguyên bằng try-with-resources.

| Tên | Mô tả |
|---|---|
| List | Có thứ tự |

[Mở BigDecimal](../java/basis/bigdecimal.md)

\`\`\`drawio-chart
node A -> B
\`\`\`
`;

    render(
      <MemoryRouter>
        <AppProvider>
          <MarkdownRenderer content={md} currentRel="pro192/README.md" />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('note')).toHaveTextContent('Mẹo tối ưu');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('drawio-chart')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mở BigDecimal' })).toHaveAttribute(
      'href',
      '/docs/java/basis/bigdecimal.md'
    );
  });

  it('opens SearchModal with Ctrl+K and performs diacritic-insensitive search', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Không gian học tập PRO192/i)).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = await screen.findByLabelText('Nhập từ khóa tìm kiếm');
    fireEvent.change(input, { target: { value: 'da hinh' } });

    await waitFor(() => {
      expect(
        screen.getByText(/Giải thích chi tiết về Đa hình và BigDecimal/i)
      ).toBeInTheDocument();
    });
  });

  it('renders PeArenaPage with countdown timer and collapsible pitfalls & solution', async () => {
    render(
      <MemoryRouter initialEntries={['/pe']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    vi.useFakeTimers();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Bắt đầu bấm giờ/i }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByText('24:58')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Đặt lại/i }));
    expect(screen.getByText('25:00')).toBeInTheDocument();

    vi.useRealTimers();

    expect(screen.queryByText(/Quên kiểm tra null/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Bẫy hay mất điểm/i }));
    expect(screen.getByText(/Quên kiểm tra null/)).toBeInTheDocument();

    expect(screen.queryByText(/Lời giải mẫu chuẩn hóa/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Xem lời giải chuẩn/i }));
    expect(screen.getByText(/Lời giải mẫu chuẩn hóa/)).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'CODE' && /public class Student/.test(el.textContent || ''))
    ).toBeInTheDocument();
  });

  it('switches language from VI to EN on DocsPage article reader', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.endsWith('/metadata/navigation.json')) {
          return new Response(JSON.stringify(MOCK_NAV), { status: 200 });
        }
        if (url.endsWith('/metadata/pro192.json')) {
          return new Response(JSON.stringify(MOCK_PRO192), { status: 200 });
        }
        if (url.endsWith('/content/vi/java/basis/bigdecimal.md')) {
          return new Response('---\ntitle: "Chi tiết BigDecimal"\n---\nNội dung tiếng Việt.', {
            status: 200,
          });
        }
        if (url.endsWith('/content/en/java/basis/bigdecimal.md')) {
          return new Response('---\ntitle: "BigDecimal Details"\n---\nEnglish content body.', {
            status: 200,
          });
        }
        return new Response('Not found', { status: 404 });
      })
    );

    render(
      <MemoryRouter initialEntries={['/docs/java/basis/bigdecimal.md']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nội dung tiếng Việt.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Đọc bản English/i }));

    await waitFor(() => {
      expect(screen.getByText('English content body.')).toBeInTheDocument();
    });
  });

  it('opens PdfPreviewModal from ResourcesPage', async () => {
    render(
      <MemoryRouter initialEntries={['/resources']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Get Start')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Xem PDF/i }));
    expect(screen.getByRole('dialog', { name: /Xem tài liệu PDF: Get Start/i })).toBeInTheDocument();
  });
});
