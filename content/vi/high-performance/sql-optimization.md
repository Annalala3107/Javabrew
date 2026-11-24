---
title: Tổng hợp các kỹ thuật tối ưu SQL phổ biến
description: Bài viết tổng hợp có hệ thống các kỹ thuật tối ưu SQL phổ biến, bao gồm định vị và phân tích Slow SQL (Slow Query Log, EXPLAIN, Performance Schema), chiến lược tối ưu Index, kỹ thuật viết lại truy vấn, tối ưu phân trang và kinh nghiệm thực chiến giúp cải thiện nhanh hiệu năng truy vấn cơ sở dữ liệu.
category: Hiệu năng cao
head:
  - - meta
    - name: keywords
      content: Tối ưu SQL,Slow SQL,Execution Plan EXPLAIN,Tối ưu Index,Tối ưu MySQL,Tối ưu truy vấn,Tối ưu phân trang,Performance Schema
lang: vi
sourceRef: zh-ref/high-performance/sql-optimization.md
---

Khi SQL chạy chậm, đừng vội áp dụng máy móc mấy quy tắc như "thêm Index" hay "không dùng `SELECT *`". Trước tiên hãy tìm ra câu Slow SQL đó, xem nó chậm ở số dòng phải quét, sắp xếp, hồi bảng (Bookmark Lookup), chờ khóa (Lock Wait) hay do tần suất gọi quá cao. Sau khi Execution Plan khớp với cách truy cập nghiệp vụ rồi mới quyết định sửa Index, sửa SQL, sửa cấu trúc bảng hay đẩy truy vấn sang Cache, Search Engine hoặc báo cáo offline.

Khi điều tra sự cố có thể đi theo trình tự sau:

1. Trước tiên xác nhận độ chậm nằm ở thời gian trung bình, P99 hay timeout rải rác; do một câu SQL cụ thể chậm hay toàn bộ database đang quá tải.
2. Thông qua Slow Query Log, APM và hệ thống giám sát DB để định vị các Slow SQL tần suất cao.
3. Xem `type`, `key`, `rows`, `filtered`, `Extra` trong Execution Plan để xác định có bị Full Table Scan, hồi bảng quá nhiều, tạo bảng tạm (Temporary Table) hay Filesort hay không.
4. Tiếp theo xử lý kết hợp với mô hình truy cập nghiệp vụ: chọn ít cột hơn, bổ sung Index, viết lại SQL, tách Transaction lớn, giới hạn độ sâu phân trang.
5. Cuối cùng đo lại trên cùng khối lượng dữ liệu và cùng điều kiện lọc, đừng chỉ kiểm chứng trên tập dữ liệu nhỏ.

## Tránh sử dụng SELECT \*

- `SELECT *` có thể làm tăng chi phí I/O, truyền tải qua mạng, Deserialization và bộ nhớ ứng dụng, đặc biệt với các cột dữ liệu lớn (như `varchar`, `blob`, `text`).
- `SELECT *` làm giảm cơ hội tận dụng Covering Index.
- `SELECT <danh_sách_cột>` giúp giảm ảnh hưởng khi cấu trúc bảng thay đổi.

## Thận trọng với Join phức tạp, đừng cấm tuyệt đối Join

Trong *Sổ tay phát triển Java (Java Development Handbook)* của Alibaba có đoạn mô tả sau:

> [Bắt buộc] Cấm Join quá 3 bảng. Các trường dùng để Join phải có kiểu dữ liệu giống nhau tuyệt đối; khi truy vấn liên kết nhiều bảng, phải đảm bảo các trường được Join đều có Index.

![Tránh Join nhiều bảng tối đa có thể](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/alibaba-java-development-handbook-multi-table-jo-0649f058.png)

Join là năng lực cơ bản của cơ sở dữ liệu quan hệ, không nên quy chụp đơn giản là kém hiệu quả. Trong phạm vi một DB đơn lẻ, nếu kiểu dữ liệu các trường Join khớp nhau, Index phù hợp và lượng dữ liệu trả về nằm trong tầm kiểm soát, Join thường rõ ràng hơn so với việc ứng dụng gọi nhiều câu truy vấn rời rồi tự ghép, đồng thời cũng dễ đảm bảo tính nhất quán kết quả hơn.

Điều thực sự cần thận trọng là Join phức tạp:

1. Trường liên kết không có Index hoặc kiểu dữ liệu không khớp;
2. Join quá nhiều bảng khiến Execution Plan phức tạp;
3. Lượng dữ liệu trả về quá lớn, chi phí hồi bảng, bảng tạm hoặc Filesort cao;
4. Join liên DB, liên shard đòi hỏi truy vấn, hợp nhất và sắp xếp xuyên nhiều node;
5. Tương lai xác định rõ sẽ chia tách DB/bảng (Sharding) theo luồng truy vấn này.

Từ MySQL 8.0.20 trở đi, Block Nested-Loop Join đã được thay thế bằng Hash Join. Khi phân tích hiệu năng Join, đừng chỉ học vẹt thuật toán Join cũ mà phải xem Execution Plan thực tế qua `EXPLAIN` / `EXPLAIN ANALYZE`, chú trọng `type`, `key`, `rows`, `filtered`, `Extra`, cũng như việc có xuất hiện bảng tạm, Filesort hay hồi bảng hàng loạt hay không.

Trong kịch bản nghiệp vụ thực tế, nếu truy vấn xuyên service, xuyên DB hoặc tương lai phải tách DB/bảng, có thể cân nhắc tách Join thành nhiều truy vấn đơn bảng rồi lắp ghép ở tầng nghiệp vụ. Nhưng điều này không mặc nhiên nhanh hơn: nó làm tăng số vòng khứ hồi mạng (network round-trip), vấn đề N+1 query, tiêu tốn RAM ứng dụng và rủi ro nhất quán, nên cần đánh giá dựa trên tần suất truy vấn, khối lượng dữ liệu, chi phí mạng và yêu cầu nhất quán.

Một cách làm phổ biến khác là **dư thừa dữ liệu (Data Redundancy / Denormalization)**: lưu lặp lại một số ít trường ổn định phục vụ truy vấn tần suất cao vào bảng chính hoặc bảng rộng (Wide Table) để giảm liên kết lúc runtime. Việc lưu dư thừa kéo theo chi phí đồng bộ nhất quán và bảo trì, phù hợp với kịch bản cấu trúc bảng ổn định, đọc nhiều ghi ít và luồng truy vấn rõ ràng.

## Tối ưu phân trang sâu (Deep Pagination)

Nguyên nhân gốc rễ của vấn đề phân trang sâu là: khi offset của `LIMIT` quá lớn, MySQL phải quét và bỏ qua lượng lớn bản ghi mới lấy được dữ liệu mục tiêu, và Query Optimizer có thể bỏ Index để chọn Full Table Scan. Lúc này ngay cả khi có Index, vẫn không tránh khỏi lượng lớn thao tác hồi bảng, khiến hiệu năng truy vấn tụt dốc nhanh chóng.

Bài viết này giới thiệu bốn phương án tối ưu phân trang sâu phổ biến, bảng so sánh đặc điểm và kịch bản áp dụng như sau:

| Phương án tối ưu | Tư duy cốt lõi | Kịch bản áp dụng | Hạn chế |
| ------------ | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| **Range Query** | Ghi nhận ID cuối trang trước, lấy trang sau qua `WHERE id > last_id LIMIT n` | Sắp xếp theo ID, cho phép lật trang kiểu con trỏ | Không hỗ trợ nhảy trang; sắp xếp khác ID cần con trỏ kết hợp |
| **Subquery** | Lấy khóa chính bắt đầu qua Subquery rồi lọc theo khóa chính | Cần hỗ trợ lật trang `OFFSET` truyền thống | Subquery có thể tạo bảng tạm; phụ thuộc Index trên trường sắp xếp |
| **Deferred Join** | Dùng `INNER JOIN` đẩy phân trang về Primary Key Index để giảm hồi bảng | Phân trang dữ liệu lớn cần logic lật trang truyền thống | Câu SQL tương đối phức tạp |
| **Covering Index** | Tạo Composite Index chứa đủ các trường cần truy vấn để tránh hồi bảng | Trường truy vấn cố định, tạo được Index phù hợp | Chi phí bảo trì Index cao khi nhiều cột; tập kết quả lớn vẫn có thể chạy Full Table Scan |

Khi chọn phương án, hãy xem giao diện sản phẩm có chỉnh được trước không. Nếu chấp nhận kiểu duyệt "Trang tiếp theo", Range Query — tức Cursor Pagination — thường ổn định nhất, rất hợp với News Feed mạng xã hội hay Infinite Scroll.

Nếu bắt buộc giữ `LIMIT offset, size` và chức năng nhảy trang, hãy cân nhắc Deferred Join, Covering Index hoặc giải pháp Search Engine. Khi số trường truy vấn cố định và ít, Covering Index có thể dùng làm phương án bổ trợ; khi offset đã lên tới hàng triệu, điều nên làm trước hết là hỏi lại phía nghiệp vụ xem có thực sự cần lật sâu đến thế không, thay vì chỉ gồng mình gánh trên SQL.

Dù chọn phương án nào cũng phải xem Execution Plan thực tế. Nếu `EXPLAIN` không đi đúng Index như kỳ vọng thì SQL viết đẹp đến mấy cũng vô dụng.

Chi tiết có thể đọc bài viết này: [Giới thiệu phân trang sâu (Deep Pagination) và khuyến nghị tối ưu](https://javaguide.cn/high-performance/deep-pagination-optimization.html).

## Khuyến nghị không sử dụng khóa ngoại (Foreign Key) và Cascade

Trong *Sổ tay phát triển Java* của Alibaba có đoạn mô tả:

> Không được sử dụng Foreign Key và Cascade; mọi khái niệm khóa ngoại đều phải xử lý ở tầng ứng dụng.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/alibaba-java-development-handbook-multi-table-jo-c7f97d34.png)

Quy chuẩn này chủ yếu hướng tới nghiệp vụ Internet đồng thời cao, tách Microservice và Sharding DB/bảng. Trong các kịch bản đó, phụ thuộc vào Foreign Key và Cascade làm tăng sự ràng buộc liên bảng (coupling), chi phí di chuyển dữ liệu và độ phức tạp khi thay đổi schema trên production.

Tuy nhiên Foreign Key không phải "vô dụng". Ở ứng dụng Monolith, hệ thống quản trị nội bộ, dữ liệu chủ cốt lõi (Master Data) có quy mô bảng vừa phải và yêu cầu toàn vẹn dữ liệu mạnh rõ ràng, Foreign Key giúp tầng database chốt chặn tính toàn vẹn tham chiếu (Referential Integrity). Kết luận chính xác hơn là: có dùng Foreign Key hay không phải căn cứ vào hình thái kiến trúc, quy mô dữ liệu và chi phí vận hành, chứ không nên nói đơn giản rằng "Foreign Key hiệu năng kém".

## Chọn kiểu dữ liệu phù hợp cho các trường

Số byte lưu trữ càng nhỏ, dung lượng chiếm dụng càng ít và hiệu năng càng cao.

**a. Một số chuỗi ký tự có thể chuyển sang kiểu số để lưu trữ, ví dụ chuyển địa chỉ IP thành dữ liệu số nguyên.**

Dữ liệu số có tính liên tục, hiệu năng tốt hơn và chiếm ít không gian hơn.

MySQL cung cấp một số hàm để xử lý địa chỉ IP:

- `INET_ATON()`: Chuyển IPv4 thành số nguyên không dấu; khuyến nghị lưu bằng `INT UNSIGNED`, rồi dùng `INET_NTOA()` chuyển ngược lại thành chuỗi.
- `INET6_ATON()`: Chuyển IPv6 thành chuỗi nhị phân, cũng xử lý được IPv4; nếu hệ thống cần hỗ trợ IPv6, khuyến nghị lưu thống nhất bằng `VARBINARY(16)` hoặc `BINARY(16)`, rồi dùng `INET6_NTOA()` chuyển lại thành chuỗi.

Nếu chỉ lưu IPv4 thì `INET_ATON()` + `INT UNSIGNED` là đủ; nếu tương lai có khả năng mở rộng sang IPv6, thiết kế sẵn kiểu nhị phân 16 byte ngay từ đầu sẽ vững chắc hơn.

**b. Với dữ liệu không âm (như ID tự tăng, IP dạng số nguyên, tuổi), ưu tiên dùng kiểu số nguyên không dấu (`UNSIGNED`).**

Không dấu không làm thay đổi số byte lưu trữ của kiểu số nguyên, mà chỉ dịch dải giá trị biểu diễn từ có số âm sang dải không âm bắt đầu từ 0; ví dụ `INT` dù signed hay unsigned đều chiếm 4 byte, phạm vi lần lượt như sau:

```sql
SIGNED INT -2147483648~2147483647
UNSIGNED INT 0~4294967295
```

Số byte lưu trữ và dải giá trị cụ thể tham khảo tài liệu chính thức của MySQL: [Integer Types](https://dev.mysql.com/doc/refman/8.0/en/integer-types.html) và [Data Type Storage Requirements](https://dev.mysql.com/doc/refman/8.0/en/storage-requirements.html).

**c. Các kiểu số giá trị nhỏ (như tuổi, trạng thái dạng 0/1) ưu tiên dùng kiểu `TINYINT`.**

**d. Với kiểu ngày giờ, tuyệt đối không dùng chuỗi để lưu ngày tháng. Có thể cân nhắc `DATETIME`, `TIMESTAMP` và Timestamp dạng số.**

Cả ba cách đều có ưu điểm riêng; chọn giải pháp phù hợp nhất với kịch bản thực tế mới là chân ái. Dưới đây là bảng so sánh nhanh để bạn chọn đúng kiểu lưu thời gian khi phát triển:

> **Lưu ý**: Dung lượng lưu trữ dưới đây dựa trên MySQL 5.6.4+ (hỗ trợ độ chính xác micro giây). Trước 5.6.4, `DATETIME` cố định 8 byte và `TIMESTAMP` cố định 4 byte. Độ chính xác phần thập phân giây là 1~2 chữ số, 3~4 chữ số, 5~6 chữ số sẽ tốn thêm lần lượt 1, 2, 3 byte.

| Kiểu | Dung lượng lưu trữ | Định dạng ngày giờ | Phạm vi ngày giờ | Xử lý múi giờ |
| ------------ | ----------- | ------------------------------ | ------------------------------------------------------------ | ----------------------------- |
| DATETIME | 5~8 byte | YYYY-MM-DD hh:mm:ss[.fraction] | 1000-01-01 00:00:00[.000000] ~ 9999-12-31 23:59:59[.999999] | Không chuyển đổi múi giờ |
| TIMESTAMP | 4~7 byte | YYYY-MM-DD hh:mm:ss[.fraction] | 1970-01-01 00:00:01[.000000] ~ 2038-01-19 03:14:07[.999999] | Chuyển đổi khi đọc/ghi theo `time_zone` của session |
| Timestamp dạng số | 4 hoặc 8 byte | Toàn số, ví dụ 1578707612 | Phụ thuộc kiểu số nguyên và độ chính xác | Không chuyển đổi múi giờ |

`TIMESTAMP` không lưu tên múi giờ, mà chuyển đổi theo `time_zone` của session hiện tại lúc đọc/ghi; `DATETIME` biểu diễn ngày giờ nguyên văn, không chuyển đổi múi giờ. Unix Timestamp mức giây có thể dùng `INT UNSIGNED`, nhưng bị giới hạn bởi dải biểu diễn; Timestamp mức mili-giây thường cần `BIGINT`.

Chi tiết về lựa chọn kiểu thời gian trong MySQL xem thêm bài viết: [Khuyến nghị lưu trữ kiểu dữ liệu thời gian trong MySQL](https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html).

**e. Trường tiền tệ dùng `DECIMAL` để tránh mất độ chính xác.**

`DECIMAL` dùng để lưu các số thập phân đòi hỏi độ chính xác cao như dữ liệu liên quan đến tiền bạc, tránh mất độ chính xác do số thực dấu phẩy động (floating-point) gây ra.

Trong Java, kiểu `DECIMAL` của MySQL tương ứng với lớp `java.math.BigDecimal`.

Chi tiết về `BigDecimal` tham khảo bài viết: [Giải thích chi tiết BigDecimal](https://javaguide.cn/java/basis/bigdecimal.html).

**f. Cố gắng dùng ID tự tăng làm khóa chính.**

Nếu khóa chính là ID tự tăng, dữ liệu mới sẽ được nối thêm vào cuối cây B+, tránh tách trang (Page Split) ở giữa và cho hiệu năng ghi tối ưu nhất. Khi ghi đầy một trang dữ liệu, hệ thống chỉ cần cấp phát thêm một trang mới để ghi tiếp.

Nếu khóa chính không phải ID tự tăng, để giữ các node lá của cây B+ luôn có thứ tự sau khi thêm dữ liệu mới, InnoDB phải tìm vị trí ở giữa các node lá để chèn vào. Nếu trang đích đã đầy, nó buộc phải thực hiện **tách trang (Page Split)** — chia đôi trang đó và di chuyển một nửa dữ liệu sang trang mới. Thao tác Page Split phải khóa bi quan (Pessimistic Lock) và di chuyển lượng lớn dữ liệu nên hiệu năng khá kém.

Tuy nhiên, trong kịch bản Sharding DB/bảng, không khuyến nghị phụ thuộc vào ID tự tăng của một DB đơn làm khóa chính toàn cục; phổ biến hơn là dùng các ID phân tán như Snowflake, Segment Mode, ID tăng theo xu hướng (trending ID), UUIDv7/ULID. Nếu dùng UUID, không nên dùng trực tiếp chuỗi UUID ngẫu nhiên làm khóa chính InnoDB; có thể cân nhắc lưu dạng `BINARY(16)`, UUID có thứ tự theo thời gian hoặc dùng hàm `UUID_TO_BIN()` của MySQL để lưu nhị phân gọn hơn.

Đọc thêm: [Khóa chính cơ sở dữ liệu có nhất thiết phải tự tăng không? Kịch bản nào không nên tự tăng?](https://mp.weixin.qq.com/s/vNRIFKjbe7itRTxmq-bkAA).

**g. Dùng `NULL` đúng theo ngữ nghĩa, không cấm đoán máy móc.**

`NULL` là giá trị hoàn toàn khác với `''` (chuỗi rỗng) hay số `0`; nó biểu thị giá trị chưa biết hoặc không tồn tại. Kiểm tra `NULL` phải dùng `IS NULL` hoặc `IS NOT NULL`, không được dùng các toán tử so sánh như `=`, `!=`, `<`, `>`.

Không nên cực đoan thiết kế toàn bộ các cột đều cho phép `NULL` vì sẽ làm tăng độ phức tạp về ngữ nghĩa và xử lý truy vấn; nhưng cũng không thể nói `NULL` chắc chắn làm vô hiệu Index. MySQL hoàn toàn có thể dùng Index để tối ưu `IS NULL`. Thứ nên ưu tiên hàng đầu là ngữ nghĩa nghiệp vụ: nếu cột thực sự có thể chưa xác định, ví dụ `paid_at`, `deleted_at`, `last_login_at`, dùng `NULL` thường rõ ràng hơn nhiều so với việc nhét một giá trị mặc định "ma thuật" (magic value).

Ngoài ra, `NULL` ảnh hưởng tới kết quả của hàm tổng hợp (Aggregate Function). Ví dụ các hàm `SUM`, `AVG`, `MIN`, `MAX` sẽ bỏ qua giá trị `NULL`. `COUNT(*)` đếm tất cả bản ghi, còn `COUNT(tên_cột)` chỉ đếm các giá trị khác `NULL`.

## Cố gắng dùng UNION ALL thay cho UNION

`UNION` sẽ đưa toàn bộ dữ liệu của hai tập kết quả vào bảng tạm rồi mới khử trùng lặp, nên tốn thời gian và tiêu hao tài nguyên CPU hơn.

`UNION ALL` không thực hiện khử trùng lặp trên tập kết quả, dữ liệu lấy về có thể chứa các phần tử trùng nhau.

Nếu về mặt nghiệp vụ xác định chắc chắn hai tập kết quả không trùng nhau, hoặc cho phép trùng lặp, ưu tiên dùng `UNION ALL`. Nếu bắt buộc phải khử trùng lặp thì vẫn nên dùng `UNION` hoặc khử trùng lặp tường minh.

## Ưu tiên sử dụng thao tác theo lô (Batch Operation)

Với việc cập nhật dữ liệu trong DB, nếu dùng được thao tác theo lô hãy tận dụng tối đa để giảm số lần gọi xuống DB và nâng cao hiệu năng.

```sql
# Ví dụ chưa tốt
INSERT INTO `cus_order` (`id`, `score`, `name`) VALUES (1, 426547, 'user1');
INSERT INTO `cus_order` (`id`, `score`, `name`) VALUES (1, 33, 'user2');
INSERT INTO `cus_order` (`id`, `score`, `name`) VALUES (1, 293854, 'user3');

# Ví dụ tối ưu
INSERT into `cus_order` (`id`, `score`, `name`) values(1, 426547, 'user1'),(1, 33, 'user2'),(1, 293854, 'user3');
```

## SHOW PROFILE đã bị đánh dấu lỗi thời (Deprecated), đừng phụ thuộc vào nó ở phiên bản mới

[`SHOW PROFILE`](https://dev.mysql.com/doc/refman/8.0/en/show-profile.html) và `SHOW PROFILES` đã bị MySQL chính thức đánh dấu deprecated và có thể bị xóa trong các phiên bản tương lai. Hiện nay khi điều tra hiệu năng SQL, thông thường trước tiên dùng Slow Query Log để tìm ra SQL có vấn đề, rồi dùng `EXPLAIN` xem Optimizer thực thi thế nào; MySQL 8.0.18+ có thể dùng `EXPLAIN ANALYZE` để xem thời gian thực thi và số dòng thực tế, còn mức tiêu hao tài nguyên thì tra cứu qua Performance Schema.

Ví dụ muốn xem thời gian thực thi của các SQL chạy gần đây, có thể truy vấn `events_statements_history_long`:

```sql
SELECT
    EVENT_ID,
    SQL_TEXT,
    TIMER_WAIT / 1000000000 AS duration_ms,
    LOCK_TIME / 1000000000 AS lock_ms,
    ROWS_EXAMINED,
    ROWS_SENT,
    CPU_TIME / 1000000000 AS cpu_ms
FROM performance_schema.events_statements_history_long
WHERE SQL_TEXT IS NOT NULL
ORDER BY TIMER_WAIT DESC
LIMIT 10;
```

`CPU_TIME` yêu cầu MySQL 8.0.28+; nếu phiên bản thấp hơn, có thể xem trước các trường `TIMER_WAIT`, `LOCK_TIME`, `ROWS_EXAMINED`, `ROWS_SENT`. `events_statements_history_long` chỉ lưu một phần các sự kiện câu lệnh vừa kết thúc gần nhất ở phạm vi toàn cục, khi bảng đầy các bản ghi cũ sẽ bị đẩy ra; nếu các consumers và instruments liên quan chưa được bật thì cũng có thể không thu thập đủ thông tin.

## Tối ưu Slow SQL

Để tối ưu Slow SQL, trước hết chúng ta phải tìm ra những câu lệnh SQL nào có tốc độ thực thi chậm.

MySQL Slow Query Log dùng để ghi lại các câu lệnh SQL có thời gian phản hồi vượt quá ngưỡng thiết lập sẵn khi MySQL thực thi. Vì vậy, thông qua phân tích Slow Query Log, chúng ta có thể phát hiện các câu SQL chạy chậm.

Vì lý do hiệu năng, tính năng Slow Query Log mặc định tắt; bạn có thể bật bằng các câu lệnh sau:

```sql
# Bật tính năng Slow Query Log
SET GLOBAL slow_query_log = 'ON';
# Vị trí lưu tệp Slow Query Log
SET GLOBAL slow_query_log_file = '/var/lib/mysql/ranking-list-slow.log';
# Dù có vượt ngưỡng thời gian hay không, truy vấn không dùng Index cũng được ghi lại; dùng thận trọng ngắn hạn trên production
SET GLOBAL log_queries_not_using_indexes = 'ON';
# Ngưỡng Slow Query (giây), SQL chạy quá ngưỡng này sẽ được ghi vào log
SET GLOBAL long_query_time = 1;
# Slow Query chỉ ghi lại các SQL có số dòng quét lớn hơn tham số này
SET GLOBAL min_examined_row_limit = 100;
```

`SET GLOBAL` chỉ ảnh hưởng đến các kết nối mới; các kết nối đang mở vẫn có thể giữ giá trị session cũ. Trên môi trường production nên ghi vào tệp cấu hình và phát hành qua quy trình thay đổi cấu hình.

Sau khi thiết lập thành công, dùng lệnh `show variables like 'slow%';` để kiểm tra.

```bash
| Variable_name       | Value                                |
+---------------------+--------------------------------------+
| slow_launch_time    | 2                                    |
| slow_query_log      | ON                                   |
| slow_query_log_file | /var/lib/mysql/ranking-list-slow.log |
+---------------------+--------------------------------------+
3 rows in set (0.01 sec)
```

Chúng ta cố tình chạy một câu lệnh sắp xếp trên bảng có một triệu bản ghi (không dùng Index):

```sql
SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
```

Đừng sửa quyền thư mục dữ liệu MySQL chỉ để xem Slow Log. Cách làm an toàn hơn là dùng tài khoản có đủ quyền để xem, xuất Slow Log ra một thư mục riêng hoặc thu thập qua hệ thống gom log.

Xem tệp Slow Query Log tương ứng:

```bash
 cat /var/lib/mysql/ranking-list-slow.log
```

Câu SQL chúng ta vừa cố tình thực thi đã được ghi lại trong Slow Query Log:

```plain
# Time: 2022-10-09T08:55:37.486797Z
# User@Host: root[root] @  [172.17.0.1]  Id:    14
# Query_time: 0.978054  Lock_time: 0.000164 Rows_sent: 999999  Rows_examined: 1999998
SET timestamp=1665305736;
SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
```

Giải thích một số thông tin trong log:

- `Time`: Thời điểm câu lệnh được ghi nhận chạy trên server.
- `User@Host`: Ai đã thực thi đoạn SQL này.
- `Query_time`: Tổng thời gian chạy của câu lệnh.
- `Lock_time`: Thời gian chờ khóa khi thực thi câu lệnh này.
- `Rows_sent`: Số bản ghi mà Slow Query trả về.
- `Rows_examined`: Số dòng mà Slow Query đã quét qua.

Trong dự án thực tế, Slow Query Log thường khá phức tạp và chúng ta cần nhờ công cụ để phân tích. Những công cụ tích hợp sẵn của MySQL như `mysqldumpslow` có thể gom các câu SQL giống nhau thành một nhóm, đồng thời thống kê số lần thực thi và thời gian chạy mỗi lần của từng nhóm.

Khi xử lý Slow SQL, nên theo dõi đồng thời các chỉ số sau:

| Chỉ số | Giải thích | Vấn đề thường gặp |
| --------------- | ---------------- | ------------------------ |
| `Query_time` | Tổng thời gian thực thi SQL | Chạy chậm, chờ khóa, I/O chậm |
| `Lock_time` | Thời gian chờ khóa | Xung đột khóa dòng (Row Lock), khóa bảng (Table Lock), ảnh hưởng DDL |
| `Rows_examined` | Số dòng quét | Thiếu Index, độ chọn lọc của Index kém |
| `Rows_sent` | Số dòng trả về | Phạm vi truy vấn quá lớn, phân trang quá sâu |
| Tần suất thực thi | Số lần thực thi trên một đơn vị thời gian | Mỗi lần không chậm nhưng tổng lượng gọi làm sập DB |

Đừng chỉ chăm chăm nhìn vào câu SQL chạy lâu nhất. Thứ nguy hiểm nhất trên production thường là những câu SQL tần suất cao kiểu "mỗi lần chỉ mất 50 ms, nhưng mỗi giây chạy vài nghìn lần".

Sau khi tìm thấy Slow SQL, ta có thể dùng lệnh `EXPLAIN` để phân tích câu `SELECT` tương ứng. Trước và sau khi đưa tối ưu lên production, tốt nhất nên lưu lại `EXPLAIN FORMAT=TREE`, `EXPLAIN ANALYZE`, chỉ số Slow Log và QPS nghiệp vụ trọng yếu của cùng câu SQL đó để tránh tình trạng "đã sửa Index nhưng Execution Plan không hề thay đổi".

```sql
mysql> EXPLAIN SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | cus_order | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 997572 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)
```

Giải thích các trường quan trọng:

- `select_type`: Loại truy vấn, các giá trị thường gặp gồm `SIMPLE` (truy vấn thông thường, không có Join hay Subquery), `PRIMARY` (truy vấn chính), `UNION` (truy vấn phía sau trong `UNION`), `SUBQUERY` (truy vấn con), v.v.
- `table`: Cho biết bảng hoặc bảng dẫn xuất (Derived Table) liên quan trong truy vấn.
- `type`: Phương thức truy cập — chỉ số tham chiếu quan trọng đánh giá truy vấn có hiệu quả hay không; thứ tự từ tệ đến tốt lần lượt là: **ALL** (quét toàn bảng) < **index** (quét toàn bộ Index) < **range** (quét theo khoảng Index) < **index_merge** (hợp nhất Index) < **ref** (tra cứu Index không duy nhất) < **eq_ref** (tra cứu Index duy nhất) < **const** (hằng số một dòng) < **system** (bảng hệ thống). Hiệu năng thực tế vẫn cần đánh giá kết hợp với `rows`, `Extra` và các trường khác.
- `rows`: Số dòng dữ liệu ước tính cần quét để tìm ra tập kết quả; về nguyên tắc `rows` càng ít càng tốt.
- ……

> **Khuyến nghị đọc thêm**: [Phân tích Execution Plan trong MySQL](https://javaguide.cn/database/mysql/mysql-query-execution-plan.html) giải thích chi tiết ý nghĩa từng cột của `EXPLAIN` (`id`, `select_type`, `type`, `key`, `rows`, `Extra`, v.v.), bao gồm tính năng phân tích thực thi thực tế `EXPLAIN ANALYZE` mới từ MySQL 8.0.18+. Ngoài ra, bài [Tổng kết kinh nghiệm trị Slow SQL của Alibaba](https://mp.weixin.qq.com/s/LZRSQJufGRpRw6u4h_Uyww) cũng đúc kết rất hay.

## Sử dụng Index đúng cách

Sử dụng Index đúng cách giúp tăng tốc độ truy xuất dữ liệu lên rất nhiều (giảm đáng kể lượng dữ liệu cần đọc).

### Chọn trường phù hợp để tạo Index

- **Ưu tiên trường có ngữ nghĩa rõ ràng và ít giá trị `NULL`**: Trường đánh Index nên có ngữ nghĩa nghiệp vụ rõ ràng, hạn chế độ phức tạp khi phán đoán do `NULL` gây ra. Nếu trường thực sự có thể chưa xác định thì cứ giữ `NULL`, đừng vì "hiệu năng" mà nhét một giá trị ma thuật (magic value) tối nghĩa.
- **Trường được truy vấn thường xuyên**: Những trường tạo Index nên là các trường có tần suất thao tác truy vấn rất cao.
- **Trường dùng làm điều kiện lọc**: Các trường thường xuyên xuất hiện trong điều kiện `WHERE` nên được cân nhắc tạo Index.
- **Trường thường xuyên cần sắp xếp**: Index vốn đã được sắp xếp sẵn, nhờ đó truy vấn có thể tận dụng thứ tự của Index để tăng tốc thao tác sắp xếp.
- **Trường thường xuyên dùng để Join**: Các trường hay dùng để kết nối bảng thường là cột khóa ngoại; với cột khóa ngoại không nhất thiết phải tạo ràng buộc Foreign Key mà chỉ cần biết nó thể hiện quan hệ giữa các bảng. Với những trường thường xuyên bị Join, nên cân nhắc tạo Index để nâng cao hiệu quả Join nhiều bảng.

### Tránh làm Index bị vô hiệu hóa

Index bị vô hiệu hóa (Index Invalidation) cũng là một trong những nguyên nhân chính dẫn tới Slow Query; các tình huống phổ biến làm mất hiệu lực Index gồm hai nhóm sau:

**1. Cách viết SQL khiến Index khó sử dụng**

Nhóm vấn đề này thường xuất phát từ cách viết SQL: vốn có thể tìm kiếm có thứ tự dọc theo cây B+Tree, nhưng viết SQL xong lại biến thành quét rồi mới lọc.

- **Vi phạm nguyên tắc tiền tố trái nhất (Leftmost Prefix Principle)**: Bỏ qua cột dẫn đầu của Composite Index, hoặc sau khi gặp truy vấn khoảng (như `>`, `<`, `BETWEEN`, `LIKE "abc%"`), các cột phía sau thường không thể tiếp tục dùng để thu hẹp chính xác khoảng quét Index, nhưng vẫn có thể dùng cho lọc ICP, Covering Index hoặc tối ưu sắp xếp; cuối cùng vẫn phải xem `key_len`, `rows`, `Extra` của `EXPLAIN` và `EXPLAIN ANALYZE`.
- **Biến đổi/tác động lên cột Index**: Khi Index thông thường được tạo trên cột gốc, việc thực hiện phép toán hoặc áp dụng hàm lên cột Index ở vế trái của `WHERE` thường khiến Optimizer khó sử dụng Index đó. Cách viết tốt hơn là đẩy phép biến đổi hàm sang vế hằng số hoặc đổi thành điều kiện khoảng; nếu thực sự hay truy vấn theo biểu thức, có thể cân nhắc Generated Column Index hoặc Functional Index.
- **Ép kiểu ngầm định (kín đáo nhưng chí mạng)**: Khi so sánh "cột kiểu chuỗi" với "giá trị kiểu số", MySQL mặc định bọc hàm chuyển đổi lên cột đó, phá vỡ trực tiếp tính có thứ tự của cây Index.
- **Tìm kiếm mờ `LIKE` có ký tự đại diện đứng đầu**: Ví dụ `LIKE "%abc"`, sự bất định ở các ký tự đầu khiến Optimizer không thể khóa được điểm bắt đầu của khoảng quét.
- **Phát sinh sắp xếp bổ sung ở `ORDER BY`**: Khi cột sắp xếp không trúng Index hoặc chiều sắp xếp không khớp cấu trúc Index, MySQL có thể phải sắp xếp thêm trên RAM hoặc đĩa, trong Execution Plan thường thấy `Using filesort`.

**2. Optimizer tự tính chi phí xong quyết định bỏ qua Index**

Một số trường hợp không phải Index không dùng được, mà Optimizer sau khi tính toán chi phí thấy Full Table Scan còn rẻ hơn.

- **`SELECT *` phải hồi bảng quá nhiều**: Khi truy vấn nhiều cột không nằm trong Covering Index và lượng dữ liệu khớp điều kiện lớn (thường vượt 20%~30%), Optimizer có thể nhận định Sequential I/O của Full Table Scan rẻ hơn Random I/O do hồi bảng liên tục, nên chủ động bỏ qua Index.
- **Điều kiện `OR` gây ra Full Table Scan**: Chỉ cần một vế bất kỳ được nối bởi `OR` không có Index tương ứng thì sẽ kích hoạt Full Table Scan. Ngay cả khi cả hai vế đều có Index, nếu chi phí ước tính của Index Merge quá cao thì Optimizer vẫn bỏ qua.
- **Danh sách `IN` quá dài gây sai lệch ước lượng**: Khi danh sách `IN` rất dài, ước lượng chi phí của Optimizer có thể thiếu chính xác. MySQL dùng `eq_range_index_dive_limit` để kiểm soát ngưỡng số lượng equality range chuyển từ Index Dive sang ước lượng theo thống kê. Các phiên bản và cấu hình khác nhau có thể khác nhau, không nên chỉ học thuộc con số "200" mà phải kết hợp kiểm tra `EXPLAIN`, thống kê bảng và `ANALYZE TABLE`.

Chi tiết xem thêm: [Tổng hợp các kịch bản vô hiệu hóa Index trong MySQL](https://javaguide.cn/database/mysql/mysql-index-invalidation.html).

### Thận trọng khi tạo Index cho trường bị cập nhật thường xuyên

Dù Index mang lại hiệu quả truy vấn cao, chi phí duy trì Index cũng không hề nhỏ. Nếu một trường ít được truy vấn mà lại bị chỉnh sửa liên tục thì càng không nên tạo Index trên trường đó.

### Cố gắng cân nhắc tạo Composite Index thay cho Single-Column Index

Vì Index chiếm dung lượng đĩa, có thể hiểu đơn giản là mỗi Index tương ứng với một cây B+. Nếu một bảng có quá nhiều cột và quá nhiều Index, khi dữ liệu đạt tới một ngưỡng lớn, dung lượng Index chiếm dụng sẽ rất nhiều và thời gian cập nhật Index khi sửa dữ liệu cũng tốn kém hơn. Nếu là Composite Index — nhiều trường gộp trên cùng một Index — sẽ tiết kiệm đáng kể dung lượng đĩa, đồng thời hiệu quả thao tác sửa đổi dữ liệu cũng tăng lên.

### Chú ý tránh Index dư thừa (Redundant Index)

Index dư thừa là các Index có chức năng trùng lặp: nếu đã đánh trúng Index `(a, b)` thì chắc chắn sẽ đánh trúng Index `(a)`, vậy Index `(a)` chính là Index dư thừa. Chẳng hạn `(name, city)` và `(name)` là cặp Index dư thừa vì truy vấn khớp với Index trước chắc chắn khớp với Index sau. Trong đa số trường hợp, nên mở rộng Index sẵn có thay vì tạo thêm Index mới.

### Cân nhắc dùng Prefix Index thay cho Index thông thường trên trường kiểu chuỗi

Prefix Index chỉ áp dụng cho kiểu chuỗi ký tự, chiếm ít dung lượng hơn so với Index thông thường, nên có thể cân nhắc dùng Prefix Index thay cho Index thông thường.

### Xóa các Index lâu ngày không sử dụng

Hãy xóa những Index lâu ngày không dùng đến, vì sự tồn tại của Index thừa sẽ gây hao tổn hiệu năng không cần thiết. Trên MySQL 5.7 có thể truy vấn view `schema_unused_indexes` trong thư viện `sys` để kiểm tra những Index nào chưa từng được sử dụng.

Tuy nhiên, view này chỉ có ý nghĩa khi dịch vụ đã chạy đủ lâu và tải công việc mang tính đại diện. Trên MySQL 8.0+, trước khi xóa Index có thể chuyển Index sang trạng thái `invisible` trước để theo dõi Execution Plan và chỉ số nghiệp vụ rồi mới quyết định xóa hẳn hay không:

```sql
ALTER TABLE t ALTER INDEX idx_name INVISIBLE;
```

## Lưu ý khi tối ưu trên môi trường Production

- **Đừng thêm Index trực tiếp vào giờ cao điểm**: Thêm Index trên bảng lớn có thể chiếm dụng tài nguyên trong thời gian dài; môi trường production cần đánh giá Online DDL, Metadata Lock, dung lượng đĩa, backup, phương án rollback, khung giờ thấp điểm và độ trễ replication của Replica.
- **Đừng vì một truy vấn tần suất thấp mà hy sinh hiệu năng ghi**: Càng nhiều Index thì chi phí duy trì khi thêm, sửa, xóa càng cao.
- **Đừng bỏ qua phân bố dữ liệu**: Cùng một câu SQL chạy rất nhanh trên môi trường test, nhưng lên production có thể đi theo Execution Plan hoàn toàn khác do lệch phân bố dữ liệu (Data Skew) hoặc thông tin thống kê đã cũ.
- **Đừng chỉ tối ưu mỗi câu chữ SQL**: Một số vấn đề đòi hỏi phía sản phẩm giới hạn phạm vi truy vấn, một số cần Cache, số khác cần đẩy sang báo cáo bất đồng bộ hoặc Data Warehouse gánh.
- **Tiếp tục theo dõi sau khi tối ưu**: Sau khi deploy, liên tục quan sát số lượng Slow Query, CPU, I/O, tỷ lệ Buffer Pool Hit, số lượng kết nối và tình trạng chờ khóa (Lock Wait).

## Tham khảo

- MySQL 8.2 Optimizing SQL Statements: https://dev.mysql.com/doc/refman/8.0/en/statement-optimization.html
- Vì sao Alibaba cấm Join nhiều bảng trong cơ sở dữ liệu - Hollis: https://mp.weixin.qq.com/s/GSGVFkDLz1hZ1OjGndUjZg
- Ngay cả câu lệnh COUNT trong MySQL cũng có thể bị phỏng vấn hành tơi tả thế này - Hollis: https://mp.weixin.qq.com/s/IOHvtel2KLNi-Ol4UBivbQ
- Phân tích cách dùng công cụ tối ưu hiệu năng MySQL Explain: https://segmentfault.com/a/1190000008131735
- Cách dùng MySQL Slow Query Log để tối ưu hiệu năng: https://kalacloud.com/blog/how-to-use-mysql-slow-query-log-profiling-mysqldumpslow/
