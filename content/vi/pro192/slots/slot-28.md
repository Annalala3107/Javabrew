---
slot: 28
stage: 8
title: "Slot 28: Tổng quan I/O Streams, java.io.File & Thao tác Thư mục"
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

# Slot 28: Tổng quan I/O Streams, java.io.File & Thao tác Thư mục

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 8: File I/O Streams, Character/Byte Streams & Serialization
- **Trọng tâm thi:** `Thi FE` `Thực chiến` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/File%20IO.pdf) · [Slide PPTX](/media/pro192/slides/File%20IO.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt hướng luồng InputStream / OutputStream (Byte) vs Reader / Writer (Character) và bảng mã UTF-8.
- Hiểu lớp `java.io.File` chỉ đại diện cho metadata/đường dẫn chứ **không đọc/ghi nội dung tệp**.
- Sử dụng `exists()`, `isFile()`, `isDirectory()`, `listFiles()` và phân biệt `getAbsolutePath()` vs `getCanonicalPath()`.

## 2. Lý thuyết cốt lõi

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

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 28:**
> - Bẫy FE: Gọi `new File("data.txt")` **KHÔNG tự động tạo ra file vật lý trên ổ đĩa** (phải gọi `createNewFile()` hoặc mở bằng Stream ghi mới tạo).
> - `getCanonicalPath()` tự động chuẩn hóa bỏ `..` và `.`, trong khi `getAbsolutePath()` giữ nguyên chuỗi tương đối ghép thêm.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 28.1: Giới hạn chức năng của lớp `java.io.File`

**Đề bài:** Một lập trình viên viết đoạn mã sau để đọc văn bản từ file:
```java
File f = new File("data.txt");
String content = f.read(); // Dòng 2
```
Tại sao Dòng 2 bị lỗi biên dịch? Lớp `java.io.File` có vai trò gì trong Java I/O?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Lỗi biên dịch: `cannot find symbol method read() in class java.io.File`.
- Lớp `File` chỉ quản lý các thông tin siêu dữ liệu (metadata) của file/thư mục (như kiểm tra file tồn tại qua `exists()`, kích thước qua `length()`, quyền đọc/ghi). Nó hoàn toàn không có phương thức `read()` hay `write()` để đọc/ghi nội dung bên trong file. Để đọc dữ liệu, lập trình viên bắt buộc phải sử dụng các luồng I/O Streams như `FileReader`, `BufferedReader`, hoặc `FileInputStream`.

</details>

---

### Bài 28.2: Phân biệt `getAbsolutePath()` và `getCanonicalPath()`

**Đề bài:** Cho đối tượng `File f = new File("./test/../demo.txt");`. Hãy giải thích sự khác biệt về mặt bản chất kết quả trả về giữa `f.getAbsolutePath()` và `f.getCanonicalPath()`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- `f.getAbsolutePath()`: Trả về chuỗi đường dẫn tuyệt đối bắt đầu từ gốc ổ đĩa nhưng vẫn giữ nguyên các ký hiệu tương đối `.` và `..` (Ví dụ: `C:\project\.\test\..\demo.txt`).
- `f.getCanonicalPath()`: Trả về đường dẫn chuẩn hóa duy nhất tuyệt đối sau khi hệ điều hành đã giải quyết triệt để tất cả các dấu nối tương đối `.` và `..` (Ví dụ chuẩn hóa thành: `C:\project\demo.txt`). Đồng thời `getCanonicalPath()` có thể ném ra `IOException` nếu phát sinh lỗi truy xuất hệ điều hành.

</details>

---

### Bài 28.3: Kiểm tra tệp tin tồn tại và lấy kích thước byte

**Đề bài:** Viết đoạn mã nhận vào đường dẫn `String path = "employees.txt"`. Sử dụng lớp `File` để kiểm tra: nếu file tồn tại và đúng là một tập tin thì in ra tên file và kích thước tính theo đơn vị byte. Nếu file không tồn tại, in ra `"File khong ton tai!"`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

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

</details>

---

### Bài 28.4: Lập trình liệt kê toàn bộ tập tin đuôi `.java` trong thư mục

**Đề bài:** Cho đối tượng `File folder = new File("src");`. Hãy viết đoạn mã duyệt qua toàn bộ các mục con bên trong thư mục này và chỉ in ra màn hình tên của những tập tin có phần mở rộng kết thúc bằng `".java"`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

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

</details>

---

### Bài 28.5: Bản chất nén byte của chuẩn UTF-8

**Đề bài:** Một file văn bản chỉ chứa đúng 3 ký tự tiếng Anh `"ABC"` được lưu bằng định dạng UTF-8. Một file khác chứa 3 ký tự tiếng Việt `"ÂÊÔ"` cũng lưu bằng UTF-8. Phương thức `file.length()` của hai file này có trả về cùng một giá trị kích thước byte không? Tại sao?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Không cùng kích thước byte.
- Chuẩn UTF-8 nén linh hoạt: các ký tự nằm trong bảng mã ASCII tiêu chuẩn (như `'A'`, `'B'`, `'C'`) chỉ chiếm đúng 1 byte cho mỗi ký tự, nên file `"ABC"` có kích thước đúng bằng 3 bytes.
- Các ký tự Unicode đặc thù có dấu như `'Â'`, `'Ê'`, `'Ô'` được UTF-8 mã hóa nén thành từ 2 đến 3 bytes cho mỗi ký tự, nên file `"ÂÊÔ"` sẽ có kích thước từ 6 đến 9 bytes trên đĩa cứng.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 28A: Create/Delete Files — Tạo & Kiểm tra File bằng `java.io.File`
- **Mục tiêu:** Tạo tệp tạm trong thư mục `java.io.tmpdir`, kiểm tra `exists()` + `getName()`, sau đó dọn sạch bằng `delete()`.
- **Expected Output:**
  - `Exists before delete: true`
  - `Exists after delete : false`

```java
import java.io.File;

public class Main {
    public static void main(String[] args) throws Exception {
        File f = new File(System.getProperty("java.io.tmpdir"), "jb_demo28.txt");
        // TODO: Goi f.createNewFile(), in exists(), sau do goi f.delete() va in lai exists()
        System.out.println("Exists before delete: " + f.exists());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 28A)</summary>

```java
import java.io.File;

public class Main {
    public static void main(String[] args) throws Exception {
        File f = new File(System.getProperty("java.io.tmpdir"), "jb_demo28.txt");
        f.createNewFile();
        System.out.println("Exists before delete: " + f.exists());
        f.delete();
        System.out.println("Exists after delete : " + f.exists());
    }
}
```

* **Giải thích:** Nhớ: chỉ gọi `new File(...)` **chưa hề tạo file thật trên ổ đĩa**; phải gọi `createNewFile()` hoặc mở bằng Stream ghi.

</details>

---

#### 🟡 Thực hành 28B: Directory Inspection — Tạo Thư mục Con `mkdirs()` & Duyệt `listFiles()`
- **Mục tiêu:** Tạo thư mục tạm chứa 2 tệp mẫu, liệt kê tên tệp bằng `dir.listFiles()`, rồi xóa gọn toàn bộ.
- **Expected Output:**
  - `Files in dir: a.txt, b.txt`
- 🔗 [Mở bài lab Slot 28 trên JavaBrew Live Lab](/studio/playground?example=slot-28-lab)

```java
import java.io.File;

public class Main {
    public static void main(String[] args) throws Exception {
        File dir = new File(System.getProperty("java.io.tmpdir"), "jb_slot28_dir");
        dir.mkdirs();
        File a = new File(dir, "a.txt");
        File b = new File(dir, "b.txt");
        a.createNewFile();
        b.createNewFile();

        // TODO: Dung dir.listFiles() de in ten cac file trong dir
        a.delete();
        b.delete();
        dir.delete();
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 28B)</summary>

```java
import java.io.File;

public class Main {
    public static void main(String[] args) throws Exception {
        File dir = new File(System.getProperty("java.io.tmpdir"), "jb_slot28_dir");
        dir.mkdirs();
        File a = new File(dir, "a.txt");
        File b = new File(dir, "b.txt");
        a.createNewFile();
        b.createNewFile();

        File[] children = dir.listFiles();
        if (children != null) {
            for (File child : children) {
                System.out.println("File: " + child.getName() + " (isFile=" + child.isFile() + ")");
            }
        }

        a.delete();
        b.delete();
        dir.delete();
    }
}
```

* **Giải thích:** `dir.delete()` chỉ xóa được thư mục khi bên trong **hoàn toàn rỗng**, nên ta luôn phải xóa từng file con trước.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Nền tảng Java I/O (Byte Streams & Character Streams)](../../java/io/io-basis.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/File%20IO.pdf) · [PPTX](/media/pro192/slides/File%20IO.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (16 ảnh)</summary>

![Sơ đồ Slot 28: ioexample](/media/pro192/images/ioexample.png)

![Sơ đồ Slot 28: IO.01](/media/pro192/images/IO.01.gif)

![Sơ đồ Slot 28: IO.02](/media/pro192/images/IO.02.gif)

![Sơ đồ Slot 28: IO.03](/media/pro192/images/IO.03.gif)

![Sơ đồ Slot 28: IO.04](/media/pro192/images/IO.04.gif)

![Sơ đồ Slot 28: IO.05](/media/pro192/images/IO.05.gif)

![Sơ đồ Slot 28: IO.06](/media/pro192/images/IO.06.gif)

![Sơ đồ Slot 28: IO.07](/media/pro192/images/IO.07.gif)

![Sơ đồ Slot 28: IO.08](/media/pro192/images/IO.08.gif)

![Sơ đồ Slot 28: IO.09A](/media/pro192/images/IO.09A.gif)

![Sơ đồ Slot 28: IO.09B](/media/pro192/images/IO.09B.gif)

![Sơ đồ Slot 28: IO.09C](/media/pro192/images/IO.09C.gif)

![Sơ đồ Slot 28: IO.09D](/media/pro192/images/IO.09D.gif)

![Sơ đồ Slot 28: IO.09E](/media/pro192/images/IO.09E.gif)

![Sơ đồ Slot 28: IO.10](/media/pro192/images/IO.10.gif)

![Sơ đồ Slot 28: IO.11](/media/pro192/images/IO.11.gif)

</details>

---

**Điều hướng:** [← Slot 27](./slot-27.md) | [Mục lục PRO192](../README.md) | [Slot 29 →](./slot-29.md)
