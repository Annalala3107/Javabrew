---
slot: 14
stage: 4
title: "Slot 14: Bản chất Kế thừa (Inheritance), Từ khóa extends & Quan hệ is-a/has-a"
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

# Slot 14: Bản chất Kế thừa (Inheritance), Từ khóa extends & Quan hệ is-a/has-a

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 4: Kế thừa (Inheritance), Array of Objects & Casting
- **Trọng tâm thi:** `Thi PE (Q2)` `Thi FE` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Inheritance.pdf) · [Slide PPTX](/media/pro192/slides/Inheritance.pptx)
- **Liên kết đề PE thật:** `PE1-Q2` · `PE2-Q2` · `PE3-Q2` · `PE4-Q2` · `PE5-Q2` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt quan hệ `is-a` (`extends` — kế thừa) và `has-a` (aggregation/composition).
- Hiểu nguyên lý Kế thừa đơn (Single Inheritance) của Java Class và lớp tổ phụ mặc định `java.lang.Object`.
- Xác định đúng những thành phần lớp con được thừa hưởng vs thành phần `private` không truy cập trực tiếp được.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide **`Inheritance.pptx`** (từ slide *Objectives*, *Derived and Super Classes*, *Object-Oriented Relationships* đến slide *How to construct a class hierarchy?*).

---

### 1. Mục tiêu và Bản chất của Kế thừa (Inheritance)

![Minh họa cây kế thừa trong Java](/media/pro192/images/inheritance1.png)

*(Trỏ vào slide: `Inheritance.pptx` > Slide "Derived and Super Classes", sơ đồ phân cấp thực thể)*

* **Tái sử dụng mã nguồn (Code Reusability):** Các ngôn ngữ hướng đối tượng hiện thực hóa khả năng tái sử dụng cấu trúc mã nguồn thông qua cơ chế kế thừa. Kế thừa mô tả mối quan hệ giữa các lớp, trong đó một lớp con thừa hưởng toàn bộ cấu trúc dữ liệu và hành vi của lớp cha.
* **Quá trình trừu tượng hóa từ trên xuống dưới:**
  * Gốc của bản thiết kế là một thực thể mang tính **trừu tượng tương đối (relatively abstract entity)**.
  * Dựa trên thực thể gốc đó, ta xây dựng nên các thực thể ngày càng **cụ thể và chi tiết hơn (concrete entities)**.
  * Các thực thể ở tầng cao hơn được gọi là **Lớp cha / Lớp cơ sở (Superclass / Base class / Parent class)**.
  * Các thực thể ở tầng dưới được xây dựng từ lớp cha được gọi là **Lớp con / Lớp dẫn xuất (Subclass / Derived class / Child class)**.
* *(Ví dụ trong slide `Inheritance.pptx`):* Cây phân cấp từ trừu tượng đến cụ thể:
  `Item` → `Food` → `Perishable / Frozen` → `Cheese / Peas`

---

### 2. Hai mối quan hệ kinh điển: "is-a" và "has-a"
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Object-Oriented Relationships", mô hình Person - Professor - Student)*

Trong thiết kế hướng đối tượng, việc phân định rõ hai mối quan hệ này là tiêu chuẩn để chọn giữa việc cho kế thừa hay dùng biến tham chiếu thành phần:

1. **Mối quan hệ "is-a" (Là một / A kind of):**
   * Được hiện thực hóa bằng **Lớp con kế thừa từ Lớp cha (`extends`)**.
   * *Ví dụ trong slide:* `Student` là một `Person` (`Student is-a Person`); `Professor` là một `Person` (`Professor is-a Person`). Cả hai lớp `Student` và `Professor` đều kế thừa các thuộc tính chung từ `Person` như `name`, `address`, `birthDate`, và các phương thức `getName()`, `setName()`.
2. **Mối quan hệ "has-a" (Sở hữu / Thành phần):**
   * Được hiện thực hóa bằng **Biến tham chiếu (Reference field)** bên trong lớp.
   * *Ví dụ trong slide:* Một ngôi nhà có một gia đình và thú cưng ("A home is a house that has a family and a pet"). Lớp `Professor` sở hữu danh sách sinh viên hướng dẫn thông qua thuộc tính `Student[] students`; lớp `Student` sở hữu giáo viên thông qua thuộc tính tham chiếu `Professor pr`. Hai đối tượng trong quan hệ "has-a" hoàn toàn không cần chia sẻ chung cấu trúc kế thừa.

---

### 3. Kỹ thuật xây dựng cây phân cấp lớp bằng phép giao (Intersection)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "How to construct a class hierarchy? -> Intersection", sơ đồ Vase, Statue, Painting)*

Khi phân tích bài toán thực tế có nhiều đối tượng độc lập, làm thế nào để thiết kế cây kế thừa tối ưu? Slide bài giảng chỉ ra kỹ thuật **Phép giao (Intersection)**:

* **Bước 1: Liệt kê các thuộc tính của từng thực thể cụ thể:**
  * `Vase` (Lọ hoa): `value`, `height`, `material`, `creator`.
  * `Statue` (Bức tượng): `value`, `weight`, `creator`, `colour`.
  * `Painting` (Bức tranh): `value`, `height`, `width`, `isWatercolour`, `isFramed`, `creator`.
* **Bước 2: Tìm tập hợp giao các thuộc tính chung (Intersection):**
  * Cả 3 đối tượng trên đều có chung hai thuộc tính: **`value`** (giá trị) và **`creator`** (tác giả sáng tác).
* **Bước 3: Trích xuất thành Lớp cha trừu tượng (`Item`):**
  * Ta tạo lớp cha **`Item`** chứa 2 thuộc tính chung: `value` và `creator`.
  * Các lớp `Vase`, `Statue`, `Painting` chỉ việc kế thừa từ `Item` và khai báo thêm các thuộc tính đặc thù riêng của chính nó (`material`, `weight`, `colour`, `isWatercolour`,...). Nhờ đó loại bỏ hoàn toàn mã nguồn trùng lặp!

---

### 4. Cú pháp từ khóa `extends` & Nguyên lý Kế thừa đơn trong Java
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Inheritance", "extends keyword")*

* **Cú pháp:**
  ```java
  public class SubClass extends SuperClass {
      // khai báo thêm thuộc tính và phương thức riêng
  }
  ```
* **Đặc tính Kế thừa đơn (Single Inheritance):**
  * Trong Java, **một lớp chỉ có thể kế thừa trực tiếp từ duy nhất một lớp cha** (`Java is a single-inherited OOP language`). Java không hỗ trợ đa kế thừa lớp trực tiếp (Multiple class inheritance) như C++ nhằm tránh xung đột cấu trúc (Diamond Problem).
* **Lớp tổ phụ tối cao `java.lang.Object`:**
  * Nếu một lớp được khai báo mà không sử dụng từ khóa `extends`, trình biên dịch Java sẽ **tự động ngầm định cho lớp đó kế thừa trực tiếp từ lớp `java.lang.Object`**. Mọi đối tượng trong Java đều là con cháu của lớp `Object`.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 14:**
> - Lớp con **có thừa hưởng** không gian dữ liệu của thuộc tính `private` từ lớp cha, nhưng **không được truy cập trực tiếp** (`this.name` sẽ lỗi compile — phải gọi qua `getName()` hoặc `super.getName()`).
> - Java cấm đa kế thừa giữa các class (`class C extends A, B` là lỗi biên dịch).

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 14.1: Phân định quan hệ "is-a" và "has-a" trong mã nguồn

**Đề bài:** 
Xét đoạn mã sau:
```java
public class Engine {
    private int horsepower;
}

public class Vehicle {
    private String brand;
}

public class Truck extends Vehicle {
    private Engine engine;
}
```
Hãy chỉ rõ mối quan hệ giữa `Truck` và `Vehicle`, và mối quan hệ giữa `Truck` và `Engine` là quan hệ gì ("is-a" hay "has-a")? Cơ chế cú pháp nào trong Java thể hiện điều đó?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Giữa `Truck` và `Vehicle`: Là quan hệ **"is-a"** (Xe tải là một phương tiện giao thông). Thể hiện qua từ khóa kế thừa **`extends`** (`public class Truck extends Vehicle`).
* Giữa `Truck` và `Engine`: Là quan hệ **"has-a"** (Xe tải sở hữu một động cơ). Thể hiện qua việc khai báo **biến tham chiếu thành phần** (`private Engine engine;`) bên trong thân lớp `Truck`.

</details>

---

### Bài 14.2: Kỹ thuật xây dựng cây phân cấp lớp bằng phép giao thuộc tính

**Đề bài:** 
Hệ thống quản lý phương tiện có 2 loại xe:
* `Car`: `id`, `brand`, `price`, `numberOfDoors`
* `Motorbike`: `id`, `brand`, `price`, `hasSidecar`
Hãy áp dụng kỹ thuật phép giao (Intersection) trong slide `Inheritance.pptx` để thiết kế lớp cha `Vehicle` và cấu trúc các lớp con `Car`, `Motorbike` nhằm tối ưu hóa việc tái sử dụng mã nguồn.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Phép giao:** Giao của hai tập thuộc tính là `{id, brand, price}`. Ta trích xuất tập giao này thành lớp cha:
  ```java
  public class Vehicle {
      protected String id;
      protected String brand;
      protected double price;
  }
  ```
* **Lớp con `Car` kế thừa `Vehicle`:** Chỉ cần khai báo thêm thuộc tính đặc thù riêng:
  ```java
  public class Car extends Vehicle {
      private int numberOfDoors;
  }
  ```
* **Lớp con `Motorbike` kế thừa `Vehicle`:**
  ```java
  public class Motorbike extends Vehicle {
      private boolean hasSidecar;
  }
  ```

</details>

---

### Bài 14.3: Nguyên lý Kế thừa đơn (Single Inheritance)

**Đề bài:** 
Đoạn khai báo lớp sau có biên dịch thành công trong Java không? Tại sao?
```java
public class Manager extends Employee, Person {
    // code
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Đoạn mã trên **BỊ LỖI BIÊN DỊCH**.
* **Nguyên nhân:** Java là ngôn ngữ **kế thừa đơn (single-inherited OOP language)** đối với lớp. Một lớp chỉ được phép đứng sau từ khóa `extends` một lớp cha duy nhất. Cú pháp kế thừa từ hai lớp cha phân tách bằng dấu phẩy như trên là không hợp lệ trong Java.

</details>

---

### Bài 14.4: Lớp tổ phụ mặc định `java.lang.Object`

**Đề bài:** 
Một lập trình viên khai báo:
```java
public class Book {
    private String title;
}
```
Lớp `Book` trên có lớp cha không? Nếu bạn gọi lệnh `Book b = new Book(); System.out.println(b.toString());` thì phương thức `toString()` ở đâu ra khi trong lớp `Book` không hề viết hàm này?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Lớp `Book` **có lớp cha**. Theo quy tắc trong slide `Inheritance.pptx`, nếu một lớp không khai báo từ khóa `extends` với lớp nào thì nó sẽ **tự động ngầm định kế thừa từ lớp `java.lang.Object`**.
* Phương thức `toString()` mà đối tượng `b` gọi chính là phương thức được kế thừa trực tiếp từ lớp tổ phụ tối cao `java.lang.Object`.

</details>

---

### Bài 14.5: Khả năng truy xuất thuộc tính kế thừa

**Đề bài:** 
Lớp cha `Parent` có 2 trường: `private int x;` và `protected int y;`. Lớp con `Child extends Parent` có thể truy cập trực tiếp bằng lệnh `this.x` và `this.y` bên trong phương thức của lớp con không? Giải thích vì sao dựa trên kiến thức kết hợp giữa Slot 13 và Slot 14.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Lệnh `this.x`: **KHÔNG THỂ truy xuất trực tiếp** (báo lỗi biên dịch) vì trường `x` mang mức truy cập `private` trong lớp cha; thuộc tính `private` chỉ có thể được truy xuất nội bộ bên trong chính lớp cha đó.
* Lệnh `this.y`: **CÓ THỂ truy xuất trực tiếp** vì trường `y` mang mức truy cập `protected`. Lớp con kế thừa dù nằm cùng hay khác package đều được quyền truy xuất các thành phần `protected` của lớp cha.

</details>


---

### 💻 Luyện Code Thực hành (JavaBrew Live Lab)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **JavaBrew Live Lab**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 14A: Inheritance — Sửa lỗi Truy cập `private` từ Lớp con
- **Mục tiêu:** Sửa `ElectricCar extends Vehicle` truy cập `brand` qua getter công khai thay vì đọc trực tiếp field `private`.
- **Expected Output:**
  - `Brand: VinFast, Battery: 85 kWh`

```java
class Vehicle {
    private String brand;
    Vehicle(String brand) { this.brand = brand; }
    public String getBrand() { return brand; }
}

class ElectricCar extends Vehicle {
    private int battery;
    ElectricCar(String brand, int battery) {
        super(brand);
        this.battery = battery;
    }
    String info() {
        // TODO: Thay this.brand bang loi goi getter hop le
        return "Brand: " + this.brand + ", Battery: " + battery + " kWh";
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new ElectricCar("VinFast", 85).info());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 14A)</summary>

```java
class Vehicle {
    private String brand;
    Vehicle(String brand) { this.brand = brand; }
    public String getBrand() { return brand; }
}

class ElectricCar extends Vehicle {
    private int battery;
    ElectricCar(String brand, int battery) {
        super(brand);
        this.battery = battery;
    }
    String info() {
        return "Brand: " + getBrand() + ", Battery: " + battery + " kWh";
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new ElectricCar("VinFast", 85).info());
    }
}
```

* **Giải thích:** Thuộc tính `private` của lớp cha vẫn nằm trong vùng nhớ đối tượng lớp con, nhưng chỉ truy cập gián tiếp được qua getter/setter công khai (hoặc đổi cha sang `protected`).

</details>

---

#### 🟡 Thực hành 14B: Quan hệ `is-a` (`extends`) kết hợp `has-a` (Composition)
- **Mục tiêu:** Thiết kế `Employee extends Person` (`is-a`) và chứa trường `Address` (`has-a`).
- **Expected Output:**
  - `Minh | salary=1200.0 | city=Ha Noi`
- 🔗 [Mở bài lab Slot 14 trên JavaBrew Live Lab](/studio/playground?example=slot-14-lab)

```java
class Address {
    String city;
    Address(String city) { this.city = city; }
}

class Person {
    private String name;
    Person(String name) { this.name = name; }
    public String getName() { return name; }
}

class Employee extends Person {
    private double salary;
    // TODO: Them field Address (has-a) va constructor Employee(name, salary, addr)
    Employee(String name, double salary) {
        super(name);
        this.salary = salary;
    }
    String info() {
        return getName() + " | salary=" + salary;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Employee("Minh", 1200.0).info());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 14B)</summary>

```java
class Address {
    String city;
    Address(String city) { this.city = city; }
}

class Person {
    private String name;
    Person(String name) { this.name = name; }
    public String getName() { return name; }
}

class Employee extends Person {
    private double salary;
    private Address addr;

    Employee(String name, double salary, Address addr) {
        super(name);
        this.salary = salary;
        this.addr = addr;
    }

    String info() {
        return getName() + " | salary=" + salary + " | city=" + addr.city;
    }
}

public class Main {
    public static void main(String[] args) {
        Employee e = new Employee("Minh", 1200.0, new Address("Ha Noi"));
        System.out.println(e.info());
    }
}
```

* **Giải thích:** Trong bài đa file trên JavaBrew Live Lab (`slot-14-lab`), bạn sẽ thấy rõ cách tách `Person.java` thành file độc lập đúng chuẩn NetBeans/PE.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Cơ bản — Phần 2 (Kế thừa, Đa hình, Abstract/Interface)](../../java/basis/java-basic-questions-02.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Inheritance.pdf) · [PPTX](/media/pro192/slides/Inheritance.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (2 ảnh)</summary>

![Sơ đồ Slot 14: inheritance1](/media/pro192/images/inheritance1.png)

![Sơ đồ Slot 14: inheritance2](/media/pro192/images/inheritance2.png)

</details>

---

**Điều hướng:** [← Slot 13](./slot-13.md) | [Mục lục PRO192](../README.md) | [Slot 15 →](./slot-15.md)
