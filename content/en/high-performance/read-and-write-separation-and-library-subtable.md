---
title: "Read/Write Splitting and Database Sharding Explained"
description: "An in-depth guide to database Read/Write Splitting and Database Sharding (sharding databases and tables), covering primary-replica replication mechanisms, Read/Write Splitting implementations (proxy vs. library), vertical vs. horizontal database and table sharding, sharding key selection, order-table sharding, and common challenges such as distributed transactions, distributed IDs, and cross-shard JOINs."
category: High Performance
head:
  - - meta
    - name: keywords
      content: Read/Write Splitting,Database Sharding,Primary-Replica Replication,Horizontal Table Sharding,Vertical Database Sharding,ShardingSphere,MyCat,Distributed ID,Cross-Shard Query,Sharding Key,Read Amplification,Order Table Sharding
lang: en
sourceRef: zh-ref/high-performance/read-and-write-separation-and-library-subtable.md
---

## Read/Write Splitting

### What Is Read/Write Splitting?

**Read/Write Splitting separates database read operations from write operations onto different database nodes.** Write requests still go to the primary database, while read requests are distributed across one or more read-only replicas; therefore, it primarily improves the database's read scalability. Write throughput only benefits indirectly when the primary database was previously bogged down by heavy read traffic and offloading those reads frees up capacity.

I drew a simple diagram to help readers who are less familiar with Read/Write Splitting understand the architecture:

![Read/Write Splitting Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/read-and-write-separation-and-library-subtable/read-and-write-separation-76ca368e.png)

In general, we adopt a single-primary, multi-replica topology—one primary database handles writes, and the remaining replica databases handle reads. Data is synchronized from the primary to the replicas to keep replica data accurate. This architecture is relatively simple to implement and aligns well with systems that have far more reads than writes.

### How Do You Implement Read/Write Splitting?

Regardless of the specific Read/Write Splitting implementation chosen, setting up Read/Write Splitting generally involves the following steps:

1. Deploy multiple database instances, designate one as the primary database, and set up one or more others as replica databases.
2. Establish replication between the primary and replicas—this process is commonly known as **primary-replica replication** (or master-slave replication). Note that MySQL replication is asynchronous by default, so replicas typically lag slightly behind the primary.
3. Route write requests to the primary database and read requests to the replica databases.

When implemented in actual projects, there are two common approaches:

**1. Proxy-Based Approach**

![Implementing Read/Write Splitting via a Proxy](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/read-and-write-separation-and-library-subtable/read-and-write-separation-proxy-039454b6.png)

We can place a proxy layer between the application and the databases. All data requests from the application go through the proxy layer, which splits read and write requests and routes them to the corresponding databases.

Middleware providing this capability includes **MySQL Router** (official, replacing MySQL Proxy), **ProxySQL**, **MaxScale**, **MyCat**, and others. **Atlas** is an earlier solution based on MySQL Proxy; when choosing tools for a new project, pay close attention to maintenance status, compatibility with newer MySQL versions, and community activity.

One extra note on MySQL Router: starting with 8.2, MySQL Router supports transparent Read/Write Splitting, a capability retained in current documentation. It automatically routes read traffic to read-only instances and write traffic to writable instances without requiring the application to classify SQL statement types itself. For details, refer to the official blog post [MySQL 8.2 – transparent read/write splitting](https://blogs.oracle.com/mysql/post/mysql-82-transparent-readwrite-splitting) and the official documentation [Read/Write Splitting](https://dev.mysql.com/doc/mysql-router/9.7/en/router-read-write-splitting.html).

However, transparent Read/Write Splitting does not mean every SQL statement can be blindly handed to the Router. Statements like `FOR UPDATE`, `LOCK IN SHARE MODE`, and `GET_LOCK()` must go to a writable instance; some functions or statements that look read-only may actually produce write side effects and fail on read-only instances. Before deploying in production, verify your application SQL against the official list of supported statements.

**2. Library/Component-Based Approach**

In this approach, we introduce a client-side library into the application to handle read/write request routing.

For projects on the Java tech stack, **ShardingSphere-JDBC** is a common choice—you simply add the JAR dependency to use it, and its operational overhead is lower than maintaining a standalone proxy.

You can find the [ShardingSphere-JDBC Read/Write Splitting Configuration](https://shardingsphere.apache.org/document/current/cn/features/readwrite-splitting/) in the official ShardingSphere documentation.

### How Does Primary-Replica Replication Work?

MySQL's binlog (binary log) records all data changes in a MySQL database (every DDL and DML statement executed). Consequently, using the primary's binlog allows us to synchronize data from the primary database to replica databases.

Below, for clarity and continuity with legacy terminology, we explain the traditional terms alongside modern MySQL naming. Starting from MySQL 8.0, official MySQL terminology has gradually replaced `master/slave` with `Source/Replica`: aliases such as `START REPLICA` were recommended starting in 8.0.22, new commands such as `CHANGE REPLICATION SOURCE TO` were recommended starting in 8.0.23, and MySQL 8.4 removed legacy SQL statements like `START SLAVE` and `CHANGE MASTER TO`. New scripts and monitoring metrics should use the updated naming wherever possible, such as `SHOW REPLICA STATUS`, `replica_parallel_workers`, and `rpl_semi_sync_source_wait_point`.

The more concrete, step-by-step replication process works as follows (image from [*MySQL Master-Slave Replication on the Same Machine*](https://www.toptal.com/mysql/mysql-master-slave-replication-tutorial)):

![MySQL Primary-Replica Replication](/media/jg/ext/oss.javaguide.cn/java-guide-blog/78816271d3ab52424bfd5ad3086c1a0f-7d39cd0a.png)

1. The primary database writes data changes to its binlog.
2. The replica connects to the primary and requests update events from the binlog.
3. The primary spawns a binlog dump thread to send the binlog contents to the replica.
4. The replica's I/O receiver thread receives the update events and writes them to the relay log.
5. The replica's applier thread reads the relay log and applies those events locally. Under statement-based logging, this can be thought of as replaying SQL statements; under row-based logging, it primarily applies row-change events.

Whenever you see `binlog`, think of primary-replica replication. Beyond replication, binlog also helps with data recovery.

Expanding further:

You may have used **Canal**, an open-source tool from Alibaba. It helps synchronize data between MySQL and other data sources such as Elasticsearch or another MySQL database. Clearly, its underlying mechanism also relies on binlog—Canal simulates a MySQL replica, parses the binlog, and syncs data changes to target data sources.

Similarly, the widely used distributed cache Redis also implements Read/Write Splitting via primary-replica replication.

To summarize briefly:

**MySQL primary-replica replication relies on binlog. Likewise, tools that synchronize MySQL data to other data sources (such as Canal) typically rely on binlog under the hood.**

### How Do You Avoid Reading Stale Data from Replicas?

While Read/Write Splitting boosts database read concurrency, it introduces a challenge: replication lag between the primary and replicas. After writing to the primary, propagating data to replicas takes time, creating a brief inconsistency window known as **replication lag** (primary-replica synchronization delay).

Applications generally cannot eliminate replication lag itself; they can only prevent strongly consistent read requests from being routed to a lagging replica. If your business scenario cannot tolerate reading stale data, consider the following approaches.

Read/Write Splitting also requires careful attention to transaction and request-chain boundaries. Within the same business transaction, if a write occurs followed by a read, subsequent reads should normally remain on the primary—never let a proxy or middleware route those reads to a replica, or you will encounter the "cannot read what you just wrote" issue. For read-your-writes scenarios such as login state, payment status, or viewing order details right after order creation, route reads to the primary briefly based on user session, request chain, or business flag.

#### Force Read Requests to Route to the Primary Database

For the small subset of critical flows requiring strong consistency (such as checking account balance immediately after payment), you can use a Hint to force reads onto the primary:

```java
try (HintManager hintManager = HintManager.getInstance()) {
    hintManager.setWriteRouteOnly();
    // Continue JDBC operations
}
```

> ShardingSphere 5.x uses `setWriteRouteOnly()`, whereas older 4.x versions used `setMasterRouteOnly()`. Adjust example code according to your version.

> **Warning**: Never use this approach broadly! The whole purpose of Read/Write Splitting is to offload read pressure from the primary. If large volumes of read requests fall back to the primary due to lag, high-concurrency events like flash sales and promotions can easily overwhelm the primary. A sounder trade-off is: route only critical strong-consistency paths to the primary, while letting non-core paths tolerate eventual consistency at the business level (e.g., displaying "data syncing").

With this approach, only reads that strictly require the freshest data are sent to the primary database.

#### Delayed Reads

Another idea some developers consider is: since replication lag exists, simply wait before reading—for example, if lag is 0.5s, read the data after 1s. While simple in concept, this is unreliable.

However, designing the user flow thoughtfully works much better: for data-sensitive flows, avoid triggering an immediate read right after a write completes. For example, after a payment succeeds, redirect to a "Payment Successful" page first, and only load the updated account details when the user clicks "Back to Account."

#### Wait for a Replica to Catch Up to a Specific Position

If GTID is enabled, you can capture the GTID of the committed transaction after a successful write, then call `WAIT_FOR_EXECUTED_GTID_SET(gtid_set, timeout)` on the replica to wait until the replica applies up to that position before reading. Similarly, `SOURCE_POS_WAIT()` waits for a replica to read and apply up to a specified binlog position.

This enables "waiting for a specific replica to catch up before reading," but increases read latency and implementation complexity, making it unsuitable for all high-frequency requests. For high-concurrency core paths, the more common practice remains short-lived primary reads after a write or session/user-scoped read-your-writes routing.

#### Summary

We introduced three ways to avoid reading stale data from replicas. In practice, delayed reads cannot completely eliminate stale reads—they merely reduce the probability—and are rarely used as a primary solution in real projects.

Overall, to prevent strongly consistent reads from returning stale data, you generally must route reads requiring immediate freshness directly to the primary database. If most scenarios in your application do not demand strict real-time accuracy, allow non-core paths to accept eventual consistency.

Replicas are not "free" read capacity either. Heavy analytical reports, full table scans, deep pagination, and slow SQL hitting replicas compete with replication applier execution and worsen replication lag in return. Even after implementing Read/Write Splitting, you must still govern slow SQL, indexes, connection pools, and reporting traffic.

### When Does Replication Lag Occur? How Do You Minimize It?

We touched on replication lag and ways to mitigate reading stale data above; now let's analyze in detail why replication lag occurs and how to reduce it as much as possible.

To understand when replication lag occurs, first understand what it is.

MySQL replication lag happens when data on a replica falls behind data on the primary, typically caused by one of two reasons:

1. The replica's I/O thread cannot receive binlog events as fast as the primary writes them, causing the replica's relay log to lag behind the primary's binlog.
2. The replica's applier thread cannot execute relay log events as fast as the replica's I/O receiver thread fetches them, causing the replica's data to lag behind its own relay log.

Three key timestamps define primary-replica synchronization:

1. `T1`: The moment the primary completes a transaction and writes it to the binlog.
2. `T2`: The moment the replica's I/O receiver thread receives the binlog event and writes it to the relay log.
3. `T3`: The moment the replica's applier thread reads the relay log and applies the event locally.

> **Note**: The description above is based on MySQL's default **asynchronous replication**. If semi-synchronous replication is enabled with `rpl_semi_sync_source_wait_point=AFTER_SYNC`, after writing and syncing the binlog, the primary waits for at least one replica to acknowledge receiving the transaction events before committing to the storage engine and returning to the client. This improves data safety during failover, but does not mean the replica has already applied the events.

Combining this with the replication mechanics discussed above:

- `T2 - T1` reflects the performance of the replica's I/O receiver thread and network transmission efficiency; the smaller this delta, the faster the network and I/O receiver.
- `T3 - T2` reflects the execution speed of the replica's applier thread; the smaller this delta, the faster the replica applies updates.

So under what circumstances does replication lag occur? Here are several common causes:

1. **Replica hardware is weaker than the primary**: The replica receives binlog events, writes the relay log, and applies relay log events more slowly (meaning larger `T2 - T1` and `T3 - T2`), causing lag. Solution: provision replicas with specs equal to or higher than the primary, or tune replica performance (adjust parameters, expand buffer pool/cache, use SSDs, etc.).
2. **Replicas handle too many read requests**: Replicas must execute all writes from the primary while also serving read queries. Excessive read traffic consumes CPU, memory, and network resources on the replica, slowing down replication (again increasing `T2 - T1` and `T3 - T2`). Solution: introduce caching (recommended), scale out to one primary with multiple replicas to spread reads, or offload query workloads to specialized systems by streaming binlog into Hadoop, Elasticsearch, etc.
3. **Large transactions**: Transactions that run for a long time before committing are known as large transactions. Because they take long to execute—and often consume even more time and resources on replicas than on the primary—they easily trigger replication lag. Solution: avoid massive single-transaction data mutations and break them into smaller batches. Similarly, long-running slow SQL queries should be optimized in production.
4. **Too many replicas**: The primary must replicate binlog events to every replica. Having too many replicas increases the primary's synchronization overhead and latency (increasing `T2 - T1` due to primary-side broadcast load). Solution: reduce the number of direct replicas, or organize replicas hierarchically (cascading replication) so upper-tier replicas forward binlogs to lower-tier replicas, offloading the primary.
5. **Network latency**: Slow network links, packet loss, or jitter between the primary and replicas degrades binlog transmission efficiency and causes lag. Solution: improve the network infrastructure (higher bandwidth, lower latency, greater stability).
6. **Single-threaded replication**: In MySQL 5.5 and earlier, replication was strictly single-threaded. To improve replication throughput, MySQL 5.6 introduced **multi-threaded replication**, though only parallelized per schema/database. MySQL 5.7 improved this further with group-commit-based parallel replication. From MySQL 8.0.22 onward, you can configure the new parameters `replica_parallel_workers > 0` to enable multi-threaded appliers together with policies like `replica_parallel_type=LOGICAL_CLOCK` to boost parallel replay capacity.
7. **Replication mode**: MySQL's default asynchronous replication inevitably incurs lag. Fully synchronous replication eliminates lag but severely hurts write performance. Semi-synchronous replication is a compromise; compared to async replication, semi-sync primarily solves data durability/safety rather than completely eliminating read lag. It lets the primary wait until at least one replica receives transaction events before returning commit success, yet whether the replica has finished applying them still depends on applier progress—so semi-sync alone cannot guarantee "reading a replica immediately after writing returns the latest value." MySQL introduced **semi-sync replication** as a plugin in MySQL 5.5 and added **enhanced semi-sync (lossless semi-sync)** in MySQL 5.7.
8. And more...

## Database Sharding

Read/Write Splitting mainly addresses read concurrency—it does not solve database storage capacity limits. Think about this: **What if a single MySQL table grows too large?**

In other words, **how do we solve MySQL's storage and single-node capacity pressure?**

One answer is **Database Sharding** (splitting databases and tables).

Before deciding to adopt Database Sharding, verify the following questions first:

1. Have slow SQL, indexes, pagination, caching, and Read/Write Splitting already been optimized?
2. Are single-table row count, single-database storage, connection count, or write QPS genuinely approaching hardware limits?
3. Can core queries be covered by a stable sharding key?
4. Can the business absorb the added complexity of cross-shard queries, distributed transactions, and data migration?

Database Sharding is never the first step in database optimization—it is a capacity-scaling solution reserved for when conventional optimizations can no longer keep up.

### What Is Database Sharding (Splitting Databases)?

**Database splitting** distributes data from one database across multiple databases, and can be done either vertically or horizontally.

**Vertical database splitting** partitions a single database along business boundaries so different business domains use separate databases, spreading load across multiple database instances.

For example, separating user tables, order tables, and product tables from one database into a dedicated User DB, Order DB, and Product DB.

![Vertical Database Splitting](/media/jg/local/high-performance/images/read-and-write-separation-and-library-subtable/vertical-slicing-database-07c2a1.png)

**Horizontal database splitting** partitions the same table across multiple databases according to a rule, where each database can reside on a separate server—enabling horizontal scaling and breaking single-table storage and performance bottlenecks.

For example, if the order table grows too large, you horizontally split it into 2 order tables and place each table into two different databases.

![Horizontal Database Splitting](/media/jg/local/high-performance/images/read-and-write-separation-and-library-subtable/horizontal-slicing-database-008377.png)

In real-world projects, horizontal database splitting and horizontal table splitting usually go hand in hand: first split one logical table by rows into multiple physical tables, then distribute those physical tables across different database instances.

### What Is Table Sharding (Splitting Tables)?

**Table splitting** divides data within a single table, either vertically or horizontally.

**Vertical table splitting** splits columns of a wide table with many columns into multiple smaller tables.

For example, extracting infrequently accessed or large columns from a user info table into a separate extension table.

**Horizontal table splitting** splits rows of a table with huge row counts into multiple tables to solve performance degradation caused by oversized single tables.

For example, splitting a massive user table into multiple user tables so no single table becomes too large and degrades query performance.

Horizontal table splitting alone only reduces individual table size; to maximize performance, we typically distribute those split tables across different database instances—meaning horizontal table splitting and horizontal database splitting are almost always combined.

![Table Splitting](/media/jg/local/high-performance/images/read-and-write-separation-and-library-subtable/two-forms-of-sub-table-9b4cb5.png)

### When Do You Need Database Sharding?

Consider Database Sharding when you encounter the following scenarios:

- Single-table row count exceeds tens of millions of rows (exact thresholds depend on schema complexity, index count, hardware specs, etc.), and database reads/writes begin slowing down.
- Database storage footprint grows excessively large, making backups take too long.
- Application concurrency is too high (though other performance optimizations should always be tried before sharding).

However, the cost of Database Sharding is very high—avoid it unless truly necessary. Nor is there a hard rule that reaching 10 million rows mandates sharding; different tables have different column widths and index layouts, so the amount of data they can hold with acceptable performance varies and must be evaluated case by case.

If the bottleneck primarily stems from slow SQL, index design, or timestamp column types, perform standard MySQL tuning before considering Database Sharding:

- MySQL Execution Plan Analysis: [https://javaguide.cn/database/mysql/mysql-query-execution-plan.html](https://javaguide.cn/database/mysql/mysql-query-execution-plan.html)
- MySQL Indexes Explained: [https://javaguide.cn/database/mysql/mysql-index.html](https://javaguide.cn/database/mysql/mysql-index.html)
- Summary of MySQL Index Invalidation Scenarios: [https://javaguide.cn/database/mysql/mysql-index-invalidation.html](https://javaguide.cn/database/mysql/mysql-index-invalidation.html)
- Recommendations on Storing Time Types in MySQL: [https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html](https://javaguide.cn/database/mysql/some-thoughts-on-database-storage-time.html)

I also previously read a great article analyzing "[How Much Data Can a Height-3 B+ Tree in InnoDB Hold?](https://juejin.cn/post/7165689453124517896)"—worth a read if you are interested.

### What Are Common Sharding Algorithms?

Sharding algorithms determine which physical table a record belongs to once data is horizontally partitioned.

Common sharding algorithms include:

- **Hash Sharding**: Computes a hash over the specified sharding key and uses the hash value to determine the target table. Hash sharding fits random read/write workloads well, but is poorly suited for frequent range queries. It achieves relatively even data distribution across tables, though it is unfriendly to dynamic scaling (such as adding a new table or database).
- **Range Sharding**: Assigns records based on contiguous ranges (such as time intervals or ID ranges)—for instance, placing `id` `1–299999` in Table 1 and `300000–599999` in Table 2. Range sharding fits frequent range-query workloads with even distribution, but handles random writes poorly (since new writes cluster into the latest range, easily creating hotspots).
- **Consistent Hashing Sharding**: Organizes the hash space into a ring, maps both sharding keys and storage nodes (databases or tables) onto the ring, and assigns keys clockwise to nodes, mitigating the scaling limitations of naive modulo hashing. Consistent hashing fits KV stores and caching well; in relational Database Sharding it is rarely used in practice, because range queries, cross-shard transactions, and secondary indexes still require separate design.

Building on these basic algorithms, more sophisticated routing strategies can be derived for specific business needs:

- **Mapping-Table Routing**: Maintains a dedicated lookup table recording the mapping between sharding keys and data nodes. Flexible, but adds an extra metadata table to manage—the mapping table itself must account for caching, consistency, scaling, and high availability, or it can become a new bottleneck or single point of failure.
- **Geo/Region Routing**: Uses geographic location as a sharding key combined with range or mapping-table routing to store data in nearby regional data centers (often seen in NewSQL multi-active architectures).

### How Do You Choose a Sharding Key?

The **Sharding Key** is the pivotal column governing data distribution and query efficiency. Ideally, a sharding key should possess the following traits:

- **Commonality**: Covers the vast majority of query paths, minimizing how many shards a single query touches and reducing database load.
- **Cardinality / Dispersion**: Distributes data evenly across shards to avoid data skew and hotspots.
- **Stability**: Its value does not change, preventing costly cross-shard data migrations and consistency headaches.
- **Extensibility**: Supports scaling shards up or down smoothly without massive resharding overhead.

In practice, rarely can a single sharding key satisfy all four traits simultaneously, so trade-offs are required. Some systems embed a logical shard identifier inside the business ID—for example, reserving a `buyer_route` segment inside `order_id` so routing can be derived even when only `order_id` is provided. However, avoid directly taking the last few digits of a user ID as the route key: if user IDs come from Snowflake, auto-increment segments, or patterned generators, the lower bits may not be uniformly distributed—hash first before taking modulo.

Refer to the table below for sharding key choices in typical business domains:

| Business Scenario  | Candidate Sharding Keys      | Notes                                                                    |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------ |
| Order System       | User ID, Merchant ID, Order ID | Depends on primary query path; buyer queries and merchant queries may conflict |
| IM Messaging       | Conversation ID, User ID     | Carefully evaluate ordering within a conversation and hot group chats    |
| Multi-Tenant SaaS  | Tenant ID                    | Large tenants easily become hotspots and may need dedicated isolation    |
| Payment Ledger     | User ID, Transaction ID      | Strongly consistent lookups and reconciliation pipelines must be planned upfront |

When a business naturally has multiple high-frequency query paths, consider duplicating a query-oriented projection or offloading certain queries to search engines, wide tables, or reporting systems—rather than forcing one sharding key to satisfy every query pattern.

Do not size shard counts solely based on current data volume either. Too few physical shards lead to frequent resharding during growth; too many physical shards inflate connection counts, routing complexity, aggregation cost, and operational overhead. A common pattern is pre-allocating a relatively large number of logical shards—such as 512 or 1,024 buckets—and mapping multiple buckets onto a smaller number of physical databases/tables. When scaling out, migrate bucket mappings rather than changing the business modulo formula.

Let's walk through an order-system example.

The order table is a classic Database Sharding case because it naturally has multiple access paths:

- **User dimension**: Customers view their order list, order details, and after-sales records—typically filtering by `buyer_id + create_time/status`.
- **Order dimension**: Looking up order details by `order_id`, handling payment callbacks, or locating refund tickets.
- **Merchant dimension**: Merchants view order lists in the seller portal, filter by status, or export orders over recent periods.

Most order systems prioritize customer order lists rather than sharding purely by `order_id`. The trade-off comes down to query shape: order detail lookup is a point query, whereas customer order lists are high-frequency range queries. Sharding by `hash(order_id)` scatters one customer's orders across many shards, forcing pagination, sorting, and filtering to execute across multiple shards.

When sharding by `buyer_id`, routing can be calculated as follows:

```text
slot = hash(buyer_id) % (db_count * table_count)
db_index = slot / table_count
// Note: divide by the number of tables per database, not by the number of databases
table_index = slot % table_count
```

A common mistake here is calculating `db_index`: `slot` must first be divided by the number of tables per database to get the database index, and then taken modulo the number of tables per database to get the table index.

Sharding solely by `buyer_id` is still not enough. To look up by `order_id`, there are two common options: maintain an `order_id -> buyer_route` index/mapping table, or embed `buyer_route` at fixed bit positions inside `order_id`. The former costs an extra query and storage table, while the latter requires designing the order ID generation format upfront.

The merchant dimension also needs separate handling. In B2C scenarios, merchants and buyers have a many-to-many relationship, so embedding the buyer route into `order_id` cannot solve merchant queries. If merchant-portal queries are low-frequency, you can constrain the time range and offload them to Elasticsearch, ClickHouse, or a wide table; if they sit on a high-frequency critical path, maintain a merchant order index table sharded by `seller_id` or replicate a merchant-oriented read model.

The master order table and order line-item table should share the exact same routing rule. For example, sharding both `t_order` and `t_order_item` by `buyer_route` ensures order creation and order detail queries hit the same shard. In ShardingSphere, you can configure a **binding table** for this, but it has strict prerequisites: the grouped tables must use identical sharding rules, AND the SQL join condition must include the sharding key. Configuring a binding table without including the sharding key in the SQL query can still trigger cross-shard routing.

### What Problems Does Database Sharding Introduce?

Remember: every technical decision you make at a company must be evaluated not only on whether it meets functional requirements and fits the business scenario, but also on the **costs** it brings.

Introducing Database Sharding brings the following challenges:

- **JOIN operations**: Distinguish between single-database JOINs and cross-shard JOINs. Within a single database with proper indexes and execution plans, JOINs are a fundamental relational database capability and should not be dismissed outright. The real difficulty after sharding is **cross-shard JOINs**: data resides across multiple databases and tables, requiring middleware to broadcast, route, merge, or even perform Cartesian combinations—driving up latency and complexity. Where cross-shard JOINs would be needed, execute multiple targeted queries and assemble the data at the application layer, while accounting for consistency across those queries.
- **Transaction issues**: When tables from one database are split across multiple database instances, a single operation spanning multiple databases can no longer rely on built-in local ACID transactions—requiring **distributed transactions**. For common distributed transaction solutions, see: <https://javaguide.cn/distributed-system/distributed-transaction.html>.
- **Distributed IDs**: Once databases are sharded across different servers, database auto-increment primary keys can no longer guarantee global uniqueness. How do we generate globally unique primary keys across shards? By introducing **Distributed IDs**. For a detailed guide and implementation summary, see: [Distributed ID Introduction & Implementation Summary](https://javaguide.cn/distributed-system/distributed-id.html).
- **Global unique constraints**: A single-database unique index only enforces uniqueness within one shard. For fields like phone numbers, usernames, or merchant order numbers that are not the sharding key, the database cannot directly enforce global uniqueness. Common solutions include maintaining a global unique index table, pre-reserving keys via a business registry service, or rethinking the sharding key and constraint design.
- **Non-sharding-key queries**: If a query lacks the sharding key in its `WHERE` clause, middleware cannot tell which shard to visit and generally broadcasts the SQL across all shards before merging results. This may be tolerable with a handful of shards, but as shard counts rise, read amplification degrades core paths. Typical solutions include adding routing/index tables, maintaining redundant projections, or offloading back-office searches to search engines, wide tables, or reporting systems.
- **Cross-shard aggregation and pagination**: Standard operations like `GROUP BY` and `ORDER BY` become much more complex after sharding because intermediate results must be aggregated and sorted across shards rather than inside a single engine. Cross-shard pagination is equally painful—for example, querying page 1,000 may require every shard to return up to `1000 * pageSize` candidate rows for the middleware to merge, sort, and slice, amplifying overhead linearly with shard count. Large-result back-office queries are far better served by search engines, wide tables, or offline analytics.
- **Dynamic scaling / Resharding difficulty**: Especially with naive modulo hashing, scaling from `hash(key) % 32` to `hash(key) % 64` shifts the placement of massive amounts of existing data. A safer pattern is fixing a pool of logical shards upfront (e.g., 1,024 buckets) and maintaining a `bucket -> physical DB/table` mapping; when scaling, migrate a subset of buckets rather than binding business IDs directly to physical table counts. Alternatives include consistent hashing or distributed databases with automatic rebalancing (such as TiDB).
- **Operational and schema-change overhead**: After sharding, DDL changes, index updates, backups, data corrections, incident debugging, and capacity planning must all span numerous databases and tables. Before rollout, prepare batch-DDL tooling, rollback procedures, and shard-level monitoring—otherwise ongoing maintenance costs become steep.
- And more...

Additionally, adopting Database Sharding usually requires DBA involvement and more database servers, all of which add to total cost.

### Are There Recommended Solutions for Database Sharding?

Apache ShardingSphere is a distributed database ecosystem providing sharding, elastic scaling, encryption, and governance capabilities on top of existing databases.

Originally donated by Dangdang to the Apache Software Foundation, ShardingSphere primarily offers two deployment/access modes: **ShardingSphere-JDBC** and **ShardingSphere-Proxy**.

ShardingSphere fits scenarios where teams want to "keep using traditional relational databases while gaining sharding, Read/Write Splitting, encryption, and governance capabilities through an intermediate layer." It does not modify the MySQL engine kernel; instead, it provides transparent routing, SQL rewriting, result merging, and governance at the JDBC or Proxy layer. Beyond Read/Write Splitting and Database Sharding, it also supports distributed transactions, database governance, shadow databases, data encryption, and data masking.

Compared to building a routing layer completely in-house, ShardingSphere has three main advantages: ShardingSphere-JDBC stays close to native JDBC call paths without an extra proxy network hop; offering both JDBC and Proxy modes covers both Java applications and polyglot systems; and sharding, Read/Write Splitting, encryption, shadow DBs, and governance share a unified rule configuration framework, lowering future expansion cost.

The features provided by ShardingSphere are shown below:

![Features Provided by ShardingSphere](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/shardingsphere-features-5405b83a.png)

When choosing an access mode in practice, consider what fits your team best:

- **ShardingSphere-JDBC**: Embedded as a JAR library, ideal for Java applications—avoids an extra network proxy hop, though applications must manage the dependency and configuration.
- **ShardingSphere-Proxy**: Deployed as a standalone proxy service accessed via MySQL/PostgreSQL protocols—ideal for polyglot architectures or teams wanting sharding rules centralized in a proxy layer, at the cost of maintaining an extra proxy tier.

That said, one important note: **many companies today also opt for distributed relational databases like TiDB.** Taking TiDB as an example, underlying data is split by key range into Regions; when a Region exceeds a threshold, it splits automatically and is scheduled across different TiKV nodes by the cluster. This removes much of the manual routing, scaling, and migration burden of traditional sharding, though teams still need to evaluate SQL compatibility, migration cost, operational expertise, and ecosystem fit.

Automatic Region splitting does not mean the application can ignore hotspots either. Sequential writes on auto-increment primary keys, monotonically increasing timestamps, hot large tenants, or initial writes hitting a single Region can still create hotspots—production workloads still require hotspot analysis based on write patterns.

### How Do You Migrate Data During Database Sharding?

Whether implementing Database Sharding, splitting databases by service, or switching database engines, existing data must be migrated to the new storage layout. Your migration strategy depends primarily on how long a write downtime the business can tolerate and how much synchronization complexity the team can handle.

| Approach                                                      | Applicable Conditions                                              | Main Trade-offs / Costs                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Stop-writes full migration                                    | Small data volume; business allows a long maintenance window       | Downtime covers export, import, and verification; duration must be benchmarked in advance               |
| Full backfill + CDC incremental sync + brief stop-writes cutover | Large data volume; brief write pause at cutover is acceptable      | Must seamlessly align full snapshot with CDC stream, drain in-flight writes, and confirm lag hits zero  |
| Application-layer dual writes                                 | Cannot accept centralized write pause; able to modify all write paths | Must handle partial failures, out-of-order updates, retries, compensation, and concurrent writes at cutover |

**Application-level dual writes do not automatically provide atomicity across two databases.** Even if the main API writes to both databases, scheduled jobs, message consumers, and manual scripts can easily miss dual-write logic. Any dual-write plan must designate which database is the authoritative source of truth and define recovery procedures when the secondary write fails—simply adding two database write calls is never enough to call a migration complete.

#### How Do Full Backfill and Incremental Sync Connect?

Let's walk through "Full Backfill + CDC + Brief Stop-Writes Cutover." It allows most data transfer to happen while the system stays online, limiting downtime to a controlled cutover window:

1. **Inventory and prepare the target databases**: Confirm all tables to migrate, sharding rules, indexes, unique constraints, character sets, auto-increment IDs, and every read/write entry point. If schemas are transformed, verify CDC mapping rules and DDL handling.
2. **Establish a consistent full-snapshot and log starting point**: Use a migration tool that atomically captures a consistent snapshot together with the exact binlog position, and ensure required binlogs are not purged prematurely. Never import all historical data first and only subscribe to incremental changes from "the current position" afterward—changes made during the import would be lost.
3. **Backfill in batches while catching up on incremental changes**: Throttle source read queries and target write pressure, and checkpoint progress for resumability. Follow the tool's snapshot + CDC merge semantics for updates and deletes so older snapshot rows never overwrite newer incremental events.
4. **Verify data and read behavior**: Compare data in chunks and perform shadow reads on critical queries (still returning old-DB results to users while comparing new-DB results asynchronously in the background). Next, gradually canary read-only requests that tolerate slight staleness; paths requiring read-your-writes must continue reading from the authoritative write DB or wait for replication sync positions.
5. **Disable business writes to the old DB and drain in-flight transactions**: Cover APIs, cron jobs, message consumers, and operational scripts; confirm all old transactions have either committed or rolled back, then record the final log position. Write blocking should use explicit traffic gating or DB write locks—never simulate a write freeze by pointing writes at a read-only replica to trigger errors.
6. **Wait for the target DB to apply up to the final position and perform final verification**: Confirm the target DB has committed every change up to that final checkpoint, with zero sync errors, pending lag, or skipped events. Once verified, stop the old-to-new migration task so it cannot overwrite subsequent production writes on the new DB.
7. **Switch read/write routing and resume writes**: Direct all production writes within the migration scope to the new DB, verify no stale instances or lingering connections still write to the old DB, and monitor error rates, query latency, connection counts, and shard hotspots. Keep a rehearsed rollback plan ready.

Here, "catching up" must be judged by **what the target DB has actually applied**, not merely how many logs the collector has pulled. For native MySQL replication, `Seconds_Behind_Source = 0` does not necessarily mean the replica is completely caught up—for example, it can report `0` even while the receiver thread lags behind; see [MySQL Replication Status Documentation](https://dev.mysql.com/doc/refman/8.4/en/show-replica-status.html). With CDC tools, you must likewise inspect actual apply checkpoints and error states.

If building custom synchronization, event replay must be idempotent and either preserve per-record event ordering or reject stale events using comparable business version numbers. A binlog position tracks progress within a specific log stream, and GTIDs identify executed transactions—never treat GTIDs from different sources as globally monotonically increasing row versions. Delete events must also carry sufficient ordering or version metadata so retried older inserts cannot resurrect deleted rows.

#### How Do You Perform Meaningful Data Verification?

Comparing row counts alone is insufficient: both sides can have identical row counts while differing in amounts, statuses, relationships, or deletions. Partition tables into chunks by primary key range, compare row counts and checksums first, then drill down to mismatched rows, complemented by business totals, status distributions, and critical query cross-checks.

Verification must also define a clear point-in-time reference. While the source receives live writes and the target catches up asynchronously, running two uncoordinated queries can misreport normal replication lag as data corruption. Run iterative pre-checks during migration, and execute final validation after stopping writes and completing incremental catch-up. For huge tables that cannot undergo a full scan inside the cutover window, validate a consistent snapshot strategy upfront or track and verify the set of primary keys modified after pre-validation rather than skipping checks ad hoc.

`update_time` helps narrow down discrepancies, but checking only "rows updated in the last few seconds" misses hard deletes, writes that bypass timestamp updates, and historical backfills. Verification tools also have prerequisites—for instance, [sync-diff-inspector](https://docs.pingcap.com/tidb/stable/sync-diff-inspector-overview/) supports chunked comparison across MySQL-compatible databases, provided table mappings, column types, and consistency conditions are verified; always review tool-generated repair SQL before executing it.

#### Why Isn't Simply Keeping the Old Database Enough for Rollback?

**Once the new database accepts live business writes, the old database immediately falls behind.** Blindly flipping traffic back to the old database causes post-cutover orders, payment state updates, and other mutations to disappear—or even get overwritten by new traffic.

- **Failure before resuming writes on the new DB**: The old DB remains the intact authoritative source of truth; once you confirm the new DB accepted no business writes, you can safely restore the old routing.
- **Failure after resuming writes on the new DB**: You must first halt writes on the new DB, backfill newly created mutations back to the old DB via pre-built reverse synchronization or change replay, confirm completion and verify consistency, and only then cut back over. Reverse synchronization must also validate that schema/field transformations are reversible and cannot create infinite sync loops.

If reverse synchronization has not been built and rehearsed, treat "resuming writes on the new database" as the point of no return for instant rollback: afterward, recovery means either fixing forward on the new DB or backfilling during a maintenance window before migrating back—never promise effortless, zero-loss rollback at any moment.

Estimate the required stop-writes window based on data volume, incremental backlog, and final verification time, then run full cutover rehearsals to confirm it meets business SLAs.

## Summary

- Read/Write Splitting distributes database read and write operations across separate nodes; its primary benefit is scaling read capacity and reducing read load on the primary database.
- Read/Write Splitting builds on primary-replica replication, and MySQL primary-replica replication relies on binlog.
- **Database splitting** spreads data from one database across multiple databases. **Table splitting** divides a single table either vertically (by columns) or horizontally (by rows).
- Adopting Database Sharding requires systematically solving distributed transactions, distributed IDs, cross-shard JOINs, non-sharding-key queries, cross-shard aggregations, and data migration.
- For domains like order tables, never design solely around `order_id` point lookups—account for customer order lists, merchant-portal queries, payment callbacks, and operations search paths as well.
- If manual Database Sharding is required, evaluate ShardingSphere first; if the team can adopt a distributed relational database, TiDB is also worth evaluating, provided migration and operational costs are carefully budgeted upfront.
