---
title: Index Invalidation Caused by Implicit Conversion in MySQL
description: In-depth analysis of the causes and scenarios where implicit type conversion in MySQL leads to index invalidation, demonstrating performance issues when comparing strings with numbers through real test cases and providing best practices to avoid index invalidation.
category: Databases
tag:
  - MySQL
  - Performance Optimization
head:
  - - meta
    - name: keywords
      content: MySQL Implicit Conversion,Index Invalidation,Type Conversion,MySQL Performance Optimization,Data Type Mismatch,Full Table Scan,SQL Optimization
lang: en
sourceRef: zh-ref/database/mysql/index-invalidation-caused-by-implicit-conversion.md
---

> The MySQL version used in this test is `5.7.26`. As MySQL versions evolve, certain behaviors may change. This article does not guarantee that the viewpoints and conclusions hold identically across all MySQL versions; please verify version-specific differences yourself.
>
> Original article: <https://www.guitu18.com/post/2019/11/24/61.html>

## Preface

Database optimization is a long and challenging journey; to optimize effectively, you must deeply understand the various characteristics of the database. During development, we often encounter tricky issues with very simple causes yet severe consequences. Such issues are often hard to locate, take considerable time and effort to troubleshoot, and turn out to be caused by a minor oversight—or by unfamiliarity with a particular technical behavior.

At the database layer, the most common issue is probably index invalidation, which is easy to overlook early on when data volumes are small. However, as the business grows and data volume increases, performance problems gradually emerge; if not addressed in time, they can easily trigger a snowball effect and ultimately cause the database to stall or even crash. There can be many causes of index invalidation, and countless technical blogs already cover them. What I want to document today is **index invalidation caused by implicit conversion**.

## Data Preparation

First, use a stored procedure to generate 10 million test rows.
The test table defines 7 columns in total (including the primary key). `num1` and `num2` store sequential numbers identical to `id`, with `num2` being a string type.
`type1` and `type2` both store the primary key modulo 5, simulating type-like fields commonly used in real applications, except `type2` has no index.
`str1` and `str2` both store a 20-character random string. `str1` cannot be `NULL`, whereas `str2` allows `NULL`; accordingly, when generating test data, I also produce a small number of `NULL` values in `str2` (one `NULL` value every 100 rows).

```sql
-- Create the test data table
DROP TABLE IF EXISTS test1;
CREATE TABLE `test1` (
    `id` int(11) NOT NULL,
    `num1` int(11) NOT NULL DEFAULT '0',
    `num2` varchar(11) NOT NULL DEFAULT '',
    `type1` int(4) NOT NULL DEFAULT '0',
    `type2` int(4) NOT NULL DEFAULT '0',
    `str1` varchar(100) NOT NULL DEFAULT '',
    `str2` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `num1` (`num1`),
    KEY `num2` (`num2`),
    KEY `type1` (`type1`),
    KEY `str1` (`str1`),
    KEY `str2` (`str2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- Create the stored procedure
DROP PROCEDURE IF EXISTS pre_test1;
DELIMITER //
CREATE PROCEDURE `pre_test1`()
BEGIN
    DECLARE i INT DEFAULT 0;
    SET autocommit = 0;
    WHILE i < 10000000 DO
        SET i = i + 1;
        SET @str1 = SUBSTRING(MD5(RAND()),1,20);
        -- Generate a NULL value in str2 every 100 rows
        IF i % 100 = 0 THEN
            SET @str2 = NULL;
        ELSE
            SET @str2 = @str1;
        END IF;
        INSERT INTO test1 (`id`, `num1`, `num2`,
        `type1`, `type2`, `str1`, `str2`)
        VALUES (CONCAT('', i), CONCAT('', i),
        CONCAT('', i), i%5, i%5, @str1, @str2);
        -- Transaction optimization: commit once every 10,000 rows
        IF i % 10000 = 0 THEN
            COMMIT;
        END IF;
    END WHILE;
END;
// DELIMITER ;
-- Execute the stored procedure
CALL pre_test1();
```

Because the data volume is relatively large and `MD5` is used to generate random strings, execution is somewhat slow—just be patient and wait for it to finish.

Generating 10 million rows took me 33 minutes (the actual time depends on your computer hardware specifications). Here are a few sample rows of the generated data—it looks roughly like this:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-ed7eb800.png)

## SQL Testing

First, look at this set of four SQL queries. In our test table, `num1` is of type `int` and `num2` is of type `varchar`, both storing sequential numbers identical to the primary key `id`, and both columns have indexes.

```sql
1: SELECT * FROM `test1` WHERE num1 = 10000;
2: SELECT * FROM `test1` WHERE num1 = '10000';
3: SELECT * FROM `test1` WHERE num2 = 10000;
4: SELECT * FROM `test1` WHERE num2 = '10000';
```

These four SQL queries were written specifically for comparison: queries 1 and 2 filter on an `int` column, while queries 3 and 4 filter on a `varchar` column. Within each pair (1 & 2, and 3 & 4), the queried column is the same, yet one condition passes a number and the other passes a quoted string. What difference does this make? Without looking at the test results below yet, can you guess the performance ranking of these four SQL queries?

Upon testing, the execution results of these four SQL queries differ drastically. Queries 1, 2, and 4 all return results almost instantaneously—roughly in 0.001 to 0.005 seconds; at a scale of 10 million rows, we can conclude there is essentially no performance difference among those three queries. However, across multiple runs, query 3 consistently took around 4.5 to 4.8 seconds.

Why do queries 3 and 4 differ so dramatically in efficiency, whereas queries 1 and 2—which form the exact same comparison—show almost no difference? Let's inspect the execution plans. Below are the `EXPLAIN` outputs for queries 1, 2, 3, and 4 respectively:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-f78a476b.png)

As you can see, queries 1, 2, and 4 can all use an index, with join type `ref` and `rows` equal to 1—hence their efficiency is extremely high. Now look at query 3: it fails to use the index and performs a full table scan (`ALL`), with `rows` jumping straight to 10 million, which explains why the performance difference is so huge.

Looking closely, you'll notice that in queries 3 and 4, the queried column `num2` is `varchar`, and query 4—which quotes the value on the right side of `=`—uses the index. Is the failure caused simply by a mismatch between the query literal's data type and the column's data type? If that were the whole story, then in queries 1 and 2, `num1` is `int`, yet query 2 puts quotes around the right-hand condition and still manages to use the index!

Checking the relevant MySQL documentation reveals that this is caused by **implicit conversion**. Let's look at the official description:

> Official Documentation: [12.2 Type Conversion in Expression Evaluation](https://dev.mysql.com/doc/refman/5.7/en/type-conversion.html?spm=5176.100239.blogcont47339.5.1FTben)
>
> When an operator is used with operands of different types, type conversion occurs to make the operands compatible. Some conversions occur implicitly. For example, MySQL automatically converts strings to numbers as necessary, and vice versa. The following rules describe how conversion occurs for comparison operations:
>
> 1. If one or both arguments are `NULL`, the result of the comparison is `NULL`, except for the `NULL`-safe `<=>` equality comparison operator. For `NULL <=> NULL`, the result is true. No conversion is needed.
> 2. If both arguments in a comparison operation are strings, they are compared as strings.
> 3. If both arguments are integers, they are compared as integers.
> 4. Hexadecimal values are treated as binary strings if not compared to a number.
> 5. If one of the arguments is a `TIMESTAMP` or `DATETIME` column and the other argument is a constant, the constant is converted to a timestamp before the comparison is performed.
> 6. If one of the arguments is a `decimal` value, comparison depends on the other argument. The arguments are compared as `decimal` values if the other argument is a `decimal` or integer value, or as floating-point values if the other argument is a floating-point value.
> 7. **In all other cases, the arguments are compared as floating-point (real) numbers.**

According to the official documentation, both query 2 and query 3 undergo implicit conversion. In query 2 (`num1 = '10000'`), the left side is `int` and the right side is a string; query 3 is the opposite. Therefore, under official conversion rule 7, both sides are converted to floating-point numbers before comparison.

First look at query 2: ``SELECT * FROM `test1` WHERE num1 = '10000';``. **The left side is the `int` type** `10000`, which converts to floating-point `10000`; the right side is the string `'10000'`, which also converts to floating-point `10000`. The converted values on both sides are uniquely determined, so index usage is unaffected.

Now look at query 3: ``SELECT * FROM `test1` WHERE num2 = 10000;``. **The left side is the string type** `'10000'`, which uniquely converts to floating-point `10000`, and the right side `int` `10000` also uniquely converts to `10000`. However, because the left side is the indexed search column, even though `'10000'` converts uniquely to `10000`, other strings can also convert to `10000`—for example, `'10000a'`, `'010000'`, `'10000'`, and so on can all convert to floating-point `10000`. Under such circumstances, the index cannot be used.

We can verify this **implicit conversion** through a query test. First insert a few rows where `num2='10000a'`, `'010000'`, and `'10000'`:

```sql
INSERT INTO `test1` (`id`, `num1`, `num2`, `type1`, `type2`, `str1`, `str2`) VALUES ('10000001', '10000', '10000a', '0', '0', '2df3d9465ty2e4hd523', '2df3d9465ty2e4hd523');
INSERT INTO `test1` (`id`, `num1`, `num2`, `type1`, `type2`, `str1`, `str2`) VALUES ('10000002', '10000', '010000', '0', '0', '2df3d9465ty2e4hd523', '2df3d9465ty2e4hd523');
INSERT INTO `test1` (`id`, `num1`, `num2`, `type1`, `type2`, `str1`, `str2`) VALUES ('10000003', '10000', ' 10000', '0', '0', '2df3d9465ty2e4hd523', '2df3d9465ty2e4hd523');
```

Then run query 3: ``SELECT * FROM `test1` WHERE num2 = 10000;``:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-7e85c3b3.png)

As seen from the result, all three newly inserted rows matched as well. So what are the rules for this implicit string-to-number conversion? Why did all three cases—`num2='10000a'`, `'010000'`, and `'10000'`—match? Checking the relevant documentation reveals the rules:

1. Strings **not starting with a digit** are all converted to `0`. For example, `'abc'`, `'a123bc'`, and `'abc123'` all convert to `0`.
2. Strings **starting with a digit** are truncated during conversion from the first character up to the first non-numeric character. For example, `'123abc'` converts to `123`, `'012abc'` converts to `012` (i.e., `12`), `'5.3a66b78c'` converts to `5.3`, and so on.

Let's test and verify the rules above as follows:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-fe308a78.png)

This confirms the previous query results.

Now write another SQL query targeting the `str1` column: ``SELECT * FROM `test1` WHERE str1 = 1234;``

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysqlindex-invalidation-caused-by-implicit-conve-7335190f.png)

## Analysis and Summary

From the tests above, we observe several characteristics of MySQL operators:

1. When the **data types on the left and right sides of an operator do not match**, **implicit conversion** occurs.
2. When implicit conversion occurs with a **numeric column on the left side** of a `WHERE` comparison operator, the performance impact is minimal—though it is still not recommended.
3. When implicit conversion occurs with a **string/character column on the left side** of a `WHERE` comparison operator, it causes index invalidation, resulting in a full table scan with extremely low efficiency.
4. When converting strings to numbers, strings that do not start with a digit convert to `0`, while strings that start with a digit are truncated from the first character up to the first non-numeric character as the conversion result.

Therefore, we must develop good habits when writing SQL: match the type of the condition on the right side of `=` to the column type being queried. In particular, when the queried column is a string type, always wrap the right-hand condition in quotes to indicate a string—otherwise, it will cause index invalidation and trigger a full table scan.
