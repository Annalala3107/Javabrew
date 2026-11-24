---
title: "Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 2)"
description: "Phần 2 trong loạt bài Tổng hợp câu hỏi phỏng vấn SQL thường gặp, giải thích chi tiết các câu lệnh thao tác dữ liệu DML như INSERT, UPDATE, DELETE, bao gồm các kỹ thuật thực chiến như chèn hàng loạt, import từ bảng khác và chèn kèm cập nhật."
category: Cơ sở dữ liệu
tag:
  - Nền tảng cơ sở dữ liệu
  - SQL
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn SQL,INSERT,UPDATE,DELETE,Chèn hàng loạt,REPLACE INTO,Thao tác dữ liệu
lang: vi
sourceRef: zh-ref/database/sql/sql-questions-02.md
---

> Nguồn bài tập: [Nowcoder - Thử thách SQL nâng cao](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

## Thao tác thêm, sửa, xóa (DML)

Tổng hợp các cách chèn bản ghi trong SQL:

- **Chèn thông thường (đủ tất cả cột)**: `INSERT INTO table_name VALUES (value1, value2, ...)`
- **Chèn thông thường (chỉ định cột)**: `INSERT INTO table_name (column1, column2, ...) VALUES (value1, value2, ...)`
- **Chèn nhiều dòng một lúc**: `INSERT INTO table_name (column1, column2, ...) VALUES (value1_1, value1_2, ...), (value2_1, value2_2, ...), ...`
- **Import từ bảng khác**: `INSERT INTO table_name SELECT * FROM table_name2 [WHERE key=value]`
- **Chèn kèm cập nhật/thay thế**: `REPLACE INTO table_name VALUES (value1, value2, ...)` (Lưu ý nguyên lý của lệnh này là nếu phát hiện trùng khóa chính hoặc khóa Unique Index thì sẽ xóa bản ghi cũ rồi chèn lại bản ghi mới)

### Chèn bản ghi (1)

**Mô tả**: Hệ thống backend của Nowcoder sẽ ghi lại lịch sử làm bài thi của từng người dùng vào bảng `exam_record`. Hiện có chi tiết lịch sử làm bài của hai người dùng như sau:

- Người dùng 1001 bắt đầu làm đề thi 9001 vào lúc 22:11:12 ngày 1 tháng 9 năm 2021, nộp bài sau 50 phút và đạt 90 điểm;
- Người dùng 1002 bắt đầu làm đề thi 9002 vào lúc 07:01:02 ngày 4 tháng 9 năm 2021 và thoát khỏi nền tảng sau 10 phút.

Bảng ghi nhận làm bài `exam_record` đã được tạo sẵn với cấu trúc dưới đây. Hãy dùng một câu lệnh duy nhất để chèn hai bản ghi này vào bảng.

| Field       | Type       | Null | Key | Extra          | Default | Comment              |
| ----------- | ---------- | ---- | --- | -------------- | ------- | -------------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | ID tự tăng           |
| uid         | int(11)    | NO   |     |                | (NULL)  | ID người dùng        |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | ID đề thi            |
| start_time  | datetime   | NO   |     |                | (NULL)  | Thời gian bắt đầu    |
| submit_time | datetime   | YES  |     |                | (NULL)  | Thời gian nộp bài    |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Điểm số              |

**Đáp án**:

```sql
// Đã có khóa chính tự tăng, không cần gán giá trị thủ công
INSERT INTO exam_record (uid, exam_id, start_time, submit_time, score) VALUES
(1001, 9001, '2021-09-01 22:11:12', '2021-09-01 23:01:12', 90),
(1002, 9002, '2021-09-04 07:01:02', NULL, NULL);
```

### Chèn bản ghi (2)

**Mô tả**: Hiện có bảng ghi nhận làm bài `exam_record` với cấu trúc như bảng dưới, chứa dữ liệu làm bài thi của người dùng qua nhiều năm. Do dữ liệu ngày càng nhiều, việc bảo trì ngày càng khó khăn nên cần tinh giản nội dung bảng và sao lưu dữ liệu lịch sử.

Bảng `exam_record`:

| Field       | Type       | Null | Key | Extra          | Default | Comment              |
| ----------- | ---------- | ---- | --- | -------------- | ------- | -------------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | ID tự tăng           |
| uid         | int(11)    | NO   |     |                | (NULL)  | ID người dùng        |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | ID đề thi            |
| start_time  | datetime   | NO   |     |                | (NULL)  | Thời gian bắt đầu    |
| submit_time | datetime   | YES  |     |                | (NULL)  | Thời gian nộp bài    |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Điểm số              |

Chúng ta đã tạo sẵn một bảng mới `exam_record_before_2021` dùng để sao lưu các bản ghi làm bài trước năm 2021 với cấu trúc giống hệt bảng `exam_record`. Hãy import các bản ghi làm bài đã hoàn thành trước năm 2021 vào bảng này.

**Đáp án**:

```sql
INSERT INTO exam_record_before_2021 (uid, exam_id, start_time, submit_time, score)
SELECT uid,exam_id,start_time,submit_time,score
FROM exam_record
WHERE YEAR(submit_time) < 2021;
```

### Chèn bản ghi (3)

**Mô tả**: Hiện có một bộ đề thi SQL độ khó cao (`hard`) với ID là 9003, thời lượng 1 tiếng rưỡi. Hãy lấy `2021-01-01 00:00:00` làm thời gian phát hành và chèn vào bảng thông tin đề thi `examination_info`. Bất kể đề thi có ID này đã tồn tại hay chưa đều phải chèn thành công. Hãy thử chèn nó.

Bảng thông tin đề thi `examination_info`:

| Field        | Type        | Null | Key | Extra          | Default | Comment              |
| ------------ | ----------- | ---- | --- | -------------- | ------- | -------------------- |
| id           | int(11)     | NO   | PRI | auto_increment | (NULL)  | ID tự tăng           |
| exam_id      | int(11)     | NO   | UNI |                | (NULL)  | ID đề thi            |
| tag          | varchar(32) | YES  |     |                | (NULL)  | Nhãn danh mục        |
| difficulty   | varchar(8)  | YES  |     |                | (NULL)  | Độ khó               |
| duration     | int(11)     | NO   |     |                | (NULL)  | Thời lượng (phút)    |
| release_time | datetime    | YES  |     |                | (NULL)  | Thời gian phát hành  |

**Đáp án**:

```sql
REPLACE INTO examination_info VALUES
 (NULL, 9003, "SQL", "hard", 90, "2021-01-01 00:00:00");
```

### Cập nhật bản ghi (1)

**Mô tả**: Hiện có một bảng thông tin đề thi `examination_info`, cấu trúc bảng như hình dưới:

| Field        | Type     | Null | Key | Extra          | Default | Comment              |
| ------------ | -------- | ---- | --- | -------------- | ------- | -------------------- |
| id           | int(11)  | NO   | PRI | auto_increment | (NULL)  | ID tự tăng           |
| exam_id      | int(11)  | NO   | UNI |                | (NULL)  | ID đề thi            |
| tag          | char(32) | YES  |     |                | (NULL)  | Nhãn danh mục        |
| difficulty   | char(8)  | YES  |     |                | (NULL)  | Độ khó               |
| duration     | int(11)  | NO   |     |                | (NULL)  | Thời lượng           |
| release_time | datetime | YES  |     |                | (NULL)  | Thời gian phát hành  |

Hãy sửa toàn bộ các bản ghi có `tag` là `PYTHON` trong bảng **examination_info** thành `Python`.

**Hướng giải quyết**: Bài này có hai hướng giải quyết. Cách dễ nghĩ ra nhất là dùng trực tiếp `UPDATE + WHERE` để chỉ định điều kiện cập nhật; cách thứ hai là tìm kiếm và thay thế ngay trên cột cần sửa.

**Đáp án 1**:

```sql
UPDATE examination_info SET tag = 'Python' WHERE tag='PYTHON'
```

**Đáp án 2**:

```sql
UPDATE examination_info
SET tag = REPLACE(tag,'PYTHON','Python')

# REPLACE (cột_mục_tiêu, "nội_dung_tìm", "nội_dung_thay_thế")
```

### Cập nhật bản ghi (2)

**Mô tả**: Hiện có bảng ghi nhận làm bài `exam_record` chứa dữ liệu làm bài qua nhiều năm, cấu trúc như bảng dưới: trong bảng `exam_record`, **`submit_time`** là thời gian hoàn thành (chú ý câu này).

| Field       | Type       | Null | Key | Extra          | Default | Comment              |
| ----------- | ---------- | ---- | --- | -------------- | ------- | -------------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | ID tự tăng           |
| uid         | int(11)    | NO   |     |                | (NULL)  | ID người dùng        |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | ID đề thi            |
| start_time  | datetime   | NO   |     |                | (NULL)  | Thời gian bắt đầu    |
| submit_time | datetime   | YES  |     |                | (NULL)  | Thời gian nộp bài    |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Điểm số              |

**Yêu cầu đề bài**: Hãy chuyển toàn bộ các bản ghi ==chưa hoàn thành== trong bảng `exam_record` có thời gian bắt đầu làm bài ==trước== ngày 1 tháng 9 năm 2021 sang trạng thái hoàn thành thụ động, tức là: sửa thời gian hoàn thành thành `'2099-01-01 00:00:00'` và sửa điểm số thành `0`.

**Hướng giải quyết**: Chú ý các từ khóa trong đề bài (đã được tô sáng): điều kiện trước `"ngày xxx"`, đến đây phải nghĩ ngay tới việc so sánh thời gian—có thể dùng trực tiếp `xxx_time < "2021-09-01 00:00:00"`, hoặc dùng hàm `DATE()` để so sánh. Điều kiện thứ hai là `"chưa hoàn thành"`, tức là thời gian hoàn thành là `NULL`, cũng chính là thời gian nộp bài trong đề (`submit_time IS NULL`).

**Đáp án**:

```sql
UPDATE exam_record SET submit_time = '2099-01-01 00:00:00', score = 0 WHERE DATE(start_time) < "2021-09-01" AND submit_time IS null
```

### Xóa bản ghi (1)

**Mô tả**: Hiện có bảng ghi nhận làm bài `exam_record` chứa dữ liệu làm bài qua nhiều năm, cấu trúc như bảng dưới:

Trong bảng ghi nhận làm bài `exam_record`: **`start_time`** là thời gian bắt đầu làm đề, `submit_time` là thời gian nộp bài, tức thời gian kết thúc.

| Field       | Type       | Null | Key | Extra          | Default | Comment              |
| ----------- | ---------- | ---- | --- | -------------- | ------- | -------------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | ID tự tăng           |
| uid         | int(11)    | NO   |     |                | (NULL)  | ID người dùng        |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | ID đề thi            |
| start_time  | datetime   | NO   |     |                | (NULL)  | Thời gian bắt đầu    |
| submit_time | datetime   | YES  |     |                | (NULL)  | Thời gian nộp bài    |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Điểm số              |

**Yêu cầu**: Hãy xóa các bản ghi trong bảng `exam_record` có thời gian làm bài nhỏ hơn tròn 5 phút và điểm không đạt (mức điểm đạt là 60 điểm).

**Hướng giải quyết**: Bài này tuy luyện về xóa dữ liệu nhưng nhìn kỹ thực chất là kiểm tra cách dùng hàm thời gian. Với phép so sánh số phút được đề cập ở đây, hai hàm thường dùng là **`TIMEDIFF`** và **`TIMESTAMPDIFF`**. Cách dùng của hai hàm có chút khác biệt, hàm sau linh hoạt hơn, tùy theo thói quen mỗi người.

1. `TIMEDIFF`: Hiệu giữa hai giá trị thời gian.

```sql
TIMEDIFF(time1, time2)
```

Cả hai tham số đều bắt buộc, đều là biểu thức thời gian (`TIME`) hoặc ngày giờ (`DATETIME`). Nếu tham số truyền vào không hợp lệ hoặc là `NULL`, hàm sẽ trả về `NULL`.

Với bài này, có thể đặt nó bên trong hàm `MINUTE()`, vì `TIMEDIFF` tính ra hiệu thời gian, bọc thêm hàm `MINUTE` bên ngoài sẽ lấy được số phút.

2. `TIMESTAMPDIFF`: Dùng để tính hiệu thời gian giữa hai mốc ngày/giờ.

```sql
TIMESTAMPDIFF(unit,datetime_expr1,datetime_expr2)
# Giải thích tham số
# unit: Đơn vị chênh lệch thời gian trả về khi so sánh ngày giờ, các giá trị phổ biến gồm:
SECOND: giây
MINUTE: phút
HOUR: giờ
DAY: ngày
WEEK: tuần
MONTH: tháng
QUARTER: quý
YEAR: năm
# Hàm TIMESTAMPDIFF trả về kết quả datetime_expr2 - datetime_expr1 (nói dễ hiểu: mốc sau - mốc trước, tức 2 - 1), trong đó datetime_expr1 và datetime_expr2 có thể là kiểu DATE hoặc DATETIME (ví dụ "2023-01-01" hoặc "2023-01-01 00:00:00").
```

Bài này cần so sánh theo phút, vậy sẽ là `TIMESTAMPDIFF(MINUTE, thời_gian_bắt_đầu, thời_gian_kết_thúc) < 5`.

**Đáp án**:

```sql
DELETE FROM exam_record WHERE MINUTE (TIMEDIFF(submit_time , start_time)) < 5 AND score < 60
```

```sql
DELETE FROM exam_record WHERE TIMESTAMPDIFF(MINUTE, start_time, submit_time) < 5 AND score < 60
```

### Xóa bản ghi (2)

**Mô tả**: Hiện có bảng ghi nhận làm bài `exam_record` chứa dữ liệu làm bài qua nhiều năm, cấu trúc như bảng dưới:

Bảng ghi nhận làm bài `exam_record`: `start_time` là thời gian bắt đầu làm đề, `submit_time` là thời gian nộp bài (tức thời gian kết thúc; nếu chưa hoàn thành thì sẽ để trống / `NULL`).

| Field       | Type       | Null | Key | Extra          | Default | Comment              |
| ----------- | ---------- | :--: | --- | -------------- | ------- | -------------------- |
| id          | int(11)    |  NO  | PRI | auto_increment | (NULL)  | ID tự tăng           |
| uid         | int(11)    |  NO  |     |                | (NULL)  | ID người dùng        |
| exam_id     | int(11)    |  NO  |     |                | (NULL)  | ID đề thi            |
| start_time  | datetime   |  NO  |     |                | (NULL)  | Thời gian bắt đầu    |
| submit_time | datetime   | YES  |     |                | (NULL)  | Thời gian nộp bài    |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Điểm số              |

**Yêu cầu**: Trong các bản ghi của bảng `exam_record` chưa hoàn thành bài làm ==hoặc== có thời gian làm bài nhỏ hơn tròn 5 phút, hãy xóa 3 bản ghi có thời gian bắt đầu làm bài sớm nhất.

**Hướng giải quyết**: Bài này khá đơn giản, nhưng cần chú ý thông tin đề bài đưa ra: thời gian kết thúc nếu chưa hoàn thành thì sẽ để trống (`NULL`)—đây chính là một điều kiện lọc.

Điều kiện còn lại là nhỏ hơn 5 phút, tương tự bài trước, nhưng ở đây là **hoặc** (`OR`), tức chỉ cần thỏa mãn một trong hai điều kiện; ngoài ra bài cũng kiểm tra nhẹ cách dùng sắp xếp (`ORDER BY`) và `LIMIT`.

**Đáp án**:

```sql
DELETE FROM exam_record WHERE submit_time IS null OR TIMESTAMPDIFF(MINUTE, start_time, submit_time) < 5
ORDER BY start_time
LIMIT 3
# Mặc định là asc, desc là sắp xếp giảm dần
```

### Xóa bản ghi (3)

**Mô tả**: Hiện có bảng ghi nhận làm bài `exam_record` chứa dữ liệu làm bài qua nhiều năm, cấu trúc như bảng dưới:

| Field       | Type       | Null | Key | Extra          | Default | Comment              |
| ----------- | ---------- | :--: | --- | -------------- | ------- | -------------------- |
| id          | int(11)    |  NO  | PRI | auto_increment | (NULL)  | ID tự tăng           |
| uid         | int(11)    |  NO  |     |                | (NULL)  | ID người dùng        |
| exam_id     | int(11)    |  NO  |     |                | (NULL)  | ID đề thi            |
| start_time  | datetime   |  NO  |     |                | (NULL)  | Thời gian bắt đầu    |
| submit_time | datetime   | YES  |     |                | (NULL)  | Thời gian nộp bài    |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Điểm số              |

**Yêu cầu**: Hãy xóa toàn bộ bản ghi trong bảng `exam_record`, ==đồng thời đặt lại khóa chính tự tăng==.

**Hướng giải quyết**: Bài này kiểm tra sự khác biệt giữa ba câu lệnh xóa. Chú ý phần được tô sáng: yêu cầu đặt lại (reset) khóa chính.

- `DROP`: Xóa sạch bảng cùng cấu trúc bảng, không thể hoàn tác.
- `TRUNCATE`: Làm trống/định dạng lại bảng, không xóa cấu trúc bảng, không thể hoàn tác.
- `DELETE`: Xóa dữ liệu theo dòng, có thể hoàn tác (rollback).

Lý do chọn `TRUNCATE` ở đây là: `TRUNCATE` chỉ tác động lên bảng; `TRUNCATE` sẽ xóa sạch toàn bộ các dòng trong bảng nhưng giữ nguyên cấu trúc bảng cùng các ràng buộc và Index; `TRUNCATE` sẽ đặt lại giá trị tự tăng (`AUTO_INCREMENT`) của bảng; sau khi dùng `TRUNCATE`, dung lượng mà bảng và Index chiếm dụng sẽ trở về kích thước ban đầu.

Bài này cũng có thể dùng `DELETE`, nhưng sau khi xóa xong vẫn phải dùng `ALTER` chỉnh sửa bảng thủ công để đặt lại giá trị khởi đầu của khóa chính.

Tương tự, cũng có thể dùng `DROP` để xóa thẳng cả bảng bao gồm cấu trúc bảng, rồi tạo lại bảng mới.

**Đáp án**:

```sql
TRUNCATE  exam_record;
```

## Thao tác bảng và Index

### Tạo bảng mới

**Mô tả**: Hiện có một bảng thông tin người dùng chứa dữ liệu người dùng đã đăng ký trên nền tảng qua nhiều năm. Cùng với sự phát triển không ngừng của nền tảng Nowcoder và lượng người dùng tăng vọt, để phục vụ hiệu quả nhóm người dùng có mức độ hoạt động cao, cần tách một phần người dùng sang một bảng mới.

Bảng thông tin người dùng ban đầu:

| Field         | Type        | Null | Key | Default           | Extra          | Comment                 |
| ------------- | ----------- | ---- | --- | ----------------- | -------------- | ----------------------- |
| id            | int(11)     | NO   | PRI | (NULL)            | auto_increment | ID tự tăng              |
| uid           | int(11)     | NO   | UNI | (NULL)            |                | ID người dùng           |
| nick_name     | varchar(64) | YES  |     | (NULL)            |                | Biệt danh               |
| achievement   | int(11)     | YES  |     | 0                 |                | Điểm thành tựu          |
| level         | int(11)     | YES  |     | (NULL)            |                | Cấp độ người dùng       |
| job           | varchar(32) | YES  |     | (NULL)            |                | Định hướng nghề nghiệp  |
| register_time | datetime    | YES  |     | CURRENT_TIMESTAMP |                | Thời gian đăng ký       |

Với vai trò chuyên viên phân tích dữ liệu, hãy **tạo một bảng thông tin người dùng chất lượng cao `user_info_vip`** có cấu trúc giống với bảng thông tin người dùng.

Kết quả bảng cần tạo được thể hiện như bảng dưới đây. Hãy viết câu lệnh `CREATE TABLE` để ghi đầy đủ mọi ràng buộc và mô tả trong bảng vào định nghĩa bảng.

| Field         | Type        | Null | Key | Default           | Extra          | Comment                 |
| ------------- | ----------- | ---- | --- | ----------------- | -------------- | ----------------------- |
| id            | int(11)     | NO   | PRI | (NULL)            | auto_increment | ID tự tăng              |
| uid           | int(11)     | NO   | UNI | (NULL)            |                | ID người dùng           |
| nick_name     | varchar(64) | YES  |     | (NULL)            |                | Biệt danh               |
| achievement   | int(11)     | YES  |     | 0                 |                | Điểm thành tựu          |
| level         | int(11)     | YES  |     | (NULL)            |                | Cấp độ người dùng       |
| job           | varchar(32) | YES  |     | (NULL)            |                | Định hướng nghề nghiệp  |
| register_time | datetime    | YES  |     | CURRENT_TIMESTAMP |                | Thời gian đăng ký       |

**Hướng giải quyết**: Nếu đề bài có cho tên bảng cũ thì có thể dùng trực tiếp `CREATE TABLE bang_moi AS SELECT * FROM bang_cu;`. Nhưng đề bài này không đưa ra tên bảng cũ nên phải tự viết câu lệnh tạo bảng; chỉ cần chú ý thiết lập giá trị mặc định và các khóa là được, khá đơn giản. (Lưu ý: nếu chạy trên hệ thống chấm bài Nowcoder, hãy chú ý phần `COMMENT` phải khớp chính xác với comment trong đề bài—kể cả chữ hoa/chữ thường và nguyên văn tiếng Trung trên OJ gốc—nếu không sẽ không pass, đồng thời phải thiết lập bộ ký tự.)

Đáp án:

```sql
CREATE TABLE IF NOT EXISTS user_info_vip(
    id INT(11) PRIMARY KEY AUTO_INCREMENT COMMENT'ID tự tăng',
    uid INT(11) UNIQUE NOT NULL COMMENT 'ID người dùng',
    nick_name VARCHAR(64) COMMENT'Biệt danh',
    achievement INT(11) DEFAULT 0 COMMENT 'Điểm thành tựu',
    `level` INT(11) COMMENT 'Cấp độ người dùng',
    job VARCHAR(32) COMMENT 'Định hướng nghề nghiệp',
    register_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian đăng ký'
)CHARACTER SET UTF8
```

### Sửa đổi bảng

**Mô tả**: Hiện có bảng thông tin người dùng `user_info` chứa dữ liệu người dùng đã đăng ký trên nền tảng qua nhiều năm.

**Bảng thông tin người dùng `user_info`:**

| Field         | Type        | Null | Key | Default           | Extra          | Comment                 |
| ------------- | ----------- | ---- | --- | ----------------- | -------------- | ----------------------- |
| id            | int(11)     | NO   | PRI | (NULL)            | auto_increment | ID tự tăng              |
| uid           | int(11)     | NO   | UNI | (NULL)            |                | ID người dùng           |
| nick_name     | varchar(64) | YES  |     | (NULL)            |                | Biệt danh               |
| achievement   | int(11)     | YES  |     | 0                 |                | Điểm thành tựu          |
| level         | int(11)     | YES  |     | (NULL)            |                | Cấp độ người dùng       |
| job           | varchar(32) | YES  |     | (NULL)            |                | Định hướng nghề nghiệp  |
| register_time | datetime    | YES  |     | CURRENT_TIMESTAMP |                | Thời gian đăng ký       |

**Yêu cầu:** Trong bảng thông tin người dùng, hãy thêm một cột `school` lưu tối đa 15 ký tự chữ Hán vào phía sau cột `level`; đổi tên cột `job` trong bảng thành `profession` đồng thời đổi độ dài trường `varchar` thành 10; và đặt giá trị mặc định của `achievement` thành 0.

**Hướng giải quyết**: Trước tiên khi làm bài này, cần nắm được cách dùng cơ bản của câu lệnh `ALTER`:

- Thêm một cột: `ALTER TABLE ten_bang ADD COLUMN ten_cot kieu_du_lieu [FIRST | AFTER ten_cot_co_san];` (`FIRST`: thêm vào đầu bảng trước các cột khác; `AFTER`: thêm vào sau cột chỉ định)
- Sửa kiểu dữ liệu hoặc ràng buộc của cột: `ALTER TABLE ten_bang MODIFY COLUMN ten_cot kieu_moi [rang_buoc_moi];`
- Đổi tên cột: `ALTER TABLE ten_bang CHANGE COLUMN ten_cot_cu ten_cot_moi kieu_du_lieu;`
- Xóa cột: `ALTER TABLE ten_bang DROP COLUMN ten_cot;`
- Đổi tên bảng: `ALTER TABLE ten_bang RENAME [TO] ten_bang_moi;`
- Đưa một cột lên làm cột đầu tiên: `ALTER TABLE ten_bang MODIFY COLUMN ten_cot kieu_du_lieu FIRST;`

Từ khóa `COLUMN` thực tế có thể lược bỏ không cần viết, ở đây vẫn liệt kê đầy đủ theo đúng chuẩn.

Khi thực hiện chỉnh sửa, nếu có nhiều mục cần thay đổi thì có thể viết gộp chung vào một câu lệnh, nhưng cần chú ý đúng định dạng cú pháp.

**Đáp án**:

```sql
ALTER TABLE user_info
    ADD school VARCHAR(15) AFTER level,
    CHANGE job profession VARCHAR(10),
    MODIFY achievement INT(11) DEFAULT 0;
```

### Xóa bảng

**Mô tả**: Hiện có bảng ghi nhận làm bài `exam_record` chứa dữ liệu làm bài thi của người dùng qua nhiều năm. Thông thường mỗi năm sẽ tạo một bảng sao lưu `exam_record_{YEAR}` cho bảng `exam_record`, trong đó `{YEAR}` là năm tương ứng.

Hiện nay do dữ liệu ngày càng nhiều, dung lượng lưu trữ sắp cạn kiệt, hãy xóa tất cả các bảng sao lưu từ lâu đời (từ năm 2011 đến 2014) nếu chúng tồn tại.

**Hướng giải quyết**: Bài này rất đơn giản, cứ xóa trực tiếp là được. Nếu thấy bất tiện, bạn có thể liệt kê các bảng cần xóa cách nhau bằng dấu phẩy trên một dòng. Chắc hẳn sẽ có bạn thắc mắc: nếu phải xóa rất nhiều bảng thì sao? Yên tâm, nếu cần xóa nhiều bảng thì có thể viết script để thực hiện xóa hàng loạt.

**Đáp án**:

```sql
DROP TABLE IF EXISTS exam_record_2011;
DROP TABLE IF EXISTS exam_record_2012;
DROP TABLE IF EXISTS exam_record_2013;
DROP TABLE IF EXISTS exam_record_2014;
```

### Tạo Index

**Mô tả**: Hiện có bảng thông tin đề thi `examination_info` chứa thông tin các loại đề thi khác nhau. Để truy vấn bảng thuận tiện và nhanh chóng hơn, cần tạo các Index sau trên bảng `examination_info`:

Quy tắc như sau: tạo Index thông thường `idx_duration` trên cột `duration`, tạo Unique Index `uniq_idx_exam_id` trên cột `exam_id`, và tạo Full-Text Index `full_idx_tag` trên cột `tag`.

Theo yêu cầu đề bài, kết quả trả về sẽ như sau:

| examination_info | 0   | PRIMARY          | 1   | id       | A   | 0   |     |     |     | BTREE    |
| ---------------- | --- | ---------------- | --- | -------- | --- | --- | --- | --- | --- | -------- |
| examination_info | 0   | uniq_idx_exam_id | 1   | exam_id  | A   | 0   |     |     | YES | BTREE    |
| examination_info | 1   | idx_duration     | 1   | duration | A   | 0   |     |     |     | BTREE    |
| examination_info | 1   | full_idx_tag     | 1   | tag      |     | 0   |     |     | YES | FULLTEXT |

Ghi chú: Hệ thống chấm bài phía sau sẽ chạy câu lệnh `SHOW INDEX FROM examination_info` để đối chiếu kết quả đầu ra.

**Hướng giải quyết**: Để làm bài này, trước hết cần nắm các loại Index phổ biến:

- B-Tree Index: B-Tree (cây cân bằng) Index là loại Index phổ biến và mặc định nhất. Nó phù hợp với nhiều điều kiện truy vấn khác nhau và có thể nhanh chóng định vị dữ liệu thỏa mãn điều kiện. B-Tree Index phù hợp cho thao tác tra cứu thông thường, hỗ trợ truy vấn so sánh bằng, truy vấn theo khoảng (range query) và sắp xếp.
- Unique Index: Unique Index tương tự B-Tree Index thông thường, điểm khác biệt là nó yêu cầu giá trị của cột được đánh Index phải là duy nhất. Điều này có nghĩa là khi chèn hoặc cập nhật dữ liệu, MySQL sẽ kiểm tra tính duy nhất của cột Index.
- Primary Key Index: Primary Key Index (Index khóa chính) là một loại Unique Index đặc biệt, dùng để định danh duy nhất mỗi dòng dữ liệu trong bảng. Mỗi bảng chỉ có thể có một Primary Key Index, giúp tăng tốc độ truy cập và đảm bảo tính toàn vẹn dữ liệu.
- Full-Text Index: Full-Text Index (Index toàn văn) dùng để tìm kiếm toàn văn trên dữ liệu văn bản. Nó hỗ trợ tìm kiếm theo từ khóa trong trường văn bản chứ không chỉ tìm kiếm so sánh bằng hay theo khoảng đơn thuần. Full-Text Index phù hợp cho các bài toán cần tìm kiếm toàn văn.

```sql
-- Ví dụ:
-- Thêm B-Tree Index:
	CREATE INDEX idx_name(ten_index) ON ten_bang (ten_cot);   -- idx_name là tên index (các dòng dưới cũng vậy)
-- Tạo Unique Index:
	CREATE UNIQUE INDEX idx_name ON ten_bang (ten_cot);
-- Tạo Primary Key Index:
	ALTER TABLE ten_bang ADD PRIMARY KEY (ten_cot);
-- Tạo Full-Text Index:
	ALTER TABLE ten_bang ADD FULLTEXT INDEX idx_name (ten_cot);

-- Qua các ví dụ trên, có thể thấy cả CREATE và ALTER đều có thể dùng để thêm Index
```

Khi đã có nền tảng kiến thức trên, đáp án của bài này trở nên rất rõ ràng.

**Đáp án**:

```sql
ALTER TABLE examination_info
    ADD INDEX idx_duration(duration),
    ADD UNIQUE INDEX uniq_idx_exam_id(exam_id),
    ADD FULLTEXT INDEX full_idx_tag(tag);
```

### Xóa Index

**Mô tả**: Hãy xóa Unique Index `uniq_idx_exam_id` và Full-Text Index `full_idx_tag` trên bảng `examination_info`.

**Hướng giải quyết**: Bài này kiểm tra cú pháp cơ bản để xóa Index:

```sql
-- Dùng DROP INDEX để xóa Index
DROP INDEX idx_name ON ten_bang;

-- Dùng ALTER TABLE để xóa Index
ALTER TABLE employees DROP INDEX idx_email;
```

Điểm cần lưu ý ở đây: trong MySQL, thao tác xóa nhiều Index cùng lúc trong một lệnh `DROP INDEX` không được hỗ trợ. Mỗi lần xóa Index chỉ có thể chỉ định một tên Index để xóa.

Hơn nữa phải **hết sức cẩn trọng** khi sử dụng lệnh **DROP**!!!

**Đáp án**:

```sql
DROP INDEX uniq_idx_exam_id ON examination_info;
DROP INDEX full_idx_tag ON examination_info;
```
