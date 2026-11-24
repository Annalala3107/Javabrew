---
title: "Chuyên đề Java cơ bản: Cú pháp, OOP, Generics, Reflection, Proxy & Serialization"
description: "Lộ trình học và phỏng vấn Java cơ bản, bao gồm cú pháp cơ bản, lập trình hướng đối tượng (OOP), từ khóa, truyền tham trị, Generics, Reflection, Proxy, Serialization, SPI, Unsafe và Syntactic Sugar."
category: Java
tag:
  - Java
  - Java cơ bản
  - Phỏng vấn Java
lang: vi
sourceRef: zh-ref/java/basis/README.md
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Java cơ bản,câu hỏi phỏng vấn Java cơ bản,từ khóa Java,truyền tham trị Java,Java Generics,Java Reflection,Java Proxy,Java Serialization,Java SPI,Java Unsafe,Java Syntactic Sugar
---

Java cơ bản là nền tảng tiên quyết để tiếp tục học Collections, Concurrency, JVM, Spring và các loại middleware khác nhau. Phần nội dung này không chỉ dừng lại ở việc học thuộc cú pháp, mà quan trọng hơn là hiểu rõ mô hình đối tượng của Java, cơ chế truyền tham số, xóa kiểu (`Type Erasure`) của Generics, gọi hàm qua Reflection, Dynamic Proxy, ranh giới của Serialization và cơ chế mở rộng của framework.

## Đối tượng phù hợp

- Người đọc mới bắt đầu học Java một cách hệ thống và muốn kết nối cú pháp cơ bản với các cơ chế cốt lõi.
- Các bạn đang chuẩn bị phỏng vấn kiến thức Java cơ bản và muốn nhanh chóng rà soát, bổ sung các lỗ hổng kiến thức.
- Lập trình viên đã từng làm dự án Java nhưng chưa hiểu sâu về các cơ chế như Reflection, Proxy, Generics, SPI, Serialization.
- Kỹ sư cần củng cố kiến thức nền tảng trước khi học sâu vào Collections, Concurrency, JVM hoặc mã nguồn Spring.

## Trọng tâm kiến thức

- Cú pháp cơ bản của Java, lập trình hướng đối tượng (OOP), ngoại lệ (Exception), các lớp thường dùng, từ khóa và các chi tiết lập trình quan trọng.
- Mối quan hệ giữa truyền tham trị (pass-by-value), biến tham chiếu, tính khả biến của đối tượng và việc gọi phương thức.
- Generics, wildcard, xóa kiểu (`Type Erasure`) cùng ảnh hưởng của chúng đối với Collections, thiết kế API và Reflection.
- Các cơ chế phổ biến ở tầng dưới của framework như Reflection, Dynamic Proxy và SPI.
- Những điểm dễ mắc bẫy trong dự án và phỏng vấn như Serialization, `BigDecimal`, `Unsafe` và Syntactic Sugar (cú pháp rút gọn).

## Thứ tự đọc đề xuất

1. [Tổng hợp câu hỏi phỏng vấn Java cơ bản thường gặp (Phần 1)](./java-basic-questions-01.md): Ôn tập nhanh cú pháp Java cơ bản, OOP và các lớp thường dùng.
2. [Tổng hợp câu hỏi phỏng vấn Java cơ bản thường gặp (Phần 2)](./java-basic-questions-02.md) và [Tổng hợp câu hỏi phỏng vấn Java cơ bản thường gặp (Phần 3)](./java-basic-questions-03.md): Bổ sung kiến thức về Exception, Generics, Reflection, Annotation và các lỗi dễ gặp.
3. [Tổng hợp từ khóa trong Java](./java-keyword-summary.md) và [Giải thích chi tiết truyền tham trị trong Java](./why-there-only-value-passing-in-java.md): Làm rõ những hiểu nhầm phổ biến về các khái niệm nền tảng.
4. [Giải thích chi tiết Generics & Wildcards](./generics-and-wildcards.md), [Giải thích chi tiết cơ chế Reflection trong Java](./reflection.md), [Giải thích chi tiết Proxy Pattern trong Java](./proxy.md): Hiểu các năng lực cốt lõi nằm bên dưới các framework.
5. [Giải thích chi tiết Serialization trong Java](./serialization.md), [Giải thích chi tiết cơ chế Java SPI](./spi.md), [Giải thích chi tiết lớp ma thuật Unsafe trong Java](./unsafe.md): Tiếp tục bổ sung kiến thức mở rộng cho thực tiễn kỹ thuật và đọc hiểu mã nguồn.

## Các bài viết cốt lõi

### Câu hỏi phỏng vấn cơ bản

- [Tổng hợp câu hỏi phỏng vấn Java cơ bản thường gặp (Phần 1)](./java-basic-questions-01.md): Bao phủ đặc điểm ngôn ngữ Java, cú pháp cơ bản, OOP, các lớp thường dùng và các lỗi dễ mắc phải.
- [Tổng hợp câu hỏi phỏng vấn Java cơ bản thường gặp (Phần 2)](./java-basic-questions-02.md): Tiếp tục hệ thống hóa Exception, Generics, Reflection, Annotation và các kiến thức nền tảng liên quan.
- [Tổng hợp câu hỏi phỏng vấn Java cơ bản thường gặp (Phần 3)](./java-basic-questions-03.md): Bổ sung các câu hỏi phỏng vấn nền tảng thiên về chi tiết và nâng cao hơn.

### Cơ chế ngôn ngữ

- [Tổng hợp từ khóa trong Java](./java-keyword-summary.md): Giải thích rõ các từ khóa như `final`, `static`, `this`, `super`.
- [Giải thích chi tiết truyền tham trị trong Java](./why-there-only-value-passing-in-java.md): Giải thích vì sao Java chỉ có truyền tham trị (pass-by-value) và ngữ nghĩa thực sự khi truyền biến tham chiếu vào phương thức.
- [Giải thích chi tiết Generics & Wildcards](./generics-and-wildcards.md): Hiểu cú pháp Generics, wildcard cận trên/cận dưới, xóa kiểu (`Type Erasure`) và các tình huống sử dụng phổ biến.
- [Giải thích chi tiết Syntactic Sugar trong Java](./syntactic-sugar.md): Tìm hiểu cách trình biên dịch xử lý các Syntactic Sugar như vòng lặp `for` cải tiến, autoboxing/unboxing, enum và Lambda.

### Cơ chế nền tảng của Framework

- [Giải thích chi tiết cơ chế Reflection trong Java](./reflection.md): Hiểu đối tượng `Class`, gọi hàm qua Reflection, chi phí hiệu năng và các tình huống sử dụng.
- [Giải thích chi tiết Proxy Pattern trong Java](./proxy.md): Nắm vững Static Proxy, JDK Dynamic Proxy và CGLIB Proxy.
- [Giải thích chi tiết cơ chế Java SPI](./spi.md): Hiểu cơ chế phát hiện dịch vụ (service discovery) và mở rộng dạng plugin.
- [Giải thích chi tiết Serialization trong Java](./serialization.md): Hiểu quy trình Serialization, `serialVersionUID`, rủi ro bảo mật và các giải pháp thay thế.

### Chi tiết thực tiễn

- [Giải thích chi tiết BigDecimal](./bigdecimal.md): Nắm vững cách tính toán tiền tệ, độ chính xác, chế độ làm tròn (`RoundingMode`) và lưu ý khi khởi tạo.
- [Trong Java, tiền tệ nên dùng long hay BigDecimal?](./money-long-vs-bigdecimal.md): Phân biệt giữa kịch bản lưu trữ và tính toán tiền tệ; nắm rõ đơn vị nhỏ nhất, làm tròn, tràn số (overflow) và thiết kế cột cơ sở dữ liệu.
- [Giải thích chi tiết lớp ma thuật Unsafe trong Java](./unsafe.md): Tìm hiểu bộ nhớ ngoài Heap (off-heap memory), CAS, độ lệch trường đối tượng (field offset) và các năng lực tầng thấp trong mã nguồn.

## Câu hỏi thường gặp

- Java là truyền tham trị (pass-by-value) hay truyền tham chiếu (pass-by-reference)? Vì sao khi truyền đối tượng làm tham số lại có thể thay đổi giá trị trường (field) của nó?
- `==` và `equals()` khác nhau như thế nào? Vì sao khi ghi đè (`Override`) `equals()` bắt buộc phải ghi đè cả `hashCode()`?
- Nên lựa chọn giữa `String`, `StringBuilder` và `StringBuffer` như thế nào?
- `final`, `static`, `this`, `super` lần lượt có tác dụng gì?
- Xóa kiểu (`Type Erasure`) của Generics là gì? `List<String>` và `List<Integer>` có gì khác nhau ở thời điểm runtime?
- Vì sao Reflection chậm? Có những tình huống sử dụng điển hình nào?
- JDK Dynamic Proxy và CGLIB Dynamic Proxy khác nhau ở điểm nào?
- Vì sao không khuyến khích sử dụng trực tiếp cơ chế Serialization mặc định của Java?
- Vì sao nên khởi tạo `BigDecimal` bằng chuỗi (`String`)?
- Số tiền nên dùng `long` để lưu theo đơn vị nhỏ nhất, hay dùng `BigDecimal`?

## Chuyên đề liên quan

- [Hệ thống kiến thức Java](../)
- [Chuyên đề Java Collections](../collection/)
- [Chuyên đề Lập trình đa luồng Java (Concurrency)](../concurrent/)
- [Chuyên đề JVM](../jvm/)
- [Spring](../../system-design/framework/spring/)
