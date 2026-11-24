---
title: Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 1)
description: "Tổng hợp câu hỏi phỏng vấn Redis mới nhất (Phần 1): đi sâu phân tích kiến thức cơ bản về Redis, 5 cấu trúc dữ liệu phổ biến, nguyên lý mô hình đơn luồng, cơ chế persistence (lưu trữ bền vững), chính sách đào thải bộ nhớ và hết hạn, cùng cách triển khai distributed lock và message queue. Phù hợp cho lập trình viên chuẩn bị phỏng vấn backend!"
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn Redis,Redis cơ bản,Cấu trúc dữ liệu Redis,Mô hình luồng Redis,Redis persistence,Quản lý bộ nhớ Redis,Tối ưu hiệu năng Redis,Redis distributed lock,Redis message queue,Redis delayed queue,Chiến lược Redis cache,Redis đơn luồng,Redis đa luồng,Chính sách hết hạn Redis,Chính sách đào thải Redis
lang: vi
sourceRef: zh-ref/database/redis/redis-questions-01.md
---

## Redis cơ bản

### Redis là gì?

[Redis](https://redis.io/) (**RE**mote **DI**ctionary **S**erver) là một cơ sở dữ liệu NoSQL mã nguồn mở được phát triển bằng ngôn ngữ C (giấy phép BSD). Khác với các cơ sở dữ liệu truyền thống, dữ liệu của Redis được lưu trữ trong bộ nhớ (in-memory database, có hỗ trợ persistence lưu trữ bền vững), vì vậy tốc độ đọc ghi cực kỳ nhanh và được ứng dụng rộng rãi trong bài toán bộ nhớ đệm phân tán (distributed cache). Ngoài ra, Redis lưu trữ dữ liệu dưới dạng các cặp key-value (KV).

Để đáp ứng các nghiệp vụ khác nhau, Redis tích hợp sẵn nhiều kiểu dữ liệu (chẳng hạn như String, Hash, Sorted Set, Bitmap, HyperLogLog, GEO). Hơn nữa, Redis còn hỗ trợ transaction, persistence, Lua script, mô hình Pub/Sub (Publish/Subscribe), cùng nhiều giải pháp cluster sẵn có (Redis Sentinel, Redis Cluster).

![Tổng quan các kiểu dữ liệu trong Redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-overview-of-data-types-2023-09-28-6335ecff.jpg)

Redis không có dependency bên ngoài. Linux và OS X là hai hệ điều hành được dùng để phát triển và kiểm thử Redis nhiều nhất, và trang chủ khuyến nghị nên triển khai Redis trên môi trường Linux trong production.

Để phục vụ học tập cá nhân, bạn có thể tự cài đặt Redis trên máy cục bộ hoặc trải nghiệm trực tiếp thông qua [môi trường Redis trực tuyến](https://try.redis.io/) do trang chủ Redis cung cấp (một số ít lệnh không khả dụng tại đây).

![try-redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/try.redis.io-34d730cc.png)

Có rất nhiều trang web trên khắp thế giới sử dụng Redis. Trang [techstacks.io](https://techstacks.io/) có duy trì một [danh sách các trang web phổ biến sử dụng Redis](https://techstacks.io/tech/redis), nếu quan tâm bạn có thể ghé xem.

### ⭐️Tại sao Redis lại nhanh như vậy?

Nội bộ Redis đã thực hiện rất nhiều tối ưu hóa hiệu năng, trong đó 4 điểm quan trọng nhất gồm có:

1. **Thao tác hoàn toàn trên bộ nhớ (Memory-Based Storage / Pure In-Memory Operations)**: Đây là lý do cốt lõi nhất. Mọi thao tác đọc và ghi dữ liệu của Redis đều diễn ra trực tiếp trên RAM, tốc độ truy cập đạt cấp độ nano giây (ns), trong khi cơ sở dữ liệu truyền thống thường xuyên đọc ghi đĩa từ (disk) có tốc độ ở cấp độ mili giây (ms), chênh lệch nhau tới vài bậc độ lớn.
2. **Mô hình I/O hiệu quả (I/O Multiplexing & Single-Threaded Event Loop)**: Redis sử dụng vòng lặp sự kiện đơn luồng (single-threaded event loop) kết hợp với kỹ thuật I/O multiplexing, cho phép một luồng duy nhất có thể đồng thời xử lý các sự kiện I/O (như đọc/ghi) trên nhiều kết nối mạng khác nhau, tránh được hiện tượng context switch (chuyển đổi ngữ cảnh) và tranh chấp khóa (lock contention) trong mô hình đa luồng. Dù chỉ là đơn luồng, nhưng nhờ kết hợp hiệu quả xử lý bộ nhớ vượt trội và I/O multiplexing, Redis có thể dễ dàng xử lý lượng lớn yêu cầu đồng thời (mô hình luồng của Redis sẽ được giới thiệu chi tiết ở phần sau).
3. **Cấu trúc dữ liệu nội bộ được tối ưu hóa (Optimized Data Structures)**: Redis cung cấp nhiều kiểu dữ liệu (như String, List, Hash, Set, Sorted Set...), và việc triển khai bên dưới của chúng sử dụng các cách mã hóa (encoding) được tối ưu hóa cao độ (như ziplist, quicklist, skiplist, hashtable...). Redis sẽ tự động chọn cách mã hóa nội bộ phù hợp nhất dựa trên kích thước và loại dữ liệu nhằm đạt được sự cân bằng tối ưu giữa hiệu năng và dung lượng bộ nhớ.
4. **Giao thức giao tiếp đơn giản và hiệu quả (Simple Protocol - RESP)**: Redis sử dụng giao thức tự thiết kế mang tên RESP (REdis Serialization Protocol). Giao thức này triển khai đơn giản, hiệu năng phân tích cú pháp cao và đảm bảo an toàn nhị phân (binary-safe). Chi phí serialization/deserialization trong giao tiếp giữa client và server là cực kỳ nhỏ, góp phần nâng cao tốc độ tương tác tổng thể.

> Bức ảnh dưới đây tóm lược rất trực quan và chuẩn xác, xin chia sẻ cùng bạn, trích từ [Why is Redis so fast?](https://twitter.com/alexxubyte/status/1498703822528544770).

![why-redis-so-fast](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/why-redis-so-fast-c4e8975b.jpg)

Nếu đã nhanh như vậy, tại sao chúng ta không dùng trực tiếp Redis làm cơ sở dữ liệu chính? Lý do chủ yếu là chi phí bộ nhớ RAM quá đắt đỏ, đồng thời cơ chế persistence mà Redis cung cấp vẫn tiềm ẩn nguy cơ mất mát dữ liệu nhất định.

### Ngoài Redis, bạn còn biết giải pháp distributed cache nào khác không?

Nếu được hỏi câu này trong buổi phỏng vấn, người phỏng vấn chủ yếu muốn đánh giá:

1. Khi lựa chọn Redis làm giải pháp distributed cache, bạn đã từng khảo sát và cân nhắc kỹ lưỡng chưa, hay chỉ đơn thuần chọn theo trào lưu vì Redis đang là công nghệ "hot".
2. Bề rộng kiến thức công nghệ của bạn trong mảng distributed cache.

Nếu bạn nắm được các giải pháp khác và giải thích được lý do cuối cùng lựa chọn Redis (điểm cộng lớn!), phần thể hiện phỏng vấn của bạn sẽ được đánh giá rất cao!

Dưới đây là một số giải pháp distributed cache phổ biến:

Trong mảng distributed cache, hai cái tên lâu đời và được sử dụng rộng rãi nhất là **Memcached** và **Redis**. Tuy nhiên, hiện nay hầu như không còn dự án nào dùng **Memcached** để làm cache nữa, đa số đều chuyển sang dùng thẳng **Redis**.

Memcached từng rất phổ biến vào thời kỳ đầu khi distributed cache mới nở rộ. Về sau, cùng với sự phát triển mạnh mẽ của Redis, mọi người dần dần chuyển sang sử dụng Redis với các tính năng vượt trội hơn.

Một số tập đoàn công nghệ lớn cũng mở mã nguồn các cơ sở dữ liệu lưu trữ KV phân tán hiệu năng cao tương tự Redis, ví dụ như Tencent mã nguồn mở [**Tendis**](https://github.com/Tencent/Tendis). Tendis dùng [RocksDB](https://github.com/facebook/rocksdb) làm storage engine bên dưới, tương thích 100% với giao thức Redis và toàn bộ data model của Redis 4.0. Về việc so sánh giữa Redis và Tendis, Tencent từng đăng tải bài viết: [Redis vs Tendis: Kham pha kien truc luu tru hon hop nong lanh](https://mp.weixin.qq.com/s/MeYkfOIdnU6LYlsGb24KjQ), bạn có thể tham khảo thêm.

Tuy nhiên, nhìn vào lịch sử commit trên Github của Tendis, phiên bản mã nguồn mở của nó gần như không còn được bảo trì cập nhật nữa, cộng thêm độ nhận diện không cao, ít công ty sử dụng. Do đó, không khuyến khích bạn sử dụng Tendis cho distributed cache.

Hiện nay, hai giải pháp mã nguồn mở được cộng đồng công nhận là phương án thay thế Redis nổi bật nhất (cả hai đều nổi lên nhờ việc so kè trực tiếp với Redis):

- [Dragonfly](https://github.com/dragonflydb/dragonfly): Một cơ sở dữ liệu in-memory được xây dựng cho các ứng dụng hiện đại với tải trọng lớn, tương thích hoàn toàn API của Redis và Memcached, không cần sửa bất kỳ dòng code nào khi chuyển đổi, được mệnh danh là cơ sở dữ liệu bộ nhớ nhanh nhất thế giới.
- [KeyDB](https://github.com/Snapchat/KeyDB): Một nhánh rẽ (fork) hiệu năng cao của Redis, tập trung vào đa luồng, tối ưu hiệu quả bộ nhớ và thông lượng cao.

Dù vậy, lời khuyên cá nhân là vẫn nên ưu tiên Redis cho distributed cache, bởi Redis đã trải qua nhiều năm kiểm chứng thực tế khắt khe, hệ sinh thái cực kỳ vững chắc và tài liệu vô cùng phong phú!

PS: Do giới hạn độ dài, tôi không đi sâu chi tiết vào việc so sánh từng giải pháp trên, nếu quan tâm bạn có thể tự mình tìm hiểu thêm.

### Trình bày điểm giống và khác nhau giữa Redis và Memcached

Hiện nay các công ty thường dùng Redis để làm cache, bản thân Redis cũng ngày càng mạnh mẽ hơn! Tuy nhiên, việc nắm rõ điểm giống và khác nhau giữa Redis và Memcached sẽ giúp chúng ta đưa ra quyết định lựa chọn công nghệ một cách có cơ sở và thuyết phục!

**Điểm giống**:

1. Đều là cơ sở dữ liệu dựa trên bộ nhớ (in-memory), thường được dùng làm cache.
2. Đều có chính sách hết hạn (expiration policy).
3. Hiệu năng của cả hai đều cực kỳ cao.

**Điểm khác**:

1. **Kiểu dữ liệu (Data types)**: Redis hỗ trợ kiểu dữ liệu phong phú hơn nhiều (đáp ứng được các bài toán phức tạp hơn). Redis không chỉ hỗ trợ kiểu k/v đơn giản mà còn cung cấp list, set, zset, hash... Trong khi đó, Memcached chỉ hỗ trợ kiểu dữ liệu k/v đơn giản nhất.
2. **Lưu trữ bền vững (Data persistence)**: Redis hỗ trợ persistence dữ liệu, có thể lưu trữ dữ liệu từ RAM xuống ổ đĩa, khi khởi động lại có thể nạp lại vào bộ nhớ để tiếp tục sử dụng; còn Memcached lưu toàn bộ dữ liệu trong RAM. Nói cách khác, Redis có cơ chế phục hồi sau sự cố (disaster recovery), còn Memcached thì không.
3. **Hỗ trợ mô hình Cluster**: Memcached không có chế độ cluster nguyên bản, phải dựa vào phía client để sharding (phân mảnh) dữ liệu vào cluster; trong khi đó, Redis từ phiên bản 3.0 đã hỗ trợ cluster mode nguyên bản.
4. **Mô hình luồng (Thread model)**: Memcached dùng mô hình mạng đa luồng, I/O multiplexing bất đồng bộ; còn Redis dùng mô hình I/O multiplexing đơn luồng (từ Redis 6.0 mới đưa đa luồng vào cho việc đọc ghi dữ liệu mạng).
5. **Hỗ trợ tính năng nâng cao**: Redis hỗ trợ Pub/Sub, Lua script, transaction..., còn Memcached không hỗ trợ. Ngoài ra, Redis hỗ trợ nhiều ngôn ngữ lập trình hơn.
6. **Xóa dữ liệu hết hạn (Expired data deletion)**: Chiến lược xóa dữ liệu hết hạn của Memcached chỉ dùng xóa lười (lazy deletion), trong khi Redis kết hợp cả xóa lười lẫn xóa định kỳ (periodic deletion).

Tin rằng sau khi xem bảng so sánh trên, chúng ta hầu như không còn lý do gì để chọn Memcached làm distributed cache cho dự án của mình nữa.

### ⭐️Tại sao nên sử dụng Redis?

**1. Tốc độ truy cập nhanh hơn**

Dữ liệu trong cơ sở dữ liệu truyền thống được lưu trữ trên đĩa, trong khi Redis hoạt động trên bộ nhớ RAM, tốc độ truy cập bộ nhớ nhanh hơn ổ đĩa rất nhiều lần. Sau khi đưa Redis vào hệ thống, chúng ta có thể đưa các dữ liệu có tần suất truy cập cao vào Redis, lần tới chỉ cần đọc trực tiếp từ bộ nhớ, tốc độ có thể tăng lên hàng chục, thậm chí hàng trăm lần.

**2. Khả năng chịu tải đồng thời cao (High Concurrency)**

Thông thường, các cơ sở dữ liệu như MySQL có QPS chỉ dao động quanh mức 4k (với cấu hình 4 core 8GB RAM), nhưng khi sử dụng Redis cache thì rất dễ dàng đạt tới 50k+, thậm chí 100k+ (đây là tính trên một máy Redis đơn lẻ, nếu dùng Redis Cluster thì con số còn cao hơn nữa).

> QPS (Queries Per Second): Số lượng truy vấn mà máy chủ có thể thực hiện trong mỗi giây;

Từ đó có thể thấy, việc thao tác trực tiếp với cache có thể chịu được lượng request lớn hơn rất nhiều so với truy cập trực tiếp vào database. Do đó, ta có thể cân nhắc chuyển một phần dữ liệu từ database sang cache, giúp phần lớn request của người dùng được xử lý tại cache mà không cần đi qua database. Nhờ vậy, ta nâng cao được khả năng chịu tải đồng thời của toàn hệ thống.

**3. Tính năng toàn diện**

Ngoài việc làm cache, Redis còn có thể dùng làm distributed lock (khóa phân tán), rate limiting (giới hạn tần suất), message queue, delayed queue (hàng đợi trễ)... vô cùng mạnh mẽ!

### ⭐️Tại sao nên dùng Redis thay vì bộ nhớ đệm cục bộ (local cache)?

| Đặc tính | Bộ nhớ đệm cục bộ (Local Cache) | Redis |
| --- | --- | --- |
| Tính nhất quán dữ liệu | Khi triển khai trên nhiều server sẽ gặp vấn đề không nhất quán dữ liệu giữa các node | Đảm bảo tính nhất quán dữ liệu tập trung |
| Giới hạn bộ nhớ | Bị giới hạn bởi dung lượng bộ nhớ của một máy chủ | Triển khai độc lập, không gian bộ nhớ lớn hơn nhiều |
| Rủi ro mất dữ liệu | Máy chủ gặp sự cố (crash/restart) sẽ mất toàn bộ dữ liệu | Có cơ chế persistence, dữ liệu khó bị mất |
| Quản lý và bảo trì | Phân tán trên từng node ứng dụng, quản lý bất tiện | Quản lý tập trung, cung cấp bộ công cụ quản lý phong phú |
| Độ phong phú tính năng | Tính năng hạn chế, thường chỉ hỗ trợ lưu key-value đơn giản | Tính năng phong phú, hỗ trợ đa dạng cấu trúc dữ liệu và chức năng nâng cao |

Để tìm hiểu chi tiết về local cache, distributed cache và multi-level cache, bạn có thể tham khảo bài viết: [Tổng hợp câu hỏi phỏng vấn cơ bản về Cache](https://javaguide.cn/database/redis/cache-basics.html).

### Các chiến lược đọc/ghi cache phổ biến gồm những gì?

Để tìm hiểu chi tiết về các chiến lược đọc ghi cache phổ biến, bạn có thể xem bài viết: [Giải thích chi tiết 3 chiến lược đọc/ghi cache thường gặp](https://javaguide.cn/database/redis/3-commonly-used-cache-read-and-write-strategies.html).

### Redis Module là gì? Có tác dụng gì?

Kể từ phiên bản 4.0, Redis đã hỗ trợ mở rộng chức năng thông qua Module để đáp ứng các nhu cầu nghiệp vụ đặc thù. Các Module này được nạp vào Redis dưới dạng thư viện liên kết động (file `.so`). Đây là một cách thức mở rộng tính năng động vô cùng linh hoạt và rất đáng học hỏi!

Bất kỳ ai trong chúng ta cũng có thể tùy biến phát triển Module riêng trên nền Redis, ví dụ như triển khai tính năng search engine, tùy biến distributed lock hay distributed rate limiting.

Hiện tại, các Module được Redis chính thức khuyến nghị gồm có:

- [RediSearch](https://github.com/RediSearch/RediSearch): Module dùng để triển khai công cụ tìm kiếm (search engine).
- [RedisJSON](https://github.com/RedisJSON/RedisJSON): Module dùng để xử lý dữ liệu JSON.
- [RedisGraph](https://github.com/RedisGraph/RedisGraph): Module dùng để triển khai cơ sở dữ liệu đồ thị (graph database).
- [RedisTimeSeries](https://github.com/RedisTimeSeries/RedisTimeSeries): Module dùng để xử lý dữ liệu chuỗi thời gian (time-series data).
- [RedisBloom](https://github.com/RedisBloom/RedisBloom): Module dùng để triển khai Bloom Filter (bộ lọc Bloom).
- [RedisAI](https://github.com/RedisAI/RedisAI): Module dùng để thực thi các mô hình Deep Learning / Machine Learning và quản lý dữ liệu của chúng.
- [RedisCell](https://github.com/brandur/redis-cell): Module dùng để triển khai giới hạn tốc độ phân tán (distributed rate limiting).
- ……

Để biết thêm chi tiết về Redis Module, bạn có thể xem tài liệu chính thức tại: <https://redis.io/modules>.

## ⭐️Ứng dụng của Redis

### Ngoài làm cache, Redis còn có thể làm được những gì?

- **Distributed lock (Khóa phân tán)**: Sử dụng Redis làm distributed lock là giải pháp rất phổ biến. Thông thường, chúng ta hay dựa vào Redisson để triển khai distributed lock. Xem bài viết chi tiết tại: [Giải thích chi tiết về Distributed Lock](https://javaguide.cn/distributed-system/distributed-lock.html).
- **Rate limiting (Giới hạn tốc độ)**: Thường được thực hiện thông qua Redis kết hợp với Lua script. Nếu không muốn tự viết Lua script, bạn có thể sử dụng trực tiếp `RRateLimiter` của Redisson, bản chất bên dưới của nó dựa trên code Lua kết hợp thuật toán Token Bucket (thùng thẻ bài).
- **Message queue (Hàng đợi tin nhắn)**: Cấu trúc List có sẵn trong Redis có thể dùng làm một queue đơn giản. Cấu trúc Stream được bổ sung trong Redis 5.0 càng thích hợp hơn để làm message queue. Nó tương tự như Kafka, có khái niệm Topic và Consumer Group, hỗ trợ persistence tin nhắn cũng như cơ chế ACK.
- **Delayed queue (Hàng đợi trễ)**: Redisson tích hợp sẵn delayed queue (được triển khai dựa trên Sorted Set).
- **Distributed Session**: Dùng kiểu dữ liệu String hoặc Hash để lưu trữ Session, tất cả các máy chủ ứng dụng đều có thể truy cập chung.
- **Kịch bản nghiệp vụ phức tạp**: Thông qua các cấu trúc dữ liệu do Redis và các thư viện mở rộng (như Redisson) cung cấp, chúng ta có thể dễ dàng giải quyết nhiều bài toán phức tạp, ví dụ như dùng Bitmap thống kê người dùng hoạt động, dùng Sorted Set để duy trì bảng xếp hạng (leaderboard), dùng HyperLogLog để thống kê UV và PV của website.
- ……

### Làm thế nào để hiện thực distributed lock bằng Redis?

Để tìm hiểu chi tiết về cách hiện thực distributed lock bằng Redis, bạn có thể xem bài viết: [Giải thích chi tiết về Distributed Lock](https://javaguide.cn/distributed-system/distributed-lock-implementations.html).

### Redis có thể dùng làm message queue không? Thực hiện như thế nào?

Kết luận trước:

- **Nếu nghiệp vụ đơn giản, dung lượng nhỏ, theo đuổi hiệu năng tối đa** và có thể chấp nhận rủi ro mất mát dữ liệu với xác suất cực nhỏ, sử dụng **Redis Stream** là giải pháp tối ưu, vì nó tiết kiệm chi phí triển khai và vận hành MQ chuyên dụng, tận dụng lại thành phần Redis sẵn có (hầu hết các dự án cần MQ thường cũng đã sử dụng Redis).
- **Nếu là nghiệp vụ cấp tài chính, dữ liệu khổng lồ, bắt buộc đảm bảo tuyệt đối không được mất tin nhắn**, bạn nhất định phải chọn các hệ thống MQ trưởng thành hơn như **Kafka, RabbitMQ**.

Câu hỏi này rất quan trọng và rất hữu ích khi lựa chọn công nghệ, tôi đã viết riêng một bài viết phân tích chi tiết, bạn nên dành thời gian đọc kỹ: [Redis có làm được message queue không? Thực hiện như thế nào?](https://javaguide.cn/database/redis/redis-stream-mq.html).

### Làm thế nào để thực hiện tác vụ hẹn giờ (delayed task) dựa trên Redis?

> Các câu hỏi tương tự:
>
> - Đơn hàng sau 10 phút nếu chưa thanh toán thì tự hủy, dùng Redis triển khai thế nào?
> - Bao lì xì sau 24 giờ không ai nhận thì tự động hoàn tiền, dùng Redis triển khai thế nào?

Triển khai tác vụ hẹn giờ dựa trên Redis thường xoay quanh 2 phương án:

1. Lắng nghe sự kiện hết hạn key của Redis (Keyspace Notifications).
2. Dùng Delayed Queue tích hợp sẵn của Redisson.

Phương án lắng nghe sự kiện hết hạn key của Redis có tính kịp thời kém, dễ mất tin nhắn và gặp vấn đề trùng lặp tiêu thụ tin nhắn trong môi trường nhiều instance ứng dụng, do đó không được khuyến khích sử dụng.

Delayed Queue tích hợp trong Redisson sở hữu những ưu thế vượt trội sau:

1. **Giảm thiểu khả năng mất tin nhắn**: Các tin nhắn trong DelayedQueue được lưu trữ bền vững (persist), ngay cả khi Redis gặp sự cố tắt máy, dựa theo cơ chế persistence cũng chỉ có thể mất một lượng rất nhỏ tin nhắn, ảnh hưởng không đáng kể. Tất nhiên, bạn cũng có thể dùng cơ chế quét database định kỳ để làm phương án bù đắp (compensation).
2. **Không có vấn đề trùng lặp tiêu thụ tin nhắn**: Mỗi client đều lấy task từ cùng một target queue, không gặp tình trạng duplicate consumption.

Xem bài viết chi tiết tại: [Làm thế nào để hiện thực tác vụ hẹn giờ dựa trên Redis?](./redis-delayed-task.md).

## ⭐️Các kiểu dữ liệu trong Redis

Để tìm hiểu chi tiết về 5 kiểu dữ liệu cơ bản và 3 kiểu dữ liệu đặc biệt của Redis, mời bạn xem hai bài viết sau cùng [Tài liệu chính thức của Redis](https://redis.io/docs/data-types/):

- [Giải thích chi tiết 5 kiểu dữ liệu cơ bản của Redis](https://javaguide.cn/database/redis/redis-data-structures-01.html)
- [Giải thích chi tiết 3 kiểu dữ liệu đặc biệt của Redis](https://javaguide.cn/database/redis/redis-data-structures-02.html)

### Các kiểu dữ liệu thường dùng trong Redis gồm những gì?

Các kiểu dữ liệu phổ biến trong Redis gồm có:

- **5 kiểu dữ liệu cơ bản**: String (chuỗi), List (danh sách), Set (tập hợp), Hash (bảng băm), Zset (Sorted Set - tập hợp có thứ tự).
- **3 kiểu dữ liệu đặc biệt**: HyperLogLog (ước lượng số lượng phần tử không trùng lặp), Bitmap (mảng bit), Geospatial (dữ liệu vị trí địa lý).

Ngoài các kiểu kể trên, còn có các thành phần khác như [Bloom filter (Bộ lọc Bloom)](https://javaguide.cn/cs-basics/data-structure/bloom-filter.html), Bitfield (trường bit).

### Các kịch bản ứng dụng của String là gì?

String là kiểu dữ liệu đơn giản nhất và cũng được sử dụng phổ biến nhất trong Redis. Đây là kiểu dữ liệu an toàn nhị phân (binary-safe), có thể dùng để lưu trữ bất kỳ loại dữ liệu nào như chuỗi văn bản, số nguyên, số thực, hình ảnh (chuỗi base64 hoặc đường dẫn ảnh), hay đối tượng đã qua tuần tự hóa (serialized object).

Các kịch bản ứng dụng thường gặp của String gồm có:

- Cache dữ liệu thông thường (như Session, Token, đối tượng đã serialize, đường dẫn hình ảnh);
- Bộ đếm (counter), ví dụ số lượng request của người dùng trong một đơn vị thời gian (dùng cho rate limit đơn giản), số lượt truy cập trang web;
- Distributed lock (sử dụng lệnh `SETNX key value` có thể tạo ra một distributed lock cơ bản nhất);
- ……

Xem chi tiết về String tại bài viết: [Giải thích chi tiết 5 kiểu dữ liệu cơ bản của Redis](https://javaguide.cn/database/redis/redis-data-structures-01.html).

### Lưu trữ dữ liệu đối tượng bằng String hay Hash tốt hơn?

So sánh ngắn gọn giữa hai lựa chọn:

- **Cách thức lưu trữ đối tượng**: String lưu trữ dữ liệu đối tượng đã tuần tự hóa (serialized), lưu toàn bộ đối tượng dưới dạng một khối, thao tác đơn giản và trực tiếp. Hash lưu từng trường (field) của đối tượng riêng biệt, có thể lấy thông tin từng trường hoặc chỉnh sửa/thêm bớt từng trường, giúp tiết kiệm băng thông mạng. Nếu một số trường của đối tượng thường xuyên thay đổi hoặc thường cần truy vấn riêng lẻ, Hash sẽ rất phù hợp.
- **Tiêu hao bộ nhớ**: Hash thường tiết kiệm bộ nhớ hơn String, đặc biệt khi đối tượng có nhiều trường và độ dài mỗi trường ngắn. Redis tối ưu hóa các Hash kích thước nhỏ (như dùng ziplist để lưu trữ), giúp giảm thiểu dung lượng RAM chiếm dụng.
- **Lưu trữ đối tượng phức tạp**: String tiện lợi hơn khi xử lý các đối tượng lồng nhau nhiều tầng hoặc có cấu trúc phức tạp, vì không cần bóc tách từng trường để lưu trữ và thao tác độc lập.
- **Hiệu năng**: Thao tác trên String thường có độ phức tạp thời gian là O(1) vì lưu cả đối tượng, đọc ghi nguyên khối đơn giản, hiệu năng tổng thể rất tốt. Hash do cần xử lý các thao tác thêm/sửa/xóa/đọc trên nhiều field khác nhau, nếu đối tượng có nhiều field và biến động liên tục thì có thể sinh ra thêm chi phí hiệu năng phụ trợ.

Tổng kết:

- Trong đại đa số trường hợp, **String** thích hợp hơn để lưu trữ dữ liệu đối tượng, nhất là khi cấu trúc đối tượng đơn giản và đọc/ghi nguyên khối là thao tác chủ đạo.
- Nếu bạn cần thường xuyên thao tác trên từng trường riêng biệt của đối tượng hoặc muốn tối ưu bộ nhớ ở mức tối đa, **Hash** có thể là lựa chọn tốt hơn.

### Bản chất triển khai bên dưới (underlying implementation) của String là gì?

Redis được viết bằng ngôn ngữ C, nhưng cách triển khai bên dưới của kiểu String trong Redis không phải là chuỗi ký tự chuẩn của C (tức mảng ký tự kết thúc bằng ký tự null `\0`), mà tự xây dựng cấu trúc [SDS](https://github.com/antirez/sds) (Simple Dynamic String - chuỗi động đơn giản) để làm cấu trúc nền tảng.

SDS ban đầu được tác giả Redis thiết kế nhằm phục vụ nhu cầu lập trình C thường nhật, sau đó được đưa vào Redis và trải qua nhiều lần tinh chỉnh hoàn thiện để phù hợp với các thao tác đòi hỏi hiệu năng cao.

Một phần mã nguồn của SDS trong Redis 7.0 như sau (<https://github.com/redis/redis/blob/7.0/src/sds.h>):

```c
/* Note: sdshdr5 is never used, we just access the flags byte directly.
 * However is here to document the layout of type 5 SDS strings. */
struct __attribute__ ((__packed__)) sdshdr5 {
    unsigned char flags; /* 3 bit thấp là type, 5 bit cao là độ dài chuỗi */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len; /* số byte đã sử dụng */
    uint8_t alloc; /* tổng dung lượng cấp phát (không bao gồm header và null terminator) */
    unsigned char flags; /* 3 bit thấp là type, 5 bit chưa sử dụng */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr16 {
    uint16_t len; /* số byte đã sử dụng */
    uint16_t alloc; /* tổng dung lượng cấp phát (không bao gồm header và null terminator) */
    unsigned char flags; /* 3 bit thấp là type, 5 bit chưa sử dụng */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr32 {
    uint32_t len; /* số byte đã sử dụng */
    uint32_t alloc; /* tổng dung lượng cấp phát (không bao gồm header và null terminator) */
    unsigned char flags; /* 3 bit thấp là type, 5 bit chưa sử dụng */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr64 {
    uint64_t len; /* số byte đã sử dụng */
    uint64_t alloc; /* tổng dung lượng cấp phát (không bao gồm header và null terminator) */
    unsigned char flags; /* 3 bit thấp là type, 5 bit chưa sử dụng */
    char buf[];
};
```

Qua mã nguồn có thể thấy, SDS có tất cả 5 cách triển khai: SDS_TYPE_5 (thực tế không dùng đến), SDS_TYPE_8, SDS_TYPE_16, SDS_TYPE_32, SDS_TYPE_64, trong đó chỉ có 4 loại sau là được dùng trong thực tế. Redis sẽ dựa vào độ dài ban đầu của chuỗi để quyết định dùng loại header nào, từ đó tiết kiệm tối đa bộ nhớ.

| Kiểu | Byte | Bit |
| --- | --- | --- |
| sdshdr5 | < 1 | <8 |
| sdshdr8 | 1 | 8 |
| sdshdr16 | 2 | 16 |
| sdshdr32 | 4 | 32 |
| sdshdr64 | 8 | 64 |

Đối với 4 kiểu triển khai thực tế, chúng đều chứa 4 thuộc tính sau:

- `len`: Chiều dài của chuỗi, tức số byte đã thực sự sử dụng.
- `alloc`: Tổng dung lượng ký tự khả dụng, `alloc - len` chính là không gian còn trống của SDS.
- `buf[]`: Mảng thực tế lưu trữ chuỗi ký tự.
- `flags`: 3 bit thấp dùng để lưu cờ định danh kiểu SDS.

So với chuỗi truyền thống trong ngôn ngữ C, SDS mang lại những cải tiến vượt trội sau:

1. **Tránh hiện tượng tràn bộ đệm (Buffer Overflow)**: Trong C, khi chỉnh sửa chuỗi (như nối chuỗi), nếu không cấp phát đủ vùng nhớ sẽ gây tràn bộ đệm. Với SDS, trước khi sửa đổi, hệ thống sẽ kiểm tra thuộc tính `len` và dung lượng khả dụng, nếu không đủ sẽ tự động mở rộng vùng nhớ trước rồi mới thực hiện thao tác sửa đổi.
2. **Độ phức tạp khi lấy độ dài chuỗi rất thấp**: Độ dài chuỗi trong C thường phải duyệt qua từng ký tự để đếm, độ phức tạp là O(n). Trong khi với SDS, việc lấy độ dài chỉ cần đọc trực tiếp thuộc tính `len`, độ phức tạp là O(1).
3. **Giảm số lần cấp phát lại bộ nhớ**: Để tránh việc mỗi lần tăng/giảm chuỗi đều phải cấp phát lại bộ nhớ (như trong C), SDS áp dụng hai chiến lược tối ưu là cấp phát trước không gian (spatial pre-allocation) và giải phóng không gian lười (lazy space allocation). Khi SDS cần tăng độ dài chuỗi, Redis sẽ cấp phát dư bộ nhớ theo thuật toán cụ thể, giúp giảm số lần reallocate bộ nhớ khi chuỗi liên tục tăng kích thước. Khi SDS thu ngắn chuỗi, phần bộ nhớ dư ra không bị giải phóng ngay mà được giữ lại để dùng cho các thao tác sau (vẫn hỗ trợ giải phóng thủ công qua API tương ứng).
4. **An toàn nhị phân (Binary-Safe)**: Chuỗi trong C dùng ký tự null `\0` để đánh dấu điểm kết thúc, điều này gây rắc rối vì các tệp nhị phân (như ảnh, video, âm thanh) có thể chứa ký tự null bên trong khiến chuỗi C đọc sai. SDS dùng thuộc tính `len` để xác định chiều dài chuỗi nên không gặp phải vấn đề này.

🤐 Nói thêm một chút, trong nhiều bài viết cũ, định nghĩa của SDS thường có dạng như sau:

```c
struct sdshdr {
    unsigned int len;
    unsigned int free;
    char buf[];
};
```

Định nghĩa này không sai, trước phiên bản Redis 3.2 quả thực đã được định nghĩa như vậy. Tuy nhiên, cách định nghĩa đó khiến cả `len` và `free` đều tốn cố định 4 byte, gây lãng phí dung lượng. Từ Redis 3.2 trở đi, Redis đã cải tiến định nghĩa SDS và chia thành 5 loại như hiện tại.

### Lưu thông tin giỏ hàng nên dùng String hay Hash tốt hơn?

Vì các sản phẩm trong giỏ hàng thường xuyên bị sửa đổi và thay đổi số lượng, thông tin giỏ hàng được khuyến nghị lưu bằng Hash:

- Key: User ID
- Field: Product ID (Mã sản phẩm)
- Value: Số lượng sản phẩm

![Dùng Hash quản lý thông tin giỏ hàng đơn giản](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/hash-shopping-cart-ba56bc6c.png)

Cụ thể, các thao tác duy trì thông tin giỏ hàng của người dùng được thực hiện như thế nào?

- Người dùng thêm sản phẩm: Thêm field và value mới vào Hash tương ứng;
- Truy vấn thông tin giỏ hàng: Duyệt qua toàn bộ Hash tương ứng;
- Thay đổi số lượng sản phẩm: Sửa đổi trực tiếp giá trị value tương ứng (set trực tiếp hoặc dùng lệnh cộng trừ số học);
- Xóa sản phẩm: Xóa field tương ứng khỏi Hash;
- Xóa sạch giỏ hàng: Xóa trực tiếp key tương ứng.

Ví dụ trên chỉ minh họa cho kịch bản giỏ hàng đơn giản. Trong các hệ thống thương mại điện tử thực tế, field chỉ chứa mã sản phẩm sẽ không đủ đáp ứng hết các thuộc tính nghiệp vụ phức tạp.

### Làm thế nào để triển khai bảng xếp hạng bằng Redis?

Trong Redis có một kiểu dữ liệu gọi là `Sorted Set` (tập hợp có thứ tự - Zset) rất hay được dùng cho các bài toán bảng xếp hạng (leaderboard), ví dụ: Bảng xếp hạng tặng quà trong phòng livestream, bảng xếp hạng đếm bước chân WeChat Moments, bảng xếp hạng bậc rank trong game, bảng xếp hạng chủ đề nóng (hot topic)...

Một số lệnh Redis liên quan: `ZRANGE` (sắp xếp từ bé đến lớn), `ZREVRANGE` (sắp xếp từ lớn đến bé), `ZREVRANK` (lấy thứ hạng của một phần tử cụ thể).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/2021060714195385-ae2278e1.png)

Trong cuốn [《Java Cam nang phong van》](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html) phần "Phỏng vấn kỹ thuật" có một bài viết phân tích rất chi tiết cách dùng Sorted Set để thiết kế một bảng xếp hạng hoàn chỉnh, bạn có thể tham khảo thêm.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719071115140-61c4235c.png)

### Tại sao Sorted Set trong Redis lại sử dụng Skip List làm cấu trúc bên dưới mà không dùng Cây cân bằng, Cây đỏ-đen hay B+ Tree?

Đây là câu hỏi phỏng vấn rất hay được các công ty lớn đưa ra, độ khó tương đối cao.

- **Cây cân bằng (Balanced Tree) vs Skip List**: Cả cây cân bằng và Skip List đều có độ phức tạp thời gian cho các thao tác chèn, xóa và tìm kiếm là **O(log n)**. Với truy vấn theo dải (range query), cây cân bằng cũng có thể duyệt trung thứ tự (in-order traversal) để đạt hiệu quả tương tự Skip List. Tuy nhiên, mỗi lần chèn hoặc xóa trên cây cân bằng đều phải đảm bảo độ cân bằng tuyệt đối giữa các nhánh con, chỉ cần mất cân bằng là phải thực hiện xoay cây (rotation) để tái cân bằng, quá trình này rất tốn thời gian. Skip List ra đời nhằm khắc phục nhược điểm này của cây cân bằng. Skip List sử dụng cơ chế cân bằng xác suất (probabilistic balance) thay vì ràng buộc cân bằng nghiêm ngặt, nhờ vậy thuật toán chèn và xóa trên Skip List đơn giản và nhanh hơn cây cân bằng rất nhiều.
- **Cây đỏ-đen (Red-Black Tree) vs Skip List**: So với cây đỏ-đen, việc triển khai Skip List đơn giản hơn, không cần xoay cây và đổi màu (re-coloring) để duy trì cân bằng đen. Hơn nữa, với thao tác tìm kiếm dữ liệu theo khoảng/khoảng giá trị (range query), hiệu năng của cây đỏ-đen không cao bằng Skip List.
- **B+ Tree vs Skip List**: B+ Tree phù hợp làm cấu trúc chỉ mục trong cơ sở dữ liệu trên đĩa và hệ thống tệp tin, tư tưởng cốt lõi của nó là giảm thiểu tối đa số lần I/O đĩa để định vị dữ liệu. Đối với một in-memory database như Redis, điều này không mang lại ý nghĩa lớn, vì Redis lưu dữ liệu trên RAM nên không thể chứa dung lượng khổng lồ như đĩa cứng, do đó không cần dùng B+ Tree để duy trì chỉ mục mà chỉ cần duy trì chỉ mục ngẫu nhiên theo xác suất, vừa tiết kiệm bộ nhớ vừa đơn giản. Hơn nữa, khi dùng Skip List để hiện thực zset, khi chèn phần tử chỉ cần tìm vị trí phù hợp trong danh sách liên kết rồi sinh ngẫu nhiên chiều cao của chỉ mục, không cần phải thực hiện tách nốt (split) hay gộp nốt (merge) phức tạp như B+ Tree khi xảy ra mất cân bằng.

Ngoài ra, tôi cũng có một bài viết riêng đi từ cách sử dụng cơ bản của Sorted Set đến phân tích mã nguồn và cách triển khai Skip List, giúp bạn hiểu sâu sắc hơn: [Tại sao Redis dùng Skip List để triển khai Sorted Set](https://javaguide.cn/database/redis/redis-skiplist.html). Nếu chỉ muốn điểm qua cấu trúc cơ bản, độ phức tạp và truy vấn khoảng của Skip List, bạn có thể xem [Tổng hợp câu hỏi phỏng vấn về Skip List](https://javaguide.cn/cs-basics/data-structure/skip-list.html).

### Các kịch bản ứng dụng của Set là gì?

`Set` trong Redis là một tập hợp không có thứ tự, các phần tử trong tập hợp không phân biệt trước sau nhưng đều là duy nhất, khá tương đồng với `HashSet` trong Java.

Các kịch bản ứng dụng thường gặp của `Set`:

- Kịch bản lưu trữ dữ liệu không được phép trùng lặp: Thống kê UV của website (với dữ liệu cực lớn thì `HyperLogLog` sẽ phù hợp hơn), lượt thích bài viết, thả tim story...
- Kịch bản cần lấy giao (intersection), hợp (union) và hiệu (difference) giữa nhiều nguồn dữ liệu: Bạn chung (giao), fan chung (giao), cùng theo dõi (giao), gợi ý bạn bè (hiệu), gợi ý bài hát (hiệu), gợi ý kênh đăng ký (hiệu + giao)...
- Kịch bản cần lấy ngẫu nhiên phần tử từ nguồn dữ liệu: Hệ thống bốc thăm trúng thưởng, điểm danh ngẫu nhiên...

### Làm thế nào để triển khai hệ thống bốc thăm trúng thưởng bằng Set?

Nếu muốn dùng `Set` để xây dựng một hệ thống bốc thăm trúng thưởng đơn giản, bạn chỉ cần dùng các lệnh sau:

- `SADD key member1 member2 ...`: Thêm một hoặc nhiều phần tử vào Set được chỉ định.
- `SPOP key count`: Ngẫu nhiên xóa và trả về một hoặc nhiều phần tử trong Set, phù hợp với kịch bản mỗi người chỉ được trúng thưởng một lần (không trùng lặp).
- `SRANDMEMBER key count`: Ngẫu nhiên lấy ra một số lượng phần tử chỉ định từ Set nhưng không xóa chúng, phù hợp với kịch bản cho phép trúng thưởng nhiều lần.

### Làm thế nào để dùng Bitmap thống kê người dùng hoạt động (Active Users)?

Bitmap lưu trữ dãy số nhị phân liên tục (gồm các bit 0 và 1). Thông qua Bitmap, chỉ cần 1 bit duy nhất để biểu diễn giá trị hoặc trạng thái của một phần tử, key chính là định danh của đối tượng. Chúng ta biết 8 bit tạo thành 1 byte, do đó Bitmap giúp tiết kiệm không gian lưu trữ cực kỳ lớn.

Bạn có thể coi Bitmap như một mảng chứa các số nhị phân (0 và 1), chỉ số (index) của mỗi phần tử trong mảng được gọi là offset (độ lệch).

![img](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194154133-ab812d2d.png)

Nếu muốn dùng Bitmap để thống kê người dùng hoạt động, bạn có thể dùng ngày (chính xác đến ngày) làm key, User ID làm offset, nếu ngày hôm đó người dùng có hoạt động thì gán giá trị bằng 1.

Khởi tạo dữ liệu:

```bash
> SETBIT 20210308 1 1
(integer) 0
> SETBIT 20210308 2 1
(integer) 0
> SETBIT 20210309 1 1
(integer) 0
```

Thống kê tổng số người dùng hoạt động trong cả 2 ngày 20210308 và 20210309 (hoạt động cả 2 ngày - toán tử AND):

```bash
> BITOP and desk1 20210308 20210309
(integer) 1
> BITCOUNT desk1
(integer) 1
```

Thống kê tổng số người dùng có hoạt động trong ít nhất một trong 2 ngày 20210308~20210309 (toán tử OR):

```bash
> BITOP or desk2 20210308 20210309
(integer) 1
> BITCOUNT desk2
(integer) 2
```

### HyperLogLog phù hợp với kịch bản nào?

HyperLogLog (HLL) là một cấu trúc dữ liệu xác suất vô cùng khéo léo, nó chuyên giải quyết một bài toán dữ liệu lớn cực kỳ nan giải: Trong tập dữ liệu khổng lồ, sử dụng dung lượng bộ nhớ siêu nhỏ để ước lượng số lượng phần tử không trùng lặp trong tập hợp, tức khái niệm Lực lượng cơ sở (Cardinality).

Sự đánh đổi cốt lõi của HLL là hy sinh một chút độ chính xác tuyệt đối để đổi lấy khả năng tiết kiệm không gian bộ nhớ khổng lồ. Con số mà nó đưa ra không phải là chính xác 100%, mà là một giá trị xấp xỉ với sai số chuẩn rất nhỏ (mặc định trong Redis là khoảng 0.81%).

**Dựa trên sự đánh đổi này, HyperLogLog phù hợp nhất với các kịch bản có đặc điểm sau:**

1. **Dữ liệu cực lớn, yêu cầu khắt khe về bộ nhớ:** Đây là thế mạnh tuyệt đối của HLL. Ví dụ, cần thống kê lượng người dùng truy cập duy nhất mỗi ngày (UV) của một ứng dụng có hàng trăm triệu người dùng hoạt động hàng ngày. Nếu dùng Set truyền thống để lưu User ID, mỗi ID tốn vài chục byte, hàng trăm triệu ID có thể tốn vài GB đến hàng chục GB RAM, điều này là bất khả thi trong nhiều bài toán. Trong khi đó với HLL, Redis chỉ cần một lượng bộ nhớ cố định khoảng 12KB là có thể xử lý tập dữ liệu có quy mô thiên văn, đây là một ưu thế mang tính đột phá.
2. **Không đòi hỏi kết quả phải chính xác tuyệt đối 100%:** Đây là điều kiện tiên quyết để dùng HLL. Ví dụ, Product Manager chỉ cần biết lượng UV của một bài viết hot là khoảng 10 triệu hay 10,1 triệu, sự chênh lệch nhỏ này hoàn toàn không ảnh hưởng tới quyết định kinh doanh. Nhưng nếu là bài toán thống kê chính xác số lượng giao dịch trong hệ thống thanh toán tài chính, HLL hoàn toàn không phù hợp vì mảng tài chính đòi hỏi chính xác 100%.

**Vì vậy, các kịch bản ứng dụng cụ thể của HyperLogLog rất rõ ràng:**

- **Thống kê UV (Unique Visitor) của Website/App:** Thống kê trang chủ mỗi ngày có bao nhiêu địa chỉ IP hoặc User ID khác nhau ghé thăm.
- **Thống kê từ khóa tìm kiếm:** Thống kê mỗi ngày có bao nhiêu người dùng khác nhau tìm kiếm một từ khóa cụ thể.
- **Thống kê tương tác mạng xã hội:** Thống kê một bài đăng được bao nhiêu người dùng khác nhau chia sẻ lại.

Trong các kịch bản này, điều chúng ta quan tâm là cấp độ số lượng và xu hướng biến động, chứ không phải sai số ở hàng đơn vị.

Cuối cùng, cách triển khai HLL trong Redis rất thông minh: Nội bộ nó sẽ tự động chuyển đổi giữa **ma trận thưa (Sparse Matrix - tốn ít không gian hơn)** và **ma trận đặc (Dense Matrix - cố định 12KB)** tùy theo quy mô của tập dữ liệu, giúp tối ưu hóa hơn nữa việc sử dụng bộ nhớ. Tóm lại, khi bạn cần đếm phần tử không trùng lặp trên tập dữ liệu khổng lồ và chấp nhận được sai số nhỏ, HyperLogLog chính là lựa chọn số một.

### Thống kê UV của trang bằng HyperLogLog như thế nào?

Sử dụng HyperLogLog để thống kê UV của trang chủ yếu dùng 2 lệnh sau:

- `PFADD key element1 element2 ...`: Thêm một hoặc nhiều phần tử vào HyperLogLog.
- `PFCOUNT key1 key2`: Lấy số lượng phần tử không trùng lặp ước tính từ một hoặc nhiều HyperLogLog.

1. Thêm User ID của mỗi người dùng truy cập trang vào `HyperLogLog`:

```bash
PFADD PAGE_1:UV USER1 USER2 ...... USERn
```

2. Thống kê UV của trang:

```bash
PFCOUNT PAGE_1:UV
```

### Nếu muốn xác định một phần tử chắc chắn KHÔNG nằm trong một tập hợp dữ liệu khổng lồ, ta nên dùng kiểu dữ liệu nào?

Đây là kịch bản ứng dụng kinh điển của Bloom Filter (Bộ lọc Bloom). Bloom Filter có thể cho bạn biết một phần tử **chắc chắn không tồn tại** hoặc **có thể tồn tại**. Nó sở hữu hiệu quả không gian bộ nhớ cực cao cùng tỷ lệ phán đoán nhầm nhất định (false positive), nhưng tuyệt đối không bao giờ bỏ sót (false negative = 0). Nghĩa là, nếu Bloom Filter báo phần tử tồn tại, có một xác suất nhỏ là báo nhầm; nhưng nếu Bloom Filter báo phần tử không tồn tại, thì phần tử đó chắc chắn 100% không tồn tại.

Sơ đồ nguyên lý đơn giản của Bloom Filter:

![Sơ đồ nguyên lý đơn giản của Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-simple-schematic-diagram-ecf8f3d1.png)

Khi một chuỗi ký tự được thêm vào Bloom Filter, chuỗi đó sẽ đi qua nhiều hàm băm (hash function) độc lập để tạo ra các giá trị băm khác nhau, sau đó các vị trí tương ứng trong mảng bit sẽ được gán giá trị 1 (khi mảng bit mới khởi tạo, tất cả vị trí đều là 0). Khi lưu chuỗi giống hệt lần thứ hai, vì các vị trí bit tương ứng đều đã là 1, ta dễ dàng biết được giá trị này đã tồn tại (khử trùng lặp rất thuận tiện).

Khi cần kiểm tra xem một chuỗi có nằm trong Bloom Filter hay không, ta chỉ việc băm chuỗi đó qua các hàm băm tương tự, rồi kiểm tra xem các bit tương ứng trong mảng bit có đều bằng 1 hay không. Nếu tất cả đều là 1, nghĩa là phần tử có thể tồn tại trong Bloom Filter; chỉ cần có ít nhất một bit không phải 1, ta khẳng định chắc chắn 100% phần tử đó không nằm trong Bloom Filter.

Để tìm hiểu sâu hơn về tỷ lệ báo nhầm, khó khăn khi xóa phần tử, cùng cách sử dụng Guava BloomFilter và RedisBloom, bạn có thể xem tiếp: [Giải thích chi tiết về Bloom Filter](https://javaguide.cn/cs-basics/data-structure/bloom-filter.html).

## ⭐️Cơ chế lưu trữ bền vững của Redis (Persistence) (Quan trọng)

Các câu hỏi xoay quanh cơ chế persistence của Redis (RDB, AOF, kết hợp RDB và AOF) xuất hiện rất nhiều trong phỏng vấn và rất quan trọng, vì vậy tôi đã tách riêng một bài viết để tổng hợp toàn diện các kiến thức này: [Giải thích chi tiết cơ chế Persistence của Redis](https://javaguide.cn/database/redis/redis-persistence.html).

## ⭐️Mô hình luồng của Redis (Quan trọng)

Đối với các lệnh đọc ghi dữ liệu, Redis luôn duy trì mô hình đơn luồng. Tuy nhiên, từ phiên bản Redis 4.0 đã đưa thêm đa luồng vào để xử lý tác vụ xóa bất đồng bộ đối với các key-value có dung lượng lớn (big key), và từ Redis 6.0 đã đưa đa luồng vào để xử lý request mạng (nâng cao hiệu năng đọc ghi I/O mạng).

### Bạn có hiểu rõ về mô hình đơn luồng của Redis không?

**Redis dựa trên mẫu kiến trúc Reactor (Reactor Pattern) để thiết kế một mô hình xử lý sự kiện hiệu năng cao** (Mô hình luồng của Netty cũng dựa trên Reactor pattern, Reactor xứng đáng là nền tảng cho I/O hiệu năng cao). Mô hình xử lý sự kiện này tương ứng với bộ xử lý sự kiện file (file event handler) trong Redis. Do file event handler chạy dưới dạng đơn luồng, nên chúng ta thường nói Redis là mô hình đơn luồng.

Cuốn sách 《Redis Thiết kế và Triển khai》 có đoạn mô tả rất hay về file event handler:

> Redis phát triển bộ xử lý sự kiện mạng riêng dựa trên Reactor pattern: bộ xử lý này được gọi là bộ xử lý sự kiện file (file event handler).
>
> - File event handler sử dụng chương trình I/O multiplexing để lắng nghe đồng thời nhiều socket, và liên kết các sự kiện tương ứng với từng bộ xử lý sự kiện dựa trên tác vụ hiện tại của socket.
> - Khi một socket được lắng nghe sẵn sàng thực hiện các thao tác như chấp nhận kết nối (accept), đọc (read), ghi (write), đóng (close)..., sự kiện file tương ứng sẽ phát sinh, lúc này file event handler sẽ gọi bộ xử lý sự kiện đã liên kết trước đó để xử lý các sự kiện này.
>
> **Mặc dù file event handler hoạt động theo phương thức đơn luồng, nhưng thông qua việc dùng I/O multiplexing để lắng nghe nhiều socket**, file event handler vừa hiện thực hóa mô hình giao tiếp mạng hiệu năng cao, vừa kết nối mượt mà với các module đơn luồng khác bên trong Redis server, giữ trọn vẹn tính đơn giản trong thiết kế đơn luồng của Redis.

**Đã là đơn luồng, vậy làm sao Redis có thể lắng nghe lượng lớn kết nối từ client?**

Redis thông qua **chương trình I/O multiplexing** để lắng nghe lượng lớn kết nối từ client (hay nói cách khác là lắng nghe nhiều socket). Nó đăng ký các sự kiện quan tâm cùng loại sự kiện (đọc, ghi) vào nhân hệ điều hành (kernel) và lắng nghe xem sự kiện nào phát sinh.

Lợi ích của việc này cực kỳ rõ ràng: **Kỹ thuật I/O multiplexing giúp Redis không cần tạo thêm các luồng thừa thãi để lắng nghe lượng lớn kết nối từ client, giảm thiểu tối đa chi phí tiêu hao tài nguyên** (rất giống thành phần `Selector` trong Java NIO).

Bộ xử lý sự kiện file (file event handler) chủ yếu gồm 4 thành phần:

- Nhiều socket (kết nối từ phía client)
- Chương trình I/O multiplexing (chìa khóa hỗ trợ nhiều kết nối client đồng thời)
- Bộ điều phối sự kiện file - File event dispatcher (liên kết socket với bộ xử lý sự kiện tương ứng)
- Bộ xử lý sự kiện - Event handler (Bộ xử lý chấp nhận kết nối, Bộ xử lý yêu cầu lệnh, Bộ xử lý phản hồi lệnh)

![Bộ xử lý sự kiện file (file event handler)](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-event-handler-2997bc21.png)

### Tại sao trước phiên bản Redis 6.0 lại không sử dụng đa luồng?

Mặc dù nói Redis là mô hình đơn luồng, nhưng trên thực tế, **Redis từ phiên bản 4.0 trở đi đã bắt đầu hỗ trợ đa luồng.**

Tuy nhiên, đa luồng được bổ sung trong Redis 4.0 chủ yếu nhắm vào các lệnh xóa các cặp key-value dung lượng lớn, việc thực thi các lệnh này sẽ sử dụng các luồng phụ ngoài main thread để "xử lý bất đồng bộ", từ đó giảm thiểu tác động làm nghẽn main thread.

Để phục vụ điều này, Redis 4.0 đã thêm một số lệnh bất đồng bộ:

- `UNLINK`: Có thể coi là phiên bản bất đồng bộ của lệnh `DEL`.
- `FLUSHALL ASYNC`: Dùng để xóa sạch tất cả key trong toàn bộ cơ sở dữ liệu (không giới hạn trong database hiện tại đang `SELECT`).
- `FLUSHDB ASYNC`: Dùng để xóa sạch tất cả key trong database hiện tại đang `SELECT`.

![redis4.0 more thread](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis4.0-more-thread-0ffdad94.png)

Nhìn chung, cho tới trước Redis 6.0, các thao tác cốt lõi của Redis vẫn do đơn luồng xử lý.

**Vậy tại sao trước Redis 6.0 lại không sử dụng đa luồng?** Tôi cho rằng có 3 nguyên nhân chính:

- Lập trình đơn luồng đơn giản và dễ bảo trì hơn rất nhiều;
- Nút thắt hiệu năng (bottleneck) của Redis không nằm ở CPU, mà chủ yếu nằm ở dung lượng bộ nhớ (RAM) và băng thông mạng;
- Đa luồng sẽ kéo theo các vấn đề phức tạp như deadlock, chi phí chuyển đổi ngữ cảnh (thread context switch), thậm chí làm suy giảm hiệu năng thực tế.

Bài viết liên quan: [Tại sao Redis chọn mô hình đơn luồng?](https://draveness.me/whys-the-design-redis-single-thread/).

### Tại sao từ Redis 6.0 trở đi lại đưa vào đa luồng?

**Redis 6.0 đưa đa luồng vào chủ yếu nhằm nâng cao hiệu năng đọc ghi I/O mạng**, bởi vì đây chính là nút thắt cổ chai về mặt hiệu năng trong Redis (nút thắt của Redis chủ yếu bị giới hạn bởi bộ nhớ và mạng).

Mặc dù Redis 6.0 đưa vào đa luồng, nhưng đa luồng của Redis chỉ được áp dụng cho các thao tác tốn thời gian như đọc và ghi dữ liệu qua mạng; quá trình **thực thi lệnh vẫn diễn ra tuần tự trên một luồng duy nhất (đơn luồng)**. Vì vậy, bạn hoàn toàn không phải lo lắng về vấn đề an toàn luồng (thread safety) khi thực thi lệnh.

Tính năng đa luồng trong Redis 6.0 mặc định bị vô hiệu hóa, server chỉ chạy main thread. Nếu muốn bật, bạn cần cấu hình số lượng luồng I/O > 1 trong file cấu hình `redis.conf`:

```bash
io-threads 4 # Nếu đặt là 1 thì chỉ mở main thread; trang chủ khuyến nghị máy 4 core nên đặt 2 hoặc 3 luồng, máy 8 core nên đặt 6 luồng
```

Ngoài ra:

- Số lượng `io-threads` một khi đã cấu hình thì không thể thay đổi động thông qua lệnh `config`.
- Khi kích hoạt mã hóa SSL, `io-threads` sẽ không hoạt động.

Sau khi bật đa luồng, mặc định Redis chỉ dùng đa luồng cho tác vụ ghi mạng (writes - tức gửi dữ liệu phản hồi cho client). Nếu muốn bật đa luồng cho cả tác vụ đọc mạng (reads), bạn cũng cần chỉnh sửa file cấu hình `redis.conf`:

```bash
io-threads-do-reads yes
```

Tuy nhiên, tài liệu chính thức lưu ý rằng việc bật đa luồng cho việc đọc không mang lại cải thiện hiệu năng quá rõ rệt, do đó thông thường không khuyến khích bật tính năng này.

Bài đọc thêm:

- [Tính năng mới Redis 6.0 - 13 câu hỏi liên hoàn về đa luồng!](https://mp.weixin.qq.com/s/FZu3acwK6zrCBZQ_3HoUgw)
- [Bật mí toàn diện mô hình mạng đa luồng của Redis](https://segmentfault.com/a/1190000039223696) (Khuyên đọc)

### Bạn có biết về các background thread (luồng nền) trong Redis không?

Dù chúng ta thường nói Redis là mô hình đơn luồng (luồng chính xử lý logic cốt lõi), nhưng trên thực tế Redis vẫn có một số luồng nền (background thread) chạy ngầm để thực thi các tác vụ tốn thời gian:

- Luồng nền `bio_close_file`: Giải phóng tài nguyên tệp tạm sinh ra trong quá trình ghi AOF / RDB.
- Luồng nền `bio_aof_fsync`: Gọi hàm hệ thống `fsync` để ép đẩy dữ liệu còn nằm trong bộ đệm kernel xuống ổ đĩa vật lý (file AOF).
- Luồng nền `bio_lazy_free`: Giải phóng vùng nhớ mà các đối tượng dữ liệu lớn (đã bị xóa) đang chiếm dụng.

Các luồng này được định nghĩa trong file `bio.h` (mã nguồn Redis 6.0 tại: <https://github.com/redis/redis/blob/6.0/src/bio.h>):

```java
#ifndef __BIO_H
#define __BIO_H

/* Exported API */
void bioInit(void);
void bioCreateBackgroundJob(int type, void *arg1, void *arg2, void *arg3);
unsigned long long bioPendingJobsOfType(int type);
unsigned long long bioWaitStepOfType(int type);
time_t bioOlderJobOfType(int type);
void bioKillThreads(void);

/* Background job opcodes */
#define BIO_CLOSE_FILE    0 /* Hoãn lệnh gọi hệ thống close(2) */
#define BIO_AOF_FSYNC     1 /* Hoãn fsync của AOF */
#define BIO_LAZY_FREE     2 /* Hoãn giải phóng bộ nhớ của đối tượng */
#define BIO_NUM_OPS       3

#endif
```

Để tìm hiểu chi tiết về các background thread trong Redis, bạn có thể xem bài viết: [Redis 6.0 có những background thread nào?](https://juejin.cn/post/7102780434739626014).

## ⭐️Quản lý bộ nhớ trong Redis

### Việc thiết lập thời gian hết hạn (TTL) cho dữ liệu cache trong Redis có tác dụng gì?

Thông thường, khi lưu dữ liệu vào cache chúng ta đều thiết lập thời gian hết hạn (expiration time). Tại sao lại như vậy?

Dung lượng bộ nhớ RAM luôn có hạn và rất đắt đỏ, nếu không cài đặt thời gian hết hạn cho dữ liệu cache, lượng RAM chiếm dụng sẽ liên tục tăng lên và cuối cùng dẫn đến sự cố tràn bộ nhớ (Out Of Memory - OOM). Bằng cách thiết lập thời gian hết hạn hợp lý, Redis sẽ tự động dọn dẹp các dữ liệu tạm thời không còn cần thiết, nhường không gian cho dữ liệu cache mới.

Redis tích hợp sẵn tính năng cài đặt thời gian hết hạn cho dữ liệu, ví dụ:

```bash
127.0.0.1:6379> expire key 60 # Dữ liệu sẽ hết hạn sau 60s
(integer) 1
127.0.0.1:6379> setex key 60 value # Dữ liệu hết hạn sau 60s (setex = [set] + [ex]pire)
OK
127.0.0.1:6379> ttl key # Kiểm tra xem dữ liệu còn bao lâu nữa thì hết hạn
(integer) 56
```

Lưu ý ⚠️: Trong Redis, ngoài kiểu String có lệnh chuyên biệt `setex` để vừa gán giá trị vừa set TTL, các kiểu dữ liệu khác đều phải dùng lệnh `expire` để thiết lập thời gian hết hạn. Ngoài ra, lệnh `persist` có thể dùng để xóa bỏ thời gian hết hạn của một key (giúp key tồn tại vĩnh viễn).

**Ngoài việc giảm bớt tiêu hao RAM, thời gian hết hạn còn có tác dụng gì khác không?**

Trong rất nhiều trường hợp, nghiệp vụ đòi hỏi dữ liệu chỉ được phép tồn tại trong một khoảng thời gian nhất định, chẳng hạn mã OTP gửi qua SMS chỉ có hiệu lực trong 1 phút, Token đăng nhập của người dùng chỉ có hiệu lực trong 1 ngày.

Nếu dùng cơ sở dữ liệu quan hệ truyền thống để giải quyết, ta thường phải tự viết logic kiểm tra hạn sử dụng, vừa phiền phức vừa có hiệu năng kém hơn rất nhiều.

### Redis xác định dữ liệu đã hết hạn bằng cách nào?

Redis sử dụng một cấu trúc gọi là từ điển hết hạn (expired dictionary - bản chất là một bảng băm hash table) để lưu trữ thời gian hết hạn của dữ liệu. Khóa (key) trong từ điển hết hạn trỏ tới key tương ứng trong Redis database, còn giá trị (value) là một số nguyên kiểu `long long` lưu trữ mốc thời gian hết hạn của key đó (thời gian UNIX timestamp tính bằng mili giây).

![Từ điển hết hạn của Redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-expired-dictionary-28e28389.png)

Từ điển hết hạn được lưu trữ bên trong cấu trúc `redisDb`:

```c
typedef struct redisDb {
    ...

    dict *dict;     // Không gian key của database, lưu tất cả cặp key-value
    dict *expires   // Từ điển hết hạn, lưu thời gian hết hạn của các key
    ...
} redisDb;
```

Khi truy vấn một key, trước tiên Redis sẽ kiểm tra xem key đó có nằm trong từ điển hết hạn hay không (độ phức tạp thời gian là O(1)). Nếu không có thì trả về trực tiếp; nếu có, Redis sẽ kiểm tra xem mốc thời gian của key đã qua chưa, nếu đã hết hạn thì lập tức xóa key và trả về null.

### Bạn có hiểu về các chiến lược xóa key hết hạn trong Redis không?

Giả sử bạn cài đặt một loạt key chỉ sống trong vòng 1 phút, vậy sau 1 phút, Redis sẽ xóa số key này như thế nào?

Các chiến lược xóa dữ liệu hết hạn phổ biến gồm có:

1. **Xóa lười / Xóa khi truy cập (Lazy Deletion)**: Chỉ khi lấy/truy vấn key đó thì mới kiểm tra xem nó đã hết hạn chưa. Phương pháp này thân thiện nhất với CPU, nhưng có thể dẫn đến việc có quá nhiều key hết hạn không bao giờ được truy cập lại và cứ thế chiếm dụng RAM.
2. **Xóa định kỳ (Periodic Deletion)**: Định kỳ lấy ngẫu nhiên một nhóm key từ tập các key có cài đặt hết hạn, kiểm tra từng key xem đã hết hạn chưa, nếu hết hạn thì xóa. So với xóa lười, xóa định kỳ thân thiện với bộ nhớ hơn, nhưng tốn CPU hơn một chút.
3. **Hàng đợi trễ (Delay Queue)**: Đưa các key có thời gian hết hạn vào một hàng đợi trễ, khi tới giờ thì lấy ra xóa. Cách này đảm bảo key hết hạn sẽ bị xóa đúng giờ, nhưng việc duy trì hàng đợi trễ rất phức tạp và bản thân hàng đợi cũng tiêu tốn tài nguyên.
4. **Xóa hẹn giờ (Timed Deletion)**: Mỗi key có cài đặt hết hạn sẽ được gán một timer riêng, đến đúng thời điểm sẽ xóa ngay lập tức. Cách này đảm bảo không bao giờ có rác trong RAM, nhưng gây áp lực khủng khiếp lên CPU vì phải duy trì vô số bộ đếm thời gian.

**Redis sử dụng chiến lược xóa nào?**

Redis sử dụng kết hợp giữa **Xóa định kỳ (Periodic Deletion) + Xóa lười (Lazy Deletion)**, đây cũng là lựa chọn của hầu hết các framework cache. Xóa định kỳ thân thiện với bộ nhớ, còn xóa lười thân thiện với CPU. Cả hai phối hợp nhịp nhàng giúp cân bằng hoàn hảo giữa hiệu năng CPU và dung lượng RAM.

Dưới đây là cơ chế hoạt động chi tiết của phương thức xóa định kỳ trong Redis:

Quá trình xóa định kỳ của Redis mang tính ngẫu nhiên (định kỳ lấy mẫu ngẫu nhiên một nhóm key có cài đặt TTL để kiểm tra), do đó nó không đảm bảo tất cả key hết hạn đều bị xóa ngay lập tức. Điều này giải thích tại sao có những key đã quá hạn nhưng vẫn còn tồn tại trong Redis. Hơn nữa, Redis hạn chế thời gian thực thi và tần suất của thao tác xóa để giảm thiểu ảnh hưởng đến thời gian chiếm dụng CPU.

Ngoài ra, xóa định kỳ còn chịu sự điều tiết của thời gian thực thi và tỷ lệ key hết hạn:

- Nếu thời gian thực thi vượt quá ngưỡng cho phép, Redis sẽ ngắt vòng lặp xóa định kỳ lần đó để tránh lạm dụng CPU.
- Nếu trong mẫu kiểm tra, tỷ lệ key đã hết hạn vượt quá một ngưỡng nhất định, Redis sẽ tiếp tục lặp lại quy trình xóa để dọn dẹp triệt để hơn. Ngược lại, nếu tỷ lệ key hết hạn dưới ngưỡng, vòng lặp sẽ dừng lại để tránh tốn công vô ích mà không thu hồi được bao nhiêu bộ nhớ.

Ở phiên bản Redis 7.2, ngưỡng thời gian thực thi là **25ms**, ngưỡng tỷ lệ key hết hạn được đặt là **10%**.

```c
#define ACTIVE_EXPIRE_CYCLE_FAST_DURATION 1000 /* Microseconds (Micro-giây) */
#define ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC 25 /* Phần trăm tối đa của CPU được phép sử dụng */
#define ACTIVE_EXPIRE_CYCLE_ACCEPTABLE_STALE 10 /* % key hết hạn chấp nhận được, vượt mức này sẽ nỗ lực dọn dẹp thêm */
```

**Số lượng kiểm tra ngẫu nhiên mỗi lần là bao nhiêu?**

Trong file `expire.c` có định nghĩa số lượng lấy mẫu ngẫu nhiên mỗi lần, phiên bản Redis 7.2 là 20, nghĩa là mỗi lần kiểm tra sẽ chọn ngẫu nhiên 20 key có cài đặt thời gian hết hạn để đánh giá.

```c
#define ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP 20 /* Số key cho mỗi vòng lặp DB */
```

**Điều khiển tần suất xóa định kỳ như thế nào?**

Trong Redis, tần suất xóa định kỳ được điều khiển bởi tham số **hz**. Giá trị mặc định của `hz` là 10, đại diện cho việc thực thi 10 lần mỗi giây, tức mỗi giây sẽ có 10 lần thử tìm và xóa các key hết hạn.

Dải giá trị của `hz` từ 1 đến 500. Tăng giá trị `hz` sẽ nâng cao tần suất xóa định kỳ. Nếu muốn dọn dẹp thường xuyên hơn, bạn có thể tăng nhẹ giá trị này, nhưng sẽ làm tăng mức sử dụng CPU. Theo khuyến nghị chính thức của Redis, không nên để `hz` vượt quá 100, và với đại đa số người dùng thì mức mặc định 10 là hoàn toàn đủ dùng.

Dưới đây là phần chú thích chính thức về tham số `hz`, tôi đã dịch các thông tin quan trọng (Redis phiên bản 7.2).

![redis.conf chú thích cho hz](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis.conf-hz-262948fc.png)

Một tham số tương tự là **dynamic-hz**, khi bật tham số này Redis sẽ tự động tính toán một giá trị hz thích ứng dựa trên tải thực tế. Redis cung cấp và mặc định kích hoạt khả năng dùng giá trị hz tự điều chỉnh này.

Hai tham số này đều nằm trong file cấu hình `redis.conf`:

```properties
# Mặc định là 10
hz 10
# Mặc định bật
dynamic-hz yes
```

Nói thêm, ngoài tác vụ xóa định kỳ key hết hạn, Redis còn có các tác vụ định kỳ khác như đóng các kết nối client bị timeout, cập nhật số liệu thống kê... tần suất thực thi của các tác vụ này cũng do tham số `hz` quyết định.

**Tại sao xóa định kỳ không xóa sạch toàn bộ các key hết hạn?**

Làm như vậy sẽ gây ảnh hưởng quá lớn tới hiệu năng. Nếu số lượng key trong hệ thống cực kỳ đồ sộ, việc duyệt qua từng key để kiểm tra sẽ vô cùng tốn thời gian, làm nghẽn toàn bộ hệ thống. Redis thiết kế chiến lược này để cân bằng giữa bộ nhớ và hiệu năng.

**Tại sao khi một key hết hạn, Redis không lập tức xóa ngay? Như vậy chẳng phải lãng phí bộ nhớ sao?**

Bởi vì việc đó rất khó thực hiện hiệu quả, hay nói đúng hơn là chi phí quá đắt đỏ. Giả sử ta dùng hàng đợi trễ làm chiến lược xóa:

1. Bản thân hàng đợi tốn tài nguyên rất lớn: Khi có hàng triệu key, một hàng đợi trễ có thể không chứa nổi.
2. Việc bảo trì hàng đợi trễ rất phức tạp: Mỗi lần sửa TTL của key lại phải cập nhật vị trí của nó trong hàng đợi, đồng thời phải đưa thêm cơ chế kiểm soát đồng thời (concurrency control).

### Xử lý thế nào khi một lượng lớn key hết hạn cùng một thời điểm?

Khi trong Redis có một lượng lớn key cùng hết hạn tại một mốc thời gian, có thể dẫn đến các vấn đề sau:

- **Độ trễ request tăng vọt**: Redis phải tiêu tốn tài nguyên CPU để xử lý xóa key hết hạn, nếu số lượng key quá lớn sẽ khiến tỷ lệ chiếm dụng CPU của Redis tăng cao, từ đó ảnh hưởng đến tốc độ xử lý các request khác, gây ra tình trạng nghẽn và tăng độ trễ.
- **Chiếm dụng bộ nhớ quá cao**: Các key hết hạn dù đã vô hiệu nhưng trước khi được Redis thực sự dọn dẹp, chúng vẫn chiếm dụng RAM. Nếu không được dọn dẹp kịp thời, dung lượng RAM chiếm dụng sẽ ở mức cao, thậm chí kích hoạt OOM.

Để phòng tránh các vấn đề này, có thể áp dụng các giải pháp sau:

1. **Hạn chế để key hết hạn tập trung**: Khi thiết lập thời gian hết hạn cho key, hãy thêm một khoảng thời gian ngẫu nhiên (jitter/random TTL).
2. **Bật cơ chế lazy free**: Chỉnh sửa file cấu hình `redis.conf`, đặt tham số `lazyfree-lazy-expire` thành `yes`. Khi bật lazy free, Redis sẽ xóa bất đồng bộ các key hết hạn ở luồng nền (background thread), không làm nghẽn main thread, từ đó giảm thiểu tác động đến hiệu năng của Redis.

### Bạn có hiểu về chính sách đào thải bộ nhớ (Memory Eviction Policy) trong Redis không?

> Câu hỏi liên quan: MySQL có 20 triệu bản ghi, Redis chỉ lưu được 200 nghìn bản ghi, làm sao đảm bảo dữ liệu trong Redis đều là dữ liệu nóng (hot data)?

Chính sách đào thải bộ nhớ của Redis chỉ được kích hoạt khi dung lượng bộ nhớ đang sử dụng đạt tới ngưỡng tối đa được cấu hình. Ngưỡng này được định nghĩa qua tham số `maxmemory` trong `redis.conf`. Trên hệ điều hành 64-bit, `maxmemory` mặc định bằng 0, nghĩa là không giới hạn bộ nhớ. Trên hệ điều hành 32-bit, giá trị bộ nhớ tối đa mặc định là 3GB.

Bạn có thể dùng lệnh `config get maxmemory` để xem giá trị `maxmemory`.

```bash
> config get maxmemory
maxmemory
0
```

Redis cung cấp 6 chính sách đào thải bộ nhớ cơ bản:

1. **volatile-lru (least recently used)**: Chọn lọc và đào thải dữ liệu ít được sử dụng gần đây nhất từ tập hợp các key đã cài đặt thời gian hết hạn (`server.db[i].expires`).
2. **volatile-ttl**: Chọn lọc và đào thải dữ liệu sắp hết hạn nhất từ tập hợp các key đã cài đặt thời gian hết hạn (`server.db[i].expires`).
3. **volatile-random**: Chọn ngẫu nhiên dữ liệu để đào thải từ tập hợp các key đã cài đặt thời gian hết hạn (`server.db[i].expires`).
4. **allkeys-lru (least recently used)**: Đào thải dữ liệu ít được sử dụng gần đây nhất từ toàn bộ tập hợp key (`server.db[i].dict`).
5. **allkeys-random**: Chọn ngẫu nhiên dữ liệu để đào thải từ toàn bộ tập hợp key (`server.db[i].dict`).
6. **no-eviction** (chính sách mặc định): Cấm trục xuất dữ liệu. Khi bộ nhớ không đủ để ghi dữ liệu mới, mọi thao tác ghi mới sẽ báo lỗi.

Từ phiên bản 4.0 bổ sung thêm 2 chính sách:

7. **volatile-lfu (least frequently used)**: Chọn lọc và đào thải dữ liệu có tần suất sử dụng thấp nhất từ tập hợp các key đã cài đặt thời gian hết hạn (`server.db[i].expires`).
8. **allkeys-lfu (least frequently used)**: Đào thải dữ liệu có tần suất sử dụng thấp nhất từ toàn bộ tập hợp key (`server.db[i].dict`).

`allkeys-xxx` biểu thị việc đào thải trên toàn bộ các key, còn `volatile-xxx` biểu thị việc đào thải chỉ diễn ra trên các key có cài đặt thời gian hết hạn.

Trong file `config.c` có định nghĩa mảng enum cho các chính sách đào thải bộ nhớ:

```c
configEnum maxmemory_policy_enum[] = {
    {"volatile-lru", MAXMEMORY_VOLATILE_LRU},
    {"volatile-lfu", MAXMEMORY_VOLATILE_LFU},
    {"volatile-random",MAXMEMORY_VOLATILE_RANDOM},
    {"volatile-ttl",MAXMEMORY_VOLATILE_TTL},
    {"allkeys-lru",MAXMEMORY_ALLKEYS_LRU},
    {"allkeys-lfu",MAXMEMORY_ALLKEYS_LFU},
    {"allkeys-random",MAXMEMORY_ALLKEYS_RANDOM},
    {"noeviction",MAXMEMORY_NO_EVICTION},
    {NULL, 0}
};
```

Bạn có thể dùng lệnh `config get maxmemory-policy` để kiểm tra chính sách đào thải bộ nhớ hiện tại của Redis.

```bash
> config get maxmemory-policy
maxmemory-policy
noeviction
```

Có thể dùng lệnh `config set maxmemory-policy <tên_chính_sách>` để thay đổi chính sách đào thải ngay lập tức, tuy nhiên cách này sẽ mất hiệu lực khi khởi động lại Redis. Muốn duy trì lâu dài, bạn cần sửa tham số `maxmemory-policy` trong `redis.conf` và khởi động lại Redis để cấu hình có hiệu lực.

```properties
maxmemory-policy noeviction
```

Để xem giải thích chi tiết về các chính sách đào thải, bạn có thể tham khảo tài liệu chính thức của Redis: <https://redis.io/docs/reference/eviction/>.

## Tài liệu tham khảo

- "Redis Development and Operations" (Redis Phát triển và Vận hành)
- "Redis Design and Implementation" (Redis Thiết kế và Triển khai)
- "Redis Core Principles and Practice" (Nguyên lý cốt lõi và thực chiến Redis)
- Cẩm nang tra cứu lệnh Redis: <https://www.redis.com.cn/commands.html>
- Cẩm nang toàn diện sử dụng RediSearch: <https://mp.weixin.qq.com/s/FA4XVAXJksTOHUXMsayy2g>
- WHY Redis choose single thread (vs multi threads): [https://medium.com/@jychen7/sharing-redis-single-thread-vs-multi-threads-5870bd44d153](https://medium.com/@jychen7/sharing-redis-single-thread-vs-multi-threads-5870bd44d153)
