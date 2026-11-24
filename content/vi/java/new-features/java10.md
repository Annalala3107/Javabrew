---
title: Tổng quan tính năng mới Java 10
description: "Tổng quan các cập nhật chính của JDK 10, tập trung giới thiệu suy luận kiểu var và các cải tiến nền tảng khác."
category: Java
tag:
  - Tính năng mới Java
lang: vi
sourceRef: zh-ref/java/new-features/java10.md
head:
  - - meta
    - name: keywords
      content: Java 10,JDK 10,suy luận kiểu biến cục bộ var,cải tiến Garbage Collection,hiệu năng
---

**Java 10** được phát hành vào ngày 20 tháng 3 năm 2018. Đây là một phiên bản không phải LTS (hỗ trợ dài hạn), Oracle chỉ cung cấp 6 tháng hỗ trợ.

Hình dưới đây là số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25:

![Số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Bài viết này sẽ chọn lọc và giới thiệu chi tiết một số tính năng mới quan trọng:

- [JEP 286: Local-Variable Type Inference (Suy luận kiểu biến cục bộ)](https://openjdk.org/jeps/286)
- [JEP 304: Garbage-Collector Interface (Giao diện Garbage Collector)](https://openjdk.org/jeps/304)
- [JEP 307: Parallel Full GC for G1 (Full GC song song cho G1)](https://openjdk.org/jeps/307)
- [JEP 310: Application Class-Data Sharing (Chia sẻ dữ liệu lớp ở mức ứng dụng)](https://openjdk.org/jeps/310)
- [JEP 317: Experimental Java-Based JIT Compiler (Trình biên dịch JIT thử nghiệm viết bằng Java)](https://openjdk.org/jeps/317)

## JEP 286: Local-Variable Type Inference

Vì có quá nhiều lập trình viên Java mong muốn Java đưa vào tính năng suy luận kiểu cho biến cục bộ, nên đến Java 10 tính năng này đã xuất hiện, thực sự đáp ứng kỳ vọng của cộng đồng!

Java 10 cung cấp từ khóa `var` để khai báo biến cục bộ.

```java
var id = 0;
var codefx = new URL("https://mp.weixin.qq.com/");
var list = new ArrayList<>();
var list = List.of(1, 2, 3);
var map = new HashMap<String, String>();
var p = Paths.of("src/test/java/Java9FeaturesTest.java");
var numbers = List.of("a", "b", "c");
for (var n : numbers)
    System.out.print(n+ " ");
```

`var` chỉ có thể dùng cho khai báo biến cục bộ có giá trị khởi tạo, cũng có thể dùng cho biến cục bộ trong vòng lặp `for` cơ bản hoặc nâng cao, và biến tài nguyên trong `try`-with-resources. Nó không thể dùng cho trường của lớp (field), tham số phương thức hoặc kiểu trả về.

```java
var count = null; // ❌ Biên dịch thất bại, không thể khởi tạo bằng null
var r = () -> Math.random();// ❌ Biên dịch thất bại, không thể gán trực tiếp biểu thức Lambda
var array = {1, 2, 3};// ❌ Biên dịch thất bại, không thể dùng với cú pháp khởi tạo mảng rút gọn
```

`var` không hề làm thay đổi thực tế rằng Java là một ngôn ngữ định kiểu tĩnh (statically typed); trình biên dịch sẽ chịu trách nhiệm suy luận ra kiểu dữ liệu thực tế.

Ngoài ra, Scala và Kotlin vốn đã có từ khóa `val` (tương đương tổ hợp từ khóa `final var`).

## JEP 304: Garbage-Collector Interface

Trong cấu trúc JDK trước đây, các thành phần cấu thành nên cài đặt của Garbage Collector (GC) nằm rải rác ở nhiều phần khác nhau trong codebase. Java 10 đã đưa vào một giao diện Garbage Collector sạch sẽ, tách biệt mã nguồn của các bộ thu gom rác khác nhau.

## JEP 307: Parallel Full GC for G1

Từ Java 9, G1 đã trở thành Garbage Collector mặc định. G1 được thiết kế như một bộ thu gom rác độ trễ thấp nhằm tránh phải chạy Full GC, tuy nhiên Full GC của G1 trong Java 9 vẫn sử dụng đơn luồng để thực hiện thuật toán đánh dấu - dọn dẹp (mark-sweep-compact), điều này xảy ra khi bộ thu gom rác không thể giải phóng đủ bộ nhớ và kích hoạt Full GC.

Để giảm thời gian tạm dừng ứng dụng do Full GC gây ra, từ Java 10 trở đi, Full GC của G1 chuyển sang dùng nhiều worker thread song song để thực hiện đánh dấu, dọn dẹp và nén bộ nhớ. Thay đổi này giúp rút ngắn thời gian tạm dừng khi xảy ra Full GC, chứ không trực tiếp làm giảm số lần kích hoạt Full GC.

## JEP 310: **Application Class-Data Sharing (Mở rộng tính năng CDS)**

Java 5 đã đưa vào cơ chế chia sẻ dữ liệu lớp (Class Data Sharing, viết tắt là CDS), cho phép tiền xử lý một nhóm lớp hệ thống thành file lưu trữ dùng chung (shared archive) để ánh xạ bộ nhớ (memory-map) lúc runtime, qua đó giảm thời gian khởi động chương trình Java và mức chiếm dụng bộ nhớ của nhiều JVM. AppCDS (đưa các lớp ứng dụng vào shared archive) trước đây chỉ được cung cấp dưới dạng tính năng thương mại trong Oracle JDK.

Java 10 mở rộng dựa trên tính năng CDS hiện có và mở nguồn AppCDS, cho phép đưa các lớp ứng dụng vào shared archive. Quy trình điển hình là tạo trước danh sách lớp ứng dụng, sau đó dựa trên danh sách lớp để tạo shared archive, và ở các lần khởi động tiếp theo sẽ nạp archive đó thông qua ánh xạ bộ nhớ; bản thân file văn bản danh sách lớp không phải là cache được JVM nạp trực tiếp ở các lần khởi động sau.

## JEP 317: **Trình biên dịch JIT thử nghiệm viết bằng Java**

Graal là một trình biên dịch JIT được viết bằng ngôn ngữ Java, đồng thời là nền tảng cho trình biên dịch Ahead-of-Time (AOT) thử nghiệm được giới thiệu từ JDK 9.

HotSpot VM của Oracle đi kèm hai trình biên dịch JIT được cài đặt bằng C++: C1 và C2. Trong Java 10 (Linux/x64, macOS/x64), mặc định HotSpot vẫn dùng C2, nhưng bằng cách thêm tham số `-XX:+UnlockExperimentalVMOptions -XX:+UseJVMCICompiler` vào lệnh `java`, ta có thể thay thế C2 bằng Graal.

## Cải tiến API

Không phải mọi thay đổi API đều được phát hành thông qua JEP (Java Enhancement Proposal).

Trong quy trình phát triển JDK: **JEP** thường dùng cho các thay đổi lớn, chẳng hạn như đưa vào tính năng ngôn ngữ mới (như `var`), cơ chế JVM mới (như ZGC) hoặc tái cấu trúc thư viện quy mô lớn. Những thao tác như thêm một vài phương thức static kiểu `List.copyOf()` vào các lớp sẵn có thường được xem là bảo trì thư viện thông thường. Chúng được các lập trình viên JDK gửi trực tiếp qua ticket trên **JBS (JDK Bug System)** để đánh giá rồi phát hành trực tiếp theo phiên bản.

### Cải tiến Collection

`List`, `Set`, `Map` được bổ sung phương thức static `copyOf()` trả về một bản sao bất biến của Collection đầu vào.

```java
static <E> List<E> copyOf(Collection<? extends E> coll) {
    return ImmutableCollections.listCopy(coll);
}
```

Collection được tạo bằng `copyOf()` là bất biến, không thể thực hiện các thao tác thêm, xóa, thay thế, sắp xếp..., nếu không sẽ ném ra ngoại lệ `java.lang.UnsupportedOperationException`. IDEA cũng sẽ đưa ra cảnh báo tương ứng.

![Collection được tạo bằng `copyOf()` là Collection bất biến](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210816154125579-18a6d393.png)

Đồng thời, `java.util.stream.Collectors` cũng bổ sung các phương thức static mới để thu thập phần tử trong Stream thành Collection bất biến.

```java
var list = new ArrayList<>();
list.stream().collect(Collectors.toUnmodifiableList());
list.stream().collect(Collectors.toUnmodifiableSet());
```

### Cải tiến Optional

`Optional` bổ sung thêm một phương thức `orElseThrow()` không tham số, đóng vai trò là phiên bản rút gọn của `orElseThrow(Supplier<? extends X> exceptionSupplier)`, mặc định ném ra ngoại lệ `NoSuchElementException` khi không có giá trị.

```java
Optional<String> optional = Optional.empty();
String result = optional.orElseThrow();
```

## Khác

- **Thread-Local Handshakes (Kiểm soát cục bộ theo luồng)**: Java 10 đưa vào cải tiến về safepoint trong quản lý luồng của JVM, cho phép thực thi callback trên luồng mà không cần kích hoạt JVM safepoint toàn cục; callback có thể do chính luồng đó hoặc luồng JVM thực hiện trong khi giữ luồng ở trạng thái bị chặn (blocked). Cách này giúp có thể dừng riêng lẻ một luồng thay vì chỉ có thể cho chạy hoặc dừng toàn bộ các luồng.
- **Cấp phát Heap trên thiết bị lưu trữ thay thế (Heap Allocation on Alternative Memory Devices)**: Java 10 cho phép JVM sử dụng Heap phù hợp với các cơ chế lưu trữ khác nhau, thực hiện cấp phát bộ nhớ Heap trên thiết bị bộ nhớ thay thế.
- ...

## Tài liệu tham khảo

- Java 10 Features and Enhancements: <https://howtodoinjava.com/java10/java10-features/>
- Guide to Java10: <https://www.baeldung.com/java-10-overview>
- 4 Class Data Sharing: <https://docs.oracle.com/javase/10/vm/class-data-sharing.htm#JSJVM-GUID-7EAA3411-8CF0-4D19-BD05-DF5E1780AA91>
