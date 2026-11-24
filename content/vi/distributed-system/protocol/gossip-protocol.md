---
title: "Giải thích chi tiết Giao thức Gossip: Anti-Entropy, Rumor Mongering, SWIM và Tính nhất quán cuối cùng"
category: Hệ thống phân tán
description: "Giải thích chi tiết về giao thức Gossip, trình bày mô hình lan truyền thông tin phi tập trung, chống entropy (Anti-Entropy), lan truyền tin đồn (Rumor Mongering), chế độ Push/Pull, giao thức SWIM, tính nhất quán cuối cùng (Eventual Consistency) và ứng dụng trong các hệ thống như Redis Cluster, Cassandra."
tag:
  - Giao thức & Thuật toán phân tán
  - Giao thức sao chép dữ liệu
  - Tính nhất quán cuối cùng
head:
  - - meta
    - name: keywords
      content: giao thức Gossip,giao thức SWIM,Anti-Entropy,Rumor Mongering,tính nhất quán cuối cùng,phi tập trung,Redis Cluster,Cassandra,giao thức phân tán,thuật toán phân tán
lang: vi
sourceRef: zh-ref/distributed-system/protocol/gossip-protocol.md
---

## Bối cảnh

Trong hệ thống phân tán, việc chia sẻ trạng thái giữa các node khác nhau là một nhu cầu cơ bản.

Một cách tiếp cận đơn giản là **phát tán tập trung (Centralized Broadcast)**: một node trung tâm đồng bộ thông tin tới tất cả các node khác. Cách này phù hợp với hệ thống tập trung nhưng tồn tại nhược điểm rõ rệt: khi số lượng node tăng lên, hiệu quả đồng bộ suy giảm (độ phức tạp `O(N)`), đồng thời phụ thuộc quá mức vào node trung tâm, tiềm ẩn rủi ro điểm lỗi đơn (Single Point of Failure).

**Giao thức Gossip** với cơ chế **lan truyền phân tán** mang lại một giải pháp thay thế phi tập trung.

Nếu bạn chưa rõ Leader/Quorum và Gossip lần lượt phù hợp để giải quyết bài toán nào, hãy đọc trước [Giải thích chi tiết Điều phối phân tán](./centralized-and-decentralized.md). Bài viết về Gossip này chỉ đi sâu vào "trạng thái lan truyền và hội tụ dần như thế nào", không giải quyết các vấn đề điều phối mạnh như bầu chọn Leader, split-brain (chia rẽ cụm) hay Fencing Token.

![Cơ chế giao tiếp trong hệ thống phân tán: Tập trung vs Phi tập trung](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-centralized-vs-decentralized-c5a64d5a.png)

## Giới thiệu về giao thức Gossip

**Gossip** (giao thức truyền miệng) còn được gọi là **giao thức Epidemic** (giao thức dịch bệnh), lấy cảm hứng từ đặc tính ngẫu nhiên của sự lây lan dịch bệnh. Tư tưởng cốt lõi là: mỗi node định kỳ chọn ngẫu nhiên một vài node khác để trao đổi thông tin, giúp dữ liệu lan tỏa khắp toàn bộ mạng lưới giống như cách virus lây lan.

![Ý nghĩa thuật ngữ Gossip](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-04365d30.png)

Giao thức Gossip lần đầu được Demers và cộng sự đề xuất trong bài báo năm 1987 [Epidemic Algorithms for Replicated Database Maintenance](https://dl.acm.org/doi/10.1145/41840.41841), nhằm giải quyết bài toán đồng bộ bản sao (replica) trong cơ sở dữ liệu phân tán.

**Định nghĩa**: Giao thức Gossip là một giao thức giao tiếp **phi tập trung**. Thông qua việc trao đổi thông tin ngẫu nhiên giữa các node, với giả định môi trường **phi Byzantine (không có node độc hại), không tồn tại phân vùng mạng vĩnh viễn** và các node tiếp tục trao đổi định kỳ, trạng thái của mọi node trong cụm sẽ đạt đến **tính nhất quán cuối cùng (Eventual Consistency)**.

> **Phân biệt quan trọng**: Gossip là giao thức lan truyền thông tin, **không phải thuật toán đồng thuận (Consensus Algorithm)** như Raft hay Paxos. Thuật toán đồng thuận đảm bảo tính nhất quán mạnh (Strong Consistency) và tính an toàn (Safety), trong khi Gossip chỉ đảm bảo tính nhất quán cuối cùng, không phù hợp với các kịch bản cần nhất quán mạnh như bầu chọn Leader hay sao chép máy trạng thái (State Machine Replication).

**Đặc tính cốt lõi**:

- **Phi tập trung**: Không có node trung tâm, mọi node có vị thế ngang hàng.
- **Khả năng chịu lỗi cao**: Chịu được sự cố sập node, phân vùng mạng, thêm hoặc xóa node động.
- **Hội tụ theo xác suất**: Trong mô hình kinh điển với chọn node ngẫu nhiên đều và fanout là hằng số, số vòng lan truyền kỳ vọng là `O(log N)` (ví dụ khi `N = 100` khoảng 5–7 vòng, tùy vào fanout và tỷ lệ mất gói tin).
- **Dư thừa thông điệp**: Cùng một thông điệp có thể được nhận nhiều lần, nên cần cơ chế khử trùng lặp (Deduplication).

## Ứng dụng của giao thức Gossip

Giao thức Gossip được ứng dụng rộng rãi trong các hệ thống phân tán:

- **Redis Cluster**: Dùng để đồng bộ trạng thái giữa các node và phát hiện lỗi.
- **Apache Cassandra**: Dùng để lan truyền thông tin thành viên và trạng thái node; việc sửa chữa bản sao (replica repair) sử dụng Anti-Entropy / repair (dựa trên Merkle Tree).
- **Consul**: Dùng để phát hiện thành viên (Member Discovery), thăm dò lỗi và phát tán sự kiện (dựa trên giao thức SWIM).
- **Amazon Dynamo**: Dùng để đạt tính nhất quán cuối cùng cho hệ thống lưu trữ phân tán.

Lấy **Redis Cluster** (3.0+) làm ví dụ:

Redis Cluster là một giải pháp distributed cache phi tập trung, trong đó các node trao đổi trạng thái cụm thông qua giao thức Gossip, bao gồm: thông tin node, phân bổ slot và trạng thái node (online / `PFAIL` / `FAIL`).

![Giải pháp cụm chính thức của Redis](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/up-fcacc1eefca6e51354a5f1fc9f2919f51ec-5526f47c.png)

**Các loại thông điệp Gossip**:

| Loại thông điệp | Mục đích                                                |
| --------------- | ------------------------------------------------------- |
| MEET            | Thêm một node được chỉ định vào cụm                     |
| PING            | Gửi định kỳ để trao đổi trạng thái các node             |
| PONG            | Phản hồi PING, mang theo thông tin trạng thái của mình  |
| FAIL            | Phát tán thông báo đánh dấu một node đã gặp sự cố       |

> Ghi chú: Trong cài đặt thực tế, `MEET`, `PING` và `PONG` dùng chung một cấu trúc thông điệp; `PONG` là phản hồi cho `PING`/`MEET`, còn `MEET` tương đương với một `PING` "ép bắt tay".

**Quy trình phát hiện lỗi**:

1. Nếu node A không nhận được phản hồi từ node B trong khoảng `cluster-node-timeout` (thường là 15s, tùy cấu hình), A sẽ đánh dấu B là **PFAIL** (Possibly Fail — nghi ngờ ngoại tuyến).
2. Nếu A nhận được báo cáo `PFAIL` về B từ các node Master khác, và **hơn một nửa số node Master** xác nhận B đang ở trạng thái `PFAIL` (báo cáo chưa hết hạn), A sẽ đánh dấu B là **FAIL** (đã ngoại tuyến) và phát tán thông báo tới toàn cụm.

Hình dưới đây minh họa kiến trúc Redis Cluster dạng Master-Replica: đường nét đứt biểu thị giao tiếp Gossip giữa các node, còn đường nét liền biểu thị sao chép Master-Replica.

![Các node trong Redis Cluster giao tiếp với nhau bằng Gossip](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/redis-cluster-gossip-94621dda.png)

> Ghi chú: Redis Cluster chủ yếu lan truyền thông tin node/slot/sự cố thông qua Gossip tăng dần trong `PING`/`PONG` (kèm timestamp/cờ trạng thái), chứ không áp dụng quy trình đối soát Anti-Entropy dựa trên Merkle Tree như Dynamo.

Để tìm hiểu chi tiết về Redis Cluster, bạn có thể xem bài viết [Giải thích chi tiết Redis Cluster (Trả phí)](https://javaguide.cn/database/redis/redis-cluster.html).

## Các chế độ lan truyền của giao thức Gossip

Giao thức Gossip có hai chế độ lan truyền chính: **Anti-Entropy (Chống Entropy)** và **Rumor Mongering (Lan truyền tin đồn)**.

### Anti-Entropy (Chống Entropy)

**Định nghĩa**: Các node trao đổi **toàn bộ dữ liệu** (hoặc bản tóm tắt dữ liệu / digest) để loại bỏ sai lệch và đạt được tính nhất quán cuối cùng.

Trong vật lý, **Entropy** biểu thị mức độ hỗn loạn của hệ thống; Anti-Entropy nghĩa là **giảm sự khác biệt dữ liệu giữa các node, nâng cao tính nhất quán**.

Theo Wikipedia:

> Khái niệm entropy bắt nguồn từ [vật lý](https://zh.wikipedia.org/wiki/%E7%89%A9%E7%90%86%E5%AD%A6), dùng để đo lường mức độ hỗn loạn của một hệ nhiệt động lực học. Entropy nên được hiểu là thước đo sự bất định hơn là sự chắc chắn, vì nguồn tin càng ngẫu nhiên thì entropy càng lớn.

Ở đây, bạn có thể hiểu entropy trong Anti-Entropy là mức độ hỗn loạn hoặc sai khác dữ liệu giữa các node; Anti-Entropy chính là xóa bỏ sự khác biệt dữ liệu giữa các node, tăng độ tương đồng dữ liệu để giảm giá trị entropy.

**Ba phương thức triển khai**:

| Phương thức | Mô tả                                                      | Kịch bản phù hợp            |
| ----------- | ---------------------------------------------------------- | --------------------------- |
| Push        | Bên gửi đẩy toàn bộ dữ liệu của mình sang bên nhận         | Bên gửi có dữ liệu mới      |
| Pull        | Bên nhận kéo toàn bộ dữ liệu từ bên gửi                    | Dữ liệu bên nhận bị cũ      |
| Push-Pull   | Hai bên trao đổi dữ liệu hai chiều và so sánh sai khác     | Hiệu quả nhất, phổ biến nhất |

![Cơ chế Anti-Entropy: Biểu đồ tuần tự tương tác Push-Pull](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-anti-entropy-pushpull-aa62b9bc.png)

Mã giả (pseudocode) như sau:

![Mã giả Anti-Entropy](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/up-df16e98bf71e872a7e1f01ca31cee93d77b-986bf4ca.png)

**Đặc tính hội tụ**: Trong mô hình chọn node ngẫu nhiên đều và fanout là hằng số, kỳ vọng mất `O(log N)` vòng để bao phủ toàn bộ node (thường ước lượng ở cấp độ `log₂N`).

Một số hệ thống (như InfluxDB) áp dụng **lập lịch vòng kín tất định (Deterministic Closed-Loop Scheduling)** (chẳng hạn topology dạng vòng) thay cho chọn ngẫu nhiên, giúp hoàn tất đồng bộ trong số vòng xác định. Đây là một **biến thể kỹ thuật dẫn xuất** của Anti-Entropy, không phải cơ chế cốt lõi của giao thức Gossip chuẩn. Lập lịch tất định đánh đổi ưu thế chịu lỗi của tính ngẫu nhiên để lấy thời gian hội tụ có thể dự đoán.

![Lập lịch vòng kín tất định](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/raft-anti-entropyclosed-loop-77b7b3c0.png)

1. Node A đẩy dữ liệu sang node B, node B nhận được dữ liệu mới nhất từ node A.
2. Node B đẩy dữ liệu sang node C, node C nhận được dữ liệu mới nhất từ node A và B.
3. Node C đẩy dữ liệu sang node A, node A nhận được dữ liệu mới nhất từ node B và C.
4. Node A tiếp tục đẩy dữ liệu sang node B để khép kín vòng, giúp node B nhận được dữ liệu mới nhất từ node C.

**Đánh đổi**: Lập lịch vòng kín hoàn tất đồng bộ trong thời gian xác định, nhưng hy sinh **khả năng chịu lỗi** (một node trong vòng gặp sự cố sẽ ảnh hưởng đường lan truyền) và khó thích ứng khi thêm/xóa node động.

**Kịch bản phù hợp**: Các hệ thống cần tỷ lệ sót cập nhật thấp (cố gắng không bỏ lỡ bản ghi), chấp nhận đối soát sửa lỗi định kỳ ở chế độ nền; khi lượng dữ liệu lớn, bắt buộc phải dựa vào digest hoặc cấu trúc cây để so sánh tăng dần nhằm kiểm soát chi phí.

> **Tối ưu cấp Production**: Trong các hệ thống lưu trữ phân tán quy mô lớn (như Cassandra, DynamoDB), dung lượng dữ liệu trên mỗi node có thể lên tới hàng TB, việc trao đổi toàn bộ dữ liệu trực tiếp là bất khả thi. Hệ thống Production sử dụng **Merkle Tree** để so sánh sai lệch tăng dần: hai node trao đổi root hash của Merkle Tree trước; nếu có khác biệt sẽ đệ quy đối chiếu các cây con để khoanh vùng sai khác ở chiều cao cây `O(log M)` (`M` là số phần tử trong phạm vi đó), sau đó chỉ truyền phần dữ liệu tăng dần.

### Rumor Mongering (Lan truyền tin đồn)

**Định nghĩa**: Khi một node có **dữ liệu mới**, nó trở thành node hoạt động (active) và định kỳ phát tán dữ liệu đó tới các node ngẫu nhiên cho đến khi tất cả các node đều nhận được.

**Điểm khác biệt so với Anti-Entropy**:

- Chỉ lan truyền **dữ liệu mới phát sinh** (Delta), không truyền toàn bộ dữ liệu.
- Sau khi nhận bản cập nhật, node bước vào trạng thái hoạt động để lan truyền định kỳ; sau nhiều lần bắt gặp các node đã biết bản cập nhật này, nó sẽ dừng lan truyền theo chính sách (đếm số lần / xác suất / TTL).
- Phù hợp với kịch bản **số lượng node lớn** và **dữ liệu tăng dần nhỏ**.

> **Cơ chế khử trùng lặp**: Môi trường Production (như Redis Cluster) sử dụng **số phiên bản (Version Number)** hoặc **Message ID** để khử trùng lặp, tránh xử lý lặp lại cùng một thông điệp.

Minh họa như hình dưới đây (hình lấy từ bài viết [INTRODUCTION TO GOSSIP](https://managementfromscratch.wordpress.com/2016/04/01/introduction-to-gossip/)):

![Minh họa lan truyền Gossip](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-rumor-mongering-fa010ea1.gif)

Mã giả (pseudocode) như sau:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/20210605170707933-bf551c2f.png)

**Đặc tính hội tụ**: Trong mô hình chọn node ngẫu nhiên đều và fanout là hằng số, sau `O(log N)` vòng sẽ bao phủ toàn bộ node với xác suất cao.

**Lưu ý khi triển khai**:

- Kiểm soát kích thước gói tin, cố gắng tránh phân mảnh (tùy thuộc vào đường truyền MTU, thường giữ vừa trong một gói mạng đơn).
- Kết hợp cơ chế khử trùng lặp (như Message ID, số phiên bản).
- Tránh bão thông điệp (Message Storm) do cập nhật tần suất cao.
- Sử dụng **Jitter (độ trễ ngẫu nhiên)** để phân tán thời điểm đồng bộ, tránh việc nhiều node đồng loạt phát tán gây hiệu ứng sụp đổ (Avalanche).

![Giao thức Gossip: Quá trình lan truyền ngẫu nhiên và hội tụ](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-propagation-ce836438.png)

### Tổng kết

| Tiêu chí           | Anti-Entropy                            | Rumor Mongering                          |
| ------------------ | --------------------------------------- | ---------------------------------------- |
| Nội dung lan truyền | Toàn bộ dữ liệu (hoặc digest)          | Chỉ dữ liệu mới phát sinh (Delta)        |
| Kịch bản phù hợp   | Số lượng node vừa phải                  | Số lượng node lớn / thay đổi động        |
| Chi phí thông điệp | Lớn hơn                                 | Nhỏ hơn                                  |
| Phạm vi hội tụ     | Hội tụ về dữ liệu mới nhất (đồng bộ toàn phần) | Hội tụ về dữ liệu đã biết (lan truyền tăng dần) |

## Ưu điểm và nhược điểm của giao thức Gossip

**Ưu điểm**:

1. **Cài đặt đơn giản**: Logic giao thức gọn gàng, dễ hiểu.

2. **Khả năng chịu lỗi cao**: Chịu được sự cố sập node, phân vùng mạng, thêm hoặc xóa node động. Các node mới thêm hoặc khởi động lại trong điều kiện lý tưởng cuối cùng chắc chắn sẽ đạt trạng thái nhất quán với các node khác.

3. **Khả năng mở rộng tốt**: Thời gian hội tụ là `O(log N)`. Khi `N` lớn (ví dụ `N > 100`), lan truyền song song thường nhanh hơn phát unicast từ node trung tâm (vốn cần `O(N)` vòng). Trong mô hình Rumor Spreading điển hình, cái giá phải trả là **tổng lượng thông điệp ở mức `O(N log N)`** (tùy thuộc chiến lược triển khai và điều kiện dừng), tồn tại chi phí dư thừa.

**Nhược điểm**:

1. **Chỉ đạt nhất quán cuối cùng**: Thông điệp cần nhiều vòng lan truyền mới phủ kín toàn mạng, tồn tại khoảng thời gian không nhất quán. Thời gian thực tế để đạt nhất quán phụ thuộc vào tình trạng mạng, chu kỳ Gossip (**tùy cấu hình triển khai, thường từ 100ms–1s**) và quy mô node.

2. **Không phù hợp với môi trường Byzantine**: Giao thức Gossip được thiết kế với giả định môi trường phi Byzantine, không xử lý trường hợp node độc hại (các node không giả mạo hay sửa đổi thông điệp).

3. **Dư thừa thông điệp**: Do tính ngẫu nhiên của quá trình lan truyền, cùng một node có thể nhận lặp lại thông điệp giống nhau, đòi hỏi phải kết hợp cơ chế khử trùng lặp.

## Tổng kết

- Giao thức Gossip là một giao thức giao tiếp **phi tập trung**, giúp tất cả các node trong cụm đạt được **tính nhất quán cuối cùng** thông qua trao đổi thông tin ngẫu nhiên.
- **Không phải thuật toán đồng thuận**: Gossip không đảm bảo tính nhất quán mạnh / tính tuyến tính (Linearizability), không thể dùng để bầu chọn Leader hay sao chép máy trạng thái; các thuật toán đồng thuận (Raft/Paxos) mới đảm bảo tính an toàn và nhất quán tuyến tính.
- Đặc tính cốt lõi: phi tập trung, chịu lỗi cao, hội tụ `O(log N)`.
- Hai chế độ lan truyền: **Anti-Entropy** (toàn bộ dữ liệu / digest) và **Rumor Mongering** (dữ liệu tăng dần).
- Ứng dụng tiêu biểu: lan truyền metadata (Redis Cluster), lưu trữ nhất quán cuối cùng (Cassandra/DynamoDB).
- Đánh đổi: sự đơn giản và khả năng chịu lỗi đổi lấy độ trễ nhất quán cuối cùng và dư thừa thông điệp.

## Tài liệu tham khảo

- [Epidemic Algorithms for Replicated Database Maintenance](https://dl.acm.org/doi/10.1145/41840.41841) - Demers et al., 1987
- [Amazon Dynamo: All Things Distributed](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) - DeCandia et al., 2007
- [Redis Cluster Specification](https://redis.io/docs/management/scaling/)
- Phân tích chuyên sâu 10.000 chữ về giao thức Gossip của Redis Cluster: <https://segmentfault.com/a/1190000038373546>
- *Thực chiến Giao thức và Thuật toán Phân tán*
- *Thiết kế và Hiện thực Redis*
