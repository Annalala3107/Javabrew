---
title: Tổng hợp câu hỏi phỏng vấn MySQL thường gặp
description: "Giải đáp chi tiết các câu hỏi phỏng vấn MySQL tần suất cao: kiến trúc cơ bản, Storage Engine InnoDB, nguyên lý Index, B+ Tree, Transaction ACID, MVCC, redo/undo/binlog, Row Lock/Table Lock và tối ưu Slow Query — nắm trọn trọng tâm phỏng vấn Big Tech trong một bài viết!"
category: Cơ sở dữ liệu (Database)
tag:
  - MySQL
  - Phỏng vấn Big Tech
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn MySQL,Kiến trúc cơ bản MySQL,Storage Engine InnoDB,MySQL Index,B+ Tree Index,Cấp độ cô lập Transaction,redo log,undo log,binlog,MVCC,Row-level Lock,Tối ưu Slow Query
lang: vi
sourceRef: zh-ref/database/mysql/mysql-questions-01.md
---

## Kiến thức nền tảng MySQL

### Cơ sở dữ liệu quan hệ là gì?

Đúng như tên gọi, cơ sở dữ liệu quan hệ (RDB — Relational Database) là một loại cơ sở dữ liệu được xây dựng trên nền tảng mô hình quan hệ. Mô hình quan hệ thể hiện mối liên kết giữa các dữ liệu được lưu trữ trong cơ sở dữ liệu (một-một, một-nhiều, nhiều-nhiều).

Trong cơ sở dữ liệu quan hệ, dữ liệu của chúng ta được lưu trữ trong nhiều bảng khác nhau (ví dụ như bảng người dùng), và mỗi dòng (row) trong bảng lưu trữ một bản ghi dữ liệu (ví dụ thông tin của một người dùng).

![Mối quan hệ giữa các bảng trong cơ sở dữ liệu quan hệ](/media/jg/ext/oss.javaguide.cn/java-guide-blog/5e3c1a71724a38245aa43b02_99bf70d46cc247be878de9d-25cda5c4.png)

Phần lớn cơ sở dữ liệu quan hệ đều sử dụng SQL để thao tác với dữ liệu được lưu trữ bên trong. Đồng thời, đa số cơ sở dữ liệu quan hệ đều hỗ trợ bốn đặc tính cốt lõi của Transaction (ACID).

**Có những cơ sở dữ liệu quan hệ phổ biến nào?**

MySQL, PostgreSQL, Oracle, SQL Server, SQLite (lịch sử trò chuyện cục bộ của WeChat được lưu bằng SQLite) ...

### SQL là gì?

SQL là ngôn ngữ truy vấn có cấu trúc (Structured Query Language), chuyên dùng để giao tiếp với cơ sở dữ liệu, với mục tiêu cung cấp một phương thức đơn giản và hiệu quả để đọc và ghi dữ liệu trong cơ sở dữ liệu.

Hầu hết mọi cơ sở dữ liệu quan hệ phổ biến đều hỗ trợ SQL nên tính ứng dụng của nó rất cao. Ngoài ra, một số cơ sở dữ liệu phi quan hệ (NoSQL) cũng hỗ trợ tương thích với SQL hoặc sử dụng ngôn ngữ truy vấn tương tự SQL.

SQL có thể giúp chúng ta:

- Tạo mới Database, Table và Column (trường dữ liệu);
- Thêm, xóa, sửa, truy vấn dữ liệu trong cơ sở dữ liệu;
- Tạo mới View, Function, Stored Procedure;
- Thực hiện phân tích dữ liệu đơn giản trên dữ liệu trong cơ sở dữ liệu;
- Kết hợp với Hive, Spark SQL để xử lý Big Data;
- Kết hợp với SQLFlow để làm Machine Learning;
- ...

### MySQL là gì?

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/20210327143351823-6c1ddf24.png)

**MySQL là một hệ quản trị cơ sở dữ liệu quan hệ, chủ yếu được dùng để lưu trữ bền vững (persist) dữ liệu trong hệ thống của chúng ta, chẳng hạn như thông tin người dùng.**

Vì MySQL là phần mềm mã nguồn mở miễn phí và tương đối hoàn thiện, nó được sử dụng rộng rãi trong đủ loại hệ thống. Bất kỳ ai cũng có thể tải xuống dưới giấy phép GPL (General Public License) và chỉnh sửa theo nhu cầu riêng. Cổng (port) mặc định của MySQL là **3306**.

### ⭐️MySQL có những ưu điểm gì?

Câu hỏi này thực chất đang hỏi vì sao MySQL lại phổ biến đến vậy.

Thành công của MySQL có thể quy về lợi thế tổng hợp trên cả ba phương diện: **hệ sinh thái, tính năng và vận hành**.

**Thứ nhất, xét về góc độ hệ sinh thái và chi phí, "hào bảo vệ" của nó rất sâu.**

- **Mã nguồn mở và miễn phí:** Đây là nền tảng giúp MySQL phổ cập rộng rãi. Bất kỳ công ty hay cá nhân nào cũng có thể sử dụng miễn phí, giúp giảm đáng kể rào cản kỹ thuật và chi phí ban đầu.
- **Cộng đồng đông đảo, hệ sinh thái hoàn chỉnh:** Sau hàng chục năm phát triển, MySQL sở hữu cộng đồng cực kỳ sôi động cùng hệ sinh thái phong phú. Điều đó có nghĩa dù bạn gặp vấn đề gì, hầu như luôn có thể tìm thấy cách giải quyết trên mạng; đồng thời tất cả ngôn ngữ lập trình, framework, công cụ ORM và hệ thống giám sát phổ biến hiện nay đều hỗ trợ MySQL hoàn hảo. Tài liệu của MySQL cũng rất đầy đủ, nguồn học tập dễ tiếp cận.

**Thứ hai, xét về năng lực kỹ thuật cốt lõi, MySQL rất mạnh mẽ và cân bằng.**

- **Hỗ trợ Transaction mạnh mẽ:** Đây là giá trị cốt lõi của nó với tư cách là một cơ sở dữ liệu quan hệ. Đáng chú ý là cấp độ cô lập mặc định `REPEATABLE-READ` (Đọc lặp lại) của InnoDB, thông qua cơ chế `MVCC` và `Next-Key Lock`, đã ngăn chặn phần lớn hiện tượng Phantom Read — điều mà nhiều cơ sở dữ liệu khác phải cần đến cấp độ cô lập cao hơn mới làm được — vừa đảm bảo tính nhất quán vừa cân bằng hiệu năng. Để xem chi tiết, bạn có thể đọc bài viết của tác giả: [Giải thích chi tiết các cấp độ cô lập Transaction trong MySQL (tiếng Trung)](https://javaguide.cn/database/mysql/transaction-isolation-level.html).
- **Hiệu năng và khả năng mở rộng xuất sắc:** Bản thân MySQL đã trải qua thử thách khắc nghiệt từ các hệ thống Internet lưu lượng khổng lồ với hiệu năng đơn node rất tốt. Quan trọng hơn, xoay quanh mở rộng theo chiều ngang (Horizontal Scaling), MySQL đã hình thành một bộ giải pháp kiến trúc rất chín muồi như Primary-Replica Replication (nhân bản chủ-tớ), Read-Write Splitting (tách đọc-ghi), và Sharding (chia database/bảng) thông qua middleware. Nhờ vậy, MySQL đáp ứng tốt từ startup đến các nền tảng Internet quy mô lớn.

**Thứ ba, xét về góc độ vận hành và sử dụng, MySQL rất "thân thiện".**

- **Dùng được ngay (Out-of-the-box), dễ làm quen:** So với các hệ quản trị cơ sở dữ liệu thương mại lớn như Oracle, việc cài đặt, cấu hình và sử dụng hằng ngày của MySQL rất đơn giản và trực quan, đường cong học tập thoai thoải, thân thiện với lập trình viên cũng như DBA mới vào nghề.
- **Chi phí bảo trì thấp:** Nhờ sự đơn giản và cộng đồng rộng lớn, việc tuyển dụng nhân sự vận hành và tìm kiếm giải pháp xử lý sự cố đều tương đối dễ dàng, giúp tổng chi phí bảo trì thấp hơn.

Đáng nói là trong những năm gần đây, PostgreSQL phát triển rất mạnh, thậm chí có phần lấn lướt MySQL. Trên mạng xuất hiện nhiều bài viết công kích, chê bai MySQL; theo quan điểm của tác giả, mọi hành vi chê bai mù quáng một bên hay tâng bốc quá mức bên còn lại đều không khách quan.

Tác giả cũng từng viết một bài chia sẻ góc nhìn về hai đại diện tiêu biểu của cơ sở dữ liệu quan hệ này, bạn có thể tham khảo nếu quan tâm: [MySQL bị đẩy xuống vị trí số hai rồi sao? (tiếng Trung)](https://mp.weixin.qq.com/s/APWD-PzTcTqGUuibAw7GGw).

## Kiểu dữ liệu (Field Types) trong MySQL

Các kiểu dữ liệu trường trong MySQL có thể chia gọn thành ba nhóm lớn:

- **Kiểu số (Numeric)**: Số nguyên (`TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT` và `BIGINT`), số thực dấu phẩy động (`FLOAT` và `DOUBLE`), số thực dấu phẩy tĩnh (`DECIMAL`), kiểu dữ liệu trường bit (`BIT`).
- **Kiểu chuỗi (String)**: `CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`, `BINARY`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB`, v.v., trong đó dùng nhiều nhất là `CHAR` và `VARCHAR`.
- **Kiểu ngày giờ (Date & Time)**: `YEAR`, `TIME`, `DATE`, `DATETIME`, `TIMESTAMP`, v.v.

Bức ảnh dưới đây không phải do tác giả vẽ mà lưu lại từ nguồn trên mạng (không nhớ rõ nguồn), nhưng tổng kết khá đầy đủ.

![Tổng hợp các kiểu dữ liệu trường phổ biến trong MySQL](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/summary-of-mysql-field-types-2a225bc2.png)

Kiểu dữ liệu trong MySQL khá đa dạng; ở đây tác giả chọn ra những kiểu dùng rất thường xuyên trong phát triển hằng ngày và hay bị hỏi khi phỏng vấn để trình bày dưới dạng hỏi đáp phỏng vấn. Nếu không có chú thích đặc biệt, toàn bộ nội dung đều xét trên Storage Engine InnoDB.

Ngoài ra, khuyến khích bạn đọc thêm Chương 4 của cuốn *High Performance MySQL (Ấn bản thứ 3)* để tìm hiểu chi tiết về tối ưu hóa kiểu dữ liệu trong MySQL.

### ⭐️Thuộc tính UNSIGNED của kiểu số nguyên có tác dụng gì?

Các kiểu số nguyên trong MySQL có thể sử dụng thuộc tính tùy chọn `UNSIGNED` để biểu diễn số nguyên không dấu, không cho phép giá trị âm. Dùng `UNSIGNED` giúp tăng gấp đôi giới hạn trên của số nguyên dương vì không cần dành không gian lưu trữ giá trị âm.

Ví dụ: phạm vi giá trị của `TINYINT UNSIGNED` là `0 ~ 255`, trong khi `TINYINT` thông thường là `-128 ~ 127`. Phạm vi của `INT UNSIGNED` là `0 ~ 4,294,967,295`, trong khi `INT` thông thường là `-2,147,483,648 ~ 2,147,483,647`.

Đối với các cột ID tự tăng bắt đầu từ 0, `UNSIGNED` rất phù hợp vì vừa không cho phép giá trị âm vừa có dải giá trị trên lớn hơn, cung cấp nhiều giá trị ID khả dụng hơn.

### Sự khác nhau giữa CHAR và VARCHAR là gì?

`CHAR` và `VARCHAR` là hai kiểu chuỗi được dùng phổ biến nhất; điểm khác biệt chính giữa chúng là: **`CHAR` là chuỗi độ dài cố định, còn `VARCHAR` là chuỗi độ dài biến đổi.**

Khi lưu trữ, `CHAR` sẽ đệm thêm khoảng trắng ở bên phải để đạt đủ độ dài đã chỉ định và cắt bỏ khoảng trắng thừa khi truy xuất; còn `VARCHAR` dùng thêm 1 hoặc 2 byte khi lưu trữ để ghi nhận độ dài chuỗi và không cần xử lý cắt khoảng trắng khi truy xuất.

`CHAR` phù hợp hơn để lưu các chuỗi ngắn hoặc có độ dài xấp xỉ nhau, ví dụ như mật khẩu đã băm bằng thuật toán Bcrypt, MD5, hoặc số căn cước/CMND. `VARCHAR` phù hợp để lưu các chuỗi có độ dài không xác định hoặc chênh lệch lớn, như biệt danh người dùng (nickname), tiêu đề bài viết, v.v.

Giá trị `M` trong cả `CHAR(M)` và `VARCHAR(M)` đều biểu thị số ký tự tối đa có thể lưu — dù là chữ cái, chữ số hay ký tự tiếng Trung, mỗi ký tự đều chỉ chiếm 1 ký tự.

### Sự khác nhau giữa VARCHAR(100) và VARCHAR(10) là gì?

Cả `VARCHAR(100)` và `VARCHAR(10)` đều là kiểu độ dài biến đổi, biểu thị khả năng lưu tối đa 100 ký tự và 10 ký tự. Vì vậy, `VARCHAR(100)` đáp ứng nhu cầu lưu trữ dải ký tự rộng hơn và có khả năng mở rộng nghiệp vụ tốt hơn; trong khi đó nếu `VARCHAR(10)` cần lưu quá 10 ký tự thì bắt buộc phải sửa cấu trúc bảng (`ALTER TABLE`).

Tuy phạm vi số ký tự lưu được của `VARCHAR(100)` và `VARCHAR(10)` khác nhau, nhưng khi lưu cùng một chuỗi giống hệt nhau, dung lượng lưu trữ trên đĩa cứng (disk) mà cả hai chiếm dụng thực chất là **như nhau** — đây là điểm rất nhiều người hay hiểu nhầm.

Tuy nhiên, `VARCHAR(100)` sẽ tiêu tốn nhiều bộ nhớ RAM hơn. Lý do là khi thao tác với kiểu `VARCHAR` trong bộ nhớ, MySQL thường cấp phát một khối bộ nhớ có kích thước cố định dựa theo độ dài đã định nghĩa của cột để chứa giá trị. Ví dụ khi thực hiện sắp xếp (sorting), `VARCHAR(100)` sẽ cấp phát theo kích thước 100, dẫn đến tiêu tốn nhiều bộ nhớ hơn.

### Sự khác nhau giữa DECIMAL và FLOAT/DOUBLE là gì?

Khác biệt giữa `DECIMAL` và `FLOAT` là: **`DECIMAL` là số dấu phẩy tĩnh (fixed-point), còn `FLOAT`/`DOUBLE` là số dấu phẩy động (floating-point). `DECIMAL` lưu trữ được giá trị thập phân chính xác, trong khi `FLOAT`/`DOUBLE` chỉ lưu được giá trị thập phân xấp xỉ.**

`DECIMAL` được dùng để lưu các số thập phân yêu cầu độ chính xác cao, chẳng hạn như dữ liệu liên quan đến tiền tệ, giúp tránh sai số mất độ chính xác do số dấu phẩy động gây ra.

Trong Java, kiểu `DECIMAL` của MySQL tương ứng với lớp `java.math.BigDecimal`.

### Tại sao không khuyến khích dùng TEXT và BLOB?

Kiểu `TEXT` tương tự `CHAR` (0–255 byte) và `VARCHAR` (0–65,535 byte), nhưng có thể lưu chuỗi dài hơn — tức dữ liệu văn bản dài như nội dung bài blog.

| Kiểu       | Dung lượng lưu trữ   | Mục đích sử dụng              |
| ---------- | -------------------- | ----------------------------- |
| TINYTEXT   | 0–255 byte           | Chuỗi văn bản thông thường    |
| TEXT       | 0–65,535 byte        | Chuỗi văn bản dài             |
| MEDIUMTEXT | 0–16,772,150 byte    | Dữ liệu văn bản khá lớn       |
| LONGTEXT   | 0–4,294,967,295 byte | Dữ liệu văn bản cực lớn       |

Kiểu `BLOB` chủ yếu dùng để lưu đối tượng nhị phân lớn (Binary Large Object), chẳng hạn như file ảnh, âm thanh, video.

| Kiểu       | Dung lượng lưu trữ | Mục đích sử dụng                         |
| ---------- | ------------------ | ---------------------------------------- |
| TINYBLOB   | 0–255 byte         | Chuỗi nhị phân ngắn                      |
| BLOB       | 0–65 KB            | Chuỗi nhị phân                           |
| MEDIUMBLOB | 0–16 MB            | Dữ liệu văn bản dài ở dạng nhị phân      |
| LONGBLOB   | 0–4 GB             | Dữ liệu văn bản cực lớn ở dạng nhị phân  |

Trong phát triển hằng ngày, `TEXT` rất ít khi được sử dụng (thỉnh thoảng mới dùng), còn `BLOB` hầu như không dùng. Nếu phạm vi độ dài dự kiến có thể đáp ứng bằng `VARCHAR`, nên tránh dùng `TEXT`.

Các quy chuẩn thiết kế cơ sở dữ liệu thường không khuyến khích sử dụng `BLOB` và `TEXT` vì hai kiểu này có một số nhược điểm và hạn chế, chẳng hạn:

- Không thể đặt giá trị mặc định (Default Value).
- Khi cần dùng bảng tạm (Temporary Table), không thể dùng bảng tạm trên bộ nhớ (in-memory) mà buộc phải tạo bảng tạm trên đĩa (như đã đề cập trong sách *High Performance MySQL*).
- Hiệu suất truy xuất tương đối thấp.
- Không thể tạo Index trực tiếp lên toàn bộ cột, mà phải chỉ định độ dài tiền tố (prefix length).
- Có thể tiêu tốn lượng lớn băng thông mạng và I/O.
- Có thể làm chậm các thao tác DML trên bảng.
- ...

### ⭐️Sự khác nhau giữa DATETIME và TIMESTAMP là gì? Nên chọn loại nào?

`DATETIME` không chứa thông tin múi giờ (Time Zone), còn `TIMESTAMP` có liên quan đến múi giờ.

`TIMESTAMP` chỉ cần 4 byte dung lượng lưu trữ, trong khi `DATETIME` tốn 8 byte. Tuy nhiên, điều này cũng gây ra một vấn đề là phạm vi thời gian mà `TIMESTAMP` biểu diễn được nhỏ hơn nhiều:

- `DATETIME`: `'1000-01-01 00:00:00.000000'` đến `'9999-12-31 23:59:59.999999'`
- `TIMESTAMP`: `'1970-01-01 00:00:01.000000'` UTC đến `'2038-01-19 03:14:07.999999'` UTC

Ưu điểm cốt lõi của `TIMESTAMP` nằm ở khả năng xử lý múi giờ tích hợp sẵn. Cơ sở dữ liệu chịu trách nhiệm lưu theo chuẩn UTC và tự động chuyển đổi dựa trên múi giờ của Session, giúp đơn giản hóa việc phát triển các ứng dụng hỗ trợ đa múi giờ. Nếu ứng dụng cần xử lý nhiều múi giờ hoặc muốn cơ sở dữ liệu tự động quản lý chuyển đổi múi giờ, `TIMESTAMP` là lựa chọn tự nhiên (cần lưu ý giới hạn phạm vi thời gian của nó, tức vấn đề năm 2038).

Nếu bài toán không liên quan đến chuyển đổi múi giờ, hoặc muốn tầng ứng dụng tự kiểm soát hoàn toàn logic múi giờ và cần biểu diễn thời gian sau năm 2038, `DATETIME` là lựa chọn an toàn hơn.

Để xem so sánh chi tiết giữa hai kiểu cũng như khuyến nghị chọn kiểu lưu trữ ngày giờ, hãy tham khảo bài viết của tác giả: [Đề xuất lưu trữ kiểu dữ liệu thời gian trong MySQL](./some-thoughts-on-database-storage-time.md).

### Sự khác nhau giữa NULL và '' là gì?

`NULL` và `''` (chuỗi rỗng) là hai giá trị hoàn toàn khác nhau; chúng mang ý nghĩa khác nhau và có hành vi khác nhau trong cơ sở dữ liệu. `NULL` đại diện cho dữ liệu bị thiếu hoặc không xác định, còn `''` biểu thị một chuỗi rỗng tồn tại và đã biết. Các khác biệt chính gồm:

1. **Ý nghĩa**:
   - `NULL` đại diện cho một giá trị không xác định, nó không bằng bất kỳ giá trị nào, kể cả chính nó. Do đó, kết quả của `SELECT NULL = NULL` là `NULL`, chứ không phải `true` hay `false`. `NULL` mang nghĩa thông tin bị thiếu hoặc chưa rõ. Mặc dù `NULL` không bằng bất kỳ giá trị nào, trong một số thao tác nhất định hệ quản trị cơ sở dữ liệu vẫn gom các giá trị `NULL` vào cùng một nhóm để xử lý, chẳng hạn: `DISTINCT`, `GROUP BY`, `ORDER BY`. Cần lưu ý rằng việc gom `NULL` thành cùng một nhóm trong các thao tác này không đồng nghĩa với việc các giá trị `NULL` bằng nhau; chúng chỉ được xử lý đặc biệt trong các phép toán cụ thể nhằm bảo đảm tính đúng đắn và nhất quán của kết quả, giúp thao tác dữ liệu thuận tiện hơn mà không làm thay đổi ngữ nghĩa của `NULL`.
   - `''` biểu thị một chuỗi rỗng, là một giá trị đã xác định.
2. **Dung lượng lưu trữ**:
   - Mức chiếm dụng lưu trữ của `NULL` phụ thuộc vào cách cài đặt của cơ sở dữ liệu, thường cần thêm một chút không gian (như bit đánh dấu null) để đánh dấu giá trị là rỗng.
   - Mức chiếm dụng lưu trữ của `''` thường rất nhỏ, vì chỉ lưu dấu hiệu độ dài chuỗi rỗng chứ không lưu ký tự thực tế nào.
3. **Phép toán so sánh**:
   - Bất kỳ giá trị nào so sánh với `NULL` (như `=`, `!=`, `>`, `<`, v.v.) đều cho kết quả `NULL`, biểu thị kết quả không xác định. Để kiểm tra một giá trị có phải `NULL` hay không, bắt buộc phải dùng `IS NULL` hoặc `IS NOT NULL`.
   - `''` có thể thực hiện phép so sánh như các chuỗi thông thường khác. Ví dụ: `'' = ''` cho kết quả `true`.
4. **Hàm tổng hợp (Aggregate Function)**:
   - Hầu hết các hàm tổng hợp (như `SUM`, `AVG`, `MIN`, `MAX`) sẽ bỏ qua giá trị `NULL`.
   - `COUNT(*)` đếm tất cả các dòng, bao gồm cả dòng chứa `NULL`. `COUNT(tên_cột)` đếm số dòng có giá trị khác `NULL` ở cột được chỉ định.
   - Chuỗi rỗng `''` vẫn được tính vào trong hàm tổng hợp. Ví dụ `SUM` sẽ coi nó là 0, còn `MIN` và `MAX` sẽ coi nó như một chuỗi rỗng.

Sau khi đọc phần giải thích trên, tin rằng bạn cũng đã có câu trả lời cho một câu hỏi phỏng vấn tần suất cao khác: "Tại sao MySQL không khuyến khích dùng `NULL` làm giá trị mặc định của cột?"

### ⭐️Kiểu Boolean được biểu diễn như thế nào?

Trong MySQL không có kiểu dữ liệu boolean chuyên biệt; `BOOL` và `BOOLEAN` thực chất là từ đồng nghĩa (alias) của `TINYINT(1)`, thường dùng `0` biểu thị `false` và giá trị khác `0` biểu thị `true`. `BIT(1)` là kiểu trường bit cũng có thể lưu `0` hoặc `1`, nhưng nó không phải ánh xạ thực tế của `BOOL`/`BOOLEAN`.

### ⭐️Lưu số điện thoại nên dùng INT hay VARCHAR?

Để lưu số điện thoại di động, **rất khuyến nghị dùng kiểu `VARCHAR`** thay vì `INT` hay `BIGINT`. Các lý do chính như sau:

1. **Tính tương thích và toàn vẹn định dạng:**
   - Số điện thoại có thể chứa số 0 ở đầu (như mã vùng điện thoại cố định ở một số nơi), tiền tố mã quốc gia (`'+'`), thậm chí cả ký tự phân tách (`'-'` hoặc khoảng trắng). Các kiểu số như `INT` hay `BIGINT` sẽ tự động làm mất các thông tin định dạng quan trọng này (ví dụ số 0 ở đầu bị lược bỏ, `'+'` và `'-'` không lưu được).
   - `VARCHAR` có thể lưu nguyên trạng mọi định dạng số điện thoại, tương thích hoàn hảo dù là số di động 11 chữ số nội địa hay số quốc tế có kèm mã quốc gia.
2. **Tính chất phi số học:** Dù số điện thoại trông toàn chữ số, chúng ta không bao giờ thực hiện phép toán số học trên nó (như tính tổng hay trung bình cộng). Về bản chất, nó là một định danh (Identifier), gần với chuỗi ký tự hơn. Dùng `VARCHAR` phù hợp với bản chất dữ liệu hơn.
3. **Tính linh hoạt khi truy vấn:**
   - Nghiệp vụ thường xuyên cần truy vấn theo đầu số (tiền tố), ví dụ tìm tất cả người dùng có số điện thoại bắt đầu bằng `"138"`. Với `VARCHAR`, câu SQL dạng `LIKE '138%'` vừa trực quan vừa hiệu quả.
   - Nếu dùng kiểu số, việc khớp tiền tố tương tự thường cần chuyển đổi hàm phức tạp (như `CAST` hoặc `SUBSTRING`) hoặc truy vấn khoảng (như `WHERE phone >= 13800000000 AND phone < 13900000000`), không chỉ rườm rà mà còn có thể không tận dụng được Index hiệu quả, làm giảm hiệu năng.
4. **Yêu cầu lưu trữ mã hóa (rất quan trọng):**
   - Vì lý do an toàn dữ liệu và tuân thủ quyền riêng tư, thông tin cá nhân nhạy cảm như số điện thoại thường bắt buộc phải được mã hóa trước khi lưu vào cơ sở dữ liệu.
   - Dữ liệu sau khi mã hóa (bản mã / ciphertext) là một chuỗi dài (thường gồm chữ cái, chữ số, ký hiệu, hoặc mã hóa Base64/Hex) mà `INT` hay `BIGINT` hoàn toàn không thể lưu được. Chỉ các kiểu như `VARCHAR`, `TEXT` hoặc `BLOB` mới lưu được.

**Về lựa chọn độ dài `VARCHAR`:**

- **Nếu lưu không mã hóa (rất không khuyến khích!):** Xét đến số quốc tế và các ký tự định dạng có thể có, `VARCHAR(20)` đến `VARCHAR(32)` thường là khoảng an toàn, đủ bao phủ hầu hết định dạng số điện thoại trên thế giới. `VARCHAR(15)` có thể không đủ đối với một số thuê bao kèm mã quốc gia và ký tự phân tách.
- **Nếu lưu có mã hóa (cách làm chuẩn được khuyến nghị):** Độ dài phải được tính toán chính xác dựa trên độ dài bản mã tối đa sinh ra bởi thuật toán mã hóa đã chọn cùng cách mã hóa chuỗi (ví dụ Base64 làm tăng độ dài khoảng 1/3). Thường sẽ cần độ dài `VARCHAR` lớn hơn, ví dụ `VARCHAR(128)`, `VARCHAR(256)` hoặc dài hơn nữa.

Cuối cùng, hãy xem bảng tổng kết dưới đây:

| Tiêu chí so sánh            | Kiểu `VARCHAR` (Khuyến nghị)                 | Kiểu `INT`/`BIGINT` (Không khuyến nghị)          | Ghi chú / Giải thích                                                                                  |
| --------------------------- | -------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Tương thích định dạng**   | ✔ Lưu được số 0 đầu, `"+"`, `"-"`, dấu cách… | ✘ Tự động mất số 0 đầu, không lưu được ký hiệu   | `VARCHAR` lưu nguyên trạng mọi định dạng số điện thoại; `INT`/`BIGINT` chỉ lưu số thuần và mất số 0 đầu |
| **Tính toàn vẹn**           | ✔ Không làm mất bất kỳ thông tin định dạng nào | ✘ Mất thông tin định dạng                       | Ví dụ `"013800012345"` lưu vào `INT` sẽ thành `13800012345`, và `"+"` cũng không lưu được              |
| **Tính phi số học**         | ✔ Phù hợp lưu "định danh"                    | ✘ Chỉ phù hợp cho phép tính số học               | Số điện thoại về bản chất là chuỗi định danh, không cộng trừ nhân chia, dùng `VARCHAR` sát thực tế hơn |
| **Linh hoạt khi truy vấn**  | ✔ Hỗ trợ `LIKE '138%'`, v.v.                 | ✘ Truy vấn tiền tố bất tiện hoặc hiệu năng kém   | Dùng `VARCHAR` truy vấn theo đầu số/tiền tố hiệu quả; kiểu số phải ép sang chuỗi hoặc xử lý phức tạp   |
| **Hỗ trợ lưu trữ mã hóa**   | ✔ Lưu được bản mã (chữ cái, ký hiệu, v.v.)   | ✘ Không thể lưu bản mã                           | Bản mã của số điện thoại là chuỗi/nhị phân, chỉ `VARCHAR`, `TEXT`, `BLOB`… mới tương thích            |
| **Khuyến nghị độ dài**      | 15~20 (không mã hóa), có mã hóa tùy thuật toán | Vô nghĩa                                       | Khi không mã hóa `VARCHAR(15~20)` là phổ biến; khi mã hóa độ dài phụ thuộc thuật toán và encoding     |

## Kiến trúc cơ bản của MySQL

> Khuyến nghị kết hợp đọc thêm bài [Quá trình thực thi một câu lệnh SQL trong MySQL](./how-sql-executed-in-mysql.md) để hiểu sâu hơn kiến trúc cơ bản của MySQL. Ngoài ra, "luồng thực thi của một câu lệnh SQL trong MySQL" cũng là câu hỏi phỏng vấn khá thường gặp.

Dưới đây là sơ đồ kiến trúc giản lược của MySQL; nhìn vào sơ đồ bạn có thể thấy rất rõ cách một câu lệnh SQL từ Client được thực thi bên trong MySQL.

![](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

Từ sơ đồ trên, có thể thấy MySQL chủ yếu gồm các thành phần sau:

- **Connector (Bộ kết nối):** Xử lý xác thực danh tính và phân quyền (khi đăng nhập vào MySQL).
- **Query Cache (Bộ nhớ đệm truy vấn):** Khi thực thi câu lệnh truy vấn, hệ thống sẽ tra Query Cache trước (đã bị loại bỏ từ phiên bản MySQL 8.0 vì tính thực dụng không cao).
- **Analyzer (Bộ phân tích):** Nếu không trúng cache (Cache Miss), câu lệnh SQL sẽ đi qua Analyzer. Nói đơn giản, Analyzer trước tiên xác định câu lệnh SQL của bạn muốn làm gì, sau đó kiểm tra cú pháp câu lệnh SQL có hợp lệ hay không.
- **Optimizer (Bộ tối ưu):** Chọn phương án thực thi mà MySQL đánh giá là tối ưu nhất.
- **Executor (Bộ thực thi):** Thực thi câu lệnh rồi trả về dữ liệu từ Storage Engine. Trước khi thực thi sẽ kiểm tra xem người dùng có quyền hay không; nếu không có quyền thì báo lỗi.
- **Pluggable Storage Engines (Storage Engine dạng plugin):** Chịu trách nhiệm chính việc lưu trữ và đọc dữ liệu, áp dụng kiến trúc dạng plugin, hỗ trợ nhiều Storage Engine như InnoDB, MyISAM, Memory, v.v. InnoDB là Storage Engine mặc định của MySQL và là lựa chọn tốt nhất cho đại đa số kịch bản.

## Storage Engine trong MySQL

Cốt lõi của MySQL nằm ở Storage Engine; muốn học sâu về MySQL, bắt buộc phải nghiên cứu kỹ Storage Engine của MySQL.

### MySQL hỗ trợ những Storage Engine nào? Mặc định dùng loại nào?

MySQL hỗ trợ nhiều Storage Engine; bạn có thể dùng lệnh `SHOW ENGINES` để xem toàn bộ Storage Engine mà MySQL hỗ trợ.

![Xem tất cả Storage Engine mà MySQL cung cấp](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220510105408703-1ff77737.png)

Từ hình trên có thể thấy Storage Engine mặc định hiện tại của MySQL là InnoDB. Hơn nữa, trong tất cả các Storage Engine, chỉ có InnoDB là Storage Engine có hỗ trợ Transaction, tức là chỉ InnoDB mới hỗ trợ Transaction.

Phiên bản MySQL tác giả đang dùng ở đây là 8.x; giữa các phiên bản MySQL khác nhau có thể có sự khác biệt.

Trước MySQL 5.5.5, MyISAM là Storage Engine mặc định của MySQL. Từ phiên bản 5.5.5 trở đi, InnoDB trở thành Storage Engine mặc định của MySQL.

Bạn có thể kiểm tra phiên bản MySQL bằng lệnh `SELECT VERSION()`:

```bash
mysql> SELECT VERSION();
+-----------+
| VERSION() |
+-----------+
| 8.0.27    |
+-----------+
1 row in set (0.00 sec)
```

Bạn cũng có thể kiểm tra trực tiếp Storage Engine mặc định hiện tại của MySQL thông qua lệnh `SHOW VARIABLES LIKE '%storage_engine%'`:

```bash
mysql> SHOW VARIABLES  LIKE '%storage_engine%';
+---------------------------------+-----------+
| Variable_name                   | Value     |
+---------------------------------+-----------+
| default_storage_engine          | InnoDB    |
| default_tmp_storage_engine      | InnoDB    |
| disabled_storage_engines        |           |
| internal_tmp_mem_storage_engine | TempTable |
+---------------------------------+-----------+
4 rows in set (0.00 sec)
```

Nếu bạn muốn tìm hiểu sâu về từng Storage Engine và sự khác biệt giữa chúng, hãy tham khảo tài liệu chính thức của MySQL (khi phỏng vấn sẽ không hỏi quá chi tiết phần này, biết qua là đủ):

- Chi tiết về Storage Engine InnoDB: <https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html>
- Chi tiết về các Storage Engine khác: <https://dev.mysql.com/doc/refman/8.0/en/storage-engines.html>

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220510155143458-5ec93a89.png)

### Bạn có hiểu về kiến trúc Storage Engine của MySQL không?

Storage Engine của MySQL áp dụng **kiến trúc dạng plugin (pluggable architecture)**, hỗ trợ nhiều Storage Engine; thậm chí chúng ta có thể thiết lập các Storage Engine khác nhau cho từng bảng khác nhau trong cùng một cơ sở dữ liệu để phù hợp với từng nhu cầu cụ thể. **Storage Engine được áp dụng ở cấp độ bảng (table), chứ không phải cấp độ cơ sở dữ liệu (database).**

Sơ đồ dưới đây minh họa kiến trúc MySQL với các Storage Engine có thể cắm rút (pluggable):

![Sơ đồ kiến trúc MySQL với Connector, giao diện, Storage Engine dạng plugin và hệ thống tệp cùng các file và log](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/mysql-architecture-a9cf127e.png)

Bạn thậm chí có thể tự viết một Storage Engine cho riêng mình dựa trên các interface chuẩn do MySQL định nghĩa. Những engine không phải do hãng chính thức cung cấp được gọi là Third-party Storage Engine (Storage Engine bên thứ ba), phân biệt với Official Storage Engine. Như InnoDB đang phổ biến nhất hiện nay thực chất ban đầu cũng là một Storage Engine của bên thứ ba, sau này vì quá xuất sắc nên đã được Oracle mua lại trực tiếp.

Tài liệu chính thức của MySQL cũng có hướng dẫn cách viết một Storage Engine tùy chỉnh tại địa chỉ: <https://dev.mysql.com/doc/internals/en/custom-engine.html>.

### ⭐️MyISAM và InnoDB có những điểm khác biệt nào?

Trước MySQL 5.5, MyISAM từng là Storage Engine mặc định của MySQL và rất thịnh hành một thời.

Tuy hiệu năng của MyISAM khá ổn và có nhiều tính năng hay (như Full-Text Index, nén dữ liệu, hàm không gian Spatial Functions, v.v.), nhưng MyISAM không hỗ trợ Transaction và Row-level Lock, và khuyết điểm lớn nhất là không thể phục hồi an toàn sau sự cố sập nguồn/crash (Crash Recovery).

Từ phiên bản MySQL 5.5 trở đi, InnoDB là Storage Engine mặc định của MySQL.

Quay lại chủ đề chính! Hãy cùng so sánh nhanh cả hai qua các khía cạnh sau:

**1. Hỗ trợ khóa mức dòng (Row-level Lock)**

MyISAM chỉ có Table-level Lock (khóa mức bảng), còn InnoDB hỗ trợ cả Row-level Lock (khóa mức dòng) và Table-level Lock, mặc định là Row-level Lock.

Nói cách khác, MyISAM hễ khóa là khóa luôn cả bảng — trong tình huống ghi đồng thời (Concurrent Writes) thì điều này thực sự bất cập! Đó cũng là lý do hiệu năng ghi đồng thời của InnoDB vượt trội hơn hẳn.

**2. Hỗ trợ Transaction**

MyISAM không hỗ trợ Transaction.

InnoDB hỗ trợ Transaction, hiện thực đầy đủ bốn cấp độ cô lập theo chuẩn SQL, có khả năng Commit và Rollback Transaction. Hơn nữa, cấp độ cô lập mặc định `REPEATABLE-READ` của InnoDB có thể ngăn chặn hiện tượng Phantom Read (dựa trên `MVCC` và `Next-Key Lock`).

Để tìm hiểu chi tiết về Transaction trong MySQL, bạn có thể xem bài viết: [Giải thích chi tiết các cấp độ cô lập Transaction trong MySQL](./transaction-isolation-level.md).

**3. Hỗ trợ khóa ngoại (Foreign Key)**

MyISAM không hỗ trợ, còn InnoDB có hỗ trợ.

Khóa ngoại rất hữu ích trong việc duy trì tính nhất quán dữ liệu, nhưng lại gây tiêu hao hiệu năng nhất định. Vì vậy, thông thường trong các dự án Production thực tế, chúng ta không khuyến khích sử dụng khóa ngoại ở tầng database mà tự ràng buộc trong code nghiệp vụ!

Cẩm nang *Java Development Manual* của Alibaba cũng quy định rõ ràng là cấm sử dụng khóa ngoại.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220510090309427-64be0036.png)

Tuy nhiên, việc kiểm soát ràng buộc trong code đòi hỏi năng lực lập trình viên cao hơn, nên có dùng khóa ngoại hay không vẫn phải tùy thuộc vào tình hình thực tế của dự án.

Tóm lại: Thông thường không khuyến nghị dùng khóa ngoại ở tầng cơ sở dữ liệu vì có thể xử lý ở tầng ứng dụng, dù điều đó có thể tạo ra rủi ro nhất định đối với tính nhất quán dữ liệu. Quyết định cuối cùng vẫn cần căn cứ vào yêu cầu của dự án.

**4. Hỗ trợ phục hồi an toàn sau sự cố bất thường (Crash Recovery)**

MyISAM không hỗ trợ, còn InnoDB có hỗ trợ.

Cơ sở dữ liệu sử dụng InnoDB sau khi gặp sự cố sập bất ngờ (crash), lúc khởi động lại sẽ đảm bảo khôi phục về trạng thái nhất quán trước khi xảy ra sự cố. Quá trình phục hồi này dựa vào `redo log`.

**5. Hỗ trợ MVCC**

MyISAM không hỗ trợ, còn InnoDB có hỗ trợ.

Thực ra điểm so sánh này hơi hiển nhiên, bởi MyISAM đến Row-level Lock còn không hỗ trợ. Có thể xem MVCC như một bản nâng cấp của Row-level Lock, giúp giảm hiệu quả các thao tác khóa và nâng cao hiệu năng.

**6. Cách hiện thực Index khác nhau**

Mặc dù cả MyISAM và InnoDB đều sử dụng B+ Tree làm cấu trúc Index, cách triển khai của hai engine này khác nhau.

Trong InnoDB, bản thân file dữ liệu chính là file Index (Clustered Index). So với MyISAM — nơi file Index và file dữ liệu tách rời nhau — thì file dữ liệu bảng của InnoDB tự thân đã được tổ chức thành một cấu trúc Index dạng B+ Tree, trong đó vùng `data` tại các node lá (leaf node) lưu giữ toàn bộ bản ghi dữ liệu hoàn chỉnh.

Để biết chi tiết sự khác biệt, khuyến khích đọc bài viết: [Giải thích chi tiết về MySQL Index](./mysql-index.md).

**7. Khác biệt về hiệu năng**

Hiệu năng của InnoDB mạnh hơn MyISAM rõ rệt; dù ở chế độ vừa đọc vừa ghi hay chỉ đọc, khi số nhân CPU tăng lên, năng lực đọc/ghi của InnoDB tăng trưởng gần như tuyến tính. Còn MyISAM vì không thể đọc và ghi đồng thời nên năng lực xử lý của nó không tăng theo số nhân CPU.

![So sánh hiệu năng giữa InnoDB và MyISAM](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/innodb-myisam-performance-comparison-c12f5364.png)

**8. Chiến lược và cơ chế bộ nhớ đệm dữ liệu khác nhau**

InnoDB sử dụng **Buffer Pool** để cache cả trang dữ liệu (Data Page) lẫn trang chỉ mục (Index Page), trong khi MyISAM sử dụng **Key Cache** chỉ để cache trang chỉ mục mà không cache trang dữ liệu.

**Tổng kết**:

- InnoDB hỗ trợ độ mịn khóa ở mức dòng (Row-level Lock), MyISAM không hỗ trợ, chỉ hỗ trợ khóa mức bảng (Table-level Lock).
- MyISAM không hỗ trợ Transaction. InnoDB hỗ trợ Transaction và hiện thực bốn cấp độ cô lập theo chuẩn SQL.
- MyISAM không hỗ trợ khóa ngoại, còn InnoDB có hỗ trợ.
- MyISAM không hỗ trợ MVCC, còn InnoDB có hỗ trợ.
- Mặc dù cả MyISAM và InnoDB đều dùng B+ Tree làm cấu trúc Index, cách hiện thực của hai bên khác nhau.
- MyISAM không hỗ trợ phục hồi an toàn sau khi cơ sở dữ liệu gặp sự cố bất thường, còn InnoDB có hỗ trợ.
- Hiệu năng của InnoDB mạnh hơn MyISAM.

Cuối cùng, chia sẻ thêm một hình ảnh đối chiếu chi tiết các Storage Engine phổ biến trong MySQL.

![So sánh các Storage Engine phổ biến trong MySQL](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/comparison-of-common-mysql-storage-engines-5d055dea.png)

### Nên chọn MyISAM hay InnoDB?

Phần lớn thời gian chúng ta đều sử dụng Storage Engine InnoDB. Trong một số kịch bản thiên về đọc (Read-intensive), dùng MyISAM cũng phù hợp — miễn là dự án của bạn không ngại các nhược điểm của MyISAM như không hỗ trợ Transaction, không có Crash Recovery, v.v. (nhưng thực tế thì thường chúng ta đều rất ngại!).

Cuốn *High Performance MySQL* có viết một câu như sau:

> Đừng vội tin những kinh nghiệm truyền miệng kiểu "MyISAM nhanh hơn InnoDB", kết luận đó thường không hề tuyệt đối. Trong rất nhiều kịch bản đã biết, tốc độ của InnoDB có thể bỏ xa MyISAM, đặc biệt khi dùng Clustered Index hoặc khi toàn bộ dữ liệu cần truy cập có thể nằm vừa trong bộ nhớ RAM.

Vì vậy, đối với các hệ thống nghiệp vụ phát triển hằng ngày, bạn gần như không có lý do gì để chọn MyISAM nữa — cứ yên tâm dùng mặc định InnoDB là được!

## ⭐️MySQL Index

Các câu hỏi liên quan đến MySQL Index khá nhiều và cực kỳ quan trọng; để tìm hiểu kỹ hơn bạn có thể đọc bài viết: [Giải thích chi tiết về MySQL Index](./mysql-index.md).

### Index là gì?

**Index (chỉ mục) là một cấu trúc dữ liệu dùng để truy vấn và tìm kiếm dữ liệu nhanh chóng; về bản chất có thể xem nó như một cấu trúc dữ liệu đã được sắp xếp sẵn.**

Vai trò của Index giống như mục lục của một cuốn sách. Ví dụ khi tra từ điển, nếu không có mục lục thì ta chỉ có thể lật từng trang một để tìm chữ cần tra, rất chậm; nhưng nếu có mục lục, ta chỉ cần tra vị trí trang của chữ đó trong mục lục rồi lật thẳng tới trang ấy là xong.

Cấu trúc dữ liệu tầng dưới của Index có nhiều loại, phổ biến gồm: B-Tree, B+ Tree, Hash và Red-Black Tree. Trong MySQL, cả InnoDB lẫn MyISAM đều sử dụng **B+ Tree** làm cấu trúc Index.

**Ưu điểm của Index:**

1. **Tăng tốc độ truy vấn vượt bậc (mục đích chính):** Nhờ Index, cơ sở dữ liệu có thể **giảm mạnh lượng dữ liệu cần quét**, định vị trực tiếp đến bản ghi thỏa điều kiện, từ đó tăng tốc độ truy xuất rõ rệt và giảm số lần Disk I/O.
2. **Bảo đảm tính duy nhất của dữ liệu:** Thông qua việc tạo **Unique Index**, có thể bảo đảm giá trị của một cột (hoặc tổ hợp nhiều cột) trong bảng là duy nhất, như User ID hay email. Bản thân Primary Key cũng là một loại Unique Index.
3. **Tăng tốc sắp xếp và gom nhóm:** Nếu các cột trong mệnh đề `ORDER BY` hoặc `GROUP BY` đã được đánh Index, cơ sở dữ liệu thường có thể tận dụng trực tiếp tính chất đã sắp xếp sẵn của Index để tránh phát sinh bước sắp xếp bổ sung, giúp tăng hiệu năng.

**Nhược điểm của Index:**

1. **Tốn thời gian tạo và bảo trì:** Việc tạo Index mất thời gian, nhất là trên bảng lớn. Quan trọng hơn, khi thực hiện **thêm, xóa, sửa (các thao tác DML)** dữ liệu trên bảng, không chỉ dữ liệu chính thay đổi mà các Index liên quan cũng phải được cập nhật và bảo trì động theo, làm **giảm hiệu suất thực thi của các thao tác DML**.
2. **Chiếm dung lượng lưu trữ:** Bản thân Index cũng là một cấu trúc dữ liệu, cần được lưu dưới dạng file vật lý (hoặc cấu trúc trong bộ nhớ), nên sẽ **chiếm thêm dung lượng đĩa cứng**. Càng nhiều Index và Index càng lớn thì dung lượng chiếm dụng càng nhiều.
3. **Có thể bị dùng sai hoặc mất tác dụng:** Nếu thiết kế Index không hợp lý hoặc câu truy vấn viết không tốt, Query Optimizer có thể không chọn dùng Index (hoặc chọn nhầm Index), phản tác dụng làm giảm hiệu năng.

**Vậy có phải cứ dùng Index là chắc chắn cải thiện hiệu năng truy vấn không?**

**Không hẳn.** Trong đa số trường hợp, dùng Index hợp lý đúng là nhanh hơn quét toàn bảng (Full Table Scan) rất nhiều. Nhưng vẫn có ngoại lệ:

- **Lượng dữ liệu quá nhỏ:** Nếu bảng có rất ít dữ liệu (chẳng hạn chỉ vài trăm dòng), Full Table Scan có thể nhanh hơn tra Index vì bản thân việc đi qua Index cũng có chi phí.
- **Tỷ lệ tập kết quả truy vấn quá lớn:** Nếu dữ liệu cần lấy chiếm phần lớn cả bảng (ví dụ vượt quá 20%–30%), Optimizer có thể đánh giá Full Table Scan tuần tự có lợi hơn so với việc phải quay về bảng gốc (Back-to-table / Random I/O) nhiều lần thông qua Index.
- **Bảo trì Index kém hoặc thông tin thống kê (Statistics) lỗi thời:** Dẫn đến Optimizer đưa ra phán đoán sai lầm.

### Tại sao Index lại nhanh?

Lý do cốt lõi khiến Index nhanh là vì nó **giảm mạnh số lần Disk I/O**.

Bản chất của Index là một **cấu trúc dữ liệu đã được sắp xếp**, giống như mục lục sách, giúp ta không phải lật từng trang một (Full Table Scan).

Trong MySQL, cấu trúc dữ liệu đó là **B+ Tree**. Cấu trúc B+ Tree tối ưu theo hai hướng chính:

1. Đặc điểm của B+ Tree là "thấp và rộng" (lùn mập): một bảng hàng chục triệu bản ghi có thể chỉ có chiều cao cây Index khoảng 3–4 tầng. Điều này đồng nghĩa chỉ cần tối đa **3–4 lần Disk I/O** là có thể định vị chính xác đến dữ liệu mong muốn, trong khi Full Table Scan có thể cần hàng nghìn hay hàng vạn lần, nên tốc độ nhanh vượt trội.
2. Các node lá của B+ Tree được **nối với nhau bằng danh sách liên kết (Linked List)**. Sau khi tìm thấy điểm bắt đầu, có thể quét **tuần tự (Sequential Read)** dọc theo danh sách liên kết, cực kỳ thân thiện với ổ đĩa và kích hoạt được cơ chế đọc trước (Read-ahead).

### Cấu trúc dữ liệu tầng dưới của MySQL Index là gì?

Trong MySQL, cả hai engine MyISAM và InnoDB đều dùng B+ Tree làm cấu trúc Index. Để hiểu sâu hơn, bạn có thể tham khảo bài viết: [Giải thích chi tiết về MySQL Index](https://javaguide.cn/database/mysql/mysql-index.html).

### Tại sao InnoDB không dùng Hash làm cấu trúc dữ liệu Index?

> Tác giả nhận thấy nhiều ứng viên và thậm chí cả người phỏng vấn đều có hiểu nhầm ở câu này — họ mặc định rằng MySQL không sử dụng Hash hay B-Tree làm cấu trúc Index.
>
> Thực tế, dù đặt câu hỏi hay trả lời câu này đều phải phân biệt rõ Storage Engine. Ví dụ engine MEMORY hỗ trợ đồng thời cả Hash và B-Tree.

Tầng dưới của Hash Index là Hash Table. Ưu điểm của nó là khi thực hiện **truy vấn so sánh bằng chính xác**, độ phức tạp thời gian lý thuyết là **$O(1)$**, tốc độ cực nhanh, ví dụ `WHERE id = 123`.

Tuy nhiên, nó có vài nhược điểm chí mạng đối với cơ sở dữ liệu đa dụng:

1. **Không hỗ trợ truy vấn khoảng (Range Query):** Đây là nguyên nhân chính nhất. Đặc điểm của hàm băm (Hash Function) là ánh xạ các giá trị đầu vào liền kề (như `id=100` và `id=101`) sang các vị trí hoàn toàn không liên tiếp nhau trong Hash Table. Việc phá vỡ thứ tự này khiến ta không thể xử lý các truy vấn khoảng như `WHERE age > 30` hay `BETWEEN 100 AND 200`. Để chạy truy vấn dạng này, Hash Index buộc phải thoái hóa về Full Table Scan.
2. **Không hỗ trợ sắp xếp:** Tương tự, vì giá trị băm không có thứ tự, ta không thể tận dụng Hash Index để tối ưu mệnh đề `ORDER BY`.
3. **Không hỗ trợ truy vấn theo một phần khóa của Composite Index:** Với Composite Index như `(col1, col2)`, Hash Index bắt buộc phải dùng toàn bộ các cột Index để truy vấn, không thể tận dụng riêng `col1` để tăng tốc truy vấn.
4. **Vấn đề xung đột băm (Hash Collision):** Khi các khóa khác nhau sinh ra cùng một giá trị băm, cần thêm danh sách liên kết hoặc phương pháp định địa chỉ mở để giải quyết, làm giảm hiệu năng.

Xét thấy truy vấn khoảng và sắp xếp là những thao tác cực kỳ phổ biến trong truy vấn cơ sở dữ liệu, một cấu trúc Index không hỗ trợ các tính năng này rõ ràng không thể làm loại Index mặc định cho mục đích tổng quát.

### Tại sao InnoDB không dùng B-Tree làm cấu trúc dữ liệu Index?

Cả B-Tree và B+ Tree đều là những cây tìm kiếm cân bằng đa nhánh xuất sắc, rất phù hợp lưu trữ trên đĩa vì chúng đều "thấp và rộng", tận dụng tối đa mỗi lần Disk I/O.

Nhưng B+ Tree là phiên bản nâng cấp của B-Tree, được tối ưu đặc biệt cho bài toán cơ sở dữ liệu ở vài điểm then chốt:

1. **Hiệu quả I/O cao hơn:** Trong B+ Tree, chỉ node lá mới lưu dữ liệu (hoặc con trỏ dữ liệu), còn các node không phải lá (non-leaf node) chỉ lưu khóa Index. Vì node không phải lá không chứa dữ liệu nên mỗi trang chứa được nhiều khóa Index hơn hẳn. Điều này giúp "fan-out" (độ rẽ nhánh) của B+ Tree lớn hơn; với cùng một lượng dữ liệu, B+ Tree thường thấp hơn B-Tree, đồng nghĩa số lần Disk I/O cần thiết để tìm dữ liệu ít hơn.
2. **Hiệu năng truy vấn ổn định hơn:** Trong B+ Tree, mọi lần tìm kiếm đều phải đi từ node gốc xuống tới node lá mới tìm thấy dữ liệu, nên độ dài đường đi tìm kiếm là cố định. Trong khi ở B-Tree, nếu may mắn có thể tìm thấy dữ liệu ngay tại node trung gian, nhưng nếu không may vẫn phải đi xuống tận node lá, khiến hiệu năng truy vấn thiếu ổn định.
3. **Cực kỳ thân thiện với truy vấn khoảng (Range Query):** Đây là lợi thế cốt lõi nhất của B+ Tree. Toàn bộ các node lá của nó được kết nối với nhau qua một danh sách liên kết đôi (Doubly Linked List). Khi thực thi truy vấn khoảng (ví dụ `WHERE id > 100`), chỉ cần đi theo cấu trúc cây tìm tới node lá `id=100`, rồi quét tuần tự về phía sau dọc theo danh sách liên kết mà không cần quay ngược lên các tầng trên. Nhờ đó hiệu suất truy vấn khoảng tăng vọt.

### Covering Index là gì?

Nếu một Index chứa (tức "bao phủ") toàn bộ giá trị của các trường cần truy vấn, ta gọi đó là **Covering Index (Chỉ mục bao phủ)**.

Trong Storage Engine InnoDB, node lá của Index không phải khóa chính (Secondary Index) chứa giá trị của khóa chính. Điều đó có nghĩa là khi truy vấn bằng Secondary Index, cơ sở dữ liệu trước tiên tìm ra giá trị khóa chính tương ứng, sau đó tra tiếp theo Primary Key Index để định vị và lấy toàn bộ dữ liệu dòng — quá trình này gọi là "quay về bảng gốc" (Back-to-table / Lookup).

**Covering Index tức là các cột cần truy vấn vừa khít nằm trọn trong các trường của Index đó, nên có thể lấy ngay dữ liệu từ Index mà không cần quay về bảng gốc tra cứu thêm lần nữa.**

### Hãy giải thích Composite Index và nguyên tắc Leftmost Prefix trong MySQL

Tạo Index trên nhiều cột của bảng chính là **Composite Index** (còn gọi là Joint Index hoặc Compound Index — Chỉ mục kết hợp).

Ví dụ tạo Composite Index trên hai cột `score` và `name`:

```sql
ALTER TABLE `cus_order` ADD INDEX id_score_name(score, name);
```

Nguyên tắc **khớp tiền tố trái nhất (Leftmost Prefix Matching)** có nghĩa là khi sử dụng Composite Index, MySQL sẽ lần lượt khớp điều kiện truy vấn từ trái sang phải theo đúng thứ tự các cột trong Index. Nếu điều kiện truy vấn khớp với các cột phía bên trái của Index, MySQL sẽ dùng Index đó để lọc dữ liệu, giúp nâng cao hiệu quả truy vấn.

Nguyên tắc Leftmost Prefix sẽ tiếp tục khớp sang phải cho tới khi gặp điều kiện truy vấn khoảng (như `>`, `<`). Đối với các điều kiện khoảng như `>=`, `<=`, `BETWEEN` và `LIKE` khớp tiền tố, việc khớp Index sẽ không bị dừng lại (đọc thêm: [Một kết luận sai lầm lan truyền khắp mạng về nguyên tắc Leftmost Prefix của Composite Index (tiếng Trung)](https://mp.weixin.qq.com/s/8qemhRg5MgXs1So5YCv0fQ)).

Giả sử có một Composite Index `(column1, column2, column3)`, toàn bộ các tiền tố từ trái sang phải của nó là `(column1)`, `(column1, column2)`, `(column1, column2, column3)` (tạo 1 Composite Index tương đương tạo được 3 Index). Mọi truy vấn chứa các nhóm cột tiền tố này đều dùng được Index mà không phải quét toàn bảng.

Khi dùng Composite Index, nên đặt cột có độ phân biệt (Cardinality / Selectivity) cao nhất ở ngoài cùng bên trái, giúp lọc bỏ nhiều dữ liệu dư thừa hơn ngay từ đầu.

Dưới đây chúng ta minh họa nhanh hiệu ứng của Leftmost Prefix Matching:

1. Tạo một bảng tên là `student` chỉ có 3 cột `id`, `name`, `class`.

```sql
CREATE TABLE `student` (
  `id` int NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name_class_idx` (`name`,`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

2. Tiếp theo thử nghiệm ba câu SQL khác nhau:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/leftmost-prefix-matching-rule-a8a5555c.png)

```sql
# Trúng Index
SELECT * FROM student WHERE name = 'Anne Henry';
EXPLAIN SELECT * FROM student WHERE name = 'Anne Henry' AND class = 'lIrm08RYVk';
# Không thể trúng Index
SELECT * FROM student WHERE class = 'lIrm08RYVk';
```

Hãy xem thêm một câu hỏi phỏng vấn quen thuộc: Nếu có `Composite Index (a, b, c)`, truy vấn `a=1 AND c=1` có dùng Index không? Còn `c=1` thì sao? `b=1 AND c=1` thì sao? `b = 1 AND a = 1 AND c = 1` thì sao?

Đừng vội xem đáp án ngay, hãy tự dành 3 phút suy nghĩ trước đã.

1. Truy vấn `a=1 AND c=1`: Theo nguyên tắc Leftmost Prefix, truy vấn có thể dùng phần tiền tố của Index. Vì vậy, câu truy vấn chỉ sử dụng Index ở điều kiện `a=1`, sau đó lọc tiếp `c=1` trên kết quả thu được.
2. Truy vấn `c=1`: Do câu truy vấn không chứa cột ngoài cùng bên trái `a`, theo nguyên tắc Leftmost Prefix, toàn bộ Index không thể sử dụng.
3. Truy vấn `b=1 AND c=1`: Giống trường hợp thứ hai, toàn bộ Index đều không được sử dụng.
4. Truy vấn `b=1 AND a=1 AND c=1`: Câu truy vấn này **có thể** dùng Index. Khi Query Optimizer phân tích câu SQL, đối với Composite Index, nó sẽ sắp xếp lại thứ tự các điều kiện `AND` để tận dụng được Index — biến `b=1` và `a=1` thành `a=1 AND b=1 AND c=1`.

Phiên bản MySQL 8.0.13 đã giới thiệu **Index Skip Scan (viết tắt ISS)**, giúp nâng cao hiệu quả truy vấn trong một số kịch bản dùng Index nhất định. Trước khi có ISS, các truy vấn trên Composite Index không thỏa mãn nguyên tắc Leftmost Prefix buộc phải thực hiện Full Table Scan. ISS cho phép MySQL tránh Full Table Scan trong một số trường hợp dù điều kiện truy vấn không khớp tiền tố trái nhất. Tuy nhiên, tính năng này còn khá hạn chế, chưa thể so sánh với bên Oracle; thậm chí bản MySQL 8.0.31 còn từng báo cáo một bug: [Bug #109145 Using index for skip scan cause incorrect result](https://bugs.mysql.com/bug.php?id=109145) (đã được vá ở các bản sau). Cá nhân tác giả khuyên chỉ cần biết đến sự tồn tại của nó là đủ, không cần đào quá sâu vì dự án thực tế chưa chắc đã dùng tới.

### `SELECT *` có làm mất hiệu lực Index không?

`SELECT *` không trực tiếp làm Index mất hiệu lực (nếu không đi qua Index thì đa phần là do phạm vi lọc trong `WHERE` quá lớn), nhưng nó có thể kéo theo các vấn đề hiệu năng khác như lãng phí băng thông truyền tải mạng, dư thừa xử lý dữ liệu và không thể sử dụng Covering Index.

### Những cột nào phù hợp để tạo Index?

- **Cột không chứa `NULL`:** Dữ liệu của cột đánh Index nên cố gắng không chứa `NULL`, vì với dữ liệu có `NULL`, cơ sở dữ liệu khó tối ưu hơn. Nếu cột được truy vấn thường xuyên mà không tránh khỏi `NULL`, nên dùng các giá trị ngắn có ngữ nghĩa rõ ràng như `0`, `1`, `true`, `false` để thay thế.
- **Cột được truy vấn thường xuyên:** Cột mà ta tạo Index nên là những cột có tần suất truy vấn rất cao.
- **Cột dùng làm điều kiện truy vấn:** Những cột thường xuất hiện trong điều kiện `WHERE` nên được cân nhắc đánh Index.
- **Cột thường xuyên cần sắp xếp:** Index vốn đã được sắp xếp sẵn, nhờ vậy câu truy vấn có thể tận dụng thứ tự của Index để rút ngắn thời gian sắp xếp.
- **Cột thường xuyên dùng để nối bảng (JOIN):** Các cột hay dùng để `JOIN` thường là cột khóa ngoại; không nhất thiết phải tạo ràng buộc khóa ngoại vật lý, mà chỉ cần hiểu cột đó liên kết quan hệ giữa các bảng. Với những cột hay dùng trong `JOIN`, nên cân nhắc đánh Index để tăng hiệu quả truy vấn nối nhiều bảng.

### Những nguyên nhân nào làm mất hiệu lực Index?

1. Đã tạo Composite Index nhưng điều kiện truy vấn không tuân thủ nguyên tắc Leftmost Prefix;
2. Thực hiện phép tính toán, gọi hàm, hoặc ép kiểu trên cột đánh Index;
3. Truy vấn `LIKE` bắt đầu bằng `%`, ví dụ `LIKE '%abc'`;
4. Điều kiện truy vấn sử dụng `OR`, trong đó một vế trước hoặc sau `OR` là cột chưa có Index — toàn bộ các Index liên quan đều sẽ không được dùng;
5. Phạm vi giá trị của `IN` quá lớn khiến Index mất tác dụng và chuyển sang Full Table Scan (`NOT IN` cũng có kịch bản tương tự);
6. Xảy ra [chuyển đổi kiểu ngầm định (Implicit Conversion) (tiếng Trung)](https://javaguide.cn/database/mysql/index-invalidation-caused-by-implicit-conversion.html "Implicit conversion").

## Query Cache trong MySQL

Query Cache của MySQL là bộ nhớ đệm kết quả truy vấn. Khi thực thi câu truy vấn, hệ thống kiểm tra Query Cache trước; nếu trong cache đã có kết quả tương ứng thì trả về trực tiếp.

Thêm cấu hình sau vào `my.cnf` và khởi động lại MySQL để bật Query Cache:

```properties
query_cache_type=1
query_cache_size=600000
```

Hoặc chạy các lệnh sau trực tiếp trong MySQL để bật Query Cache:

```properties
set global  query_cache_type=1;
set global  query_cache_size=600000;
```

Query Cache sẽ trả kết quả trực tiếp trong cache khi điều kiện truy vấn và dữ liệu hoàn toàn giống nhau. Tuy nhiên, cần lưu ý điều kiện khớp của Query Cache cực kỳ khắt khe; bất kỳ khác biệt nhỏ nhặt nào cũng khiến Cache Miss. Điều kiện khớp bao gồm chính văn bản câu truy vấn, cơ sở dữ liệu đang sử dụng, cùng các yếu tố khác có thể ảnh hưởng kết quả như phiên bản giao thức Client, v.v.

**Các trường hợp gây Cache Miss:**

1. Hai câu truy vấn bất kỳ chỉ cần khác nhau dù chỉ một ký tự đều không trúng cache.
2. Nếu câu truy vấn có chứa hàm tự định nghĩa (UDF), Stored Function, biến người dùng, bảng tạm (Temporary Table) hoặc bảng hệ thống trong database `mysql`, kết quả truy vấn cũng sẽ không được cache.
3. Sau khi cache được tạo, hệ thống Query Cache của MySQL sẽ theo dõi mọi bảng liên quan trong truy vấn; nếu bất kỳ bảng nào trong số đó thay đổi (dữ liệu hoặc cấu trúc), toàn bộ dữ liệu cache liên quan đến bảng đó sẽ bị vô hiệu hóa ngay lập tức.

**Dù cache giúp cải thiện hiệu năng đọc, Query Cache đồng thời tạo ra chi phí phụ trội (overhead) không nhỏ — mỗi lần truy vấn đều phải thao tác tra/ghi cache, và khi hết hạn còn phải xóa bỏ.** Do đó, cần thận trọng khi bật Query Cache, đặc biệt với các ứng dụng ghi nhiều (Write-intensive). Nếu bật, chú ý kiểm soát kích thước vùng nhớ đệm hợp lý, thông thường đặt vài chục MB là phù hợp. Ngoài ra, có thể dùng `sql_cache` và `sql_no_cache` để kiểm soát một câu truy vấn cụ thể có dùng cache hay không:

```sql
SELECT sql_no_cache COUNT(*) FROM usr;
```

Bắt đầu từ MySQL 5.6, Query Cache bị tắt mặc định. Từ MySQL 8.0 trở đi, MySQL đã ngừng hoàn toàn hỗ trợ Query Cache (chi tiết có thể tham khảo bài viết: [MySQL 8.0: Retiring Support for the Query Cache](https://dev.mysql.com/blog-archive/mysql-8-0-retiring-support-for-the-query-cache/)).

![MySQL 8.0: Retiring Support for the Query Cache](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/mysql8.0-retiring-support-for-the-query-cache-56234f85.png)

## ⭐️Các loại Log trong MySQL

Đáp án cho các câu hỏi trên có thể tìm thấy trong phần **「Câu hỏi phỏng vấn kỹ thuật」** của tài liệu [*Java Interview Guide* (trả phí, nhấn liên kết để nhận mã giảm giá)](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html).

![Phần Câu hỏi phỏng vấn kỹ thuật trong Java Interview Guide](/media/jg/ext/oss.javaguide.cn/javamianshizhibei/technical-interview-questions-41fe5561.png)

Địa chỉ bài viết: <https://www.yuque.com/snailclimb/mf2z3k/zr4kfk> (Lấy mật khẩu tại: <https://t.zsxq.com/avfM0>).

## ⭐️Transaction trong MySQL

### Transaction là gì?

Hãy hình dung một kịch bản: chúng ta cần chèn nhiều dữ liệu có liên quan với nhau vào cơ sở dữ liệu, nhưng không may quá trình này có thể gặp phải các sự cố sau:

- Cơ sở dữ liệu đột ngột sập giữa chừng vì lý do nào đó;
- Client đột ngột mất kết nối mạng tới cơ sở dữ liệu;
- Khi truy cập đồng thời vào cơ sở dữ liệu, nhiều Thread ghi cùng lúc làm ghi đè thay đổi của nhau;
- ...

Bất kỳ sự cố nào kể trên đều có thể gây mất nhất quán dữ liệu. Để bảo đảm tính nhất quán dữ liệu, hệ thống bắt buộc phải xử lý được các vấn đề này. Transaction chính là cơ chế trừu tượng hóa hàng đầu giúp đơn giản hóa việc giải quyết các bài toán đó. Khái niệm Transaction bắt nguồn từ cơ sở dữ liệu và hiện nay đã trở thành một khái niệm rộng rãi trong kỹ thuật phần mềm.

**Vậy Transaction là gì?** Nói ngắn gọn, **Transaction là một nhóm các thao tác về mặt logic: hoặc tất cả cùng thực thi, hoặc tất cả đều không thực thi.**

Ví dụ kinh điển nhất và hay được nhắc tới nhất về Transaction là chuyển khoản. Giả sử Tiểu Minh cần chuyển cho Tiểu Hồng 1000 tệ; giao dịch chuyển khoản này liên quan đến hai thao tác then chốt bắt buộc phải cùng thành công hoặc cùng thất bại:

1. Trừ số dư của Tiểu Minh đi 1000 tệ.
2. Cộng thêm vào số dư của Tiểu Hồng 1000 tệ.

Transaction sẽ xem hai thao tác này như một khối thống nhất về mặt logic: hoặc toàn bộ thao tác trong khối cùng thành công, hoặc toàn bộ cùng thất bại. Nhờ vậy sẽ không bao giờ xảy ra tình huống số dư của Tiểu Minh bị trừ nhưng số dư của Tiểu Hồng lại không tăng.

![Minh họa Transaction](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-a0059ccb.png)

### Database Transaction là gì?

Trong đa số trường hợp, khi nói đến Transaction mà không chỉ đích danh **Distributed Transaction (giao dịch phân tán)** thì thường chính là đang nói đến **Database Transaction (giao dịch cơ sở dữ liệu)**.

Database Transaction là thứ chúng ta tiếp xúc nhiều nhất trong phát triển hằng ngày. Nếu dự án của bạn thuộc kiến trúc Monolithic, thì thứ bạn làm việc cùng thường xuyên chính là Database Transaction.

**Vậy Database Transaction có tác dụng gì?**

Nói đơn giản, Database Transaction bảo đảm nhiều thao tác lên cơ sở dữ liệu (tức các câu lệnh SQL) tạo thành một khối thống nhất về mặt logic. Khối thao tác cơ sở dữ liệu này tuân thủ nguyên tắc: **hoặc tất cả thực thi thành công, hoặc tất cả đều không thực thi.**

```sql
# Bắt đầu một Transaction
START TRANSACTION;
# Nhiều câu lệnh SQL
SQL1,SQL2...
## Commit Transaction
COMMIT;
```

![Minh họa Database Transaction](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-34ac1d2d.png)

Ngoài ra, Transaction trong cơ sở dữ liệu quan hệ (như `MySQL`, `SQL Server`, `Oracle`, v.v.) đều có 4 đặc tính **ACID**:

![ACID](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/ACID-ad1efa4f.png)

1. **Tính nguyên tử (`Atomicity`)**: Transaction là đơn vị thực thi nhỏ nhất, không thể chia cắt. Tính nguyên tử bảo đảm mọi hành động trong Transaction hoặc hoàn thành toàn bộ, hoặc hoàn toàn không có tác dụng gì;
2. **Tính nhất quán (`Consistency`)**: Trước và sau khi thực thi Transaction, dữ liệu luôn giữ trạng thái hợp lệ và nhất quán; ví dụ trong nghiệp vụ chuyển khoản, dù giao dịch thành công hay thất bại, tổng số dư của người gửi và người nhận phải không đổi;
3. **Tính cô lập (`Isolation`)**: Khi nhiều người dùng truy cập cơ sở dữ liệu đồng thời, Transaction của một người dùng không bị can thiệp bởi các Transaction khác, và các Transaction đồng thời tách biệt độc lập với nhau;
4. **Tính bền vững (`Durability`)**: Một khi Transaction đã được Commit, các thay đổi của nó lên dữ liệu trong cơ sở dữ liệu là vĩnh viễn; ngay cả khi cơ sở dữ liệu gặp sự cố cũng không được phép làm ảnh hưởng đến dữ liệu đó.

🌈 Xin bổ sung thêm một điểm quan trọng ở đây: **Chỉ khi bảo đảm được Durability, Atomicity và Isolation của Transaction thì Consistency mới được bảo đảm. Nói cách khác, A, I, D là phương tiện, còn C mới là mục đích!** Chắc hẳn nhiều bạn cũng giống tác giả, từng bị khái niệm ACID đánh lừa trong thời gian dài! Tác giả cũng chỉ hiểu thấu sau khi xem khóa học mở của thầy Chu Chí Minh [*Khóa học Kiến trúc Phần mềm của Chu Chí Minh* (tiếng Trung)](https://time.geekbang.org/opencourse/intro/100064201) (hãy đọc thật nhiều sách hay!).

![AID->C](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/AID--C-78c67e55.png)

Ngoài ra, tác giả cuốn DDIA tức [*Designing Data-Intensive Applications*](https://book.douban.com/subject/30329536/) cũng viết trong sách như sau:

> Atomicity, isolation, and durability are properties of the database, whereas consis‐
> tency (in the ACID sense) is a property of the application. The application may rely
> on the database’s atomicity and isolation properties in order to achieve consistency,
> but it’s not up to the database alone.
>
> Dịch nghĩa là: Atomicity, Isolation và Durability là thuộc tính của cơ sở dữ liệu, còn Consistency (theo nghĩa của ACID) là thuộc tính của tầng ứng dụng. Ứng dụng có thể dựa vào tính Atomicity và Isolation của cơ sở dữ liệu để đạt được sự nhất quán, nhưng điều đó không chỉ phụ thuộc vào một mình cơ sở dữ liệu. Vì vậy, chữ C không thực sự thuộc về ACID.

Cuốn *Designing Data-Intensive Applications* rất đáng đề xuất, xứng đáng đọc đi đọc lại nhiều lần! Trên Douban có gần 90% độc giả chấm 5 sao cho cuốn này. Bản dịch tiếng Trung cũng đã được mã nguồn mở trên GitHub tại địa chỉ: [https://github.com/Vonng/ddia](https://github.com/Vonng/ddia).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/books/ddia-795bef19.png)

### Các Transaction chạy đồng thời gây ra những vấn đề nào?

Trong các ứng dụng điển hình, nhiều Transaction chạy đồng thời và thường xuyên thao tác trên cùng một dữ liệu để hoàn thành tác vụ riêng (nhiều người dùng thao tác trên cùng một dữ liệu). Xử lý đồng thời là bắt buộc, nhưng có thể dẫn tới các vấn đề sau:

#### Đọc bẩn (Dirty Read)

Một Transaction đọc dữ liệu và chỉnh sửa dữ liệu đó, và thay đổi này hiển thị đối với Transaction khác ngay cả khi Transaction hiện tại chưa Commit. Lúc này một Transaction khác đọc phải dữ liệu chưa Commit ấy, nhưng sau đó Transaction đầu tiên đột ngột Rollback khiến thay đổi không hề được ghi nhận vào cơ sở dữ liệu — vậy dữ liệu mà Transaction thứ hai đọc được chính là dữ liệu "bẩn", đó là nguồn gốc tên gọi Dirty Read.

Ví dụ: Transaction 1 đọc dữ liệu `A=20` từ một bảng rồi sửa `A=A-1`; Transaction 2 đọc được `A = 19`; sau đó Transaction 1 Rollback khiến thay đổi lên `A` chưa được Commit vào cơ sở dữ liệu, giá trị thực của `A` vẫn là `20`.

![Đọc bẩn (Dirty Read)](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-dirty-reading-25db2e8b.png)

#### Mất cập nhật (Lost Update)

Khi một Transaction đọc một dữ liệu và một Transaction khác cũng truy cập dữ liệu đó; nếu Transaction đầu tiên sửa dữ liệu này rồi Transaction thứ hai cũng sửa dữ liệu đó, kết quả chỉnh sửa trong Transaction đầu tiên sẽ bị ghi đè và mất đi — hiện tượng này gọi là Lost Update (trong tài liệu gốc ghi là "Lost to modify").

Ví dụ: Transaction 1 đọc dữ liệu `A=20` trong bảng, Transaction 2 cũng đọc `A=20`. Transaction 1 sửa trước `A=A-1`, Transaction 2 sau đó cũng sửa `A=A-1`. Kết quả cuối cùng `A=19`, phần chỉnh sửa của Transaction 1 đã bị mất.

![Mất cập nhật (Lost Update)](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-missing-modificat-daf6a627.png)

#### Đọc không lặp lại (Non-Repeatable Read / Unrepeatable Read)

Là hiện tượng trong cùng một Transaction đọc cùng một dữ liệu nhiều lần. Khi Transaction này chưa kết thúc, một Transaction khác cũng truy cập dữ liệu đó. Giữa hai lần đọc của Transaction thứ nhất, do Transaction kia chỉnh sửa nên hai lần đọc trong Transaction thứ nhất trả về dữ liệu khác nhau — gọi là Non-Repeatable Read.

Ví dụ: Transaction 1 đọc dữ liệu `A=20` trong bảng, Transaction 2 cũng đọc `A=20`. Transaction 1 sửa `A=A-1` (và Commit), Transaction 2 đọc lại `A` lần nữa thì thấy `A=19`, kết quả đọc lần này khác với kết quả đọc lần đầu.

![Đọc không lặp lại (Non-Repeatable Read)](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-unrepeatable-read-66118df3.png)

#### Đọc ảo (Phantom Read)

Phantom Read tương tự Non-Repeatable Read. Nó xảy ra khi một Transaction đọc một tập các dòng dữ liệu thỏa điều kiện, sau đó một Transaction chạy đồng thời khác chèn (INSERT) thêm dữ liệu mới thỏa điều kiện đó. Ở lần truy vấn kế tiếp, Transaction đầu tiên phát hiện xuất hiện thêm những bản ghi vốn chưa từng tồn tại trước đó — cứ như gặp ảo giác, nên gọi là Phantom Read.

Ví dụ: Transaction 2 đọc dữ liệu trong một khoảng điều kiện; Transaction 1 chèn thêm dữ liệu mới vào trong khoảng đó; Transaction 2 đọc lại khoảng dữ liệu đó thì phát hiện có thêm dữ liệu mới so với lần đọc đầu tiên.

![Đọc ảo (Phantom Read)](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-phantom-read-96030f2a.png)

### Sự khác nhau giữa Non-Repeatable Read và Phantom Read là gì?

- **Non-Repeatable Read:** Trong cùng một Transaction, cùng một bản ghi đã tồn tại bị Transaction khác sửa đổi hoặc xóa, dẫn đến khi đọc lại thì nội dung hoặc sự tồn tại của bản ghi thay đổi.
- **Phantom Read:** Trong cùng một Transaction, cùng một truy vấn theo điều kiện khoảng được thực thi nhiều lần nhưng tập bản ghi thỏa điều kiện bị thay đổi, xuất hiện thêm hoặc biến mất một số bản ghi.

Thực ra có thể xem Phantom Read là một trường hợp đặc biệt của Non-Repeatable Read; lý do người ta tách riêng Phantom Read ra chủ yếu vì giải pháp xử lý Phantom Read và Non-Repeatable Read là khác nhau.

Ví dụ: khi thực thi `DELETE` và `UPDATE`, có thể khóa trực tiếp lên bản ghi hiện có để bảo đảm an toàn Transaction. Nhưng khi thực thi `INSERT`, vì `Record Lock` chỉ khóa được các bản ghi đã tồn tại, để ngăn việc chèn thêm bản ghi mới thì phải dựa vào `Gap Lock` (khóa khoảng trống). Nói cách khác, khi thực hiện ngăn chặn kịch bản `INSERT` gây ảo giác, cần dựa vào `Next-Key Lock` (`Record Lock + Gap Lock`) để khóa và bảo đảm không xuất hiện Phantom Read.

### Có những cơ chế kiểm soát đồng thời (Concurrency Control) nào cho Transaction?

Các phương thức kiểm soát Transaction đồng thời trong MySQL tựu trung chỉ có hai loại: **Lock (Khóa)** và **MVCC**. Lock có thể xem là mô hình kiểm soát bi quan (`Pessimistic`), còn kiểm soát đồng thời đa phiên bản (**MVCC** — Multiversion Concurrency Control) có thể xem là mô hình kiểm soát lạc quan (`Optimistic`).

Với cơ chế **Lock**, tài nguyên dùng chung được kiểm soát tường minh bằng khóa thay vì chỉ dựa vào điều phối; trong MySQL chủ yếu dùng **Read-Write Lock (khóa đọc-ghi)** để kiểm soát đồng thời:

- **Shared Lock (S Lock — khóa chia sẻ):** Còn gọi là Read Lock (khóa đọc). Transaction khi đọc bản ghi sẽ lấy S Lock, cho phép nhiều Transaction cùng giữ đồng thời (tương thích khóa).
- **Exclusive Lock (X Lock — khóa độc quyền):** Còn gọi là Write Lock (khóa ghi). Transaction khi sửa đổi bản ghi sẽ lấy X Lock, không cho phép nhiều Transaction cùng giữ. Nếu một bản ghi đã bị đặt X Lock thì các Transaction khác không thể đặt bất kỳ loại khóa nào lên bản ghi đó nữa (xung đột khóa).

Read-Write Lock cho phép đọc-đọc song song, nhưng không cho phép đọc-ghi hoặc ghi-ghi song song. Ngoài ra, tùy theo độ mịn của khóa, khóa còn được chia thành **Table-level Lock (khóa mức bảng)** và **Row-level Lock (khóa mức dòng)**. InnoDB không chỉ hỗ trợ Table-level Lock mà còn hỗ trợ Row-level Lock, mặc định dùng Row-level Lock. Row-level Lock có độ mịn nhỏ hơn, chỉ khóa đúng các bản ghi liên quan (một hoặc nhiều dòng), nên với các thao tác ghi đồng thời, hiệu năng của InnoDB cao hơn hẳn. Dù là Table-level Lock hay Row-level Lock thì đều có cả hai loại là Shared Lock (S Lock) và Exclusive Lock (X Lock).

**MVCC** là phương pháp kiểm soát đồng thời đa phiên bản, tức là với cùng một dữ liệu sẽ lưu nhiều phiên bản khác nhau, thông qua tính khả kiến (Visibility) của Transaction để bảo đảm mỗi Transaction nhìn thấy đúng phiên bản mà nó được phép thấy. Thông thường sẽ có một bộ cấp phát số phiên bản toàn cục gán số phiên bản duy nhất cho từng dòng dữ liệu.

Trong MySQL, việc hiện thực MVCC chủ yếu dựa vào: **Các cột ẩn (Hidden Fields), `Read View`, `undo log`**:

- `undo log`: Dùng để ghi lại dữ liệu của nhiều phiên bản khác nhau cho mỗi dòng.
- `Read View` và các cột ẩn: Dùng để phán đoán tính khả kiến của phiên bản dữ liệu đối với Transaction hiện tại.

Về chi tiết cách InnoDB hiện thực MVCC, có thể xem bài viết: [Cách Storage Engine InnoDB hiện thực MVCC](./innodb-implementation-of-mvcc.md).

### Chuẩn SQL định nghĩa những cấp độ cô lập (Isolation Level) nào?

Chuẩn SQL định nghĩa bốn cấp độ cô lập Transaction nhằm cân bằng giữa tính cô lập (Isolation) và hiệu năng đồng thời (Concurrency). Cấp độ càng cao thì tính nhất quán dữ liệu càng tốt, nhưng hiệu năng đồng thời có thể càng thấp. Bốn cấp độ gồm:

- **READ-UNCOMMITTED (Đọc chưa Commit):** Cấp độ cô lập thấp nhất, cho phép đọc các thay đổi dữ liệu chưa được Commit, có thể dẫn đến Dirty Read, Phantom Read hoặc Non-Repeatable Read. Cấp độ này rất ít khi được dùng trong thực tế vì khả năng bảo đảm nhất quán dữ liệu quá yếu.
- **READ-COMMITTED (Đọc đã Commit):** Cho phép đọc dữ liệu đã được Commit bởi Transaction chạy đồng thời; ngăn được Dirty Read, nhưng Phantom Read hoặc Non-Repeatable Read vẫn có thể xảy ra. Đây là cấp độ cô lập mặc định của đa số cơ sở dữ liệu (như Oracle, SQL Server).
- **REPEATABLE-READ (Đọc lặp lại):** Kết quả nhiều lần đọc cùng một trường trong một Transaction luôn nhất quán, trừ khi dữ liệu bị chính Transaction đó tự sửa đổi; ngăn được Dirty Read và Non-Repeatable Read, nhưng theo chuẩn SQL thì Phantom Read vẫn có thể xảy ra. Cấp độ cô lập mặc định của Storage Engine InnoDB trong MySQL chính là `REPEATABLE-READ`. Hơn nữa, ở cấp độ này InnoDB thông qua cơ chế `MVCC` và `Next-Key Lock` (`Gap Lock + Record Lock`) đã giải quyết phần lớn vấn đề Phantom Read.
- **SERIALIZABLE (Tuần tự hóa):** Cấp độ cô lập cao nhất, tuân thủ hoàn toàn tính cô lập ACID. Mọi Transaction thực thi tuần tự từng cái một nên hoàn toàn không thể xảy ra can thiệp lẫn nhau, tức là ngăn được cả Dirty Read, Non-Repeatable Read lẫn Phantom Read.

| Cấp độ cô lập    | Đọc bẩn (Dirty Read) | Đọc không lặp lại (Non-Repeatable Read) | Đọc ảo (Phantom Read)            |
| ---------------- | -------------------- | --------------------------------------- | -------------------------------- |
| READ UNCOMMITTED | √                    | √                                       | √                                |
| READ COMMITTED   | ×                    | √                                       | √                                |
| REPEATABLE READ  | ×                    | ×                                       | √ (Chuẩn SQL) / ≈× (InnoDB)      |
| SERIALIZABLE     | ×                    | ×                                       | ×                                |

### Cấp độ cô lập mặc định của MySQL là gì?

Cấp độ cô lập mặc định của Storage Engine InnoDB trong MySQL là **REPEATABLE READ**. Có thể kiểm tra bằng câu lệnh sau:

- Trước MySQL 8.0: `SELECT @@tx_isolation;`
- Từ MySQL 8.0 trở đi: `SELECT @@transaction_isolation;`

```sql
mysql> SELECT @@tx_isolation;
+-----------------+
| @@tx_isolation  |
+-----------------+
| REPEATABLE-READ |
+-----------------+
```

Để xem chi tiết về các cấp độ cô lập Transaction trong MySQL, hãy xem bài viết của tác giả: [Giải thích chi tiết các cấp độ cô lập Transaction trong MySQL](./transaction-isolation-level.md).

### Có phải các cấp độ cô lập của MySQL đều được hiện thực bằng Lock không?

Các cấp độ cô lập của MySQL được hiện thực dựa trên sự kết hợp giữa cơ chế **Lock** và **MVCC**.

`SERIALIZABLE` được hiện thực thông qua Lock; `READ-COMMITTED` và `REPEATABLE-READ` chủ yếu dựa vào MVCC. Tuy nhiên, các cấp độ cô lập ngoài `SERIALIZABLE` cũng có thể cần tới cơ chế Lock — ví dụ `REPEATABLE-READ` trong trường hợp đọc hiện tại (Current Read) cần sử dụng đọc có khóa (Locking Read) để bảo đảm không xuất hiện Phantom Read.

## Lock (Khóa) trong MySQL

Lock là một cách kiểm soát Transaction đồng thời rất phổ biến.

### Bạn có biết về Table-level Lock và Row-level Lock không? Chúng khác nhau thế nào?

MyISAM chỉ hỗ trợ Table-level Lock (khóa mức bảng), hễ khóa là khóa cả bảng, nên hiệu năng cực kỳ tệ trong tình huống ghi đồng thời. InnoDB không chỉ hỗ trợ Table-level Lock mà còn hỗ trợ Row-level Lock (khóa mức dòng), mặc định dùng Row-level Lock.

Row-level Lock có độ mịn nhỏ hơn, chỉ cần khóa trên đúng các bản ghi liên quan (một hoặc nhiều dòng), nên với thao tác ghi đồng thời, hiệu năng của InnoDB cao hơn nhiều.

**So sánh Table-level Lock và Row-level Lock**:

- **Table-level Lock:** Loại khóa có độ mịn lớn nhất trong MySQL (ngoại trừ Global Lock), áp dụng khi khóa toàn bộ bảng đang thao tác (hoặc truy vấn không qua Index); triển khai đơn giản, tiêu tốn ít tài nguyên, khóa nhanh và không xảy ra Deadlock. Tuy nhiên, xác suất xung đột khóa cao nhất và hiệu suất dưới tải đồng thời cao cực kỳ thấp. Table-level Lock không phụ thuộc Storage Engine — cả MyISAM và InnoDB đều hỗ trợ.
- **Row-level Lock:** Loại khóa có độ mịn nhỏ nhất trong MySQL, là **khóa đặt trên trường có Index**, chỉ khóa đúng các bản ghi dòng đang thao tác. Row-level Lock giúp giảm mạnh xung đột thao tác cơ sở dữ liệu; độ mịn nhỏ nhất, mức độ đồng thời cao, nhưng chi phí đặt khóa lớn nhất, khóa chậm hơn và có thể xảy ra Deadlock. Row-level Lock gắn với Storage Engine và được hiện thực ở tầng Storage Engine.

### Cần lưu ý những gì khi sử dụng Row-level Lock?

Row-level Lock của InnoDB là khóa đặt lên trường có Index, còn thao tác không qua Index sẽ khóa toàn bảng (quét khóa mọi dòng). Khi thực thi `UPDATE` hoặc `DELETE`, nếu cột trong điều kiện `WHERE` không trúng Index (hoặc Index bị vô hiệu hóa), hệ thống sẽ quét toàn bộ bảng và khóa tất cả các dòng bản ghi trong bảng! Tình huống này rất hay gặp khi phát triển dự án thực tế, nhất định phải hết sức lưu ý!!

Ngoài ra, nhiều lúc dù có Index nhưng vẫn có khả năng đi vào Full Table Scan do quyết định của Query Optimizer trong MySQL.

### InnoDB có những loại Row-level Lock nào?

Row-level Lock của InnoDB được hiện thực bằng cách khóa các bản ghi trên trang chỉ mục (Index Page). MySQL InnoDB hỗ trợ ba kiểu khóa dòng:

- **Record Lock (Khóa bản ghi):** Khóa đặt trên một bản ghi dòng đơn lẻ.
- **Gap Lock (Khóa khoảng trống):** Khóa một khoảng (range) giữa các bản ghi, không bao gồm bản thân bản ghi đó.
- **Next-Key Lock:** `Record Lock + Gap Lock`, khóa cả một khoảng và bao gồm luôn bản thân bản ghi; mục đích chính là để giải quyết vấn đề Phantom Read (đã đề cập ở phần Transaction). Do Record Lock chỉ khóa được bản ghi đã tồn tại, để ngăn việc chèn thêm bản ghi mới vào giữa thì cần dựa vào Gap Lock.

**Ở cấp độ cô lập mặc định `REPEATABLE-READ` của InnoDB, Row-level Lock mặc định sử dụng Next-Key Lock. Tuy nhiên, nếu cột thao tác là Unique Index hoặc Primary Key, InnoDB sẽ tối ưu hóa Next-Key Lock bằng cách hạ cấp xuống thành Record Lock — tức chỉ khóa bản thân khóa Index chứ không khóa cả khoảng.**

### Còn Shared Lock và Exclusive Lock thì sao?

Dù là Table-level Lock hay Row-level Lock thì đều tồn tại hai loại là Shared Lock (S Lock) và Exclusive Lock (X Lock):

- **Shared Lock (S Lock):** Còn gọi là Read Lock. Transaction khi đọc bản ghi sẽ lấy S Lock, cho phép nhiều Transaction lấy đồng thời (tương thích).
- **Exclusive Lock (X Lock):** Còn gọi là Write Lock / khóa độc quyền. Transaction khi sửa đổi bản ghi sẽ lấy X Lock, không cho phép nhiều Transaction lấy đồng thời. Nếu một bản ghi đã bị đặt X Lock thì các Transaction khác không thể đặt bất kỳ loại khóa nào lên bản ghi đó nữa (xung đột).

Exclusive Lock xung đột với mọi loại khóa, còn Shared Lock chỉ tương thích với Shared Lock khác.

|        | S Lock      | X Lock     |
| :----- | :---------- | :--------- |
| S Lock | Không xung đột | Xung đột |
| X Lock | Xung đột    | Xung đột   |

Nhờ có MVCC, với các câu `SELECT` thông thường, InnoDB không đặt bất kỳ khóa nào. Tuy nhiên, bạn có thể chủ động đặt Shared Lock hoặc Exclusive Lock tường minh bằng các câu lệnh sau:

```sql
# Shared Lock — có thể dùng trong MySQL 5.7 và MySQL 8.0
SELECT ... LOCK IN SHARE MODE;
# Shared Lock — có thể dùng trong MySQL 8.0
SELECT ... FOR SHARE;
# Exclusive Lock
SELECT ... FOR UPDATE;
```

### Intention Lock (Khóa ý định) có tác dụng gì?

Nếu cần dùng đến Table-level Lock, làm sao biết được trong bảng có bản ghi nào đang giữ Row-level Lock hay không? Rõ ràng không thể duyệt kiểm tra từng dòng một vì hiệu năng quá kém. Chúng ta cần đến **Intention Lock (Khóa ý định)** để phán đoán nhanh xem có thể đặt Table-level Lock lên bảng đó hay không.

Intention Lock là khóa ở cấp độ bảng, gồm hai loại:

- **Intention Shared Lock (IS Lock — Khóa ý định chia sẻ):** Transaction có ý định đặt S Lock lên một số bản ghi trong bảng; trước khi đặt S Lock mức dòng, bắt buộc phải lấy được IS Lock của bảng đó trước.
- **Intention Exclusive Lock (IX Lock — Khóa ý định độc quyền):** Transaction có ý định đặt X Lock lên một số bản ghi trong bảng; trước khi đặt X Lock mức dòng, bắt buộc phải lấy được IX Lock của bảng đó trước.

**Intention Lock do chính Storage Engine tự động quản lý, người dùng không thể thao tác thủ công; trước khi đặt S Lock hoặc X Lock lên dòng dữ liệu, InnoDB sẽ tự động lấy Intention Lock tương ứng trên bảng chứa dòng đó.**

Các Intention Lock tương thích lẫn nhau:

|         | IS Lock   | IX Lock   |
| ------- | --------- | --------- |
| IS Lock | Tương thích | Tương thích |
| IX Lock | Tương thích | Tương thích |

Intention Lock xung đột với **Table-level** S Lock và X Lock theo bảng dưới đây (lưu ý: Intention Lock không bao giờ xung đột với **Row-level** S Lock hay X Lock):

|        | IS Lock     | IX Lock    |
| ------ | ----------- | ---------- |
| S Lock | Tương thích | Xung đột   |
| X Lock | Xung đột    | Xung đột   |

Mô tả tương ứng trong cuốn *MySQL Technology Insider: InnoDB Storage Engine* dường như đã bị lỗi in ấn / viết nhầm ở phần này.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220511171419081-cc6c116c.png)

### Sự khác nhau giữa Current Read và Snapshot Read là gì?

**Snapshot Read** (đọc nhất quán không khóa — Consistent Non-locking Read) chính là các câu lệnh `SELECT` thông thường, không bao gồm hai nhóm câu `SELECT` có khóa dưới đây:

```sql
# Exclusive Lock, dùng được trong MySQL 5.7 và MySQL 8.0
SELECT ... FOR UPDATE
# Shared Lock, dùng được trong MySQL 5.7 và MySQL 8.0
SELECT ... LOCK IN SHARE MODE;
# Shared Lock, dùng được trong MySQL 8.0
SELECT ... FOR SHARE;
```

Snapshot (ảnh chụp nhanh) tức là phiên bản lịch sử của bản ghi; mỗi bản ghi có thể tồn tại nhiều phiên bản lịch sử (kỹ thuật đa phiên bản).

Trong trường hợp Snapshot Read, nếu bản ghi cần đọc đang bị thực thi `UPDATE`/`DELETE`, thao tác đọc sẽ không vì thế mà chờ X Lock trên bản ghi được giải phóng, mà sẽ đọc một bản Snapshot của dòng đó.

InnoDB chỉ sử dụng Consistent Non-locking Read ở hai cấp độ cô lập Transaction là `RC` (Read Committed) và `RR` (Repeatable Read):

- Ở cấp độ `RC`, với dữ liệu Snapshot, Consistent Non-locking Read luôn đọc phiên bản Snapshot mới nhất (đã Commit gần nhất) của dòng đang bị khóa.
- Ở cấp độ `RR`, với dữ liệu Snapshot, Consistent Non-locking Read luôn đọc phiên bản dữ liệu dòng tại thời điểm bắt đầu Transaction hiện tại.

Snapshot Read phù hợp với các kịch bản nghiệp vụ không đòi hỏi tính nhất quán khóa thời gian thực cực đoan và ưu tiên hiệu năng đọc tối đa.

**Current Read** (đọc nhất quán có khóa — Consistent Locking Read) là đọc phiên bản mới nhất và đặt X Lock hoặc S Lock lên bản ghi dòng.

Các dạng câu SQL phổ biến thực hiện Current Read gồm:

```sql
# Đặt X Lock lên bản ghi được đọc
SELECT...FOR UPDATE
# Đặt S Lock lên bản ghi được đọc
SELECT...LOCK IN SHARE MODE
# Đặt S Lock lên bản ghi được đọc
SELECT...FOR SHARE
# Đặt X Lock lên bản ghi bị sửa đổi
INSERT...
UPDATE...
DELETE...
```

### Bạn có biết về Auto-Increment Lock (AUTO-INC Lock) không?

> Đây là một điểm kiến thức không quá quan trọng, hiểu qua là đủ.

Khi thiết kế bảng trong cơ sở dữ liệu quan hệ, ta thường đặt một cột làm khóa chính tự tăng (Auto-Increment Primary Key). Khóa chính tự tăng trong InnoDB liên quan đến một loại Table-level Lock khá đặc biệt — **AUTO-INC Lock (Khóa tự tăng)**.

```sql
CREATE TABLE `sequence_id` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `stub` CHAR(10) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stub` (`stub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Nói chính xác hơn, không chỉ khóa chính tự tăng mà bất kỳ cột nào có thuộc tính `AUTO_INCREMENT` đều liên quan đến AUTO-INC Lock, bởi cột không phải khóa chính vẫn có thể cấu hình tự tăng.

Nếu một Transaction đang chèn dữ liệu vào bảng có cột tự tăng, nó sẽ phải lấy AUTO-INC Lock trước và có thể bị block nếu chưa lấy được. Hành vi block này chỉ là một trong các chế độ hoạt động của AUTO-INC Lock; có thể hình dung AUTO-INC Lock như một interface có nhiều cách cài đặt cụ thể, điều khiển qua biến cấu hình `innodb_autoinc_lock_mode` (giới thiệu từ MySQL 5.1.22) với các giá trị tùy chọn như sau:

| `innodb_autoinc_lock_mode` | Mô tả                                               |
| :------------------------- | :-------------------------------------------------- |
| 0                          | Chế độ truyền thống (Traditional)                   |
| 1                          | Chế độ liên tiếp (Consecutive — mặc định trước MySQL 8.0) |
| 2                          | Chế độ xen kẽ (Interleaved — mặc định từ MySQL 8.0) |

Ở chế độ xen kẽ (Interleaved mode), mọi câu lệnh dạng `"INSERT-LIKE"` (toàn bộ các lệnh chèn dữ liệu, bao gồm `INSERT`, `REPLACE`, `INSERT...SELECT`, `REPLACE...SELECT`, `LOAD DATA`, v.v.) đều không dùng Table-level Lock mà dùng Mutex nhẹ để triển khai; nhiều lệnh chèn có thể chạy đồng thời với tốc độ nhanh hơn và khả năng mở rộng tốt hơn.

Tuy nhiên, nếu cơ sở dữ liệu MySQL của bạn có nhu cầu đồng bộ Primary-Replica và định dạng lưu trữ `binlog` là `Statement`, tuyệt đối không đặt `innodb_autoinc_lock_mode` sang chế độ xen kẽ, nếu không sẽ gây ra lỗi không nhất quán dữ liệu. Lý do là khi chạy đồng thời, thứ tự thực thi giữa các lệnh chèn không được bảo đảm.

> Nếu MySQL dùng định dạng `Statement`, việc đồng bộ Primary-Replica thực chất là sao chép và chạy lại từng câu lệnh SQL một.

Cuối cùng, giới thiệu thêm một bài viết: [Tại sao khóa chính tự tăng của MySQL không đơn điệu cũng không liên tục (tiếng Trung)](https://draveness.me/whys-the-design-mysql-auto-increment/).

## ⭐️Tối ưu hiệu năng MySQL

Về tổng hợp các khuyến nghị chuẩn tối ưu hiệu năng cao cho MySQL, vui lòng xem bài viết này: [Tổng hợp quy chuẩn và khuyến nghị tối ưu hiệu năng cao cho MySQL](./mysql-high-performance-optimization-specification-recommendations.md).

### Có thể dùng MySQL lưu trực tiếp file (như hình ảnh) không?

Lưu thì vẫn lưu được bằng cách lưu trực tiếp dữ liệu nhị phân của file. Tuy nhiên, rất khuyến cáo không nên lưu file trong cơ sở dữ liệu vì sẽ ảnh hưởng nghiêm trọng đến hiệu năng cơ sở dữ liệu và tiêu tốn quá nhiều dung lượng lưu trữ.

Bạn có thể chọn dùng các dịch vụ lưu trữ file (Object Storage) có sẵn của nhà cung cấp Cloud — chín muồi, ổn định và chi phí cũng khá thấp.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/oss-search-15c7d5a2.png)

Bạn cũng có thể tự xây dựng dịch vụ lưu trữ file phân tán riêng; việc triển khai cũng không khó với các dự án mã nguồn mở như FastDFS hay MinIO (khuyên dùng).

**Cơ sở dữ liệu chỉ nên lưu thông tin đường dẫn/địa chỉ file, còn file thực tế do dịch vụ lưu trữ file đảm nhiệm.**

### MySQL lưu trữ địa chỉ IP như thế nào?

Có thể chuyển đổi địa chỉ IP sang dữ liệu số nguyên để lưu trữ, vừa cho hiệu năng tốt hơn vừa tốn ít dung lượng hơn.

MySQL cung cấp sẵn hai hàm để xử lý địa chỉ IP:

- `INET_ATON()`: Chuyển địa chỉ IP thành số nguyên không dấu (tài liệu gốc ghi 4–8 byte/ký tự; với IPv4 thực chất là số nguyên không dấu 4 byte / 32-bit).
- `INET_NTOA()`: Chuyển số nguyên đại diện IP trở lại thành chuỗi địa chỉ IP.

Trước khi chèn dữ liệu, dùng `INET_ATON()` chuyển địa chỉ IP thành số nguyên; khi hiển thị dữ liệu, dùng `INET_NTOA()` chuyển ngược số nguyên thành chuỗi địa chỉ IP để hiển thị.

### Có những kỹ thuật tối ưu SQL phổ biến nào?

Trong phần **「Câu hỏi phỏng vấn kỹ thuật」** của [*Java Interview Guide* (trả phí)](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html) có một bài viết giới thiệu rất chi tiết các kỹ thuật tối ưu SQL thường gặp, cực kỳ đầy đủ, rõ ràng và dễ hiểu!

![Các kỹ thuật tối ưu SQL phổ biến](/media/jg/ext/oss.javaguide.cn/javamianshizhibei/javamianshizhibei-sql-optimization-3cdc5f03.png)

Địa chỉ bài viết: <https://www.yuque.com/snailclimb/mf2z3k/abc2sv> (Lấy mật khẩu tại: <https://t.zsxq.com/avfM0>).

### Làm thế nào để phân tích hiệu năng của SQL?

Chúng ta có thể sử dụng lệnh `EXPLAIN` để phân tích **Execution Plan (kế hoạch thực thi)** của câu SQL. Execution Plan là phương thức thực thi cụ thể của một câu SQL sau khi đã được Query Optimizer của MySQL tối ưu hóa.

`EXPLAIN` không thực sự chạy câu lệnh truy vấn, mà phân tích câu lệnh thông qua **Query Optimizer** để tìm ra phương án truy vấn tối ưu nhất và hiển thị các thông tin tương ứng.

`EXPLAIN` áp dụng được cho các câu lệnh `SELECT`, `DELETE`, `INSERT`, `REPLACE` và `UPDATE`, trong đó phổ biến nhất là phân tích truy vấn `SELECT`.

Dưới đây là ví dụ minh họa nhanh cách dùng `EXPLAIN`.

Định dạng đầu ra của `EXPLAIN` như sau:

```sql
mysql> EXPLAIN SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | cus_order | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 997572 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)
```

Ý nghĩa từng cột như sau:

| **Tên cột**   | **Ý nghĩa**                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| id            | Định danh tuần tự của truy vấn `SELECT`                                                      |
| select_type   | Loại truy vấn tương ứng với từ khóa `SELECT`                                                 |
| table         | Tên bảng được sử dụng                                                                        |
| partitions    | Các phân vùng (partition) khớp; với bảng không phân vùng giá trị là `NULL`                   |
| type          | Phương thức truy cập bảng (Access Type)                                                      |
| possible_keys | Các Index có khả năng được sử dụng                                                           |
| key           | Index thực tế được sử dụng                                                                   |
| key_len       | Độ dài (tính theo byte) của khóa Index được chọn                                             |
| ref           | Cột hoặc hằng số được so sánh với Index khi truy vấn so sánh bằng                            |
| rows          | Số dòng ước tính cần phải đọc                                                                |
| filtered      | Tỷ lệ phần trăm số bản ghi còn lại sau khi lọc theo điều kiện của bảng                       |
| Extra         | Thông tin bổ sung                                                                            |

Do giới hạn độ dài, phần này chỉ giới thiệu sơ lược về MySQL Execution Plan; để xem chi tiết xin đọc bài viết: [Kế hoạch thực thi của SQL](./mysql-query-execution-plan.md).

### Bạn có hiểu về tách đọc-ghi (Read-Write Splitting) và Sharding (chia DB/bảng) không?

Vì các câu hỏi liên quan đến Read-Write Splitting và Sharding khá nhiều nên tác giả đã viết riêng một bài để trình bày: [Giải thích chi tiết tách đọc-ghi và Sharding (Database/Table Sharding)](../../high-performance/read-and-write-separation-and-library-subtable.md).

### Tối ưu phân trang sâu (Deep Pagination) như thế nào?

[Giới thiệu về Deep Pagination và các khuyến nghị tối ưu](../../high-performance/deep-pagination-optimization.md)

### Triển khai phân tách dữ liệu nóng-lạnh (Hot-Cold Data Separation) như thế nào?

[Giải thích chi tiết phân tách dữ liệu nóng-lạnh](../../high-performance/data-cold-hot-separation.md)

### Tối ưu hiệu năng MySQL tổng thể như thế nào?

Tối ưu hiệu năng MySQL là một bài toán kỹ thuật mang tính hệ thống, liên quan đến nhiều khía cạnh nên khi phỏng vấn không thể trình bày hết mọi tiểu tiết. Vì vậy, nên triển khai câu trả lời theo tư duy "Điểm – Đường – Diện" (từ điểm nóng cốt lõi mở rộng ra toàn hệ thống), bắt đầu từ vấn đề trọng tâm rồi mở rộng dần để thể hiện chiều sâu tư duy và năng lực giải quyết vấn đề của bạn.

**1. Nắm lấy cốt lõi: Định vị và phân tích Slow SQL**

Bước đầu tiên của tối ưu hiệu năng luôn là tìm ra nút thắt cổ chai (bottleneck). Khi phỏng vấn, hãy bắt đầu từ **định vị và phân tích Slow SQL**, điều này vừa thể hiện tư duy giải quyết vấn đề vừa cho thấy bạn thành thạo các công cụ giám sát cơ sở dữ liệu:

- **Công cụ giám sát:** Trình bày các công cụ theo dõi Slow SQL quen thuộc như **MySQL Slow Query Log**, **Performance Schema**, v.v., giải thích mức độ thành thạo và cách bạn dùng chúng để khoanh vùng truy vấn có vấn đề.
- **Lệnh `EXPLAIN`:** Giải thích chi tiết cách sử dụng `EXPLAIN` để phân tích kế hoạch thực thi và tình trạng dùng Index; có thể lồng ghép ví dụ thực tế để chứng minh cách bạn đọc kết quả phân tích như thứ tự thực thi, tình trạng trúng Index, Full Table Scan, v.v.

**2. Từ điểm mở ra đường: Tối ưu Index, cấu trúc bảng và câu SQL**

Sau khi khoanh vùng được Slow SQL, bước tiếp theo là tối ưu đúng vào nguyên nhân cụ thể với các kỹ thuật tối ưu Index, thiết kế bảng và chuẩn viết SQL:

- **Tối ưu Index:** Đây là trọng tâm của tối ưu hiệu năng MySQL; có thể trình bày các nguyên tắc tạo Index, Covering Index, nguyên tắc Leftmost Prefix, v.v. Nếu lồng ghép được ví dụ áp dụng thực tế trong dự án của bạn để giải thích cách chọn Index hợp lý thì sẽ càng ghi điểm.
- **Tối ưu cấu trúc bảng:** Tối ưu thiết kế bảng bao gồm chọn kiểu dữ liệu cột phù hợp, tránh các trường dư thừa không cần thiết, vận dụng hợp lý thiết kế chuẩn hóa (Normalization) và phi chuẩn hóa (Denormalization).
- **Tối ưu SQL:** Tránh dùng `SELECT *`, cố gắng chỉ lấy các cột cụ thể cần thiết, thay Subquery bằng `JOIN` khi phù hợp, tối ưu truy vấn phân trang, thực hiện thao tác theo lô (Batch), v.v. — đó đều là những chi tiết cần chú ý khi viết SQL.

**3. Phương án nâng cao: Tối ưu tầng kiến trúc**

Khi người phỏng vấn đã hài lòng với kiến thức tối ưu cơ bản, họ có thể đào sâu sang các phương án tối ưu ở cấp độ kiến trúc:

- **Read-Write Splitting (Tách đọc-ghi):** Tách thao tác đọc và thao tác ghi sang các instance cơ sở dữ liệu khác nhau để nâng cao khả năng xử lý đồng thời.
- **Sharding (Phân mảnh DB/bảng):** Phân tán dữ liệu ra nhiều instance hoặc nhiều bảng để giảm lượng bản ghi trên mỗi bảng và tăng tốc truy vấn — nhưng phải cân nhắc kỹ độ phức tạp và chi phí bảo trì phát sinh, sử dụng thận trọng.
- **Phân tách dữ liệu nóng-lạnh:** Dựa trên tần suất truy cập và mức độ quan trọng nghiệp vụ để chia dữ liệu thành dữ liệu lạnh và dữ liệu nóng; dữ liệu lạnh lưu trên thiết bị chi phí thấp, hiệu năng thấp, còn dữ liệu nóng lưu trên thiết bị lưu trữ hiệu năng cao.
- **Cơ chế Cache:** Sử dụng các middleware bộ nhớ đệm như Redis để lưu dữ liệu nóng (Hot Data) trong RAM, giảm tải áp lực cho cơ sở dữ liệu — cách này cực kỳ phổ biến, hiệu quả cải thiện rõ rệt và tỷ lệ hiệu năng/chi phí rất cao!

**4. Các biện pháp tối ưu khác**

Ngoài định vị Slow SQL, tối ưu Index và tối ưu kiến trúc, có thể nhắc thêm một số biện pháp khác để thể hiện hiểu biết toàn diện về tinh chỉnh hiệu năng MySQL:

- **Cấu hình Connection Pool:** Cấu hình hợp lý Connection Pool kết nối cơ sở dữ liệu (như **kích thước Pool**, **thời gian Timeout**, v.v.) giúp nâng cao hiệu quả dùng lại kết nối, tránh chi phí đóng/mở kết nối liên tục.
- **Nâng cấp phần cứng:** Nâng cấp phần cứng cũng là biện pháp tối ưu quan trọng — sử dụng server cấu hình cao hơn, tăng dung lượng RAM, dùng ổ cứng **SSD**, v.v. đều góp phần cải thiện rõ rệt hiệu năng tổng thể của cơ sở dữ liệu.

**5. Tổng kết**

Trong phỏng vấn, nên trình bày theo thứ tự ưu tiên lần lượt: định vị Slow SQL, [tối ưu Index](./mysql-index.md), thiết kế cấu trúc bảng và [tối ưu SQL](../../high-performance/sql-optimization.md). Các giải pháp ở tầng kiến trúc như [tách đọc-ghi và Sharding](../../high-performance/read-and-write-separation-and-library-subtable.md) hay [phân tách dữ liệu nóng-lạnh](../../high-performance/data-cold-hot-separation.md) nên được xem là lựa chọn sau cùng — không nên áp dụng tùy tiện trừ khi thực sự gặp nút thắt hiệu năng rõ rệt trong kịch bản đặc thù, vì độ phức tạp đi kèm sẽ kéo theo chi phí bảo trì không nhỏ.

## Tài liệu học MySQL đề xuất

**Bài viết đề xuất**:

- [Chuỗi bài hướng dẫn MySQL của Yishu Yixi (tiếng Trung)](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg3NTc3NjM4Nw==&action=getalbum&album_id=2372043523518300162&scene=173&from_msgid=2247484308&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
- [Chuỗi bài hướng dẫn MySQL của Yes (tiếng Trung)](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzkxNTE3NjQ3MA==&action=getalbum&album_id=1903249596194095112&scene=173&from_msgid=2247490365&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
- [Đọc xong bài này, kỹ năng tối ưu SQL của tôi bước sang tầm cao mới - Biancheng Paidaxing - 2022 (tiếng Trung)](https://juejin.cn/post/7161964571853815822)
- [Giải thích chi tiết hai vạn chữ! Chuyên đề Lock trong InnoDB! - Jian Tianluo de Xiaonanhai - 2022 (tiếng Trung)](https://juejin.cn/post/7094049650428084232)
- [Khóa chính tự tăng của MySQL có nhất định liên tục không? - Feitian Xiaoniuro - 2022 (tiếng Trung)](https://mp.weixin.qq.com/s/qci10h9rJx_COZbHV3aygQ)
- [Hiểu sâu nguyên lý tầng dưới của MySQL Index - Tencent Tech Engineering - 2020 (tiếng Trung)](https://zhuanlan.zhihu.com/p/113917726)

## Tài liệu tham khảo

- *High Performance MySQL*, Chương 7: Tính năng nâng cao của MySQL
- *MySQL Technology Insider: InnoDB Storage Engine*, Chương 6: Lock
- Relational Database: <https://www.omnisci.com/technical-glossary/relational-database>
- Một bài viết giúp hiểu rõ `varchar` trong MySQL lưu được bao nhiêu chữ Hán, chữ số và sự khác nhau giữa `varchar(100)` và `varchar(10)` (tiếng Trung): <https://www.cnblogs.com/zhuyeshen/p/11642211.html>
- Chia sẻ kỹ thuật | Cấp độ cô lập: Hiểu đúng về Phantom Read (tiếng Trung): <https://opensource.actionsky.com/20210818-mysql/>
- MySQL Server Logs - MySQL 5.7 Reference Manual: <https://dev.mysql.com/doc/refman/5.7/en/server-logs.html>
- Redo Log - MySQL 5.7 Reference Manual: <https://dev.mysql.com/doc/refman/5.7/en/innodb-redo-log.html>
- Locking Reads - MySQL 5.7 Reference Manual: <https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-reads.html>
- Hiểu sâu về Row-level Lock và Table-level Lock trong cơ sở dữ liệu (tiếng Trung): <https://zhuanlan.zhihu.com/p/52678870>
- Giải thích chi tiết vai trò của Intention Lock trong MySQL InnoDB (tiếng Trung): <https://juejin.cn/post/6844903666332368909>
- Phân tích chuyên sâu về Auto-Increment Lock trong MySQL (tiếng Trung): <https://juejin.cn/post/6968420054287253540>
- Trong cơ sở dữ liệu, nên phân biệt Non-Repeatable Read và Phantom Read như thế nào cho đúng? (tiếng Trung): <https://www.zhihu.com/question/392569386>
