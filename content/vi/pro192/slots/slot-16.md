---
slot: 16
stage: 4
title: "Slot 16: Ghi đè Phương thức (@Override) & Che giấu Phương thức Tĩnh"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q2)"
  - "Thi FE"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Inheritance.pdf"
slidePptx: "/media/pro192/slides/Inheritance.pptx"
peRefs:
  - "PE1-Q2"
  - "PE2-Q2"
  - "PE3-Q2"
  - "PE4-Q2"
  - "PE5-Q2"
---

# Slot 16: Ghi đè Phương thức (@Override) & Che giấu Phương thức Tĩnh

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 4: Kế thừa (Inheritance), Array of Objects & Casting
- **Trọng tâm thi:** `Thi PE (Q2)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Inheritance.pdf) · [Slide PPTX](/media/pro192/slides/Inheritance.pptx)
- **Liên kết đề PE thật:** `PE1-Q2` · `PE2-Q2` · `PE3-Q2` · `PE4-Q2` · `PE5-Q2` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Áp dụng đúng 4 quy tắc Method Overriding (chữ ký, kiểu trả về Covariant, Access Modifier không thu hẹp).
- Luôn gắn `@Override` để trình biên dịch bắt lỗi gõ sai tên phương thức (nhất là `toString()` trong Q2 PE).
- Phân biệt Method Overriding (instance method) với Method Hiding (`static` method).

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide **`Inheritance.pptx`** (từ slide *Overriding Methods*, *Notes for Overriding Methods*, *The @Override Annotation* đến slide *Hiding Methods* và các slide demo `Demo_2.java`, `Demo_3.java`).

---

### 1. Bản chất của Ghi đè phương thức (Method Overriding)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Overriding Methods", sơ đồ `Rectangle` và `Box`)*

* **Khái niệm:** Ghi đè phương thức (Overriding) xảy ra khi một lớp con định nghĩa lại một phương thức thể hiện (instance method) đã có ở lớp cha để cung cấp một cách cài đặt riêng biệt, phù hợp hơn với hành vi đặc thù của lớp con.
* **Minh họa trực quan từ slide bài giảng:**
  * Lớp cha `Rectangle` có phương thức tính diện tích:
    ```java
    public int area() {
        return length * width;
    }
    ```
  * Lớp con `Box extends Rectangle` kế thừa phương thức `area()`, nhưng với một khối hộp thì "diện tích" phải là **diện tích toàn phần (surface area)** của 6 mặt. Do đó, `Box` ghi đè phương thức `area()`:
    ```java
    public int area() {
        return 2 * (length * width + length * height + width * height);
    }
    ```
* **Sử dụng `super.methodName()` để tái sử dụng:**
  Lớp con có thể gọi phiên bản phương thức của lớp cha bằng từ khóa `super`. Nhờ đó, phương thức `area()` trong `Box` có thể viết ngắn gọn hơn:
  ```java
  public int area() {
      return 2 * (super.area() + length * height + width * height);
  }
  ```
  *(Trích từ slide `Box.java`)*.

---

### 2. 4 Quy tắc khắt khe khi Ghi đè phương thức (Overriding Rules)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Notes for Overriding Methods")*

Để ghi đè hợp lệ, phương thức ở lớp con phải tuân thủ nghiêm ngặt 4 quy tắc sau:

1. **Trùng khớp tuyệt đối chữ ký (Same Signature):** Tên phương thức, số lượng và thứ tự kiểu dữ liệu của các tham số ở lớp con phải giống hệt lớp cha.
2. **Quy tắc kiểu trả về (Return Type):** Kiểu trả về của phương thức ở lớp con phải trùng khớp hoặc là **kiểu dẫn xuất hẹp hơn (covariant return type)** so với kiểu trả về ở lớp cha.
3. **Quy tắc về Bộ điều chỉnh truy cập (Access Modifier):**
   * Phương thức ghi đè ở lớp con **không được phép thu hẹp quyền truy cập** so với lớp cha.
   * Cụ thể: Nếu lớp cha là `protected`, lớp con chỉ có thể để `protected` hoặc nới rộng thành `public` (tuyệt đối không được hạ xuống `default` hay `private`).
4. **Không thể ghi đè phương thức `final` hoặc `private`:**
   * Phương thức có từ khóa `final` ở lớp cha bị cấm ghi đè.
   * Phương thức `private` ở lớp cha không thể bị ghi đè vì lớp con hoàn toàn không nhìn thấy nó.

---

### 3. Chú thích `@Override` (The @Override Annotation)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "The @Override Annotation")*

* **Mục đích:** `@Override` là một chỉ thị đặc biệt cho trình biên dịch Java biết rằng phương thức đi liền sau nó nhằm mục đích ghi đè một phương thức từ lớp cha.
* **Lợi ích an toàn mã nguồn:**
  * Nếu lập trình viên gõ sai chính tả tên phương thức (ví dụ gõ `aria()` thay vì `area()`) hoặc sai kiểu tham số, trình biên dịch sẽ lập tức báo lỗi thời gian biên dịch (**compile-time error**) thay vì âm thầm coi đó là một phương thức mới.
  * Giúp tăng tính rõ ràng và khả năng bảo trì mã nguồn cho nhóm phát triển.

---

### 4. Che giấu phương thức tĩnh (Hiding Methods) vs Ghi đè (Overriding)

![So sánh Hiding Static Method và Overriding Instance Method](/media/pro192/images/hidden-method.png)

*(Trỏ vào slide: `Inheritance.pptx` > Slide "Hiding Methods", code demo `Demo_3.java`)*

Đây là một điểm phân biệt nâng cao rất hay gây nhầm lẫn:

* **Phương thức thể hiện (Instance methods):** Được **Ghi đè (Overridden)**. Việc gọi phương thức nào hoàn toàn phụ thuộc vào **kiểu đối tượng thực tế lúc chạy (Runtime object type)**.
* **Phương thức tĩnh (Class / Static methods):** **KHÔNG THỂ bị ghi đè, mà chỉ bị Che giấu (Hidden)**!
  * Nếu lớp con khai báo một phương thức tĩnh có cùng chữ ký với phương thức tĩnh ở lớp cha, phương thức của lớp cha chỉ bị che khuất tạm thời.
  * Việc gọi phương thức tĩnh nào hoàn toàn phụ thuộc vào **kiểu của biến tham chiếu tại thời điểm biên dịch (Compile-time reference type)**, chứ không phụ thuộc vào đối tượng thực tế trên Heap!
  * *(Minh họa từ slide `Demo_3.java`)*:
    ```java
    class Super {
        public static void print() { System.out.println("Super"); }
    }
    class Sub extends Super {
        public static void print() { System.out.println("Sub"); }
    }
    
    Super obj = new Sub();
    obj.print(); // In ra "Super", vì biến tham chiếu obj có kiểu là Super!
    ```

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 16:**
> - Bẫy **Hiding `static` Method**: Nếu cha và con đều có `static void show()`, lời gọi `Parent p = new Child(); p.show();` sẽ chạy bản của **Parent** (theo kiểu tham chiếu lúc compile), KHÔNG có đa hình động!
> - Khi ghi đè `toString()` ở Q2 PE (như `SpecDaisy`, `SpecCala`, `OLEDScreen`), chú ý định dạng dấu cách sau dấu phẩy theo đúng yêu cầu từng đề (`name, color, age` vs `color,quantity,type`).

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 16.1: Phân biệt Nạp chồng (Overloading) và Ghi đè (Overriding)

**Đề bài:** 
Hãy phân biệt sự khác nhau cơ bản giữa **Method Overloading** và **Method Overriding** dựa trên các tiêu chí: phạm vi lớp, chữ ký phương thức (signature), và kiểu trả về.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Về phạm vi:**
  * *Overloading:* Xảy ra trong cùng một lớp (hoặc giữa lớp cha và con) nhằm tạo ra các hàm cùng tên làm nhiều việc khác nhau.
  * *Overriding:* Bắt buộc phải xảy ra trong mối quan hệ kế thừa giữa lớp cha và lớp con.
* **Về chữ ký phương thức:**
  * *Overloading:* Tên phương thức giống nhau, nhưng danh sách tham số **bắt buộc phải khác nhau** (về số lượng hoặc kiểu dữ liệu).
  * *Overriding:* Tên phương thức và danh sách tham số **bắt buộc phải giống hệt nhau**.
* **Về kiểu trả về:**
  * *Overloading:* Kiểu trả về có thể tùy ý giống hoặc khác.
  * *Overriding:* Kiểu trả về phải giống nhau hoặc là kiểu dẫn xuất con (covariant type).

</details>

---

### Bài 16.2: Quy tắc nới rộng và thu hẹp Access Modifier khi ghi đè

**Đề bài:** 
Xét đoạn mã sau:
```java
class Parent {
    protected void showMessage() {
        System.out.println("Hello from Parent");
    }
}

class Child1 extends Parent {
    public void showMessage() { ... }
}

class Child2 extends Parent {
    void showMessage() { ... } // default access
}
```
Lớp `Child1` và `Child2` lớp nào biên dịch thành công, lớp nào bị lỗi? Giải thích vì sao dựa trên quy tắc trong slide `Inheritance.pptx`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* `Child1`: **Biên dịch thành công**. Phương thức ở lớp cha là `protected`, lớp con nới rộng quyền truy cập thành `public` là hoàn toàn hợp lệ theo quy tắc kế thừa.
* `Child2`: **Bị lỗi biên dịch** (`cannot reduce the visibility of the inherited method from Parent`). Lớp con hạ cấp quyền truy cập từ `protected` xuống `default` (thu hẹp quyền) là vi phạm quy tắc ghi đè.

</details>

---

### Bài 16.3: Tác dụng bảo vệ của chú thích `@Override`

**Đề bài:** 
Một lập trình viên muốn ghi đè phương thức `toString()` của lớp `Object` nhưng viết như sau:
```java
public class Student {
    private String name = "Nam";

    @Override
    public String tostring() { // chữ 's' viết thường
        return "Student: " + name;
    }
}
```
Trình biên dịch sẽ phản ứng như thế nào khi gặp đoạn mã trên? Nếu bỏ chú thích `@Override` đi thì điều gì sẽ xảy ra?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Khi có `@Override`:** Trình biên dịch sẽ **báo lỗi ngay lập tức**: `method does not override or implement a method from a supertype`. Nhờ chú thích `@Override`, trình biên dịch phát hiện ra trong lớp `Object` chỉ có `toString()` chứ không có phương thức nào tên là `tostring()`.
* **Nếu bỏ `@Override`:** Chương trình sẽ biên dịch bình thường nhưng Java chỉ coi `tostring()` là một phương thức tự tạo mới của `Student`. Khi bạn gọi `System.out.println(studentObj);`, hàm `toString()` của `Object` vẫn chạy và in ra mã băm (`Student@15db9742`) thay vì chuỗi `"Student: Nam"`.

</details>

---

### Bài 16.4: Tái sử dụng phương thức lớp cha bằng `super` trong bài toán hình học

*(Trích từ slide `Rectangle.java` và `Box.java`)*

* **Đề bài:** 
  Lớp `Rectangle` có phương thức:
  ```java
  public String toString() {
      return "[" + length + "," + width + "]";
  }
  ```
  Hãy viết phương thức `toString()` cho lớp `Box extends Rectangle` (có thêm thuộc tính `int height;`) sao cho tái sử dụng lại chuỗi kết quả của lớp cha bằng từ khóa `super` để in ra định dạng `"[length,width,height]"`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
@Override
public String toString() {
    // Lấy chuỗi "[length,width]" của lớp cha, cắt bỏ dấu ngoặc đóng ']' rồi ghép thêm height
    String parentStr = super.toString();
    return parentStr.substring(0, parentStr.length() - 1) + "," + height + "]";
}
```
* Hoặc cách viết tường minh trực tiếp:
```java
@Override
public String toString() {
    return super.toString() + " - Height: " + height;
}
```
* **Giải thích:** Sử dụng `super.toString()` giúp lớp con tái sử dụng toàn bộ chuỗi định dạng đã được xử lý chuẩn mực từ lớp cha mà không cần viết lại logic truy xuất các thuộc tính của cha.

</details>

---

### Bài 16.5: Phân tích cơ chế Che giấu phương thức tĩnh (Hiding Method)

*(Trích từ slide `Demo_3.java`)*

* **Đề bài:** 
  Quan sát đoạn mã sau:
  ```java
  class SuperClass {
      public static void test() {
          System.out.println("Static from SuperClass");
      }
  }

  class SubClass extends SuperClass {
      public static void test() {
          System.out.println("Static from SubClass");
      }
  }

  public class TestHiding {
      public static void main(String[] args) {
          SuperClass obj = new SubClass();
          obj.test();
      }
  }
  ```
  Kết quả in ra màn hình là `"Static from SuperClass"` hay `"Static from SubClass"`? Giải thích rõ cơ chế che giấu phương thức tĩnh.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kết quả in ra:** `Static from SuperClass`
* **Giải thích cơ chế:**
  * Phương thức tĩnh (`static`) thuộc về lớp chứ không gắn liền với thể hiện đối tượng trên Heap. Do đó, phương thức tĩnh **không bị ghi đè theo cơ chế liên kết động (Dynamic binding)**.
  * Khi bạn gọi `obj.test()`, trình biên dịch kiểm tra kiểu khai báo của biến `obj`. Vì `obj` được khai báo với kiểu tham chiếu là `SuperClass`, JVM sẽ liên kết trực tiếp và gọi phương thức `test()` của `SuperClass`. Phương thức của `SubClass` ở đây chỉ đóng vai trò che giấu (`hiding`), không thể ghi đè.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 16A: Ghi đè `@Override toString()` chuẩn format Q2 PE
- **Mục tiêu:** Bổ sung `@Override public String toString()` kết hợp `super.toString()` để xuất `name, color, age` (dấu phẩy + 1 khoảng trắng).
- **Expected Output:**
  - `Daisy, Yellow, 5`

```java
class Flower {
    private String name;
    private int age;
    Flower(String name, int age) {
        this.name = name;
        this.age = age;
    }
    public String getName() { return name; }
    public int getAge() { return age; }
    @Override
    public String toString() { return name + ", " + age; }
}

class SpecFlower extends Flower {
    private String color;
    SpecFlower(String name, int age, String color) {
        super(name, age);
        this.color = color;
    }
    // TODO: @Override toString() tra ve "name, color, age"
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new SpecFlower("Daisy", 5, "Yellow"));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 16A)</summary>

```java
class Flower {
    private String name;
    private int age;
    Flower(String name, int age) {
        this.name = name;
        this.age = age;
    }
    public String getName() { return name; }
    public int getAge() { return age; }
    @Override
    public String toString() { return name + ", " + age; }
}

class SpecFlower extends Flower {
    private String color;
    SpecFlower(String name, int age, String color) {
        super(name, age);
        this.color = color;
    }
    @Override
    public String toString() {
        return getName() + ", " + color + ", " + getAge();
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new SpecFlower("Daisy", 5, "Yellow"));
    }
}
```

* **Giải thích:** Trong Q2 PE (`SpecDaisy`, `SpecCala`, `OLEDScreen`), mỗi đề quy định format dấu cách sau dấu phẩy khác nhau (`", "` vs `","`), chỉ sai 1 dấu cách là test case fail.

</details>

---

#### 🟡 Thực hành 16B: Overriding Phương thức Instance vs Hiding Phương thức `static`
- **Mục tiêu:** Quan sát `Parent ref = new Child();`: instance method chạy theo đối tượng `Child`, còn `static` method chạy theo kiểu biến `Parent`.
- **Expected Output:**
  - `Child instance speak`
  - `Parent static kind`
- 🔗 [Mở bài lab Slot 16 trên JavaBrew Live Lab](/studio/playground?example=slot-16-lab)

```java
class ParentAnimal {
    static void kind() { System.out.println("Parent static kind"); }
    void speak() { System.out.println("Parent instance speak"); }
}

class Husky extends ParentAnimal {
    // TODO: Viet static void kind() ("Child static kind") va @Override void speak()
}

public class Main {
    public static void main(String[] args) {
        ParentAnimal ref = new Husky();
        ref.speak();
        ref.kind();
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 16B)</summary>

```java
class ParentAnimal {
    static void kind() { System.out.println("Parent static kind"); }
    void speak() { System.out.println("Parent instance speak"); }
}

class Husky extends ParentAnimal {
    static void kind() { System.out.println("Child static kind"); }
    @Override
    void speak() { System.out.println("Child instance speak"); }
}

public class Main {
    public static void main(String[] args) {
        ParentAnimal ref = new Husky();
        ref.speak();
        ref.kind();
    }
}
```

* **Giải thích:** Phương thức `static` gắn với *lớp khai báo*, không tham gia Dynamic Binding nên bị **ẩn (hiding)** chứ không phải ghi đè (overriding).

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 1 (JDK/JVM, String, OOP, Từ khóa)](../../java/basis/java-basic-questions-01.md) · [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Inheritance.pdf) · [PPTX](/media/pro192/slides/Inheritance.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (2 ảnh)</summary>

![Sơ đồ Slot 16: inheritance5](/media/pro192/images/inheritance5.png)

![Sơ đồ Slot 16: hidden-method](/media/pro192/images/hidden-method.png)

</details>

---

**Điều hướng:** [← Slot 15](./slot-15.md) | [Mục lục PRO192](../README.md) | [Slot 17 →](./slot-17.md)
