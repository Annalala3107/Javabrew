---
title: In-Depth Guide to MySQL Query Cache
description: An in-depth analysis of how the MySQL Query Cache works, its configuration and management, its advantages and disadvantages, why MySQL 8.0 removed the Query Cache feature, and best practice recommendations for production environments.
category: Database
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Query Cache,query cache,MySQL caching mechanism,cache invalidation,MySQL 8.0,query performance optimization,MySQL memory management
lang: en
sourceRef: zh-ref/database/mysql/mysql-query-cache.md
---

Caching is an effective and indispensable tool for system performance optimization. From operating systems to application software and web services, caching mechanisms are ubiquitously deployed.

However, experienced DBAs consistently advise disabling MySQL's built-in Query Cache in production environments. Furthermore, beginning with MySQL 5.7.20, Query Cache was deprecated by default, and in MySQL 8.0 and later, the Query Cache functionality was completely removed.

Why did this happen? Was the Query Cache truly that ineffective and problematic?

With these questions in mind, let us explore the topic in depth:

- What is the MySQL Query Cache, and what is its applicable scope?
- What are MySQL's caching rules?
- What are the advantages and disadvantages of MySQL Query Cache?
- How does the Query Cache impact overall database performance?

## Introduction to MySQL Query Cache

The MySQL system architecture is illustrated below:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/mysql-architecture-a9cf127e.png)

To accelerate response times for identical query statements, MySQL Server calculates a hash value from the incoming query statement text. MySQL Server does not pre-process or normalize the SQL; the query string must match byte-for-byte for the generated hash values to be identical. Once the hash value is computed, MySQL uses it to look up the cached result set in the Query Cache:

- If a match is found (cache hit), the cached result set is returned directly to the client, bypassing SQL parsing, optimization, and execution entirely.
- If no match is found (cache miss), MySQL executes the query, and stores both the hash value and the resulting dataset in the Query Cache for future use.

In short, **when a `SELECT` query reaches MySQL Server, it first checks the Query Cache; if the query has been executed previously, the result set is returned immediately to the client.**

![](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

## MySQL Query Cache Management and Configuration

You can inspect information regarding the Query Cache by executing the command `SHOW VARIABLES LIKE '%query_cache%';`.

Prior to MySQL 8.0, the output typically resembled the following:

```bash
mysql> show variables like '%query_cache%';
+------------------------------+---------+
| Variable_name                | Value   |
+------------------------------+---------+
| have_query_cache             | YES     |
| query_cache_limit            | 1048576 |
| query_cache_min_res_unit     | 4096    |
| query_cache_size             | 599040  |
| query_cache_type             | ON      |
| query_cache_wlock_invalidate | OFF     |
+------------------------------+---------+
6 rows in set (0.02 sec)
```

In MySQL 8.0 and later, the output is as follows:

```bash
mysql> show variables like '%query_cache%';
+------------------+-------+
| Variable_name    | Value |
+------------------+-------+
| have_query_cache | NO    |
+------------------+-------+
1 row in set (0.01 sec)
```

Here is an explanation of the variables displayed by `SHOW VARIABLES LIKE '%query_cache%';` prior to MySQL 8.0:

- **`have_query_cache`**: Indicates whether the MySQL Server supports the Query Cache. `YES` indicates support; `NO` indicates it is unavailable.
- **`query_cache_limit`**: The maximum size (in bytes) of a single query result set eligible for caching. Result sets exceeding this value are not cached.
- **`query_cache_min_res_unit`**: The minimum memory block size (in bytes) allocated by the Query Cache. While a query executes, MySQL stores results in the cache. If the result set exceeds `query_cache_min_res_unit`, MySQL allocates additional blocks dynamically while streaming the results. In other words, a single query might trigger multiple memory allocations. Tuning `query_cache_min_res_unit` appropriately can help minimize memory fragmentation.
- **`query_cache_size`**: The total amount of memory allocated for caching query results, in bytes (must be an integer multiple of 1024). The MySQL 5.7 official documentation indicates a default value of `1048576` (1 MB); setting it to 0 disables the Query Cache. Default values vary across minor versions, so it is best to configure it explicitly in configuration files rather than relying on defaults.
- **`query_cache_type`**: Sets the Query Cache mode, defaulting to `ON`. Setting this globally impacts subsequent client connections, while clients can modify their session value to govern their own cache usage.
- **`query_cache_wlock_invalidate`**: Controls whether cached data is returned when a table is locked with a write lock. It is disabled (`OFF`) by default; production environments should generally keep this default setting.

Possible values for `query_cache_type` (note that while `query_cache_type` is a dynamic variable in MySQL 5.6/5.7, **there is a caveat**: if the server starts with `query_cache_type=0`, it skips allocating the Query Cache mutex lock. In this state, running `SET GLOBAL query_cache_type` will throw an error; you must update the configuration file and restart. If the server starts with a non-zero value, you can modify it online via `SET GLOBAL query_cache_type=N` without restarting):

- `0` or `OFF`: Disables the Query Cache.
- `1` or `ON`: Enables the Query Cache, but excludes queries starting with `SELECT SQL_NO_CACHE`.
- `2` or `DEMAND`: Enables the Query Cache, but only caches queries explicitly starting with `SELECT SQL_CACHE`.

**Best Practice Recommendations**:

- Do not set `query_cache_size` excessively large. An overly large cache encroaches upon memory needed by other database structures (such as the InnoDB Buffer Pool) and increases search and invalidation overhead. An initial value between 10 MB and 100 MB is recommended, adjusted based on real runtime metrics.
- It is strongly recommended to disable the Query Cache by setting `query_cache_size=0`, rather than relying solely on `query_cache_type`. While both are variables, `query_cache_size=0` completely bypasses cache memory allocation and check routines, ensuring thorough deactivation.

Prior to MySQL 8.0, add the following to `my.cnf` and restart MySQL to enable Query Cache:

```properties
query_cache_type=1
query_cache_size=614400
```

Alternatively, if the server was started with `query_cache_type` set to a non-zero value, you can enable it online via:

```sql
set global query_cache_type=1;
set global query_cache_size=614400;
```

To manually clean or manage the cache, use the following three SQL commands:

- `FLUSH QUERY CACHE;`: Defragments the Query Cache memory pool without removing cached queries.
- `RESET QUERY CACHE;`: Clears and removes all cached queries from the Query Cache.
- `FLUSH TABLES;`: Closes all open tables and clears all content in the Query Cache.

## MySQL Caching Mechanism

### Cache Rules

- The Query Cache stores the query statement and its result set in memory (typically in key-value format, where the Key is a hash calculated from the query text, current database, client character set, and protocol version, and the Value is the query result set). Subsequent identical queries fetch data directly from memory.
- Cached results are shared across client sessions, meaning a query cached by one client can be served to another client.
- SQL statements must match exactly byte-for-byte to trigger a cache hit (case sensitivity, whitespace, active database, protocol version, and character set must all be identical). When evaluating the cache, MySQL Server performs no normalization on the SQL statement.
- Subquery result sets are not cached individually; only the final result set of the entire query is cached.
- Queries containing non-deterministic functions are never cached, such as `NOW()`, `CURDATE()`, `LAST_INSERT_ID()`, `RAND()`, etc.
- Queries that generate warnings are not cached.
- Result sets exceeding `query_cache_limit` (default 1 MB) are not cached.
- If a query references user-defined functions (UDFs), stored functions, user variables, temporary tables, or MySQL system tables, its result is not cached.
- Once a cache entry is established, MySQL's Query Cache tracks every table referenced in the query. If any of those tables undergo changes (either to data or schema), all cache entries associated with that table are immediately invalidated.
- The MySQL Query Cache is virtually ineffective in database sharding environments. The reasons are two-fold: queries are routed by middleware (such as ShardingSphere or MyCat) across disparate MySQL instances, each maintaining its own independent cache; furthermore, sharding middleware frequently rewrites SQL statements (e.g., injecting sharding keys), causing the hashed SQL text to diverge from original queries and resulting in complete cache misses.
- Queries specifying `SQL_NO_CACHE` are not cached.
- ...

Examples of Query Cache `SELECT` options:

```sql
SELECT SQL_CACHE id, name FROM customer;# Will be cached
SELECT SQL_NO_CACHE id, name FROM customer;# Will not be cached
```

### Memory Management in the Caching Mechanism

The Query Cache is stored entirely in memory, so before configuring and using it, we need to understand how it manages memory.

MySQL Query Cache uses an internal memory pool rather than delegating allocations directly to the operating system for every query. The memory pool's fundamental unit is a variable-length memory block that stores metadata (type, size) and result data. A query result set's cached entry links these blocks together via a linked list. The smallest block size is defined by `query_cache_min_res_unit`.

When the MySQL server starts, it initializes the configured memory allocation as a single contiguous free block. When a query begins returning results, MySQL cannot predict the total size of the final result set in advance, so it requests an initial block of size `query_cache_min_res_unit`. If the result set exceeds this block's capacity, MySQL dynamically allocates additional blocks on the fly and stitches them together via a linked list.

Allocating memory blocks requires acquiring a lock on the free memory space, making it a relatively slow operation. MySQL attempts to minimize this overhead by choosing appropriate block sizes; if extra memory remains after storage completes, it trims and releases the unused portion.

Under concurrent read and write operations, blocks of varying sizes are allocated and freed in arbitrary order. Combined with tiny residual fragments (smaller than `query_cache_min_res_unit`) that cannot be reused, the memory pool quickly accumulates non-contiguous free blocks (similar to external fragmentation in operating systems). This in turn triggers frequent and costly memory defragmentation cycles.

## Advantages and Disadvantages of MySQL Query Cache

**Advantages**:

- Query Cache lookups occur very early: right after MySQL receives the client's request and validates privileges, but before SQL parsing, compilation, or execution plan generation. When MySQL receives a query, as soon as permissions are verified, it checks the Query Cache. If hit, it completely bypasses the Optimizer module and never interacts with the underlying storage engine.
- Because it is memory-based, returning results directly from RAM eliminates disk I/O and CPU computational overhead. **However, this benefit holds true only in low-concurrency, read-heavy, and mostly static workloads**. In multi-core, high-concurrency environments, intense contention over the single global `LOCK_query_cache` mutex forces threads into wait states (visible in `SHOW PROCESSLIST` as `Waiting for query cache lock`), causing actual TPS/QPS to drop dramatically.

**Disadvantages**:

- MySQL computes a hash for every incoming `SELECT` query and searches the cache index. While hash calculation itself consumes negligible CPU, Query Cache relies on a single global mutex (`LOCK_query_cache`) to guarantee concurrency safety. Under high concurrency, thousands of queries simultaneously compete for this single lock to inspect or insert cache entries. Extreme lock contention and thread context-switching overhead become a fatal performance bottleneck.
- Severe cache invalidation penalties. If table modifications are frequent, the cache invalidation rate skyrockets. Table modifications include not only data changes (`INSERT`, `UPDATE`, `DELETE`), but also any schema or index alterations.
- Queries with identical results but slight textual differences are cached separately, causing excessive memory consumption. Variations in character casing, extra whitespace, or comments cause MySQL to generate different hash keys.
- Improper configuration of system variables leads to rampant memory fragmentation, forcing frequent and expensive cache compaction.

## Performance Impact of MySQL Query Cache

Enabling the Query Cache introduces non-trivial overhead to both reads and writes in MySQL Server:

- **Reads Require Lock Acquisition**: Before executing, every read query must check for a cache hit, which requires acquiring a shared lock on `LOCK_query_cache`. Under high concurrency, massive numbers of read requests contending for the lock create execution queues.
- **Cache Write Overhead**: If a read query is cacheable, storing its result after execution involves memory block allocation and linked-list manipulation, which also requires holding the mutex.
- **Writes Trigger Global Invalidation**: Writing to a table requires invalidating all cached entries associated with that table. This requires an exclusive lock and scans the entire cache structure; the larger `query_cache_size`, the longer this lock is held. This single global mutex design means write operations block all concurrent reads and writes targeting the cache—the primary architectural reason MySQL 8.0 eliminated the feature entirely.
- **InnoDB Long Transactions Exacerbate Contention**: Under MVCC, uncommitted transactions prevent cached data from being safely used. Long-running transactions degrade cache hit rates, while the exclusive locks held during writes block cache reads targeting **completely unrelated tables**.

You can inspect Query Cache runtime statistics using the following command to determine whether enabling it is worthwhile:

```sql
SHOW STATUS LIKE 'Qcache%';
```

Key Metrics Explanation:

| Status Variable | Meaning |
| :--- | :--- |
| `Qcache_hits` | Number of cache hits |
| `Qcache_inserts` | Number of queries inserted into the cache |
| `Qcache_not_cached` | Number of non-cached queries (ineligible or missed) |
| `Qcache_lowmem_prunes` | Number of queries pruned from cache due to low memory; continuous increases indicate insufficient memory or severe fragmentation |
| `Qcache_free_memory` | Amount of remaining free memory in the cache (bytes) |

Reference Hit Rate Formula:

```
Hit Rate = Qcache_hits / (Qcache_hits + Qcache_inserts + Qcache_not_cached)
```

If the hit rate remains consistently below 50%, the database workload is ill-suited for Query Cache, and it should be disabled. Furthermore, monitor the ratio of `Qcache_lowmem_prunes` to `Qcache_inserts`: an unusually high ratio indicates that newly cached data is almost immediately evicted due to memory pressure or fragmentation, making the cache a pure net-negative performance drag. When `Qcache_lowmem_prunes` grows steadily, run `FLUSH QUERY CACHE` to defragment memory, or consider reducing `query_cache_min_res_unit`.

## Summary

Although the MySQL Query Cache can theoretically boost query speeds, its management overhead is substantial: every query requires checking and potentially writing to the cache, and any table write triggers invalidation and cleanup.

The Query Cache is suited only for very narrow, specific use cases. If your application rarely modifies database tables, the Query Cache can deliver noticeable benefits. A classic example is a static blog system, where posts are updated infrequently and tables remain stable over long periods.

In summary, the Query Cache is suitable for scenarios where:

- Table data is modified rarely and remains largely static.
- Queries (`SELECT`) exhibit high repeatability.
- Result sets are smaller than 1 MB.

For systems with frequent updates, the Query Cache provides virtually no benefit, and in many cases actively degrades performance.

Scenarios where Query Cache is NOT suitable:

- Table data, schemas, or indexes change frequently.
- Query repeatability is low.
- Result sets are large.

As noted in *High Performance MySQL*:

> In our experience, the query cache can cause performance to degrade or even freeze the system under high-concurrency pressure. If you must use the query cache, do not allocate too much memory to it, and only use it when the benefits are clear (such as when database content changes infrequently).

**This holds true in practice! In modern software engineering, it is far better to utilize application-level local caching (such as Caffeine) or distributed caching (such as Redis), which provide superior performance, flexibility, and architectural robustness.**

## References

- *High Performance MySQL*
- MySQL Cache Mechanism: <https://zhuanlan.zhihu.com/p/55947158>
- RDS MySQL Query Cache Setup and Usage - Alibaba Cloud RDS Documentation: <https://help.aliyun.com/document_detail/41717.html>
- 8.10.3 The MySQL Query Cache - MySQL Official Documentation: <https://dev.mysql.com/doc/refman/5.7/en/query-cache.html>
