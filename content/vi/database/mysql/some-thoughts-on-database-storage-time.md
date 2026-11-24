---
title: Khuyến nghị lựa chọn kiểu ngày giờ trong MySQL
description: So sánh chuyên sâu sự khác biệt giữa DATETIME và TIMESTAMP trong MySQL, phân tích cách xử lý múi giờ, dung lượng lưu trữ, phạm vi giá trị và đưa ra khuyến nghị thực hành tốt nhất khi chọn kiểu lưu trữ ngày giờ.
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: Lưu trữ thời gian MySQL,DATETIME,TIMESTAMP,Unix Timestamp,Xử lý múi giờ,Lựa chọn kiểu ngày giờ,Hàm ngày giờ MySQL
lang: vi
sourceRef: zh-ref/database/mysql/some-thoughts-on-database-storage-time.md
---

Trong công việc phát triển phần mềm hằng ngày, lưu trữ thời gian là một nhu cầu cơ bản và phổ biến. Dù là ghi lại thời điểm thao tác dữ liệu, thời điểm phát sinh giao dịch tài chính, thời gian khởi hành của lịch trình hay thời điểm đặt hàng của người dùng, thông tin thời gian đều gắn bó chặt chẽ với logic nghiệp vụ và chức năng hệ thống. Vì vậy, việc lựa chọn và sử dụng đúng kiểu ngày giờ trong MySQL vô cùng quan trọng; chọn đúng hay sai thậm chí có thể ảnh hưởng đáng kể đến độ chính xác nghiệp vụ và sự ổn định của hệ thống.

Bài viết này nhằm giúp lập trình viên nhìn nhận lại và hiểu sâu hơn các cách lưu trữ thời gian khác nhau trong MySQL, từ đó đưa ra lựa chọn phù hợp hơn với kịch bản nghiệp vụ của dự án.

## Không nên dùng chuỗi ký tự để lưu trữ ngày tháng

Giống như nhiều người mới học cơ sở dữ liệu, tác giả ở giai đoạn đầu cũng từng thử dùng kiểu chuỗi (như `VARCHAR`) để lưu ngày giờ, thậm chí từng cho rằng đó là cách đơn giản và trực quan. Xét cho cùng, định dạng như `'YYYY-MM-DD HH:MM:SS'` trông rất rõ ràng, dễ hiểu.

Tuy nhiên, đây là cách làm không đúng và chủ yếu gây ra hai vấn đề sau:

1. **Hiệu quả không gian lưu trữ**: So với các kiểu ngày giờ tích hợp sẵn của MySQL, chuỗi ký tự thường chiếm nhiều dung lượng lưu trữ hơn để biểu diễn cùng một thông tin thời gian.
2. **Hiệu năng truy vấn và tính toán thấp**:
   - **Thao tác so sánh phức tạp và kém hiệu quả**: So sánh ngày tháng dựa trên chuỗi phải thực hiện từng ký tự theo thứ tự từ điển (lexicographical order), vừa không trực quan (ví dụ `'2024-05-01'` sẽ nhỏ hơn `'2024-1-10'`), vừa kém hiệu quả hơn nhiều so với phép so sánh giá trị số hoặc mốc thời gian bằng kiểu ngày giờ gốc.
   - **Hạn chế khả năng tính toán**: Không thể tận dụng trực tiếp các hàm ngày giờ phong phú mà cơ sở dữ liệu cung cấp để tính toán (ví dụ tính khoảng cách giữa hai ngày, cộng trừ ngày giờ, v.v.), mà phải chuyển đổi định dạng trước, làm tăng độ phức tạp.
   - **Hiệu năng Index không tốt**: Khi xử lý truy vấn theo khoảng (như tìm dữ liệu trong một khoảng thời gian cụ thể), Index dựa trên chuỗi thường kém hiệu quả và thiếu linh hoạt hơn so với Index trên kiểu ngày giờ gốc.

## Lựa chọn giữa DATETIME và TIMESTAMP

`DATETIME` và `TIMESTAMP` là hai kiểu dữ liệu rất phổ biến trong MySQL để lưu trữ thông tin bao gồm cả ngày và giờ. Cả hai đều có thể lưu giá trị thời gian chính xác đến giây (từ MySQL 5.6.4+ hỗ trợ độ chính xác phần thập phân giây cao hơn). Vậy trong ứng dụng thực tế, chúng ta nên lựa chọn giữa hai kiểu này như thế nào?

Dưới đây chúng ta sẽ so sánh chúng qua một số khía cạnh cốt lõi:

### Thông tin múi giờ

Kiểu `DATETIME` lưu trữ **giá trị ngày giờ nguyên văn (literal)**, bản thân nó **không chứa bất kỳ thông tin múi giờ nào**. Khi bạn chèn một giá trị `DATETIME`, MySQL lưu đúng thời gian cụ thể mà bạn cung cấp mà không thực hiện bất kỳ phép chuyển đổi múi giờ nào.

**Điều này sẽ gây ra vấn đề gì?** Nếu ứng dụng của bạn cần hỗ trợ nhiều múi giờ, hoặc múi giờ của máy chủ hay client có thể thay đổi, thì khi dùng `DATETIME`, ứng dụng phải tự xử lý việc chuyển đổi và diễn giải múi giờ. Nếu xử lý không cẩn thận (ví dụ mặc định mọi thời gian lưu trữ đều thuộc cùng một múi giờ nhưng môi trường thực tế lại thay đổi), rất dễ dẫn đến sai lệch khi hiển thị hoặc tính toán thời gian.

**`TIMESTAMP` có liên quan đến múi giờ.** Khi lưu trữ, MySQL sẽ chuyển đổi giá trị thời gian theo múi giờ của session hiện tại sang UTC (Giờ phối hợp quốc tế) để lưu nội bộ. Khi truy vấn trường `TIMESTAMP`, MySQL lại chuyển đổi thời gian UTC đang lưu về đúng múi giờ được thiết lập cho session hiện tại để hiển thị.

Điều này có nghĩa là với cùng một trường `TIMESTAMP` của cùng một bản ghi, khi truy vấn dưới các thiết lập múi giờ session khác nhau có thể hiển thị giờ địa phương khác nhau, nhưng tất cả đều tương ứng với cùng một mốc thời gian tuyệt đối (giờ UTC). Điều này cực kỳ hữu ích cho các ứng dụng cần hỗ trợ toàn cầu hóa và đa múi giờ.

Hãy cùng minh họa thực tế ngay dưới đây!

Câu SQL tạo bảng:

```sql
CREATE TABLE `time_zone_test` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `date_time` datetime DEFAULT NULL,
  `time_stamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

Chèn một dòng dữ liệu (giả sử múi giờ session hiện tại là mặc định hệ thống, ví dụ UTC+0):

```sql
INSERT INTO time_zone_test(date_time,time_stamp) VALUES(NOW(),NOW());
```

Truy vấn dữ liệu (trong cùng session múi giờ đó):

```sql
SELECT date_time, time_stamp FROM time_zone_test;
```

Kết quả:

```plain
+---------------------+---------------------+
| date_time           | time_stamp          |
+---------------------+---------------------+
| 2020-01-11 09:53:32 | 2020-01-11 09:53:32 |
+---------------------+---------------------+
```

Bây giờ đổi múi giờ của session hiện tại sang múi giờ Đông 8 (UTC+8):

```sql
SET time_zone = '+8:00';
```

Truy vấn lại dữ liệu:

```bash
# Giá trị TIMESTAMP tự động chuyển đổi sang giờ UTC+8
+---------------------+---------------------+
| date_time           | time_stamp          |
+---------------------+---------------------+
| 2020-01-11 09:53:32 | 2020-01-11 17:53:32 |
+---------------------+---------------------+
```

**Mở rộng: Các lệnh SQL thường dùng để thiết lập múi giờ MySQL**

```sql
# Xem múi giờ session hiện tại
SELECT @@session.time_zone;
# Thiết lập múi giờ session hiện tại
SET time_zone = 'Europe/Helsinki';
SET time_zone = "+00:00";
# Xem thiết lập múi giờ toàn cục của cơ sở dữ liệu
SELECT @@global.time_zone;
# Thiết lập múi giờ toàn cục
SET GLOBAL time_zone = '+8:00';
SET GLOBAL time_zone = 'Europe/Helsinki';
```

### Dung lượng lưu trữ

Hình dưới đây là dung lượng lưu trữ của các kiểu ngày giờ trong MySQL (liên kết tài liệu chính thức: <https://dev.mysql.com/doc/refman/8.0/en/storage-requirements.html>):

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/FhRGUVHFK0ujRPNA75f6CuOXQHTE-2973221a.jpg)

Trước MySQL 5.6.4, dung lượng lưu trữ của `DATETIME` và `TIMESTAMP` là cố định, lần lượt là 8 byte và 4 byte. Nhưng kể từ MySQL 5.6.4, dung lượng lưu trữ của chúng thay đổi tùy theo độ chính xác phần mili-giây/micro-giây: phạm vi của `DATETIME` là 5~8 byte, còn `TIMESTAMP` là 4~7 byte.

### Phạm vi biểu diễn

Phạm vi thời gian mà `TIMESTAMP` biểu diễn được nhỏ hơn, chỉ đến năm 2038:

- `DATETIME`: `'1000-01-01 00:00:00.000000'` đến `'9999-12-31 23:59:59.999999'`
- `TIMESTAMP`: `'1970-01-01 00:00:01.000000'` UTC đến `'2038-01-19 03:14:07.999999'` UTC

### Hiệu năng

Do `TIMESTAMP` khi lưu trữ và truy xuất cần thực hiện chuyển đổi giữa UTC và múi giờ session hiện tại, quá trình này có thể phát sinh thêm chi phí tính toán, đặc biệt khi cần gọi các giao diện tầng dưới của hệ điều hành để lấy hoặc xử lý thông tin múi giờ. Mặc dù cơ sở dữ liệu và hệ điều hành hiện đại đã tối ưu điều này, nhưng trong một số kịch bản đồng thời cực cao hoặc cực kỳ nhạy cảm về độ trễ, `DATETIME` nhờ không liên quan tới chuyển đổi múi giờ và logic xử lý trực tiếp hơn có thể thể hiện lợi thế hiệu năng nhỉnh hơn một chút.

Để đạt được hành vi có thể dự đoán trước và giảm chi phí chuyển đổi của `TIMESTAMP`, cách làm được khuyến nghị là quản lý múi giờ thống nhất ở tầng ứng dụng, hoặc thiết lập tường minh tham số `time_zone` ở cấp kết nối/session cơ sở dữ liệu, thay vì phụ thuộc vào múi giờ mặc định của máy chủ hoặc hệ điều hành.

## Timestamp dạng số có phải là lựa chọn tốt hơn không?

Ngoài hai kiểu trên, trong thực tế người ta cũng thường dùng kiểu số nguyên (`INT` hoặc `BIGINT`) để lưu cái gọi là "Unix Timestamp" (tổng số giây hoặc mili-giây tính từ `1970-01-01 00:00:00 UTC` đến thời điểm mục tiêu).

Cách lưu trữ này có một số ưu điểm của kiểu `TIMESTAMP`, đồng thời việc dùng nó để sắp xếp hay so sánh ngày tháng có hiệu năng cao hơn nữa và rất thuận tiện khi giao tiếp liên hệ thống, bởi vì chỉ lưu giá trị số. Nhược điểm cũng rất rõ ràng: khả năng đọc hiểu của dữ liệu quá kém, bạn không thể nhìn trực quan ra ngay thời gian cụ thể là lúc nào.

Định nghĩa của Timestamp như sau:

> Định nghĩa của Timestamp là tính từ một mốc thời gian chuẩn; mốc chuẩn này là `1970-1-1 00:00:00 +0:00`. Tính từ thời điểm này, biểu diễn bằng số nguyên đếm theo giây, và theo dòng chảy thời gian thì số nguyên này liên tục tăng lên. Như vậy, tôi chỉ cần một con số là có thể biểu diễn hoàn hảo thời gian, hơn nữa con số này là giá trị tuyệt đối — tức dù bạn ở bất kỳ nơi nào trên Trái Đất, Timestamp biểu diễn thời điểm đó đều giống hệt nhau, giá trị sinh ra giống nhau và không có khái niệm múi giờ. Vì thế trong quá trình truyền tải thời gian giữa các hệ thống không cần chuyển đổi bổ sung, chỉ khi hiển thị cho người dùng mới chuyển thành chuỗi thời gian địa phương.

Thao tác thực tế trong cơ sở dữ liệu:

```sql
-- Chuyển chuỗi ngày giờ sang Unix Timestamp (giây)
mysql> SELECT UNIX_TIMESTAMP('2020-01-11 09:53:32');
+---------------------------------------+
| UNIX_TIMESTAMP('2020-01-11 09:53:32') |
+---------------------------------------+
|                            1578707612 |
+---------------------------------------+
1 row in set (0.00 sec)

-- Chuyển Unix Timestamp (giây) sang định dạng ngày giờ
mysql> SELECT FROM_UNIXTIME(1578707612);
+---------------------------+
| FROM_UNIXTIME(1578707612) |
+---------------------------+
| 2020-01-11 09:53:32       |
+---------------------------+
1 row in set (0.01 sec)
```

## PostgreSQL không có kiểu DATETIME

Vì có độc giả nhắc đến các kiểu thời gian của PostgreSQL (PG), nên ở đây mình bổ sung thêm phần mở rộng này. Địa chỉ tài liệu chính thức của PG mô tả các kiểu thời gian: <https://www.postgresql.org/docs/current/datatype-datetime.html>.

![Tổng hợp các kiểu thời gian trong PostgreSQL](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/pg-datetime-types-f8e8b460.png)

Có thể thấy PG không có kiểu nào tên là `DATETIME`:

- `TIMESTAMP WITHOUT TIME ZONE` của PG về chức năng gần với `DATETIME` của MySQL nhất. Nó lưu ngày và giờ nhưng không chứa thông tin múi giờ nào, lưu đúng giá trị nguyên văn.
- `TIMESTAMP WITH TIME ZONE` (hoặc `TIMESTAMPTZ`) của PG tương đương với `TIMESTAMP` của MySQL. Khi lưu trữ nó sẽ chuyển giá trị đầu vào sang UTC, và khi truy vấn sẽ chuyển đổi hiển thị theo múi giờ session hiện tại.

Với đại đa số kịch bản ứng dụng cần ghi nhận chính xác mốc thời gian phát sinh, `TIMESTAMPTZ` là lựa chọn được khuyến nghị nhất và bền vững nhất trong PostgreSQL vì nó xử lý tốt nhất sự phức tạp của múi giờ.

## Tổng kết

Trong MySQL rốt cuộc nên lưu thời gian thế nào cho tốt? `DATETIME`? `TIMESTAMP`? Hay Timestamp dạng số?

Không hề có viên đạn bạc nào cho mọi trường hợp. Nhiều lập trình viên cảm thấy Timestamp dạng số thật sự rất tuyệt, vừa hiệu năng cao lại tương thích đủ thứ, nhưng nhiều người lại thấy nó thể hiện không đủ trực quan.

Tác giả của cuốn sách kinh điển *High Performance MySQL* khuyến nghị dùng `TIMESTAMP` với lý do biểu diễn bằng số không đủ trực quan. Dưới đây là đoạn nguyên văn:

<img src="/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql--3820a4ce.jpg" style="zoom:50%;" />

Mỗi cách đều có ưu thế riêng; lựa chọn phương án phù hợp nhất dựa trên kịch bản thực tế mới là chân ái. Dưới đây là bảng so sánh nhanh ba cách này để mọi người chọn đúng kiểu dữ liệu lưu thời gian trong quá trình phát triển thực tế:

| Kiểu              | Dung lượng lưu trữ | Định dạng ngày giờ             | Phạm vi ngày giờ                                            | Có lưu thông tin múi giờ không |
| ----------------- | ------------------ | ------------------------------ | ----------------------------------------------------------- | ------------------------------ |
| DATETIME          | 5~8 byte           | YYYY-MM-DD hh:mm:ss[.fraction] | 1000-01-01 00:00:00[.000000] ～ 9999-12-31 23:59:59[.999999] | Không                          |
| TIMESTAMP         | 4~7 byte           | YYYY-MM-DD hh:mm:ss[.fraction] | 1970-01-01 00:00:01[.000000] ～ 2038-01-19 03:14:07[.999999] | Có                             |
| Timestamp dạng số | 4 byte             | Toàn chữ số như 1578707612     | Thời gian sau 1970-01-01 00:00:01                           | Không                          |

**Tóm tắt gợi ý lựa chọn:**

- Ưu thế cốt lõi của `TIMESTAMP` nằm ở khả năng xử lý múi giờ tích hợp sẵn. Cơ sở dữ liệu đảm nhận việc lưu trữ theo UTC và tự động chuyển đổi dựa trên múi giờ session, giúp đơn giản hóa việc phát triển cho các ứng dụng cần hỗ trợ đa múi giờ. Nếu ứng dụng cần xử lý đa múi giờ hoặc muốn cơ sở dữ liệu tự động quản lý việc chuyển đổi múi giờ, `TIMESTAMP` là lựa chọn tự nhiên (chú ý giới hạn phạm vi thời gian, tức vấn đề năm 2038).
- Nếu kịch bản ứng dụng không liên quan đến chuyển đổi múi giờ, hoặc muốn tầng ứng dụng kiểm soát hoàn toàn logic múi giờ và cần biểu diễn thời gian sau năm 2038, `DATETIME` là lựa chọn an toàn hơn.
- Nếu cực kỳ quan tâm đến hiệu năng so sánh, hoặc thường xuyên truyền tải dữ liệu thời gian xuyên hệ thống và chấp nhận đánh đổi tính dễ đọc (hoặc luôn chuyển đổi ở tầng ứng dụng), Timestamp dạng số là một lựa chọn rất mạnh.
