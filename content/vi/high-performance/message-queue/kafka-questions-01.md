---
title: Tổng hợp câu hỏi phỏng vấn Kafka thường gặp
description: "Bài viết tổng hợp các câu hỏi phỏng vấn và kiến thức cốt lõi thường gặp về Kafka, bao gồm kiến trúc Kafka (Broker/Topic/Partition/Consumer Group), nguyên lý hiệu năng cao (Zero-Copy/Ghi tuần tự/Xử lý theo lô), độ tin cậy của message (cơ chế ACK/ISR replica), tính tuần tự của message, cơ chế Rebalance, so sánh Kafka và RocketMQ, giúp bạn ôn tập và phỏng vấn Kafka hiệu quả."
category: Hiệu năng cao (High Performance)
tag:
  - Message Queue
head:
  - - meta
    - name: keywords
      content: Kafka,Message Queue,Kafka Partition,Kafka Replica,ISR,Consumer Group,Rebalance,Zero-Copy,Phỏng vấn Kafka
lang: vi
sourceRef: zh-ref/high-performance/message-queue/kafka-questions-01.md
---

## Kiến thức cơ bản về Kafka

### Kafka là gì? Các kịch bản ứng dụng chính là gì?

Kafka là một nền tảng xử lý luồng phân tán (Distributed Streaming Platform). Điều này thực chất có nghĩa là gì?

Một nền tảng xử lý luồng có ba chức năng cốt lõi:

1. **Message Queue**: Phát hành (publish) và đăng ký (subscribe) luồng message — chức năng này tương tự Message Queue, đó cũng là lý do Kafka thường được xếp vào nhóm Message Queue.
2. **Lưu trữ bền vững, chịu lỗi (fault-tolerant) cho luồng bản ghi message**: Kafka ghi bền vững message xuống ổ đĩa, giúp tránh hiệu quả nguy cơ mất message.
3. **Nền tảng xử lý luồng (Stream Processing Platform)**: Xử lý ngay khi message được phát hành; Kafka cung cấp một thư viện xử lý luồng hoàn chỉnh.

Kafka có hai kịch bản ứng dụng chính:

1. **Message Queue**: Xây dựng đường ống dữ liệu luồng thời gian thực (real-time streaming data pipeline) để luân chuyển dữ liệu tin cậy giữa các hệ thống hoặc ứng dụng.
2. **Xử lý dữ liệu**: Xây dựng các ứng dụng xử lý luồng thời gian thực để chuyển đổi hoặc xử lý các luồng dữ liệu.

### So với các Message Queue khác, Kafka có ưu điểm gì?

Ngày nay, mỗi khi nhắc đến Kafka, người ta mặc định xem nó là một Message Queue rất xuất sắc và thường xuyên đem so sánh với RocketMQ hay RabbitMQ. Theo mình, những ưu điểm chính của Kafka so với các Message Queue khác gồm:

1. **Hiệu năng cực cao**: Được phát triển trên Scala và Java, thiết kế sử dụng triệt để tư duy xử lý theo lô (batch processing) và bất đồng bộ (asynchronous), ở mức đỉnh có thể xử lý hàng chục triệu message mỗi giây.
2. **Khả năng tương thích hệ sinh thái vô đối**: Mức độ tương thích của Kafka với các hệ sinh thái xung quanh là tốt nhất không có đối thủ, đặc biệt trong lĩnh vực Big Data và tính toán luồng (Stream Computing).

Thực tế ở giai đoạn đầu, Kafka chưa phải là một Message Queue đạt chuẩn — Kafka thuở sơ khai trong giới Message Queue giống như một "đứa trẻ ăn mặc rách rưới" vậy, tính năng chưa hoàn thiện và tồn tại một số vấn đề nhỏ như mất message, không đảm bảo độ tin cậy của message, v.v. Tất nhiên điều này cũng liên quan mật thiết đến việc LinkedIn ban đầu phát triển Kafka để xử lý lượng log khổng lồ — haha, vốn dĩ ngay từ đầu người ta đâu có định làm Message Queue, ai ngờ sau này lại vô tình chiếm luôn một vị thế quan trọng trong mảng Message Queue.

Qua quá trình phát triển về sau, các nhược điểm này đã được Kafka từng bước khắc phục và hoàn thiện. Vì vậy, **nhận định "Kafka làm Message Queue không đáng tin cậy" đã lỗi thời rồi!**

### Bạn có nắm được Queue Model không? Bạn có biết mô hình message của Kafka không?

> Bên lề một chút: Trước đây JMS và AMQP là các chuẩn do những tổ chức uy tín trong lĩnh vực dịch vụ nhắn tin xây dựng, mình từng giới thiệu trong bài viết [《Message Queue thực chất rất đơn giản》](https://github.com/Snailclimb/JavaGuide#%E6%95%B0%E6%8D%AE%E9%80%9A%E4%BF%A1%E4%B8%AD%E9%97%B4%E4%BB%B6) của [JavaGuide](https://github.com/Snailclimb/JavaGuide). Tuy nhiên, tốc độ tiến hóa của các chuẩn này không theo kịp tốc độ phát triển của Message Queue nên thực tế chúng đã rơi vào trạng thái lỗi thời/bị loại bỏ. Do đó, tình huống phổ biến là mỗi Message Queue lại có một mô hình message riêng.

#### Queue Model: Mô hình message đời đầu

![Mô hình Queue](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/23-109f70ce.png)

**Sử dụng hàng đợi (`Queue`) làm phương tiện truyền tải message, đáp ứng mô hình Producer - Consumer: một message chỉ có thể được sử dụng bởi một Consumer duy nhất; các message chưa được tiêu thụ sẽ lưu lại trong Queue cho đến khi được tiêu thụ hoặc hết hạn (timeout).** Ví dụ: nếu Producer gửi 100 message và có 2 Consumer cùng tiêu thụ, thông thường hai Consumer sẽ tiêu thụ theo đúng thứ tự gửi, mỗi bên một nửa (tức là kiểu một cái cho bạn, một cái cho mình).

**Vấn đề tồn tại của Queue Model:**

Giả sử chúng ta gặp kịch bản: cần phân phối message do Producer tạo ra tới nhiều Consumer, đồng thời mỗi Consumer đều phải nhận được trọn vẹn toàn bộ nội dung message.

Trong trường hợp này, Queue Model xử lý rất bất tiện. Nhiều bạn hay cãi cố sẽ nói: ta có thể tạo một Queue riêng cho từng Consumer rồi để Producer gửi nhiều bản sao. Đây là một cách làm rất dở — vừa lãng phí tài nguyên, vừa đi ngược lại mục đích sử dụng Message Queue.

#### Mô hình Publish-Subscribe: Mô hình message của Kafka

Mô hình Publish-Subscribe ra đời chủ yếu để giải quyết vấn đề tồn tại của Queue Model.

![Mô hình Publish-Subscribe](/media/jg/ext/oss.javaguide.cn/java-guide-blog/.png-4648478c.png)

Mô hình Publish-Subscribe (`Pub-Sub`) sử dụng **Topic (chủ đề)** làm phương tiện truyền tải message, tương tự **chế độ phát quảng bá (broadcast)**; Publisher phát hành một message, message đó sẽ đi qua Topic để truyền tới tất cả các Subscriber, **còn những người dùng đăng ký sau thời điểm một message đã được broadcast thì sẽ không nhận được message đó.**

**Trong mô hình Publish-Subscribe, nếu chỉ có một Subscriber duy nhất thì về cơ bản nó giống hệt Queue Model. Do đó, xét ở tầng chức năng, mô hình Publish-Subscribe hoàn toàn có thể tương thích với Queue Model.**

**Kafka sử dụng chính mô hình Publish-Subscribe.**

> **Mô hình message của RocketMQ gần như giống hệt Kafka. Điểm khác biệt duy nhất là Kafka không có khái niệm Queue, mà khái niệm tương ứng với nó là Partition (phân vùng).**

## Các khái niệm cốt lõi của Kafka

### Producer, Consumer, Broker, Topic và Partition là gì?

Kafka gửi các message do Producer phát hành vào **Topic (chủ đề)**, còn các Consumer cần những message này có thể đăng ký (subscribe) các **Topic** đó, như minh họa dưới đây:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/message-queue20210507200944439-3f714d95.png)

Hình trên cũng giới thiệu cho chúng ta một số khái niệm quan trọng của Kafka:

1. **Producer (nhà sản xuất)**: Bên tạo ra và gửi message.
2. **Consumer (người tiêu thụ)**: Bên nhận và tiêu thụ message.
3. **Broker**: Có thể xem như một instance Kafka độc lập. Nhiều Kafka Broker hợp thành một Kafka Cluster.

Đồng thời, chắc hẳn bạn cũng thấy trong mỗi Broker còn chứa hai khái niệm quan trọng là Topic và Partition:

- **Topic (chủ đề)**: Producer gửi message vào một Topic cụ thể, Consumer đăng ký một Topic cụ thể để tiêu thụ message.
- **Partition (phân vùng)**: Partition là một phần của Topic. Một Topic có thể có nhiều Partition, và các Partition thuộc cùng một Topic có thể được phân bố trên nhiều Broker khác nhau — điều đó cho thấy một Topic có thể trải dài trên nhiều Broker, đúng như sơ đồ mình đã vẽ ở trên.

> Điểm nhấn quan trọng: **Partition trong Kafka thực chất có thể xem tương ứng với khái niệm Queue trong các Message Queue truyền thống. Hiểu như vậy có thấy dễ nắm bắt hơn hẳn không?**

### Bạn có biết cơ chế Multi-Replica của Kafka không? Nó mang lại lợi ích gì?

Một điểm nữa mình thấy rất quan trọng là Kafka đưa vào cơ chế đa bản sao (`Replica`) cho Partition. Trong số nhiều bản sao của một Partition, sẽ có một bản sao gọi là **leader**, các bản sao còn lại gọi là **follower**. Message chúng ta gửi đi sẽ được gửi tới leader replica, sau đó các follower replica mới kéo (pull) message từ leader replica về để đồng bộ.

> Producer và Consumer chỉ tương tác với leader replica. Bạn có thể hiểu các replica khác chỉ là bản sao của leader replica, sự tồn tại của chúng chỉ nhằm đảm bảo an toàn lưu trữ message. Khi leader replica gặp sự cố, một leader mới sẽ được bầu chọn từ các follower; tuy nhiên những follower nào có mức độ đồng bộ với leader không đạt yêu cầu thì không thể tham gia tranh cử leader.

**Cơ chế nhiều Partition và nhiều Replica của Kafka mang lại lợi ích gì?**

1. Việc Kafka chỉ định nhiều Partition cho một Topic và phân bố các Partition này trên nhiều Broker khác nhau giúp mang lại khả năng xử lý đồng thời (concurrency) rất tốt (cân bằng tải — Load Balancing).
2. Partition có thể cấu hình số lượng `Replica` tương ứng, giúp nâng cao đáng kể độ an toàn lưu trữ message và khả năng chịu lỗi/khắc phục thảm họa, tuy nhiên cũng làm tăng dung lượng lưu trữ cần thiết tương ứng.

## ZooKeeper và Kafka

### Vai trò của ZooKeeper trong Kafka là gì?

> Để hiểu thấu đáo vai trò của ZooKeeper trong Kafka, nhất định bạn phải tự dựng một môi trường Kafka rồi tự truy cập vào ZooKeeper để xem có những thư mục nào liên quan đến Kafka và mỗi node lưu thông tin gì. Tuyệt đối đừng chỉ đọc lý thuyết mà không thực hành, học kiểu đó rồi cũng sẽ quên! Phần nội dung này có tham khảo và học hỏi từ bài viết: <https://www.jianshu.com/p/a036405f989c>.

Hình dưới đây là ZooKeeper trên máy local của mình sau khi kết nối thành công với Kafka local (cấu trúc thư mục bên dưới được xem bằng plugin ZooKeeper tool trên IDEA).

![Thông tin các node liên quan đến Kafka trong ZooKeeper](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/zookeeper-kafka-cb4e2468.jpg)

ZooKeeper chủ yếu cung cấp chức năng quản lý metadata cho Kafka.

Từ hình minh họa, chúng ta có thể thấy ZooKeeper làm những việc chính sau đây cho Kafka:

1. **Đăng ký Broker (Broker Registration)**: Trên ZooKeeper có một node chuyên **dùng để ghi danh sách các máy chủ Broker**. Mỗi Broker khi khởi động đều sẽ đăng ký lên ZooKeeper bằng cách tạo node riêng của mình dưới `/brokers/ids`. Mỗi Broker sẽ ghi địa chỉ IP, port và các thông tin khác vào node đó.
2. **Đăng ký Topic (Topic Registration)**: Trong Kafka, message của cùng một **Topic sẽ được chia thành nhiều Partition** phân tán trên nhiều Broker; **thông tin các Partition này cùng mối quan hệ ánh xạ với Broker** cũng đều do ZooKeeper quản lý. Ví dụ nếu mình tạo một Topic tên `my-topic` có 2 Partition, tương ứng trên ZooKeeper sẽ tạo ra các thư mục: `/brokers/topics/my-topic/Partitions/0` và `/brokers/topics/my-topic/Partitions/1`.
3. **Cân bằng tải (Load Balancing)**: Như đã nói ở trên, việc cấu hình nhiều Partition cho một Topic và phân bố chúng trên các Broker khác nhau giúp tạo ra năng lực xử lý đồng thời tốt. Đối với các Partition khác nhau của cùng một Topic, Kafka cố gắng phân bố chúng lên các Broker server khác nhau. Khi Producer tạo message cũng sẽ cố gắng đẩy vào các Partition ở các Broker khác nhau. Khi Consumer tiêu thụ, ZooKeeper có thể căn cứ vào số lượng Partition hiện tại và số lượng Consumer để thực hiện cân bằng tải động (dynamic load balancing).
4. ...

### Có thể dùng Kafka mà không cần ZooKeeper không?

Trước phiên bản Kafka 2.8, điểm bị phàn nàn nhiều nhất ở Kafka chính là sự phụ thuộc nặng nề vào ZooKeeper. Kafka 2.8 đã giới thiệu chế độ KRaft dựa trên giao thức Raft, nhưng khi đó vẫn ở mức Early Access; từ Kafka 3.3.x trở đi, KRaft đã được đánh dấu sẵn sàng cho môi trường production (production-ready) đối với các cluster mới; từ Kafka 4.0 trở đi, chế độ ZooKeeper đã bị loại bỏ hoàn toàn và Kafka chỉ còn hỗ trợ chế độ KRaft.

Tuy nhiên cần lưu ý: các cluster cũ khi chuyển đổi từ chế độ ZooKeeper sang chế độ KRaft bắt buộc phải thực hiện theo quy trình migration chính thức, không thể chỉ sửa file cấu hình rồi khởi động lại. Với các cluster mới, nên ưu tiên triển khai theo chế độ được tài liệu chính thức khuyến nghị hiện tại.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/kafka3.3.1-kraft-production-ready-6ca66de2.png)

## Thứ tự tiêu thụ, mất message và tiêu thụ trùng lặp trong Kafka

### Kafka đảm bảo thứ tự tiêu thụ message như thế nào?

Trong quá trình sử dụng Message Queue, chúng ta thường xuyên gặp các kịch bản nghiệp vụ đòi hỏi đảm bảo chặt chẽ thứ tự tiêu thụ message. Ví dụ, chúng ta gửi đồng thời 2 message mà mỗi message tương ứng với một thao tác database:

1. Thay đổi hạng thành viên (membership tier) của người dùng.
2. Tính giá đơn hàng dựa trên hạng thành viên.

Nếu thứ tự tiêu thụ của hai message này bị đảo ngược thì kết quả cuối cùng sẽ sai lệch hoàn toàn.

Chúng ta biết rằng `Partition` trong Kafka mới là nơi thực sự lưu trữ message — mọi message gửi đi đều được đặt vào đây. Trong khi đó, `Partition` nằm trong khái niệm `Topic`, và ta có thể cấu hình nhiều `Partition` cho một `Topic` cụ thể.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/KafkaTopicPartionsLayout-b39911ea.png)

Mỗi khi thêm message vào Partition, Kafka đều ghi nối tiếp vào cuối (append-only), như minh họa ở trên. **Kafka chỉ có thể đảm bảo thứ tự message bên trong từng Partition.**

> Mỗi message khi được ghi nối tiếp vào Partition đều được gán một offset xác định. Kafka sử dụng offset để đảm bảo tính tuần tự của message trong phạm vi một Partition.

Vì thế, có một cách rất đơn giản để đảm bảo thứ tự tiêu thụ message: **1 Topic chỉ tương ứng với 1 Partition duy nhất**. Cách này tất nhiên giải quyết được vấn đề, nhưng lại phá vỡ mục đích thiết kế ban đầu của Kafka.

Khi gửi 1 message trong Kafka, bạn có thể truyền 4 tham số: `topic`, `partition`, `key`, `data`. Nếu khi gửi bạn chỉ định cụ thể `Partition`, toàn bộ message sẽ được gửi vào đúng Partition đó. Hơn nữa, các message có cùng `key` được đảm bảo chỉ đi vào cùng một `partition` — ta có thể dùng ID của bảng/đối tượng làm `key`.

Tóm lại, để đảm bảo thứ tự tiêu thụ message trong Kafka, chúng ta có hai cách sau:

1. 1 Topic chỉ có 1 Partition.
2. (Khuyến nghị) Chỉ định `key` hoặc `Partition` khi gửi message.

Tất nhiên không chỉ có hai cách trên, nhưng hai cách này theo mình là dễ hiểu nhất.

Khi tiêu thụ theo thứ tự, cần chú ý thêm hai giới hạn biên:

- **Chỉ đảm bảo tuần tự trong cùng một Partition**: nhiều Partition vốn chạy song song với nhau, không đảm bảo thứ tự toàn cục (global ordering).
- **Retry khi thất bại có thể làm xáo trộn hiệu ứng nghiệp vụ**: nếu một message xử lý thất bại trong khi các message phía sau đã được xử lý xong, tầng nghiệp vụ vẫn cần State Machine hoặc số phiên bản (version number) làm lớp bảo vệ cuối cùng.

Vì vậy, trong môi trường production thường kết hợp đồng thời: "cùng business key đi vào cùng Partition + tiêu thụ tuần tự trong một Partition + kiểm tra Idempotency / State Machine ở phía Consumer".

### Kafka đảm bảo không bị mất message như thế nào?

#### Trường hợp mất message ở phía Producer

Sau khi Producer gọi phương thức `send` để gửi message, message có thể chưa được gửi sang Broker do sự cố mạng.

Do đó, ta không thể mặc định rằng cứ gọi phương thức `send` là message đã gửi thành công. Để xác định chắc chắn message gửi thành công hay chưa, cần kiểm tra kết quả gửi. Tuy nhiên cần lưu ý rằng phương thức `send` của Kafka Producer thực chất là thao tác bất đồng bộ (asynchronous); ta có thể gọi `get()` để lấy kết quả, nhưng làm vậy sẽ biến nó thành thao tác đồng bộ (synchronous), ví dụ như sau:

> **Code chi tiết xem tại bài viết của mình: [Kafka Series Phần 3! Học cách sử dụng Kafka làm Message Queue trong Spring Boot chỉ trong 10 phút?](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486269&idx=2&sn=ec00417ad641dd8c3d145d74cafa09ce&chksm=cea244f6f9d5cde0c8eb233fcc4cf82e11acd06446719a7af55230649863a3ddd95f78d111de&token=1633957262&lang=zh_CN#rd)**

```java
SendResult<String, Object> sendResult = kafkaTemplate.send(topic, o).get();
if (sendResult.getRecordMetadata() != null) {
  logger.info("生产者成功发送消息到" + sendResult.getProducerRecord().topic() + "-> " + sendRe
              sult.getProducerRecord().value().toString());
}
```

Nhưng thông thường không khuyến khích làm theo cách đồng bộ này! Bạn có thể gắn hàm callback cho nó, ví dụ code như sau:

```java
        ListenableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, o);
        future.addCallback(result -> logger.info("生产者成功发送消息到topic:{} partition:{}的消息", result.getRecordMetadata().topic(), result.getRecordMetadata().partition()),
                ex -> logger.error("生产者发送消失败，原因：{}", ex.getMessage()));
```

Nếu gửi message thất bại, ta kiểm tra nguyên nhân lỗi rồi gửi lại là được!

Ngoài ra, nên cấu hình tham số `retries` (số lần thử lại) cho Producer ở một giá trị hợp lý — thường là 3, nhưng để chống mất message thì thường đặt lớn hơn một chút. Sau khi thiết lập, khi gặp sự cố mạng, Producer có thể tự động retry gửi lại message nhằm tránh mất dữ liệu. Bên cạnh đó, cũng nên cấu hình khoảng thời gian giãn cách giữa các lần retry (retry backoff), vì nếu khoảng cách quá nhỏ thì retry không có nhiều tác dụng: chỉ một nhịp chập chờn mạng là 3 lần retry đã chạy hết ngay lập tức.

#### Trường hợp mất message ở phía Consumer

Ta biết rằng mỗi message khi ghi nối tiếp vào Partition đều được gán một offset xác định. Offset biểu thị vị trí hiện tại trong Partition mà Consumer đang tiêu thụ tới. Kafka dùng offset để đảm bảo tính tuần tự của message trong Partition.

![kafka offset](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/kafka-offset-c3444a1d.jpg)

Khi Consumer kéo được một message từ Partition, mặc định Consumer sẽ tự động commit offset. Việc tự động commit này tồn tại một vấn đề: thử tưởng tượng khi Consumer vừa nhận được message và chuẩn bị thực hiện xử lý nghiệp vụ thì đột ngột bị sập (crash); thực tế message chưa hề được xử lý xong nhưng offset thì đã bị tự động commit rồi.

**Cách khắc phục khá đơn giản và dứt khoát: tắt chế độ tự động commit offset, mỗi lần chỉ tự tay commit offset sau khi đã xử lý xong hoàn toàn message.** Tuy nhiên, những bạn tinh ý chắc chắn sẽ nhận ra cách này lại kéo theo vấn đề message bị tiêu thụ lặp lại (duplicate consumption). Ví dụ bạn vừa xử lý xong message, chưa kịp commit offset thì Consumer bị sập, khi đó về mặt lý thuyết message này sẽ bị tiêu thụ hai lần.

#### Trường hợp bản thân Kafka làm mất message

Ta biết Kafka đưa vào cơ chế đa bản sao (`Replica`) cho Partition. Trong các replica của một Partition có một `leader`, các bản sao còn lại là `follower`. Message gửi đi sẽ được đẩy vào leader replica, rồi follower replica mới kéo message từ leader replica để đồng bộ. Producer và Consumer chỉ tương tác với leader replica; các replica khác chỉ là bản sao của leader replica nhằm đảm bảo an toàn lưu trữ.

**Hãy thử nghĩ một tình huống: giả sử Broker chứa leader replica đột ngột sập, khi đó hệ thống phải bầu chọn một leader mới từ các follower replica; nhưng nếu trên leader cũ vẫn còn dữ liệu chưa kịp đồng bộ sang các follower replica thì sẽ xảy ra mất message.**

**Cấu hình `acks = all`**

Cách giải quyết là cấu hình **`acks = all`**. `acks` là một tham số cực kỳ quan trọng của Kafka Producer.

Giá trị mặc định của `acks` là `1`, nghĩa là chỉ cần message được leader replica tiếp nhận thì coi như gửi thành công. Khi ta cấu hình **`acks = all`**, nghĩa là chỉ khi toàn bộ các replica trong danh sách ISR đều đã nhận được message thì Producer mới nhận được phản hồi thành công từ server. Đây là chế độ ở mức độ cao nhất và an toàn nhất, đảm bảo có nhiều hơn một Broker đã nhận được message, nhưng độ trễ (latency) của chế độ này sẽ cao hơn.

**Cấu hình `replication.factor >= 3`**

Để đảm bảo leader replica luôn có follower replica đồng bộ message, thông thường ta cấu hình **`replication.factor >= 3`** cho Topic. Như vậy mỗi Partition sẽ có ít nhất 3 replica. Dù gây dư thừa dữ liệu (tốn thêm ổ đĩa), nhưng đổi lại là sự an toàn dữ liệu.

**Cấu hình `min.insync.replicas > 1`**

Thông thường ta cũng cần cấu hình **`min.insync.replicas > 1`**, nghĩa là message phải được ghi vào ít nhất 2 replica mới được tính là gửi thành công. Giá trị mặc định của **`min.insync.replicas`** là `1`, trong thực tế production nên cố gắng tránh dùng giá trị mặc định `1` này.

Tuy nhiên, để đảm bảo tính sẵn sàng cao (High Availability) cho toàn bộ dịch vụ Kafka, bạn cần đảm bảo **`replication.factor > min.insync.replicas`**. Tại sao vậy? Thử đặt trường hợp hai giá trị này bằng nhau: chỉ cần một replica bị sập là cả Partition đó không thể hoạt động ghi được nữa, điều này rõ ràng vi phạm tính sẵn sàng cao! Thông thường nên thiết lập **`replication.factor = min.insync.replicas + 1`**.

**Cấu hình `unclean.leader.election.enable = false`**

> **Từ phiên bản Kafka 0.11.0.0 trở đi, giá trị mặc định của tham số `unclean.leader.election.enable` đã được đổi từ `true` sang `false`.**

Như đã nói ở trên, message được gửi tới leader replica rồi follower replica kéo về đồng bộ. Mức độ đồng bộ giữa các follower replica là khác nhau; khi ta cấu hình **`unclean.leader.election.enable = false`**, nếu leader replica gặp sự cố, Kafka sẽ không bầu chọn những follower có mức độ đồng bộ chưa theo kịp leader lên làm leader mới, qua đó giảm thiểu khả năng mất message.

Trong môi trường production, cũng nên đồng thời chú ý các cấu hình ở phía Producer:

- Bật Idempotent Producer (`enable.idempotence`) để tránh việc Producer retry gây ghi trùng lặp vào cùng một Partition.
- Cấu hình hợp lý `delivery.timeout.ms`, `request.timeout.ms` và `linger.ms` để cân bằng giữa độ tin cậy, độ trễ và thông lượng (throughput).
- Với các message nghiệp vụ quan trọng, ghi log gửi lỗi hoặc dùng bảng message cục bộ (local message table) để thuận tiện bù dữ liệu (compensation) về sau.

Độ tin cậy của Kafka không do một tham số đơn lẻ nào quyết định, mà được quyết định đồng thời bởi Topic replica, ISR, Producer ACK, thời điểm commit offset của Consumer và tính lũy đẳng (Idempotency) ở tầng nghiệp vụ.

### Kafka đảm bảo không tiêu thụ trùng lặp message như thế nào?

**Nguyên nhân khiến Kafka xảy ra tiêu thụ trùng lặp message:**

- Phía dịch vụ đã xử lý xong dữ liệu nhưng chưa commit được offset thành công (nguyên nhân gốc rễ).
- Phía Kafka nhận thấy Consumer xử lý nghiệp vụ quá lâu hoặc do vấn đề kết nối mạng khiến Kafka tưởng dịch vụ đã chết giả, dẫn đến kích hoạt Partition Rebalance.

**Giải pháp:**

- Dịch vụ tiêu thụ message thực hiện kiểm tra Idempotency, ví dụ dùng các cơ chế vốn có tính lũy đẳng tự nhiên như `SET` của Redis hoặc khóa chính (Primary Key) trong MySQL. Đây là cách hiệu quả nhất.
- Đặt tham số **`enable.auto.commit`** thành `false` để tắt tự động commit, lập trình viên tự commit offset trong code. Lúc này sẽ nảy sinh một câu hỏi: **Commit offset vào thời điểm nào là hợp lý?**
  - Xử lý xong message rồi mới commit: vẫn có nguy cơ tiêu thụ trùng lặp, giống như auto-commit.
  - Kéo (poll) được message là commit ngay: sẽ có nguy cơ mất message. Các kịch bản cho phép trễ dữ liệu thường áp dụng cách này, sau đó chạy các tác vụ định kỳ (scheduled job) vào lúc hệ thống rảnh (ví dụ rạng sáng) để rà soát và bù dữ liệu (reconciliation).

## Rebalance có rủi ro gì? Làm sao giảm thiểu ảnh hưởng?

Khi số lượng Consumer trong Consumer Group thay đổi, Topic đăng ký thay đổi, hoặc một Consumer quá lâu không gửi heartbeat, đều có thể kích hoạt Rebalance. Trong thời gian diễn ra Rebalance, các Partition sẽ được phân bổ lại, một số Consumer sẽ tạm dừng tiêu thụ; trường hợp nghiêm trọng có thể gây giật lag tiêu thụ (consumption jitter) và tiêu thụ trùng lặp.

Các hướng tối ưu thường gặp:

- Kiểm soát việc bật/tắt (lên xuống) các instance Consumer quá thường xuyên; khi deploy nên triển khai cuốn chiếu (rolling update) và chia đợt (batch).
- Cấu hình hợp lý `max.poll.interval.ms`, tránh việc một lô message xử lý quá lâu khiến Consumer bị đá khỏi Group.
- Giới hạn số lượng message kéo về trong một lần `poll`, tránh kéo quá nhiều khiến thời gian xử lý vượt quá khoảng thời gian heartbeat hoặc `poll` interval.
- Sử dụng Static Membership (thành viên tĩnh) hoặc chiến lược phân bổ Partition mượt mà hơn để giảm các lần di chuyển Partition không cần thiết.
- Phía Consumer bắt buộc phải đảm bảo Idempotency, vì trước và sau Rebalance vẫn có thể phát sinh trùng lặp ở khoảng giữa lúc commit offset và xử lý nghiệp vụ.

Khi đi phỏng vấn, nếu được hỏi về Rebalance, đừng chỉ trả lời "Consumer phân bổ lại Partition". Điều quan trọng hơn là trình bày rõ nó gây ra khoảng dừng tạm thời và rủi ro tiêu thụ trùng lặp, cũng như cách giảm thiểu tác động thông qua cấu hình tham số, chiến lược phát hành và thiết kế Idempotency.

## Cơ chế Retry của Kafka

Ở phần Kafka đảm bảo không mất message phía trên, chúng ta đã nhắc tới cơ chế retry của Kafka. Vì nội dung này khá quan trọng nên chúng ta sẽ đi sâu tìm hiểu chi tiết tại đây.

Trên mạng có rất nhiều bài viết về cơ chế retry mặc định của Spring Kafka, nhưng đa số đã lỗi thời và hoàn toàn khác với kết quả chạy thực tế. Dưới đây là phần tổng hợp lại dựa trên mã nguồn của [spring-kafka-2.9.3](https://mvnrepository.com/artifact/org.springframework.kafka/spring-kafka/2.9.3).

### Khi tiêu thụ thất bại thì điều gì xảy ra?

Trong quá trình tiêu thụ, khi một message bị lỗi (exception) lúc xử lý, liệu nó có làm tắc nghẽn việc tiêu thụ các message phía sau trong hàng đợi không? Nếu vậy chẳng phải luồng nghiệp vụ sẽ bị kẹt cứng sao?

Code phía Producer:

```Java
 for (int i = 0; i < 10; i++) {
   kafkaTemplate.send(KafkaConst.TEST_TOPIC, String.valueOf(i))
 }
```

Code phía Consumer:

```Java
   @KafkaListener(topics = {KafkaConst.TEST_TOPIC},groupId = "apple")
   private void customer(String message) throws InterruptedException {
       log.info("kafka customer:{}",message);
       Integer n = Integer.parseInt(message);
       if (n%5==0){
           throw new  RuntimeException();
       }
   }
```

Với cấu hình mặc định, khi tiêu thụ gặp ngoại lệ sẽ thực hiện retry; sau nhiều lần retry vẫn lỗi thì sẽ bỏ qua (skip) message hiện tại và tiếp tục tiêu thụ các message tiếp theo, chứ không bị kẹt mãi ở message hiện tại. Dưới đây là một đoạn log tiêu thụ cho thấy sau khi `test-0@95` retry nhiều lần, nó đã được bỏ qua:

```Java
2023-08-10 12:03:32.918 DEBUG 9700 --- [ntainer#0-0-C-1] o.s.kafka.listener.DefaultErrorHandler   : Skipping seek of: test-0@95
2023-08-10 12:03:32.918 TRACE 9700 --- [ntainer#0-0-C-1] o.s.kafka.listener.DefaultErrorHandler   : Seeking: test-0 to: 96
2023-08-10 12:03:32.918  INFO 9700 --- [ntainer#0-0-C-1] o.a.k.clients.consumer.KafkaConsumer     : [Consumer clientId=consumer-apple-1, groupId=apple] Seeking to offset 96 for partition test-0

```

Do đó, ngay cả khi một message gặp lỗi trong lúc tiêu thụ, Kafka Consumer vẫn có thể tiếp tục tiêu thụ các message tiếp theo mà không bị tắc mãi tại message đó, đảm bảo nghiệp vụ vận hành bình thường.

### Mặc định sẽ retry bao nhiêu lần?

Với cấu hình mặc định, khi tiêu thụ lỗi hệ thống sẽ retry — vậy số lần retry là bao nhiêu và có khoảng thời gian chờ giữa các lần retry không?

Xem trong mã nguồn lớp `FailedRecordTracker` có phương thức `recovered` trả về giá trị `boolean` để quyết định có tiếp tục retry hay không; dưới đây là logic kiểm tra retry trong hàm này:

```java
	@Override
	public boolean recovered(ConsumerRecord<?, ?> record, Exception exception,
	    @Nullable MessageListenerContainer container,
	    @Nullable Consumer<?, ?> consumer) throws InterruptedException {

	    if (this.noRetries) {
         // Không hỗ trợ retry
	        attemptRecovery(record, exception, null, consumer);
	        return true;
	    }
     // Lấy tập hợp các bản ghi tiêu thụ đã thất bại
	    Map < TopicPartition, FailedRecord > map = this.failures.get();
	    if (map == null) {
	        this.failures.set(new HashMap < > ());
	        map = this.failures.get();
	    }
     // Lấy Topic và Partition của bản ghi tiêu thụ
	    TopicPartition topicPartition = new TopicPartition(record.topic(), record.partition());
	    FailedRecord failedRecord = getFailedRecordInstance(record, exception, map, topicPartition);
     // Thông báo cho các retry listener đã đăng ký rằng gửi message thất bại
	    this.retryListeners.forEach(rl - >
	        rl.failedDelivery(record, exception, failedRecord.getDeliveryAttempts().get()));
	    // Lấy khoảng thời gian chờ cho lần retry tiếp theo
    long nextBackOff = failedRecord.getBackOffExecution().nextBackOff();
	    if (nextBackOff != BackOffExecution.STOP) {
	        this.backOffHandler.onNextBackOff(container, exception, nextBackOff);
	        return false;
	    } else {
	        attemptRecovery(record, exception, topicPartition, consumer);
	        map.remove(topicPartition);
	        if (map.isEmpty()) {
	            this.failures.remove();
	        }
	        return true;
	    }
	}
```

Trong đó, giá trị của `BackOffExecution.STOP` là `-1`.

```java
@FunctionalInterface
public interface BackOffExecution {

	long STOP = -1;
	long nextBackOff();

}
```

Giá trị `nextBackOff` gọi phương thức `nextBackOff()` của lớp `BackOff`. Nếu số lần thực thi hiện tại lớn hơn số lần thực thi tối đa thì trả về `STOP`, tức là chỉ khi vượt quá số lần thực thi tối đa này mới dừng retry.

```Java
public long nextBackOff() {
  this.currentAttempts++;
  if (this.currentAttempts <= getMaxAttempts()) {
    return getInterval();
  }
  else {
    return STOP;
  }
}
```

Vậy giá trị của `getMaxAttempts` này là bao nhiêu? Quay lại bước đầu tiên, khi xử lý gặp lỗi luồng sẽ đi vào `DefaultErrorHandler`. Constructor mặc định của `DefaultErrorHandler` là:

```Java
public DefaultErrorHandler() {
  this(null, SeekUtils.DEFAULT_BACK_OFF);
}
```

`SeekUtils.DEFAULT_BACK_OFF` được định nghĩa như sau:

```Java
public static final int DEFAULT_MAX_FAILURES = 10;

public static final FixedBackOff DEFAULT_BACK_OFF = new FixedBackOff(0, DEFAULT_MAX_FAILURES - 1);
```

Giá trị của `DEFAULT_MAX_FAILURES` là `10`, `currentAttempts` chạy từ `0` đến `9`, nên tổng cộng sẽ thực thi `10` lần, với khoảng thời gian chờ giữa mỗi lần retry là `0`.

Cuối cùng tóm tắt ngắn gọn: theo cấu hình mặc định, Kafka Consumer sẽ thực hiện tối đa 10 lần thử lại, mỗi lần cách nhau 0 ms — tức là retry ngay lập tức. Nếu sau 10 lần vẫn không tiêu thụ thành công message, hệ thống sẽ không retry nữa và message được xem là tiêu thụ thất bại.

### Làm sao tùy chỉnh số lần retry và khoảng thời gian chờ?

Từ đoạn code trên có thể thấy số lần retry và khoảng thời gian chờ của bộ xử lý lỗi mặc định được điều khiển bởi `FixedBackOff` — đây là giá trị mặc định khi khởi tạo `DefaultErrorHandler`. Do đó để tùy chỉnh số lần retry và thời gian giãn cách, bạn chỉ cần truyền một `FixedBackOff` tùy chỉnh khi khởi tạo `DefaultErrorHandler`. Khai báo lại bean `KafkaListenerContainerFactory` rồi gọi `setCommonErrorHandler` để thiết lập bộ xử lý lỗi mới là được.

```Java
@Bean
public KafkaListenerContainerFactory kafkaListenerContainerFactory(ConsumerFactory<String, String> consumerFactory) {
    ConcurrentKafkaListenerContainerFactory factory = new ConcurrentKafkaListenerContainerFactory();
    // Tùy chỉnh khoảng thời gian chờ và số lần retry
    FixedBackOff fixedBackOff = new FixedBackOff(1000, 5);
    factory.setCommonErrorHandler(new DefaultErrorHandler(fixedBackOff));
    factory.setConsumerFactory(consumerFactory);
    return factory;
}
```

### Làm sao cảnh báo sau khi retry thất bại?

Logic tùy chỉnh sau khi retry thất bại cần được lập trình viên tự cài đặt. Dưới đây là một ví dụ đơn giản ghi đè (override) phương thức `handleRemaining` của `DefaultErrorHandler` để bổ sung thao tác cảnh báo tùy chỉnh:

```Java
@Slf4j
public class DelErrorHandler extends DefaultErrorHandler {

    public DelErrorHandler(FixedBackOff backOff) {
        super(null,backOff);
    }

    @Override
    public void handleRemaining(Exception thrownException, List<ConsumerRecord<?, ?>> records, Consumer<?, ?> consumer, MessageListenerContainer container) {
        super.handleRemaining(thrownException, records, consumer, container);
        log.info("重试多次失败");
        // Thao tác tùy chỉnh
    }
}
```

`DefaultErrorHandler` chỉ là một bộ xử lý lỗi mặc định; Spring Kafka còn cung cấp interface `CommonErrorHandler`. Tự triển khai `CommonErrorHandler` mang lại độ linh hoạt rất cao cho nhiều thao tác tùy biến. Ví dụ: căn cứ theo từng loại lỗi khác nhau để áp dụng logic retry và xử lý nghiệp vụ khác nhau.

### Làm sao xử lý lại dữ liệu sau khi retry thất bại?

Khi đạt tới số lần retry tối đa, dữ liệu sẽ bị bỏ qua trực tiếp và Consumer tiếp tục đọc các message tiếp theo. Sau khi đã sửa xong lỗi trong code, làm sao để tiêu thụ lại những dữ liệu đã retry thất bại đó?

**Dead Letter Queue (hàng đợi thư chết, viết tắt DLQ)** là một hàng đợi đặc biệt trong Message Middleware. Nó chủ yếu dùng để xử lý các message không thể được Consumer xử lý đúng — thường do sai định dạng message, xử lý thất bại, quá thời gian tiêu thụ (timeout), v.v. khiến message rơi vào trạng thái bị "loại bỏ" hoặc "chết". Khi message đi vào hàng đợi, Consumer sẽ thử xử lý nó. Nếu xử lý thất bại hoặc vượt quá một số lần retry nhất định mà vẫn không thành công, message có thể được chuyển vào Dead Letter Queue thay vì bị vứt bỏ vĩnh viễn. Trong Dead Letter Queue, ta có thể tiếp tục phân tích và xử lý các message lỗi này để xác định nguyên nhân sự cố, sửa lỗi và áp dụng biện pháp xử lý phù hợp.

`@RetryableTopic` là một annotation trong Spring Kafka dùng để cấu hình một Topic hỗ trợ retry message; đây là cách được khuyến nghị hơn để triển khai retry.

```Java
// Retry 5 lần, khoảng thời gian chờ 100 ms, tối đa 1 giây
@RetryableTopic(
        attempts = "5",
        backoff = @Backoff(delay = 100, maxDelay = 1000)
)
@KafkaListener(topics = {KafkaConst.TEST_TOPIC}, groupId = "apple")
private void customer(String message) {
    log.info("kafka customer:{}", message);
    Integer n = Integer.parseInt(message);
    if (n % 5 == 0) {
        throw new RuntimeException();
    }
    System.out.println(n);
}
```

Khi đã chạm số lần retry tối đa mà vẫn không thể xử lý thành công message, message sẽ được gửi vào Dead Letter Queue tương ứng. Để xử lý dữ liệu trong Dead Letter Queue, bạn có thể dùng `@DltHandler` hoặc dùng `@KafkaListener` để tiêu thụ lại.

## Tài liệu tham khảo

- Tài liệu chính thức Kafka: <https://kafka.apache.org/documentation/>
- GeekTime — *Kafka Core Technology and Practice*, Bài 11: Cách triển khai cấu hình không mất message?
