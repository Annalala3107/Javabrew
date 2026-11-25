---
slot: 19
stage: 5
title: "Slot 19: Lớp Trừu tượng (Abstract Class) & Phương thức Trừu tượng"
category: PRO192
lang: vi
examFocus:
  - "Thi FE"
  - "OOP Nâng cao"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Polymorphism.pdf"
slidePptx: "/media/pro192/slides/Polymorphism.pptx"
peRefs: []
---

# Slot 19: Lớp Trừu tượng (Abstract Class) & Phương thức Trừu tượng

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 5: Đa hình, Abstract Class, Interface & Anonymous Class
- **Trọng tâm thi:** `Thi FE` `OOP Nâng cao` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Polymorphism.pdf) · [Slide PPTX](/media/pro192/slides/Polymorphism.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu vai trò của `abstract class` và `abstract method` trong mô hình thiết kế phân tầng.
- Nắm quy tắc cấm khởi tạo trực tiếp `new AbstractClass()` nhưng vẫn dùng constructor qua `super(...)`.
- Phân biệt nghĩa vụ cài đặt của `concrete subclass` so với `abstract subclass`.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Polymorphism.pptx` (từ slide *Abstract Classes*, *Syntax to define an abstract class*, *Implementing Abstract Methods* đến các slide demo `shapes` và `AbstractDemo2`).

### 1. Bản chất của Lớp trừu tượng (Abstract Class)
* **Khái niệm:** Lớp trừu tượng là kết quả của quá trình khái quát hóa ở cấp độ rất cao (result of high generalization). Trong miền bài toán, có những thực thể mang tính chất nền tảng trừu tượng chung (như "Hình học", "Động vật", "Tài khoản ngân hàng") mà bản thân chúng không thể tương ứng với một đối tượng cụ thể đơn lẻ nào.
* **Mục đích thiết kế:** Lớp trừu tượng định hình một khung sườn cấu trúc chung, xác định các hành vi bắt buộc mà các lớp con phải thực hiện nhưng chưa thể cung cấp chi tiết cài đặt tường minh ở tầng cha.
* **Cú pháp khai báo:**
  ```java
  public abstract class ClassName {
      // các thuộc tính dữ liệu
      // các hàm khởi tạo (constructors)
      // các phương thức cụ thể (concrete methods)
      // các phương thức trừu tượng (abstract methods)
  }
  ```

### 2. Phương thức trừu tượng (Abstract Method)
* **Định nghĩa:** Phương thức trừu tượng là phương thức chỉ có phần khai báo chữ ký (prototype) mà hoàn toàn không có thân hàm (no implementation body).
* **Cú pháp:** Sử dụng từ khóa `abstract` và kết thúc trực tiếp bằng dấu chấm phẩy `;` thay cho cặp ngoặc nhọn `{}`:
  ```java
  public abstract double area();
  public abstract double circumstance();
  ```
* **Mối quan hệ bắt buộc giữa Lớp và Phương thức trừu tượng:**
  * Nếu một lớp chứa **ít nhất một phương thức trừu tượng**, thì lớp đó **bắt buộc phải được khai báo với từ khóa `abstract`**.
  * Ngược lại, một lớp trừu tượng **không bắt buộc phải chứa phương thức trừu tượng**. Nó hoàn toàn có thể chỉ chứa các phương thức đã được cài đặt đầy đủ.

### 3. Quy tắc cấm khởi tạo trực tiếp qua toán tử `new`
* **Quy tắc cấm tuyệt đối:** Máy ảo Java ngăn chặn hoàn toàn việc tạo đối tượng trực tiếp từ một lớp trừu tượng:
  ```java
  Shape s = new Shape(); // BÁO LỖI BIÊN DỊCH: Shape is abstract; cannot be instantiated
  ```
* **Khả năng tham chiếu đa hình:** Mặc dù không thể `new` trực tiếp, biến tham chiếu có kiểu là lớp trừu tượng vẫn được phép trỏ tới các đối tượng của lớp con cụ thể:
  ```java
  Shape s = new Circle(5.0); // Hoàn toàn hợp lệ
  System.out.println(s.area()); // Kích hoạt đa hình lúc chạy
  ```

### 4. Trách nhiệm cài đặt của Lớp con kế thừa (Concrete Class)
Khi một lớp con kế thừa từ một lớp trừu tượng (`class SubClass extends AbstractSuperClass`), lớp con đứng trước hai lựa chọn:
1. **Lớp con cụ thể (Concrete class):** Bắt buộc phải **ghi đè và cài đặt phần thân mã (provide body) cho toàn bộ các phương thức trừu tượng** kế thừa từ lớp cha.
2. **Tiếp tục là Lớp trừu tượng:** Nếu lớp con không cài đặt hết các phương thức trừu tượng kế thừa, bản thân lớp con đó cũng **bắt buộc phải được khai báo với từ khóa `abstract`**, chuyển giao trách nhiệm cài đặt cho các lớp con thế hệ tiếp theo.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 19:**
> - Bẫy FE: Lớp không có bất kỳ `abstract method` nào vẫn có thể khai báo `abstract class`; ngược lại, chỉ cần có 1 `abstract method` thì **bắt buộc** cả lớp phải `abstract`.
> - Không được kết hợp `abstract` với `final`, `private` hoặc `static` trên cùng một phương thức.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 19.1: Cú pháp và bản chất của Abstract Method

**Đề bài:** 
Xét hai khai báo phương thức sau bên trong một lớp:
```java
public abstract void run() {}
public abstract void jump();
```
Khai báo nào hợp lệ và khai báo nào bị lỗi biên dịch trong Java? Giải thích lý do.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* `public abstract void run() {}`: **BỊ LỖI BIÊN DỊCH** (`abstract methods cannot have a body`). Phương thức trừu tượng không được phép chứa cặp ngoặc nhọn `{}` (kể cả ngoặc nhọn rỗng) mà phải kết thúc trực tiếp bằng dấu chấm phẩy.
* `public abstract void jump();`: **HỢP LỆ**. Đây là cú pháp chuẩn xác của phương thức trừu tượng trong Java.

</details>

---

### Bài 19.2: Hàm khởi tạo bên trong Abstract Class

**Đề bài:** 
Cho lớp trừu tượng `Employee`:
```java
public abstract class Employee {
    protected String name;
    public Employee(String name) { this.name = name; }
}
```
Câu lệnh `Employee emp = new Employee("Nam");` có biên dịch được không? Tại sao một lớp trừu tượng không thể tạo đối tượng trực tiếp nhưng vẫn được phép có Constructor?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Câu lệnh `new Employee("Nam")`: **BỊ LỖI BIÊN DỊCH** (`Employee is abstract; cannot be instantiated`).
* **Ý nghĩa của Constructor trong Abstract Class:** Hàm khởi tạo trong lớp trừu tượng phục vụ cho cơ chế chuỗi khởi tạo (Constructor Chaining). Khi một đối tượng của lớp con cụ thể (như `Manager`, `Developer`) được khởi tạo, nó sẽ gọi `super(name)` để tái sử dụng logic khởi tạo thuộc tính `name` nằm trong lớp cha trừu tượng.

</details>

---

### Bài 19.3: Lớp trừu tượng không chứa phương thức trừu tượng

**Đề bài:** 
Quan sát đoạn mã sau từ slide bài giảng:
```java
public abstract class AbstractDemo2 {
    void m1() { System.out.println("m1"); }
    void m2() { }
    public static void main(String[] args) {
        AbstractDemo2 obj = new AbstractDemo2();
    }
}
```
Lớp `AbstractDemo2` không có bất kỳ abstract method nào. Lệnh `new AbstractDemo2()` có biên dịch được không? Tại sao lập trình viên lại khai báo một lớp trừu tượng không có phương thức trừu tượng?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Lệnh `new AbstractDemo2()`: **BỊ LỖI BIÊN DỊCH**. Dù không có abstract method nào, một khi lớp đã được gắn từ khóa `abstract`, máy ảo Java cấm việc tạo đối tượng trực tiếp từ lớp đó.
* **Ý nghĩa thiết kế:** Kỹ thuật này thường được dùng để tạo ra các lớp khung (Base Class / Adapter Class) chỉ nhằm mục đích cho các lớp khác kế thừa và mở rộng, ngăn chặn người sử dụng khởi tạo một thực thể độc lập chưa hoàn chỉnh về mặt nghiệp vụ.

</details>

---

### Bài 19.4: Trách nhiệm ghi đè phương thức trừu tượng của lớp con

**Đề bài:** 
Lớp cha `Shape` khai báo:
```java
public abstract class Shape {
    public abstract double area();
    public abstract double circumstance();
}
```
Lớp con `Rect extends Shape` có hai thuộc tính chiều dài và chiều rộng. Nếu bên trong `Rect` bạn chỉ viết phương thức `public double area()` mà quên viết phương thức `circumstance()` thì trình biên dịch sẽ thông báo lỗi gì? Cách khắc phục là gì?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Thông báo lỗi biên dịch:** `Rect is not abstract and does not override abstract method circumstance() in Shape`.
* **Nguyên nhân:** Lớp con cụ thể bắt buộc phải cài đặt đầy đủ tất cả các phương thức trừu tượng kế thừa từ lớp cha.
* **Cách khắc phục:**
  1. Cài đặt thêm phương thức `public double circumstance()` trong lớp `Rect`.
  2. Hoặc nếu chưa muốn cài đặt, phải khai báo lớp `Rect` là trừu tượng: `public abstract class Rect extends Shape`.

</details>

---

### Bài 19.5: Đa hình với mảng đối tượng lớp trừu tượng

**Đề bài:** 
Cho lớp trừu tượng `Shape` có phương thức trừu tượng `area()`. Các lớp con `Circle` và `Rect` đã cài đặt hoàn chỉnh `area()`. Hãy viết phương thức `public static double totalArea(Shape[] list)` nhận vào một mảng các hình vẽ và tính tổng diện tích của toàn bộ các phần tử hợp lệ trong mảng.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public static double totalArea(Shape[] list) {
    double total = 0;
    for (Shape s : list) {
        if (s != null) {
            total += s.area(); // Lời gọi phương thức đa hình (Dynamic binding)
        }
    }
    return total;
}
```
* **Giải thích:** Phương thức `totalArea` tương tác trực tiếp với kiểu trừu tượng `Shape`. Tại thời điểm chạy, cơ chế liên kết động của JVM sẽ tự động tìm tới phương thức `area()` tương ứng của từng đối tượng thực tế (`Circle` hoặc `Rect`) để tính toán chính xác diện tích.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Polymorphism.pdf) · [PPTX](/media/pro192/slides/Polymorphism.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (1 ảnh)</summary>

![Sơ đồ Slot 19: polymorphism3](/media/pro192/images/polymorphism3.png)

</details>

---

**Điều hướng:** [← Slot 18](./slot-18.md) | [Mục lục PRO192](../README.md) | [Slot 20 →](./slot-20.md)
