---
title: "Tổng hợp câu hỏi phỏng vấn Hệ thống phân tán mới nhất 2026: CAP, Raft, RPC, Distributed Lock, Distributed Transaction và Distributed ID"
description: "Tổng hợp câu hỏi phỏng vấn và lộ trình ôn tập Hệ thống phân tán mới nhất 2026, bao gồm các chủ điểm tần suất cao như CAP, BASE, điều phối tập trung (Centralized) và phi tập trung (Decentralized), Paxos, Raft, ZAB, Gossip, Consistent Hashing, RPC, API Gateway, Distributed ID, Distributed Lock, Distributed Transaction, Configuration Center và ZooKeeper."
category: Hệ thống phân tán (Distributed Systems)
tag:
  - Hệ thống phân tán
  - Câu hỏi phỏng vấn
  - Thiết kế hệ thống
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn phân tán,Câu hỏi phỏng vấn hệ thống phân tán,Tập trung,Phi tập trung,Câu hỏi phỏng vấn CAP,Câu hỏi phỏng vấn BASE,Câu hỏi phỏng vấn RPC,Câu hỏi phỏng vấn API Gateway,Câu hỏi phỏng vấn Distributed Lock,Câu hỏi phỏng vấn Distributed Transaction,Câu hỏi phỏng vấn Distributed ID,Câu hỏi phỏng vấn ZooKeeper,Câu hỏi phỏng vấn Raft,Câu hỏi phỏng vấn Paxos
lang: vi
sourceRef: zh-ref/distributed-system/distributed-system-interview-questions.md
---

Phỏng vấn hệ thống phân tán rất hiếm khi chỉ bắt bạn đọc thuộc lòng một định nghĩa CAP. Người phỏng vấn thường bắt đầu từ một bài toán nghiệp vụ cụ thể rồi hỏi xoáy sâu: Vì sao service phải tách sang nhiều node? Sau khi mạng bị Timeout thì có được Retry không? Nếu Lock hết hạn sớm thì xử lý thế nào? Dữ liệu liên service giữ nhất quán bằng cách nào?

Bài viết này là cổng ôn tập cho chuyên đề Hệ thống phân tán của JavaGuide, được sắp xếp theo bốn phần: Lý thuyết phân tán, RPC & API Gateway, Distributed ID / Distributed Lock / Distributed Transaction, và Configuration Center & ZooKeeper. Mỗi phần chỉ liệt kê các vấn đề cần nắm chắc khi ôn tập; câu trả lời và chi tiết triển khai nằm trong các bài viết chuyên đề tương ứng.

Nếu thời gian khá gấp, bạn có thể xem trước [Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ thống phân tán](https://interview.javaguide.cn/distributed-system/distributed-system.html), đánh dấu những câu chưa trả lời được rồi quay lại bài này để bổ sung nguyên lý và chi tiết kỹ thuật.

## Khi ôn tập nên nắm chắc những vấn đề nào trước?

| Phân hệ | Nội dung cần trình bày rõ ràng | Hướng hỏi xoáy thường gặp |
| --- | --- | --- |
| Lý thuyết phân tán | Khi cả node lẫn mạng đều không đáng tin cậy, hệ thống đánh đổi giữa tính nhất quán và tính sẵn sàng như thế nào | CAP, BASE, thuật toán đồng thuận (Consensus), Gossip, Consistent Hashing |
| RPC & Gateway | Request đi vào hệ thống như thế nào, và các service gọi nhau ra sao | Registration & Discovery, Load Balancing, Serialization, Timeout/Retry, Routing và Rate Limiting |
| ID, Lock & Transaction | Khi nhiều node cùng đọc/ghi dữ liệu, làm sao kiểm soát tính duy nhất, loại trừ lẫn nhau và nhất quán nghiệp vụ | Snowflake, Redis Lock, 2PC, TCC, Transactional Message, Saga |
| Cấu hình & Điều phối | Các node phát hiện thay đổi cấu hình và phối hợp làm việc với nhau như thế nào | Push cấu hình, quản lý phiên bản, ZNode của ZooKeeper, Watcher, bầu chọn Leader |

Khi trả lời những câu hỏi này, đừng dừng lại ở mức "có những phương án nào". Ít nhất bạn phải nêu được điều kiện lựa chọn, điều gì xảy ra khi gặp sự cố và dự án đã chuẩn bị những biện pháp dự phòng (fallback) nào.

## Lý thuyết và Thuật toán phân tán

Hãy hình dung kịch bản phổ biến nhất trước: cùng một dữ liệu được lưu thành nhiều bản sao, node có thể sập và kết nối mạng giữa các node cũng có thể bị gián đoạn. CAP, BASE và các thuật toán đồng thuận đều bàn về các lựa chọn và ràng buộc trong đúng bối cảnh này.

![Cơ chế giao tiếp trong hệ thống phân tán: Tập trung vs Phi tập trung](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-centralized-vs-decentralized-c5a64d5a.png)

Nội dung liên quan:

- [Giải thích Định lý CAP và Lý thuyết BASE](https://javaguide.cn/distributed-system/protocol/cap-and-base-theorem.html)
- [Giải thích chi tiết Điều phối phân tán](https://javaguide.cn/distributed-system/protocol/centralized-and-decentralized.html)
- [Giải thích Thuật toán Paxos](https://javaguide.cn/distributed-system/protocol/paxos-algorithm.html)
- [Giải thích Thuật toán Raft](https://javaguide.cn/distributed-system/protocol/raft-algorithm.html)
- [Giải thích chi tiết Giao thức ZAB](https://javaguide.cn/distributed-system/protocol/zab.html)
- [Giải thích chi tiết Giao thức Gossip](https://javaguide.cn/distributed-system/protocol/gossip-protocol.html)
- [Giải thích chi tiết Thuật toán Consistent Hashing](https://javaguide.cn/distributed-system/protocol/consistent-hashing.html)

Câu hỏi phỏng vấn thường gặp:

- CAP có phải là "chọn 2 trong 3" không? Vì sao nói chữ P trong hệ thống phân tán về cơ bản là không thể tránh khỏi?
- BASE và ACID khác nhau ở điểm nào? Tính nhất quán cuối cùng (Eventual Consistency) triển khai trong thực tế thế nào?
- Mô hình tập trung (Centralized) và phi tập trung (Decentralized) khác nhau ra sao? Hiểu về điểm đơn Leader (Leader SPOF), Split-Brain, đa số quá bán (Quorum) và Gossip thế nào?
- Paxos, Raft và ZAB lần lượt giải quyết bài toán gì? Vì sao Raft dễ hiểu và dễ cài đặt hơn?
- Vì sao giao thức Gossip phù hợp cho phát hiện node và lan truyền trạng thái?
- Consistent Hashing giải quyết bài toán gì? Node ảo (Virtual Node) có tác dụng gì?

Phần này bạn phải liên kết được các câu trả lời với nhau: sau khi xảy ra phân vùng mạng (Network Partition), hệ thống vẫn cung cấp được năng lực gì; khi nhiều bản sao bất đồng với nhau, ai là người chốt kết quả cuối cùng; khi tăng giảm node, dữ liệu được phân bố lại ra sao. Chỉ học thuộc từng bước thuật toán thường sẽ không đủ khi bị hỏi xoáy theo kịch bản thực tế.

## RPC và API Gateway

RPC xử lý lời gọi giữa các service với nhau, còn API Gateway tiếp nhận request từ bên ngoài. Khi ôn tập, bạn có thể trình bày dọc theo hành trình của một request: request đi qua Gateway trước để thực hiện xác thực, định tuyến (Routing) hoặc giới hạn lưu lượng (Rate Limiting), sau đó đi vào service cụ thể; các service tiếp tục gọi nhau qua RPC, nơi mà Registration & Discovery, Load Balancing, Serialization và kiểm soát Timeout phát huy tác dụng trên toàn chuỗi lời gọi.

Sơ đồ minh họa API Gateway như sau:

![Sơ đồ tổng quan API Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gateway-overview-ee8b371d.png)

Sơ đồ minh họa RPC như sau:

![Tổng quan RPC](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-overview-088d1554.png)

Nội dung liên quan:

- [Tổng hợp câu hỏi phỏng vấn Microservices](https://javaguide.cn/distributed-system/microservices-interview-questions.html)
- [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng RPC](https://javaguide.cn/distributed-system/rpc/rpc-intro.html)
- [Tổng hợp câu hỏi phỏng vấn thường gặp về Dubbo](https://javaguide.cn/distributed-system/rpc/dubbo.html)
- [HTTP và RPC khác nhau ở điểm nào?](https://javaguide.cn/distributed-system/rpc/http&rpc.html)
- [Tổng hợp kiến thức nền tảng API Gateway](https://javaguide.cn/distributed-system/api-gateway.html)
- [Tổng hợp câu hỏi thường gặp về Spring Cloud Gateway](https://javaguide.cn/distributed-system/spring-cloud-gateway-questions.html)

Câu hỏi phỏng vấn thường gặp:

- RPC và HTTP khác nhau thế nào? Vì sao các lời gọi nội bộ giữa service thường dùng RPC?
- Một RPC framework thường bao gồm những module cốt lõi nào?
- Service Registration & Discovery, Load Balancing, Serialization và Timeout/Retry lần lượt giải quyết bài toán gì?
- Ranh giới giữa API Gateway với Nginx, Load Balancer và BFF là gì?
- Spring Cloud Gateway thực hiện khớp route (Route Matching) như thế nào? Chuỗi Filter, Rate Limiting và Circuit Breaking có hiệu lực ở công đoạn nào?

Nhóm câu hỏi này tốt nhất nên trả lời gắn liền với chuỗi lời gọi (Call Chain). Đặc biệt với Timeout và Retry, đừng chỉ nói "thất bại thì Retry": request đọc và request ghi xử lý khác nhau, Retry nhiều tầng còn có thể khuếch đại lưu lượng, còn với request ghi thì trước tiên phải xét đến Tính lũy đẳng (Idempotency) và trạng thái kết quả bất định.

## Distributed ID, Lock và Transaction

Mã đơn hàng được sinh ra như thế nào, nhiều instance tranh chấp cùng một tài nguyên ra sao, và khi một nghiệp vụ đi qua nhiều service thì xử lý trường hợp thành công một phần thế nào — ba câu hỏi này tương ứng với Distributed ID, Distributed Lock và Distributed Transaction. Trong phỏng vấn Backend, phần này thường được hỏi xoáy gắn liền với dự án thực tế nên bạn cần dành nhiều thời gian ôn tập hơn.

Nội dung liên quan:

- [Giới thiệu & Tổng hợp giải pháp triển khai Distributed ID](https://javaguide.cn/distributed-system/distributed-id.html)
- [Cẩm nang thiết kế Distributed ID](https://javaguide.cn/distributed-system/distributed-id-design.html)
- [Giới thiệu Distributed Lock](https://javaguide.cn/distributed-system/distributed-lock.html)
- [Tổng hợp các giải pháp triển khai Distributed Lock phổ biến](https://javaguide.cn/distributed-system/distributed-lock-implementations.html)
- [Tổng hợp giải pháp Distributed Transaction](https://javaguide.cn/distributed-system/distributed-transaction.html)

Câu hỏi phỏng vấn thường gặp:

- Vì sao sau khi Sharding DB/bảng không thể tiếp tục phụ thuộc vào ID tự tăng của Database?
- UUID, Segment Mode trong Database, Redis và Snowflake có ưu nhược điểm gì?
- Vì sao Distributed Lock bằng Redis phải đặt thời gian hết hạn (TTL)? Vì sao phải dùng Lua Script để đảm bảo tính nguyên tử (Atomicity) khi giải phóng khóa?
- Cơ chế Watchdog của Redisson giải quyết bài toán gì? Trong những trường hợp nào khóa vẫn có thể mất hiệu lực?
- 2PC, TCC, Local Message Table, Transactional Message và Saga lần lượt phù hợp với những kịch bản nào?

Khi chuẩn bị câu trả lời, hãy đưa luôn các tình huống bất thường vào từng phương án: đồng hồ quay ngược (Clock Rollback) có ảnh hưởng tới sinh ID không, sau khi Lock hết hạn thì bên giữ khóa cũ có còn đang thực thi không, message gửi lặp lại xử lý ra sao, thao tác bù trừ (Compensation) bị lỗi thì ai tiếp quản. Sự khác biệt giữa các phương án kỹ thuật thường nằm ở chính những chi tiết này.

## Configuration Center và ZooKeeper

Configuration Center thường được hỏi cùng với cập nhật cấu hình, cơ chế Push/Pull phía Client và quản lý phiên bản; còn ZooKeeper hay xuất hiện trong các câu hỏi về Registration & Discovery, điều phối phân tán và bầu chọn Leader.

Nếu CV và dự án của bạn không dùng ZooKeeper, bạn có thể giảm mức ưu tiên ôn tập cho phần này. Nhưng hễ trong CV có ghi ZooKeeper thì phải chuẩn bị kỹ Ephemeral Node (node tạm thời), Sequential Node (node tuần tự), Watcher, cơ chế Session cùng các ứng dụng điển hình — không thể chỉ trả lời "nó có thể làm Distributed Lock".

Nội dung liên quan:

- [Tổng hợp câu hỏi phỏng vấn Distributed Configuration Center](https://javaguide.cn/distributed-system/distributed-configuration-center.html)
- [Tổng hợp khái niệm liên quan đến ZooKeeper (Nhập môn)](https://javaguide.cn/distributed-system/distributed-process-coordination/zookeeper/zookeeper-intro.html)
- [Tổng hợp khái niệm liên quan đến ZooKeeper (Nâng cao)](https://javaguide.cn/distributed-system/distributed-process-coordination/zookeeper/zookeeper-plus.html)

Câu hỏi phỏng vấn thường gặp:

- Vì sao Configuration Center không thể chỉ là một kho chứa file cấu hình?
- Thay đổi cấu hình được Push như thế nào? Làm sao đảm bảo Client nhận được cấu hình mới?
- Ephemeral Node, Sequential Node và Watcher của ZooKeeper lần lượt giải quyết được bài toán gì?
- Vì sao ZooKeeper phù hợp để làm điều phối phân tán?
- Mối quan hệ giữa ZooKeeper với Service Registry và Configuration Center là gì?

## Sắp xếp ôn tập theo thời gian chuẩn bị

| Thời gian còn lại | Lộ trình gợi ý | Mục tiêu ôn tập |
| --- | --- | --- |
| 1–2 ngày | Xem qua một lượt [Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ thống phân tán](https://interview.javaguide.cn/distributed-system/distributed-system.html), ưu tiên bổ sung Distributed ID, Lock, Transaction, RPC và Gateway | Trả lời trọn vẹn được các câu tần suất cao và nắm được giới hạn lớn nhất của từng phương án |
| 3–7 ngày | Ngoài các câu tần suất cao, học thêm CAP/BASE, Raft, Consistent Hashing và vẽ ra chuỗi lời gọi từ Gateway tới các RPC service | Giải thích được sự đánh đổi đằng sau từng phương án, gặp câu hỏi xoáy không bị dừng lại ở mức định nghĩa |
| Trên 1 tuần | Đọc các bài viết chuyên đề theo thứ tự của bài này, sau đó kết hợp dự án của bản thân để tổng hợp các case lỗi và cơ sở chọn phương án | Trình bày mạch lạc từ ràng buộc nghiệp vụ đến giải pháp, xử lý sự cố và hướng mở rộng |

Đối với các vị trí có kinh nghiệm (experienced hire) và cấp độ mid-senior, câu trả lời còn phải gắn ngược về dự án của chính bạn. Khi nhà tuyển dụng hỏi "Vì sao dùng Redis Distributed Lock?", ưu nhược điểm chung chỉ là mở bài; ngay sau đó họ thường sẽ hỏi: khóa đang bảo vệ tài nguyên gì, mức độ đồng thời (concurrency) lớn bao nhiêu, Timeout và gia hạn (renewal) xử lý thế nào, giải phóng khóa thất bại thì phát hiện bằng cách nào. Với những phương án chưa từng dùng thực tế, cứ trả lời dựa trên quá trình học và tìm hiểu của bạn, tuyệt đối không bịa số liệu dự án.
