import { undo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AppProvider, normalizePeKey } from '../context/AppContext';
import type { NavigationData, Pro192Data, SearchIndexData } from '../types/content';
import { savePeDraft } from '../utils/studioDrafts';
import { ErrorBoundary } from './ErrorBoundary';
import { ExerciseBlock } from './ExerciseBlock';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StreamingAiBubble } from './lucian/StreamingAiBubble';

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
      slotFiles: ['pro192/slots/slot-01.md', 'pro192/slots/slot-02.md'],
      slides: ['Get Start.pptx'],
      studyBridge: ['java/basis/bigdecimal.md'],
    },
  ],
  slots: [
    {
      slot: 1,
      stage: 1,
      title: 'Tổng quan Java',
      file: 'pro192/slots/slot-01.md',
      slidePdf: '/media/pro192/resources/Get%20Start.pdf',
      slidePptx: '/media/pro192/slides/Get%20Start.pptx',
      exercisesCount: 1,
      studyBridge: ['java/basis/bigdecimal.md'],
    },
    {
      slot: 2,
      stage: 1,
      title: 'Cài đặt JDK & NetBeans',
      file: 'pro192/slots/slot-02.md',
      slidePdf: '/media/pro192/resources/Get%20Start.pdf',
      slidePptx: '/media/pro192/slides/Get%20Start.pptx',
      exercisesCount: 1,
      studyBridge: [],
    },
  ],
  peChallenges: [
    {
      id: 1,
      code: 'PE1-Q1',
      paper: 'PE1',
      questionNo: 'Q1',
      marks: 2,
      cat: 'oop',
      title: 'Crocus — Encapsulation & Xử lý Chữ số',
      meta: 'PE1 · Q1 · 2 điểm · 15 phút',
      relatedSlots: [1],
      desc: 'Viết lớp Crocus với getName() xóa chữ số cuối và setWeight() trừ đi số ký tự non-digit.',
      checklist: ['getName() xóa chữ số cuối', 'setWeight() trừ số non-digit'],
      entityFileName: '',
      entityCode: '',
      starterCode:
        'public class Crocus {\n  private String name;\n  private int weight;\n  public Crocus() {}\n  public Crocus(String name, int weight) { this.name = name; this.weight = weight; }\n  public String getName() { return name; }\n  public int getWeight() { return weight; }\n  public void setWeight(int weight) { this.weight = weight; }\n}',
      cleanCode:
        'public class Crocus {\n  private String name;\n  private int weight;\n  public Crocus() {}\n  public Crocus(String name, int weight) { this.name = name; this.weight = weight; }\n  public String getName() { if (name == null) return ""; for (int i = name.length() - 1; i >= 0; i--) { if (Character.isDigit(name.charAt(i))) return name.substring(0, i) + name.substring(i + 1); } return name; }\n  public int getWeight() { return weight; }\n  public void setWeight(int weight) { int nonDigitCount = 0; if (name != null) { for (int i = 0; i < name.length(); i++) { if (!Character.isDigit(name.charAt(i))) nonDigitCount++; } } this.weight = weight - nonDigitCount; }\n}',
    },
    {
      id: 2,
      code: 'PE1-Q2',
      paper: 'PE1',
      questionNo: 'Q2',
      marks: 3,
      cat: 'oop',
      title: 'SpecDaisy — Kế thừa & Xử lý Chữ thường',
      meta: 'PE1 · Q2 · 3 điểm · 20 phút',
      relatedSlots: [1],
      desc: 'Kế thừa Daisy qua super(name, age).',
      checklist: ['Dùng extends Daisy & super()'],
      entityFileName: 'Daisy.java',
      entityCode: 'public class Daisy { private String name; private int age; }',
      starterCode: 'public class SpecDaisy extends Daisy {\n  public SpecDaisy() {}\n}',
      cleanCode: 'public class SpecDaisy extends Daisy {\n  public SpecDaisy(String name, int age, String color) { super(name, age); }\n}',
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
      file: 'pro192/slots/slot-01.md',
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
  totalPlaygroundTemplates: 1,
  totalSlides: 1,
  playgroundTemplates: [
    {
      id: 'slot-09-lab',
      title: 'Slot 09 Lab: Xử lý Chuỗi Java',
      subtitle: 'trim, substring và split',
      category: 'Cơ bản',
      slotRef: 'Slot 09',
    },
  ],
  slides: [
    {
      title: 'Get Start',
      pdfUrl: '/media/pro192/resources/Get%20Start.pdf',
      pptxUrl: '/media/pro192/slides/Get%20Start.pptx',
      slots: [1, 2],
    },
  ],
};

function installFetchMock(
  sandboxHandler?: (method: string, bodyText?: string) => Promise<Response> | Response
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/api/java-run')) {
        if (sandboxHandler) {
          return sandboxHandler(
            (init?.method || 'GET').toUpperCase(),
            typeof init?.body === 'string' ? init.body : undefined
          );
        }
        if ((init?.method || 'GET').toUpperCase() === 'POST') {
          return new Response(
            JSON.stringify({
              unavailable: true,
              unavailableReason: 'Local SPA — chuyển sang Static Evaluator.',
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ available: false, runtime: 'OpenJDK 21 (Vercel Sandbox)' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.endsWith('/metadata/navigation.json')) {
        return new Response(JSON.stringify(MOCK_NAV), { status: 200 });
      }
      if (url.endsWith('/metadata/pro192.json')) {
        return new Response(JSON.stringify(MOCK_PRO192), { status: 200 });
      }
      if (url.endsWith('/data/search-index.json')) {
        return new Response(JSON.stringify(MOCK_SEARCH), { status: 200 });
      }
      if (url.endsWith('/content/vi/pro192/slots/slot-01.md')) {
        return new Response(
          '# Slot 01: Tổng quan Java\n\n## 2. Lý thuyết cốt lõi\n\nLý thuyết Slot 1.\n\n<details>\n<summary>📚 Đọc thêm: Lịch sử Java</summary>\n\nNgôn ngữ ban đầu là Oak.\n\n</details>\n\n```java\nSystem.out.println("Hello Slot 1");\n```\n\n## 4. Luyện tập Chủ động\n\n### Bài 1.1: Vai trò Bytecode\n\n**Đề bài:** `javac` tạo ra gì?\n\n<details>\n<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>\n\nTạo file `.class`.\n\n</details>\n\n### 💻 Luyện Code Thực hành (JavaBrew Live Lab)\n\n#### 🟢 Thực hành 1A: In thẻ sinh viên\n- **Mục tiêu:** In dòng Hello Slot 1\n- **Expected Output:**\n  - `Hello Slot 1`\n\n```java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Slot 1");\n  }\n}\n```\n\n<details>\n<summary>👁️ Hiện lời giải chuẩn</summary>\n\nGiải thích chi tiết lời giải.\n\n</details>',
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
    sessionStorage.clear();
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
    expect(screen.getByText(/Crocus\.java · PE1-Q1/i)).toBeInTheDocument();
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
      <MemoryRouter initialEntries={['/pro192/slots/slot-01']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Vai trò Bytecode')).toBeInTheDocument();
      expect(screen.getByText('📚 Đọc thêm: Lịch sử Java')).toBeInTheDocument();
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

  it('runs Code Studio starter vs Diff Clean Code and passes 3/3 test cases (offline fallback)', async () => {
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
    expect(await screen.findByText('0/3 Tiêu chí cấu trúc (Static Preview)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /So sánh Bản Tối ưu \(Diff\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /Áp dụng đoạn code tối ưu này/i }));
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận ghi đè code hiện tại/i }));
    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));

    expect(
      await screen.findByText('✔ 3/3 Tiêu chí cấu trúc (Static Preview — chưa chạy JVM)')
    ).toBeInTheDocument();
    const savedProgress = JSON.parse(localStorage.getItem('javabrew:progress') || '{}') as {
      peStatus?: Record<string, string>;
    };
    expect(savedProgress.peStatus?.['1']).toBe('in-progress');
    expect(savedProgress.peStatus?.['1']).not.toBe('pass');

    fireEvent.click(screen.getByRole('button', { name: 'Cách tối ưu?' }));
    expect(screen.getByText(/Bạn hỏi: “Làm sao tối ưu ngắn hơn nữa\?”/)).toBeInTheDocument();
  });

  it('infers PE1-Q2 class filenames (SpecDaisy.java & Daisy.java) and renders cloud OpenJDK 21 compile diagnostics and passing test cases', async () => {
    let callCount = 0;
    installFetchMock((method) => {
      if (method === 'GET') {
        return new Response(
          JSON.stringify({ available: true, runtime: 'OpenJDK 21 (Vercel Sandbox)', region: 'sin1' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      callCount += 1;
      if (callCount === 1) {
        return new Response(
          JSON.stringify({
            ok: false,
            phase: 'compile',
            jdkVersion: 'javac 21.0.5',
            compileMs: 310,
            runMs: 0,
            exitCode: 1,
            stdout: '',
            stderr: "Daisy.java:1: error: ';' expected\npublic class Daisy { private String name }\n                                            ^",
            diagnostics: [
              {
                file: 'Daisy.java',
                line: 1,
                column: 45,
                severity: 'error',
                message: "';' expected",
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          ok: true,
          phase: 'run',
          jdkVersion: 'javac 21.0.5',
          compileMs: 280,
          runMs: 145,
          exitCode: 0,
          timedOut: false,
          stdout: 'daisy, yellow, 2',
          stderr: '',
          diagnostics: [],
          testResults: [
            { id: 'TC1', name: 'toString() Daisy & SpecDaisy', passed: true, durationMs: 2 },
            { id: 'TC2', name: 'setData() dao 2 chu thuong', passed: true, durationMs: 3 },
            { id: 'TC3', name: 'getValue() kiem tra color', passed: true, durationMs: 1 },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    render(
      <MemoryRouter initialEntries={['/studio/2']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const specTab = await screen.findByRole('tab', { name: 'SpecDaisy.java' });
    const daisyTab = screen.getByRole('tab', { name: 'Daisy.java' });
    expect(specTab).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText(/☕ OpenJDK 21 Sandbox/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));
    const diagBtn = await screen.findByRole('button', { name: /Daisy\.java:1:45/i });
    fireEvent.click(diagBtn);
    expect(daisyTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));
    expect(await screen.findByText('✔ 3/3 Test Cases PASSED! (OpenJDK 21)')).toBeInTheDocument();
    expect(screen.getByText('setData() dao 2 chu thuong')).toBeInTheDocument();
  });

  it('renders /pe Paper filters and link to /pro192/pe-patterns handbook', async () => {
    render(
      <MemoryRouter initialEntries={['/pe']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/PE1-Q1: Crocus/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'PE1 (2)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Q1 · Encapsulation' })).toBeInTheDocument();
    const patternsLinks = screen.getAllByRole('link', { name: /Khuôn mẫu/i });
    expect(patternsLinks[0]).toHaveAttribute('href', '/pro192/pe-patterns');
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
    expect(sessionStorage.getItem('javabrew:byok_key')).toBe('AIzaTest123');
    expect(localStorage.getItem('javabrew:byok_key')).toBeNull();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cài đặt AI Key/i }));
    const persistCheckbox = screen.getByRole('checkbox', { name: /Ghi nhớ API Key/i });
    expect(persistCheckbox).not.toBeChecked();
    fireEvent.click(persistCheckbox);
    fireEvent.click(screen.getByRole('button', { name: /Lưu cấu hình/i }));
    expect(localStorage.getItem('javabrew:byok_key')).toBe('AIzaTest123');
    expect(sessionStorage.getItem('javabrew:byok_key')).toBeNull();
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

  it('switches Hero Preview tabs, renders 3-level roadmap, and toggles mobile menu on M1', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Mới học từ số 0/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mới học từ số 0/i })).toHaveAttribute(
      'href',
      '/pro192/slots/slot-01'
    );
    expect(screen.getByRole('link', { name: /Ôn nước rút thi PE/i })).toHaveAttribute('href', '/pe');

    fireEvent.click(screen.getByRole('tab', { name: /Cơ bản Slot 01/i }));
    expect(screen.getByText(/HelloJava\.java · Slot 01/i)).toBeInTheDocument();

    const menuBtn = screen.getByRole('button', { name: /Mở menu điều hướng/i });
    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('persists Code Studio drafts in localStorage via CodeMirror 6, updates gutter, and supports Reset Undo toast', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/studio/1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const editorDom = await screen.findByLabelText(/Trình soạn thảo mã nguồn Java/i);
    expect(screen.getAllByText(/Static Pattern Evaluator/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Sao chép lệnh biên dịch javac local/i })).toBeInTheDocument();

    const gutter = screen.getByTestId('code-line-gutter');
    expect(gutter).toBeInTheDocument();

    const view = EditorView.findFromDOM(editorDom)!;
    expect(view).not.toBeNull();
    act(() => {
      view.dispatch({
        changes: { from: view.state.doc.length, insert: '\n// draft-saved-line\n// line-extra' },
      });
    });
    fireEvent.blur(editorDom);

    expect(localStorage.getItem('javabrew:pe_draft:1')).toContain('draft-saved-line');

    unmount();

    render(
      <MemoryRouter initialEntries={['/studio/1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const reloadedDom = await screen.findByLabelText(/Trình soạn thảo mã nguồn Java/i);
    const reloadedView = EditorView.findFromDOM(reloadedDom)!;
    expect(reloadedView.state.doc.toString()).toContain('draft-saved-line');
    expect(screen.getByText(/✓ Đã lưu nháp/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Khôi phục gốc/i }));
    expect(reloadedView.state.doc.toString()).not.toContain('draft-saved-line');
    expect(localStorage.getItem('javabrew:pe_draft:1')).toBeNull();

    const undoBtn = await screen.findByRole('button', { name: 'Hoàn tác' });
    fireEvent.click(undoBtn);
    expect(reloadedView.state.doc.toString()).toContain('draft-saved-line');
    expect(localStorage.getItem('javabrew:pe_draft:1')).toContain('draft-saved-line');
  });

  it('renders bilingual VI <-> EN side-by-side columns in JavaGuide reader', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /Song ngữ VI ↔ EN/i }));

    await waitFor(() => {
      const dual = screen.getByTestId('bilingual-dual-columns');
      expect(dual).toHaveTextContent('Nội dung tiếng Việt.');
      expect(dual).toHaveTextContent('English content body.');
    });
  });

  it('respects prefers-reduced-motion: reduce without hiding sections or breaking Hero Preview', async () => {
    const origMatchMedia = window.matchMedia;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    try {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText(/Crocus\.java · PE1-Q1/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Java OOP/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/PASS 3\/3/i)).toBeInTheDocument();
      expect(screen.getByText(/Mới học từ số 0/i)).toBeVisible();
    } finally {
      vi.stubGlobal('matchMedia', origMatchMedia);
    }
  });

  it('launches Free Java Playground from lesson Chạy thử button, supports multi-file add, and executes cloud run', async () => {
    const payloads: Array<{ mode?: string; peId?: number; files?: Array<{ name: string; content: string }> }> = [];

    installFetchMock((method, bodyText) => {
      if (method === 'GET') {
        return new Response(
          JSON.stringify({ available: true, runtime: 'OpenJDK 21 (Vercel Sandbox)', region: 'sin1' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      payloads.push(JSON.parse(bodyText || '{}'));
      return new Response(
        JSON.stringify({
          ok: true,
          phase: 'run',
          jdkVersion: 'javac 21.0.13.1',
          compileMs: 1120,
          runMs: 640,
          exitCode: 0,
          timedOut: false,
          stdout: 'Hello Slot 1\nHelper Ready',
          stderr: '',
          diagnostics: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    render(
      <MemoryRouter initialEntries={['/pro192/slots/slot-01']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const tryBtn = await screen.findByRole('button', {
      name: /Chạy thử đoạn mã Java trong Code Studio Playground/i,
    });
    fireEvent.click(tryBtn);

    const editorDom = await screen.findByLabelText(/Trình soạn thảo mã nguồn Java/i);
    const view = EditorView.findFromDOM(editorDom)!;
    expect(view.state.doc.toString()).toContain('Hello Slot 1');
    expect(screen.getByText(/Đang chạy thử từ bài học/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\+ Thêm tệp/i }));
    const fileInput = screen.getByLabelText(/Tên lớp mới/i);
    fireEvent.change(fileInput, { target: { value: 'Helper' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo tệp/i }));

    expect(screen.getByRole('tab', { name: 'Helper.java' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /▶ Run Code/i }));
    expect(await screen.findByText(/Helper Ready/i)).toBeInTheDocument();
    const lastPayload = payloads.at(-1);
    expect(lastPayload?.mode).toBe('run');
    expect(lastPayload?.peId).toBeUndefined();
    expect(lastPayload?.files?.map((f) => f.name)).toEqual(['Main.java', 'Helper.java']);
  });

  it('supports JavaBrew Live Lab split-pane, layout toggle, Auto-Run, and 45 examples in Code Studio', async () => {
    const origFetch = globalThis.fetch;
    const runCalls: Array<{ mode?: string; files?: Array<{ name: string; content: string }> }> = [];

    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.endsWith('/api/java-run')) {
        const method = (init?.method || 'GET').toUpperCase();
        if (method === 'GET') {
          return new Response(JSON.stringify({ available: true, runtime: 'OpenJDK 21' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const parsed = init?.body
          ? (JSON.parse(String(init.body)) as {
              mode?: string;
              files?: Array<{ name: string; content: string }>;
            })
          : {};
        runCalls.push(parsed);
        const isMulti = parsed.files?.some((f) => f.name === 'Student.java');
        return new Response(
          JSON.stringify({
            available: true,
            ok: true,
            phase: 'run',
            jdkVersion: 'OpenJDK 21',
            compileMs: 35,
            runMs: 14,
            exitCode: 0,
            timedOut: false,
            stdout: isMulti ? 'Student[SE180001 - An]' : 'Hello JavaBrew Live Lab!',
            stderr: '',
            diagnostics: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return origFetch(input, init);
    });

    try {
      render(
        <MemoryRouter initialEntries={['/studio/playground?example=demo-intro']}>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </MemoryRouter>
      );

      const splitPane = await screen.findByTestId('tryit-split-pane');
      expect(splitPane).toHaveAttribute('data-orientation', 'horizontal');

      const terminal = screen.getByTestId('studio-output-terminal');
      expect(await screen.findByText(/Hello JavaBrew Live Lab!/i)).toBeInTheDocument();
      expect(terminal.textContent).toContain('Hello JavaBrew Live Lab!');
      expect(runCalls.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(screen.getByRole('button', { name: 'Xoay bố cục Ngang hoặc Dọc' }));
      expect(screen.getByTestId('tryit-split-pane')).toHaveAttribute('data-orientation', 'vertical');

      fireEvent.click(screen.getByRole('button', { name: /Mẫu \(45\)/i }));
      const searchBox = screen.getByLabelText('Tìm mẫu Java theo tên hoặc Slot');
      fireEvent.change(searchBox, { target: { value: 'Slot 09' } });
      expect(await screen.findByRole('button', { name: /Slot 09 Lab/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /OOP Đa file \(Student \+ Main\)/i })).not.toBeInTheDocument();
      fireEvent.change(searchBox, { target: { value: '' } });

      fireEvent.click(await screen.findByRole('button', { name: /OOP Đa file \(Student \+ Main\)/i }));

      expect(await screen.findByRole('tab', { name: 'Student.java' })).toBeInTheDocument();
      expect(await screen.findByText(/Student\[SE180001 - An\]/i)).toBeInTheDocument();

      // Lucian #013 Stretchy switch for Auto-Run
      const autoSwitch = screen.getByRole('switch', { name: /Auto-Run/i });
      expect(autoSwitch).toHaveAttribute('aria-checked', 'true');
      fireEvent.click(autoSwitch);
      expect(autoSwitch).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(autoSwitch);
      expect(autoSwitch).toHaveAttribute('aria-checked', 'true');

      // Lucian #467 + CodeMirror 10,000-character limit enforcement
      const editorDom = screen.getByLabelText(/Trình soạn thảo mã nguồn Java/i);
      const view = EditorView.findFromDOM(editorDom)!;
      await act(async () => {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: 'a'.repeat(10_500) },
        });
      });
      expect(view.state.doc.length).toBe(10_000);
      await waitFor(() => {
        expect(screen.getByTestId('code-char-limit-meter')).toHaveAttribute(
          'aria-valuenow',
          '10000'
        );
      });

      // Lucian #412 mobile header drawer toggle + Escape handling
      const ham = screen.getByRole('button', { name: 'Mở menu điều hướng' });
      expect(ham).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(ham);
      expect(screen.getByRole('button', { name: 'Đóng menu điều hướng' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByRole('button', { name: 'Mở menu điều hướng' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    } finally {
      vi.stubGlobal('fetch', origFetch);
    }
  });

  it('isolates CodeMirror Undo history per file tab when switching SpecDaisy.java and Daisy.java', async () => {
    render(
      <MemoryRouter initialEntries={['/studio/2']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const specTab = await screen.findByRole('tab', { name: 'SpecDaisy.java' });
    const daisyTab = screen.getByRole('tab', { name: 'Daisy.java' });
    expect(specTab).toHaveAttribute('aria-selected', 'true');

    const ed1 = screen.getByLabelText(/Trình soạn thảo mã nguồn Java/i);
    const v1 = EditorView.findFromDOM(ed1)!;
    await act(async () => {
      v1.dispatch({ changes: { from: 0, insert: '// edit spec\n' } });
    });

    fireEvent.click(daisyTab);
    expect(daisyTab).toHaveAttribute('aria-selected', 'true');

    const ed2 = screen.getByLabelText(/Trình soạn thảo mã nguồn Java/i);
    const v2 = EditorView.findFromDOM(ed2)!;
    await act(async () => {
      v2.dispatch({ changes: { from: 0, insert: '// edit daisy\n' } });
    });

    fireEvent.click(specTab);
    expect(specTab).toHaveAttribute('aria-selected', 'true');

    const ed3 = screen.getByLabelText(/Trình soạn thảo mã nguồn Java/i);
    const v3 = EditorView.findFromDOM(ed3)!;
    await act(async () => {
      undo(v3);
    });

    const docAfterUndo = v3.state.doc.toString();
    expect(docAfterUndo).toContain('public class SpecDaisy');
    expect(docAfterUndo).not.toContain('public class Daisy');
    expect(docAfterUndo).not.toContain('// edit spec');
  });

  it('blocks package declarations at the Dual-Track Hard Policy Gate before calling /api/java-run', async () => {
    let postCalls = 0;
    installFetchMock((method) => {
      if (method === 'GET') {
        return new Response(JSON.stringify({ available: true, runtime: 'OpenJDK 21' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      postCalls += 1;
      return new Response('should not reach server', { status: 500 });
    });

    render(
      <MemoryRouter initialEntries={['/studio/1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/☕ OpenJDK 21 Sandbox/i)).toBeInTheDocument();

    const editorDom = screen.getByLabelText(/Trình soạn thảo mã nguồn Java/i);
    const view = EditorView.findFromDOM(editorDom)!;
    await act(async () => {
      view.dispatch({ changes: { from: 0, insert: 'package demo;\n' } });
    });

    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));

    expect(await screen.findByText('✕ Vi phạm quy chế PE (Hard Policy Gate)')).toBeInTheDocument();
    expect(postCalls).toBe(0);
  });

  it('surfaces explicit HTTP 401 errors from Gemini Interactions API and stops StreamingAiBubble on Dừng', async () => {
    sessionStorage.setItem('javabrew:byok_key', 'AIzaInvalid');
    const baseFetch = globalThis.fetch;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url === 'https://generativelanguage.googleapis.com/v1/interactions') {
          return new Response(JSON.stringify({ error: { message: 'API key not valid' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return baseFetch(input, init);
      })
    );

    try {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/studio/1']}>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </MemoryRouter>
      );

      const quickBtn = await screen.findByRole('button', { name: 'Cách tối ưu?' });
      fireEvent.click(quickBtn);

      expect(await screen.findByText(/API Key không hợp lệ/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mở Cài đặt Key/i })).toBeInTheDocument();

      unmount();

      vi.useFakeTimers();
      try {
        render(
          <MemoryRouter>
            <AppProvider>
              <StreamingAiBubble
                prompt="Test"
                reply={Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ')}
              />
            </AppProvider>
          </MemoryRouter>
        );

        act(() => {
          vi.advanceTimersByTime(65);
        });

        const stopBtn = screen.getByRole('button', { name: 'Dừng' });
        fireEvent.click(stopBtn);
        expect(screen.getByRole('button', { name: 'Hiện toàn bộ' })).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(2000);
        });

        expect(screen.queryByText(/word39/)).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    } finally {
      vi.stubGlobal('fetch', baseFetch);
    }
  });

  it('syncs document.title and calls window.scrollTo via RouteEnhancer across routes', async () => {
    const origScrollTo = window.scrollTo;
    const scrollSpy = vi.fn();
    window.scrollTo = scrollSpy as unknown as typeof window.scrollTo;

    try {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </MemoryRouter>
      );
      await waitFor(() => expect(document.title).toBe('Dashboard — JavaBrew'));
      expect(scrollSpy).toHaveBeenCalled();
      unmount();

      render(
        <MemoryRouter initialEntries={['/pro192/slots/slot-01']}>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </MemoryRouter>
      );
      await waitFor(() =>
        expect(document.title).toBe('Slot 1: Tổng quan Java — JavaBrew PRO192')
      );
    } finally {
      window.scrollTo = origScrollTo;
    }
  });

  it('renders ErrorBoundary fallback (#090) when a child component throws', () => {
    const origErr = console.error;
    console.error = vi.fn();
    function BrokenChild(): never {
      throw new Error('ChunkLoadError mock');
    }

    try {
      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>
      );
      expect(screen.getByText('Không thể tải trang hiện tại')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tải lại trang/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Về Dashboard/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Chi tiết kỹ thuật/i }));
      expect(screen.getByText('ChunkLoadError mock')).toBeInTheDocument();
    } finally {
      console.error = origErr;
    }
  });

  it('exports Backup JSON v2 with PE drafts and resets inline without window.confirm', async () => {
    savePeDraft(1, '// my custom crocus', '');
    let capturedBlob: Blob | null = null;
    const origCreateObjectUrl = URL.createObjectURL;
    const origRevokeObjectUrl = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((b: Blob) => {
      capturedBlob = b;
      return 'blob:mock';
    }) as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();

    try {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </MemoryRouter>
      );

      fireEvent.click(await screen.findByRole('button', { name: /Cài đặt AI Key/i }));
      fireEvent.click(screen.getByRole('button', { name: /Xuất JSON/i }));
      expect(capturedBlob).not.toBeNull();
      const exportedText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(capturedBlob!);
      });
      const parsed = JSON.parse(exportedText) as {
        version: number;
        drafts?: { pe?: Record<string, { mainCode: string }> };
      };
      expect(parsed.version).toBe(2);
      expect(parsed.drafts?.pe?.['1']?.mainCode).toBe('// my custom crocus');

      fireEvent.click(screen.getByRole('button', { name: /Đặt lại/i }));
      fireEvent.click(
        screen.getByRole('checkbox', { name: /Xóa luôn toàn bộ code nháp/i })
      );
      fireEvent.click(screen.getByRole('button', { name: /Xác nhận đặt lại/i }));
      expect(localStorage.getItem('javabrew:pe_draft:1')).toBeNull();
    } finally {
      URL.createObjectURL = origCreateObjectUrl;
      URL.revokeObjectURL = origRevokeObjectUrl;
    }
  });

  it('supports token-based SearchModal with Live Lab, Slide PDF open, combobox A11y, and scroll lock', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await screen.findByRole('button', { name: /Cài đặt AI Key/i });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const combo = await screen.findByRole('combobox', { name: /Nhập từ khóa tìm kiếm/i });
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.change(combo, { target: { value: 'da hinh bigdecimal' } });
    expect(
      await screen.findByText(/Giải thích chi tiết về Đa hình và BigDecimal/i)
    ).toBeInTheDocument();

    const firstOpt = screen.getAllByRole('option')[0];
    expect(firstOpt.querySelector('button')).toBeNull();

    fireEvent.change(combo, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Slide \(1\)/i }));
    fireEvent.click(await screen.findByText('Slide: Get Start'));

    expect(
      await screen.findByRole('dialog', { name: /Xem tài liệu PDF: Get Start/i })
    ).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  it('connects CodingDrillBlock on Slot 01 to JavaBrew Live Lab and auto-verifies Expected Output', async () => {
    installFetchMock((method) => {
      if (method === 'GET') {
        return new Response(JSON.stringify({ available: true, runtime: 'OpenJDK 21' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          available: true,
          ok: true,
          phase: 'run',
          jdkVersion: 'OpenJDK 21',
          compileMs: 25,
          runMs: 12,
          exitCode: 0,
          timedOut: false,
          stdout: 'Hello Slot 1\n',
          stderr: '',
          diagnostics: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    render(
      <MemoryRouter initialEntries={['/pro192/slots/slot-01']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const openLabBtn = await screen.findByRole('button', { name: /Mở trong JavaBrew Live Lab/i });
    fireEvent.click(openLabBtn);

    const drillCard = await screen.findByTestId('live-lab-drill-card');
    expect(drillCard.textContent).toContain('In dòng Hello Slot 1');

    fireEvent.click(screen.getByRole('button', { name: /▶ Run Code/i }));
    expect(await screen.findByText(/✔ Output khớp Expected Output!/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Đánh dấu hoàn thành Thực hành 1A/i }));
    expect(
      screen.getByRole('button', { name: /✔ Đã hoàn thành Thực hành 1A/i })
    ).toBeInTheDocument();
  });

  it('renders Line Diff viewer (#127) with entity tab, 2-step confirm, and Undo restore', async () => {
    render(
      <MemoryRouter initialEntries={['/studio/2']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /So sánh Bản Tối ưu \(Diff\)/i }));
    expect(await screen.findByText(/So sánh từng dòng \(Diff\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2 Cột' }));
    const diffTablist = screen.getByRole('tablist', { name: 'Tệp đang so sánh' });
    fireEvent.click(within(diffTablist).getByRole('tab', { name: 'Daisy.java' }));
    expect(screen.getByText(/khớp với bản chuẩn đề bài/i)).toBeInTheDocument();

    fireEvent.click(within(diffTablist).getByRole('tab', { name: 'SpecDaisy.java' }));
    fireEvent.click(screen.getByRole('button', { name: /Áp dụng đoạn code tối ưu này/i }));
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận ghi đè code hiện tại/i }));

    const undoBtn = await screen.findByRole('button', { name: 'Hoàn tác' });
    fireEvent.click(undoBtn);

    const ed = screen.getByLabelText(/Trình soạn thảo mã nguồn Java/i);
    const view = EditorView.findFromDOM(ed)!;
    expect(view.state.doc.toString()).not.toContain('String color');
  });

  it('provides ThemeToggleButton (#219) on Landing & TopBar and limits VI|EN bar to /docs', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const toLightBtn = await screen.findByRole('button', { name: /Chuyển sang giao diện Sáng/i });
    fireEvent.click(toLightBtn);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    unmount();

    const { unmount: unmountDash } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );
    await screen.findByRole('button', { name: /Chuyển sang giao diện Tối/i });
    expect(screen.queryByRole('group', { name: 'Ngôn ngữ JavaGuide' })).not.toBeInTheDocument();
    unmountDash();

    render(
      <MemoryRouter initialEntries={['/docs/java/basis/bigdecimal.md']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );
    expect(
      await screen.findByRole('group', { name: 'Ngôn ngữ JavaGuide' })
    ).toBeInTheDocument();
  });

  it('defers metadata fetches on LandingPage / until navigating into app routes', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Night Coffee Lab/i)).toBeInTheDocument();
    const callsOnLanding = vi.mocked(fetch).mock.calls.map(([u]) => String(u));
    expect(callsOnLanding.some((u) => u.includes('/metadata/navigation.json'))).toBe(false);
    expect(callsOnLanding.some((u) => u.includes('/metadata/pro192.json'))).toBe(false);

    fireEvent.click(screen.getByRole('link', { name: /Vào Dashboard ngay/i }));
    await waitFor(() => {
      expect(screen.getByText(/Slot 01: Tổng quan Java/i)).toBeInTheDocument();
    });
    const callsAfterNav = vi.mocked(fetch).mock.calls.map(([u]) => String(u));
    expect(callsAfterNav.some((u) => u.includes('/metadata/navigation.json'))).toBe(true);
    expect(callsAfterNav.some((u) => u.includes('/metadata/pro192.json'))).toBe(true);
  });

  it('shows recoverable metaError alert instead of hanging in CodeStudioPage', async () => {
    let proMetaAttempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.endsWith('/api/java-run')) {
          return new Response(
            JSON.stringify({ available: false, runtime: 'OpenJDK 21 (Vercel Sandbox)' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (url.endsWith('/metadata/navigation.json')) {
          return new Response(JSON.stringify(MOCK_NAV), { status: 200 });
        }
        if (url.endsWith('/metadata/pro192.json')) {
          proMetaAttempts += 1;
          if (proMetaAttempts === 1) {
            return new Response('Server error', { status: 500 });
          }
          return new Response(JSON.stringify(MOCK_PRO192), { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      })
    );

    render(
      <MemoryRouter initialEntries={['/studio/1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const mainEl = screen.getByRole('main');
    const studioAlert = await within(mainEl).findByRole('alert');
    expect(studioAlert).toHaveTextContent(/Không thể tải dữ liệu chỉ mục/i);
    expect(screen.queryByText(/Đang tải dữ liệu Code Studio/i)).not.toBeInTheDocument();
    expect(within(mainEl).getByRole('link', { name: /Mở JavaBrew Live Lab/i })).toHaveAttribute(
      'href',
      '/studio/playground'
    );

    fireEvent.click(within(mainEl).getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText(/Yêu cầu bài toán:/i)).toBeInTheDocument();
  });

  it('normalizes and deduplicates completedPe keys ("1" and "01") across storage sanitization', async () => {
    expect(normalizePeKey('1')).toBe('01');
    expect(normalizePeKey(19)).toBe('19');

    localStorage.setItem(
      'javabrew:progress',
      JSON.stringify({
        completedPe: ['1', '01', '2', '12'],
      })
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('javabrew:progress') || '{}') as {
        completedPe?: string[];
      };
      expect(saved.completedPe).toEqual(['01', '02', '12']);
    });
  });
});
