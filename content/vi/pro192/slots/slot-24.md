---
slot: 24
stage: 6
title: "Slot 24: Ủy quyền throws, Ném Ngoại lệ throw & Tạo Custom Exception"
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

# Slot 24: Ủy quyền throws, Ném Ngoại lệ throw & Tạo Custom Exception

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 6: Xử lý Ngoại lệ (Exception Handling) & Mã nguồn An toàn
- **Trọng tâm thi:** `Thi FE` `Thực chiến` | **Thời lượng gợi ý:** ~20 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Exception%20Handling.pdf) · [Slide PPTX](/media/pro192/slides/Exception%20Handling.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt từ khóa `throw` (chủ động ném một đối tượng ngoại lệ) và `throws` (khai báo ủy quyền ở chữ ký hàm).
- Xây dựng Custom Exception kế thừa `Exception` (checked) hoặc `RuntimeException` (unchecked).
- Cài đặt vòng lặp `try-catch` chuẩn hóa ép nhập dữ liệu hợp lệ với `Scanner`.

## 2. Lý thuyết cốt lõi

*Tài liệu đối chiếu: Bộ slide `Exception Handling.pptx` (từ slide Catching exceptions: Throws mechanism, demo DemoException2.java, Example: Catching Exceptions đến Summary).*

### 3.1. Cơ chế Ủy quyền ngoại lệ: Từ khóa throws
Khi một phương thức thực thi các thao tác có nguy cơ ném ra Checked Exception, nhưng bản thân phương thức đó không muốn hoặc không đủ thẩm quyền xử lý lỗi tại chỗ, nó sử dụng từ khóa `throws` ở phần chữ ký phương thức để ủy quyền trách nhiệm xử lý lên cho phương thức cấp cao hơn đã gọi nó:
```java
public static void demoReadFile() throws FileNotFoundException {
    FileReader f = new FileReader("computer.txt");
}
```
Phương thức bên ngoài khi gọi tới `demoReadFile()` bắt buộc phải:
1. Bọc lời gọi trong khối `try-catch`.
2. Hoặc tiếp tục khai báo `throws FileNotFoundException` ở đầu hàm của mình.

### 3.2. Chủ động ném ngoại lệ: Từ khóa throw
Phân biệt giữa `throw` và `throws`:
- `throws`: Đặt ở chữ ký phương thức (sau tham số), dùng để cảnh báo danh sách các lớp ngoại lệ mà hàm có thể làm văng ra.
- `throw`: Là một câu lệnh thực thi nằm bên trong thân hàm, dùng để chủ động tạo và ném một đối tượng ngoại lệ cụ thể vào JVM:
  `throw new ExceptionType("Thông điệp lỗi");`

Kỹ thuật này được dùng để kiểm tra điều kiện dữ liệu đầu vào (Validation Pattern): nếu người dùng nhập số nằm ngoài khoảng quy định, chương trình chủ động dùng `throw new Exception();` để chuyển quyền điều khiển cho khối `catch` xử lý.

### 3.3. Kỹ thuật tạo Lớp ngoại lệ tự định nghĩa (Custom Exception)
Khi xây dựng ứng dụng thực tế, các lớp ngoại lệ có sẵn không mô tả đủ ngữ cảnh nghiệp vụ. Ta tạo Custom Exception theo 2 bước:
1. Kế thừa lớp cha phù hợp: Kế thừa `Exception` nếu muốn tạo Checked Exception; kế thừa `RuntimeException` nếu muốn tạo Unchecked Exception.
2. Viết các Constructor gọi `super(message)` để tái sử dụng cơ chế lưu trữ thông điệp của lớp cha.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 24:**
> - Bẫy FE: Khi lớp con ghi đè (`@Override`) phương thức của lớp cha có `throws`, lớp con **không được ném ra Checked Exception mới hoặc rộng hơn** lớp cha.
> - Khi viết vòng lặp bắt nhập sai với `Scanner.nextInt()`, bắt buộc gọi `sc.nextLine()` trong khối `catch` (hoặc `finally`) để xóa dữ liệu lỗi khỏi buffer, tránh lặp vô hạn.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 24.1: Phân biệt throw và throws

**Đề bài:** Phân biệt `throw` và `throws` dựa trên vị trí, đối tượng đi liền sau và chức năng.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Vị trí: `throws` nằm ở chữ ký phương thức; `throw` nằm trong thân phương thức.
- Đối tượng đi kèm: Sau `throws` là tên một hoặc nhiều lớp ngoại lệ; sau `throw` là một đối tượng thể hiện cụ thể của lớp ngoại lệ.
- Chức năng: `throws` dùng để cảnh báo hoặc ủy quyền xử lý ngoại lệ lên cấp cao hơn; `throw` dùng để chủ động kích hoạt và ném đối tượng ngoại lệ vào JVM.

</details>

---

### Bài 24.2: Xây dựng phương thức kiểm tra tuổi ném IllegalArgumentException

**Đề bài:** Viết phương thức `validateAge(int age)` ném `IllegalArgumentException` nếu `age < 0` hoặc `age > 150`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public class AgeValidator {
    public static void validateAge(int age) {
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("Tuoi khong hop le: " + age);
        }
        System.out.println("Tuoi hop le");
    }
}
```

</details>

---

### Bài 24.3: Viết và sử dụng Custom Checked Exception

**Đề bài:** Tạo lớp ngoại lệ `InsufficientBalanceException` kế thừa `Exception`. Viết lớp `BankAccount` có phương thức `withdraw(double amount)` ném ngoại lệ trên nếu số tiền rút lớn hơn số dư.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public class InsufficientBalanceException extends Exception {
    public InsufficientBalanceException(String message) {
        super(message);
    }
}

public class BankAccount {
    private double balance = 1000.0;
    public void withdraw(double amount) throws InsufficientBalanceException {
        if (amount > balance) {
            throw new InsufficientBalanceException("So du khong du de rut tien!");
        }
        balance -= amount;
        System.out.println("Rut tien thanh cong. So du con lai: " + balance);
    }
}
```

</details>

---

### Bài 24.4: Lỗi gọi phương thức có throws mà không xử lý

**Đề bài:** Phương thức `openData()` khai báo `throws java.io.IOException`. Tại sao gọi `openData()` trong `main` lại bị lỗi biên dịch? Nêu 2 cách sửa.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

- Lỗi: `unreported exception IOException; must be caught or declared to be thrown`. Do `IOException` là Checked Exception, bên gọi bắt buộc phải tuân theo quy tắc Catch or Specify.
- 2 cách sửa:
  1. Bọc lời gọi trong khối `try { openData(); } catch (IOException e) { ... }`.
  2. Khai báo ủy quyền tiếp ở hàm main: `public static void main(String[] args) throws IOException`.

</details>

---

### Bài 24.5: Mẫu thiết kế lặp nhập số nguyên an toàn bằng throw kết hợp try-catch

**Đề bài:** Viết lại phương thức `inputInteger()` từ slide bài giảng: người dùng nhập số nguyên trong khoảng `[10, 50]`. Nếu ngoài khoảng, dùng `throw new Exception();` để khối `catch` bắt và in `"Required integer between 10 and 50!"` rồi lặp lại.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.util.Scanner;
public class SafeInput {
    public static int inputInteger() {
        Scanner in = new Scanner(System.in);
        boolean cont = true;
        int n = 0;
        do {
            try {
                System.out.print("Enter a whole number (10 - 50): ");
                n = Integer.parseInt(in.nextLine());
                if (n < 10 || n > 50) {
                    throw new Exception();
                }
                cont = false;
            } catch (Exception e) {
                System.out.println("Required integer between 10 and 50!");
            }
        } while (cont);
        return n;
    }
}
```

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 24A: `throw` Keyword — Chủ động Ném Ngoại lệ Kiểm tra Tuổi
- **Mục tiêu:** Viết hàm `checkAge(int age)` ném `IllegalArgumentException` nếu `< 18` và bắt lại tại `main`.
- **Expected Output:**
  - `Tu choi: Can du 18 tuoi!`

```java
public class Main {
    static void checkAge(int age) {
        if (age < 18) {
            // TODO: throw new IllegalArgumentException("Can du 18 tuoi!");
        }
        System.out.println("Access granted!");
    }

    public static void main(String[] args) {
        try {
            checkAge(15);
        } catch (IllegalArgumentException e) {
            System.out.println("Tu choi: " + e.getMessage());
        }
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 24A)</summary>

```java
public class Main {
    static void checkAge(int age) {
        if (age < 18) {
            throw new IllegalArgumentException("Can du 18 tuoi!");
        }
        System.out.println("Access granted!");
    }

    public static void main(String[] args) {
        try {
            checkAge(15);
        } catch (IllegalArgumentException e) {
            System.out.println("Tu choi: " + e.getMessage());
        }
    }
}
```

* **Giải thích:** Phân biệt nhanh: `throw` (không có `s`) nằm **bên trong thân hàm** để ném 1 đối tượng exception cụ thể; `throws` (có `s`) nằm **trên chữ ký hàm** để cảnh báo người gọi.

</details>

---

#### 🟡 Thực hành 24B: Custom `InvalidScoreException` + Vòng lặp `Scanner` Bắt nhập lại
- **Mục tiêu:** Tạo Checked Exception `InvalidScoreException extends Exception` kiểm tra điểm `[0..10]` trong vòng lặp `Scanner` cho tới khi hợp lệ.
- **Expected Output:**
  - `Nhap lai...`
  - `Nhan diem hop le: 8.5`
- 🔗 [Mở bài lab Slot 24 trên JavaBrew Live Lab](/studio/playground?example=slot-24-lab)

```java
import java.util.Scanner;

class InvalidScoreException extends Exception {
    public InvalidScoreException(String msg) { super(msg); }
}

public class Main {
    static double parseScore(String raw) throws InvalidScoreException {
        double v;
        try {
            v = Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            throw new InvalidScoreException("Khong phai so!");
        }
        // TODO: Neu v < 0 || v > 10 thi throw InvalidScoreException
        return v;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner("abc\n12\n8.5\n");
        while (sc.hasNextLine()) {
            try {
                double s = parseScore(sc.nextLine());
                System.out.println("Nhan diem hop le: " + s);
                break;
            } catch (InvalidScoreException e) {
                System.out.println("Nhap lai: " + e.getMessage());
            }
        }
        sc.close();
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 24B)</summary>

```java
import java.util.Scanner;

class InvalidScoreException extends Exception {
    public InvalidScoreException(String msg) { super(msg); }
}

public class Main {
    static double parseScore(String raw) throws InvalidScoreException {
        double v;
        try {
            v = Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            throw new InvalidScoreException("Khong phai so!");
        }
        if (v < 0 || v > 10) {
            throw new InvalidScoreException("Diem ngoai khoang [0..10]: " + v);
        }
        return v;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner("abc\n12\n8.5\n");
        while (sc.hasNextLine()) {
            try {
                double s = parseScore(sc.nextLine());
                System.out.println("Nhan diem hop le: " + s);
                break;
            } catch (InvalidScoreException e) {
                System.out.println("Nhap lai: " + e.getMessage());
            }
        }
        sc.close();
    }
}
```

* **Giải thích:** Mở bản `slot-24-lab` trên JavaBrew Live Lab để thử nhập nhiều dòng `stdin` trực tiếp qua ô Input.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 3 (Exception, Generics & try-with-resources)](../../java/basis/java-basic-questions-03.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Exception%20Handling.pdf) · [PPTX](/media/pro192/slides/Exception%20Handling.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (3 ảnh)</summary>

![Sơ đồ Slot 24: exception7](/media/pro192/images/exception7.png)

![Sơ đồ Slot 24: exception8](/media/pro192/images/exception8.png)

![Sơ đồ Slot 24: exception9](/media/pro192/images/exception9.png)

</details>

---

**Điều hướng:** [← Slot 23](./slot-23.md) | [Mục lục PRO192](../README.md) | [Slot 25 →](./slot-25.md)
