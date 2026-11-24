---
title: Tổng hợp câu hỏi phỏng vấn SQL thường gặp (5)
description: Phần 5 trong loạt bài tổng hợp câu hỏi phỏng vấn SQL thường gặp, giải thích chi tiết kỹ thuật xử lý giá trị NULL, bao gồm các hàm IFNULL, COALESCE, cũng như sử dụng CASE WHEN để thống kê có điều kiện và tính tỷ lệ hoàn thành.
category: Cơ sở dữ liệu
tag:
  - Cơ sở dữ liệu cơ bản
  - SQL
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn SQL,xử lý giá trị rỗng NULL,IFNULL,COALESCE,CASE WHEN,thống kê có điều kiện,tính tỷ lệ hoàn thành
lang: vi
sourceRef: zh-ref/database/sql/sql-questions-05.md
---

> Nguồn bài tập: [Nowcoder - SQL Advanced Challenges](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

Đối với các bài tập ở mức độ tương đối khó hoặc khó, bạn có thể căn cứ vào tình hình thực tế của bản thân và nhu cầu phỏng vấn để quyết định có nên bỏ qua hay không.

## Xử lý giá trị NULL

### Thống kê số lượng chưa hoàn thành và tỷ lệ chưa hoàn thành của các bài thi có trạng thái chưa hoàn thành

**Mô tả**:

Cho bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số), dữ liệu như sau:

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:01 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | 2021-05-02 10:30:01 | 81     |
| 3   | 1001 | 9001    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |

Hãy thống kê số lượng chưa hoàn thành `incomplete_cnt` và tỷ lệ chưa hoàn thành `incomplete_rate` của các bài thi có trạng thái chưa hoàn thành. Kết quả xuất ra từ dữ liệu mẫu như sau:

| exam_id | incomplete_cnt | complete_rate |
| ------- | -------------- | ------------- |
| 9001    | 1              | 0.333         |

Giải thích: Bài thi 9001 có 3 lượt làm bài, trong đó 2 lượt hoàn thành, 1 lượt chưa hoàn thành, do đó số lượng chưa hoàn thành là 1, tỷ lệ chưa hoàn thành là 0.333 (làm tròn đến 3 chữ số thập phân).

**Ý tưởng**:

Bài này chỉ cần lưu ý một chỉ số có điều kiện giới hạn, một chỉ số không có điều kiện giới hạn; bạn có thể truy vấn các điều kiện riêng rẽ rồi gộp lại, hoặc tiến hành đánh giá điều kiện trực tiếp ngay bên trong mệnh đề `SELECT`.

**Đáp án**:

Cách 1:

```sql
SELECT
    exam_id,
    (COUNT(*) - COUNT(submit_time)) AS incomplete_cnt,
    ROUND((COUNT(*) - COUNT(submit_time)) / COUNT(*), 3) AS incomplete_rate
FROM
    exam_record
GROUP BY
    exam_id
HAVING
    (COUNT(*) - COUNT(submit_time)) > 0;
```

Dùng `COUNT(*)` để đếm tổng số bản ghi trong từng nhóm, trong khi `COUNT(submit_time)` chỉ đếm các bản ghi có trường `submit_time` khác `NULL` (tức số lượt đã hoàn thành). Lấy hai số trừ cho nhau sẽ được số lượt chưa hoàn thành.

Cách 2:

```sql
SELECT
    exam_id,
    COUNT(CASE WHEN submit_time IS NULL THEN 1 END) AS incomplete_cnt,
    ROUND(COUNT(CASE WHEN submit_time IS NULL THEN 1 END) / COUNT(*), 3) AS incomplete_rate
FROM
    exam_record
GROUP BY
    exam_id
HAVING
    COUNT(CASE WHEN submit_time IS NULL THEN 1 END) > 0;
```

Sử dụng biểu thức `CASE`, khi thỏa mãn điều kiện sẽ trả về một giá trị khác `NULL` (ví dụ 1), ngược lại trả về `NULL`. Sau đó dùng hàm `COUNT` để đếm số lượng các giá trị khác `NULL`.

Cách 3:

```sql
SELECT
    exam_id,
    SUM(submit_time IS NULL) AS incomplete_cnt,
    ROUND(SUM(submit_time IS NULL) / COUNT(*), 3) AS incomplete_rate
FROM
    exam_record
GROUP BY
    exam_id
HAVING
    incomplete_cnt > 0;
```

Tận dụng hàm `SUM` để tính tổng một biểu thức logic. Khi `submit_time` là `NULL`, biểu thức `(submit_time IS NULL)` có giá trị là 1 (`TRUE`), ngược lại là 0 (`FALSE`). Cộng các giá trị 1 và 0 này lại sẽ thu được số lượng chưa hoàn thành.

### Thời gian làm bài trung bình và điểm trung bình của người dùng level 0 đối với các bài thi độ khó cao

**Mô tả**:

Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký), dữ liệu như sau:

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 10          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2100        | 6     | 算法 | 2020-01-01 10:00:00 |

Bảng thông tin bài thi `examination_info` (`exam_id` ID bài thi, `tag` thể loại bài thi, `difficulty` độ khó bài thi, `duration` thời lượng thi, `release_time` thời gian phát hành), dữ liệu như sau:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL  | easy       | 60       | 2020-01-01 10:00:00 |
| 3   | 9004    | 算法 | medium     | 80       | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số), dữ liệu như sau:

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:59 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | (NULL)              | (NULL) |
| 3   | 1001 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 4   | 1001 | 9001    | 2021-06-02 19:01:01 | 2021-06-02 19:32:00 | 20     |
| 5   | 1001 | 9002    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 6   | 1001 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 7   | 1002 | 9002    | 2021-05-05 18:01:01 | 2021-05-05 18:59:02 | 90     |

Hãy xuất ra thời gian làm bài trung bình và điểm trung bình cho tất cả các bài thi độ khó cao của từng người dùng level 0; các lượt làm bài chưa hoàn thành mặc định lấy thời lượng tối đa của bài thi đó và tính điểm 0. Kết quả xuất ra từ dữ liệu mẫu như sau:

| uid  | avg_score | avg_time_took |
| ---- | --------- | ------------- |
| 1001 | 33        | 36.7          |

Giải thích: Người dùng level 0 có 1001, bài thi độ khó cao có 9001. Người dùng 1001 có 3 bản ghi làm bài thi 9001, thời gian làm bài lần lượt là 20 phút, chưa hoàn thành (thời lượng bài thi 60 phút), 30 phút (chưa đủ 31 phút tròn), điểm số lần lượt là 80 điểm, chưa hoàn thành (tính 0 điểm), 20 điểm. Do đó thời gian làm bài trung bình là 110/3 = 36.7 (làm tròn đến 1 chữ số thập phân), điểm trung bình là 33 điểm (lấy số nguyên làm tròn).

**Ý tưởng**: Dùng `IF` là cách phán đoán thuận tiện nhất cho bài này vì liên quan đến việc kiểm tra giá trị NULL. Tất nhiên dùng `CASE WHEN` cũng được, đại đồng tiểu dị. Điểm mấu chốt của bài này nằm ở khâu xử lý giá trị NULL; các điều kiện truy vấn còn lại tin rằng sẽ không làm khó được các bạn.

**Đáp án**:

```sql
SELECT UID,
       round(avg(new_socre)) AS avg_score,
       round(avg(time_diff), 1) AS avg_time_took
FROM
  (SELECT er.uid,
          IF (er.submit_time IS NOT NULL, TIMESTAMPDIFF(MINUTE, start_time, submit_time), ef.duration) AS time_diff,
          IF (er.submit_time IS NOT NULL,er.score,0) AS new_socre
   FROM exam_record er
   LEFT JOIN user_info uf ON er.uid = uf.uid
   LEFT JOIN examination_info ef ON er.exam_id = ef.exam_id
   WHERE uf.LEVEL = 0 AND ef.difficulty = 'hard' ) t
GROUP BY UID
ORDER BY UID
```

## Mệnh đề điều kiện nâng cao

### Lọc người dùng theo điều kiện nickname, điểm thành tựu và ngày hoạt động (Tương đối khó)

**Mô tả**:

Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name   | achievement | level | job  | register_time       |
| --- | ---- | ----------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号   | 1000        | 2     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号   | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 进击的 3 号 | 2200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号   | 2500        | 6     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号   | 3000        | 7     | C++  | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:59 | 80     |
| 3   | 1001 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | (NULL)              | (NULL) |
| 4   | 1001 | 9001    | 2021-06-02 19:01:01 | 2021-06-02 19:32:00 | 20     |
| 6   | 1001 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 5   | 1001 | 9002    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 11  | 1002 | 9001    | 2020-01-01 12:01:01 | 2020-01-01 12:31:01 | 81     |
| 12  | 1002 | 9002    | 2020-02-01 12:01:01 | 2020-02-01 12:31:01 | 82     |
| 13  | 1002 | 9002    | 2020-02-02 12:11:01 | 2020-02-02 12:31:01 | 83     |
| 7   | 1002 | 9002    | 2021-05-05 18:01:01 | 2021-05-05 18:59:02 | 90     |
| 16  | 1002 | 9001    | 2021-09-06 12:01:01 | 2021-09-06 12:21:01 | 80     |
| 17  | 1002 | 9001    | 2021-09-06 12:01:01 | (NULL)              | (NULL) |
| 18  | 1002 | 9001    | 2021-09-07 12:01:01 | (NULL)              | (NULL) |
| 8   | 1003 | 9003    | 2021-02-06 12:01:01 | (NULL)              | (NULL) |
| 9   | 1003 | 9001    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 89     |
| 10  | 1004 | 9002    | 2021-08-06 12:01:01 | (NULL)              | (NULL) |
| 14  | 1005 | 9001    | 2021-02-01 11:01:01 | 2021-02-01 11:31:01 | 84     |
| 15  | 1006 | 9001    | 2021-02-01 11:01:01 | 2021-02-01 11:31:01 | 84     |

Bảng ghi nhận luyện tập câu hỏi `practice_record` (`uid` ID người dùng, `question_id` ID câu hỏi, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | question_id | submit_time         | score |
| --- | ---- | ----------- | ------------------- | ----- |
| 1   | 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 2   | 1002 | 8001        | 2021-09-02 19:30:01 | 50    |
| 3   | 1002 | 8001        | 2021-09-02 19:20:01 | 70    |
| 4   | 1002 | 8002        | 2021-09-02 19:38:01 | 70    |
| 5   | 1003 | 8002        | 2021-09-01 19:38:01 | 80    |

Hãy tìm thông tin người dùng có nickname bắt đầu bằng `'牛客'` và kết thúc bằng `'号'`, điểm thành tựu trong khoảng từ 1200 đến 2500, và lần hoạt động gần nhất (luyện tập câu hỏi hoặc làm bài thi) là vào tháng 9 năm 2021.

Kết quả xuất ra từ dữ liệu mẫu như sau:

| uid  | nick_name | achievement |
| ---- | --------- | ----------- |
| 1002 | 牛客 2 号 | 1200        |

**Giải thích**: Người dùng có nickname bắt đầu bằng `'牛客'` và kết thúc bằng `'号'` cùng điểm thành tựu từ 1200 đến 2500 gồm 1002 và 1004;

Lần hoạt động gần nhất của 1002 ở khu vực bài thi là tháng 9/2021, khu vực luyện tập câu hỏi là tháng 9/2021; 1004 lần hoạt động gần nhất ở khu vực bài thi là tháng 8/2021, khu vực câu hỏi không hoạt động.

Do đó cuối cùng chỉ có 1002 thỏa mãn đầy đủ các điều kiện.

**Ý tưởng**:

Trước tiên liệt kê các câu lệnh truy vấn điều kiện chính:

Nickname bắt đầu bằng `'牛客'` kết thúc bằng `'号'`: `nick_name LIKE "牛客%号"`

Điểm thành tựu trong khoảng 1200~2500: `achievement BETWEEN 1200 AND 2500`

Điều kiện thứ ba do giới hạn cố định là tháng 9, nên có thể viết trực tiếp: `( date_format( record.submit_time, '%Y%m' )= 202109 OR date_format( pr.submit_time, '%Y%m' )= 202109 )`

**Đáp án**:

```sql
SELECT DISTINCT u_info.uid,
                u_info.nick_name,
                u_info.achievement
FROM user_info u_info
LEFT JOIN exam_record record ON record.uid = u_info.uid
LEFT JOIN practice_record pr ON u_info.uid = pr.uid
WHERE u_info.nick_name LIKE "牛客%号"
  AND u_info.achievement BETWEEN 1200
  AND 2500
  AND (date_format(record.submit_time, '%Y%m')= 202109
       OR date_format(pr.submit_time, '%Y%m')= 202109)
GROUP BY u_info.uid
```

### Lọc bản ghi làm bài theo quy tắc nickname và quy tắc bài thi (Tương đối khó)

**Mô tả**:

Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 1900        | 2     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 2200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 2500        | 6     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 555 号  | 2000        | 7     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 666666       | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

Bảng thông tin bài thi `examination_info` (`exam_id` ID bài thi, `tag` thể loại bài thi, `difficulty` độ khó bài thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag | difficulty | duration | release_time        |
| --- | ------- | --- | ---------- | -------- | ------------------- |
| 1   | 9001    | C++ | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | c#  | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | SQL | medium     | 70       | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:59 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | (NULL)              | (NULL) |
| 4   | 1001 | 9001    | 2021-06-02 19:01:01 | 2021-06-02 19:32:00 | 20     |
| 3   | 1001 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 5   | 1001 | 9002    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 6   | 1001 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 11  | 1002 | 9001    | 2020-01-01 12:01:01 | 2020-01-01 12:31:01 | 81     |
| 16  | 1002 | 9001    | 2021-09-06 12:01:01 | 2021-09-06 12:21:01 | 80     |
| 17  | 1002 | 9001    | 2021-09-06 12:01:01 | (NULL)              | (NULL) |
| 18  | 1002 | 9001    | 2021-09-07 12:01:01 | (NULL)              | (NULL) |
| 7   | 1002 | 9002    | 2021-05-05 18:01:01 | 2021-05-05 18:59:02 | 90     |
| 12  | 1002 | 9002    | 2020-02-01 12:01:01 | 2020-02-01 12:31:01 | 82     |
| 13  | 1002 | 9002    | 2020-02-02 12:11:01 | 2020-02-02 12:31:01 | 83     |
| 9   | 1003 | 9001    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 89     |
| 8   | 1003 | 9003    | 2021-02-06 12:01:01 | (NULL)              | (NULL) |
| 10  | 1004 | 9002    | 2021-08-06 12:01:01 | (NULL)              | (NULL) |
| 14  | 1005 | 9001    | 2021-02-01 11:01:01 | 2021-02-01 11:31:01 | 84     |
| 15  | 1006 | 9001    | 2021-02-01 11:01:01 | 2021-09-01 11:31:01 | 84     |

Tìm ID bài thi đã hoàn thành và điểm trung bình tương ứng của những người dùng có nickname gồm `"牛客"` + toàn số + `"号"` hoặc chỉ gồm toàn chữ số, đối với các thể loại bài thi bắt đầu bằng chữ cái `c` (như C, C++, c#, v.v.), sắp xếp tăng dần theo ID người dùng và điểm trung bình. Kết quả xuất ra từ dữ liệu mẫu như sau:

| uid  | exam_id | avg_score |
| ---- | ------- | --------- |
| 1002 | 9001    | 81        |
| 1002 | 9002    | 85        |
| 1005 | 9001    | 84        |
| 1006 | 9001    | 84        |

Giải thích: Người dùng thỏa mãn điều kiện nickname gồm 1002, 1004, 1005, 1006;

Các bài thi bắt đầu bằng chữ cái `c` gồm 9001, 9002;

Trong các bản ghi làm bài thỏa mãn điều kiện trên, điểm thi đã hoàn thành 9001 của 1002 là 81 và 80, điểm trung bình là 81 (80.5 làm tròn thành 81);

Điểm thi đã hoàn thành 9002 của 1002 là 90, 82, 83, điểm trung bình là 85;

**Ý tưởng**:

Vẫn như cũ, khi đã có điều kiện thì viết từng điều kiện ra trước.

Tìm người dùng có nickname gồm `"牛客"` + toàn số + `"号"` hoặc chỉ toàn số: Ban đầu tôi viết thế này: `nick_name LIKE '牛客%号' OR nick_name REGEXP '^[0-9]+$'`, nhưng nếu trong bảng có `"牛客 H 号"` thì nó cũng khớp.

Do đó ở đây phải dùng biểu thức chính quy (Regex): `nick_name LIKE '^牛客[0-9]+号'` (hoặc `RLIKE "^牛客[0-9]+号$" OR nick_name RLIKE "^[0-9]+$"`)

Đối với thể loại bài thi bắt đầu bằng chữ cái `c`: `e_info.tag LIKE 'c%'` hoặc `tag regexp '^c|^C'` — cách đầu tiên cũng có thể khớp với chữ C viết hoa.

**Đáp án**:

```sql
SELECT UID,
       exam_id,
       ROUND(AVG(score), 0) avg_score
FROM exam_record
WHERE UID IN
    (SELECT UID
     FROM user_info
     WHERE nick_name RLIKE "^牛客[0-9]+号 $"
        OR nick_name RLIKE "^[0-9]+$")
  AND exam_id IN
    (SELECT exam_id
     FROM examination_info
     WHERE tag RLIKE "^[cC]")
  AND score IS NOT NULL
GROUP BY UID,exam_id
ORDER BY UID,avg_score;
```

### Xuất các trường hợp khác nhau dựa trên việc bản ghi chỉ định có tồn tại hay không (Khó)

**Mô tả**:

Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name   | achievement | level | job  | register_time       |
| --- | ---- | ----------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号   | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号   | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 进击的 3 号 | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号   | 25          | 0     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 555 号 | 2000        | 7     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 666666      | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:59 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | (NULL)              | (NULL) |
| 3   | 1001 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 4   | 1001 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 5   | 1001 | 9003    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |
| 6   | 1001 | 9004    | 2021-09-03 12:01:01 | (NULL)              | (NULL) |
| 7   | 1002 | 9001    | 2020-01-01 12:01:01 | 2020-01-01 12:31:01 | 99     |
| 8   | 1002 | 9003    | 2020-02-01 12:01:01 | 2020-02-01 12:31:01 | 82     |
| 9   | 1002 | 9003    | 2020-02-02 12:11:01 | (NULL)              | (NULL) |
| 10  | 1002 | 9002    | 2021-05-05 18:01:01 | (NULL)              | (NULL) |
| 11  | 1002 | 9001    | 2021-09-06 12:01:01 | (NULL)              | (NULL) |
| 12  | 1003 | 9003    | 2021-02-06 12:01:01 | (NULL)              | (NULL) |
| 13  | 1003 | 9001    | 2021-09-07 10:01:01 | 2021-09-07 10:31:01 | 89     |

Hãy sàng lọc dữ liệu trong bảng: khi có bất kỳ người dùng level 0 nào có số bài thi chưa hoàn thành lớn hơn 2, hãy xuất ra số lượng bài thi chưa hoàn thành và tỷ lệ chưa hoàn thành (làm tròn đến 3 chữ số thập phân) của từng người dùng level 0; nếu không tồn tại người dùng như vậy, hãy xuất ra hai chỉ số này của tất cả những người dùng có bản ghi làm bài thi. Kết quả sắp xếp theo tỷ lệ chưa hoàn thành tăng dần.

Kết quả xuất ra từ dữ liệu mẫu như sau:

| uid  | incomplete_cnt | incomplete_rate |
| ---- | -------------- | --------------- |
| 1004 | 0              | 0.000           |
| 1003 | 1              | 0.500           |
| 1001 | 4              | 0.667           |

**Giải thích**: Người dùng level 0 gồm 1001, 1003, 1004; số bài thi đã làm và số bài chưa hoàn thành của họ lần lượt là: 6:4, 2:1, 0:0;

Tồn tại người dùng level 0 là 1001 có số bài thi chưa hoàn thành lớn hơn 2, do đó xuất ra số lượng chưa hoàn thành và tỷ lệ chưa hoàn thành của cả 3 người dùng này (1004 chưa từng làm bài thi, tỷ lệ chưa hoàn thành mặc định điền 0, sau khi làm tròn 3 chữ số thập phân là 0.000);

Kết quả sắp xếp tăng dần theo tỷ lệ chưa hoàn thành.

Phụ chú: Nếu 1001 không thỏa mãn điều kiện "số bài thi chưa hoàn thành lớn hơn 2", thì cần xuất hai chỉ số này của 1001, 1002, 1003, vì trong bảng bản ghi làm bài thi chỉ có dữ liệu của 3 người dùng này.

**Ý tưởng**:

Trước tiên viết câu lệnh SQL tìm các người dùng có thể thỏa mãn điều kiện **"người dùng level 0 có số bài thi chưa hoàn thành lớn hơn 2"**:

```sql
SELECT ui.uid UID
FROM user_info ui
LEFT JOIN exam_record er ON ui.uid = er.uid
WHERE ui.uid IN
    (SELECT ui.uid
     FROM user_info ui
     LEFT JOIN exam_record er ON ui.uid = er.uid
     WHERE er.submit_time IS NULL
       AND ui.LEVEL = 0 )
GROUP BY ui.uid
HAVING sum(IF(er.submit_time IS NULL, 1, 0)) > 2
```

Sau đó lần lượt viết câu lệnh truy vấn SQL cho hai trường hợp:

Trường hợp 1. Truy vấn tỷ lệ chưa hoàn thành của người dùng level 0 khi tồn tại điều kiện yêu cầu:

```sql
SELECT
	tmp1.uid uid,
	sum(
	IF
	( er.submit_time IS NULL AND er.start_time IS NOT NULL, 1, 0 )) incomplete_cnt,
	round(
		sum(
		IF
		( er.submit_time IS NULL AND er.start_time IS NOT NULL, 1, 0 ))/ count( tmp1.uid ),
		3
	) incomplete_rate
FROM
	(
	SELECT DISTINCT
		ui.uid
	FROM
		user_info ui
		LEFT JOIN exam_record er ON ui.uid = er.uid
	WHERE
		er.submit_time IS NULL
		AND ui.LEVEL = 0
	) tmp1
	LEFT JOIN exam_record er ON tmp1.uid = er.uid
GROUP BY
	tmp1.uid
ORDER BY
	incomplete_rate
```

Trường hợp 2. Truy vấn tỷ lệ chưa hoàn thành của tất cả người dùng có bản ghi làm bài thi khi không tồn tại điều kiện yêu cầu:

```sql
SELECT
	ui.uid uid,
	sum( CASE WHEN er.submit_time IS NULL AND er.start_time IS NOT NULL THEN 1 ELSE 0 END ) incomplete_cnt,
	round(
		sum(
		IF
		( er.submit_time IS NULL AND er.start_time IS NOT NULL, 1, 0 ))/ count( ui.uid ),
		3
	) incomplete_rate
FROM
	user_info ui
	JOIN exam_record er ON ui.uid = er.uid
GROUP BY
	ui.uid
ORDER BY
	incomplete_rate
```

Ghép lại với nhau sẽ ra đáp án:

```sql
WITH host_user AS
  (SELECT ui.uid UID
   FROM user_info ui
   LEFT JOIN exam_record er ON ui.uid = er.uid
   WHERE ui.uid IN
       (SELECT ui.uid
        FROM user_info ui
        LEFT JOIN exam_record er ON ui.uid = er.uid
        WHERE er.submit_time IS NULL
          AND ui.LEVEL = 0 )
   GROUP BY ui.uid
   HAVING sum(IF (er.submit_time IS NULL, 1, 0))> 2),
     tt1 AS
  (SELECT tmp1.uid UID,
                   sum(IF (er.submit_time IS NULL
                           AND er.start_time IS NOT NULL, 1, 0)) incomplete_cnt,
                   round(sum(IF (er.submit_time IS NULL
                                 AND er.start_time IS NOT NULL, 1, 0))/ count(tmp1.uid), 3) incomplete_rate
   FROM
     (SELECT DISTINCT ui.uid
      FROM user_info ui
      LEFT JOIN exam_record er ON ui.uid = er.uid
      WHERE er.submit_time IS NULL
        AND ui.LEVEL = 0 ) tmp1
   LEFT JOIN exam_record er ON tmp1.uid = er.uid
   GROUP BY tmp1.uid
   ORDER BY incomplete_rate),
     tt2 AS
  (SELECT ui.uid UID,
                 sum(CASE
                         WHEN er.submit_time IS NULL
                              AND er.start_time IS NOT NULL THEN 1
                         ELSE 0
                     END) incomplete_cnt,
                 round(sum(IF (er.submit_time IS NULL
                               AND er.start_time IS NOT NULL, 1, 0))/ count(ui.uid), 3) incomplete_rate
   FROM user_info ui
   JOIN exam_record er ON ui.uid = er.uid
   GROUP BY ui.uid
   ORDER BY incomplete_rate)
  (SELECT tt1.*
   FROM tt1
   LEFT JOIN
     (SELECT UID
      FROM host_user) t1 ON 1 = 1
   WHERE t1.uid IS NOT NULL )
UNION ALL
  (SELECT tt2.*
   FROM tt2
   LEFT JOIN
     (SELECT UID
      FROM host_user) t2 ON 1 = 1
   WHERE t2.uid IS NULL)
```

Phiên bản V2 (cải tiến dựa trên giải pháp trên, câu lệnh ngắn hơn và logic chặt chẽ hơn):

```sql
SELECT
	ui.uid,
	SUM(
	IF
	( start_time IS NOT NULL AND score IS NULL, 1, 0 )) AS incomplete_cnt,# 3. Số bài thi chưa hoàn thành
	ROUND( AVG( IF ( start_time IS NOT NULL AND score IS NULL, 1, 0 )), 3 ) AS incomplete_rate # 4. Tỷ lệ chưa hoàn thành

FROM
	user_info ui
	LEFT JOIN exam_record USING ( uid )
WHERE
CASE

		WHEN (# 1. Khi có bất kỳ người dùng level 0 nào có số bài thi chưa hoàn thành lớn hơn 2
		SELECT
			MAX( lv0_incom_cnt )
		FROM
			(
			SELECT
				SUM(
				IF
				( score IS NULL, 1, 0 )) AS lv0_incom_cnt
			FROM
				user_info
				JOIN exam_record USING ( uid )
			WHERE
				LEVEL = 0
			GROUP BY
				uid
			) table1
			)> 2 THEN
			uid IN ( # 1.1 Tìm từng người dùng level 0
			SELECT uid FROM user_info WHERE LEVEL = 0 ) ELSE uid IN ( # 2. Nếu không tồn tại người dùng như vậy, tìm người dùng có bản ghi làm bài
			SELECT DISTINCT uid FROM exam_record )
		END
		GROUP BY
			ui.uid
	ORDER BY
	incomplete_rate # 5. Kết quả sắp xếp theo tỷ lệ chưa hoàn thành tăng dần
```

### Tỷ trọng các mức điểm thể hiện khác nhau theo từng cấp độ người dùng (Tương đối khó)

**Mô tả**:

Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 25          | 0     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 555 号  | 2000        | 7     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 666666       | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:59 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | (NULL)              | (NULL) |
| 3   | 1001 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 75     |
| 4   | 1001 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:11:01 | 60     |
| 5   | 1001 | 9003    | 2021-09-02 12:01:01 | 2021-09-02 12:41:01 | 90     |
| 6   | 1001 | 9001    | 2021-06-02 19:01:01 | 2021-06-02 19:32:00 | 20     |
| 7   | 1001 | 9002    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 8   | 1001 | 9004    | 2021-09-03 12:01:01 | (NULL)              | (NULL) |
| 9   | 1002 | 9001    | 2020-01-01 12:01:01 | 2020-01-01 12:31:01 | 99     |
| 10  | 1002 | 9003    | 2020-02-01 12:01:01 | 2020-02-01 12:31:01 | 82     |
| 11  | 1002 | 9003    | 2020-02-02 12:11:01 | 2020-02-02 12:41:01 | 76     |

Để có được đánh giá định tính về biểu hiện làm bài thi của người dùng, chúng ta chia điểm thi thành bốn thang điểm: Xuất sắc (`'优'`), Giỏi (`'良'`), Trung bình (`'中'`), Kém (`'差'`) dựa trên các mốc phân định `[90, 75, 60]` (mốc phân định thuộc về khoảng bên trái). Hãy thống kê tỷ trọng của từng thang điểm trong số các bài thi đã hoàn thành của người dùng theo từng cấp độ (kết quả làm tròn đến 3 chữ số thập phân). Người dùng chưa từng hoàn thành bài thi nào thì không cần xuất ra. Kết quả sắp xếp giảm dần theo cấp độ người dùng, sau đó giảm dần theo tỷ trọng.

Kết quả xuất ra từ dữ liệu mẫu như sau:

| level | score_grade | ratio |
| ----- | ----------- | ----- |
| 3     | 良          | 0.667 |
| 3     | 优          | 0.333 |
| 0     | 良          | 0.500 |
| 0     | 中          | 0.167 |
| 0     | 优          | 0.167 |
| 0     | 差          | 0.167 |

Giải thích: Người dùng đã hoàn thành bài thi gồm 1001, 1002; cấp độ người dùng và thang điểm tương ứng với các bài thi đã hoàn thành như sau:

| uid  | exam_id | score | level | score_grade |
| ---- | ------- | ----- | ----- | ----------- |
| 1001 | 9001    | 80    | 0     | 良          |
| 1001 | 9002    | 75    | 0     | 良          |
| 1001 | 9002    | 60    | 0     | 中          |
| 1001 | 9003    | 90    | 0     | 优          |
| 1001 | 9001    | 20    | 0     | 差          |
| 1001 | 9002    | 89    | 0     | 良          |
| 1002 | 9001    | 99    | 3     | 优          |
| 1002 | 9003    | 82    | 3     | 良          |
| 1002 | 9003    | 76    | 3     | 良          |

Do đó đối với người dùng level 0 (chỉ có 1001), tỷ lệ các thang điểm là: Xuất sắc (`'优'`) 1/6, Giỏi (`'良'`) 1/6, Trung bình (`'中'`) 1/6, Kém (`'差'`) 3/6; đối với người dùng level 3 (chỉ có 1002), tỷ lệ các thang điểm là: Xuất sắc (`'优'`) 1/3, Giỏi (`'良'`) 2/3. Kết quả làm tròn đến 3 chữ số thập phân.

**Ý tưởng**:

Trước tiên viết điều kiện **"chia điểm bài thi thành bốn thang điểm Xuất sắc ('优'), Giỏi ('良'), Trung bình ('中'), Kém ('差') theo các mốc [90, 75, 60]"**, ở đây có thể dùng `CASE WHEN`:

```sql
CASE
		WHEN a.score >= 90 THEN
		'优'
		WHEN a.score < 90 AND a.score >= 75 THEN
		'良'
		WHEN a.score < 75 AND a.score >= 60 THEN
	'中' ELSE '差'
END
```

Điểm mấu chốt của bài toán nằm ở đây, phần còn lại là ghép nối điều kiện và kết nối bảng.

**Đáp án**:

```sql
SELECT a.LEVEL,
       a.score_grade,
       ROUND(a.cur_count / b.total_num, 3) AS ratio
FROM
  (SELECT b.LEVEL AS LEVEL,
          (CASE
               WHEN a.score >= 90 THEN '优'
               WHEN a.score < 90
                    AND a.score >= 75 THEN '良'
               WHEN a.score < 75
                    AND a.score >= 60 THEN '中'
               ELSE '差'
           END) AS score_grade,
          count(1) AS cur_count
   FROM exam_record a
   LEFT JOIN user_info b ON a.uid = b.uid
   WHERE a.submit_time IS NOT NULL
   GROUP BY b.LEVEL,
            score_grade) a
LEFT JOIN
  (SELECT b.LEVEL AS LEVEL,
          count(b.LEVEL) AS total_num
   FROM exam_record a
   LEFT JOIN user_info b ON a.uid = b.uid
   WHERE a.submit_time IS NOT NULL
   GROUP BY b.LEVEL) b ON a.LEVEL = b.LEVEL
ORDER BY a.LEVEL DESC,
         ratio DESC
```

## Truy vấn giới hạn số lượng

### Ba người đăng ký sớm nhất

**Mô tả**:

Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-02-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 22          | 0     | 算法 | 2020-01-02 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 5   | 1005 | 牛客 555 号  | 4000        | 7     | C++  | 2020-01-11 10:00:00 |
| 6   | 1006 | 666666       | 3000        | 6     | C++  | 2020-11-01 10:00:00 |

Hãy tìm ra 3 người có thời gian đăng ký sớm nhất. Kết quả xuất ra từ dữ liệu mẫu như sau:

| uid  | nick_name    | register_time       |
| ---- | ------------ | ------------------- |
| 1001 | 牛客 1       | 2020-01-01 10:00:00 |
| 1003 | 牛客 3 号 ♂ | 2020-01-02 10:00:00 |
| 1004 | 牛客 4 号    | 2020-01-02 11:00:00 |

Giải thích: Sắp xếp theo thời gian đăng ký rồi chọn ra 3 người đầu tiên, xuất ID người dùng, biệt danh và thời gian đăng ký của họ.

**Đáp án**:

```sql
SELECT uid, nick_name, register_time
    FROM user_info
    ORDER BY register_time
    LIMIT 3
```

### Trang thứ 3 danh sách những người hoàn thành bài thi ngay trong ngày đăng ký (Tương đối khó)

**Mô tả**: Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1       | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 25          | 0     | 算法 | 2020-01-01 11:00:00 |
| 5   | 1005 | 牛客 555 号  | 4000        | 7     | 算法 | 2020-01-11 10:00:00 |
| 6   | 1006 | 牛客 6 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 7   | 1007 | 牛客 7 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 8   | 1008 | 牛客 8 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 9   | 1009 | 牛客 9 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 10  | 1010 | 牛客 10 号   | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 11  | 1011 | 666666       | 3000        | 6     | C++  | 2020-01-02 10:00:00 |

Bảng thông tin bài thi `examination_info` (`exam_id` ID bài thi, `tag` thể loại bài thi, `difficulty` độ khó bài thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | 算法 | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | 算法 | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | SQL  | medium     | 70       | 2020-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score |
| --- | ---- | ------- | ------------------- | ------------------- | ----- |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:59 | 80    |
| 2   | 1002 | 9003    | 2020-01-20 10:01:01 | 2020-01-20 10:10:01 | 81    |
| 3   | 1002 | 9002    | 2020-01-01 12:11:01 | 2020-01-01 12:31:01 | 83    |
| 4   | 1003 | 9002    | 2020-01-01 19:01:01 | 2020-01-01 19:30:01 | 75    |
| 5   | 1004 | 9002    | 2020-01-01 12:01:01 | 2020-01-01 12:11:01 | 60    |
| 6   | 1005 | 9002    | 2020-01-01 12:01:01 | 2020-01-01 12:41:01 | 90    |
| 7   | 1006 | 9001    | 2020-01-02 19:01:01 | 2020-01-02 19:32:00 | 20    |
| 8   | 1007 | 9002    | 2020-01-02 19:01:01 | 2020-01-02 19:40:01 | 89    |
| 9   | 1008 | 9003    | 2020-01-02 12:01:01 | 2020-01-02 12:20:01 | 99    |
| 10  | 1008 | 9001    | 2020-01-02 12:01:01 | 2020-01-02 12:31:01 | 98    |
| 11  | 1009 | 9002    | 2020-01-02 12:01:01 | 2020-01-02 12:31:01 | 82    |
| 12  | 1010 | 9002    | 2020-01-02 12:11:01 | 2020-01-02 12:41:01 | 76    |
| 13  | 1011 | 9001    | 2020-01-02 10:01:01 | 2020-01-02 10:31:01 | 89    |

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/sql/D2B491866B85826119EE3474F10D3636-43590d8e.png)

Tìm những người có định hướng tìm việc là kỹ sư thuật toán (`'算法'`), và đã hoàn thành bài thi thuộc thể loại thuật toán (`'算法'`) ngay trong ngày đăng ký tài khoản, xếp hạng theo điểm thi cao nhất trong tất cả các bài thi đã tham gia. Bảng xếp hạng rất dài nên sẽ dùng hiển thị phân trang, mỗi trang 3 bản ghi; bây giờ bạn cần lấy ra thông tin của những người ở trang thứ 3 (số trang bắt đầu từ 1).

Kết quả xuất ra từ dữ liệu mẫu như sau:

| uid  | level | register_time       | max_score |
| ---- | ----- | ------------------- | --------- |
| 1010 | 0     | 2020-01-02 11:00:00 | 76        |
| 1003 | 0     | 2020-01-01 10:00:00 | 75        |
| 1004 | 0     | 2020-01-01 11:00:00 | 60        |

Giải thích: Ngoại trừ 1011, định hướng tìm việc của tất cả người dùng khác đều là Kỹ sư thuật toán (`'算法'`); các bài thi thể loại thuật toán gồm 9001 và 9002, 11 người dùng đều hoàn thành bài thi thể loại thuật toán ngay trong ngày đăng ký; khi tính điểm tối đa trong tất cả các bài thi của họ, chỉ có 1002 và 1008 là hoàn thành 2 bài thi trong khi những người khác chỉ hoàn thành 1 bài thi—điểm cao nhất qua 2 bài thi của 1002 là 81, của 1008 là 99.

Xếp hạng theo điểm cao nhất như sau:

| uid  | level | register_time       | max_score |
| ---- | ----- | ------------------- | --------- |
| 1008 | 0     | 2020-01-02 11:00:00 | 99        |
| 1005 | 7     | 2020-01-01 10:00:00 | 90        |
| 1007 | 0     | 2020-01-02 11:00:00 | 89        |
| 1002 | 3     | 2020-01-01 10:00:00 | 83        |
| 1009 | 0     | 2020-01-02 11:00:00 | 82        |
| 1001 | 0     | 2020-01-01 10:00:00 | 80        |
| 1010 | 0     | 2020-01-02 11:00:00 | 76        |
| 1003 | 0     | 2020-01-01 10:00:00 | 75        |
| 1004 | 0     | 2020-01-01 11:00:00 | 60        |
| 1006 | 0     | 2020-01-02 11:00:00 | 20        |

Mỗi trang 3 bản ghi, trang thứ 3 tức là các bản ghi từ 7 đến 9, chỉ cần trả về các dòng bản ghi của 1010, 1003, 1004.

**Ý tưởng**:

1. Mỗi trang 3 bản ghi, tức cần lấy thông tin của người ở trang thứ 3, cần dùng `LIMIT`.

2. Để thống kê **thông tin và điểm số của từng lần làm bài** của người có định hướng thuật toán và hoàn thành bài thi thuật toán trong ngày đăng ký, trước hết tìm các người dùng thỏa mãn điều kiện, sau đó dùng `LEFT JOIN` để liên kết tra cứu thông tin và điểm số của từng lần ghi nhận.

**Đáp án**:

```sql
SELECT t1.uid,
       LEVEL,
       register_time,
       max(score) AS max_score
FROM exam_record t
JOIN examination_info USING (exam_id)
JOIN user_info t1 ON t.uid = t1.uid
AND date(t.submit_time) = date(t1.register_time)
WHERE job = '算法'
  AND tag = '算法'
GROUP BY t1.uid,
         LEVEL,
         register_time
ORDER BY max_score DESC
LIMIT 6,3
```

## Các hàm chuyển đổi văn bản

### Sửa chữa các bản ghi bị lệch cột

**Mô tả**: Cho bảng thông tin bài thi `examination_info` (`exam_id` ID bài thi, `tag` thể loại bài thi, `difficulty` độ khó bài thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag            | difficulty | duration | release_time        |
| --- | ------- | -------------- | ---------- | -------- | ------------------- |
| 1   | 9001    | 算法           | hard       | 60       | 2021-01-01 10:00:00 |
| 2   | 9002    | 算法           | hard       | 80       | 2021-01-01 10:00:00 |
| 3   | 9003    | SQL            | medium     | 70       | 2021-01-01 10:00:00 |
| 4   | 9004    | 算法,medium,80 |            | 0        | 2021-01-01 10:00:00 |

Người phụ trách nhập đề thi có một lần sơ suất đã nhập nhầm đồng thời cả thể loại `tag`, độ khó, và thời lượng thi vào chung trường `tag` của một số bản ghi. Hãy giúp tìm ra những bản ghi bị nhập sai này, đồng thời tách chúng ra và xuất theo đúng các kiểu cột chuẩn.

Kết quả xuất ra từ dữ liệu mẫu như sau:

| exam_id | tag  | difficulty | duration |
| ------- | ---- | ---------- | -------- |
| 9004    | 算法 | medium     | 80       |

**Ý tưởng**:

Trước tiên cùng tìm hiểu hàm sẽ dùng trong bài này:

Hàm `SUBSTRING_INDEX` dùng để trích xuất các phần của chuỗi dựa trên ký tự phân tách chỉ định. Hàm nhận vào ba tham số: chuỗi ban đầu, ký tự phân tách, và số lượng phần cần trả về.

Cú pháp của hàm `SUBSTRING_INDEX`:

```sql
SUBSTRING_INDEX(str, delimiter, count)
```

- `str`: Chuỗi ban đầu cần tách.
- `delimiter`: Chuỗi hoặc ký tự dùng làm ranh giới phân tách.
- `count`: Chỉ định số lượng phần muốn trả về.
  - Nếu `count` lớn hơn 0, trả về `count` phần đầu tiên tính từ bên trái (ngăn cách bởi ký tự phân tách).
  - Nếu `count` nhỏ hơn 0, trả về `count` phần đầu tiên tính từ bên phải (ngăn cách bởi ký tự phân tách), tức đếm từ phải sang trái.

Dưới đây là một số ví dụ minh họa cách sử dụng hàm `SUBSTRING_INDEX`:

1. Trích xuất phần đầu tiên trong chuỗi:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', 1);
   -- Kết quả trả về: 'apple'
   ```

2. Trích xuất phần cuối cùng trong chuỗi:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', -1);
   -- Kết quả trả về: 'cherry'
   ```

3. Trích xuất hai phần đầu tiên trong chuỗi:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', 2);
   -- Kết quả trả về: 'apple,banana'
   ```

4. Trích xuất hai phần cuối cùng trong chuỗi:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', -2);
   -- Kết quả trả về: 'banana,cherry'
   ```

**Đáp án**:

```sql
SELECT
	exam_id,
	substring_index( tag, ',', 1 ) tag,
	substring_index( substring_index( tag, ',', 2 ), ',',- 1 ) difficulty,
	substring_index( tag, ',',- 1 ) duration
FROM
	examination_info
WHERE
	difficulty = ''
```

### Xử lý cắt ngắn đối với nickname quá dài

**Mô tả**: Cho bảng thông tin người dùng `user_info` (`uid` ID người dùng, `nick_name` biệt danh, `achievement` điểm thành tựu, `level` cấp độ người dùng, `job` định hướng nghề nghiệp, `register_time` thời gian đăng ký):

| id  | uid  | nick_name              | achievement | level | job  | register_time       |
| --- | ---- | ---------------------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1                 | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号              | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂           | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号              | 25          | 0     | 算法 | 2020-01-01 11:00:00 |
| 5   | 1005 | 牛客 5678901234 号     | 4000        | 7     | 算法 | 2020-01-11 10:00:00 |
| 6   | 1006 | 牛客 67890123456789 号 | 25          | 0     | 算法 | 2020-01-02 11:00:00 |

Một số người dùng có biệt danh rất dài, trong một số ngữ cảnh hiển thị sẽ gây vỡ bố cục giao diện, vì vậy cần chuyển đổi biệt danh quá dài trước khi xuất ra. Hãy xuất ra thông tin người dùng có số lượng ký tự lớn hơn 10; đối với người dùng có số lượng ký tự lớn hơn 13, hãy xuất ra 10 ký tự đầu tiên rồi thêm ba dấu chấm: `'...'`.

Kết quả xuất ra từ dữ liệu mẫu như sau:

| uid  | nick_name          |
| ---- | ------------------ |
| 1005 | 牛客 5678901234 号 |
| 1006 | 牛客 67890123...   |

Giải thích: Người dùng có số lượng ký tự lớn hơn 10 gồm 1005 và 1006, với độ dài lần lượt là 13 và 17; do đó cần cắt ngắn biệt danh của 1006 khi xuất ra.

**Ý tưởng**:

Bài này liên quan đến việc đếm ký tự. Để tính số lượng ký tự (tức độ dài) của chuỗi, bạn có thể dùng hàm `LENGTH` hoặc hàm `CHAR_LENGTH`. Sự khác biệt giữa hai hàm này nằm ở cách xử lý ký tự đa byte (multi-byte).

1. Hàm `LENGTH`: Trả về số byte của chuỗi truyền vào. Đối với chuỗi chứa ký tự đa byte, mỗi ký tự sẽ được tính theo số byte thực tế mà nó chiếm dụng.

Ví dụ:

```sql
SELECT LENGTH('你好'); -- Kết quả trả về: 6, vì mỗi chữ Hán trong '你好' chiếm 3 byte
```

2. Hàm `CHAR_LENGTH`: Trả về số ký tự của chuỗi truyền vào. Đối với chuỗi chứa ký tự đa byte, mỗi ký tự sẽ được tính là một ký tự duy nhất.

Ví dụ:

```sql
SELECT CHAR_LENGTH('你好'); -- Kết quả trả về: 2, vì trong '你好' có 2 ký tự, tức hai chữ Hán
```

**Đáp án**:

```sql
SELECT
	uid,
	CASE
		WHEN CHAR_LENGTH( nick_name ) > 13 THEN
		CONCAT( SUBSTR( nick_name, 1, 10 ), '...' ) ELSE nick_name
	END AS nick_name
FROM
	user_info
WHERE
	CHAR_LENGTH( nick_name ) > 10
GROUP BY
	uid;
```

### Thống kê sàng lọc khi chữ hoa chữ thường bị lẫn lộn (Tương đối khó)

**Mô tả**:

Cho bảng thông tin bài thi `examination_info` (`exam_id` ID bài thi, `tag` thể loại bài thi, `difficulty` độ khó bài thi, `duration` thời lượng thi, `release_time` thời gian phát hành):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | 算法 | hard       | 60       | 2021-01-01 10:00:00 |
| 2   | 9002    | C++  | hard       | 80       | 2021-01-01 10:00:00 |
| 3   | 9003    | C++  | hard       | 80       | 2021-01-01 10:00:00 |
| 4   | 9004    | sql  | medium     | 70       | 2021-01-01 10:00:00 |
| 5   | 9005    | C++  | hard       | 80       | 2021-01-01 10:00:00 |
| 6   | 9006    | C++  | hard       | 80       | 2021-01-01 10:00:00 |
| 7   | 9007    | C++  | hard       | 80       | 2021-01-01 10:00:00 |
| 8   | 9008    | SQL  | medium     | 70       | 2021-01-01 10:00:00 |
| 9   | 9009    | SQL  | medium     | 70       | 2021-01-01 10:00:00 |
| 10  | 9010    | SQL  | medium     | 70       | 2021-01-01 10:00:00 |

Bảng ghi nhận làm bài thi `exam_record` (`uid` ID người dùng, `exam_id` ID bài thi, `start_time` thời gian bắt đầu làm bài, `submit_time` thời gian nộp bài, `score` điểm số):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-01 09:01:01 | 2020-01-01 09:21:59 | 80     |
| 2   | 1002 | 9003    | 2020-01-20 10:01:01 | 2020-01-20 10:10:01 | 81     |
| 3   | 1002 | 9002    | 2020-02-01 12:11:01 | 2020-02-01 12:31:01 | 83     |
| 4   | 1003 | 9002    | 2020-03-01 19:01:01 | 2020-03-01 19:30:01 | 75     |
| 5   | 1004 | 9002    | 2020-03-01 12:01:01 | 2020-03-01 12:11:01 | 60     |
| 6   | 1005 | 9002    | 2020-03-01 12:01:01 | 2020-03-01 12:41:01 | 90     |
| 7   | 1006 | 9001    | 2020-05-02 19:01:01 | 2020-05-02 19:32:00 | 20     |
| 8   | 1007 | 9003    | 2020-01-02 19:01:01 | 2020-01-02 19:40:01 | 89     |
| 9   | 1008 | 9004    | 2020-02-02 12:01:01 | 2020-02-02 12:20:01 | 99     |
| 10  | 1008 | 9001    | 2020-02-02 12:01:01 | 2020-02-02 12:31:01 | 98     |
| 11  | 1009 | 9002    | 2020-02-02 12:01:01 | 2020-01-02 12:43:01 | 81     |
| 12  | 1010 | 9001    | 2020-01-02 12:11:01 | (NULL)              | (NULL) |
| 13  | 1010 | 9001    | 2020-02-02 12:01:01 | 2020-01-02 10:31:01 | 89     |

Thể loại bài thi `tag` có thể xuất hiện tình trạng lẫn lộn chữ hoa chữ thường, trước tiên hãy lọc ra các thể loại `tag` có số lượt làm bài thi nhỏ hơn 3, thống kê số lượt làm bài ban đầu tương ứng sau khi đã chuyển thể loại đó thành chữ in hoa.

Nếu sau khi chuyển đổi mà `tag` không có gì thay đổi thì không xuất bản ghi đó ra kết quả.

Kết quả xuất ra từ dữ liệu mẫu như sau:

| tag | answer_cnt |
| --- | ---------- |
| C++ | 6          |

Giải thích: Các bài thi đã được làm bài gồm 9001, 9002, 9003, 9004, thể loại `tag` và số lượt làm bài của chúng như sau:

| exam_id | tag  | answer_cnt |
| ------- | ---- | ---------- |
| 9001    | 算法 | 4          |
| 9002    | C++  | 6          |
| 9003    | c++  | 2          |
| 9004    | sql  | 2          |

Các `tag` có số lượt làm bài nhỏ hơn 3 gồm `c++` và `sql`, và sau khi chuyển thành chữ in hoa thì chỉ có `C++` là vốn dĩ đã có lượt làm bài, do đó xuất số lượt làm bài của `c++` sau khi chuyển thành chữ in hoa là 6.

**Ý tưởng**:

Trước tiên, bài này có một điểm hơi mâu thuẫn: dựa vào dữ liệu mẫu thì 9004 chỉ được truy vấn ra 1 lần, nhưng ở đây lại hiển thị là 2 lần.

Cùng xem qua các hàm chuyển đổi chữ hoa chữ thường:

1. Hàm `UPPER(s)` hoặc `UCASE(s)` có thể chuyển đổi tất cả các ký tự chữ cái trong chuỗi `s` thành chữ in hoa;

2. Hàm `LOWER(s)` hoặc `LCASE(s)` có thể chuyển đổi tất cả các ký tự chữ cái trong chuỗi `s` thành chữ in thường.

Điểm khó nằm ở chỗ tự liên kết chính bảng đó (self-join) để truy vấn các giá trị khác nhau.

**Đáp án**:

```sql
WITH a AS
  (SELECT tag,
          COUNT(start_time) AS answer_cnt
   FROM exam_record er
   JOIN examination_info ei ON er.exam_id = ei.exam_id
   GROUP BY tag)
SELECT a.tag,
       b.answer_cnt
FROM a
INNER JOIN a AS b ON UPPER(a.tag)= b.tag # a chữ thường, b chữ hoa
AND a.tag != b.tag
WHERE a.answer_cnt < 3;
```
