---
title: Execution Process of SQL Statements in MySQL
description: Detailed explanation of the complete execution flow of a SQL statement in MySQL, from Connector authentication, Query Cache, Analyzer syntax parsing, and Optimizer execution plan generation to the Executor calling the Storage Engine.
category: Databases
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Execution Flow,SQL Execution Process,Connector,Parser,Optimizer,Executor,Server Layer,Storage Engine,InnoDB
lang: en
sourceRef: zh-ref/database/mysql/how-sql-executed-in-mysql.md
---

> Contributed by [Mumujiang](https://github.com/kinglaw1204).

This article analyzes the execution flow of a SQL statement in MySQL, including how a SQL query flows internally through MySQL and how a SQL update statement is completed.

Before analyzing the flow, I will first walk you through MySQL's basic architecture. Knowing what components MySQL consists of and what each component does will help us understand and troubleshoot these issues.

## 1. MySQL Basic Architecture Analysis

### 1.1 Overview of MySQL Basic Architecture

The diagram below is a simplified architecture diagram of MySQL. From it, you can clearly see how a user's SQL statement is executed inside MySQL.

Let's briefly introduce the basic roles of the components shown below to help you understand the diagram; Section 1.2 will explain the functions of these components in detail.

- **Connector:** Handles identity authentication and permission checks (when logging in to MySQL).
- **Query Cache:** When executing a query statement, MySQL checks the cache first (removed in MySQL 8.0 because this feature is not practical in most real workloads).
- **Analyzer:** On a cache miss, the SQL statement passes through the Analyzer. Simply put, the Analyzer first determines what your SQL statement intends to do and then checks whether its syntax is valid.
- **Optimizer:** Chooses what MySQL considers the optimal execution plan.
- **Executor:** Executes the statement and returns data from the Storage Engine.

![](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

Put simply, MySQL is primarily divided into the **Server Layer** and the **Storage Engine Layer**:

- **Server Layer**: Mainly includes the Connector, Query Cache, Analyzer, Optimizer, Executor, and so on. All cross-storage-engine features are implemented in this layer, such as stored procedures, triggers, views, and functions, along with a general-purpose logging module, the `binlog` module.
- **Storage Engine Layer**: Primarily responsible for storing and reading data. It uses a pluggable architecture that supports multiple storage engines such as InnoDB, MyISAM, and Memory. Among them, the InnoDB engine has its own logging module, the `redo log` module. **Today, the most commonly used storage engine is InnoDB, which has been the default storage engine since MySQL 5.5.**

### 1.2 Introduction to Core Server Layer Components

#### 1) Connector

The Connector is mainly responsible for identity authentication and permission-related functions—much like a high-level gatekeeper.

It handles user logins to the database, authenticates the user's identity, including verifying username, password, and permissions. Once the account and password pass verification, the Connector looks up all of the user's permissions from the privilege tables. Thereafter, all permission checks within this connection rely on the permission data read at connection time. That means as long as this connection remains open, even if an administrator modifies the user's permissions, that user will not be affected.

#### 2) Query Cache (Removed in MySQL 8.0)

The Query Cache is primarily used to cache the `SELECT` statements we execute along with their result sets.

After a connection is established, when executing a query statement, MySQL first checks the Query Cache to see whether this SQL statement has been executed before. It is cached in memory in a Key-Value format, where the Key is the query statement and the Value is the result set. If the cache key hits, the result is returned directly to the client; if it misses, MySQL proceeds with subsequent operations and caches the result after completion for the next invocation. Of course, when actually checking the Query Cache, MySQL still validates the user's permissions, such as whether the user has query permissions on that table.

MySQL does not recommend using the Query Cache, because cache invalidation can occur very frequently in real business scenarios: if you update a table, all query caches on that table are cleared. For data that is rarely updated, using the cache can still work.

Therefore, in most cases, we do not recommend using the Query Cache.

MySQL removed the Query Cache feature starting in version 8.0, as the official team also believed it had relatively few practical use cases and removed it outright.

#### 3) Analyzer

If MySQL misses the cache, the SQL enters the Analyzer. The Analyzer mainly analyzes what the SQL statement is intended to do, and it works in two steps:

**Step 1: Lexical Analysis.** A SQL statement consists of multiple strings; MySQL first extracts keywords (such as `select`), identifies the table to query, extracts column names, extracts query conditions, and so on. After completing these steps, it moves to Step 2.

**Step 2: Syntax Analysis.** This step mainly determines whether the SQL you entered is valid and conforms to MySQL's grammar rules.

After completing these two steps, MySQL is ready to start execution—but how should it execute, and which approach yields the best result? At this point, the Optimizer steps in.

#### 4) Optimizer

The Optimizer's role is to execute the query using what it considers the optimal execution plan (though sometimes it may not actually be optimal; this article touches on an in-depth explanation of this area), such as choosing which index to use when multiple indexes exist, or choosing the join order in multi-table queries.

It can be said that once the SQL passes through the Optimizer, how the statement will specifically be executed has already been decided.

#### 5) Executor

Once the execution plan is selected, MySQL is ready to execute. Before executing, it first checks whether the user has permission; if not, it returns an error. If the user has permission, it calls the Storage Engine's interface and returns the result from the engine.

## 2. Statement Execution Analysis

### 2.1 Query Statements

With all of the above covered, how exactly is a SQL statement executed? In fact, SQL statements can be divided into two categories: queries and updates (insert, modify, delete). Let's first analyze a query statement:

```sql
select * from tb_student  A where A.age='18' and A.name=' 张三 ';
```

Combining this with the explanation above, let's trace the execution flow of this statement:

- First, authentication and permission retrieval are performed via the Connector (if authentication fails, the request is rejected directly). Prior to MySQL 8.0, after authentication succeeds, MySQL checks the Query Cache first using this SQL statement as the key in memory; if a result exists, it returns from cache directly, and if not, it moves to the next step.
- Next, the Analyzer performs lexical analysis, extracting key elements of the SQL statement—for example, identifying that the statement above is a `select` query, extracting the table name `tb_student`, determining that all columns need to be queried, and that the query condition on this table is `id='1'`. Then it checks whether the SQL statement has syntax errors (such as whether keywords are correct, etc.), and if everything checks out, proceeds to the next step.
- Next, the Optimizer determines the execution plan. For the SQL statement above, there can be two execution plans: a. first query students in the `tb_student` table whose `name` is `' 张三 '` (Zhang San), and then check whether their age is 18; b. first find students aged 18, and then check whether their `name` is `' 张三 '` (Zhang San). The Optimizer uses its optimization algorithm to pick the plan with the best execution efficiency (in the Optimizer's estimation, which may not always be the absolute best). Once the execution plan is confirmed, MySQL prepares to execute.
- Permission verification is performed: if the user lacks permission, an error is returned; if the user has permission, the database engine interface is invoked and the engine's execution result is returned.

### 2.2 Update Statements

That covers the execution flow of a query SQL. Next, let's look at how an update statement is executed. Consider the following SQL statement:

```plain
update tb_student A set A.age='19' where A.name=' 张三 ';
```

Here we update Zhang San's age. In a real production database, you would definitely not design an `age` column like this—otherwise your tech lead would chew you out. In fact, this statement basically follows the same flow as the query above, except that performing an update definitely requires writing logs, which brings in the logging modules. MySQL's built-in logging module is **`binlog` (binary/archive log)**, which can be used by all storage engines. The InnoDB engine we commonly use also comes with its own logging module, **`redo log`**. Let's examine the execution flow of this statement under InnoDB:

- First, locate the record for Zhang San. This will not hit the Query Cache, because the Query Cache is designed solely to serve read/query statements.
- Next, take the queried row, change `age` to `19`, and call the engine API to write this row. The InnoDB engine updates the data in memory while recording the `redo log`. At this point, the `redo log` enters the `prepare` state, and InnoDB informs the Executor that execution is complete and ready to commit at any time.
- Upon receiving the notification, the Executor writes the `binlog` and then clears the Query Cache for this table. Clearing the cache at this point ensures that subsequent `SELECT` queries will not read stale cached data—because the transaction is about to reach final commit and the data is about to reflect the latest state, so the timing of cache invalidation aligns with the actual data update.
- The Executor calls the engine interface to commit the `redo log`, transitioning it to the `commit` state.
- The update is complete.

**Some readers will surely ask: why use two logging modules? Wouldn't one logging module be enough?**

This is because originally MySQL did not have the InnoDB engine (the InnoDB engine was integrated into MySQL as a plugin by another company). MySQL's native engine was MyISAM, whereas `redo log` is specific to the InnoDB engine and absent in other storage engines. Without `redo log`, there is no crash-safe capability (`crash-safe` means that even if the database restarts abnormally, previously committed records are never lost); `binlog` can only be used for archiving.

It's not that using only one logging module is impossible—it's simply that the InnoDB engine supports transactions through `redo log`. Then another question arises: if we use two logging modules, can't we keep it simpler—why does `redo log` need to introduce the `prepare` pre-commit state? Here we use proof by contradiction to explain why:

- **Write and immediately commit `redo log` first, then write `binlog`**: Suppose the machine crashes right after writing `redo log` before `binlog` is written. When the machine restarts, it recovers the data via `redo log`, yet `binlog` has no record of this change. Later, when backing up or restoring from `binlog`, this record will be lost, and primary-replica replication will also miss this record.
- **Write `binlog` first, then write `redo log`**: Suppose the machine restarts abnormally after `binlog` is written. Because there is no `redo log`, the local instance cannot recover this record, yet `binlog` contains it. For the same reason as above, data inconsistency occurs.

By using Two-Phase Commit with `redo log`, things are different: first write `redo log` and mark it as `prepare`, immediately write `binlog`, and finally mark `redo log` as `commit`. This prevents the issues above and guarantees data consistency.

Now a follow-up question arises: is there an extreme edge case? Suppose `redo log` is in the `prepare` state and `binlog` has already been written, and an abnormal restart occurs at that exact moment—what happens?

This depends on MySQL's recovery mechanism, which works as follows:

- Check whether the `redo log` is in the `commit` state. If it is, that indicates `binlog` has definitely been flushed to disk, so commit immediately.
- If the `redo log` is only in the `prepare` state and not `commit`, MySQL takes the transaction's `XID` and checks `binlog` to determine whether the transaction was flushed to disk. If so, it commits the `redo log`; otherwise, it rolls back the transaction.

This solves the data consistency problem.

## 3. Summary

- MySQL is mainly divided into the Server Layer and the Engine Layer. The Server Layer primarily includes the Connector, Query Cache, Analyzer, Optimizer, and Executor, plus a logging module (`binlog`) shared by all execution engines, whereas `redo log` is exclusive to InnoDB.
- The Engine Layer is pluggable and currently includes MyISAM, InnoDB, Memory, and others.
- The execution flow of a query statement is: Permission check (if cache hit) ---> Query Cache ---> Analyzer ---> Optimizer ---> Permission check ---> Executor ---> Storage Engine.
- The execution flow of an update statement is: Analyzer ----> Permission check ----> Executor ---> Storage Engine --- `redo log` (`prepare` state) ---> `binlog` ---> `redo log` (`commit` state).

## 4. References

- *MySQL in Practice: 45 Lectures*
- MySQL 5.6 Reference Manual: <https://dev.MySQL.com/doc/refman/5.6/en/>
