---
title: "Giải thích chi tiết về Character Set: Bộ ký tự là gì và cách sử dụng?"
description: Giải thích chi tiết nguyên lý bộ ký tự (Character Set) và mã hóa ký tự (Character Encoding), phân tích sâu các bảng mã phổ biến như ASCII, GB2312, GBK, UTF-8, UTF-16, đồng thời giải thích sự khác biệt giữa utf8 và utf8mb4 trong MySQL cùng giải pháp lưu trữ emoji.
category: Cơ sở dữ liệu
tag:
  - Nền tảng cơ sở dữ liệu
head:
  - - meta
    - name: keywords
      content: Character Set,Character Encoding,UTF-8,UTF-16,GBK,GB2312,utf8mb4,ASCII,Unicode,MySQL Character Set,lưu trữ emoji
lang: vi
sourceRef: zh-ref/database/character-set.md
---

Trong bộ mã hóa ký tự của MySQL có hai phiên bản triển khai UTF-8 là **`utf8`** và **`utf8mb4`**.

Nếu sử dụng **`utf8`**, việc lưu trữ ký hiệu emoji cũng như một số chữ Hán phức tạp và chữ phồn thể sẽ bị lỗi.

Vì sao lại như vậy? Bài viết này sẽ giải đáp cho bạn từ gốc rễ.

## Bộ ký tự (Character Set) là gì?

Ký tự là tên gọi chung cho các loại chữ viết và ký hiệu, bao gồm chữ viết của các quốc gia, dấu câu, biểu tượng cảm xúc (emoji), chữ số,... **Bộ ký tự (Character Set)** chính là một tập hợp các ký tự. Có rất nhiều loại bộ ký tự và phạm vi ký tự mà mỗi bộ ký tự có thể biểu diễn thường khác nhau — chẳng hạn một số bộ ký tự hoàn toàn không thể biểu diễn chữ Hán.

**Máy tính chỉ có thể lưu trữ dữ liệu nhị phân, vậy chữ tiếng Anh, chữ Hán, biểu tượng cảm xúc,... phải lưu trữ như thế nào?**

Chúng ta cần ánh xạ một-một giữa các ký tự này với dữ liệu nhị phân — ví dụ ký tự `"a"` tương ứng với `"01100001"`, và ngược lại `"01100001"` tương ứng với `"a"`. Quá trình ánh xạ ký tự sang dữ liệu nhị phân được gọi là "**mã hóa ký tự**" (Character Encoding), còn quá trình phân tích dữ liệu nhị phân ngược lại thành ký tự được gọi là "**giải mã ký tự**" (Character Decoding).

## Mã hóa ký tự (Character Encoding) là gì?

Mã hóa ký tự là phương pháp chuyển đổi qua lại giữa các ký tự trong bộ ký tự và dữ liệu nhị phân trong máy tính, có thể xem như một bộ quy tắc ánh xạ. Nói cách khác, mục đích của mã hóa ký tự là giúp máy tính có thể lưu trữ và truyền tải các loại thông tin văn bản khác nhau.

Mỗi bộ ký tự đều có quy tắc mã hóa ký tự riêng. Các quy tắc mã hóa phổ biến gồm ASCII, GB2312, GBK, GB18030, Big5, UTF-8, UTF-16,...

## Có những bộ ký tự phổ biến nào?

Các bộ ký tự phổ biến gồm có: ASCII, GB2312, GB18030, GBK, Unicode,...

Sự khác biệt chính giữa các bộ ký tự nằm ở:

- Phạm vi ký tự có thể biểu diễn
- Phương thức mã hóa

### ASCII

**ASCII** (**A**merican **S**tandard **C**ode for **I**nformation **I**nterchange — Chuẩn mã trao đổi thông tin Hoa Kỳ) là một bộ ký tự chủ yếu dành cho tiếng Anh Mỹ hiện đại (đây cũng chính là hạn chế của bộ ký tự ASCII).

**Vì sao bộ ký tự ASCII không tính đến chữ Trung Quốc hay các ký tự ngôn ngữ khác?** Vì máy tính do người Mỹ phát minh; vào thời điểm đó, máy tính vẫn đang ở giai đoạn sơ khai, chưa được sử dụng rộng rãi ở các quốc gia khác. Do đó, khi Mỹ ban hành bộ ký tự ASCII, họ chưa tính đến việc tương thích với ngôn ngữ của các nước khác.

Tính đến nay, bộ ký tự ASCII định nghĩa tổng cộng 128 ký tự, trong đó có 33 ký tự điều khiển (như xuống dòng/Enter, xóa/Delete) không hiển thị được.

Một mã ASCII dài 1 byte tức là 8 bit, ví dụ mã ASCII tương ứng với `"a"` là `"01100001"`. Tuy nhiên, bit cao nhất luôn là `0` chỉ đóng vai trò bit kiểm tra/dự phòng, còn 7 bit còn lại dùng tổ hợp của `0` và `1`, nên bộ ký tự ASCII có thể định nghĩa 128 ($2^7$) ký tự.

Vì số lượng ký tự mà mã ASCII biểu diễn được quá ít, về sau người ta mở rộng nó thành **bộ ký tự ASCII mở rộng** (Extended ASCII). Bộ ký tự ASCII mở rộng dùng cả 8 bit để biểu diễn một ký tự, nên có thể định nghĩa 256 ($2^8$) ký tự.

![Mã hóa ký tự ASCII](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/c1c6375d08ca268690cef2b13591a5b4-23b9e1ea.png)

### GB2312

Như đã nói ở trên, bộ ký tự ASCII là bộ ký tự phù hợp với tiếng Anh Mỹ hiện đại. Vì vậy, nhiều quốc gia đã tự xây dựng một bộ ký tự phù hợp với ngôn ngữ nước mình.

Bộ ký tự GB2312 rất thân thiện với chữ Hán, thu thập hơn 6.700 chữ Hán, cơ bản bao phủ đại đa số các chữ Hán thường dùng. Tuy nhiên, GB2312 không hỗ trợ phần lớn chữ hiếm gặp và chữ phồn thể.

Đối với ký tự tiếng Anh, mã hóa GB2312 giống hệt mã ASCII, chỉ cần 1 byte để mã hóa. Đối với ký tự không phải tiếng Anh, cần 2 byte để mã hóa.

### GBK

Bộ ký tự GBK có thể xem là bản mở rộng của bộ ký tự GB2312, tương thích với GB2312 và thu thập hơn 20.000 chữ Hán.

Chữ K trong GBK là chữ cái đầu của từ "Kuo" trong phiên âm tiếng Trung *Kuo Zhan* (nghĩa là mở rộng).

### GB18030

GB18030 tương thích hoàn toàn với các bộ ký tự GB2312 và GBK, bổ sung chữ viết của các dân tộc thiểu số ở Trung Quốc, đồng thời thu thập cả chữ Hán của Nhật Bản và Hàn Quốc. Đây là bộ ký tự tiếng Trung đầy đủ nhất tính đến hiện nay, với hơn 70.000 chữ Hán.

### BIG5

BIG5 chủ yếu hướng tới chữ Trung phồn thể, thu thập hơn 13.000 chữ Hán.

### Unicode & UTF-8

Để phù hợp hơn với ngôn ngữ bản địa, rất nhiều bộ ký tự khác nhau đã ra đời.

Như đã đề cập ở trên, các bộ ký tự khác nhau có sự khác biệt về phạm vi ký tự biểu diễn cũng như quy tắc mã hóa. Điều này dẫn tới một vấn đề rất nghiêm trọng: **dùng sai bảng mã để xem một tệp chứa ký tự sẽ gây ra hiện tượng lỗi chữ/ký tự rác (mojibake).**

Chẳng hạn, nếu bạn mở một tệp được mã hóa theo định dạng GB2312 bằng chuẩn mã hóa UTF-8 thì sẽ xuất hiện ký tự rác. Ví dụ: chữ Hán `"牛"` sau khi mã hóa GB2312 có giá trị thập lục phân là `"C5A3"`, nhưng khi giải mã `"C5A3"` bằng UTF-8 lại ra ký tự `"ţ"`.

Bạn có thể thử mã hóa và giải mã trực tuyến qua trang web này: <https://www.haomeili.net/HanZi/ZiFuBianMaZhuanHuan>

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/836c49b117ee4408871b0020b74c991d-9d827be0.png)

Như vậy chúng ta đã hiểu rõ bản chất của hiện tượng ký tự rác: **khi mã hóa và giải mã đã dùng hai bộ ký tự khác nhau hoặc không tương thích.**

![](/media/jg/ext/oss.javaguide.cn/javaguide/a8808cbabeea49caa3af27d314fa3c02-1-bf9ca9fb.jpg)

Để giải quyết vấn đề này, người ta mới nghĩ: "Giá như có một bộ ký tự có thể đưa tất cả các ký tự trên thế giới vào trong đó thì tốt biết mấy!".

Và thế là **Unicode** ra đời với sứ mệnh đó.

Bộ ký tự Unicode chứa gần như toàn bộ các ký tự đã biết trên thế giới. Tuy nhiên, bản thân bộ ký tự Unicode không quy định cách lưu trữ các ký tự này (tức là cách biểu diễn chúng bằng dữ liệu nhị phân).

Sau đó mới có **UTF-8** (**8**-bit **U**nicode **T**ransformation **F**ormat). Tương tự còn có UTF-16, UTF-32.

UTF-8 dùng 1 đến 4 byte để mã hóa mỗi ký tự, UTF-16 dùng 2 hoặc 4 byte cho mỗi ký tự, còn UTF-32 cố định 4 byte cho mỗi ký tự.

UTF-8 có thể tự động chọn độ dài mã hóa tùy theo ký hiệu khác nhau; chẳng hạn ký tự tiếng Anh chỉ cần 1 byte là đủ, điểm này giống bộ ký tự ASCII. Do đó, đối với ký tự tiếng Anh, mã hóa UTF-8 hoàn toàn giống mã ASCII.

UTF-32 có quy tắc đơn giản nhất, nhưng nhược điểm cũng rất rõ ràng: đối với các ký tự như chữ cái tiếng Anh, dung lượng tiêu tốn gấp 4 lần so với UTF-8.

**UTF-8** hiện là chuẩn mã hóa ký tự được sử dụng rộng rãi nhất.

![](/media/jg/ext/oss.javaguide.cn/javaguide/1280px-Utf8webgrowth.svg-0d67cd0f.png)

## Bộ ký tự (Character Set) trong MySQL

MySQL hỗ trợ rất nhiều loại bộ ký tự, chẳng hạn như GB2312, GBK, BIG5 và nhiều bảng mã Unicode (UTF-8, UTF-16, UCS-2, UTF-32,...).

### Xem các bộ ký tự được hỗ trợ

Bạn có thể kiểm tra bằng lệnh `SHOW CHARSET`, câu lệnh này hỗ trợ mệnh đề `LIKE` và `WHERE`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211008164229671-612d69e3.png)

### Bộ ký tự mặc định

Trong MySQL 5.7, bộ ký tự mặc định là `latin1`; trong MySQL 8.0, bộ ký tự mặc định là `utf8mb4`.

### Các cấp độ phân tầng của bộ ký tự

Bộ ký tự trong MySQL có các cấp độ phân tầng sau:

- `server` (cấp instance MySQL)
- `database` (cấp database)
- `table` (cấp bảng)
- `column` (cấp cột/trường)

Mức độ ưu tiên của chúng có thể hiểu đơn giản là tăng dần từ trên xuống dưới, tức là mức độ ưu tiên của `column` sẽ lớn hơn `table` và các cấp ở trên. Ví dụ: nếu chỉ định bộ ký tự cấp instance MySQL là `utf8mb4`, còn bộ ký tự của một bảng nào đó là `latin1`, thì tất cả các cột trong bảng này nếu không chỉ định riêng sẽ đều có bảng mã là `latin1`.

#### server

Các phiên bản MySQL khác nhau có giá trị mặc định cho bộ ký tự cấp `server` khác nhau: trong MySQL 5.7 mặc định là `latin1`; trong MySQL 8.0 mặc định là `utf8mb4`.

Tất nhiên, bạn cũng có thể thiết lập bộ ký tự cấp `server` bằng cách chỉ định `--character-set-server` khi khởi động `mysqld`.

```bash
mysqld
mysqld --character-set-server=utf8mb4
mysqld --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_0900_ai_ci
```

Hoặc nếu bạn biên dịch và khởi chạy MySQL từ mã nguồn, bạn có thể chỉ định tùy chọn trong lệnh `cmake`:

```sh
cmake . -DDEFAULT_CHARSET=latin1
# hoặc
cmake . -DDEFAULT_CHARSET=latin1 \
  -DDEFAULT_COLLATION=latin1_german1_ci
```

Ngoài ra, bạn cũng có thể thay đổi giá trị của `character_set_server` tại thời điểm chạy (runtime) để chỉnh sửa bộ ký tự cấp `server`.

Bộ ký tự cấp `server` là cấu hình toàn cục của máy chủ MySQL. Nó không chỉ đóng vai trò làm bộ ký tự mặc định khi tạo hoặc sửa database (nếu không chỉ định bộ ký tự khác), mà còn ảnh hưởng đến bộ ký tự kết nối giữa client và server. Chi tiết có thể xem tại [MySQL Connector/J 8.0 - 6.7 Using Character Sets and Unicode](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-reference-charsets.html).

#### database

Bộ ký tự cấp `database` được chỉ định khi chúng ta tạo database hoặc sửa đổi database:

```sql
CREATE DATABASE db_name
    [[DEFAULT] CHARACTER SET charset_name]
    [[DEFAULT] COLLATE collation_name]

ALTER DATABASE db_name
    [[DEFAULT] CHARACTER SET charset_name]
    [[DEFAULT] COLLATE collation_name]
```

Như đã nói ở trên, nếu khi thực thi các câu lệnh trên mà không chỉ định bộ ký tự, MySQL sẽ sử dụng bộ ký tự cấp `server`.

Có thể kiểm tra bộ ký tự của một database bằng các cách sau:

```sql
USE db_name;
SELECT @@character_set_database, @@collation_database;
```

```sql
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'db_name';
```

#### table

Bộ ký tự cấp `table` được chỉ định khi tạo bảng hoặc sửa đổi bảng:

```sql
CREATE TABLE tbl_name (column_list)
    [[DEFAULT] CHARACTER SET charset_name]
    [COLLATE collation_name]]

ALTER TABLE tbl_name
    [[DEFAULT] CHARACTER SET charset_name]
    [COLLATE collation_name]
```

Nếu khi tạo bảng và sửa bảng không chỉ định bộ ký tự, thì sẽ sử dụng bộ ký tự cấp `database`.

#### column

Bộ ký tự cấp `column` cũng được chỉ định khi tạo bảng hoặc sửa bảng, chỉ khác là nó được định nghĩa trực tiếp trên cột. Dưới đây là một ví dụ:

```sql
CREATE TABLE t1
(
    col1 VARCHAR(5)
      CHARACTER SET latin1
      COLLATE latin1_german1_ci
);
```

Nếu không chỉ định bộ ký tự cấp cột, thì sẽ sử dụng bộ ký tự cấp bảng.

### Bộ ký tự kết nối (Connection Character Set)

Các cấp độ phân tầng bộ ký tự vừa nêu ở trên liên quan đến lưu trữ. Còn bộ ký tự kết nối liên quan đến việc giao tiếp với máy chủ MySQL.

Bộ ký tự kết nối gắn liền với các biến sau đây:

- `character_set_client`: Mô tả bộ ký tự mà client sử dụng cho câu lệnh SQL gửi lên server.
- `character_set_connection`: Mô tả bộ ký tự mà server dùng để dịch câu lệnh SQL khi nhận được.
- `character_set_results`: Mô tả bộ ký tự mà server sử dụng khi trả kết quả về cho client.

Giá trị của chúng có thể được truy vấn bằng các câu lệnh SQL dưới đây:

```sql
SELECT * FROM performance_schema.session_variables
WHERE VARIABLE_NAME IN (
'character_set_client', 'character_set_connection',
'character_set_results', 'collation_connection'
) ORDER BY VARIABLE_NAME;
```

```sql
SHOW SESSION VARIABLES LIKE 'character\_set\_%';
```

Nếu muốn sửa đổi giá trị của các biến vừa đề cập, có các cách sau:

1. Chỉnh sửa tệp cấu hình

```properties
[mysql]
# Chỉ áp dụng cho chương trình MySQL client
default-character-set=utf8mb4
```

2. Sử dụng câu lệnh SQL

```sql
set names utf8mb4
# Hoặc chỉnh sửa từng biến một
# SET character_set_client = utf8mb4;
# SET character_set_results = utf8mb4;
# SET collation_connection = utf8mb4;
```

### Ảnh hưởng của JDBC đến bộ ký tự kết nối

Không biết bạn đã từng gặp trường hợp lưu biểu tượng cảm xúc emoji bình thường, nhưng khi dùng các phần mềm như Navicat để truy vấn thì lại thấy emoji biến thành dấu chấm hỏi chưa? Vấn đề này rất có thể xuất phát từ JDBC driver.

Theo nội dung phía trên, chúng ta biết rằng bộ ký tự kết nối cũng ảnh hưởng đến dữ liệu lưu trữ, và JDBC driver sẽ tác động đến bộ ký tự kết nối.

`mysql-connector-java` (JDBC driver) chủ yếu ảnh hưởng đến bộ ký tự kết nối thông qua các thuộc tính sau:

- `characterEncoding`
- `characterSetResults`

Lấy ví dụ với `DataGrip 2023.1.2`: trong hộp thoại cấu hình nâng cao (Advanced) của Data Source, bạn có thể thấy giá trị mặc định của `characterSetResults` là `utf8`. Khi sử dụng `mysql-connector-java 8.0.25`, bộ ký tự kết nối cuối cùng sẽ bị đặt thành `utf8mb3`. Trong trường hợp đó, emoji sẽ bị hiển thị thành dấu chấm hỏi, và phiên bản driver này thậm chí chưa hỗ trợ đặt `characterSetResults` thành `utf8mb4`; tuy nhiên nếu đổi sang `mysql-connector-java driver 8.0.29` thì lại cho phép.

Chi tiết có thể xem câu trả lời trên StackOverflow: [DataGrip MySQL stores emojis correctly but displays them as?](https://stackoverflow.com/questions/54815419/datagrip-mysql-stores-emojis-correctly-but-displays-them-as).

### Sử dụng UTF-8

Thông thường, chúng ta khuyến nghị sử dụng UTF-8 làm chuẩn mã hóa ký tự mặc định.

Tuy nhiên, ở đây có một cái bẫy nhỏ.

Trong bộ mã hóa ký tự của MySQL có hai phiên bản triển khai UTF-8:

- **`utf8`**: Mã hóa `utf8` chỉ hỗ trợ `1–3` byte. Trong mã hóa `utf8`, chữ Hán chiếm 3 byte, còn chữ số, chữ tiếng Anh và ký hiệu cơ bản chiếm 1 byte. Tuy nhiên, ký hiệu emoji chiếm tới 4 byte, và một số chữ phức tạp, chữ phồn thể cũng chiếm 4 byte.
- **`utf8mb4`**: Bản triển khai đầy đủ của UTF-8 — hàng chuẩn! Hỗ trợ tối đa 4 byte để biểu diễn ký tự, do đó có thể dùng để lưu trữ ký hiệu emoji.

**Vì sao lại có hai phiên bản triển khai UTF-8?** Nguyên nhân như sau:

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211008164542347-509ed376.png)

Do đó, nếu bạn cần lưu trữ dữ liệu dạng `emoji` hoặc một số chữ phức tạp, chữ phồn thể vào cơ sở dữ liệu MySQL, thì bảng mã của cơ sở dữ liệu bắt buộc phải chỉ định là `utf8mb4` chứ không phải `utf8`, nếu không khi lưu trữ sẽ bị báo lỗi.

Hãy minh họa thử nhé! (Môi trường: MySQL 5.7+)

Câu lệnh tạo bảng như sau, chúng ta chỉ định CHARSET của cơ sở dữ liệu là `utf8`.

```sql
CREATE TABLE `user` (
  `id` varchar(66) CHARACTER SET utf8mb3 NOT NULL,
  `name` varchar(33) CHARACTER SET utf8mb3 NOT NULL,
  `phone` varchar(33) CHARACTER SET utf8mb3 DEFAULT NULL,
  `password` varchar(100) CHARACTER SET utf8mb3 DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

Khi chúng ta thực thi câu lệnh `INSERT` dưới đây để chèn dữ liệu vào cơ sở dữ liệu, quả nhiên đã báo lỗi!

```sql
INSERT INTO `user` (`id`, `name`, `phone`, `password`)
VALUES
 ('A00003', 'guide哥😘😘😘', '181631312312', '123456');

```

Thông báo lỗi như sau:

```plain
Incorrect string value: '\xF0\x9F\x98\x98\xF0\x9F...' for column 'name' at row 1
```

## Tài liệu tham khảo

- Bộ ký tự và mã hóa ký tự (Charset & Encoding): <https://www.cnblogs.com/skynet/archive/2011/05/03/2035105.html>
- Hiểu rõ bộ ký tự và mã hóa ký tự trong 10 phút: <http://cenalulu.github.io/linux/character-encoding/>
- Unicode - Wikipedia: <https://zh.wikipedia.org/wiki/Unicode>
- GB2312 - Wikipedia: <https://zh.wikipedia.org/wiki/GB_2312>
- UTF-8 - Wikipedia: <https://zh.wikipedia.org/wiki/UTF-8>
- GB18030 - Wikipedia: <https://zh.wikipedia.org/wiki/GB_18030>
- Tài liệu MySQL 8: <https://dev.mysql.com/doc/refman/8.0/en/charset.html>
- Tài liệu MySQL 5.7: <https://dev.mysql.com/doc/refman/5.7/en/charset.html>
- Tài liệu MySQL Connector/J: <https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-reference-charsets.html>
