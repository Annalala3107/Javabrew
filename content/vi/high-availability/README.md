---
title: "Hệ thống kiến thức High Availability: SLA, Rate Limiting, Circuit Breaker, Fallback, Retry, Idempotency, Dự phòng và Load Testing"
description: "Lộ trình học tập và phỏng vấn kiến trúc hệ thống sẵn sàng cao (High Availability), bao gồm Thỏa thuận mức dịch vụ (SLA), chỉ số tính sẵn sàng, điểm lỗi đơn (SPOF), dự phòng và khắc phục thảm họa, giới hạn tốc độ (Rate Limiting), giáng cấp và dự phòng giáng cấp (Fallback), ngắt mạch (Circuit Breaker), timeout và retry, tính lũy đẳng (Idempotency), kiểm thử hiệu năng và diễn tập sự cố."
category: Độ sẵn sàng cao (High Availability)
tag:
  - High Availability
  - Thiết kế hệ thống
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Hệ thống sẵn sàng cao,Thiết kế hệ thống High Availability,Phỏng vấn High Availability,Thỏa thuận mức dịch vụ SLA,Chỉ số sẵn sàng,Rate Limiting,Ngắt mạch Circuit Breaker,Dự phòng giáng cấp Fallback,Timeout và Retry,Tính lũy đẳng Idempotency,Thiết kế dự phòng,Khắc phục thảm họa,Kiểm thử hiệu năng,Diễn tập sự cố,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/high-availability/README.md
---

Tài liệu **Hệ thống kiến thức High Availability (Độ sẵn sàng cao)** này hướng tới việc học Backend, thiết kế hệ thống (System Design) và ôn tập phỏng vấn, tổng hợp các bài viết liên quan trên trang xoay quanh bốn mục tiêu: "giảm thiểu sự cố, cô lập sự cố, phục hồi nhanh chóng, giảm tác động từ các request trùng lặp và lưu lượng bất thường".

Nếu bạn không có nhiều thời gian, nên xem trước [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Availability](./high-availability-system-interview-questions.md) để nhanh chóng xây dựng danh sách các vấn đề tần suất cao; nếu muốn củng cố nền tảng một cách bài bản, bạn có thể đọc theo thứ tự dưới đây.

## Phù hợp với ai

- Lập trình viên Backend đang học thiết kế hệ thống có độ sẵn sàng cao (High Availability) một cách bài bản.
- Các bạn chuẩn bị phỏng vấn Backend cho vị trí thực tập/mới tốt nghiệp, đã có kinh nghiệm hoặc tại các công ty công nghệ vừa và lớn.
- Kỹ sư muốn hoàn thiện năng lực về giới hạn tốc độ (Rate Limiting), giáng cấp/dự phòng giáng cấp (Fallback), ngắt mạch (Circuit Breaker), cơ chế thử lại (Retry), tính lũy đẳng (Idempotency), khắc phục thảm họa (Disaster Recovery) và kiểm thử chịu tải (Load Testing).
- Độc giả đã từng gặp các vấn đề như API timeout, request trùng lặp, lỗi dịch vụ hạ nguồn (downstream), lưu lượng tăng đột biến hay sập dây chuyền toàn hệ thống (Avalanche) nhưng chưa có giải pháp hệ thống.

## Trọng tâm học tập

- High Availability không phải là "không bao giờ xảy ra sự cố", mà là khi sự cố xảy ra thì hệ thống vẫn kiểm soát được, cô lập được và phục hồi được.
- Thỏa thuận mức dịch vụ (SLA), chỉ số tính sẵn sàng, RTO và RPO là ngôn ngữ quan trọng để đo lường thiết kế High Availability.
- Rate Limiting (giới hạn lưu lượng), giáng cấp dịch vụ / Dự phòng giáng cấp (Fallback), Ngắt mạch (Circuit Breaker) và Timeout/Retry giải quyết các vấn đề ổn định ở những tầng khác nhau.
- Thiết kế Tính lũy đẳng (Idempotency) là năng lực nền tảng để ứng phó với request trùng lặp, tự động retry, tiêu thụ message lặp lại và webhook/callback thanh toán.
- Dự phòng và khắc phục thảm họa (Redundancy & Disaster Recovery), kiểm thử tải hiệu năng (Performance/Load Testing), diễn tập sự cố (Failure Drills) và phát hành từng phần (Canary Release) quyết định hệ thống có chịu được rủi ro thực tế trên production hay không.

## Thứ tự đọc đề xuất

1. [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Availability](./high-availability-system-interview-questions.md): Trước tiên xây dựng danh sách câu hỏi tần suất cao về SLA, Rate Limiting, Ngắt mạch (Circuit Breaker), Retry, Tính lũy đẳng (Idempotency), khắc phục thảm họa và kiểm thử tải.
2. [Giải thích chi tiết thiết kế hệ thống High Availability](./high-availability-system-design.md): Hiểu một cách hệ thống phương pháp thiết kế tổng thể cho kiến trúc High Availability.
3. [Giải thích chi tiết Rate Limiting dịch vụ](./limit-request.md), [Giải thích chi tiết giáng cấp dịch vụ và Ngắt mạch (Circuit Breaker)](./fallback-and-circuit-breaker.md), [Giải thích chi tiết cơ chế Timeout và Retry](./timeout-and-retry.md): Nắm vững bộ ba quản trị tính ổn định cốt lõi.
4. [Giải thích chi tiết thiết kế Tính lũy đẳng (Idempotency) của API](./idempotency.md): Hiểu các kịch bản request trùng lặp, tính lũy đẳng nghiệp vụ và callback thanh toán.
5. [Giải thích chi tiết thiết kế dự phòng (Redundancy)](./redundancy.md) và [Nhập môn kiểm thử hiệu năng](./performance-test.md): Bổ sung kiến thức về khắc phục thảm họa, kiểm thử chịu tải, đánh giá năng lực (Capacity Planning) và xác minh sự cố.

## Các bài viết cốt lõi

### Tổng quan & Lộ trình phỏng vấn

- [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Availability](./high-availability-system-interview-questions.md): Xâu chuỗi SLA, điểm lỗi đơn (SPOF), Rate Limiting, giáng cấp và Ngắt mạch (Circuit Breaker), Timeout/Retry, Tính lũy đẳng (Idempotency), dự phòng khắc phục thảm họa và kiểm thử hiệu năng.
- [Giải thích chi tiết thiết kế hệ thống High Availability](./high-availability-system-design.md): Giải thích Thỏa thuận mức dịch vụ (SLA), các mức "bao nhiêu số 9", xử lý điểm lỗi đơn, High Availability cho Cache, cắt đỉnh lưu lượng bất đồng bộ, Canary Release và phục hồi sự cố.

### Quản trị tính ổn định (Stability Governance)

- [Giải thích chi tiết Rate Limiting dịch vụ](./limit-request.md): Hiểu thuật toán Fixed Window, Sliding Window, Token Bucket, Leaky Bucket, Sentinel, Redis Lua và Redisson Rate Limiting.
- [Giải thích chi tiết giáng cấp dịch vụ và Ngắt mạch (Circuit Breaker)](./fallback-and-circuit-breaker.md): Hiểu Dự phòng giáng cấp (Fallback), công tắc giáng cấp, máy trạng thái của Circuit Breaker, hiệu ứng sập dây chuyền (Avalanche), chiến lược cô lập (Isolation) và lựa chọn framework.
- [Giải thích chi tiết cơ chế Timeout và Retry](./timeout-and-retry.md): Hiểu Connect Timeout, Read Timeout, Exponential Backoff, Random Jitter, bão Retry (Retry Storm) và Tính lũy đẳng (Idempotency).

### Tính lũy đẳng, Khắc phục thảm họa & Xác minh

- [Giải thích chi tiết thiết kế Tính lũy đẳng (Idempotency) của API](./idempotency.md): Trình bày về Idempotency Key, Token, Unique Index, bảng chống trùng (Deduplication Table), khóa lạc quan (`Optimistic Lock`), khóa bi quan (`Pessimistic Lock`), khóa phân tán (Distributed Lock) và callback thanh toán.
- [Giải thích chi tiết thiết kế dự phòng (Redundancy)](./redundancy.md): Trình bày về dự phòng phần cứng, dự phòng dịch vụ, dự phòng dữ liệu, dự phòng vùng địa lý, khắc phục thảm họa nội thành, khắc phục thảm họa đa vùng và kiến trúc Multi-Active.
- [Nhập môn kiểm thử hiệu năng](./performance-test.md): Hiểu QPS, TPS, RT, P90/P99/P999, đánh giá dung lượng, Stress Testing, Stability Testing và các công cụ kiểm thử tải.

## Câu hỏi tần suất cao

- Hệ thống High Availability định nghĩa tính sẵn sàng như thế nào? Các mức "bao nhiêu số 9" mang ý nghĩa gì?
- RTO và RPO khác nhau ở điểm nào?
- Rate Limiting, giáng cấp dịch vụ / Dự phòng giáng cấp (Fallback) và Ngắt mạch (Circuit Breaker) lần lượt giải quyết vấn đề gì?
- Token Bucket và Leaky Bucket khác nhau ra sao? Rate Limiting phân tán được triển khai như thế nào?
- Vì sao Timeout và Retry có thể dẫn tới sập dây chuyền (Avalanche)?
- API có những giải pháp nào để đảm bảo Tính lũy đẳng (Idempotency)? Callback thanh toán đảm bảo tính lũy đẳng ra sao?
- Dự phòng, khắc phục thảm họa, Multi-Active nội thành và Multi-Active khác vùng địa lý phù hợp với những kịch bản nào?
- Performance Testing, Stress Testing và Stability Testing khác nhau như thế nào?
- Làm sao để xác minh thiết kế High Availability có hiệu quả thông qua diễn tập sự cố (Failure Drills)?

## Chuyên đề liên quan

- [Hệ thống kiến thức High Performance](../high-performance/)
- [Hệ thống kiến thức Distributed System](../distributed-system/)
- [Thiết kế hệ thống (System Design)](../system-design/)
- [Chuyên đề Message Queue](../high-performance/message-queue/)
