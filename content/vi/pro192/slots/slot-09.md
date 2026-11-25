---
slot: 9
stage: 2
title: "Slot 09: Xử lý Chuỗi (String Pool, StringBuilder/StringBuffer) & Scanner"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q1/Q2/Q4)"
  - "Thi FE"
estimatedMinutes: 30
slidePdf: "/media/pro192/resources/Numbers%20and%20Strings.pdf"
slidePptx: "/media/pro192/slides/Numbers%20and%20Strings.pptx"
peRefs:
  - "PE1-Q1"
  - "PE1-Q4"
  - "PE2-Q1"
  - "PE3-Q1"
  - "PE3-Q4"
  - "PE4-Q1"
  - "PE4-Q4"
  - "PE5-Q1"
  - "PE5-Q4"
---

# Slot 09: Xử lý Chuỗi (String Pool, StringBuilder/StringBuffer) & Scanner

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 2: Quản lý Bộ nhớ, Wrapper/Math & Chuỗi String/Scanner
- **Trọng tâm thi:** `Thi PE (Q1/Q2/Q4)` `Thi FE` | **Thời lượng gợi ý:** ~30 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Numbers%20and%20Strings.pdf) · [Slide PPTX](/media/pro192/slides/Numbers%20and%20Strings.pptx)
- **Liên kết đề PE thật:** `PE1-Q1` · `PE1-Q4` · `PE2-Q1` · `PE3-Q1` · `PE3-Q4` · `PE4-Q1` · `PE4-Q4` · `PE5-Q1` · `PE5-Q4` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu tính bất biến (immutability) của `String`, String Pool, và phân biệt rạch ròi `==` với `equals()`.
- Sử dụng `StringBuilder` cho biến đổi chuỗi (`reverse()`, `replace()`, `insert()`) trong Q2/Q4 đề PE.
- Làm chủ `split("\s+")`, `trim()`, `String.format("%.2f")` và xử lý sạch bộ đệm `Scanner` (`nextLine()` sau `nextInt()`).

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Numbers and Strings.pptx` (từ slide *Strings* đến slide *Using java.util.Scanner* và *Formatting*).

### 4.1. Bản chất của lớp `java.lang.String` & Tính bất biến
Trong Java, chuỗi ký tự không phải là mảng ký tự nguyên thủy đơn thuần như trong C, mà là một thực thể đối tượng thuộc lớp `java.lang.String`.
* Khai báo lớp: `public final class String extends Object implements Serializable, Comparable<String>, CharSequence`. Từ khóa `final` ngăn cản việc kế thừa từ `String`.
* **Tính bất biến (Immutable):** Một đối tượng `String` khi đã được tạo ra trong bộ nhớ thì không thể bị sửa đổi nội dung. Mọi phương thức thao tác chuỗi (như `concat()`, `toUpperCase()`, `replace()`, `substring()`) không hề chỉnh sửa chuỗi ban đầu mà luôn tạo ra và trả về một đối tượng chuỗi mới trên Heap.
* Các phương thức cốt lõi: `length()`, `charAt(int index)`, `indexOf(String str)`, `substring(int begin, int end)`, `trim()`.

### 4.2. Vùng nhớ String Pool & So sánh chuỗi (`==` vs `equals()`)
Để tối ưu hóa dung lượng bộ nhớ, Java sử dụng phân vùng đặc biệt trong Heap gọi là String Constant Pool:
* **Tạo chuỗi bằng Literal (`String s = "Hello";`):** JVM kiểm tra String Pool. Nếu chuỗi đã tồn tại, JVM tái sử dụng ô nhớ cũ và gán tham chiếu mới vào đó mà không tạo đối tượng mới. Do đó hai biến literal cùng nội dung sẽ có toán tử so sánh địa chỉ `==` trả về `true`.
* **Tạo chuỗi bằng từ khóa `new` (`String s = new String("Hello");`):** JVM bắt buộc cấp phát một ô nhớ mới độc lập trên JVM Heap thông thường (ngoài String Pool). Do đó toán tử `==` so sánh với chuỗi literal sẽ trả về `false`.
* **Quy chuẩn so sánh:**
  * `==`: So sánh địa chỉ ô nhớ tham chiếu.
  * `equals()`: So sánh nội dung giá trị ký tự bên trong chuỗi. Trong lập trình ứng dụng, luôn luôn dùng `equals()` hoặc `equalsIgnoreCase()` để so sánh chuỗi.

### 4.3. Bảng so sánh giữa `String`, `StringBuffer` và `StringBuilder`
Khi cần nối ghép chuỗi hàng nghìn lần, việc dùng `String` sẽ sinh ra hàng nghìn đối tượng rác trên Heap. Java cung cấp hai lớp thay thế có khả năng thay đổi nội dung (Mutable):

| Tiêu chí | `java.lang.String` | `java.lang.StringBuffer` | `java.lang.StringBuilder` |
| :--- | :--- | :--- | :--- |
| **Tính thay đổi (Mutability)** | **Bất biến (Immutable)** | **Có thể thay đổi (Mutable)** | **Có thể thay đổi (Mutable)** |
| **An toàn luồng (Thread-safety)** | An toàn tuyệt đối | **An toàn luồng (Thread-safe)** với các phương thức đồng bộ hóa (`synchronized`) | **Không an toàn luồng (Not thread-safe)** |
| **Hiệu năng tốc độ** | Chậm khi nối chuỗi nhiều lần | Nhanh hơn String, nhưng chậm hơn StringBuilder do chi phí khóa luồng | **Nhanh nhất (Fastest)** trong xử lý đơn luồng |
| **Phương thức nổi bật** | `concat()`, `+` | `append()`, `insert()`, `delete()`, `reverse()` | `append()`, `insert()`, `delete()`, `reverse()` |

### 4.4. Phân tích cú pháp chuỗi với `java.util.Scanner`
Lớp `java.util.Scanner` cung cấp công cụ phân tách token văn bản mạnh mẽ:
* **Thiết lập ký tự phân tách (Delimiter):** Mặc định sử dụng khoảng trắng. Có thể cấu hình dấu phân tách tùy biến bằng biểu thức chính quy qua phương thức `useDelimiter(String regex)` (ví dụ `sc.useDelimiter("[,;\\s]+");`).
* **Các phương thức duyệt:** `hasNext()`, `next()`, `nextInt()`, `nextDouble()`, `nextLine()`.

### 4.5. Định dạng dữ liệu xuất ra (Formatting)
Java hỗ trợ in dữ liệu theo khuôn mẫu với `System.out.printf(...)` hoặc `System.out.format(...)`:
* `%d`: Định dạng số nguyên.
* `%f`: Định dạng số thực (ví dụ `%.2f` lấy 2 số lẻ thập phân).
* `%s`: Định dạng chuỗi văn bản.
* `%c`: Định dạng ký tự.
* `%n`: Ngắt xuống dòng mới an toàn đa nền tảng.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 09:**
> - Bẫy **JDK 8 trong PE**: Đề trường chạy Java 8 nên **KHÔNG có `String.isBlank()` hay `.repeat()` (Java 11+)** — phải dùng `str == null || str.trim().isEmpty()`.
> - Bẫy `substring(begin, end)` lấy `[begin, end - 1]` và bẫy `s.replace(...)` trả về chuỗi mới chứ **không sửa `s` tại chỗ**.
> - Bẫy `Scanner`: sau `nextInt()` / `nextDouble()` luôn có ký tự `\n` kẹt trong buffer; phải gọi `sc.nextLine()` xả trôi trước khi đọc chuỗi tiếp.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 9.1: Phân biệt `==` và `equals()` với String Pool

**Đề bài:** Xác định kết quả in ra màn hình (`true` hay `false`) của đoạn mã sau và giải thích rõ bản chất vùng nhớ:
```java
String a = "Java";
String b = "Java";
String c = new String("Java");

System.out.println(a == b);
System.out.println(a == c);
System.out.println(a.equals(c));
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:**
  ```text
  true
  false
  true
  ```
* **Giải thích:**
  1. `a == b` trả về **`true`**: Cả `a` và `b` cùng trỏ đến một ô nhớ trong **String Pool**.
  2. `a == c` trả về **`false`**: `c` được tạo bằng từ khóa `new`, lưu ở ô nhớ độc lập trên JVM Heap bên ngoài String Pool; hai biến khác địa chỉ tham chiếu.
  3. `a.equals(c)` trả về **`true`**: Phương thức `equals()` so sánh nội dung ký tự; cả hai đều là chuỗi `"Java"`.

</details>

---

### Bài 9.2: Tính bất biến và cơ chế cấp phát chuỗi mới

**Đề bài:** Đoạn mã sau in ra giá trị gì?
```java
String s = "Hello";
s.concat(" World");
s.toUpperCase();
System.out.println(s);
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `Hello`
* **Giải thích:** `String` là bất biến. Các phương thức `concat()` và `toUpperCase()` đều trả về các đối tượng chuỗi mới trên Heap. Do đoạn mã không gán kết quả trả về vào biến nào, biến `s` vẫn trỏ đến đối tượng ban đầu là `"Hello"`.

</details>

---

### Bài 9.3: Lựa chọn giữa `StringBuilder` và `StringBuffer`

**Đề bài:** Trong một ứng dụng xử lý dữ liệu đơn luồng (Single-thread), bạn cần thực hiện nối 100.000 dòng văn bản trong vòng lặp. Bạn nên chọn `String`, `StringBuffer` hay `StringBuilder`? Giải thích tại sao.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Lựa chọn tối ưu:** Nên chọn **`StringBuilder`**.
* **Giải thích:**
  * Không dùng `String` vì tính bất biến sẽ tạo ra 100.000 đối tượng rác trên Heap, gây tràn bộ nhớ và kích hoạt GC liên tục làm giảm hiệu năng.
  * Không nên dùng `StringBuffer` trong môi trường đơn luồng vì chi phí đồng bộ hóa luồng (`synchronized`) gây chậm tốc độ xử lý.
  * `StringBuilder` có khả năng thay đổi kích thước linh hoạt và không có chi phí đồng bộ hóa luồng, mang lại tốc độ thực thi nhanh nhất.

</details>

---

### Bài 9.4: Đảo ngược chuỗi và chèn ký tự với `StringBuilder`

**Đề bài:** Sử dụng `StringBuilder` để viết đoạn mã nhận vào chuỗi `"ABCDEF"`, thực hiện đảo ngược chuỗi thành `"FEDCBA"`, sau đó chèn dấu gạch ngang `"-"` vào chính giữa chuỗi (sau ký tự `'D'`) và in kết quả ra màn hình.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public class StringDemo {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("ABCDEF");
        sb.reverse(); // Đảo ngược thành "FEDCBA"
        sb.insert(3, "-"); // Chèn dấu '-' tại vị trí chỉ mục 3
        System.out.println(sb.toString()); // In ra: FED-CBA
    }
}
```
* **Giải thích:** Phương thức `reverse()` đảo ngược chuỗi ký tự trực tiếp trên bộ đệm. Phương thức `insert(3, "-")` dịch chuyển các ký tự từ chỉ mục 3 sang phải và chèn ký tự `"-"` vào vị trí đó.

</details>

---

### Bài 9.5: Tách token dữ liệu với `java.util.Scanner`

**Đề bài:** Cho chuỗi dữ liệu: `String input = "Nam, 8.5; Lan, 9.0; Tuan, 7.5";`. Hãy viết đoạn mã dùng `Scanner` với phương thức `useDelimiter` để trích xuất và in ra tên của từng người cùng điểm số tương ứng trên từng dòng riêng biệt.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.util.Scanner;

public class ParseScore {
    public static void main(String[] args) {
        String input = "Nam, 8.5; Lan, 9.0; Tuan, 7.5";
        Scanner sc = new Scanner(input);
        sc.useDelimiter("[,;]\\s*");
        
        while (sc.hasNext()) {
            String name = sc.next();
            double score = sc.nextDouble();
            System.out.println("Sinh vien: " + name + " - Diem: " + score);
        }
        sc.close();
    }
}
```
* **Giải thích:** Biểu thức chính quy `[,;]\\s*` yêu cầu `Scanner` nhận diện dấu phẩy hoặc chấm phẩy kèm khoảng trắng làm dấu phân tách. Lệnh `sc.next()` đọc tên sinh viên, lệnh `sc.nextDouble()` đọc và chuyển đổi trực tiếp điểm số thành kiểu `double`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md) · [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Numbers%20and%20Strings.pdf) · [PPTX](/media/pro192/slides/Numbers%20and%20Strings.pptx)

---

**Điều hướng:** [← Slot 08](./slot-08.md) | [Mục lục PRO192](../README.md) | [Slot 10 →](./slot-10.md)
