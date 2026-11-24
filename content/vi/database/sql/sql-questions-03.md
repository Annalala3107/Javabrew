---
title: Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 3)
description: Tổng hợp câu hỏi phỏng vấn SQL thường gặp phần 3, đi sâu vào cách sử dụng các hàm tổng hợp COUNT, SUM, AVG, MAX, MIN, cùng các kỹ thuật nâng cao như phân nhóm GROUP BY, lọc HAVING, tính giá trị trung bình cắt tỉa (trimmed/truncated mean).
category: Cơ sở dữ liệu
tag:
  - Kiến thức cơ sở dữ liệu
  - SQL
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn SQL, hàm tổng hợp, COUNT, SUM, AVG, MAX, MIN, GROUP BY, HAVING, trung bình cắt tỉa
lang: vi
sourceRef: zh-ref/database/sql/sql-questions-03.md
---

> Nguồn bài tập: [Nowcoder - Thử thách SQL nâng cao](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

Các bài tập ở mức tương đối khó hoặc khó có thể cân nhắc bỏ qua tùy theo tình hình thực tế và nhu cầu phỏng vấn của bản thân.

## Hàm tổng hợp (Aggregate Functions)

### Điểm trung bình cắt tỉa của bài thi độ khó cao thuộc thể loại SQL (Tương đối khó)

**Mô tả**: Bộ phận vận hành của Nowcoder muốn xem xét tình hình điểm số của mọi người ở các đề thi độ khó cao thuộc danh mục SQL.

Hãy giúp cô ấy tính điểm trung bình cắt tỉa (điểm trung bình sau khi loại bỏ một giá trị lớn nhất và một giá trị nhỏ nhất) của tất cả người dùng đã hoàn thành các đề thi độ khó cao thuộc danh mục SQL từ bảng dữ liệu `exam_record`.

Dữ liệu mẫu: `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành)

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Dữ liệu mẫu: `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số)

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:01 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | 2021-05-02 10:30:01 | 81     |
| 3   | 1001 | 9001    | 2021-06-02 19:01:01 | 2021-06-02 19:31:01 | 84     |
| 4   | 1001 | 9002    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 5   | 1001 | 9001    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |
| 6   | 1001 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 7   | 1002 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 8   | 1002 | 9001    | 2021-05-05 18:01:01 | 2021-05-05 18:59:02 | 90     |
| 9   | 1003 | 9001    | 2021-09-07 12:01:01 | 2021-09-07 10:31:01 | 50     |
| 10  | 1004 | 9001    | 2021-09-06 10:01:01 | (NULL)              | (NULL) |

Dựa vào dữ liệu đầu vào, kết quả truy vấn của bạn như sau:

| tag | difficulty | clip_avg_score |
| --- | ---------- | -------------- |
| SQL | hard       | 81.7           |

Từ bảng `examination_info`, có thể thấy đề thi 9001 là đề thi SQL có độ khó cao, điểm số của các lượt làm đề thi này gồm có [80, 81, 84, 90, 50]. Sau khi loại bỏ điểm cao nhất và điểm thấp nhất thì còn lại [80, 81, 84], điểm trung bình là 81.6666667, làm tròn đến một chữ số thập phân là 81.7.

**Mô tả đầu vào:**

Dữ liệu đầu vào có ít nhất 3 điểm số hợp lệ.

**Ý tưởng 1:** Để tìm được đề thi SQL độ khó cao, chắc chắn cần kết nối (JOIN) với bảng `examination_info`, sau đó tìm các khóa học/đề thi có độ khó cao. Từ bảng `examination_info` ta biết được đề thi SQL độ khó cao có `exam_id` là 9001, vậy lát nữa sẽ dùng điều kiện `exam_id = 9001` để truy vấn;

Đầu tiên, tìm bài thi số 9001: `select * from exam_record where exam_id = 9001`

Tiếp theo, tìm điểm cao nhất: `select max(score) 最高分 from exam_record where exam_id = 9001`

Sau đó, tìm điểm thấp nhất: `select min(score) 最低分 from exam_record where exam_id = 9001`

Trong tập kết quả điểm số truy vấn ra, để loại bỏ điểm cao nhất và điểm thấp nhất, cách trực quan nhất nghĩ đến là dùng `NOT IN` hoặc `NOT EXISTS`, ở đây ta dùng `NOT IN`.

Trước hết viết khung câu truy vấn chính: `select tag, difficulty, round(avg(score), 1) clip_avg_score from examination_info info INNER JOIN exam_record record`

**Mẹo nhỏ (Tips)**: Hàm `ROUND()` của MySQL: `ROUND(X)` trả về số nguyên gần nhất với tham số X; `ROUND(X, D)` trả về X được làm tròn đến D chữ số thập phân, chữ số thứ D được làm tròn theo quy tắc 4 xuống 5 lên.

Sau đó ghép các mảnh câu lệnh ở trên lại với nhau. Lưu ý trong `NOT IN`, hai truy vấn con được liên kết bằng `UNION ALL`, dùng `UNION` để gộp kết quả của `MAX` và `MIN` vào cùng một tập kết quả, tạo thành hiệu ứng một cột nhiều dòng.

**Đáp án 1:**

```sql
SELECT tag, difficulty, ROUND(AVG(score), 1) clip_avg_score
	FROM examination_info info  INNER JOIN exam_record record
		WHERE info.exam_id = record.exam_id
			AND  record.exam_id = 9001
				AND record.score NOT IN(
					SELECT MAX(score)
						FROM exam_record
							WHERE exam_id = 9001
								UNION ALL
					SELECT MIN(score)
						FROM exam_record
							WHERE exam_id = 9001
				)
```

Đây là cách giải trực quan và dễ nghĩ ra nhất, nhưng vẫn cần cải thiện. Đây thực chất là cách làm "mẹo" để vượt qua bài test. Thực tế nếu tuân thủ nghiêm ngặt yêu cầu của đề bài thì nên viết như sau:

```sql
SELECT tag,
       difficulty,
       ROUND(AVG(score), 1) clip_avg_score
FROM examination_info info
INNER JOIN exam_record record
WHERE info.exam_id = record.exam_id
  AND record.exam_id =
    (SELECT examination_info.exam_id
     FROM examination_info
     WHERE tag = 'SQL'
       AND difficulty = 'hard' )
  AND record.score NOT IN
    (SELECT MAX(score)
     FROM exam_record
     WHERE exam_id =
         (SELECT examination_info.exam_id
          FROM examination_info
          WHERE tag = 'SQL'
            AND difficulty = 'hard' )
     UNION ALL SELECT MIN(score)
     FROM exam_record
     WHERE exam_id =
         (SELECT examination_info.exam_id
          FROM examination_info
          WHERE tag = 'SQL'
            AND difficulty = 'hard' ) )
```

Tuy nhiên, bạn sẽ thấy có rất nhiều câu lệnh bị lặp lại, vì vậy ta có thể sử dụng mệnh đề `WITH` để trích xuất phần dùng chung.

**Giới thiệu mệnh đề `WITH`**:

Mệnh đề `WITH`, còn được gọi là Biểu thức bảng chung (Common Table Expression - CTE), là cách định nghĩa bảng tạm thời trong truy vấn SQL. Nó cho phép chúng ta tạo một tập kết quả được đặt tên tạm thời trong truy vấn và có thể tham chiếu tập kết quả đó trong cùng một truy vấn.

Cú pháp cơ bản:

```sql
WITH cte_name (column1, column2, ..., columnN) AS (
    -- Thân truy vấn
    SELECT ...
    FROM ...
    WHERE ...
)
-- Truy vấn chính
SELECT ...
FROM cte_name
WHERE ...
```

Mệnh đề `WITH` bao gồm các thành phần sau:

- `cte_name`: Đặt tên cho bảng tạm, có thể tham chiếu trong truy vấn chính.
- `(column1, column2, ..., columnN)`: Tùy chọn, chỉ định tên các cột của bảng tạm.
- `AS`: Bắt buộc, biểu thị bắt đầu định nghĩa bảng tạm.
- `Thân truy vấn CTE`: Câu lệnh truy vấn thực tế dùng để định nghĩa dữ liệu trong bảng tạm.

Một trong những mục đích chính của mệnh đề `WITH` là nâng cao tính dễ đọc và khả năng bảo trì của truy vấn, đặc biệt khi liên quan đến nhiều truy vấn con lồng nhau hoặc cần tái sử dụng cùng một logic truy vấn nhiều lần. Bằng cách đặt các logic này vào một bảng tạm có tên, chúng ta có thể tổ chức truy vấn rõ ràng hơn và loại bỏ mã trùng lặp.

Ngoài ra, mệnh đề `WITH` còn có thể triển khai truy vấn đệ quy (recursive query) trong các truy vấn phức tạp. Truy vấn đệ quy cho phép chúng ta thực hiện nhiều lần lặp trên cùng một bảng trong một truy vấn duy nhất để xây dựng tập kết quả từng bước. Điều này rất hữu ích trong các kịch bản xử lý dữ liệu phân cấp, cấu trúc tổ chức và cấu trúc dạng cây.

**Chi tiết nhỏ**: MySQL phiên bản 5.7 trở về trước không hỗ trợ sử dụng trực tiếp bí danh trong mệnh đề `WITH`.

Dưới đây là đáp án đã được cải tiến:

```sql
WITH t1 AS
  (SELECT record.*,
          info.tag,
          info.difficulty
   FROM exam_record record
   INNER JOIN examination_info info ON record.exam_id = info.exam_id
   WHERE info.tag = "SQL"
     AND info.difficulty = "hard" )
SELECT tag,
       difficulty,
       ROUND(AVG(score), 1)
FROM t1
WHERE score NOT IN
    (SELECT max(score)
     FROM t1
     UNION SELECT min(score)
     FROM t1)
```

**Ý tưởng 2:**

- Lọc đề thi SQL độ khó cao: `where tag="SQL" and difficulty="hard"`
- Tính điểm trung bình cắt tỉa: `(tổng - giá trị lớn nhất - giá trị nhỏ nhất) / (tổng số lượng - 2)`:
  - `(sum(score) - max(score) - min(score)) / (count(score) - 2)`
  - Có một nhược điểm là nếu giá trị lớn nhất hoặc nhỏ nhất xuất hiện nhiều lần, phương pháp này khó xử lý chính xác. Tuy nhiên trong đề bài đã nêu rõ -----> **`Điểm trung bình sau khi loại bỏ một giá trị lớn nhất và một giá trị nhỏ nhất`**, do đó ở đây hoàn toàn có thể áp dụng công thức này.

**Đáp án 2:**

```sql
SELECT info.tag,
       info.difficulty,
       ROUND((SUM(record.score)- MIN(record.score)- MAX(record.score)) / (COUNT(record.score)- 2), 1) AS clip_avg_score
FROM examination_info info,
     exam_record record
WHERE info.exam_id = record.exam_id
  AND info.tag = "SQL"
  AND info.difficulty = "hard";
```

### Thống kê số lần làm bài

Có một bảng ghi chép làm bài thi `exam_record`, hãy từ đó thống kê ra tổng số lần làm bài `total_pv`, số lượt làm bài thi đã hoàn thành `complete_pv`, và số đề thi khác nhau đã hoàn thành `complete_exam_cnt`.

Dữ liệu mẫu bảng `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:01 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | 2021-05-02 10:30:01 | 81     |
| 3   | 1001 | 9001    | 2021-06-02 19:01:01 | 2021-06-02 19:31:01 | 84     |
| 4   | 1001 | 9002    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 5   | 1001 | 9001    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |
| 6   | 1001 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 7   | 1002 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 8   | 1002 | 9001    | 2021-05-05 18:01:01 | 2021-05-05 18:59:02 | 90     |
| 9   | 1003 | 9001    | 2021-09-07 12:01:01 | 2021-09-07 10:31:01 | 50     |
| 10  | 1004 | 9001    | 2021-09-06 10:01:01 | (NULL)              | (NULL) |

Đầu ra mẫu:

| total_pv | complete_pv | complete_exam_cnt |
| -------- | ----------- | ----------------- |
| 10       | 7           | 2                 |

Giải thích: Thể hiện tính đến thời điểm hiện tại, có 10 bản ghi làm bài thi; số lượt làm bài đã hoàn thành là 7 lượt (những lượt thoát giữa chừng ở trạng thái chưa hoàn thành, thời gian nộp bài và điểm số là NULL); các đề thi đã hoàn thành gồm có 2 đề là 9001 và 9002.

**Ý tưởng**: Khi nhìn thấy yêu cầu thống kê số lần, việc đầu tiên nghĩ đến chắc chắn là dùng hàm `COUNT` để giải quyết. Vấn đề là làm sao để thống kê các bản ghi khác nhau? Sử dụng truy vấn con (subquery) có thể giải quyết được bài này (bài này dùng `CASE WHEN` cũng viết được, cách giải tương tự, chỉ khác về logic). Trước khi làm bài này, hãy cùng tìm hiểu cách dùng cơ bản của `COUNT`:

Cú pháp cơ bản của hàm `COUNT()` như sau:

```sql
COUNT(expression)
```

Trong đó, `expression` có thể là tên cột, biểu thức, hằng số hoặc ký tự đại diện. Dưới đây là một số ví dụ sử dụng phổ biến:

1. Đếm số lượng tất cả các hàng trong bảng:

```sql
SELECT COUNT(*) FROM table_name;
```

2. Đếm số lượng giá trị không rỗng (khác NULL) của một cột cụ thể:

```sql
SELECT COUNT(column_name) FROM table_name;
```

3. Đếm số hàng thỏa mãn điều kiện:

```sql
SELECT COUNT(*) FROM table_name WHERE condition;
```

4. Kết hợp với `GROUP BY` để đếm số hàng của từng nhóm sau khi phân nhóm:

```sql
SELECT column_name, COUNT(*) FROM table_name GROUP BY column_name;
```

5. Đếm số tổ hợp duy nhất của các cột khác nhau:

```sql
SELECT COUNT(DISTINCT column_name1, column_name2) FROM table_name;
```

Khi sử dụng hàm `COUNT()`, nếu không chỉ định tham số nào hoặc dùng `COUNT(*)`, nó sẽ tính tất cả các hàng. Còn nếu sử dụng tên cột, nó chỉ tính số lượng giá trị không null của cột đó.

Ngoài ra, kết quả của hàm `COUNT()` là một giá trị số nguyên. Ngay cả khi kết quả là 0, nó cũng không bao giờ trả về NULL, điểm này cần ghi nhớ kỹ.

**Đáp án**:

```sql
SELECT
	count(*) total_pv,
	( SELECT count(*) FROM exam_record WHERE submit_time IS NOT NULL ) complete_pv,
	( SELECT COUNT( DISTINCT exam_id, score IS NOT NULL OR NULL ) FROM exam_record ) complete_exam_cnt
FROM
	exam_record
```

Ở đây cần giải thích kỹ câu lệnh `COUNT( DISTINCT exam_id, score IS NOT NULL OR NULL )`: phán đoán xem `score` có khác null hay không, nếu có thì là true, nếu không thì trả về null; chú ý ở đây nếu không thêm `OR NULL`, khi không phải là null (tức điều kiện không thỏa mãn) nó sẽ trả về false (tức giá trị 0, vẫn được tính là non-null!).

Bản thân `COUNT` không thể đếm số hàng trực tiếp trên nhiều cột, việc thêm `DISTINCT` làm cho nhiều cột trở thành một thể thống nhất, từ đó có thể đếm số hàng xuất hiện; `COUNT(DISTINCT ...)` khi tính toán chỉ trả về các hàng non-null, điểm này cũng cần lưu ý.

Ngoài ra, qua bài này chúng ta nắm được cú pháp thông dụng khi đếm có điều kiện trong count -----> `count(điều_kiện_cột or null)`.

### Điểm số thấp nhất không nhỏ hơn điểm trung bình

**Mô tả**: Từ bảng ghi chép làm bài thi, hãy tìm điểm số thấp nhất của người dùng trong các đề thi SQL mà điểm đó không nhỏ hơn điểm trung bình của thể loại đề thi này.

Dữ liệu mẫu bảng `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:01 | 80     |
| 2   | 1002 | 9001    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 3   | 1002 | 9002    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |
| 4   | 1002 | 9003    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 5   | 1002 | 9001    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 6   | 1002 | 9002    | 2021-05-05 18:01:01 | 2021-05-05 18:59:02 | 90     |
| 7   | 1003 | 9002    | 2021-02-06 12:01:01 | (NULL)              | (NULL) |
| 8   | 1003 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 86     |
| 9   | 1004 | 9003    | 2021-09-06 12:01:01 | (NULL)              | (NULL) |

Bảng `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Dữ liệu đầu ra mẫu:

| min_score_over_avg |
| ------------------ |
| 87                 |

**Giải thích**: Đề thi 9001 và 9002 thuộc thể loại SQL, các lượt làm hai đề thi này đạt điểm [80, 89, 87, 90], điểm trung bình là 86.5, điểm số nhỏ nhất không nhỏ hơn điểm trung bình là 87.

**Ý tưởng**: Loại bài tập này thoạt nhìn quả thực rất phức tạp vì chưa biết bắt đầu từ đâu. Nhưng khi đọc kỹ và phân tích đề bài, ta phải học cách nắm bắt thông tin then chốt trong yêu cầu đề bài. Lấy bài này làm ví dụ: `Từ bảng ghi chép làm bài thi, hãy tìm điểm số thấp nhất của người dùng trong các đề thi SQL mà điểm đó không nhỏ hơn điểm trung bình của thể loại đề thi này.` Bạn có thể lập tức trích xuất những thông tin hữu ích nào để làm hướng giải quyết?

Ý thứ nhất: Tìm điểm thi các đề thi ==SQL==

Ý thứ hai: ==Điểm trung bình== của thể loại đề thi đó

Ý thứ ba: ==Điểm số người dùng thấp nhất== của thể loại đề thi đó

Và chiếc "cầu nối" ở giữa chính là ==không nhỏ hơn== (`>=`)

Sau khi chia nhỏ điều kiện, ta hoàn thiện từng bước:

```sql
-- Tìm điểm của các đề có tag là 'SQL'   [80, 89, 87, 90]
-- Tiếp tục tính điểm trung bình của nhóm này
select  ROUND(AVG(score), 1) from  examination_info info INNER JOIN exam_record record
	where info.exam_id = record.exam_id
	and tag= 'SQL'
```

Sau đó tìm điểm thấp nhất của thể loại đề thi này, rồi lấy tập kết quả `[80, 89, 87, 90]` so sánh với điểm trung bình là có thể đưa ra đáp án cuối cùng.

**Đáp án**:

```sql
SELECT MIN(score) AS min_score_over_avg
FROM examination_info info
INNER JOIN exam_record record
WHERE info.exam_id = record.exam_id
  AND tag= 'SQL'
  AND score >=
    (SELECT ROUND(AVG(score), 1)
     FROM examination_info info
     INNER JOIN exam_record record
     WHERE info.exam_id = record.exam_id
       AND tag= 'SQL' )
```

Thực ra những yêu cầu của dạng bài này nhìn qua có vẻ rất "lắt léo", nhưng chỉ cần bóc tách cẩn thận, chia điều kiện lớn thành các điều kiện nhỏ, giải quyết từng điều kiện một, rồi cuối cùng ghép tất cả các điều kiện lại với nhau. Chỉ cần nhớ nguyên tắc: **Nắm mạch chính, gỡ từng nhánh**, mọi vấn đề đều sẽ được giải quyết dễ dàng.

## Truy vấn phân nhóm (GROUP BY)

### Số ngày hoạt động trung bình và số người hoạt động hàng tháng (MAU)

**Mô tả**: Bản ghi làm bài thi của người dùng trong khu vực làm bài thi Nowcoder được lưu trữ trong bảng `exam_record`, nội dung như sau:

Bảng `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số)

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-07-02 09:01:01 | 2021-07-02 09:21:01 | 80     |
| 2   | 1002 | 9001    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 81     |
| 3   | 1002 | 9002    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |
| 4   | 1002 | 9003    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 5   | 1002 | 9001    | 2021-07-02 19:01:01 | 2021-07-02 19:30:01 | 82     |
| 6   | 1002 | 9002    | 2021-07-05 18:01:01 | 2021-07-05 18:59:02 | 90     |
| 7   | 1003 | 9002    | 2021-07-06 12:01:01 | (NULL)              | (NULL) |
| 8   | 1003 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 86     |
| 9   | 1004 | 9003    | 2021-09-06 12:01:01 | (NULL)              | (NULL) |
| 10  | 1002 | 9003    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 81     |
| 11  | 1005 | 9001    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 88     |
| 12  | 1006 | 9002    | 2021-09-02 12:11:01 | 2021-09-02 12:31:01 | 89     |
| 13  | 1007 | 9002    | 2020-09-02 12:11:01 | 2020-09-02 12:31:01 | 89     |

Hãy tính số ngày hoạt động trung bình hàng tháng của người dùng trong khu vực làm bài thi `avg_active_days` và số người hoạt động hàng tháng `mau` cho từng tháng của năm 2021. Kết quả mẫu như sau:

| month  | avg_active_days | mau |
| ------ | --------------- | --- |
| 202107 | 1.50            | 2   |
| 202109 | 1.25            | 4   |

**Giải thích**: Tháng 7 năm 2021 có 2 người hoạt động, tổng cộng hoạt động 3 ngày (1001 hoạt động 1 ngày, 1002 hoạt động 2 ngày), số ngày hoạt động trung bình là 1.5; tháng 9 năm 2021 có 4 người hoạt động, tổng cộng hoạt động 5 ngày, số ngày hoạt động trung bình là 1.25, kết quả làm tròn 2 chữ số thập phân.

Lưu ý: Hoạt động ở đây chỉ hành vi ==nộp bài==.

**Ý tưởng**: Đọc xong đề bài trước tiên chú ý phần được tô đậm; thông thường khi tính số ngày và số người hoạt động theo tháng cần nghĩ ngay đến các hàm xử lý ngày tháng liên quan. Bài này chúng ta cũng chia nhỏ vấn đề ra để giải quyết:
Đầu tiên tính số người hoạt động, chắc chắn cần dùng `COUNT()`. Ở đây có một "cái bẫy", không biết các bạn có để ý không? Người dùng 1002 trong tháng 9 đã làm 2 đề thi khác nhau, vì vậy ở đây phải lưu ý loại bỏ trùng lặp (distinct), nếu không khi thống kê số người hoạt động sẽ bị sai.
Thứ hai là định dạng ngày tháng: như bảng trên, đề bài yêu cầu hiển thị theo định dạng `202107`, cần dùng `DATE_FORMAT` để định dạng.

Cách dùng cơ bản:

`DATE_FORMAT(date_value, format)`

- Tham số `date_value` là giá trị ngày hoặc thời gian cần định dạng.
- Tham số `format` là định dạng ngày hoặc thời gian được chỉ định (tương tự như định dạng ngày trong Java).

**Đáp án**:

```sql
SELECT DATE_FORMAT(submit_time, '%Y%m') MONTH,
                                        round(count(DISTINCT UID, DATE_FORMAT(submit_time, '%Y%m%d')) / count(DISTINCT UID), 2) avg_active_days,
                                        COUNT(DISTINCT UID) mau
FROM exam_record
WHERE YEAR (submit_time) = 2021
GROUP BY MONTH
```

Nói thêm một câu ở đây: việc sử dụng `COUNT(DISTINCT uid, DATE_FORMAT(submit_time, '%Y%m%d'))` có thể thống kê số lượng giá trị tổ hợp duy nhất giữa cột `uid` và cột `submit_time` sau khi đã được định dạng theo năm, tháng và ngày.

### Tổng số câu luyện tập trong tháng và số câu luyện tập trung bình mỗi ngày

**Mô tả**: Hiện có bảng ghi chép luyện tập câu hỏi `practice_record`, nội dung mẫu như sau:

| id  | uid  | question_id | submit_time         | score |
| --- | ---- | ----------- | ------------------- | ----- |
| 1   | 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 2   | 1002 | 8001        | 2021-09-02 19:30:01 | 50    |
| 3   | 1002 | 8001        | 2021-09-02 19:20:01 | 70    |
| 4   | 1002 | 8002        | 2021-09-02 19:38:01 | 70    |
| 5   | 1003 | 8002        | 2021-08-01 19:38:01 | 80    |

Hãy thống kê từ bảng trên tổng số câu luyện tập trong tháng của người dùng `month_q_cnt` và số câu luyện tập trung bình mỗi ngày `avg_day_q_cnt` (sắp xếp tăng dần theo tháng) cho từng tháng của năm 2021, cùng với tình hình tổng quan của cả năm đó. Dữ liệu mẫu đầu ra như sau:

| submit_month | month_q_cnt | avg_day_q_cnt |
| ------------ | ----------- | ------------- |
| 202108       | 2           | 0.065         |
| 202109       | 3           | 0.100         |
| 2021 汇总    | 5           | 0.161         |

**Giải thích**: Tháng 8 năm 2021 có tổng cộng 2 lượt luyện tập, số câu trung bình mỗi ngày là 2/31 = 0.065 (làm tròn 3 chữ số thập phân); tháng 9 năm 2021 có tổng cộng 3 lượt luyện tập, số câu trung bình mỗi ngày là 3/30 = 0.100; cả năm 2021 có tổng cộng 5 lượt luyện tập (trung bình tổng kết cả năm không mang ý nghĩa thực tế, ở đây đề bài tính theo 31 ngày: 5/31 = 0.161).

> Nowcoder đã áp dụng phiên bản MySQL mới nhất. Nếu kết quả chạy của bạn xuất hiện lỗi `ONLY_FULL_GROUP_BY`, điều đó có nghĩa là: đối với thao tác tổng hợp `GROUP BY`, nếu một cột xuất hiện trong mệnh đề `SELECT` mà không xuất hiện trong `GROUP BY`, thì câu lệnh SQL đó là không hợp lệ, vì cột đó không nằm trong mệnh đề `GROUP BY`. Nói cách khác, cột được SELECT ra bắt buộc phải xuất hiện sau `GROUP BY`, hoặc cột đó phải nằm trong một hàm tổng hợp, nếu không sẽ báo lỗi.

**Ý tưởng:**

Nhìn thấy dữ liệu mẫu cần liên tưởng ngay đến các hàm liên quan, ví dụ `submit_month` cần dùng `DATE_FORMAT` để định dạng ngày tháng. Sau đó truy vấn ra số lượng làm bài mỗi tháng.

Số lượng làm bài mỗi tháng:

```sql
SELECT MONTH ( submit_time ), COUNT( question_id )
FROM
	practice_record
GROUP BY
	MONTH (submit_time)
```

Tiếp theo, ở cột thứ ba cần dùng hàm `DAY(LAST_DAY(date_value))` để tìm số ngày trong tháng của một ngày cho trước.

Mã ví dụ như sau:

```sql
SELECT DAY(LAST_DAY('2023-07-08')) AS days_in_month;
-- Đầu ra: 31

SELECT DAY(LAST_DAY('2023-02-01')) AS days_in_month;
-- Đầu ra: 28 (tháng Hai của năm không nhuận)

SELECT DAY(LAST_DAY(NOW())) AS days_in_current_month;
-- Đầu ra: 31 (số ngày của tháng hiện tại)
```

Sử dụng hàm `LAST_DAY()` để lấy ngày cuối cùng trong tháng của ngày cho trước, sau đó dùng hàm `DAY()` để trích xuất số ngày của ngày đó. Như vậy sẽ lấy được số ngày của tháng đã chỉ định.

Cần lưu ý rằng hàm `LAST_DAY()` trả về giá trị kiểu ngày (date), trong khi hàm `DAY()` dùng để trích xuất phần ngày trong giá trị ngày đó.

Sau khi có các phân tích trên, ta có thể viết ngay đáp án. Bài này phức tạp là ở khâu xử lý ngày tháng, còn logic bên trong không hề khó.

**Đáp án**:

```sql
SELECT DATE_FORMAT(submit_time, '%Y%m') submit_month,
       count(question_id) month_q_cnt,
       ROUND(COUNT(question_id) / DAY (LAST_DAY(submit_time)), 3) avg_day_q_cnt
FROM practice_record
WHERE DATE_FORMAT(submit_time, '%Y') = '2021'
GROUP BY submit_month
UNION ALL
SELECT '2021汇总' AS submit_month,
       count(question_id) month_q_cnt,
       ROUND(COUNT(question_id) / 31, 3) avg_day_q_cnt
FROM practice_record
WHERE DATE_FORMAT(submit_time, '%Y') = '2021'
ORDER BY submit_month
```

Trong dữ liệu mẫu đầu ra, do dòng cuối cùng cần hiển thị dữ liệu tổng hợp nên ở đây cần dùng `UNION ALL` để thêm vào tập kết quả; đừng quên cuối cùng phải sắp xếp!

### Người dùng hợp lệ có số bài thi chưa hoàn thành lớn hơn 1 (Tương đối khó)

**Mô tả**: Bảng ghi chép làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số), dữ liệu mẫu như sau:

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-07-02 09:01:01 | 2021-07-02 09:21:01 | 80     |
| 2   | 1002 | 9001    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 81     |
| 3   | 1002 | 9002    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |
| 4   | 1002 | 9003    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 5   | 1002 | 9001    | 2021-07-02 19:01:01 | 2021-07-02 19:30:01 | 82     |
| 6   | 1002 | 9002    | 2021-07-05 18:01:01 | 2021-07-05 18:59:02 | 90     |
| 7   | 1003 | 9002    | 2021-07-06 12:01:01 | (NULL)              | (NULL) |
| 8   | 1003 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 86     |
| 9   | 1004 | 9003    | 2021-09-06 12:01:01 | (NULL)              | (NULL) |
| 10  | 1002 | 9003    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 81     |
| 11  | 1005 | 9001    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 88     |
| 12  | 1006 | 9002    | 2021-09-02 12:11:01 | 2021-09-02 12:31:01 | 89     |
| 13  | 1007 | 9002    | 2020-09-02 12:11:01 | 2020-09-02 12:31:01 | 89     |

Còn có bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành), dữ liệu mẫu như sau:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Hãy thống kê dữ liệu năm 2021 của những người dùng hợp lệ có số bài thi chưa hoàn thành lớn hơn 1 (người dùng hợp lệ là người có số bài thi hoàn thành ít nhất là 1 và số bài thi chưa hoàn thành nhỏ hơn 5), xuất ra ID người dùng, số bài thi chưa hoàn thành, số bài thi đã hoàn thành, tập hợp tag các bài thi đã từng làm, sắp xếp theo số bài thi chưa hoàn thành từ nhiều đến ít. Kết quả đầu ra mẫu như sau:

| uid  | incomplete_cnt | complete_cnt | detail                                                                      |
| ---- | -------------- | ------------ | --------------------------------------------------------------------------- |
| 1002 | 2              | 4            | 2021-09-01:算法;2021-07-02:SQL;2021-09-02:SQL;2021-09-05:SQL;2021-07-05:SQL |

**Giải thích**: Trong các bản ghi làm bài năm 2021, ngoại trừ 1004, tất cả người dùng khác đều thỏa mãn định nghĩa người dùng hợp lệ, nhưng chỉ có 1002 có số bài thi chưa hoàn thành lớn hơn 1, do đó chỉ hiển thị 1002. Trong cột `detail` là tập hợp `{ngày:tag}` các bài thi mà 1002 đã từng làm, ngày và tag được nối bằng dấu `:`, các phần tử phân cách nhau bằng dấu `;`.

**Ý tưởng:**

Sau khi đọc kỹ đề bài, phân tích thấy: Trước hết cần kết nối bảng, vì phía sau cần hiển thị `tag`;

Lọc dữ liệu năm 2021:

```sql
SELECT *
FROM exam_record er
LEFT JOIN examination_info ei ON er.exam_id = ei.exam_id
WHERE YEAR (er.start_time)= 2021
```

Phân nhóm theo `uid`, sau đó kiểm tra điều kiện đối với từng người dùng. Đề bài yêu cầu `hoàn thành ít nhất 1 bài, số bài chưa hoàn thành lớn hơn 1 và nhỏ hơn 5`.

Vậy lát nữa khi viết SQL, điều kiện sẽ là: `chưa_hoàn_thành > 1 and đã_hoàn_thành >= 1 and chưa_hoàn_thành < 5`

Vì cuối cùng cần nối chuỗi, hơn nữa còn là nối chuỗi có tổ hợp, ta có thể sử dụng hàm `GROUP_CONCAT`. Dưới đây là giới thiệu ngắn gọn về cách dùng của hàm này:

Cú pháp cơ bản:

```sql
GROUP_CONCAT([DISTINCT] expr [ORDER BY {unsigned_integer | col_name | expr} [ASC | DESC] [, ...]]             [SEPARATOR sep])
```

- `expr`: Cột hoặc biểu thức cần nối.
- `DISTINCT`: Tham số tùy chọn, dùng để loại bỏ trùng lặp. Khi chỉ định `DISTINCT`, các giá trị giống nhau chỉ xuất hiện một lần.
- `ORDER BY`: Tham số tùy chọn, dùng để sắp xếp các giá trị sau khi nối. Có thể chọn sắp xếp tăng dần (`ASC`) hoặc giảm dần (`DESC`).
- `SEPARATOR sep`: Tham số tùy chọn, dùng để thiết lập ký tự phân cách giữa các giá trị được nối. (Trong bài này dùng tham số này để đặt dấu `;`).

Hàm `GROUP_CONCAT()` thường được sử dụng trong mệnh đề `GROUP BY` để nối các giá trị của một nhóm hàng thành một chuỗi duy nhất và trả về dưới dạng tổng hợp trong tập kết quả.

**Đáp án**:

```sql
SELECT a.uid,
       SUM(CASE
               WHEN a.submit_time IS NULL THEN 1
           END) AS incomplete_cnt,
       SUM(CASE
               WHEN a.submit_time IS NOT NULL THEN 1
           END) AS complete_cnt,
       GROUP_CONCAT(DISTINCT CONCAT(DATE_FORMAT(a.start_time, '%Y-%m-%d'), ':', b.tag)
                     ORDER BY start_time SEPARATOR ";") AS detail
FROM exam_record a
LEFT JOIN examination_info b ON a.exam_id = b.exam_id
WHERE YEAR (a.start_time)= 2021
GROUP BY a.uid
HAVING incomplete_cnt > 1
AND complete_cnt >= 1
AND incomplete_cnt < 5
ORDER BY incomplete_cnt DESC
```

- `SUM(CASE WHEN a.submit_time IS NULL THEN 1 END)` thống kê số lượng bản ghi chưa hoàn thành của từng người dùng.
- `SUM(CASE WHEN a.submit_time IS NOT NULL THEN 1 END)` thống kê số lượng bản ghi đã hoàn thành của từng người dùng.
- `GROUP_CONCAT(DISTINCT CONCAT(DATE_FORMAT(a.start_time, '%Y-%m-%d'), ':', b.tag) ORDER BY a.start_time SEPARATOR ';')` nối ngày thi và nhãn (tag) của từng người dùng thành một chuỗi phân cách nhau bởi dấu chấm phẩy, được sắp xếp theo thời gian bắt đầu làm bài.

## Truy vấn con lồng nhau (Nested Subqueries)

### Thể loại ưa thích của những người dùng có số bài thi hoàn thành trung bình tháng không nhỏ hơn 3 (Tương đối khó)

**Mô tả**: Bảng ghi chép làm bài thi `exam_record` (`uid`: ID người dùng, `exam_id`: ID đề thi, `start_time`: thời gian bắt đầu làm bài, `submit_time`: thời gian nộp bài, nếu chưa nộp là NULL, `score`: điểm số), dữ liệu mẫu như sau:

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-07-02 09:01:01 | (NULL)              | (NULL) |
| 2   | 1002 | 9003    | 2021-09-01 12:01:01 | 2021-09-01 12:21:01 | 60     |
| 3   | 1002 | 9002    | 2021-09-02 12:01:01 | 2021-09-02 12:31:01 | 70     |
| 4   | 1002 | 9001    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 81     |
| 5   | 1002 | 9002    | 2021-07-06 12:01:01 | (NULL)              | (NULL) |
| 6   | 1003 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 86     |
| 7   | 1003 | 9003    | 2021-09-08 12:01:01 | 2021-09-08 12:11:01 | 40     |
| 8   | 1003 | 9001    | 2021-09-08 13:01:01 | (NULL)              | (NULL) |
| 9   | 1003 | 9002    | 2021-09-08 14:01:01 | (NULL)              | (NULL) |
| 10  | 1003 | 9003    | 2021-09-08 15:01:01 | (NULL)              | (NULL) |
| 11  | 1005 | 9001    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 88     |
| 12  | 1005 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 88     |
| 13  | 1005 | 9002    | 2021-09-02 12:11:01 | 2021-09-02 12:31:01 | 89     |

Bảng thông tin đề thi `examination_info` (`exam_id`: ID đề thi, `tag`: thể loại đề thi, `difficulty`: độ khó đề thi, `duration`: thời lượng thi, `release_time`: thời gian phát hành), dữ liệu mẫu như sau:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Hãy thống kê từ bảng các thể loại mà những người dùng có "số bài thi hoàn thành trung bình trong tháng" không nhỏ hơn 3 ưa thích làm và số lần làm các thể loại đó, xuất ra theo thứ tự số lần giảm dần. Kết quả mẫu như sau:

| tag  | tag_cnt |
| ---- | ------- |
| C++  | 4       |
| SQL  | 2       |
| 算法 | 1       |

**Giải thích**: Người dùng 1002 và 1005 trong tháng 09/2021 đều có số bài thi hoàn thành là 3, các người dùng khác đều nhỏ hơn 3; sau đó kết quả phân bố tag các bài thi mà người dùng 1002 và 1005 đã làm được sắp xếp giảm dần theo số lần làm bài lần lượt là C++, SQL, và `算法` (Thuật toán).

**Ý tưởng**: Bài này kiểm tra kỹ năng kết hợp truy vấn con, trọng tâm nằm ở chỗ `hoàn thành trung bình trong tháng >= 3`. Tuy nhiên theo nhận định cá nhân, đề bài diễn đạt chỗ này chưa thực sự rõ ràng, nếu nói thẳng là tìm trong tháng 9 thì sẽ dễ hiểu hơn rất nhiều; ở đây không phải là mỗi tháng đều phải >= 3 hay lấy tổng số lần làm chia cho tổng số tháng làm. Đừng hiểu nhầm chỗ này.

Trước hết truy vấn xem những người dùng nào có số bài hoàn thành trong một tháng từ 3 trở lên:

```sql
SELECT UID
FROM exam_record record
GROUP BY UID,
         MONTH (start_time)
HAVING count(submit_time) >= 3
```

Sau khi có bước này thì đi sâu hơn: chỉ cần hiểu được bước trên (ý tôi là không bị làm khó bởi từ "trung bình tháng" của đề bài), sau đó lồng thêm một truy vấn con để lọc những người dùng nằm trong danh sách đó, rồi lấy ra các cột mà đề bài yêu cầu. Nhớ sắp xếp!

```sql
SELECT tag,
       count(start_time) AS tag_cnt
FROM exam_record record
INNER JOIN examination_info info ON record.exam_id = info.exam_id
WHERE UID IN
    (SELECT UID
     FROM exam_record record
     GROUP BY UID,
              MONTH (start_time)
     HAVING count(submit_time) >= 3)
GROUP BY tag
ORDER BY tag_cnt DESC
```

### Số người làm bài và điểm trung bình trong ngày phát hành đề thi

**Mô tả**: Bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký), dữ liệu mẫu như sau:

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2100        | 6     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 1500        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1100        | 4     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

**Giải nghĩa**: Người dùng 1001 có biệt danh là `牛客 1 号`, điểm thành tựu là 3100, cấp độ người dùng là cấp 7, định hướng nghề nghiệp là Thuật toán (`算法`), thời gian đăng ký 2020-01-01 10:00:00.

Bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành), dữ liệu mẫu như sau:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Bảng ghi chép làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số), dữ liệu mẫu như sau:

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-07-02 09:01:01 | 2021-09-01 09:41:01 | 70     |
| 2   | 1002 | 9003    | 2021-09-01 12:01:01 | 2021-09-01 12:21:01 | 60     |
| 3   | 1002 | 9002    | 2021-09-02 12:01:01 | 2021-09-02 12:31:01 | 70     |
| 4   | 1002 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 80     |
| 5   | 1002 | 9003    | 2021-08-01 12:01:01 | 2021-08-01 12:21:01 | 60     |
| 6   | 1002 | 9002    | 2021-08-02 12:01:01 | 2021-08-02 12:31:01 | 70     |
| 7   | 1002 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 85     |
| 8   | 1002 | 9002    | 2021-07-06 12:01:01 | (NULL)              | (NULL) |
| 9   | 1003 | 9002    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 86     |
| 10  | 1003 | 9003    | 2021-09-08 12:01:01 | 2021-09-08 12:11:01 | 40     |
| 11  | 1003 | 9003    | 2021-09-01 13:01:01 | 2021-09-01 13:41:01 | 70     |
| 12  | 1003 | 9001    | 2021-09-08 14:01:01 | (NULL)              | (NULL) |
| 13  | 1003 | 9002    | 2021-09-08 15:01:01 | (NULL)              | (NULL) |
| 14  | 1005 | 9001    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 90     |
| 15  | 1005 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 88     |
| 16  | 1005 | 9002    | 2021-09-02 12:11:01 | 2021-09-02 12:31:01 | 89     |

Hãy tính số người dùng trên cấp 5 làm bài `uv` và điểm trung bình `avg_score` trong ngày phát hành của mỗi đề thi thuộc thể loại SQL; sắp xếp giảm dần theo số người làm bài, nếu số người bằng nhau thì sắp xếp tăng dần theo điểm trung bình. Kết quả mẫu như sau:

| exam_id | uv  | avg_score |
| ------- | --- | --------- |
| 9001    | 3   | 81.3      |

Giải thích: Chỉ có một đề thi thuộc thể loại SQL với ID là 9001. Vào ngày phát hành (2021-09-01) có các người dùng 1001, 1002, 1003, 1005 làm bài, nhưng 1003 chỉ là người dùng cấp 5, 3 người còn lại đều trên cấp 5. Điểm số của ba người này gồm [70, 80, 85, 90], điểm trung bình là 81.3 (làm tròn 1 chữ số thập phân).

**Ý tưởng**: Bài này nhìn qua có vẻ rất phức tạp, nhưng trước tiên hãy chia nhỏ các điều kiện "bên ngoài" từng bước một, sau đó ghép lại với nhau là đáp án sẽ lộ diện. Đối với truy vấn nhiều bảng, hãy luôn nhớ: Đi từ ngoài vào trong, bóc tách từng lớp.

Trước hết kết nối 3 bảng lại với nhau, đồng thời đặt ra một số điều kiện, ví dụ đề bài yêu cầu người dùng có `cấp độ > 5`, ta có thể truy vấn trước:

```sql
SELECT DISTINCT u_info.uid
FROM examination_info e_info
INNER JOIN exam_record record
INNER JOIN user_info u_info
WHERE e_info.exam_id = record.exam_id
  AND u_info.uid = record.uid
  AND u_info.LEVEL > 5
```

Tiếp theo chú ý yêu cầu đề bài: `Người dùng làm bài ngay trong ngày phát hành của mỗi đề thi thuộc thể loại SQL`, chú ý từ ==trong ngày==, ta phải nghĩ ngay đến việc so sánh ngày tháng.

So sánh ngày phát hành đề thi và ngày bắt đầu làm bài: `DATE(e_info.release_time) = DATE(record.start_time)`; không cần lo lắng về việc `submit_time` bị null, vì sau đó sẽ được lọc bỏ trong mệnh đề WHERE.

**Đáp án**:

```sql
SELECT record.exam_id AS exam_id,
       COUNT(DISTINCT u_info.uid) AS uv,
       ROUND(SUM(record.score) / COUNT(u_info.uid), 1) AS avg_score
FROM examination_info e_info
INNER JOIN exam_record record
INNER JOIN user_info u_info
WHERE e_info.exam_id = record.exam_id
  AND u_info.uid = record.uid
  AND DATE (e_info.release_time) = DATE (record.start_time)
  AND submit_time IS NOT NULL
  AND tag = 'SQL'
  AND u_info.LEVEL > 5
GROUP BY record.exam_id
ORDER BY uv DESC,
         avg_score ASC
```

Lưu ý việc phân nhóm và sắp xếp ở cuối! Trước tiên sắp xếp theo số người làm bài, nếu trùng nhau thì sắp xếp theo điểm trung bình.

### Phân bố cấp độ người dùng của những người có điểm thi từng lớn hơn 80

**Mô tả**:

Bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2100        | 6     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 1500        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1100        | 4     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

Bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Bảng ghi chép làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:41:01 | 79     |
| 2   | 1002 | 9003    | 2021-09-01 12:01:01 | 2021-09-01 12:21:01 | 60     |
| 3   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 4   | 1002 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 80     |
| 5   | 1002 | 9003    | 2021-08-01 12:01:01 | 2021-08-01 12:21:01 | 60     |
| 6   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 7   | 1002 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 85     |
| 8   | 1002 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 9   | 1003 | 9002    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 86     |
| 10  | 1003 | 9003    | 2021-09-08 12:01:01 | 2021-09-08 12:11:01 | 40     |
| 11  | 1003 | 9003    | 2021-09-01 13:01:01 | 2021-09-01 13:41:01 | 81     |
| 12  | 1003 | 9001    | 2021-09-01 14:01:01 | (NULL)              | (NULL) |
| 13  | 1003 | 9002    | 2021-09-08 15:01:01 | (NULL)              | (NULL) |
| 14  | 1005 | 9001    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 90     |
| 15  | 1005 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 88     |
| 16  | 1005 | 9002    | 2021-09-02 12:11:01 | 2021-09-02 12:31:01 | 89     |

Thống kê phân bố cấp độ người dùng của những người làm đề thi thuộc thể loại SQL có điểm thi từng lớn hơn 80, sắp xếp giảm dần theo số lượng (đảm bảo số lượng ở các cấp độ đều khác nhau). Kết quả mẫu như sau:

| level | level_cnt |
| ----- | --------- |
| 6     | 2         |
| 5     | 1         |

Giải thích: 9001 là đề thi thuộc thể loại SQL, những người làm bài thi này đạt điểm trên 80 gồm 1002, 1003, 1005 tổng cộng 3 người; trong đó cấp 6 có 2 người, cấp 5 có 1 người.

**Ý tưởng:** Bài này sử dụng cùng bộ dữ liệu với bài trước, chỉ thay đổi điều kiện truy vấn. Đã hiểu bài trước thì bài này có thể làm xong trong nháy mắt.

**Đáp án**:

```sql
SELECT u_info.LEVEL AS LEVEL,
       count(u_info.uid) AS level_cnt
FROM examination_info e_info
INNER JOIN exam_record record
INNER JOIN user_info u_info
WHERE e_info.exam_id = record.exam_id
  AND u_info.uid = record.uid
  AND record.score > 80
  AND submit_time IS NOT NULL
  AND tag = 'SQL'
GROUP BY LEVEL
ORDER BY level_cnt DESC
```

## Truy vấn hợp nhất (UNION / UNION ALL)

### Số người và số lượt làm bài của từng câu hỏi và từng đề thi

**Mô tả**:

Bảng ghi chép làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:41:01 | 81     |
| 2   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 3   | 1002 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 80     |
| 4   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 5   | 1004 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 85     |
| 6   | 1002 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |

Bảng ghi chép luyện tập câu hỏi `practice_record` (`uid` ID người dùng, `question_id` ID câu hỏi, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | question_id | submit_time         | score |
| --- | ---- | ----------- | ------------------- | ----- |
| 1   | 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 2   | 1002 | 8001        | 2021-09-02 19:30:01 | 50    |
| 3   | 1002 | 8001        | 2021-09-02 19:20:01 | 70    |
| 4   | 1002 | 8002        | 2021-09-02 19:38:01 | 70    |
| 5   | 1003 | 8001        | 2021-08-02 19:38:01 | 70    |
| 6   | 1003 | 8001        | 2021-08-02 19:48:01 | 90    |
| 7   | 1003 | 8002        | 2021-08-01 19:38:01 | 80    |

Hãy thống kê số người và số lượt làm của từng câu hỏi và từng đề thi, hiển thị theo thứ tự giảm dần của uv & pv tương ứng cho "đề thi" và "câu hỏi". Kết quả mẫu như sau:

| tid  | uv  | pv  |
| ---- | --- | --- |
| 9001 | 3   | 3   |
| 9002 | 1   | 3   |
| 8001 | 3   | 5   |
| 8002 | 2   | 2   |

**Giải thích**: "Đề thi": có 3 người luyện tập tổng cộng 3 lượt đề thi 9001, 1 người làm 3 lượt đề thi 9002; "Luyện câu hỏi": có 3 người làm 5 lượt câu 8001, có 2 người làm 2 lượt câu 8002.

**Ý tưởng**: Điểm khó và dễ sai của bài này nằm ở vấn đề sử dụng đồng thời `UNION` và `ORDER BY`.

Có một số trường hợp như sau: Sử dụng `UNION` và nhiều mệnh đề `ORDER BY` mà không có dấu ngoặc đơn `()` sẽ báo lỗi!

`ORDER BY` trong các mệnh đề con được liên kết bằng `UNION` sẽ không có tác dụng;

Ví dụ không thêm ngoặc đơn:

```sql
SELECT exam_id AS tid,
       COUNT(DISTINCT UID) AS uv,
       COUNT(UID) AS pv
FROM exam_record
GROUP BY exam_id
ORDER BY uv DESC,
         pv DESC
UNION
SELECT question_id AS tid,
       COUNT(DISTINCT UID) AS uv,
       COUNT(UID) AS pv
FROM practice_record
GROUP BY question_id
ORDER BY uv DESC,
         pv DESC
```

Sẽ trực tiếp báo lỗi cú pháp. Nếu không có dấu ngoặc đơn thì chỉ có thể có một mệnh đề `ORDER BY` ở cuối cùng.

Còn một trường hợp nữa là `ORDER BY` không có tác dụng, nhưng lại có tác dụng trong mệnh đề con của mệnh đề con. Giải pháp ở đây là bọc thêm một lớp truy vấn SELECT ở bên ngoài.

**Đáp án**:

```sql
SELECT *
FROM
  (SELECT exam_id AS tid,
          COUNT(DISTINCT exam_record.uid) uv,
          COUNT(*) pv
   FROM exam_record
   GROUP BY exam_id
   ORDER BY uv DESC, pv DESC) t1
UNION
SELECT *
FROM
  (SELECT question_id AS tid,
          COUNT(DISTINCT practice_record.uid) uv,
          COUNT(*) pv
   FROM practice_record
   GROUP BY question_id
   ORDER BY uv DESC, pv DESC) t2;
```

### Những người thỏa mãn riêng từng điều kiện của hai chương trình hoạt động

**Mô tả**: Để khuyến khích nhiều người dùng học tập và tiến bộ hơn khi luyện bài trên nền tảng Nowcoder, chúng tôi thường xuyên phát phúc lợi cho những người dùng tích cực và có thành tích tốt. Giả sử trước đây chúng tôi có hai đợt hoạt động vận hành: đợt 1 phát phiếu phúc lợi cho những người mà mỗi lần làm bài thi đều đạt từ 85 điểm trở lên (`activity1`); đợt 2 phát cho những người có ít nhất một lần hoàn thành đề thi độ khó cao chỉ trong vòng một nửa thời gian quy định và đạt điểm trên 80 (`activity2`).

Bây giờ, bạn cần lọc ra cùng một lúc những người thỏa mãn hai chương trình hoạt động này để bàn giao cho bộ phận vận hành. Hãy viết một câu lệnh SQL thực hiện: Xuất ra ID người dùng và mã hoạt động của tất cả những người trong năm 2021 có điểm mỗi lần làm bài thi đều đạt từ 85 điểm trở lên, cùng những người có ít nhất một lần hoàn thành đề thi độ khó cao trong nửa thời gian quy định và đạt trên 80 điểm; sắp xếp theo ID người dùng.

Bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Bảng ghi chép làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 81     |
| 2   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 3   | 1003 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | **86** |
| 4   | 1003 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 89     |
| 5   | 1004 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:30:01 | 85     |

Dữ liệu đầu ra mẫu:

| uid  | activity  |
| ---- | --------- |
| 1001 | activity2 |
| 1003 | activity1 |
| 1004 | activity1 |
| 1004 | activity2 |

**Giải thích**: Người dùng 1001 có điểm thấp nhất là 81 nên không thỏa mãn hoạt động 1, nhưng đã hoàn thành đề thi thời lượng 60 phút chỉ trong 29 phút 59 giây và đạt 81 điểm, thỏa mãn hoạt động 2; 1003 có điểm thấp nhất là 86 nên thỏa mãn hoạt động 1, nhưng thời gian hoàn thành đều lớn hơn một nửa thời lượng thi nên không thỏa mãn hoạt động 2; người dùng 1004 hoàn thành bài thi vừa vặn trong một nửa thời gian (đúng 30 phút) và đạt 85 điểm nên thỏa mãn cả hoạt động 1 và hoạt động 2.

**Ý tưởng**: Bài này cần liên quan đến phép trừ thời gian, cần dùng hàm `TIMESTAMPDIFF()` để tính toán chênh lệch số phút giữa hai mốc thời gian.

Dưới đây chúng ta xem cách dùng cơ bản:

Ví dụ:

```sql
TIMESTAMPDIFF(MINUTE, start_time, end_time)
```

Tham số đầu tiên của hàm `TIMESTAMPDIFF()` là đơn vị thời gian, ở đây chúng ta chọn `MINUTE` biểu thị trả về độ chênh lệch theo phút. Tham số thứ hai là mốc thời gian sớm hơn, tham số thứ ba là mốc thời gian muộn hơn. Hàm sẽ trả về giá trị chênh lệch số phút giữa hai mốc này.

Sau khi hiểu cách dùng của hàm này, quay lại xem yêu cầu của `activity1`: điểm số mỗi lần đều đạt từ 85 trở lên, ta viết câu lệnh này trước để các bước sau rõ ràng hơn:

```sql
SELECT DISTINCT UID
FROM exam_record
WHERE score >= 85
  AND YEAR (start_time) = '2021'
```

Theo điều kiện 2, tiếp tục viết truy vấn cho `những người hoàn thành đề thi độ khó cao trong một nửa thời gian và điểm lớn hơn hoặc bằng 80`:

```sql
SELECT UID
FROM examination_info info
INNER JOIN exam_record record
WHERE info.exam_id = record.exam_id
  AND (TIMESTAMPDIFF(MINUTE, start_time, submit_time)) < (info.duration / 2)
  AND difficulty = 'hard'
  AND score >= 80
```

Sau đó dùng `UNION` hai kết quả lại với nhau (ở đây cần đặc biệt lưu ý vấn đề dấu ngoặc đơn và vị trí của `ORDER BY`, cách dùng chi tiết đã được đề cập ở bài trước).

**Đáp án**:

```sql
SELECT DISTINCT UID UID,
                    'activity1' activity
FROM exam_record
WHERE UID not in
    (SELECT UID
     FROM exam_record
     WHERE score<85
       AND YEAR(submit_time) = 2021 )
UNION
SELECT DISTINCT UID UID,
                    'activity2' activity
FROM exam_record e_r
LEFT JOIN examination_info e_i ON e_r.exam_id = e_i.exam_id
WHERE YEAR(submit_time) = 2021
  AND difficulty = 'hard'
  AND TIMESTAMPDIFF(SECOND, start_time, submit_time) <= duration *30
  AND score>80
ORDER BY UID
```

## Truy vấn kết nối (JOIN Queries)

### Số bài thi hoàn thành và số câu hỏi luyện tập của người dùng thỏa mãn điều kiện (Khó)

**Mô tả**:

Bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2300        | 7     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 2500        | 7     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 2000        | 6     | C++  | 2020-01-01 10:00:00 |

Bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | hard       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Bảng ghi chép làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score |
| --- | ---- | ------- | ------------------- | ------------------- | ----- |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 81    |
| 2   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 81    |
| 3   | 1003 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 86    |
| 4   | 1003 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:51 | 89    |
| 5   | 1004 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:30:01 | 85    |
| 6   | 1005 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:02 | 85    |
| 7   | 1006 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:21:01 | 84    |
| 8   | 1006 | 9001    | 2021-09-07 10:01:01 | 2021-09-07 10:21:01 | 80    |

Bảng ghi chép luyện tập câu hỏi `practice_record` (`uid` ID người dùng, `question_id` ID câu hỏi, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | question_id | submit_time         | score |
| --- | ---- | ----------- | ------------------- | ----- |
| 1   | 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 2   | 1002 | 8001        | 2021-09-02 19:30:01 | 50    |
| 3   | 1002 | 8001        | 2021-09-02 19:20:01 | 70    |
| 4   | 1002 | 8002        | 2021-09-02 19:38:01 | 70    |
| 5   | 1004 | 8001        | 2021-08-02 19:38:01 | 70    |
| 6   | 1004 | 8002        | 2021-08-02 19:48:01 | 90    |
| 7   | 1001 | 8002        | 2021-08-02 19:38:01 | 70    |
| 8   | 1004 | 8002        | 2021-08-02 19:48:01 | 90    |
| 9   | 1004 | 8002        | 2021-08-02 19:58:01 | 94    |
| 10  | 1004 | 8003        | 2021-08-02 19:38:01 | 70    |
| 11  | 1004 | 8003        | 2021-08-02 19:48:01 | 90    |
| 12  | 1004 | 8003        | 2021-08-01 19:38:01 | 80    |

Hãy tìm những đại thần tên đỏ cấp 7 có điểm trung bình các bài thi SQL độ khó cao lớn hơn 80, thống kê tổng số lần hoàn thành bài thi và tổng số lần luyện tập câu hỏi trong năm 2021 của họ; chỉ giữ lại những người dùng có bản ghi hoàn thành bài thi trong năm 2021. Kết quả sắp xếp tăng dần theo số bài thi hoàn thành, giảm dần theo số câu hỏi luyện tập.

Dữ liệu đầu ra mẫu như sau:

| uid  | exam_cnt | question_cnt |
| ---- | -------- | ------------ |
| 1001 | 1        | 2            |
| 1003 | 2        | 0            |

Giải thích: Các người dùng 1001, 1003, 1004, 1006 thỏa mãn điểm trung bình đề thi SQL độ khó cao lớn hơn 80, nhưng chỉ có 1001, 1003 là đại thần tên đỏ cấp 7; 1001 đã hoàn thành 1 lần đề thi 9001, luyện tập 2 lần câu hỏi; 1003 hoàn thành 2 lần đề thi 9001, 9002, chưa từng luyện tập câu hỏi nào (do đó số lượng đếm là 0).

**Ý tưởng:**

Trước hết thực hiện sàng lọc sơ bộ các điều kiện, ví dụ tìm ra những người dùng đã từng làm đề thi SQL độ khó cao:

```sql
SELECT
	record.uid
FROM
	exam_record record
	INNER JOIN examination_info e_info ON record.exam_id = e_info.exam_id
	JOIN user_info u_info ON record.uid = u_info.uid
WHERE
	e_info.tag = 'SQL'
	AND e_info.difficulty = 'hard'
```

Sau đó dựa theo yêu cầu đề bài, tiếp tục lồng thêm các điều kiện vào bên trong;

Tuy nhiên ở đây cần đặc biệt lưu ý:

Thứ nhất: Không thể đặt điều kiện `YEAR(submit_time)= 2021` xuống cuối cùng (mệnh đề WHERE), mà phải đặt trong điều kiện `ON` của phép nối. Bởi vì trong phép nối ngoài bên trái (`LEFT JOIN`), toàn bộ các hàng của bảng bên trái sẽ được giữ lại và bảng bên phải có thể là NULL. Việc đặt điều kiện vào mệnh đề `ON` của `JOIN` nhằm đảm bảo khi kết nối hai bảng, chỉ những bản ghi thỏa mãn điều kiện năm mới được kết nối. Điều này giúp tránh việc các bản ghi của các năm khác bị tính vào tập kết quả. Cụ thể, 1001 từng làm bài thi năm 2021 nhưng không luyện tập câu hỏi nào, nếu đưa điều kiện xuống cuối cùng sẽ loại bỏ mất trường hợp này.

Thứ hai: Bắt buộc phải là `COUNT(distinct er.exam_id) exam_cnt, COUNT(distinct pr.id) question_cnt`, cần phải thêm `DISTINCT` vì phép `LEFT JOIN` sinh ra nhiều giá trị trùng lặp.

**Đáp án**:

```sql
SELECT er.uid AS UID,
       count(DISTINCT er.exam_id) AS exam_cnt,
       count(DISTINCT pr.id) AS question_cnt
FROM exam_record er
LEFT JOIN practice_record pr ON er.uid = pr.uid
AND YEAR (er.submit_time)= 2021
AND YEAR (pr.submit_time)= 2021
WHERE er.uid IN
    (SELECT er.uid
     FROM exam_record er
     LEFT JOIN examination_info ei ON er.exam_id = ei.exam_id
     LEFT JOIN user_info ui ON er.uid = ui.uid
     WHERE tag = 'SQL'
       AND difficulty = 'hard'
       AND LEVEL = 7
     GROUP BY er.uid
     HAVING avg(score) > 80)
GROUP BY er.uid
ORDER BY exam_cnt,
         question_cnt DESC
```

Có thể những bạn tinh ý sẽ nhận ra: Tại sao rõ ràng đã giới hạn điều kiện `tag = 'SQL' AND difficulty = 'hard'`, nhưng người dùng 1003 vẫn truy vấn ra được hai bản ghi bài thi, trong đó có một bài thi có `tag` là `C++`? Đó là do đặc tính của `LEFT JOIN`, ngay cả khi không có hàng nào khớp với bảng bên phải thì tất cả các bản ghi của bảng bên trái vẫn được giữ lại.

### Tình hình hoạt động của từng người dùng cấp 6/7 (Khó)

**Mô tả**:

Bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2300        | 7     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 2500        | 7     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 2600        | 7     | C++  | 2020-01-01 10:00:00 |

Bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Bảng ghi chép làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| uid  | exam_id | start_time          | submit_time         | score  |
| ---- | ------- | ------------------- | ------------------- | ------ |
| 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 78     |
| 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 81     |
| 1005 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:30:01 | 85     |
| 1005 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:02 | 85     |
| 1006 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:21:59 | 84     |
| 1006 | 9001    | 2021-09-07 10:01:01 | 2021-09-07 10:21:01 | 81     |
| 1002 | 9001    | 2020-09-01 13:01:01 | 2020-09-01 13:41:01 | 81     |
| 1005 | 9001    | 2021-09-01 14:01:01 | (NULL)              | (NULL) |

Bảng ghi chép luyện tập câu hỏi `practice_record` (`uid` ID người dùng, `question_id` ID câu hỏi, `submit_time` thời gian nộp bài, `score` điểm số):

| uid  | question_id | submit_time         | score |
| ---- | ----------- | ------------------- | ----- |
| 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 1004 | 8001        | 2021-08-02 19:38:01 | 70    |
| 1004 | 8002        | 2021-08-02 19:48:01 | 90    |
| 1001 | 8002        | 2021-08-02 19:38:01 | 70    |
| 1004 | 8002        | 2021-08-02 19:48:01 | 90    |
| 1006 | 8002        | 2021-08-04 19:58:01 | 94    |
| 1006 | 8003        | 2021-08-03 19:38:01 | 70    |
| 1006 | 8003        | 2021-08-02 19:48:01 | 90    |
| 1006 | 8003        | 2020-08-01 19:38:01 | 80    |

Hãy thống kê tổng số tháng hoạt động, số ngày hoạt động trong năm 2021, số ngày hoạt động làm bài thi trong năm 2021, số ngày hoạt động luyện tập câu hỏi trong năm 2021 của từng người dùng cấp 6/7; sắp xếp giảm dần theo tổng số tháng hoạt động và số ngày hoạt động trong năm 2021. Kết quả mẫu như sau:

| uid  | act_month_total | act_days_2021 | act_days_2021_exam |
| ---- | --------------- | ------------- | ------------------ |
| 1006 | 3               | 4             | 1                  |
| 1001 | 2               | 2             | 1                  |
| 1005 | 1               | 1             | 1                  |
| 1002 | 1               | 0             | 0                  |
| 1003 | 0               | 0             | 0                  |

**Giải thích**: Người dùng cấp 6/7 tổng cộng có 5 người, trong đó 1006 từng hoạt động trong 3 tháng là 202109, 202108, 202008; các ngày hoạt động trong năm 2021 gồm 20210907, 20210804, 20210803, 20210802 tổng cộng 4 ngày; năm 2021 ở khu vực làm bài thi hoạt động 1 ngày (20210907), ở khu vực luyện câu hỏi hoạt động 3 ngày.

**Ý tưởng:**

Mấu chốt của bài này nằm ở việc sử dụng biểu thức điều kiện `CASE WHEN THEN`, nếu không sẽ phải viết rất nhiều phép `LEFT JOIN` vì sẽ sinh ra rất nhiều tập kết quả.

Câu lệnh `CASE WHEN THEN` là một biểu thức điều kiện dùng trong SQL để thực hiện các thao tác khác nhau hoặc trả về các kết quả khác nhau dựa trên các điều kiện.

Cấu trúc cú pháp như sau:

```sql
CASE
    WHEN condition1 THEN result1
    WHEN condition2 THEN result2
    ...
    ELSE result
END
```

Trong cấu trúc này, có thể thêm nhiều mệnh đề `WHEN` tùy theo nhu cầu, sau mỗi mệnh đề `WHEN` là một điều kiện (condition) và một kết quả (result). Điều kiện có thể là bất kỳ biểu thức logic nào, nếu thỏa mãn điều kiện thì sẽ trả về kết quả tương ứng.

Mệnh đề `ELSE` ở cuối là tùy chọn, dùng để chỉ định kết quả trả về mặc định khi tất cả các điều kiện phía trước đều không thỏa mãn. Nếu không cung cấp mệnh đề `ELSE`, giá trị mặc định trả về sẽ là `NULL`.

Ví dụ:

```sql
SELECT score,
    CASE
        WHEN score >= 90 THEN '优秀'
        WHEN score >= 80 THEN '良好'
        WHEN score >= 60 THEN '及格'
        ELSE '不及格'
    END AS grade
FROM student_scores;
```

Trong ví dụ trên, dựa vào các khoảng điểm số (score) khác nhau của học sinh, câu lệnh `CASE WHEN THEN` sẽ trả về xếp loại (grade) tương ứng. Nếu điểm lớn hơn hoặc bằng 90 trả về 'Xuất sắc' (`优秀`); nếu điểm lớn hơn hoặc bằng 80 trả về 'Tốt' (`良好`); nếu điểm lớn hơn hoặc bằng 60 trả về 'Đạt' (`及格`); ngược lại trả về 'Không đạt' (`不及格`).

Sau khi nắm được cách sử dụng trên, quay lại xem bài toán: yêu cầu liệt kê các số ngày hoạt động khác nhau.

```sql
count(distinct act_month) as act_month_total,
count(distinct case when year(act_time)='2021'then act_day end) as act_days_2021,
count(distinct case when year(act_time)='2021' and tag='exam' then act_day end) as act_days_2021_exam,
count(distinct case when year(act_time)='2021' and tag='question'then act_day end) as act_days_2021_question
```

Ở đây `tag` là nhãn được gán trước để thuận tiện phân biệt trong truy vấn, tách riêng giữa bài thi và câu hỏi luyện tập.

Tìm người dùng ở khu vực làm bài thi:

```sql
SELECT
		uid,
		exam_id AS ans_id,
		start_time AS act_time,
		date_format( start_time, '%Y%m' ) AS act_month,
		date_format( start_time, '%Y%m%d' ) AS act_day,
		'exam' AS tag
	FROM
		exam_record
```

Tiếp theo là người dùng ở khu vực luyện câu hỏi:

```sql
SELECT
		uid,
		question_id AS ans_id,
		submit_time AS act_time,
		date_format( submit_time, '%Y%m' ) AS act_month,
		date_format( submit_time, '%Y%m%d' ) AS act_day,
		'question' AS tag
	FROM
		practice_record
```

Cuối cùng dùng `UNION ALL` gộp hai kết quả lại với nhau, và đừng quên sắp xếp kết quả ở cuối cùng (bài này mang hơi hướng tư tưởng của phương pháp chia để trị).

**Đáp án**:

```sql
SELECT user_info.uid,
       count(DISTINCT act_month) AS act_month_total,
       count(DISTINCT CASE
                          WHEN YEAR (act_time)= '2021' THEN act_day
                      END) AS act_days_2021,
       count(DISTINCT CASE
                          WHEN YEAR (act_time)= '2021'
                               AND tag = 'exam' THEN act_day
                      END) AS act_days_2021_exam,
       count(DISTINCT CASE
                          WHEN YEAR (act_time)= '2021'
                               AND tag = 'question' THEN act_day
                      END) AS act_days_2021_question
FROM
  (SELECT UID,
          exam_id AS ans_id,
          start_time AS act_time,
          date_format(start_time, '%Y%m') AS act_month,
          date_format(start_time, '%Y%m%d') AS act_day,
          'exam' AS tag
   FROM exam_record
   UNION ALL SELECT UID,
                    question_id AS ans_id,
                    submit_time AS act_time,
                    date_format(submit_time, '%Y%m') AS act_month,
                    date_format(submit_time, '%Y%m%d') AS act_day,
                    'question' AS tag
   FROM practice_record) total
RIGHT JOIN user_info ON total.uid = user_info.uid
WHERE user_info.LEVEL IN (6,
                          7)
GROUP BY user_info.uid
ORDER BY act_month_total DESC,
         act_days_2021 DESC
```
