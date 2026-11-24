---
title: "Distributed Transaction Solutions Explained: XA, AT, TCC, Saga, Local Message Table, and Transactional Messages"
category: Distributed Systems
description: "Comprehensive guide to distributed transaction solutions covering the principles, pros and cons, use cases, and interview key points of 2PC, 3PC, XA, Seata AT, TCC, Saga, local message tables, RocketMQ transactional messages, best-effort notification, and more."
tag:
  - Distributed Transactions
head:
  - - meta
    - name: keywords
      content: Distributed Transactions,2PC,3PC,XA,Seata AT,TCC,Saga,Local Message Table,Transactional Message,RocketMQ,Best-Effort Notification,Eventual Consistency,Compensating Transaction,Distributed Transaction Interview Questions
lang: en
sourceRef: zh-ref/distributed-system/distributed-transaction.md
---

**There are already plenty of articles about distributed transactions online—why write another one?**

1. First, most existing articles are fairly hard to follow and aren't very friendly to readers with limited experience. My goal with this article is to ensure even beginners without much work experience can truly understand distributed transactions.
2. Second, most articles don't go into enough detail and omit many important concepts related to distributed transactions.

Before diving into distributed transactions, let's review the foundational concepts around transactions.

> **Version Note**: The Seata content in this article is based on the 1.7+ / 2.x documentation, and RocketMQ transactional messages are based on the 4.9+ / 5.x documentation. Default parameters, APIs, and deployment methods may differ across versions—always verify against the official documentation for your project's actual version when implementing.

This article focuses on how cross-service writes coordinate commits or compensations. Before reading it, it is best to understand the trade-offs covered in [CAP Theorem and BASE Theory Explained](./protocol/cap-and-base-theorem.md) as well as the mutual exclusion and lease issues in [Distributed Locks](./distributed-lock.md); afterward, you can revisit your own business workflows to decide which states require strict constraints and which can be eventually consistent.

## Transactions

Imagine a scenario where we need to insert multiple related pieces of data into a database. Unfortunately, the process could encounter issues such as:

- The database suddenly crashes midway for some reason.
- The client suddenly loses connectivity to the database due to network issues.
- During concurrent database access, multiple threads write to the database simultaneously and overwrite each other's changes.
- ...

Any of the problems above can lead to data inconsistency. To guarantee data consistency, a system must be able to handle these failures. Transactions are our primary abstraction for simplifying these problems. The concept of a transaction originated in databases and has since become a much broader concept.

**What is a transaction?** In a nutshell, **a transaction is a logical group of operations that either all execute or none execute at all.**

The most classic and frequently cited example of a transaction is a bank transfer. Suppose Xiao Ming transfers 1,000 yuan to Xiao Hong. This transfer involves two key operations, and both must succeed together or fail together:

1. Deduct 1,000 yuan from Xiao Ming's balance.
2. Add 1,000 yuan to Xiao Hong's balance.

A transaction treats these two operations as a single logical unit: the operations in this unit either all succeed or all fail. That way, we never end up in a state where Xiao Ming's balance decreases while Xiao Hong's balance does not increase.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-a0059ccb.png)

## Database Transactions

In most cases, when we talk about transactions without specifying **distributed transactions**, we are referring to **database transactions**.

Database transactions are what we encounter most often in day-to-day development. If your project follows a monolithic architecture, database transactions are typically what you work with.

**What role do database transactions serve?**

Put simply, a database transaction ensures that multiple operations on a database (i.e., SQL statements) form a single logical unit. The database operations within this logical unit obey the rule: **either all succeed, or none take effect**.

```sql
# Start a transaction
START TRANSACTION;
# Multiple SQL statements
SQL1,SQL2...
## Commit transaction
COMMIT;
```

![Database Transaction Diagram](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-34ac1d2d.png)

Additionally, transactions in relational databases (such as `MySQL`, `SQL Server`, `Oracle`, etc.) have the **ACID** properties:

![ACID](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/ACID-ad1efa4f.png)

1. **Atomicity**: A transaction is the smallest unit of execution and cannot be divided. Atomicity guarantees that actions either all complete or have no effect at all.
2. **Consistency**: Data remains consistent before and after a transaction executes. For example, in a transfer workflow, whether the transaction succeeds or fails, the combined total balance of the sender and recipient must remain unchanged.
3. **Isolation**: Under concurrent database access, one user's transaction is shielded from interference by other transactions, and each concurrent transaction operates independently from the perspective of the database.
4. **Durability**: Once a transaction is committed, its changes to database data are permanent and should survive even database failures.

🌈 One extra note here: **Consistency is only guaranteed after Durability, Atomicity, and Isolation are guaranteed—in other words, A, I, and D are the means, and C is the goal!** Like me, many of you were probably misled by the ACID acronym for a long time! I only straightened this out after watching Zhou Zhiming's open course [Zhou Zhiming's Software Architecture Course (in Chinese)](https://time.geekbang.org/opencourse/intro/100064201) (read good books!!!).

![AID->C](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/AID--C-78c67e55.png)

Moreover, the author of DDIA—[*Designing Data-Intensive Applications*](https://book.douban.com/subject/30329536/)—writes:

> Atomicity, isolation, and durability are properties of the database, whereas consistency (in the ACID sense) is a property of the application. The application may rely on the database’s atomicity and isolation properties in order to achieve consistency, but it’s not up to the database alone.
>
> Translated, this means: atomicity, isolation, and durability are properties of the database, whereas consistency (in the ACID sense) is a property of the application. The application may rely on the database's atomicity and isolation properties to achieve consistency, yet that does not depend on the database alone. Therefore, the letter C does not belong in ACID.

I strongly recommend *Designing Data-Intensive Applications*—it is worth reading many times! Nearly 90% of reviewers on Douban gave it five stars. Furthermore, an open-source Chinese translation is available on GitHub at [https://github.com/Vonng/ddia](https://github.com/Vonng/ddia).

![](/media/jg/ext/img-blog.csdnimg.cn/20210526162552353-03025e6b.png)

**How are database transactions implemented under the hood?**

Let's briefly explain using MySQL's InnoDB engine as an example.

MySQL's InnoDB engine uses the **redo log** to guarantee transaction **durability** and the **undo log** to guarantee transaction **atomicity**. InnoDB uses **locking mechanisms**, **MVCC**, and related techniques to guarantee transaction **isolation** (the default isolation level is **`REPEATABLE-READ`**).

## Distributed Transactions

In a microservices architecture, a system is decomposed into multiple smaller microservices. Each microservice may run on different machines, and each may have its own dedicated database. In this setup, a single logical operation often spans multiple microservices and multiple databases. For example, in an e-commerce system, creating an order typically involves the Order Service (incrementing order count / creating an order) and the Inventory Service (deducting stock), each backed by its own dedicated database.

![Distributed Transaction Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-with-two-services-24ad066a.png)

**How do we ensure this group of operations either all succeed or all fail?**

At this point, relying solely on local database transactions is no longer enough! We must introduce **distributed transactions**.

In fact, any scenario spanning multiple databases requires distributed transactions. For instance, when a single database hits a performance bottleneck or grows too large in data volume, we perform **database sharding**. Once tables from the same logical database are distributed across multiple database instances, if a single operation touches multiple databases, the database's built-in local transaction can no longer meet our needs.

In short, **the ultimate goal of a distributed transaction is to guarantee data consistency across multiple interrelated databases in a system!**

Since a distributed transaction is still a transaction, in theory it should obey all four ACID properties. However, considering performance, availability, and other practical constraints, we usually cannot satisfy strict ACID completely and must settle for a well-considered trade-off.

To address distributed transactions, several new theories emerged.

## Foundational Theories for Distributed Transactions

### CAP Theorem and BASE Theory

The CAP theorem and BASE theory are prerequisite knowledge for understanding distributed transaction trade-offs. When writing data across services, a system generally cannot pursue strong consistency, continuous availability, and low complexity all at once—it ultimately comes down to an engineering judgment of "which steps must enforce strict constraints and which steps can converge through compensation."

We will not repeat the full definitions of CAP and BASE here; it is recommended to read [CAP Theorem and BASE Theory Explained](./protocol/cap-and-base-theorem.md) first. If you want to understand further why Leader/Quorum, split-brain, Leases, and Fencing Tokens affect locks, transactions, and configuration centers, continue reading [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md).

### Three Levels of Consistency

We can classify system consistency requirements into the following three levels:

- **Strong Consistency**: Whatever the system writes is immediately what any subsequent read observes.
- **Weak Consistency**: Reads are not guaranteed to return the most recently written value, nor is there a bound on how long it takes before the latest data becomes visible—the system merely tries to reach a consistent state at some point.
- **Eventual Consistency**: An upgraded form of weak consistency. The system guarantees that data will converge to a consistent state within some bounded period of time.

Beyond these three common consistency levels, there are other consistency models such as read-your-writes consistency and causal consistency. For details, you can refer to the paper [*Operational Characterization of Weak Memory Consistency Models*](https://es.cs.uni-kl.de/publications/datarsg/Senf13.pdf). Because these models rarely show up in day-to-day work, I won't elaborate on them here (partly because I'm not deeply versed in them myself 😅).

The industry largely favors **eventual consistency**, though scenarios with extremely strict consistency requirements—such as bank transfers—still require strong consistency.

### Flexible Transactions (Soft Transactions)

What matters most for internet applications is maintaining high availability—even a few seconds of downtime in a distributed system can cause enormous losses. Under these demands, pioneers built upon the CAP theorem and BASE theory to propose the concept of **flexible transactions** (soft transactions). **Flexible transactions pursue eventual consistency.**

In essence, a flexible transaction is **BASE theory + business practice**. Its goal is to guarantee eventual consistency of system data through appropriate domain-specific mechanisms. Approaches like **TCC**, **Saga**, **MQ transactions**, and **local message tables** fall under flexible transactions.

### Rigid Transactions (Hard Transactions)

The counterpart to flexible transactions is **rigid transactions**. As we noted, **flexible transactions pursue eventual consistency**, whereas rigid transactions pursue **strong consistency**. **2PC** and **3PC** belong to rigid transactions.

![Distributed Transaction Solutions Summary](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-solution-summary-d5693981.png)

## Distributed Transaction Solutions

There are many distributed transaction solutions, such as **XA / 2PC**, **3PC**, **AT**, **TCC**, **Saga**, **Local Message Table**, **MQ Transactions** (both Kafka and RocketMQ offer transactional features), and **Best-Effort Notification**.

2PC and 3PC are non-intrusive to business code. The XA specification is the Distributed Transaction Processing (DTP) standard defined by the X/Open consortium; it defines interfaces between TM and RM and typically completes commits using 2PC. TCC and Saga are business-intrusive approaches, AT sits between XA and TCC, MQ transactions rely on message-queue architectures, and local message tables and best-effort notification primarily pursue eventual consistency without automatic rollback.

Each solution suits different scenarios, so we must choose the right approach based on our project's specific needs.

A simple selection guideline:

- **Cannot tolerate eventual consistency**: Prefer XA / 2PC—suitable for short-lived, strongly consistent scenarios such as finance and accounting, provided you accept the performance and availability trade-offs.
- **Want minimal business code changes**: Evaluate Seata AT, local message tables, or MQ transactions. AT has low business intrusion, but imposes requirements on table schemas, supported SQL syntax, and global locks.
- **Can accept business intrusion with relatively short call chains**: Consider TCC—classic examples include account freezing, inventory reservation, and coupon locking where resource reservation is needed.
- **Long call chains with many steps**: Consider Saga—classic examples include order fulfillment, travel booking, and approval workflows.
- **Only need to notify another party of eventual completion**: Consider best-effort notification—for example, payment callbacks, logistics status notifications, or reward points issuance.

Before introducing 2PC and 3PC, let's first cover the roles involved in 2PC and 3PC (the roles defined by the XA specification):

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/xa-specification-roles-ab4367c0.webp)

- **AP (Application Program)**: The application itself.
- **RM (Resource Manager)**: The transaction participant—in most cases a database (we use relational databases as examples below). A distributed transaction typically involves multiple RMs.
- **TM (Transaction Manager)**: The transaction coordinator responsible for managing global transactions, assigning unique global transaction identifiers, monitoring execution progress, and driving commits, rollbacks, and failure recovery.

### 2PC (Two-Phase Commit Protocol)

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/2pc-work-flow-78d968a7.png)

What the letters in 2PC (Two-Phase Commit) stand for:

- **2** -> Refers to the 2 phases of committing a transaction
- **P** -> Prepare phase
- **C** -> Commit phase

2PC divides the transaction commit process into two phases: the **Prepare phase** and the **Commit phase**.

#### Prepare Phase

The core of the Prepare phase is asking transaction participants whether they can successfully execute their local database transaction operations.

Workflow of the Prepare phase:

1. **The transaction coordinator/manager (hereafter TM)** sends a query message to all involved **transaction participants (hereafter RM)**: "Can you execute the transaction operation?" and waits for their replies.
2. Upon receiving the message, each **RM** executes local database transaction pre-operations such as writing redo log / undo log entries, **without committing the transaction yet**.
3. If the **RM** executes the local transaction operations successfully, it replies "Yes" indicating it is ready; otherwise it replies "No" indicating it is not ready.

#### Commit Phase

The core of the Commit phase is instructing participants to commit or roll back the local transaction and confirming completion.

When all participants are in the "ready" state:

1. **TM** sends a message to all participants: "You may commit the transaction!" (**Commit message**).
2. Upon receiving the **Commit message**, each **RM** executes **the local database transaction commit**, and afterward **releases all resources held during the transaction**.
3. Each **RM** replies: "Transaction committed" (**ACK message**).
4. Once **TM** receives **ACK messages** from all **transaction participants**, the entire distributed transaction formally concludes.

![2PC Diagram - Ready](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-2pc-ready-07738422.png)

When any participant is in the "not ready" state:

1. **TM** sends a message to all participants: "Execute rollback now!" (**Rollback message**).
2. Upon receiving the **Rollback message**, each **RM** executes **the local database transaction rollback**, and afterward **releases all resources held during the transaction**.
3. Each **RM** replies: "Transaction rolled back" (**ACK message**).
4. Once **TM** receives **ACK messages** from all **RMs**, the transaction is aborted.

![2PC Diagram - Not Ready](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-2pc-not-ready-f0c0e7d6.png)

#### Summary

A quick recap of key points about the two phases of **2PC**:

1. The primary goal of the **Prepare phase** is to test whether each **RM** can execute its **local database transaction** (!!! Note: the transaction is NOT committed in this step).
2. In the **Commit phase**, the **TM** decides whether to commit or roll back based on the **RM** responses from the **Prepare phase**.
3. After the **Commit phase**, the current distributed transaction is guaranteed to finish.

**Advantages of 2PC:**

- Simple theoretical model, easy to understand and implement.
- Mainstream databases (such as MySQL InnoDB, Oracle, PostgreSQL) generally support XA and can act as RMs in 2PC, coordinated by an external TM to commit or roll back.

**Trade-offs of 2PC:**

- 2PC is designed to aim for strong data consistency. However, in engineering practice, due to extreme cases such as network partitions, TM crashes, or RM timeouts, data inconsistency or prolonged transaction blocking can still happen—it does not mean "inherently guaranteed absolute strong consistency."

**Problems with 2PC:**

- **Synchronous Blocking**: Transaction participants hold onto related resources throughout the process until the transaction formally commits. For example, while Xiao Ming transfers money to Xiao Hong, any other transaction attempting to operate on Xiao Ming or Xiao Hong will block.
- **Data Inconsistency**: Network issues or TM crashes can cause data inconsistency. For example, during Phase 2 (Commit), a partial network failure causing some participants to miss the Commit/Rollback message will leave data inconsistent.
- **Single Point of Failure**: The TM plays a critical role. If the TM crashes after the Prepare phase completes, participants remain stuck indefinitely in the Commit phase.

### XA Mode

XA can be understood as the standardized implementation of 2PC at the database/resource layer. 2PC is a commit protocol, whereas XA is the DTP interface specification defined by X/Open that specifies how a TM coordinates multiple RMs participating in the same global transaction.

Typical workflow:

1. The AP initiates a global transaction, and the TM creates the global transaction context.
2. Each RM (e.g., different databases) executes its local transaction without actually committing yet.
3. The TM calls `prepare` on every RM; if all RMs prepare successfully, it calls `commit`, otherwise it calls `rollback`.

XA's advantage is low business intrusion—the database itself handles transaction isolation and rollback—making it suitable for short, strongly consistent transactions under moderate concurrency. The downside is equally obvious: database resources remain locked for a long time during the transaction, easily hurting both performance and availability.

Seata has supported XA mode since version 1.2. Seata XA mode leverages the XA protocol support built into databases and messaging systems to manage branch transactions, offering stronger consistency overall, though its throughput is generally lower than flexible approaches like AT, TCC, or Saga.

### 3PC (Three-Phase Commit Protocol)

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/3pc-work-flow-69cb4f53.png)

3PC is an optimized version of 2PC. It splits 2PC's **Prepare phase** into two separate phases: `CanCommit` (only asks whether participants can commit, without performing transaction pre-operations) and `PreCommit` (executes transaction pre-operations and writes redo/undo logs). Combined with the final `DoCommit`, there are three phases in total:

1. `CanCommit` (ask if ready to commit)
2. `PreCommit` (execute transaction pre-operations)
3. `DoCommit` (actually commit)

![3PC Diagram - Ready](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-3pc-ready-05930c2d.png)

#### CanCommit Phase

In the `CanCommit` phase, RMs do not perform any transaction operations; the TM simply sends a **prepare request** to RMs asking whether they are capable of executing the local database transaction. Each RM responds with "Yes", "No", or times out without replying.

#### PreCommit Phase

If all RMs reply "Yes" in `CanCommit`, the TM sends a **PreCommit message** to all RMs, upon which RMs execute local transaction pre-operations such as writing redo/undo logs.

If any RM replies "No" or times out during `CanCommit`, the TM sends an **Abort message** to all RMs, and they immediately abort the transaction. The loss to RMs is minimal because they haven't actually done any work yet.

If an RM succeeds in executing the transaction pre-operations, it returns "YES"; otherwise it returns "No" (a final chance to back out).

In the `PreCommit` phase, both TM and RMs introduce timeout mechanisms: if a **participant** does not receive the `PreCommit` message from the TM, or the TM does not receive pre-execution status responses from participants within the wait window, the transaction is aborted, avoiding prolonged resource blocking.

#### DoCommit Phase

The **DoCommit** phase performs the actual transaction commit.

If all RMs reply "YES" in `PreCommit`, the TM sends a **DoCommit message** to all RMs; upon receiving it, each RM commits its local database transaction and releases held resources afterward, then returns "YES".

If any RM replies "NO" or times out in `PreCommit`, the TM sends an **Abort message** to all RMs, causing them to roll back the transaction, release resources, and terminate the transaction.

If an RM does not receive the `DoCommit` message from the TM within the configured timeout, the RM assumes the TM may have crashed and directly commits the transaction.

As long as all RMs return `Yes` during `PreCommit`, once the protocol enters the third phase, the transaction is very likely to succeed.

However, pay close attention here: **RM default-commit on timeout is 3PC's double-edged sword.** While it alleviates the issue in 2PC where a TM crash leaves RMs blocked forever, it introduces a new inconsistency risk. For instance, if the TM originally decided to Abort, yet only some RMs receive the Abort message while others time out and commit by default, the same transaction ends up "partially committed and partially rolled back" across different RMs. This is a major reason why 3PC is rarely deployed in real-world engineering.

#### Summary

**Besides splitting 2PC's Prepare phase further, what else did 3PC improve?**

3PC introduced **timeout mechanisms** on both the TM and RMs. If the TM does not hear back from RMs within a set time, it defaults to failure and aborts; if RMs go too long without receiving the next instruction from the TM, they decide whether to abort or commit depending on their current phase, trying to avoid prolonged resource blocking.

Even so, 3PC does not cleanly solve 2PC's blocking problem and introduces worse performance plus lingering consistency hazards. Consequently, 3PC is not widely used in practice. In real-world engineering, the mainstream direction is to use consensus protocols like Paxos or Raft (typically combined with the replicated state machine pattern) to solve coordinator single points of failure and state consistency, rather than using 3PC directly.

### TCC (Compensating Transaction)

TCC is currently one of the more common flexible transaction solutions. Pat Helland's 2007 paper [*Life beyond Distributed Transactions: an Apostate’s Opinion*](https://www.ics.uci.edu/~cs223/papers/cidr07p15.pdf) discusses the idea of avoiding traditional distributed transactions in favor of business-level compensation—well worth a read if you're interested.

Simply put, TCC stands for Try, Confirm, and Cancel, and consists of three phases:

1. **Try Phase**: Attempt execution—complete business validation and reserve the necessary business resources.
2. **Confirm Phase**: Confirm execution—when the Try phase succeeds across all participants, Confirm runs and processes the resources reserved in Try. Otherwise, Cancel is executed.
3. **Cancel Phase**: Cancel execution—release the business resources reserved during the Try phase.

Each phase is controlled by business code, avoiding long database transactions and long-held database locks—at the cost of higher business code intrusion, since developers must manually implement resource reservation, confirmation, cancellation, retries, and exception compensation.

Take a transfer scenario as an example:

1. **Try Phase**: Check whether the account balance is sufficient and reserve (freeze) the transfer funds.
2. **Confirm Phase**: If the Try phase succeeds, perform the actual balance deduction and credit.
3. **Cancel Phase**: Release the transfer funds reserved during the Try phase.

Normally, when using `TCC` mode, we need to implement the `try`, `confirm`, and `cancel` methods ourselves to achieve eventual consistency.

Under normal execution, `try` and `confirm` run.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-tcc-confirm-ce9bca30.png)

If an exception occurs, `try` and `cancel` run.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-tcc-cancel-ede00aff.png)

If an error occurs during Try, Cancel can be executed. **What if Confirm or Cancel itself fails?**

TCC records and persists transaction logs to durable storage—such as local files, a relational database, or ZooKeeper. The transaction log tracks execution state so the system can determine whether the transaction succeeded or failed and at which exact step. If Confirm or Cancel fails, the framework retries executing Confirm or Cancel. The retry count depends on the specific framework; if retries still fail beyond the maximum threshold, alerts are typically triggered for manual intervention.

Provided the code has no special bugs, the probability of Confirm or Cancel failing is relatively low.

There are three classic engineering pitfalls when implementing TCC in production:

1. **Idempotency**: Confirm and Cancel may be called repeatedly due to network timeouts or TC retries, so repeated invocations must produce the same outcome. A common practice is maintaining a transaction state table in the database and checking state before execution.
2. **Empty Rollback (Null Rollback)**: A Try request never actually reached the RM due to network issues, yet the TM triggers Cancel. Cancel must recognize this as "a transaction that was never Tried" and return success directly without mistakenly executing rollback logic.
3. **Suspension (Dangling Try)**: Cancel arrives at the RM before Try, and then the delayed Try request finally shows up. If Try goes ahead and reserves resources, those resources may never be Confirmed or Canceled. The solution is checking in Try whether the transaction has already been Canceled, and rejecting Try if so.

**Are transaction logs ever deleted?** Yes. Once a transaction commits successfully without throwing any exceptions, its transaction logs can be deleted to save storage.

**TCC does not depend on transaction support from underlying data stores, but requires us to write more custom code**, making it a **business-intrusive** distributed transaction solution.

The philosophy behind TCC resembles 2PC—I drew a simple diagram comparing the two.

![2PC vs. TCC](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/2pc-vs-tcc-842c0135.png)

**What are the differences between TCC and 2PC/3PC?**

- 2PC/3PC rely on transactions at the database or storage resource layer, whereas TCC is implemented primarily by modifying business code.
- 2PC/3PC are non-intrusive to business code, whereas TCC intrudes into business code.
- 2PC/3PC pursue strong consistency and hold database locks throughout the entire two-phase commit process; TCC pursues eventual consistency and does not hold locks on business resources for the entire duration.

There are several notable open-source frameworks for TCC. Implementation details vary slightly across frameworks, though the core ideas are the same:

1. **[ByteTCC](https://github.com/liuyangming/ByteTCC)**: A distributed transaction manager built around the Try-Confirm-Cancel (TCC) mechanism. Related reading: [Thoughts on Implementing a TCC Distributed Transaction Framework (in Chinese)](https://www.bytesoft.org/how-to-impl-tcc/)
2. **[Seata](https://seata.apache.org/zh-cn/)**: An open-source distributed transaction solution supporting four modes—AT, TCC, Saga, and XA. Here we are referring to its TCC mode.
3. **[Hmily](https://gitee.com/dromara/hmily)**: A financial-grade distributed transaction solution. When selecting for new projects, evaluate its community activity alongside alternatives like Seata.

### AT Mode (Automatic Compensation)

AT (Automatic Transaction) mode is one of Seata's core modes, aiming to provide eventual consistency while minimizing changes to business code. You can think of it as an "automatic compensation" approach: business operations still commit as local transactions, while the framework records the metadata needed for rollback.

AT mode broadly consists of two phases:

1. **Phase 1**: Business SQL executes normally and commits its local transaction; simultaneously, Seata's proxy data source parses the SQL, records before-image / after-image data into an `undo_log` table, and registers the branch transaction with the TC.
2. **Phase 2 Commit**: If the global transaction commits, the TC notifies RMs to asynchronously delete the `undo_log` records.
3. **Phase 2 Rollback**: If the global transaction rolls back, each RM generates reverse compensating SQL from `undo_log` to restore the data back to its before-image.

AT mode's advantage is low business intrusion, making it a strong fit for standard CRUD workloads on relational databases. Its drawbacks are constraints around supported SQL types, primary keys, global locks, and isolation levels—making it unsuitable for complex SQL queries or transactions spanning non-relational resources.

### TCC vs. Saga

| Dimension               | TCC                                            | Saga                                                       |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Resource Handling       | Reserves or freezes resources in Try phase     | Each step commits its local transaction immediately        |
| Isolation               | Achieves "pseudo-isolation" via business reservation | Weak isolation; committed intermediate results are visible to other transactions |
| Business Intrusion      | High; requires Try/Confirm/Cancel logic        | High; requires forward and compensating logic for each step |
| Suitable Transaction Length | Better for short chains with explicit resource reservation | Better for long chains and multi-step workflows    |
| Typical Use Cases       | Transfers, inventory freezing, coupon locking  | Order fulfillment, travel booking, approval workflows      |

### MQ Transactions

RocketMQ, Kafka, Pulsar, and QMQ all provide transaction-related capabilities. Transactions allow event-driven streaming applications to treat consuming, processing, and producing messages as a single atomic operation.

Let's use RocketMQ as an example (image source: *Message Queue Mastery* course). Related reading: [RocketMQ Transactional Message Reference Docs](https://rocketmq.apache.org/docs/featureBehavior/04transactionmessage/).

![](/media/jg/ext/img-blog.csdnimg.cn/2021060810404597-553c5fca.png)

1. The MQ producer (e.g., Logistics Service) begins a transaction on the message queue and sends a "half message" (prepared message) to the MQ Server/Broker. Before the transaction commits, the half message is invisible to MQ subscribers/consumers (e.g., Third-Party Notification Service).
2. Once the half message is sent successfully, the MQ producer executes its local transaction.
3. If the producer's local transaction succeeds, the half message turns into a normal message and becomes consumable; if the local transaction fails, the half message is rolled back directly.

From this flow, RocketMQ's transactional message clearly borrows from the idea of two-phase commit: send a half message first (invisible to consumers), and once the local transaction finishes successfully, commit the half message so it becomes a normal message ready for consumption. Note that this is not 2PC in the traditional XA sense, but rather a specialized mechanism designed by the MQ to ensure eventual consistency between "local transaction outcome" and "message visibility."

**What if the MQ producer fails when committing or rolling back the transactional message?**

The RocketMQ Broker periodically queries back to the MQ producer to check the execution status of the local transaction, and decides whether to commit or roll back the message based on the check-back result.

This transaction check-back mechanism relies on a callback interface implemented in our business code—for instance, to check whether the local transaction that created a shipping record succeeded, you simply query the database to see if that shipping record exists.

![](/media/jg/ext/img-blog.csdnimg.cn/20210608114710962-a730f743.png)

**What if a normal message fails to be consumed properly?**

When message consumption fails, RocketMQ automatically retries delivery. If the message still fails after exceeding the maximum retry count, RocketMQ considers it problematic and routes it to a **Dead-Letter Queue (DLQ)**.

![](/media/jg/ext/img-blog.csdnimg.cn/20210608120207740-c347cecf.png)

Messages entering the Dead-Letter Queue typically require manual investigation and intervention.

**QMQ** implements transactional messages much more simply by leveraging the database's built-in transactions. Its core idea is the **Local Message Table** pattern proposed by eBay, breaking a distributed transaction down into local transactions.

We maintain a local message table to store message sending status, and the operation of saving the message record to the local message table commits inside the same local database transaction as the business operation. Thus, if the business operation succeeds, the message record is guaranteed to be written too.

Next, a separate background thread periodically polls the message table and publishes pending messages to the message broker.

Once the broker confirms delivery, we mark the message status as sent or delete the record.

The core difference between these two approaches lies in their dependency on MQ availability:

- **RocketMQ Transactional Messages**: The local transaction itself does not depend on the Broker, yet sending the half message must succeed before executing the local transaction. When the Broker is unavailable, sending the half message fails, and the application layer must decide whether to fail fast, retry, or fall back to another compensation workflow—it shouldn't be oversimplified as "the entire app dies."
- **QMQ / Local Message Table**: Messages are first persisted into the producer's local database inside the same local transaction as business data. Brief MQ unavailability does not block the business transaction from committing, and an independent background thread handles delivery afterward.

Therefore, the local message table approach has higher tolerance for brief MQ outages, at the cost of requiring the business team to maintain the message table, delivery worker, retry policy, idempotent consumption, and reconciliation mechanisms. QMQ simply packages this local message table pattern into a complete, out-of-the-box solution.

Related reading: [Interviewer: What Are the Drawbacks of RocketMQ Distributed Transactional Messages? (in Chinese)](https://mp.weixin.qq.com/s/cBx1l1zaThN6_808fMl27g)

### Saga

Saga has a remarkably long history—the Saga transaction model was proposed in 1987 by Hector Garcia-Molina and Kenneth Salem in their ACM paper [*Sagas*](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), predating the modern concept of distributed transactions.

Saga is a long-running transaction solution whose core idea is splitting a long transaction into a sequence of short local transactions.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-saga-591e5230.png)

- Long transaction —> `T1, T2 ... Tn` short local transactions
- Each short transaction has a corresponding compensating action —> `C1, C2 ... Cn`

The diagram below comes from [Microsoft Architecture Docs — Saga Distributed Transactions](https://docs.microsoft.com/zh-cn/azure/architecture/reference-architectures/saga/saga).

![](/media/jg/ext/img-blog.csdnimg.cn/20210611101344496-05eaefc9.png)

If all short transactions `T1, T2 ... Tn` complete smoothly, the entire transaction finishes cleanly; otherwise, recovery mode is triggered.

**Backward Recovery:**

- Overview: If short transaction `Ti` fails to commit, compensate all already-completed transactions in reverse order (`Ci` compensates `Ti`, and so on).
- Execution order: `T1, T2, ..., Ti (fails), Ci (compensate), ..., C2, C1`.

**Forward Recovery:**

- Overview: If short transaction `Ti` fails to commit, keep retrying `Ti` until it succeeds.
- Execution order: `T1, T2, ..., Ti (fails), Ti (retry) ..., Ti+1, ..., Tn`.

Like TCC, both forward operations and compensating operations in Saga must be implemented by business developers, making it a **business-intrusive** distributed transaction solution. One major difference from TCC is that Saga has no "Try" action—its local transactions `Ti` commit immediately, yielding very high performance!

Compensating operations are themselves business code and can also fail due to network issues, unavailable external dependencies, or changing business rules. Saga frameworks typically handle compensation failures via "continuous retries + max retry cap + manual intervention," meaning every compensating action must be designed to be idempotent. To improve fault tolerance (for example, the Saga orchestrator itself could crash) and ensure every sub-transaction is either committed or compensated, we also persist these execution steps to a durable log (a Saga log, analogous to a database WAL). Once the Saga engine recovers, it knows exactly which short transaction or compensating action was in progress.

Moreover, because Saga has no "Try" step to reserve resources, it cannot guarantee isolation—one of Saga's major drawbacks.

There are also solid open-source frameworks for Saga. Implementations vary slightly across frameworks, though the core ideas remain the same:

1. **[ServiceComb Pack](https://github.com/apache/servicecomb-pack)**: An eventual data consistency solution for microservice applications.
2. **[Seata](https://seata.apache.org/zh-cn/)**: An open-source distributed transaction solution supporting Saga as one of its modes.

### Best-Effort Notification

Best-effort notification is a more lightweight eventual consistency pattern commonly seen in payment callbacks, logistics status notifications, reward points issuance, and similar workflows.

Its idea is straightforward: after the initiator completes its local transaction, it tries its best to notify the receiver of the outcome. If notification fails, it keeps retrying at fixed intervals or with exponential backoff; the receiver's endpoint must guarantee idempotency. Beyond the maximum retry count, cases generally go to manual handling or reconciliation compensation.

Best-effort notification can be viewed as a simplified variant of the local message table pattern: it avoids introducing an MQ by having the initiator directly retry calling the receiver's API, though its reliability and peak-shaving capability are typically weaker than the full "local message table + MQ + idempotent consumer" solution.

## Brief Overview of Seata's All-in-One Solution

Seata is a widely adopted one-stop distributed transaction solution, featuring three core roles:

- **TC (Transaction Coordinator)**: Maintains global transaction and branch transaction states.
- **TM (Transaction Manager)**: Defines global transaction boundaries and is responsible for beginning, committing, or rolling back global transactions.
- **RM (Resource Manager)**: Manages branch transaction resources, registers branch transactions with the TC, and reports branch status.

Seata supports multiple transaction modes:

| Mode | Business Intrusion | Consistency Goal                   | Typical Characteristics                                      | Suitable Scenarios                                  |
| ---- | ------------------ | ---------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| AT   | Low                | Eventual consistency               | Auto-generates `undo_log`; automatic phase-2 compensation    | Routine relational database CRUD                    |
| TCC  | High               | Eventual consistency / business-enforced | Business implements Try/Confirm/Cancel                 | Short-chain transactions needing resource reservation |
| Saga | High               | Eventual consistency               | Long transaction split into local transactions + compensations | Long workflows, multi-service orchestration       |
| XA   | Low                | Strong consistency bias            | Relies on DB XA support; long resource lock holding time     | Short, strongly consistent, low-concurrency scenarios |

Therefore, Seata should not be loosely pigeonholed as merely a TCC or Saga framework. In real-world selection, pick the appropriate mode among AT / TCC / Saga / XA based on business intrusion tolerance, database support, call chain length, performance requirements, and consistency needs.

## Recommended Reading

To help you study further, here is a curated list of great articles (in Chinese) for reference:

> **[Deep Dive into Saga Distributed Transactions (in Chinese)](https://segmentfault.com/a/1190000041001954)**
>
> **[The Seven Classic Solutions for Distributed Transactions (in Chinese)](https://segmentfault.com/a/1190000040321750)**
>
> **[Common Pitfalls in Using Distributed Transactions—And How to Get Them Right (in Chinese)](https://segmentfault.com/a/1190000041031586)**
>
> Ye Dongfu 👍👍👍👍👍

Very well written, with a comprehensive and thorough summary of the solutions.

> [Comparing 7 Distributed Transaction Solutions—Still Prefer Alibaba's Open-Source Seata! (Principles + Hands-On) (in Chinese)](https://mp.weixin.qq.com/s/sXVSFqq2UZ6Pwwt7vx7vIA)
>
> Ma Yuan Tech Column 🗓️2021-10-25 👍👍👍👍👍

Introduces mainstream distributed transaction solutions along with Alibaba's open-source one-stop solution, Seata.

This article covers not only theory, but also hands-on practice with Seata's AT mode.

> **[Seata Distributed Transaction Practice and Open-Source Deep Dive | GIAC Transcript (in Chinese)](https://www.sofastack.tech/blog/seata-distributed-transaction-deep-dive/)**
>
> Zhang Sen 🗓️2019-07-02 👍👍👍👍👍

This article is a transcript of a talk at the GIAC Global Internet Architecture Conference by Zhang Sen (alias: Shaohui), a technical expert at Ant Financial and one of the creators of Seata. It explains in detail why distributed transaction problems arise and Ant Financial's countermeasures (Seata's four modes: AT, TCC, Saga, and XA).

There are plenty of vivid diagrams inside to help understanding—truly a top-notch article!

> **[14,000 Words and 25 Diagrams to Help You Master Distributed Transaction Principles (in Chinese)](https://mp.weixin.qq.com/s/qeUfEJFYCfyDjgzDnq_Jdw)**
>
> Ma Hai 🗓️2020-10-30 👍👍👍👍👍

Covers single-data-source vs. multi-data-source transactions, common distributed transaction solutions, and the implementation of Seata in AT mode.

> **[6 Diagrams to Fully Understand Distributed Transaction XA Mode (in Chinese)](https://mp.weixin.qq.com/s/Rp8paKc2bQhERBGDKtpMcA)**
>
> Zhu Jinjun 🗓️2021-04-25 👍👍👍

An article from Alibaba Cloud Native mainly introducing XA mode as well as Seata's implementation and optimizations for XA mode. The overview is relatively high-level, so pair it with related articles for deeper understanding.

## Open-Source Distributed Transaction Projects

1. **[Seata](https://seata.apache.org/zh-cn/)**: An open-source distributed transaction solution supporting AT, TCC, Saga, and XA modes, committed to providing high-performance and easy-to-use distributed transaction services in microservices architectures.
2. **[Hmily](https://gitee.com/dromara/hmily)**: A high-performance, financial-grade flexible distributed transaction framework primarily providing TCC and TAC (auto-generated rollback SQL) solutions. When evaluating for new projects, pay attention to community activity alongside Seata and DTM.
3. **[Raincat](https://gitee.com/dromara/Raincat)**: A two-phase commit distributed transaction middleware.
4. **[Myth](https://gitee.com/dromara/myth)**: An open-source distributed transaction framework built on message queues, written in Java (JDK 1.8) and supporting RPC frameworks such as Dubbo, Spring Cloud, and Motan.

## References

- [Consistency Protocols in Distributed Systems: 2PC and 3PC - Matt - 2018 (in Chinese)](https://matt33.com/2018/07/08/distribute-system-consistency-protocol/)
- [Dealing Distributed Transactions with 2PC, 3PC, Local Transaction Table with MQs - Adrian - 2021](https://masteranyfield.com/2021/07/26/dealing-distributed-transactions-with-2pc-3pc-local-transaction-table-with-mqs/)
- [How to Understand That 3PC Solves 2PC's Blocking Problem? - Zhihu Discussion (in Chinese)](https://www.zhihu.com/question/422691164)
- [Apache Seata Official Documentation](https://seata.apache.org/docs/overview/what-is-seata/)
- [Seata XA Mode](https://seata.apache.org/zh-cn/docs/user/mode/xa)
- [Seata TCC Fence: Idempotency, Null Rollback, and Suspension](https://seata.apache.org/blog/seata-tcc-fence)
- [RocketMQ Transactional Message Official Documentation](https://rocketmq.apache.org/docs/featureBehavior/04transactionmessage/)
