---
title: Giải thích chi tiết quá trình Class Loading
description: Phân tích chi tiết từng giai đoạn và các điểm cốt lõi của quá trình nạp lớp (Class Loading) trong JVM, giúp hiểu rõ hành vi cụ thể của Verification, Preparation, Resolution và Initialization.
category: Java
tag:
  - JVM
lang: vi
sourceRef: zh-ref/java/jvm/class-loading-process.md
head:
  - - meta
    - name: keywords
      content: Class Loading,Loading,Verification,Preparation,Resolution,Initialization,clinit,Constant Pool
---

## Vòng đời của một lớp

Từ lúc một lớp bắt đầu được nạp vào bộ nhớ của máy ảo cho đến khi bị gỡ bỏ (unload) khỏi bộ nhớ, toàn bộ vòng đời của nó có thể tóm gọn thành 7 giai đoạn: Loading (Nạp), Verification (Xác minh), Preparation (Chuẩn bị), Resolution (Phân giải), Initialization (Khởi tạo), Using (Sử dụng) và Unloading (Gỡ bỏ). Trong đó, ba giai đoạn Verification, Preparation và Resolution được gọi chung là Linking (Liên kết).

Thứ tự của 7 giai đoạn này được thể hiện như hình dưới đây:

![Vòng đời đầy đủ của một lớp](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/lifecycle-of-a-class-3bd4c6b2.png)

## Quá trình Class Loading

**Tệp Class cần được nạp vào máy ảo rồi mới có thể chạy và sử dụng, vậy máy ảo nạp các tệp Class này như thế nào?**

Hệ thống nạp các tệp kiểu Class qua 3 bước chính: **Loading -> Linking -> Initialization**. Quá trình Linking lại được chia tiếp thành 3 bước: **Verification -> Preparation -> Resolution**.

![Quá trình Class Loading](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-loading-procedure-a4b72893.png)

Xem thêm chi tiết tại [Java Virtual Machine Specification - 5.3. Creation and Loading](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-5.html#jvms-5.3 "Java Virtual Machine Specification - 5.3. Creation and Loading").

### Loading

Bước đầu tiên của quá trình Class Loading, chủ yếu thực hiện 3 công việc sau:

1. Dựa vào tên đầy đủ của lớp (fully qualified name) để lấy luồng byte nhị phân (binary byte stream) định nghĩa lớp này.
2. Chuyển đổi cấu trúc lưu trữ tĩnh do luồng byte biểu diễn thành cấu trúc dữ liệu runtime của Method Area.
3. Tạo ra một đối tượng `Class` đại diện cho lớp này trong bộ nhớ, đóng vai trò là điểm truy cập vào các dữ liệu đó trong Method Area.

3 điểm trên trong đặc tả máy ảo (JVM Specification) không quy định quá chi tiết nên có tính linh hoạt rất cao. Ví dụ: "dựa vào tên đầy đủ của lớp để lấy luồng byte nhị phân định nghĩa lớp này" không chỉ rõ cụ thể phải lấy từ đâu (`ZIP`, `JAR`, `EAR`, `WAR`, qua mạng, sinh động tại runtime bằng kỹ thuật Dynamic Proxy, sinh ra từ các tệp khác như `JSP`...) hay lấy bằng cách nào.

Bước Loading này chủ yếu được thực hiện thông qua **ClassLoader** mà chúng ta sẽ đề cập ở phần sau. Có nhiều loại ClassLoader khác nhau; khi muốn nạp một lớp, cụ thể ClassLoader nào sẽ nạp nó được quyết định bởi **Mô hình ủy quyền cha (Parent Delegation Model)** (tuy nhiên, chúng ta cũng có thể phá vỡ mô hình ủy quyền cha này).

> ClassLoader và mô hình ủy quyền cha cũng là những kiến thức rất quan trọng; nội dung này được trình bày chi tiết trong bài viết [Giải thích chi tiết ClassLoader](https://javaguide.cn/java/jvm/classloader.html "Giải thích chi tiết ClassLoader"). Khi đọc bài viết này, bạn chỉ cần biết có sự tồn tại của cơ chế này là đủ.

Mỗi lớp không phải mảng (non-array class) hoặc interface đều được tạo bởi một ClassLoader. Các lớp mảng (array class) không được tạo thông qua `ClassLoader`, mà được JVM tự động tạo ra khi cần; defining ClassLoader của một mảng kiểu tham chiếu trùng với defining ClassLoader của kiểu phần tử cấu thành nó, còn phương thức `getClassLoader()` của mảng kiểu nguyên thủy sẽ trả về `null`.

Giai đoạn Loading của một lớp không phải mảng (hành động lấy luồng byte nhị phân của lớp) có tính kiểm soát rất cao. Thông thường, bạn có thể kế thừa `ClassLoader` và ghi đè (`Override`) phương thức `findClass()` để kiểm soát cách lấy luồng byte, đồng thời giữ nguyên quy trình ủy quyền cha do `loadClass()` thực hiện; chỉ khi thực sự cần thay đổi quy tắc ủy quyền mới cần ghi đè `loadClass()`.

Một phần của giai đoạn Loading và một số hành động trong giai đoạn Linking (như một phần kiểm tra định dạng tệp bytecode) diễn ra đan xen nhau: khi giai đoạn Loading chưa kết thúc hoàn toàn thì giai đoạn Linking có thể đã bắt đầu rồi.

### Verification

**Verification là bước đầu tiên của giai đoạn Linking. Mục đích của giai đoạn này là đảm bảo thông tin chứa trong luồng byte của tệp Class tuân thủ đầy đủ mọi ràng buộc của *Đặc tả Máy ảo Java (Java Virtual Machine Specification)*, đảm bảo rằng khi những thông tin này được thực thi như mã lệnh sẽ không gây nguy hại đến sự an toàn của chính máy ảo.**

Bước Verification tiêu tốn khá nhiều tài nguyên trong toàn bộ quá trình Class Loading, nhưng rất cần thiết vì nó giúp ngăn chặn hiệu quả việc thực thi mã độc. Trong mọi tình huống, an toàn chương trình luôn là ưu tiên hàng đầu.

HotSpot từng cung cấp hai tùy chọn `-Xverify:none` và `-noverify` để tắt phần lớn bước kiểm tra lớp, nhưng điều này làm suy yếu cơ chế kiểm tra bảo mật bytecode và không nên dùng làm biện pháp tối ưu phổ biến trên môi trường production. Cả hai tùy chọn này đã bị đánh dấu deprecated từ JDK 13, và các phiên bản JDK hiện đại còn có thể bỏ qua hoặc loại bỏ chúng.

Giai đoạn Verification chủ yếu gồm bốn bước kiểm tra:

1. Kiểm tra định dạng tệp (File Format Verification — kiểm tra định dạng tệp Class)
2. Kiểm tra siêu dữ liệu (Metadata Verification — kiểm tra ngữ nghĩa bytecode)
3. Kiểm tra bytecode (Bytecode Verification — kiểm tra ngữ nghĩa chương trình)
4. Kiểm tra tham chiếu ký hiệu (Symbolic Reference Verification — kiểm tra tính đúng đắn của lớp)

![Sơ đồ minh họa giai đoạn Verification](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-loading-process-verification-71298c86.png)

Bước kiểm tra định dạng tệp được thực hiện dựa trên luồng byte nhị phân của lớp, với mục đích chính là đảm bảo luồng byte đầu vào có thể được phân tích chính xác và lưu trữ bên trong Method Area, đồng thời định dạng đáp ứng yêu cầu mô tả một kiểu dữ liệu Java. Ngoại trừ bước này, ba bước kiểm tra còn lại đều thực hiện trên cấu trúc lưu trữ trong Method Area chứ không còn đọc hay thao tác trực tiếp với luồng byte nữa.

> Method Area là một vùng logic thuộc các vùng dữ liệu runtime của JVM và được chia sẻ giữa tất cả các Thread. Khi máy ảo cần sử dụng một lớp, nó cần đọc và phân tích tệp Class để lấy các thông tin liên quan, rồi lưu thông tin đó vào Method Area. Method Area sẽ lưu trữ **thông tin lớp, thông tin trường, thông tin phương thức, hằng số, biến tĩnh (static variable), bộ nhớ đệm mã sau khi biên dịch bởi JIT Compiler, v.v.** đã được máy ảo nạp.
>
> Để tìm hiểu chi tiết về Method Area, bạn nên đọc bài viết [Giải thích chi tiết vùng nhớ Java](https://javaguide.cn/java/jvm/memory-area.html "Giải thích chi tiết vùng nhớ Java").

Kiểm tra tham chiếu ký hiệu diễn ra trong giai đoạn Resolution của quá trình Class Loading, cụ thể là lúc JVM chuyển đổi Symbolic Reference (tham chiếu ký hiệu) thành Direct Reference (tham chiếu trực tiếp) (khái niệm Symbolic Reference và Direct Reference sẽ được giới thiệu ở giai đoạn Resolution).

Mục đích chính của kiểm tra tham chiếu ký hiệu là đảm bảo giai đoạn Resolution có thể thực thi bình thường. Nếu không vượt qua được bước kiểm tra này, JVM sẽ ném ra ngoại lệ, ví dụ như:

- `java.lang.IllegalAccessError`: Được ném ra khi lớp cố gắng truy cập hoặc sửa đổi một field mà nó không có quyền truy cập, hoặc gọi một phương thức mà nó không có quyền gọi.
- `java.lang.NoSuchFieldError`: Được ném ra khi lớp cố gắng truy cập hoặc sửa đổi một field được chỉ định của đối tượng, nhưng đối tượng đó không còn chứa field này nữa.
- `java.lang.NoSuchMethodError`: Được ném ra khi lớp cố gắng gọi một phương thức được chỉ định nhưng phương thức đó không tồn tại.
- ......

### Preparation

**Giai đoạn Preparation là giai đoạn chính thức cấp phát bộ nhớ cho biến lớp (class variable) và gán giá trị khởi tạo ban đầu cho chúng**, toàn bộ bộ nhớ này đều được cấp phát trong Method Area. Với giai đoạn này cần lưu ý các điểm sau:

1. Bộ nhớ được cấp phát lúc này chỉ bao gồm biến lớp (Class Variables, tức biến tĩnh được khai báo với từ khóa `static`, chỉ gắn với lớp nên gọi là biến lớp), không bao gồm biến thực thể (instance variable). Biến thực thể sẽ được cấp phát trên Java Heap cùng với đối tượng khi đối tượng được khởi tạo.
2. Về mặt khái niệm, toàn bộ bộ nhớ mà biến lớp sử dụng đều phải được cấp phát trong **Method Area**. Tuy nhiên có một điểm cần chú ý: trước JDK 7, khi HotSpot dùng PermGen để hiện thực Method Area, cách cài đặt hoàn toàn khớp với khái niệm logic này. Nhưng từ JDK 7 trở đi, HotSpot đã di chuyển String Constant Pool, biến tĩnh, v.v. vốn đặt trong PermGen sang Heap; khi đó biến lớp sẽ được lưu trữ cùng đối tượng `Class` trên Java Heap. Đọc thêm: [Đính chính sách *Understanding the Java Virtual Machine (3rd Edition)* #75](https://github.com/fenixsoft/jvm_book/issues/75 "Đính chính sách Understanding the Java Virtual Machine (3rd Edition) #75")
3. Giá trị ban đầu được gán ở đây thường là giá trị mặc định bằng 0 (zero value) của kiểu dữ liệu (như `0`, `0L`, `null`, `false`, v.v.). Ví dụ khi định nghĩa `public static int value=111`, `value` trong giai đoạn Preparation thường nhận giá trị `0` trước, rồi đến giai đoạn Initialization mới được gán thành `111`. Trường hợp đặc biệt là khi field có thuộc tính `ConstantValue`, ở giai đoạn Preparation nó sẽ được gán trực tiếp giá trị do thuộc tính này chỉ định; các hằng số tại thời điểm biên dịch như `public static final int value=111` là ví dụ điển hình, nhưng không phải mọi field `static final` đều có thuộc tính `ConstantValue`.

**Giá trị mặc định (zero value) của các kiểu dữ liệu nguyên thủy**: (Hình trích từ sách *Understanding the Java Virtual Machine*, ấn bản thứ 3, mục 7.3.3)

![Giá trị mặc định của các kiểu dữ liệu nguyên thủy](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/.png-bbe42f86.png)

### Resolution

**Giai đoạn Resolution là quá trình máy ảo xác định động các giá trị cụ thể từ các tham chiếu ký hiệu (Symbolic Reference) trong Runtime Constant Pool.** Đặc tả hiện tại liên quan đến các tham chiếu ký hiệu cho lớp hoặc interface, field, method, interface method, method type, method handle, dynamically-computed call site cũng như dynamically-computed constant.

Sách *Understanding the Java Virtual Machine* (ấn bản thứ 3, mục 7.3.4) giải thích về Symbolic Reference và Direct Reference như sau:

![Symbolic Reference và Direct Reference](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/symbol-reference-and-direct-reference-cc13b560.png)

Ví dụ: khi chương trình gọi một phương thức, máy ảo cần căn cứ vào tham chiếu ký hiệu của phương thức để xác định phương thức thực tế cần gọi. Các máy ảo như HotSpot có thể sử dụng bảng phương thức (method table), địa chỉ điểm vào (entry address) hoặc các cấu trúc nội bộ khác để tăng tốc lời gọi, nhưng các cách biểu diễn này là chi tiết cài đặt riêng chứ không phải độ lệch (offset) trong bảng phương thức được quy định thống nhất bởi *Đặc tả Máy ảo Java*.

Tóm lại, giai đoạn Resolution là quá trình máy ảo dựa vào tham chiếu ký hiệu trong Runtime Constant Pool để xác định các mục tiêu cụ thể như lớp, field, method hoặc dynamic call site; biểu diễn nội bộ của Direct Reference không nhất thiết phải là con trỏ bộ nhớ hay một giá trị offset cố định.

### Initialization

**Giai đoạn Initialization sẽ thực thi phương thức khởi tạo của lớp hoặc interface là `<clinit>()` (nếu trình biên dịch có sinh ra phương thức này). Đây là bước cuối cùng của quá trình Class Loading.**

> Lưu ý: Trình biên dịch sinh ra `<clinit>()` dựa trên các biểu thức khởi tạo field tĩnh và khối khởi tạo tĩnh (static block); nếu không có đoạn mã khởi tạo lớp nào cần thực thi thì phương thức này có thể không tồn tại trong tệp Class.

JVM sẽ đồng bộ hóa quá trình Initialization của một lớp hoặc interface để đảm bảo tại cùng một thời điểm chỉ có một Thread thực thi phương thức khởi tạo của nó; điều này không có nghĩa là bản thân phương thức `<clinit>()` mang một lock ở mức Java. Các Thread khác có thể bị block khi chờ lớp đó hoàn tất quá trình Initialization.

Đối với giai đoạn Initialization, các kịch bản sử dụng chủ động (active use) chính được đặc tả liệt kê gồm:

1. Khi gặp một trong 4 lệnh bytecode là `new`, `getstatic`, `putstatic` hoặc `invokestatic`:
   - `new`: Tạo một đối tượng thực thể của lớp.
   - `getstatic`, `putstatic`: Đọc hoặc gán giá trị cho một field tĩnh của kiểu dữ liệu (ngoại trừ các field tĩnh được khai báo với `final` và kết quả đã được đưa vào Constant Pool ngay tại thời điểm biên dịch).
   - `invokestatic`: Gọi một phương thức tĩnh của lớp.
2. Khi sử dụng các phương thức trong gói `java.lang.reflect` để gọi lớp thông qua Reflection, chẳng hạn `Class.forName("...")`, `newInstance()`, v.v. Nếu lớp chưa được khởi tạo, cần kích hoạt quá trình Initialization của nó.
3. Khi khởi tạo một lớp, nếu lớp cha (superclass) của nó chưa được khởi tạo thì kích hoạt Initialization cho lớp cha đó trước.
4. Khi máy ảo khởi động, người dùng cần chỉ định một lớp chính để thực thi (lớp chứa phương thức `main`), máy ảo sẽ khởi tạo lớp này trước tiên.
5. Khi gọi lần đầu một `MethodHandle` có kết quả phân giải là `REF_getStatic`, `REF_putStatic`, `REF_invokeStatic` hoặc `REF_newInvokeSpecial`, cần khởi tạo lớp hoặc interface khai báo mục tiêu đó.
6. **Bổ sung (từ [issue745](https://github.com/Snailclimb/JavaGuide/issues/745 "issue745"))**: Khi một interface định nghĩa phương thức mặc định được bổ sung từ JDK 8 (phương thức interface dùng từ khóa `default`), nếu một lớp cài đặt (implementation class) của interface đó được khởi tạo thì interface đó phải được khởi tạo trước nó.

## Gỡ bỏ lớp (Class Unloading)

> Phần Class Unloading này được bổ sung và hoàn thiện từ [issue#662](https://github.com/Snailclimb/JavaGuide/issues/662 "issue#662") bởi **[guang19](https://github.com/guang19 "guang19")**.

Class Unloading là quá trình JVM thu hồi phần biểu diễn trong Method Area của một lớp hoặc interface cùng các tài nguyên liên quan đến nó. Theo *Đặc tả Ngôn ngữ Java (Java Language Specification)*, một lớp hoặc interface chỉ có thể bị unload khi defining ClassLoader của nó có thể bị Garbage Collection thu hồi; các lớp hoặc interface được định nghĩa bởi Bootstrap ClassLoader không thể bị unload. Trong các ứng dụng HotSpot thông thường, việc này thường xảy ra với các custom ClassLoader có thể bị thu hồi và các lớp do chúng định nghĩa.

Khi đánh giá xem một lớp có khả năng bị unload trong HotSpot hay không, thông thường có thể hiểu qua ba điều kiện sau:

1. Toàn bộ đối tượng thực thể (instance) của lớp đó đều đã bị GC thu hồi, nghĩa là không còn đối tượng thực thể nào của lớp đó tồn tại trên Heap.
2. Lớp đó không bị tham chiếu ở bất kỳ nơi nào khác.
3. Thực thể ClassLoader của lớp đó đã bị GC thu hồi.

Đáp ứng các điều kiện này chỉ cho biết lớp đó đủ điều kiện để bị unload, chứ không đảm bảo JVM sẽ lập tức hoặc chắc chắn unload nó. Các lớp do Bootstrap ClassLoader tạo ra sẽ không bị unload; còn các lớp do custom ClassLoader tạo ra thì có thể bị unload.

Thông thường, Bootstrap ClassLoader, Platform ClassLoader và Application ClassLoader đi kèm trong JDK sẽ tồn tại lâu dài cùng vòng đời của JVM; còn các thực thể custom ClassLoader thì có thể trở thành không thể tiếp cận (unreachable), nên các lớp do chúng định nghĩa có thể đáp ứng điều kiện để bị unload. Từ JDK 9, Extension ClassLoader trước đây đã được thay thế bằng Platform ClassLoader.

**Tài liệu tham khảo**

- *Understanding the Java Virtual Machine*
- *Practical Java Virtual Machine*
- Chapter 5. Loading, Linking, and Initializing - Java Virtual Machine Specification: <https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-5.html#jvms-5.4>
