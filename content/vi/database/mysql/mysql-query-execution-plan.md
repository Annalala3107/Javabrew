---
title: "Phân tích kế hoạch thực thi truy vấn MySQL (EXPLAIN)"
description: "Giải thích chi tiết ý nghĩa các cột trong kế hoạch thực thi EXPLAIN của MySQL, bao gồm các trường quan trọng như id, select_type, type, key, rows, Extra, giúp bạn phân tích điểm nghẽn hiệu năng SQL và tối ưu có trọng tâm."
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: Kế hoạch thực thi MySQL,EXPLAIN,Query Optimizer,Phân tích hiệu năng SQL,Trúng chỉ mục,Kiểu truy cập type,Cột Extra,Tối ưu truy vấn chậm
lang: vi
sourceRef: zh-ref/database/mysql/mysql-query-execution-plan.md
---

Bước đầu tiên để tối ưu SQL chính là đọc hiểu kế hoạch thực thi (Execution Plan) của câu lệnh SQL. Trong bài viết này, chúng ta hãy cùng tìm hiểu các kiến thức liên quan đến kế hoạch thực thi `EXPLAIN` của MySQL.

> **Lưu ý về phiên bản**: Nội dung bài viết dựa trên MySQL 5.7+ và 8.0+. Hai cột `filtered` và `partitions` khả dụng từ MySQL 5.7+, còn `EXPLAIN ANALYZE` và Hash Join lần lượt yêu cầu MySQL 8.0.18+ và 8.0.20+.

## Kế hoạch thực thi là gì?

**Kế hoạch thực thi (Execution Plan)** là cách thức thực thi cụ thể của một câu lệnh SQL sau khi đi qua quá trình tối ưu của **MySQL Query Optimizer** (bộ tối ưu truy vấn).

Kế hoạch thực thi thường được dùng trong các kịch bản phân tích và tối ưu hiệu năng SQL. Thông qua kết quả của `EXPLAIN`, ta có thể nắm được thứ tự truy vấn các bảng dữ liệu, loại thao tác truy cập dữ liệu, những index nào có thể được dùng, index nào thực sự được chọn, mỗi bảng ước tính cần đọc bao nhiêu dòng bản ghi, v.v.

## Cách lấy kế hoạch thực thi

MySQL cung cấp lệnh `EXPLAIN` để lấy thông tin về kế hoạch thực thi.

Cần lưu ý rằng câu lệnh `EXPLAIN` tiêu chuẩn sẽ **không thực sự chạy** câu lệnh truy vấn tương ứng, mà thông qua Query Optimizer để phân tích câu lệnh, tìm ra phương án truy vấn tối ưu và hiển thị các thông tin tương ứng.

Từ MySQL 8.0.18 đã bổ sung `EXPLAIN ANALYZE`: lệnh này sẽ **thực thi thật** câu truy vấn và xuất ra thời gian tiêu tốn thực tế cùng số dòng ở từng bước; vì chính xác hơn dữ liệu ước lượng của `EXPLAIN` tiêu chuẩn, nó rất thích hợp để điều tra sâu các truy vấn chậm (slow query) trong môi trường kiểm thử:

```sql
mysql> EXPLAIN ANALYZE SELECT * FROM users WHERE age = 25\G
*************************** 1. row ***************************
EXPLAIN: -> Covering index lookup on users using idx_age_score_name (age=25)
(cost=1.52 rows=12) (actual time=0.0272..0.0344 rows=12 loops=1)
```

Ngoài ra, `EXPLAIN FORMAT=JSON` có thể xuất ra dữ liệu mô hình chi phí của Optimizer (`query_cost`), phản ánh chi phí thực tế của từng bước rõ ràng hơn dạng bảng, đặc biệt hữu ích khi tinh chỉnh JOIN nhiều bảng hoặc truy vấn con (subquery):

```sql
mysql> EXPLAIN FORMAT=JSON SELECT * FROM users WHERE age = 25\G
*************************** 1. row ***************************
EXPLAIN: {
  "query_block": {
    "select_id": 1,
    "cost_info": {
      "query_cost": "1.52"
    },
    "table": {
      "table_name": "users",
      "access_type": "ref",
      "key": "idx_age_score_name",
      "rows_examined_per_scan": 12,
      "filtered": "100.00",
      "using_index": true
    }
  }
}
```

Kế hoạch thực thi `EXPLAIN` hỗ trợ các câu lệnh `SELECT`, `DELETE`, `INSERT`, `REPLACE` và `UPDATE`. Thông thường chúng ta hay dùng nhất để phân tích các câu truy vấn `SELECT`, cú pháp sử dụng rất đơn giản:

```sql
EXPLAIN SELECT <câu_truy_vấn>;
```

Hãy cùng xem nhanh kế hoạch thực thi của một câu truy vấn đơn giản:

**Ví dụ 1: Truy vấn một bảng (có dùng index)**

```sql
-- Cấu trúc bảng: users(id, age, score, name, address), composite index idx_age_score_name(age, score, name)
mysql> EXPLAIN SELECT * FROM users WHERE age = 25;
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys       | key                 | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | users | NULL       | ref  | idx_age_score_name  | idx_age_score_name  | 5       | const |   12 |   100.00 | Using index |
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------+------+----------+-------------+
```

**Ví dụ 2: Truy vấn UNION (trường hợp `id` là NULL)**

```sql
mysql> EXPLAIN SELECT * FROM users WHERE id = 1 UNION SELECT * FROM users WHERE id = 2;
+----+--------------+------------+------------+-------+---------------+---------+---------+-------+------+----------+-------+
| id | select_type  | table      | partitions | type  | possible_keys | key     | key_len | ref   | rows | filtered | Extra |
+----+--------------+------------+------------+-------+---------------+---------+---------+-------+------+----------+-------+
|  1 | PRIMARY      | users      | NULL       | const | PRIMARY       | PRIMARY | 4       | const |    1 |   100.00 | NULL  |
|  2 | UNION        | users      | NULL       | const | PRIMARY       | PRIMARY | 4       | const |    1 |   100.00 | NULL  |
|  3 | UNION RESULT | <union1,2> | NULL       | ALL   | NULL          | NULL    | NULL    | NULL  | NULL |     NULL | Using temporary |
+----+--------------+------------+------------+-------+---------------+---------+---------+-------+------+----------+-------+
```

Có thể thấy kết quả kế hoạch thực thi có tổng cộng 12 cột, ý nghĩa đại diện của từng cột được tổng hợp ở bảng sau:

| **Tên cột**   | **Ý nghĩa**                                                          |
| ------------- | -------------------------------------------------------------------- |
| id            | Mã định danh tuần tự của truy vấn `SELECT`                           |
| select_type   | Loại truy vấn tương ứng với từ khóa `SELECT`                         |
| table         | Tên bảng được sử dụng                                                |
| partitions    | Partition khớp được; với bảng không chia partition, giá trị là NULL |
| type          | Phương thức truy cập bảng (access type)                              |
| possible_keys | Các index có khả năng được sử dụng                                   |
| key           | Index thực tế được sử dụng                                           |
| key_len       | Độ dài của index được chọn                                           |
| ref           | Cột hoặc hằng số được đem so sánh với index khi tìm kiếm bằng (`=`)  |
| rows          | Số dòng ước tính cần phải đọc                                        |
| filtered      | Tỷ lệ phần trăm số bản ghi ước tính còn lại sau khi lọc điều kiện bảng |
| Extra         | Thông tin bổ sung                                                    |

## Cách phân tích kết quả EXPLAIN

Để phân tích kết quả thực thi của câu lệnh `EXPLAIN`, chúng ta cần nắm rõ các trường quan trọng trong kế hoạch thực thi.

### id

Định danh của `SELECT`, dùng để đánh dấu thứ tự thực thi của từng câu lệnh `SELECT`.

Quy tắc đọc hiểu cột `id`:

- **`id` giống nhau**: Thực thi tuần tự từ trên xuống dưới (thường gặp trong kịch bản JOIN nhiều bảng).
- **`id` khác nhau**: Giá trị `id` càng lớn thì độ ưu tiên thực thi càng cao (subquery chạy trước truy vấn bên ngoài).
- **`id` là `NULL`**: Biểu thị đây là tập kết quả của `UNION RESULT` hoặc bảng `DERIVED`, không cần thực thi truy vấn riêng lẻ.

**Ví dụ**:

```sql
mysql> EXPLAIN SELECT * FROM users WHERE id = 1
    -> UNION
    -> SELECT * FROM users WHERE id = 2\G
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY
        table: users
         type: const
*************************** 2. row ***************************
           id: 2
  select_type: UNION
        table: users
         type: const
*************************** 3. row ***************************
           id: NULL
  select_type: UNION RESULT
        table: <union1,2>
         type: ALL
        Extra: Using temporary
```

Dòng thứ ba có `id = NULL`, `table = <union1,2>`, biểu thị đây là bước gộp kết quả của hai câu truy vấn trước đó.

### select_type

Loại truy vấn, chủ yếu dùng để phân biệt truy vấn thông thường, truy vấn gộp (`UNION`), truy vấn con (`subquery`) và các truy vấn phức tạp khác. Các giá trị phổ biến gồm:

- **SIMPLE**: Truy vấn đơn giản, không chứa `UNION` hay truy vấn con.
- **PRIMARY**: Nếu truy vấn có chứa truy vấn con hoặc các phần khác, `SELECT` ở lớp ngoài cùng sẽ được đánh dấu là `PRIMARY`.
- **SUBQUERY**: Câu `SELECT` đầu tiên trong truy vấn con.
- **UNION**: Câu `SELECT` xuất hiện phía sau `UNION` trong câu lệnh `UNION`.
- **DERIVED**: Truy vấn con xuất hiện trong mệnh đề `FROM` sẽ được đánh dấu là `DERIVED`.
- **UNION RESULT**: Kết quả của truy vấn `UNION`.

### table

Tên bảng được dùng trong truy vấn; mỗi dòng đều có tên bảng tương ứng. Ngoài tên bảng thông thường, cột này cũng có thể mang các giá trị sau:

- **`<unionM,N>`**: Dòng này tham chiếu tới kết quả `UNION` của các dòng có `id` là `M` và `N`.
- **`<derivedN>`**: Dòng này tham chiếu tới kết quả bảng dẫn xuất (derived table) do bảng có `id` là `N` tạo ra. Bảng dẫn xuất có thể sinh ra từ truy vấn con trong mệnh đề `FROM`.
- **`<subqueryN>`**: Dòng này tham chiếu tới kết quả truy vấn con được vật chất hóa (materialized subquery) do bảng có `id` là `N` tạo ra.

### type (Quan trọng)

Loại thực thi truy vấn, mô tả cách thức truy vấn được thực hiện. **Thứ tự sắp xếp từ tối ưu nhất đến kém nhất là**:

`system > const > eq_ref > ref > fulltext > ref_or_null > index_merge > unique_subquery > index_subquery > range > index > ALL`

**Quy tắc kinh nghiệm đánh giá hiệu năng**:

- **Tốt** (tối thiểu nên đạt): `system`, `const`, `eq_ref`, `ref`, `range`
- **Cần lưu ý**: `index_merge`, `index` (quét toàn bộ index vẫn tiềm ẩn rủi ro hiệu năng khi dữ liệu lớn)
- **Cần tối ưu**: `ALL` (quét toàn bộ bảng - Full Table Scan)

**Lưu ý**: Thứ tự xếp hạng này phản ánh **hiệu quả truy cập trên một bảng đơn lẻ**, không đại diện cho hiệu năng tổng thể của cả truy vấn. Ví dụ, `type=ref` đi kèm lượng lớn thao tác quay lại bảng chính tra cứu (back-to-table / lookup theo Primary Key) có thể còn chậm hơn `type=index` dùng Covering Index.

Ý nghĩa cụ thể của một số loại phổ biến như sau:

- **system**: Bảng chỉ có duy nhất một dòng bản ghi (hoặc là bảng rỗng), và Storage Engine có thể thống kê chính xác số dòng. Áp dụng cho các engine như MyISAM, Memory, InnoDB (khi bảng chỉ có 1 dòng, InnoDB sẽ tối ưu thành `const`). Đây là trường hợp đặc biệt của kiểu truy cập `const`.
- **const**: Trong bảng có tối đa chỉ một bản ghi khớp và có thể tìm thấy chỉ sau một lần tra cứu; thường gặp khi dùng toàn bộ các cột của khóa chính hoặc Unique Index làm điều kiện truy vấn.
- **eq_ref**: Khi JOIN bảng, mỗi dòng của bảng phía trước chỉ có duy nhất một dòng ở bảng hiện tại tương ứng với nó. Ngoài `system` và `const`, đây là phương thức JOIN tốt nhất, thường dùng khi lấy toàn bộ các cột của khóa chính hoặc Unique Index không null làm điều kiện JOIN (đảm bảo khớp chặt chẽ 1-1).
- **ref**: Dùng chỉ mục thường (Non-unique Index) làm điều kiện truy vấn; kết quả truy vấn có thể tìm thấy nhiều dòng thỏa mãn (khác với `eq_ref`: một dòng ở bảng dẫn có thể khớp với nhiều dòng ở bảng bị dẫn).
- **index_merge**: Khi mệnh đề `WHERE` chứa nhiều điều kiện phạm vi/bằng nhau và mỗi điều kiện có thể dùng một index khác nhau, MySQL sẽ gộp kết quả quét từ nhiều index. Cột `key` liệt kê các index được sử dụng, còn cột `Extra` hiển thị thuật toán gộp:

  - `Using union(...)`: Lấy hợp của kết quả nhiều index (điều kiện `OR`)
  - `Using sort_union(...)`: Sắp xếp kết quả index trước rồi mới lấy hợp (điều kiện `OR`, các cột index không theo thứ tự)
  - `Using intersection(...)`: Lấy giao của kết quả nhiều index (điều kiện `AND`)

  **Ví dụ**:

  ```sql
  -- Điều kiện OR kích hoạt index merge union
  EXPLAIN SELECT * FROM employees WHERE emp_no = 10001 OR dept_no = 'd001';
  -- Extra: Using union(PRIMARY,dept_no_index)
  ```

- **range**: Thực hiện truy vấn theo khoảng (range scan) trên cột có index; cột `key` trong kế hoạch thực thi cho biết index nào đã được sử dụng.
- **index**: Full Index Scan—truy vấn duyệt qua toàn bộ cây index. Tương tự `ALL` (quét toàn bảng), nhưng chi phí thường thấp hơn: kích thước bản ghi index nhỏ hơn nhiều so với dữ liệu đầy đủ của một dòng, nên đọc cùng số lượng dòng sẽ tốn ít trang I/O hơn; nếu đồng thời thỏa mãn điều kiện Covering Index thì còn tránh được thao tác quay lại bảng chính (back-to-table). Tuy nhiên trên các bảng cực lớn (hàng trăm triệu dòng trở lên), quét toàn bộ index vẫn có thể phát sinh lượng I/O khổng lồ, không thể chủ quan bỏ qua chi phí chỉ vì cấp độ `type` cao hơn `ALL`.
- **ALL**: Quét toàn bộ bảng (Full Table Scan).

### possible_keys

Cột `possible_keys` biểu thị các index mà MySQL *có thể* sử dụng khi thực thi truy vấn. Nếu cột này là `NULL`, nghĩa là không có index nào khả dụng; trong trường hợp này, cần kiểm tra các cột dùng trong mệnh đề `WHERE` xem có thể tạo thêm index cho một hoặc nhiều cột trong số đó để cải thiện hiệu năng truy vấn hay không.

### key (Quan trọng)

Cột `key` biểu thị index mà MySQL **thực tế** đã sử dụng. Nếu là `NULL`, nghĩa là không sử dụng index nào.

### key_len

Cột `key_len` biểu thị độ dài tối đa của index mà MySQL thực tế sử dụng; khi dùng Composite Index (chỉ mục kết hợp), giá trị này có thể là tổng độ dài của nhiều cột. Miễn là đáp ứng được nhu cầu truy vấn thì giá trị này càng ngắn càng tốt. Nếu cột `key` hiển thị `NULL`, cột `key_len` cũng hiển thị `NULL`.

### rows

Cột `rows` biểu thị số dòng **ước tính** cần phải đọc để tìm thấy các bản ghi cần thiết, dựa trên thông tin thống kê của bảng và việc lựa chọn index; giá trị càng nhỏ càng tốt.

Cần lưu ý rằng giá trị này là con số ước tính chứ không phải con số chính xác. Thông tin thống kê của InnoDB dựa trên việc lấy mẫu ngẫu nhiên các trang index (index page):

- Số trang lấy mẫu được điều khiển bởi `innodb_stats_persistent_sample_pages` (mặc định 20 trang).
- Sau khi dữ liệu bảng biến động liên tục hoặc import hàng loạt, sai lệch giữa giá trị ước tính và số dòng thực tế có thể lên tới 10%–50% hoặc thậm chí lớn hơn.
- **Bẫy bảng nhỏ**: Khi số dòng của bảng cực ít (ví dụ `< 100` dòng), Optimizer có thể bỏ qua index và chọn quét toàn bộ bảng vì chi phí ước tính của việc quét toàn bảng thấp hơn.

**Phương pháp kiểm chứng**:

```sql
-- Số dòng ước tính từ kế hoạch thực thi
mysql> EXPLAIN SELECT * FROM users WHERE age = 25\G
rows: 12

-- Số dòng thực tế (lưu ý: thận trọng khi dùng COUNT(*) trên bảng lớn)
mysql> SELECT COUNT(*) FROM users WHERE age = 25;
+----------+
| COUNT(*) |
+----------+
|       12 |
+----------+
```

Khi gặp trường hợp kế hoạch thực thi không khớp với hiệu năng thực tế, có thể chạy `ANALYZE TABLE` để lấy mẫu lại thống kê rồi quan sát sự thay đổi của kế hoạch thực thi.

### filtered

Cột `filtered` biểu thị tỷ lệ phần trăm (0–100) **ước tính** số bản ghi còn lại sau khi dữ liệu do Storage Engine trả về được lọc tiếp bởi điều kiện `WHERE` ở tầng Server. Công thức tính: `filtered = (Số dòng sau khi lọc điều kiện / Số dòng Storage Engine trả về) × 100`.

**Quy tắc đọc hiểu**:

- Khi `filtered = 100`: Toàn bộ các dòng do Storage Engine trả về đều thỏa mãn điều kiện `WHERE` (trường hợp lý tưởng).
- Khi `filtered < 100`: Một phần số dòng bị lọc bỏ ở tầng Server, cho thấy index chưa bao phủ hết toàn bộ điều kiện truy vấn.
- **Kịch bản JOIN**: Optimizer dùng `rows × (filtered / 100)` để ước lượng số dòng từ bảng hiện tại truyền sang bảng tiếp theo (fan-out).

Trường này đặc biệt quan trọng trong kịch bản JOIN nhiều bảng: fan-out càng lớn thì số dòng ở bảng bị dẫn mà bảng dẫn cần đối khớp càng nhiều. Do đó khi giá trị `filtered` rất thấp, điều đó cho thấy hiệu quả lọc khá tốt; còn khi `rows` rất lớn mà `filtered` lại không cao thì đó là dấu hiệu của điểm nghẽn hiệu năng tiềm ẩn, nên ưu tiên cân nhắc sử dụng Index Condition Pushdown (ICP) hoặc một index phù hợp hơn để giảm fan-out.

### Extra (Quan trọng)

Cột này chứa thông tin bổ sung về cách MySQL phân tích truy vấn; thông qua các thông tin này, ta có thể hiểu chính xác hơn cách MySQL thực sự thực thi câu truy vấn. Các giá trị phổ biến gồm:

- **Using filesort**: MySQL không thể tận dụng index để hoàn thành yêu cầu sắp xếp của `ORDER BY` hoặc `GROUP BY`, nên cần thực hiện thêm một thao tác sắp xếp sau khi lấy tập kết quả. Khi kích thước tập kết quả nằm trong giới hạn `sort_buffer_size`, quá trình sắp xếp diễn ra trong bộ nhớ; nếu vượt quá sẽ phải nhờ đến tệp tạm trên đĩa. "filesort" chỉ là tên gọi mang tính lịch sử chứ không nhất thiết có nghĩa là phát sinh I/O đĩa.
- **Using temporary**: MySQL cần tạo bảng tạm (temporary table) để lưu kết quả truy vấn trung gian, thường gặp ở `ORDER BY` và `GROUP BY`.
- **Using index**: Cho thấy truy vấn đã sử dụng Covering Index (chỉ mục bao phủ), không cần quay lại bảng chính tra cứu (back-to-table), hiệu năng truy vấn rất cao.
- **Using index condition**: Biểu thị Query Optimizer đã chọn sử dụng tính năng Index Condition Pushdown (ICP - đẩy điều kiện lọc xuống tầng index).
- **Using where**: Tầng Server của MySQL đã áp dụng thêm bước lọc điều kiện `WHERE` lên các dòng do Storage Engine trả về. Ngay cả khi đã trúng index (như `type=ref`), nếu index chỉ đáp ứng được một phần điều kiện truy vấn, phần điều kiện còn lại vẫn cần lọc ở tầng Server, nên lúc này cũng sẽ xuất hiện `Using where`.
- **Using join buffer (Block Nested Loop)**: Khi JOIN bảng mà bảng bị dẫn không sử dụng được index, MySQL sẽ đọc dữ liệu bảng dẫn vào `join buffer` trước, rồi duyệt qua bảng bị dẫn để đối khớp (độ phức tạp `O(N×M)`).
- **Using join buffer (hash join)**: MySQL 8.0.18 giới thiệu thuật toán Hash Join, **chỉ dùng cho phép JOIN bằng (`=`)** (ví dụ `t1.id = t2.id`), và từ bản 8.0.20 mặc định thay thế cho BNL. Hash Join có độ phức tạp ở pha dựng bảng băm là `O(N)` + pha dò tìm là `O(M)`, hiệu quả hơn hẳn `O(N×M)` của BNL.

  **Các trường hợp ngoại lệ** (vẫn quay về dùng BNL):

  - Phép JOIN không phải điều kiện bằng (ví dụ `t1.id > t2.id`)
  - Điều kiện JOIN có chứa hàm hoặc biểu thức
  - Khi bảng bị dẫn có index khả dụng (lúc này sẽ dùng Index Nested Loop)

Xin nhắc nhở thêm: khi cột `Extra` chứa `Using filesort` hoặc `Using temporary`, hiệu năng của MySQL có thể đang gặp vấn đề, cần cố gắng tránh tối đa.

## Tài liệu tham khảo

- <https://dev.mysql.com/doc/refman/8.0/en/explain-output.html>
- <https://dev.mysql.com/doc/refman/8.0/en/explain.html>
- <https://juejin.cn/post/6953444668973514789>
