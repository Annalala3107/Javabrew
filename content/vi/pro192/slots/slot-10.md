---
slot: 10
stage: 3
title: "Slot 10: 4 Trụ cột OOP & Tư duy Mô hình hóa Hướng đối tượng"
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

# Slot 10: 4 Trụ cột OOP & Tư duy Mô hình hóa Hướng đối tượng

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 3: 4 Trụ cột OOP, Thiết kế Class & Encapsulation
- **Trọng tâm thi:** `Nền tảng OOP` `Thi FE` | **Thời lượng gợi ý:** ~20 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Introduction.pdf) · [Slide PPTX](/media/pro192/slides/Introduction.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt tư duy Lập trình Thủ tục (Procedural) vs Lập trình Hướng đối tượng (OOP).
- Giải thích chính xác 4 trụ cột OOP: Abstraction, Encapsulation, Inheritance, Polymorphism.
- Nhận diện mối quan hệ giữa Class (bản thiết kế trừu tượng) và Object (thực thể cụ thể trong bộ nhớ).

## 2. Lý thuyết cốt lõi

### 1.1. Quản lý độ phức tạp phần mềm và Phân rã bài toán
Trong kỹ nghệ phần mềm, thế giới thực luôn chứa đựng sự phức tạp với vô số quy tắc, nghiệp vụ và thực thể đan xen. Để xây dựng một phần mềm giải quyết được bài toán thực tế, hệ thống phải mô hình hóa được mức độ phức tạp cần thiết đó.

Có hai phương pháp phân rã bài toán kinh điển:
* **Phân rã theo hành vi/chức năng (Functional / Activities Decomposition):** Chia nhỏ bài toán thành các chuỗi giải thuật, hàm hoặc thủ tục xử lý độc lập. Cách tiếp cận này khiến dữ liệu bị tách rời khỏi các hàm thao tác trên nó, làm hệ thống trở nên mong manh và khó bảo trì khi quy mô dự án phình to.
* **Phân rã theo sự vật/thực thể (Object-Oriented Decomposition):** Nhận diện các thực thể tồn tại tự nhiên trong bài toán. Mỗi thực thể trở thành một đối tượng độc lập, bao bọc cả dữ liệu trạng thái và các hành vi tương ứng.
* *Ví dụ phân tích:* Xét hệ thống quản lý đào tạo. Nếu phân rã theo hành vi, ta có các thủ tục xử lý: đăng ký môn, xét điểm trực tiếp, đăng ký học kết hợp. Nhưng trong OOP, ta mô hình hóa thành các lớp đối tượng trung tâm như `Course` (Khóa học trực tiếp) và `Hybrid Course` (Khóa học kết hợp). Các hành vi đăng ký hay tính điểm trở thành các phương thức nội tại gắn liền với chính các đối tượng đó.

### 1.2. Bốn trụ cột nền tảng của Lập trình hướng đối tượng

![So sánh tư duy Thủ tục và OOP](/media/pro192/images/algorithmic.png)

![Trừu tượng hóa đối tượng trong OOP](/media/pro192/images/abstraction.png)

Tài liệu bài giảng xác định bốn khái niệm cốt lõi hình thành nên kiến trúc OOP:
1. **Trừu tượng hóa (Abstraction)**
2. **Đóng gói (Encapsulation)**
3. **Phân cấp (Hierarchy)**
4. **Đa hình (Polymorphism)**

### 1.3. Trừu tượng hóa (Abstraction) & Quan hệ Lớp – Đối tượng
Trừu tượng hóa là quá trình trích xuất các thuộc tính và hành vi cốt lõi phục vụ trực tiếp cho mục tiêu bài toán, đồng thời chủ động loại bỏ các chi tiết vụn vặt, không cần thiết.
* **Ranh giới rõ ràng & Tính toàn vẹn (Crisp boundary & Integrity):** Mỗi đối tượng trong hệ thống phần mềm phải có ranh giới phân định rõ ràng với các đối tượng khác. Đối tượng chỉ được phép sở hữu các hành vi phù hợp với bản chất tự nhiên của nó. Ví dụ: tai không thể nhìn, mắt không thể nghe; đối tượng thuộc lớp `Student` có thể học bài hoặc nộp bài, nhưng không thể có phương thức nổ máy hay tăng tốc của đối tượng `Car`.
* **Phân biệt Lớp (Class) và Đối tượng (Instance / Object):**
  * **Lớp (Class):** Là bản vẽ thiết kế, khuôn mẫu định nghĩa cấu trúc dữ liệu chung (các trường thuộc tính) và các phương thức thực thi của một tập hợp các thực thể.
  * **Đối tượng (Instance / Object):** Là một thực thể cụ thể sinh ra từ khuôn mẫu của lớp. Các đối tượng cùng một lớp chia sẻ chung cấu trúc trường và kiểu dữ liệu, nhưng giá trị cụ thể chứa trong từng ô nhớ của chúng trên Heap là hoàn toàn độc lập.

### 1.4. Đóng gói (Encapsulation) & Độc lập mã nguồn
Đóng gói là kỹ thuật gom chung dữ liệu (thuộc tính) và giải thuật xử lý (phương thức) vào bên trong một thực thể đối tượng duy nhất, đồng thời che giấu chi tiết cài đặt nội bộ khỏi sự truy cập tùy tiện từ bên ngoài.
* **Lợi ích kiến trúc then chốt:** Một lớp được đóng gói chuẩn mực (Well-encapsulated class) cho phép lập trình viên tự do tối ưu hóa, tái cấu trúc hoặc thay đổi giải thuật và cấu trúc dữ liệu nội bộ mà hoàn toàn không làm gián đoạn hay phá vỡ mã nguồn của các ứng dụng phía ngoài đang sử dụng đối tượng đó.

### 1.5. Phân cấp (Hierarchy) & Đa hình (Polymorphism)
Tính phân cấp tổ chức mối quan hệ giữa các thực thể thành hai mô hình:
1. **Quan hệ Thu nạp / Thành phần ("has-a" / Aggregation):** Thể hiện đối tượng này sở hữu hoặc được cấu thành từ các đối tượng khác (ví dụ: Trường đại học có các Khoa; Ô tô có Động cơ).
2. **Quan hệ Kế thừa phân loại ("is-a" / Classification):** Thể hiện sự chuyên biệt hóa giữa lớp cha và lớp con (ví dụ: `Special Order` là một dạng của `Order`; `Car` là một dạng của `Vehicle`).

Đa hình cho phép các đối tượng thuộc các kiểu dữ liệu khác nhau phản ứng lại cùng một thông điệp hoặc lời gọi phương thức theo những cách riêng biệt phù hợp với bản chất của từng đối tượng cụ thể (ví dụ: cùng gọi phương thức `mode()`, đối tượng `Course` trả về hình thức học trực tiếp, trong khi đối tượng `Hybrid Course` trả về hình thức kết hợp).

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 10:**
> - Đừng nhầm **Abstraction** (tập trung bản chất, ẩn chi tiết cài đặt) với **Encapsulation** (che giấu dữ liệu + kiểm soát truy cập qua getter/setter).
> - Trong đề FE, thuộc tính của Object thể hiện trạng thái (*state*), phương thức thể hiện hành vi (*behavior*).

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 10.1: Bốn trụ cột của lập trình hướng đối tượng

**Đề bài:** Hãy liệt kê và giải thích ngắn gọn mục đích chính của 4 trụ cột trong lập trình hướng đối tượng theo tài liệu `Introduction.pptx`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

1. *Trừu tượng hóa (Abstraction):* Lọc bỏ các chi tiết không cần thiết, chỉ giữ lại các thuộc tính và hành vi trọng tâm của bài toán.
2. *Đóng gói (Encapsulation):* Che giấu dữ liệu nội bộ và chi tiết cài đặt, cung cấp giao diện tương tác công khai an toàn.
3. *Phân cấp (Hierarchy):* Thiết lập cấu trúc quan hệ giữa các thực thể thông qua thu nạp ("has-a") hoặc kế thừa phân loại ("is-a").
4. *Đa hình (Polymorphism):* Cho phép các đối tượng khác nhau phản ứng linh hoạt với cùng một lời gọi phương thức dựa trên kiểu thực tế của đối tượng.

</details>

---

### Bài 10.2: Phân biệt Class và Instance trong thực tế

**Đề bài:** Trong phát biểu sau, thành phần nào đóng vai trò là Class và thành phần nào là Instance/Object?
*"Bản vẽ kỹ thuật của một chiếc điện thoại thông minh và hai chiếc điện thoại iPhone 15 màu đen và màu titan tự nhiên trên bàn làm việc."*

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Bản vẽ kỹ thuật:* Đóng vai trò là **Class** (khuôn mẫu định nghĩa kích thước màn hình, vi xử lý, camera và hành vi gọi điện, chụp ảnh).
* *Hai chiếc iPhone 15 cụ thể:* Đóng vai trò là **Instance / Object** (các thực thể cụ thể được sản xuất từ bản vẽ; chúng chia sẻ chung các trường thuộc tính nhưng giá trị màu sắc cụ thể `đen` và `titan tự nhiên` là khác nhau trong từng đối tượng).

</details>

---

### Bài 10.3: Nguyên lý Tính toàn vẹn của đối tượng (Object Integrity)

**Đề bài:** Trình bày ý nghĩa nguyên lý: *"Each object has integrity: it can only behave in ways that are appropriate to itself"*. Hãy lấy ví dụ về một thiết kế vi phạm nguyên lý này.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* *Ý nghĩa:* Mỗi đối tượng chỉ được phép sở hữu và thực thi các hành vi phản ánh đúng bản chất nghiệp vụ của nó trong thế giới thực.
* *Ví dụ vi phạm:* Thiết kế lớp `Account` (Tài khoản ngân hàng) chứa phương thức `cookFood()` (nấu ăn) hoặc phương thức `driveCar()` (lái xe). Đây là các hành vi hoàn toàn xa lạ với bản chất quản lý tài chính của một tài khoản ngân hàng.

</details>

---

### Bài 10.4: Giá trị kiến trúc của một Well-encapsulated Class

**Đề bài:** Khi lập trình viên thay đổi kiểu dữ liệu của một trường từ `int` sang `long` bên trong một lớp đã đóng gói hoàn hảo, các lớp bên ngoài có cần phải sửa đổi mã nguồn không? Vì sao?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Các lớp bên ngoài **hoàn toàn không cần phải sửa đổi mã nguồn**.
* Nhờ việc trường dữ liệu được khai báo `private` và giao tiếp thông qua các phương thức Getter/Setter công khai, lập trình viên có thể xử lý việc ép kiểu hoặc tính toán bên trong thân của Getter/Setter mà không làm thay đổi chữ ký giao diện bên ngoài.

</details>

---

### Bài 10.5: Phân loại quan hệ "has-a" và "is-a"

**Đề bài:** Xác định các mối quan hệ sau là "has-a" hay "is-a":
1. Laptop và Bàn phím (Keyboard).
2. Bác sĩ (Doctor) và Con người (Person).
3. Máy bay (Airplane) và Động cơ phản lực (JetEngine).
4. Hình tam giác (Triangle) và Hình học (Shape).

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

1. *Laptop và Keyboard:* **"has-a"** (Laptop sở hữu bàn phím làm thành phần).
2. *Doctor và Person:* **"is-a"** (Bác sĩ là một con người, chuyên biệt hóa từ Person).
3. *Airplane và JetEngine:* **"has-a"** (Máy bay sở hữu động cơ phản lực).
4. *Triangle và Shape:* **"is-a"** (Tam giác là một dạng cụ thể của hình học).

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 10A: Classes/Objects — Tạo Lớp `Car` & 2 Đối tượng Độc lập
- **Mục tiêu:** Khai báo thuộc tính `brand`, `year` và phương thức `showInfo()` cho `Car`, sau đó khởi tạo `c1` và `c2`.
- **Expected Output:**
  - `Car: Toyota (2022)`
  - `Car: Honda (2024)`

```java
class Car {
    String brand;
    int year;

    void showInfo() {
        // TODO: in "Car: <brand> (<year>)"
    }
}

public class Main {
    public static void main(String[] args) {
        Car c1 = new Car();
        c1.brand = "Toyota";
        c1.year = 2022;
        // TODO: Tao Car c2 voi brand="Honda", year=2024 va goi showInfo() cho ca 2
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 10A)</summary>

```java
class Car {
    String brand;
    int year;

    void showInfo() {
        System.out.println("Car: " + brand + " (" + year + ")");
    }
}

public class Main {
    public static void main(String[] args) {
        Car c1 = new Car();
        c1.brand = "Toyota";
        c1.year = 2022;

        Car c2 = new Car();
        c2.brand = "Honda";
        c2.year = 2024;

        c1.showInfo();
        c2.showInfo();
    }
}
```

* **Giải thích:** Mỗi lần gọi `new Car()` cấp phát một vùng nhớ riêng trên Heap: thay đổi `c2.brand` hoàn toàn không làm ảnh hưởng đến `c1.brand`.

</details>

---

#### 🟡 Thực hành 10B: State vs Behavior — Lớp `BankAccount` với `deposit()` & `withdraw()`
- **Mục tiêu:** Hoàn thiện hành vi nạp và rút tiền có kiểm tra số dư hợp lệ.
- **Expected Output:**
  - `An balance = 650.00`
  - `Binh withdraw ok? false`
- 🔗 [Mở bài lab Slot 10 trên JavaBrew Live Lab](/studio/playground?example=slot-10-lab)

```java
class BankAccount {
    String owner;
    double balance;

    BankAccount(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    void deposit(double amount) {
        // TODO: cong vao balance neu amount > 0
    }

    boolean withdraw(double amount) {
        // TODO: tru balance va tra true neu 0 < amount <= balance, nguoc lai false
        return false;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc1 = new BankAccount("An", 500.0);
        BankAccount acc2 = new BankAccount("Binh", 200.0);
        acc1.deposit(150.0);
        System.out.printf("%s balance = %.2f%n", acc1.owner, acc1.balance);
        System.out.println(acc2.owner + " withdraw ok? " + acc2.withdraw(300.0));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 10B)</summary>

```java
class BankAccount {
    String owner;
    double balance;

    BankAccount(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            return true;
        }
        return false;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc1 = new BankAccount("An", 500.0);
        BankAccount acc2 = new BankAccount("Binh", 200.0);
        acc1.deposit(150.0);
        System.out.printf("%s balance = %.2f%n", acc1.owner, acc1.balance);
        System.out.println(acc2.owner + " withdraw ok? " + acc2.withdraw(300.0));
    }
}
```

* **Giải thích:** Trong OOP, dữ liệu (`owner`, `balance`) chỉ nên bị thay đổi thông qua các phương thức hành vi kiểm soát logic như `deposit` / `withdraw`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Introduction.pdf) · [PPTX](/media/pro192/slides/Introduction.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (6 ảnh)</summary>

![Sơ đồ Slot 10: algorithmic](/media/pro192/images/algorithmic.png)

![Sơ đồ Slot 10: abstraction](/media/pro192/images/abstraction.png)

![Sơ đồ Slot 10: classes](/media/pro192/images/classes.png)

![Sơ đồ Slot 10: encapsulation](/media/pro192/images/encapsulation.png)

![Sơ đồ Slot 10: differentBehavior](/media/pro192/images/differentBehavior.png)

![Sơ đồ Slot 10: identicalBehavior](/media/pro192/images/identicalBehavior.png)

</details>

---

**Điều hướng:** [← Slot 09](./slot-09.md) | [Mục lục PRO192](../README.md) | [Slot 11 →](./slot-11.md)
