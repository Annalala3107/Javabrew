import { hasMainMethod, inferJavaFileName, stripJavaComments } from './javaFiles';

export interface PlaygroundFile {
  id: string;
  name: string;
  content: string;
}

export interface PlaygroundTemplate {
  id: string;
  title: string;
  subtitle: string;
  stdin: string;
  files: PlaygroundFile[];
}

export interface PlaygroundWorkspaceState {
  files: PlaygroundFile[];
  activeFileId: string;
  stdin: string;
  sourceLabel?: string;
}

export const MAX_PLAYGROUND_FILES = 5;
const STORAGE_PLAYGROUND = 'javabrew:playground_v1';
const VALID_JAVA_NAME = /^[A-Za-z_][A-Za-z0-9_]*\.java$/;

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'hello-scanner',
    title: 'Cơ bản (Hello + Scanner stdin)',
    subtitle: 'Chạy main(), đọc stdin với fallback mặc định',
    stdin: 'An\n9.25',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.hasNextLine() ? sc.nextLine().trim() : "JavaBrew Student";
        double gpa = sc.hasNextDouble() ? sc.nextDouble() : 8.5;

        System.out.printf("Xin chào %s! GPA mục tiêu của bạn: %.2f%n", name, gpa);
        System.out.println("Phiên bản Java: " + System.getProperty("java.version"));
    }
}
`,
      },
    ],
  },
  {
    id: 'oop-multi',
    title: 'OOP Đa file (Student + Main)',
    subtitle: '2 class độc lập, Comparator & List',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<>(List.of(
            new Student("Minh", 8.5),
            new Student("An", 8.5),
            new Student("Linh", 9.4)
        ));

        list.sort(Comparator.comparingDouble(Student::getGpa).reversed()
                .thenComparing(Student::getName));

        System.out.println("=== Bảng xếp hạng OOP ===");
        for (Student s : list) {
            System.out.println(s);
        }
    }
}
`,
      },
      {
        id: 'pg-student',
        name: 'Student.java',
        content: `public class Student {
    private final String name;
    private final double gpa;

    public Student(String name, double gpa) {
        this.name = (name == null) ? "" : name.trim();
        this.gpa = (gpa >= 0.0 && gpa <= 10.0) ? gpa : 0.0;
    }

    public String getName() {
        return name;
    }

    public double getGpa() {
        return gpa;
    }

    @Override
    public String toString() {
        return String.format("%s - %.2f", name, gpa);
    }
}
`,
      },
    ],
  },
  {
    id: 'collections-stream',
    title: 'Collections & Stream API',
    subtitle: 'HashMap, TreeSet & Java 21 Stream.toList()',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "Java OOP Collections Java Stream PRO192 OOP Java";
        Map<String, Integer> freq = new HashMap<>();
        for (String token : text.trim().toLowerCase().split("\\\\s+")) {
            freq.put(token, freq.getOrDefault(token, 0) + 1);
        }

        List<Map.Entry<String, Integer>> sorted = freq.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .toList();

        sorted.forEach(e -> System.out.println(e.getKey() + " -> " + e.getValue()));
    }
}
`,
      },
    ],
  },
];

export function cloneTemplateFiles(templateId: string): {
  template: PlaygroundTemplate;
  files: PlaygroundFile[];
} {
  const found =
    PLAYGROUND_TEMPLATES.find((t) => t.id === templateId) || PLAYGROUND_TEMPLATES[0];
  return {
    template: found,
    files: found.files.map((f, idx) => ({
      id: `${found.id}-${idx}-${Date.now()}`,
      name: f.name,
      content: f.content,
    })),
  };
}

export function validateNewJavaFileName(
  rawName: string,
  existingNames: string[]
): { ok: true; fileName: string } | { ok: false; error: string } {
  if (existingNames.length >= MAX_PLAYGROUND_FILES) {
    return {
      ok: false,
      error: `Tối đa ${MAX_PLAYGROUND_FILES} tệp .java trong Playground.`,
    };
  }
  const trimmed = rawName.trim();
  if (!trimmed) {
    return { ok: false, error: 'Hãy nhập tên lớp Java (ví dụ: Student).' };
  }
  const withExt = trimmed.toLowerCase().endsWith('.java')
    ? `${trimmed.slice(0, -5)}.java`
    : `${trimmed}.java`;

  if (!VALID_JAVA_NAME.test(withExt)) {
    return {
      ok: false,
      error: 'Tên tệp chỉ gồm chữ cái, số, "_" và phải bắt đầu bằng chữ cái (ví dụ: Car.java).',
    };
  }
  if (withExt.startsWith('__JavaBrew')) {
    return {
      ok: false,
      error: `Tên tệp ${withExt} được dành riêng cho hệ thống.`,
    };
  }
  const lower = withExt.toLowerCase();
  if (existingNames.some((n) => n.toLowerCase() === lower)) {
    return { ok: false, error: `Tệp ${withExt} đã tồn tại.` };
  }
  return { ok: true, fileName: withExt };
}

function stripPackageDeclaration(code: string): string {
  return code.replace(
    /^([ \t]*package\s+[A-Za-z_][A-Za-z0-9_.]*\s*;)/m,
    '// $1 (đã bỏ package để chạy độc lập trong Playground)'
  );
}

function detectAnyTopLevelClassName(cleanedCode: string): string | null {
  const match = cleanedCode.match(
    /(?:^|\n)[ \t]*(?:public\s+|final\s+|abstract\s+|sealed\s+|non-sealed\s+)*(?:class|interface|enum|record)\s+([A-Za-z_][A-Za-z0-9_]*)\b/
  );
  return match?.[1] || null;
}

function looksLikeMethodDeclaration(cleanedBody: string): boolean {
  const firstNonEmpty = cleanedBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstNonEmpty) return false;
  return /^(?:(?:public|private|protected)\s+|static\s+(?:final\s+|synchronized\s+)?)[A-Za-z0-9_<>\[\],\s.?]+\s+[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\{/.test(
    firstNonEmpty
  );
}

function indentLines(text: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return text
    .split(/\r?\n/)
    .map((line) => (line.trim().length > 0 ? `${prefix}${line}` : ''))
    .join('\n');
}

export function prepareJavaPlaygroundFiles(
  rawCode: string,
  _sourceLabel?: string
): { files: PlaygroundFile[]; note: string } {
  const trimmed = rawCode.replace(/\s+$/, '');
  const withoutPackage = stripPackageDeclaration(trimmed);
  const cleaned = stripJavaComments(withoutPackage);
  const ts = Date.now();

  const publicClassFile = inferJavaFileName(withoutPackage, '');
  const anyClassName = detectAnyTopLevelClassName(cleaned);
  const hasTypeDecl = Boolean(publicClassFile || anyClassName);
  const hasMain = hasMainMethod(withoutPackage);

  if (hasTypeDecl && hasMain) {
    const fileName = publicClassFile || (anyClassName ? `${anyClassName}.java` : 'Main.java');
    return {
      files: [
        {
          id: `pg-src-${ts}`,
          name: fileName,
          content: `${withoutPackage}\n`,
        },
      ],
      note: `Đoạn mã đã sẵn sàng chạy trực tiếp trong ${fileName} trên OpenJDK 21.`,
    };
  }

  if (hasTypeDecl && !hasMain) {
    const classFileName =
      publicClassFile || (anyClassName ? `${anyClassName}.java` : 'SampleClass.java');
    const className = classFileName.replace(/\.java$/, '');
    const mainName = className === 'Main' ? 'PlaygroundRunner.java' : 'Main.java';
    const mainEntry = mainName.replace(/\.java$/, '');
    return {
      files: [
        {
          id: `pg-cls-${ts}`,
          name: classFileName,
          content: `${withoutPackage}\n`,
        },
        {
          id: `pg-runner-${ts}`,
          name: mainName,
          content: `public class ${mainEntry} {
    public static void main(String[] args) {
        System.out.println("Biên dịch thành công lớp ${className}! Hãy khởi tạo và gọi thử trong ${mainName}.");
    }
}
`,
        },
      ],
      note: `Đã tách lớp ${className} vào ${classFileName} và tạo sẵn ${mainName} để biên dịch/chạy thử.`,
    };
  }

  // Raw snippet (statements or method declaration) -> hoist imports & wrap inside public class Main
  const lines = withoutPackage.split(/\r?\n/);
  const imports: string[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (/^\s*import\s+[^;]+;\s*$/.test(line)) {
      imports.push(line.trim());
    } else {
      bodyLines.push(line);
    }
  }

  const normalizedImports = new Set<string>(['import java.util.*;', ...imports]);
  if (/\b(?:BigDecimal|BigInteger|MathContext|RoundingMode)\b/.test(cleaned)) {
    normalizedImports.add('import java.math.*;');
  }
  if (/\b(?:File|BufferedReader|InputStreamReader|FileInputStream|IOException)\b/.test(cleaned)) {
    normalizedImports.add('import java.io.*;');
  }
  if (/\bStandardCharsets\b/.test(cleaned)) {
    normalizedImports.add('import java.nio.charset.*;');
  }
  if (/\b(?:Pattern|Matcher)\b/.test(cleaned)) {
    normalizedImports.add('import java.util.regex.*;');
  }

  const bodyText = bodyLines.join('\n').trim();
  const cleanBodyText = stripJavaComments(bodyText);
  const importHeader = Array.from(normalizedImports).join('\n');

  if (looksLikeMethodDeclaration(cleanBodyText)) {
    const content = `${importHeader}

public class Main {
${indentLines(bodyText, 4)}

    public static void main(String[] args) throws Exception {
        System.out.println("Đã nạp phương thức vào Main.java — hãy gọi thử từ main()!");
    }
}
`;
    return {
      files: [{ id: `pg-main-${ts}`, name: 'Main.java', content }],
      note: 'Đã tự động bọc phương thức vào Main.java để biên dịch và gọi thử ngay.',
    };
  }

  const statementBody = bodyText || 'System.out.println("Hello from JavaBrew Playground!");';
  const content = `${importHeader}

public class Main {
    public static void main(String[] args) throws Exception {
${indentLines(statementBody, 8)}
    }
}
`;
  return {
    files: [{ id: `pg-main-${ts}`, name: 'Main.java', content }],
    note: 'Đã tự động bọc đoạn code vào Main.java để chạy thử ngay.',
  };
}

export function readPlaygroundWorkspace(): PlaygroundWorkspaceState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PLAYGROUND);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlaygroundWorkspaceState>;
    if (!Array.isArray(parsed.files) || parsed.files.length === 0) return null;
    const files = parsed.files
      .filter(
        (f): f is PlaygroundFile =>
          Boolean(f) &&
          typeof f.id === 'string' &&
          typeof f.name === 'string' &&
          typeof f.content === 'string'
      )
      .slice(0, MAX_PLAYGROUND_FILES);
    if (files.length === 0) return null;
    const activeFileId =
      typeof parsed.activeFileId === 'string' && files.some((f) => f.id === parsed.activeFileId)
        ? parsed.activeFileId
        : files[0].id;
    return {
      files,
      activeFileId,
      stdin: typeof parsed.stdin === 'string' ? parsed.stdin : '',
      sourceLabel: typeof parsed.sourceLabel === 'string' ? parsed.sourceLabel : undefined,
    };
  } catch {
    return null;
  }
}

export function savePlaygroundWorkspace(state: PlaygroundWorkspaceState): void {
  try {
    localStorage.setItem(STORAGE_PLAYGROUND, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues
  }
}

export function clearPlaygroundWorkspace(): void {
  try {
    localStorage.removeItem(STORAGE_PLAYGROUND);
  } catch {
    // Ignore
  }
}
