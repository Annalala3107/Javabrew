---
title: "Giải thích chi tiết Giao thức ZAB: ZooKeeper Atomic Broadcast, Phát tán thông điệp, Khôi phục sau sự cố và Bầu chọn Leader"
category: Hệ thống phân tán
description: "Giải thích chi tiết về giao thức ZAB, trình bày cơ chế phát tán thông điệp của ZooKeeper Atomic Broadcast, khôi phục sau sự cố (Crash Recovery), bầu chọn Leader, ZXID, nhật ký giao dịch (Transaction Log) và mối quan hệ giữa ZAB với Paxos, Raft."
tag:
  - Giao thức & Thuật toán phân tán
  - Thuật toán đồng thuận
head:
  - - meta
    - name: keywords
      content: giao thức ZAB,ZooKeeper Atomic Broadcast,ZooKeeper,bầu chọn Leader,phát tán thông điệp,khôi phục sau sự cố,ZXID,nhất quán phân tán,giao thức phân tán
lang: vi
sourceRef: zh-ref/distributed-system/protocol/zab.md
---

Là một framework điều phối phân tán cực kỳ xuất sắc, ZooKeeper được giới công nghệ đánh giá rất cao về tính sẵn sàng cao và tính nhất quán dữ liệu. Nhiều người lầm tưởng ZooKeeper sử dụng thuật toán Paxos lừng danh, nhưng trên thực tế, "linh hồn" của nó là một giao thức đồng thuận được thiết kế riêng — **ZAB (ZooKeeper Atomic Broadcast — Giao thức phát tán nguyên tử ZooKeeper)**.

ZAB không phải là một thuật toán nhất quán phân tán đa dụng như Paxos; nó là một **thuật toán phát tán thông điệp nguyên tử hỗ trợ khôi phục sau sự cố được thiết kế chuyên biệt cho ZooKeeper**. Dựa trên giao thức ZAB, ZooKeeper hiện thực kiến trúc dạng chủ–tớ (Primary-Backup) để duy trì tính nhất quán dữ liệu giữa các bản sao trong cụm.

Bài viết này chỉ trình bày quy trình giao thức ZAB. Nếu bạn chưa quen với `ZNode`, `Watcher`, `Session` và các kịch bản ứng dụng của ZooKeeper, bạn nên đọc trước [Hướng dẫn nhập môn ZooKeeper](../distributed-process-coordination/zookeeper/zookeeper-intro.md). Nếu muốn nắm các khái niệm chung như Leader, Quorum và Split-brain trước, hãy đọc [Giải thích chi tiết Điều phối phân tán](./centralized-and-decentralized.md).

## Vai trò và trạng thái cốt lõi trong cụm ZAB

Trước khi đi sâu vào cách vận hành của giao thức, chúng ta cần tìm hiểu ba vai trò chính trong một cụm ZooKeeper:

- **Leader (Thủ lĩnh):** Bên xử lý yêu cầu ghi **duy nhất** trong cụm. Nó chịu trách nhiệm khởi tạo bỏ phiếu và điều phối giao dịch; mọi thao tác ghi đều bắt buộc phải đi qua Leader.
- **Follower (Người đi theo):** Có thể xử lý trực tiếp yêu cầu đọc của client. Khi nhận được yêu cầu ghi, nó sẽ chuyển tiếp (forward) sang Leader. Trong quá trình bầu chọn Leader, Follower có cả quyền bầu cử và quyền ứng cử.
- **Observer (Người quan sát):** Chức năng tương tự Follower, nhưng **không có** quyền bầu cử cũng như quyền ứng cử. Sự tồn tại của nó nhằm mở rộng năng lực đọc của cụm theo chiều ngang mà không làm ảnh hưởng đến hiệu năng đồng thuận (tức không làm tăng số phiếu cần chờ xác nhận).

Tương ứng, các node trong cụm thường nằm ở một trong bốn trạng thái sau:

- `LOOKING`: Trạng thái đang tìm kiếm Leader (đang tiến hành bầu chọn).
- `LEADING`: Node hiện tại là Leader và đang lãnh đạo cụm.
- `FOLLOWING`: Node hiện tại là Follower, phục tùng sự lãnh đạo của Leader.
- `OBSERVING`: Node hiện tại là Observer.

## Định danh cốt lõi: ZXID và Epoch

Để đảm bảo thứ tự tuyệt đối của thông điệp trong môi trường phân tán, giao thức ZAB đưa vào một mã định danh giao dịch tăng đơn điệu toàn cục — **ZXID**.

`ZXID` là một số nguyên dài 64-bit (`long`):

- **32 bit cao (Epoch — Kỷ nguyên):** Đại diện cho nhiệm kỳ của Leader hiện tại. Mỗi khi bầu ra một Leader mới, `Epoch` sẽ tăng thêm 1 so với trước đó — tương tự như một cuộc chuyển giao triều đại.
- **32 bit thấp (Transaction ID — Mã giao dịch):** Một bộ đếm tăng dần đơn giản. Với mỗi yêu cầu ghi từ client, bộ đếm này sẽ tăng thêm 1. Khi Leader mới lên nắm quyền, phần 32 bit thấp này sẽ được đặt lại về 0.

![Cấu trúc ZXID](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/zab-zxid-structure-322d6b4e.png)

## Hai chế độ cơ bản của ZAB

Hoạt động của giao thức ZAB có thể tóm gọn thành sự luân phiên giữa hai chế độ cơ bản: **Phát tán thông điệp (Message Broadcast)** (trạng thái hoạt động bình thường) và **Khôi phục sau sự cố (Crash Recovery)** (trạng thái bất thường hoặc lúc khởi động).

### 1. Chế độ phát tán thông điệp (Xử lý yêu cầu ghi bình thường)

![Chế độ phát tán thông điệp của ZAB](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/zab-message-broadcast-flow-43594a4f.png)

Khi cụm đang có một Leader khỏe mạnh và quá bán số node đã hoàn tất đồng bộ trạng thái, hệ thống sẽ đi vào chế độ phát tán thông điệp. Quá trình này tương tự một quy trình "Two-Phase Commit (2PC)" được tinh giản:

1. **Tạo đề xuất (Proposal):** Sau khi nhận yêu cầu ghi, Leader chuyển đổi nó thành một `Proposal` gắn kèm `ZXID`.
2. **Gửi tuần tự:** Leader duy trì một hàng đợi mạng vào trước ra trước (`FIFO`) riêng cho từng Follower (dựa trên giao thức `TCP`), đảm bảo các đề xuất được gửi tới Follower theo đúng thứ tự sinh ra.
3. **Ghi và phản hồi (WAL ép ghi xuống đĩa):** Sau khi nhận Proposal, Follower bắt buộc phải ghi nối tiếp vào nhật ký giao dịch cục bộ (`TxnLog`) và ép thực thi lời gọi hệ thống `fsync` để đẩy dữ liệu từ buffer của kernel ghi vật lý xuống ổ đĩa. Chỉ sau khi xác nhận dữ liệu đã nằm chắc chắn trên đĩa, nó mới gửi phản hồi `ACK` về cho Leader. Bước này là tuyến phòng thủ cốt lõi giúp ZAB chống mất dữ liệu khi mất điện. Do đó, khi triển khai vật lý, cực kỳ khuyến nghị gắn thư mục nhật ký giao dịch của ZooKeeper (`dataLogDir`) lên ổ SSD độc lập không bị tranh chấp, tránh dùng chung đĩa với các tiến trình I/O cao khác để ngăn tình trạng nghẽn `fsync` làm xấu thời gian phản hồi `P99`. Trong môi trường Production, bắt buộc phải giám sát sát sao chỉ số `fsynctime` của từng node — nếu thời gian flush đĩa trung bình thường xuyên vượt quá `100ms`, cụm có thể sập bất cứ lúc nào.
4. **Phát tán Commit:** Khi Leader nhận được phản hồi `ACK` từ **quá bán** số node, nó coi thao tác ghi này đã thành công. (Leader khi ghi log cục bộ sẽ tự cập nhật bộ đếm quorum nội bộ chứ không tự gửi `ACK` tường minh cho chính mình.) Sau khi xác nhận đạt quá bán, Leader trả kết quả thành công về cho client và phát tán thông điệp `Commit` tới mọi node. Follower sau khi nhận `Commit` sẽ chính thức áp dụng dữ liệu vào bộ nhớ.

### 2. Chế độ khôi phục sau sự cố (Leader sập hoặc mạng bất thường)

Khi hệ thống mới khởi động, hoặc khi Leader gặp sự cố hay mất liên lạc với quá bán Follower, toàn bộ cụm sẽ tạm ngừng phục vụ bên ngoài, chuyển sang trạng thái `LOOKING` và kích hoạt chế độ khôi phục sau sự cố. Quá trình khôi phục gồm hai pha chính: **Bầu chọn Leader** và **Khôi phục dữ liệu**.

![Quy trình khôi phục sau sự cố của ZAB](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/zab-crash-recovery-flow-d93e52ac.png)

#### Pha 1: Bầu chọn Leader

Nguyên tắc cốt lõi của cuộc bầu chọn là: **node sở hữu dữ liệu mới nhất được ưu tiên đắc cử**. Mỗi node đều bỏ phiếu cho chính mình trước, thông tin lá phiếu gồm `(Epoch, ZXID, myid)`. Tiếp theo các node trao đổi lá phiếu và so sánh theo thứ tự ưu tiên sau:

1. **So sánh `Epoch`:** Kỷ nguyên lớn hơn được ưu tiên.
2. **So sánh `ZXID`:** Nếu `Epoch` bằng nhau, `ZXID` lớn hơn được ưu tiên (biểu thị dữ liệu mới hơn).
3. **So sánh `myid`:** Nếu cả hai thông số trên đều bằng nhau, server có mã định danh duy nhất `myid` lớn hơn được ưu tiên.

Một khi có node giành được **quá bán** số phiếu bầu, nó sẽ trở thành Leader mới. _(Đây cũng là lý do ZooKeeper khuyến nghị triển khai số lượng server lẻ, giúp đạt khả năng chịu lỗi quá bán với chi phí tối ưu nhất.)_

#### Pha 2: Khôi phục dữ liệu

Bầu ra Leader mới chỉ là bước đầu tiên; để đảm bảo tính nhất quán dữ liệu, ZAB bắt buộc phải đạt được hai cam kết cực kỳ quan trọng trong giai đoạn đồng bộ dữ liệu:

1. **Đảm bảo các giao dịch đã được commit trên Leader cũ cuối cùng phải được commit trên tất cả các node.** _(Ngăn chặn mất dữ liệu.)_
2. **Loại bỏ những giao dịch mới chỉ được đề xuất trên Leader cũ nhưng chưa kịp commit.** _(Ngăn chặn dữ liệu rác gây nhiễu.)_

Leader mới sẽ tìm giá trị `Epoch` lớn nhất hiện tại rồi cộng thêm 1 để lập kỷ nguyên mới, sau đó đối chiếu với tất cả Follower. Follower gửi lên giá trị `lastZxid` mới nhất được ghi trong nhật ký giao dịch của mình (bao gồm cả những Proposal đã được đề xuất nhưng chưa commit); dựa vào giá trị này, Leader áp dụng chiến lược đồng bộ đa hình: **đồng bộ tăng dần phần sai khác (`DIFF`)**, **ép cắt bỏ log chưa commit (`TRUNC`)** hoặc **truyền toàn bộ snapshot (`SNAP`)**.

Thiết kế này mang tính sống còn: Leader cần nhận diện chính xác xem trong log của Follower có còn sót lại "Proposal ma" chưa hoàn tất commit từ thời Leader cũ hay không, thì mới có thể phát lệnh `TRUNC` cho nó cắt ngắn rollback lại. Nếu chỉ báo cáo `ZXID` đã commit, đám dữ liệu bẩn chưa commit này sẽ không thể bị phát hiện, và nhánh `TRUNC` sẽ không bao giờ được kích hoạt.

Quan trọng hơn nữa, lúc này `Epoch` mới đã chính thức có hiệu lực. Nếu Leader cũ gặp phải đợt JVM `Full GC` kéo dài hàng chục giây dẫn đến "chết lâm sàng", khi nó tỉnh lại và cố gắng phát Proposal mang `Epoch` cũ xuống cụm, thì do quá bán số node đã ghi nhận `Epoch` mới cao hơn và đã thiết lập quorum với Leader mới, các Proposal ma đó sẽ bị các node thẳng tay từ chối và vứt bỏ. ZAB chính là nhờ tổ hợp **cơ chế `Epoch` + đa số quorum** mà miễn nhiễm tận gốc với hiện tượng Split-brain trong môi trường mạng — chỉ từ chối dựa trên Epoch thôi chưa đủ, bắt buộc phải có quá bán node đã kết nối tới Leader mới thì Leader cũ mới thực sự mất hoàn toàn khả năng ghi.

Khi quá bán số máy đã hoàn tất đồng bộ trạng thái và dữ liệu với Leader mới, giao thức ZAB sẽ chuyển tiếp mượt mà thoát khỏi chế độ khôi phục sau sự cố và quay trở lại chế độ phát tán thông điệp.

## So sánh với Raft

**Mức độ tương đồng cao giữa ZAB và Raft:** Nếu bạn đã từng tìm hiểu thuật toán Raft, bạn sẽ thấy chúng rất giống nhau. Cả hai đều có một Leader duy nhất, đều dùng `Epoch`/`Term` để định danh nhiệm kỳ và đều áp dụng chiến lược chỉ cần quá bán node xác nhận là có thể commit. Điều này cho thấy trong lĩnh vực đồng thuận phân tán hiện đại, kiến trúc dựa trên Primary-Backup và bầu chọn đa số đã trở thành chuẩn mực thực tế.

Trong thực tiễn hệ thống phân tán hiện đại, thuật toán Raft thường được xem là lựa chọn thiết thực và phổ biến hơn so với ZAB. Lý do là ngay từ thiết kế ban đầu, Raft đã đề cao tính dễ hiểu và dễ hiện thực: nó tách bạch rõ ràng phần bầu chọn Leader, sao chép log và tính an toàn, giúp lập trình viên dễ triển khai chính xác và gỡ lỗi hơn; trong khi ZAB là giao thức chuyên dụng của ZooKeeper, thiên về các yêu cầu đặc thù của phát tán nguyên tử nên tính tổng quát kém hơn.

Raft đã được ứng dụng rộng rãi trong các hệ thống hiện đại như `etcd` của Kubernetes, HashiCorp `Consul`, Apache Kafka (trong phiên bản `KIP-500` đã gỡ bỏ phụ thuộc vào ZooKeeper để chuyển sang `KRaft` dựa trên Raft), `TiKV`, v.v., góp phần "phổ cập hóa" mạnh mẽ việc phát triển hệ thống đồng thuận phân tán.

Ngược lại, ZAB chủ yếu gắn chặt với ZooKeeper. Mặc dù ZooKeeper vẫn là một dịch vụ điều phối kinh điển, nhiều dự án mới có xu hướng chọn Raft để tránh độ phức tạp vận hành phát sinh và các điểm nghẽn tiềm ẩn của ZooKeeper (chẳng hạn chi phí đồng thuận ở quy mô lớn).

Ngoài ra, Raft có cộng đồng hỗ trợ sôi động hơn và sản sinh nhiều biến thể tối ưu (như các phiên bản cải tiến dùng trong Blockchain), giúp nó chiếm ưu thế về hiệu quả và phạm vi kịch bản ứng dụng. Tuy nhiên, nếu hệ thống của bạn đã tích hợp sâu với ZooKeeper thì ZAB vẫn là lựa chọn tối ưu nhất; ngược lại, đối với các thiết kế mới hoặc nhu cầu đồng thuận tổng quát, Raft đang là tiêu chuẩn thiết thực hơn hiện nay.

## Tổng kết

Thông qua cơ chế bầu chọn Leader và xác nhận quá bán được thiết kế chặt chẽ, giao thức ZAB đã đưa ra lựa chọn nghiêng về tính nhất quán (`C`) khi đứng trước bài toán chịu phân vùng mạng (`P`) trong hệ thống phân tán (đáp ứng thuộc tính `CP`). Khi xảy ra phân vùng mạng, ZAB thà hy sinh tạm thời tính sẵn sàng (`A`) để tiến hành bầu chọn lại, còn hơn để mất tính nhất quán của dữ liệu.

Cần đặc biệt nhấn mạnh rằng: **theo mặc định, giao thức ZAB không đảm bảo tính nhất quán mạnh nghiêm ngặt (Linearizability — nhất quán tuyến tính), mà cung cấp tính nhất quán tuần tự (Sequential Consistency)**.

Do Follower có thể xử lý trực tiếp các yêu cầu đọc từ client mà không bắt buộc dữ liệu phải đồng bộ tuyệt đối theo thời gian thực, client hoàn toàn có thể đọc nhầm dữ liệu cũ đang trễ hơn so với Leader (`Stale Read`). Trong môi trường Production, nếu nghiệp vụ đòi hỏi cực cao về độ mới của dữ liệu — ví dụ như khóa phân tán (Distributed Lock) — bắt buộc phải gọi tường minh nguyên thủy `sync()` trước khi thực thi thao tác `read()`, nhằm ép Follower đang kết nối phải đuổi kịp máy trạng thái giao dịch của Leader.

Khi xảy ra phân vùng mạng, nếu client đang kết nối tới một Follower thuộc nhóm thiểu số bị cô lập, dù thao tác ghi sẽ thất bại, nó vẫn có thể đọc ra dữ liệu lỗi thời — đây là kịch bản biên bắt buộc phải tính đến khi sử dụng giao thức ZAB.
