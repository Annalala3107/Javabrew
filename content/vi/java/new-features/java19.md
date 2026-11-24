---
title: Tổng quan tính năng mới Java 19
description: Giới thiệu các tính năng Preview và cập nhật về lập trình đồng thời (Concurrency) trong JDK 19, đặt nền móng cho Virtual Thread.
category: Java
tag:
  - Tính năng mới Java
head:
  - - meta
    - name: keywords
      content: Java 19,JDK19,Virtual Thread Preview,Structured Concurrency,Foreign Function API,JEP
lang: vi
sourceRef: zh-ref/java/new-features/java19.md
---

JDK 19 chính thức phát hành vào ngày 20/09/2022 và là phiên bản không hỗ trợ dài hạn (non-LTS).

JDK 19 có tổng cộng 7 tính năng mới. Bài viết này sẽ chọn lọc một số tính năng quan trọng để giới thiệu chi tiết:

- [JEP 424: Foreign Function & Memory API](https://openjdk.org/jeps/424) (Preview)
- [JEP 425: Virtual Threads (Luồng ảo)](https://openjdk.org/jeps/425) (Preview)
- [JEP 426: Vector API](https://openjdk.java.net/jeps/426) (Incubator lần 4)
- [JEP 428: Structured Concurrency (Đồng thời có cấu trúc)](https://openjdk.org/jeps/428) (Incubator)

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25:

![Số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 424: Foreign Function & Memory API (Preview)

Thông qua API này, chương trình Java có thể tương tác với mã và dữ liệu nằm ngoài Java runtime. Bằng cách gọi các hàm bên ngoài (foreign functions — mã nằm ngoài JVM) một cách hiệu quả và truy cập an toàn vào bộ nhớ bên ngoài (foreign memory — bộ nhớ không do JVM quản lý), API này cho phép chương trình Java gọi các thư viện native và xử lý dữ liệu native mà không nguy hiểm hay dễ lỗi như JNI.

Foreign Function & Memory API được thử nghiệm (Incubator) lần đầu tiên trong Java 17 qua [JEP 412](https://openjdk.java.net/jeps/412). Vòng Incubator lần 2 do [JEP 419](https://openjdk.org/jeps/419) đề xuất và tích hợp vào Java 18, còn bản Preview đầu tiên do [JEP 424](https://openjdk.org/jeps/424) đề xuất và tích hợp vào Java 19.

Trước khi có Foreign Function & Memory API:

- Java cung cấp một số phương thức thực hiện các thao tác cấp thấp, không an toàn (như truy cập trực tiếp tài nguyên bộ nhớ hệ thống, tự quản lý bộ nhớ, v.v.) thông qua [`sun.misc.Unsafe`](https://hg.openjdk.java.net/jdk/jdk/file/tip/src/jdk.unsupported/share/classes/sun/misc/Unsafe.java). Trong khi mang lại cho Java khả năng thao tác vùng nhớ tương tự con trỏ của ngôn ngữ C, lớp `Unsafe` cũng làm giảm tính an toàn của Java — sử dụng `Unsafe` không đúng cách sẽ làm tăng đáng kể xác suất xảy ra lỗi chương trình.
- Ngay từ Java 1.1 đã hỗ trợ gọi hàm native thông qua Java Native Interface (JNI), nhưng cách dùng không hề thuận tiện. Việc triển khai JNI quá phức tạp, các bước rườm rà (chi tiết bạn có thể tham khảo bài viết: [Guide to JNI (Java Native Interface)](https://www.baeldung.com/jni)), không chịu sự kiểm soát của cơ chế an toàn ngôn ngữ JVM và ảnh hưởng đến tính đa nền tảng của Java. Hơn nữa, hiệu năng của JNI cũng không tốt vì lời gọi phương thức JNI không thể hưởng lợi từ nhiều tối ưu hóa phổ biến của JIT (chẳng hạn như inline). Dù các framework như [JNA](https://github.com/java-native-access/jna), [JNR](https://github.com/jnr/jnr-ffi) và [JavaCPP](https://github.com/bytedeco/javacpp) đã cải tiến JNI, hiệu quả vẫn chưa thực sự lý tưởng.

Việc đưa vào Foreign Function & Memory API chính là nhằm giải quyết những điểm bất cập khi Java truy cập các hàm bên ngoài và vùng nhớ bên ngoài.

Foreign Function & Memory API (FFM API) định nghĩa các class và interface sau:

- Cấp phát bộ nhớ bên ngoài: `MemorySegment`, `MemoryAddress` và `SegmentAllocator`
- Thao tác và truy cập bộ nhớ bên ngoài có cấu trúc: `MemoryLayout`, `VarHandle`
- Kiểm soát việc cấp phát và giải phóng bộ nhớ bên ngoài: `MemorySession`
- Gọi hàm bên ngoài: `Linker`, `FunctionDescriptor` và `SymbolLookup`

Dưới đây là ví dụ sử dụng FFM API. Đoạn mã này lấy `MethodHandle` của hàm thư viện C `radixsort`, sau đó dùng nó để sắp xếp bốn chuỗi trong một mảng Java.

```java
// 1. Tìm hàm bên ngoài trên đường dẫn thư viện C
Linker linker = Linker.nativeLinker();
SymbolLookup stdlib = linker.defaultLookup();
MethodHandle radixSort = linker.downcallHandle(
                             stdlib.lookup("radixsort"), ...);
// 2. Cấp phát bộ nhớ trên Heap để lưu bốn chuỗi
String[] javaStrings   = { "mouse", "cat", "dog", "car" };
// 3. Cấp phát bộ nhớ ngoài Heap (off-heap) để lưu bốn con trỏ
SegmentAllocator allocator = implicitAllocator();
MemorySegment offHeap  = allocator.allocateArray(ValueLayout.ADDRESS, javaStrings.length);
// 4. Sao chép các chuỗi từ Heap sang vùng nhớ ngoài Heap
for (int i = 0; i < javaStrings.length; i++) {
    // Cấp phát một chuỗi ngoài Heap, rồi lưu con trỏ trỏ tới nó
    MemorySegment cString = allocator.allocateUtf8String(javaStrings[i]);
    offHeap.setAtIndex(ValueLayout.ADDRESS, i, cString);
}
// 5. Sắp xếp dữ liệu ngoài Heap bằng cách gọi hàm bên ngoài
radixSort.invoke(offHeap, javaStrings.length, MemoryAddress.NULL, '\0');
// 6. Sao chép các chuỗi (đã được sắp xếp lại) từ vùng nhớ ngoài Heap về Heap
for (int i = 0; i < javaStrings.length; i++) {
    MemoryAddress cStringPtr = offHeap.getAtIndex(ValueLayout.ADDRESS, i);
    javaStrings[i] = cStringPtr.getUtf8String(0);
}
assert Arrays.equals(javaStrings, new String[] {"car", "cat", "dog", "mouse"});  // true
```

## JEP 425: Virtual Threads (Luồng ảo, Preview)

Virtual Thread (luồng ảo) là thread hạng nhẹ do JDK chứ không phải hệ điều hành (OS) hiện thực. Nhiều Virtual Thread dùng chung một thread của hệ điều hành, nhờ đó số lượng Virtual Thread có thể lớn hơn rất nhiều so với số lượng thread của hệ điều hành.

Các luồng hạng nhẹ tương tự đã được chứng minh là cực kỳ hữu ích trong các ngôn ngữ lập trình đa luồng khác, chẳng hạn như Goroutine trong Go hay process trong Erlang.

Virtual Thread thường không cần tạo mới hoặc chuyển ngữ cảnh (context switch) một thread hệ điều hành cho từng tác vụ, qua đó giảm thiểu chi phí tài nguyên thread và chi phí lập lịch do số lượng lớn tác vụ chặn (blocking) gây ra, đồng thời giảm công sức viết, bảo trì và quan sát các ứng dụng đồng thời thông lượng cao (high-throughput).

Trên Zhihu có một cuộc thảo luận về Virtual Thread trong Java 19, nếu quan tâm bạn có thể xem tại: <https://www.zhihu.com/question/536743167>.

Để tìm hiểu phân tích chi tiết và nguyên lý của Virtual Thread trong Java, bạn có thể tham khảo các bài viết dưới đây:

- [Phân tích nguyên lý và hiệu năng Virtual Thread | Dewu Tech](https://mp.weixin.qq.com/s/vdLXhZdWyxc6K-D3Aj03LA)
- [Java 19 chính thức GA! Xem Virtual Thread cải thiện vượt bậc thông lượng hệ thống như thế nào](https://mp.weixin.qq.com/s/yyApBXxpXxVwttr01Hld6Q)
- [Virtual Thread - Khám phá mã nguồn VirtualThread](https://www.cnblogs.com/throwable/p/16758997.html)

## JEP 426: Vector API (Incubator lần 4)

Vector API ban đầu được đề xuất qua [JEP 338](https://openjdk.java.net/jeps/338) và tích hợp vào Java 16 dưới dạng [Incubator API](http://openjdk.java.net/jeps/11). Vòng Incubator thứ 2 được đề xuất bởi [JEP 414](https://openjdk.java.net/jeps/414) và tích hợp vào Java 17; vòng Incubator thứ 3 bởi [JEP 417](https://openjdk.java.net/jeps/417) trong Java 18; và vòng thứ 4 bởi [JEP 426](https://openjdk.java.net/jeps/426) trong Java 19.

Mình đã giới thiệu chi tiết về Vector API trong bài [Tổng quan tính năng mới Java 18](./java18.md), nên sẽ không lặp lại thêm ở đây.

## JEP 428: Structured Concurrency (Đồng thời có cấu trúc, Incubator)

JDK 19 giới thiệu Structured Concurrency (đồng thời có cấu trúc), một phương pháp lập trình đa luồng nhằm đơn giản hóa việc viết code đa luồng thông qua Structured Concurrency API chứ không nhằm thay thế `java.util.concurrent`; hiện tại tính năng này đang ở giai đoạn Incubator.

Structured Concurrency xem nhiều tác vụ chạy trên các thread khác nhau như một đơn vị công việc duy nhất (single unit of work), từ đó đơn giản hóa việc xử lý lỗi, nâng cao độ tin cậy và tăng khả năng quan sát (observability). Nói cách khác, Structured Concurrency giữ lại được tính dễ đọc, dễ bảo trì và dễ quan sát của mã đơn luồng.

API cơ bản của Structured Concurrency là [`StructuredTaskScope`](https://download.java.net/java/early_access/loom/docs/api/jdk.incubator.concurrent/jdk/incubator/concurrent/StructuredTaskScope.html). `StructuredTaskScope` hỗ trợ tách một tác vụ thành nhiều tác vụ con chạy đồng thời trên các thread riêng của chúng, và các tác vụ con phải hoàn thành trước khi tác vụ chính tiếp tục.

Cách sử dụng cơ bản của `StructuredTaskScope` như sau:

```java
    try (var scope = new StructuredTaskScope<Object>()) {
        // Dùng phương thức fork để tạo luồng thực thi các tác vụ con
        Future<Integer> future1 = scope.fork(task1);
        Future<String> future2 = scope.fork(task2);
        // Chờ các luồng hoàn thành
        scope.join();
        // Việc xử lý kết quả có thể bao gồm xử lý hoặc ném lại ngoại lệ
        ... process results/exceptions ...
    } // close
```

Structured Concurrency kết hợp rất ăn ý với Virtual Thread — các thread hạng nhẹ do JDK triển khai. Nhiều Virtual Thread dùng chung một thread hệ điều hành, cho phép chạy số lượng rất lớn Virtual Thread cùng lúc.
