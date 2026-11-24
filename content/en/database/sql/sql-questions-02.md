---
title: "Common SQL Interview Questions Summary (Part 2)"
description: "Part 2 of the Common SQL Interview Questions Summary, explaining DML data manipulation statements such as INSERT, UPDATE, and DELETE in detail, including practical techniques like batch insertion, importing from other tables, and insert-with-update."
category: Databases
tag:
  - Database Fundamentals
  - SQL
head:
  - - meta
    - name: keywords
      content: SQL Interview Questions,INSERT,UPDATE,DELETE,Batch Insert,REPLACE INTO,Data Manipulation
lang: en
sourceRef: zh-ref/database/sql/sql-questions-02.md
---

> Problem source: [Nowcoder - SQL Advanced Challenge](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=240)

## Insert, Update, and Delete Operations

Summary of ways to insert records in SQL:

- **Standard insert (all columns)**: `INSERT INTO table_name VALUES (value1, value2, ...)`
- **Standard insert (specified columns)**: `INSERT INTO table_name (column1, column2, ...) VALUES (value1, value2, ...)`
- **Batch insert (multiple rows at once)**: `INSERT INTO table_name (column1, column2, ...) VALUES (value1_1, value1_2, ...), (value2_1, value2_2, ...), ...`
- **Import from another table**: `INSERT INTO table_name SELECT * FROM table_name2 [WHERE key=value]`
- **Insert with replace/update**: `REPLACE INTO table_name VALUES (value1, value2, ...)` (Note that the mechanism works by detecting duplicate primary key or unique index key values, deleting the existing row, and then re-inserting the new row.)

### Insert Records (1)

**Description**: The Nowcoder backend logs each user's exam answering records into the `exam_record` table. Below are the details of two users' exam records:

- User 1001 started answering exam 9001 on September 1, 2021 at 10:11:12 PM, submitted it 50 minutes later, and scored 90 points;
- User 1002 started answering exam 9002 on September 4, 2021 at 7:01:02 AM, and exited the platform 10 minutes later.

The exam record table `exam_record` has already been created with the following structure. Please insert these two records into the table using a single SQL statement.

| Field       | Type       | Null | Key | Extra          | Default | Comment           |
| ----------- | ---------- | ---- | --- | -------------- | ------- | ----------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | Auto-increment ID |
| uid         | int(11)    | NO   |     |                | (NULL)  | User ID           |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | Exam ID           |
| start_time  | datetime   | NO   |     |                | (NULL)  | Start time        |
| submit_time | datetime   | YES  |     |                | (NULL)  | Submit time       |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Score             |

**Answer**:

```sql
// Auto-increment primary key exists; no manual value assignment needed
INSERT INTO exam_record (uid, exam_id, start_time, submit_time, score) VALUES
(1001, 9001, '2021-09-01 22:11:12', '2021-09-01 23:01:12', 90),
(1002, 9002, '2021-09-04 07:01:02', NULL, NULL);
```

### Insert Records (2)

**Description**: There is an existing exam record table `exam_record` with the structure shown below, which contains many years of users' exam answering records. As the volume of data grows larger and maintenance becomes increasingly difficult, the table content needs to be trimmed and historical data needs to be backed up.

Table `exam_record`:

| Field       | Type       | Null | Key | Extra          | Default | Comment           |
| ----------- | ---------- | ---- | --- | -------------- | ------- | ----------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | Auto-increment ID |
| uid         | int(11)    | NO   |     |                | (NULL)  | User ID           |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | Exam ID           |
| start_time  | datetime   | NO   |     |                | (NULL)  | Start time        |
| submit_time | datetime   | YES  |     |                | (NULL)  | Submit time       |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Score             |

A new table `exam_record_before_2021` has already been created to back up exam records from before 2021, with the exact same structure as `exam_record`. Please import all completed exam answering records from before 2021 into this table.

**Answer**:

```sql
INSERT INTO exam_record_before_2021 (uid, exam_id, start_time, submit_time, score)
SELECT uid,exam_id,start_time,submit_time,score
FROM exam_record
WHERE YEAR(submit_time) < 2021;
```

### Insert Records (3)

**Description**: There is now a hard SQL exam with ID 9003 and a duration of 1.5 hours. Please insert it into the exam information table `examination_info` with `2021-01-01 00:00:00` as the release time. Regardless of whether an exam with this ID already exists, the insertion must succeed. Try inserting it.

Exam information table `examination_info`:

| Field        | Type        | Null | Key | Extra          | Default | Comment            |
| ------------ | ----------- | ---- | --- | -------------- | ------- | ------------------ |
| id           | int(11)     | NO   | PRI | auto_increment | (NULL)  | Auto-increment ID  |
| exam_id      | int(11)     | NO   | UNI |                | (NULL)  | Exam ID            |
| tag          | varchar(32) | YES  |     |                | (NULL)  | Category tag       |
| difficulty   | varchar(8)  | YES  |     |                | (NULL)  | Difficulty         |
| duration     | int(11)     | NO   |     |                | (NULL)  | Duration (minutes) |
| release_time | datetime    | YES  |     |                | (NULL)  | Release time       |

**Answer**:

```sql
REPLACE INTO examination_info VALUES
 (NULL, 9003, "SQL", "hard", 90, "2021-01-01 00:00:00");
```

### Update Records (1)

**Description**: There is an exam information table `examination_info` whose structure is shown below:

| Field        | Type     | Null | Key | Extra          | Default | Comment           |
| ------------ | -------- | ---- | --- | -------------- | ------- | ----------------- |
| id           | int(11)  | NO   | PRI | auto_increment | (NULL)  | Auto-increment ID |
| exam_id      | int(11)  | NO   | UNI |                | (NULL)  | Exam ID           |
| tag          | char(32) | YES  |     |                | (NULL)  | Category tag      |
| difficulty   | char(8)  | YES  |     |                | (NULL)  | Difficulty        |
| duration     | int(11)  | NO   |     |                | (NULL)  | Duration          |
| release_time | datetime | YES  |     |                | (NULL)  | Release time      |

Please update all rows in the **examination_info** table where `tag` is `PYTHON` so that `tag` becomes `Python`.

**Approach**: There are two ways to solve this problem. The most straightforward approach is to use `UPDATE + WHERE` to specify the update condition. The second approach is to perform a find-and-replace on the target column.

**Answer 1**:

```sql
UPDATE examination_info SET tag = 'Python' WHERE tag='PYTHON'
```

**Answer 2**:

```sql
UPDATE examination_info
SET tag = REPLACE(tag,'PYTHON','Python')

# REPLACE (target_column, "search_string", "replacement_string")
```

### Update Records (2)

**Description**: There is an exam record table `exam_record` containing many years of users' exam answering records, with the structure shown below. In the exam record table `exam_record`: **`submit_time`** is the completion time (pay attention to this detail).

| Field       | Type       | Null | Key | Extra          | Default | Comment           |
| ----------- | ---------- | ---- | --- | -------------- | ------- | ----------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | Auto-increment ID |
| uid         | int(11)    | NO   |     |                | (NULL)  | User ID           |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | Exam ID           |
| start_time  | datetime   | NO   |     |                | (NULL)  | Start time        |
| submit_time | datetime   | YES  |     |                | (NULL)  | Submit time       |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Score             |

**Requirement**: Please mark all ==incomplete== records in the `exam_record` table that started ==before== September 1, 2021 as passively completed—that is, set their completion time to `'2099-01-01 00:00:00'` and their score to `0`.

**Approach**: Pay attention to the highlighted keywords in the prompt: `"before <date>"`—this immediately tells you to perform a time comparison. You can compare directly using `xxx_time < "2021-09-01 00:00:00"`, or use the `DATE()` function for comparison. The second condition is `"incomplete"`, meaning the completion time is `NULL`, i.e., `submit_time IS NULL`.

**Answer**:

```sql
UPDATE exam_record SET submit_time = '2099-01-01 00:00:00', score = 0 WHERE DATE(start_time) < "2021-09-01" AND submit_time IS null
```

### Delete Records (1)

**Description**: There is an exam record table `exam_record` containing many years of users' exam answering records, with the following structure:

In the exam record table `exam_record`: **`start_time`** is the exam start time, and `submit_time` is the submission time (i.e., the end time).

| Field       | Type       | Null | Key | Extra          | Default | Comment           |
| ----------- | ---------- | ---- | --- | -------------- | ------- | ----------------- |
| id          | int(11)    | NO   | PRI | auto_increment | (NULL)  | Auto-increment ID |
| uid         | int(11)    | NO   |     |                | (NULL)  | User ID           |
| exam_id     | int(11)    | NO   |     |                | (NULL)  | Exam ID           |
| start_time  | datetime   | NO   |     |                | (NULL)  | Start time        |
| submit_time | datetime   | YES  |     |                | (NULL)  | Submit time       |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Score             |

**Requirement**: Please delete all records in `exam_record` where the answering duration is less than 5 full minutes AND the score is failing (the passing threshold is 60 points).

**Approach**: Although this question practices deletion, looking closely shows it actually tests date/time functions. For the minute comparison mentioned here, commonly used functions are **`TIMEDIFF`** and **`TIMESTAMPDIFF`**. Their usage differs slightly, with the latter being more flexible—which one you pick is a matter of personal preference.

1. `TIMEDIFF`: Computes the difference between two time values.

```sql
TIMEDIFF(time1, time2)
```

Both arguments are required and must be time or datetime expressions. If either specified argument is invalid or `NULL`, the function returns `NULL`.

For this problem, it can be wrapped inside the `MINUTE()` function, because `TIMEDIFF` calculates a time difference (`TIME` value), and wrapping it with `MINUTE()` extracts the number of minutes.

2. `TIMESTAMPDIFF`: Used to calculate the time difference between two dates/datetimes.

```sql
TIMESTAMPDIFF(unit,datetime_expr1,datetime_expr2)
# Parameter explanation
# unit: The unit for the returned time difference; common options are:
SECOND: seconds
MINUTE: minutes
HOUR: hours
DAY: days
WEEK: weeks
MONTH: months
QUARTER: quarters
YEAR: years
# TIMESTAMPDIFF returns the result of datetime_expr2 - datetime_expr1 (in plain terms: second minus first, i.e., 2 - 1), where datetime_expr1 and datetime_expr2 can be DATE or DATETIME values (e.g., "2023-01-01" or "2023-01-01 00:00:00").
```

This problem requires comparing minutes, so it is `TIMESTAMPDIFF(MINUTE, start_time, end_time) < 5`.

**Answer**:

```sql
DELETE FROM exam_record WHERE MINUTE (TIMEDIFF(submit_time , start_time)) < 5 AND score < 60
```

```sql
DELETE FROM exam_record WHERE TIMESTAMPDIFF(MINUTE, start_time, submit_time) < 5 AND score < 60
```

### Delete Records (2)

**Description**: There is an exam record table `exam_record` containing many years of users' exam answering records, with the following structure:

Exam record table `exam_record`: `start_time` is the exam start time, and `submit_time` is the submission time (i.e., the end time; if unfinished, it is `NULL`).

| Field       | Type       | Null | Key | Extra          | Default | Comment           |
| ----------- | ---------- | :--: | --- | -------------- | ------- | ----------------- |
| id          | int(11)    |  NO  | PRI | auto_increment | (NULL)  | Auto-increment ID |
| uid         | int(11)    |  NO  |     |                | (NULL)  | User ID           |
| exam_id     | int(11)    |  NO  |     |                | (NULL)  | Exam ID           |
| start_time  | datetime   |  NO  |     |                | (NULL)  | Start time        |
| submit_time | datetime   | YES  |     |                | (NULL)  | Submit time       |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Score             |

**Requirement**: Among the records in `exam_record` that are unfinished ==or== have an answering duration of less than 5 full minutes, please delete the 3 records with the earliest `start_time`.

**Approach**: This problem is relatively simple, but note the clue given in the prompt: "if unfinished, the end time is empty (`NULL`)"—that directly gives one condition.

The other condition is less than 5 minutes, similar to the previous problem, except here it is **OR** (either condition being satisfied is enough). In addition, it lightly tests `ORDER BY` and `LIMIT` usage with `DELETE`.

**Answer**:

```sql
DELETE FROM exam_record WHERE submit_time IS null OR TIMESTAMPDIFF(MINUTE, start_time, submit_time) < 5
ORDER BY start_time
LIMIT 3
# Default is ASC; DESC is descending order
```

### Delete Records (3)

**Description**: There is an exam record table `exam_record` containing many years of users' exam answering records, with the following structure:

| Field       | Type       | Null | Key | Extra          | Default | Comment           |
| ----------- | ---------- | :--: | --- | -------------- | ------- | ----------------- |
| id          | int(11)    |  NO  | PRI | auto_increment | (NULL)  | Auto-increment ID |
| uid         | int(11)    |  NO  |     |                | (NULL)  | User ID           |
| exam_id     | int(11)    |  NO  |     |                | (NULL)  | Exam ID           |
| start_time  | datetime   |  NO  |     |                | (NULL)  | Start time        |
| submit_time | datetime   | YES  |     |                | (NULL)  | Submit time       |
| score       | tinyint(4) | YES  |     |                | (NULL)  | Score             |

**Requirement**: Please delete all records in the `exam_record` table ==and reset the auto-increment primary key==.

**Approach**: This problem tests the differences among three deletion statements—pay attention to the highlighted part requiring the primary key to be reset:

- `DROP`: Drops the table completely, deleting both data and table structure; irreversible.
- `TRUNCATE`: Truncates/reformats the table without deleting its structure; irreversible.
- `DELETE`: Deletes rows of data; reversible (within a transaction / via rollback).

The reason to choose `TRUNCATE` here is: `TRUNCATE` only operates on tables; `TRUNCATE` removes all rows from a table while keeping the table structure, constraints, and indexes intact; `TRUNCATE` resets the table's auto-increment value; and after using `TRUNCATE`, the storage space occupied by the table and its indexes is restored to its initial size.

You could also solve this using `DELETE`, except after deleting the rows you would have to manually `ALTER` the table structure to reset the initial auto-increment value.

Likewise, you could also use `DROP` to delete the entire table including its structure, and then recreate the table.

**Answer**:

```sql
TRUNCATE  exam_record;
```

## Table and Index Operations

### Create a New Table

**Description**: There is an existing user information table containing users who have registered on the platform over the years. As the Nowcoder platform continues to grow and the user base expands rapidly, in order to efficiently serve highly active users, part of the users need to be split out into a new table.

Original user information table:

| Field         | Type        | Null | Key | Default           | Extra          | Comment           |
| ------------- | ----------- | ---- | --- | ----------------- | -------------- | ----------------- |
| id            | int(11)     | NO   | PRI | (NULL)            | auto_increment | Auto-increment ID |
| uid           | int(11)     | NO   | UNI | (NULL)            |                | User ID           |
| nick_name     | varchar(64) | YES  |     | (NULL)            |                | Nickname          |
| achievement   | int(11)     | YES  |     | 0                 |                | Achievement       |
| level         | int(11)     | YES  |     | (NULL)            |                | User level        |
| job           | varchar(32) | YES  |     | (NULL)            |                | Job direction     |
| register_time | datetime    | YES  |     | CURRENT_TIMESTAMP |                | Registration time |

As a data analyst, please **create a premium user information table `user_info_vip`** whose schema matches the user information table.

The output you should return is shown in the table below. Please write the `CREATE TABLE` statement to include all constraints and descriptions from the table.

| Field         | Type        | Null | Key | Default           | Extra          | Comment           |
| ------------- | ----------- | ---- | --- | ----------------- | -------------- | ----------------- |
| id            | int(11)     | NO   | PRI | (NULL)            | auto_increment | Auto-increment ID |
| uid           | int(11)     | NO   | UNI | (NULL)            |                | User ID           |
| nick_name     | varchar(64) | YES  |     | (NULL)            |                | Nickname          |
| achievement   | int(11)     | YES  |     | 0                 |                | Achievement       |
| level         | int(11)     | YES  |     | (NULL)            |                | User level        |
| job           | varchar(32) | YES  |     | (NULL)            |                | Job direction     |
| register_time | datetime    | YES  |     | CURRENT_TIMESTAMP |                | Registration time |

**Approach**: If the problem had given the name of the old table, you could directly use `CREATE TABLE new_table AS SELECT * FROM old_table;`. However, this problem does not provide the old table's name, so you need to create it from scratch—just pay attention to default values and keys, which is fairly straightforward. (Note: if executing on Nowcoder, make sure the `COMMENT` values match the comments in the problem statement—including capitalization, i.e., the exact original Chinese comments when submitting on the Chinese OJ—otherwise it will not pass; also make sure to set the character set.)

Answer:

```sql
CREATE TABLE IF NOT EXISTS user_info_vip(
    id INT(11) PRIMARY KEY AUTO_INCREMENT COMMENT'Auto-increment ID',
    uid INT(11) UNIQUE NOT NULL COMMENT 'User ID',
    nick_name VARCHAR(64) COMMENT'Nickname',
    achievement INT(11) DEFAULT 0 COMMENT 'Achievement',
    `level` INT(11) COMMENT 'User level',
    job VARCHAR(32) COMMENT 'Job direction',
    register_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration time'
)CHARACTER SET UTF8
```

### Alter a Table

**Description**: There is an existing user information table `user_info`, which contains information about users registered on the platform over the years.

**User information table `user_info`:**

| Field         | Type        | Null | Key | Default           | Extra          | Comment           |
| ------------- | ----------- | ---- | --- | ----------------- | -------------- | ----------------- |
| id            | int(11)     | NO   | PRI | (NULL)            | auto_increment | Auto-increment ID |
| uid           | int(11)     | NO   | UNI | (NULL)            |                | User ID           |
| nick_name     | varchar(64) | YES  |     | (NULL)            |                | Nickname          |
| achievement   | int(11)     | YES  |     | 0                 |                | Achievement       |
| level         | int(11)     | YES  |     | (NULL)            |                | User level        |
| job           | varchar(32) | YES  |     | (NULL)            |                | Job direction     |
| register_time | datetime    | YES  |     | CURRENT_TIMESTAMP |                | Registration time |

**Requirement:** In the `user_info` table, please add a column `school` after the `level` column that can store up to 15 Chinese characters; rename the `job` column to `profession` while changing its `varchar` length to 10; and set the default value of `achievement` to 0.

**Approach**: Before solving this problem, you need to understand the basic usage of the `ALTER` statement:

- Add a column: `ALTER TABLE table_name ADD COLUMN column_name data_type [FIRST | AFTER existing_column];` (`FIRST` inserts before all columns; `AFTER` inserts after the specified column)
- Modify a column's type or constraints: `ALTER TABLE table_name MODIFY COLUMN column_name new_type [new_constraints];`
- Rename a column: `ALTER TABLE table_name CHANGE COLUMN old_column_name new_column_name data_type;`
- Drop a column: `ALTER TABLE table_name DROP COLUMN column_name;`
- Rename a table: `ALTER TABLE table_name RENAME [TO] new_table_name;`
- Move a column to the first position: `ALTER TABLE table_name MODIFY COLUMN column_name data_type FIRST;`

The `COLUMN` keyword can actually be omitted, though it is listed here for clarity and convention.

When making multiple alterations, you can combine them into a single statement, just mind the syntax and formatting.

**Answer**:

```sql
ALTER TABLE user_info
    ADD school VARCHAR(15) AFTER level,
    CHANGE job profession VARCHAR(10),
    MODIFY achievement INT(11) DEFAULT 0;
```

### Drop Tables

**Description**: There is an existing exam record table `exam_record` containing many years of users' exam answering records. Generally, a backup table `exam_record_{YEAR}` is created each year for `exam_record`, where `{YEAR}` is the corresponding year.

As the data keeps growing and storage is running low, please delete all the old backup tables (from 2011 to 2014) if they exist.

**Approach**: This problem is straightforward—just drop them directly. If you prefer, you can separate the tables to be dropped with commas on a single line. Some readers might ask: what if there are dozens of tables to drop? Don't worry—if you need to drop many tables, you can write a script to drop them.

**Answer**:

```sql
DROP TABLE IF EXISTS exam_record_2011;
DROP TABLE IF EXISTS exam_record_2012;
DROP TABLE IF EXISTS exam_record_2013;
DROP TABLE IF EXISTS exam_record_2014;
```

### Create Indexes

**Description**: There is an existing exam information table `examination_info` containing information about various types of exams. To make querying the table faster and more convenient, the following indexes need to be created on `examination_info`:

The rules are: create a regular index `idx_duration` on the `duration` column, a unique index `uniq_idx_exam_id` on the `exam_id` column, and a full-text index `full_idx_tag` on the `tag` column.

According to the problem requirements, the following result will be returned:

| examination_info | 0   | PRIMARY          | 1   | id       | A   | 0   |     |     |     | BTREE    |
| ---------------- | --- | ---------------- | --- | -------- | --- | --- | --- | --- | --- | -------- |
| examination_info | 0   | uniq_idx_exam_id | 1   | exam_id  | A   | 0   |     |     | YES | BTREE    |
| examination_info | 1   | idx_duration     | 1   | duration | A   | 0   |     |     |     | BTREE    |
| examination_info | 1   | full_idx_tag     | 1   | tag      |     | 0   |     |     | YES | FULLTEXT |

Note: The backend judge will compare the output of the `SHOW INDEX FROM examination_info` statement.

**Approach**: To solve this problem, you first need to understand common index types:

- B-Tree index: A B-Tree (balanced tree) index is the most common and default index type. It works for various query conditions and can quickly locate matching data. B-Tree indexes are suitable for standard lookup operations, supporting equality queries, range queries, and sorting.
- Unique index: A unique index is similar to a regular B-Tree index, except that it requires the values in the indexed column to be unique. This means MySQL enforces uniqueness on the indexed column when inserting or updating data.
- Primary key index: A primary key index is a special type of unique index used to uniquely identify each row in a table. Each table can have only one primary key index, which helps improve data access speed and data integrity.
- Full-text index: A full-text index is used to perform full-text searches on text data. It supports keyword searches inside text fields rather than only simple equality or range lookups. Full-text indexes are suitable for scenarios requiring full-text search.

```sql
-- Examples:
-- Add a B-Tree index:
	CREATE INDEX idx_name(index_name) ON table_name (column_name);   -- idx_name is the index name (same below)
-- Create a unique index:
	CREATE UNIQUE INDEX idx_name ON table_name (column_name);
-- Create a primary key index:
	ALTER TABLE table_name ADD PRIMARY KEY (column_name);
-- Create a full-text index:
	ALTER TABLE table_name ADD FULLTEXT INDEX idx_name (column_name);

-- From the examples above, both CREATE and ALTER can be used to add indexes
```

With the fundamentals above in place, the answer to this question becomes clear.

**Answer**:

```sql
ALTER TABLE examination_info
    ADD INDEX idx_duration(duration),
    ADD UNIQUE INDEX uniq_idx_exam_id(exam_id),
    ADD FULLTEXT INDEX full_idx_tag(tag);
```

### Drop Indexes

**Description**: Please drop the unique index `uniq_idx_exam_id` and the full-text index `full_idx_tag` from the `examination_info` table.

**Approach**: This problem tests the basic syntax for dropping indexes:

```sql
-- Drop an index using DROP INDEX
DROP INDEX idx_name ON table_name;

-- Drop an index using ALTER TABLE
ALTER TABLE employees DROP INDEX idx_email;
```

Note here: in MySQL, dropping multiple indexes in a single `DROP INDEX` command is not supported. Each `DROP INDEX` statement can only specify one index name to remove.

And be VERY careful when using the **DROP** command!!!

**Answer**:

```sql
DROP INDEX uniq_idx_exam_id ON examination_info;
DROP INDEX full_idx_tag ON examination_info;
```
