---
title: Summary of MySQL High-Performance Optimization Specifications and Recommendations
description: Summary of MySQL high-performance optimization specifications and recommendations, covering database naming conventions, table design specifications, column design specifications, index design specifications, SQL writing rules, etc., helping you build an efficient and stable database system.
category: Database
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL optimization guidelines,database design specifications,index design,SQL writing best practices,slow query optimization,column type selection,table schema design
lang: en
sourceRef: zh-ref/database/mysql/mysql-high-performance-optimization-specification-recommendations.md
---

> Author: Ting Feng. Original URL: <https://www.cnblogs.com/huchong/p/10219318.html>.
>
> JavaGuide has obtained the author's authorization and has refined and supplemented the original content.

## Database Naming Conventions

- All database object names must use lowercase letters separated by underscores (`snake_case`).
- Database object names are strictly prohibited from using MySQL reserved keywords (if a table name contains a keyword, it must be enclosed in backticks during queries).
- The naming of database objects should be self-explanatory (meaningful at a glance) and preferably not exceed 32 characters.
- Temporary databases and tables must use `tmp_` as a prefix and a date as a suffix; backup tables must use `bak_` as a prefix and a date (timestamp) as a suffix.
- All column names and column types storing identical data across tables must remain consistent (these usually serve as join columns; if join column types are inconsistent during queries, MySQL will automatically perform implicit data type conversion, causing indexes on those columns to become invalid and degrading query efficiency).

## Basic Database Design Specifications

### All Tables Must Use the InnoDB Storage Engine

Unless there are special requirements (i.e., features that InnoDB cannot satisfy, such as columnar storage or spatial data storage), all tables must use the InnoDB storage engine (MySQL used MyISAM by default before version 5.5, and has used InnoDB by default since version 5.6).

InnoDB supports transactions, row-level locking, provides superior crash recovery capabilities, and performs significantly better under high concurrency.

### Database and Table Character Sets Should Uniformly Use UTF8

Uniform character sets offer better compatibility and avoid garbled characters caused by character set conversion. Furthermore, comparing columns with different character sets requires runtime conversion, which invalidates indexes. If you need to store emoji characters, you must use the `utf8mb4` character set.

Recommended reading: [In-depth Guide to MySQL Character Sets](../character-set.md).

### All Tables and Columns Must Have Comments

Use the `COMMENT` clause to add descriptions for tables and columns to maintain the data dictionary from day one.

### Try to Control Single Table Data Volume, Recommended Within 5 Million Rows

5 million rows is not a hard limit of the MySQL database engine itself; rather, excessively large tables cause severe operational challenges when modifying table schemas, backing up, or restoring data.

You can control data volume through strategies such as historical data archiving (applicable to log data) and database/table sharding (applicable to core business data).

### Use MySQL Partitioned Tables with Caution

Partitioned tables appear physically as multiple files but logically as a single table.

Choose partition keys prudently; cross-partition queries may actually yield lower efficiency.

It is recommended to adopt physical sharding instead to manage massive datasets.

### Place Columns Frequently Queried Together into the Same Table

This avoids unnecessary join operations across tables.

### Prohibit Creating Reserved Fields in Tables

- It is difficult to name reserved fields in a self-explanatory manner.
- The data type to be stored in reserved fields cannot be determined in advance, making it impossible to select an optimal column type.
- Modifying the data type of reserved fields later requires table schema locks.

### Prohibit Storing Large Binary Data Such as Files (e.g., Images) in the Database

Storing files directly in the database severely impacts database performance and consumes excessive storage capacity.

Large binary files (such as images, videos, and documents) should generally be stored on dedicated object storage or file servers, with the database storing only the file URL/path references.

### Do Not Be Strictly Bound by Database Normalization Forms

Generally speaking, relational database design aims to satisfy the Third Normal Form (3NF). However, strictly adhering to 3NF often forces splitting data into numerous tables. Querying this data requires extensive multi-table joins. To boost query throughput, normalization requirements can be relaxed intentionally by preserving a moderate degree of redundant data (also known as denormalization). Note that denormalization must always be applied in moderation.

### Prohibit Running Database Stress Tests in Production Environments

### Prohibit Connecting Directly from Development or Testing Environments to Production Databases

This poses severe security and operational risks; always treat the production environment with utmost caution!

## Database Column Design Specifications

### Prefer the Smallest Data Type That Meets Storage Requirements

Smaller storage bytes take up less disk and memory space, resulting in better I/O and cache performance.

**a. Certain strings can be converted into numeric types for storage, such as storing IP addresses as integers.**

Numbers are contiguous, offering better performance and requiring less storage space.

MySQL provides two built-in functions to handle IP addresses:

- `INET_ATON()`: Converts an IPv4 address to an unsigned integer (4 to 8 bytes);
- `INET_NTOA()`: Converts an integer back to an IP address string.

Before inserting data, use `INET_ATON()` to convert the IP address into an integer; when displaying data, use `INET_NTOA()` to convert the integer back into a readable IP address.

**b. For non-negative data (such as auto-increment IDs, integer IPs, and ages), prioritize using unsigned integers.**

Unsigned integers offer double the positive storage range compared to signed integers:

```sql
SIGNED INT -2147483648~2147483647
UNSIGNED INT 0~4294967295
```

**c. For small numeric values (such as age, or status codes like 0/1), prioritize the `TINYINT` type.**

### Avoid TEXT and BLOB Data Types; the Most Common TEXT Type Can Store 64 KB

**a. Separate BLOB or TEXT columns into dedicated extension tables.**

MySQL in-memory temporary tables do not support large data types like `TEXT` and `BLOB`. If a query contains these data types, operations such as sorting cannot use in-memory temporary tables and must fall back to disk-based temporary tables. Moreover, MySQL often needs secondary lookups for such off-page data, which severely impairs SQL performance. This does not mean these types should never be used, but they must be handled carefully.

If they must be used, it is recommended to separate `BLOB` or `TEXT` columns into a dedicated extension table. In queries, never use `SELECT *`; only retrieve necessary columns, and avoid querying `TEXT` columns when their content is not needed.

**b. TEXT or BLOB columns can only use prefix indexes.**

Because MySQL imposes limits on index column length, `TEXT` types can only use prefix indexes, and `TEXT` columns cannot have default values.

### Avoid Using the ENUM Type

- Modifying `ENUM` values requires executing an `ALTER TABLE` statement.
- `ORDER BY` operations on `ENUM` types are inefficient and require additional sorting overhead.
- The `ENUM` data type has several caveats; for instance, using numeric values as enumeration members is strongly discouraged.

Related reading: [Is it recommended to use MySQL's ENUM type? - Architecture Digest - Zhihu](https://www.zhihu.com/question/404422255/answer/1661698499).

### Define All Columns as NOT NULL Whenever Possible

Unless there is a specific, well-justified reason to allow `NULL` values, columns should always be defined as `NOT NULL`.

- Indexing `NULL` columns requires extra storage overhead (null bitmap tracking).
- Comparisons and calculations require special null-handling logic in MySQL query execution.

Related reading: [Technical Sharing | MySQL Default Value Choices (Empty String vs. NULL)](https://opensource.actionsky.com/20190710-mysql/).

### Never Store Dates as Strings

For temporal data, never use strings to store dates. Consider `DATETIME`, `TIMESTAMP`, or numeric epoch timestamps instead.

Each of these three methods has its own advantages; choosing the most suitable option depends on the specific scenario. Below is a comparison table to help choose the correct date/time data type:

| Type | Storage Space | Date Format | Date Range | Contains Timezone Info |
| --- | --- | --- | --- | --- |
| DATETIME | 5~8 bytes | YYYY-MM-DD hh:mm:ss[.fraction] | 1000-01-01 00:00:00[.000000] ～ 9999-12-31 23:59:59[.999999] | No |
| TIMESTAMP | 4~7 bytes | YYYY-MM-DD hh:mm:ss[.fraction] | 1970-01-01 00:00:01[.000000] ～ 2038-01-19 03:14:07[.999999] | Yes |
| Numeric Timestamp | 4 bytes | Pure numbers, e.g., 1578707612 | Times after 1970-01-01 00:00:01 | No |

For a detailed discussion on selecting MySQL time types, see: [Recommendations on MySQL Date and Time Data Storage](https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html).

### Financial and Monetary Amounts Must Use the DECIMAL Type

- **Non-exact floating-point**: `FLOAT`, `DOUBLE`
- **Exact fixed-point**: `DECIMAL`

The `DECIMAL` type is an exact fixed-point number that does not lose precision during calculations. The storage space is determined by the defined precision and scale; every 4 bytes can store 9 decimal digits, and the decimal point occupies one byte. Additionally, `DECIMAL` can store integer values larger than `BIGINT`.

However, because `DECIMAL` entails additional storage and computational overhead, it should only be used when high-precision calculations are genuinely required.

### Avoid Having Too Many Columns in a Single Table

If a table contains an excessive number of columns, consider decomposing it into multiple related tables, using intermediate join tables or one-to-one extension tables where necessary.

## Index Design Specifications

### Limit the Number of Indexes per Table, Recommended at Most 5 per Table

More indexes do not necessarily equal better performance! Indexes can enhance query efficiency, but they can equally degrade overall database performance.

While indexes accelerate query speeds, they also degrade insertion, update, and deletion performance, and in certain circumstances can even slow down queries.

When the MySQL query optimizer decides how to optimize a query, it evaluates every available index based on statistical data to construct the optimal execution plan. If too many candidate indexes exist, the optimizer spends considerably more time analyzing and generating the execution plan, which degrades query response times.

### Prohibit Using Full-Text Indexes

Full-text indexes are not suitable for high-concurrency OLTP scenarios.

### Prohibit Creating Separate Single Indexes for Every Column

Prior to MySQL 5.6, a single SQL query could only use at most one index from a single table. While MySQL 5.6+ introduced Index Merge optimizations, its performance remains far inferior to a properly designed composite index.

### Every InnoDB Table Must Have a Primary Key

InnoDB tables are index-organized tables (IOT): the logical order of physical data storage is identical to the order of the clustered primary key index. A table can have multiple secondary indexes, but only one physical storage order.

InnoDB organizes its table storage strictly by primary key index order.

- Do not use frequently updated columns as primary keys, and avoid composite primary keys.
- Do not use UUIDs, MD5 hashes, or arbitrary string columns as primary keys (they cannot guarantee sequentially increasing data insertion).
- It is strongly recommended to use an auto-increment integer ID as the primary key.

### Common Recommendations for Indexed Columns

- Columns appearing in the `WHERE` clause of `SELECT`, `UPDATE`, and `DELETE` statements.
- Columns included in `ORDER BY`, `GROUP BY`, and `DISTINCT` clauses.
- Do not create individual single-column indexes for every column satisfying the above rules; instead, combining them into composite indexes usually delivers much better performance.
- Join columns in multi-table queries.

### How to Order Columns in a Composite Index

The primary goal of building an index is to locate data efficiently, minimize random I/O, and improve query throughput. The fewer rows an index filters down to, the fewer data pages need to be loaded from disk.

- **Place the column with the highest cardinality (selectivity) on the leftmost side of the composite index**: This is the most crucial principle. Higher selectivity means fewer rows survive the index filter, resulting in fewer I/O operations. Cardinality is calculated as `count(distinct column) / count(*)`.
- **Place the most frequently queried column on the leftmost side**: This aligns with the leftmost prefix matching rule. Placing the most common query condition column leftmost maximizes index reuse.
- **Column length considerations**: Column length has negligible impact on the non-leaf nodes of a composite index because they store values across indexed columns. Column length primarily affects primary keys and secondary index leaf node storage space. Therefore, column length carries the lowest priority when ordering composite index columns. For primary keys and secondary indexes, choosing shorter column types saves disk space and improves I/O cache efficiency.

### Avoid Creating Redundant and Duplicate Indexes (Increases Query Optimizer Planning Overhead)

- Duplicate index example: `PRIMARY KEY(id)`, `INDEX(id)`, `UNIQUE INDEX(id)`.
- Redundant index example: `INDEX(a, b, c)`, `INDEX(a, b)`, `INDEX(a)`.

### For Frequent Queries, Prioritize Covering Indexes

> Covering Index: An index that contains all the columns required by the query (columns referenced in `SELECT`, `WHERE`, `ORDER BY`, and `GROUP BY`).

**Benefits of Covering Indexes**:

- **Avoids secondary lookups (table lookups) in InnoDB**: InnoDB stores data in clustered index order. For secondary indexes, leaf nodes store only the indexed columns and the corresponding row's primary key. When querying via a secondary index, after finding the matching index entries, MySQL must look up the clustered index using the primary key to fetch the remaining columns (table lookup ). With a covering index, all required columns are already present in the secondary index leaf node, completely avoiding table lookups, eliminating extra I/O, and significantly boosting query speed.
- **Converts random I/O into sequential I/O to accelerate queries**: Because index entries are stored sequentially by key value, traversing an index for I/O-intensive range queries requires substantially less random disk I/O than fetching individual rows scattered across data pages. Using covering indexes thus transforms random disk reads into sequential index scans.

---

### Index Constraint Specifications

**Avoid Using Foreign Key Constraints**

- Explicit foreign key constraints (`FOREIGN KEY`) are discouraged, but you must always create indexes on relationship columns connecting tables.
- Foreign keys ensure referential integrity, but this guarantee is preferably enforced at the application business layer.
- Foreign keys impact write and lock performance across both parent and child tables.

## Database SQL Development Specifications

### Minimize Computations in the Database; Offload Complex Logic to the Application Layer

Avoid running complex computations in the database; shift them to business applications. This prevents overloading the database, preserving its performance and stability. The primary role of a database is storing and retrieving data, not performing heavy computational processing.

### Focus Optimization on High-Impact SQL Queries

Identify SQL statements that benefit most from optimization. These are either the most frequently executed queries or queries where optimization yields the largest performance gains. You can discover target statements by analyzing MySQL slow query logs.

### Make Full Use of Existing Indexes on Tables

Avoid leading wildcards in search conditions, such as `a LIKE '%123%'` (a trailing wildcard like `a LIKE '123%'` can successfully use the index).

A single SQL query can typically only leverage one column for range searching in a composite index. For example, given a composite index on `(a, b, c)`, if a range query is performed on column `a`, the index portions on columns `b` and `c` will not be utilized for index seeks.

When designing a composite index, if column `a` involves range searching, place column `a` towards the right side of the composite index. Use `LEFT JOIN` or `NOT EXISTS` to optimize `NOT IN` operations, because `NOT IN` commonly causes indexes to be bypassed.

### Prohibit SELECT *; Always Explicitly Specify Column Names (SELECT <Column List>)

- `SELECT *` consumes unnecessary CPU cycles during parsing and processing.
- `SELECT *` retrieves unused columns, wasting network bandwidth and increasing data transfer latency, especially for large columns (such as `VARCHAR`, `BLOB`, `TEXT`).
- `SELECT *` cannot leverage covering index optimizations in the MySQL optimizer (covering index lookups are exceptionally fast, efficient, and strongly recommended in industry practice).
- Explicit column lists reduce the impact of subsequent table schema changes on application code.

### Prohibit INSERT Statements Without Column Lists

**Not recommended**:

```sql
insert into t values ('a','b','c');
```

**Recommended**:

```sql
insert into t(c1,c2,c3) values ('a','b','c');
```

### Recommend Using Prepared Statements for Database Operations

- Prepared statements allow the database to reuse query execution plans, reducing SQL compilation overhead and preventing SQL injection vulnerabilities caused by dynamic string concatenation.
- Transmitting only parameter values is more network-efficient than sending full SQL statements repeatedly.
- The same statement can be parsed once and executed multiple times, improving throughput.

### Avoid Implicit Data Type Conversions

Implicit data type conversions invalidate indexes. For example:

```sql
select name,phone from customer where id = '111';
```

For an in-depth explanation, see: [Index Invalidation Caused by Implicit Conversion in MySQL](./index-invalidation-caused-by-implicit-conversion.md).

### Avoid Subqueries; Optimize Them into JOIN Operations

Generally, subqueries in an `IN` clause can be optimized into joins only when the subquery is a simple SQL query (containing no `UNION`, `GROUP BY`, `ORDER BY`, or `LIMIT` clauses).

**Reasons for poor subquery performance**: The result sets of subqueries cannot utilize indexes. Result sets are typically stored in temporary tables (either in-memory or disk-based) that lack indexes, degrading query performance. This performance penalty becomes severe when subqueries return large result sets. Because subqueries generate substantial unindexed temporary tables, they consume extensive CPU and I/O resources, frequently resulting in slow queries.

### Avoid JOINing Too Many Tables

MySQL utilizes join buffers whose size is governed by the `join_buffer_size` parameter.

For each additional table joined in a single SQL query, MySQL allocates a separate join buffer. The more tables joined in a query, the more memory is consumed.

If an application heavily executes multi-table joins while `join_buffer_size` is improperly configured, it can trigger server out-of-memory (OOM) conditions, jeopardizing database stability.

Furthermore, join operations frequently generate intermediate temporary tables, degrading query speed. While MySQL permits joining up to 61 tables, it is recommended never to exceed 5 tables.

### Reduce the Number of Database Round Trips

Databases excel at processing batch operations. Combining multiple identical operations into batch statements substantially improves execution efficiency.

### Use IN Instead of OR When Evaluating the Same Column

Keep the number of values in an `IN` clause under 500. An `IN` list can utilize indexes much more effectively, whereas `OR` conditions frequently fail to use indexes.

### Prohibit Using ORDER BY RAND() for Random Sorting

`ORDER BY RAND()` loads all matching rows from the table into memory, generates a random number for each row, and sorts the entire dataset in memory. If the qualifying dataset is large, it consumes massive amounts of CPU, I/O, and memory resources.

It is recommended to generate random identifiers or offsets in the application layer, and then query the database directly using those values.

### Prohibit Function Calls and Calculations on Columns in WHERE Clauses

Applying functions or arithmetic calculations to columns prevents the optimizer from utilizing indexes on those columns.

**Not recommended**:

```sql
where date(create_time)='20190101'
```

**Recommended**:

```sql
where create_time >= '20190101' and create_time < '20190102'
```

### Use UNION ALL Instead of UNION When Duplicates Are Guaranteed Not to Exist

- `UNION` inserts all rows from both result sets into a temporary table before executing a deduplication pass.
- `UNION ALL` merges result sets directly without deduplication overhead.

### Split Large Complex SQL Queries into Multiple Smaller Queries

- Large SQL queries are logically complex and require significant CPU resources for processing.
- In MySQL, a single query runs using a single CPU core.
- Splitting queries allows the application to execute smaller queries in parallel, improving overall throughput.

### Use Dedicated Accounts for Different Databases; Prohibit Cross-Database Queries

- Reserves flexibility for database migrations and future database/table sharding.
- Reduces coupling between business domains.
- Mitigates security risks stemming from overly broad database privileges.

## Database Operational Behavior Specifications

### Batch Writes (UPDATE, DELETE, INSERT) Exceeding 1 Million Rows Must Be Split into Smaller Batches

**Large batch operations can cause severe primary-replica replication lag**

In primary-replica (master-slave) setups, large batch writes can cause severe replication delay. Huge write operations take considerable time to complete on the primary instance, and replicas only begin executing them after the primary finishes, resulting in prolonged lag.

**Row-based binlog format produces massive log volumes**

Large batch write operations generate immense volumes of binlog data, especially under row-based replication where modifications to every single row are logged. The more rows modified at once, the larger the binlog size, and the longer network transmission and replica replay will take, further exacerbating replication delay.

**Avoid creating massive transactions**

Modifying huge volumes of data in a single transaction locks massive numbers of rows, leading to severe lock contention and thread blocking. Such blocking severely degrades MySQL performance.

Prolonged blocking can exhaust all available database connections, preventing other production applications from connecting. Therefore, large write operations must always be batched.

### Use pt-online-schema-change for Schema Alterations on Large Tables

- Avoids primary-replica replication lag caused by large table DDL operations.
- Avoids table-locking during column and index modifications.

Schema alterations on massive tables must be handled with great caution, as table locks on production tables are unacceptable.

`pt-online-schema-change` works by creating a new table with the identical schema, altering the new table structure, copying rows from the original table to the new table in small chunks, and setting up triggers on the original table to capture concurrent changes. Once all data is synchronized, it renames the new table to replace the original table and drops the old table, effectively breaking a large blocking DDL operation into small, non-blocking batches.

### Prohibit Granting the SUPER Privilege to Application Database Accounts

- When the maximum connection limit (`max_connections`) is reached, MySQL reserves one extra connection slot specifically for users with the `SUPER` privilege.
- The `SUPER` privilege should be reserved strictly for DBAs to perform troubleshooting and administration.

### Follow the Principle of Least Privilege for Application Database Accounts

- Accounts used by applications must be restricted to their respective database and barred from cross-database access.
- In principle, application accounts must not be granted `DROP` permissions.

## Recommended Reading

- [MySQL Design Specifications That Tech Peers Must Know, Learned from Painful Lessons - Alibaba Cloud Developers](https://mp.weixin.qq.com/s/XC8e5iuQtfsrEOERffEZ-Q)
- [15 Practical Tips for Designing Database Tables](https://mp.weixin.qq.com/s/NM-aHaW6TXrnO6la6Jfl5A)
