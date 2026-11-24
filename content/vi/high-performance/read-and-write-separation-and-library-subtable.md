---
title: "Giải thích chi tiết Tách Đọc-Ghi (Read/Write Splitting) và Phân mảnh & Chia bảng (Sharding)"
description: "Bài viết giải thích chuyên sâu nguyên lý cốt lõi của Tách Đọc-Ghi (Read/Write Splitting) và Phân mảnh & Chia bảng (Sharding) cho Database, bao gồm cơ chế sao chép Master-Replica, giải pháp triển khai Tách Đọc-Ghi (Proxy/Thư viện), sự khác biệt giữa chia dọc và chia ngang, cách chọn Sharding Key, Sharding bảng đơn hàng cũng như các vấn đề thường gặp như Distributed Transaction, Distributed ID và JOIN liên shard."
category: Hiệu năng cao (High Performance)
head:
  - - meta
    - name: keywords
      content: Tách Đọc-Ghi,Read/Write Splitting,Phân mảnh và chia bảng,Sharding,Sao chép Master-Replica,Chia bảng ngang,Chia database dọc,ShardingSphere,MyCat,Distributed ID,Truy vấn liên shard,Sharding Key,Read Amplification,Sharding đơn hàng
lang: vi
sourceRef: zh-ref/high-performance/read-and-write-separation-and-library-subtable.md
---

## Tách Đọc-Ghi (Read/Write Splitting)

### Tách Đọc-Ghi (Read/Write Splitting) là gì?

**Tách Đọc-Ghi (Read/Write Splitting) chủ yếu nhằm phân tách thao tác đọc và thao tác ghi của Database sang các node Database khác nhau.** Request ghi vẫn đi vào Master DB (Primary), còn request đọc được phân bổ sang một hoặc nhiều bản sao chỉ đọc (Read-only Replica), do đó lợi ích chính của nó là nâng cao khả năng mở rộng đọc (read scalability) của Database. Chỉ khi trước đó Master DB bị kéo chậm bởi quá nhiều request đọc thì sau khi chuyển lưu lượng đọc đi nơi khác, luồng ghi mới được hưởng lợi gián tiếp.

Tôi đã vẽ một sơ đồ đơn giản để các bạn chưa rành về Tách Đọc-Ghi dễ hình dung:

![Sơ đồ Tách Đọc-Ghi (Read/Write Splitting)](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/read-and-write-separation-and-library-subtable/read-and-write-separation-76ca368e.png)

Thông thường chúng ta chọn mô hình một Master nhiều Replica (Single-Primary, Multi-Replica), tức một Database chính (Master) phụ trách ghi, các Database phụ (Replica) còn lại phụ trách đọc. Giữa Master và Replica sẽ đồng bộ dữ liệu để đảm bảo tính chính xác của dữ liệu trên Replica. Kiến trúc này khá dễ triển khai và cũng phù hợp với đặc trưng "ghi ít đọc nhiều" của phần lớn hệ thống.

### Triển khai Tách Đọc-Ghi như thế nào?

Dù sử dụng giải pháp triển khai cụ thể nào, việc thực hiện Tách Đọc-Ghi (Read/Write Splitting) nhìn chung bao gồm các bước sau:

1. Triển khai nhiều Database, chọn một trong số đó làm Master DB (Primary), một hoặc nhiều Database còn lại làm Replica DB (Slave).
2. Thiết lập quan hệ sao chép giữa Master DB và Replica DB — quá trình này thường gọi là **sao chép Master-Replica (Replication)**. Cần lưu ý rằng cơ chế sao chép mặc định của MySQL là bất đồng bộ (asynchronous), nên Replica thường sẽ trễ hơn Master một chút.
3. Hệ thống chuyển request ghi cho Master DB xử lý và chuyển request đọc cho Replica DB xử lý.

Khi áp dụng vào dự án thực tế, có hai cách triển khai phổ biến:

**1. Dùng tầng Proxy (Proxy-based)**

![Triển khai Tách Đọc-Ghi qua tầng Proxy](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/read-and-write-separation-and-library-subtable/read-and-write-separation-proxy-039454b6.png)

Chúng ta có thể đặt thêm một tầng Proxy giữa ứng dụng và Database. Mọi request dữ liệu từ ứng dụng đều đi qua Proxy; tầng Proxy chịu trách nhiệm phân tách request đọc/ghi và định tuyến chúng tới đúng Database tương ứng.

Các Middleware cung cấp tính năng tương tự gồm **MySQL Router** (chính chủ, thay thế cho MySQL Proxy), **ProxySQL**, **MaxScale**, **MyCat**... **Atlas** là giải pháp đời đầu dựa trên MySQL Proxy; khi chọn công nghệ cho dự án mới, cần chú ý kỹ trạng thái bảo trì, khả năng tương thích với các phiên bản MySQL mới và mức độ sôi động của cộng đồng.

Nói thêm một chút về MySQL Router: từ bản 8.2 trở đi, MySQL Router đã hỗ trợ Tách Đọc-Ghi trong suốt (transparent Read/Write Splitting) và tài liệu hiện tại vẫn duy trì tính năng này. Nó tự động định tuyến lưu lượng đọc tới instance chỉ đọc và lưu lượng ghi tới instance cho phép ghi, phía ứng dụng không cần tự phân loại SQL. Chi tiết có thể tham khảo blog chính thức: [MySQL 8.2 – transparent read/write splitting](https://blogs.oracle.com/mysql/post/mysql-82-transparent-readwrite-splitting) và tài liệu chính thức: [Read/Write Splitting](https://dev.mysql.com/doc/mysql-router/9.7/en/router-read-write-splitting.html).

Tuy nhiên, Tách Đọc-Ghi trong suốt không có nghĩa là mọi câu SQL đều có thể đẩy bừa cho Router. Các câu lệnh như `FOR UPDATE`, `LOCK IN SHARE MODE`, `GET_LOCK()` bắt buộc phải đi vào instance có quyền ghi; một số hàm hoặc câu lệnh trông có vẻ chỉ đọc nhưng có thể tạo ra tác dụng phụ ghi dữ liệu cũng có thể bị lỗi trên instance chỉ đọc. Trước khi đưa vào production, cần đối chiếu với danh sách statement được hỗ trợ chính thức và kiểm thử kỹ trên SQL thực tế của nghiệp vụ.

**2. Dùng thư viện/component tích hợp (Library-based)**

Theo cách này, chúng ta tích hợp thêm thư viện của bên thứ ba ngay trong ứng dụng để thực hiện định tuyến request đọc/ghi.

Nếu dự án dùng tech stack Java, **ShardingSphere-JDBC** là lựa chọn khá phổ biến — chỉ cần thêm file JAR phụ thuộc là dùng được ngay, chi phí vận hành cũng thấp hơn so với việc dựng một Proxy độc lập.

Bạn có thể xem [Cấu hình Tách Đọc-Ghi của ShardingSphere-JDBC](https://shardingsphere.apache.org/document/current/cn/features/readwrite-splitting/) trên tài liệu chính thức của ShardingSphere.

### Nguyên lý sao chép Master-Replica là gì?

File binlog (binary log — nhật ký nhị phân) của MySQL ghi lại toàn bộ thay đổi dữ liệu trong Database MySQL (mọi câu lệnh DDL và DML được thực thi). Vì vậy, chỉ cần dựa vào binlog của Master DB là chúng ta có thể đồng bộ dữ liệu từ Master sang Replica DB.

Trong phần dưới đây, để thuận tiện theo dõi các tài liệu cũ và mới, bài viết sẽ giữ cách gọi quen thuộc là Master/Replica (Master DB / Replica DB). Từ MySQL 8.0 trở đi, tài liệu chính thức của MySQL dần thay thế `master/slave` bằng `Source/Replica`: từ 8.0.22 khuyến nghị các bí danh mới như `START REPLICA`, từ 8.0.23 khuyến nghị các lệnh mới như `CHANGE REPLICATION SOURCE TO`, và đến MySQL 8.4 đã gỡ bỏ hoàn toàn các câu lệnh cũ như `START SLAVE`, `CHANGE MASTER TO`. Các script và chỉ số monitoring mới nên ưu tiên dùng tên gọi mới, ví dụ `SHOW REPLICA STATUS`, `replica_parallel_workers`, `rpl_semi_sync_source_wait_point`.

Quy trình cụ thể và chi tiết diễn ra như sau (hình lấy từ: [*MySQL Master-Slave Replication on the Same Machine*](https://www.toptal.com/mysql/mysql-master-slave-replication-tutorial)):

![Sao chép Master-Replica trong MySQL](/media/jg/ext/oss.javaguide.cn/java-guide-blog/78816271d3ab52424bfd5ad3086c1a0f-7d39cd0a.png)

1. Master DB ghi các thay đổi dữ liệu vào file binlog.
2. Replica DB kết nối tới Master DB và yêu cầu lấy các sự kiện cập nhật trong binlog.
3. Master DB tạo Thread `binlog dump` để gửi nội dung binlog sang cho Replica DB.
4. Thread `I/O receiver` của Replica DB tiếp nhận các sự kiện cập nhật và ghi vào file `relay log`.
5. Thread `applier` của Replica DB đọc `relay log` và áp dụng các sự kiện đó vào dữ liệu cục bộ. Nếu dùng `statement-based logging`, có thể hiểu là chạy lại (replay) các câu SQL; nếu dùng `row-based logging`, chủ yếu là áp dụng các sự kiện thay đổi từng dòng (row-change events).

Thông thường cứ hễ thấy `binlog` là bạn phải nghĩ ngay đến sao chép Master-Replica. Ngoài ra, binlog còn giúp chúng ta phục hồi dữ liệu (data recovery).

Mở rộng thêm một chút:

Không biết các bạn đã từng dùng công cụ mã nguồn mở **Canal** của Alibaba hay chưa. Công cụ này giúp đồng bộ dữ liệu giữa MySQL với các nguồn dữ liệu khác như Elasticsearch hoặc một Database MySQL khác. Rõ ràng nguyên lý cốt lõi bên dưới của nó chắc chắn cũng dựa vào binlog — Canal giả lập lại quy trình làm Replica của MySQL, phân tích binlog rồi đồng bộ dữ liệu sang các đích lưu trữ khác.

Ngoài ra, hệ thống Cache phân tán rất quen thuộc với chúng ta là Redis cũng thực hiện Tách Đọc-Ghi thông qua sao chép Master-Replica.

Tóm tắt ngắn gọn:

**Sao chép Master-Replica của MySQL dựa vào binlog. Ngoài ra, các công cụ phổ biến dùng để đồng bộ dữ liệu MySQL sang nguồn dữ liệu khác (như Canal) bên dưới nhìn chung cũng dựa vào binlog.**

### Làm thế nào để tránh đọc phải dữ liệu cũ trên Replica?

Tách Đọc-Ghi giúp tăng khả năng xử lý đọc đồng thời, nhưng cũng kéo theo một vấn đề: dữ liệu giữa Master và Replica có độ trễ. Chẳng hạn sau khi ghi xong vào Master, việc đồng bộ dữ liệu sang Replica cần một khoảng thời gian, khoảng chênh lệch này dẫn tới dữ liệu giữa Master và Replica tạm thời không nhất quán — gọi là **độ trễ đồng bộ (Replication Lag)**.

Ứng dụng thường không thể triệt tiêu bản thân độ trễ sao chép, mà chỉ có thể tránh định tuyến các request đòi hỏi nhất quán mạnh (strong consistency) tới Replica đang bị trễ. Nếu kịch bản nghiệp vụ không chấp nhận đọc dữ liệu cũ, có thể tham khảo vài cách sau.

Khi dùng Tách Đọc-Ghi cũng cần đặc biệt chú ý ranh giới Transaction và chuỗi xử lý request. Trong cùng một Transaction nghiệp vụ, nếu có thao tác ghi trước rồi đọc sau thì các lần đọc tiếp theo nên đi tiếp vào Master, tuyệt đối không để Proxy hay Middleware định tuyến sang Replica — nếu không sẽ gặp lỗi "dữ liệu mình vừa ghi xong mà tự mình đọc lại không thấy". Với các kịch bản *read-your-writes* như trạng thái đăng nhập, trạng thái thanh toán hay xem chi tiết đơn hàng ngay sau khi tạo đơn, có thể căn cứ vào Session người dùng, Request Chain hoặc cờ nghiệp vụ để tạm thời ép đọc Master trong một khoảng thời gian ngắn.

#### Ép request đọc định tuyến vào Master DB xử lý

Đối với số ít nghiệp vụ bắt buộc phải nhất quán mạnh (ví dụ kiểm tra số dư ngay sau khi thanh toán xong), có thể dùng Hint để ép đọc trực tiếp từ Master:

```java
try (HintManager hintManager = HintManager.getInstance()) {
    hintManager.setWriteRouteOnly();
    // Tiếp tục các thao tác JDBC
}
```

> ShardingSphere 5.x dùng `setWriteRouteOnly()`; các bản 4.x cũ hơn dùng `setMasterRouteOnly()`, cần điều chỉnh code mẫu theo phiên bản thực tế đang dùng.

> **Lưu ý**: Tuyệt đối không lạm dụng cách này trên diện rộng! Mục đích ban đầu của Tách Đọc-Ghi là san sẻ áp lực đọc cho Master; nếu quá nhiều request đọc quay về Master vì sợ độ trễ, trong các đợt flash sale hay khuyến mãi lưu lượng cao, Master rất dễ bị đánh sập. Cách đánh đổi hợp lý hơn là: chỉ những luồng cốt lõi đòi hỏi nhất quán mạnh mới đọc Master, còn các luồng không cốt lõi thì chấp nhận nhất quán cuối cùng (Eventual Consistency) ở tầng nghiệp vụ (ví dụ hiển thị trên giao diện "Dữ liệu đang đồng bộ").

Với phương án này, chỉ những request đọc bắt buộc phải lấy dữ liệu mới nhất mới được giao cho Master DB xử lý.

#### Đọc trễ (Delayed Read)

Một số bạn có thể nghĩ: đã biết sao chép có độ trễ thì cứ đợi qua độ trễ rồi hãy đọc. Ví dụ độ trễ đồng bộ là 0.5s thì đợi 1s sau mới đọc dữ liệu. Ý tưởng này nghe đơn giản nhưng không đáng tin cậy.

Tuy vậy, nếu thiết kế khéo léo trong luồng trải nghiệm nghiệp vụ thì lại rất ổn: đối với các thao tác nhạy cảm dữ liệu, ngay sau khi ghi xong hãy tránh kích hoạt truy vấn đọc lập tức. Ví dụ sau khi thanh toán thành công, chuyển hướng sang trang "Thanh toán thành công", đến khi người dùng bấm quay lại mới tải lại thông tin tài khoản.

#### Chờ Replica đuổi kịp vị trí chỉ định

Nếu dùng GTID, sau khi ghi thành công có thể lấy GTID của Transaction đó, rồi gọi `WAIT_FOR_EXECUTED_GTID_SET(gtid_set, timeout)` trên Replica để chờ Replica áp dụng xong đến mốc đó rồi mới đọc. Tương tự, `SOURCE_POS_WAIT()` có thể chờ Replica đọc và áp dụng đến một vị trí binlog nhất định.

Cách này giúp "chờ Replica đuổi kịp trước khi đọc", nhưng làm tăng độ trễ đọc và độ phức tạp triển khai, không phù hợp cho mọi request tần suất cao. Với các luồng cốt lõi tải cao, cách làm phổ biến hơn vẫn là đọc Master trong thời gian ngắn sau khi ghi, hoặc định tuyến *read-your-writes* theo session/user.

#### Tóm tắt

Chúng ta vừa điểm qua ba giải pháp tránh đọc dữ liệu cũ từ Replica. Thực tế, phương án đọc trễ không thể loại bỏ hoàn toàn dữ liệu cũ mà chỉ giảm xác suất gặp phải, nên ít khi được dùng làm giải pháp chính trong dự án thật.

Nhìn chung, để ngăn request đọc nhất quán mạnh lấy nhầm dữ liệu cũ, vẫn phải ép các request cần dữ liệu mới nhất đi thẳng vào Master DB. Nếu phần lớn kịch bản trong dự án không đòi hỏi độ chính xác tức thời tuyệt đối, hãy để các luồng phụ chấp nhận nhất quán cuối cùng.

Replica cũng không phải tài nguyên đọc "miễn phí". Các báo cáo phức tạp, quét toàn bảng (full table scan), phân trang sâu (deep pagination) và slow SQL đổ vào Replica sẽ cản trở Thread `applier` thực thi, ngược lại càng làm trầm trọng thêm độ trễ giữa Master và Replica. Ngay cả sau khi đã Tách Đọc-Ghi, vẫn phải kiểm soát tốt slow SQL, Index, Connection Pool và lưu lượng xuất báo cáo.

### Trong tình huống nào xảy ra Replication Lag? Làm sao giảm thiểu độ trễ?

Ở trên chúng ta đã nhắc đến độ trễ sao chép (Replication Lag) và cách né đọc dữ liệu cũ; dưới đây hãy phân tích kỹ nguyên nhân gây ra Replication Lag và cách giảm thiểu tối đa.

Muốn biết khi nào xảy ra độ trễ, trước tiên cần hiểu rõ bản chất của nó.

Độ trễ đồng bộ Master-Replica của MySQL là tình trạng dữ liệu trên Replica bị chậm hơn so với Master, thường xuất phát từ hai nguyên nhân:

1. Tốc độ Thread I/O của Replica nhận binlog không theo kịp tốc độ ghi binlog của Master, khiến `relay log` của Replica bị trễ so với `binlog` của Master.
2. Tốc độ Thread `applier` của Replica thực thi `relay log` không theo kịp tốc độ nhận binlog của Thread `I/O receiver`, khiến dữ liệu trên Replica bị trễ so với chính `relay log` của nó.

Quá trình đồng bộ Master-Replica có 3 mốc thời gian chính:

1. Master DB thực thi xong một Transaction và ghi vào binlog, gọi thời điểm này là `T1`.
2. Thread `I/O receiver` của Replica nhận được binlog và ghi vào `relay log`, gọi thời điểm này là `T2`.
3. Thread `applier` của Replica đọc `relay log` và áp dụng cục bộ, gọi thời điểm này là `T3`.

> **Lưu ý**: Mô tả trên dựa trên chế độ **sao chép bất đồng bộ (Asynchronous Replication)** mặc định của MySQL. Nếu bật sao chép bán đồng bộ (Semi-sync) và cấu hình `rpl_semi_sync_source_wait_point=AFTER_SYNC`, Master sau khi ghi và sync binlog sẽ đợi ít nhất một Replica xác nhận đã nhận được các sự kiện Transaction rồi mới commit vào Storage Engine và trả về cho Client. Điều này tăng độ an toàn dữ liệu khi Failover, nhưng không đồng nghĩa với việc Replica đã thực thi xong dữ liệu đó.

Kết hợp với nguyên lý sao chép đã trình bày ở trên, ta rút ra được:

- Chênh lệch `T2 - T1` phản ánh hiệu năng của Thread `I/O receiver` trên Replica và hiệu quả truyền mạng; hiệu số này càng nhỏ chứng tỏ hiệu năng nhận I/O và mạng càng tốt.
- Chênh lệch `T3 - T2` phản ánh tốc độ thực thi của Thread `applier` trên Replica; hiệu số này càng nhỏ chứng tỏ Replica áp dụng thay đổi càng nhanh.

Vậy những tình huống nào hay gây ra Replication Lag? Dưới đây là các nguyên nhân phổ biến:

1. **Cấu hình máy Replica yếu hơn Master**: Tốc độ nhận binlog, ghi relay log và áp dụng relay log trên Replica sẽ chậm (tức `T2 - T1` và `T3 - T2` đều lớn), dẫn tới độ trễ. Cách khắc phục là chọn máy Replica có cấu hình ngang bằng hoặc mạnh hơn Master, hoặc tối ưu hiệu năng cho Replica (chỉnh tham số, tăng bộ nhớ đệm/Cache, dùng ổ SSD...).
2. **Replica xử lý quá nhiều request đọc**: Replica vừa phải chạy toàn bộ thao tác ghi từ Master, vừa phải phục vụ request đọc. Nếu lưu lượng đọc quá lớn, CPU, bộ nhớ, mạng trên Replica bị chiếm dụng nặng, làm chậm tiến độ sao chép (`T2 - T1` và `T3 - T2` đều tăng). Cách khắc phục là đưa Cache vào (khuyến nghị), dùng kiến trúc 1 Master nhiều Replica để chia tải đọc, hoặc đẩy bớt nhu cầu truy vấn sang hệ thống khác bằng cách stream binlog sang Hadoop, Elasticsearch...
3. **Transaction lớn (Large Transaction)**: Những Transaction chạy quá lâu mới commit gọi là Transaction lớn. Do thời gian chạy dài — và trên Replica thường tốn thời gian, tài nguyên hơn cả trên Master — chúng rất dễ gây độ trễ sao chép. Giải pháp là tránh sửa/xóa dữ liệu hàng loạt quá lớn trong một Transaction mà hãy chia nhỏ thành từng batch. Tương tự, các câu slow SQL chạy quá lâu cũng cần được tối ưu trong dự án thực tế.
4. **Quá nhiều Replica**: Master phải đồng bộ binlog tới tất cả các Replica; nếu số lượng Replica quá nhiều sẽ làm tăng thời gian và chi phí đồng bộ của Master (`T2 - T1` lớn lên do áp lực đẩy dữ liệu từ Master). Giải pháp là giảm bớt số lượng Replica trực tiếp, hoặc phân tầng Replica (Replication phân cấp) để Replica tầng trên đồng bộ tiếp xuống Replica tầng dưới nhằm giảm tải cho Master.
5. **Độ trễ mạng (Network Latency)**: Tốc độ mạng giữa Master và Replica chậm, mất gói (packet loss) hoặc chập chờn (jitter) sẽ ảnh hưởng trực tiếp tới tốc độ truyền binlog. Giải pháp là tối ưu hạ tầng mạng (tăng băng thông, giảm latency, tăng độ ổn định).
6. **Sao chép đơn luồng (Single-threaded Replication)**: Từ MySQL 5.5 trở về trước chỉ hỗ trợ sao chép đơn luồng. Để cải thiện hiệu năng, MySQL 5.6 giới thiệu **sao chép đa luồng (Multi-threaded Replication)** nhưng chỉ song song theo từng database (schema). MySQL 5.7 tiếp tục cải tiến, hỗ trợ chạy song song theo nhóm commit (Group Commit). Từ MySQL 8.0.22 trở đi, có thể dùng tham số mới `replica_parallel_workers > 0` để bật applier đa luồng kết hợp cùng chiến lược như `replica_parallel_type=LOGICAL_CLOCK` nhằm nâng cao khả năng áp dụng song song.
7. **Chế độ sao chép**: Mặc định của MySQL là sao chép bất đồng bộ nên tất yếu tồn tại độ trễ. Sao chép đồng bộ hoàn toàn (Full Sync) không có độ trễ nhưng hiệu năng ghi quá kém. Sao chép bán đồng bộ (Semi-sync) là phương án dung hòa; so với bất đồng bộ, Semi-sync chủ yếu giải quyết tính an toàn dữ liệu chứ không triệt tiêu hoàn toàn độ trễ đọc. Nó giúp Master đợi ít nhất một Replica nhận được sự kiện Transaction trước khi báo commit thành công, nhưng Replica đã chạy xong sự kiện đó chưa vẫn phụ thuộc vào tiến độ `applier`. Do đó Semi-sync không đảm bảo chắc chắn "vừa ghi xong đọc ngay trên Replica sẽ ra giá trị mới nhất". Từ MySQL 5.5, MySQL hỗ trợ **Semi-sync Replication** dạng plugin, và MySQL 5.7 bổ sung **Enhanced Semi-sync Replication**.
8. V.v...

## Phân mảnh & Chia bảng (Sharding)

Tách Đọc-Ghi chủ yếu giải quyết bài toán đọc đồng thời chứ không giải quyết được vấn đề dung lượng lưu trữ của Database. Hãy thử nghĩ xem: **Nếu một bảng trong MySQL có lượng dữ liệu quá lớn thì phải làm sao?**

Nói cách khác, **chúng ta giải quyết áp lực lưu trữ của MySQL như thế nào?**

Một trong những câu trả lời chính là **Phân mảnh & Chia bảng (Sharding)**.

Trước khi quyết định Phân mảnh & Chia bảng (Sharding), hãy kiểm tra kỹ những điều sau:

1. Slow SQL, Index, phân trang, Cache và Tách Đọc-Ghi đã được tối ưu hết mức chưa?
2. Số dòng của một bảng, dung lượng một Database, số lượng kết nối hay QPS ghi có thực sự đang tiệm cận giới hạn vật lý chưa?
3. Các truy vấn cốt lõi có thể được bao phủ bởi một Sharding Key ổn định hay không?
4. Nghiệp vụ có chấp nhận được độ phức tạp phát sinh từ truy vấn liên shard, Distributed Transaction và di chuyển dữ liệu (migration) hay không?

Phân mảnh & Chia bảng (Sharding) không phải bước đầu tiên trong tối ưu Database, mà là giải pháp mở rộng dung lượng khi các biện pháp tối ưu thông thường đã chạm trần.

### Phân mảnh Database (Database Sharding) là gì?

**Phân mảnh Database** là việc chia tách dữ liệu trong một Database ra nhiều Database khác nhau; có thể chia dọc (Vertical) hoặc chia ngang (Horizontal).

**Chia dọc Database (Vertical Database Splitting)** là phân chia một Database đơn lẻ theo từng mảng nghiệp vụ, mỗi nghiệp vụ dùng một Database riêng, qua đó san sẻ áp lực của một Database ra nhiều Database.

Ví dụ: tách riêng bảng user, bảng đơn hàng và bảng sản phẩm trong cùng một Database thành User DB, Order DB và Product DB.

![Chia dọc Database](/media/jg/local/high-performance/images/read-and-write-separation-and-library-subtable/vertical-slicing-database-07c2a1.png)

**Chia ngang Database (Horizontal Database Splitting)** là tách dữ liệu của cùng một bảng theo một quy tắc nhất định vào các Database khác nhau; mỗi Database có thể nằm trên một server riêng biệt, từ đó mở rộng theo chiều ngang (Horizontal Scaling) và giải quyết điểm nghẽn về lưu trữ cũng như hiệu năng của một bảng đơn lẻ.

Ví dụ: bảng đơn hàng quá lớn, bạn tách ngang (Horizontal Table Splitting) bảng đơn hàng thành 2 bảng rồi đặt 2 bảng đó vào 2 Database khác nhau.

![Chia ngang Database](/media/jg/local/high-performance/images/read-and-write-separation-and-library-subtable/horizontal-slicing-database-008377.png)

Trong dự án thực tế, chia ngang Database thường đi kèm với chia ngang bảng: trước hết tách một bảng logic theo từng dòng thành nhiều bảng vật lý, rồi phân bố các bảng vật lý này lên nhiều instance Database khác nhau.

### Chia bảng (Table Sharding) là gì?

**Chia bảng** là việc chia nhỏ dữ liệu của một bảng đơn lẻ, có thể chia theo chiều dọc (cột) hoặc chiều ngang (dòng).

**Chia dọc bảng (Vertical Table Splitting)** là chia tách theo cột của bảng, tách một bảng có quá nhiều cột thành nhiều bảng nhỏ hơn.

Ví dụ: chúng ta có thể tách một số cột ít dùng hoặc dung lượng lớn từ bảng thông tin người dùng ra thành một bảng riêng.

**Chia ngang bảng (Horizontal Table Splitting)** là chia tách theo dòng của bảng, tách một bảng có quá nhiều dòng thành nhiều bảng nhằm giải quyết vấn đề hiệu năng khi dữ liệu một bảng quá lớn.

Ví dụ: tách bảng thông tin người dùng thành nhiều bảng thông tin người dùng để tránh một bảng phình quá to làm chậm truy vấn.

Chia ngang bảng đơn thuần chỉ giải quyết kích thước của từng bảng; để tăng hiệu năng toàn diện, chúng ta thường đặt các bảng sau khi chia lên nhiều Database khác nhau. Tức là chia ngang bảng thường xuất hiện song hành cùng chia ngang Database.

![Chia bảng](/media/jg/local/high-performance/images/read-and-write-separation-and-library-subtable/two-forms-of-sub-table-9b4cb5.png)

### Khi nào cần Phân mảnh & Chia bảng (Sharding)?

Có thể cân nhắc Phân mảnh & Chia bảng (Sharding) khi gặp các tình huống sau:

- Dữ liệu một bảng đạt tới hàng chục triệu dòng trở lên (ngưỡng cụ thể phụ thuộc vào độ phức tạp cấu trúc bảng, số lượng Index, cấu hình phần cứng...) và tốc độ đọc/ghi Database bắt đầu chậm lại.
- Dung lượng lưu trữ dữ liệu ngày càng phình to, thời gian sao lưu (backup) kéo dài quá lâu.
- Lưu lượng truy cập đồng thời quá lớn (nhưng luôn nên ưu tiên các biện pháp tối ưu hiệu năng khác trước khi tính đến Sharding).

Tuy nhiên, chi phí của Phân mảnh & Chia bảng (Sharding) rất cao, nếu không thực sự cần thiết thì hạn chế tối đa việc áp dụng. Cũng không có chuyện cứ chạm mốc chục triệu dòng là bắt buộc phải chia bảng; mỗi bảng có số cột và kích thước dòng khác nhau, ngưỡng dữ liệu tối đa vẫn đảm bảo hiệu năng chấp nhận được cũng khác nhau, cần phân tích theo tình huống cụ thể.

Nếu điểm nghẽn hiệu năng chủ yếu đến từ slow SQL, thiết kế Index hay kiểu dữ liệu thời gian, thông thường nên tối ưu MySQL cơ bản trước khi cân nhắc Sharding:

- Phân tích Execution Plan trong MySQL: [https://javaguide.cn/database/mysql/mysql-query-execution-plan.html](https://javaguide.cn/database/mysql/mysql-query-execution-plan.html)
- Giải thích chi tiết Index trong MySQL: [https://javaguide.cn/database/mysql/mysql-index.html](https://javaguide.cn/database/mysql/mysql-index.html)
- Tổng hợp các trường hợp Index MySQL bị vô hiệu hóa: [https://javaguide.cn/database/mysql/mysql-index-invalidation.html](https://javaguide.cn/database/mysql/mysql-index-invalidation.html)
- Gợi ý lưu trữ kiểu dữ liệu thời gian trong MySQL: [https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html](https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html)

Trước đây tôi từng đọc một bài viết rất hay phân tích "[Một cây B+ cao 3 tầng trong InnoDB lưu tối đa bao nhiêu dữ liệu](https://juejin.cn/post/7165689453124517896)", bạn nào quan tâm có thể đọc thêm.

### Các thuật toán Sharding phổ biến là gì?

Thuật toán Sharding chủ yếu giải quyết câu hỏi: sau khi dữ liệu được phân mảnh theo chiều ngang, bản ghi cụ thể phải được lưu vào bảng nào.

Các thuật toán Sharding phổ biến gồm:

- **Hash Sharding (Phân mảnh theo hàm băm)**: Tính giá trị hash của Sharding Key chỉ định, sau đó dựa vào giá trị hash để xác định bảng lưu trữ. Hash Sharding phù hợp với các kịch bản đọc/ghi ngẫu nhiên, nhưng không phù hợp khi thường xuyên cần truy vấn theo khoảng (range query). Cách này giúp dữ liệu phân bố khá đều giữa các bảng, nhưng rất bất tiện khi mở rộng/thu hẹp động (như thêm một bảng hoặc thêm một Database mới).
- **Range Sharding (Phân mảnh theo khoảng)**: Phân bổ dữ liệu theo các khoảng giá trị xác định (như khoảng thời gian, khoảng ID), chẳng hạn đưa các bản ghi có `id` từ `1~299999` vào bảng thứ nhất, `300000~599999` vào bảng thứ hai. Range Sharding phù hợp với các kịch bản thường xuyên truy vấn theo khoảng và dữ liệu phân bổ đều, nhưng kém phù hợp với đọc/ghi ngẫu nhiên (dữ liệu mới đổ dồn vào khoảng cuối nên dễ tạo điểm nóng dữ liệu / hotspot).
- **Consistent Hashing Sharding (Băm nhất quán)**: Tổ chức không gian băm thành một vòng tròn (Hash Ring), ánh xạ cả Sharding Key lẫn node (Database hoặc bảng) lên vòng tròn đó rồi xác định theo chiều kim đồng hồ xem dữ liệu/request thuộc về node nào, qua đó giảm nhẹ nhược điểm khi mở rộng của Hash truyền thống. Consistent Hashing phù hợp hơn với mô hình KV hoặc Cache; trong Phân mảnh & Chia bảng cho Database quan hệ thực tế ít được dùng, vì truy vấn theo khoảng, Distributed Transaction và Secondary Index vẫn phải thiết kế riêng.

Trên nền tảng các thuật toán cơ bản trên, có thể kết hợp với nghiệp vụ để mở rộng thành các chiến lược định tuyến phức tạp hơn:

- **Định tuyến bằng bảng ánh xạ (Mapping Table Routing)**: Duy trì một bảng định tuyến độc lập ghi lại ánh xạ giữa Sharding Key và node dữ liệu; linh hoạt nhưng phải bảo trì thêm một bộ dữ liệu định tuyến. Bản thân bảng định tuyến này cũng phải tính đến Cache, tính nhất quán, mở rộng và High Availability, nếu không nó sẽ trở thành điểm nghẽn hoặc điểm lỗi đơn (SPOF) mới.
- **Định tuyến theo vùng địa lý (Geo/Region Routing)**: Lấy vị trí địa lý làm Sharding Key, kết hợp cơ chế khoảng hoặc bảng ánh xạ để lưu dữ liệu tại Data Center gần người dùng nhất (thường gặp trong kiến trúc Multi-Active của NewSQL).

### Chọn Sharding Key như thế nào?

**Sharding Key** (khóa phân mảnh) là trường dữ liệu then chốt quyết định sự phân bố dữ liệu và hiệu quả truy vấn. Thông thường, một Sharding Key nên có các đặc điểm sau:

- **Tính phổ quát (Commonality)**: Bao phủ được đại đa số kịch bản truy vấn, giảm tối đa số lượng shard mà một câu truy vấn phải chạm tới, từ đó giảm tải cho Database.
- **Tính phân tán (Dispersion)**: Phân bổ dữ liệu đồng đều ra các shard, tránh lệch dữ liệu (data skew) và điểm nóng (hotspot).
- **Tính ổn định (Stability)**: Giá trị của Sharding Key không bị thay đổi, tránh phải di chuyển dữ liệu qua lại và phát sinh vấn đề nhất quán.
- **Tính mở rộng (Extensibility)**: Hỗ trợ tăng/giảm số lượng shard linh hoạt, giảm chi phí chia lại dữ liệu (resharding).

Trong dự án thực tế, rất khó để một Sharding Key thỏa mãn toàn bộ các tiêu chí trên cùng lúc, nên buộc phải cân nhắc đánh đổi. Một số nghiệp vụ sẽ nhúng luôn mã phân mảnh logic vào trong ID nghiệp vụ — chẳng hạn giữ một đoạn `buyer_route` bên trong Order ID, để khi chỉ có Order ID cũng suy ra được tuyến định tuyến. Tuy nhiên, không khuyến nghị lấy thẳng vài chữ số cuối của User ID làm khóa định tuyến: nếu User ID sinh từ Snowflake, dải tự tăng hoặc thuật toán có quy luật, các bit cuối chưa chắc đã phân bố đều — thông thường nên băm (hash) trước rồi mới chia lấy dư (modulo).

Có thể tham khảo gợi ý chọn Sharding Key cho các nghiệp vụ phổ biến sau:

| Kịch bản nghiệp vụ | Sharding Key ứng viên         | Lưu ý                                                                          |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------ |
| Hệ thống đơn hàng  | User ID, Merchant ID, Order ID | Tùy đường dẫn truy vấn chính; luồng người mua và người bán xem đơn dễ xung đột |
| Nhắn tin IM        | Conversation ID, User ID      | Cần đánh giá kỹ thứ tự tin nhắn trong hội thoại và các nhóm chat quá đông (hotspot) |
| Hệ thống Multi-Tenant | Tenant ID                  | Tenant lớn dễ thành hotspot, cần tách riêng cho các tenant lớn                 |
| Giao dịch thanh toán | User ID, Transaction ID      | Luồng truy vấn nhất quán mạnh và đối soát (reconciliation) phải thiết kế từ đầu |

Nếu một nghiệp vụ tự nhiên tồn tại nhiều đường dẫn truy vấn tần suất cao khác nhau, có thể cân nhắc lưu dư thừa thêm một bản dữ liệu phục vụ chiều truy vấn kia, hoặc đẩy một phần nhu cầu tìm kiếm sang Search Engine, bảng rộng (wide table) hay hệ thống báo cáo — thay vì gượng ép một Sharding Key duy nhất gánh hết mọi truy vấn.

Số lượng shard cũng không nên chỉ nhìn vào lượng dữ liệu hiện tại. Quá ít shard vật lý thì sau này phải mở rộng liên tục; quá nhiều shard vật lý lại làm tăng số lượng kết nối, chi phí định tuyến, truy vấn tổng hợp và vận hành. Cách làm phổ biến là thiết kế sẵn nhiều shard logic — ví dụ 512 hoặc 1024 bucket — rồi ánh xạ nhiều bucket vào một số ít Database/bảng vật lý. Khi cần mở rộng, chỉ cần di chuyển ánh xạ của một số bucket thay vì sửa quy tắc chia lấy dư ở tầng nghiệp vụ.

Hãy lấy bài toán bảng đơn hàng làm ví dụ cụ thể.

Bảng đơn hàng là ví dụ rất kinh điển trong Phân mảnh & Chia bảng (Sharding), bởi tự thân nó có nhiều chiều truy vấn:

- **Chiều người dùng**: Người dùng xem danh sách đơn hàng, chi tiết đơn hàng, lịch sử hậu mãi của mình — điều kiện phổ biến là `buyer_id + create_time/status`.
- **Chiều đơn hàng**: Tra cứu chi tiết đơn hàng qua `order_id`, xử lý callback thanh toán, định vị đơn khiếu nại/hoàn trả.
- **Chiều người bán (Merchant)**: Trang quản trị shop xem danh sách đơn hàng, lọc theo trạng thái, xuất danh sách đơn hàng trong khoảng thời gian gần đây.

Phần lớn hệ thống đơn hàng sẽ ưu tiên chiều danh sách đơn hàng của người dùng, thay vì chỉ shard thuần theo `order_id`. Điểm đánh đổi nằm ở hình thái truy vấn: xem chi tiết đơn hàng là truy vấn điểm (point query), còn danh sách đơn hàng của người dùng là truy vấn theo khoảng (range query) tần suất cực cao. Nếu băm theo `order_id`, đơn hàng của cùng một người dùng sẽ bị rải ra rất nhiều shard, khiến việc phân trang, sắp xếp và lọc dữ liệu đều phải chạy xuyên nhiều shard.

Khi shard theo `buyer_id`, logic định tuyến có thể tính như sau:

```text
slot = hash(buyer_id) % (db_count * table_count)
db_index = slot / table_count
// Lưu ý: ở đây chia cho số lượng bảng trên mỗi database, không phải chia cho số lượng database
table_index = slot % table_count
```

Chỗ rất dễ viết sai ở đây là `db_index`: phải lấy `slot` chia cho số lượng bảng trong mỗi Database trước để ra chỉ số Database, sau đó mới chia lấy dư cho số bảng để ra chỉ số bảng.

Chỉ shard theo `buyer_id` vẫn chưa đủ. Khi cần truy vấn theo `order_id`, có hai cách làm phổ biến: duy trì một bảng ánh xạ `order_id -> buyer_route`, hoặc nhúng sẵn `buyer_route` vào các vị trí cố định trong `order_id`. Cách đầu tốn thêm một lần truy vấn và một bảng lưu trữ, còn cách sau đòi hỏi phải thiết kế cố định cấu trúc sinh Order ID ngay từ đầu.

Chiều người bán (Merchant) cũng phải xử lý riêng. Trong mô hình B2C, người bán và người mua thường là quan hệ nhiều-nhiều, nên không thể dựa vào việc nhúng route của người mua vào Order ID để giải quyết truy vấn của người bán. Nếu trang quản trị người bán chỉ truy vấn tần suất thấp, có thể giới hạn khoảng thời gian rồi đẩy sang Elasticsearch, ClickHouse hoặc bảng rộng; nếu là luồng cốt lõi tần suất cao, thường phải dựng thêm một bảng chỉ mục đơn hàng của người bán shard theo `seller_id`, hoặc đồng bộ dư thừa một Read Model riêng cho người bán.

Bảng đơn hàng chính và bảng chi tiết đơn hàng nên dùng chung một bộ quy tắc định tuyến. Chẳng hạn `t_order` và `t_order_item` đều shard theo `buyer_route`, như vậy lúc tạo đơn và truy vấn chi tiết đơn hàng sẽ rơi vào cùng một shard. Trong ShardingSphere có thể cấu hình **Binding Table** cho kịch bản này, nhưng có điều kiện tiên quyết rất rõ ràng: các bảng trong cùng nhóm phải dùng quy tắc shard giống hệt nhau, VÀ điều kiện JOIN trong SQL phải chứa Sharding Key. Nếu chỉ cấu hình Binding Table mà câu SQL không có điều kiện Sharding Key thì vẫn có thể xảy ra định tuyến liên shard.

### Phân mảnh & Chia bảng (Sharding) sẽ kéo theo những vấn đề gì?

Hãy nhớ rằng: mọi quyết định kỹ thuật bạn đưa ra tại công ty không chỉ xét xem công nghệ đó có đáp ứng yêu cầu và phù hợp với bối cảnh nghiệp vụ hiện tại hay không, mà còn phải cân nhắc kỹ **chi phí** mà nó mang lại.

Sau khi áp dụng Phân mảnh & Chia bảng (Sharding), hệ thống sẽ đối mặt với những thách thức sau:

- **Thao tác JOIN**: Cần phân biệt giữa JOIN trong cùng một Database và JOIN liên shard. Trong phạm vi một Database đơn lẻ, nếu có Index và Execution Plan hợp lý thì JOIN là năng lực cơ bản của Database quan hệ, không nên phủ nhận cực đoan. Cái khó sau khi Sharding là **JOIN liên shard**: dữ liệu nằm rải rác trên nhiều Database và bảng, Middleware phải broadcast, định tuyến, gộp kết quả thậm chí tổ hợp tích Đề-các (Cartesian), làm hiệu năng giảm và độ phức tạp tăng vọt. Với những chỗ cần JOIN liên shard, có thể tách thành nhiều lần truy vấn rồi ghép dữ liệu ở tầng ứng dụng, nhưng cần lưu ý yêu cầu nhất quán giữa các lần truy vấn đó.
- **Vấn đề Transaction**: Khi các bảng vốn nằm cùng một Database bị tách sang nhiều Database khác nhau, nếu một thao tác đụng đến nhiều Database thì Transaction tích hợp sẵn của từng Database không còn đáp ứng được nữa. Lúc này phải đưa **Distributed Transaction (giao dịch phân tán)** vào hệ thống. Bạn có thể xem tổng hợp các giải pháp Distributed Transaction phổ biến tại: <https://javaguide.cn/distributed-system/distributed-transaction.html>.
- **Distributed ID**: Sau khi phân mảnh Database ra nhiều server khác nhau, khóa chính tự tăng (Auto-increment Primary Key) của từng Database không thể đảm bảo tính duy nhất trên toàn hệ thống. Làm sao để sinh khóa chính duy nhất toàn cục (globally unique) cho các node dữ liệu? Lúc này cần dùng tới **Distributed ID**. Để tìm hiểu chi tiết và các phương án triển khai, xem bài viết: [Giới thiệu & Tổng hợp giải pháp Distributed ID](https://javaguide.cn/distributed-system/distributed-id.html).
- **Vấn đề ràng buộc duy nhất toàn cục (Global Unique Constraint)**: Unique Index của một Database chỉ đảm bảo tính duy nhất bên trong một shard. Chẳng hạn số điện thoại, tên đăng nhập, mã đơn hàng của shop nếu không được chọn làm Sharding Key thì Database rất khó tự đảm bảo duy nhất toàn cục. Cách xử lý thường gặp là dựng bảng Unique Index toàn cục, dùng dịch vụ đăng ký nghiệp vụ để giữ chỗ trước (pre-reservation), hoặc điều chỉnh lại Sharding Key và thiết kế ràng buộc nghiệp vụ.
- **Truy vấn không có Sharding Key**: Nếu điều kiện truy vấn thiếu Sharding Key, Middleware không thể biết phải vào shard nào, thường chỉ còn cách broadcast câu SQL tới toàn bộ các shard rồi gộp kết quả. Khi số lượng shard còn ít thì tạm chấp nhận được, nhưng khi số shard lớn lên, hiện tượng khuếch đại đọc (Read Amplification) sẽ kéo chậm luồng cốt lõi. Giải pháp thường gặp là bổ sung bảng định tuyến, bảng chỉ mục dư thừa, hoặc đẩy nhu cầu tìm kiếm quản trị sang Search Engine, bảng rộng hay hệ thống báo cáo.
- **Vấn đề tổng hợp và phân trang liên Database**: Phân mảnh & Chia bảng khiến các thao tác tổng hợp thông thường như `GROUP BY`, `ORDER BY` trở nên cực kỳ phức tạp, vì phải gom và sắp xếp kết quả trên nhiều shard thay vì chỉ một Database. Phân trang liên shard cũng rất gian nan — ví dụ truy vấn trang 1000, mỗi shard có thể phải trả về toàn bộ N trang dữ liệu ứng viên đầu tiên để Middleware gộp lại, sắp xếp rồi mới cắt lấy trang mục tiêu; càng nhiều shard thì hệ số khuếch đại càng lớn. Các truy vấn quản trị có tập kết quả lớn phù hợp hơn với Search Engine, bảng rộng hoặc hệ thống báo cáo offline.
- **Khó khăn khi mở rộng/thu hẹp động (Resharding)**: Đặc biệt với thuật toán Hash chia lấy dư truyền thống, khi mở rộng từ `hash(key) % 32` lên `hash(key) % 64`, ánh xạ vị trí của phần lớn dữ liệu cũ đều bị thay đổi. Cách chắc chắn hơn là cố định sẵn một tập shard logic — ví dụ 1024 bucket — rồi duy trì ánh xạ `bucket -> Database/bảng vật lý`; khi mở rộng chỉ cần chuyển bớt một số bucket chứ không gắn cứng ID nghiệp vụ vào số lượng bảng vật lý. Ngoài ra có thể dùng Consistent Hashing, hoặc chuyển sang dùng các Database phân tán hỗ trợ tự động Rebalance (như TiDB).
- **Chi phí vận hành và thay đổi cấu trúc**: Sau khi Sharding, việc thay đổi DDL, chỉnh sửa Index, backup dữ liệu, sửa dữ liệu sai lệch (data correction), định vị sự cố và đánh giá dung lượng đều phải bao phủ hàng loạt Database và bảng. Trước khi lên production, cần chuẩn bị công cụ chạy thay đổi hàng loạt, phương án Rollback và hệ thống giám sát tới từng shard, nếu không chi phí bảo trì về sau sẽ rất cao.
- V.v...

Ngoài ra, sau khi đưa Phân mảnh & Chia bảng (Sharding) vào hệ thống, thường cần sự tham gia của DBA và phải thuê/mua thêm nhiều server Database hơn — tất cả đều tính vào chi phí.

### Có giải pháp nào được khuyến nghị cho Phân mảnh & Chia bảng (Sharding) không?

Apache ShardingSphere là một hệ sinh thái Database phân tán, giúp cung cấp khả năng phân mảnh, co giãn linh hoạt, mã hóa... ngay trên nền các Database hiện có.

Dự án ShardingSphere do Dangdang quyên góp (donate) cho Apache, hiện chủ yếu cung cấp hai phương thức tích hợp là **ShardingSphere-JDBC** và **ShardingSphere-Proxy**.

ShardingSphere phù hợp với kịch bản "vẫn dùng Database quan hệ truyền thống, nhưng muốn thông qua tầng trung gian để có thêm năng lực Sharding, Tách Đọc-Ghi (Read/Write Splitting), mã hóa và quản trị". Nó không sửa đổi nhân của MySQL; thay vào đó, nó cung cấp định tuyến trong suốt, viết lại SQL (SQL Rewriting), gộp kết quả và quản trị ngay tại tầng JDBC hoặc Proxy. Ngoài Tách Đọc-Ghi và Sharding, nó còn cung cấp Distributed Transaction, quản trị Database, Shadow Database, mã hóa và che giấu dữ liệu (data masking).

So với việc tự code hoàn toàn một tầng định tuyến riêng, ShardingSphere có ba ưu điểm chính: ShardingSphere-JDBC bám sát chuỗi lời gọi JDBC gốc nên bớt đi một chặng mạng qua Proxy; hai phương thức JDBC và Proxy bao phủ được cả ứng dụng Java lẫn hệ thống đa ngôn ngữ; đồng thời các năng lực Sharding, Tách Đọc-Ghi, mã hóa, Shadow DB và quản trị được cấu hình trong cùng một hệ quy tắc thống nhất nên chi phí mở rộng về sau thấp hơn.

Các tính năng mà ShardingSphere cung cấp như hình dưới đây:

![Các tính năng do ShardingSphere cung cấp](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/shardingsphere-features-5405b83a.png)

Khi chọn phương thức tích hợp thực tế, chủ yếu xem đội ngũ phù hợp với cách nào hơn:

- **ShardingSphere-JDBC**: Tích hợp dưới dạng file JAR, phù hợp với ứng dụng Java, bớt một tầng chuyển tiếp mạng, nhưng phía ứng dụng phải tự thêm dependency và quản lý cấu hình.
- **ShardingSphere-Proxy**: Triển khai dưới dạng một dịch vụ Proxy độc lập, ứng dụng truy cập qua giao thức MySQL/PostgreSQL; phù hợp với hệ thống đa ngôn ngữ hoặc đội ngũ muốn gom toàn bộ quy tắc Sharding về tầng Proxy, nhưng sẽ tốn thêm chi phí vận hành tầng Proxy.

Tuy nhiên, cũng cần nói thêm một câu: **Hiện nay có không ít công ty lựa chọn các Database quan hệ phân tán như TiDB.** Lấy TiDB làm ví dụ, dữ liệu bên dưới được chia theo khoảng khóa (key range) thành nhiều Region; khi một Region vượt ngưỡng sẽ tự động tách tiếp và được cụm điều phối sang các node TiKV khác nhau. Cách này giúp giảm bớt đáng kể các bài toán định tuyến, mở rộng và di chuyển dữ liệu do Sharding thủ công mang lại, nhưng cũng cần đánh giá kỹ độ tương thích SQL, chi phí chuyển đổi, năng lực vận hành và mức độ khớp với hệ sinh thái hiện tại.

Việc tự động tách Region cũng không có nghĩa là nghiệp vụ không cần quan tâm đến điểm nóng (hotspot). Khóa chính tự tăng ghi liên tục, khóa tăng dần theo thời gian, hotspot của tenant lớn hay ghi dồn vào một Region ban đầu vẫn có thể tạo ra hotspot — trên môi trường production vẫn phải đánh giá bài toán hotspot dựa trên đặc thù ghi dữ liệu của nghiệp vụ.

### Sau khi Phân mảnh & Chia bảng (Sharding), di chuyển dữ liệu như thế nào?

Khi thực hiện Phân mảnh & Chia bảng (Sharding), tách Database theo service hoặc đổi sang Database mới, đều cần chuyển toàn bộ dữ liệu sẵn có sang nơi lưu trữ mới. Phương án lựa chọn trước hết phụ thuộc vào việc nghiệp vụ chấp nhận gián đoạn ghi (write downtime) được bao lâu, và đội ngũ có khả năng gánh được mức độ phức tạp đồng bộ đến đâu.

| Phương án                                                    | Điều kiện áp dụng                                                 | Cái giá / Chi phí chính                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Ngừng ghi rồi chuyển toàn bộ (Full Migration)                | Lượng dữ liệu nhỏ, nghiệp vụ cho phép cửa sổ bảo trì kéo dài      | Thời gian ngừng ghi gồm cả export, import và đối soát; bắt buộc phải đo đạc thời gian trước               |
| Nạp toàn bộ + Đồng bộ tăng lượng CDC + Ngừng ghi ngắn để chuyển mạch | Lượng dữ liệu lớn, cho phép ngừng ghi ngắn lúc chuyển mạch (cutover) | Phải đảm bảo khớp nối liền mạch giữa dữ liệu gốc và tăng lượng, rút sạch lệnh ghi cũ và xác nhận đồng bộ xong |
| Ghi kép ở tầng ứng dụng (Application-level Dual Write)       | Không thể ngừng ghi tập trung, và đủ năng lực sửa toàn bộ luồng ghi | Phải xử lý ghi thành công một nửa, loạn thứ tự, Retry, bù trừ và xung đột ghi đồng thời lúc chuyển mạch  |

**Ghi kép ở tầng ứng dụng không tự nhiên mang lại tính nguyên tử giữa hai Database.** Dù luồng API chính đã ghi vào cả hai Database, các Cron Job, Message Consumer hay script thủ công rất dễ bị bỏ sót khi sửa code. Phương án bắt buộc phải quy định rõ Database nào là nguồn dữ liệu chuẩn (Source of Truth), và khi bên còn lại ghi lỗi thì khôi phục bằng cách nào; tuyệt đối không thể chỉ thêm hai lệnh gọi ghi Database là coi như xong việc di chuyển dữ liệu.

#### Khớp nối giữa dữ liệu toàn phần và tăng lượng như thế nào?

Dưới đây lấy phương án "Nạp toàn bộ + CDC + Ngừng ghi ngắn để chuyển mạch" làm ví dụ. Cách này giúp phần lớn dữ liệu được chuyển đi trong lúc hệ thống vẫn chạy bình thường, chỉ cần một khoảng thời gian ngừng ghi được kiểm soát chặt ở bước chuyển mạch cuối cùng:

1. **Kiểm kê và chuẩn bị Database đích**: Xác nhận các bảng cần chuyển, quy tắc Sharding, Index, Unique Constraint, bảng mã (charset), ID tự tăng và toàn bộ điểm vào đọc/ghi. Nếu có chuyển đổi cấu trúc bảng, cần kiểm chứng quy tắc ánh xạ và khả năng xử lý DDL của CDC.
2. **Thiết lập điểm khởi đầu nhất quán giữa Snapshot và Log**: Dùng cơ chế của công cụ di chuyển để lấy đồng thời Consistent Snapshot cùng vị trí binlog tương ứng, và đảm bảo các file log cần thiết không bị xóa sớm trước khi dùng xong. Tuyệt đối không được import xong toàn bộ dữ liệu rồi mới đăng ký nhận thay đổi từ "vị trí hiện tại", nếu không sẽ bị mất hết dữ liệu thay đổi trong lúc import.
3. **Nạp theo lô và liên tục đuổi theo dữ liệu tăng lượng**: Giới hạn áp lực đọc lên Database nguồn và áp lực ghi lên Database đích, đồng thời lưu tiến độ để có thể chạy tiếp nếu gián đoạn. Tuân thủ đúng giao thức kết hợp Snapshot và sự kiện tăng lượng của công cụ khi xử lý Update/Delete, tránh bản ghi Snapshot cũ ghi đè mất phiên bản mới đã đồng bộ qua CDC.
4. **Đối soát dữ liệu và hành vi đọc**: Chia khối so sánh dữ liệu và bật đọc bóng (Shadow Read) cho các truy vấn quan trọng — tức vẫn trả kết quả từ Database cũ cho người dùng, đồng thời đối chiếu kết quả của Database mới chạy ngầm phía sau. Sau đó có thể mở Canary dần các request chỉ đọc chấp nhận độ trễ nhỏ; các luồng đòi hỏi "ghi xong đọc thấy ngay" phải tiếp tục đọc từ Database ghi chuẩn hoặc thêm cơ chế chờ vị trí đồng bộ.
5. **Đóng luồng ghi nghiệp vụ vào Database cũ và xả sạch các Transaction đang chạy dở**: Rà soát toàn bộ API, Cron Job, Message Consumer và script; xác nhận mọi lệnh ghi cũ đã commit hoặc rollback xong hết rồi mới ghi nhận mốc log cuối cùng. Việc ngừng ghi phải được kiểm soát rõ ràng ở cổng định tuyến hoặc khóa quyền ghi Database, tuyệt đối không làm bằng cách chĩa tạm request ghi sang bản sao chỉ đọc để ép văng lỗi.
6. **Chờ Database đích áp dụng đến mốc log cuối cùng và đối soát lần cuối**: Xác nhận Database đích đã commit toàn bộ thay đổi trước mốc log đó, tác vụ đồng bộ không có lỗi, không còn tồn đọng chưa xử lý hay sự kiện bị bỏ qua. Sau khi xác nhận xong xuôi, dừng hẳn tác vụ đồng bộ từ Database cũ sang Database mới để tránh nó ghi đè xung đột với các lệnh ghi nghiệp vụ sắp vào Database mới.
7. **Chuyển định tuyến đọc/ghi và mở lại quyền ghi**: Đưa toàn bộ lệnh ghi nghiệp vụ trong phạm vi chuyển đổi vào Database mới, xác nhận không còn instance cũ hay kết nối sót lại nào tiếp tục ghi vào Database cũ, rồi theo dõi tỷ lệ lỗi, độ trễ truy vấn, số lượng kết nối và hotspot trên các shard. Luôn giữ sẵn phương án Rollback đã diễn tập trước.

Khái niệm "đuổi kịp" ở đây phải căn cứ vào **vị trí dữ liệu mà Database đích đã thực sự áp dụng (applied)**, chứ không chỉ nhìn xem bộ thu thập (collector) đã đọc được bao nhiêu log. Với cơ chế sao chép gốc của MySQL, `Seconds_Behind_Source = 0` cũng không đồng nghĩa với việc đã nhất quán hoàn toàn với nguồn — ví dụ khi Thread nhận binlog bị trễ nó vẫn có thể hiển thị bằng `0`, chi tiết xem tại [Tài liệu trạng thái sao chép MySQL](https://dev.mysql.com/doc/refman/8.4/en/show-replica-status.html). Khi dùng công cụ CDC cũng cần kiểm tra trạng thái áp dụng và trạng thái lỗi của chính nó.

Nếu tự triển khai logic đồng bộ, việc chạy lại (replay) bắt buộc phải có tính lũy đẳng (idempotent), đồng thời đảm bảo thứ tự sự kiện trên cùng một bản ghi hoặc dùng số phiên bản nghiệp vụ (version) có thể so sánh được để từ chối sự kiện cũ. Vị trí binlog chỉ dùng để theo dõi tiến độ trong một luồng log cụ thể, còn GTID dùng để định danh các Transaction đã thực thi — không được lấy thẳng GTID từ các nguồn khác nhau coi như số phiên bản dòng tăng dần toàn cục. Sự kiện xóa (Delete) cũng phải giữ đủ thông tin thứ tự hoặc phiên bản để tránh một lệnh Insert cũ được Retry ghi ngược dữ liệu trở lại.

#### Đối soát dữ liệu thế nào mới có ý nghĩa?

Chỉ đếm số dòng là chưa đủ: hai bên có thể cùng số dòng nhưng lại lệch số tiền, trạng thái, quan hệ liên kết hoặc kết quả xóa dữ liệu. Hãy chia nhỏ theo khoảng khóa chính (Primary Key Range), so sánh số lượng và Checksum trước, rồi định vị từng dòng sai lệch, kết hợp đối soát thêm tổng giá trị nghiệp vụ, phân bố trạng thái và kết quả các truy vấn trọng yếu.

Việc đối soát cũng cần xác định rõ đang so sánh tại mốc thời gian nào. Khi Database nguồn vẫn đang được ghi liên tục còn Database đích đuổi theo bất đồng bộ, việc so sánh trực tiếp hai lần truy vấn có thể hiểu nhầm độ trễ sao chép bình thường thành lỗi dữ liệu. Trong quá trình chuyển đổi có thể đối soát nháp nhiều lần, còn đối soát chốt cuối cùng phải thực hiện sau khi ngừng ghi và đồng bộ tăng lượng đã hoàn tất. Với các bảng quá lớn không thể quét lại toàn bộ trong cửa sổ ngừng ghi, cần kiểm chứng trước phương án Consistent Snapshot, hoặc ghi lại danh sách các khóa chính có thay đổi sau lần đối soát trước để chỉ kiểm tra phủ lại tập này chứ không bỏ qua kiểm tra một cách tùy tiện.

`update_time` có thể giúp thu hẹp phạm vi rà soát, nhưng nếu chỉ kiểm tra "dữ liệu cập nhật trong vài giây gần đây" sẽ bỏ sót các thao tác xóa vật lý (hard delete), các lệnh ghi không cập nhật trường thời gian và các dữ liệu lịch sử được nạp bù. Công cụ đối soát cũng có điều kiện sử dụng riêng — ví dụ [sync-diff-inspector](https://docs.pingcap.com/tidb/stable/sync-diff-inspector-overview/) hỗ trợ so sánh dữ liệu theo khối giữa các Database tương thích MySQL, nhưng khi dùng cần xác nhận ánh xạ bảng, kiểu dữ liệu cột và điều kiện nhất quán khi đối soát; các câu SQL sửa dữ liệu do công cụ sinh ra luôn phải được kiểm tra kỹ trước khi chạy.

#### Tại sao chỉ giữ lại Database cũ là chưa đủ để Rollback?

**Một khi Database mới đã tiếp nhận lệnh ghi nghiệp vụ, Database cũ lập tức bị tụt hậu lại phía sau.** Lúc này nếu chuyển thẳng luồng về lại Database cũ, các cập nhật đơn hàng, trạng thái thanh toán... phát sinh sau thời điểm chuyển mạch sẽ biến mất, thậm chí bị các lệnh ghi tiếp theo đè lên.

- **Lỗi xảy ra trước khi mở lại quyền ghi trên Database mới**: Database cũ vẫn là nguồn dữ liệu chuẩn toàn vẹn; chỉ cần xác nhận Database mới chưa nhận lệnh ghi nghiệp vụ nào là có thể khôi phục định tuyến cũ.
- **Lỗi xảy ra sau khi đã mở quyền ghi trên Database mới**: Phải dừng ghi trên Database mới trước, dùng luồng đồng bộ ngược (reverse sync) hoặc phát lại thay đổi đã chuẩn bị từ trước để bù toàn bộ dữ liệu phát sinh sang Database cũ, xác nhận đã áp dụng xong và đối soát khớp hết rồi mới được chuyển ngược về. Đồng bộ ngược cũng phải kiểm chứng xem các biến đổi trường dữ liệu có khả năng đảo ngược không và có nguy cơ tạo vòng lặp đồng bộ vô hạn hay không.

Nếu chưa xây dựng và diễn tập sẵn đồng bộ dữ liệu ngược, cần coi cột mốc "mở lại quyền ghi trên Database mới" là ranh giới thay đổi phương thức khôi phục: sau mốc đó chỉ có thể sửa lỗi trực tiếp trên Database mới (fix-forward) hoặc đợi cửa sổ bảo trì để bù dữ liệu rồi mới chuyển lại, tuyệt đối không được cam kết có thể chuyển ngược không mất dữ liệu bất cứ lúc nào.

Cửa sổ ngừng ghi cần được ước tính dựa trên dung lượng dữ liệu, độ tồn đọng tăng lượng và thời gian đối soát cuối cùng, sau đó diễn tập toàn bộ quy trình chuyển đổi định tuyến để xác minh xem có đáp ứng yêu cầu nghiệp vụ hay không.

## Tổng kết

- Tách Đọc-Ghi (Read/Write Splitting) nhằm phân tán thao tác đọc và ghi của Database ra các node khác nhau; lợi ích cốt lõi là tăng năng lực mở rộng đọc và giảm áp lực đọc cho Master DB.
- Tách Đọc-Ghi dựa trên sao chép Master-Replica, và sao chép Master-Replica trong MySQL dựa vào binlog.
- **Phân mảnh Database (Database Sharding)** là phân tán dữ liệu trong một Database ra nhiều Database khác nhau. **Chia bảng (Table Sharding)** là chia tách dữ liệu của một bảng đơn lẻ, có thể chia dọc (cột) hoặc chia ngang (dòng).
- Sau khi áp dụng Phân mảnh & Chia bảng (Sharding), cần giải quyết một cách hệ thống các bài toán về Distributed Transaction, Distributed ID, JOIN liên shard, truy vấn không có Sharding Key, tổng hợp liên Database và di chuyển dữ liệu.
- Với những nghiệp vụ như bảng đơn hàng, đừng chỉ nhìn vào truy vấn điểm theo `order_id`, mà phải tính đủ các luồng danh sách đơn hàng của người dùng, truy vấn quản trị của người bán, callback thanh toán và tìm kiếm của đội vận hành.
- Nếu bắt buộc phải Phân mảnh & Chia bảng (Sharding) thủ công, có thể ưu tiên khảo sát ShardingSphere; nếu đội ngũ sẵn sàng tiếp nhận Database quan hệ phân tán, cũng có thể đánh giá các giải pháp như TiDB, nhưng cần tính toán rõ chi phí chuyển đổi và vận hành ngay từ đầu.
