---
title: "Giải thích chi tiết Thuật toán Raft: Bầu chọn Leader, Sao chép Log, Tính an toàn và Thay đổi thành viên"
category: Hệ thống phân tán
description: "Giải thích chi tiết về thuật toán Raft, trình bày bầu chọn Leader, sao chép log, cơ chế Leader chỉ ghi nối tiếp (Append-Only), tính nhất quán log, ràng buộc an toàn, thay đổi thành viên cụm và so sánh với Paxos, giúp hiểu rõ giao thức đồng thuận phân tán."
tag:
  - Giao thức & Thuật toán phân tán
  - Thuật toán đồng thuận
head:
  - - meta
    - name: keywords
      content: Raft,thuật toán Raft,bầu chọn Leader,sao chép log,thay đổi thành viên,thuật toán đồng thuận,nhất quán phân tán,so sánh Paxos,giao thức phân tán
lang: vi
sourceRef: zh-ref/distributed-system/protocol/raft-algorithm.md
---

> Bài viết này được đồng thực hiện bởi [SnailClimb](https://github.com/Snailclimb) và [Xieqijun](https://github.com/jun0315).

## 1. Bối cảnh

Trong kiến trúc Internet ngày nay, để chịu tải được lượng truy cập khổng lồ, hệ thống thường phải mở rộng theo chiều ngang bằng cách thêm máy chủ. Khi số lượng máy tăng lên, những sự cố như sập máy, đứt mạng trở thành chuyện cơm bữa. Làm sao để cả dàn server có thể rớt mạng bất cứ lúc nào này vẫn giữ được nhịp điệu thống nhất, không trả ra dữ liệu sai lệch cho bên ngoài? Đó chính là lúc **thuật toán đồng thuận phân tán (Distributed Consensus Algorithm)** lên sân khấu.

Năm 2014, Diego Ongaro và cộng sự đã công bố thuật toán Raft. Sự ra đời của nó mang theo một sứ mệnh cực kỳ rõ ràng: **giải cứu các lập trình viên đang bị thuật toán Paxos hành hạ**. Raft đặt trọng tâm vào tiêu chí "dễ hiểu", chia tách bài toán đồng thuận phức tạp thành các module độc lập:

- **Bầu chọn Leader (Leader Election)**: Sử dụng thời gian chờ bầu chọn ngẫu nhiên (trong thực tế kỹ thuật thường từ `150–300ms` hoặc rộng hơn tùy thuộc vào mô hình mạng và lỗi).
- **Sao chép Log (Log Replication)**: Leader phát tán các bản ghi log thông qua `AppendEntries` RPC.
- **Tính an toàn (Safety)**: Bao gồm các ràng buộc bầu chọn và đối khớp log.

Raft đã được ứng dụng rộng rãi trong môi trường Production thực tế; các hệ thống dựa trên Raft như `etcd`, `Consul` đã trở thành thành phần cốt lõi của hạ tầng phân tán. Sau này giới học thuật và công nghiệp cũng tiếp tục mở rộng và tối ưu Raft với nhiều cải tiến, bao gồm:

- **Pre-Vote** (2014): Ngăn các node bị phân vùng mạng làm nhiễu quá trình bầu chọn của một cụm đang hoạt động ổn định.
- **Read Index** (2014): Tối ưu hiệu năng đọc thông qua cơ chế đọc nhất quán tuyến tính (Linearizable Read) trong nhiệm kỳ của Leader.
- **Lease Read**: Giải pháp đọc nhất quán tuyến tính dựa trên cơ chế thuê bao thời gian (`Lease`).
- **Joint Consensus**: Cơ chế đồng thuận liên hợp phục vụ thay đổi thành viên cụm (thông qua cấu hình chuyển tiếp theo tiến trình: `Cấu hình cũ → Cấu hình liên hợp → Cấu hình mới`).

Vì vậy, hệ thống bắt buộc phải xử lý được việc server bật/tắt (tham gia hoặc rời cụm) ngay trong quá trình vận hành bình thường. Chúng phải phản ứng trước biến cố và tự thích nghi trong vòng vài giây; đối với người dùng, sự gián đoạn rõ rệt thường là điều không thể chấp nhận.

May mắn thay, đồng thuận phân tán giúp giải quyết hiệu quả những thách thức này.

### 1.1 Phép ví von "Bầu chọn chủ soái" trong điều kiện phi Byzantine

Raft đặt trên một giả định tiền đề: **Chịu lỗi dừng (Crash Fault Tolerance - CFT, phi Byzantine)**. Nói nôm na là các anh em có thể sập nguồn, rớt mạng, nhưng tuyệt đối không có nội gián tuồn tin giả.

Ta có thể hình dung sơ bộ quá trình này qua chuyện "các tướng quân bầu chủ soái": Giả sử có ba vị tướng A, B, C, hiện tại quân không có người đứng đầu. Trong đầu mỗi người đều có một bộ đếm ngược ngẫu nhiên (Election Timeout). Ai hết giờ đếm ngược trước thì đứng dậy hô lớn: "Tôi muốn làm đại tướng quân, hãy bỏ phiếu cho tôi!". Nếu các vị tướng khác chưa bắt đầu tranh cử và cũng chưa bỏ phiếu cho ai khác, họ sẽ thuận nước đẩy thuyền đồng ý. Khi vị tướng đó gom đủ **quá bán** số phiếu thuận, ông ta trở thành thủ lĩnh (Leader). Từ đó về sau, đánh hay rút đều nghe theo lệnh ông ta. Nếu lính đưa tin lỡ hy sinh giữa đường khiến mọi người không nhận được hồi âm, tất cả lại đặt lại bộ đếm ngược và bầu lại một vòng mới.

### 1.2 Thuật toán đồng thuận rốt cuộc là gì?

Mục tiêu cốt lõi của thuật toán đồng thuận là **biến một nhóm nhiều máy trông giống hệt như một máy duy nhất**. Chỉ cần hơn một nửa số máy trong cụm còn sống, toàn bộ hệ thống vẫn tiếp khách bình thường.

Điều này thường được hiện thực thông qua **Máy trạng thái sao chép (Replicated State Machine - RSM)**: phát cho mỗi node một cuốn sổ cái (log) giống hệt nhau. Chỉ cần tất cả cùng thực thi các lệnh trong sổ cái theo đúng một thứ tự, kết quả cuối cùng thu được tự nhiên sẽ hoàn toàn giống nhau. Vì thế, bản chất của thuật toán đồng thuận là làm đúng một việc — **đảm bảo sổ cái của mọi node nhất quán tuyệt đối**. Đồng thuận là một bài toán nền tảng trong các hệ thống chịu lỗi: ngay cả khi đối mặt với sự cố, các server vẫn có thể thống nhất trên một trạng thái dùng chung.

![Kiến trúc thuật toán đồng thuận](/media/jg/ext/oss.javaguide.cn/github/javaguide/paxos-rsm-architecture-fdf50738.png)

## 2. Các khái niệm nền tảng

Trước khi đi sâu vào Raft, chúng ta cần làm quen với ba vai trò cốt lõi, cơ chế nhiệm kỳ (`term`) và cấu trúc log bên trong nó.

### 2.1 Các loại node

Một cụm Raft gồm nhiều server; hãy lấy cụm 5 server điển hình làm ví dụ. Tại bất kỳ thời điểm nào, mỗi server chắc chắn đang ở một trong ba trạng thái sau:

- **Leader (Thủ lĩnh)**: Người đứng đầu. Chịu toàn quyền tiếp nhận yêu cầu từ client, ghi sổ cái và đồng bộ sổ cái sang cho các thuộc hạ. Để đề phòng kẻ khác soán ngôi, Leader phải liên tục gửi nhịp tim (`heartbeat`) tới toàn thể cụm để tuyên bố "Ta vẫn còn sống".
- **Follower (Người đi theo)**: Thuộc hạ ngoan ngoãn. Bình thường tuyệt đối không chủ động gửi yêu cầu, chỉ thụ động tiếp nhận heartbeat và đồng bộ sổ cái từ Leader.
- **Candidate (Ứng cử viên)**: Trạng thái tạm thời. Nếu Follower chờ mãi không thấy heartbeat của Leader, nó sẽ tự thấy mình đủ sức gánh vác, biến thân thành Candidate để đi vận động phiếu bầu.

Trong trạng thái hoạt động bình thường, chỉ có duy nhất một server là Leader, các server còn lại đều là Follower. Follower hoàn toàn thụ động: chúng không tự phát đi bất kỳ request nào, chỉ phản hồi các yêu cầu đến từ Leader và Candidate.

![Sơ đồ chuyển đổi trạng thái server trong Raft](/media/jg/ext/oss.javaguide.cn/github/javaguide/paxos-server-state-1b632d32.png)

### 2.2 Nhiệm kỳ (Term)

![Minh họa nhiệm kỳ (term)](/media/jg/ext/oss.javaguide.cn/github/javaguide/paxos-term-a8e53feb.png)

Thuật toán Raft chia thời gian thành các nhiệm kỳ (`term`) có độ dài tùy ý, được đánh dấu bằng các số nguyên liên tiếp gọi là số `term` hiện tại. Mỗi nhiệm kỳ luôn mở đầu bằng một cuộc bầu chọn, nơi một hoặc nhiều Candidate cố gắng trở thành Leader. Nếu một Candidate thắng cử, nó sẽ đảm nhiệm vai trò Leader trong suốt nhiệm kỳ đó. Nếu không bầu được Leader (ví dụ do chia phiếu `split vote`), nhiệm kỳ đó có thể không có Leader; sau khi hết thời gian chờ bầu chọn mới, hệ thống bước sang nhiệm kỳ kế tiếp và tổ chức bầu chọn lại. Chỉ cần đa số node khả dụng và mạng cuối cùng thông suốt, hệ thống thường bầu được Leader sau vài vòng.

Mỗi node đều lưu trữ số `term` hiện tại và trao đổi số `term` này khi giao tiếp với nhau. Nếu một server phát hiện số `term` của mình nhỏ hơn của server khác, nó sẽ cập nhật lên giá trị `term` lớn hơn. Nếu một Candidate hoặc Leader phát hiện `term` của mình đã lỗi thời, nó lập tức lùi về trạng thái Follower. Nếu một server nhận được request mang `term` đã cũ, nó sẽ từ chối request đó.

Hình vẽ tay dưới đây của mình giúp dễ hình dung hơn hẳn, rất trực quan:

![Diễn tiến logic nhiệm kỳ trong Raft (Term Progression)](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/raft-term-progression-43b14d05.png)

### 2.3 Log

Chỉ có Leader mới có quyền ghi nối tiếp bản ghi (`Entry`) vào sổ cái. Mỗi bản ghi log bao gồm ba thành phần cốt lõi: `<Nhiệm kỳ hiện tại, Số chỉ mục (Index), Lệnh thao tác cụ thể>`.

Có hai con trỏ tiến độ cực kỳ quan trọng:

- **`commitIndex`**: Tiến độ log mà cả cụm công nhận đã được lưu xuống an toàn (đã được sao chép tới quá bán số node).
- **`lastApplied`**: Tiến độ log mà bản thân máy này thực sự đã thực thi xong lên State Machine cục bộ.

## 3. Bầu chọn Leader

![Quy trình bầu chọn Leader trong Raft](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/raft-election-b5e23d8b.png)

Raft sử dụng cơ chế `heartbeat` để kích hoạt bầu chọn Leader.

Nếu một server liên tục nhận được các RPC hợp lệ như `AppendEntries` (heartbeat hoặc sao chép log) từ Leader, nó sẽ giữ nguyên trạng thái Follower và làm mới bộ đếm thời gian bầu chọn (`election timer`).

Leader sẽ định kỳ gửi heartbeat tới tất cả Follower để duy trì vị thế Leader của mình. Nếu một Follower không nhận được thông điệp heartbeat trong một chu kỳ — gọi là hết thời gian chờ bầu chọn (`electionTimeout`) — nó sẽ cho rằng hiện tại không có Leader khả dụng và bắt đầu tổ chức một cuộc bầu chọn để tìm Leader mới.

Để khởi động cuộc bầu chọn mới, Follower tự tăng số `term` của mình lên 1 và chuyển sang trạng thái Candidate. Sau đó nó gửi yêu cầu `RequestVote` RPC tới tất cả các node. Trạng thái Candidate sẽ kéo dài cho đến khi xảy ra một trong các tình huống sau:

- Thắng cử.
- Node khác thắng cử.
- Kết thúc một vòng bầu chọn nhưng không có ai thắng.

Điều kiện thắng cử là: một Candidate trong cùng một nhiệm kỳ nhận được đa số phiếu bầu từ cụm `(N/2 + 1)` thì có thể trở thành Leader.

Trong lúc Candidate đang chờ phiếu bầu, nó có thể nhận được heartbeat từ node khác tự xưng là Leader; khi đó có hai trường hợp:

- Số `term` của Leader kia lớn hơn hoặc bằng `term` của bản thân: chứng tỏ đối phương đã trở thành Leader hợp lệ, bản thân tự lùi về Follower.
- Số `term` của Leader kia nhỏ hơn `term` của bản thân: từ chối request đó và khiến node kia cập nhật lại `term`.

Do có thể cùng lúc xuất hiện nhiều Candidate khiến không ai gom đủ đa số phiếu bầu, nếu không có biện pháp phân bổ lại việc bỏ phiếu thì vòng lặp này có thể tái diễn vô tận.

Raft sử dụng **thời gian chờ bầu chọn ngẫu nhiên (Randomized Election Timeout)** để tránh tình huống trên. Mỗi khi Candidate bắt đầu bầu chọn, nó đều chọn ngẫu nhiên một giá trị `electionTimeout` mới. Cơ chế này giúp các server phân tán thời điểm hết giờ ra, nên trong phần lớn trường hợp sẽ chỉ có một server hết giờ trước tiên và thắng cử trước khi các server khác kịp hết giờ.

## 4. Sao chép Log (Log Replication)

Một khi đã bầu được Leader, nó bắt đầu tiếp nhận request từ client. Mỗi request của client chứa một lệnh cần được **Máy trạng thái sao chép (`Replicated State Machine`)** thực thi.

Sau khi nhận request từ client, Leader tạo ra một `entry` gồm `<index, term, cmd>`, nối `entry` này vào cuối log của chính mình rồi phát tán tới tất cả các node khác, yêu cầu các server kia sao chép `entry` này.

Nếu Follower chấp nhận `entry`, nó sẽ ghi nối `entry` vào cuối log của mình và phản hồi đồng ý về cho Leader.

Khi Leader nhận được phản hồi sao chép thành công từ đa số Follower cho `entry` đó, Leader sẽ đẩy tiến độ `commitIndex` của mình lên, sau đó lần lượt áp dụng (`apply`) các log đã commit (`committed`) theo đúng thứ tự vào State Machine rồi mới trả kết quả về cho client.

Cần lưu ý một ràng buộc then chốt: Leader chỉ có thể đẩy `commitIndex` dựa trên **"một bản ghi log được tạo ra trong nhiệm kỳ hiện tại (`current term`) đã sao chép thành công lên đa số node"**. Đối với các bản ghi log tồn đọng từ những nhiệm kỳ trước, ngay cả khi chúng đã được sao chép tới đa số node, Leader cũng không được phép chỉ dựa vào số bản sao đa số để commit trực tiếp; thông thường Leader sẽ commit gián tiếp các log lịch sử bằng cách commit một log mới của nhiệm kỳ hiện tại (cách phổ biến là ghi và commit một bản ghi `no-op` ngay sau khi đắc cử).

Follower không tự mình quyết định điểm commit; chúng biết được chỉ mục tối đa có thể commit thông qua trường `leaderCommit` đi kèm trong `AppendEntries` RPC của Leader, cập nhật `commitIndex` cục bộ thành `min(leaderCommit, lastLogIndex)`, rồi tuần tự `apply` vào State Machine.

### 4.1 Thuộc tính đối khớp Log (Log Matching Property)

Raft đảm bảo log tuyệt đối không bị phân nhánh (rẽ nhánh) thông qua **Thuộc tính đối khớp Log (Log Matching Property)** — một trong những nền tảng cốt lõi cho tính an toàn của Raft. Thuộc tính này gồm hai cam kết chính:

- **Cam kết 1**: Nếu hai bản ghi log ở cùng vị trí `index` có cùng giá trị `term`, thì lệnh `cmd` mà chúng lưu trữ chắc chắn giống hệt nhau.
- **Cam kết 2**: Nếu hai bản ghi log ở cùng vị trí `index` có cùng giá trị `term`, thì toàn bộ các bản ghi đứng trước vị trí đó trong cả hai log cũng hoàn toàn giống nhau.

#### Chứng minh bằng quy nạp

Thuộc tính đối khớp log được đảm bảo thông qua phép quy nạp toán học:

1. **Trường hợp cơ sở**: Khi log rỗng, thuộc tính tự nhiên đúng.
2. **Bước quy nạp**: Giả sử hai log hoàn toàn khớp nhau trước vị trí `index N`; khi Leader thử nối thêm `entry N+1`, **bước kiểm tra tính nhất quán của `AppendEntries` RPC** sẽ đảm bảo sự khớp nối:

```
Tham số của AppendEntries RPC:
- prevLogIndex: chỉ mục của bản ghi log liền trước (vị trí Leader cho rằng đã khớp với Follower)
- prevLogTerm: nhiệm kỳ của bản ghi log liền trước đó
- entries[]: danh sách các bản ghi log mới cần ghi nối tiếp
```

**Logic kiểm tra tính nhất quán**:

- Sau khi nhận được yêu cầu `AppendEntries`, Follower kiểm tra vị trí `index = prevLogIndex` trong log cục bộ của mình.
- Nếu tại vị trí đó có `entry.term == prevLogTerm`, chứng tỏ Leader và Follower có phần log trước `prevLogIndex` hoàn toàn trùng khớp -> vượt qua kiểm tra.
- Nếu không tồn tại bản ghi hoặc `term` không khớp -> từ chối ghi nối tiếp và trả về thất bại.

**Điểm mấu chốt**: Thông qua việc kiểm tra cặp `(prevLogIndex, prevLogTerm)`, Leader và Follower có thể **chứng minh về mặt toán học** rằng cả hai đã thống nhất toàn bộ lịch sử log trước đó. Chỉ khi "điểm đồng thuận gần nhất đã biết" thực sự trùng khớp thì log mới mới được phép nối vào. Điều này tạo thành chuỗi truyền dẫn quy nạp:

```
entry[0] khớp → entry[1] khớp → entry[2] khớp → ... → entry[N] khớp
    ↑_____________được xác minh đệ quy qua prevLogIndex/prevLogTerm_____________↑
```

Do đó, log không bao giờ có chuyện hai giá trị khác nhau cùng được "commit" tại một vị trí `index` — tức log không bao giờ bị phân nhánh.

#### Tối ưu hóa trong triển khai kỹ thuật

Trong các bản cài đặt Production thực tế (như `etcd 3.5.x`), ngoài bước kiểm tra nhất quán cơ bản nêu trên, còn có nhiều tối ưu kỹ thuật:

- **Lùi nhanh (Fast Backup)**: Khi kiểm tra nhất quán của `AppendEntries` thất bại, Follower trả về `term` của log xung đột kèm theo chỉ mục biên của `term` đó (chỉ mục đầu tiên và cuối cùng của `term` ấy). Nhờ vậy Leader nhảy qua cả một đoạn xung đột trong một lần thay vì giảm dần `nextIndex` từng dòng một để thử lại.
- **Chống bão thử lại (Retry Storm Protection)**: Dưới tải cao có thể phát sinh hàng loạt `AppendEntries` thất bại và retry; các bản triển khai thường bổ sung:
  - **Lùi kết hợp Jitter**: Thêm độ trễ ngẫu nhiên vào khoảng nghỉ giữa các lần retry để tránh nhiều Follower thử lại cùng một thời điểm.
  - **Cơ chế áp lực ngược (Backpressure)**: Giới hạn tốc độ retry cho từng Follower riêng lẻ nhằm tránh chiếm dụng quá mức băng thông mạng.

Những tối ưu này không làm thay đổi tính đúng đắn lý thuyết của thuộc tính đối khớp log, mà nâng cao đáng kể hiệu quả khôi phục của hệ thống trong các kịch bản bất thường.

### 4.2 Khôi phục khi Log không nhất quán

Khi vận hành bình thường, sổ cái của Leader và các Follower luôn đồng bộ hoàn hảo. Tuy nhiên, một khi Leader cũ bất ngờ sập nguồn, quá trình chuyển giao quyền lực thường để lại rất nhiều dữ liệu "bẩn" chưa căn chỉnh đồng bộ trong cụm.

Lúc này, yêu cầu đồng bộ `AppendEntries` từ Leader mới sẽ lập tức kích hoạt lỗi kiểm tra nhất quán. Logic giải quyết xung đột dữ liệu của Raft cực kỳ dứt khoát: **lấy sổ cái của Leader đương nhiệm làm chuẩn tối cao**, mọi bản ghi không khớp trên máy Follower đều phải bị xóa bỏ không thương tiếc và ghi đè cưỡng bức.

Cụ thể làm thế nào? Leader sẽ lần ngược lại như đang kéo khóa áo để tìm điểm lịch sử cuối cùng mà hai bên còn khớp nhau hoàn hảo. Khi đã tìm thấy "điểm rẽ nhánh" này, Follower sẽ cắt bỏ toàn bộ mớ hỗn độn phía sau điểm rẽ nhánh đó và ngoan ngoãn chép lại log chuẩn mới nhất do Leader gửi sang.

Ở tầng mã nguồn, Leader lưu trong bộ nhớ một cuốn sổ theo dõi riêng cho từng Follower với con trỏ cốt lõi mang tên `nextIndex` (vị trí bản ghi log tiếp theo dự kiến sẽ gửi cho Follower đó). Tân quan mới nhậm chức thường có ba mồi lửa — khi vừa tiếp quản, Leader mới sẽ tự tin đặt mặc định `nextIndex` của mọi Follower bằng chỉ mục log mới nhất của mình cộng thêm 1. Nếu dữ liệu của Follower thực tế bị tụt hậu hoặc có xung đột, phát súng `AppendEntries` đầu tiên chắc chắn bị từ chối thẳng thừng. Tiếp theo là hai trường phái tìm điểm rẽ nhánh:

- **Cách làm truyền thống thuần túy (dò từng bước)**: Đụng tường thì lùi một bước. Leader giảm `nextIndex` đi 1 rồi gửi lại RPC thăm dò. Nếu vẫn chưa được thì lại trừ đi 1 nữa, cứ thế bò lùi chậm chạp từng bản ghi một cho đến khi khớp được ám hiệu.
- **Tối ưu tăng tốc cấp công nghiệp (Fast Backup — Lùi nhanh)**: Trong môi trường Production thực tế, lùi từng bước một là thảm họa hiệu năng. Vì vậy giới kỹ thuật đã đưa vào cơ chế lùi nhanh. Khi từ chối đồng bộ, Follower không chỉ lắc đầu suông mà lật bài luôn: "Đống log sai lệch bên tôi thuộc về nhiệm kỳ lịch sử nào (`term`), và biên đầu/cuối của nhiệm kỳ đó nằm ở đâu". Cầm thông tin tình báo này trong tay, Leader thẳng tay nhảy vọt qua toàn bộ đoạn nhiệm kỳ bị lỗi chỉ trong một nhịp, cắt giảm mạnh số lần retry mạng dư thừa.

Sau màn kéo co này, `nextIndex` cuối cùng cũng neo chính xác vào điểm đồng thuận chung của hai bên. Lúc đó, `AppendEntries` rốt cuộc cũng nhận được hồi đáp thành công; dữ liệu xung đột trên Follower bị dọn sạch triệt để và phần log chính thống còn thiếu được lấp đầy khít khao. Một khi vượt qua ải này, sổ cái hai bên sẽ bám sát nhau như hình với bóng trong suốt phần còn lại của nhiệm kỳ.

## 5. Tính an toàn (Safety)

### 5.1 Ràng buộc bầu chọn (Election Restriction)

Leader cần đảm bảo bản thân lưu trữ toàn bộ các bản ghi log đã được commit. Nhờ vậy luồng dữ liệu log chỉ đi theo một chiều duy nhất: từ Leader sang Follower, và Leader không bao giờ ghi đè lên các bản ghi log đã tồn tại trước đó.

Mỗi khi Candidate gửi `RequestVote` RPC, nó đều đính kèm thông tin về bản ghi `entry` cuối cùng của mình. Tất cả các node nhận được yêu cầu bỏ phiếu sẽ đem `entry` đó ra so sánh với log của mình; nếu phát hiện log của bản thân mới hơn, chúng sẽ từ chối bỏ phiếu cho Candidate đó.

Cách xác định log nào mới hơn: nếu hai log có `term` ở mục cuối khác nhau, log có `term` lớn hơn là mới hơn; nếu `term` giống nhau, log nào dài hơn (`index` lớn hơn) là mới hơn.

### 5.2 Quy tắc Commit (Chỉ commit log của nhiệm kỳ hiện tại)

Khi đẩy `commitIndex`, Leader phải thỏa mãn điều kiện "một bản ghi log sinh ra trong nhiệm kỳ hiện tại đã được sao chép tới đa số node". Đối với các log tồn đọng từ nhiệm kỳ cũ, ngay cả khi đã được sao chép tới đa số node, Leader vẫn không được phép chỉ dựa vào đó để commit trực tiếp; thông thường phải thông qua việc commit một bản ghi log mới trong nhiệm kỳ hiện tại (phổ biến là `no-op`) để gián tiếp commit toàn bộ các log lịch sử. Ràng buộc này nhằm tránh lỗi an toàn khiến log đã commit bị ghi đè khi Leader thay đổi liên tục.

### 5.3 Sự cố sập node và phân vùng mạng

Nếu Follower hoặc Candidate bị sập, cách xử lý rất đơn giản. Các `RequestVote` RPC và `AppendEntries` RPC gửi tới nó sau đó sẽ thất bại. Do mọi request của Raft đều có tính lũy đẳng (Idempotent), nên nếu thất bại sẽ được thử lại vô hạn lần. Khi node đó khôi phục sau sự cố, nó lại nhận được request mới rồi lựa chọn ghi nối tiếp hoặc từ chối `entry`.

Nếu Leader bị sập, các node không nhận được heartbeat trong khoảng `electionTimeout` sẽ kích hoạt một vòng bầu chọn Leader mới; trước khi bầu xong Leader mới, hệ thống thường không thể phục vụ các thao tác ghi nhất quán tuyến tính (cũng như đọc nhất quán tuyến tính), thể hiện thành một khoảng thời gian mất khả dụng ngắn.

**Phân tích định lượng**: Trong cụm 5 node, khoảng thời gian mất khả dụng sau khi Leader sập thường nhỏ hơn 1 giây (`P99 < 500ms` thời gian chờ bầu chọn + một vòng bầu chọn). Đây chính là biểu hiện của **định lý PACELC**: khi xảy ra phân vùng mạng (`P`), hệ thống chọn hy sinh tính sẵn sàng (`A`) để đảm bảo tính nhất quán (`C`). Cơ chế retry lũy đẳng đảm bảo node sau khi hồi phục có thể đuổi kịp trạng thái dữ liệu một cách an toàn.

#### Bài toán cô lập đơn node và bùng nổ Term (Term Inflation)

Trong thuật toán Raft tiêu chuẩn, **việc một node đơn lẻ bị cô lập mạng** có thể dẫn đến hiện tượng **bùng nổ Term (Term Inflation)**, gây ra hiệu ứng "đồng tiền xấu xua đuổi đồng tiền tốt" — một node thuộc nhóm thiểu số bị cô lập sau khi kết nối lại lại phá hỏng sự ổn định của cả cụm đang khỏe mạnh.

**Diễn biến kịch bản**:

Giả sử cụm có 5 node với Leader là node `A`, các Follower là `B`, `C`, `D`, `E`. Lúc này node `E` gặp phân vùng mạng và bị cô lập hoàn toàn:

```
Vùng bình thường: {A, B, C, D}    (Leader A + đa số, phục vụ bình thường)
Vùng bị cô lập:  {E}             (Cô lập đơn node, không nhận được heartbeat)
```

| Mốc thời gian | Vùng bình thường `{A, B, C, D}`                         | Vùng bị cô lập `{E}`                                           |
| ------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `T0`          | Leader `A` phục vụ bình thường, `Term = 5`              | `E` không nhận được heartbeat, hết hạn `electionTimeout`       |
| `T1`          | Cụm tiếp tục hoạt động bình thường                      | `E` tự tăng `Term` phát động bầu chọn (`Term 6`), không có hồi âm |
| `T2`          | ...                                                     | `E` tiếp tục tự tăng (`Term 7, 8, ...`), giả sử tăng lên `Term 99` |
| `T3`          | Mạng khôi phục, `E` mang theo `Term 99` gia nhập lại cụm| `E` phát tán `RequestVote (Term 99)` tới `{A, B, C, D}`        |
| `T4`          | Node `A` thấy `Term 99 > Term 5` của mình, **buộc phải thoái vị** | `Term` cao bất thường của `E` phá vỡ cụm đang khỏe mạnh |

**Phân tích vấn đề**:

- `{A, B, C, D}` là **nhóm đa số hợp lệ** (`4/5`), hệ thống lẽ ra phải tiếp tục hoạt động bình thường.
- Node `E` thuộc **nhóm thiểu số** (`1/5`), việc nó bị cô lập không được phép làm ảnh hưởng tới toàn cụm.
- **Vấn đề then chốt**: Việc `Term` của `E` tăng vọt khiến Leader `A` đang khỏe mạnh buộc phải rời ngôi.
- **Hậu quả**: Toàn bộ cụm phải bầu chọn lại từ đầu, gây gián đoạn thao tác ghi không đáng có.

Đây là một lỗi biên đã biết của Raft tiêu chuẩn: những cuộc "bầu chọn điên cuồng" của node thiểu số làm gián đoạn vận hành bình thường của nhóm đa số.

#### Cơ chế Pre-Vote

Để giải quyết vấn đề trên, giải pháp mở rộng **Pre-Vote** của Raft đã được đề xuất. Pre-Vote yêu cầu một node trước khi thực sự phát động bầu chọn phải thực hiện một bước "bỏ phiếu thăm dò":

1. **Pha bỏ phiếu thăm dò**: Candidate gửi `PreVoteRequest` tới các node khác kèm thông tin log của mình (chưa tăng `term`).
2. **Điều kiện bỏ phiếu thăm dò**:
   - Log của ứng cử viên ít nhất phải mới ngang hoặc mới hơn log của bên nhận (ràng buộc bầu chọn).
   - **Bên nhận xác nhận bản thân cũng đã mất kết nối với Leader** (quá `electionTimeout` không nhận được heartbeat).
3. **Bầu chọn chính thức**: Chỉ khi nhận được phản hồi `PreVote` đồng thuận từ đa số các node, ứng cử viên mới thực sự tăng `term` và gửi `RequestVote`.

**Cách Pre-Vote ngăn chặn bùng nổ Term**:

- Trong kịch bản cô lập đơn node nêu trên, khi `E` phát động Pre-Vote, **các node khác vẫn đang nhận được heartbeat từ Leader `A`**.
- Vì thế các node khác sẽ **từ chối yêu cầu `PreVote` của `E`** (do kết nối với Leader vẫn bình thường).
- `E` không thể gom đủ đa số phản hồi `PreVote` nên **sẽ không thực sự tăng `Term`**.
- Sau khi mạng khôi phục, `Term` của `E` vẫn ở mức thấp và không làm phiền Leader `A` đang khỏe mạnh.

**Tư tưởng cốt lõi**: Chỉ sau khi xác nhận mình đã mất liên lạc với Leader (và được đa số đồng tình), node mới thực sự tăng `Term`. Điều này ngăn chặn hiệu quả tình trạng bùng nổ Term của node thiểu số gây nhiễu nhóm đa số.

Cơ chế Pre-Vote hiện đã được ứng dụng rộng rãi trong các bản triển khai Raft cấp Production như `etcd`, `TiKV`, `Consul`.

### 5.4 Thời gian và tính sẵn sàng

Một trong những yêu cầu của Raft là tính an toàn không được phụ thuộc vào thời gian: hệ thống tuyệt đối không thể chỉ vì một số sự kiện xảy ra nhanh hơn hoặc chậm hơn dự kiến mà sinh ra kết quả sai. Để đảm bảo yêu cầu về tính khả dụng, điều kiện thời gian sau nên được thỏa mãn:

`broadcastTime << electionTimeout << MTBF`

- `broadcastTime`: Thời gian phản hồi trung bình khi gửi thông điệp song song tới các node khác.
- `electionTimeout`: Thời gian chờ bầu chọn (`election timeout`).
- `MTBF (Mean Time Between Failures)`: Thời gian hoạt động khỏe mạnh trung bình giữa các lần hỏng hóc của một máy đơn lẻ.

`broadcastTime` nên nhỏ hơn `electionTimeout` khoảng một bậc độ lớn để `Leader` có thể liên tục gửi thông điệp nhịp tim (`heartbeat`) nhằm ngăn `Follower` khởi phát bầu chọn.

`electionTimeout` cũng phải nhỏ hơn `MTBF` vài bậc độ lớn để hệ thống vận hành ổn định. Khi `Leader` sập, hệ thống sẽ tạm thời không khả dụng trong xấp xỉ khoảng thời gian `electionTimeout`; chúng ta muốn tình trạng này chỉ chiếm một tỷ lệ cực nhỏ trong toàn bộ thời gian hoạt động.

Do `broadcastTime` và `MTBF` là thuộc tính do hạ tầng hệ thống quyết định, ta cần cấu hình giá trị `electionTimeout` phù hợp.

Thông thường, `broadcastTime` rơi vào khoảng `0.5–20ms`, `electionTimeout` có thể thiết lập trong khoảng `10–500ms` (trong kỹ thuật thực tế thường dùng `150–300ms`), còn `MTBF` thường tính bằng một đến vài tháng.

## 6. Tài liệu tham khảo

- <https://tanxinyu.work/raft/>
- <https://github.com/OneSizeFitsQuorum/raft-thesis-zh_cn/blob/master/raft-thesis-zh_cn.md>
- <https://github.com/ongardie/dissertation/blob/master/stanford.pdf>
- <https://knowledge-sharing.gitbooks.io/raft/content/chapter5.html>
