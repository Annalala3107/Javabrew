---
title: "Giải thích chi tiết các giải pháp tạo Distributed ID: So sánh UUID, Snowflake, Segment Mode, Leaf và Tinyid"
category: Hệ thống phân tán (Distributed Systems)
description: "Giải thích chi tiết các giải pháp tạo Distributed ID, so sánh có hệ thống nguyên lý, ưu nhược điểm và kịch bản áp dụng của UUID, khóa chính tự tăng của cơ sở dữ liệu, Database Segment Mode (mô hình dải số), Redis, MongoDB ObjectId, Snowflake, Leaf, Tinyid, UidGenerator và IdGenerator."
tag:
  - Distributed ID
head:
  - - meta
    - name: keywords
      content: Distributed ID,Tạo Distributed ID,Snowflake,UUID,UUID v7,Segment Mode,Mô hình dải số,Leaf,Tinyid,UidGenerator,IdGenerator,ID duy nhất toàn cục,Câu hỏi phỏng vấn Distributed ID
lang: vi
sourceRef: zh-ref/distributed-system/distributed-id.md
---

## Giới thiệu về Distributed ID

Bài viết này chủ yếu bàn về "cách chọn giải pháp sinh ID", chẳng hạn như UUID, Database Segment (dải số), Redis, Snowflake, Leaf và Tinyid. Sau khi xem xong phần so sánh các phương án, nếu muốn tìm hiểu tiếp cách thiết kế các ID nghiệp vụ như mã đơn hàng, mã ưu đãi (coupon), TraceId hay URL rút gọn (Short URL), bạn có thể đọc [Thực chiến thiết kế Distributed ID](./distributed-id-design.md).

### ID là gì?

Trong quá trình phát triển hằng ngày, chúng ta cần dùng ID để định danh duy nhất cho các loại dữ liệu khác nhau trong hệ thống: chẳng hạn User ID định danh duy nhất một người dùng, Product ID định danh duy nhất một sản phẩm, Order ID định danh duy nhất một đơn hàng.

Trong đời sống thực tế cũng có nhiều loại ID, như số căn cước công dân định danh duy nhất một con người, mã địa chỉ định danh duy nhất một địa chỉ.

Nói một cách đơn giản, **ID chính là định danh duy nhất của dữ liệu**.

### Distributed ID là gì?

Distributed ID được nói đến ở đây chủ yếu chỉ loại ID dùng trong hệ thống phân tán để định danh duy nhất dữ liệu xuyên node, xuyên database, xuyên service. Nó giải quyết bài toán không được phép xung đột khi nhiều node đồng thời sinh ID.

Mình lấy một ví dụ đơn giản về Sharding (tách database và tách bảng).

Một dự án của công ty mình ban đầu sử dụng MySQL đơn máy. Nhưng không ngờ chỉ sau một tháng vận hành, lượng người dùng tăng ngày càng nhanh, tổng dung lượng dữ liệu phình to đến mức MySQL đơn máy không thể gánh nổi nữa nên phải tiến hành Sharding (tách database, tách bảng) — có thể cân nhắc các giải pháp như Apache ShardingSphere-JDBC, cụ thể tùy thuộc vào độ phức tạp của SQL, yêu cầu transaction, năng lực vận hành và kinh nghiệm của đội ngũ.

Sau khi tách database, dữ liệu nằm phân tán trên nhiều node cơ sở dữ liệu khác nhau, khóa chính tự tăng (Auto-Increment Primary Key) của từng database không thể đảm bảo khóa chính sinh ra là duy nhất toàn cục nữa. **Làm sao để sinh khóa chính duy nhất toàn cục cho các node dữ liệu khác nhau?**

Lúc này chính là lúc cần phải sinh **Distributed ID**.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/id-after-the-sub-table-not-conflict-84f5894b.png)

### Distributed ID cần đáp ứng những yêu cầu nào?

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-requirements-5808dd52.png)

Là một mắt xích không thể thiếu trong hệ thống phân tán, Distributed ID được sử dụng ở rất nhiều nơi.

Một Distributed ID cơ bản nhất cần đáp ứng những yêu cầu sau:

- **Duy nhất toàn cục (Global Uniqueness)**: Tính duy nhất toàn cục của ID là yêu cầu đầu tiên bắt buộc phải đáp ứng.
- **Hiệu năng cao (High Performance)**: Tốc độ sinh Distributed ID phải nhanh, tiêu tốn ít tài nguyên cục bộ.
- **Độ sẵn sàng cao (High Availability)**: Dịch vụ phát số (ID generator) phải có độ sẵn sàng cao, tránh trở thành điểm lỗi đơn (SPOF) trên luồng nghiệp vụ.
- **Dễ sử dụng**: Lấy ra dùng ngay, tiện lợi, tích hợp nhanh chóng!

Ngoài những điều trên, một Distributed ID tốt còn nên đảm bảo:

- **An toàn**: Không chứa thông tin nhạy cảm bên trong ID.
- **Tăng dần theo xu hướng (Trend-increasing)**: Nếu lưu ID vào cơ sở dữ liệu, ID tăng dần theo xu hướng thường có lợi hơn cho thao tác ghi chỉ mục cây B+ (B+ Tree Index). Nhiều kịch bản khóa chính cơ sở dữ liệu cần tính tăng dần theo xu hướng hơn là tăng nghiêm ngặt toàn cục; tăng nghiêm ngặt tuy tiện cho việc sắp xếp, nhưng thường kéo theo bộ phát số tập trung hoặc cơ chế điều phối mạnh, chi phí cao hơn nhiều.
- **Kiểm soát được ngữ nghĩa nghiệp vụ**: Việc có nhúng ngữ nghĩa nghiệp vụ vào ID hay không cần hết sức thận trọng. Ngữ nghĩa nghiệp vụ giúp dễ truy vết sự cố, nhưng cũng có thể làm rò rỉ quy mô kinh doanh, khu vực, thời gian, kênh bán hàng và khiến quy tắc ID gắn chặt với nghiệp vụ. Nhiều hệ thống có xu hướng giữ ID vô nghĩa (opaque) và tách thông tin nghiệp vụ ra các cột riêng.
- **Triển khai độc lập**: Tức là hệ thống phân tán có riêng một dịch vụ phát số độc lập chuyên dùng để sinh Distributed ID. Nhờ vậy, dịch vụ sinh ID được tách rời (decouple) khỏi các dịch vụ nghiệp vụ. Tuy nhiên, cách này lại làm tăng chi phí gọi qua mạng. Nhìn chung, nếu có nhiều kịch bản cần dùng Distributed ID thì việc triển khai dịch vụ phát số độc lập là rất cần thiết.

Cũng cần lưu ý rằng nguồn gốc của "tính duy nhất" ở các phương án khác nhau là không giống nhau:

- Khóa chính tự tăng của database và mô hình dải số (Segment Mode) dựa vào lưu trữ tập trung và cấp phát trong transaction.
- Phương án Redis dựa vào lệnh tăng nguyên tử trên một key đơn, chiến lược lưu trữ bền vững (persistence) và tính nhất quán Master-Slave.
- Snowflake dựa vào tổ hợp không xung đột giữa timestamp, Worker ID và sequence.
- UUID v4/v7 dựa vào chất lượng số ngẫu nhiên và chiến lược cài đặt của bộ sinh.
- Với các kịch bản khóa chính không thể dung thứ trùng lặp, khi ghi xuống database vẫn nên dùng ràng buộc duy nhất (`UNIQUE` constraint) làm lớp chốt chặn cuối cùng.

## Các phương án sinh ID dựa trên cơ sở dữ liệu (Stateful)

### Khóa chính tự tăng của cơ sở dữ liệu

Cách này tương đối đơn giản, trực quan: tận dụng ngay khóa chính tự tăng (`AUTO_INCREMENT`) của cơ sở dữ liệu quan hệ để sinh ID duy nhất.

![Khóa chính tự tăng của cơ sở dữ liệu](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/the-primary-key-of-the-database-increases-automa-58a463dd.png)

Lấy MySQL làm ví dụ, chúng ta có thể làm như sau.

**1. Tạo một bảng trong cơ sở dữ liệu.**

```sql
CREATE TABLE `sequence_id` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stub` char(10) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stub` (`stub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Cột `stub` không có ý nghĩa nghiệp vụ, chỉ dùng để giữ chỗ nhằm thuận tiện cho việc chèn hoặc sửa dữ liệu. Đồng thời, tạo Unique Index cho cột `stub` để đảm bảo tính duy nhất của nó.

**2. Chèn dữ liệu thông qua `REPLACE INTO`.**

```java
BEGIN;
REPLACE INTO sequence_id (stub) VALUES ('stub');
SELECT LAST_INSERT_ID();
COMMIT;
```

**⚠️ Rủi ro trong môi trường production của `REPLACE INTO`**:

Ngữ nghĩa của `REPLACE INTO` là: nếu dòng mới không xung đột với `PRIMARY KEY` hoặc `UNIQUE` index thì chèn thẳng; nếu xung đột thì xóa dòng cũ trước rồi mới chèn dòng mới. Số dòng bị ảnh hưởng có thể bằng tổng số dòng bị xóa cộng với số dòng được chèn.

- Mỗi thao tác đều kích hoạt xóa và xây dựng lại chỉ mục, gây áp lực lớn lên cơ sở dữ liệu.
- Nếu bảng có gắn trigger, thao tác `DELETE` sẽ vô tình kích hoạt các trigger đó.

**Phương án thay thế**: Nếu chỉ nhằm tăng bảng sequence, có thể dùng `INSERT ... ON DUPLICATE KEY UPDATE` hoặc `UPDATE` một dòng để tránh ngữ nghĩa xóa của `REPLACE`. Trong môi trường production, phổ biến hơn là mô hình dải số (Segment Mode): cập nhật một lần `current_max_id = current_max_id + step`, sau đó tự cấp phát trong bộ nhớ.

Ưu và nhược điểm của cách này cũng rất rõ ràng:

- **Ưu điểm**: Triển khai đơn giản, ID tăng tuần tự theo thứ tự, tốn ít không gian lưu trữ.
- **Nhược điểm**: Không chịu được mức đồng thời (concurrency) lớn; tồn tại điểm lỗi đơn của database (có thể nâng cao độ sẵn sàng bằng Primary-Standby, MGR, chia dải số nhiều DB, nhưng phải xử lý việc chuyển đổi Master-Slave, commit transaction, cấp phát trùng và lãng phí dải số); ID không mang ý nghĩa nghiệp vụ cụ thể; vấn đề bảo mật (chẳng hạn dựa vào quy luật tăng của mã đơn hàng có thể suy ra lượng đơn mỗi ngày — bí mật kinh doanh đấy!); mỗi lần lấy ID đều phải truy cập database (tăng áp lực lên database, tốc độ lấy ID cũng chậm).

### Mô hình dải số cơ sở dữ liệu (Database Segment Mode)

Với kiểu khóa chính tự tăng, mỗi lần lấy ID đều phải chạm tới cơ sở dữ liệu; khi nhu cầu ID lớn thì chắc chắn không thể đáp ứng nổi.

Nếu chúng ta lấy ID theo lô (batch), lưu trong bộ nhớ (RAM) rồi khi cần thì lấy thẳng từ bộ nhớ ra dùng, ta sẽ giảm được số lần truy cập database, cả độ trễ lẫn áp lực lên database đều giảm xuống. Đây chính là phương pháp **sinh Distributed ID dựa trên mô hình dải số (Segment Mode) của cơ sở dữ liệu**.

Mô hình dải số cơ sở dữ liệu hiện là một trong những phương án sinh Distributed ID chủ đạo. Chẳng hạn [Tinyid](https://github.com/didi/tinyid/wiki/tinyid原理介绍) do Didi mã nguồn mở cũng được xây dựng theo cách này, nhưng Tinyid tối ưu thêm bằng bộ nhớ đệm hai dải số (double-segment cache) và hỗ trợ đa cơ sở dữ liệu.

Lấy MySQL làm ví dụ, ta triển khai như sau.

**1. Tạo bảng cơ sở dữ liệu.**

```sql
CREATE TABLE `sequence_id_generator` (
  `id` INT NOT NULL,
  `current_max_id` BIGINT NOT NULL COMMENT 'ID lớn nhất hiện tại',
  `step` INT NOT NULL COMMENT 'Độ dài dải số (segment)',
  `version` INT NOT NULL COMMENT 'Số phiên bản (version)',
  `biz_type` INT NOT NULL COMMENT 'Loại nghiệp vụ',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_biz_type` (`biz_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Hai cột `current_max_id` và `step` chủ yếu dùng để lấy lô ID. Khoảng ID lấy được là `(current_max_id, current_max_id + step]`, tức không bao gồm chính giá trị `current_max_id` cũ. Ví dụ, khi `current_max_id = 0` và `step = 100`, sau khi cập nhật thành công thì khoảng ID có thể cấp phát lần này là `1~100`.

![Mô hình dải số cơ sở dữ liệu](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/database-number-segment-mode-c2fbd568.png)

Cột `version` chủ yếu dùng để giải quyết xung đột đồng thời (khóa lạc quan - `Optimistic Lock`). Luồng đầy đủ như sau:

```sql
-- 1. Đọc giá trị hiện tại
SELECT current_max_id, step, version FROM sequence_id_generator WHERE biz_type = 101;
-- 2. Cập nhật CAS (version đóng vai trò số phiên bản khóa lạc quan)
UPDATE sequence_id_generator
SET current_max_id = current_max_id + step, version = version + 1
WHERE version = {version vừa đọc} AND biz_type = 101;
-- 3. Kiểm tra affected_rows: bằng 1 là thành công, bằng 0 là bị Thread khác giành trước, cần thử lại
```

Sau khi thực thi `UPDATE ... WHERE version = ?`, bắt buộc phải kiểm tra `affected_rows`. Nếu kết quả bằng 0, chứng tỏ dải số đã bị instance khác lấy mất, cần đọc lại `current_max_id` và `version` rồi thử lại.

> **⚠️ Lưu ý Retry khi đồng thời cao**: Tại thời điểm dải số vừa cạn kiệt, nhiều Thread có thể đồng thời tranh giành dải số mới, khiến thao tác cập nhật `CAS` thất bại. Ở tầng code cần triển khai **vòng lặp Retry có giới hạn số lần** (ví dụ 3 lần) kèm Exponential Backoff (lùi lũy thừa) để đảm bảo tính ổn định cho request. Nếu thử lại vẫn thất bại, nên chặn chờ (block) cho đến khi dải số tiếp theo tải xong, hoặc kích hoạt cảnh báo và chuyển sang cơ chế ngắt mạch / giáng cấp (Circuit Breaking / Degradation). **Không khuyến khích trả về cái gọi là "ID giáng cấp"**, vì có thể phá vỡ cam kết duy nhất toàn cục.

`biz_type` chủ yếu dùng để biểu thị loại nghiệp vụ.

**2. Chèn trước một dòng dữ liệu.**

```sql
INSERT INTO `sequence_id_generator` (`id`, `current_max_id`, `step`, `version`, `biz_type`)
VALUES
 (1, 0, 100, 0, 101);
```

**3. Thông qua `SELECT` để lấy lô ID duy nhất cho nghiệp vụ chỉ định.**

```sql
SELECT `current_max_id`, `step`, `version` FROM `sequence_id_generator` WHERE `biz_type` = 101
```

Kết quả:

```plain
id current_max_id step version biz_type
1 0 100 0 101
```

**4. Nếu dùng hết thì cập nhật rồi `SELECT` lại.**

```sql
UPDATE sequence_id_generator SET current_max_id = 0 + 100, version = version + 1 WHERE version = 0 AND `biz_type` = 101
SELECT `current_max_id`, `step`, `version` FROM `sequence_id_generator` WHERE `biz_type` = 101
```

Kết quả:

```plain
id current_max_id step version biz_type
1 100 100 1 101
```

So với cách dùng khóa chính tự tăng của database, **mô hình dải số giúp số lần truy cập database ít hơn hẳn và áp lực lên database nhỏ hơn nhiều.**

Ngoài ra, để tránh điểm lỗi đơn, có thể tăng độ sẵn sàng qua mô hình Master-Slave hoặc triển khai đa database. Nếu dùng Master-Slave, lệnh cập nhật phát số bắt buộc phải đi qua Master và phải đảm bảo sau khi Failover không bị lùi về `current_max_id` cũ; còn mô hình đa database phải đảm bảo dải số, bước nhảy (`step`) hoặc phân mảnh nghiệp vụ của mỗi DB không chồng chéo lên nhau.

Mô hình dải số cũng kéo theo vấn đề "nhảy số" (ID gaps): sau khi xin dải số, instance thường cache trong bộ nhớ; nếu instance sập hoặc khởi động lại, phần dải số chưa dùng hết sẽ bị lãng phí. Việc lãng phí dải số không ảnh hưởng tới tính duy nhất, nhưng khiến ID không liên tục; tuyệt đối đừng vì muốn liên tục mà thu hồi dải số đã cấp phát nhưng chưa dùng, nếu không có thể phát sinh ID trùng lặp. Trong môi trường production cần giám sát tốc độ tiêu thụ dải số, tỷ lệ tải thất bại và số lần Retry.

**Ưu nhược điểm của mô hình dải số cơ sở dữ liệu:**

- **Ưu điểm**: ID tăng dần theo xu hướng, tốn ít không gian lưu trữ.
- **Nhược điểm**: Vẫn tồn tại điểm lỗi đơn của database (có thể tăng độ sẵn sàng bằng Master-Slave, đa database, nhưng làm tăng độ phức tạp), ID không mang ý nghĩa nghiệp vụ cụ thể, vấn đề bảo mật (chẳng hạn dựa vào quy luật tăng của ID đơn hàng vẫn suy ra được lượng đơn mỗi ngày — bí mật kinh doanh!).

### NoSQL

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/nosql-distributed-id-7307828c.png)

Thông thường, phương án NoSQL sử dụng Redis nhiều hơn. Ta chỉ cần dùng lệnh `INCR` của Redis là có thể hiện thực hóa việc tăng ID tuần tự một cách nguyên tử (`Atomic`).

```bash
127.0.0.1:6379> set sequence_id_biz_type 1
OK
127.0.0.1:6379> incr sequence_id_biz_type
(integer) 2
127.0.0.1:6379> get sequence_id_biz_type
"2"
```

Để nâng cao độ sẵn sàng và khả năng xử lý đồng thời, có thể dùng Redis Cluster — giải pháp phân cụm chính thức của Redis (từ phiên bản 3.0+).

Trước đây Codis từng là một giải pháp Redis Cluster mã nguồn mở phổ biến, nhưng dự án đã ngừng hoạt động tích cực từ lâu. Các dự án mới nhìn chung nên ưu tiên đánh giá Redis Cluster, dịch vụ Redis cụm của nhà cung cấp cloud hoặc dịch vụ quản lý tương thích giao thức Redis; Codis phù hợp hơn để duy trì các hệ thống cũ và cần đánh giá kỹ trạng thái bảo trì trước khi sử dụng.

Ngoài độ sẵn sàng cao và đồng thời cao, vì Redis lưu trữ trên RAM nên ta cần lưu trữ bền vững dữ liệu (Persistence) để tránh mất dữ liệu khi máy khởi động lại hoặc gặp sự cố. Redis hỗ trợ hai cơ chế lưu trữ bền vững khác nhau: **Snapshot (`RDB`)** và **Append-Only File (`AOF`)**. Hơn nữa, từ Redis 4.0 đã hỗ trợ **lưu trữ bền vững kết hợp RDB và AOF**, được điều khiển bởi tham số `aof-use-rdb-preamble`: trong file cấu hình mẫu Redis 4.0 mặc định tắt, còn trong file cấu hình mẫu Redis 5.0+ mặc định bật. Giá trị mặc định cụ thể cần căn cứ vào phiên bản Redis mục tiêu, file cấu hình và thiết lập của dịch vụ cloud managed.

Về cơ chế Persistence của Redis, ở đây mình không đi sâu thêm. Bạn nào chưa nắm rõ có thể tham khảo bài viết [Giải thích chi tiết cơ chế Persistence của Redis](https://javaguide.cn/database/redis/redis-persistence.html).

Mặc dù Redis `INCR` có hiệu năng rất tốt, nhưng Persistence của Redis chỉ giảm thiểu rủi ro mất dữ liệu khi tiến trình khởi động lại chứ không thể triệt tiêu hoàn toàn hiện tượng lùi ID (ID rollback). Đặc biệt trong các kịch bản `appendfsync everysec`, RDB snapshot, nhân bản bất đồng bộ Master-Slave và Failover, kết quả `INCR` gần nhất đều có khả năng bị mất. Cần đặc biệt chú ý các kịch bản lỗi sau:

1. **Độ trễ Persistence dẫn đến lùi ID**

   - **Kịch bản**: Sau khi thực thi `INCR`, Redis bị sập trước khi kịp ghi RDB/AOF xuống đĩa.
   - **Hậu quả**: Sau khi khởi động lại, ID bị lùi về giá trị đã lưu gần nhất, có khả năng sinh ra ID trùng lặp.

2. **AOF Rewrite gây chặn ngắn hạn**

   - **Kịch bản**: File AOF quá lớn kích hoạt thao tác viết lại (Rewrite).
   - **Hậu quả**: Tiến trình chính `fork` tiến trình con có thể gây giật hiệu năng trong chốc lát.

3. **Điểm nóng một shard đơn trong Redis Cluster**

   - **Kịch bản**: Một key bộ đếm duy nhất luôn rơi vào đúng một shard duy nhất của cụm.
   - **Hậu quả**: Dưới mức đồng thời cao, shard đó có thể trở thành nút thắt cổ chai.

4. **Chuyển đổi dự phòng (Failover) khi nhân bản bất đồng bộ Master-Slave**
   - **Kịch bản**: Khi node Master gặp sự cố chuyển sang node Slave, giá trị `INCR` trên Slave có thể chậm hơn so với Master.
   - **Hậu quả**: ID trên node Master mới có thể bị lùi về giá trị cũ.

**Khuyến nghị cấu hình production**:

```conf
# Cấu hình tham khảo cho Redis 7.0+
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes  # Lưu trữ bền vững kết hợp (RDB+AOF)
```

- **Tối ưu từ Redis 7.0+**: Multi-part AOF cải thiện cách tổ chức và quản lý các file base/incr trong quá trình AOF Rewrite, nhưng `fork`, Disk I/O và chiến lược `fsync` vẫn có thể gây biến động độ trễ.
- **Ranh giới áp dụng**: Redis phù hợp với số thứ tự giao dịch (serial number), bộ đếm chu kỳ ngắn và các kịch bản có lớp nghiệp vụ chống trùng hỗ trợ phía sau. Nếu yêu cầu tính duy nhất ở mức cực cao — như khóa chính lõi kiểu mã đơn hàng tài chính hay mã giao dịch thanh toán — cần kết hợp chống trùng ở tầng nghiệp vụ, chiến lược Persistence, chiến lược nhất quán Master-Slave và ràng buộc duy nhất dưới DB, hoặc chuyển sang mô hình dải số DB, Leaf, v.v.

**Ưu nhược điểm của phương án Redis:**

- **Ưu điểm**: Hiệu năng rất ổn, và với một key đơn trên một Master vận hành bình thường thì ID sinh ra tăng dần.
- **Nhược điểm**: Tương tự các nhược điểm của phương án khóa chính tự tăng trong database, đồng thời còn có rủi ro trễ Persistence, điểm nóng đơn shard và lùi ID khi chuyển đổi Master-Slave.

Ngoài Redis, MongoDB ObjectId cũng thường xuyên được tận dụng làm giải pháp Distributed ID.

![MongoDB ObjectId Specification](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/mongodb9-objectId-distributed-id-c769ae0a.png)

MongoDB ObjectId chiếm tổng cộng 12 byte lưu trữ:

- 0~3: Unix Timestamp tính theo giây (4 byte)
- 4~8: Giá trị ngẫu nhiên (5 byte, sinh một lần cho mỗi tiến trình client để phân biệt máy và tiến trình)
- 9~11: Bộ đếm tự tăng (3 byte, tăng dần bên trong từng tiến trình client)

ObjectId là định danh duy nhất có thứ tự gần đúng không cần điều phối tập trung, thường đáp ứng tốt cho trường `_id` của document, nhưng nó không phải là chuỗi đơn điệu nghiêm ngặt toàn cục: nó chỉ có độ phân giải thời gian theo giây nên các ObjectId sinh trong cùng một giây không đảm bảo thứ tự nghiêm ngặt; đồng thời thời gian hệ thống giữa các máy client khác nhau cũng có thể sai lệch.

**Ưu nhược điểm của phương án MongoDB:**

- **Ưu điểm**: Hiệu năng tốt và ID sinh ra có thứ tự gần đúng theo thời gian tạo.
- **Nhược điểm**: Không tăng đơn điệu nghiêm ngặt; khi đồng hồ giữa các máy không khớp, kết quả sắp xếp có thể không phản ánh đúng thứ tự tạo thực tế; ngoài ra ID chứa thông tin thời gian nên có tính quy luật nhất định.

## Các phương án sinh ID dựa trên thuật toán (Stateless)

### UUID

UUID là viết tắt của Universally Unique Identifier (Định danh duy nhất toàn cầu), bản chất là một định danh 128 bit. Dạng chuỗi chuẩn thường dài 36 ký tự (bao gồm dấu gạch nối), bỏ dấu gạch nối còn 32 ký tự hệ thập lục phân (hex).

JDK đã cung cấp sẵn phương thức sinh UUID, chỉ cần một dòng code là xong.

```java
// Ví dụ đầu ra: cb4a9ede-fa5e-4585-b9bb-d60bce986eaa
UUID.randomUUID()
```

[RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) đã thay thế [RFC 4122](https://tools.ietf.org/html/rfc4122), chuẩn hóa lại UUID và bổ sung thêm v6, v7, v8. Tài liệu cũ vẫn hay nhắc tới RFC 4122, nhưng bài viết mới nên lấy RFC 9562 làm chuẩn. Hình minh họa cấu trúc UUID như sau:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/rfc-4122-uuid-14fbf6c0.png)

Ở đây chúng ta chú trọng vào trường Version (phiên bản), bởi mỗi phiên bản tương ứng với một quy tắc sinh UUID khác nhau.

Ý nghĩa của 8 giá trị Version khác nhau (tham khảo [bài viết Wikipedia về UUID](https://zh.wikipedia.org/wiki/通用唯一识别码)):

- **Version 1 (dựa trên thời gian và Node ID)**: Sinh từ timestamp (thường là thời gian hiện tại) và Node ID (thường là địa chỉ MAC của thiết bị). Khi chứa địa chỉ MAC, có thể đảm bảo tính duy nhất toàn cầu, nhưng vì thế lại tiềm ẩn nguy cơ lộ thông tin riêng tư.
- **Version 2 (dựa trên định danh cục bộ, thời gian và Node ID)**: Tương tự Version 1, cũng dựa trên thời gian và Node ID, nhưng nhúng thêm định danh cục bộ (ví dụ User ID hoặc Group ID).
- **Version 3 (dựa trên Namespace và Name dùng hàm băm MD5)**: Dùng thuật toán băm MD5 kết hợp định danh Namespace (một UUID) và chuỗi Name. Cùng một Namespace và Name luôn sinh ra cùng một UUID (**sinh tất định - deterministic**).
- **Version 4 (dựa trên số ngẫu nhiên)**: Sử dụng bộ sinh số giả ngẫu nhiên (PRNG) hoặc bộ sinh số ngẫu nhiên an toàn mật mã (CSPRNG). UUID v4 có 122 bit ngẫu nhiên, không gian giá trị 2^122; tính theo nghịch lý ngày sinh (Birthday Paradox), phải sinh tới khoảng 2^61 UUID thì xác suất đụng độ mới tiệm cận 50%. Trong ứng dụng thực tế có thể coi là duy nhất, nhưng về mặt lý thuyết vẫn là đảm bảo theo xác suất.
- **Version 5 (dựa trên Namespace và Name dùng hàm băm SHA-1)**: Tương tự Version 3, nhưng dùng thuật toán băm SHA-1.
- **Version 6 (dựa trên timestamp, bộ đếm và Node ID)**: Cải tiến từ Version 1 bằng cách đưa timestamp lên các bit cao nhất (Most Significant Bit — MSB), giúp UUID có thể sắp xếp trực tiếp theo thời gian.
- **Version 7 (dựa trên Unix timestamp mili-giây)**: Phần bit cao là Unix timestamp 48 bit tính theo mili-giây; các bit còn lại sau khi trừ bit version và variant dùng cho số ngẫu nhiên, đồng thời cho phép cài đặt sử dụng thời gian dưới mức mili-giây hoặc bộ đếm để tăng tính đơn điệu trong cùng một mili-giây. Với các hệ thống mới cần sắp xếp theo thời gian và không có ràng buộc tương thích đặc biệt, UUID v7 thường được khuyến khích hơn v1/v6; tuy nhiên với hệ thống cũ, khả năng tương thích giao thức và định dạng dữ liệu hiện có vẫn cần đánh giá riêng.
- **Version 8 (thử nghiệm / tùy biến theo nhà cung cấp)**: **Dành 122 bit cho phần cài đặt tự định nghĩa**, chỉ yêu cầu cố định bit version và variant. Phù hợp các kịch bản cần nhúng thêm thông tin bổ sung hoặc có giới hạn ứng dụng đặc thù. **Tính duy nhất do cài đặt tự đảm bảo, không thể mặc định giả định sẵn.**

Dưới đây là ví dụ kết quả sinh UUID v1:

![Ví dụ kết quả sinh UUID v1](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/version1-uuid-f0406509.png)

Trong JDK, phiên bản UUID được tạo mặc định bởi phương thức `UUID.randomUUID()` là 4.

```java
UUID uuid = UUID.randomUUID();
int version = uuid.version();// 4
```

Ngoài ra, Variant (biến thể) cũng có 4 giá trị khác nhau ứng với các ý nghĩa riêng. Ở đây xin không đi sâu vì thường ngày cũng ít khi cần bận tâm tới.

Khi nào cần dùng, bạn có thể xem phần giới thiệu về Variant của UUID trên Wikipedia.

Từ phần trình bày trên có thể thấy, với điều kiện cài đặt đúng đắn và độ ngẫu nhiên đủ tốt, về mặt kỹ thuật có thể coi UUID là duy nhất. Tính duy nhất của v4 bản chất là đảm bảo theo xác suất; v1/v6 phụ thuộc vào Node ID và timestamp nên có rủi ro rò rỉ riêng tư; còn tính duy nhất của v7/v8 phụ thuộc vào chiến lược cài đặt.

Mặc dù về mặt kỹ thuật có thể coi UUID là duy nhất toàn cục, nhưng chúng ta thường rất ít khi dùng nó làm khóa chính.

Ví dụ, việc dùng các UUID không theo thứ tự thời gian như UUID v4 làm khóa chính cơ sở dữ liệu MySQL là cực kỳ không phù hợp:

- Khóa chính cơ sở dữ liệu nên càng ngắn càng tốt. Bản chất UUID là 128 bit: nếu lưu dạng chuỗi thì thường dài 36 ký tự có dấu gạch nối hoặc 32 ký tự hex; nếu lưu dạng nhị phân có thể nén xuống còn 16 byte.
- Các UUID không theo thứ tự thời gian như UUID v4 là mất trật tự; dưới engine InnoDB, tính mất trật tự của khóa chính sẽ ảnh hưởng nghiêm trọng tới hiệu năng cơ sở dữ liệu.

UUID v7 ([RFC 9562](https://www.rfc-editor.org/rfc/rfc9562)) là một phương án thay thế được chuẩn hóa, có thứ tự theo xu hướng và không cần cấp phát Worker ID:

UUID v7 không cần phải phân bổ Worker ID như Snowflake, chi phí tích hợp thấp; nhưng nó vẫn phụ thuộc vào chất lượng số ngẫu nhiên và cách cài đặt bộ sinh. Với các kịch bản khóa chính không chấp nhận trùng lặp, vẫn không thể thiếu ràng buộc duy nhất của cơ sở dữ liệu.

| Đặc tính | Snowflake | UUID v7 |
| --- | --- | --- |
| **Quản lý Worker ID** | Cần cấp phát tập trung (ZK/etcd) | Không cần cấp phát, dùng ngay |
| **Rủi ro quay ngược đồng hồ** | Cần xử lý bổ sung | Cho phép xáo trộn thứ tự trong phạm vi mili-giây; khi đồng hồ quay ngược, bộ sinh cần cài đặt cơ chế giữ tính đơn điệu |
| **Thân thiện với cây B+** | Tăng dần theo xu hướng | Có thứ tự theo xu hướng |
| **Tính chuẩn hóa** | Mỗi nơi cài đặt một kiểu | Chuẩn RFC, tương thích đa ngôn ngữ |
| **Cấu trúc** | 64 bit (tùy chỉnh) | 128 bit (timestamp 48 bit + trường ngẫu nhiên/bộ đếm) |

**Kịch bản phù hợp**: Hệ thống phân tán quy mô vừa và nhỏ, không cần tới mức hiệu năng/độ gọn của Snowflake, muốn giảm chi phí vận hành Worker ID.

UUID v7 thân thiện hơn UUID v4 đối với thao tác ghi cục bộ trên cây B+, nhưng nó vẫn là 128 bit — chiếm nhiều dung lượng hơn Snowflake ID 64 bit. Trong cơ sở dữ liệu, nên ưu tiên dùng `BINARY(16)` hoặc kiểu `uuid` gốc (native) thay vì dùng thẳng khóa chính dạng chuỗi; các bảng có tần suất ghi cao vẫn cần kiểm thử tải (load test) hiện tượng tách trang (page split), kích thước index và tỷ lệ trúng cache.

**UUID v8 (mục đích thử nghiệm)**: Nếu cần nhúng thông tin bổ sung (như định danh nghiệp vụ, thông tin cụm) hoặc có ràng buộc ứng dụng đặc biệt, có thể cân nhắc UUID v8. Nhưng cần lưu ý: **tính duy nhất của v8 do cài đặt tự đảm bảo, không thể giả định tương thích với các cài đặt khác**.

⚠️ **Lưu ý**: Hỗ trợ ở phía cơ sở dữ liệu vẫn đang trong quá trình phổ cập. PostgreSQL 18 (phát hành ngày 25-09-2025) bắt đầu cung cấp hàm tích hợp `uuidv7()` để sinh UUID có thứ tự thời gian. Hàm `UUID()` của MySQL 8.0 sinh ra UUID gắn với thời gian và node, thường được xem là kiểu v1; `UUID_TO_BIN(uuid, 1)` có thể sắp xếp lại phần thời gian để cải thiện tính cục bộ của index, nhưng nó không phải hàm sinh UUID v7. UUID v7 thường vẫn cần được sinh ở tầng ứng dụng hoặc qua hàm tự định nghĩa.

Cuối cùng, hãy cùng phân tích nhanh **ưu và nhược điểm của UUID** (rất hay bị hỏi khi phỏng vấn đấy nhé!):

- **Ưu điểm**: Tốc độ sinh thường khá nhanh, đơn giản dễ dùng.
- **Nhược điểm**: Tiêu tốn nhiều không gian lưu trữ, kém an toàn (thuật toán sinh UUID dựa trên địa chỉ MAC có thể làm lộ địa chỉ MAC), nhiều phiên bản không có tính tăng dần nghiêm ngặt, không mang ý nghĩa nghiệp vụ cụ thể; với các kịch bản đòi hỏi tính duy nhất cực cao, vẫn cần đánh giá chất lượng số ngẫu nhiên, chiến lược cài đặt và cơ chế xử lý trùng lặp.

### Snowflake (Thuật toán bông tuyết)

Snowflake là thuật toán sinh Distributed ID mã nguồn mở của Twitter. Snowflake gồm 64 bit nhị phân chia thành nhiều phần, mỗi phần lưu trữ dữ liệu mang ý nghĩa riêng:

![Cấu trúc Snowflake](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/snowflake-distributed-id-schematic-diagram-27d812a5.png)

- **sign (1 bit)**: Bit dấu (biểu thị âm/dương), luôn bằng 0, đại diện cho ID sinh ra là số dương.
- **timestamp (41 bits)**: Tổng cộng 41 bit dùng để biểu thị **timestamp tương đối** (số mili-giây tính từ mốc gốc tùy chỉnh), đủ dùng trong 2^41 mili-giây (khoảng 69 năm). Thông thường mốc gốc được chọn là ngày hệ thống chính thức vận hành (ví dụ 2020-01-01) thay vì kỷ nguyên Unix.
- **datacenter id + worker id (10 bits)**: Thông thường 5 bit đầu biểu thị Datacenter ID (mã trung tâm dữ liệu), 5 bit sau biểu thị Worker ID (mã máy), trong dự án thực tế có thể điều chỉnh linh hoạt. Nhờ đó phân biệt được các node thuộc các cụm/trung tâm dữ liệu khác nhau.
- **sequence (12 bits)**: Tổng cộng 12 bit dùng để biểu thị số thứ tự (sequence number) tự tăng. Với thiết kế sequence 12 bit tiêu chuẩn, một Worker đơn lẻ có thể sinh tối đa 4096 số thứ tự mỗi mili-giây; nếu điều chỉnh số bit sequence hoặc áp dụng thuật toán cải tiến thì ngưỡng trần này sẽ thay đổi.

> **⚠️ Cảnh báo đồng thời cao (Snowflake tiêu chuẩn)**: Cài đặt tiêu chuẩn chỉ cho phép mỗi node sinh tối đa 4096 số thứ tự trong một mili-giây. Nếu lượng request đồng thời trong một mili-giây vượt quá 4096, một số cài đặt sẽ chặn chờ (block) đến mili-giây kế tiếp, có thể gây ra gai độ trễ (Latency Spike) tại các thời điểm cao điểm như Flash Sale hoặc khuyến mãi lớn. Một số biến thể cải tiến (như bản cải tiến của Seata hoặc IdGenerator) giảm thiểu giới hạn này bằng cách cho tổ hợp timestamp/sequence tăng tổng thể hoặc "mượn thời gian tương lai", nhưng đánh đổi là timestamp sinh ra có thể tạm thời vượt trước thời gian vật lý thực tế. Môi trường production cần đánh giá QPS đỉnh, khi cần thiết có thể chia mảnh nhiều instance hoặc cải tạo thuật toán để tăng số bit cho `sequence`.

Trong dự án thực tế, chúng ta thường tùy biến lại thuật toán Snowflake — phổ biến nhất là nhúng thêm thông tin loại nghiệp vụ vào ID do Snowflake sinh ra.

#### Vấn đề quay ngược đồng hồ (Clock Rollback) của Snowflake và cách giải quyết

**Nguyên nhân gốc rễ**: Đồng bộ NTP, chỉnh giờ thủ công hoặc trôi đồng hồ phần cứng đều có thể khiến thời gian hệ thống bị lùi lại.

**So sánh các giải pháp**:

| Giải pháp | Ưu điểm | Nhược điểm | Kịch bản phù hợp |
| --- | --- | --- | --- |
| **Từ chối phục vụ** | Cài đặt đơn giản | Hoàn toàn không khả dụng trong suốt thời gian đồng hồ bị quay ngược | Kịch bản không yêu cầu quá cao về độ sẵn sàng |
| **Chờ đuổi kịp thời gian** | Đảm bảo tính duy nhất của ID | Nếu biên độ quay ngược lớn sẽ bị block lâu, dễ ảnh hưởng nghiệp vụ | Kịch bản độ lệch quay ngược cực nhỏ |
| **Worker ID dự phòng** | Độ sẵn sàng cao | Cài đặt phức tạp, phải xử lý Lease, Split-Brain và khôi phục instance cũ | Hệ thống đã có sẵn Registry / cơ chế Lease tin cậy |

Worker ID dự phòng là một phương án tùy chọn chứ không phải khuyến nghị phổ quát; nó phù hợp với các hệ thống đã có sẵn Registry hoặc cơ chế Lease tin cậy. Các cách xử lý phổ biến hơn bao gồm: chờ đợi nếu lệch nhỏ, từ chối phát số nếu vượt ngưỡng, lưu bền vững `last timestamp`, và đảm bảo tính duy nhất của Lease cho Worker ID thông qua Registry. Các vấn đề về Lease, Split-Brain và khôi phục instance cũ liên quan ở đây có thể kết hợp đọc thêm [Giải thích chi tiết về điều phối phân tán](./protocol/centralized-and-decentralized.md).

#### Bài toán phân bổ Worker ID trong Snowflake

Trong môi trường **triển khai container hóa (Kubernetes)**, việc phân bổ Worker ID cho Snowflake trở thành điểm đau lớn nhất:

**Kịch bản vấn đề**:

- IP và tên của Pod mang tính động, sẽ thay đổi sau mỗi lần khởi động lại.
- Không thể cấu hình sẵn Worker ID cố định như trên máy vật lý.
- Khi tự động mở rộng hoặc thu hẹp quy mô (auto-scaling), cần xin cấp và giải phóng Worker ID một cách linh hoạt.

**Các giải pháp chủ đạo**:

| Giải pháp | Cách triển khai | Ưu điểm | Nhược điểm |
| --- | --- | --- | --- |
| **Đăng ký qua ZooKeeper** | Khi service khởi động sẽ tạo Ephemeral Node trên ZK và lấy số thứ tự của node làm Worker ID | Tự động thu hồi, tự giải phóng khi sập | Phụ thuộc ZK, tăng độ phức tạp vận hành |
| **Đăng ký qua Redis** | Dùng `SETNX` + thời gian hết hạn để đăng ký Worker ID | Nhẹ, không cần thành phần bổ sung | Cần xử lý kịch bản Redis bị sập |
| **Cấp phát qua Database** | Cấp phát từ database lúc khởi động và lưu xuống file cục bộ | Đơn giản, đáng tin cậy | Phụ thuộc database |
| **Worker ID động** | Dùng hàm băm từ Pod IP hoặc UID để sinh Worker ID | Không cần thành phần tập trung | Có khả năng xảy ra xung đột băm (Hash Collision) |

**Khuyến nghị**: Trong môi trường production có thể sử dụng Leaf của Meituan (chế độ Snowflake dựa vào ZooKeeper để quản lý `workId`), hoặc dùng giải pháp theo mô hình dải số như Tinyid của Didi để né hoàn toàn bài toán phân bổ Worker ID.

Hãy xem lại ưu và nhược điểm của thuật toán Snowflake:

- **Ưu điểm**: Tốc độ sinh khá nhanh, ID sinh ra tăng dần theo thứ tự, khá linh hoạt (có thể dễ dàng tùy biến thuật toán Snowflake như nhúng thêm ID nghiệp vụ).
- **Nhược điểm**: **Rủi ro quay ngược đồng hồ** (cần xử lý bổ sung như trình bày ở trên); phụ thuộc vào mã máy nên không thân thiện với môi trường phân tán động (khi cần tự động bật/tắt hoặc thêm/bớt máy, mã máy cố định sẽ kém linh hoạt).

Nếu muốn dùng thuật toán Snowflake, nhìn chung bạn không cần tự phát minh lại bánh xe. Trong production nên ưu tiên đánh giá các cài đặt đã trưởng thành như Leaf, Tinyid, IdGenerator hoặc dịch vụ phát số của nhà cung cấp cloud, nhưng cần lựa chọn dựa trên trạng thái bảo trì, hệ sinh thái ngôn ngữ, chiến lược xử lý quay ngược đồng hồ, cách cấp phát Worker ID và kết quả kiểm thử tải.

Nếu muốn giải mã ngược thông tin từ Snowflake ID, cần xử lý đúng theo phân bổ bit thực tế. Lấy cấu trúc phổ biến `41-bit timestamp + 10-bit worker + 12-bit sequence` làm ví dụ: dịch phải 22 bit sẽ thu được timestamp tương đối, cộng thêm epoch tùy chỉnh sẽ ra thời gian tạo; dùng bitmask để tách lấy Worker ID và sequence. Chỉ cần thay đổi số bit hoặc epoch, logic giải mã cũng bắt buộc phải điều chỉnh đồng bộ.

Ngoài ra, Seata cũng từng đề xuất "thuật toán Snowflake cải tiến", tối ưu lại thuật toán Snowflake nguyên bản để giải quyết vấn đề quay ngược đồng hồ và nâng cao QPS đáng kể. Về giới thiệu chi tiết và nguyên lý cải tiến, bạn có thể tham khảo hai bài viết dưới đây:

- [Phân tích trình sinh UUID phân tán dựa trên thuật toán Snowflake cải tiến của Seata](https://seata.io/zh-cn/blog/seata-analysis-UUID-generator.html)
- [Bắt gặp một thuật toán Snowflake cải tiến trong dự án mã nguồn mở, giờ nó là của bạn rồi đấy](https://www.cnblogs.com/thisiswhy/p/17611163.html)

## So sánh các framework Distributed ID mã nguồn mở cấp công nghiệp

Khi đánh giá các framework dạng này, đừng chỉ nhìn vào danh sách tính năng mà hãy quan tâm tới nhiều khía cạnh thực tế production: dự án còn được bảo trì không, mức độ sôi nổi của release/commit/issue gần đây, các thành phần phụ thuộc (MySQL, Redis, ZooKeeper, etcd, v.v.), chiến lược xử lý quay ngược đồng hồ, chiến lược phân bổ Worker ID, mô hình client library hay server độc lập, cũng như độ trễ P99/TP999 dưới điều kiện kiểm thử tải.

### UidGenerator (Baidu)

[UidGenerator](https://github.com/baidu/uid-generator) là trình sinh ID duy nhất dựa trên Snowflake do Baidu mã nguồn mở.

Tuy nhiên, UidGenerator đã cải tiến Snowflake với cấu trúc ID duy nhất được sinh ra như sau:

![Cấu trúc ID do UidGenerator sinh ra](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/uidgenerator-distributed-id-schematic-diagram-851d54b5.png)

- **sign (1 bit)**: Bit dấu (biểu thị âm/dương), luôn bằng 0, đại diện ID sinh ra là số dương.
- **delta seconds (28 bits)**: Thời gian hiện tại dưới dạng giá trị gia tăng theo đơn vị giây so với mốc thời gian gốc `"2016-05-20"`, hỗ trợ tối đa khoảng 8,7 năm.
- **worker id (22 bits)**: Mã máy, hỗ trợ tối đa khoảng 4,2 triệu lần khởi động máy. Cài đặt tích hợp sẵn cấp phát từ database lúc khởi động; chiến lược mặc định là dùng một lần rồi bỏ, sau có thể tự bổ sung chiến lược tái sử dụng.
- **sequence (13 bits)**: Chuỗi đồng thời trong mỗi giây, 13 bit hỗ trợ tối đa 8192 request đồng thời mỗi giây.

Có thể thấy cấu trúc này khác một chút so với ID duy nhất do Snowflake nguyên bản sinh ra. Hơn nữa, tất cả các tham số bit trên đều có thể tùy chỉnh được.

Phần giới thiệu trong tài liệu chính thức của UidGenerator như sau:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/uidgenerator-introduction-official-documents-b6c7ed06.png)

Repository chính thức của UidGenerator đã ngừng hoạt động tích cực từ lâu; các dự án mới không nên chỉ vì danh tiếng mà chọn dùng ngay, cần đánh giá trước trạng thái bảo trì, an toàn các thư viện phụ thuộc và hệ sinh thái fork. Nếu muốn tìm hiểu sâu hơn, bạn có thể xem [tài liệu giới thiệu chính thức của UidGenerator](https://github.com/baidu/uid-generator/blob/master/README.zh_cn.md).

### Leaf (Meituan)

[Leaf](https://github.com/Meituan-Dianping/Leaf) là một giải pháp Distributed ID do Meituan mã nguồn mở. Tên gọi Leaf (chiếc lá) bắt nguồn từ câu nói nổi tiếng của nhà triết học, toán học người Đức Leibniz: "There are no two identical leaves in the world" (Trên đời không có hai chiếc lá nào giống hệt nhau). Cách đặt tên này cũng khá ấn tượng.

Leaf cung cấp cả hai chế độ là **Segment Mode (mô hình dải số)** và **Snowflake** để sinh Distributed ID. Không chỉ hỗ trợ dải số kép, nó còn giải quyết vấn đề quay ngược đồng hồ hệ thống của Snowflake ID. Tuy vậy, việc giải quyết vấn đề đồng hồ cần phụ thuộc yếu vào ZooKeeper (dùng ZooKeeper làm Registry, quản lý `workId` thông qua việc đọc và tạo các node con dưới một đường dẫn chỉ định).

Sự ra đời của Leaf chủ yếu nhằm giải quyết tình trạng các tuyến nghiệp vụ khác nhau trong Meituan dùng quá nhiều cách sinh Distributed ID rời rạc và thiếu độ tin cậy.

Leaf đã thực hiện một tối ưu cốt lõi đối với mô hình dải số truyền thống — **cơ chế Double Buffer (hai bộ đệm)**:

> **Nguyên lý thiết kế**: Leaf không đợi đến khi dải số hiện tại dùng hết sạch mới lên database xin cấp dải số mới, mà khi dải số hiện tại đã tiêu thụ tới một ngưỡng nhất định, một Thread bất đồng bộ sẽ chủ động gọi database xin trước dải số tiếp theo và nạp sẵn vào bộ nhớ. Ngưỡng cụ thể và chi tiết cài đặt nên đối chiếu với mã nguồn phiên bản Leaf đang dùng. Cơ chế Double Buffer giúp chỉ số TP999 khi lấy ID ổn định hơn, giảm thiểu dao động độ trễ do truy cập database gây ra.

(Hình ảnh trích từ bài viết chính thức của Meituan: [Leaf — Hệ thống sinh Distributed ID của Meituan-Dianping](https://tech.meituan.com/2017/04/21/mt-leaf.html))

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-id/leaf-principle-0fb5aa07.png)

Theo mô tả kiểm thử tải trong bài viết và README thời điểm đó của Meituan, trên máy ảo 4C8G với phương thức gọi RPC nội bộ công ty, Leaf từng đạt gần 50.000 QPS và TP999 khoảng 1 ms. Số liệu này chỉ mang tính tham khảo; hiệu năng thực tế còn phụ thuộc vào database, RPC framework, mạng, kích thước dải số và cách triển khai.

### Tinyid (Didi)

[Tinyid](https://github.com/didi/tinyid) là trình sinh ID duy nhất dựa trên mô hình dải số cơ sở dữ liệu do Didi mã nguồn mở.

Nguyên lý của mô hình dải số cơ sở dữ liệu chúng ta đã tìm hiểu ở trên rồi. **Vậy Tinyid có những điểm sáng nào?**

Để làm rõ câu hỏi này, trước tiên hãy xem qua phương án kiến trúc đơn giản dựa trên mô hình dải số cơ sở dữ liệu (hình ảnh trích từ wiki chính thức của Tinyid: [Giới thiệu nguyên lý Tinyid](https://github.com/didi/tinyid/wiki/tinyid%E5%8E%9F%E7%90%86%E4%BB%8B%E7%BB%8D)):

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-id/tinyid-principle-c69a75d0.png)

Với mô hình kiến trúc này, chúng ta gửi HTTP request tới dịch vụ phát số để xin ID duy nhất. Bộ cân bằng tải router sẽ điều hướng request tới một trong các `tinyid-server`.

Phương án này có vấn đề gì? Theo mình thấy (wiki chính thức của Tinyid cũng có đề cập), chủ yếu có 2 vấn đề sau:

- Khi cần lấy dải số mới, tốc độ lấy ID duy nhất của chương trình bị chậm lại.
- Phải đảm bảo độ sẵn sàng cao cho database, việc này khá rắc rối và tốn tài nguyên.

Ngoài ra, gọi qua HTTP cũng tồn tại chi phí mạng.

Nguyên lý của Tinyid tương đối đơn giản, kiến trúc của nó như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-id/tinyid-architecture-design-55d26481.png)

So với kiến trúc đơn giản dựa trên mô hình dải số cơ sở dữ liệu, Tinyid chủ yếu bổ sung những tối ưu sau:

- **Bộ nhớ đệm hai dải số (Double-segment cache)**: Để tránh việc tốc độ lấy ID duy nhất bị chậm lại lúc phải lấy dải số mới, khi dải số trong Tinyid được dùng tới một mức nhất định sẽ tự động tải bất đồng bộ dải số kế tiếp, đảm bảo trong bộ nhớ luôn có sẵn dải số khả dụng.
- **Hỗ trợ đa cơ sở dữ liệu**: Hỗ trợ nhiều database để tăng độ sẵn sàng, với điều kiện phạm vi dải số, bước nhảy hoặc phân mảnh nghiệp vụ do từng DB cấp phát không chồng chéo nhau và khi Failover sẽ không cấp phát lại những dải số đã phát hành.
- **Bổ sung `tinyid-client`**: Thao tác hoàn toàn cục bộ, không tốn chi phí gọi HTTP, giúp nâng cao rõ rệt cả hiệu năng lẫn độ sẵn sàng.

Ưu nhược điểm của Tinyid ở đây xin không phân tích lại nữa — kết hợp ưu nhược điểm của mô hình dải số cơ sở dữ liệu với nguyên lý của Tinyid là có thể suy ra ngay.

### IdGenerator (Cá nhân)

Cũng giống như UidGenerator và Leaf, [IdGenerator](https://github.com/yitter/IdGenerator) là một trình sinh ID duy nhất dựa trên Snowflake.

Theo mô tả chính thức của IdGenerator, nó có các đặc điểm sau:

- ID duy nhất sinh ra ngắn hơn;
- Tương thích với mọi biến thể thuật toán Snowflake (mô hình dải số hoặc mô hình cổ điển, hệ thống lớn hay nhỏ);
- Hỗ trợ gốc cho các ngôn ngữ C#/Java/Go/C/Rust/Python/Node.js/PHP (C extension)/SQL, v.v., đồng thời cung cấp thư viện động gọi an toàn đa luồng (FFI);
- Giải quyết vấn đề quay ngược đồng hồ, hỗ trợ chèn thủ công ID mới (khi nghiệp vụ cần sinh ID mới ở thời điểm quá khứ, bit dự trữ của thuật toán có thể sinh 5000 ID mỗi giây);
- Không phụ thuộc hệ thống lưu trữ bên ngoài;
- Với cấu hình mặc định, ID có thể dùng 71.000 năm không trùng lặp.

Các thông số này phụ thuộc vào phân bổ bit, mốc thời gian gốc, Worker ID và cấu hình sequence; trước khi dùng cho production vẫn nên tính toán trần dung lượng dựa trên cấu hình thực tế của mình và kiểm thử tải, không nên mặc định lấy số liệu quảng bá mặc định làm cam kết cho mọi kịch bản.

Cấu trúc ID duy nhất do IdGenerator sinh ra như sau:

![Cấu trúc ID do IdGenerator sinh ra](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/idgenerator-distributed-id-schematic-diagram-69fb2987.png)

- **timestamp (số bit không cố định)**: Hiệu thời gian, bằng thời gian hệ thống lúc sinh ID trừ đi `BaseTime` (thời gian gốc / điểm gốc / kỷ nguyên, mặc định là năm 2020), đơn vị mili-giây. Ban đầu chiếm 5 bit và tăng dần theo thời gian vận hành. Nếu thấy giá trị mặc định quá cũ, bạn có thể thiết lập lại, nhưng lưu ý sau này tốt nhất không được thay đổi nữa.
- **worker id (mặc định 6 bits)**: Mã máy, tham số quan trọng nhất, là ID duy nhất để phân biệt các máy hoặc ứng dụng khác nhau; giá trị tối đa được giới hạn bởi `WorkerIdBitLength` (mặc định 6). Nếu một máy chủ triển khai nhiều service độc lập, cần chỉ định `WorkerId` khác nhau cho từng service.
- **sequence (mặc định 6 bits)**: Số thứ tự trong mỗi mili-giây, được giới hạn bởi tham số `SeqBitLength` (mặc định 6). Tăng `SeqBitLength` giúp hiệu năng cao hơn, nhưng ID sinh ra cũng sẽ dài hơn.

Ví dụ sử dụng bằng ngôn ngữ Java: <https://github.com/yitter/idgenerator/tree/master/Java>.

## Tổng kết

Qua bài viết này, về cơ bản mình đã tổng hợp một lượt các giải pháp sinh Distributed ID phổ biến nhất.

Ngoài các cách đã giới thiệu ở trên, những middleware như ZooKeeper cũng có thể giúp chúng ta sinh ID duy nhất. **Không có viên đạn bạc (no silver bullet), nhất định phải kết hợp với dự án thực tế để chọn phương án phù hợp nhất với mình.**

Xin nhấn mạnh lại lần cuối: đừng coi tính liên tục của ID là yêu cầu bắt buộc. Phần lớn nghiệp vụ chỉ yêu cầu duy nhất chứ không yêu cầu liên tục; ID liên tục còn có thể làm lộ sản lượng kinh doanh. Cả mô hình dải số, Snowflake lẫn UUID đều có thể gặp tình trạng nhảy số — nhảy số thường không phải là bug. Khi cần sắp xếp, nên ưu tiên dùng cột thời gian tạo (`created_at`), đừng phụ thuộc hoàn toàn vào việc sắp xếp theo ID.

**Bảng so sánh ngang các giải pháp cốt lõi:**

| **Giải pháp** | **Hiệu năng** | **Tính có thứ tự** | **Chi phí vận hành** | **Kịch bản phù hợp** |
| --- | --- | --- | --- | --- |
| **Database tự tăng** | Thấp | Tăng nghiêm ngặt | Thấp | Lượng nghiệp vụ nhỏ, kiến trúc đơn khối, hệ thống quản trị nội bộ |
| **Mô hình dải số (Segment Mode)** | Cao | Tăng dần theo xu hướng | Trung bình | Nghiệp vụ Internet đồng thời cao, theo đuổi thông lượng cực đại |
| **Redis** | Rất cao | Tăng dần trên key đơn khi chạy bình thường | Trung bình | Đã có cụm Redis, chấp nhận xác suất cực nhỏ bị lùi ID |
| **Snowflake** | Cao | Tăng dần theo xu hướng | Trung bình | Hệ thống phân tán vừa và lớn, cần xử lý Worker ID, quay ngược đồng hồ và quy hoạch dung lượng |
| **UUID v7** | Cao | Tăng dần theo xu hướng | Cực thấp | Cloud-native, cụm không tập trung, muốn dùng ngay không cần cấu hình; với khóa chính vẫn nên có Unique Index chốt chặn |

Tuy nhiên, bài viết này chủ yếu giới thiệu kiến thức lý thuyết về Distributed ID. Trong phỏng vấn thực tế, người phỏng vấn có thể kết hợp kịch bản nghiệp vụ cụ thể để kiểm tra cách bạn thiết kế Distributed ID; bạn có thể tham khảo bài viết này: [Hướng dẫn thiết kế Distributed ID](./distributed-id-design.md) (cũng rất hữu ích cho việc thiết kế Distributed ID trong công việc thực tế).
