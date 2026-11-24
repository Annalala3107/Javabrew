---
title: "Tổng hợp câu hỏi phỏng vấn thường gặp về hệ thống High Performance"
category: Hiệu năng cao (High Performance)
redirectFrom:
  - /high-performance/high-performance-interview-questions.html
description: "Tổng hợp câu hỏi phỏng vấn thường gặp về hệ thống hiệu năng cao (High Performance): bao gồm CDN, Cân bằng tải (Load Balancing), Tách Đọc-Ghi (Read/Write Splitting), Phân mảnh & Chia bảng (Sharding), tối ưu SQL, phân trang sâu (Deep Pagination), tách dữ liệu nóng-lạnh, Message Queue, Kafka, RocketMQ, RabbitMQ và các kiến thức cốt lõi khác."
tag:
  - High Performance
  - Câu hỏi phỏng vấn
  - Thiết kế hệ thống
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn High Performance,Thiết kế hệ thống High Performance,Câu hỏi phỏng vấn CDN,Câu hỏi phỏng vấn Cân bằng tải,Câu hỏi phỏng vấn Load Balancing,Câu hỏi phỏng vấn Tách Đọc-Ghi,Câu hỏi phỏng vấn Sharding,Câu hỏi phỏng vấn tối ưu SQL,Câu hỏi phỏng vấn phân trang sâu,Câu hỏi phỏng vấn Message Queue,Câu hỏi phỏng vấn Kafka,Câu hỏi phỏng vấn RocketMQ,Câu hỏi phỏng vấn RabbitMQ
lang: vi
sourceRef: zh-ref/high-performance/high-performance-system-interview-questions.md
---

Phỏng vấn về hệ thống hiệu năng cao (High Performance) thường bắt đầu từ một triệu chứng cụ thể: API bị chậm, CPU của Database tăng vọt, message bắt đầu tồn đọng (backlog), hoặc lưu lượng đợt khuyến mãi vượt quá sức chịu tải hiện tại. Khi trả lời, hãy xác nhận trước QPS, P99, quy mô dữ liệu và tỷ lệ đọc/ghi, sau đó rà soát dọc theo chuỗi request qua cổng đầu vào, ứng dụng, Cache, Database và Message Queue. Nếu trả lời ngay lập tức kiểu "thêm Cache, gắn MQ, Phân mảnh & Chia bảng (Sharding)" thì rất dễ bị hỏi xoáy đến bí.

Bài viết này là cổng ôn tập cho chuyên đề High Performance của JavaGuide, được tổng hợp thành bốn phần: Cổng lưu lượng, Tối ưu Database, Message Queue và Thiết kế hệ thống tổng hợp. Mỗi phần liệt kê các hướng hỏi xoáy phổ biến, còn nguyên lý chi tiết và cách triển khai nằm trong các bài viết chuyên đề tương ứng.

Nếu thời gian khá gấp, bạn có thể xem trước [Tổng hợp câu hỏi phỏng vấn thường gặp về hệ thống High Performance](https://interview.javaguide.cn/high-performance/high-performance-system-interview-questions.html), đánh dấu những câu tạm thời chưa trình bày rõ rồi quay lại bài này để bổ sung nguyên lý và chi tiết kỹ thuật.

## Khi ôn tập nên nắm trước những vấn đề nào?

| Phân hệ             | Nội dung cần trình bày rõ ràng                                                       | Hướng hỏi xoáy thường gặp                                                |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Cổng lưu lượng      | Cách rút ngắn khoảng cách truy cập của người dùng và phân phối request tới các node khả dụng | CDN, Origin Pull (hồi nguồn), chiến lược Cache, Cân bằng tải Layer 4/Layer 7, thuật toán điều phối |
| Tối ưu Database     | Khi lưu lượng đọc/ghi và quy mô dữ liệu tăng lên, làm sao định vị và giảm tải điểm nghẽn Database | SQL, Index, Tách Đọc-Ghi (Read/Write Splitting), Phân mảnh & Chia bảng (Sharding), phân trang sâu, tách nóng-lạnh |
| Message Queue       | Tác vụ nào có thể xử lý bất đồng bộ, làm thế nào ứng phó với lưu lượng tăng đột biến | Độ tin cậy, tiêu thụ trùng lặp, thứ tự, tồn đọng (backlog), Kafka, RocketMQ, RabbitMQ |
| Thiết kế tổng hợp   | Cách suy luận giải pháp từ các chỉ số, điểm nghẽn và ràng buộc nghiệp vụ             | Năng lực chịu tải (Capacity), Load Test, tính nhất quán, chi phí, Canary và Rollback |

Tối ưu hiệu năng cao không có một danh sách component cố định. Cùng một câu truy vấn chậm (slow query), nguyên nhân có thể đến từ việc thiếu Index, phân trang sâu (deep pagination), dữ liệu hotspot, chờ Connection Pool, hoặc cũng có thể do API hạ nguồn làm chậm cả chuỗi xử lý. Hãy dùng chỉ số để xác định điểm nghẽn trước rồi mới bàn đến giải pháp và chi phí đánh đổi.

## CDN và Cân bằng tải (Load Balancing)

CDN đưa các nội dung có thể cache đến các Edge Node (node biên) gần người dùng hơn, giúp giảm truyền tải liên vùng và giảm áp lực cho server gốc (Origin); Cân bằng tải (Load Balancing) phân phối các request đi vào hệ thống tới nhiều instance dịch vụ. Một bên xử lý phân phối nội dung, một bên xử lý điều phối request, nên thường xuất hiện cùng nhau ở tầng đầu vào trong các bài toán System Design.

![Sơ đồ đơn giản về CDN](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/cdn/cdn-101-2a2c5ca4.png)

Nội dung liên quan:

- [Giải thích chi tiết nguyên lý hoạt động của CDN](https://javaguide.cn/high-performance/cdn.html)
- [Giải thích chi tiết nguyên lý và thuật toán Cân bằng tải](https://javaguide.cn/high-performance/load-balancing.html)

Câu hỏi phỏng vấn thường gặp:

- Tại sao CDN có thể giảm độ trễ truy cập? Những request nào vẫn phải quay về Origin (Origin Pull)?
- Nên cấu hình Cache cho HTML, JS/CSS có mã hash, hình ảnh và file tải về như thế nào?
- Khi tỷ lệ cache hit giảm hoặc lượng Origin Pull tăng đột biến, cần kiểm tra những cấu hình nào?
- Cân bằng tải (Load Balancing) là gì? Cân bằng tải Layer 4 và Layer 7 lần lượt hoạt động ở tầng nào?
- Lựa chọn giữa Round-Robin, Weighted Round-Robin, Random, Least Connections và Consistent Hashing như thế nào?
- Health Check, Connection Draining và Session Persistence ảnh hưởng ra sao khi node bật/tắt (scale in/out)?
- Sự khác biệt giữa Cân bằng tải phía Server (Server-side Load Balancing) và phía Client (Client-side Load Balancing) là gì?

Khi trả lời câu hỏi về CDN, đừng mặc định mọi nội dung đều phù hợp để cache dài hạn. Nếu file HTML tham chiếu tới các tài nguyên tĩnh cũ đã bị xóa, việc cache HTML quá lâu sẽ khiến người dùng tải phải trang bị lỗi; các phản hồi động liên quan đến danh tính và quyền hạn người dùng còn phải ngăn chặn việc cache chéo giữa các user.

## Tối ưu hiệu năng Database

Khi Database bị chậm, trước tiên có thể xem slow SQL, Execution Plan, tỷ lệ trúng Index, chờ khóa (lock wait), Connection Pool và Disk I/O. Khi từng câu truy vấn đơn lẻ vẫn còn dư địa tối ưu mà đã vội Phân mảnh & Chia bảng (Sharding), việc đó chỉ phóng đại thêm các vấn đề về truy vấn, Transaction và vận hành. Tách Đọc-Ghi (Read/Write Splitting) và phân mảnh dữ liệu phù hợp để giải quyết bài toán dung lượng và thông lượng (throughput), chứ không thể thay thế cho việc tối ưu SQL và Index.

![Kiến trúc Tách Đọc-Ghi (Read/Write Splitting)](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/read-and-write-separation-and-library-subtable/read-and-write-separation-76ca368e.png)

Nội dung liên quan:

- [Giải thích chi tiết Tách Đọc-Ghi và Phân mảnh & Chia bảng](https://javaguide.cn/high-performance/read-and-write-separation-and-library-subtable.html)
- [Giải thích chi tiết tách dữ liệu nóng-lạnh](https://javaguide.cn/high-performance/data-cold-hot-separation.html)
- [Tổng hợp các kỹ thuật tối ưu SQL thường gặp](https://javaguide.cn/high-performance/sql-optimization.html)
- [Giới thiệu phân trang sâu và đề xuất tối ưu](https://javaguide.cn/high-performance/deep-pagination-optimization.html)

Câu hỏi phỏng vấn thường gặp:

- Tách Đọc-Ghi (Read/Write Splitting) giải quyết vấn đề gì? Sao chép Master-Replica và định tuyến request đọc phối hợp với nhau như thế nào?
- Độ trễ sao chép (Replication Lag) gây ra những vấn đề nghiệp vụ nào? Những request nào bắt buộc phải đọc từ Master DB?
- Khi nào mới thực sự cần Phân mảnh & Chia bảng (Sharding)? Chia dọc (Vertical Splitting) và chia ngang (Horizontal Splitting) khác nhau thế nào?
- Sau khi Phân mảnh & Chia bảng (Sharding), xử lý JOIN liên database, phân trang, sắp xếp, Transaction và mở rộng (scale out) ra sao?
- Nên chọn Sharding Key như thế nào? Hot tenant hoặc hot merchant sẽ gây ra vấn đề gì?
- Tối ưu SQL nên bắt đầu từ bước nào giữa slow query log, Execution Plan và Index?
- Những cách viết nào khiến Index bị vô hiệu hóa? Thứ tự các cột trong Composite Index được xác định thế nào?
- Tại sao `LIMIT offset, size` càng về trang sau càng chậm? Lựa chọn giữa Cursor Pagination, Deferred Join và Covering Index ra sao?
- Phân chia dữ liệu nóng và lạnh như thế nào? Trong quá trình di chuyển dữ liệu (migration), xử lý ghi kép (dual write), đồng bộ tăng lượng (incremental sync) và đối soát dữ liệu ra sao?

Nhóm câu hỏi này rất hay hỏi xoáy về tính nhất quán (Consistency). Tách Đọc-Ghi (Read/Write Splitting) làm lộ rõ độ trễ giữa Master và Replica; Phân mảnh & Chia bảng (Sharding) làm tăng chi phí Transaction và truy vấn liên shard; còn di chuyển dữ liệu nóng-lạnh phải đối mặt với việc lưu trữ cũ và mới song song tồn tại trong thời gian ngắn. Trong câu trả lời cần nêu rõ nghiệp vụ chịu được mức không nhất quán trong bao lâu, cũng như cách đối soát và bù trừ (compensation) khi xảy ra sai lệch.

## Message Queue và Cắt đỉnh (Peak Shaving)

Message Queue có thể tách các tác vụ không cần thời gian thực ra khỏi chuỗi lời gọi đồng bộ, đồng thời tạm lưu request khi lưu lượng tăng đột biến. Sau khi đưa MQ vào hệ thống, quan hệ gọi trở thành bất đồng bộ; việc xác nhận của Producer, lưu trữ bền vững (persistence) của Broker, xử lý của Consumer và chiến lược Retry đều sẽ ảnh hưởng đến kết quả cuối cùng.

![Cắt đỉnh bằng Message Queue](/media/jg/ext/oss.javaguide.cn/github/javaguide/.png-f7ce8315.png)

Nội dung liên quan:

- [Tổng hợp câu hỏi phỏng vấn Message Queue](https://javaguide.cn/high-performance/message-queue/message-queue-interview-questions.html)
- [Tổng hợp câu hỏi thường gặp về nền tảng Message Queue](https://javaguide.cn/high-performance/message-queue/message-queue.html)
- [Tổng hợp câu hỏi phỏng vấn thường gặp Kafka](https://javaguide.cn/high-performance/message-queue/kafka-questions-01.html)
- [Tổng hợp câu hỏi phỏng vấn thường gặp RocketMQ](https://javaguide.cn/high-performance/message-queue/rocketmq-questions.html)
- [Tổng hợp câu hỏi phỏng vấn thường gặp RabbitMQ](https://javaguide.cn/high-performance/message-queue/rabbitmq-questions.html)
- [Tổng hợp câu hỏi phỏng vấn thường gặp Disruptor](https://javaguide.cn/high-performance/message-queue/disruptor-questions.html)

Câu hỏi phỏng vấn thường gặp:

- Message Queue thực hiện xử lý bất đồng bộ, decoupling và cắt đỉnh (peak shaving) như thế nào? Đưa vào hệ thống sẽ làm phát sinh thêm những vấn đề gì?
- Một message đi từ Producer tới Consumer có thể bị mất ở những công đoạn nào?
- Tại sao cơ chế gửi ít nhất một lần (at-least-once) lại có thể sinh ra message trùng lặp? Consumer đảm bảo tính lũy đẳng (Idempotency) như thế nào?
- Thứ tự toàn cục (global ordering) và thứ tự theo partition (partition ordering) khác nhau ở điểm nào? Tiêu thụ theo thứ tự sẽ phải đánh đổi những khả năng nào?
- Khi xảy ra tồn đọng message (backlog), làm thế nào phân biệt giữa Producer tăng đột biến, Consumer xử lý chậm, thiếu partition hay lỗi hạ nguồn?
- Tại sao Kafka có thông lượng (throughput) cao? Batching, ghi tuần tự (sequential write), Page Cache và Zero-Copy lần lượt đóng vai trò gì?
- ACK, Replica và Consumer Offset của Kafka ảnh hưởng tới độ tin cậy của message như thế nào?
- Transactional Message của RocketMQ giải quyết vấn đề gì? Cơ chế kiểm tra lại (check-back) xử lý trạng thái không xác định (unknown state) ra sao?
- Exchange, Queue, Binding và Routing Key của RabbitMQ phối hợp với nhau như thế nào?
- Disruptor khác gì với Message Queue liên tiến trình? Nó phù hợp để đặt ở loại đường ống xử lý nội tiến trình (in-process) nào?

Việc "không mất message" không thể chỉ nhìn vào việc Broker có ghi đĩa bền vững hay không. Producer gửi xong không nhận được ACK, Consumer xử lý thành công nhưng commit offset thất bại, hay tiến trình bị crash sau khi ghi vào Database nghiệp vụ đều có thể làm mất hoặc trùng lặp message. Khi chuẩn bị câu trả lời, cần giải thích từng chặng dọc theo toàn bộ đường truyền.

## Câu hỏi thiết kế hệ thống tổng hợp

Câu hỏi System Design sẽ không nói trước cho bạn biết phải dùng component nào. Hãy xác nhận mục tiêu nghiệp vụ và năng lực chịu tải trước, rồi định vị điểm nghẽn có khả năng xảy ra cao nhất; sau khi triển khai giải pháp còn phải kiểm chứng bằng Load Testing và giám sát (monitoring), không thể chỉ dựa vào RT trung bình hay QPS đơn máy để chứng minh hệ thống đã đáp ứng yêu cầu.

Nội dung liên quan: [Nhập môn kiểm thử hiệu năng (Performance Testing)](https://javaguide.cn/high-availability/performance-test.html)

Câu hỏi phỏng vấn thường gặp:

- Thiết kế một hệ thống đơn hàng hiệu năng cao như thế nào? Truy vấn, đặt hàng và các tác vụ bất đồng bộ lần lượt xử lý ra sao?
- Khi API bị chậm, làm sao tận dụng Trace, slow SQL, Thread Pool, Connection Pool và các chỉ số tài nguyên hệ thống để định vị điểm nghẽn?
- QPS, TPS, số lượng đồng thời (concurrency), P95/P99 và tỷ lệ lỗi lần lượt phản ánh điều gì?
- Cách ước tính năng lực chịu tải từ lưu lượng đỉnh (peak traffic) của nghiệp vụ, và chừa ngưỡng an toàn cho Database, Cache, MQ và API hạ nguồn?
- Cache, Tách Đọc-Ghi (Read/Write Splitting), Phân mảnh & Chia bảng (Sharding) và Message Queue nên được đưa vào theo thứ tự nào?
- Sau khi tối ưu lên production, làm thế nào kiểm chứng hiệu quả thông qua Canary, Load Testing, monitoring và Rollback?
- Sau khi hiệu năng tăng lên, tính nhất quán, tính sẵn sàng (Availability), chi phí và độ phức tạp vận hành sẽ thay đổi ra sao?

Các vị trí có kinh nghiệm và cấp độ Mid/Senior thường sẽ bị hỏi xoáy tiếp về bằng chứng thực tế từ dự án. Chẳng hạn khi nói "sau khi tối ưu thì API nhanh hơn", cần bổ sung lưu lượng trước và sau tối ưu, các phân vị độ trễ (latency percentiles), tỷ lệ lỗi, mức sử dụng tài nguyên, môi trường Load Test và chu kỳ quan sát. Với phần chưa từng trực tiếp tham gia, cứ trả lời theo kiến thức đã học, tuyệt đối không bịa đặt số liệu production.

## Lộ trình ôn tập theo quỹ thời gian

| Thời gian còn lại | Lịch trình gợi ý                                                                                      | Mục tiêu ôn tập                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1–2 ngày          | Đọc lướt toàn bộ câu hỏi trong bài này trước, ưu tiên bổ sung SQL/Index, Tách Đọc-Ghi, Sharding và độ tin cậy của message | Trả lời được các câu hỏi tần suất cao và nêu được giới hạn chính của từng giải pháp              |
| 3–7 ngày          | Bổ sung CDN, Cân bằng tải (Load Balancing), phân trang sâu, tách nóng-lạnh và một MQ phổ biến, rồi tự vẽ một chuỗi request hoàn chỉnh | Suy luận được giải pháp từ điểm nghẽn và tiếp tục trả lời tốt khi gặp câu hỏi về tính nhất quán hay tình huống bất thường |
| Trên 1 tuần       | Đọc toàn bộ bài viết chuyên đề, kết hợp với dự án thực tế hệ thống lại một lần quy trình phát hiện, định vị, tối ưu và kiểm chứng vấn đề hiệu năng | Dùng được chỉ số thực tế để giải thích lý do chọn công nghệ, lợi ích, cái giá phải trả và cách giám sát sau đó |
