import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AppProvider } from '../context/AppContext';
import type { NavigationData, Pro192Data, SearchIndexData } from '../types/content';
import { ExerciseBlock } from './ExerciseBlock';
import { MarkdownRenderer } from './MarkdownRenderer';

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
              titleVi: 'Giải thích chi tiết về Đa hình và BigDecimal',
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
    totalSlots: 2,
    totalStages: 1,
    totalExercises: 1,
    totalPeChallenges: 4,
    totalImages: 1,
    totalSlides: 1,
    totalResources: 2,
    lang: 'vi',
  },
  stages: [
    {
      id: 1,
      slots: [1, 2],
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
    {
      slot: 2,
      stage: 1,
      title: 'Cài đặt JDK & NetBeans',
      file: 'pro192/giai-doan-1-slot-01-05.md',
      slidePdf: '/media/pro192/resources/Get%20Start.pdf',
      slidePptx: '/media/pro192/slides/Get%20Start.pptx',
      exercisesCount: 1,
      studyBridge: [],
    },
  ],
  peChallenges: [
    {
      id: 1,
      code: 'PE 01',
      cat: 'oop',
      title: 'Quản lý Sinh viên OOP & Lọc GPA',
      meta: 'Dạng Q1–Q2 • Cơ bản • 25 phút',
      relatedSlots: [1],
      desc: 'Viết lớp Student và hàm filterHonor() kiểm tra null an toàn.',
      checklist: ['Đúng constructor & getter/setter (3đ)', 'Xử lý null an toàn (3đ)'],
      entityFileName: 'Student.java',
      entityCode: 'public class Student { private double gpa; public double getGpa() { return gpa; } }',
      starterCode:
        'import java.util.*;\npublic class Main {\n  public static List<Student> filterHonor(List<Student> list) {\n    return new ArrayList<>();\n  }\n}',
      cleanCode:
        'import java.util.*;\npublic class Main {\n  public static List<Student> filterHonor(List<Student> list) {\n    if (list == null || list.isEmpty()) return Collections.emptyList();\n    List<Student> res = new ArrayList<>();\n    for (Student s : list) { if (s != null && s.getGpa() >= 8.0) res.add(s); }\n    res.sort(Comparator.comparingDouble(Student::getGpa).reversed());\n    return res;\n  }\n}',
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
      if (url.endsWith('/content/vi/pro192/giai-doan-1-slot-01-05.md')) {
        return new Response(
          '# Giai đoạn 1\n## Slot 1: Tổng quan Java\nLý thuyết Slot 1.\n#### Bài tập 1.1: Vai trò Bytecode\n* **Đề bài:** `javac` tạo ra gì?\n* **Lời giải chi tiết:** Tạo file `.class`.',
          { status: 200 }
        );
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
}

describe('JavaBrew Night Coffee Lab UI', () => {
  beforeEach(() => {
    localStorage.clear();
    installFetchMock();
  });

  it('renders M1 LandingPage without persistent TopBar and navigates to Dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Night Coffee Lab/i)).toBeInTheDocument();
    expect(screen.getByText(/StudentManager\.java · PE 01/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cài đặt AI Key/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Vào Dashboard ngay/i }));
    await waitFor(() => {
      expect(screen.getByText(/Lộ trình PRO192 \(30 Slots\)/i)).toBeInTheDocument();
    });
  });

  it('toggles PRO192 checklist on M2 Dashboard without strikethrough and updates percentage', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Slot 01: Tổng quan Java/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu Slot 1' }));
    expect(screen.getByText('PRO192 (1/2)')).toBeInTheDocument();
    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
  });

  it('supports M3/M4 Focus Mode, Bookmark, Personal Notes, and Exercise reveal', async () => {
    render(
      <MemoryRouter initialEntries={['/pro192/giai-doan-1-slot-01-05']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Vai trò Bytecode')).toBeInTheDocument();
    });

    // Bookmark
    fireEvent.click(screen.getByRole('button', { name: /Lưu bài/i }));
    expect(screen.getByRole('button', { name: /★ Đã lưu/i })).toHaveAttribute('aria-pressed', 'true');

    // Focus mode hides sidebar
    expect(screen.getByText('Lộ trình học')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Focus Mode/i }));
    expect(screen.queryByText('Lộ trình học')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Thoát Focus/i }));
    expect(screen.getByText('Lộ trình học')).toBeInTheDocument();

    // Personal note persists
    const noteBox = screen.getByLabelText(/Ghi chú cá nhân cho bài này/i);
    fireEvent.change(noteBox, { target: { value: 'Nhớ kiểm tra javac' } });
    expect((noteBox as HTMLTextAreaElement).value).toBe('Nhớ kiểm tra javac');

    // Exercise reveal
    expect(screen.queryByText(/Tạo file/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Xem lời giải chi tiết/i }));
    expect(screen.getByText(/Tạo file/)).toBeInTheDocument();
  });

  it('switches language VI <-> EN on JavaGuide article reader', async () => {
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

  it('runs Code Studio starter vs Diff Clean Code and passes 3/3 test cases', async () => {
    render(
      <MemoryRouter initialEntries={['/studio/1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chấm Test Case PE/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));
    expect(screen.getByText('0/3 Test Cases Passed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /So sánh Bản Tối ưu \(Diff\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /Áp dụng đoạn code tối ưu này/i }));
    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));

    expect(screen.getByText('✔ 3/3 Test Cases PASSED!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cách tối ưu?' }));
    expect(screen.getByText(/Bạn hỏi: “Làm sao tối ưu ngắn hơn nữa\?”/)).toBeInTheDocument();
  });

  it('opens SearchModal with Ctrl+K and SettingsModal BYOK config', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cài đặt AI Key/i })).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const searchInp = await screen.findByLabelText('Nhập từ khóa tìm kiếm');
    fireEvent.change(searchInp, { target: { value: 'da hinh' } });

    await waitFor(() => {
      expect(
        screen.getByText(/Giải thích chi tiết về Đa hình và BigDecimal/i)
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(searchInp, { key: 'Escape' });

    fireEvent.click(screen.getByRole('button', { name: /Cài đặt AI Key/i }));
    const keyInp = screen.getByLabelText(/Gemini API Key/i);
    fireEvent.change(keyInp, { target: { value: 'AIzaTest123' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu cấu hình/i }));
    expect(localStorage.getItem('javabrew:byok_key')).toBe('AIzaTest123');
  });

  it('renders ExerciseBlock, MarkdownRenderer, and Resources PdfPreviewModal cleanly', async () => {
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

  it('renders MarkdownRenderer callouts, tables, and unknown language fences safely', () => {
    const md = `> [!TIP] Mẹo\n> Đóng luồng đúng cách.\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n\`\`\`drawio-chart\nx -> y\n\`\`\``;
    render(
      <MemoryRouter>
        <AppProvider>
          <MarkdownRenderer content={md} currentRel="pro192/README.md" />
          <ExerciseBlock
            currentRel="pro192/README.md"
            exercise={{
              id: '1.1',
              slot: 1,
              indexInSlot: 1,
              title: 'Demo',
              promptMd: 'Question',
              solutionMd: 'Answer',
            }}
          />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('note')).toHaveTextContent('Mẹo');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('drawio-chart')).toBeInTheDocument();
  });
});
