---
title: Làm thế nào để triển khai Delayed Task (tác vụ trễ) dựa trên Redis?
description: Phân tích chi tiết hai giải pháp triển khai delayed task dựa trên Redis gồm lắng nghe sự kiện hết hạn và hàng đợi trễ Redisson, đánh giá ưu nhược điểm, độ tin cậy và kịch bản áp dụng.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis delayed task,delayed queue,hàng đợi trễ,lắng nghe sự kiện hết hạn,Redisson DelayedQueue,timeout đơn hàng,scheduled task
lang: vi
sourceRef: zh-ref/database/redis/redis-delayed-task.md
---

Để triển khai chức năng Delayed Task (tác vụ trễ / hẹn giờ) dựa trên Redis, thông thường chỉ xoay quanh hai phương án sau:

1. Lắng nghe sự kiện hết hạn (expired events) trong Redis
2. Hàng đợi trễ tích hợp sẵn của Redisson (`RDelayedQueue`)

Khi đi phỏng vấn, bạn có thể chủ động trả lời rằng mình đã từng cân nhắc cả hai phương án này, nhưng nhận thấy phương án lắng nghe sự kiện hết hạn của Redis tồn tại rất nhiều hạn chế cố hữu, vì vậy cuối cùng bạn đã lựa chọn phương án `DelayedQueue` tích hợp sẵn của Redisson.

Lúc này người phỏng vấn rất có thể sẽ hỏi sâu hơn về các vấn đề liên quan. Dưới đây là các câu hỏi chi tiết để bạn chuẩn bị trước thật kỹ lưỡng.

Ngoài ra, bên cạnh các câu hỏi được giới thiệu bên dưới, bạn cũng nên ôn tập lại toàn bộ các câu hỏi thường gặp về Redis, vì không loại trừ khả năng người phỏng vấn sẽ mở rộng sang các chủ đề Redis khác.

### Nguyên lý triển khai chức năng delayed task bằng cách lắng nghe sự kiện hết hạn trong Redis là gì?

Redis 2.0 đã giới thiệu tính năng Publish/Subscribe (pub/sub - xuất bản/đăng ký). Trong mô hình pub/sub có một khái niệm gọi là **channel (kênh)**, khá tương đồng với khái niệm **topic (chủ đề)** trong các hệ thống message queue.

Mô hình pub/sub bao gồm hai vai trò: publisher (bên phát hành) và subscriber (bên đăng ký nhận tin, còn gọi là consumer):

- Publisher dùng lệnh `PUBLISH` để bắn message vào một channel chỉ định.
- Subscriber dùng lệnh `SUBSCRIBE` để đăng ký theo dõi channel mà nó quan tâm. Hơn nữa, một subscriber có thể đăng ký một hoặc nhiều channel cùng lúc.

![Tính năng Publish/Subscribe (pub/sub) của Redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-pub-sub-a9065911.png)

Trong mô hình pub/sub, producer cần chỉ định rõ message sẽ gửi vào channel nào, còn consumer sẽ đăng ký đúng channel đó để nhận dữ liệu.

Redis có nhiều channel mặc định được chính hệ thống Redis tự động bắn message vào chứ không phải do code ứng dụng của chúng ta gửi. Trong đó, `__keyevent@0__:expired` là một channel mặc định chịu trách nhiệm lắng nghe các sự kiện hết hạn của key. Nói cách khác, khi một key bị hết hạn (expired), Redis sẽ tự động phát một sự kiện hết hạn key vào channel có tên `__keyevent@<db>__:expired`.

Chúng ta chỉ cần cho ứng dụng lắng nghe channel này là có thể bắt được thông điệp về key vừa hết hạn, từ đó kích hoạt xử lý logic trễ tương ứng.

Tính năng này được tài liệu chính thức của Redis gọi là **keyspace notifications**, có tác dụng giám sát theo thời gian thực những thay đổi về key và value trong Redis.

### Việc dùng cơ chế lắng nghe sự kiện hết hạn trong Redis để triển khai delayed task có những nhược điểm gì?

**1. Tính kịp thời kém (Poor Timeliness)**

Một đoạn trích trong tài liệu chính thức của Redis đã giải thích rõ lý do vì sao tính kịp thời của phương án này lại kém (đường dẫn: <https://redis.io/docs/manual/keyspace-notifications/#timing-of-expired-events>):

![Sự kiện hết hạn của Redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-timing-of-expired-events-5dfb5ee7.png)

Cốt lõi của đoạn tài liệu này là: **Thông điệp sự kiện hết hạn chỉ được Redis server phát đi khi nó thực sự thực hiện thao tác xóa key, chứ KHÔNG PHẢI ngay thời điểm key chạm mốc thời gian hết hạn.**

Chúng ta đều biết Redis áp dụng hai chiến lược xóa dữ liệu hết hạn phổ biến:

1. **Xóa lười biếng (Lazy Deletion)**: Chỉ khi có truy vấn đọc/ghi tác động vào key thì hệ thống mới kiểm tra xem key đã hết hạn hay chưa để xóa. Cách này tối ưu nhất cho CPU, nhưng có thể khiến rất nhiều key đã hết hạn nằm tồn đọng lâu trong bộ nhớ mà không bao giờ bị xóa nếu không ai đụng tới.
2. **Xóa định kỳ (Periodic Deletion)**: Định kỳ theo chu kỳ thời gian nhất định, Redis sẽ trích xuất ngẫu nhiên một tập hợp key để kiểm tra và xóa các key đã hết hạn. Đồng thời, tầng đáy của Redis sẽ giới hạn thời gian thực thi và tần suất xóa để không làm nghẽn CPU.

Xóa định kỳ thân thiện với bộ nhớ hơn, còn xóa lười biếng lại thân thiện với CPU hơn. Cả hai đều có ưu nhược điểm riêng, do đó Redis kết hợp cả hai: **xóa định kỳ + xóa lười biếng**.

Vì vậy, hoàn toàn có khả năng bạn đã cấu hình thời gian hết hạn cho một key, nhưng đến đúng mốc thời gian đó key vẫn chưa thực sự bị xóa, kéo theo việc sự kiện hết hạn chưa được phát đi, gây trễ hẹn giờ.

**2. Dễ mất thông điệp (Message Loss)**

Message trong mô hình pub/sub của Redis không hỗ trợ lưu trữ bền vững (persistence), điều này hoàn toàn khác biệt so với các message queue chuyên dụng. Trong pub/sub của Redis, publisher gửi message vào channel chỉ định, subscriber lắng nghe để nhận. Khi không có subscriber nào đang kết nối, message sẽ bị hủy bỏ ngay lập tức và hoàn toàn không được lưu trữ lại trong Redis.

**3. Vấn đề tiêu thụ trùng lặp khi chạy nhiều instance dịch vụ**

Mô hình pub/sub của Redis hiện tại chỉ hỗ trợ chế độ broadcast (phát thanh). Điều này có nghĩa là khi producer gửi một message vào channel, tất cả các subscriber đăng ký channel đó đều sẽ nhận được bản sao của message.

Trong kiến trúc microservice triển khai nhiều instance, tất cả các instance đều sẽ nhận được cùng một thông báo hết hạn. Khi đó chúng ta phải xử lý thêm bài toán chống trùng lặp (deduplication) hoặc phân tán lock, làm gia tăng đáng kể khối lượng code và độ phức tạp vận hành.

### Nguyên lý của hàng đợi trễ trong Redisson là gì? Nó có những ưu điểm nào?

Redisson là một thư viện Redis client mã nguồn mở cho ngôn ngữ Java, cung cấp rất nhiều tính năng mạnh mẽ dùng được ngay (out-of-the-box), chẳng hạn như các triển khai Distributed Lock (khóa phân tán) và Delayed Queue (hàng đợi trễ).

Chúng ta có thể tận dụng hàng đợi trễ `RDelayedQueue` tích hợp sẵn của Redisson để xây dựng chức năng delayed task một cách đáng tin cậy.

Hàng đợi trễ `RDelayedQueue` của Redisson được triển khai dựa trên cấu trúc `SortedSet` của Redis. `SortedSet` là một tập hợp có sắp xếp, trong đó mỗi phần tử đều có thể gán một giá trị điểm (`score`) đại diện cho trọng số. Redisson tận dụng đặc tính này: đưa các tác vụ cần thực thi trễ vào `SortedSet` và gán mốc thời gian hết hạn tương ứng làm `score`.

Redisson sử dụng một luồng định kỳ thực thi lệnh `ZRANGEBYSCORE` để quét các phần tử đã đến hạn trong `SortedSet`. Sau đó, nó xóa các phần tử đã hết hạn này khỏi `SortedSet` và đưa chúng vào danh sách thông điệp sẵn sàng (ready queue). Danh sách này thực chất là một hàng đợi chặn (`BlockingQueue`), khi có message chuyển vào thì consumer sẽ lập tức nhận được thông báo để xử lý. Cách thiết kế này giúp consumer không phải liên tục polling toàn bộ `SortedSet`, nâng cao rõ rệt hiệu năng thực thi.

So với phương án lắng nghe sự kiện hết hạn của Redis, giải pháp này sở hữu những ưu thế vượt trội sau:

1. **Giảm thiểu tối đa nguy cơ mất message**: Các message trong `DelayedQueue` được lưu trữ bền vững trong Redis. Ngay cả khi Redis gặp sự cố (crash), dựa trên cơ chế persistence của Redis, lượng dữ liệu mất mát cũng là rất nhỏ. Ngoài ra, bạn cũng có thể kết hợp cơ chế quét bảng cơ sở dữ liệu làm phương án bù đắp (compensation).
2. **Không xảy ra tình trạng tiêu thụ trùng lặp**: Mọi client/consumer đều lấy task từ cùng một hàng đợi đích, do đó hoàn toàn không gặp phải tình trạng nhiều instance cùng xử lý trùng một thông điệp.

So với hàng đợi trễ của Redisson, các hệ thống Message Queue chuyên dụng (như RocketMQ, RabbitMQ) có thể mang lại throughput lớn hơn và độ tin cậy vượt trội hơn nhờ cơ chế đảm bảo tiêu thụ đáng tin cậy, phân luồng consumer linh hoạt. Do đó trong các dự án thực tế quy mô lớn, giải pháp delayed message của Message Queue chuyên dụng luôn là ưu tiên hàng đầu.
