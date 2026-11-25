---
slot: 30
stage: 8
title: "Slot 30: Luồng Nhị phân, RandomAccessFile & Tuần tự hóa (Serialization)"
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

# Slot 30: Luồng Nhị phân, RandomAccessFile & Tuần tự hóa (Serialization)

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 8: File I/O Streams, Character/Byte Streams & Serialization
- **Trọng tâm thi:** `Thi FE` `Thực chiến` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/File%20IO.pdf) · [Slide PPTX](/media/pro192/slides/File%20IO.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt Low-level (`FileInputStream`) vs High-level (`DataInputStream` cho primitive, `ObjectInputStream` cho Object).
- Sử dụng `RandomAccessFile` với `seek(pos)` đọc/ghi ngẫu nhiên và tránh `EOFException`.
- Cài đặt `Serializable`, `serialVersionUID`, `transient` và hiểu nguyên nhân lỗi `StreamCorruptedException`.

## 2. Lý thuyết cốt lõi

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

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 30:**
> - Không được mở `ObjectOutputStream` ở chế độ `append = true` nối đuôi file nhị phân có sẵn vì sẽ chèn Stream Header mới vào giữa file gây **`StreamCorruptedException`** khi đọc lại.
> - Thuộc tính `static` và `transient` đều **không được tuần tự hóa**; khi đọc lại trên Heap, trường `transient` nhận giá trị mặc định (`null` / `0` / `false`).

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 30.1: Vai trò của Marker Interface `Serializable`

**Đề bài:** Cho lớp sau:
```java
public class Account {
    private String username;
    private String password;
    public Account(String u, String p) { username = u; password = p; }
}
```
Nếu bạn thực hiện lệnh `oos.writeObject(new Account("admin", "123"));` sử dụng `ObjectOutputStream`, chương trình có chạy thành công không? Nếu có lỗi, hãy nêu tên ngoại lệ phát sinh và cách khắc phục.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Chương trình ném ra ngoại lệ: `java.io.NotSerializableException: Account`.
- Nguyên nhân: Lớp `Account` chưa cấp quyền tuần tự hóa vì không cài đặt giao diện `java.io.Serializable`.
- Cách sửa: Khai báo lớp cài đặt interface đánh dấu:
  ```java
  public class Account implements java.io.Serializable { ... }
  ```

</details>

---

### Bài 30.2: Tác dụng của từ khóa `transient` và giá trị sau khi Deserialization

**Đề bài:** Cho lớp `User`:
```java
public class User implements java.io.Serializable {
    private String name = "Hoang";
    private transient String secretPin = "9999";
}
```
Sau khi đối tượng này được tuần tự hóa xuống file `user.dat`, rồi được đọc lại bằng `ObjectInputStream.readObject()`, giá trị của thuộc tính `secretPin` trên đối tượng mới được khôi phục là gì? Giải thích lý do.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Giá trị của `secretPin` sau khi đọc lại là `null`.
- Từ khóa `transient` đánh dấu trường dữ liệu bị bỏ qua hoàn toàn trong quá trình tuần tự hóa, chuỗi `"9999"` không được lưu xuống đĩa. Khi giải tuần tự hóa để khôi phục đối tượng trên Heap, trường này nhận giá trị mặc định của kiểu tham chiếu đối tượng là `null`.

</details>

---

### Bài 30.3: Con trỏ tập tin và phương thức `seek()` trong `RandomAccessFile`

**Đề bài:** Xét đoạn mã sau:
```java
RandomAccessFile raf = new RandomAccessFile("data.bin", "rw");
raf.writeInt(100);
raf.writeInt(200);
int val = raf.readInt(); // Dòng 5
```
Tại sao Dòng 5 lại ném ra ngoại lệ `java.io.EOFException`? Cần thêm dòng lệnh nào ngay trước Dòng 5 để đọc được con số `100`?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Sau khi ghi hai số `int` (tổng cộng 8 bytes), con trỏ file đang nằm ở cuối tập tin. Lệnh `readInt()` yêu cầu đọc tiếp 4 bytes phía sau cuối file dẫn đến ngoại lệ `EOFException`.
- Cách sửa: Kéo con trỏ file quay về vị trí byte số 0:
  ```java
  raf.seek(0);
  int val = raf.readInt(); // Đọc ra số 100 thành công
  ```

</details>

---

### Bài 30.4: Phân biệt `DataOutputStream` và `ObjectOutputStream`

**Đề bài:** Hãy phân biệt mục đích sử dụng và kiểu dữ liệu tham số của phương thức ghi giữa hai lớp luồng nhị phân cấp cao: `java.io.DataOutputStream` và `java.io.ObjectOutputStream`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- `DataOutputStream`: Dùng để ghi các kiểu dữ liệu nguyên thủy (`int`, `double`, `boolean`) và chuỗi UTF qua các phương thức `writeInt()`, `writeDouble()`, `writeUTF()`. Nó không có khả năng tự động đóng gói trạng thái của một đối tượng phức tạp.
- `ObjectOutputStream`: Dùng để tuần tự hóa và ghi toàn bộ một thực thể đối tượng hoàn chỉnh qua phương thức `writeObject(Object obj)`.

</details>

---

### Bài 30.5: Quy trình Đọc - Ghi danh sách đối tượng (Case study `BookManager`)

**Đề bài:** Cho lớp `Book implements Serializable` có 2 thuộc tính `String title; int price;`. Hãy viết 2 phương thức:
1. `public static void saveBooks(String filename, List<Book> list)`: Ghi danh sách sách vào file nhị phân bằng `ObjectOutputStream`.
2. `public static List<Book> loadBooks(String filename)`: Đọc và trả về danh sách sách từ file bằng `ObjectInputStream`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

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

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Cơ chế Serialization & `serialVersionUID` trong Java](../../java/basis/serialization.md) · [Nền tảng Java I/O (Byte Streams & Character Streams)](../../java/io/io-basis.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/File%20IO.pdf) · [PPTX](/media/pro192/slides/File%20IO.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (20 ảnh)</summary>

![Sơ đồ Slot 30: IO.13](/media/pro192/images/IO.13.gif)

![Sơ đồ Slot 30: IO.14](/media/pro192/images/IO.14.gif)

![Sơ đồ Slot 30: IO.15A](/media/pro192/images/IO.15A.gif)

![Sơ đồ Slot 30: IO.15B](/media/pro192/images/IO.15B.gif)

![Sơ đồ Slot 30: IO.15C](/media/pro192/images/IO.15C.gif)

![Sơ đồ Slot 30: IO.15D](/media/pro192/images/IO.15D.gif)

![Sơ đồ Slot 30: IO.15E](/media/pro192/images/IO.15E.gif)

![Sơ đồ Slot 30: IO.15F](/media/pro192/images/IO.15F.gif)

![Sơ đồ Slot 30: IO.15G](/media/pro192/images/IO.15G.gif)

![Sơ đồ Slot 30: IO.16](/media/pro192/images/IO.16.gif)

![Sơ đồ Slot 30: IO.17](/media/pro192/images/IO.17.gif)

![Sơ đồ Slot 30: IO.18A](/media/pro192/images/IO.18A.gif)

![Sơ đồ Slot 30: IO.18B](/media/pro192/images/IO.18B.gif)

![Sơ đồ Slot 30: IO.18C](/media/pro192/images/IO.18C.gif)

![Sơ đồ Slot 30: IO.18D](/media/pro192/images/IO.18D.gif)

![Sơ đồ Slot 30: IO.18E](/media/pro192/images/IO.18E.gif)

![Sơ đồ Slot 30: IO.18F](/media/pro192/images/IO.18F.gif)

![Sơ đồ Slot 30: IO.18G](/media/pro192/images/IO.18G.gif)

![Sơ đồ Slot 30: IO.18H](/media/pro192/images/IO.18H.gif)

![Sơ đồ Slot 30: IO.18I](/media/pro192/images/IO.18I.gif)

</details>

---

**Điều hướng:** [← Slot 29](./slot-29.md) | [Mục lục PRO192](../README.md) | [Kho Đề PE →](../pe-challenges.md)
