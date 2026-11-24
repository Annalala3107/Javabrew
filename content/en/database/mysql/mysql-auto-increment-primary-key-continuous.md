---
title: "Are MySQL Auto-Increment Primary Keys Always Continuous?"
description: "Detailed explanation of why MySQL auto-increment primary keys are not always continuous, analyzing the allocation mechanism of auto-increment values in scenarios such as unique key conflicts, transaction rollbacks, and batch inserts, as well as the configuration and impact of InnoDB auto-increment lock modes."
category: Database
tag:
  - MySQL
  - Big Tech Interviews
head:
  - - meta
    - name: keywords
      content: MySQL auto-increment primary key,AUTO_INCREMENT,non-continuous primary key,transaction rollback,batch insert,unique key conflict,innodb_autoinc_lock_mode
lang: en
sourceRef: zh-ref/database/mysql/mysql-auto-increment-primary-key-continuous.md
---

> Author: Feitian Xiaoniuruo
>
> Original article: <https://mp.weixin.qq.com/s/qci10h9rJx_COZbHV3aygQ>

As is well known, an auto-increment primary key allows the clustered index to be inserted in ascending order as much as possible, avoiding random lookups and thereby improving query efficiency.

In practice, however, MySQL's auto-increment primary key cannot be guaranteed to increase continuously without gaps.

Let's walk through an example by creating a table as shown below:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3e6b80ba50cb425386b80924e3da0d23-tplv-k3u1fbpfcp-4bffa98e.png)

## Where Is the Auto-Increment Value Stored?

Insert a row using `insert into test_pk values(null, 1, 1)`, and then execute the `show create table` command to inspect the table's schema definition:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c17e46230bd34150966f0d86b2ad5e91-tplv-k3u1fbpfcp-c4e31a62.png)

The table definition above is stored in a local file with the `.frm` extension, which can be found inside the `data` directory under the MySQL installation path:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3ec0514dd7be423d80b9e7f2d52f5902-tplv-k3u1fbpfcp-3bc2055d.png)

From the table definition above, we can see `AUTO_INCREMENT=2`, which means that the next time data is inserted, if an auto-increment value needs to be generated automatically, `id = 2` will be generated.

However, it is important to note that the auto-increment value is not saved in this table definition (i.e., the `.frm` file). Different storage engines adopt different strategies for persisting the auto-increment value:

1) The MyISAM engine stores the auto-increment value in the data file.

2) The InnoDB engine actually stores the auto-increment value in memory rather than persisting it. The first time a table is opened, InnoDB searches for the maximum value `max(id)` and sets `max(id)+1` as the table's current auto-increment value.

For example, suppose the largest `id` among the current rows in our table is `1`, and `AUTO_INCREMENT=2`. At this point, if we delete the row with `id=1`, `AUTO_INCREMENT` remains `2`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/61b8dc9155624044a86d91c368b20059-tplv-k3u1fbpfcp-374f934e.png)

However, if the MySQL instance is restarted immediately afterward, the table's `AUTO_INCREMENT` will become `1` after the restart. In other words, restarting MySQL can modify a table's `AUTO_INCREMENT` value.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/27fdb15375664249a31f88b64e6e5e66-tplv-k3u1fbpfcp-6c5b8038.png)

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/dee15f93e65d44d384345a03404f3481-tplv-k3u1fbpfcp-2264f3ef.png)

The experiment above was conducted on a local MySQL 5.x version. In fact, **starting from MySQL 8.0, changes to the auto-increment value are recorded in the redo log, providing persistence for auto-increment values**—meaning that if a restart occurs, the table's auto-increment value can be recovered from the redo log to its pre-restart value.

In other words, for the example above, the table's `AUTO_INCREMENT` would still be `2` after restarting the instance.

Now that we understand where MySQL stores the auto-increment value, let's examine how auto-increment values are modified, which leads to the first scenario where auto-increment values become non-continuous.

## Scenarios Where Auto-Increment Values Are Not Continuous

### Scenario 1: Auto-Increment Offset and Step Size

In MySQL, if the `id` column is defined as `AUTO_INCREMENT`, the behavior of the auto-increment value when inserting a row is as follows:

- If the `id` column is specified as `0`, `null`, or omitted during insertion, the table's current `AUTO_INCREMENT` value is filled into the auto-increment column;
- If a specific value is provided for the `id` column during insertion, the value specified in the statement is used directly.

Depending on the relationship between the inserted value and the current auto-increment value, the update to the auto-increment counter also differs. Suppose the value to be inserted is `insert_num` and the current auto-increment value is `autoIncrement_num`:

- If `insert_num < autoIncrement_num`, the table's auto-increment value remains unchanged.
- If `insert_num >= autoIncrement_num`, the current auto-increment value must be updated to a new auto-increment value.

That means if the inserted `id` is `100` and the current auto-increment value is `90`, since `insert_num >= autoIncrement_num`, the auto-increment value will be updated to the new value `101`.

Is that always the case?

Not necessarily~

Anyone familiar with distributed IDs knows that to avoid primary key collisions between two databases, we can configure one database to generate only odd auto-increment IDs and the other to generate only even auto-increment IDs.

This odd/even pattern is actually controlled by two parameters: `auto_increment_offset` and `auto_increment_increment`, which represent the initial auto-increment offset and the step size, respectively. Both default to `1`.

Therefore, in the example above, the actual steps to compute the new auto-increment value are: starting from `auto_increment_offset`, repeatedly add `auto_increment_increment` as the step size until the first value greater than `100` is found, and use that as the new auto-increment value.

Consequently, in this case, the new auto-increment value might be `102`, `103`, and so on, resulting in non-continuous primary key IDs.

Even more unfortunately, even when both the initial offset and the step size are set to `1`, auto-increment primary key IDs still cannot be guaranteed to be continuous.

### Scenario 2: Unique Key Conflict

For example, suppose we insert a record `(null,1,1)` into the table. The generated primary key is `1`, and `AUTO_INCREMENT=2`, right?

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c22c4f2cea234c7ea496025eb826c3bc-tplv-k3u1fbpfcp-b0ea7363.png)

If we then execute another command to insert `(null,1,1)`, it will obviously fail with a `Duplicate entry` error because we defined a unique index on column `a`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c0325e31398d4fa6bb1cbe08ef797b7f-tplv-k3u1fbpfcp-09387cc4.png)

However, you will be surprised to discover that even though the insertion failed, the auto-increment value still increased from `2` to `3`!

Why is that?

Let's trace the execution flow of this `INSERT` statement:

1. The executor calls the InnoDB engine interface to prepare to insert a record `(null,1,1)`.
2. InnoDB sees that the user did not specify an auto-increment `id` value, so it retrieves the current auto-increment value `2` of table `test_pk`.
3. It updates the incoming record to `(2,1,1)`.
4. It updates the table's auto-increment value to `3`.
5. It proceeds to execute the insert operation. Since a record with `a=1` already exists, a `Duplicate key` error is raised and the statement returns.

As we can see, the operation that modifies the auto-increment value occurs **before** the actual data insertion takes place.

When the statement actually executes and encounters a conflict on unique key `a`, the row with `id = 2` fails to be inserted, yet the auto-increment value is not rolled back. Therefore, when a new row is inserted afterward, the auto-increment `id` it receives is `3`. That creates a gap in the auto-increment primary key.

So far, we have listed two cases of non-continuous auto-increment primary keys:

1. Auto-increment initial offset and step size are not set to `1`
2. Unique key conflict

In addition, transaction rollback also leads to this behavior.

### Scenario 3: Transaction Rollback

Suppose our table currently has one row `(1,1,1)` and `AUTO_INCREMENT = 3`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/6220fcf7dac54299863e43b6fb97de3e-tplv-k3u1fbpfcp-e3520af6.png)

First, we insert a row `(null, 2, 2)`, which becomes `(3, 2, 2)`, and `AUTO_INCREMENT` becomes `4`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3f02d46437d643c3b3d9f44a004ab269-tplv-k3u1fbpfcp-5eedbc51.png)

Next, we execute the following SQL block:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/faf5ce4a2920469cae697f845be717f5-tplv-k3u1fbpfcp-54135f69.png)

Although we inserted a `(null, 3, 3)` record, we rolled it back using `rollback`, so this record does not exist in the database:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/6cb4c02722674dd399939d3d03a431c1-tplv-k3u1fbpfcp-3205f80d.png)

In this transaction rollback scenario, the auto-increment value does **not** roll back along with the transaction! As shown below, the auto-increment value stubbornly increases from `4` to `5`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/e6eea1c927424ac7bda34a511ca521ae-tplv-k3u1fbpfcp-1bce5a5c.png)

So when we subsequently insert another row `(null, 3, 3)`, the primary key `id` is automatically assigned `5`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/80da69dd13b543c4a32d6ed832a3c568-tplv-k3u1fbpfcp-8351cb26.png)

So why doesn't MySQL revert the table's auto-increment value when a unique key conflict or rollback occurs? Wouldn't rolling it back prevent gaps in auto-increment IDs?

In fact, the primary reason for doing this is to improve performance.

Let's prove this by contradiction: suppose MySQL did revert the auto-increment value upon transaction rollback—what would happen?

Consider two concurrently executing transactions, A and B. When requesting an auto-increment value, to prevent both transactions from getting the same auto-increment ID, locking must be used so they acquire IDs sequentially, right?

1. Suppose Transaction A obtains `id = 1` and Transaction B obtains `id = 2`. At this moment, table `t`'s auto-increment value is `3`, and execution continues.
2. Transaction B commits successfully, while Transaction A encounters a unique key conflict—meaning the insertion of `id = 1` fails. If Transaction A were allowed to roll back the auto-increment ID—that is, reset the table's current auto-increment value back to `1`—then we would end up in a situation where the table already contains a row with `id = 2`, while the current auto-increment counter is `1`.
3. Subsequently, another transaction executing later would be assigned `id = 2`. At that point, the insert statement would fail with a "primary key conflict" error.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/5f26f02e60f643c9a7cab88a9f1bdce9-tplv-k3u1fbpfcp-1a4f2cd5.png)

To resolve this primary key conflict, there would be two possible approaches:

1. Before assigning each ID, check whether that ID already exists in the table, and skip it if it does.
2. Expand the scope of the auto-increment ID lock so that the next transaction cannot request an auto-increment ID until the previous transaction has completely finished and committed.

Clearly, both approaches carry a high cost and would cause severe performance issues. And the root cause of needing them was our assumption of "allowing the auto-increment ID to roll back."

Therefore, InnoDB abandoned that design and does not roll back auto-increment IDs even when a statement fails. Precisely because of this, auto-increment IDs are only guaranteed to be monotonically increasing, not continuous.

In summary, we have analyzed three scenarios where auto-increment values are not continuous. There is also a fourth scenario: batch data insertion.

### Scenario 4: Batch Data Insertion

For batch insert statements, MySQL uses a bulk allocation strategy for auto-increment IDs:

1. During statement execution, the first request for auto-increment IDs allocates `1` ID;
2. Once that `1` ID is used up, the statement's second request allocates `2` IDs;
3. Once those `2` IDs are used up, the same statement's third request allocates `4` IDs;
4. And so on—each time the same statement requests auto-increment IDs, the number of IDs allocated is double the previous batch.

Note that "batch data insertion" here does **not** refer to a regular `INSERT` statement containing multiple `VALUES` rows! For that type of statement, MySQL can accurately calculate how many IDs are needed when requesting auto-increment values, allocate them all at once, and immediately release the lock afterward.

By contrast, for statements like `insert … select`, `replace … select`, and `load data`, MySQL does not know in advance how many IDs will be needed, so it adopts this bulk allocation strategy—after all, requesting IDs one by one would be far too slow.

For example, suppose our table currently contains the following data:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/6453cfc107f94e3bb86c95072d443472-tplv-k3u1fbpfcp-bccd814f.png)

We create a table `test_pk2` with the exact same schema definition as `test_pk`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/45248a6dc34f431bba14d434bee2c79e-tplv-k3u1fbpfcp-2718ed3a.png)

Then we use `insert...select` to batch-insert data into `teset_pk2`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c1b061e86bae484694d15ceb703b10ca-tplv-k3u1fbpfcp-c4e962d5.png)

As we can see, the data was imported successfully.

Now let's check what the auto-increment value of `test_pk2` is:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/0ff9039366154c738331d64ebaf88d3b-tplv-k3u1fbpfcp-57f1f307.png)

As analyzed above, it is `8` rather than `6`.

Specifically, `insert……select` actually inserted 5 rows into the table: `(1, 1)`, `(2, 2)`, `(3, 3)`, `(4, 4)`, and `(5, 5)`. However, these 5 rows acquired their auto-increment IDs across three separate requests. Following the bulk allocation strategy where each request doubles the previous batch size:

- The first request allocated 1 ID: `id = 1`
- The second request allocated 2 IDs: `id = 2` and `id = 3`
- The third request allocated 4 IDs: `id = 4`, `id = 5`, `id = 6`, and `id = 7`

Since the statement actually only used 5 IDs, `id = 6` and `id = 7` were discarded/wasted. Afterward, when executing `insert into test_pk2 values(null,6,6)`, the row actually inserted becomes `(8,6,6)`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/51612fbac3804cff8c5157df21d6e355-tplv-k3u1fbpfcp-1855f2f3.png)

## Summary

This article summarizes the 4 scenarios where MySQL auto-increment values become non-continuous:

1. Auto-increment initial offset and step size are not set to `1`
2. Unique key conflict
3. Transaction rollback
4. Batch insertion (such as `insert...select` statements)
