---
title: "Giải thích chi tiết Sao lưu và Khôi phục MySQL: mysqldump, XtraBackup, binlog và PITR"
description: "Giải thích chi tiết về sao lưu và khôi phục MySQL, trình bày mysqldump, MySQL Shell, Percona XtraBackup, binlog, PITR, RTO/RPO, diễn tập khôi phục và các hiểu lầm thường gặp khi sao lưu."
category: Cơ sở dữ liệu
tag:
  - MySQL
  - Sao lưu & Khôi phục
head:
  - - meta
    - name: keywords
      content: MySQL Backup,MySQL Recovery,mysqldump,mysqlbinlog,MySQL Shell,Percona XtraBackup,binlog,PITR,Full Backup,Incremental Backup,Logical Backup,Physical Backup,RTO,RPO
lang: vi
sourceRef: zh-ref/database/mysql/mysql-backup-and-restore.md
---

Sự cố cơ sở dữ liệu trên môi trường production mà kỹ sư sợ nhất thường không phải là tiến trình MySQL bị sập.

Tiến trình sập thì vẫn khởi động lại được, Master (Primary) sập thì vẫn chuyển đổi (failover) sang Replica được. Điều thực sự rắc rối là khi dữ liệu bị xóa mất, bị script lỗi sửa nhầm, ổ đĩa bị hỏng, hoặc lúc migration mới phát hiện thiếu mất một loạt bảng. Lúc đó, cơ chế nhân bản Primary-Replica (Replication), redo log hay undo log đều không đủ dùng; thứ cuối cùng có thể cứu vãn tình thế thường chính là phương án sao lưu (backup) và khôi phục (restore).

Bài viết này chỉ tập trung vào sao lưu và khôi phục MySQL, không mở rộng sang PostgreSQL, Redis hay sản phẩm backup của các hãng cloud. Các câu lệnh chủ yếu được đối chiếu theo bản MySQL 8.4 LTS, đồng thời tham khảo tài liệu hiện hành của MySQL 9.7 tính đến ngày 2026-06-25; tên tham số, yêu cầu phân quyền và khả năng tương thích công cụ có thể thay đổi giữa các phiên bản, nên trước khi áp dụng lên production nhất định phải kiểm tra theo `mysqldump --help`, `mysqlbinlog --help` và tài liệu tương ứng của chính môi trường bạn đang vận hành.

## Sao lưu rốt cuộc giải quyết vấn đề gì?

Trước tiên hãy tách bạch rõ một vài khái niệm rất dễ bị nhầm lẫn với nhau:

- **Khôi phục sau sự cố sập đột ngột (Crash Recovery)**: Sau khi MySQL sập bất thường, InnoDB dựa vào các cơ chế như redo log, undo log để đưa cơ sở dữ liệu về trạng thái nhất quán. Cơ chế này giải quyết vấn đề nhất quán của Storage Engine sau khi tiến trình crash hoặc máy chủ khởi động lại.
- **Nhân bản Primary-Replica / Chuyển đổi High Availability**: Khi Primary không khả dụng, điều hướng lưu lượng sang Replica hoặc Primary mới. Cơ chế này giải quyết bài toán tính sẵn sàng của dịch vụ, nhưng các thao tác ghi sai thường cũng sẽ được đồng bộ sang Replica.
- **Sao lưu và Khôi phục (Backup & Recovery)**: Khôi phục từ một bản sao dữ liệu lịch sử, sau đó phát lại (replay) binlog tới một mốc thời gian chỉ định. Cơ chế này giải quyết vấn đề mất dữ liệu, xóa nhầm/sửa nhầm, hỏng ổ đĩa, chuyển đổi dữ liệu giữa các môi trường và lưu trữ phục vụ kiểm toán (audit).

Nhân bản Primary-Replica không thể thay thế cho sao lưu.

Nếu một câu lệnh `DROP TABLE` chạy thành công trên Primary, khả năng rất cao nó cũng sẽ được đồng bộ sang Replica. Đồng bộ càng nhanh thì lỗi lan truyền càng nhanh. Giá trị của sao lưu nằm ở việc giữ lại một trạng thái lịch sử độc lập, giúp bạn có cơ hội quay ngược về trước thời điểm xảy ra sự cố.

## RTO và RPO quyết định chiến lược sao lưu

Chiến lược sao lưu không thể chỉ hỏi "mỗi ngày backup mấy lần". Hai câu hỏi thực tế hơn nằm ở hai chỉ số:

- **RPO (Recovery Point Objective)**: Mất tối đa dữ liệu trong khoảng thời gian bao lâu là mức chấp nhận được?
- **RTO (Recovery Time Objective)**: Mất tối đa bao lâu để khôi phục lại dịch vụ?

Nếu nghiệp vụ chấp nhận được việc mất 1 ngày dữ liệu, mỗi ngày Full Backup một lần có thể là đủ. Nếu các dữ liệu như đơn hàng, thanh toán, tồn kho chỉ cho phép mất tối đa vài phút thì chỉ có Full Backup là không đủ, mà còn phải lưu giữ binlog để khôi phục gia tăng (incremental recovery). Nếu cơ sở dữ liệu lớn tới hàng trăm GB, việc khôi phục bằng file SQL có thể chạy rất lâu; nếu RTO lại yêu cầu khôi phục trong vòng 30 phút thì bạn phải cân nhắc nghiêm túc đến Physical Backup, warm standby replica, diễn tập khôi phục và quy trình chuyển đổi (failover).

Một tổ hợp phổ biến thường dùng là:

- Thực hiện Full Backup hằng ngày hoặc hằng tuần.
- Bật binlog và giữ log đủ lâu theo yêu cầu RPO.
- Không đặt file backup và binlog trên cùng một ổ đĩa hay cùng một vùng lỗi (failure domain) với cơ sở dữ liệu.
- Định kỳ khôi phục bản backup lên một máy mới và ghi nhận thời gian thực tế tiêu tốn.

Lưu giữ binlog 30 ngày không đồng nghĩa RPO chắc chắn là vài giây. Điểm xa nhất bạn thực sự khôi phục tới được phụ thuộc vào file binlog hoàn chỉnh, đọc được mới nhất và đã được sao chép sang một vùng lỗi độc lập. Trên môi trường production còn phải xem xét `sync_binlog`, `innodb_flush_log_at_trx_commit`, độ trễ lưu trữ binlog (archiving lag), tiến trình lưu trữ có từng bị gián đoạn không, chuỗi file binlog có liên tục không. MySQL 8.4 mặc định đặt `sync_binlog=1` và `innodb_flush_log_at_trx_commit=1`, hai giá trị này ưu tiên độ an toàn; nếu vì hiệu năng mà giảm mức độ đảm bảo bền vững dữ liệu (durability), bạn phải tính cả rủi ro mất các transaction gần nhất vào RPO.

Vì vậy, các hệ thống đòi hỏi RPO ở mức phút thậm chí mức giây không chỉ phải giám sát "trên đĩa còn bao nhiêu ngày binlog", mà còn phải giám sát "binlog được lưu trữ an toàn mới nhất đang trễ so với hiện tại bao lâu".

Ở đây có một giới hạn rất thực tế: tốc độ khôi phục phụ thuộc vào dung lượng dữ liệu, hiệu năng ổ đĩa, số lượng index, băng thông mạng và phương thức import. Khi chưa có số liệu từ các buổi diễn tập thực tế, RTO chỉ là mong muốn chứ không phải cam kết.

## Có những phương thức sao lưu nào?

Sao lưu MySQL thường có ba nhóm phân loại, mỗi nhóm trả lời một góc độ khác nhau.

Theo trạng thái phục vụ của cơ sở dữ liệu trong lúc sao lưu:

| Loại | Mô tả | Kịch bản phù hợp |
| ---- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Cold Backup (Sao lưu lạnh) | Tắt MySQL rồi sao chép các tệp dữ liệu | Hệ thống nhỏ, có cửa sổ bảo trì rộng rãi |
| Warm Backup (Sao lưu ấm) | Sao lưu khi MySQL đang chạy, nhưng có thể khóa hoặc ảnh hưởng ghi | Hệ thống yêu cầu sẵn sàng ở mức trung bình, chấp nhận ảnh hưởng ngắn |
| Hot Backup (Sao lưu nóng) | Sao lưu khi MySQL đang chạy, hạn chế tối đa chặn đọc/ghi nghiệp vụ | DB production, DB lớn, cửa sổ bảo trì rất ngắn |

Theo nội dung tệp sao lưu:

| Loại | Mô tả | Công cụ tiêu biểu |
| -------- | ------------------------------------------ | ------------------------------------------- |
| Logical Backup (Sao lưu logic) | Xuất ra nội dung logic như SQL, CSV, v.v. | `mysqldump`, MySQL Shell dump utilities |
| Physical Backup (Sao lưu vật lý) | Sao chép các tệp vật lý như tệp dữ liệu, tệp log | Percona XtraBackup, MySQL Enterprise Backup |

Theo phạm vi sao lưu:

| Loại | Mô tả |
| -------- | --------------------------------------------------------------- |
| Full Backup (Sao lưu toàn phần) | Sao lưu toàn bộ dữ liệu tại một thời điểm nhất định |
| Incremental Backup (Sao lưu gia tăng) | Sao lưu dữ liệu hoặc log thay đổi kể từ lần sao lưu gần nhất |
| Differential Backup (Sao lưu khác biệt) | Sao lưu dữ liệu thay đổi kể từ lần Full Backup gần nhất |

Khi phỏng vấn thường hay hỏi các cách phân loại này, nhưng ở môi trường production mọi thứ quy về một việc duy nhất: tệp backup có khôi phục được dữ liệu mà nghiệp vụ cần hay không. Phân loại chỉ là ngôn ngữ để chọn công cụ, khôi phục thành công mới là kết quả.

## Dùng mysqldump để sao lưu logic

`mysqldump` là công cụ sao lưu logic đi kèm sẵn với MySQL; nó xuất ra một loạt câu lệnh SQL để có thể dựng lại cấu trúc database/bảng và dữ liệu bảng. Ưu điểm là đơn giản, phổ biến, dễ đọc kiểm tra và phù hợp cho di chuyển dữ liệu giữa các môi trường. Nhược điểm cũng rất rõ: khi dữ liệu lớn thì backup chậm và restore còn chậm hơn nữa, vì quá trình khôi phục phải chạy lại toàn bộ SQL, ghi dữ liệu và dựng lại index.

Tài liệu chính thức của MySQL cũng cảnh báo rõ rằng `mysqldump` không phải giải pháp nhanh cho sao lưu và khôi phục quy mô lớn; khi lượng dữ liệu tăng cao, sao lưu vật lý thường phù hợp hơn.

Một lệnh sao lưu toàn bộ instance InnoDB hướng production có thể viết như sau:

```bash
mysqldump \
  --host=127.0.0.1 \
  --user=backup_user \
  --password \
  --all-databases \
  --single-transaction \
  --routines \
  --events \
  --triggers \
  --source-data=2 \
  > mysql-full-backup.sql
```

Một số tham số cần giải thích riêng:

- `--single-transaction`: Mở một transaction đọc nhất quán (consistent-read) trước khi bắt đầu backup, phù hợp với bảng InnoDB. Thông thường nó không cần giữ khóa bảng suốt thời gian xuất dữ liệu, nhưng lệnh trên còn dùng thêm `--source-data=2`, nên `mysqldump` sẽ xin khóa đọc toàn cục (global read lock) trong thời gian ngắn ở giai đoạn khởi đầu để căn chỉnh snapshot nhất quán với vị trí binlog. Do đó nói chính xác hơn phải là "không chặn luồng ghi nghiệp vụ trong thời gian dài", chứ không phải "hoàn toàn không khóa". Nếu trong database có trộn lẫn bảng không hỗ trợ transaction như MyISAM hay MEMORY, các bảng đó vẫn có thể thay đổi trong quá trình backup.
- `--routines` và `--events`: Xuất luôn các Stored Procedure, Function và Event. Tài liệu MySQL 8.4 nêu rõ các định nghĩa liên quan nằm trong data dictionary, `--all-databases` không đồng nghĩa với việc tự động mang theo các đối tượng này.
- `--triggers`: Trigger mặc định được xuất kèm, nhưng viết rõ ra giúp mục đích của script backup minh bạch hơn.
- `--source-data=2`: Ghi tên tệp binlog và vị trí (position) hiện tại vào file dump dưới dạng comment SQL. Tùy chọn `--master-data` hay gặp ở các tài liệu cũ hiện đã là alias bị đánh dấu lỗi thời (deprecated) của `--source-data` trong tài liệu mới.

Nếu chỉ sao lưu một database duy nhất:

```bash
mysqldump \
  --host=127.0.0.1 \
  --user=backup_user \
  --password \
  --single-transaction \
  --routines \
  --events \
  --triggers \
  --source-data=2 \
  order_db \
  > order_db.sql
```

Cách viết này chủ yếu xuất các đối tượng bên trong `order_db`, không tự động thêm `CREATE DATABASE order_db` và `USE order_db` thành một script dựng database hoàn chỉnh. Khi khôi phục, hoặc là tạo sẵn database trước, hoặc lúc backup chuyển sang dùng `--databases order_db`:

```bash
mysqldump \
  --host=127.0.0.1 \
  --user=backup_user \
  --password \
  --single-transaction \
  --routines \
  --events \
  --triggers \
  --source-data=2 \
  --databases order_db \
  > order_db.sql
```

`--databases` sẽ chèn thêm `CREATE DATABASE` và `USE` vào file dump. Nếu bạn chỉ muốn import dữ liệu vào một database cùng tên đã tồn tại sẵn thì giữ cách viết trước cũng được, nhưng lệnh khôi phục phải chỉ rõ tên database đích.

Nếu tệp sao lưu quá lớn, có thể nén trực tiếp:

```bash
mysqldump \
  --host=127.0.0.1 \
  --user=backup_user \
  --password \
  --single-transaction \
  --routines \
  --events \
  --triggers \
  order_db | gzip > order_db.sql.gz
```

Khi khôi phục, chạy lệnh:

```bash
mysql --host=127.0.0.1 --user=root --password < mysql-full-backup.sql
```

Tệp nén có thể khôi phục như sau:

```bash
mysql --host=127.0.0.1 --user=root --password \
  -e "CREATE DATABASE IF NOT EXISTS order_db"

gunzip -c order_db.sql.gz | mysql --host=127.0.0.1 --user=root --password order_db
```

`mysqldump` có một vài "cái bẫy" thường gặp:

- Tài khoản dùng để backup không đủ quyền, khiến view, trigger, stored procedure hoặc event bị xuất thiếu.
- Khi dùng `--single-transaction`, nếu trong lúc backup có lệnh DDL như `ALTER TABLE`, `DROP TABLE`, `TRUNCATE TABLE` chạy qua, quá trình backup có thể thất bại hoặc nội dung xuất ra không đúng như kỳ vọng.
- Không ghi lại vị trí binlog, dẫn đến sau này không thể tiếp tục thực hiện khôi phục theo mốc thời gian (PITR) từ bản Full Backup.
- Khi khôi phục bản backup sang môi trường có bật GTID, đừng phụ thuộc vào tùy chọn mặc định `--set-gtid-purged=AUTO`. Tài liệu chính thức giải thích rằng theo mặc định, nếu phía nguồn bật GTID, file dump có thể ghi vào `SET @@GLOBAL.gtid_purged` và `SET @@SESSION.sql_log_bin=0`; thậm chí dump một phần database cũng có thể mang theo GTID của transaction thuộc các database khác trong `gtid_executed` của instance nguồn. Khi import vào DB test, DB tạm hoặc instance đích đã có lịch sử GTID, thường phải đánh giá rõ ràng xem có nên dùng `--set-gtid-purged=OFF` hay không; còn nếu tạo node replica mới thì có thể cần giữ lại GTID. Mấu chốt là phải chọn một cách tường minh, không sao chép mù quáng giá trị mặc định.
- `--source-data=2` ghi lại vị trí binlog ở cấp độ toàn instance, không phải log gia tăng "chỉ thuộc riêng database này". PITR cho một database đơn lẻ phức tạp hơn nhiều so với PITR toàn instance, đặc biệt phải cân nhắc các transaction xuyên database, stored procedure, trigger và `binlog_format`, không thể cứ lấy nguyên binlog của cả instance phát lại vào database đích.

Với database nhỏ, môi trường test, migration xuyên phiên bản hoặc xuất lượng ít dữ liệu, `mysqldump` rất tiện tay. Còn với database production hàng trăm GB mà chỉ dựa vào nó để khôi phục thì thời gian restore thường sẽ khiến bạn rất khổ sở.

## MySQL Shell Dump Utilities: Sao lưu logic song song

Nếu bạn muốn giữ tính linh hoạt di chuyển của sao lưu logic, nhưng lại thấy `mysqldump` xuất và nhập đơn luồng quá chậm, có thể tìm hiểu MySQL Shell Dump Utilities.

MySQL Shell cung cấp một số hàm `util`:

```javascript
util.dumpInstance("/backup/mysql/instance", { threads: 8 });
util.dumpSchemas(["order_db"], "/backup/mysql/order_db", { threads: 8 });
util.dumpTables("order_db", ["orders", "order_item"], "/backup/mysql/orders", {
  threads: 8,
});
util.loadDump("/backup/mysql/order_db", { threads: 8 });
```

Định vị của nó vẫn là sao lưu logic, nhưng hỗ trợ dump / load song song, nén, thông tin tiến độ, checksum và xuất thẳng ra object storage. Trong tài liệu chính thức, giá trị mặc định của `threads` là 4, có thể tăng lên tùy theo tải của instance, băng thông mạng và năng lực ghi ở phía đích.

Tuy nhiên đừng hiểu nhầm nó là công cụ thay thế cho sao lưu vật lý. Thứ nó xuất ra vẫn là các đối tượng logic và tệp dữ liệu, khi khôi phục vẫn phải dựng lại bảng, index và các đối tượng; với DB lớn có yêu cầu RTO gắt gao, sao lưu vật lý nhìn chung vẫn chắc chắn hơn.

## Dùng binlog để khôi phục gia tăng (Incremental Recovery)

Full Backup chỉ khôi phục được về đúng thời điểm chụp bản backup đó. Muốn khôi phục tới một mốc thời gian muộn hơn thì phải dựa vào binlog.

binlog ghi lại các sự kiện làm thay đổi dữ liệu, đồng thời là nền tảng cho cả nhân bản Primary-Replica và khôi phục theo mốc thời gian (PITR - Point-in-Time Recovery) trong MySQL. Quy trình PITR thông thường là khôi phục một bản Full Backup trước, rồi từ vị trí binlog tương ứng của bản backup đó phát lại log cho tới thời điểm hoặc vị trí mục tiêu.

Một ví dụ đơn giản:

1. Lúc 02:00 sáng thực hiện một lần Full Backup, tệp dump ghi nhận `binlog.000120` và vị trí `154`.
2. Lúc 10:21 trưa có người xóa nhầm một loạt dữ liệu trong bảng `order_item`.
3. Khi khôi phục, trước tiên import bản Full Backup lúc 02:00.
4. Sau đó dùng `mysqlbinlog` phát lại `binlog.000120` và các log tiếp theo, dừng lại ngay trước câu lệnh xóa nhầm.

Khôi phục theo mốc thời gian có thể viết như sau:

```bash
mysqlbinlog \
  --start-position=154 \
  --stop-datetime="2026-06-25 10:20:59" \
  binlog.000120 binlog.000121 \
  | mysql --binary-mode --host=127.0.0.1 --user=root --password
```

Dừng theo thời gian phù hợp để nhanh chóng khoanh vùng phạm vi, nhưng không thể coi đó là mốc thời gian nghiệp vụ chính xác tuyệt đối. `mysqlbinlog` sẽ diễn giải `--stop-datetime` theo múi giờ cục bộ của máy chạy lệnh và dừng lại khi gặp sự kiện đầu tiên có timestamp lớn hơn hoặc bằng giá trị mục tiêu. Khi khôi phục trên production, cách an toàn hơn thường là xuất trước một đoạn binlog theo khoảng thời gian để kiểm tra, xác định chính xác event hoặc ranh giới transaction gây ra thao tác nhầm, rồi mới dùng `--stop-position` để phát lại lần cuối.

Nếu đã tìm ra chính xác vị trí sự kiện, dùng vị trí (position) sẽ đáng tin cậy hơn dùng thời gian:

```bash
mysqlbinlog \
  --start-position=154 \
  --stop-position=987654 \
  binlog.000120 \
  | mysql --binary-mode --host=127.0.0.1 --user=root --password
```

Khi chỉ định nhiều tệp binlog cùng lúc, `--start-position` chỉ áp dụng cho tệp đầu tiên trong câu lệnh, `--stop-position` chỉ áp dụng cho tệp cuối cùng, còn các tệp ở giữa sẽ được xử lý trọn vẹn. Giá trị position là offset tính theo byte bên trong tệp binlog chứ không phải số thứ tự event, và bắt buộc phải rơi đúng vào ranh giới của một event hợp lệ.

`mysql --binary-mode` không phải tham số viết cho đẹp. Tài liệu chính thức nêu rằng nếu đầu ra của binlog có chứa các ký tự null như `\0`, việc không thêm `--binary-mode` có thể khiến client `mysql` không phân tích cú pháp được chính xác.

MySQL hiện đại thường dùng binlog định dạng `ROW`. Định dạng này ghi lại thay đổi trên từng dòng dữ liệu nên chưa chắc nhìn thấy trực tiếp câu SQL gốc. Khi điều tra thao tác nhầm, bạn có thể giải mã các sự kiện dòng thành dạng comment dễ đọc bằng lệnh sau:

```bash
mysqlbinlog --base64-output=DECODE-ROWS -vv binlog.000120 > binlog.000120.readable.sql
```

Lưu ý đầu ra này chủ yếu phục vụ việc kiểm tra thủ công bằng mắt. Tài liệu chính thức cũng nhắc nhở rằng nếu muốn thực thi lại đầu ra của `mysqlbinlog`, tùy chọn mặc định `--base64-output=AUTO` mới là hành vi an toàn; không nên dùng các chế độ như `DECODE-ROWS` để phát lại chính thức.

Khôi phục bằng binlog đòi hỏi một số điều kiện tiên quyết:

- MySQL bắt buộc phải bật binary logging từ trước.
- Thời gian lưu giữ binlog phải bao phủ được yêu cầu RPO của bạn.
- Trong bản Full Backup phải tìm được tên tệp binlog và vị trí bắt đầu, hoặc có thông tin GTID.
- Trước khi khôi phục nên xác minh trên một instance cách ly, tuyệt đối không phát lại trực tiếp các đoạn binlog chưa chắc chắn lên database production.

Bản thân các tệp binlog cũng cần được sao lưu. Tài liệu chính thức của MySQL từng đưa ra một cách sao lưu binlog liên tục:

```bash
mysqlbinlog \
  --read-from-remote-server \
  --host=127.0.0.1 \
  --user=binlog_backup \
  --password \
  --raw \
  --stop-never \
  --connection-server-id=330610 \
  --result-file=/backup/mysql/binlog/ \
  binlog.000999
```

Câu lệnh này sẽ kéo binlog về ở định dạng nhị phân gốc, và sau khi đọc hết tệp log mới nhất hiện tại sẽ tiếp tục chờ các sự kiện mới. Nó khác với Replica nhân bản ở chỗ nếu kết nối bị ngắt sẽ không tự động kết nối lại như Replica, vì vậy script trên production phải kết hợp thêm giám sát tiến trình (process supervisor), cảnh báo và cơ chế nối tiếp từ điểm ngắt.

Kéo binlog liên tục còn có một số điểm rất dễ bỏ sót:

- Tài khoản đọc binlog từ xa cần quyền liên quan đến nhân bản. Tài liệu MySQL 8.4 đối với `--read-from-remote-server` vẫn ghi yêu cầu quyền `REPLICATION SLAVE`; giữa các phiên bản và mô hình phân quyền khác nhau có thể có sự khác biệt, nên khi tạo tài khoản phải kiểm tra theo đúng tài liệu của phiên bản đang dùng.
- `--stop-never` sẽ khiến `mysqlbinlog` kết nối liên tục vào nguồn bằng một server ID; trên production nên cấu hình tường minh `--connection-server-id` để tránh xung đột với một node Replica hoặc một tiến trình `mysqlbinlog` khác.
- Chế độ `--raw` mặc định ghi ra thư mục hiện tại theo đúng tên tệp binlog phía nguồn; nếu tệp đã tồn tại thì sẽ bị ghi đè. Hãy dùng `--result-file` để chỉ định thư mục hoặc tiền tố riêng biệt, đồng thời giám sát phân quyền và dung lượng của thư mục đó.
- Nếu phía nguồn bật mã hóa binlog, bản sao mà `mysqlbinlog` kéo về vẫn sẽ được lưu ở dạng chưa mã hóa tại phía backup. Đường truyền mạng bắt buộc phải dùng TLS, và thư mục chứa backup cũng cần được mã hóa, kiểm soát truy cập và bảo vệ chống xóa.

## Dùng XtraBackup để sao lưu vật lý

Sao lưu logic xuất ra SQL, còn sao lưu vật lý sao chép các tệp dữ liệu và tệp log liên quan của MySQL. Dung lượng dữ liệu càng lớn thì ưu thế của sao lưu vật lý càng rõ: quá trình backup và restore gần với việc sao chép tệp hơn, không cần phát lại từng câu `INSERT` với số lượng khổng lồ.

Percona XtraBackup là công cụ sao lưu vật lý mã nguồn mở thường dùng trong thực tế vận hành MySQL. Nó có thể sao lưu dữ liệu của các Storage Engine như InnoDB / XtraDB ngay khi MySQL đang chạy, thường được dùng làm giải pháp Hot Backup trên production. Tuy nhiên khái niệm "Hot Backup" chủ yếu đúng với các engine hỗ trợ transaction như InnoDB; tài liệu của Percona cũng chỉ rõ rằng khi sao chép dữ liệu không phải InnoDB thì các bảng InnoDB sẽ bị khóa (lock), do đó với các instance dùng lẫn nhiều Storage Engine cần đánh giá riêng mức độ ảnh hưởng.

Một quy trình Full Backup tối thiểu như sau:

```bash
xtrabackup --backup --target-dir=/data/backups/mysql/base
```

Sau khi sao lưu xong không thể mang ra khởi động ngay, mà phải chạy bước `prepare` trước để đưa các tệp dữ liệu về trạng thái nhất quán:

```bash
xtrabackup --prepare --target-dir=/data/backups/mysql/base
```

`--prepare` sẽ áp dụng redo / undo log để các tệp trong thư mục backup tạo thành một snapshot nhất quán. Không được ngắt giữa chừng bước này; nếu phía sau bản backup này còn phải gộp thêm bản Incremental Backup, cần làm theo tài liệu Percona sử dụng thêm `--apply-log-only` để giữ lại trạng thái trước khi rollback các transaction chưa commit.

Khi khôi phục phải tắt MySQL và đảm bảo `datadir` đích đang trống:

```bash
systemctl stop mysqld

mv /var/lib/mysql /var/lib/mysql.bak.$(date +%F-%H%M%S)
install -d -o mysql -g mysql /var/lib/mysql

xtrabackup --copy-back --target-dir=/data/backups/mysql/base

chown -R mysql:mysql /var/lib/mysql

systemctl start mysqld
```

Những câu lệnh dạng này trông không phức tạp, điểm thực sự dễ gặp sự cố lại là tính tương thích phiên bản. Tài liệu Percona ghi rất rõ: XtraBackup 8.4 chỉ hỗ trợ MySQL 8.4 và Percona Server for MySQL 8.4, không hỗ trợ MySQL 8.0 hay 9.x; còn MySQL 8.0 phải xem phạm vi hỗ trợ của dòng XtraBackup 8.0. Trên production tuyệt đối đừng lấy cảm giác "số phiên bản na ná nhau" để suy đoán xem có backup và restore được hay không.

XtraBackup cũng hỗ trợ Incremental Backup, ví dụ dựa trên một lần Full Backup để sao lưu tiếp phần dữ liệu thay đổi:

```bash
xtrabackup \
  --backup \
  --target-dir=/data/backups/mysql/inc1 \
  --incremental-basedir=/data/backups/mysql/base
```

Thứ tự prepare, cách gộp và các bước khôi phục của chuỗi sao lưu gia tăng rất dễ viết nhầm. Khi đội ngũ chưa diễn tập thành thạo, không nên ngay lập tức đặt cược khả năng khôi phục vào chuỗi incremental phức tạp. Cách làm chắc chắn hơn là đảm bảo "Full Physical Backup + binlog" khôi phục trơn tru trước, sau đó tùy theo dung lượng dữ liệu và áp lực thời gian backup mới bổ sung Incremental Backup.

Nếu sau khi khôi phục bằng XtraBackup vẫn cần làm tiếp PITR, đừng đoán mò điểm bắt đầu. Tệp `xtrabackup_binlog_info` trong thư mục backup sẽ ghi lại tên tệp binlog và vị trí tại thời điểm sao lưu:

```bash
cat /data/backups/mysql/base/xtrabackup_binlog_info
```

Sau khi khôi phục xong bản Full Physical Backup, bắt đầu từ vị trí được tệp này cung cấp để dùng `mysqlbinlog` phát lại các log tiếp theo.

## Chọn Sao lưu Logic hay Sao lưu Vật lý?

Có thể chọn dựa theo dung lượng dữ liệu, mục tiêu khôi phục và năng lực vận hành.

| Kịch bản | Phương án phù hợp hơn |
| -------------------------------------------------------------------- | --------------------------------------- |
| DB nhỏ, DB test, xuất bảng đơn lẻ, migration xuyên môi trường | `mysqldump` |
| Cần xem trực tiếp hoặc chỉnh sửa thủ công nội dung backup | `mysqldump` |
| Migration logic quy mô vừa, muốn xuất/nhập song song | MySQL Shell Dump Utilities |
| DB lớn, cửa sổ khôi phục ngắn, chủ yếu là bảng InnoDB | XtraBackup hoặc MySQL Enterprise Backup |
| Cần khôi phục theo mốc thời gian (PITR) | Full Backup + binlog |
| Instance cơ sở dữ liệu trên Cloud | Ưu tiên snapshot / PITR của nhà cung cấp cloud, kèm kiểm tra xuất dữ liệu |

Đừng thần thánh hóa việc chọn công cụ. Với DB nhỏ, dùng `mysqldump` chẳng có vấn đề gì — script đơn giản, gặp lỗi cũng dễ kiểm tra. Khi dữ liệu lớn lên, nhược điểm khôi phục file SQL chậm sẽ ngày càng lộ rõ, lúc đó chuyển sang sao lưu vật lý sẽ thực tế hơn.

Phương án tệ nhất thường là chỉ làm đúng một kiểu backup, và chưa từng thử khôi phục bao giờ.

## Diễn tập khôi phục nên làm như thế nào?

Script backup chạy thành công chỉ chứng minh rằng nó đã sinh ra tệp. Tệp đó có dùng được hay không phải để buổi diễn tập khôi phục trả lời.

Một buổi diễn tập tối thiểu có thể đi theo quy trình sau:

1. Chuẩn bị một máy tách biệt, cài đặt MySQL cùng phiên bản chính (major version).
2. Tải về bản Full Backup gần nhất cùng các binlog tương ứng, xác nhận khóa giải mã, tài khoản, chứng chỉ và quyền truy cập object storage đều hoạt động.
3. Khôi phục Full Backup, ghi nhận thời gian tiêu tốn.
4. Phát lại binlog tới một mốc thời gian chỉ định, ghi nhận thời gian tiêu tốn.
5. Kiểm tra số lượng database/bảng quan trọng, các câu SQL nghiệp vụ trọng yếu, stored procedure, event, trigger, tài khoản, role và phân quyền.
6. Kiểm tra `charset`, `collation`, `time_zone`, `sql_mode`, công tắc chỉ đọc (`read_only`) và cô lập mạng, đảm bảo instance khôi phục không bị lưu lượng nghiệp vụ thật kết nối nhầm vào.
7. Dùng ứng dụng kết nối tới instance vừa khôi phục và chạy một bộ API smoke test chỉ đọc.
8. Ghi lại RTO thực tế của buổi diễn tập này, mốc thời gian khôi phục được, các bước lỗi và những thao tác thủ công đã thực hiện.

Việc kiểm tra đừng chỉ dừng ở chỗ xem MySQL có khởi động lên được hay không. Tối thiểu phải kiểm tra một vài nhóm dữ liệu sau:

```sql
-- Số dòng của các bảng quan trọng
SELECT COUNT(*) FROM order_db.orders;

-- Thời gian ghi gần nhất
SELECT MAX(created_at) FROM order_db.orders;

-- Stored procedure và function
SHOW PROCEDURE STATUS WHERE Db = 'order_db';
SHOW FUNCTION STATUS WHERE Db = 'order_db';

-- Event
SHOW EVENTS FROM order_db;

-- Trigger
SHOW TRIGGERS FROM order_db;

-- Tài khoản, role và phân quyền
SELECT user, host FROM mysql.user;
SHOW GRANTS FOR 'app_user'@'%';

-- Tham số môi trường trọng yếu
SELECT
  @@character_set_server,
  @@collation_server,
  @@time_zone,
  @@sql_mode,
  @@read_only,
  @@super_read_only;
```

Nếu nghiệp vụ có các bảng đối soát, bảng dòng tiền/giao dịch hay bảng tồn kho thì phải ưu tiên kiểm tra những bảng này. Mục tiêu của diễn tập khôi phục rất cụ thể: phát hiện sớm những lỗi như "backup thiếu đối tượng, binlog thiếu tệp, không khôi phục được quyền, thời gian import vượt xa dự kiến" — những vấn đề sẽ bị phóng đại gấp bội khi sự cố thật xảy ra.

## Những hiểu lầm thường gặp

**Hiểu lầm 1: Có Replica rồi thì không cần backup.**

Replica có thể tiếp nhận lưu lượng đọc ghi, nhưng không cản được thao tác xóa nhầm, sửa nhầm. Khi SQL lỗi được đồng bộ sang, Replica cũng rơi vào trạng thái sai tương tự. Delayed Replica có thể kéo dài thêm một chút thời gian xử lý, nhưng vẫn không thể thay thế cho bản backup ngoại tuyến.

**Hiểu lầm 2: Chỉ backup dữ liệu, không backup binlog.**

Cách làm này nhiều nhất chỉ khôi phục về đúng thời điểm chụp Full Backup. Toàn bộ dữ liệu ghi phát sinh từ sau Full Backup đến trước khi xảy ra sự cố đều không tìm lại được, làm RPO bị kéo dài bằng đúng chu kỳ backup.

**Hiểu lầm 3: Đặt tệp backup và cơ sở dữ liệu trên cùng một máy.**

Khi hỏng ổ đĩa, sự cố phòng máy hay xóa nhầm thư mục, dữ liệu và bản backup có thể cùng mất sạch. Tối thiểu phải sao chép sang hệ thống lưu trữ độc lập; các nghiệp vụ quan trọng còn phải cân nhắc lưu trữ khác trung tâm dữ liệu hoặc object storage.

**Hiểu lầm 4: Script backup không có cảnh báo khi thất bại.**

Trong thư mục backup có tệp cũ không đồng nghĩa với việc lần backup gần nhất đã thành công. Script phải kiểm tra mã thoát (exit code), kích thước tệp, thời gian tạo, checksum và gửi cảnh báo lỗi tới đúng người phụ trách.

**Hiểu lầm 5: Chưa bao giờ khôi phục thử.**

Bản backup không được diễn tập khôi phục lúc bình thường trông có vẻ nhàn nhất, nhưng lúc gặp sự cố lại trả giá đắt nhất. Các bước khôi phục càng lâu không chạy thử thì càng dễ bị kẹt ở phiên bản, phân quyền, đường dẫn, dung lượng đĩa và tham số công cụ.

**Hiểu lầm 6: Checksum hợp lệ đồng nghĩa với khôi phục được.**

Checksum chỉ chứng minh nhiều khả năng tệp không bị hỏng trong quá trình sao chép và lưu trữ, chứ không chứng minh được rằng SQL có thể import trơn tru, bản backup vật lý có thể khởi động được, đối tượng và phân quyền đầy đủ hay chuỗi binlog liên tục. Khả năng khôi phục chỉ có thể chứng minh bằng diễn tập khôi phục.

**Hiểu lầm 7: Ai cũng có quyền sửa hoặc xóa tệp backup.**

Nếu hệ thống backup dùng chung quyền với tài khoản production, hoặc các script vận hành thông thường có thể ghi đè hay xóa trực tiếp, khi gặp xóa nhầm, ransomware hay bug của script thì tất cả có thể mất sạch cùng lúc. Các nghiệp vụ quan trọng tối thiểu phải có một bản sao tách tài khoản, tách vùng lỗi, bật versioning hoặc chính sách bất biến (immutability), đồng thời giới hạn chặt chẽ quyền xóa.

## Một phương án nền tảng dễ áp dụng thực tế

Nếu chưa có sẵn giải pháp nào, bạn có thể bắt đầu từ bộ phương án này:

- Cơ sở dữ liệu nghiệp vụ chủ yếu dùng InnoDB, dung lượng chưa lớn: hằng ngày chạy Full Backup bằng `mysqldump --single-transaction --routines --events --triggers --source-data=2`, lưu giữ từ 7 đến 30 ngày, thời gian giữ binlog bao phủ cùng khoảng cửa sổ đó.
- Khi dung lượng dữ liệu tăng lên: hằng ngày hoặc hằng tuần chạy Full Backup bằng XtraBackup, tùy theo lưu lượng ghi của nghiệp vụ mà quyết định có thêm Incremental Backup không, và sao lưu binlog riêng biệt.
- Sau khi backup ghi xuống đĩa xong thì tính checksum và sao chép sang hệ thống lưu trữ độc lập; với nghiệp vụ quan trọng thì giữ thêm một bản sao được mã hóa, tách tài khoản, có versioning hoặc chính sách bất biến.
- Giám sát thời điểm của bản Full Backup khả dụng mới nhất, thời điểm của binlog đã lưu trữ mới nhất, tính liên tục của chuỗi tệp binlog và trạng thái tiến trình lưu trữ.
- Tối thiểu mỗi tháng diễn tập khôi phục một lần; với nghiệp vụ cốt lõi thì diễn tập thêm một lần trước các đợt khuyến mãi lớn, migration hoặc nâng cấp phiên bản.
- Viết một tài liệu hướng dẫn khôi phục (runbook), bao gồm người phụ trách, vị trí lưu backup, cách giải mã, câu lệnh khôi phục, cách tìm vị trí bắt đầu của binlog, cách dựng môi trường khôi phục cách ly, các câu SQL kiểm tra và hướng dẫn rollback.

Các chu kỳ nêu ở đây chỉ là điểm xuất phát, không phải đáp án chuẩn duy nhất. Các dữ liệu tài chính, đơn hàng, thanh toán, y tế sẽ có yêu cầu RPO/RTO khắt khe hơn; còn cơ sở dữ liệu báo cáo nội bộ hay phân tích log thường có thể nới lỏng hơn. Chiến lược sao lưu phải được thiết kế bám theo thiệt hại nghiệp vụ, chứ không phải chép theo mẫu trên mạng.

## Tài liệu tham khảo

- [MySQL Reference Manual: mysqldump](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html)
- [MySQL Reference Manual: mysqlbinlog](https://dev.mysql.com/doc/refman/8.4/en/mysqlbinlog.html)
- [MySQL Reference Manual: Using mysqlbinlog to Back Up Binary Log Files](https://dev.mysql.com/doc/refman/8.4/en/mysqlbinlog-backup.html)
- [MySQL Reference Manual: Point-in-Time Recovery](https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery-binlog.html)
- [MySQL Reference Manual: Binary Logging Options and Variables](https://dev.mysql.com/doc/refman/8.4/en/replication-options-binary-log.html)
- [MySQL Shell 8.4: Instance Dump Utility, Schema Dump Utility, and Table Dump Utility](https://dev.mysql.com/doc/mysql-shell/8.4/en/mysql-shell-utilities-dump-instance-schema.html)
- [MySQL Shell 8.4: Dump Loading Utility](https://dev.mysql.com/doc/mysql-shell/8.4/en/mysql-shell-utilities-load-dump.html)
- [MySQL Reference Manual: MySQL Releases: Innovation and LTS](https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html)
- [Percona XtraBackup 8.4 Documentation](https://docs.percona.com/percona-xtrabackup/8.4/index.html)
- [Percona XtraBackup 8.4: Prepare a full backup](https://docs.percona.com/percona-xtrabackup/8.4/prepare-full-backup.html)
- [Percona XtraBackup 8.4: Index of files created by Percona XtraBackup](https://docs.percona.com/percona-xtrabackup/8.4/xtrabackup-files.html)
- [Percona XtraBackup 8.0 Supported Versions](https://docs.percona.com/percona-xtrabackup/8.0/supported-versions.html)
