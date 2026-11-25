---
slot: 20
stage: 5
title: "Slot 20: Giao diện (Interface) & Kỹ thuật Đa kế thừa Hành vi"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q3/Q4)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Polymorphism.pdf"
slidePptx: "/media/pro192/slides/Polymorphism.pptx"
peRefs:
  - "PE1-Q3"
  - "PE1-Q4"
  - "PE3-Q4"
  - "PE4-Q3"
  - "PE4-Q4"
  - "PE5-Q3"
  - "PE5-Q4"
---

# Slot 20: Giao diện (Interface) & Kỹ thuật Đa kế thừa Hành vi

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 5: Đa hình, Abstract Class, Interface & Anonymous Class
- **Trọng tâm thi:** `Thi PE (Q3/Q4)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Polymorphism.pdf) · [Slide PPTX](/media/pro192/slides/Polymorphism.pptx)
- **Liên kết đề PE thật:** `PE1-Q3` · `PE1-Q4` · `PE3-Q4` · `PE4-Q3` · `PE4-Q4` · `PE5-Q3` · `PE5-Q4` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu bản chất `interface` là bản hợp đồng hành vi (`public static final` fields + `public abstract` methods).
- Áp dụng đúng `implements` để giải trọn vẹn **Q3 (`IDaisy`, `IShoes`, `ILadder`) và Q4 (`IString`, `ILink`)** của đề PE.
- Phân biệt đa kế thừa Interface (`extends A, B`) với điểm khác biệt giữa Abstract Class và Interface.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Polymorphism.pptx` (từ slide *Interfaces*, *Syntax to define an interface*, *Rules for implementing interfaces* đến slide *Multiple inheritance with interfaces*).

### 1. Bản chất của Giao diện (Interface)

![Cấu trúc và quan hệ Interface trong Java](/media/pro192/images/interface1.png)

![So sánh trừu tượng và đa hình qua Interface](/media/pro192/images/polymorphism3.png)

* **Định nghĩa:** `Interface` là một thực thể trừu tượng thuần túy trong Java, đóng vai trò như một **bản hợp đồng cam kết hành vi (contract of behavior)**. Giao diện chỉ đặc tả những việc mà một lớp phải làm (`what to do`) nhưng hoàn toàn không định nghĩa cách thức thực hiện công việc đó (`how to do`).
* **Cú pháp định nghĩa:**
  ```java
  public interface InterfaceName {
      // khai báo các hằng số
      // khai báo các phương thức trừu tượng
  }
  ```
* **Các quy ước ngầm định của Interface do trình biên dịch tự động áp dụng:**
  1. **Đối với trường dữ liệu (Fields):** Mọi biến được khai báo bên trong một Interface đều **tự động mang thuộc tính `public static final`** (là hằng số dùng chung của giao diện, không thể thay đổi giá trị).
  2. **Đối với phương thức (Methods):** Mọi phương thức khai báo thông thường đều **tự động mang thuộc tính `public abstract`** (là phương thức công khai và trừu tượng, không có phần thân hàm).

### 2. Cài đặt Giao diện bằng từ khóa `implements`
* **Cú pháp cài đặt:**
  ```java
  public class ClassName implements InterfaceName {
      // cài đặt tất cả các phương thức của Interface
  }
  ```
* **Quy tắc bắt buộc về quyền truy cập khi ghi đè:**
  * Do các phương thức trong Interface mặc định là `public`, nên khi lớp con ghi đè để viết phần thân hàm `{ ... }`, phương thức đó **bắt buộc phải được khai báo tường minh với từ khóa `public`**.
  * Nếu lập trình viên quên viết từ khóa `public` (để mặc định là `default`), trình biên dịch sẽ lập tức báo lỗi vì vi phạm quy tắc thu hẹp quyền truy cập trong kế thừa.

### 3. Kỹ thuật Đa kế thừa hành vi (Multiple Inheritance of Type)
* **Giải pháp cho bài toán Đa kế thừa trong Java:**
  * Java cấm đa kế thừa lớp trực tiếp (`extends ClassA, ClassB` là bất hợp pháp) để loại bỏ xung đột cấu trúc (Diamond Problem).
  * Tuy nhiên, Java cho phép một lớp có thể **cài đặt đồng thời nhiều Giao diện** thông qua danh sách phân tách bằng dấu phẩy:
    ```java
    public class ClassName extends SuperClass implements Interface1, Interface2, Interface3 {
        // ...
    }
    ```
* **Kế thừa giữa các Interface:**
  * Một Interface có thể kế thừa từ một hoặc nhiều Interface khác bằng từ khóa `extends`:
    ```java
    public interface InterfaceC extends InterfaceA, InterfaceB {
        // ...
    }
    ```

### 4. Bảng so sánh đối chiếu giữa Abstract Class và Interface
Bảng tổng kết các đặc tính kiến trúc phân biệt Lớp trừu tượng và Giao diện:

| Tiêu chí so sánh | Lớp trừu tượng (Abstract Class) | Giao diện (Interface) |
| :--- | :--- | :--- |
| **Bản chất mối quan hệ** | Quan hệ nguồn gốc phân cấp **"is-a"** | Bản hợp đồng cam kết năng lực **"can-do"** |
| **Cú pháp sử dụng** | Dùng từ khóa `extends` (chỉ đơn kế thừa lớp) | Dùng từ khóa `implements` (cài đặt được nhiều interface) |
| **Biến thuộc tính** | Chứa được mọi loại biến (`private`, `protected`, biến thể hiện) | Chỉ chứa **hằng số `public static final`** |
| **Hàm khởi tạo (Constructor)** | **Có Constructor** (phục vụ gọi `super(...)`) | **Tuyệt đối KHÔNG có Constructor** |
| **Khởi tạo đối tượng** | Không thể khởi tạo trực tiếp bằng `new` | Không thể khởi tạo trực tiếp bằng `new` |
| **Tốc độ thực thi** | Nhanh hơn một chút do liên kết lớp trực tiếp | Có chi phí tìm kiếm bảng giao diện lúc chạy |

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 20:**
> - Bẫy **0 điểm Q3/Q4 PE**: Đề thi đã cung cấp sẵn interface ở dạng `.class` bytecode (ví dụ `IDaisy.class`, `IString.class`) — bạn **KHÔNG ĐƯỢC tự tạo file `IDaisy.java` hay `IString.java`**, chỉ tạo lớp `MyDaisy implements IDaisy`.
> - Mọi phương thức cài đặt lại từ interface bắt buộc giữ nguyên quyền **`public`** (nếu bỏ quên chữ `public`, trình biên dịch báo lỗi thu hẹp về `default`).

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 20.1: Các đặc tính mặc định của thành phần trong Interface

**Đề bài:** 
Xét đoạn mã khai báo interface sau:
```java
public interface Movable {
    int SPEED = 50;
    void move();
}
```
Trình biên dịch Java tự động bổ sung những từ khóa ngầm định nào vào trước biến `SPEED` và phương thức `move()`?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Trước biến `SPEED`: Trình biên dịch tự động chèn thành **`public static final int SPEED = 50;`** (biến trở thành hằng số tĩnh).
* Trước phương thức `move()`: Trình biên dịch tự động chèn thành **`public abstract void move();`** (phương thức trở thành công khai và trừu tượng).

</details>

---

### Bài 20.2: Lỗi thiếu từ khóa `public` khi cài đặt Interface

**Đề bài:** 
Đoạn mã sau bị lỗi biên dịch ở dòng nào? Giải thích vì sao dựa trên quy tắc trong slide `Polymorphism.pptx`:
```java
interface Printable {
    void print();
}

class Document implements Printable {
    void print() { // Dòng 6
        System.out.println("Printing...");
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Dòng bị lỗi:** Dòng 6 (`void print()`).
* **Thông báo lỗi biên dịch:** `cannot reduce the visibility of the inherited method from Printable`.
* **Nguyên nhân:** Phương thức `print()` trong interface mang quyền truy cập ngầm định là `public`. Tại lớp `Document`, phương thức ghi đè không ghi từ khóa nào nên bị coi là mức truy cập mặc định `default`. Theo quy tắc kế thừa, lớp con không được phép thu hẹp quyền truy cập so với lớp cha.
* **Cách sửa:** Bổ sung từ khóa `public` tại Dòng 6: `public void print() { ... }`.

</details>

---

### Bài 20.3: Kết hợp `extends` lớp cha và `implements` nhiều Interface

**Đề bài:** 
Viết đoạn khai báo lớp `SmartPhone` sao cho:
1. Kế thừa từ lớp cha `Device`.
2. Cài đặt đồng thời hai interface: `Camera` và `Gps`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public class SmartPhone extends Device implements Camera, Gps {
    // Thân lớp: cài đặt các phương thức trừu tượng của Camera và Gps
}
```
* **Giải thích:** Cú pháp chuẩn của Java quy định từ khóa `extends` phải đứng trước từ khóa `implements`. Danh sách các interface cài đặt phân cách nhau bằng dấu phẩy.

</details>

---

### Bài 20.4: Tính chất bất biến của biến trong Interface

**Đề bài:** 
Đoạn mã sau có biên dịch thành công không?
```java
interface Config {
    int TIMEOUT = 30;
}

class AppConfig implements Config {
    public void reset() {
        TIMEOUT = 60;
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Đoạn mã trên **BỊ LỖI BIÊN DỊCH** tại dòng `TIMEOUT = 60;`.
* **Thông báo lỗi:** `cannot assign a value to final variable TIMEOUT`.
* **Giải thích:** Mọi thuộc tính khai báo trong interface đều tự động mang thuộc tính `final` (hằng số). Giá trị khởi tạo ban đầu là bất biến và không thể bị gán lại trong suốt quá trình chạy.

</details>

---

### Bài 20.5: Lập trình hướng giao diện (Programming to an Interface)

**Đề bài:** 
Cho interface `PaymentMethod` có phương thức trừu tượng `void pay(double amount);`. Hai lớp `CreditCard` và `PayPal` cùng cài đặt interface này. Hãy viết phương thức `public static void processOrder(PaymentMethod payment, double amount)` và giải thích tại sao cách thiết kế này giúp hệ thống đạt được tính phụ thuộc lỏng lẻo (Loose Coupling).

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public static void processOrder(PaymentMethod payment, double amount) {
    payment.pay(amount); // Lời gọi đa hình thông qua Interface
}
```
* **Ý nghĩa kiến trúc:** Phương thức `processOrder` chỉ làm việc với bản hợp đồng chung là `PaymentMethod`. Khi doanh nghiệp tích hợp thêm các phương thức thanh toán mới trong tương lai (như `ApplePay`, `Momo`, `Crypto`...), phương thức này hoàn toàn giữ nguyên 100% mà không phải sửa đổi bất kỳ dòng mã nào.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md) · [Tính năng mới Java 8 (Default Method Interface, Lambda, Stream)](../../java/new-features/java8-common-new-features.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Polymorphism.pdf) · [PPTX](/media/pro192/slides/Polymorphism.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (1 ảnh)</summary>

![Sơ đồ Slot 20: interface1](/media/pro192/images/interface1.png)

</details>

---

**Điều hướng:** [← Slot 19](./slot-19.md) | [Mục lục PRO192](../README.md) | [Slot 21 →](./slot-21.md)
