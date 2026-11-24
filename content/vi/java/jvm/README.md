---
title: "Chuyên đề JVM: Vùng nhớ, Class Loading, Garbage Collection, Tinh chỉnh tham số và Xử lý sự cố Production"
description: "Lộ trình học tập và tối ưu hiệu năng phục vụ phỏng vấn JVM, bao gồm các vùng nhớ Java, cấu trúc tệp Class, Class Loading, Garbage Collection, tham số JVM, công cụ giám sát JDK và xử lý sự cố trên môi trường production."
category: Java
tag:
  - Java
  - JVM
  - Phỏng vấn Java
lang: vi
sourceRef: zh-ref/java/jvm/README.md
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: JVM,câu hỏi phỏng vấn JVM,vùng nhớ Java,Class Loading,ClassLoader,Garbage Collection,GC,tham số JVM,công cụ giám sát JDK,OOM,tinh chỉnh hiệu năng
---

JVM là nền tảng cốt lõi không thể bỏ qua đối với lập trình viên Java Backend. Mục tiêu của việc học JVM không phải là học thuộc lòng khái niệm, mà là có thể giải thích được đối tượng được khởi tạo và thu hồi như thế nào, lớp được nạp ra sao, GC ảnh hưởng đến ứng dụng thế nào, cấu hình tham số ra sao, cũng như cách chẩn đoán và xử lý các sự cố trên môi trường production như `OOM`, GC diễn ra thường xuyên, hay CPU tăng vọt.

## Phù hợp với ai

- Các lập trình viên Java Backend muốn học JVM một cách hệ thống.
- Các bạn đang chuẩn bị phỏng vấn các câu hỏi liên quan đến bộ nhớ JVM, Class Loading, GC, tinh chỉnh tham số và xử lý sự cố production.
- Độc giả đã từng tham gia vận hành dịch vụ trên production nhưng chưa quen với GC log, heap dump, thread stack và các công cụ của JDK.
- Các kỹ sư muốn tiếp tục đi sâu vào Spring, Netty, middleware hoặc tối ưu hiệu năng.

## Trọng tâm kiến thức

- Các vùng nhớ runtime của JVM, quá trình khởi tạo đối tượng, truy cập đối tượng và các kịch bản gây `OOM`.
- Cấu trúc tệp Class, quá trình Class Loading, `ClassLoader` và mô hình ủy quyền cha (Parent Delegation Model).
- Kiến thức nền tảng về Garbage Collection (GC), cách xác định đối tượng còn sống, thuật toán thu gom rác và các bộ thu gom rác (Garbage Collector) phổ biến.
- Tham số JVM, GC log, heap dump, thread stack và các công cụ giám sát, chẩn đoán phổ biến của JDK.
- Quy trình cơ bản khi xử lý sự cố trên production: quan sát hiện tượng, thu thập chỉ số, phân tích bằng công cụ, định vị nguyên nhân gốc rễ và kiểm chứng sau tối ưu.

## Thứ tự đọc khuyến nghị

1. Khi chuẩn bị phỏng vấn, hãy xem trước [Tổng hợp câu hỏi phỏng vấn JVM thường gặp](./jvm-interview-questions.md) để rà soát xem phần nào mình chưa trả lời trọn vẹn; nếu muốn học bài bản từ đầu, bạn có thể bắt đầu từ bước tiếp theo.
2. [Làm quen với JVM một cách dễ hiểu](./jvm-intro.md): Xây dựng bức tranh tổng quan về JVM trước.
3. [Giải thích chi tiết vùng nhớ Java (Trọng tâm)](./memory-area.md): Hiểu các vùng dữ liệu runtime và các kịch bản gây `OOM` thường gặp.
4. [Giải thích chi tiết cấu trúc tệp Class](./class-file-structure.md), [Giải thích chi tiết quá trình Class Loading](./class-loading-process.md), [Giải thích chi tiết ClassLoader (Trọng tâm)](./classloader.md): Nắm vững hành trình của một lớp từ tệp `.class` đến đối tượng có thể chạy trong bộ nhớ.
5. [Giải thích chi tiết Garbage Collection trong JVM (Trọng tâm)](./jvm-garbage-collection.md): Học bài bản về nền tảng GC, các thuật toán và bộ thu gom rác.
6. [Tổng hợp các tham số JVM quan trọng nhất](./jvm-parameters-intro.md), [Tổng hợp các công cụ giám sát và xử lý sự cố JDK](./jdk-monitoring-and-troubleshooting-tools.md), [Xử lý sự cố trên môi trường Production cho Java Backend](./jvm-in-action.md): Đi vào cấu hình tham số và thực chiến trên môi trường production.

## Bài viết cốt lõi

### Nền tảng JVM và Bộ nhớ

- [Tổng hợp câu hỏi phỏng vấn JVM thường gặp](./jvm-interview-questions.md): Hệ thống hóa các câu hỏi tần suất cao theo từng mảng: bộ nhớ, Class Loading, GC, tham số/công cụ và xử lý sự cố production.
- [Làm quen với JVM một cách dễ hiểu](./jvm-intro.md): Tiếp cận vai trò và cấu tạo của JVM từ góc nhìn tổng thể.
- [Giải thích chi tiết vùng nhớ Java (Trọng tâm)](./memory-area.md): Trình bày về Program Counter Register, JVM Stack, Native Method Stack, Heap, Method Area và Direct Memory.
- [Giải thích chi tiết cấu trúc tệp Class](./class-file-structure.md): Hiểu rõ Magic Number, số phiên bản, Constant Pool, Access Flags, bảng Field, bảng Method và bảng Attribute.

### Class Loading

- [Giải thích chi tiết quá trình Class Loading](./class-loading-process.md): Hệ thống hóa các giai đoạn Loading, Verification, Preparation, Resolution, Initialization, Using và Unloading.
- [Giải thích chi tiết ClassLoader (Trọng tâm)](./classloader.md): Hiểu rõ Bootstrap ClassLoader, Extension ClassLoader (JDK 8) / Platform ClassLoader (JDK 9+), Application ClassLoader và mô hình ủy quyền cha (Parent Delegation Model).

### Garbage Collection và Tinh chỉnh hiệu năng

- [Giải thích chi tiết Garbage Collection trong JVM (Trọng tâm)](./jvm-garbage-collection.md): Hiểu cách xác định đối tượng còn sống, các loại tham chiếu, thuật toán thu gom rác, thu gom theo thế hệ và các Garbage Collector phổ biến.
- [Tổng hợp các tham số JVM quan trọng nhất](./jvm-parameters-intro.md): Tổng hợp các tham số liên quan đến kích thước Heap, GC log, OOM dump, bộ thu gom rác và chẩn đoán.
- [Tổng hợp các công cụ giám sát và xử lý sự cố JDK](./jdk-monitoring-and-troubleshooting-tools.md): Giới thiệu các công cụ như `jps`, `jstat`, `jmap`, `jstack`, `jcmd`, `JConsole`, `VisualVM`, `JMC`.
- [Xử lý sự cố trên môi trường Production cho Java Backend](./jvm-in-action.md): Bắt đầu từ bước xác nhận cảnh báo, xử lý cầm máu và lưu giữ bằng chứng, kết nối quy trình điều tra qua CPU, bộ nhớ, GC, Thread Pool, connection pool, slow SQL, Redis và tình trạng tồn đọng message.

## Câu hỏi tần suất cao

- Các vùng nhớ runtime của JVM được phân chia như thế nào? Vùng nào là vùng riêng của từng Thread?
- Heap và Method Area lần lượt lưu trữ những gì? Direct Memory có thể bị `OOM` không?
- Đối tượng được khởi tạo như thế nào? Có những cách nào để định vị và truy cập đối tượng?
- Quá trình Class Loading gồm những giai đoạn nào? Giai đoạn Initialization được kích hoạt khi nào?
- Mô hình ủy quyền cha (Parent Delegation Model) là gì? Tại sao lại cần nó?
- Làm thế nào để xác định một đối tượng có thể bị thu hồi hay không? Strong, Soft, Weak và Phantom Reference có gì khác nhau?
- Minor GC, Major GC và Full GC khác nhau như thế nào?
- G1, ZGC và Shenandoah lần lượt phù hợp với kịch bản nào?
- Các tham số JVM thường dùng là gì? Làm thế nào để lưu lại GC log và OOM dump trên môi trường production?
- Khi gặp tình trạng CPU tăng vọt, Full GC liên tục hoặc rò rỉ bộ nhớ (Memory Leak), cần điều tra theo hướng nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức Java](../)
- [Chuyên đề Java cơ bản](../basis/)
- [Chuyên đề lập trình đồng thời Java](../concurrent/)
- [Chuyên đề Java IO](../io/)
- [Hệ điều hành](../../cs-basics/operating-system/)
