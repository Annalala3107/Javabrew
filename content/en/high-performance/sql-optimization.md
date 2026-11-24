---
title: Summary of Common SQL Optimization Techniques
description: A systematic summary of common SQL optimization techniques, covering slow SQL identification and analysis (slow query log, EXPLAIN, Performance Schema), index optimization strategies, query rewriting techniques, pagination optimization, and practical production guidelines to rapidly improve database query performance.
category: High Performance
head:
  - - meta
    - name: keywords
      content: SQL Optimization,Slow SQL,EXPLAIN Execution Plan,Index Optimization,MySQL Optimization,Query Optimization,Pagination Optimization,Performance Schema
lang: en
sourceRef: zh-ref/high-performance/sql-optimization.md
---

When a SQL query runs slowly, do not blindly jump straight into generic rules like "add an index" or "avoid `SELECT *`." First locate the slow SQL query and see whether its bottleneck lies in scanned row count, sorting, table lookups, lock waits, or overly high invocation frequency. Once the execution plan aligns with the business access pattern, decide whether to modify indexes, rewrite the SQL, adjust the table schema, or offload the query to a cache, search engine, or offline reporting store.

Follow this order when troubleshooting:

1. First confirm whether the slowdown affects average latency, P99, or occasional timeouts—and whether a specific SQL query is slow or the entire database is under heavy load.
2. Identify high-frequency slow SQL queries using the slow query log, APM tools, and database monitoring.
3. Inspect `type`, `key`, `rows`, `filtered`, and `Extra` in the execution plan to check for full table scans, excessive table lookups, temporary tables, or filesorts.
4. Address the issue based on the business access pattern: select fewer columns, add indexes, rewrite SQL, split large transactions, or cap pagination depth.
5. Finally, re-benchmark with the same data volume and query conditions—never validate solely against a tiny dataset.

## Avoid Using SELECT \*

- `SELECT *` can increase disk I/O, network transfer, deserialization overhead, and application memory usage—especially when large columns (such as `varchar`, `blob`, or `text`) are present.
- `SELECT *` reduces the chance of hitting a covering index.
- `SELECT <column_list>` reduces the impact caused by future table schema changes.

## Use Complex Joins Cautiously Rather Than Banning Joins Outright

Alibaba's *Java Development Handbook* includes the following rule:

> [Mandatory] Joining more than three tables is prohibited. Columns used in joins must have strictly identical data types; in multi-table joins, ensure that the joined columns are indexed.

![Avoid Multi-Table Joins Whenever Possible](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/alibaba-java-development-handbook-multi-table-jo-0649f058.png)

Joins are a fundamental capability of relational databases and should not simply be equated with poor performance. Within a single database, when join columns have matching data types, appropriate indexes, and a bounded result size, a `JOIN` is often cleaner than issuing multiple queries and assembling data in the application layer, and it also makes result consistency easier to preserve.

What truly requires caution are complex joins:

1. Joined columns lack indexes or have mismatched data types;
2. Too many tables are joined, resulting in an overly complex execution plan;
3. Returned row counts are too large, incurring high costs from table lookups, temporary tables, or filesorts;
4. Cross-database or cross-shard joins requiring cross-node querying, merging, and sorting;
5. Clear future plans to shard the database/tables along this query path.

Starting in MySQL 8.0.20, Block Nested-Loop Join has been replaced by Hash Join. When analyzing join performance, do not rely solely on memorized legacy join algorithms—inspect the actual execution plan via `EXPLAIN` / `EXPLAIN ANALYZE`, focusing on `type`, `key`, `rows`, `filtered`, `Extra`, and whether temporary tables, filesorts, or excessive table lookups appear.

In real-world business scenarios, if a query spans services or databases, or if the tables will eventually be sharded, consider splitting the join into multiple single-table queries and assembling the results at the application layer. However, this is not unconditionally faster—it introduces extra network round trips, N+1 queries, higher application memory consumption, and consistency concerns, so you must weigh query frequency, data volume, network overhead, and consistency requirements.

Another common technique is **data denormalization (redundancy)**: duplicating a small number of stable columns needed by hot queries into the main table or a wide table to avoid runtime joins. Denormalization brings consistency and maintenance costs, making it best suited for scenarios with relatively stable schemas, read-heavy workloads, and well-defined query paths.

## Deep Pagination Optimization

The root cause of deep pagination is that when the `LIMIT` offset is too large, MySQL must scan and discard a huge number of rows before reaching the target slice, and the optimizer may abandon indexes in favor of a full table scan. Even when an index is used, massive table lookups can still severely degrade query performance.

This article introduces four common deep pagination optimization approaches, compared below:

| Optimization Approach | Core Idea | Applicable Scenarios | Limitations |
| ------------ | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| **Range Query** | Record the last ID of the previous page and fetch the next page via `WHERE id > last_id LIMIT n` | Sorted by ID, cursor-style paging allowed | No page jumping; non-ID sorting needs a composite cursor |
| **Subquery** | Fetch the starting primary key via a subquery, then filter by primary key | Need traditional `OFFSET` pagination | Subqueries may create temporary tables; depends on sort-field index |
| **Deferred Join** | Use `INNER JOIN` to shift pagination onto the primary key index and reduce table lookups | Large-dataset pagination needing traditional paging | Slightly more complex SQL |
| **Covering Index** | Create a composite index containing all queried columns to avoid table lookups | Fixed query columns where an appropriate index can be built | High maintenance cost for many columns; large result sets may still trigger full table scans |

When choosing a solution, first see whether product UX can be adjusted. If "Next Page" navigation is acceptable, range queries—namely cursor pagination—are usually the most reliable and fit scenarios like social media feeds and infinite scrolling.

If traditional `LIMIT offset, size` and page jumping must remain, consider deferred joins, covering indexes, or a search engine. When queried columns are fixed and few, covering indexes can serve as a supplement. Once offsets reach the millions, the more important question is to ask the business whether jumping that deep is actually necessary rather than trying to brute-force it in SQL alone.

Whichever solution you pick, always check the actual execution plan. If `EXPLAIN` shows the query is not using indexes as intended, even the cleanest SQL rewrite will not help.

For a detailed walkthrough, read: [Deep Pagination Introduction and Optimization Recommendations](https://javaguide.cn/high-performance/deep-pagination-optimization.html).

## Avoid Foreign Keys and Cascading Operations

Alibaba's *Java Development Handbook* states:

> Foreign keys and cascading operations must not be used; all foreign-key concepts must be enforced at the application layer.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/alibaba-java-development-handbook-multi-table-jo-c7f97d34.png)

This guideline primarily targets high-concurrency internet workloads, microservice decomposition, and database/table sharding. In those environments, relying on foreign keys and cascades increases cross-table coupling, migration overhead, and online schema-change complexity.

However, foreign keys are not "useless." In monolithic applications, internal admin systems, and core master-data tables where scale is manageable and strict integrity constraints are clearly required, foreign keys help enforce referential integrity at the database layer. A more accurate conclusion is: deciding whether to use foreign keys should depend on architecture style, data scale, and operational cost—not a blanket claim that "foreign keys have poor performance."

## Choose Appropriate Column Data Types

Smaller storage footprints mean less space consumed and better performance.

**a. Certain string values can be converted to numeric types for storage—for example, storing IP addresses as integers.**

Numbers are contiguous, deliver better performance, and occupy less space.

MySQL provides several functions for handling IP addresses:

- `INET_ATON()`: Converts an IPv4 address into an unsigned integer; store it using `INT UNSIGNED` and convert it back to a string with `INET_NTOA()`.
- `INET6_ATON()`: Converts an IPv6 address into a binary string and can also handle IPv4; if your system needs to support IPv6, it is better to standardize on `VARBINARY(16)` or `BINARY(16)` storage and convert back with `INET6_NTOA()`.

If you only store IPv4, `INET_ATON()` + `INT UNSIGNED` is sufficient; if IPv6 support may be added later, designing with 16-byte binary storage upfront is safer.

**b. For non-negative data (such as auto-increment IDs, integer IPs, and age), prefer unsigned integer types.**

Using `UNSIGNED` does not change the number of storage bytes occupied by an integer type; it simply shifts the representable range from negative-inclusive to non-negative starting at 0. For instance, `INT` occupies 4 bytes whether signed or unsigned, with the following ranges:

```sql
SIGNED INT -2147483648~2147483647
UNSIGNED INT 0~4294967295
```

For exact storage sizes and value ranges, refer to the official MySQL documentation: [Integer Types](https://dev.mysql.com/doc/refman/8.0/en/integer-types.html) and [Data Type Storage Requirements](https://dev.mysql.com/doc/refman/8.0/en/storage-requirements.html).

**c. Prefer `TINYINT` for small numeric values (such as age or status flags like 0/1).**

**d. For date and time columns, never store dates as strings. Consider `DATETIME`, `TIMESTAMP`, or numeric timestamps.**

Each of these three options has its own strengths—choosing the one that best fits your scenario is key. Below is a quick comparison to help you select the right time data type in development:

> **Note**: The storage sizes below apply to MySQL 5.6.4+ (which supports fractional-second microsecond precision). Prior to 5.6.4, `DATETIME` always took 8 bytes and `TIMESTAMP` took 4 bytes. Fractional-second precisions of 1–2, 3–4, and 5–6 digits consume an extra 1, 2, and 3 bytes respectively.

| Type | Storage Space | Date Format | Date Range | Time Zone Handling |
| ------------ | ----------- | ------------------------------ | ------------------------------------------------------------ | ----------------------------- |
| DATETIME | 5–8 bytes | YYYY-MM-DD hh:mm:ss[.fraction] | 1000-01-01 00:00:00[.000000] – 9999-12-31 23:59:59[.999999] | No time zone conversion |
| TIMESTAMP | 4–7 bytes | YYYY-MM-DD hh:mm:ss[.fraction] | 1970-01-01 00:00:01[.000000] – 2038-01-19 03:14:07[.999999] | Converted per session `time_zone` on read/write |
| Numeric Timestamp | 4 or 8 bytes | All digits, e.g., 1578707612 | Depends on integer type and precision | No time zone conversion |

`TIMESTAMP` does not store a time zone name; instead, it converts values according to the current session's `time_zone` on storage and retrieval. `DATETIME` represents a literal date-time without time zone conversion. Second-level Unix timestamps can use `INT UNSIGNED`, though they are constrained by the representable range; millisecond-level timestamps generally require `BIGINT`.

For a detailed guide on selecting MySQL time types, see: [Recommendations for Storing Time Data Types in MySQL](https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html).

**e. Use `DECIMAL` for monetary fields to avoid precision loss.**

`DECIMAL` stores exact fractional numbers—such as currency amounts—preventing precision loss inherent to floating-point types.

In Java, MySQL's `DECIMAL` type maps to `java.math.BigDecimal`.

For a deep dive into `BigDecimal`, see: [Detailed Guide to BigDecimal](https://javaguide.cn/java/basis/bigdecimal.html).

**f. Prefer auto-incrementing IDs as primary keys whenever appropriate.**

When the primary key is auto-incrementing, new records are appended to the tail of the B+ tree, avoiding mid-page splits and delivering optimal write performance. Once a data page fills up, InnoDB simply allocates a new data page and keeps appending.

When the primary key is non-auto-incrementing, to keep leaf nodes ordered after inserting a new record, InnoDB must locate an insertion point in the middle of leaf pages. If the target page is full, a **page split** occurs—splitting the page in two and moving half the rows to a new page. Page splits require pessimistic locking and substantial data movement, leading to poor write performance.

However, in sharded database/table architectures, relying on single-node auto-increment IDs as global primary keys is not recommended; distributed IDs such as Snowflake, segment mode, monotonically trending IDs, or UUIDv7/ULID are far more common. If you use UUIDs, avoid storing random UUID strings directly as InnoDB primary keys—consider `BINARY(16)` storage, time-ordered UUIDs, or MySQL's `UUID_TO_BIN()` for more compact binary storage.

Further reading: [Must Database Primary Keys Always Be Auto-Incrementing? When Should You Avoid Auto-Increment?](https://mp.weixin.qq.com/s/vNRIFKjbe7itRTxmq-bkAA).

**g. Use `NULL` according to semantics rather than banning it mechanically.**

`NULL` is completely different from `''` (empty string) or the number `0`—it represents unknown or absent values. Testing for `NULL` requires `IS NULL` or `IS NOT NULL`, not comparison operators like `=`, `!=`, `<`, or `>`.

Making every column nullable across the board is not advisable because it increases semantic and query-handling complexity; on the other hand, it is inaccurate to claim that `NULL` always breaks indexes. MySQL can optimize `IS NULL` using indexes. What should take priority is business semantics: if a column can genuinely be unknown—such as `paid_at`, `deleted_at`, or `last_login_at`—using `NULL` is usually much clearer than stuffing in a magic sentinel default value.

Additionally, `NULL` affects aggregate functions: `SUM`, `AVG`, `MIN`, and `MAX` ignore `NULL` values. `COUNT(*)` counts all rows, whereas `COUNT(column_name)` only counts non-`NULL` values.

## Prefer UNION ALL Over UNION

`UNION` places all rows from both result sets into a temporary table and performs deduplication afterward, consuming more time and CPU resources.

`UNION ALL` skips deduplication and returns all rows including duplicates.

If business logic guarantees the two result sets have no duplicates—or duplicates are acceptable—prefer `UNION ALL`. If deduplication is mandatory, stick with `UNION` or explicit deduplication.

## Prefer Batch Operations

For data updates in the database, use batch operations whenever possible to minimize database round trips and boost performance.

```sql
# Bad Example
INSERT INTO `cus_order` (`id`, `score`, `name`) VALUES (1, 426547, 'user1');
INSERT INTO `cus_order` (`id`, `score`, `name`) VALUES (1, 33, 'user2');
INSERT INTO `cus_order` (`id`, `score`, `name`) VALUES (1, 293854, 'user3');

# Good Example
INSERT into `cus_order` (`id`, `score`, `name`) values(1, 426547, 'user1'),(1, 33, 'user2'),(1, 293854, 'user3');
```

## SHOW PROFILE Is Deprecated—Do Not Rely on It in New Versions

[`SHOW PROFILE`](https://dev.mysql.com/doc/refman/8.0/en/show-profile.html) and `SHOW PROFILES` have been marked deprecated by MySQL and may be removed in future versions. Today, when troubleshooting SQL performance, typically you first identify problematic queries via the slow query log, inspect how the optimizer executes them with `EXPLAIN` (or use `EXPLAIN ANALYZE` in MySQL 8.0.18+ for actual timings and row counts), and check resource consumption through Performance Schema.

For instance, to view the execution times of recently executed SQL statements, query `events_statements_history_long`:

```sql
SELECT
    EVENT_ID,
    SQL_TEXT,
    TIMER_WAIT / 1000000000 AS duration_ms,
    LOCK_TIME / 1000000000 AS lock_ms,
    ROWS_EXAMINED,
    ROWS_SENT,
    CPU_TIME / 1000000000 AS cpu_ms
FROM performance_schema.events_statements_history_long
WHERE SQL_TEXT IS NOT NULL
ORDER BY TIMER_WAIT DESC
LIMIT 10;
```

`CPU_TIME` requires MySQL 8.0.28+; on older versions, examine `TIMER_WAIT`, `LOCK_TIME`, `ROWS_EXAMINED`, and `ROWS_SENT` first. `events_statements_history_long` only retains a subset of the most recently completed statement events globally, evicting older entries once full; if the relevant consumers and instruments are not enabled, sufficient metrics may not be collected.

## Optimizing Slow SQL

To optimize slow SQL, we first need to identify which SQL statements are running slowly.

The MySQL slow query log records SQL statements whose execution time exceeds a configured threshold. By analyzing this log, we can pinpoint slow-running SQL queries.

For performance reasons, the slow query log is disabled by default; you can enable it with the following commands:

```sql
# Enable the slow query log
SET GLOBAL slow_query_log = 'ON';
# Specify the slow query log file path
SET GLOBAL slow_query_log_file = '/var/lib/mysql/ranking-list-slow.log';
# Also log queries not using indexes regardless of timeout; use cautiously and briefly in production
SET GLOBAL log_queries_not_using_indexes = 'ON';
# Slow query threshold (seconds); SQL exceeding this threshold will be logged
SET GLOBAL long_query_time = 1;
# Log slow queries only when examined rows exceed this threshold
SET GLOBAL min_examined_row_limit = 100;
```

`SET GLOBAL` only affects new connections; existing connections may retain their previous session settings. In production, it is recommended to put these parameters in the configuration file and roll them out through change-management procedures.

After setting them, verify using `show variables like 'slow%';`.

```bash
| Variable_name       | Value                                |
+---------------------+--------------------------------------+
| slow_launch_time    | 2                                    |
| slow_query_log      | ON                                   |
| slow_query_log_file | /var/lib/mysql/ranking-list-slow.log |
+---------------------+--------------------------------------+
3 rows in set (0.01 sec)
```

Let's deliberately execute an unindexed sorting query on a table containing a million rows:

```sql
SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
```

Do not modify permissions on the MySQL data directory just to view the slow query log. A safer practice is to inspect it using an account with appropriate privileges, output the slow log to a dedicated directory, or collect it through a log aggregation pipeline.

Inspect the corresponding slow query log:

```bash
 cat /var/lib/mysql/ranking-list-slow.log
```

The SQL statement we intentionally ran has been captured in the slow query log:

```plain
# Time: 2022-10-09T08:55:37.486797Z
# User@Host: root[root] @  [172.17.0.1]  Id:    14
# Query_time: 0.978054  Lock_time: 0.000164 Rows_sent: 999999  Rows_examined: 1999998
SET timestamp=1665305736;
SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
```

Explanation of the log fields:

- `Time`: Server timestamp when the logged query ran.
- `User@Host`: Who executed the query.
- `Query_time`: Total execution duration of the query.
- `Lock_time`: Duration spent waiting for locks during execution.
- `Rows_sent`: Number of rows returned by the slow query.
- `Rows_examined`: Number of rows scanned by the slow query.

In real projects, slow query logs are typically complex and require analysis tools. Built-in tools like MySQL's `mysqldumpslow` group identical query patterns together and aggregate execution counts, per-execution durations, and related metrics.

When managing slow SQL, monitor these metrics together:

| Metric | Description | Common Issues |
| --------------- | ---------------- | ------------------------ |
| `Query_time` | Total SQL execution time | Slow execution, lock waits, slow I/O |
| `Lock_time` | Time spent waiting on locks | Row-lock contention, table locks, DDL interference |
| `Rows_examined` | Rows scanned | Missing indexes, poor index selectivity |
| `Rows_sent` | Rows returned | Overly broad query range, deep pagination |
| Execution Frequency | Executions per unit time | Individually fast, yet cumulative load overwhelms the DB |

Do not focus solely on the single slowest query. Often the most dangerous queries in production are high-frequency ones that take "only 50 ms each, yet execute thousands of times per second."

Once a slow SQL query is found, analyze the `SELECT` statement with `EXPLAIN`. Before and after deploying an optimization, save the `EXPLAIN FORMAT=TREE`, `EXPLAIN ANALYZE`, slow-log metrics, and key business QPS for the same SQL query so you avoid cases where "the index changed, yet the execution plan stayed the same."

```sql
mysql> EXPLAIN SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | cus_order | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 997572 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)
```

Key column explanations:

- `select_type`: Query type. Common values include `SIMPLE` (regular query without joins or subqueries), `PRIMARY` (outermost query), `UNION` (subsequent query in a `UNION`), and `SUBQUERY` (subquery).
- `table`: The table or derived table involved in the query.
- `type`: Access method—an important indicator of query efficiency, ordered from worst to best: **ALL** (full table scan) < **index** (full index scan) < **range** (index range scan) < **index_merge** (index merge) < **ref** (non-unique index lookup) < **eq_ref** (unique index lookup) < **const** (single-row constant) < **system** (system table). Actual performance should still be evaluated alongside `rows`, `Extra`, and other columns.
- `rows`: Estimated number of rows MySQL must scan to locate the result set; in principle, the fewer rows, the better.
- ...

> **Recommended Reading**: [MySQL Execution Plan Analysis](https://javaguide.cn/database/mysql/mysql-query-execution-plan.html) explains every column of `EXPLAIN` (`id`, `select_type`, `type`, `key`, `rows`, `Extra`, etc.), including `EXPLAIN ANALYZE` introduced in MySQL 8.0.18+ for actual execution profiling. Additionally, Alibaba's [Slow SQL Governance Experience Summary](https://mp.weixin.qq.com/s/LZRSQJufGRpRw6u4h_Uyww) is also well written.

## Using Indexes Properly

Using indexes properly can dramatically accelerate data retrieval by significantly reducing the amount of data scanned.

### Choose Suitable Columns for Indexing

- **Columns with clear semantics and few `NULL` values**: Indexed columns should have clear business semantics and minimize comparison complexity caused by `NULL`. If a field can genuinely be unknown, keep `NULL` rather than stuffing in an ambiguous magic value for "performance."
- **Frequently queried columns**: Columns that are queried very frequently should be indexed.
- **Columns used in filter conditions**: Columns frequently used in `WHERE` predicates should be considered for indexing.
- **Columns frequently used for sorting**: Indexes are already sorted, allowing queries to leverage index ordering and speed up `ORDER BY` operations.
- **Columns frequently used in joins**: Frequently joined columns are often foreign-key columns; you do not have to declare formal foreign keys on them, as they simply represent relationships across tables. Creating indexes on frequently joined columns improves multi-table join performance.

### Avoid Index Invalidation

Index invalidation is another major cause of slow queries, commonly stemming from two categories:

**1. SQL patterns that prevent effective index usage**

These problems usually stem from how the SQL is written: instead of traversing an ordered B+Tree, the query degrades into scanning followed by filtering.

- **Violating the leftmost prefix principle**: Skipping leading columns of a composite index, or placing columns after a range condition (such as `>`, `<`, `BETWEEN`, `LIKE "abc%"`), generally prevents subsequent columns from narrowing the index scan range precisely—though they may still assist with ICP filtering, covering indexes, or sort optimization. Always verify with `key_len`, `rows`, `Extra` in `EXPLAIN` and `EXPLAIN ANALYZE`.
- **Applying expressions or functions to indexed columns**: When a standard index is built on the raw column, performing arithmetic or applying functions to the indexed column on the left side of `WHERE` typically prevents the optimizer from using that index. A better practice is to move the transformation to the constant side or rewrite it as a range predicate; if queries frequently filter by an expression, consider generated-column indexes or functional indexes.
- **Implicit type conversion (subtle and deadly)**: When comparing a "string column" against a "numeric literal," MySQL implicitly wraps the column in a conversion function, breaking B+ tree ordering directly.
- **Leading wildcard in `LIKE` queries**: For example, `LIKE "%abc"`—the uncertainty of leading characters prevents the optimizer from pinpointing the starting boundary of an index range scan.
- **Extra sorting in `ORDER BY`**: When sort columns miss an index or their sort direction mismatches the index structure, MySQL may require extra in-memory or disk-based sorting, typically showing `Using filesort` in the execution plan.

**2. Optimizer abandons the index after cost estimation**

In some cases, the index is technically usable, yet the optimizer calculates the cost and concludes that a full table scan is actually cheaper.

- **Excessive table lookups caused by `SELECT *`**: When querying many non-covered columns and the matched row ratio is large (often exceeding 20%–30%), the optimizer may judge sequential I/O from a full table scan to be cheaper than frequent random I/O from table lookups, and proactively skip the index.
- **`OR` conditions triggering full table scans**: If either side of an `OR` lacks an appropriate index, a full table scan is triggered. Even when both sides are indexed, if the estimated cost of Index Merge is too high, the optimizer still abandons the indexes.
- **Overly long `IN` lists skewing cost estimation**: Very long `IN` lists can distort optimizer cost estimates. MySQL uses `eq_range_index_dive_limit` to control the threshold at which equality ranges switch from index dives to index statistics estimation. Behavior varies across versions and configs, so do not just memorize the number "200"—evaluate alongside `EXPLAIN`, table statistics, and `ANALYZE TABLE`.

Detailed guide: [Summary of MySQL Index Invalidation Scenarios](https://javaguide.cn/database/mysql/mysql-index-invalidation.html).

### Be Cautious When Indexing Frequently Updated Columns

While indexes boost read efficiency, maintaining them carries non-trivial overhead. If a column is rarely queried yet frequently modified, it should not be indexed.

### Prefer Composite Indexes Over Single-Column Indexes Whenever Possible

Indexes occupy disk space—conceptually, each index corresponds to its own B+ tree. If a table has many columns and many indexes, as data grows large, indexes consume substantial disk space and slow down data modifications. With a composite index combining multiple columns into one index structure, you save considerable disk space and improve write efficiency as well.

### Watch Out for Redundant Indexes

Redundant indexes provide overlapping functionality: if a query can hit index `(a, b)`, it can certainly hit index `(a)`, making `(a)` a redundant index. For example, `(name, city)` and `(name)` are redundant—any query hitting the former also hits the latter. In most cases, extend an existing index rather than creating a new one.

### Consider Prefix Indexes Instead of Full Indexes on String Columns

Prefix indexes apply only to string types and consume less space than standard full-column indexes, making them a worthwhile alternative to consider.

### Remove Long-Unused Indexes

Delete indexes that have gone unused for a long time, as unused indexes impose unnecessary performance overhead. In MySQL 5.7, you can inspect the `schema_unused_indexes` view in the `sys` schema to find indexes that have never been used.

However, this view is only meaningful after the service has run long enough under representative workloads. In MySQL 8.0+, before dropping an index, you can mark it invisible first, monitor execution plans and business metrics, and then decide whether to drop it permanently:

```sql
ALTER TABLE t ALTER INDEX idx_name INVISIBLE;
```

## Production Optimization Precautions

- **Never add indexes directly during peak hours**: Adding indexes to large tables can lock or consume resources for extended periods; in production, assess Online DDL behavior, metadata locks, disk space, backups, rollback plans, off-peak maintenance windows, and replica replication lag.
- **Do not sacrifice write performance for a low-frequency query**: More indexes mean higher maintenance costs on inserts, updates, and deletes.
- **Do not ignore data distribution**: The exact same SQL query that runs fast in staging can follow a completely different execution plan in production due to data skew or stale statistics.
- **Do not optimize only the SQL text**: Some bottlenecks require product-level limits on query scope, caching, or offloading to asynchronous reports or a data warehouse.
- **Keep monitoring after deployment**: After rolling out optimizations, continuously watch slow query counts, CPU, I/O, Buffer Pool hit ratio, connection counts, and lock waits.

## References

- MySQL 8.2 Optimizing SQL Statements: https://dev.mysql.com/doc/refman/8.0/en/statement-optimization.html
- Why Alibaba Prohibits Multi-Table Joins in Databases - Hollis: https://mp.weixin.qq.com/s/GSGVFkDLz1hZ1OjGndUjZg
- How Even MySQL's COUNT Statement Can Trip You Up in Interviews - Hollis: https://mp.weixin.qq.com/s/IOHvtel2KLNi-Ol4UBivbQ
- MySQL Performance Optimization Tool Explain Usage Analysis: https://segmentfault.com/a/1190000008131735
- How to Optimize Performance Using the MySQL Slow Query Log: https://kalacloud.com/blog/how-to-use-mysql-slow-query-log-profiling-mysqldumpslow/
