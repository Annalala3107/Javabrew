---
title: "Kho Đề Thực hành PRO192 Practical Exam (PE)"
category: PRO192
slots: "PE Prep (Q1–Q4)"
lang: vi
description: "4 bộ đề thực chiến PRO192 Practical Exam chuẩn cấu trúc Q1–Q4 (Encapsulation, Inheritance, ArrayOfObjects / AntiqueShop, Collections & File I/O), kèm starter code, test cases và bẫy thường gặp."
---

# Kho Đề Thực hành PRO192 Practical Exam (`M5 & M7`)

Bộ 4 đề thực chiến dưới đây được thiết kế theo đúng chuẩn chấm điểm tự động (PEA / EOS) của **PRO192**, kết nối trực tiếp các bài toán kinh điển trên lớp (`Student`, `Book`, `AntiqueShop / ItemList`, `ProductManager` + File I/O) với các bẫy biên dịch & runtime hay mất điểm nhất.

---

## Đề PE 01 — Quản lý Sinh viên OOP & Lọc GPA (`Q1–Q2 · Cơ bản · 25 phút`)

### Yêu cầu đề bài
1. Xây dựng lớp `Student` gồm `name` (`String`) và `gpa` (`double`), cài đặt Constructor 2 tham số và Getter/Setter hợp lệ (`gpa` chỉ hợp lệ trong đoạn `[0.0, 10.0]`; nếu ngoài khoảng thì giữ nguyên giá trị hoặc gán `0.0`).
2. Viết phương thức `public static List<Student> filterHonor(List<Student> list)` lọc danh sách sinh viên có `gpa >= 8.0`, xử lý an toàn khi `list == null` hoặc chứa phần tử `null`, sau đó sắp xếp danh sách kết quả theo `gpa` **giảm dần** (nếu bằng `gpa` thì xếp theo `name` **tăng dần**).

### Bẫy thường gặp
- Không kiểm tra `list == null` hoặc phần tử `s == null` dẫn đến `NullPointerException`.
- Gọi `setGpa()` không kiểm tra điều kiện biên âm hoặc `> 10`.

### Lời giải chuẩn

```java
// Student.java
public class Student {
    private String name;
    private double gpa;

    public Student(String name, double gpa) {
        this.name = (name == null) ? "" : name.trim();
        setGpa(gpa);
    }

    public String getName() {
        return name;
    }

    public double getGpa() {
        return gpa;
    }

    public void setGpa(double gpa) {
        if (gpa >= 0.0 && gpa <= 10.0) {
            this.gpa = gpa;
        }
    }

    @Override
    public String toString() {
        return String.format("%s - %.2f", name, gpa);
    }
}
```

```java
// Main.java
import java.util.*;

public class Main {
    public static List<Student> filterHonor(List<Student> list) {
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        List<Student> result = new ArrayList<>();
        for (Student s : list) {
            if (s != null && s.getGpa() >= 8.0) {
                result.add(s);
            }
        }
        result.sort(Comparator.comparingDouble(Student::getGpa).reversed()
                .thenComparing(Student::getName));
        return result;
    }
}
```

---

## Đề PE 02 — Hệ thống Thư viện Sách (`Q2–Q3 · Kế thừa & Override · 35 phút`)

### Yêu cầu đề bài
1. Tạo lớp cha `Book` gồm `protected String title;` và `protected double price;`, kèm constructor 2 tham số, getter và phương thức `getFinalPrice()` trả về `price`.
2. Tạo lớp con `EBook extends Book` bổ sung thuộc tính `private double discountRate;` (tỷ lệ giảm giá trong `[0.0, 1.0]`).
3. Ghi đè (`@Override`) phương thức `getFinalPrice()` trả về `price * (1 - discountRate)` và ghi đè `toString()` trả về định dạng: `EBook[title, finalPrice]` (làm tròn 1 chữ số thập phân).

### Bẫy thường gặp
- Quên gọi `super(title, price)` ở dòng đầu tiên của constructor `EBook`.
- Viết sai chữ ký phương thức hoặc viết nhầm `@override` thay vì `@Override` khiến trình biên dịch không phát hiện lỗi chữ ký.

### Lời giải chuẩn

```java
// Book.java
public class Book {
    protected String title;
    protected double price;

    public Book(String title, double price) {
        this.title = title;
        this.price = Math.max(0.0, price);
    }

    public String getTitle() {
        return title;
    }

    public double getFinalPrice() {
        return price;
    }
}
```

```java
// EBook.java
public class EBook extends Book {
    private double discountRate;

    public EBook(String title, double price, double discountRate) {
        super(title, price);
        this.discountRate = (discountRate >= 0.0 && discountRate <= 1.0) ? discountRate : 0.0;
    }

    @Override
    public double getFinalPrice() {
        return price * (1.0 - discountRate);
    }

    @Override
    public String toString() {
        return String.format("EBook[%s, %.1f]", title, getFinalPrice());
    }
}
```

---

## Đề PE 03 — AntiqueShop & ItemList Đa hình (`ArrayOfObjects & Polymorphism · 50 phút`)

### Yêu cầu đề bài
Chuẩn hóa lại case study kinh điển trong `ArrayOfObjects.html` & `polymorphism.html` (đã khắc phục toàn bộ lỗi `ArrayIndexOutOfBoundsException`, lỗi `removeItem` khi mảng đầy `MAX`, lỗi `Scanner` trôi lệnh và lỗi `pulic`):
1. Lớp cha `Item` gồm `value` (`int`), `creator` (`String`), phương thức `input()` / `output()`.
2. Lớp con `Vase extends Item` thêm `height` (`int`), `material` (`String`).
3. Lớp `ItemList` quản lý mảng `Item[] list = new Item[MAX]` (`MAX = 100`) và biến đếm `numOfItem`:
   - `addItem(Item item)`: kiểm tra `item != null && numOfItem < MAX`.
   - `findItemIndex(String creator)`: trả về vị trí đầu tiên khớp `equalsIgnoreCase`, không thấy trả `-1`.
   - `removeItem(int index)`: dịch trái an toàn từ `i = index` đến `numOfItem - 2` (tránh truy xuất `list[MAX]`), gán `list[--numOfItem] = null`.
   - `sortItems()`: sắp xếp tăng dần theo `value` (so sánh đúng `list[j].getValue()`).

### Lời giải chuẩn

```java
// ItemList.java (phiên bản đã sửa sạch bug mảng đầy & chỉ số trong HTML gốc)
public class ItemList {
    private final Item[] list;
    private int numOfItem;
    public static final int MAX = 100;

    public ItemList() {
        this.list = new Item[MAX];
        this.numOfItem = 0;
    }

    public boolean addItem(Item item) {
        if (item == null || numOfItem >= MAX) {
            return false;
        }
        list[numOfItem++] = item;
        return true;
    }

    public int findItemIndex(String creator) {
        if (creator == null) return -1;
        for (int i = 0; i < numOfItem; i++) {
            if (list[i].getCreator().equalsIgnoreCase(creator.trim())) {
                return i;
            }
        }
        return -1;
    }

    public boolean removeItem(int index) {
        if (index < 0 || index >= numOfItem) {
            return false;
        }
        for (int i = index; i < numOfItem - 1; i++) {
            list[i] = list[i + 1];
        }
        list[--numOfItem] = null;
        return true;
    }

    public void sortByValueAsc() {
        for (int i = 0; i < numOfItem - 1; i++) {
            for (int j = i + 1; j < numOfItem; j++) {
                if (list[i].getValue() > list[j].getValue()) {
                    Item tmp = list[i];
                    list[i] = list[j];
                    list[j] = tmp;
                }
            }
        }
    }
}
```

---

## Đề PE 04 — Xử lý Chuỗi, HashMap & File I/O (`Full Q1–Q4 · 85 phút`)

### Yêu cầu đề bài
1. **Đếm tần suất từ (`HashMap`):** Viết phương thức `countWords(String text)` chuẩn hóa chuỗi (bỏ khoảng trắng thừa hai đầu, tách theo `\\s+`, quy về chữ thường) và đếm số lần xuất hiện của mỗi từ. Xử lý an toàn khi `text == null` hoặc chuỗi rỗng.
2. **Đọc CSV Sản phẩm an toàn (`try-with-resources` + Exception handling):** Viết phương thức `loadProducts(String filePath)` đọc tệp CSV theo định dạng `id,name,price`, bỏ qua dòng lỗi định dạng `NumberFormatException` hoặc thiếu cột, trả về danh sách `Product` được sắp xếp **giá giảm dần**, nếu bằng giá thì **mã sản phẩm tăng dần**.

### Lời giải chuẩn

```java
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class Main {
    public static Map<String, Integer> countWords(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyMap();
        }
        Map<String, Integer> freq = new HashMap<>();
        for (String token : text.trim().toLowerCase().split("\\s+")) {
            freq.put(token, freq.getOrDefault(token, 0) + 1);
        }
        return freq;
    }

    public static List<Product> loadProducts(String filePath) {
        List<Product> list = new ArrayList<>();
        File f = new File(filePath);
        if (!f.exists()) return list;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] parts = line.split(",");
                if (parts.length < 3) continue;
                try {
                    String id = parts[0].trim();
                    String name = parts[1].trim();
                    double price = Double.parseDouble(parts[2].trim());
                    list.add(new Product(id, name, price));
                } catch (NumberFormatException ignored) {
                    // Bỏ qua dòng hỏng dữ liệu số để không sập toàn bộ batch
                }
            }
        } catch (IOException e) {
            System.err.println("Read error: " + e.getMessage());
        }

        list.sort(Comparator.comparingDouble(Product::getPrice).reversed()
                .thenComparing(Product::getId));
        return list;
    }
}
```
