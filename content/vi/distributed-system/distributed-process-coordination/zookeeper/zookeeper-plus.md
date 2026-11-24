---
title: "Giải thích chuyên sâu ZooKeeper: Giao thức ZAB, Bầu chọn Leader, Triển khai cụm và Cơ chế Session"
category: Hệ thống phân tán
description: "Giải thích chuyên sâu ZooKeeper, đi sâu vào giao thức ZAB, bầu chọn Leader, chiến lược triển khai cụm, nguyên tắc số lượng node lẻ, quản lý Session, cơ chế Watcher và so sánh với các Service Registry như Eureka, Nacos."
tag:
  - ZooKeeper
head:
  - - meta
    - name: keywords
      content: ZooKeeper,ZooKeeper nâng cao,Giao thức ZAB,Bầu chọn Leader,Triển khai cụm,Quản lý Session,Watcher,So sánh Eureka,So sánh Nacos,Điều phối phân tán,Hệ thống CP
lang: vi
sourceRef: zh-ref/distributed-system/distributed-process-coordination/zookeeper/zookeeper-plus.md
---

> Đóng góp bởi [FrancisQ](https://juejin.im/user/5c33853851882525ea106810).

## ZooKeeper là gì?

`ZooKeeper` do `Yahoo` phát triển, sau đó được trao tặng cho `Apache` và hiện đã trở thành dự án hàng đầu (top-level project) của `Apache`. `ZooKeeper` là một máy chủ điều phối ứng dụng phân tán mã nguồn mở, cung cấp dịch vụ nhất quán (Consistency) cho các hệ thống phân tán. Tính nhất quán của nó được hiện thực thông qua giao thức **ZAB (ZooKeeper Atomic Broadcast)** thiết kế chuyên biệt cho ZooKeeper. Các chức năng chính bao gồm: quản lý cấu hình, đồng bộ phân tán, quản lý cụm, v.v.

Nói đơn giản, `ZooKeeper` là một **framework dịch vụ điều phối phân tán**. Phân tán? Dịch vụ điều phối? Nghe là thấy cái gì vậy trời? 🤔🤔

Thực ra khi giải thích khái niệm phân tán, tôi nhận thấy nhiều bạn vẫn chưa phân biệt rạch ròi giữa hai khái niệm **Phân tán (Distributed) và Cụm (Cluster)**. Hôm trước có một bạn trao đổi với tôi về hệ thống phân tán, bạn ấy nói: "Phân tán chẳng phải là thêm máy thôi sao? Một máy chịu không nổi thì thêm một máy nữa gánh tải." Đương nhiên cách nói thêm máy cũng không sai, hệ thống phân tán chắc chắn liên quan đến nhiều máy; nhưng đừng quên trong khoa học máy tính còn có một khái niệm tương tự — `Cluster` (cụm), chẳng phải cụm cũng là thêm máy đó sao? Thế nhưng `Cluster` và `Distributed` thực chất là hai khái niệm hoàn toàn khác nhau.

Ví dụ: hiện tại tôi có một dịch vụ flash sale (giảm giá chớp nhoáng), lượng truy cập đồng thời quá lớn khiến một máy không chịu nổi, nên tôi thêm vài server nữa **cùng cung cấp dịch vụ flash sale giống hệt nhau** — lúc này đó là **`Cluster` (Cụm)**.

![cluster](/media/jg/ext/oss.javaguide.cn/p3-juejin/60263e969b9e4a0f81724b1f4d5b3d58-tplv-k3u1fbpfcp-5f8bd139.jpg)

Nhưng bây giờ tôi đổi sang một cách khác: tôi **tách dịch vụ flash sale thành nhiều dịch vụ con**, chẳng hạn như dịch vụ tạo đơn hàng, dịch vụ cộng điểm thưởng, dịch vụ trừ mã giảm giá, v.v., **rồi triển khai các dịch vụ con này lên các server khác nhau** — lúc này đó mới là **`Distributed` (Phân tán)**.

![distributed](/media/jg/ext/oss.javaguide.cn/p3-juejin/0d42e7b4249144b3a77a0c519216ae3d-tplv-k3u1fbpfcp-d25ad6f0.jpg)

Và vì sao tôi lại phản bác quan điểm của bạn kia khi nói phân tán chỉ là thêm máy? Vì tôi cho rằng việc thêm máy sát với xây dựng Cluster hơn, bởi Cluster thực sự chỉ là thêm máy giống nhau. Còn với Distributed, trước tiên bạn phải tách nhỏ nghiệp vụ rồi mới thêm máy (không chỉ đơn giản là thêm máy), đồng thời bạn còn phải giải quyết hàng loạt vấn đề do kiến trúc phân tán mang lại.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/e3662ca1a09c4444b07f15dbf85c6ba8-tplv-k3u1fbpfcp-ed3763e3.jpg)

Chẳng hạn như: làm sao điều phối các thành phần phân tán với nhau, làm sao giảm độ phụ thuộc (coupling) giữa các hệ thống, xử lý giao dịch phân tán (Distributed Transaction) ra sao, cấu hình toàn bộ hệ thống phân tán thế nào, v.v. `ZooKeeper` chủ yếu sinh ra để giải quyết những vấn đề đó.

## Vấn đề tính nhất quán

Khi thiết kế một hệ thống phân tán chắc chắn sẽ gặp một bài toán: **vì khả năng chịu phân vùng mạng (Partition Tolerance) luôn tồn tại, nên ta bắt buộc phải đánh đổi giữa tính sẵn sàng của hệ thống (Availability) và tính nhất quán dữ liệu (Consistency)**. Đây chính là định lý `CAP` nổi tiếng.

Thực ra rất dễ hiểu. Hãy thử ví một lớp học là toàn bộ hệ thống, còn mỗi học sinh là một hệ thống con độc lập. Lúc này hai bạn Tiểu Hồng và Tiểu Minh lén hẹn hò với nhau và bị cô nàng nhiều chuyện Tiểu Hoa phát hiện; Tiểu Hoa mừng rơn đi kể cho mọi người xung quanh, thế là tin Tiểu Hồng và Tiểu Minh hẹn hò bắt đầu lan truyền trong lớp. Trong lúc tin tức đang lan truyền đó, bạn tóm lấy một học sinh bất kỳ và hỏi tình hình: nếu bạn đó trả lời "không biết", điều đó có nghĩa cả hệ thống lớp học đã xuất hiện vấn đề mất nhất quán dữ liệu (vì Tiểu Hoa đã biết tin rồi). Còn nếu bạn đó nhất quyết không trả lời bạn vì cả lớp đang trong quá trình lan truyền tin tức (để đảm bảo tính nhất quán, cần tất cả mọi người cùng biết thì mới trả lời), lúc này hệ thống lại gặp vấn đề về tính sẵn sàng (Availability).

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/38b9ff4b193e4487afe32c9710c6d644-tplv-k3u1fbpfcp-5e314f1c.jpg)

Cách đầu tiên chính là cách xử lý của `Eureka`, nó đảm bảo AP (tính sẵn sàng); còn cách thứ hai chính là cách xử lý của `ZooKeeper` mà hôm nay chúng ta tìm hiểu, nó đảm bảo CP (tính nhất quán dữ liệu).

## Giao thức và thuật toán nhất quán

Để giải quyết vấn đề tính nhất quán dữ liệu, qua quá trình nghiên cứu không ngừng của các nhà khoa học và lập trình viên, nhiều giao thức và thuật toán nhất quán đã ra đời, chẳng hạn như 2PC (Two-Phase Commit), 3PC (Three-Phase Commit), thuật toán Paxos, v.v.

Lúc này hãy thử nghĩ một vấn đề: nếu giữa các học sinh truyền tin bằng cách chuyền mẩu giấy cho nhau, sẽ nảy sinh một câu hỏi — làm sao tôi biết mẩu giấy của mình có đến tay đúng người tôi muốn gửi hay không? Nhỡ bị cậu nhóc nào đó chặn đường sửa nội dung thì sao, đúng không?

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/8c73e264d28b4a93878f4252e4e3e43c-tplv-k3u1fbpfcp-fcb5330b.jpg)

Từ đây dẫn ra một khái niệm — **Bài toán Các vị tướng Byzantine (Byzantine Generals Problem)**. Nó chỉ ra rằng **trên một kênh truyền không đáng tin cậy, việc cố gắng đạt được đồng thuận thông qua truyền thông điệp là bất khả thi**; vì vậy **tiền đề bắt buộc** của mọi thuật toán nhất quán là kênh truyền thông điệp an toàn và đáng tin cậy.

Và tại sao phải giải quyết vấn đề nhất quán dữ liệu? Hãy nghĩ xem: nếu một hệ thống flash sale tách thành dịch vụ đặt đơn và dịch vụ cộng điểm đặt trên các máy khác nhau, nhỡ trong quá trình truyền tin mà hệ thống cộng điểm bị sập thì sao? Không lẽ bên bạn đặt đơn thành công rồi mà lại không cộng điểm cho người ta? Kiểu gì cũng phải đảm bảo dữ liệu hai bên nhất quán với nhau chứ!

### 2PC (Two-Phase Commit — Cam kết hai pha)

Two-Phase Commit là một giao thức đảm bảo tính nhất quán dữ liệu cho hệ thống phân tán; hiện nay rất nhiều cơ sở dữ liệu đều sử dụng giao thức Two-Phase Commit để xử lý **Distributed Transaction (giao dịch phân tán)**.

Trước khi giới thiệu 2PC, hãy nghĩ xem rốt cuộc giao dịch phân tán gặp vấn đề gì?

Vẫn lấy ví dụ hai hệ thống đặt đơn và cộng điểm trong hệ thống flash sale nhé (chắc mọi người nghe phát ngán luôn rồi 🤮🤮🤮). Khi đặt đơn xong, chúng ta gửi một thông điệp cho hệ thống cộng điểm báo nó cộng điểm. Nếu chỉ gửi thông điệp đi mà không nhận phản hồi, hệ thống đặt đơn làm sao biết được hệ thống cộng điểm đã nhận được tin hay chưa? Còn nếu thêm bước nhận phản hồi, khi hệ thống cộng điểm nhận được thông điệp và trả về cho hệ thống đặt đơn một `Response`, nhưng giữa đường mạng bị chập chờn khiến phản hồi đó gửi không thành công — lúc này hệ thống đặt đơn có tưởng nhầm là hệ thống cộng điểm chưa nhận được tin và rollback giao dịch không? Trong khi thực tế hệ thống cộng điểm đã nhận được tin, xử lý và cộng điểm cho người dùng rồi; kết quả là điểm đã cộng mà đơn hàng lại chưa đặt thành công.

Vì vậy, điều chúng ta cần giải quyết là trong một chuỗi lời gọi của hệ thống phân tán, việc xử lý dữ liệu ở tất cả các service phải hoặc cùng thành công hoặc cùng thất bại — tức là **bài toán tính nguyên tử (Atomicity)** của toàn bộ các service.

Trong Two-Phase Commit chủ yếu có hai vai trò: Coordinator (bên điều phối) và Participant (bên tham gia).

Pha thứ nhất: Khi cần thực thi một giao dịch phân tán, bên khởi xướng giao dịch trước tiên gửi yêu cầu giao dịch tới Coordinator. Sau đó Coordinator sẽ gửi yêu cầu `prepare` (bao gồm nội dung giao dịch) tới tất cả các Participant, báo cho họ biết giao dịch cần thực thi — nếu thực thi được nội dung tôi gửi thì hãy thực thi trước nhưng chưa commit, làm xong thì phản hồi lại cho tôi. Sau khi nhận thông điệp `prepare`, các Participant sẽ bắt đầu thực thi giao dịch (nhưng chưa commit), ghi thông tin `Undo` và `Redo` vào transaction log, rồi phản hồi lại cho Coordinator biết mình đã sẵn sàng hay chưa.

Pha thứ hai: Pha thứ hai chủ yếu là Coordinator dựa vào phản hồi từ các Participant để quyết định bước tiếp theo là commit giao dịch hay rollback giao dịch.

Ví dụ nếu **tất cả Participant** đều trả về thông điệp đã sẵn sàng, lúc này giao dịch sẽ được commit: Coordinator gửi **yêu cầu `Commit`** tới tất cả Participant. Khi Participant nhận được yêu cầu `Commit`, nó sẽ thực hiện **thao tác commit** đối với giao dịch đã chạy ở bước trước, commit xong sẽ gửi phản hồi commit thành công về cho Coordinator.

Ngược lại, nếu ở pha thứ nhất không phải tất cả Participant đều phản hồi đã sẵn sàng, Coordinator sẽ gửi **yêu cầu `rollback` giao dịch** tới tất cả Participant. Sau khi nhận được, Participant sẽ **rollback phần xử lý giao dịch đã làm ở pha thứ nhất** rồi báo lại tình hình xử lý cho Coordinator; cuối cùng Coordinator nhận phản hồi xong sẽ trả kết quả xử lý thất bại về cho bên khởi xướng giao dịch.

![Quy trình 2PC](/media/jg/ext/oss.javaguide.cn/p3-juejin/1a7210167f1d4d4fb97afcec19902a59-tplv-k3u1fbpfcp-b434cd25.jpg)

Cá nhân tôi thấy cách hiện thực của 2PC vẫn khá bất cập, bởi thực chất nó mới chỉ giải quyết được vấn đề tính nguyên tử của từng giao dịch mà lại kéo theo rất nhiều vấn đề khác:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/cc534022c7184770b9b82b2d0008432a-tplv-k3u1fbpfcp-f519728e.jpg)

- **Vấn đề điểm lỗi đơn (Single Point of Failure)**: Nếu Coordinator bị sập, toàn bộ hệ thống sẽ rơi vào trạng thái không khả dụng.
- **Vấn đề nghẽn chặn (Blocking)**: Khi Coordinator gửi yêu cầu `prepare`, Participant nhận được nếu xử lý được thì thực thi giao dịch nhưng chưa commit, lúc này sẽ chiếm giữ tài nguyên mãi mà không giải phóng; nếu đúng lúc đó Coordinator bị sập, số tài nguyên kia sẽ không bao giờ được giải phóng nữa, ảnh hưởng cực lớn tới hiệu năng.
- **Vấn đề mất nhất quán dữ liệu**: Ví dụ ở pha thứ hai, Coordinator mới gửi được một phần yêu cầu `commit` thì sập; điều đó có nghĩa là những Participant nhận được thông điệp sẽ commit giao dịch, còn những Participant phía sau chưa nhận được thì không commit, dẫn đến mất nhất quán dữ liệu.

### 3PC (Three-Phase Commit — Cam kết ba pha)

Vì những vấn đề tồn tại của 2PC như điểm lỗi đơn, hạn chế trong cơ chế chịu lỗi, v.v., nên **3PC (Three-Phase Commit)** đã ra đời. Vậy ba pha đó lần lượt là gì?

> Đừng bao giờ hiểu nhầm PC là máy tính cá nhân nhé, thực ra nó là viết tắt của phase-commit, tức cam kết theo pha!

1. **Pha CanCommit**: Coordinator gửi yêu cầu `CanCommit` tới tất cả Participant; Participant sau khi nhận yêu cầu sẽ kiểm tra tình trạng bản thân xem có thể thực thi giao dịch không — nếu được thì trả về phản hồi YES và bước vào trạng thái chuẩn bị, ngược lại trả về NO.
2. **Pha PreCommit**: Coordinator dựa vào phản hồi từ Participant để quyết định có tiến hành bước `PreCommit` tiếp theo hay không. Nếu tất cả Participant ở trên đều trả về YES, Coordinator sẽ gửi yêu cầu tiền cam kết `PreCommit` tới tất cả Participant; **Participant sau khi nhận yêu cầu `PreCommit` sẽ thực hiện thi hành giao dịch và ghi thông tin `Undo` và `Redo` vào transaction log**, cuối cùng nếu thực thi thuận lợi sẽ trả về phản hồi thành công cho Coordinator. Nếu ở pha đầu tiên Coordinator nhận được **bất kỳ một phản hồi NO nào**, hoặc **trong khoảng thời gian quy định** không nhận đủ phản hồi từ tất cả Participant, giao dịch sẽ bị ngắt: Coordinator gửi yêu cầu hủy (`abort`) tới tất cả Participant; Participant nhận được yêu cầu `abort` (hoặc quá thời gian quy định mà không nhận được yêu cầu từ Coordinator) cũng sẽ lập tức hủy giao dịch.
3. **Pha DoCommit**: Pha này thực ra tương tự pha thứ hai của `2PC`. Nếu Coordinator nhận được phản hồi YES từ tất cả Participant ở pha `PreCommit`, Coordinator sẽ gửi yêu cầu `DoCommit` tới tất cả Participant; **Participant nhận được yêu cầu `DoCommit` sẽ tiến hành commit giao dịch**, hoàn tất xong sẽ trả phản hồi về cho Coordinator, và sau khi Coordinator nhận đủ phản hồi commit thành công từ tất cả Participant thì giao dịch hoàn tất. Nếu ở pha `PreCommit` Coordinator **nhận được bất kỳ phản hồi NO nào hoặc không nhận đủ phản hồi từ tất cả Participant trong thời gian quy định**, nó sẽ gửi yêu cầu hủy; Participant nhận được yêu cầu hủy sẽ **dựa vào undo log đã ghi trước đó** để rollback giao dịch rồi báo tình trạng rollback về cho Coordinator, Coordinator nhận được thông điệp thì kết thúc hủy giao dịch.

![Quy trình 3PC](/media/jg/ext/oss.javaguide.cn/p3-juejin/80854635d48c42d896dbaa066abf5c26-tplv-k3u1fbpfcp-5e7b4fe7.jpg)

> Trên đây là lưu đồ của `3PC` trong trường hợp thành công. Có thể thấy `3PC` bổ sung xử lý ngắt theo timeout ở nhiều bước — ví dụ nếu Coordinator không nhận đủ xác nhận trong thời gian chỉ định thì hủy giao dịch, nhờ vậy **giảm thời gian bị block đồng bộ**. Ngoài ra cần lưu ý rằng **trong pha `DoCommit` của `3PC`, nếu Participant không nhận được yêu cầu commit giao dịch từ Coordinator thì sau một khoảng thời gian nhất định nó sẽ tự tiến hành commit giao dịch**. Vì sao lại làm vậy? Bởi lúc này ta chắc chắn đã **đảm bảo ở pha đầu tiên tất cả các bên đều trả về phản hồi có thể thực thi giao dịch**, nên có cơ sở hợp lý để **tin rằng các hệ thống khác đều có thể thực thi và commit giao dịch**; do đó **bất kể** Coordinator có gửi được thông điệp cho Participant hay không, khi đã vào pha thứ ba thì Participant đều sẽ tiến hành commit giao dịch.

Tóm lại, `3PC` đã giảm thiểu tốt vấn đề block nhờ hàng loạt cơ chế timeout, nhưng vấn đề quan trọng nhất là tính nhất quán vẫn chưa được giải quyết triệt để. Ví dụ ở pha `DoCommit`, khi một Participant đã nhận được yêu cầu nhưng các Participant khác và Coordinator bị sập hoặc xảy ra phân vùng mạng (Network Partition), Participant nhận được thông điệp sẽ commit giao dịch, từ đó vẫn phát sinh mất nhất quán dữ liệu.

Vì vậy, muốn giải quyết bài toán nhất quán vẫn phải nhờ tới thuật toán `Paxos` ⭐️ ⭐️ ⭐️.

### Thuật toán `Paxos`

Thuật toán `Paxos` là một **thuật toán đồng thuận dựa trên truyền thông điệp và có khả năng chịu lỗi rất cao**, hiện được công nhận là một trong những thuật toán hiệu quả nhất để giải quyết bài toán nhất quán phân tán — **vấn đề mà nó giải quyết là làm sao để một hệ thống phân tán thống nhất (đạt quyết nghị) về một giá trị nào đó**.

Trong `Paxos` có ba vai trò chính là `Proposer` (người đề xuất), `Acceptor` (người biểu quyết) và `Learner` (người học). Thuật toán `Paxos` cũng giống `2PC`, gồm hai pha là pha `Prepare` và pha `Accept`.

#### Pha Prepare

- `Proposer` (người đề xuất): Chịu trách nhiệm đưa ra `proposal`. Mỗi Proposer khi đưa ra đề xuất trước tiên đều lấy một **số hiệu đề xuất `N` tăng dần và duy nhất toàn cục** (duy nhất trong toàn cụm), gán số hiệu đó cho đề xuất sắp đưa ra, và **trong pha thứ nhất chỉ gửi số hiệu đề xuất tới tất cả các Acceptor**.
- `Acceptor` (người biểu quyết): Mỗi Acceptor sau khi `accept` một đề xuất sẽ lưu số hiệu `N` của đề xuất đó tại cục bộ; như vậy trong số các đề xuất đã được `accept` lưu ở mỗi Acceptor sẽ tồn tại một **đề xuất có số hiệu lớn nhất**, giả sử số hiệu là `maxN`. Mỗi Acceptor chỉ `accept` những đề xuất có số hiệu lớn hơn `maxN` cục bộ của mình, và khi chấp thuận đề xuất ở pha prepare, Acceptor sẽ trả về đề xuất có số hiệu lớn nhất từng chấp nhận trước đó làm phản hồi gửi lại cho `Proposer`.

> Dưới đây là lưu đồ pha `prepare` để bạn đối chiếu tham khảo.

![Paxos Pha 1](/media/jg/ext/oss.javaguide.cn/p3-juejin/cd1e5f78875b4ad6b54013738f570943-tplv-k3u1fbpfcp-78086759.jpg)

#### Pha Accept

Khi một đề xuất được `Proposer` đưa ra, nếu `Proposer` nhận được sự chấp thuận từ quá nửa số `Acceptor` (tính cả trường hợp bản thân `Proposer` đồng ý), lúc này `Proposer` sẽ gửi đề xuất thực sự tới tất cả các `Acceptor` (bạn có thể hiểu pha thứ nhất là thăm dò), khi đó `Proposer` sẽ gửi cả nội dung đề xuất lẫn số hiệu đề xuất.

Acceptor sau khi nhận yêu cầu đề xuất sẽ so sánh lại số hiệu đề xuất lớn nhất mà mình đã chấp thuận trước đó với số hiệu đề xuất này: nếu số hiệu đề xuất này **lớn hơn hoặc bằng** số hiệu đề xuất lớn nhất từng chấp thuận, nó sẽ `accept` đề xuất đó (lúc này thực thi nội dung đề xuất nhưng chưa commit), sau đó trả tình hình về cho `Proposer`. Nếu không thỏa mãn thì không phản hồi hoặc trả về NO.

![Paxos Pha 2 Phần 1](/media/jg/ext/oss.javaguide.cn/p3-juejin/dad7f51d58b24a72b249278502ec04bd-tplv-k3u1fbpfcp-beee9e7a.jpg)

Khi `Proposer` nhận được quá nửa phản hồi `accept`, lúc này nó sẽ gửi yêu cầu commit đề xuất tới tất cả các `Acceptor`. Cần lưu ý rằng, vì ở bước trên mới chỉ có quá nửa số `Acceptor` chấp thuận và thực thi nội dung đề xuất đó còn các `Acceptor` chưa chấp thuận thì chưa thực thi, nên lúc này cần **gửi cả nội dung đề xuất và số hiệu đề xuất cho các `Acceptor` chưa chấp thuận để yêu cầu chúng thực thi và commit vô điều kiện**, còn đối với các `Acceptor` đã chấp thuận đề xuất trước đó thì **chỉ cần gửi số hiệu đề xuất** để `Acceptor` tiến hành commit là được.

![Paxos Pha 2 Phần 2](/media/jg/ext/oss.javaguide.cn/p3-juejin/9359bbabb511472e8de04d0826967996-tplv-k3u1fbpfcp-2f9191ff.jpg)

Còn nếu `Proposer` không nhận được quá nửa phản hồi `accept`, nó sẽ **tăng** số hiệu của `Proposal` đó lên rồi **quay lại pha `Prepare`**.

> Về việc `Learner` học nội dung đề xuất đã được `Acceptor` chấp thuận như thế nào thì có nhiều cách thức, bạn đọc có thể tự tìm hiểu thêm, ở đây không đi sâu giải thích.

#### Vấn đề vòng lặp vô hạn (Livelock) trong thuật toán Paxos

Thực ra chuyện này khá giống hai người cãi nhau: Tiểu Minh nói tôi đúng, Tiểu Hồng nói tôi mới đúng, hai người tranh luận gay gắt không ai chịu nhường ai 🤬🤬.

Ví dụ lúc này Proposer P1 đưa ra phương án M1, hoàn tất công việc của pha `Prepare`, lúc đó `Acceptor` chấp thuận M1; nhưng cùng lúc đó Proposer P2 cũng đưa ra một phương án M2 và cũng hoàn tất pha `Prepare`. Tiếp theo phương án của P1 không thể được chấp thuận ở pha thứ hai nữa (vì `Acceptor` đã hứa với M2 lớn hơn M1), thế là P1 tự tăng phương án thành M3 và quay lại pha `Prepare`; `Acceptor` lại chấp thuận phương án M3 mới nên không thể chấp thuận M2 nữa, lúc này M2 lại tự tăng số hiệu và quay lại pha `Prepare`...

Cứ thế đề xuất qua lại không bao giờ dứt — đây chính là vấn đề vòng lặp vô hạn (Livelock) của thuật toán `Paxos`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/bc3d45941abf4fca903f7f4b69405abf-tplv-k3u1fbpfcp-c722c37c.jpg)

Vậy giải quyết thế nào? Rất đơn giản: đông người dễ cãi nhau, vậy bây giờ **chỉ cho phép duy nhất một người được đề xuất** là xong.

## Giới thiệu giao thức ZAB

### Kiến trúc ZooKeeper

Là một framework điều phối phân tán xuất sắc, hiệu quả và đáng tin cậy, `ZooKeeper` khi giải quyết bài toán nhất quán dữ liệu phân tán đã không sử dụng trực tiếp `Paxos`, mà tùy biến riêng một giao thức nhất quán gọi là giao thức phát tán nguyên tử `ZAB` (`ZooKeeper Atomic Broadcast`), có khả năng hỗ trợ rất tốt cho **khôi phục sau sự cố (Crash Recovery)**.

![Kiến trúc ZooKeeper](/media/jg/ext/oss.javaguide.cn/p3-juejin/07bf6c1e10f84fc58a2453766ca6bd18-tplv-k3u1fbpfcp-25fab086.png)

### Ba vai trò trong ZAB

Tương tự như khi giới thiệu `Paxos`, trước khi tìm hiểu giao thức `ZAB`, trước tiên chúng ta hãy nắm ba vai trò chính trong `ZAB`: `Leader` (người lãnh đạo), `Follower` (người theo sau) và `Observer` (người quan sát).

- `Leader`: **Bên xử lý yêu cầu ghi duy nhất** trong cụm, có khả năng khởi xướng bỏ phiếu (bỏ phiếu cũng là để thực hiện yêu cầu ghi).
- `Follower`: Có thể nhận yêu cầu từ client; nếu là yêu cầu đọc thì tự xử lý, **nếu là yêu cầu ghi thì phải chuyển tiếp (forward) cho `Leader`**. Tham gia bỏ phiếu trong quá trình bầu chọn, có **quyền bầu cử và quyền ứng cử**.
- `Observer`: Chính là `Follower` nhưng không có quyền bầu cử và quyền ứng cử.

Trong giao thức `ZAB`, đối với `zkServer` (tức tên gọi chung của ba vai trò nói trên) còn định nghĩa hai chế độ, lần lượt là **Message Broadcast (Phát tán thông điệp)** và **Crash Recovery (Khôi phục sau sự cố)**.

### Chế độ Message Broadcast (Phát tán thông điệp)

Nói trắng ra đây chính là cách giao thức `ZAB` xử lý yêu cầu ghi. Ở trên chúng ta chẳng nói chỉ có `Leader` mới xử lý được yêu cầu ghi sao? Vậy các `Follower` và `Observer` của chúng ta chẳng phải cũng cần **đồng bộ cập nhật dữ liệu** sao? Chẳng lẽ dữ liệu chỉ cập nhật ở `Leader` còn các vai trò khác không hề được cập nhật?

Đó chẳng phải chính là **giữ tính nhất quán dữ liệu trong toàn bộ cụm** sao? Nếu là bạn, bạn sẽ làm thế nào?

Hiển nhiên bước đầu tiên chắc chắn cần `Leader` **phát tán (broadcast)** yêu cầu ghi ra ngoài, để `Leader` hỏi các `Follower` xem có đồng ý cập nhật không; nếu quá nửa đồng ý thì tiến hành cập nhật cho `Follower` và `Observer` (giống như `Paxos`). Đương nhiên nói suông thế hơi trừu tượng, vẽ một hình để dễ hiểu hơn nhé.

![Phát tán thông điệp](/media/jg/ext/oss.javaguide.cn/p3-juejin/b64c7f25a5d24766889da14260005e31-tplv-k3u1fbpfcp-91a51055.jpg)

Ừm... nhìn có vẻ đơn giản, hình như hiểu rồi đấy 🤥🤥🤥. Ủa hai cái `Queue` kia chui đâu ra vậy? Câu trả lời là **`ZAB` cần đảm bảo tính tuần tự cho `Follower` và `Observer`**. Tính tuần tự là gì? Ví dụ hiện tại tôi có một yêu cầu ghi A, `Leader` phát tán yêu cầu A đi; vì chỉ cần quá nửa đồng ý là được, nên có thể lúc này một `Follower` F1 do lỗi mạng chưa nhận được, rồi `Leader` lại phát tán tiếp một yêu cầu B; do mạng trục trặc, F1 lại nhận được yêu cầu B trước rồi mới nhận yêu cầu A — lúc này thứ tự xử lý yêu cầu khác nhau sẽ dẫn đến dữ liệu khác nhau, từ đó **gây ra vấn đề mất nhất quán dữ liệu**.

Vì thế ở phía `Leader`, nó chuẩn bị sẵn một **hàng đợi (Queue)** riêng cho từng `zkServer` khác và gửi thông điệp theo kiểu FIFO (vào trước ra trước). Nhờ giao thức giao tiếp **qua `TCP`**, thứ tự gửi thông điệp được đảm bảo, nên thứ tự nhận cũng được đảm bảo theo.

Ngoài ra, trong `ZAB` còn định nghĩa một **Transaction ID `ZXID` tăng dần đơn điệu toàn cục**. Đây là kiểu `long` 64-bit, trong đó 32 bit cao biểu thị `epoch` (niên đại/nhiệm kỳ) và 32 bit thấp biểu thị ID giao dịch. `epoch` sẽ thay đổi theo sự thay đổi của `Leader`: khi một `Leader` bị sập và `Leader` mới lên thay, `epoch` sẽ thay đổi. Còn 32 bit thấp có thể hiểu đơn giản là ID giao dịch tăng dần.

Lý do định nghĩa cấu trúc này cũng là để đảm bảo tính tuần tự: mỗi `proposal` sau khi được tạo ở `Leader` đều cần **sắp xếp theo `ZXID` của nó** thì mới được xử lý.

### Chế độ Crash Recovery (Khôi phục sau sự cố)

Nói tới khôi phục sau sự cố thì trước tiên phải nhắc tới thuật toán bầu chọn `Leader` trong `ZAB`. Khi hệ thống gặp sự cố sập máy, ảnh hưởng lớn nhất chính là sự cố sập `Leader`, bởi vì chúng ta chỉ có duy nhất một `Leader`, nên khi `Leader` gặp vấn đề thì tất yếu phải bầu lại `Leader`.

Bầu chọn `Leader` có thể chia thành hai bối cảnh khác nhau: thứ nhất là khi `Leader` bị sập cần bầu lại như đã nhắc; thứ hai là khi `ZooKeeper` khởi động cần thực hiện bầu chọn `Leader` khởi tạo ban đầu cho hệ thống. Sau đây tôi sẽ giới thiệu trước cách `ZAB` thực hiện bầu chọn khởi tạo.

Giả sử cụm của chúng ta có 3 máy, tức là cần ít nhất 2 máy đồng ý (quá nửa). Ví dụ lúc này ta khởi động `server1`: trước tiên nó sẽ **bỏ phiếu cho chính mình**, nội dung lá phiếu gồm `myid` và `ZXID` của server; vì mới khởi tạo nên `ZXID` đều bằng 0, lúc này phiếu phát đi của `server1` là `(1,0)`. Nhưng lúc này số phiếu của `server1` mới chỉ là 1 nên chưa thể làm `Leader`, đang trong giai đoạn bầu chọn nên toàn cụm ở trạng thái **`Looking`**.

Tiếp đó `server2` khởi động: trước tiên nó cũng bỏ phiếu chọn chính mình `(2,0)` rồi phát tán thông tin phiếu ra ngoài (`server1` cũng làm vậy, chỉ là lúc nãy chưa có server nào khác). Sau khi `server1` nhận được thông tin phiếu của `server2`, nó sẽ so sánh lá phiếu đó với của mình. **Đầu tiên nó so sánh `ZXID`, ai có `ZXID` lớn hơn được ưu tiên làm `Leader`; nếu giống nhau thì so sánh `myid`, ai có `myid` lớn hơn được ưu tiên làm `Leader`**. Vì vậy lúc này `server1` thấy `server2` phù hợp làm `Leader` hơn, nó liền sửa thông tin phiếu của mình thành `(2,0)` rồi phát tán lại; sau đó `server2` nhận được thấy giống với của mình nên không cần sửa, đồng thời **số phiếu bầu cho mình đã vượt quá một nửa**, nên **xác định `server2` làm `Leader`**, còn `server1` cũng chuyển trạng thái của mình thành `Following` để làm `Follower`. Toàn bộ server chuyển từ `Looking` sang trạng thái bình thường.

Khi `server3` khởi động và phát hiện cụm không còn ở trạng thái `Looking`, nó sẽ gia nhập cụm trực tiếp với tư cách `Follower`.

Vẫn với ví dụ 3 `server` ở trên, nếu trong quá trình toàn cụm đang vận hành mà `server2` bị sập thì cả cụm sẽ bầu chọn lại `Leader` như thế nào? Thực ra cũng gần giống bầu chọn khởi tạo.

Đầu tiên không nghi ngờ gì nữa, hai `Follower` còn lại sẽ chuyển trạng thái của mình **từ `Following` sang trạng thái `Looking`**, rồi mỗi `server` lại bỏ phiếu cho chính mình như lúc bầu chọn khởi tạo (chỉ khác là ở đây `zxid` có thể không còn là 0 nữa — ở đây lấy đại một con số cho tiện minh họa).

Giả sử `server1` bỏ phiếu cho mình là `(1,99)` rồi phát tán cho các `server` khác; `server3` trước tiên cũng bỏ phiếu cho mình `(3,95)` rồi phát tán ra ngoài. Lúc này `server1` và `server3` nhận được thông tin phiếu của nhau, giống như lúc ban đầu, chúng cũng so sánh phiếu của mình với phiếu nhận được (`zxid` lớn hơn ưu tiên, nếu bằng nhau thì `myid` lớn hơn ưu tiên). Khi đó `server1` nhận được phiếu của `server3` thấy không phù hợp bằng của mình nên giữ nguyên; `server3` nhận được kết quả phiếu của `server1` thấy phù hợp hơn của mình nên đổi phiếu thành `(1,99)` rồi phát tán đi; cuối cùng `server1` nhận được thấy phiếu bầu cho mình đã vượt quá một nửa nên tự đặt mình làm `Leader`, và `server3` theo đó chuyển thành `Follower`.

> Hãy chú ý: tại sao `ZooKeeper` lại khuyến nghị thiết lập số lượng node lẻ? Chẳng hạn ở đây ta có 3 máy: hỏng 1 máy vẫn hoạt động bình thường, nhưng hỏng 2 máy thì không thể hoạt động bình thường nữa (vì không còn quá nửa số node nên không thể bỏ phiếu hay thực hiện các thao tác khác). Giả sử ta có 4 máy: hỏng 1 máy vẫn hoạt động được, **nhưng hỏng 2 máy cũng không thể hoạt động bình thường được** — điều này giống hệt 3 máy, trong khi 3 máy lại ít hơn 4 máy hẳn 1 máy mà hiệu quả mang lại như nhau; vì vậy `ZooKeeper` khuyến nghị dùng số lượng `server` lẻ.

Vậy sau khi nói xong cách bầu chọn `Leader` trong `ZAB`, hãy tìm hiểu tiếp **Crash Recovery (Khôi phục sau sự cố)** là cái gì?

Thực chất chủ yếu là trả lời câu hỏi: **khi trong cụm có máy bị sập, toàn bộ cụm làm thế nào để đảm bảo tính nhất quán dữ liệu?**

Nếu chỉ có `Follower` bị sập, và số lượng sập chưa quá một nửa, thì vì ngay từ đầu chúng ta đã nói trên `Leader` có duy trì hàng đợi riêng, nên không cần lo dữ liệu sau không nhận được dẫn đến mất nhất quán.

Nếu `Leader` bị sập thì rắc rối hơn rồi: ta chắc chắn phải tạm dừng dịch vụ, chuyển sang trạng thái `Looking` rồi bầu chọn lại `Leader` (đã nói ở trên), nhưng ngoài ra còn phải xử lý hai tình huống, lần lượt là **Đảm bảo các đề xuất đã được Leader commit cuối cùng đều có thể được tất cả Follower commit** và **Bỏ qua những đề xuất đã bị loại bỏ**.

"Đảm bảo các đề xuất đã được Leader commit cuối cùng đều có thể được tất cả Follower commit" nghĩa là sao?

Giả sử `Leader (server2)` gửi yêu cầu `commit` (nếu quên vui lòng xem lại chế độ Message Broadcast ở trên): nó gửi cho `server3` xong, chuẩn bị gửi cho `server1` thì đột ngột bị sập. Nếu lúc bầu chọn lại mà ta chọn `server1` làm `Leader`, chắc chắn sẽ phát sinh mất nhất quán dữ liệu, vì `server3` chắc chắn sẽ commit đề xuất mà `server2` vừa gửi `commit`, còn `server1` hoàn toàn chưa nhận được nên sẽ bỏ sót.

![Khôi phục sau sự cố](/media/jg/ext/oss.javaguide.cn/p3-juejin/4b8365e80bdf441ea237847fb91236b7-tplv-k3u1fbpfcp-df5dff6f.jpg)

Vậy giải quyết thế nào?

Bạn đọc tinh ý chắc chắn sẽ nhận ra ngay: **lúc này `server1` đã không thể trở thành `Leader` được nữa rồi, bởi vì khi `server1` và `server3` bỏ phiếu bầu chọn, chúng sẽ so sánh `ZXID`, mà lúc này `ZXID` của `server3` chắc chắn lớn hơn `server1`**. (Nếu chưa hiểu hãy xem lại thuật toán bầu chọn ở phần trước.)

Thế còn "Bỏ qua những đề xuất đã bị loại bỏ" nghĩa là sao?

Giả sử `Leader (server2)` lúc này đã đồng ý với đề xuất N1, tự mình commit giao dịch này và chuẩn bị gửi yêu cầu `commit` tới tất cả `Follower`, nhưng đúng lúc đó lại bị sập; lúc này chắc chắn phải bầu chọn lại `Leader`, ví dụ chọn `server1` làm `Leader` (cái này không quan trọng). Nhưng một lát sau, **`Leader` bị sập kia lại khôi phục trở lại**, lúc này nó chắc chắn sẽ gia nhập cụm với tư cách `Follower`. Cần chú ý là lúc nãy `server2` đã đồng ý commit đề xuất N1, nhưng các `server` khác chưa nhận được thông điệp `commit` của nó, nên các `server` khác không thể commit đề xuất N1 này được nữa — nếu giữ lại sẽ xảy ra mất nhất quán dữ liệu, vì vậy **đề xuất N1 đó cuối cùng cần phải bị loại bỏ**.

![Khôi phục sau sự cố](/media/jg/ext/oss.javaguide.cn/p3-juejin/99cdca39ad6340ae8b77e8befe94e36e-tplv-k3u1fbpfcp-e04d28c8.jpg)

## Một số kiến thức lý thuyết về ZooKeeper

Hiểu giao thức `ZAB` thôi vẫn chưa đủ — nó chỉ là một cơ chế hiện thực nội bộ của `ZooKeeper`. Còn làm thế nào để chúng ta dùng `ZooKeeper` phục vụ các kịch bản ứng dụng điển hình? Ví dụ như quản lý cụm, Distributed Lock, bầu chọn `Master`, v.v.

Điều này liên quan tới cách sử dụng `ZooKeeper`, nhưng trước khi sử dụng ta cần nắm vững thêm vài khái niệm, chẳng hạn như **Mô hình dữ liệu**, **Cơ chế Session**, **ACL**, **Cơ chế Watcher** của `ZooKeeper`, v.v.

### Mô hình dữ liệu

Cấu trúc lưu trữ dữ liệu của `ZooKeeper` rất giống hệ thống tệp tin `Unix` chuẩn: đều treo nhiều node con dưới một node gốc (dạng cây). Nhưng trong `ZooKeeper` không có khái niệm thư mục và tệp tin như hệ thống tệp tin, mà **sử dụng `znode` làm node dữ liệu**. `znode` là đơn vị dữ liệu nhỏ nhất trong `ZooKeeper`; mỗi `znode` đều có thể lưu trữ dữ liệu, đồng thời có thể gắn thêm các node con, tạo thành một không gian tên (namespace) dạng cây.

![Mô hình dữ liệu zk](/media/jg/ext/oss.javaguide.cn/p3-juejin/663240470d524dd4ac6e68bde0b666eb-tplv-k3u1fbpfcp-be2a9b21.jpg)

Mỗi `znode` đều có **loại node** và **trạng thái node** thuộc về riêng mình.

Trong đó loại node có thể chia thành **Persistent Node (node bền vững)**, **Persistent Sequential Node (node bền vững tuần tự)**, **Ephemeral Node (node tạm thời)** và **Ephemeral Sequential Node (node tạm thời tuần tự)**.

- Persistent Node: Một khi đã tạo sẽ tồn tại mãi cho tới khi bị xóa.
- Persistent Sequential Node: Một node cha có thể **duy trì thứ tự tạo trước-sau** cho các node con của nó; thứ tự này thể hiện ngay trên **tên node**, bằng cách tự động gắn thêm một chuỗi số gồm 10 chữ số vào sau tên node, đánh số từ 0.
- Ephemeral Node: Vòng đời của node tạm thời gắn liền với **Session của client**; **Session mất thì node cũng mất**. Node tạm thời **chỉ có thể làm node lá**, không thể tạo node con.
- Ephemeral Sequential Node: Node cha có thể tạo ra một node tạm thời có duy trì thứ tự tuần tự (giống như Persistent Sequential Node ở trên).

Trạng thái node chứa rất nhiều thuộc tính như `czxid`, `mzxid`, v.v., được duy trì trong `ZooKeeper` thông qua lớp `Stat`. Dưới đây tôi liệt kê giải thích một số thuộc tính:

- `czxid`: `Created ZXID`, Transaction ID khi node dữ liệu này được **tạo**.
- `mzxid`: `Modified ZXID`, Transaction ID khi node được **cập nhật lần cuối**.
- `ctime`: `Created Time`, thời gian node này được tạo.
- `mtime`: `Modified Time`, thời gian node này được sửa đổi lần cuối.
- `version`: Số phiên bản của node.
- `cversion`: Số phiên bản của **các node con**.
- `aversion`: Số phiên bản `ACL` của node.
- `ephemeralOwner`: `sessionID` của Session đã tạo node này; nếu node là Persistent Node thì giá trị bằng 0.
- `dataLength`: Độ dài nội dung dữ liệu của node.
- `numChildre`: Số lượng node con của node này; nếu là Ephemeral Node thì bằng 0.
- `pzxid`: Transaction ID khi danh sách node con của node này bị sửa đổi lần cuối — lưu ý đây là **danh sách** node con chứ không phải nội dung.

### Phiên làm việc (Session)

Chắc hẳn khái niệm này không hề xa lạ với các bạn làm Backend — chẳng phải chính là `session` sao? Chỉ khác ở chỗ `zk` client và server duy trì cơ chế phiên thông qua **kết nối dài hạn `TCP`**; thực chất với Session, bạn có thể hiểu đơn giản là **duy trì trạng thái kết nối**.

Trong `ZooKeeper`, Session cũng có các sự kiện tương ứng, ví dụ `CONNECTION_LOSS` (sự kiện mất kết nối), `SESSION_MOVED` (sự kiện chuyển phiên), `SESSION_EXPIRED` (sự kiện hết hạn phiên).

### ACL

`ACL` viết tắt của `Access Control Lists`, là một cơ chế kiểm soát quyền truy cập. Trong `ZooKeeper` định nghĩa 5 loại quyền, lần lượt là:

- `CREATE`: Quyền tạo node con.
- `READ`: Quyền đọc dữ liệu node và liệt kê danh sách node con.
- `WRITE`: Quyền cập nhật dữ liệu node.
- `DELETE`: Quyền xóa node con.
- `ADMIN`: Quyền thiết lập ACL cho node.

### Cơ chế Watcher

`Watcher` là trình lắng nghe sự kiện, một tính năng cực kỳ quan trọng của `zk` mà rất nhiều chức năng dựa vào nó. Cơ chế này hơi giống kiểu đăng ký (subscribe): client **đăng ký** `watcher` chỉ định với server; khi phía server đáp ứng một số sự kiện hoặc điều kiện của `watcher` đó thì sẽ **gửi thông báo sự kiện về cho client**; client sau khi nhận được thông báo sẽ tìm tới `Watcher` mình đã định nghĩa rồi **thực thi phương thức callback tương ứng**.

![Cơ chế Watcher](/media/jg/ext/oss.javaguide.cn/p3-juejin/ac87b7cff7b44c63997ff0f6a7b6d2eb-tplv-k3u1fbpfcp-78bb2667.jpg)

## Một số kịch bản ứng dụng điển hình của ZooKeeper

Phía trên nói nhiều lý thuyết như vậy, có thể bạn đang thấy rối mù: mấy thứ này có ích gì? Làm được việc gì? Đừng vội, hãy nghe tôi trình bày từ từ.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/dbc1a52b0c304bb093ef08fb1d4c704c-tplv-k3u1fbpfcp-c5a5572a.jpg)

### Bầu chọn Master (Leader Election)

Còn nhớ Ephemeral Node mà chúng ta nói ở trên không? Nhờ tính nhất quán mạnh của `ZooKeeper`, nó có thể đảm bảo rất tốt **tính duy nhất toàn cục khi tạo node trong điều kiện đồng thời cao (High Concurrency)** (tức không thể tạo trùng cùng một node).

Tận dụng đặc tính này, chúng ta có thể **để nhiều client cùng tạo một node chỉ định**, ai tạo thành công thì là `master`.

Nhưng nếu `master` này bị sập thì sao???

Hãy nghĩ xem tại sao ta lại tạo Ephemeral Node? Còn nhớ vòng đời của Ephemeral Node không? `master` bị sập chẳng phải đồng nghĩa với việc Session bị đứt sao? Session đứt chẳng phải nghĩa là node này biến mất sao? Còn nhớ `watcher` không? Ta hoàn toàn có thể **để các node không phải `master` lắng nghe trạng thái của node đó** — ví dụ ta lắng nghe node cha của Ephemeral Node này, nếu số lượng node con thay đổi thì chứng tỏ `master` đã sập, lúc này ta **kích hoạt hàm callback để thực hiện bầu chọn lại**, hoặc ta lắng nghe trực tiếp trạng thái của node để biết `master` có sập hay không qua việc mất kết nối, v.v.

![Bầu chọn Master](/media/jg/ext/oss.javaguide.cn/p3-juejin/00468757fb8f4f51875f645fbb7b25a2-tplv-k3u1fbpfcp-6b9944c2.jpg)

Tóm lại, chúng ta hoàn toàn có thể **tận dụng Ephemeral Node, trạng thái node và `watcher` để hiện thực chức năng bầu chọn Master**: Ephemeral Node chủ yếu dùng để bầu chọn, còn trạng thái node và `watcher` dùng để kiểm tra tình trạng sống của `master` và tiến hành bầu chọn lại.

### Publish/Subscribe dữ liệu

Còn nhớ cơ chế `Watcher` của ZooKeeper không? ZooKeeper thông qua mô hình kết hợp đẩy-kéo (push-pull) này để thực hiện tương tác giữa client và server: client đăng ký theo dõi node với server; một khi dữ liệu của node tương ứng thay đổi, phía server sẽ gửi thông báo sự kiện `Watcher` tới các client đang "lắng nghe" node đó; client nhận được thông báo xong cần **chủ động** lên server lấy dữ liệu mới nhất. Dựa theo cách này, ZooKeeper hiện thực chức năng **Publish/Subscribe dữ liệu**.

Một kịch bản ứng dụng điển hình là **quản lý tập trung thông tin cấu hình toàn cục (Global Configuration)**. Client khi khởi động sẽ chủ động lên ZooKeeper server lấy thông tin cấu hình, đồng thời **đăng ký một trình lắng nghe `Watcher` trên node chỉ định**. Khi thông tin cấu hình thay đổi, server thông báo cho toàn bộ client đã đăng ký lấy lại thông tin cấu hình, giúp cập nhật cấu hình theo thời gian thực.

Thông tin cấu hình toàn cục nêu trên thường bao gồm danh sách máy chủ, công tắc cấu hình khi chạy (runtime switch), thông tin cấu hình cơ sở dữ liệu, v.v. Cần lưu ý loại thông tin cấu hình toàn cục này thường có các đặc điểm sau:

- Lượng dữ liệu nhỏ
- Nội dung dữ liệu thay đổi động trong quá trình chạy (runtime)
- Các máy trong cụm dùng chung cấu hình nhất quán

### Cân bằng tải (Load Balancing)

Có thể hiện thực cân bằng tải thông qua **Ephemeral Node** của ZooKeeper. Nhắc lại đặc tính của Ephemeral Node: khi client đã tạo node bị ngắt kết nối với server, tức là Session của client kết thúc, node tương ứng cũng tự động biến mất. Vì vậy, chúng ta có thể dùng Ephemeral Node để duy trì danh sách địa chỉ Server, từ đó đảm bảo request không bị điều phối tới những dịch vụ đã ngừng hoạt động.

Cụ thể, trong mỗi Server của cụm, ta đều dùng ZooKeeper client kết nối tới ZooKeeper server, đồng thời dùng **thông tin địa chỉ của chính Server đó** để tạo một Ephemeral Node dưới thư mục chỉ định trên server. Khi phía client gửi request gọi dịch vụ cụm, trước tiên nó truy vấn ZooKeeper để lấy danh sách node dưới thư mục đó (tức toàn bộ các Server khả dụng), sau đó dựa vào các chiến lược cân bằng tải khác nhau để chuyển tiếp request tới một Server cụ thể.

### Distributed Lock (Khóa phân tán)

Có rất nhiều cách hiện thực Distributed Lock, chẳng hạn như `Redis`, cơ sở dữ liệu, `ZooKeeper`, v.v. Cá nhân tôi thấy `ZooKeeper` hiện thực Distributed Lock cực kỳ đơn giản.

Ở trên chúng ta đã nhắc tới việc **zk đảm bảo tính duy nhất toàn cục khi tạo node trong điều kiện đồng thời cao** — nhìn phát là biết thứ này làm được gì rồi: làm khóa loại trừ lẫn nhau (Mutex) chứ còn gì nữa, lại còn hoạt động trong môi trường phân tán nên làm được Distributed Lock thôi.

Hiện thực thế nào? Thực ra cách làm gần giống hệt bầu chọn Master, ta cũng có thể dựa vào việc tạo Ephemeral Node để hiện thực.

Đầu tiên là làm sao giành được khóa: nhờ tính duy nhất khi tạo node, ta có thể cho nhiều client đồng thời tạo một Ephemeral Node, **ai tạo thành công thì chứng tỏ giành được khóa**. Những client không giành được khóa cũng tạo một `watcher` để lắng nghe trạng thái node giống như các node dự phòng trong bầu chọn Master; nếu khóa loại trừ lẫn nhau này được giải phóng (có thể do client giữ khóa bị sập hoặc client đó chủ động nhả khóa) thì gọi hàm callback để tranh giành lại khóa.

> Trong `zk` không cần phải bận tâm tới vấn đề khóa không được giải phóng như trong `Redis`, bởi khi client sập thì node cũng biến mất và khóa cũng tự động được giải phóng. Đơn giản đúng không nào?

Vậy có thể dùng `ZooKeeper` để đồng thời hiện thực cả **Shared Lock (khóa chia sẻ) và Exclusive Lock (khóa độc quyền)** không? Câu trả lời là được, chỉ hơi phức tạp hơn một chút thôi.

Còn nhớ **Sequential Node (node tuần tự)** không?

Lúc này tôi quy định mọi node được tạo ra đều phải có thứ tự. Nếu bạn là yêu cầu đọc (muốn lấy Shared Lock), nếu **không có node nào nhỏ hơn mình, hoặc các node nhỏ hơn mình đều là yêu cầu đọc**, thì bạn có thể lấy được Read Lock và bắt đầu đọc. **Nếu trong số các node nhỏ hơn mình có yêu cầu ghi**, client hiện tại chưa thể lấy được Read Lock mà chỉ có thể đợi các yêu cầu ghi phía trước hoàn thành.

Nếu bạn là yêu cầu ghi (lấy Exclusive Lock), nếu **không có node nào nhỏ hơn mình** thì client hiện tại có thể lấy thẳng Write Lock để sửa dữ liệu. Nếu phát hiện **có node nhỏ hơn mình — bất kể là thao tác đọc hay ghi — client hiện tại đều không thể lấy được Write Lock** mà phải đợi tất cả thao tác phía trước hoàn thành.

Cách này giải quyết rất gọn cả Shared Lock lẫn Exclusive Lock. Đương nhiên vẫn còn chỗ tối ưu được: ví dụ khi một khóa được giải phóng, nếu nó thông báo cho tất cả các client đang chờ thì sẽ gây ra **hiệu ứng bầy đàn (Herd Effect)**. Lúc này bạn có thể khắc phục bằng cách chỉ cho các node đang chờ lắng nghe node ngay phía trước mình.

Làm cụ thể ra sao? Thực ra cũng rất đơn giản: bạn có thể để **yêu cầu đọc chỉ lắng nghe yêu cầu ghi cuối cùng nhỏ hơn mình, còn yêu cầu ghi chỉ lắng nghe duy nhất node cuối cùng nhỏ hơn mình** — bạn nào hứng thú có thể tự nghiên cứu sâu thêm nhé.

### Naming Service (Dịch vụ đặt tên)

Khi đặt ID cho một đối tượng, chắc mọi người đều nghĩ ngay tới `UUID`, nhưng vấn đề lớn nhất của `UUID` là nó quá dài... (dài quá không hẳn đã tốt đâu, he he). Vậy trong điều kiện cho phép, liệu ta có thể dùng `ZooKeeper` để làm việc này không?

Trước đó chúng ta đã nhắc `ZooKeeper` lưu trữ các node dữ liệu theo **cấu trúc dạng cây**, tức là **đường dẫn đầy đủ (full path)** của mỗi node chắc chắn là duy nhất — ta hoàn toàn có thể lấy đường dẫn đầy đủ của node làm cách đặt tên. Quan trọng hơn nữa là đường dẫn do chính chúng ta tự định nghĩa, điều này rất tiện cho việc đặt ID cho những đối tượng mang ngữ nghĩa để dễ hiểu hơn.

### Quản lý cụm và Service Registry

Xem tới đây bạn có thấy `ZooKeeper` quá mạnh mẽ không, sao nó làm được nhiều thứ thế!

Đừng vội, việc nó làm được còn nhiều lắm. Đôi khi ta có nhu cầu biết toàn cụm đang có bao nhiêu máy hoạt động, thu thập dữ liệu trạng thái runtime của từng máy trong cụm, hay xử lý thao tác đưa máy lên tuyến/ngắt tuyến trong cụm, v.v.

Và `watcher` cùng Ephemeral Node được `ZooKeeper` hỗ trợ sẵn có thể đáp ứng cực tốt các nhu cầu này. Ta có thể tạo một Ephemeral Node cho mỗi máy rồi theo dõi node cha của chúng: nếu danh sách node con có biến động (do tạo hoặc xóa Ephemeral Node), ta dùng `watcher` gắn trên node cha để giám sát trạng thái và xử lý callback.

![Quản lý cụm](/media/jg/ext/oss.javaguide.cn/p3-juejin/f3d70709f10f4fa6b09125a56a976fda-tplv-k3u1fbpfcp-2454a604.jpg)

Còn về Service Registry cũng rất đơn giản: ta cũng cho **Service Provider** tạo một Ephemeral Node trong `ZooKeeper` và ghi `ip, port, phương thức gọi` của mình vào node đó. Khi **Service Consumer** cần gọi dịch vụ, nó sẽ **tìm danh sách địa chỉ dịch vụ tương ứng (IP, port các thứ) thông qua Service Registry** rồi cache ở máy cục bộ (tiện cho các lần gọi sau); khi Consumer gọi dịch vụ, nó sẽ không hỏi lại Service Registry nữa mà dùng trực tiếp thuật toán cân bằng tải để chọn một Server của Service Provider từ danh sách địa chỉ và gọi dịch vụ.

Khi một server nào đó của Service Provider bị sập hoặc offline, địa chỉ tương ứng sẽ bị xóa khỏi danh sách Service Provider. Đồng thời, Service Registry sẽ gửi danh sách địa chỉ dịch vụ mới cho các máy Service Consumer để cập nhật cache cục bộ (tất nhiên bạn cần cho Consumer lắng nghe node — tôi nhớ `Eureka` thì thử gọi lỗi trước rồi mới cập nhật sau).

![Service Registry](/media/jg/ext/oss.javaguide.cn/p3-juejin/469cebf9670740d1a6711fe54db70e05-tplv-k3u1fbpfcp-61c02245.jpg)

## Tổng kết

Các bạn đọc tới tận đây thực sự rất kiên nhẫn đấy 👍👍👍 — không biết mọi người còn nhớ tôi đã giảng những gì không nhỉ 😒.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/912c1aa6b7794d4aac8ebe6a14832cae-tplv-k3u1fbpfcp-25896957.jpg)

Trong bài viết này tôi đã đưa mọi người nhập môn `ZooKeeper`, framework điều phối phân tán mạnh mẽ này. Bây giờ hãy cùng hệ thống lại ngắn gọn nội dung cả bài viết nhé:

- Sự khác biệt giữa hệ thống phân tán (Distributed) và cụm (Cluster).

- Nguyên lý và cách hiện thực của các mô hình/thuật toán nhất quán như `2PC`, `3PC` và `Paxos`.

- Nội dung giao thức phát tán nguyên tử `ZAB` chuyên biệt của `ZooKeeper` (bầu chọn `Leader`, khôi phục sau sự cố, phát tán thông điệp).

- Một số khái niệm cơ bản trong `ZooKeeper`, như `ACL`, node dữ liệu (`znode`), Session, cơ chế `watcher`, v.v.

- Các kịch bản ứng dụng điển hình của `ZooKeeper`, như bầu chọn Master, Service Registry, v.v.

  Nếu quên chỗ nào bạn có thể quay lại xem để hiểu kỹ thêm; nếu có thắc mắc hay góp ý gì rất hoan nghênh trao đổi 🤝🤝🤝.
