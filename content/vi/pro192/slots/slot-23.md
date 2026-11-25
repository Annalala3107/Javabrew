---
slot: 23
stage: 6
title: "Slot 23: Cấu trúc try-catch-finally & Dọn dẹp Tài nguyên An toàn"
category: PRO192
lang: vi
examFocus:
  - "Thi FE"
  - "Thực chiến"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Exception%20Handling.pdf"
slidePptx: "/media/pro192/slides/Exception%20Handling.pptx"
peRefs: []
---

# Slot 23: Cấu trúc try-catch-finally & Dọn dẹp Tài nguyên An toàn

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 6: Xử lý Ngoại lệ (Exception Handling) & Mã nguồn An toàn
- **Trọng tâm thi:** `Thi FE` `Thực chiến` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Exception%20Handling.pdf) · [Slide PPTX](/media/pro192/slides/Exception%20Handling.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Viết đúng thứ tự các khối `catch` từ ngoại lệ cụ thể (lớp con) đến ngoại lệ tổng quát (lớp cha).
- Hiểu bản chất cam kết thực thi của khối `finally` kể cả khi có `return` hoặc ngoại lệ không khớp.
- Nắm luồng thực thi khi lồng khối `try-catch` và khi `finally` chứa `return` (cạm bẫy ghi đè giá trị trả về).

## 2. Lý thuyết cốt lõi

*Tài liệu đối chiếu: Bộ slide `Exception Handling.pptx` (từ slide Catching exceptions: try catch finally mechanism, Catching specific/general-level exception đến The finally block).*

### 2.1. Cú pháp và Luồng điều khiển của khối Try-Catch

![Luồng thực thi Try-Catch-Finally trong Java](/media/pro192/images/exception1.png)

Cú pháp tổng quát:
```java
try {
    // Các câu lệnh có nguy cơ gây phát sinh ngoại lệ
} catch (ExceptionType1 e1) {
    // Xử lý ngoại lệ loại 1
} catch (ExceptionType2 e2) {
    // Xử lý ngoại lệ loại 2
} finally {
    // Các câu lệnh luôn luôn được bảo đảm thực thi
}
```

Luồng thực thi:
1. Không có ngoại lệ: Toàn bộ khối `try` thực thi trọn vẹn; các khối `catch` bị bỏ qua; luồng đi thẳng vào khối `finally` rồi tiếp tục các lệnh sau đó.
2. Có ngoại lệ: Tại dòng lệnh phát sinh lỗi trong `try`, việc thực thi phần còn lại của `try` bị dừng ngay lập tức. JVM quét danh sách các khối `catch` từ trên xuống dưới. Khối `catch` đầu tiên tương thích kiểu với ngoại lệ sẽ được kích hoạt xử lý. Sau khi khối `catch` hoàn tất, luồng chuyển sang khối `finally`.

### 2.2. Quy tắc thứ tự bắt Ngoại lệ: Từ Cụ thể đến Khái quát (Specific to General)
Do `Exception` là lớp cha của mọi ngoại lệ cụ thể, tham chiếu kiểu cha có thể nhận đối tượng lớp con.
- Quy tắc: Các khối `catch` bắt ngoại lệ cụ thể bắt buộc phải đặt ở phía trên; khối `catch` bắt ngoại lệ khái quát (`Exception`) bắt buộc phải đặt ở cuối cùng.
- Nếu đặt `catch (Exception e)` lên trước `catch (ArithmeticException e)`, trình biên dịch Java sẽ báo lỗi đỏ Unreachable Code: `error: exception ArithmeticException has already been caught`.

### 2.3. Bản chất và Cam kết thực thi của khối finally
Khối `finally` được bảo đảm chắc chắn sẽ được thực thi dù có bất kỳ tình huống nào xảy ra:
1. Khối `try` chạy bình thường không có lỗi.
2. Khối `try` phát sinh ngoại lệ và được xử lý thành công bởi `catch`.
3. Khối `try` phát sinh ngoại lệ nhưng không có khối `catch` nào khớp (ngoại lệ chuẩn bị văng ra làm sập chương trình, `finally` vẫn được ưu tiên chạy trước khi luồng bị hủy).
4. Ngay cả khi trong thân `try` hoặc `catch` có chứa lệnh `return`, JVM vẫn tạm giữ giá trị trả về, nhảy xuống chạy xong toàn bộ khối `finally` rồi mới thoát khỏi phương thức.

Mục đích chính của `finally` là dọn dẹp và giải phóng tài nguyên hệ thống (đóng file `fr.close()`, đóng kết nối mạng, đóng CSDL) nhằm ngăn chặn rò rỉ bộ nhớ (resource leak). Trường hợp duy nhất `finally` không chạy là khi có lệnh cưỡng chế tắt JVM `System.exit(0);` hoặc sự cố sập nguồn phần cứng.

### 2.4. Lồng các khối Try-Catch (Nesting)
Cú pháp Java cho phép đặt lồng một khối `try-catch` bên trong thân `try` hoặc `catch` của một khối `try-catch` khác. Kỹ thuật này thường dùng để phục hồi dự phòng (Fallback): nếu mở file người dùng thất bại trong khối `try`, khối `catch` sẽ lồng khối `try-catch` thứ hai để thử mở file mặc định thay thế.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 23:**
> - Bẫy FE kinh điển: Đặt `catch (Exception e)` đứng trước `catch (ArithmeticException e)` gây lỗi biên dịch **`exception ArithmeticException has already been caught`** (unreachable code).
> - Nếu trong `finally` có lệnh `return`, giá trị của `finally` sẽ **ghi đè** giá trị `return` trước đó trong khối `try` hoặc `catch`.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 23.1: Thứ tự khối catch và Lỗi Unreachable Code

**Đề bài:** Đoạn mã sau có biên dịch thành công không?
```java
try {
    int a = 10 / 0;
} catch (Exception e) {
    System.out.println("General Exception");
} catch (ArithmeticException e) {
    System.out.println("Arithmetic Exception");
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Bị lỗi biên dịch: `exception ArithmeticException has already been caught`. Vì `ArithmeticException` là con của `Exception`, khối `catch (Exception e)` đứng trước đã bao quát toàn bộ lỗi, khiến khối `catch (ArithmeticException e)` bên dưới trở thành đoạn mã không thể chạm tới (unreachable code). Cần đảo khối `catch (ArithmeticException e)` lên trên.

</details>

---

### Bài 23.2: Cam kết của khối finally khi có ngoại lệ không khớp

**Đề bài:** Cho đoạn mã:
```java
public class TestFinally {
    public static void main(String[] args) {
        try {
            int[] arr = new int[3];
            System.out.println(arr[5]);
        } catch (ArithmeticException e) {
            System.out.println("Catch Arithmetic");
        } finally {
            System.out.println("Execute Finally");
        }
        System.out.println("End of program");
    }
}
```
Dòng `"Execute Finally"` và `"End of program"` dòng nào được in ra?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Chỉ có dòng `"Execute Finally"` được in ra. Ngoại lệ `ArrayIndexOutOfBoundsException` không khớp với khối `catch (ArithmeticException e)`. Dù chương trình sắp bị gián đoạn, JVM vẫn cam kết thực thi khối `finally` trước khi chấm dứt tiến trình. Dòng `"End of program"` nằm ngoài luồng phục hồi nên không bao giờ được chạm tới.

</details>

---

### Bài 23.3: Khối finally và Lệnh return

**Đề bài:** Phương thức sau in ra gì và trả về giá trị bao nhiêu?
```java
public static int testReturn() {
    try {
        int x = 10;
        return x;
    } finally {
        System.out.println("Finally block executed");
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

Màn hình in ra dòng `"Finally block executed"` và phương thức trả về giá trị `10`. Khi gặp lệnh `return`, JVM lưu lại giá trị trả về, tạm dừng thoát hàm để thực thi xong toàn bộ khối `finally` rồi mới chính thức trả về kết quả.

</details>

---

### Bài 23.4: Bắt ngoại lệ để lặp nhập số an toàn

**Đề bài:** Viết phương thức `public static int inputAge()` sử dụng vòng lặp `do-while` kết hợp `try-catch` để người dùng nhập tuổi qua `Scanner`, bắt `NumberFormatException` và lặp lại cho đến khi nhập đúng số nguyên.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.util.Scanner;
public class InputDemo {
    public static int inputAge() {
        Scanner sc = new Scanner(System.in);
        int age = 0;
        boolean valid = false;
        do {
            try {
                System.out.print("Nhap vao tuoi: ");
                age = Integer.parseInt(sc.nextLine());
                valid = true;
            } catch (Exception e) {
                System.out.println("Tuoi phai la so nguyen!");
            }
        } while (!valid);
        return age;
    }
}
```

</details>

---

### Bài 23.5: Lồng khối try-catch mở file dự phòng

**Đề bài:** Viết đoạn mã mở file `"config.txt"` bằng `FileReader`. Nếu gặp `FileNotFoundException`, bên trong khối `catch` hãy mở file dự phòng `"default-config.txt"`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.io.FileNotFoundException;
import java.io.FileReader;
public class FallbackDemo {
    public static void main(String[] args) {
        try {
            FileReader fr = new FileReader("config.txt");
            System.out.println("Mo file config.txt thanh cong");
        } catch (FileNotFoundException e) {
            System.out.println("Khong tim thay config.txt, dang thu mo default-config.txt...");
            try {
                FileReader frDefault = new FileReader("default-config.txt");
                System.out.println("Mo file default-config.txt thanh cong");
            } catch (FileNotFoundException e2) {
                System.out.println("Khong the khoi dong he thong!");
            }
        }
    }
}
```

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 23A: W3Schools Try...Catch — Sửa Thứ tự `catch` Con trước Cha
- **Mục tiêu:** Đảo thứ tự khối `catch (Exception e)` xuống sau `catch (ArithmeticException e)` để hết lỗi unreachable code.
- **Expected Output:**
  - `ArithmeticException caught!`

```java
public class Main {
    public static void main(String[] args) {
        try {
            int res = 10 / 0;
            System.out.println(res);
        // TODO: Sua thu tu 2 khoi catch (ngoai le cu the phai dung truoc tong quat)
        } catch (Exception e) {
            System.out.println("General Exception");
        } catch (ArithmeticException e) {
            System.out.println("ArithmeticException caught!");
        }
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 23A)</summary>

```java
public class Main {
    public static void main(String[] args) {
        try {
            int res = 10 / 0;
            System.out.println(res);
        } catch (ArithmeticException e) {
            System.out.println("ArithmeticException caught!");
        } catch (Exception e) {
            System.out.println("General Exception");
        }
    }
}
```

* **Giải thích:** Vì `ArithmeticException` là lớp con của `Exception`, nếu đặt `catch (Exception e)` lên đầu, khối `catch (ArithmeticException)` phía dưới trở thành unreachable và bị trình biên dịch cấm.

</details>

---

#### 🟡 Thực hành 23B: W3Schools Finally — Vết Thực thi `finally` khi Có `return` trong `try`
- **Mục tiêu:** Quan sát khối `finally` luôn chạy trước khi thoát hàm kể cả khi `try` trả về kết quả sớm.
- **Expected Output:**
  - `finally ran!`
  - `Returned: 5`
- 🔗 [Mở bài lab Slot 23 trên Code Studio Tryit](/studio/playground?example=slot-23-lab)

```java
public class Main {
    static int compute() {
        try {
            return 10 / 2;
        } finally {
            // TODO: In "finally ran!" va thu quan sat xem no chay truoc hay sau return
        }
    }

    public static void main(String[] args) {
        System.out.println("Returned: " + compute());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 23B)</summary>

```java
public class Main {
    static int compute() {
        try {
            return 10 / 2;
        } finally {
            System.out.println("finally ran!");
        }
    }

    public static void main(String[] args) {
        System.out.println("Returned: " + compute());
    }
}
```

* **Giải thích:** Không nên đặt câu lệnh `return` ở bên trong `finally`, vì nó sẽ nuốt mất exception và ghi đè giá trị trả về của `try` / `catch`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 3 (Exception, Generics & try-with-resources)](../../java/basis/java-basic-questions-03.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Exception%20Handling.pdf) · [PPTX](/media/pro192/slides/Exception%20Handling.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (4 ảnh)</summary>

![Sơ đồ Slot 23: exception3](/media/pro192/images/exception3.png)

![Sơ đồ Slot 23: exception4](/media/pro192/images/exception4.png)

![Sơ đồ Slot 23: exception5](/media/pro192/images/exception5.png)

![Sơ đồ Slot 23: exception6](/media/pro192/images/exception6.png)

</details>

---

**Điều hướng:** [← Slot 22](./slot-22.md) | [Mục lục PRO192](../README.md) | [Slot 24 →](./slot-24.md)
