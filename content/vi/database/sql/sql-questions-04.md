---
title: "Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 4)"
description: "Phần 4 trong loạt bài tổng hợp câu hỏi phỏng vấn SQL thường gặp, giải thích chi tiết cách dùng và ngữ cảnh ứng dụng của các Window Function (hàm cửa sổ) trong MySQL 8.0 như ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD."
category: Cơ sở dữ liệu
tag:
  - Nền tảng cơ sở dữ liệu
  - SQL
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn SQL,Window Functions,Hàm cửa sổ,ROW_NUMBER,RANK,DENSE_RANK,NTILE,LAG,LEAD,MySQL 8.0
lang: vi
sourceRef: zh-ref/database/sql/sql-questions-04.md
---

> Nguồn bài tập: [Nowcoder - Thử thách SQL nâng cao](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

Đối với các bài tập ở mức độ tương đối khó hoặc khó, bạn có thể cân nhắc bỏ qua tùy theo tình hình thực tế và nhu cầu ôn luyện phỏng vấn của bản thân.

## Các hàm cửa sổ chuyên dụng (Specialized Window Functions)

Phiên bản MySQL 8.0 đã chính thức hỗ trợ các Window Function (hàm cửa sổ). Dưới đây là các hàm cửa sổ phổ biến trong MySQL và cách sử dụng của chúng:

1. `ROW_NUMBER()`: Gán một giá trị số nguyên duy nhất cho từng hàng trong tập kết quả truy vấn.

```sql
SELECT col1, col2, ROW_NUMBER() OVER (ORDER BY col1) AS row_num
FROM table;
```

2. `RANK()`: Tính thứ hạng của từng hàng trong tập kết quả đã sắp xếp. Các hàng có cùng giá trị sẽ nhận cùng một thứ hạng, và thứ hạng tiếp theo sẽ bị nhảy cóc.

```sql
SELECT col1, col2, RANK() OVER (ORDER BY col1 DESC) AS ranking
FROM table;
```

3. `DENSE_RANK()`: Tính thứ hạng của từng hàng trong kết quả đã sắp xếp, giữ nguyên thứ hạng giống nhau cho các giá trị bằng nhau nhưng không nhảy cóc số thứ hạng tiếp theo.

```sql
SELECT col1, col2, DENSE_RANK() OVER (ORDER BY col1 DESC) AS ranking
FROM table;
```

4. `NTILE(n)`: Chia tập kết quả thành `n` nhóm (bucket) tương đối đều nhau và gán một số định danh nhóm cho mỗi hàng.

```sql
SELECT col1, col2, NTILE(4) OVER (ORDER BY col1) AS bucket
FROM table;
```

5. `SUM()`, `AVG()`, `COUNT()`, `MIN()`, `MAX()`: Các hàm tổng hợp này cũng có thể kết hợp với hàm cửa sổ để tính tổng, trung bình, đếm số lượng, giá trị nhỏ nhất và lớn nhất của cột được chỉ định trong phạm vi khung cửa sổ.

```sql
SELECT col1, col2, SUM(col1) OVER () AS sum_col
FROM table;
```

6. `LEAD()` và `LAG()`: Hàm `LEAD` dùng để lấy giá trị của hàng đứng sau hàng hiện tại theo một khoảng dịch chuyển (offset) nhất định, còn hàm `LAG` dùng để lấy giá trị của hàng đứng trước hàng hiện tại theo khoảng dịch chuyển nhất định.

```sql
SELECT col1, col2, LEAD(col1, 1) OVER (ORDER BY col1) AS next_col1,
                 LAG(col1, 1) OVER (ORDER BY col1) AS prev_col1
FROM table;
```

7. `FIRST_VALUE()` và `LAST_VALUE()`: Hàm `FIRST_VALUE` dùng để lấy giá trị đầu tiên của cột được chỉ định trong khung cửa sổ, còn hàm `LAST_VALUE` dùng để lấy giá trị cuối cùng của cột được chỉ định trong khung cửa sổ.

```sql
SELECT col1, col2, FIRST_VALUE(col2) OVER (PARTITION BY col1 ORDER BY col2) AS first_val,
                 LAST_VALUE(col2) OVER (PARTITION BY col1 ORDER BY col2) AS last_val
FROM table;
```

Các hàm cửa sổ thường phải đi kèm với mệnh đề `OVER` để xác định kích thước cửa sổ, quy tắc sắp xếp và cách phân vùng (partition).

### Top 3 điểm cao nhất theo từng thể loại đề thi

**Mô tả**:

Hiện có bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 78     |
| 2   | 1002 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 81     |
| 3   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 81     |
| 4   | 1003 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 86     |
| 5   | 1003 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:51 | 89     |
| 6   | 1004 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:30:01 | 85     |
| 7   | 1005 | 9003    | 2021-09-01 12:01:01 | 2021-09-01 12:31:02 | 85     |
| 8   | 1006 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:21:01 | 84     |
| 9   | 1003 | 9003    | 2021-09-08 12:01:01 | 2021-09-08 12:11:01 | 40     |
| 10  | 1003 | 9002    | 2021-09-01 14:01:01 | (NULL)              | (NULL) |

Tìm top 3 người có điểm thi cao nhất theo từng thể loại đề thi. Nếu hai người có điểm số cao nhất bằng nhau thì chọn người có điểm số thấp nhất lớn hơn; nếu vẫn bằng nhau thì chọn người có `uid` lớn hơn. Kết quả đầu ra từ dữ liệu mẫu như sau:

| tid  | uid  | ranking |
| ---- | ---- | ------- |
| SQL  | 1003 | 1       |
| SQL  | 1004 | 2       |
| SQL  | 1002 | 3       |
| 算法 | 1005 | 1       |
| 算法 | 1006 | 2       |
| 算法 | 1003 | 3       |

**Giải thích**: Các thể loại (tag) đề thi có bản ghi làm bài có điểm là SQL và `算法` (Thuật toán). Với đề thi SQL, các người dùng 1001, 1002, 1003, 1004 có điểm làm bài, với điểm cao nhất lần lượt là 81, 81, 89, 85, và điểm thấp nhất lần lượt là 78, 81, 86, 40. Do đó, khi xếp hạng theo điểm cao nhất trước rồi đến điểm thấp nhất, top 3 sẽ là 1003, 1004, 1002.

**Đáp án**:

```sql
SELECT tag,
       UID,
       ranking
FROM
  (SELECT b.tag AS tag,
          a.uid AS UID,
          ROW_NUMBER() OVER (PARTITION BY b.tag
                             ORDER BY b.tag,
                                      max(a.score) DESC,
                                      min(a.score) DESC,
                                      a.uid DESC) AS ranking
   FROM exam_record a
   LEFT JOIN examination_info b ON a.exam_id = b.exam_id
   GROUP BY b.tag,
            a.uid) t
WHERE ranking <= 3
```

### Đề thi có chênh lệch thời gian làm bài nhanh thứ hai và chậm thứ hai lớn hơn nửa thời lượng thi (Khá khó)

**Mô tả**:

Hiện có bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | hard       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:51:01 | 78     |
| 2   | 1001 | 9002    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 81     |
| 3   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 81     |
| 4   | 1003 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:59:01 | 86     |
| 5   | 1003 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:51 | 89     |
| 6   | 1004 | 9002    | 2021-09-01 19:01:01 | 2021-09-01 19:30:01 | 85     |
| 7   | 1005 | 9001    | 2021-09-01 12:01:01 | 2021-09-01 12:31:02 | 85     |
| 8   | 1006 | 9001    | 2021-09-07 10:02:01 | 2021-09-07 10:21:01 | 84     |
| 9   | 1003 | 9001    | 2021-09-08 12:01:01 | 2021-09-08 12:11:01 | 40     |
| 10  | 1003 | 9002    | 2021-09-01 14:01:01 | (NULL)              | (NULL) |
| 11  | 1005 | 9001    | 2021-09-01 14:01:01 | (NULL)              | (NULL) |
| 12  | 1003 | 9003    | 2021-09-08 15:01:01 | (NULL)              | (NULL) |

Tìm thông tin các đề thi có chênh lệch giữa thời gian làm bài nhanh thứ hai và chậm thứ hai lớn hơn một nửa thời lượng thi của đề thi đó, sắp xếp theo ID đề thi giảm dần. Kết quả đầu ra từ dữ liệu mẫu như sau:

| exam_id | duration | release_time        |
| ------- | -------- | ------------------- |
| 9001    | 60       | 2021-09-01 06:00:00 |

**Giải thích**: Đề thi 9001 có các khoảng thời gian làm bài là 50 phút, 58 phút, 30 phút 1 giây, 19 phút, 10 phút. Chênh lệch giữa thời gian làm bài chậm thứ hai (50 phút) và nhanh thứ hai (19 phút) là 50 phút - 19 phút = 31 phút. Thời lượng của đề thi là 60 phút, vì vậy thỏa mãn điều kiện chênh lệch lớn hơn một nửa thời lượng thi (30 phút). Xuất ra ID đề thi, thời lượng và thời gian phát hành.

**Ý tưởng:**

Bước 1: Tìm thứ hạng thời gian hoàn thành theo thứ tự tăng dần và giảm dần của mỗi đề thi (chính là bảng `a`);

Bước 2: Thực hiện INNER JOIN với bảng thông tin đề thi `b`, nhóm theo ID đề thi, dùng `HAVING` để lọc dữ liệu có thứ hạng bằng 2 ở cả hai chiều, đổi số giây thành phút để so sánh, cuối cùng sắp xếp theo ID đề thi giảm dần.

**Đáp án**:

```sql
SELECT a.exam_id,
       b.duration,
       b.release_time
FROM
  (SELECT exam_id,
          row_number() OVER (PARTITION BY exam_id
                             ORDER BY timestampdiff(SECOND, start_time, submit_time) DESC) rn1,
          row_number() OVER (PARTITION BY exam_id
                            ORDER BY timestampdiff(SECOND, start_time, submit_time) ASC) rn2,
                                              timestampdiff(SECOND, start_time, submit_time) timex
   FROM exam_record
   WHERE score IS NOT NULL ) a
INNER JOIN examination_info b ON a.exam_id = b.exam_id
GROUP BY a.exam_id
HAVING (max(IF (rn1 = 2, a.timex, 0))- max(IF (rn2 = 2, a.timex, 0)))/ 60 > b.duration / 2
ORDER BY a.exam_id DESC
```

### Khung thời gian tối đa giữa hai lần làm bài thi liên tiếp (Khá khó)

**Mô tả**:

Hiện có bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score |
| --- | ---- | ------- | ------------------- | ------------------- | ----- |
| 1   | 1006 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:21:02 | 84    |
| 2   | 1006 | 9001    | 2021-09-01 12:11:01 | 2021-09-01 12:31:01 | 89    |
| 3   | 1006 | 9002    | 2021-09-06 10:01:01 | 2021-09-06 10:21:01 | 81    |
| 4   | 1005 | 9002    | 2021-09-05 10:01:01 | 2021-09-05 10:21:01 | 81    |
| 5   | 1005 | 9001    | 2021-09-05 10:31:01 | 2021-09-05 10:51:01 | 81    |

Hãy tính khung thời gian tối đa giữa hai lần làm bài thi liên tiếp `days_window` trong năm 2021 đối với những người dùng có ít nhất hai ngày làm bài thi trong năm đó. Sau đó, dựa theo quy luật lịch sử của năm đó, tính xem trung bình trong `days_window` ngày người đó sẽ làm bao nhiêu bộ đề thi. Sắp xếp kết quả giảm dần theo khung thời gian tối đa và số bộ đề thi trung bình. Kết quả đầu ra từ dữ liệu mẫu như sau:

| uid  | days_window | avg_exam_cnt |
| ---- | ----------- | ------------ |
| 1006 | 6           | 2.57         |

**Giải thích**: Người dùng 1006 đã làm bài 3 lần vào các ngày 20210901, 20210906, 20210907. Khung thời gian tối đa giữa hai lần làm bài liên tiếp là 6 ngày (từ ngày 1 đến ngày 6). Trong khoảng thời gian 7 ngày từ ngày 1 đến ngày 7, người này đã làm tổng cộng 3 đề thi, trung bình mỗi ngày làm 3/7 = 0.428571 đề, vậy trong 6 ngày trung bình sẽ làm 0.428571 * 6 = 2.57 đề thi (làm tròn 2 chữ số thập phân); người dùng 1005 làm hai đề thi vào ngày 20210905, nhưng chỉ có bản ghi làm bài trong đúng 1 ngày nên bị lọc bỏ.

**Ý tưởng:**

Trong phần giải thích ở trên có gợi ý cần khử trùng lặp bản ghi làm bài, đừng để bị lừa, tuyệt đối không khử trùng lặp! Nếu khử trùng lặp sẽ không vượt qua được test case. Lưu ý điều kiện giới hạn thời gian là năm 2021;

Ngoài ra cần lưu ý độ lệch thời gian phải cộng thêm 1 ngày (+1); đồng thời chú ý ==chưa nộp bài cũng được tính vào==!!!! (Nói chung đề bài này mô tả không thật rõ ràng, ra đề chưa được tốt lắm).

**Đáp án**:

```sql
SELECT UID,
       max(datediff(next_time, start_time)) + 1 AS days_window,
       round(count(start_time)/(datediff(max(start_time), min(start_time))+ 1) * (max(datediff(next_time, start_time))+ 1), 2) AS avg_exam_cnt
FROM
  (SELECT UID,
          start_time,
          lead(start_time, 1) OVER (PARTITION BY UID
                                    ORDER BY start_time) AS next_time
   FROM exam_record
   WHERE YEAR (start_time) = '2021' ) a
GROUP BY UID
HAVING count(DISTINCT date(start_time)) > 1
ORDER BY days_window DESC,
         avg_exam_cnt DESC
```

### Tình hình hoàn thành của người dùng không có bài thi chưa hoàn thành trong 3 tháng gần nhất

**Mô tả**:

Hiện có bảng ghi nhận làm bài thi `exam_record` (`uid`: ID người dùng, `exam_id`: ID đề thi, `start_time`: thời gian bắt đầu làm bài, `submit_time`: thời gian nộp bài, nếu để trống thì đại diện cho việc chưa hoàn thành, `score`: điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1006 | 9003    | 2021-09-06 10:01:01 | 2021-09-06 10:21:02 | 84     |
| 2   | 1006 | 9001    | 2021-08-02 12:11:01 | 2021-08-02 12:31:01 | 89     |
| 3   | 1006 | 9002    | 2021-06-06 10:01:01 | 2021-06-06 10:21:01 | 81     |
| 4   | 1006 | 9002    | 2021-05-06 10:01:01 | 2021-05-06 10:21:01 | 81     |
| 5   | 1006 | 9001    | 2021-05-01 12:01:01 | (NULL)              | (NULL) |
| 6   | 1001 | 9001    | 2021-09-05 10:31:01 | 2021-09-05 10:51:01 | 81     |
| 7   | 1001 | 9003    | 2021-08-01 09:01:01 | 2021-08-01 09:51:11 | 78     |
| 8   | 1001 | 9002    | 2021-07-01 09:01:01 | 2021-07-01 09:31:00 | 81     |
| 9   | 1001 | 9002    | 2021-07-01 12:01:01 | 2021-07-01 12:31:01 | 81     |
| 10  | 1001 | 9002    | 2021-07-01 12:01:01 | (NULL)              | (NULL) |

Tìm số lượng đề thi đã hoàn thành của những người dùng không có đề thi nào ở trạng thái chưa hoàn thành trong 3 tháng gần nhất có bản ghi làm bài thi của họ. Xếp hạng giảm dần theo số lượng đề hoàn thành và ID người dùng. Kết quả đầu ra từ dữ liệu mẫu như sau:

| uid  | exam_complete_cnt |
| ---- | ----------------- |
| 1006 | 3                 |

**Giải thích**: Người dùng 1006 có 3 tháng gần nhất có bản ghi làm bài thi là 202109, 202108, 202106; tổng số đề thi đã làm là 3 và đều đã hoàn thành; Người dùng 1001 có 3 tháng gần nhất có bản ghi làm bài thi là 202109, 202108, 202107; số đề thi đã làm là 5, số đề hoàn thành là 4, do có đề thi chưa hoàn thành nên bị lọc bỏ.

**Ý tưởng:**

1. "Tìm số lượng đề thi đã hoàn thành của những người dùng không có đề thi nào ở trạng thái chưa hoàn thành trong 3 tháng gần nhất có bản ghi làm bài thi của họ": Nhìn vào câu này, trước hết chắc chắn phải gom nhóm theo từng người dùng.
2. Đối với 3 tháng gần nhất, có thể dùng xếp hạng dày đặc lặp liên tục (`DENSE_RANK`), sắp xếp giảm dần, lọc thứ hạng `dr <= 3`.
3. Thống kê số lượng làm bài.
4. Ghép các điều kiện còn lại (`count(dr) = count(score)`).
5. Sắp xếp kết quả.

**Đáp án**:

```sql
SELECT UID,
       count(score) exam_complete_cnt
FROM
  (SELECT *, DENSE_RANK() OVER (PARTITION BY UID
                             ORDER BY date_format(start_time, '%Y%m') DESC) dr
    FROM exam_record) t1
WHERE dr <= 3
GROUP BY UID
HAVING count(dr)= count(score)
ORDER BY exam_complete_cnt DESC,
         UID DESC
```

### Tình hình làm bài 3 tháng gần nhất của 50% người dùng có tỷ lệ chưa hoàn thành cao hơn (Khó)

**Mô tả**:

Hiện có bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tích, `level` cấp độ, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 3200        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 2500        | 6     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 2200        | 5     | 算法 | 2020-01-01 10:00:00 |

Bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag    | difficulty | duration | release_time        |
| --- | ------- | ------ | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL    | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL    | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | 算法   | hard       | 80       | 2020-01-01 10:00:00 |
| 4   | 9004    | PYTHON | medium     | 70       | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score |
| --- | ---- | ------- | ------------------- | ------------------- | ----- |
| 1   | 1001 | 9001    | 2020-01-01 09:01:01 | 2020-01-01 09:21:59 | 90    |
| 15  | 1002 | 9001    | 2020-01-01 18:01:01 | 2020-01-01 18:59:02 | 90    |
| 13  | 1001 | 9001    | 2020-01-02 10:01:01 | 2020-01-02 10:31:01 | 89    |
| 2   | 1002 | 9001    | 2020-01-20 10:01:01 |                     |       |
| 3   | 1002 | 9001    | 2020-02-01 12:11:01 |                     |       |
| 5   | 1001 | 9001    | 2020-03-01 12:01:01 |                     |       |
| 6   | 1002 | 9001    | 2020-03-01 12:01:01 | 2020-03-01 12:41:01 | 90    |
| 4   | 1003 | 9001    | 2020-03-01 19:01:01 |                     |       |
| 7   | 1002 | 9001    | 2020-05-02 19:01:01 | 2020-05-02 19:32:00 | 90    |
| 14  | 1001 | 9002    | 2020-01-01 12:11:01 |                     |       |
| 8   | 1001 | 9002    | 2020-01-02 19:01:01 | 2020-01-02 19:59:01 | 69    |
| 9   | 1001 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:20:01 | 99    |
| 10  | 1002 | 9002    | 2020-02-02 12:01:01 |                     |       |
| 11  | 1002 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:43:01 | 81    |
| 12  | 1002 | 9002    | 2020-03-02 12:11:01 |                     |       |
| 17  | 1001 | 9002    | 2020-05-05 18:01:01 |                     |       |
| 16  | 1002 | 9003    | 2020-05-06 12:01:01 |                     |       |

Hãy thống kê số lượng đề thi đã làm và số lượng đề hoàn thành trong từng tháng thuộc 3 tháng gần nhất có ghi nhận làm bài thi của các người dùng cấp 6 và cấp 7 thuộc top 50% người dùng có tỷ lệ chưa hoàn thành bài thi SQL cao hơn. Sắp xếp tăng dần theo ID người dùng và tháng.

Kết quả đầu ra từ dữ liệu mẫu như sau:

| uid  | start_month | total_cnt | complete_cnt |
| ---- | ----------- | --------- | ------------ |
| 1002 | 202002      | 3         | 1            |
| 1002 | 202003      | 2         | 1            |
| 1002 | 202005      | 2         | 1            |

Giải thích: Số bài thi chưa hoàn thành, tổng số bài đã làm và tỷ lệ chưa hoàn thành đối với đề thi SQL của từng người dùng như sau:

| uid  | incomplete_cnt | total_cnt | incomplete_rate |
| ---- | -------------- | --------- | --------------- |
| 1001 | 3              | 7         | 0.4286          |
| 1002 | 4              | 8         | 0.5000          |
| 1003 | 1              | 1         | 1.0000          |

1001, 1002, 1003 lần lượt xếp ở các vị trí phân vị 1.0, 0.5, 0.0, do đó top 50% người dùng có tỷ lệ cao hơn (vị trí phân vị ranking >= 0.5 khi sắp xếp theo thứ tự tăng dần) là 1002 và 1003;

1003 không phải là người dùng cấp 6 hoặc cấp 7;

Ba tháng gần nhất có ghi nhận làm bài thi của người dùng 1002 là 202005, 202003, 202002;

Trong ba tháng này, số bài làm của 1002 lần lượt là 3, 2, 2, và số bài hoàn thành lần lượt là 1, 1, 1.

**Ý tưởng:**

Điểm cần lưu ý: Đề bài yêu cầu tính tổng số lần làm bài và số lần hoàn thành đối với tất cả các loại đề thi, còn thể loại SQL chỉ dùng để giới hạn phạm vi tính thứ hạng tỷ lệ chưa hoàn thành, và cấp 6, 7 dùng để giới hạn bản ghi làm bài của người dùng.

Trước tiên tính thứ hạng tỷ lệ chưa hoàn thành:

```sql
SELECT UID,
       count(submit_time IS NULL
             OR NULL)/ count(start_time) AS num,
       PERCENT_RANK() OVER (
                            ORDER BY count(submit_time IS NULL
                                           OR NULL)/ count(start_time)) AS ranking
FROM exam_record
LEFT JOIN examination_info USING (exam_id)
WHERE tag = 'SQL'
GROUP BY UID
```

Tiếp theo lấy lịch sử làm bài trong 3 tháng gần nhất:

```sql
SELECT UID,
       date_format(start_time, '%Y%m') AS month_d,
       submit_time,
       exam_id,
       dense_rank() OVER (PARTITION BY UID
                          ORDER BY date_format(start_time, '%Y%m') DESC) AS ranking
FROM exam_record
LEFT JOIN user_info USING (UID)
WHERE LEVEL IN (6,7)
```

**Đáp án**:

```sql
SELECT t1.uid,
       t1.month_d,
       count(*) AS total_cnt,
       count(t1.submit_time) AS complete_cnt
FROM-- Đầu tiên tính thứ hạng tỷ lệ chưa hoàn thành

  (SELECT UID,
          count(submit_time IS NULL OR NULL)/ count(start_time) AS num,
          PERCENT_RANK() OVER (
                               ORDER BY count(submit_time IS NULL OR NULL)/ count(start_time)) AS ranking
   FROM exam_record
   LEFT JOIN examination_info USING (exam_id)
   WHERE tag = 'SQL'
   GROUP BY UID) t
INNER JOIN
  (-- Tiếp theo lấy lịch sử làm bài trong 3 tháng gần nhất
 SELECT UID,
        date_format(start_time, '%Y%m') AS month_d,
        submit_time,
        exam_id,
        dense_rank() OVER (PARTITION BY UID
                           ORDER BY date_format(start_time, '%Y%m') DESC) AS ranking
   FROM exam_record
   LEFT JOIN user_info USING (UID)
   WHERE LEVEL IN (6,7) ) t1 USING (UID)
WHERE t1.ranking <= 3 AND t.ranking >= 0.5 -- Dùng điều kiện ràng buộc để tìm các bản ghi phù hợp

GROUP BY t1.uid,
         t1.month_d
ORDER BY t1.uid,
         t1.month_d
```

### Tốc độ tăng trưởng và thay đổi thứ hạng số lượt hoàn thành đề thi so với cùng kỳ năm 2020 (Khó)

**Mô tả**:

Hiện có bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag    | difficulty | duration | release_time        |
| --- | ------- | ------ | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL    | hard       | 60       | 2021-01-01 10:00:00 |
| 2   | 9002    | C++    | hard       | 80       | 2021-01-01 10:00:00 |
| 3   | 9003    | 算法   | hard       | 80       | 2021-01-01 10:00:00 |
| 4   | 9004    | PYTHON | medium     | 70       | 2021-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score |
| --- | ---- | ------- | ------------------- | ------------------- | ----- |
| 1   | 1001 | 9001    | 2020-08-02 10:01:01 | 2020-08-02 10:31:01 | 89    |
| 2   | 1002 | 9001    | 2020-04-01 18:01:01 | 2020-04-01 18:59:02 | 90    |
| 3   | 1001 | 9001    | 2020-04-01 09:01:01 | 2020-04-01 09:21:59 | 80    |
| 5   | 1002 | 9001    | 2021-03-02 19:01:01 | 2021-03-02 19:32:00 | 20    |
| 8   | 1003 | 9001    | 2021-05-02 12:01:01 | 2021-05-02 12:31:01 | 98    |
| 13  | 1003 | 9001    | 2020-01-02 10:01:01 | 2020-01-02 10:31:01 | 89    |
| 9   | 1001 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:20:01 | 99    |
| 10  | 1002 | 9002    | 2021-02-02 12:01:01 | 2020-02-02 12:43:01 | 81    |
| 11  | 1001 | 9002    | 2020-01-02 19:01:01 | 2020-01-02 19:59:01 | 69    |
| 16  | 1002 | 9002    | 2020-02-02 12:01:01 |                     |       |
| 17  | 1002 | 9002    | 2020-03-02 12:11:01 |                     |       |
| 18  | 1001 | 9002    | 2021-05-05 18:01:01 |                     |       |
| 4   | 1002 | 9003    | 2021-01-20 10:01:01 | 2021-01-20 10:10:01 | 81    |
| 6   | 1001 | 9003    | 2021-04-02 19:01:01 | 2021-04-02 19:40:01 | 89    |
| 15  | 1002 | 9003    | 2021-01-01 18:01:01 | 2021-01-01 18:59:02 | 90    |
| 7   | 1004 | 9004    | 2020-05-02 12:01:01 | 2020-05-02 12:20:01 | 99    |
| 12  | 1001 | 9004    | 2021-09-02 12:11:01 |                     |       |
| 14  | 1002 | 9004    | 2020-01-01 12:11:01 | 2020-01-01 12:31:01 | 83    |

Hãy tính tốc độ tăng trưởng số lượt hoàn thành của các loại đề thi trong nửa đầu năm 2021 so với cùng kỳ nửa đầu năm 2020 (định dạng phần trăm, làm tròn 1 chữ số thập phân), cùng với sự thay đổi thứ hạng về số lượt hoàn thành. Sắp xếp giảm dần theo tốc độ tăng trưởng và thứ hạng năm 2021.

Kết quả đầu ra từ dữ liệu mẫu như sau:

| tag | exam_cnt_20 | exam_cnt_21 | growth_rate | exam_cnt_rank_20 | exam_cnt_rank_21 | rank_delta |
| --- | ----------- | ----------- | ----------- | ---------------- | ---------------- | ---------- |
| SQL | 3           | 2           | -33.3%      | 1                | 2                | 1          |

Giải thích: Trong nửa đầu năm 2020 có 3 tag có bản ghi hoàn thành bài thi là C++, SQL, PYTHON, số lượt hoàn thành lần lượt là 3, 3, 2, thứ hạng số lượt hoàn thành lần lượt là 1, 1 (đồng hạng), 3;

Trong nửa đầu năm 2021 có 2 tag có bản ghi hoàn thành bài thi là `算法` (Thuật toán) và SQL, số lượt hoàn thành lần lượt là 3, 2, thứ hạng số lượt hoàn thành lần lượt là 1, 2; cụ thể như sau:

| tag    | start_year | exam_cnt | exam_cnt_rank |
| ------ | ---------- | -------- | ------------- |
| C++    | 2020       | 3        | 1             |
| SQL    | 2020       | 3        | 1             |
| PYTHON | 2020       | 2        | 3             |
| 算法   | 2021       | 3        | 1             |
| SQL    | 2021       | 2        | 2             |

Do đó, tag duy nhất có thể đưa ra kết quả so sánh cùng kỳ (YoY) là SQL. Từ năm 2020 đến năm 2021, số lượt hoàn thành từ 3 => 2, giảm 33.3% (làm tròn 1 chữ số thập phân); thứ hạng từ 1 => 2, tụt 1 hạng.

**Ý tưởng:**

Điểm khó của bài này là kiểu dữ liệu số nguyên lớn không dấu (unsigned) không được phép tạo ra số âm khi trừ, do đó cần dùng hàm `CAST` để chuyển kiểu dữ liệu sang `signed`.

Công thức tính tốc độ tăng trưởng được sử dụng: `(exam_cnt_21 - exam_cnt_20) / exam_cnt_20`

Sự thay đổi thứ hạng số lượt hoàn thành (so sánh năm 2021 với 2020 tăng hay giảm bao nhiêu hạng):

Công thức tính: `exam_cnt_rank_21 - exam_cnt_rank_20`

Trong MySQL, hàm `CAST()` được dùng để chuyển đổi kiểu dữ liệu của một biểu thức sang một kiểu dữ liệu khác. Cú pháp cơ bản như sau:

```sql
CAST(expression AS data_type)

-- Chuyển đổi một chuỗi thành số nguyên
SELECT CAST('123' AS INT);
```

Chúng ta sẽ không liệt kê từng ví dụ vì hàm này rất đơn giản.

**Đáp án**:

```sql
SELECT
  tag,
  exam_cnt_20,
  exam_cnt_21,
  concat(
    round(
      100 * (exam_cnt_21 - exam_cnt_20) / exam_cnt_20,
      1
    ),
    '%'
  ) AS growth_rate,
  exam_cnt_rank_20,
  exam_cnt_rank_21,
  cast(exam_cnt_rank_21 AS signed) - cast(exam_cnt_rank_20 AS signed) AS rank_delta
FROM
  (
    # Số lượt hoàn thành và thứ hạng hoàn thành theo từng thể loại đề thi trong nửa đầu năm 2020 và 2021
    SELECT
      tag,
      count(
        IF (
          date_format(start_time, '%Y%m%d') BETWEEN '20200101'
          AND '20200630',
          start_time,
          NULL
        )
      ) AS exam_cnt_20,
      count(
        IF (
          substring(start_time, 1, 10) BETWEEN '2021-01-01'
          AND '2021-06-30',
          start_time,
          NULL
        )
      ) AS exam_cnt_21,
      rank() over (
        ORDER BY
          count(
            IF (
              date_format(start_time, '%Y%m%d') BETWEEN '20200101'
              AND '20200630',
              start_time,
              NULL
            )
          ) DESC
      ) AS exam_cnt_rank_20,
      rank() over (
        ORDER BY
          count(
            IF (
              substring(start_time, 1, 10) BETWEEN '2021-01-01'
              AND '2021-06-30',
              start_time,
              NULL
            )
          ) DESC
      ) AS exam_cnt_rank_21
    FROM
      examination_info
      JOIN exam_record USING (exam_id)
    WHERE
      submit_time IS NOT NULL
    GROUP BY
      tag
  ) main
WHERE
  exam_cnt_21 * exam_cnt_20 <> 0
ORDER BY
  growth_rate DESC,
  exam_cnt_rank_21 DESC
```

## Các hàm cửa sổ tổng hợp (Aggregate Window Functions)

### Chuẩn hóa Min-Max cho điểm thi

**Mô tả**:

Hiện có bảng thông tin đề thi `examination_info` (`exam_id` ID đề thi, `tag` thể loại đề thi, `difficulty` độ khó đề thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag    | difficulty | duration | release_time        |
| --- | ------- | ------ | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL    | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | C++    | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | 算法   | hard       | 80       | 2020-01-01 10:00:00 |
| 4   | 9004    | PYTHON | medium     | 70       | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 6   | 1003 | 9001    | 2020-01-02 12:01:01 | 2020-01-02 12:31:01 | 68     |
| 9   | 1001 | 9001    | 2020-01-02 10:01:01 | 2020-01-02 10:31:01 | 89     |
| 1   | 1001 | 9001    | 2020-01-01 09:01:01 | 2020-01-01 09:21:59 | 90     |
| 12  | 1002 | 9002    | 2021-05-05 18:01:01 | (NULL)              | (NULL) |
| 3   | 1004 | 9002    | 2020-01-01 12:01:01 | 2020-01-01 12:11:01 | 60     |
| 2   | 1003 | 9002    | 2020-01-01 19:01:01 | 2020-01-01 19:30:01 | 75     |
| 7   | 1001 | 9002    | 2020-01-02 12:01:01 | 2020-01-02 12:43:01 | 81     |
| 10  | 1002 | 9002    | 2020-01-01 12:11:01 | 2020-01-01 12:31:01 | 83     |
| 4   | 1003 | 9002    | 2020-01-01 12:01:01 | 2020-01-01 12:41:01 | 90     |
| 5   | 1002 | 9002    | 2020-01-02 19:01:01 | 2020-01-02 19:32:00 | 90     |
| 11  | 1002 | 9004    | 2021-09-06 12:01:01 | (NULL)              | (NULL) |
| 8   | 1001 | 9005    | 2020-01-02 12:11:01 | (NULL)              | (NULL) |

Trong tính toán dữ liệu vật lý và thống kê, có một khái niệm gọi là chuẩn hóa min-max (min-max normalization hay chuẩn hóa độ lệch), đây là một phép biến đổi tuyến tính trên dữ liệu gốc nhằm ánh xạ các giá trị kết quả vào khoảng [0 - 1].

Hàm chuyển đổi như sau:

![Công thức chuẩn hóa Min-Max](/media/jg/ext/oss.javaguide.cn/javaguide/database/sql/29A377601170AB822322431FCDF7EDFE-da7d693a.png)

Bạn hãy thực hiện chuẩn hóa min-max điểm số của người dùng khi làm các đề thi độ khó cao (hard) trong phạm vi các bản ghi của từng đề thi rồi thu phóng (scale) về khoảng [0, 100], sau đó xuất ra ID người dùng, ID đề thi và giá trị trung bình điểm số sau chuẩn hóa; cuối cùng sắp xếp tăng dần theo ID đề thi và giảm dần theo điểm số đã chuẩn hóa. (Lưu ý: Khoảng điểm mặc định là [0, 100]. Nếu một bản ghi làm bài thi chỉ có duy nhất một điểm số thì không cần áp dụng công thức, điểm số sau khi chuẩn hóa và thu phóng vẫn giữ nguyên điểm gốc).

Kết quả đầu ra từ dữ liệu mẫu như sau:

| uid  | exam_id | avg_new_score |
| ---- | ------- | ------------- |
| 1001 | 9001    | 98            |
| 1003 | 9001    | 0             |
| 1002 | 9002    | 88            |
| 1003 | 9002    | 75            |
| 1001 | 9002    | 70            |
| 1004 | 9002    | 0             |

Giải thích: Các đề thi có độ khó cao gồm 9001, 9002, 9003;

Có 3 bản ghi làm bài đề thi 9001 với số điểm lần lượt là 68, 89, 90, sau khi chuẩn hóa theo công thức đã cho điểm số sẽ là: 0, 95, 100. Vì hai điểm sau đều do người dùng 1001 làm, nên điểm mới của người dùng 1001 cho đề thi 9001 là (95 + 100) / 2 ≈ 98 (chỉ lấy phần nguyên), điểm mới của người dùng 1003 cho đề thi 9001 là 0. Kết quả cuối cùng được sắp xếp tăng dần theo ID đề thi và giảm dần theo điểm số sau chuẩn hóa.

**Ý tưởng:**

Các điểm cần lưu ý:

1. Đối với đề thi có độ khó cao, dựa theo điểm số của từng đề thi, dùng hàm cửa sổ `MAX(col) OVER()` và `MIN(col) OVER()` để tìm giá trị lớn nhất và nhỏ nhất trong từng nhóm, sau đó áp dụng công thức chuẩn hóa, khoảng thu phóng là [0, 100], tức `min_max * 100`.
2. Nếu một đề thi chỉ có duy nhất một điểm số thì không cần áp dụng công thức chuẩn hóa, vì khi chỉ có một điểm thì `max_score = min_score = score`, áp dụng công thức có thể chia cho 0 hoặc ra kết quả 0.
3. Cuối cùng gom nhóm theo `uid`, `exam_id` để tính giá trị trung bình sau chuẩn hóa, các bản ghi có `score` là `NULL` cần được lọc bỏ.

Cuối cùng là quan sát kỹ công thức ở trên (thực sự mà nói, bài này nhìn qua thấy khá rối).

**Đáp án**:

```sql
SELECT
  uid,
  exam_id,
  round(sum(min_max) / count(score), 0) AS avg_new_score
FROM
  (
    SELECT
      *,
      IF (
        max_score = min_score,
        score,
        (score - min_score) / (max_score - min_score) * 100
      ) AS min_max
    FROM
      (
        SELECT
          uid,
          a.exam_id,
          score,
          max(score) over (PARTITION BY a.exam_id) AS max_score,
          min(score) over (PARTITION BY a.exam_id) AS min_score
        FROM
          exam_record a
          LEFT JOIN examination_info b USING (exam_id)
        WHERE
          difficulty = 'hard'
      ) t
    WHERE
      score IS NOT NULL
  ) t1
GROUP BY
  uid,
  exam_id
ORDER BY
  exam_id ASC,
  avg_new_score DESC;
```

### Số lượt làm bài hàng tháng và tổng số lượt tích lũy tính đến tháng hiện tại cho từng đề thi

**Mô tả**:

Hiện có bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-01 09:01:01 | 2020-01-01 09:21:59 | 90     |
| 2   | 1002 | 9001    | 2020-01-20 10:01:01 | 2020-01-20 10:10:01 | 89     |
| 3   | 1002 | 9001    | 2020-02-01 12:11:01 | 2020-02-01 12:31:01 | 83     |
| 4   | 1003 | 9001    | 2020-03-01 19:01:01 | 2020-03-01 19:30:01 | 75     |
| 5   | 1004 | 9001    | 2020-03-01 12:01:01 | 2020-03-01 12:11:01 | 60     |
| 6   | 1003 | 9001    | 2020-03-01 12:01:01 | 2020-03-01 12:41:01 | 90     |
| 7   | 1002 | 9001    | 2020-05-02 19:01:01 | 2020-05-02 19:32:00 | 90     |
| 8   | 1001 | 9002    | 2020-01-02 19:01:01 | 2020-01-02 19:59:01 | 69     |
| 9   | 1004 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:20:01 | 99     |
| 10  | 1003 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:31:01 | 68     |
| 11  | 1001 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:43:01 | 81     |
| 12  | 1001 | 9002    | 2020-03-02 12:11:01 | (NULL)              | (NULL) |

Hãy xuất ra số lượt làm bài mỗi tháng và tổng số lượt làm bài tích lũy tính đến tháng hiện tại cho từng đề thi.
Kết quả đầu ra từ dữ liệu mẫu như sau:

| exam_id | start_month | month_cnt | cum_exam_cnt |
| ------- | ----------- | --------- | ------------ |
| 9001    | 202001      | 2         | 2            |
| 9001    | 202002      | 1         | 3            |
| 9001    | 202003      | 3         | 6            |
| 9001    | 202005      | 1         | 7            |
| 9002    | 202001      | 1         | 1            |
| 9002    | 202002      | 3         | 4            |
| 9002    | 202003      | 1         | 5            |

Giải thích: Đề thi 9001 có bản ghi làm bài trong 4 tháng là 202001, 202002, 202003, 202005, số lượt làm bài trong từng tháng lần lượt là 2, 1, 3, 1; tổng số lượt làm bài tích lũy tính đến tháng hiện tại lần lượt là 2, 3, 6, 7.

**Ý tưởng:**

Bài này chỉ có hai điểm mấu chốt: thống kê tổng số lượt làm bài tích lũy tính đến tháng hiện tại, và xuất ra số lượt làm bài hàng tháng kèm tổng số tích lũy tính đến tháng đó.

Cú pháp quan trọng nhất chính là: `**sum(count(*)) over(partition by exam_id order by date_format(start_time,'%Y%m'))**`

**Đáp án**:

```sql
SELECT exam_id,
       date_format(start_time, '%Y%m') AS start_month,
       count(*) AS month_cnt,
       sum(count(*)) OVER (PARTITION BY exam_id
                           ORDER BY date_format(start_time, '%Y%m')) AS cum_exam_cnt
FROM exam_record
GROUP BY exam_id,
         start_month
```

### Tình hình làm bài hàng tháng và tích lũy tính đến tháng hiện tại (Khá khó)

**Mô tả**: Hiện có bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID đề thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-01 09:01:01 | 2020-01-01 09:21:59 | 90     |
| 2   | 1002 | 9001    | 2020-01-20 10:01:01 | 2020-01-20 10:10:01 | 89     |
| 3   | 1002 | 9001    | 2020-02-01 12:11:01 | 2020-02-01 12:31:01 | 83     |
| 4   | 1003 | 9001    | 2020-03-01 19:01:01 | 2020-03-01 19:30:01 | 75     |
| 5   | 1004 | 9001    | 2020-03-01 12:01:01 | 2020-03-01 12:11:01 | 60     |
| 6   | 1003 | 9001    | 2020-03-01 12:01:01 | 2020-03-01 12:41:01 | 90     |
| 7   | 1002 | 9001    | 2020-05-02 19:01:01 | 2020-05-02 19:32:00 | 90     |
| 8   | 1001 | 9002    | 2020-01-02 19:01:01 | 2020-01-02 19:59:01 | 69     |
| 9   | 1004 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:20:01 | 99     |
| 10  | 1003 | 9002    | 2020-02-02 12:01:01 | 2020-02-02 12:31:01 | 68     |
| 11  | 1001 | 9002    | 2020-01-02 19:01:01 | 2020-02-02 12:43:01 | 81     |
| 12  | 1001 | 9002    | 2020-03-02 12:11:01 | (NULL)              | (NULL) |

Hãy xuất ra số người dùng hoạt động hàng tháng (MAU), số người dùng mới tăng thêm trong tháng, số người dùng mới tăng thêm trong một tháng lớn nhất tính đến tháng hiện tại, và tổng số người dùng tích lũy tính đến tháng hiện tại trong các bản ghi làm bài thi kể từ khi bắt đầu có người dùng làm bài. Sắp xếp kết quả tăng dần theo tháng.

Kết quả đầu ra từ dữ liệu mẫu như sau:

| start_month | mau | month_add_uv | max_month_add_uv | cum_sum_uv |
| ----------- | --- | ------------ | ---------------- | ---------- |
| 202001      | 2   | 2            | 2                | 2          |
| 202002      | 4   | 2            | 2                | 4          |
| 202003      | 3   | 0            | 2                | 4          |
| 202005      | 1   | 0            | 2                | 4          |

| month  | 1001 | 1002 | 1003 | 1004 |
| ------ | ---- | ---- | ---- | ---- |
| 202001 | 1    | 1    |      |      |
| 202002 | 1    | 1    | 1    | 1    |
| 202003 | 1    |      | 1    | 1    |
| 202005 |      | 1    |      |      |

Từ ma trận trên có thể thấy, vào tháng 1 năm 2020 có 2 người dùng hoạt động (mau=2), số người dùng mới trong tháng là 2;

Vào tháng 2 năm 2020 có 4 người dùng hoạt động, số người dùng mới trong tháng là 2, số người dùng mới trong một tháng lớn nhất tính đến tháng hiện tại là 2, số người dùng tích lũy hiện tại là 4.

**Ý tưởng:**

Điểm khó:

1. Cách tính số người dùng mới tăng thêm mỗi tháng
2. Tình hình làm bài tích lũy tính đến tháng hiện tại

Quy trình tổng thể:

(1) Thống kê tháng đăng nhập (làm bài) đầu tiên của mỗi người bằng `min()`

(2) Thống kê số người dùng hoạt động hàng tháng (MAU) và số người dùng mới hàng tháng: trước tiên lấy tháng đăng nhập đầu tiên của mỗi người, sau đó gom nhóm theo tháng đăng nhập đầu tiên và tính tổng để ra số người dùng mới của tháng đó

(3) Thống kê số người dùng mới trong một tháng lớn nhất tính đến tháng hiện tại, số người dùng tích lũy tính đến tháng hiện tại, cuối cùng xuất ra theo thứ tự tháng tăng dần

**Đáp án**:

```sql
-- Số người dùng mới trong một tháng lớn nhất tính đến tháng hiện tại, tổng số người dùng tích lũy tính đến tháng hiện tại, sắp xếp theo tháng tăng dần
SELECT
	start_month,
	mau,
	month_add_uv,
	max( month_add_uv ) over ( ORDER BY start_month ),
	sum( month_add_uv ) over ( ORDER BY start_month )
FROM
	(
	-- Thống kê số người dùng hoạt động hàng tháng (MAU) và số người dùng mới hàng tháng
	SELECT
		date_format( a.start_time, '%Y%m' ) AS start_month,
		count( DISTINCT a.uid ) AS mau,
		count( DISTINCT b.uid ) AS month_add_uv
	FROM
		exam_record a
		LEFT JOIN (
         -- Thống kê tháng đăng nhập đầu tiên của mỗi người dùng
		SELECT uid, min( date_format( start_time, '%Y%m' )) AS first_month FROM exam_record GROUP BY uid ) b ON date_format( a.start_time, '%Y%m' ) = b.first_month
	GROUP BY
		start_month
	) main
ORDER BY
	start_month
```
