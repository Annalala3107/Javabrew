---
title: "Chuyên đề Docker: Container, Image, Repository, Volume, Network và Triển khai đóng gói"
description: "Lộ trình học Docker và ôn tập phỏng vấn về container hóa, bao gồm Container, Image, Repository, Docker Engine, Volume, Network, các lệnh thường dùng và thực hành triển khai đóng gói."
category: Công cụ phát triển
tag:
  - Docker
  - Container
  - Triển khai
lang: vi
sourceRef: zh-ref/tools/docker/README.md
sitemap:
  changefreq: weekly
  priority: 0.85
head:
  - - meta
    - name: keywords
      content: Docker,Container,Image,Repository,Docker Engine,Volume,Network,Triển khai đóng gói,Tính nhất quán môi trường,Phát triển Backend
---

Docker là công cụ container hóa rất phổ biến trong phát triển Backend, thường được dùng để khởi chạy nhanh các dịch vụ phụ thuộc như MySQL, Redis, Kafka trên máy cục bộ, đồng thời cũng được sử dụng rộng rãi trong môi trường kiểm thử và bàn giao triển khai. Khi học Docker, bạn cần kết hợp giữa các khái niệm cốt lõi và thực hành câu lệnh.

## Đối tượng phù hợp

- Lập trình viên Backend muốn nhanh chóng nắm bắt kiến thức nền tảng về container hóa với Docker.
- Các bạn cần dùng Docker để dựng môi trường phát triển cục bộ, môi trường kiểm thử hoặc các dịch vụ phụ thuộc.
- Độc giả đang chuẩn bị phỏng vấn, cần trình bày rõ ràng về Container, Image, Volume, Network và sự khác biệt giữa Container với máy ảo (VM).
- Kỹ sư đã biết sao chép các câu lệnh Docker để chạy, nhưng chưa nắm vững cách xây dựng Image, vòng đời của Container và lưu trữ dữ liệu bền vững (Data Persistence).

## Trọng tâm kiến thức

- Container giải quyết bài toán cô lập và đảm bảo tính nhất quán cho môi trường chạy ứng dụng.
- Image là khuôn mẫu tĩnh, Container là thực thể đang chạy được tạo từ Image, còn Repository dùng để phân phối và tái sử dụng Image.
- Các lệnh Docker thường dùng cần nắm xoay quanh quản lý Image, vòng đời Container, xem log, ánh xạ cổng (port mapping) và truy cập vào bên trong Container.
- Volume dùng để lưu trữ dữ liệu bền vững và gắn kết thư mục của máy chủ (host), còn Network dùng để giao tiếp giữa các Container với nhau cũng như giữa Container với dịch vụ bên ngoài.
- Docker Compose dùng để định nghĩa và chạy các ứng dụng đa Container, rất phù hợp cho môi trường phát triển cục bộ và điều phối dịch vụ đơn giản.
- Docker không phải giải pháp triển khai vạn năng; trong môi trường production còn phải cân nhắc thêm về bảo mật Image, giới hạn tài nguyên, logging, giám sát (monitoring) và khả năng điều phối (orchestration).

## Thứ tự đọc đề xuất

1. [Tổng hợp khái niệm cốt lõi về Docker](./docker-intro.md): Trước tiên hãy hiểu về Container, Image, Repository, Docker Engine cũng như sự khác biệt giữa Container và máy ảo.
2. [Thực hành Docker](./docker-in-action.md): Luyện tập qua các câu lệnh thực tế để nắm cách kéo Image, khởi chạy Container, ánh xạ cổng, cấu hình Volume, xem log và triển khai các dịch vụ phổ biến.
3. Kết hợp thực hành với một dự án Java: dùng Docker để khởi chạy các dịch vụ phụ thuộc như MySQL, Redis, sau đó quan sát log, thư mục dữ liệu và ánh xạ cổng.

## Các bài viết cốt lõi

- [Tổng hợp khái niệm cốt lõi về Docker](./docker-intro.md): Giải thích Container, Image, Repository, Docker Engine, kiến trúc Docker, Docker Compose và sự khác nhau giữa Docker với máy ảo.
- [Thực hành Docker](./docker-in-action.md): Thông qua các lệnh thường dùng và tình huống thực tế để hiểu rõ quản lý Image, quản lý Container, triển khai dịch vụ, dựng môi trường cục bộ và xử lý sự cố thường gặp.

## Câu hỏi thường gặp

- Docker giải quyết những vấn đề chính nào?
- Container và máy ảo khác nhau như thế nào?
- Mối quan hệ giữa Image và Container là gì?
- Dockerfile, Image, Container và Repository lần lượt là gì?
- Tại sao dữ liệu có thể bị mất sau khi xóa Container? Volume giải quyết vấn đề gì?
- Ánh xạ cổng (Port Mapping) và mạng Container (Container Network) lần lượt giải quyết những vấn đề gì?
- Làm thế nào để xem log của Container, đi vào bên trong Container, dừng và xóa Container?
- `docker compose` phù hợp để giải quyết bài toán nào? Khác gì so với việc chạy từng lệnh `docker run` riêng lẻ?
- Docker mang lại giá trị gì trong từng môi trường: phát triển (dev), kiểm thử (test) và triển khai (deploy)?

## Chuyên đề liên quan

- [Hệ thống kiến thức Công cụ phát triển](../)
- [Chuyên đề Git](../git/)
- [Chuyên đề Maven](../maven/)
- [Thiết kế hệ thống chịu tải và sẵn sàng cao](../../high-availability/)
