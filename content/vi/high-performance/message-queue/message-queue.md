---
title: "Tổng hợp kiến thức cơ bản về Message Queue"
description: "Bài viết tổng hợp có hệ thống các kiến thức cốt lõi về Message Queue, bao gồm các kịch bản ứng dụng (xử lý bất đồng bộ, tách ghép nối, cắt đỉnh tải), mô hình truyền tin (Point-to-Point và Publish/Subscribe), cách đảm bảo không mất message, tính lũy đẳng (Idempotency), tính tuần tự của message, xử lý tồn đọng message (backlog), cũng như so sánh lựa chọn công nghệ giữa Kafka, RocketMQ và RabbitMQ."
category: Hiệu năng cao (High Performance)
tag:
  - Message Queue
head:
  - - meta
    - name: keywords
      content: Message Queue,MQ,Xử lý bất đồng bộ,Tách ghép nối,Cắt đỉnh tải,Mất message,Tính lũy đẳng,Thứ tự message,Kafka,RocketMQ,RabbitMQ
lang: vi
sourceRef: zh-ref/high-performance/message-queue/message-queue.md
---

::: tip

Khái niệm Message Queue trong bài viết này chủ yếu đề cập đến Message Queue phân tán (Distributed Message Queue).

:::

"RabbitMQ?" "Kafka?" "RocketMQ?"... Trong quá trình học tập và phát triển phần mềm hằng ngày, chúng ta thường xuyên nghe thấy từ khóa Message Queue. Bản thân tôi cũng đã nhắc đến khái niệm này trong nhiều bài viết của mình. Có thể bạn là một kỹ sư dày dạn kinh nghiệm đã sử dụng thành thạo Message Queue, hoặc là người mới chưa hiểu rõ về nó; dù bạn đã biết đến Message Queue hay chưa, bài viết này cũng sẽ giúp bạn nắm vững những lý thuyết nền tảng quan trọng nhất.

Nếu bạn là người có kinh nghiệm, rất có thể bạn sẽ phát hiện thêm những khái niệm quan trọng về Message Queue mà trước đây mình từng bỏ sót. Còn nếu bạn là người mới bắt đầu, tin rằng bài viết này sẽ là viên gạch vững chắc mở ra cánh cửa bước vào thế giới Message Queue.

## Message Queue là gì?

Chúng ta có thể hình dung Message Queue như một vùng chứa (container) dùng để lưu trữ message; khi cần dùng đến message, ta chỉ việc lấy trực tiếp từ vùng chứa đó ra sử dụng. Vì hàng đợi (Queue) là một cấu trúc dữ liệu vào trước ra trước (FIFO), nên khi tiêu thụ (consume) message cũng sẽ xử lý theo đúng thứ tự.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-small-dbd417cd.png)

Hai bên tham gia vào quá trình truyền tải message được gọi là **Producer** (nhà sản xuất) và **Consumer** (người tiêu thụ): Producer chịu trách nhiệm gửi message, còn Consumer chịu trách nhiệm xử lý message.

![Mô hình Publish/Subscribe (Pub/Sub)](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-pub-sub-model-664193cf.png)

Trong hệ điều hành, một cơ chế rất quan trọng để giao tiếp liên tiến trình (IPC) chính là message queue. Khái niệm Message Queue mà chúng ta đề cập ở đây có đôi chút khác biệt: nó chủ yếu phục vụ việc giao tiếp giữa các service cũng như giữa các component/module bên trong hệ thống, và thuộc nhóm phần mềm **Middleware** (phần mềm trung gian).

Wikipedia mô tả về Middleware như sau:

> Middleware là một loại phần mềm máy tính cung cấp kết nối giữa phần mềm hệ thống và phần mềm ứng dụng, giúp các thành phần phần mềm dễ dàng giao tiếp với nhau. Phần mềm ứng dụng có thể thông qua Middleware để chia sẻ thông tin và tài nguyên giữa các kiến trúc kỹ thuật khác nhau. Middleware nằm phía trên hệ điều hành trong mô hình Client-Server và quản lý tài nguyên tính toán cũng như giao tiếp mạng.

Nói một cách đơn giản: **Middleware là phần mềm phục vụ cho phần mềm ứng dụng, còn phần mềm ứng dụng phục vụ cho người dùng cuối; người dùng cuối sẽ không trực tiếp tiếp xúc hay sử dụng Middleware.**

Ngoài Message Queue, các Middleware phổ biến khác còn có RPC Framework, các component phân tán, HTTP Server, framework lập lịch tác vụ (Task Scheduling), Configuration Center, công cụ chia tách database (Sharding) và công cụ di trú dữ liệu (Data Migration)...

Để tìm hiểu chi tiết hơn về Middleware, bạn có thể tham khảo một bài trả lời của đội ngũ kỹ thuật Taobao (Alibaba): <https://www.zhihu.com/question/19730582/answer/1663627873>.

Cùng với sự phát triển của các hệ thống phân tán và Microservices, Message Queue ngày càng có nhiều đất diễn trong thiết kế hệ thống. Sử dụng Message Queue giúp giảm sự phụ thuộc chặt chẽ (coupling) giữa các thành phần, hiện thực hóa tác vụ bất đồng bộ và cắt đỉnh lưu lượng (peak shaving) hiệu quả, trở thành một trong những thành phần cốt lõi của hệ thống phân tán và Microservices.

## Message Queue dùng để làm gì?

Thông thường, việc sử dụng Message Queue mang lại cho hệ thống của chúng ta ba lợi ích chính sau đây:

1. Xử lý bất đồng bộ (Asynchronous Processing)
2. Cắt đỉnh tải / Giới hạn lưu lượng (Peak Shaving / Rate Limiting)
3. Giảm sự phụ thuộc chặt chẽ giữa các hệ thống (Decoupling)

Ngoài ba điểm này, Message Queue còn có các kịch bản ứng dụng khác như triển khai giao dịch phân tán (Distributed Transaction), đảm bảo tính tuần tự (Ordering) và xử lý luồng dữ liệu (Data Stream Processing).

Nếu trong buổi phỏng vấn bạn gặp câu hỏi này, thông thường là do trong CV của bạn có đề cập đến Message Queue; lúc này bạn nên kết hợp trả lời gắn liền với dự án thực tế của bản thân.

### Xử lý bất đồng bộ

![Nâng cao hiệu năng hệ thống thông qua xử lý bất đồng bộ](/media/jg/ext/oss.javaguide.cn/github/javaguide/Asynchronous-message-queue-99767c5f.png)

Đưa các thao tác tốn thời gian trong request của người dùng vào Message Queue để xử lý bất đồng bộ: sau khi gửi message tương ứng vào Message Queue thì trả kết quả ngay lập tức, qua đó giảm thời gian phản hồi và cải thiện trải nghiệm người dùng. Sau đó, hệ thống sẽ tiến hành consume và xử lý message ở nền.

Vì dữ liệu request của người dùng mới chỉ được ghi vào Message Queue là hệ thống đã phản hồi ngay cho người dùng, nên dữ liệu đó vẫn có khả năng thất bại ở các bước kiểm tra nghiệp vụ hoặc ghi vào database về sau. Do vậy, **khi đã dùng Message Queue để xử lý bất đồng bộ, cần điều chỉnh lại luồng nghiệp vụ cho phù hợp**. Chẳng hạn sau khi người dùng đặt đơn hàng và dữ liệu đơn hàng được ghi vào Message Queue, hệ thống không thể lập tức báo rằng đặt hàng thành công; thay vào đó, phải đợi tiến trình Consumer xử lý xong đơn hàng thực sự—thậm chí sau khi xuất kho—rồi mới gửi email hoặc SMS thông báo đặt hàng thành công cho người dùng nhằm tránh tranh chấp giao dịch. Điều này rất giống với trải nghiệm đặt vé tàu hay vé xem phim trên điện thoại hằng ngày của chúng ta.

### Cắt đỉnh tải / Giới hạn lưu lượng

**Trước tiên lưu tạm các message giao dịch phát sinh từ lượng truy cập đồng thời cao trong thời gian ngắn vào Message Queue, sau đó các service backend sẽ từ từ consume và xử lý các message đó theo đúng năng lực của mình, tránh làm sập trực tiếp các service backend.**

Ví dụ: trong các chương trình Flash Sale hay khuyến mãi thương mại điện tử, việc sử dụng Message Queue hợp lý có thể chống đỡ hiệu quả cú sốc khi lượng lớn đơn hàng đổ về cùng lúc ngay thời điểm mở bán. Minh họa như hình dưới đây:

![Cắt đỉnh tải](/media/jg/ext/oss.javaguide.cn/github/javaguide/.png-f7ce8315.png)

### Giảm sự phụ thuộc chặt chẽ giữa các hệ thống

Sử dụng Message Queue còn giúp giảm sự phụ thuộc chặt chẽ (coupling) giữa các hệ thống. Nếu các module không gọi trực tiếp lẫn nhau, thì việc thêm mới hoặc chỉnh sửa một module sẽ ít gây ảnh hưởng đến các module khác, nhờ đó khả năng mở rộng của hệ thống chắc chắn tốt hơn.

Producer (Client) gửi message vào Message Queue, còn Consumer (Server) xử lý message; hệ thống nào cần tiêu thụ dữ liệu chỉ việc lấy message từ Message Queue ra xử lý mà không cần gắn chặt với các hệ thống khác, rõ ràng điều này cũng nâng cao đáng kể khả năng mở rộng của hệ thống.

![Mô hình Publish/Subscribe (Pub/Sub)](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-pub-sub-model-664193cf.png)

**Message Queue hoạt động theo mô hình Publish-Subscribe: bên gửi message (Producer) phát hành message, một hoặc nhiều bên nhận message (Consumer) đăng ký (subscribe) message đó.** Như có thể thấy ở hình trên, **giữa bên gửi message (Producer) và bên nhận message (Consumer) không có sự ghép nối trực tiếp**; bên gửi chỉ cần đẩy message tới Message Queue phân tán là coi như hoàn tất phần việc của mình, còn bên nhận sau khi lấy message từ Message Queue phân tán sẽ tiến hành xử lý tiếp mà không cần biết message đó đến từ đâu. **Đối với các nghiệp vụ mới phát sinh, chỉ cần quan tâm tới loại message nào thì đăng ký nhận loại message đó, hoàn toàn không ảnh hưởng đến hệ thống và nghiệp vụ hiện có, qua đó hiện thực hóa thiết kế có khả năng mở rộng linh hoạt cho hệ thống.**

Ví dụ: hệ thống thương mại điện tử của chúng ta được tách thành nhiều service như User, Order, Finance (tài chính), Warehouse (kho vận), Notification (thông báo), Logistics (giao vận), Risk Control (kiểm soát rủi ro)... Sau khi người dùng hoàn tất đặt đơn hàng, hệ thống cần gọi các service Finance (trừ tiền), Warehouse (quản lý tồn kho), Logistics (giao hàng), Notification (thông báo giao hàng cho khách), Risk Control (đánh giá rủi ro). Sau khi áp dụng Message Queue, thao tác đặt đơn hàng và các bước trừ tiền, giao hàng, gửi thông báo phía sau được tách rời hoàn toàn: đặt đơn xong chỉ cần bắn một message vào Message Queue, nơi nào cần dữ liệu thì tự subscribe message đó để tiêu thụ.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-decouple-mall-example-722dfe40.png)

Ngoài ra, để tránh mất message khi máy chủ Message Queue bị sập, các message đã gửi thành công tới Message Queue có thể được lưu lại trên máy chủ Producer và chỉ xóa đi sau khi thực sự được máy chủ Consumer xử lý xong. Khi một máy chủ Message Queue gặp sự cố, máy chủ Producer sẽ chọn một máy chủ khác trong cụm (cluster) Message Queue phân tán để tiếp tục phát hành message.

**Lưu ý:** Đừng lầm tưởng rằng Message Queue chỉ có thể vận hành theo mô hình Publish-Subscribe; chẳng qua trong bối cảnh tách ghép nối (decoupling) này thì mô hình Publish-Subscribe được sử dụng. Bên cạnh Publish-Subscribe còn có mô hình Point-to-Point (mỗi message chỉ có duy nhất một Consumer), nhưng mô hình Publish-Subscribe thường được dùng phổ biến hơn. Ngoài ra, hai mô hình truyền tin này là do chuẩn JMS định nghĩa, còn giao thức AMQP cung cấp thêm 5 mô hình truyền tin khác.

### Hiện thực hóa giao dịch phân tán (Distributed Transaction)

Một trong các giải pháp cho giao dịch phân tán chính là giao dịch dựa trên MQ (MQ Transaction).

RocketMQ, Kafka, Pulsar và QMQ đều cung cấp các tính năng liên quan đến Transaction. Transaction cho phép các ứng dụng xử lý luồng sự kiện gộp toàn bộ quá trình consume, xử lý và produce message thành một thao tác nguyên tử (atomic).

Để tìm hiểu chi tiết, bạn có thể xem bài viết: [Giải thích chi tiết về giao dịch phân tán (trả phí)](https://javaguide.cn/distributed-system/distributed-transaction.html).

![Giải thích chi tiết giao dịch phân tán - Giao dịch MQ](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/07b338324a7d8894b8aef4b659b76d92-c2aa0805.png)

### Đảm bảo tính tuần tự (Ordering)

Trong nhiều kịch bản ứng dụng, thứ tự xử lý dữ liệu mang tính sống còn. Message Queue giúp đảm bảo dữ liệu được xử lý theo một trình tự xác định, phù hợp với những bài toán có yêu cầu nghiêm ngặt về thứ tự dữ liệu. Đa số các Message Queue như RocketMQ, RabbitMQ, Pulsar, Kafka đều hỗ trợ Ordered Message (message có thứ tự).

### Xử lý trễ / hẹn giờ (Delayed / Scheduled Processing)

Message sau khi gửi đi sẽ không được consume ngay lập tức mà được chỉ định một mốc thời gian hoặc độ trễ, đến đúng thời điểm đó mới được consume. Đa số các Message Queue như RocketMQ, RabbitMQ, Pulsar đều hỗ trợ Scheduled/Delayed Message.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/rocketmq-schedule-message-03057332.png)

### Nhắn tin tức thời (Instant Messaging)

MQTT (Message Queuing Telemetry Transport) là một giao thức truyền thông gọn nhẹ sử dụng mô hình Publish/Subscribe, rất phù hợp cho IoT và các ứng dụng hoạt động trong môi trường băng thông thấp, độ trễ cao hoặc mạng kém ổn định. Giao thức này hỗ trợ truyền tin tức thời và duy trì tính ổn định giao tiếp ngay cả khi điều kiện mạng xấu.

RabbitMQ tích hợp sẵn plugin MQTT để cung cấp tính năng MQTT (mặc định không bật, cần kích hoạt thủ công).

### Xử lý luồng dữ liệu (Data Stream Processing)

Đối với các luồng dữ liệu khổng lồ sinh ra từ hệ thống phân tán như log nghiệp vụ, dữ liệu giám sát (monitoring), hành vi người dùng..., Message Queue có thể thu thập dữ liệu theo thời gian thực hoặc theo lô (batch) rồi đẩy vào các engine xử lý dữ liệu lớn (Big Data) để quản lý và xử lý luồng dữ liệu hiệu quả.

## Dùng Message Queue sẽ nảy sinh những vấn đề gì?

- **Độ sẵn sàng của hệ thống giảm:** Độ sẵn sàng (Availability) của hệ thống ở một mức độ nào đó sẽ bị giảm xuống. Vì sao lại nói vậy? Trước khi đưa MQ vào hệ thống, bạn không phải lo lắng các tình huống như mất message hay MQ bị sập; nhưng sau khi tích hợp MQ, bạn buộc phải tính đến tất cả những rủi ro đó!
- **Độ phức tạp của hệ thống tăng lên:** Sau khi thêm MQ, bạn phải đảm bảo message không bị tiêu thụ lặp lại (duplicate consumption), xử lý kịch bản mất message, đảm bảo thứ tự truyền tải message...
- **Vấn đề nhất quán dữ liệu (Consistency):** Như đã trình bày ở trên, Message Queue giúp xử lý bất đồng bộ và quả thực cải thiện tốc độ phản hồi của hệ thống. Nhưng nhỡ Consumer thực sự không consume thành công message thì sao? Khi đó sẽ dẫn đến tình trạng dữ liệu bị sai lệch, không nhất quán!

Để đánh giá một luồng gọi có phù hợp để đưa MQ vào hay không, hãy xem xét các câu hỏi sau:

- Bên gọi có bắt buộc phải nhận ngay kết quả xử lý từ downstream không? Nếu bắt buộc thì RPC thường phù hợp hơn.
- Nghiệp vụ có chấp nhận được tính nhất quán cuối cùng (Eventual Consistency) không? Nếu không, việc chuyển sang bất đồng bộ sẽ phát sinh chi phí bù trừ (compensation) rất lớn.
- Lưu lượng giờ cao điểm có vượt rõ rệt năng lực xử lý của downstream không? Nếu có, MQ có thể làm lớp đệm và cắt đỉnh tải.
- Khi downstream thất bại có cần thử lại (Retry), bù trừ (Compensation) và can thiệp thủ công không? Nếu có, MQ giúp xây dựng sẵn tuyến khôi phục bền vững.
- Đội ngũ có đủ năng lực vận hành, giám sát và xử lý sự cố MQ không? Nếu chưa, độ phức tạp tăng thêm có thể lớn hơn lợi ích mang lại.

Nói một cách ngắn gọn, MQ phù hợp cho những kịch bản "có thể hoàn thành chậm hơn một chút, nhưng không được mất dữ liệu, phải khôi phục được và cần tách ghép nối", chứ không phải luồng đồng bộ nào cũng chuyển bừa sang bất đồng bộ.

## Làm thế nào để đảm bảo độ tin cậy của message?

Độ tin cậy của message phải được bóc tách theo từng chặng trên toàn tuyến, chứ đừng chỉ nói chung chung là "bật persistence":

1. **Chặng Producer gửi đi**: Bật xác nhận gửi (Send Confirmation), gửi lỗi phải Retry; với nghiệp vụ cốt lõi có thể ghi bảng message cục bộ (Local Message Table) hoặc dùng Transactional Message để tránh tình huống Transaction cục bộ thành công nhưng message chưa gửi được ra ngoài.
2. **Chặng Broker lưu trữ**: Message phải được ghi bền vững ra đĩa (Persistence), các Topic/Queue quan trọng phải cấu hình bản sao (Replica) hoặc Queue độ sẵn sàng cao; chính sách flush đĩa và xác nhận replica phải khớp với mức độ tin cậy yêu cầu của nghiệp vụ.
3. **Chặng Consumer xử lý**: Chỉ gửi ACK hoặc commit offset sau khi nghiệp vụ xử lý thành công; khi xử lý lỗi cần Retry, đưa vào Dead-Letter Queue (DLQ) hoặc đi vào luồng bù trừ.
4. **Chặng dự phòng nghiệp vụ**: Dùng tác vụ đối soát (Reconciliation), tác vụ bù trừ, cảnh báo (Alert) và xử lý thủ công để hứng các ngoại lệ cực đoan.

Chi tiết triển khai của từng MQ khác nhau, nhưng tư duy cốt lõi đều giống nhau: **Xác nhận, Lưu trữ bền vững, Thử lại (Retry), Lũy đẳng (Idempotency) và Bù trừ (Compensation)**.

## Xử lý tiêu thụ trùng lặp và Tính lũy đẳng (Idempotency) như thế nào?

Trong môi trường Production thường rất khó đảm bảo một message chỉ được consume đúng một lần duy nhất. Ngữ nghĩa phổ biến hơn là "gửi ít nhất một lần" (At-least-once Delivery), nghĩa là message có thể bị lặp và Consumer bắt buộc phải xử lý lũy đẳng.

Các phương án đảm bảo Idempotency phổ biến:

- **Unique Index (Chỉ mục duy nhất)**: Dùng mã đơn hàng, mã thanh toán, message ID hoặc các khóa duy nhất nghiệp vụ để chặn ghi trùng.
- **State Machine (Máy trạng thái)**: Chỉ cho phép trạng thái chuyển tiếp theo chiều hợp lệ, ví dụ đơn hàng chỉ có thể chuyển từ "Đã thanh toán" sang "Đã giao hàng".
- **Bảng nhật ký tiêu thụ (Consumption Record Table)**: Ghi nhận trạng thái xử lý của từng message; gặp message lặp thì bỏ qua ngay.
- **Chống trùng bằng Redis**: Phù hợp cho nhu cầu chống trùng trong khoảng thời gian ngắn, nhưng cần lưu ý thời gian hết hạn (TTL) và rủi ro lưu trữ bền vững.

Điểm mấu chốt của Idempotency là phải dùng **khóa duy nhất theo nghiệp vụ**, thay vì phụ thuộc vào message ID do MQ tự sinh. Bởi vì cùng một sự kiện nghiệp vụ khi Retry, bù trừ hoặc gửi lại hoàn toàn có thể sinh ra message ID mới khác nhau.

## Xử lý tồn đọng message (Message Backlog) như thế nào?

Khi xảy ra tồn đọng message, cần xác định nguyên nhân trước rồi mới quyết định có mở rộng (scale) hay không:

- **Lượng sản sinh tăng đột biến**: Sự kiện lớn, chiến dịch khuyến mãi, crawler hoặc lỗi từ upstream khiến tốc độ ghi message tăng vọt.
- **Consumer xử lý chậm**: Slow SQL, API bên ngoài chậm, tranh chấp khóa (Lock Contention), thiếu Thread trong Thread Pool, hoặc kích thước batch xử lý quá nhỏ.
- **Thiếu Partition hoặc Queue**: Dù đã tăng số instance Consumer, nhưng cùng một Queue/Partition vẫn chỉ có thể được xử lý song song bởi một số lượng Consumer giới hạn.
- **Sự cố từ Broker**: Đĩa, mạng, Controller/NameServer hoặc quá trình sao chép cụm gặp vấn đề.

Trình tự xử lý thường là: trước tiên cầm máu và giới hạn lưu lượng (Rate Limiting), tiếp theo mở rộng Consumer và số Partition, sau đó truy tìm đoạn logic tiêu thụ chậm để tối ưu, cuối cùng mới thực hiện xử lý theo lô tạm thời hoặc phát lại (Replay) phần message tồn đọng trong lịch sử. Đừng vừa vào đã nói "tăng thêm Consumer"—nếu số Queue không đủ hoặc logic xử lý bị tuần tự hóa, tăng thêm instance cũng không giúp cải thiện thông lượng (Throughput).

## JMS và AMQP

### JMS là gì?

JMS (Java Message Service) là dịch vụ nhắn tin của Java; các JMS Client có thể truyền tải message bất đồng bộ với nhau thông qua một dịch vụ JMS. **JMS (Java Message Service) API là một chuẩn mực hoặc đặc tả cho dịch vụ nhắn tin**, cho phép các thành phần ứng dụng dựa trên nền tảng Java EE tạo, gửi, nhận và đọc message. Nó giúp giao tiếp phân tán ít phụ thuộc lẫn nhau hơn, đồng thời mang lại tính tin cậy và bất đồng bộ cho dịch vụ truyền tin.

JMS định nghĩa năm định dạng phần thân (body) message và loại message khác nhau, cho phép bạn gửi và nhận dữ liệu dưới nhiều hình thức:

- `StreamMessage`: Luồng dữ liệu gồm các kiểu giá trị nguyên thủy của Java
- `MapMessage`: Một tập hợp các cặp tên-giá trị (name-value)
- `TextMessage`: Một đối tượng `String`
- `ObjectMessage`: Một đối tượng Java đã được tuần tự hóa (`Serialization`)
- `BytesMessage`: Một luồng dữ liệu byte thuần

**ActiveMQ (đã bị loại bỏ/ngưng sử dụng) được triển khai dựa trên đặc tả JMS.**

### Hai mô hình truyền tin của JMS

#### Mô hình Point-to-Point (P2P)

![Mô hình Queue](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-queue-model-a1a548ee.png)

Sử dụng **Queue** làm vật mang giao tiếp message; tuân theo **mô hình Producer-Consumer**, mỗi message chỉ có thể được sử dụng bởi một Consumer duy nhất, và những message chưa được tiêu thụ sẽ nằm lại trong Queue cho đến khi được tiêu thụ hoặc hết hạn (Timeout). Ví dụ: nếu Producer gửi 100 message và có hai Consumer cùng đọc, trong điều kiện thông thường hai Consumer sẽ lấy theo thứ tự gửi và mỗi bên xử lý một nửa (tức là lần lượt người một tin, ta một tin).

#### Mô hình Publish/Subscribe (Pub/Sub)

![Mô hình Publish/Subscribe (Pub/Sub)](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-pub-sub-model-664193cf.png)

Mô hình Publish/Subscribe (Pub/Sub) sử dụng **Topic** làm vật mang giao tiếp message, tương tự như **chế độ phát quảng bá (Broadcast)**; Publisher phát hành một message và message đó thông qua Topic sẽ được truyền đến toàn bộ các Subscriber.

### AMQP là gì?

AMQP, viết tắt của Advanced Message Queuing Protocol, là một giao thức chuẩn ở tầng ứng dụng (**giao thức nhị phân tầng ứng dụng**) nhằm cung cấp dịch vụ truyền tin thống nhất. Đây là một chuẩn mở được thiết kế cho Message-Oriented Middleware và có khả năng tương thích với JMS. Các Client và Message Middleware xây dựng trên giao thức này có thể trao đổi message với nhau mà không bị giới hạn bởi việc phải dùng cùng một sản phẩm hay cùng ngôn ngữ lập trình.

**RabbitMQ được triển khai dựa trên giao thức AMQP.**

### JMS vs AMQP

| Tiêu chí so sánh | JMS | AMQP |
| :---: | :--- | :--- |
| Định nghĩa | Java API | Giao thức (Protocol) |
| Đa ngôn ngữ | Không | Có |
| Đa nền tảng | Không | Có |
| Mô hình message hỗ trợ | Cung cấp hai mô hình message: ① Peer-2-Peer; ② Pub/Sub | Cung cấp năm mô hình message: ① direct exchange; ② fanout exchange; ③ topic exchange; ④ headers exchange; ⑤ system exchange. Về bản chất, bốn loại sau không khác biệt lớn so với mô hình pub/sub của JMS mà chỉ chia nhỏ chi tiết hơn về cơ chế định tuyến |
| Loại message hỗ trợ | Hỗ trợ nhiều loại message như đã đề cập ở trên | `byte[]` (nhị phân) |

**Tổng kết:**

- AMQP định nghĩa giao thức ở tầng truyền dẫn (wire-level protocol) cho message, trong khi JMS định nghĩa một bộ đặc tả API. Trong hệ sinh thái Java, nhiều Client có thể tương tác thông qua JMS mà không cần sửa code ứng dụng, nhưng khả năng hỗ trợ đa nền tảng kém. Ngược lại, AMQP mang sẵn đặc tính đa nền tảng và đa ngôn ngữ.
- JMS hỗ trợ các loại message phức tạp như `TextMessage`, `MapMessage`, còn AMQP chỉ hỗ trợ loại message `byte[]` (các kiểu phức tạp có thể `Serialization` rồi gửi đi).
- Nhờ thuật toán định tuyến do Exchange cung cấp, AMQP hỗ trợ nhiều cách định tuyến đa dạng để chuyển message tới các hàng đợi, trong khi JMS chỉ hỗ trợ hai phương thức là Queue và Topic/Subscription.

## Điểm khác biệt giữa RPC và Message Queue

RPC và Message Queue đều là những thành phần quan trọng trong hệ thống Microservices phân tán. Dưới đây là so sánh ngắn gọn giữa hai cơ chế này:

- **Xét về mục đích sử dụng**: RPC chủ yếu giải quyết bài toán giao tiếp từ xa giữa hai service mà không cần bận tâm đến cơ chế truyền thông mạng bên dưới. Nhờ RPC, ta có thể gọi một phương thức của service trên máy từ xa đơn giản như gọi hàm cục bộ. Trong khi đó, Message Queue chủ yếu dùng để giảm sự phụ thuộc chặt chẽ giữa các hệ thống, hiện thực hóa tác vụ bất đồng bộ và cắt đỉnh lưu lượng hiệu quả.
- **Xét về phương thức giao tiếp**: RPC là giao tiếp mạng trực tiếp hai chiều, còn Message Queue là giao tiếp mạng một chiều thông qua một vật mang trung gian.
- **Xét về kiến trúc**: Message Queue cần lưu trữ lại message, trong khi RPC không có yêu cầu này vì như đã nói, RPC là giao tiếp mạng trực tiếp hai chiều.
- **Xét về tính tức thời khi xử lý request**: Lời gọi phát đi qua RPC thường được xử lý ngay lập tức, còn message nằm trong Message Queue không nhất thiết được xử lý ngay.

RPC và Message Queue về bản chất là hai cơ chế triển khai giao tiếp mạng khác nhau phục vụ cho những mục đích khác nhau, tuyệt đối không thể đánh đồng hai khái niệm này.

## Lựa chọn công nghệ Message Queue phân tán

### Những Message Queue phổ biến hiện nay

#### Kafka

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/kafka-logo-93ada41c.png)

Kafka là một nền tảng xử lý luồng phân tán (Distributed Streaming Platform) do LinkedIn mã nguồn mở và đã trở thành dự án cấp cao nhất (Top-Level Project) của Apache. Ban đầu Kafka được dùng để xử lý lượng log khổng lồ, về sau phát triển dần thành một Message Queue hiệu năng cao với đầy đủ tính năng.

Một nền tảng xử lý luồng có ba chức năng cốt lõi:

1. **Message Queue**: Phát hành và đăng ký luồng message, tính năng này tương đồng với Message Queue và cũng là lý do Kafka thường được xếp vào nhóm Message Queue.
2. **Lưu trữ luồng bản ghi bền vững và chịu lỗi**: Kafka ghi bền vững message xuống đĩa, giúp phòng tránh hiệu quả nguy cơ mất message.
3. **Nền tảng xử lý luồng**: Xử lý dữ liệu ngay khi message được phát hành; Kafka cung cấp đầy đủ thư viện phục vụ Stream Processing.

Kafka là một hệ thống phân tán bao gồm các Server và Client giao tiếp thông qua giao thức mạng TCP hiệu năng cao, có thể triển khai trên phần cứng vật lý (bare-metal), máy ảo (VM) và container cả ở môi trường on-premises lẫn trên cloud.

Trước phiên bản Kafka 2.8, điểm bị phàn nàn nhiều nhất của Kafka là sự phụ thuộc nặng nề vào ZooKeeper để quản lý metadata và đảm bảo độ sẵn sàng cao của cụm. Từ Kafka 2.8 trở đi, chế độ KRaft dựa trên giao thức Raft đã được giới thiệu, không còn phụ thuộc vào ZooKeeper nữa, giúp đơn giản hóa mạnh mẽ kiến trúc Kafka và cho phép vận hành Kafka theo cách gọn nhẹ hơn.

Tuy nhiên, cần lưu ý một điểm: việc di trú các cụm cũ từ chế độ ZooKeeper sang chế độ KRaft bắt buộc phải thực hiện theo đúng quy trình chuyển đổi chính thức, không thể chỉ sửa file cấu hình rồi khởi động lại. Với các cụm mới, nên ưu tiên triển khai theo chế độ khuyến nghị hiện hành của tài liệu chính thức.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/kafka3.3.1-kraft-production-ready-6ca66de2.png)

Trang chủ chính thức của Kafka: <http://kafka.apache.org/>

Lịch sử cập nhật Kafka (có thể theo dõi trực quan dự án còn được duy trì tích cực hay không): <https://kafka.apache.org/downloads>

#### RocketMQ

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/rocketmq-logo-7cef8492.png)

RocketMQ là nền tảng xử lý dữ liệu thời gian thực cloud-native cho "Message, Event, Stream" do Alibaba mã nguồn mở, có tham khảo thiết kế của Kafka và đã trở thành dự án cấp cao nhất của Apache.

Các đặc tính cốt lõi của RocketMQ (trích từ trang chủ RocketMQ):

- Cloud-native: Sinh ra từ cloud, lớn lên cùng cloud, co giãn đàn hồi không giới hạn, thân thiện với Kubernetes.
- Thông lượng cao: Đảm bảo thông lượng cấp nghìn tỷ, đáp ứng đồng thời các kịch bản Microservices và Big Data.
- Xử lý luồng: Cung cấp engine tính toán luồng gọn nhẹ, khả năng mở rộng cao, hiệu năng cao và giàu tính năng.
- Chuẩn tài chính: Độ ổn định cấp độ tài chính, được sử dụng rộng rãi trong các tuyến giao dịch lõi.
- Kiến trúc tối giản: Không phụ thuộc bên ngoài (zero external dependency), kiến trúc Shared-nothing.
- Thân thiện hệ sinh thái: Kết nối mượt mà với Microservices, tính toán thời gian thực, Data Lake và các hệ sinh thái xung quanh.

Theo giới thiệu từ trang chủ chính thức:

> Kể từ khi ra đời, Apache RocketMQ đã được đông đảo lập trình viên doanh nghiệp và các nhà cung cấp dịch vụ đám mây tin dùng nhờ kiến trúc đơn giản, tính năng nghiệp vụ phong phú và khả năng mở rộng cực mạnh. Trải qua hơn mười năm tôi luyện trong các kịch bản quy mô lớn, RocketMQ đã trở thành lựa chọn hàng đầu được giới chuyên môn đồng thuận cho bài toán nghiệp vụ cần độ tin cậy cấp tài chính, được ứng dụng rộng rãi trong internet, dữ liệu lớn, internet di động, IoT và nhiều lĩnh vực khác.

Trang chủ chính thức của RocketMQ: <https://rocketmq.apache.org/> (Tài liệu rất chi tiết, rất đáng đọc)

Lịch sử cập nhật RocketMQ (có thể theo dõi trực quan dự án còn được duy trì tích cực hay không): <https://github.com/apache/rocketmq/releases>

#### RabbitMQ

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/rabbitmq-logo-dd5d3861.png)

RabbitMQ là Message Middleware được viết bằng ngôn ngữ Erlang nhằm hiện thực hóa giao thức AMQP (Advanced Message Queuing Protocol); ban đầu nó ra đời trong các hệ thống tài chính để lưu trữ và chuyển tiếp message giữa các hệ thống phân tán.

Phát triển đến ngày nay, RabbitMQ ngày càng được nhiều người đón nhận nhờ những thể hiện xuất sắc về tính dễ sử dụng, khả năng mở rộng, độ tin cậy và độ sẵn sàng cao. Các đặc điểm cụ thể của RabbitMQ có thể tóm gọn như sau:

- **Độ tin cậy:** RabbitMQ sử dụng các cơ chế như lưu trữ bền vững (Persistence), xác nhận truyền tải (Delivery Acknowledgment) và xác nhận phát hành (Publisher Confirms) để bảo đảm độ tin cậy của message.
- **Định tuyến linh hoạt:** Trước khi đi vào Queue, message được định tuyến thông qua Exchange. Với các nhu cầu định tuyến điển hình, RabbitMQ đã cung cấp sẵn các loại Exchange tích hợp. Đối với kịch bản định tuyến phức tạp hơn, có thể kết hợp nhiều Exchange với nhau hoặc viết thêm Exchange tùy chỉnh thông qua cơ chế plugin. Phần này sẽ được giới thiệu chi tiết hơn khi nói về các khái niệm cốt lõi của RabbitMQ ở phía sau.
- **Khả năng mở rộng:** Nhiều node RabbitMQ có thể ghép thành một cụm (Cluster), đồng thời có thể mở rộng thêm node linh hoạt theo nhu cầu nghiệp vụ thực tế.
- **Độ sẵn sàng cao:** Trong RabbitMQ 4.x, Classic Queue không còn đạt độ sẵn sàng cao thông qua Mirrored Queue (hàng đợi phản chiếu) nữa; ở các kịch bản đòi hỏi độ tin cậy cao nên ưu tiên Quorum Queue hoặc Streams.
- **Hỗ trợ đa giao thức:** Bên cạnh hỗ trợ gốc giao thức AMQP, RabbitMQ còn hỗ trợ nhiều giao thức Message Middleware khác như STOMP, MQTT...
- **Client đa ngôn ngữ:** RabbitMQ hỗ trợ gần như toàn bộ các ngôn ngữ lập trình phổ biến như Java, Python, Ruby, PHP, C#, JavaScript...
- **Giao diện quản trị dễ dùng:** RabbitMQ cung cấp giao diện người dùng thân thiện giúp giám sát và quản lý message, các node trong cụm... Khi cài đặt RabbitMQ, giao diện quản trị này đã được tích hợp sẵn.
- **Cơ chế plugin:** RabbitMQ cung cấp nhiều plugin để mở rộng theo nhiều hướng khác nhau, và dĩ nhiên bạn cũng có thể tự viết plugin cho riêng mình. Cảm giác cơ chế này khá giống với cơ chế SPI của Dubbo.

Trang chủ chính thức của RabbitMQ: <https://www.rabbitmq.com/>.

Lịch sử cập nhật RabbitMQ (có thể theo dõi trực quan dự án còn được duy trì tích cực hay không): <https://www.rabbitmq.com/news.html>

#### Pulsar

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/pulsar-logo-3469f9d4.png)

Pulsar là nền tảng luồng message phân tán cloud-native thế hệ mới, ban đầu do Yahoo phát triển và hiện đã trở thành dự án cấp cao nhất của Apache.

Pulsar tích hợp truyền tin, lưu trữ và tính toán hàm gọn nhẹ (lightweight functional computing) vào làm một, áp dụng thiết kế tách biệt giữa tính toán và lưu trữ, hỗ trợ đa thuê bao (Multi-tenancy), lưu trữ bền vững và sao chép dữ liệu liên vùng giữa nhiều trung tâm dữ liệu; sở hữu các đặc tính lưu trữ dữ liệu luồng như nhất quán mạnh, thông lượng cao, độ trễ thấp và khả năng mở rộng cao, được xem là một trong những giải pháp tối ưu cho truyền tải, lưu trữ và tính toán luồng dữ liệu thời gian thực trong kỷ nguyên cloud-native.

Các đặc tính then chốt của Pulsar (trích từ trang chủ chính thức):

- Là nền tảng luồng message phân tán cloud-native thế hệ mới.
- Một instance Pulsar đơn lẻ hỗ trợ gốc nhiều cụm (Multi-cluster), có thể sao chép message mượt mà giữa các cụm liên trung tâm dữ liệu.
- Độ trễ phát hành và độ trễ đầu-cuối (end-to-end latency) cực thấp.
- Có thể mở rộng mượt mà vượt mốc một triệu Topic.
- API Client đơn giản, hỗ trợ Java, Go, Python và C++.
- Đa dạng chế độ đăng ký (Subscription) cho Topic (Exclusive, Shared và Failover).
- Đảm bảo truyền tải message thông qua cơ chế lưu trữ bền vững do Apache BookKeeper cung cấp.
- Hiện thực hóa xử lý dữ liệu thuần luồng nhờ framework tính toán Serverless gọn nhẹ Pulsar Functions.
- Framework kết nối Serverless Pulsar IO xây dựng trên Pulsar Functions giúp đưa dữ liệu vào và ra khỏi Apache Pulsar dễ dàng hơn.
- Lưu trữ phân tầng (Tiered Storage) cho phép tự động đẩy dữ liệu cũ từ tầng lưu trữ nóng sang tầng lưu trữ lạnh/dài hạn (như S3, GCS).

Trang chủ chính thức của Pulsar: <https://pulsar.apache.org/>

Lịch sử cập nhật Pulsar (có thể theo dõi trực quan dự án còn được duy trì tích cực hay không): <https://github.com/apache/pulsar/releases>

#### ActiveMQ

Hiện đã bị loại bỏ, không khuyến nghị sử dụng và không khuyến khích đầu tư học tập.

### Nên lựa chọn như thế nào?

> Tham khảo *Luyện thi phỏng vấn kỹ sư Java mùa 1 — Thầy Zhonghua Shishan*

| Tiêu chí so sánh | Tổng quan |
| --- | --- |
| Thông lượng (Throughput) | Thông lượng ở mức hàng vạn của ActiveMQ và RabbitMQ (ActiveMQ có hiệu năng kém nhất) thấp hơn một bậc độ lớn so với mức hàng chục vạn thậm chí hàng triệu của RocketMQ và Kafka. |
| Độ sẵn sàng (Availability) | Đều có thể đạt độ sẵn sàng cao. ActiveMQ và RabbitMQ dựa trên kiến trúc Master-Slave để đảm bảo độ sẵn sàng cao. RocketMQ dựa trên kiến trúc phân tán. Kafka cũng mang tính phân tán: một dữ liệu có nhiều bản sao (Replica), vài máy gặp sự cố sẽ không làm mất dữ liệu hay gây gián đoạn dịch vụ. |
| Tính tức thời / Độ trễ | RabbitMQ được phát triển trên Erlang nên năng lực xử lý đồng thời rất mạnh, hiệu năng cực tốt, độ trễ rất thấp đạt tới cấp micro giây, trong khi các hệ thống còn lại ở mức mili giây (ms). |
| Hỗ trợ tính năng | Pulsar có tính năng toàn diện hơn, hỗ trợ đa thuê bao, nhiều chế độ tiêu thụ và nhiều chế độ lưu trữ bền vững, là nền tảng luồng message phân tán cloud-native thế hệ mới. |
| Mất message | Xác suất mất message của ActiveMQ và RabbitMQ rất thấp, còn Kafka, RocketMQ và Pulsar về mặt lý thuyết có thể đạt tới mức không mất tin nào (0 loss). |

**Tổng kết:**

- Cộng đồng của ActiveMQ khá chín muồi, nhưng xét ở thời điểm hiện tại, hiệu năng của ActiveMQ khá kém và tốc độ ra phiên bản mới rất chậm; nó đã lỗi thời và không còn được khuyến nghị sử dụng.
- Tuy RabbitMQ có phần lép vế nhẹ về thông lượng so với Kafka, RocketMQ và Pulsar, nhưng nhờ xây dựng trên nền tảng Erlang nên khả năng xử lý đồng thời cực mạnh, hiệu năng rất cao và độ trễ thấp tới cấp micro giây. Tuy nhiên cũng chính vì RabbitMQ viết bằng Erlang nên rất ít doanh nghiệp có đủ năng lực nghiên cứu hoặc tùy biến sâu ở mức mã nguồn Erlang. Nếu kịch bản nghiệp vụ của bạn không đòi hỏi mức đồng thời quá khủng (hàng trăm nghìn hay hàng triệu message/giây), thì trong số các Message Queue này, RabbitMQ rất có thể là lựa chọn ưu tiên hàng đầu.
- RocketMQ và Pulsar hỗ trợ tính nhất quán mạnh, phù hợp cho các kịch bản đòi hỏi cao về tính nhất quán dữ liệu của message.
- RocketMQ do Alibaba phát triển thuộc hệ sinh thái mã nguồn mở Java; ta có thể trực tiếp đọc mã nguồn và tùy biến thành MQ riêng cho doanh nghiệp, đồng thời RocketMQ đã được kiểm chứng thực chiến qua các kịch bản nghiệp vụ khổng lồ của Alibaba.
- Đặc điểm của Kafka rất rõ ràng: nó chỉ tập trung cung cấp một số tính năng cốt lõi nhưng mang lại thông lượng siêu cao, độ trễ ở mức mili giây, độ sẵn sàng và độ tin cậy cực cao, cùng khả năng mở rộng phân tán gần như không giới hạn. Đồng thời Kafka hoạt động tối ưu khi phục vụ số lượng Topic vừa phải để giữ trọn mức thông lượng siêu cao của mình. Nhược điểm đáng kể duy nhất của Kafka là có khả năng tiêu thụ trùng lặp message, gây ảnh hưởng cực kỳ nhỏ đến độ chính xác dữ liệu; trong lĩnh vực Big Data và thu thập log, sai số nhỏ này hoàn toàn có thể bỏ qua. Đặc tính này giúp Kafka sinh ra đã phù hợp tự nhiên cho tính toán thời gian thực Big Data và thu thập log. Nếu bài toán thuộc mảng xử lý thời gian thực dữ liệu lớn hay thu thập log, dùng Kafka là tiêu chuẩn ngành, hoàn toàn yên tâm với cộng đồng cực kỳ sôi động—chắc chắn không lo "chết yểu" và gần như là chuẩn mực mặc định trên toàn thế giới trong lĩnh vực này.

Khi chọn công nghệ thực tế, bạn có thể đối chiếu trực diện hơn theo bảng sau:

| Kịch bản | Lựa chọn phổ biến hơn | Điểm cần chú trọng |
| --- | --- | --- |
| Log, tracking sự kiện, xử lý luồng (Stream) | Kafka, Pulsar | Thông lượng, mở rộng Partition, hệ sinh thái |
| Giao dịch, đơn hàng, sự kiện nghiệp vụ | RocketMQ | Transactional Message, Delayed Message, Ordered Message |
| Định tuyến linh hoạt, tích hợp đơn giản | RabbitMQ | Định tuyến Exchange, cơ chế xác nhận, loại Queue |
| Luồng sự kiện hiệu năng cao trong nội bộ tiến trình | Disruptor | Độ trễ thấp, Lock-free, không phân tán |

Không có MQ nào là tốt nhất tuyệt đối, chỉ có MQ phù hợp nhất với đội ngũ hiện tại, ngữ nghĩa nghiệp vụ và năng lực vận hành của bạn.

## Tài liệu tham khảo

- *Kiến trúc kỹ thuật website quy mô lớn* (*Large-Scale Website Technical Architecture*)
- KRaft: Apache Kafka Without ZooKeeper: <https://developer.confluent.io/learn/kraft/>
- Các kịch bản sử dụng Message Queue là gì?: <https://mp.weixin.qq.com/s/4V1jI6RylJr7Jr9JsQe73A>
