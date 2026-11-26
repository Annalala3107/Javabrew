---
slot: 27
stage: 7
title: "Slot 27: Thuật toán Collections / Arrays & Comparable vs Comparator"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q3)"
  - "Thi FE"
estimatedMinutes: 30
slidePdf: "/media/pro192/resources/Support%20Classes.pdf"
slidePptx: "/media/pro192/slides/Support%20Classes.pptx"
peRefs:
  - "PE1-Q3"
  - "PE4-Q3"
---

# Slot 27: Thuật toán Collections / Arrays & Comparable vs Comparator

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 7: Java Collections Framework, Collections/Arrays & So sánh
- **Trọng tâm thi:** `Thi PE (Q3)` `Thi FE` | **Thời lượng gợi ý:** ~30 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Support%20Classes.pdf) · [Slide PPTX](/media/pro192/slides/Support%20Classes.pptx)
- **Liên kết đề PE thật:** `PE1-Q3` · `PE4-Q3` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt và cài đặt thành thạo `Comparable<T>` (`compareTo`) vs `Comparator<T>` (`compare`).
- Làm chủ kỹ thuật **Partial Sort** (gom các phần tử thỏa điều kiện ra list phụ, sort riêng, rồi ghi trả lại đúng các vị trí cũ) — dạng tủ Q3 PE (`PE1-Q3 MyDaisy.f2`).
- Dùng đúng các thuật toán trong `Collections` (`sort`, `reverse`, `frequency`, `binarySearch`) và `Arrays.toString()`.

## 2. Lý thuyết cốt lõi

*Tài liệu bài giảng đối chiếu: `Support Classes.pptx` & `Collections.pptx`*

---

### I. CÁC LỚP HỖ TRỢ THUẬT TOÁN TĨNH: `Collections` VÀ `Arrays`
* **Bản chất:** `java.util.Collections` và `java.util.Arrays` là các lớp tiện ích (utility classes) chỉ chứa toàn bộ các **phương thức tĩnh (static methods)** thực thi các giải thuật kinh điển.
  * `Collections`: Thao tác trên các đối tượng `Collection` hoặc `List`.
  * `Arrays`: Thao tác trực tiếp trên các mảng thuần túy (`primitive/object arrays`).

### Các thuật toán tiêu biểu trong `java.util.Collections`:
1. **Sắp xếp & Xáo trộn:**
   * `Collections.sort(List<T> list)`: Sắp xếp danh sách theo thứ tự tự nhiên tăng dần.
   * `Collections.shuffle(List<?> list)`: Xáo trộn ngẫu nhiên vị trí các phần tử.
2. **Tìm kiếm nhị phân (Binary Search):**
   * `Collections.binarySearch(List list, key)`: **Bắt buộc danh sách phải được sắp xếp tăng dần từ trước**. Trả về chỉ mục `>= 0` nếu tìm thấy, hoặc số âm `< 0` nếu không tìm thấy.
3. **Thao tác cấu trúc:**
   * `Collections.reverse(list)`: Đảo ngược thứ tự danh sách.
   * `Collections.swap(list, i, j)`: Hoán vị vị trí giữa hai phần tử.
   * `Collections.fill(list, val)`: Thay thế toàn bộ phần tử trong danh sách bằng giá trị `val`.
4. **Hàm tổng hợp & Thống kê:**
   * `Collections.min(coll)` / `Collections.max(coll)`: Trả về phần tử nhỏ nhất / lớn nhất.
   * `Collections.frequency(coll, obj)`: Đếm số lần xuất hiện của phần tử `obj` trong tập hợp.
   * `Collections.disjoint(coll1, coll2)`: Trả về `true` nếu hai tập hợp không có phần tử chung nào.

---

### II. THỨ TỰ TỰ NHIÊN VỚI GIAO DIỆN `java.lang.Comparable<T>`
* **Định nghĩa:** Áp đặt **thứ tự tự nhiên (natural ordering)** lên chính bản thân lớp đối tượng. Lớp đối tượng tự cài đặt phương thức so sánh của chính nó.
* **Phương thức duy nhất:**
  `public int compareTo(T other);`
* **Quy ước giá trị trả về:**
  * Trả về **số dương (`> 0`)**: Đối tượng hiện tại (`this`) **lớn hơn** đối tượng `other`.
  * Trả về **số `0`**: Hai đối tượng **bằng nhau**.
  * Trả về **số âm (`< 0`)**: Đối tượng hiện tại (`this`) **nhỏ hơn** đối tượng `other`.

---

### III. THỨ TỰ TÙY BIẾN VỚI GIAO DIỆN `java.util.Comparator<T>`
* **Định nghĩa:** Là một đối tượng hàm so sánh độc lập bên ngoài, dùng để áp đặt các quy tắc sắp xếp linh hoạt mà **không cần sửa đổi mã nguồn của lớp đối tượng gốc**.
* **Phương thức chính:**
  `public int compare(T o1, T o2);`
  * Trả về `> 0`: `o1` đứng sau `o2`.
  * Trả về `0`: `o1` tương đương `o2`.
  * Trả về `< 0`: `o1` đứng trước `o2`.

### Bảng so sánh toàn diện giữa `Comparable` và `Comparator`:

![Ví dụ cài đặt Comparable và Comparator](/media/pro192/images/7.19a.gif)

| Tiêu chí | `Comparable<T>` | `Comparator<T>` |
| :--- | :--- | :--- |
| **Gói thư viện** | `java.lang` (mặc định có sẵn) | `java.util` (bắt buộc import) |
| **Phương thức** | `int compareTo(T o)` (1 tham số) | `int compare(T o1, T o2)` (2 tham số) |
| **Vị trí cài đặt** | Bên trong lớp đối tượng (`implements Comparable`) | Bên ngoài lớp đối tượng (lớp riêng hoặc Anonymous Class) |
| **Sửa đổi mã nguồn gốc**| **Bắt buộc phải sửa** lớp gốc | **Không cần can thiệp** lớp gốc |
| **Số lượng tiêu chí** | Duy nhất 1 tiêu chí mặc định | Vô số tiêu chí tùy biến theo từng bài toán |
| **Cú pháp gọi hàm** | `Collections.sort(list)` | `Collections.sort(list, customComparator)` |

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 27:**
> - Bẫy **Partial Sort Q3 PE (`PE1-Q3`)**: Đề yêu cầu *"Sort elements whose name contains lowercase in ascending order of age, while keeping positions of other objects unchanged"*. Nếu bạn gọi thẳng `Collections.sort(t)` trên toàn list `t` là **sai hoàn toàn**.
> - Bẫy **tràn số khi trừ int trong Comparator**: Tránh viết `return a.getPrice() - b.getPrice()` nếu giá trị có thể rất lớn hoặc kiểu `double` → Hãy dùng `Integer.compare(a, b)` hoặc `Double.compare(a, b)`!

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 27.1: Điều kiện tiên quyết của thuật toán `binarySearch`

**Đề bài:** Xét đoạn mã sau:
```java
List<Integer> list = new ArrayList<>();
list.add(20);
list.add(5);
list.add(40);
list.add(10);

int pos = Collections.binarySearch(list, 10);
System.out.println("Position: " + pos);
```
Kết quả in ra có bảo đảm tìm thấy đúng vị trí của phần tử `10` hay không? Điều kiện tiên quyết để thuật toán `Collections.binarySearch` hoặc `Arrays.binarySearch` hoạt động chính xác là gì?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Đánh giá kết quả:** **KHÔNG bảo đảm chính xác** (có thể trả về số âm hoặc sai vị trí).
* **Điều kiện tiên quyết:** Theo slide `Support Classes.pptx`, danh sách hoặc mảng **bắt buộc phải được sắp xếp theo thứ tự tăng dần từ trước (The list must be in ascending order)** trước khi thực thi tìm kiếm nhị phân.
* **Cách sửa chuẩn:**
  ```java
  Collections.sort(list); // Sắp xếp trước: [5, 10, 20, 40]
  int pos = Collections.binarySearch(list, 10); // Trả về chính xác pos = 1
  ```

</details>

---

### Bài 27.2: Đếm tần suất và kiểm tra tập hợp rời nhau với `Collections`

**Đề bài:** Cho danh sách `List<Integer> list = Arrays.asList(2, 8, 5, 8, 9, 8, 1);`.
1. Dùng phương thức nào của `Collections` để đếm xem số `8` xuất hiện bao nhiêu lần?
2. Cho danh sách thứ hai `List<Integer> sub = Arrays.asList(3, 4, 6);`. Dùng phương thức nào để kiểm tra xem `list` và `sub` có điểm chung nào hay không?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

1. **Đếm tần suất:** Dùng phương thức tĩnh `Collections.frequency`:
   ```java
   int fre = Collections.frequency(list, 8);
   System.out.println("Occurrences of 8: " + fre); // In ra: 3
   ```
2. **Kiểm tra rời nhau:** Dùng phương thức tĩnh `Collections.disjoint`:
   ```java
   boolean isDisjoint = Collections.disjoint(list, sub);
   System.out.println("Is disjoint: " + isDisjoint); // In ra: true (vì không có phần tử chung)
   ```

</details>

---

### Bài 27.3: Cài đặt `Comparable` sắp xếp đối tượng theo giá tiền tăng dần

**Đề bài:** Cho lớp `Product` có thuộc tính `private String name;` và `private int price;`. Hãy cho lớp `Product` cài đặt giao diện `Comparable<Product>` sao cho khi gọi `Collections.sort(productList)`, danh sách tự động sắp xếp theo thứ tự **giá tiền (`price`) tăng dần**.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public class Product implements Comparable<Product> {
    private String name;
    private int price;

    public Product(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public int getPrice() { return price; }
    public String getName() { return name; }

    @Override
    public int compareTo(Product other) {
        // Sắp xếp tăng dần theo price
        return Integer.compare(this.price, other.price);
    }

    @Override
    public String toString() {
        return "[" + name + ", " + price + "]";
    }
}
```

</details>

---

### Bài 27.4: Xây dựng `Comparator` sắp xếp chuỗi theo độ dài giảm dần

**Đề bài:** Viết một đối tượng `Comparator<String>` (sử dụng Anonymous Class) để sắp xếp danh sách các chuỗi văn bản theo thứ tự **độ dài chuỗi giảm dần (chuỗi dài hơn đứng trước)**; nếu hai chuỗi có cùng độ dài thì sắp xếp theo thứ tự từ điển A-Z tăng dần.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.util.Comparator;

Comparator<String> customLengthComparator = new Comparator<String>() {
    @Override
    public int compare(String s1, String s2) {
        // So sánh độ dài giảm dần: s2.length() - s1.length()
        int lenDiff = s2.length() - s1.length();
        if (lenDiff != 0) {
            return lenDiff;
        }
        // Cùng độ dài: so sánh thứ tự từ điển tăng dần
        return s1.compareTo(s2);
    }
};
```

</details>

---

### Bài 27.5: Chuyển đổi và in nhanh mảng với `Arrays.toString()`

**Đề bài:** Xét đoạn mã sau:
```java
int[] numbers = {10, 50, 30, 20};
System.out.println(numbers); // Dòng 2
```
Tại sao Dòng 2 không in ra các con số mà lại in ra chuỗi dạng `[I@15db9742`? Hãy dùng phương thức của lớp `java.util.Arrays` trong slide bài học để sửa lại dòng in ra màn hình đúng định dạng `[10, 50, 30, 20]`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Nguyên nhân Dòng 2 in ra mã băm:** Mảng trong Java là một đối tượng tham chiếu nhưng nó **không ghi đè phương thức `toString()` của lớp `Object`**. Do đó, khi truyền trực tiếp biến mảng vào `println`, Java sẽ gọi `Object.toString()` mặc định in ra kiểu dữ liệu (`[I` nghĩa là mảng int 1 chiều) kèm mã băm hexadecimal của địa chỉ ô nhớ.
* **Sửa lại đúng với `Arrays.toString`:**
  ```java
  import java.util.Arrays;
  // ...
  System.out.println(Arrays.toString(numbers));
  ```
* **Kết quả in ra:** `[10, 50, 30, 20]`.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 27A: Advanced Sorting — `Comparable<T>` theo Giá tăng dần
- **Mục tiêu:** Cho lớp `BookItem` cài đặt `Comparable<BookItem>` dùng `Integer.compare(this.price, other.price)`.
- **Expected Output:**
  - `[(Beta,20), (Gamma,35), (Alpha,50)]`

```java
import java.util.*;

class BookItem implements Comparable<BookItem> {
    String name;
    int price;
    BookItem(String name, int price) { this.name = name; this.price = price; }

    @Override
    public int compareTo(BookItem other) {
        // TODO: tra ve Integer.compare(this.price, other.price)
        return 0;
    }

    @Override
    public String toString() { return "(" + name + "," + price + ")"; }
}

public class Main {
    public static void main(String[] args) {
        List<BookItem> list = new ArrayList<BookItem>();
        list.add(new BookItem("Alpha", 50));
        list.add(new BookItem("Beta", 20));
        list.add(new BookItem("Gamma", 35));
        Collections.sort(list);
        System.out.println(list);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 27A)</summary>

```java
import java.util.*;

class BookItem implements Comparable<BookItem> {
    String name;
    int price;
    BookItem(String name, int price) { this.name = name; this.price = price; }

    @Override
    public int compareTo(BookItem other) {
        return Integer.compare(this.price, other.price);
    }

    @Override
    public String toString() { return "(" + name + "," + price + ")"; }
}

public class Main {
    public static void main(String[] args) {
        List<BookItem> list = new ArrayList<BookItem>();
        list.add(new BookItem("Alpha", 50));
        list.add(new BookItem("Beta", 20));
        list.add(new BookItem("Gamma", 35));
        Collections.sort(list);
        System.out.println(list);
    }
}
```

* **Giải thích:** Dùng `Integer.compare(a, b)` tránh lỗi tràn số nguyên (*integer overflow*) khi hiệu `a - b` vượt quá `Integer.MAX_VALUE`.

</details>

---

#### 🟡 Thực hành 27B: Cầu nối `PE1-Q3` (`MyDaisy.f2`) — Partial Sort Giữ nguyên Vị trí
- **Mục tiêu:** Tách chỉ số các phần tử có chữ thường trong `name`, sắp xếp riêng nhóm đó tăng theo `price` rồi gán trả về đúng các chỉ số cũ (`JAVA` và `OOP` đứng yên).
- **Expected Output:**
  - `[(Beta,20), (JAVA,99), (Alpha,50)]`
- 🔗 [Mở bài lab Slot 27 trên JavaBrew Live Lab](/studio/playground?example=slot-27-lab)

```java
import java.util.*;

class BookItem {
    String name;
    int price;
    BookItem(String name, int price) { this.name = name; this.price = price; }
    @Override
    public String toString() { return "(" + name + "," + price + ")"; }
}

public class Main {
    static boolean hasLower(String s) {
        for (int i = 0; i < s.length(); i++) {
            if (Character.isLowerCase(s.charAt(i))) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        List<BookItem> list = new ArrayList<BookItem>(Arrays.asList(
                new BookItem("Alpha", 50),
                new BookItem("JAVA", 99),
                new BookItem("Beta", 20)
        ));
        // TODO: Dung 2 list (indices + matched), sort matched theo price, roi ghi lai vao list!
        System.out.println(list);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 27B)</summary>

```java
import java.util.*;

class BookItem {
    String name;
    int price;
    BookItem(String name, int price) { this.name = name; this.price = price; }
    @Override
    public String toString() { return "(" + name + "," + price + ")"; }
}

public class Main {
    static boolean hasLower(String s) {
        for (int i = 0; i < s.length(); i++) {
            if (Character.isLowerCase(s.charAt(i))) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        List<BookItem> list = new ArrayList<BookItem>(Arrays.asList(
                new BookItem("Alpha", 50),
                new BookItem("JAVA", 99),
                new BookItem("Beta", 20)
        ));
        List<Integer> indices = new ArrayList<Integer>();
        List<BookItem> matched = new ArrayList<BookItem>();
        for (int i = 0; i < list.size(); i++) {
            if (hasLower(list.get(i).name)) {
                indices.add(i);
                matched.add(list.get(i));
            }
        }
        Collections.sort(matched, new Comparator<BookItem>() {
            @Override
            public int compare(BookItem a, BookItem b) {
                return Integer.compare(a.price, b.price);
            }
        });
        for (int k = 0; k < indices.size(); k++) {
            list.set(indices.get(k), matched.get(k));
        }
        System.out.println(list);
    }
}
```

* **Giải thích:** Kỹ thuật **3 bước Partial Sort** (gom `indices` + `matched` → sort `matched` → `set` lại vào `indices`) là bài tủ xuất hiện rất nhiều trong PE Q3.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Collections — Phần 2 (`Comparable`, `Comparator`, Algorithms)](../../java/collection/java-collection-questions-02.md) · [Lưu ý thực chiến & Bẫy khi dùng Java Collections](../../java/collection/java-collection-precautions-for-use.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Support%20Classes.pdf) · [PPTX](/media/pro192/slides/Support%20Classes.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (11 ảnh)</summary>

![Sơ đồ Slot 27: 7.18a](/media/pro192/images/7.18a.gif)

![Sơ đồ Slot 27: 7.18b](/media/pro192/images/7.18b.gif)

![Sơ đồ Slot 27: 7.18c](/media/pro192/images/7.18c.gif)

![Sơ đồ Slot 27: 7.18d](/media/pro192/images/7.18d.gif)

![Sơ đồ Slot 27: 7.18e](/media/pro192/images/7.18e.gif)

![Sơ đồ Slot 27: 7.18f](/media/pro192/images/7.18f.gif)

![Sơ đồ Slot 27: 7.18g](/media/pro192/images/7.18g.gif)

![Sơ đồ Slot 27: 7.19a](/media/pro192/images/7.19a.gif)

![Sơ đồ Slot 27: 7.19b](/media/pro192/images/7.19b.gif)

![Sơ đồ Slot 27: 7.19c](/media/pro192/images/7.19c.gif)

![Sơ đồ Slot 27: 7.19d](/media/pro192/images/7.19d.gif)

</details>

---

**Điều hướng:** [← Slot 26](./slot-26.md) | [Mục lục PRO192](../README.md) | [Slot 28 →](./slot-28.md)
