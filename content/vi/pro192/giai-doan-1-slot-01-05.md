---
title: "Giai đoạn 1 (Slot 1–5): Khởi động, Môi trường & Nền tảng Cú pháp Java"
category: PRO192
slots: "Slot 1 – 5"
lang: vi
description: "Tổng quan Java Platform, JVM/JRE/JDK, cài đặt NetBeans/CLI, kiểu dữ liệu nguyên thủy, toán tử, phạm vi biến và cấu trúc điều khiển."
---

# Giáo Trình Giai Đoạn 1: Khởi Động, Môi Trường & Nền Tảng Cú Pháp Java (Slot 1 – 5)

## 1. Giới Thiệu Lộ Trình & Định Hướng Giai Đoạn 1

Giai đoạn 1 là chặng đường đặt nền móng vững chắc cho người học lập trình Java từ con số 0. Mục tiêu trọng tâm của giai đoạn này là giúp người học làm chủ các công cụ phát triển phần mềm, thấu hiểu tường tận cơ chế biên dịch và thông dịch của kiến trúc nền tảng Java, nắm vững hệ thống kiểu dữ liệu nguyên thủy, toán tử số học/logic/dịch bit, các cấu trúc điều khiển rẽ nhánh, vòng lặp và quy chuẩn viết mã nguồn chuẩn mực theo tài liệu đào tạo chuyên nghiệp.

Tài liệu này tổng hợp toàn bộ bài giảng từ Slot 1 đến Slot 5, chỉ rõ từng slide tài liệu bài giảng tương ứng, đi kèm trọn bộ 25 bài tập thực hành tự luyện được phân bổ đều cho 5 slot kèm lời giải phân tích chi tiết.

---

## 2. Slot 1: Tổng Quan Công Nghệ Java & Kiến Trúc Nền Tảng

* **Tài liệu học tập tương ứng:** Bộ slide `Get Start.pptx` (từ slide *About the Java Technology (1)* đến slide *Java Platform*) và `Introduction.pptx`.

### 2.1. Lịch Sử Hình Thành & Mục Tiêu Thiết Kế Ban Đầu
Theo tài liệu bài giảng `Get Start.pptx` (slide *About the Java Technology (1)*), lịch sử ngôn ngữ Java bắt đầu vào năm 1990 tại Sun Microsystems. Một nhóm kỹ sư gồm **James Gosling, Bill Joy, và Patrick Naughton** đã khởi xướng dự án phát triển một ngôn ngữ lập trình có tên ban đầu là **Oak**. 

Mục tiêu ban đầu của Oak không hướng tới máy vi tính cá nhân hay ứng dụng máy tính để bàn, mà nhằm mục đích nhúng chương trình điều khiển vào các thiết bị điện tử gia dụng thông minh (Consumer electronic devices) như đầu máy video cassette (VCR) và thiết bị kỹ thuật số hỗ trợ cá nhân (PDA).

Tại thời điểm đó, ngôn ngữ thiết kế phải đáp ứng được ba đòi hỏi kỹ thuật sống còn:
1. **Độc lập nền tảng (Platform independent):** Chương trình phải chạy được trên nhiều loại vi xử lý khác nhau của các hãng sản xuất thiết bị mà không cần sửa đổi mã nguồn.
2. **Cực kỳ tin cậy (Extremely reliable):** Phần mềm nhúng trên thiết bị tiêu dùng không được phép gặp sự cố làm tê liệt thiết bị.
3. **Gọn nhẹ (Compact):** Dung lượng bộ nhớ của các thiết bị phần cứng thời kỳ đó rất hạn chế.

Đến giai đoạn 1993 – 1994, khi các dự án truyền hình tương tác và thiết bị PDA gặp bế tắc trên thị trường thương mại, cùng lúc đó mạng toàn cầu Internet và World Wide Web bùng nổ, Sun Microsystems đã quyết định chuyển hướng hoàn toàn ngôn ngữ Oak sang môi trường phát triển ứng dụng Internet và đổi tên chính thức thành **Java**. 

Năm 1994, Sun cho ra đời trình duyệt **HotJava Browser** viết hoàn toàn bằng Java, đánh dấu sự xuất hiện của công nghệ Java Applet, mở ra kỷ nguyên mới cho các trang web động tương tác cao. Lộ trình phát triển của Java trải qua ba mốc tiến hóa lớn:
* **1991 – 1994:** Thời kỳ hệ thống nhúng (Embedded Systems).
* **1995 – 1997:** Kỳ quan phía máy khách người dùng (A client-side Wonder).
* **1997 đến nay:** Chuyển dịch mạnh mẽ và thống trị tầng ứng dụng máy chủ/tầng trung gian (Middle-tier & Enterprise).

### 2.2. 10 Đặc Tính Kỹ Thuật Cốt Lõi Của Java
Theo slide *About the Java Technology (3)*, ngôn ngữ Java sở hữu 10 đặc tính kỹ thuật nền tảng:
* **Đơn giản (Simple):** Loại bỏ các cú pháp phức tạp, dễ gây lỗi bộ nhớ của C/C++ như con trỏ số học tường minh, đa kế thừa trực tiếp giữa các lớp, và giải phóng bộ nhớ thủ công.
* **Hướng đối tượng (Object oriented):** Mọi logic tính toán và dữ liệu đều được đóng gói bên trong các lớp và đối tượng.
* **Phân tán (Distributed):** Tích hợp sẵn các thư viện hỗ trợ giao thức mạng TCP/IP, RMI giúp phát triển ứng dụng mạng thuận tiện.
* **Đa luồng (Multithreaded):** Hỗ trợ lập trình đồng thời nhiều luồng xử lý độc lập ngay từ cấp độ ngôn ngữ và máy ảo.
* **Liên kết động (Dynamic linking):** Các lớp mã chỉ được nạp vào bộ nhớ (Class Loading) khi chương trình thực sự cần đến.
* **Trung lập kiến trúc (Architecture neutral):** Trình biên dịch tạo ra định dạng bytecode không phụ thuộc vào tập lệnh của bất kỳ CPU cụ thể nào.
* **Khả chuyển (Portable):** Quy định chặt chẽ kích thước và miền giá trị của các kiểu dữ liệu trên mọi nền tảng phần cứng.
* **Hiệu năng cao (High performance):** Kết hợp giữa trình thông dịch và công nghệ biên dịch tại thời điểm chạy (JIT - Just-In-Time Compiler).
* **Mạnh mẽ / Chặt chẽ (Robust):** Kiểm tra kiểu dữ liệu nghiêm ngặt tại thời điểm biên dịch và thời điểm chạy, loại bỏ lỗi ghi đè ô nhớ ngoài ý muốn nhờ quản lý con trỏ ngầm định.
* **An toàn (Secure):** Mô hình bảo mật nhiều lớp ngăn chặn các đoạn mã độc truy xuất trái phép vào hệ thống tập tin cục bộ.

### 2.3. Cơ Chế Độc Lập Nền Tảng: "Write Once, Run Anywhere" (WORA)
Slide *How can Java support platform-independence?* giải thích cơ chế giúp Java độc lập với hệ điều hành và phần cứng bằng quy trình chuyển đổi hai bước:

Mã nguồn được viết trong tập tin văn bản thuần túy có phần mở rộng `.java`. Khi thực hiện biên dịch bằng công cụ `javac.exe`, trình biên dịch không dịch mã nguồn ra mã máy nhị phân của Windows, Linux hay macOS. Thay vào đó, `javac.exe` dịch mã nguồn thành **Java Bytecode** – một tập lệnh trung gian trừu tượng được lưu trong tập tin có phần mở rộng `.class`.

Bytecode này có cấu trúc giống hệt nhau trên mọi máy tính. Khi cần chạy chương trình, mỗi hệ điều hành sẽ sử dụng một bản cài đặt riêng của **Java Virtual Machine (JVM)** thông qua công cụ `java.exe`. JVM đóng vai trò như một bộ thông dịch thông minh, đọc từng lệnh bytecode từ file `.class` và chuyển dịch tương thích với kiến trúc vi xử lý và hệ điều hành cụ thể bên dưới. Nhờ đó, người lập trình chỉ cần biên dịch mã nguồn một lần duy nhất, tệp `.class` có thể mang sang bất kỳ máy tính nào có cài đặt JVM để thực thi mà không cần biên dịch lại.

### 2.4. Hai Thành Phần Trụ Cột Của Java Platform

![Kiến trúc Java Platform và JVM](/media/pro192/images/JavaPlatform.png)

![Cách JVM biên dịch và thực thi Bytecode](/media/pro192/images/JVM.png)

Trong slide *Java Platform*, nền tảng Java được định nghĩa là môi trường phần mềm bao bọc bên trên hệ điều hành và phần cứng. Nền tảng này gồm hai thành phần thiết yếu:
1. **Java Virtual Machine (JVM):** Là cỗ máy tính toán trừu tượng. JVM quản lý việc nạp các lớp (ClassLoader), cấp phát và giải phóng vùng nhớ (Memory Management & Garbage Collection), quản lý ngăn xếp thực thi (Call Stack), và cung cấp động cơ thực thi bytecode (Execution Engine).
2. **Java Application Programming Interface (API):** Là bộ sưu tập khổng lồ gồm hàng ngàn lớp và giao diện đã được biên dịch sẵn, gom nhóm thành các gói (packages) như `java.lang`, `java.util`, `java.io`, `java.net`. API cung cấp đầy đủ các khối chức năng từ cơ bản (xử lý chuỗi, mảng, cấu trúc dữ liệu) đến nâng cao (nhập xuất dữ liệu, lập trình mạng, giao diện đồ họa).

### 2.5. Trọn Bộ 5 Bài Tập Tự Luyện Slot 1 & Lời Giải Chi Tiết

#### Bài tập 1.1: Vai trò và định dạng của Bytecode
* **Đề bài:** Trình biên dịch `javac.exe` biên dịch mã nguồn `Program.java` thành tập tin nào? Tập tin đó chứa mã gì và chạy trực tiếp trên phần cứng máy tính hay thông qua thành phần nào?
* **Lời giải chi tiết:** 
  Trình biên dịch `javac.exe` biên dịch `Program.java` thành tập tin `Program.class`. Tập tin này chứa **Java Bytecode** (chuỗi tập lệnh mã nhị phân trung gian chuẩn hóa). Bytecode không thể chạy trực tiếp trên phần cứng máy tính mà phải chạy thông qua máy ảo **Java Virtual Machine (JVM)**. JVM sẽ thông dịch bytecode thành mã máy tương thích với hệ điều hành hiện hành.

#### Bài tập 1.2: Định nghĩa hai thành phần cốt lõi của Java Platform
* **Đề bài:** Hãy nêu chính xác tên và nhiệm vụ của hai thành phần cấu tạo nên Java Platform theo tài liệu bài giảng.
* **Lời giải chi tiết:**
  Hai thành phần cốt lõi gồm:
  1. **Java Virtual Machine (JVM):** Chịu trách nhiệm thực thi mã bytecode, quản lý bộ nhớ, ngăn xếp luồng và cung cấp môi trường chạy an toàn cho ứng dụng.
  2. **Java Application Programming Interface (API):** Thư viện các lớp và giao diện được viết sẵn cung cấp các tiện ích lập trình từ cơ bản đến nâng cao.

#### Bài tập 1.3: Lịch sử và mục tiêu ban đầu của ngôn ngữ Oak
* **Đề bài:** Ngôn ngữ Java ban đầu mang tên là gì, được nhóm kỹ sư nào phát triển vào năm 1990 tại Sun Microsystems, và được thiết kế nhằm mục đích cho thiết bị gì?
* **Lời giải chi tiết:**
  Ngôn ngữ ban đầu có tên là **Oak**, do nhóm kỹ sư gồm **James Gosling, Bill Joy, và Patrick Naughton** thiết kế vào năm 1990. Mục tiêu ban đầu là nhúng vào các thiết bị điện tử tiêu dùng thông minh (Consumer electronics) như đầu phát video cassette (VCR) và thiết bị kỹ thuật số cá nhân (PDA).

#### Bài tập 1.4: Phân tích các đặc tính kỹ thuật của Java
* **Đề bài:** Trình bày ý nghĩa của hai đặc tính: **Kiến trúc trung lập (Architecture neutral)** và **Khả chuyển (Portable)** trong danh sách 10 đặc tính kỹ thuật cốt lõi của Java.
* **Lời giải chi tiết:**
  * **Kiến trúc trung lập (Architecture neutral):** Trình biên dịch Java tạo ra định dạng tệp bytecode `.class` không phụ thuộc vào bất kỳ kiến trúc phần cứng hay vi xử lý cụ thể nào.
  * **Khả chuyển (Portable):** Java quy định thống nhất kích thước bộ nhớ và miền giá trị của các kiểu dữ liệu nguyên thủy trên toàn bộ các nền tảng (ví dụ kiểu `int` luôn cố định 4 bytes dù chạy trên máy 32-bit hay 64-bit), giúp mã nguồn chạy nhất quán trên mọi môi trường.

#### Bài tập 1.5: Bản chất của triết lý "Write Once, Run Anywhere"
* **Đề bài:** Tại sao lập trình viên Java không cần phải biên dịch lại mã nguồn khi di chuyển chương trình từ máy tính chạy hệ điều hành Windows sang máy tính chạy hệ điều hành Linux?
* **Lời giải chi tiết:**
  Vì sản phẩm của quá trình biên dịch là tệp bytecode `.class` trung lập, không chứa các lệnh mã máy của hệ điều hành Windows. Khi chuyển sang máy Linux, chỉ cần máy tính đó cài đặt phiên bản JVM dành cho Linux, JVM này sẽ đọc bytecode và tự động chuyển đổi thành tập lệnh máy tương ứng của Linux tại thời điểm chạy.

---

## 3. Slot 2: Cài Đặt Môi Trường, Công Cụ & Chương Trình Đầu Tiên

* **Tài liệu học tập tương ứng:** Bộ slide `Download & Install JDK & NetBeans 8.pptx` và `Get Start.pptx` (từ slide *Set up Environment Variables* đến slide *The first Java program in the NetBeans*).

### 3.1. Chuẩn Bị Bộ Công Cụ Lập Trình Java
Theo slide `Download & Install JDK & NetBeans 8.pptx`, để xây dựng môi trường phát triển Java hoàn chỉnh, lập trình viên cần cài đặt hai phần mềm:
1. **Java SE Development Kit (JDK 8):** Cung cấp toàn bộ môi trường phát triển gồm trình biên dịch `javac.exe`, bộ thông dịch máy ảo `java.exe`, công cụ đóng gói `jar.exe` và các thư viện chuẩn của Java API.
2. **NetBeans IDE 8.2:** Môi trường phát triển tích hợp (Integrated Development Environment) cung cấp trình soạn thảo mã nguồn thông minh, hỗ trợ tự động gợi ý cú pháp, quản lý cây thư mục dự án và gỡ lỗi (debugging).

### 3.2. Cấu Hình Biến Môi Trường Hệ Thống (Environment Variables)
Slide *Set up Environment Variables* trong `Get Start.pptx` chỉ rõ các bước cấu hình biến môi trường trên hệ điều hành Windows:
* **Mở hộp thoại thiết lập:** `My Computer` (hoặc `This PC`) -> `Properties` -> `Advanced system settings` -> `Environment Variables`.
* **Cấu hình biến `Path`:**
  * Tại khung `System Variables`, chọn biến `Path` và nhấn `Edit`.
  * Thêm đường dẫn trỏ trực tiếp đến thư mục `bin` của JDK đã cài đặt (ví dụ: `;C:\Program Files\Java\jdk1.8.0\bin;`).
  * **Ý nghĩa kỹ thuật:** Giúp hệ điều hành Windows nhận diện và cho phép thực thi các lệnh như `javac` và `java` từ bất kỳ đường dẫn thư mục nào trên cửa sổ Command Prompt (`cmd`).
* **Cấu hình biến `CLASSPATH`:**
  * Thêm mới hoặc chỉnh sửa biến `CLASSPATH` với giá trị bắt đầu bằng dấu chấm và dấu chấm phẩy: `.;C:\Program Files\Java\jdk1.8.0\lib;`.
  * **Ý nghĩa kỹ thuật:** Dấu chấm `.` đại diện cho thư mục làm việc hiện hành (Current Working Directory). Cấu hình này chỉ thị cho JVM ưu tiên tìm kiếm các tệp lớp `.class` ngay tại thư mục mà câu lệnh đang được thực thi trước khi tìm kiếm trong các thư viện mở rộng khác.

### 3.3. Quy Trình Tạo Dự Án NetBeans & Viết Chương Trình `HelloWorld`
Theo slide *The first Java program in the NetBeans*, quy trình chuẩn mực gồm 4 bước:

* **Bước 1: Khởi tạo Project (New Project)**
  * Vào menu `File` -> chọn `New Project...` (hoặc nhấn phím tắt `Ctrl + Shift + N`).
  * Trong khung `Categories`, chọn `Java`; trong khung `Projects`, chọn `Java Application` -> nhấn `Next`.
  * Đặt tên dự án tại ô `Project Name`: `FirstPrj`.
  * **Lưu ý nghiệp vụ:** Bỏ chọn ô đánh dấu **"Create Main Class"**. Tài liệu giải thích rõ: nếu tích chọn ô này, NetBeans sẽ tự động tạo một lớp mặc định tên là `Main`; bỏ tích chọn sẽ giúp lập trình viên chủ động tự tạo và quản lý nhiều chương trình với các lớp độc lập trong cùng một dự án. Nhấn `Finish`.
* **Bước 2: Tạo lớp mã nguồn (Add a Java Class)**
  * Tại cây quản lý dự án bên trái, click chuột phải vào mục `<default package>` trong thư mục `Source Packages` -> chọn `New` -> chọn `Java Class...`.
  * Đặt tên lớp tại ô `Class Name`: `HelloWorld`.
  * Nhấn `Finish`. Tập tin `HelloWorld.java` sẽ được tạo trong thư mục nguồn của dự án.
* **Bước 3: Soạn thảo mã nguồn (Write Code)**
  * Viết mã nguồn cho lớp `HelloWorld`:
  ```java
  public class HelloWorld {
      public static void main(String[] args) {
          System.out.println("Hello World!");
      }
  }
  ```
* **Bước 4: Biên dịch và chạy chương trình trong NetBeans**
  Tài liệu giới thiệu 4 cách chạy tập tin trong NetBeans:
  1. Click chuột phải trực tiếp vào tập tin `HelloWorld.java` tại cây dự án bên trái -> chọn `Run File` (hoặc phím tắt **`Shift + F6`**).
  2. Click chuột phải vào vị trí bất kỳ bên trong cửa sổ soạn thảo của file `HelloWorld.java` -> chọn `Run File` (`Shift + F6`).
  3. Nhấn biểu tượng tam giác xanh lá cây (Run Project) trên thanh công cụ; khi hộp thoại xuất hiện, chọn `HelloWorld` làm Main Class rồi nhấn `OK`.
  4. Click chuột phải vào biểu tượng dự án `FirstPrj` ở cây bên trái -> chọn `Run`.

### 3.4. Cấu Trúc Thư Mục Sau Khi Biên Dịch
Khi chương trình được biên dịch, NetBeans phân tách rõ ràng hai cấu trúc thư mục vật lý:
* Mã nguồn bạn soạn thảo được lưu tại: `FirstPrj\src\HelloWorld.java`.
* Mã bytecode sau khi biên dịch được sinh ra tại: `FirstPrj\build\classes\HelloWorld.class`.

### 3.5. Trọn Bộ 5 Bài Tập Tự Luyện Slot 2 & Lời Giải Chi Tiết

#### Bài tập 2.1: Vai trò của biến môi trường Path
* **Đề bài:** Khi cấu hình biến môi trường `Path` trong Windows để thực thi lệnh của Java từ Command Prompt, đường dẫn phải trỏ chính xác vào thư mục nào trong thư mục cài đặt JDK?
* **Lời giải chi tiết:**
  Đường dẫn phải trỏ chính xác vào thư mục **`bin`** của JDK (ví dụ: `C:\Program Files\Java\jdk1.8.0\bin;`). Thư mục này là nơi lưu trữ các tệp thực thi cốt lõi gồm `javac.exe` (trình biên dịch) và `java.exe` (trình thông dịch máy ảo).

#### Bài tập 2.2: Phân tích ý nghĩa dấu chấm trong biến CLASSPATH
* **Đề bài:** Trong chuỗi cấu hình biến `CLASSPATH = .;C:\Program Files\Java\jdk1.8.0\lib;`, ký tự dấu chấm `.` ở đầu chuỗi có ý nghĩa kỹ thuật gì đối với JVM?
* **Lời giải chi tiết:**
  Dấu chấm `.` đại diện cho **thư mục làm việc hiện hành (current directory)**. Nó chỉ định cho máy ảo JVM ưu tiên tìm kiếm các tệp lớp `.class` ngay tại thư mục đang mở dòng lệnh trước khi tìm kiếm trong các thư viện hệ thống khác.

#### Bài tập 2.3: Lý do bỏ chọn Create Main Class trong NetBeans
* **Đề bài:** Theo tài liệu hướng dẫn tạo project `FirstPrj` trong bài giảng, vì sao lập trình viên được hướng dẫn bỏ chọn ô "Create Main Class" khi khởi tạo dự án?
* **Lời giải chi tiết:**
  Bỏ chọn ô "Create Main Class" giúp ngăn NetBeans tự động sinh ra một lớp cố định tên là `Main`. Việc này giúp người học tự do tổ chức, đặt tên lớp theo ý muốn và có thể chứa nhiều lớp có phương thức `main` độc lập trong cùng một dự án để chạy từng bài thực hành riêng biệt.

#### Bài tập 2.4: Phím tắt thực thi tập tin trong NetBeans
* **Đề bài:** Nêu tổ hợp phím tắt chuẩn trên bàn phím để chạy trực tiếp một tập tin mã nguồn Java (Run File) đang mở trong giao diện NetBeans IDE.
* **Lời giải chi tiết:**
  Tổ hợp phím tắt là **`Shift + F6`**.

#### Bài tập 2.5: Tổ chức thư mục mã nguồn và bytecode
* **Đề bài:** Trong một dự án Java được tạo bởi NetBeans, mã nguồn do người dùng viết và mã bytecode do hệ thống biên dịch được lưu trữ ở hai thư mục con tương ứng nào?
* **Lời giải chi tiết:**
  * Mã nguồn (`.java`) được lưu trữ tại thư mục **`src`** (ví dụ: `FirstPrj\src\HelloWorld.java`).
  * Mã bytecode (`.class`) được lưu trữ tại thư mục **`build\classes`** (ví dụ: `FirstPrj\build\classes\HelloWorld.class`).

---

## 4. Slot 3: Cấu Trúc Chương Trình Java & Quy Trình Biên Dịch Dòng Lệnh

* **Tài liệu học tập tương ứng:** Bộ slide `Get Start.pptx` (từ slide *Structure of a Java program* đến slide *Summary*).

### 4.1. Giải Phẫu Cấu Trúc Mã Nguồn Java

![Cấu trúc chương trình Java đầu tiên](/media/pro192/images/firstProgram.png)

Slide *Structure of a Java program* và *A Closer Look at the "Hello World!" Application* phân tích chi tiết từng khối cấu trúc của một ứng dụng Java:

```java
/*
 * Chu thich tren nhieu dong (Block comment)
 */
public class HelloWorld {
    // Chu thich tren mot dong (End-of-line comment)
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
```

* **Chú thích (Comments):** Java cung cấp hai cơ chế chú thích:
  * Chú thích khối: Bắt đầu bằng `/*` và kết thúc bằng `*/`, dùng để ghi chú giải thuật kéo dài nhiều dòng.
  * Chú thích dòng: Bắt đầu bằng cặp dấu gạch chéo `//`, có tác dụng giải thích từ vị trí đó đến cuối dòng.
* **Khai báo lớp (Class Declaration):** 
  * Mọi dòng lệnh trong Java bắt buộc phải nằm bên trong một lớp (class).
  * Từ khóa `public` là bộ bổ nghĩa truy cập cho phép lớp được sử dụng từ bên ngoài.
  * Tên lớp `HelloWorld` phải trùng khớp hoàn toàn với tên tập tin vật lý `HelloWorld.java` (phân biệt chữ hoa và chữ thường).
* **Phương thức `main` (Entry Point):**
  * Là điểm bắt đầu thực thi của mọi ứng dụng Java độc lập.
  * `public`: Cho phép JVM gọi phương thức này từ bên ngoài lớp.
  * `static`: Cho phép JVM gọi trực tiếp phương thức thông qua tên lớp mà không cần phải dùng từ khóa `new` để khởi tạo đối tượng trước. Slide ghi nhận: thứ tự khai báo `public static` hoặc `static public` đều hợp lệ.
  * `void`: Phương thức thực thi logic mà không trả về bất kỳ giá trị nào.
  * `String[] args`: Mảng chứa các chuỗi ký tự đại diện cho các tham số dòng lệnh được truyền vào khi khởi động chương trình. Cú pháp `String args[]` cũng được chấp nhận.
  * `System.out.println(...)`: Lệnh gọi phương thức của đối tượng luồng xuất chuẩn để in dữ liệu ra console và tự động xuống dòng mới.

### 4.2. Cú Pháp Biên Dịch Và Thực Thi Bằng Dòng Lệnh
Khi không dùng IDE, quy trình thực thi dòng lệnh gồm hai câu lệnh riêng biệt:
1. **Lệnh biên dịch (Compile):**
   * **Cú pháp:** `javac [options] source`
   * **Quy tắc:** `source` là tên một hoặc nhiều tập tin mã nguồn có đầy đủ phần mở rộng `.java`.
   * **Ví dụ:** `javac HelloWorld.java` -> sinh ra tệp `HelloWorld.class`.
2. **Lệnh thông dịch thực thi (Run):**
   * **Cú pháp:** `java [options] classname [args]`
   * **Quy tắc:** `classname` là **tên của lớp**, tuyệt đối không được viết thêm đuôi `.class`. Nếu có tham số dòng lệnh, các tham số viết cách nhau bằng khoảng trắng phía sau tên lớp.
   * **Ví dụ:** `java HelloWorld`.

### 4.3. Kỹ Thuật Triển Khai Ứng Dụng Cho Người Dùng Cuối (End Users)
Người dùng cuối chỉ cài đặt môi trường máy ảo JRE và chạy chương trình thông qua tập tin `.class` trong thư mục `build\classes`. Tài liệu slide *End users run Java Programs* hướng dẫn ba giải pháp thực thi:

* **Giải pháp 1: Sử dụng tham số `-cp` hoặc `-classpath`**
  ```shell
  java -cp K:\GiangDay\FU\Java-OOP\Demos\FirstPrj\build\classes HelloWorld
  java -classpath K:\GiangDay\FU\Java-OOP\Demos\FirstPrj\build\classes HelloWorld
  ```
  Lệnh này chỉ định tường minh cho JVM biết thư mục chứa tệp bytecode cần thực thi.
* **Giải pháp 2: Điều hướng vào thư mục lớp và chạy trực tiếp**
  Nhờ biến môi trường `CLASSPATH` đã có thiết lập `.;` ở đầu:
  ```shell
  K:
  cd K:\GiangDay\FU\Java-OOP\Demos\FirstPrj\build\classes
  java HelloWorld
  ```
* **Giải pháp 3: Đóng gói tập tin thực thi Batch (`.bat`)**
  Slide *A BAT file* hướng dẫn tạo một tập tin văn bản bằng Notepad đặt tên là `HelloWorld.bat` nằm ngay tại thư mục chứa file `.class` với nội dung:
  ```text
  java HelloWorld
  Pause
  ```
  Người dùng cuối chỉ cần nhấp đúp chuột vào tập tin `.bat`. Lệnh `Pause` có nhiệm vụ giữ cửa sổ dòng lệnh mở để người dùng xem kết quả xuất ra cho đến khi nhấn một phím bất kỳ.

### 4.4. Xử Lý Các Lỗi Thường Gặp (Common Problems & Solutions)
Bảng tổng hợp chẩn đoán lỗi theo slide *Common Problems (and Their Solutions)*:

| Thông báo lỗi hiển thị | Nguyên nhân gốc rễ | Giải pháp xử lý triệt để |
| :--- | :--- | :--- |
| `'javac' is not recognized as an internal or external command, operable program or batch file` | Hệ điều hành Windows không tìm thấy tệp `javac.exe` do biến môi trường `Path` chưa được thiết lập hoặc thiết lập sai đường dẫn thư mục `bin`. | Kiểm tra lại mục `System Variables`, sửa biến `Path` trỏ đúng vào thư mục `bin` của JDK (ví dụ: `C:\Program Files\Java\jdk1.8.0\bin;`). |
| `Exception in thread "main" java.lang.NoClassDefFoundError: HelloWorld/class` | Người dùng đã gõ nhầm tên tệp có phần mở rộng `.class` khi chạy lệnh `java` (ví dụ: `java HelloWorld.class`). | Loại bỏ đuôi `.class`, chỉ gõ đúng tên lớp: `java HelloWorld`. |
| `Could not find or load main class HelloWorld` | Gõ sai chữ hoa/chữ thường của tên lớp HOẶC tệp `.class` không nằm trong các thư mục được liệt kê tại `CLASSPATH`. | Kiểm tra tính chính xác hoa/thường của tên lớp và đảm bảo `CLASSPATH` có chứa dấu chấm `.;`. |

### 4.5. Trọn Bộ 5 Bài Tập Tự Luyện Slot 3 & Lời Giải Chi Tiết

#### Bài tập 3.1: Phân biệt các loại chú thích trong Java
* **Đề bài:** Trình bày cú pháp của hai dạng chú thích chuẩn trong ngôn ngữ Java và nêu trường hợp ứng dụng thực tế của từng dạng.
* **Lời giải chi tiết:**
  * Chú thích dòng (`//`): Có tác dụng từ sau ký tự `//` đến hết dòng. Dùng để giải thích ngắn gọn ý nghĩa của một dòng lệnh hoặc biến cụ thể.
  * Chú thích khối (`/* ... */`): Bắt đầu bằng `/*` và kết thúc bằng `*/`. Dùng để ghi chú đoạn tài liệu dài, mô tả giải thuật phức tạp kéo dài qua nhiều dòng.

#### Bài tập 3.2: Ý nghĩa của từ khóa static trong phương thức main
* **Đề bài:** Tại sao phương thức `main` trong lớp khởi chạy của Java bắt buộc phải khai báo với từ khóa `static`?
* **Lời giải chi tiết:**
  Từ khóa `static` cho biết phương thức này thuộc về chính bản thân lớp chứ không phụ thuộc vào bất kỳ đối tượng cụ thể nào. Khi chương trình khởi động, JVM có thể gọi trực tiếp phương thức `main` thông qua tên lớp (ví dụ: `HelloWorld.main()`) để bắt đầu thực thi chương trình mà không cần phải cấp phát hay khởi tạo thể hiện (instance) của lớp đó trước.

#### Bài tập 3.3: Thao tác tham số dòng lệnh (Command-line arguments)
* **Đề bài:** Cho lớp `Calculate` có nội dung sau:
  ```java
  public class Calculate {
      public static void main(String[] args) {
          System.out.println("Tong so tham so: " + args.length);
      }
  }
  ```
  Nếu chạy lệnh `java Calculate Ha Noi Viet Nam`, kết quả in ra màn hình là gì? Giải thích cơ chế truyền tham số.
* **Lời giải chi tiết:**
  * **Kết quả in ra:** `Tong so tham so: 4`
  * **Giải thích:** Khi thực thi lệnh, JVM tự động tách các chuỗi ký tự đứng sau tên lớp được phân cách bởi khoảng trắng thành các phần tử mảng kiểu chuỗi: `args[0] = "Ha"`, `args[1] = "Noi"`, `args[2] = "Viet"`, `args[3] = "Nam"`. Mảng này có độ dài `args.length` bằng 4.

#### Bài tập 3.4: Xây dựng tệp Batch chạy tự động
* **Đề bài:** Hãy viết nội dung tệp `RunApp.bat` để thực thi lớp `MainProgram` và giữ cửa sổ màn hình không bị tự động đóng lại sau khi chạy xong.
* **Lời giải chi tiết:**
  Nội dung tệp `RunApp.bat`:
  ```text
  java MainProgram
  Pause
  ```
  Lệnh `java MainProgram` yêu cầu JVM nạp và chạy lớp, còn lệnh `Pause` gửi tín hiệu yêu cầu hệ thống dừng lại và hiển thị thông báo "Press any key to continue . . ." giúp người dùng quan sát toàn bộ kết quả.

#### Bài tập 3.5: Khắc phục lỗi sai cú pháp khi thông dịch
* **Đề bài:** Một lập trình viên gõ lệnh `java MyClass.class` trên cửa sổ dòng lệnh và nhận được thông báo lỗi `NoClassDefFoundError`. Hãy giải thích nguyên nhân máy ảo báo lỗi và sửa lại câu lệnh cho đúng.
* **Lời giải chi tiết:**
  * **Nguyên nhân:** Lệnh `java` nhận tham số là **tên lớp (Class Name)** được định nghĩa trong mã nguồn chứ không nhận tên tệp tin vật lý. Dấu chấm trong Java đại diện cho phân cấp gói (package), do đó JVM hiểu nhầm rằng người dùng đang tìm kiếm một lớp tên là `class` nằm bên trong gói `MyClass`.
  * **Cách sửa:** Gõ đúng tên lớp không kèm phần mở rộng: `java MyClass`.

---

## 5. Slot 4: Kiểu Dữ Liệu Nguyên Thủy, Biến, Toán Tử & Quản Lý Bộ Nhớ

* **Tài liệu học tập tương ứng:** Bộ slide `Learning the Java Language.pptx` (từ slide *Keywords and Identifiers* đến slide *Scope of a Variable*).

### 5.1. Từ Khóa (Keywords) Và Quy Ước Định Danh (Identifiers)
Slide *Keywords and Identifiers* quy định rõ:
* **Từ khóa (Keywords):** Là các từ dành riêng của ngôn ngữ Java (như `public`, `class`, `static`, `void`, `int`, `if`, `while`...).
* **Định danh (Identifiers):** Là tên do người lập trình đặt cho biến, phương thức, lớp, giao diện:
  * Phải bắt đầu bằng một chữ cái (Letter), ký tự `$`, hoặc dấu gạch dưới `_`.
  * Các ký tự tiếp theo có thể chứa chữ cái, chữ số (Digits), `$`, hoặc `_`.
  * Phân biệt nghiêm ngặt chữ hoa và chữ thường (Case-sensitive).
  * **Tuyệt đối không được trùng với các từ khóa** của Java.

### 5.2. Hệ Thống 8 Kiểu Dữ Liệu Nguyên Thủy (Primitive Data Types)

![8 kiểu dữ liệu nguyên thủy trong Java](/media/pro192/images/PrimaryDataType.png)

![Kiểu tham chiếu trong Java](/media/pro192/images/referenceDataType.png)

Slide *Primitive Data Types - Variables* phân tích các kiểu dữ liệu cơ sở được lưu trữ trực tiếp trên vùng nhớ **Stack**:

| Kiểu dữ liệu | Kích thước | Miền giá trị biểu diễn | Quy cách biểu diễn hằng số |
| :--- | :---: | :--- | :--- |
| `byte` | 1 byte (8 bits) | `-2^7` (-128) đến `2^7 - 1` (127) | Số nguyên có dấu |
| `short` | 2 bytes (16 bits) | `-2^15` (-32,768) đến `2^15 - 1` (32,767) | Số nguyên có dấu |
| `int` | 4 bytes (32 bits) | `-2^31` đến `2^31 - 1` | Mặc định cho số nguyên (ví dụ: `100`, `0x1A`) |
| `long` | 8 bytes (64 bits) | `-2^63` đến `2^63 - 1` | Thêm hậu tố `L` hoặc `l` (ví dụ: `1000L`) |
| `float` | 4 bytes (32 bits) | Chuẩn IEEE 754 số thực dấu phẩy động | Thêm hậu tố `F` hoặc `f` (ví dụ: `3.14F`) |
| `double` | 8 bytes (64 bits) | Chuẩn IEEE 754 số thực dấu phẩy động | Mặc định cho số thực (ví dụ: `3.14`) |
| `char` | 2 bytes (16 bits) | `\u0000` (0) đến `\uFFFF` (65,535) | Ký tự Unicode đặt trong nháy đơn: `'A'` |
| `boolean` | Tùy JVM | Chỉ nhận một trong hai giá trị chân lý | `true` hoặc `false` |

### 5.3. Kiểu Dữ Liệu Tham Chiếu (Reference Types) & Mảng
* **Bản chất biến tham chiếu:** Khác với kiểu nguyên thủy lưu trực tiếp giá trị trên Stack, biến tham chiếu chỉ lưu **địa chỉ ô nhớ** trỏ đến đối tượng thực tế được cấp phát động trên vùng nhớ **Heap**. Khi một biến tham chiếu chưa trỏ đến bất kỳ đối tượng nào, giá trị của nó là `null`.
* **Mảng một chiều (One-Dimensional Arrays):**
  * Bản chất mảng trong Java là một đối tượng tham chiếu.
  * Khai báo và khởi tạo: `int[] a = new int[5];` hoặc khởi tạo trực tiếp kèm giá trị: `int[] a = {1, 2, 3, 4, 5};`.
  * Thuộc tính `a.length` trả về số lượng phần tử cố định của mảng.
  * Sao chép mảng hiệu năng cao bằng phương thức hệ thống: `System.arraycopy(src, srcPos, dest, destPos, length)`.
* **Mảng nhiều chiều (Multi-Dimensional Arrays):**
  * Trong Java, mảng hai chiều thực chất là một mảng chứa các tham chiếu trỏ đến các mảng một chiều con.
  * Do đó, các hàng trong mảng hai chiều có thể có độ dài khác nhau (Ragged Array).

### 5.4. Hệ Thống Toán Tử (Operators) & Dịch Bit Không Dấu

![Hệ thống toán tử trong Java](/media/pro192/images/operator.png)

Slide *Operators* liệt kê thứ tự ưu tiên từ cao xuống thấp của các toán tử trong Java:
1. **Toán tử đơn (Unary):** `++`, `--`, `+`, `-`, `!`, `~`, ép kiểu `(type)`.
2. **Toán tử số học (Arithmetic):** `*`, `/`, `%` sau đó đến `+`, `-`.
3. **Toán tử dịch bit (Shift Operators):**
   * `<<`: Dịch trái (Shift left).
   * `>>`: Dịch phải số học (Arithmetic shift right - giữ nguyên bit dấu cao nhất).
   * `>>>`: **Dịch phải không dấu (Unsigned shift right)**: Luôn chèn thêm bit `0` vào vị trí ngoài cùng bên trái bất kể số ban đầu là âm hay dương.
   * *Ví dụ phân tích:* Giá trị `-1` kiểu `int` trong hệ thống bù 2 gồm 32 bit `1`. Khi thực hiện `-1 >>> 1`, bit `0` được chèn vào bên trái tạo ra chuỗi bit `0111...1111`, cho kết quả là số nguyên dương lớn nhất: `2147483647` (`2^31 - 1`).
4. **Toán tử so sánh:** `<`, `<=`, `>`, `>=`, `instanceof`, tiếp theo là `==`, `!=`.
5. **Toán tử thao tác bit:** `&` (AND), `^` (XOR), `|` (OR).
6. **Toán tử logic đoản mạch (Short-circuit):** `&&`, `||`.
7. **Toán tử điều kiện 3 ngôi:** `?:`.
8. **Toán tử gán:** `=`, `+=`, `-=`, `*=`,... (thực hiện từ phải sang trái).

### 5.5. Chuyển Đổi Kiểu Dữ Liệu & Rủi Ro Khi Ép Kiểu Tường Minh
Slide *Type Conversions and Explicit Casting* phân biệt rõ hai cơ chế:
* **Chuyển đổi nới rộng (Widening Conversion):** Chuyển từ kiểu có kích thước nhỏ hơn sang kiểu có kích thước lớn hơn (ví dụ từ `byte` sang `short`, `int`, `long`). Quá trình này diễn ra hoàn toàn tự động, an toàn và không mất mát dữ liệu.
* **Chuyển đổi thu hẹp (Narrowing Conversion) & Ép kiểu (Explicit Casting):**
  * Chuyển từ kiểu có kích thước lớn hơn sang kiểu nhỏ hơn (ví dụ từ `short` xuống `byte`).
  * Trình biên dịch sẽ **báo lỗi biên dịch** nếu cố tình gán trực tiếp: `byte b = s;` (với `s` là kiểu `short`).
  * Bắt buộc phải sử dụng cú pháp ép kiểu tường minh: `byte b = (byte) s;`.
  * **Rủi ro mất độ chính xác (Loss of precision):** Ví dụ trong mã nguồn bài giảng `Casting_Convert_1.java`, nếu `s = 256` (dạng nhị phân 16-bit: `0000 0001 0000 0000`), khi ép xuống `byte` (8-bit), Java cắt bỏ 8 bit cao, chỉ giữ lại 8 bit thấp là `0000 0000`, khiến giá trị của biến `b` in ra màn hình bị biến thành `0`.
* **Quy tắc về boolean:** Kiểu `boolean` trong Java tuyệt đối không thể ép kiểu hoặc chuyển đổi sang bất kỳ kiểu dữ liệu số nào và ngược lại.

### 5.6. Phạm Vi Hoạt Động Của Biến (Scope of a Variable)
Slide *Scope* và tệp demo `ScopeDemo.java` quy định:
* Phạm vi của một biến cục bộ được xác định chặt chẽ bởi **khối lệnh chứa nó (Block Scope)**, tính từ thời điểm khai báo cho đến dấu ngoặc nhọn đóng `}` kết thúc khối lệnh đó.
* Các biến khai báo bên trong khối lệnh `if`, `while`, hoặc vòng lặp `for` sẽ bị hủy và hoàn toàn không thể truy xuất từ bên ngoài khối lệnh đó.

### 5.7. Trọn Bộ 5 Bài Tập Tự Luyện Slot 4 & Lời Giải Chi Tiết

#### Bài tập 4.1: Kiểm tra tính hợp lệ của định danh
* **Đề bài:** Trong các tên biến sau, tên nào hợp lệ và tên nào không hợp lệ theo quy ước của Java?
  1. `3rdValue`
  2. `_user_name`
  3. `$account_balance`
  4. `goto`
* **Lời giải chi tiết:**
  * `3rdValue`: **Không hợp lệ** vì định danh không được phép bắt đầu bằng ký tự chữ số.
  * `_user_name`: **Hợp lệ** vì bắt đầu bằng dấu gạch dưới `_`.
  * `$account_balance`: **Hợp lệ** vì bắt đầu bằng ký tự `$`.
  * `goto`: **Không hợp lệ** vì trùng với từ khóa dành riêng của ngôn ngữ Java.

#### Bài tập 4.2: Kích thước bộ nhớ các kiểu dữ liệu nguyên thủy
* **Đề bài:** Điền kích thước lưu trữ chính xác (tính theo byte) cho các kiểu dữ liệu sau: `byte`, `short`, `int`, `long`, `double`, `char`.
* **Lời giải chi tiết:**
  * `byte`: 1 byte (8 bits).
  * `short`: 2 bytes (16 bits).
  * `int`: 4 bytes (32 bits).
  * `long`: 8 bytes (64 bits).
  * `double`: 8 bytes (64 bits).
  * `char`: 2 bytes (16 bits, theo bảng mã Unicode).

#### Bài tập 4.3: Cơ chế cắt bit khi ép kiểu tường minh
* **Đề bài:** Cho đoạn mã Java sau:
  ```java
  int value = 261;
  byte result = (byte) value;
  System.out.println(result);
  ```
  Xác định giá trị in ra màn hình của biến `result` và giải thích bản chất thao tác nhị phân.
* **Lời giải chi tiết:**
  * **Kết quả in ra:** `5`
  * **Giải thích cơ chế:**
    * Giá trị thập phân `261` ở dạng nhị phân 32-bit là: `00000000 00000000 00000001 00000101`.
    * Khi ép kiểu xuống `byte` (8-bit), hệ thống cắt bỏ toàn bộ 24 bit cao bên trái, chỉ giữ lại 8 bit thấp nhất: `00000101`.
    * Chuỗi bit `00000101` chuyển đổi sang hệ thập phân chính là `2^2 + 2^0 = 5`.

#### Bài tập 4.4: Bản chất toán tử dịch bit có dấu và không dấu
* **Đề bài:** Phân tích sự khác biệt giữa hai biểu thức `x >> 2` và `x >>> 2` khi `x` mang giá trị số nguyên âm.
* **Lời giải chi tiết:**
  * Toán tử `>>` (Dịch phải số học): Dịch chuyển các bit sang phải và **bảo toàn bit dấu** (nếu bit dấu cao nhất ban đầu là `1`, các bit mới chèn vào bên trái cũng là bit `1`). Kết quả sau khi dịch vẫn là một số âm.
  * Toán tử `>>>` (Dịch phải không dấu): Dịch chuyển các bit sang phải và **luôn luôn chèn bit `0` vào vị trí cao nhất bên trái**. Kết quả sau khi dịch lập tức biến đổi thành một số nguyên dương rất lớn.

#### Bài tập 4.5: Lỗi biên dịch do vi phạm phạm vi biến
* **Đề bài:** Đoạn mã sau có biên dịch thành công không? Nếu không, chỉ rõ dòng lỗi và cách sửa:
  ```java
  public class TestBlockScope {
      public static void main(String[] args) {
          int n = 10;
          if (n > 5) {
              int total = 100;
              System.out.println("Trong khoi if: " + total);
          }
          System.out.println("Ngoai khoi if: " + total);
      }
  }
  ```
* **Lời giải chi tiết:**
  * **Lỗi biên dịch:** Dòng lệnh `System.out.println("Ngoai khoi if: " + total);` bị báo lỗi không tìm thấy biến `total` (cannot find symbol).
  * **Nguyên nhân:** Biến `total` được khai báo trong khối lệnh `if { ... }`. Phạm vi tồn tại của nó chấm dứt ngay khi gặp dấu ngoặc nhọn đóng `}` của khối `if`.
  * **Cách sửa:** Khai báo biến `total` ở ngoài khối `if` (ngang hàng với `int n = 10;`) trước khi gán giá trị bên trong khối.

---

## 6. Slot 5: Cấu Trúc Điều Khiển Rẽ Nhánh, Vòng Lặp & Chuẩn Phong Cách Mã

* **Tài liệu học tập tương ứng:** Bộ slide `Learning the Java Language.pptx` (từ slide *Basic Constructs / Selection & Loops* đến slide *Elements of Java Style*) và tài liệu `Java Tutorial`.

### 6.1. Cấu Trúc Lựa Chọn Rẽ Nhánh (Selection Statements)
Slide *Basic Logic Constructs* hệ thống hóa các dạng rẽ nhánh điều kiện:
* **Cấu trúc `if` và `if...else` lồng nhau:** Đánh giá biểu thức điều kiện kiểu `boolean`. Nếu đúng thực thi khối lệnh tương ứng, nếu sai chuyển xuống nhánh `else`.
* **Toán tử điều kiện 3 ngôi (`?:`):**
  * Cú pháp: `biến = (điều_kiện) ? giá_trị_nếu_đúng : giá_trị_nếu_sai;`.
  * Ứng dụng tiêu biểu trong slide: Kiểm tra tính hợp lệ của dữ liệu đầu vào trước khi gán (ví dụ: `width = w > 0 ? w : 0;`).
* **Cấu trúc lựa chọn `switch...case`:**
  * Kiểm tra biến nhận giá trị nguyên (`int`, `byte`, `short`), ký tự (`char`).
  * **Từ khóa `break`:** Bắt buộc phải có ở cuối mỗi khối `case` để ngắt luồng điều khiển và thoát ngay khỏi cấu trúc `switch`.
  * **Hiện tượng Fall-through:** Nếu thiếu `break`, chương trình sẽ tiếp tục thực thi các khối `case` phía dưới một cách tuần tự bất kể điều kiện có khớp hay không.
  * **Khối `default`:** Được kích hoạt khi giá trị biểu thức không khớp với bất kỳ giá trị `case` nào.

### 6.2. Các Cấu Trúc Vòng Lặp Cổ Điển (Classic Loops)
* **Vòng lặp `while`:** Kiểm tra điều kiện lặp ở đầu vòng lặp. Nếu điều kiện sai ngay từ đầu, thân vòng lặp không được thực hiện lần nào:
  ```java
  while (condition) {
      // statements;
  }
  ```
* **Vòng lặp `do...while`:** Thực thi khối lệnh bên trong thân vòng lặp trước rồi mới kiểm tra điều kiện lặp. Đảm bảo thân vòng lặp luôn được **thực thi ít nhất 1 lần**. Đây là cấu trúc được sử dụng trong các menu console nhập liệu của các case study:
  ```java
  do {
      // hien thi menu va nhan lua chon nguoi dung
  } while (choice != exitOption);
  ```
* **Vòng lặp `for` truyền thống:** Dùng khi biết trước số bước lặp, quản lý qua biến chỉ mục `i` từ `0` đến `length - 1`.

### 6.3. Vòng Lặp Nâng Cao (Enhanced for / For-each) & Tính Chất Chỉ Đọc
Slide *An enhanced for loop* và mã nguồn minh họa `Chao.java` trình bày cú pháp và nguyên lý:
* **Cú pháp:** `for (Type element : collectionOrArray) { ... }`.
* **Cơ chế duyệt:** Vòng lặp tự động lấy tuần tự từng phần tử từ mảng gán vào biến tạm `element` mà không cần quản lý biến đếm chỉ mục.
* **Đặc tính Chỉ đọc (Read-only):**
  * Xét đoạn mã trong slide `Chao.java`:
    ```java
    int a[] = {1, 2, 3, 4, 5};
    for (int x : a) {
        x += 10;
    }
    ```
  * Lệnh `x += 10;` chỉ thực hiện cộng giá trị trên bản sao của biến tạm `x` nằm trên Stack. Khi vòng lặp kết thúc, các phần tử trong mảng gốc `a` trên Heap **vẫn giữ nguyên giá trị ban đầu là `1, 2, 3, 4, 5`**.
  * **Quy tắc:** Enhanced for chỉ dùng để đọc và duyệt mảng/tập hợp; không thể dùng nó để ghi đè hoặc thay đổi giá trị của phần tử mảng nguyên thủy.

### 6.4. Chuẩn Mực Phong Cách Viết Mã (Elements of Java Style)
Slide *Elements of Java Style* quy định 4 nguyên tắc định dạng mã nguồn chuẩn mực:
1. **Thụt lề hợp lý (Proper Use of Indentation):** Các câu lệnh bên trong một khối mã (`{ ... }`) phải được thụt vào một khoảng tab/khoảng trắng cố định so với dòng bắt đầu khối chứa nó.
2. **Quy tắc đặt dấu ngoặc nhọn (Placement of Braces):**
   * Dấu ngoặc nhọn mở `{` phải được đặt ở **cuối dòng lệnh bắt đầu khối**.
   * Dấu ngoặc nhọn đóng `}` phải nằm trên **một dòng riêng biệt**, thẳng hàng theo phương thẳng đứng với ký tự đầu tiên của dòng bắt đầu khối.
3. **Sử dụng chú thích khôn ngoan (Use Comments Wisely):** Chú thích ngắn gọn, rõ ràng, tập trung giải thích lý do thiết kế và mục đích thuật toán thay vì mô tả lại cú pháp hiển nhiên.
4. **Đặt tên biến có tính mô tả (Descriptive Variable Names):** Tên định danh phải phản ánh chính xác mục đích và kiểu dữ liệu mà nó đại diện, tránh đặt các ký tự vô nghĩa.

### 6.5. Trọn Bộ 5 Bài Tập Tự Luyện Slot 5 & Lời Giải Chi Tiết

#### Bài tập 5.1: Chuyển đổi cấu trúc if-else sang toán tử 3 ngôi
* **Đề bài:** Hãy viết lại đoạn mã kiểm tra số chẵn lẻ sau bằng toán tử điều kiện 3 ngôi `?:` trên một dòng duy nhất:
  ```java
  String status;
  if (n % 2 == 0) {
      status = "So chan";
  } else {
      status = "So le";
  }
  ```
* **Lời giải chi tiết:**
  ```java
  String status = (n % 2 == 0) ? "So chan" : "So le";
  ```
  Biểu thức kiểm tra `(n % 2 == 0)`, nếu đúng trả về chuỗi `"So chan"`, nếu sai trả về `"So le"`.

#### Bài tập 5.2: Phân tích hiện tượng Fall-through trong switch-case
* **Đề bài:** Đoạn mã sau in ra kết quả gì khi `x = 1`? Nêu nguyên nhân và cách khắc phục:
  ```java
  int x = 1;
  switch (x) {
      case 1: System.out.print("A ");
      case 2: System.out.print("B ");
      default: System.out.print("C ");
  }
  ```
* **Lời giải chi tiết:**
  * **Kết quả in ra:** `A B C `
  * **Nguyên nhân:** Do sau lệnh in của `case 1` và `case 2` không có câu lệnh `break;`. Khi điều kiện `case 1` khớp, luồng thực thi bị rơi tự do (fall-through) và chạy liên tục các lệnh của `case 2` và `default`.
  * **Cách khắc phục:** Bổ sung `break;` vào cuối mỗi khối `case`:
    ```java
    switch (x) {
        case 1: System.out.print("A "); break;
        case 2: System.out.print("B "); break;
        default: System.out.print("C ");
    }
    ```

#### Bài tập 5.3: Ứng dụng vòng lặp do-while xây dựng menu
* **Đề bài:** Viết đoạn chương trình Java sử dụng vòng lặp `do-while` để hiển thị menu gồm 2 lựa chọn: `1. Tiep tuc` và `2. Thoat`. Chương trình yêu cầu người dùng nhập lựa chọn qua `Scanner` và tiếp tục lặp lại menu nếu người dùng chọn `1`, chỉ dừng lại khi người dùng nhập `2`.
* **Lời giải chi tiết:**
  ```java
  java.util.Scanner sc = new java.util.Scanner(System.in);
  int choice;
  do {
      System.out.println("--- MENU ---");
      System.out.println("1. Tiep tuc");
      System.out.println("2. Thoat");
      System.out.print("Moi ban chon (1-2): ");
      choice = sc.nextInt();
  } while (choice != 2);
  System.out.println("Chuong trinh da ket thuc!");
  ```

#### Bài tập 5.4: Chứng minh tính chất chỉ đọc của vòng lặp For-each
* **Đề bài:** Cho mảng `double[] prices = {100.0, 200.0, 300.0};`. Nếu thực hiện:
  ```java
  for (double p : prices) {
      p = p * 0.9; // giam gia 10%
  }
  System.out.println("Phan tu dau tien: " + prices[0]);
  ```
  Giá trị in ra là `100.0` hay `90.0`? Hãy giải thích cơ chế phân bổ vùng nhớ Stack và Heap.
* **Lời giải chi tiết:**
  * **Kết quả in ra:** `Phan tu dau tien: 100.0`
  * **Giải thích cơ chế bộ nhớ:**
    * Mảng `prices` là một đối tượng thực tế nằm trên vùng nhớ Heap.
    * Khi vòng lặp for-each thực thi, ở mỗi bước lặp nó tạo ra một biến cục bộ `p` nằm trên ngăn xếp Stack và sao chép giá trị của phần tử mảng vào biến `p`.
    * Phép tính `p = p * 0.9` chỉ cập nhật giá trị của biến cục bộ `p` trên Stack rồi bị hủy khi sang bước lặp tiếp theo, hoàn toàn không can thiệp hay ghi đè vào các ô nhớ của mảng `prices` trên Heap.

#### Bài tập 5.5: Tuân thủ quy chuẩn Elements of Java Style
* **Đề bài:** Đoạn mã sau vi phạm các quy tắc nào trong chuẩn mực phong cách viết mã của tài liệu bài giảng? Hãy viết lại cho đúng chuẩn:
  ```java
  public class TestStyle
  {
  public static void main(String[] args)
  {
  int x=10;
  if(x>5)
  {
  System.out.println(x);
  }
  }
  }
  ```
* **Lời giải chi tiết:**
  * **Các điểm vi phạm:**
    1. Dấu ngoặc nhọn mở `{` bị đặt xuống dòng mới thay vì nằm ở cuối dòng bắt đầu khối.
    2. Không thực hiện thụt lề (Indentation) cho các khối lệnh con bên trong class, phương thức và lệnh `if`.
    3. Thiếu khoảng trắng phân cách toán tử gán và toán tử so sánh.
  * **Viết lại chuẩn mực:**
    ```java
    public class TestStyle {
        public static void main(String[] args) {
            int x = 10;
            if (x > 5) {
                System.out.println(x);
            }
        }
    }
    ```

---

## 7. Bảng Tổng Hợp Kiến Thức Cốt Lõi Giai Đoạn 1

Dưới đây là bảng đối chiếu tổng hợp các khái niệm then chốt của 5 slot đầu tiên:

| Slot | Chủ đề cốt lõi | Slide bài giảng | Khái niệm then chốt | Lưu ý kỹ thuật |
| :---: | :--- | :--- | :--- | :--- |
| **Slot 1** | Tổng quan công nghệ & Kiến trúc | `Get Start.pptx`, `Introduction.pptx` | WORA, Bytecode, JVM, Java API, Oak | Bytecode độc lập nền tảng, JVM phụ thuộc nền tảng |
| **Slot 2** | Cài đặt môi trường & Chương trình đầu | `Download & Install JDK & NetBeans 8.pptx`, `Get Start.pptx` | JDK, NetBeans, Path (`bin`), CLASSPATH (`.;`) | Bỏ tick Create Main Class; phím tắt `Shift + F6` |
| **Slot 3** | Cấu trúc chương trình & Dòng lệnh | `Get Start.pptx` | Comments, hàm `main`, `javac`, `java`, file `.bat` | Lệnh `java` nhận tên lớp, không nhận đuôi `.class` |
| **Slot 4** | Kiểu dữ liệu, Biến, Toán tử & Bộ nhớ | `Learning the Java Language.pptx` | 8 kiểu nguyên thủy, tham chiếu, mảng, `>>>`, ép kiểu | Stack lưu nguyên thủy, Heap lưu đối tượng; rủi ro cắt bit |
| **Slot 5** | Cấu trúc điều khiển, Vòng lặp & Style | `Learning the Java Language.pptx`, `Java Tutorial` | `switch-case`, `break`, `do-while`, for-each, Indentation | For-each chỉ đọc (Read-only); dấu `{` ở cuối dòng |

---

## 8. Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Java Basics Summary](../java/basis/java-basic-questions-01.md) · [Tổng quan Từ khóa Java](../java/basis/java-keyword-summary.md) · [JVM Intro](../java/jvm/jvm-intro.md)
- **Slide & PDF gốc offline:** [Get Start.pdf](/media/pro192/resources/Get%20Start.pdf) · [Learning the Java Language.pdf](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) · [Download & Install JDK & NetBeans 8.pdf](/media/pro192/resources/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pdf)
