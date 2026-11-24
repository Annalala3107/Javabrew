---
title: Detailed Guide to Data Cold-Hot Separation
description: A comprehensive guide to the core principles and practical solutions for data cold-hot separation, covering hot/cold classification strategies, multi-tier layering design, data migration consistency guarantees, cold data query optimization, storage selection (HBase/TiDB/Object Storage), and real-world implementations for order, logging, and content systems.
category: High Performance
head:
  - - meta
    - name: keywords
      content: Data Cold-Hot Separation,Cold Data Migration,Cold Data Storage,Tiered Storage,TiDB Cold-Hot Separation,HBase,Data Archiving,Storage Cost Optimization,Data Consistency
lang: en
sourceRef: zh-ref/high-performance/data-cold-hot-separation.md
---

## What Is Data Cold-Hot Separation?

Data cold-hot separation is an architectural strategy that classifies data into cold data and hot data based on **access frequency** and **business importance**, and stores them separately on storage media with different performance and cost characteristics.

This architecture serves three core objectives:

1. **Improve query performance**: Hot data is stored on high-performance media (such as SSDs and memory) to guarantee fast response times for core business operations.
2. **Reduce storage costs**: Cold data is migrated to low-cost media (such as HDDs and object storage), significantly cutting storage expenses.
3. **Meet compliance requirements**: Certain industries (such as finance and healthcare) mandate long-term data retention; cold-hot separation balances compliance and cost.

### Cold Data and Hot Data

**Hot data** refers to data that is frequently accessed and modified and requires rapid responses; **cold data** refers to data with extremely low access frequency and limited immediate business value, yet still needs to be retained over the long term.

There are two main ways to distinguish between cold and hot data:

1. **Classification by time dimension**: Partition data based on creation time, update time, or expiration time. For example, an order system marks orders older than a certain period (such as 90 days or 1 year) as cold data. This approach fits scenarios where **data access frequency strongly correlates with time**, and is simple and inexpensive to implement.
2. **Classification by access frequency**: Treat frequently accessed data as hot data and infrequently accessed data as cold data. For example, a content system marks articles whose **view count falls below a threshold** as cold data. This approach requires tracking access frequency and fits scenarios where **access frequency strongly correlates with the inherent characteristics of the data itself**.

**How should you choose a classification strategy?**

- If business data is naturally time-sensitive (such as orders, logs, or bills), prioritize the **time dimension**, which has the lowest implementation cost.
- If data value is independent of time (such as articles, products, or user profiles), evaluate it alongside **access frequency**.
- In real-world projects, you can combine both: use the time dimension as the primary criterion and access frequency as a supplement to cover more business scenarios.

Do not let the engineering team decide hot/cold classification rules in isolation. Order inquiries, billing, auditing, customer support, and operations queries all affect "whether cold data can still be queried, how fast it can be retrieved, and whether full-dataset queries are mandatory." Before rolling out the architecture, list all critical query paths first, then decide the exact cutoff timing for cold data migration.

### Multi-Tier Layering Strategy for Cold-Hot Separation

In production deployments, "cold" and "hot" are rarely a strict binary split; instead, data is managed through **progressive multi-tier layering**:

| Tier | Data Characteristics | Example Classification Rule | Storage Strategy |
| ------------ | -------------------- | --------------------------- | ---------------------- |
| **Hot Data** | High-frequency access, real-time response | Last 30 days + all unfinished orders | MySQL Hot DB (SSD) |
| **Warm Data** | Medium-frequency access, potentially queried | Orders from 30–90 days ago | MySQL Warm DB (HDD) |
| **Cold Data** | Low-frequency access, occasional queries | Historical orders from 90 days to 3 years | Dedicated Cold DB or Object Storage |
| **Archive Data** | Rarely accessed, retained only for compliance | Orders older than 3 years | Object Storage (summary retained only) |

**Practical recommendation**: Manage classification rules dynamically via a **configuration center** to avoid frequent code changes whenever business requirements shift.

### How to Handle Cold Data When It Is Accessed

If cold data is suddenly accessed (for example, a user looks up an order from 3 years ago), should it be "promoted back to hot"?

| Strategy | Applicable Scenarios | Pros | Cons |
| ------------ | ---------------------- | -------------------- | ---------------------------- |
| **No Migration Back** | Occasional queries, extremely low query frequency | Simple to implement | Slow query speed |
| **Cache Layer** | Medium-frequency queries | Accelerates queries without changing storage | Requires an extra caching component |
| **Async Migration Back** | High-frequency queries requiring sustained access | Thoroughly resolves performance issues | Complex to implement; may introduce consistency issues |

**Recommended approach**: Most scenarios adopt a combined "**No Migration Back + Cache Layer**" strategy. When querying cold data, check the cache first and return immediately on a hit; on a miss, query the cold database and write the result into the cache (for occasional queries, a short TTL of 5–15 minutes is sufficient).

**⚠️ Note**: To prevent malicious attackers from repeatedly querying non-existent records with randomized parameters and penetrating through to the cold database, place a **Bloom Filter** in front of the cache layer or store **null placeholders** in the cache so malicious requests do not hit the cold database. For more details, refer to [Redis Common Interview Questions Summary (Part 2)](https://javaguide.cn/database/redis/redis-questions-02.html) (covering Redis transactions, performance optimization, production issues, clusters, usage best practices, etc.).

### The Core Philosophy of Cold-Hot Separation

The core philosophy behind cold-hot separation is **Tiered Storage**—assigning data to different tiers of storage media based on its access patterns. In enterprise storage architectures, tiers are typically divided as follows:

| Tier | Data Characteristics | Typical Storage Media | Access Latency |
| --------------------- | ------------------ | -------------------- | ----------- |
| **Hot Tier** | High-frequency access, real-time response | NVMe SSD, Memory | Millisecond-level |
| **Warm Tier** | Medium-frequency access, recent data | SATA SSD, High-speed HDD | Hundreds of milliseconds |
| **Cold Tier** | Low-frequency access, historical data | High-capacity HDD, Object Storage | Second-level |
| **Archive Tier** | Rarely accessed, compliance retention | Tape Library, Glacier Storage | Minute-to-hour level |

This tiered approach is widely applied across IT infrastructure—not only in databases, but also in file systems, object storage, CDN caching, and more.

### Pros and Cons of Data Cold-Hot Separation

**Pros:**

- **Improved hot data query performance**: Keeping hot data concentrated on high-performance storage dramatically shrinks table size, boosts index efficiency, and delivers a smoother experience for the vast majority of user operations.
- **Substantial storage cost savings**: Migrating cold data to HDDs or object storage cuts costs dramatically—**the unit cost gap between SSD and HDD can reach 5x–10x**, yielding major savings at massive data scales.
- **Better system maintainability**: With hot database volume kept under control, backups and restores run faster and DDL operations (such as adding indexes) finish much sooner.

**Cons:**

- **Increased system complexity**: Requires extra migration components, routing logic, and monitoring infrastructure, increasing data consistency risks.
- **Low efficiency for cross-database queries**: If the business needs to query hot and cold data simultaneously (such as annual summary reports), cross-database joins or aggregations are required, raising both query latency and development cost.
- **Maintenance cost of migration policies**: Cold/hot classification rules need ongoing tuning to prevent misclassifying and prematurely migrating active hot data.

## Cold Data Migration

### How Is Cold Data Migrated?

Cold data migration is the centerpiece of cold-hot separation, with three mainstream approaches:

| Approach | Implementation Mechanism | Pros | Cons | Applicable Scenarios |
| ------------------- | ---------------------------------------- | ---------------------- | -------------------------------------------- | ---------------------------- |
| **Application-Layer Routing** | Determine hot/cold on write and route directly to the corresponding DB | High real-time accuracy | Invasive to business code; complex classification logic | Rarely used |
| **Scheduled Job Migration** | Scheduled jobs scan the hot DB and batch-migrate eligible data | Simple to implement | Migration lag; table scans can pollute the Buffer Pool | Time-dimension classification scenarios |
| **Binlog Listener Migration** | Subscribe to database change logs for real-time or near-real-time migration | Good real-time performance; non-invasive to business code | Requires extra components (e.g., Canal); unsuitable for time-based rules | **Access-frequency classification scenarios (Recommended)** |

**Scheduled job migration** is the most commonly used approach and can be implemented via distributed job scheduling platforms such as XXL-Job or Elastic-Job. I have also written a detailed article on task scheduling—see [Detailed Guide to Java Scheduled Tasks](https://javaguide.cn/system-design/schedule-task.html).

> ⚠️ **Risk Warning**: Scheduled job migration carries performance hazards at large data volumes. Broad table scans (such as `SELECT * FROM orders WHERE create_time < 'xxx' LIMIT 10000`) severely pollute the InnoDB Buffer Pool, evicting genuine hot business data out of memory. **Production recommendations**:
>
> - Use **primary-key range queries** to avoid full table scans;
> - Control the **batch size per migration run** and execute in batches;
> - Run migration tasks during **off-peak business hours**;
> - For massive datasets, prefer the **Binlog listener** approach to minimize impact on the hot database.

A typical workflow is shown below:

![Cold-Hot Separation - Cold Data Migration](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/data-cold-hot-separation-b0e9ec69.png)

**Practical recommendation**: If your organization has DBA support, first run a **manual migration of existing cold data** to bulk-import historical records into the cold database, then automate **incremental migration** via scheduled jobs going forward.

### How to Guarantee Data Consistency During Migration?

The trickiest challenge during data migration is: **how do you handle records that get updated while migration is in progress?**

#### Common Solutions

| Solution | Implementation Mechanism | Pros | Cons |
| ------------------- | -------------------------------------- | ---------------- | ------------------------------------ |
| **Pre-Migration Lock** | Acquire a write lock on records before migrating and release it afterward | Strong consistency | Impacts business writes; lowers throughput |
| **Version-Based Optimistic Locking** | Record the version during migration and verify it has not changed before deleting | Lock-free; good performance | Requires adding a version column to business tables; retries needed on conflict |
| **Status Flag + Idempotency** | Add a migration status column to the hot table; mark first, then migrate | Traceable; supports rollback | Requires modifying business tables |

> **Note**: Hot and cold databases are usually **separate database instances**, so `INSERT` (cold DB) and `DELETE` (hot DB) cannot share a single local transaction. Cross-database atomicity must be handled explicitly.

#### Recommended Solution: Status Flag + Idempotent Migration

Add a `migrate_status` column to the hot database table and use a state machine to guarantee atomicity and traceability during migration:

```sql
-- 1. Add a migration status column to the hot database table
ALTER TABLE orders ADD COLUMN migrate_status TINYINT DEFAULT 0
    COMMENT '0-Not migrated 1-Migrating 2-Migrated';
```

```java
// 2. Migration workflow (pseudocode; separate cold DB scenarios require step-by-step execution at the application layer)

// Step 1: Mark as migrating (hot DB transaction)
hotDb.execute("UPDATE orders SET migrate_status = 1 WHERE id = ? AND migrate_status = 0", id);

// Step 2: Read from hot DB and write to cold DB (requires switching DB connections)
Order order = hotDb.query("SELECT * FROM orders WHERE id = ?", id);
coldDb.execute("INSERT IGNORE INTO orders_cold VALUES (?, ?, ...)", order.id, order.data...);

// Step 3: Mark as migrated (hot DB transaction)
hotDb.execute("UPDATE orders SET migrate_status = 2 WHERE id = ? AND migrate_status = 1", id);

// Step 4: Delayed deletion from hot DB (optional; run after verifying cold DB data)
hotDb.execute("DELETE FROM orders WHERE id = ? AND migrate_status = 2", id);
```

> **Note**: In a standalone cold database setup, standard MySQL cannot execute cross-instance `INSERT ... SELECT` directly; it must be split at the application layer into two steps: "read from hot DB -> write to cold DB."

**Advantages of this approach**:

- **Idempotency**: `INSERT IGNORE` ensures idempotent writes to the cold DB, while `migrate_status` state transitions ensure idempotent updates on the hot DB.
- **Traceability**: The status column lets you track migration progress and intervene manually when anomalies occur.
- **Rollback support**: If migration fails, you can reset the status back to 0 and re-run migration.
- **Gradual deletion**: Hot DB records are not deleted immediately; cleaning them up only after verifying the cold DB data reduces risk.

> **Space Reclamation**: When InnoDB executes `DELETE`, it only marks data pages as deleted—physical disk space is not immediately released back to the OS. You must run `OPTIMIZE TABLE` or `ALTER TABLE ENGINE=InnoDB` during **off-peak business hours** to rebuild the table and actually reclaim disk space.

**Fallback Safeguards**:

- **Periodic reconciliation**: Periodically scan records stuck in `migrate_status = 1` past a threshold and automatically reset them or trigger alerts. **Note**: The `migrate_status` column has extremely low cardinality, so you must pair it with a composite index (such as `idx_create_time_migrate_status`) to bound the scan range and avoid full table scans.
- **High-frequency update fallback**: For records repeatedly skipped due to frequent updates, configure a maximum retry count; once exceeded, force migration or escalate for manual intervention.

## How Should Cold Data Be Stored?

The selection criteria for cold data storage are: **high capacity, low cost, and high reliability, while tolerating some sacrifice in access speed**.

### Solutions for Small-to-Midsize Teams

Simply use **MySQL/PostgreSQL**, keeping the same database engine as the hot database to minimize operational complexity. Typical implementations:

- **Same-DB separate table**: Add a cold data table (such as `order_history`) inside the same database, distinguishing cold and hot data by table name.
- **Standalone cold DB**: Deploy a dedicated database instance as the cold DB and route between hot and cold DBs at the application layer.

**⚠️ Note**: A standalone cold DB introduces **cross-database queries**. If business logic requires joint queries across hot and cold data, evaluate whether to add data synchronization or an aggregation layer.

### Solutions for Large-Scale Companies

Large companies typically adopt storage engines specialized for massive datasets:

| Storage Solution | Characteristics | Applicable Scenarios |
| ---------------------- | -------------------------------- | -------------------------------- |
| **HBase** | Column-family storage, high throughput, supports PB-scale data | Logs, user behavior, IoT data archiving |
| **RocksDB** | High-performance KV store, LSM-Tree architecture | Embedded use cases, underlying storage engine for other systems |
| **Doris/ClickHouse** | OLAP engine supporting real-time analytics | Scenarios requiring analytical aggregations over cold data |
| **Cassandra** | Distributed, highly available, no single point of failure | Multi-region deployments, high-availability archival requirements |
| **Object Storage (OSS/S3)** | Ultra-low cost, virtually unlimited scalability | Ultra-large-scale cold data, compliance archiving |

### TiDB Solution (Recommended)

If your company's tech stack permits, you can adopt a distributed relational database like **TiDB**, which natively supports cold-hot separation out of the box.

TiDB 6.0 introduced **Placement Rules in SQL**, enabling you to configure where data resides across a TiKV cluster via a SQL interface.

- **Hot data**: Specify storage on **SSD nodes** via Placement Rules to guarantee query performance.
- **Cold data**: Specify storage on **HDD nodes** to lower storage costs.

```sql
-- Create placement policy: store hot data on SSD nodes
CREATE PLACEMENT POLICY hot_data
  CONSTRAINTS="[+disk=ssd]";

-- Create placement policy: store cold data on HDD nodes
CREATE PLACEMENT POLICY cold_data
  CONSTRAINTS="[+disk=hdd]";

-- Apply placement policies to a table or partition
ALTER TABLE orders PLACEMENT POLICY = hot_data;
ALTER TABLE orders PARTITION p2022 PLACEMENT POLICY = cold_data;
```

The key advantage here is that **application code remains unaware of cold-hot separation logic**—TiDB handles data placement automatically, drastically reducing application-layer complexity.

> **Complete Practice**: `Placement Rules` specify the storage medium type, but moving data from a "hot partition" to a "cold partition" still relies on **Range Partitioning**. Create partitions by time intervals, bind HDD placement policies to historical partitions, and bind SSD placement policies to active current partitions. Over time, you only need to maintain partition creation and removal, and underlying data naturally transitions across media tiers.

## How Should Cold Data Be Queried?

Even though cold data is accessed infrequently, when it does need to be queried (for audits, reconciliation, or annual reports), how do you keep queries efficient?

### Cold Data Query Requirement Analysis

First clarify: **Does the business actually need to query cold data?**

- **No**: Move cold data completely out of business databases and keep only archives (such as object storage), extracting manually when needed.
- **Yes**: Design a proper query architecture that balances performance and cost.

### Cold Data Query Optimization Strategies

| Optimization Technique | Implementation | Applicable Scenarios |
| -------------------- | --------------------------------------------------- | -------------- |
| **Dedicated Cold Read Replica** | Deploy read-only replicas for the cold DB so cold queries never impact the hot DB | Frequent cold query scenarios |
| **Query Routing** | Application layer automatically routes to hot or cold DB based on time range | Cross-hot/cold query scenarios |
| **Pre-Aggregation** | Periodically generate monthly/quarterly reports for cold data and query pre-aggregated results directly | Statistical analytics scenarios |
| **Columnar Storage** | Use OLAP engines such as ClickHouse or Doris for the cold store | Large-scale analytical queries |

**Handling Cross-Hot/Cold Queries**:

When a query range spans both hot and cold data (such as "query orders from the past 2 years"), there are two ways to handle it:

1. **Split queries**: Query the hot DB and cold DB separately, then merge results at the application layer.
2. **Restrict range**: Prompt users to narrow the query time window to avoid cross-database queries.

> **Avalanche Prevention Warning**: If a feature requires **global paginated sorting** (such as `ORDER BY create_time LIMIT 10000, 20`), the application layer must fetch `10000 + 20` rows from both the hot and cold databases and merge-sort them in memory—at large offsets, this easily triggers **OOM**. **Mandatory safeguards**:
>
> - Restrict query time ranges to prevent wide cross-database scans;
> - Or offload such queries to a synced wide table (such as ClickHouse) for computation;
> - Strictly prohibit deep merge-pagination in the application layer.

### How Should the Application Layer Route Cold and Hot Data?

| Approach | Implementation | Pros | Cons |
| ------------ | ---------------------------------------- | ------------------ | ---------------------------- |
| **Hardcoding** | Route directly inside application code | Simple to implement | High maintenance cost; rule changes require code edits |
| **Configuration Center** | Store routing rules in a config center (such as Nacos or Apollo) | Dynamic tuning without restarts | Requires extra middleware support |
| **Proxy Layer** | Introduce middleware such as ShardingSphere or ProxySQL | Transparent to business code | High architectural complexity |

**Recommended practice**: Small-to-midsize systems can use the **Configuration Center** approach, while large-scale systems can adopt a **Proxy Layer**.

> ⚠️ **Risk Warning**: Once a Proxy layer is introduced, all cross-hot/cold aggregations (such as global sorting or `GROUP BY` merge pagination) put memory and CPU pressure on the Proxy nodes. Strictly cap the maximum number of returned rows for such operations; otherwise, Proxy nodes can easily suffer **OOM (Out of Memory)**.

## Monitoring and Rollback

Once cold-hot separation goes live, monitor at least the following metrics:

- **Migration progress**: Pending records, successful migrations, failed migrations, and retry counts.
- **Migration lag**: Elapsed time from when data meets cooling criteria in the hot DB until migration completes.
- **Consistency verification**: Record counts across hot/cold DBs, checksums/summaries of key fields, and totals of monetary columns.
- **Query hit distribution**: Ratio of hot DB queries, cold DB queries, and cross-hot/cold queries.
- **Cold DB pressure**: Cold DB QPS, response time (RT), slow queries, connection count, and storage growth rate.
- **Abnormal backflow**: Whether cache hit rate and cold DB load behave abnormally when cold data suddenly sees high-frequency access.

Rollback strategies must also be designed in advance. A safe approach during early rollout is to copy without deleting—only perform delayed cleanup of hot DB data after query routing and consistency checks stabilize. That way, if any issue arises in the cold query path, traffic can temporarily fall back to the hot DB.

## Cold-Hot Separation vs. Data Archiving vs. Partitioned Tables

These three concepts are easily confused and should be clearly distinguished:

| Comparison Dimension | Cold-Hot Separation | Data Archiving | Partitioned Tables |
| ------------------ | -------------------------- | ---------------------- | -------------------------- |
| **Is data still accessible?** | Cold data remains on the business access path | Archived data is typically removed from business DBs | All partitions remain accessible |
| **Storage media** | Hot and cold data can span instances and storage types | Usually migrated to low-cost storage | Within the same instance |
| **Implementation complexity** | Medium | Low | Low |
| **Typical scenarios** | Time-sensitive data like orders and logs | Compliance retention, data backups | Large single-table volume without needing separated storage |

**Limitation of partitioned tables**: MySQL partitioned tables can split data by time, yet all partitions still live in the same database instance—**they cannot separate storage media**. If your goal is to cut storage costs, partitioned tables cannot replace cold-hot separation.

## Typical Business Scenarios

> **Note**: The following storage strategies are for reference only; actual selection should weigh data volume, query requirements, team tech stack, and budget.

### Order System

| Tier | Data Scope | Storage Strategy | Notes |
| -------- | ----------------------- | ------------------------------- | ---------------------------- |
| Hot Data | Last 90 days + unfinished orders | MySQL Hot DB (SSD) | High-frequency access, guarantees query performance |
| Cold Data | 90 days – 3 years | MySQL Cold DB (HDD) or TiDB | May still be queried; retains relational storage |
| Archive Data | Older than 3 years | Object Storage / HBase / Summary tables only | Rarely queried; prioritizes cost efficiency |

### Logging System

| Tier | Data Scope | Storage Strategy | Notes |
| ------ | --------- | ------------------------------------------------------ | ----------------------------------------- |
| Hot Data | Last 7 days | Elasticsearch Hot Nodes | Real-time search, high-frequency queries |
| Warm Data | 7–30 days | Elasticsearch Warm Nodes | Occasional queries, lowers storage cost |
| Cold Data | Over 30 days | Elasticsearch Cold Nodes / Compressed archive to Object Storage / ClickHouse | Choose based on query needs; ClickHouse fits analytics |

### Content System

| Tier | Data Scope | Storage Strategy | Notes |
| ------ | -------------------------- | ----------------------------- | ------------------------------ |
| Hot Data | Within 3 months of publish + high view count | MySQL Hot DB | Frequently accessed |
| Cold Data | Over 3 months + low view count | MySQL Cold DB / HBase / Object Storage | Low access frequency; migrate to low-cost storage |

**Selection Guidelines**:

- **Need transaction support or complex queries**: Prefer MySQL Cold DB or TiDB.
- **Need large-scale analytical aggregations**: Prefer ClickHouse or Doris.
- **Only need occasional detail lookups**: Choose Object Storage (such as OSS/S3) and load on demand.
- **Massive data volume with extremely rare access**: HBase or Object Storage offers the best cost-performance ratio.

## Case Sharing

- [How to Quickly Optimize an Order Table with Tens of Millions of Rows - Programmer Jidian - 2023](https://www.cnblogs.com/fulongyuanjushi/p/17910420.html)
- [Massive Data Cold-Hot Separation Solutions and Practices - ByteDance Tech Team - 2022](https://mp.weixin.qq.com/s/ZKRkZP6rLHuTE1wvnqmAPQ)
