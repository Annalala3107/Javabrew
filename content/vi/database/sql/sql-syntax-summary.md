---
title: Tổng hợp kiến thức nền tảng về cú pháp SQL
description: Tổng hợp kiến thức nền tảng về cú pháp SQL, trình bày có hệ thống về DDL (định nghĩa dữ liệu), DML (thao tác dữ liệu), DQL (truy vấn dữ liệu) và DCL (kiểm soát dữ liệu), bao gồm thao tác bảng, ràng buộc (constraint), chỉ mục (index), giao dịch (transaction), truy vấn kết nối (JOIN) và các kiến thức cốt lõi khác.
category: Cơ sở dữ liệu
tag:
  - Nền tảng cơ sở dữ liệu
  - SQL
head:
  - - meta
    - name: keywords
      content: Cú pháp SQL,DDL,DML,DQL,DCL,CREATE,SELECT,INSERT,UPDATE,DELETE,JOIN,Subquery,Truy vấn con
lang: vi
sourceRef: zh-ref/database/sql/sql-syntax-summary.md
---

> Bài viết này được tổng hợp và hoàn thiện từ hai nguồn tài liệu dưới đây:
>
> - [Sổ tay cấp tốc cú pháp SQL](https://juejin.cn/post/6844903790571700231)
> - [Hướng dẫn MySQL toàn tập](https://www.begtut.com/mysql/mysql-tutorial.html)

## Khái niệm cơ bản

### Thuật ngữ cơ sở dữ liệu

- `Database (cơ sở dữ liệu)` - Vùng chứa lưu trữ dữ liệu có tổ chức (thường là một tệp hoặc một tập hợp các tệp).
- `Table (bảng dữ liệu)` - Danh sách có cấu trúc cho một loại dữ liệu cụ thể nào đó.
- `Schema (lược đồ)` - Thông tin về bố cục và đặc tính của cơ sở dữ liệu và bảng. Schema định nghĩa cách dữ liệu được lưu trữ trong bảng, bao gồm kiểu dữ liệu được lưu, cách phân tách dữ liệu, cách đặt tên cho từng phần thông tin,... Cả cơ sở dữ liệu và bảng đều có schema.
- `Column (cột)` - Một trường (field) trong bảng. Tất cả các bảng đều được cấu thành từ một hoặc nhiều cột.
- `Row (hàng)` - Một bản ghi (record) trong bảng.
- `Primary Key (khóa chính)` - Một cột (hoặc một nhóm cột) mà giá trị của nó có thể xác định duy nhất từng hàng trong bảng.

### Cú pháp SQL

SQL (Structured Query Language): chuẩn SQL do ủy ban tiêu chuẩn ANSI quản lý, do đó được gọi là ANSI SQL. Mỗi hệ quản trị cơ sở dữ liệu (DBMS) đều có bản triển khai riêng, chẳng hạn như PL/SQL, Transact-SQL,...

#### Cấu trúc cú pháp SQL

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/cb684d4c75fc430e92aaee226069c7da-tplv-k3u1fbpfcp-6a7eac92.png)

Cấu trúc cú pháp SQL bao gồm:

- **`Mệnh đề (Clause)`** - Là thành phần cấu thành nên các câu lệnh và truy vấn. (Trong một số trường hợp, các mệnh đề này là tùy chọn.)
- **`Biểu thức (Expression)`** - Có thể tạo ra bất kỳ giá trị vô hướng nào, hoặc một bảng dữ liệu gồm các cột và hàng.
- **`Vị từ (Predicate)`** - Chỉ định các điều kiện cần được đánh giá theo logic ba giá trị của SQL (3VL: true/false/unknown) hoặc giá trị chân lý Boolean, nhằm giới hạn tác động của câu lệnh và truy vấn hoặc thay đổi luồng thực thi chương trình.
- **`Truy vấn (Query)`** - Truy xuất dữ liệu dựa trên các điều kiện cụ thể. Đây là một thành phần quan trọng của SQL.
- **`Câu lệnh (Statement)`** - Có thể tác động lâu dài lên schema và dữ liệu, hoặc điều khiển transaction của cơ sở dữ liệu, luồng chương trình, kết nối, phiên làm việc (session) hay chẩn đoán.

#### Những điểm chính về cú pháp SQL

- **Câu lệnh SQL không phân biệt chữ hoa, chữ thường**, tuy nhiên tên bảng, tên cột và giá trị có phân biệt hoa thường hay không lại phụ thuộc vào từng DBMS cụ thể và cấu hình của nó. Ví dụ: `SELECT`, `select` và `Select` là như nhau.
- **Nhiều câu lệnh SQL phải được phân tách bằng dấu chấm phẩy (`;`)**.
- Khi xử lý câu lệnh SQL, **mọi khoảng trắng thừa đều được bỏ qua**.

Câu lệnh SQL có thể viết trên một dòng hoặc chia thành nhiều dòng.

```sql
-- Câu lệnh SQL một dòng

UPDATE user SET username='robot', password='robot' WHERE username = 'root';

-- Câu lệnh SQL nhiều dòng
UPDATE user
SET username='robot', password='robot'
WHERE username = 'root';
```

SQL hỗ trợ ba kiểu chú thích (comment):

```sql
## Chú thích 1
-- Chú thích 2
/* Chú thích 3 */
```

### Phân loại SQL

#### Ngôn ngữ định nghĩa dữ liệu (DDL)

Ngôn ngữ định nghĩa dữ liệu (Data Definition Language, viết tắt là DDL) là phần ngôn ngữ trong SQL chịu trách nhiệm định nghĩa cấu trúc dữ liệu và các đối tượng cơ sở dữ liệu.

Chức năng chính của DDL là **định nghĩa các đối tượng cơ sở dữ liệu**.

Các lệnh cốt lõi của DDL là `CREATE`, `ALTER`, `DROP`.

#### Ngôn ngữ thao tác dữ liệu (DML)

Ngôn ngữ thao tác dữ liệu (Data Manipulation Language, viết tắt là DML) là các câu lệnh lập trình dùng để thao tác với cơ sở dữ liệu, thực hiện các tác vụ truy cập đối với đối tượng và dữ liệu trong cơ sở dữ liệu.

Chức năng chính của DML là **truy cập dữ liệu**, do đó cú pháp của nó chủ yếu xoay quanh việc **đọc và ghi cơ sở dữ liệu**.

Các lệnh cốt lõi của DML là `INSERT`, `UPDATE`, `DELETE`, `SELECT`. Bốn lệnh này gọi chung là CRUD (Create, Read, Update, Delete), tức Thêm, Đọc, Sửa, Xóa.

#### Ngôn ngữ điều khiển giao dịch (TCL)

Ngôn ngữ điều khiển giao dịch (Transaction Control Language, viết tắt là TCL) được dùng để **quản lý các transaction (giao dịch) trong cơ sở dữ liệu**. Nhóm lệnh này dùng để quản lý các thay đổi do câu lệnh DML thực hiện, đồng thời cho phép nhóm nhiều câu lệnh thành các transaction logic.

Các lệnh cốt lõi của TCL là `COMMIT`, `ROLLBACK`.

#### Ngôn ngữ kiểm soát dữ liệu (DCL)

Ngôn ngữ kiểm soát dữ liệu (Data Control Language, viết tắt là DCL) là tập lệnh dùng để kiểm soát quyền truy cập dữ liệu, cho phép kiểm soát quyền hạn của các tài khoản người dùng cụ thể đối với bảng dữ liệu, View, Stored Procedure, hàm do người dùng định nghĩa và các đối tượng cơ sở dữ liệu khác.

Các lệnh cốt lõi của DCL là `GRANT`, `REVOKE`.

DCL chủ yếu phục vụ việc **kiểm soát quyền truy cập của người dùng**, nên cách sử dụng tương đối đơn giản. Các quyền có thể kiểm soát bằng DCL gồm: `CONNECT`, `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`, `USAGE`, `REFERENCES`.

Tùy theo DBMS và các thực thể bảo mật khác nhau mà các quyền được hỗ trợ kiểm soát cũng có sự khác biệt.

**Trước tiên, chúng ta hãy tìm hiểu cách dùng câu lệnh DML. Chức năng chính của DML là đọc ghi cơ sở dữ liệu để thực hiện CRUD.**

## Thao tác CRUD (Thêm, Đọc, Sửa, Xóa)

Thêm, đọc, sửa, xóa — còn gọi là CRUD — là những thao tác cơ bản nhất trong các thao tác với cơ sở dữ liệu.

### Chèn dữ liệu

Câu lệnh `INSERT INTO` được dùng để chèn các bản ghi mới vào bảng.

**Chèn đầy đủ một hàng**

```sql
# Chèn một hàng
INSERT INTO user
VALUES (10, 'root', 'root', 'xxxx@163.com');
# Chèn nhiều hàng
INSERT INTO user
VALUES (10, 'root', 'root', 'xxxx@163.com'), (12, 'user1', 'user1', 'xxxx@163.com'), (18, 'user2', 'user2', 'xxxx@163.com');
```

**Chèn một phần các cột của hàng**

```sql
INSERT INTO user(username, password, email)
VALUES ('admin', 'admin', 'xxxx@163.com');
```

**Chèn dữ liệu lấy từ truy vấn**

```sql
INSERT INTO user(username)
SELECT name
FROM account;
```

### Cập nhật dữ liệu

Câu lệnh `UPDATE` được dùng để cập nhật các bản ghi trong bảng.

```sql
UPDATE user
SET username='robot', password='robot'
WHERE username = 'root';
```

### Xóa dữ liệu

- Câu lệnh `DELETE` dùng để xóa bản ghi trong bảng.
- `TRUNCATE TABLE` dùng để làm rỗng bảng, tức xóa toàn bộ các hàng. Lưu ý: câu lệnh `TRUNCATE` không thuộc cú pháp DML mà thuộc cú pháp DDL.

**Xóa dữ liệu chỉ định trong bảng**

```sql
DELETE FROM user
WHERE username = 'robot';
```

**Xóa toàn bộ dữ liệu trong bảng**

```sql
TRUNCATE TABLE user;
```

### Truy vấn dữ liệu

Câu lệnh `SELECT` được dùng để truy vấn dữ liệu từ cơ sở dữ liệu.

`DISTINCT` được dùng để trả về các giá trị duy nhất, không trùng lặp. Nó tác động lên tất cả các cột được chọn, tức là các hàng chỉ được coi là giống nhau khi giá trị của tất cả các cột đều giống nhau.

`LIMIT` giới hạn số hàng trả về. Có thể nhận hai tham số: tham số thứ nhất là vị trí hàng bắt đầu (tính từ 0); tham số thứ hai là tổng số hàng cần trả về.

- `ASC`: Sắp xếp tăng dần (mặc định)
- `DESC`: Sắp xếp giảm dần

**Truy vấn một cột**

```sql
SELECT prod_name
FROM products;
```

**Truy vấn nhiều cột**

```sql
SELECT prod_id, prod_name, prod_price
FROM products;
```

**Truy vấn tất cả các cột**

```sql
SELECT *
FROM products;
```

**Truy vấn các giá trị không trùng lặp**

```sql
SELECT DISTINCT
vend_id FROM products;
```

**Giới hạn kết quả truy vấn**

```sql
-- Trả về 5 hàng đầu tiên
SELECT * FROM mytable LIMIT 5;
SELECT * FROM mytable LIMIT 0, 5;
-- Trả về từ hàng thứ 3 đến hàng thứ 5
SELECT * FROM mytable LIMIT 2, 3;
```

## Sắp xếp

`order by` được dùng để sắp xếp tập kết quả theo một hoặc nhiều cột. Mặc định, các bản ghi được sắp xếp theo thứ tự tăng dần; nếu cần sắp xếp theo thứ tự giảm dần, có thể dùng từ khóa `desc`.

Khi `order by` sắp xếp theo nhiều cột, cột ưu tiên sắp xếp trước đặt ở phía trước, cột sắp xếp sau đặt ở phía sau. Ngoài ra, mỗi cột khác nhau có thể áp dụng quy tắc sắp xếp khác nhau.

```sql
SELECT * FROM products
ORDER BY prod_price DESC, prod_name ASC;
```

## Nhóm dữ liệu

**`group by`**:

- Mệnh đề `group by` nhóm các bản ghi lại thành các hàng tổng hợp.
- `group by` trả về một bản ghi cho mỗi nhóm.
- `group by` thường đi kèm với các hàm tổng hợp (aggregate function) như `count`, `max`, `sum`, `avg`,...
- `group by` có thể nhóm theo một hoặc nhiều cột.
- Sau khi `group by` nhóm theo trường phân nhóm, `order by` có thể sắp xếp dựa trên các trường tổng hợp.

**Nhóm dữ liệu**

```sql
SELECT cust_name, COUNT(cust_address) AS addr_num
FROM Customers GROUP BY cust_name;
```

**Sắp xếp sau khi nhóm**

```sql
SELECT cust_name, COUNT(cust_address) AS addr_num
FROM Customers GROUP BY cust_name
ORDER BY cust_name DESC;
```

**`having`**:

- `having` dùng để lọc kết quả đã được tổng hợp bởi `group by`.
- `having` thường luôn được dùng kết hợp với `group by`.
- `where` và `having` có thể xuất hiện trong cùng một truy vấn.

**Lọc dữ liệu bằng WHERE và HAVING**

```sql
SELECT cust_name, COUNT(*) AS NumberOfOrders
FROM Customers
WHERE cust_email IS NOT NULL
GROUP BY cust_name
HAVING COUNT(*) > 1;
```

**`having` vs `where`**:

- `where`: Lọc các hàng được chỉ định; phía sau không thể dùng hàm tổng hợp (hàm nhóm). `where` đứng trước `group by`.
- `having`: Lọc theo nhóm; thường đi liền với `group by` và không thể dùng đơn lẻ. `having` đứng sau `group by`.

## Truy vấn con (Subquery)

Truy vấn con (Subquery) là một truy vấn SQL được lồng bên trong một truy vấn lớn hơn, còn gọi là truy vấn trong (inner query) hoặc inner select; câu lệnh chứa truy vấn con được gọi là truy vấn ngoài (outer query) hoặc outer select. Hiểu đơn giản, truy vấn con là việc lấy kết quả của một truy vấn `select` (truy vấn con) làm nguồn dữ liệu hoặc điều kiện đánh giá cho một câu lệnh SQL khác (truy vấn chính).

Truy vấn con có thể được nhúng vào các câu lệnh `SELECT`, `INSERT`, `UPDATE` và `DELETE`, đồng thời có thể dùng cùng các toán tử như `=`, `<`, `>`, `IN`, `BETWEEN`, `EXISTS`,...

Truy vấn con thường được đặt sau mệnh đề `WHERE` và mệnh đề `FROM`:

- Khi dùng trong mệnh đề `WHERE`, tùy vào toán tử mà truy vấn con có thể trả về dữ liệu một hàng một cột, nhiều hàng một cột hoặc một hàng nhiều cột. Mục đích của truy vấn con là trả về giá trị dùng làm điều kiện cho mệnh đề `WHERE`.
- Khi dùng trong mệnh đề `FROM`, nó thường trả về dữ liệu nhiều hàng nhiều cột, tương đương với việc trả về một bảng tạm thời — đúng với quy tắc phía sau `FROM` phải là một bảng. Cách này giúp thực hiện truy vấn liên kết nhiều bảng.

> Lưu ý: Cơ sở dữ liệu MySQL chỉ bắt đầu hỗ trợ truy vấn con từ phiên bản 4.1; các phiên bản trước đó không hỗ trợ.

Cú pháp cơ bản của truy vấn con dùng trong mệnh đề `WHERE` như sau:

```sql
select column_name [, column_name ]
from   table1 [, table2 ]
where  column_name operator
    (select column_name [, column_name ]
    from table1 [, table2 ]
    [where])
```

- Truy vấn con phải được đặt trong cặp dấu ngoặc tròn `( )`.
- `operator` biểu thị toán tử được sử dụng trong mệnh đề `WHERE`.

Cú pháp cơ bản của truy vấn con dùng trong mệnh đề `FROM` như sau:

```sql
select column_name [, column_name ]
from (select column_name [, column_name ]
      from table1 [, table2 ]
      [where]) as temp_table_name
where  condition
```

Kết quả trả về từ truy vấn con dùng trong `FROM` tương đương với một bảng tạm, nên cần sử dụng từ khóa `AS` để đặt tên (alias) cho bảng tạm đó.

**Truy vấn con lồng truy vấn con**

```sql
SELECT cust_name, cust_contact
FROM customers
WHERE cust_id IN (SELECT cust_id
                  FROM orders
                  WHERE order_num IN (SELECT order_num
                                      FROM orderitems
                                      WHERE prod_id = 'RGAN01'));
```

Truy vấn bên trong được thực thi trước truy vấn cha của nó để kết quả của truy vấn bên trong có thể truyền ra cho truy vấn bên ngoài. Bạn có thể tham khảo quá trình thực thi ở hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c439da1f5d4e4b00bdfa4316b933d764-tplv-k3u1fbpfcp-a64850d7.png)

### WHERE

- Mệnh đề `WHERE` được dùng để lọc bản ghi, tức thu hẹp phạm vi dữ liệu cần truy cập.
- Phía sau `WHERE` là một điều kiện trả về `true` hoặc `false`.
- `WHERE` có thể được sử dụng cùng với `SELECT`, `UPDATE` và `DELETE`.
- Các toán tử có thể sử dụng trong mệnh đề `WHERE`:

| Toán tử | Mô tả                                                                             |
| ------- | --------------------------------------------------------------------------------- |
| =       | Bằng                                                                              |
| <>      | Không bằng. Lưu ý: trong một số phiên bản SQL, toán tử này có thể được viết là != |
| >       | Lớn hơn                                                                           |
| <       | Nhỏ hơn                                                                           |
| >=      | Lớn hơn hoặc bằng                                                                 |
| <=      | Nhỏ hơn hoặc bằng                                                                 |
| BETWEEN | Nằm trong một khoảng giá trị nào đó                                               |
| LIKE    | Tìm kiếm theo một mẫu (pattern)                                                   |
| IN      | Chỉ định nhiều giá trị khả dĩ cho một cột                                         |

**Mệnh đề `WHERE` trong câu lệnh `SELECT`**

```ini
SELECT * FROM Customers
WHERE cust_name = 'Kids Place';
```

**Mệnh đề `WHERE` trong câu lệnh `UPDATE`**

```ini
UPDATE Customers
SET cust_name = 'Jack Jones'
WHERE cust_name = 'Kids Place';
```

**Mệnh đề `WHERE` trong câu lệnh `DELETE`**

```ini
DELETE FROM Customers
WHERE cust_name = 'Kids Place';
```

### IN và BETWEEN

- Toán tử `IN` dùng trong mệnh đề `WHERE`, có tác dụng khớp với bất kỳ giá trị nào trong danh sách các giá trị cụ thể được chỉ định.
- Toán tử `BETWEEN` dùng trong mệnh đề `WHERE`, có tác dụng chọn các giá trị nằm trong một khoảng nhất định.

**Ví dụ IN**

```sql
SELECT *
FROM products
WHERE vend_id IN ('DLL01', 'BRS01');
```

**Ví dụ BETWEEN**

```sql
SELECT *
FROM products
WHERE prod_price BETWEEN 3 AND 5;
```

### AND, OR, NOT

- `AND`, `OR`, `NOT` là các toán tử logic dùng để xử lý các điều kiện lọc.
- `AND` có độ ưu tiên cao hơn `OR`; để làm rõ thứ tự xử lý, có thể sử dụng `()`.
- Toán tử `AND` yêu cầu cả hai điều kiện bên trái và bên phải đều phải thỏa mãn.
- Toán tử `OR` chỉ cần một trong hai điều kiện bên trái hoặc bên phải thỏa mãn.
- Toán tử `NOT` dùng để phủ định một điều kiện.

**Ví dụ AND**

```sql
SELECT prod_id, prod_name, prod_price
FROM products
WHERE vend_id = 'DLL01' AND prod_price <= 4;
```

**Ví dụ OR**

```ini
SELECT prod_id, prod_name, prod_price
FROM products
WHERE vend_id = 'DLL01' OR vend_id = 'BRS01';
```

**Ví dụ NOT**

```sql
SELECT *
FROM products
WHERE prod_price NOT BETWEEN 3 AND 5;
```

### LIKE

- Toán tử `LIKE` được dùng trong mệnh đề `WHERE` để xác định xem một chuỗi có khớp với mẫu (pattern) hay không.
- Chỉ nên dùng `LIKE` khi cột chứa giá trị dạng văn bản (text).
- `LIKE` hỗ trợ hai ký tự đại diện (wildcard): `%` và `_`.
- Không nên lạm dụng ký tự đại diện; đặt ký tự đại diện ở đầu mẫu tìm kiếm sẽ khiến việc đối sánh rất chậm.
- `%` đại diện cho bất kỳ ký tự nào xuất hiện với số lần tùy ý.
- `_` đại diện cho một ký tự bất kỳ xuất hiện đúng một lần.

**Ví dụ %**

```sql
SELECT prod_id, prod_name, prod_price
FROM products
WHERE prod_name LIKE '%bean bag%';
```

**Ví dụ \_**

```sql
SELECT prod_id, prod_name, prod_price
FROM products
WHERE prod_name LIKE '__ inch teddy bear';
```

## Kết nối bảng (JOIN)

JOIN có nghĩa là "kết nối"; đúng như tên gọi, mệnh đề SQL `JOIN` dùng để liên kết hai hoặc nhiều bảng lại với nhau để truy vấn.

Khi kết nối bảng, ta cần chọn một trường ở mỗi bảng và so sánh giá trị của các trường đó; hai bản ghi có giá trị bằng nhau sẽ được gộp thành một hàng. **Bản chất của việc kết nối bảng là gộp các bản ghi từ những bảng khác nhau để tạo thành một bảng mới. Tất nhiên, bảng mới này chỉ là tạm thời và chỉ tồn tại trong suốt quá trình thực thi truy vấn hiện tại.**

Cú pháp cơ bản khi dùng `JOIN` để kết nối hai bảng như sau:

```sql
select table1.column1, table2.column2...
from table1
join table2
on table1.common_column1 = table2.common_column2;
```

`table1.common_column1 = table2.common_column2` là điều kiện kết nối; chỉ những bản ghi thỏa mãn điều kiện này mới được gộp thành một hàng. Bạn có thể sử dụng nhiều toán tử để kết nối bảng như `=`, `>`, `<`, `<>`, `<=`, `>=`, `!=`, `between`, `like` hoặc `not`, nhưng phổ biến nhất vẫn là dấu `=`.

Khi hai bảng có các trường trùng tên, để giúp database engine phân biệt trường đó thuộc bảng nào, khi viết tên trường trùng tên cần phải kèm theo tên bảng phía trước. Tất nhiên, nếu tên trường được viết là duy nhất trong cả hai bảng thì không cần dùng định dạng trên mà chỉ cần viết tên trường là đủ.

Ngoài ra, nếu tên cột liên kết ở hai bảng giống hệt nhau, bạn cũng có thể dùng mệnh đề `USING` thay thế cho `ON`, ví dụ:

```sql
# join....on
select c.cust_name, o.order_num
from Customers c
inner join Orders o
on c.cust_id = o.cust_id
order by c.cust_name;

# Nếu tên cột liên kết của hai bảng giống nhau, có thể dùng mệnh đề USING: join....using()
select c.cust_name, o.order_num
from Customers c
inner join Orders o
using(cust_id)
order by c.cust_name;
```

**Sự khác nhau giữa `ON` và `WHERE`**:

- Khi kết nối bảng, SQL sẽ tạo ra một bảng tạm mới dựa trên điều kiện kết nối. `ON` chính là điều kiện kết nối, quyết định việc tạo ra bảng tạm đó.
- `WHERE` thực hiện lọc dữ liệu trên bảng tạm sau khi bảng tạm đã được tạo ra để sinh tập kết quả cuối cùng; lúc này không còn `JOIN-ON` nữa.

Tóm lại: **SQL trước tiên dựa vào `ON` để tạo một bảng tạm, sau đó mới dựa vào `WHERE` để lọc bảng tạm đó**.

SQL cho phép thêm các từ khóa bổ nghĩa ở bên trái `JOIN` để tạo thành các kiểu kết nối khác nhau, như bảng dưới đây:

| Loại kết nối                              | Giải thích                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| INNER JOIN (Kết nối trong)                | (Kiểu kết nối mặc định) Chỉ trả về các hàng khi cả hai bảng đều có bản ghi thỏa mãn điều kiện.                              |
| LEFT JOIN / LEFT OUTER JOIN (Kết nối trái)| Trả về toàn bộ các hàng từ bảng bên trái, ngay cả khi bảng bên phải không có hàng nào thỏa mãn điều kiện.                   |
| RIGHT JOIN / RIGHT OUTER JOIN (Kết nối phải)| Trả về toàn bộ các hàng từ bảng bên phải, ngay cả khi bảng bên trái không có hàng nào thỏa mãn điều kiện.                  |
| FULL JOIN / FULL OUTER JOIN (Kết nối đầy đủ)| Chỉ cần một trong hai bảng có bản ghi thỏa mãn điều kiện là sẽ trả về hàng.                                                 |
| SELF JOIN                                 | Tự kết nối một bảng với chính nó như thể đó là hai bảng riêng biệt. Để phân biệt hai bảng, cần đặt bí danh cho ít nhất một bảng. |
| CROSS JOIN                                | Kết nối chéo, trả về tích Descartes (Cartesian product) của các tập bản ghi từ hai hay nhiều bảng được kết nối.             |

Hình dưới đây minh họa 7 cách sử dụng liên quan đến `LEFT JOIN`, `RIGHT JOIN`, `INNER JOIN` và `OUTER JOIN`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/701670942f0f45d3a3a2187cd04a12ad-tplv-k3u1fbpfcp-3d53f3fd.png)

Nếu không thêm bất kỳ từ khóa bổ nghĩa nào mà chỉ viết `JOIN`, mặc định sẽ hiểu là `INNER JOIN`.

Đối với `INNER JOIN`, còn có một cách viết ngầm định gọi là "**Implicit Inner Join (kết nối trong ngầm định)**", tức không dùng từ khóa `INNER JOIN` mà dùng mệnh đề `WHERE` để thực hiện chức năng của kết nối trong:

```sql
# Kết nối trong ngầm định (Implicit inner join)
select c.cust_name, o.order_num
from Customers c, Orders o
where c.cust_id = o.cust_id
order by c.cust_name;

# Kết nối trong tường minh (Explicit inner join)
select c.cust_name, o.order_num
from Customers c inner join Orders o
using(cust_id)
order by c.cust_name;
```

## Kết hợp truy vấn (UNION)

Toán tử `UNION` kết hợp kết quả của hai hay nhiều truy vấn và tạo ra một tập kết quả duy nhất chứa các hàng được trích xuất từ các truy vấn tham gia vào `UNION`.

Quy tắc cơ bản của `UNION`:

- Số lượng cột và thứ tự cột của tất cả các truy vấn phải giống nhau.
- Kiểu dữ liệu của các cột tương ứng trong mỗi truy vấn phải giống nhau hoặc tương thích với nhau.
- Tên cột trả về thường được lấy từ truy vấn đầu tiên.

Mặc định, toán tử `UNION` chỉ chọn các giá trị phân biệt (loại bỏ trùng lặp). Nếu cho phép giá trị trùng lặp, hãy sử dụng `UNION ALL`.

```sql
SELECT column_name(s) FROM table1
UNION ALL
SELECT column_name(s) FROM table2;
```

Tên cột trong tập kết quả của `UNION` luôn bằng tên cột trong câu lệnh `SELECT` đầu tiên của `UNION`.

`JOIN` vs `UNION`:

- Trong `JOIN`, các cột của những bảng được kết nối có thể khác nhau, nhưng trong `UNION`, số lượng cột và thứ tự cột của mọi truy vấn phải giống nhau.
- `UNION` đặt các hàng sau truy vấn nối tiếp nhau (xếp theo chiều dọc), còn `JOIN` đặt các cột sau truy vấn cạnh nhau (xếp theo chiều ngang), tức tạo thành một tích Descartes.

## Hàm trong SQL

Hàm của các hệ quản trị cơ sở dữ liệu khác nhau thường không giống nhau, do đó không có tính di động (portable). Phần này chủ yếu lấy các hàm của MySQL làm ví dụ.

### Xử lý chuỗi (Text Processing)

| Hàm                  | Giải thích                            |
| -------------------- | ------------------------------------- |
| `LEFT()`, `RIGHT()`  | Lấy các ký tự bên trái hoặc bên phải  |
| `LOWER()`, `UPPER()` | Chuyển thành chữ thường hoặc chữ hoa  |
| `LTRIM()`, `RTRIM()` | Loại bỏ khoảng trắng bên trái hoặc bên phải |
| `LENGTH()`           | Độ dài, tính theo byte                |
| `SOUNDEX()`          | Chuyển đổi thành giá trị ngữ âm       |

Trong đó, **`SOUNDEX()`** có thể chuyển đổi một chuỗi thành mẫu chữ-số mô tả biểu diễn ngữ âm của chuỗi đó.

```sql
SELECT *
FROM mytable
WHERE SOUNDEX(col1) = SOUNDEX('apple')
```

### Xử lý ngày và giờ

- Định dạng ngày: `YYYY-MM-DD`
- Định dạng giờ: `HH:MM:SS`

| Hàm             | Giải thích                                              |
| --------------- | ------------------------------------------------------- |
| `AddDate()`     | Cộng thêm một khoảng thời gian vào ngày (ngày, tuần,...) |
| `AddTime()`     | Cộng thêm một khoảng thời gian vào giờ (giờ, phút,...)  |
| `CurDate()`     | Trả về ngày hiện tại                                    |
| `CurTime()`     | Trả về giờ hiện tại                                     |
| `Date()`        | Trả về phần ngày của giá trị ngày-giờ                   |
| `DateDiff()`    | Tính hiệu giữa hai ngày                                 |
| `Date_Add()`    | Hàm tính toán ngày tháng rất linh hoạt                  |
| `Date_Format()` | Trả về chuỗi ngày hoặc giờ đã được định dạng            |
| `Day()`         | Trả về phần ngày trong tháng của một ngày               |
| `DayOfWeek()`   | Trả về thứ trong tuần tương ứng của một ngày            |
| `Hour()`        | Trả về phần giờ của một thời điểm                       |
| `Minute()`      | Trả về phần phút của một thời điểm                      |
| `Month()`       | Trả về phần tháng của một ngày                          |
| `Now()`         | Trả về ngày và giờ hiện tại                             |
| `Second()`      | Trả về phần giây của một thời điểm                      |
| `Time()`        | Trả về phần giờ của giá trị ngày-giờ                    |
| `Year()`        | Trả về phần năm của một ngày                            |

### Xử lý số học

| Hàm    | Giải thích        |
| ------ | ----------------- |
| SIN()  | Sin               |
| COS()  | Cosin             |
| TAN()  | Tang              |
| ABS()  | Giá trị tuyệt đối |
| SQRT() | Căn bậc hai       |
| MOD()  | Phần dư (modulo)  |
| EXP()  | Lũy thừa cơ số e  |
| PI()   | Số Pi             |
| RAND() | Số ngẫu nhiên     |

### Hàm tổng hợp (Aggregate Functions)

| Hàm       | Giải thích                                 |
| --------- | ------------------------------------------ |
| `AVG()`   | Trả về giá trị trung bình của một cột      |
| `COUNT()` | Trả về số lượng hàng của một cột           |
| `MAX()`   | Trả về giá trị lớn nhất của một cột        |
| `MIN()`   | Trả về giá trị nhỏ nhất của một cột        |
| `SUM()`   | Trả về tổng các giá trị của một cột        |

`AVG()` sẽ bỏ qua các hàng có giá trị `NULL`.

Sử dụng `DISTINCT` giúp hàm tổng hợp chỉ tính trên các giá trị phân biệt.

```sql
SELECT AVG(DISTINCT col1) AS avg_col
FROM mytable
```

**Tiếp theo, chúng ta sẽ tìm hiểu cách dùng câu lệnh DDL. Chức năng chính của DDL là định nghĩa các đối tượng cơ sở dữ liệu (như: database, table, view, index,...).**

## Định nghĩa dữ liệu (DDL)

### Cơ sở dữ liệu (DATABASE)

#### Tạo cơ sở dữ liệu

```sql
CREATE DATABASE test;
```

#### Xóa cơ sở dữ liệu

```sql
DROP DATABASE test;
```

#### Chọn cơ sở dữ liệu

```sql
USE test;
```

### Bảng dữ liệu (TABLE)

#### Tạo bảng

**Tạo bảng thông thường**

```sql
CREATE TABLE user (
  id int(10) unsigned NOT NULL COMMENT 'Id',
  username varchar(64) NOT NULL DEFAULT 'default' COMMENT 'Tên người dùng',
  password varchar(64) NOT NULL DEFAULT 'default' COMMENT 'Mật khẩu',
  email varchar(64) NOT NULL DEFAULT 'default' COMMENT 'Email'
) COMMENT='Bảng người dùng';
```

**Tạo bảng mới từ bảng đã có**

```sql
CREATE TABLE vip_user AS
SELECT * FROM user;
```

#### Xóa bảng

```sql
DROP TABLE user;
```

#### Chỉnh sửa bảng

**Thêm cột**

```sql
ALTER TABLE user
ADD age int(3);
```

**Xóa cột**

```sql
ALTER TABLE user
DROP COLUMN age;
```

**Sửa đổi cột**

```sql
ALTER TABLE `user`
MODIFY COLUMN age tinyint;
```

**Thêm khóa chính**

```sql
ALTER TABLE user
ADD PRIMARY KEY (id);
```

**Xóa khóa chính**

```sql
ALTER TABLE user
DROP PRIMARY KEY;
```

### View (Khung nhìn)

Định nghĩa:

- View là một bảng trực quan ảo dựa trên tập kết quả của một câu lệnh SQL.
- View là bảng ảo, bản thân nó không chứa dữ liệu nên không thể thao tác tạo index trực tiếp trên nó. Các thao tác trên View cũng tương tự như thao tác trên bảng thông thường.

Công dụng:

- Đơn giản hóa các thao tác SQL phức tạp, chẳng hạn các phép kết nối (join) phức tạp;
- Chỉ sử dụng một phần dữ liệu của bảng thực tế;
- Đảm bảo an toàn dữ liệu bằng cách chỉ cấp cho người dùng quyền truy cập vào View;
- Thay đổi định dạng và cách biểu diễn dữ liệu.

![MySQL View](/media/jg/ext/oss.javaguide.cn/p3-juejin/ec4c975296ea4a7097879dac7c353878-tplv-k3u1fbpfcp-70171dfb.jpg)

#### Tạo View

```sql
CREATE VIEW top_10_user_view AS
SELECT id, username
FROM user
WHERE id < 10;
```

#### Xóa View

```sql
DROP VIEW top_10_user_view;
```

### Index (Chỉ mục)

**Index (chỉ mục) là một cấu trúc dữ liệu dùng để truy vấn và tìm kiếm dữ liệu nhanh chóng; về bản chất có thể xem nó như một cấu trúc dữ liệu đã được sắp xếp.**

Vai trò của index tương tự như mục lục của một cuốn sách. Ví dụ: khi tra từ điển mà không có mục lục, chúng ta chỉ có thể lật từng trang một để tìm chữ cần tra, tốc độ rất chậm. Khi có mục lục rồi, chúng ta chỉ cần tìm vị trí chữ trong mục lục rồi lật thẳng tới trang đó là xong.

**Ưu điểm**:

- Sử dụng index giúp tăng tốc độ truy xuất dữ liệu lên rất nhiều (giảm đáng kể lượng dữ liệu cần quét), đây là lý do chính để tạo index.
- Thông qua việc tạo unique index (chỉ mục duy nhất), có thể đảm bảo tính duy nhất của từng dòng dữ liệu trong bảng cơ sở dữ liệu.

**Nhược điểm**:

- Việc tạo và duy trì index tiêu tốn nhiều thời gian. Khi thêm, sửa, xóa dữ liệu trong bảng, nếu dữ liệu có index thì index cũng cần được cập nhật động theo, làm giảm hiệu năng thực thi SQL.
- Index cần được lưu trữ bằng tệp vật lý, nên cũng tiêu tốn một lượng không gian đĩa nhất định.

Tuy nhiên, **việc dùng index có chắc chắn nâng cao hiệu năng truy vấn không?**

Trong đa số trường hợp, truy vấn qua index nhanh hơn quét toàn bộ bảng (full table scan). Nhưng nếu lượng dữ liệu trong cơ sở dữ liệu không lớn, việc dùng index chưa chắc đã mang lại mức cải thiện đáng kể.

Để tìm hiểu chi tiết về index, hãy xem bài viết [Giải thích chi tiết về MySQL Index](https://javaguide.cn/database/mysql/mysql-index.html).

#### Tạo Index

```sql
CREATE INDEX user_index
ON user (id);
```

#### Thêm Index

```sql
ALTER table user ADD INDEX user_index(id)
```

#### Tạo Unique Index

```sql
CREATE UNIQUE INDEX user_index
ON user (id);
```

#### Xóa Index

```sql
ALTER TABLE user
DROP INDEX user_index;
```

### Ràng buộc (Constraints)

Ràng buộc SQL (Constraint) được dùng để quy định các quy tắc đối với dữ liệu trong bảng.

Nếu có hành vi dữ liệu nào vi phạm ràng buộc, hành vi đó sẽ bị ràng buộc chặn lại.

Ràng buộc có thể được quy định khi tạo bảng (qua câu lệnh `CREATE TABLE`), hoặc sau khi bảng đã được tạo (qua câu lệnh `ALTER TABLE`).

Các loại ràng buộc:

- `NOT NULL` - Chỉ định một cột không được lưu giá trị `NULL`.
- `UNIQUE` - Đảm bảo mọi hàng trong một cột phải có giá trị duy nhất.
- `PRIMARY KEY` - Sự kết hợp của `NOT NULL` và `UNIQUE`. Đảm bảo một cột (hoặc kết hợp từ hai hay nhiều cột) có định danh duy nhất, giúp tìm một bản ghi cụ thể trong bảng dễ dàng và nhanh chóng hơn.
- `FOREIGN KEY` - Đảm bảo tính toàn vẹn tham chiếu để dữ liệu trong một bảng khớp với giá trị trong bảng khác.
- `CHECK` - Đảm bảo giá trị trong cột thỏa mãn điều kiện được chỉ định.
- `DEFAULT` - Quy định giá trị mặc định khi cột không được gán giá trị.

Sử dụng các điều kiện ràng buộc khi tạo bảng:

```sql
CREATE TABLE Users (
  Id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID tự tăng',
  Username VARCHAR(64) NOT NULL UNIQUE DEFAULT 'default' COMMENT 'Tên người dùng',
  Password VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT 'Mật khẩu',
  Email VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT 'Địa chỉ email',
  Enabled TINYINT(4) DEFAULT NULL COMMENT 'Còn hiệu lực hay không',
  PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='Bảng người dùng';
```

**Tiếp theo, chúng ta sẽ tìm hiểu cách dùng câu lệnh TCL. Chức năng chính của TCL là quản lý transaction trong cơ sở dữ liệu.**

## Xử lý giao dịch (Transaction)

Không thể rollback câu lệnh `SELECT`, việc rollback câu lệnh `SELECT` cũng không có ý nghĩa; cũng không thể rollback câu lệnh `CREATE` và `DROP`.

**MySQL mặc định sử dụng cơ chế commit ngầm định (implicit commit)**, tức mỗi khi thực thi một câu lệnh, MySQL coi câu lệnh đó là một transaction và tự động commit. Khi xuất hiện câu lệnh `START TRANSACTION`, cơ chế commit ngầm định sẽ bị tắt; sau khi câu lệnh `COMMIT` hoặc `ROLLBACK` được thực thi, transaction sẽ tự động kết thúc và khôi phục lại cơ chế commit ngầm định.

Thông qua `set autocommit=0`, ta có thể tắt tự động commit cho đến khi chạy `set autocommit=1` mới commit; cờ `autocommit` áp dụng theo từng kết nối (connection) chứ không áp dụng chung cho toàn server.

Các lệnh:

- `START TRANSACTION` - Lệnh dùng để đánh dấu điểm bắt đầu của transaction.
- `SAVEPOINT` - Lệnh dùng để tạo điểm lưu (savepoint).
- `ROLLBACK TO` - Lệnh dùng để rollback về điểm lưu chỉ định; nếu không thiết lập điểm lưu, sẽ rollback về vị trí câu lệnh `START TRANSACTION`.
- `COMMIT` - Commit (xác nhận hoàn tất) transaction.

```sql
-- Bắt đầu transaction
START TRANSACTION;

-- Thao tác chèn A
INSERT INTO `user`
VALUES (1, 'root1', 'root1', 'xxxx@163.com');

-- Tạo savepoint updateA
SAVEPOINT updateA;

-- Thao tác chèn B
INSERT INTO `user`
VALUES (2, 'root2', 'root2', 'xxxx@163.com');

-- Rollback về savepoint updateA
ROLLBACK TO updateA;

-- Commit transaction, chỉ thao tác A có hiệu lực
COMMIT;
```

**Tiếp theo, chúng ta sẽ tìm hiểu cách dùng câu lệnh DCL. Chức năng chính của DCL là kiểm soát quyền truy cập của người dùng.**

## Kiểm soát quyền truy cập (DCL)

Để cấp quyền cho tài khoản người dùng, có thể dùng lệnh `GRANT`. Để thu hồi quyền của người dùng, có thể dùng lệnh `REVOKE`. Dưới đây lấy MySQL làm ví dụ để giới thiệu ứng dụng thực tế của kiểm soát quyền.

Cú pháp cấp quyền `GRANT`:

```sql
GRANT privilege,[privilege],.. ON privilege_level
TO user [IDENTIFIED BY password]
[REQUIRE tsl_option]
[WITH [GRANT_OPTION | resource_option]];
```

Giải thích ngắn gọn:

1. Chỉ định một hoặc nhiều quyền sau từ khóa `GRANT`. Nếu cấp nhiều quyền cho người dùng, mỗi quyền được phân tách bằng dấu phẩy.
2. `ON privilege_level` xác định cấp độ áp dụng quyền. MySQL hỗ trợ các cấp độ global (`*.*`), database (`database.*`), table (`database.table`) và cấp độ cột. Nếu dùng quyền cấp độ cột, bạn phải chỉ định một cột hoặc danh sách cột phân tách bằng dấu phẩy sau mỗi quyền.
3. `user` là người dùng được cấp quyền. Nếu người dùng đã tồn tại, câu lệnh `GRANT` sẽ sửa đổi quyền của họ; ngược lại, câu lệnh `GRANT` sẽ tạo một người dùng mới. Mệnh đề tùy chọn `IDENTIFIED BY` cho phép bạn đặt mật khẩu mới cho người dùng.
4. `REQUIRE tsl_option` chỉ định liệu người dùng có bắt buộc phải kết nối đến máy chủ cơ sở dữ liệu thông qua kết nối bảo mật như SSL, X059 hay không.
5. Mệnh đề tùy chọn `WITH GRANT OPTION` cho phép bạn cấp quyền mình đang có cho người dùng khác hoặc thu hồi từ người dùng khác. Ngoài ra, bạn có thể dùng mệnh đề `WITH` để phân bổ tài nguyên máy chủ MySQL, chẳng hạn đặt số kết nối hoặc số câu lệnh tối đa người dùng có thể thực thi mỗi giờ. Điều này rất hữu ích trong các môi trường chia sẻ như MySQL shared hosting.

Cú pháp thu hồi quyền `REVOKE`:

```sql
REVOKE   privilege_type [(column_list)]
        [, priv_type [(column_list)]]...
ON [object_type] privilege_level
FROM user [, user]...
```

Giải thích ngắn gọn:

1. Sau từ khóa `REVOKE`, chỉ định danh sách các quyền cần thu hồi từ người dùng. Bạn cần phân tách các quyền bằng dấu phẩy.
2. Chỉ định cấp độ đặc quyền cần thu hồi trong mệnh đề `ON`.
3. Chỉ định tài khoản người dùng bị thu hồi quyền trong mệnh đề `FROM`.

`GRANT` và `REVOKE` có thể kiểm soát quyền truy cập ở nhiều cấp độ:

- Toàn bộ server, dùng `GRANT ALL` và `REVOKE ALL`;
- Toàn bộ database, dùng `ON database.*`;
- Một bảng cụ thể, dùng `ON database.table`;
- Các cột cụ thể;
- Các Stored Procedure cụ thể.

Tài khoản mới được tạo chưa có bất kỳ quyền nào. Tài khoản được định nghĩa theo dạng `username@host`, trong đó `username@%` sử dụng tên host mặc định. Thông tin tài khoản của MySQL được lưu trong cơ sở dữ liệu `mysql`.

```sql
USE mysql;
SELECT user FROM user;
```

Bảng dưới đây mô tả tất cả các đặc quyền được phép dùng trong câu lệnh `GRANT` và `REVOKE`:

| **Đặc quyền**           | **Mô tả**                                                                                                                    | **Cấp độ** |              |          |         |             |           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------ | -------- | ------- | ----------- | --------- |
|                         |                                                                                                                              | **Global** | **Database** | **Table**| **Column**| **Routine** | **Proxy** |
| ALL [PRIVILEGES]        | Cấp toàn bộ các quyền ở cấp độ truy cập được chỉ định ngoại trừ `GRANT OPTION`                                               |            |              |          |         |             |           |
| ALTER                   | Cho phép người dùng sử dụng câu lệnh `ALTER TABLE`                                                                           | X          | X            | X        |         |             |           |
| ALTER ROUTINE           | Cho phép người dùng thay đổi hoặc xóa các stored routine                                                                     | X          | X            |          |         | X           |           |
| CREATE                  | Cho phép người dùng tạo cơ sở dữ liệu và bảng                                                                                | X          | X            | X        |         |             |           |
| CREATE ROUTINE          | Cho phép người dùng tạo các stored routine                                                                                   | X          | X            |          |         |             |           |
| CREATE TABLESPACE       | Cho phép người dùng tạo, sửa đổi hoặc xóa tablespace và nhóm tệp log                                                         | X          |              |          |         |             |           |
| CREATE TEMPORARY TABLES | Cho phép người dùng sử dụng `CREATE TEMPORARY TABLE` để tạo bảng tạm                                                         | X          | X            |          |         |             |           |
| CREATE USER             | Cho phép người dùng sử dụng các câu lệnh `CREATE USER`, `DROP USER`, `RENAME USER` và `REVOKE ALL PRIVILEGES`.               | X          |              |          |         |             |           |
| CREATE VIEW             | Cho phép người dùng tạo hoặc sửa đổi View.                                                                                   | X          | X            | X        |         |             |           |
| DELETE                  | Cho phép người dùng sử dụng `DELETE`                                                                                         | X          | X            | X        |         |             |           |
| DROP                    | Cho phép người dùng xóa cơ sở dữ liệu, bảng và View                                                                          | X          | X            | X        |         |             |           |
| EVENT                   | Bật việc sử dụng sự kiện cho Event Scheduler.                                                                                | X          | X            |          |         |             |           |
| EXECUTE                 | Cho phép người dùng thực thi các stored routine                                                                              | X          | X            | X        |         |             |           |
| FILE                    | Cho phép người dùng đọc bất kỳ tệp nào trong thư mục cơ sở dữ liệu.                                                          | X          |              |          |         |             |           |
| GRANT OPTION            | Cho phép người dùng có quyền cấp hoặc thu hồi quyền của các tài khoản khác.                                                  | X          | X            | X        |         | X           | X         |
| INDEX                   | Cho phép người dùng tạo hoặc xóa index.                                                                                      | X          | X            | X        |         |             |           |
| INSERT                  | Cho phép người dùng sử dụng câu lệnh `INSERT`                                                                                | X          | X            | X        | X       |             |           |
| LOCK TABLES             | Cho phép người dùng sử dụng `LOCK TABLES` trên các bảng mà họ có quyền `SELECT`                                              | X          | X            |          |         |             |           |
| PROCESS                 | Cho phép người dùng xem tất cả các tiến trình bằng câu lệnh `SHOW PROCESSLIST`.                                              | X          |              |          |         |             |           |
| PROXY                   | Bật tính năng user proxy.                                                                                                    |            |              |          |         |             |           |
| REFERENCES              | Cho phép người dùng tạo khóa ngoại (foreign key)                                                                             | X          | X            | X        | X       |             |           |
| RELOAD                  | Cho phép người dùng sử dụng các thao tác `FLUSH`                                                                             | X          |              |          |         |             |           |
| REPLICATION CLIENT      | Cho phép người dùng truy vấn để xem vị trí của máy chủ master hoặc slave                                                     | X          |              |          |         |             |           |
| REPLICATION SLAVE       | Cho phép replica slave đọc các sự kiện binary log từ máy chủ master.                                                         | X          |              |          |         |             |           |
| SELECT                  | Cho phép người dùng sử dụng câu lệnh `SELECT`                                                                                | X          | X            | X        | X       |             |           |
| SHOW DATABASES          | Cho phép người dùng hiển thị tất cả các cơ sở dữ liệu                                                                        | X          |              |          |         |             |           |
| SHOW VIEW               | Cho phép người dùng sử dụng câu lệnh `SHOW CREATE VIEW`                                                                      | X          | X            | X        |         |             |           |
| SHUTDOWN                | Cho phép người dùng sử dụng lệnh `mysqladmin shutdown`                                                                       | X          |              |          |         |             |           |
| SUPER                   | Cho phép người dùng sử dụng các thao tác quản trị khác, như `CHANGE MASTER TO`, `KILL`, `PURGE BINARY LOGS`, `SET GLOBAL` và các lệnh `mysqladmin` | X | | | | | |
| TRIGGER                 | Cho phép người dùng sử dụng các thao tác `TRIGGER`.                                                                          | X          | X            | X        |         |             |           |
| UPDATE                  | Cho phép người dùng sử dụng câu lệnh `UPDATE`                                                                                | X          | X            | X        | X       |             |           |
| USAGE                   | Tương đương với "không có đặc quyền"                                                                                         |            |              |          |         |             |           |

### Tạo tài khoản

```sql
CREATE USER myuser IDENTIFIED BY 'mypassword';
```

### Đổi tên tài khoản

```sql
UPDATE user SET user='newuser' WHERE user='myuser';
FLUSH PRIVILEGES;
```

### Xóa tài khoản

```sql
DROP USER myuser;
```

### Xem quyền

```sql
SHOW GRANTS FOR myuser;
```

### Cấp quyền

```sql
GRANT SELECT, INSERT ON *.* TO myuser;
```

### Thu hồi quyền

```sql
REVOKE SELECT, INSERT ON *.* FROM myuser;
```

### Đổi mật khẩu

```sql
SET PASSWORD FOR myuser = 'mypass';
```

## Stored Procedure (Thủ tục lưu trữ)

Stored Procedure có thể được xem như một lô xử lý (batch) gồm một chuỗi các thao tác SQL. Stored Procedure có thể được gọi từ Trigger, từ các Stored Procedure khác cũng như từ các ứng dụng viết bằng Java, Python, PHP,...

![MySQL Stored Procedure](/media/jg/ext/oss.javaguide.cn/p3-juejin/60afdc9c9a594f079727ec64a2e698a3-tplv-k3u1fbpfcp-ade90deb.jpg)

Lợi ích khi sử dụng Stored Procedure:

- Đóng gói mã nguồn, đảm bảo một mức độ bảo mật nhất định;
- Tái sử dụng mã nguồn;
- Do đã được biên dịch trước nên có hiệu năng cao.

Tạo Stored Procedure:

- Khi tạo Stored Procedure trên dòng lệnh (command line), cần tự định nghĩa dấu phân tách (delimiter), vì dòng lệnh lấy `;` làm ký hiệu kết thúc câu lệnh, trong khi bên trong Stored Procedure cũng chứa dấu chấm phẩy nên sẽ bị hiểu nhầm là ký hiệu kết thúc và gây lỗi cú pháp.
- Bao gồm ba loại tham số: `in`, `out` và `inout`.
- Việc gán giá trị cho biến cần dùng câu lệnh `select into`.
- Mỗi lần chỉ có thể gán giá trị cho một biến, không hỗ trợ thao tác theo tập hợp.

Cần lưu ý rằng: **Sổ tay Phát triển Java của Alibaba (*Java Development Manual*) nghiêm cấm sử dụng Stored Procedure, vì Stored Procedure khó gỡ lỗi (debug) và khó mở rộng, đồng thời không có tính di động.**

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/93a5e011ade4450ebfa5d82057532a49-tplv-k3u1fbpfcp-14aedce4.png)

Còn việc có nên sử dụng trong dự án hay không thì vẫn phải căn cứ vào nhu cầu thực tế của dự án, cân nhắc kỹ mặt lợi và mặt hại là được!

### Tạo Stored Procedure

```sql
DROP PROCEDURE IF EXISTS `proc_adder`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_adder`(IN a int, IN b int, OUT sum int)
BEGIN
    DECLARE c int;
    if a is null then set a = 0;
    end if;

    if b is null then set b = 0;
    end if;

    set sum  = a + b;
END
;;
DELIMITER ;
```

### Sử dụng Stored Procedure

```less
set @b=5;
call proc_adder(2,@b,@s);
select @s as sum;
```

## Cursor (Con trỏ)

Cursor (con trỏ) là một truy vấn cơ sở dữ liệu được lưu trữ trên máy chủ DBMS; nó không phải là một câu lệnh `SELECT`, mà là tập kết quả được truy xuất bởi câu lệnh đó.

Sử dụng Cursor trong Stored Procedure cho phép duyệt qua từng dòng trong một tập kết quả.

Cursor chủ yếu được dùng trong các ứng dụng tương tác, nơi người dùng cần cuộn qua dữ liệu trên màn hình để duyệt hoặc thực hiện thay đổi trên dữ liệu đó.

Các bước rõ ràng khi sử dụng Cursor:

- Trước khi sử dụng Cursor, bạn phải khai báo (định nghĩa) nó. Quá trình này thực tế chưa truy xuất dữ liệu, mà chỉ định nghĩa câu lệnh `SELECT` và các tùy chọn Cursor sẽ dùng.

- Một khi đã khai báo, phải mở Cursor để sử dụng. Quá trình này dùng câu lệnh `SELECT` đã định nghĩa trước đó để thực sự truy xuất dữ liệu.

- Đối với Cursor đã có dữ liệu, lấy (truy xuất) từng hàng theo nhu cầu.

- Khi kết thúc sử dụng Cursor, phải đóng Cursor và nếu có thể thì giải phóng Cursor (tùy thuộc vào DBMS cụ thể).

```sql
DELIMITER $
CREATE  PROCEDURE getTotal()
BEGIN
    DECLARE total INT;
    -- Tạo các biến nhận dữ liệu từ cursor
    DECLARE sid INT;
    DECLARE sname VARCHAR(10);
    -- Tạo biến tổng số
    DECLARE sage INT;
    -- Tạo biến cờ kết thúc
    DECLARE done INT DEFAULT false;
    -- Tạo cursor
    DECLARE cur CURSOR FOR SELECT id,name,age from cursor_table where age>30;
    -- Chỉ định giá trị xử lý khi vòng lặp cursor kết thúc
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = true;
    SET total = 0;
    OPEN cur;
    FETCH cur INTO sid, sname, sage;
    WHILE(NOT done)
    DO
        SET total = total + 1;
        FETCH cur INTO sid, sname, sage;
    END WHILE;

    CLOSE cur;
    SELECT total;
END $
DELIMITER ;

-- Gọi stored procedure
call getTotal();
```

## Trigger

Trigger là một đối tượng cơ sở dữ liệu gắn với các thao tác trên bảng; khi một sự kiện chỉ định xảy ra trên bảng chứa Trigger, đối tượng này sẽ được gọi — tức thao tác trên bảng sẽ kích hoạt việc thực thi Trigger gắn với bảng đó.

Chúng ta có thể sử dụng Trigger để theo dõi kiểm toán (audit trail), ghi lại các thay đổi vào một bảng khác.

Ưu điểm khi sử dụng Trigger:

- SQL Trigger cung cấp thêm một cách thức để kiểm tra tính toàn vẹn dữ liệu.
- SQL Trigger có thể bắt các lỗi trong logic nghiệp vụ ở tầng cơ sở dữ liệu.
- SQL Trigger cung cấp một cách thức khác để chạy các tác vụ định kỳ. Khi dùng SQL Trigger, bạn không cần chờ tác vụ định kỳ chạy vì Trigger sẽ tự động được gọi trước hoặc sau khi dữ liệu trong bảng thay đổi.
- SQL Trigger rất hữu ích cho việc kiểm toán (audit) các thay đổi dữ liệu trong bảng.

Nhược điểm khi sử dụng Trigger:

- SQL Trigger chỉ có thể cung cấp lớp kiểm tra mở rộng chứ không thể thay thế toàn bộ việc xác thực dữ liệu. Một số bước xác thực đơn giản vẫn phải thực hiện ở tầng ứng dụng. Ví dụ: bạn có thể dùng JavaScript để xác thực đầu vào của người dùng ở phía client, hoặc dùng ngôn ngữ script phía server (như JSP, PHP, ASP.NET, Perl) để xác thực ở phía server.
- Việc gọi và thực thi SQL Trigger là vô hình đối với ứng dụng phía client, do đó rất khó nắm bắt những gì đã xảy ra ở tầng cơ sở dữ liệu.
- SQL Trigger có thể làm tăng chi phí tải cho máy chủ cơ sở dữ liệu.

MySQL không cho phép sử dụng câu lệnh `CALL` bên trong Trigger, tức là không thể gọi Stored Procedure từ Trigger.

> Lưu ý: Trong MySQL, dấu chấm phẩy `;` là ký hiệu kết thúc câu lệnh; khi gặp dấu chấm phẩy nghĩa là đoạn lệnh đó đã kết thúc và MySQL có thể bắt đầu thực thi. Do đó, trình thông dịch khi gặp dấu chấm phẩy bên trong phần hành động của Trigger sẽ thực thi ngay lập tức rồi báo lỗi vì chưa tìm thấy `END` khớp với `BEGIN`.
>
> Lúc này cần dùng lệnh `DELIMITER` (`DELIMITER` nghĩa là dấu định giới, dấu phân tách). Đây là một lệnh không cần ký hiệu kết thúc câu lệnh, có cú pháp `DELIMITER new_delimiter`. `new_delimiter` có thể đặt là ký hiệu dài 1 hoặc nhiều ký tự; mặc định là dấu chấm phẩy `;`, ta có thể đổi sang ký hiệu khác như `$` bằng `DELIMITER $`. Các câu lệnh sau đó kết thúc bằng dấu chấm phẩy sẽ không làm trình thông dịch phản ứng, chỉ khi gặp `$` mới được coi là kết thúc câu lệnh. Lưu ý rằng sau khi dùng xong, chúng ta vẫn cần nhớ đổi lại về mặc định.

Trước phiên bản MySQL 5.7.2, mỗi bảng chỉ có thể định nghĩa tối đa sáu Trigger:

- `BEFORE INSERT` - Kích hoạt trước khi chèn dữ liệu vào bảng.
- `AFTER INSERT` - Kích hoạt sau khi chèn dữ liệu vào bảng.
- `BEFORE UPDATE` - Kích hoạt trước khi cập nhật dữ liệu trong bảng.
- `AFTER UPDATE` - Kích hoạt sau khi cập nhật dữ liệu trong bảng.
- `BEFORE DELETE` - Kích hoạt trước khi xóa dữ liệu khỏi bảng.
- `AFTER DELETE` - Kích hoạt sau khi xóa dữ liệu khỏi bảng.

Tuy nhiên, bắt đầu từ MySQL phiên bản 5.7.2+, có thể định nghĩa nhiều Trigger cho cùng một sự kiện kích hoạt và cùng một thời điểm thao tác.

**`NEW` và `OLD`**:

- Trong MySQL có định nghĩa hai từ khóa `NEW` và `OLD` dùng để biểu diễn hàng dữ liệu đã kích hoạt Trigger trong bảng chứa Trigger.
- Trong Trigger kiểu `INSERT`, `NEW` dùng để biểu diễn dữ liệu mới sắp được chèn (`BEFORE`) hoặc đã được chèn (`AFTER`);
- Trong Trigger kiểu `UPDATE`, `OLD` dùng để biểu diễn dữ liệu gốc sắp hoặc đã bị sửa, còn `NEW` dùng để biểu diễn dữ liệu mới sắp hoặc đã được cập nhật thành;
- Trong Trigger kiểu `DELETE`, `OLD` dùng để biểu diễn dữ liệu gốc sắp hoặc đã bị xóa;
- Cách sử dụng: `NEW.columnName` (`columnName` là tên một cột tương ứng trong bảng dữ liệu).

### Tạo Trigger

> Gợi ý: Để nắm được các điểm cốt lõi của Trigger, bạn nên tìm hiểu trước lệnh tạo Trigger.

Lệnh `CREATE TRIGGER` được dùng để tạo Trigger.

Cú pháp:

```sql
CREATE TRIGGER trigger_name
trigger_time
trigger_event
ON table_name
FOR EACH ROW
BEGIN
  trigger_statements
END;
```

Giải thích:

- `trigger_name`: Tên của Trigger
- `trigger_time`: Thời điểm kích hoạt Trigger. Nhận giá trị `BEFORE` hoặc `AFTER`.
- `trigger_event`: Sự kiện lắng nghe của Trigger. Nhận giá trị `INSERT`, `UPDATE` hoặc `DELETE`.
- `table_name`: Bảng mục tiêu được Trigger giám sát. Chỉ định tạo Trigger trên bảng nào.
- `FOR EACH ROW`: Giám sát ở cấp độ từng hàng, cú pháp cố định của MySQL (khác với các DBMS khác).
- `trigger_statements`: Hành động thực thi của Trigger. Là danh sách gồm một hoặc nhiều câu lệnh SQL, mỗi câu lệnh trong danh sách đều phải kết thúc bằng dấu chấm phẩy `;`.

Khi điều kiện kích hoạt của Trigger được thỏa mãn, các câu lệnh thực thi của Trigger nằm giữa `BEGIN` và `END` sẽ được thực thi.

Ví dụ:

```sql
DELIMITER $
CREATE TRIGGER `trigger_insert_user`
AFTER INSERT ON `user`
FOR EACH ROW
BEGIN
    INSERT INTO `user_history`(user_id, operate_type, operate_time)
    VALUES (NEW.id, 'add a user',  now());
END $
DELIMITER ;
```

### Xem Trigger

```sql
SHOW TRIGGERS;
```

### Xóa Trigger

```sql
DROP TRIGGER IF EXISTS trigger_insert_user;
```

## Bài viết tham khảo thêm

- [Dành cho lập trình viên Backend: Hướng dẫn tối ưu hiệu năng SQL cao! Nắm ngay 35+ lời khuyên tối ưu!](https://mp.weixin.qq.com/s/I-ZT3zGTNBZ6egS7T09jyQ)
- [Dành cho lập trình viên Backend: 30 lời khuyên để viết SQL chất lượng cao](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486461&idx=1&sn=60a22279196d084cc398936fe3b37772&chksm=cea24436f9d5cd20a4fa0e907590f3e700d7378b3f608d7b33bb52cfb96f503b7ccb65a1deed&token=1987003517&lang=zh_CN#rd)
