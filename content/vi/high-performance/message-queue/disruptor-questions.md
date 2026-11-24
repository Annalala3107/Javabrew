---
title: "Tổng hợp câu hỏi phỏng vấn thường gặp về Disruptor"
description: "Bài viết tổng hợp các kiến thức cốt lõi và trọng tâm phỏng vấn về hàng đợi bộ nhớ hiệu năng cao Disruptor, bao gồm kiến trúc Disruptor (RingBuffer/Sequencer/WaitStrategy), nguyên lý đạt hiệu năng cao (thiết kế Lock-free/đệm dòng Cache/cấp phát bộ nhớ trước), so sánh với ArrayBlockingQueue, mô hình Producer-Consumer..."
category: Hiệu năng cao (High Performance)
tag:
  - Message Queue
head:
  - - meta
    - name: keywords
      content: Disruptor,Hàng đợi hiệu năng cao,RingBuffer,Lock-Free Queue,Cache Line Padding,LMAX,In-Memory Queue,Phỏng vấn Disruptor
lang: vi
sourceRef: zh-ref/high-performance/message-queue/disruptor-questions.md
---

Disruptor là một chủ đề tương đối ít phổ biến hơn so với các MQ phân tán, nhưng nếu trong kinh nghiệm dự án của bạn có sử dụng Disruptor thì rất có thể bạn sẽ bị hỏi trong buổi phỏng vấn.

Trong bài chia sẻ kinh nghiệm phỏng vấn (tuyển dụng ứng viên có kinh nghiệm) do một thành viên cộng đồng gửi về trước đây cũng có đề cập một số câu hỏi về Disruptor, đường dẫn bài viết: [Ước mơ thành hiện thực! Trúng tuyển hàng loạt tập đoàn lớn như ByteDance, Taobao, Pinduoduo!](https://mp.weixin.qq.com/s/C5QMjwEb6pzXACqZsyqC4A).

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/disruptor-interview-questions-7b03082f.png)

Bạn có thể xem bài viết này như một bản tổng hợp ngắn gọn về Disruptor; mỗi câu hỏi sẽ không đi quá sâu vào chi tiết phức tạp, chủ yếu phục vụ ôn luyện phỏng vấn hoặc nắm nhanh kiến thức nền về Disruptor.

## Disruptor là gì?

Disruptor là một hàng đợi bộ nhớ (In-Memory Queue) hiệu năng cao mã nguồn mở do công ty giao dịch ngoại hối LMAX (Anh Quốc) phát triển, ra đời nhằm giải quyết các bài toán về hiệu năng và an toàn bộ nhớ của hàng đợi trong bộ nhớ.

Theo giới thiệu chính thức từ Disruptor, hệ thống LMAX (nền tảng giao dịch tài chính bán lẻ thế hệ mới) được phát triển dựa trên Disruptor có thể xử lý tới 6 triệu đơn hàng mỗi giây chỉ với một luồng đơn (Single Thread). Năm 2011, Martin Fowler từng viết bài [The LMAX Architecture](https://martinfowler.com/articles/lmax.html) giới thiệu chuyên sâu về kiến trúc của hệ thống LMAX này; nếu hứng thú bạn có thể tìm đọc.

Sau bài thuyết trình của LMAX tại hội nghị QCon năm 2010, Disruptor nhanh chóng thu hút sự chú ý của toàn ngành và giành giải thưởng chính thức Duke's Choice Awards của Oracle năm 2011.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/640-ace7512f.png)

> "Duke's Choice Awards" nhằm vinh danh những ứng dụng công nghệ Java có sức ảnh hưởng lớn nhất trong năm qua do cá nhân hoặc tổ chức trên toàn cầu phát triển, được tập đoàn Oracle tổ chức. Giải thưởng này có giá trị chuyên môn rất cao!

Tôi đã tìm lại bài viết chính thức của Oracle công bố các dự án đoạt giải Duke's Choice Awards năm đó (đường dẫn bài viết: <https://blogs.oracle.com/java/post/and-the-winners-arethe-dukes-choice-award>). Từ bài viết có thể thấy cùng năm đó còn có những dự án lừng danh như Netty, JRebel cũng nhận được vinh dự này.

![Giải thưởng chính thức Duke's Choice Awards năm 2011 của Oracle](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211015152323898-b9c97800.png)

Các tính năng mà Disruptor cung cấp có nét tương đồng với những hàng đợi phân tán như Kafka hay RocketMQ, tuy nhiên phạm vi hoạt động của nó nằm bên trong một JVM (bộ nhớ RAM).

- Địa chỉ GitHub: <https://github.com/LMAX-Exchange/disruptor>
- Hướng dẫn chính thức: <https://lmax-exchange.github.io/disruptor/user-guide/index.html>

Về cách sử dụng Disruptor trong dự án Spring Boot, bạn có thể tham khảo bài viết: [Thực hành nhập môn Spring Boot + Disruptor](https://mp.weixin.qq.com/s/0iG5brK3bYF0BgSjX4jRiA).

## Tại sao nên dùng Disruptor?

Disruptor chủ yếu giải quyết vấn đề hiệu năng và an toàn bộ nhớ của các hàng đợi an toàn luồng (Thread-safe) tích hợp sẵn trong JDK.

**Các hàng đợi Thread-safe phổ biến trong JDK gồm:**

| Tên hàng đợi | Cơ chế khóa (Lock) | Có giới hạn kích thước (Bounded)? |
| --- | --- | --- |
| `ArrayBlockingQueue` | Có khóa (`ReentrantLock`) | Có giới hạn (Bounded) |
| `LinkedBlockingQueue` | Có khóa (`ReentrantLock`) | Có giới hạn (Bounded) |
| `LinkedTransferQueue` | Không khóa (`CAS`) | Không giới hạn (Unbounded) |
| `ConcurrentLinkedQueue` | Không khóa (`CAS`) | Không giới hạn (Unbounded) |

Từ bảng trên có thể thấy: các hàng đợi này hoặc là dùng khóa và có giới hạn, hoặc là không khóa nhưng lại không giới hạn. Hàng đợi dùng khóa chắc chắn sẽ ảnh hưởng đến hiệu năng, còn hàng đợi không giới hạn lại tiềm ẩn nguy cơ tràn bộ nhớ (`OOM`).

Vì vậy, trong các kịch bản đòi hỏi hiệu năng cực cao, thông thường chúng ta không khuyến nghị dùng trực tiếp các hàng đợi Thread-safe tích hợp sẵn của JDK.

**Disruptor thì khác hẳn! Nó vừa không dùng khóa (Lock-free) vừa đảm bảo hàng đợi có giới hạn kích thước, mà vẫn an toàn luồng (Thread-safe).**

Biểu đồ dưới đây lấy từ trang chủ Disruptor, so sánh độ trễ (Latency Histogram) giữa Disruptor và `ArrayBlockingQueue`.

![disruptor-latency-histogram](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/disruptor-latency-histogram-59e1549c.png)

Disruptor thực sự rất nhanh; lý do vì sao nó nhanh đến vậy sẽ được giải thích ở phần sau.

Ngoài ra, Disruptor còn cung cấp nhiều tính năng mở rộng phong phú như hỗ trợ xử lý theo lô (Batch) và đa dạng các chiến lược chờ (Wait Strategy).

## Kafka và Disruptor khác nhau như thế nào?

- **Kafka**: Message Queue phân tán, thường dùng để truyền tải message giữa các hệ thống hoặc giữa các service, đồng thời có thể dùng làm nền tảng xử lý luồng (Stream Processing).
- **Disruptor**: Hàng đợi message ở cấp độ bộ nhớ, thường dùng để truyền tải message giữa các Thread bên trong một hệ thống.

Hai công nghệ này giải quyết bài toán ở hai tầng hoàn toàn khác nhau:

| Tiêu chí so sánh | Kafka / RocketMQ / RabbitMQ | Disruptor |
| --- | --- | --- |
| Phạm vi sử dụng | Liên tiến trình, liên máy chủ, liên service | Trong nội bộ một tiến trình JVM đơn lẻ |
| Có lưu trữ bền vững? | Thường có hỗ trợ | Không đảm nhận lưu trữ bền vững |
| Có hỗ trợ phát lại (Replay)? | Thường có hỗ trợ | Không đảm nhận phát lại dữ liệu lịch sử |
| Năng lực trọng tâm | Giao tin tin cậy, cắt đỉnh tải, tách ghép nối, Consumer Group | Độ trễ thấp, ít tranh chấp khóa, xử lý sự kiện thông lượng cao |
| Kịch bản điển hình | Sự kiện đơn hàng, thu thập log, tách ghép nối bất đồng bộ | Ghi log bất đồng bộ, khớp lệnh (matching), pipeline nội bộ tiến trình |

Do đó, Disruptor không thể thay thế các Message Queue phân tán như Kafka hay RocketMQ. Nó phù hợp hơn khi đặt bên trong một service để tăng tốc một tuyến xử lý sự kiện tần suất cao.

## Những thành phần nào đã sử dụng Disruptor?

Số lượng dự án mã nguồn mở ứng dụng Disruptor khá nhiều, dưới đây là một vài ví dụ tiêu biểu:

- **Log4j2**: Một framework ghi log rất phổ biến, hiện thực hóa tính năng ghi log bất đồng bộ dựa trên Disruptor.
- **SOFATracer**: Công cụ truy vết luồng gọi phân tán mã nguồn mở của Ant Financial, sử dụng Disruptor để ghi log bất đồng bộ.
- **Storm**: Hệ thống tính toán thời gian thực phân tán mã nguồn mở, dùng Disruptor để truyền tin nội bộ bên trong worker process (giữa các Thread trên cùng một node Storm mà không cần truyền qua mạng).
- **HBase**: Hệ quản trị cơ sở dữ liệu hướng cột phân tán, dựa vào Disruptor để nâng cao hiệu năng ghi đồng thời.
- ……

## Các khái niệm cốt lõi của Disruptor gồm những gì?

- **Event**: Bạn có thể hiểu `Event` là đối tượng message nằm trong hàng đợi đang chờ được tiêu thụ.
- **EventFactory**: Nhà máy tạo sự kiện, dùng để sinh ra đối tượng `Event`, cần truyền vào khi khởi tạo lớp `Disruptor`.
- **EventHandler**: `Event` sẽ được xử lý trong `EventHandler` tương ứng; bạn có thể coi nó là Consumer trong mô hình Producer-Consumer.
- **EventProcessor**: `EventProcessor` nắm giữ `Sequence` của một Consumer cụ thể và cung cấp vòng lặp sự kiện (Event Loop) để gọi hàm xử lý sự kiện.
- **Disruptor**: Việc sản sinh và tiêu thụ sự kiện đều thao tác thông qua đối tượng `Disruptor`.
- **RingBuffer**: `RingBuffer` (mảng vòng) dùng để lưu trữ các `Event`.
- **WaitStrategy**: Chiến lược chờ, quyết định cách Consumer chờ sự kiện mới đến khi chưa có sự kiện nào để tiêu thụ.
- **Producer**: Chỉ chung đoạn mã phía người dùng gọi đối tượng `Disruptor` để phát hành sự kiện; bản thân Disruptor không định nghĩa interface hay kiểu cụ thể nào cho Producer.
- **ProducerType**: Chỉ định chế độ một người phát hành sự kiện đơn lẻ hay nhiều người phát hành sự kiện ("Publisher" và "Producer" mang nghĩa tương tự nhau, cá nhân tôi thích gọi là Publisher hơn).
- **Sequencer**: Trái tim thực sự của Disruptor. Interface này có hai lớp triển khai là `SingleProducerSequencer` và `MultiProducerSequencer`, định nghĩa thuật toán đồng thời giúp truyền dữ liệu nhanh chóng và chính xác giữa Producer và Consumer.

Hình dưới đây trích từ trang chủ Disruptor, minh họa ví dụ hệ thống LMAX sử dụng Disruptor.

![Ví dụ hệ thống LMAX sử dụng Disruptor](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/disruptor-models-14717ea7.png)

## Disruptor có những chiến lược chờ (WaitStrategy) nào?

**Chiến lược chờ (`WaitStrategy`)** quyết định Consumer sẽ chờ sự kiện mới như thế nào khi hiện tại không có sự kiện để xử lý.

Các chiến lược chờ phổ biến gồm:

![Các chiến lược chờ của Disruptor](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/DisruptorWaitStrategy-152c9c2f.png)

- `BlockingWaitStrategy`: Dựa trên `ReentrantLock` + `Condition` để thực hiện chờ và đánh thức, mã nguồn rất đơn giản và là chiến lược chờ mặc định của Disruptor. Tuy chậm nhất nhưng đây lại là lựa chọn có mức sử dụng CPU thấp nhất và ổn định nhất, được khuyến nghị cho môi trường Production;
- `BusySpinWaitStrategy`: Hiệu năng rất tốt nhưng tiềm ẩn nguy cơ quay vòng bận (busy spin) liên tục; nếu dùng sai có thể đẩy tải CPU lên 100%, cần cân nhắc kỹ trước khi dùng;
- `LiteBlockingWaitStrategy`: Chiến lược chờ gọn nhẹ dựa trên `BlockingWaitStrategy`, sẽ bỏ qua thao tác đánh thức khi không có tranh chấp khóa; tuy nhiên tác giả lưu ý rằng chiến lược này chưa được kiểm thử đầy đủ nên không khuyến nghị sử dụng;
- `TimeoutBlockingWaitStrategy`: Chiến lược chờ có kèm Timeout; sau khi hết thời gian chờ sẽ thực thi logic xử lý do nghiệp vụ chỉ định;
- `LiteTimeoutBlockingWaitStrategy`: Chiến lược dựa trên `TimeoutBlockingWaitStrategy`, bỏ qua thao tác đánh thức khi không có tranh chấp khóa;
- `SleepingWaitStrategy`: Chiến lược 3 giai đoạn — giai đoạn 1 tự xoay (spin), giai đoạn 2 gọi `Thread.yield` nhường CPU, giai đoạn 3 ngủ theo khoảng thời gian lặp lại nhiều lần;
- `YieldingWaitStrategy`: Chiến lược 2 giai đoạn — giai đoạn 1 tự xoay (spin), giai đoạn 2 gọi `Thread.yield` nhường CPU;
- `PhasedBackoffWaitStrategy`: Chiến lược 4 giai đoạn — giai đoạn 1 spin theo số lần chỉ định, giai đoạn 2 spin theo khoảng thời gian chỉ định, giai đoạn 3 gọi `Thread.yield` nhường CPU, giai đoạn 4 gọi phương thức `waitFor` của biến thành viên (biến này có thể cấu hình là một trong ba loại `BlockingWaitStrategy`, `LiteBlockingWaitStrategy`, `SleepingWaitStrategy`).

Bản chất của chiến lược chờ là sự đánh đổi giữa độ trễ và mức tiêu thụ CPU:

- Khi cực kỳ nhạy cảm với độ trễ và tài nguyên máy được cấp riêng (dedicated), có thể cân nhắc `BusySpinWaitStrategy` hoặc `YieldingWaitStrategy`.
- Các service nghiệp vụ thông thường nên bắt đầu từ `BlockingWaitStrategy` để độ ổn định và mức chiếm dụng tài nguyên dễ kiểm soát hơn.
- Nếu vừa muốn giảm quay vòng lãng phí CPU vừa muốn phản hồi nhanh trong khoảng ngắn, có thể cân nhắc `SleepingWaitStrategy` hoặc `PhasedBackoffWaitStrategy`.

Đừng tùy tiện dùng chiến lược busy-waiting trên các máy chủ chạy chung nhiều service nghiệp vụ, nếu không rất dễ kéo CPU lên tối đa và làm ảnh hưởng tới các service khác cùng máy.

## Tại sao Disruptor lại nhanh như vậy?

- **RingBuffer (Mảng vòng)**: `RingBuffer` bên trong Disruptor được hiện thực hóa bằng mảng (array). Vì toàn bộ phần tử trong mảng này được khởi tạo một lần ngay từ lúc đầu, nên địa chỉ bộ nhớ của các phần tử nói chung nằm liên tiếp nhau. Lợi ích là khi Producer liên tục đưa các đối tượng sự kiện mới vào `RingBuffer`, địa chỉ bộ nhớ của chúng vẫn giữ tính liên tục, nhờ đó tận dụng được nguyên lý cục bộ (Locality) của CPU Cache để nạp sẵn các đối tượng sự kiện liền kề vào cache cùng lúc, giúp nâng cao hiệu năng chương trình. Cơ chế này khá giống cơ chế đọc trước (read-ahead) của MySQL khi nạp trước vài trang liên tiếp vào bộ nhớ. Ngoài ra, việc dựa trên mảng còn giúp `RingBuffer` hỗ trợ thao tác theo lô (xử lý nhiều phần tử một lần) và tránh cấp phát bộ nhớ cũng như Garbage Collection liên tục (`RingBuffer` là mảng kích thước cố định; khi ghi thêm phần tử mới vào mảng đã đầy, phần tử mới sẽ ghi đè lên vị trí phần tử cũ nhất đã xử lý).
- **Tránh được vấn đề False Sharing (Chia sẻ giả)**: CPU Cache bên trong được quản lý theo đơn vị Cache Line (dòng cache), kích thước phổ biến khoảng 64 byte. Để đảm bảo trường dữ liệu mục tiêu độc chiếm trọn một Cache Line, Disruptor chèn thêm byte đệm (padding) ở trước và sau trường đó (56 byte phía trước và 56 byte phía sau), qua đó tránh hiện tượng False Sharing trên Cache Line. Đồng thời, để mảng chứa dữ liệu của `RingBuffer` độc chiếm dòng cache, mảng được thiết kế gồm vùng đệm vô hiệu (128 byte) + dữ liệu hợp lệ.
- **Thiết kế không khóa (Lock-free Design)**: Disruptor áp dụng thiết kế Lock-free, loại bỏ sự tranh chấp và độ trễ do cơ chế khóa truyền thống gây ra. Cách triển khai Lock-free của Disruptor khá phức tạp, chủ yếu dựa vào `CAS`, rào cản bộ nhớ (`Memory Barrier`) và `RingBuffer`.

Tóm lại, sở dĩ Disruptor đạt tốc độ nhanh đến vậy là nhờ tác động tổng hợp của hàng loạt kỹ thuật tối ưu: vừa khai thác triệt để đặc điểm cấu trúc CPU Cache hiện đại, vừa tránh được các bài toán đồng thời và nút thắt cổ chai hiệu năng phổ biến.

Tuy nhiên, lợi thế hiệu năng của Disruptor cũng có điều kiện tiên quyết: logic xử lý sự kiện không được quá nặng, Consumer không được bị block lâu, và dung lượng `RingBuffer` phải được tính toán phù hợp với lưu lượng đỉnh. Nếu bên trong Consumer gọi API chậm, truy vấn Slow SQL hoặc giữ khóa quá lâu, thì hàng đợi có nhanh đến đâu cũng sẽ bị năng lực xử lý của downstream kéo chậm lại.

Để tìm hiểu kỹ hơn về nguyên lý hàng đợi hiệu năng cao của Disruptor, bạn có thể đọc bài viết: [Phân tích sơ lược nguyên lý hàng đợi hiệu năng cao Disruptor](https://qin.news/disruptor/) (tham khảo bài viết [Hàng đợi hiệu năng cao — Disruptor](https://tech.meituan.com/2016/11/18/disruptor.html) của đội ngũ kỹ thuật Meituan).

🌈 Bổ sung thêm một điểm nhỏ ở đây: **Tại sao địa chỉ các đối tượng phần tử nằm liên tiếp trong mảng lại cải thiện hiệu năng?**

CPU Cache tăng tốc độ đọc bằng cách lưu trữ dữ liệu vừa dùng gần đây trong bộ nhớ đệm tốc độ cao, đồng thời dùng cơ chế nạp trước (prefetch) để tải sẵn dữ liệu ở vùng nhớ liền kề nhằm tận dụng nguyên lý cục bộ.

Trong hệ thống máy tính, CPU chủ yếu truy cập vào bộ nhớ đệm tốc độ cao (Cache) và bộ nhớ chính (RAM). Cache là loại bộ nhớ tốc độ rất nhanh nhưng dung lượng tương đối nhỏ, thường được chia thành nhiều cấp gồm L1, L2, L3 tương ứng với Cache cấp 1, cấp 2 và cấp 3. Cache càng nằm gần CPU thì tốc độ càng nhanh nhưng dung lượng càng nhỏ. Ngược lại, bộ nhớ chính có dung lượng lớn hơn nhưng tốc độ chậm hơn.

![Sơ đồ mô hình CPU Cache](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-f9ad1aa3.png)

Để tăng tốc quá trình đọc dữ liệu, CPU sẽ nạp dữ liệu từ bộ nhớ chính lên Cache; nếu lần tiếp theo cần truy cập lại đúng dữ liệu đó, CPU có thể đọc trực tiếp từ Cache mà không cần xuống lại bộ nhớ chính. Đây chính là khái niệm **Cache Hit** (trúng cache). Ngoài ra, nhằm tận dụng **nguyên lý cục bộ (Principle of Locality)**, CPU còn căn cứ vào địa chỉ bộ nhớ vừa truy cập để nạp trước các vùng nhớ lân cận, bởi vì trong chương trình các địa chỉ bộ nhớ liên tiếp thường xuyên được truy cập cùng nhau—làm vậy giúp tăng tỷ lệ Cache Hit và cải thiện hiệu năng thực thi của chương trình.

## Tài liệu tham khảo

- Con đường đạt hiệu năng cao của Disruptor — Chiến lược chờ (WaitStrategy): <http://wuwenliang.net/2022/02/28/Disruptor>
- *Thực chiến lập trình đồng thời Java* — Bài 40 | Phân tích tình huống (Phần 3): Hàng đợi hiệu năng cao Disruptor: <https://time.geekbang.org/column/article/98134>
