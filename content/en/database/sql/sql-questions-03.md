---
title: SQL Common Interview Questions Summary (Part 3)
description: The third part of the SQL common interview questions summary, providing in-depth explanations of aggregate functions COUNT, SUM, AVG, MAX, MIN, as well as advanced techniques like GROUP BY grouping, HAVING filtering, and clipped average calculation.
category: Database
tag:
  - Database Basics
  - SQL
head:
  - - meta
    - name: keywords
      content: SQL interview questions,aggregate functions,COUNT,SUM,AVG,MAX,MIN,GROUP BY,HAVING,clipped average
lang: en
sourceRef: zh-ref/database/sql/sql-questions-03.md
---

> Questions sourced from: [Nowcoder Question Master - SQL Advanced Challenge](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

For harder or difficult problems, you can decide whether to skip them based on your actual situation and interview preparation needs.

## Aggregate Functions

### Clipped Average Score of High-Difficulty SQL Exams (Medium-Hard)

**Description**: The operations team at Nowcoder wants to check users' scores on high-difficulty exams in the SQL category.

Please help them calculate the clipped average score (the average score after removing one maximum score and one minimum score) for all users who completed high-difficulty SQL exams from the `exam_record` table.

Sample data: `examination_info` (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time)

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Sample data: `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score)

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

Based on the input, your query output should be as follows:

| tag | difficulty | clip_avg_score |
| --- | ---------- | -------------- |
| SQL | hard       | 81.7           |

From the `examination_info` table, we can see that exam 9001 is a hard SQL exam. The submitted scores for this exam are [80, 81, 84, 90, 50]. After removing the highest score and the lowest score, the remaining scores are [80, 81, 84], with an average of 81.6666667. Rounded to one decimal place, this gives 81.7.

**Input Description:**

There are at least 3 valid scores in the input data.

**Approach 1:** To find high-difficulty SQL exams, we definitely need to join the `examination_info` table and find the high-difficulty courses. From `examination_info`, we know that the `exam_id` for the high-difficulty SQL exam is 9001, so we can use `exam_id = 9001` as the query filter condition;

First, find exam 9001: `select * from exam_record where exam_id = 9001`

Then, find the maximum score: `select max(score) 最高分 from exam_record where exam_id = 9001`

Next, find the minimum score: `select min(score) 最低分 from exam_record where exam_id = 9001`

In the retrieved score result set, to remove the maximum and minimum scores, the most intuitive approach is using `NOT IN` or `NOT EXISTS`. Here we use `NOT IN`.

First, construct the main query: `select tag, difficulty, round(avg(score), 1) clip_avg_score from examination_info info INNER JOIN exam_record record`

**Quick Tip**: MySQL's `ROUND()` function: `ROUND(X)` returns the closest integer to parameter X. `ROUND(X, D)` returns X rounded to D decimal places, using standard half-up rounding for the D-th place.

Then assemble the fragments above. Note that inside the `NOT IN`, two subqueries are combined using `UNION ALL` to aggregate the results of `MAX` and `MIN` into a single column with multiple rows.

**Solution 1:**

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

This is the most intuitive and easiest solution to think of, but it can still be improved. It takes a bit of a shortcut. Strictly adhering to the problem requirements, it should be written as:

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

However, you will notice that there is a lot of duplication, so we can use `WITH` to extract the common parts.

**Introduction to the `WITH` Clause**:

The `WITH` clause, also known as a Common Table Expression (CTE), is a way to define temporary result sets within a SQL query. It allows us to create a temporarily named result set that can be referenced within the same query.

Basic syntax:

```sql
WITH cte_name (column1, column2, ..., columnN) AS (
    -- Query body
    SELECT ...
    FROM ...
    WHERE ...
)
-- Main query
SELECT ...
FROM cte_name
WHERE ...
```

The `WITH` clause consists of the following parts:

- `cte_name`: Names the temporary table, which can be referenced in the main query.
- `(column1, column2, ..., columnN)`: Optional, specifies column aliases for the temporary table.
- `AS`: Required, indicates the start of the CTE definition.
- `CTE Query Body`: The actual query defining the data in the temporary table.

One primary use of the `WITH` clause is to enhance query readability and maintainability, especially when dealing with multiple nested subqueries or repeated query logic. By placing this logic in a named temporary table, we can organize queries more clearly and eliminate redundant code.

Furthermore, the `WITH` clause enables recursive queries in complex scenarios. Recursive queries allow us to perform multiple iterations on the same table within a single query to progressively build a result set. This is particularly useful when handling hierarchical data, organizational structures, and tree structures.

**Minor Detail**: MySQL versions 5.7 and earlier do not support directly using aliases in the `WITH` clause (CTEs were introduced in MySQL 8.0).

Here is the improved solution:

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

**Approach 2:**

- Filter high-difficulty SQL exams: `where tag="SQL" and difficulty="hard"`
- Calculate clipped average: `(Sum - Max - Min) / (Total count - 2)`:
  - `(sum(score) - max(score) - min(score)) / (count(score) - 2)`
  - One disadvantage is that if there are multiple occurrences of the maximum or minimum value, this method cannot filter them all out properly. However, the problem specifies: **`the average score after removing one maximum score and one minimum score`**, so this formula fits the requirement perfectly.

**Solution 2:**

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

### Count the Number of Attempts

There is an exam attempt record table `exam_record`. Please count the total number of attempts `total_pv`, the number of completed exam attempts `complete_pv`, and the number of distinct completed exams `complete_exam_cnt` from it.

Sample data `exam_record` table (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

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

Sample output:

| total_pv | complete_pv | complete_exam_cnt |
| -------- | ----------- | ----------------- |
| 10       | 7           | 2                 |

Explanation: Indicates that to date, there are 10 exam attempt records. The number of completed attempts is 7 (quitting halfway is considered incomplete, where submit_time and score are NULL). The completed exams are 9001 and 9002 (2 distinct exams in total).

**Approach**: Upon seeing "count the number of attempts", `COUNT` should immediately come to mind. The challenge is: how do we count different records? Using subqueries can solve this problem (it can also be written using `CASE WHEN` with similar logic). Before working on this problem, let's first review the basic usage of `COUNT()`;

The basic syntax of the `COUNT()` function is as follows:

```sql
COUNT(expression)
```

Where `expression` can be a column name, an expression, a constant, or a wildcard. Here are some common examples:

1. Count the number of all rows in a table:

```sql
SELECT COUNT(*) FROM table_name;
```

2. Count the number of non-null values in a specific column:

```sql
SELECT COUNT(column_name) FROM table_name;
```

3. Count the number of rows matching a condition:

```sql
SELECT COUNT(*) FROM table_name WHERE condition;
```

4. Used in conjunction with `GROUP BY` to count rows in each group:

```sql
SELECT column_name, COUNT(*) FROM table_name GROUP BY column_name;
```

5. Count the number of unique combinations across columns:

```sql
SELECT COUNT(DISTINCT column_name1, column_name2) FROM table_name;
```

When using `COUNT()`, omitting any argument or using `COUNT(*)` counts all rows. Using a column name counts only non-null values in that column.

In addition, the result of `COUNT()` is always an integer. Even if the result is zero, it never returns NULL—keep this firmly in mind.

**Solution**:

```sql
SELECT
	count(*) total_pv,
	( SELECT count(*) FROM exam_record WHERE submit_time IS NOT NULL ) complete_pv,
	( SELECT COUNT( DISTINCT exam_id, score IS NOT NULL OR NULL ) FROM exam_record ) complete_exam_cnt
FROM
	exam_record
```

Here, let's highlight the expression `COUNT( DISTINCT exam_id, score IS NOT NULL OR NULL )`. It evaluates whether `score` is not null. If true, it evaluates to true; if false, it returns `NULL`. Note that without `OR NULL`, when `score` is null, it would evaluate to `false` (i.e., `0`), rather than `NULL`.

`COUNT` alone cannot count rows across multiple columns; adding `DISTINCT` makes multiple columns behave as a single composite unit, allowing the count of distinct combinations. Note that `COUNT(DISTINCT ...)` only counts rows where none of the expressions evaluate to NULL.

Additionally, through this problem, we learn a common idiom for conditional counting: `COUNT(condition OR NULL)`.

### Minimum Score Not Less Than the Average Score

**Description**: Find the minimum user score among those whose scores on SQL category exams are not less than the average score for that category from the exam attempt records.

Sample data: `exam_record` table (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

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

`examination_info` table (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Sample output:

| min_score_over_avg |
| ------------------ |
| 87                 |

**Explanation**: Exams 9001 and 9002 belong to the SQL category. The scores for these two exams are [80, 89, 87, 90], with an average score of 86.5. The minimum score not less than the average score is 87.

**Approach**: Such problems may seem very complex at first glance because it is hard to tell where to begin. But once we read and examine the prompt carefully, we must learn to extract key information from the problem statement. In this case: `Please find the minimum user score among those whose scores on SQL exams are not less than the average score of that category from the exam record table.` What key pieces of information can you extract at a glance to guide your solution?

Point 1: Find scores for ==SQL== exams

Point 2: The ==average score== of this exam category

Point 3: The ==minimum user score== in this category

And the "bridge" connecting them is ==not less than==

Breaking down the conditions step by step:

```sql
-- Find scores where tag is 'SQL'   [80, 89, 87, 90]
-- Then calculate the average score of this group
select  ROUND(AVG(score), 1) from  examination_info info INNER JOIN exam_record record
	where info.exam_id = record.exam_id
	and tag= 'SQL'
```

Then find the minimum score in this exam category, and compare the result set `[80, 89, 87, 90]` against the average score to arrive at the final answer.

**Solution**:

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

Although the requirements in such problems seem convoluted, by breaking down a large condition into smaller sub-conditions and assembling them step by step, the problem becomes straightforward. Remember: **grasp the main trunk, untangle the branches**, and the solution will reveal itself.

## Grouped Queries (GROUP BY)

### Average Active Days and Monthly Active Users (MAU)

**Description**: User attempt records in the Nowcoder exam area are stored in the table `exam_record` as follows:

`exam_record` table (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

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

Please calculate the average active days per user `avg_active_days` and monthly active users `mau` for each month in 2021 in the exam area. The sample output for the above data is as follows:

| month  | avg_active_days | mau |
| ------ | --------------- | --- |
| 202107 | 1.50            | 2   |
| 202109 | 1.25            | 4   |

**Explanation**: In July 2021, 2 users were active, totaling 3 active days (1001 active for 1 day, 1002 active for 2 days), giving an average of 1.5 active days; in September 2021, 4 users were active, totaling 5 active days, giving an average of 1.25 active days. Results are rounded to 2 decimal places.

Note: Here, active refers to having a ==submission== action (where `submit_time` is recorded).

**Approach**: After reading the prompt, first note the highlighted text; generally, finding active days and monthly active users should immediately bring relevant date functions to mind. We break down this problem as well, simplifying the details before solving: First, to find active users, `COUNT()` must be used. But there is a potential trap here—did everyone notice? User 1002 took two different exams in September, so deduplication is essential; otherwise, the count of active users will be incorrect. Second, date formatting: as shown in the table above, the problem requires formatting the date like `202107`, which requires `DATE_FORMAT`.

Basic syntax:

`DATE_FORMAT(date_value, format)`

- `date_value`: The date or time value to format.
- `format`: The target date/time format specifier (similar to date formats in Java).

**Solution**:

```sql
SELECT DATE_FORMAT(submit_time, '%Y%m') MONTH,
                                        round(count(DISTINCT UID, DATE_FORMAT(submit_time, '%Y%m%d')) / count(DISTINCT UID), 2) avg_active_days,
                                        COUNT(DISTINCT UID) mau
FROM exam_record
WHERE YEAR (submit_time) = 2021
GROUP BY MONTH
```

As an added note, using `COUNT(DISTINCT uid, DATE_FORMAT(submit_time, '%Y%m%d'))` counts the number of distinct combination values of the `uid` column and the `submit_time` column formatted by year, month, and day.

### Total Monthly Practice Questions and Daily Average Practice Questions

**Description**: There is a question practice record table `practice_record` with sample content as follows:

| id  | uid  | question_id | submit_time         | score |
| --- | ---- | ----------- | ------------------- | ----- |
| 1   | 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 2   | 1002 | 8001        | 2021-09-02 19:30:01 | 50    |
| 3   | 1002 | 8001        | 2021-09-02 19:20:01 | 70    |
| 4   | 1002 | 8002        | 2021-09-02 19:38:01 | 70    |
| 5   | 1003 | 8002        | 2021-08-01 19:38:01 | 80    |

Please calculate the total monthly questions practiced `month_q_cnt` and daily average questions practiced `avg_day_q_cnt` for users in each month of 2021 (sorted in ascending order by month), as well as the overall summary for that year. Sample output is as follows:

| submit_month | month_q_cnt | avg_day_q_cnt |
| ------------ | ----------- | ------------- |
| 202108       | 2           | 0.065         |
| 202109       | 3           | 0.100         |
| 2021 汇总    | 5           | 0.161         |

**Explanation**: In August 2021, there were 2 practice records, and the daily average was 2/31 = 0.065 (rounded to 3 decimal places); in September 2021, there were 3 practice records, and the daily average was 3/30 = 0.100; for the year 2021 overall, there were 5 practice records (the yearly summary daily average has no practical calendar meaning; here we calculate it based on 31 days: 5/31 = 0.161).

> Nowcoder has adopted the latest MySQL version. If your execution returns the error: ONLY_FULL_GROUP_BY, it means: for GROUP BY aggregation operations, if a column in SELECT does not appear in GROUP BY, the SQL statement is invalid because the column is not in the GROUP BY clause. In other words, any selected column must appear in the GROUP BY clause or inside an aggregate function; otherwise, an error will be thrown.

**Approach:**

Seeing the sample data should immediately bring relevant functions to mind. For example, `submit_month` requires `DATE_FORMAT` to format the date. Then find the number of practice questions per month.

Monthly practice question count:

```sql
SELECT MONTH ( submit_time ), COUNT( question_id )
FROM
	practice_record
GROUP BY
	MONTH (submit_time)
```

Next, for the third column, we need to use the `DAY(LAST_DAY(date_value))` function to find the number of days in the month of the given date.

Example code:

```sql
SELECT DAY(LAST_DAY('2023-07-08')) AS days_in_month;
-- Output: 31

SELECT DAY(LAST_DAY('2023-02-01')) AS days_in_month;
-- Output: 28 (February in a non-leap year)

SELECT DAY(LAST_DAY(NOW())) AS days_in_current_month;
-- Output: 31 (Days in current month)
```

Use `LAST_DAY()` to get the last day of the month for the given date, and then use `DAY()` to extract the day component. This yields the total number of days in the specified month.

Note that `LAST_DAY()` returns a date value, while `DAY()` is used to extract the day portion from a date value.

With the above analysis, we can write out the answer immediately. This problem is complicated only by date manipulation; the underlying logic is straightforward.

**Solution**:

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

In the sample output, because the last row requires summary data, `UNION ALL` is used to append it to the result set. Don't forget to sort at the end!

### Active Users with More Than 1 Incomplete Exam (Medium-Hard)

**Description**: Given the exam attempt record table `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score), sample data is as follows:

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

And an exam information table `examination_info` (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time), sample data is as follows:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | SQL  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Please count the statistics for active users in 2021 whose number of incomplete exam attempts is greater than 1 (an active user is defined as having completed at least 1 exam attempt and having fewer than 5 incomplete attempts). Output user ID, incomplete exam count, completed exam count, and the set of tags of exams attempted, sorted by the number of incomplete exams in descending order. Sample output:

| uid  | incomplete_cnt | complete_cnt | detail                                                                      |
| ---- | -------------- | ------------ | --------------------------------------------------------------------------- |
| 1002 | 2              | 4            | 2021-09-01:算法;2021-07-02:SQL;2021-09-02:SQL;2021-09-05:SQL;2021-07-05:SQL |

**Explanation**: In the 2021 attempt records, except for 1004, all other users satisfy the active user definition, but only 1002 has more than 1 incomplete exam. Therefore, only 1002 is output. In `detail`, it contains the `{date:tag}` set of exams attempted by 1002, joined with **:** between date and tag, and separated by **;** between multiple elements.

**Approach:**

After reading the question carefully, analyze the steps: first, we need a table join because `tag` must be output later;

Filter data for the year 2021:

```sql
SELECT *
FROM exam_record er
LEFT JOIN examination_info ei ON er.exam_id = ei.exam_id
WHERE YEAR (er.start_time)= 2021
```

Group by `uid`, then evaluate conditions for each user. The problem specifies: `completed exams at least 1, incomplete exams greater than 1 and less than 5`

When writing the SQL, the condition will be: `incomplete > 1 AND complete >= 1 AND incomplete < 5`

Because string concatenation with custom delimiters and sorting is required at the end, we can use the `GROUP_CONCAT` function. Here is a brief overview of its usage:

Basic syntax:

```sql
GROUP_CONCAT([DISTINCT] expr [ORDER BY {unsigned_integer | col_name | expr} [ASC | DESC] [, ...]]             [SEPARATOR sep])
```

- `expr`: The column or expression to concatenate.
- `DISTINCT`: Optional parameter, used for deduplication. When `DISTINCT` is specified, duplicate values appear only once.
- `ORDER BY`: Optional parameter, used to sort the concatenated values in ascending (`ASC`) or descending (`DESC`) order.
- `SEPARATOR sep`: Optional parameter, sets the separator between concatenated values (in this problem, we use it to specify `;`).

The `GROUP_CONCAT()` function is commonly used in `GROUP BY` clauses to aggregate values from a group of rows into a single string.

**Solution**:

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

- `SUM(CASE WHEN a.submit_time IS NULL THEN 1 END)` counts the number of incomplete records for each user.
- `SUM(CASE WHEN a.submit_time IS NOT NULL THEN 1 END)` counts the number of completed records for each user.
- `GROUP_CONCAT(DISTINCT CONCAT(DATE_FORMAT(a.start_time, '%Y-%m-%d'), ':', b.tag) ORDER BY a.start_time SEPARATOR ';')` concatenates each user's exam date and tag separated by semicolons, sorted by exam start time.

## Nested Subqueries

### Preferred Exam Categories of Users with Monthly Average Completed Exams Not Less Than 3 (Medium-Hard)

**Description**: Given the exam attempt record table `exam_record` (`uid`: User ID, `exam_id`: Exam ID, `start_time`: Start Time, `submit_time`: Submit Time, NULL if not submitted, `score`: Score), sample data is as follows:

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

Exam information table `examination_info` (`exam_id`: Exam ID, `tag`: Exam Category, `difficulty`: Exam Difficulty, `duration`: Exam Duration, `release_time`: Release Time), sample data is as follows:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2020-01-01 10:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Please count from the tables the preferred categories and attempt counts of users whose "monthly average completed exams" is not less than 3, and output in descending order by count. Sample output:

| tag  | tag_cnt |
| ---- | ------- |
| C++  | 4       |
| SQL  | 2       |
| 算法 | 1       |

**Explanation**: Users 1002 and 1005 both completed 3 exams in September 2021, while all other users completed fewer than 3; then the tag distribution of exams attempted by users 1002 and 1005, sorted by attempt count in descending order, is C++, SQL, and `算法` (Algorithms).

**Approach**: This problem tests joined subqueries. The crux lies in `monthly average completed >= 3`. However, the phrasing in the problem description is somewhat ambiguous—stating it as finding users with at least 3 completions in a given month would make it much easier to understand; it does not mean that every month must be >= 3 or total attempts divided by total months. Do not misunderstand the requirement.

First, query which users have more than 3 completions in a single month:

```sql
SELECT UID
FROM exam_record record
GROUP BY UID,
         MONTH (start_time)
HAVING count(submit_time) >= 3
```

With this step established, proceed deeper: once this logic is understood (without being misled by "monthly average"), wrap it in a subquery to find which users are included, and then select the columns requested by the problem. Remember to sort!

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

### Number of Test-Takers and Average Score on the Exam Release Date

**Description**: Given the user information table `user_info` (`uid` User ID, `nick_name` Nickname, `achievement` Achievement Points, `level` User Level, `job` Career Direction, `register_time` Registration Time), sample data is as follows:

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2100        | 6     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 1500        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1100        | 4     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

**Interpretation**: User 1001 has nickname `牛客 1 号`, achievement 3100, level 7, career direction `算法` (Algorithms), registration time 2020-01-01 10:00:00.

Exam information table `examination_info` (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time), sample data is as follows:

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2020-02-01 10:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2020-08-02 10:00:00 |

Exam attempt record table `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score), sample data is as follows:

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

Please calculate the number of test-takers `uv` and average score `avg_score` for users above level 5 who attempted each SQL category exam on the day it was released. Sort by number of users in descending order, and by average score in ascending order for ties. Sample output:

| exam_id | uv  | avg_score |
| ------- | --- | --------- |
| 9001    | 3   | 81.3      |

Explanation: There is only one exam in the SQL category, with exam ID 9001. On its release date (2021-09-01), users 1001, 1002, 1003, and 1005 took the exam. However, user 1003 is level 5, while the other 3 users are above level 5. The scores of these three users are [70, 80, 85, 90], with an average score of 81.3 (rounded to 1 decimal place).

**Approach**: This problem looks very complex, but by gradually breaking down the "outer" conditions and bringing them together, the answer emerges. For multi-table queries, always remember: move from outside to inside, peeling away layers like an onion.

First, join the three tables together with some basic conditions. For instance, the problem requires users with `level > 5`, which can be queried first:

```sql
SELECT DISTINCT u_info.uid
FROM examination_info e_info
INNER JOIN exam_record record
INNER JOIN user_info u_info
WHERE e_info.exam_id = record.exam_id
  AND u_info.uid = record.uid
  AND u_info.LEVEL > 5
```

Next, pay attention to the problem requirement: `after each SQL category exam is released, users who attempted it on the same day`. Notice ==on the same day==, which immediately indicates that date comparison is needed.

Compare the exam release date with the exam start date: `DATE(e_info.release_time) = DATE(record.start_time)`. There is no need to worry about `submit_time` being NULL, as it will be filtered out subsequently in the WHERE clause.

**Solution**:

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

Pay attention to the final grouping and ordering! Sort by number of users descending; if equal, sort by average score ascending.

### User Level Distribution of Test-Takers Scoring Over 80

**Description**:

Given the user information table `user_info` (`uid` User ID, `nick_name` Nickname, `achievement` Achievement Points, `level` User Level, `job` Career Direction, `register_time` Registration Time):

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2100        | 6     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 1500        | 5     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1100        | 4     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 3000        | 6     | C++  | 2020-01-01 10:00:00 |

Exam information table `examination_info` (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Exam attempt record table `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

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

Count the user level distribution of test-takers who scored over 80 on SQL category exams, sorted by count in descending order (all counts are guaranteed to be distinct). Sample output:

| level | level_cnt |
| ----- | --------- |
| 6     | 2         |
| 5     | 1         |

Explanation: Exam 9001 is a SQL exam. Users scoring over 80 on this exam are 1002, 1003, and 1005 (3 users in total): two at level 6 and one at level 5.

**Approach:** This question uses the same dataset as the previous one; only the query criteria have changed. Once you understand the previous problem, this one can be solved in minutes.

**Solution**:

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

## Combined Queries (UNION)

### Number of Users and Attempts for Each Question and Exam

**Description**:

Given the exam attempt record table `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:41:01 | 81     |
| 2   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 3   | 1002 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 80     |
| 4   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 5   | 1004 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | 85     |
| 6   | 1002 | 9002    | 2021-09-01 12:01:01 | (NULL)              | (NULL) |

Question practice record table `practice_record` (`uid` User ID, `question_id` Question ID, `submit_time` Submit Time, `score` Score):

| id  | uid  | question_id | submit_time         | score |
| --- | ---- | ----------- | ------------------- | ----- |
| 1   | 1001 | 8001        | 2021-08-02 11:41:01 | 60    |
| 2   | 1002 | 8001        | 2021-09-02 19:30:01 | 50    |
| 3   | 1002 | 8001        | 2021-09-02 19:20:01 | 70    |
| 4   | 1002 | 8002        | 2021-09-02 19:38:01 | 70    |
| 5   | 1003 | 8001        | 2021-08-02 19:38:01 | 70    |
| 6   | 1003 | 8001        | 2021-08-02 19:48:01 | 90    |
| 7   | 1003 | 8002        | 2021-08-01 19:38:01 | 80    |

Please count the number of users and attempts for each question and each exam, displayed in descending order of uv & pv separately for "exams" and "questions". Sample output is as follows:

| tid  | uv  | pv  |
| ---- | --- | --- |
| 9001 | 3   | 3   |
| 9002 | 1   | 3   |
| 8001 | 3   | 5   |
| 8002 | 2   | 2   |

**Explanation**: For "exams", 3 users attempted exam 9001 a total of 3 times, and 1 user attempted exam 9002 3 times; for "questions", 3 users practiced question 8001 5 times, and 2 users practiced question 8002 2 times.

**Approach**: The difficulty and common pitfall in this problem lie in using `UNION` and `ORDER BY` simultaneously.

Consider the following scenarios: using `UNION` with multiple `ORDER BY` clauses without parentheses causes an error!

`ORDER BY` inside individual clauses connected by `UNION` does not take effect directly;

For example, without parentheses:

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

This immediately throws a syntax error. Without parentheses, only a single `ORDER BY` at the very end is allowed.

There is another situation where `ORDER BY` in a subclause does not take effect unless it is inside a derived table. The solution here is to wrap an outer query around each clause.

**Solution**:

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

### Users Meeting the Criteria of Two Distinct Activities

**Description**: To encourage more users to study and make progress by practicing questions on the Nowcoder platform, perk vouchers are frequently distributed to users who are both active and perform well. Suppose previously there were two operational promotions: perk vouchers were distributed to users who scored at least 85 on every exam attempted (activity1), and to users who completed a high-difficulty exam in half the allowed duration or less with a score above 80 at least once (activity2).

Now, you need to filter out the users who meet the criteria for these two activities in a single query and provide the result to the operations team. Please write a SQL query to output: for the year 2021, the user ID and activity code for all users who scored at least 85 on every exam attempt, and users who completed a high-difficulty exam in half the time or less with a score above 80 at least once. Sort the output by user ID.

Exam information table `examination_info` (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Exam attempt record table `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

| id  | uid  | exam_id | start_time          | submit_time         | score  |
| --- | ---- | ------- | ------------------- | ------------------- | ------ |
| 1   | 1001 | 9001    | 2021-09-01 09:01:01 | 2021-09-01 09:31:00 | 81     |
| 2   | 1002 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 70     |
| 3   | 1003 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:40:01 | **86** |
| 4   | 1003 | 9002    | 2021-09-01 12:01:01 | 2021-09-01 12:31:01 | 89     |
| 5   | 1004 | 9001    | 2021-09-01 19:01:01 | 2021-09-01 19:30:01 | 85     |

Sample output:

| uid  | activity  |
| ---- | --------- |
| 1001 | activity2 |
| 1003 | activity1 |
| 1004 | activity1 |
| 1004 | activity2 |

**Explanation**: User 1001 has a minimum score of 81 (fails activity 1), but completed a 60-minute exam in 29 minutes and 59 seconds with a score of 81 (meets activity 2); user 1003 has a minimum score of 86 (meets activity 1), but all completion durations were greater than half the exam duration (fails activity 2); user 1004 took exactly half the time (30 minutes flat) to complete an exam with a score of 85, satisfying both activity 1 and activity 2.

**Approach**: This problem involves timestamp difference calculation, requiring the `TIMESTAMPDIFF()` function to calculate the minute difference between two timestamps.

Let's review its basic usage:

Example:

```sql
TIMESTAMPDIFF(MINUTE, start_time, end_time)
```

The first argument of `TIMESTAMPDIFF()` is the time unit; here we choose `MINUTE` to return the difference in minutes. The second argument is the earlier timestamp, and the third is the later timestamp. The function returns the minute difference between them.

Having understood the usage of this function, let's look back at the requirements for `activity1`: scores must be at least 85 across all attempts. Writing this out first will clarify subsequent steps:

```sql
SELECT DISTINCT UID
FROM exam_record
WHERE score >= 85
  AND YEAR (start_time) = '2021'
```

Next, per condition 2, write out the query for `users who completed a hard exam in half the time or less with score greater than 80`:

```sql
SELECT UID
FROM examination_info info
INNER JOIN exam_record record
WHERE info.exam_id = record.exam_id
  AND (TIMESTAMPDIFF(MINUTE, start_time, submit_time)) < (info.duration / 2)
  AND difficulty = 'hard'
  AND score >= 80
```

Then combine both queries using `UNION`. (Pay special attention to parentheses and `ORDER BY` placement, as explained in the previous section).

**Solution**:

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

## Join Queries

### Number of Completed Exams and Practiced Questions for Qualified Users (Hard)

**Description**:

User information table `user_info` (`uid` User ID, `nick_name` Nickname, `achievement` Achievement Points, `level` User Level, `job` Career Direction, `register_time` Registration Time):

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2300        | 7     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 2500        | 7     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 2000        | 6     | C++  | 2020-01-01 10:00:00 |

Exam information table `examination_info` (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | hard       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Exam attempt record table `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

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

Question practice record table `practice_record` (`uid` User ID, `question_id` Question ID, `submit_time` Submit Time, `score` Score):

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

Please find users whose average score on high-difficulty SQL exams is greater than 80 and who are level 7 "red-name masters". Count their total completed exams and total practiced questions in 2021, keeping only users who have exam completion records in 2021. Sort results by completed exams in ascending order, and by practiced questions in descending order.

Sample output is as follows:

| uid  | exam_cnt | question_cnt |
| ---- | -------- | ------------ |
| 1001 | 1        | 2            |
| 1003 | 2        | 0            |

Explanation: Users 1001, 1003, 1004, and 1006 satisfy the condition that their average score on hard SQL exams is greater than 80, but only 1001 and 1003 are level 7 red-name masters; 1001 completed 1 exam and practiced 2 questions; 1003 completed 2 exams (9001, 9002) and practiced 0 questions (hence counted as 0).

**Approach:**

First perform preliminary filtering, such as finding users who took hard SQL exams:

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

Then, layer on the remaining conditions according to the problem requirements;

However, take note of two critical points:

First: We cannot put `YEAR(submit_time) = 2021` into the final `WHERE` clause; it must be in the `ON` condition of the join. Because a left join preserves all rows from the left table even when the right table has no match (NULL), placing it in the `ON` clause of the `JOIN` condition ensures that only records meeting the year condition participate in the join. This prevents records from other years from being included. For example, 1001 took exams in 2021, but had no practice records in 2021; if placed at the end in WHERE, such cases would be improperly filtered out.

Second: We must use `COUNT(DISTINCT er.exam_id) exam_cnt, COUNT(DISTINCT pr.id) question_cnt` with `DISTINCT`, because the left join produces multiple duplicate combinations.

**Solution**:

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

Attentive readers might wonder: why does user 1003 still show two exam records where one exam's `tag` is `C++`, even though we restricted `tag = 'SQL' AND difficulty = 'hard'`? This is because the subquery only defines the qualification criteria for user `uid`s (filtering for users whose average score on hard SQL exams is > 80). In the outer query, we count all completed exams for that qualified user in 2021 across all categories.

### Activity Statistics for Level 6/7 Users (Hard)

**Description**:

User information table `user_info` (`uid` User ID, `nick_name` Nickname, `achievement` Achievement Points, `level` User Level, `job` Career Direction, `register_time` Registration Time):

| id  | uid  | nick_name | achievement | level | job  | register_time       |
| --- | ---- | --------- | ----------- | ----- | ---- | ------------------- |
| 1   | 1001 | 牛客 1 号 | 3100        | 7     | 算法 | 2020-01-01 10:00:00 |
| 2   | 1002 | 牛客 2 号 | 2300        | 7     | 算法 | 2020-01-01 10:00:00 |
| 3   | 1003 | 牛客 3 号 | 2500        | 7     | 算法 | 2020-01-01 10:00:00 |
| 4   | 1004 | 牛客 4 号 | 1200        | 5     | 算法 | 2020-01-01 10:00:00 |
| 5   | 1005 | 牛客 5 号 | 1600        | 6     | C++  | 2020-01-01 10:00:00 |
| 6   | 1006 | 牛客 6 号 | 2600        | 7     | C++  | 2020-01-01 10:00:00 |

Exam information table `examination_info` (`exam_id` Exam ID, `tag` Exam Category, `difficulty` Exam Difficulty, `duration` Exam Duration, `release_time` Release Time):

| id  | exam_id | tag  | difficulty | duration | release_time        |
| --- | ------- | ---- | ---------- | -------- | ------------------- |
| 1   | 9001    | SQL  | hard       | 60       | 2021-09-01 06:00:00 |
| 2   | 9002    | C++  | easy       | 60       | 2021-09-01 06:00:00 |
| 3   | 9003    | 算法 | medium     | 80       | 2021-09-01 10:00:00 |

Exam attempt record table `exam_record` (`uid` User ID, `exam_id` Exam ID, `start_time` Start Time, `submit_time` Submit Time, `score` Score):

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

Question practice record table `practice_record` (`uid` User ID, `question_id` Question ID, `submit_time` Submit Time, `score` Score):

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

Please calculate for each level 6/7 user their total active months, active days in 2021, active days taking exams in 2021, and active days answering practice questions in 2021, sorted by total active months and active days in 2021 in descending order. Sample output is as follows:

| uid  | act_month_total | act_days_2021 | act_days_2021_exam |
| ---- | --------------- | ------------- | ------------------ |
| 1006 | 3               | 4             | 1                  |
| 1001 | 2               | 2             | 1                  |
| 1005 | 1               | 1             | 1                  |
| 1002 | 1               | 0             | 0                  |
| 1003 | 0               | 0             | 0                  |

**Explanation**: There are 5 users at level 6/7. Among them, 1006 was active in 3 months (202109, 202108, 202008). In 2021, active dates were 20210907, 20210804, 20210803, and 20210802 (4 days in total). In 2021, 1006 was active for 1 day in the exam area (20210907), and active for 3 days in the question practice area.

**Approach:**

The key to this problem lies in the use of `CASE WHEN THEN`; otherwise, multiple `LEFT JOIN`s would be required, producing large intermediate result sets.

The `CASE WHEN THEN` statement is a conditional expression used in SQL to perform different operations or return different results based on conditions.

The syntax structure is as follows:

```sql
CASE
    WHEN condition1 THEN result1
    WHEN condition2 THEN result2
    ...
    ELSE result
END
```

In this structure, multiple `WHEN` clauses can be added as needed, with each `WHEN` clause followed by a condition and a result. The condition can be any logical expression; if the condition is satisfied, the corresponding result is returned.

The final `ELSE` clause is optional, specifying the default return result when none of the preceding conditions are met. If no `ELSE` clause is provided, `NULL` is returned by default.

For example:

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

In the example above, depending on the range of a student's score, the `CASE WHEN THEN` statement returns the corresponding grade (`grade`). If score is >= 90, it returns `'优秀'` (Excellent); if >= 80, it returns `'良好'` (Good); if >= 60, it returns `'及格'` (Pass); otherwise it returns `'不及格'` (Fail).

Having understood the above usage, looking back at this problem, we need to list different counts of active days:

```sql
count(distinct act_month) as act_month_total,
count(distinct case when year(act_time)='2021'then act_day end) as act_days_2021,
count(distinct case when year(act_time)='2021' and tag='exam' then act_day end) as act_days_2021_exam,
count(distinct case when year(act_time)='2021' and tag='question'then act_day end) as act_days_2021_question
```

Here, `tag` is a synthetic marker added beforehand to distinguish queries between exam attempts and practice questions.

Find users in the exam area:

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

Next, find users in the question practice area:

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

Finally, combine both results with `UNION ALL`, right join with `user_info`, and remember to sort the result (this problem reflects a divide-and-conquer strategy).

**Solution**:

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
