---
slot: 13
stage: 3
title: "Slot 13: Đóng gói (Encapsulation), Access Modifiers & Tổ chức Package"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q1/Q2)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Encapsulation.pdf"
slidePptx: "/media/pro192/slides/Encapsulation.pptx"
peRefs:
  - "PE1-Q1"
  - "PE2-Q1"
  - "PE3-Q1"
  - "PE4-Q1"
  - "PE5-Q1"
---

# Slot 13: Đóng gói (Encapsulation), Access Modifiers & Tổ chức Package

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 3: 4 Trụ cột OOP, Thiết kế Class & Encapsulation
- **Trọng tâm thi:** `Thi PE (Q1/Q2)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Encapsulation.pdf) · [Slide PPTX](/media/pro192/slides/Encapsulation.pptx)
- **Liên kết đề PE thật:** `PE1-Q1` · `PE2-Q1` · `PE3-Q1` · `PE4-Q1` · `PE5-Q1` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Cài đặt đúng Encapsulation (`private` fields + `public` Getter/Setter kiểm tra điều kiện biên).
- Phân biệt chính xác 4 Access Modifiers (`public > protected > default > private`) across packages.
- Hiểu tổ chức `package`, `import` và phân biệt với yêu cầu **default package** trong kỳ thi PE.

## 2. Lý thuyết cốt lõi

### 4.1. Đóng gói toàn diện và Kiểm tra điều kiện biên

![Minh họa đóng gói dữ liệu Encapsulation](/media/pro192/images/encapsulation1.png)

![Cài đặt lớp Car và kết quả chạy mẫu](/media/pro192/images/demoCarClass.png)

* Để đóng gói hoàn hảo: Tất cả các thuộc tính của lớp phải được khai báo với mức truy cập `private`.
* Giao tiếp đọc và ghi được ủy quyền cho các phương thức công khai `public Getter` và `public Setter`.
* Phương thức Setter đóng vai trò là "người gác cổng", cài đặt các khối lệnh điều kiện kiểm tra dữ liệu đầu vào trước khi lưu vào đối tượng. Ví dụ: kiểm tra điểm thi phải nằm trong thang điểm từ 0 đến 10, chuỗi tên không được rỗng.

### 4.2. Khái niệm Package và Cấu trúc thư mục

![Cấu trúc Package và Access Modifiers trong Java](/media/pro192/images/package.png)

* Package là cơ chế tổ chức không gian tên (namespace), giúp gom nhóm các lớp liên quan và ngăn chặn xung đột tên gọi.
* **Quy tắc cú pháp:** Lệnh khai báo `package` phải là dòng lệnh đầu tiên của tệp mã nguồn (ngoại trừ các dòng chú thích comment).
* **Ánh xạ thư mục:** Tên package ánh xạ tương ứng thành thư mục vật lý trên ổ đĩa. File `src/mypkg/MyClass.java` sẽ được biên dịch thành `build/classes/mypkg/MyClass.class`. Khi thực thi từ thư mục `classes`, bắt buộc phải chỉ rõ tên đầy đủ: `java mypkg.MyClass`.

### 4.3. Bốn cấp độ kiểm soát truy cập (Access Modifiers)
Thứ tự thu hẹp phạm vi truy cập:
**`public` > `protected` > `default` (không ghi từ khóa) > `private`**

| Bộ điều chỉnh | Cùng một Lớp (Same Class) | Cùng một Package (Same Package) | Lớp con khác Package (Subclass in other pkg) | Khác Package hoàn toàn (World / Outside) |
| :--- | :---: | :---: | :---: | :---: |
| **`public`** | ✅ Có | ✅ Có | ✅ Có | ✅ **Có (Toàn quyền)** |
| **`protected`** | ✅ Có | ✅ Có | ✅ **Có (Qua kế thừa)** | ❌ Không |
| **`default`** | ✅ Có | ✅ **Có (Package-private)** | ❌ Không | ❌ Không |
| **`private`** | ✅ **Có (Chỉ nội bộ)** | ❌ Không | ❌ Không | ❌ Không |

### 4.4. Case Study phân tích lỗi Access Modifier trong Slide
Xét mô hình phân chia package từ slide bài giảng:
* Package `rectPkg`: Lớp `public class Rectangle` có `protected int length;` và `public int width;`.
* Package `boxPkg`: 
  * Lớp `public class Box extends Rectangle` có: `int height;` (default), `protected int price;`, `private int weight;`.
  * Lớp `public class Demo_1` chứa hàm `main`.

Trong `Demo_1` (thuộc `boxPkg`):
* `b.height = 10;` và `b.price = 7;` → Hợp lệ vì cùng package `boxPkg`.
* `b.weight = 9;` → Lỗi biên dịch vì `weight` là `private` của `Box`.
* Tạo `Rectangle r = new Rectangle();`:
  * `r.width = 3;` → Hợp lệ vì `width` là `public`.
  * `r.length = 6;` → Lỗi biên dịch vì `Demo_1` không kế thừa từ `Rectangle` và lại khác package (`boxPkg` khác `rectPkg`), không thể truy xuất trường `protected length`.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 13:**
> - Bẫy Access Modifier ở FE: Biến `protected` trong lớp cha thuộc Package A **không thể** truy cập qua biến tham chiếu kiểu lớp cha từ một lớp con/lớp khác đứng ở Package B!
> - Bẫy PE 0 điểm: Bài tập dự án dùng `package`, nhưng **đề thi PE thật CẤM tuyệt đối dòng `package ...;`**. 

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 13.1: Viết Getter/Setter kiểm tra điều kiện biên

**Đề bài:** Viết lớp `Student` có thuộc tính `private double mark;`. Hãy viết phương thức `getMark()` và `setMark(double mark)` sao cho điểm chỉ được chấp nhận nếu nằm trong khoảng từ `0.0` đến `10.0`; nếu không hợp lệ thì in thông báo `"Diem khong hop le!"` và giữ nguyên giá trị cũ.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
public class Student {
    private double mark;

    public double getMark() {
        return this.mark;
    }

    public void setMark(double mark) {
        if (mark >= 0.0 && mark <= 10.0) {
            this.mark = mark;
        } else {
            System.out.println("Diem khong hop le!");
        }
    }
}
```

</details>

---

### Bài 13.2: Lỗi vị trí đặt từ khóa Package

**Đề bài:** Đoạn mã sau gặp lỗi biên dịch nào?
```java
import java.util.Date;
package company.hr;

public class Staff { }
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Bị lỗi biên dịch: `class, interface, or enum expected` hoặc `package declaration must be the first statement in the file`.
* *Giải thích:* Khai báo `package` bắt buộc phải là câu lệnh đầu tiên trong tệp mã nguồn Java. Câu lệnh `import` không được phép đặt trước `package`.

</details>

---

### Bài 13.3: Khác biệt cốt lõi giữa `protected` và `default`

**Đề bài:** Một biến có mức truy cập `protected` khác với một biến có mức truy cập `default` (package-private) ở điểm cụ thể nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Cả hai đều cho phép các lớp trong cùng package truy xuất tự do.
* *Khác biệt cốt tử:* Biến `protected` cho phép lớp con kế thừa (subclass) **nằm ở package khác** có thể truy xuất được, trong khi biến `default` hoàn toàn **không cho phép** bất kỳ lớp nào ở ngoài package truy cập, kể cả lớp con kế thừa.

</details>

---

### Bài 13.4: Bảo vệ dữ liệu với mức truy cập `private`

**Đề bài:** Đoạn mã sau bị lỗi gì khi biên dịch?
```java
class BankAccount {
    private double balance = 100.0;
}
public class TestBank {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount();
        acc.balance += 50.0;
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Bị lỗi biên dịch: `balance has private access in BankAccount`.
* *Giải thích:* Biến `balance` được bảo vệ bằng từ khóa `private`, do đó chỉ có mã nguồn nằm bên trong thân lớp `BankAccount` mới có quyền đọc và ghi trực tiếp vào biến này. Bên ngoài bắt buộc phải gọi qua các phương thức công khai.

</details>

---

### Bài 13.5: Cú pháp chạy chương trình có Package qua dòng lệnh

**Đề bài:** File `MainApp.class` nằm tại thư mục `D:\Workspace\build\classes\app\ui\MainApp.class`. Khi mở CMD tại thư mục `D:\Workspace\build\classes`, câu lệnh console nào sau đây là câu lệnh đúng để chạy chương trình?
1. `java MainApp`
2. `java app/ui/MainApp`
3. `java app.ui.MainApp`
4. `java app.ui.MainApp.class`

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Đáp án đúng:** **Lựa chọn 3 (`java app.ui.MainApp`)**.
* *Giải thích:* Khi thực thi lớp nằm trong package, JVM yêu cầu cung cấp tên lớp đầy đủ (Fully Qualified Name) có định dạng `package_name.ClassName`. Không dùng dấu gạch chéo và không viết đuôi `.class`.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 13A: Encapsulation — `private` Fields & Validation trong Setter
- **Mục tiêu:** Khóa trường dữ liệu thành `private` và viết `setScore(int)` kẹp các giá trị âm `< 0` về `0`.
- **Expected Output:**
  - `Score = 0`
  - `Score = 90`

```java
class MemberScore {
    private int score;

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        // TODO: Neu score < 0 gan 0, nguoc lai gan score
    }
}

public class Main {
    public static void main(String[] args) {
        MemberScore m = new MemberScore();
        m.setScore(-25);
        System.out.println("Score = " + m.getScore());
        m.setScore(90);
        System.out.println("Score = " + m.getScore());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 13A)</summary>

```java
class MemberScore {
    private int score;

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = (score < 0) ? 0 : score;
    }
}

public class Main {
    public static void main(String[] args) {
        MemberScore m = new MemberScore();
        m.setScore(-25);
        System.out.println("Score = " + m.getScore());
        m.setScore(90);
        System.out.println("Score = " + m.getScore());
    }
}
```

* **Giải thích:** Nhờ `private` + setter, logic kiểm tra dữ liệu biên tập trung tại một chỗ (cũng là yêu cầu quen thuộc ở `PE3-Q2 OLEDScreen.setRefresh()`).

</details>

---

#### 🟡 Thực hành 13B: Cầu nối `PE3-Q1` — Định dạng Chuỗi trong Getter An toàn `null`
- **Mục tiêu:** Viết `getName()` trả chữ cái đầu viết hoa, phần còn lại viết thường, và an toàn nếu `name` bị `null` hoặc rỗng.
- **Expected Output:**
  - `Passio coffee`
- 🔗 [Mở bài lab Slot 13 trên JavaBrew Live Lab](/studio/playground?example=slot-13-lab)

```java
class Store {
    private String name;

    public Store(String name) {
        this.name = name;
    }

    public String getName() {
        // TODO: Kiem tra null/rong roi tra ve dang "Chu dau hoa, con lai thuong"
        return name;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Store("passio Coffee").getName());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 13B)</summary>

```java
class Store {
    private String name;

    public Store(String name) {
        this.name = name;
    }

    public String getName() {
        if (name == null || name.isEmpty()) {
            return "";
        }
        return Character.toUpperCase(name.charAt(0)) + name.substring(1).toLowerCase();
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Store("passio Coffee").getName());
    }
}
```

* **Giải thích:** Trong các đề Q1 PE (`Camel`, `Crocus`, `CoffeeShop`), nhiều logic biến đổi chuỗi được chấm ngay bên trong `getXxx()` chứ không chỉ ở setter.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Encapsulation.pdf) · [PPTX](/media/pro192/slides/Encapsulation.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (13 ảnh)</summary>

![Sơ đồ Slot 13: encapsulation10](/media/pro192/images/encapsulation10.png)

![Sơ đồ Slot 13: encapsulation11](/media/pro192/images/encapsulation11.png)

![Sơ đồ Slot 13: encapsulation12](/media/pro192/images/encapsulation12.png)

![Sơ đồ Slot 13: encapsulation13](/media/pro192/images/encapsulation13.png)

![Sơ đồ Slot 13: encapsulation14](/media/pro192/images/encapsulation14.png)

![Sơ đồ Slot 13: encapsulation15](/media/pro192/images/encapsulation15.png)

![Sơ đồ Slot 13: encapsulation16](/media/pro192/images/encapsulation16.png)

![Sơ đồ Slot 13: encapsulation17](/media/pro192/images/encapsulation17.png)

![Sơ đồ Slot 13: encapsulation18](/media/pro192/images/encapsulation18.png)

![Sơ đồ Slot 13: encapsulation19](/media/pro192/images/encapsulation19.png)

![Sơ đồ Slot 13: encapsulation20](/media/pro192/images/encapsulation20.png)

![Sơ đồ Slot 13: encapsulation21](/media/pro192/images/encapsulation21.png)

![Sơ đồ Slot 13: package](/media/pro192/images/package.png)

</details>

---

**Điều hướng:** [← Slot 12](./slot-12.md) | [Mục lục PRO192](../README.md) | [Slot 14 →](./slot-14.md)
