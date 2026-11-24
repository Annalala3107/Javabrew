---
title: "Giai đoạn 6 (Slot 22–24): Xử lý Ngoại lệ (Exception Handling) & Mã nguồn An toàn"
category: PRO192
slots: "Slot 22 – 24"
lang: vi
description: "Phân cấp Throwable, Checked vs Unchecked Exception, Call Stack Trace, Try-Catch-Finally, throws/throw và Custom Exception."
---

# GIÁO TRÌNH GIAI ĐOẠN 6: XỬ LÝ NGOẠI LỆ (EXCEPTION HANDLING) & THIẾT KẾ MÃ NGUỒN AN TOÀN (SLOT 22 – 24)

---

## 1. SLOT 22: BẢN CHẤT NGOẠI LỆ, CÂY PHÂN CẤP THROWABLE & CHECKED VS UNCHECKED EXCEPTION
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

---

## 2. SLOT 23: CẤU TRÚC TRY-CATCH-FINALLY & CƠ CHẾ DỌN DẸP TÀI NGUYÊN
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

---

## 3. SLOT 24: KHAI BÁO THROWS, NÉM NGOẠI LỆ VỚI THROW & TẠO CUSTOM EXCEPTION
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

---

## 4. BỘ 15 BÀI TẬP TỰ LUYỆN GIAI ĐOẠN 6 (KÈM LỜI GIẢI CHI TIẾT)

### Bài tập Slot 22: Phân loại & Cây phân cấp Ngoại lệ

#### Bài 22.1: Phân loại Checked Exception và Unchecked Exception
*Đề bài:* Trong danh sách các lớp ngoại lệ sau, lớp nào là Checked Exception và lớp nào là Unchecked Exception: `NullPointerException`, `FileNotFoundException`, `ArithmeticException`, `ArrayIndexOutOfBoundsException`, `SQLException`?
*Lời giải chi tiết:*
- Unchecked Exceptions (kế thừa từ `RuntimeException`): `NullPointerException`, `ArithmeticException`, `ArrayIndexOutOfBoundsException`.
- Checked Exceptions (kế thừa trực tiếp từ `Exception`, bắt buộc kiểm tra lúc biên dịch): `FileNotFoundException`, `SQLException`.

#### Bài 22.2: Quy tắc Catch or Specify Requirement
*Đề bài:* Xét đoạn mã sau:
```java
import java.io.FileReader;
public class FileTest {
    public static void main(String[] args) {
        FileReader reader = new FileReader("data.txt"); // Dòng 5
    }
}
```
Tại sao đoạn mã trên bị báo lỗi biên dịch tại Dòng 5?
*Lời giải chi tiết:*
Constructor của `FileReader` có khai báo ném ra `FileNotFoundException`. Vì đây là một Checked Exception, quy tắc của Java bắt buộc lập trình viên phải xử lý bằng khối `try-catch` hoặc khai báo ủy quyền bằng `throws FileNotFoundException` ở đầu hàm `main`. Đoạn mã trên không thực hiện phương án nào nên bị từ chối biên dịch.

#### Bài 22.3: Sự khác biệt giữa Error và Exception
*Đề bài:* Tại sao hai nhánh `Error` và `Exception` trong cây `Throwable` lại được tách biệt? Khi gặp `OutOfMemoryError`, lập trình viên có nên dùng `try-catch` để bắt và tiếp tục chạy không?
*Lời giải chi tiết:*
- `Exception` đại diện cho các sự cố bất thường có thể dự đoán và có thể phục hồi bằng mã nguồn ứng dụng.
- `Error` đại diện cho các sự cố thảm khốc của máy ảo hoặc phần cứng (hết bộ nhớ, tràn ngăn xếp) nằm ngoài tầm kiểm soát của ứng dụng.
- Khi gặp `OutOfMemoryError`, KHÔNG NÊN cố gắng bắt để chạy tiếp vì bộ nhớ Heap đã cạn kiệt, tính toàn vẹn của ứng dụng không còn được đảm bảo. Giải pháp là tối ưu thuật toán giải phóng bộ nhớ hoặc nâng dung lượng RAM cho JVM.

#### Bài 22.4: Phân tích các loại ngoại lệ Runtime phổ biến
*Đề bài:* Chỉ ra loại ngoại lệ phát sinh khi chạy từng dòng lệnh:
1. `String s = null; s.length();`
2. `int[] a = new int[3]; int x = a[5];`
3. `int k = 10 / 0;`
*Lời giải chi tiết:*
1. Phát sinh `java.lang.NullPointerException` do gọi phương thức trên biến mang giá trị `null`.
2. Phát sinh `java.lang.ArrayIndexOutOfBoundsException` do truy xuất phần tử ngoài biên hợp lệ của mảng.
3. Phát sinh `java.lang.ArithmeticException` do thực hiện phép chia số nguyên cho 0.

#### Bài 22.5: Cơ chế lan truyền Call Stack Propagation
*Đề bài:* Nếu `main()` gọi `calculate()`, và `calculate()` gọi `divide(10, 0)`. Nếu trong `divide` xảy ra `ArithmeticException` mà không có `try-catch`, điều gì sẽ xảy ra?
*Lời giải chi tiết:*
Hàm `divide` bị ngắt ngang và đẩy ngoại lệ về `calculate()`. Do `calculate()` không bắt, nó tiếp tục bị ngắt và đẩy ngoại lệ về `main()`. Vì `main()` cũng không bắt, luồng chính của chương trình bị tiêu diệt. JVM chấm dứt chương trình và in toàn bộ Stack Trace ra console chỉ rõ thứ tự các dòng lệnh từ `divide`, `calculate` đến `main`.

---

### Bài tập Slot 23: Cấu trúc Try-Catch-Finally

#### Bài 23.1: Thứ tự khối catch và Lỗi Unreachable Code
*Đề bài:* Đoạn mã sau có biên dịch thành công không?
```java
try {
    int a = 10 / 0;
} catch (Exception e) {
    System.out.println("General Exception");
} catch (ArithmeticException e) {
    System.out.println("Arithmetic Exception");
}
```
*Lời giải chi tiết:*
Bị lỗi biên dịch: `exception ArithmeticException has already been caught`. Vì `ArithmeticException` là con của `Exception`, khối `catch (Exception e)` đứng trước đã bao quát toàn bộ lỗi, khiến khối `catch (ArithmeticException e)` bên dưới trở thành đoạn mã không thể chạm tới (unreachable code). Cần đảo khối `catch (ArithmeticException e)` lên trên.

#### Bài 23.2: Cam kết của khối finally khi có ngoại lệ không khớp
*Đề bài:* Cho đoạn mã:
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
*Lời giải chi tiết:*
Chỉ có dòng `"Execute Finally"` được in ra. Ngoại lệ `ArrayIndexOutOfBoundsException` không khớp với khối `catch (ArithmeticException e)`. Dù chương trình sắp bị gián đoạn, JVM vẫn cam kết thực thi khối `finally` trước khi chấm dứt tiến trình. Dòng `"End of program"` nằm ngoài luồng phục hồi nên không bao giờ được chạm tới.

#### Bài 23.3: Khối finally và Lệnh return
*Đề bài:* Phương thức sau in ra gì và trả về giá trị bao nhiêu?
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
*Lời giải chi tiết:*
Màn hình in ra dòng `"Finally block executed"` và phương thức trả về giá trị `10`. Khi gặp lệnh `return`, JVM lưu lại giá trị trả về, tạm dừng thoát hàm để thực thi xong toàn bộ khối `finally` rồi mới chính thức trả về kết quả.

#### Bài 23.4: Bắt ngoại lệ để lặp nhập số an toàn
*Đề bài:* Viết phương thức `public static int inputAge()` sử dụng vòng lặp `do-while` kết hợp `try-catch` để người dùng nhập tuổi qua `Scanner`, bắt `NumberFormatException` và lặp lại cho đến khi nhập đúng số nguyên.
*Lời giải chi tiết:*
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

#### Bài 23.5: Lồng khối try-catch mở file dự phòng
*Đề bài:* Viết đoạn mã mở file `"config.txt"` bằng `FileReader`. Nếu gặp `FileNotFoundException`, bên trong khối `catch` hãy mở file dự phòng `"default-config.txt"`.
*Lời giải chi tiết:*
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

---

### Bài tập Slot 24: Throws, Throw & Custom Exception

#### Bài 24.1: Phân biệt throw và throws
*Đề bài:* Phân biệt `throw` và `throws` dựa trên vị trí, đối tượng đi liền sau và chức năng.
*Lời giải chi tiết:*
- Vị trí: `throws` nằm ở chữ ký phương thức; `throw` nằm trong thân phương thức.
- Đối tượng đi kèm: Sau `throws` là tên một hoặc nhiều lớp ngoại lệ; sau `throw` là một đối tượng thể hiện cụ thể của lớp ngoại lệ.
- Chức năng: `throws` dùng để cảnh báo hoặc ủy quyền xử lý ngoại lệ lên cấp cao hơn; `throw` dùng để chủ động kích hoạt và ném đối tượng ngoại lệ vào JVM.

#### Bài 24.2: Xây dựng phương thức kiểm tra tuổi ném IllegalArgumentException
*Đề bài:* Viết phương thức `validateAge(int age)` ném `IllegalArgumentException` nếu `age < 0` hoặc `age > 150`.
*Lời giải chi tiết:*
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

#### Bài 24.3: Viết và sử dụng Custom Checked Exception
*Đề bài:* Tạo lớp ngoại lệ `InsufficientBalanceException` kế thừa `Exception`. Viết lớp `BankAccount` có phương thức `withdraw(double amount)` ném ngoại lệ trên nếu số tiền rút lớn hơn số dư.
*Lời giải chi tiết:*
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

#### Bài 24.4: Lỗi gọi phương thức có throws mà không xử lý
*Đề bài:* Phương thức `openData()` khai báo `throws java.io.IOException`. Tại sao gọi `openData()` trong `main` lại bị lỗi biên dịch? Nêu 2 cách sửa.
*Lời giải chi tiết:*
- Lỗi: `unreported exception IOException; must be caught or declared to be thrown`. Do `IOException` là Checked Exception, bên gọi bắt buộc phải tuân theo quy tắc Catch or Specify.
- 2 cách sửa:
  1. Bọc lời gọi trong khối `try { openData(); } catch (IOException e) { ... }`.
  2. Khai báo ủy quyền tiếp ở hàm main: `public static void main(String[] args) throws IOException`.

#### Bài 24.5: Mẫu thiết kế lặp nhập số nguyên an toàn bằng throw kết hợp try-catch
*Đề bài:* Viết lại phương thức `inputInteger()` từ slide bài giảng: người dùng nhập số nguyên trong khoảng `[10, 50]`. Nếu ngoài khoảng, dùng `throw new Exception();` để khối `catch` bắt và in `"Required integer between 10 and 50!"` rồi lặp lại.
*Lời giải chi tiết:*
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

---

## Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Java Basics Part 3 (Exception & try-with-resources)](../java/basis/java-basic-questions-03.md)
- **Slide & PDF gốc offline:** [Exception Handling.pdf](/media/pro192/resources/Exception%20Handling.pdf)
