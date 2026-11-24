---
title: "Giải thích chi tiết Hệ thống phân tán: Khái niệm cốt lõi, Tiến hóa kiến trúc, Đặc trưng điển hình và Lộ trình học tập"
description: "Hướng dẫn nhập môn chi tiết về hệ thống phân tán, giải thích hệ thống phân tán là gì, vì sao cần hệ thống phân tán, quá trình tiến hóa từ kiến trúc Monolith sang kiến trúc phân tán, đặc trưng điển hình, các loại hệ thống phổ biến, thách thức cốt lõi và lộ trình học tập."
category: Hệ thống phân tán (Distributed Systems)
tag:
  - Hệ thống phân tán
  - Thiết kế hệ thống
head:
  - - meta
    - name: keywords
      content: Hệ thống phân tán,Hệ thống phân tán là gì,Kiến trúc phân tán,Microservices,Cluster,Lời gọi từ xa,Tính nhất quán phân tán,Sharding dữ liệu,Sao chép bản sao,Lộ trình học hệ thống phân tán
lang: vi
sourceRef: zh-ref/distributed-system/distributed-system-intro.md
---

Khi mới tiếp xúc với hệ thống phân tán (Distributed Systems), nhiều người thường bị "ngợp" ngay bởi một loạt thuật ngữ: CAP, BASE, Paxos, Raft, Distributed Lock, Distributed Transaction.

Những khái niệm này đều không thể né tránh, nhưng nếu lao thẳng vào chúng ngay khi mới nhập môn, bạn rất dễ học hệ thống phân tán thành một mớ thuật ngữ rời rạc không liên quan gì đến nhau. Một điểm xuất phát tốt hơn là đặt một câu hỏi thực tế hơn nhiều: Vốn dĩ một việc chỉ cần một máy chủ, một tiến trình (Process), một Database là làm xong, vì sao về sau lại phải tách ra nhiều máy? Tách xong rồi, vì sao chỉ một lần Timeout, một lần Retry hay một message bị gửi lặp lại có thể kéo theo nhiều bài toán thiết kế đến vậy?

Bài viết này sẽ làm rõ "hệ thống phân tán là gì" trước. Bài viết sẽ không đi sâu chứng minh Paxos, Raft hay Distributed Transaction, mà chỉ đặt chúng trở lại mạch chính để bạn biết mỗi cơ chế đang giải quyết loại rắc rối nào.

## Hệ thống phân tán là gì?

Cuốn sách *Distributed Systems: Concepts and Design* định nghĩa hệ thống phân tán như sau:

> Hệ thống phân tán là một hệ thống trong đó các thành phần phần cứng hoặc phần mềm nằm trên các máy tính kết nối mạng giao tiếp và phối hợp hành động với nhau chỉ thông qua việc truyền thông điệp (message passing).

Dưới góc độ kỹ thuật thực tế, có thể hiểu như sau: **Hệ thống phân tán được cấu thành từ nhiều đơn vị tính toán tương đối độc lập; các đơn vị tính toán này dựa vào giao tiếp mạng và phối hợp với nhau để cung cấp một dịch vụ hoàn chỉnh ra bên ngoài.**

Đừng hiểu chữ "độc lập" ở đây theo nghĩa mỗi node đều sở hữu độc quyền CPU, bộ nhớ, ổ đĩa và hệ điều hành. Một node có thể là máy vật lý, máy ảo (VM), container, hoặc chỉ đơn giản là một tiến trình phần mềm. Hai tiến trình trên cùng một máy sẽ dùng chung CPU và bộ nhớ vật lý tầng dưới, còn container cũng thường dùng chung kernel của máy chủ host. Nói nó độc lập chủ yếu là vì nó có trạng thái thực thi và dữ liệu cục bộ riêng, có thể chạy độc lập, đồng thời cũng có thể bị treo, khởi động lại hoặc mất kết nối một cách độc lập.

Rắc rối cũng bắt đầu từ đây.

Giữa các node không dùng chung không gian địa chỉ của một tiến trình. Lời gọi hàm cục bộ (local method call) trước đây sau khi tách ra có thể trở thành một lời gọi RPC, một HTTP request, một lần gửi message, hoặc một lần đồng bộ bản sao Database. Mạng có độ trễ, có thể mất gói tin (packet loss); request có thể đã tới Server nhưng phản hồi bị rơi mất; trạng thái "Timeout" mà Client nhìn thấy không chứng minh được rằng Server chưa thực thi thao tác đó.

Việc có nhiều máy còn mang lại một giới hạn khác: không có node nào có thể nhìn thấy trạng thái thực của toàn bộ hệ thống tại một thời điểm chính xác. Mỗi node chỉ nhìn thấy trạng thái cục bộ của chính mình và các message mà nó đã nhận được. Đồng hồ (clock) của các node cũng có sai lệch; ngay cả khi đồng bộ bằng NTP, cũng không thể xem chúng là một đồng hồ toàn cục đồng nhất tuyệt đối.

Ví dụ, khi người dùng nhấn nút "Đặt hàng", trên giao diện chỉ là một request, nhưng phía Server có thể đã đi qua Gateway, User Service, Product Service, Order Service, Inventory Service, Coupon Service, Payment Service, đồng thời còn có thể ghi Database, bắn message, cập nhật Cache. Người dùng nhìn thấy một nút bấm, còn phía Backend là cả một chuỗi phối hợp liên node.

![Tổng quan hệ thống phân tán](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-system-overview-748f94b5.webp)

| Khía cạnh | Hệ thống đơn máy hoặc đơn tiến trình | Hệ thống phân tán |
| --- | --- | --- |
| Phương thức giao tiếp | Gọi hàm, bộ nhớ dùng chung (Shared Memory) | RPC, Messaging, giao thức mạng |
| Phạm vi sự cố | Thường dùng chung một ranh giới lỗi | Các node có thể gặp sự cố độc lập |
| Góc nhìn thời gian | Chủ yếu dựa vào đồng hồ của cùng một máy | Đồng hồ giữa nhiều node tồn tại độ lệch (skew/drift) |
| Quan sát trạng thái | Tương đối dễ quan sát trạng thái tổng thể | Mỗi node thường chỉ có góc nhìn cục bộ |
| Xử lý giao dịch (Transaction) | Phổ biến dùng Transaction cục bộ của Database | Điều phối liên service, bù trừ (Compensation) hoặc đồng thuận (Consensus) |
| Phương thức mở rộng | Chủ yếu nâng cấp theo chiều dọc (Scale-up) | Thêm node theo chiều ngang (Scale-out) |
| Truy vết sự cố | Log và Call Stack của một tiến trình | Log, Metrics, Distributed Tracing và trạng thái liên node |

## Vì sao cần hệ thống phân tán?

Ứng dụng nguyên khối (Monolith) không hề thấp kém. Một hệ thống quản trị nội bộ hoặc một hệ thống nghiệp vụ có lượng truy cập vừa phải, dùng một ứng dụng cộng với một Database lại dễ phát triển, triển khai và xử lý lỗi hơn nhiều. Rất nhiều hệ thống gặp vấn đề thực sự không phải vì ban đầu dùng Monolith, mà là vì tách quá sớm: độ phức tạp tăng vọt trước khi lợi ích kịp xuất hiện.

Hệ thống phân tán thường chỉ trở nên cần thiết khi áp lực thực tế xuất hiện.

**Trước tiên là áp lực tính toán.** CPU, bộ nhớ và Disk I/O của một máy đều có giới hạn trần. Có thể nâng cấu hình máy lên cao hơn, nhưng giá thành, giới hạn phần cứng và rủi ro điểm lỗi đơn (SPOF) sẽ chặn đứng hướng mở rộng dọc (Scale-up). Chia tải request sang nhiều máy mới là con đường hầu hết các hệ thống nghiệp vụ sẽ đi về sau.

**Áp lực lưu trữ cũng tương tự.** Một bảng đơn hàng tăng từ 1 triệu dòng lên 1 tỷ dòng thì truy vấn, sao lưu (backup), bảo trì Index và khôi phục sau sự cố đều trở nên nặng nề. Dồn toàn bộ dữ liệu trên một máy sẽ khiến cả chi phí lẫn rủi ro tăng cao. Phân mảnh dữ liệu (Sharding) sẽ tách các phần dữ liệu khác nhau sang các node khác nhau, ví dụ shard theo `user_id` hoặc `order_id`; sao chép bản sao (Replication) sẽ lưu nhiều bản sao của cùng một dữ liệu để nâng cao tính sẵn sàng, khả năng khắc phục thảm họa, tiện thể gánh bớt một phần lưu lượng đọc. Chúng giải quyết bài toán dung lượng và sự cố, nhưng đồng thời cũng kéo theo truy vấn xuyên shard (cross-shard query), đồng bộ bản sao và tính nhất quán dữ liệu.

**Tính sẵn sàng (Availability) cũng ép hệ thống phải đi theo hướng đa node.** Nếu chỉ có một Application Server, nó sập là dịch vụ ngừng hoạt động; nếu chỉ có một Database, hỏng ổ đĩa hay lỗi máy chủ vật lý đều ảnh hưởng trực tiếp tới nghiệp vụ. Có nhiều instance, nhiều bản sao và nhiều Availability Zone (AZ) ít nhất giúp hệ thống vẫn tiếp tục phục vụ — hoặc giữ được phần năng lực cốt lõi — khi một số node gặp sự cố.

Đặt vào bối cảnh nghiệp vụ thực tế, các động lực phổ biến thường gồm những nhóm sau:

- **Hiệu năng không gánh nổi**: Một máy không xử lý hết lượng request, cần nhiều máy chia sẻ tải tính toán.
- **Dữ liệu chứa không xuể**: Chi phí lưu trữ, đánh Index, sao lưu và phục hồi trên một máy quá cao, cần Sharding hoặc Replication.
- **Không chịu nổi sự cố**: Tác động của điểm lỗi đơn quá lớn, cần dự phòng (Redundancy), chuyển đổi dự phòng (Failover) và giáng cấp (Degradation).

Cũng có những hệ thống không phải bị ép bởi giới hạn dung lượng của một máy, mà bị thúc đẩy bởi ranh giới địa lý, tổ chức và bảo mật. Triển khai dịch vụ và dữ liệu gần người dùng hơn giúp giảm độ trễ truy cập và thuận tiện cho khắc phục thảm họa liên vùng (Cross-region); triển khai độc lập theo từng team, từng miền nghiệp vụ hoặc miền bảo mật giúp tránh việc mọi tính năng phải dùng chung cùng một cửa sổ phát hành và cùng một ranh giới sự cố.

Vì vậy, **hệ thống phân tán không đơn giản chỉ là "thêm máy". Nó giải quyết các bài toán về dung lượng, tính sẵn sàng, cô lập và phối hợp, đồng thời mang theo các vấn đề về mạng, sự cố cục bộ, tính nhất quán dữ liệu và chi phí truy vết lỗi vào hệ thống.**

## Từ thương mại điện tử Monolith sang thương mại điện tử phân tán

Giả sử có một hệ thống thương mại điện tử giai đoạn đầu: User, Product, Order, Inventory và Payment đều viết trong cùng một ứng dụng Spring Boot, toàn bộ dữ liệu đặt trong cùng một instance MySQL.

Khi nghiệp vụ mới bắt đầu, cấu trúc này rất dễ chịu. Một lần đặt hàng chỉ là một chuỗi lời gọi cục bộ: kiểm tra User, tra cứu sản phẩm, trừ tồn kho, tạo đơn hàng, khởi tạo thanh toán. Code nằm trong một tiến trình, Transaction hoàn thành trong một Database. Khi gặp lỗi, xem log của một ứng dụng và kiểm tra một Database là cơ bản tìm ra nguyên nhân.

Khi lưu lượng tăng lên, áp lực sẽ dồn vào một số điểm: trang chi tiết sản phẩm có lượng truy vấn cực cao, tạo đơn hàng có lượng ghi lớn, trừ tồn kho có nhiều xung đột đồng thời (concurrency conflict), còn luồng thanh toán lại không được phép tùy tiện thất bại. Nếu tiếp tục nhồi toàn bộ logic trong một ứng dụng, bất kỳ module nào chậm đi cũng có thể kéo tụt toàn bộ hệ thống.

Lúc này nhiều team sẽ mở rộng ngang (Scale-out) trước: triển khai 3 instance ứng dụng trở lên, dùng Nginx, Gateway hoặc Load Balancer để phân phối request. Chỉ cần ứng dụng giữ được trạng thái phi trạng thái (Stateless) tối đa có thể, thêm instance là đã chia sẻ được một phần lưu lượng.

Tiếp theo nữa, hệ thống có thể tách tiếp:

- Product Service phụ trách thông tin sản phẩm và hiển thị giá;
- Order Service phụ trách tạo đơn hàng và chuyển đổi trạng thái đơn hàng;
- Inventory Service phụ trách trừ tồn kho, hoàn trả tồn kho và lịch sử biến động tồn kho;
- Payment Service phụ trách kết nối với các kênh thanh toán bên thứ ba;
- Message Queue phụ trách truyền bất đồng bộ các sự kiện như thanh toán thành công, thay đổi tồn kho, thông báo vận chuyển.

![Từ Monolith sang thương mại điện tử phân tán](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/monolith-to-distributed-ecommerce-7d010683.webp)

Lợi ích sau khi tách rất rõ ràng. Product Service có lượng đọc lớn nên có thể mở rộng độc lập; Payment Service đòi hỏi độ ổn định cao nên có thể làm Rate Limiting, Retry và Circuit Breaking riêng; Inventory Service có nhiều xung đột đồng thời nên có thể thiết kế cấu trúc dữ liệu và chiến lược khóa (Lock) chuyên biệt xoay quanh thao tác trừ tồn kho.

Nhưng rắc rối cũng xuất hiện rất nhanh.

Order Service gọi Inventory Service để trừ tồn kho, nếu request bị Timeout, Order Service rốt cuộc có nên Retry hay không? Lần trừ tồn kho trước là chưa gửi đi được, hay đã trừ thành công nhưng phản hồi bị rơi mất? Nếu tồn kho đã trừ thành công nhưng tạo đơn hàng thất bại thì hoàn kho lại bằng cách nào? Nếu message thanh toán thành công bị gửi lặp lại, trạng thái đơn hàng có bị cập nhật lặp lại không?

Những vấn đề này trong Monolith cũng có thể xảy ra, chỉ là hệ thống phân tán khuếch đại chúng lên. Hệ thống không còn chỉ có một tiến trình, một vùng bộ nhớ, một ngữ cảnh Transaction nữa; rất nhiều việc trước đây vốn "tiện tay làm luôn" sau khi tách ra đều phải thiết kế lại.

## Hệ thống phân tán có những đặc trưng điển hình nào?

Chỉ nhìn số lượng máy là chưa đủ. Những đặc trưng dưới đây mới chính là nguồn gốc tạo nên độ phức tạp của hệ thống phân tán.

### Phối hợp đa node (Multi-Node Collaboration)

Một request thường cần nhiều node cùng phối hợp hoàn thành. Một request đặt hàng có thể đi qua Gateway, Order Service, Inventory Service, Payment Service, Message Queue và Database. Mỗi node chỉ phụ trách một đoạn logic nhỏ, ghép lại mới thành một luồng nghiệp vụ hoàn chỉnh.

Khi chuỗi lời gọi kéo dài ra, cả độ trễ lẫn xác suất lỗi đều bị khuếch đại. Một node bị đầy Thread Pool, một câu truy vấn Database chậm, hay mạng chập chờn — thứ người dùng nhìn thấy có thể chỉ là "màn hình đặt hàng quay vòng mãi".

### Các node thực thi đồng thời, không có góc nhìn toàn cục tức thời

Các node chạy đồng thời. Mỗi node chỉ có thể nhìn trực tiếp trạng thái cục bộ của bản thân nó và các message nó đã nhận được, chứ không thể đọc được trạng thái thực của toàn hệ thống tại cùng một khoảnh khắc.

Từ đó xuất hiện những phán đoán thoạt nhìn mâu thuẫn nhưng đều có thể giải thích hợp lý: một node đã nhận được cấu hình mới nhất trong khi node khác vẫn giữ phiên bản cũ; một node cho rằng Leader vẫn đang sống trong khi node khác vì Timeout đã bắt đầu bầu chọn lại. Rất nhiều lỗi phân tán không phải do code viết sai, mà là do các node khác nhau nhìn thấy thông tin khác nhau tại những thời điểm khác nhau.

### Giao tiếp mạng (Network Communication)

Các node phải dựa vào mạng để trao đổi dữ liệu. Mạng và bộ nhớ cục bộ không phải cùng một thứ; mạng không đảm bảo request chắc chắn tới nơi, cũng không đảm bảo phản hồi quay về đúng thời gian dự kiến.

Một lời gọi từ xa (remote call) có thể xảy ra các tình huống sau:

- Request còn chưa rời khỏi Client;
- Request đã tới Server nhưng chưa xử lý xong;
- Server đã thực thi thành công, nhưng phản hồi không về tới được Client;
- Client đã Timeout, nhưng Server vẫn đang tiếp tục thực thi;
- Server thực thi thất bại, nhưng phản hồi lỗi cũng không trả về thành công.

Timeout, Retry, Tính lũy đẳng (Idempotency), Ngắt mạch (Circuit Breaker) và Giáng cấp (Degradation) được tạo ra chính là để ứng phó với những tình huống này. Một khi lời gọi từ xa đi vào luồng chính (critical path), các thiết kế này không thể đợi tới lúc production báo lỗi mới vá víu.

### Sự cố cục bộ (Partial Failures)

Trong hệ thống đơn máy, khi tiến trình chết, ranh giới vấn đề tương đối rõ ràng. Trong hệ thống phân tán lại thường xuyên xảy ra tình trạng nửa sống nửa chết: một phần node bình thường, một phần node bất thường; một phần request thành công, một phần request thất bại; Service A không gọi được Service B, nhưng Service C vẫn gọi được Service B.

Một node không phản hồi cũng chưa chắc là đã sập hẳn (crash). Mạng rung lắc (jitter), tạm dừng do GC (GC pause), đầy Thread Pool, hay nghẽn Disk I/O đều có thể khiến nó tạm thời "trông như đã chết". Nếu hệ thống chỉ dựa vào việc "có phản hồi hay không" để phán đoán lỗi thì rất dễ nhận định sai.

### Sao chép dữ liệu (Replication) và Phân mảnh dữ liệu (Sharding)

Khi quy mô dữ liệu và yêu cầu về tính sẵn sàng tăng lên, hệ thống rất dễ đi tới Sharding và Replication.

Sharding là phân tán các phần dữ liệu khác nhau lên các node khác nhau, với các quy tắc phổ biến như `user_id`, `order_id`, khu vực địa lý, hoặc giá trị Hash. Sau khi Sharding, tải trên từng node giảm xuống, nhưng truy vấn xuyên shard, Transaction xuyên shard và mở rộng shard sẽ trở nên phức tạp hơn.

Replication là lưu giữ nhiều bản sao của cùng một dữ liệu, chẳng hạn như MySQL Master-Slave Replication, Redis Primary-Replica Replication, Kafka Partition Replicas, hay bản sao đa node của ZooKeeper. Khi có bản sao, hệ thống dễ tiếp tục phục vụ hơn khi một node gặp sự cố, đồng thời lưu lượng đọc cũng có thể chia tải sang nhiều bản sao. Cái giá phải trả là độ trễ đồng bộ bản sao (Replication Lag): sau khi ghi thành công lên node chính, các bản sao có thể chưa kịp đuổi theo; nếu người dùng vừa ghi xong dữ liệu và lần đọc kế tiếp rơi vào bản sao cũ, họ có thể đọc phải giá trị cũ (stale data).

![Sharding, Replication và Tính nhất quán](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/sharding-replication-consistency-542736e5.webp)

### Không có đồng hồ toàn cục đồng bộ hoàn hảo

Mỗi máy đều có đồng hồ vật lý riêng, nhưng đồng hồ sẽ có độ lệch (skew) và độ trôi (drift). Các cơ chế đồng bộ thời gian như NTP hay GPS có thể thu hẹp sai số, nhưng không thể đảm bảo mọi node tại mọi thời điểm đều có cùng một góc nhìn thời gian chính xác tuyệt đối.

Hệ thống phân tán rất ít khi chỉ dựa vào đồng hồ tường (wall clock) để xác định thứ tự trước sau của sự kiện. Khi biểu diễn quan hệ nhân quả, có thể dùng đồng hồ logic (Logical Clock) như Lamport Clock hoặc Vector Clock; khi thực hiện sao chép dữ liệu, bầu chọn và chuyển đổi trạng thái, cũng thường dùng `term`, `epoch`, số phiên bản (version) hoặc chuỗi tăng đơn điệu.

Thời gian vật lý vẫn hữu ích: log, Timeout, Lease và hết hạn Cache đều không thể thiếu nó. Chỉ là khi phụ thuộc vào thời gian vật lý, bạn phải biết mình chấp nhận được mức sai số và độ trôi đồng hồ bao nhiêu. Đồng hồ logic giải quyết bài toán thứ tự sự kiện, không thể thay thế trực tiếp cho các nhu cầu thời gian vật lý như "khóa sẽ hết hạn sau bao lâu".

## Các loại hệ thống phân tán phổ biến

Hệ thống phân tán không phải một loại middleware cụ thể nào đó, mà là một dạng hình thái hệ thống. Các loại phổ biến gồm:

| Loại hệ thống | Bài toán giải quyết | Ví dụ phổ biến |
| --- | --- | --- |
| Hệ thống điều phối phân tán | Bầu chọn Leader, quản lý cấu hình, Service Discovery, Distributed Lock | ZooKeeper, etcd, Consul |
| Cơ sở dữ liệu phân tán (Distributed Database) | Sharding dữ liệu, sao chép bản sao, mở rộng ngang | TiDB, CockroachDB, Cassandra, HBase |
| Bộ nhớ đệm phân tán (Distributed Cache) | Cache đa node, tăng tốc dữ liệu nóng, mở rộng dung lượng Cache | Redis Cluster, cụm Memcached |
| Hàng đợi thông điệp phân tán (Distributed Message Queue) | Tách rời bất đồng bộ (Async Decoupling), cắt đỉnh lưu lượng (Peak Shaving), hướng sự kiện | Kafka, RocketMQ, Pulsar |
| Lưu trữ tệp / đối tượng phân tán | Lưu trữ file lớn, đa bản sao, đọc ghi thông lượng cao | HDFS, Ceph, MinIO |
| RPC Framework | Định nghĩa giao diện (Interface), Serialization, gọi và phản hồi liên dịch vụ | gRPC, Apache Thrift |
| Hệ sinh thái Service Governance | Service Registration & Discovery, Load Balancing, quản lý lưu lượng, Circuit Breaking, cấu hình | Dubbo, Spring Cloud |

Những hệ thống này giải quyết các bài toán khác nhau, nhưng thường cùng xuất hiện trong một kiến trúc nghiệp vụ. Một hệ thống đơn hàng có thể dùng Redis làm Cache, dùng RocketMQ truyền sự kiện đơn hàng, dùng ZooKeeper hoặc Nacos làm Registration & Discovery, dùng MySQL tách DB/bảng (Sharding) để lưu đơn hàng, rồi dùng hệ thống Distributed Tracing để truy vết một request đã đi qua những service nào.

Khi học hệ thống phân tán, đừng chỉ nhìn chằm chằm vào một middleware để học thuộc cấu hình tham số. Hãy luôn tự hỏi nó được đặt vào hệ thống để giải quyết vấn đề gì, và nó để lại những độ phức tạp nào cho phía code nghiệp vụ xử lý.

## Hệ thống phân tán, Cluster và Microservices khác nhau như thế nào?

Mấy thuật ngữ này thường bị dùng lẫn với nhau, nhưng thực chất chúng chỉ những điều khác nhau.

**Cluster (Cụm máy chủ)** nhấn mạnh hơn vào hình thái triển khai. Nhiều máy cùng cung cấp một dịch vụ thì có thể gọi là Cluster — ví dụ 3 instance Nginx, 5 node Redis, 3 instance ứng dụng. Chúng có thể làm cùng một việc giống nhau, hoặc phân công theo kiểu Master-Slave, Sharding, bầu chọn Leader.

**Hệ thống phân tán (Distributed System)** nhấn mạnh hơn vào sự phối hợp giữa các node. Nhiều node giao tiếp qua mạng để cùng hoàn thành một tác vụ, và thể hiện ra bên ngoài như một chỉnh thể thống nhất. Cluster có thể là một hình thái của hệ thống phân tán, nhưng hệ thống phân tán còn liên quan đến sao chép dữ liệu, tính nhất quán, chịu lỗi, lập lịch (Scheduling) và điều phối.

**Microservices (Vi dịch vụ)** là một phong cách kiến trúc ứng dụng. Nó tách hệ thống nghiệp vụ thành nhiều service tổ chức xoay quanh năng lực nghiệp vụ, mỗi service có thể phát triển, triển khai và mở rộng độc lập. Hệ thống Microservices nhìn chung cũng là hệ thống phân tán vì các service phải gọi nhau qua mạng. Tuy nhiên, hệ thống phân tán không nhất thiết phải là Microservices: bản thân Kafka, HDFS, ZooKeeper đều là hệ thống phân tán, nhưng không phải Microservice nghiệp vụ.

Ngoài ra cũng có một trường hợp rất phổ biến: bản thân một ứng dụng nghiệp vụ vẫn là Monolith, nhưng nó phụ thuộc vào Redis Cluster, Kafka, Elasticsearch và MySQL Master-Slave. Bản thân ứng dụng nghiệp vụ đó chưa tách thành Microservices, nhưng nó đang chạy trên một tập hợp hạ tầng phân tán.

## Hệ thống phân tán khó ở đâu?

Hệ thống phân tán khó không phải vì khái niệm nghe cao siêu, mà vì có quá nhiều kịch bản thất bại. Mạng khiến kết quả của một thao tác trở nên bất định, còn sự cố độc lập lại khiến các node khác nhau đồng thời nhìn thấy trạng thái hệ thống khác nhau.

Lời gọi cục bộ nằm trong cùng một tiến trình hoặc cùng một ranh giới lỗi với bên gọi, nên kết quả thực thi tương đối dễ phán đoán. Lời gọi từ xa cộng thêm một tầng bất định: Timeout chỉ nói lên rằng Client chưa nhận được phản hồi trong khoảng thời gian quy định, chứ không chứng minh Server chưa thực thi. Request có thể chưa gửi ra ngoài được, hoặc đã thực thi thành công nhưng phản hồi bị mất. Khác biệt này ảnh hưởng trực tiếp tới chiến lược Retry.

![Sự bất định của lời gọi từ xa](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/remote-call-uncertainty-64e92b93.webp)

Ví dụ Order Service gọi Inventory Service để trừ tồn kho, Client đặt Timeout 2 giây. Sau 2 giây Order Service vẫn chưa nhận được phản hồi, nó có vài lựa chọn:

- Coi như trừ tồn kho thất bại và hủy luôn đơn hàng;
- Gọi lại Inventory Service một lần nữa;
- Tra cứu nhật ký biến động tồn kho để xác nhận request lần trước đã thành công hay chưa;
- Tạm thời đặt đơn hàng ở trạng thái "đang xử lý", sau đó dùng message hoặc tác vụ định kỳ (Scheduled Job) để bù trừ.

Mỗi lựa chọn đều có cái giá của nó. Hủy thẳng đơn hàng có thể phán đoán nhầm vì biết đâu Inventory Service đã trừ kho thành công; Retry trực tiếp có thể trừ kho hai lần; tra cứu nhật ký đòi hỏi Inventory Service phải cung cấp mã lũy đẳng (Idempotency Key) và bản ghi cho phép truy vấn; xử lý bù trừ bất đồng bộ sẽ khiến người dùng thấy trạng thái "đang xử lý", đòi hỏi trải nghiệm sản phẩm (UX) cũng phải phối hợp theo.

Tính lũy đẳng (Idempotency) trở nên quan trọng chính là trong bối cảnh như vậy. Chỉ cần tồn tại Timeout và Retry, cùng một request nghiệp vụ có thể bị xử lý nhiều lần. Phía Server bắt buộc phải nhận diện được "đây là cùng một thao tác nghiệp vụ", không được vì Client Retry mà trừ tiền lặp lại, trừ kho lặp lại hay phát hành mã giảm giá lặp lại. Với các thao tác ghi từ xa có tác dụng phụ (side effects), còn phải thiết kế Idempotency Key nghiệp vụ, cơ chế tra cứu kết quả, số lần Retry hữu hạn, cùng Exponential Backoff và Random Jitter để tránh lúc hạ nguồn gặp sự cố lại bị chính lưu lượng Retry đè sập thêm.

Tính nhất quán dữ liệu cũng là bài toán tương tự. Trong ứng dụng Monolith, một Database Transaction có thể cập nhật đồng thời cả bảng đơn hàng và bảng tồn kho; sau khi tách thành Order Service và Inventory Service, Order DB và Inventory DB không nằm trong cùng một Transaction nữa. Muốn chúng hoặc cùng thành công, hoặc cùng thất bại thì cần đến Distributed Transaction, Transactional Message, TCC, Saga, Local Message Table,...

Nhiều nghiệp vụ liên service chấp nhận sự bất nhất quán trạng thái trong thời gian ngắn, rồi dùng Transactional Message, Retry, bù trừ (Compensation) và đối soát (Reconciliation) để trạng thái đơn hàng, tồn kho, thanh toán cuối cùng thỏa mãn ràng buộc nghiệp vụ. Trong kỹ thuật phần mềm, giải pháp này cũng thường được gọi là "tính nhất quán cuối cùng" (Eventual Consistency). Tuy nhiên, ngữ cảnh của nó khác với Eventual Consistency trong mô hình nhất quán bản sao (replica consistency): mô hình bản sao nhấn mạnh việc nhiều bản sao dữ liệu cuối cùng sẽ hội tụ về cùng một giá trị khi không còn thao tác ghi mới, còn ở đây thiên về việc điều phối bất đồng bộ giữa các quy trình nghiệp vụ liên dịch vụ.

Việc truy vết lỗi cũng trở nên chậm hơn. Một request đi qua 6 service, chỉ cần một service bất kỳ ghi log không chuẩn, thiếu Distributed Tracing hoặc thiết kế mã lỗi lộn xộn là việc khoanh vùng đã rất vất vả. Khi môi trường production thiếu năng lực quan sát (Observability), rất khó phán đoán request đang kẹt ở node nào và lỗi phát sinh đầu tiên từ đâu.

## Các năng lực nền tảng thường gặp trong hệ thống phân tán hướng nghiệp vụ

Những năng lực dưới đây thường gặp ở Microservices và các hệ thống nghiệp vụ trực tuyến; chúng thuộc về hạ tầng kỹ thuật đi kèm, chứ không phải một phần trong định nghĩa của hệ thống phân tán. Quan hệ thành viên giữa các service cũng không nhất thiết phải dựa vào Service Registry độc lập để duy trì — DNS, cấu hình tĩnh, Gossip hoặc giao thức cụm đều có thể dùng được.

**Service Discovery và Load Balancing**: Các instance của service sẽ mở rộng, thu hẹp và khởi động lại, nên bên gọi không thể gắn cứng (hardcode) địa chỉ service. Service Registry ghi nhận các instance đang hoạt động, còn Load Balancing chọn một instance khả dụng để thực hiện lời gọi.

**Timeout, Retry và Idempotency**: Lời gọi từ xa bắt buộc phải thiết lập Timeout. Retry phải thận trọng, chỉ phù hợp với thao tác có thể thử lại và đã có bảo vệ lũy đẳng (Idempotency). Các thao tác như thanh toán, trừ tồn kho, phát mã giảm giá nhất định phải có mã định danh duy nhất nghiệp vụ hoặc bảng chống trùng (Idempotency Table) làm lớp bảo vệ cuối cùng.

**Circuit Breaking, Rate Limiting và Degradation**: Khi service hạ nguồn (downstream) chậm đi hoặc lỗi, thượng nguồn (upstream) không thể chờ vô thời hạn hay Retry mãi, nếu không lỗi sẽ lan dọc theo chuỗi lời gọi. Circuit Breaker giúp fail-fast, Rate Limiting kiểm soát áp lực đầu vào, còn Degradation giúp bảo vệ luồng nghiệp vụ chính.

**Quản lý cấu hình và Thay đổi động**: Khi số lượng service tăng lên, cấu hình không thể chỉ sửa thủ công qua file cục bộ. Configuration Center giúp quản lý cấu hình tập trung, đồng thời hỗ trợ Canary Release, làm mới động (Dynamic Refresh) và Rollback.

**Logging, Metrics và Distributed Tracing**: Log trả lời câu hỏi "chuyện gì đã xảy ra", Metrics trả lời câu hỏi "hiện tại hệ thống có khỏe không", còn Distributed Tracing trả lời câu hỏi "một request đã đi qua những đâu". Đặt 3 loại dữ liệu này cạnh nhau mới có điểm bám để truy vết vấn đề phân tán.

**Tính nhất quán dữ liệu và Cơ chế bù trừ**: Khi ghi dữ liệu liên node, phải thiết kế trước cách xử lý sau khi thất bại. Cần nhất quán mạnh (Strong Consistency), nhất quán cuối cùng (Eventual Consistency), hay cho phép bất nhất quán trong thời gian ngắn? Sau khi lỗi thì dựa vào Retry, xử lý thủ công, đối soát sửa dữ liệu hay Rollback nghiệp vụ? Những câu hỏi này không thể đợi tới lúc production phát sinh lỗi mới bổ sung.

## Học hệ thống phân tán như thế nào?

Khi học hệ thống phân tán, không nên mới vào đã học thuộc tên thuật toán. Đi từ bài toán kỹ thuật sang lý thuyết sẽ trôi chảy hơn rất nhiều.

Bước thứ nhất, xem giao tiếp mạng. HTTP, RPC, TCP, Timeout, Retry, Connection Pool và Serialization — những nội dung này quyết định cách các service "nói chuyện" với nhau. Không có nền tảng này, phần Service Governance phía sau sẽ rất mơ hồ.

Bước thứ hai, xem tách dịch vụ và Service Governance. Vì sao phải tách service, sau khi tách thì làm Service Registration & Discovery, Load Balancing, Rate Limiting & Circuit Breaking, Distributed Tracing thế nào, xử lý tương thích phiên bản và Canary Release ra sao. Phần lớn công việc hằng ngày với Microservices nằm ở tầng này.

Bước thứ ba, bổ sung tầng dữ liệu: Replication, Sharding, Cache, Message Queue, Distributed ID, Distributed Lock, Distributed Transaction. Ở đây cần đặt nhiều câu hỏi về kịch bản bất thường, ví dụ nếu message bị gửi lặp thì sao, Cache và Database không đồng bộ thì xử lý thế nào, Lock hết hạn nhưng logic nghiệp vụ vẫn chưa chạy xong thì làm sao.

Cuối cùng mới xem các lý thuyết và giao thức như CAP, BASE, điều phối tập trung và phi tập trung, Paxos, Raft, ZAB, Gossip, Consistent Hashing. Trọng tâm khi học các nội dung này là hiểu *vì sao* các hệ thống như ZooKeeper, etcd, Kafka, Redis Cluster hay cơ sở dữ liệu phân tán lại được thiết kế như vậy.

Ở bước này, bạn nên đọc [Giải thích chi tiết Điều phối phân tán](./protocol/centralized-and-decentralized.md) trước. Bài viết đặt Leader, Quorum, Split-Brain, Lease, Fencing Token và Gossip trên cùng một mạch chính, giúp bạn hiểu rõ "ai là người ra quyết định, trạng thái lan truyền thế nào, sai thì sẽ ra sao" trước khi đi vào chi tiết của Raft, ZAB và Gossip.

Cũng cần phân biệt rõ giữa Đồng thuận (Consensus) và Giao dịch phân tán (Distributed Transaction). Paxos, Raft, ZAB chủ yếu giải quyết việc một nhóm bản sao thống nhất với nhau về thứ tự log, Leader hoặc chuyển đổi trạng thái; còn TCC, Saga, Transactional Message chủ yếu giải quyết việc nhiều bên tham gia nghiệp vụ phối hợp Commit và bù trừ ra sao. Cả hai có thể cùng xuất hiện trong một hệ thống, nhưng xử lý những bài toán khác nhau.

Ở giai đoạn nhập môn, trình bày rõ được 6 câu hỏi sau sẽ hữu ích hơn nhiều so với việc học thuộc một loạt thuật ngữ:

1. Vì sao hệ thống đơn máy phải tách ra thành nhiều node?
2. Lời gọi từ xa và lời gọi cục bộ khác nhau ở điểm nào?
3. Vì sao trong hệ thống phân tán, Timeout không thể đơn giản đánh đồng với thất bại?
4. Vì sao đa bản sao lại kéo theo vấn đề tính nhất quán?
5. Vì sao ghi dữ liệu liên service thường phải tính đến Tính lũy đẳng (Idempotency), bù trừ (Compensation) và tính nhất quán cuối cùng (Eventual Consistency)?
6. Vì sao có hệ thống cần Leader, còn có hệ thống lại phù hợp dùng Gossip để lan truyền trạng thái hơn?

## Tài liệu tham khảo

- [Hệ thống phân tán là gì và học hệ thống phân tán như thế nào](https://www.cnblogs.com/xybaby/p/7787034.html)
- [Các kiến trúc hệ thống phân tán mã nguồn mở phổ biến hiện nay là gì?](https://www.zhihu.com/question/19832447/answer/91660607)
- [Tổng hợp minh họa thiết kế các hệ thống phân tán phổ biến](https://www.raychase.net/6364)
- [A brief introduction to distributed systems](https://www.researchgate.net/publication/306241722_A_brief_introduction_to_Distributed_Systems)
- [MIT 6.824 Distributed Systems](https://pdos.csail.mit.edu/6.824/)
- [Time, Clocks, and the Ordering of Events in a Distributed System](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/)
- [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Eventually Consistent - Revisited](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html)
- [Raft Consensus Algorithm](https://raft.github.io/)
- *Designing Data-Intensive Applications*
- *Distributed Systems: Concepts and Design*
