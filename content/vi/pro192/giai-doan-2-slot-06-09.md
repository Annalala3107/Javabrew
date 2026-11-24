---
title: "Giai đoạn 2 (Slot 6–9): Quản lý Bộ nhớ, Wrapper/Math & Chuỗi String/Scanner"
category: PRO192
slots: "Slot 6 – 9"
lang: vi
description: "Kiến trúc bộ nhớ Stack/Heap/Metaspace, cơ chế GC, Wrapper Classes, Autoboxing/Unboxing, Math, String Pool, StringBuilder và Scanner."
---

# GIÁO TRÌNH GIAI ĐOẠN 2: BẢN CHẤT QUẢN LÝ BỘ NHỚ, SỐ & CHUỖI KÝ TỰ (SLOT 6 – 9)

Tài liệu này hệ thống hóa toàn bộ kiến thức nền tảng chuyên sâu của Giai đoạn 2 trong lộ trình 30 ngày làm chủ ngôn ngữ lập trình Java từ con số 0. Nội dung được biên soạn chuẩn xác theo tài liệu bài giảng gốc của học phần (`Memory Management in Java.pptx`, `Numbers and Strings.pptx`), giúp người học nắm vững bản chất kiến trúc bộ nhớ máy ảo Java (JVM), cơ chế vận hành của ngăn xếp và bộ nhớ đống, thuật toán cấp phát và thu hồi vùng nhớ tự động, cùng kỹ thuật xử lý số học và chuỗi ký tự tối ưu hiệu năng.

Mỗi slot học tập đều có chỉ mục tài liệu trỏ trực tiếp vào từng slide bài giảng tương ứng, kèm theo trọn bộ 5 bài tập tự luyện và lời giải chi tiết, giúp người học vừa nắm chắc lý thuyết vừa củng cố kỹ năng lập trình thực tế.

---

## 1. Slot 6: Kiến trúc bộ nhớ JVM (Stack, Static Heap & Dynamic Heap)
* **Tài liệu học tập tương ứng:** Bộ slide `Memory Management in Java.pptx` (từ slide *Review: In C* đến slide *Heap structure in Java / Static heap & Dynamic heap*).

### 1.1. So sánh mô hình quản lý bộ nhớ giữa C và Java
Trong ngôn ngữ lập trình C, bộ nhớ chương trình được chia thành 4 phân vùng chính:
* **Data segment:** Chứa dữ liệu toàn cục (global data).
* **Code segment:** Chứa các chỉ thị lệnh thực thi của chương trình.
* **Stack:** Cấp phát cho dữ liệu cục bộ của hàm khi hàm được gọi.
* **Heap:** Cấp phát dữ liệu động thông qua các hàm như `malloc()`, `calloc()`.

Lập trình viên C có trách nhiệm phải quản lý vùng nhớ Heap một cách tường minh. Khi không còn sử dụng một vùng nhớ đã cấp phát, lập trình viên bắt buộc phải tự gọi hàm `free()` để giải phóng. Nếu quên thao tác này, hệ thống sẽ rơi vào tình trạng rò rỉ bộ nhớ (Memory Leak), làm cạn kiệt tài nguyên máy tính.

Ngược lại, trong nền tảng Java, lập trình viên hoàn toàn được giải phóng khỏi việc quản lý bộ nhớ đống thủ công nhờ sự hỗ trợ của Bộ dọn rác tự động (Garbage Collector - GC). Khi cần tạo dữ liệu mới, lập trình viên chỉ cần sử dụng từ khóa `new`. Máy ảo Java (JVM) sẽ tự động theo dõi, phân bổ và thu hồi vùng nhớ. Bộ nhớ của ứng dụng Java được JVM tổ chức thành hai phân vùng cơ bản: **Stack** và **Heap** (bao gồm Static Heap và Dynamic Heap).

### 1.2. Vùng nhớ ngăn xếp (Stack Memory)

![Phân vùng bộ nhớ Stack và Heap](/media/pro192/images/memory.png)

Vùng nhớ Stack vận hành theo nguyên lý Vào sau, Ra trước (LIFO - Last In, First Out) nhằm quản lý luồng thực thi của các phương thức:
* **Dữ liệu cục bộ (Local data):** Chứa giá trị trả về (return data), các tham số truyền vào phương thức và các biến cục bộ được khai báo bên trong thân phương thức.
* **Biến kiểu dữ liệu nguyên thủy (Primitive variables):** Giá trị cụ thể của các biến như `int`, `double`, `boolean`, `char` được lưu trữ trực tiếp ngay tại ô nhớ trên Stack.
* **Biến tham chiếu (Reference variables):** Bản thân biến tham chiếu (ví dụ `String s`, `Student st`) được lưu trên Stack, nhưng giá trị của nó là địa chỉ con trỏ trỏ đến đối tượng thực tế đang cư trú trên Heap.
* **Vòng đời (Lifetime):** Biến cục bộ được cấp phát trên Stack khi phương thức được gọi và lập tức bị hủy bỏ (discarded) khi phương thức kết thúc và thoát ra ngoài.

### 1.3. Vùng nhớ đống tĩnh (Static Heap)
Static Heap được khởi tạo ngay khi các lớp được trình nạp lớp (Class Loader) của JVM tải vào bộ nhớ, trước khi bất kỳ đối tượng nào của lớp được sinh ra:
* **Đặc tính bất biến (Invariable):** Cấu trúc khai báo lớp tồn tại cố định suốt vòng đời của ứng dụng, do đó vùng nhớ này không cần áp dụng dọn rác (Garbage collection is not needed).
* **Thành phần lưu trữ:**
  1. **Khai báo lớp (Class declarations):** Định nghĩa cấu trúc, danh sách thuộc tính và phương thức của lớp.
  2. **Biến tĩnh và hằng số (Static fields / Constants):** Những biến được khai báo với từ khóa `static`, chỉ chiếm một ô nhớ duy nhất dùng chung cho toàn bộ các đối tượng của lớp.
  3. **Bảng phương thức (Method table):** Bảng danh mục lưu ánh xạ giữa tên phương thức và địa chỉ vùng nhớ chứa mã bytecode thực thi của phương thức đó.
  4. **Mã thực thi của phương thức (Code of methods):** Đoạn mã bytecode thực tế của toàn bộ các phương thức nằm tập trung tại Static Heap.

### 1.4. Vùng nhớ đống động (Dynamic Heap)
Dynamic Heap là phân vùng bộ nhớ lưu trữ toàn bộ các đối tượng (instances) được khởi tạo trong thời gian chạy (Runtime) thông qua toán tử `new`. Dynamic Heap được chia thành hai phân khu (Sections) có mối liên kết chặt chẽ:
* **Section 1 (Vùng dữ liệu đối tượng - Objects Data Area):** 
  * Chứa giá trị dữ liệu thực tế của các thuộc tính thể hiện (Instance variables / Non-static fields) của từng đối tượng cụ thể.
  * Khi một đối tượng được tạo ra, JVM tự động bổ sung một trường tham chiếu trỏ ngược về khai báo lớp của nó.
  * Đây là phân khu trực tiếp chịu sự quản lý và thu hồi của Bộ dọn rác tự động khi đối tượng không còn được sử dụng.
* **Section 2 (Vùng quan hệ Đối tượng - Phương thức - Relations Object-Method):**
  * Lưu trữ các bản ghi liên kết giữa đối tượng cụ thể ở Section 1 và phương thức phù hợp trong Static Heap.
  * Mỗi bản ghi gồm hai tham chiếu: địa chỉ của đối tượng và tên phương thức cần gọi.

Quy trình thực thi một lời gọi phương thức từ đối tượng (ví dụ `obj1.m1()`):
1. Chương trình thông qua biến `obj1` trên Stack truy xuất đến địa chỉ đối tượng trong Section 1.
2. Tra cứu Section 2 để tìm bản ghi liên kết tương ứng với phương thức `m1`.
3. Từ Section 2, lần theo địa chỉ tham chiếu đến bảng phương thức (Method table) của lớp trong Static Heap.
4. Lấy địa chỉ điểm vào của phương thức `m1` từ Method table.
5. Nạp và thực thi đoạn mã bytecode của `m1()` trong Static Heap.

> [!WARNING]
> **Modern JVM Note (Đính chính kỹ thuật từ JavaGuide — giữ thuật ngữ slide để đi thi, dùng thuật ngữ chuẩn khi đi làm):**
> Thuật ngữ **"Static Heap"** và **"Dynamic Heap"** trong slide `Memory Management in Java.pptx` là cách mô hình hóa đơn giản hóa từ giáo trình C++/Java cũ. Trên **HotSpot JVM (Java 8–21+)** thực tế:
> - Siêu dữ liệu lớp (Class metadata) và bytecode nằm ở **Metaspace** (Native Memory, thay cho PermGen từ Java 8).
> - Toàn bộ đối tượng (`new`), mảng và biến `static` (gắn với đối tượng `java.lang.Class` tương ứng) nằm trong **JVM Heap**.
> - Khung gọi hàm & biến cục bộ nằm trên **JVM Stack** riêng của từng Thread.
> - Đọc chi tiết chuẩn hiện đại tại: [Cấu trúc Vùng nhớ Runtime JVM (JavaGuide)](../java/jvm/memory-area.md).

![Sơ đồ cấp phát Stack và Heap trong Java](/media/pro192/images/allocation.png)

![Mô hình phân chia vùng nhớ trong bộ nhớ Java](/media/pro192/images/memory2.png)

---

### 1.5. Bộ 5 bài tập tự luyện Slot 6 (Kèm lời giải chi tiết)

#### Bài tập 6.1: Phân bổ dữ liệu giữa Stack và Section 1 của Dynamic Heap
* **Đề bài:** Xét đoạn mã sau:
  ```java
  public void test() {
      int age = 20;
      String name = new String("Java");
  }
  ```
  Hãy chỉ rõ giá trị `20`, biến `age`, biến `name` và chuỗi đối tượng `"Java"` nằm ở phân vùng bộ nhớ nào (Stack hay Dynamic Heap)?
* **Đáp án & Lời giải chi tiết:**
  * Biến `age` và giá trị nguyên thủy `20`: Nằm trực tiếp trên **Stack** (thuộc khung ngăn xếp của phương thức `test`).
  * Biến `name`: Là một biến tham chiếu, bản thân nó nằm trên **Stack** và lưu địa chỉ vùng nhớ tham chiếu.
  * Đối tượng chuỗi `"Java"`: Được tạo ra bởi toán tử `new`, nằm trên **Dynamic Heap** (cụ thể là Section 1). Biến `name` trên Stack trỏ đến ô nhớ của đối tượng này trên Heap.

#### Bài tập 6.2: Bản chất của biến tĩnh (`static`) trong kiến trúc bộ nhớ
* **Đề bài:** Biến được khai báo với từ khóa `static` (ví dụ `public static int count = 0;`) được cấp phát trên Stack, Static Heap hay Dynamic Heap? Nếu chúng ta tạo ra 1.000 đối tượng của lớp chứa biến này thì có bao nhiêu biến `count` được tạo ra trong bộ nhớ?
* **Đáp án & Lời giải chi tiết:**
  * Biến `static` được lưu trữ tại **Static Heap** ngay khi lớp được JVM nạp vào bộ nhớ.
  * Dù tạo ra 1.000 đối tượng (hay bất kỳ số lượng nào), **chỉ có duy nhất 1 bản sao** của biến `count` tồn tại trong Static Heap. Toàn bộ 1.000 đối tượng đó đều chia sẻ chung ô nhớ này.

#### Bài tập 6.3: Cơ chế gọi phương thức và bảng Method Table
* **Đề bài:** Theo cấu trúc trong slide `Memory Management in Java.pptx`, khi một đối tượng gọi phương thức `obj.display()`, mã thực thi của phương thức `display()` được lấy trực tiếp từ Section 1 của Dynamic Heap hay từ đâu?
* **Đáp án & Lời giải chi tiết:**
  * Mã thực thi của phương thức **không nằm trong Section 1** của Dynamic Heap (Section 1 chỉ lưu giá trị các biến thể hiện của đối tượng).
  * Đối tượng thông qua **Section 2 (Object-Method Linkage Area)** truy xuất con trỏ liên kết trỏ về **bảng phương thức (Method table) nằm trong Static Heap** để nạp và thực thi đoạn mã bytecode của `display()`.

#### Bài tập 6.4: Cơ chế giải phóng ngăn xếp khi phương thức kết thúc
* **Đề bài:** Điều gì xảy ra với các biến cục bộ nằm trên Stack khi phương thức chứa chúng thực thi xong và gặp lệnh `return`? Các đối tượng trên Heap mà các biến đó từng trỏ tới có lập tức biến mất ngay thời điểm đó không?
* **Đáp án & Lời giải chi tiết:**
  * Khi phương thức kết thúc, toàn bộ khung ngăn xếp (Stack Frame) của phương thức đó lập tức bị **thu hồi (pop khỏi Stack)**, các biến cục bộ và biến tham chiếu trên Stack biến mất ngay lập tức.
  * Tuy nhiên, các đối tượng trên Dynamic Heap mà các biến tham chiếu từng trỏ tới **không bị biến mất ngay lập tức**. Chúng chỉ trở thành đối tượng không còn tham chiếu và sẽ được thu hồi sau đó bởi Bộ dọn rác tự động (Garbage Collector).

#### Bài tập 6.5: Hiện tượng tràn bộ nhớ Stack (StackOverflowError)
* **Đề bài:** Đoạn mã đệ quy vô hạn sau sẽ gây ra lỗi gì trong hệ thống bộ nhớ Java? Tại sao?
  ```java
  public class InfiniteCall {
      public static void recurse() {
          recurse();
      }
      public static void main(String[] args) {
          recurse();
      }
  }
  ```
* **Đáp án & Lời giải chi tiết:**
  * **Lỗi runtime:** Ném ra lỗi `java.lang.StackOverflowError`.
  * **Giải thích cơ chế:** Mỗi lần phương thức `recurse()` được gọi, một khung ngăn xếp mới được đẩy vào Stack. Do đệ quy không có điều kiện dừng, các khung ngăn xếp liên tục được xếp chồng lên nhau mà không có khung nào được giải phóng, dẫn đến việc vùng nhớ **Stack bị cạn kiệt dung lượng** được cấp phát bởi JVM.

---

## 2. Slot 7: Cơ chế cấp phát bộ nhớ & Bộ dọn rác tự động (Garbage Collection)
* **Tài liệu học tập tương ứng:** Bộ slide `Memory Management in Java.pptx` (từ slide *How Java heap is managed?* đến slide *Garbage Collection*).

### 2.1. Quản lý Heap bằng danh sách khối nhớ (Free Block List & Allocated Block List)
Hệ thống quản lý bộ nhớ của JVM không coi Heap là một khối liền mạch cố định, mà liên tục theo dõi tình trạng sử dụng thông qua hai danh sách liên kết:
* **Free block list (Danh sách khối rỗng):** Quản lý các phân đoạn ô nhớ chưa được sử dụng hoặc vừa được thu hồi, sẵn sàng cấp phát cho đối tượng mới.
* **Allocated block list (Danh sách khối đã cấp phát):** Quản lý các phân đoạn ô nhớ đang lưu trữ dữ liệu của các đối tượng đang hoạt động.

Khi chương trình Java vừa khởi động, toàn bộ không gian của Heap là một khối tự do duy nhất thuộc `Free block list`. Qua nhiều lần cấp phát (`new`) và giải phóng dữ liệu trong suốt quá trình chạy, các khối nhớ trống không còn liền kề nhau mà bị phân tán thành nhiều mảnh nhỏ nằm rải rác giữa các khối đang sử dụng, gây ra hiện tượng **phân mảnh bộ nhớ (Memory Fragmentation)**.

### 2.2. Thuật toán cấp phát First-Fit & Cơ chế dồn bộ nhớ (Compacting Memory)
* **Giải thuật First-Fit (Khớp đầu tiên):** Khi có lệnh khởi tạo đối tượng mới, JVM quét `Free block list` từ đầu đến cuối và chọn ngay **khối nhớ trống đầu tiên có kích thước đủ lớn** để chứa vừa dữ liệu của đối tượng đó.
* **Cơ chế Dồn bộ nhớ (Compact Memory):** Nếu tổng dung lượng trống trên Heap vẫn còn đủ, nhưng không tìm thấy bất kỳ khối đơn lẻ nào đủ lớn để chứa đối tượng mới (do bị phân mảnh), bộ quản lý bộ nhớ Java sẽ thực hiện thao tác dồn bộ nhớ:
  1. Di chuyển các khối nhớ đang sử dụng dồn sát lại với nhau về một phía của Heap.
  2. Gộp toàn bộ các mảnh bộ nhớ trống rời rạc lại thành một khối rỗng liên tục có kích thước lớn hơn, sẵn sàng đáp ứng yêu cầu cấp phát.

### 2.3. Định nghĩa "Dữ liệu rác" (Garbage) trong Java
Một vùng nhớ đối tượng trên Heap bị coi là "Rác" (Garbage / Useless data) khi chương trình không còn bất kỳ biến tham chiếu nào có thể chạm tới nó nữa. Bài giảng nêu rõ hai trường hợp điển hình:
1. **Đối tượng bị vượt quá phạm vi hoạt động (Out of scope):** Khi một đối tượng được tạo bên trong một khối lệnh (ví dụ khối `if` hay thân phương thức), khi luồng thực thi đi ra ngoài dấu ngoặc nhọn đóng `}`, biến tham chiếu trên Stack bị hủy bỏ, đối tượng trên Heap bị mất tham chiếu và trở thành rác.
2. **Gán biến tham chiếu về `null`:** Khi lập trình viên chủ động gán `obj = null;`, mối liên kết giữa biến tham chiếu trên Stack và đối tượng trên Heap bị cắt đứt. Ô nhớ đối tượng đó trở thành dữ liệu rác.

### 2.4. Bản chất hoạt động của Bộ dọn rác tự động (Garbage Collector - GC)

> [!WARNING]
> **Modern JVM Note (Đính chính về thời điểm chạy Garbage Collector):**
> Slide trường ghi *"GC chỉ thực sự chạy khi Heap cạn kiệt (exhausted)"*. Thực tế trên **G1GC / ZGC / Parallel GC**, **Minor GC** tự động kích hoạt ngay khi vùng **Eden** đầy (trong khi tổng Heap còn rất nhiều dung lượng), hoặc theo ngưỡng tỷ lệ phân bổ (*InitiatingHeapOccupancyPercent*). Ngoài ra `Compacting` là một phần của chu trình *Mark-Sweep-Compact* / *Evacuation* trong GC hiện đại.
> - Đọc sâu hơn tại: [Chi tiết Garbage Collection trong JVM (JavaGuide)](../java/jvm/jvm-garbage-collection.md).

![Minh họa quản lý khối nhớ Heap và thu hồi rác](/media/pro192/images/memory3.png)

* **Độ ưu tiên thấp nhất (Lowest Priority):** Garbage Collector chạy ngầm như một tiến trình luồng (daemon thread) có độ ưu tiên thấp nhất trong hệ thống nhằm không gây ảnh hưởng đến hiệu năng của các tác vụ chính.
* **Thời điểm kích hoạt:** Garbage Collector chỉ thực sự chạy quét và thu hồi khi bộ nhớ Heap của hệ thống bị cạn kiệt (exhausted). Nếu bộ nhớ RAM còn dư dả, GC có thể sẽ không chạy trong suốt thời gian thực thi của một chương trình ngắn.
* **Quyền kiểm soát:** Garbage Collector hoàn toàn do máy ảo JVM điều phối tự động. Lập trình viên không thể ép buộc GC chạy ngay lập tức. Lệnh `System.gc()` chỉ gửi một lời đề nghị tới JVM, quyền quyết định chạy vào thời điểm nào hoàn toàn thuộc về JVM.

---

### 2.5. Bộ 5 bài tập tự luyện Slot 7 (Kèm lời giải chi tiết)

#### Bài tập 7.1: Hai danh sách quản lý bộ nhớ đống của JVM
* **Đề bài:** Hệ thống quản lý bộ nhớ đống (Heap) của Java sử dụng hai danh sách nào để theo dõi việc sử dụng RAM? Trạng thái ban đầu của danh sách đó khi chương trình vừa khởi chạy như thế nào?
* **Đáp án & Lời giải chi tiết:**
  * Hai danh sách quản lý gồm: **Free block list** (danh sách khối rỗng) và **Allocated block list** (danh sách khối đã cấp phát).
  * Trạng thái ban đầu: Toàn bộ dung lượng vùng nhớ Heap là một khối rỗng duy nhất thuộc về **Free block list**, trong khi `Allocated block list` hoàn toàn trống rỗng.

#### Bài tập 7.2: Giải thuật First-Fit và hiện tượng phân mảnh bộ nhớ
* **Đề bài:** Giải thích cơ chế cấp phát bộ nhớ theo nguyên tắc **First-Fit** trong Java. Hiện tượng gì sẽ xảy ra sau nhiều lần cấp phát và giải phóng vùng nhớ liên tục?
* **Đáp án & Lời giải chi tiết:**
  * **Cơ chế First-Fit:** Khi có yêu cầu cấp phát bộ nhớ cho đối tượng mới, JVM duyệt danh sách `Free block list` và lấy ngay khối nhớ rỗng đầu tiên có kích thước đủ lớn để cấp phát.
  * **Hiện tượng xảy ra:** Sau nhiều chu kỳ cấp phát và thu hồi, bộ nhớ rơi vào tình trạng **phân mảnh (memory fragmentation)**, các khối nhớ trống không còn nằm liền kề nhau mà bị chia cắt thành nhiều khoảng trống nhỏ nằm rải rác giữa các khối đang sử dụng.

#### Bài tập 7.3: Cơ chế Dồn bộ nhớ (Compacting Memory)
* **Đề bài:** Khi tổng dung lượng trống trên Heap vẫn còn đủ nhưng không tìm thấy bất kỳ khối rỗng đơn lẻ nào đủ lớn để chứa đối tượng mới, JVM sẽ xử lý như thế nào?
* **Đáp án & Lời giải chi tiết:**
  * Bộ quản lý bộ nhớ Java sẽ thực hiện cơ chế **Dồn bộ nhớ (Compact memory)**: Di chuyển các khối nhớ đang chứa đối tượng dồn sát lại với nhau, dồn toàn bộ các phân mảnh nhớ trống rời rạc về một khu vực để tạo thành một khối trống liên tục có kích thước lớn hơn, đáp ứng yêu cầu cấp phát mới.

#### Bài tập 7.4: Nhận diện đối tượng trở thành Rác (Garbage)
* **Đề bài:** Xét đoạn mã sau:
  ```java
  public class TestGC {
      public static void main(String[] args) {
          String s1 = new String("Java");
          String s2 = new String("Python");
          s1 = s2;
          s2 = null;
      }
  }
  ```
  Sau khi dòng lệnh `s2 = null;` thực thi xong, có đối tượng nào trên Heap trở thành "rác" (Garbage) chưa? Giải thích vì sao.
* **Đáp án & Lời giải chi tiết:**
  * **Đối tượng trở thành rác:** Đối tượng `"Java"` (do lệnh `new String("Java")` tạo ra) chính thức trở thành rác.
  * **Giải thích cơ chế tham chiếu:**
    1. Ban đầu `s1` trỏ đến `"Java"`, `s2` trỏ đến `"Python"`.
    2. Khi gán `s1 = s2;`, biến `s1` đổi hướng trỏ sang đối tượng `"Python"`. Lúc này đối tượng `"Java"` hoàn toàn mất dấu tham chiếu, không còn biến nào trỏ đến nó nữa, trở thành **Rác**.
    3. Khi gán `s2 = null;`, chỉ có biến `s2` ngắt liên kết, nhưng đối tượng `"Python"` vẫn còn biến `s1` trỏ đến nên `"Python"` **vẫn còn sống** và không phải là rác.

#### Bài tập 7.5: Độ ưu tiên và quyền kiểm soát Garbage Collector
* **Đề bài:** Tại sao bài giảng lại nhấn mạnh rằng Garbage Collector có **độ ưu tiên thấp nhất (lowest priority)**? Lập trình viên có thể ép buộc Garbage Collector thu hồi bộ nhớ ngay lập tức bằng lệnh code nào không?
* **Đáp án & Lời giải chi tiết:**
  * **Lý do có độ ưu tiên thấp nhất:** Để bảo đảm hiệu năng tối đa cho các luồng xử lý nghiệp vụ chính của chương trình. Garbage Collector chỉ được kích hoạt chạy khi tài nguyên bộ nhớ đống (Heap) của hệ thống rơi vào trạng thái cạn kiệt (exhausted).
  * **Khả năng kiểm soát:** Lập trình viên **không thể ép buộc GC chạy ngay lập tức**. Việc gọi phương thức `System.gc()` chỉ gửi tín hiệu yêu cầu đến JVM, quyền quyết định khi nào quét dọn hoàn toàn do máy ảo JVM tự động quyết định.

---

## 3. Slot 8: Lớp bao bọc (Wrapper Classes), Autoboxing/Unboxing & Lớp toán học Math
* **Tài liệu học tập tương ứng:** Bộ slide `Numbers and Strings.pptx` (từ slide *Working with Numbers* đến slide *Characters*).

### 3.1. Nhu cầu sử dụng Lớp bao bọc (Wrapper Classes)
Các kiểu dữ liệu nguyên thủy (`int`, `double`, `char`,...) trong Java không phải là đối tượng và không thuộc cây phân cấp lớp kế thừa (`Object hierarchy`). Chúng được truyền theo cơ chế tham trị và không thể lưu trữ trực tiếp trong các cấu trúc tập hợp hướng đối tượng (như `ArrayList`, `Vector`, `HashMap`) vốn chỉ chấp nhận các đối tượng.

Để giải quyết vấn đề này, Java cung cấp các lớp bao bọc (Wrapper Classes) nằm trong gói `java.lang` nhằm "bọc" một giá trị nguyên thủy bên trong một thực thể đối tượng.

Ba mục đích chính của Wrapper Classes:
1. So sánh các giá trị dưới dạng đối tượng (Compare values in objects).
2. Chuyển đổi qua lại giữa các kiểu dữ liệu khác nhau (Convert values from one data type to another).
3. Kiểm tra và xác định kiểu dữ liệu của một giá trị (Check the data type of a value).

### 3.2. Cây phân cấp các lớp số (The Number Class Hierarchy)
Tất cả các lớp bao bọc số nguyên và số thực đều kế thừa từ lớp trừu tượng `java.lang.Number`:
* `java.lang.Object`
  * `java.lang.Boolean`
  * `java.lang.Character`
  * `java.lang.Number` (abstract class)
    * `Byte`
    * `Short`
    * `Integer`
    * `Long`
    * `Float`
    * `Double`

Đặc tính kỹ thuật cốt lõi:
* Tất cả các lớp Wrapper đều được khai báo với từ khóa `public final class`. Do có từ khóa `final`, không thể tạo lớp con kế thừa từ Wrapper class.
* **Tính bất biến (Immutable):** Các đối tượng Wrapper không thể bị thay đổi giá trị sau khi được khởi tạo vì các lớp này không cài đặt phương thức Setter.
* Mọi lớp con của `Number` đều kế thừa các phương thức trích xuất giá trị nguyên thủy: `byteValue()`, `shortValue()`, `intValue()`, `longValue()`, `floatValue()`, `doubleValue()`.

### 3.3. Cơ chế Autoboxing và Unboxing
* **Autoboxing (Tự động đóng gói):** Quá trình máy ảo JVM tự động chuyển đổi một giá trị nguyên thủy thành một đối tượng thuộc lớp Wrapper tương ứng:
  ```java
  int n = 7;
  Integer intObj = n; // Autoboxing
  ```
* **Unboxing (Tự động mở gói):** Quá trình máy ảo tự động lấy giá trị nguyên thủy được bọc bên trong một đối tượng Wrapper:
  ```java
  int y = intObj * 2; // Unboxing intObj thành int để nhân với 2
  ```
* **Chuyển đổi chuỗi thành số (Parsing methods):**
  * `int val = Integer.parseInt("1234");` chuyển đổi chuỗi thành số nguyên hệ thập phân.
  * `int hexVal = Integer.parseInt("1A", 16);` chuyển đổi chuỗi hệ cơ số 16 thành số nguyên thập phân `26`.

### 3.4. Lớp toán học `java.lang.Math`
Lớp `Math` cung cấp các hằng số toán học và các phương thức tĩnh phục vụ tính toán:
* **Hằng số tĩnh:** `Math.PI` và `Math.E`.
* **Phương thức làm tròn:**
  * `Math.ceil(d)`: Làm tròn lên số nguyên nhỏ nhất lớn hơn hoặc bằng `d`.
  * `Math.floor(d)`: Làm tròn xuống số nguyên lớn nhất nhỏ hơn hoặc bằng `d`.
* **Phương thức số học nâng cao:**
  * `Math.abs(x)`: Trả về giá trị tuyệt đối.
  * `Math.sqrt(d)`: Tính căn bậc hai.
  * `Math.pow(base, exp)`: Tính lũy thừa.
* **Sinh số ngẫu nhiên:**
  * `Math.random()`: Trả về số thực `double` ngẫu nhiên trong khoảng nửa mở: `0.0 <= giá trị < 1.0`.

### 3.5. Lớp thao tác ký tự `java.lang.Character`
Ký tự trong Java chiếm 2 bytes, đại diện cho bảng mã Unicode 16-bit. Lớp `Character` cung cấp các phương thức tiện ích:
* `Character.isLetter(ch)`: Kiểm tra ký tự chữ cái.
* `Character.isDigit(ch)`: Kiểm tra ký tự chữ số.
* `Character.isUpperCase(ch)`: Kiểm tra chữ in hoa.
* `Character.toUpperCase(ch)` / `Character.toLowerCase(ch)`: Chuyển đổi định dạng chữ hoa/chữ thường.

---

### 3.6. Bộ 5 bài tập tự luyện Slot 8 (Kèm lời giải chi tiết)

#### Bài tập 8.1: Tính chất bất biến của Wrapper Classes
* **Đề bài:** Tại sao bài giảng lại khẳng định rằng: *"Wrapper classes are immutable (non-changeable)"*? Tính chất này bắt nguồn từ việc lớp không có phương thức nào?
* **Đáp án & Lời giải chi tiết:**
  * Đối tượng Wrapper là bất biến (`immutable`) vì một khi đã được khởi tạo với một giá trị, giá trị chứa bên trong nó không bao giờ có thể bị thay đổi.
  * Nguyên nhân kỹ thuật: Trong thiết kế của tất cả các lớp Wrapper (như `Integer`, `Double`, `Character`), **không có bất kỳ phương thức Setter nào được cài đặt**.

#### Bài tập 8.2: Phân tích cơ chế Autoboxing & Unboxing
* **Đề bài:** Chỉ ra dòng lệnh nào thực hiện **Autoboxing** và dòng lệnh nào thực hiện **Unboxing** trong đoạn mã sau:
  ```java
  Integer a = 50; 
  int b = a + 10; 
  ```
* **Đáp án & Lời giải chi tiết:**
  * Dòng `Integer a = 50;`: Thực hiện **Autoboxing** (tự động chuyển giá trị nguyên thủy `50` kiểu `int` thành đối tượng `Integer` tương ứng).
  * Dòng `int b = a + 10;`: Thực hiện **Unboxing** (máy ảo tự động mở gói đối tượng `a` lấy giá trị nguyên thủy `50` ra để cộng với số nguyên `10`, sau đó gán vào biến nguyên thủy `b`).

#### Bài tập 8.3: Chuyển đổi chuỗi thành số nguyên theo các hệ cơ số khác nhau
* **Đề bài:** Cho hai dòng lệnh sau trong slide `WrapperDemo.java`:
  ```java
  int x = Integer.parseInt("1234");
  int y = Integer.parseInt("1A", 16);
  ```
  Xác định giá trị của `x` và `y` khi in ra màn hình ở hệ thập phân.
* **Đáp án & Lời giải chi tiết:**
  * Giá trị của `x`: `1234` (chuyển đổi chuỗi ký tự dạng thập phân chuẩn).
  * Giá trị của `y`: `26` (chuỗi `"1A"` ở hệ cơ số 16 được tính là: `1 × 16^1 + 10 × 16^0 = 16 + 10 = 26`).

#### Bài tập 8.4: Phương thức làm tròn của lớp Math
* **Đề bài:** Xác định kết quả của các biểu thức toán học sau:
  1. `Math.ceil(7.2)`
  2. `Math.floor(7.8)`
* **Đáp án & Lời giải chi tiết:**
  1. `Math.ceil(7.2)` trả về **`8.0`** (hàm `ceil` làm tròn lên số nguyên nhỏ nhất lớn hơn hoặc bằng tham số truyền vào).
  2. `Math.floor(7.8)` trả về **`7.0`** (hàm `floor` làm tròn xuống số nguyên lớn nhất nhỏ hơn hoặc bằng tham số truyền vào).

#### Bài tập 8.5: Kiểm tra và xử lý ký tự với `Character`
* **Đề bài:** Đoạn mã sau in ra giá trị gì?
  ```java
  char c = '9';
  if (Character.isDigit(c)) {
      int value = Character.getNumericValue(c);
      System.out.println("Gia tri: " + (value * 2));
  }
  ```
* **Đáp án & Lời giải chi tiết:**
  * **Kết quả in ra:** `Gia tri: 18`
  * **Giải thích:** `Character.isDigit('9')` kiểm tra đúng ký tự `'9'` là chữ số (trả về `true`). Phương thức `Character.getNumericValue('9')` trích xuất giá trị số nguyên thực sự của ký tự đó là số `9`. Do đó `value * 2 = 9 * 2 = 18`.

---

## 4. Slot 9: Xử lý chuỗi, String Pool, StringBuffer/StringBuilder & Quét chuỗi với Scanner
* **Tài liệu học tập tương ứng:** Bộ slide `Numbers and Strings.pptx` (từ slide *Strings* đến slide *Using java.util.Scanner* và *Formatting*).

### 4.1. Bản chất của lớp `java.lang.String` & Tính bất biến
Trong Java, chuỗi ký tự không phải là mảng ký tự nguyên thủy đơn thuần như trong C, mà là một thực thể đối tượng thuộc lớp `java.lang.String`.
* Khai báo lớp: `public final class String extends Object implements Serializable, Comparable<String>, CharSequence`. Từ khóa `final` ngăn cản việc kế thừa từ `String`.
* **Tính bất biến (Immutable):** Một đối tượng `String` khi đã được tạo ra trong bộ nhớ thì không thể bị sửa đổi nội dung. Mọi phương thức thao tác chuỗi (như `concat()`, `toUpperCase()`, `replace()`, `substring()`) không hề chỉnh sửa chuỗi ban đầu mà luôn tạo ra và trả về một đối tượng chuỗi mới trên Heap.
* Các phương thức cốt lõi: `length()`, `charAt(int index)`, `indexOf(String str)`, `substring(int begin, int end)`, `trim()`.

### 4.2. Vùng nhớ String Pool & So sánh chuỗi (`==` vs `equals()`)
Để tối ưu hóa dung lượng bộ nhớ, Java sử dụng phân vùng đặc biệt trong Heap gọi là String Constant Pool:
* **Tạo chuỗi bằng Literal (`String s = "Hello";`):** JVM kiểm tra String Pool. Nếu chuỗi đã tồn tại, JVM tái sử dụng ô nhớ cũ và gán tham chiếu mới vào đó mà không tạo đối tượng mới. Do đó hai biến literal cùng nội dung sẽ có toán tử so sánh địa chỉ `==` trả về `true`.
* **Tạo chuỗi bằng từ khóa `new` (`String s = new String("Hello");`):** JVM bắt buộc cấp phát một ô nhớ mới độc lập trên Dynamic Heap thông thường (ngoài String Pool). Do đó toán tử `==` so sánh với chuỗi literal sẽ trả về `false`.
* **Quy chuẩn so sánh:**
  * `==`: So sánh địa chỉ ô nhớ tham chiếu.
  * `equals()`: So sánh nội dung giá trị ký tự bên trong chuỗi. Trong lập trình ứng dụng, luôn luôn dùng `equals()` hoặc `equalsIgnoreCase()` để so sánh chuỗi.

### 4.3. Bảng so sánh giữa `String`, `StringBuffer` và `StringBuilder`
Khi cần nối ghép chuỗi hàng nghìn lần, việc dùng `String` sẽ sinh ra hàng nghìn đối tượng rác trên Heap. Java cung cấp hai lớp thay thế có khả năng thay đổi nội dung (Mutable):

| Tiêu chí | `java.lang.String` | `java.lang.StringBuffer` | `java.lang.StringBuilder` |
| :--- | :--- | :--- | :--- |
| **Tính thay đổi (Mutability)** | **Bất biến (Immutable)** | **Có thể thay đổi (Mutable)** | **Có thể thay đổi (Mutable)** |
| **An toàn luồng (Thread-safety)** | An toàn tuyệt đối | **An toàn luồng (Thread-safe)** với các phương thức đồng bộ hóa (`synchronized`) | **Không an toàn luồng (Not thread-safe)** |
| **Hiệu năng tốc độ** | Chậm khi nối chuỗi nhiều lần | Nhanh hơn String, nhưng chậm hơn StringBuilder do chi phí khóa luồng | **Nhanh nhất (Fastest)** trong xử lý đơn luồng |
| **Phương thức nổi bật** | `concat()`, `+` | `append()`, `insert()`, `delete()`, `reverse()` | `append()`, `insert()`, `delete()`, `reverse()` |

### 4.4. Phân tích cú pháp chuỗi với `java.util.Scanner`
Lớp `java.util.Scanner` cung cấp công cụ phân tách token văn bản mạnh mẽ:
* **Thiết lập ký tự phân tách (Delimiter):** Mặc định sử dụng khoảng trắng. Có thể cấu hình dấu phân tách tùy biến bằng biểu thức chính quy qua phương thức `useDelimiter(String regex)` (ví dụ `sc.useDelimiter("[,;\\s]+");`).
* **Các phương thức duyệt:** `hasNext()`, `next()`, `nextInt()`, `nextDouble()`, `nextLine()`.

### 4.5. Định dạng dữ liệu xuất ra (Formatting)
Java hỗ trợ in dữ liệu theo khuôn mẫu với `System.out.printf(...)` hoặc `System.out.format(...)`:
* `%d`: Định dạng số nguyên.
* `%f`: Định dạng số thực (ví dụ `%.2f` lấy 2 số lẻ thập phân).
* `%s`: Định dạng chuỗi văn bản.
* `%c`: Định dạng ký tự.
* `%n`: Ngắt xuống dòng mới an toàn đa nền tảng.

---

### 4.6. Bộ 5 bài tập tự luyện Slot 9 (Kèm lời giải chi tiết)

#### Bài tập 9.1: Phân biệt `==` và `equals()` với String Pool
* **Đề bài:** Xác định kết quả in ra màn hình (`true` hay `false`) của đoạn mã sau và giải thích rõ bản chất vùng nhớ:
  ```java
  String a = "Java";
  String b = "Java";
  String c = new String("Java");
  
  System.out.println(a == b);
  System.out.println(a == c);
  System.out.println(a.equals(c));
  ```
* **Đáp án & Lời giải chi tiết:**
  * **Kết quả in ra:**
    ```text
    true
    false
    true
    ```
  * **Giải thích:**
    1. `a == b` trả về **`true`**: Cả `a` và `b` cùng trỏ đến một ô nhớ trong **String Pool**.
    2. `a == c` trả về **`false`**: `c` được tạo bằng từ khóa `new`, lưu ở ô nhớ độc lập trên Dynamic Heap bên ngoài String Pool; hai biến khác địa chỉ tham chiếu.
    3. `a.equals(c)` trả về **`true`**: Phương thức `equals()` so sánh nội dung ký tự; cả hai đều là chuỗi `"Java"`.

#### Bài tập 9.2: Tính bất biến và cơ chế cấp phát chuỗi mới
* **Đề bài:** Đoạn mã sau in ra giá trị gì?
  ```java
  String s = "Hello";
  s.concat(" World");
  s.toUpperCase();
  System.out.println(s);
  ```
* **Đáp án & Lời giải chi tiết:**
  * **Kết quả in ra:** `Hello`
  * **Giải thích:** `String` là bất biến. Các phương thức `concat()` và `toUpperCase()` đều trả về các đối tượng chuỗi mới trên Heap. Do đoạn mã không gán kết quả trả về vào biến nào, biến `s` vẫn trỏ đến đối tượng ban đầu là `"Hello"`.

#### Bài tập 9.3: Lựa chọn giữa `StringBuilder` và `StringBuffer`
* **Đề bài:** Trong một ứng dụng xử lý dữ liệu đơn luồng (Single-thread), bạn cần thực hiện nối 100.000 dòng văn bản trong vòng lặp. Bạn nên chọn `String`, `StringBuffer` hay `StringBuilder`? Giải thích tại sao.
* **Đáp án & Lời giải chi tiết:**
  * **Lựa chọn tối ưu:** Nên chọn **`StringBuilder`**.
  * **Giải thích:**
    * Không dùng `String` vì tính bất biến sẽ tạo ra 100.000 đối tượng rác trên Heap, gây tràn bộ nhớ và kích hoạt GC liên tục làm giảm hiệu năng.
    * Không nên dùng `StringBuffer` trong môi trường đơn luồng vì chi phí đồng bộ hóa luồng (`synchronized`) gây chậm tốc độ xử lý.
    * `StringBuilder` có khả năng thay đổi kích thước linh hoạt và không có chi phí đồng bộ hóa luồng, mang lại tốc độ thực thi nhanh nhất.

#### Bài tập 9.4: Đảo ngược chuỗi và chèn ký tự với `StringBuilder`
* **Đề bài:** Sử dụng `StringBuilder` để viết đoạn mã nhận vào chuỗi `"ABCDEF"`, thực hiện đảo ngược chuỗi thành `"FEDCBA"`, sau đó chèn dấu gạch ngang `"-"` vào chính giữa chuỗi (sau ký tự `'D'`) và in kết quả ra màn hình.
* **Đáp án & Lời giải chi tiết:**
  ```java
  public class StringDemo {
      public static void main(String[] args) {
          StringBuilder sb = new StringBuilder("ABCDEF");
          sb.reverse(); // Đảo ngược thành "FEDCBA"
          sb.insert(3, "-"); // Chèn dấu '-' tại vị trí chỉ mục 3
          System.out.println(sb.toString()); // In ra: FED-CBA
      }
  }
  ```
  * **Giải thích:** Phương thức `reverse()` đảo ngược chuỗi ký tự trực tiếp trên bộ đệm. Phương thức `insert(3, "-")` dịch chuyển các ký tự từ chỉ mục 3 sang phải và chèn ký tự `"-"` vào vị trí đó.

#### Bài tập 9.5: Tách token dữ liệu với `java.util.Scanner`
* **Đề bài:** Cho chuỗi dữ liệu: `String input = "Nam, 8.5; Lan, 9.0; Tuan, 7.5";`. Hãy viết đoạn mã dùng `Scanner` với phương thức `useDelimiter` để trích xuất và in ra tên của từng người cùng điểm số tương ứng trên từng dòng riêng biệt.
* **Đáp án & Lời giải chi tiết:**
  ```java
  import java.util.Scanner;

  public class ParseScore {
      public static void main(String[] args) {
          String input = "Nam, 8.5; Lan, 9.0; Tuan, 7.5";
          Scanner sc = new Scanner(input);
          sc.useDelimiter("[,;]\\s*");
          
          while (sc.hasNext()) {
              String name = sc.next();
              double score = sc.nextDouble();
              System.out.println("Sinh vien: " + name + " - Diem: " + score);
          }
          sc.close();
      }
  }
  ```
  * **Giải thích:** Biểu thức chính quy `[,;]\\s*` yêu cầu `Scanner` nhận diện dấu phẩy hoặc chấm phẩy kèm khoảng trắng làm dấu phân tách. Lệnh `sc.next()` đọc tên sinh viên, lệnh `sc.nextDouble()` đọc và chuyển đổi trực tiếp điểm số thành kiểu `double`.

---

## 5. Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Vùng nhớ Runtime JVM](../java/jvm/memory-area.md) · [Garbage Collection](../java/jvm/jvm-garbage-collection.md) · [Java Basics (String, Pool, Autoboxing)](../java/basis/java-basic-questions-01.md) · [Why Only Value Passing?](../java/basis/why-there-only-value-passing-in-java.md)
- **Slide & PDF gốc offline:** [Memory Management in Java.pdf](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) · [Numbers and Strings.pdf](/media/pro192/resources/Numbers%20and%20Strings.pdf) · [Support Classes.pdf](/media/pro192/resources/Support%20Classes.pdf)
