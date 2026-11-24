---
title: "Tổng hợp câu hỏi phỏng vấn Message Queue mới nhất 2026: Độ tin cậy, Idempotency, Tính tuần tự, Tồn đọng và Lựa chọn công nghệ"
description: "Tổng hợp câu hỏi phỏng vấn và lộ trình ôn tập Message Queue mới nhất 2026, bao phủ xử lý bất đồng bộ, tách rời ứng dụng, cắt đỉnh giảm tải, độ tin cậy của message, tiêu thụ trùng lặp, Idempotency, Ordered Message, tồn đọng message, Kafka, RocketMQ, RabbitMQ và lựa chọn công nghệ."
category: Hiệu năng cao
tag:
  - Message Queue
  - Câu hỏi phỏng vấn
  - Hiệu năng cao
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn Message Queue,Câu hỏi phỏng vấn MQ,Độ tin cậy message,Tiêu thụ trùng lặp,Idempotency message,Ordered Message,Tồn đọng message,Câu hỏi phỏng vấn Kafka,Câu hỏi phỏng vấn RocketMQ,Câu hỏi phỏng vấn RabbitMQ,Lựa chọn Message Queue
lang: vi
sourceRef: zh-ref/high-performance/message-queue/message-queue-interview-questions.md
---

Phỏng vấn về Message Queue thường bắt đầu từ câu "Tại sao lại dùng MQ?", sau đó đi dọc theo vòng đời của một message để hỏi xoáy sâu hơn: Producer gửi bị timeout thì có retry được không? Broker trả về thành công có đồng nghĩa với việc message không thể bị mất không? Consumer xử lý thành công nhưng gửi xác nhận (ACK) thất bại thì chuyện gì xảy ra? Tiêu thụ trùng lặp, sai lệch thứ tự và tồn đọng message (Message Backlog) phải xử lý như thế nào?

Bài viết này là cổng ôn tập chuyên đề Message Queue của JavaGuide, được sắp xếp theo bốn phần: Kịch bản sử dụng & Giới hạn, Độ tin cậy & Ngữ nghĩa tiêu thụ, Middleware phổ biến, và Lựa chọn công nghệ & Câu hỏi dự án. Mỗi phần chỉ liệt kê các câu hỏi trọng tâm cần nắm khi ôn tập; đáp án đầy đủ và chi tiết triển khai nằm trong các bài viết chuyên đề tương ứng.

Nếu thời gian gấp, bạn có thể xem trước bản ôn tập cấp tốc [Tổng hợp câu hỏi phỏng vấn thường gặp về Message Queue](https://interview.javaguide.cn/high-performance/message-queue-interview-questions.html), đánh dấu những câu chưa trình bày rõ rồi quay lại bài viết này để bổ sung nguyên lý và chi tiết kỹ thuật.

## Khi ôn tập cần nắm chắc những vấn đề nào trước?

| Phân hệ | Nội dung cần trình bày rõ ràng | Hướng hỏi xoáy thường gặp |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Kịch bản & Giới hạn | Vì sao dùng MQ, những luồng xử lý nào không phù hợp chuyển sang bất đồng bộ | Bất đồng bộ, tách rời, cắt đỉnh, nhất quán cuối cùng (Eventual Consistency), RPC vs. MQ |
| Độ tin cậy & Ngữ nghĩa | Message được xác nhận, retry và khôi phục thế nào ở từng khâu từ sản xuất đến tiêu thụ | Mất message, tiêu thụ trùng lặp, Idempotency, thứ tự, Retry, Dead Letter, tồn đọng |
| Nguyên lý Middleware | Các MQ phổ biến tổ chức message, nhân bản dữ liệu và điều phối Consumer ra sao | Kafka, RocketMQ, RabbitMQ, Partition, Replica, Consumer Group, cơ chế ACK |
| Lựa chọn & Quản trị | Làm sao dựa vào năng lực nghiệp vụ, kinh nghiệm vận hành và mục tiêu chịu lỗi để chọn và quản lý MQ | Throughput, độ trễ, Replay, Transactional Message, giám sát, mở rộng, Disaster Recovery, Disruptor |

Khi trả lời câu hỏi về độ tin cậy của message, không thể chỉ đọc tên một tham số cấu hình. Xác nhận phía Producer, lưu trữ bền vững (Persistence) & nhân bản (Replication) phía Broker, xác nhận phía Consumer, tính lũy đẳng (Idempotency) ở nghiệp vụ và đối soát bù trừ cần được trình bày liền mạch; bất kỳ khâu nào xử lý thiếu sót đều có thể biểu hiện thành mất message, xử lý trùng lặp hoặc sai lệch kết quả.

## Kiến thức nền tảng và giới hạn sử dụng Message Queue

Message Queue biến lời gọi đồng bộ giữa Producer và Consumer thành truyền tải message bất đồng bộ. Luồng chính có thể phản hồi nhanh hơn, lưu lượng đột biến cũng được tạm giữ trong Broker, nhưng đồng thời hệ thống phải gánh thêm thành phần middleware, các trạng thái bất đồng bộ và quy trình khôi phục sự cố.

![Nâng cao hiệu năng hệ thống thông qua xử lý bất đồng bộ](/media/jg/ext/oss.javaguide.cn/github/javaguide/Asynchronous-message-queue-99767c5f.png)

Nội dung liên quan:

- [Tổng hợp kiến thức cơ bản về Message Queue](./message-queue.md)
- [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống hiệu năng cao](../high-performance-system-interview-questions.md)

Câu hỏi phỏng vấn thường gặp:

- Message Queue thực hiện xử lý bất đồng bộ, tách rời ứng dụng và cắt đỉnh san tải như thế nào?
- Sau khi đưa Message Queue vào, độ phức tạp hệ thống và tính nhất quán dữ liệu thay đổi ra sao?
- Nghiệp vụ nào phù hợp xử lý bất đồng bộ? Các luồng đòi hỏi thời gian thực mạnh như kết quả thanh toán, trừ tồn kho có thể bất đồng bộ hóa trực tiếp không?
- RPC và Message Queue khác nhau gì về chiều giao tiếp, độ trễ phản hồi, mức độ gắn kết và xử lý lỗi?
- Mô hình Point-to-Point và Publish-Subscribe lần lượt phù hợp với những kịch bản nào?
- Vì sao không thể vừa ghi message vào MQ xong là trả về ngay cho người dùng rằng "nghiệp vụ đã thành công"?

Khi trả lời "Vì sao dùng MQ", tốt nhất hãy gắn với một luồng nghiệp vụ cụ thể. Ví dụ sau khi tạo đơn hàng: những bước nào bắt buộc chạy đồng bộ, những tác vụ nào như gửi thông báo, cộng điểm và kiểm soát rủi ro có thể chạy bất đồng bộ; khi Consumer thất bại thì trạng thái người dùng nhìn thấy và cơ chế bù trừ hậu trường khớp nối với nhau ra sao.

## Độ tin cậy của message và ngữ nghĩa tiêu thụ

Độ tin cậy của message có thể trả lời dọc theo bốn chặng: Producer, Broker, Consumer và xử lý nghiệp vụ. Producer cần xác nhận xem message đã được tiếp nhận chưa, Broker cần tính đến lưu trữ bền vững và bản sao (Replica), Consumer phải xác nhận sau khi hoàn tất nghiệp vụ, còn phía nghiệp vụ phải xử lý trùng lặp và trạng thái kết quả không chắc chắn.

![Mô hình hàng đợi](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-queue-model-a1a548ee.png)

Nội dung liên quan:

- [Tổng hợp kiến thức cơ bản về Message Queue](./message-queue.md)
- [Tổng hợp câu hỏi thường gặp về Kafka](./kafka-questions-01.md)
- [Tổng hợp câu hỏi thường gặp về RocketMQ](./rocketmq-questions.md)
- [Tổng hợp câu hỏi thường gặp về RabbitMQ](./rabbitmq-questions.md)

Câu hỏi phỏng vấn thường gặp:

- At Most Once, At Least Once và Exactly Once lần lượt có ý nghĩa gì?
- Một message có thể bị mất ở những khâu nào? Từng khâu giảm thiểu rủi ro ra sao?
- Tại sao At Least Once dễ sinh ra message trùng lặp? Consumer đảm bảo Idempotency nghiệp vụ bằng cách nào?
- Vì sao khử trùng lặp bằng Message ID không thể thay thế hoàn toàn khóa duy nhất nghiệp vụ (Business Unique Key)?
- Làm sao đảm bảo các message của cùng một đơn hàng hoặc cùng một người dùng được xử lý đúng thứ tự?
- Sau khi tiêu thụ thất bại, loại lỗi nào phù hợp để Retry, loại message nào nên đưa vào Dead Letter Queue (DLQ)?
- Khi xảy ra tồn đọng message (Message Backlog), làm sao phân biệt được đó là do lưu lượng gửi tăng đột biến, Consumer chậm, thiếu Partition hay dịch vụ hạ nguồn gặp sự cố?

Tính tuần tự, độ tin cậy và throughput thường ràng buộc lẫn nhau. Gắn cố định cùng một Business Key vào một Queue hoặc Partition đảm bảo được thứ tự cục bộ nhưng cũng giới hạn mức độ xử lý song song; Sync Flush (flush đĩa đồng bộ) và nhiều bản sao giúp giảm rủi ro mất dữ liệu nhưng lại làm tăng độ trễ ghi và chi phí tài nguyên.

## Câu hỏi tần suất cao về Kafka

Các câu hỏi tần suất cao về Kafka xoay quanh Partition, Replica, Consumer Group, độ tin cậy và thiết kế throughput cao. Khi trả lời cần đặt Producer, Broker, Partition, Replica, Consumer Group và Offset vào cùng một luồng đọc/ghi thống nhất.

![Bố cục Partition của Kafka Topic](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/KafkaTopicPartionsLayout-b39911ea.png)

Nội dung liên quan: [Tổng hợp câu hỏi thường gặp về Kafka](./kafka-questions-01.md)

Câu hỏi phỏng vấn thường gặp:

- Topic, Partition, Replica, Consumer Group và Offset lần lượt đảm nhiệm vai trò gì?
- Vì sao Kafka chỉ đảm bảo thứ tự trong phạm vi một Partition? Nên chọn Business Key như thế nào?
- Mối quan hệ giữa Leader, Follower, ISR, HW và LEO là gì?
- `acks=all`, số bản sao (Replication Factor) và `min.insync.replicas` nên phối hợp cấu hình ra sao?
- Tại sao Kafka có throughput cao? Ghi tuần tự (Sequential Write), Page Cache, Zero-Copy, xử lý theo lô (Batching) và nén (Compression) đóng vai trò gì?
- Idempotent Producer và Transaction của Kafka giải quyết vấn đề gì? Exactly Once có bao trùm được cơ sở dữ liệu bên ngoài không?
- Vì sao Kafka 4.0 chỉ còn hỗ trợ KRaft? Nó khác gì so với chế độ ZooKeeper trước đây?
- Rebalance gây ra những ảnh hưởng gì? Làm thế nào để giảm các đợt Rebalance không cần thiết?

Không nên học thuộc từng tham số Kafka một cách rời rạc. Chẳng hạn `acks=all` là chờ xác nhận từ các bản sao đủ điều kiện đang nằm trong ISR hiện tại, không đồng nghĩa mọi bản sao được cấu hình đều đã ghi xuống đĩa; thời điểm commit Offset sau khi tiêu thụ thành công cũng ảnh hưởng trực tiếp tới rủi ro tiêu thụ trùng lặp và mất message.

## Câu hỏi tần suất cao về RocketMQ

Phỏng vấn RocketMQ thường sát hơn với các kịch bản message nghiệp vụ; Transactional Message, Delayed Message, Ordered Message và cơ chế lưu trữ message là những câu hỏi xoáy phổ biến. Khi ôn tập có thể bắt đầu từ hành trình message đi qua NameServer, Producer, Broker và Consumer, rồi đi sâu vào CommitLog, ConsumeQueue và cơ chế flush đĩa/nhân bản.

Nội dung liên quan: [Tổng hợp câu hỏi thường gặp về RocketMQ](./rocketmq-questions.md)

Câu hỏi phỏng vấn thường gặp:

- NameServer, Broker, Producer, Consumer và Proxy lần lượt phụ trách nhiệm vụ gì?
- Các node NameServer không giao tiếp với nhau, vậy làm sao chúng cung cấp được khả năng khám phá định tuyến (Routing Discovery)?
- CommitLog, ConsumeQueue và IndexFile lần lượt lưu trữ dữ liệu gì?
- Half Message, Commit, Rollback và cơ chế kiểm tra lại trạng thái giao dịch (Transaction Check-back) trong Transactional Message của RocketMQ phối hợp với nhau ra sao?
- Delayed Message và Scheduled Message phù hợp với những kịch bản nào? Tại sao Consumer vẫn phải kiểm tra trạng thái nghiệp vụ?
- RocketMQ đảm bảo tính tuần tự cho message trong cùng một nhóm nghiệp vụ bằng cách nào?
- Sync Flush, Async Flush, Sync Replication và Async Replication lần lượt ảnh hưởng tới điều gì?
- Khi message bị tồn đọng, tại sao tăng thêm Consumer không phải lúc nào cũng tăng được tốc độ xử lý?

Transactional Message giải quyết sự phối hợp giữa Local Transaction và việc gửi message, chứ không thể làm thay Consumer phần Idempotency và bù trừ. Kết quả mà Broker tra soát ngược lại vẫn là trạng thái Local Transaction của Producer; việc Consumer chạy trùng, hạ nguồn thất bại và đối soát nghiệp vụ vẫn cần xử lý riêng.

## Câu hỏi tần suất cao về RabbitMQ

RabbitMQ tập trung kiểm tra mô hình định tuyến AMQP, cơ chế xác nhận, Dead Letter Queue & Delay Queue, cũng như độ tin cậy của từng loại Queue. Trước tiên phải trình bày rõ mối quan hệ giữa Exchange, Routing Key, Binding và Queue.

![Kiến trúc lõi và vòng đời message của RabbitMQ](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/rabbitmq/rabbitmq-core-architecture-and-message-lifecycle-fc6dd9c3.png)

Nội dung liên quan: [Tổng hợp câu hỏi thường gặp về RabbitMQ](./rabbitmq-questions.md)

Câu hỏi phỏng vấn thường gặp:

- Các loại Exchange `direct`, `fanout`, `topic` và `headers` định tuyến message như thế nào?
- Publisher Confirms xác nhận đến khâu nào? Làm sao phát hiện được khi message không thể định tuyến tới bất kỳ Queue nào?
- Cấu hình bền vững (Durable/Persistent) cho Exchange, Queue và Message có đủ đảm bảo không mất message không?
- Manual ACK, NACK, Requeue, Retry và Dead Letter Queue phối hợp với nhau như thế nào?
- Khi dùng TTL kết hợp Dead Letter Exchange để làm Delayed Message, tại sao có thể xảy ra tắc nghẽn đầu hàng đợi (Head-of-Line Blocking)?
- Classic Queue, Quorum Queue và Stream lần lượt phù hợp với kịch bản nào?
- Triển khai RabbitMQ thành cụm nhiều node có đồng nghĩa message trong Queue đã có bản sao (Replica) không?
- Nên giám sát các chỉ số Ready, Unacked, tuổi của message (Message Age), tốc độ ACK và trạng thái Replica như thế nào?

Publisher Confirm chỉ cho biết Broker đã xử lý yêu cầu publish đó; message có đi vào đúng Queue nghiệp vụ đích hay không vẫn phải xem kết quả định tuyến. Tương tự, xác nhận phía Consumer cũng chỉ thể hiện phía tiêu thụ đã chấp nhận kết quả xử lý; dữ liệu nghiệp vụ trong database có được ghi đúng hay không vẫn cần Transaction, Idempotency và bù trừ đảm bảo.

## Lựa chọn Message Queue và câu hỏi xoáy về dự án

Khi lựa chọn công nghệ, trước hết hãy xác nhận nghiệp vụ cần ngữ nghĩa message nào, rồi xem đội ngũ có kinh nghiệm triển khai và xử lý sự cố tương ứng hay không. Chỉ so sánh throughput đơn node rất khó đưa ra kết luận đáng tin cậy.

Nội dung liên quan:

- [Tổng hợp kiến thức cơ bản về Message Queue](./message-queue.md)
- [Tổng hợp câu hỏi thường gặp về Disruptor](./disruptor-questions.md)

Câu hỏi phỏng vấn thường gặp:

- Kafka, RocketMQ và RabbitMQ khác nhau gì về mô hình message, throughput, độ trễ, khả năng phát lại (Replay) và vận hành?
- Log stream, sự kiện đơn hàng, định tuyến phức tạp và tác vụ trì hoãn lần lượt phù hợp với sản phẩm nào?
- Khi công ty đã vận hành ổn định một loại MQ, trong trường hợp nào mới đáng đưa thêm một sản phẩm MQ khác vào?
- Với Message Queue cần giám sát những chỉ số nào về sản xuất, lưu trữ, tiêu thụ và nghiệp vụ?
- Khi Broker, Consumer hoặc dịch vụ hạ nguồn gặp sự cố, hệ thống giáng cấp và phục hồi ra sao?
- Disruptor khác gì so với các Message Queue phân tán?

Câu hỏi xoáy về dự án thường đi thẳng vào con số cụ thể và cách xử lý sự cố: tốc độ sản xuất lúc cao điểm, độ trễ tiêu thụ (Consumer Lag), số lượng Partition hoặc Queue, thời gian lưu giữ message, số lần Retry tối đa, ngưỡng cảnh báo tồn đọng và quy trình khôi phục sự cố. Với những cấu hình hay sự cố bạn chưa trực tiếp tham gia vận hành, chỉ cần trả lời theo kiến thức đã học, tuyệt đối không bịa đặt số liệu production.

## Lên kế hoạch ôn tập theo quỹ thời gian chuẩn bị

| Thời gian còn lại | Lộ trình gợi ý | Mục tiêu ôn tập |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1~2 ngày | Đọc lướt một lượt [Tổng hợp câu hỏi phỏng vấn thường gặp về Message Queue](https://interview.javaguide.cn/high-performance/message-queue-interview-questions.html), ưu tiên bổ sung độ tin cậy, Idempotency, thứ tự và tồn đọng | Trả lời được các câu hỏi tần suất cao dọc theo vòng đời message |
| 3~7 ngày | Ngoài các câu hỏi chung, tập trung học sâu loại MQ mà dự án thực tế sử dụng, rồi bổ sung định vị và khác biệt chính của hai sản phẩm còn lại | Trả lời được nguyên lý sản phẩm, xử lý ngoại lệ và hỏi xoáy lựa chọn công nghệ |
| Trên 1 tuần | Đọc các bài chuyên đề theo thứ tự của bài viết này, vẽ lại luồng sản xuất, lưu trữ, nhân bản, tiêu thụ, xác nhận và bù trừ, kết hợp dự án để tổng hợp giám sát và khôi phục sự cố | Trình bày xuyên suốt từ yêu cầu nghiệp vụ tới cấu hình, đánh đổi kỹ thuật và vận hành |
