---
title: Redis Persistence Mechanisms Explained
description: In-depth analysis of Redis's three persistence mechanisms—RDB snapshots, AOF logs, and hybrid persistence—covering their working principles, configuration methods, and pros/cons comparison to help you choose the right persistence strategy for your business scenario.
category: Databases
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Persistence,RDB,AOF,Hybrid Persistence,bgsave,Data Recovery,Redis Backup,fork Child Process
lang: en
sourceRef: zh-ref/database/redis/redis-persistence.md
---

When using caching, we often need to persist in-memory data—that is, write data stored in memory to disk. In most cases, this is done either to reuse the data later (for example, recovering data after a machine restart or hardware failure) or to perform data synchronization (for example, master and replica nodes in a Redis cluster synchronizing data via RDB files).

One very important difference between Redis and Memcached is that Redis supports persistence, and it supports three persistence modes:

- Snapshotting (RDB)
- Append-only file (AOF)
- Hybrid persistence combining RDB and AOF (introduced in Redis 4.0)

Official documentation URL: <https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/> .

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis4.0-persitence-5af100fe.png)

**This article is based on Redis 7.0+**. There are important differences in persistence mechanisms across versions; please verify your Redis version before using them:

| Version        | Default Persistence Mode | Key Features                                   |
| -------------- | ------------------------ | ---------------------------------------------- |
| **Redis 4.0**  | RDB                      | Introduced RDB+AOF hybrid persistence          |
| **Redis 6.0**  | RDB                      | AOF still requires manual enabling             |
| **Redis 7.0**  | RDB                      | Introduced Multi-Part AOF                      |
| **Redis 7.2+** | RDB                      | Further optimized persistence performance      |

**Key Behavioral Differences**:

- **AOF rewrite memory consumption**: Prior to Redis 7.0, incremental data during rewrite had to be retained in memory; Redis 7.0+ resolves this using Multi-Part AOF.
- **Hybrid persistence**: Must be manually enabled in Redis 4.0–6.x; enabled by default in Redis 7.0+.

Check your Redis version:

```bash
redis-cli INFO server | grep redis_version
# Example output: redis_version:7.0.12
```

The diagram below illustrates the complete workflow of Redis persistence mechanisms, covering the core content of this article:

![Complete Workflow of Redis Persistence Mechanisms](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-persistence-flow-95efd545.png)

## RDB Persistence

### What Is RDB Persistence?

Redis can create a snapshot to obtain a copy of the data stored in memory at a **specific point in time**. After creating a snapshot, Redis can back it up, copy it to other servers to create server replicas containing the same data (Redis master-replica architecture, mainly used to improve Redis performance), or keep the snapshot in place for use when restarting the server.

Snapshot persistence is the default persistence method used by Redis. The `redis.conf` configuration file includes the following default configuration:

```clojure
# Redis 7.0 default configuration (single-line format)
save 3600 1 300 100 60 10000

# Meaning of each condition:
# - At least 1 key changed within 3600 seconds (1 hour)
# - At least 100 keys changed within 300 seconds (5 minutes)
# - At least 10000 keys changed within 60 seconds (1 minute)

# Equivalent to the legacy multi-line format:
# save 3600 1
# save 300 100
# save 60 10000
```

### Does Creating an RDB Snapshot Block the Main Thread?

Redis provides two commands to generate RDB snapshot files:

- `save`: Synchronous save operation, which blocks the Redis main thread;
- `bgsave`: Forks a child process, and the child process performs the save.

> The reason we refer to the Redis main thread rather than the main process here is primarily because after Redis starts up, it performs most of its core work in a single-threaded manner. If you prefer to describe it as the Redis main process, that is completely fine as well.

#### fork Performance Overhead Analysis

Although `bgsave` executes in a child process and does not block the main thread from processing command requests, the **fork operation itself is blocking** and introduces additional memory overhead (the values in the table below are reference figures; actual values depend on CPU performance, memory fragmentation ratio, system load, and other factors):

| Dataset Size | fork Latency | Additional Memory Usage    | Risk Level     |
| ------------ | ------------ | -------------------------- | -------------- |
| < 1GB        | < 10ms       | ~10MB (page table copy)    | Low            |
| 1-10GB       | 10-100ms     | 10-100MB                   | Medium         |
| 10-50GB      | 100ms-1s     | 100-500MB                  | High           |
| > 50GB       | > 1s         | > 500MB                    | Extremely High |

> This article uses RDB's `bgsave` as an example to explain the performance impact of `fork`, but **the exact same mechanism also applies to AOF rewrite (the `BGREWRITEAOF` command)**. AOF rewrite likewise needs to fork a child process and faces the same fork latency, COW memory overhead, and THP risks. In production environments, whether using RDB or AOF rewrite, you must monitor fork-related performance metrics.

#### Copy-on-Write (COW) Mechanism

- After `fork`, the child process shares the parent process's memory pages (standard 4KB pages).
- When either the parent process or the child process modifies a memory page, the kernel copies that page (Copy-on-Write).
- Under large datasets + high write loads, this causes extensive page copying and degrades performance.

#### Memory Avalanche Caused by THP (Transparent Huge Pages)

Linux distributions enable **THP (Transparent Huge Pages)** by default, with a page size of 2MB. THP increases the probability of huge pages undergoing COW. **In the worst case**, if memory is merged into 2MB huge pages, even if a client modifies only 10 bytes of data, the kernel will copy the entire 2MB memory page, **amplifying COW memory overhead by 512 times** (2MB / 4KB = 512).

**Actual Behavior**: The kernel does not force all memory to use 2MB huge pages; instead, it dynamically decides whether to merge pages based on runtime conditions. A 2MB COW is triggered only when memory has already been successfully merged into huge pages. However, under high-concurrency write workloads, this still significantly increases memory consumption and can instantaneously exhaust host memory, triggering the **OOM Killer to forcibly terminate the Redis process**.

**Verification Method**:

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
# Output [always] madvise never indicates THP is enabled (dangerous!)
# It should output always madvise [never]
```

**Solution**: Add `echo never > /sys/kernel/mm/transparent_hugepage/enabled` to the Redis startup script, or use `redis-server --disable-thp yes` (supported in Redis 6.0+).

**Startup Warning**: When Redis detects that THP is enabled, it prints `WARNING you have Transparent Huge Pages (THP) support enabled in your kernel` in the startup log—this must be addressed immediately.

#### Production Environment Recommendations

```bash
# 1. Monitor fork risk indicators
redis-cli INFO memory | grep -E "(used_memory|used_memory_rss)"

# Example output:
# used_memory:1073741824
# used_memory_rss:1226833920
# used_memory_rss_human:1.14G

# Calculate the RSS/USED ratio; it should be < 2 during fork
# If it approaches or exceeds 2, fork risk is high

# 2. Set maxmemory to limit Redis memory usage and reserve space for fork
# Set in redis.conf:
# maxmemory 8gb
# maxmemory-policy allkeys-lru

# 3. Avoid manually triggering BGSAVE during peak traffic hours
# Let Redis trigger automatically according to configured rules

# 4. Consider master-replica replication + replica-side persistence architecture
# Offload persistence operations to replica nodes to avoid fork overhead on the master node
```

**Monitoring Alerts**:

- `rdb_last_bgsave_time_sec`: Duration of the last `bgsave`; should be `< 5s`.
- `rdb_last_cow_size`: COW memory size of the last `fork`; should be `< 10%` of `used_memory`.

## AOF Persistence

### What Is AOF Persistence?

Compared with snapshot persistence, AOF persistence offers better real-time durability. By default, Redis does not enable AOF (append-only file) persistence; it can be enabled via the `appendonly` parameter:

> **Version Note**: Redis uses RDB persistence by default. To use AOF, you must manually set `appendonly yes`. Redis 7.0 introduced the Multi-Part AOF mechanism to optimize AOF performance, but did not change the default persistence mode.

```bash
appendonly yes
```

After AOF persistence is enabled, every time Redis executes a command that modifies its data, Redis writes the command into the AOF buffer `server.aof_buf`, then writes it to the AOF file (at this point it is still in the OS kernel buffer and not yet synced to disk), and finally decides when to sync the data in the OS kernel buffer to the hard disk according to the configured persistence policy (`fsync` policy).

Data is only durably persisted once it is synced to disk; otherwise, there is still a risk of data loss. For example, if the machine crashes before data in the OS kernel buffer has been synced to disk, that portion of data will be lost.

The AOF file is stored in the same directory as the RDB file, both configured via the `dir` parameter, and its default filename is `appendonly.aof`.

### What Is the Basic Workflow of AOF?

The implementation of AOF persistence can be broken down into 5 steps:

1. **Command append (`append`)**: All write commands are appended to the AOF buffer.
2. **File write (`write`)**: Data in the AOF buffer is written to the AOF file. This step invokes the `write` function (a system call), which writes the data to the OS kernel buffer and returns immediately (delayed write). Note!!! At this point, it has not been synced to disk.
3. **File sync (`fsync`)**: This step is the core of persistence! Depending on the `appendfsync` policy configured in `redis.conf`, Redis calls the `fsync` function (a system call) at different times. `fsync` operates on a single file and forces a disk sync (flushing data from the kernel buffer to disk). `fsync` blocks until the disk write completes and then returns, guaranteeing data persistence.
4. **File rewrite (`rewrite`)**: As the AOF file grows larger and larger, it needs to be periodically rewritten to achieve compression.
5. **Startup load (`load`)**: When Redis restarts, it can load the AOF file to recover data.

> The Linux operating system directly provides a set of functions for accessing and controlling files and devices; these functions are called **system calls (syscalls)**.

Let's review the Linux system calls mentioned above once more:

- `write`: Returns immediately after writing to the OS kernel buffer (merely writing to the buffer) without immediately syncing to disk. Although this improves efficiency, it also introduces the risk of data loss. **Disk synchronization depends on the Linux kernel's Dirty Page Writeback policy**, which is mainly governed by the following parameters:
  - `/proc/sys/vm/dirty_expire_centisecs`: Dirty page expiration time (default: 30 seconds)
  - `/proc/sys/vm/dirty_writeback_centisecs`: Wake-up interval of the kernel writeback thread (default: 5 seconds)
  - System memory pressure: Syncing is triggered more aggressively when memory is low
- **This means that in `appendfsync no` mode, the amount of data potentially lost during a crash is uncontrollable and unpredictable**, depending on when the kernel last performed a sync.
- `fsync`: `fsync` is used to forcibly flush the OS kernel buffer (syncing to disk), ensuring it does not return until the disk write operation completes.

The AOF workflow diagram is as follows:

![Basic Workflow of AOF](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aof-work-process-de6bd5f8.png)

### What Are the AOF Persistence Modes?

There are three different AOF persistence modes (`fsync` policies) in the Redis configuration file:

1. `appendfsync always`: After the main thread calls `write` to perform a write operation, it immediately calls `fsync` to sync the AOF file (flush to disk). During this time, the main thread blocks until `fsync` completely flushes the data to disk and returns. Under the `always` policy, **the main thread executes `fsync` directly**, not a background thread. This approach provides the highest data safety and theoretically loses no data. However, because every write operation synchronously blocks the main thread, performance is extremely poor.
2. `appendfsync everysec`: After the main thread calls `write` to perform a write operation, it returns immediately, while a background thread (the `aof_fsync` thread) calls `fsync` (system call) once per second to sync the AOF file (`write` + `fsync`, with an `fsync` interval of 1 second). With this approach, the main thread's performance is largely unaffected, striking an excellent balance between performance and data safety. However, if Redis crashes abnormally, data from the last 1 second may normally be lost.

> **Production-Grade Reality (2-Second Data Loss and Blocking Risk)**:
>
> "At most 1 second of data loss" is the ideal case. When disk I/O is busy and background `fsync` takes too long, the main thread checks the completion time of the previous `fsync` before executing write commands. If more than 2 seconds have elapsed since the last successful `fsync`, the main thread is **forcibly blocked** to prevent memory from blowing up (the `aof_background_fsync` blocking check logic in Redis source file `aof.c`).
>
> Therefore, **under extreme crash conditions, up to 2 seconds of data may be lost**, and disk jitter directly causes Redis P99 latency to spike.
>
> **Mandatory monitoring metric**: `redis-cli INFO persistence | grep aof_delayed_fsync` (records the cumulative number of times the main thread was blocked by `fsync`; this field only exists when AOF is enabled).

3. `appendfsync no`: After the main thread calls `write` to perform a write operation, it returns immediately and lets the operating system decide when to perform the sync—typically once every 30 seconds on Linux (`write` without `fsync`; the timing of `fsync` is decided by the OS). This approach delivers the best performance because it avoids `fsync` blocking, but it offers the worst data safety: the amount of data lost during a crash is uncontrollable and depends on when the OS last synced.

As you can see, **the main difference among these 3 persistence modes lies in when `fsync` syncs the AOF file (flushes to disk)**.

To balance data durability and write performance, you can consider the `appendfsync everysec` option so Redis syncs the AOF file once per second with minimal impact on Redis performance. Under normal circumstances, even if a system crash occurs, users lose at most one second's worth of data. When the hard disk is busy executing write operations, Redis also gracefully slows down its own pace to adapt to the disk's maximum write speed.

> ⚠️ **Note**: When disk I/O bottlenecks are severe, the Redis main thread can block for up to 2 seconds waiting for `fsync`, expanding the data loss window to 2 seconds. Production environments should monitor the `aof_delayed_fsync` metric to evaluate disk health.

Starting from Redis 7.0.0, Redis introduced the **Multi Part AOF** mechanism. As the name implies, Multi Part AOF splits the original single AOF file into multiple AOF files. In Multi Part AOF, AOF files are divided into three types:

- BASE: Represents the base AOF file, generally produced by a child process through a rewrite; there is at most one such file.
- INCR: Represents incremental AOF files, generally created when AOFRW begins executing; multiple such files may exist.
- HISTORY: Represents historical AOF files, derived from BASE and INCR AOF files. Each time AOFRW completes successfully, the BASE and INCR AOF files corresponding to the period before that AOFRW become HISTORY files, which Redis deletes automatically.

Multi Part AOF is not the primary focus here—having a general understanding is enough. For a detailed introduction, you can read the Alibaba developer article [Design and Implementation of Redis 7.0 Multi Part AOF](https://zhuanlan.zhihu.com/p/467217082).

**Related issue**: [Redis AOF Mode #783](https://github.com/Snailclimb/JavaGuide/issues/783).

### Why Does AOF Log Commands After Executing Them?

Relational databases (such as MySQL) usually record logs *before* executing commands (to facilitate crash recovery), whereas Redis's AOF persistence mechanism logs commands *after* executing them.

![AOF Logging Process](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-aof-write-log-disc-7a4b70ef.png)

**Why log after executing the command?**

- Avoids extra checking overhead: AOF logging does not perform syntax checks on commands;
- Logging after command execution avoids blocking the execution of the current command.

However, this also brings risks (as mentioned earlier when introducing AOF persistence):

- If Redis crashes right after executing a command, the corresponding modification will be lost;
- It may block the execution of subsequent commands (AOF logging is performed on the Redis main thread).

### Do You Understand AOF Rewrite?

When the AOF file becomes too large, Redis can automatically rewrite the AOF in the background to produce a new AOF file that represents the exact same database state as the original AOF file, but with a smaller size.

![AOF Rewrite](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/aof-rewrite-85c7d34e.png)

> AOF rewrite is a somewhat misleading name: the feature works by reading the key-value pairs directly from the database, without reading, analyzing, or writing the existing AOF file at all.

Because AOF rewrite involves a large amount of writing, Redis runs the AOF rewrite routine in a child process to avoid interfering with normal command request handling.

During AOF file rewriting, Redis also maintains an **AOF rewrite buffer**, which records all write commands executed by the server while the child process is creating the new AOF file. Once the child process finishes creating the new AOF file, the server appends all contents of the rewrite buffer to the end of the new AOF file so that the database state saved by the new AOF file matches the current database state. Finally, the server replaces the old AOF file with the new AOF file to complete the rewrite operation.

To trigger AOF rewriting, you can invoke the `BGREWRITEAOF` command manually, or configure the following two parameters to let Redis determine when to trigger it automatically:

- `auto-aof-rewrite-min-size`: If the AOF file size is smaller than this value, AOF rewrite will not be triggered. Default is `64 MB`;
- `auto-aof-rewrite-percentage`: The percentage growth of the current AOF size (`aof_current_size`) compared to the AOF size at the previous rewrite (`aof_base_size`). If the current AOF file size has increased by this percentage, AOF rewrite is triggered. Setting this value to `0` disables automatic AOF rewrite. Default is `100`.

**Failure Boundaries and Risk Scenarios of AOF Rewrite**:

Although AOF rewrite runs in a child process, there are still several risks you should be aware of:

| Risk Scenario      | Impact                                   | Trigger Condition                   | Mitigation Measures                                              |
| ------------------ | ---------------------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| **fork failure**   | Unable to create rewrite child process   | Insufficient memory, OS limits      | Monitor memory usage, configure `maxmemory`                      |
| **Disk full**      | Failed to write new AOF file             | Rapid data growth during rewrite    | Monitor disk usage (`df -h`), set alert threshold at 70%         |
| **inode exhausted**| Unable to create new files               | Systems with too many small files   | Monitor inode usage (`df -i`), clean up temporary files          |
| **Clock rollback** | Multi-Part AOF file management disorder  | VM clock synchronization issues     | Configure NTP service, set `aof-timestamp-enabled`               |
| **SIGTERM signal** | Rewrite interrupted                      | Manual restart by ops engineers     | Configure graceful shutdown (`shutdown-timeout`)                 |

**Production Environment Monitoring Recommendations**:

```bash
# Monitor AOF rewrite status
redis-cli INFO persistence | grep aof_rewrite_in_progress

# Monitor AOF file size growth
redis-cli INFO persistence | grep aof_current_size
redis-cli INFO persistence | grep aof_base_size

# Check disk and inode usage
df -h /var/lib/redis
df -i /var/lib/redis

# Configure incremental fsync policy during AOF rewrite (Redis 7.0+)
# aof-rewrite-incremental-sync yes
```

Prior to Redis 7.0, if write commands arrived during a rewrite, AOF could consume a large amount of memory, and all write commands arriving during the rewrite would be written to disk twice.

Starting with Redis 7.0, the AOF rewrite mechanism was optimized and improved. The following excerpt is taken from an Alibaba developer's article [Looking at Redis's Past and Future from the Redis 7.0 Release](https://mp.weixin.qq.com/s/RnoPPL7jiFSKkx3G4p57Pg):

> How to handle incremental data during an AOF rewrite has always been a challenge. Previously, incremental data during the rewrite had to be kept in memory, and once the rewrite finished, that incremental data was written to the new AOF file to ensure data completeness. Clearly, AOF rewrite consumed extra memory and disk I/O—a long-standing pain point of Redis AOF rewrite. Even after several rounds of prior improvements, the fundamental issue of resource consumption remained unresolved.
>
> Alibaba Cloud's Redis Enterprise Edition initially encountered this problem as well. Through multiple internal iterations, it implemented the Multi-part AOF mechanism to solve it, and contributed it back to the community for release in Redis 7.0. Specifically, it stores `base` (full data) and `incr` (incremental data) in separate independent files, completely eliminating wasted memory and I/O resources. It also supports retaining and managing historical AOF files; combined with timestamp information in AOF files, it enables Point-in-Time Recovery (PITR, already supported in Alibaba Cloud Enterprise Edition Tair), further enhancing Redis data reliability and meeting user needs such as data rollback.

**Related issue**: [Inaccurate Description of Redis AOF Rewrite #1439](https://github.com/Snailclimb/JavaGuide/issues/1439).

### How Does an AOF File Verify Data Integrity?

**Core Conclusion**: Pure AOF files have **no** checksum mechanism and are verified solely through command-by-command parsing; CRC64 checksums exist only in the **RDB part** of hybrid persistence files.

#### Pure AOF Mode: No Checksum, Syntax Parsing Only

Pure AOF files do not compute a CRC64 checksum over the entire file or individual commands; instead, validity is verified by parsing the commands in the file one by one.

**Why is there no checksum?**

AOF is a high-frequency append-only text log. Recomputing a CRC64 checksum over the entire file on every appended command would severely drag down main-thread CPU and disk I/O. Therefore, Redis chose a lighter approach: reading and parsing command syntax one by one upon restart and load.

If a syntax error is encountered during parsing (such as an incomplete command or malformed format), Redis aborts loading and reports an error.

> **Tail Truncation Disaster Recovery (Automatic Recovery)**:
>
> In the event of an unexpected power outage or forced termination via `kill -9`, the last command in the AOF file is very likely partially written (only half-written). Recovery behavior in this case is controlled by the **`aof-load-truncated`** setting:
>
> | Config Value    | Behavior                                                                                               | Applicable Scenario                                                 |
> | --------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
> | `yes` (default) | Redis automatically discards the incomplete command at the tail of the file, completes startup, and logs a warning | Recommended in production; trades minor data loss for availability  |
> | `no`            | Redis refuses to start and directly errors out, requiring manual inspection and repair via `redis-check-aof`       | Financial or other scenarios requiring strict data integrity         |
>
> **Verify Truncation Recovery**:
>
> ```bash
> # Simulate a power-loss scenario: append meaningless garbage to the AOF file
> echo "truncated garbage data" >> /var/lib/redis/appendonly.aof
>
> # Restart Redis (recovers automatically when aof-load-truncated=yes)
> redis-server /path/to/redis.conf
> # Log output: # Bad file format reading the append only file: make a backup of your AOF file, then use ./redis-check-aof --fix <filename>
> ```
>
> **Failure Mode**: If garbage appears in the **middle** (rather than the tail) of the AOF file due to silent disk corruption, automatic tail truncation will not work, and Redis will crash and refuse to start. In this case, you must repair it using `redis-check-aof --fix`.

**How `redis-check-aof` Works**:

- **Detection phase**: Reads commands one by one according to the AOF file format, validates argument counts and argument string lengths, and reports the file offset of erroneous/incomplete commands.
- **Repair phase**: Truncates all file contents from the error offset onward (**Warning: all data after the truncation point will be lost**). The original file is backed up as `appendonly.aof.broken`.

#### Hybrid Persistence Mode: Segmented Verification Strategy

In **Hybrid Persistence mode** (introduced in Redis 4.0), the AOF file adopts a "segmented governance" verification strategy:

```
┌────────────────────────────────────────────────────────────────┐
│               Hybrid Persistence File Structure                │
├────────────────────────────────────────────────────────────────┤
│  RDB Snapshot Part (Binary)  ← Protected by CRC64 checksum     │
│  ├── "REDIS" header                                            │
│  ├── Database ID, key-value pairs...                           │
│  ├── EOF marker                                                │
│  └── CRC64 checksum (8 bytes)  ← Verification boundary here    │
├────────────────────────────────────────────────────────────────┤
│  AOF Incremental Part (Text) ← No checksum, syntax parse only  │
│  ├── *3\r\n$3\r\nSET\r\n...                                    │
│  └── ...                                                       │
└────────────────────────────────────────────────────────────────┘
```

- **RDB Snapshot Part**: Begins with the fixed characters `REDIS`, stores the in-memory data snapshot at a specific point in time, and appends a CRC64 checksum at the end of the snapshot data. This checksum sits **strictly at the end of the RDB data block**, safeguarding only the integrity of this binary snapshot portion.
- **AOF Incremental Part**: Immediately follows the RDB snapshot and records incremental write commands. This portion **still has no checksum** and uses the same command-by-command syntax parsing verification as pure AOF.

**Verification Flow During Loading**:

1. Redis first verifies the RDB snapshot part: it computes the CRC64 checksum over this segment and compares it with the stored checksum. If they do not match, Redis refuses to start.
2. After the RDB part passes verification, Redis parses the incremental AOF commands one by one. If a parsing error occurs, it stops loading subsequent commands (though the RDB snapshot data has already been loaded successfully at this point).

#### Configuration Options

| Option               | Scope                                                | Description                                                                        |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `rdbchecksum`        | RDB files, RDB part of hybrid persistence            | Controls whether CRC64 checksum is calculated; does not affect pure AOF increment  |
| `aof-load-truncated` | Pure AOF files, AOF incremental part of hybrid files | Controls whether to automatically discard truncated tail data and continue startup |

**Manual Patching** (advanced users):

- If you do not want to repair an AOF file by truncating it, you can attempt manual patching.
- Open the AOF file with a text editor (pure text format) and manually delete or fix the corrupted command.
- Suitable for specific scenarios where the exact error location is known.

## New Version Optimizations

### What Optimizations Did Redis 4.0 Make to Persistence Mechanisms?

Since both RDB and AOF have their own advantages, Redis 4.0 introduced support for hybrid persistence combining RDB and AOF.

#### Configuration

```bash
# Enable AOF
appendonly yes

# Enable hybrid persistence (enabled by default in Redis 7.0+)
aof-use-rdb-preamble yes

# Optimize rewrite trigger conditions
auto-aof-rewrite-percentage 100   # Trigger rewrite when AOF file size grows by 100% over the last rewrite
auto-aof-rewrite-min-size 64mb    # Trigger rewrite only when AOF file reaches at least 64MB
```

**Version Differences**:

- **Redis 4.0–6.x**: Hybrid persistence is disabled by default; requires manually setting `aof-use-rdb-preamble yes`.
- **Redis 7.0+**: Hybrid persistence is **enabled by default**, requiring no additional configuration.

#### Working Principle

When hybrid persistence is enabled, during an AOF rewrite, Redis writes the RDB content directly to the beginning of the AOF file. The advantage is that it combines the strengths of both RDB and AOF: fast loading while avoiding excessive data loss.

**Hybrid Persistence File Structure**:

```
┌───────────────────┐
│   RDB Header      │ ← Binary snapshot (compressed format)
│   REDIS0009       │
│   ...             │
├───────────────────┤
│   AOF Log Entries │ ← Text-format commands
│   *3\r\n$3\r\nSET\r\n$5\r\nkey01\r\n...
│   INCR counter    │
│   ...             │
└───────────────────┘
```

**Core Workflow**:

1. **Write Processing Phase**:

   - Client executes write commands (`SET/INCR`, etc.).
   - Redis immediately updates in-memory data.
   - Commands are appended to the AOF buffer (text format).

2. **Persistence Trigger Phase**:

   - AOF file size reaches the threshold (default 64MB) or grows by 100%.
   - Triggers AOF rewrite (`BGREWRITEAOF`).

3. **File Construction Phase**:

   - The child process writes the current in-memory data in RDB format to the beginning of the new AOF file.
   - The parent process continues handling write commands, recording incremental data in the rewrite buffer.
   - Once the rewrite completes, incremental commands from the rewrite buffer are appended to the end of the new AOF file.

4. **Data Recovery Phase**:
   - On startup, Redis first loads the RDB part (quickly restoring baseline data).
   - It then sequentially replays the AOF incremental commands (restoring the latest data).

#### Comparison of Advantages

| Metric               | Pure RDB          | Pure AOF           | Hybrid Persistence   |
| -------------------- | ----------------- | ------------------ | -------------------- |
| **Recovery Speed**   | Fast (seconds)    | Slow (minutes)     | Fast (seconds)       |
| **Data Loss Window** | Minutes           | ≤2 seconds         | ≤2 seconds           |
| **File Size**        | Small (compressed)| Large (text log)   | Medium               |
| **Write Impact**     | Low               | High               | Medium               |
| **Readability**      | Poor (binary)     | Good (text)        | Poor (RDB part)      |

**Benchmark Data** (1GB dataset, SSD):

- Pure AOF recovery: 30–60 seconds
- Hybrid persistence recovery: 2–5 seconds (**5–10x faster**)

**Disadvantages of Hybrid Persistence**:

- The RDB part inside the AOF file is in compressed binary format rather than AOF text format, reducing readability.
- Consumes extra CPU for RDB compression and decompression.

#### Common Issues and Solutions

**1. Configuration Verification**:

```bash
# Method 1: Check file header (outputting REDIS indicates hybrid persistence is enabled)
head -c 5 appendonly.aof

# Method 2: CLI verification
redis-cli CONFIG GET aof-use-rdb-preamble
# Output: 1) "aof-use-rdb-preamble"
#         2) "yes"
```

**2. Corrupted File Recovery**:

**Tool Overview**:

| Tool                | Working Principle                                                                                | Error Detection                                                | Repair Capability                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **redis-check-aof** | Reads commands sequentially per AOF format, checking argument counts, string lengths, etc.       | Detects command validity and completeness, reports error offset| ✅ **Supports repair**: truncates from error offset, or manual patching |
| **redis-check-rdb** | Reads file header, data section, and footer sequentially per RDB format                          | Validates content during reading and reports errors            | ❌ **Does not support repair**: detection only; requires manual repair  |

**Recovery Steps**:

```bash
# Step 1: Detect AOF file issues
redis-check-aof appendonly.aof
# Outputs error offset and cause

# Step 2: Repair AOF file (truncates from error offset)
redis-check-aof --fix appendonly.aof
# Original AOF file is backed up as appendonly.aof.broken

# Step 3: Check RDB portion
redis-check-rdb appendonly.aof
# Detection only; --fix option is not supported

# Step 4: If the RDB portion is corrupted, manually repair or discard the entire file
# Option A: Manual repair (requires knowledge of the RDB binary format)
# Option B: Delete the hybrid persistence file and recover using only pure RDB or pure AOF

# Step 5: Start Redis
redis-server --appendonly yes --appendfilename appendonly.aof
```

> **⚠️ Important Notice**:
>
> - **AOF files**: `redis-check-aof --fix` truncates the file starting from the error position, **losing all data after the truncation point**.
> - **RDB files**: `redis-check-rdb` **does not support repair**. If the RDB portion is corrupted, the entire hybrid persistence file cannot be recovered and you must rely on backups or pure AOF files.
> - **Manual repair**: For the RDB portion, if repair is strictly necessary, you must manually edit the binary format using a hex editor (such as `hexdump` or `xxd`).

#### Production Configuration Recommendations

```bash
# Complete production configuration example
appendonly yes
aof-use-rdb-preamble yes

# Performance optimization
aof-rewrite-incremental-fsync yes   # Incremental fsync to reduce disk I/O spikes
# Latency-sensitive scenarios (yes recommended)
no-appendfsync-on-rewrite yes       # Pause fsync during rewrite to avoid blocking
# Data-safety-critical scenarios (no recommended)
no-appendfsync-on-rewrite no        # Continue fsync during rewrite; may block but safer

# Capacity planning recommendations:
# - Reserve 2x memory as disk space
# - Keep a single AOF file < 16GB
# - Monitor the aof_delayed_fsync metric
```

Official documentation URL: <https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/>

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis4.0-persitence-5af100fe.png)

### What Optimizations Did Redis 7.0 Make to Persistence Mechanisms?

Because AOF rewrite previously suffered from buffering incremental data in memory and double disk writes, Redis 7.0 introduced support for Multi-Part AOF (enabled by default; the directory can be specified via `appenddirname`).

With Multi-Part AOF enabled, the AOF file is split into a `base` file (at most one, holding the initial full snapshot in either RDB or AOF format) and multiple `incr` files (incremental command logs). New commands arriving during a rewrite are written directly into a new `incr` file, with a `manifest` file tracking all parts. This eliminates memory buffering overhead and double I/O writes during rewrites, improving performance and reducing potential `fsync` blocking. Because files are separated, `INCR` files remain read-only before a rewrite, making single-file copying relatively safe; however, consistent cross-file backups still require pausing rewrites, making the overall backup workflow more complex than single-file AOF, and resource monitoring is still necessary on very large datasets.

> **Core Single Point of Failure Risk: `manifest` File Corruption**
>
> Multi-Part AOF relies on the **manifest file** to track and manage all `base/incr/history` files; it is the core metadata of the entire incremental logging system. If the manifest file is corrupted or lost:
>
> | Risk Scenario                           | Impact                                                                           | Recovery Difficulty                        |
> | --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
> | **Silent manifest corruption**          | Redis cannot properly identify and load AOF files on startup; DB cannot recover  | Extremely high (requires manual rebuild)   |
> | **Manifest lost due to disk failure**   | Even if base/incr files are intact, Redis cannot reconstruct file dependencies   | Extremely high (requires manual intervention)|
>
> **Mitigation Measures**:
>
> ```bash
> # 1. Back up the manifest file (as critical as the data files themselves)
> cp /var/lib/redis/appendonlydir/appendonly.aof.manifest /backup/
>
> # 2. Monitor disk health (detect failures early)
> smartctl -a /dev/sda | grep -E "SMART overall-health self-assessment|Media_Errors"
>
> # 3. Periodically verify manifest integrity (Redis also verifies automatically on startup)
> redis-check-aof /var/lib/redis/appendonlydir/appendonly.aof.manifest
> ```
>
> **No official automated repair tool is provided.** Production environments must include the `manifest` file in their backup strategy, treating its importance as equal to that of the RDB/AOF data files themselves.

## Production Environment Monitoring Metrics

### Persistence Performance Metrics

```bash
# RDB-related metrics
redis-cli INFO persistence | grep rdb_last_bgsave_time_sec
# Recommended: < 5s. Exceeding 5s indicates an overly large dataset or an I/O bottleneck

redis-cli INFO persistence | grep rdb_last_cow_size
# Recommended: < 10% used_memory. Higher values indicate heavy fork Copy-on-Write memory overhead

redis-cli INFO memory | grep used_memory_rss
redis-cli INFO memory | grep used_memory
# Calculation: used_memory_rss / used_memory; should be < 2 during fork

# AOF-related metrics
redis-cli INFO persistence | grep aof_rewrite_in_progress
# Expected: 0 (not rewriting) or 1 (rewriting in progress)

redis-cli INFO persistence | grep aof_current_size
redis-cli INFO persistence | grep aof_base_size
# Monitor growth rate to prevent overly frequent rewrites

redis-cli INFO persistence | grep aof_buffer_length
# Recommended: < 4MB. Oversized buffer indicates main thread writes faster than fsync can flush
```

### System Resource Monitoring

```bash
# Disk utilization and I/O wait
iostat -x 1 5 | grep dm-0
# Watch: %util (I/O utilization), await (average wait time)

# Disk space (reserve room for new files generated during rewrite)
df -h /var/lib/redis
# Recommended: usage < 70%

# inode utilization (for workloads with many small files)
df -i /var/lib/redis
# Recommended: usage < 90%

# Memory utilization
free -h
# Recommended: reserve at least 20% free memory for fork
```

### Alerting Rule Recommendations

> **Metric Source Notes**:
>
> - **Redis metrics**: Obtained via `redis-cli INFO` or Redis exporter (e.g., `redis_rss_memory`, `aof_current_size`)
> - **Node-level metrics**: Obtained via `node_exporter` or OS commands (e.g., `disk_usage`, system memory, CPU usage)
>
> The following alert rules assume a Prometheus + Redis exporter + `node_exporter` monitoring stack.

```yaml
alert_rules:
  # ── Redis Persistence Alerts ────────────────────────────────────
  - name: "RedisHighMemFragmentation"
    expr: redis_memory_rss_bytes / redis_memory_used_bytes > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High Redis memory fragmentation; elevated fork COW risk"
      description: >
        Instance {{ $labels.instance }} has mem_fragmentation_ratio = {{ $value | humanize }},
        exceeding threshold 2. High fragmentation means the OS allocates far more physical pages
        than Redis accounts for. After BGSAVE / BGREWRITEAOF triggers fork, the number of pages
        copied by COW rises significantly, potentially causing memory spikes and higher OOM risk
        under heavy write loads.
        Consider running MEMORY PURGE or restarting the instance during off-peak hours to defragment.

  - name: "RedisAofGrowthTooFast"
    expr: deriv(redis_aof_current_size_bytes[5m]) * 60 > 10485760
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Redis AOF write rate is too high"
      description: >
        Instance {{ $labels.instance }} AOF growth rate exceeds 10 MB/min
        (currently approx. {{ $value | humanize1024 }}B/min).
        High-speed writes will continuously trigger auto-aof-rewrite, increasing disk I/O pressure
        and causing write amplification. Check whether the application has a flood of small commands
        or full scans like KEYS.

  - name: "RedisAofFsyncDelayed"
    expr: rate(redis_aof_delayed_fsync_total[5m]) > 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Redis AOF fsync delayed; main thread responsiveness degraded"
      description: >
        Instance {{ $labels.instance }} shows continuous growth in aof_delayed_fsync;
        the main thread is blocked waiting for AOF fsync completion, directly degrading P99 command latency.
        Common causes: 1) Disk I/O bandwidth saturated; 2) appendfsync set to always;
        3) Sharing the disk with other high-I/O processes. Consider switching to everysec or moving to a dedicated disk.

  # ── Node-Level Resource Alerts ──────────────────────────────────
  - name: "RedisDiskUsageHigh"
    expr: >
      (1 - node_filesystem_avail_bytes{mountpoint="/var/lib/redis"}
         / node_filesystem_size_bytes{mountpoint="/var/lib/redis"}) * 100 > 70
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Redis data disk usage exceeds 70%"
      description: >
        Mountpoint /var/lib/redis is currently at {{ $value | humanize }}% usage.
        During AOF rewrite, temporary new files are generated, requiring ~1.5x the current AOF size
        in reserved space. Insufficient disk space will cause rewrite failure and trigger the Redis
        error log "MISCONF". The same applies to RDB bgsave.
      remediation: >
        1. Clean up expired RDB snapshots and historical AOF files;
        2. Increase auto-aof-rewrite-min-size to reduce rewrite frequency;
        3. Expand disk capacity or migrate the data directory to a larger partition.
```

## How to Choose Between RDB and AOF?

The official documentation also provides detailed explanations of the pros and cons of RDB and AOF in [Redis persistence](https://redis.io/docs/manual/persistence/). Here is a brief summary combining those details with practical understanding.

**Where RDB Is Better Than AOF**:

- **Compact files, ideal for backups and disaster recovery**: RDB files store compressed binary data representing a dataset at a specific point in time. Because the files are small, they are ideal for backups and disaster recovery. AOF files store every write command—similar to MySQL's binlog—and are usually much larger than RDB files. When AOF grows too large, Redis can automatically rewrite it in the background so that the new AOF file represents the same database state in a smaller size. However, prior to Redis 7.0, if write commands occurred during the rewrite, AOF could consume substantial memory and every command arriving during the rewrite would be written to disk twice.
- **Fast recovery speed**: Recovering data from an RDB file directly parses and restores the data without executing commands one by one, which is very fast. In contrast, AOF must execute each write command sequentially, making it much slower. Therefore, when restoring large datasets, RDB is faster than AOF.
- **Master-replica replication advantage**: On replicas, RDB supports **Partial Resynchronization** after restarts and failovers. A replica can use an RDB snapshot to quickly synchronize to a point-in-time state of the master node without requiring a full resynchronization.
- **Low performance overhead**: RDB maximizes Redis performance because the only persistence work the Redis parent process needs to do is fork a child process, which handles all remaining work. The parent process never performs disk I/O or similar operations.

**Where AOF Is Better Than RDB**:

- **Higher data safety, supporting second-level persistence**: RDB provides lower data safety than AOF and cannot persist data in real time or at second-level granularity. Generating an RDB file is a heavy operation; although the `BGSAVE` child process writing the RDB file does not block the main thread, it impacts machine CPU and memory resources and, in severe cases, can even crash the Redis service. AOF supports second-level data loss limits (depending on the `fsync` policy—with `everysec`, at most 1 second of data is typically lost, though under heavy disk I/O up to 2 seconds may be lost and the main thread will block), and simply appending commands to the AOF file is a lightweight operation.
- **Better version compatibility**: RDB files are stored in a specific binary format, and multiple RDB versions have emerged as Redis evolved, leading to compatibility issues where older Redis servers cannot read newer RDB formats.
- **Strong readability and operability**: AOF logs all operations in an easy-to-understand and easy-to-parse format. You can easily export an AOF file for analysis or directly manipulate it to fix issues. For instance, if you accidentally wipe everything with `FLUSHALL`, as long as the AOF file has not been rewritten, you can simply delete the last command and restart Redis to restore the previous state.
- **Append-only log with no corruption risk**: The AOF log is an append-only log with no seeks and no power-outage corruption issues. Even if the log ends with a half-written command for any reason (such as a full disk or other causes), the `redis-check-aof` tool can easily repair it.

**Impact of Version Evolution on Selection**:

| Version       | Key Improvement                                    | Impact on AOF                                                               | Significance for Selection                                                             |
| ------------- | -------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Redis 4.0** | Introduced hybrid persistence (`aof-use-rdb-preamble`) | Base file uses RDB format on rewrite; recovery speed improved by 5–10x      | Mitigates slow pure-AOF loading, though rewrite memory and I/O overhead still need attention |
| **Redis 7.0** | Introduced Multi-Part AOF                          | Eliminates double-write during rewrite; memory and I/O overhead drop sharply| Using AOF alone becomes more practical in production, though fork blocking remains unsolved |

**Unresolved Core Issues**:

- **fork blocking**: Whether using RDB `bgsave` or AOF rewrite, the `fork` operation itself blocks the main thread (the larger the dataset, the longer the blocking time).
- **Official recommendation**: Redis's official documentation still recommends **enabling both RDB and AOF**, using RDB as an extra cold backup to guard against extreme scenarios such as AOF file corruption or write errors.

**Interaction Between AOF and RDB**:

When both AOF and RDB persistence are enabled:

- **Avoid concurrent heavy I/O operations**: Redis 2.4+ ensures that an AOF rewrite is not triggered while an RDB snapshot is in progress, and does not allow `BGSAVE` during an AOF rewrite. This prevents two Redis background processes from performing heavy disk I/O simultaneously.
- **AOF rewrite scheduling**: When a snapshot is in progress and a user explicitly requests a log rewrite (via `BGREWRITEAOF`), the server returns an `OK` status code informing the user that the operation has been scheduled and the rewrite will start once the snapshot finishes.
- **Restart recovery priority**: If both AOF and RDB persistence are enabled and Redis restarts, **the AOF file will be used to reconstruct the original dataset**, as it is guaranteed to be the most complete.

**Selection Recommendations**:

| Scenario                                  | Recommended Approach                                                         | Description                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Pure cache (loss-tolerant)**            | **Disable persistence** or RDB only (low frequency)                          | Disabling completely has lowest overhead; keep low-frequency RDB if cold backup needed |
| **Medium data importance** (sessions, configs) | **RDB + AOF hybrid persistence** (Redis 4.0+)                           | RDB speeds up recovery; AOF adds increments; `everysec` loses at most ~1s     |
| **High data importance** (core business data) | **RDB + AOF (MP-AOF, Redis 7.0+)**, using Redis as a cache layer rather than the sole store | MP-AOF lowers rewrite overhead; true persistence handled by primary DB (MySQL, etc.) |
| **Master-replica architecture**           | **Disable persistence on master, enable AOF on replicas**                    | Disable auto-restart on master to prevent an empty dataset from overwriting replicas |

## References

- *Redis Design and Implementation*
- Redis persistence - Redis Official Documentation: <https://redis.io/docs/management/persistence/>
- The difference between AOF and RDB persistence: <https://www.sobyte.net/post/2022-04/redis-rdb-and-aof/>
- Redis AOF Persistence Explained - Programmer Li Xiaobing: <http://remcarpediem.net/article/376c55d8/>
- Redis RDB and AOF Persistence · Analyze: <https://wingsxdu.com/posts/database/redis/rdb-and-aof/>
