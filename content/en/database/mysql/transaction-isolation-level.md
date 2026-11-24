---
title: MySQL Transaction Isolation Levels Explained
description: Detailed explanation of the characteristics and differences among MySQL's four transaction isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable), analyzing concurrency anomalies such as dirty reads, non-repeatable reads, and phantom reads, as well as how InnoDB solves phantom reads via MVCC and locking mechanisms.
category: Databases
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Transaction Isolation Levels,Read Uncommitted,Read Committed,Repeatable Read,Serializable,Dirty Read,Non-Repeatable Read,Phantom Read,MVCC,Gap Lock
lang: en
sourceRef: zh-ref/database/mysql/transaction-isolation-level.md
---

> Co-authored by [SnailClimb](https://github.com/Snailclimb) and [guang19](https://github.com/guang19).

For an overview of transaction fundamentals, please see this article: [Common MySQL Knowledge Points & Interview Questions Summary](./mysql-questions-01.md#MySQL-事务).

## Summary of Transaction Isolation Levels

The SQL standard defines four transaction isolation levels to balance transaction isolation and concurrency performance. The higher the isolation level, the stronger the data consistency, though concurrency performance may be lower. These four levels are:

- **READ-UNCOMMITTED**: The lowest isolation level, which allows reading uncommitted data changes from other transactions and may lead to dirty reads, phantom reads, or non-repeatable reads. This level is rarely used in practice because its data consistency guarantees are too weak.
- **READ-COMMITTED**: Allows reading data already committed by concurrent transactions. It prevents dirty reads, but phantom reads or non-repeatable reads can still occur. This is the default isolation level in most databases (such as Oracle and SQL Server).
- **REPEATABLE-READ**: Guarantees that multiple reads of the same field return consistent results unless the data is modified by the transaction itself. It prevents dirty reads and non-repeatable reads, though phantom reads may still occur. The default isolation level of the MySQL InnoDB storage engine is `REPEATABLE READ`. Furthermore, at this level, InnoDB largely resolves the phantom read problem through MVCC (Multi-Version Concurrency Control) and Next-Key Locks (Gap Lock + Record Lock).
- **SERIALIZABLE**: The highest isolation level, strictly conforming to ACID isolation. All transactions execute sequentially one by one, making interference between transactions completely impossible—meaning this level prevents dirty reads, non-repeatable reads, and phantom reads.

| Isolation Level  | Dirty Read | Non-Repeatable Read | Phantom Read                |
| ---------------- | ---------- | ------------------- | --------------------------- |
| READ UNCOMMITTED | √          | √                   | √                           |
| READ COMMITTED   | ×          | √                   | √                           |
| REPEATABLE READ  | ×          | ×                   | √ (Standard) / ≈× (InnoDB)  |
| SERIALIZABLE     | ×          | ×                   | ×                           |

**Checking the Default Level:**

The default isolation level of the MySQL InnoDB storage engine is **REPEATABLE READ**. You can check it with the following commands:

- Before MySQL 8.0: `SELECT @@tx_isolation;`
- MySQL 8.0 and later: `SELECT @@transaction_isolation;`

```bash
mysql> SELECT @@transaction_isolation;
+-------------------------+
| @@transaction_isolation |
+-------------------------+
| REPEATABLE-READ         |
+-------------------------+
```

**How InnoDB's REPEATABLE READ Handles Phantom Reads:**

Under the standard SQL isolation level definitions, `REPEATABLE READ` cannot prevent phantom reads. However, InnoDB's implementation largely avoids phantom reads via the following mechanisms:

- **Snapshot Read**: Regular `SELECT` statements are implemented through the **MVCC** mechanism. A data snapshot is created when a transaction starts (or at the first read), and subsequent snapshot reads read from this version of the data, thereby avoiding seeing newly inserted rows (phantom reads) or modified rows (non-repeatable reads) from other transactions.
- **Current Read**: Operations such as `SELECT ... FOR UPDATE`, `SELECT ... LOCK IN SHARE MODE`, `INSERT`, `UPDATE`, and `DELETE`. InnoDB uses **Next-Key Locks** to lock the scanned index records as well as the ranges (gaps) between them, preventing other transactions from inserting new records within that range and thus avoiding phantom reads. A Next-Key Lock is a combination of a Record Lock and a Gap Lock.

It is worth noting that although a higher isolation level is generally believed to result in lower concurrency, the InnoDB storage engine optimizes the `REPEATABLE READ` level through MVCC. For many common read-only or read-heavy workloads, its performance **may show no significant difference compared to `READ COMMITTED`**. However, in write-intensive scenarios with high concurrent contention, RR's gap-locking mechanism may introduce more lock waits than RC.

In addition, in certain specific scenarios—such as distributed transactions (XA Transactions) requiring strict consistency—InnoDB may require or recommend the `SERIALIZABLE` isolation level to ensure global data consistency.

*MySQL Internals: InnoDB Storage Engine (2nd Edition)*, Section 7.7 states:

> The InnoDB storage engine provides support for XA transactions and uses XA transactions to support distributed transaction implementations. A distributed transaction allows multiple independent transactional resources to participate in a single global transaction. Transactional resources are typically relational database systems, though they can also be other types of resources. A global transaction requires that all participating transactions either all commit or all roll back, which raises the bar beyond the original ACID requirements of single transactions. Additionally, when using distributed transactions, the InnoDB storage engine's transaction isolation level must be set to `SERIALIZABLE`.

## Practical Demonstration

Below, I will use 2 MySQL command-line clients to simulate multiple threads (multiple transactions) encountering the dirty read issue on the same data.

In the default MySQL CLI configuration, transactions are auto-committed (`autocommit`), meaning a `COMMIT` operation executes immediately after each SQL statement. To explicitly start a transaction, you need to use the command `START TRANSACTION`.

We can set the isolation level using the following command:

```sql
SET [SESSION|GLOBAL] TRANSACTION ISOLATION LEVEL [READ UNCOMMITTED|READ COMMITTED|REPEATABLE READ|SERIALIZABLE]
```

Let's also review the concurrency control statements used in the hands-on demonstration below:

- `START TRANSACTION` | `BEGIN`: Explicitly starts a transaction.
- `COMMIT`: Commits a transaction, making all modifications to the database permanent.
- `ROLLBACK`: Rolls back and ends the user's transaction, undoing all uncommitted modifications in progress.

### Dirty Read (READ UNCOMMITTED)

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-31-1--56de2c6e.png)

### Avoiding Dirty Read (READ COMMITTED)

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-31-2-162f70a6.png)

### Non-Repeatable Read

Still looking at the `READ COMMITTED` example above: although dirty reads (from `READ UNCOMMITTED`) are avoided, a non-repeatable read still occurs before a transaction has ended.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-32-1-6916fdbe.png)

### Repeatable Read

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-33-2-e2fd7d76.png)

### Phantom Read

#### Demonstrating When Phantom Reads Occur

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/phantom_read-54471741.png)

When SQL Script 1 first queries for records with salary 500, there is only one record. SQL Script 2 then inserts a record with salary 500 and commits; when SQL Script 1 queries again within the same transaction using a current read, it finds two records with salary 500—this is a phantom read.

Note: This example fundamentally stems from the different read semantics between the first snapshot read and the second current read. Under RR, MVCC guarantees that snapshot reads do not encounter phantom reads, and Next-Key Locks constrain current reads; however, when mixing snapshot reads and current reads within the same transaction, the two reads may observe different results.

#### Ways to Resolve Phantom Reads

There are many ways to solve phantom reads, but their core idea is the same: while one transaction is operating on a table's data, another transaction is not allowed to insert or delete data in that table. The main approaches to resolving phantom reads include:

1. Raising the transaction isolation level to `SERIALIZABLE`.
2. Under the `REPEATABLE READ` isolation level, adding a table lock to the table the transaction operates on.
3. Under the `REPEATABLE READ` isolation level, adding `Next-Key Locks (Record Lock + Gap Lock)` on the table the transaction operates on.

### References

- *MySQL Internals: InnoDB Storage Engine*
- <https://dev.MySQL.com/doc/refman/5.7/en/>
- [MySQL Locks: Seven Soul-Searching Questions](https://tech.youzan.com/seven-questions-about-the-lock-of-MySQL/)
- [Transaction Isolation Levels and Locks in InnoDB](https://tech.meituan.com/2014/08/20/innodb-lock.html)
