---
title: Tìm hiểu về JVM bằng ngôn ngữ dễ hiểu
description: Giới thiệu cấu tạo cơ bản của JVM cùng quy trình nạp lớp và thực thi theo cách dễ hiểu, giúp bạn nhanh chóng làm quen với nguyên lý máy ảo.
category: Java
tag:
  - JVM
lang: vi
sourceRef: zh-ref/java/jvm/jvm-intro.md
head:
  - - meta
    - name: keywords
      content: Kiến thức cơ bản JVM,Class Loading,Method Area,Heap và Stack,Program Counter,Runtime Data Areas
---

> Đóng góp bởi [Say Your Wish](https://juejin.im/user/5c2400afe51d45451758aa96), bài gốc: <https://juejin.im/post/5e1505d0f265da5d5d744050>.

## Lời mở đầu

Nếu trong bài viết có điểm nào chưa chuẩn xác về mặt diễn đạt hoặc cách hiểu, rất mong nhận được góp ý của các bạn. Bài viết này hướng tới việc điểm qua các khái niệm mà không đi quá sâu vào từng chi tiết học thuật, nhưng vẫn cố gắng trình bày đầy đủ và súc tích các kiến thức cốt lõi nhất.

## 1. Giới thiệu cơ bản về JVM

JVM là viết tắt của Java Virtual Machine (Máy ảo Java). Nó là một máy tính ảo được giả lập, một bản đặc tả kỹ thuật (specification), được hiện thực hóa bằng cách mô phỏng các chức năng của máy tính thực tế trên một thiết bị phần cứng thật...

Thôi bỏ qua mấy câu định nghĩa mang tính hàn lâm đó đi, bạn chỉ cần hiểu đơn giản rằng JVM giống như một chiếc máy tính nhỏ chạy bên trong các hệ điều hành như Windows hoặc Linux. Nó tương tác trực tiếp với hệ điều hành chứ không tương tác trực tiếp với phần cứng, còn hệ điều hành sẽ lo giúp chúng ta việc giao tiếp với phần cứng.

![](/media/jg/ext/static001.geekbang.org/infoq/da/da0380a04d9c04facd2add5f6dba06fa-387f1eb5.webp)

### 1.1 Tệp Java được chạy như thế nào

Ví dụ bây giờ chúng ta viết một tệp `HelloWorld.java`. Bỏ qua mọi thứ khác, chẳng phải `HelloWorld.java` chỉ giống như một tệp văn bản thuần túy, chỉ khác là bên trong viết bằng tiếng Anh và có thụt lề nhất định thôi sao?

Nhưng **JVM** của chúng ta lại không hiểu tệp văn bản thuần túy, vì vậy cần qua bước **biên dịch (compile)** để biến nó thành tệp nhị phân mà JVM có thể đọc được là **HelloWorld.class**.

#### ① ClassLoader

Nếu **JVM** muốn thực thi tệp **`.class`** này, chúng ta cần đưa nó vào một **ClassLoader**. Nó giống như một người khuân vác vậy, sẽ chuyển toàn bộ các tệp **`.class`** vào bên trong JVM.

![](/media/jg/ext/static001.geekbang.org/infoq/2f/2f012fde94376f43a25dbe1dd07e0dd8-d2df0eec.webp)

#### ② Method Area

**Method Area** dùng để lưu trữ các dữ liệu mang tính siêu dữ liệu (metadata), chẳng hạn như thông tin lớp (class metadata), hằng số (constants), biến tĩnh (`static` variables), mã đã biên dịch... v.v.

Khi ClassLoader mang tệp `.class` vào thì nơi đầu tiên nó đặt vào chính là vùng này.

#### ③ Heap

**Heap** chủ yếu lưu trữ các thể hiện đối tượng (object instances) và mảng (arrays). Giống như Method Area, nó thuộc **vùng dùng chung giữa các Thread (thread-shared region)**. Việc dùng chung giữa các Thread chỉ có nghĩa là nhiều Thread có thể truy cập các vùng này, không đồng nghĩa với việc bản thân vùng nhớ đó "không an toàn Thread (thread-unsafe)"; có xảy ra xung đột dữ liệu (data race) hay không phụ thuộc vào cách chương trình truy cập dữ liệu bên trong nó.

#### ④ Stack

**Stack** là không gian chạy mã nguồn của chúng ta. Mỗi phương thức mà chúng ta viết đều được đưa vào **Stack** để thực thi.

Chúng ta cũng từng nghe đến hai thuật ngữ Native Method Stack hoặc Java Native Interface (JNI). Phương thức native được cài đặt bằng mã bản địa bên ngoài Java, ngôn ngữ cài đặt phổ biến là C hoặc C++, tùy thuộc vào máy ảo và thư viện bản địa cụ thể.

#### ⑤ Program Counter

Program Counter (bộ đếm chương trình) ghi lại địa chỉ lệnh JVM mà Thread hiện tại đang thực thi; sau khi thực hiện rẽ nhánh, vòng lặp, xử lý ngoại lệ hoặc chuyển đổi ngữ cảnh Thread, máy ảo dựa vào nó để tiếp tục thực thi. Giống như Stack, nó thuộc vùng **riêng tư của từng Thread (thread-private)**. Khi thực thi phương thức `native`, đặc tả không quy định giá trị của nó.

![](/media/jg/ext/static001.geekbang.org/infoq/c6/c602f57ea9297f50bbc265f1821d6263-bdeb46e3.webp)

#### Tóm tắt nhanh

1. Tệp Java sau khi biên dịch sẽ trở thành tệp bytecode `.class`.
2. Tệp bytecode được ClassLoader đưa vào trong máy ảo JVM.
3. Trong vùng dữ liệu Runtime (Runtime Data Areas) của máy ảo, Method Area và Heap là vùng dùng chung giữa các Thread; còn JVM Stack, Native Method Stack và Program Counter là vùng riêng tư của từng Thread. Khái niệm dùng chung hay riêng tư thể hiện phạm vi nhìn thấy (visibility) của vùng nhớ, chứ không đồng nghĩa trực tiếp với an toàn Thread hay không an toàn Thread.

### 1.2 Ví dụ code đơn giản

Một lớp `Student` đơn giản:

![](/media/jg/ext/static001.geekbang.org/infoq/12/12f0b239db65b8a95f0ce90e9a580e4d-7a8040a0.webp)

Một phương thức `main`:

![](/media/jg/ext/static001.geekbang.org/infoq/0c/0c6d94ab88a9f2b923f5fea3f95bc2eb-bcb0f4fa.webp)

Các bước thực thi phương thức `main` như sau:

1. Sau khi biên dịch `App.java` thành `App.class` và chạy `App.class`, hệ thống sẽ khởi chạy một tiến trình (Process) JVM, tìm tệp nhị phân tên `App.class` từ đường dẫn classpath, và nạp thông tin lớp của `App` vào Method Area trong vùng dữ liệu Runtime. Quá trình này gọi là nạp lớp `App`.
2. JVM tìm điểm vào chương trình chính của `App` và thực thi phương thức `main`.
3. Câu lệnh đầu tiên trong `main` là `Student student = new Student("tellUrDream")`, yêu cầu JVM tạo một đối tượng `Student`. Tuy nhiên lúc này trong Method Area chưa có thông tin về lớp `Student`, vì vậy JVM lập tức nạp lớp `Student` và đưa thông tin của lớp `Student` vào Method Area.
4. Sau khi nạp xong lớp `Student`, JVM cấp phát bộ nhớ trên Heap cho một thể hiện `Student` mới, rồi gọi hàm tạo (constructor) để khởi tạo thể hiện `Student` này. Thể hiện `Student` đó giữ một tham chiếu **trỏ tới thông tin kiểu của lớp `Student` trong Method Area**.
5. Khi thực thi `student.sayName();`, JVM dựa theo tham chiếu `student` để tìm đối tượng `student`, rồi từ tham chiếu mà đối tượng `student` đang nắm giữ định vị tới bảng phương thức (method table) trong thông tin kiểu của lớp `Student` ở Method Area, qua đó lấy được địa chỉ bytecode của `sayName()`.
6. Thực thi `sayName()`.

Thực ra cũng không cần quá phức tạp, bạn chỉ cần nhớ rằng khi thể hiện đối tượng được khởi tạo, nó sẽ tìm thông tin lớp ở Method Area, sau đó sang Stack để chạy phương thức. Việc tìm phương thức sẽ tra trong bảng phương thức (method table).

## 2. Giới thiệu về ClassLoader

Trước đó chúng ta đã nhắc đến việc ClassLoader chịu trách nhiệm nạp tệp `.class`. Các tệp này có mã nhận dạng đặc biệt ở phần đầu tệp; ClassLoader sẽ nạp nội dung bytecode của tệp class vào bộ nhớ và chuyển đổi nội dung đó thành cấu trúc dữ liệu runtime trong Method Area. Hơn nữa, `ClassLoader` chỉ chịu trách nhiệm nạp tệp `.class`, còn có thể chạy được hay không sẽ do Execution Engine quyết định.

### 2.1 Quy trình của ClassLoader

Từ lúc một lớp được nạp vào bộ nhớ máy ảo cho đến khi được giải phóng khỏi bộ nhớ, tổng cộng có 7 bước: Loading (Nạp), Verification (Xác minh), Preparation (Chuẩn bị), Resolution (Phân giải), Initialization (Khởi tạo), Using (Sử dụng) và Unloading (Gỡ bỏ). Trong đó **3 phần Verification, Preparation, Resolution được gọi chung là Linking (Liên kết)**.

#### 2.1.1 Loading (Nạp)

1. Nạp tệp `.class` vào bộ nhớ.
2. Chuyển đổi cấu trúc dữ liệu tĩnh thành cấu trúc dữ liệu runtime trong Method Area.
3. Tạo một đối tượng `java.lang.Class` trên Heap đại diện cho lớp này làm điểm truy cập dữ liệu.

#### 2.1.2 Linking (Liên kết)

1. Verification (Xác minh): Đảm bảo lớp được nạp tuân thủ đặc tả JVM và an toàn, bảo đảm các phương thức của lớp được kiểm tra sẽ không gây hại cho máy ảo lúc runtime — thực chất đây là bước kiểm tra bảo mật.
2. Preparation (Chuẩn bị): Cấp phát không gian lưu trữ cho biến lớp (các trường `static`) và gán giá trị khởi tạo mặc định. Ví dụ `static int a = 3` ở giai đoạn Preparation thường nhận giá trị mặc định là `0` trước, rồi sang giai đoạn Initialization mới được gán giá trị `3`. Vị trí lưu trữ cụ thể thuộc về chi tiết cài đặt của máy ảo.
3. Resolution (Phân giải): Máy ảo chuyển đổi các tham chiếu ký hiệu (symbolic reference) trong Runtime Constant Pool thành tham chiếu trực tiếp (direct reference). Từ khóa `import` trong mã nguồn chỉ là cơ chế phân giải tên ở thời điểm biên dịch, không phải tham chiếu ký hiệu trong Constant Pool; biểu diễn cụ thể của tham chiếu trực tiếp cũng không nhất thiết là địa chỉ đối tượng.

#### 2.1.3 Initialization (Khởi tạo)

Initialization thực chất là quá trình thực thi phương thức khởi tạo lớp `<clinit>()`, đồng thời phải đảm bảo phương thức `<clinit>()` của lớp cha được thực thi xong trước. Phương thức này do trình biên dịch thu thập, thực thi tuần tự toàn bộ các phép gán khởi tạo tường minh của biến lớp (biến thành viên có từ khóa `static`) và các câu lệnh trong khối tĩnh (`static` block). Lúc này biến `static int a` từ giá trị mặc định `0` ở giai đoạn Preparation sẽ chuyển thành `3` theo khởi tạo tường minh. Do thứ tự thực thi, ở giai đoạn Initialization nếu biến lớp lại được gán lại giá trị bên trong khối `static` thì giá trị đó sẽ ghi đè phép khởi tạo tường minh, giá trị cuối cùng sẽ là giá trị được gán trong khối `static`.

> Lưu ý: Trong tệp bytecode có hai loại phương thức khởi tạo: `<init>` dùng để khởi tạo tài nguyên non-static và `<clinit>` dùng để khởi tạo tài nguyên static. Phương thức khởi tạo lớp `<clinit>()` khác với hàm tạo (constructor) của lớp; đây đều là các phương thức đặc biệt trong tệp bytecode chỉ JVM mới nhận diện được.

#### 2.1.4 Unloading (Gỡ bỏ)

Unloading (gỡ bỏ lớp) là việc máy ảo thu hồi siêu dữ liệu lớp (class metadata) và các tài nguyên liên quan khi chúng không còn khả năng tiếp cận (reachable), thông thường yêu cầu ClassLoader đã định nghĩa lớp đó cũng không còn khả năng tiếp cận nữa. Quá trình này khác với Garbage Collection của đối tượng thông thường, và việc có gỡ bỏ hay không, gỡ bỏ lúc nào do cài đặt máy ảo và Garbage Collector quyết định.

### 2.2 Thứ tự nạp của ClassLoader

Lấy HotSpot JDK 8 làm ví dụ, phân cấp ClassLoader phổ biến như sau. Sau khi JDK 9 mô-đun hóa, `Extension ClassLoader` được thay thế bởi `Platform ClassLoader`, và `rt.jar` cũng không còn tồn tại:

1. BootStrap ClassLoader: `rt.jar`
2. Extension ClassLoader: nạp các gói JAR mở rộng
3. App ClassLoader: các gói JAR nằm trong classpath được chỉ định
4. Custom ClassLoader: ClassLoader tùy chỉnh của người dùng

### 2.3 Cơ chế ủy quyền cha (Parent Delegation)

Khi một lớp nhận được yêu cầu nạp, nó sẽ không tự mình thử nạp trước mà ủy quyền lên cho ClassLoader cha thực hiện. Ví dụ bây giờ tôi muốn `new Person()`, `Person` là lớp do chúng ta tự định nghĩa; khi cần nạp nó, yêu cầu sẽ đi qua `App ClassLoader` rồi ủy quyền lên trên, chỉ khi toàn bộ ClassLoader cha đều phản hồi rằng không thể hoàn thành yêu cầu này (tức là các ClassLoader cha đều không tìm thấy `Class` cần nạp) thì ClassLoader con mới tự mình thử nạp.

Lợi ích của việc làm này là khi nạp các lớp nằm trong gói `rt.jar`, bất kể ClassLoader nào nhận yêu cầu nạp, cuối cùng đều sẽ ủy quyền lên `BootStrap ClassLoader` để nạp, qua đó đảm bảo khi dùng các ClassLoader khác nhau thì kết quả nhận được đều là một.

Thực ra cơ chế này cũng đóng vai trò cách ly, tránh việc code của chúng ta làm ảnh hưởng tới code của JDK. Ví dụ tôi tự định nghĩa một lớp `java.lang.String`:

```java
package java.lang;
public class String {
    public static void main(String[] args) {
        System.out.println();
    }
}
```

Khi thử chạy hàm `main` của lớp hiện tại, code của chúng ta chắc chắn sẽ báo lỗi. Bởi vì khi nạp lớp, thực tế nó đã tìm thấy `java.lang.String` trong `rt.jar`, nhưng lại phát hiện bên trong lớp đó không hề có phương thức `main`.

## 3. Vùng dữ liệu Runtime (Runtime Data Areas)

### 3.1 Native Method Stack và Program Counter

Ví dụ khi mở mã nguồn của lớp `Thread`, chúng ta sẽ thấy phương thức `start0` của nó có từ khóa `native` đi kèm và không có phần thân phương thức Java. Loại phương thức này được cài đặt bởi mã bản địa bên ngoài Java, phổ biến là ngôn ngữ C hoặc C++; máy ảo sử dụng Native Method Stack để hỗ trợ việc thực thi các phương thức `native`.

Program Counter ghi lại địa chỉ lệnh JVM mà Thread hiện tại đang thực thi. Đây cũng là vùng dữ liệu Runtime duy nhất trong *Đặc tả Máy ảo Java (Java Virtual Machine Specification)* không quy định bất kỳ tình huống `OutOfMemoryError` nào. Bộ thông dịch bytecode chọn lệnh bytecode tiếp theo cần thực thi bằng cách thay đổi giá trị của Program Counter.

Nếu phương thức đang thực thi là phương thức `native`, đặc tả không quy định giá trị của Program Counter.

### 3.2 Method Area

Vai trò chính của Method Area là lưu trữ thông tin siêu dữ liệu (metadata) của lớp, hằng số và biến tĩnh `static`... v.v. Khi thông tin lưu trữ trong đó quá lớn đến mức không thể đáp ứng cấp phát bộ nhớ, hệ thống sẽ báo lỗi.

### 3.3 JVM Stack và JVM Heap

Gói gọn trong một câu: Stack lo vận hành, Heap lo lưu trữ. Tức là JVM Stack chịu trách nhiệm chạy code, còn JVM Heap chịu trách nhiệm lưu dữ liệu.

#### 3.3.1 Khái niệm JVM Stack

Đây là mô hình bộ nhớ cho việc thực thi các phương thức Java. Mỗi lời gọi phương thức đều sẽ tạo một stack frame, trong stack frame chứa các thông tin như bảng biến cục bộ (local variable table), ngăn xếp toán hạng (operand stack), liên kết động (dynamic linking) và địa chỉ trả về của phương thức (method return address), và nó thuộc quyền sở hữu riêng của từng Thread. Bảng biến cục bộ là một phần của stack frame.

```java
public class Person{
    int a = 1;

    public void doSomething(){
        int b = 2;
    }
}
```

#### 3.3.2 Các ngoại lệ có thể xảy ra trong JVM Stack

Nếu độ sâu Stack mà Thread yêu cầu lớn hơn độ sâu tối đa cho phép của JVM Stack, hệ thống sẽ báo lỗi **StackOverflowError** (lỗi này rất hay gặp khi dùng đệ quy). Máy ảo Java cũng có thể mở rộng động (dynamic expansion), nhưng quá trình mở rộng sẽ liên tục xin cấp phát bộ nhớ; khi không thể xin đủ bộ nhớ sẽ báo lỗi **OutOfMemoryError**.

#### 3.3.3 Vòng đời của JVM Stack

Đối với Stack, không tồn tại Garbage Collection. Chỉ cần chương trình chạy xong, không gian của Stack sẽ tự nhiên được giải phóng. Vòng đời của Stack gắn liền với Thread chứa nó.

Bổ sung một ý ở đây: tham số phương thức cùng các biến kiểu nguyên thủy hoặc tham chiếu đối tượng khai báo bên trong phương thức thường được lưu trong bảng biến cục bộ của stack frame hiện tại; còn thể hiện đối tượng (object instance) thường được cấp phát trên Heap. Bytecode của phương thức thuộc về metadata của lớp, không được cấp phát trong Stack dưới dạng "phương thức thể hiện".

#### 3.3.4 Cách thực thi của JVM Stack

Stack frame không phải bản thân phương thức, mà là cấu trúc dữ liệu runtime tương ứng với một lần gọi phương thức, dùng để lưu bảng biến cục bộ, ngăn xếp toán hạng, liên kết động, v.v. Bytecode và metadata của phương thức không nằm trong JVM Stack.

Mọi dữ liệu trong Stack đều tồn tại dưới dạng stack frame — đó là tập dữ liệu gắn với phương thức và dữ liệu lúc chạy. Ví dụ khi ta thực thi một phương thức `a`, sẽ sinh ra một stack frame `A1` tương ứng rồi đẩy `A1` vào Stack. Tương tự phương thức `b` có `B1`, phương thức `c` có `C1`. Khi Thread này thực thi xong, Stack sẽ bật ra (pop) `C1` trước, sau đó đến `B1`, `A1`. Nó hoạt động theo nguyên tắc Vào sau Ra trước (LIFO - Last In First Out).

#### 3.3.5 Tái sử dụng biến cục bộ (Local Variables)

Bảng biến cục bộ dùng để lưu tham số phương thức và các biến cục bộ được định nghĩa bên trong phương thức. Dung lượng của nó lấy Slot làm đơn vị nhỏ nhất; một Slot có thể lưu kiểu dữ liệu có độ dài từ 32 bit trở xuống.

Máy ảo định vị Slot trong bảng biến cục bộ thông qua chỉ số (index). Nếu dung lượng bảng biến cục bộ là `n`, phạm vi chỉ số hợp lệ là `[0, n)`; kiểu `long` và `double` chiếm 2 Slot liên tiếp. Tham số phương thức được sắp xếp trong bảng biến cục bộ theo thứ tự quy định trong đặc tả. Để tiết kiệm không gian stack frame, khi vị trí thực thi vượt ra ngoài phạm vi tác dụng (scope) của một biến cục bộ, Slot của nó có thể được tái sử dụng cho biến khác; các tham chiếu đối tượng trong bảng biến cục bộ vẫn còn được coi là hợp lệ sẽ tham gia vào quá trình quét GC Roots.

#### 3.3.6 Khái niệm JVM Heap

Lấy Garbage Collector phân thế hệ (generational GC) của HotSpot làm ví dụ: Heap thường được chia thành **Young Generation (Thế hệ trẻ)** và **Old Generation (Thế hệ già)**; Young Generation lại được chia thành **Eden** và hai vùng **Survivor**. Trong một lần sao chép thu gom, một vùng Survivor đóng vai trò `from` và vùng còn lại đóng vai trò `to`. Tỷ lệ mặc định giữa Eden và mỗi vùng Survivor thường là **8:1:1**, nhưng kích thước thực tế có thể chịu ảnh hưởng của bộ thu gom đang dùng và chiến lược thích ứng (adaptive ergonomics). Permanent Generation (PermGen) là một cách hiện thực Method Area của HotSpot ở JDK 7 trở về trước, chứ không đồng nhất với toàn bộ "bộ nhớ ngoài Heap (non-heap memory)".

Bộ nhớ Heap chủ yếu lưu trữ đối tượng, Garbage Collector sẽ đánh giá và thu hồi các đối tượng không còn khả năng tiếp cận (unreachable) trong đó. Thứ mà HotSpot gọi là bộ nhớ non-heap không chỉ bao gồm phần cài đặt của Method Area mà còn gồm cả Code Cache và các vùng khác. Sau khi JDK 8 loại bỏ Permanent Generation, metadata của lớp được chuyển sang lưu trong Metaspace do JVM quản lý; Metaspace sử dụng bộ nhớ gốc (native memory) chứ không nằm trên Java Heap. Các tham số liên quan gồm:

```plain
MetaspaceSize: Ngưỡng high-water mark ban đầu kích hoạt metadata GC, sau đó JVM sẽ tự động điều chỉnh động
MaxMetaspaceSize: Giới hạn mức trần kích thước của Metaspace
```

Sau khi loại bỏ Permanent Generation, sẽ không còn xuất hiện lỗi `java.lang.OutOfMemoryError: PermGen space` do cạn kiệt PermGen nữa. Tuy nhiên Metaspace vẫn có thể ném ra `OutOfMemoryError: Metaspace` khi metadata của lớp quá nhiều hoặc chạm ngưỡng giới hạn như `MaxMetaspaceSize`.

#### 3.3.7 Giới thiệu về Eden và Young Generation

Khi chúng ta `new` một đối tượng, nó sẽ được đặt trước vào một vùng nhớ được chia ra trong Eden; nhưng như đã biết bộ nhớ Heap được dùng chung giữa các Thread nên có thể xảy ra tình trạng hai đối tượng tranh chấp cùng một vùng nhớ. Cách xử lý của JVM là cấp phát trước cho mỗi Thread một vùng nhớ liên tục và quy định vị trí đặt đối tượng; nếu vùng nhớ đó không đủ thì xin thêm các vùng nhớ mới. Cơ chế này được gọi là **TLAB** (Thread Local Allocation Buffer), nếu hứng thú bạn có thể tìm hiểu thêm.

Khi không gian Eden không đủ để tiếp tục cấp phát đối tượng, thường sẽ kích hoạt Minor GC (tức GC diễn ra ở Young Generation); các đối tượng còn sống có thể được sao chép sang vùng Survivor hoặc thăng hạng trực tiếp lên Old Generation. Sau khi sao chép xong, hai vùng Survivor `from` và `to` sẽ đổi vai trò cho nhau. Khi tuổi của đối tượng đạt ngưỡng thăng hạng, nó có thể đi vào Old Generation; ở các bộ thu gom phân thế hệ phổ biến của HotSpot, giá trị mặc định của `-XX:MaxTenuringThreshold` thường là 15, nhưng tuổi thăng hạng thực tế còn chịu ảnh hưởng bởi đánh giá tuổi động (dynamic age threshold), dung lượng vùng Survivor và chiến lược của bộ thu gom, chứ không phải mọi đối tượng đều cố định trải qua đúng 15 lần Minor GC.

> 🐛 Đính chính: Khi vùng nhớ Eden đầy thì mới kích hoạt Minor GC; việc vùng Survivor0 đầy sẽ không kích hoạt Minor GC.
>
> **Vậy đối tượng trong vùng Survivor0 được thu gom rác khi nào?**
>
> Giả sử vùng Survivor0 hiện đang đầy, lúc này lại có một lần Minor GC được kích hoạt và phát hiện vùng Survivor0 vẫn đang đầy không chứa thêm được nữa; khi đó hệ thống sẽ thực hiện Phân tích khả năng tiếp cận (Reachability Analysis) gộp chung các đối tượng ở vùng S0 và vùng Eden, tìm ra các đối tượng còn sống (live objects), sao chép chúng sang vùng S1 rồi làm sạch vùng S0 và vùng Eden — qua đó dọn sạch các đối tượng không còn khả năng tiếp cận — và hoán đổi vai trò giữa vùng S0 với vùng S1.

Old Generation chủ yếu lưu trữ các đối tượng sống lâu hoặc được thăng hạng trực tiếp. Việc thiếu dung lượng ở Old Generation có thể kích hoạt thu gom Old Generation hoặc Full GC, hành vi cụ thể phụ thuộc vào từng Garbage Collector; phạm vi tạm dừng (pause) của các bộ thu gom cũng khác nhau, không thể đánh đồng là dừng toàn bộ mọi Thread ứng dụng trong suốt quá trình.

Hơn nữa, nếu sau khi Old Generation chạy Full GC mà vẫn không đủ chỗ để lưu đối tượng thì sẽ phát sinh OOM. Lúc này nguyên nhân là thiếu bộ nhớ Heap trong máy ảo, có thể do kích thước Heap cấu hình quá nhỏ (có thể điều chỉnh bằng tham số `-Xms`, `-Xmx`), hoặc cũng có thể do code tạo ra các đối tượng vừa lớn vừa nhiều và chúng luôn bị giữ tham chiếu khiến Garbage Collection suốt thời gian dài không thể thu hồi được.

![](/media/jg/ext/static001.geekbang.org/infoq/39/398255141fde8ba208f6c99f4edaa9fe-1930adc5.webp)

Giải thích bổ sung về tham số `-XX:TargetSurvivorRatio`: Thực ra không nhất thiết phải đạt đủ `-XX:MaxTenuringThreshold` mới chuyển lên Old Generation. Có thể lấy ví dụ: giả sử các đối tượng tuổi 5 chiếm 30%, tuổi 6 chiếm 36%, tuổi 7 chiếm 34%; khi cộng dồn đến một độ tuổi nào đó (như tuổi 6 trong ví dụ này) mà tổng dung lượng chiếm dụng vượt quá `Survivor space * TargetSurvivorRatio`, thì các đối tượng từ độ tuổi đó trở lên (tức tuổi 6 và tuổi 7 trong ví dụ) sẽ chuyển thẳng lên Old Generation ngay, lúc này không cần phải chờ đến mức 15 mà `MaxTenuringThreshold` yêu cầu.

#### 3.3.8 Cách xác định một đối tượng cần bị thu hồi

![](/media/jg/ext/static001.geekbang.org/infoq/1b/1ba7f3cff6e07c6e9c6765cc4ef74997-55677e4a.webp)

Trong hình trên, 3 vùng gồm Program Counter, JVM Stack và Native Method Stack sinh ra và mất đi cùng với Thread. Việc cấp phát và thu hồi bộ nhớ của chúng là tất định (deterministic). Khi Thread kết thúc, bộ nhớ đương nhiên được giải phóng nên không cần cân nhắc đến vấn đề Garbage Collection. Còn Java Heap và Method Area thì khác, chúng được dùng chung giữa các Thread, việc cấp phát và thu hồi bộ nhớ diễn ra động. Do vậy, đối tượng mà Garbage Collector quan tâm chính là phần bộ nhớ Heap và Method Area này.

Trước khi tiến hành thu hồi, cần xác định đối tượng nào còn sống và đối tượng nào đã chết. Dưới đây giới thiệu hai phương pháp tính toán cơ bản:

1. **Đếm tham chiếu (Reference Counting)**: Gắn cho mỗi đối tượng một bộ đếm tham chiếu; mỗi khi có tham chiếu tới đối tượng này thì bộ đếm tăng 1, khi tham chiếu hết hiệu lực thì giảm 1, khi bộ đếm bằng 0 nghĩa là đối tượng sẽ không được dùng lại nữa. Tuy nhiên phương pháp này có một nhược điểm là khi xuất hiện tham chiếu vòng tròn (circular reference) giữa các đối tượng thì GC không thể thu hồi được.

2. **Phân tích khả năng tiếp cận (Reachability Analysis)**: Xuất phát từ một tập hợp các **GC Roots**, tìm kiếm dọc theo các mối quan hệ tham chiếu giữa các đối tượng; đường đi qua được gọi là chuỗi tham chiếu (reference chain). Quan hệ tham chiếu giữa các đối tượng tạo thành một đồ thị chứ không phải cây nhị phân. Khi một đối tượng không có bất kỳ chuỗi tham chiếu nào nối tới GC Roots, điều đó chứng tỏ đối tượng này không thể tiếp cận được nữa (unreachable). Các ngôn ngữ lập trình thương mại phổ biến như Java, C#... đều sử dụng hướng tiếp cận này để xác định đối tượng còn sống hay không.

(Tham khảo thêm) Trong ngôn ngữ Java, các đối tượng có thể đóng vai trò là GC Roots được chia thành các loại sau:

1. Đối tượng được tham chiếu trong JVM Stack (bảng biến cục bộ trong stack frame — các biến cục bộ)
2. Đối tượng được tham chiếu bởi biến tĩnh (`static`) trong Method Area
3. Đối tượng được tham chiếu bởi hằng số trong Method Area
4. Đối tượng được tham chiếu bởi JNI trong Native Method Stack (tức các phương thức có từ khóa `native`; JNI là cách JVM gọi các hàm C tương ứng, thông qua hàm JNI cũng có thể tạo đối tượng Java mới, và cả local reference lẫn global reference của JNI đều đánh dấu đối tượng mà chúng trỏ tới là không thể thu hồi)
5. Các Thread Java đã khởi động và chưa kết thúc

Ưu điểm của phương pháp này là giải quyết được vấn đề tham chiếu vòng tròn. Bộ thu gom cần có được bức ảnh nhất quán về quan hệ tham chiếu giữa các đối tượng ở một số giai đoạn nhất định, nên thường sẽ phát sinh khoảng dừng Stop-The-World; các bộ thu gom đồng thời (concurrent collectors) hiện đại có thể thực hiện phần lớn công việc đánh dấu (marking) song song với các Thread ứng dụng, chứ không phải toàn bộ quá trình Reachability Analysis đều phải "dừng tất cả tiến trình".

#### 3.3.9 Cách tuyên bố một đối tượng thực sự đã chết

Trước hết bắt buộc phải nhắc tới một phương thức tên là **`finalize()`**.

`finalize()` là một phương thức của lớp `Object`. Phương thức `finalize()` của một đối tượng tối đa chỉ được hệ thống tự động gọi một lần; nếu đối tượng thiết lập lại được quan hệ khả năng tiếp cận thông qua phương thức này thì ở lần bị đánh giá không thể tiếp cận tiếp theo, nó sẽ không được gọi lại nữa.

Nói thêm một câu: hoàn toàn không khuyến khích gọi `finalize()` trong chương trình để "tự cứu". Thời điểm thực thi của nó không xác định, thậm chí không đảm bảo chắc chắn sẽ được chạy, chi phí vận hành lại rất đắt đỏ và không thể đảm bảo thứ tự gọi giữa các đối tượng. `finalize()` đã bị đánh dấu deprecated từ Java 9 và được đánh dấu chờ loại bỏ (for removal) từ Java 18. Khi cần quản lý tài nguyên ngoài Heap (off-heap), tùy theo ngữ cảnh bạn có thể dùng `try-with-resources` hoặc `java.lang.ref.Cleaner`; bản thân `Cleaner` không phải tên gọi chung cho 4 loại tham chiếu strong, soft, weak, phantom.

![](/media/jg/ext/static001.geekbang.org/infoq/8d/8d7f0381c7d857c7ceb8ae5a5fef0f4a-e101993a.webp)

Đối với một đối tượng có ghi đè phương thức `finalize()` và phương thức này chưa từng được thực thi, quá trình xử lý nó thường được khái quát thành 2 lần đánh dấu:

1. Nếu sau khi thực hiện Reachability Analysis mà không tìm thấy chuỗi tham chiếu nào nối với GC Roots, đối tượng sẽ bị đánh dấu lần thứ nhất và trải qua bước sàng lọc. Với những đối tượng được xem là cần thực thi phương thức `finalize()`, HotSpot có thể đưa finalizer reference tương ứng vào hàng đợi chờ xử lý để Finalizer Thread xử lý bất đồng bộ.
2. Nếu trong phương thức `finalize()` đối tượng liên kết lại được với một đối tượng nằm trên chuỗi tham chiếu, lần thu gom rác tiếp theo sẽ đưa nó ra khỏi tập hợp "sắp bị thu hồi"; ngược lại, đối tượng vẫn có thể bị thu hồi. Quá trình này không có nghĩa là Garbage Collector sẽ chờ đồng bộ cho `finalize()` chạy xong, cũng không đảm bảo phương thức này nhất định sẽ được gọi.

Nếu đã xác định đối tượng thực sự chết, chúng ta sẽ thu hồi đống rác này như thế nào?

### 3.4 Thuật toán Garbage Collection

Để tìm hiểu chi tiết về các thuật toán Garbage Collection phổ biến, bạn nên đọc bài viết này: [Giải thích chi tiết Garbage Collection trong JVM (Trọng tâm)](https://javaguide.cn/java/jvm/jvm-garbage-collection.html).

### 3.5 (Tham khảo thêm) Các loại Garbage Collector

Các Garbage Collector trong HotSpot VM và kịch bản áp dụng tương ứng:

![](/media/jg/ext/static001.geekbang.org/infoq/9f/9ff72176ab0bf58bc43e142f69427379-070e8963.webp)

Trong cấu hình Server HotSpot JDK 8 phổ biến, tổ hợp mặc định thường là Parallel Scavenge và Parallel Old; giá trị mặc định thực tế vẫn có thể chịu ảnh hưởng bởi bản cài đặt máy ảo, chế độ chạy và nền tảng.

JDK 9 đã chọn G1 làm Garbage Collector mặc định cho Server HotSpot. Mỗi bộ thu gom đều có sự đánh đổi riêng giữa thông lượng (throughput), độ trễ (latency), mức chiếm dụng bộ nhớ và chi phí CPU; không thể tách rời khỏi tải ứng dụng và cấu hình JVM để khẳng định chắc nịch rằng một bộ thu gom nào đó luôn có thời gian tạm dừng ngắn nhất.

### 3.6 (Tham khảo thêm) Các tham số JVM thường dùng

Các tham số của JVM rất nhiều, ở đây chỉ liệt kê một số tham số quan trọng; bạn cũng có thể dễ dàng tra cứu thêm thông tin qua các công cụ tìm kiếm.

| Tên tham số                  | Ý nghĩa                                                    | Giải thích                                                                                                      |
| ---------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `-Xms`                       | Kích thước Heap ban đầu                                    | Giá trị mặc định do chiến lược thích ứng của HotSpot tính theo môi trường chạy, không nên áp thành tỷ lệ RAM cố định |
| `-Xmx`                       | Kích thước Heap tối đa                                     | Giá trị mặc định do chiến lược thích ứng của HotSpot tính theo môi trường chạy                                  |
| `-Xmn`                       | Kích thước Young Generation                                | Chỉ áp dụng cho các bộ thu gom có khái niệm Young Generation cố định; cấu hình tường minh sẽ hạn chế điều chỉnh thích ứng |
| `-XX:NewSize`                | Kích thước Young Generation ban đầu                        | Chỉ có hiệu lực với các bộ thu gom phân thế hệ hỗ trợ tham số này                                               |
| `-XX:MaxNewSize`             | Kích thước Young Generation tối đa                         | Chỉ có hiệu lực với các bộ thu gom phân thế hệ hỗ trợ tham số này                                               |
| `-XX:PermSize`               | Kích thước Permanent Generation ban đầu                    | Chỉ áp dụng cho HotSpot JDK 7 trở về trước, JDK 8 đã loại bỏ PermGen                                            |
| `-XX:MaxPermSize`            | Kích thước Permanent Generation tối đa                     | Chỉ áp dụng cho HotSpot JDK 7 trở về trước, JDK 8 đã loại bỏ PermGen                                            |
| `-Xss`                       | Kích thước Stack của mỗi Thread                            | Mặc định phụ thuộc nền tảng và phiên bản JVM, cần thiết lập dựa trên số lượng Thread, độ sâu lời gọi và kết quả test |
| `-XX:NewRatio`               | Tỷ lệ dung lượng giữa Old Generation và Young Generation   | Ví dụ giá trị là 4 thì Old : Young = 4:1; có hiệu lực hay không tùy thuộc vào bộ thu gom                        |
| `-XX:SurvivorRatio`          | Tỷ lệ dung lượng giữa Eden và một vùng Survivor            | Ví dụ giá trị là 8 thì Eden:From:To thường là 8:1:1; chiến lược thích ứng có thể điều chỉnh kích thước thực tế |
| `-XX:+DisableExplicitGC`     | Bỏ qua yêu cầu GC tường minh phát ra từ `System.gc()`      | Không đồng nghĩa với việc tắt GC tự động của JVM; cần đánh giá các tình huống như Direct Memory trước khi dùng  |
| `-XX:PretenureSizeThreshold` | Ngưỡng kích thước để đối tượng lớn cấp phát thẳng vào Old Gen | Có hỗ trợ hay không và hiệu lực thế nào tùy thuộc vào Garbage Collector                                        |
| `-XX:ParallelGCThreads`      | Số Thread GC trong giai đoạn song song Stop-The-World      | Mặc định do JVM tính toán dựa trên số bộ xử lý khả dụng và các yếu tố khác                                      |
| `-XX:MaxGCPauseMillis`       | Mục tiêu thời gian tạm dừng GC tối đa                      | Đây là mục tiêu mềm (soft goal) chứ không phải cam kết cứng; hiệu quả thực tế tùy thuộc Garbage Collector sử dụng |

Ngoài ra còn một số tham số về in log và CMS, ở đây xin phép không liệt kê từng cái một nữa.

## 4. Một số khía cạnh về tối ưu (Tuning) JVM

Dựa trên các kiến thức JVM vừa đề cập, chúng ta có thể thử tiến hành tuning JVM, trọng tâm chủ yếu nằm ở phần bộ nhớ Heap.

Đối với các bộ thu gom sử dụng bố cục phân thế hệ cố định, có thể xem gần đúng Java Heap là tổng của Young Generation và Old Generation; PermGen hay Metaspace không thuộc Java Heap. Khi tổng kích thước Heap cố định, tăng Young Generation sẽ thu hẹp không gian của Old Generation, nhưng không có một "tỷ lệ tối ưu chính thức" áp dụng cho mọi ứng dụng mà cần kiểm thử dựa trên đặc điểm cấp phát, vòng đời đối tượng và bộ thu gom đang sử dụng.

### 4.1 Điều chỉnh Heap Memory tối đa và tối thiểu

`-Xmx` và `-Xms` lần lượt quy định giá trị tối đa và giá trị khởi tạo của Java Heap. Khi không cấu hình tường minh, giá trị mặc định sẽ được HotSpot tự động tính toán thích ứng dựa trên phiên bản JVM, bộ nhớ khả dụng, giới hạn container và môi trường chạy, không nên ước lượng theo một tỷ lệ bộ nhớ vật lý cố định.

HotSpot có thể điều chỉnh dung lượng Heap đã commit trong khoảng giữa `-Xms` và `-Xmx`; `MinHeapFreeRatio` và `MaxHeapFreeRatio` là hai tham số được một số bộ thu gom sử dụng để kiểm soát tỷ lệ không gian trống sau GC. Hành vi mở rộng/thu hẹp thực tế và tỷ lệ mặc định phụ thuộc vào bộ thu gom, phiên bản JDK và chiến lược thích ứng, không thể khái quát chung thành các mốc cố định 40% và 70%.

Cấu hình `-Xms` và `-Xmx` bằng nhau giúp tránh việc thay đổi kích thước Heap đã commit trong lúc chạy, nhưng sẽ giữ trước một dung lượng Heap khá lớn ngay từ khi khởi động; có nên áp dụng hay không vẫn cần đánh giá theo môi trường triển khai và tải thực tế.

Chúng ta thực thi đoạn code sau:

```java
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");    // Không gian tối đa của hệ thống
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Không gian trống của hệ thống
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");  // Tổng không gian hiện có sẵn
```

Lưu ý: thông số cấu hình ở đây là kích thước Java Heap, tức là kích thước Young Generation + kích thước Old Generation.

![](/media/jg/ext/static001.geekbang.org/infoq/11/114f32ddd295b2e30444f42f6180538c-7d9aeca7.webp)

Thiết lập tham số VM options:

```plain
-Xmx20m -Xms5m -XX:+PrintGCDetails
```

![](/media/jg/ext/static001.geekbang.org/infoq/7e/7ea0bf0dec20e44bf95128c571d6ef0e-37f29f07.webp)

Khởi chạy lại phương thức `main`:

![](/media/jg/ext/static001.geekbang.org/infoq/c8/c89edbd0a147a791cfabdc37923c6836-134b48a9.webp)

Ở đây GC đã bật ra thông báo `Allocation Failure` (cấp phát thất bại), sự việc này xảy ra ở `PSYoungGen`, tức là trong Young Generation.

Lúc này bộ nhớ cấp phát tối đa nhận được là 18M, bộ nhớ trống là 4.214195251464844M.

Bây giờ chúng ta thử tạo một mảng byte xem sao, thực thi đoạn code dưới đây:

```java
byte[] b = new byte[1 * 1024 * 1024];
System.out.println("Đã cấp phát 1M cho mảng");
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");  // Không gian tối đa của hệ thống
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Không gian trống của hệ thống
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");
```

![](/media/jg/ext/static001.geekbang.org/infoq/db/dbeb6aea0a90949f7d7fe4746ddb11a3-d1bef71a.webp)

Lúc này `free memory` lại bị thu hẹp đi, nhưng `total memory` thì không đổi. Java sẽ cố gắng duy trì giá trị của `total mem` ở mức gần kích thước Heap tối thiểu nhất có thể.

```java
byte[] b = new byte[10 * 1024 * 1024];
System.out.println("Đã cấp phát 10M cho mảng");
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");  // Không gian tối đa của hệ thống
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Không gian trống của hệ thống
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");  // Tổng không gian hiện có sẵn
```

![](/media/jg/ext/static001.geekbang.org/infoq/b6/b6a7c522166dbd425dbb06eb56c9b071-96fafe0f.webp)

Lúc này chúng ta tạo một mảng byte 10M, mức bộ nhớ Heap tối thiểu không chịu nổi nữa. Chúng ta thấy `total memory` lúc này đã biến thành 15M, đây chính là kết quả của việc đã xin cấp phát thêm bộ nhớ một lần.

Bây giờ hãy chạy tiếp đoạn code sau:

```java
System.gc();
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");    // Không gian tối đa của hệ thống
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Không gian trống của hệ thống
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");  // Tổng không gian hiện có sẵn
```

![](/media/jg/ext/static001.geekbang.org/infoq/8d/8dd6e8fccfd1394b83251c136ee44ceb-f05cdfe0.webp)

Việc gọi `System.gc()` ở đây chỉ gửi một đề nghị thu gom rác tới JVM chứ không đảm bảo chắc chắn sẽ chạy Full GC; lần chạy trong ảnh chụp màn hình đúng là đã kích hoạt thu gom tương ứng và thu nhỏ không gian Heap đã commit, nhưng kết quả có thể khác nhau dưới các tham số JVM và bộ thu gom khác.

### 4.2 Điều chỉnh tỷ lệ giữa Young Generation và Old Generation

```plain
-XX:NewRatio --- Tỷ lệ giữa Young Generation (eden + 2*Survivor) và Old Generation (không bao gồm PermGen)

Ví dụ: -XX:NewRatio=4 nghĩa là Young Generation : Old Generation = 1:4, tức Young Generation chiếm 1/5 toàn bộ Heap. Trong trường hợp Xms=Xmx và đã thiết lập Xmn thì không cần thiết lập tham số này.
```

### 4.3 Điều chỉnh tỷ lệ giữa vùng Survivor và vùng Eden

```plain
-XX:SurvivorRatio --- Thiết lập tỷ lệ giữa hai vùng Survivor và vùng Eden

Ví dụ: 8 nghĩa là hai Survivor : Eden = 2:8, tức một vùng Survivor chiếm 1/10 của Young Generation
```

### 4.4 Thiết lập kích thước Young Generation và Old Generation

```plain
-XX:NewSize --- Thiết lập kích thước Young Generation
-XX:MaxNewSize --- Thiết lập kích thước Young Generation tối đa
```

Bạn có thể thử nghiệm nhiều tình huống bằng cách cấu hình các tham số khác nhau. Tỷ lệ khởi tạo phổ biến của Eden và hai vùng Survivor là `8:1:1`, nhưng đây không phải giải pháp tối ưu cho mọi ứng dụng và mọi bộ thu gom; việc `-Xms` khác `-Xmx` cũng không đồng nghĩa nhất định sẽ dẫn tới nhiều lần GC.

### 4.5 Tóm tắt nhanh

Nên điều chỉnh kích thước Young Generation và vùng Survivor dựa theo tải thực tế, Garbage Collector đang dùng và log GC; không tồn tại một tỷ lệ khuyến nghị cố định đúng với mọi ứng dụng.

Khi xảy ra `OOM`, hãy nhớ dump Heap ra để đảm bảo có thể điều tra lại hiện trường sự cố. Thông qua lệnh dưới đây có thể xuất ra tệp `.dump`, tệp này có thể phân tích bằng các công cụ như VisualVM. Từ JDK 9 trở đi, VisualVM không còn được đóng gói kèm Oracle JDK nữa mà cần cài đặt riêng.

```plain
-Xmx20m -Xms5m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=<duong-dan-file-log-cua-ban>
```

Thông thường chúng ta cũng có thể viết script để khi `OOM` xuất hiện sẽ báo tin cho chúng ta, chẳng hạn qua việc gửi email hoặc tự động khởi động lại ứng dụng để xử lý.

### 4.6 Cấu hình Permanent Generation (Chỉ áp dụng cho HotSpot JDK 7 trở về trước)

```plain
-XX:PermSize -XX:MaxPermSize
```

`PermSize` thiết lập kích thước khởi tạo của Permanent Generation, `MaxPermSize` thiết lập mức trần của nó; giá trị mặc định cụ thể liên quan đến phiên bản JVM và nền tảng, không thể viết cứng thành một tỷ lệ bộ nhớ vật lý cố định. Từ JDK 8 trở về sau nên chú ý đến các tham số liên quan tới Metaspace thay vì hai tham số PermGen này.

Mẹo: Nếu không gian Heap chưa dùng hết mà vẫn ném ra `OOM`, rất có thể là do Permanent Generation gây ra. Dung lượng Heap thực tế bị chiếm dụng rất ít, nhưng Permanent Generation bị tràn thì vẫn ném ra `OOM` như thường.

### 4.7 Tối ưu tham số Stack của JVM

#### 4.7.1 Điều chỉnh kích thước Stack cho mỗi Thread

Có thể dùng `-Xss` để điều chỉnh kích thước không gian Stack cho mỗi Thread.

Kích thước mặc định của Thread Stack phụ thuộc vào phiên bản JVM, nền tảng và chế độ chạy, không phải từ JDK 5 trở đi đều thống nhất là 1 MB. Khi các điều kiện khác giống nhau, giảm kích thước Thread Stack có thể chừa lại không gian địa chỉ cho nhiều platform Thread hơn, nhưng số lượng Thread còn bị giới hạn bởi hệ điều hành, và Stack quá nhỏ sẽ làm tăng nguy cơ `StackOverflowError`.

#### 4.7.2 Thiết lập kích thước Thread Stack

```plain
-XX:ThreadStackSize=<size>:
Thiết lập kích thước của Thread Stack (0 nghĩa là dùng kích thước stack mặc định)
```

Những tham số này đều có thể tự viết chương trình nhỏ để kiểm thử dễ dàng; vì giới hạn độ dài bài viết nên ở đây không đưa thêm demo nữa.

### 4.8 (Có thể bỏ qua) Giới thiệu các tham số JVM khác

Tham số đủ loại nhiều vô kể, nên tôi sẽ không lôi hết từng cái ra nói, vì thực ra mọi người cũng chẳng nhất thiết phải đào sâu đến tận cùng đâu.

#### 4.8.1 Thiết lập kích thước trang nhớ lớn (Large Memory Page)

```plain
-XX:LargePageSizeInBytes=<size>
```

Tham số này dùng để thiết lập kích thước large memory page; có hiệu lực hay không phụ thuộc vào hệ điều hành, bản build JVM và cấu hình huge pages.

#### 4.8.2 Tham số lịch sử `UseFastAccessorMethods`

```plain
-XX:+UseFastAccessorMethods
```

Tham số HotSpot phiên bản cũ này nhắm tới tối ưu các accessor của Reflection, chứ không phải "tối ưu nhanh cho kiểu nguyên thủy"; các JDK hiện đại không còn cung cấp tham số này nữa.

#### 4.8.3 Thiết lập tắt GC thủ công

```plain
-XX:+DisableExplicitGC:
Thiết lập tắt System.gc() (tham số này cần kiểm thử nghiêm ngặt)
```

#### 4.8.4 Thiết lập tuổi tối đa trước khi thăng hạng

```plain
-XX:MaxTenuringThreshold
Thiết lập giới hạn trên cho tuổi thăng hạng đối tượng. Khi đặt bằng 0, các bộ thu gom phân thế hệ hỗ trợ tham số này sẽ cho đối tượng còn sống ở Young Generation thăng hạng thẳng mà không đi qua vùng Survivor. Tăng giá trị này có thể khiến đối tượng trải qua nhiều lần sao chép hơn trong vùng Survivor, nhưng việc thăng hạng thực tế còn chịu ảnh hưởng bởi đánh giá tuổi động, dung lượng Survivor và chiến lược của bộ thu gom.
```

Không phải mọi Garbage Collector đều sử dụng cùng một cơ chế phân thế hệ và thăng hạng theo tuổi; có hiệu lực hay không cần đối chiếu với tài liệu của bộ thu gom hiện tại.

#### 4.8.5 Tham số lịch sử `AggressiveOpts`

```plain
-XX:+AggressiveOpts
```

Đây là tham số trong các phiên bản HotSpot cũ dùng để bật các tối ưu hiệu năng mang tính thử nghiệm, không thể hiểu đơn giản là "tăng tốc độ biên dịch", và đã bị loại bỏ từ JDK 12.

#### 4.8.6 Tham số lịch sử `UseBiasedLocking`

```plain
-XX:+UseBiasedLocking
```

Biased Locking (khóa thiên vị) đã bị tắt mặc định và đánh dấu deprecated từ JDK 15, phần cài đặt liên quan sau đó cũng đã bị gỡ bỏ khỏi HotSpot, không nên dùng làm tham số tuning phổ thông trên JDK hiện đại.

#### 4.8.7 Tắt việc gỡ bỏ lớp (Class Unloading)

```plain
-Xnoclassgc
```

Tham số này vô hiệu hóa Garbage Collection đối với các lớp, chứ không phải Garbage Collection đối với đối tượng.

#### 4.8.8 Thiết lập thời gian tồn tại của `SoftReference` theo không gian Heap trống

```plain
-XX:SoftRefLRUPolicyMSPerMB
Thiết lập thời gian tồn tại của SoftReference trên mỗi megabyte không gian Heap trống, giá trị mặc định là 1s.
```

#### 4.8.9 Thiết lập cấp phát đối tượng trực tiếp trên Old Generation

```plain
-XX:PretenureSizeThreshold
Thiết lập ngưỡng kích thước mà khi đối tượng vượt quá sẽ được cấp phát thẳng vào Old Generation, mặc định là 0.
```

#### 4.8.10 Thiết lập tỷ lệ TLAB chiếm trong vùng Eden

```plain
-XX:TLABWasteTargetPercent
Thiết lập phần trăm của vùng Eden mà TLAB có thể chiếm, giá trị mặc định là 1%.
```

## Lời kết

Thực sự đã chia sẻ khá dài về chủ đề này rồi, bài viết có tham khảo từ nhiều nguồn như chuỗi bài *Phân tích chuyên sâu Virtual Machine* và *Tinh hoa phỏng vấn công nghệ cốt lõi Java* trên GeekTime, tra cứu thêm, cũng như ghi chép tổng hợp của bản thân khi học các khóa học trực tuyến. Hy vọng bài viết hữu ích với bạn, xin cảm ơn!
