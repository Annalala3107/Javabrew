---
slot: 11
stage: 3
title: "Slot 11: Kỹ thuật Thiết kế Class, Nguyên lý Cohesion & Coupling"
category: PRO192
lang: vi
examFocus:
  - "Nền tảng OOP"
  - "Thi FE"
estimatedMinutes: 20
slidePdf: "/media/pro192/resources/Introduction.pdf"
slidePptx: "/media/pro192/slides/Introduction.pptx"
peRefs: []
---

# Slot 11: Kỹ thuật Thiết kế Class, Nguyên lý Cohesion & Coupling

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 3: 4 Trụ cột OOP, Thiết kế Class & Encapsulation
- **Trọng tâm thi:** `Nền tảng OOP` `Thi FE` | **Thời lượng gợi ý:** ~20 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Introduction.pdf) · [Slide PPTX](/media/pro192/slides/Introduction.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Trích xuất đúng danh sách Class, Fields và Methods từ đề bài mô tả bằng tiếng Anh (Q1–Q3 PE).
- Thiết kế Class đạt High Cohesion (gắn kết cao) và Low Coupling (phụ thuộc lỏng lẻo).
- Đọc hiểu chuẩn ký hiệu UML của đề PE (`-`: private, `+`: public, `#`: protected) và chữ ký phương thức.

## 2. Lý thuyết cốt lõi

### 2.1. Quy tắc trích xuất Class, Fields và Methods từ ngôn ngữ tự nhiên

![Ký hiệu lớp UML chuẩn](/media/pro192/images/classUML.png)

![Các mối quan hệ giữa các lớp trong UML](/media/pro192/images/class_relationships.png)

Để chuyển đổi một bài toán thực tế thành mã nguồn Java, lập trình viên phân tích cú pháp câu văn mô tả nghiệp vụ theo quy tắc:
* **Danh từ chính (Main noun) → Lớp (Class):** Thực thể trung tâm (ví dụ: `Student`, `Car`, `Item`).
* **Danh từ phụ/bổ nghĩa (Auxiliary nouns) → Thuộc tính (Fields / Instance variables):** Trạng thái, đặc điểm của thực thể (ví dụ: `code`, `name`, `price`, `color`).
* **Động từ liên quan (Verbs related to main noun) → Phương thức (Methods):** Hành vi, thao tác xử lý của thực thể (ví dụ: `input()`, `output()`, `startEngine()`).

### 2.2. Nguyên lý Phụ thuộc (Coupling)
Coupling là thước đo mức độ phụ thuộc giữa các thực thể phần mềm.
* **High coupling (Phụ thuộc cao - Thiết kế tồi):** Đối tượng A can thiệp sâu hoặc dựa dẫm trực tiếp vào các thành phần cấu tạo nội bộ của đối tượng B. Khi cấu trúc của B thay đổi, A bị phá vỡ hoàn toàn. Ví dụ: Lớp `Head` quản lý trực tiếp các biến rời rạc `Eye1`, `Eye2`.
* **Low coupling (Phụ thuộc thấp - Thiết kế tốt):** Tách `Eye` thành một lớp độc lập. Lớp `Head` chỉ nắm giữ hai biến tham chiếu trỏ đến đối tượng `Eye`. Cấu trúc của mắt có thay đổi ra sao cũng không làm ảnh hưởng đến mã nguồn của `Head`.

### 2.3. Nguyên lý Gắn kết (Cohesion)
Cohesion là thước đo mức độ tập trung vào một nhiệm vụ duy nhất của một lớp hoặc phương thức.
* **Low cohesion (Gắn kết thấp - Thiết kế tồi):** Một phương thức hoặc lớp ôm đồm nhiều chức năng không liên quan (ví dụ: một hàm vừa đọc dữ liệu từ bàn phím, vừa tính toán phức tạp, vừa ghi vào tệp tin).
* **High cohesion (Gắn kết cao - Thiết kế tốt):** Mỗi phương thức chỉ thực hiện một nhiệm vụ chuyên biệt (`calculateTax()`, `printInvoice()`). Khi cần phối hợp, một phương thức điều phối sẽ gọi tuần tự các phương thức đơn này.
* **Khẩu hiệu cốt lõi:** *"High Cohesion, Low Coupling"* (Gắn kết cao, Phụ thuộc thấp).

### 2.4. Chữ ký phương thức (Method Signature)
Chữ ký phương thức là định danh kỹ thuật để trình biên dịch và JVM phân biệt các phương thức trong cùng một lớp.
* **Cấu tạo chữ ký phương thức gồm chính xác 2 thành phần:**
  1. **Tên phương thức (Method name)**
  2. **Thứ tự và kiểu dữ liệu của các tham số đầu vào (Order and types of parameters)**
* **Lưu ý đặc biệt:** **Kiểu dữ liệu trả về (Return Type) KHÔNG thuộc chữ ký phương thức.** Do đó, hai phương thức cùng tên, cùng danh sách tham số nhưng khác kiểu trả về sẽ bị trình biên dịch báo lỗi xung đột chữ ký.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 11:**
> - Đọc sai bảng UML đề PE là mất trắng điểm: kiểu trả về nằm **sau dấu hai chấm** (`+getDesert():String` nghĩa là `public String getDesert()`).
> - Chữ ký phương thức (Method Signature) chỉ gồm **tên hàm + danh sách kiểu tham số** — KHÔNG bao gồm kiểu trả về!

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 11.1: Trích xuất thành phần lớp từ mô tả nghiệp vụ

**Đề bài:** Phân tích câu sau để xác định Class, Fields và Methods: *"Một chiếc xe hơi (Car) có màu sơn (color), công suất động cơ (enginePower) và trạng thái mui trần (isConvertible). Chiếc xe có thể khởi động (startEngine) và đạp ga tăng tốc (accelerate)"*.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Class:* `Car`.
* *Fields:* `color` (String), `enginePower` (int), `isConvertible` (boolean).
* *Methods:* `startEngine()`, `accelerate()`.

</details>

---

### Bài 11.2: Nhận diện và tối ưu hóa Low Cohesion

**Đề bài:** Phương thức `manageEmployees()` thực hiện đồng thời: (1) Nhập danh sách nhân viên từ file CSV, (2) Tính toán tiền lương và thuế thu nhập cá nhân, (3) In phiếu lương ra máy in. Phương thức này có vấn đề gì và khắc phục như thế nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Vấn đề:* Low Cohesion (gắn kết thấp), vi phạm nguyên lý đơn nhiệm khi gộp đọc dữ liệu, xử lý tính toán tài chính và xuất thiết bị ngoại vi vào một nơi.
* *Khắc phục:* Tách thành 3 phương thức chuyên biệt:
  1. `readFromCSV(String path)`
  2. `calculateSalaryAndTax(Employee emp)`
  3. `printPayslip(SalarySlip slip)`

</details>

---

### Bài 11.3: So sánh kiến trúc High Coupling và Low Coupling

**Đề bài:** Tại sao slide bài giảng khẳng định việc xây dựng lớp `Head` chứa hai tham chiếu `leftEye` và `rightEye` thuộc lớp `Eye` lại có chất lượng thiết kế vượt trội hơn việc khai báo các thuộc tính của mắt trực tiếp trong `Head`?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Tách lớp `Eye` giúp đạt Low Coupling. Khi lớp `Eye` cần bổ sung thêm các tính năng mới (như chớp mắt, đổi màu mắt), lớp `Head` hoàn toàn không bị ảnh hưởng. Nếu nhúng thẳng vào `Head`, mọi sửa đổi nhỏ của mắt đều buộc lập trình viên phải mở mã nguồn của `Head` ra chỉnh sửa và biên dịch lại.

</details>

---

### Bài 11.4: Quy tắc Chữ ký phương thức và Lỗi biên dịch

**Đề bài:** Đoạn mã sau có biên dịch thành công không? Vì sao?
```java
public class Calculator {
    public int compute(int a, double b) { return a; }
    public double compute(int x, double y) { return x + y; }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Đoạn mã **bị lỗi biên dịch**: `method compute(int, double) is already defined in class Calculator`.
* *Giải thích:* Cả hai phương thức đều có tên là `compute` và cùng danh sách kiểu tham số là `(int, double)`. Tên biến (`a, b` vs `x, y`) và kiểu dữ liệu trả về (`int` vs `double`) không thuộc chữ ký phương thức, khiến trình biên dịch coi đây là hai khai báo trùng lặp hoàn toàn.

</details>

---

### Bài 11.5: Thứ tự kiểu tham số trong Chữ ký phương thức

**Đề bài:** Hai phương thức sau có thể cùng tồn tại trong một lớp không?
```java
public void log(String tag, int code) { }
public void log(int code, String tag) { }
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Hai phương thức **hoàn toàn có thể cùng tồn tại**.
* *Giải thích:* Phương thức thứ nhất có chữ ký là `log(String, int)`, phương thức thứ hai có chữ ký là `log(int, String)`. Do **thứ tự kiểu dữ liệu tham số khác nhau**, chữ ký của chúng là riêng biệt (đây là kỹ thuật Method Overloading hợp lệ).

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 11A: UML -> Java Code — Chuyển Sơ đồ Lớp sang Code Chuẩn
- **Mục tiêu:** Đọc bảng UML (`-id: String`, `-gpa: double`, `+isHonors(): boolean`) và cài đặt đúng kiểu trả về sau dấu hai chấm `:`.
- **Expected Output:**
  - `SE1801 honors = true`

```java
class StudentCard {
    private String id;
    private double gpa;

    public StudentCard(String id, double gpa) {
        this.id = id;
        this.gpa = gpa;
    }

    // TODO: Viet public String getId() va public boolean isHonors() (gpa >= 8.0)
}

public class Main {
    public static void main(String[] args) {
        StudentCard s = new StudentCard("SE1801", 8.5);
        System.out.println(s.getId() + " honors = " + s.isHonors());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 11A)</summary>

```java
class StudentCard {
    private String id;
    private double gpa;

    public StudentCard(String id, double gpa) {
        this.id = id;
        this.gpa = gpa;
    }

    public String getId() {
        return id;
    }

    public boolean isHonors() {
        return gpa >= 8.0;
    }
}

public class Main {
    public static void main(String[] args) {
        StudentCard s = new StudentCard("SE1801", 8.5);
        System.out.println(s.getId() + " honors = " + s.isHonors());
    }
}
```

* **Giải thích:** Nhớ quy tắc UML trong đề PE: `-` là `private`, `+` là `public`, và kiểu dữ liệu / kiểu trả về đứng **sau dấu hai chấm** (`+getId(): String`).

</details>

---

#### 🟡 Thực hành 11B: Method Overloading — Nạp chồng `area()` theo Danh sách Tham số
- **Mục tiêu:** Viết các phiên bản nạp chồng `area(...)` khác nhau về danh sách tham số (hình vuông, hình chữ nhật, hình tròn).
- **Expected Output:**
  - `16.00 | 15.00 | 12.57`
- 🔗 [Mở bài lab Slot 11 trên JavaBrew Live Lab](/studio/playground?example=slot-11-lab)

```java
public class Main {
    static double area(double side) {
        return side * side;
    }

    // TODO: Viet them static double area(double w, double h) va area(double r, boolean isCircle)

    public static void main(String[] args) {
        System.out.printf("%.2f | %.2f | %.2f%n", area(4), area(3, 5), area(2, true));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 11B)</summary>

```java
public class Main {
    static double area(double side) {
        return side * side;
    }

    static double area(double w, double h) {
        return w * h;
    }

    static double area(double r, boolean isCircle) {
        return isCircle ? Math.PI * r * r : 0.0;
    }

    public static void main(String[] args) {
        System.out.printf("%.2f | %.2f | %.2f%n", area(4), area(3, 5), area(2, true));
    }
}
```

* **Giải thích:** Overloading yêu cầu cùng tên hàm và **khác danh sách tham số** (số lượng hoặc kiểu tham số) — chỉ đổi mỗi kiểu trả về sẽ bị lỗi biên dịch.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Tổng hợp Design Patterns trong OOP & System Design](../../system-design/design-pattern.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Introduction.pdf) · [PPTX](/media/pro192/slides/Introduction.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (3 ảnh)</summary>

![Sơ đồ Slot 11: classUML](/media/pro192/images/classUML.png)

![Sơ đồ Slot 11: class_relationships](/media/pro192/images/class_relationships.png)

![Sơ đồ Slot 11: relationship](/media/pro192/images/relationship.png)

</details>

---

**Điều hướng:** [← Slot 10](./slot-10.md) | [Mục lục PRO192](../README.md) | [Slot 12 →](./slot-12.md)
