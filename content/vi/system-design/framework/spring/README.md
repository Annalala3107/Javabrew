---
title: "Chuyên đề Spring & Spring Boot: IoC, AOP, Transaction, Auto-Configuration, Annotation thường dùng và Mã nguồn"
description: "Lộ trình học và phỏng vấn Spring cùng Spring Boot, bao gồm IoC, AOP, vòng đời Bean, Transaction, Auto-Configuration, các annotation phổ biến, Design Pattern, @Async, mã nguồn và các câu hỏi phỏng vấn thường gặp."
category: Framework
tag:
  - Spring
  - Spring Boot
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Spring,Spring Boot,Câu hỏi phỏng vấn Spring,Câu hỏi phỏng vấn Spring Boot,IoC,AOP,Vòng đời Bean,Spring Transaction,Spring Auto-Configuration,Annotation Spring thường dùng,Mã nguồn Spring,@Async,Phỏng vấn Java Backend
lang: vi
sourceRef: zh-ref/system-design/framework/spring/README.md
---

Spring là một trong những hạ tầng cốt lõi nhất của lập trình viên Java Backend. Học Spring không thể chỉ học thuộc lòng annotation, mà còn phải hiểu rõ IoC, AOP, vòng đời Bean, Transaction, Auto-Configuration, Design Pattern và các điểm mở rộng (extension point) phổ biến.

Spring Boot tích hợp sâu hơn nữa việc cấu hình, quản lý dependency, tự động cấu hình (Auto-Configuration) và khả năng quan sát (Observability) trên môi trường production, giúp phát triển ứng dụng nhanh hơn nhưng cũng dễ khiến người dùng bỏ qua nguyên lý tầng dưới.

Nếu thời gian gấp, bạn có thể xem trước bản ôn thi cấp tốc [Tổng hợp câu hỏi phỏng vấn Spring thường gặp](https://interview.javaguide.cn/system-design/spring.html), rồi quay lại chuyên đề này để bổ sung đầy đủ chi tiết về IoC, AOP, Transaction và Auto-Configuration.

## Phù hợp với ai

- Lập trình viên Java Backend đang học Spring, Spring MVC và Spring Boot một cách bài bản.
- Các bạn đang ôn tập câu hỏi phỏng vấn tần suất cao về Spring và Spring Boot.
- Độc giả đã từng làm dự án với Spring Boot nhưng chưa hiểu sâu về IoC, AOP, Transaction và Auto-Configuration.
- Kỹ sư muốn tìm hiểu hạ tầng kỹ thuật Backend từ góc độ nguyên lý framework.

## Trọng tâm học tập

- Spring IoC giải quyết bài toán khởi tạo đối tượng và quản lý phụ thuộc, còn AOP giải quyết việc tái sử dụng logic cắt ngang (cross-cutting logic).
- Vòng đời Bean, Scope, phụ thuộc vòng (Circular Dependency) và các điểm mở rộng là chìa khóa để hiểu Spring Container.
- Với Spring Transaction, cần nắm vững hành vi lan truyền (Propagation), mức cô lập (Isolation Level), quy tắc rollback và các tình huống mất hiệu lực.
- Cốt lõi của Spring Boot Auto-Configuration nằm ở cấu hình có điều kiện (Conditional), ánh xạ cấu hình (Configuration Binding) và hệ sinh thái Starter.
- Học annotation không chỉ nhớ công dụng, mà còn phải biết năng lực của Container đứng phía sau nó.
- Mã nguồn Spring và Design Pattern phù hợp để đào sâu thêm hiểu biết; không nên lao vào đọc chi tiết mã nguồn ngay từ đầu.

## Thứ tự đọc đề xuất

1. [Tổng hợp câu hỏi phỏng vấn Spring thường gặp](./spring-knowledge-and-questions-summary.md): Lập danh sách các vấn đề Spring tần suất cao trước.
2. [Giải thích chi tiết IoC & AOP (Hiểu nhanh bản chất)](./ioc-and-aop.md): Nắm vững hai khái niệm nền tảng cốt lõi nhất của Spring.
3. [Tổng hợp Annotation thường dùng trong Spring, Spring MVC & Spring Boot](./spring-common-annotations.md): Gắn kết các annotation quen thuộc với năng lực tương ứng của Container.
4. [Giải thích chi tiết Spring Transaction](./spring-transaction.md): Tập trung nắm hành vi lan truyền, mức cô lập, quy tắc rollback và các trường hợp mất hiệu lực.
5. [Giải thích chi tiết nguyên lý Auto-Configuration của Spring Boot](./spring-boot-auto-assembly-principles.md): Hiểu vì sao Spring Boot có thể chạy ngay sau khi cài đặt (out-of-the-box).
6. Sau đó tùy nhu cầu đọc thêm [Giải thích chi tiết Design Pattern trong Spring](./spring-design-patterns-summary.md) và [Phân tích nguyên lý Annotation `@Async`](./async.md).

## Các bài viết cốt lõi

- [Tổng hợp câu hỏi phỏng vấn Spring thường gặp](./spring-knowledge-and-questions-summary.md): Bao quát các kiến thức cốt lõi của Spring như IoC Container, nguyên lý AOP, vòng đời Bean, Dependency Injection,...
- [Giải thích chi tiết IoC & AOP (Hiểu nhanh bản chất)](./ioc-and-aop.md): Trình bày Inversion of Control, Dependency Injection, lập trình hướng khía cạnh (AOP) và cơ chế Dynamic Proxy.
- [Tổng hợp Annotation thường dùng trong Spring, Spring MVC & Spring Boot](./spring-common-annotations.md): Hệ thống hóa các annotation phổ biến như `@Autowired`, `@Component`, `@RequestMapping`,...
- [Giải thích chi tiết Spring Transaction](./spring-transaction.md): Bao quát `@Transactional`, hành vi lan truyền Transaction, mức cô lập, các kịch bản mất hiệu lực và quy tắc rollback.
- [Giải thích chi tiết nguyên lý Auto-Configuration của Spring Boot](./spring-boot-auto-assembly-principles.md): Phân tích `@EnableAutoConfiguration`, cơ chế nạp `spring.factories` và các annotation điều kiện.
- [Vì sao file JAR của Spring Boot có thể chạy trực tiếp?](./spring-boot-executable-jar.md): Hiểu về Manifest, Boot Loader, cơ chế nạp dependency lồng nhau và quy trình đóng gói executable JAR.
- [Giải thích chi tiết Design Pattern trong Spring](./spring-design-patterns-summary.md): Hiểu cách áp dụng các mẫu thiết kế như Factory, Proxy, Singleton, Template Method,... trong Spring.
- [Phân tích nguyên lý Annotation `@Async`](./async.md): Hiểu cấu hình tác vụ bất đồng bộ, thiết lập Thread Pool và cơ chế `@EnableAsync`.

## Câu hỏi tần suất cao

- IoC là gì? DI là gì?
- Spring AOP và Dynamic Proxy có mối quan hệ gì?
- Vòng đời của Spring Bean diễn ra như thế nào?
- Spring giải quyết phụ thuộc vòng (Circular Dependency) ra sao? Những phụ thuộc vòng nào không giải quyết được?
- `@Autowired` và `@Resource` khác nhau ở điểm nào?
- Spring Transaction có những hành vi lan truyền (Propagation) nào?
- `@Transactional` thường mất hiệu lực trong những kịch bản nào?
- Quy trình Auto-Configuration của Spring Boot diễn ra thế nào?
- Vì sao file JAR của Spring Boot chạy được trực tiếp? Boot Loader và Web Server nhúng đảm nhận phần việc gì?
- Vai trò của Starter là gì? Tự viết một Starter như thế nào?
- Spring đã sử dụng những Design Pattern nào?
- Vì sao `@Async` đôi khi không có tác dụng?
- Khi đọc mã nguồn Spring thì nên bắt đầu từ những điểm vào (entry point) nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức Thiết kế hệ thống](../../)
- [Chuyên đề Nền tảng Thiết kế hệ thống](../../basis/)
- [Tổng hợp câu hỏi phỏng vấn Design Pattern thường gặp](../../design-pattern.md)
- [Tổng hợp câu hỏi phỏng vấn MyBatis thường gặp](../mybatis/mybatis-interview.md)
- [Hệ thống kiến thức Hệ thống phân tán](../../../distributed-system/)
