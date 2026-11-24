---
title: Tổng hợp quy chuẩn và khuyến nghị tối ưu hóa hiệu năng cao cho MySQL
description: Tổng hợp các quy chuẩn và khuyến nghị tối ưu hóa MySQL hiệu năng cao, bao gồm quy ước đặt tên cơ sở dữ liệu, quy chuẩn thiết kế bảng, thiết kế trường dữ liệu, thiết kế index, quy chuẩn viết SQL, giúp bạn xây dựng hệ thống cơ sở dữ liệu hiệu quả và ổn định.
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: Quy chuẩn tối ưu hóa MySQL,thiết kế database,thiết kế index,quy chuẩn viết SQL,tối ưu slow query,lựa chọn kiểu dữ liệu cột,thiết kế bảng
lang: vi
sourceRef: zh-ref/database/mysql/mysql-high-performance-optimization-specification-recommendations.md
---

> Tác giả: Thính Phong (Ting Feng). Địa chỉ bài viết gốc: <https://www.cnblogs.com/huchong/p/10219318.html>.
>
> JavaGuide đã được sự cho phép của tác giả và tiến hành bổ sung, hoàn thiện nội dung gốc.

## Quy chuẩn đặt tên cơ sở dữ liệu

- Tên của tất cả các đối tượng cơ sở dữ liệu bắt buộc phải sử dụng chữ cái viết thường và phân cách bằng dấu gạch dưới (`snake_case`).
- Nghiêm cấm sử dụng các từ khóa dành riêng (reserved keywords) của MySQL để đặt tên cho đối tượng cơ sở dữ liệu (nếu tên bảng chứa từ khóa, khi truy vấn bắt buộc phải bọc trong dấu backtick/nháy đơn).
- Việc đặt tên đối tượng cơ sở dữ liệu cần đảm bảo nhìn tên hiểu ngay ý nghĩa, và tốt nhất không nên vượt quá 32 ký tự.
- Bảng và cơ sở dữ liệu tạm thời bắt buộc phải có tiền tố `tmp_` và hậu tố là ngày tháng; bảng sao lưu (backup) bắt buộc phải có tiền tố `bak_` và hậu tố là ngày tháng (hoặc timestamp).
- Tất cả các cột lưu trữ cùng một loại dữ liệu trên các bảng phải có tên cột và kiểu dữ liệu hoàn toàn nhất quán (thường đóng vai trò là cột liên kết; nếu các cột liên kết khi truy vấn không cùng kiểu dữ liệu, MySQL sẽ tự động thực hiện ép kiểu ngầm định - implicit conversion, dẫn đến index trên cột bị vô hiệu hóa và làm giảm sút hiệu năng truy vấn).

## Quy chuẩn thiết kế cơ sở dữ liệu cơ bản

### Tất cả các bảng bắt buộc phải sử dụng Storage Engine InnoDB

Trừ khi có yêu cầu đặc thù (nghĩa là các tính năng mà InnoDB không thể đáp ứng như: lưu trữ dạng cột - columnar storage, lưu trữ dữ liệu không gian - spatial data...), tất cả các bảng đều phải sử dụng storage engine InnoDB (trước MySQL 5.5 mặc định là MyISAM, từ MySQL 5.6 trở đi mặc định là InnoDB).

InnoDB hỗ trợ transaction (giao dịch), hỗ trợ khóa cấp dòng (row-level lock), có khả năng phục hồi sau sự cố tốt hơn và đạt hiệu năng cao hơn rất nhiều trong môi trường xử lý đồng thời lớn (high concurrency).

### Bảng mã ký tự của cơ sở dữ liệu và bảng phải thống nhất sử dụng UTF8

Tính tương thích tốt hơn, việc thống nhất charset giúp tránh tình trạng lỗi font hiển thị (ký tự lạ/loạn mã). Việc so sánh giữa các charset khác nhau đòi hỏi bước chuyển đổi kiểu dữ liệu lúc runtime gây mất tác dụng của index. Nếu cơ sở dữ liệu có nhu cầu lưu trữ biểu tượng cảm xúc (emoji), bắt buộc phải dùng charset `utf8mb4`.

Bài viết khuyến nghị nên đọc: [Chi tiết về bảng mã ký tự (Character Set) trong MySQL](../character-set.md).

### Tất cả các bảng và trường dữ liệu đều phải thêm chú thích (Comment)

Sử dụng mệnh đề `COMMENT` để thêm mô tả giải thích cho bảng và từng cột, nhằm duy trì và hoàn thiện từ điển dữ liệu (data dictionary) ngay từ ban đầu.

### Cố gắng kiểm soát dung lượng dữ liệu trên một bảng đơn lẻ, khuyến nghị dưới 5 triệu dòng

Con số 5 triệu dòng không phải là giới hạn cứng của MySQL, nhưng một bảng quá lớn sẽ gây ra vô vàn rắc rối khi thay đổi cấu trúc bảng (DDL), sao lưu (backup) cũng như phục hồi dữ liệu (restore).

Có thể áp dụng các giải pháp như lưu trữ dữ liệu lịch sử vào kho lưu trữ riêng (áp dụng cho dữ liệu log), hoặc phân chia cơ sở dữ liệu và phân tách bảng (sharding database/table - áp dụng cho dữ liệu nghiệp vụ) để kiểm soát kích thước dữ liệu.

### Thận trọng khi sử dụng bảng phân vùng (Partitioned Table) trong MySQL

Bảng phân vùng về mặt vật lý được chia thành nhiều tệp tin riêng biệt, nhưng về mặt logic vẫn hiển thị như một bảng đơn lẻ.

Cần lựa chọn khóa phân vùng (partition key) một cách cẩn trọng, bởi vì các truy vấn xuyên phân vùng (cross-partition query) có thể mang lại hiệu suất còn kém hơn bình thường.

Khuyến nghị nên áp dụng phương án phân tách bảng vật lý (physical sharding) để quản lý dữ liệu lớn.

### Đặt các cột thường xuyên được truy vấn cùng nhau vào chung một bảng

Điều này giúp hạn chế tối đa các thao tác kết hợp dữ liệu (JOIN) giữa nhiều bảng.

### Nghiêm cấm tạo các trường dữ liệu dự phòng (Reserved Fields) trong bảng

- Tên của các trường dự phòng rất khó để thể hiện rõ ràng ngữ nghĩa nghiệp vụ.
- Không thể xác định trước kiểu dữ liệu sẽ lưu trữ trong các trường dự phòng, dẫn đến không thể chọn được kiểu dữ liệu tối ưu.
- Việc thay đổi kiểu dữ liệu cho trường dự phòng sau này sẽ gây khóa bảng.

### Nghiêm cấm lưu trữ dữ liệu nhị phân lớn như tệp tin (hình ảnh...) trực tiếp trong cơ sở dữ liệu

Lưu trữ tệp tin trong database sẽ ảnh hưởng nghiêm trọng đến hiệu năng hệ thống và tiêu tốn quá nhiều dung lượng lưu trữ đắt đỏ của database.

Các dữ liệu nhị phân lớn như tệp tin (hình ảnh, video, tài liệu) nên được lưu trữ trên máy chủ tệp chuyên dụng hoặc dịch vụ lưu trữ đối tượng (Object Storage), cơ sở dữ liệu chỉ lưu trữ đường dẫn URL truy cập tệp.

### Không nên bị gò bó quá mức bởi các dạng chuẩn cơ sở dữ liệu (Database Normalization)

Thông thường, khi thiết kế cơ sở dữ liệu quan hệ, chúng ta hướng tới việc thỏa mãn Chuẩn 3 (3NF). Tuy nhiên, để đáp ứng 3NF, chúng ta có thể phải chia tách thành rất nhiều bảng nhỏ. Khi truy vấn, hệ thống buộc phải thực hiện JOIN nhiều bảng. Đôi khi, nhằm gia tăng tốc độ truy vấn, người ta chủ động nới lỏng các yêu cầu chuẩn hóa bằng cách lưu lại một mức độ dư thừa thông tin hợp lý trong bảng, kỹ thuật này gọi là phản chuẩn hóa (denormalization). Nhưng cần hết sức lưu ý: phản chuẩn hóa phải được áp dụng có chừng mực.

### Nghiêm cấm thực hiện kiểm thử chịu tải (Stress Test) trên môi trường Production

### Nghiêm cấm kết nối trực tiếp từ môi trường Dev/Test đến cơ sở dữ liệu Production

Rủi ro bảo mật và vận hành là cực kỳ lớn, hãy luôn có thái độ cẩn trọng và tôn trọng tuyệt đối môi trường production!

## Quy chuẩn thiết kế trường dữ liệu (Column/Field)

### Ưu tiên chọn kiểu dữ liệu nhỏ nhất đáp ứng đủ nhu cầu lưu trữ

Số byte lưu trữ càng nhỏ thì không gian chiếm dụng trên đĩa và bộ nhớ càng ít, từ đó hiệu năng I/O và cache càng cao.

**a. Một số chuỗi ký tự có thể chuyển đổi thành kiểu số để lưu trữ, ví dụ chuyển địa chỉ IP thành số nguyên.**

Các giá trị số mang tính liên tục, hiệu năng xử lý tốt hơn và tốn ít dung lượng hơn.

MySQL cung cấp hai hàm tích hợp sẵn để xử lý địa chỉ IP:

- `INET_ATON()`: Chuyển đổi địa chỉ IPv4 thành số nguyên không dấu (4 đến 8 byte);
- `INET_NTOA()`: Chuyển đổi số nguyên IP thành chuỗi địa chỉ IP.

Trước khi chèn dữ liệu, dùng `INET_ATON()` để chuyển địa chỉ IP thành số nguyên; khi cần hiển thị dữ liệu ra ngoài, dùng `INET_NTOA()` để chuyển số nguyên thành chuỗi địa chỉ IP.

**b. Đối với dữ liệu không âm (như ID tự tăng, IP dạng số nguyên, độ tuổi), hãy ưu tiên sử dụng số nguyên không dấu (UNSIGNED).**

Kiểu không dấu mang lại dải giá trị dương gấp đôi so với kiểu có dấu:

```sql
SIGNED INT -2147483648~2147483647
UNSIGNED INT 0~4294967295
```

**c. Đối với các giá trị số nhỏ (như độ tuổi, mã trạng thái 0/1), hãy ưu tiên sử dụng kiểu `TINYINT`.**

### Tránh sử dụng kiểu dữ liệu TEXT, BLOB; kiểu TEXT phổ biến nhất có thể lưu trữ tới 64 KB

**a. Khuyến nghị tách riêng các cột BLOB hoặc TEXT sang bảng mở rộng độc lập.**

Bảng tạm trong bộ nhớ (in-memory temporary table) của MySQL không hỗ trợ các kiểu dữ liệu lớn như `TEXT` và `BLOB`. Nếu câu truy vấn chứa các dữ liệu này, các thao tác như sắp xếp (sorting) sẽ không thể dùng bảng tạm trên RAM mà bắt buộc phải chuyển sang dùng bảng tạm trên đĩa (disk temporary table). Hơn nữa, với dữ liệu dạng này, MySQL thường phải thực hiện truy vấn phụ (secondary lookup), khiến hiệu năng SQL sụt giảm nghiêm trọng. Tuy nhiên, điều này không có nghĩa là tuyệt đối không được dùng.

Nếu bắt buộc phải dùng, khuyến nghị nên tách cột `BLOB` hoặc `TEXT` ra một bảng mở rộng riêng biệt. Khi truy vấn, tuyệt đối không dùng `SELECT *` mà chỉ lấy các cột thực sự cần thiết; khi không cần đến nội dung cột `TEXT`, đừng đưa cột đó vào câu truy vấn.

**b. Cột kiểu TEXT hoặc BLOB chỉ có thể dùng Prefix Index (Index tiền tố).**

Do MySQL có giới hạn về độ dài của trường tạo index, nên kiểu `TEXT` chỉ có thể đánh index tiền tố, và cột kiểu `TEXT` không được phép có giá trị mặc định (default value).

### Tránh sử dụng kiểu ENUM

- Muốn chỉnh sửa giá trị `ENUM` phải dùng câu lệnh `ALTER TABLE`.
- Thao tác `ORDER BY` trên kiểu `ENUM` có hiệu suất thấp, đòi hỏi các bước xử lý phụ.
- Kiểu dữ liệu `ENUM` tồn tại một số hạn chế, chẳng hạn như không nên dùng số nguyên làm giá trị enum.

Bài viết liên quan: [Có nên sử dụng kiểu ENUM của MySQL không? - Architecture Digest - Zhihu](https://www.zhihu.com/question/404422255/answer/1661698499).

### Cố gắng định nghĩa tất cả các cột là NOT NULL

Trừ khi có lý do thực sự đặc biệt cần dùng giá trị `NULL`, còn lại nên luôn đặt các trường là `NOT NULL`.

- Việc lập index cho các cột chứa `NULL` đòi hỏi thêm không gian lưu trữ (bitmap quản lý null).
- Khi thực hiện so sánh và tính toán, MySQL phải xử lý đặc biệt đối với giá trị `NULL`.

Bài viết liên quan: [Chia sẻ kỹ thuật | Lựa chọn giá trị mặc định trong MySQL (Chuỗi rỗng hay NULL)](https://opensource.actionsky.com/20190710-mysql/).

### Tuyệt đối không dùng chuỗi ký tự (String) để lưu trữ ngày tháng

Đối với kiểu ngày tháng, tuyệt đối không dùng chuỗi ký tự để lưu trữ. Hãy cân nhắc sử dụng `DATETIME`, `TIMESTAMP` hoặc timestamp dạng số nguyên.

Cả ba cách tiếp cận này đều có những ưu điểm riêng, việc lựa chọn phương án phù hợp nhất tùy thuộc vào ngữ cảnh thực tế. Dưới đây là bảng so sánh ngắn gọn giữa ba phương thức này để hỗ trợ việc lựa chọn chính xác trong quá trình phát triển:

| Kiểu dữ liệu | Dung lượng lưu trữ | Định dạng ngày tháng | Khoảng giá trị ngày tháng | Có chứa thông tin múi giờ không |
| --- | --- | --- | --- | --- |
| DATETIME | 5~8 byte | YYYY-MM-DD hh:mm:ss[.fraction] | 1000-01-01 00:00:00[.000000] ～ 9999-12-31 23:59:59[.999999] | Không |
| TIMESTAMP | 4~7 byte | YYYY-MM-DD hh:mm:ss[.fraction] | 1970-01-01 00:00:01[.000000] ～ 2038-01-19 03:14:07[.999999] | Có |
| Timestamp dạng số | 4 byte | Dạng số nguyên thuần túy như 1578707612 | Thời gian sau 1970-01-01 00:00:01 | Không |

Bài viết phân tích chi tiết về lựa chọn kiểu thời gian trong MySQL: [Khuyến nghị lưu trữ dữ liệu kiểu thời gian trong MySQL](https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html).

### Dữ liệu tiền tệ liên quan đến tài chính bắt buộc phải dùng kiểu DECIMAL

- **Số thực dấu phẩy động không chính xác**: `FLOAT`, `DOUBLE`
- **Số thực dấu phẩy động chính xác tuyệt đối**: `DECIMAL`

Kiểu `DECIMAL` là số thực dấu phẩy tĩnh chính xác tuyệt đối, không làm mất độ chính xác trong quá trình tính toán. Dung lượng chiếm dụng phụ thuộc vào độ rộng khai báo, mỗi 4 byte có thể lưu trữ 9 chữ số, và dấu chấm thập phân chiếm 1 byte. Ngoài ra, `DECIMAL` có thể được sử dụng để lưu trữ các số nguyên lớn hơn cả `BIGINT`.

Tuy nhiên, vì `DECIMAL` đòi hỏi nhiều không gian bộ nhớ và chi phí tính toán hơn, chỉ nên sử dụng khi nghiệp vụ thực sự đòi hỏi tính toán số liệu chuẩn xác tuyệt đối.

### Không nên để một bảng chứa quá nhiều trường dữ liệu

Nếu một bảng chứa quá nhiều cột, hãy cân nhắc phân rã thành nhiều bảng nhỏ hơn, khi cần thiết có thể sử dụng bảng trung gian hoặc bảng mở rộng 1-1 để liên kết.

## Quy chuẩn thiết kế Index

### Giới hạn số lượng index trên mỗi bảng, khuyến nghị không vượt quá 5 index

Index không phải càng nhiều càng tốt! Index có thể tăng tốc độ truy vấn, nhưng cũng có thể làm giảm hiệu năng toàn hệ thống.

Index giúp tăng tốc độ đọc dữ liệu, nhưng đồng thời sẽ làm chậm tốc độ ghi (INSERT, UPDATE, DELETE), thậm chí trong một số trường hợp còn làm chậm cả tốc độ truy vấn.

Nguyên nhân là do bộ tối ưu hóa (optimizer) của MySQL khi lựa chọn phương án thực thi sẽ căn cứ vào số liệu thống kê để đánh giá từng index khả dụng nhằm sinh ra execution plan tối ưu nhất. Nếu có quá nhiều index cùng lúc có thể áp dụng cho câu truy vấn, thời gian mà optimizer tiêu tốn để phân tích và sinh execution plan sẽ kéo dài, gián tiếp làm giảm hiệu năng truy vấn.

### Nghiêm cấm sử dụng Full-Text Index

Full-Text Index không phù hợp với các hệ thống giao dịch trực tuyến chịu tải cao (OLTP).

### Nghiêm cấm tạo index đơn lẻ cho từng cột trong bảng

Trước phiên bản MySQL 5.6, một câu lệnh SQL chỉ có thể tận dụng tối đa 1 index trên 1 bảng; từ phiên bản 5.6 trở đi, dù đã có cơ chế tối ưu gộp index (Index Merge), nhưng hiệu năng của nó vẫn kém xa so với việc sử dụng một Composite Index (chỉ mục kết hợp) được thiết kế bài bản.

### Mỗi bảng InnoDB bắt buộc phải có một khóa chính (Primary Key)

Bảng trong InnoDB là bảng tổ chức theo chỉ mục (Index-Organized Table - IOT): thứ tự lưu trữ vật lý của dữ liệu hoàn toàn trùng khớp với thứ tự của khóa chính (Clustered Index). Một bảng có thể có nhiều secondary index, nhưng trật tự lưu trữ vật lý của bảng thì chỉ có duy nhất một trật tự.

InnoDB tổ chức dữ liệu của bảng theo đúng thứ tự của khóa chính.

- Không dùng cột có tần suất cập nhật thường xuyên làm khóa chính, không dùng khóa chính kết hợp từ nhiều cột (composite primary key).
- Không dùng UUID, MD5, HASH hay các chuỗi ký tự ngẫu nhiên làm khóa chính (không đảm bảo tính tăng dần tuần tự của dữ liệu).
- Khóa chính khuyến nghị nên sử dụng ID tự tăng (auto-increment integer ID).

### Khuyến nghị các cột nên tạo Index

- Các cột xuất hiện trong mệnh đề `WHERE` của các câu lệnh `SELECT`, `UPDATE`, `DELETE`.
- Các trường nằm trong các mệnh đề `ORDER BY`, `GROUP BY`, `DISTINCT`.
- Không tạo index đơn lẻ cho từng cột thỏa mãn hai điều kiện trên; thông thường kết hợp các trường ở điều 1 và 2 thành một Composite Index sẽ mang lại hiệu quả cao hơn nhiều.
- Các cột liên kết khi JOIN giữa nhiều bảng.

### Cách sắp xếp thứ tự các cột trong Composite Index

Mục đích của việc tạo index là: tìm kiếm dữ liệu nhanh chóng thông qua index, giảm thiểu I/O ngẫu nhiên (random I/O), tăng tốc độ truy vấn; index lọc được càng nhiều dữ liệu thì số trang dữ liệu phải nạp từ đĩa vào bộ nhớ càng ít.

- **Cột có độ phân biệt (cardinality / độ chọn lọc) cao nhất đặt ở ngoài cùng bên trái của Composite Index**: Đây là nguyên tắc quan trọng nhất. Độ phân biệt càng cao thì lượng dữ liệu lọc qua index càng ít, dẫn đến thao tác I/O càng giảm. Công thức tính độ phân biệt: `count(distinct column) / count(*)`.
- **Cột có tần suất sử dụng thường xuyên nhất đặt ở bên trái**: Điều này tuân thủ nguyên tắc tiền tố ngoài cùng bên trái (Leftmost Prefix Rule). Đặt điều kiện truy vấn phổ biến nhất ở ngoài cùng bên trái giúp tối đa hóa khả năng tái sử dụng index.
- **Độ dài của trường dữ liệu**: Độ dài trường ảnh hưởng rất ít đến các node phi lá (non-leaf node) của Composite Index vì nó lưu trữ giá trị của tất cả các trường trong index kết hợp. Độ dài trường chủ yếu ảnh hưởng đến dung lượng lưu trữ của khóa chính và các trường nằm trong secondary index, cũng như kích thước các node lá (leaf node). Do đó, khi lựa chọn thứ tự cột trong Composite Index, độ dài trường có mức độ ưu tiên thấp nhất. Đối với khóa chính và các trường trong index khác, việc chọn trường có độ dài ngắn hơn sẽ tiết kiệm không gian lưu trữ và tăng hiệu năng bộ đệm I/O.

### Tránh tạo Index dư thừa (Redundant Index) và Index trùng lặp (Duplicate Index)

Index dư thừa làm tăng thời gian bộ tối ưu hóa truy vấn sinh execution plan.

- Ví dụ về Duplicate Index: `primary key(id)`, `index(id)`, `unique index(id)`.
- Ví dụ về Redundant Index: `index(a,b,c)`, `index(a,b)`, `index(a)`.

### Đối với các truy vấn thường xuyên, ưu tiên sử dụng Covering Index (Chỉ mục bao phủ)

> Covering Index: Là index chứa toàn bộ các trường dữ liệu cần thiết cho câu truy vấn (các trường xuất hiện trong `WHERE`, `SELECT`, `ORDER BY`, `GROUP BY`).

**Lợi ích của Covering Index**:

- **Tránh việc bảng InnoDB phải thực hiện truy vấn thứ cấp, tức thao tác tra cứu lại bảng gốc (thao tác tra cứu lại bảng gốc / table lookup)**: InnoDB lưu trữ dữ liệu theo thứ tự của Clustered Index. Đối với InnoDB, node lá của secondary index chỉ lưu trữ thông tin khóa chính của dòng. Nếu truy vấn bằng secondary index, sau khi tìm thấy khóa tương ứng, MySQL vẫn phải mang khóa chính quay lại Clustered Index để tra cứu dòng dữ liệu thực tế. Trong khi đó, với Covering Index, toàn bộ dữ liệu cần thiết đều đã có sẵn trong node lá của secondary index, tránh hoàn toàn bước tra cứu khóa chính lần hai (tránh table lookup), giảm bớt I/O và tăng tốc truy vấn rõ rệt.
- **Biến I/O ngẫu nhiên (Random I/O) thành I/O tuần tự (Sequential I/O) giúp đẩy nhanh tốc độ truy vấn**: Vì Covering Index được lưu trữ tuần tự theo giá trị khóa, đối với các truy vấn dải (range query) nặng về I/O, số lần đọc đĩa sẽ ít hơn nhiều so với việc đọc ngẫu nhiên từng dòng dữ liệu nằm phân tán trên đĩa. Do đó, tận dụng Covering Index sẽ chuyển đổi các thao tác đọc đĩa ngẫu nhiên thành thao tác quét tuần tự theo trật tự của index.

---

### Quy chuẩn về ràng buộc Index (SET)

**Cố gắng tránh sử dụng ràng buộc khóa ngoại (Foreign Key)**

- Không khuyến khích sử dụng ràng buộc khóa ngoại cấp cơ sở dữ liệu (`FOREIGN KEY`), nhưng bắt buộc phải tạo index trên các cột liên kết giữa các bảng.
- Khóa ngoại giúp đảm bảo tính toàn vẹn tham chiếu của dữ liệu, nhưng logic này nên được đảm bảo ở tầng ứng dụng (application/business logic).
- Khóa ngoại sẽ ảnh hưởng đến hiệu năng ghi trên cả bảng cha và bảng con do cơ chế khóa kiểm tra, làm giảm thông lượng hệ thống.

## Quy chuẩn phát triển câu lệnh SQL

### Hạn chế tối đa việc tính toán trong Database, các phép tính phức tạp cần đưa lên ứng dụng xử lý

Hạn chế tính toán trong database, chuyển các phép tính phức tạp lên tầng ứng dụng nghiệp vụ. Cách làm này giúp giảm tải áp lực cho database, bảo vệ hiệu năng và tính ổn định của hệ thống dữ liệu. Vai trò cốt lõi của database là lưu trữ và quản lý dữ liệu, chứ không phải xử lý tính toán chuyên sâu.

### Tập trung tối ưu các câu lệnh SQL có ảnh hưởng lớn nhất đến hiệu năng

Cần xác định chính xác những câu lệnh SQL cấp thiết cần tối ưu nhất. Đó có thể là các câu lệnh được gọi với tần suất dày đặc nhất, hoặc các câu lệnh mang lại hiệu quả cải thiện rõ rệt nhất sau khi tối ưu. Bạn có thể phát hiện các câu lệnh này thông qua việc phân tích nhật ký truy vấn chậm (Slow Query Log) của MySQL.

### Tận dụng triệt để các Index sẵn có trên bảng

Tránh sử dụng điều kiện tìm kiếm có ký tự đại diện `%` ở cả hai đầu, ví dụ: `a LIKE '%123%'` (nếu không có dấu `%` ở đầu mà chỉ có ở cuối như `a LIKE '123%'`, index trên cột vẫn hoạt động bình thường).

Một câu lệnh SQL thông thường chỉ có thể tận dụng một cột trong Composite Index để thực hiện truy vấn theo dải (range query). Ví dụ: có Composite Index trên các cột `(a, b, c)`, nếu trong điều kiện truy vấn có tìm kiếm theo dải trên cột `a`, thì index trên các cột `b` và `c` sẽ không thể dùng để định vị nhanh (index seek).

Khi định nghĩa Composite Index, nếu cột `a` cần tìm kiếm theo dải, hãy đặt cột `a` về phía ngoài cùng bên phải của Composite Index. Sử dụng `LEFT JOIN` hoặc `NOT EXISTS` để tối ưu các thao tác `NOT IN`, bởi vì `NOT IN` thường xuyên làm mất tác dụng của index.

### Nghiêm cấm sử dụng SELECT *; bắt buộc phải chỉ định danh sách cột rõ ràng (SELECT <Danh sách cột>)

- `SELECT *` tiêu tốn thêm tài nguyên CPU trong quá trình phân tích cú pháp và xử lý.
- `SELECT *` lấy ra các cột không cần thiết làm lãng phí băng thông mạng và kéo dài thời gian truyền tải dữ liệu, đặc biệt đối với các cột dữ liệu lớn (như `VARCHAR`, `BLOB`, `TEXT`).
- `SELECT *` không thể tận dụng cơ chế tối ưu Covering Index của bộ tối ưu hóa MySQL (Covering Index là chiến lược tối ưu truy vấn cực nhanh, hiệu quả vượt trội và được khuyến nghị hàng đầu trong ngành).
- Chỉ định danh sách cột cụ thể giúp hạn chế ảnh hưởng tiêu cực lên mã nguồn ứng dụng khi cấu trúc bảng thay đổi.

### Nghiêm cấm sử dụng câu lệnh INSERT không chỉ định danh sách cột

**Không khuyến nghị**:

```sql
insert into t values ('a','b','c');
```

**Khuyến nghị**:

```sql
insert into t(c1,c2,c3) values ('a','b','c');
```

### Khuyến nghị sử dụng Prepared Statements khi thao tác với cơ sở dữ liệu

- Prepared Statement có thể tái sử dụng execution plan đã được biên dịch, giảm bớt thời gian biên dịch SQL, đồng thời triệt tiêu rủi ro SQL Injection phát sinh do nối chuỗi động.
- Chỉ truyền tham số qua mạng hiệu quả và tiết kiệm băng thông hơn nhiều so với việc gửi toàn bộ chuỗi SQL lặp đi lặp lại.
- Cùng một câu lệnh chỉ cần phân tích (parse) một lần và có thể thực thi nhiều lần, tăng thông lượng xử lý.

### Tránh việc ép kiểu dữ liệu ngầm định (Implicit Type Conversion)

Ép kiểu ngầm định sẽ làm mất tác dụng của index, ví dụ:

```sql
select name,phone from customer where id = '111';
```

Phân tích chi tiết xin xem bài viết: [Hiện tượng mất index do ép kiểu ngầm định trong MySQL](./index-invalidation-caused-by-implicit-conversion.md).

### Tránh sử dụng Subquery (truy vấn con), nên tối ưu Subquery thành phép JOIN

Thông thường, subquery nằm trong mệnh đề `IN` và bản thân subquery là một câu SQL đơn giản (không chứa các mệnh đề `UNION`, `GROUP BY`, `ORDER BY`, `LIMIT`) thì mới có thể chuyển đổi thành câu truy vấn liên kết (JOIN) để tối ưu.

**Nguyên nhân khiến Subquery có hiệu năng kém**: Tập kết quả của subquery không thể tận dụng index; thông thường kết quả subquery sẽ được lưu vào một bảng tạm (dù là bảng tạm trên RAM hay trên đĩa đều không có index), do đó tốc độ truy vấn sẽ bị suy giảm. Đặc biệt đối với các subquery trả về tập dữ liệu lớn, mức độ ảnh hưởng đến hiệu năng càng trầm trọng. Vì subquery sinh ra lượng lớn bảng tạm không có index nên sẽ tiêu tốn rất nhiều tài nguyên CPU và I/O, dễ dẫn đến slow query.

### Tránh JOIN quá nhiều bảng trong một câu lệnh

Đối với MySQL, hệ thống có cơ chế bộ đệm liên kết (join buffer), kích thước bộ đệm được thiết lập qua tham số `join_buffer_size`.

Trong MySQL, cứ mỗi một bảng được JOIN thêm vào câu SQL, hệ thống sẽ cấp phát thêm một vùng join buffer. Nếu trong một câu lệnh có càng nhiều bảng liên kết thì lượng bộ nhớ bị chiếm dụng càng lớn.

Nếu chương trình lạm dụng các thao tác JOIN nhiều bảng trong khi tham số `join_buffer_size` cấu hình không hợp lý, rất dễ dẫn đến tình trạng máy chủ bị tràn bộ nhớ (OOM), gây nguy hại đến sự ổn định của hệ thống database.

Đồng thời, các thao tác liên kết phức tạp thường xuyên sinh ra bảng tạm, làm chậm tốc độ truy vấn. Dù MySQL cho phép tối đa 61 bảng JOIN cùng lúc, khuyến nghị thực tế là không nên vượt quá 5 bảng.

### Giảm thiểu số lần tương tác (Round Trips) với cơ sở dữ liệu

Cơ sở dữ liệu đặc biệt phù hợp để xử lý các thao tác theo lô (batch operations). Việc gộp nhiều thao tác tương đồng lại với nhau để thực thi một lần sẽ gia tăng đáng kể hiệu suất xử lý.

### Khi đánh giá điều kiện OR trên cùng một cột, hãy dùng IN thay vì OR

Số lượng giá trị trong mệnh đề `IN` không nên vượt quá 500. Thao tác `IN` tận dụng index hiệu quả hơn nhiều, trong khi điều kiện `OR` trong đa số trường hợp rất khó để tận dụng được index.

### Nghiêm cấm sử dụng ORDER BY RAND() để sắp xếp ngẫu nhiên

`ORDER BY RAND()` sẽ nạp toàn bộ các dòng thỏa mãn điều kiện trong bảng vào bộ nhớ, sau đó gán một giá trị ngẫu nhiên cho từng dòng và sắp xếp toàn bộ tập dữ liệu trong RAM. Nếu tập dữ liệu thỏa mãn điều kiện quá lớn, nó sẽ tiêu hao lượng tài nguyên CPU, I/O và RAM khổng lồ.

Khuyến nghị nên tạo giá trị ngẫu nhiên ở tầng code ứng dụng, sau đó truy vấn trực tiếp vào cơ sở dữ liệu để lấy dữ liệu.

### Trong mệnh đề WHERE nghiêm cấm áp dụng hàm hoặc phép tính toán lên cột dữ liệu

Việc áp dụng hàm hoặc tính toán số học lên cột dữ liệu sẽ khiến MySQL không thể sử dụng index trên cột đó.

**Không khuyến nghị**:

```sql
where date(create_time)='20190101'
```

**Khuyến nghị**:

```sql
where create_time >= '20190101' and create_time < '20190102'
```

### Sử dụng UNION ALL thay vì UNION khi chắc chắn không có dữ liệu trùng lặp

- `UNION` sẽ đưa toàn bộ dữ liệu của hai tập kết quả vào bảng tạm rồi mới thực hiện thao tác lọc trùng (deduplication).
- `UNION ALL` gộp trực tiếp các tập kết quả mà không cần thực hiện bước khử trùng lặp.

### Phân tách câu SQL lớn phức tạp thành nhiều câu SQL nhỏ

- Các câu SQL lớn thường có logic nghiệp vụ phức tạp và đòi hỏi lượng lớn tài nguyên CPU để tính toán.
- Trong MySQL, một câu lệnh SQL đơn lẻ chỉ sử dụng một nhân CPU duy nhất để xử lý.
- Sau khi chia tách câu SQL, ứng dụng có thể thực thi song song các câu truy vấn nhỏ để cải thiện thông lượng tổng thể.

### Ứng dụng kết nối tới các cơ sở dữ liệu khác nhau phải dùng các tài khoản khác nhau, nghiêm cấm truy vấn chéo database

- Tạo tiền đề thuận lợi cho việc di chuyển dữ liệu (migration) cũng như phân tách sharding sau này.
- Giảm thiểu mức độ phụ thuộc và liên kết (coupling) giữa các module nghiệp vụ.
- Hạn chế các rủi ro bảo mật bắt nguồn từ việc cấp quyền hạn quá lớn cho một tài khoản.

## Quy chuẩn thao tác và vận hành cơ sở dữ liệu

### Các tác vụ ghi dữ liệu hàng loạt (UPDATE, DELETE, INSERT) vượt quá 1 triệu dòng phải chia thành nhiều đợt nhỏ

**Thao tác hàng loạt lớn có thể gây độ trễ đồng bộ Replication nghiêm trọng**

Trong mô hình Master-Slave (Primary-Replica), các thao tác ghi dữ liệu khổng lồ thường tốn nhiều thời gian thực thi trên Master. Chỉ sau khi hoàn tất trên Master, lệnh mới được đẩy sang các Slave để thực thi lại, dẫn đến độ trễ đồng bộ (Replication Lag) kéo dài nghiêm trọng giữa Master và Slave.

**Định dạng Row-based Binlog sẽ sinh ra lượng log khổng lồ**

Ghi dữ liệu hàng loạt sinh ra khối lượng log rất lớn, đặc biệt với định dạng Row-based ghi lại chi tiết từng dòng dữ liệu bị thay đổi. Càng nhiều dòng dữ liệu bị sửa đổi cùng lúc thì dung lượng log phát sinh càng lớn, thời gian truyền tải mạng và thời gian replay log trên Slave càng kéo dài, đây cũng là một nguyên nhân trực tiếp gây ra Replication Lag.

**Tránh tạo ra các giao dịch quá lớn (Large Transactions)**

Việc chỉnh sửa khối lượng lớn dữ liệu chắc chắn sẽ diễn ra trong khuôn khổ một transaction. Điều này dẫn đến tình trạng khóa một lượng lớn dữ liệu trong bảng, gây nghẽn và chờ khóa (blocking) diện rộng. Hiện tượng blocking gây tác động cực kỳ tiêu cực đến hiệu năng của MySQL.

Đặc biệt, tình trạng chờ khóa kéo dài có thể làm cạn kiệt toàn bộ các kết nối khả dụng của database, khiến các ứng dụng khác trên môi trường production không thể kết nối vào database. Do đó, bắt buộc phải chia nhỏ các tác vụ ghi dữ liệu lớn thành từng lô.

### Đối với các bảng dữ liệu lớn, hãy sử dụng pt-online-schema-change để thay đổi cấu trúc bảng

- Tránh độ trễ Replication giữa Master và Slave khi thay đổi cấu trúc bảng lớn.
- Tránh tình trạng khóa bảng khi chỉnh sửa trường hoặc thêm index.

Việc chỉnh sửa cấu trúc dữ liệu trên các bảng lớn bắt buộc phải hết sức cẩn trọng, vì nó có thể gây khóa bảng nghiêm trọng, điều không thể chấp nhận được trên môi trường production.

Công cụ `pt-online-schema-change` hoạt động theo nguyên lý: trước tiên tạo một bảng mới có cấu trúc giống hệt bảng gốc, thực hiện thay đổi cấu trúc trên bảng mới, sau đó sao chép dữ liệu từ bảng gốc sang bảng mới theo từng khối nhỏ, đồng thời tạo trigger trên bảng gốc để hứng các thay đổi phát sinh trong quá trình sao chép. Sau khi toàn bộ dữ liệu đã được đồng bộ hoàn tất, nó sẽ tiến hành đổi tên bảng mới thành bảng gốc và xóa bảng cũ đi. Thao tác này giúp phân tách một lệnh DDL gây khóa bảng lớn thành nhiều đợt nhỏ không gây gián đoạn dịch vụ.

### Nghiêm cấm cấp quyền SUPER cho tài khoản dùng cho ứng dụng

- Khi số lượng kết nối chạm ngưỡng tối đa (`max_connections`), MySQL vẫn luôn dự phòng 1 kết nối dành riêng cho người dùng có quyền `SUPER`.
- Quyền `SUPER` chỉ nên dành riêng cho tài khoản của DBA để xử lý và khắc phục sự cố khẩn cấp.

### Tuân thủ nguyên tắc đặc quyền tối thiểu (Least Privilege) cho tài khoản ứng dụng

- Tài khoản database mà ứng dụng sử dụng chỉ được phép thao tác trong phạm vi một DB duy nhất, không được phép truy cập chéo sang database khác.
- Về mặt nguyên tắc, tài khoản ứng dụng không bao giờ được cấp quyền `DROP`.

## Tài liệu tham khảo

- [Quy chuẩn thiết kế MySQL mà dân kỹ thuật bắt buộc phải nắm vững, tất cả đều là bài học xương máu - Ali Developer](https://mp.weixin.qq.com/s/XC8e5iuQtfsrEOERffEZ-Q)
- [Bàn về 15 mẹo nhỏ khi tạo bảng trong cơ sở dữ liệu](https://mp.weixin.qq.com/s/NM-aHaW6TXrnO6la6Jfl5A)
