---
title: "Chuyên đề Nền tảng Thiết kế hệ thống: RESTful API, Công nghệ phần mềm, Đặt tên code, Refactor và Unit Test"
description: "Lộ trình học tập nền tảng thiết kế hệ thống và kỹ thuật Backend cho phỏng vấn, bao gồm RESTful API, công nghệ phần mềm, đặt tên code, Refactor code và Unit Test."
category: Thiết kế hệ thống (System Design)
tag:
  - Thiết kế hệ thống
  - Nền tảng kỹ thuật
  - RESTful API
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Nền tảng thiết kế hệ thống,RESTful API,Công nghệ phần mềm,Đặt tên code,Refactor code,Unit Test,JUnit,Nền tảng kỹ thuật Backend,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/system-design/basis/README.md
---

Chuyên đề Nền tảng Thiết kế hệ thống tập trung vào những năng lực kỹ thuật dễ bị bỏ qua nhất trong phát triển Backend, nhưng lại có ảnh hưởng lớn nhất về lâu dài: cách thiết kế API, cách đặt tên code, cách nhận diện Code Smell, cách viết kiểm thử và cách tổ chức quy trình từ yêu cầu tới bàn giao.

Những nội dung này thoạt nhìn không mang tính "hardcore" như Cache, Message Queue hay Sharding database, nhưng chúng quyết định xem một hệ thống có thể được cả đội ngũ bảo trì lâu dài hay không.

## Phù hợp với ai

- Lập trình viên muốn bổ sung một cách hệ thống các kiến thức nền tảng kỹ thuật Backend.
- Các bạn chuẩn bị câu hỏi phỏng vấn liên quan đến RESTful API, chất lượng code và Unit Test.
- Độc giả đã có thể hoàn thành phát triển nghiệp vụ, nhưng muốn nâng cao khả năng thiết kế API và tính dễ bảo trì của code.
- Kỹ sư cần xây dựng quy chuẩn API, quy chuẩn đặt tên hoặc quy chuẩn kiểm thử cho đội ngũ.

## Trọng tâm học tập

- Cốt lõi của RESTful API không phải là một mẫu URL cứng nhắc, mà là thiết kế các API rõ ràng, nhất quán và có thể tiến hóa xoay quanh tài nguyên (Resource).
- Công nghệ phần mềm quan tâm đến toàn bộ quy trình gồm yêu cầu, thiết kế, phát triển, kiểm thử, bàn giao và bảo trì.
- Đặt tên tốt giúp giảm chi phí giao tiếp, còn đặt tên tệ sẽ khiến hệ thống ngày càng khó sửa đổi.
- Refactor không phải là "viết lại từ đầu" (Rewrite), mà là cải thiện cấu trúc bên trong với tiền đề giữ nguyên hành vi bên ngoài.
- Unit Test phải phục vụ cho chất lượng code và sự tự tin khi thay đổi code, chứ không nên chỉ chạy theo con số tỷ lệ bao phủ (Coverage).

## Thứ tự đọc đề xuất

1. [Hướng dẫn ngắn gọn về Công nghệ phần mềm](./software-engineering.md): Hiểu trước về quy trình phát triển phần mềm, các mô hình phát triển và khái niệm cơ bản về kỹ nghệ hóa phần mềm.
2. [Hướng dẫn ngắn gọn về RESTful API](./RESTfulAPI.md): Học về đường dẫn tài nguyên, phương thức HTTP, mã trạng thái và quy chuẩn thiết kế API.
3. [Hướng dẫn đặt tên code](./naming.md): Xây dựng thói quen đặt tên rõ ràng, nhất quán và dễ đọc.
4. [Hướng dẫn Refactor code](./refactoring.md): Nhận diện Code Smell, hiểu các nguyên tắc và kỹ thuật Refactor phổ biến.
5. [Unit Test thực chất là gì? Nên thực hiện thế nào?](./unit-test.md): Cuối cùng, dùng kiểm thử để nâng cao cảm giác an toàn khi thay đổi code.

## Các bài viết cốt lõi

- [Hướng dẫn ngắn gọn về Công nghệ phần mềm](./software-engineering.md): Hệ thống hóa các khái niệm nền tảng như khủng hoảng phần mềm (Software Crisis), mô hình quy trình phát triển phần mềm, mô hình thác nước (Waterfall) và phát triển linh hoạt (Agile).
- [Hướng dẫn ngắn gọn về RESTful API](./RESTfulAPI.md): Giải thích nguyên tắc kiến trúc REST, thiết kế đường dẫn tài nguyên, cách dùng phương thức HTTP và quy chuẩn mã trạng thái.
- [Hướng dẫn đặt tên code](./naming.md): Tổng kết nguyên tắc và mẹo đặt tên biến, phương thức, lớp để nâng cao tính dễ đọc và dễ bảo trì của code.
- [Hướng dẫn Refactor code](./refactoring.md): Trình bày định nghĩa Refactor, nguyên tắc Refactor, cách nhận diện Code Smell và các kỹ thuật Refactor thường dùng.
- [Unit Test thực chất là gì? Nên thực hiện thế nào?](./unit-test.md): Bao phủ khái niệm Unit Test, Mock và Stub, Kim tự tháp kiểm thử (Test Pyramid) và nền tảng JUnit.

## Câu hỏi tần suất cao

- REST và RESTful API khác nhau ở điểm nào?
- Đường dẫn tài nguyên trong RESTful API nên đặt tên như thế nào?
- GET, POST, PUT, PATCH và DELETE lần lượt phù hợp với những kịch bản nào?
- Vì sao công nghệ phần mềm không chỉ là viết code?
- Việc đặt tên code tốt nên tuân theo những nguyên tắc nào?
- Code Smell là gì? Khi nào nên Refactor?
- Refactor và viết lại (Rewrite) khác nhau như thế nào?
- Unit Test, Integration Test và End-to-End Test khác nhau ra sao?
- Mock và Stub lần lượt giải quyết những vấn đề gì?
- Tỷ lệ bao phủ của Unit Test có phải càng cao càng tốt không?

## Chuyên đề liên quan

- [Hệ thống kiến thức Thiết kế hệ thống](../)
- [Tổng hợp câu hỏi phỏng vấn Design Patterns thường gặp](../design-pattern.md)
- [Chuyên đề Spring & Spring Boot](../framework/spring/)
