import { hasMainMethod, inferJavaFileName, stripJavaComments } from './javaFiles';
import { SLOT_LAB_TEMPLATES } from './slotLabTemplates';

export interface PlaygroundFile {
  id: string;
  name: string;
  content: string;
}

export type PlaygroundTemplateCategory =
  | 'Cơ bản'
  | 'OOP'
  | 'Collections'
  | 'Exception & File I/O'
  | 'Thực chiến PE';

export interface PlaygroundTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: PlaygroundTemplateCategory;
  slotRef: string;
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
const MAX_SHARE_PAYLOAD_CHARS = 16_000;
const STORAGE_PLAYGROUND = 'javabrew:playground_v1';
const VALID_JAVA_NAME = /^[A-Za-z_][A-Za-z0-9_]*\.java$/;

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'demo-intro',
    title: 'Hello World & main() (demo_intro)',
    subtitle: 'Chương trình Java đầu tiên chạy ngay trên JavaBrew Live Lab',
    category: 'Cơ bản',
    slotRef: 'Slot 01–03',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Xin chao JavaBrew Live Lab!");
        System.out.println("Java Version: " + System.getProperty("java.version"));

        for (int i = 1; i <= 3; i++) {
            System.out.println("-> Buoc " + i + ": Hoc PRO192 that de!");
        }
    }
}
`,
      },
    ],
  },
  {
    id: 'hello-scanner',
    title: 'Scanner nhập dữ liệu (stdin)',
    subtitle: 'Đọc tên & GPA từ Scanner(System.in)',
    category: 'Cơ bản',
    slotRef: 'Slot 04–09',
    stdin: 'An\n9.25',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        Scanner sc = new Scanner(System.in);
        String name = sc.hasNextLine() ? sc.nextLine().trim() : "JavaBrew Student";
        double gpa = sc.hasNextDouble() ? sc.nextDouble() : 8.5;

        System.out.printf("Xin chao %s! GPA muc tieu: %.2f%n", name, gpa);
        System.out.println("Xep loai: " + (gpa >= 8.0 ? "Gioi" : "Kha"));
    }
}
`,
      },
    ],
  },
  {
    id: 'variables-casting',
    title: 'Biến, Kiểu nguyên thủy & Ép kiểu',
    subtitle: 'Tránh bẫy chia nguyên (5 / 2 vs 5 / 2.0) trong PE',
    category: 'Cơ bản',
    slotRef: 'Slot 04',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        int brightness = 750;
        int refresh = 90;

        double wrongRisk = (brightness / 100) * (refresh / 60);
        double rightRisk = (brightness / 100.0) * (refresh / 60.0);

        System.out.println("Chia nguyen (SAI): " + wrongRisk);
        System.out.println("Chia thuc (DUNG): " + rightRisk);

        int code = 'A';
        System.out.println("ASCII 'A' = " + code + ", char = " + (char) (code + 2));
    }
}
`,
      },
    ],
  },
  {
    id: 'control-loops',
    title: 'switch, Vòng lặp & for-each',
    subtitle: 'Kiểm tra số nguyên tố & tổng chữ số chẵn',
    category: 'Cơ bản',
    slotRef: 'Slot 05',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `public class Main {
    static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        int[] nums = {2, 9, 11, 15, 17, 24};
        System.out.print("Cac so nguyen to: ");
        for (int x : nums) {
            if (isPrime(x)) {
                System.out.print(x + " ");
            }
        }
        System.out.println();

        int weight = 2048;
        int evenCount = 0;
        for (char c : String.valueOf(weight).toCharArray()) {
            if ((c - '0') % 2 == 0) evenCount++;
        }
        System.out.println("So chu so chan cua " + weight + ": " + evenCount);
    }
}
`,
      },
    ],
  },
  {
    id: 'string-pool-builder',
    title: 'String Pool (== vs equals) & StringBuilder',
    subtitle: 'So sánh chuỗi & bẫy replace() vs replaceAll(".")',
    category: 'Cơ bản',
    slotRef: 'Slot 09',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        String a = "PRO192";
        String b = "PRO192";
        String c = new String("PRO192");

        System.out.println("a == b (String Pool): " + (a == b));
        System.out.println("a == c (Heap vs Pool): " + (a == c));
        System.out.println("a.equals(c): " + a.equals(c));

        String url = "https://fap.fpt.edu.vn";
        System.out.println("replace('.', ':'): " + url.replace(".", ":"));
        System.out.println("replaceAll('.', ':'): " + url.replaceAll(".", ":"));
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
    category: 'OOP',
    slotRef: 'Slot 12–13',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<Student>(Arrays.asList(
            new Student("Minh", 8.5),
            new Student("An", 8.5),
            new Student("Linh", 9.4)
        ));

        Collections.sort(list, new Comparator<Student>() {
            @Override
            public int compare(Student s1, Student s2) {
                int cmp = Double.compare(s2.getGpa(), s1.getGpa());
                return (cmp != 0) ? cmp : s1.getName().compareTo(s2.getName());
            }
        });

        System.out.println("=== Bang xep hang OOP ===");
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
    id: 'inheritance-super',
    title: 'Kế thừa extends, super() & @Override',
    subtitle: 'Đa file Book + EBook + Main chuẩn dạng PE Q2',
    category: 'OOP',
    slotRef: 'Slot 14–16',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        Book paper = new Book("Head First Java", 100.0);
        Book ebook = new EBook("Java Core Spec", 100.0, 0.2);

        System.out.println(paper);
        System.out.println(ebook);
        System.out.println("Gia sau giam (da hinh): " + ebook.getFinalPrice());
    }
}
`,
      },
      {
        id: 'pg-book',
        name: 'Book.java',
        content: `public class Book {
    private String title;
    private double price;

    public Book(String title, double price) {
        this.title = title;
        this.price = price;
    }

    public String getTitle() { return title; }
    public double getPrice() { return price; }
    public double getFinalPrice() { return price; }

    @Override
    public String toString() {
        return title + ", " + String.format("%.2f", getFinalPrice());
    }
}
`,
      },
      {
        id: 'pg-ebook',
        name: 'EBook.java',
        content: `public class EBook extends Book {
    private double discountRate;

    public EBook(String title, double price, double discountRate) {
        super(title, price);
        this.discountRate = (discountRate >= 0 && discountRate <= 1) ? discountRate : 0;
    }

    @Override
    public double getFinalPrice() {
        return getPrice() * (1.0 - discountRate);
    }

    @Override
    public String toString() {
        return "[EBook] " + getTitle() + ", " + String.format("%.2f", getFinalPrice());
    }
}
`,
      },
    ],
  },
  {
    id: 'polymorphism-casting',
    title: 'Đa hình, instanceof & Downcasting',
    subtitle: 'Duyệt mảng Shape & ép kiểu an toàn với instanceof',
    category: 'OOP',
    slotRef: 'Slot 17–18',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `abstract class Shape {
    abstract double area();
}

class Circle extends Shape {
    double r;
    Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
    double diameter() { return 2 * r; }
}

class Rectangle extends Shape {
    double w, h;
    Rectangle(double w, double h) { this.w = w; this.h = h; }
    @Override double area() { return w * h; }
}

public class Main {
    public static void main(String[] args) {
        Shape[] shapes = { new Circle(3.0), new Rectangle(4.0, 5.0) };
        for (Shape s : shapes) {
            System.out.printf("%s -> dien tich = %.2f%n", s.getClass().getSimpleName(), s.area());
            if (s instanceof Circle) {
                Circle c = (Circle) s;
                System.out.println("  -> Duong kinh hinh tron: " + c.diameter());
            }
        }
    }
}
`,
      },
    ],
  },
  {
    id: 'interface-anonymous',
    title: 'Interface & Anonymous Class (JDK 8)',
    subtitle: 'Cài đặt Interface dạng lớp thường và lớp nội danh',
    category: 'OOP',
    slotRef: 'Slot 20–21',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `interface StringTool {
    String transform(String input);
}

public class Main {
    public static void main(String[] args) {
        StringTool acronymTool = new StringTool() {
            @Override
            public String transform(String input) {
                StringBuilder sb = new StringBuilder();
                for (String w : input.trim().split("\\\\s+")) {
                    if (!w.isEmpty() && Character.isLetter(w.charAt(0))) {
                        sb.append(Character.toUpperCase(w.charAt(0)));
                    }
                }
                return sb.toString();
            }
        };

        System.out.println("Acronym 1: " + acronymTool.transform("object oriented program"));
        System.out.println("Acronym 2: " + acronymTool.transform("123 data structure"));
    }
}
`,
      },
    ],
  },
  {
    id: 'exception-handling',
    title: 'try-catch-finally & Custom Exception',
    subtitle: 'Bắt ngoại lệ & kiểm tra dữ liệu biên an toàn',
    category: 'Exception & File I/O',
    slotRef: 'Slot 22–24',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `class InvalidGpaException extends Exception {
    public InvalidGpaException(String message) {
        super(message);
    }
}

public class Main {
    static double parseGpa(String raw) throws InvalidGpaException {
        double val = Double.parseDouble(raw.trim());
        if (val < 0.0 || val > 10.0) {
            throw new InvalidGpaException("GPA phai trong doan [0.0, 10.0], nhan duoc: " + val);
        }
        return val;
    }

    public static void main(String[] args) {
        String[] inputs = {"8.75", "not_a_number", "12.5"};
        for (String item : inputs) {
            try {
                double ok = parseGpa(item);
                System.out.println("Hop le: " + ok);
            } catch (NumberFormatException e) {
                System.out.println("Loi dinh dang so: '" + item + "'");
            } catch (InvalidGpaException e) {
                System.out.println("Custom Exception -> " + e.getMessage());
            }
        }
    }
}
`,
      },
    ],
  },
  {
    id: 'arraylist-iterator',
    title: 'Xóa an toàn ArrayList bằng Iterator',
    subtitle: 'Tránh ConcurrentModificationException & bỏ sót phần tử',
    category: 'Collections',
    slotRef: 'Slot 25',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> shoes = new ArrayList<String>(Arrays.asList(
            "sandal", "slipper", "tre em", "sneaker", "the thao"
        ));
        System.out.println("Truoc khi xoa: " + shoes);

        Iterator<String> it = shoes.iterator();
        while (it.hasNext()) {
            String name = it.next();
            if (name.toLowerCase().startsWith("s")) {
                it.remove();
            }
        }
        System.out.println("Sau khi xoa cac ten bat dau bang 's': " + shoes);
    }
}
`,
      },
    ],
  },
  {
    id: 'collections-stream',
    title: 'HashMap Đếm từ & Sắp xếp',
    subtitle: 'Đếm tần suất với HashMap & sắp xếp Entry 2 tiêu chí',
    category: 'Collections',
    slotRef: 'Slot 26–27',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "Java OOP Collections Java Stream PRO192 OOP Java";
        Map<String, Integer> freq = new HashMap<String, Integer>();
        for (String token : text.trim().toLowerCase().split("\\\\s+")) {
            Integer cur = freq.get(token);
            freq.put(token, cur == null ? 1 : cur + 1);
        }

        List<Map.Entry<String, Integer>> entries = new ArrayList<Map.Entry<String, Integer>>(freq.entrySet());
        Collections.sort(entries, new Comparator<Map.Entry<String, Integer>>() {
            @Override
            public int compare(Map.Entry<String, Integer> a, Map.Entry<String, Integer> b) {
                int cmp = Integer.compare(b.getValue(), a.getValue());
                return (cmp != 0) ? cmp : a.getKey().compareTo(b.getKey());
            }
        });

        for (Map.Entry<String, Integer> e : entries) {
            System.out.println(e.getKey() + " -> " + e.getValue());
        }
    }
}
`,
      },
    ],
  },
  {
    id: 'comparator-partial-sort',
    title: 'Partial Sort giữ vị trí (Mẫu PE1-Q3)',
    subtitle: 'Thuật toán 3 bước tách indices, sort nhóm khớp & gán lại',
    category: 'Thực chiến PE',
    slotRef: 'Slot 27',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    static boolean hasLower(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 'a' && c <= 'z') return true;
        }
        return false;
    }

    public static void main(String[] args) {
        List<String> names = new ArrayList<String>(Arrays.asList("A11", "b12", "C23", "d45", "E56", "f67"));
        List<Integer> ages = new ArrayList<Integer>(Arrays.asList(5, 9, 1, 5, 11, 2));

        List<Integer> idxList = new ArrayList<Integer>();
        List<Integer> subIdx = new ArrayList<Integer>();
        for (int i = 0; i < names.size(); i++) {
            if (hasLower(names.get(i))) {
                idxList.add(i);
                subIdx.add(i);
            }
        }

        final List<Integer> agesRef = ages;
        Collections.sort(subIdx, new Comparator<Integer>() {
            @Override
            public int compare(Integer i1, Integer i2) {
                return Integer.compare(agesRef.get(i1), agesRef.get(i2));
            }
        });

        List<String> newNames = new ArrayList<String>(names);
        List<Integer> newAges = new ArrayList<Integer>(ages);
        for (int k = 0; k < idxList.size(); k++) {
            int pos = idxList.get(k);
            int src = subIdx.get(k);
            newNames.set(pos, names.get(src));
            newAges.set(pos, ages.get(src));
        }

        for (int i = 0; i < newNames.size(); i++) {
            System.out.print("(" + newNames.get(i) + "," + newAges.get(i) + ") ");
        }
        System.out.println();
    }
}
`,
      },
    ],
  },
  {
    id: 'pe-q4-string-digits',
    title: 'Tách từ split & HashSet Chữ số (Mẫu PE5-Q4)',
    subtitle: 'Đếm từ có đúng 2 chữ số khác nhau & có chữ thường',
    category: 'Thực chiến PE',
    slotRef: 'Slot 26',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.util.*;

public class Main {
    public static int f1(String str) {
        if (str == null || str.trim().isEmpty()) return 0;
        int count = 0;
        for (String w : str.trim().split("\\\\s+")) {
            Set<Character> distinctDigits = new HashSet<Character>();
            boolean hasLower = false;
            for (int i = 0; i < w.length(); i++) {
                char c = w.charAt(i);
                if (Character.isDigit(c)) distinctDigits.add(c);
                else if (c >= 'a' && c <= 'z') hasLower = true;
            }
            if (distinctDigits.size() == 2 && hasLower) {
                System.out.println("  Khop dieu kien f1: " + w + " -> digits=" + distinctDigits);
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        String sample = "A12b B121 c34D 111X";
        System.out.println("Input: " + sample);
        System.out.println("Ket qua f1 = " + f1(sample));
    }
}
`,
      },
    ],
  },
  {
    id: 'file-io-csv',
    title: 'Phân tích CSV & Bắt NumberFormatException',
    subtitle: 'Đọc BufferedReader từng dòng và bỏ qua dòng lỗi giá trị',
    category: 'Exception & File I/O',
    slotRef: 'Slot 28–29',
    stdin: '',
    files: [
      {
        id: 'pg-main',
        name: 'Main.java',
        content: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        String csv = "P01,Chuot khong day,850.0\\n"
                   + "BAD,Dong loi gia,not_a_number\\n"
                   + "P02,Ban phim co,1250.0";

        List<String> valid = new ArrayList<String>();
        try (BufferedReader br = new BufferedReader(new StringReader(csv))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length != 3) continue;
                try {
                    double price = Double.parseDouble(parts[2].trim());
                    valid.add(parts[0].trim() + " - " + parts[1].trim() + " (" + price + ")");
                } catch (NumberFormatException e) {
                    System.out.println("[Bo qua dong hong]: " + line);
                }
            }
        }
        System.out.println("So dong hop le: " + valid.size());
        for (String item : valid) {
            System.out.println("  ✔ " + item);
        }
    }
}
`,
      },
    ],
  },
  ...SLOT_LAB_TEMPLATES,
];

export function findPlaygroundTemplate(id: string): PlaygroundTemplate | null {
  return PLAYGROUND_TEMPLATES.find((t) => t.id === id) || null;
}

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

function encodeBase64UrlUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64UrlUtf8(raw: string): string {
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

export function encodePlaygroundShareParam(
  state: Pick<PlaygroundWorkspaceState, 'files' | 'stdin'>
): string | null {
  const compact = {
    f: state.files.slice(0, MAX_PLAYGROUND_FILES).map((file) => ({
      n: file.name,
      c: file.content,
    })),
    s: state.stdin || '',
  };
  const json = JSON.stringify(compact);
  if (json.length > MAX_SHARE_PAYLOAD_CHARS) {
    return null;
  }
  return encodeBase64UrlUtf8(json);
}

export function decodePlaygroundShareParam(raw: string): PlaygroundWorkspaceState | null {
  if (!raw || raw.length > MAX_SHARE_PAYLOAD_CHARS * 2) return null;
  try {
    const json = decodeBase64UrlUtf8(raw.trim());
    if (json.length > MAX_SHARE_PAYLOAD_CHARS) return null;
    const parsed = JSON.parse(json) as {
      f?: Array<{ n?: unknown; c?: unknown }>;
      s?: unknown;
    };
    if (!Array.isArray(parsed.f) || parsed.f.length === 0) return null;

    const seen = new Set<string>();
    const files: PlaygroundFile[] = [];
    const ts = Date.now();
    for (let i = 0; i < Math.min(parsed.f.length, MAX_PLAYGROUND_FILES); i++) {
      const item = parsed.f[i];
      if (!item || typeof item.n !== 'string' || typeof item.c !== 'string') {
        return null;
      }
      if (!VALID_JAVA_NAME.test(item.n) || item.n.startsWith('__JavaBrew')) {
        return null;
      }
      const lower = item.n.toLowerCase();
      if (seen.has(lower)) return null;
      seen.add(lower);
      files.push({
        id: `share-${ts}-${i}`,
        name: item.n,
        content: item.c,
      });
    }
    if (files.length === 0) return null;

    return {
      files,
      activeFileId: files[0].id,
      stdin: typeof parsed.s === 'string' ? parsed.s : '',
      sourceLabel: 'Liên kết chia sẻ JavaBrew Live Lab',
    };
  } catch {
    return null;
  }
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
