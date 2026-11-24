---
title: "InnoDB Storage Engine Implementation of MVCC"
description: "In-depth analysis of how the InnoDB storage engine implements MVCC, detailing hidden columns, undo log version chains, the ReadView mechanism, and the difference between snapshot reads and current reads to understand how MySQL achieves transaction isolation."
category: Database
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MVCC,Multi-Version Concurrency Control,InnoDB,snapshot read,current read,consistent view,ReadView,undo log,hidden columns,transaction isolation
lang: en
sourceRef: zh-ref/database/mysql/innodb-implementation-of-mvcc.md
---

## Multi-Version Concurrency Control (MVCC)

MVCC is a concurrency control mechanism used to maintain data consistency and isolation when multiple concurrent transactions read from and write to a database simultaneously. It achieves this by maintaining multiple versions of data for each row. When a transaction modifies data, InnoDB **directly updates the current data row** (in-place update) and **saves the old version of the data into the Undo Log**. When other transactions perform a snapshot read, they use the **ReadView** and the version chain in the **Undo Log** to read a consistent view of the data as of a specific point in time, thereby preventing read operations from being blocked by write operations.

1. Read operations (`SELECT`):

When a transaction executes a read operation, it uses a snapshot read. A snapshot read is created based on the database state when the transaction (or query) begins, so the transaction will not read uncommitted modifications made by other transactions. Specifically, it works as follows:

- For a read operation, the transaction locates the rows that satisfy the condition and selects the version of the data matching its snapshot timing.
- If a row has multiple versions, the transaction selects the latest version no later than its start time, ensuring that the transaction only reads data that already existed before it began.
- Because the transaction reads snapshot data, modifications made to rows by other concurrent transactions do not affect the current transaction's read operations.

2. Write operations (`INSERT`, `UPDATE`, `DELETE`):

When a transaction executes a write operation, it generates a new data version and writes the modified data into the database. Specifically, it works as follows:

- For a write operation, the transaction creates a new version for the row to be modified and writes the updated data into the new version.
- The new version carries the current transaction's version number (transaction ID) so that other transactions can read the appropriate version of the data.
- The original version of the data still remains available for other transactions performing snapshot reads, ensuring that other transactions are not affected by the current transaction's write operations.

3. Transaction commit and rollback:

- When a transaction commits, its modifications become the latest version in the database and become visible to other transactions.
- When a transaction rolls back, its modifications are undone and remain invisible to other transactions.

4. Version reclamation:

To prevent the number of versions in the database from growing indefinitely, MVCC periodically performs version reclamation. The reclamation mechanism deletes old versions that are no longer needed, freeing up storage space.

MVCC achieves concurrency control by creating multiple versions of data and using snapshot reads. Read operations use snapshots of older versions, while write operations create new versions while keeping the original versions accessible. In this way, different transactions can execute concurrently to a certain degree without interfering with one another, improving both database concurrency and data consistency.

## Consistent Nonlocking Reads and Locking Reads

### Consistent Nonlocking Reads

To implement [**Consistent Nonlocking Reads**](https://dev.mysql.com/doc/refman/5.7/en/innodb-consistent-read.html), the usual approach is to add a version number or timestamp column and increment the version number or update the timestamp whenever the data is updated. When querying, the current visible version is compared against the record's version number; if the record's version is earlier than the visible version, the record is visible.

In the `InnoDB` storage engine, [multi-versioning](https://dev.mysql.com/doc/refman/5.7/en/innodb-multi-versioning.html) is the implementation of nonlocking reads. If a row being read is currently undergoing a `DELETE` or `UPDATE` operation, the read operation does not wait for the lock on that row to be released. Instead, the `InnoDB` storage engine reads a snapshot of the row. This method of reading historical data is called a **snapshot read**.

Under the `Repeatable Read` and `Read Committed` isolation levels, executing an ordinary `select` statement (excluding `select ... lock in share mode` and `select ... for update`) uses `consistent nonlocking read (MVCC)`. Moreover, under `Repeatable Read`, `MVCC` achieves repeatable reads and prevents partial phantom reads.

### Locking Reads

If any of the following statements are executed, it is a [**Locking Read**](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-reads.html):

- `select ... lock in share mode`
- `select ... for update`
- `insert`, `update`, and `delete` operations

Under a locking read, the latest version of the data is read; this type of read is also called a **current read**. A locking read places locks on the records it reads:

- `select ... lock in share mode`: acquires an `S` (shared) lock on the records; other transactions can also acquire `S` locks, while attempts to acquire an `X` (exclusive) lock are blocked.
- `select ... for update`, `insert`, `update`, `delete`: acquires an `X` lock on the records, and no other transaction can acquire any lock on them.

Under a consistent nonlocking read, even if the record being read has already been locked with an `X` lock by another transaction, the record can still be read—specifically, its snapshot data is read. As mentioned earlier, under `Repeatable Read`, `MVCC` prevents *partial* phantom reads. Here, "partial" refers to the fact that under `consistent nonlocking reads`, a transaction can only read rows inserted before its first query (visibility is determined by the ReadView, which is generated during the first query). However, under a **current read**, every read fetches the latest data; if another transaction inserts new rows between two queries, a phantom read occurs. Therefore, **when `InnoDB` implements `Repeatable Read`, if a current read is executed, it applies a `Next-key Lock` to the read records to prevent other transactions from inserting data into the gaps**.

## InnoDB's Implementation of MVCC

`MVCC` relies on: **hidden columns, ReadView, and undo log**. Internally, `InnoDB` determines data visibility using a row's `DB_TRX_ID` and the `ReadView`. If the current row version is not visible, InnoDB follows the row's `DB_ROLL_PTR` to locate historical versions in the `undo log`. Different transactions may read different versions of the same row; within a single transaction, a user can only see modifications that were committed before the transaction created its `ReadView`, plus modifications made by the transaction itself.

### Hidden Columns

Internally, the `InnoDB` storage engine adds three [hidden columns](https://dev.mysql.com/doc/refman/5.7/en/innodb-multi-versioning.html) to every row:

- `DB_TRX_ID (6 bytes)`: indicates the transaction ID of the last transaction that inserted or updated the row. In addition, a `delete` operation is treated internally as an update, except that the `deleted_flag` bit in the `Record header` is marked as deleted.
- `DB_ROLL_PTR (7 bytes)`: the rollback pointer, pointing to the row's `undo log`. If the row has not been updated, it is empty (null).
- `DB_ROW_ID (6 bytes)`: if no primary key is defined and the table has no unique non-null index, `InnoDB` uses this ID to generate the clustered index.

### ReadView

```c
class ReadView {
  /* ... */
private:
  trx_id_t m_low_limit_id;      /* Transactions with ID >= this value are all invisible */

  trx_id_t m_up_limit_id;       /* Transactions with ID < this value are all visible */

  trx_id_t m_creator_trx_id;    /* Transaction ID that created this ReadView */

  trx_id_t m_low_limit_no;      /* Transaction number; Undo Logs with number < this value can be purged */

  ids_t m_ids;                  /* List of active transaction IDs when the ReadView was created */

  m_closed;                     /* Flag indicating whether the ReadView is closed */
}
```

[`ReadView`](https://github.com/facebook/mysql-8.0/blob/8.0/storage/innobase/include/read0types.h#L298) is primarily used for visibility checks. It stores "other active transactions that are currently invisible to this transaction."

It mainly contains the following fields:

- `m_low_limit_id`: the largest transaction ID that has appeared so far + 1—that is, the next transaction ID to be allocated. Any data version with an ID greater than or equal to this value is invisible.
- `m_up_limit_id`: the smallest transaction ID in the active transaction list `m_ids`. If `m_ids` is empty, `m_up_limit_id` equals `m_low_limit_id`. Any data version with an ID less than this value is visible.
- `m_ids`: the list of other uncommitted active transaction IDs at the time the `ReadView` is created. When creating a `ReadView`, currently uncommitted transaction IDs are recorded; even if they subsequently modify row values, those changes remain invisible to the current transaction. `m_ids` does not include the current transaction itself or already committed transactions (stored in memory).
- `m_creator_trx_id`: the ID of the transaction that created this `ReadView`.

**Transaction Visibility Diagram** ([Image source](https://leviathan.vip/2019/03/20/InnoDB%E7%9A%84%E4%BA%8B%E5%8A%A1%E5%88%86%E6%9E%90-MVCC/#MVCC-1)):

![trans_visible](/media/jg/local/database/mysql/images/mvvc/trans_visible-4cbbb3.png)

### Undo Log

`undo log` serves two main purposes:

- Restoring data to its pre-modification state when a transaction rolls back.
- Supporting `MVCC`: when reading a record, if the record is occupied by another transaction or its current version is invisible to the reading transaction, older versions of the data can be read via the `undo log`, thereby implementing nonlocking reads.

**In the `InnoDB` storage engine, `undo log` is divided into two types: `insert undo log` and `update undo log`:**

1. **`insert undo log`**: the `undo log` generated during an `insert` operation. Because records created by an `insert` operation are only visible to the transaction itself and invisible to other transactions, this `undo log` can be deleted directly after the transaction commits without requiring a `purge` operation.

**Initial state of data during `insert`:**

![](/media/jg/local/database/mysql/images/mvvc/317e91e1-1ee1-42ad-9412-9098d5c6a9ad-4380e2.png)

2. **`update undo log`**: the `undo log` generated during `update` or `delete` operations. Because this `undo log` may need to serve the `MVCC` mechanism, it cannot be deleted immediately upon transaction commit. When committed, it is placed into the `undo log` linked list and awaits final deletion by the `purge thread`.

**When data is modified for the first time:**

![](/media/jg/local/database/mysql/images/mvvc/c52ff79f-10e6-46cb-b5d4-3c9cbcc1934a-dc85da.png)

**When data is modified for the second time:**

![](/media/jg/local/database/mysql/images/mvvc/6a276e7a-b0da-4c7b-bdf7-c0c7b7b3b31c-912d05.png)

Modifications to the same row by different transactions or the same transaction turn the row's `undo log` entries into a linked list, where the head of the chain holds the newest record and the tail holds the earliest historical record.

### Data Visibility Algorithm

In the `InnoDB` storage engine, after creating a new transaction, before executing a `select` statement, a snapshot (`ReadView`) is created (**storing the IDs of transactions currently active—i.e., uncommitted—in the database system**). Put simply, it stores the list of other transaction IDs (`m_ids`) that should not currently be seen by the current transaction. When a user reads a row in this transaction, `InnoDB` compares the row's `DB_TRX_ID` against the variables in the `ReadView` and the current transaction ID to determine whether the visibility condition is met.

The [specific comparison algorithm](https://github.com/facebook/mysql-8.0/blob/8.0/storage/innobase/include/read0types.h#L161) is as follows ([Image source](https://leviathan.vip/2019/03/20/InnoDB%E7%9A%84%E4%BA%8B%E5%8A%A1%E5%88%86%E6%9E%90-MVCC/#MVCC-1)):

![](/media/jg/local/database/mysql/images/mvvc/8778836b-34a8-480b-b8c7-654fe207a8c2-3b7325.png)

1. If the record's `DB_TRX_ID < m_up_limit_id`, it indicates that the transaction that most recently modified the row (`DB_TRX_ID`) had already committed before the current transaction created its snapshot, so the row's value is visible to the current transaction.

2. If `DB_TRX_ID >= m_low_limit_id`, it indicates that the transaction that most recently modified the row (`DB_TRX_ID`) modified the row *after* the current transaction created its snapshot, so the row's value is invisible to the current transaction. Jump to Step 5.

3. If `m_ids` is empty, it indicates that the transaction that modified the row had already committed before the current transaction created its snapshot, so the row's value is visible to the current transaction.

4. If `m_up_limit_id <= DB_TRX_ID < m_low_limit_id`, it indicates that the transaction that most recently modified the row (`DB_TRX_ID`) might have been either "active" or "committed" when the current transaction created its snapshot. Therefore, we must search the active transaction list `m_ids` (the source code uses binary search because the list is sorted):

   - If `DB_TRX_ID` is found in the active transaction list `m_ids`, it means either: (1) before the current transaction created its snapshot, the row was modified by transaction `DB_TRX_ID`, which had not yet committed; or (2) after the current transaction created its snapshot, the row was modified by transaction `DB_TRX_ID`. In either case, the row's value is invisible to the current transaction. Jump to Step 5.

   - If it is not found in the active transaction list, it means that the transaction with ID `trx_id` modified the row and committed *before* the current transaction created its snapshot, so the record is visible to the current transaction.

5. Retrieve the snapshot record from the `undo log` pointed to by the row's `DB_ROLL_PTR` pointer, and restart the check from Step 1 using that snapshot record's `DB_TRX_ID`, continuing until a qualifying snapshot version is found or null is returned.

## Differences in MVCC Between RC and RR Isolation Levels

Under the `RC` (Read Committed) and `RR` (Repeatable Read—the default transaction isolation level of the InnoDB storage engine) isolation levels, `InnoDB` uses `MVCC` (nonlocking consistent reads), but they differ in **when a `ReadView` is generated**:

- Under the `RC` isolation level, a new `ReadView` (`m_ids` list) is generated before **`every select` query**.
- Under the `RR` isolation level, a `ReadView` (`m_ids` list) is generated only before **`the first select`** after the transaction starts.

## How MVCC Solves the Non-Repeatable Read Problem

Although both `RC` and `RR` use `MVCC` to read snapshot data, because of the **difference in when `ReadView` is generated**, `RR` achieves repeatable reads.

Let's walk through an example:

![](/media/jg/local/database/mysql/images/mvvc/6fb2b9a1-5f14-4dec-a797-e4cf388ed413-8e96e8.png)

### ReadView Generation Under RC

**1. Suppose the timeline reaches `T4`. At this point, the version chain for row `id = 1` is:**

![](/media/jg/local/database/mysql/images/mvvc/a3fd1ec6-8f37-42fa-b090-7446d488fd04-fab9f1.png)

Because `RC` generates a `ReadView` on every query, and transactions `101` and `102` have not yet committed, the `ReadView` generated by transaction `103` has active transactions **`m_ids`: `[101, 102]`**, `m_low_limit_id`: `104`, `m_up_limit_id`: `101`, and `m_creator_trx_id`: `103`.

- Currently, the latest record has `DB_TRX_ID = 101`. Since `m_up_limit_id <= 101 < m_low_limit_id`, we search the `m_ids` list and find `DB_TRX_ID` present in the list, so this record is invisible.
- Following `DB_ROLL_PTR` to the previous version in the `undo log`, that record's `DB_TRX_ID` is also `101`, which is still invisible.
- Moving to the next earlier version, `DB_TRX_ID` is `1`, which satisfies `1 < m_up_limit_id` and is visible. Thus, transaction `103` reads `name = Caihua`.

**2. The timeline reaches `T6`. The version chain of the data is:**

![](/media/jg/local/database/mysql/images/mvvc/528559e9-dae8-4d14-b78d-a5b657c88391-d75ed8.png)

Because a new `ReadView` is generated under `RC`, and at this point transaction `101` has committed while `102` has not, the `ReadView` now has active transactions **`m_ids`: `[102]`**, `m_low_limit_id`: `104`, `m_up_limit_id`: `102`, and `m_creator_trx_id`: `103`.

- Currently, the latest record has `DB_TRX_ID = 102`. Since `m_up_limit_id <= 102 < m_low_limit_id`, we search `m_ids`, find `102` in the list, and conclude this record is invisible.
- Following `DB_ROLL_PTR` to the previous version in the `undo log`, that record's `DB_TRX_ID` is `101`, which satisfies `101 < m_up_limit_id` and is visible. Thus, at time `T6`, the query returns `name = Li Si`, which differs from the result read at `T4`—a non-repeatable read!

**3. The timeline reaches `T9`. The version chain of the data is:**

![](/media/jg/local/database/mysql/images/mvvc/6f82703c-36a1-4458-90fe-d7f4edbac71a-df999e.png)

A new `ReadView` is generated. By now, both transactions `101` and `102` have committed, so **`m_ids` is empty**, `m_up_limit_id = m_low_limit_id = 104`, and the latest version's transaction ID is `102`, which satisfies `102 < m_low_limit_id` and is visible. The query returns `name = Zhao Liu`.

> **Summary:** **Under the RC isolation level, a transaction generates and sets a new ReadView at the start of every query, which leads to non-repeatable reads.**

### ReadView Generation Under RR

Under the Repeatable Read isolation level, a `ReadView` (`m_ids` list) is only generated the first time data is read after the transaction starts.

**1. Version chain at `T4`:**

![](/media/jg/local/database/mysql/images/mvvc/0e906b95-c916-4f30-beda-9cb3e49746bf-f19672.png)

When executing the `select` statement, a `ReadView` is generated with **`m_ids`: `[101, 102]`**, `m_low_limit_id`: `104`, `m_up_limit_id`: `101`, and `m_creator_trx_id`: `103`.

At this point, it behaves the same as under `RC`:

- The latest record has `DB_TRX_ID = 101`. Since `m_up_limit_id <= 101 < m_low_limit_id`, we search `m_ids`, find `DB_TRX_ID` in the list, and conclude this record is invisible.
- Following `DB_ROLL_PTR` to the previous version in the `undo log`, that record's `DB_TRX_ID` is also `101`, so it is invisible.
- Moving to the earlier version with `DB_TRX_ID = 1`, it satisfies `1 < m_up_limit_id` and is visible, so transaction `103` reads `name = Caihua`.

**2. At time `T6`:**

![](/media/jg/local/database/mysql/images/mvvc/79ed6142-7664-4e0b-9023-cf546586aa39-e565bf.png)

Under `RR`, a `ReadView` is generated only once, so it continues reusing **`m_ids`: `[101, 102]`**, `m_low_limit_id`: `104`, `m_up_limit_id`: `101`, and `m_creator_trx_id`: `103`.

- The latest record has `DB_TRX_ID = 102`. Since `m_up_limit_id <= 102 < m_low_limit_id`, we search `m_ids`, find `DB_TRX_ID` in the list, and conclude this record is invisible.
- Following `DB_ROLL_PTR` to the previous version in the `undo log`, that record's `DB_TRX_ID` is `101`, which is invisible.
- Following `DB_ROLL_PTR` again to the earlier version in the `undo log`, its `DB_TRX_ID` is still `101`, which is invisible.
- Continuing to the version with `DB_TRX_ID = 1`, it satisfies `1 < m_up_limit_id` and is visible, so transaction `103` still reads `name = Caihua`.

**3. At time `T9`:**

![](/media/jg/local/database/mysql/images/mvvc/cbbedbc5-0e3c-4711-aafd-7f3d68a4ed4e-23e882.png)

The situation here is identical to `T6`. Because the `ReadView` has already been generated, transaction `103` continues reusing **`m_ids`: `[101, 102]`**, so the query result remains `name = Caihua`.

## MVCC + Next-Key Lock to Prevent Phantom Reads

The `InnoDB` storage engine resolves phantom reads under the `RR` isolation level by combining `MVCC` and `Next-key Lock`:

**1. Executing an ordinary `select`, which reads data via an `MVCC` snapshot read**

In a snapshot read, the `RR` isolation level generates a `ReadView` only on the first query after the transaction starts and reuses it until the transaction commits. Therefore, any rows updated or inserted by other transactions after the `ReadView` is generated are invisible to the current transaction, achieving repeatable reads and preventing "phantom reads" under snapshot reads.

**2. Executing current reads such as `select ... for update` / `lock in share mode`, `insert`, `update`, and `delete`**

Under a current read, the latest data is always read. If another transaction inserts new records that happen to fall within the current transaction's query range, a phantom read would occur! `InnoDB` uses [Next-key Lock](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking.html#innodb-next-key-locks) to prevent this. When executing a current read, it locks both the retrieved records and the gaps between them, preventing other transactions from inserting data within the query range. As long as other transactions cannot insert rows there, phantom reads cannot occur.

## References

- *MySQL Technology Insider: InnoDB Storage Engine (2nd Edition)*
- [Relationship Between Transaction Isolation Levels and Locks in InnoDB](https://tech.meituan.com/2014/08/20/innodb-lock.html)
- [How MySQL Transactions and MVCC Implement Isolation Levels](https://blog.csdn.net/qq_35190492/article/details/109044141)
- [InnoDB Transaction Analysis - MVCC](https://leviathan.vip/2019/03/20/InnoDB%E7%9A%84%E4%BA%8B%E5%8A%A1%E5%88%86%E6%9E%90-MVCC/)
