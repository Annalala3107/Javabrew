---
slot: 12
stage: 3
title: "Slot 12: Vòng đời Đối tượng, Constructor, Tham chiếu & Từ khóa this"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q1/Q2)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Encapsulation.pdf"
slidePptx: "/media/pro192/slides/Encapsulation.pptx"
peRefs:
  - "PE1-Q1"
  - "PE2-Q1"
  - "PE3-Q1"
  - "PE4-Q1"
  - "PE5-Q1"
---

# Slot 12: Vòng đời Đối tượng, Constructor, Tham chiếu & Từ khóa this

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 3: 4 Trụ cột OOP, Thiết kế Class & Encapsulation
- **Trọng tâm thi:** `Thi PE (Q1/Q2)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Encapsulation.pdf) · [Slide PPTX](/media/pro192/slides/Encapsulation.pptx)
- **Liên kết đề PE thật:** `PE1-Q1` · `PE2-Q1` · `PE3-Q1` · `PE4-Q1` · `PE5-Q1` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Nắm 3 bước vòng đời tạo đối tượng (`Declaration` → `Instantiation` (`new`) → `Initialization`).
- Biết chính xác khi nào compiler tự sinh Default Constructor và khi nào **mất** Default Constructor.
- Dùng từ khóa `this` phân biệt biến instance với tham số và gọi chéo constructor `this(...)`.

## 2. Lý thuyết cốt lõi

### 3.1. Ba giai đoạn tạo đối tượng
Xét câu lệnh: `Student stu = new Student("SE01", "Hoang", 2001, "HN");`.
Câu lệnh này thực hiện 3 bước liên tiếp:
1. **Khai báo (Declaration):** `Student stu;` — Tạo một biến tham chiếu mang tên `stu` thuộc kiểu `Student` trên vùng nhớ **Stack**.
2. **Cấp phát ô nhớ (Instantiation):** Toán tử **`new`** yêu cầu JVM cấp phát một khối bộ nhớ trống trên **JVM Heap** để lưu trữ các thuộc tính của đối tượng.
3. **Khởi tạo dữ liệu (Initialization):** Lời gọi hàm khởi tạo `Student(...)` thực thi việc gán giá trị cụ thể vào các trường trên Heap. Cuối cùng, địa chỉ ô nhớ trên Heap được gán vào biến tham chiếu `stu` trên Stack.

### 3.2. Bản chất của Hàm khởi tạo (Constructor)
* Constructor là một phương thức đặc biệt tự động chạy khi đối tượng được tạo ra.
* **Hai quy tắc nhận diện:**
  1. Tên Constructor phải trùng khớp hoàn toàn với tên của Lớp.
  2. Constructor không có bất kỳ kiểu dữ liệu trả về nào (kể cả `void`).
* **Phân loại:** Constructor mặc định không tham số (No-argument constructor) và Constructor có tham số (Parametric constructor).

### 3.3. Quy tắc nạp Constructor mặc định của hệ thống
* **Trường hợp 1:** Nếu lớp **không khai báo bất kỳ constructor nào**, trình biên dịch Java sẽ tự động bổ sung một constructor mặc định không tham số (`public ClassName() {}`), khởi tạo số về `0`, boolean về `false`, và đối tượng về `null`.
* **Trường hợp 2:** Nếu lập trình viên **đã tự viết ít nhất một constructor** (dù là có tham số hay không), trình biên dịch **sẽ không tự động chèn constructor mặc định nữa**. Nếu lúc này bên ngoài gọi `new ClassName()` mà không có constructor tương ứng, chương trình sẽ báo lỗi biên dịch ngay lập tức.

### 3.4. Từ khóa `this` và Vùng nhớ tham chiếu
* Từ khóa `this` là một biến tham chiếu ẩn trỏ thẳng đến **chính đối tượng hiện hành** đang thực thi phương thức hoặc constructor đó trên Heap.
* **Giải quyết hiện tượng che khuất biến (Shadowing):** Khi tham số truyền vào trùng tên với trường thuộc tính của lớp, dùng `this.fieldName` để phân biệt:
  ```java
  public Point(int x, int y) {
      this.x = x; // this.x là thuộc tính của đối tượng, x là tham số đầu vào
      this.y = y;
  }
  ```

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 12:**
> - Bẫy **mất Default Constructor**: Một khi bạn đã tự viết constructor có tham số (ví dụ `Crocus(String, int)`), Java **KHÔNG sinh** constructor rỗng `Crocus()` nữa — mà đề Q1/Q2 lại luôn chấm cả `Crocus()`!
> - Lời gọi `this(...)` bắt buộc phải nằm ở **dòng đầu tiên** trong constructor.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 12.1: Phân tích các bước tạo đối tượng

**Đề bài:** Trong câu lệnh `Box b = new Box(10, 20, 30);`, hãy chỉ rõ thành phần nào tương ứng với Khai báo (Declaration), Cấp phát thực thể (Instantiation), và Khởi tạo dữ liệu (Initialization).

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Declaration:* `Box b` (tạo biến tham chiếu trên Stack).
* *Instantiation:* Toán tử `new` (cấp phát ô nhớ trên JVM Heap).
* *Initialization:* `Box(10, 20, 30)` (gọi constructor để nạp dữ liệu vào ô nhớ trên Heap).

</details>

---

### Bài 12.2: Lỗi biên dịch khi thiếu Default Constructor

**Đề bài:** Lớp `Item` được định nghĩa như sau:
```java
public class Item {
    int id;
    public Item(int id) { this.id = id; }
}
```
Lệnh `Item it = new Item();` có biên dịch được không? Giải thích vì sao dựa trên quy tắc của Java.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Lệnh trên **bị lỗi biên dịch**: `constructor Item in class Item cannot be applied to given types; required: int; found: no arguments`.
* *Giải thích:* Do lớp `Item` đã có một constructor có tham số, trình biên dịch không tự động sinh constructor mặc định không tham số nữa. Muốn gọi `new Item()`, lập trình viên bắt buộc phải tự tay viết thêm `public Item() {}`.

</details>

---

### Bài 12.3: Xử lý Variable Shadowing với từ khóa `this`

**Đề bài:** Cho đoạn mã sau:
```java
public class Employee {
    String name;
    public Employee(String name) {
        name = name;
    }
}
```
Nếu chạy lệnh `Employee e = new Employee("Lan"); System.out.println(e.name);`, kết quả in ra là gì? Hãy dùng `this` để sửa lại.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Kết quả in ra:* `null`.
* *Giải thích:* Lệnh `name = name;` chỉ tự gán tham số cục bộ cho chính nó. Thuộc tính `name` của đối tượng không được cập nhật nên vẫn giữ giá trị mặc định là `null`.
* *Sửa lại:*
  ```java
  public Employee(String name) {
      this.name = name;
  }
  ```

</details>

---

### Bài 12.4: Cơ chế sao chép tham chiếu đối tượng trên bộ nhớ

**Đề bài:** Đoạn mã sau in ra kết quả gì? Giải thích cơ chế biến tham chiếu trên Stack và đối tượng trên Heap:
```java
int[] a = {10, 20};
int[] b = a;
b[0] = 99;
System.out.println(a[0]);
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Kết quả in ra:* `99`.
* *Giải thích:* Mảng trong Java là một đối tượng trên Heap. Biến `a` lưu địa chỉ trỏ đến mảng đó. Lệnh gán `b = a` sao chép địa chỉ tham chiếu, khiến cả `a` và `b` cùng trỏ chung vào một mảng duy nhất trên Heap. Thao tác qua `b[0] = 99` làm thay đổi trực tiếp ô nhớ mảng, do đó `a[0]` cũng nhận giá trị `99`.

</details>

---

### Bài 12.5: Thứ tự nạp giá trị khi khởi tạo đối tượng

**Đề bài:** Cho lớp sau:
```java
public class DemoInit {
    int val = 5;
    public DemoInit() {
        System.out.print(val + " ");
        val = 20;
        System.out.print(val);
    }
    public static void main(String[] args) {
        DemoInit d = new DemoInit();
    }
}
```
Màn hình console sẽ in ra kết quả gì?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Kết quả in ra:* `5 20`.
* *Giải thích:* Thuộc tính `val` được gán giá trị khai báo ban đầu là `5` trước khi thân constructor chạy. Lệnh in đầu tiên in ra `5`. Sau đó `val` được cập nhật thành `20` và lệnh in thứ hai in ra `20`.

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 12A: W3Schools Constructors — Bẫy mất Default Constructor & Chaining `this(...)`
- **Mục tiêu:** Bổ sung lại constructor rỗng `Product()` dùng `this("DEFAULT", 0.0)` để `new Product()` biên dịch qua.
- **Expected Output:**
  - `DEFAULT - 0.00`
  - `LATTE01 - 45.50`

```java
class Product {
    private String code;
    private double price;

    // TODO: Them constructor rong Product() goi this("DEFAULT", 0.0)

    public Product(String code, double price) {
        this.code = code;
        this.price = price;
    }

    @Override
    public String toString() {
        return String.format("%s - %.2f", code, price);
    }
}

public class Main {
    public static void main(String[] args) {
        Product p1 = new Product();
        Product p2 = new Product("LATTE01", 45.5);
        System.out.println(p1);
        System.out.println(p2);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 12A)</summary>

```java
class Product {
    private String code;
    private double price;

    public Product() {
        this("DEFAULT", 0.0);
    }

    public Product(String code, double price) {
        this.code = code;
        this.price = price;
    }

    @Override
    public String toString() {
        return String.format("%s - %.2f", code, price);
    }
}

public class Main {
    public static void main(String[] args) {
        Product p1 = new Product();
        Product p2 = new Product("LATTE01", 45.5);
        System.out.println(p1);
        System.out.println(p2);
    }
}
```

* **Giải thích:** Lệnh `this(...)` phải nằm ở **dòng đầu tiên** của constructor. Trong Q1/Q2 PE, máy chấm test gần như luôn tạo đối tượng bằng cả `new MyClass()` lẫn `new MyClass(args)`.

</details>

---

#### 🟡 Thực hành 12B: Constructor Che khuất Biến (`this.field = param`) & `toString()`
- **Mục tiêu:** Sửa lỗi quên `this.` trong constructor khiến thuộc tính `brand` và `price` bị `null` / `0`.
- **Expected Output:**
  - `Coffee, 35`
- 🔗 [Mở bài lab Slot 12 trên Code Studio Tryit](/studio/playground?example=slot-12-lab)

```java
class Drink {
    private String name;
    private int price;

    public Drink(String name, int price) {
        // TODO: Sua loi gan tham so cho chinh no thay vi gan cho field instance
        name = name;
        price = price;
    }

    @Override
    public String toString() {
        return name + ", " + price;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Drink("Coffee", 35));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 12B)</summary>

```java
class Drink {
    private String name;
    private int price;

    public Drink(String name, int price) {
        this.name = name;
        this.price = price;
    }

    @Override
    public String toString() {
        return name + ", " + price;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Drink("Coffee", 35));
    }
}
```

* **Giải thích:** Khi tham số trùng tên với thuộc tính, viết `name = name;` chỉ tự gán tham số vào chính nó, thuộc tính của object vẫn là `null`. Luôn dùng `this.name = name;`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Tại sao Java chỉ có Truyền tham trị (Pass-by-Value)?](../../java/basis/why-there-only-value-passing-in-java.md) · [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Encapsulation.pdf) · [PPTX](/media/pro192/slides/Encapsulation.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (11 ảnh)</summary>

![Sơ đồ Slot 12: demoCarClass](/media/pro192/images/demoCarClass.png)

![Sơ đồ Slot 12: outputCarClass](/media/pro192/images/outputCarClass.png)

![Sơ đồ Slot 12: encapsulation1](/media/pro192/images/encapsulation1.png)

![Sơ đồ Slot 12: encapsulation2](/media/pro192/images/encapsulation2.png)

![Sơ đồ Slot 12: encapsulation3](/media/pro192/images/encapsulation3.png)

![Sơ đồ Slot 12: encapsulation4](/media/pro192/images/encapsulation4.png)

![Sơ đồ Slot 12: encapsulation5](/media/pro192/images/encapsulation5.png)

![Sơ đồ Slot 12: encapsulation6](/media/pro192/images/encapsulation6.png)

![Sơ đồ Slot 12: encapsulation7](/media/pro192/images/encapsulation7.png)

![Sơ đồ Slot 12: encapsulation8](/media/pro192/images/encapsulation8.png)

![Sơ đồ Slot 12: encapsulation9](/media/pro192/images/encapsulation9.png)

</details>

---

**Điều hướng:** [← Slot 11](./slot-11.md) | [Mục lục PRO192](../README.md) | [Slot 13 →](./slot-13.md)
