---
title: "Chuyên đề RPC (Remote Procedure Call): Nguyên lý, Quy trình gọi, Serialization, Service Discovery, Dubbo & gRPC"
description: "Lộ trình học tập và ôn phỏng vấn RPC, bao gồm nguyên lý RPC, quy trình gọi hàm từ xa, Dynamic Proxy, Serialization, truyền tải mạng, Service Discovery, Load Balancing, Dubbo, gRPC và so sánh HTTP với RPC."
category: Hệ thống phân tán
tag:
  - RPC
  - Dubbo
  - Hệ thống phân tán
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: RPC,nguyên lý RPC,RPC framework,Dubbo,gRPC,Thrift,gọi thủ tục từ xa,Service Discovery,Dynamic Proxy,giao thức Serialization,Load Balancing,khác biệt giữa HTTP và RPC,phỏng vấn Backend
lang: vi
sourceRef: zh-ref/distributed-system/rpc/README.md
---

RPC (Remote Procedure Call — Gọi thủ tục từ xa) là một trong những phương thức gọi dịch vụ phổ biến nhất trong hệ thống phân tán. Mục tiêu của RPC là giúp việc gọi một dịch vụ từ xa trở nên tự nhiên như gọi một phương thức cục bộ, đồng thời đóng gói các chi tiết phức tạp như giao tiếp mạng, Serialization (tuần tự hóa), Service Discovery (khám phá dịch vụ), Load Balancing (cân bằng tải), cơ chế timeout & retry và quản trị chịu lỗi.

## Phù hợp với ai

- Lập trình viên Backend muốn hiểu nguyên lý hoạt động bên dưới của các RPC framework.
- Ứng viên đang chuẩn bị cho các câu hỏi phỏng vấn liên quan đến RPC, Dubbo và giao tiếp giữa các microservices.
- Độc giả đã từng sử dụng Feign, Dubbo hoặc gRPC, nhưng chưa nắm vững quy trình gọi ở tầng dưới và cơ chế quản trị dịch vụ (Service Governance).
- Kỹ sư cần đánh giá và lựa chọn xem lời gọi giữa các dịch vụ nội bộ nên sử dụng HTTP hay RPC.

## Trọng tâm học tập

- RPC là một mô hình gọi từ xa, không phải một giao thức cụ thể đơn lẻ.
- Một lời gọi RPC thông thường sẽ đi qua các bước như Dynamic Proxy, Serialization, truyền tải mạng, Service Discovery, Load Balancing và Deserialization kết quả trả về.
- Các framework như Dubbo, gRPC hay Thrift có trọng tâm thiết kế khác nhau; không nên đánh đồng RPC chỉ đơn thuần là "hiệu năng cao hơn".
- HTTP và RPC không loại trừ lẫn nhau — gRPC chính là ví dụ điển hình của việc truyền tải lời gọi RPC trên nền tảng HTTP/2.
- Trong phỏng vấn, bạn cần trình bày được theo các tầng: "vì sao cần RPC, RPC hoạt động như thế nào, framework quản trị dịch vụ ra sao và cách lựa chọn công nghệ".

## Mối liên hệ với các bài viết Hệ thống phân tán khác

RPC chủ yếu giải quyết bài toán **các dịch vụ gọi lẫn nhau như thế nào**. Nó thường xuất hiện cùng với [API Gateway](../api-gateway.md), nhưng hai thành phần này nằm ở các vị trí khác nhau: API Gateway phụ trách điểm vào lưu lượng từ bên ngoài (ingress) và quản trị tập trung, còn RPC thường được dùng nhiều hơn cho việc gọi nhau giữa các dịch vụ nội bộ.

Các RPC framework thường phụ thuộc vào đăng ký và khám phá dịch vụ (Service Registration & Discovery), cân bằng tải (Load Balancing), cơ chế timeout & retry và khả năng chịu lỗi cụm (Cluster Fault Tolerance). Để nắm trọn chuỗi kiến thức này, bạn có thể đọc chuyên đề này kết hợp với [Giải thích chi tiết Distributed Configuration Center](../distributed-configuration-center.md) và [Chuyên đề ZooKeeper](../distributed-process-coordination/zookeeper/).

## Thứ tự đọc đề xuất

1. [Đã có giao thức HTTP, tại sao vẫn cần RPC?](../../cs-basics/network/http-vs-rpc.md): Trước tiên làm rõ mối quan hệ giữa HTTP và RPC.
2. [Giải thích chi tiết RPC (Remote Procedure Call)](./rpc-intro.md): Tiếp theo hiểu có hệ thống về quy trình gọi RPC, các thành phần cốt lõi và cách lựa chọn framework.
3. [Tổng hợp câu hỏi phỏng vấn Dubbo](./dubbo.md): Cuối cùng đặt RPC vào một framework trưởng thành như Dubbo để tìm hiểu về quản trị dịch vụ và kinh nghiệm vận hành thực tế.

## Các bài viết cốt lõi

- [Giải thích chi tiết RPC (Remote Procedure Call)](./rpc-intro.md): Hiểu nguyên lý cơ bản của RPC dưới các góc độ: quy trình gọi, Dynamic Proxy, giao thức Serialization, truyền tải mạng và Service Discovery.
- [Tổng hợp câu hỏi phỏng vấn Dubbo](./dubbo.md): Xâu chuỗi nguyên lý kiến trúc Dubbo, Service Export & Reference, cơ chế mở rộng SPI, cân bằng tải, chịu lỗi cụm, Service Registry và các vấn đề thực tế trong production.
- [Đã có giao thức HTTP, tại sao vẫn cần RPC?](../../cs-basics/network/http-vs-rpc.md): Giải thích mối quan hệ giữa HTTP và RPC, tránh hiểu nhầm đơn giản rằng RPC chỉ là "một giao thức cao cấp hơn HTTP".

## Câu hỏi thường gặp

- Một quy trình gọi RPC hoàn chỉnh diễn ra theo các bước nào?
- Tại sao các RPC framework thường sử dụng Dynamic Proxy?
- Những giao thức Serialization phổ biến trong RPC là gì và cách lựa chọn chúng ra sao?
- Quá trình Service Export (xuất bản dịch vụ) và Service Reference (tham chiếu dịch vụ) của Dubbo diễn ra như thế nào?
- Cơ chế SPI, cân bằng tải (Load Balancing) và chịu lỗi cụm (Cluster Fault Tolerance) của Dubbo được triển khai ra sao?
- HTTP và RPC khác nhau ở điểm nào? Tại sao giao tiếp giữa các dịch vụ nội bộ thường dùng RPC?
- Tại sao nói gRPC là RPC, và tại sao nó lại được xây dựng trên nền tảng HTTP/2?
- Khi chọn HTTP hay RPC cho lời gọi dịch vụ nội bộ, nên đánh giá dựa trên những tiêu chí nào?

## Chuyên đề liên quan

- [Hệ thống kiến thức Hệ thống phân tán](../)
- [Giải thích chi tiết API Gateway](../api-gateway.md)
- [Tổng hợp câu hỏi phỏng vấn Spring Cloud Gateway](../spring-cloud-gateway-questions.md)
- [Mạng máy tính](../../cs-basics/network/)
