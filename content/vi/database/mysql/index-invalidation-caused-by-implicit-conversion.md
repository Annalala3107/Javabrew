---
title: Vô hiệu hóa Index do chuyển đổi kiểu ngầm định trong MySQL
description: Phân tích chuyên sâu nguyên nhân và kịch bản chuyển đổi kiểu dữ liệu ngầm định (Implicit Conversion) trong MySQL dẫn đến vô hiệu hóa Index, minh họa vấn đề hiệu năng khi so sánh chuỗi với số qua ví dụ thực tế và đưa ra thực hành tốt nhất để tránh vô hiệu hóa Index.
category: Cơ sở dữ liệu
tag:
  - MySQL
  - Tối ưu hiệu năng
head:
  - - meta
    - name: keywords
      content: Chuyển đổi ngầm định MySQL,Vô hiệu hóa Index,Chuyển đổi kiểu dữ liệu,Tối ưu hiệu năng MySQL,Lệch kiểu dữ liệu,Full Table Scan,Tối ưu SQL
lang: vi
sourceRef: zh-ref/database/mysql/index-invalidation-caused-by-implicit-conversion.md
---

> Phiên bản MySQL sử dụng trong bài kiểm thử này là `5.7.26`. Theo quá trình cập nhật các phiên bản MySQL, một số đặc tính có thể thay đổi; bài viết này không đại diện cho kết luận chính xác tuyệt đối trên mọi phiên bản MySQL, bạn hãy tự đối chiếu sự khác biệt giữa các phiên bản.
>
> Bài gốc: <https://www.guitu18.com/post/2019/11/24/61.html>

## Lời mở đầu

Tối ưu cơ sở dữ liệu là một nhiệm vụ lâu dài và nặng nề; muốn tối ưu hiệu quả thì phải hiểu sâu các đặc tính của cơ sở dữ liệu. Trong quá trình phát triển, chúng ta thường gặp phải những lỗi hóc búa nguyên nhân rất đơn giản nhưng hậu quả lại vô cùng nghiêm trọng. Những lỗi kiểu này thường rất khó khoanh vùng, điều tra tốn nhiều thời gian công sức nhưng cuối cùng lại phát hiện chỉ do một sơ suất nhỏ, hoặc do không nắm rõ một đặc tính kỹ thuật nào đó.

Ở tầng cơ sở dữ liệu, lỗi phổ biến nhất có lẽ chính là vô hiệu hóa Index (Index Invalidation), hơn nữa ban đầu khi lượng dữ liệu còn nhỏ thì rất khó phát hiện. Nhưng khi nghiệp vụ mở rộng và lượng dữ liệu tăng lên, vấn đề hiệu năng sẽ dần bộc lộ; nếu xử lý không kịp thời rất dễ gây ra hiệu ứng quả cầu tuyết, cuối cùng dẫn đến cơ sở dữ liệu bị treo cứng thậm chí sập hoàn toàn. Có rất nhiều nguyên nhân gây vô hiệu hóa Index và đã có quá nhiều bài viết kỹ thuật nói về chủ đề này; hôm nay điều tôi muốn ghi lại là **vô hiệu hóa Index do chuyển đổi kiểu ngầm định (Implicit Conversion)**.

## Chuẩn bị dữ liệu

Đầu tiên sử dụng Stored Procedure để tạo ra 10 triệu dòng dữ liệu kiểm thử.
Bảng kiểm thử tạo tổng cộng 7 cột (bao gồm khóa chính): `num1` và `num2` lưu các số tuần tự giống hệt `id`, trong đó `num2` có kiểu chuỗi.
`type1` và `type2` đều lưu phần dư của khóa chính chia cho 5, nhằm mô phỏng các cột kiểu phân loại (type) hay gặp trong ứng dụng thực tế, nhưng `type2` không được tạo Index.
`str1` và `str2` đều lưu một chuỗi ngẫu nhiên dài 20 ký tự; `str1` không được phép `NULL`, còn `str2` cho phép `NULL`, do đó khi sinh dữ liệu kiểm thử tôi cũng tạo một lượng nhỏ giá trị `NULL` ở cột `str2` (cứ mỗi 100 dòng sinh ra một giá trị `NULL`).

```sql
-- Tạo bảng dữ liệu kiểm thử
DROP TABLE IF EXISTS test1;
CREATE TABLE `test1` (
    `id` int(11) NOT NULL,
    `num1` int(11) NOT NULL DEFAULT '0',
    `num2` varchar(11) NOT NULL DEFAULT '',
    `type1` int(4) NOT NULL DEFAULT '0',
    `type2` int(4) NOT NULL DEFAULT '0',
    `str1` varchar(100) NOT NULL DEFAULT '',
    `str2` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `num1` (`num1`),
    KEY `num2` (`num2`),
    KEY `type1` (`type1`),
    KEY `str1` (`str1`),
    KEY `str2` (`str2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- Tạo Stored Procedure
DROP PROCEDURE IF EXISTS pre_test1;
DELIMITER //
CREATE PROCEDURE `pre_test1`()
BEGIN
    DECLARE i INT DEFAULT 0;
    SET autocommit = 0;
    WHILE i < 10000000 DO
        SET i = i + 1;
        SET @str1 = SUBSTRING(MD5(RAND()),1,20);
        -- Cứ mỗi 100 dòng, str2 sinh ra một giá trị null
        IF i % 100 = 0 THEN
            SET @str2 = NULL;
        ELSE
            SET @str2 = @str1;
        END IF;
        INSERT INTO test1 (`id`, `num1`, `num2`,
        `type1`, `type2`, `str1`, `str2`)
        VALUES (CONCAT('', i), CONCAT('', i),
        CONCAT('', i), i%5, i%5, @str1, @str2);
        -- Tối ưu Transaction: cứ mỗi 10.000 dòng commit một lần
        IF i % 10000 = 0 THEN
            COMMIT;
        END IF;
    END WHILE;
END;
// DELIMITER ;
-- Thực thi Stored Procedure
CALL pre_test1();
```

Vì khối lượng dữ liệu tương đối lớn và còn dùng `MD5` để sinh chuỗi ngẫu nhiên nên tốc độ chạy hơi chậm, cứ kiên nhẫn chờ một chút là được.

Với 10 triệu dòng dữ liệu, máy của tôi mất 33 phút mới chạy xong (thời gian thực tế tùy thuộc vào cấu hình phần cứng máy bạn). Dưới đây là vài dòng dữ liệu mẫu vừa sinh ra, trông đại khái như thế này:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-ed7eb800.png)

## Kiểm thử SQL

Trước tiên hãy xem nhóm câu SQL này gồm tổng cộng bốn câu. Trong bảng kiểm thử của chúng ta, `num1` có kiểu `int`, `num2` có kiểu `varchar`, nhưng dữ liệu lưu trữ đều là dãy số tuần tự giống khóa chính `id`, và cả hai cột đều đã được tạo Index.

```sql
1: SELECT * FROM `test1` WHERE num1 = 10000;
2: SELECT * FROM `test1` WHERE num1 = '10000';
3: SELECT * FROM `test1` WHERE num2 = 10000;
4: SELECT * FROM `test1` WHERE num2 = '10000';
```

Bốn câu SQL này đều được viết có chủ đích: câu 1 và 2 truy vấn cột kiểu `int`, còn câu 3 và 4 truy vấn cột kiểu `varchar`. Trong cặp 1 & 2 hoặc 3 & 4, cột truy vấn tuy giống nhau nhưng một bên điều kiện là số, một bên điều kiện là chuỗi đặt trong dấu nháy đơn. Làm như vậy có gì khác biệt? Khoan nhìn kết quả kiểm thử bên dưới, bạn có đoán được thứ tự hiệu năng của bốn câu SQL này không?

Qua kiểm thử thực tế, kết quả thực thi của bốn câu SQL này lại chênh lệch rất lớn: trong đó ba câu 1, 2, 4 về cơ bản đều trả kết quả tức thì, mất khoảng 0.001~0.005 giây; ở quy mô chục triệu dòng dữ liệu, kết quả như vậy có thể kết luận hiệu năng của ba câu SQL này gần như không khác biệt. Nhưng ở câu SQL thứ 3, qua nhiều lần đo thử, thời gian thực thi dao động khoảng 4.5~4.8 giây.

Vì sao hai câu SQL 3 và 4 có hiệu năng chênh lệch lớn như vậy, trong khi hai câu SQL 1 và 2 làm đối chiếu tương tự lại chẳng khác gì nhau? Hãy kiểm tra Execution Plan; dưới đây lần lượt là dữ liệu Execution Plan của bốn câu SQL 1, 2, 3 và 4:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-f78a476b.png)

Có thể thấy ba câu SQL 1, 2, 4 đều dùng được Index, kiểu truy cập đều là `ref`, số dòng quét (`rows`) đều là 1, nên hiệu năng cực kỳ cao. Còn nhìn sang câu SQL thứ 3: nó không dùng được Index mà chuyển sang quét toàn bộ bảng (Full Table Scan), `rows` vọt thẳng lên 10 triệu, vì thế hiệu năng mới chênh lệch lớn đến vậy.

Quan sát kỹ bạn sẽ thấy ở hai câu SQL 3 và 4, cột truy vấn `num2` có kiểu `varchar`, và câu SQL thứ 4 — đặt dấu nháy bên phải dấu `=` — dùng được Index. Vậy có phải do kiểu dữ liệu điều kiện truy vấn không khớp với kiểu dữ liệu của cột gây ra không? Nếu đúng như vậy thì tại sao ở hai câu SQL 1 và 2, cột truy vấn `num1` là kiểu `int`, nhưng câu SQL thứ 2 lại thêm dấu nháy ở vế phải điều kiện mà vẫn dùng được Index?

Tra cứu tài liệu liên quan của MySQL thì phát hiện nguyên nhân là do chuyển đổi kiểu ngầm định (Implicit Conversion). Hãy xem mô tả chính thức:

> Tài liệu chính thức: [12.2 Type Conversion in Expression Evaluation](https://dev.mysql.com/doc/refman/5.7/en/type-conversion.html?spm=5176.100239.blogcont47339.5.1FTben)
>
> Khi toán tử được sử dụng cùng các toán hạng khác kiểu dữ liệu, phép chuyển đổi kiểu sẽ diễn ra để làm các toán hạng tương thích với nhau. Một số phép chuyển đổi xảy ra ngầm định. Ví dụ, MySQL tự động chuyển chuỗi sang số khi cần thiết và ngược lại. Các quy tắc sau mô tả cách chuyển đổi cho phép toán so sánh:
>
> 1. Khi một hoặc cả hai tham số là `NULL`, kết quả so sánh cũng là `NULL`; trường hợp đặc biệt là khi dùng `<=>` để so sánh hai `NULL` sẽ trả về `1`, cả hai trường hợp này đều không cần chuyển đổi kiểu.
> 2. Cả hai tham số đều là chuỗi thì sẽ so sánh theo chuỗi, không chuyển đổi kiểu.
> 3. Cả hai tham số đều là số nguyên thì so sánh theo số nguyên, không chuyển đổi kiểu.
> 4. Giá trị thập lục phân (hexadecimal) khi so sánh với giá trị không phải số sẽ được coi là chuỗi nhị phân.
> 5. Nếu một tham số là `TIMESTAMP` hoặc `DATETIME` và tham số còn lại là hằng số, hằng số đó sẽ được chuyển đổi sang `timestamp`.
> 6. Nếu một tham số có kiểu `decimal`, và tham số còn lại là `decimal` hoặc số nguyên, số nguyên sẽ được chuyển sang `decimal` để so sánh; nếu tham số còn lại là số thực dấu phẩy động (floating-point), `decimal` sẽ được chuyển sang số thực dấu phẩy động để so sánh.
> 7. **Trong tất cả các trường hợp khác, cả hai tham số đều được chuyển đổi thành số thực dấu phẩy động rồi mới so sánh.**

Theo mô tả trong tài liệu chính thức, cả hai câu SQL 2 và 3 của chúng ta đều xảy ra chuyển đổi kiểu ngầm định: điều kiện truy vấn của câu SQL thứ 2 là `num1 = '10000'` (vế trái kiểu `int`, vế phải là chuỗi), còn câu SQL thứ 3 thì ngược lại; do đó theo quy tắc chuyển đổi số 7 của tài liệu chính thức, cả hai vế đều sẽ được chuyển thành số thực dấu phẩy động để so sánh.

Trước hết xét câu SQL thứ 2: ``SELECT * FROM `test1` WHERE num1 = '10000';``. **Vế trái là kiểu `int`** `10000`, chuyển sang số thực vẫn là `10000`; vế phải kiểu chuỗi `'10000'` chuyển sang số thực cũng là `10000`. Kết quả chuyển đổi của cả hai vế đều xác định duy nhất, nên không ảnh hưởng đến việc sử dụng Index.

Xét câu SQL thứ 3: ``SELECT * FROM `test1` WHERE num2 = 10000;``. **Vế trái là kiểu chuỗi** `'10000'`, chuyển sang số thực thành `10000` tuy là duy nhất, và vế phải kiểu `int` `10000` chuyển đổi cũng cho kết quả duy nhất. Tuy nhiên, vì vế trái là cột điều kiện tìm kiếm, dù `'10000'` chuyển thành `10000`, vẫn có những chuỗi khác cũng chuyển thành `10000` được — ví dụ `'10000a'`, `'010000'`, `'10000'` v.v. đều có thể chuyển thành số thực `10000`. Trong trường hợp như vậy, Index không thể được sử dụng.

Chúng ta có thể kiểm chứng hiện tượng **chuyển đổi ngầm định** này bằng phép thử truy vấn. Trước tiên chèn thêm vài dòng dữ liệu với `num2='10000a'`, `'010000'` và `'10000'`:

```sql
INSERT INTO `test1` (`id`, `num1`, `num2`, `type1`, `type2`, `str1`, `str2`) VALUES ('10000001', '10000', '10000a', '0', '0', '2df3d9465ty2e4hd523', '2df3d9465ty2e4hd523');
INSERT INTO `test1` (`id`, `num1`, `num2`, `type1`, `type2`, `str1`, `str2`) VALUES ('10000002', '10000', '010000', '0', '0', '2df3d9465ty2e4hd523', '2df3d9465ty2e4hd523');
INSERT INTO `test1` (`id`, `num1`, `num2`, `type1`, `type2`, `str1`, `str2`) VALUES ('10000003', '10000', ' 10000', '0', '0', '2df3d9465ty2e4hd523', '2df3d9465ty2e4hd523');
```

Sau đó dùng câu SQL thứ ba ``SELECT * FROM `test1` WHERE num2 = 10000;`` để truy vấn:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-7e85c3b3.png)

Từ kết quả có thể thấy ba dòng dữ liệu vừa chèn thêm ở sau đều khớp hết. Vậy quy tắc chuyển đổi ngầm định của chuỗi này là gì? Tại sao cả ba trường hợp `num2='10000a'`, `'010000'` và `'10000'` đều khớp được? Tra cứu tài liệu liên quan cho thấy quy tắc như sau:

1. Chuỗi **không bắt đầu bằng chữ số** đều sẽ được chuyển thành `0`. Ví dụ `'abc'`, `'a123bc'`, `'abc123'` đều chuyển thành `0`.
2. Chuỗi **bắt đầu bằng chữ số** khi chuyển đổi sẽ bị cắt trích từ ký tự đầu tiên cho đến ngay trước ký tự đầu tiên không phải số. Ví dụ `'123abc'` chuyển thành `123`, `'012abc'` chuyển thành `012` tức `12`, `'5.3a66b78c'` chuyển thành `5.3`, các trường hợp khác tương tự.

Bây giờ thực hiện kiểm thử xác minh các quy tắc trên như sau:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-fe308a78.png)

Như vậy đã chứng thực hoàn toàn kết quả truy vấn trước đó.

Viết thêm một câu SQL truy vấn cột `str1`: ``SELECT * FROM `test1` WHERE str1 = 1234;``

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-7335190f.png)

## Phân tích và Tổng kết

Qua các bài kiểm thử trên, chúng ta rút ra một số đặc tính khi sử dụng toán tử trong MySQL:

1. Khi **kiểu dữ liệu ở hai vế trái và phải của toán tử không giống nhau**, sẽ xảy ra **chuyển đổi kiểu ngầm định (Implicit Conversion)**.
2. Khi điều kiện `WHERE` có **vế trái là kiểu số** xảy ra chuyển đổi ngầm định, ảnh hưởng đến hiệu năng là không lớn, nhưng vẫn không khuyến nghị làm như vậy.
3. Khi điều kiện `WHERE` có **vế trái là kiểu chuỗi ký tự** xảy ra chuyển đổi ngầm định, nó sẽ khiến Index bị vô hiệu hóa, dẫn đến quét toàn bộ bảng (Full Table Scan) với hiệu năng cực kỳ thấp.
4. Khi chuyển đổi chuỗi sang kiểu số, chuỗi không bắt đầu bằng chữ số sẽ chuyển thành `0`, còn chuỗi bắt đầu bằng chữ số sẽ cắt trích giá trị từ ký tự đầu tiên cho đến ngay trước ký tự không phải số đầu tiên làm kết quả chuyển đổi.

Vì vậy, khi viết SQL chúng ta nhất định phải rèn thói quen tốt: cột truy vấn có kiểu dữ liệu gì thì điều kiện bên phải dấu `=` phải viết đúng theo kiểu dữ liệu tương ứng. Đặc biệt khi cột truy vấn là kiểu chuỗi, điều kiện bên phải dấu `=` bắt buộc phải đặt trong dấu nháy để chỉ rõ đây là chuỗi, nếu không sẽ làm vô hiệu hóa Index và kích hoạt Full Table Scan.
