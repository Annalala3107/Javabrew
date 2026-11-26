---
slot: 5
stage: 1
title: "Slot 05: Cấu trúc Điều khiển Rẽ nhánh, Vòng lặp, For-each & Java Style"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q1–Q4)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Learning%20the%20Java%20Language.pdf"
slidePptx: "/media/pro192/slides/Learning%20the%20Java%20Language.pptx"
peRefs:
  - "PE3-Q4"
  - "PE5-Q4"
---

# Slot 05: Cấu trúc Điều khiển Rẽ nhánh, Vòng lặp, For-each & Java Style

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 1: Khởi động, Môi trường & Nền tảng Cú pháp Java
- **Trọng tâm thi:** `Thi PE (Q1–Q4)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) · [Slide PPTX](/media/pro192/slides/Learning%20the%20Java%20Language.pptx)
- **Liên kết đề PE thật:** `PE3-Q4` · `PE5-Q4` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Chọn đúng cấu trúc điều khiển (`if-else`, `switch-case`, toán tử 3 ngôi `?:`, `for`, `while`, `do-while`).
- Phân biệt vòng lặp `for` chỉ mục và `for-each` (tính chất bản sao trên biến lặp của mảng nguyên thủy).
- Áp dụng chuẩn định dạng Elements of Java Style để code sạch và dễ debug trong phòng thi.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Learning the Java Language.pptx` (từ slide *Basic Constructs / Selection & Loops* đến slide *Elements of Java Style*) và tài liệu `Java Tutorial`.

### 6.1. Cấu Trúc Lựa Chọn Rẽ Nhánh (Selection Statements)
Slide *Basic Logic Constructs* hệ thống hóa các dạng rẽ nhánh điều kiện:
* **Cấu trúc `if` và `if...else` lồng nhau:** Đánh giá biểu thức điều kiện kiểu `boolean`. Nếu đúng thực thi khối lệnh tương ứng, nếu sai chuyển xuống nhánh `else`.
* **Toán tử điều kiện 3 ngôi (`?:`):**
  * Cú pháp: `biến = (điều_kiện) ? giá_trị_nếu_đúng : giá_trị_nếu_sai;`.
  * Ứng dụng tiêu biểu trong slide: Kiểm tra tính hợp lệ của dữ liệu đầu vào trước khi gán (ví dụ: `width = w > 0 ? w : 0;`).
* **Cấu trúc lựa chọn `switch...case`:**
  * Kiểm tra biến nhận giá trị nguyên (`int`, `byte`, `short`), ký tự (`char`).
  * **Từ khóa `break`:** Bắt buộc phải có ở cuối mỗi khối `case` để ngắt luồng điều khiển và thoát ngay khỏi cấu trúc `switch`.
  * **Hiện tượng Fall-through:** Nếu thiếu `break`, chương trình sẽ tiếp tục thực thi các khối `case` phía dưới một cách tuần tự bất kể điều kiện có khớp hay không.
  * **Khối `default`:** Được kích hoạt khi giá trị biểu thức không khớp với bất kỳ giá trị `case` nào.

### 6.2. Các Cấu Trúc Vòng Lặp Cổ Điển (Classic Loops)
* **Vòng lặp `while`:** Kiểm tra điều kiện lặp ở đầu vòng lặp. Nếu điều kiện sai ngay từ đầu, thân vòng lặp không được thực hiện lần nào:
  ```java
  while (condition) {
      // statements;
  }
  ```
* **Vòng lặp `do...while`:** Thực thi khối lệnh bên trong thân vòng lặp trước rồi mới kiểm tra điều kiện lặp. Đảm bảo thân vòng lặp luôn được **thực thi ít nhất 1 lần**. Đây là cấu trúc được sử dụng trong các menu console nhập liệu của các case study:
  ```java
  do {
      // hien thi menu va nhan lua chon nguoi dung
  } while (choice != exitOption);
  ```
* **Vòng lặp `for` truyền thống:** Dùng khi biết trước số bước lặp, quản lý qua biến chỉ mục `i` từ `0` đến `length - 1`.

### 6.3. Vòng Lặp Nâng Cao (Enhanced for / For-each) & Tính Chất Chỉ Đọc
Slide *An enhanced for loop* và mã nguồn minh họa `Chao.java` trình bày cú pháp và nguyên lý:
* **Cú pháp:** `for (Type element : collectionOrArray) { ... }`.
* **Cơ chế duyệt:** Vòng lặp tự động lấy tuần tự từng phần tử từ mảng gán vào biến tạm `element` mà không cần quản lý biến đếm chỉ mục.
* **Đặc tính Chỉ đọc (Read-only):**
  * Xét đoạn mã trong slide `Chao.java`:
    ```java
    int a[] = {1, 2, 3, 4, 5};
    for (int x : a) {
        x += 10;
    }
    ```
  * Lệnh `x += 10;` chỉ thực hiện cộng giá trị trên bản sao của biến tạm `x` nằm trên Stack. Khi vòng lặp kết thúc, các phần tử trong mảng gốc `a` trên Heap **vẫn giữ nguyên giá trị ban đầu là `1, 2, 3, 4, 5`**.
  * **Quy tắc:** Enhanced for chỉ dùng để đọc và duyệt mảng/tập hợp; không thể dùng nó để ghi đè hoặc thay đổi giá trị của phần tử mảng nguyên thủy.

### 6.4. Chuẩn Mực Phong Cách Viết Mã (Elements of Java Style)
Slide *Elements of Java Style* quy định 4 nguyên tắc định dạng mã nguồn chuẩn mực:
1. **Thụt lề hợp lý (Proper Use of Indentation):** Các câu lệnh bên trong một khối mã (`{ ... }`) phải được thụt vào một khoảng tab/khoảng trắng cố định so với dòng bắt đầu khối chứa nó.
2. **Quy tắc đặt dấu ngoặc nhọn (Placement of Braces):**
   * Dấu ngoặc nhọn mở `{` phải được đặt ở **cuối dòng lệnh bắt đầu khối**.
   * Dấu ngoặc nhọn đóng `}` phải nằm trên **một dòng riêng biệt**, thẳng hàng theo phương thẳng đứng với ký tự đầu tiên của dòng bắt đầu khối.
3. **Sử dụng chú thích khôn ngoan (Use Comments Wisely):** Chú thích ngắn gọn, rõ ràng, tập trung giải thích lý do thiết kế và mục đích thuật toán thay vì mô tả lại cú pháp hiển nhiên.
4. **Đặt tên biến có tính mô tả (Descriptive Variable Names):** Tên định danh phải phản ánh chính xác mục đích và kiểu dữ liệu mà nó đại diện, tránh đặt các ký tự vô nghĩa.

### 7. Bảng Tổng Hợp Kiến Thức Cốt Lõi Giai Đoạn 1

Dưới đây là bảng đối chiếu tổng hợp các khái niệm then chốt của 5 slot đầu tiên:

| Slot | Chủ đề cốt lõi | Slide bài giảng | Khái niệm then chốt | Lưu ý kỹ thuật |
| :---: | :--- | :--- | :--- | :--- |
| **Slot 1** | Tổng quan công nghệ & Kiến trúc | `Get Start.pptx`, `Introduction.pptx` | WORA, Bytecode, JVM, Java API, Oak | Bytecode độc lập nền tảng, JVM phụ thuộc nền tảng |
| **Slot 2** | Cài đặt môi trường & Chương trình đầu | `Download & Install JDK & NetBeans 8.pptx`, `Get Start.pptx` | JDK, NetBeans, Path (`bin`), CLASSPATH (`.;`) | Bỏ tick Create Main Class; phím tắt `Shift + F6` |
| **Slot 3** | Cấu trúc chương trình & Dòng lệnh | `Get Start.pptx` | Comments, hàm `main`, `javac`, `java`, file `.bat` | Lệnh `java` nhận tên lớp, không nhận đuôi `.class` |
| **Slot 4** | Kiểu dữ liệu, Biến, Toán tử & Bộ nhớ | `Learning the Java Language.pptx` | 8 kiểu nguyên thủy, tham chiếu, mảng, `>>>`, ép kiểu | Stack lưu nguyên thủy, Heap lưu đối tượng; rủi ro cắt bit |
| **Slot 5** | Cấu trúc điều khiển, Vòng lặp & Style | `Learning the Java Language.pptx`, `Java Tutorial` | `switch-case`, `break`, `do-while`, for-each, Indentation | For-each chỉ đọc (Read-only); dấu `{` ở cuối dòng |

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 05:**
> - Bẫy `for-each`: gán `x += 10` trong `for (int x : arr)` **không thay đổi** phần tử mảng gốc `arr`, chỉ thay đổi bản sao cục bộ `x`.
> - Bẫy `switch-case` rơi tự do (*fall-through*) nếu thiếu `break;`; ngoài ra nhớ `do-while` luôn chạy ít nhất **1 lần** kể cả khi điều kiện sai ngay đầu.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 5.1: Chuyển đổi cấu trúc if-else sang toán tử 3 ngôi

**Đề bài:** Hãy viết lại đoạn mã kiểm tra số chẵn lẻ sau bằng toán tử điều kiện 3 ngôi `?:` trên một dòng duy nhất:
```java
String status;
if (n % 2 == 0) {
    status = "So chan";
} else {
    status = "So le";
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
String status = (n % 2 == 0) ? "So chan" : "So le";
```
Biểu thức kiểm tra `(n % 2 == 0)`, nếu đúng trả về chuỗi `"So chan"`, nếu sai trả về `"So le"`.

</details>

---

### Bài 5.2: Phân tích hiện tượng Fall-through trong switch-case

**Đề bài:** Đoạn mã sau in ra kết quả gì khi `x = 1`? Nêu nguyên nhân và cách khắc phục:
```java
int x = 1;
switch (x) {
    case 1: System.out.print("A ");
    case 2: System.out.print("B ");
    default: System.out.print("C ");
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `A B C `
* **Nguyên nhân:** Do sau lệnh in của `case 1` và `case 2` không có câu lệnh `break;`. Khi điều kiện `case 1` khớp, luồng thực thi bị rơi tự do (fall-through) và chạy liên tục các lệnh của `case 2` và `default`.
* **Cách khắc phục:** Bổ sung `break;` vào cuối mỗi khối `case`:
  ```java
  switch (x) {
      case 1: System.out.print("A "); break;
      case 2: System.out.print("B "); break;
      default: System.out.print("C ");
  }
  ```

</details>

---

### Bài 5.3: Ứng dụng vòng lặp do-while xây dựng menu

**Đề bài:** Viết đoạn chương trình Java sử dụng vòng lặp `do-while` để hiển thị menu gồm 2 lựa chọn: `1. Tiep tuc` và `2. Thoat`. Chương trình yêu cầu người dùng nhập lựa chọn qua `Scanner` và tiếp tục lặp lại menu nếu người dùng chọn `1`, chỉ dừng lại khi người dùng nhập `2`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
java.util.Scanner sc = new java.util.Scanner(System.in);
int choice;
do {
    System.out.println("--- MENU ---");
    System.out.println("1. Tiep tuc");
    System.out.println("2. Thoat");
    System.out.print("Moi ban chon (1-2): ");
    choice = sc.nextInt();
} while (choice != 2);
System.out.println("Chuong trinh da ket thuc!");
```

</details>

---

### Bài 5.4: Chứng minh tính chất chỉ đọc của vòng lặp For-each

**Đề bài:** Cho mảng `double[] prices = {100.0, 200.0, 300.0};`. Nếu thực hiện:
```java
for (double p : prices) {
    p = p * 0.9; // giam gia 10%
}
System.out.println("Phan tu dau tien: " + prices[0]);
```
Giá trị in ra là `100.0` hay `90.0`? Hãy giải thích cơ chế phân bổ vùng nhớ Stack và Heap.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `Phan tu dau tien: 100.0`
* **Giải thích cơ chế bộ nhớ:**
  * Mảng `prices` là một đối tượng thực tế nằm trên vùng nhớ Heap.
  * Khi vòng lặp for-each thực thi, ở mỗi bước lặp nó tạo ra một biến cục bộ `p` nằm trên ngăn xếp Stack và sao chép giá trị của phần tử mảng vào biến `p`.
  * Phép tính `p = p * 0.9` chỉ cập nhật giá trị của biến cục bộ `p` trên Stack rồi bị hủy khi sang bước lặp tiếp theo, hoàn toàn không can thiệp hay ghi đè vào các ô nhớ của mảng `prices` trên Heap.

</details>

---

### Bài 5.5: Tuân thủ quy chuẩn Elements of Java Style

**Đề bài:** Đoạn mã sau vi phạm các quy tắc nào trong chuẩn mực phong cách viết mã của tài liệu bài giảng? Hãy viết lại cho đúng chuẩn:
```java
public class TestStyle
{
public static void main(String[] args)
{
int x=10;
if(x>5)
{
System.out.println(x);
}
}
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Các điểm vi phạm:**
  1. Dấu ngoặc nhọn mở `{` bị đặt xuống dòng mới thay vì nằm ở cuối dòng bắt đầu khối.
  2. Không thực hiện thụt lề (Indentation) cho các khối lệnh con bên trong class, phương thức và lệnh `if`.
  3. Thiếu khoảng trắng phân cách toán tử gán và toán tử so sánh.
* **Viết lại chuẩn mực:**
  ```java
  public class TestStyle {
      public static void main(String[] args) {
          int x = 10;
          if (x > 5) {
              System.out.println(x);
          }
      }
  }
  ```

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 5A: Switch & Ternary — Chặn Fall-through thiếu `break`
- **Mục tiêu:** Sửa `switch` bị rơi tự do từ `case 'A'` xuống `default` và dùng toán tử 3 ngôi `?:` kiểm tra Đậu/Rớt.
- **Expected Output:**
  - `Rank: Excellent | Status: PASS`

```java
public class Main {
    public static void main(String[] args) {
        char grade = 'A';
        String rank;
        // TODO: Them break cho moi case
        switch (grade) {
            case 'A': rank = "Excellent";
            case 'B': rank = "Good";
            default:  rank = "Try Again";
        }
        int score = 7;
        String status = ""; // TODO: dung toan tu ?: (>= 5 -> "PASS", nguoc lai "FAIL")
        System.out.println("Rank: " + rank + " | Status: " + status);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 5A)</summary>

```java
public class Main {
    public static void main(String[] args) {
        char grade = 'A';
        String rank;
        switch (grade) {
            case 'A':
                rank = "Excellent";
                break;
            case 'B':
                rank = "Good";
                break;
            default:
                rank = "Try Again";
        }
        int score = 7;
        String status = (score >= 5) ? "PASS" : "FAIL";
        System.out.println("Rank: " + rank + " | Status: " + status);
    }
}
```

* **Giải thích:** Nếu quên `break;`, Java tiếp tục chạy xuyên qua tất cả các `case` bên dưới (*fall-through*) cho tới khi gặp `break` hoặc hết `switch`.

</details>

---

#### 🟡 Thực hành 5B: For/Continue — Liệt kê Số nguyên tố & Bẫy `for-each`
- **Mục tiêu:** Dùng `continue` bỏ qua số chẵn > 2 khi kiểm tra nguyên tố đến 20, đồng thời thấy `for-each` không sửa được phần tử mảng nguyên thủy.
- **Expected Output:**
  - `Primes: 2 3 5 7 11 13 17 19`
  - `arr[0] = 10`
- 🔗 [Mở bài lab Slot 05 trên JavaBrew Live Lab](/studio/playground?example=slot-05-lab)

```java
public class Main {
    static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.print("Primes:");
        for (int i = 2; i <= 20; i++) {
            // TODO: Dung continue bo qua so chan > 2, in so nguyen to
        }
        System.out.println();

        int[] arr = { 10, 20 };
        // TODO: Dung for thong thuong bang chi muc i neu muon tang arr[0] len 10
        System.out.println("arr[0] = " + arr[0]);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 5B)</summary>

```java
public class Main {
    static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.print("Primes:");
        for (int i = 2; i <= 20; i++) {
            if (i > 2 && i % 2 == 0) {
                continue;
            }
            if (isPrime(i)) {
                System.out.print(" " + i);
            }
        }
        System.out.println();

        int[] arr = { 10, 20 };
        for (int x : arr) {
            x += 5; // Ban sao cuc bo x bi vut bo sau moi vong lap
        }
        System.out.println("arr[0] = " + arr[0]);
    }
}
```

* **Giải thích:** `for (int x : arr)` chỉ sao chép giá trị phần tử sang biến cục bộ `x`; muốn gán lại phần tử vào mảng phải dùng vòng lặp chỉ số `for (int i = 0; i < arr.length; i++)`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) · [PPTX](/media/pro192/slides/Learning%20the%20Java%20Language.pptx)

---

**Điều hướng:** [← Slot 04](./slot-04.md) | [Mục lục PRO192](../README.md) | [Slot 06 →](./slot-06.md)
