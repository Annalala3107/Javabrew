---
slot: 21
stage: 5
title: "Slot 21: Lớp Nội danh (Anonymous Class) & Tổng kết Đa hình"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q3)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Polymorphism.pdf"
slidePptx: "/media/pro192/slides/Polymorphism.pptx"
peRefs:
  - "PE1-Q3"
  - "PE4-Q3"
---

# Slot 21: Lớp Nội danh (Anonymous Class) & Tổng kết Đa hình

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 5: Đa hình, Abstract Class, Interface & Anonymous Class
- **Trọng tâm thi:** `Thi PE (Q3)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Polymorphism.pdf) · [Slide PPTX](/media/pro192/slides/Polymorphism.pptx)
- **Liên kết đề PE thật:** `PE1-Q3` · `PE4-Q3` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu bản chất Lớp nội danh (Anonymous Class) khi khởi tạo tức thì từ Interface hoặc Abstract Class.
- Nắm cú pháp dấu chấm phẩy `;` kết thúc biểu thức và tên file bytecode `Outer$1.class`.
- Biết quy tắc "Effectively Final" và ứng dụng trực tiếp tạo `Comparator<T>` tùy biến trên JDK 8.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Polymorphism.pptx` (từ slide *Nested Class*, *Anonymous Classes*, *Anonymous Class Demo với Interface1 và MyAdapter* đến slide *Summary*).

### 1. Bản chất và Định nghĩa của Lớp nội danh (Anonymous Class)
* **Định nghĩa:** Lớp nội danh (Anonymous Class) là một lớp con cục bộ **hoàn toàn không có tên gọi (not named)**, được trình biên dịch Java nhận diện và đặt tên nội bộ một cách tự động.
* **Đặc điểm cú pháp:** Chúng được khai báo và khởi tạo thực thể **đồng thời ngay tại biểu thức khởi tạo (instantiation expression)** của một Interface hoặc Abstract Class. Phần thân mã cài đặt/ghi đè phương thức được đính kèm trực tiếp ngay sau cặp ngoặc nhọn `{ ... }`.
* **Mục đích sử dụng:**
  1. Giúp mã nguồn ngắn gọn, súc tích (make code concise).
  2. Khai báo và khởi tạo đối tượng cùng một lúc tại chính nơi cần sử dụng.
  3. Phù hợp cho các lớp chỉ cần sử dụng một lần duy nhất (one-time use) mà không làm ô nhiễm không gian tên của dự án.
  4. Ứng dụng phổ biến trong lập trình bắt sự kiện đồ họa và viết các bộ so sánh đối tượng (`Comparator`).

### 2. Cú pháp khởi tạo Lớp nội danh từ Interface
Giả sử ta có giao diện `Interface1`:
```java
public interface Interface1 {
    void M1();
    void M2();
}
```
Thay vì phải tạo lớp `MyClass implements Interface1` riêng biệt, ta khởi tạo trực tiếp lớp nội danh:
```java
class Anonymous1 {
    public static void main(String[] args) {
        Interface1 obj = new Interface1() {
            @Override
            public void M1() {
                System.out.println("M1");
            }

            @Override
            public void M2() {
                System.out.println("M2");
            }
        }; // Bắt buộc phải có dấu chấm phẩy kết thúc câu lệnh gán

        obj.M1();
        obj.M2();
    }
}
```
* **Bản chất bộ nhớ:** Biểu thức `new Interface1() { ... }` thực chất đang tạo ra một đối tượng của một lớp vô danh cài đặt `Interface1`, sau đó gán địa chỉ đối tượng cho biến tham chiếu `obj`.

### 3. Kỹ thuật ghi đè linh hoạt với Abstract Class (Adapter Class)
Slide bài giảng đưa ra trường hợp lớp trừu tượng `MyAdapter` chứa sẵn các phương thức cụ thể nhưng bị khóa không cho khởi tạo trực tiếp:
```java
public abstract class MyAdapter {
    public void M1() { System.out.println("M1"); }
    public void M2() { System.out.println("M2"); }
}
```
Để sử dụng và chỉ ghi đè duy nhất phương thức `M1()`:
```java
class Program {
    public static void main(String[] args) {
        MyAdapter obj = new MyAdapter() {
            @Override
            public void M1() {
                System.out.println("M1 overridden");
            }
        };

        obj.M2(); // Gọi phương thức gốc của Adapter: in ra "M2"
        obj.M1(); // Gọi phương thức vừa ghi đè: in ra "M1 overridden"
    }
}
```

### 4. Quy tắc đặt tên Bytecode `.class` của Trình biên dịch JVM
* Mặc dù lớp không có tên trong mã nguồn, khi biên dịch bằng lệnh `javac`, máy ảo Java vẫn sinh ra tập tin bytecode độc lập.
* **Cú pháp quy ước:**
  `ContainerClass$Number.class`
  *(Trong đó `ContainerClass` là tên của lớp chứa đoạn mã anonymous, và `Number` là số thứ tự tăng dần `1, 2, 3...` đại diện cho từng lớp vô danh xuất hiện bên trong lớp đó)*.
  *Ví dụ minh họa từ slide:* Thư mục `build\classes` xuất hiện tập tin **`Anonymous1$1.class`**.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 21:**
> - Quên dấu `;` sau ngoặc nhọn đóng `};` của Anonymous Class là lỗi cú pháp hay gặp.
> - Trong đề thi PE chạy JDK 8, Anonymous Class `new Comparator<T>() { ... }` (hoặc Lambda tương đương) là cách nhanh nhất để cài đặt bộ so sánh đa tiêu chí cho `Collections.sort()`.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 21.1: Bản chất của biểu thức `new InterfaceName() { ... }`

**Đề bài:** 
Ở Slot 20 chúng ta đã học: *"Interface không thể khởi tạo trực tiếp bằng từ khóa new"*. Vậy tại sao đoạn mã sau lại hoàn toàn hợp lệ trong Java?
```java
Runnable r = new Runnable() {
    @Override
    public void run() {
        System.out.println("Thread is running");
    }
};
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Bản chất kỹ thuật:** Đoạn mã trên **không hề khởi tạo đối tượng trực tiếp từ giao diện `Runnable`**.
* Cặp ngoặc nhọn `{ ... }` ngay sau biểu thức `new Runnable()` định nghĩa phần thân của một **Lớp nội danh (Anonymous Class)** ngầm định cài đặt giao diện `Runnable`. Toán tử `new` thực chất đang khởi tạo một thể hiện của lớp nội danh này và gán địa chỉ tham chiếu cho biến `r` kiểu `Runnable` theo đúng cơ chế đa hình.

</details>

---

### Bài 21.2: Dấu chấm phẩy kết thúc biểu thức Anonymous Class

**Đề bài:** 
Xét đoạn mã sau:
```java
interface Greeting {
    void sayHello();
}

public class Demo {
    public static void main(String[] args) {
        Greeting g = new Greeting() {
            public void sayHello() {
                System.out.println("Xin chao!");
            }
        } // Dòng 11
        g.sayHello();
    }
}
```
Trình biên dịch sẽ báo lỗi gì tại Dòng 11? Tại sao khai báo một lớp thông thường kết thúc bằng `}` thì không có dấu `;`, nhưng Anonymous Class lại bắt buộc phải có?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Lỗi biên dịch:** `';' expected` tại Dòng 11.
* **Nguyên nhân:** Toàn bộ khối Anonymous Class nằm bên trong một **biểu thức gán giá trị cho biến** (`Greeting g = new Greeting() { ... };`). Vì đây là một câu lệnh thực thi (statement) chứ không phải là một khai báo lớp độc lập, nên bắt buộc phải có dấu chấm phẩy `;` ở cuối để kết thúc câu lệnh gán.

</details>

---

### Bài 21.3: Quy tắc sinh tập tin Bytecode của Trình biên dịch JVM

**Đề bài:** 
Trong một tập tin có tên `OrderService.java`, lập trình viên khai báo 2 lớp nội danh (Anonymous Class) bên trong phương thức `process()`. Sau khi thực hiện lệnh biên dịch `javac OrderService.java`, những tập tin `.class` nào sẽ xuất hiện trong thư mục đầu ra?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Các tập tin `.class` được sinh ra gồm:
  1. `OrderService.class` (tập tin bytecode của lớp bao bọc bên ngoài).
  2. `OrderService$1.class` (tập tin bytecode cho lớp nội danh thứ nhất).
  3. `OrderService$2.class` (tập tin bytecode cho lớp nội danh thứ hai).
* Trình biên dịch luôn đánh số tăng dần theo định dạng `ContainerClass$Number.class` để định danh độc lập từng lớp vô danh.

</details>

---

### Bài 21.4: Ứng dụng Anonymous Class để tạo Comparator sắp xếp đối tượng

**Đề bài:** 
Cho lớp `Student` có trường `int age;` và phương thức `getAge()`. Hãy sử dụng lớp nội danh để khởi tạo một đối tượng kiểu `java.util.Comparator<Student>` nhằm sắp xếp danh sách sinh viên theo thứ tự **tuổi giảm dần**.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.util.Comparator;

Comparator<Student> ageComparator = new Comparator<Student>() {
    @Override
    public int compare(Student s1, Student s2) {
        // Tuổi giảm dần: s2.getAge() - s1.getAge()
        return Integer.compare(s2.getAge(), s1.getAge());
    }
};
```
* **Giải thích:** Lớp nội danh cho phép lập trình viên cài đặt giao diện `Comparator` ngay tại vị trí cần sử dụng mà không phải mất công tạo một tập tin lớp riêng biệt, giúp mã nguồn tập trung và trực quan.

</details>

---

### Bài 21.5: Phạm vi truy cập biến cục bộ và quy tắc "Effectively Final"

**Đề bài:** 
Xét đoạn mã sau:
```java
public class ScopeTest {
    public void doWork() {
        int factor = 2;
        factor = 5; // Dòng 4
        
        Runnable r = new Runnable() {
            @Override
            public void run() {
                System.out.println("Factor: " + factor); // Dòng 9
            }
        };
    }
}
```
Trình biên dịch sẽ thông báo lỗi gì tại Dòng 9? Quy tắc nào trong Java chi phối việc một Anonymous Class truy xuất các biến cục bộ bên ngoài?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Thông báo lỗi biên dịch tại Dòng 9:** `local variables referenced from an inner class must be final or effectively final`.
* **Nguyên tắc kỹ thuật:** Một Anonymous Class chỉ được phép truy xuất các biến cục bộ xung quanh nếu biến đó là **hằng số (`final`)** hoặc **"effectively final" (biến chỉ được gán giá trị một lần duy nhất và không bao giờ bị thay đổi giá trị sau đó)**.
* Ở Dòng 4, lệnh `factor = 5;` đã thay đổi giá trị của biến, khiến `factor` không còn là effectively final nữa. Do đó, Anonymous Class bị cấm truy xuất để đảm bảo tính an toàn dữ liệu và tính nhất quán bộ nhớ giữa các luồng thực thi.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 21A: Anonymous Class — Khởi tạo Tức thì & Lỗi thiếu dấu `;`
- **Mục tiêu:** Sửa dấu `;` kết thúc Anonymous Class và quan sát quy tắc biến `effectively final` (`prefix`).
- **Expected Output:**
  - `Xin chao, PRO192!`

```java
interface Greeting {
    String say(String name);
}

public class Main {
    public static void main(String[] args) {
        final String prefix = "Xin chao, ";
        Greeting g = new Greeting() {
            @Override
            public String say(String name) {
                return prefix + name + "!";
            }
        } // TODO: Them dau ; ket thuc bieu thuc Anonymous Class
        System.out.println(g.say("PRO192"));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 21A)</summary>

```java
interface Greeting {
    String say(String name);
}

public class Main {
    public static void main(String[] args) {
        final String prefix = "Xin chao, ";
        Greeting g = new Greeting() {
            @Override
            public String say(String name) {
                return prefix + name + "!";
            }
        };
        System.out.println(g.say("PRO192"));
    }
}
```

* **Giải thích:** Anonymous Class là một **biểu thức khởi tạo** (`new Interface() { ... };`) nằm trong lệnh gán nên bắt buộc kết thúc bằng dấu chấm phẩy `;`.

</details>

---

#### 🟡 Thực hành 21B: Cầu nối PE Q3 (JDK 8) — Sắp xếp Đa tiêu chí bằng Anonymous `Comparator`
- **Mục tiêu:** Dùng `new Comparator<Student>()` (chuẩn JDK 8) sắp xếp giảm dần theo `gpa`; nếu `gpa` bằng nhau thì tăng dần theo `name`.
- **Expected Output:**
  - `[Binh(9.0), An(8.5), Linh(8.5)]`
- 🔗 [Mở bài lab Slot 21 trên JavaBrew Live Lab](/studio/playground?example=slot-21-lab)

```java
import java.util.*;

class Student {
    String name;
    double gpa;
    Student(String name, double gpa) { this.name = name; this.gpa = gpa; }
    @Override
    public String toString() { return name + "(" + gpa + ")"; }
}

public class Main {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<Student>();
        list.add(new Student("Linh", 8.5));
        list.add(new Student("An", 8.5));
        list.add(new Student("Binh", 9.0));

        Collections.sort(list, new Comparator<Student>() {
            @Override
            public int compare(Student a, Student b) {
                // TODO: GPA giam dan bang Double.compare(b.gpa, a.gpa), trung thi ten A-Z
                return 0;
            }
        });
        System.out.println(list);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 21B)</summary>

```java
import java.util.*;

class Student {
    String name;
    double gpa;
    Student(String name, double gpa) { this.name = name; this.gpa = gpa; }
    @Override
    public String toString() { return name + "(" + gpa + ")"; }
}

public class Main {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<Student>();
        list.add(new Student("Linh", 8.5));
        list.add(new Student("An", 8.5));
        list.add(new Student("Binh", 9.0));

        Collections.sort(list, new Comparator<Student>() {
            @Override
            public int compare(Student a, Student b) {
                int cmp = Double.compare(b.gpa, a.gpa);
                return (cmp != 0) ? cmp : a.name.compareTo(b.name);
            }
        });
        System.out.println(list);
    }
}
```

* **Giải thích:** Luôn ưu tiên `Double.compare` / `Integer.compare` thay cho phép trừ `(int)(b.gpa - a.gpa)` (tránh làm tròn `8.6 - 8.5 = 0.1` thành `0`!).

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Syntactic Sugar trong Java (Autoboxing, Anonymous Class, Lambda)](../../java/basis/syntactic-sugar.md) · [Dynamic Proxy Pattern trong Java](../../java/basis/proxy.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Polymorphism.pdf) · [PPTX](/media/pro192/slides/Polymorphism.pptx)

---

**Điều hướng:** [← Slot 20](./slot-20.md) | [Mục lục PRO192](../README.md) | [Slot 22 →](./slot-22.md)
