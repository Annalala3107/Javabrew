---
title: Chi tiết về 3 loại log cốt lõi trong MySQL (binlog, redo log và undo log)
description: Phân tích chuyên sâu vai trò và nguyên lý hoạt động của 3 loại log cốt lõi trong MySQL gồm binlog, redo log và undo log, giải thích chi tiết cơ chế two-phase commit đảm bảo tính nhất quán dữ liệu, cùng ứng dụng trong crash recovery và master-slave replication.
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL log,binlog,redo log,undo log,two-phase commit,crash recovery,master-slave replication,WAL,transaction log
lang: vi
sourceRef: zh-ref/database/mysql/mysql-logs.md
---

> Bài viết được đóng góp bởi tài khoản Official Account "Programmer A-Xing" (Programmer A-Xing) và được hoàn thiện bổ sung bởi JavaGuide.

## Lời mở đầu

MySQL Log chủ yếu bao gồm các nhóm lớn: error log, query log, slow query log, transaction log (nhật ký giao dịch) và binary log (nhật ký nhị phân). Trong số đó, quan trọng nhất phải kể đến binary log `binlog` (archive log) cùng các transaction log gồm `redo log` (nhật ký làm lại) và `undo log` (nhật ký hoàn tác).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/01-b2beb336.png)

Hôm nay chúng ta sẽ cùng đi sâu tìm hiểu về `redo log`, `binlog`, cơ chế two-phase commit (2PC - xác nhận hai giai đoạn) và `undo log`.

## redo log

`redo log` (nhật ký làm lại) là thành phần dành riêng cho storage engine InnoDB; nó mang lại cho MySQL khả năng phục hồi sau sự cố (crash recovery).

Ví dụ: khi instance MySQL gặp sự cố hoặc máy chủ bị tắt đột ngột (crash/downtime), lúc khởi động lại, storage engine InnoDB sẽ sử dụng redo log để phục hồi dữ liệu, đảm bảo tính bền vững (durability) và tính toàn vẹn của dữ liệu.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/02-68a5b2d0.png)

Trong MySQL, dữ liệu được quản lý theo đơn vị trang (page). Khi bạn truy vấn một bản ghi, MySQL sẽ nạp cả một trang dữ liệu từ đĩa cứng lên. Dữ liệu được nạp lên được gọi là data page (trang dữ liệu) và được đưa vào `Buffer Pool`.

Các truy vấn tiếp theo đều tìm kiếm trong `Buffer Pool` trước; nếu không trúng cache (miss) mới phải nạp từ đĩa cứng, giúp giảm thiểu chi phí Disk I/O và tăng hiệu năng.

Khi cập nhật dữ liệu bảng cũng tương tự: nếu phát hiện dữ liệu cần cập nhật đã tồn tại trong `Buffer Pool`, MySQL sẽ trực tiếp cập nhật ngay trên `Buffer Pool`.

Sau đó, thao tác "đã sửa đổi những gì trên data page nào" sẽ được ghi nhận vào bộ đệm redo log (`redo log buffer`), rồi tiếp tục được flush (ghi) xuống các file redo log trên đĩa.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/03-fc25a2c5.png)

> Lưu ý lỗi chính tả trong ảnh: Ở bước 4, từ "buffe" trong câu `clear redo log buffer and flush to disk` (flush redo log buffe xuống file redo log) thực chất phải là buffer.

Trong điều kiện lý tưởng, ngay khi transaction commit thì thao tác flush xuống đĩa sẽ diễn ra. Tuy nhiên trên thực tế, thời điểm flush xuống đĩa được quyết định dựa trên các chiến lược (policy) cấu hình.

> Mẹo nhỏ: Mỗi bản ghi redo bao gồm "tablespace number + data page number + offset + độ dài dữ liệu sửa đổi + dữ liệu sửa đổi cụ thể".

### Thời điểm flush xuống đĩa

Trong storage engine InnoDB, **redo log buffer** (bộ đệm redo log) là một vùng nhớ dùng để lưu tạm redo log. Nhằm đảm bảo tính bền vững (durability) của transaction và tính nhất quán của dữ liệu, InnoDB sẽ flush dữ liệu log từ vùng đệm này xuống các file redo log trên đĩa tại các thời điểm cụ thể. Các thời điểm này có thể tóm lược thành 6 kịch bản sau:

1. **Khi transaction commit (cốt lõi nhất)**: Khi transaction commit, redo log trong log buffer sẽ được flush xuống đĩa (có thể điều khiển thông qua tham số `innodb_flush_log_at_trx_commit`, sẽ đề cập chi tiết ở phần sau).
2. **Khi dung lượng redo log buffer không đủ**: Đây là chiến lược chủ động quản lý dung lượng của InnoDB nhằm tránh việc user thread bị block do bộ đệm bị ghi đầy.
   - Khi dung lượng đã sử dụng của redo log buffer vượt quá **một nửa (50%)** tổng dung lượng, background thread sẽ **chủ động** flush phần log này xuống đĩa để giải phóng không gian cho các lượt ghi tiếp theo—đây là một tối ưu hóa mang tính phòng ngừa từ trước.
   - Nếu do các transaction quá lớn hoặc I/O quá tải khiến buffer bị **ghi đầy hoàn toàn**, tất cả các user thread muốn ghi log mới đều sẽ bị **block** và buộc phải thực hiện flush đồng bộ xuống đĩa cho đến khi có không gian trống. Tình huống này gây ảnh hưởng xấu tới hiệu năng database, cần cố gắng tránh.
3. **Khi kích hoạt Checkpoint**: Checkpoint là cơ chế cốt lõi được InnoDB thiết kế nhằm rút ngắn thời gian crash recovery. Khi Checkpoint được kích hoạt, InnoDB cần flush tất cả các dirty page trước điểm checkpoint này xuống đĩa. Dựa theo nguyên lý **Write-Ahead Logging (WAL)**, trước khi data page được ghi xuống đĩa, redo log tương ứng bắt buộc phải được ghi xuống đĩa trước. Do đó, việc thực thi Checkpoint chắc chắn sẽ đảm bảo các redo log liên quan đều đã được flush an toàn xuống đĩa.
4. **Background thread flush định kỳ**: InnoDB có một background master thread chạy định kỳ khoảng mỗi giây một lần, trong đó bao gồm công việc flush log từ redo log buffer xuống đĩa. Cơ chế này là đảm bảo bền vững chính khi cấu hình `innodb_flush_log_at_trx_commit` ở giá trị 0 hoặc 2.
5. **Đóng server bình thường (graceful shutdown)**: Trong quá trình tắt MySQL server bình thường, để đảm bảo toàn bộ dữ liệu của các transaction đã commit đều được lưu trữ trọn vẹn, InnoDB sẽ thực hiện một lần flush cuối cùng, dọn sạch toàn bộ log còn lại trong redo log buffer và ghi vào file trên đĩa.
6. **Khi luân chuyển (switch) file binlog**: Khi bật binlog, dưới cấu hình "song nhất" (double 1) của MySQL gồm `innodb_flush_log_at_trx_commit=1` và `sync_binlog=1`, để đảm bảo tính nhất quán trạng thái giữa redo log và binlog (phục vụ crash recovery hoặc master-slave replication), khi file binlog bị ghi đầy hoặc khi chạy lệnh `flush logs` thủ công để chuyển file, thao tác flush redo log sẽ được kích hoạt.

Tóm lại, InnoDB sẽ flush redo log trong nhiều trường hợp khác nhau để đảm bảo tính bền vững và tính nhất quán của dữ liệu.

Chúng ta cần hết sức lưu ý việc thiết lập chiến lược flush phù hợp thông qua `innodb_flush_log_at_trx_commit`. Tùy thuộc vào chiến lược cấu hình, nếu MySQL gặp sự cố đột ngột thì có thể sẽ xảy ra tình trạng mất mát một lượng nhỏ dữ liệu.

Tham số `innodb_flush_log_at_trx_commit` có 3 giá trị tương ứng với 3 chiến lược flush:

- **0**: Khi đặt là 0, mỗi khi transaction commit sẽ không thực hiện thao tác flush xuống đĩa. Cách này cho hiệu năng cao nhất nhưng kém an toàn nhất, bởi nếu MySQL bị crash hoặc hệ điều hành sập nguồn, có thể mất mát dữ liệu transaction trong vòng 1 giây gần nhất.
- **1**: Khi đặt là 1, mỗi khi transaction commit đều sẽ thực hiện flush xuống đĩa. Cách này có hiệu năng thấp nhất nhưng an toàn tuyệt đối, bởi chỉ cần transaction commit thành công thì bản ghi redo log chắc chắn đã nằm an toàn trên đĩa, không bao giờ mất dữ liệu.
- **2**: Khi đặt là 2, mỗi khi transaction commit, nội dung redo log trong log buffer chỉ được ghi vào page cache (bộ đệm hệ thống tập tin của hệ điều hành). Page cache chuyên dùng để cache file, ở đây chính là các file redo log. Hiệu năng và độ an toàn của cách này nằm ở mức trung gian giữa 0 và 1.

Giá trị mặc định của `innodb_flush_log_at_trx_commit` là 1, và chỉ khi đặt là 1 thì mới đảm bảo không bao giờ mất dữ liệu. Để đảm bảo tính bền vững (durability) của transaction, chúng ta bắt buộc phải đặt là 1.

Ngoài ra, InnoDB có một background thread, cứ mỗi `1` giây sẽ ghi nội dung từ `redo log buffer` vào bộ đệm file hệ thống (`page cache`), sau đó gọi hàm `fsync` để flush xuống đĩa.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/04-f8e27d86.png)

Điều này đồng nghĩa với việc: bản ghi redo log của một transaction chưa commit cũng hoàn toàn có thể đã được flush xuống đĩa.

**Tại sao lại như vậy?**

Bởi vì trong quá trình transaction thực thi, các bản ghi redo log đã được ghi vào `redo log buffer`, và các bản ghi này có thể bị background thread flush xuống đĩa bất kỳ lúc nào.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/05-47313521.png)

Ngoài việc background thread thăm dò định kỳ `1` lần/giây, còn có trường hợp khác: khi dung lượng `redo log buffer` chuẩn bị chạm ngưỡng một nửa `innodb_log_buffer_size`, background thread cũng sẽ chủ động flush xuống đĩa.

Dưới đây là lưu đồ thể hiện các chiến lược flush khác nhau.

#### innodb_flush_log_at_trx_commit=0

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/06-8fe332a7.png)

Khi đặt là `0`, nếu MySQL bị crash hoặc server sập nguồn, có thể mất tối đa `1` giây dữ liệu.

#### innodb_flush_log_at_trx_commit=1

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/07-aa39238e.png)

Khi đặt là `1`, chỉ cần transaction commit thành công, bản ghi redo log chắc chắn đã nằm trên đĩa cứng, hoàn toàn không bị mất dữ liệu.

Nếu trong lúc transaction đang thực thi mà MySQL bị crash, phần log dở dang này có thể mất, nhưng do transaction chưa từng commit nên việc mất log này cũng không gây ra tổn thất dữ liệu đã xác nhận.

#### innodb_flush_log_at_trx_commit=2

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/09-f8750c7e.png)

Khi đặt là `2`, chỉ cần transaction commit thành công, nội dung trong `redo log buffer` chỉ mới được ghi vào `page cache` của hệ điều hành.

Nếu chỉ riêng tiến trình MySQL bị crash thì không mất dữ liệu nào, nhưng nếu toàn bộ server sập nguồn (OS crash/power outage) thì có thể mất tối đa `1` giây dữ liệu.

### Nhóm file log (Log File Group)

Các file redo log lưu trên đĩa cứng không tồn tại đơn lẻ mà xuất hiện dưới dạng một **nhóm file log (log file group)**, trong đó kích thước của mỗi file redo log đều bằng nhau.

Ví dụ: có thể cấu hình một nhóm gồm `4` file, mỗi file dung lượng `1GB`, toàn bộ log file group có thể lưu trữ tối đa `4GB` nội dung.

Nó hoạt động theo cơ chế mảng vòng tròn (circular buffer): bắt đầu ghi từ đầu, ghi đến cuối rồi lại quay vòng về đầu ghi tiếp, như hình bên dưới.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/10-8d3b351b.png)

Trong **log file group** này có hai thuộc tính cực kỳ quan trọng là `write pos` và `checkpoint`:

- **write pos** là vị trí ghi hiện tại, vừa ghi vừa tịnh tiến về phía sau.
- **checkpoint** là vị trí cần xóa/giải phóng hiện tại, cũng tịnh tiến về phía sau.

Mỗi lần flush các bản ghi redo log vào **log file group**, vị trí `write pos` sẽ được dịch chuyển cập nhật về phía trước.

Mỗi khi MySQL đọc **log file group** để khôi phục dữ liệu, nó sẽ dọn dẹp các bản ghi redo log đã xử lý và đẩy `checkpoint` tiến lên phía trước.

Khoảng trống còn lại giữa `write pos` và `checkpoint` chính là không gian có thể dùng để ghi các bản ghi redo log mới.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/11-0620efb4.png)

Nếu `write pos` đuổi kịp `checkpoint`, điều đó có nghĩa là **log file group** đã bị đầy. Lúc này không thể ghi thêm bản ghi redo log mới nào nữa, MySQL buộc phải dừng lại, flush bớt dirty page xuống đĩa, giải phóng bớt các bản ghi và đẩy `checkpoint` tiến lên.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/12-83786083.png)

Lưu ý rằng từ MySQL 8.0.30 trở đi, cơ chế log file group có một số thay đổi:

> The innodb_redo_log_capacity variable supersedes the innodb_log_files_in_group and innodb_log_file_size variables, which are deprecated. When the innodb_redo_log_capacity setting is defined, the innodb_log_files_in_group and innodb_log_file_size settings are ignored; otherwise, these settings are used to compute the innodb_redo_log_capacity setting (innodb_log_files_in_group \* innodb_log_file_size = innodb_redo_log_capacity). If none of those variables are set, redo log capacity is set to the innodb_redo_log_capacity default value, which is 104857600 bytes (100MB). The maximum redo log capacity is 128GB.

> Redo log files reside in the #innodb_redo directory in the data directory unless a different directory was specified by the innodb_log_group_home_dir variable. If innodb_log_group_home_dir was defined, the redo log files reside in the #innodb_redo directory in that directory. There are two types of redo log files, ordinary and spare. Ordinary redo log files are those being used. Spare redo log files are those waiting to be used. InnoDB tries to maintain 32 redo log files in total, with each file equal in size to 1/32 \* innodb_redo_log_capacity; however, file sizes may differ for a time after modifying the innodb_redo_log_capacity setting.

Nghĩa là trước MySQL 8.0.30, chúng ta cấu hình số lượng file và kích thước từng file trong log file group qua `innodb_log_files_in_group` và `innodb_log_file_size`. Nhưng từ bản MySQL 8.0.30 trở đi, hai biến này đã bị deprecated; ngay cả khi được chỉ định thì chúng cũng chỉ dùng để tính toán giá trị `innodb_redo_log_capacity`. Số lượng file trong log file group được cố định là 32, và kích thước mỗi file là `innodb_redo_log_capacity / 32`.

Chúng ta có thể kiểm chứng điểm thay đổi này bằng thực nghiệm.

Trước tiên tạo một file cấu hình chứa thiết lập giá trị cho `innodb_log_files_in_group` và `innodb_log_file_size`:

```properties
[mysqld]
innodb_log_file_size = 10485760
innodb_log_files_in_group = 64
```

Dùng Docker khởi chạy một container MySQL 8.0.32:

```bash
docker run -d -p 3312:3309 -e MYSQL_ROOT_PASSWORD=your-password -v /path/to/your/conf:/etc/mysql/conf.d --name MySQL830 mysql:8.0.32
```

Bây giờ cùng xem log khởi động:

```plain
2023-08-03T02:05:11.720357Z 0 [Warning] [MY-013907] [InnoDB] Deprecated configuration parameters innodb_log_file_size and/or innodb_log_files_in_group have been used to compute innodb_redo_log_capacity=671088640. Please use innodb_redo_log_capacity instead.
```

Log này chỉ rõ rằng `innodb_log_files_in_group` và `innodb_log_file_size` đã bị deprecated và chỉ được dùng để tính `innodb_redo_log_capacity`.

Hãy xem tiếp số lượng file trong log file group:

![](/media/jg/local/database/mysql/images/redo-log-1c0ecd.png)

Có thể thấy chính xác là 32 file, và kích thước mỗi file log là `671088640 / 32 = 20971520` bytes.

Do đó khi sử dụng MySQL 8.0.30 trở về sau, khuyến nghị sử dụng trực tiếp biến `innodb_redo_log_capacity` để cấu hình log file group.

### Tóm tắt về redo log

Tin chắc rằng các bạn đều đã nắm được vai trò của redo log cùng thời điểm flush và cấu trúc lưu trữ của nó.

Bây giờ hãy cùng suy ngẫm một câu hỏi: **Chẳng phải chỉ cần mỗi lần có sửa đổi, ta flush trực tiếp data page xuống đĩa là xong sao, cần chi đến redo log?**

Chẳng phải cả hai đều là flush xuống đĩa ư? Sự khác biệt nằm ở đâu?

```java
1 Byte = 8bit
1 KB = 1024 Byte
1 MB = 1024 KB
1 GB = 1024 MB
1 TB = 1024 GB
```

Trên thực tế, kích thước một data page lên tới `16KB`, việc flush data page rất tốn thời gian. Bạn có thể chỉ sửa đổi vài `Byte` dữ liệu bên trong data page, liệu có đáng để ghi cả một trang 16KB xuống đĩa không?

Hơn nữa, việc flush data page là ghi ngẫu nhiên (random write), bởi vì vị trí của một data page có thể nằm rải rác ở bất kỳ đâu trên file đĩa cứng, dẫn đến hiệu năng I/O cực kỳ kém.

Trong khi đó, việc ghi redo log thì một bản ghi có thể chỉ tốn vài chục `Byte`, chỉ bao gồm tablespace number, data page number, disk file offset và giá trị cập nhật; thêm vào đó lại là ghi tuần tự (sequential write) nên tốc độ flush cực kỳ nhanh.

Do đó, dùng redo log để ghi lại nội dung chỉnh sửa đem lại hiệu năng vượt trội hơn rất nhiều so với cách flush data page trực tiếp, giúp khả năng xử lý đồng thời (concurrency) của cơ sở dữ liệu mạnh mẽ hơn đáng kể.

> Thực ra data page trên bộ nhớ tại các thời điểm nhất định cũng sẽ được flush xuống đĩa, quá trình này gọi là page flushing (hoặc checkpointing), khi bàn về `Buffer Pool` chúng ta sẽ tìm hiểu sâu hơn phần này.

## binlog

Redo log là physical log (nhật ký vật lý), ghi lại nội dung "đã sửa đổi những gì trên data page nào", thuộc về tầng storage engine InnoDB.

Trong khi đó, binlog là logical log (nhật ký logic), ghi lại logic câu lệnh gốc, chẳng hạn như "cộng thêm 1 vào trường c của hàng có ID=2", thuộc về tầng `MySQL Server`.

Bất kể bạn dùng storage engine nào, chỉ cần xảy ra thao tác cập nhật dữ liệu bảng là đều phát sinh log binlog.

Vậy binlog rốt cuộc dùng để làm gì?

Có thể nói rằng các tác vụ **sao lưu dữ liệu (data backup), chủ-phụ (master-slave), chủ-chủ (master-master), dự phòng nóng (active-standby)** của cơ sở dữ liệu MySQL đều không thể tách rời binlog; chúng cần dựa vào binlog để đồng bộ hóa dữ liệu và đảm bảo tính nhất quán giữa các node.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/01-20220305234724956-ebbc7fbf.png)

Binlog sẽ ghi lại tất cả các thao tác logic liên quan đến việc cập nhật dữ liệu, và phương thức ghi hoàn toàn là ghi tuần tự.

### Định dạng ghi (Logging Formats)

Log binlog có ba định dạng, có thể chỉ định thông qua tham số `binlog_format`:

- **statement**
- **row**
- **mixed**

Khi chỉ định `statement`, nội dung được ghi lại là nguyên văn câu lệnh `SQL`. Ví dụ khi chạy `update T set update_time=now() where id=1`, nội dung ghi nhận sẽ như sau:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/02-20220305234738688-0bf22b0e.png)

Khi đồng bộ dữ liệu sang replica, replica sẽ thực thi lại câu lệnh `SQL` đã ghi. Nhưng có một vấn đề: `update_time=now()` sẽ lấy thời gian hệ thống tại thời điểm chạy trên replica, dẫn đến dữ liệu không khớp với database master gốc.

Để giải quyết vấn đề này, ta cần chỉ định định dạng là `row`. Nội dung ghi lại không còn là câu lệnh `SQL` đơn thuần nữa mà chứa dữ liệu cụ thể của từng dòng bị tác động:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/03-20220305234742460-0cbf0868.png)

Nội dung định dạng `row` không thể đọc trực tiếp bằng mắt thường mà phải dùng công cụ `mysqlbinlog` để phân tích (parse).

Tại đây, `update_time=now()` đã được chuyển thành timestamp cụ thể `update_time=1627112756247`, và các trường @1, @2, @3 phía sau điều kiện WHERE chính là giá trị gốc của các cột từ 1 đến 3 của dòng dữ liệu đó (**giả sử bảng này chỉ có 3 cột**).

Cách này đảm bảo tính nhất quán tuyệt đối khi đồng bộ dữ liệu. Trong thực tế, định dạng `row` thường được cấu hình mặc định để đem lại độ tin cậy cao nhất cho sao lưu và phục hồi dữ liệu.

Tuy nhiên, định dạng này đòi hỏi dung lượng lưu trữ lớn hơn, chiếm dụng đĩa và tiêu tốn nhiều tài nguyên I/O hơn khi đồng bộ/phục hồi, làm ảnh hưởng đến tốc độ thực thi.

Do đó xuất hiện một giải pháp dung hòa: định dạng `mixed`, kết hợp cả hai định dạng trên.

MySQL sẽ tự phán đoán xem câu lệnh `SQL` đó có nguy cơ gây ra sự không nhất quán dữ liệu hay không: nếu có thì dùng định dạng `row`, ngược lại sẽ dùng định dạng `statement`.

### Cơ chế ghi (Write Mechanism)

Thời điểm ghi của binlog cũng rất trực quan: trong quá trình transaction thực thi, log trước hết được ghi vào `binlog cache`; khi transaction commit, `binlog cache` mới được ghi vào các file binlog.

Vì binlog của một transaction không được phép bị chia cắt—bất kể transaction đó lớn đến mức nào cũng phải đảm bảo được ghi toàn vẹn một lần—nên hệ thống sẽ cấp phát cho mỗi thread một vùng nhớ đóng vai trò làm `binlog cache`.

Chúng ta có thể kiểm soát kích thước binlog cache của từng thread thông qua tham số `binlog_cache_size`. Nếu nội dung vượt quá ngưỡng này, nó sẽ được ghi tạm ra đĩa cứng (`Swap`).

Quy trình flush log binlog xuống đĩa diễn ra như sau:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/04-20220305234747840-db054429.png)

- **Thao tác `write` trong hình trên nghĩa là ghi log vào page cache của hệ thống tập tin, chưa thực sự lưu bền vững xuống đĩa cứng vật lý nên tốc độ rất nhanh.**
- **Thao tác `fsync` trong hình mới chính là thao tác persist (lưu bền vững) dữ liệu xuống đĩa cứng.**

Thời điểm thực hiện `write` và `fsync` được điều khiển bởi tham số `sync_binlog`, mặc định là `1`.

Khi đặt là `0`, mỗi lần commit transaction chỉ thực hiện `write`, việc khi nào gọi `fsync` sẽ do hệ điều hành tự quyết định.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/05-20220305234754405-0d718da8.png)

Mặc dù hiệu năng được nâng cao, nhưng nếu máy chủ sập nguồn, dữ liệu binlog còn nằm trong `page cache` sẽ bị mất sạch.

Để đảm bảo an toàn, có thể đặt là `1`, nghĩa là mỗi lần commit transaction đều bắt buộc thực thi `fsync`, tương tự như **quy trình flush của redo log**.

Cuối cùng là phương án trung gian: đặt là `N (N > 1)`, nghĩa là mỗi lần commit transaction đều `write`, nhưng phải tích lũy đủ `N` transaction mới gọi `fsync` một lần.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/06-20220305234801592-b2556cae.png)

Trong các tình huống nghẽn cổ chai I/O, thiết lập `sync_binlog` thành một giá trị tương đối lớn có thể cải thiện hiệu năng đáng kể.

Tuy nhiên, nếu máy chủ sập nguồn, dữ liệu binlog của `N` transaction gần nhất sẽ bị mất.

## Two-Phase Commit (Cơ chế xác nhận hai giai đoạn)

Redo log mang lại cho storage engine InnoDB khả năng crash recovery (khôi phục sau sự cố).

Binlog đảm bảo tính nhất quán dữ liệu cho toàn bộ kiến trúc cụm MySQL (cluster).

Tuy cả hai đều phục vụ việc đảm bảo tính bền vững (durability), nhưng trọng tâm của chúng hoàn toàn khác nhau.

Trong quá trình thực thi câu lệnh update, cả hai loại log redo log và binlog đều được ghi nhận. Lấy đơn vị cơ bản là transaction, redo log có thể liên tục được ghi trong suốt quá trình transaction diễn ra, trong khi binlog chỉ được ghi khi transaction commit. Do đó thời điểm ghi của redo log và binlog là khác nhau.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/01-20220305234816065-877d8070.png)

Quay lại vấn đề trọng tâm: nếu logic giữa hai bản log redo log và binlog không đồng nhất thì hậu quả gì sẽ xảy ra?

Hãy lấy câu lệnh `update` làm ví dụ: giả sử bản ghi có `id=2` đang có trường `c` mang giá trị `0`, ta muốn cập nhật trường `c` thành `1` qua câu lệnh `update T set c=1 where id=2`.

Giả sử trong quá trình thực thi, sau khi đã ghi xong redo log, trong lúc đang ghi binlog thì xảy ra lỗi/sự cố (crash), tình huống gì sẽ xảy ra?

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/02-20220305234828662-83e380aa.png)

Do binlog chưa kịp ghi xong đã gặp sự cố nên trong binlog hoàn toàn không có bản ghi sửa đổi này. Vì vậy sau này khi dùng binlog để phục hồi dữ liệu hoặc đồng bộ sang replica, thao tác cập nhật này sẽ bị thiếu; dòng dữ liệu này phục hồi ra có trường `c` là `0`. Trong khi đó ở master gốc, nhờ redo log phục hồi mà dòng này lại có `c` là `1`, dẫn tới dữ liệu giữa hai bên không nhất quán.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/03-20220305235104445-7192813a.png)

Để giải quyết vấn đề nhất quán logic giữa hai bản log, storage engine InnoDB sử dụng giải pháp **Two-Phase Commit (2PC - Xác nhận hai giai đoạn)**.

Nguyên lý rất trực quan: thao tác ghi redo log được tách thành hai bước gồm `prepare` và `commit`, đó chính là **two-phase commit**.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/04-20220305234956774-a7cde4d1.png)

Khi áp dụng **two-phase commit**, việc xảy ra sự cố trong lúc ghi binlog sẽ không gây hậu quả tiêu cực: khi MySQL khôi phục dữ liệu dựa vào redo log, nó phát hiện redo log vẫn đang ở giai đoạn `prepare` và không tìm thấy bản ghi binlog tương ứng, nên nó sẽ rollback (hoàn tác) transaction này.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/05-20220305234937243-3801360e.png)

Xét tiếp một kịch bản khác: nếu redo log gặp sự cố trong lúc chuyển sang giai đoạn `commit`, liệu transaction có bị rollback không?

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/06-20220305234907651-78fd9335.png)

Transaction sẽ không bị rollback. Hệ thống sẽ thực thi logic như vùng khoanh đỏ trong hình: dù redo log đang ở giai đoạn `prepare`, nhưng hệ thống vẫn tìm thấy bản ghi binlog tương ứng thông qua transaction `id`. Do đó MySQL xem transaction này là hoàn chỉnh, tiến hành commit transaction và khôi phục dữ liệu.

## undo log

> Phần nội dung này là phần bổ sung của JavaGuide:

Mọi sửa đổi dữ liệu của mỗi transaction đều được ghi lại vào undo log. Khi xảy ra lỗi trong quá trình thực thi transaction hoặc khi cần thực hiện thao tác rollback, MySQL có thể tận dụng undo log để khôi phục dữ liệu về trạng thái trước khi transaction bắt đầu.

Undo log là một loại logical log, ghi nhận các thao tác SQL. Chẳng hạn nếu transaction thực thi một câu lệnh DELETE, undo log sẽ ghi nhận một câu lệnh INSERT tương ứng. Đồng thời, thông tin của undo log cũng được ghi vào redo log, bởi vì bản thân undo log cũng cần được bảo vệ tính bền vững (durability). Hơn nữa, bản thân undo log sẽ được thu dọn và xóa bỏ: ví dụ đối với thao tác INSERT, sau khi transaction commit là có thể xóa ngay lập tức; đối với thao tác UPDATE/DELETE, sau khi transaction commit sẽ không bị xóa ngay mà được đưa vào history list để background purge thread dọn dẹp sau.

Undo log được quản lý và ghi theo dạng segment (đoạn): mỗi thao tác undo khi ghi sẽ chiếm dụng một **undo log segment** (đoạn log undo), undo log segment nằm bên trong **rollback segment** (đoạn rollback). Khi transaction bắt đầu, nó cần được cấp phát một rollback segment. Mỗi rollback segment chứa 1024 undo log segment, giúp quản lý nhu cầu rollback của nhiều transaction đồng thời.

Thông thường, **rollback segment header** (thường nằm ở trang đầu tiên của rollback segment) chịu trách nhiệm quản lý rollback segment. **History list** là một phần của rollback segment header, vai trò chính của nó là ghi lại undo log của tất cả các transaction đã commit nhưng chưa được dọn dẹp (purge). Danh sách này giúp purge thread tìm kiếm và dọn sạch các bản ghi undo log không còn cần thiết nữa.

Ngoài ra, cơ chế `MVCC` phụ thuộc chặt chẽ vào: **các trường ẩn (hidden fields), Read View, và undo log**. Trong cơ chế nội bộ, InnoDB phán đoán tính khả kiến (visibility) của dữ liệu thông qua trường `DB_TRX_ID` của dòng dữ liệu và `Read View` của transaction. Nếu không thể nhìn thấy, hệ thống sẽ dò tìm phiên bản lịch sử trong undo log thông qua con trỏ `DB_ROLL_PTR` của dòng dữ liệu. Mỗi transaction có thể nhìn thấy phiên bản dữ liệu khác nhau; trong cùng một transaction, người dùng chỉ có thể thấy các sửa đổi đã commit trước khi transaction đó tạo `Read View` cùng với các sửa đổi do chính transaction đó thực hiện.

## Tổng kết

> Phần nội dung này là phần bổ sung của JavaGuide:

MySQL InnoDB engine sử dụng **redo log** để đảm bảo **tính bền vững (durability)** của transaction, và sử dụng **undo log** để đảm bảo **tính nguyên tử (atomicity)** của transaction.

Các tác vụ **sao lưu dữ liệu (data backup), dự phòng nóng (active-standby), chủ-chủ (master-master), chủ-phụ (master-slave replication)** của cơ sở dữ liệu MySQL đều phụ thuộc vào binlog để đồng bộ hóa dữ liệu và đảm bảo tính nhất quán.

## Tài liệu tham khảo

- "45 bài giảng thực chiến MySQL"
- "Từ số 0 trở thành chuyên gia tối ưu hóa thực chiến MySQL"
- "Cách MySQL vận hành: Hiểu MySQL từ tận gốc rễ"
- "Công nghệ MySQL: InnoDB Storage Engine"
