---
title: "Giai đoạn 8 (Slot 28–30): File I/O Streams, Character/Byte Streams & Serialization"
category: PRO192
slots: "Slot 28 – 30"
lang: vi
description: "java.io.File, BufferedReader/PrintWriter, đọc UTF-8 an toàn, try-with-resources, DataInputStream/RandomAccessFile và Serialization/transient."
---

# GIÁO TRÌNH TOÀN DIỆN LẬP TRÌNH JAVA - GIAI ĐOẠN 8: NHẬP XUẤT DỮ LIỆU (FILE I/O), LUỒNG BYTE / KÝ TỰ & TUẦN TỰ HÓA ĐỐI TƯỢNG (SERIALIZATION) (SLOT 28 – 30)

---

## MỤC LỤC TỔNG QUAN GIAI ĐOẠN 8
1. **Slot 28: Tổng quan Luồng Nhập/Xuất (I/O Streams), Lớp `java.io.File` & Thao tác Siêu dữ liệu Tập tin/Thư mục**
   - 1.1 Khái niệm Luồng dữ liệu (I/O Streams) & Phân loại theo chiều di chuyển
   - 1.2 Bảng mã ASCII, Unicode và Cơ chế nén byte linh hoạt của UTF-8
   - 1.3 Bản chất Siêu dữ liệu của lớp `java.io.File` & Các Constructor thông dụng
   - 1.4 Các phương thức kiểm tra, truy xuất thuộc tính và phân biệt đường dẫn (`getAbsolutePath` vs `getCanonicalPath`)
   - 1.5 Duyệt cây thư mục và quy ước đường dẫn tương đối (`./`, `../`)
   - 1.6 Bộ 5 bài tập tự luyện Slot 28 kèm lời giải chi tiết
2. **Slot 29: Luồng Ký tự (Character Streams) & Xử lý Tập tin Văn bản (Text File Processing)**
   - 2.1 Cây phân cấp Luồng Ký tự: `java.io.Reader` và `java.io.Writer`
   - 2.2 Đọc dòng văn bản với `FileReader` và `BufferedReader` (Quy ước EOF và bóc tách dữ liệu)
   - 2.3 Ghi và nối dữ liệu với `FileWriter` và `PrintWriter` (Overwrite Mode vs Append Mode)
   - 2.4 Vai trò sống còn của cơ chế đệm, phương thức `flush()` và `close()`
   - 2.5 Kỹ thuật đọc tập tin tiếng Việt chuẩn UTF-8 với `InputStreamReader`
   - 2.6 Bộ 5 bài tập tự luyện Slot 29 kèm lời giải chi tiết
3. **Slot 30: Luồng Nhị phân (Binary Streams), Tập tin ngẫu nhiên (`RandomAccessFile`) & Tuần tự hóa Đối tượng (Serialization)**
   - 3.1 Luồng Byte Cấp thấp (`FileInputStream`, `FileOutputStream`) vs Luồng Byte Cấp cao (`DataInputStream`, `DataOutputStream`)
   - 3.2 Lớp truy xuất ngẫu nhiên `java.io.RandomAccessFile`, con trỏ file và phương thức `seek()`
   - 3.3 Bản chất của Tuần tự hóa (Serialization) và Giải tuần tự hóa (Deserialization)
   - 3.4 Marker Interface `java.io.Serializable` và các thành phần bị loại trừ (`transient`, `static`)
   - 3.5 Cảnh báo lỗi StreamCorruptedException khi ghi nối đuôi file nhị phân & Mẫu xử lý qua RAM
   - 3.6 Bộ 5 bài tập tự luyện Slot 30 kèm lời giải chi tiết

---

# SLOT 28: TỔNG QUAN I/O STREAMS, LỚP `java.io.File` & THAO TÁC TẬP TIN / THƯ MỤC

### 1.1 Khái niệm Luồng dữ liệu (I/O Streams) & Phân loại theo chiều di chuyển

![Tổng quan kiến trúc Input/Output Streams trong Java](/media/pro192/images/ioexample.png)

![Sơ đồ luồng ký tự và luồng byte trong Java IO](/media/pro192/images/IO.01.gif)

- **Định nghĩa Luồng (Stream):** Trong Java, một luồng (stream) là một đối tượng quản lý nguồn dữ liệu, biểu diễn một dòng chảy tuần tự các đơn vị thông tin (`sequence of data units`) giữa chương trình Java và các nguồn tài nguyên bên ngoài (tập tin trên đĩa cứng, thiết bị ngoại vi, bộ nhớ, hoặc kết nối mạng).
- **Cơ chế xử lý đơn vị (Unit-by-unit manner):** Dữ liệu được xử lý tuần tự từng đơn vị một: đơn vị có thể là byte vật lý 8-bit, ký tự Unicode 16-bit, hoặc cả một đối tượng dữ liệu hoàn chỉnh.
- **Phân loại theo chiều di chuyển của dữ liệu:**
  1. **Luồng nhập (Input Stream):** Đọc dữ liệu từ nguồn bên ngoài (Data Source) nạp vào các biến của chương trình Java.
  2. **Luồng xuất (Output Stream):** Ghi dữ liệu từ các biến của chương trình Java đẩy ra đích đến bên ngoài (Destination).

### 1.2 Bảng mã ASCII, Unicode và Cơ chế nén byte của chuẩn UTF-8
- **Bảng mã ASCII (8-bit):** Chỉ biểu diễn tối đa 256 ký tự (ký tự tiếng Anh chuẩn và ký tự điều khiển).
- **Chuẩn mã hóa Unicode (16/32-bit):** Hỗ trợ toàn bộ các bảng chữ cái trên thế giới (bao gồm tiếng Việt có dấu, chữ Hán, chữ tượng hình). Một ký tự Unicode trong bộ nhớ Java chiếm 2 bytes (16 bits).
- **Chuẩn nén UTF-8 (Universal Character Set Transformation Format):**
  - Là chuẩn nén phổ biến nhất trên Internet và hệ thống tệp tin hiện đại.
  - Các ký tự ASCII thông thường chỉ chiếm đúng 1 byte (8 bits).
  - Các ký tự đặc thù (như tiếng Việt có dấu) được mã hóa nén linh hoạt từ **1 đến 3 bytes** (hoặc 4 bytes). Trước khi đọc dữ liệu UTF-8 vào các biến ký tự của Java, hệ thống phải thực hiện giải nén.

### 1.3 Bản chất Siêu dữ liệu của lớp `java.io.File` & Các Constructor thông dụng
- **Bản chất cốt tử:** Lớp `java.io.File` chỉ đại diện cho **đường dẫn trừu tượng (abstract pathname)** của một tập tin hoặc thư mục trên hệ điều hành.
- **Cảnh báo từ tài liệu chuẩn:** Lớp `File` chỉ dùng để truy xuất và quản lý **thông tin siêu dữ liệu (metadata)** như tên, đường dẫn, quyền truy cập, kích thước byte. Nó **hoàn toàn không chứa phương thức nào để đọc hoặc ghi nội dung dữ liệu bên trong tập tin**.
- **Các hàm khởi tạo thông dụng:**
  - `File(String pathname)`: Tạo đối tượng File từ chuỗi đường dẫn.
  - `File(String parent, String child)`: Tạo đối tượng File từ đường dẫn thư mục cha và tên file con.
  - `File(File parent, String child)`: Tạo đối tượng File từ đối tượng thư mục cha và tên file con.

### 1.4 Các phương thức kiểm tra, truy xuất thuộc tính và phân biệt đường dẫn
- **Các phương thức kiểm tra trạng thái:**
  - `boolean exists()`: Kiểm tra file hoặc thư mục có thực sự tồn tại trên ổ đĩa hay không.
  - `boolean isFile()`: Trả về `true` nếu là tập tin thông thường.
  - `boolean isDirectory()`: Trả về `true` nếu là thư mục.
  - `boolean canRead()` / `boolean canWrite()`: Kiểm tra quyền đọc và ghi.
  - `boolean isHidden()`: Kiểm tra xem file có bị ẩn theo thiết lập của hệ điều hành hay không.
- **Các phương thức truy xuất thông tin:**
  - `String getName()`: Lấy tên tập tin kèm phần mở rộng (ví dụ `"f1.txt"`).
  - `long length()`: Trả về **kích thước của file tính theo đơn vị byte**.
  - `long lastModified()`: Trả về dấu thời gian cập nhật lần cuối tính bằng mili-giây (thường bọc qua `new Date(f.lastModified())` để hiển thị).
- **Phân biệt `getAbsolutePath()` và `getCanonicalPath()`:**
  - `getAbsolutePath()`: Trả về chuỗi đường dẫn tuyệt đối bắt đầu từ gốc ổ đĩa, nhưng **vẫn giữ nguyên các ký hiệu tương đối** như `.` (thư mục hiện hành) và `..` (thư mục cha).
  - `getCanonicalPath()`: Trả về **đường dẫn chuẩn hóa duy nhất tuyệt đối** sau khi hệ điều hành đã giải quyết triệt để tất cả các dấu nối tương đối `.` và `..` cũng như các liên kết tượng trưng (symbolic links).

### 1.5 Duyệt cây thư mục và quy ước đường dẫn tương đối
- **Quy ước đường dẫn tương đối:**
  - `./` : Đại diện cho thư mục hiện hành (current folder).
  - `../` : Đại diện cho thư mục cha chứa thư mục hiện hành (father of current folder).
- **Phương thức duyệt thư mục `list()`:**
  Phương thức `String[] list()` trả về mảng chuỗi chứa tên của toàn bộ các tập tin và thư mục con nằm trực tiếp bên trong thư mục chỉ định.

```java
File f = new File("../BtCh10-IO");
if (f.isDirectory()) {
    String[] fileNames = f.list();
    for (int i = 0; i < fileNames.length; i++) {
        File subFile = new File(f, fileNames[i]);
        System.out.println(fileNames[i] + " là: " + (subFile.isFile() ? "Tập tin" : "Thư mục"));
    }
}
```

---

### BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 28 (KÈM LỜI GIẢI CHI TIẾT)

#### Bài 28.1: Giới hạn chức năng của lớp `java.io.File`
- **Đề bài:** Một lập trình viên viết đoạn mã sau để đọc văn bản từ file:
  ```java
  File f = new File("data.txt");
  String content = f.read(); // Dòng 2
  ```
  Tại sao Dòng 2 bị lỗi biên dịch? Lớp `java.io.File` có vai trò gì trong Java I/O?
- **Đáp án & Lời giải chi tiết:**
  - Lỗi biên dịch: `cannot find symbol method read() in class java.io.File`.
  - Lớp `File` chỉ quản lý các thông tin siêu dữ liệu (metadata) của file/thư mục (như kiểm tra file tồn tại qua `exists()`, kích thước qua `length()`, quyền đọc/ghi). Nó hoàn toàn không có phương thức `read()` hay `write()` để đọc/ghi nội dung bên trong file. Để đọc dữ liệu, lập trình viên bắt buộc phải sử dụng các luồng I/O Streams như `FileReader`, `BufferedReader`, hoặc `FileInputStream`.

#### Bài 28.2: Phân biệt `getAbsolutePath()` và `getCanonicalPath()`
- **Đề bài:** Cho đối tượng `File f = new File("./test/../demo.txt");`. Hãy giải thích sự khác biệt về mặt bản chất kết quả trả về giữa `f.getAbsolutePath()` và `f.getCanonicalPath()`.
- **Đáp án & Lời giải chi tiết:**
  - `f.getAbsolutePath()`: Trả về chuỗi đường dẫn tuyệt đối bắt đầu từ gốc ổ đĩa nhưng vẫn giữ nguyên các ký hiệu tương đối `.` và `..` (Ví dụ: `C:\project\.\test\..\demo.txt`).
  - `f.getCanonicalPath()`: Trả về đường dẫn chuẩn hóa duy nhất tuyệt đối sau khi hệ điều hành đã giải quyết triệt để tất cả các dấu nối tương đối `.` và `..` (Ví dụ chuẩn hóa thành: `C:\project\demo.txt`). Đồng thời `getCanonicalPath()` có thể ném ra `IOException` nếu phát sinh lỗi truy xuất hệ điều hành.

#### Bài 28.3: Kiểm tra tệp tin tồn tại và lấy kích thước byte
- **Đề bài:** Viết đoạn mã nhận vào đường dẫn `String path = "employees.txt"`. Sử dụng lớp `File` để kiểm tra: nếu file tồn tại và đúng là một tập tin thì in ra tên file và kích thước tính theo đơn vị byte. Nếu file không tồn tại, in ra `"File khong ton tai!"`.
- **Đáp án & Lời giải chi tiết:**
  ```java
  import java.io.File;

  public class CheckFile {
      public static void main(String[] args) {
          String path = "employees.txt";
          File f = new File(path);

          if (f.exists() && f.isFile()) {
              System.out.println("Tên file: " + f.getName());
              System.out.println("Kích thước: " + f.length() + " bytes");
          } else {
              System.out.println("File khong ton tai!");
          }
      }
  }
  ```

#### Bài 28.4: Lập trình liệt kê toàn bộ tập tin đuôi `.java` trong thư mục
- **Đề bài:** Cho đối tượng `File folder = new File("src");`. Hãy viết đoạn mã duyệt qua toàn bộ các mục con bên trong thư mục này và chỉ in ra màn hình tên của những tập tin có phần mở rộng kết thúc bằng `".java"`.
- **Đáp án & Lời giải chi tiết:**
  ```java
  import java.io.File;

  public class ListJavaFiles {
      public static void main(String[] args) {
          File folder = new File("src");
          if (folder.exists() && folder.isDirectory()) {
              String[] files = folder.list();
              if (files != null) {
                  for (String fileName : files) {
                      File item = new File(folder, fileName);
                      if (item.isFile() && fileName.endsWith(".java")) {
                          System.out.println("Java File: " + fileName);
                      }
                  }
              }
          }
      }
  }
  ```

#### Bài 28.5: Bản chất nén byte của chuẩn UTF-8
- **Đề bài:** Một file văn bản chỉ chứa đúng 3 ký tự tiếng Anh `"ABC"` được lưu bằng định dạng UTF-8. Một file khác chứa 3 ký tự tiếng Việt `"ÂÊÔ"` cũng lưu bằng UTF-8. Phương thức `file.length()` của hai file này có trả về cùng một giá trị kích thước byte không? Tại sao?
- **Đáp án & Lời giải chi tiết:**
  - Không cùng kích thước byte.
  - Chuẩn UTF-8 nén linh hoạt: các ký tự nằm trong bảng mã ASCII tiêu chuẩn (như `'A'`, `'B'`, `'C'`) chỉ chiếm đúng 1 byte cho mỗi ký tự, nên file `"ABC"` có kích thước đúng bằng 3 bytes.
  - Các ký tự Unicode đặc thù có dấu như `'Â'`, `'Ê'`, `'Ô'` được UTF-8 mã hóa nén thành từ 2 đến 3 bytes cho mỗi ký tự, nên file `"ÂÊÔ"` sẽ có kích thước từ 6 đến 9 bytes trên đĩa cứng.

---

# SLOT 29: LUỒNG KÝ TỰ (CHARACTER STREAMS) & XỬ LÝ TẬP TIN VĂN BẢN

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

---

### BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 29 (KÈM LỜI GIẢI CHI TIẾT)

#### Bài 29.1: Giá trị kết thúc tập tin của `read()` và `readLine()`
- **Đề bài:** Phương thức `read()` của `FileReader` và phương thức `readLine()` của `BufferedReader` trả về giá trị gì khi con trỏ đọc chạm tới cuối tập tin (End of File - EOF)? 
- **Đáp án & Lời giải chi tiết:**
  - `read()` (đọc từng ký tự): Trả về giá trị số nguyên `-1` khi chạm cuối file (vì mã Unicode ký tự hợp lệ luôn là số nguyên không âm `>= 0`).
  - `readLine()` (đọc từng dòng): Trả về giá trị tham chiếu `null` khi chạm cuối file.

#### Bài 29.2: Chế độ Append khi khởi tạo `FileWriter`
- **Đề bài:** Cho file `items.txt` đang có sẵn 2 dòng dữ liệu. Xét đoạn mã:
  ```java
  File f = new File("items.txt");
  FileWriter fw = new FileWriter(f); // Dòng 2
  PrintWriter pw = new PrintWriter(fw);
  pw.println("I003");
  pw.close();
  fw.close();
  ```
  Sau khi đoạn mã trên thực thi, file `items.txt` sẽ có bao nhiêu dòng? Hãy sửa Dòng 2 để dữ liệu mới được nối thêm vào sau 2 dòng cũ mà không làm mất nội dung trước đó.
- **Đáp án & Lời giải chi tiết:**
  - File `items.txt` sẽ chỉ còn lại duy nhất 1 dòng chứa `"I003"`. Vì `new FileWriter(f)` mặc định chạy ở chế độ ghi đè (`append = false`), toàn bộ nội dung cũ đã bị xóa sạch.
  - Sửa lại: `FileWriter fw = new FileWriter(f, true);` (bật cờ `append = true` để giữ nguyên dữ liệu cũ).

#### Bài 29.3: Bóc tách dữ liệu dòng CSV (Case study `EmpList.java`)
- **Đề bài:** Tập tin `employees.txt` lưu thông tin nhân viên theo từng dòng định dạng: `code,name,salary` (Ví dụ: `"E001,HOANG VAN TUAN,150"`). Hãy viết một phương thức `public static void readEmployees(String filename)` đọc file trên, tách các trường dữ liệu và in ra màn hình dạng: `"Mã: E001 - Tên: HOANG VAN TUAN - Lương: 150"`.
- **Đáp án & Lời giải chi tiết:**
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

#### Bài 29.4: Tầm quan trọng của `flush()` và `close()`
- **Đề bài:** Một lập trình viên sử dụng `PrintWriter` để ghi 10 dòng chữ vào file nhưng quên gọi lệnh `close()` hoặc `flush()` ở cuối chương trình. Khi mở file ra kiểm tra thì thấy file hoàn toàn rỗng. Hãy giải thích nguyên nhân kỹ thuật của hiện tượng này.
- **Đáp án & Lời giải chi tiết:**
  - Java sử dụng cơ chế vùng đệm xuất (output buffer) trong RAM để gom dữ liệu trước khi ghi xuống đĩa cứng. Lệnh `flush()` hoặc `close()` có nhiệm vụ đẩy toàn bộ dữ liệu từ bộ đệm RAM xuống đĩa từ vật lý. Nếu không gọi `flush()` hoặc `close()`, và chương trình dừng trước khi bộ đệm tự đầy, dữ liệu còn đọng lại trong RAM sẽ bị hủy bỏ, khiến tập tin trên ổ cứng vẫn rỗng.

#### Bài 29.5: Đọc tập tin văn bản tiếng Việt UTF-8 không bị lỗi phông
- **Đề bài:** Viết đoạn mã hoàn chỉnh đọc nội dung tập tin văn bản tiếng Việt `"thongbao.txt"` (định dạng UTF-8) sử dụng bộ ba `FileInputStream`, `InputStreamReader`, và `BufferedReader` theo đúng slide bài học để bảo đảm ký tự tiếng Việt có dấu hiển thị chuẩn xác ra console.
- **Đáp án & Lời giải chi tiết:**
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

---

# SLOT 30: LUỒNG NHỊ PHÂN, `RandomAccessFile` & TUẦN TỰ HÓA ĐỐI TƯỢNG (SERIALIZATION)

### 3.1 Luồng Byte Cấp thấp vs Luồng Byte Cấp cao
1. **Luồng cấp thấp (Low-Level Binary Streams):**
   - Đại diện tiêu biểu: `FileInputStream` và `FileOutputStream`.
   - Đơn vị xử lý: Từng byte vật lý 8-bit riêng lẻ.
   - Thích hợp cho các tệp nhị phân thô như hình ảnh (`.png`, `.jpg`), âm thanh, tệp nén.
2. **Luồng cấp cao (High-Level Binary Streams):**
   - Đại diện tiêu biểu: `DataInputStream` và `DataOutputStream`.
   - Bao bọc một luồng cấp thấp:
     ```java
     FileOutputStream fos = new FileOutputStream("data.dat");
     DataOutputStream dos = new DataOutputStream(fos);
     ```
   - Hỗ trợ ghi/đọc trực tiếp các kiểu dữ liệu nguyên thủy: `writeInt(n)`, `writeDouble(x)`, `writeBoolean(b)`, `writeUTF(s)` và `readInt()`, `readDouble()`, `readBoolean()`, `readUTF()`.
   - Cơ chế: Tự động phân tách một số (ví dụ `int` chiếm 4 bytes) thành các byte riêng biệt để ghi xuống đĩa và ghép lại khi đọc.

### 3.2 Lớp truy xuất ngẫu nhiên `java.io.RandomAccessFile`
- **Đặc điểm độc lập:** Lớp `RandomAccessFile` không thuộc cây phân cấp `InputStream`, `OutputStream`, `Reader` hay `Writer`. Nó tích hợp đồng thời cả khả năng đọc và ghi trên cùng một tập tin.
- **Con trỏ tập tin (File Pointer) & Phương thức `seek()`:**
  - Quản lý một con trỏ chỉ vị trí byte hiện tại.
  - Phương thức `seek(long pos)` cho phép di chuyển con trỏ tự do tới bất kỳ vị trí byte nào trong file để đọc/ghi ngẫu nhiên mà không cần duyệt tuần tự từ đầu file.
- **Các chế độ mở file (Modes):**
  - `"r"`: Mở chỉ để đọc (Read-only).
  - `"rw"`: Mở để vừa đọc vừa ghi (Read and Write).
  - `"rws"`: Giống `"rw"`, đồng thời đồng bộ cưỡng chế cả nội dung lẫn siêu dữ liệu xuống đĩa vật lý ngay lập tức.
  - `"rwd"`: Giống `"rw"`, đồng bộ cưỡng chế nội dung ngay lập tức.

```java
RandomAccessFile f = new RandomAccessFile("demo.dat", "rw");
f.writeInt(1234);
f.writeDouble(37.456);

// Kéo con trỏ về đầu file để đọc
f.seek(0);
System.out.println(f.readInt());
System.out.println(f.readDouble());
f.close();
```

### 3.3 Bản chất của Tuần tự hóa (Serialization) và Giải tuần tự hóa (Deserialization)

![Minh họa đọc ghi danh sách đối tượng Object Stream](/media/pro192/images/IO.18A.gif)

- **Serialization (Tuần tự hóa):** Là quá trình chuyển đổi toàn bộ trạng thái dữ liệu của một đối tượng trong bộ nhớ RAM thành một chuỗi byte tuần tự (`byte stream`) để lưu xuống đĩa hoặc truyền qua mạng. Sử dụng lớp **`java.io.ObjectOutputStream`** với phương thức `writeObject(Object obj)`.
- **Deserialization (Giải tuần tự hóa):** Là quá trình đọc chuỗi byte từ nguồn lưu trữ để tái tạo lại đối tượng nguyên vẹn trên vùng nhớ Heap. Sử dụng lớp **`java.io.ObjectInputStream`** với phương thức `readObject()`.

### 3.4 Marker Interface `java.io.Serializable` và các thành phần bị loại trừ
- **Marker Interface `Serializable`:**
  - Một đối tượng chỉ có thể tuần tự hóa nếu lớp của nó khai báo `implements java.io.Serializable`.
  - Đây là một interface đánh dấu (rỗng, không chứa phương thức), dùng để cấp phép cho JVM đóng gói dữ liệu. Nếu cố tình tuần tự hóa lớp không cài đặt interface này, JVM sẽ ném ra `java.io.NotSerializableException`.
- **Các thành phần không được ghi xuống tệp:**
  1. **Biến tĩnh (`static`):** Thuộc về lớp trong vùng nhớ Class/Method Area, không thuộc về trạng thái riêng của đối tượng.
  2. **Biến đánh dấu `transient`:** Bị bỏ qua hoàn toàn trong quá trình tuần tự hóa (dùng cho mật khẩu, dữ liệu nhạy cảm hoặc dữ liệu tính toán tạm thời). Khi giải tuần tự hóa, các trường `transient` được gán về giá trị mặc định (`null`, `0`, `false`).

> [!TIP]
> **Best Practice: Khai báo `serialVersionUID`:**
> Khi cài đặt `Serializable`, nên khai báo hằng số `private static final long serialVersionUID = 1L;` để tránh `InvalidClassException` nếu sau này bạn thêm/sửa nhẹ cấu trúc lớp mà vẫn cần đọc lại file `.dat` cũ.

### 3.5 Cảnh báo lỗi StreamCorruptedException & Mẫu xử lý qua RAM
- **Cảnh báo lỗi ghi nối đuôi file nhị phân:** Không thể mở file đối tượng ở chế độ `append = true` với `ObjectOutputStream`.
- **Nguyên nhân kỹ thuật:** Mỗi khi tạo một `ObjectOutputStream`, Java tự động ghi một tiêu đề nhận diện luồng (**Stream Header**, gồm 4 bytes `STREAM_MAGIC` và `STREAM_VERSION`) vào đầu luồng. Nếu mở file chế độ append, một Stream Header mới sẽ bị chèn vào giữa thân file. Khi `ObjectInputStream` đọc lại tới vị trí này, JVM sẽ phát hiện cấu trúc tiêu đề bị chắp vá và ném ngoại lệ **`java.io.StreamCorruptedException`**.
- **Giải pháp chuẩn:** Đọc toàn bộ danh sách đối tượng lên bộ nhớ RAM (vào `List` hoặc `Vector`), thực hiện thêm/sửa/xóa trên RAM, và khi lưu thì **ghi đè lại toàn bộ tệp tin một lần duy nhất**.

---

### BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 30 (KÈM LỜI GIẢI CHI TIẾT)

#### Bài 30.1: Vai trò của Marker Interface `Serializable`
- **Đề bài:** Cho lớp sau:
  ```java
  public class Account {
      private String username;
      private String password;
      public Account(String u, String p) { username = u; password = p; }
  }
  ```
  Nếu bạn thực hiện lệnh `oos.writeObject(new Account("admin", "123"));` sử dụng `ObjectOutputStream`, chương trình có chạy thành công không? Nếu có lỗi, hãy nêu tên ngoại lệ phát sinh và cách khắc phục.
- **Đáp án & Lời giải chi tiết:**
  - Chương trình ném ra ngoại lệ: `java.io.NotSerializableException: Account`.
  - Nguyên nhân: Lớp `Account` chưa cấp quyền tuần tự hóa vì không cài đặt giao diện `java.io.Serializable`.
  - Cách sửa: Khai báo lớp cài đặt interface đánh dấu:
    ```java
    public class Account implements java.io.Serializable { ... }
    ```

#### Bài 30.2: Tác dụng của từ khóa `transient` và giá trị sau khi Deserialization
- **Đề bài:** Cho lớp `User`:
  ```java
  public class User implements java.io.Serializable {
      private String name = "Hoang";
      private transient String secretPin = "9999";
  }
  ```
  Sau khi đối tượng này được tuần tự hóa xuống file `user.dat`, rồi được đọc lại bằng `ObjectInputStream.readObject()`, giá trị của thuộc tính `secretPin` trên đối tượng mới được khôi phục là gì? Giải thích lý do.
- **Đáp án & Lời giải chi tiết:**
  - Giá trị của `secretPin` sau khi đọc lại là `null`.
  - Từ khóa `transient` đánh dấu trường dữ liệu bị bỏ qua hoàn toàn trong quá trình tuần tự hóa, chuỗi `"9999"` không được lưu xuống đĩa. Khi giải tuần tự hóa để khôi phục đối tượng trên Heap, trường này nhận giá trị mặc định của kiểu tham chiếu đối tượng là `null`.

#### Bài 30.3: Con trỏ tập tin và phương thức `seek()` trong `RandomAccessFile`
- **Đề bài:** Xét đoạn mã sau:
  ```java
  RandomAccessFile raf = new RandomAccessFile("data.bin", "rw");
  raf.writeInt(100);
  raf.writeInt(200);
  int val = raf.readInt(); // Dòng 5
  ```
  Tại sao Dòng 5 lại ném ra ngoại lệ `java.io.EOFException`? Cần thêm dòng lệnh nào ngay trước Dòng 5 để đọc được con số `100`?
- **Đáp án & Lời giải chi tiết:**
  - Sau khi ghi hai số `int` (tổng cộng 8 bytes), con trỏ file đang nằm ở cuối tập tin. Lệnh `readInt()` yêu cầu đọc tiếp 4 bytes phía sau cuối file dẫn đến ngoại lệ `EOFException`.
  - Cách sửa: Kéo con trỏ file quay về vị trí byte số 0:
    ```java
    raf.seek(0);
    int val = raf.readInt(); // Đọc ra số 100 thành công
    ```

#### Bài 30.4: Phân biệt `DataOutputStream` và `ObjectOutputStream`
- **Đề bài:** Hãy phân biệt mục đích sử dụng và kiểu dữ liệu tham số của phương thức ghi giữa hai lớp luồng nhị phân cấp cao: `java.io.DataOutputStream` và `java.io.ObjectOutputStream`.
- **Đáp án & Lời giải chi tiết:**
  - `DataOutputStream`: Dùng để ghi các kiểu dữ liệu nguyên thủy (`int`, `double`, `boolean`) và chuỗi UTF qua các phương thức `writeInt()`, `writeDouble()`, `writeUTF()`. Nó không có khả năng tự động đóng gói trạng thái của một đối tượng phức tạp.
  - `ObjectOutputStream`: Dùng để tuần tự hóa và ghi toàn bộ một thực thể đối tượng hoàn chỉnh qua phương thức `writeObject(Object obj)`.

#### Bài 30.5: Quy trình Đọc - Ghi danh sách đối tượng (Case study `BookManager`)
- **Đề bài:** Cho lớp `Book implements Serializable` có 2 thuộc tính `String title; int price;`. Hãy viết 2 phương thức:
  1. `public static void saveBooks(String filename, List<Book> list)`: Ghi danh sách sách vào file nhị phân bằng `ObjectOutputStream`.
  2. `public static List<Book> loadBooks(String filename)`: Đọc và trả về danh sách sách từ file bằng `ObjectInputStream`.
- **Đáp án & Lời giải chi tiết:**
  ```java
  import java.io.*;
  import java.util.ArrayList;
  import java.util.List;

  public class BookIODemo {
      // 1. Ghi danh sách đối tượng
      public static void saveBooks(String filename, List<Book> list) {
          try {
              FileOutputStream fos = new FileOutputStream(filename);
              ObjectOutputStream oos = new ObjectOutputStream(fos);
              for (Book b : list) {
                  oos.writeObject(b);
              }
              oos.close();
              fos.close();
              System.out.println("Lưu sách thành công!");
          } catch (Exception e) {
              System.out.println("Lỗi lưu file: " + e.getMessage());
          }
      }

      // 2. Đọc danh sách đối tượng
      public static List<Book> loadBooks(String filename) {
          List<Book> list = new ArrayList<>();
          File f = new File(filename);
          if (!f.exists()) return list;

          try {
              FileInputStream fis = new FileInputStream(f);
              ObjectInputStream ois = new ObjectInputStream(fis);
              try {
                  while (true) {
                      Book b = (Book) ois.readObject();
                      list.add(b);
                  }
              } catch (EOFException eof) {
                  // Đã chạm cuối file, kết thúc vòng lặp bình thường
              }
              ois.close();
              fis.close();
          } catch (Exception e) {
              System.out.println("Lỗi đọc file: " + e.getMessage());
          }
          return list;
      }
  }
  ```

---

## Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Java IO Basis](../java/io/io-basis.md) · [IO Design Patterns (Decorator)](../java/io/io-design-patterns.md) · [Java Serialization](../java/basis/serialization.md) · [Java Basics Part 3 (try-with-resources)](../java/basis/java-basic-questions-03.md)
- **Slide & PDF gốc offline:** [File IO.pdf](/media/pro192/resources/File%20IO.pdf) · [File IO.pptx](/media/pro192/slides/File%20IO.pptx)
