---
title: "Chuyên đề lập trình đồng thời Java: Thread, Lock, JMM, CAS, AQS, Thread Pool & Virtual Thread"
description: "Lộ trình học tập và phỏng vấn lập trình đồng thời (Concurrency) Java, bao gồm Thread, Lock, synchronized, ReentrantLock, JMM, CAS, AQS, ThreadLocal, Thread Pool, CompletableFuture và Virtual Thread."
category: Java
tag:
  - Java
  - Java Concurrency
  - Phỏng vấn Java
lang: vi
sourceRef: zh-ref/java/concurrent/README.md
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Java Concurrency,Java Lock,synchronized,ReentrantLock,JMM,CAS,AQS,ThreadLocal,Thread Pool,CompletableFuture,Concurrent Collections,Atomic,Virtual Thread
---

Lập trình đồng thời Java (Java Concurrency) là một trong những mảng quan trọng nhất và cũng dễ gây nhầm lẫn nhất trong phát triển Backend cũng như khi phỏng vấn. Học lập trình đồng thời không thể chỉ học thuộc API, mà cần đặt vòng đời của Thread (luồng), cơ chế khóa (Lock), mô hình bộ nhớ (Memory Model), thao tác nguyên tử (Atomic Operation), Thread Pool và các lớp tiện ích đồng thời trên cùng một mạch tư duy xuyên suốt.

## Phù hợp với ai

- Lập trình viên Backend muốn học lập trình đồng thời Java một cách bài bản.
- Các bạn đang chuẩn bị câu hỏi phỏng vấn về Thread, Lock, JMM, CAS, AQS, Thread Pool, v.v.
- Độc giả đã từng sử dụng đa luồng trong dự án, nhưng chưa nắm vững các vấn đề như Deadlock, tham số Thread Pool hay rò rỉ bộ nhớ (Memory Leak) của `ThreadLocal`.
- Kỹ sư muốn hiểu năng lực thực hành kỹ thuật với Concurrent Collections, `CompletableFuture`, Virtual Thread (luồng ảo), v.v.

## Trọng tâm học tập

- Cách tạo Thread, vòng đời, chuyển đổi ngữ cảnh (Context Switch), an toàn luồng (Thread Safety) và các vấn đề đồng thời thường gặp.
- Phạm vi áp dụng của `synchronized`, `volatile`, `ReentrantLock`, khóa loại trừ lẫn nhau (Mutex), khóa đọc-ghi (Read-Write Lock), khóa lạc quan (`Optimistic Lock`) và khóa bi quan (`Pessimistic Lock`).
- JMM, happens-before, sắp xếp lại lệnh (Instruction Reordering), tính khả kiến (`Visibility`), tính nguyên tử (`Atomicity`) và tính tuần tự (`Ordering`).
- Ý tưởng tầng dưới của CAS, các lớp `Atomic`, AQS, Concurrent Collections và Blocking Queue.
- Các tham số cốt lõi của Thread Pool, Rejection Policy (chính sách từ chối), hàng đợi tác vụ (Task Queue), cấu hình tham số và thực hành tốt trên môi trường production.
- Cách sử dụng và rủi ro của `CompletableFuture`, `ThreadLocal`, Virtual Thread trong dự án thực tế.

## Thứ tự đọc khuyến nghị

1. [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 1)](./java-concurrent-questions-01.md): Xây dựng danh sách câu hỏi nền tảng về Thread, Lock và an toàn luồng trước.
2. [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 2)](./java-concurrent-questions-02.md) và [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 3)](./java-concurrent-questions-03.md): Tiếp tục bổ sung kiến thức về JMM, CAS, AQS, Thread Pool và các công cụ đồng thời.
3. [Giải thích chi tiết Lock trong Java](./java-lock.md), [Giải thích chi tiết Khóa lạc quan và Khóa bi quan](./optimistic-lock-and-pessimistic-lock.md), [Giải thích chi tiết CAS](./cas.md), [Giải thích chi tiết JMM (Java Memory Model)](./jmm.md): Xây dựng hệ thống kiến thức về khóa trước, sau đó hiểu ngữ nghĩa tầng dưới của kiểm soát đồng thời.
4. [Giải thích chi tiết AQS](./aqs.md), [Tìm hiểu nguyên lý và ứng dụng của AQS từ cài đặt ReentrantLock](./reentrantlock.md): Hiểu sâu về Lock và bộ đồng bộ (Synchronizer) trong Java.
5. [Giải thích chi tiết Java Thread Pool](./java-thread-pool-summary.md) và [Thực hành tốt nhất với Java Thread Pool](./java-thread-pool-best-practices.md): Nắm vững hạ tầng đồng thời được dùng nhiều nhất trong môi trường production.

## Bài viết cốt lõi

### Câu hỏi phỏng vấn về Concurrency

- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 1)](./java-concurrent-questions-01.md): Bao gồm kiến thức nền tảng về Thread, an toàn luồng, Lock và các vấn đề đồng thời thường gặp.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 2)](./java-concurrent-questions-02.md): Tiếp tục hệ thống hóa các kiến thức cốt lõi như JMM, `volatile`, CAS, AQS.
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Java Concurrency (Phần 3)](./java-concurrent-questions-03.md): Bổ sung các nội dung về Thread Pool, lớp tiện ích đồng thời, `CompletableFuture` và Virtual Thread.

### Lock, Mô hình bộ nhớ và Bộ đồng bộ

- [Giải thích chi tiết Lock trong Java](./java-lock.md): Từ khóa loại trừ lẫn nhau (Mutex), khóa đọc-ghi, Spin Lock đến `synchronized`, `ReentrantLock`, AQS, xây dựng toàn bộ hệ thống khóa trong Java.
- [Giải thích chi tiết Khóa lạc quan và Khóa bi quan](./optimistic-lock-and-pessimistic-lock.md): Hiểu các chiến lược xử lý xung đột đồng thời khác nhau.
- [Giải thích chi tiết CAS](./cas.md): Hiểu Compare-And-Swap, vấn đề ABA và chi phí vòng lặp spin.
- [Giải thích chi tiết JMM (Java Memory Model)](./jmm.md): Nắm vững tính khả kiến (`Visibility`), tính nguyên tử (`Atomicity`), tính tuần tự (`Ordering`) và happens-before.
- [Giải thích chi tiết AQS](./aqs.md): Hiểu hàng đợi đồng bộ (Sync Queue), chế độ độc quyền/chia sẻ (Exclusive/Shared) và tầng dưới của các bộ đồng bộ phổ biến.
- [Tìm hiểu nguyên lý và ứng dụng của AQS từ cài đặt ReentrantLock](./reentrantlock.md): Hiểu sâu về AQS thông qua `ReentrantLock`.

### Công cụ đồng thời và Thực hành kỹ thuật

- [Giải thích chi tiết Java Thread Pool](./java-thread-pool-summary.md): Hiểu các tham số cốt lõi, hàng đợi tác vụ, Rejection Policy (chính sách từ chối) và luồng thực thi.
- [Thực hành tốt nhất với Java Thread Pool](./java-thread-pool-best-practices.md): Tổng hợp các khuyến nghị về cô lập Thread Pool, cấu hình tham số và giám sát trong môi trường production.
- [Tổng hợp các Concurrent Collections phổ biến trong Java](./java-concurrent-collections.md): Hệ thống hóa các container như `ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue`.
- [Tổng hợp các lớp Atomic](./atomic-classes.md): Hiểu cách cập nhật nguyên tử cho kiểu nguyên thủy, mảng, tham chiếu và trường dữ liệu.
- [Giải thích chi tiết ThreadLocal](./threadlocal.md): Hiểu biến cục bộ theo luồng, `ThreadLocalMap` và rủi ro rò rỉ bộ nhớ (Memory Leak).
- [Giải thích chi tiết CompletableFuture](./completablefuture-intro.md): Nắm vững điều phối bất đồng bộ, xử lý ngoại lệ và cách sử dụng Thread Pool.
- [Tổng hợp câu hỏi thường gặp về Virtual Thread](./virtual-thread.md): Hiểu định vị, kịch bản phù hợp và giới hạn sử dụng của Virtual Thread.

## Câu hỏi tần suất cao

- Thread (luồng) và Process (tiến trình) khác nhau như thế nào? Thread có những trạng thái nào?
- An toàn luồng (Thread Safety) là gì? Làm thế nào để xác định vị trí xảy ra Deadlock?
- Khóa loại trừ lẫn nhau (Mutex), khóa đọc-ghi (Read-Write Lock) và Spin Lock khác nhau như thế nào?
- `synchronized` và `ReentrantLock` có điểm gì khác nhau?
- `volatile` có đảm bảo tính nguyên tử (`Atomicity`) không? Nó giải quyết vấn đề gì?
- JMM là gì? Quy tắc happens-before có tác dụng gì?
- CAS có ưu và nhược điểm gì? Vấn đề ABA được giải quyết như thế nào?
- Tư tưởng cốt lõi của AQS là gì? Những lớp tiện ích nào được xây dựng dựa trên AQS?
- Cấu hình các tham số cốt lõi của Thread Pool như thế nào? Lựa chọn Rejection Policy ra sao?
- Tại sao không khuyến khích dùng trực tiếp `Executors` để tạo Thread Pool?
- Tại sao `ThreadLocal` có thể gây rò rỉ bộ nhớ (Memory Leak)?
- Thread Pool mặc định của `CompletableFuture` tiềm ẩn rủi ro gì?
- Virtual Thread có phù hợp với các tác vụ nặng về CPU (CPU-bound) không?

## Chuyên đề liên quan

- [Hệ thống kiến thức Java](../)
- [Chuyên đề Java Collections](../collection/)
- [Chuyên đề JVM](../jvm/)
- [Chuyên đề Java IO](../io/)
- [Hệ điều hành](../../cs-basics/operating-system/)
