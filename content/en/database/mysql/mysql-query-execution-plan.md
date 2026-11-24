---
title: "Analyzing MySQL Query Execution Plans"
description: "Detailed explanation of every column in a MySQL EXPLAIN execution plan, including key fields such as id, select_type, type, key, rows, and Extra, helping you diagnose SQL performance bottlenecks and perform targeted optimization."
category: Database
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL execution plan,EXPLAIN,query optimizer,SQL performance analysis,index hit,type access method,Extra column,slow query optimization
lang: en
sourceRef: zh-ref/database/mysql/mysql-query-execution-plan.md
---

The first step in optimizing SQL should be learning how to read an SQL execution plan. In this article, let's explore MySQL's `EXPLAIN` execution plan in detail.

> **Version Note**: This article is based on MySQL 5.7+ and 8.0+. The `filtered` and `partitions` columns are available in MySQL 5.7+, while `EXPLAIN ANALYZE` and Hash Join require MySQL 8.0.18+ and 8.0.20+, respectively.

## What Is an Execution Plan?

An **execution plan** refers to the concrete way an SQL statement will be executed after being optimized by the **MySQL Query Optimizer**.

Execution plans are typically used for SQL performance analysis and optimization. From the output of `EXPLAIN`, we can learn details such as the join/lookup order of tables, the access type of data lookup operations, which indexes are eligible to be used, which index is actually chosen, and roughly how many rows each table needs to inspect.

## How to Obtain an Execution Plan

MySQL provides the `EXPLAIN` command to retrieve information about an execution plan.

Note that a standard `EXPLAIN` statement does **not** actually execute the underlying query; instead, the query optimizer analyzes the statement, determines the optimal query plan, and displays the corresponding information.

MySQL 8.0.18 introduced `EXPLAIN ANALYZE`, which **actually executes** the query and outputs the actual elapsed time and row count for each step. Because it reports real execution metrics rather than just estimates from standard `EXPLAIN`, it is well suited for deep slow-query troubleshooting in test environments:

```sql
mysql> EXPLAIN ANALYZE SELECT * FROM users WHERE age = 25\G
*************************** 1. row ***************************
EXPLAIN: -> Covering index lookup on users using idx_age_score_name (age=25)
(cost=1.52 rows=12) (actual time=0.0272..0.0344 rows=12 loops=1)
```

In addition, `EXPLAIN FORMAT=JSON` outputs the optimizer's cost model data (`query_cost`), which reflects the actual estimated cost of each step more clearly than the tabular format and is particularly useful when tuning multi-table JOINs or subqueries:

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

The `EXPLAIN` execution plan supports `SELECT`, `DELETE`, `INSERT`, `REPLACE`, and `UPDATE` statements. It is most commonly used to analyze `SELECT` queries, and the syntax is very straightforward:

```sql
EXPLAIN SELECT <query_statement>;
```

Let's take a quick look at the execution plan of a sample query:

**Example 1: Single-table query (using an index)**

```sql
-- Table schema: users(id, age, score, name, address), composite index idx_age_score_name(age, score, name)
mysql> EXPLAIN SELECT * FROM users WHERE age = 25;
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys       | key                 | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | users | NULL       | ref  | idx_age_score_name  | idx_age_score_name  | 5       | const |   12 |   100.00 | Using index |
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------+------+----------+-------------+
```

**Example 2: UNION query (case where `id` is NULL)**

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

As shown above, the execution plan output has 12 columns in total. The meaning of each column is summarized in the table below:

| **Column Name** | **Meaning** |
| --------------- | ----------- |
| id | Sequential identifier of the `SELECT` query |
| select_type | Query type corresponding to the `SELECT` keyword |
| table | Name of the table accessed |
| partitions | Matched partitions; `NULL` for non-partitioned tables |
| type | Table access method |
| possible_keys | Indexes that could potentially be used |
| key | Index actually chosen and used |
| key_len | Length of the chosen index |
| ref | Column or constant compared against the index during an equality lookup |
| rows | Estimated number of rows to be examined |
| filtered | Percentage of rows estimated to remain after filtering by table conditions |
| Extra | Additional execution information |

## How to Analyze EXPLAIN Output

To analyze the output of an `EXPLAIN` statement, we need to understand each important field in the execution plan.

### id

The `SELECT` identifier, used to indicate the execution order of each `SELECT` statement.

Rules for interpreting the `id` column:

- **Same `id`**: Executed sequentially from top to bottom (typically seen in multi-table JOIN scenarios).
- **Different `id`**: Higher `id` values have higher execution priority (subqueries execute before the outer query).
- **`id` is `NULL`**: Indicates that this row represents the result set of a `UNION RESULT` or `DERIVED` table and does not require a separate query execution.

**Example**:

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

In the third row, `id = NULL` and `table = <union1,2>`, indicating that this step merges the results of the first two queries.

### select_type

The type of query, primarily used to distinguish ordinary queries, union queries, subqueries, and other complex queries. Common values include:

- **SIMPLE**: A simple query that does not contain a `UNION` or subqueries.
- **PRIMARY**: If a query contains subqueries or other components, the outermost `SELECT` is labeled `PRIMARY`.
- **SUBQUERY**: The first `SELECT` inside a subquery.
- **UNION**: A `SELECT` that appears after `UNION` in a `UNION` statement.
- **DERIVED**: A subquery appearing in the `FROM` clause is labeled `DERIVED`.
- **UNION RESULT**: The combined result of a `UNION` query.

### table

The name of the table used in the query. Each row corresponds to a table name. In addition to actual table names, it may also take the following values:

- **`<unionM,N>`**: This row references the `UNION` result of the rows with `id` values `M` and `N`.
- **`<derivedN>`**: This row references the derived table generated by the row with `id = N`. A derived table may originate from a subquery in the `FROM` clause.
- **`<subqueryN>`**: This row references the materialized subquery result generated by the row with `id = N`.

### type (Important)

The query access type, describing how rows are accessed in the table. **Ordered from best to worst**:

`system > const > eq_ref > ref > fulltext > ref_or_null > index_merge > unique_subquery > index_subquery > range > index > ALL`

**Practical rules of thumb for performance evaluation**:

- **Good** (should reach at least): `system`, `const`, `eq_ref`, `ref`, `range`
- **Needs attention**: `index_merge`, `index` (full index scan still poses performance risks on large datasets)
- **Needs optimization**: `ALL` (full table scan)

**Note**: This ordering reflects **single-table access efficiency** and does not represent overall query performance. For example, `type=ref` accompanied by heavy table lookups (back-to-table / primary key lookups) may be slower than `type=index` using a covering index.

The meanings of the most common types are as follows:

- **system**: The table has only one row (or is empty), and the storage engine can accurately count the row total. Applies to engines such as MyISAM, Memory, and InnoDB (when a table has only 1 row, InnoDB optimizes it to `const`). It is a special case of the `const` access type.
- **const**: The table has at most one matching row, which can be found in a single lookup. Typically occurs when all columns of a primary key or unique index are used in equality predicates.
- **eq_ref**: In a table join, for each row from the preceding table, there is only one matching row in the current table. Apart from `system` and `const`, this is the best join access type, typically seen when joining on all columns of a primary key or unique non-null index (strictly guaranteeing a one-to-one match).
- **ref**: Uses a non-unique (secondary) index in the lookup condition, where the query may return multiple matching rows (unlike `eq_ref`, one driving row may match multiple driven rows).
- **index_merge**: When the `WHERE` clause contains multiple range/equality conditions and each condition can use a different index, MySQL merges the scan results of multiple indexes. The `key` column lists the indexes used, and the `Extra` column shows the merge algorithm:

  - `Using union(...)`: Takes the union of multiple index results (`OR` conditions)
  - `Using sort_union(...)`: Sorts index results first before taking the union (`OR` conditions where index keys are not in sorted row-id order)
  - `Using intersection(...)`: Takes the intersection of multiple index results (`AND` conditions)

  **Example**:

  ```sql
  -- OR condition triggers index merge union
  EXPLAIN SELECT * FROM employees WHERE emp_no = 10001 OR dept_no = 'd001';
  -- Extra: Using union(PRIMARY,dept_no_index)
  ```

- **range**: Performs a range scan on an indexed column; the `key` column in the execution plan shows which index is used.
- **index**: Full Index Scan—the query traverses the entire index tree. It is similar to `ALL` (full table scan), but usually incurs lower overhead: index entries are much smaller than full row records, so scanning the same number of rows requires fewer I/O pages; if the query also qualifies for a covering index, table lookups (back-to-table) are avoided completely. However, on ultra-large tables (hundreds of millions of rows or more), a full index scan can still generate massive I/O, so its cost must not be ignored merely because `index` ranks above `ALL`.
- **ALL**: Full table scan.

### possible_keys

The `possible_keys` column shows the indexes that MySQL *could* potentially use when executing the query. If this column is `NULL`, there are no applicable indexes; in that case, check the columns used in the `WHERE` clause to see whether adding an index on one or more of them can improve query performance.

### key (Important)

The `key` column indicates the index that MySQL **actually** decided to use. If it is `NULL`, no index was used.

### key_len

The `key_len` column indicates the maximum byte length of the index actually used by MySQL; when a composite index is used, this can be the sum of multiple column lengths. Shorter is better, provided the query requirements are satisfied. If the `key` column is `NULL`, `key_len` is also `NULL`.

### rows

The `rows` column indicates the **estimated** number of rows MySQL expects to examine to find the required records, based on table statistics and index selection. Smaller values are better.

Note that this value is an estimate rather than an exact count. InnoDB's statistics are based on random sampling of index pages:

- The number of sampled pages is controlled by `innodb_stats_persistent_sample_pages` (default is 20 pages).
- After frequent data modifications or bulk data imports, the discrepancy between the estimated row count and the actual row count can reach 10%–50% or even higher.
- **Small-table trap**: When a table has very few rows (e.g., `< 100` rows), the optimizer may ignore indexes and choose a full table scan because the estimated cost of a full table scan is lower.

**Verification method**:

```sql
-- Estimated row count from the execution plan
mysql> EXPLAIN SELECT * FROM users WHERE age = 25\G
rows: 12

-- Actual row count (note: use COUNT(*) cautiously on large tables)
mysql> SELECT COUNT(*) FROM users WHERE age = 25;
+----------+
| COUNT(*) |
+----------+
|       12 |
+----------+
```

When the execution plan does not match actual performance, you can run `ANALYZE TABLE` to re-sample table statistics and then observe how the execution plan changes.

### filtered

The `filtered` column represents the **estimated** percentage (0–100) of rows returned by the storage engine that remain after filtering by the `WHERE` conditions at the Server layer. The formula is: `filtered = (rows after condition filtering / rows returned by storage engine) × 100`.

**Interpretation rules**:

- When `filtered = 100`: Every row returned by the storage engine satisfies the `WHERE` condition (the ideal case).
- When `filtered < 100`: Some rows are filtered out at the Server layer, indicating that the index does not cover all query predicates.
- **JOIN scenarios**: The optimizer uses `rows × (filtered / 100)` to estimate the number of rows passed from the current table to the next table (fan-out).

This column is especially important in multi-table JOIN scenarios: the larger the fan-out, the more rows in the driven table the driving table must match. Therefore, when `filtered` is very low, it indicates strong filtering selectivity (reduced fan-out); whereas when `rows` is large and `filtered` is not high, it is a signal of a potential performance bottleneck, and you should prioritize Index Condition Pushdown (ICP) or a more suitable index to reduce fan-out.

### Extra (Important)

This column contains additional information about how MySQL parses and executes the query. Through these details, you can understand much more accurately how MySQL actually executes the query. Common values include:

- **Using filesort**: MySQL cannot satisfy the `ORDER BY` or `GROUP BY` sorting requirement using an index and must perform an extra sort pass on the returned result set. When the result set fits within `sort_buffer_size`, sorting is performed in memory; if it exceeds that size, temporary disk files are used. "filesort" is a legacy name and does not necessarily mean disk I/O occurs.
- **Using temporary**: MySQL needs to create a temporary table to store intermediate query results, commonly seen in `ORDER BY` and `GROUP BY`.
- **Using index**: Indicates that the query uses a covering index and avoids back-to-table primary key lookups, resulting in very high query efficiency.
- **Using index condition**: Indicates that the query optimizer chose to apply Index Condition Pushdown (ICP).
- **Using where**: The MySQL Server layer applied additional `WHERE` condition filtering to the rows returned by the storage engine. Even when an index is hit (e.g., `type=ref`), if the index only satisfies part of the query predicates, the remaining predicates still need to be filtered at the Server layer, in which case `Using where` will also appear.
- **Using join buffer (Block Nested Loop)**: During a join query, when the driven table has no usable index, MySQL reads rows from the driving table into the join buffer first and then scans the driven table to find matches (complexity `O(N×M)`).
- **Using join buffer (hash join)**: Introduced in MySQL 8.0.18, the Hash Join algorithm is **used only for equi-joins** (such as `t1.id = t2.id`) and replaces Block Nested-Loop (BNL) by default starting in MySQL 8.0.20. Hash Join has a complexity of `O(N)` for the build phase plus `O(M)` for the probe phase, making it significantly more efficient than BNL's `O(N×M)`.

  **Exceptions** (still falls back to BNL):

  - Non-equi JOINs (e.g., `t1.id > t2.id`)
  - JOIN conditions containing functions or expressions
  - When a usable index exists on the driven table (in which case Index Nested Loop Join is used)

As a reminder, when the `Extra` column contains `Using filesort` or `Using temporary`, MySQL performance may suffer, and you should avoid them whenever possible.

## References

- <https://dev.mysql.com/doc/refman/8.0/en/explain-output.html>
- <https://dev.mysql.com/doc/refman/8.0/en/explain.html>
- <https://juejin.cn/post/6953444668973514789>
