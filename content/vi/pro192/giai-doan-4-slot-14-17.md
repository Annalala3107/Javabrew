---
title: "Giai đoạn 4 (Slot 14–17): Kế thừa (Inheritance), Array of Objects & Casting"
category: PRO192
slots: "Slot 14 – 17"
lang: vi
description: "Quan hệ is-a vs has-a, từ khóa extends, Constructor Chaining với super(), Method Overriding, Hiding Method, instanceof và ép kiểu đối tượng."
---

# GIÁO TRÌNH TOÀN DIỆN JAVA OOP - GIAI ĐOẠN 4: KẾ THỪA & TÁI SỬ DỤNG MÃ NGUỒN (SLOT 14 - 17)

## LỜI MỞ ĐẦU GIAI ĐOẠN 4
Sau khi đã làm chủ tư duy đóng gói, thiết kế lớp và vòng đời đối tượng ở Giai đoạn 3, Giai đoạn 4 mở ra cánh cửa của trụ cột thứ hai trong lập trình hướng đối tượng: **Kế thừa (Inheritance)**.

Kế thừa không đơn thuần là việc "viết ít code đi" bằng cách dùng lại những gì đã có, mà là phương pháp tổ chức thế giới thực theo mô hình phân cấp từ trừu tượng hóa đến cụ thể hóa. Trong 4 slot học này, bạn sẽ nắm trọn vẹn:
1. Bản chất quan hệ "is-a", từ khóa `extends`, kỹ thuật trích xuất lớp cha bằng phép giao (Intersection) và nguyên lý kế thừa đơn (Slot 14).
2. Chuỗi hàm khởi tạo (Constructor Chaining), từ khóa `super(...)` và cơ chế khởi tạo bộ nhớ từ trên xuống dưới (Slot 15).
3. Kỹ thuật ghi đè phương thức (Method Overriding), 4 quy tắc khắt khe khi ghi đè, vai trò bảo vệ của chú thích `@Override`, và sự khác biệt giữa ghi đè thể hiện với che giấu phương thức tĩnh (Hiding Method) (Slot 16).
4. Phân biệt kiểu tĩnh (Static Type) và kiểu động (Dynamic Type), kiểm tra an toàn kiểu bằng toán tử `instanceof`, kỹ thuật ép kiểu (Upcasting & Downcasting) và phòng ngừa ngoại lệ `ClassCastException` trong quản lý mảng đối tượng đa hình (Slot 17).

Mỗi slot đều được thiết kế gồm 2 phần thống nhất: **Nội dung bài học lý thuyết chuyên sâu bám sát slide** và **Bộ 5 bài tập tự luyện có lời giải chi tiết**, đảm bảo bạn vừa hiểu sâu bản chất, vừa có khả năng vận dụng thành thạo vào các bài toán thực tế.

---

# BÀI HỌC SLOT 14: BẢN CHẤT CỦA KẾ THỪA, TỪ KHÓA `extends` & QUAN HỆ "is-a"
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

---

## BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 14 (KÈM LỜI GIẢI CHI TIẾT)

### Bài 14.1: Phân định quan hệ "is-a" và "has-a" trong mã nguồn
* **Đề bài:** 
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
* **Đáp án & Lời giải chi tiết:**
  * Giữa `Truck` và `Vehicle`: Là quan hệ **"is-a"** (Xe tải là một phương tiện giao thông). Thể hiện qua từ khóa kế thừa **`extends`** (`public class Truck extends Vehicle`).
  * Giữa `Truck` và `Engine`: Là quan hệ **"has-a"** (Xe tải sở hữu một động cơ). Thể hiện qua việc khai báo **biến tham chiếu thành phần** (`private Engine engine;`) bên trong thân lớp `Truck`.

---

### Bài 14.2: Kỹ thuật xây dựng cây phân cấp lớp bằng phép giao thuộc tính
* **Đề bài:** 
  Hệ thống quản lý phương tiện có 2 loại xe:
  * `Car`: `id`, `brand`, `price`, `numberOfDoors`
  * `Motorbike`: `id`, `brand`, `price`, `hasSidecar`
  Hãy áp dụng kỹ thuật phép giao (Intersection) trong slide `Inheritance.pptx` để thiết kế lớp cha `Vehicle` và cấu trúc các lớp con `Car`, `Motorbike` nhằm tối ưu hóa việc tái sử dụng mã nguồn.
* **Đáp án & Lời giải chi tiết:**
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

---

### Bài 14.3: Nguyên lý Kế thừa đơn (Single Inheritance)
* **Đề bài:** 
  Đoạn khai báo lớp sau có biên dịch thành công trong Java không? Tại sao?
  ```java
  public class Manager extends Employee, Person {
      // code
  }
  ```
* **Đáp án & Lời giải chi tiết:**
  * Đoạn mã trên **BỊ LỖI BIÊN DỊCH**.
  * **Nguyên nhân:** Java là ngôn ngữ **kế thừa đơn (single-inherited OOP language)** đối với lớp. Một lớp chỉ được phép đứng sau từ khóa `extends` một lớp cha duy nhất. Cú pháp kế thừa từ hai lớp cha phân tách bằng dấu phẩy như trên là không hợp lệ trong Java.

---

### Bài 14.4: Lớp tổ phụ mặc định `java.lang.Object`
* **Đề bài:** 
  Một lập trình viên khai báo:
  ```java
  public class Book {
      private String title;
  }
  ```
  Lớp `Book` trên có lớp cha không? Nếu bạn gọi lệnh `Book b = new Book(); System.out.println(b.toString());` thì phương thức `toString()` ở đâu ra khi trong lớp `Book` không hề viết hàm này?
* **Đáp án & Lời giải chi tiết:**
  * Lớp `Book` **có lớp cha**. Theo quy tắc trong slide `Inheritance.pptx`, nếu một lớp không khai báo từ khóa `extends` với lớp nào thì nó sẽ **tự động ngầm định kế thừa từ lớp `java.lang.Object`**.
  * Phương thức `toString()` mà đối tượng `b` gọi chính là phương thức được kế thừa trực tiếp từ lớp tổ phụ tối cao `java.lang.Object`.

---

### Bài 14.5: Khả năng truy xuất thuộc tính kế thừa
* **Đề bài:** 
  Lớp cha `Parent` có 2 trường: `private int x;` và `protected int y;`. Lớp con `Child extends Parent` có thể truy cập trực tiếp bằng lệnh `this.x` và `this.y` bên trong phương thức của lớp con không? Giải thích vì sao dựa trên kiến thức kết hợp giữa Slot 13 và Slot 14.
* **Đáp án & Lời giải chi tiết:**
  * Lệnh `this.x`: **KHÔNG THỂ truy xuất trực tiếp** (báo lỗi biên dịch) vì trường `x` mang mức truy cập `private` trong lớp cha; thuộc tính `private` chỉ có thể được truy xuất nội bộ bên trong chính lớp cha đó.
  * Lệnh `this.y`: **CÓ THỂ truy xuất trực tiếp** vì trường `y` mang mức truy cập `protected`. Lớp con kế thừa dù nằm cùng hay khác package đều được quyền truy xuất các thành phần `protected` của lớp cha.

---

# BÀI HỌC SLOT 15: CHUỖI HÀM KHỞI TẠO (CONSTRUCTOR CHAINING) & TỪ KHÓA `super`
* **Tài liệu học tập tương ứng:** Bộ slide **`Inheritance.pptx`** (từ slide *"super" Keyword*, *Constructors Are Not Inherited* đến slide *Rectangle.java*, *Box.java* và *Demo_1.java*).

---

### 1. Hàm khởi tạo KHÔNG được kế thừa (Constructors Are Not Inherited)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Inheritance", "super Keyword: Constructors Are Not Inherited")*

* **Nguyên lý quan trọng:** Không giống như các thành phần bình thường khác (thuộc tính `fields` hay các phương thức `methods`), **hàm khởi tạo (constructor) của lớp cha KHÔNG được kế thừa cho lớp con**.
* **Lý do kỹ thuật:** Constructor của lớp cha mang tên của chính lớp cha và chỉ được thiết kế để khởi tạo các thuộc tính thuộc phạm vi của lớp cha đó. Nó không hề biết lớp con sẽ mở rộng thêm những trường dữ liệu nào, do đó nó không thể tự khởi tạo hoàn chỉnh một đối tượng lớp con.

---

### 2. Từ khóa `super(...)` để tái sử dụng Constructor của lớp cha
*(Trỏ vào slide: `Inheritance.pptx` > Slide "super Keyword", cú pháp `super(arguments)`)*

* **Cú pháp:** `super(arguments);` được sử dụng để gọi trực tiếp constructor tương ứng của lớp cha.
* **Quy tắc bất di bất dịch:** Lời gọi `super(...)` **bắt buộc phải là câu lệnh đầu tiên (first statement)** nằm trong thân constructor của lớp con.
* *(Ví dụ trong slide `Box.java` kế thừa `Rectangle`):*
  ```java
  public class Box extends Rectangle {
      private int height = 0;

      public Box() {
          super(); // Gọi constructor không đối số của Rectangle
      }

      public Box(int l, int w, int h) {
          super(l, w); // Gọi constructor Rectangle(int l, int w) để khởi tạo chiều dài và rộng
          height = h > 0 ? h : 0; // Sau đó mới khởi tạo thuộc tính riêng của Box
      }
  }
  ```
  *(Trích từ slide `Box.java`)*.
* ⚠️ **Cảnh báo lỗi biên dịch:** Nếu bạn đảo vị trí:
  ```java
  public Box(int l, int w, int h) {
      height = h > 0 ? h : 0;
      super(l, w); // BÁO LỖI BIÊN DỊCH: call to super must be first statement in constructor
  }
  ```
  *(Slide ghi chú: "Try swapping these statements" để nhắc nhở học viên lỗi này)*.

---

### 3. Cơ chế tự động chèn `super()` của trình biên dịch
*(Trỏ vào slide: `Inheritance.pptx` > Slide "super Keyword - Note")*

* **Quy tắc tự động:** Nếu trong constructor của lớp con, lập trình viên **không chủ động viết lời gọi `super(...)`**, trình biên dịch Java sẽ **tự động chèn lời gọi `super();` (gọi constructor không tham số của lớp cha)** vào ngay đầu constructor của lớp con.
* **Nguy cơ lỗi thời gian biên dịch (Compile-time Error):**
  * Nếu lớp cha đã tự định nghĩa một constructor có tham số mà **quên không khai báo constructor mặc định không tham số**.
  * Khi đó lớp con cố gắng gọi ngầm định `super();`, trình biên dịch sẽ tìm không thấy constructor không đối số trong lớp cha và **lập tức ném ra lỗi biên dịch**!

---

### 4. Trật tự thực thi chuỗi Constructor (Order of Constructor Invocation)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Summary" & slide minh họa bộ nhớ)*

Khi khởi tạo một đối tượng lớp con (ví dụ `new Box(2, 2, 2)`):
* Quy trình khởi tạo luôn diễn ra **từ trên đỉnh cây phân cấp đi dần xuống dưới (from the superclass to the derived class)**:
  1. Constructor của `java.lang.Object` chạy đầu tiên.
  2. Constructor của `Rectangle` chạy tiếp theo để dọn ô nhớ và gán `length`, `width`.
  3. Cuối cùng, thân constructor của `Box` mới được chạy để gán trường `height`.

---

## BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 15 (KÈM LỜI GIẢI CHI TIẾT)

### Bài 15.1: Vị trí của lời gọi `super(...)` trong Constructor
* **Đề bài:** 
  Đoạn mã sau có biên dịch thành công không? Nếu có lỗi, hãy chỉ rõ dòng lệnh bị lỗi và giải thích nguyên nhân dựa trên quy tắc trong slide `Inheritance.pptx`:
  ```java
  public class Parent {
      protected int x;
      public Parent(int x) { this.x = x; }
  }

  public class Child extends Parent {
      private int y;
      public Child(int x, int y) {
          this.y = y;
          super(x);
      }
  }
  ```
* **Đáp án & Lời giải chi tiết:**
  * **Bị lỗi biên dịch** tại dòng `super(x);`.
  * **Thông báo lỗi:** `call to super must be first statement in constructor`.
  * **Nguyên nhân:** Lời gọi `super(...)` để tái sử dụng constructor lớp cha bắt buộc phải là câu lệnh đầu tiên trong thân constructor của lớp con. Ở đây, lệnh `this.y = y;` đứng trước `super(x);` nên bị trình biên dịch từ chối.

---

### Bài 15.2: Cơ chế tự động chèn `super()` và lỗi thiếu Constructor mặc định
* **Đề bài:** 
  Xét đoạn mã sau:
  ```java
  class Animal {
      public Animal(String name) {
          System.out.println("Animal: " + name);
      }
  }

  class Dog extends Animal {
      public Dog() {
          System.out.println("Dog created");
      }
  }
  ```
  Tại sao khi biên dịch lớp `Dog`, Java lại thông báo lỗi `constructor Animal in class Animal cannot be applied to given types; required: java.lang.String; found: no arguments`?
* **Đáp án & Lời giải chi tiết:**
  * **Nguyên nhân:**
    1. Do trong constructor `Dog()` không viết `super(...)`, trình biên dịch sẽ tự động chèn lệnh `super();` vào dòng đầu tiên.
    2. Lớp cha `Animal` đã tự khai báo một constructor có tham số `Animal(String name)`, dẫn đến việc trình biên dịch **không tự động sinh ra constructor không đối số `Animal()`**.
    3. Vì vậy, lệnh `super();` ngầm định của `Dog` không thể tìm thấy constructor tương ứng trong `Animal`, gây lỗi biên dịch.
  * **Cách khắc phục:** Khai báo thêm constructor `public Animal() {}` trong lớp cha hoặc gọi tường minh `super("chó con");` trong constructor của lớp con.

---

### Bài 15.3: Thứ tự thực thi khi khởi tạo đối tượng nhiều tầng kế thừa
* **Đề bài:** 
  Cho 3 lớp có quan hệ kế thừa như sau:
  ```java
  class A {
      public A() { System.out.print("A "); }
  }
  class B extends A {
      public B() { System.out.print("B "); }
  }
  class C extends B {
      public C() { System.out.print("C "); }
  }
  ```
  Khi chạy lệnh `C obj = new C();`, màn hình sẽ in ra chuỗi ký tự nào? Giải thích trật tự thực thi.
* **Đáp án & Lời giải chi tiết:**
  * **Kết quả in ra:** `A B C `
  * **Giải thích:**
    * Lớp `C` gọi ngầm định `super();` lên `B`.
    * Lớp `B` gọi ngầm định `super();` lên `A`.
    * Lớp `A` gọi ngầm định `super();` lên `Object`.
    * Do đó, chuỗi constructor được kích hoạt từ lớp cha cao nhất xuống lớp con: thân constructor `A` chạy trước in ra `"A "`, tiếp đến constructor `B` chạy in ra `"B "`, cuối cùng constructor `C` hoàn tất in ra `"C "`.

---

### Bài 15.4: Sử dụng `super(...)` truyền tham số trong Case Study Hình chữ nhật và Khối hộp
*(Trích từ slide `Rectangle.java` và `Box.java`)*

* **Đề bài:** 
  Lớp `Rectangle` có các thuộc tính `protected int length, width;` và constructor `public Rectangle(int l, int w)`. Hãy viết constructor `public Box(int l, int w, int h)` cho lớp `Box extends Rectangle` sao cho tận dụng tối đa constructor của lớp cha để gán `length` và `width`, đồng thời tự gán thuộc tính `height`.
* **Đáp án & Lời giải chi tiết:**
  ```java
  public class Box extends Rectangle {
      private int height;

      public Box(int l, int w, int h) {
          super(l, w); // Tái sử dụng constructor của Rectangle
          this.height = (h > 0) ? h : 0;
      }
  }
  ```
  * **Giải thích:** Dùng `super(l, w)` để chuyển giao việc kiểm tra và khởi tạo 2 thuộc tính `length` và `width` cho lớp cha `Rectangle`, lớp con chỉ việc tập trung xử lý thuộc tính bổ sung của riêng nó.

---

### Bài 15.5: Phân biệt cách dùng từ khóa `super` và `this`
* **Đề bài:** 
  Trong mối quan hệ kế thừa của Java, từ khóa `this` và từ khóa `super` đại diện cho điều gì khi:
  1. Đi kèm dấu ngoặc đơn: `this(...)` so với `super(...)`.
  2. Đi kèm toán tử dấu chấm: `this.member` so với `super.member`.
* **Đáp án & Lời giải chi tiết:**
  1. **Khi đi kèm dấu ngoặc đơn:**
     * `this(...)`: Dùng để gọi một constructor khác **trong cùng một lớp** (overloaded constructor).
     * `super(...)`: Dùng để gọi constructor của **lớp cha trực tiếp**.
     *(Cả hai lệnh này nếu dùng đều phải là câu lệnh đầu tiên trong thân constructor, do đó chúng không thể cùng xuất hiện trong một constructor)*.
  2. **Khi đi kèm toán tử dấu chấm:**
     * `this.member`: Truy xuất thuộc tính hoặc phương thức của **đối tượng hiện hành**.
     * `super.member`: Truy xuất thuộc tính hoặc gọi phiên bản phương thức được định nghĩa tại **lớp cha** (thường dùng khi phương thức bị lớp con ghi đè).

---

# BÀI HỌC SLOT 16: GHI ĐÈ PHƯƠNG THỨC (METHOD OVERRIDING), CHÚ THÍCH `@Override` & CHE GIẤU PHƯƠNG THỨC TĨNH (HIDING METHOD)
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

---

## BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 16 (KÈM LỜI GIẢI CHI TIẾT)

### Bài 16.1: Phân biệt Nạp chồng (Overloading) và Ghi đè (Overriding)
* **Đề bài:** 
  Hãy phân biệt sự khác nhau cơ bản giữa **Method Overloading** và **Method Overriding** dựa trên các tiêu chí: phạm vi lớp, chữ ký phương thức (signature), và kiểu trả về.
* **Đáp án & Lời giải chi tiết:**
  * **Về phạm vi:**
    * *Overloading:* Xảy ra trong cùng một lớp (hoặc giữa lớp cha và con) nhằm tạo ra các hàm cùng tên làm nhiều việc khác nhau.
    * *Overriding:* Bắt buộc phải xảy ra trong mối quan hệ kế thừa giữa lớp cha và lớp con.
  * **Về chữ ký phương thức:**
    * *Overloading:* Tên phương thức giống nhau, nhưng danh sách tham số **bắt buộc phải khác nhau** (về số lượng hoặc kiểu dữ liệu).
    * *Overriding:* Tên phương thức và danh sách tham số **bắt buộc phải giống hệt nhau**.
  * **Về kiểu trả về:**
    * *Overloading:* Kiểu trả về có thể tùy ý giống hoặc khác.
    * *Overriding:* Kiểu trả về phải giống nhau hoặc là kiểu dẫn xuất con (covariant type).

---

### Bài 16.2: Quy tắc nới rộng và thu hẹp Access Modifier khi ghi đè
* **Đề bài:** 
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
* **Đáp án & Lời giải chi tiết:**
  * `Child1`: **Biên dịch thành công**. Phương thức ở lớp cha là `protected`, lớp con nới rộng quyền truy cập thành `public` là hoàn toàn hợp lệ theo quy tắc kế thừa.
  * `Child2`: **Bị lỗi biên dịch** (`cannot reduce the visibility of the inherited method from Parent`). Lớp con hạ cấp quyền truy cập từ `protected` xuống `default` (thu hẹp quyền) là vi phạm quy tắc ghi đè.

---

### Bài 16.3: Tác dụng bảo vệ của chú thích `@Override`
* **Đề bài:** 
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
* **Đáp án & Lời giải chi tiết:**
  * **Khi có `@Override`:** Trình biên dịch sẽ **báo lỗi ngay lập tức**: `method does not override or implement a method from a supertype`. Nhờ chú thích `@Override`, trình biên dịch phát hiện ra trong lớp `Object` chỉ có `toString()` chứ không có phương thức nào tên là `tostring()`.
  * **Nếu bỏ `@Override`:** Chương trình sẽ biên dịch bình thường nhưng Java chỉ coi `tostring()` là một phương thức tự tạo mới của `Student`. Khi bạn gọi `System.out.println(studentObj);`, hàm `toString()` của `Object` vẫn chạy và in ra mã băm (`Student@15db9742`) thay vì chuỗi `"Student: Nam"`.

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
* **Đáp án & Lời giải chi tiết:**
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
* **Đáp án & Lời giải chi tiết:**
  * **Kết quả in ra:** `Static from SuperClass`
  * **Giải thích cơ chế:**
    * Phương thức tĩnh (`static`) thuộc về lớp chứ không gắn liền với thể hiện đối tượng trên Heap. Do đó, phương thức tĩnh **không bị ghi đè theo cơ chế liên kết động (Dynamic binding)**.
    * Khi bạn gọi `obj.test()`, trình biên dịch kiểm tra kiểu khai báo của biến `obj`. Vì `obj` được khai báo với kiểu tham chiếu là `SuperClass`, JVM sẽ liên kết trực tiếp và gọi phương thức `test()` của `SuperClass`. Phương thức của `SubClass` ở đây chỉ đóng vai trò che giấu (`hiding`), không thể ghi đè.

---

# BÀI HỌC SLOT 17: TOÁN TỬ `instanceof`, ÉP KIỂU ĐỐI TƯỢNG (CASTING) & LIÊN KẾT ĐỘNG
* **Tài liệu học tập tương ứng:** Bộ slide **`Inheritance.pptx`** (từ slide *Using an "instanceof" operator*, *Dynamic and Static type*, *Casting* đến slide *Summary* [149–151]) kết hợp case study `ArrayOfObjects.pptx`.

---

### 1. Phân biệt Kiểu tĩnh (Static Type) và Kiểu động (Dynamic Type)
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Dynamic and Static type")*

Xét khai báo kinh điển giữa lớp cha `Rectangle` và lớp con `Box`:
```java
Rectangle obj1 = new Box(); // Rectangle là lớp cha, Box là lớp con
Box obj2 = new Box();
```

* **Kiểu tĩnh (Static Type):** 
  * Là kiểu dữ liệu được khai báo ban đầu của biến tham chiếu (`declared type`).
  * Ở ví dụ trên, kiểu tĩnh của biến `obj1` là **`Rectangle`**.
  * Kiểu tĩnh được **trình biên dịch kiểm tra tại thời điểm biên dịch (Compile-time)**. Trình biên dịch chỉ cho phép `obj1` gọi các phương thức có mặt trong khai báo của lớp `Rectangle`.
* **Kiểu động (Dynamic Type):** 
  * Là kiểu của đối tượng thực tế được cấp phát trên Heap tại thời điểm chương trình đang chạy (**Runtime**).
  * Ở ví dụ trên, kiểu động của `obj1` là **`Box`** (đối tượng sinh ra bởi `new Box()`).
  * Nhờ nguyên lý kế thừa, một biến tham chiếu kiểu lớp cha hoàn toàn có thể lưu trữ địa chỉ của một đối tượng thuộc lớp con.

---

### 2. Toán tử kiểm tra kiểu động: `instanceof`
*(Trỏ vào slide: `Inheritance.pptx` > Slide "Using an 'instanceof' operator", code ví dụ `if (obj1 instanceof Box) ...` & `ArrayOfObjects.pptx`)*

* **Định nghĩa:** `instanceof` là toán tử so sánh nhị phân trong Java dùng để kiểm tra xem đối tượng thực tế mà một biến tham chiếu đang trỏ tới **có phải là một thể hiện (instance) của một Lớp hoặc Giao diện cụ thể hay không**.
* **Cú pháp:** `referenceVariable instanceof TargetClass`.
* **Giá trị trả về:** Trả về **`true`** nếu đối tượng thuộc kiểu `TargetClass` (hoặc lớp con của nó); trả về **`false`** nếu không thuộc kiểu đó hoặc nếu biến tham chiếu đang có giá trị `null`.
* **Ví dụ trong bài giảng:**
  ```java
  Rectangle obj1 = new Box();
  if (obj1 instanceof Box) {
      System.out.println("obj1 is pointing to the Box object"); // In ra dòng này
  }
  ```
  *(Trích từ slide `Inheritance.pptx`)*.
* **Ứng dụng trong quản lý danh sách đa hình (`ArrayOfObjects.pptx`):**
  Trong case study quản lý cửa hàng đồ cổ `antiqueShop`, mảng `Item[] list` lưu chung các đối tượng `Vase`, `Statue`, `Painting`. Để lọc và hiển thị riêng các bức tượng hoặc bức tranh, hệ thống dùng `instanceof`:
  ```java
  if (list[i] instanceof Statue) System.out.println(list[i]);
  else if (list[i] instanceof Painting) System.out.println(list[i]);
  ```
  *(Trích từ slide `ArrayOfObjects.pptx`)*.

---

### 3. Kỹ thuật Ép kiểu đối tượng (Casting): Upcasting vs Downcasting

![Mảng đối tượng đa hình ItemList trong bộ nhớ](/media/pro192/images/array3.png)

*(Trỏ vào slide: `Inheritance.pptx` > Slide "Casting" & "Check the type before casting")*

* **Upcasting (Ép kiểu lên cha):**
  * Gán một đối tượng lớp con cho một biến tham chiếu kiểu lớp cha (ví dụ: `Rectangle r = new Box();`).
  * Cơ chế: Diễn ra **hoàn toàn tự động**, an toàn tuyệt đối và không cần dùng cú pháp ép kiểu tường minh.
* **Downcasting (Ép kiểu xuống con):**
  * Khi biến tham chiếu kiểu cha (`Rectangle obj`) đang thực sự trỏ tới đối tượng con (`Box`), bạn **không thể gọi trực tiếp các phương thức đặc thù riêng của lớp con** (như `obj.setHeight(...)`) vì trình biên dịch dựa vào kiểu tĩnh của cha để kiểm tra.
  * Để gọi phương thức riêng của con, bạn bắt buộc phải **ép kiểu tường minh (explicit casting)**:
    ```java
    Rectangle obj = new Box();
    ((Box) obj).setHeight(300); // Ép kiểu obj về Box để gọi setHeight
    ```
    *(Trích từ slide `Inheritance.pptx`)*.
* **Quy tắc vàng phòng ngừa `ClassCastException`:**
  Nếu bạn ép kiểu một đối tượng cha thực tế xuống một kiểu con không tương thích, JVM sẽ ném ra ngoại lệ nguy hiểm `java.lang.ClassCastException`. Do đó, nguyên tắc cốt tử từ slide bài giảng là:
  👉 **"Check the type of the reference variable before casting it explicitly"** *(Luôn dùng `instanceof` kiểm tra trước khi thực hiện Downcasting)*!

---

## BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 17 (KÈM LỜI GIẢI CHI TIẾT)

### Bài 17.1: Xác định Kiểu tĩnh và Kiểu động
* **Đề bài:** 
  Cho lớp `Person` là lớp cha của `Student`. Xét câu lệnh:
  ```java
  Person p = new Student("SE123", "Nam");
  ```
  Hãy chỉ rõ đâu là **Kiểu tĩnh (Static type)** và đâu là **Kiểu động (Dynamic type)** của biến `p`. Kiểu nào quyết định việc trình biên dịch cho phép gọi những phương thức nào?
* **Đáp án & Lời giải chi tiết:**
  * **Kiểu tĩnh (Static type):** Là `Person` (kiểu được khai báo cho biến `p` lúc đầu).
  * **Kiểu động (Dynamic type):** Là `Student` (kiểu của đối tượng thực tế được cấp phát trên Heap qua `new Student(...)`).
  * **Kiểu quyết định quyền gọi phương thức:** Chính là **Kiểu tĩnh (`Person`)**. Trình biên dịch chỉ cho phép gọi các phương thức đã được khai báo trong lớp `Person`. Nếu `Student` có phương thức riêng là `getMajorField()`, lệnh `p.getMajorField()` sẽ bị báo lỗi biên dịch trừ khi được ép kiểu.

---

### Bài 17.2: Toán tử `instanceof` trong cây phân cấp kế thừa
* **Đề bài:** 
  Cho cây kế thừa: `Dog extends Animal`, và `Animal` kế thừa từ `Object`. Xét đoạn mã:
  ```java
  Animal a = new Dog();
  System.out.println(a instanceof Dog);
  System.out.println(a instanceof Animal);
  System.out.println(a instanceof Object);
  ```
  Màn hình sẽ in ra các giá trị boolean nào? Giải thích vì sao.
* **Đáp án & Lời giải chi tiết:**
  * **Kết quả in ra:**
    ```text
    true
    true
    true
    ```
  * **Giải thích:**
    1. `a instanceof Dog`: Trả về `true` vì đối tượng thực tế trên Heap được tạo từ lớp `Dog`.
    2. `a instanceof Animal`: Trả về `true` vì `Dog` là một lớp con của `Animal` ("Dog is-a Animal").
    3. `a instanceof Object`: Trả về `true` vì mọi lớp trong Java đều là con cháu kế thừa của `java.lang.Object`.

---

### Bài 17.3: Lỗi gọi phương thức lớp con từ biến tham chiếu lớp cha
* **Đề bài:** 
  Lớp `Rectangle` có phương thức `area()`, lớp con `Box extends Rectangle` có thêm phương thức riêng `volume()`. Đoạn mã sau có biên dịch thành công không?
  ```java
  Rectangle r = new Box(2, 3, 4);
  System.out.println(r.area());
  System.out.println(r.volume());
  ```
  Nếu có lỗi, hãy sửa lại bằng kỹ thuật ép kiểu tường minh (Explicit Casting) theo slide bài học.
* **Đáp án & Lời giải chi tiết:**
  * **Khảo sát:** Lệnh `r.area()` chạy tốt, nhưng dòng lệnh `r.volume();` **BỊ LỖI BIÊN DỊCH** (`cannot find symbol method volume() in class Rectangle`).
  * **Nguyên nhân:** Kiểu tĩnh của `r` là `Rectangle`, mà trong lớp `Rectangle` hoàn toàn không có phương thức `volume()`.
  * **Sửa lại đúng với Downcasting:**
    ```java
    Rectangle r = new Box(2, 3, 4);
    System.out.println(r.area());
    System.out.println(((Box) r).volume()); // Ép kiểu r sang Box
    ```
    *(Trỏ vào slide: `Inheritance.pptx` > Slide "Casting")*.

---

### Bài 17.4: Nhận diện ngoại lệ `ClassCastException`
* **Đề bài:** 
  Xét đoạn mã sau:
  ```java
  Rectangle r = new Rectangle(5, 10);
  Box b = (Box) r;
  b.setHeight(20);
  ```
  Đoạn mã trên có vượt qua vòng biên dịch không? Khi chạy thực tế (Runtime) sẽ xảy ra hiện tượng gì?
* **Đáp án & Lời giải chi tiết:**
  * **Biên dịch:** Vẫn **biên dịch thành công** vì trình biên dịch chỉ thấy `Rectangle` và `Box` nằm chung cây kế thừa nên cho phép ép kiểu.
  * **Thời điểm chạy (Runtime):** Chương trình lập tức ném ra ngoại lệ: `java.lang.ClassCastException`.
  * **Nguyên nhân:** Đối tượng thực tế trên Heap được tạo bằng `new Rectangle(5, 10)` (chỉ là một hình chữ nhật thuần túy, không có thuộc tính `height` của hộp). Việc cố gắng ép một đối tượng cha thực sự thành đối tượng con là bất hợp pháp trong bộ nhớ Java.

---

### Bài 17.5: Ứng dụng `instanceof` duyệt mảng đa hình (Case Study ItemList)
*(Trích từ slide `ArrayOfObjects.pptx`)*

* **Đề bài:** 
  Cho mảng `Item[] list` lưu trữ hỗn hợp các đối tượng gồm `Vase`, `Statue`, và `Painting` (cả 3 đều kế thừa từ `Item`). Hãy viết một đoạn mã duyệt qua mảng `list` có `numOfItem` phần tử và chỉ in ra những đối tượng thuộc kiểu `Vase`.
* **Đáp án & Lời giải chi tiết:**
  ```java
  for (int i = 0; i < numOfItem; i++) {
      if (list[i] instanceof Vase) {
          System.out.println(list[i]);
      }
  }
  ```
  *(Trích từ slide `ArrayOfObjects.pptx` > Case study ItemList)*.
  * **Giải thích:** Toán tử `list[i] instanceof Vase` kiểm tra kiểu thực tế của từng phần tử tại Runtime. Chỉ những ô nhớ thực sự lưu trữ đối tượng `Vase` mới trả về `true` và được in ra màn hình.

---

## BẢNG TỔNG KẾT ĐỐI CHIẾU KIẾN THỨC GIAI ĐOẠN 4

| Khái niệm cốt lõi | Vị trí định nghĩa / Cú pháp | Bản chất kỹ thuật & Quy tắc bắt buộc | Lỗi thường gặp nếu dùng sai |
| :--- | :--- | :--- | :--- |
| **Kế thừa lớp (`extends`)** | `class Sub extends Super` | Kế thừa đơn: 1 lớp con chỉ có 1 lớp cha trực tiếp; kế thừa ngầm định `Object`. | Đa kế thừa lớp `extends A, B` (lỗi biên dịch). |
| **Quan hệ "is-a" vs "has-a"** | `extends` vs Biến tham chiếu | "is-a": chuyên biệt hóa phân loại; "has-a": thu nạp thành phần sở hữu. | Lạm dụng kế thừa cho các thực thể chỉ có quan hệ sở hữu. |
| **Gọi Constructor cha (`super`)** | `super(args);` | Constructor không được kế thừa; `super(...)` bắt buộc là lệnh đầu tiên trong constructor con. | Đặt `super(...)` sau các câu lệnh khác (lỗi biên dịch). |
| **Tự động chèn `super()`** | Mặc định trong constructor con | Trình biên dịch tự động chèn `super();` nếu không gọi tường minh. | Lớp cha thiếu constructor không tham số (lỗi biên dịch). |
| **Ghi đè (Method Overriding)** | `@Override` trên instance method | Trùng khớp chữ ký; kiểu trả về tương đương/hẹp hơn; không được thu hẹp quyền truy cập. | Gõ sai tên/tham số làm mất tính ghi đè, hoặc thu hẹp quyền truy cập. |
| **Che giấu phương thức (`static`)** | `public static void m()` ở cả 2 lớp | Không bị ghi đè động; phương thức được gọi dựa trên kiểu biến tham chiếu tại compile-time. | Hiểu nhầm phương thức tĩnh hỗ trợ tính đa hình động lúc chạy. |
| **Kiểm tra kiểu (`instanceof`)** | `refVar instanceof TargetClass` | Kiểm tra đối tượng thực tế trên Heap lúc chạy có tương thích với kiểu đích hay không. | Downcasting mà không kiểm tra bằng `instanceof` dẫn đến crash chương trình. |
| **Ép kiểu đối tượng (Casting)** | `((SubClass) superRef)` | Upcasting tự động; Downcasting phải tường minh và chỉ hợp lệ khi đối tượng thực tế là kiểu con. | Ép kiểu đối tượng cha thực tế xuống con gây `ClassCastException`. |

---

## Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Java Basics Part 2 (Inheritance, Overriding, Object)](../java/basis/java-basic-questions-02.md) · [Java Basics Part 3](../java/basis/java-basic-questions-03.md)
- **Slide & PDF gốc offline:** [Inheritance.pdf](/media/pro192/resources/Inheritance.pdf) · [ArrayOfObjects.pdf](/media/pro192/resources/ArrayOfObjects.pdf)
