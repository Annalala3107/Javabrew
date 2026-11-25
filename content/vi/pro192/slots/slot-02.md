---
slot: 2
stage: 1
title: "Slot 02: Cài đặt Môi trường, Công cụ NetBeans & Chương trình HelloWorld"
category: PRO192
lang: vi
examFocus:
  - "Nền tảng"
  - "Quy chế PE"
estimatedMinutes: 20
slidePdf: "/media/pro192/resources/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pdf"
slidePptx: "/media/pro192/slides/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pptx"
peRefs: []
---

# Slot 02: Cài đặt Môi trường, Công cụ NetBeans & Chương trình HelloWorld

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 1: Khởi động, Môi trường & Nền tảng Cú pháp Java
- **Trọng tâm thi:** `Nền tảng` `Quy chế PE` | **Thời lượng gợi ý:** ~20 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pdf) · [Slide PPTX](/media/pro192/slides/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu tác dụng của biến môi trường `Path` (`bin/`) và `CLASSPATH` (`.`) khi biên dịch và chạy Java.
- Thực hiện đúng quy trình tạo Project chuẩn chấm thi PEA (JDK 8, bỏ chọn tự sinh Main khi đề yêu cầu).
- Nắm tổ chức thư mục `src/`, `build/classes/` và `dist/` (file `.jar`) sau Clean and Build.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Download & Install JDK & NetBeans 8.pptx` và `Get Start.pptx` (từ slide *Set up Environment Variables* đến slide *The first Java program in the NetBeans*).

### 3.1. Chuẩn Bị Bộ Công Cụ Lập Trình Java
Theo slide `Download & Install JDK & NetBeans 8.pptx`, để xây dựng môi trường phát triển Java hoàn chỉnh, lập trình viên cần cài đặt hai phần mềm:
1. **Java SE Development Kit (JDK 8):** Cung cấp toàn bộ môi trường phát triển gồm trình biên dịch `javac.exe`, bộ thông dịch máy ảo `java.exe`, công cụ đóng gói `jar.exe` và các thư viện chuẩn của Java API.
2. **NetBeans IDE 8.2:** Môi trường phát triển tích hợp (Integrated Development Environment) cung cấp trình soạn thảo mã nguồn thông minh, hỗ trợ tự động gợi ý cú pháp, quản lý cây thư mục dự án và gỡ lỗi (debugging).

### 3.2. Cấu Hình Biến Môi Trường Hệ Thống (Environment Variables)
Slide *Set up Environment Variables* trong `Get Start.pptx` chỉ rõ các bước cấu hình biến môi trường trên hệ điều hành Windows:
* **Mở hộp thoại thiết lập:** `My Computer` (hoặc `This PC`) -> `Properties` -> `Advanced system settings` -> `Environment Variables`.
* **Cấu hình biến `Path`:**
  * Tại khung `System Variables`, chọn biến `Path` và nhấn `Edit`.
  * Thêm đường dẫn trỏ trực tiếp đến thư mục `bin` của JDK đã cài đặt (ví dụ: `;C:\Program Files\Java\jdk1.8.0\bin;`).
  * **Ý nghĩa kỹ thuật:** Giúp hệ điều hành Windows nhận diện và cho phép thực thi các lệnh như `javac` và `java` từ bất kỳ đường dẫn thư mục nào trên cửa sổ Command Prompt (`cmd`).
* **Cấu hình biến `CLASSPATH`:**
  * Thêm mới hoặc chỉnh sửa biến `CLASSPATH` với giá trị bắt đầu bằng dấu chấm và dấu chấm phẩy: `.;C:\Program Files\Java\jdk1.8.0\lib;`.
  * **Ý nghĩa kỹ thuật:** Dấu chấm `.` đại diện cho thư mục làm việc hiện hành (Current Working Directory). Cấu hình này chỉ thị cho JVM ưu tiên tìm kiếm các tệp lớp `.class` ngay tại thư mục mà câu lệnh đang được thực thi trước khi tìm kiếm trong các thư viện mở rộng khác.

### 3.3. Quy Trình Tạo Dự Án NetBeans & Viết Chương Trình `HelloWorld`
Theo slide *The first Java program in the NetBeans*, quy trình chuẩn mực gồm 4 bước:

* **Bước 1: Khởi tạo Project (New Project)**
  * Vào menu `File` -> chọn `New Project...` (hoặc nhấn phím tắt `Ctrl + Shift + N`).
  * Trong khung `Categories`, chọn `Java`; trong khung `Projects`, chọn `Java Application` -> nhấn `Next`.
  * Đặt tên dự án tại ô `Project Name`: `FirstPrj`.
  * **Lưu ý nghiệp vụ:** Bỏ chọn ô đánh dấu **"Create Main Class"**. Tài liệu giải thích rõ: nếu tích chọn ô này, NetBeans sẽ tự động tạo một lớp mặc định tên là `Main`; bỏ tích chọn sẽ giúp lập trình viên chủ động tự tạo và quản lý nhiều chương trình với các lớp độc lập trong cùng một dự án. Nhấn `Finish`.
* **Bước 2: Tạo lớp mã nguồn (Add a Java Class)**
  * Tại cây quản lý dự án bên trái, click chuột phải vào mục `<default package>` trong thư mục `Source Packages` -> chọn `New` -> chọn `Java Class...`.
  * Đặt tên lớp tại ô `Class Name`: `HelloWorld`.
  * Nhấn `Finish`. Tập tin `HelloWorld.java` sẽ được tạo trong thư mục nguồn của dự án.
* **Bước 3: Soạn thảo mã nguồn (Write Code)**
  * Viết mã nguồn cho lớp `HelloWorld`:
  ```java
  public class HelloWorld {
      public static void main(String[] args) {
          System.out.println("Hello World!");
      }
  }
  ```
* **Bước 4: Biên dịch và chạy chương trình trong NetBeans**
  Tài liệu giới thiệu 4 cách chạy tập tin trong NetBeans:
  1. Click chuột phải trực tiếp vào tập tin `HelloWorld.java` tại cây dự án bên trái -> chọn `Run File` (hoặc phím tắt **`Shift + F6`**).
  2. Click chuột phải vào vị trí bất kỳ bên trong cửa sổ soạn thảo của file `HelloWorld.java` -> chọn `Run File` (`Shift + F6`).
  3. Nhấn biểu tượng tam giác xanh lá cây (Run Project) trên thanh công cụ; khi hộp thoại xuất hiện, chọn `HelloWorld` làm Main Class rồi nhấn `OK`.
  4. Click chuột phải vào biểu tượng dự án `FirstPrj` ở cây bên trái -> chọn `Run`.

### 3.4. Cấu Trúc Thư Mục Sau Khi Biên Dịch
Khi chương trình được biên dịch, NetBeans phân tách rõ ràng hai cấu trúc thư mục vật lý:
* Mã nguồn bạn soạn thảo được lưu tại: `FirstPrj\src\HelloWorld.java`.
* Mã bytecode sau khi biên dịch được sinh ra tại: `FirstPrj\build\classes\HelloWorld.class`.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 02:**
> - Quy chế **0 điểm PEA** ở trường: Đề PE hiện chấm trên **JDK 1.8 (NetBeans 17)**, yêu cầu đổi `dist` thành `RUN` (chứa file `Q1.jar`), **không dùng package**, không comment tiếng Việt có dấu.
> - Quên dấu `.` (thư mục hiện hành) trong `CLASSPATH` khiến JVM không tìm thấy file `.class` tại thư mục đang đứng.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 2.1: Vai trò của biến môi trường Path

**Đề bài:** Khi cấu hình biến môi trường `Path` trong Windows để thực thi lệnh của Java từ Command Prompt, đường dẫn phải trỏ chính xác vào thư mục nào trong thư mục cài đặt JDK?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Đường dẫn phải trỏ chính xác vào thư mục **`bin`** của JDK (ví dụ: `C:\Program Files\Java\jdk1.8.0\bin;`). Thư mục này là nơi lưu trữ các tệp thực thi cốt lõi gồm `javac.exe` (trình biên dịch) và `java.exe` (trình thông dịch máy ảo).

</details>

---

### Bài 2.2: Phân tích ý nghĩa dấu chấm trong biến CLASSPATH

**Đề bài:** Trong chuỗi cấu hình biến `CLASSPATH = .;C:\Program Files\Java\jdk1.8.0\lib;`, ký tự dấu chấm `.` ở đầu chuỗi có ý nghĩa kỹ thuật gì đối với JVM?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Dấu chấm `.` đại diện cho **thư mục làm việc hiện hành (current directory)**. Nó chỉ định cho máy ảo JVM ưu tiên tìm kiếm các tệp lớp `.class` ngay tại thư mục đang mở dòng lệnh trước khi tìm kiếm trong các thư viện hệ thống khác.

</details>

---

### Bài 2.3: Lý do bỏ chọn Create Main Class trong NetBeans

**Đề bài:** Theo tài liệu hướng dẫn tạo project `FirstPrj` trong bài giảng, vì sao lập trình viên được hướng dẫn bỏ chọn ô "Create Main Class" khi khởi tạo dự án?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Bỏ chọn ô "Create Main Class" giúp ngăn NetBeans tự động sinh ra một lớp cố định tên là `Main`. Việc này giúp người học tự do tổ chức, đặt tên lớp theo ý muốn và có thể chứa nhiều lớp có phương thức `main` độc lập trong cùng một dự án để chạy từng bài thực hành riêng biệt.

</details>

---

### Bài 2.4: Phím tắt thực thi tập tin trong NetBeans

**Đề bài:** Nêu tổ hợp phím tắt chuẩn trên bàn phím để chạy trực tiếp một tập tin mã nguồn Java (Run File) đang mở trong giao diện NetBeans IDE.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Tổ hợp phím tắt là **`Shift + F6`**.

</details>

---

### Bài 2.5: Tổ chức thư mục mã nguồn và bytecode

**Đề bài:** Trong một dự án Java được tạo bởi NetBeans, mã nguồn do người dùng viết và mã bytecode do hệ thống biên dịch được lưu trữ ở hai thư mục con tương ứng nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Mã nguồn (`.java`) được lưu trữ tại thư mục **`src`** (ví dụ: `FirstPrj\src\HelloWorld.java`).
* Mã bytecode (`.class`) được lưu trữ tại thư mục **`build\classes`** (ví dụ: `FirstPrj\build\classes\HelloWorld.class`).

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 2A: W3Schools Java Syntax — Sửa 3 Lỗi Biên dịch Khởi đầu
- **Mục tiêu:** Sửa tên lớp trùng file `Main`, dấu chấm phẩy thiếu và chữ ký `main` chuẩn.
- **Expected Output:**
  - `Environment Ready: JDK 1.8 / NetBeans!`

```java
public class WrongName {
    public void main(String[] args) {
        System.out.println("Environment Ready: JDK 1.8 / NetBeans!")
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 2A)</summary>

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Environment Ready: JDK 1.8 / NetBeans!");
    }
}
```

* **Giải thích:** Trong bài thi PE/PEA, `main` bắt buộc có đủ `public static void main(String[] args)` (không thiếu `static`), kết thúc lệnh bằng `;` và tên `public class` phải trùng tên tệp.

</details>

---

#### 🟡 Thực hành 2B: Output Numbers & Bẫy Nối chuỗi Trái sang Phải
- **Mục tiêu:** Quan sát sự khác nhau giữa `3 + 3` và `"Result: " + 3 + 3`, sửa lại bằng dấu ngoặc đơn `()`.
- **Expected Output:**
  - `6`
  - `Sai: 33`
  - `Dung: 6`
- 🔗 [Mở bài lab Slot 02 trên Code Studio Tryit](/studio/playground?example=slot-02-lab)

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(3 + 3);
        System.out.println("Sai: " + 3 + 3);
        // TODO: Them dau ngoac () de in ra "Dung: 6"
        System.out.println("Dung: " + 3 + 3);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 2B)</summary>

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(3 + 3);
        System.out.println("Sai: " + 3 + 3);
        System.out.println("Dung: " + (3 + 3));
    }
}
```

* **Giải thích:** Toán tử `+` kết hợp từ trái sang phải: một khi vế trái là `String`, các toán hạng phía sau tự động bị ép sang chuỗi nếu không nhóm ngoặc `(3 + 3)`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pdf) · [PPTX](/media/pro192/slides/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (5 ảnh)</summary>

![Sơ đồ Slot 2: step2](/media/pro192/images/step2.png)

![Sơ đồ Slot 2: step22](/media/pro192/images/step22.png)

![Sơ đồ Slot 2: step3](/media/pro192/images/step3.png)

![Sơ đồ Slot 2: step4](/media/pro192/images/step4.png)

![Sơ đồ Slot 2: output](/media/pro192/images/output.png)

</details>

---

**Điều hướng:** [← Slot 01](./slot-01.md) | [Mục lục PRO192](../README.md) | [Slot 03 →](./slot-03.md)
