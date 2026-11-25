---
slot: 22
stage: 6
title: "Slot 22: Bản chất Ngoại lệ, Phân cấp Throwable & Checked vs Unchecked"
category: PRO192
lang: vi
examFocus:
  - "Thi FE"
  - "Thực chiến"
estimatedMinutes: 20
slidePdf: "/media/pro192/resources/Exception%20Handling.pdf"
slidePptx: "/media/pro192/slides/Exception%20Handling.pptx"
peRefs: []
---

# Slot 22: Bản chất Ngoại lệ, Phân cấp Throwable & Checked vs Unchecked

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 6: Xử lý Ngoại lệ (Exception Handling) & Mã nguồn An toàn
- **Trọng tâm thi:** `Thi FE` `Thực chiến` | **Thời lượng gợi ý:** ~20 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Exception%20Handling.pdf) · [Slide PPTX](/media/pro192/slides/Exception%20Handling.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu cây phân cấp `Throwable` (`Error` vs `Exception`) và cơ chế lan truyền lỗi trên Call Stack.
- Phân biệt rạch ròi **Checked Exception** (ép xử lý lúc compile) vs **Unchecked / RuntimeException**.
- Nhận diện các ngoại lệ Runtime hay gặp (`NullPointerException`, `ArrayIndexOutOfBoundsException`, `ArithmeticException`, `NumberFormatException`).

## 2. Lý thuyết cốt lõi

*Tài liệu đối chiếu: Bộ slide `Exception Handling.pptx` (từ slide Objectives, What Is an Exception?, The Catch or Specify Requirement đến slide The Exception Hierarchy).*

### 1.1. Bản chất Ngoại lệ & Cơ chế ném lỗi
Ngoại lệ (Exception) là viết tắt của cụm từ "exceptional event" – sự kiện bất thường phát sinh trong quá trình chương trình đang chạy (runtime) làm gián đoạn luồng thực thi bình thường của các chỉ thị lệnh.

Khi phát sinh lỗi bên trong một phương thức, phương thức đó tạo ra một đối tượng ngoại lệ (Exception Object) và bàn giao cho hệ thống máy ảo JVM. Quá trình này gọi là ném ngoại lệ (throwing an exception). Đối tượng ngoại lệ chứa 3 thông tin cốt lõi:
1. Kiểu lỗi phát sinh.
2. Trạng thái hiện tại của chương trình khi xảy ra sự cố.
3. Call Stack Trace (Vết ngăn xếp cuộc gọi) – danh sách thứ tự các phương thức đã được kích hoạt dẫn tới điểm gây lỗi.

Sau khi ngoại lệ được ném ra, JVM lùng sục ngược lên Call Stack để tìm kiếm đoạn mã tiếp nhận xử lý. Đoạn mã này được gọi là Exception Handler.

### 1.2. Cây phân cấp Ngoại lệ tối cao: Lớp Throwable

![Phân cấp lớp Throwable trong Java Exception Handling](/media/pro192/images/exception.png)

Mọi lớp đại diện cho lỗi và ngoại lệ trong Java đều phải kế thừa trực tiếp hoặc gián tiếp từ lớp tổ phụ `java.lang.Throwable`. Cây kế thừa gồm 2 nhánh chính:
- `java.lang.Error`: Đại diện cho các sự cố hệ thống nghiêm trọng nằm ngoài tầm kiểm soát của chương trình ứng dụng (ví dụ: `OutOfMemoryError`, `StackOverflowError`). Lập trình viên không được khuyến khích bắt các đối tượng thuộc `Error`.
- `java.lang.Exception`: Đại diện cho các tình huống sự cố mà một chương trình ứng dụng hợp lý có thể dự đoán trước và có thể bắt để xử lý phục hồi.

### 1.3. Phân biệt Checked Exception và Unchecked Exception

| Tiêu chí | Checked Exception (Ngoại lệ kiểm tra) | Unchecked Exception (Ngoại lệ không kiểm tra) |
| :--- | :--- | :--- |
| **Vị trí cây kế thừa** | Kế thừa trực tiếp từ `Exception` (không thuộc `RuntimeException`) | Kế thừa từ `RuntimeException` (hoặc `Error`) |
| **Thời điểm kiểm tra** | Được trình biên dịch kiểm tra nghiêm ngặt lúc biên dịch (Compile-time) | Chỉ phát sinh tại thời điểm chương trình đang chạy (Runtime) |
| **Quy tắc Catch or Specify** | BẮT BUỘC phải bọc trong `try-catch` hoặc khai báo ủy quyền bằng `throws` | KHÔNG BẮT BUỘC. Trình biên dịch cho phép bỏ qua |
| **Nguyên nhân chính** | Do các yếu tố môi trường bên ngoài (file không tồn tại, ngắt kết nối mạng, lỗi CSDL) | Do lỗi logic lập trình (tham chiếu null, chia cho 0, vượt biên mảng) |
| **Các lớp tiêu biểu** | `IOException`, `FileNotFoundException`, `SQLException` | `NullPointerException`, `ArithmeticException`, `ArrayIndexOutOfBoundsException` |

### 1.4. Ngăn xếp cuộc gọi (Call Stack Trace) & Sự lan truyền ngoại lệ
Khi `main()` gọi `methodA()`, và `methodA()` gọi `methodB()`, JVM đẩy các khung ngăn xếp lần lượt vào Call Stack:
`main()` → `methodA()` → `methodB()`

Nếu tại `methodB()` phát sinh ngoại lệ mà không bắt, phương thức lập tức bị ngắt ngang và ngoại lệ bị đẩy ngược về `methodA()`. Nếu `methodA()` cũng không bắt, nó tiếp tục bị đẩy về `main()`. Nếu `main()` vẫn bỏ qua, ngoại lệ rơi vào tay Trình xử lý mặc định của JVM (Default Handler). JVM chấm dứt luồng thực thi và in toàn bộ Stack Trace màu đỏ ra màn hình console để chỉ rõ vị trí từng dòng code gây lỗi.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 22:**
> - `RuntimeException` và các lớp con (kể cả `ClassCastException`, `IndexOutOfBoundsException`) thuộc nhóm **Unchecked Exception** dù nằm dưới nhánh `Exception`.
> - Không dùng `try-catch` để bắt `Error` (như `OutOfMemoryError` hay `StackOverflowError`) rồi cố chạy tiếp vì trạng thái JVM không còn an toàn.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 22.1: Phân loại Checked Exception và Unchecked Exception

**Đề bài:** Trong danh sách các lớp ngoại lệ sau, lớp nào là Checked Exception và lớp nào là Unchecked Exception: `NullPointerException`, `FileNotFoundException`, `ArithmeticException`, `ArrayIndexOutOfBoundsException`, `SQLException`?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Unchecked Exceptions (kế thừa từ `RuntimeException`): `NullPointerException`, `ArithmeticException`, `ArrayIndexOutOfBoundsException`.
- Checked Exceptions (kế thừa trực tiếp từ `Exception`, bắt buộc kiểm tra lúc biên dịch): `FileNotFoundException`, `SQLException`.

</details>

---

### Bài 22.2: Quy tắc Catch or Specify Requirement

**Đề bài:** Xét đoạn mã sau:
```java
import java.io.FileReader;
public class FileTest {
    public static void main(String[] args) {
        FileReader reader = new FileReader("data.txt"); // Dòng 5
    }
}
```
Tại sao đoạn mã trên bị báo lỗi biên dịch tại Dòng 5?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Constructor của `FileReader` có khai báo ném ra `FileNotFoundException`. Vì đây là một Checked Exception, quy tắc của Java bắt buộc lập trình viên phải xử lý bằng khối `try-catch` hoặc khai báo ủy quyền bằng `throws FileNotFoundException` ở đầu hàm `main`. Đoạn mã trên không thực hiện phương án nào nên bị từ chối biên dịch.

</details>

---

### Bài 22.3: Sự khác biệt giữa Error và Exception

**Đề bài:** Tại sao hai nhánh `Error` và `Exception` trong cây `Throwable` lại được tách biệt? Khi gặp `OutOfMemoryError`, lập trình viên có nên dùng `try-catch` để bắt và tiếp tục chạy không?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- `Exception` đại diện cho các sự cố bất thường có thể dự đoán và có thể phục hồi bằng mã nguồn ứng dụng.
- `Error` đại diện cho các sự cố thảm khốc của máy ảo hoặc phần cứng (hết bộ nhớ, tràn ngăn xếp) nằm ngoài tầm kiểm soát của ứng dụng.
- Khi gặp `OutOfMemoryError`, KHÔNG NÊN cố gắng bắt để chạy tiếp vì bộ nhớ Heap đã cạn kiệt, tính toàn vẹn của ứng dụng không còn được đảm bảo. Giải pháp là tối ưu thuật toán giải phóng bộ nhớ hoặc nâng dung lượng RAM cho JVM.

</details>

---

### Bài 22.4: Phân tích các loại ngoại lệ Runtime phổ biến

**Đề bài:** Chỉ ra loại ngoại lệ phát sinh khi chạy từng dòng lệnh:
1. `String s = null; s.length();`
2. `int[] a = new int[3]; int x = a[5];`
3. `int k = 10 / 0;`

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

1. Phát sinh `java.lang.NullPointerException` do gọi phương thức trên biến mang giá trị `null`.
2. Phát sinh `java.lang.ArrayIndexOutOfBoundsException` do truy xuất phần tử ngoài biên hợp lệ của mảng.
3. Phát sinh `java.lang.ArithmeticException` do thực hiện phép chia số nguyên cho 0.

</details>

---

### Bài 22.5: Cơ chế lan truyền Call Stack Propagation

**Đề bài:** Nếu `main()` gọi `calculate()`, và `calculate()` gọi `divide(10, 0)`. Nếu trong `divide` xảy ra `ArithmeticException` mà không có `try-catch`, điều gì sẽ xảy ra?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Hàm `divide` bị ngắt ngang và đẩy ngoại lệ về `calculate()`. Do `calculate()` không bắt, nó tiếp tục bị ngắt và đẩy ngoại lệ về `main()`. Vì `main()` cũng không bắt, luồng chính của chương trình bị tiêu diệt. JVM chấm dứt chương trình và in toàn bộ Stack Trace ra console chỉ rõ thứ tự các dòng lệnh từ `divide`, `calculate` đến `main`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 3 (Exception, Generics & try-with-resources)](../../java/basis/java-basic-questions-03.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Exception%20Handling.pdf) · [PPTX](/media/pro192/slides/Exception%20Handling.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (3 ảnh)</summary>

![Sơ đồ Slot 22: exception](/media/pro192/images/exception.png)

![Sơ đồ Slot 22: exception1](/media/pro192/images/exception1.png)

![Sơ đồ Slot 22: exception2](/media/pro192/images/exception2.png)

</details>

---

**Điều hướng:** [← Slot 21](./slot-21.md) | [Mục lục PRO192](../README.md) | [Slot 23 →](./slot-23.md)
