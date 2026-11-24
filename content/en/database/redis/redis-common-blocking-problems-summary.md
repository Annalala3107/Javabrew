---
title: Summary of Common Causes of Redis Blocking
description: A comprehensive summary of common Redis blocking causes, including O(N) complexity commands, bigkey operations, AOF log disk flushing, RDB snapshot creation, and master-replica replication, helping you troubleshoot and prevent Redis performance issues.
category: Database
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis blocking,Redis performance issues,O(n) commands,bigkey,AOF flush,RDB snapshot,master-slave replication,memory limit reached
lang: en
sourceRef: zh-ref/database/redis/redis-common-blocking-problems-summary.md
---

> This article was compiled and improved from: <https://mp.weixin.qq.com/s/0Nqfq_eQrUb12QH6eBbHXA>, Author: 阿 Q ShuoDaiMa (A-Q Talks Code).

This article will summarize in detail the scenarios that may cause Redis to block. These scenarios are also critical factors affecting Redis performance, so extra caution is warranted when using Redis!

## O(n) Commands

Most Redis commands have an O(1) time complexity, but a small subset of commands has an O(n) time complexity, such as:

- `KEYS *`: Returns all keys matching a pattern.
- `HGETALL`: Returns all key-value pairs in a Hash.
- `LRANGE`: Returns elements in a List within a specified range.
- `SMEMBERS`: Returns all elements in a Set.
- `SINTER` / `SUNION` / `SDIFF`: Computes the intersection / union / difference of multiple Sets.
- ...

Because these commands have an O(n) time complexity and sometimes scan entire collections or keyspaces, execution time increases as n grows, thereby blocking client requests. However, this does not mean these commands should never be used, but the value of N must be clearly bounded and controlled. Additionally, where traversal is needed, `HSCAN`, `SSCAN`, and `ZSCAN` can be used instead.

Beyond these O(n) commands that might cause blocking, there are commands whose time complexity can reach O(n) or higher under certain conditions, such as:

- `ZRANGE` / `ZREVRANGE`: Returns all elements in a Sorted Set within a specified rank range. The time complexity is O(log(n)+m), where n is the total number of elements and m is the number of returned elements. When m and n are very large, O(n) can be smaller.
- `ZREMRANGEBYRANK` / `ZREMRANGEBYSCORE`: Removes all elements in a Sorted Set within a specified rank or score range. The time complexity is O(log(n)+m), where n is the total number of elements and m is the number of deleted elements.
- ...

## SAVE Creating RDB Snapshots

Redis provides two commands to generate RDB snapshot files:

- `save`: Synchronous save operation that blocks the Redis main thread.
- `bgsave`: Forks a child process to perform the save; the child process does the work without blocking the Redis main thread. This is the default option.

By default, Redis configuration uses the `bgsave` command. If you manually run the `save` command to generate an RDB snapshot file, the main thread will be blocked.

## AOF

### AOF Log Recording Blocking

The Redis AOF persistence mechanism logs commands after they have been executed, which differs from relational databases (such as MySQL) that typically log before executing commands (to facilitate crash recovery).

![AOF Logging Process](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-aof-write-log-disc-7a4b70ef.png)

**Why log after executing commands?**

- Avoids extra checking overhead: AOF logging does not perform syntax checks on commands since invalid commands would have failed during execution.
- Logging after execution does not block the execution of the current command itself.

However, this design also introduces risks (as mentioned earlier when introducing AOF persistence):

- If Redis crashes right after executing a command, the corresponding modifications will be lost.
- **It may block the execution of subsequent commands (because AOF log recording is performed in the Redis main thread).**

### AOF Flush-to-Disk Blocking

After enabling AOF persistence, every command that modifies data in Redis causes Redis to write the command into the AOF buffer `server.aof_buf`. Redis then decides when to synchronize it to the AOF file on disk according to the `appendfsync` configuration.

The Redis configuration file provides three different AOF persistence policies (`fsync` strategies):

1. `appendfsync always`: After the main thread calls `write` to execute a write operation, the **main thread** immediately calls the `fsync` function to synchronize the AOF file (flush to disk). The thread returns only after `fsync` completes. The `always` policy is **executed directly by the main thread**, not by a background thread. This offers the greatest data safety, but every write synchronously blocks the main thread, severely degrading Redis performance (`write` + `fsync`).
2. `appendfsync everysec`: The main thread returns immediately after calling `write`. A background thread (the `aof_fsync` thread) calls the `fsync` function (system call) once every second to synchronize the AOF file (`write` + `fsync`, with a 1-second `fsync` interval).
3. `appendfsync no`: The main thread returns immediately after calling `write`, leaving the operating system to decide when to synchronize. Under Linux, this usually occurs once every 30 seconds (`write` without explicit `fsync`; timing is decided by the OS).

When the background thread (`aof_fsync` thread) calls `fsync` to synchronize the AOF file, it must wait until the write completes. When disk I/O pressure is extremely high, the `fsync` operation can block. In this scenario, when the main thread calls the `write` function, it will also be blocked. Only after `fsync` completes can the main thread's `write` return successfully.

For a detailed walkthrough of the AOF workflow, please refer to: [In-Depth Guide to Redis Persistence Mechanisms](./redis-persistence.md), which helps clarify AOF disk-flush blocking.

### AOF Rewrite Blocking

1. A child thread/process is forked to rewrite the file. When executing the `BGREWRITEAOF` command, the Redis server maintains an AOF rewrite buffer that records all write commands executed by the server while the child process is creating the new AOF file.
2. Once the child process finishes creating the new AOF file, the server appends all contents from the rewrite buffer to the end of the new AOF file, ensuring the database state preserved in the new AOF file matches the current state.
3. Finally, the server atomically replaces the old AOF file with the new AOF file to complete the AOF rewrite.

Blocking occurs during step 2: writing the newly accumulated data from the buffer to the new file will cause **blocking**.

Related reading: [Redis AOF Rewrite Blocking Problem Analysis](https://cloud.tencent.com/developer/article/1633077).

## Bigkeys (Large Keys)

If the value corresponding to a key occupies a relatively large amount of memory, that key can be considered a bigkey. How large is considered big? Here is a commonly referenced heuristic:

- A String value exceeding 1MB.
- A composite data type (List, Hash, Set, Sorted Set, etc.) whose value contains more than 5,000 elements (note that for composite types, having more elements does not strictly mean more memory is used, but it is a strong indicator).

The blocking problems caused by bigkeys include:

- Client timeout blocking: Because Redis command execution is single-threaded, operating on bigkeys takes more time, blocking Redis. From the client's perspective, this appears as long delays with no response.
- Causing network congestion: Retrieving a bigkey incurs substantial network traffic. If a key is 1 MB and accessed 1,000 times per second, it generates 1,000 MB/s of network throughput, which is disastrous for servers with standard gigabit NICs.
- Blocking worker threads: When deleting a bigkey using `DEL`, the worker thread is blocked while memory is reclaimed, preventing subsequent commands from being processed.

### Finding Bigkeys

When using Redis's built-in `--bigkeys` option to scan for bigkeys, it is best to run this command on a replica node, because running it on the master will **block** the master node.

- You can also use the `SCAN` command to scan and identify bigkeys.
- Another option is analyzing the RDB snapshot file to identify bigkeys, provided that Redis uses RDB persistence. Existing tools include:
  - redis-rdb-tools: A tool written in Python used to inspect and analyze Redis RDB snapshot files.
  - rdb_bigkeys: A tool written in Go for analyzing Redis RDB snapshot files with superior performance.

### Deleting Bigkeys

The essence of a delete operation is releasing the memory space occupied by the key-value pair.

Releasing memory is only the first step. To manage memory space efficiently, when an application frees memory, **the operating system must insert the released memory blocks into a free memory block linked list** for subsequent tracking and reallocation. This process takes time and will **block** the application performing the release.

Therefore, if a large amount of memory is freed all at once, the time spent operating on the free block linked list increases, causing the Redis main thread to block. If the main thread blocks, all other requests may time out. As timeouts cascade, Redis connections can become exhausted, triggering various application-level failures.

When deleting bigkeys, it is recommended to use incremental batch deletion or asynchronous deletion (such as `UNLINK`).

## Flushing the Database

Flushing the database works under the same principle as deleting bigkeys: `FLUSHDB` and `FLUSHALL` involve deleting and freeing all key-value pairs, which is another notable blocking point in Redis.

## Cluster Scaling (Resizing)

Redis Cluster supports dynamic node scaling (expansion and contraction). This process is currently semi-automated and requires manual intervention.

During expansion or contraction, data migration must take place. To guarantee migration consistency, all Redis migration operations are synchronous.

During migration, Redis instances on both ends enter a blocking state of varying duration. For small keys, this latency is negligible; however, if keys are excessively large, it may trigger cluster failover in severe cases, resulting in unnecessary master switches.

## Swap (Memory Swapping)

**What is Swap?** Swap in Linux refers to swapping or the swap partition. Similar to virtual memory in Windows, when physical memory is insufficient, a portion of hard disk space is mapped as virtual memory to alleviate memory shortages. Therefore, the role of Swap is sacrificing disk performance to expand available memory capacity, preventing VPS memory exhaustion.

Swap is disastrous for Redis. An essential prerequisite for Redis's high performance is that all data resides in memory. If the OS swaps parts of the memory used by Redis out to disk, because disk read/write speeds are orders of magnitude slower than RAM, Redis performance will degrade precipitously.

Methods to check whether Redis is experiencing Swap:

1. Look up the Redis process ID:

```bash
redis-cli -p 6383 info server | grep process_id
process_id: 4476
```

2. Query swap information using the process ID:

```bash
cat /proc/4476/smaps | grep Swap
Swap: 0kB
Swap: 0kB
Swap: 4kB
Swap: 0kB
Swap: 0kB
.....
```

If swapped amounts are all 0KB or only occasional 4KB entries, it is considered normal.

Ways to prevent memory swapping:

- Ensure the host has ample available physical memory.
- Make sure all Redis instances configure a maximum memory limit (`maxmemory`) to prevent uncontrolled memory growth under extreme conditions.
- Lower the system's swappiness priority, e.g., `echo 10 > /proc/sys/vm/swappiness`.

## CPU Contention

Redis is a classic CPU-bound application. It is not recommended to co-locate Redis with other multi-core CPU-intensive services. When other processes excessively consume CPU cycles, Redis throughput will be severely compromised.

You can monitor current Redis metrics via `redis-cli --stat`. Inspect process CPU utilization with the `top` command. Analyze command execution times using `info commandstats` to determine if excessive overhead is caused by high-complexity algorithms or over-aggressive memory optimization.

## Network Issues

Connection rejections, network latency, network card software interrupts (softIRQ), and related networking issues can also cause Redis to block.

## References

- Analysis and Summary of 6 Major Categories of Redis Blocking Scenarios: <https://mp.weixin.qq.com/s/eaZCEtTjTuEmXfUubVHjew>
- Redis Development & Ops Notes - The Nightmare of Redis: Blocking: <https://mp.weixin.qq.com/s/TDbpz9oLH6ifVv6ewqgSgA>
