---
title: In-Depth Guide to MySQL's Three Major Logs (binlog, redo log, and undo log)
description: An in-depth analysis of MySQL's three major logs—binlog, redo log, and undo log—exploring their roles, principles, how the two-phase commit mechanism guarantees data consistency, and their applications in crash recovery and master-slave replication.
category: Database
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL logs,binlog,redo log,undo log,two-phase commit,crash recovery,master-slave replication,WAL,transaction log
lang: en
sourceRef: zh-ref/database/mysql/mysql-logs.md
---

> This article was contributed by WeChat Official Account "Programmer A-Xing" (Programmer A-Xing) and supplemented/improved by JavaGuide.

## Introduction

MySQL logs mainly fall into several categories: error log, query log, slow query log, transaction logs, and binary log. Among them, the most critical ones are the binary log `binlog` (archive log) and the transaction logs `redo log` (redo log) and `undo log` (rollback log).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/01-b2beb336.png)

Today, let's talk in detail about `redo log`, `binlog`, two-phase commit (2PC), and `undo log`.

## redo log

The `redo log` is unique to the InnoDB storage engine; it endows MySQL with crash recovery capabilities.

For example, if a MySQL instance crashes or powers off, upon restart, the InnoDB storage engine uses the redo log to recover data, ensuring data durability and integrity.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/02-68a5b2d0.png)

In MySQL, data is managed in units of pages. When you query a record, a full page of data is loaded from the hard disk. The loaded data is called a data page and is placed into the `Buffer Pool`.

Subsequent queries first look in the `Buffer Pool`. If there is a cache miss, data is loaded from the disk, reducing disk I/O overhead and boosting performance.

When updating table data, the same principle applies: if the data to be updated already exists in the `Buffer Pool`, it is modified directly in the `Buffer Pool`.

Then, a record of "what changes were made to which data page" is written to the redo log cache (`redo log buffer`), and subsequently flushed to the disk into the redo log files.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/03-fc25a2c5.png)

> Typo note in image: In step 4, the phrase "flush redo log buffe to redo log" contains a typo—buffe should be buffer.

Ideally, a flush-to-disk operation would occur as soon as a transaction commits. In practice, however, the timing of flushing is determined by configured policies.

> Tip: Each redo log record is composed of "tablespace number + data page number + offset + modified data length + specific modified data".

### Flush Timing

In the InnoDB storage engine, the **redo log buffer** is a memory area used to temporarily hold redo log entries. To ensure transaction durability and data consistency, InnoDB flushes log data from this buffer to the redo log files on disk at specific times. These timings can be summarized into the following six scenarios:

1. **At transaction commit (the most critical)**: When a transaction commits, the redo logs in the log buffer are flushed to disk (controlled by the `innodb_flush_log_at_trx_commit` parameter, discussed below).
2. **When redo log buffer space is insufficient**: This is an active capacity management strategy of InnoDB designed to prevent user threads from blocking due to a full buffer.
   - When the used space in the redo log buffer exceeds **half (50%)** of its total capacity, a background thread **actively** flushes this portion of logs to disk to free up space for subsequent log writes—a proactive optimization.
   - If large transactions or heavy I/O cause the buffer to become **completely full**, all user threads attempting to write new log entries will be **blocked** and forced to perform a synchronous disk flush until usable space becomes available. This scenario impacts database performance and should be avoided whenever possible.
3. **When a Checkpoint is triggered**: Checkpoints are a core mechanism designed by InnoDB to shorten crash recovery time. When a Checkpoint is triggered, InnoDB must flush all dirty pages modified before this checkpoint to disk. According to the **Write-Ahead Logging (WAL)** principle, before data pages can be written to disk, their corresponding redo logs must reach disk first. Therefore, executing a Checkpoint inherently guarantees that relevant redo logs have already been flushed to disk.
4. **Periodic background thread flushing**: InnoDB has a background master thread that executes routine tasks roughly once per second, which includes flushing logs from the redo log buffer to disk. This mechanism is the primary durability guarantee when `innodb_flush_log_at_trx_commit` is set to 0 or 2.
5. **Normal server shutdown**: During a graceful MySQL server shutdown, to ensure all committed transaction data is fully preserved, InnoDB performs a final flush operation, clearing all remaining logs in the redo log buffer and writing them to disk files.
6. **During binlog rotation/switching**: When binlog is enabled and MySQL adopts the "double 1" configuration (`innodb_flush_log_at_trx_commit=1` and `sync_binlog=1`), to maintain state consistency between redo log and binlog (for crash recovery or replication), a redo log flush is triggered whenever a binlog file fills up or when `flush logs` is executed manually to switch log files.

In short, InnoDB flushes the redo log under multiple conditions to guarantee data durability and consistency.

We must pay close attention to configuring the appropriate flush policy via `innodb_flush_log_at_trx_commit`. Depending on how MySQL's flush policy is configured, there may be minor data loss if MySQL crashes.

The `innodb_flush_log_at_trx_commit` parameter has 3 possible values, corresponding to 3 flush strategies:

- **0**: When set to 0, no flush-to-disk operation is performed upon transaction commit. This provides the highest performance but is the least safe; if MySQL crashes or the OS goes down, transactions committed within the last 1 second may be lost.
- **1**: When set to 1, a flush-to-disk operation is executed every time a transaction commits. This option has the lowest performance but offers the highest safety; as long as a transaction commits successfully, its redo log records are guaranteed to be on disk, with zero data loss.
- **2**: When set to 2, upon transaction commit, redo log entries from the log buffer are only written to the OS page cache (filesystem cache). The page cache is specifically used for caching files, which here are the redo log files. Both performance and safety sit between 0 and 1.

The default value of `innodb_flush_log_at_trx_commit` is 1, and setting it to 1 is required to prevent any data loss. To guarantee transaction durability, we must set it to 1.

Additionally, InnoDB has a background thread that writes the contents of the `redo log buffer` to the filesystem cache (`page cache`) every `1` second, and then calls `fsync` to flush to disk.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/04-f8e27d86.png)

This means that redo log records belonging to uncommitted transactions may also be flushed to disk.

**Why?**

Because while a transaction is executing, redo log records are written into the `redo log buffer`, and these records can be flushed to disk by the background thread.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/05-47313521.png)

Beyond the background thread's once-per-second polling, there is another scenario: when the space occupied by `redo log buffer` is about to reach half of `innodb_log_buffer_size`, the background thread actively flushes it to disk.

Below are flowcharts illustrating the different flush strategies.

#### innodb_flush_log_at_trx_commit=0

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/06-8fe332a7.png)

When set to `0`, if MySQL crashes or powers off, up to `1` second of transaction data may be lost.

#### innodb_flush_log_at_trx_commit=1

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/07-aa39238e.png)

When set to `1`, as long as a transaction commits successfully, its redo log records are guaranteed to be on disk, with zero data loss.

If MySQL crashes while a transaction is actively executing, those logs may be lost, but since the transaction was never committed, losing those logs results in no loss of committed state.

#### innodb_flush_log_at_trx_commit=2

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/09-f8750c7e.png)

When set to `2`, as long as a transaction commits successfully, the contents of `redo log buffer` are only written to the filesystem cache (`page cache`).

If only the MySQL process crashes, no data is lost; however, if the OS crashes or loses power, up to `1` second of data may be lost.

### Log File Group

The redo log files stored on disk are not solitary; they exist in the form of a **log file group**, where each `redo` log file has the exact same size.

For instance, a group can be configured with `4` files, each `1GB` in size, allowing the entire redo log file group to record `4GB` of data.

It operates as a circular buffer: writing starts from the beginning, proceeds to the end, and wraps back to the beginning in a continuous loop, as shown below.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/10-8d3b351b.png)

Within this **log file group**, there are two crucial pointers: `write pos` and `checkpoint`.

- **write pos** is the current writing position, advancing as new logs are written.
- **checkpoint** is the current erase position, which also advances forward.

Each time redo log records are flushed to the **log file group**, `write pos` moves backward (advances).

Each time MySQL loads the **log file group** to recover data, it clears the processed redo log records and advances the `checkpoint`.

The empty space between `write pos` and `checkpoint` is available for writing new redo log records.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/11-0620efb4.png)

If `write pos` catches up with `checkpoint`, it means the **log file group** is full. At this point, no new redo log records can be written; MySQL must pause, flush dirty pages to disk, clear some records, and advance `checkpoint`.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/12-83786083.png)

Note that starting from MySQL 8.0.30, the log file group underwent some notable changes:

> The innodb_redo_log_capacity variable supersedes the innodb_log_files_in_group and innodb_log_file_size variables, which are deprecated. When the innodb_redo_log_capacity setting is defined, the innodb_log_files_in_group and innodb_log_file_size settings are ignored; otherwise, these settings are used to compute the innodb_redo_log_capacity setting (innodb_log_files_in_group \* innodb_log_file_size = innodb_redo_log_capacity). If none of those variables are set, redo log capacity is set to the innodb_redo_log_capacity default value, which is 104857600 bytes (100MB). The maximum redo log capacity is 128GB.

> Redo log files reside in the #innodb_redo directory in the data directory unless a different directory was specified by the innodb_log_group_home_dir variable. If innodb_log_group_home_dir was defined, the redo log files reside in the #innodb_redo directory in that directory. There are two types of redo log files, ordinary and spare. Ordinary redo log files are those being used. Spare redo log files are those waiting to be used. InnoDB tries to maintain 32 redo log files in total, with each file equal in size to 1/32 \* innodb_redo_log_capacity; however, file sizes may differ for a time after modifying the innodb_redo_log_capacity setting.

This means that prior to MySQL 8.0.30, the number of files and file size in a log file group were configured via `innodb_log_files_in_group` and `innodb_log_file_size`. But in MySQL 8.0.30 and later versions, these two variables are deprecated; even if specified, they are only used to compute `innodb_redo_log_capacity`. The number of files in the log file group is fixed at 32, with each file sized at `innodb_redo_log_capacity / 32`.

We can verify this change experimentally.

First, create a configuration file setting `innodb_log_files_in_group` and `innodb_log_file_size`:

```properties
[mysqld]
innodb_log_file_size = 10485760
innodb_log_files_in_group = 64
```

Start a MySQL 8.0.32 container via Docker:

```bash
docker run -d -p 3312:3309 -e MYSQL_ROOT_PASSWORD=your-password -v /path/to/your/conf:/etc/mysql/conf.d --name MySQL830 mysql:8.0.32
```

Now let's examine the startup logs:

```plain
2023-08-03T02:05:11.720357Z 0 [Warning] [MY-013907] [InnoDB] Deprecated configuration parameters innodb_log_file_size and/or innodb_log_files_in_group have been used to compute innodb_redo_log_capacity=671088640. Please use innodb_redo_log_capacity instead.
```

This clearly indicates that `innodb_log_files_in_group` and `innodb_log_file_size` are deprecated and used only to calculate `innodb_redo_log_capacity`.

Let's check the number of files in the log file group:

![](/media/jg/local/database/mysql/images/redo-log-1c0ecd.png)

As we can see, there are exactly 32 files, and each log file is sized at `671088640 / 32 = 20971520` bytes.

Therefore, when using MySQL 8.0.30 and later versions, it is recommended to use the `innodb_redo_log_capacity` variable to configure redo log capacity.

### redo log Summary

By now, everyone should understand the purpose, flush timing, and storage structure of redo logs.

Now let's ponder a question: **Why can't we simply flush the modified data pages directly to disk every time? Why do we need redo log at all?**

Aren't both operations disk flushes? What's the difference?

```java
1 Byte = 8bit
1 KB = 1024 Byte
1 MB = 1024 KB
1 GB = 1024 MB
1 TB = 1024 GB
```

In reality, a data page is `16KB` in size, making page flushing time-consuming. You might have only modified a few bytes within a data page—is it worth flushing an entire 16KB data page to disk?

Furthermore, data page flushing involves random writes because the pages being modified might reside at arbitrary locations within disk files, leading to poor I/O performance.

In contrast, when writing to redo logs, a single record may only occupy several dozen bytes, containing only the tablespace number, page number, disk file offset, and updated value. Coupled with sequential writes, flushing redo logs is extremely fast.

Therefore, recording modifications via redo logs outperforms flushing data pages by orders of magnitude, greatly enhancing database concurrency.

> Note: In-memory data pages will indeed be flushed to disk under certain conditions, a process known as page flushing/checkpointing, which will be discussed in detail when covering `Buffer Pool`.

## binlog

The redo log is a physical log recording "what modifications were made to which data page", belonging to the InnoDB storage engine.

The binlog, on the other hand, is a logical log recording the original statement logic, such as "add 1 to field c of the row where ID=2", belonging to the `MySQL Server` layer.

Regardless of which storage engine is used, whenever table data is updated, binlog records are generated.

So what exactly is binlog used for?

It is safe to say that MySQL's **data backups, master-slave, master-master, and active-standby replication** all depend heavily on binlog. They rely on binlog to synchronize data and maintain consistency across nodes.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/01-20220305234724956-ebbc7fbf.png)

The binlog records all logical operations involving data changes, and it is written sequentially.

### Recording Formats

Binlog has three formats, which can be configured via the `binlog_format` parameter:

- **statement**
- **row**
- **mixed**

When `statement` is configured, the recorded content is the original `SQL` statement text. For example, executing `update T set update_time=now() where id=1` produces a record like this:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/02-20220305234738688-0bf22b0e.png)

During data synchronization, the recorded `SQL` statement is re-executed. However, there is a problem: `update_time=now()` evaluates the current system time, and re-executing it on replicas will lead to data inconsistencies with the primary database.

To resolve this issue, we can specify `row` format. The recorded content is no longer a simple `SQL` statement, but rather the exact data of the affected rows:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/03-20220305234742460-0cbf0868.png)

Detailed contents in `row` format cannot be viewed directly; they must be parsed using the `mysqlbinlog` tool.

Here, `update_time=now()` is converted into a concrete timestamp `update_time=1627112756247`, and @1, @2, @3 following the WHERE clause represent original values of fields 1 through 3 in that row (**assuming this table has only 3 columns**).

This ensures consistency during data synchronization. In production, `row` format is typically specified as it provides superior reliability for database recovery and replication.

However, `row` format requires more storage capacity, consumes more disk space, and incurs higher I/O overhead during replication and recovery, potentially affecting throughput.

Hence, a compromise was introduced: `mixed` format, which combines both approaches.

MySQL evaluates whether a given `SQL` statement might cause data inconsistency across replicas. If it might, it logs using `row` format; otherwise, it logs using `statement` format.

### Write Mechanism

The timing of writing binlog is straightforward: during transaction execution, logs are first written to the `binlog cache`; upon transaction commit, the `binlog cache` is written to the binlog files.

Because a transaction's binlog cannot be split across files—no matter how large the transaction is, it must be written in an atomic chunk—the system allocates a block of memory to each thread as its `binlog cache`.

We can configure the per-thread binlog cache size using the `binlog_cache_size` parameter. If the content exceeds this threshold, it is temporarily swapped to disk (`Swap`).

The binlog flush-to-disk process is illustrated below:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/04-20220305234747840-db054429.png)

- **The `write` in the diagram refers to writing the log into the filesystem's page cache without persisting it to physical disk, which is very fast.**
- **The `fsync` in the diagram is the operation that actually persists the data to disk.**

The timing of `write` and `fsync` can be controlled by the `sync_binlog` parameter, which defaults to `1`.

When set to `0`, each transaction commit only invokes `write`, leaving the timing of `fsync` to the operating system.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/05-20220305234754405-0d718da8.png)

Although performance improves, if the server crashes, binlog data in `page cache` will be lost.

For safety, it can be set to `1`, meaning every transaction commit will invoke `fsync`, identical to the **redo log flush process**.

Finally, there is a middle ground: setting it to `N (N > 1)`, which means every transaction commit performs `write`, but `fsync` is executed only after `N` transactions accumulate.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/06-20220305234801592-b2556cae.png)

In I/O-bound scenarios, setting `sync_binlog` to a larger value can boost performance.

However, if the machine crashes, the binlog logs for the most recent `N` transactions will be lost.

## Two-Phase Commit

The redo log gives the InnoDB storage engine its crash recovery capability.

The binlog guarantees data consistency across a MySQL cluster architecture.

Although both serve durability guarantees, their points of emphasis differ.

During an update statement's execution, both redo log and binlog are recorded. At the granularity of transactions, redo logs can be continuously written throughout transaction execution, whereas binlogs are only written upon transaction commit. Thus, their write timings are different.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/01-20220305234816065-877d8070.png)

Returning to our topic: what happens if the redo log and binlog become logically inconsistent?

Let's illustrate with an `update` statement. Suppose a row with `id=2` has `c=0`, and we update field `c` to `1` via `update T set c=1 where id=2`.

Suppose an error occurs while writing the binlog after the redo log has already been written. What happens?

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/02-20220305234828662-83e380aa.png)

Because the failure occurred before binlog finished writing, the binlog does not contain this update. Later, when using binlog to restore data or sync replicas, this update will be missing, leaving row `c` as `0`. Meanwhile, on the primary server, recovery via redo log restores row `c` to `1`, resulting in data inconsistency.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/03-20220305235104445-7192813a.png)

To solve the logical consistency issue between the two logs, InnoDB uses a **Two-Phase Commit (2PC)** scheme.

The principle is simple: writing the redo log is split into two steps: `prepare` and `commit`. This constitutes **two-phase commit**.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/04-20220305234956774-a7cde4d1.png)

With **two-phase commit**, a crash during binlog writing causes no harm: when MySQL recovers data using the redo log, it notices the redo log is still in the `prepare` phase and lacks a corresponding binlog entry, so it rolls back the transaction.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/05-20220305234937243-3801360e.png)

Let's examine another scenario: what if a crash occurs when redo log is being set to the `commit` phase? Will the transaction be rolled back?

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/06-20220305234907651-78fd9335.png)

The transaction will not be rolled back. It executes the logic highlighted in the box above: even though the redo log is in the `prepare` stage, MySQL finds the matching binlog entry using the transaction `id`. MySQL therefore considers the transaction complete, commits it, and recovers the data.

## undo log

> This section was added as a supplement by JavaGuide:

Every modification made by a transaction is recorded in the undo log. If an error occurs during transaction execution or if a rollback is requested, MySQL can use the undo log to restore data to the state it was in before the transaction began.

The undo log is a logical log that records SQL operations. For instance, if a transaction executes a DELETE statement, the undo log records an equivalent INSERT statement. At the same time, undo log information is also recorded in the redo log, because undo log itself requires durability protection. Furthermore, undo logs are cleaned up and deleted: for INSERT operations, they can be purged immediately after transaction commit; for UPDATE/DELETE operations, they are not purged immediately upon commit, but are added to a history list and cleaned up asynchronously by a background purge thread.

Undo logs are organized in segments: each undo operation occupies an **undo log segment** when recorded, and undo log segments are contained within a **rollback segment**. When a transaction starts, it is allocated a rollback segment. Each rollback segment contains 1024 undo log segments, which helps manage rollback requirements for multiple concurrent transactions.

Typically, the **rollback segment header** (usually located in the first page of a rollback segment) manages the rollback segment. The **history list** is part of the rollback segment header, and its main role is to track all undo logs of committed transactions that have not yet been purged. This list enables the purge thread to locate and purge unneeded undo log records.

Additionally, the implementation of `MVCC` relies on: **hidden fields, Read View, and undo log**. Internally, InnoDB evaluates data visibility using the row's `DB_TRX_ID` and the transaction's `Read View`. If not visible, it traverses historical versions in the undo log via the row's `DB_ROLL_PTR`. Different transactions may read different versions of the data; within the same transaction, a user can only see modifications committed before the creation of that transaction's `Read View`, plus modifications made by the transaction itself.

## Summary

> This section was added as a supplement by JavaGuide:

The MySQL InnoDB engine uses **redo log** to guarantee transaction **durability**, and **undo log** to guarantee transaction **atomicity**.

MySQL database **backups, active-standby, master-master, and master-slave replication** all depend on binlog to synchronize data and guarantee consistency.

## References

- "45 Lectures on MySQL in Practice"
- "From Zero to Master: MySQL Performance Optimization in Practice"
- "How MySQL Works: Understanding MySQL from the Roots"
- "MySQL Technology: InnoDB Storage Engine"
