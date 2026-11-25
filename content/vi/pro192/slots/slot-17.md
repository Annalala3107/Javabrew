---
slot: 17
stage: 4
title: "Slot 17: Kiểu tĩnh vs Kiểu động, instanceof, Casting & Mảng Đối tượng (ItemList)"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q2/Q3)"
  - "Thi FE"
estimatedMinutes: 30
slidePdf: "/media/pro192/resources/ArrayOfObjects.pdf"
slidePptx: "/media/pro192/slides/ArrayOfObjects.pptx"
peRefs:
  - "PE2-Q3"
  - "PE3-Q3"
---

# Slot 17: Kiểu tĩnh vs Kiểu động, instanceof, Casting & Mảng Đối tượng (ItemList)

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 4: Kế thừa (Inheritance), Array of Objects & Casting
- **Trọng tâm thi:** `Thi PE (Q2/Q3)` `Thi FE` | **Thời lượng gợi ý:** ~30 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/ArrayOfObjects.pdf) · [Slide PPTX](/media/pro192/slides/ArrayOfObjects.pptx)
- **Liên kết đề PE thật:** `PE2-Q3` · `PE3-Q3` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt Kiểu tĩnh (Static/Reference Type lúc compile) và Kiểu động (Dynamic/Object Type lúc runtime).
- Sử dụng toán tử `instanceof` kiểm tra an toàn trước khi Downcasting để tránh `ClassCastException`.
- Quản lý mảng đối tượng đa hình (`Item[]` / `ArrayOfObjects`) không lỗi tràn chỉ số `MAX`.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide **`Inheritance.pptx`** (từ slide *Using an "instanceof" operator*, *Dynamic and Static type*, *Casting* đến slide *Summary* [149–151]) kết hợp case study `ArrayOfObjects.pptx`.

---

### 1. Phân biệt Kiểu tĩnh (Static Type) và Kiểu động (Dynamic Type)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Dynamic and Static type")*

Xét khai báo kinh điển giữa lớp cha `Rectangle` và lớp con `Box`:
```java
Rectangle obj1 = new Box(); // Rectangle là lớp cha, Box là lớp con
Box obj2 = new Box();
```

* **Kiểu tĩnh (Static Type):** 
  * Là kiểu dữ liệu được khai báo ban đầu của biến tham chiếu (`declared type`).
  * Ở ví dụ trên, kiểu tĩnh của biến `obj1` là **`Rectangle`**.
  * Kiểu tĩnh được **trình biên dịch kiểm tra tại thời điểm biên dịch (Compile-time)**. Trình biên dịch chỉ cho phép `obj1` gọi các phương thức có mặt trong khai báo của lớp `Rectangle`.
* **Kiểu động (Dynamic Type):** 
  * Là kiểu của đối tượng thực tế được cấp phát trên Heap tại thời điểm chương trình đang chạy (**Runtime**).
  * Ở ví dụ trên, kiểu động của `obj1` là **`Box`** (đối tượng sinh ra bởi `new Box()`).
  * Nhờ nguyên lý kế thừa, một biến tham chiếu kiểu lớp cha hoàn toàn có thể lưu trữ địa chỉ của một đối tượng thuộc lớp con.

---

### 2. Toán tử kiểm tra kiểu động: `instanceof`
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Using an 'instanceof' operator", code ví dụ `if (obj1 instanceof Box) ...` & `ArrayOfObjects.pptx`)*

* **Định nghĩa:** `instanceof` là toán tử so sánh nhị phân trong Java dùng để kiểm tra xem đối tượng thực tế mà một biến tham chiếu đang trỏ tới **có phải là một thể hiện (instance) của một Lớp hoặc Giao diện cụ thể hay không**.
* **Cú pháp:** `referenceVariable instanceof TargetClass`.
* **Giá trị trả về:** Trả về **`true`** nếu đối tượng thuộc kiểu `TargetClass` (hoặc lớp con của nó); trả về **`false`** nếu không thuộc kiểu đó hoặc nếu biến tham chiếu đang có giá trị `null`.
* **Ví dụ trong bài giảng:**
  ```java
  Rectangle obj1 = new Box();
  if (obj1 instanceof Box) {
      System.out.println("obj1 is pointing to the Box object"); // In ra dòng này
  }
  ```
  *(Trích từ slide `Inheritance.pptx`)*.
* **Ứng dụng trong quản lý danh sách đa hình (`ArrayOfObjects.pptx`):**
  Trong case study quản lý cửa hàng đồ cổ `antiqueShop`, mảng `Item[] list` lưu chung các đối tượng `Vase`, `Statue`, `Painting`. Để lọc và hiển thị riêng các bức tượng hoặc bức tranh, hệ thống dùng `instanceof`:
  ```java
  if (list[i] instanceof Statue) System.out.println(list[i]);
  else if (list[i] instanceof Painting) System.out.println(list[i]);
  ```
  *(Trích từ slide `ArrayOfObjects.pptx`)*.

---

### 3. Kỹ thuật Ép kiểu đối tượng (Casting): Upcasting vs Downcasting

![Mảng đối tượng đa hình ItemList trong bộ nhớ](/media/pro192/images/array3.png)

*(Trỏ vào slide: `Inheritance.pptx` > Slide "Casting" & "Check the type before casting")*

* **Upcasting (Ép kiểu lên cha):**
  * Gán một đối tượng lớp con cho một biến tham chiếu kiểu lớp cha (ví dụ: `Rectangle r = new Box();`).
  * Cơ chế: Diễn ra **hoàn toàn tự động**, an toàn tuyệt đối và không cần dùng cú pháp ép kiểu tường minh.
* **Downcasting (Ép kiểu xuống con):**
  * Khi biến tham chiếu kiểu cha (`Rectangle obj`) đang thực sự trỏ tới đối tượng con (`Box`), bạn **không thể gọi trực tiếp các phương thức đặc thù riêng của lớp con** (như `obj.setHeight(...)`) vì trình biên dịch dựa vào kiểu tĩnh của cha để kiểm tra.
  * Để gọi phương thức riêng của con, bạn bắt buộc phải **ép kiểu tường minh (explicit casting)**:
    ```java
    Rectangle obj = new Box();
    ((Box) obj).setHeight(300); // Ép kiểu obj về Box để gọi setHeight
    ```
    *(Trích từ slide `Inheritance.pptx`)*.
* **Quy tắc vàng phòng ngừa `ClassCastException`:**
  Nếu bạn ép kiểu một đối tượng cha thực tế xuống một kiểu con không tương thích, JVM sẽ ném ra ngoại lệ nguy hiểm `java.lang.ClassCastException`. Do đó, nguyên tắc cốt tử từ slide bài giảng là:
  👉 **"Check the type of the reference variable before casting it explicitly"** *(Luôn dùng `instanceof` kiểm tra trước khi thực hiện Downcasting)*!

### BẢNG TỔNG KẾT ĐỐI CHIẾU KIẾN THỨC GIAI ĐOẠN 4

| Khái niệm cốt lõi | Vị trí định nghĩa / Cú pháp | Bản chất kỹ thuật & Quy tắc bắt buộc | Lỗi thường gặp nếu dùng sai |
| :--- | :--- | :--- | :--- |
| **Kế thừa lớp (`extends`)** | `class Sub extends Super` | Kế thừa đơn: 1 lớp con chỉ có 1 lớp cha trực tiếp; kế thừa ngầm định `Object`. | Đa kế thừa lớp `extends A, B` (lỗi biên dịch). |
| **Quan hệ "is-a" vs "has-a"** | `extends` vs Biến tham chiếu | "is-a": chuyên biệt hóa phân loại; "has-a": thu nạp thành phần sở hữu. | Lạm dụng kế thừa cho các thực thể chỉ có quan hệ sở hữu. |
| **Gọi Constructor cha (`super`)** | `super(args);` | Constructor không được kế thừa; `super(...)` bắt buộc là lệnh đầu tiên trong constructor con. | Đặt `super(...)` sau các câu lệnh khác (lỗi biên dịch). |
| **Tự động chèn `super()`** | Mặc định trong constructor con | Trình biên dịch tự động chèn `super();` nếu không gọi tường minh. | Lớp cha thiếu constructor không tham số (lỗi biên dịch). |
| **Ghi đè (Method Overriding)** | `@Override` trên instance method | Trùng khớp chữ ký; kiểu trả về tương đương/hẹp hơn; không được thu hẹp quyền truy cập. | Gõ sai tên/tham số làm mất tính ghi đè, hoặc thu hẹp quyền truy cập. |
| **Che giấu phương thức (`static`)** | `public static void m()` ở cả 2 lớp | Không bị ghi đè động; phương thức được gọi dựa trên kiểu biến tham chiếu tại compile-time. | Hiểu nhầm phương thức tĩnh hỗ trợ tính đa hình động lúc chạy. |
| **Kiểm tra kiểu (`instanceof`)** | `refVar instanceof TargetClass` | Kiểm tra đối tượng thực tế trên Heap lúc chạy có tương thích với kiểu đích hay không. | Downcasting mà không kiểm tra bằng `instanceof` dẫn đến crash chương trình. |
| **Ép kiểu đối tượng (Casting)** | `((SubClass) superRef)` | Upcasting tự động; Downcasting phải tường minh và chỉ hợp lệ khi đối tượng thực tế là kiểu con. | Ép kiểu đối tượng cha thực tế xuống con gây `ClassCastException`. |

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 17:**
> - Downcasting không kiểm tra `instanceof` sẽ **vẫn biên dịch qua**, nhưng nổ `ClassCastException` lúc chạy nếu đối tượng thực tế không khớp.
> - Với mảng cố định `Item[MAX]`, khi xóa phần tử lúc mảng đầy `numOfItem == MAX`, vòng lặp dịch trái chỉ được chạy đến `numOfItem - 2` (`i < numOfItem - 1`), sau đó mới `list[--numOfItem] = null`.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 17.1: Xác định Kiểu tĩnh và Kiểu động

**Đề bài:** 
Cho lớp `Person` là lớp cha của `Student`. Xét câu lệnh:
```java
Person p = new Student("SE123", "Nam");
```
Hãy chỉ rõ đâu là **Kiểu tĩnh (Static type)** và đâu là **Kiểu động (Dynamic type)** của biến `p`. Kiểu nào quyết định việc trình biên dịch cho phép gọi những phương thức nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kiểu tĩnh (Static type):** Là `Person` (kiểu được khai báo cho biến `p` lúc đầu).
* **Kiểu động (Dynamic type):** Là `Student` (kiểu của đối tượng thực tế được cấp phát trên Heap qua `new Student(...)`).
* **Kiểu quyết định quyền gọi phương thức:** Chính là **Kiểu tĩnh (`Person`)**. Trình biên dịch chỉ cho phép gọi các phương thức đã được khai báo trong lớp `Person`. Nếu `Student` có phương thức riêng là `getMajorField()`, lệnh `p.getMajorField()` sẽ bị báo lỗi biên dịch trừ khi được ép kiểu.

</details>

---

### Bài 17.2: Toán tử `instanceof` trong cây phân cấp kế thừa

**Đề bài:** 
Cho cây kế thừa: `Dog extends Animal`, và `Animal` kế thừa từ `Object`. Xét đoạn mã:
```java
Animal a = new Dog();
System.out.println(a instanceof Dog);
System.out.println(a instanceof Animal);
System.out.println(a instanceof Object);
```
Màn hình sẽ in ra các giá trị boolean nào? Giải thích vì sao.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:**
  ```text
  true
  true
  true
  ```
* **Giải thích:**
  1. `a instanceof Dog`: Trả về `true` vì đối tượng thực tế trên Heap được tạo từ lớp `Dog`.
  2. `a instanceof Animal`: Trả về `true` vì `Dog` là một lớp con của `Animal` ("Dog is-a Animal").
  3. `a instanceof Object`: Trả về `true` vì mọi lớp trong Java đều là con cháu kế thừa của `java.lang.Object`.

</details>

---

### Bài 17.3: Lỗi gọi phương thức lớp con từ biến tham chiếu lớp cha

**Đề bài:** 
Lớp `Rectangle` có phương thức `area()`, lớp con `Box extends Rectangle` có thêm phương thức riêng `volume()`. Đoạn mã sau có biên dịch thành công không?
```java
Rectangle r = new Box(2, 3, 4);
System.out.println(r.area());
System.out.println(r.volume());
```
Nếu có lỗi, hãy sửa lại bằng kỹ thuật ép kiểu tường minh (Explicit Casting) theo slide bài học.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Khảo sát:** Lệnh `r.area()` chạy tốt, nhưng dòng lệnh `r.volume();` **BỊ LỖI BIÊN DỊCH** (`cannot find symbol method volume() in class Rectangle`).
* **Nguyên nhân:** Kiểu tĩnh của `r` là `Rectangle`, mà trong lớp `Rectangle` hoàn toàn không có phương thức `volume()`.
* **Sửa lại đúng với Downcasting:**
  ```java
  Rectangle r = new Box(2, 3, 4);
  System.out.println(r.area());
  System.out.println(((Box) r).volume()); // Ép kiểu r sang Box
  ```
  *(Trỏ vào slide: `Inheritance.pptx` > Slide "Casting")*.

</details>

---

### Bài 17.4: Nhận diện ngoại lệ `ClassCastException`

**Đề bài:** 
Xét đoạn mã sau:
```java
Rectangle r = new Rectangle(5, 10);
Box b = (Box) r;
b.setHeight(20);
```
Đoạn mã trên có vượt qua vòng biên dịch không? Khi chạy thực tế (Runtime) sẽ xảy ra hiện tượng gì?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Biên dịch:** Vẫn **biên dịch thành công** vì trình biên dịch chỉ thấy `Rectangle` và `Box` nằm chung cây kế thừa nên cho phép ép kiểu.
* **Thời điểm chạy (Runtime):** Chương trình lập tức ném ra ngoại lệ: `java.lang.ClassCastException`.
* **Nguyên nhân:** Đối tượng thực tế trên Heap được tạo bằng `new Rectangle(5, 10)` (chỉ là một hình chữ nhật thuần túy, không có thuộc tính `height` của hộp). Việc cố gắng ép một đối tượng cha thực sự thành đối tượng con là bất hợp pháp trong bộ nhớ Java.

</details>

---

### Bài 17.5: Ứng dụng `instanceof` duyệt mảng đa hình (Case Study ItemList)

*(Trích từ slide `ArrayOfObjects.pptx`)*

* **Đề bài:** 
  Cho mảng `Item[] list` lưu trữ hỗn hợp các đối tượng gồm `Vase`, `Statue`, và `Painting` (cả 3 đều kế thừa từ `Item`). Hãy viết một đoạn mã duyệt qua mảng `list` có `numOfItem` phần tử và chỉ in ra những đối tượng thuộc kiểu `Vase`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
for (int i = 0; i < numOfItem; i++) {
    if (list[i] instanceof Vase) {
        System.out.println(list[i]);
    }
}
```
*(Trích từ slide `ArrayOfObjects.pptx` > Case study ItemList)*.
* **Giải thích:** Toán tử `list[i] instanceof Vase` kiểm tra kiểu thực tế của từng phần tử tại Runtime. Chỉ những ô nhớ thực sự lưu trữ đối tượng `Vase` mới trả về `true` và được in ra màn hình.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/ArrayOfObjects.pdf) · [PPTX](/media/pro192/slides/ArrayOfObjects.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (4 ảnh)</summary>

![Sơ đồ Slot 17: inheritance6](/media/pro192/images/inheritance6.png)

![Sơ đồ Slot 17: array3](/media/pro192/images/array3.png)

![Sơ đồ Slot 17: array4](/media/pro192/images/array4.png)

![Sơ đồ Slot 17: array5](/media/pro192/images/array5.png)

</details>

---

**Điều hướng:** [← Slot 16](./slot-16.md) | [Mục lục PRO192](../README.md) | [Slot 18 →](./slot-18.md)
