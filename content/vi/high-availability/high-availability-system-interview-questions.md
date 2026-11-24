---
title: "Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Availability mới nhất 2026: SLA, Rate Limiting, Circuit Breaker, Retry, Idempotency và Khắc phục thảm họa"
category: Độ sẵn sàng cao (High Availability)
redirectFrom:
  - /high-availability/high-availability-interview-questions.html
description: "Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống High Availability mới nhất 2026, bao gồm Thỏa thuận mức dịch vụ (SLA), chỉ số tính sẵn sàng, điểm lỗi đơn (SPOF), RTO/RPO, Rate Limiting, giáng cấp / Dự phòng giáng cấp (Fallback), Ngắt mạch (Circuit Breaker), Timeout và Retry, Tính lũy đẳng (Idempotency), kiểm thử tải hiệu năng, diễn tập sự cố và kiến trúc khắc phục thảm họa."
tag:
  - High Availability
  - Câu hỏi phỏng vấn
  - Thiết kế hệ thống
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn High Availability,Phỏng vấn thiết kế hệ thống sẵn sàng cao,Câu hỏi phỏng vấn High Availability 2026,Câu hỏi phỏng vấn SLA,Điểm lỗi đơn SPOF,Câu hỏi phỏng vấn Rate Limiting,Câu hỏi phỏng vấn Fallback,Câu hỏi phỏng vấn Circuit Breaker,Câu hỏi phỏng vấn Timeout Retry,Câu hỏi phỏng vấn Idempotency,RTO,RPO,Kiểm thử hiệu năng,Diễn tập sự cố
lang: vi
sourceRef: zh-ref/high-availability/high-availability-system-interview-questions.md
---

Câu hỏi phỏng vấn về High Availability (hệ thống sẵn sàng cao) thường bắt đầu bằng một câu "Làm sao đảm bảo hệ thống không bị sập?", rồi nhanh chóng xoáy sâu vào điểm lỗi đơn (SPOF), Rate Limiting và Ngắt mạch (Circuit Breaker), Timeout và Retry, Tính lũy đẳng (Idempotency) của API cũng như khắc phục thảm họa đa vùng (Cross-region Disaster Recovery). Chỉ liệt kê tên công cụ hay thành phần thường là chưa đủ, bạn còn phải giải thích được sự cố được phát hiện ra sao, phạm vi ảnh hưởng được kiểm soát thế nào, dịch vụ phục hồi bằng cách nào và dữ liệu có giữ được tính đúng đắn hay không.

Bài viết này là cổng ôn tập cho chuyên đề High Availability của JavaGuide, được sắp xếp thành năm phần: Nền tảng High Availability, Dự phòng và Khắc phục thảm họa, Rate Limiting, Giáng cấp (Fallback) & Ngắt mạch (Circuit Breaker), Timeout, Retry & Tính lũy đẳng (Idempotency), và Kiểm thử hiệu năng & Quản trị sự cố. Đáp án và chi tiết triển khai nằm trong các bài viết chuyên đề tương ứng.

Nếu thời gian gấp, bạn có thể xem trước [Tổng hợp câu hỏi phỏng vấn thường gặp về hệ thống High Availability](https://interview.javaguide.cn/high-availability/high-availability-system-interview-questions.html), đánh dấu những câu tạm thời chưa trình bày rõ rồi quay lại bài này để bổ sung nguyên lý và chi tiết kỹ thuật.

## Khi ôn tập nên nắm chắc những vấn đề nào trước?

| Phân hệ                                       | Nội dung cần trình bày rõ ràng                                                    | Hướng hỏi xoáy thường gặp                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Nền tảng High Availability                    | Tính sẵn sàng được đo lường ra sao, giảm tỷ lệ sự cố và phạm vi ảnh hưởng thế nào | Thỏa thuận mức dịch vụ (SLA), chỉ số sẵn sàng, SPOF, Canary Release |
| Dự phòng & Khắc phục thảm họa                 | Sau khi node hoặc data center gặp sự cố, tài nguyên dự phòng tiếp quản lưu lượng và dữ liệu ra sao | RTO, RPO, Cold/Hot Standby, Multi-Active, Failover, Split-Brain |
| Rate Limiting, Fallback & Ngắt mạch (Circuit Breaker) | Khi lưu lượng vượt sức chịu tải hoặc hạ nguồn lỗi kéo dài, bảo vệ service thế nào | Thuật toán Rate Limiting, Fallback, Circuit Breaker, Isolation, Sentinel |
| Timeout, Retry & Tính lũy đẳng (Idempotency)  | Sau khi gọi từ xa thất bại có được Retry không, làm sao tránh ghi trùng lặp dữ liệu | Deadline, Backoff, Retry Budget, Idempotency Key, State Machine |
| Hiệu năng & Quản trị sự cố                    | Làm sao xác định năng lực chịu tải, phát hiện điểm nghẽn và xác minh cơ chế chịu lỗi | P99, Load Testing, Capacity Planning, vấn đề Cache, diễn tập sự cố |

Những cơ chế này cần được đặt vào cùng một chuỗi lời gọi (Call Chain) để hiểu. Khi lưu lượng đầu vào quá lớn thì thực hiện Rate Limiting trước; khi hạ nguồn phản hồi quá chậm phải Timeout kịp thời; lỗi nhất thời (transient error) có thể Retry trong phạm vi ngân sách cho phép, còn lỗi kéo dài sẽ kích hoạt Ngắt mạch (Circuit Breaker); ngoài ra các request ghi bắt buộc phải dùng cơ chế Tính lũy đẳng (Idempotency) để ngăn tác dụng phụ lặp lại.

## Nền tảng High Availability

High Availability không đồng nghĩa với việc vĩnh viễn không bao giờ lỗi. Thiết kế hệ thống cần trả lời được: làm sao giảm thiểu sự cố, khi sự cố xảy ra làm sao giới hạn phạm vi ảnh hưởng và mất bao lâu để khôi phục dịch vụ. Chỉ triển khai thêm vài instance chỉ giúp giảm điểm lỗi đơn ở tầng ứng dụng; Database, Cache, Message Queue, Configuration Center, DNS và Load Balancer vẫn có thể trở thành nguồn gây sự cố.

![Phương pháp ba tầng giúp nâng cao tính sẵn sàng của hệ thống](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/ha-interview-availability-methods-ef016f16.png)

Nội dung liên quan: [Cẩm nang thiết kế hệ thống High Availability](https://javaguide.cn/high-availability/high-availability-system-design.html)

Câu hỏi phỏng vấn thường gặp:

- High Availability là gì? Nó khác gì so với việc "triển khai thêm vài máy chủ"?
- Mức sẵn sàng 99.9%, 99.99% và 99.999% lần lượt cho phép gián đoạn tối đa bao lâu?
- Mã nguồn, phát hành (deploy), lưu lượng, hạ tầng và các phụ thuộc bên ngoài có thể khiến hệ thống mất khả dụng bằng cách nào?
- Nâng cao tính sẵn sàng của hệ thống thường cần bắt đầu từ những khía cạnh nào?
- Điểm lỗi đơn (SPOF) là gì? Vì sao đã có instance dự phòng mà vẫn chưa chắc loại bỏ hết điểm lỗi đơn?
- Phát hành từng phần (Canary Release) kiểm soát rủi ro thay đổi ra sao? Tăng lưu lượng dần, giám sát và Rollback phối hợp với nhau như thế nào?

Khi trả lời về chỉ số tính sẵn sàng, hãy làm rõ quy chuẩn thống kê trước. Tính theo tháng dương lịch hay năm dương lịch, thời gian bảo trì có kế hoạch có tính vào hay không, các API khác nhau có dùng chung một Thỏa thuận mức dịch vụ (SLA) hay không đều ảnh hưởng tới con số cuối cùng. Mỗi một chữ số 9 thêm vào sau dấu phẩy cũng làm tăng chi phí dự phòng, vận hành và diễn tập.

## Dự phòng & Khắc phục thảm họa

Dự phòng giải quyết câu hỏi "tài nguyên thay thế nằm ở đâu", còn khắc phục thảm họa (Disaster Recovery) phải xử lý thêm phát hiện lỗi, chuyển đổi lưu lượng, sao chép dữ liệu và phục hồi. Với các service phi trạng thái (Stateless), việc tự động loại bỏ instance lỗi thường khá dễ; nhưng chuyển đổi Master của Database, chuyển lưu lượng liên vùng (Cross-region) và luồng tiền tệ đều liên quan đến rủi ro dữ liệu nên thường đòi hỏi xác nhận thận trọng hơn và kế hoạch chuyển ngược lại (Failback).

![RTO và RPO](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-rto-rpo-timeline-a78b1bd9.png)

Nội dung liên quan: [Giải thích chi tiết thiết kế dự phòng (Redundancy)](https://javaguide.cn/high-availability/redundancy.html)

Câu hỏi phỏng vấn thường gặp:

- Dự phòng (Redundancy) là gì? Service, Database, Cache và trung tâm dữ liệu dự phòng lần lượt như thế nào?
- RTO và RPO lần lượt ràng buộc điều gì? `RPO = 0` sẽ kéo theo những cái giá nào?
- Cold Standby (dự phòng nguội), Warm Standby (dự phòng ấm), Hot Standby (dự phòng nóng) và Multi-Active khác nhau thế nào?
- Nên lựa chọn ra sao giữa khắc phục thảm họa nội thành, Multi-Active nội thành và Multi-Active khác vùng địa lý?
- Chuyển đổi dự phòng (Failover) là gì? Khi nào phù hợp chuyển đổi tự động và khi nào cần xác nhận thủ công?
- Phát hiện lỗi quá nhanh hoặc quá chậm sẽ gây ra vấn đề gì?
- Vì sao phân mảnh mạng (Network Partition) có thể dẫn đến Split-Brain (não phân đôi)? Nguyên tắc đa số (Quorum), Lease và Fencing ngăn ghi song song hai Master như thế nào?
- Redis Sentinel Failover có đảm bảo được `RPO = 0` không? `quorum` đóng vai trò gì trong quá trình bầu chọn?

RTO/RPO đặt ra mục tiêu khắc phục thảm họa, nhưng cấu hình xong không có nghĩa là hệ thống chắc chắn đạt được mục tiêu đó. Bản sao lưu có khôi phục được không, lưu lượng có chuyển đi sạch sẽ không, dữ liệu sau chuyển đổi có toàn vẹn không — tất cả đều phải kiểm chứng bằng diễn tập định kỳ. Truy vấn đơn hàng và hạch toán tài chính có mức độ chịu đựng thời gian gián đoạn và mất mát dữ liệu khác nhau, nên không cần gượng ép dùng chung một bộ chỉ số.

## Rate Limiting, Giáng cấp (Fallback) & Ngắt mạch (Circuit Breaker)

Ba cơ chế này giải quyết những bài toán khác nhau. Rate Limiting kiểm soát lượng request đi vào hệ thống; giáng cấp dịch vụ / Dự phòng giáng cấp (Fallback) giảm bớt năng lực phục vụ theo mức độ ưu tiên nghiệp vụ; Ngắt mạch (Circuit Breaker) ngừng gọi khi hạ nguồn liên tục bất thường. Trong khi đó, cô lập tài nguyên (Isolation) tách biệt Thread, kết nối hoặc hạn mức đồng thời để tránh một dịch vụ phụ thuộc chiếm trọn toàn bộ tài nguyên.

![Máy trạng thái của Circuit Breaker](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-fuse-state-machine-48c9741c.png)

Nội dung liên quan:

- [Giải thích chi tiết Rate Limiting dịch vụ](https://javaguide.cn/high-availability/limit-request.html)
- [Giải thích chi tiết giáng cấp dịch vụ & Ngắt mạch (Circuit Breaker)](https://javaguide.cn/high-availability/fallback-and-circuit-breaker.html)

Câu hỏi phỏng vấn thường gặp:

- Tại sao phải thực hiện Rate Limiting? Request bị chặn nên bị từ chối thẳng, xếp hàng chờ hay trả về kết quả Dự phòng giáng cấp (Fallback)?
- Fixed Window, Sliding Window, Leaky Bucket và Token Bucket lần lượt phù hợp với những kịch bản nào?
- Vì sao Fixed Window lại gây ra hiện tượng tăng đột biến lưu lượng tại ranh giới hai cửa sổ?
- Rate Limiting đơn máy và Rate Limiting phân tán khác nhau thế nào? Khi Redis Rate Limiting gặp sự cố thì dự phòng ra sao?
- Nên kết hợp Rate Limiting theo Gateway, API, User, IP và Tenant như thế nào?
- `SmoothBursty` và `SmoothWarmingUp` trong `RateLimiter` của Guava khác nhau ở điểm nào?
- Giáng cấp dịch vụ và Ngắt mạch (Circuit Breaker) lần lượt được kích hoạt bởi điều gì? Cách phục hồi khác nhau ra sao?
- Ba trạng thái `Closed`, `Open`, `HalfOpen` của Circuit Breaker chuyển đổi qua lại như thế nào?
- Timeout, Retry, Rate Limiting, Circuit Breaker và Isolation nên phối hợp trong cùng một chuỗi lời gọi như thế nào?
- Cô lập bằng Thread Pool (Thread-pool Isolation) và cô lập bằng Semaphore (Semaphore Isolation) mỗi loại phải trả những cái giá nào?
- Vì sao trong Dự phòng giáng cấp (Fallback) cần hạn chế tối đa việc phát sinh lời gọi mạng (remote call) mới?
- Nên chọn lựa thế nào giữa Hystrix, Sentinel và Resilience4j?

Giải pháp không thể chỉ ghi mỗi con số ngưỡng mà còn phải giải thích căn cứ đặt ngưỡng và hành động phục hồi. Sau khi Ngắt mạch (Circuit Breaker) mở ra thì bao lâu chuyển sang `HalfOpen`, mỗi lần cho bao nhiêu lưu lượng thăm dò đi qua; khi kích hoạt Rate Limiting có trả về header `Retry-After` hay không; kết quả Dự phòng giáng cấp (Fallback) được gắn nhãn và giám sát thế nào — tất cả đều ảnh hưởng trực tiếp tới vận hành thực tế.

## Timeout, Retry & Tính lũy đẳng (Idempotency)

Timeout chỉ cho biết bên gọi không nhận được kết quả trong thời hạn quy định, chứ không chứng minh phía server đã xử lý thất bại. Request truy vấn có thể Retry giới hạn trong tổng ngân sách thời gian (Time Budget); còn các thao tác ghi như thanh toán, đặt hàng, trừ tồn kho bắt buộc phải kiểm soát thực thi trùng lặp trước bằng Idempotency Key, ràng buộc duy nhất (Unique Constraint) hoặc State Machine.

![Kiểm tra bắt buộc trước khi Retry: Loại lỗi + Tính lũy đẳng của thao tác](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/timeout-and-retry-optimized-retry-idempotency-de-e36842e9.png)

Nội dung liên quan:

- [Giải thích chi tiết Timeout & Retry](https://javaguide.cn/high-availability/timeout-and-retry.html)
- [Tổng hợp giải pháp Tính lũy đẳng (Idempotency) của API](https://javaguide.cn/high-availability/idempotency.html)

Câu hỏi phỏng vấn thường gặp:

- Vì sao lời gọi từ xa (Remote Call) bắt buộc phải thiết lập Timeout? Connect Timeout, Read Timeout, Connection Pool Timeout và tổng Deadline lần lượt giới hạn điều gì?
- Thời gian Timeout nên tham chiếu theo P99/P999, thời gian chờ nghiệp vụ hay SLA của dịch vụ hạ nguồn?
- Timeout Budget trong chuỗi lời gọi được truyền xuống từng tầng như thế nào?
- Vì sao Retry có thể khuếch đại sự cố? Exponential Backoff và Jitter giải quyết vấn đề gì?
- Những lỗi mạng và mã trạng thái HTTP nào phù hợp để Retry? Những lỗi nào nên thất bại ngay?
- Retry Budget là gì? Điều gì xảy ra nếu nhiều tầng SDK cùng đồng thời Retry?
- Tính lũy đẳng (Idempotency) là gì? Ngữ nghĩa lũy đẳng của HTTP và tính lũy đẳng nghiệp vụ khác nhau ở đâu?
- Idempotency Key, Unique Index, Redis, khóa lạc quan (`Optimistic Lock`) và State Machine lần lượt phù hợp với những kịch bản nào?
- API thanh toán xử lý request lần đầu, request trùng lặp đồng thời và thông báo callback trùng lặp như thế nào?
- Khử trùng (Deduplication) và Tính lũy đẳng (Idempotency) khác nhau ở điểm nào? Vì sao khử trùng ở tầng đầu vào không thể thay thế Tính lũy đẳng ở phía Server?
- Khi dùng Token để chống gửi trùng lặp, thứ tự giữa việc tiêu thụ Token và thực thi logic nghiệp vụ tiềm ẩn rủi ro gì?
- Khi dùng khóa bi quan (`Pessimistic Lock`) để đảm bảo Tính lũy đẳng, làm thế nào tránh khóa phạm vi (Range Lock), Deadlock và giao dịch kéo dài (Long Transaction)?

Khi ôn phần này, hãy tập trung phân tích các tình huống kết quả bất định: phía Server đã trừ tiền xong nhưng phản hồi bị thất lạc trên đường mạng; bên gọi bị Timeout nên gửi lại request, nếu không có mã request nghiệp vụ ổn định thì rất có thể dẫn đến trừ tiền lần thứ hai.

## Kiểm thử hiệu năng & Quản trị sự cố

Không có dữ liệu đo năng lực và kết quả diễn tập, giải pháp High Availability chỉ nằm trên bản vẽ. Kiểm thử chịu tải (Load Testing) dùng để quan sát độ trễ, thông lượng và biến động tài nguyên ở các mức lưu lượng khác nhau; còn diễn tập sự cố (Failure Drills / Chaos Engineering) xác minh xem khi node sập, dịch vụ phụ thuộc chậm đi hoặc mạng bị phân mảnh, các cơ chế bảo vệ và phục hồi có hoạt động đúng kỳ vọng hay không.

![Quy trình chính của kiểm thử hiệu năng](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/ha-interview-performance-test-flow-8414258f.png)

Nội dung liên quan: [Nhập môn kiểm thử hiệu năng](https://javaguide.cn/high-availability/performance-test.html)

Câu hỏi phỏng vấn thường gặp:

- RT, QPS, TPS, số lượng đồng thời (Concurrency), thông lượng (Throughput) và tỷ lệ lỗi lần lượt phản ánh điều gì?
- Vì sao RT trung bình không đại diện cho độ trễ đuôi dài (Tail Latency)? Cần đọc chỉ số P95 và P99 như thế nào?
- Performance Testing, Load Testing, Stress Testing và Stability Testing khác nhau ra sao?
- Vì sao đánh giá dung lượng không thể chỉ nhìn vào máy chủ ứng dụng? Làm sao tìm ra điểm nghẽn ở Database, Cache hoặc Connection Pool?
- Cache Penetration, Cache Breakdown và Cache Avalanche lần lượt bị kích hoạt bởi nguyên nhân gì?
- Diễn tập sự cố là gì? Nó kiểm chứng những vấn đề gì khác so với kiểm thử hiệu năng chịu tải?
- Làm sao thiết kế một hệ thống High Availability? Khi trả lời cần xâu chuỗi dự phòng, Rate Limiting, Ngắt mạch (Circuit Breaker), Tính lũy đẳng (Idempotency) và khả năng quan sát (Observability) như thế nào?
- Sau khi đưa Timeout và Retry lên production, vì sao phải theo dõi đồng thời tỷ lệ thành công lần đầu (First-attempt Success Rate) và tỷ lệ thành công cuối cùng (Final Success Rate)?

Nếu tỷ lệ thành công lần đầu liên tục giảm trong khi tỷ lệ thành công cuối cùng gần như không đổi, rất có thể hệ thống đang dùng Retry để che lấp sự cố ở hạ nguồn. Lúc này không chỉ xem tỷ lệ thành công cuối cùng, mà còn phải kiểm tra Retry QPS, tỷ lệ Timeout, hàng đợi Thread Pool, thời gian chờ Connection Pool và trạng thái của Circuit Breaker.

## Sắp xếp lịch ôn tập theo thời gian chuẩn bị

| Thời gian còn lại | Lộ trình đề xuất                                                                                                                                                                   | Mục tiêu ôn tập                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1–2 ngày          | Xem lướt [Tổng hợp câu hỏi phỏng vấn thường gặp về hệ thống High Availability](https://interview.javaguide.cn/high-availability/high-availability-system-interview-questions.html) trước, ưu tiên bổ sung Rate Limiting, Ngắt mạch (Circuit Breaker), Timeout/Retry và Tính lũy đẳng (Idempotency) | Trả lời được các câu hỏi tần suất cao và nêu được các rủi ro, giới hạn chính                    |
| 3–7 ngày          | Bổ sung RTO/RPO, Failover, Isolation, Capacity Planning và High Availability cho Cache, sau đó tự vẽ một chuỗi lời gọi hoàn chỉnh                                                    | Giải thích được cách các cơ chế phối hợp với nhau, có thể phân tích tiếp khi gặp tình huống lỗi |
| Trên 1 tuần       | Đọc toàn bộ bài viết chuyên đề, kết hợp với dự án thực tế của bản thân để hệ thống hóa một case study về phát hành, Timeout, lưu lượng tăng đột biến hoặc lỗi dịch vụ phụ thuộc   | Trình bày xuyên suốt từ Thỏa thuận mức dịch vụ (SLA) đến chọn giải pháp, chỉ số giám sát, phục hồi và hậu kiểm (Postmortem) |

Với vị trí có kinh nghiệm và cấp bậc trung–cao cấp, bạn còn cần chuẩn bị các ràng buộc thực tế trong dự án của mình. Khi người phỏng vấn hỏi "tại sao bạn đặt Timeout là 500ms?", họ sẽ hỏi tiếp về phân bố độ trễ, tổng ngân sách từ thượng nguồn, số lần Retry, năng lực chịu tải hạ nguồn và cách điều chỉnh động. Với những phần bạn chưa trực tiếp tham gia thiết kế, hãy trả lời dựa trên kiến thức đã học và tìm hiểu, tuyệt đối không bịa đặt số liệu production.
