---
title: "Chuyên đề Mạng máy tính: Mô hình phân tầng, HTTP, HTTPS, DNS, TCP, UDP, ARP và NAT"
description: "Lộ trình học tập và phỏng vấn mạng máy tính, bao gồm mô hình phân tầng OSI/TCP-IP, HTTP, HTTPS, DNS, TCP, UDP, ARP, NAT, an toàn mạng và các câu hỏi phỏng vấn thường gặp."
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
  - TCP/IP
  - HTTP
sidebar: false
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Mạng máy tính,Câu hỏi phỏng vấn mạng máy tính,Mô hình 7 tầng OSI,TCP/IP,HTTP,HTTPS,DNS,TCP,UDP,ARP,NAT,Phỏng vấn backend
lang: vi
sourceRef: zh-ref/cs-basics/network/README.md
---

**Chuyên đề Mạng máy tính** này hướng tới việc học tập backend và ôn luyện phỏng vấn, sắp xếp các bài viết liên quan đến mạng trên website theo thứ tự "Mô hình phân tầng -> Tầng ứng dụng -> Tầng truyền vận -> Tầng mạng -> An toàn bảo mật".

## Dành cho ai

- Các lập trình viên backend đang học mạng máy tính một cách có hệ thống.
- Các bạn đang chuẩn bị cho các đợt tuyển dụng sinh viên mới tốt nghiệp, tuyển dụng nhân sự có kinh nghiệm hoặc phỏng vấn tại các công ty công nghệ vừa và lớn.
- Những độc giả chỉ ghi nhớ rời rạc các kiến thức như HTTP, HTTPS, TCP, DNS, Socket.
- Các kỹ sư muốn kết nối kiến thức mạng với RPC, API gateway, cân bằng tải (load balancing) và thiết kế hệ thống (system design).

## Trọng tâm học tập

- Giá trị cốt lõi của việc phân tầng mạng là chia nhỏ các vấn đề giao tiếp phức tạp, mỗi tầng chỉ chịu trách nhiệm về nhiệm vụ riêng của mình.
- HTTP, HTTPS, DNS là những kiến thức tầng ứng dụng được sử dụng thường xuyên nhất trong phát triển backend.
- Các chủ đề hay hỏi trong phỏng vấn về TCP tập trung vào quản lý kết nối, truyền tải tin cậy, điều khiển tắc nghẽn (congestion control), TIME_WAIT và Keepalive.
- Kiến thức tầng mạng như ARP, NAT giúp hiểu rõ giao tiếp trong mạng cục bộ (LAN), truy cập mạng nội bộ/mạng ngoài và xử lý sự cố (troubleshooting).
- Trong phỏng vấn, bạn cần có khả năng kết nối toàn bộ quy trình: giao thức, kết nối, mã hóa, phân giải tên miền và truyền tải dữ liệu xuyên suốt một request hoàn chỉnh.

## Thứ tự đọc khuyến nghị

1. [Tổng hợp câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 1)](./other-network-questions.md) và [Tổng hợp câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 2)](./other-network-questions2.md): Thiết lập danh sách các câu hỏi tần suất cao trước.
2. [Chi tiết về Mô hình 7 tầng OSI và Mô hình 4 tầng TCP/IP](./osi-and-tcp-ip-model.md): Hiểu rõ về phân tầng mạng và nhiệm vụ của từng tầng.
3. [Chuyện gì thực sự xảy ra từ lúc nhập URL đến khi trang web hiển thị?](./the-whole-process-of-accessing-web-pages.md): Kết nối DNS, TCP, HTTP và xử lý của trình duyệt qua một chuỗi xử lý hoàn chỉnh.
4. [HTTP vs HTTPS](./http-vs-https.md), [RSA và ECDHE trong quá trình bắt tay HTTPS](./https-rsa-vs-ecdhe.md), [Tổng hợp các HTTP Status Code thường gặp](./http-status-codes.md): Hoàn thiện các câu hỏi tần suất cao ở tầng ứng dụng.
5. [Bắt tay 3 bước và Bắt tay 4 bước kết thúc của TCP (Three-Way Handshake & Four-Way Wave)](./tcp-connection-and-disconnection.md), [Đảm bảo độ tin cậy trong truyền tải của TCP](./tcp-reliability-guarantee.md), [Chi tiết về TCP TIME_WAIT](./tcp-time-wait.md): Tập trung chinh phục TCP.

## Các bài viết cốt lõi

### Tổng quan và Kiến thức cơ bản

- [Tổng hợp câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 1)](./other-network-questions.md): Bao quát các câu hỏi cơ bản về mô hình mạng, HTTP, HTTPS, DNS, v.v.
- [Tổng hợp câu hỏi phỏng vấn mạng máy tính thường gặp (Phần 2)](./other-network-questions2.md): Tiếp tục tổng hợp các câu hỏi tần suất cao về TCP, UDP, Socket, an toàn bảo mật mạng, v.v.
- [Chi tiết về Mô hình 7 tầng OSI và Mô hình 4 tầng TCP/IP](./osi-and-tcp-ip-model.md): Hiểu về mô hình mạng, phân tầng giao thức và quá trình đóng gói dữ liệu (data encapsulation).
- [Chuyện gì thực sự xảy ra từ lúc nhập URL đến khi trang web hiển thị?](./the-whole-process-of-accessing-web-pages.md): Kết nối các kiến thức mạng phổ biến thông qua một request hoàn chỉnh.

### Tầng ứng dụng

- [Tổng hợp các giao thức tầng ứng dụng phổ biến](./application-layer-protocol.md): Hệ thống hóa các giao thức như HTTP, WebSocket, SMTP, FTP, SSH, DNS, v.v.
- [HTTP vs HTTPS](./http-vs-https.md): Hiểu về mã hóa HTTPS, chứng chỉ số, xác thực danh tính và bảo vệ tính toàn vẹn dữ liệu.
- [RSA và ECDHE trong quá trình bắt tay HTTPS](./https-rsa-vs-ecdhe.md): Phân biệt các phương thức trao đổi khóa khác nhau và tính bảo mật chuyển tiếp (Forward Secrecy).
- [HTTP 1.0 vs HTTP 1.1](./http1.0-vs-http1.1.md): Hiểu các điểm khác biệt như kết nối duy trì (persistent connection), bộ nhớ đệm (cache), header Host, v.v.
- [Tổng hợp các HTTP Status Code thường gặp](./http-status-codes.md): Nắm vững ngữ nghĩa và ngữ cảnh sử dụng của các mã trạng thái từ 1xx đến 5xx.
- [Chi tiết về Hệ thống phân giải tên miền DNS](./dns.md): Hiểu về phân giải tên miền, truy vấn đệ quy (recursive query), truy vấn lặp (iterative query) và bộ nhớ đệm (cache).
- [Đã có HTTP, tại sao vẫn cần RPC?](./http-vs-rpc.md): Làm rõ mối quan hệ phân tầng giữa HTTP và RPC.

### Tầng truyền vận, Tầng mạng và An toàn bảo mật

- [Bắt tay 3 bước và Bắt tay 4 bước kết thúc của TCP](./tcp-connection-and-disconnection.md): Nắm vững quá trình thiết lập, ngắt kết nối và các trạng thái then chốt.
- [Đảm bảo độ tin cậy trong truyền tải của TCP](./tcp-reliability-guarantee.md): Hiểu về số thứ tự (Sequence Number), xác nhận (ACK), truyền lại (retransmission), điều khiển luồng (flow control) và điều khiển tắc nghẽn (congestion control).
- [Chi tiết về TCP TIME_WAIT](./tcp-time-wait.md): Hiểu vai trò, tác động và ranh giới tối ưu hóa của TIME_WAIT.
- [Sự khác biệt giữa TCP Keepalive và HTTP Keep-Alive là gì?](./tcp-keepalive-vs-http-keepalive.md): Phân biệt giữa cơ chế giữ kết nối tầng truyền vận và kết nối dài tầng ứng dụng.
- [Tại sao TCP hướng luồng byte (Byte Stream), còn UDP hướng gói tin (Datagram)?](./tcp-byte-stream-udp-datagram.md): Hiểu sự khác biệt về ranh giới dữ liệu giữa TCP và UDP.
- [Chi tiết về giao thức ARP](./arp.md), [Chi tiết về giao thức NAT](./nat.md), [Tổng hợp các phương thức tấn công mạng phổ biến](./network-attack-means.md): Bổ sung kiến thức cơ bản về tầng mạng và bảo mật.

## Các câu hỏi tần suất cao

- Mô hình 7 tầng OSI và mô hình 4 tầng TCP/IP khác nhau như thế nào?
- Từ lúc nhập URL đến khi trang web hiển thị, phần mạng đã diễn ra những gì?
- HTTP và HTTPS khác nhau như thế nào? Quá trình bắt tay HTTPS diễn ra như thế nào?
- Sự khác biệt cốt lõi giữa HTTP 1.0, 1.1 và 2.0 là gì?
- Các HTTP status code phổ biến biểu thị điều gì?
- Tại sao bắt tay 3 bước và bắt tay 4 bước của TCP không thể lược bớt bước nào?
- TCP đảm bảo truyền tải tin cậy bằng cách nào? Điều khiển tắc nghẽn (congestion control) và điều khiển luồng (flow control) khác nhau ra sao?
- Tại sao TIME_WAIT lại tồn tại? Làm thế nào để điều tra và xử lý khi có số lượng lớn TIME_WAIT?
- TCP Keepalive và HTTP Keep-Alive khác nhau như thế nào?
- DNS, ARP, NAT giải quyết những vấn đề gì?

## Các chuyên đề liên quan

- [Hệ thống kiến thức máy tính cơ bản](../)
- [Chuyên đề Hệ điều hành](../operating-system/)
- [Hệ thống kiến thức hệ thống phân tán](../../distributed-system/)
- [Chuyên đề RPC](../../distributed-system/rpc/)
- [Hệ thống kiến thức hệ thống hiệu năng cao](../../high-performance/)
