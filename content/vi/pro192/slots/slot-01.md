---
slot: 1
stage: 1
title: "Slot 01: Tổng quan Công nghệ Java & Kiến trúc Nền tảng (JDK/JRE/JVM)"
category: PRO192
lang: vi
examFocus:
  - "Nền tảng"
  - "Thi FE"
estimatedMinutes: 20
slidePdf: "/media/pro192/resources/Get%20Start.pdf"
slidePptx: "/media/pro192/slides/Get%20Start.pptx"
peRefs: []
---

# Slot 01: Tổng quan Công nghệ Java & Kiến trúc Nền tảng (JDK/JRE/JVM)

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 1: Khởi động, Môi trường & Nền tảng Cú pháp Java
- **Trọng tâm thi:** `Nền tảng` `Thi FE` | **Thời lượng gợi ý:** ~20 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Get%20Start.pdf) · [Slide PPTX](/media/pro192/slides/Get%20Start.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt chính xác vai trò và mối quan hệ giữa JDK, JRE và JVM.
- Giải thích cơ chế "Write Once, Run Anywhere" (WORA) qua `.java` -> `javac` -> Bytecode `.class` -> JVM.
- Nắm 10 đặc tính cốt lõi của Java và hai trụ cột của Java Platform (JVM + Java API).

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Get Start.pptx` (từ slide *About the Java Technology (1)* đến slide *Java Platform*) và `Introduction.pptx`.

<details>
<summary>📚 Đọc thêm: Lịch sử hình thành ngôn ngữ Oak &amp; Java (1990–1997)</summary>

Theo tài liệu bài giảng `Get Start.pptx` (slide *About the Java Technology (1)*), lịch sử ngôn ngữ Java bắt đầu vào năm 1990 tại Sun Microsystems. Một nhóm kỹ sư gồm **James Gosling, Bill Joy, và Patrick Naughton** đã khởi xướng dự án phát triển một ngôn ngữ lập trình có tên ban đầu là **Oak**. 

Mục tiêu ban đầu của Oak không hướng tới máy vi tính cá nhân hay ứng dụng máy tính để bàn, mà nhằm mục đích nhúng chương trình điều khiển vào các thiết bị điện tử gia dụng thông minh (Consumer electronic devices) như đầu máy video cassette (VCR) và thiết bị kỹ thuật số hỗ trợ cá nhân (PDA).

Tại thời điểm đó, ngôn ngữ thiết kế phải đáp ứng được ba đòi hỏi kỹ thuật sống còn:
1. **Độc lập nền tảng (Platform independent):** Chương trình phải chạy được trên nhiều loại vi xử lý khác nhau của các hãng sản xuất thiết bị mà không cần sửa đổi mã nguồn.
2. **Cực kỳ tin cậy (Extremely reliable):** Phần mềm nhúng trên thiết bị tiêu dùng không được phép gặp sự cố làm tê liệt thiết bị.
3. **Gọn nhẹ (Compact):** Dung lượng bộ nhớ của các thiết bị phần cứng thời kỳ đó rất hạn chế.

Đến giai đoạn 1993 – 1994, khi các dự án truyền hình tương tác và thiết bị PDA gặp bế tắc trên thị trường thương mại, cùng lúc đó mạng toàn cầu Internet và World Wide Web bùng nổ, Sun Microsystems đã quyết định chuyển hướng hoàn toàn ngôn ngữ Oak sang môi trường phát triển ứng dụng Internet và đổi tên chính thức thành **Java**. 

Năm 1994, Sun cho ra đời trình duyệt **HotJava Browser** viết hoàn toàn bằng Java, đánh dấu sự xuất hiện của công nghệ Java Applet, mở ra kỷ nguyên mới cho các trang web động tương tác cao. Lộ trình phát triển của Java trải qua ba mốc tiến hóa lớn:
* **1991 – 1994:** Thời kỳ hệ thống nhúng (Embedded Systems).
* **1995 – 1997:** Kỳ quan phía máy khách người dùng (A client-side Wonder).
* **1997 đến nay:** Chuyển dịch mạnh mẽ và thống trị tầng ứng dụng máy chủ/tầng trung gian (Middle-tier & Enterprise).

</details>

### 2.2. 10 Đặc Tính Kỹ Thuật Cốt Lõi Của Java
Theo slide *About the Java Technology (3)*, ngôn ngữ Java sở hữu 10 đặc tính kỹ thuật nền tảng:
* **Đơn giản (Simple):** Loại bỏ các cú pháp phức tạp, dễ gây lỗi bộ nhớ của C/C++ như con trỏ số học tường minh, đa kế thừa trực tiếp giữa các lớp, và giải phóng bộ nhớ thủ công.
* **Hướng đối tượng (Object oriented):** Mọi logic tính toán và dữ liệu đều được đóng gói bên trong các lớp và đối tượng.
* **Phân tán (Distributed):** Tích hợp sẵn các thư viện hỗ trợ giao thức mạng TCP/IP, RMI giúp phát triển ứng dụng mạng thuận tiện.
* **Đa luồng (Multithreaded):** Hỗ trợ lập trình đồng thời nhiều luồng xử lý độc lập ngay từ cấp độ ngôn ngữ và máy ảo.
* **Liên kết động (Dynamic linking):** Các lớp mã chỉ được nạp vào bộ nhớ (Class Loading) khi chương trình thực sự cần đến.
* **Trung lập kiến trúc (Architecture neutral):** Trình biên dịch tạo ra định dạng bytecode không phụ thuộc vào tập lệnh của bất kỳ CPU cụ thể nào.
* **Khả chuyển (Portable):** Quy định chặt chẽ kích thước và miền giá trị của các kiểu dữ liệu trên mọi nền tảng phần cứng.
* **Hiệu năng cao (High performance):** Kết hợp giữa trình thông dịch và công nghệ biên dịch tại thời điểm chạy (JIT - Just-In-Time Compiler).
* **Mạnh mẽ / Chặt chẽ (Robust):** Kiểm tra kiểu dữ liệu nghiêm ngặt tại thời điểm biên dịch và thời điểm chạy, loại bỏ lỗi ghi đè ô nhớ ngoài ý muốn nhờ quản lý con trỏ ngầm định.
* **An toàn (Secure):** Mô hình bảo mật nhiều lớp ngăn chặn các đoạn mã độc truy xuất trái phép vào hệ thống tập tin cục bộ.

### 2.3. Cơ Chế Độc Lập Nền Tảng: "Write Once, Run Anywhere" (WORA)
Slide *How can Java support platform-independence?* giải thích cơ chế giúp Java độc lập với hệ điều hành và phần cứng bằng quy trình chuyển đổi hai bước:

Mã nguồn được viết trong tập tin văn bản thuần túy có phần mở rộng `.java`. Khi thực hiện biên dịch bằng công cụ `javac.exe`, trình biên dịch không dịch mã nguồn ra mã máy nhị phân của Windows, Linux hay macOS. Thay vào đó, `javac.exe` dịch mã nguồn thành **Java Bytecode** – một tập lệnh trung gian trừu tượng được lưu trong tập tin có phần mở rộng `.class`.

Bytecode này có cấu trúc giống hệt nhau trên mọi máy tính. Khi cần chạy chương trình, mỗi hệ điều hành sẽ sử dụng một bản cài đặt riêng của **Java Virtual Machine (JVM)** thông qua công cụ `java.exe`. JVM đóng vai trò như một bộ thông dịch thông minh, đọc từng lệnh bytecode từ file `.class` và chuyển dịch tương thích với kiến trúc vi xử lý và hệ điều hành cụ thể bên dưới. Nhờ đó, người lập trình chỉ cần biên dịch mã nguồn một lần duy nhất, tệp `.class` có thể mang sang bất kỳ máy tính nào có cài đặt JVM để thực thi mà không cần biên dịch lại.

### 2.4. Hai Thành Phần Trụ Cột Của Java Platform

![Kiến trúc Java Platform và JVM](/media/pro192/images/JavaPlatform.png)

![Cách JVM biên dịch và thực thi Bytecode](/media/pro192/images/JVM.png)

Trong slide *Java Platform*, nền tảng Java được định nghĩa là môi trường phần mềm bao bọc bên trên hệ điều hành và phần cứng. Nền tảng này gồm hai thành phần thiết yếu:
1. **Java Virtual Machine (JVM):** Là cỗ máy tính toán trừu tượng. JVM quản lý việc nạp các lớp (ClassLoader), cấp phát và giải phóng vùng nhớ (Memory Management & Garbage Collection), quản lý ngăn xếp thực thi (Call Stack), và cung cấp động cơ thực thi bytecode (Execution Engine).
2. **Java Application Programming Interface (API):** Là bộ sưu tập khổng lồ gồm hàng ngàn lớp và giao diện đã được biên dịch sẵn, gom nhóm thành các gói (packages) như `java.lang`, `java.util`, `java.io`, `java.net`. API cung cấp đầy đủ các khối chức năng từ cơ bản (xử lý chuỗi, mảng, cấu trúc dữ liệu) đến nâng cao (nhập xuất dữ liệu, lập trình mạng, giao diện đồ họa).

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 01:**
> - Bẫy trắc nghiệm FE: Bytecode `.class` độc lập nền tảng, nhưng **JVM lại phụ thuộc hệ điều hành** (Windows/Linux/macOS có bộ cài JVM riêng).
> - Java hỗ trợ **JIT (Just-In-Time Compiler)** kết hợp thông dịch + biên dịch mã nóng để tối ưu tốc độ chứ không chỉ thông dịch thuần.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 1.1: Vai trò và định dạng của Bytecode

**Đề bài:** Trình biên dịch `javac.exe` biên dịch mã nguồn `Program.java` thành tập tin nào? Tập tin đó chứa mã gì và chạy trực tiếp trên phần cứng máy tính hay thông qua thành phần nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Trình biên dịch `javac.exe` biên dịch `Program.java` thành tập tin `Program.class`. Tập tin này chứa **Java Bytecode** (chuỗi tập lệnh mã nhị phân trung gian chuẩn hóa). Bytecode không thể chạy trực tiếp trên phần cứng máy tính mà phải chạy thông qua máy ảo **Java Virtual Machine (JVM)**. JVM sẽ thông dịch bytecode thành mã máy tương thích với hệ điều hành hiện hành.

</details>

---

### Bài 1.2: Định nghĩa hai thành phần cốt lõi của Java Platform

**Đề bài:** Hãy nêu chính xác tên và nhiệm vụ của hai thành phần cấu tạo nên Java Platform theo tài liệu bài giảng.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Hai thành phần cốt lõi gồm:
1. **Java Virtual Machine (JVM):** Chịu trách nhiệm thực thi mã bytecode, quản lý bộ nhớ, ngăn xếp luồng và cung cấp môi trường chạy an toàn cho ứng dụng.
2. **Java Application Programming Interface (API):** Thư viện các lớp và giao diện được viết sẵn cung cấp các tiện ích lập trình từ cơ bản đến nâng cao.

</details>

---

### Bài 1.3: Lịch sử và mục tiêu ban đầu của ngôn ngữ Oak

**Đề bài:** Ngôn ngữ Java ban đầu mang tên là gì, được nhóm kỹ sư nào phát triển vào năm 1990 tại Sun Microsystems, và được thiết kế nhằm mục đích cho thiết bị gì?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Ngôn ngữ ban đầu có tên là **Oak**, do nhóm kỹ sư gồm **James Gosling, Bill Joy, và Patrick Naughton** thiết kế vào năm 1990. Mục tiêu ban đầu là nhúng vào các thiết bị điện tử tiêu dùng thông minh (Consumer electronics) như đầu phát video cassette (VCR) và thiết bị kỹ thuật số cá nhân (PDA).

</details>

---

### Bài 1.4: Phân tích các đặc tính kỹ thuật của Java

**Đề bài:** Trình bày ý nghĩa của hai đặc tính: **Kiến trúc trung lập (Architecture neutral)** và **Khả chuyển (Portable)** trong danh sách 10 đặc tính kỹ thuật cốt lõi của Java.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kiến trúc trung lập (Architecture neutral):** Trình biên dịch Java tạo ra định dạng tệp bytecode `.class` không phụ thuộc vào bất kỳ kiến trúc phần cứng hay vi xử lý cụ thể nào.
* **Khả chuyển (Portable):** Java quy định thống nhất kích thước bộ nhớ và miền giá trị của các kiểu dữ liệu nguyên thủy trên toàn bộ các nền tảng (ví dụ kiểu `int` luôn cố định 4 bytes dù chạy trên máy 32-bit hay 64-bit), giúp mã nguồn chạy nhất quán trên mọi môi trường.

</details>

---

### Bài 1.5: Bản chất của triết lý "Write Once, Run Anywhere"

**Đề bài:** Tại sao lập trình viên Java không cần phải biên dịch lại mã nguồn khi di chuyển chương trình từ máy tính chạy hệ điều hành Windows sang máy tính chạy hệ điều hành Linux?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Vì sản phẩm của quá trình biên dịch là tệp bytecode `.class` trung lập, không chứa các lệnh mã máy của hệ điều hành Windows. Khi chuyển sang máy Linux, chỉ cần máy tính đó cài đặt phiên bản JVM dành cho Linux, JVM này sẽ đọc bytecode và tự động chuyển đổi thành tập lệnh máy tương ứng của Linux tại thời điểm chạy.

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 1A: W3Schools Java Output — Sửa `print()` vs `println()` in Thẻ Sinh viên
- **Mục tiêu:** Điền/sửa lệnh in `System.out.print` và `System.out.println` để các trường tách dòng gọn gàng.
- **Expected Output:**
  - `=== STUDENT CARD ===`
  - `Sinh vien: Nguyen Van An (SE180001)`
  - `Mon: PRO192`

```java
public class Main {
    public static void main(String[] args) {
        String name = "Nguyen Van An";
        String roll = "SE180001";
        // TODO: Sua cac lenh print/println de khop Expected Output
        System.out.print("=== STUDENT CARD ===");
        System.out.print("Sinh vien: " + name);
        System.out.print(" (" + roll + ")");
        System.out.print("Mon: PRO192");
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 1A)</summary>

```java
public class Main {
    public static void main(String[] args) {
        String name = "Nguyen Van An";
        String roll = "SE180001";
        System.out.println("=== STUDENT CARD ===");
        System.out.print("Sinh vien: " + name);
        System.out.println(" (" + roll + ")");
        System.out.println("Mon: PRO192");
    }
}
```

* **Giải thích:** `print()` giữ con trỏ trên cùng một dòng (hợp để ghép `(" + roll + ")` ngay sau tên), còn `println()` in xong sẽ tự xuống dòng.

</details>

---

#### 🟡 Thực hành 1B: JVM & Platform Info Lab (`System.getProperty`)
- **Mục tiêu:** In ra phiên bản Java, tên nhà cung cấp JVM và hệ điều hành đang chạy trong sandbox.
- **Expected Output:**
  - `Java Version : 21.x...`
  - `OS Platform  : Linux`
- 🔗 [Mở bài lab Slot 01 trên Code Studio Tryit](/studio/playground?example=slot-01-lab)

```java
public class Main {
    public static void main(String[] args) {
        // TODO: Lay gia tri bang System.getProperty("java.version") va "os.name"
        String javaVer = "";
        String osName = "";
        System.out.println("Java Version : " + javaVer);
        System.out.println("OS Platform  : " + osName);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 1B)</summary>

```java
public class Main {
    public static void main(String[] args) {
        String javaVer = System.getProperty("java.version");
        String osName = System.getProperty("os.name");
        System.out.println("Java Version : " + javaVer);
        System.out.println("OS Platform  : " + osName);
    }
}
```

* **Giải thích:** Mỗi hệ điều hành cài một JVM riêng nhưng đọc chung file bytecode `.class`, nhờ đó chương trình Java chạy nhất quán qua WORA.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md) · [Giới thiệu Kiến trúc JVM & Quy trình thực thi Bytecode](../../java/jvm/jvm-intro.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Get%20Start.pdf) · [PPTX](/media/pro192/slides/Get%20Start.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (2 ảnh)</summary>

![Sơ đồ Slot 1: JavaPlatform](/media/pro192/images/JavaPlatform.png)

![Sơ đồ Slot 1: JVM](/media/pro192/images/JVM.png)

</details>

---

**Điều hướng:** *(Bài đầu tiên)* | [Mục lục PRO192](../README.md) | [Slot 02 →](./slot-02.md)
