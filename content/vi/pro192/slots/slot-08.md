---
slot: 8
stage: 2
title: "Slot 08: Wrapper Classes, Number Hierarchy, Autoboxing/Unboxing & Math"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q1/Q2/Q4)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Numbers%20and%20Strings.pdf"
slidePptx: "/media/pro192/slides/Numbers%20and%20Strings.pptx"
peRefs:
  - "PE1-Q1"
  - "PE1-Q4"
  - "PE5-Q2"
  - "PE5-Q4"
---

# Slot 08: Wrapper Classes, Number Hierarchy, Autoboxing/Unboxing & Math

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 2: Quản lý Bộ nhớ, Wrapper/Math & Chuỗi String/Scanner
- **Trọng tâm thi:** `Thi PE (Q1/Q2/Q4)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Numbers%20and%20Strings.pdf) · [Slide PPTX](/media/pro192/slides/Numbers%20and%20Strings.pptx)
- **Liên kết đề PE thật:** `PE1-Q1` · `PE1-Q4` · `PE5-Q2` · `PE5-Q4` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Sử dụng chuẩn xác `Wrapper Classes` (`Integer`, `Double`, `Character`), Autoboxing/Unboxing và `Number`.
- Làm chủ `Character.isDigit()`, `isLetter()`, `isLowerCase()`, `isUpperCase()` — bộ công cụ giải **80% câu Q1/Q2/Q4 đề PE**.
- Áp dụng đúng `Math` (`random`, `pow`, `abs`, `round`) và tránh lỗi `NullPointerException` khi Unboxing.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Numbers and Strings.pptx` (từ slide *Working with Numbers* đến slide *Characters*).

### 3.1. Nhu cầu sử dụng Lớp bao bọc (Wrapper Classes)
Các kiểu dữ liệu nguyên thủy (`int`, `double`, `char`,...) trong Java không phải là đối tượng và không thuộc cây phân cấp lớp kế thừa (`Object hierarchy`). Chúng được truyền theo cơ chế tham trị và không thể lưu trữ trực tiếp trong các cấu trúc tập hợp hướng đối tượng (như `ArrayList`, `Vector`, `HashMap`) vốn chỉ chấp nhận các đối tượng.

Để giải quyết vấn đề này, Java cung cấp các lớp bao bọc (Wrapper Classes) nằm trong gói `java.lang` nhằm "bọc" một giá trị nguyên thủy bên trong một thực thể đối tượng.

Ba mục đích chính của Wrapper Classes:
1. So sánh các giá trị dưới dạng đối tượng (Compare values in objects).
2. Chuyển đổi qua lại giữa các kiểu dữ liệu khác nhau (Convert values from one data type to another).
3. Kiểm tra và xác định kiểu dữ liệu của một giá trị (Check the data type of a value).

### 3.2. Cây phân cấp các lớp số (The Number Class Hierarchy)
Tất cả các lớp bao bọc số nguyên và số thực đều kế thừa từ lớp trừu tượng `java.lang.Number`:
* `java.lang.Object`
  * `java.lang.Boolean`
  * `java.lang.Character`
  * `java.lang.Number` (abstract class)
    * `Byte`
    * `Short`
    * `Integer`
    * `Long`
    * `Float`
    * `Double`

Đặc tính kỹ thuật cốt lõi:
* Tất cả các lớp Wrapper đều được khai báo với từ khóa `public final class`. Do có từ khóa `final`, không thể tạo lớp con kế thừa từ Wrapper class.
* **Tính bất biến (Immutable):** Các đối tượng Wrapper không thể bị thay đổi giá trị sau khi được khởi tạo vì các lớp này không cài đặt phương thức Setter.
* Mọi lớp con của `Number` đều kế thừa các phương thức trích xuất giá trị nguyên thủy: `byteValue()`, `shortValue()`, `intValue()`, `longValue()`, `floatValue()`, `doubleValue()`.

### 3.3. Cơ chế Autoboxing và Unboxing
* **Autoboxing (Tự động đóng gói):** Quá trình máy ảo JVM tự động chuyển đổi một giá trị nguyên thủy thành một đối tượng thuộc lớp Wrapper tương ứng:
  ```java
  int n = 7;
  Integer intObj = n; // Autoboxing
  ```
* **Unboxing (Tự động mở gói):** Quá trình máy ảo tự động lấy giá trị nguyên thủy được bọc bên trong một đối tượng Wrapper:
  ```java
  int y = intObj * 2; // Unboxing intObj thành int để nhân với 2
  ```
* **Chuyển đổi chuỗi thành số (Parsing methods):**
  * `int val = Integer.parseInt("1234");` chuyển đổi chuỗi thành số nguyên hệ thập phân.
  * `int hexVal = Integer.parseInt("1A", 16);` chuyển đổi chuỗi hệ cơ số 16 thành số nguyên thập phân `26`.

### 3.4. Lớp toán học `java.lang.Math`
Lớp `Math` cung cấp các hằng số toán học và các phương thức tĩnh phục vụ tính toán:
* **Hằng số tĩnh:** `Math.PI` và `Math.E`.
* **Phương thức làm tròn:**
  * `Math.ceil(d)`: Làm tròn lên số nguyên nhỏ nhất lớn hơn hoặc bằng `d`.
  * `Math.floor(d)`: Làm tròn xuống số nguyên lớn nhất nhỏ hơn hoặc bằng `d`.
* **Phương thức số học nâng cao:**
  * `Math.abs(x)`: Trả về giá trị tuyệt đối.
  * `Math.sqrt(d)`: Tính căn bậc hai.
  * `Math.pow(base, exp)`: Tính lũy thừa.
* **Sinh số ngẫu nhiên:**
  * `Math.random()`: Trả về số thực `double` ngẫu nhiên trong khoảng nửa mở: `0.0 <= giá trị < 1.0`.

### 3.5. Lớp thao tác ký tự `java.lang.Character`
Ký tự trong Java chiếm 2 bytes, đại diện cho bảng mã Unicode 16-bit. Lớp `Character` cung cấp các phương thức tiện ích:
* `Character.isLetter(ch)`: Kiểm tra ký tự chữ cái.
* `Character.isDigit(ch)`: Kiểm tra ký tự chữ số.
* `Character.isUpperCase(ch)`: Kiểm tra chữ in hoa.
* `Character.toUpperCase(ch)` / `Character.toLowerCase(ch)`: Chuyển đổi định dạng chữ hoa/chữ thường.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 08:**
> - Bẫy Integer Cache (`-128..127`): so sánh `Integer a = 127, b = 127; a == b` là `true`, nhưng `200 == 200` là `false` → **luôn dùng `.equals()`** với Wrapper!
> - Bẫy PE Q1/Q4: khi xử lý ký tự trong từ, đừng kiểm tra thủ công ASCII lỗi dấu; dùng `Character.isDigit(c)` / `Character.isLetter(c)` an toàn tuyệt đối trên JDK 8.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 8.1: Tính chất bất biến của Wrapper Classes

**Đề bài:** Tại sao bài giảng lại khẳng định rằng: *"Wrapper classes are immutable (non-changeable)"*? Tính chất này bắt nguồn từ việc lớp không có phương thức nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Đối tượng Wrapper là bất biến (`immutable`) vì một khi đã được khởi tạo với một giá trị, giá trị chứa bên trong nó không bao giờ có thể bị thay đổi.
* Nguyên nhân kỹ thuật: Trong thiết kế của tất cả các lớp Wrapper (như `Integer`, `Double`, `Character`), **không có bất kỳ phương thức Setter nào được cài đặt**.

</details>

---

### Bài 8.2: Phân tích cơ chế Autoboxing & Unboxing

**Đề bài:** Chỉ ra dòng lệnh nào thực hiện **Autoboxing** và dòng lệnh nào thực hiện **Unboxing** trong đoạn mã sau:
```java
Integer a = 50; 
int b = a + 10; 
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Dòng `Integer a = 50;`: Thực hiện **Autoboxing** (tự động chuyển giá trị nguyên thủy `50` kiểu `int` thành đối tượng `Integer` tương ứng).
* Dòng `int b = a + 10;`: Thực hiện **Unboxing** (máy ảo tự động mở gói đối tượng `a` lấy giá trị nguyên thủy `50` ra để cộng với số nguyên `10`, sau đó gán vào biến nguyên thủy `b`).

</details>

---

### Bài 8.3: Chuyển đổi chuỗi thành số nguyên theo các hệ cơ số khác nhau

**Đề bài:** Cho hai dòng lệnh sau trong slide `WrapperDemo.java`:
```java
int x = Integer.parseInt("1234");
int y = Integer.parseInt("1A", 16);
```
Xác định giá trị của `x` và `y` khi in ra màn hình ở hệ thập phân.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Giá trị của `x`: `1234` (chuyển đổi chuỗi ký tự dạng thập phân chuẩn).
* Giá trị của `y`: `26` (chuỗi `"1A"` ở hệ cơ số 16 được tính là: `1 × 16^1 + 10 × 16^0 = 16 + 10 = 26`).

</details>

---

### Bài 8.4: Phương thức làm tròn của lớp Math

**Đề bài:** Xác định kết quả của các biểu thức toán học sau:
1. `Math.ceil(7.2)`
2. `Math.floor(7.8)`

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

1. `Math.ceil(7.2)` trả về **`8.0`** (hàm `ceil` làm tròn lên số nguyên nhỏ nhất lớn hơn hoặc bằng tham số truyền vào).
2. `Math.floor(7.8)` trả về **`7.0`** (hàm `floor` làm tròn xuống số nguyên lớn nhất nhỏ hơn hoặc bằng tham số truyền vào).

</details>

---

### Bài 8.5: Kiểm tra và xử lý ký tự với `Character`

**Đề bài:** Đoạn mã sau in ra giá trị gì?
```java
char c = '9';
if (Character.isDigit(c)) {
    int value = Character.getNumericValue(c);
    System.out.println("Gia tri: " + (value * 2));
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `Gia tri: 18`
* **Giải thích:** `Character.isDigit('9')` kiểm tra đúng ký tự `'9'` là chữ số (trả về `true`). Phương thức `Character.getNumericValue('9')` trích xuất giá trị số nguyên thực sự của ký tự đó là số `9`. Do đó `value * 2 = 9 * 2 = 18`.

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 8A: W3Schools Wrapper — Bẫy Integer Cache `127` vs `200`
- **Mục tiêu:** Sửa phép so sánh `x == y` của `Integer` thành `.equals()` và chuyển chuỗi `"42"` sang `int`.
- **Expected Output:**
  - `127 == 127: true`
  - `200 equals 200: true`
  - `Parsed + 8 = 50`

```java
public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer x = 200, y = 200;
        System.out.println("127 == 127: " + (a == b));
        // TODO: Sua x == y thanh so sanh gia tri dung bang .equals()
        System.out.println("200 equals 200: " + (x == y));
        int parsed = 0; // TODO: Integer.parseInt("42")
        System.out.println("Parsed + 8 = " + (parsed + 8));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 8A)</summary>

```java
public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer x = 200, y = 200;
        System.out.println("127 == 127: " + (a == b));
        System.out.println("200 equals 200: " + x.equals(y));
        int parsed = Integer.parseInt("42");
        System.out.println("Parsed + 8 = " + (parsed + 8));
    }
}
```

* **Giải thích:** JVM chỉ cache sẵn `Integer` trong khoảng `-128..127`. Từ `128` trở lên, `Integer x = 200; Integer y = 200;` là 2 đối tượng khác địa chỉ nên `==` trả `false`.

</details>

---

#### 🟡 Thực hành 8B: Character API & `Math` — Đếm Chữ cái / Chữ số (Cầu nối PE Q1 & Q4)
- **Mục tiêu:** Dùng `Character.isLetter()`, `Character.isDigit()` và `Math.round(Math.sqrt(50))` chuẩn JDK 8.
- **Expected Output:**
  - `Letters=7, Digits=4, Math=7`
- 🔗 [Mở bài lab Slot 08 trên Code Studio Tryit](/studio/playground?example=slot-08-lab)

```java
public class Main {
    public static void main(String[] args) {
        String s = "PRO192_Java8!";
        int letters = 0, digits = 0;
        // TODO: Dem bang Character.isLetter(c) va Character.isDigit(c)
        long approx = 0; // TODO: Math.round(Math.sqrt(50))
        System.out.println("Letters=" + letters + ", Digits=" + digits + ", Math=" + approx);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 8B)</summary>

```java
public class Main {
    public static void main(String[] args) {
        String s = "PRO192_Java8!";
        int letters = 0, digits = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isLetter(c)) {
                letters++;
            } else if (Character.isDigit(c)) {
                digits++;
            }
        }
        long approx = Math.round(Math.sqrt(50));
        System.out.println("Letters=" + letters + ", Digits=" + digits + ", Math=" + approx);
    }
}
```

* **Giải thích:** Combo `Character.isLetter(c)` / `isDigit(c)` / `isLowerCase(c)` giải quyết trực tiếp đa số câu Q1 và Q4 PE (như `PE1-Q1 Crocus`, `PE1-Q4 MyString`, `PE5-Q4`).

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Numbers%20and%20Strings.pdf) · [PPTX](/media/pro192/slides/Numbers%20and%20Strings.pptx)

---

**Điều hướng:** [← Slot 07](./slot-07.md) | [Mục lục PRO192](../README.md) | [Slot 09 →](./slot-09.md)
