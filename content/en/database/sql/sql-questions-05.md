---
title: SQL Common Interview Questions Summary (5)
description: Part 5 of the SQL Common Interview Questions Summary, explaining NULL handling techniques in detail, including IFNULL and COALESCE functions, as well as using CASE WHEN for conditional statistics and completion rate calculation.
category: Databases
tag:
  - Database Fundamentals
  - SQL
head:
  - - meta
    - name: keywords
      content: SQL Interview Questions,NULL Handling,IFNULL,COALESCE,CASE WHEN,Conditional Statistics,Completion Rate Calculation
lang: en
sourceRef: zh-ref/database/sql/sql-questions-05.md
---

> Problem source: [Nowcoder - SQL Advanced Challenges](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

For harder or difficult problems, you can decide whether to skip them based on your own situation and interview needs.

## NULL Handling

### Count Incomplete Attempts and Incomplete Rate for Exams with Incomplete Submissions

**Description**:

Given the exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score), with the following data:

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:01 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | 2021-05-02 10:30:01 | 81     |
| 3   | 1001 | 9001    | 2021-09-02 12:01:01 | (NULL)              | (NULL) |

Please calculate the incomplete count `incomplete_cnt` and incomplete rate `incomplete_rate` for exams that have incomplete submissions. Based on the sample data, the output is as follows:

| exam_id | incomplete_cnt | complete_rate |
| ------- | -------------- | ------------- |
| 9001    | 1              | 0.333         |

Explanation: Exam 9001 has 3 attempt records, of which 2 are completed and 1 is incomplete. Therefore, the incomplete count is 1, and the incomplete rate is 0.333 (rounded to 3 decimal places).

**Approach**:

For this problem, you only need to pay attention to the fact that one metric has a conditional filter and the other has no conditional filter; you can either query the conditions separately and combine them, or perform conditional evaluation directly inside the `SELECT` clause.

**Answer**:

Approach 1:

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

Use `COUNT(*)` to count the total number of records in each group, while `COUNT(submit_time)` only counts the records where the `submit_time` column is not `NULL` (i.e., the number of completed attempts). Subtracting the two gives the number of incomplete attempts.

Approach 2:

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

Use a `CASE` expression to return a non-`NULL` value (such as `1`) when the condition is satisfied, and `NULL` otherwise. Then use the `COUNT` function to count the number of non-`NULL` values.

Approach 3:

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

Use the `SUM` function to sum a boolean expression. When `submit_time` is `NULL`, the expression `(submit_time IS NULL)` evaluates to `1` (`TRUE`); otherwise, it evaluates to `0` (`FALSE`). Summing these `1`s and `0`s yields the number of incomplete attempts.

### Average Time Taken and Average Score on Hard Exams for Level-0 Users

**Description**:

Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time), with the following data:

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 10          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2100        | 6     | 算法 | 2020-01-01 10:00:00 |

The exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time), with the following data:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL  | easy       | 60       | 2020-01-01 10:00:00 |
| 3   | 9004    | 算法 | medium     | 80       | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score), with the following data:

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2020-01-02 09:01:01 | 2020-01-02 09:21:59 | 80     |
| 2   | 1001 | 9001    | 2021-05-02 10:01:01 | (NULL)              | (NULL) |
| 3   | 1001 | 9002    | 2021-02-02 19:01:01 | 2021-02-02 19:30:01 | 87     |
| 4   | 1001 | 9001    | 2021-06-02 19:01:01 | 2021-06-02 19:32:00 | 20     |
| 5   | 1001 | 9002    | 2021-09-05 19:01:01 | 2021-09-05 19:40:01 | 89     |
| 6   | 1001 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |
| 7   | 1002 | 9002    | 2021-05-05 18:01:01 | 2021-05-05 18:59:02 | 90     |

Please output the average time taken and average score across all hard exams for each level-0 user; incomplete attempts default to the maximum exam duration and a score of 0. Based on the sample data, the output is as follows:

| uid  | avg_score | avg_time_took |
| ---- | --------- | ------------- |
| 1001 | 33        | 36.7          |

Explanation: The level-0 user is 1001, and the hard exam is 9001. User 1001 has 3 attempt records for exam 9001, taking 20 minutes, incomplete (exam duration 60 minutes), and 30 minutes (less than 31 full minutes), with scores of 80, incomplete (treated as 0), and 20, respectively. Therefore, their average time taken is 110/3 = 36.7 (rounded to 1 decimal place), and their average score is 33 (rounded to an integer).

**Approach**: Using `IF` is the most convenient way to perform the condition check for this problem because it involves checking for `NULL` values. Of course, `CASE WHEN` also works and is very similar. The main challenge in this problem is handling `NULL` values; the remaining query conditions should not be difficult for anyone.

**Answer**:

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

## Advanced Conditional Statements

### Filter Users by Nickname, Achievement Points, and Active Date (Harder)

**Description**:

Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time):

| id  | uid  | nick_name   | achievement | level | job  | register_time       |
| --- | ---- | ----------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号   | 1000        | 2     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号   | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 进击的 3 号 | 2200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号   | 2500        | 6     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号   | 3000        | 7     | C++  | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

The practice question record table `practice_record` (`uid` user ID, `question_id` question ID, `submit_time` submission time, `score` score):

| id  | uid  | question_id | submit_time         | score |
| --- | ---- | ----------- | ------------------- | ----- |
| 1   | 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 2   | 1002 | 8001        | 2021-09-02 19:30:01 | 50    |
| 3   | 1002 | 8001        | 2021-09-02 19:20:01 | 70    |
| 4   | 1002 | 8002        | 2021-09-02 19:38:01 | 70    |
| 5   | 1003 | 8002        | 2021-09-01 19:38:01 | 80    |

Please find the user information for users whose nickname starts with `'牛客'` and ends with `'号'`, whose achievement points are between 1200 and 2500, and whose most recent activity (answering questions or taking an exam) was in September 2021.

Based on the sample data, the output is as follows:

| uid  | nick_name | achievement |
| ---- | --------- | ----------- |
| 1002 | 牛客 2 号 | 1200        |

**Explanation**: Users whose nickname starts with `'牛客'` and ends with `'号'` and whose achievement points are between 1200 and 2500 are 1002 and 1004;

1002's most recent activity in the exam section was in September 2021, and most recent activity in the question practice section was in September 2021; 1004's most recent activity in the exam section was in August 2021, with no activity in the question practice section.

Therefore, only 1002 ultimately meets all conditions.

**Approach**:

First, write out the main query conditions based on the requirements:

Nickname starting with `'牛客'` and ending with `'号'`: `nick_name LIKE "牛客%号"`

Achievement points between 1200 and 2500: `achievement BETWEEN 1200 AND 2500`

Since the third condition restricts activity to September, you can write it directly as: `( date_format( record.submit_time, '%Y%m' )= 202109 OR date_format( pr.submit_time, '%Y%m' )= 202109 )`

**Answer**:

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

### Filter Exam Records Matching Nickname Rules and Exam Category Rules (Harder)

**Description**:

Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 1900        | 2     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 2200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 2500        | 6     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 555 号  | 2000        | 7     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 666666       | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

The exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag | difficulty | duration | release_time        |
| --- | ------- | --- | ---------- | -------- | ------------------- |
| 1   | 9001    | C++ | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | c#  | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | SQL | medium     | 70       | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Find the `exam_id` and average score of completed exams for users whose nickname consists of `"牛客"` + digits only + `"号"` or digits only, for exam categories starting with the letter `c` (such as `C`, `C++`, `c#`, etc.), sorted in ascending order by user ID and average score. Based on the sample data, the output is as follows:

| uid  | exam_id | avg_score |
| ---- | ------- | --------- |
| 1002 | 9001    | 81        |
| 1002 | 9002    | 85        |
| 1005 | 9001    | 84        |
| 1006 | 9001    | 84        |

Explanation: Users whose nickname meets the condition are 1002, 1004, 1005, and 1006;

Exams starting with `c` are 9001 and 9002;

Among the attempt records matching the above conditions, user 1002's scores on completed attempts for 9001 are 81 and 80, giving an average score of 81 (80.5 rounded to the nearest integer is 81);

User 1002's scores on completed attempts for 9002 are 90, 82, and 83, giving an average score of 85;

**Approach**:

As usual, once the conditions are given, write out each condition first.

Finding users whose nickname consists of `"牛客"` + digits only + `"号"` or digits only: I originally wrote `nick_name LIKE '牛客%号' OR nick_name REGEXP '^[0-9]+$'`, but if there were a `"牛客 H 号"` in the table, it would also pass.

So we need to use a regular expression here: `nick_name LIKE '^牛客[0-9]+号'`

For exam categories starting with the letter `c`: `e_info.tag LIKE 'c%'` or `tag regexp '^c|^C'` — the first one can also match uppercase `C`.

**Answer**:

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

### Output Different Cases Based on Whether Specified Records Exist (Difficult)

**Description**:

Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time):

| id  | uid  | nick_name   | achievement | level | job  | register_time       |
| --- | ---- | ----------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号   | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号   | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 进击的 3 号 | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号   | 25          | 0     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 555 号 | 2000        | 7     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 666666      | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Please filter the data in the tables: when any level-0 user has more than 2 incomplete exams, output each level-0 user's incomplete exam count and incomplete rate (rounded to 3 decimal places); if no such user exists, output these two metrics for all users who have attempt records. Sort the results in ascending order by incomplete rate.

Based on the sample data, the output is as follows:

| uid  | incomplete_cnt | incomplete_rate |
| ---- | -------------- | --------------- |
| 1004 | 0              | 0.000           |
| 1003 | 1              | 0.500           |
| 1001 | 4              | 0.667           |

**Explanation**: Level-0 users are 1001, 1003, and 1004; their attempted vs. incomplete exam counts are 6:4, 2:1, and 0:0, respectively;

There exists a level-0 user (1001) whose incomplete exam count is greater than 2, so output the incomplete count and incomplete rate for these three users (1004 has never attempted an exam, so the incomplete rate defaults to 0, which is 0.000 when rounded to 3 decimal places);

Sort the results in ascending order by incomplete rate.

Note: If 1001 did not satisfy "more than 2 incomplete exams", you would need to output these two metrics for 1001, 1002, and 1003, because only those three users have attempt records in the exam attempt record table.

**Approach**:

First write the SQL that finds users who might satisfy the condition **"level-0 user has more than 2 incomplete exams"**:

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

Then write the SQL query statements for the two cases separately:

Case 1. Query the incomplete exam rate of level-0 users when the required condition exists:

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

Case 2. Query the incomplete exam rate of all users with attempt records when no user meets the condition:

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

Combine them together, and you have the answer:

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

V2 Version (an improvement based on the solution above, with shorter SQL and cleaner logic):

```sql
SELECT
	ui.uid,
	SUM(
	IF
	( start_time IS NOT NULL AND score IS NULL, 1, 0 )) AS incomplete_cnt,# 3. Number of incomplete exams
	ROUND( AVG( IF ( start_time IS NOT NULL AND score IS NULL, 1, 0 )), 3 ) AS incomplete_rate # 4. Incomplete rate

FROM
	user_info ui
	LEFT JOIN exam_record USING ( uid )
WHERE
CASE

		WHEN (# 1. When any level-0 user has more than 2 incomplete exams
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
			uid IN ( # 1.1 Find every level-0 user
			SELECT uid FROM user_info WHERE LEVEL = 0 ) ELSE uid IN ( # 2. If no such user exists, find users with attempt records
			SELECT DISTINCT uid FROM exam_record )
		END
		GROUP BY
			ui.uid
	ORDER BY
	incomplete_rate # 5. Sort results by incomplete_rate in ascending order
```

### Proportion of Different Score Performances Across User Levels (Harder)

**Description**:

Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 25          | 0     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 555 号  | 2000        | 7     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 666666       | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

To obtain a qualitative performance measure of users' exam attempts, we divide exam scores into four score grades—`'优'` (Excellent), `'良'` (Good), `'中'` (Average), and `'差'` (Poor)—at the cutoff points `[90, 75, 60]` (each cutoff point is assigned to the left interval). Please calculate the proportion of each score grade among completed exams for users of different levels (rounded to 3 decimal places). Users who have never completed an exam do not need to be output. Sort the results in descending order by user level, then in descending order by proportion.

Based on the sample data, the output is as follows:

| level | score_grade | ratio |
| ----- | ----------- | ----- |
| 3     | 良          | 0.667 |
| 3     | 优          | 0.333 |
| 0     | 良          | 0.500 |
| 0     | 中          | 0.167 |
| 0     | 优          | 0.167 |
| 0     | 差          | 0.167 |

Explanation: Users who have completed exams are 1001 and 1002; the user levels and score grades corresponding to the completed exams are as follows:

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

Therefore, for level-0 users (only 1001), the proportions of each score grade are: `'优'` (Excellent) 1/6, `'良'` (Good) 1/6, `'中'` (Average) 1/6, `'差'` (Poor) 3/6; for level-3 users (only 1002), the proportions are: `'优'` (Excellent) 1/3, `'良'` (Good) 2/3. Results are rounded to 3 decimal places.

**Approach**:

First write out the condition **"divide exam scores into four score grades—`'优'`, `'良'`, `'中'`, and `'差'`—at the cutoff points `[90, 75, 60]`"**, which can be implemented using `CASE WHEN`:

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

That is the key part of this problem; the rest is just assembling the conditions and joining the tables.

**Answer**:

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

## Limit Queries

### The Three Users with the Earliest Registration Time

**Description**:

Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号    | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-02-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 22          | 0     | 算法 | 2020-01-02 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 5   | 1005 | 牛客 555 号  | 4000        | 7     | C++  | 2020-01-11 10:00:00 |
| 6   | 1006 | 666666       | 3000        | 6     | C++  | 2020-11-01 10:00:00 |

Please find the 3 users with the earliest registration time. Based on the sample data, the output is as follows:

| uid  | nick_name    | register_time       |
| ---- | ------------ | ------------------- |
| 1001 | 牛客 1       | 2020-01-01 10:00:00 |
| 1003 | 牛客 3 号 ♂ | 2020-01-02 10:00:00 |
| 1004 | 牛客 4 号    | 2020-01-02 11:00:00 |

Explanation: Sort by registration time and select the top three users, outputting their user ID, nickname, and registration time.

**Answer**:

```sql
SELECT uid, nick_name, register_time
    FROM user_info
    ORDER BY register_time
    LIMIT 3
```

### Page 3 of Users Who Completed an Exam on Their Registration Day (Harder)

**Description**: Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time):

| id  | uid  | nick_name    | achievement | level | job  | register_time       |
| --- | ---- | ------------ | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1       | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号    | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂ | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号    | 25          | 0     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 555 号  | 4000        | 7     | 算法 | 2020-01-11 10:00:00 |
| 6   | 1006 | 牛客 6 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 7   | 1007 | 牛客 7 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 8   | 1008 | 牛客 8 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 9   | 1009 | 牛客 9 号    | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 10  | 1010 | 牛客 10 号   | 25          | 0     | 算法 | 2020-01-02 11:00:00 |
| 11  | 1011 | 666666       | 3000        | 6     | C++  | 2020-01-02 10:00:00 |

The exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | 算法 | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | 算法 | hard       | 80       | 2020-01-01 10:00:00 |
| 3   | 9003    | SQL  | medium     | 70       | 2020-01-01 10:00:00 |

The exam attempt record table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

Find users whose job track (`job`) is Algorithm (`'算法'`) and who completed an Algorithm-category (`'算法'`) exam on the exact day they registered, ranked by their highest score across all exams they have taken. The leaderboard is very long, so we use paginated display with 3 records per page; now you need to retrieve the information of the users on page 3 (page numbers start at 1).

Based on the sample data, the output is as follows:

| uid  | level | register_time       | max_score |
| ---- | ----- | ------------------- | --------- |
| 1010 | 0     | 2020-01-02 11:00:00 | 76        |
| 1003 | 0     | 2020-01-01 10:00:00 | 75        |
| 1004 | 0     | 2020-01-01 11:00:00 | 60        |

Explanation: Except for 1011, all other users' job track is Algorithm Engineer (`'算法'`); Algorithm-category (`'算法'`) exams are 9001 and 9002, and all 11 users completed an Algorithm-category exam on their registration day; when calculating their maximum score across all exams, only 1002 and 1008 completed two exams while the others completed only one exam—1002's highest score across two exams is 81, and 1008's highest score is 99.

Ranked by highest score as follows:

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

With 3 records per page, page 3 corresponds to rows 7–9, so returning the rows for 1010, 1003, and 1004 is sufficient.

**Approach**:

1. With 3 records per page, we need to retrieve the users on page 3, so `LIMIT` is required.

2. To collect the **user information and the score of each record** for users whose job track is Algorithm (`'算法'`) and who completed an Algorithm-category (`'算法'`) exam on their registration day, first find the users meeting the condition, and then use `LEFT JOIN` to look up their information and each recorded score.

**Answer**:

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

## Text Conversion Functions

### Fix Misaligned (Column-Shifted) Records

**Description**: Given the exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

| id  | exam_id | tag            | difficulty | duration | release_time        |
| --- | ------- | -------------- | ---------- | -------- | ------------------- |
| 1   | 9001    | 算法           | hard       | 60       | 2021-01-01 10:00:00 |
| 2   | 9002    | 算法           | hard       | 80       | 2021-01-01 10:00:00 |
| 3   | 9003    | SQL            | medium     | 70       | 2021-01-01 10:00:00 |
| 4   | 9004    | 算法,medium,80 |            | 0        | 2021-01-01 10:00:00 |

The staff member entering the questions once accidentally entered the category `tag`, `difficulty`, and `duration` all together into the `tag` column for some records. Please help find these mis-entered records, split them, and output them according to the correct column types.

Based on the sample data, the output is as follows:

| exam_id | tag  | difficulty | duration |
| ------- | ---- | ---------- | -------- |
| 9004    | 算法 | medium     | 80       |

**Approach**:

First let's learn the function needed for this problem.

The `SUBSTRING_INDEX` function is used to extract parts of a string around a specified delimiter. It takes three arguments: the original string, the delimiter, and the number of parts to return.

Below is the syntax of the `SUBSTRING_INDEX` function:

```sql
SUBSTRING_INDEX(str, delimiter, count)
```

- `str`: The original string to be split.
- `delimiter`: The string or character used as the separator.
- `count`: Specifies the number of parts to return.
  - If `count` is greater than 0, it returns the first `count` parts starting from the left (bounded by the delimiter).
  - If `count` is less than 0, it returns the last `count` parts starting from the right (bounded by the delimiter), i.e., counting from right to left.

Below are some examples demonstrating how to use the `SUBSTRING_INDEX` function:

1. Extract the first part of a string:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', 1);
   -- Output: 'apple'
   ```

2. Extract the last part of a string:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', -1);
   -- Output: 'cherry'
   ```

3. Extract the first two parts of a string:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', 2);
   -- Output: 'apple,banana'
   ```

4. Extract the last two parts of a string:

   ```sql
   SELECT SUBSTRING_INDEX('apple,banana,cherry', ',', -2);
   -- Output: 'banana,cherry'
   ```

**Answer**:

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

### Truncate Overly Long Nicknames

**Description**: Given the user information table `user_info` (`uid` user ID, `nick_name` nickname, `achievement` achievement points, `level` user level, `job` job track, `register_time` registration time):

| id  | uid  | nick_name              | achievement | level | job  | register_time       |
| --- | ---- | ---------------------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1                 | 19          | 0     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号              | 1200        | 3     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 ♂           | 22          | 0     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号              | 25          | 0     | 算法 | 2020-01-01 11:00:00 |
| 5   | 1005 | 牛客 5678901234 号     | 4000        | 7     | 算法 | 2020-01-11 10:00:00 |
| 6   | 1006 | 牛客 67890123456789 号 | 25          | 0     | 算法 | 2020-01-02 11:00:00 |

Some users have particularly long nicknames, which break the layout in certain display scenarios, so overly long nicknames need to be converted before output. Please output the user information for users whose nickname has more than 10 characters; for users with more than 13 characters, output the first 10 characters followed by three dots: `'...'`.

Based on the sample data, the output is as follows:

| uid  | nick_name          |
| ---- | ------------------ |
| 1005 | 牛客 5678901234 号 |
| 1006 | 牛客 67890123...   |

Explanation: Users with more than 10 characters are 1005 and 1006, with lengths 13 and 17 respectively; therefore, 1006's nickname needs to be truncated on output.

**Approach**:

This problem involves character counting. To calculate the character count (i.e., length) of a string, you can use the `LENGTH` function or the `CHAR_LENGTH` function. The difference between these two functions lies in how they handle multi-byte characters.

1. `LENGTH` function: It returns the number of bytes in a given string. For strings containing multi-byte characters, each character is counted as a single byte.

Example:

```sql
SELECT LENGTH('你好'); -- Output: 6, because each Chinese character in '你好' occupies 3 bytes
```

2. `CHAR_LENGTH` function: It returns the number of characters in a given string. For strings containing multi-byte characters, each character is counted as one character.

Example:

```sql
SELECT CHAR_LENGTH('你好'); -- Output: 2, because '你好' contains 2 characters, i.e., two Chinese characters
```

**Answer**:

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

### Filtering and Counting with Inconsistent Letter Case (Harder)

**Description**:

Given the exam information table `examination_info` (`exam_id` exam ID, `tag` exam category, `difficulty` exam difficulty, `duration` exam duration, `release_time` release time):

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

The exam attempt information table `exam_record` (`uid` user ID, `exam_id` exam ID, `start_time` start time, `submit_time` submission time, `score` score):

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

The exam category `tag` may have inconsistent letter casing. Please first filter out category `tag` values whose exam attempt count is less than 3, and count the original exam attempt count corresponding to that `tag` after converting it to uppercase.

If the `tag` does not change after conversion, do not output that row.

Based on the sample data, the output is as follows:

| tag | answer_cnt |
| --- | ---------- |
| C++ | 6          |

Explanation: The exams that have been attempted are 9001, 9002, 9003, and 9004, and their `tag` and attempt counts are as follows:

| exam_id | tag  | answer_cnt |
| ------- | ---- | ---------- |
| 9001    | 算法 | 4          |
| 9002    | C++  | 6          |
| 9003    | c++  | 2          |
| 9004    | sql  | 2          |

The `tag` values with attempt count less than 3 are `c++` and `sql`, and after converting to uppercase, only `C++` already had attempt counts originally, so output the attempt count of `c++` converted to uppercase as 6.

**Approach**:

First, this problem is a bit messy: querying 9004 from the sample data gives only 1 attempt, whereas it shows 2 here.

Let's first review the case conversion functions:

1. The `UPPER(s)` or `UCASE(s)` function converts all alphabetic characters in string `s` to uppercase;

2. The `LOWER(s)` or `LCASE(s)` function converts all alphabetic characters in string `s` to lowercase.

The tricky part is self-joining the same table to query different values.

**Answer**:

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
INNER JOIN a AS b ON UPPER(a.tag)= b.tag # a is lowercase, b is uppercase
AND a.tag != b.tag
WHERE a.answer_cnt < 3;
```
