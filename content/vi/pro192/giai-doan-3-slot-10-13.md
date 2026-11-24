---
title: "Giai đoạn 3 (Slot 10–13): 4 Trụ cột OOP, Thiết kế Class & Encapsulation"
category: PRO192
slots: "Slot 10 – 13"
lang: vi
description: "Tư duy hướng đối tượng, Cohesion & Coupling, vòng đời đối tượng, Constructor, từ khóa this, Encapsulation, Access Modifiers và Package."
---

# GIÁO TRÌNH LẬP TRÌNH JAVA CĂN BẢN ĐẾN NÂNG CAO - GIAI ĐOẠN 3: LẬP TRÌNH HƯỚNG ĐỐI TƯỢNG (OOP) CĂN BẢN & ĐÓNG GÓI (SLOT 10 – SLOT 13)

Giai đoạn 3 là bước chuyển dịch tư duy nền tảng trong toàn bộ lộ trình lập trình Java: chuyển từ mô hình lập trình thủ tục tuần tự sang tư duy mô hình hóa hướng đối tượng (Object-Oriented Programming - OOP). Tài liệu giáo trình này tổng hợp toàn diện lý thuyết chuyên sâu, phân tích bản chất cơ chế cấp phát bộ nhớ, các nguyên lý kiến trúc phần mềm từ slide bài giảng nguồn, và trọn bộ 20 bài tập tự luyện kèm lời giải chi tiết cho từng slot.

---

## 1. Slot 10: 4 Trụ cột OOP & Tư duy mô hình hóa hướng đối tượng

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

---

### 1.6. Bộ 5 bài tập tự luyện Slot 10 (Kèm lời giải chi tiết)

#### Bài 10.1: Bốn trụ cột của lập trình hướng đối tượng
* **Đề bài:** Hãy liệt kê và giải thích ngắn gọn mục đích chính của 4 trụ cột trong lập trình hướng đối tượng theo tài liệu `Introduction.pptx`.
* **Đáp án & Lời giải chi tiết:**
  1. *Trừu tượng hóa (Abstraction):* Lọc bỏ các chi tiết không cần thiết, chỉ giữ lại các thuộc tính và hành vi trọng tâm của bài toán.
  2. *Đóng gói (Encapsulation):* Che giấu dữ liệu nội bộ và chi tiết cài đặt, cung cấp giao diện tương tác công khai an toàn.
  3. *Phân cấp (Hierarchy):* Thiết lập cấu trúc quan hệ giữa các thực thể thông qua thu nạp ("has-a") hoặc kế thừa phân loại ("is-a").
  4. *Đa hình (Polymorphism):* Cho phép các đối tượng khác nhau phản ứng linh hoạt với cùng một lời gọi phương thức dựa trên kiểu thực tế của đối tượng.

#### Bài 10.2: Phân biệt Class và Instance trong thực tế
* **Đề bài:** Trong phát biểu sau, thành phần nào đóng vai trò là Class và thành phần nào là Instance/Object?
  *"Bản vẽ kỹ thuật của một chiếc điện thoại thông minh và hai chiếc điện thoại iPhone 15 màu đen và màu titan tự nhiên trên bàn làm việc."*
* **Đáp án & Lời giải chi tiết:**
  * *Bản vẽ kỹ thuật:* Đóng vai trò là **Class** (khuôn mẫu định nghĩa kích thước màn hình, vi xử lý, camera và hành vi gọi điện, chụp ảnh).
  * *Hai chiếc iPhone 15 cụ thể:* Đóng vai trò là **Instance / Object** (các thực thể cụ thể được sản xuất từ bản vẽ; chúng chia sẻ chung các trường thuộc tính nhưng giá trị màu sắc cụ thể `đen` và `titan tự nhiên` là khác nhau trong từng đối tượng).

#### Bài 10.3: Nguyên lý Tính toàn vẹn của đối tượng (Object Integrity)
* **Đề bài:** Trình bày ý nghĩa nguyên lý: *"Each object has integrity: it can only behave in ways that are appropriate to itself"*. Hãy lấy ví dụ về một thiết kế vi phạm nguyên lý này.
* **Đáp án & Lời giải chi tiết:**
  * *Ý nghĩa:* Mỗi đối tượng chỉ được phép sở hữu và thực thi các hành vi phản ánh đúng bản chất nghiệp vụ của nó trong thế giới thực.
  * *Ví dụ vi phạm:* Thiết kế lớp `Account` (Tài khoản ngân hàng) chứa phương thức `cookFood()` (nấu ăn) hoặc phương thức `driveCar()` (lái xe). Đây là các hành vi hoàn toàn xa lạ với bản chất quản lý tài chính của một tài khoản ngân hàng.

#### Bài 10.4: Giá trị kiến trúc của một Well-encapsulated Class
* **Đề bài:** Khi lập trình viên thay đổi kiểu dữ liệu của một trường từ `int` sang `long` bên trong một lớp đã đóng gói hoàn hảo, các lớp bên ngoài có cần phải sửa đổi mã nguồn không? Vì sao?
* **Đáp án & Lời giải chi tiết:**
  * Các lớp bên ngoài **hoàn toàn không cần phải sửa đổi mã nguồn**.
  * Nhờ việc trường dữ liệu được khai báo `private` và giao tiếp thông qua các phương thức Getter/Setter công khai, lập trình viên có thể xử lý việc ép kiểu hoặc tính toán bên trong thân của Getter/Setter mà không làm thay đổi chữ ký giao diện bên ngoài.

#### Bài 10.5: Phân loại quan hệ "has-a" và "is-a"
* **Đề bài:** Xác định các mối quan hệ sau là "has-a" hay "is-a":
  1. Laptop và Bàn phím (Keyboard).
  2. Bác sĩ (Doctor) và Con người (Person).
  3. Máy bay (Airplane) và Động cơ phản lực (JetEngine).
  4. Hình tam giác (Triangle) và Hình học (Shape).
* **Đáp án & Lời giải chi tiết:**
  1. *Laptop và Keyboard:* **"has-a"** (Laptop sở hữu bàn phím làm thành phần).
  2. *Doctor và Person:* **"is-a"** (Bác sĩ là một con người, chuyên biệt hóa từ Person).
  3. *Airplane và JetEngine:* **"has-a"** (Máy bay sở hữu động cơ phản lực).
  4. *Triangle và Shape:* **"is-a"** (Tam giác là một dạng cụ thể của hình học).

---

## 2. Slot 11: Kỹ thuật thiết kế Class, Nguyên lý Cohesion & Coupling

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

---

### 2.5. Bộ 5 bài tập tự luyện Slot 11 (Kèm lời giải chi tiết)

#### Bài 11.1: Trích xuất thành phần lớp từ mô tả nghiệp vụ
* **Đề bài:** Phân tích câu sau để xác định Class, Fields và Methods: *"Một chiếc xe hơi (Car) có màu sơn (color), công suất động cơ (enginePower) và trạng thái mui trần (isConvertible). Chiếc xe có thể khởi động (startEngine) và đạp ga tăng tốc (accelerate)"*.
* **Đáp án & Lời giải chi tiết:**
  * *Class:* `Car`.
  * *Fields:* `color` (String), `enginePower` (int), `isConvertible` (boolean).
  * *Methods:* `startEngine()`, `accelerate()`.

#### Bài 11.2: Nhận diện và tối ưu hóa Low Cohesion
* **Đề bài:** Phương thức `manageEmployees()` thực hiện đồng thời: (1) Nhập danh sách nhân viên từ file CSV, (2) Tính toán tiền lương và thuế thu nhập cá nhân, (3) In phiếu lương ra máy in. Phương thức này có vấn đề gì và khắc phục như thế nào?
* **Đáp án & Lời giải chi tiết:**
  * *Vấn đề:* Low Cohesion (gắn kết thấp), vi phạm nguyên lý đơn nhiệm khi gộp đọc dữ liệu, xử lý tính toán tài chính và xuất thiết bị ngoại vi vào một nơi.
  * *Khắc phục:* Tách thành 3 phương thức chuyên biệt:
    1. `readFromCSV(String path)`
    2. `calculateSalaryAndTax(Employee emp)`
    3. `printPayslip(SalarySlip slip)`

#### Bài 11.3: So sánh kiến trúc High Coupling và Low Coupling
* **Đề bài:** Tại sao slide bài giảng khẳng định việc xây dựng lớp `Head` chứa hai tham chiếu `leftEye` và `rightEye` thuộc lớp `Eye` lại có chất lượng thiết kế vượt trội hơn việc khai báo các thuộc tính của mắt trực tiếp trong `Head`?
* **Đáp án & Lời giải chi tiết:**
  * Tách lớp `Eye` giúp đạt Low Coupling. Khi lớp `Eye` cần bổ sung thêm các tính năng mới (như chớp mắt, đổi màu mắt), lớp `Head` hoàn toàn không bị ảnh hưởng. Nếu nhúng thẳng vào `Head`, mọi sửa đổi nhỏ của mắt đều buộc lập trình viên phải mở mã nguồn của `Head` ra chỉnh sửa và biên dịch lại.

#### Bài 11.4: Quy tắc Chữ ký phương thức và Lỗi biên dịch
* **Đề bài:** Đoạn mã sau có biên dịch thành công không? Vì sao?
  ```java
  public class Calculator {
      public int compute(int a, double b) { return a; }
      public double compute(int x, double y) { return x + y; }
  }
  ```
* **Đáp án & Lời giải chi tiết:**
  * Đoạn mã **bị lỗi biên dịch**: `method compute(int, double) is already defined in class Calculator`.
  * *Giải thích:* Cả hai phương thức đều có tên là `compute` và cùng danh sách kiểu tham số là `(int, double)`. Tên biến (`a, b` vs `x, y`) và kiểu dữ liệu trả về (`int` vs `double`) không thuộc chữ ký phương thức, khiến trình biên dịch coi đây là hai khai báo trùng lặp hoàn toàn.

#### Bài 11.5: Thứ tự kiểu tham số trong Chữ ký phương thức
* **Đề bài:** Hai phương thức sau có thể cùng tồn tại trong một lớp không?
  ```java
  public void log(String tag, int code) { }
  public void log(int code, String tag) { }
  ```
* **Đáp án & Lời giải chi tiết:**
  * Hai phương thức **hoàn toàn có thể cùng tồn tại**.
  * *Giải thích:* Phương thức thứ nhất có chữ ký là `log(String, int)`, phương thức thứ hai có chữ ký là `log(int, String)`. Do **thứ tự kiểu dữ liệu tham số khác nhau**, chữ ký của chúng là riêng biệt (đây là kỹ thuật Method Overloading hợp lệ).

---

## 3. Slot 12: Vòng đời đối tượng, Hàm khởi tạo & Bộ nhớ tham chiếu

### 3.1. Ba giai đoạn tạo đối tượng
Xét câu lệnh: `Student stu = new Student("SE01", "Hoang", 2001, "HN");`.
Câu lệnh này thực hiện 3 bước liên tiếp:
1. **Khai báo (Declaration):** `Student stu;` — Tạo một biến tham chiếu mang tên `stu` thuộc kiểu `Student` trên vùng nhớ **Stack**.
2. **Cấp phát ô nhớ (Instantiation):** Toán tử **`new`** yêu cầu JVM cấp phát một khối bộ nhớ trống trên **Dynamic Heap** để lưu trữ các thuộc tính của đối tượng.
3. **Khởi tạo dữ liệu (Initialization):** Lời gọi hàm khởi tạo `Student(...)` thực thi việc gán giá trị cụ thể vào các trường trên Heap. Cuối cùng, địa chỉ ô nhớ trên Heap được gán vào biến tham chiếu `stu` trên Stack.

### 3.2. Bản chất của Hàm khởi tạo (Constructor)
* Constructor là một phương thức đặc biệt tự động chạy khi đối tượng được tạo ra.
* **Hai quy tắc nhận diện:**
  1. Tên Constructor phải trùng khớp hoàn toàn với tên của Lớp.
  2. Constructor không có bất kỳ kiểu dữ liệu trả về nào (kể cả `void`).
* **Phân loại:** Constructor mặc định không tham số (No-argument constructor) và Constructor có tham số (Parametric constructor).

### 3.3. Quy tắc nạp Constructor mặc định của hệ thống
* **Trường hợp 1:** Nếu lớp **không khai báo bất kỳ constructor nào**, trình biên dịch Java sẽ tự động bổ sung một constructor mặc định không tham số (`public ClassName() {}`), khởi tạo số về `0`, boolean về `false`, và đối tượng về `null`.
* **Trường hợp 2:** Nếu lập trình viên **đã tự viết ít nhất một constructor** (dù là có tham số hay không), trình biên dịch **sẽ không tự động chèn constructor mặc định nữa**. Nếu lúc này bên ngoài gọi `new ClassName()` mà không có constructor tương ứng, chương trình sẽ báo lỗi biên dịch ngay lập tức.

### 3.4. Từ khóa `this` và Vùng nhớ tham chiếu
* Từ khóa `this` là một biến tham chiếu ẩn trỏ thẳng đến **chính đối tượng hiện hành** đang thực thi phương thức hoặc constructor đó trên Heap.
* **Giải quyết hiện tượng che khuất biến (Shadowing):** Khi tham số truyền vào trùng tên với trường thuộc tính của lớp, dùng `this.fieldName` để phân biệt:
  ```java
  public Point(int x, int y) {
      this.x = x; // this.x là thuộc tính của đối tượng, x là tham số đầu vào
      this.y = y;
  }
  ```

---

### 3.5. Bộ 5 bài tập tự luyện Slot 12 (Kèm lời giải chi tiết)

#### Bài 12.1: Phân tích các bước tạo đối tượng
* **Đề bài:** Trong câu lệnh `Box b = new Box(10, 20, 30);`, hãy chỉ rõ thành phần nào tương ứng với Khai báo (Declaration), Cấp phát thực thể (Instantiation), và Khởi tạo dữ liệu (Initialization).
* **Đáp án & Lời giải chi tiết:**
  * *Declaration:* `Box b` (tạo biến tham chiếu trên Stack).
  * *Instantiation:* Toán tử `new` (cấp phát ô nhớ trên Dynamic Heap).
  * *Initialization:* `Box(10, 20, 30)` (gọi constructor để nạp dữ liệu vào ô nhớ trên Heap).

#### Bài 12.2: Lỗi biên dịch khi thiếu Default Constructor
* **Đề bài:** Lớp `Item` được định nghĩa như sau:
  ```java
  public class Item {
      int id;
      public Item(int id) { this.id = id; }
  }
  ```
  Lệnh `Item it = new Item();` có biên dịch được không? Giải thích vì sao dựa trên quy tắc của Java.
* **Đáp án & Lời giải chi tiết:**
  * Lệnh trên **bị lỗi biên dịch**: `constructor Item in class Item cannot be applied to given types; required: int; found: no arguments`.
  * *Giải thích:* Do lớp `Item` đã có một constructor có tham số, trình biên dịch không tự động sinh constructor mặc định không tham số nữa. Muốn gọi `new Item()`, lập trình viên bắt buộc phải tự tay viết thêm `public Item() {}`.

#### Bài 12.3: Xử lý Variable Shadowing với từ khóa `this`
* **Đề bài:** Cho đoạn mã sau:
  ```java
  public class Employee {
      String name;
      public Employee(String name) {
          name = name;
      }
  }
  ```
  Nếu chạy lệnh `Employee e = new Employee("Lan"); System.out.println(e.name);`, kết quả in ra là gì? Hãy dùng `this` để sửa lại.
* **Đáp án & Lời giải chi tiết:**
  * *Kết quả in ra:* `null`.
  * *Giải thích:* Lệnh `name = name;` chỉ tự gán tham số cục bộ cho chính nó. Thuộc tính `name` của đối tượng không được cập nhật nên vẫn giữ giá trị mặc định là `null`.
  * *Sửa lại:*
    ```java
    public Employee(String name) {
        this.name = name;
    }
    ```

#### Bài 12.4: Cơ chế sao chép tham chiếu đối tượng trên bộ nhớ
* **Đề bài:** Đoạn mã sau in ra kết quả gì? Giải thích cơ chế biến tham chiếu trên Stack và đối tượng trên Heap:
  ```java
  int[] a = {10, 20};
  int[] b = a;
  b[0] = 99;
  System.out.println(a[0]);
  ```
* **Đáp án & Lời giải chi tiết:**
  * *Kết quả in ra:* `99`.
  * *Giải thích:* Mảng trong Java là một đối tượng trên Heap. Biến `a` lưu địa chỉ trỏ đến mảng đó. Lệnh gán `b = a` sao chép địa chỉ tham chiếu, khiến cả `a` và `b` cùng trỏ chung vào một mảng duy nhất trên Heap. Thao tác qua `b[0] = 99` làm thay đổi trực tiếp ô nhớ mảng, do đó `a[0]` cũng nhận giá trị `99`.

#### Bài 12.5: Thứ tự nạp giá trị khi khởi tạo đối tượng
* **Đề bài:** Cho lớp sau:
  ```java
  public class DemoInit {
      int val = 5;
      public DemoInit() {
          System.out.print(val + " ");
          val = 20;
          System.out.print(val);
      }
      public static void main(String[] args) {
          DemoInit d = new DemoInit();
      }
  }
  ```
  Màn hình console sẽ in ra kết quả gì?
* **Đáp án & Lời giải chi tiết:**
  * *Kết quả in ra:* `5 20`.
  * *Giải thích:* Thuộc tính `val` được gán giá trị khai báo ban đầu là `5` trước khi thân constructor chạy. Lệnh in đầu tiên in ra `5`. Sau đó `val` được cập nhật thành `20` và lệnh in thứ hai in ra `20`.

---

## 4. Slot 13: Đóng gói (Encapsulation), Access Modifiers & Tổ chức Package

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

---

### 4.5. Bộ 5 bài tập tự luyện Slot 13 (Kèm lời giải chi tiết)

#### Bài 13.1: Viết Getter/Setter kiểm tra điều kiện biên
* **Đề bài:** Viết lớp `Student` có thuộc tính `private double mark;`. Hãy viết phương thức `getMark()` và `setMark(double mark)` sao cho điểm chỉ được chấp nhận nếu nằm trong khoảng từ `0.0` đến `10.0`; nếu không hợp lệ thì in thông báo `"Diem khong hop le!"` và giữ nguyên giá trị cũ.
* **Đáp án & Lời giải chi tiết:**
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

#### Bài 13.2: Lỗi vị trí đặt từ khóa Package
* **Đề bài:** Đoạn mã sau gặp lỗi biên dịch nào?
  ```java
  import java.util.Date;
  package company.hr;

  public class Staff { }
  ```
* **Đáp án & Lời giải chi tiết:**
  * Bị lỗi biên dịch: `class, interface, or enum expected` hoặc `package declaration must be the first statement in the file`.
  * *Giải thích:* Khai báo `package` bắt buộc phải là câu lệnh đầu tiên trong tệp mã nguồn Java. Câu lệnh `import` không được phép đặt trước `package`.

#### Bài 13.3: Khác biệt cốt lõi giữa `protected` và `default`
* **Đề bài:** Một biến có mức truy cập `protected` khác với một biến có mức truy cập `default` (package-private) ở điểm cụ thể nào?
* **Đáp án & Lời giải chi tiết:**
  * Cả hai đều cho phép các lớp trong cùng package truy xuất tự do.
  * *Khác biệt cốt tử:* Biến `protected` cho phép lớp con kế thừa (subclass) **nằm ở package khác** có thể truy xuất được, trong khi biến `default` hoàn toàn **không cho phép** bất kỳ lớp nào ở ngoài package truy cập, kể cả lớp con kế thừa.

#### Bài 13.4: Bảo vệ dữ liệu với mức truy cập `private`
* **Đề bài:** Đoạn mã sau bị lỗi gì khi biên dịch?
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
* **Đáp án & Lời giải chi tiết:**
  * Bị lỗi biên dịch: `balance has private access in BankAccount`.
  * *Giải thích:* Biến `balance` được bảo vệ bằng từ khóa `private`, do đó chỉ có mã nguồn nằm bên trong thân lớp `BankAccount` mới có quyền đọc và ghi trực tiếp vào biến này. Bên ngoài bắt buộc phải gọi qua các phương thức công khai.

#### Bài 13.5: Cú pháp chạy chương trình có Package qua dòng lệnh
* **Đề bài:** File `MainApp.class` nằm tại thư mục `D:\Workspace\build\classes\app\ui\MainApp.class`. Khi mở CMD tại thư mục `D:\Workspace\build\classes`, câu lệnh console nào sau đây là câu lệnh đúng để chạy chương trình?
  1. `java MainApp`
  2. `java app/ui/MainApp`
  3. `java app.ui.MainApp`
  4. `java app.ui.MainApp.class`
* **Đáp án & Lời giải chi tiết:**
  * **Đáp án đúng:** **Lựa chọn 3 (`java app.ui.MainApp`)**.
  * *Giải thích:* Khi thực thi lớp nằm trong package, JVM yêu cầu cung cấp tên lớp đầy đủ (Fully Qualified Name) có định dạng `package_name.ClassName`. Không dùng dấu gạch chéo và không viết đuôi `.class`.

---

## 5. Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Java Basics Part 1 (OOP, Access Modifiers)](../java/basis/java-basic-questions-01.md) · [Java Basics Part 2 (this, super, Constructors)](../java/basis/java-basic-questions-02.md)
- **Slide & PDF gốc offline:** [Introduction.pdf](/media/pro192/resources/Introduction.pdf) · [Encapsulation.pdf](/media/pro192/resources/Encapsulation.pdf)
