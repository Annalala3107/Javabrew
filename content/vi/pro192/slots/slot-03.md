---
slot: 3
stage: 1
title: "Slot 03: Cấu trúc Chương trình Java & Quy trình Biên dịch CLI (javac/java/jar)"
category: PRO192
lang: vi
examFocus:
  - "Nền tảng"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Learning%20the%20Java%20Language.pdf"
slidePptx: "/media/pro192/slides/Learning%20the%20Java%20Language.pptx"
peRefs: []
---

# Slot 03: Cấu trúc Chương trình Java & Quy trình Biên dịch CLI (javac/java/jar)

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 1: Khởi động, Môi trường & Nền tảng Cú pháp Java
- **Trọng tâm thi:** `Nền tảng` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) · [Slide PPTX](/media/pro192/slides/Learning%20the%20Java%20Language.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Đọc hiểu cấu trúc chuẩn một tệp `.java` và chữ ký bắt buộc `public static void main(String[] args)`.
- Sử dụng thành thạo bộ lệnh CLI `javac`, `java`, `jar` và hiểu quy tắc đặt tên tệp khớp lớp `public`.
- Nắm sự khác biệt giữa 3 kiểu comment (`//`, `/* */`, `/** ... */`) và truyền đối số dòng lệnh `args`.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Get Start.pptx` (từ slide *Structure of a Java program* đến slide *Summary*).

### 4.1. Giải Phẫu Cấu Trúc Mã Nguồn Java

![Cấu trúc chương trình Java đầu tiên](/media/pro192/images/firstProgram.png)

Slide *Structure of a Java program* và *A Closer Look at the "Hello World!" Application* phân tích chi tiết từng khối cấu trúc của một ứng dụng Java:

```java
/*
 * Chu thich tren nhieu dong (Block comment)
 */
public class HelloWorld {
    // Chu thich tren mot dong (End-of-line comment)
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
```

* **Chú thích (Comments):** Java cung cấp hai cơ chế chú thích:
  * Chú thích khối: Bắt đầu bằng `/*` và kết thúc bằng `*/`, dùng để ghi chú giải thuật kéo dài nhiều dòng.
  * Chú thích dòng: Bắt đầu bằng cặp dấu gạch chéo `//`, có tác dụng giải thích từ vị trí đó đến cuối dòng.
* **Khai báo lớp (Class Declaration):** 
  * Mọi dòng lệnh trong Java bắt buộc phải nằm bên trong một lớp (class).
  * Từ khóa `public` là bộ bổ nghĩa truy cập cho phép lớp được sử dụng từ bên ngoài.
  * Tên lớp `HelloWorld` phải trùng khớp hoàn toàn với tên tập tin vật lý `HelloWorld.java` (phân biệt chữ hoa và chữ thường).
* **Phương thức `main` (Entry Point):**
  * Là điểm bắt đầu thực thi của mọi ứng dụng Java độc lập.
  * `public`: Cho phép JVM gọi phương thức này từ bên ngoài lớp.
  * `static`: Cho phép JVM gọi trực tiếp phương thức thông qua tên lớp mà không cần phải dùng từ khóa `new` để khởi tạo đối tượng trước. Slide ghi nhận: thứ tự khai báo `public static` hoặc `static public` đều hợp lệ.
  * `void`: Phương thức thực thi logic mà không trả về bất kỳ giá trị nào.
  * `String[] args`: Mảng chứa các chuỗi ký tự đại diện cho các tham số dòng lệnh được truyền vào khi khởi động chương trình. Cú pháp `String args[]` cũng được chấp nhận.
  * `System.out.println(...)`: Lệnh gọi phương thức của đối tượng luồng xuất chuẩn để in dữ liệu ra console và tự động xuống dòng mới.

### 4.2. Cú Pháp Biên Dịch Và Thực Thi Bằng Dòng Lệnh
Khi không dùng IDE, quy trình thực thi dòng lệnh gồm hai câu lệnh riêng biệt:
1. **Lệnh biên dịch (Compile):**
   * **Cú pháp:** `javac [options] source`
   * **Quy tắc:** `source` là tên một hoặc nhiều tập tin mã nguồn có đầy đủ phần mở rộng `.java`.
   * **Ví dụ:** `javac HelloWorld.java` -> sinh ra tệp `HelloWorld.class`.
2. **Lệnh thông dịch thực thi (Run):**
   * **Cú pháp:** `java [options] classname [args]`
   * **Quy tắc:** `classname` là **tên của lớp**, tuyệt đối không được viết thêm đuôi `.class`. Nếu có tham số dòng lệnh, các tham số viết cách nhau bằng khoảng trắng phía sau tên lớp.
   * **Ví dụ:** `java HelloWorld`.

### 4.3. Kỹ Thuật Triển Khai Ứng Dụng Cho Người Dùng Cuối (End Users)
Người dùng cuối chỉ cài đặt môi trường máy ảo JRE và chạy chương trình thông qua tập tin `.class` trong thư mục `build\classes`. Tài liệu slide *End users run Java Programs* hướng dẫn ba giải pháp thực thi:

* **Giải pháp 1: Sử dụng tham số `-cp` hoặc `-classpath`**
  ```shell
  java -cp K:\GiangDay\FU\Java-OOP\Demos\FirstPrj\build\classes HelloWorld
  java -classpath K:\GiangDay\FU\Java-OOP\Demos\FirstPrj\build\classes HelloWorld
  ```
  Lệnh này chỉ định tường minh cho JVM biết thư mục chứa tệp bytecode cần thực thi.
* **Giải pháp 2: Điều hướng vào thư mục lớp và chạy trực tiếp**
  Nhờ biến môi trường `CLASSPATH` đã có thiết lập `.;` ở đầu:
  ```shell
  K:
  cd K:\GiangDay\FU\Java-OOP\Demos\FirstPrj\build\classes
  java HelloWorld
  ```
* **Giải pháp 3: Đóng gói tập tin thực thi Batch (`.bat`)**
  Slide *A BAT file* hướng dẫn tạo một tập tin văn bản bằng Notepad đặt tên là `HelloWorld.bat` nằm ngay tại thư mục chứa file `.class` với nội dung:
  ```text
  java HelloWorld
  Pause
  ```
  Người dùng cuối chỉ cần nhấp đúp chuột vào tập tin `.bat`. Lệnh `Pause` có nhiệm vụ giữ cửa sổ dòng lệnh mở để người dùng xem kết quả xuất ra cho đến khi nhấn một phím bất kỳ.

### 4.4. Xử Lý Các Lỗi Thường Gặp (Common Problems & Solutions)
Bảng tổng hợp chẩn đoán lỗi theo slide *Common Problems (and Their Solutions)*:

| Thông báo lỗi hiển thị | Nguyên nhân gốc rễ | Giải pháp xử lý triệt để |
| :--- | :--- | :--- |
| `'javac' is not recognized as an internal or external command, operable program or batch file` | Hệ điều hành Windows không tìm thấy tệp `javac.exe` do biến môi trường `Path` chưa được thiết lập hoặc thiết lập sai đường dẫn thư mục `bin`. | Kiểm tra lại mục `System Variables`, sửa biến `Path` trỏ đúng vào thư mục `bin` của JDK (ví dụ: `C:\Program Files\Java\jdk1.8.0\bin;`). |
| `Exception in thread "main" java.lang.NoClassDefFoundError: HelloWorld/class` | Người dùng đã gõ nhầm tên tệp có phần mở rộng `.class` khi chạy lệnh `java` (ví dụ: `java HelloWorld.class`). | Loại bỏ đuôi `.class`, chỉ gõ đúng tên lớp: `java HelloWorld`. |
| `Could not find or load main class HelloWorld` | Gõ sai chữ hoa/chữ thường của tên lớp HOẶC tệp `.class` không nằm trong các thư mục được liệt kê tại `CLASSPATH`. | Kiểm tra tính chính xác hoa/thường của tên lớp và đảm bảo `CLASSPATH` có chứa dấu chấm `.;`. |

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 03:**
> - Bẫy CLI cực hay hỏi ở FE: chạy `java HelloWorld` (KHÔNG ghi đuôi `.class`), trong khi biên dịch phải ghi đủ `javac HelloWorld.java`.
> - File `.java` chứa lớp `public class A` bắt buộc phải đặt tên file đúng `A.java` (phân biệt hoa/thường), và trong 1 file chỉ có tối đa 1 class `public`.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 3.1: Phân biệt các loại chú thích trong Java

**Đề bài:** Trình bày cú pháp của hai dạng chú thích chuẩn trong ngôn ngữ Java và nêu trường hợp ứng dụng thực tế của từng dạng.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Chú thích dòng (`//`): Có tác dụng từ sau ký tự `//` đến hết dòng. Dùng để giải thích ngắn gọn ý nghĩa của một dòng lệnh hoặc biến cụ thể.
* Chú thích khối (`/* ... */`): Bắt đầu bằng `/*` và kết thúc bằng `*/`. Dùng để ghi chú đoạn tài liệu dài, mô tả giải thuật phức tạp kéo dài qua nhiều dòng.

</details>

---

### Bài 3.2: Ý nghĩa của từ khóa static trong phương thức main

**Đề bài:** Tại sao phương thức `main` trong lớp khởi chạy của Java bắt buộc phải khai báo với từ khóa `static`?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Từ khóa `static` cho biết phương thức này thuộc về chính bản thân lớp chứ không phụ thuộc vào bất kỳ đối tượng cụ thể nào. Khi chương trình khởi động, JVM có thể gọi trực tiếp phương thức `main` thông qua tên lớp (ví dụ: `HelloWorld.main()`) để bắt đầu thực thi chương trình mà không cần phải cấp phát hay khởi tạo thể hiện (instance) của lớp đó trước.

</details>

---

### Bài 3.3: Thao tác tham số dòng lệnh (Command-line arguments)

**Đề bài:** Cho lớp `Calculate` có nội dung sau:
```java
public class Calculate {
    public static void main(String[] args) {
        System.out.println("Tong so tham so: " + args.length);
    }
}
```
Nếu chạy lệnh `java Calculate Ha Noi Viet Nam`, kết quả in ra màn hình là gì? Giải thích cơ chế truyền tham số.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `Tong so tham so: 4`
* **Giải thích:** Khi thực thi lệnh, JVM tự động tách các chuỗi ký tự đứng sau tên lớp được phân cách bởi khoảng trắng thành các phần tử mảng kiểu chuỗi: `args[0] = "Ha"`, `args[1] = "Noi"`, `args[2] = "Viet"`, `args[3] = "Nam"`. Mảng này có độ dài `args.length` bằng 4.

</details>

---

### Bài 3.4: Xây dựng tệp Batch chạy tự động

**Đề bài:** Hãy viết nội dung tệp `RunApp.bat` để thực thi lớp `MainProgram` và giữ cửa sổ màn hình không bị tự động đóng lại sau khi chạy xong.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Nội dung tệp `RunApp.bat`:
```text
java MainProgram
Pause
```
Lệnh `java MainProgram` yêu cầu JVM nạp và chạy lớp, còn lệnh `Pause` gửi tín hiệu yêu cầu hệ thống dừng lại và hiển thị thông báo "Press any key to continue . . ." giúp người dùng quan sát toàn bộ kết quả.

</details>

---

### Bài 3.5: Khắc phục lỗi sai cú pháp khi thông dịch

**Đề bài:** Một lập trình viên gõ lệnh `java MyClass.class` trên cửa sổ dòng lệnh và nhận được thông báo lỗi `NoClassDefFoundError`. Hãy giải thích nguyên nhân máy ảo báo lỗi và sửa lại câu lệnh cho đúng.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Nguyên nhân:** Lệnh `java` nhận tham số là **tên lớp (Class Name)** được định nghĩa trong mã nguồn chứ không nhận tên tệp tin vật lý. Dấu chấm trong Java đại diện cho phân cấp gói (package), do đó JVM hiểu nhầm rằng người dùng đang tìm kiếm một lớp tên là `class` nằm bên trong gói `MyClass`.
* **Cách sửa:** Gõ đúng tên lớp không kèm phần mở rộng: `java MyClass`.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 3A: CLI Args — Đọc Tham số Dòng lệnh `String[] args`
- **Mục tiêu:** Hoàn thiện hàm kiểm tra `args.length`: nếu rỗng thì dùng giá trị mặc định, ngược lại in từng tham số.
- **Expected Output:**
  - `args.length = 0 -> Fallback: JavaBrew`

```java
public class Main {
    public static void main(String[] args) {
        // TODO: Kiem tra neu args.length == 0 in Fallback, nguoc lai in args[0]
        System.out.println("args.length = " + args.length);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 3A)</summary>

```java
public class Main {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("args.length = 0 -> Fallback: JavaBrew");
        } else {
            System.out.println("args[0] = " + args[0]);
        }
    }
}
```

* **Giải thích:** Khi chạy `java Main arg0 arg1`, JVM đóng gói danh sách đối số truyền sau tên lớp vào mảng `args` (nên luôn kiểm tra `args.length` trước khi đọc `args[0]`).

</details>

---

#### 🟡 Thực hành 3B: Multi-Class trong 1 File `.java` & Luật Lớp `public`
- **Mục tiêu:** Khai báo thêm một lớp hỗ trợ package-private trong cùng file với `public class Main` để không vi phạm luật trình biên dịch `javac`.
- **Expected Output:**
  - `[PRO192]`
  - `Build OK`
- 🔗 [Mở bài lab Slot 03 trên JavaBrew Live Lab](/studio/playground?example=slot-03-lab)

```java
// TODO: Bo tu khoa sai pham de 2 class cung nam trong Main.java biên dịch duoc
public class TagHelper {
    void showTag(String s) {
        System.out.println("[" + s + "]");
    }
}

public class Main {
    public static void main(String[] args) {
        TagHelper helper = new TagHelper();
        helper.showTag("PRO192");
        System.out.println("Build OK");
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 3B)</summary>

```java
class TagHelper {
    void showTag(String s) {
        System.out.println("[" + s + "]");
    }
}

public class Main {
    public static void main(String[] args) {
        TagHelper helper = new TagHelper();
        helper.showTag("PRO192");
        System.out.println("Build OK");
    }
}
```

* **Giải thích:** Trong một file `.java` chỉ được có **tối đa 1 `public class`** trùng với tên tệp (`Main.java`). Các lớp phụ viết cùng file phải bỏ `public` hoặc tách ra file `.java` riêng.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Cấu trúc tệp `.class` (Bytecode Layout)](../../java/jvm/class-file-structure.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) · [PPTX](/media/pro192/slides/Learning%20the%20Java%20Language.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (1 ảnh)</summary>

![Sơ đồ Slot 3: firstProgram](/media/pro192/images/firstProgram.png)

</details>

---

**Điều hướng:** [← Slot 02](./slot-02.md) | [Mục lục PRO192](../README.md) | [Slot 04 →](./slot-04.md)
