---
title: Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng Cache
description: Giải thích chuyên sâu về tư tưởng cốt lõi của Cache, sự khác biệt giữa Local Cache và Distributed Cache, cùng thiết kế kiến trúc Multi-Level Cache. Bao phủ các giải pháp Cache phổ biến như Caffeine, Redis và giải pháp đảm bảo tính nhất quán Cache (Cache Consistency), phù hợp cho lập trình viên Java học thiết kế kiến trúc Cache.
category: Cơ sở dữ liệu
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Cache,Local Cache,Distributed Cache,Multi-Level Cache,Caffeine,Redis,Tính nhất quán Cache,Thiết kế hệ thống,Java Cache,Guava Cache
lang: vi
sourceRef: zh-ref/database/redis/cache-basics.md
---

> **Câu hỏi phỏng vấn liên quan**:
>
> - Vì sao phải dùng Cache?
> - Nên triển khai Local Cache như thế nào?
> - Vì sao cần Distributed Cache? / Vì sao không dùng thẳng Local Cache?
> - Vì sao phải dùng Multi-Level Cache (Cache đa tầng)?
> - Multi-Level Cache phù hợp với những kịch bản nghiệp vụ nào?

## Tư tưởng cơ bản của Cache

Nhiều bạn chỉ biết rằng Cache có thể cải thiện hiệu năng hệ thống và giảm **Response Time** (thời gian phản hồi) của request, nhưng lại chưa thực sự rõ tư tưởng bản chất của Cache là gì.

Tư tưởng cơ bản của Cache thật ra rất đơn giản: đó chính là việc vận dụng chiến lược tối ưu hiệu năng kinh điển mà chúng ta rất quen thuộc — **đánh đổi không gian lấy thời gian (Space-for-Time)**. Đánh đổi không gian lấy thời gian nghĩa là dùng thêm không gian lưu trữ để chứa các dữ liệu có khả năng được sử dụng hoặc tính toán lặp lại, từ đó giảm thời gian lấy lại hoặc tính toán lại dữ liệu.

Nói đến đánh đổi không gian lấy thời gian, ngoài Cache ra, bạn còn nghĩ được ví dụ nào khác không? Dưới đây là một vài ví dụ phổ biến:

- **Index**: Index là cách tổ chức một số cột hoặc trường trong bảng cơ sở dữ liệu theo quy tắc sắp xếp nhất định thành một cấu trúc dữ liệu riêng; tuy tốn thêm dung lượng lưu trữ nhưng có thể nâng cao đáng kể hiệu quả tìm kiếm và giảm chi phí sắp xếp dữ liệu.
- **Dư thừa cột trong bảng cơ sở dữ liệu (Denormalization)**: Lưu dư thừa dữ liệu thường xuyên phải `JOIN` vào cùng một bảng để giảm truy vấn kết nối nhiều bảng, qua đó cải thiện hiệu năng truy vấn và giảm áp lực cho cơ sở dữ liệu.
- **CDN (Content Delivery Network — Mạng phân phối nội dung)**: Phân phối tài nguyên tĩnh đến nhiều node biên (edge node) để truy cập ở nơi gần nhất, từ đó tăng tốc độ truy cập tài nguyên tĩnh và giảm tải cho máy chủ gốc cũng như băng thông.

Lập trình cần biết tổng hợp và hệ thống hóa, xâu chuỗi những kiến thức đã học lại với nhau! Nếu khi phỏng vấn bạn liên hệ được những điểm này, chắc chắn nhà tuyển dụng sẽ có ấn tượng rất tốt về bạn.

Đừng thần thánh hóa Cache quá mức, mặc dù hiệu quả tối ưu hiệu năng hệ thống trên chi phí bỏ ra của nó thực sự rất cao. Khi học và áp dụng Cache, bạn sẽ nhận ra tư tưởng của Cache thực chất được sử dụng rộng rãi trong CPU, hệ điều hành và nhiều nơi khác.

Ví dụ, **CPU Cache** lưu đệm dữ liệu của RAM để giải quyết bài toán chênh lệch giữa tốc độ xử lý của **CPU** và tốc độ truy cập RAM; còn RAM thì lưu đệm dữ liệu của ổ cứng để giải quyết vấn đề tốc độ **I/O** ổ cứng quá chậm.

![Sơ đồ mô hình CPU Cache](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-f9ad1aa3.png)

Một ví dụ khác: để tăng tốc độ chuyển đổi từ địa chỉ ảo (Virtual Address) sang địa chỉ vật lý (Physical Address), hệ điều hành đã bổ sung **Translation Lookaside Buffer (TLB)** trên nền tảng cơ chế bảng trang (Page Table).

![Dịch địa chỉ sau khi bổ sung TLB](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/physical-virtual-address-translation-mmu-c9371c91.png)

Lấy ví dụ gần gũi với trình duyệt web hằng ngày: nó sẽ lưu đệm các hình ảnh hoặc tệp tĩnh đã truy cập (Browser Cache), nhờ vậy lần sau truy cập lại cùng trang đó tốc độ tải sẽ nhanh hơn rõ rệt.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/chrome-clear-cache-50690555.png)

Các loại Cache chúng ta dùng trong phát triển hằng ngày thường lưu dữ liệu trong **RAM** (bộ nhớ chính), tốc độ truy cập cực nhanh. Để tránh dữ liệu trong bộ nhớ bị mất khi khởi động lại hoặc gặp sự cố sập nguồn, nhiều middleware Cache (như **Redis**) cung cấp cơ chế bền vững dữ liệu ra đĩa (disk persistence). So với cơ sở dữ liệu quan hệ (như **MySQL**), tốc độ truy cập và khả năng chịu tải đồng thời của Cache cao hơn vài bậc độ lớn. Đặt thêm một tầng Cache phía trên cơ sở dữ liệu là biện pháp cốt lõi để bảo vệ tầng lưu trữ bên dưới và nâng cao thông lượng (throughput) của hệ thống.

## Phân loại Cache

Tiếp theo, hãy xem Cache được sử dụng trong phát triển hằng ngày thường được chia thành những loại nào.

### Local Cache

#### Local Cache là gì?

Trên thực tế loại này được dùng khá nhiều trong nhiều dự án, đặc biệt là với kiến trúc nguyên khối (Monolithic Architecture). Nếu lượng dữ liệu không lớn và không có yêu cầu phân tán, dùng Local Cache vẫn rất ổn.

Local Cache nằm ngay bên trong ứng dụng; ưu điểm lớn nhất của nó là nằm chung trong cùng một tiến trình (process) với ứng dụng, tốc độ truy cập Local Cache cực nhanh và không phát sinh chi phí mạng (network overhead).

Sơ đồ kiến trúc Monolith phổ biến như bên dưới: chúng ta dùng **Nginx** để làm **cân bằng tải (Load Balancing)**, triển khai hai bản sao ứng dụng giống hệt nhau lên máy chủ, cả hai service dùng chung một cơ sở dữ liệu và cùng sử dụng Local Cache riêng.

![Sơ đồ Local Cache](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/local-cache-6bcfccc4.png)

**Lưu ý:** Khi sử dụng Local Cache trong chế độ Cluster, bắt buộc phải cân nhắc **chiến lược cân bằng tải (Load Balancing Strategy)**. Nếu Nginx dùng **Round-Robin** mặc định, các request của cùng một người dùng sẽ rơi ngẫu nhiên vào các máy khác nhau, dẫn đến tỷ lệ hit (hit rate) của Local Cache cực thấp. Giải pháp như sau:

1. **Tầng Gateway**: Dùng Consistent Hashing hoặc Sticky Session để đảm bảo request của cùng một người dùng luôn được điều hướng cố định về cùng một máy.
2. **Tầng Application**: Chỉ dùng Local Cache cho dữ liệu **"hầu như không đổi trên toàn cục"** (như bảng từ điển cấu hình), chứ không dùng cho dữ liệu theo từng người dùng.

#### Có những giải pháp Local Cache nào?

**1. `HashMap` và `ConcurrentHashMap` có sẵn trong JDK.**

`ConcurrentHashMap` có thể xem là phiên bản an toàn luồng (thread-safe) của `HashMap`, cả hai đều lưu cặp key/value. Tuy nhiên, phần lớn kịch bản sẽ không dùng hai lớp này trực tiếp làm Cache, vì chúng chỉ cung cấp khả năng lưu trữ chứ không có các tính năng như thời gian hết hạn (expiration time). Một framework Cache tương đối hoàn chỉnh tối thiểu phải cung cấp đủ ba yếu tố: **thời gian hết hạn**, **cơ chế loại bỏ (eviction)** và **thống kê tỷ lệ hit (hit rate)**.

**2. `Ehcache`, `Guava Cache`, `Spring Cache` là ba framework Local Cache được dùng khá phổ biến.**

- `Ehcache` nặng nề hơn so với hai framework còn lại. Tuy nhiên, so với `Guava Cache` và `Spring Cache`, `Ehcache` hỗ trợ nhúng vào Hibernate và MyBatis như một tầng Cache đa cấp, có thể lưu dữ liệu Cache xuống ổ đĩa cục bộ, đồng thời cũng cung cấp giải pháp Cluster (nhưng khá mờ nhạt, có thể bỏ qua).
- `Guava Cache` và `Spring Cache` khá giống nhau. `Guava` được dùng nhiều hơn một chút so với `Spring Cache`, nó cung cấp API rất tiện lợi cũng như các tính năng như thiết lập thời gian hiệu lực của Cache. Triển khai bên trong của nó cũng khá gọn gàng, nhiều chỗ có tư tưởng tương đồng với `ConcurrentHashMap`.
- Dùng annotation của `Spring Cache` để triển khai Cache giúp code trông rất sạch và tinh gọn, nhưng rất dễ gặp các vấn đề như Cache Penetration hay tràn bộ nhớ (`OOM`).

**3. Ngôi sao mới nổi Caffeine.**

So với `Guava`, `Caffeine` vượt trội hơn trên mọi phương diện như hiệu năng, nên nhìn chung được khuyến nghị dùng thay thế cho `Guava`. Hơn nữa, cách sử dụng của `Guava` và `Caffeine` rất giống nhau!

Ví dụ code dùng `Caffeine` để tạo Local Cache, áp dụng Builder Pattern:

```java
// Ví dụ tạo Local Cache bằng Caffeine
Cache<String, String> cache = Caffeine.newBuilder()
        // Thiết lập hết hạn sau 60 ngày kể từ lúc ghi
        .expireAfterWrite(60, TimeUnit.DAYS)
        // Dung lượng khởi tạo ban đầu
        .initialCapacity(100)
        // Giới hạn số lượng phần tử tối đa
        .maximumSize(500)
        // Bật tính năng thống kê
        .recordStats()
        .build();
```

#### Local Cache có những điểm đau (pain points) nào?

Ưu điểm của Local Cache rất rõ ràng: **ít phụ thuộc**, **nhẹ**, **đơn giản**, **chi phí thấp**.

Tuy nhiên, Local Cache tồn tại các nhược điểm sau:

- **Gắn chặt với ứng dụng, không thân thiện với kiến trúc phân tán**: Ví dụ khi cùng một service được triển khai trên nhiều máy, Cache giữa các instance không thể chia sẻ cho nhau vì Local Cache chỉ tồn tại trên máy hiện tại.
- **Dung lượng Local Cache bị giới hạn rõ rệt bởi máy chủ triển khai service.** Nếu bản thân service hiện tại đã tiêu tốn nhiều bộ nhớ thì dung lượng bộ nhớ còn lại cho Local Cache sẽ rất ít.

### Distributed Cache

#### Distributed Cache là gì?

Chúng ta có thể xem Distributed Cache (Cache phân tán) là một dịch vụ cơ sở dữ liệu trên bộ nhớ (in-memory database service), với mục đích cuối cùng là cung cấp dịch vụ lưu trữ dữ liệu đệm.

Distributed Cache tồn tại độc lập tách rời khỏi ứng dụng; nhiều ứng dụng có thể trực tiếp dùng chung một dịch vụ Distributed Cache.

Như hình minh họa bên dưới, đây là một sơ đồ kiến trúc đơn giản sử dụng Distributed Cache: chúng ta dùng Nginx để cân bằng tải, triển khai hai bản sao ứng dụng giống nhau lên máy chủ, cả hai service dùng chung một cơ sở dữ liệu và một hệ thống Cache.

![Distributed Cache](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/distributed-cache-cfb344a2.png)

Sau khi sử dụng Distributed Cache, dịch vụ Cache có thể triển khai trên một máy chủ riêng biệt; ngay cả khi cùng một service được triển khai trên nhiều máy, tất cả vẫn dùng chung một tập dữ liệu Cache. Hơn nữa, hiệu năng, dung lượng và tính năng của một dịch vụ Distributed Cache chuyên biệt đều mạnh mẽ hơn rất nhiều.

**Trong thiết kế hệ thống phần mềm không có viên đạn bạc (no silver bullet); việc đưa bất kỳ công nghệ nào vào cũng giống như con dao hai lưỡi.** Dùng đúng cách sẽ mang lại lợi ích lớn cho hệ thống; ngược lại chỉ tốn công vô ích.

Nói một cách đơn giản, khi đưa Distributed Cache vào hệ thống thường sẽ kéo theo những vấn đề sau:

- **Độ phức tạp hệ thống tăng lên**: Sau khi thêm Cache, bạn phải duy trì tính nhất quán dữ liệu giữa Cache và cơ sở dữ liệu, quản lý hot cache key, đảm bảo tính sẵn sàng cao (High Availability) cho dịch vụ Cache, v.v.
- **Chi phí phát triển và vận hành hệ thống thường tăng lên**: Đưa Cache vào đồng nghĩa hệ thống cần một dịch vụ Cache riêng biệt, kéo theo chi phí tương ứng — và chi phí này khá đắt đỏ vì thứ bị tiêu tốn chính là bộ nhớ RAM quý giá.

#### Có những giải pháp Distributed Cache nào?

Về Distributed Cache, hai cái tên lâu đời và được sử dụng phổ biến vẫn là **Memcached** và **Redis**. Tuy nhiên, hiện nay hầu như không còn thấy dự án nào dùng **Memcached** làm Cache nữa, mà đều dùng thẳng **Redis**.

Memcached là lựa chọn khá phổ biến ở thời kỳ đầu khi Distributed Cache mới nổi lên. Về sau, cùng với sự phát triển của Redis, mọi người dần chuyển sang sử dụng Redis mạnh mẽ hơn nhiều.

Một số công ty công nghệ lớn cũng mã nguồn mở các cơ sở dữ liệu KV phân tán hiệu năng cao tương tự Redis, ví dụ như [Tendis](https://github.com/Tencent/Tendis) do Tencent phát hành. Tendis dựa trên storage engine mã nguồn mở nổi tiếng [RocksDB](https://github.com/facebook/rocksdb), tương thích 100% giao thức Redis và toàn bộ mô hình dữ liệu của Redis 4.0. Về so sánh giữa Redis và Tendis, phía Tencent từng đăng tải bài viết: [Redis vs Tendis: Giải mã kiến trúc phiên bản lưu trữ lai nóng-lạnh](https://mp.weixin.qq.com/s/MeYkfOIdnU6LYlsGb24KjQ), bạn có thể tham khảo qua.

Tuy nhiên, nhìn từ lịch sử commit trên GitHub của dự án Tendis, phiên bản mã nguồn mở của Tendis gần như không còn được bảo trì cập nhật nữa, cộng thêm mức độ quan tâm không cao và ít công ty sử dụng. Vì vậy, không khuyến nghị bạn dùng Tendis để triển khai Distributed Cache.

Hiện nay, các lựa chọn thay thế Redis được cộng đồng công nghiệp công nhận hơn cả là hai Distributed Cache mã nguồn mở sau (cả hai đều nổi lên nhờ so kè hiệu năng với Redis):

- [Dragonfly](https://github.com/dragonflydb/dragonfly): Một cơ sở dữ liệu trên bộ nhớ được thiết kế cho tải ứng dụng hiện đại, tương thích hoàn toàn API của Redis và Memcached, chuyển đổi sang không cần sửa bất kỳ dòng code nào, tự xưng là cơ sở dữ liệu trên bộ nhớ nhanh nhất thế giới.
- [KeyDB](https://github.com/Snapchat/KeyDB): Một nhánh (fork) hiệu năng cao của Redis, tập trung vào đa luồng (multithreading), hiệu suất bộ nhớ và thông lượng cao.

Dù vậy, cá nhân vẫn khuyến nghị ưu tiên hàng đầu là Redis cho Distributed Cache, bởi sau nhiều năm được kiểm chứng trên môi trường Production, hệ sinh thái của nó rất hoàn chỉnh và tài liệu cũng vô cùng đầy đủ.

### Multi-Level Cache

#### Multi-Level Cache là gì? Vì sao phải dùng?

Ở đây chúng ta chỉ trao đổi ngắn gọn về phương án Cache đa tầng **Local Cache + Distributed Cache**, đây cũng là cách triển khai Multi-Level Cache phổ biến nhất.

Đến đây chắc chắn sẽ có nhiều bạn đặt câu hỏi: **Đã dùng Distributed Cache rồi, sao vẫn còn phải dùng Local Cache nữa?**

Mặc dù Local Cache và Distributed Cache đều là Cache, nhưng tốc độ truy cập Local Cache nhanh hơn rất nhiều so với Distributed Cache, bởi vì truy cập Local Cache không phát sinh thêm chi phí mạng như chúng ta đã đề cập ở trên.

Tuy nhiên, trong trường hợp thông thường, chúng ta cũng **không** khuyến nghị dùng Multi-Level Cache vì nó làm tăng gánh nặng bảo trì (chẳng hạn bạn cần đảm bảo tính nhất quán dữ liệu giữa Cache tầng 1 và Cache tầng 2). Hơn nữa, mức cải thiện thực tế mà nó mang lại đối với đại đa số kịch bản nghiệp vụ thực chất không lớn.

Dưới đây là tóm tắt nhanh hai kịch bản nghiệp vụ phù hợp với Multi-Level Cache:

- Dữ liệu được Cache ít khi bị sửa đổi, tương đối ổn định;
- Lượng truy cập dữ liệu cực kỳ lớn, ví dụ như kịch bản Flash Sale (săn sale chớp nhoáng).

Trong mô hình Multi-Level Cache, Cache tầng thứ nhất (L1) dùng bộ nhớ cục bộ (ví dụ Caffeine), còn Cache tầng thứ hai (L2) dùng Cache phân tán (ví dụ Redis).

![Multi-Level Cache](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/multilevel-cache-c6b861f9.png)

Khi đọc dữ liệu Cache, chúng ta đọc từ L1 trước, nếu hit thì trả về ngay; khi L1 miss thì mới đọc tiếp từ L2. Nếu L2 hit, cần điền bù (backfill) dữ liệu vào L1 của instance hiện tại trước rồi mới trả về kết quả, tránh việc những lần L1 miss sau này lại tiếp tục gọi xuống L2. Nếu L2 cũng không có dữ liệu đó thì mới truy vấn cơ sở dữ liệu, sau khi truy vấn thành công thì ghi dữ liệu vào cả L1 và L2. Làm vậy giúp giảm số lần đọc xuống L2 và giảm áp lực cho L2.

Các thư viện mã nguồn mở triển khai Multi-Level Cache đáng tham khảo:

- [J2Cache](https://gitee.com/ld/J2Cache): Framework Cache Java hai tầng dựa trên bộ nhớ cục bộ và Redis.
- [JetCache](https://github.com/alibaba/jetcache): Framework Cache mã nguồn mở của Alibaba, hỗ trợ Multi-Level Cache, tự động làm mới Distributed Cache, TTL và nhiều tính năng khác.

#### Đảm bảo tính nhất quán của Multi-Level Cache như thế nào?

Multi-Level Cache thường được thiết kế theo hướng nhất quán cuối cùng (Eventual Consistency), cần xử lý riêng sự thay đổi ở hai chặng **DB → Redis** và **Redis → L1 của từng instance**. Chỉ xóa key trong Redis thì bản sao cục bộ trong các JVM khác vẫn có thể bị đọc ra; đặt TTL ngắn cho L1 giúp rút ngắn thời gian đọc dữ liệu cũ (stale data), nhưng không thể thay thế cơ chế thông báo vô hiệu hóa (invalidation notification).

Cơ chế thông báo phải đồng thời tính đến phạm vi phát tán và khả năng phục hồi khi lỗi:

- **Redis Pub/Sub** có thể broadcast thông báo vô hiệu hóa, nhưng chỉ áp dụng ngữ nghĩa gửi tối đa một lần (at-most-once delivery) — các message phát sinh trong lúc mất kết nối sẽ không được gửi bù sau khi kết nối lại. Cần kết hợp với TTL của L1, đồng thời xóa sạch Local Cache liên quan khi kết nối thông báo bị ngắt hoặc trạng thái không còn đáng tin cậy. Xem chi tiết tại [Ngữ nghĩa phân phối Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/#delivery-semantics).
- **Redis Stream hoặc Message Queue** có thể lưu trữ lâu dài (persist) message và hỗ trợ thử lại (retry), nhưng cần cấu hình đúng phạm vi broadcast. Ví dụ, nhiều consumer trong cùng một Stream Consumer Group sẽ chia nhau xử lý message, nên không thể dồn tất cả JVM vào cùng một group để thông báo tới mọi L1. Có thể để từng instance tự duy trì tiến độ tiêu thụ độc lập hoặc dùng Consumer Group riêng cho mỗi instance, đồng thời xử lý tình huống khởi động lại, tồn đọng message và thời gian lưu giữ message. Xem chi tiết tại [Ngữ nghĩa Consumer Group của XREADGROUP](https://redis.io/docs/latest/commands/xreadgroup/).
- **Redis Client Tracking** có thể thông báo cho client biết khi Redis key đang theo dõi bị thay đổi để vô hiệu hóa, nhưng nó không thể nhận biết các cập nhật trong cơ sở dữ liệu chưa được đồng bộ lên Redis. Client cũng phải xử lý đúng thứ tự giữa thông báo vô hiệu hóa và phản hồi đọc, tránh tình trạng "nhận thông báo vô hiệu hóa trước, rồi sau đó mới đưa phản hồi cũ đến muộn vào L1". Xem chi tiết tại [Tài liệu tham khảo Redis Client-Side Caching](https://redis.io/docs/latest/develop/reference/client-side-caching/).

Giải pháp của đội ngũ kỹ thuật Zhengcaiyun (Zcygov) là Canal + Broadcast MQ, xin tóm tắt nhanh như sau:

1. Sửa dữ liệu ở DB: Trước tiên thực hiện thay đổi dữ liệu trong cơ sở dữ liệu.
2. Lắng nghe message từ Canal để kích hoạt cập nhật Cache: Dùng Canal theo dõi thao tác thay đổi của cơ sở dữ liệu; khi phát hiện dữ liệu biến động thì kích hoạt cập nhật Cache.
3. Đồng bộ Redis Cache: Với Redis Cache, do cả Cluster chỉ dùng chung một bản dữ liệu nên đồng bộ thẳng vào Cache là được.
4. Đồng bộ Local Cache: Vì Local Cache nằm rải rác ở nhiều JVM instance khác nhau, cần nhờ cơ chế Broadcast Message Queue (MQ) để phát thông báo cập nhật tới tất cả các service instance, qua đó đồng bộ Local Cache.

Chi tiết xem tại: [Thiết kế và thực chiến hệ thống Multi-Level Cache phân tán](https://juejin.cn/post/7225634879152570405)

Quy trình kiểu này cũng cần quy ước rõ thứ tự message và hành vi điền bù (backfill): nếu L1 bị vô hiệu hóa trước trong khi Redis vẫn giữ giá trị cũ, request đọc có thể lại nạp giá trị cũ vào L1; nếu message mang theo toàn bộ dữ liệu để cập nhật thì còn phải ngăn phiên bản cũ đến muộn ghi đè phiên bản mới. Có thể thiết kế cơ chế bù trừ xoay quanh kiểm tra số phiên bản nghiệp vụ (business version), thử lại vô hiệu hóa và TTL — tuyệt đối không được đánh đồng việc "đã nhận được thông báo" với việc "mọi tầng đã đồng bộ xong".

#### Bên ghi xóa Cache, bên đọc chỉ chờ làm mới định kỳ thì sẽ có vấn đề gì?

Khi áp dụng Cache Aside, **xóa Cache và đọc lại từ nguồn gốc (origin backfill) khi miss là bộ quy ước đọc-ghi đi đôi với nhau**. Nếu bên đọc chỉ đọc từ Cache, thao tác xóa có thể trực tiếp khiến dữ liệu nghiệp vụ tạm thời không khả dụng.

Ví dụ, dịch vụ hiển thị sự kiện dùng L1 và Redis để lưu cấu hình sự kiện, còn tác vụ chạy nền sẽ định kỳ làm mới Redis. Khi trang quản trị chỉnh sửa cấu hình rồi xóa giá trị cũ trong Redis, nhưng dịch vụ hiển thị lại trả về kết quả rỗng ngay khi cả hai tầng Cache đều miss. Khi đó, dù bản ghi cấu hình luôn tồn tại trong cơ sở dữ liệu, từ lúc L1 hết hạn cho tới khi đợt làm mới tiếp theo hoàn tất, trang hiển thị vẫn có thể báo "sự kiện không tồn tại".

Trường hợp này cần bổ sung hoàn chỉnh cách xử lý khi Cache miss:

- **Cho phép gọi về nguồn gốc theo nhu cầu (on-demand origin backfill)**: Khi cả L1 và Redis đều miss, dịch vụ hiển thị hoặc một dịch vụ dữ liệu thống nhất sẽ truy vấn DB và dựng lại Cache; gộp các request tải đồng thời (coalescing) đối với cùng một hot key để tránh lượng lớn request cùng lúc đánh thẳng xuống DB.
- **Cấm tuyệt đối truy vấn DB trên luồng request đọc**: Thì phải thiết kế cơ chế làm mới chủ động đáng tin cậy, thử lại khi làm mới thất bại và hành vi giáng cấp (fallback/degradation) khi miss. Nếu nghiệp vụ chấp nhận dùng tạm cấu hình cũ trong thời gian ngắn, có thể giữ lại bản sao cũ có giới hạn độ trễ tối đa; không thể coi việc "xóa xong rồi chờ lượt job tiếp theo" là một phương án hoàn chỉnh.

Ngoài ra cần phân biệt rõ giữa **Cache miss, cơ sở dữ liệu xác nhận không tồn tại, và lỗi truy cập Cache**. Chỉ khi truy vấn cơ sở dữ liệu xác nhận bản ghi không tồn tại mới thích hợp ghi dấu hiệu rỗng (null marker) với TTL ngắn; nếu coi việc Redis timeout hoặc thiếu Cache là "dữ liệu nghiệp vụ không tồn tại", bạn có thể vô tình lưu đệm luôn cả lỗi tạm thời đó.

Khi nhiều ứng dụng dùng chung Cache, cần thống nhất instance, logical DB, tiền tố key (key prefix), định dạng tuần tự hóa (serialization format) và trách nhiệm cập nhật. Khi điều tra sự cố theo chu kỳ, có thể đối chiếu mốc thời gian báo lỗi với lịch chạy tác vụ định kỳ, TTL, log xóa và log backfill. Chi tiết về thứ tự đọc-ghi và cơ chế bù trừ khi lỗi xem tại [Giải thích chi tiết 3 chiến lược đọc ghi Cache thường dùng](./3-commonly-used-cache-read-and-write-strategies.md).

## Đọc thêm về cấu trúc dữ liệu

Các bài toán Cache thường dẫn sâu xuống cấu trúc dữ liệu cụ thể:

- [Giải thích chi tiết Bloom Filter](../../cs-basics/data-structure/bloom-filter.md): Hiểu về Cache Penetration, tỷ lệ dương tính giả (false positive rate) và khó khăn khi xóa phần tử.
- [Tổng hợp câu hỏi phỏng vấn LRU Cache](../../cs-basics/data-structure/lru-cache.md): Hiểu chiến lược loại bỏ Cache cục bộ, cách viết với `LinkedHashMap` và tư tưởng thay thế trang (page replacement).
- [Tổng hợp câu hỏi phỏng vấn Hash Table](../../cs-basics/data-structure/hash-table.md): Hiểu ánh xạ Cache key, xung đột băm (Hash Collision) và mở rộng dung lượng (`resize`).

## Tài liệu tham khảo

- Những điều cần biết về Cache (Meituan Tech): https://tech.meituan.com/2017/03/17/cache-about.html
- Phân tích thiết kế Cache trong hệ thống phân tán: https://segmentfault.com/a/1190000041689802
