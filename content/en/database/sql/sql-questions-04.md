---
title: "SQL Common Interview Questions Summary (Part 4)"
description: "Part 4 of the SQL common interview questions summary, detailing the usage and application scenarios of MySQL 8.0 window functions including ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD, and more."
category: Database
tag:
  - Database Fundamentals
  - SQL
head:
  - - meta
    - name: keywords
      content: SQL Interview Questions,Window Functions,ROW_NUMBER,RANK,DENSE_RANK,NTILE,LAG,LEAD,MySQL 8.0
lang: en
sourceRef: zh-ref/database/sql/sql-questions-04.md
---

> Problems sourced from: [Nowcoder - Advanced SQL Practice](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

For harder or difficult problems, you can decide whether to skip them based on your own situation and interview preparation needs.

## Specialized Window Functions

MySQL 8.0 introduced support for window functions. Below are common window functions in MySQL and their usages:

1. `ROW_NUMBER()`: Assigns a unique integer value to each row in the query result set.

```sql
SELECT col1, col2, ROW_NUMBER() OVER (ORDER BY col1) AS row_num
FROM table;
```

2. `RANK()`: Calculates the rank of each row in the sorted results. (Rows with equal values receive the same rank, and subsequent ranks are skipped.)

```sql
SELECT col1, col2, RANK() OVER (ORDER BY col1 DESC) AS ranking
FROM table;
```

3. `DENSE_RANK()`: Calculates the rank of each row in the sorted results, preserving identical ranks without skipping numbers.

```sql
SELECT col1, col2, DENSE_RANK() OVER (ORDER BY col1 DESC) AS ranking
FROM table;
```

4. `NTILE(n)`: Divides the results into `n` roughly equal buckets and assigns a bucket identifier to each row.

```sql
SELECT col1, col2, NTILE(4) OVER (ORDER BY col1) AS bucket
FROM table;
```

5. `SUM()`, `AVG()`, `COUNT()`, `MIN()`, `MAX()`: These aggregate functions can also be used in conjunction with window functions to calculate the sum, average, count, minimum, and maximum of specified columns within the window frame.

```sql
SELECT col1, col2, SUM(col1) OVER () AS sum_col
FROM table;
```

6. `LEAD()` and `LAG()`: The `LEAD` function retrieves the value of a row at a given offset after the current row, while the `LAG` function retrieves the value of a row at a given offset before the current row.

```sql
SELECT col1, col2, LEAD(col1, 1) OVER (ORDER BY col1) AS next_col1,
                 LAG(col1, 1) OVER (ORDER BY col1) AS prev_col1
FROM table;
```

7. `FIRST_VALUE()` and `LAST_VALUE()`: The `FIRST_VALUE` function retrieves the first value of a specified column within the window frame, while the `LAST_VALUE` function retrieves the last value of a specified column within the window frame.

```sql
SELECT col1, col2, FIRST_VALUE(col2) OVER (PARTITION BY col1 ORDER BY col2) AS first_val,
                 LAST_VALUE(col2) OVER (PARTITION BY col1 ORDER BY col2) AS last_val
FROM table;
```

Window functions typically need to be used in conjunction with the `OVER` clause, which defines the window frame size, sorting rules, and partitioning method.

### Top 3 Scores for Each Exam Category

**Description**:

Given the exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Find the top 3 scores for each exam category. If two users have the same maximum score, choose the one with the higher minimum score; if still the same, choose the one with the larger `uid`. Based on the sample data, the output is as follows:

| tid  | uid  | ranking |
| ---- | ---- | ------- |
| SQL  | 1003 | 1       |
| SQL  | 1004 | 2       |
| SQL  | 1002 | 3       |
| 算法 | 1005 | 1       |
| 算法 | 1006 | 2       |
| 算法 | 1003 | 3       |

**Explanation**: The exam tags with scored attempt records are SQL and `算法` (Algorithms). For the SQL exams, users 1001, 1002, 1003, and 1004 have scored attempts, with maximum scores of 81, 81, 89, and 85, and minimum scores of 78, 81, 86, and 40, respectively. Therefore, ranking first by maximum score and then by minimum score yields the top three users: 1003, 1004, and 1002.

**Answer**:

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

### Exams Where the Difference Between Second Fastest and Second Slowest Time Exceeds Half the Exam Duration (Harder)

**Description**:

Given the exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | hard       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Find the exam information where the difference between the second fastest and second slowest completion time is greater than half of the exam duration, ordered by exam ID in descending order. Based on the sample data, the output is as follows:

| exam_id | duration | release_time        |
| ------- | -------- | ------------------- |
| 9001    | 60       | 2021-09-01 06:00:00 |

**Explanation**: Exam 9001 has completion times of 50 minutes, 58 minutes, 30 minutes 1 second, 19 minutes, and 10 minutes. The difference between the second slowest (50 minutes) and second fastest (19 minutes) completion times is 50 minutes - 19 minutes = 31 minutes. Since the exam duration is 60 minutes, 31 minutes is greater than half the exam duration (30 minutes), satisfying the condition. Output the exam ID, duration, and release time.

**Approach:**

Step 1: Find the ascending and descending completion time ranks for each exam (represented as subquery `a`);

Step 2: Perform an inner join with the exam information table `b`, group by exam ID, use `HAVING` to filter records ranked second in both directions, convert seconds to minutes for comparison, and finally sort by exam ID in descending order.

**Answer**:

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

### Maximum Time Window Between Two Consecutive Exam Attempts (Harder)

**Description**:

Given the exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

| id  | uid  | exam_id | start_time          | submit_time         | score |
| --- | ---- | ------- | ------------------- | ------------------- | ----- |
| 1   | 1006 | 9003    | 2021-09-07 10:01:01 | 2021-09-07 10:21:02 | 84    |
| 2   | 1006 | 9001    | 2021-09-01 12:11:01 | 2021-09-01 12:31:01 | 89    |
| 3   | 1006 | 9002    | 2021-09-06 10:01:01 | 2021-09-06 10:21:01 | 81    |
| 4   | 1005 | 9002    | 2021-09-05 10:01:01 | 2021-09-05 10:21:01 | 81    |
| 5   | 1005 | 9001    | 2021-09-05 10:31:01 | 2021-09-05 10:51:01 | 81    |

For users who attempted exams on at least two distinct days in 2021, calculate their maximum time window between two consecutive attempts, `days_window`. Then, based on the user's historical pattern in that year, calculate how many exams on average they would take within `days_window` days. Order the output by maximum time window and average exam count in descending order. Based on the sample data, the output is as follows:

| uid  | days_window | avg_exam_cnt |
| ---- | ----------- | ------------ |
| 1006 | 6           | 2.57         |

**Explanation**: User 1006 attempted exams 3 times on 2021-09-01, 2021-09-06, and 2021-09-07. The maximum time window between two consecutive attempts is 6 days (from the 1st to the 6th inclusive). Over the 7-day span from the 1st to the 7th, they took a total of 3 exams, averaging 3 / 7 = 0.428571 exams per day. Therefore, in a 6-day window, they would take an average of 0.428571 * 6 = 2.57 exams (rounded to two decimal places). User 1005 took two exams on 2021-09-05, but only had attempt records on a single day, so they are filtered out.

**Approach:**

The explanation above hints at deduplicating attempt records—do not be misled, do NOT deduplicate! Deduplication will cause the test cases to fail. Note that the filter condition is strictly the year 2021;

Also note that the date difference must have +1 day added; and note that ==unsubmitted attempts are also counted==! (In any case, the problem description is somewhat ambiguous and not very well designed.)

**Answer**:

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

### Completion Stats for Users with Zero Incomplete Attempts in the Last Three Active Months

**Description**:

Given the exam attempt record table `exam_record` (`uid`: user ID, `exam_id`: exam ID, `start_time`: start time, `submit_time`: submission time, where NULL indicates incomplete, `score`: score):

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

Find the number of completed exams for users who have no incomplete exams in their last three months with exam attempt records. Sort by completed exam count and user ID in descending order. Based on the sample data, the output is as follows:

| uid  | exam_complete_cnt |
| ---- | ----------------- |
| 1006 | 3                 |

**Explanation**: The last three months in which user 1006 attempted exams are 202109, 202108, and 202106. The total number of attempted exams is 3, and all were completed. The last three months in which user 1001 attempted exams are 202109, 202108, and 202107. The total number of attempted exams is 5, with 4 completed. Because user 1001 has an incomplete exam, they are filtered out.

**Approach:**

1. "Find the number of completed exams for users who have no incomplete exams in their last three months with exam attempt records"—looking at this statement, we must group by user first.
2. For the last three months, use continuous dense ranking (`DENSE_RANK`) in descending order, filtering by rank `<= 3`.
3. Count the number of attempts.
4. Assemble remaining conditions (`count(dr) = count(score)`).
5. Sort the results.

**Answer**:

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

### Exam Attempt Stats in the Last Three Months for the Top 50% Users with Higher Incomplete Rate (Hard)

**Description**:

Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` level, `job` career direction, `register_time` registration time):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 3200        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 2500        | 6     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 2200        | 5     | 算法 | 2020-01-01 10:00:00 |

The exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag    | difficulty | duration | release_time        |
| --- | ------- | ------ | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL    | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL    | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | 算法   | hard       | 80       | 2020-01-01 10:00:00 |
| 4   | 9004    | PYTHON | medium     | 70       | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Among the top 50% of users with higher incomplete rates on SQL exams, count the monthly total number of attempted exams and completed exams for level 6 and level 7 users across the last three months in which they have exam attempt records. Sort the output by user ID and month in ascending order.

Based on the sample data, the output is as follows:

| uid  | start_month | total_cnt | complete_cnt |
| ---- | ----------- | --------- | ------------ |
| 1002 | 202002      | 3         | 1            |
| 1002 | 202003      | 2         | 1            |
| 1002 | 202005      | 2         | 1            |

Explanation: The incomplete count, total attempts, and incomplete rate on SQL exams for each user are as follows:

| uid  | incomplete_cnt | total_cnt | incomplete_rate |
| ---- | -------------- | --------- | --------------- |
| 1001 | 3              | 7         | 0.4286          |
| 1002 | 4              | 8         | 0.5000          |
| 1003 | 1              | 1         | 1.0000          |

Users 1001, 1002, and 1003 rank at percentile positions 1.0, 0.5, and 0.0 respectively. Therefore, the top 50% users with higher incomplete rates (percentile ranking >= 0.5 when ordered ascending) are 1002 and 1003;

User 1003 is not a level 6 or level 7 user;

The last three months with exam attempt records for user 1002 are 202005, 202003, and 202002;

During these three months, the total attempts for user 1002 were 3, 2, and 2, and the completed counts were 1, 1, and 1, respectively.

**Approach:**

Key note: Be aware that this problem asks for total attempt counts and completed counts across all exam types, while the SQL exam tag only restricts the incomplete rate ranking calculation, and level 6/7 restricts the user attempt records.

First, calculate the incomplete rate ranking:

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

Next, query the practice records for the last three months:

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

**Answer**:

```sql
SELECT t1.uid,
       t1.month_d,
       count(*) AS total_cnt,
       count(t1.submit_time) AS complete_cnt
FROM-- First calculate the ranking of incomplete rates

  (SELECT UID,
          count(submit_time IS NULL OR NULL)/ count(start_time) AS num,
          PERCENT_RANK() OVER (
                               ORDER BY count(submit_time IS NULL OR NULL)/ count(start_time)) AS ranking
   FROM exam_record
   LEFT JOIN examination_info USING (exam_id)
   WHERE tag = 'SQL'
   GROUP BY UID) t
INNER JOIN
  (-- Then query practice records for the last three months
 SELECT UID,
        date_format(start_time, '%Y%m') AS month_d,
        submit_time,
        exam_id,
        dense_rank() OVER (PARTITION BY UID
                           ORDER BY date_format(start_time, '%Y%m') DESC) AS ranking
   FROM exam_record
   LEFT JOIN user_info USING (UID)
   WHERE LEVEL IN (6,7) ) t1 USING (UID)
WHERE t1.ranking <= 3 AND t.ranking >= 0.5 -- Use constraints to find matching records

GROUP BY t1.uid,
         t1.month_d
ORDER BY t1.uid,
         t1.month_d
```

### Year-over-Year Growth Rate and Rank Delta of Completed Exams Compared to 2020 (Hard)

**Description**:

Given the exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag    | difficulty | duration | release_time        |
| --- | ------- | ------ | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL    | hard       | 60       | 2021-01-01 10:00:00 |
| 2   | 9002    | C++    | hard       | 80       | 2021-01-01 10:00:00 |
| 3   | 9003    | 算法   | hard       | 80       | 2021-01-01 10:00:00 |
| 4   | 9004    | PYTHON | medium     | 70       | 2021-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Calculate the year-over-year (YoY) growth rate of completed exam counts for each exam category in the first half of 2021 compared to the same period in 2020 (percentage format, rounded to 1 decimal place), along with the rank delta of completed exam counts. Sort the output by growth rate and 2021 rank in descending order.

Based on the sample data, the output is as follows:

| tag | exam_cnt_20 | exam_cnt_21 | growth_rate | exam_cnt_rank_20 | exam_cnt_rank_21 | rank_delta |
| --- | ----------- | ----------- | ----------- | ---------------- | ---------------- | ---------- |
| SQL | 3           | 2           | -33.3%      | 1                | 2                | 1          |

Explanation: In the first half of 2020, 3 tags had completed attempt records: C++, SQL, and PYTHON. Their completed counts were 3, 3, and 2, with rank positions 1, 1 (tied), and 3, respectively;

In the first half of 2021, 2 tags had completed attempt records: `算法` (Algorithms) and SQL. Their completed counts were 3 and 2, with rank positions 1 and 2, respectively; as shown below:

| tag    | start_year | exam_cnt | exam_cnt_rank |
| ------ | ---------- | -------- | ------------- |
| C++    | 2020       | 3        | 1             |
| SQL    | 2020       | 3        | 1             |
| PYTHON | 2020       | 2        | 3             |
| 算法   | 2021       | 3        | 1             |
| SQL    | 2021       | 2        | 2             |

Therefore, the only tag that can produce a YoY comparison result is SQL. From 2020 to 2021, the completed count went from 3 => 2, decreasing by 33.3% (rounded to 1 decimal place); its rank went from 1 => 2, dropping by 1 rank.

**Approach:**

A tricky point in this problem is that unsigned bigint data types cannot produce negative values when subtracted, so use the `CAST` function to convert the data type to `signed`.

The formula used for YoY growth rate: `(exam_cnt_21 - exam_cnt_20) / exam_cnt_20`

Rank delta of completed counts (how many positions the rank went up or down comparing 2021 to 2020):

Calculation formula: `exam_cnt_rank_21 - exam_cnt_rank_20`

In MySQL, the `CAST()` function is used to convert an expression from one data type to another. Its basic syntax is as follows:

```sql
CAST(expression AS data_type)

-- Convert a string to an integer
SELECT CAST('123' AS INT);
```

We won't list examples one by one, as this function is very straightforward.

**Answer**:

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
    # Completed counts and ranks for each exam category in H1 2020 and H1 2021
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

## Aggregate Window Functions

### Min-Max Normalization on Exam Scores

**Description**:

Given the exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag    | difficulty | duration | release_time        |
| --- | ------- | ------ | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL    | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | C++    | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | 算法   | hard       | 80       | 2020-01-01 10:00:00 |
| 4   | 9004    | PYTHON | medium     | 70       | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

In physics and statistical data calculations, there is a concept called min-max normalization (also known as feature scaling or deviation normalization), which is a linear transformation on original data that maps the resulting values into the range [0, 1].

The transformation formula is:

![Min-Max Normalization Formula](/media/jg/ext/oss.javaguide.cn/javaguide/database/sql/29A377601170AB822322431FCDF7EDFE-da7d693a.png)

Please perform min-max normalization on user scores for hard-difficulty exams within each exam's attempt records and scale them to the range [0, 100]. Output the user ID, exam ID, and the average normalized score. Finally, sort by exam ID in ascending order and average normalized score in descending order. (Note: The score range defaults to [0, 100]. If an exam attempt record contains only a single score, no formula is needed; the normalized and scaled score remains the original score).

Based on the sample data, the output is as follows:

| uid  | exam_id | avg_new_score |
| ---- | ------- | ------------- |
| 1001 | 9001    | 98            |
| 1003 | 9001    | 0             |
| 1002 | 9002    | 88            |
| 1003 | 9002    | 75            |
| 1001 | 9002    | 70            |
| 1004 | 9002    | 0             |

Explanation: The hard-difficulty exams are 9001, 9002, and 9003;

Exam 9001 has 3 attempt records with scores 68, 89, and 90. Normalizing using the given formula gives scores: 0, 95, and 100. Since the latter two scores both belong to user 1001, user 1001's new score for exam 9001 is (95 + 100) / 2 ≈ 98 (keeping only the integer part), and user 1003's new score for exam 9001 is 0. The final result is sorted by exam ID in ascending order and normalized score in descending order.

**Approach:**

Key points:

1. For hard-difficulty exams, grouped by each exam's scores, use the window functions `MAX(col) OVER()` and `MIN(col) OVER()` to find the maximum and minimum values within each group. Then calculate the normalized score according to the formula and scale to [0, 100], i.e., `min_max * 100`.
2. If a certain exam has only one score, there is no need to apply the normalization formula, because when `max_score = min_score = score`, applying the formula directly would result in division by zero or 0.
3. Finally, group by `uid` and `exam_id` to calculate the average normalized score, filtering out records where `score` is `NULL`.

Lastly, examine the formula above carefully (to be honest, this question looks quite convoluted).

**Answer**:

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

### Monthly Exam Attempt Count and Cumulative Count Through Current Month for Each Exam

**Description**:

Given the exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Please output the monthly attempt count and the cumulative attempt count through the current month for each exam.
Based on the sample data, the output is as follows:

| exam_id | start_month | month_cnt | cum_exam_cnt |
| ------- | ----------- | --------- | ------------ |
| 9001    | 202001      | 2         | 2            |
| 9001    | 202002      | 1         | 3            |
| 9001    | 202003      | 3         | 6            |
| 9001    | 202005      | 1         | 7            |
| 9002    | 202001      | 1         | 1            |
| 9002    | 202002      | 3         | 4            |
| 9002    | 202003      | 1         | 5            |

Explanation: Exam 9001 has attempt records across 4 months: 202001, 202002, 202003, and 202005. The monthly attempt counts are 2, 1, 3, and 1, respectively. The cumulative attempt counts through the current month are 2, 3, 6, and 7.

**Approach:**

There are two key requirements in this problem: counting the cumulative attempt count through the current month, and outputting the monthly attempt count along with the cumulative total.

The key expression is: `**sum(count(*)) over(partition by exam_id order by date_format(start_time,'%Y%m'))**`

**Answer**:

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

### Monthly and Cumulative Exam Participation Stats Through Current Month (Harder)

**Description**: Given the exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Please output the monthly active users (MAU), monthly new users, maximum single-month new users through the current month, and cumulative users through the current month for each month since the earliest exam attempt record. Sort the results by month in ascending order.

Based on the sample data, the output is as follows:

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

From the matrix above, we can see that in January 2020, 2 users were active (mau = 2), and the number of new users that month was 2;

In February 2020, 4 users were active, the number of new users that month was 2, the maximum single-month new users through that month was 2, and the current cumulative users was 4.

**Approach:**

Challenges:

1. How to calculate monthly new users
2. Cumulative exam participation status through the current month

General flow:

(1) Calculate each user's first login (attempt) month using `min()`

(2) Calculate monthly active users (MAU) and new users: first obtain each user's first login month, then group by first login month and sum to get the number of new users for that month

(3) Calculate the maximum single-month new users and cumulative users through the current month, finally outputting in ascending order of month

**Answer**:

```sql
-- Maximum single-month new users through current month, cumulative users through current month, sorted by month in ascending order
SELECT
	start_month,
	mau,
	month_add_uv,
	max( month_add_uv ) over ( ORDER BY start_month ),
	sum( month_add_uv ) over ( ORDER BY start_month )
FROM
	(
	-- Calculate monthly active users (MAU) and new users
	SELECT
		date_format( a.start_time, '%Y%m' ) AS start_month,
		count( DISTINCT a.uid ) AS mau,
		count( DISTINCT b.uid ) AS month_add_uv
	FROM
		exam_record a
		LEFT JOIN (
         -- Find each user's first login month
		SELECT uid, min( date_format( start_time, '%Y%m' )) AS first_month FROM exam_record GROUP BY uid ) b ON date_format( a.start_time, '%Y%m' ) = b.first_month
	GROUP BY
		start_month
	) main
ORDER BY
	start_month
```
