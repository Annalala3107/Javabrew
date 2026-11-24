---
title: "Distributed ID Generation Solutions Explained: UUID, Snowflake, Segment Mode, Leaf, and Tinyid Compared"
category: Distributed Systems
description: "Detailed guide to distributed ID generation solutions, systematically comparing the principles, pros and cons, and use cases of UUID, database auto-increment, database segment mode, Redis, MongoDB ObjectId, Snowflake, Leaf, Tinyid, UidGenerator, and IdGenerator."
tag:
  - Distributed ID
head:
  - - meta
    - name: keywords
      content: Distributed ID,Distributed ID Generation,Snowflake,UUID,UUID v7,Segment Mode,Leaf,Tinyid,UidGenerator,IdGenerator,Globally Unique ID,Distributed ID Interview Questions
lang: en
sourceRef: zh-ref/distributed-system/distributed-id.md
---

## Introduction to Distributed IDs

This article focuses on "how to choose an ID generation solution," covering UUID, database segments, Redis, Snowflake, Leaf, and Tinyid. After reading the comparison of solutions, if you want to explore how to design business-facing IDs such as order numbers, coupon codes, TraceIds, and short URLs, you can read [Distributed ID Design in Practice](./distributed-id-design.md).

### What Is an ID?

In daily development, we need to uniquely identify various types of data in a system using IDs—for example, a user ID uniquely identifies a user, a product ID uniquely identifies a product, and an order ID uniquely identifies an order.

In everyday life, we also use all kinds of IDs, such as a national ID number uniquely identifying a person or an address ID uniquely identifying an address.

Put simply, **an ID is the unique identifier of a piece of data**.

### What Is a Distributed ID?

Here, a distributed ID primarily refers to an ID used in distributed systems to uniquely identify data across nodes, databases, and services. It solves the problem of avoiding collisions when multiple nodes generate IDs concurrently.

Let us illustrate with a simple database and table sharding example.

Suppose a project at our company starts out on a single MySQL instance. Unexpectedly, a month after launch, as the user base grows rapidly, the data volume becomes too large for a single MySQL instance to sustain, so database and table sharding is required. Solutions like Apache ShardingSphere-JDBC can be considered, depending on SQL complexity, transaction requirements, operational capabilities, and team experience.

Once sharded across multiple databases, data is spread across different database nodes, and database auto-increment primary keys can no longer guarantee global uniqueness across nodes. **How do we generate globally unique primary keys across different data nodes?**

That is when we need to generate **distributed IDs**.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/id-after-the-sub-table-not-conflict-84f5894b.png)

### What Requirements Must a Distributed ID Satisfy?

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-requirements-5808dd52.png)

As an indispensable building block in distributed systems, distributed IDs are used in many places.

At a minimum, a basic distributed ID needs to satisfy the following requirements:

- **Global uniqueness**: Global uniqueness of the ID is the foremost requirement.
- **High performance**: ID generation must be fast and consume minimal local resources.
- **High availability**: The ID generator service must be highly available so it never becomes a single point of failure in the business path.
- **Ease of use**: Ready to use out of the box, convenient, and quick to integrate.

Beyond these fundamentals, a well-designed distributed ID should also offer:

- **Security**: The ID should not expose sensitive information.
- **Trend-increasing (roughly monotonic)**: If IDs are stored in a database, trend-increasing IDs are generally much friendlier to B+ tree index writes. Most database primary key scenarios need trend-increasing IDs rather than globally strictly increasing IDs; strict monotonicity makes sorting convenient, but typically introduces a centralized sequencer or strong coordination at a much higher cost.
- **Controlled business semantics**: Think carefully before embedding business semantics. Business semantics help with troubleshooting, but they can also leak business scale, region, timestamp, or channel details, and tightly couple ID rules to business logic. Many systems prefer opaque IDs and store business attributes in separate columns.
- **Independent deployment**: Having a dedicated ID generator service in a distributed system strictly responsible for generating distributed IDs decouples ID generation from business services. However, this also introduces extra network call overhead. Overall, if distributed IDs are needed across many scenarios, deploying an independent ID generator service is worthwhile.

Note also that different solutions derive their "uniqueness" from different sources:

- Database auto-increment and database segment mode rely on centralized storage and transactional allocation.
- Redis-based solutions rely on single-key atomic increment, persistence policies, and master-replica consistency.
- Snowflake relies on the non-colliding combination of timestamp, Worker ID, and sequence.
- UUID v4/v7 relies on random number quality and generator implementation strategy.
- For primary key scenarios that cannot tolerate duplicates, a database unique constraint should still serve as the final safety net upon persistence.

## Database-Based Generation Solutions (Stateful)

### Database Auto-Increment Primary Key

This approach is straightforward and intuitive: using a relational database's auto-increment primary key to generate unique IDs.

![Database auto-increment primary key](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/the-primary-key-of-the-database-increases-automa-58a463dd.png)

Taking MySQL as an example, we can do the following.

**1. Create a database table.**

```sql
CREATE TABLE `sequence_id` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stub` char(10) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stub` (`stub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

The `stub` column carries no business meaning; it exists purely as a placeholder to facilitate inserting or updating rows. Moreover, a unique index is created on `stub` to ensure uniqueness.

**2. Insert data using `REPLACE INTO`.**

```java
BEGIN;
REPLACE INTO sequence_id (stub) VALUES ('stub');
SELECT LAST_INSERT_ID();
COMMIT;
```

**⚠️ Production Pitfalls of `REPLACE INTO`**:

The semantics of `REPLACE INTO` are: if the new row does not conflict with `PRIMARY KEY` or `UNIQUE` indexes, insert it directly; if it conflicts, delete the old row first and then insert the new row. The affected row count may be the sum of deleted rows plus inserted rows.

- Every operation triggers index deletion and rebuilding, placing considerable pressure on the database.
- If there are triggers on the table, the `DELETE` operation will fire them unexpectedly.

**Alternative**: If you only want to advance the sequence table, use `INSERT ... ON DUPLICATE KEY UPDATE` or a single-row `UPDATE` to avoid the delete semantics of `REPLACE`. In production, segment mode is far more common: update `current_max_id = current_max_id + step` once and allocate IDs in memory.

The pros and cons of database auto-increment are clear:

- **Pros**: Simple to implement, IDs are strictly ordered and increasing, minimal storage footprint.
- **Cons**: Low concurrency throughput; database single point of failure (availability can be improved via primary-standby, MGR, or multi-DB sharded segments, though you must handle failover, transaction commits, duplicate issuance, and segment waste); lacks business semantics; security concerns (e.g., someone can infer daily order volume from the increment pattern of order IDs—a trade secret!); and every ID fetch hits the database (increasing database load and slowing down acquisition).

### Database Segment Mode

With database auto-increment primary keys, every single ID request hits the database, which clearly cannot sustain high ID demand.

If we fetch IDs in batches and store them in memory—reading directly from memory when needed—we drastically reduce database round-trips, lowering both latency and database load. This is what we call **database segment mode for distributed ID generation**.

Database segment mode is currently one of the mainstream ways to generate distributed IDs. For example, Didi's open-source [Tinyid](https://github.com/didi/tinyid/wiki/tinyid原理介绍) is built on this approach, though Tinyid further optimizes it with double-segment caching and multi-database support.

Taking MySQL as an example, we can implement it as follows.

**1. Create a database table.**

```sql
CREATE TABLE `sequence_id_generator` (
  `id` INT NOT NULL,
  `current_max_id` BIGINT NOT NULL COMMENT 'Current max ID',
  `step` INT NOT NULL COMMENT 'Segment length',
  `version` INT NOT NULL COMMENT 'Version number',
  `biz_type` INT NOT NULL COMMENT 'Business type',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_biz_type` (`biz_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

The `current_max_id` and `step` columns are used to fetch a batch of IDs. The fetched ID range is `(current_max_id, current_max_id + step]`, meaning it excludes the old value of `current_max_id` itself. For instance, when the old `current_max_id = 0` and `step = 100`, after a successful update, the allocatable ID range for this batch is `1~100`.

![Database segment mode](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/database-number-segment-mode-c2fbd568.png)

The `version` column is primarily used to resolve concurrency conflicts (optimistic locking). The full flow is as follows:

```sql
-- 1. Read the current values
SELECT current_max_id, step, version FROM sequence_id_generator WHERE biz_type = 101;
-- 2. CAS update (version serves as the optimistic lock version number)
UPDATE sequence_id_generator
SET current_max_id = current_max_id + step, version = version + 1
WHERE version = {currently read version} AND biz_type = 101;
-- 3. Check affected_rows: 1 means success, 0 means another thread updated first and a retry is needed
```

After executing `UPDATE ... WHERE version = ?`, you must check `affected_rows`. If it is 0, another instance has already claimed that segment, so you must re-read `current_max_id` and `version` and retry.

> **⚠️ High-Concurrency Retry Warning**: At the exact moment a segment is exhausted, multiple threads may compete to claim the next segment, causing CAS updates to fail. At the code level, you must implement a **bounded retry loop** (e.g., 3 retries) with exponential backoff to ensure request stability. If retries still fail, threads should block until the next segment finishes loading, or trigger alerts and enter circuit breaking/degradation. **Returning a so-called "degraded ID" is not recommended**, as it may compromise global uniqueness.

`biz_type` primarily identifies the business type.

**2. Insert an initial row.**

```sql
INSERT INTO `sequence_id_generator` (`id`, `current_max_id`, `step`, `version`, `biz_type`)
VALUES
 (1, 0, 100, 0, 101);
```

**3. Use `SELECT` to obtain a batch of unique IDs for the specified business.**

```sql
SELECT `current_max_id`, `step`, `version` FROM `sequence_id_generator` WHERE `biz_type` = 101
```

Result:

```plain
id current_max_id step version biz_type
1 0 100 0 101
```

**4. When the batch runs out, update and `SELECT` again.**

```sql
UPDATE sequence_id_generator SET current_max_id = 0 + 100, version = version + 1 WHERE version = 0 AND `biz_type` = 101
SELECT `current_max_id`, `step`, `version` FROM `sequence_id_generator` WHERE `biz_type` = 101
```

Result:

```plain
id current_max_id step version biz_type
1 100 100 1 101
```

Compared with database auto-increment primary keys, **database segment mode makes far fewer database calls and puts much less load on the database.**

Additionally, to eliminate single points of failure, you can improve availability via primary-replica setups or multi-database deployments. With a primary-replica setup, segment updates must go to the primary database, and you must ensure failovers never revert to an older `current_max_id`. With multi-database deployments, you must guarantee that each database's allocated segment ranges, step sizes, or business shards do not overlap.

Segment mode also introduces "ID gaps": once an instance acquires a segment, it caches it in memory; if the instance crashes or restarts, any unused portion of that segment is wasted. Wasting IDs does not compromise uniqueness, though it makes IDs non-contiguous; never attempt to reclaim allocated-but-unused segments just to achieve continuity, as doing so risks issuing duplicate IDs. In production, monitor segment consumption rates, load failure rates, and retry counts.

**Pros and cons of database segment mode:**

- **Pros**: Trend-increasing IDs, small storage footprint.
- **Cons**: Still has a database single point of failure (can be mitigated via primary-replica or multi-DB setups, though at higher complexity), IDs carry no business semantics, security concerns (e.g., daily order volumes can still be estimated from order ID growth trends—trade secrets!).

### NoSQL

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/nosql-distributed-id-7307828c.png)

In most cases, Redis is the preferred NoSQL choice. We can use Redis's `INCR` command to generate atomically increasing sequential IDs.

```bash
127.0.0.1:6379> set sequence_id_biz_type 1
OK
127.0.0.1:6379> incr sequence_id_biz_type
(integer) 2
127.0.0.1:6379> get sequence_id_biz_type
"2"
```

To improve availability and concurrency, we can use Redis Cluster, the official Redis clustering solution (introduced in Redis 3.0+).

Codis used to be a popular open-source Redis clustering solution, but the project has long been inactive. New projects should generally evaluate Redis Cluster, cloud provider Redis clusters, or managed Redis-compatible services first; Codis is better suited only for maintaining legacy systems, and its maintenance status should be assessed carefully before use.

Beyond high availability and concurrency, because Redis is in-memory, we need data persistence to prevent data loss after machine restarts or failures. Redis supports two persistence mechanisms: **snapshotting (RDB)** and **append-only file (AOF)**. Starting from Redis 4.0, **hybrid RDB + AOF persistence** is supported via `aof-use-rdb-preamble`—disabled by default in Redis 4.0 sample configs, and enabled by default in Redis 5.0+ sample configs. Exact defaults depend on your target Redis version, configuration file, and managed cloud service settings.

We will not dive deeply into Redis persistence here. If you are unfamiliar with it, check out [Redis Persistence Mechanisms Explained](https://javaguide.cn/database/redis/redis-persistence.html).

Although Redis `INCR` delivers excellent performance, Redis persistence only reduces data loss risk upon process restart—it cannot completely eliminate ID rollback. In particular, `appendfsync everysec`, RDB snapshots, asynchronous master-replica replication, and failovers can all lose the most recent `INCR` increments. Pay special attention to the following failure paths:

1. **ID rollback caused by persistence delay**

   - **Scenario**: Redis crashes after executing `INCR` but before RDB/AOF flushes to disk.
   - **Consequence**: After restart, the ID rolls back to the last persisted value, potentially producing duplicate IDs.

2. **Brief blocking caused by AOF rewriting**

   - **Scenario**: The AOF file grows too large and triggers a rewrite.
   - **Consequence**: The main process `fork`s a child process, which can cause brief latency jitter.

3. **Single-shard hotspot in Redis Cluster**

   - **Scenario**: A single counter key always maps to one shard in the cluster.
   - **Consequence**: Under high concurrency, that shard can become a bottleneck.

4. **Master-replica asynchronous replication failover**
   - **Scenario**: When the master fails and switches over to a replica, the replica's `INCR` value may lag behind the master.
   - **Consequence**: The ID on the new master may roll back to an older value.

**Recommended production configuration**:

```conf
# Reference configuration for Redis 7.0+
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes  # Hybrid persistence (RDB + AOF combined)
```

- **Redis 7.0+ optimization**: Multi-part AOF improves how base/incr files are organized and managed during AOF rewrites, though `fork`, disk I/O, and `fsync` policies can still cause jitter.
- **Applicability boundary**: Redis is well suited for serial numbers, short-lived counters, and scenarios where the business layer can enforce deduplication. If extreme uniqueness is required—such as core primary keys like financial order numbers or payment transaction IDs—you must combine business deduplication, persistence policies, master-replica consistency policies, and database unique constraints, or opt for database segment mode, Leaf, etc.

**Pros and cons of the Redis approach:**

- **Pros**: Strong performance, and IDs generated by a single key on a healthy single master are strictly increasing.
- **Cons**: Shares similar drawbacks with database auto-increment primary keys, plus risks of persistence lag, single-shard hotspots, and ID rollback during master-replica failover.

Besides Redis, MongoDB ObjectId is also frequently used as a distributed ID solution.

![MongoDB ObjectId Specification](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/mongodb9-objectId-distributed-id-c769ae0a.png)

A MongoDB ObjectId takes 12 bytes in total:

- 0–3: Unix timestamp in seconds (4 bytes)
- 4–8: Random value (5 bytes, generated once per client process to distinguish machines and processes)
- 9–11: Auto-incrementing counter (3 bytes, incremented per client process)

ObjectId is an approximately ordered unique identifier requiring no central coordination, typically adequate for document `_id` fields, but it is not a globally strictly monotonic sequence: it only has one-second timestamp granularity, so ObjectIds generated within the same second are not guaranteed to be strictly ordered; moreover, system clocks may differ across client machines.

**Pros and cons of the MongoDB approach:**

- **Pros**: Good performance, and generated IDs are approximately ordered by creation time.
- **Cons**: Not strictly monotonically increasing—when machine clocks differ, sort order may not reflect true creation order; additionally, IDs embed time information, exposing a predictable pattern.

## Algorithm-Based Generation Solutions (Stateless)

### UUID

UUID stands for Universally Unique Identifier, essentially a 128-bit identifier. Its standard string representation is typically 36 characters (including hyphens), or 32 hexadecimal characters without hyphens.

The JDK already provides a built-in method to generate UUIDs in one line of code.

```java
// Example output: cb4a9ede-fa5e-4585-b9bb-d60bce986eaa
UUID.randomUUID()
```

[RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) has superseded [RFC 4122](https://tools.ietf.org/html/rfc4122), respecifying UUIDs and adding v6, v7, and v8. Older references still mention RFC 4122, but newer documentation should primarily align with RFC 9562. Here is an example diagram of UUID structure under the specification:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/rfc-4122-uuid-14fbf6c0.png)

Let us focus on the Version field: different versions follow different generation rules.

The meanings of the 8 Version values (referring to [Wikipedia's overview of UUID](https://zh.wikipedia.org/wiki/通用唯一识别码)):

- **Version 1 (time-based and node ID)**: Generated from a timestamp (usually current time) and a node ID (usually the device's MAC address). When using a MAC address, global uniqueness can be guaranteed, but it introduces privacy leakage risks.
- **Version 2 (DCE Security: identifier, time, and node ID)**: Similar to Version 1, using time and node ID, while also embedding a local identifier (such as a user ID or group ID).
- **Version 3 (namespace and name-based using MD5 hash)**: Uses MD5 hashing to combine a namespace identifier (a UUID) and a name string. The same namespace and name always produce the same UUID (**deterministic generation**).
- **Version 4 (random-based)**: Generated using a pseudo-random number generator (PRNG) or cryptographically secure random number generator (CSPRNG). UUID v4 has 122 random bits, giving a value space of 2^122; by the birthday paradox, collision probability reaches ~50% only after generating roughly 2^61 UUIDs. In practice it can be treated as unique, though theoretically it remains a probabilistic guarantee.
- **Version 5 (namespace and name-based using SHA-1 hash)**: Similar to Version 3, but uses SHA-1 hashing instead of MD5.
- **Version 6 (reordered time-based, counter, and node ID)**: Improves on Version 1 by placing the timestamp in the Most Significant Bits (MSB), enabling direct chronological sorting.
- **Version 7 (Unix millisecond timestamp-based)**: The high bits store a 48-bit Unix millisecond timestamp, and the remaining bits (after version and variant bits) hold random bits, while also permitting sub-millisecond timestamps or counters to strengthen intra-millisecond monotonicity. For new systems that require time-ordering without legacy compatibility constraints, UUID v7 is generally recommended over v1/v6; however, legacy systems, protocol compatibility, and existing data formats must still be evaluated individually.
- **Version 8 (experimental / vendor-specific)**: Leaves **122 bits for custom implementation**, requiring only fixed version and variant bits. Suitable for embedding extra metadata or meeting special application constraints. **Uniqueness is guaranteed by the implementation and must not be assumed universally.**

Here is an example of a UUID v1 result:

![UUID v1 generation example](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/version1-uuid-f0406509.png)

In the JDK, `UUID.randomUUID()` generates Version 4 UUIDs by default.

```java
UUID uuid = UUID.randomUUID();
int version = uuid.version();// 4
```

There are also 4 different Variant values, each carrying a specific meaning. We will not cover them here since they rarely require attention in everyday engineering.

When needed, you can check Wikipedia's section on UUID Variants.

From the above, UUIDs can be considered unique in engineering practice given proper implementation and sufficient randomness. Uniqueness of v4 is fundamentally probabilistic; v1/v6 rely on node IDs and timestamps and carry privacy leakage risks; uniqueness of v7/v8 depends on the implementation strategy.

Even though UUID is practically globally unique, it is rarely used directly as a database primary key.

For example, using non-sequential UUIDs like UUID v4 as MySQL primary keys is a poor fit:

- Database primary keys should be as short as possible. A UUID is inherently 128 bits: stored as a string, it is usually 36 characters with hyphens or 32 hex characters; stored in binary, it can be compressed down to 16 bytes.
- Non-sequential UUIDs such as UUID v4 are unordered, and under the InnoDB storage engine, primary key randomness severely degrades database performance.

UUID v7 ([RFC 9562](https://www.rfc-editor.org/rfc/rfc9562)) is a standardized, trend-ordered alternative that requires no Worker ID allocation:

UUID v7 does not require assigning Worker IDs like Snowflake does, keeping integration cost low; however, it still depends on random number quality and generator implementation. For primary key scenarios that cannot tolerate duplicates, a database unique constraint remains essential.

| Feature | Snowflake | UUID v7 |
| --- | --- | --- |
| **Worker ID Management** | Requires centralized allocation (ZK/etcd) | No allocation needed; ready out of the box |
| **Clock Rollback Risk** | Requires dedicated handling | Allows out-of-order generation within a millisecond; requires generator-level monotonicity handling upon clock rollback |
| **B+ Tree Friendliness** | Trend-increasing | Trend-ordered |
| **Standardization** | Varies across implementations | RFC standard; cross-language compatible |
| **Structure** | 64-bit (customizable) | 128-bit (48-bit timestamp + random/counter fields) |

**Use cases**: Small-to-medium distributed systems that do not require Snowflake-level compactness/throughput and want to eliminate Worker ID operational overhead.

UUID v7 is much friendlier to B+ tree local inserts than UUID v4, yet it is still 128 bits—taking twice the space of a 64-bit Snowflake ID. In databases, prefer `BINARY(16)` or a native `uuid` type rather than a string primary key; high-write tables should still be benchmarked for page splits, index size, and buffer pool hit rates.

**UUID v8 (experimental use)**: If you need to embed additional information (such as business identifiers or cluster info) or have special application constraints, consider UUID v8. Note, however, that **uniqueness in v8 is guaranteed by the implementation and cannot be assumed compatible with other implementations**.

⚠️ **Note**: Database support is still rolling out. PostgreSQL 18 (released 2025-09-25) introduces a built-in `uuidv7()` function to generate time-ordered UUIDs. MySQL 8.0's `UUID()` generates time-and-node-based UUIDs commonly regarded as v1-style; `UUID_TO_BIN(uuid, 1)` can rearrange the time bits to improve index locality, but it is not a UUID v7 generator. UUID v7 generally needs to be generated in the application layer or via custom database functions.

Finally, let us briefly review the **pros and cons of UUID** (frequently asked in interviews!):

- **Pros**: Generally fast to generate, simple and easy to use.
- **Cons**: Large storage footprint, security/privacy issues (MAC-based algorithms can leak MAC addresses), most versions lack strict monotonicity, carry no business semantics; for high-uniqueness scenarios, you must still evaluate RNG quality, implementation strategy, and duplicate-handling mechanisms.

### Snowflake

Snowflake is an open-source distributed ID generation algorithm from Twitter. A Snowflake ID consists of 64 binary bits divided into several parts, each storing specific information:

![Snowflake structure](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/snowflake-distributed-id-schematic-diagram-27d812a5.png)

- **sign (1 bit)**: Sign bit (positive/negative indicator), always 0 so generated IDs are positive integers.
- **timestamp (41 bits)**: A 41-bit **relative timestamp** (milliseconds elapsed since a custom epoch), capable of covering 2^41 milliseconds (about 69 years). The epoch is usually set to the system launch date (such as 2020-01-01) rather than the Unix epoch.
- **datacenter id + worker id (10 bits)**: Typically, the first 5 bits represent the datacenter ID and the last 5 bits represent the worker/machine ID (adjustable per project needs), distinguishing nodes across clusters and datacenters.
- **sequence (12 bits)**: A 12-bit auto-incrementing sequence number. In the standard 12-bit sequence design, a single Worker can generate up to 4096 sequence numbers per millisecond; changing the sequence bit width or using modified algorithms alters this ceiling.

> **⚠️ High-Concurrency Warning (Standard Snowflake)**: Standard Snowflake allows at most 4096 sequence numbers per node per millisecond. If concurrent requests within a single millisecond exceed 4096, some implementations block and wait until the next millisecond, which can cause latency spikes during flash sales or major promotions. Some enhanced variants (such as Seata's improved Snowflake or IdGenerator) mitigate this ceiling by monotonically advancing the combined timestamp/sequence or "borrowing future time," at the cost of generated timestamps briefly running ahead of physical wall time. In production, evaluate peak QPS and use multi-instance sharding or adjust the algorithm to allocate more sequence bits if needed.

In real projects, we also frequently customize Snowflake—the most common modification being embedding business type bits into the generated Snowflake ID.

#### Snowflake Clock Rollback Problem and Solutions

**Root cause**: NTP synchronization, manual clock adjustments, or hardware clock drift can cause system time to move backward.

**Solution comparison**:

| Solution | Pros | Cons | Best Suited For |
| --- | --- | --- | --- |
| **Reject Service** | Simple to implement | Completely unavailable during clock rollback | Scenarios with relaxed availability requirements |
| **Wait to Catch Up** | Guarantees ID uniqueness | Blocks for a long time on large rollbacks, potentially impacting business | Scenarios with tiny clock rollbacks |
| **Backup Worker ID** | High availability | Complex to implement; must handle leases, split-brain, and stale instance recovery | Systems with a reliable registry/lease mechanism |

Using a backup Worker ID is an optional approach rather than a universal recommendation—it fits systems that already have reliable service registries or lease mechanisms. More common practices include waiting out minor rollbacks, rejecting ID issuance past a threshold, persisting the last timestamp, and guaranteeing unique Worker ID leases via a registry. For the lease, split-brain, and stale instance recovery concerns involved here, see [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md).

#### Snowflake Worker ID Allocation Challenge

In **containerized deployments (Kubernetes)**, allocating Snowflake Worker IDs becomes the biggest pain point:

**Problem scenario**:

- Pod IPs and names are dynamic and change upon restarts.
- Unlike physical servers, Pods cannot be pre-configured with fixed Worker IDs.
- Auto-scaling requires dynamic acquisition and release of Worker IDs.

**Mainstream solutions**:

| Solution | Implementation | Pros | Cons |
| --- | --- | --- | --- |
| **ZooKeeper Registration** | Create an ephemeral node in ZK on startup and use its sequence number as the Worker ID | Automatically reclaimed and released on crash | Depends on ZK; adds operational complexity |
| **Redis Registration** | Use `SETNX` + expiration time to claim a Worker ID | Lightweight; no extra component | Must handle Redis downtime scenarios |
| **Database Allocation** | Allocate from a database on startup and persist locally to a file | Simple and reliable | Depends on the database |
| **Dynamic Worker ID** | Hash Pod IP or UID to generate Worker ID | Requires no centralized component | Possible hash collisions |

**Recommendation**: In production, you can use Meituan Leaf (whose Snowflake mode relies on ZooKeeper to manage `workId`) or segment-mode solutions like Didi Tinyid to sidestep Worker ID allocation issues entirely.

Let us summarize the pros and cons of Snowflake:

- **Pros**: Fast generation speed, IDs are ordered and increasing, flexible (easy to adapt Snowflake, e.g., embedding business IDs).
- **Cons**: **Clock rollback risk** (requires additional handling as shown above); dependency on machine IDs is unfriendly to dynamic distributed environments (fixed machine IDs lack flexibility when machines auto-scale up and down).

If you want to use Snowflake, you generally do not need to reinvent the wheel. In production, evaluate mature implementations first—such as Leaf, Tinyid, IdGenerator, or cloud-managed ID services—weighing maintenance status, language ecosystem, clock rollback handling, Worker ID allocation strategy, and benchmark results.

To reverse-parse metadata from a Snowflake ID, extract bits according to your exact bit layout. For a standard 41-bit timestamp + 10-bit worker + 12-bit sequence layout, shifting right by 22 bits yields the relative timestamp (add your custom epoch to obtain creation time), and bitmasks extract the Worker ID and sequence. Whenever bit allocations or the epoch change, the parsing logic must be updated accordingly.

Moreover, Seata proposed an "improved Snowflake algorithm" that optimizes the original algorithm, solves clock rollback issues, and dramatically boosts QPS. For details and improvement principles, refer to these two articles:

- [Analysis of Seata's Distributed UUID Generator Based on an Improved Snowflake Algorithm](https://seata.io/zh-cn/blog/seata-analysis-UUID-generator.html)
- [I Saw an Improved Snowflake Algorithm in an Open-Source Project—Now It's Yours](https://www.cnblogs.com/thisiswhy/p/17611163.html)

## Comparison of Industrial-Grade Open-Source Distributed ID Frameworks

When evaluating frameworks like these, do not look only at feature lists; also examine production dimensions: whether the project is actively maintained, recent release/commit/issue activity, external dependencies (MySQL, Redis, ZooKeeper, etcd, etc.), clock rollback strategy, Worker ID allocation strategy, client-library vs. server-service mode, and P99/TP999 latency under load testing.

### UidGenerator (Baidu)

[UidGenerator](https://github.com/baidu/uid-generator) is an open-source unique ID generator from Baidu based on Snowflake.

However, UidGenerator modifies Snowflake's bit layout as follows:

![UidGenerator ID structure](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/uidgenerator-distributed-id-schematic-diagram-851d54b5.png)

- **sign (1 bit)**: Sign bit (positive/negative indicator), always 0 so generated IDs are positive.
- **delta seconds (28 bits)**: Increment in seconds relative to the epoch `"2016-05-20"`, supporting up to about 8.7 years.
- **worker id (22 bits)**: Machine ID, supporting up to ~4.2 million machine startups. The built-in implementation allocates Worker IDs from a database at startup; the default strategy is assign-once-and-discard, with optional reuse strategies available.
- **sequence (13 bits)**: Concurrency sequence per second; 13 bits support up to 8192 IDs per second.

As you can see, the layout differs from original Snowflake IDs, and all of these bit parameters can be customized.

Here is how UidGenerator describes itself in its official documentation:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/uidgenerator-introduction-official-documents-b6c7ed06.png)

The official UidGenerator repository has been inactive for a long time; new projects should not adopt it purely based on name recognition—evaluate its maintenance status, dependency security, and fork ecosystem first. To learn more, read [UidGenerator's Official Documentation](https://github.com/baidu/uid-generator/blob/master/README.zh_cn.md).

### Leaf (Meituan)

[Leaf](https://github.com/Meituan-Dianping/Leaf) is an open-source distributed ID solution from Meituan. The name Leaf comes from German philosopher and mathematician Leibniz's famous quote: "There are no two identical leaves in the world." It is quite a memorable name.

Leaf supports both **Segment Mode** and **Snowflake Mode** to generate distributed IDs. Furthermore, it supports double buffering and solves the clock rollback problem for Snowflake IDs. However, its clock rollback solution has a weak dependency on ZooKeeper (using ZooKeeper as a registry to manage `workId` by reading and creating child nodes under a designated path).

Leaf was originally created to unify and stabilize the diverse, unreliable ID generation approaches across Meituan's various business lines.

Leaf introduced a core optimization to traditional segment mode—**Double Buffer Optimization**:

> **Design principle**: Instead of requesting a new segment from the database only after the current segment is completely exhausted, once the current segment crosses a certain consumption threshold, an asynchronous thread pre-fetches and pre-loads the next segment from the database into memory. Refer to your target Leaf version's source code for exact thresholds and implementation details. Double buffering keeps TP999 latency smooth and minimizes latency jitter caused by database queries.

(Diagram sourced from Meituan's official blog post: [Leaf — Meituan-Dianping Distributed ID Generation System](https://tech.meituan.com/2017/04/21/mt-leaf.html))

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-id/leaf-principle-0fb5aa07.png)

According to Meituan's article and README benchmarks at the time, on a 4C8G VM using internal RPC calls, Leaf achieved nearly 50,000 QPS with a TP999 of roughly 1 ms. Treat these figures strictly as a reference; actual performance depends on the database, RPC framework, network, segment size, and deployment setup.

### Tinyid (Didi)

[Tinyid](https://github.com/didi/tinyid) is an open-source unique ID generator from Didi based on database segment mode.

We already covered how database segment mode works above. **What makes Tinyid stand out?**

To answer that, let us first look at a simple architecture based on database segment mode (diagram sourced from Tinyid's official wiki: [Tinyid Principles Explained](https://github.com/didi/tinyid/wiki/tinyid%E5%8E%9F%E7%90%86%E4%BB%8B%E7%BB%8D)):

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-id/tinyid-principle-c69a75d0.png)

In this architecture, applications request unique IDs from the ID generator service via HTTP, and a load-balancing router forwards each request to one of the `tinyid-server` instances.

What issues does this simple setup have? As noted in Tinyid's official wiki, there are two main problems:

- Acquiring IDs slows down when a new segment needs to be fetched.
- Ensuring high availability for the database is complex and resource-intensive.

In addition, HTTP calls introduce network overhead.

Tinyid's principle is straightforward, and its architecture looks like this:

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-id/tinyid-architecture-design-55d26481.png)

Compared with the basic database segment architecture, Tinyid introduces the following optimizations:

- **Double-segment caching**: To prevent slow ID acquisition when fetching a new segment, once the active segment is consumed past a threshold, Tinyid asynchronously loads the next segment so an available segment is always ready in memory.
- **Multi-database support**: Supports multiple databases to boost availability—provided that segment ranges, step sizes, or business shards across databases never overlap and failovers never re-issue previously allocated segments.
- **Dedicated `tinyid-client`**: Purely local in-memory allocation with zero HTTP overhead, significantly improving both performance and availability.

We will not repeat Tinyid's pros and cons here—combining database segment mode's trade-offs with Tinyid's architecture tells the full story.

### IdGenerator (Individual Author)

Like UidGenerator and Leaf, [IdGenerator](https://github.com/yitter/IdGenerator) is a unique ID generator based on Snowflake.

According to IdGenerator's official description, its main features include:

- Shorter generated unique IDs;
- Compatible with all Snowflake variants (segment mode or classic mode, enterprise or small-scale);
- Native support for C#/Java/Go/C/Rust/Python/Node.js/PHP (C extension)/SQL, etc., plus thread-safe dynamic library invocation (FFI);
- Resolves clock rollback issues and supports manual insertion of new IDs (when generating new IDs at historical timestamps is needed, reserved bits allow generating 5000 IDs per second);
- Zero dependency on external storage systems;
- Under default configuration, IDs remain collision-free for 71,000 years.

These claims depend on bit layout, base epoch, Worker ID, and sequence settings; before using it in production, calculate capacity limits and benchmark under your own configuration rather than assuming default marketing numbers apply universally.

An ID generated by IdGenerator has the following structure:

![IdGenerator ID structure](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/idgenerator-distributed-id-schematic-diagram-69fb2987.png)

- **timestamp (variable bit width)**: Time delta in milliseconds between the current system time and `BaseTime` (epoch/origin time, defaulting to 2020). Starts at 5 bits and grows over time as the system runs. If the default epoch feels too old, you can reconfigure it—just make sure never to change it again afterward.
- **worker id (default 6 bits)**: Machine ID, the most critical parameter, uniquely identifying different machines or services; its upper bound is constrained by `WorkerIdBitLength` (default 6). If multiple independent services run on the same server, assign a distinct `WorkerId` to each service.
- **sequence (default 6 bits)**: Per-millisecond sequence count, constrained by `SeqBitLength` (default 6). Increasing `SeqBitLength` boosts throughput at the cost of producing longer IDs.

Java usage examples: <https://github.com/yitter/idgenerator/tree/master/Java>.

## Summary

In this article, we have summarized the most common distributed ID generation solutions.

Beyond the approaches covered above, middleware such as ZooKeeper can also be used to generate unique IDs. **There is no silver bullet—always choose the solution that best fits your actual project requirements.**

One final reminder: never treat ID contiguity as a hard requirement. Most business domains only require uniqueness, not contiguity—and contiguous IDs can also leak business volume. Segment mode, Snowflake, and UUID can all experience ID gaps; gaps are usually not bugs. When chronological sorting is needed, prefer sorting by a `created_at` timestamp column rather than relying solely on ID ordering.

**Side-by-Side Comparison of Core Solutions:**

| **Solution** | **Performance** | **Ordering** | **Ops Cost** | **Best Suited For** |
| --- | --- | --- | --- | --- |
| **Database Auto-Increment** | Low | Strictly increasing | Low | Low traffic, monolithic systems, internal admin tools |
| **Segment Mode** | High | Trend-increasing | Medium | High-concurrency internet businesses chasing peak throughput |
| **Redis** | Very High | Increasing per single key during normal operation | Medium | Existing Redis clusters where tiny-probability ID rollback is tolerable |
| **Snowflake** | High | Trend-increasing | Medium | Medium-to-large distributed systems willing to handle Worker IDs, clock rollback, and capacity planning |
| **UUID v7** | High | Trend-increasing | Very Low | Cloud-native, decentralized clusters wanting out-of-the-box simplicity; unique index fallback still recommended for primary keys |

That said, this article mainly covers the theoretical side of distributed IDs. In actual interviews, interviewers often probe how you design distributed IDs for concrete business scenarios. You can check out [Distributed ID Design in Practice](./distributed-id-design.md) for practical guidance (which is also highly useful in day-to-day engineering design).
