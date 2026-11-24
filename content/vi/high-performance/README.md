---
title: "Hệ thống kiến thức High Performance: CDN, Cân bằng tải, Tối ưu Database, Cache và Message Queue"
description: "Lộ trình học tập và ôn thi phỏng vấn kiến trúc hệ thống hiệu năng cao (High Performance), bao gồm CDN, Cân bằng tải (Load Balancing), Tách Đọc-Ghi (Read/Write Splitting), Phân mảnh & Chia bảng (Sharding), tách dữ liệu nóng-lạnh, phân trang sâu (Deep Pagination), tối ưu SQL, Message Queue và các MQ phổ biến."
category: Hiệu năng cao (High Performance)
tag:
  - High Performance
  - Thiết kế hệ thống
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Hệ thống hiệu năng cao,Thiết kế hệ thống High Performance,Câu hỏi phỏng vấn High Performance,CDN,Cân bằng tải,Load Balancing,Tách Đọc-Ghi,Read/Write Splitting,Phân mảnh và chia bảng,Sharding,Tách dữ liệu nóng lạnh,Phân trang sâu,Tối ưu SQL,Message Queue,Kafka,RocketMQ,RabbitMQ,Disruptor,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/high-performance/README.md
---

Bộ **Hệ thống kiến thức High Performance** này hướng tới việc học tập Backend, thiết kế hệ thống và ôn tập phỏng vấn, tổng hợp các bài viết về hiệu năng cao của JavaGuide xoay quanh mục tiêu "giảm độ trễ, tăng thông lượng, cắt đỉnh bù đáy (peak shaving), giảm áp lực cho Database và tối ưu đường dẫn truy cập dữ liệu".

Nếu thời gian gấp, bạn nên đọc trước [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Performance](./high-performance-system-interview-questions.md) để nhanh chóng nắm được danh sách các câu hỏi tần suất cao; nếu muốn củng cố nền tảng một cách bài bản, bạn có thể đi theo thứ tự đọc bên dưới.

Khi học phần kiến thức này, không nên chỉ học vẹt tên các giải pháp như "thêm Cache, gắn MQ, Phân mảnh & Chia bảng (Sharding)". Tối ưu hiệu năng cao giống như một bài toán phân tích chuỗi xử lý (Call Chain): request đi từ phía người dùng vào, lần lượt đi qua CDN, Cân bằng tải (Load Balancing), Application Service, Cache, Database, Message Queue — mỗi mắt xích đều có thể trở thành điểm nghẽn (bottleneck). Chỉ khi nói rõ được điểm nghẽn nằm ở đâu, tại sao chọn phương án đó và phương án đó sẽ kéo theo vấn đề mới nào, bạn mới thực sự nắm vững kiến thức này.

## Đối tượng phù hợp

- Lập trình viên Backend đang học bài bản về thiết kế hệ thống hiệu năng cao (High Performance).
- Các bạn chuẩn bị phỏng vấn vị trí Fresher/Junior hoặc Senior Backend tại các công ty công nghệ vừa và lớn.
- Kỹ sư muốn củng cố năng lực triển khai thực tế về CDN, Cân bằng tải (Load Balancing), tối ưu Database và Message Queue.
- Độc giả đã gặp phải các vấn đề như slow SQL, phân trang sâu (deep pagination), hotspot traffic, tồn đọng message (message backlog) hoặc áp lực Database nhưng còn thiếu giải pháp có hệ thống.

## Trọng tâm học tập

- Hệ thống hiệu năng cao thực chất đang tối ưu độ trễ (latency), thông lượng (throughput), hiệu suất sử dụng tài nguyên, hay cảm nhận của người dùng?
- CDN, Cân bằng tải (Load Balancing), Cache, tối ưu Database và Message Queue lần lượt giải quyết những điểm nghẽn nào trên chuỗi xử lý?
- Tách Đọc-Ghi (Read/Write Splitting), Phân mảnh & Chia bảng (Sharding), tách dữ liệu nóng-lạnh và tối ưu phân trang sâu phù hợp với những kịch bản nào?
- Sự khác biệt về định vị và tiêu chí lựa chọn công nghệ giữa Kafka, RocketMQ, RabbitMQ và Disruptor là gì?
- Trong phỏng vấn, làm thế nào để trả lời câu hỏi về hiệu năng cao theo mạch "xác định điểm nghẽn -> chọn giải pháp -> phân tích đánh đổi -> rủi ro khi vận hành"?

## Mạch trả lời phỏng vấn

Khi trả lời các bài toán thiết kế hệ thống hiệu năng cao, bạn có thể triển khai theo trình tự sau:

1. **Xác nhận mục tiêu trước**: QPS, RT, P99, quy mô dữ liệu, tỷ lệ đọc/ghi, yêu cầu về tính nhất quán (Consistency) và ràng buộc chi phí.
2. **Xác định điểm nghẽn tiếp theo**: băng thông đầu vào, Thread Pool của ứng dụng, slow SQL, tranh chấp khóa (lock contention), tỷ lệ cache hit, tồn đọng MQ (MQ backlog) và các service hạ nguồn phụ thuộc.
3. **Sau đó chọn giải pháp**: tầng đầu vào dùng CDN / Cân bằng tải (Load Balancing); tầng ứng dụng dùng Cache / Rate Limiting / bất đồng bộ hóa; tầng dữ liệu dùng Index / Tách Đọc-Ghi (Read/Write Splitting) / Phân mảnh & Chia bảng (Sharding) / tách dữ liệu nóng-lạnh; tầng cắt đỉnh dùng MQ.
4. **Cuối cùng phân tích đánh đổi**: độ phức tạp phát sinh, rủi ro về tính nhất quán, chi phí vận hành, phương án rollback và các chỉ số giám sát (monitoring metrics).

Điều tối kỵ nhất khi phỏng vấn là vừa mở miệng đã ném ra hàng loạt thuật ngữ. Ví dụ "truy vấn đơn hàng bị chậm" không nhất thiết phải Phân mảnh & Chia bảng (Sharding), đôi khi chỉ vì thiếu Index, phân trang sâu, dữ liệu lịch sử quá nhiều hoặc truy vấn tập trung vào một số shop lớn (hotspot). Hãy hỏi rõ kịch bản trước rồi mới đưa ra giải pháp, câu trả lời sẽ chắc chắn hơn rất nhiều.

## Thứ tự đọc đề xuất

1. [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Performance](./high-performance-system-interview-questions.md): Tạo trước danh sách các câu hỏi tần suất cao về Cache, Database, Message Queue, Cân bằng tải (Load Balancing)...
2. [Giải thích chi tiết nguyên lý hoạt động của CDN](./cdn.md) và [Giải thích chi tiết nguyên lý và thuật toán Cân bằng tải](./load-balancing.md): Hiểu rõ cổng tiếp nhận lưu lượng và cơ chế điều phối request.
3. [Giải thích chi tiết Tách Đọc-Ghi và Phân mảnh & Chia bảng](./read-and-write-separation-and-library-subtable.md), [Tổng hợp các kỹ thuật tối ưu SQL thường gặp](./sql-optimization.md), [Giới thiệu phân trang sâu và đề xuất tối ưu](./deep-pagination-optimization.md): Hoàn thiện mạch kiến thức chính về tối ưu hiệu năng Database.
4. [Tổng hợp câu hỏi phỏng vấn Message Queue](./message-queue/message-queue-interview-questions.md): Nắm danh sách vấn đề về độ tin cậy, tính lũy đẳng (idempotency), thứ tự, xử lý tồn đọng và lựa chọn công nghệ.
5. [Tổng hợp kiến thức nền tảng Message Queue](./message-queue/message-queue.md): Hiểu về xử lý bất đồng bộ, tách rời kết nối (decoupling), cắt đỉnh (peak shaving), độ tin cậy của message, thứ tự và tính lũy đẳng.
6. Sau đó tùy theo tech stack mà đi sâu vào [Tổng hợp câu hỏi thường gặp Kafka](./message-queue/kafka-questions-01.md), [Tổng hợp câu hỏi thường gặp RocketMQ](./message-queue/rocketmq-questions.md), [Tổng hợp câu hỏi thường gặp RabbitMQ](./message-queue/rabbitmq-questions.md).

## Các bài viết cốt lõi

### Cổng lưu lượng & Điều phối Request

- [Giải thích chi tiết nguyên lý hoạt động của CDN](./cdn.md): Hiểu về điều phối GSLB, chiến lược Cache, làm nóng (prefetch) và làm mới (refresh), tối ưu tỷ lệ hit và chống đánh cắp băng thông (hotlink protection).
- [Giải thích chi tiết nguyên lý và thuật toán Cân bằng tải](./load-balancing.md): Hiểu về Cân bằng tải (Load Balancing) Layer 4 / Layer 7, Load Balancing phía Server / phía Client và các thuật toán điều phối phổ biến.

### Tối ưu Database & Truy cập dữ liệu

- [Giải thích chi tiết Tách Đọc-Ghi và Phân mảnh & Chia bảng](./read-and-write-separation-and-library-subtable.md): Hiểu về sao chép Master-Replica, Tách Đọc-Ghi (Read/Write Splitting), chia dọc, chia ngang và các vấn đề phát sinh sau khi Phân mảnh & Chia bảng (Sharding).
- [Giải thích chi tiết tách dữ liệu nóng-lạnh](./data-cold-hot-separation.md): Hiểu về tiêu chí phân loại dữ liệu nóng-lạnh, lưu trữ phân tầng, tính nhất quán khi di chuyển dữ liệu và tối ưu truy vấn dữ liệu lạnh.
- [Tổng hợp các kỹ thuật tối ưu SQL thường gặp](./sql-optimization.md): Hệ thống hóa các phương pháp thực chiến như xác định slow SQL, tối ưu Index, viết lại câu truy vấn và tối ưu phân trang.
- [Giới thiệu phân trang sâu và đề xuất tối ưu](./deep-pagination-optimization.md): Hiểu vấn đề hiệu năng của phân trang sâu cùng các phương án truy vấn theo khoảng (range query), tối ưu subquery, deferred join và covering index.

### Message Queue & Cắt đỉnh bất đồng bộ

- [Chuyên đề Message Queue](./message-queue/): Đi từ nền tảng Message Queue đến giới hạn sử dụng của Kafka, RocketMQ, RabbitMQ và Disruptor.
- [Tổng hợp câu hỏi phỏng vấn Message Queue](./message-queue/message-queue-interview-questions.md): Ôn tập độ tin cậy, ngữ nghĩa tiêu thụ (consumption semantics), các sản phẩm phổ biến và câu hỏi xoáy vào dự án theo vòng đời của message.
- [Tổng hợp kiến thức nền tảng Message Queue](./message-queue/message-queue.md): Hiểu các kịch bản ứng dụng, mô hình message, độ tin cậy, tính thứ tự, tính lũy đẳng và xử lý tồn đọng message.
- [Tổng hợp câu hỏi thường gặp Kafka](./message-queue/kafka-questions-01.md): Nắm vững kiến trúc Kafka, nguyên lý hiệu năng cao, độ tin cậy, tính thứ tự và Rebalance.
- [Tổng hợp câu hỏi thường gặp RocketMQ](./message-queue/rocketmq-questions.md): Hiểu kiến trúc RocketMQ, các loại message, cơ chế lưu trữ, độ tin cậy và tính năng mới của phiên bản 5.x.
- [Tổng hợp câu hỏi thường gặp RabbitMQ](./message-queue/rabbitmq-questions.md): Hiểu về AMQP, các loại Exchange, cơ chế xác nhận (ACK), Dead-Letter Queue, Delayed Queue, Quorum Queue và Streams.
- [Tổng hợp câu hỏi thường gặp Disruptor](./message-queue/disruptor-questions.md): Hiểu về RingBuffer, Sequencer, WaitStrategy, thiết kế không khóa (lock-free) và cache line padding.

## Các câu hỏi thường gặp

- Khi tối ưu hệ thống hiệu năng cao, nên kiểm tra những chỉ số nào trước tiên?
- CDN và Cân bằng tải (Load Balancing) lần lượt giải quyết vấn đề gì?
- Cân bằng tải Layer 4 và Cân bằng tải Layer 7 khác nhau ở điểm nào?
- Tách Đọc-Ghi (Read/Write Splitting) gây ra những vấn đề nhất quán dữ liệu nào? Xử lý độ trễ sao chép (replication lag) ra sao?
- Sau khi Phân mảnh & Chia bảng (Sharding), làm thế nào xử lý Distributed ID, JOIN liên database và Distributed Transaction?
- Tại sao phân trang sâu (Deep Pagination) lại chậm? Có những phương án tối ưu nào?
- Message Queue làm sao đảm bảo không mất message, không xử lý trùng lặp và không bị loạn thứ tự?
- Nên lựa chọn giữa Kafka, RocketMQ và RabbitMQ như thế nào?
- Khi message bị tồn đọng (backlog), cần định vị nguyên nhân và xử lý ra sao?

## Các chuyên đề liên quan

- [Hệ thống kiến thức High Availability](../high-availability/)
- [Hệ thống kiến thức Distributed System](../distributed-system/)
- [Database](../database/)
- [System Design](../system-design/)
