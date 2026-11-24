---
title: "Chuyên đề Message Queue: Xử lý bất đồng bộ, cắt đỉnh giảm tải, độ tin cậy, tính tuần tự, Kafka, RocketMQ và RabbitMQ"
description: "Lộ trình ôn tập phỏng vấn và học tập Message Queue (MQ), bao gồm xử lý bất đồng bộ, tách rời ứng dụng, cắt đỉnh san tải, độ tin cậy của message, tính lũy đẳng (Idempotency), tính tuần tự, tồn đọng message, Kafka, RocketMQ và RabbitMQ."
category: Hiệu năng cao
tag:
  - Message Queue
  - Kafka
  - RocketMQ
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Message Queue,Câu hỏi phỏng vấn Message Queue,Kafka,RocketMQ,RabbitMQ,Disruptor,Độ tin cậy message,Idempotency message,Tính tuần tự message,Tồn đọng message,Xử lý bất đồng bộ,Cắt đỉnh san tải,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/high-performance/message-queue/README.md
---

Message Queue (hàng đợi tin nhắn) là middleware cực kỳ phổ biến trong các hệ thống hiệu năng cao và sẵn sàng cao, chủ yếu dùng cho xử lý bất đồng bộ, tách rời ứng dụng (Application Decoupling), cắt đỉnh san tải (Peak Shaving) và đệm lưu lượng. Khi học Message Queue, không thể chỉ học thuộc lòng tính năng của Kafka, RocketMQ, RabbitMQ mà cần hiểu sâu độ tin cậy của message, tính tuần tự (Ordering), tính lũy đẳng (Idempotency), xử lý tồn đọng message (Message Backlog) và lựa chọn công nghệ.

Nếu bạn đang chuẩn bị phỏng vấn, khuyến nghị xem trước [Tổng hợp câu hỏi phỏng vấn Message Queue](./message-queue-interview-questions.md) để đặt các bài toán MQ vào chuỗi sản xuất, lưu trữ, tiêu thụ, xác nhận (ACK) và bù trừ (Compensation) mà ôn tập, sau đó đi sâu vào bài chuyên đề của từng middleware mà dự án đang sử dụng.

## Phù hợp với ai

- Lập trình viên Backend muốn học Message Queue một cách hệ thống.
- Ứng viên đang chuẩn bị câu hỏi phỏng vấn về Kafka, RocketMQ, RabbitMQ và độ tin cậy của message.
- Bạn đọc đã dùng MQ trong dự án nhưng chưa thật sự vững về mất message, tiêu thụ trùng lặp, tiêu thụ tuần tự và xử lý tồn đọng message.
- Kỹ sư cần lựa chọn công nghệ giữa Kafka, RocketMQ, RabbitMQ và Disruptor.

## Trọng tâm học tập

- Message Queue giải quyết bài toán bất đồng bộ, tách rời, cắt đỉnh và làm bộ đệm — không phải luồng xử lý nào cũng nên đưa MQ vào.
- Độ tin cậy của message phải xét riêng từng khâu: Producer, Broker, Consumer và Idempotency phía nghiệp vụ.
- Tính tuần tự của message thường phải thiết kế đồng bộ từ Topic, Queue, Partition, Consumer Thread và Business Key.
- Tồn đọng message không phải lỗi đơn điểm, mà có thể đến từ năng lực tiêu thụ, dịch vụ hạ nguồn (downstream), chiến lược Rate Limiting hoặc lệch dữ liệu (Data Skew).
- Kafka, RocketMQ, RabbitMQ và Disruptor có định vị khác nhau; khi lựa chọn công nghệ cần cân nhắc throughput, độ trễ, ngữ nghĩa message, hệ sinh thái và chi phí vận hành.

## Thứ tự đọc khuyến nghị

1. [Tổng hợp câu hỏi phỏng vấn Message Queue](./message-queue-interview-questions.md): Lập danh sách vấn đề về độ tin cậy, Idempotency, tính tuần tự, tồn đọng và lựa chọn công nghệ trước.
2. [Tổng hợp kiến thức cơ bản về Message Queue](./message-queue.md): Hiểu mô hình chung, kịch bản ứng dụng và các vấn đề thường gặp của MQ.
3. [Tổng hợp câu hỏi thường gặp về Kafka](./kafka-questions-01.md): Hiểu log stream thông lượng cao, Partition, Replica, Consumer Group và Rebalance.
4. [Tổng hợp câu hỏi thường gặp về RocketMQ](./rocketmq-questions.md): Hiểu các kịch bản message nghiệp vụ, Transactional Message, Scheduled Message, Ordered Message và cơ chế lưu trữ message.
5. [Tổng hợp câu hỏi thường gặp về RabbitMQ](./rabbitmq-questions.md): Hiểu AMQP, Exchange, cơ chế xác nhận, Dead Letter Queue (DLQ) và Delay Queue.
6. [Tổng hợp câu hỏi thường gặp về Disruptor](./disruptor-questions.md): Hiểu hàng đợi trên bộ nhớ hiệu năng cao, thiết kế không khóa (Lock-free) và kịch bản độ trễ thấp.

## Các bài viết cốt lõi

- [Tổng hợp câu hỏi phỏng vấn Message Queue](./message-queue-interview-questions.md): Xâu chuỗi theo vòng đời message các câu hỏi tần suất cao dùng chung, nguyên lý middleware phổ biến, lựa chọn công nghệ và câu hỏi xoáy về dự án.
- [Tổng hợp kiến thức cơ bản về Message Queue](./message-queue.md): Trình bày hệ thống về kịch bản ứng dụng, mô hình message, độ tin cậy, Idempotency, tính tuần tự, xử lý tồn đọng và lựa chọn công nghệ.
- [Tổng hợp câu hỏi thường gặp về Kafka](./kafka-questions-01.md): Bao phủ Broker, Topic, Partition, Consumer Group, Zero-Copy, ghi tuần tự (Sequential Write), ACK, ISR và Rebalance.
- [Tổng hợp câu hỏi thường gặp về RocketMQ](./rocketmq-questions.md): Bao phủ NameServer, Broker, Proxy, message thông thường, Ordered Message, Transactional Message, Scheduled Message và cơ chế lưu trữ.
- [Tổng hợp câu hỏi thường gặp về RabbitMQ](./rabbitmq-questions.md): Bao phủ AMQP, các loại Exchange, cơ chế xác nhận, Dead Letter Queue, Delay Queue, Priority Queue và cụm High Availability.
- [Tổng hợp câu hỏi thường gặp về Disruptor](./disruptor-questions.md): Bao phủ RingBuffer, Sequencer, WaitStrategy, thiết kế Lock-free, Cache-line Padding và cấp phát trước bộ nhớ.

## Các câu hỏi tần suất cao

- Tại sao nên dùng Message Queue? Những kịch bản nào không phù hợp đưa MQ vào?
- Làm sao đảm bảo message không bị mất?
- Xử lý tiêu thụ trùng lặp và Idempotency nghiệp vụ như thế nào?
- Làm sao đảm bảo tính tuần tự của message?
- Điều tra và xử lý tồn đọng message (Message Backlog) như thế nào?
- Vì sao Kafka có throughput cao? Zero-Copy và ghi tuần tự đóng vai trò gì?
- Transactional Message của RocketMQ hoạt động ra sao?
- RabbitMQ có những loại Exchange nào? Mỗi loại phù hợp với kịch bản nào?
- Nên lựa chọn giữa Kafka, RocketMQ và RabbitMQ như thế nào?

## Tra cứu nhanh lựa chọn công nghệ

| Kịch bản | Lựa chọn phổ biến | Điểm cần chú trọng |
| -------------------- | ------------- | ---------------------------------- |
| Log, tracking sự kiện, xử lý luồng (Stream Processing) | Kafka, Pulsar | Throughput, mở rộng Partition, hệ sinh thái |
| Đơn hàng, giao dịch, sự kiện nghiệp vụ | RocketMQ | Transactional Message, Delayed Message, Ordered Message |
| Định tuyến linh hoạt, tích hợp gọn nhẹ | RabbitMQ | Exchange, cơ chế xác nhận, các loại Queue |
| Xử lý sự kiện độ trễ thấp trong cùng tiến trình | Disruptor | RingBuffer, WaitStrategy, thiết kế Lock-free |

Khi lựa chọn công nghệ đừng chỉ so sánh throughput. Kinh nghiệm vận hành của đội ngũ, tech stack sẵn có, ngữ nghĩa message, yêu cầu độ trễ, thời gian lưu giữ message và nhu cầu phát lại (Replay) đều ảnh hưởng tới quyết định cuối cùng.

## Chuyên đề liên quan

- [Hệ thống kiến thức High Performance](../)
- [Hệ thống kiến thức High Availability](../../high-availability/)
- [Hệ thống kiến thức Distributed System](../../distributed-system/)
- [Thiết kế hệ thống (System Design)](../../system-design/)
