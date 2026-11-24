---
title: "Redis Common Interview Questions Summary (Part 2)"
description: "Latest Redis interview questions summary (Part 2): an in-depth analysis of Redis transaction principles, performance optimization (pipeline/Lua/bigkey/hotkey), solutions for cache penetration/breakdown/avalanche, slow queries and memory fragmentation, and Redis Sentinel and Cluster. Helping you ace your backend technical interviews!"
category: Database
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Interview Questions,Redis Transactions,Redis Performance Optimization,Redis Cache Penetration,Redis Cache Breakdown,Redis Cache Avalanche,Redis bigkey,Redis hotkey,Redis Slow Log,Redis Memory Fragmentation,Redis Cluster,Redis Sentinel,Redis Pipeline,Redis Lua Script
lang: en
sourceRef: zh-ref/database/redis/redis-questions-02.md
---

## Redis Transactions

### What Is a Redis Transaction?

You can think of a transaction in Redis as follows: **A Redis transaction provides a feature that bundles multiple command requests together, and then executes all the bundled commands sequentially without being interrupted midway.**

Redis transactions are rarely used in practical development because their functionality is quite limited—do not confuse them with the relational database transactions we are familiar with.

Redis transactions do not provide a failure rollback mechanism like traditional relational database transactions; their durability depends on Redis's own persistence mechanisms. Each command in a transaction still interacts over the network with the Redis server: these commands are first queued on the server side and then executed consecutively in order when `EXEC` is invoked.

Redis transactions are not recommended for everyday development.

### How Do You Use Redis Transactions?

Redis implements transaction functionality through commands such as **`MULTI`, `EXEC`, `DISCARD`, and `WATCH`**.

```bash
> MULTI
OK
> SET PROJECT "JavaGuide"
QUEUED
> GET PROJECT
QUEUED
> EXEC
1) OK
2) "JavaGuide"
```

After issuing the [`MULTI`](https://redis.io/commands/multi) command, you can enter multiple commands. Redis does not execute them immediately; instead, it places them into a queue and executes all of them once the [`EXEC`](https://redis.io/commands/exec) command is called.

The process works like this:

1. Start the transaction (`MULTI`);
2. Enqueue commands (commands for batch Redis operations, executed in First-In, First-Out (FIFO) order);
3. Execute the transaction (`EXEC`).

You can also cancel a transaction using the [`DISCARD`](https://redis.io/commands/discard) command, which clears all commands stored in the transaction queue.

```bash
> MULTI
OK
> SET PROJECT "JavaGuide"
QUEUED
> GET PROJECT
QUEUED
> DISCARD
OK
```

You can use the [`WATCH`](https://redis.io/commands/watch) command to monitor specified keys. When calling `EXEC` to execute the transaction, if any key monitored by `WATCH` has been modified by **another client/session**, the entire transaction will not be executed.

```bash
# Client 1
> SET PROJECT "RustGuide"
OK
> WATCH PROJECT
OK
> MULTI
OK
> SET PROJECT "JavaGuide"
QUEUED

# Client 2
# Modify the value of PROJECT before Client 1 calls EXEC to commit the transaction
> SET PROJECT "GoGuide"

# Client 1
# Modification fails because the value of PROJECT was modified by Client 2
> EXEC
(nil)
> GET PROJECT
"GoGuide"
```

However, if **WATCH** and the **transaction** are in the same session, and the modification to the key monitored by **WATCH** happens inside the transaction, the transaction can still execute successfully (related issue: [Different effects when WATCH encounters MULTI](https://github.com/Snailclimb/JavaGuide/issues/1714)).

Modifying a `WATCH`-monitored key inside a transaction:

```bash
> SET PROJECT "JavaGuide"
OK
> WATCH PROJECT
OK
> MULTI
OK
> SET PROJECT "JavaGuide1"
QUEUED
> SET PROJECT "JavaGuide2"
QUEUED
> SET PROJECT "JavaGuide3"
QUEUED
> EXEC
1) OK
2) OK
3) OK
127.0.0.1:6379> GET PROJECT
"JavaGuide3"
```

Modifying a `WATCH`-monitored key outside a transaction:

```bash
> SET PROJECT "JavaGuide"
OK
> WATCH PROJECT
OK
> SET PROJECT "JavaGuide2"
OK
> MULTI
OK
> GET USER
QUEUED
> EXEC
(nil)
```

The relevant description on the official Redis website [https://redis.io/topics/transactions](https://redis.io/topics/transactions) is as follows:

![Redis Transactions](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-transactions-a08b8862.png)

### Do Redis Transactions Support Atomicity?

Redis transactions are different from the relational database transactions we usually think of. As we know, transactions have four properties: **1. Atomicity**, **2. Isolation**, **3. Durability**, and **4. Consistency**.

1. **Atomicity**: A transaction is the smallest unit of execution and cannot be divided. Atomicity ensures that operations either all complete or have no effect at all;
2. **Isolation**: When accessing a database concurrently, one user's transaction is not interfered with by other transactions, and concurrent transactions operate independently of one another;
3. **Durability**: Once a transaction is committed, its changes to data in the database are permanent and should not be affected even if a database failure occurs;
4. **Consistency**: Data remains consistent before and after executing a transaction, and multiple transactions reading the same data yield the same result.

When a runtime error occurs in a Redis transaction, all other commands—except the one that errored during execution—still execute normally. Furthermore, Redis transactions do not support roll back operations. Therefore, Redis transactions do not actually satisfy atomicity.

The official Redis documentation also explains why it does not support rollback. Simply put, Redis developers felt there was no need to support rollback, as omitting it keeps things simpler, cleaner, and faster. They believe command execution errors should be caught during development rather than in production.

![Why Redis does not support rollback](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-rollback-b66d7587.png)

**Related issues**:

- [issue#452: Regarding Redis transactions not satisfying atomicity](https://github.com/Snailclimb/JavaGuide/issues/452).
- [Issue#491: Regarding why Redis has no transaction rollback](https://github.com/Snailclimb/JavaGuide/issues/491).

### Do Redis Transactions Support Durability?

A major difference between Redis and Memcached is that Redis supports persistence, and specifically supports 3 persistence modes:

- Snapshotting (RDB);
- Append-Only File (AOF);
- Hybrid RDB and AOF persistence (added in Redis 4.0).

Compared to RDB persistence, AOF persistence offers better real-time durability. In Redis's configuration file, there are three different AOF persistence modes (`fsync` policies):

```bash
appendfsync always    # Every time data is modified, the main thread directly calls fsync to sync the AOF file to disk and returns after fsync completes. always runs on the main thread rather than a background thread, severely degrading Redis performance
appendfsync everysec  # Calls fsync once every second to sync the AOF file
appendfsync no        # Lets the operating system decide when to sync, typically once every 30 seconds
```

When the AOF `fsync` policy is `no` or `everysec`, data loss can still occur. Under `always`, durability requirements can essentially be satisfied, but the performance is too poor to be used in real-world development.

Therefore, the durability of Redis transactions cannot be guaranteed either.

### How Can the Shortcomings of Redis Transactions Be Addressed?

Starting from version 2.6, Redis has supported executing Lua scripts, whose functionality is very similar to transactions. We can use a Lua script to execute multiple Redis commands in a batch; these Redis commands are submitted to the Redis server and executed all at once, greatly reducing network overhead.

A Lua script can be treated as a single command during execution: while a Lua script is executing, no other scripts or Redis commands execute concurrently, ensuring that the operations cannot be interleaved or disturbed by other instructions.

However, if a Lua script encounters a runtime error and terminates midway, commands after the error will not be executed, and commands executed before the error cannot be undone—it still cannot achieve the kind of atomicity seen in relational databases where a failure rolls everything back. Therefore, **strictly speaking, batch-executing Redis commands via Lua scripts still does not fully satisfy atomicity.**

To ensure all commands in a Lua script execute, you must verify that both the syntax and the commands themselves are correct.

Additionally, Redis 7.0 introduced [Redis functions](https://redis.io/docs/latest/develop/programmability/functions-intro/), which you can view as a more powerful scripting mechanism than Lua.

## ⭐️Redis Performance Optimization (Important)

In addition to the content below, here are two great recommended articles:

- [Has Your Redis Really Slowed Down? How to Optimize Performance - Alibaba Developers](https://mp.weixin.qq.com/s/nNEuYw0NlYGhuKKKKoWfcQ).
- [Summary of Common Redis Blocking Causes - JavaGuide](https://javaguide.cn/database/redis/redis-common-blocking-problems-summary.html).

### Use Batch Operations to Reduce Network Transmission

The execution of a Redis command can be simplified into the following 4 steps:

1. Send the command;
2. Queue the command;
3. Execute the command;
4. Return the result.

The sum of the time spent in Step 1 and Step 4 is called **Round Trip Time (RTT)**, which is the time data spends traveling over the network.

Using batch operations reduces the number of network round trips, effectively lowering network overhead and drastically reducing RTT.

Moreover, beyond reducing RTT, the socket I/O cost of sending a single command is also relatively high (involving context switches and `read()` / `write()` system calls), so batch operations also reduce socket I/O cost. This is mentioned in the official pipeline documentation: <https://redis.io/docs/manual/pipelining/>.

#### Native Batch Commands

Redis provides some commands that natively support batch operations, such as:

- `MGET` (retrieve the values of one or more specified keys), `MSET` (set the values of one or more specified keys);
- `HMGET` (retrieve the values of one or more specified fields in a hash), `HMSET` (set one or more field-value pairs in a hash simultaneously);
- `SADD` (add one or more elements to a specified set);
- ...

However, in Redis Cluster (the official sharded clustering solution), using these native batch commands can present some minor issues that need handling. For example, `MGET` cannot guarantee that all keys reside in the same **hash slot**, so `MGET` may still require multiple network transmissions, and atomic execution can no longer be guaranteed. Even so, compared to non-batch operations, it still saves a considerable number of network round trips.

A simplified version of the process is as follows (usually implemented by the Redis client, so we don't need to implement it manually):

1. Find all hash slots corresponding to the keys;
2. Send `MGET` requests to the respective Redis nodes to fetch the data;
3. Wait for all requests to finish, reassemble the result data in the same order as the input keys, and return the result.

If you want to eliminate these multiple network transmissions, a common approach is to manage the key-to-slot mapping yourself. However, this is less flexible—while it improves performance, it also increases system complexity.

> Redis Cluster does not use consistent hashing; instead, it uses **hash slot partitioning**, where every key-value pair belongs to a **hash slot**. When a client sends a command request, it first finds the corresponding hash slot from the key using the calculation formula above, and then looks up the mapping between hash slots and nodes to locate the target Redis node.
>
> I cover Redis Cluster in detail in [Redis Cluster Deep Dive (Paid)](https://javaguide.cn/database/redis/redis-cluster.html)—feel free to check it out if interested.

#### pipeline

For commands that do not support native batching, we can use **pipeline** to group a batch of Redis commands together. These commands are submitted to the Redis server all at once, requiring only a single network transmission. However, you need to control the **number of elements** per batch (for example, within 500, though in practice it also depends on the byte size of the elements) to avoid excessive data volume over the network.

Just like native batch commands such as `MGET` and `MSET`, using pipeline on Redis Cluster has similar caveats for the same reason: it cannot guarantee that all keys live in the same **hash slot**. If you want to use it there, the client must manage the key-to-slot relationship itself.

There are differences between native batch commands and pipeline that you should keep in mind when using them:

- Native batch commands are atomic operations, whereas pipeline is non-atomic.
- Pipeline can bundle different commands together, whereas native batch commands cannot.
- Native batch commands are implemented by the Redis server, whereas pipeline requires cooperation between both the server and the client.

Let's also compare pipeline with Redis transactions:

- Transactions are atomic operations, while pipeline is non-atomic. Two separate transactions will not run simultaneously, whereas pipelines can execute in an interleaved manner.
- In a Redis transaction, every command must be sent to the server individually, whereas pipeline sends everything in a single request, resulting in fewer requests.

> A transaction can be regarded as an atomic operation, though it does not actually satisfy full atomicity. When we speak of an atomic operation in Redis, we mainly mean that the operation (such as a transaction or a Lua script) will not be interrupted by other operations (such as other transactions or Lua scripts); it does not fully guarantee that either all write commands in the operation execute or none do. This is also largely because Redis does not support rollback.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-pipeline-vs-transaction-4997418c.png)

Additionally, pipeline is not suitable for a batch of commands whose execution order has dependencies. For instance, if you need to feed the result of one command into a subsequent command, pipeline cannot meet that requirement. For such needs, we can use **Lua scripts**.

#### Lua Scripts

Lua scripts also support batching multiple commands. A Lua script can be treated as a single command and regarded as an **atomic operation**. That is, while a Lua script is executing, no other scripts or Redis commands execute simultaneously, ensuring the operations cannot be interleaved or disrupted by other instructions—something pipeline cannot provide.

Moreover, Lua scripts support simple logic processing, such as reading values with commands and processing them inside the Lua script, which pipeline likewise cannot do.

However, Lua scripts still have the following limitations:

- If a Lua script encounters a runtime error and terminates midway, subsequent operations will not run, yet write operations that have already occurred will not be undone. Thus, even with Lua scripts, database-style rollback atomicity cannot be achieved.
- Under Redis Cluster, the atomicity of Lua scripts cannot be guaranteed either, for the same reason: there is no guarantee that all keys reside in the same **hash slot**.

### Mass Simultaneous Key Expiration

As mentioned earlier, for expired keys, Redis adopts a **periodic deletion + lazy deletion** strategy.

During periodic deletion, if Redis suddenly encounters a large number of expired keys, client requests must wait for the periodic key-expiration task running on the Redis main thread to finish. This prevents client requests from being handled promptly and degrades response latency.

**How do we solve this?** Here are two common approaches:

1. Assign a random expiration time to keys.
2. Enable lazy-free (lazy deletion / deferred deallocation). Introduced in Redis 4.0, lazy-free lets Redis asynchronously defer releasing the memory used by deleted keys, handing that work off to a dedicated background thread so it does not block the main thread.

Personally, I recommend setting random expiration times for keys regardless of whether lazy-free is enabled.

### Redis bigkey (Big Keys)

#### What Is a bigkey?

Put simply, if the value corresponding to a key occupies a relatively large amount of memory, that key can be considered a bigkey. How big is "big"? Here is an approximate reference standard:

- A `String` value exceeds 1MB.
- A composite type (`List`, `Hash`, `Set`, `Sorted Set`, etc.) value contains more than 5,000 elements (however, for composite types, having more elements does not necessarily mean consuming more memory).

![bigkey criteria](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/bigkey-criterion-e36d656b.png)

#### How Are bigkeys Created? What Harm Do They Cause?

bigkeys are usually caused by the following reasons:

- Poor program design, such as directly using the `String` type to store binary data for large files.
- Insufficient consideration of business data scale, such as failing to account for rapid data growth when using collection types.
- Failure to clean up stale garbage data in time, such as accumulating large amounts of unused key-value pairs inside a Hash.

In addition to consuming extra memory and bandwidth, bigkeys severely impact performance.

As mentioned in [Summary of Common Redis Blocking Causes](./redis-common-blocking-problems-summary.md), bigkeys also cause blocking issues. Specifically, this manifests in three areas:

1. Client timeout blocking: Because Redis executes commands on a single thread, operating on a bigkey is time-consuming and blocks Redis; from the client's perspective, there is no response for a very long time.
2. Network blocking: Every retrieval of a bigkey generates heavy network traffic. If a key is 1 MB in size and accessed 1,000 times per second, it generates 1,000 MB of traffic per second—catastrophic for a server with a standard gigabit NIC.
3. Worker thread blocking: Using `DEL` to delete a bigkey blocks the worker thread, preventing it from handling subsequent commands.

The blocking caused by bigkeys can further affect master-replica replication and cluster scaling.

In summary, bigkeys introduce many potential problems, and we should avoid having bigkeys in Redis as much as possible.

#### How Can You Discover bigkeys?

**1. Use Redis's built-in `--bigkeys` option.**

```bash
# redis-cli -p 6379 --bigkeys

# Scanning the entire keyspace to find biggest keys as well as
# average sizes per key type.  You can use -i 0.1 to sleep 0.1 sec
# per 100 SCAN commands (not usually needed).

[00.00%] Biggest string found so far '"ballcat:oauth:refresh_auth:f6cdb384-9a9d-4f2f-af01-dc3f28057c20"' with 4437 bytes
[00.00%] Biggest list   found so far '"my-list"' with 17 items

-------- summary -------

Sampled 5 keys in the keyspace!
Total key length in bytes is 264 (avg len 52.80)

Biggest   list found '"my-list"' has 17 items
Biggest string found '"ballcat:oauth:refresh_auth:f6cdb384-9a9d-4f2f-af01-dc3f28057c20"' has 4437 bytes

1 lists with 17 items (20.00% of keys, avg size 17.00)
0 hashs with 0 fields (00.00% of keys, avg size 0.00)
4 strings with 4831 bytes (80.00% of keys, avg size 1207.75)
0 streams with 0 entries (00.00% of keys, avg size 0.00)
0 sets with 0 members (00.00% of keys, avg size 0.00)
0 zsets with 0 members (00.00% of keys, avg size 0.00
```

From the output of this command, we can see that it scans all keys in Redis, which has some impact on Redis performance. Moreover, this method only identifies the top 1 bigkey per data structure (the `String` consuming the most memory, and the composite types containing the most elements). However, having many elements in a key does not always mean it consumes the most memory; we still need to evaluate based on specific business context.

When running this command in production, specify the `-i` parameter to throttle the scan frequency and reduce the impact on Redis. For example, `redis-cli -p 6379 --bigkeys -i 3` pauses for 3 seconds between scan batches.

**2. Use Redis's built-in `SCAN` command.**

The `SCAN` command returns matching keys according to a specified pattern and count. After retrieving the keys, you can use commands like `STRLEN`, `HLEN`, `LLEN`, etc., to obtain their length or member count.

| Data Structure | Command | Time Complexity | Result (for the key) |
| -------------- | ------- | --------------- | -------------------- |
| String | STRLEN | O(1) | Length of the string value |
| Hash | HLEN | O(1) | Number of fields in the hash |
| List | LLEN | O(1) | Number of elements in the list |
| Set | SCARD | O(1) | Number of elements in the set |
| Sorted Set | ZCARD | O(1) | Number of elements in the sorted set |

For collection types, you can also use the `MEMORY USAGE` command (Redis 4.0+), which returns the memory space occupied by a key-value pair.

**3. Analyze RDB files with open-source tools.**

Find bigkeys by analyzing RDB files. This approach requires your Redis instance to use RDB persistence.

There are ready-made open-source tools available online:

- [redis-rdb-tools](https://github.com/sripathikrishnan/redis-rdb-tools): A Python tool for analyzing Redis RDB snapshot files.
- [rdb_bigkeys](https://github.com/weiyanwei412/rdb_bigkeys): A Go tool for analyzing Redis RDB snapshot files with better performance.

**4. Use public cloud Redis analysis services.**

If you use a managed public cloud Redis service, check whether it provides key analysis features (most of them do).

Taking Alibaba Cloud Redis as an example, it supports real-time bigkey analysis and discovery. Documentation: <https://www.alibabacloud.com/help/zh/apsaradb-for-redis/latest/use-the-real-time-key-statistics-feature>.

![Alibaba Cloud Key Analysis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aliyun-key-analysis-0a8d83ea.png)

#### How Should You Handle bigkeys?

Common handling and optimization methods for bigkeys are as follows (they can be combined):

- **Split bigkeys**: Split a bigkey into multiple smaller keys. For example, split a Hash with tens of thousands of fields into multiple Hashes using a partitioning strategy (such as secondary hashing).
- **Manual cleanup**: On Redis 4.0+, use the `UNLINK` command to asynchronously delete one or more keys. Below Redis 4.0, consider combining `SCAN` with `DEL` to delete keys in batches.
- **Choose appropriate data structures**: For instance, do not store binary file data in `String`; use `HyperLogLog` for page UV counting; use `Bitmap` for boolean status flags (0/1).
- **Enable lazy-free (lazy deletion / deferred deallocation)**: Introduced in Redis 4.0, lazy-free allows Redis to asynchronously defer freeing memory used by keys, delegating the operation to a separate child thread to avoid blocking the main thread.

### Redis hotkey (Hot Keys)

#### What Is a hotkey?

If a key is accessed significantly more often than other keys, it can be considered a **hotkey (hot key)**. For example, if a Redis instance processes 5,000 requests per second and a single key receives 2,000 requests per second, that key is a hotkey.

hotkeys usually arise from sudden traffic surges on popular data, such as breaking trending news or flash-sale items.

#### What Harm Do hotkeys Cause?

Serving a hotkey consumes substantial CPU and bandwidth, increasing latency for other requests on the same instance. When traffic exceeds capacity, it typically first manifests as request queuing, timeouts, and throughput degradation—it does not necessarily mean Redis will immediately crash. If the application retries aggressively or falls back to the database on timeouts, it can also shift that load onto the database.

When troubleshooting, do not look at access counts alone: high-frequency execution of complex commands exhausts CPU faster, whereas frequent reads of large values may saturate network bandwidth first. You also need to distinguish **read hotkeys from write hotkeys**—local caching mainly offloads read requests and cannot directly solve concentrated writes to the same key.

Therefore, hotkeys can easily become a system performance bottleneck and require targeted optimization to ensure high availability and stability.

#### How Can You Discover hotkeys?

**1. Use Redis's built-in `--hotkeys` option.**

`redis-cli --hotkeys` traverses keys via `SCAN` and reads `OBJECT FREQ` to find candidate keys with high frequency counters. **The returned counter is an approximate LFU frequency value, not an exact access count, and cannot be directly converted into QPS.**

A prerequisite for this approach is that Redis Server's `maxmemory-policy` must be set to `allkeys-lfu` or `volatile-lfu`; otherwise, the following error occurs:

```bash
# redis-cli -p 6379 --hotkeys

# Scanning the entire keyspace to find hot keys as well as
# average sizes per key type.  You can use -i 0.1 to sleep 0.1 sec
# per 100 SCAN commands (not usually needed).

Error: ERR An LFU maxmemory policy is not selected, access frequency not tracked. Please note that when switching between policies at runtime LRU and LFU data will take some time to adjust.
```

Redis has two LFU-based eviction policies:

1. **volatile-lfu (least frequently used)**: Evicts the least frequently used keys from the dataset with expiration times set (`server.db[i].expires`).
2. **allkeys-lfu (least frequently used)**: When memory is insufficient for new writes, evicts the least frequently used keys across the entire keyspace.

Do not change a production instance's eviction policy solely to diagnose hotkeys, as that alters behavior when memory reaches its limit. If the instance already uses LFU, you can throttle the scan pace:

```bash
redis-cli -h 127.0.0.1 -p 6379 --hotkeys -i 0.1
```

LFU counters increment probabilistically and decay over time according to configuration, making them suitable for comparing recent access heat. Scanning also takes time and generates extra requests; it is not an instantaneous snapshot of total traffic and may miss short-lived spikes. In a cluster, you must also clarify the scope of nodes; statistics from a replica cannot directly represent the read traffic of a primary node. For details on these mechanisms, see [OBJECT FREQ](https://redis.io/docs/latest/commands/object-freq/), [LFU Eviction](https://redis.io/docs/latest/develop/reference/eviction/#lfu-eviction), and [Redis CLI Docs](https://redis.io/docs/latest/develop/tools/cli/).

**2. Use the `MONITOR` command.**

`MONITOR` streams commands processed by the server in real time and can be used for short-duration capture and per-key aggregation; it is not a complete audit log, as some commands are not recorded.

Because this command has a major impact on Redis performance, leaving `MONITOR` enabled for long periods is strictly discouraged (use with extreme caution in production).

```bash
# redis-cli
127.0.0.1:6379> MONITOR
OK
1683638260.637378 [0 172.17.0.1:61516] "ping"
1683638267.144236 [0 172.17.0.1:61518] "smembers" "mySet"
1683638268.941863 [0 172.17.0.1:61518] "smembers" "mySet"
1683638269.551671 [0 172.17.0.1:61518] "smembers" "mySet"
1683638270.646256 [0 172.17.0.1:61516] "ping"
1683638270.849551 [0 172.17.0.1:61518] "smembers" "mySet"
1683638271.926945 [0 172.17.0.1:61518] "smembers" "mySet"
1683638274.276599 [0 172.17.0.1:61518] "smembers" "mySet2"
1683638276.327234 [0 172.17.0.1:61518] "smembers" "mySet"
```

When short-term diagnostics are needed, limit the capture duration and output file size, then analyze offline after stopping capture. It only observes requests while active and cannot reconstruct hotkeys that have already subsided; output may also contain business payloads, so access permissions must be restricted. For performance impact, see the [official MONITOR documentation](https://redis.io/docs/latest/commands/monitor/).

**3. Use open-source projects.**

JD Retail's open-source [hotkey](https://gitee.com/jd-platform-opensource/hotkey) project supports both hotkey detection and hotkey mitigation.

![JD Retail open-source hotkey](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/jd-hotkey-76fb6236.webp)

**4. Predict in advance based on business context.**

You can anticipate certain hotkeys based on business events, such as items participating in flash-sale promotions. However, not all hotkeys can be predicted ahead of time—for example, sudden breaking news events.

**5. Collect at the client or proxy layer.**

You can record key read/write counts per time window inside a unified SDK or Proxy, and then aggregate data across multiple instances. A single instance only sees its own traffic; to identify global hotkeys, you must unify counting definitions and time windows, and note that application-level access volume after local cache hits does not equal the request volume reaching Redis.

This approach works well for continuous observability, though it requires maintaining collection and aggregation logic. You can control overhead with sampling and bounded counting structures; avoid storing per-key statistics without an upper bound, and never attach all raw keys as monitoring metric labels.

**6. Use public cloud Redis analysis services.**

If you use a managed public cloud Redis service, check whether it provides key analysis features (most of them do).

Taking Alibaba Cloud Redis as an example, it supports real-time hotkey analysis and discovery. Documentation: <https://www.alibabacloud.com/help/zh/apsaradb-for-redis/latest/use-the-real-time-key-statistics-feature>.

![Alibaba Cloud Key Analysis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aliyun-key-analysis-0a8d83ea.png)

**7. Track hotkeys on the server side.**

The server side can centrally observe requests arriving at a given node. When custom statistics are needed, a capacity-bounded tracking structure can record accesses within a time window, track read and write hotkeys separately, and expose query and notification interfaces. Such extensions require maintaining server-side code and evaluating compatibility across Redis version upgrades.

Bounded tracking structures keep memory usage under control, but when entries are evicted or sampled, results may not reflect every single access. When evaluating a solution, clarify the counting window, sampling rate, capacity limit, notification overhead, and false-negative rate—never equate "a fast single recording step" with "zero overall cost."

**Version supplement: Starting with Redis Open Source 8.6.0, a native `HOTKEYS` command family is provided.** It identifies hotkeys during a specified observation window by CPU time or network bytes, which differs in metric definition from `redis-cli --hotkeys` that relies on LFU. For instance, on an instance that supports this command and where you have the required permissions, you can run:

```bash
# Collect for 30 seconds, keeping Top 10 by CPU and network traffic; SAMPLE 10 means 1/10 probabilistic sampling
redis-cli HOTKEYS START METRICS 2 CPU NET COUNT 10 DURATION 30 SAMPLE 10
# Check results during or after collection
redis-cli HOTKEYS GET
```

Sampling affects accuracy, and results correspond only to the specified observation window—they cannot query historical hotkeys from periods that were never collected. For parameters and return values, see [HOTKEYS START](https://redis.io/docs/latest/commands/hotkeys-start/) and [HOTKEYS GET](https://redis.io/docs/latest/commands/hotkeys-get/).

When choosing a detection strategy, first use existing monitoring to pinpoint high-load nodes and abnormal time ranges, then narrow things down using a hotkey tool suited to your Redis version. Network packet capture can also help inspect plaintext RESP traffic, but due to protocol parsing, capture overhead, and TLS encryption constraints, it is generally not preferred for continuous monitoring.

#### How Should You Solve hotkeys?

Common handling and optimization methods for hotkeys are as follows (they can be combined):

- **Prioritize offloading read hotkeys**: Put stable, read-heavy data into a JVM local cache (such as Caffeine) or a proxy cache, configuring capacity caps, TTL, and invalidation mechanisms; coalesce concurrent origin fetches when cache entries expire.
- **Read/write separation**: Clients route read requests that tolerate stale data to replica nodes, bearing in mind asynchronous replication lag; adding replicas cannot distribute writes targeting the same key.
- **Distinguish multiple hotkeys from a single hotkey**: Redis Cluster spreads different keys across different shards, yet a single key still maps to only one slot and is served by one primary node during normal operation. Simply adding shards will not split the load of that single key. See the [Cluster Specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/) to understand the relationship between slots and nodes.
- **Split write hotkeys by business semantics**: For example, counters that tolerate delayed aggregation can be split into multiple sub-counters and aggregated later, though read cost, atomicity, and consistency must be re-evaluated. Operations requiring unified constraints, such as inventory deduction, cannot simply apply counter sharding.
- **Control overload propagation**: Combine rate limiting, degradation, request coalescing, and bounded retries to prevent all requests from flooding the database when Redis times out.

If you create multiple copies under different key names for a read hotkey, you must also ensure they actually distribute across different shards and handle updates or invalidations across all copies. Giving copies the same hash tag places them in the same slot, failing to spread shard load. For multi-level cache invalidation notifications and consistency boundaries, continue reading [Cache Basics](./cache-basics.md).

Beyond these methods, if you use a public cloud Redis service, look out for its out-of-the-box solutions as well.

Taking Alibaba Cloud Redis as an example, it supports optimizing hotkey issues through its Proxy Query Cache feature.

![Optimizing hotkeys via Alibaba Cloud Proxy Query Cache](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aliyun-hotkey-proxy-query-cache-5a9f16f3.png)

### Slow Query Commands

#### Why Do Slow Query Commands Occur?

We know the execution of a Redis command can be simplified into the following 4 steps:

1. Send the command;
2. Queue the command;
3. Execute the command;
4. Return the result.

Redis slow query logging measures the duration of the command execution step, and slow query commands are commands whose execution takes a relatively long time.

Why do slow query commands occur in Redis?

Most commands in Redis have O(1) time complexity, but a small subset have O(n) time complexity, such as:

- `KEYS *`: returns all keys matching the pattern.
- `HGETALL`: returns all key-value pairs in a Hash.
- `LRANGE`: returns elements within a specified range in a List.
- `SMEMBERS`: returns all elements in a Set.
- `SINTER`/`SUNION`/`SDIFF`: computes the intersection/union/difference of multiple Sets.
- ...

Because these commands have O(n) time complexity and sometimes scan the entire collection, their execution time increases as `n` grows. Still, these commands are not strictly forbidden—you simply need to know the size of `N`. In addition, when traversal is needed, you can use `HSCAN`, `SSCAN`, and `ZSCAN` instead.

Besides O(n) commands that can trigger slow queries, there are also commands whose time complexity can exceed O(N), for example:

- `ZRANGE`/`ZREVRANGE`: returns all elements within a specified rank range in a Sorted Set. The time complexity is O(log(n)+m), where `n` is the total number of elements and `m` is the number of returned elements; when `m` and `n` are quite large, O(n) has smaller time complexity.
- `ZREMRANGEBYRANK`/`ZREMRANGEBYSCORE`: removes all elements within a specified rank range or score range in a Sorted Set. The time complexity is O(log(n)+m), where `n` is the total number of elements and `m` is the number of deleted elements; when `m` and `n` are quite large, O(n) has smaller time complexity.
- ...

#### How Can You Find Slow Query Commands?

Redis provides a built-in **Slow Log** feature specifically designed to record commands whose execution time exceeds a specified threshold. This is very helpful for troubleshooting performance bottlenecks and identifying "slow" operations blocking Redis, working similarly to MySQL's slow query log.

In the `redis.conf` file, we can set the threshold for slow commands using `slowlog-log-slower-than` and the maximum number of retained slow command entries using `slowlog-max-len`.

When the Redis server detects a command whose execution time exceeds the `slowlog-log-slower-than` threshold, it records the command in the slow log, much like MySQL logs slow queries. When the slow log exceeds the configured maximum entry limit, Redis evicts the oldest recorded commands in order.

⚠️ Note: Because the slow log consumes memory, setting the maximum number of entries too high may lead to excessive memory usage.

The default configurations of `slowlog-log-slower-than` and `slowlog-max-len` are as follows (you can customize them):

```properties
# The following time is expressed in microseconds, so 1000000 is equivalent
# to one second. Note that a negative number disables the slow log, while
# a value of zero forces the logging of every command.
slowlog-log-slower-than 10000

# There is no limit to this length. Just be aware that it will consume memory.
# You can reclaim memory used by the slow log with SLOWLOG RESET.
slowlog-max-len 128
```

In addition to modifying the configuration file, you can set them directly using the `CONFIG` command:

```bash
# Log commands whose execution time exceeds 10000 microseconds (i.e., 10 milliseconds)
CONFIG SET slowlog-log-slower-than 10000
# Keep only the most recent 128 slow commands
CONFIG SET slowlog-max-len 128
```

Retrieving the contents of the slow log is simple—just run the `SLOWLOG GET` command:

```bash
127.0.0.1:6379> SLOWLOG GET # Query slow log
 1) 1) (integer) 5
   2) (integer) 1684326682
   3) (integer) 12000
   4) 1) "KEYS"
      2) "*"
   5) "172.17.0.1:61152"
   6) ""
  // ...
```

Each entry in the slow log consists of the following six fields:

1. **Unique ID**: A unique identifier for the log entry.
2. **Timestamp**: The Unix timestamp when the command finished executing.
3. **Duration**: The time spent executing the command, in **microseconds**.
4. **Command and Arguments**: An array containing the executed command and its arguments.
5. **Client Information (Client IP:Port)**: The IP address and port of the client that issued the command.
6. **Client Name**: The client name if set by the client (`CLIENT SETNAME`).

By default, `SLOWLOG GET` returns the most recent 10 slow commands; you can also specify the count using `SLOWLOG GET N`.

Here are other commonly used slow-log commands:

```bash
# Return the number of entries in the slow log
127.0.0.1:6379> SLOWLOG LEN
(integer) 128
# Clear the slow log
127.0.0.1:6379> SLOWLOG RESET
OK
```

### Redis Memory Fragmentation

**Related questions**:

1. What is memory fragmentation? Why does Redis experience memory fragmentation?
2. How can you clean up Redis memory fragmentation?

**Reference answer**: [Redis Memory Fragmentation Explained](https://javaguide.cn/database/redis/redis-memory-fragmentation.html).

## ⭐️Redis Production Issues (Important)

### Cache Penetration

#### What Is Cache Penetration?

Cache penetration simply means that a large number of requested keys are invalid—**they exist neither in the cache nor in the database**. As a result, all these requests bypass the cache layer and hit the database directly, putting massive pressure on the database and potentially crashing it.

![Cache Penetration](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-penetration-c8f04a78.png)

For example, a hacker intentionally crafts illegal keys and sends a massive volume of requests; all those requests hit the database, and the database finds no matching records either. In other words, every request lands directly on the database, putting huge strain on it.

#### What Are the Solutions?

The most fundamental defense is proper parameter validation: immediately throw an error and return it to the client for illegal request parameters—for instance, rejecting database IDs less than 0 or invalid email formats right away.

**1) Cache invalid keys**

If neither the cache nor the database finds data for a key, write a placeholder entry into Redis with an expiration time, e.g., `SET key value EX 10086`. This helps when requested keys do not change frequently; however, if an attacker maliciously constructs a different key on every request, Redis will end up caching a huge number of invalid keys. Clearly, this does not solve the problem at its root. If you do use this approach to mitigate cache penetration, keep the TTL of invalid keys short, such as 1 minute.

As a side note, keys are typically structured as `table_name:column_name:primary_key_name:primary_key_value`.

Shown in Java code, it looks roughly like this:

```java
public Object getObjectInclNullById(Integer id) {
    // Get data from cache
    Object cacheValue = cache.get(id);
    // Cache is empty
    if (cacheValue == null) {
        // Fetch from database
        Object storageValue = storage.get(key);
        // Cache empty object
        cache.set(key, storageValue);
        // If stored data is null, set an expiration time (300 seconds)
        if (storageValue == null) {
            // Expiration must be set, otherwise there is a risk of attack
            cache.expire(key, 60 * 5);
        }
        return storageValue;
    }
    return cacheValue;
}
```

**2) Bloom Filter**

A Bloom Filter is a remarkable data structure that allows us to conveniently check whether a given element exists in a massive dataset. We can view it as composed of two parts: a binary vector (bit array) and a series of random mapping functions (hash functions). Compared to commonly used structures like `List`, `Map`, and `Set`, it uses far less space and achieves higher efficiency, though its downside is that the result is probabilistic rather than 100% exact. Theoretically, the more elements added to the set, the higher the false-positive rate. Additionally, data inserted into a Bloom Filter is not easy to delete.

![Simple schematic diagram of a Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-simple-schematic-diagram-ecf8f3d1.png)

A Bloom Filter uses a relatively large bit array to represent all data. Each slot in the array occupies only 1 bit and can only be `0` or `1` (representing `false` or `true`), which is the key to its memory efficiency. Doing the math, allocating a bit array for 1 million elements requires only `1000000 Bit / 8 = 125000 Byte = 125000 / 1024 KB ≈ 122 KB` of space.

![Bit Array](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-bit-table-b8f56b57.png)

Here is how it works in practice: store all potentially valid request keys in the Bloom Filter. When a request arrives, first check whether the requested value exists in the Bloom Filter. If it does not exist, immediately return a parameter error to the client; only if it exists does the request proceed down the cache/database pipeline.

The cache handling flow after adding a Bloom Filter is shown below:

![Cache handling flow after adding a Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-penetration-bloom-filter-878a8a50.png)

For a more detailed introduction to Bloom Filters, check out my original article: [Don't Know Bloom Filters? This Article Explains Everything Clearly!](https://javaguide.cn/cs-basics/data-structure/bloom-filter.html)—highly recommended.

**3) API Rate Limiting**

Apply rate limiting by user or IP address; for abnormally frequent access behavior, you can also adopt a blacklist mechanism, such as blacklisting abusive IPs.

Cache breakdown and cache avalanche, discussed next, can also be mitigated together with API rate limiting, since the core issue in all these cases is too many requests hitting the database and overloading it.

For specific rate-limiting implementations, see this article: [Service Rate Limiting Explained](https://javaguide.cn/high-availability/limit-request.html).

### Cache Breakdown

#### What Is Cache Breakdown?

In cache breakdown, the requested key corresponds to **hot data**, which **exists in the database but does not exist in the cache (usually because that cached entry has expired)**. This can cause a sudden surge of requests to hit the database directly, putting huge pressure on the database and potentially bringing it down.

![Cache Breakdown](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-breakdown-1a847904.png)

For example: during a flash sale, the cached data for a hot flash-sale item suddenly expires, causing an instant flood of requests for that item to hit the database directly and overwhelm it.

#### What Are the Solutions?

1. **Never expire** (not recommended): Configure hot data to never expire or give it a very long expiration time.
2. **Pre-warm in advance** (recommended): Pre-warm hot data into the cache beforehand with a reasonable expiration time—for example, ensuring flash-sale data does not expire before the flash sale ends.
3. **Locking** (depends on the scenario): When the cache expires, use a mutual exclusion lock so that only one request queries the database and refreshes the cache.

#### What Is the Difference Between Cache Penetration and Cache Breakdown?

In cache penetration, the requested key exists neither in the cache nor in the database.

In cache breakdown, the requested key corresponds to **hot data**, which **exists in the database but does not exist in the cache (usually because that cached entry has expired)**.

### Cache Avalanche

#### What Is Cache Avalanche?

I find the name "cache avalanche" quite amusing, haha.

In fact, cache avalanche describes a straightforward scenario: **A massive portion of cached data expires at the same time, causing a huge volume of requests to fall directly onto the database and putting enormous pressure on it.** Much like a real avalanche, it sweeps everything away—you can imagine the load on the database, which may well crash under the sudden flood of requests.

In addition, if the cache service itself goes down, it also causes a cache avalanche where all requests hit the database.

![Cache Avalanche](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-cache-avalanche-2585e3bd.png)

For example: a huge number of keys in the cache expire at the exact same time just when a wave of requests arrives to access those expired keys, driving all those requests straight to the database and overloading it.

#### What Are the Solutions?

**When the Redis service becomes unavailable**:

1. **Redis Cluster**: Deploy a Redis cluster so a single-node failure does not render the entire caching service unusable. Redis Cluster and Redis Sentinel are the two most common Redis clustering implementations; for details, see: [Redis Cluster Deep Dive (Paid)](https://javaguide.cn/database/redis/redis-cluster.html).
2. **Multi-level caching**: Set up multi-level caching, such as a two-tier cache combining a local cache with Redis. When Redis fails, partial data can still be served from the local cache.

**When a massive number of cache entries expire simultaneously**:

1. **Set random expiration times** (optional): Add randomness to cache expiration times—for example, adding a random offset on top of a fixed TTL—so keys do not all expire at once, reducing the risk of a cache avalanche.
2. **Pre-warm in advance** (recommended): Pre-warm hot data into the cache beforehand with reasonable TTLs, such as keeping flash-sale data valid until after the flash sale ends.
3. **Persistent cache strategy** (depends on the scenario): Although never-expiring caches are generally discouraged, this strategy can be considered for certain critical, infrequently changing data.

#### How Is Cache Warm-up Implemented?

There are two common ways to implement cache warm-up:

1. Use scheduled jobs, such as `xxl-job`, to periodically trigger cache warm-up logic that queries hot data from the database and loads it into the cache.
2. Use a message queue, such as Kafka, to warm up the cache asynchronously by sending the primary keys or IDs of hot database records to the message queue, which a cache service consumes to query the database and update the cache.

#### What Is the Difference Between Cache Avalanche and Cache Breakdown?

Cache avalanche and cache breakdown are similar, but cache avalanche is caused by a large portion or all of the cached data expiring/becoming invalid, whereas cache breakdown is mainly caused by a specific hot entry not existing in the cache (usually because that cached copy has expired).

### How Do You Ensure Consistency Between Cache and Database Data?

Cache-database consistency is a very common technical challenge. Introducing a cache primarily aims to boost performance and reduce database load, yet it inevitably brings the risk of data inconsistency. Strict, absolute consistency often entails higher system complexity and performance overhead, so in practice we choose an appropriate strategy based on business requirements, striking a balance between performance and consistency.

Let's focus specifically on the **Cache Aside Pattern**. This is a very common cache read/write strategy whose logic works as follows:

- **Read operation**:
  1. Try reading data from the cache first.
  2. If it is a cache hit, return the data directly.
  3. If it is a cache miss, query the database, write the fetched data into the cache, and return it.
- **Write operation**:
  1. Update the database first and commit the transaction.
  2. After the commit succeeds, delete the corresponding data from the cache.

Illustrated below:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-write-9faa322c.png)

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/cache-aside-read-166ab345.png)

Even with this ordering, the following issues still need to be handled:

- **Deletion failure**: Retry the invalidation operation via a recoverable task; if using an MQ, account for the crash window between "DB committed" and "message not yet sent", using a transactional outbox table or CDC if needed, and monitor compensation jobs.
- **Stale value backfill**: A read request may read an old value before an update commits and only write it back to the cache after deletion completes. Delayed double deletion only reduces part of this risk and cannot cover arbitrarily long delays; reading from replicas or long-running transaction snapshots can also surface stale data.
- **TTL fallback**: Set a TTL matching business tolerance, ensuring that origin queries after expiration can obtain sufficiently fresh data; TTL itself does not provide strong consistency.
- **Read capability and multi-level copies**: Deleting the cache requires having an origin-fetch path or clear fallback plan on cache misses. If a JVM local cache is also present, invalidation notifications across all application instances must be handled separately.

For detailed concurrency timelines, transaction commit nuances, and retry boundaries, see [Detailed Explanation of 3 Commonly Used Cache Read/Write Strategies](./3-commonly-used-cache-read-and-write-strategies.md); for origin-fetch and invalidation notification in multi-level caches, see [Cache Basics](./cache-basics.md).

Recommended related article: [Cache and Database Consistency: This One Article Is Enough - Water Droplet and Silver Bullet](https://mp.weixin.qq.com/s?__biz=MzIyOTYxNDI5OA==&mid=2247487312&idx=1&sn=fa19566f5729d6598155b5c676eee62d&chksm=e8beb8e5dfc931f3e35655da9da0b61c79f2843101c130cf38996446975014f958a6481aacf1&scene=178&cur_album_id=1699766580538032128#rd).

### What Situations Can Cause Redis to Block?

Common causes of Redis blocking include:

- Execution of `O(n)` complexity commands (such as `KEYS *`, `HGETALL`, `LRANGE`, `SMEMBERS`, etc.), where execution time grows too long as data volume increases.
- Running `SAVE` to generate an RDB snapshot synchronously blocks the main thread, whereas `BGSAVE` forks a child process to avoid blocking.
- AOF logging occurs on the main thread; writing the log after executing commands can block subsequent commands.
- During AOF `fsync`, a background thread syncs data to disk; heavy disk I/O pressure can block `fsync`, which in turn blocks the main thread's `write` calls—especially noticeable under `appendfsync always` or `everysec`.
- Appending the rewrite buffer to the new AOF file during AOF rewriting causes blocking.
- Operating on bigkeys (strings > 1MB or composite types with > 5,000 elements) causes client timeouts, network blocking, and worker thread blocking.
- Clearing databases with `flushdb` or `flushall` deletes a large number of key-value pairs and frees memory, blocking the main thread.
- Data migration during cluster scaling out/in is synchronous; migrating bigkeys blocks both source and target nodes for a long time and may trigger failover.
- Insufficient memory triggers Swap, where the OS swaps Redis memory out to disk, causing read/write performance to plummet.
- Excessive CPU usage by other processes degrades Redis throughput.
- Network issues such as connection refusals, high latency, or NIC soft interrupts cause Redis blocking.

For a detailed introduction, read: [Summary of Common Redis Blocking Causes](https://javaguide.cn/database/redis/redis-common-blocking-problems-summary.html).

## Redis Clusters

**Redis Sentinel**:

1. What is Sentinel? What is it used for?
2. How does Sentinel detect whether a node is down? What is the difference between Subjective Down (SDOWN) and Objective Down (ODOWN)?
3. How does Sentinel perform failover?
4. Why is it recommended to deploy multiple Sentinel nodes (a Sentinel cluster)?
5. How does Sentinel elect a new master (election mechanism)?
6. How is a Leader elected from the Sentinel cluster?
7. Can Sentinel prevent split-brain?

**Redis Cluster**:

1. Why do we need Redis Cluster? What problems does it solve? What are its advantages?
2. How does Redis Cluster perform sharding?
3. Why does Redis Cluster have 16,384 hash slots?
4. How is it determined which hash slot a given key should map to?
5. Does Redis Cluster support reassigning hash slots?
6. Can Redis Cluster continue serving traffic while scaling out or scaling in?
7. How do nodes in Redis Cluster communicate with one another?

**Reference answer**: [Redis Cluster Deep Dive (Paid)](https://javaguide.cn/database/redis/redis-cluster.html).

## Redis Usage Best Practices

When using Redis in practice, we should follow common best practices as much as possible, such as:

1. Use connection pools: avoid frequently creating and closing client connections.
2. Avoid `O(n)` commands whenever possible, and pay close attention to `n` when using them: `O(n)` commands like `KEYS *`, `HGETALL`, `LRANGE`, `SMEMBERS`, `SINTER`/`SUNION`/`SDIFF` are not unusable, but `N` must be well-bounded. Use `HSCAN`, `SSCAN`, and `ZSCAN` instead when iteration is needed.
3. Use batch operations to reduce network transmissions: native batch commands (like `MGET`, `MSET`, etc.), pipeline, and Lua scripts.
4. Avoid Redis transactions whenever possible: Redis's transaction feature is fairly limited; use Lua scripts instead.
5. Never leave `MONITOR` enabled for long periods: it heavily impacts performance.
6. Control key lifecycles: avoid storing excessive infrequently accessed data in Redis.
7. ...

## References

- *Redis Development and Operations*
- *Redis Design and Implementation*
- Redis Transactions: <https://redis.io/docs/manual/transactions/>
- What is Redis Pipeline: <https://buildatscale.tech/what-is-redis-pipeline/>
- Detailed Guide to Discovering and Handling BigKey and HotKey in Redis: <https://mp.weixin.qq.com/s/FPYE1B839_8Yk1-YSiW-1Q>
- Approaches and Exploration for Solving the Bigkey Problem: <https://mp.weixin.qq.com/s/Sej7D9TpdAobcCmdYdMIyA>
- Comprehensive Troubleshooting Guide for Redis Latency Issues: <https://mp.weixin.qq.com/s/mIc6a9mfEGdaNDD3MmfFsg>
