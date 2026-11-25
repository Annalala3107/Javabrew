// Auto-generated from server/java-run.ts via scripts/build-api.mjs

// server/javaValidation.ts
var MAX_SOURCE_FILES = 5;
var MAX_TOTAL_SOURCE_BYTES = 65536;
var MAX_STDIN_BYTES = 8192;
var FILE_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*\.java$/;
var utf8Encoder = new TextEncoder();
function utf8ByteLength(text) {
  return utf8Encoder.encode(text).length;
}
function stripJavaComments(code) {
  return code.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n\r]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (match) => match.startsWith("//") || match.startsWith("/*") ? match.replace(/[^\n\r]/g, " ") : match
  );
}
function hasMainMethod(sourceCode) {
  const cleaned = stripJavaComments(sourceCode);
  return /\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(\s*String(?:\s*\[\s*\]|\s*\.\.\.)\s+[A-Za-z_][A-Za-z0-9_]*\s*\)/.test(
    cleaned
  ) || /\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(\s*String\s+[A-Za-z_][A-Za-z0-9_]*\s*\[\s*\]\s*\)/.test(
    cleaned
  );
}
function validateCompilePayload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Payload ph\u1EA3i l\xE0 JSON object h\u1EE3p l\u1EC7." };
  }
  const record = raw;
  const mode = record.mode;
  if (mode !== "run" && mode !== "grade") {
    return { ok: false, error: 'Ch\u1EBF \u0111\u1ED9 ch\u1EA1y (mode) ph\u1EA3i l\xE0 "run" ho\u1EB7c "grade".' };
  }
  let peId;
  if (record.peId !== void 0 && record.peId !== null) {
    if (typeof record.peId !== "number" || !Number.isInteger(record.peId) || record.peId < 1 || record.peId > 4) {
      return { ok: false, error: "peId kh\xF4ng h\u1EE3p l\u1EC7 (ch\u1EC9 h\u1ED7 tr\u1EE3 \u0111\u1EC1 PE 1 \u0111\u1EBFn 4)." };
    }
    peId = record.peId;
  } else if (mode === "grade") {
    return { ok: false, error: "Ch\u1EBF \u0111\u1ED9 ch\u1EA5m test PE y\xEAu c\u1EA7u peId h\u1EE3p l\u1EC7." };
  }
  if (!Array.isArray(record.files) || record.files.length === 0) {
    return { ok: false, error: "C\u1EA7n \xEDt nh\u1EA5t 1 t\u1EC7p m\xE3 ngu\u1ED3n .java." };
  }
  if (record.files.length > MAX_SOURCE_FILES) {
    return { ok: false, error: `T\u1ED1i \u0111a ${MAX_SOURCE_FILES} t\u1EC7p m\xE3 ngu\u1ED3n m\u1ED7i l\u1EA7n bi\xEAn d\u1ECBch.` };
  }
  const seenLower = /* @__PURE__ */ new Set();
  const validatedFiles = [];
  let totalBytes = 0;
  for (const item of record.files) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "M\u1ED7i ph\u1EA7n t\u1EED trong files ph\u1EA3i g\u1ED3m { name, content }." };
    }
    const f = item;
    if (typeof f.name !== "string" || !FILE_NAME_REGEX.test(f.name)) {
      return {
        ok: false,
        error: `T\xEAn t\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7 (${String(f.name)}). Ch\u1EC9 ch\u1EA5p nh\u1EADn t\xEAn l\u1EDBp Java chu\u1EA9n (*.java).`
      };
    }
    if (f.name.startsWith("__JavaBrew")) {
      return { ok: false, error: `T\xEAn t\u1EC7p ${f.name} \u0111\u01B0\u1EE3c d\xE0nh ri\xEAng cho h\u1EC7 th\u1ED1ng ch\u1EA5m.` };
    }
    const lower = f.name.toLowerCase();
    if (seenLower.has(lower)) {
      return { ok: false, error: `Tr\xF9ng t\xEAn t\u1EC7p m\xE3 ngu\u1ED3n: ${f.name}.` };
    }
    seenLower.add(lower);
    if (typeof f.content !== "string") {
      return { ok: false, error: `N\u1ED9i dung t\u1EC7p ${f.name} ph\u1EA3i l\xE0 chu\u1ED7i v\u0103n b\u1EA3n.` };
    }
    totalBytes += utf8ByteLength(f.content);
    if (totalBytes > MAX_TOTAL_SOURCE_BYTES) {
      return { ok: false, error: "T\u1ED5ng dung l\u01B0\u1EE3ng m\xE3 ngu\u1ED3n v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n 64 KB." };
    }
    validatedFiles.push({ name: f.name, content: f.content });
  }
  let stdin = "";
  if (record.stdin !== void 0 && record.stdin !== null) {
    if (typeof record.stdin !== "string") {
      return { ok: false, error: "stdin ph\u1EA3i l\xE0 chu\u1ED7i v\u0103n b\u1EA3n." };
    }
    if (utf8ByteLength(record.stdin) > MAX_STDIN_BYTES) {
      return { ok: false, error: "D\u1EEF li\u1EC7u stdin v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n 8 KB." };
    }
    stdin = record.stdin;
  }
  return {
    ok: true,
    data: {
      mode,
      peId,
      files: validatedFiles,
      stdin
    }
  };
}
var JAVAC_HEADER_REGEX = /^(?:.*[/\\])?([A-Za-z_][A-Za-z0-9_]*\.java):(\d+):\s*(error|warning|note):\s*(.+)$/;
function parseJavacDiagnostics(stderr, fallbackPrimaryFile = "Main.java") {
  if (!stderr) return [];
  const lines = stderr.split(/\r?\n/);
  const diagnostics = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(JAVAC_HEADER_REGEX);
    if (!match) continue;
    const rawFile = match[1];
    const lineNum = Math.max(1, Number.parseInt(match[2], 10) || 1);
    const rawSeverity = match[3];
    const message = match[4].trim();
    if (rawSeverity === "note") {
      continue;
    }
    const severity = rawSeverity === "error" ? "error" : "warning";
    if (rawFile.startsWith("__JavaBrew")) {
      if (severity === "error") {
        diagnostics.push({
          file: fallbackPrimaryFile,
          line: 1,
          column: 1,
          severity: "error",
          message: `Ch\u1EEF k\xFD class ho\u1EB7c ph\u01B0\u01A1ng th\u1EE9c ch\u01B0a kh\u1EDBp \u0111\u1EC1 b\xE0i PE (${message}).`
        });
      }
      continue;
    }
    let column = 1;
    for (let lookahead = 1; lookahead <= 3 && i + lookahead < lines.length; lookahead++) {
      const nextLine = lines[i + lookahead];
      if (JAVAC_HEADER_REGEX.test(nextLine)) break;
      const caretMatch = nextLine.match(/^([ \t]*)\^/);
      if (caretMatch) {
        column = caretMatch[1].length + 1;
        break;
      }
    }
    diagnostics.push({
      file: rawFile,
      line: lineNum,
      column,
      severity,
      message
    });
  }
  return diagnostics;
}

// server/peHarnesses.ts
var PE4_CSV_DATA = [
  "P02,Ban phim co,850.0",
  "P01,Chuot khong day,850.0",
  "BAD,Dong loi gia,not_a_number",
  "",
  "P03,Man hinh 4K,3200.0"
].join("\n");
var JSON_HELPERS = `
    private static String jbEsc(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length() + 8);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\\\') sb.append("\\\\\\\\");
            else if (c == '"') sb.append("\\\\\\"");
            else if (c == '\\n') sb.append("\\\\n");
            else if (c == '\\r') sb.append("\\\\r");
            else if (c == '\\t') sb.append("\\\\t");
            else if (c < 32) sb.append(' ');
            else sb.append(c);
        }
        return sb.toString();
    }

    private static String jbFormat(String id, String name, boolean passed, long ms, String expected, String actual, String error) {
        return "{\\"id\\":\\"" + jbEsc(id) + "\\","
            + "\\"name\\":\\"" + jbEsc(name) + "\\","
            + "\\"passed\\":" + passed + ","
            + "\\"durationMs\\":" + ms + ","
            + "\\"expected\\":\\"" + jbEsc(expected) + "\\","
            + "\\"actual\\":\\"" + jbEsc(actual) + "\\","
            + "\\"error\\":\\"" + jbEsc(error) + "\\"}";
    }
`;
function buildPe01Grader() {
  const entryClass = "__JavaBrewPe01Grader";
  const content = `import java.util.*;

public class ${entryClass} {
${JSON_HELPERS}
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        List<String> results = new ArrayList<>();

        // TC1: Loc GPA >= 8.0 va bo qua phan tu null
        long t1 = System.nanoTime();
        boolean p1 = false;
        String a1 = "", e1 = "";
        try {
            List<Student> input = Arrays.asList(
                new Student("Cuong", 7.5),
                null,
                new Student("Binh", 8.5),
                new Student("An", 9.0)
            );
            List<Student> out = Main.filterHonor(input);
            boolean hasNull = out == null || out.stream().anyMatch(Objects::isNull);
            p1 = !hasNull && out.size() == 2 && "An".equals(out.get(0).getName()) && "Binh".equals(out.get(1).getName());
            a1 = (out == null) ? "null" : out.toString();
            if (!p1) e1 = "Danh sach sau loc khong khop (ky vong [An - 9.00, Binh - 8.50])";
        } catch (Throwable t) {
            a1 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e1 = a1;
        }
        results.add(jbFormat("TC1", "Loc sinh vien GPA >= 8.0 & bo qua phan tu null", p1, (System.nanoTime() - t1) / 1_000_000L, "[An - 9.00, Binh - 8.50]", a1, e1));

        // TC2: Danh sach null va rong
        long t2 = System.nanoTime();
        boolean p2 = false;
        String a2 = "", e2 = "";
        try {
            List<Student> rNull = Main.filterHonor(null);
            List<Student> rEmpty = Main.filterHonor(Collections.emptyList());
            p2 = rNull != null && rNull.isEmpty() && rEmpty != null && rEmpty.isEmpty();
            a2 = "nullList->" + rNull + ", emptyList->" + rEmpty;
            if (!p2) e2 = "Can tra ve danh sach rong thay vi nem ngoai le";
        } catch (Throwable t) {
            a2 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e2 = a2;
        }
        results.add(jbFormat("TC2", "Xu ly an toan danh sach null / rong", p2, (System.nanoTime() - t2) / 1_000_000L, "[] (empty list)", a2, e2));

        // TC3: Sap xep GPA giam dan, cung GPA theo name tang dan
        long t3 = System.nanoTime();
        boolean p3 = false;
        String a3 = "", e3 = "";
        try {
            List<Student> input = Arrays.asList(
                new Student("Minh", 8.5),
                new Student("An", 8.5),
                new Student("Zoe", 9.2)
            );
            List<Student> out = Main.filterHonor(input);
            p3 = out != null && out.size() == 3
                && "Zoe".equals(out.get(0).getName())
                && "An".equals(out.get(1).getName())
                && "Minh".equals(out.get(2).getName());
            a3 = (out == null) ? "null" : out.toString();
            if (!p3) e3 = "Thu tu sap xep chua dung (GPA giam dan, cung GPA thi name tang dan)";
        } catch (Throwable t) {
            a3 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e3 = a3;
        }
        results.add(jbFormat("TC3", "Sap xep GPA giam dan, cung GPA theo ten", p3, (System.nanoTime() - t3) / 1_000_000L, "[Zoe - 9.20, An - 8.50, Minh - 8.50]", a3, e3));

        System.out.println("__JB_TESTS_START__");
        System.out.println("[" + String.join(",", results) + "]");
        System.out.println("__JB_TESTS_END__");
    }
}
`;
  return { fileName: `${entryClass}.java`, entryClass, content };
}
function buildPe02Grader() {
  const entryClass = "__JavaBrewPe02Grader";
  const content = `import java.util.*;

public class ${entryClass} {
${JSON_HELPERS}
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        List<String> results = new ArrayList<>();

        // TC1: Ke thua Book & Constructor super()
        long t1 = System.nanoTime();
        boolean p1 = false;
        String a1 = "", e1 = "";
        try {
            EBook eb = new EBook("Java Core", 100.0, 0.15);
            Book poly = eb;
            EBook invalidDiscount = new EBook("Test", 50.0, 1.5);
            boolean baseCheck = (poly instanceof EBook);
            double invPrice = invalidDiscount.getFinalPrice();
            p1 = baseCheck && invPrice >= 0.0;
            a1 = "instanceof Book=true, poly price=" + String.format("%.1f", poly.getFinalPrice());
        } catch (Throwable t) {
            a1 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e1 = a1;
        }
        results.add(jbFormat("TC1", "Ke thua Book & Constructor super(title, price)", p1, (System.nanoTime() - t1) / 1_000_000L, "EBook extends Book", a1, e1));

        // TC2: Ghi de @Override getFinalPrice()
        long t2 = System.nanoTime();
        boolean p2 = false;
        String a2 = "", e2 = "";
        try {
            Book b1 = new EBook("Java Core", 100.0, 0.15);
            Book b2 = new EBook("Clean Code", 200.0, 0.25);
            double v1 = b1.getFinalPrice();
            double v2 = b2.getFinalPrice();
            p2 = Math.abs(v1 - 85.0) < 1e-6 && Math.abs(v2 - 150.0) < 1e-6;
            a2 = String.format("b1=%.2f, b2=%.2f", v1, v2);
            if (!p2) e2 = "Chua ghi de dung getFinalPrice() = price * (1.0 - discountRate)";
        } catch (Throwable t) {
            a2 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e2 = a2;
        }
        results.add(jbFormat("TC2", "Ghi de da hinh @Override getFinalPrice()", p2, (System.nanoTime() - t2) / 1_000_000L, "b1=85.00, b2=150.00", a2, e2));

        // TC3: Dinh dang toString() -> EBook[title, finalPrice]
        long t3 = System.nanoTime();
        boolean p3 = false;
        String a3 = "", e3 = "";
        try {
            EBook eb = new EBook("Java Core", 100.0, 0.15);
            String str = eb.toString();
            p3 = "EBook[Java Core, 85.0]".equals(str);
            a3 = str;
            if (!p3) e3 = "toString() phai tra ve dung dinh dang EBook[title, %.1f]";
        } catch (Throwable t) {
            a3 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e3 = a3;
        }
        results.add(jbFormat("TC3", "Dinh dang toString() EBook[title, finalPrice]", p3, (System.nanoTime() - t3) / 1_000_000L, "EBook[Java Core, 85.0]", a3, e3));

        System.out.println("__JB_TESTS_START__");
        System.out.println("[" + String.join(",", results) + "]");
        System.out.println("__JB_TESTS_END__");
    }
}
`;
  return { fileName: `${entryClass}.java`, entryClass, content };
}
function buildPe03Grader() {
  const entryClass = "__JavaBrewPe03Grader";
  const content = `import java.lang.reflect.*;
import java.util.*;

public class ${entryClass} {
${JSON_HELPERS}
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        List<String> results = new ArrayList<>();

        // TC1: addItem(null) & MAX = 100 guard
        long t1 = System.nanoTime();
        boolean p1 = false;
        String a1 = "", e1 = "";
        try {
            ItemList list = new ItemList();
            boolean nullAdd = list.addItem(null);
            boolean filledOk = true;
            for (int i = 0; i < ItemList.MAX; i++) {
                if (!list.addItem(new Item(i + 1, "Creator" + i))) {
                    filledOk = false;
                    break;
                }
            }
            boolean overflowAdd = list.addItem(new Item(999, "Overflow"));
            p1 = !nullAdd && filledOk && !overflowAdd;
            a1 = "addNull=" + nullAdd + ", filled100=" + filledOk + ", add101st=" + overflowAdd;
            if (!p1) e1 = "addItem() phai tra ve false khi item == null hoac numOfItem >= MAX";
        } catch (Throwable t) {
            Throwable cause = (t instanceof InvocationTargetException && t.getCause() != null) ? t.getCause() : t;
            a1 = cause.getClass().getSimpleName() + ": " + cause.getMessage();
            e1 = a1;
        }
        results.add(jbFormat("TC1", "Chan null va tran mang MAX = 100 khi addItem()", p1, (System.nanoTime() - t1) / 1_000_000L, "addNull=false, filled100=true, add101st=false", a1, e1));

        // TC2: removeItem(int) an toan khi mang day
        long t2 = System.nanoTime();
        boolean p2 = false;
        String a2 = "", e2 = "";
        try {
            Method removeMethod = ItemList.class.getMethod("removeItem", int.class);
            ItemList list = new ItemList();
            for (int i = 0; i < ItemList.MAX; i++) {
                list.addItem(new Item(i + 1, "Creator" + i));
            }
            boolean rmFirst = (Boolean) removeMethod.invoke(list, 0);
            boolean rmBad = (Boolean) removeMethod.invoke(list, -1);
            boolean rmOob = (Boolean) removeMethod.invoke(list, 100);
            boolean addAfter = list.addItem(new Item(500, "NewSlot"));
            p2 = rmFirst && !rmBad && !rmOob && addAfter;
            a2 = "rmFirst=" + rmFirst + ", rmInvalid=" + rmBad + "/" + rmOob + ", addAfter=" + addAfter;
            if (!p2) e2 = "removeItem() chua xu ly dung bien index hoac dich mang toi numOfItem - 1";
        } catch (NoSuchMethodException nsme) {
            a2 = "Thieu phuong thuc public boolean removeItem(int index)";
            e2 = a2;
        } catch (Throwable t) {
            Throwable cause = (t instanceof InvocationTargetException && t.getCause() != null) ? t.getCause() : t;
            a2 = cause.getClass().getSimpleName() + ": " + cause.getMessage();
            e2 = a2;
        }
        results.add(jbFormat("TC2", "Xoa phan tu removeItem() khi mang day 100", p2, (System.nanoTime() - t2) / 1_000_000L, "rmFirst=true, rmInvalid=false, addAfter=true", a2, e2));

        // TC3: findItemIndex (equalsIgnoreCase + trim) & sortByValueAsc
        long t3 = System.nanoTime();
        boolean p3 = false;
        String a3 = "", e3 = "";
        try {
            Method findMethod = ItemList.class.getMethod("findItemIndex", String.class);
            Method sortMethod = ItemList.class.getMethod("sortByValueAsc");
            ItemList list = new ItemList();
            list.addItem(new Item(30, "C30"));
            list.addItem(new Item(10, "Alice"));
            list.addItem(new Item(20, "C20"));
            int idxTrim = (Integer) findMethod.invoke(list, "  alice ");
            int idxNull = (Integer) findMethod.invoke(list, new Object[] { null });
            sortMethod.invoke(list);
            int s0 = (Integer) findMethod.invoke(list, "Alice");
            int s1 = (Integer) findMethod.invoke(list, "C20");
            int s2 = (Integer) findMethod.invoke(list, "C30");
            p3 = (idxTrim == 1) && (idxNull == -1) && (s0 == 0 && s1 == 1 && s2 == 2);
            a3 = "find('  alice ')=" + idxTrim + ", sortedIndices=[" + s0 + "," + s1 + "," + s2 + "]";
            if (!p3) e3 = "findItemIndex() can equalsIgnoreCase(trim()) & sortByValueAsc() theo value tang dan";
        } catch (NoSuchMethodException nsme) {
            a3 = "Thieu findItemIndex(String) hoac sortByValueAsc()";
            e3 = a3;
        } catch (Throwable t) {
            Throwable cause = (t instanceof InvocationTargetException && t.getCause() != null) ? t.getCause() : t;
            a3 = cause.getClass().getSimpleName() + ": " + cause.getMessage();
            e3 = a3;
        }
        results.add(jbFormat("TC3", "findItemIndex (equalsIgnoreCase) & sortByValueAsc()", p3, (System.nanoTime() - t3) / 1_000_000L, "find=1, sorted=[0,1,2]", a3, e3));

        System.out.println("__JB_TESTS_START__");
        System.out.println("[" + String.join(",", results) + "]");
        System.out.println("__JB_TESTS_END__");
    }
}
`;
  return { fileName: `${entryClass}.java`, entryClass, content };
}
function buildPe04Grader() {
  const entryClass = "__JavaBrewPe04Grader";
  const content = `import java.lang.reflect.*;
import java.util.*;

public class ${entryClass} {
${JSON_HELPERS}
    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        List<String> results = new ArrayList<>();

        // TC1: countWords null/blank safe + \\s+ + lowercase
        long t1 = System.nanoTime();
        boolean p1 = false;
        String a1 = "", e1 = "";
        try {
            Map<String, Integer> mNull = Main.countWords(null);
            Map<String, Integer> mBlank = Main.countWords("   ");
            Map<String, Integer> mNorm = Main.countWords("  Java   OOP  java ");
            p1 = mNull != null && mNull.isEmpty()
                && mBlank != null && mBlank.isEmpty()
                && mNorm != null && !mNorm.containsKey("")
                && Integer.valueOf(2).equals(mNorm.get("java"))
                && Integer.valueOf(1).equals(mNorm.get("oop"))
                && mNorm.size() == 2;
            a1 = String.valueOf(mNorm);
            if (!p1) e1 = "Can kiem tra null/isBlank va dung trim().toLowerCase().split(\\"\\\\\\\\s+\\")";
        } catch (Throwable t) {
            a1 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e1 = a1;
        }
        results.add(jbFormat("TC1", "countWords() an toan null & chuan hoa \\\\s+", p1, (System.nanoTime() - t1) / 1_000_000L, "{java=2, oop=1}", a1, e1));

        // TC2: loadProducts() try-with-resources UTF-8 + bo qua dong loi NumberFormatException
        long t2 = System.nanoTime();
        boolean p2 = false;
        String a2 = "", e2 = "";
        List<Product> loaded = null;
        try {
            Method loadMethod = Main.class.getMethod("loadProducts", String.class);
            loaded = (List<Product>) loadMethod.invoke(null, "/vercel/sandbox/work/products.csv");
            List<Product> missing = (List<Product>) loadMethod.invoke(null, "/vercel/sandbox/work/__nonexistent.csv");
            p2 = loaded != null && loaded.size() == 3 && missing != null && missing.isEmpty();
            a2 = "validRows=" + (loaded == null ? "null" : loaded.size()) + ", missingFileRows=" + (missing == null ? "null" : missing.size());
            if (!p2) e2 = "loadProducts() phai doc 3 dong hop le va bo qua dong hong / tep khong ton tai";
        } catch (NoSuchMethodException nsme) {
            a2 = "Thieu phuong thuc public static List<Product> loadProducts(String filePath)";
            e2 = a2;
        } catch (Throwable t) {
            Throwable cause = (t instanceof InvocationTargetException && t.getCause() != null) ? t.getCause() : t;
            a2 = cause.getClass().getSimpleName() + ": " + cause.getMessage();
            e2 = a2;
        }
        results.add(jbFormat("TC2", "Doc CSV UTF-8 & bat NumberFormatException tung dong", p2, (System.nanoTime() - t2) / 1_000_000L, "validRows=3, missingFileRows=0", a2, e2));

        // TC3: Sap xep 2 tieu chi (price giam dan, id tang dan)
        long t3 = System.nanoTime();
        boolean p3 = false;
        String a3 = "", e3 = "";
        try {
            if (loaded == null || loaded.size() != 3) {
                a3 = "Khong co du 3 san pham hop le de kiem tra sap xep";
                e3 = a3;
            } else {
                String order = loaded.get(0).getId() + "," + loaded.get(1).getId() + "," + loaded.get(2).getId();
                p3 = "P03,P01,P02".equals(order);
                a3 = order;
                if (!p3) e3 = "Can sap xep price giam dan, cung price thi id tang dan";
            }
        } catch (Throwable t) {
            a3 = t.getClass().getSimpleName() + ": " + t.getMessage();
            e3 = a3;
        }
        results.add(jbFormat("TC3", "Sap xep Comparator 2 tieu chi (price desc, id asc)", p3, (System.nanoTime() - t3) / 1_000_000L, "P03,P01,P02", a3, e3));

        System.out.println("__JB_TESTS_START__");
        System.out.println("[" + String.join(",", results) + "]");
        System.out.println("__JB_TESTS_END__");
    }
}
`;
  return {
    fileName: `${entryClass}.java`,
    entryClass,
    content,
    extraFiles: [{ path: "/vercel/sandbox/work/products.csv", content: PE4_CSV_DATA }]
  };
}
function buildSmokeRunner(peId) {
  const entryClass = "__JavaBrewSmokeRunner";
  if (peId === 1) {
    return {
      fileName: `${entryClass}.java`,
      entryClass,
      content: `import java.util.*;

public class ${entryClass} {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        System.out.println("[Smoke Run PE 01] Kiem tra Student & Main.filterHonor...");
        List<Student> validList = Arrays.asList(
            new Student("Cuong", 7.5),
            new Student("Binh", 8.5),
            new Student("An", 9.0)
        );
        System.out.println("TC1 (Valid): " + Main.filterHonor(validList));
        List<Student> withNull = Main.filterHonor(Arrays.asList(new Student("An", 9.0), null));
        System.out.println("TC2a (Null item): " + withNull);
        List<Student> nullList = Main.filterHonor(null);
        System.out.println("TC2b (Null list): " + nullList);
    }
}
`
    };
  }
  if (peId === 2) {
    return {
      fileName: `${entryClass}.java`,
      entryClass,
      content: `import java.util.*;

public class ${entryClass} {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        System.out.println("[Smoke Run PE 02] Kiem tra Book & EBook...");
        EBook eb = new EBook("Java Core", 100.0, 0.15);
        System.out.println("getFinalPrice() = " + String.format("%.2f", eb.getFinalPrice()));
        System.out.println("toString() = " + eb.toString());
    }
}
`
    };
  }
  if (peId === 3) {
    return {
      fileName: `${entryClass}.java`,
      entryClass,
      content: `import java.util.*;

public class ${entryClass} {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        System.out.println("[Smoke Run PE 03] Kiem tra Item & ItemList...");
        ItemList list = new ItemList();
        System.out.println("addItem(null) => " + list.addItem(null));
        for (int i = 0; i < ItemList.MAX; i++) {
            list.addItem(new Item(100 - i, "C" + i));
        }
        System.out.println("addItem(101st) => " + list.addItem(new Item(1, "Overflow")));
    }
}
`
    };
  }
  if (peId === 4) {
    return {
      fileName: `${entryClass}.java`,
      entryClass,
      content: `import java.util.*;

public class ${entryClass} {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        System.out.println("[Smoke Run PE 04] Kiem tra countWords...");
        System.out.println("Sample => " + Main.countWords("  Java   OOP  java "));
        System.out.println("Null => " + Main.countWords(null));
    }
}
`
    };
  }
  return null;
}
function buildPeHarness(peId, mode) {
  if (mode === "run") {
    return buildSmokeRunner(peId);
  }
  switch (peId) {
    case 1:
      return buildPe01Grader();
    case 2:
      return buildPe02Grader();
    case 3:
      return buildPe03Grader();
    case 4:
      return buildPe04Grader();
    default:
      return null;
  }
}

// server/java-run.ts
var BASE_SANDBOX_NAME = "javabrew-openjdk21-base";
var SANDBOX_REGION = "sin1";
var MAX_OUTPUT_BYTES = 32768;
var RUN_TIMEOUT_MS = 15e3;
var RATE_WINDOW_MS = 6e4;
var RATE_LIMIT_MAX = 20;
var ipBuckets = /* @__PURE__ */ new Map();
var bootstrapPromise = null;
function hasExplicitTokenParams() {
  return Boolean(
    process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID && process.env.VERCEL_TEAM_ID
  );
}
function getExplicitCredentials() {
  if (hasExplicitTokenParams()) {
    return {
      token: process.env.VERCEL_TOKEN,
      projectId: process.env.VERCEL_PROJECT_ID,
      teamId: process.env.VERCEL_TEAM_ID
    };
  }
  return {};
}
function hasSandboxCredentials(request) {
  return Boolean(
    request.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN || hasExplicitTokenParams()
  );
}
function getClientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "anonymous";
}
function checkRateLimit(ip) {
  const now = Date.now();
  if (ipBuckets.size > 500) {
    for (const [key, bucket] of ipBuckets.entries()) {
      if (bucket.resetAt <= now) {
        ipBuckets.delete(key);
      }
    }
  }
  const existing = ipBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return false;
  }
  existing.count += 1;
  return true;
}
function truncateOutput(text) {
  if (!text) return "";
  if (utf8ByteLength(text) <= MAX_OUTPUT_BYTES) return text;
  const sliced = text.slice(0, MAX_OUTPUT_BYTES);
  return `${sliced}
... [\u0111\u1EA7u ra b\u1ECB c\u1EAFt b\u1EDBt do v\u01B0\u1EE3t qu\xE1 32 KB]`;
}
function sanitizeErrorSummary(raw) {
  return raw.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]").replace(/\s+/g, " ").trim().slice(0, 160);
}
async function emitMetric(name, value, tags) {
  try {
    const fnPkg = await import("@vercel/functions");
    fnPkg.metric(name, value, tags);
  } catch {
  }
}
function extractTestMarkerBlock(rawStdout) {
  const match = rawStdout.match(/__JB_TESTS_START__\s*([\s\S]*?)\s*__JB_TESTS_END__/);
  if (!match) {
    return { cleanedStdout: rawStdout };
  }
  const cleanedStdout = rawStdout.replace(/__JB_TESTS_START__[\s\S]*?__JB_TESTS_END__\r?\n?/g, "").trimEnd();
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) {
      return { cleanedStdout, testResults: parsed };
    }
  } catch {
  }
  return { cleanedStdout };
}
async function ensureOpenJdkBaseSandbox() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  bootstrapPromise = (async () => {
    const { Sandbox } = await import("@vercel/sandbox");
    const creds = getExplicitCredentials();
    const base = await Sandbox.getOrCreate({
      ...creds,
      name: BASE_SANDBOX_NAME,
      region: SANDBOX_REGION,
      resources: { vcpus: 2 },
      timeout: 18e4,
      keepLastSnapshots: { count: 1, expiration: 0 },
      onCreate: async (sbx) => {
        const upd = await sbx.runCommand({ cmd: "apt-get", args: ["update"], sudo: true });
        if (upd.exitCode !== 0) {
          throw new Error(`apt-get update failed: ${await upd.stderr()}`);
        }
        const inst = await sbx.runCommand({
          cmd: "bash",
          args: [
            "-c",
            "DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends openjdk-21-jdk-headless || DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends default-jdk-headless"
          ],
          sudo: true
        });
        if (inst.exitCode !== 0) {
          throw new Error(`OpenJDK install failed: ${await inst.stderr()}`);
        }
        const ver = await sbx.runCommand("javac", ["-version"]);
        if (ver.exitCode !== 0) {
          throw new Error(`javac verification failed: ${await ver.stderr()}`);
        }
        await sbx.stop();
      }
    });
    try {
      await base.stop();
    } catch {
    }
  })().finally(() => {
    bootstrapPromise = null;
  });
  return bootstrapPromise;
}
async function acquireForkedSandbox() {
  const { APIError, Sandbox } = await import("@vercel/sandbox");
  const creds = getExplicitCredentials();
  const forkOnce = () => Sandbox.fork({
    ...creds,
    sourceSandbox: BASE_SANDBOX_NAME,
    persistent: false,
    networkPolicy: "deny-all",
    timeout: 6e4,
    resources: { vcpus: 2 }
  });
  let sandbox;
  try {
    sandbox = await forkOnce();
  } catch (err) {
    if (err instanceof APIError && (err.response.status === 404 || err.response.status === 409)) {
      await ensureOpenJdkBaseSandbox();
      sandbox = await forkOnce();
    } else {
      throw err;
    }
  }
  const verCmd = await sandbox.runCommand("javac", ["-version"]);
  if (verCmd.exitCode !== 0) {
    await sandbox.stop().catch(() => {
    });
    await sandbox.delete().catch(() => {
    });
    try {
      const stale = await Sandbox.get({ ...creds, name: BASE_SANDBOX_NAME });
      await stale.delete({ deleteOrphanSnapshots: true });
    } catch {
    }
    await ensureOpenJdkBaseSandbox();
    sandbox = await forkOnce();
    const retryVer = await sandbox.runCommand("javac", ["-version"]);
    const verText2 = (await retryVer.stdout() || await retryVer.stderr()).trim();
    return { sandbox, jdkVersion: verText2 || "OpenJDK 21" };
  }
  const verText = (await verCmd.stdout() || await verCmd.stderr()).trim();
  return { sandbox, jdkVersion: verText || "OpenJDK 21" };
}
async function GET(request) {
  return Response.json(
    {
      available: hasSandboxCredentials(request),
      runtime: "OpenJDK 21 (Vercel Sandbox)",
      region: SANDBOX_REGION,
      nodeVersion: process.version
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    }
  );
}
async function POST(request) {
  const startedAt = performance.now();
  if (!hasSandboxCredentials(request)) {
    await emitMetric("java_sandbox.run", 1, { mode: "unknown", outcome: "no_credentials" });
    return Response.json(
      {
        unavailable: true,
        unavailableReason: "Ch\u01B0a ph\xE1t hi\u1EC7n VERCEL_OIDC_TOKEN tr\xEAn m\xF4i tr\u01B0\u1EDDng n\xE0y."
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    await emitMetric("java_sandbox.run", 1, { mode: "unknown", outcome: "rate_limited" });
    return Response.json(
      {
        error: "B\u1EA1n g\u1EEDi y\xEAu c\u1EA7u bi\xEAn d\u1ECBch qu\xE1 nhanh. Vui l\xF2ng \u0111\u1EE3i t\u1ED1i \u0111a 1 ph\xFAt ho\u1EB7c d\xF9ng Static Evaluator."
      },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }
  let rawBody;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Request body ph\u1EA3i l\xE0 JSON h\u1EE3p l\u1EC7." }, { status: 400 });
  }
  const validated = validateCompilePayload(rawBody);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }
  const payload = validated.data;
  const primaryFileName = payload.files[0].name;
  let sandbox = null;
  try {
    const acquired = await acquireForkedSandbox();
    sandbox = acquired.sandbox;
    const jdkVersion = acquired.jdkVersion;
    await sandbox.mkDir("/vercel/sandbox/work");
    await sandbox.mkDir("/vercel/sandbox/out");
    const workFiles = payload.files.map((f) => ({
      path: `/vercel/sandbox/work/${f.name}`,
      content: f.content
    }));
    const compileTargets = payload.files.map((f) => f.name);
    let entryClass = primaryFileName.replace(/\.java$/, "");
    let useUserStdin = false;
    if (payload.mode === "grade") {
      const harness = buildPeHarness(payload.peId, "grade");
      if (!harness) {
        return Response.json(
          { error: `Kh\xF4ng t\xECm th\u1EA5y b\u1ED9 ch\u1EA5m cho PE ${payload.peId}.` },
          { status: 400 }
        );
      }
      workFiles.push({
        path: `/vercel/sandbox/work/${harness.fileName}`,
        content: harness.content
      });
      if (harness.extraFiles) {
        for (const extra of harness.extraFiles) {
          workFiles.push(extra);
        }
      }
      compileTargets.push(harness.fileName);
      entryClass = harness.entryClass;
    } else {
      const fileWithMain = payload.files.find((f) => hasMainMethod(f.content));
      if (fileWithMain) {
        entryClass = fileWithMain.name.replace(/\.java$/, "");
        useUserStdin = payload.stdin.length > 0;
        if (useUserStdin) {
          workFiles.push({
            path: "/vercel/sandbox/work/__stdin.txt",
            content: payload.stdin
          });
        }
      } else if (payload.peId) {
        const smoke = buildPeHarness(payload.peId, "run");
        if (smoke) {
          workFiles.push({
            path: `/vercel/sandbox/work/${smoke.fileName}`,
            content: smoke.content
          });
          compileTargets.push(smoke.fileName);
          entryClass = smoke.entryClass;
        }
      } else {
        return Response.json(
          {
            ok: false,
            phase: "compile",
            jdkVersion,
            compileMs: 0,
            runMs: 0,
            exitCode: 1,
            stdout: "",
            stderr: "Kh\xF4ng t\xECm th\u1EA5y h\xE0m public static void main(String[] args) \u0111\u1EC3 ch\u1EA1y th\u1EED.",
            diagnostics: [
              {
                file: primaryFileName,
                line: 1,
                column: 1,
                severity: "error",
                message: "C\u1EA7n c\xF3 h\xE0m public static void main(String[] args) \u0111\u1EC3 ch\u1EA1y \u1EDF ch\u1EBF \u0111\u1ED9 t\u1EF1 do."
              }
            ]
          },
          { status: 200, headers: { "Cache-Control": "no-store" } }
        );
      }
    }
    await sandbox.writeFiles(workFiles);
    const tCompile = performance.now();
    const compileRes = await sandbox.runCommand({
      cmd: "javac",
      args: ["-encoding", "UTF-8", "-Xlint:all", "-d", "/vercel/sandbox/out", ...compileTargets],
      cwd: "/vercel/sandbox/work"
    });
    const compileMs = Math.round(performance.now() - tCompile);
    const compileStdout = await compileRes.stdout();
    const compileStderr = await compileRes.stderr();
    const diagnostics = parseJavacDiagnostics(compileStderr, primaryFileName);
    if (compileRes.exitCode !== 0) {
      const durationMs2 = Math.round(performance.now() - startedAt);
      await emitMetric("java_sandbox.run", 1, { mode: payload.mode, outcome: "compile_error" });
      await emitMetric("java_sandbox.duration_ms", durationMs2, { mode: payload.mode });
      return Response.json(
        {
          ok: false,
          phase: "compile",
          jdkVersion,
          compileMs,
          runMs: 0,
          exitCode: compileRes.exitCode,
          stdout: truncateOutput(compileStdout),
          stderr: truncateOutput(compileStderr),
          diagnostics
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }
    const controller = new AbortController();
    const hardTimer = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS);
    const tRun = performance.now();
    let runExitCode = 0;
    let runStdout = "";
    let runStderr = "";
    let timedOut = false;
    try {
      const jvmArgs = [
        "-Xms32m",
        "-Xmx256m",
        "-XX:ActiveProcessorCount=2",
        "-Dfile.encoding=UTF-8",
        "-cp",
        "/vercel/sandbox/out"
      ];
      const runRes = useUserStdin ? await sandbox.runCommand({
        cmd: "bash",
        args: [
          "-c",
          'exec timeout -k 1s 8s java "$@" < /vercel/sandbox/work/__stdin.txt',
          "--",
          ...jvmArgs,
          entryClass
        ],
        cwd: "/vercel/sandbox/work",
        signal: controller.signal,
        timeoutMs: RUN_TIMEOUT_MS
      }) : await sandbox.runCommand({
        cmd: "timeout",
        args: ["-k", "1s", "8s", "java", ...jvmArgs, entryClass],
        cwd: "/vercel/sandbox/work",
        signal: controller.signal,
        timeoutMs: RUN_TIMEOUT_MS
      });
      runExitCode = runRes.exitCode;
      runStdout = await runRes.stdout();
      runStderr = await runRes.stderr();
      if (runExitCode === 124 || runExitCode === 137) {
        timedOut = true;
      }
    } catch (err) {
      if (controller.signal.aborted) {
        timedOut = true;
        runExitCode = 124;
        runStderr = "Ch\u01B0\u01A1ng tr\xECnh v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n th\u1EDDi gian th\u1EF1c thi (8s). H\xE3y ki\u1EC3m tra v\xF2ng l\u1EB7p v\xF4 h\u1EA1n.";
      } else {
        throw err;
      }
    } finally {
      clearTimeout(hardTimer);
    }
    const runMs = Math.round(performance.now() - tRun);
    const { cleanedStdout, testResults } = extractTestMarkerBlock(runStdout);
    let outcome;
    let ok = runExitCode === 0 && !timedOut;
    if (timedOut) {
      outcome = "timeout";
      ok = false;
    } else if (payload.mode === "grade") {
      const hasAllPassed = Boolean(testResults && testResults.length > 0 && testResults.every((t) => t.passed)) && runExitCode === 0;
      ok = hasAllPassed;
      outcome = hasAllPassed ? "pass" : "fail";
    } else {
      outcome = ok ? "pass" : "runtime_error";
    }
    const durationMs = Math.round(performance.now() - startedAt);
    await emitMetric("java_sandbox.run", 1, { mode: payload.mode, outcome });
    await emitMetric("java_sandbox.duration_ms", durationMs, { mode: payload.mode });
    return Response.json(
      {
        ok,
        phase: "run",
        jdkVersion,
        compileMs,
        runMs,
        exitCode: runExitCode,
        timedOut,
        stdout: truncateOutput(cleanedStdout),
        stderr: truncateOutput(runStderr),
        diagnostics,
        testResults
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api/java-run]", error);
    const durationMs = Math.round(performance.now() - startedAt);
    await emitMetric("java_sandbox.run", 1, { mode: payload.mode, outcome: "error" });
    await emitMetric("java_sandbox.duration_ms", durationMs, { mode: payload.mode });
    let detail = "";
    try {
      const { APIError } = await import("@vercel/sandbox");
      if (error instanceof APIError) {
        detail = `Vercel Sandbox API ${error.response.status}: ${sanitizeErrorSummary(error.message)}`;
      }
    } catch {
    }
    if (!detail) {
      detail = sanitizeErrorSummary(error instanceof Error ? error.message : String(error));
    }
    return Response.json(
      {
        unavailable: true,
        unavailableReason: `${detail || "Kh\xF4ng th\u1EC3 kh\u1EDFi ch\u1EA1y OpenJDK Sandbox l\xFAc n\xE0y."} \u2014 H\u1EC7 th\u1ED1ng \u0111\xE3 chuy\u1EC3n v\u1EC1 Static Pattern Evaluator.`
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    if (sandbox) {
      await sandbox.stop().catch(() => {
      });
      await sandbox.delete().catch(() => {
      });
    }
  }
}
export {
  GET,
  POST
};
