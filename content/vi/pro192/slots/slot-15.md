---
slot: 15
stage: 4
title: "Slot 15: Chuỗi Hàm khởi tạo (Constructor Chaining) & Từ khóa super"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q2)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Inheritance.pdf"
slidePptx: "/media/pro192/slides/Inheritance.pptx"
peRefs:
  - "PE1-Q2"
  - "PE2-Q2"
  - "PE3-Q2"
  - "PE4-Q2"
  - "PE5-Q2"
---

# Slot 15: Chuỗi Hàm khởi tạo (Constructor Chaining) & Từ khóa super

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 4: Kế thừa (Inheritance), Array of Objects & Casting
- **Trọng tâm thi:** `Thi PE (Q2)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Inheritance.pdf) · [Slide PPTX](/media/pro192/slides/Inheritance.pptx)
- **Liên kết đề PE thật:** `PE1-Q2` · `PE2-Q2` · `PE3-Q2` · `PE4-Q2` · `PE5-Q2` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu quy tắc Constructor không được kế thừa và chuỗi gọi `super(...)` từ lớp cha lên lớp con.
- Nhận diện cơ chế trình biên dịch tự động chèn `super()` ngầm khi lập trình viên không gọi tường minh.
- Phân biệt rạch ròi cách dùng `super` vs `this` (thuộc tính, phương thức, constructor).

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide **`Inheritance.pptx`** (từ slide *"super" Keyword*, *Constructors Are Not Inherited* đến slide *Rectangle.java*, *Box.java* và *Demo_1.java*).

---

### 1. Hàm khởi tạo KHÔNG được kế thừa (Constructors Are Not Inherited)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Inheritance", "super Keyword: Constructors Are Not Inherited")*

* **Nguyên lý quan trọng:** Không giống như các thành phần bình thường khác (thuộc tính `fields` hay các phương thức `methods`), **hàm khởi tạo (constructor) của lớp cha KHÔNG được kế thừa cho lớp con**.
* **Lý do kỹ thuật:** Constructor của lớp cha mang tên của chính lớp cha và chỉ được thiết kế để khởi tạo các thuộc tính thuộc phạm vi của lớp cha đó. Nó không hề biết lớp con sẽ mở rộng thêm những trường dữ liệu nào, do đó nó không thể tự khởi tạo hoàn chỉnh một đối tượng lớp con.

---

### 2. Từ khóa `super(...)` để tái sử dụng Constructor của lớp cha
*(Trỏ vào slide: `Inheritance.pptx` > Slide "super Keyword", cú pháp `super(arguments)`)*

* **Cú pháp:** `super(arguments);` được sử dụng để gọi trực tiếp constructor tương ứng của lớp cha.
* **Quy tắc bất di bất dịch:** Lời gọi `super(...)` **bắt buộc phải là câu lệnh đầu tiên (first statement)** nằm trong thân constructor của lớp con.
* *(Ví dụ trong slide `Box.java` kế thừa `Rectangle`):*
  ```java
  public class Box extends Rectangle {
      private int height = 0;

      public Box() {
          super(); // Gọi constructor không đối số của Rectangle
      }

      public Box(int l, int w, int h) {
          super(l, w); // Gọi constructor Rectangle(int l, int w) để khởi tạo chiều dài và rộng
          height = h > 0 ? h : 0; // Sau đó mới khởi tạo thuộc tính riêng của Box
      }
  }
  ```
  *(Trích từ slide `Box.java`)*.
* ⚠️ **Cảnh báo lỗi biên dịch:** Nếu bạn đảo vị trí:
  ```java
  public Box(int l, int w, int h) {
      height = h > 0 ? h : 0;
      super(l, w); // BÁO LỖI BIÊN DỊCH: call to super must be first statement in constructor
  }
  ```
  *(Slide ghi chú: "Try swapping these statements" để nhắc nhở học viên lỗi này)*.

---

### 3. Cơ chế tự động chèn `super()` của trình biên dịch
*(Trỏ vào slide: `Inheritance.pptx` > Slide "super Keyword - Note")*

* **Quy tắc tự động:** Nếu trong constructor của lớp con, lập trình viên **không chủ động viết lời gọi `super(...)`**, trình biên dịch Java sẽ **tự động chèn lời gọi `super();` (gọi constructor không tham số của lớp cha)** vào ngay đầu constructor của lớp con.
* **Nguy cơ lỗi thời gian biên dịch (Compile-time Error):**
  * Nếu lớp cha đã tự định nghĩa một constructor có tham số mà **quên không khai báo constructor mặc định không tham số**.
  * Khi đó lớp con cố gắng gọi ngầm định `super();`, trình biên dịch sẽ tìm không thấy constructor không đối số trong lớp cha và **lập tức ném ra lỗi biên dịch**!

---

### 4. Trật tự thực thi chuỗi Constructor (Order of Constructor Invocation)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Summary" & slide minh họa bộ nhớ)*

Khi khởi tạo một đối tượng lớp con (ví dụ `new Box(2, 2, 2)`):
* Quy trình khởi tạo luôn diễn ra **từ trên đỉnh cây phân cấp đi dần xuống dưới (from the superclass to the derived class)**:
  1. Constructor của `java.lang.Object` chạy đầu tiên.
  2. Constructor của `Rectangle` chạy tiếp theo để dọn ô nhớ và gán `length`, `width`.
  3. Cuối cùng, thân constructor của `Box` mới được chạy để gán trường `height`.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 15:**
> - Bẫy kinh điển cả FE lẫn Q2 PE: Nếu lớp cha chỉ có constructor có tham số (không có `SuperClass()` rỗng) mà constructor con quên viết `super(args)` ở dòng 1 → **lỗi biên dịch ngay lập tức** vì compiler tự chèn `super()`!
> - Cả `super(...)` và `this(...)` đều phải ở dòng đầu constructor, nên **không bao giờ được gọi cùng lúc trong 1 constructor**.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 15.1: Vị trí của lời gọi `super(...)` trong Constructor

**Đề bài:** 
Đoạn mã sau có biên dịch thành công không? Nếu có lỗi, hãy chỉ rõ dòng lệnh bị lỗi và giải thích nguyên nhân dựa trên quy tắc trong slide `Inheritance.pptx`:
```java
public class Parent {
    protected int x;
    public Parent(int x) { this.x = x; }
}

public class Child extends Parent {
    private int y;
    public Child(int x, int y) {
        this.y = y;
        super(x);
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Bị lỗi biên dịch** tại dòng `super(x);`.
* **Thông báo lỗi:** `call to super must be first statement in constructor`.
* **Nguyên nhân:** Lời gọi `super(...)` để tái sử dụng constructor lớp cha bắt buộc phải là câu lệnh đầu tiên trong thân constructor của lớp con. Ở đây, lệnh `this.y = y;` đứng trước `super(x);` nên bị trình biên dịch từ chối.

</details>

---

### Bài 15.2: Cơ chế tự động chèn `super()` và lỗi thiếu Constructor mặc định

**Đề bài:** 
Xét đoạn mã sau:
```java
class Animal {
    public Animal(String name) {
        System.out.println("Animal: " + name);
    }
}

class Dog extends Animal {
    public Dog() {
        System.out.println("Dog created");
    }
}
```
Tại sao khi biên dịch lớp `Dog`, Java lại thông báo lỗi `constructor Animal in class Animal cannot be applied to given types; required: java.lang.String; found: no arguments`?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Nguyên nhân:**
  1. Do trong constructor `Dog()` không viết `super(...)`, trình biên dịch sẽ tự động chèn lệnh `super();` vào dòng đầu tiên.
  2. Lớp cha `Animal` đã tự khai báo một constructor có tham số `Animal(String name)`, dẫn đến việc trình biên dịch **không tự động sinh ra constructor không đối số `Animal()`**.
  3. Vì vậy, lệnh `super();` ngầm định của `Dog` không thể tìm thấy constructor tương ứng trong `Animal`, gây lỗi biên dịch.
* **Cách khắc phục:** Khai báo thêm constructor `public Animal() {}` trong lớp cha hoặc gọi tường minh `super("chó con");` trong constructor của lớp con.

</details>

---

### Bài 15.3: Thứ tự thực thi khi khởi tạo đối tượng nhiều tầng kế thừa

**Đề bài:** 
Cho 3 lớp có quan hệ kế thừa như sau:
```java
class A {
    public A() { System.out.print("A "); }
}
class B extends A {
    public B() { System.out.print("B "); }
}
class C extends B {
    public C() { System.out.print("C "); }
}
```
Khi chạy lệnh `C obj = new C();`, màn hình sẽ in ra chuỗi ký tự nào? Giải thích trật tự thực thi.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `A B C `
* **Giải thích:**
  * Lớp `C` gọi ngầm định `super();` lên `B`.
  * Lớp `B` gọi ngầm định `super();` lên `A`.
  * Lớp `A` gọi ngầm định `super();` lên `Object`.
  * Do đó, chuỗi constructor được kích hoạt từ lớp cha cao nhất xuống lớp con: thân constructor `A` chạy trước in ra `"A "`, tiếp đến constructor `B` chạy in ra `"B "`, cuối cùng constructor `C` hoàn tất in ra `"C "`.

</details>

---

### Bài 15.4: Sử dụng `super(...)` truyền tham số trong Case Study Hình chữ nhật và Khối hộp

*(Trích từ slide `Rectangle.java` và `Box.java`)*

* **Đề bài:** 
  Lớp `Rectangle` có các thuộc tính `protected int length, width;` và constructor `public Rectangle(int l, int w)`. Hãy viết constructor `public Box(int l, int w, int h)` cho lớp `Box extends Rectangle` sao cho tận dụng tối đa constructor của lớp cha để gán `length` và `width`, đồng thời tự gán thuộc tính `height`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public class Box extends Rectangle {
    private int height;

    public Box(int l, int w, int h) {
        super(l, w); // Tái sử dụng constructor của Rectangle
        this.height = (h > 0) ? h : 0;
    }
}
```
* **Giải thích:** Dùng `super(l, w)` để chuyển giao việc kiểm tra và khởi tạo 2 thuộc tính `length` và `width` cho lớp cha `Rectangle`, lớp con chỉ việc tập trung xử lý thuộc tính bổ sung của riêng nó.

</details>

---

### Bài 15.5: Phân biệt cách dùng từ khóa `super` và `this`

**Đề bài:** 
Trong mối quan hệ kế thừa của Java, từ khóa `this` và từ khóa `super` đại diện cho điều gì khi:
1. Đi kèm dấu ngoặc đơn: `this(...)` so với `super(...)`.
2. Đi kèm toán tử dấu chấm: `this.member` so với `super.member`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

1. **Khi đi kèm dấu ngoặc đơn:**
   * `this(...)`: Dùng để gọi một constructor khác **trong cùng một lớp** (overloaded constructor).
   * `super(...)`: Dùng để gọi constructor của **lớp cha trực tiếp**.
   *(Cả hai lệnh này nếu dùng đều phải là câu lệnh đầu tiên trong thân constructor, do đó chúng không thể cùng xuất hiện trong một constructor)*.
2. **Khi đi kèm toán tử dấu chấm:**
   * `this.member`: Truy xuất thuộc tính hoặc phương thức của **đối tượng hiện hành**.
   * `super.member`: Truy xuất thuộc tính hoặc gọi phiên bản phương thức được định nghĩa tại **lớp cha** (thường dùng khi phương thức bị lớp con ghi đè).

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 15A: `super` Keyword — Sửa Thứ tự `super(...)` & Thiếu Default Constructor
- **Mục tiêu:** Đưa lời gọi `super(title, price)` lên dòng đầu tiên của constructor lớp con `SpecBook`.
- **Expected Output:**
  - `Clean Java, PE-Q2, 18.5`

```java
class Book {
    private String title;
    private double price;
    Book(String title, double price) {
        this.title = title;
        this.price = price;
    }
    public String getTitle() { return title; }
    public double getPrice() { return price; }
}

class SpecBook extends Book {
    private String tag;
    SpecBook(String title, double price, String tag) {
        // TODO: Sua vi tri super(title, price) de het loi bien dich
        this.tag = tag;
        super(title, price);
    }
    @Override
    public String toString() {
        return getTitle() + ", " + tag + ", " + getPrice();
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new SpecBook("Clean Java", 18.5, "PE-Q2"));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 15A)</summary>

```java
class Book {
    private String title;
    private double price;
    Book(String title, double price) {
        this.title = title;
        this.price = price;
    }
    public String getTitle() { return title; }
    public double getPrice() { return price; }
}

class SpecBook extends Book {
    private String tag;
    SpecBook(String title, double price, String tag) {
        super(title, price);
        this.tag = tag;
    }
    @Override
    public String toString() {
        return getTitle() + ", " + tag + ", " + getPrice();
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new SpecBook("Clean Java", 18.5, "PE-Q2"));
    }
}
```

* **Giải thích:** Java bắt buộc khởi tạo xong phần dữ liệu lớp cha (`super(...)`) trước khi thân constructor lớp con chạy bất kỳ câu lệnh nào.

</details>

---

#### 🟡 Thực hành 15B: Constructor Chaining 3 Tầng (`A -> B -> C`) — In Vết Thực thi
- **Mục tiêu:** Tạo 3 lớp kế thừa nhau in thông báo trong constructor để thấy trình tự chạy từ gốc `Object -> A -> B -> C`.
- **Expected Output:**
  - `A -> B -> C`
- 🔗 [Mở bài lab Slot 15 trên JavaBrew Live Lab](/studio/playground?example=slot-15-lab)

```java
class A {
    A() { System.out.print("A"); }
}
class B extends A {
    B() { System.out.print(" -> B"); }
}
class C extends B {
    // TODO: Viet constructor C() in " -> C"
}

public class Main {
    public static void main(String[] args) {
        new C();
        System.out.println();
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 15B)</summary>

```java
class A {
    A() { System.out.print("A"); }
}
class B extends A {
    B() { System.out.print(" -> B"); }
}
class C extends B {
    C() { System.out.print(" -> C"); }
}

public class Main {
    public static void main(String[] args) {
        new C();
        System.out.println();
    }
}
```

* **Giải thích:** Mặc dù gọi `new C()`, trình biên dịch tự chèn `super();` ngầm ở dòng 1 của mỗi constructor nên lớp ông bà `A` chạy thân trước rồi mới tới `B` và `C`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Inheritance.pdf) · [PPTX](/media/pro192/slides/Inheritance.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (2 ảnh)</summary>

![Sơ đồ Slot 15: inheritance3](/media/pro192/images/inheritance3.png)

![Sơ đồ Slot 15: inheritance4](/media/pro192/images/inheritance4.png)

</details>

---

**Điều hướng:** [← Slot 14](./slot-14.md) | [Mục lục PRO192](../README.md) | [Slot 16 →](./slot-16.md)
