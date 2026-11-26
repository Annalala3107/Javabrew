---
slot: 4
stage: 1
title: "Slot 04: Kiểu dữ liệu Nguyên thủy, Tham chiếu, Toán tử & Phạm vi Biến"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q1–Q4)"
  - "Thi FE"
estimatedMinutes: 30
slidePdf: "/media/pro192/resources/Learning%20the%20Java%20Language.pdf"
slidePptx: "/media/pro192/slides/Learning%20the%20Java%20Language.pptx"
peRefs:
  - "PE1-Q1"
  - "PE3-Q1"
  - "PE3-Q4"
---

# Slot 04: Kiểu dữ liệu Nguyên thủy, Tham chiếu, Toán tử & Phạm vi Biến

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 1: Khởi động, Môi trường & Nền tảng Cú pháp Java
- **Trọng tâm thi:** `Thi PE (Q1–Q4)` `Thi FE` | **Thời lượng gợi ý:** ~30 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) · [Slide PPTX](/media/pro192/slides/Learning%20the%20Java%20Language.pptx)
- **Liên kết đề PE thật:** `PE1-Q1` · `PE3-Q1` · `PE3-Q4` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Làm chủ 8 kiểu dữ liệu nguyên thủy (kích thước, miền giá trị) và kiểu tham chiếu/mảng 1D–2D.
- Phân biệt ép kiểu ngầm định (widening) vs ép kiểu tường minh (narrowing) và rủi ro tràn/cắt bit.
- Nắm độ ưu tiên toán tử, phép chia nguyên (`int / int`), dịch bit (`>>` vs `>>>`) và phạm vi biến (scope).

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Learning the Java Language.pptx` (từ slide *Keywords and Identifiers* đến slide *Scope of a Variable*).

### 5.1. Từ Khóa (Keywords) Và Quy Ước Định Danh (Identifiers)
Slide *Keywords and Identifiers* quy định rõ:
* **Từ khóa (Keywords):** Là các từ dành riêng của ngôn ngữ Java (như `public`, `class`, `static`, `void`, `int`, `if`, `while`...).
* **Định danh (Identifiers):** Là tên do người lập trình đặt cho biến, phương thức, lớp, giao diện:
  * Phải bắt đầu bằng một chữ cái (Letter), ký tự `$`, hoặc dấu gạch dưới `_`.
  * Các ký tự tiếp theo có thể chứa chữ cái, chữ số (Digits), `$`, hoặc `_`.
  * Phân biệt nghiêm ngặt chữ hoa và chữ thường (Case-sensitive).
  * **Tuyệt đối không được trùng với các từ khóa** của Java.

### 5.2. Hệ Thống 8 Kiểu Dữ Liệu Nguyên Thủy (Primitive Data Types)

![8 kiểu dữ liệu nguyên thủy trong Java](/media/pro192/images/PrimaryDataType.png)

![Kiểu tham chiếu trong Java](/media/pro192/images/referenceDataType.png)

Slide *Primitive Data Types - Variables* phân tích các kiểu dữ liệu cơ sở được lưu trữ trực tiếp trên vùng nhớ **Stack**:

| Kiểu dữ liệu | Kích thước | Miền giá trị biểu diễn | Quy cách biểu diễn hằng số |
| :--- | :---: | :--- | :--- |
| `byte` | 1 byte (8 bits) | `-2^7` (-128) đến `2^7 - 1` (127) | Số nguyên có dấu |
| `short` | 2 bytes (16 bits) | `-2^15` (-32,768) đến `2^15 - 1` (32,767) | Số nguyên có dấu |
| `int` | 4 bytes (32 bits) | `-2^31` đến `2^31 - 1` | Mặc định cho số nguyên (ví dụ: `100`, `0x1A`) |
| `long` | 8 bytes (64 bits) | `-2^63` đến `2^63 - 1` | Thêm hậu tố `L` hoặc `l` (ví dụ: `1000L`) |
| `float` | 4 bytes (32 bits) | Chuẩn IEEE 754 số thực dấu phẩy động | Thêm hậu tố `F` hoặc `f` (ví dụ: `3.14F`) |
| `double` | 8 bytes (64 bits) | Chuẩn IEEE 754 số thực dấu phẩy động | Mặc định cho số thực (ví dụ: `3.14`) |
| `char` | 2 bytes (16 bits) | `\u0000` (0) đến `\uFFFF` (65,535) | Ký tự Unicode đặt trong nháy đơn: `'A'` |
| `boolean` | Tùy JVM | Chỉ nhận một trong hai giá trị chân lý | `true` hoặc `false` |

### 5.3. Kiểu Dữ Liệu Tham Chiếu (Reference Types) & Mảng
* **Bản chất biến tham chiếu:** Khác với kiểu nguyên thủy lưu trực tiếp giá trị trên Stack, biến tham chiếu chỉ lưu **địa chỉ ô nhớ** trỏ đến đối tượng thực tế được cấp phát động trên vùng nhớ **Heap**. Khi một biến tham chiếu chưa trỏ đến bất kỳ đối tượng nào, giá trị của nó là `null`.
* **Mảng một chiều (One-Dimensional Arrays):**
  * Bản chất mảng trong Java là một đối tượng tham chiếu.
  * Khai báo và khởi tạo: `int[] a = new int[5];` hoặc khởi tạo trực tiếp kèm giá trị: `int[] a = {1, 2, 3, 4, 5};`.
  * Thuộc tính `a.length` trả về số lượng phần tử cố định của mảng.
  * Sao chép mảng hiệu năng cao bằng phương thức hệ thống: `System.arraycopy(src, srcPos, dest, destPos, length)`.
* **Mảng nhiều chiều (Multi-Dimensional Arrays):**
  * Trong Java, mảng hai chiều thực chất là một mảng chứa các tham chiếu trỏ đến các mảng một chiều con.
  * Do đó, các hàng trong mảng hai chiều có thể có độ dài khác nhau (Ragged Array).

### 5.4. Hệ Thống Toán Tử (Operators) & Dịch Bit Không Dấu

![Hệ thống toán tử trong Java](/media/pro192/images/operator.png)

Slide *Operators* liệt kê thứ tự ưu tiên từ cao xuống thấp của các toán tử trong Java:
1. **Toán tử đơn (Unary):** `++`, `--`, `+`, `-`, `!`, `~`, ép kiểu `(type)`.
2. **Toán tử số học (Arithmetic):** `*`, `/`, `%` sau đó đến `+`, `-`.
3. **Toán tử dịch bit (Shift Operators):**
   * `<<`: Dịch trái (Shift left).
   * `>>`: Dịch phải số học (Arithmetic shift right - giữ nguyên bit dấu cao nhất).
   * `>>>`: **Dịch phải không dấu (Unsigned shift right)**: Luôn chèn thêm bit `0` vào vị trí ngoài cùng bên trái bất kể số ban đầu là âm hay dương.
   * *Ví dụ phân tích:* Giá trị `-1` kiểu `int` trong hệ thống bù 2 gồm 32 bit `1`. Khi thực hiện `-1 >>> 1`, bit `0` được chèn vào bên trái tạo ra chuỗi bit `0111...1111`, cho kết quả là số nguyên dương lớn nhất: `2147483647` (`2^31 - 1`).
4. **Toán tử so sánh:** `<`, `<=`, `>`, `>=`, `instanceof`, tiếp theo là `==`, `!=`.
5. **Toán tử thao tác bit:** `&` (AND), `^` (XOR), `|` (OR).
6. **Toán tử logic đoản mạch (Short-circuit):** `&&`, `||`.
7. **Toán tử điều kiện 3 ngôi:** `?:`.
8. **Toán tử gán:** `=`, `+=`, `-=`, `*=`,... (thực hiện từ phải sang trái).

### 5.5. Chuyển Đổi Kiểu Dữ Liệu & Rủi Ro Khi Ép Kiểu Tường Minh
Slide *Type Conversions and Explicit Casting* phân biệt rõ hai cơ chế:
* **Chuyển đổi nới rộng (Widening Conversion):** Chuyển từ kiểu có kích thước nhỏ hơn sang kiểu có kích thước lớn hơn (ví dụ từ `byte` sang `short`, `int`, `long`). Quá trình này diễn ra hoàn toàn tự động, an toàn và không mất mát dữ liệu.
* **Chuyển đổi thu hẹp (Narrowing Conversion) & Ép kiểu (Explicit Casting):**
  * Chuyển từ kiểu có kích thước lớn hơn sang kiểu nhỏ hơn (ví dụ từ `short` xuống `byte`).
  * Trình biên dịch sẽ **báo lỗi biên dịch** nếu cố tình gán trực tiếp: `byte b = s;` (với `s` là kiểu `short`).
  * Bắt buộc phải sử dụng cú pháp ép kiểu tường minh: `byte b = (byte) s;`.
  * **Rủi ro mất độ chính xác (Loss of precision):** Ví dụ trong mã nguồn bài giảng `Casting_Convert_1.java`, nếu `s = 256` (dạng nhị phân 16-bit: `0000 0001 0000 0000`), khi ép xuống `byte` (8-bit), Java cắt bỏ 8 bit cao, chỉ giữ lại 8 bit thấp là `0000 0000`, khiến giá trị của biến `b` in ra màn hình bị biến thành `0`.
* **Quy tắc về boolean:** Kiểu `boolean` trong Java tuyệt đối không thể ép kiểu hoặc chuyển đổi sang bất kỳ kiểu dữ liệu số nào và ngược lại.

### 5.6. Phạm Vi Hoạt Động Của Biến (Scope of a Variable)
Slide *Scope* và tệp demo `ScopeDemo.java` quy định:
* Phạm vi của một biến cục bộ được xác định chặt chẽ bởi **khối lệnh chứa nó (Block Scope)**, tính từ thời điểm khai báo cho đến dấu ngoặc nhọn đóng `}` kết thúc khối lệnh đó.
* Các biến khai báo bên trong khối lệnh `if`, `while`, hoặc vòng lặp `for` sẽ bị hủy và hoàn toàn không thể truy xuất từ bên ngoài khối lệnh đó.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 04:**
> - Bẫy chia số nguyên trong PE: `int a = 5, b = 2; double x = a / b;` ra `2.0` thay vì `2.5` — phải ép `(double) a / b`.
> - Phép gán rút gọn như `byte b = 1; b += 1;` tự ép kiểu ẩn nên compile được, còn `b = b + 1;` **lỗi biên dịch** vì `b + 1` thăng hạng thành `int`.
> - Cẩn thận phạm vi biến cục bộ (local variable) không có giá trị mặc định: chưa gán giá trị mà đem dùng sẽ lỗi compile.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 4.1: Kiểm tra tính hợp lệ của định danh

**Đề bài:** Trong các tên biến sau, tên nào hợp lệ và tên nào không hợp lệ theo quy ước của Java?
1. `3rdValue`
2. `_user_name`
3. `$account_balance`
4. `goto`

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* `3rdValue`: **Không hợp lệ** vì định danh không được phép bắt đầu bằng ký tự chữ số.
* `_user_name`: **Hợp lệ** vì bắt đầu bằng dấu gạch dưới `_`.
* `$account_balance`: **Hợp lệ** vì bắt đầu bằng ký tự `$`.
* `goto`: **Không hợp lệ** vì trùng với từ khóa dành riêng của ngôn ngữ Java.

</details>

---

### Bài 4.2: Kích thước bộ nhớ các kiểu dữ liệu nguyên thủy

**Đề bài:** Điền kích thước lưu trữ chính xác (tính theo byte) cho các kiểu dữ liệu sau: `byte`, `short`, `int`, `long`, `double`, `char`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* `byte`: 1 byte (8 bits).
* `short`: 2 bytes (16 bits).
* `int`: 4 bytes (32 bits).
* `long`: 8 bytes (64 bits).
* `double`: 8 bytes (64 bits).
* `char`: 2 bytes (16 bits, theo bảng mã Unicode).

</details>

---

### Bài 4.3: Cơ chế cắt bit khi ép kiểu tường minh

**Đề bài:** Cho đoạn mã Java sau:
```java
int value = 261;
byte result = (byte) value;
System.out.println(result);
```
Xác định giá trị in ra màn hình của biến `result` và giải thích bản chất thao tác nhị phân.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `5`
* **Giải thích cơ chế:**
  * Giá trị thập phân `261` ở dạng nhị phân 32-bit là: `00000000 00000000 00000001 00000101`.
  * Khi ép kiểu xuống `byte` (8-bit), hệ thống cắt bỏ toàn bộ 24 bit cao bên trái, chỉ giữ lại 8 bit thấp nhất: `00000101`.
  * Chuỗi bit `00000101` chuyển đổi sang hệ thập phân chính là `2^2 + 2^0 = 5`.

</details>

---

### Bài 4.4: Bản chất toán tử dịch bit có dấu và không dấu

**Đề bài:** Phân tích sự khác biệt giữa hai biểu thức `x >> 2` và `x >>> 2` khi `x` mang giá trị số nguyên âm.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Toán tử `>>` (Dịch phải số học): Dịch chuyển các bit sang phải và **bảo toàn bit dấu** (nếu bit dấu cao nhất ban đầu là `1`, các bit mới chèn vào bên trái cũng là bit `1`). Kết quả sau khi dịch vẫn là một số âm.
* Toán tử `>>>` (Dịch phải không dấu): Dịch chuyển các bit sang phải và **luôn luôn chèn bit `0` vào vị trí cao nhất bên trái**. Kết quả sau khi dịch lập tức biến đổi thành một số nguyên dương rất lớn.

</details>

---

### Bài 4.5: Lỗi biên dịch do vi phạm phạm vi biến

**Đề bài:** Đoạn mã sau có biên dịch thành công không? Nếu không, chỉ rõ dòng lỗi và cách sửa:
```java
public class TestBlockScope {
    public static void main(String[] args) {
        int n = 10;
        if (n > 5) {
            int total = 100;
            System.out.println("Trong khoi if: " + total);
        }
        System.out.println("Ngoai khoi if: " + total);
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Lỗi biên dịch:** Dòng lệnh `System.out.println("Ngoai khoi if: " + total);` bị báo lỗi không tìm thấy biến `total` (cannot find symbol).
* **Nguyên nhân:** Biến `total` được khai báo trong khối lệnh `if { ... }`. Phạm vi tồn tại của nó chấm dứt ngay khi gặp dấu ngoặc nhọn đóng `}` của khối `if`.
* **Cách sửa:** Khai báo biến `total` ở ngoài khối `if` (ngang hàng với `int n = 10;`) trước khi gán giá trị bên trong khối.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 4A: Type Casting — Sửa Bẫy Chia nguyên & Ép kiểu `byte`
- **Mục tiêu:** Ép `(double)` trước khi chia `5 / 2` để tránh kết quả bị cụt thành `2.0`, và xem cơ chế tràn `byte`.
- **Expected Output:**
  - `Chia dung: 2.50`
  - `(byte) 261 = 5`

```java
public class Main {
    public static void main(String[] args) {
        int a = 5, b = 2;
        // TODO: Sua bieu thuc chia de ra 2.50 thay vi 2.00
        double ratio = a / b;
        byte truncated = (byte) 261;
        System.out.printf("Chia dung: %.2f%n", ratio);
        System.out.println("(byte) 261 = " + truncated);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 4A)</summary>

```java
public class Main {
    public static void main(String[] args) {
        int a = 5, b = 2;
        double ratio = (double) a / b;
        byte truncated = (byte) 261;
        System.out.printf("Chia dung: %.2f%n", ratio);
        System.out.println("(byte) 261 = " + truncated);
    }
}
```

* **Giải thích:** Trong Java, `int / int` luôn thực hiện chia nguyên trước rồi mới gán sang `double`. Luôn ép ít nhất một vế thành `(double) a / b` — đây là lỗi cực hay mất điểm ở Q1/Q2 PE.

</details>

---

#### 🟡 Thực hành 4B: Thực chiến Tổng, Trung bình & Min của Mảng 1D
- **Mục tiêu:** Duyệt mảng `int[]` tính tổng, tìm phần tử nhỏ nhất và in điểm trung bình 2 chữ số thập phân.
- **Expected Output:**
  - `Sum = 39, Min = 5, Avg = 7.80`
- 🔗 [Mở bài lab Slot 04 trên JavaBrew Live Lab](/studio/playground?example=slot-04-lab)

```java
public class Main {
    public static void main(String[] args) {
        int[] scores = { 8, 5, 10, 7, 9 };
        int sum = 0;
        int min = scores[0];
        // TODO: Tinh sum va cap nhat min
        double avg = (double) sum / scores.length;
        System.out.printf("Sum = %d, Min = %d, Avg = %.2f%n", sum, min, avg);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 4B)</summary>

```java
public class Main {
    public static void main(String[] args) {
        int[] scores = { 8, 5, 10, 7, 9 };
        int sum = 0;
        int min = scores[0];
        for (int i = 0; i < scores.length; i++) {
            sum += scores[i];
            if (scores[i] < min) {
                min = scores[i];
            }
        }
        double avg = (double) sum / scores.length;
        System.out.printf("Sum = %d, Min = %d, Avg = %.2f%n", sum, min, avg);
    }
}
```

* **Giải thích:** Khởi tạo `min = scores[0]` an toàn hơn dùng số cố định như `0` hoặc `999` (vì mảng có thể toàn số âm hoặc số rất lớn).

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md) · [Tổng quan Từ khóa Java (`static`, `final`, `this`, `super`)](../../java/basis/java-keyword-summary.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) · [PPTX](/media/pro192/slides/Learning%20the%20Java%20Language.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (13 ảnh)</summary>

![Sơ đồ Slot 4: keyword](/media/pro192/images/keyword.png)

![Sơ đồ Slot 4: datatype](/media/pro192/images/datatype.png)

![Sơ đồ Slot 4: PrimaryDataType](/media/pro192/images/PrimaryDataType.png)

![Sơ đồ Slot 4: referenceDataType](/media/pro192/images/referenceDataType.png)

![Sơ đồ Slot 4: scope](/media/pro192/images/scope.png)

![Sơ đồ Slot 4: array](/media/pro192/images/array.png)

![Sơ đồ Slot 4: array2](/media/pro192/images/array2.png)

![Sơ đồ Slot 4: copyarray](/media/pro192/images/copyarray.png)

![Sơ đồ Slot 4: 2DarrayCode](/media/pro192/images/2DarrayCode.png)

![Sơ đồ Slot 4: 2Darray](/media/pro192/images/2Darray.png)

![Sơ đồ Slot 4: operator](/media/pro192/images/operator.png)

![Sơ đồ Slot 4: operator2](/media/pro192/images/operator2.png)

![Sơ đồ Slot 4: operator3](/media/pro192/images/operator3.png)

</details>

---

**Điều hướng:** [← Slot 03](./slot-03.md) | [Mục lục PRO192](../README.md) | [Slot 05 →](./slot-05.md)
