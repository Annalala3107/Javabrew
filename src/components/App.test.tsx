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
      objectives: ['Hiểu cơ chế JDK, JRE và JVM độc lập nền tảng.'],
      examTraps: ['Bẫy **JDK 8 trong PE**: Không dùng `isBlank()`, hãy dùng `trim().isEmpty()`.'],
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
  sandboxHandler?: (method: string, bodyText?: string) => Promise<Response> | Response,
  aiHandler?: (
    method: string,
    bodyText?: string,
    init?: RequestInit
  ) => Promise<Response> | Response
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/api/ai-mentor')) {
        if (aiHandler) {
          return aiHandler(
            (init?.method || 'GET').toUpperCase(),
            typeof init?.body === 'string' ? init.body : undefined,
            init
          );
        }
        return new Response('Not found', { status: 404 });
      }
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

    const searchDialog = screen.getByRole('dialog', { name: /Tìm kiếm toàn cục JavaBrew/i });
    await waitFor(() => {
      expect(
        within(searchDialog).getByText(/Giải thích chi tiết về Đa hình và BigDecimal/i)
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(searchInp, { key: 'Escape' });

    fireEvent.click(screen.getByRole('button', { name: /Cài đặt AI Key/i }));
    const keyInp = screen.getByLabelText(/Gemini API Key/i);
    fireEvent.change(keyInp, { target: { value: 'AIzaTest123' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu cấu hình/i }));
    expect(localStorage.getItem('javabrew:byok_key')).toBe('AIzaTest123');
    expect(sessionStorage.getItem('javabrew:byok_key')).toBeNull();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cài đặt AI Key/i }));
    const persistCheckbox = screen.getByRole('checkbox', { name: /Ghi nhớ API Key/i });
    expect(persistCheckbox).toBeChecked();
    fireEvent.click(persistCheckbox);
    fireEvent.click(screen.getByRole('button', { name: /Lưu cấu hình/i }));
    expect(sessionStorage.getItem('javabrew:byok_key')).toBe('AIzaTest123');
    expect(localStorage.getItem('javabrew:byok_key')).toBeNull();
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

    const ed1 = await screen.findByLabelText(/Trình soạn thảo mã nguồn Java/i);
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

    const searchDialog = screen.getByRole('dialog', { name: /Tìm kiếm toàn cục JavaBrew/i });
    fireEvent.change(combo, { target: { value: 'da hinh bigdecimal' } });
    expect(
      await within(searchDialog).findByText(/Giải thích chi tiết về Đa hình và BigDecimal/i)
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

  it('activates automatic Server AI Mentor streaming without BYOK key and aborts cleanly on Dừng', async () => {
    const encoder = new TextEncoder();
    let streamCount = 0;
    let abortedObserved = false;

    installFetchMock(undefined, (method, _body, init) => {
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            available: true,
            mode: 'server',
            defaultModel: 'gemini-3.5-flash-lite',
            dailyLimit: 30,
            remaining: 30,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      streamCount += 1;
      if (streamCount === 1) {
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                'event: meta\ndata: {"source":"server","model":"gemini-3.5-flash-lite","remaining":29,"limit":30}\n\n'
              )
            );
            controller.enqueue(encoder.encode('event: delta\ndata: {"text":"Gợi ý tự động "}\n\n'));
            controller.enqueue(encoder.encode('event: delta\ndata: {"text":"cho Crocus."}\n\n'));
            controller.enqueue(
              encoder.encode(
                'event: done\ndata: {"interactionId":"int_auto_1","model":"gemini-3.5-flash-lite","source":"server","remaining":29,"limit":30}\n\n'
              )
            );
            controller.close();
          },
        });
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        });
      }

      // 2nd call stays open until aborted
      const pendingBody = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'event: meta\ndata: {"source":"server","model":"gemini-3.5-flash-lite","remaining":28,"limit":30}\n\n'
            )
          );
          init?.signal?.addEventListener(
            'abort',
            () => {
              abortedObserved = true;
              try {
                controller.error(new DOMException('Aborted', 'AbortError'));
              } catch {
                // ignore
              }
            },
            { once: true }
          );
        },
      });
      return new Response(pendingBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    });

    render(
      <MemoryRouter initialEntries={['/studio/1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/✨ AI Tự động \(30\/30\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cách tối ưu?' }));
    expect(await screen.findByText(/Gợi ý tự động cho Crocus\./i)).toBeInTheDocument();
    expect(screen.getByText(/✨ AI Tự động \(29\/30\)/i)).toBeInTheDocument();

    // Start second request and click Stop (Dừng) while busy
    fireEvent.click(screen.getByRole('button', { name: 'Giải thích code' }));
    expect(screen.getByRole('button', { name: 'Cách tối ưu?' })).toBeDisabled();
    const stopButtons = await screen.findAllByRole('button', { name: 'Dừng' });
    fireEvent.click(stopButtons[0]);

    await waitFor(() => {
      expect(abortedObserved).toBe(true);
      expect(screen.getByRole('button', { name: 'Cách tối ưu?' })).not.toBeDisabled();
    });
  });

  it('renders dynamic Dashboard cluster counts, exercise count, and Study Bridge', async () => {
    const richNav: NavigationData = {
      ...MOCK_NAV,
      totalArticles: 78,
      domains: [
        {
          id: 'java',
          labelEn: 'Java Core',
          labelVi: 'Java Cốt lõi',
          totalArticles: 78,
          groups: [
            {
              id: 'basis',
              labelEn: 'Basics',
              labelVi: 'Cơ bản',
              count: 15,
              articles: Array.from({ length: 15 }, (_, i) => ({
                rel: i === 0 ? 'java/basis/bigdecimal.md' : `java/basis/b${i}.md`,
                titleZh: '',
                titleEn: `Base ${i}`,
                titleVi: i === 0 ? 'Giải thích chi tiết về Đa hình và BigDecimal' : `Bài cơ bản ${i}`,
                chars: 1200,
                lines: 40,
                images: 0,
                status: { zhRef: 'ready', en: 'done', vi: 'done' },
              })),
            },
            {
              id: 'new-features',
              labelEn: 'New',
              labelVi: 'Mới',
              count: 18,
              articles: Array.from({ length: 18 }, (_, i) => ({
                rel: `java/new-features/n${i}.md`,
                titleZh: '',
                titleEn: `New ${i}`,
                titleVi: `New ${i}`,
                chars: 1200,
                lines: 40,
                images: 0,
                status: { zhRef: 'ready', en: 'done', vi: 'done' },
              })),
            },
            {
              id: 'collection',
              labelEn: 'Collections',
              labelVi: 'Collections',
              count: 12,
              articles: Array.from({ length: 12 }, (_, i) => ({
                rel: `java/collection/c${i}.md`,
                titleZh: '',
                titleEn: `Col ${i}`,
                titleVi: `Col ${i}`,
                chars: 1200,
                lines: 40,
                images: 0,
                status: { zhRef: 'ready', en: 'done', vi: 'done' },
              })),
            },
            {
              id: 'jvm',
              labelEn: 'JVM',
              labelVi: 'JVM',
              count: 11,
              articles: Array.from({ length: 11 }, (_, i) => ({
                rel: `java/jvm/j${i}.md`,
                titleZh: '',
                titleEn: `JVM ${i}`,
                titleVi: `JVM ${i}`,
                chars: 1200,
                lines: 40,
                images: 0,
                status: { zhRef: 'ready', en: 'done', vi: 'done' },
              })),
            },
            {
              id: 'concurrent',
              labelEn: 'Concurrent',
              labelVi: 'Concurrent',
              count: 17,
              articles: Array.from({ length: 17 }, (_, i) => ({
                rel: `java/concurrent/co${i}.md`,
                titleZh: '',
                titleEn: `Conc ${i}`,
                titleVi: `Conc ${i}`,
                chars: 1200,
                lines: 40,
                images: 0,
                status: { zhRef: 'ready', en: 'done', vi: 'done' },
              })),
            },
            {
              id: 'io',
              labelEn: 'IO',
              labelVi: 'IO',
              count: 5,
              articles: Array.from({ length: 5 }, (_, i) => ({
                rel: `java/io/io${i}.md`,
                titleZh: '',
                titleEn: `IO ${i}`,
                titleVi: `IO ${i}`,
                chars: 1200,
                lines: 40,
                images: 0,
                status: { zhRef: 'ready', en: 'done', vi: 'done' },
              })),
            },
          ],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.endsWith('/metadata/navigation.json')) {
          return new Response(JSON.stringify(richNav), { status: 200 });
        }
        if (url.endsWith('/metadata/pro192.json')) {
          return new Response(JSON.stringify(MOCK_PRO192), { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      })
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Collections (12)')).toBeInTheDocument();
    expect(screen.getByText('Concurrency & IO (22)')).toBeInTheDocument();
    expect(screen.getByText('Bài tập: 0/1')).toBeInTheDocument();
    expect(screen.getByText(/Cầu nối gợi ý \(Slot 01\)/i)).toBeInTheDocument();
    expect(screen.getByText('Giải thích chi tiết về Đa hình và BigDecimal')).toBeInTheDocument();
  });

  it('routes non-PE Slot to matching Live Lab, auto-closes mobile sidebar, supports bottom completion, and hides PE CTA on non-Java docs', async () => {
    const dbNav: NavigationData = {
      ...MOCK_NAV,
      totalDomains: 2,
      totalArticles: 2,
      domains: [
        ...MOCK_NAV.domains,
        {
          id: 'database',
          labelEn: 'Database',
          labelVi: 'Cơ sở dữ liệu',
          totalArticles: 1,
          groups: [
            {
              id: 'mysql',
              labelEn: 'MySQL',
              labelVi: 'MySQL',
              count: 1,
              articles: [
                {
                  rel: 'database/mysql/index-basics.md',
                  titleZh: 'Index',
                  titleEn: 'MySQL Index',
                  titleVi: 'B+Tree Index trong MySQL',
                  chars: 1800,
                  lines: 60,
                  images: 0,
                  status: { zhRef: 'ready', en: 'done', vi: 'done' },
                },
              ],
            },
          ],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.endsWith('/metadata/navigation.json')) {
          return new Response(JSON.stringify(dbNav), { status: 200 });
        }
        if (url.endsWith('/metadata/pro192.json')) {
          return new Response(JSON.stringify(MOCK_PRO192), { status: 200 });
        }
        if (url.endsWith('/content/vi/pro192/slots/slot-01.md')) {
          return new Response('# Slot 01\n\nNội dung Slot 01.', { status: 200 });
        }
        if (url.endsWith('/content/vi/pro192/slots/slot-02.md')) {
          return new Response('# Slot 02\n\nNội dung Slot 02.', { status: 200 });
        }
        if (url.endsWith('/content/vi/database/mysql/index-basics.md')) {
          return new Response('# MySQL Index\n\nNội dung chỉ mục B+Tree.', { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      })
    );

    const { unmount } = render(
      <MemoryRouter initialEntries={['/pro192/slots/slot-01']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await screen.findByText('Nội dung Slot 01.');

    const tocBtn = screen.getByRole('button', { name: /Mục lục/i });
    fireEvent.click(tocBtn);
    expect(tocBtn).toHaveAttribute('aria-expanded', 'true');

    // Bottom slot complete button works without scrolling to top
    fireEvent.click(screen.getByRole('button', { name: /^Hoàn thành Slot 01$/i }));
    expect(
      screen.getByRole('button', { name: /✔ Đã hoàn thành Slot 01/i })
    ).toBeInTheDocument();

    // Navigating to Slot 02 auto-closes mobile sidebar and shows Live Lab CTA
    fireEvent.click(screen.getByRole('link', { name: /Slot 02: Cài đặt JDK & NetBeans/i }));
    await screen.findByText('Nội dung Slot 02.');
    expect(screen.getByRole('button', { name: /Mục lục/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(
      screen.getByRole('button', { name: /▶ Thực hành Slot 02 \(Live Lab\)/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Thực hành Live Lab Slot 02 →/i })
    ).toHaveAttribute('href', '/studio/playground?example=slot-02-lab');

    unmount();

    // Non-Java JavaGuide domain hides PE/AnanQuiz CTA and shows domain-appropriate CTA
    render(
      <MemoryRouter initialEntries={['/docs/database/mysql/index-basics.md']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );
    await screen.findByText('Nội dung chỉ mục B+Tree.');
    expect(screen.queryByRole('link', { name: /Làm bài code PE/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ôn Quiz FE/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem thêm bài Cơ sở dữ liệu/i })).toHaveAttribute(
      'href',
      '/docs?domain=database'
    );
  });

  it('renders real examTraps & objectives in Code Studio Lý thuyết nhanh and alerts on invalid /studio/:peId', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/studio/1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const theoryTab = await screen.findByRole('tab', { name: 'Lý thuyết nhanh' });
    fireEvent.click(theoryTab);
    expect(await screen.findByText(/Bẫy thi PE & JDK 8 \(PE1-Q1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Không dùng/i)).toBeInTheDocument();
    expect(screen.getByText(/Hiểu cơ chế JDK, JRE và JVM độc lập nền tảng\./i)).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/studio/999']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Không tìm thấy đề PE “999”/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Về Kho Đề PE/i })).toHaveAttribute('href', '/pe');
  });

  it('supports Socratic/Deep mentor toggle and 1-click javac diagnostic, TC fail, and Clean Code actions in Code Studio', async () => {
    const encoder = new TextEncoder();
    let sandboxPostCount = 0;
    const capturedAiRequests: Array<{ mentorStyle?: string; prompt?: string }> = [];

    installFetchMock(
      (method) => {
        if (method === 'GET') {
          return new Response(
            JSON.stringify({ available: true, runtime: 'OpenJDK 21 (Vercel Sandbox)', region: 'sin1' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        sandboxPostCount += 1;
        if (sandboxPostCount === 1) {
          return new Response(
            JSON.stringify({
              ok: false,
              phase: 'compile',
              jdkVersion: 'javac 21.0.5',
              compileMs: 120,
              runMs: 0,
              exitCode: 1,
              stdout: '',
              stderr: "Daisy.java:1: error: ';' expected",
              diagnostics: [
                {
                  file: 'Daisy.java',
                  line: 1,
                  column: 18,
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
            ok: false,
            phase: 'run',
            jdkVersion: 'javac 21.0.5',
            compileMs: 110,
            runMs: 35,
            exitCode: 1,
            timedOut: false,
            stdout: 'daisy3',
            stderr: '',
            diagnostics: [],
            testResults: [
              {
                id: 'TC1',
                name: 'setData() loai bo ky tu so',
                passed: false,
                durationMs: 3,
                expected: 'daisy',
                actual: 'daisy3',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      },
      (method, bodyText) => {
        if (method === 'GET') {
          return new Response(
            JSON.stringify({
              available: true,
              mode: 'server',
              defaultModel: 'gemini-3.5-flash-lite',
              dailyLimit: 30,
              remaining: 30,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const parsed = JSON.parse(bodyText || '{}') as { mentorStyle?: string; prompt?: string };
        capturedAiRequests.push({ mentorStyle: parsed.mentorStyle, prompt: parsed.prompt });
        const replyText = `Phản hồi (${parsed.mentorStyle}) #${capturedAiRequests.length}`;
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'event: meta\ndata: {"source":"server","model":"gemini-3.5-flash-lite","remaining":29,"limit":30}\n\n'
                )
              );
              controller.enqueue(
                encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: replyText })}\n\n`)
              );
              controller.enqueue(
                encoder.encode(
                  'event: done\ndata: {"interactionId":"int_socratic_1","model":"gemini-3.5-flash-lite","source":"server","remaining":29,"limit":30}\n\n'
                )
              );
              controller.close();
            },
          }),
          { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }
        );
      }
    );

    render(
      <MemoryRouter initialEntries={['/studio/2']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    const socraticBtn = await screen.findByRole('button', { name: /🎓 Gia sư \(Socratic\)/i });
    const deepBtn = screen.getByRole('button', { name: /🔬 Giải thích sâu/i });
    expect(socraticBtn).toHaveAttribute('aria-pressed', 'true');
    expect(deepBtn).toHaveAttribute('aria-pressed', 'false');

    // 1. Trigger compile diagnostic -> click 1-click ✨ Hỏi AI
    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));
    const askDiagBtn = await screen.findByRole('button', { name: /Hỏi AI về lỗi dòng 1/i });
    fireEvent.click(askDiagBtn);

    expect(await screen.findByText(/Phản hồi \(socratic\) #1/i)).toBeInTheDocument();
    expect(capturedAiRequests[0].mentorStyle).toBe('socratic');
    expect(capturedAiRequests[0].prompt).toContain("';' expected");

    // 2. Switch to Deep mode -> trigger failed TC -> click ✨ Tại sao TC1 fail?
    fireEvent.click(deepBtn);
    expect(deepBtn).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('javabrew:ai_mentor_style')).toBe('deep');

    fireEvent.click(screen.getByRole('button', { name: /Chấm Test Case PE/i }));
    const askTcBtn = await screen.findByRole('button', { name: /✨ Tại sao TC1 fail\?/i });
    fireEvent.click(askTcBtn);
    expect(await screen.findByText(/Phản hồi \(deep\) #2/i)).toBeInTheDocument();
    expect(capturedAiRequests[1].prompt).toContain('TC1');

    // 3. Click ✨ Chấm Clean Code PE
    fireEvent.click(screen.getByRole('button', { name: /✨ Chấm Clean Code PE/i }));
    expect(await screen.findByText(/Phản hồi \(deep\) #3/i)).toBeInTheDocument();
    expect(capturedAiRequests[2].prompt).toContain('Clean Code');
  });

  it('opens LearnPage AI Reading Tutor drawer, caches summary, and enables runnable Java blocks', async () => {
    const encoder = new TextEncoder();

    installFetchMock(undefined, (method, bodyText) => {
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            available: true,
            mode: 'server',
            defaultModel: 'gemini-3.5-flash-lite',
            dailyLimit: 30,
            remaining: 30,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const parsed = JSON.parse(bodyText || '{}') as {
        action?: string;
        learnContext?: { intent?: string };
      };
      const isSummary = parsed.learnContext?.intent === 'summarize';
      const replyText = isSummary
        ? '- Ý 1: JVM chạy bytecode\n- Ý 2: Đóng gói dữ liệu'
        : 'Ví dụ minh họa:\n\n```java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Live!");\n  }\n}\n```';
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                `event: meta\ndata: ${JSON.stringify({
                  source: 'server',
                  model: 'gemini-3.5-flash-lite',
                  remaining: isSummary ? 30 : 29,
                  limit: 30,
                  ...(isSummary ? { cached: true } : {}),
                })}\n\n`
              )
            );
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: replyText })}\n\n`)
            );
            controller.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({
                  source: 'server',
                  model: 'gemini-3.5-flash-lite',
                  remaining: isSummary ? 30 : 29,
                  limit: 30,
                  ...(isSummary ? { cached: true } : {}),
                })}\n\n`
              )
            );
            controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }
      );
    });

    render(
      <MemoryRouter initialEntries={['/pro192/slots/slot-01']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await screen.findByText(/Lý thuyết Slot 1\./i);

    fireEvent.click(screen.getByRole('button', { name: /✨ AI Bài học/i }));
    const drawer = await screen.findByRole('dialog', { name: /AI Trợ lý bài học/i });

    fireEvent.click(within(drawer).getByRole('button', { name: /📝 Tóm tắt 5 ý cốt lõi/i }));
    expect(await within(drawer).findByText(/JVM chạy bytecode/i)).toBeInTheDocument();
    expect(within(drawer).getByText(/Cache · 0 lượt/i)).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole('button', { name: /☕ Ví dụ Java chạy thử/i }));
    expect(
      await within(drawer).findByRole('button', {
        name: /Chạy thử đoạn mã Java trong Code Studio Playground/i,
      })
    ).toBeInTheDocument();
  });

  it('grades ExerciseBlock answers via AI and completes 5-question Slot FE Mini-Quiz', async () => {
    const encoder = new TextEncoder();

    installFetchMock(undefined, (method, bodyText) => {
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            available: true,
            mode: 'server',
            defaultModel: 'gemini-3.5-flash-lite',
            dailyLimit: 30,
            remaining: 30,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const parsed = JSON.parse(bodyText || '{}') as { action?: string };
      if (parsed.action === 'slot-quiz') {
        return new Response(
          JSON.stringify({
            ok: true,
            cached: false,
            source: 'server',
            model: 'gemini-3.5-flash-lite',
            remaining: 28,
            limit: 30,
            quiz: {
              slot: 1,
              title: 'Tổng quan Java & OOP',
              generatedAt: '2026-11-26',
              questions: [
                {
                  id: 'q1',
                  question: 'Lệnh nào biên dịch file Java thành bytecode?',
                  codeSnippet: 'javac Main.java',
                  options: ['java', 'javac', 'javadoc', 'jar'],
                  correctIndex: 1,
                  explanation: 'javac biên dịch .java thành .class bytecode.',
                  topicTag: 'JDK',
                },
                {
                  id: 'q2',
                  question: 'Thành phần nào thực thi bytecode?',
                  options: ['JVM', 'CSS', 'DOM', 'SQL'],
                  correctIndex: 0,
                  explanation: 'JVM nạp và chạy bytecode độc lập nền tảng.',
                  topicTag: 'JVM',
                },
                {
                  id: 'q3',
                  question: 'Chuẩn phiên bản Java môn PRO192 là gì?',
                  options: ['JDK 5', 'JDK 8', 'JDK 23', 'JDK 1.1'],
                  correctIndex: 1,
                  explanation: 'Đề thi PRO192 chấm theo chuẩn JDK 8.',
                  topicTag: 'PRO192',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                'event: meta\ndata: {"source":"server","model":"gemini-3.5-flash-lite","remaining":29,"limit":30}\n\n'
              )
            );
            controller.enqueue(
              encoder.encode(
                'event: delta\ndata: {"text":"**Đánh giá: 9/10** — Nắm rất chắc bytecode."}\n\n'
              )
            );
            controller.enqueue(
              encoder.encode(
                'event: done\ndata: {"source":"server","model":"gemini-3.5-flash-lite","remaining":29,"limit":30}\n\n'
              )
            );
            controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }
      );
    });

    render(
      <MemoryRouter initialEntries={['/pro192/slots/slot-01']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    await screen.findByText(/Lý thuyết Slot 1\./i);

    // ExerciseBlock AI grader
    fireEvent.click(screen.getByRole('button', { name: /✨ Tự làm & AI chấm/i }));
    const draftBox = await screen.findByLabelText(/Câu trả lời thử cho Bài 1\.1/i);
    fireEvent.change(draftBox, { target: { value: 'javac tạo file bytecode .class chạy trên JVM' } });
    fireEvent.click(screen.getByRole('button', { name: /✨ AI chấm & nhận xét/i }));

    expect(await screen.findByText(/Nắm rất chắc bytecode\./i)).toBeInTheDocument();
    const markDoneBtn = screen.getByRole('button', {
      name: /✔ Đánh dấu đã hoàn thành Bài 1\.1/i,
    });
    fireEvent.click(markDoneBtn);

    // Slot Mini-Quiz FE
    fireEvent.click(screen.getByRole('button', { name: /✨ Sinh Mini-Quiz FE \(5 câu\)/i }));
    expect(await screen.findByText(/Câu 1: Lệnh nào biên dịch file Java thành bytecode\?/i)).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]); // q1 -> B (javac)
    fireEvent.click(radios[4]); // q2 -> A (JVM)
    fireEvent.click(radios[9]); // q3 -> B (JDK 8)

    fireEvent.click(screen.getByRole('button', { name: /✔ Nộp bài & xem giải thích/i }));
    expect(await screen.findByText(/Kết quả: 3\/3/i)).toBeInTheDocument();
    expect(screen.getByText(/javac biên dịch \.java thành \.class bytecode\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🔁 Làm lại bộ này/i })).toBeInTheDocument();
  });

  it('manages Notes, Bookmarks, Mistakes, and Markdown export in /notes Study Notebook', async () => {
    localStorage.setItem(
      'javabrew:progress',
      JSON.stringify({
        completedArticles: [],
        completedSlots: [1],
        solvedExercises: [],
        completedDrills: [],
        completedPe: [],
        bookmarks: ['docs:java/basis/bigdecimal.md'],
        notes: {
          'pro192:slots/slot-01': 'Nhớ default package khi thi PE.',
          'docs:java/basis/bigdecimal.md': 'Dùng String constructor cho BigDecimal.',
        },
        mistakes: [
          {
            id: 'm-1',
            type: 'runtime',
            title: 'NullPointerException ở setName()',
            detail: 'Chưa kiểm tra null trước trim().',
            peId: 1,
            createdAt: '2026-11-26T10:00:00Z',
            resolved: false,
          },
        ],
        peStatus: {},
        lastVisited: null,
      })
    );

    const createObjSpy = vi.fn(() => 'blob:mock-md-url');
    const revokeObjSpy = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createObjSpy, revokeObjectURL: revokeObjSpy }));
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      render(
        <MemoryRouter initialEntries={['/notes']}>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText(/Slot 01: Tổng quan Java/i)).toBeInTheDocument();
      expect(screen.getByText(/Nhớ default package khi thi PE\./i)).toBeInTheDocument();

      // Search filters notes
      const searchBox = screen.getByLabelText(/Tìm trong Sổ tay học tập/i);
      fireEvent.change(searchBox, { target: { value: 'BigDecimal' } });
      expect(screen.queryByText(/Nhớ default package khi thi PE\./i)).not.toBeInTheDocument();
      expect(screen.getByText(/Dùng String constructor cho BigDecimal\./i)).toBeInTheDocument();
      fireEvent.change(searchBox, { target: { value: '' } });

      // Inline edit first note
      const editBtns = screen.getAllByRole('button', { name: /^Sửa$/i });
      fireEvent.click(editBtns[0]);
      const editTextarea = screen.getByLabelText(/Chỉnh sửa ghi chú cho Slot 01/i);
      fireEvent.change(editTextarea, { target: { value: 'Đã cập nhật ghi chú Slot 01.' } });
      fireEvent.click(screen.getByRole('button', { name: /^Lưu thay đổi$/i }));
      expect(await screen.findByText(/Đã cập nhật ghi chú Slot 01\./i)).toBeInTheDocument();

      // Export Markdown
      fireEvent.click(screen.getByRole('button', { name: /⬇ Xuất Markdown \(\.md\)/i }));
      expect(createObjSpy).toHaveBeenCalledTimes(1);
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);

      // Bookmarks tab
      fireEvent.click(screen.getByRole('tab', { name: /🔖 Đã lưu/i }));
      expect(
        await screen.findByText(/Giải thích chi tiết về Đa hình và BigDecimal/i)
      ).toBeInTheDocument();

      // Mistakes tab
      fireEvent.click(screen.getByRole('tab', { name: /⚠️ Lỗi cần tránh/i }));
      expect(await screen.findByText(/NullPointerException ở setName\(\)/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Đánh dấu đã sửa/i }));
      expect(await screen.findByText(/Chưa ghi nhận|Không có lỗi nào khớp/i)).toBeInTheDocument();
    } finally {
      anchorClickSpy.mockRestore();
    }
  });

  it('runs timed Mock PE Exam (/pe/mock/PE1) with AI/Diff locked, submits 2-step for Scorecard, and calls AI Examiner', async () => {
    const encoder = new TextEncoder();
    const seenAiActions: string[] = [];

    installFetchMock(undefined, async (method, bodyText) => {
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            available: true,
            mode: 'server',
            defaultModel: 'gemini-3.5-flash-lite',
            dailyLimit: 15,
            remaining: 15,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const parsed = JSON.parse(bodyText || '{}') as { action?: string };
      if (parsed.action) seenAiActions.push(parsed.action);
      const stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
          ctrl.enqueue(
            encoder.encode(
              `event: meta\ndata: ${JSON.stringify({
                source: 'server',
                model: 'gemini-3.5-flash-lite',
                remaining: 14,
                limit: 15,
              })}\n\n`
            )
          );
          ctrl.enqueue(
            encoder.encode(
              `event: delta\ndata: ${JSON.stringify({
                text: 'Nhận xét PE1: Kiểm tra lại super(name, age) ở SpecDaisy.',
              })}\n\n`
            )
          );
          ctrl.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({
                source: 'server',
                model: 'gemini-3.5-flash-lite',
                remaining: 14,
                limit: 15,
              })}\n\n`
            )
          );
          ctrl.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    });

    render(
      <MemoryRouter initialEntries={['/pe/mock/PE1']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Chế độ Thi thật · PE1/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã khóa Diff & AI trong lúc thi/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /So sánh Bản Tối ưu/i })).not.toBeInTheDocument();

    // 2-step submission
    fireEvent.click(screen.getByRole('button', { name: /✔ Nộp bài thi/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Xác nhận nộp ngay/i }));

    expect(await screen.findByText(/Phiếu điểm Phòng thi PE ảo · PE1/i)).toBeInTheDocument();
    expect(screen.getByText(/Tổng điểm:/i)).toBeInTheDocument();

    // Trigger AI Examiner post-submit
    fireEvent.click(screen.getByRole('button', { name: /✨ Nhận xét của AI Giám khảo PE/i }));
    expect(
      await screen.findByText(/Kiểm tra lại super\(name, age\) ở SpecDaisy/i)
    ).toBeInTheDocument();
    expect(seenAiActions).toEqual(['mock-exam-review']);
  });

  it('renders Dashboard AiStudyCoachCard with zero AI calls on mount and streams opt-in 30-min plan', async () => {
    const encoder = new TextEncoder();
    const seenAiRequests: Array<{ method: string; action?: string }> = [];

    installFetchMock(undefined, async (method, bodyText) => {
      const parsed = bodyText ? (JSON.parse(bodyText) as { action?: string }) : {};
      seenAiRequests.push({ method, action: parsed.action });
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            available: true,
            mode: 'server',
            defaultModel: 'gemini-3.5-flash-lite',
            dailyLimit: 15,
            remaining: 15,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
          ctrl.enqueue(
            encoder.encode(
              `event: delta\ndata: ${JSON.stringify({
                text: 'Phút 0-15: Ôn Slot 01 Tổng quan Java.',
              })}\n\n`
            )
          );
          ctrl.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({
                source: 'server',
                model: 'gemini-3.5-flash-lite',
                remaining: 14,
                limit: 15,
              })}\n\n`
            )
          );
          ctrl.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/AI Study Coach · Gợi ý lộ trình hôm nay/i)).toBeInTheDocument();
    expect(screen.getByText(/Phòng thi thử PE \(85 phút\)/i)).toBeInTheDocument();
    expect(seenAiRequests).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: /✨ Lập kế hoạch 30 phút bằng AI/i }));
    expect(await screen.findByText(/Phút 0-15: Ôn Slot 01 Tổng quan Java\./i)).toBeInTheDocument();
    expect(seenAiRequests.some((r) => r.action === 'study-coach')).toBe(true);
    expect(localStorage.getItem('javabrew:study_coach_v1')).toContain('Phút 0-15');
  });

  it('supports SearchModal AI RAG Q&A with cache badge and closes modal when clicking internal citation', async () => {
    const encoder = new TextEncoder();
    const seenAiActions: string[] = [];

    installFetchMock(undefined, async (method, bodyText) => {
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            available: true,
            mode: 'server',
            defaultModel: 'gemini-3.5-flash-lite',
            dailyLimit: 15,
            remaining: 15,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const parsed = JSON.parse(bodyText || '{}') as { action?: string };
      if (parsed.action) seenAiActions.push(parsed.action);
      const stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
          ctrl.enqueue(
            encoder.encode(
              `event: meta\ndata: ${JSON.stringify({
                source: 'server',
                model: 'gemini-3.5-flash-lite',
                remaining: 15,
                limit: 15,
                cached: true,
              })}\n\n`
            )
          );
          ctrl.enqueue(
            encoder.encode(
              `event: delta\ndata: ${JSON.stringify({
                text: 'Xem chi tiết tại [Slot 01 Java](/pro192/slots/slot-01) nhé.',
              })}\n\n`
            )
          );
          ctrl.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({
                source: 'server',
                model: 'gemini-3.5-flash-lite',
                remaining: 15,
                limit: 15,
                cached: true,
              })}\n\n`
            )
          );
          ctrl.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    });

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
    fireEvent.change(combo, { target: { value: 'Tổng quan Java và BigDecimal' } });

    const askRagBtn = await screen.findByRole('button', {
      name: /✨ Hỏi AI từ kho học liệu JavaBrew/i,
    });
    fireEvent.click(askRagBtn);

    expect(await screen.findByText('Cache · 0 lượt')).toBeInTheDocument();
    const internalLink = await screen.findByRole('link', { name: 'Slot 01 Java' });
    expect(seenAiActions).toEqual(['rag-search']);

    fireEvent.click(internalLink);
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /Tìm kiếm toàn cục JavaBrew/i })
      ).not.toBeInTheDocument();
    });
    expect(await screen.findByText(/Lý thuyết Slot 1\./i)).toBeInTheDocument();
  });
});
