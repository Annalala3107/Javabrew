---
slot: 29
stage: 8
title: "Slot 29: Luồng Ký tự (Character Streams), UTF-8, BufferedReader & try-with-resources"
category: PRO192
lang: vi
examFocus:
  - "Thi FE"
  - "Thực chiến"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/File%20IO.pdf"
slidePptx: "/media/pro192/slides/File%20IO.pptx"
peRefs: []
---

# Slot 29: Luồng Ký tự (Character Streams), UTF-8, BufferedReader & try-with-resources

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 8: File I/O Streams, Character/Byte Streams & Serialization
- **Trọng tâm thi:** `Thi FE` `Thực chiến` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/File%20IO.pdf) · [Slide PPTX](/media/pro192/slides/File%20IO.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Đọc và bóc tách dữ liệu văn bản CSV từng dòng bằng `BufferedReader.readLine()` kết hợp `StringBuilder`.
- Phân biệt ghi đè (`new FileWriter(f)`) vs ghi nối đuôi (`new FileWriter(f, true)`) và vai trò `flush()` / `close()`.
- Áp dụng chuẩn **`try-with-resources`** (Java 7+) + `StandardCharsets.UTF_8` để không rò rỉ file và không lỗi font tiếng Việt.

## 2. Lý thuyết cốt lõi

### 2.1 Cây phân cấp Luồng Ký tự: `java.io.Reader` và `java.io.Writer`

![Ví dụ xử lý File văn bản Character Streams](/media/pro192/images/IO.12C.gif)

- **Đặc trưng:** Luồng ký tự được thiết kế chuyên biệt để xử lý các dòng ký tự Unicode 16-bit.
- **Hai lớp trừu tượng gốc:**
  - **`java.io.Reader`**: Luồng trừu tượng đọc chuỗi ký tự.
  - **`java.io.Writer`**: Luồng trừu tượng ghi chuỗi ký tự.
- **Kiến trúc phân tầng (Layered Stream Architecture):**
  - Các lớp cơ bản cấp thấp như `FileReader`, `FileWriter` chỉ đọc/ghi từng ký tự thô.
  - Java sử dụng kỹ thuật bao bọc luồng cấp cao để tăng tốc độ và bổ sung phương thức tiện ích:
    - Bọc `FileReader` bên trong **`BufferedReader`** để sử dụng phương thức đọc dòng `readLine()`.
    - Bọc `FileWriter` bên trong **`PrintWriter`** để sử dụng các phương thức ghi định dạng `print()`, `println()`.

### 2.2 Đọc dòng văn bản với `FileReader` và `BufferedReader`
- **Mẫu đọc dòng-qua-dòng (Line-by-line reading pattern):**
  ```java
  File f = new File("employees.txt");
  if (!f.exists()) return;

  FileReader fr = new FileReader(f);
  BufferedReader bf = new BufferedReader(fr);
  String line;
  while ((line = bf.readLine()) != null) {
      // Xử lý từng dòng văn bản
  }
  bf.close();
  fr.close();
  ```
- **Quy ước của phương thức `readLine()`:**
  - Đọc một dòng ký tự cho đến khi gặp ký tự xuống dòng (`\n` hoặc `\r\n`). Ký tự xuống dòng tự động được loại bỏ khỏi chuỗi kết quả.
  - Khi đọc chạm tới **cuối tập tin (End of File - EOF)**, phương thức trả về giá trị **`null`**.
- **Bóc tách dữ liệu:** Dòng văn bản sau khi đọc thường được phân tách thành các trường dữ liệu bằng phương thức `line.split(",")` hoặc lớp `StringTokenizer`.

### 2.3 Ghi và nối dữ liệu với `FileWriter` và `PrintWriter`
- **Chế độ Ghi đè (Overwrite Mode):**
  - Khởi tạo: `new FileWriter(f)` hoặc `new FileWriter(filename, false)`.
  - Nếu file đã tồn tại, toàn bộ nội dung cũ trong file sẽ bị **xóa sạch hoàn toàn** để ghi dữ liệu mới.
- **Chế độ Ghi nối đuôi (Append Mode):**
  - Khởi tạo: `new FileWriter(f, true)`.
  - Tham số boolean `true` báo hiệu cho hệ điều hành đặt con trỏ ghi ở cuối file; dữ liệu mới sẽ được **nối thêm vào sau nội dung cũ**.
- **Lớp `PrintWriter`:** Cung cấp các phương thức `print()`, `println()` tự động chuyển đổi các kiểu dữ liệu nguyên thủy và đối tượng thành chuỗi ký tự hiển thị.

### 2.4 Vai trò sống còn của cơ chế đệm, phương thức `flush()` và `close()`
- **Vùng đệm xuất (Output Buffer):** Khi gọi `pw.println()`, dữ liệu chưa được ghi ngay vào đĩa vật lý mà được tạm giữ trong vùng đệm RAM nhằm tối ưu hóa số lần truy xuất phần cứng.
- **Phương thức `flush()`:** Ép vùng đệm đẩy toàn bộ dữ liệu đang chờ trong RAM xuống ghi trực tiếp vào đĩa cứng ngay lập tức.
- **Phương thức `close()`:** Tự động thực hiện `flush()` và đóng luồng tài nguyên với hệ điều hành. Nếu quên đóng luồng, dữ liệu có thể bị rò rỉ hoặc file bị rỗng do dữ liệu chưa kịp ghi xuống đĩa trước khi chương trình kết thúc.

### 2.5 Kỹ thuật đọc tập tin tiếng Việt chuẩn UTF-8 với `InputStreamReader`
Khi đọc tập tin chứa tiếng Việt có dấu được lưu bằng chuẩn nén UTF-8, sử dụng `FileReader` thông thường có thể bị lỗi bảng mã. Giải pháp chuẩn mực là kết hợp bộ ba:
```java
// Khuyến nghị dùng StringBuilder thay cho content += ... trong vòng lặp và try-with-resources (Java 7+)
StringBuilder content = new StringBuilder();
try (BufferedReader br = new BufferedReader(
        new InputStreamReader(new FileInputStream(filename), java.nio.charset.StandardCharsets.UTF_8))) {
    String s;
    while ((s = br.readLine()) != null) {
        content.append(s).append("\n");
    }
}
```

> [!TIP]
> **Modern Java / PE Best Practice (`try-with-resources` & `StringBuilder`):**
> - Code slide cũ gọi `br.close(); isr.close(); f.close();` thủ công ở cuối `try` — nếu dòng `readLine()` ném ngoại lệ giữa chừng, lệnh `close()` phía dưới sẽ **bị bỏ qua gây rò rỉ file handle**.
> - Từ **Java 7+**, mọi luồng cài đặt `AutoCloseable` nên mở trong `try (...)` (try-with-resources) để JVM tự động đóng an toàn theo thứ tự ngược lại bất kể có lỗi hay không; đồng thời luôn dùng `StringBuilder` thay cho `content += s` trong vòng lặp để tránh tạo hàng loạt chuỗi rác O(n²).

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 29:**
> - `FileReader.read()` trả về `int` (`-1` khi EOF), trong khi `BufferedReader.readLine()` trả về `String` (**`null`** khi EOF).
> - Quên gọi `flush()` hoặc `close()` (hoặc lỗi giữa chừng trước khi tới `close()` thủ công) khiến dữ liệu kẹt trong Output Buffer, file trên đĩa vẫn **0 byte**.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 29.1: Giá trị kết thúc tập tin của `read()` và `readLine()`

**Đề bài:** Phương thức `read()` của `FileReader` và phương thức `readLine()` của `BufferedReader` trả về giá trị gì khi con trỏ đọc chạm tới cuối tập tin (End of File - EOF)?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- `read()` (đọc từng ký tự): Trả về giá trị số nguyên `-1` khi chạm cuối file (vì mã Unicode ký tự hợp lệ luôn là số nguyên không âm `>= 0`).
- `readLine()` (đọc từng dòng): Trả về giá trị tham chiếu `null` khi chạm cuối file.

</details>

---

### Bài 29.2: Chế độ Append khi khởi tạo `FileWriter`

**Đề bài:** Cho file `items.txt` đang có sẵn 2 dòng dữ liệu. Xét đoạn mã:
```java
File f = new File("items.txt");
FileWriter fw = new FileWriter(f); // Dòng 2
PrintWriter pw = new PrintWriter(fw);
pw.println("I003");
pw.close();
fw.close();
```
Sau khi đoạn mã trên thực thi, file `items.txt` sẽ có bao nhiêu dòng? Hãy sửa Dòng 2 để dữ liệu mới được nối thêm vào sau 2 dòng cũ mà không làm mất nội dung trước đó.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- File `items.txt` sẽ chỉ còn lại duy nhất 1 dòng chứa `"I003"`. Vì `new FileWriter(f)` mặc định chạy ở chế độ ghi đè (`append = false`), toàn bộ nội dung cũ đã bị xóa sạch.
- Sửa lại: `FileWriter fw = new FileWriter(f, true);` (bật cờ `append = true` để giữ nguyên dữ liệu cũ).

</details>

---

### Bài 29.3: Bóc tách dữ liệu dòng CSV (Case study `EmpList.java`)

**Đề bài:** Tập tin `employees.txt` lưu thông tin nhân viên theo từng dòng định dạng: `code,name,salary` (Ví dụ: `"E001,HOANG VAN TUAN,150"`). Hãy viết một phương thức `public static void readEmployees(String filename)` đọc file trên, tách các trường dữ liệu và in ra màn hình dạng: `"Mã: E001 - Tên: HOANG VAN TUAN - Lương: 150"`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

public class ReadEmpDemo {
    public static void readEmployees(String filename) {
        File f = new File(filename);
        if (!f.exists()) {
            System.out.println("File không tồn tại!");
            return;
        }
        try {
            FileReader fr = new FileReader(f);
            BufferedReader br = new BufferedReader(fr);
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length >= 3) {
                    String code = parts[0].trim();
                    String name = parts[1].trim();
                    int salary = Integer.parseInt(parts[2].trim());
                    System.out.println("Mã: " + code + " - Tên: " + name + " - Lương: " + salary);
                }
            }
            br.close();
            fr.close();
        } catch (Exception e) {
            System.out.println("Lỗi đọc file: " + e.getMessage());
        }
    }
}
```

</details>

---

### Bài 29.4: Tầm quan trọng của `flush()` và `close()`

**Đề bài:** Một lập trình viên sử dụng `PrintWriter` để ghi 10 dòng chữ vào file nhưng quên gọi lệnh `close()` hoặc `flush()` ở cuối chương trình. Khi mở file ra kiểm tra thì thấy file hoàn toàn rỗng. Hãy giải thích nguyên nhân kỹ thuật của hiện tượng này.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Java sử dụng cơ chế vùng đệm xuất (output buffer) trong RAM để gom dữ liệu trước khi ghi xuống đĩa cứng. Lệnh `flush()` hoặc `close()` có nhiệm vụ đẩy toàn bộ dữ liệu từ bộ đệm RAM xuống đĩa từ vật lý. Nếu không gọi `flush()` hoặc `close()`, và chương trình dừng trước khi bộ đệm tự đầy, dữ liệu còn đọng lại trong RAM sẽ bị hủy bỏ, khiến tập tin trên ổ cứng vẫn rỗng.

</details>

---

### Bài 29.5: Đọc tập tin văn bản tiếng Việt UTF-8 không bị lỗi phông

**Đề bài:** Viết đoạn mã hoàn chỉnh đọc nội dung tập tin văn bản tiếng Việt `"thongbao.txt"` (định dạng UTF-8) sử dụng bộ ba `FileInputStream`, `InputStreamReader`, và `BufferedReader` theo đúng slide bài học để bảo đảm ký tự tiếng Việt có dấu hiển thị chuẩn xác ra console.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;

public class ReadUTF8Demo {
    public static void main(String[] args) {
        String filename = "thongbao.txt";
        try {
            FileInputStream fis = new FileInputStream(filename);
            InputStreamReader isr = new InputStreamReader(fis, "UTF-8");
            BufferedReader br = new BufferedReader(isr);

            String line;
            while ((line = br.readLine()) != null) {
                System.out.println(line);
            }

            br.close();
            isr.close();
            fis.close();
        } catch (Exception e) {
            System.out.println("Lỗi: " + e.getMessage());
        }
    }
}
```

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Nền tảng Java I/O (Byte Streams & Character Streams)](../../java/io/io-basis.md) · [Design Patterns trong Java I/O (Decorator / Adapter)](../../java/io/io-design-patterns.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/File%20IO.pdf) · [PPTX](/media/pro192/slides/File%20IO.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (20 ảnh)</summary>

![Sơ đồ Slot 29: IO.12A](/media/pro192/images/IO.12A.gif)

![Sơ đồ Slot 29: IO.12B](/media/pro192/images/IO.12B.gif)

![Sơ đồ Slot 29: IO.12C](/media/pro192/images/IO.12C.gif)

![Sơ đồ Slot 29: IO.12D](/media/pro192/images/IO.12D.gif)

![Sơ đồ Slot 29: IO.12E](/media/pro192/images/IO.12E.gif)

![Sơ đồ Slot 29: IO.12F](/media/pro192/images/IO.12F.gif)

![Sơ đồ Slot 29: IO.12G](/media/pro192/images/IO.12G.gif)

![Sơ đồ Slot 29: IO.12H](/media/pro192/images/IO.12H.gif)

![Sơ đồ Slot 29: IO.12I](/media/pro192/images/IO.12I.gif)

![Sơ đồ Slot 29: IO.12J](/media/pro192/images/IO.12J.gif)

![Sơ đồ Slot 29: IO.12K](/media/pro192/images/IO.12K.gif)

![Sơ đồ Slot 29: IO.12L](/media/pro192/images/IO.12L.gif)

![Sơ đồ Slot 29: IO.12M](/media/pro192/images/IO.12M.gif)

![Sơ đồ Slot 29: IO.12N](/media/pro192/images/IO.12N.gif)

![Sơ đồ Slot 29: IO.12O](/media/pro192/images/IO.12O.gif)

![Sơ đồ Slot 29: IO.12P](/media/pro192/images/IO.12P.gif)

![Sơ đồ Slot 29: IO.12Q](/media/pro192/images/IO.12Q.gif)

![Sơ đồ Slot 29: IO.12R](/media/pro192/images/IO.12R.gif)

![Sơ đồ Slot 29: IO.12S](/media/pro192/images/IO.12S.gif)

![Sơ đồ Slot 29: IO.12T](/media/pro192/images/IO.12T.gif)

</details>

---

**Điều hướng:** [← Slot 28](./slot-28.md) | [Mục lục PRO192](../README.md) | [Slot 30 →](./slot-30.md)
