---
title: "Hệ thống kiến thức Java: Cơ bản, Collections, Concurrency, JVM, I/O và Tính năng mới"
description: "Lộ trình học tập và ôn tập phỏng vấn hệ thống kiến thức Java, bao gồm Java cơ bản, mã nguồn Collections, lập trình đồng thời (Concurrency), JVM, IO/NIO và các tính năng mới của Java, phù hợp cho ứng viên mới tốt nghiệp, ứng viên có kinh nghiệm và ôn tập phỏng vấn Java Backend."
category: Java
tag:
  - Java
  - Java cơ bản
  - Phỏng vấn Java
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Java,Java cơ bản,Java Collections,Java Concurrency,JVM,Java IO,Java NIO,Tính năng mới Java,Câu hỏi phỏng vấn Java,Phỏng vấn Java Backend
lang: vi
sourceRef: zh-ref/java/README.md
---

Tài liệu **Hệ thống kiến thức Java** này hướng tới việc học Java Backend và ôn tập phỏng vấn, sắp xếp các bài viết liên quan đến Java trên trang theo thứ tự "Cú pháp cơ bản -> Collections Framework -> Lập trình đồng thời (Concurrency) -> IO/NIO -> JVM -> Tính năng mới".

Nếu bạn không có nhiều thời gian, nên xem trước các bài tổng hợp câu hỏi phỏng vấn về Java cơ bản, Collections, Concurrency và JVM để nhanh chóng xây dựng danh sách các vấn đề hay gặp; nếu muốn củng cố nền tảng một cách bài bản, bạn có thể đọc theo thứ tự chuyên đề dưới đây.

## Phù hợp với ai

- Lập trình viên Backend đang học Java một cách bài bản.
- Các bạn chuẩn bị phỏng vấn Java Backend cho vị trí thực tập/mới tốt nghiệp, đã có kinh nghiệm hoặc tại các công ty công nghệ vừa và lớn.
- Độc giả muốn hệ thống hóa lại kiến thức Java cơ bản, Collections, Concurrency, JVM, I/O và các tính năng mới để ôn tập.
- Kỹ sư đã từng làm dự án Java nhưng hiểu biết về nguyên lý tầng dưới, thiết kế mã nguồn và thực hành kỹ thuật vẫn chưa có hệ thống.

## Trọng tâm học tập

- Cú pháp cơ bản của Java, Lập trình hướng đối tượng (OOP), Exception, Generics, Reflection, Proxy, Tuần tự hóa (`Serialization`) và các cơ chế cốt lõi khác.
- Giới hạn sử dụng, cài đặt mã nguồn và câu hỏi phỏng vấn thường gặp của `List`, `Map`, `Queue` và Concurrent Collections.
- Thread trong Java, Lock, JMM, CAS, AQS, Thread Pool, `CompletableFuture` và Virtual Thread (luồng ảo).
- Vùng nhớ JVM, nạp lớp (Class Loading), Garbage Collection (GC), cấu hình tham số, công cụ giám sát và xử lý sự cố trên môi trường production.
- BIO, NIO, AIO, các mô hình I/O, cũng như các Design Pattern liên quan đến I/O như Decorator và Adapter.
- Các tính năng mới quan trọng từ Java 8 đến Java 26, và những tính năng nào thực sự ảnh hưởng đến công việc phát triển hằng ngày.

## Thứ tự đọc khuyến nghị

1. [Chuyên đề Java cơ bản](./basis/): Nắm vững cú pháp, OOP, Generics, Reflection, Proxy, `Serialization` và các kiến thức nền tảng trước.
2. [Chuyên đề Java Collections](./collection/): Hiểu cách dùng và mã nguồn của các container phổ biến như `ArrayList`, `LinkedList`, `HashMap`, `ConcurrentHashMap`.
3. [Chuyên đề lập trình đồng thời Java](./concurrent/): Học bài bản về Thread, Lock, JMM, CAS, AQS, Thread Pool và các lớp tiện ích đồng thời.
4. [Chuyên đề JVM](./jvm/): Hiểu các vùng nhớ, Class Loading, Garbage Collection, tham số JVM và xử lý sự cố thực tế.
5. [Chuyên đề Java IO](./io/): Bổ sung kiến thức về BIO, NIO, AIO, Reactor, I/O Multiplexing và Design Pattern trong I/O.
6. [Chuyên đề tính năng mới của Java](./new-features/): Hệ thống hóa theo từng phiên bản các tính năng trọng tâm như Lambda, Stream, tính mô-đun, `var`, `Record` và Virtual Thread.

## Bài viết cốt lõi

### Java cơ bản

- [Chuyên đề Java cơ bản](./basis/): Trình bày từ cú pháp cơ bản đến các cơ chế cốt lõi và câu hỏi phỏng vấn Java thường gặp.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java cơ bản (Phần 1)](./basis/java-basic-questions-01.md): Bao gồm đặc điểm ngôn ngữ Java, cú pháp cơ bản, OOP và các lớp thường dùng.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java cơ bản (Phần 2)](./basis/java-basic-questions-02.md): Tiếp tục hệ thống hóa Exception, Generics, Reflection, Annotation và các chi tiết hay gặp.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java cơ bản (Phần 3)](./basis/java-basic-questions-03.md): Bổ sung kiến thức nền tảng nâng cao và các điểm dễ nhầm lẫn.
- [Giải thích chi tiết truyền tham trị trong Java](./basis/why-there-only-value-passing-in-java.md): Làm rõ mối quan hệ giữa truyền tham trị (pass-by-value), biến tham chiếu và việc thay đổi đối tượng.
- [Giải thích chi tiết Serialization trong Java](./basis/serialization.md): Hiểu cơ chế Serialization, `serialVersionUID`, rủi ro bảo mật và các giải pháp thay thế.
- [Giải thích chi tiết cơ chế Reflection trong Java](./basis/reflection.md) và [Giải thích chi tiết Proxy Pattern trong Java](./basis/proxy.md): Nắm vững các cơ chế phổ biến ở tầng dưới của các framework.

### Java Collections

- [Chuyên đề Java Collections](./collection/): Kết nối Collections Framework, các lưu ý khi sử dụng và phân tích mã nguồn phổ biến.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Collections (Phần 1)](./collection/java-collection-questions-01.md) và [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Collections (Phần 2)](./collection/java-collection-questions-02.md): Bao phủ các câu hỏi tần suất cao về `List`, `Set`, `Map`, `Queue` và Concurrent Collections.
- [Tổng hợp lưu ý khi sử dụng Java Collections](./collection/java-collection-precautions-for-use.md): Tổng kết các điểm cần chú ý về kiểm tra null, duyệt phần tử, cơ chế mở rộng dung lượng (`resize`), an toàn luồng (thread-safe) và hiệu năng.
- [Phân tích mã nguồn ArrayList](./collection/arraylist-source-code.md), [Phân tích mã nguồn HashMap](./collection/hashmap-source-code.md), [Phân tích mã nguồn ConcurrentHashMap](./collection/concurrent-hash-map-source-code.md): Hiểu sự đánh đổi thiết kế của các container thường dùng từ mã nguồn.

### Lập trình đồng thời (Java Concurrency)

- [Chuyên đề lập trình đồng thời Java](./concurrent/): Xoay quanh Thread, Lock, mô hình bộ nhớ, Thread Pool và công cụ đồng thời.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 1)](./concurrent/java-concurrent-questions-01.md), [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 2)](./concurrent/java-concurrent-questions-02.md), [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 3)](./concurrent/java-concurrent-questions-03.md): Xây dựng danh sách câu hỏi phỏng vấn Concurrency.
- [Giải thích chi tiết JMM (Java Memory Model)](./concurrent/jmm.md): Hiểu tính khả kiến (`Visibility`), tính nguyên tử (`Atomicity`), tính tuần tự (`Ordering`) và happens-before.
- [Giải thích chi tiết CAS](./concurrent/cas.md), [Giải thích chi tiết AQS](./concurrent/aqs.md), [Giải thích chi tiết Java Thread Pool](./concurrent/java-thread-pool-summary.md): Nắm vững các trọng tâm phỏng vấn tầng dưới về Concurrency.
- [Tổng hợp câu hỏi thường gặp về Virtual Thread](./concurrent/virtual-thread.md): Hiểu tác động của Project Loom đối với mô hình đồng thời.

### JVM và I/O

- [Chuyên đề JVM](./jvm/): Xoay quanh bộ nhớ, nạp lớp, GC, tham số, công cụ và xử lý sự cố thực tế.
- [Giải thích chi tiết vùng nhớ Java (Trọng tâm)](./jvm/memory-area.md): Hiểu Program Counter Register, JVM Stack, Native Method Stack, Heap và Method Area.
- [Giải thích chi tiết Garbage Collection trong JVM (Trọng tâm)](./jvm/jvm-garbage-collection.md): Hiểu cách xác định đối tượng còn sống, thuật toán thu gom rác và các bộ thu gom rác phổ biến.
- [Giải thích chi tiết quá trình Class Loading](./jvm/class-loading-process.md) và [Giải thích chi tiết ClassLoader (Trọng tâm)](./jvm/classloader.md): Nắm vững vòng đời của lớp và mô hình ủy quyền cha (Parent Delegation Model).
- [Chuyên đề Java IO](./io/): Trình bày từ BIO, NIO, AIO đến các mô hình I/O và Design Pattern trong I/O.
- [Tổng kết kiến thức cơ bản Java IO](./io/io-basis.md), [Tổng kết kiến thức cốt lõi Java NIO](./io/nio-basis.md), [Giải thích chi tiết các mô hình Java IO](./io/io-model.md): Hoàn thiện kiến thức nền trước khi học lập trình mạng và middleware.

### Tính năng mới của Java

- [Chuyên đề tính năng mới của Java](./new-features/): Hệ thống hóa theo phiên bản các tính năng ngôn ngữ, thư viện chuẩn và JVM quan trọng sau Java 8.
- [Thực hành tính năng mới của Java 8](./new-features/java8-common-new-features.md): Nắm vững Lambda, Stream, `Optional`, phương thức mặc định (default method) trong interface và API ngày giờ mới.
- [Tổng quan tính năng mới Java 11 (Quan trọng)](./new-features/java11.md), [Tổng quan tính năng mới Java 17 (Quan trọng)](./new-features/java17.md), [Tổng quan tính năng mới Java 21 (Quan trọng)](./new-features/java21.md): Ưu tiên tập trung vào các tính năng sử dụng lâu dài trong các phiên bản LTS.

## Câu hỏi tần suất cao

- Tại sao Java là truyền tham trị (pass-by-value)? Điều gì thực sự xảy ra khi truyền tham chiếu đối tượng làm tham số?
- `String`, `StringBuilder`, `StringBuffer` có gì khác nhau?
- `equals()` và `hashCode()` có mối quan hệ gì?
- Lựa chọn giữa `ArrayList` và `LinkedList` như thế nào? Tại sao `HashMap` không thread-safe?
- `ConcurrentHashMap` thay đổi như thế nào giữa JDK 7 và JDK 8?
- `synchronized` và `ReentrantLock` có gì khác nhau?
- JMM đảm bảo tính khả kiến (`Visibility`), tính tuần tự (`Ordering`) và tính nguyên tử (`Atomicity`) như thế nào?
- Cấu hình các tham số cốt lõi của Thread Pool như thế nào? Tại sao không khuyến khích dùng trực tiếp `Executors`?
- Vùng nhớ JVM được phân chia như thế nào? Những vùng nào có thể xảy ra `OOM`?
- G1, ZGC, Shenandoah lần lượt phù hợp với kịch bản nào?
- BIO, NIO, AIO có gì khác nhau? Mô hình Reactor giải quyết vấn đề gì?
- Trong Java 8, 11, 17, 21, những tính năng mới nào đáng nắm vững nhất?

## Chuyên đề liên quan

- [Kiến thức nền tảng khoa học máy tính](../cs-basics/)
- [Thiết kế hệ thống](../system-design/)
- [Cơ sở dữ liệu](../database/)
- [Hệ thống kiến thức Hệ thống phân tán](../distributed-system/)
- [Hệ thống kiến thức Hệ thống hiệu năng cao](../high-performance/)
