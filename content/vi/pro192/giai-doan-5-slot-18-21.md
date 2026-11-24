---
title: "Giai đoạn 5 (Slot 18–21): Đa hình, Abstract Class, Interface & Anonymous Class"
category: PRO192
slots: "Slot 18 – 21"
lang: vi
description: "Liên kết động (Dynamic Binding), Overloading vs Overriding, Lớp trừu tượng (Abstract Class), Giao diện (Interface) và Lớp nặc danh (Anonymous Class)."
---

# GIÁO TRÌNH GIAI ĐOẠN 5: TÍNH ĐA HÌNH (POLYMORPHISM), LỚP TRỪU TƯỢNG (ABSTRACT CLASS) & GIAO DIỆN (INTERFACE) (SLOT 18 – 21)

Tài liệu giáo trình hệ thống hóa toàn bộ kiến thức chuyên sâu của Giai đoạn 5 về Tính đa hình, Lớp trừu tượng, Giao diện và Lớp nội danh trong lập trình hướng đối tượng với Java. Nội dung bài giảng bám sát từng slide trong bộ tài liệu `Polymorphism.pptx` kết hợp minh họa thực tế từ `ArrayOfObjects.pptx` và `Support Classes.pptx`, kèm theo trọn bộ 20 bài tập tự luyện có lời giải chi tiết và phân tích sâu cơ chế thực thi của máy ảo Java (JVM).

---

## MỤC LỤC TỔNG QUAN

1. **Slot 18: Bản chất Tính đa hình, Liên kết động (Dynamic Binding) & Nạp chồng vs Ghi đè**
   * Khái niệm và nguồn gốc ngữ nghĩa của Đa hình (Polymorphism).
   * Phân loại đa hình: Lúc biên dịch (Compile-time) và Lúc chạy (Runtime).
   * Cơ chế Liên kết động (Dynamic Binding / Late Binding) và Bảng phương thức (Method Table).
   * Bảng so sánh toàn diện giữa Nạp chồng (Overloading) và Ghi đè (Overriding).
   * Bộ 5 bài tập tự luyện Slot 18 kèm lời giải chi tiết.

2. **Slot 19: Lớp trừu tượng (Abstract Class) & Phương thức trừu tượng (Abstract Method)**
   * Khái niệm Trừu tượng hóa mức cao và vai trò của Lớp trừu tượng.
   * Cú pháp và quy tắc khai báo Phương thức trừu tượng (Abstract Method).
   * Quy tắc cấm khởi tạo trực tiếp qua toán tử `new`.
   * Trách nhiệm ghi đè và cài đặt của các Lớp con kế thừa (Concrete Subclass).
   * Bộ 5 bài tập tự luyện Slot 19 kèm lời giải chi tiết.

3. **Slot 20: Giao diện (Interface) & Kỹ thuật Đa kế thừa hành vi**
   * Bản chất của Giao diện như một Bản hợp đồng cam kết hành vi (Contract of behavior).
   * Các quy ước ngầm định về Hằng số (`public static final`) và Phương thức (`public abstract`).
   * Cài đặt Giao diện bằng từ khóa `implements` và quy tắc giữ nguyên quyền `public`.
   * Kỹ thuật Đa kế thừa giao diện (Multiple Inheritance of Type) và quan hệ `extends` giữa các Interface.
   * Bảng so sánh đối chiếu giữa Lớp trừu tượng (Abstract Class) và Giao diện (Interface).
   * Bộ 5 bài tập tự luyện Slot 20 kèm lời giải chi tiết.

4. **Slot 21: Lớp nội danh (Anonymous Class) & Ứng dụng thực tế**
   * Bản chất và định nghĩa của Lớp nội danh (Anonymous Class).
   * Cú pháp khởi tạo thực thể tại chỗ từ Interface và Abstract Class (Adapter Class).
   * Dấu chấm phẩy `;` kết thúc biểu thức khởi tạo.
   * Quy tắc đặt tên tập tin Bytecode `.class` của trình biên dịch JVM (`Container$Number.class`).
   * Phạm vi biến cục bộ và quy tắc "Effectively Final".
   * Bộ 5 bài tập tự luyện Slot 21 kèm lời giải chi tiết.

---

## SLOT 18: BẢN CHẤT TÍNH ĐA HÌNH, LIÊN KẾT ĐỘNG (DYNAMIC BINDING) & NẠP CHỒNG VS GHI ĐÈ
* **Tài liệu học tập tương ứng:** Bộ slide `Polymorphism.pptx` (từ slide *Objectives*, *Introduction: Polymorphism* đến các slide *Overloading*, *Overriding* và *Dynamic Binding*).

### 1. Định nghĩa và Nguồn gốc ngữ nghĩa của Đa hình
* **Nguồn gốc thuật ngữ:** Thuật ngữ "Polymorphism" có gốc từ tiếng Hy Lạp, kết hợp giữa hai từ tố:
  * *Poly*: Nghĩa là "nhiều" (many).
  * *Morph*: Nghĩa là "hình thái" hoặc "dạng thức" (forms).
* **Định nghĩa trong OOP:** Tính đa hình là khả năng một đối tượng hoặc một lời gọi phương thức có thể biểu hiện dưới **nhiều hình thái thực thi khác nhau**.
* **Ý nghĩa kiến trúc:** Trong Java, tính đa hình cho phép lập trình viên gửi cùng một thông điệp (lời gọi hàm) tới các đối tượng thuộc các lớp con khác nhau trong cùng một cây phân cấp kế thừa. Mỗi đối tượng cụ thể sẽ tự động phản ứng và thực thi hành vi phù hợp với bản chất riêng của nó mà không cần người gọi phải viết mã rẽ nhánh phức tạp.

### 2. Hai cơ chế thực hiện tính đa hình trong Java
Java hiện thực hóa tính đa hình thông qua hai cơ chế tại hai thời điểm khác nhau:
1. **Nạp chồng phương thức (Method Overloading) — Đa hình lúc biên dịch (Compile-time Polymorphism / Static Binding):**
   * Xảy ra khi trong cùng một lớp có nhiều phương thức trùng tên nhưng khác nhau về danh sách tham số (số lượng, kiểu dữ liệu hoặc thứ tự kiểu tham số).
   * Trình biên dịch Java (`javac`) quyết định phương thức nào được gọi ngay tại thời điểm dịch mã nguồn dựa trên các đối số truyền vào.
2. **Ghi đè phương thức (Method Overriding) — Đa hình lúc chạy (Runtime Polymorphism / Dynamic Binding):**
   * Xảy ra khi lớp con định nghĩa lại một phương thức thể hiện (instance method) đã có ở lớp cha với chữ ký phương thức (signature) giống hệt nhau.
   * Quyết định gọi phương thức của lớp nào hoàn toàn được hoãn lại cho tới thời điểm chương trình đang chạy thực tế trên máy ảo JVM.

### 3. Cơ chế Liên kết động (Dynamic Binding / Late Binding)

![Cơ chế đa hình và Dynamic Binding trong Java](/media/pro192/images/polymorphism1.png)

![Minh họa ví dụ đa hình lúc chạy Runtime](/media/pro192/images/polymorphism2.png)

* **Vận hành tại thời điểm chạy:**
  Khi một biến tham chiếu kiểu lớp cha trỏ tới một đối tượng thuộc lớp con trên Dynamic Heap:
  ```java
  SuperClass obj = new SubClass();
  obj.doSomething();
  ```
  * *Tại Compile-time:* Trình biên dịch kiểm tra kiểu tĩnh của biến `obj` (là `SuperClass`) xem lớp cha có khai báo phương thức `doSomething()` hay không. Nếu có, mã nguồn vượt qua vòng kiểm tra cú pháp.
  * *Tại Runtime:* Máy ảo JVM kiểm tra ô nhớ thực tế của đối tượng trên Heap (là `SubClass`). JVM tra cứu Bảng phương thức (Method Table) của lớp `SubClass`. Nếu lớp con đã ghi đè `doSomething()`, JVM thực hiện liên kết động và kích hoạt phiên bản của `SubClass`.
* **Lợi ích mở rộng (Extensibility):** Hệ thống có thể bổ sung vô số lớp con mới kế thừa từ lớp cha mà các đoạn mã điều phối cấp cao không cần phải thay đổi hay biên dịch lại.

### 4. Bảng so sánh đối chiếu giữa Overloading và Overriding
Bảng tổng hợp các tiêu chí kỹ thuật phân biệt giữa Nạp chồng và Ghi đè:

| Tiêu chí so sánh | Nạp chồng phương thức (Overloading) | Ghi đè phương thức (Overriding) |
| :--- | :--- | :--- |
| **Phạm vi áp dụng** | Xảy ra trong cùng một lớp (hoặc giữa cha và con) | Bắt buộc phải có quan hệ kế thừa giữa Lớp cha và Lớp con |
| **Tên phương thức** | Bắt buộc phải **giống nhau** | Bắt buộc phải **giống nhau** |
| **Danh sách tham số** | Bắt buộc phải **khác nhau** (số lượng, kiểu hoặc thứ tự) | Bắt buộc phải **giống hệt nhau tuyệt đối** |
| **Kiểu trả về (Return Type)** | Tùy ý (có thể giống hoặc khác nhau) | Bắt buộc phải giống nhau hoặc là kiểu dẫn xuất con (Covariant) |
| **Quyền truy cập (Access Modifier)** | Tùy ý thay đổi | Không được phép thu hẹp quyền truy cập so với cha |
| **Thời điểm phân giải** | Thời điểm biên dịch (Compile-time / Static binding) | Thời điểm thực thi (Runtime / Dynamic binding) |

---

### BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 18 (KÈM LỜI GIẢI CHI TIẾT)

#### Bài 18.1: Nhận diện cơ chế đa hình qua lời gọi phương thức
* **Đề bài:** 
  Cho cấu trúc mã nguồn sau:
  ```java
  class Shape {
      public void draw() {
          System.out.println("Drawing a shape");
      }
  }

  class Circle extends Shape {
      @Override
      public void draw() {
          System.out.println("Drawing a circle");
      }
  }

  class Square extends Shape {
      @Override
      public void draw() {
          System.out.println("Drawing a square");
      }
  }

  public class TestPolymorphism {
      public static void render(Shape s) {
          s.draw();
      }
      public static void main(String[] args) {
          render(new Circle());
          render(new Square());
      }
  }
  ```
  Phương thức `render(Shape s)` thể hiện đặc tính nào của lập trình hướng đối tượng? Khi chạy chương trình, màn hình in ra kết quả gì và cơ chế nào của JVM quyết định điều đó?
* **Đáp án & Lời giải chi tiết:**
  * **Đặc tính thể hiện:** Tính **Đa hình (Polymorphism)** thông qua cơ chế ghi đè phương thức.
  * **Kết quả in ra màn hình:**
    ```text
    Drawing a circle
    Drawing a square
    ```
  * **Giải thích cơ chế:** Tham số truyền vào của phương thức `render` có kiểu tĩnh là `Shape`. Tuy nhiên, khi chạy thực tế (Runtime), JVM kiểm tra kiểu đối tượng thực sự trên Heap. Khi đối số là `new Circle()`, JVM dùng liên kết động để gọi phương thức `draw()` của `Circle`. Khi đối số là `new Square()`, JVM gọi phương thức `draw()` của `Square`.

#### Bài 18.2: Phân biệt Overloading và Overriding trong thiết kế lớp
* **Đề bài:** 
  Trong các cặp phương thức sau, cặp nào là Method Overloading, cặp nào là Method Overriding và cặp nào bị Lỗi biên dịch?
  1. Trong cùng một lớp: `void compute(int a)` và `int compute(int a, int b)`.
  2. Lớp con so với lớp cha: `public void display()` (ở cha) và `public void display()` (ở con).
  3. Trong cùng một lớp: `void process(int x)` và `int process(int x)`.
* **Đáp án & Lời giải chi tiết:**
  1. Cặp 1: **Method Overloading** (cùng tên, danh sách tham số khác nhau: 1 tham số so với 2 tham số).
  2. Cặp 2: **Method Overriding** (xảy ra trong mối quan hệ kế thừa, chữ ký phương thức giống hệt nhau).
  3. Cặp 3: **BỊ LỖI BIÊN DỊCH** (`method process(int) is already defined`). Vì hai phương thức có cùng tên và cùng danh sách tham số (trùng chữ ký). Việc chỉ khác nhau về kiểu trả về (`void` vs `int`) không tạo nên nạp chồng hợp lệ trong Java.

#### Bài 18.3: Quy tắc nới rộng quyền truy cập khi ghi đè
* **Đề bài:** 
  Lớp cha `Animal` có phương thức:
  ```java
  protected void makeSound() {
      System.out.println("Animal sound");
  }
  ```
  Lớp con `Cat extends Animal` có thể ghi đè phương thức này với từ khóa `public` được không? Có thể ghi đè với từ khóa `private` được không? Giải thích lý do.
* **Đáp án & Lời giải chi tiết:**
  * Ghi đè với **`public`**: **ĐƯỢC PHÉP**. Theo quy tắc ghi đè trong Java, lớp con có quyền giữ nguyên hoặc nới rộng quyền truy cập (`public` có phạm vi rộng hơn `protected`).
  * Ghi đè với **`private`**: **BỊ LỖI BIÊN DỊCH** (`cannot reduce the visibility of the inherited method from Animal`). Lớp con không được phép thu hẹp quyền truy cập so với lớp cha vì sẽ phá vỡ tính đa hình khi một biến tham chiếu kiểu cha cố gắng gọi phương thức đó.

#### Bài 18.4: Kiểm tra tính hợp lệ của Covariant Return Type
* **Đề bài:** 
  Cho lớp `SubClass` kế thừa từ `SuperClass`. Xét đoạn mã sau:
  ```java
  class SuperClass {
      public SuperClass getInstance() {
          return new SuperClass();
      }
  }

  class SubClass extends SuperClass {
      @Override
      public SubClass getInstance() {
          return new SubClass();
      }
  }
  ```
  Phương thức `getInstance()` trong `SubClass` có ghi đè hợp lệ phương thức của `SuperClass` không khi kiểu trả về đã đổi từ `SuperClass` thành `SubClass`?
* **Đáp án & Lời giải chi tiết:**
  * Phương thức ghi đè **HOÀN TOÀN HỢP LỆ**.
  * **Giải thích:** Từ phiên bản Java 5.0 trở đi, Java hỗ trợ cơ chế **Covariant Return Type** (Kiểu trả về đồng biến). Khi ghi đè một phương thức, kiểu trả về của phương thức ở lớp con có thể là chính lớp con của kiểu trả về ở phương thức lớp cha (`SubClass` là con của `SuperClass`). Điều này giúp tránh việc phải ép kiểu thủ công sau khi gọi phương thức ở lớp con.

#### Bài 18.5: Tính đa hình kết hợp với mảng đối tượng
* **Đề bài:** 
  Cho mảng đối tượng:
  ```java
  Shape[] shapes = new Shape[2];
  shapes[0] = new Circle();
  shapes[1] = new Square();
  ```
  Hãy viết một vòng lặp for-each duyệt qua mảng `shapes` và gọi phương thức `draw()` của từng phần tử. Giải thích tại sao cấu trúc này giúp thiết kế phần mềm đạt độ linh hoạt cao.
* **Đáp án & Lời giải chi tiết:**
  ```java
  for (Shape s : shapes) {
      s.draw();
  }
  ```
  * **Giải thích sức mạnh kiến trúc:**
    Đoạn mã trên thể hiện nguyên lý lập trình tổng quát: mã nguồn điều phối chỉ phụ thuộc vào kiểu trừu tượng `Shape`. Nếu sau này hệ thống mở rộng thêm 10 lớp hình học mới (`Triangle`, `Rectangle`, `Polygon`...), toàn bộ vòng lặp xử lý trên vẫn hoạt động chính xác 100% mà không cần sửa đổi hay bổ sung bất kỳ câu lệnh điều kiện `if-else` nào.

---

## SLOT 19: LỚP TRỪU TƯỢNG (ABSTRACT CLASS) & PHƯƠNG THỨC TRỪU TƯỢNG (ABSTRACT METHOD)
* **Tài liệu học tập tương ứng:** Bộ slide `Polymorphism.pptx` (từ slide *Abstract Classes*, *Syntax to define an abstract class*, *Implementing Abstract Methods* đến các slide demo `shapes` và `AbstractDemo2`).

### 1. Bản chất của Lớp trừu tượng (Abstract Class)
* **Khái niệm:** Lớp trừu tượng là kết quả của quá trình khái quát hóa ở cấp độ rất cao (result of high generalization). Trong miền bài toán, có những thực thể mang tính chất nền tảng trừu tượng chung (như "Hình học", "Động vật", "Tài khoản ngân hàng") mà bản thân chúng không thể tương ứng với một đối tượng cụ thể đơn lẻ nào.
* **Mục đích thiết kế:** Lớp trừu tượng định hình một khung sườn cấu trúc chung, xác định các hành vi bắt buộc mà các lớp con phải thực hiện nhưng chưa thể cung cấp chi tiết cài đặt tường minh ở tầng cha.
* **Cú pháp khai báo:**
  ```java
  public abstract class ClassName {
      // các thuộc tính dữ liệu
      // các hàm khởi tạo (constructors)
      // các phương thức cụ thể (concrete methods)
      // các phương thức trừu tượng (abstract methods)
  }
  ```

### 2. Phương thức trừu tượng (Abstract Method)
* **Định nghĩa:** Phương thức trừu tượng là phương thức chỉ có phần khai báo chữ ký (prototype) mà hoàn toàn không có thân hàm (no implementation body).
* **Cú pháp:** Sử dụng từ khóa `abstract` và kết thúc trực tiếp bằng dấu chấm phẩy `;` thay cho cặp ngoặc nhọn `{}`:
  ```java
  public abstract double area();
  public abstract double circumstance();
  ```
* **Mối quan hệ bắt buộc giữa Lớp và Phương thức trừu tượng:**
  * Nếu một lớp chứa **ít nhất một phương thức trừu tượng**, thì lớp đó **bắt buộc phải được khai báo với từ khóa `abstract`**.
  * Ngược lại, một lớp trừu tượng **không bắt buộc phải chứa phương thức trừu tượng**. Nó hoàn toàn có thể chỉ chứa các phương thức đã được cài đặt đầy đủ.

### 3. Quy tắc cấm khởi tạo trực tiếp qua toán tử `new`
* **Quy tắc cấm tuyệt đối:** Máy ảo Java ngăn chặn hoàn toàn việc tạo đối tượng trực tiếp từ một lớp trừu tượng:
  ```java
  Shape s = new Shape(); // BÁO LỖI BIÊN DỊCH: Shape is abstract; cannot be instantiated
  ```
* **Khả năng tham chiếu đa hình:** Mặc dù không thể `new` trực tiếp, biến tham chiếu có kiểu là lớp trừu tượng vẫn được phép trỏ tới các đối tượng của lớp con cụ thể:
  ```java
  Shape s = new Circle(5.0); // Hoàn toàn hợp lệ
  System.out.println(s.area()); // Kích hoạt đa hình lúc chạy
  ```

### 4. Trách nhiệm cài đặt của Lớp con kế thừa (Concrete Class)
Khi một lớp con kế thừa từ một lớp trừu tượng (`class SubClass extends AbstractSuperClass`), lớp con đứng trước hai lựa chọn:
1. **Lớp con cụ thể (Concrete class):** Bắt buộc phải **ghi đè và cài đặt phần thân mã (provide body) cho toàn bộ các phương thức trừu tượng** kế thừa từ lớp cha.
2. **Tiếp tục là Lớp trừu tượng:** Nếu lớp con không cài đặt hết các phương thức trừu tượng kế thừa, bản thân lớp con đó cũng **bắt buộc phải được khai báo với từ khóa `abstract`**, chuyển giao trách nhiệm cài đặt cho các lớp con thế hệ tiếp theo.

---

### BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 19 (KÈM LỜI GIẢI CHI TIẾT)

#### Bài 19.1: Cú pháp và bản chất của Abstract Method
* **Đề bài:** 
  Xét hai khai báo phương thức sau bên trong một lớp:
  ```java
  public abstract void run() {}
  public abstract void jump();
  ```
  Khai báo nào hợp lệ và khai báo nào bị lỗi biên dịch trong Java? Giải thích lý do.
* **Đáp án & Lời giải chi tiết:**
  * `public abstract void run() {}`: **BỊ LỖI BIÊN DỊCH** (`abstract methods cannot have a body`). Phương thức trừu tượng không được phép chứa cặp ngoặc nhọn `{}` (kể cả ngoặc nhọn rỗng) mà phải kết thúc trực tiếp bằng dấu chấm phẩy.
  * `public abstract void jump();`: **HỢP LỆ**. Đây là cú pháp chuẩn xác của phương thức trừu tượng trong Java.

#### Bài 19.2: Hàm khởi tạo bên trong Abstract Class
* **Đề bài:** 
  Cho lớp trừu tượng `Employee`:
  ```java
  public abstract class Employee {
      protected String name;
      public Employee(String name) { this.name = name; }
  }
  ```
  Câu lệnh `Employee emp = new Employee("Nam");` có biên dịch được không? Tại sao một lớp trừu tượng không thể tạo đối tượng trực tiếp nhưng vẫn được phép có Constructor?
* **Đáp án & Lời giải chi tiết:**
  * Câu lệnh `new Employee("Nam")`: **BỊ LỖI BIÊN DỊCH** (`Employee is abstract; cannot be instantiated`).
  * **Ý nghĩa của Constructor trong Abstract Class:** Hàm khởi tạo trong lớp trừu tượng phục vụ cho cơ chế chuỗi khởi tạo (Constructor Chaining). Khi một đối tượng của lớp con cụ thể (như `Manager`, `Developer`) được khởi tạo, nó sẽ gọi `super(name)` để tái sử dụng logic khởi tạo thuộc tính `name` nằm trong lớp cha trừu tượng.

#### Bài 19.3: Lớp trừu tượng không chứa phương thức trừu tượng
* **Đề bài:** 
  Quan sát đoạn mã sau từ slide bài giảng:
  ```java
  public abstract class AbstractDemo2 {
      void m1() { System.out.println("m1"); }
      void m2() { }
      public static void main(String[] args) {
          AbstractDemo2 obj = new AbstractDemo2();
      }
  }
  ```
  Lớp `AbstractDemo2` không có bất kỳ abstract method nào. Lệnh `new AbstractDemo2()` có biên dịch được không? Tại sao lập trình viên lại khai báo một lớp trừu tượng không có phương thức trừu tượng?
* **Đáp án & Lời giải chi tiết:**
  * Lệnh `new AbstractDemo2()`: **BỊ LỖI BIÊN DỊCH**. Dù không có abstract method nào, một khi lớp đã được gắn từ khóa `abstract`, máy ảo Java cấm việc tạo đối tượng trực tiếp từ lớp đó.
  * **Ý nghĩa thiết kế:** Kỹ thuật này thường được dùng để tạo ra các lớp khung (Base Class / Adapter Class) chỉ nhằm mục đích cho các lớp khác kế thừa và mở rộng, ngăn chặn người sử dụng khởi tạo một thực thể độc lập chưa hoàn chỉnh về mặt nghiệp vụ.

#### Bài 19.4: Trách nhiệm ghi đè phương thức trừu tượng của lớp con
* **Đề bài:** 
  Lớp cha `Shape` khai báo:
  ```java
  public abstract class Shape {
      public abstract double area();
      public abstract double circumstance();
  }
  ```
  Lớp con `Rect extends Shape` có hai thuộc tính chiều dài và chiều rộng. Nếu bên trong `Rect` bạn chỉ viết phương thức `public double area()` mà quên viết phương thức `circumstance()` thì trình biên dịch sẽ thông báo lỗi gì? Cách khắc phục là gì?
* **Đáp án & Lời giải chi tiết:**
  * **Thông báo lỗi biên dịch:** `Rect is not abstract and does not override abstract method circumstance() in Shape`.
  * **Nguyên nhân:** Lớp con cụ thể bắt buộc phải cài đặt đầy đủ tất cả các phương thức trừu tượng kế thừa từ lớp cha.
  * **Cách khắc phục:**
    1. Cài đặt thêm phương thức `public double circumstance()` trong lớp `Rect`.
    2. Hoặc nếu chưa muốn cài đặt, phải khai báo lớp `Rect` là trừu tượng: `public abstract class Rect extends Shape`.

#### Bài 19.5: Đa hình với mảng đối tượng lớp trừu tượng
* **Đề bài:** 
  Cho lớp trừu tượng `Shape` có phương thức trừu tượng `area()`. Các lớp con `Circle` và `Rect` đã cài đặt hoàn chỉnh `area()`. Hãy viết phương thức `public static double totalArea(Shape[] list)` nhận vào một mảng các hình vẽ và tính tổng diện tích của toàn bộ các phần tử hợp lệ trong mảng.
* **Đáp án & Lời giải chi tiết:**
  ```java
  public static double totalArea(Shape[] list) {
      double total = 0;
      for (Shape s : list) {
          if (s != null) {
              total += s.area(); // Lời gọi phương thức đa hình (Dynamic binding)
          }
      }
      return total;
  }
  ```
  * **Giải thích:** Phương thức `totalArea` tương tác trực tiếp với kiểu trừu tượng `Shape`. Tại thời điểm chạy, cơ chế liên kết động của JVM sẽ tự động tìm tới phương thức `area()` tương ứng của từng đối tượng thực tế (`Circle` hoặc `Rect`) để tính toán chính xác diện tích.

---

## SLOT 20: GIAO DIỆN (INTERFACE) & KỸ THUẬT ĐA KẾ THỪA HÀNH VI
* **Tài liệu học tập tương ứng:** Bộ slide `Polymorphism.pptx` (từ slide *Interfaces*, *Syntax to define an interface*, *Rules for implementing interfaces* đến slide *Multiple inheritance with interfaces*).

### 1. Bản chất của Giao diện (Interface)

![Cấu trúc và quan hệ Interface trong Java](/media/pro192/images/interface1.png)

![So sánh trừu tượng và đa hình qua Interface](/media/pro192/images/polymorphism3.png)

* **Định nghĩa:** `Interface` là một thực thể trừu tượng thuần túy trong Java, đóng vai trò như một **bản hợp đồng cam kết hành vi (contract of behavior)**. Giao diện chỉ đặc tả những việc mà một lớp phải làm (`what to do`) nhưng hoàn toàn không định nghĩa cách thức thực hiện công việc đó (`how to do`).
* **Cú pháp định nghĩa:**
  ```java
  public interface InterfaceName {
      // khai báo các hằng số
      // khai báo các phương thức trừu tượng
  }
  ```
* **Các quy ước ngầm định của Interface do trình biên dịch tự động áp dụng:**
  1. **Đối với trường dữ liệu (Fields):** Mọi biến được khai báo bên trong một Interface đều **tự động mang thuộc tính `public static final`** (là hằng số dùng chung của giao diện, không thể thay đổi giá trị).
  2. **Đối với phương thức (Methods):** Mọi phương thức khai báo thông thường đều **tự động mang thuộc tính `public abstract`** (là phương thức công khai và trừu tượng, không có phần thân hàm).

### 2. Cài đặt Giao diện bằng từ khóa `implements`
* **Cú pháp cài đặt:**
  ```java
  public class ClassName implements InterfaceName {
      // cài đặt tất cả các phương thức của Interface
  }
  ```
* **Quy tắc bắt buộc về quyền truy cập khi ghi đè:**
  * Do các phương thức trong Interface mặc định là `public`, nên khi lớp con ghi đè để viết phần thân hàm `{ ... }`, phương thức đó **bắt buộc phải được khai báo tường minh với từ khóa `public`**.
  * Nếu lập trình viên quên viết từ khóa `public` (để mặc định là `default`), trình biên dịch sẽ lập tức báo lỗi vì vi phạm quy tắc thu hẹp quyền truy cập trong kế thừa.

### 3. Kỹ thuật Đa kế thừa hành vi (Multiple Inheritance of Type)
* **Giải pháp cho bài toán Đa kế thừa trong Java:**
  * Java cấm đa kế thừa lớp trực tiếp (`extends ClassA, ClassB` là bất hợp pháp) để loại bỏ xung đột cấu trúc (Diamond Problem).
  * Tuy nhiên, Java cho phép một lớp có thể **cài đặt đồng thời nhiều Giao diện** thông qua danh sách phân tách bằng dấu phẩy:
    ```java
    public class ClassName extends SuperClass implements Interface1, Interface2, Interface3 {
        // ...
    }
    ```
* **Kế thừa giữa các Interface:**
  * Một Interface có thể kế thừa từ một hoặc nhiều Interface khác bằng từ khóa `extends`:
    ```java
    public interface InterfaceC extends InterfaceA, InterfaceB {
        // ...
    }
    ```

### 4. Bảng so sánh đối chiếu giữa Abstract Class và Interface
Bảng tổng kết các đặc tính kiến trúc phân biệt Lớp trừu tượng và Giao diện:

| Tiêu chí so sánh | Lớp trừu tượng (Abstract Class) | Giao diện (Interface) |
| :--- | :--- | :--- |
| **Bản chất mối quan hệ** | Quan hệ nguồn gốc phân cấp **"is-a"** | Bản hợp đồng cam kết năng lực **"can-do"** |
| **Cú pháp sử dụng** | Dùng từ khóa `extends` (chỉ đơn kế thừa lớp) | Dùng từ khóa `implements` (cài đặt được nhiều interface) |
| **Biến thuộc tính** | Chứa được mọi loại biến (`private`, `protected`, biến thể hiện) | Chỉ chứa **hằng số `public static final`** |
| **Hàm khởi tạo (Constructor)** | **Có Constructor** (phục vụ gọi `super(...)`) | **Tuyệt đối KHÔNG có Constructor** |
| **Khởi tạo đối tượng** | Không thể khởi tạo trực tiếp bằng `new` | Không thể khởi tạo trực tiếp bằng `new` |
| **Tốc độ thực thi** | Nhanh hơn một chút do liên kết lớp trực tiếp | Có chi phí tìm kiếm bảng giao diện lúc chạy |

---

### BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 20 (KÈM LỜI GIẢI CHI TIẾT)

#### Bài 20.1: Các đặc tính mặc định của thành phần trong Interface
* **Đề bài:** 
  Xét đoạn mã khai báo interface sau:
  ```java
  public interface Movable {
      int SPEED = 50;
      void move();
  }
  ```
  Trình biên dịch Java tự động bổ sung những từ khóa ngầm định nào vào trước biến `SPEED` và phương thức `move()`?
* **Đáp án & Lời giải chi tiết:**
  * Trước biến `SPEED`: Trình biên dịch tự động chèn thành **`public static final int SPEED = 50;`** (biến trở thành hằng số tĩnh).
  * Trước phương thức `move()`: Trình biên dịch tự động chèn thành **`public abstract void move();`** (phương thức trở thành công khai và trừu tượng).

#### Bài 20.2: Lỗi thiếu từ khóa `public` khi cài đặt Interface
* **Đề bài:** 
  Đoạn mã sau bị lỗi biên dịch ở dòng nào? Giải thích vì sao dựa trên quy tắc trong slide `Polymorphism.pptx`:
  ```java
  interface Printable {
      void print();
  }

  class Document implements Printable {
      void print() { // Dòng 6
          System.out.println("Printing...");
      }
  }
  ```
* **Đáp án & Lời giải chi tiết:**
  * **Dòng bị lỗi:** Dòng 6 (`void print()`).
  * **Thông báo lỗi biên dịch:** `cannot reduce the visibility of the inherited method from Printable`.
  * **Nguyên nhân:** Phương thức `print()` trong interface mang quyền truy cập ngầm định là `public`. Tại lớp `Document`, phương thức ghi đè không ghi từ khóa nào nên bị coi là mức truy cập mặc định `default`. Theo quy tắc kế thừa, lớp con không được phép thu hẹp quyền truy cập so với lớp cha.
  * **Cách sửa:** Bổ sung từ khóa `public` tại Dòng 6: `public void print() { ... }`.

#### Bài 20.3: Kết hợp `extends` lớp cha và `implements` nhiều Interface
* **Đề bài:** 
  Viết đoạn khai báo lớp `SmartPhone` sao cho:
  1. Kế thừa từ lớp cha `Device`.
  2. Cài đặt đồng thời hai interface: `Camera` và `Gps`.
* **Đáp án & Lời giải chi tiết:**
  ```java
  public class SmartPhone extends Device implements Camera, Gps {
      // Thân lớp: cài đặt các phương thức trừu tượng của Camera và Gps
  }
  ```
  * **Giải thích:** Cú pháp chuẩn của Java quy định từ khóa `extends` phải đứng trước từ khóa `implements`. Danh sách các interface cài đặt phân cách nhau bằng dấu phẩy.

#### Bài 20.4: Tính chất bất biến của biến trong Interface
* **Đề bài:** 
  Đoạn mã sau có biên dịch thành công không?
  ```java
  interface Config {
      int TIMEOUT = 30;
  }

  class AppConfig implements Config {
      public void reset() {
          TIMEOUT = 60;
      }
  }
  ```
* **Đáp án & Lời giải chi tiết:**
  * Đoạn mã trên **BỊ LỖI BIÊN DỊCH** tại dòng `TIMEOUT = 60;`.
  * **Thông báo lỗi:** `cannot assign a value to final variable TIMEOUT`.
  * **Giải thích:** Mọi thuộc tính khai báo trong interface đều tự động mang thuộc tính `final` (hằng số). Giá trị khởi tạo ban đầu là bất biến và không thể bị gán lại trong suốt quá trình chạy.

#### Bài 20.5: Lập trình hướng giao diện (Programming to an Interface)
* **Đề bài:** 
  Cho interface `PaymentMethod` có phương thức trừu tượng `void pay(double amount);`. Hai lớp `CreditCard` và `PayPal` cùng cài đặt interface này. Hãy viết phương thức `public static void processOrder(PaymentMethod payment, double amount)` và giải thích tại sao cách thiết kế này giúp hệ thống đạt được tính phụ thuộc lỏng lẻo (Loose Coupling).
* **Đáp án & Lời giải chi tiết:**
  ```java
  public static void processOrder(PaymentMethod payment, double amount) {
      payment.pay(amount); // Lời gọi đa hình thông qua Interface
  }
  ```
  * **Ý nghĩa kiến trúc:** Phương thức `processOrder` chỉ làm việc với bản hợp đồng chung là `PaymentMethod`. Khi doanh nghiệp tích hợp thêm các phương thức thanh toán mới trong tương lai (như `ApplePay`, `Momo`, `Crypto`...), phương thức này hoàn toàn giữ nguyên 100% mà không phải sửa đổi bất kỳ dòng mã nào.

---

## SLOT 21: LỚP NỘI DANH (ANONYMOUS CLASS) & KHÉP LẠI GIAI ĐOẠN 5
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

---

### BỘ 5 BÀI TẬP TỰ LUYỆN SLOT 21 (KÈM LỜI GIẢI CHI TIẾT)

#### Bài 21.1: Bản chất của biểu thức `new InterfaceName() { ... }`
* **Đề bài:** 
  Ở Slot 20 chúng ta đã học: *"Interface không thể khởi tạo trực tiếp bằng từ khóa new"*. Vậy tại sao đoạn mã sau lại hoàn toàn hợp lệ trong Java?
  ```java
  Runnable r = new Runnable() {
      @Override
      public void run() {
          System.out.println("Thread is running");
      }
  };
  ```
* **Đáp án & Lời giải chi tiết:**
  * **Bản chất kỹ thuật:** Đoạn mã trên **không hề khởi tạo đối tượng trực tiếp từ giao diện `Runnable`**.
  * Cặp ngoặc nhọn `{ ... }` ngay sau biểu thức `new Runnable()` định nghĩa phần thân của một **Lớp nội danh (Anonymous Class)** ngầm định cài đặt giao diện `Runnable`. Toán tử `new` thực chất đang khởi tạo một thể hiện của lớp nội danh này và gán địa chỉ tham chiếu cho biến `r` kiểu `Runnable` theo đúng cơ chế đa hình.

#### Bài 21.2: Dấu chấm phẩy kết thúc biểu thức Anonymous Class
* **Đề bài:** 
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
* **Đáp án & Lời giải chi tiết:**
  * **Lỗi biên dịch:** `';' expected` tại Dòng 11.
  * **Nguyên nhân:** Toàn bộ khối Anonymous Class nằm bên trong một **biểu thức gán giá trị cho biến** (`Greeting g = new Greeting() { ... };`). Vì đây là một câu lệnh thực thi (statement) chứ không phải là một khai báo lớp độc lập, nên bắt buộc phải có dấu chấm phẩy `;` ở cuối để kết thúc câu lệnh gán.

#### Bài 21.3: Quy tắc sinh tập tin Bytecode của Trình biên dịch JVM
* **Đề bài:** 
  Trong một tập tin có tên `OrderService.java`, lập trình viên khai báo 2 lớp nội danh (Anonymous Class) bên trong phương thức `process()`. Sau khi thực hiện lệnh biên dịch `javac OrderService.java`, những tập tin `.class` nào sẽ xuất hiện trong thư mục đầu ra?
* **Đáp án & Lời giải chi tiết:**
  * Các tập tin `.class` được sinh ra gồm:
    1. `OrderService.class` (tập tin bytecode của lớp bao bọc bên ngoài).
    2. `OrderService$1.class` (tập tin bytecode cho lớp nội danh thứ nhất).
    3. `OrderService$2.class` (tập tin bytecode cho lớp nội danh thứ hai).
  * Trình biên dịch luôn đánh số tăng dần theo định dạng `ContainerClass$Number.class` để định danh độc lập từng lớp vô danh.

#### Bài 21.4: Ứng dụng Anonymous Class để tạo Comparator sắp xếp đối tượng
* **Đề bài:** 
  Cho lớp `Student` có trường `int age;` và phương thức `getAge()`. Hãy sử dụng lớp nội danh để khởi tạo một đối tượng kiểu `java.util.Comparator<Student>` nhằm sắp xếp danh sách sinh viên theo thứ tự **tuổi giảm dần**.
* **Đáp án & Lời giải chi tiết:**
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

#### Bài 21.5: Phạm vi truy cập biến cục bộ và quy tắc "Effectively Final"
* **Đề bài:** 
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
* **Đáp án & Lời giải chi tiết:**
  * **Thông báo lỗi biên dịch tại Dòng 9:** `local variables referenced from an inner class must be final or effectively final`.
  * **Nguyên tắc kỹ thuật:** Một Anonymous Class chỉ được phép truy xuất các biến cục bộ xung quanh nếu biến đó là **hằng số (`final`)** hoặc **"effectively final" (biến chỉ được gán giá trị một lần duy nhất và không bao giờ bị thay đổi giá trị sau đó)**.
  * Ở Dòng 4, lệnh `factor = 5;` đã thay đổi giá trị của biến, khiến `factor` không còn là effectively final nữa. Do đó, Anonymous Class bị cấm truy xuất để đảm bảo tính an toàn dữ liệu và tính nhất quán bộ nhớ giữa các luồng thực thi.

---

## Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Java Basics Part 2 (Abstract Class vs Interface, Polymorphism)](../java/basis/java-basic-questions-02.md) · [Dynamic Proxy Pattern](../java/basis/proxy.md) · [Java 8 Interface default/static & Lambda](../java/new-features/java8-common-new-features.md)
- **Slide & PDF gốc offline:** [Polymorphism.pdf](/media/pro192/resources/Polymorphism.pdf)
