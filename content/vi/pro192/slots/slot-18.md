---
slot: 18
stage: 5
title: "Slot 18: Bản chất Tính Đa hình, Dynamic Binding & Overloading vs Overriding"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q2/Q3)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Polymorphism.pdf"
slidePptx: "/media/pro192/slides/Polymorphism.pptx"
peRefs:
  - "PE1-Q2"
  - "PE3-Q2"
  - "PE5-Q2"
---

# Slot 18: Bản chất Tính Đa hình, Dynamic Binding & Overloading vs Overriding

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 5: Đa hình, Abstract Class, Interface & Anonymous Class
- **Trọng tâm thi:** `Thi PE (Q2/Q3)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Polymorphism.pdf) · [Slide PPTX](/media/pro192/slides/Polymorphism.pptx)
- **Liên kết đề PE thật:** `PE1-Q2` · `PE3-Q2` · `PE5-Q2` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu bản chất Đa hình tại thời điểm biên dịch (Overloading) vs thời điểm chạy (Overriding).
- Trình bày cơ chế Dynamic Binding (Late Binding) thông qua Method Table khi `Parent ref = new Child()`.
- Phân biệt tường minh bảng 6 tiêu chí giữa Overloading và Overriding.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Polymorphism.pptx` (từ slide *Objectives*, *Introduction: Polymorphism* đến các slide *Overloading*, *Overriding* và *Dynamic Binding*).

### 1. Định nghĩa và Nguồn gốc ngữ nghĩa của Đa hình
* **Nguồn gốc thuật ngữ:** Thuật ngữ "Polymorphism" có gốc từ tiếng Hy Lạp, kết hợp giữa hai từ tố:
  * *Poly*: Nghĩa là "nhiều" (many).
  * *Morph*: Nghĩa là "hình thái" hoặc "dạng thức" (forms).
* **Định nghĩa trong OOP:** Tính đa hình là khả năng một đối tượng hoặc một lời gọi phương thức có thể biểu hiện dưới **nhiều hình thái thực thi khác nhau**.
* **Ý nghĩa kiến trúc:** Trong Java, tính đa hình cho phép lập trình viên gửi cùng một thông điệp (lời gọi hàm) tới các đối tượng thuộc các lớp con khác nhau trong cùng một cây phân cấp kế thừa. Mỗi đối tượng cụ thể sẽ tự động phản ứng và thực thi hành vi phù hợp với bản chất riêng của nó mà không cần người gọi phải viết mã rẽ nhánh phức tạp.

### 2. Hai cơ chế thực hiện tính đa hình trong Java
Java hiện thực hóa tính đa hình thông qua hai cơ chế tại hai thời điểm khác nhau:
1. **Nạp chồng phương thức (Method Overloading) — Đa hình lúc biên dịch (Compile-time Polymorphism / Static Binding):**
   * Xảy ra khi trong cùng một lớp có nhiều phương thức trùng tên nhưng khác nhau về danh sách tham số (số lượng, kiểu dữ liệu hoặc thứ tự kiểu tham số).
   * Trình biên dịch Java (`javac`) quyết định phương thức nào được gọi ngay tại thời điểm dịch mã nguồn dựa trên các đối số truyền vào.
2. **Ghi đè phương thức (Method Overriding) — Đa hình lúc chạy (Runtime Polymorphism / Dynamic Binding):**
   * Xảy ra khi lớp con định nghĩa lại một phương thức thể hiện (instance method) đã có ở lớp cha với chữ ký phương thức (signature) giống hệt nhau.
   * Quyết định gọi phương thức của lớp nào hoàn toàn được hoãn lại cho tới thời điểm chương trình đang chạy thực tế trên máy ảo JVM.

### 3. Cơ chế Liên kết động (Dynamic Binding / Late Binding)

![Cơ chế đa hình và Dynamic Binding trong Java](/media/pro192/images/polymorphism1.png)

![Minh họa ví dụ đa hình lúc chạy Runtime](/media/pro192/images/polymorphism2.png)

* **Vận hành tại thời điểm chạy:**
  Khi một biến tham chiếu kiểu lớp cha trỏ tới một đối tượng thuộc lớp con trên JVM Heap:
  ```java
  SuperClass obj = new SubClass();
  obj.doSomething();
  ```
  * *Tại Compile-time:* Trình biên dịch kiểm tra kiểu tĩnh của biến `obj` (là `SuperClass`) xem lớp cha có khai báo phương thức `doSomething()` hay không. Nếu có, mã nguồn vượt qua vòng kiểm tra cú pháp.
  * *Tại Runtime:* Máy ảo JVM kiểm tra ô nhớ thực tế của đối tượng trên Heap (là `SubClass`). JVM tra cứu Bảng phương thức (Method Table) của lớp `SubClass`. Nếu lớp con đã ghi đè `doSomething()`, JVM thực hiện liên kết động và kích hoạt phiên bản của `SubClass`.
* **Lợi ích mở rộng (Extensibility):** Hệ thống có thể bổ sung vô số lớp con mới kế thừa từ lớp cha mà các đoạn mã điều phối cấp cao không cần phải thay đổi hay biên dịch lại.

### 4. Bảng so sánh đối chiếu giữa Overloading và Overriding
Bảng tổng hợp các tiêu chí kỹ thuật phân biệt giữa Nạp chồng và Ghi đè:

| Tiêu chí so sánh | Nạp chồng phương thức (Overloading) | Ghi đè phương thức (Overriding) |
| :--- | :--- | :--- |
| **Phạm vi áp dụng** | Xảy ra trong cùng một lớp (hoặc giữa cha và con) | Bắt buộc phải có quan hệ kế thừa giữa Lớp cha và Lớp con |
| **Tên phương thức** | Bắt buộc phải **giống nhau** | Bắt buộc phải **giống nhau** |
| **Danh sách tham số** | Bắt buộc phải **khác nhau** (số lượng, kiểu hoặc thứ tự) | Bắt buộc phải **giống hệt nhau tuyệt đối** |
| **Kiểu trả về (Return Type)** | Tùy ý (có thể giống hoặc khác nhau) | Bắt buộc phải giống nhau hoặc là kiểu dẫn xuất con (Covariant) |
| **Quyền truy cập (Access Modifier)** | Tùy ý thay đổi | Không được phép thu hẹp quyền truy cập so với cha |
| **Thời điểm phân giải** | Thời điểm biên dịch (Compile-time / Static binding) | Thời điểm thực thi (Runtime / Dynamic binding) |

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 18:**
> - Bẫy FE kinh điển: **Thuộc tính (fields)** KHÔNG tham gia đa hình (truy xuất `ref.x` luôn lấy field của kiểu tĩnh `Parent`), chỉ **instance method** mới có Dynamic Binding!
> - Hai hàm trùng tên, cùng tham số nhưng chỉ khác kiểu trả về (`int foo()` vs `double foo()`) **không phải Overloading** → lỗi biên dịch.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 18.1: Nhận diện cơ chế đa hình qua lời gọi phương thức

**Đề bài:** 
Cho cấu trúc mã nguồn sau:
```java
class Shape {
    public void draw() {
        System.out.println("Drawing a shape");
    }
}

class Circle extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a circle");
    }
}

class Square extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a square");
    }
}

public class TestPolymorphism {
    public static void render(Shape s) {
        s.draw();
    }
    public static void main(String[] args) {
        render(new Circle());
        render(new Square());
    }
}
```
Phương thức `render(Shape s)` thể hiện đặc tính nào của lập trình hướng đối tượng? Khi chạy chương trình, màn hình in ra kết quả gì và cơ chế nào của JVM quyết định điều đó?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Đặc tính thể hiện:** Tính **Đa hình (Polymorphism)** thông qua cơ chế ghi đè phương thức.
* **Kết quả in ra màn hình:**
  ```text
  Drawing a circle
  Drawing a square
  ```
* **Giải thích cơ chế:** Tham số truyền vào của phương thức `render` có kiểu tĩnh là `Shape`. Tuy nhiên, khi chạy thực tế (Runtime), JVM kiểm tra kiểu đối tượng thực sự trên Heap. Khi đối số là `new Circle()`, JVM dùng liên kết động để gọi phương thức `draw()` của `Circle`. Khi đối số là `new Square()`, JVM gọi phương thức `draw()` của `Square`.

</details>

---

### Bài 18.2: Phân biệt Overloading và Overriding trong thiết kế lớp

**Đề bài:** 
Trong các cặp phương thức sau, cặp nào là Method Overloading, cặp nào là Method Overriding và cặp nào bị Lỗi biên dịch?
1. Trong cùng một lớp: `void compute(int a)` và `int compute(int a, int b)`.
2. Lớp con so với lớp cha: `public void display()` (ở cha) và `public void display()` (ở con).
3. Trong cùng một lớp: `void process(int x)` và `int process(int x)`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

1. Cặp 1: **Method Overloading** (cùng tên, danh sách tham số khác nhau: 1 tham số so với 2 tham số).
2. Cặp 2: **Method Overriding** (xảy ra trong mối quan hệ kế thừa, chữ ký phương thức giống hệt nhau).
3. Cặp 3: **BỊ LỖI BIÊN DỊCH** (`method process(int) is already defined`). Vì hai phương thức có cùng tên và cùng danh sách tham số (trùng chữ ký). Việc chỉ khác nhau về kiểu trả về (`void` vs `int`) không tạo nên nạp chồng hợp lệ trong Java.

</details>

---

### Bài 18.3: Quy tắc nới rộng quyền truy cập khi ghi đè

**Đề bài:** 
Lớp cha `Animal` có phương thức:
```java
protected void makeSound() {
    System.out.println("Animal sound");
}
```
Lớp con `Cat extends Animal` có thể ghi đè phương thức này với từ khóa `public` được không? Có thể ghi đè với từ khóa `private` được không? Giải thích lý do.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Ghi đè với **`public`**: **ĐƯỢC PHÉP**. Theo quy tắc ghi đè trong Java, lớp con có quyền giữ nguyên hoặc nới rộng quyền truy cập (`public` có phạm vi rộng hơn `protected`).
* Ghi đè với **`private`**: **BỊ LỖI BIÊN DỊCH** (`cannot reduce the visibility of the inherited method from Animal`). Lớp con không được phép thu hẹp quyền truy cập so với lớp cha vì sẽ phá vỡ tính đa hình khi một biến tham chiếu kiểu cha cố gắng gọi phương thức đó.

</details>

---

### Bài 18.4: Kiểm tra tính hợp lệ của Covariant Return Type

**Đề bài:** 
Cho lớp `SubClass` kế thừa từ `SuperClass`. Xét đoạn mã sau:
```java
class SuperClass {
    public SuperClass getInstance() {
        return new SuperClass();
    }
}

class SubClass extends SuperClass {
    @Override
    public SubClass getInstance() {
        return new SubClass();
    }
}
```
Phương thức `getInstance()` trong `SubClass` có ghi đè hợp lệ phương thức của `SuperClass` không khi kiểu trả về đã đổi từ `SuperClass` thành `SubClass`?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Phương thức ghi đè **HOÀN TOÀN HỢP LỆ**.
* **Giải thích:** Từ phiên bản Java 5.0 trở đi, Java hỗ trợ cơ chế **Covariant Return Type** (Kiểu trả về đồng biến). Khi ghi đè một phương thức, kiểu trả về của phương thức ở lớp con có thể là chính lớp con của kiểu trả về ở phương thức lớp cha (`SubClass` là con của `SuperClass`). Điều này giúp tránh việc phải ép kiểu thủ công sau khi gọi phương thức ở lớp con.

</details>

---

### Bài 18.5: Tính đa hình kết hợp với mảng đối tượng

**Đề bài:** 
Cho mảng đối tượng:
```java
Shape[] shapes = new Shape[2];
shapes[0] = new Circle();
shapes[1] = new Square();
```
Hãy viết một vòng lặp for-each duyệt qua mảng `shapes` và gọi phương thức `draw()` của từng phần tử. Giải thích tại sao cấu trúc này giúp thiết kế phần mềm đạt độ linh hoạt cao.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
for (Shape s : shapes) {
    s.draw();
}
```
* **Giải thích sức mạnh kiến trúc:**
  Đoạn mã trên thể hiện nguyên lý lập trình tổng quát: mã nguồn điều phối chỉ phụ thuộc vào kiểu trừu tượng `Shape`. Nếu sau này hệ thống mở rộng thêm 10 lớp hình học mới (`Triangle`, `Rectangle`, `Polygon`...), toàn bộ vòng lặp xử lý trên vẫn hoạt động chính xác 100% mà không cần sửa đổi hay bổ sung bất kỳ câu lệnh điều kiện `if-else` nào.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Polymorphism.pdf) · [PPTX](/media/pro192/slides/Polymorphism.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (3 ảnh)</summary>

![Sơ đồ Slot 18: polymorphism1](/media/pro192/images/polymorphism1.png)

![Sơ đồ Slot 18: polymorphism2](/media/pro192/images/polymorphism2.png)

![Sơ đồ Slot 18: polymophism1](/media/pro192/images/polymophism1.png)

</details>

---

**Điều hướng:** [← Slot 17](./slot-17.md) | [Mục lục PRO192](../README.md) | [Slot 19 →](./slot-19.md)
