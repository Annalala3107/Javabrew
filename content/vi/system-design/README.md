---
title: "Hệ thống kiến thức Thiết kế hệ thống (System Design): Design Patterns, Nền tảng kỹ thuật, Xác thực & Phân quyền, An toàn dữ liệu và Các Framework phổ biến"
description: "Lộ trình học tập và ôn thi phỏng vấn Thiết kế hệ thống (System Design), bao gồm Design Patterns, RESTful API, công nghệ phần mềm, Refactor code, Unit Test, xác thực & phân quyền, an toàn dữ liệu, Spring và đẩy thông điệp thời gian thực."
category: Thiết kế hệ thống (System Design)
tag:
  - Thiết kế hệ thống
  - Design Patterns
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Thiết kế hệ thống,Câu hỏi phỏng vấn thiết kế hệ thống,Design Patterns,RESTful API,Công nghệ phần mềm,Refactor code,Unit Test,Xác thực và phân quyền,JWT,SSO,Hệ thống phân quyền,An toàn dữ liệu,Spring,Spring Boot,MyBatis,Netty,Tác vụ định kỳ,Đẩy thông điệp thời gian thực,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/system-design/README.md
---

Tài liệu **Hệ thống kiến thức Thiết kế hệ thống (System Design)** này hướng tới việc học Backend, thực hành kỹ thuật và ôn tập phỏng vấn, tổng hợp các bài viết liên quan đến thiết kế hệ thống trên trang xoay quanh mục tiêu "chia nhỏ yêu cầu nghiệp vụ thành các giải pháp kỹ thuật ổn định, dễ bảo trì và có khả năng mở rộng".

Thiết kế hệ thống không chỉ là học thuộc các bài toán tình huống như Flash Sale, rút gọn link (Short URL) hay News Feed. Khi đi vào phát triển Backend thực tế, bạn còn cần nắm vững các năng lực nền tảng như thiết kế API, chất lượng code, Design Patterns, nguyên lý Framework, xác thực và phân quyền, an toàn dữ liệu, tác vụ định kỳ (Scheduled Tasks) và đẩy thông điệp thời gian thực. Bạn có thể bổ sung nền tảng một cách bài bản theo thứ tự đọc dưới đây.

## Phù hợp với ai

- Lập trình viên đang học Thiết kế hệ thống Backend một cách bài bản.
- Các bạn chuẩn bị phỏng vấn Backend cho vị trí thực tập/mới tốt nghiệp, đã có kinh nghiệm hoặc tại các công ty công nghệ vừa và lớn.
- Kỹ sư muốn nâng cấp từ mức "viết được code nghiệp vụ" lên "có khả năng thiết kế module và giải pháp kỹ thuật".
- Độc giả đã từng tiếp xúc với Spring, MyBatis, hệ thống phân quyền, tác vụ định kỳ,... nhưng còn thiếu hệ thống hóa kiến thức.

## Trọng tâm học tập

- Trong phỏng vấn thiết kế hệ thống, làm sao tổ chức câu trả lời theo mạch: làm rõ yêu cầu, luồng xử lý cốt lõi, mô hình dữ liệu, thiết kế API, khả năng mở rộng và các điểm rủi ro?
- Các nền tảng kỹ thuật như RESTful API, đặt tên, Refactor và Unit Test ảnh hưởng thế nào tới chi phí bảo trì dài hạn?
- Design Patterns không phải là học thuộc sơ đồ UML, mà là hiểu cách đóng gói những điểm thay đổi thường gặp.
- Các framework như Spring, MyBatis, Netty lần lượt giải quyết những độ phức tạp kỹ thuật nào?
- Xác thực & phân quyền, JWT, SSO, hệ thống phân quyền và an toàn dữ liệu lần lượt bao phủ những khâu nào trong chuỗi bảo mật?
- Tác vụ định kỳ và đẩy thông điệp thời gian thực có những vấn đề lựa chọn giải pháp và độ ổn định nào trong môi trường Production?

## Thứ tự đọc đề xuất

1. [Chuyên đề Nền tảng Thiết kế hệ thống](./basis/): Bổ sung đầy đủ kiến thức về RESTful API, công nghệ phần mềm, đặt tên code, Refactor code và Unit Test.
2. [Tổng hợp câu hỏi phỏng vấn Design Patterns thường gặp](./design-pattern.md): Hiểu các Design Patterns phổ biến phù hợp để giải quyết những điểm thay đổi nào.
3. [Chuyên đề Spring & Spring Boot](./framework/spring/): Nắm vững IoC, AOP, Transaction, Auto-Configuration, các Annotation thường dùng và Design Patterns trong Framework.
4. [Chuyên đề Xác thực, Phân quyền & An toàn dữ liệu](./security/): Hiểu một cách hệ thống về xác thực và phân quyền, JWT, SSO, hệ thống phân quyền, mã hóa, che giấu dữ liệu (Data Masking) và kiểm tra hợp lệ dữ liệu.
5. Sau đó tùy theo nhu cầu dự án, đọc thêm [Giải thích chi tiết Tác vụ định kỳ trong Java](./schedule-task.md) và [Giải thích chi tiết Đẩy thông điệp thời gian thực trên Web](./web-real-time-message-push.md).

## Các bài viết cốt lõi

### Thiết kế hệ thống & Nền tảng kỹ thuật

- [Chuyên đề Nền tảng Thiết kế hệ thống](./basis/): Trình bày từ RESTful API, công nghệ phần mềm đến đặt tên code, Refactor code và Unit Test.
- [Hướng dẫn ngắn gọn về RESTful API](./basis/RESTfulAPI.md): Hiểu mô hình hóa tài nguyên, phương thức HTTP, mã trạng thái (Status Code) và quy chuẩn thiết kế API.
- [Hướng dẫn Refactor code](./basis/refactoring.md): Hiểu Code Smell (mùi code xấu), nguyên tắc Refactor và các kỹ thuật Refactor phổ biến.
- [Unit Test thực chất là gì? Nên thực hiện thế nào?](./basis/unit-test.md): Hiểu về Unit Test, Mock, Stub, Kim tự tháp kiểm thử (Test Pyramid) và nền tảng JUnit.
- [Tổng hợp câu hỏi phỏng vấn Design Patterns thường gặp](./design-pattern.md): Hệ thống hóa các Design Patterns phổ biến như Singleton, Factory, Proxy, Chain of Responsibility, Strategy, Observer,...
- [State Machine và Điều phối quy trình (Workflow Orchestration)](./state-machine-and-workflow.md): Hiểu chuyển trạng thái có điều kiện, hội tụ luồng song song, thử lại tác vụ (Retry), tính lũy đẳng (Idempotency) và quản lý phiên bản quy trình.

### Các Framework phổ biến

- [Chuyên đề Spring & Spring Boot](./framework/spring/): Xâu chuỗi các câu hỏi thường gặp về Spring, Spring MVC và Spring Boot.
- [Tổng hợp câu hỏi phỏng vấn Spring thường gặp](./framework/spring/spring-knowledge-and-questions-summary.md): Bao phủ các vấn đề cốt lõi như IoC, AOP, vòng đời Bean, Dependency Injection,...
- [Tổng hợp câu hỏi phỏng vấn MyBatis thường gặp](./framework/mybatis/mybatis-interview.md): Hiểu `#{}` và `${}`, Dynamic SQL, bộ nhớ đệm (Cache), plugin phân trang và ánh xạ Mapper.

### Xác thực, Phân quyền & An toàn dữ liệu

- [Chuyên đề Xác thực, Phân quyền & An toàn dữ liệu](./security/): Triển khai xoay quanh xác thực và phân quyền, JWT, SSO, hệ thống phân quyền, mã hóa, che giấu dữ liệu và kiểm tra dữ liệu.
- [Giải thích chi tiết khái niệm nền tảng Xác thực & Phân quyền](./security/basis-of-authority-certification.md): Hiểu các khái niệm cơ bản như Authentication, Authorization, Session, Token, OAuth2,...
- [Giải thích chi tiết khái niệm cơ bản về JWT](./security/jwt-intro.md): Hiểu cấu trúc JWT, chữ ký, luồng hoạt động và các kịch bản đăng nhập xác thực.
- [Giải thích chi tiết Thiết kế hệ thống phân quyền](./security/design-of-authority-system.md): Hiểu mô hình phân quyền RBAC và cách thiết kế hệ thống phân quyền.
- [Tổng hợp các thuật toán mã hóa phổ biến](./security/encryption-algorithms.md): Hiểu mã hóa đối xứng, mã hóa bất đối xứng, thuật toán băm (Hash) và các kịch bản ứng dụng phổ biến.
- [Tổng hợp giải pháp che giấu dữ liệu (Data Masking)](./security/data-desensitization.md): Hiểu các quy tắc che giấu dữ liệu nhạy cảm phổ biến và cách triển khai trong kỹ thuật.

### Lập lịch tác vụ & Đẩy thông điệp

- [Giải thích chi tiết Tác vụ định kỳ trong Java](./schedule-task.md): Hệ thống hóa `Timer`, `ScheduledThreadPoolExecutor`, `DelayQueue`, Timing Wheel, Spring `@Scheduled` và các framework lập lịch tác vụ phân tán.
- [Giải thích chi tiết Đẩy thông điệp thời gian thực trên Web](./web-real-time-message-push.md): Hiểu Short Polling, Long Polling, SSE, WebSocket và cách lựa chọn giải pháp đẩy thông điệp.
- [Kiến thức cơ bản về J2EE](./J2EE基础知识.md): Ôn lại các kiến thức nền tảng Java Web như Servlet, chuyển tiếp (Forward) và chuyển hướng (Redirect) request, Session và Cookie.

## Câu hỏi tần suất cao

- Bài toán thiết kế hệ thống nên trả lời theo cấu trúc nào?
- Trong thiết kế RESTful API, đường dẫn tài nguyên, phương thức HTTP và mã trạng thái nên sử dụng ra sao?
- Vì sao việc đặt tên code, Refactor và Unit Test lại ảnh hưởng đến khả năng bảo trì của hệ thống?
- Các Design Patterns phổ biến giải quyết vấn đề gì và có những ứng dụng nào trong Spring?
- State Machine và điều phối quy trình (Workflow Orchestration) lần lượt phù hợp với kịch bản nào? Các tác vụ song song hội tụ đáng tin cậy bằng cách nào?
- Nên hiểu Spring IoC, AOP, vòng đời Bean và cơ chế Transaction như thế nào?
- Luồng cốt lõi của cơ chế Auto-Configuration trong Spring Boot là gì?
- `#{}` và `${}` trong MyBatis khác nhau ở điểm nào? Cache cấp 1 và Cache cấp 2 hoạt động ra sao?
- Xác thực (Authentication) và phân quyền (Authorization) khác nhau thế nào? Session, Token, JWT, OAuth2 lần lượt phù hợp với kịch bản nào?
- Hệ thống phân quyền RBAC nên được thiết kế như thế nào?
- Data Masking, kiểm tra hợp lệ dữ liệu và thuật toán mã hóa lần lượt giải quyết những bài toán bảo mật nào?
- Nên lựa chọn framework tác vụ định kỳ như thế nào? Cần chú ý những vấn đề gì khi lập lịch tác vụ phân tán?
- Có những phương án nào để đẩy thông điệp thời gian thực trên Web? Nên cân nhắc lựa chọn giữa Short Polling, SSE và WebSocket như thế nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức Thiết kế hệ thống High Performance](../high-performance/)
- [Hệ thống kiến thức Thiết kế hệ thống High Availability](../high-availability/)
- [Hệ thống kiến thức Hệ thống phân tán](../distributed-system/)
- [Cơ sở dữ liệu (Database)](../database/)
- [Mạng máy tính](../cs-basics/network/other-network-questions.md)
