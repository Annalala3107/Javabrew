---
title: "Giải thích chi tiết Điều phối phân tán: Leader, Quorum, Lease, Fencing Token và Gossip"
description: "Giải thích chi tiết cơ chế điều phối phân tán (Distributed Coordination), trình bày bài toán ra quyết định và bài toán lan truyền trạng thái trong thiết kế tập trung và phi tập trung, bao gồm Leader, Quorum, đa số phiếu (Majority), Term/Epoch, Lease, Fencing Token, Gossip, tính lũy đẳng (Idempotency) và ngữ nghĩa thực thi tác vụ định kỳ."
category: Hệ thống phân tán
tag:
  - Lý thuyết hệ thống phân tán
  - Giao thức & Thuật toán phân tán
  - Thiết kế hệ thống
head:
  - - meta
    - name: keywords
      content: điều phối phân tán,tập trung,phi tập trung,Leader,Primary,Quorum,đa số phiếu,bầu chọn Leader,Lease,Fencing Token,Gossip,lũy đẳng,nhất quán cuối cùng,tác vụ định kỳ
lang: vi
sourceRef: zh-ref/distributed-system/protocol/centralized-and-decentralized.md
---

Một tác vụ định kỳ (CronJob) được triển khai trên 3 instance, đến 2 giờ sáng thì rốt cuộc instance nào đứng ra chạy lô tác vụ này?

Nếu cả 3 instance cùng chạy, dữ liệu có thể bị xử lý trùng lặp; nếu cả 3 cùng chờ đối phương chạy, tác vụ sẽ bị bỏ sót. Cụm Cache, Message Queue, Trung tâm cấu hình (Config Center) hay Distributed Lock cũng gặp bài toán tương tự: khi có nhiều node, hệ thống bắt buộc phải có cơ chế quyết định "ai phụ trách việc gì", "ai hiện tại vẫn còn sống" và "lần thay đổi này có hiệu lực theo thứ tự nào".

Đó chính là bài toán điều phối (Coordination) trong hệ thống phân tán.

Tuy nhiên, ở đây cần phân biệt rạch ròi hai việc: **chỉ bầu ra một bên thực thi**, và **nghiệp vụ chỉ phát sinh hiệu lực đúng một lần**.

Bầu chọn chủ (Leader Election), Distributed Lock hay tranh giành qua database có thể giảm bớt tình trạng nhiều instance cùng chạy song song, nhưng tự thân chúng không thể đảm bảo ngữ nghĩa Exactly-once từ đầu đến cuối (End-to-end). Node thực thi có thể đã xử lý nghiệp vụ thành công, nhưng lại sập ngay trước khi kịp cập nhật trạng thái tác vụ; hệ thống lập lịch để tránh bỏ sót công việc chỉ còn cách phát lại tác vụ đó. Tài liệu chính thức của Kubernetes CronJob cũng từng lưu ý rằng thời điểm CronJob tạo ra Job chỉ là xấp xỉ — trong một số tình huống có thể tạo ra hai Job hoặc không tạo Job nào, vì vậy bản thân Job cần được thiết kế theo hướng lũy đẳng (Idempotent).

Các tác vụ định kỳ trong môi trường Production thường tiệm cận mô hình "thực thi ít nhất một lần (At-least-once) + nghiệp vụ lũy đẳng (Idempotency)": dùng Task ID, khóa duy nhất nghiệp vụ, máy trạng thái (State Machine), bảng chống trùng (Deduplication Table) hoặc ràng buộc Transaction để đảm bảo cùng một lô dữ liệu dù chạy lặp lại cũng không gây tác dụng phụ phát sinh.

![Ngữ nghĩa thực thi tác vụ định kỳ](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/cronjob-execution-semantics-0d7c49e2.webp)

Bài viết này chỉ bàn về các đánh đổi trong thiết kế (Design Trade-offs), không đi sâu vào chi tiết hiện thực đầy đủ của từng hệ thống cụ thể như ZooKeeper, etcd, Redis Cluster hay Eureka. Muốn xem thuật toán đồng thuận, bạn có thể đọc tiếp [Giải thích chi tiết Thuật toán Raft](./raft-algorithm.md) và [Giải thích chi tiết Giao thức ZAB](./zab.md); muốn xem lan truyền trạng thái, hãy đọc [Giải thích chi tiết Giao thức Gossip](./gossip-protocol.md); muốn xem cơ chế loại trừ lẫn nhau trong nghiệp vụ, hãy đọc [Giải thích chi tiết Các giải pháp Distributed Lock](../distributed-lock-implementations.md).

## Bài viết này liên hệ thế nào với các bài khác?

[Nhập môn Hệ thống phân tán](../distributed-system-intro.md) giải quyết câu hỏi "tại sao hệ thống đơn máy sau khi tách thành nhiều node lại trở nên phức tạp". [Giải thích chi tiết Định lý CAP và Lý thuyết BASE](./cap-and-base-theorem.md) giải quyết câu hỏi "khi xảy ra phân vùng mạng, tính nhất quán và tính sẵn sàng đánh đổi ra sao". Raft, Paxos, ZAB giải quyết câu hỏi "làm thế nào một nhóm node đạt đồng thuận trên một giá trị hoặc thứ tự log". Gossip giải quyết câu hỏi "trạng thái lan truyền qua lại giữa lượng lớn node và cuối cùng hội tụ như thế nào".

Bài viết này nằm ở khoảng giữa, tập trung trả lời một câu hỏi mang tính kỹ thuật thực tế hơn: **một hệ thống phân tán rốt cuộc điều phối nhiều node bằng cách nào?**

Để tránh các khái niệm bị trộn lẫn vào nhau, trước tiên tách thành hai nhóm bài toán:

- **Bài toán ra quyết định (Decision)**: Ai được làm Leader? Bản ghi log nào đó có được commit không? Tài nguyên nào đó hiện thuộc về ai? Tác vụ nào đó có được phép chạy không?
- **Bài toán lan truyền (Propagation)**: Trạng thái thành viên, báo cáo sự cố, phiên bản cấu hình hay Metadata của Cache lan tỏa tới các node khác bằng cách nào?

![Bài toán ra quyết định và lan truyền trong điều phối phân tán](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-coordination-decision-vs-propagation-9ea61451.webp)

Leader, Quorum, Lease, Lock và Fencing Token xoay quanh quyền ra quyết định và tư cách thực thi; còn Gossip chủ yếu giải quyết bài toán lan truyền trạng thái. Các hệ thống thực tế thường kết hợp nhiều cơ chế này với nhau, hiếm khi chỉ đơn giản chọn "tập trung" hoặc "phi tập trung" một cách cực đoan.

## Tại sao hệ thống phân tán cần điều phối?

Trong hệ thống đơn máy, nhiều việc có thể xử lý thẳng bằng bộ nhớ cục bộ, Transaction database hoặc khóa tiến trình. Sang hệ thống phân tán, những cách đó đột nhiên không còn đủ nữa.

Hệ thống phân tán có thêm một tầng mạng, và sự bất định cũng kéo theo từ đó.

Mỗi node chỉ nhìn thấy được trạng thái cục bộ của chính mình cùng những thông điệp mà nó đã nhận. Một node không phản hồi có thể là đã sập thật, nhưng cũng có thể chỉ do mạng chập chờn, dừng GC (GC Pause), nghẽn Disk I/O hoặc cạn Thread Pool. Lỗi Timeout mà bên gọi nhìn thấy chỉ chứng minh rằng trong khoảng thời gian quy định nó chưa nhận được kết quả, chứ không chứng minh được phía bên kia chắc chắn chưa thực thi.

Điều phối sinh ra để giải quyết đúng những vấn đề đó:

- **Quản lý thành viên (Membership)**: Trong cụm đang có những node nào? Những node nào hiện được phép tham gia làm việc?
- **Phân bổ tác vụ (Task Assignment)**: Một Shard, tác vụ, phân vùng hay bản sao chính (Primary Replica) nào đó do ai phụ trách?
- **Kiểm soát thứ tự (Ordering Control)**: Khi nhiều node đồng thời gửi thay đổi, cái nào trước cái nào sau?
- **Chuyển đổi dự phòng (Failover)**: Khi node phụ trách mất liên lạc, ai đứng ra tiếp quản? Trước khi tiếp quản cần xác nhận những trạng thái nào?
- **Thúc đẩy phiên bản (Version Advancement)**: Sau khi cấu hình, Metadata hoặc kết quả bầu chọn thay đổi, làm sao để các node phân biệt được trạng thái mới và cũ?

Những bài toán này có thể giao cho Leader hiện tại điều phối thống nhất, cũng có thể để một nhóm node cùng phán đoán qua Quorum, hoặc lan truyền trạng thái quan sát được qua Gossip rồi mới dùng bỏ phiếu, số phiên bản hoặc quy tắc nghiệp vụ để chốt quyết định.

## Điều phối qua Leader/Quorum: Ai là người ra quyết định?

Nhiều hệ thống đưa vào vai trò Leader, Primary hoặc bộ điều phối trung tâm. Các node khác chủ yếu thực thi công việc, hoặc cập nhật trạng thái dựa trên log, cấu hình và kết quả phân bổ do Leader thúc đẩy.

Chỗ này dễ nảy sinh một hiểu lầm: có Leader không đồng nghĩa với việc có một điểm lỗi đơn (Single Point of Failure) mong manh. Trong các hệ thống như Raft hay ZAB, Leader chỉ là vai trò hiện tại được bầu ra từ nhiều bản sao, trạng thái vẫn được bảo vệ bởi sao chép log và Quorum. Điều thực sự cần xem xét là trạng thái phía sau Leader có bản sao bảo vệ hay không, khi Leader sập có bầu được Leader mới hay không, và Leader mới có tiếp nhận được trạng thái cũ để chạy tiếp hay không.

Trách nhiệm phổ biến của Leader gồm vài nhóm sau.

Nhóm thứ nhất là duy trì góc nhìn toàn cụm (Cluster View). Ví dụ những Worker nào đang trực tuyến, tải của từng Worker ra sao, Shard nào hiện thuộc về ai, bản sao nào đang tụt hậu quá xa. Thông tin này có thể đến từ Heartbeat, báo cáo chủ động, thăm dò (Probe) hoặc từ thông tin đăng ký trong tầng lưu trữ bên dưới.

Nhóm thứ hai là ra quyết định phân bổ. Ví dụ hệ thống lập lịch giao tác vụ cho một Executor, hệ thống lưu trữ phân tán di chuyển Shard sang một máy khác, hoặc Message Queue chuyển Partition Leader sang một bản sao khác. Các Worker không cần tự đoán mò, chỉ cần thực thi đúng kết quả phân bổ đã được xác nhận.

Nhóm thứ ba là kiểm soát thứ tự ghi. Nhiều hệ thống phân tán không ngại phân tán request đọc; thứ thực sự rắc rối là request ghi. Nhiều node cùng sửa Metadata một lúc mà không có thứ tự thống nhất thì rất dễ xảy ra chuyện hai node cùng tưởng mình nắm giữ một Shard, hoặc hai tác vụ cùng tưởng mình là bên thực thi chính. Leader có thể tuần tự hóa các lệnh ghi thành một chuỗi log có thứ tự rồi sao chép sang các node khác.

Leader giúp hành vi hệ thống dễ hiểu hơn, khi điều tra sự cố cũng dễ tìm ra đầu mối ra quyết định. Cái giá phải trả là luồng điều phối có thể trở thành nút thắt cổ chai (Bottleneck), đồng thời hệ thống bắt buộc phải xử lý việc nhận định nhầm, Split-brain và Failover.

## Điều phối qua Leader/Quorum gặp những vấn đề gì?

Vấn đề dễ nghĩ tới nhất là điểm lỗi đơn tại Leader.

Nếu trạng thái của Leader chỉ lưu trong bộ nhớ của riêng nó, khi Leader sập thì cả cụm sẽ mất sạch thông tin về phân bổ tác vụ hiện tại, quyền sở hữu Shard và Metadata mới nhất. Thiết kế kiểu đó đúng là rất nguy hiểm. Cách làm kỹ thuật phổ biến hơn là chỉ để Leader đóng vai trò "người ra quyết định hiện tại", còn Metadata và log được sao chép sang nhiều bản sao. Khi Leader sập, các node còn lại dựa trên log sẵn có để bầu ra Leader mới.

Vấn đề khác là nút thắt cổ chai. Mọi request điều phối đều đi qua Leader, nên CPU, mạng và tốc độ ghi log ra đĩa của Leader sẽ giới hạn toàn hệ thống. Nhất là khi Metadata thay đổi liên tục, Leader sẽ trở thành trần mở rộng của cả hệ thống. Nhiều hệ thống tách riêng Data Plane (mặt phẳng dữ liệu) và Control Plane (mặt phẳng điều khiển): đọc ghi thông thường phân tán tối đa, chỉ các thao tác như bầu chọn Leader, thay đổi Metadata hay di chuyển Shard mới đi qua chuỗi điều phối.

Rắc rối hơn nữa là nhận định nhầm (False Positives).

Kiểm tra Heartbeat rất phổ biến, nhưng Heartbeat không phải "giấy chứng tử". Leader không nhận được Heartbeat của Worker chỉ chứng tỏ trong điều kiện mạng và ngưỡng Timeout hiện tại, nó chưa nhận được phản hồi. Worker có thể vẫn đang xử lý tác vụ, chỉ là bị khựng bởi Full GC, cô lập mạng hoặc nghẽn ghi đĩa. Nếu Leader giao ngay tác vụ đó cho một Worker khác, rồi Worker cũ hồi phục và ghi tiếp kết quả, hiện tượng ghi trùng lặp sẽ xảy ra.

Split-brain (chia rẽ cụm) cũng bắt nguồn từ đây.

Khi xảy ra Split-brain, nhiều phân vùng mạng sẽ cùng lúc cho rằng mình có quyền đẩy tiếp trạng thái hệ thống. Ví dụ Leader ban đầu bị cô lập cùng một số node, trong khi nhóm node còn lại bầu ra Leader mới. Nếu cả hai Leader đều chấp nhận ghi từ bên ngoài, sau khi mạng thông lại sẽ xuất hiện hai luồng trạng thái mâu thuẫn nhau. Với Trung tâm cấu hình, Distributed Lock, chuyển đổi Master-Slave hay quyền sở hữu Shard, điều này thường không thể chấp nhận được.

Vì thế, cái khó không chỉ nằm ở "bầu ra một Leader", mà còn phải làm sao để Leader cũ sau khi mất tư cách không thể tiếp tục gây hại.

## Làm thế nào để giảm thiểu điểm lỗi đơn của Leader và Split-brain?

Chỉ bố trí thêm cho Leader một node dự phòng là chưa đủ. Muốn node dự phòng tiếp quản an toàn, nó phải biết Leader đã từng đưa ra những quyết định nào, quyết định nào đã commit và quyết định nào chỉ do bản thân Leader tự tưởng là đã thành công.

Điều này đòi hỏi bản sao (Replica), Quorum và các ràng buộc giao thức.

### Đa số phiếu (Majority) không phải lời giải trọn vẹn

Quy tắc đa số rất dễ hiểu: chỉ khi quá nửa số node đồng ý thì một quyết định mới được coi là có hiệu lực. Giả sử cụm có `N` node bỏ phiếu, đa số phiếu là `floor(N/2) + 1`. Cụm 3 node cần 2 phiếu đồng ý, cụm 5 node cần 3 phiếu đồng ý.

Công thức này mặc định dựa trên vài tiền đề:

- Tập thành viên tương đối cố định;
- Trọng số của mỗi node bỏ phiếu là ngang nhau;
- Chỉ xử lý lỗi sập máy và phân vùng mạng, không xét node độc hại;
- Sử dụng Quorum đa số thông thường, không phải Weighted Quorum, Flexible Quorum hay BFT Quorum.

Quy tắc đa số có một tính chất quan trọng: hai tập đa số bất kỳ chắc chắn có phần giao nhau.

Nhưng chỉ "tồn tại phần giao" là chưa đủ. Giao thức còn phải ràng buộc ai đủ tư cách trúng cử và Leader mới khôi phục trạng thái như thế nào. Lấy Raft làm ví dụ: mỗi node trong cùng một Term chỉ bỏ tối đa một phiếu, và log của ứng viên (Candidate) bắt buộc phải mới ít nhất bằng log của người bỏ phiếu. Phần giao của tập đa số kết hợp với kiểm tra độ mới của log mới đảm bảo các log đã commit không bị mất trong những lần bầu chọn tiếp theo — Raft gọi tính chất này là Leader Completeness.

Do đó, đa số phiếu tạo ra nền tảng giao nhau; tính an toàn thực sự còn đến từ quy tắc bầu chọn, quy tắc khớp log và quy tắc commit.

Đa số phiếu cũng có chi phí. Với trạng thái điều phối hoặc log sao chép dựa vào đa số để giữ an toàn, khi không gom đủ Quorum thì thường phải ngừng commit lệnh ghi mới. Hệ thống có còn cho đọc dữ liệu cũ hay không tùy thuộc vào giao thức cụ thể và yêu cầu nhất quán. Cụm 3 node chịu được 1 node bỏ phiếu lỗi, cụm 5 node chịu được 2 node lỗi; cụm 4 node vẫn chỉ chịu được 1 node lỗi và cụm 6 node vẫn chỉ chịu được 2 node lỗi, nên nhiều hệ thống điều phối khuyến nghị dùng số lẻ node bỏ phiếu.

### Term/Epoch chỉ bảo vệ được nội bộ giao thức

Bầu chọn Leader thường cần khái niệm nhiệm kỳ — Raft gọi là `Term`, ZAB có `Epoch`. Mỗi lần bầu chọn sẽ bước sang một nhiệm kỳ cao hơn; khi thấy nhiệm kỳ cao hơn, các node sẽ từ chối request thuộc nhiệm kỳ cũ, và Leader cũ cũng phải hạ cấp về node thường.

Cơ chế này chủ yếu bảo vệ trạng thái nội bộ của giao thức điều phối.

Nhiệm kỳ không tự động lan truyền tới mọi tài nguyên nghiệp vụ bên ngoài. Nếu Leader cũ đi vòng qua giao thức sao chép để ghi thẳng vào Database, Object Storage hay API bên thứ ba, phía tài nguyên sẽ chẳng hề hay biết Raft Term hay ZAB Epoch đã thay đổi. Để từ chối thực sự các lượt ghi đến muộn (Late Write), bản thân phía tài nguyên phải kiểm tra số phiên bản hoặc Fencing Token.

### Lease giải quyết thu hồi tài nguyên, không chứng minh được Client cũ đã ngừng chạy

Ví dụ một client lấy được khóa rồi bị dừng GC (GC Pause) kéo dài. Dịch vụ khóa cho rằng client đó đã mất liên lạc nên cấp khóa cho client khác. Sau khi client cũ hồi phục, nó có thể vẫn cầm ngữ cảnh thực thi cũ để ghi xuống Database, Object Storage hoặc API bên ngoài. Việc dịch vụ khóa đã đổi Leader hay đổi chủ sở hữu khóa không đồng nghĩa với việc Thread nghiệp vụ trong tay client cũ lập tức biến mất.

**Lease** (hợp đồng thuê) có thể hiểu là một giấy phép có thời hạn hiệu lực. Sau khi lấy được Lease, client phải gia hạn trong khoảng TTL; nếu gia hạn thất bại hoặc Lease hết hạn, hệ thống điều phối có thể thu hồi tài nguyên liên quan. API Lease của etcd hoạt động theo mô hình này: cụm cấp một Lease kèm TTL, nếu trong khoảng TTL cụm không nhận được `keepAlive`, Lease sẽ hết hạn và các Key gắn trên Lease đó cũng bị xóa. TTL mà etcd trả về lấy chuẩn theo lựa chọn và đồng hồ phía Server, không phải client tự dùng đồng hồ cục bộ của mình để phán đoán Lease đã hết hạn chưa.

Mối nguy hiểm thực sự nằm ở chỗ nhận thức của client về trạng thái Lease có thể bị lỗi thời. Nó có thể vì Full GC kéo dài, cô lập mạng hoặc nghẽn Thread mà không kịp phát hiện Lease đã hết hạn.

Vì vậy Lease thích hợp để phát hiện trạng thái sống và tự động thu hồi tài nguyên, nhưng không thể đứng một mình chứng minh rằng client cũ đã ngừng chạy. Chừng nào client cũ vẫn còn chạm tới được tài nguyên dùng chung, lượt ghi đến muộn vẫn có thể xảy ra.

### Fencing Token từ chối bên thực thi quá hạn

Cách xử lý của **Fencing Token** trực diện hơn nhiều: mỗi lần cấp quyền thành công, hệ thống điều phối phát ra một Token tăng đơn điệu. Client khi ghi vào tài nguyên dùng chung bắt buộc phải đính kèm Token này; phía tài nguyên lưu lại Token lớn nhất từng thấy và từ chối các lượt ghi mang Token nhỏ hơn.

Lấy một ví dụ:

1. Client A lấy được khóa, nhận `token=10`.
2. Client A bị treo kéo dài, khóa hết hạn.
3. Client B lấy được khóa, nhận `token=11` và ghi dữ liệu vào tài nguyên thành công.
4. Client A hồi phục rồi tiếp tục mang `token=10` đi ghi vào tài nguyên.
5. Phía tài nguyên phát hiện `10 < 11` nên từ chối lượt ghi của A.

Bản thân con số Token không tự giải quyết được vấn đề; khâu kiểm tra ở phía tài nguyên mới là then chốt. Phía tài nguyên tốt nhất nên thực hiện một cách nguyên tử (atomic) chuỗi thao tác "so sánh Token + cập nhật dữ liệu + ghi nhận Token mới nhất". Nếu tách thành truy vấn Token trước rồi mới ghi dữ liệu sau, ở giữa vẫn có thể bị request song song chen ngang.

Có thể đặt Lease, Fencing Token và Idempotency Key cạnh nhau để đối chiếu:

| Cơ chế | Vấn đề giải quyết | Điều không thể đảm bảo |
| ------ | ----------------- | ---------------------- |
| Lease | Tự động thu hồi quyền của client mất liên lạc | Client cũ đã thực sự ngừng chạy |
| Fencing Token | Từ chối lượt ghi đến muộn của chủ cũ | Bản thân thao tác nghiệp vụ có thể Retry an toàn |
| Khóa lũy đẳng (Idempotency Key) | Chống một request nghiệp vụ lặp lại gây tác dụng phụ | Bên thực thi hiện tại chắc chắn là chủ sở hữu mới nhất |

![Lease và Fencing Token](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/lease-fencing-token-late-write-71ae3731.webp)

## Lan truyền trạng thái Gossip: Để các node trao đổi góc nhìn cục bộ

Gossip không phụ thuộc vào một node cố định để duy trì góc nhìn toàn cụm. Mỗi node tự lưu giữ góc nhìn cục bộ (Local View) của mình và trao đổi trạng thái qua giao tiếp ngang hàng (Peer-to-Peer).

Các node định kỳ chọn một vài node khác để trao đổi thông tin, khiến trạng thái lan truyền khắp cụm giống như tin đồn. Một node biết được thành viên mới, lỗi mới hay phiên bản mới thì sau đó sẽ tiếp tục kể lại cho các node khác. Sau nhiều vòng trao đổi, phần lớn các node sẽ nhìn thấy trạng thái tương đồng nhau.

Bản thân Gossip phù hợp để lan truyền "những gì tôi quan sát được", chứ không phù hợp để tự quyết định "toàn thể bắt buộc phải chấp nhận điều gì".

Nó thường cung cấp khả năng lan truyền và hội tụ cuối cùng (Eventual Convergence), không trực tiếp cung cấp loại trừ lẫn nhau nghiêm ngặt hay thứ tự ghi toàn cục. Gossip cần thời gian để lan tỏa, nên tại cùng một thời điểm các node khác nhau có thể nhìn thấy trạng thái khác nhau. Một thông điệp cũng có thể bị lan truyền lặp lại, cần số phiên bản, Message ID, Timestamp hoặc cách khác để khử trùng. Khi xảy ra phân vùng mạng, các phân vùng khác nhau có thể tự hình thành phán đoán riêng; sau khi khôi phục vẫn phải dựa vào phiên bản, nhiệm kỳ hoặc chiến lược giải quyết xung đột để hội tụ lại.

Tuy nhiên, điều đó không có nghĩa mọi giao thức không có Leader cố định đều chỉ dừng ở nhất quán cuối cùng. Các giao thức đồng thuận không Leader cố định như EPaxos vẫn có thể cung cấp tính nhất quán mạnh, chỉ là độ phức tạp hiện thực và bối cảnh áp dụng khác với các giao thức dựa trên Leader thông thường.

Hệ thống thực tế thường kết hợp nhiều cơ chế. Redis Cluster là một ví dụ điển hình: các node dùng Cluster Bus và Gossip để lan truyền trạng thái thành viên, thông tin Slot và quan sát lỗi; một node có thể đánh dấu node khác là `PFAIL` trước; khi đa số Master có đủ quan sát về lỗi đó thì mới nâng cấp lên `FAIL`; còn việc thăng cấp Replica lại kết hợp bỏ phiếu đa số, `currentEpoch` và `configEpoch` để phân biệt cấu hình cũ và mới.

Vì thế, Gossip thích hợp hơn cho "lan truyền trạng thái", không thích hợp đứng một mình gánh vác "loại trừ lẫn nhau nghiêm ngặt" hay "thứ tự ghi chặt chẽ". Nếu một kịch bản đòi hỏi tại mọi thời điểm chỉ có duy nhất một Owner hoặc thao tác ghi phải nhất quán tuyến tính (Linearizable), vẫn phải đưa vào đồng thuận, bỏ phiếu đa số, kiểm tra phiên bản ở phía tài nguyên hoặc Fencing Token.

## Nên chọn những cơ chế này như thế nào?

Trước tiên hãy nhìn vào hậu quả của một quyết định sai.

Nếu việc chạy thừa một lần tác vụ chỉ tốn thêm chút tài nguyên, hoặc chấp nhận được việc một node tạm thời nhìn thấy trạng thái hơi cũ, thì lan truyền trạng thái và hội tụ cuối cùng thường đã đủ. Ví dụ như Service Discovery, lan truyền trạng thái sức khỏe (Health Status), phát tán Metadata của Cache hay đồng bộ trạng thái không trọng yếu đều có thể cân nhắc Gossip hoặc các cách lan truyền ngang hàng tương tự.

Nếu quyết định sai dẫn tới sai lệch tiền bạc, sai tồn kho, hỏng Metadata hoặc hai node chính cùng ghi vào một dữ liệu, hãy ưu tiên Leader/Quorum, thuật toán đồng thuận, commit theo đa số, và thêm Fencing Token khi cần thiết. Việc hy sinh một chút tính sẵn sàng và thông lượng ở đây thường rẻ hơn nhiều so với đi sửa dữ liệu hỏng sau sự cố.

Tiếp theo hãy nhìn vào quy mô hệ thống và đường đi lệnh ghi (Write Path).

Với Control Plane quy mô nhỏ, quản lý bằng Leader thường dễ bảo trì hơn. Khi số lượng node rất lớn, trạng thái biến động liên tục và mỗi node chỉ cần một góc nhìn gần đúng, lan truyền ngang hàng sẽ hợp lý hơn. Thông điệp Gossip có sự dư thừa, nhưng nó tránh được việc mọi cập nhật trạng thái đều dồn về một node cố định; đồng thời nó cũng làm tăng chi phí xử lý xung đột, khử trùng thông điệp và điều tra trạng thái.

Có thể dùng bảng dưới đây để đánh giá nhanh:

| Cơ chế | Giải quyết chủ yếu vấn đề gì | Đặc điểm nhất quán | Kịch bản điển hình |
| ------ | ---------------------------- | ------------------ | ------------------ |
| Leader + Sao chép Log | Quyết định thứ tự ghi và trạng thái Metadata | Có thể cung cấp nhất quán mạnh | Phát hành cấu hình, chuyển đổi Master-Slave, thay đổi Metadata |
| Bỏ phiếu Quorum | Phán đoán một quyết định có hợp lệ hay không | Phụ thuộc phần giao tập hợp & quy tắc giao thức | Commit log, bầu chọn Leader, xác nhận sự cố |
| Lease / Lock | Cấp tạm thời tư cách thực thi | Tư cách có thể hết hạn | Tác vụ định kỳ, Owner tài nguyên, vùng găng ngắn |
| Fencing Token | Từ chối lượt ghi đến muộn của Owner cũ | Phụ thuộc kiểm tra phía tài nguyên | Database, Object Storage, ghi tài nguyên ngoài |
| Gossip | Phát tán thông tin thành viên và trạng thái | Thường hội tụ cuối cùng | Service Discovery, trạng thái sức khỏe, Metadata Cache |
| Hàng đợi / Nhận Shard | Phân bổ công việc cho nhiều Worker | Thường là At-least-once | Xử lý lô (Batch), Consumer tác vụ, quét Shard |

![Lựa chọn cơ chế điều phối phân tán](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-coordination-mechanism-selection-5334a00c.webp)

Các hệ thống thực tế thường xuyên pha trộn những cơ chế này.

Chẳng hạn Control Plane dùng Leader và đa số Quorum để bảo vệ Metadata, còn Data Plane cố gắng phân tán request rộng nhất có thể; trạng thái thành viên cụm dùng Gossip để lan truyền, nhưng chuyển đổi Master-Slave thực sự vẫn phải qua bỏ phiếu và Epoch; lập lịch tác vụ có thể có bộ lập lịch trung tâm hoặc để Executor tự kích hoạt, nhưng tầng dưới vẫn có thể dựa vào câu lệnh cập nhật có điều kiện của Database, ZooKeeper, etcd hoặc Message Queue.

## Tác vụ định kỳ 3 instance rốt cuộc thiết kế ra sao?

Với tác vụ định kỳ lúc 2 giờ sáng ở đầu bài, có nhiều hơn một phương án phổ biến:

1. Bầu ra một Leader lập lịch, để nó đứng ra tạo tác vụ.
2. Tất cả các instance đồng thời kích hoạt, nhưng cạnh tranh quyền thực thi qua Unique Key của Database, câu lệnh cập nhật có điều kiện hoặc Distributed Lock.
3. Bộ lập lịch chỉ tạo ra thông điệp tác vụ, để Consumer Group nhận và xử lý theo Shard.
4. Chia tác vụ thành nhiều Shard, mỗi instance chỉ xử lý phần mình nhận được.

Dù chọn phương án nào cũng không nên chỉ trông cậy vào giả định "lần này chắc chắn chỉ có một instance chạy". Một thiết kế vững vàng hơn thường bao gồm những yếu tố sau:

- Bản ghi lập lịch có Task ID duy nhất;
- Nhận tác vụ bằng cập nhật có điều kiện, số phiên bản hoặc Lease;
- Xử lý nghiệp vụ có tính lũy đẳng (Idempotency);
- Tác vụ hỗ trợ thu hồi khi Timeout và cho phép nhận lại;
- Khi đụng tới tài nguyên dùng chung bên ngoài thì dùng Fencing Token hoặc kiểm tra phiên bản tài nguyên;
- Lưu lại tiến độ thực thi, hỗ trợ khôi phục từ Checkpoint sau sự cố.

Nếu tác vụ ngắn và chi phí chạy lại khi lỗi thấp, Unique Key của Database hoặc Message Queue thường là đủ. Nếu tác vụ chiếm giữ tài nguyên bên ngoài trong thời gian dài, hoặc bên thực thi cũ sau khi hồi phục mà ghi tiếp sẽ gây hỏng dữ liệu, lúc đó cần đưa vào Lease, Fencing Token, Idempotency Key và State Machine.

## Phỏng vấn nên trả lời thế nào?

Trong phỏng vấn nếu bị hỏi "Thiết kế tập trung và phi tập trung trong hệ thống phân tán khác nhau thế nào?", đừng vừa mở miệng đã đặt Leader và Gossip đối đầu nhau. Thứ tự trả lời tốt hơn là: nói trước vì sao cần điều phối, sau đó tách bài toán thành "ra quyết định" và "lan truyền", cuối cùng bổ sung Split-brain, Lease, Fencing Token và đánh đổi lựa chọn.

Bạn có thể trả lời như sau:

> Trong hệ thống phân tán, nhiều node muốn phối hợp hoàn thành một việc thì bắt buộc phải giải quyết các bài toán điều phối như quản lý thành viên, phân bổ tác vụ, chuyển đổi dự phòng và thứ tự ghi.
>
> Tôi sẽ tách bài toán thành hai nhóm: một nhóm là bài toán ra quyết định, ví dụ ai làm Leader, bản ghi log nào đó có được commit không, tài nguyên nào đó hiện thuộc về ai; nhóm còn lại là bài toán lan truyền, ví dụ trạng thái thành viên, quan sát sự cố hay phiên bản cấu hình lan tỏa sang các node khác như thế nào.
>
> Leader, Quorum và giao thức đồng thuận chủ yếu giải quyết bài toán ra quyết định. Có Leader không chắc đã là điểm lỗi đơn, mấu chốt phải xem phía sau nó có sao chép log, đa bản sao và bầu chọn theo đa số hay không. Để tránh Split-brain, thường phải dùng quy tắc đa số, Term/Epoch, giới hạn bầu chọn và quy tắc khớp log.
>
> Gossip chủ yếu giải quyết bài toán lan truyền trạng thái. Nó hợp để lan truyền thông tin thành viên và trạng thái sức khỏe, nhưng không hợp đứng một mình gánh vác loại trừ lẫn nhau chặt chẽ hay thứ tự ghi toàn cục. Hệ thống thực tế thường kết hợp cả hai, ví dụ Gossip lan truyền quan sát lỗi, còn bỏ phiếu đa số và Epoch quyết định thăng cấp node chính.
>
> Nếu liên quan đến khóa hoặc chủ sở hữu tác vụ (Task Owner), còn phải tính tới Lease và Fencing Token. Lease thu hồi được tư cách của client mất liên lạc, nhưng không chứng minh được client cũ đã ngừng chạy; Fencing Token đòi hỏi phía tài nguyên phải kiểm tra mới từ chối được lượt ghi đến muộn từ chủ cũ. Phía nghiệp vụ cũng vẫn phải dùng Idempotency Key, ràng buộc duy nhất hoặc State Machine để xử lý tình huống chạy trùng lặp.

Câu trả lời này đã bao phủ được phần lớn kịch bản phỏng vấn. Nếu người phỏng vấn hỏi xoáy thêm, có thể triển khai tiếp theo các câu hỏi dưới đây.

### Có Leader thì có chắc chắn là điểm lỗi đơn (Single Point of Failure) không?

Không hẳn.

Nếu trạng thái của Leader chỉ nằm trong bộ nhớ của riêng nó, khi sập không có bản sao tiếp quản thì đúng là điểm lỗi đơn. Nhưng Leader trong nhiều hệ thống phân tán giống "người ra quyết định hiện tại" hơn: nó nhận request ghi, thúc đẩy log hoặc phân bổ tác vụ, nhưng trạng thái sẽ được sao chép tới nhiều node. Khi Leader sập, các node còn lại có thể dựa vào log sẵn có và đa số phiếu để bầu ra Leader mới.

Do đó, để đánh giá có phải điểm lỗi đơn hay không, không thể chỉ nhìn có Leader hay không mà phải xét 3 việc:

- Trạng thái của Leader có được lưu bền vững và sao chép đa bản sao hay không;
- Sau khi Leader sập có tự động bầu được Leader mới hay không;
- Leader mới có lấy lại được toàn bộ trạng thái đã từng commit hay không.

### Làm sao tránh Split-brain?

Rủi ro của Split-brain nằm ở chỗ nhiều phân vùng đều tự cho mình có quyền ghi.

Cách làm phổ biến là dùng đa số phiếu (Majority) và kiểm soát nhiệm kỳ (Term/Epoch). Chỉ tập node nắm được đa số phiếu mới có quyền bầu Leader hoặc commit ghi. 3 node cần ít nhất 2 node đồng ý, 5 node cần ít nhất 3 node đồng ý. Sau khi phân vùng mạng, nhóm thiểu số không lấy đủ đa số phiếu nên không thể tiếp tục commit các thao tác ghi điều phối mới.

Nhiệm kỳ chịu trách nhiệm phân biệt Leader mới và cũ. `Term` trong Raft hay `Epoch` trong ZAB đều theo tư tưởng tương tự. Khi thấy nhiệm kỳ cao hơn, node phải từ chối mọi request giao thức thuộc nhiệm kỳ cũ. Nhờ vậy, Leader cũ dù có hồi phục sau khi bị cô lập mạng hay treo dài hạn cũng không thể tiếp tục dùng thân phận cũ để đẩy tiếp log nội bộ.

Tuy nhiên, cơ chế này chủ yếu bảo vệ trạng thái nội bộ của hệ thống điều phối. Tài nguyên nghiệp vụ vẫn có thể gặp vấn đề client cũ hồi phục rồi ghi tiếp, lúc này cần tới Fencing Token: mỗi lần lấy khóa hoặc lấy quyền sẽ nhận một Token tăng dần, khi ghi tài nguyên phải mang theo Token và phía tài nguyên từ chối các Token cũ nhỏ hơn.

### Có phải Gossip chỉ đạt được nhất quán cuối cùng?

Thuần túy lan truyền trạng thái bằng Gossip thường chỉ phụ trách phát tán thông tin và hội tụ cuối cùng, không trực tiếp cung cấp loại trừ lẫn nhau nghiêm ngặt hay thứ tự ghi toàn cục.

Nhưng không thể đánh đồng "không có Leader cố định" với "nhất quán cuối cùng". Vẫn có những giao thức đồng thuận không Leader cố định có thể cung cấp tính nhất quán mạnh, chỉ là độ phức tạp hiện thực kỹ thuật cao hơn. Trong dự án thực tế, tổ hợp phổ biến hơn là: Gossip phụ trách lan truyền trạng thái thành viên và báo cáo sự cố, còn Quorum, Epoch, sao chép log hoặc kiểm tra phía tài nguyên phụ trách chốt quyết định cuối cùng.

### Trong dự án nên chọn công nghệ thế nào?

Khi trả lời kinh nghiệm dự án, đừng chỉ nói "bọn em dùng ZooKeeper/Redis/etcd". Cần nói rõ được lý do lựa chọn.

Nếu là các kịch bản như Distributed Lock, thay đổi cấu hình, chuyển đổi node chính, quyền sở hữu Shard, bạn có thể trả lời:

> Loại trạng thái này mà ghi sai thì cái giá rất đắt, nên tôi ưu tiên các thành phần điều phối có hỗ trợ đa số phiếu (Quorum) và ngữ nghĩa Session/Lease. Sau khi khóa hoặc Owner hết hạn, còn phải tính thêm rủi ro ghi đến muộn khi client cũ hồi phục. Nếu phía tài nguyên hỗ trợ kiểm tra phiên bản, tôi sẽ bổ sung Fencing Token để bọc lót.

Nếu là các kịch bản như Service Discovery, lan truyền trạng thái node, trạng thái cụm Cache, bạn có thể trả lời:

> Loại thông tin này cho phép lệch nhau trong thời gian ngắn, coi trọng hơn khả năng mở rộng và chi phí lan truyền. Có thể chấp nhận hội tụ dần qua Gossip hoặc cơ chế tương tự, nhưng cần xử lý trùng lặp thông điệp, trạng thái cũ và xung đột phiên bản sau khi phân vùng mạng khôi phục.

Trả lời tới mức này là đã thoát khỏi việc học vẹt định nghĩa "tập trung vs. phi tập trung", bắt đầu đi vào những đánh đổi quan trọng nhất trong hệ thống phân tán: ra quyết định, lan truyền, hợp đồng thuê (Lease), tính lũy đẳng và khôi phục sự cố.

## Tài liệu tham khảo

- [Kubernetes CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [The Raft Consensus Algorithm](https://raft.github.io/)
- [In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf)
- [ZooKeeper Internals: Atomic Broadcast, Leader Activation, Quorums](https://zookeeper.apache.org/doc/current/zookeeperInternals.html)
- [ZooKeeper Administrator's Guide: Clustered Setup và Khuyến nghị triển khai Quorum](https://zookeeper.apache.org/doc/current/zookeeperAdmin.html)
- [Redis Cluster Specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
- [etcd API: Lease API](https://etcd.io/docs/v3.7/learning/api/)
- [EPaxos](https://efficient.github.io/epaxos/)
- [How to do distributed locking - Martin Kleppmann](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Epidemic Algorithms for Replicated Database Maintenance](https://dl.acm.org/doi/10.1145/43921.43922)
