---
title: Deep Pagination Introduction and Optimization Recommendations
description: Deep pagination occurs when a query offset becomes so large that performance degrades sharply. This article explains why deep pagination slows down and covers four optimization approaches—range queries, subquery optimization, INNER JOIN deferred joins, and covering indexes—along with their use cases and trade-offs.
category: High Performance
head:
  - - meta
    - name: keywords
      content: Deep Pagination,Pagination Optimization,LIMIT Optimization,MySQL Pagination,Deferred Join,Covering Index,Cursor Pagination
lang: en
sourceRef: zh-ref/high-performance/deep-pagination-optimization.md
---

## What Is Deep Pagination and What Causes It?

A scenario where the query offset is excessively large is called deep pagination, which leads to poor query performance. For example:

```sql
# When MySQL cannot leverage an index, it skips 1,000,000 rows before fetching 10 rows
SELECT * FROM t_order ORDER BY id LIMIT 1000000, 10
```

When the query offset grows too large, the MySQL query optimizer may choose a full table scan instead of using an index to optimize the query.

**The fundamental reason deep pagination becomes slow** lies in MySQL's execution mechanism: for `LIMIT offset, N`, MySQL does not jump directly to `offset`; instead, it must scan `offset + N` rows from the beginning. If the query relies on a secondary index and does not satisfy a covering index, MySQL has to perform meaningless **table lookups (bookmark lookups generating massive random I/O)** for all `offset` preceding rows, only to discard that painfully retrieved data afterward. Even if the optimizer eventually falls back to a full table scan due to excessive cost, sequentially scanning millions of rows remains extremely expensive.

![Deep Pagination Issue](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/deep-pagination-phenomenon-900f886b.png)

The threshold at which the query offset becomes "too large" varies across machines depending on hardware configuration (such as CPU speed and disk I/O), table size, index types, and index statistics.

![Critical Point for Falling Back to a Full Table Scan](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/deep-pagination-phenomenon-critical-point-acaa0a08.png)

MySQL's query optimizer uses a cost-based strategy to choose the optimal query execution plan. It weighs CPU and I/O costs to decide whether to perform an index scan or a full table scan. If the optimizer estimates that a full table scan is cheaper, it abandons the index. However, even with a large offset, if the query uses a covering index, MySQL may still choose the index to avoid table lookups.

## Deep Pagination Optimization Recommendations

> **This article is based on MySQL 8.0 + the InnoDB storage engine**; optimizer behavior may differ across versions.

### Range Query (Cursor Pagination)

By recording the ID of the last record from the previous page, fetch the next page using `WHERE id > last_id LIMIT n`:

```sql
# Fetch the next page by recording the ID of the last row from the previous query result
SELECT * FROM t_order WHERE id > 100000 ORDER BY id LIMIT 10
```

**Core advantage of cursor pagination**: **It does not depend on contiguous IDs**. MySQL simply locates `last_id` on the B+ tree and sequentially reads `n` records forward—any gaps in between (such as deleted IDs) have zero effect on correctness or performance.

Limitations of this approach:

1. **No arbitrary page jumping**: Users cannot jump directly to page N; they can only step forward (or backward) page by page.
2. **Restricted sort fields**: If the query must sort by another field (such as creation time) instead of ID, a composite cursor `(sort_field, id)` is required to guarantee uniqueness and deterministic ordering.
3. **Concurrency anomalies**: When new records are inserted or existing records are deleted during pagination, two anomalies can occur:
   - **Missing data**: When querying page 2, a new record is inserted into page 1's range, pushing an earlier row into page 2, yet page 2's query skips past it based on the old last ID.
   - **Duplicate data**: When querying page 2, a record at the end of page 1 is deleted, causing the original first row of page 2 to move up to the end of page 1, so the page 2 query returns it again.

### Subquery

First query the primary key value corresponding to the first parameter of `LIMIT`, then filter by that primary key value and apply `LIMIT`—this is much faster.

Alibaba's *Java Development Handbook* also gives a corresponding guideline:

> Optimize deep pagination scenarios using deferred joins or subqueries.
>
> ![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/alibaba-java-development-handbook-paging-1098ea1c.png)

```sql
-- First locate the starting ID quickly by offsetting on the primary key index via a subquery
SELECT * FROM t_order
WHERE id >= (
    SELECT id FROM t_order ORDER BY id LIMIT 1000000, 1
) ORDER BY id LIMIT 10;
```

**How it works**:

1. The subquery `(SELECT id FROM t_order ORDER BY id LIMIT 1000000, 1)` scans along the primary key index, skips the first 1,000,000 records, and returns the primary key value of the 1,000,001st record.
2. The outer query `SELECT * FROM t_order WHERE id >= ... ORDER BY id LIMIT 10` starts from that primary key and retrieves the next 10 full records.

However, in certain cases, subqueries may materialize temporary tables and hurt performance, so deferred joins are generally recommended for complex queries.

> **Complex filtering scenarios**: In paginated queries with complex filter conditions (such as `WHERE status = 1 ORDER BY id LIMIT 1000000, 10`), matching IDs are often sparse and scattered. Here the subquery advantage is even clearer: by using a composite index (such as `(status, id)`) inside the subquery for a covering index scan, MySQL efficiently skips the first 1,000,000 matching rows, locates the target ID, and forces the outer query to perform only 10 table lookups.

Of course, you could also use a subquery to fetch the set of target page IDs first and then fetch the full rows by those IDs, though that syntax is cumbersome compared to an `INNER JOIN` deferred join.

### Deferred Join

A deferred join shares a similar optimization idea with subqueries: pushing the `LIMIT` operation onto the primary key index tree to cut down table lookups. Compared to a direct subquery, a deferred join integrates the subquery result into the outer query via `INNER JOIN`, avoiding temporary tables that direct subqueries might produce. When executing `INNER JOIN`, the MySQL optimizer can leverage indexes for efficient joins (such as index scans or other optimizations), so under deep pagination it generally outperforms a standalone subquery.

```sql
-- Perform a deferred join using INNER JOIN
SELECT t1.*
FROM t_order t1
INNER JOIN (
    -- The subquery here can leverage a covering index for extremely high performance
    SELECT id FROM t_order ORDER BY id LIMIT 1000000, 10
) t2 ON t1.id = t2.id;
```

**How it works**:

1. The subquery `(SELECT id FROM t_order ORDER BY id LIMIT 1000000, 10)` scans along the primary key index, skips the first 1,000,000 records, and returns the 10 target IDs.
2. `INNER JOIN` joins the subquery result back to `t_order` to fetch the complete row data.

Besides `INNER JOIN`, you can also join the subquery using comma-join syntax.

```sql
-- Perform a deferred join using a comma join
SELECT t1.* FROM t_order t1,
(SELECT id FROM t_order ORDER BY id LIMIT 1000000, 10) t2
WHERE t1.id = t2.id;
```

**Note**: Although comma-joining the subquery achieves a similar effect, standard `INNER JOIN` syntax is strongly recommended for better readability and maintainability.

### Covering Index

A query pattern where the index itself already contains every column needed by the query is called a covering index.

**Benefits of a covering index:**

- **Avoids secondary lookups (table lookups) in InnoDB tables**: InnoDB stores table data ordered by the clustered index, and InnoDB secondary indexes store the row's primary key at their leaf nodes. When querying through a secondary index, after finding the matching index key, InnoDB normally has to perform a second lookup via the primary key to fetch the actual columns. With a covering index, all required data is available right in the secondary index entry, eliminating the second primary-key lookup (table lookup), reducing I/O operations, and boosting query efficiency.
- **Reduces random I/O caused by table lookups**: Returning data directly from the covering index eliminates random I/O against the clustered index. Each primary-key lookup into the clustered index during a table lookup is inherently random I/O.

Suppose a composite index `(code, type)` is created; the following query can use a covering index:

```sql
# In InnoDB, secondary indexes naturally include the primary key id
# If you only need id, code, and type, creating a (code, type) composite index suffices for index coverage
SELECT id, code, type FROM t_order
ORDER BY code
LIMIT 1000000, 10;
```

**⚠️ Note**:

- When the query result set accounts for a large portion of the table's total rows, the MySQL query optimizer may abandon the index and automatically switch to a full table scan.
- Although you can use `FORCE INDEX` to force the optimizer onto an index, doing so can prevent the optimizer from picking a better execution plan and does not always yield good results.

## Production Recommendations

Pagination optimization must first align with product UX. Admin dashboards often require arbitrary page jumping and exact totals, whereas feeds, comment lists, and order lists usually only need "Previous / Next" or "Load More." If the business does not genuinely need to jump to page 10,000, do not sacrifice query performance just to preserve traditional page-number pagination.

Common choices include:

| Product Pattern | Recommended Solution | Rationale |
| ---------------------- | ---------------- | -------------------------------- |
| Feeds, comments, message lists | Cursor pagination | Only needs forward/backward paging; stable performance |
| Admin lists, ops queries | Deferred join or subquery | Compatible with page numbers, but cap max page count |
| Fixed-column leaderboards | Covering index | Few queried columns; minimizes table lookups |
| Complex search, multi-filter sorting | Search engine or OLAP | MySQL is ill-suited for broad-offset search & sort |

### Monitoring and Alerting

- **Slow query monitoring**: Monitor SQL statements with large `LIMIT` offsets in the slow query log to catch issues early.
- **Threshold alerts**: Configure `long_query_time` thresholds to capture deep pagination queries.
- **Execution plan audits**: Periodically inspect `EXPLAIN` plans for critical paginated SQL to ensure the optimizer uses indexes as expected.
- **Endpoint rate limiting**: Rate-limit deep-page requests separately to prevent crawlers or abusive traffic from overwhelming the database.
- **Maximum page limits**: For instance, allow querying only the first 100 pages and guide users to narrow their search filters for deeper records.

### Common Misconceptions

| Misconception | Reality |
| --------------------------------- | ---------------------------------------------------- |
| Thinking `FORCE INDEX` solves everything | Forcing an index can block the optimizer from choosing a better plan; use with caution |
| Thinking covering indexes fit every scenario | Too many columns make index maintenance costly, and large result sets may still fall back to full table scans |
| Thinking cursor pagination solves everything | Cursor pagination does not support page jumping and can only page in order along specific fields |

## Summary

The root cause of deep pagination is that when the `LIMIT` offset is too large, MySQL must scan and discard a huge number of rows before reaching the target slice, and the optimizer may abandon indexes in favor of a full table scan. Even when an index is used, massive table lookups can still severely degrade query performance.

This article introduced four common deep pagination optimization solutions, compared below:

| Optimization Approach | Core Idea | Applicable Scenarios | Limitations |
| ------------ | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| **Range Query** | Record the last ID of the previous page and fetch the next page via `WHERE id > last_id LIMIT n` | Sorted by ID, cursor-style paging allowed | No page jumping; non-ID sorting needs a composite cursor |
| **Subquery** | Fetch the starting primary key via a subquery, then filter by primary key | Need traditional `OFFSET` pagination | Subqueries may create temporary tables; depends on sort-field index |
| **Deferred Join** | Use `INNER JOIN` to shift pagination onto the primary key index and reduce table lookups | Large-dataset pagination needing traditional paging | Slightly more complex SQL |
| **Covering Index** | Create a composite index containing all queried columns to avoid table lookups | Fixed query columns where an appropriate index can be built | High maintenance cost for many columns; large result sets may still trigger full table scans |

**Selection Guidelines**:

- **Prefer deferred joins**: For most scenarios that must preserve traditional `LIMIT offset, size` pagination, deferred joins strike the best balance of performance and maintainability.
- **Consider range queries (cursor pagination)**: When the business allows "Next Page" cursor navigation (such as social media feeds or infinite scrolling), range queries deliver the best and most stable performance.
- **Use covering indexes as a supplement**: When queried columns are fixed and few, combine a covering index with other methods for further gains.

**Precautions**:

- Regardless of the chosen approach, monitor actual execution plans (`EXPLAIN`) to confirm the optimizer uses indexes as intended.
- For ultra-deep pagination (such as million-row offsets), evaluate from a business perspective whether it truly needs to be supported—consider capping the maximum page depth or offloading to a search engine.

## References

- How to Solve MySQL Deep Pagination Problems - JianTianLuoDeXiaoNanHai: <https://juejin.cn/post/7012016858379321358>
- Database Deep Pagination Introduction and Optimization Solutions - JD Retail Tech: <https://mp.weixin.qq.com/s/ZEwGKvRCyvAgGlmeseAS7g>
- MySQL Deep Pagination Optimization - Dewu Tech: <https://juejin.cn/post/6985478936683610149>
