---
title: 3 Commonly Used Cache Read and Write Strategies Explained
description: An in-depth comparison of Cache Aside, Read/Write Through, and Write Behind cache read/write strategies, complete with step-by-step sequence analysis, consistency edge cases, and production-grade solutions—essential for Redis in practice!
category: Databases
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Cache Read/Write Strategies,Cache Aside,Read Through,Write Through,Write Behind,Write Back,Cache Consistency,Cache Invalidation,Read/Write Through,Asynchronous Cache Write,Redis Cache Strategy,Cache Update Strategy
lang: en
sourceRef: zh-ref/database/redis/3-commonly-used-cache-read-and-write-strategies.md
---

I've seen many developers write "**proficient in using caches**" on their resumes, yet look completely blank when asked about "**the 3 commonly used cache read/write strategies**."

In my view, the reason this happens is that when learning Redis, many of us just write a few simple demos without paying attention to cache read/write strategies—or simply never even hear about them.

However, understanding these 3 common cache read/write strategies is tremendously helpful both when using caches in real-world engineering and when answering cache questions in interviews!

**Each of the three patterns introduced below has its own pros and cons—there is no single "best" pattern. Choose the cache read/write pattern that best fits your specific business scenario.**

### Cache Aside Pattern

This is the **most commonly used and classic** pattern in everyday development—virtually the de facto standard for internet application caching, especially well suited for **read-heavy, write-light** business scenarios.

This pattern is called **"Aside"** because **write operations in the application bypass the cache completely and operate directly on the database**.

The application acts as the "commander" orchestrating data flow, responsible for maintaining both the Cache and DB data sources.

Let's look at the cache read and write steps under this strategy.

**Write Operation:**

1. The application **first updates the DB and commits the transaction**.
2. After the transaction commits successfully, **delete** the corresponding data from the **Cache**.

Here is a simple diagram to help illustrate the write steps.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-write-9faa322c.png)

**Read Operation:**

1. The application first reads data from the Cache.
2. On a cache hit, return the data directly.
3. On a cache miss, read the data from the DB; after reading it successfully, **write the data back into the Cache**, and then return it.

Here is a simple diagram to help illustrate the read steps.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-read-166ab345.png)

Merely knowing the steps above is far from enough—we also need to understand the underlying principles.

For example, interviewers are very likely to follow up with:

1. Why is the write operation "update DB first, then delete Cache"? Can the order be reversed?
2. Is "update DB first, then delete Cache" completely safe?
3. Why "delete Cache" instead of "update Cache"?

Next, I will analyze and answer each of these questions in turn.

**1. Why is the write operation "update DB first, then delete Cache"? Can the order be reversed?**

**Answer:** Reversing the order is generally not recommended. If you simply do "delete Cache first, then update DB," a concurrent read request may put stale data right back into the cache.

- **Timeline Analysis (Request A writes, Request B reads):**
  1. Request A: First deletes the data from the Cache.
  2. Request B: Discovers the Cache is empty, so it reads the **old value** from the DB and prepares to write it to the Cache.
  3. Request A: Writes the **new value** to the DB and commits the transaction.
  4. Request B: Writes the **old value** it read earlier into the Cache.
- **Result:** The DB holds the new value while the Cache holds the old value—causing data inconsistency.

**2. Is "update DB first, then delete Cache" completely safe?**

**Answer:** No, it is not completely safe either! It can still cause **data inconsistency between the database and the cache**.

- **Timeline Analysis (Request A reads, Request B writes):**
  1. Request A: Experiences a cache miss and reads the **old value** from the DB.
  2. Request B: Completes the DB update, commits the transaction, and then deletes the Cache entry.
  3. Request A: Writes the **old value** it fetched earlier into the Cache.
- **Result:** Once again, the DB has the new value while the Cache has the old value.
- **What determines the probability of this occurring?** The key is whether the "read DB → write Cache" time window overlaps with the write request. Slow queries, thread pauses, and network latency can all stretch this window—so you cannot assume the probability is negligible merely because "reads are generally faster than writes."

Here, "update DB first" must include **the transaction committing successfully**. If you delete the cache right after executing `UPDATE` inside a transactional method while the transaction only commits when the method returns, other requests can still read the old value and backfill it before commit. A post-commit callback guarantees operation ordering, though the process may still exit after commit and before executing the callback—so failure compensation still needs to be considered.

Whether the origin data read back is sufficiently fresh also matters: under read/write splitting, a replica may not yet have applied updates from the primary; under InnoDB's `REPEATABLE READ` isolation level, a long-running transaction that has already established a snapshot can continue reading older row versions. For freshness-sensitive backfills, evaluate whether to read from the primary using a new short transaction so an old snapshot is not written into the cache as the latest data. For snapshot visibility rules, refer to the [MySQL Official Documentation](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html).

**3. Why "delete Cache" instead of "update Cache"?**

- **Performance Overhead:** Write operations often modify only some fields of an object; re-querying or recomputing the entire cached object just to "update Cache" can be expensive. By contrast, "delete" is a lightweight operation.
- **Lazy Loading Principle:** "Deletion" follows the lazy-loading principle. Only when the data is actually needed (read) next time is it loaded from the DB and written into the cache, avoiding wasted cache updates.
- **Avoiding Concurrent Write Overwrites:** Suppose A commits version 1 and B subsequently commits version 2 and finishes updating the cache first; if A's cache update arrives last, it overwrites the cache back to version 1. Deleting the cache carries no old value, avoiding this type of direct overwrite—though you still need to handle the stale-data backfill issue mentioned above.

Adopting this pattern requires two prerequisites: cached data can be reconstructed from the database, and the read path has origin-query capability on a cache miss; additionally, the business can tolerate a bounded stale-read window. That window may occur after commit and before cache deletion, or arise from deletion failures or stale-value backfills, and is not necessarily short. [Cache Aside itself does not guarantee that the cache and database remain consistent at all times](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).

**4. How should deletion failure and stale-value backfill be handled?**

- **Deletion failures require recoverable retries.** You can hand invalidation tasks to a message queue or background job, though "committing to DB then publishing a message" can still crash between the two steps. When reliable coordination is needed, you can use the Transactional Outbox pattern: record the pending event inside the same database transaction that updates the business data, and have a background worker deliver it after commit; alternatively, use CDC to subscribe to committed database changes to trigger invalidation. Duplicate deletion execution by consumers is normally safe (idempotent), and you should monitor backlogs, alert on repeated retry failures, and provide a compensation entry point. See [AWS guidance on the Transactional Outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).
- **Stale-value backfill cannot be solved solely by deletion retries.** The deletion may have succeeded long ago, yet an older request writes to the cache afterward. Performing another delayed deletion (delayed double deletion) can clean up part of late backfills, but a fixed delay cannot cover arbitrarily long request pauses, transactions, or replication lag—and the second deletion itself can fail. Therefore, delayed double deletion only narrows the risk window and cannot serve as a strong consistency guarantee.
- **TTL is a safety net, not a synchronization protocol.** After expiration, data should be reloaded from the database; if it still backfills from a lagging replica or stale snapshot, stale data will receive another TTL window. Do not extend the TTL on every read of stale data either, or old data may stay cached indefinitely. TTL should be set based on the business's tolerable staleness window and origin-query load.

When the business needs stricter control over concurrent backfills, you can design a mutual-exclusion or version-validation protocol covering all relevant read and write paths. Locking only write requests cannot stop unlocked read requests from backfilling; comparing only the current cached version also fails to identify a late stale value when the cache entry has already been deleted—requiring separate metadata such as an independent version watermark. **Neither Redis locks nor Lua scripts can automatically turn two writes to Redis and MySQL into one atomic transaction.** For operations that must read the latest committed state, explicitly define an authoritative read path and database isolation requirements.

Now let's analyze the **drawbacks of the Cache Aside Pattern**.

**Drawback 1: The very first request for data is guaranteed to miss the Cache**

Solution: For hot data with huge traffic volume, perform cache warm-up during system startup or off-peak hours.

**Drawback 2: Frequent writes cause cached entries to be deleted repeatedly, reducing the cache hit rate.**

Solutions:

- First evaluate whether the data is actually suitable for caching. When read and write frequencies are similar and reconstruction cost is low, querying the database directly may be simpler.
- If you genuinely need to update the cache proactively, handle concurrent update ordering and failure compensation, and configure a reasonable TTL. Locking or versioning can resolve part of the concurrency issues, but cannot omit the cross-system failure handling discussed above.

### Read/Write Through Pattern

In this pattern, the application treats the **Cache as its sole, primary storage**. All read and write requests go directly to the Cache, and the Cache service itself is responsible for synchronizing data with the DB.

This is **transparent** to the application—application developers do not need to be aware of the DB's existence.

As you may have noticed, this cache read/write strategy is very rare in everyday development. Leaving performance considerations aside, this is largely because Redis—the distributed cache we most commonly use—does not provide built-in functionality for the cache to write data back into the DB, meaning we would have to implement it ourselves on the business side or in middleware.

**Write (Write Through):**

- First check the Cache; if the entry does not exist in the Cache, update the DB directly.
- If the entry exists in the Cache, update the Cache first, and then the Cache service itself updates the DB. Success is returned to the upper layer only after both the Cache and DB writes succeed.

Here is a simple diagram to help illustrate the write steps.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/write-through-0c128aa9.png)

**Read (Read Through):**

- The application reads data from the Cache.
- On a hit, return directly.
- On a miss, the **Cache service itself** is responsible for loading data from the DB; once loaded successfully, it writes the data into itself first and then returns it to the application.

Here is a simple diagram to help illustrate the read steps.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/read-through-12212d89.png)

Read-Through is actually just a wrapper built on top of Cache-Aside. Under Cache-Aside, when a read request misses the Cache, the client itself is responsible for writing the fetched data into the Cache; under Read-Through, the Cache service itself writes into the cache, keeping the process transparent to the client.

From an implementation standpoint, Read-Through essentially pushes the "Read Miss → Read DB → Backfill Cache" logic of Cache-Aside down into the cache service, making it transparent to clients.

Just like Cache Aside, Read-Through also has the issue that the first request is guaranteed not to be in the Cache; hot data can be preloaded into the cache ahead of time.

### Write Behind Pattern

The Write Behind (also commonly called Write-Back) Pattern is very similar to the Read/Write Through Pattern—in both, the Cache service handles reading from and writing to the Cache and DB.

However, there is a major difference between the two: **Read/Write Through updates the Cache and DB synchronously, whereas Write Behind updates only the cache without updating the DB immediately, instead updating the DB asynchronously in batches.**

**Write Operation (Write Behind):**

1. The application writes data to the Cache and **returns immediately**.
2. The Cache service places this write operation into a queue.
3. A dedicated asynchronous thread/task **batches and coalesces** the queued write operations and flushes them to the DB.

This pattern introduces consistency challenges (for example, if the system crashes before cached data is written back to the DB), so it is unsuitable for scenarios requiring strong consistency (such as financial transactions or inventory).

However, its asynchronous and batching characteristics deliver **unmatched write performance**. It is widely applied in many high-performance systems:

- **MySQL's InnoDB Buffer Pool mechanism:** Data modifications are performed in the in-memory Buffer Pool first, and then asynchronously flushed to disk by background threads.
- **Operating System Page Cache:** File writes are also written to memory first and flushed to disk asynchronously by the operating system.
- **High-frequency counter scenarios:** For scenarios that tolerate brief data inconsistency while experiencing extremely frequent writes—such as article view counts or post like counts—increments can be accumulated rapidly in Redis first and then synchronized back to the database asynchronously via scheduled jobs.
