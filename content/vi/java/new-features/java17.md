---
title: "Tính năng mới Java 17 (JDK 17): Sealed Classes, Pattern Matching cho switch và Random API"
description: "Giải thích chi tiết các tính năng mới của Java 17 (JDK 17), bao gồm Sealed Classes, Pattern Matching cho switch, API sinh số ngẫu nhiên mới, Foreign Function & Memory API, cũng như chu kỳ hỗ trợ LTS và những thay đổi cần lưu ý khi nâng cấp."
category: Java
tag:
  - Tính năng mới Java
lang: vi
sourceRef: zh-ref/java/new-features/java17.md
head:
  - - meta
    - name: keywords
      content: Java 17,JDK 17,Tính năng mới JDK 17,Tính năng mới Java 17,LTS,Sealed Classes,Pattern Matching cho switch,Random API,Foreign Function and Memory API,JEP
---

Java 17 (JDK 17) chính thức phát hành vào ngày 14/09/2021, là phiên bản hỗ trợ dài hạn (LTS) được Oracle công nhận.

Theo lộ trình hỗ trợ Java SE được Oracle cập nhật vào tháng 4 năm 2026, Premier Support của Oracle JDK 17 kéo dài đến tháng 9 năm 2026 và Extended Support kéo dài đến tháng 9 năm 2029. Chu kỳ cập nhật miễn phí và hỗ trợ thương mại của các bản phân phối JDK khác nhau là không giống nhau, môi trường production vẫn cần căn cứ theo bản phân phối thực tế đang sử dụng.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/4c1611fad59449edbbd6e233690e9fa7-08d369cd.png)

Khi nâng cấp từ JDK 11 lên JDK 17, nên tập trung chú ý đến Sealed Classes, Pattern Matching cho `switch`, API sinh số giả ngẫu nhiên mới, cũng như các thay đổi về tính tương thích do việc đóng gói chặt các API nội bộ JDK gây ra. Phiên bản Java tối thiểu của Spring 6.x và Spring Boot 3.x cũng là Java 17.

JDK 17 có tổng cộng 14 tính năng mới. Bài viết này sẽ chọn lọc và giới thiệu chi tiết một số tính năng mới tương đối quan trọng trong đó:

- [JEP 356: Enhanced Pseudo-Random Number Generators (Trình sinh số giả ngẫu nhiên nâng cao)](https://openjdk.java.net/jeps/356)
- [JEP 398: Deprecate the Applet API for Removal (Đánh dấu lỗi thời Applet API để chuẩn bị loại bỏ)](https://openjdk.java.net/jeps/398)
- [JEP 403: Strongly Encapsulate JDK Internals (Đóng gói chặt các API nội bộ JDK)](https://openjdk.org/jeps/403)
- [JEP 406: Pattern Matching for switch (Preview) (Pattern Matching cho switch, xem trước)](https://openjdk.java.net/jeps/406)
- [JEP 407: Remove RMI Activation (Loại bỏ cơ chế RMI Activation)](https://openjdk.java.net/jeps/407)
- [JEP 409: Sealed Classes (Lớp niêm phong, chính thức)](https://openjdk.java.net/jeps/409)
- [JEP 410: Remove the Experimental AOT and JIT Compiler (Loại bỏ trình biên dịch AOT và JIT thử nghiệm)](https://openjdk.java.net/jeps/410)
- [JEP 411: Deprecate the Security Manager for Removal (Đánh dấu lỗi thời Security Manager để chuẩn bị loại bỏ)](https://openjdk.java.net/jeps/411)
- [JEP 412: Foreign Function & Memory API (Incubator) (Foreign Function & Memory API, ươm tạo lần đầu)](https://openjdk.java.net/jeps/412)
- [JEP 414: Vector API (Second Incubator) (Vector API, ươm tạo lần hai)](https://openjdk.java.net/jeps/414)

Biểu đồ dưới đây thể hiện số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 16:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Đọc thêm: [Tài liệu OpenJDK Java 17](https://openjdk.java.net/projects/jdk/17/).

## JEP 356: Enhanced Pseudo-Random Number Generators (Trình sinh số giả ngẫu nhiên nâng cao)

Trước JDK 17, chúng ta có thể dùng `Random`, `ThreadLocalRandom` và `SplittableRandom` để sinh số ngẫu nhiên. Tuy nhiên, cả 3 lớp này đều có những nhược điểm riêng và thiếu hỗ trợ cho các thuật toán giả ngẫu nhiên phổ biến.

Java 17 bổ sung các kiểu interface và bản cài đặt mới cho trình sinh số giả ngẫu nhiên (pseudorandom number generator — PRNG, còn gọi là bộ sinh bit ngẫu nhiên tất định), giúp lập trình viên dễ dàng thay thế qua lại các thuật toán PRNG khác nhau trong ứng dụng.

> [PRNG](https://ctf-wiki.org/crypto/streamcipher/prng/intro/) được dùng để tạo ra dãy số tiệm cận với dãy số ngẫu nhiên tuyệt đối. Thông thường, PRNG phụ thuộc vào một giá trị khởi tạo (gọi là seed — hạt giống) để sinh ra dãy số giả ngẫu nhiên tương ứng. Chỉ cần seed được xác định, các số ngẫu nhiên mà PRNG tạo ra là hoàn toàn xác định, vì vậy dãy số mà nó sinh ra không phải là ngẫu nhiên thực sự.

Ví dụ sử dụng:

```java
RandomGeneratorFactory<RandomGenerator> l128X256MixRandom = RandomGeneratorFactory.of("L128X256MixRandom");
// Sử dụng timestamp làm seed ngẫu nhiên
RandomGenerator randomGenerator = l128X256MixRandom.create(System.currentTimeMillis());
// Sinh số ngẫu nhiên
randomGenerator.nextInt(10);
```

## JEP 398: Deprecate the Applet API for Removal (Đánh dấu lỗi thời Applet API để chuẩn bị loại bỏ)

Applet API được dùng để viết các chương trình Java nhỏ chạy trên trình duyệt web; nó đã bị đào thải từ nhiều năm trước và không còn lý do gì để sử dụng nữa.

Applet API đã bị đánh dấu lỗi thời (deprecated) từ Java 9 ([JEP 289](https://openjdk.java.net/jeps/289)), nhưng khi đó chưa nhằm mục đích xóa bỏ.

## JEP 403: Strongly Encapsulate JDK Internals (Đóng gói chặt các API nội bộ JDK)

JDK 17 tiếp tục siết chặt việc đóng gói các API nội bộ của JDK. Một số framework phiên bản cũ, thư viện Serialization, công cụ bytecode hoặc Java Agent phụ thuộc vào việc truy cập bằng Reflection tới các thành phần nội bộ JDK; sau khi nâng cấp có thể ném ra `InaccessibleObjectException`, vì vậy không thể chỉ kiểm tra xem code nghiệp vụ có biên dịch được hay không.

Trước khi nâng cấp, bạn có thể dùng `jdeps --jdk-internals` để hỗ trợ tìm kiếm các phụ thuộc tĩnh vào API nội bộ, nhưng công cụ này không thể phát hiện hết mọi truy cập qua Reflection, nên vẫn cần kiểm thử khi chạy thực tế bao gồm khởi động ứng dụng, các API cốt lõi, tác vụ định kỳ và agent giám sát. Khi phát hiện điểm không tương thích, nên ưu tiên nâng cấp dependency hoặc chuyển sang sử dụng các API công khai được hỗ trợ; các bước cụ thể có thể tham khảo [Hướng dẫn chuẩn bị di chuyển Oracle JDK 17](https://docs.oracle.com/en/java/javase/17/migrate/preparing-migration.html).

**Trong JDK 17, `--illegal-access=permit` không còn có thể khôi phục hành vi truy cập nới lỏng như trước đây nữa.** Đối với các dependency tạm thời chưa thể nâng cấp, bạn có thể căn cứ vào thông tin ngoại lệ để dùng `--add-opens` mở có chủ đích các package cần thiết. Ví dụ, tham số dưới đây cho phép code trên classpath truy cập deep reflection vào package `java.lang` của module `java.base`:

```bash
--add-opens java.base/java.lang=ALL-UNNAMED
```

Đây chỉ là giải pháp tương thích tạm thời cho từng vấn đề truy cập cụ thể, không nên dùng làm tham số khởi động chung cho mọi ứng dụng, và cũng không thể giải quyết toàn bộ vấn đề nâng cấp JDK. Xem ranh giới cụ thể tại [JEP 403](https://openjdk.org/jeps/403). Nếu khi nâng cấp bạn còn dự định chuyển sang ZGC, nên tách biệt việc kiểm chứng tương thích dependency với việc so sánh hiệu năng bộ thu gom, tham khảo [Bộ thu gom ZGC](../jvm/jvm-garbage-collection.md#bo-thu-gom-zgc).

## JEP 406: Pattern Matching for switch (Pattern Matching cho switch, xem trước)

Giống như `instanceof`, `switch` cũng nhanh chóng được bổ sung tính năng khớp kiểu kèm tự động ép kiểu.

Ví dụ code `instanceof`:

```java
// Old code
if (o instanceof String) {
    String s = (String)o;
    ... use s ...
}

// New code
if (o instanceof String s) {
    ... use s ...
}
```

Ví dụ code `switch`:

```java
// Old code
static String formatter(Object o) {
    String formatted = "unknown";
    if (o instanceof Integer i) {
        formatted = String.format("int %d", i);
    } else if (o instanceof Long l) {
        formatted = String.format("long %d", l);
    } else if (o instanceof Double d) {
        formatted = String.format("double %f", d);
    } else if (o instanceof String s) {
        formatted = String.format("String %s", s);
    }
    return formatted;
}

// New code
static String formatterPatternSwitch(Object o) {
    return switch (o) {
        case Integer i -> String.format("int %d", i);
        case Long l    -> String.format("long %d", l);
        case Double d  -> String.format("double %f", d);
        case String s  -> String.format("String %s", s);
        default        -> o.toString();
    };
}

```

Việc kiểm tra giá trị `null` cũng đã được tối ưu.

```java
// Old code
static void testFooBar(String s) {
    if (s == null) {
        System.out.println("oops!");
        return;
    }
    switch (s) {
        case "Foo", "Bar" -> System.out.println("Great");
        default           -> System.out.println("Ok");
    }
}

// New code
static void testFooBar(String s) {
    switch (s) {
        case null         -> System.out.println("Oops");
        case "Foo", "Bar" -> System.out.println("Great");
        default           -> System.out.println("Ok");
    }
}
```

## JEP 407: Remove RMI Activation (Loại bỏ cơ chế RMI Activation)

Xóa bỏ cơ chế kích hoạt Remote Method Invocation (RMI Activation), đồng thời giữ lại phần còn lại của RMI. Cơ chế RMI Activation đã lỗi thời và không còn được sử dụng.

## JEP 409: Sealed Classes (Lớp niêm phong)

Sealed Classes được đề xuất xem trước bởi [JEP 360](https://openjdk.java.net/jeps/360) và tích hợp vào Java 15. Trong JDK 16, Sealed Classes được cải tiến (kiểm tra tham chiếu và quan hệ kế thừa của lớp niêm phong chặt chẽ hơn) và đề xuất xem trước lần hai thông qua [JEP 397](https://openjdk.java.net/jeps/397).

Trong bài [Tổng quan tính năng mới Java 14 & 15](./java14-15.md), tôi đã giới thiệu chi tiết về Sealed Classes nên ở đây sẽ không trình bày thêm nữa.

## JEP 410: Remove the Experimental AOT and JIT Compiler (Loại bỏ trình biên dịch AOT và JIT thử nghiệm)

Trong [JEP 295](https://openjdk.java.net/jeps/295) của Java 9, trình biên dịch Ahead-of-Time (AOT) thử nghiệm đã được đưa vào để biên dịch các lớp Java thành mã máy (native code) trước khi khởi động máy ảo.

Đến Java 17, trình biên dịch Ahead-of-Time (AOT) và Just-in-Time (JIT) thử nghiệm này bị xóa bỏ vì rất ít được sử dụng kể từ khi ra mắt trong khi công sức bảo trì lại rất lớn. Giao diện trình biên dịch JVM ở cấp độ Java thử nghiệm (JVMCI) vẫn được giữ lại để lập trình viên có thể tiếp tục sử dụng các bản trình biên dịch được build từ bên ngoài cho quá trình biên dịch JIT.

## JEP 411: Deprecate the Security Manager for Removal (Đánh dấu lỗi thời Security Manager để chuẩn bị loại bỏ)

Đánh dấu lỗi thời Security Manager để xóa bỏ trong các phiên bản tương lai.

Security Manager có từ thời Java 1.0; trong nhiều năm qua, nó không còn là phương thức chính để bảo vệ mã Java phía client, và cũng rất ít được dùng để bảo vệ mã phía server. Để thúc đẩy Java tiến về phía trước, Java 17 đánh dấu lỗi thời Security Manager nhằm loại bỏ cùng với Applet API cũ ([JEP 398](https://openjdk.java.net/jeps/398)).

## JEP 412: Foreign Function & Memory API (Foreign Function & Memory API, ươm tạo)

Chương trình Java có thể thông qua API này để tương tác với mã nguồn và dữ liệu nằm bên ngoài Java runtime. Bằng cách gọi hiệu quả các hàm ngoại lai (tức mã nằm ngoài JVM) và truy cập an toàn vào bộ nhớ ngoài (tức bộ nhớ không do JVM quản lý), API này giúp chương trình Java gọi các thư viện native và xử lý dữ liệu native mà không nguy hiểm và dễ vỡ như JNI.

Foreign Function & Memory API được ươm tạo vòng đầu tiên trong Java 17 theo đề xuất của [JEP 412](https://openjdk.java.net/jeps/412). Vòng ươm tạo thứ hai được đề xuất bởi [JEP 419](https://openjdk.org/jeps/419) và tích hợp vào Java 18, còn bản xem trước (preview) được đề xuất bởi [JEP 424](https://openjdk.org/jeps/424) và tích hợp vào Java 19.

Trong bài [Tổng quan tính năng mới Java 19](./java19.md), tôi đã giới thiệu chi tiết về Foreign Function & Memory API nên ở đây sẽ không trình bày thêm nữa.

## JEP 414: Vector API (Vector API, ươm tạo lần hai)

Vector API ban đầu được đề xuất bởi [JEP 338](https://openjdk.java.net/jeps/338) và tích hợp vào Java 16 dưới dạng [Incubator API](http://openjdk.java.net/jeps/11). Vòng ươm tạo thứ hai được đề xuất bởi [JEP 414](https://openjdk.java.net/jeps/414) và tích hợp vào Java 17; vòng thứ ba được đề xuất bởi [JEP 417](https://openjdk.java.net/jeps/417) và tích hợp vào Java 18; vòng thứ tư được đề xuất bởi [JEP 426](https://openjdk.java.net/jeps/426) và tích hợp vào Java 19.

Incubator API này cung cấp bản lặp đầu tiên của một API dùng để biểu diễn các phép tính vector, có thể biên dịch ổn định tại runtime thành các tập lệnh phần cứng vector tối ưu trên các kiến trúc CPU được hỗ trợ, từ đó đạt hiệu năng vượt trội so với các phép tính vô hướng tương đương bằng cách tận dụng triệt để công nghệ Single Instruction, Multiple Data (SIMD) (một khả năng tập lệnh có trên hầu hết các CPU hiện đại). Mặc dù HotSpot có hỗ trợ tự động vector hóa (auto-vectorization), nhưng tập các phép toán vô hướng có thể chuyển đổi còn hạn chế và rất dễ bị ảnh hưởng khi code thay đổi. API này giúp lập trình viên dễ dàng viết các thuật toán vector hiệu năng cao và có tính di động bằng Java.

Trong bài [Tổng quan tính năng mới Java 18](./java18.md), tôi đã giới thiệu chi tiết về Vector API nên ở đây sẽ không trình bày thêm nữa.
