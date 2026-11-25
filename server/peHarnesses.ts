export interface PeHarnessSpec {
  fileName: string;
  entryClass: string;
  content: string;
  extraFiles?: Array<{ path: string; content: string }>;
}

const PE4_CSV_DATA = [
  'P02,Ban phim co,850.0',
  'P01,Chuot khong day,850.0',
  'BAD,Dong loi gia,not_a_number',
  '',
  'P03,Man hinh 4K,3200.0',
].join('\n');

const JSON_HELPERS = `
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

function buildPe01Grader(): PeHarnessSpec {
  const entryClass = '__JavaBrewPe01Grader';
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

function buildPe02Grader(): PeHarnessSpec {
  const entryClass = '__JavaBrewPe02Grader';
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

function buildPe03Grader(): PeHarnessSpec {
  const entryClass = '__JavaBrewPe03Grader';
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

function buildPe04Grader(): PeHarnessSpec {
  const entryClass = '__JavaBrewPe04Grader';
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
            loaded = (List<Product>) loadMethod.invoke(null, "/tmp/jb-work/products.csv");
            List<Product> missing = (List<Product>) loadMethod.invoke(null, "/tmp/jb-work/__nonexistent.csv");
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
    extraFiles: [{ path: '/tmp/jb-work/products.csv', content: PE4_CSV_DATA }],
  };
}

function buildSmokeRunner(peId: number): PeHarnessSpec | null {
  const entryClass = '__JavaBrewSmokeRunner';
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
`,
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
`,
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
`,
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
`,
    };
  }
  return null;
}

export function buildPeHarness(peId: number, mode: 'run' | 'grade'): PeHarnessSpec | null {
  if (mode === 'run') {
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
