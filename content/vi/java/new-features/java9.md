---
title: Tổng quan tính năng mới Java 9
description: "Phân tích hệ thống module của Java 9, jlink và các cập nhật quan trọng khác, giúp hiểu rõ ảnh hưởng tới runtime image và cách sử dụng thư viện."
category: Java
tag:
  - Tính năng mới Java
lang: vi
sourceRef: zh-ref/java/new-features/java9.md
head:
  - - meta
    - name: keywords
      content: Java 9,JDK 9,Module,JPMS,jlink,Phương thức factory cho Collection,API mới
---

**Java 9** được phát hành vào ngày 21 tháng 9 năm 2017. Là phiên bản mới ra mắt sau Java 8 tới 3 năm rưỡi, Java 9 mang lại rất nhiều thay đổi lớn, trong đó thay đổi quan trọng nhất là việc đưa vào Java Platform Module System, bên cạnh các cải tiến về Collection, `Stream`...

JDK 9 không phải là phiên bản LTS (Long-Term Support - hỗ trợ dài hạn). Các phiên bản LTS hiện được Oracle liệt kê bao gồm JDK 8, JDK 11, JDK 17, JDK 21 và JDK 25.

Bài viết này sẽ chọn lọc và giới thiệu chi tiết một số tính năng mới quan trọng:

- [JEP 222: Java Shell Tool (JShell)](https://openjdk.org/jeps/222)
- [JEP 261: Module System (Hệ thống Module)](https://openjdk.org/jeps/261)
- [JEP 248: G1 Becomes the Default Garbage Collector (G1 trở thành Garbage Collector mặc định)](https://openjdk.org/jeps/248)
- [JEP 254: Compact Strings (Chuỗi nén)](https://openjdk.org/jeps/254)
- [JEP 193: Variable Handles](https://openjdk.org/jeps/193)

Hình dưới đây là số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 222: Java Shell Tool (JShell)

JShell là một công cụ tiện ích mới được bổ sung trong Java 9, cung cấp cho Java một công cụ tương tác dòng lệnh theo thời gian thực tương tự như Python.

Trong JShell, bạn có thể nhập trực tiếp các biểu thức và xem ngay kết quả thực thi của chúng.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210816083417616-fb59a20e.png)

**JShell mang lại cho chúng ta những lợi ích gì?**

1. Hạ thấp rào cản để xuất ra dòng `"Hello World!"` đầu tiên bằng Java, giúp nâng cao hứng thú học tập cho người mới.
2. Khi xử lý các đoạn logic nhỏ, đơn giản hoặc kiểm chứng nhanh các vấn đề nhỏ, nó hiệu quả hơn IDE (không phải để thay thế IDE; với việc kiểm chứng logic phức tạp thì IDE vẫn phù hợp hơn, cả hai bổ trợ cho nhau).
3. ...

**Code trong JShell và code Java biên dịch thông thường có gì khác nhau?**

1. Ngay khi câu lệnh được nhập xong, JShell sẽ biên dịch và thực thi code ở chế độ nền rồi trả về kết quả ngay lập tức, người dùng không cần tự tay chạy `javac` và `java`.
2. JShell hỗ trợ khai báo lại biến, khai báo sau sẽ ghi đè khai báo trước.
3. JShell hỗ trợ các biểu thức độc lập, chẳng hạn như phép cộng thông thường `1 + 1`.
4. ...

## JEP 261: Module System (Hệ thống Module)

Hệ thống module là một phần của [Project Jigsaw](https://openjdk.java.net/projects/jigsaw/), đưa thực hành phát triển theo hướng mô-đun vào nền tảng Java, giúp mã nguồn của chúng ta có khả năng tái sử dụng tốt hơn.

**Hệ thống module là gì?** Định nghĩa chính thức là:

> A uniquely named, reusable group of related packages, as well as resources (such as images and XML files) and a module descriptor.

Nói một cách đơn giản, bạn có thể xem một module là một nhóm các package có tên duy nhất, có thể tái sử dụng, cùng với tài nguyên (như hình ảnh, file XML) và file mô tả module (`module-info.java`).

Bất kỳ file jar nào, chỉ cần thêm vào một file mô tả module (`module-info.java`), đều có thể nâng cấp thành một module.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/module-structure-49f281d9.png)

Sau khi đưa vào hệ thống module, JDK được tổ chức lại thành 94 module. Các ứng dụng Java có thể thông qua công cụ mới **[jlink](http://openjdk.java.net/jeps/282)** (`jlink` là công cụ dòng lệnh mới phát hành cùng Java 9, cho phép lập trình viên tạo ra JRE tùy chỉnh gọn nhẹ cho các ứng dụng Java dựa trên module) để tạo runtime image tùy biến chỉ chứa các module JDK mà ứng dụng phụ thuộc. Cách này giúp giảm đáng kể kích thước của môi trường chạy Java.

Chúng ta có thể dùng từ khóa `exports` để kiểm soát những package nào được mở ra cho bên ngoài sử dụng, cũng như những package đó được phép mở cho những module cụ thể nào.

```java
module my.module {
    // exports công khai toàn bộ thành phần public của package được chỉ định
    exports com.my.package.name;
}

module my.module {
    // exports ... to xuất có định hướng package được chỉ định cho module mục tiêu
    exports com.my.package.name to com.specific.module;
}
```

Nếu muốn tìm hiểu sâu hơn về hệ thống module của Java 9, bạn có thể tham khảo các bài viết dưới đây:

- [Project Jigsaw: Module System Quick-Start Guide](https://openjdk.java.net/projects/jigsaw/quick-start)
- [Java 9 Modules: part 1](https://stacktraceguru.com/java9/module-introduction)
- [Giải mã Java 9 (2. Hệ thống Module) [Tiếng Trung]](http://www.cnblogs.com/IcanFixIt/p/6947763.html)

## JEP 248: G1 Becomes the Default Garbage Collector (G1 trở thành Garbage Collector mặc định)

Ở thời điểm Java 8, Garbage Collector mặc định là Parallel Scavenge (Young Generation) + Parallel Old (Old Generation). Sang Java 9, bộ thu gom rác CMS bị đánh dấu lỗi thời (deprecated) và **G1 (Garbage-First Garbage Collector)** trở thành Garbage Collector mặc định.

G1 đã được đưa vào từ Java 7 và sau hai phiên bản thể hiện hiệu năng vượt trội, nó chính thức trở thành bộ thu gom rác mặc định.

## JEP 193: Variable Handles

Variable Handle là một tham chiếu tới một biến hoặc một nhóm biến, bao gồm static field, non-static field, phần tử mảng và các thành phần trong cấu trúc dữ liệu ngoài Heap (off-heap).

Ý nghĩa của Variable Handle tương tự như `MethodHandle` đã có từ trước, được biểu diễn bởi lớp Java `java.lang.invoke.VarHandle`; có thể tạo đối tượng `VarHandle` bằng các phương thức tìm kiếm của instance `java.lang.invoke.MethodHandles.Lookup` hoặc các cách tương tự.

`VarHandle` xuất hiện nhằm thay thế một phần thao tác của `java.util.concurrent.atomic` và `sun.misc.Unsafe`. Đồng thời nó cung cấp một loạt thao tác Memory Barrier (rào cản bộ nhớ) tiêu chuẩn để kiểm soát thứ tự bộ nhớ chi tiết hơn. Về độ an toàn, tính dễ dùng và hiệu năng, nó đều vượt trội hơn các API hiện có.

## Cải tiến API

Không phải mọi thay đổi API đều được phát hành thông qua JEP (Java Enhancement Proposal).

Trong quy trình phát triển JDK: **JEP** thường dùng cho các thay đổi lớn, chẳng hạn như đưa vào tính năng ngôn ngữ mới, cơ chế JVM mới hoặc tái cấu trúc thư viện quy mô lớn. Những thao tác như thêm một vài phương thức factory kiểu `List.of()` vào các lớp sẵn có thường được xem là bảo trì thư viện thông thường. Chúng được các lập trình viên JDK gửi trực tiếp qua ticket trên **JBS (JDK Bug System)** để đánh giá rồi phát hành trực tiếp theo phiên bản.

### Cải tiến Collection

Bổ sung các phương thức factory như `List.of()`, `Set.of()`, `Map.of()` và `Map.ofEntries()` để tạo các Collection bất biến (immutable collection, có nét tham khảo từ Guava):

```java
List.of("Java", "C++");
Set.of("Java", "C++");
Map.of("Java", 1, "C++", 2);
```

Collection được tạo bằng `of()` là bất biến, không thể thực hiện các thao tác thêm, xóa, thay thế, sắp xếp..., nếu không sẽ ném ra ngoại lệ `java.lang.UnsupportedOperationException`.

### Cải tiến Stream

`Stream` được bổ sung các phương thức mới `ofNullable()`, `dropWhile()`, `takeWhile()` cùng phương thức nạp chồng (`Overload`) của `iterate()`.

Trong Java 9, `ofNullable()` có thể tạo ra một `Stream` một phần tử hoặc rỗng từ một giá trị có khả năng là `null`. Java 8 vốn đã có thể tạo stream rỗng qua `Stream.empty()`, nhưng chưa có phương thức tiện lợi để chuyển trực tiếp giá trị có thể null thành stream như vậy.

```java
Stream<String> stringStream = Stream.ofNullable("Java");
System.out.println(stringStream.count());// 1
Stream<String> nullStream = Stream.ofNullable(null);
System.out.println(nullStream.count());//0
```

Phương thức `takeWhile()` sẽ lần lượt lấy các phần tử thỏa mãn điều kiện từ `Stream`, và dừng lại ngay khi gặp phần tử không thỏa mãn điều kiện.

```java
List<Integer> integerList = List.of(11, 33, 66, 8, 9, 13);
integerList.stream().takeWhile(x -> x < 50).forEach(System.out::println);// 11 33
```

Phương thức `dropWhile()` có hiệu ứng ngược lại với `takeWhile()`.

```java
List<Integer> integerList2 = List.of(11, 33, 66, 8, 9, 13);
integerList2.stream().dropWhile(x -> x < 50).forEach(System.out::println);// 66 8 9 13
```

Phương thức nạp chồng (`Overload`) mới của `iterate()` cung cấp thêm một tham số `Predicate` (điều kiện kiểm tra) để quyết định khi nào kết thúc vòng lặp:

```java
public static<T> Stream<T> iterate(final T seed, final UnaryOperator<T> f) {
}
// Phương thức nạp chồng mới được bổ sung
public static<T> Stream<T> iterate(T seed, Predicate<? super T> hasNext, UnaryOperator<T> next) {

}
```

So sánh cách sử dụng giữa hai phương thức như sau; phương thức `iterate()` nạp chồng mới linh hoạt hơn.

```java
// Dùng phương thức iterate() gốc để in các số 1~10
Stream.iterate(1, i -> i + 1).limit(10).forEach(System.out::println);
// Dùng phương thức iterate() nạp chồng mới để in các số 1~10
Stream.iterate(1, i -> i <= 10, i -> i + 1).forEach(System.out::println);
```

### Cải tiến Optional

Lớp `Optional` bổ sung các phương thức mới như `ifPresentOrElse()`, `or()` và `stream()`.

`ifPresentOrElse()` nhận hai tham số là `Consumer` và `Runnable`: nếu `Optional` không rỗng thì gọi tham số `Consumer`, nếu rỗng thì gọi tham số `Runnable`.

```java
public void ifPresentOrElse(Consumer<? super T> action, Runnable emptyAction)

Optional<Object> objectOptional = Optional.empty();
objectOptional.ifPresentOrElse(System.out::println, () -> System.out.println("Empty!!!"));// Empty!!!
```

`or()` nhận một tham số `Supplier`: nếu `Optional` rỗng thì trả về giá trị `Optional` do `Supplier` chỉ định.

```java
public Optional<T> or(Supplier<? extends Optional<? extends T>> supplier)

Optional<Object> objectOptional = Optional.empty();
objectOptional.or(() -> Optional.of("java")).ifPresent(System.out::println);//java
```

### Cải tiến String

Ở Java 8 và các phiên bản trước đó, `String` luôn dùng `char[]` để lưu trữ. Từ Java 9 trở đi, phần cài đặt của `String` chuyển sang dùng mảng `byte[]` để lưu chuỗi, giúp tiết kiệm không gian bộ nhớ.

```java
public final class String implements java.io.Serializable,Comparable<String>, CharSequence {
    // Annotation @Stable biểu thị biến chỉ được sửa đổi tối đa một lần, gọi là "ổn định".
    @Stable
    private final byte[] value;
}
```

### Cải tiến Interface

Java 9 cho phép sử dụng phương thức `private` trong interface. Nhờ vậy việc sử dụng interface trở nên linh hoạt hơn, gần giống như một lớp trừu tượng (abstract class) thu gọn.

```java
public interface MyInterface {
    private void methodPrivate(){
    }
}
```

### Cải tiến IO

Trước Java 9, chúng ta chỉ có thể khai báo biến trực tiếp bên trong khối `try-with-resources`:

```java
try (Scanner scanner = new Scanner(new File("testRead.txt"));
    PrintWriter writer = new PrintWriter(new File("testWrite.txt"))) {
    // omitted
}
```

Từ Java 9 trở đi, câu lệnh `try-with-resources` có thể sử dụng các biến `effectively-final` đã khai báo trước đó.

```java
final Scanner scanner = new Scanner(new File("testRead.txt"));
PrintWriter writer = new PrintWriter(new File("testWrite.txt"));
try (scanner; writer) {
    // omitted
}
```

**Biến `effectively-final` là gì?** Hiểu đơn giản là biến không được gắn từ khóa `final`, nhưng giá trị của nó sau khi khởi tạo chưa bao giờ bị thay đổi.

Như đoạn code trên minh họa, dù biến `writer` không được khai báo tường minh là `final`, nhưng sau lần gán đầu tiên nó không hề bị thay đổi nữa; do đó, nó chính là một biến `effectively-final`.

### Process API

Java 9 bổ sung interface `java.lang.ProcessHandle` để quản lý các tiến trình gốc (native process) của hệ điều hành, đặc biệt phù hợp để quản lý các tiến trình chạy dài hạn.

```java
// Lấy process của JVM đang chạy hiện tại
ProcessHandle currentProcess = ProcessHandle.current();
// In ra id của process
System.out.println(currentProcess.pid());
// In ra thông tin của process
System.out.println(currentProcess.info());
```

Tổng quan interface `ProcessHandle`:

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210816104614414-333a551d.png)

### Các cải tiến API khác

**Reactive Streams**

Trong Java 9, lớp `java.util.concurrent.Flow` đã bổ sung các interface cốt lõi của đặc tả Reactive Streams.

`Flow` bao gồm 4 interface cốt lõi: `Flow.Publisher`, `Flow.Subscriber`, `Flow.Subscription` và `Flow.Processor`. Java 9 còn cung cấp `SubmissionPublisher` làm một cài đặt của `Flow.Publisher`.

Để đọc giải thích chi tiết hơn về Reactive Streams trong Java 9, bạn nên xem bài viết [Giải mã Java 9 (17. Reactive Streams) - Lin Bentuo [Tiếng Trung]](https://www.cnblogs.com/IcanFixIt/p/7245377.html).

## Khác

- **Cải tiến Platform Logging API**: Java 9 cho phép cấu hình cùng một cài đặt logging cho cả JDK và ứng dụng. Bổ sung `System.LoggerFinder` để quản lý cài đặt logger mà JDK sử dụng. JVM khi chạy chỉ có duy nhất một instance `LoggerFinder` phạm vi toàn hệ thống. Chúng ta có thể thêm cài đặt `System.LoggerFinder` của riêng mình để JDK và ứng dụng cùng sử dụng các framework ghi log khác như SLF4J.
- **Cải tiến lớp `CompletableFuture`**: Bổ sung thêm một số phương thức mới (`completeAsync`, `orTimeout`...).
- **Cải tiến engine Nashorn**: Nashorn là engine JavaScript được đưa vào từ Java 8; Java 9 đã cải tiến Nashorn và hiện thực thêm một số tính năng mới của ES6 (đã bị đánh dấu lỗi thời trong Java 11).
- **Tính năng mới của I/O Stream**: Bổ sung các phương thức mới để đọc và sao chép dữ liệu chứa trong `InputStream`.
- **Cải thiện tính bảo mật của ứng dụng**: Java 9 bổ sung 4 thuật toán băm SHA-3 là SHA3-224, SHA3-256, SHA3-384 và SHA3-512.
- **Cải tiến Method Handle**: Method Handle được đưa vào từ Java 7; Java 9 bổ sung thêm nhiều phương thức static trong lớp `java.lang.invoke.MethodHandles` để tạo các loại Method Handle khác nhau.
- ...

## Tài liệu tham khảo

- Java version history: <https://en.wikipedia.org/wiki/Java_version_history>
- Release Notes for JDK 9 and JDK 9 Update Releases: <https://www.oracle.com/java/technologies/javase/9-all-relnotes.html>
- *Phân tích chuyên sâu tính năng mới của Java* - GeekTime - JShell: Làm sao kiểm chứng nhanh các vấn đề nhỏ đơn giản?
- New Features in Java 9: <https://www.baeldung.com/new-java-9>
- Java – Try with Resources: <https://www.baeldung.com/java-try-with-resources>
