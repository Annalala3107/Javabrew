---
title: "API Idempotency Design Explained: Idempotency Keys, Tokens, Unique Indexes, Deduplication Tables, and Payment Callbacks"
description: "Detailed guide to API idempotency design covering idempotency concepts, idempotency keys, sources of duplicate requests, Token mechanisms, unique indexes, deduplication tables, optimistic locking, pessimistic locking, distributed locks, and idempotency patterns for orders and payment callbacks."
category: High Availability
icon: mdi:shield-lock-outline
tag:
  - API Idempotency
  - High Concurrency
head:
  - - meta
    - name: keywords
      content: API Idempotency,Idempotency Design,Idempotency Key,Token Mechanism,Unique Index,Deduplication Table,Distributed Lock,Optimistic Locking,Payment Callback Idempotency,Order Idempotency,Duplicate Submission,API Idempotency Interview Questions
lang: en
sourceRef: zh-ref/high-availability/idempotency.md
---

API idempotency is both a classic interview topic and a problem developers frequently have to solve in daily engineering work.

## What Is Idempotency?

**Idempotency** is originally a mathematical concept commonly seen in abstract algebra, meaning that executing an operation once or multiple times produces the exact same effect. Expressed as a function, it can be written as $f(f(x)) = f(x)$. For example, $f(x)=|x|$ is idempotent, because taking the absolute value of a number once or multiple times yields the exact same result.

In API semantics, idempotency primarily means that the expected effect of multiple identical requests on server-side resources is the same as executing the request once. Whether the response payload must be byte-for-byte identical depends on business design; financial APIs typically also require returning a consistent business outcome.

For data operations specifically:

- Insert operations should rely on business unique keys or idempotency keys to avoid creating duplicate records.
- Update operations must distinguish between assignment updates and incremental/delta updates. Assignment updates like `update set status = 'PAID'` are naturally much easier to make idempotent, whereas incremental updates like `update set balance = balance - 100` require explicit protection against repeated execution.

API idempotency issues are commonly triggered by network fluctuations, repeated user clicks, client/gateway timeout retries, and duplicate message delivery; slow responses further amplify the likelihood of these duplicate requests.

**What happens if idempotency is not guaranteed?**

Failing to guarantee idempotency can cause severe production bugs—most notably in scenarios involving money. For instance, if idempotency is not enforced and a user clicks the pay button multiple times while making a payment, the backend processes multiple identical debit requests, charging the user's account multiple times. In financial workflows, such defects constitute high-risk production incidents.

Therefore, scenarios involving funds, inventory, orders, and coupons all require careful idempotency handling. Furthermore, enforcing idempotency cannot rely solely on the frontend—the backend must enforce it as well.

## How Do You Guarantee API Idempotency?

The frontend can gray out or disable a submit button after the user submits a request. However, this only reduces the probability of accidental duplicate clicks and cannot serve as an idempotency guarantee. Users can refresh the page, replay requests, or bypass the frontend entirely, and duplicate calls can also come from gateway timeout retries or duplicate message queue deliveries. The true idempotency boundary must reside on the server side—especially for APIs that mutate business state such as funds, inventory, and orders.

Ensuring idempotency on the backend requires a bit more effort, and several approaches exist, including pessimistic locking, unique indexes, deduplication tables, optimistic locking, distributed locks, and Token mechanisms.

The core idea of both pessimistic locking and distributed locking is using a lock so that only one request can execute at a time. However, locking alone is not enough—it must be combined with business-logic idempotency checks, such as checking whether a phone number/email/username is already registered during sign-up, or checking the order status during order payment.

In real-world projects, composite solutions are far more common: **a business unique key / idempotency ID identifies duplicate requests, a database unique index or deduplication table acts as the final safeguard, and a state machine prevents backward state transitions; distributed locks are used only when operations on the same business resource must be serialized.**

Common scenarios can be approached as follows:

- **Duplicate form submission**: Disabling the frontend button only reduces accidental double clicks; the backend should pair it with a one-time Token so the same form can only be submitted successfully once.
- **Order creation**: Business unique keys such as an order number or request ID are mandatory, backed by a database unique index as a safety net. When a duplicate request arrives, instead of creating another order, return the existing order result.
- **Payment callbacks**: A third-party transaction serial number must uniquely identify each callback, paired with an order state machine and a deduplication table to prevent crediting the same payment twice.
- **Inventory deduction**: The priority is preventing duplicate deductions and overselling, which can combine state validation, optimistic locking, Redis Lua scripts, or database transactions.
- **Message consumption**: Messages may be redelivered, so record consumption outcomes keyed by message ID or business serial number. Already-consumed messages are skipped directly or immediately acknowledged as successful.

When choosing a design, follow a few priority rules:

1. If a business unique key can solve the problem, prefer the business unique key.
2. If a database unique index can act as a safety net, never rely solely on caching.
3. For workflows involving state transitions, use a state machine to prevent repeated execution and backward state regression.
4. Consider distributed locks only when you need to protect a critical section over the same business resource.
5. High-risk financial scenarios require defense in depth—never bet everything on a single mechanism.

### Pessimistic Locking

In Java, built-in pessimistic locks from the JDK such as `ReentrantLock` or the `synchronized` keyword can ensure only one thread performs modifications at a time. However, JDK locks are local JVM locks and cannot work across distributed environments.

![Local Lock](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/jvm-local-lock-e76b860d.png)

In addition to JDK pessimistic locks, databases themselves provide exclusive locks (X locks). An exclusive lock—also known as a write lock—is acquired by a transaction when modifying a record and prevents multiple transactions from holding it concurrently. Once a record holds an exclusive lock, other transactions cannot acquire incompatible locks on that record.

Using an exclusive lock in MySQL:

```sql
SELECT ... FOR UPDATE
```

Exclusive locks can only be used with transactional storage engines (such as InnoDB) and only inside an active transaction. `SELECT ... FOR UPDATE` should hit an appropriate index; otherwise, InnoDB may scan and lock a large set of records—approaching a full-table lock—and severely degrade concurrency. Under MySQL's default `REPEATABLE READ` (RR) isolation level, InnoDB may acquire Next-Key Locks (Record Lock + Gap Lock), making it even more important to verify via `EXPLAIN` that the execution plan uses an index.

Under high concurrency, fierce lock contention blocks threads, causing heavy context switching and significant performance overhead. Moreover, pessimistic locking introduces deadlock risks that can disrupt normal execution. When using pessimistic locks, enforce consistent lock acquisition ordering, keep transactions short, ensure queries hit indexes, and inspect lock waits using `EXPLAIN` and deadlock logs.

### Optimistic Locking

Optimistic locking is generally implemented via a version-number mechanism or a CAS algorithm.

With the version-number mechanism, a version column is added to the table. Every time data is updated, the update verifies whether the current version matches the database value. If it matches, the update succeeds and increments the version by 1. If it does not match, the update fails, indicating another request has already modified the data.

```sql
-- Update data, modify price, increment version by 1, and check if version is 1 (assuming initial version is 1)
update goods set price = price + 100, version = version + 1 where id = 1 and version = 1;
-- Since version has already changed to 2, the following SQL update affects 0 rows
update goods set price = price + 100, version = version + 1 where id = 1 and version = 1;
```

In high-concurrency scenarios, optimistic locking avoids prolonged blocking waits typical of pessimistic locking, reduces thread buildup caused by lock contention, and often delivers superior performance. However, database updates can still involve row locks, so complex transactions are not completely immune to deadlock risks. Moreover, when conflicts happen frequently (write-heavy workloads), frequent failures and retries (whereas pessimistic locking has fixed overhead) can also hurt performance badly and spike CPU usage. Furthermore, this approach applies primarily to data update scenarios.

You should design the failure-handling strategy for optimistic lock conflicts upfront: you can return an explicit conflict error and let the caller decide whether to retry; perform bounded retries (2–3 attempts) on the server; or query the current state and return the existing result. In financial scenarios, blind automatic retries are discouraged—prefer returning a conflict error or querying the final state.

### Unique Index

Adding a unique index to a database table enforces data uniqueness. If a duplicate record is inserted, an exception is thrown, which the application can catch and handle. However, this approach applies only to data insertion scenarios.

```sql
create table t_order(
    id int unsigned PRIMARY KEY AUTO_INCREMENT COMMENT "Primary key",
    `code` varchar(200) not null COMMENT "Serial number",
    `customer_id`  int unsigned COMMENT "Member ID",
    `amount` decimal(10,2) unsigned not null COMMENT "Total amount",
    -- Other order columns omitted
    -- Other indexes omitted
    -- Order serial number must be unique
    UNIQUE unq_code(`code`)
) COMMENT="Order table";
```

Do not rely exclusively on a unique index to carry all idempotency logic, yet for insert operations it is strongly recommended to use a unique index as the database-level safety net to prevent duplicate rows under concurrency.

### Deduplication Table

A deduplication table is essentially another form of the unique-index pattern. It is a dedicated table used to record incoming request metadata, with a unique index on a column that uniquely identifies each request. When a client sends a request, the server inserts request identifiers (such as an order number or transaction serial number) into the deduplication table. If the insert succeeds, this is the first request and business logic proceeds; if it fails, it is a duplicate request and can be returned immediately or ignored.

```sql
CREATE TABLE deduplication_table (
    id int unsigned PRIMARY KEY AUTO_INCREMENT COMMENT "Primary key",
    processed_code varchar(200) not null COMMENT "Processed order serial number",
    -- Other columns omitted
    UNIQUE unq_processed_code(processed_code)
) COMMENT="Deduplication table";
```

Inserting into the deduplication table must happen inside the same database transaction as the subsequent business operation. Only when the transaction commits does "deduplication record exists = business processing succeeded" hold true; if business logic fails and rolls back, the deduplication record must roll back with it so subsequent retries can re-enter cleanly. Otherwise, an inconsistent state can arise where "the deduplication record was persisted, yet the business operation never completed." If database sharding places the deduplication table and business table on separate physical databases, you need distributed transaction mechanisms like TCC/Saga or an alternative consistency design.

### Distributed Lock

In distributed systems, different services or clients run across separate JVM processes. When operations on the same business resource must be serialized across JVMs, consider using a **distributed lock**.

![Distributed Lock](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-7e3da313.png)

While MySQL can also be used to build distributed locks (e.g., via `SELECT ... FOR UPDATE` or unique indexes), its performance and reliability generally lag behind dedicated coordination systems, so it is rarely used in production for that purpose.

In practice, distributed locks are typically implemented using Redis or ZooKeeper, with Redis being more common.

Relational databases can still participate in distributed concurrency control—such as unique-index safety nets, state-machine validation, and row-lock serialization—though optimistic locking and unique indexes are generally not classified as distributed locks.

For detailed introductions to distributed locks and how to implement them with Redis and ZooKeeper, refer to these dedicated articles:

- [Introduction to Distributed Locks](https://javaguide.cn/distributed-system/distributed-lock.html)
- [Summary of Common Distributed Lock Implementations](https://javaguide.cn/distributed-system/distributed-lock-implementations.html)

Crucially, the distributed lock here is keyed by a unique identifier (such as an order number). Acquiring the lock only means the current request may enter the critical section—it does NOT prove the request was never processed previously. Once inside the critical section, you must still query business state or idempotency records. For example, a payment API must check whether the order is already paid or the transaction serial number has already been processed before deciding whether to execute business logic or return the historical result directly.

Below is Redisson 3.x pseudocode demonstrating idempotency with `RLock`:

```java
// Unique identifier
String uniqueId = "order123";

// 1. Create a distributed lock object based on the unique identifier
RLock lock = redisson.getLock("lock:" + uniqueId);
boolean locked = false;

try {
    // 2. Try acquiring the lock: wait up to 3s, auto-release 30s after acquisition
    locked = lock.tryLock(3, 30, TimeUnit.SECONDS);
    if (!locked) {
        // Lock acquisition failed: return processing, retry later, or query historical result
        return;
    }

    // 3. After entering the critical section, still perform business idempotency checks
    // E.g., check whether order status / idempotency record already exists
    // Execute business logic only if unprocessed; otherwise return the historical result
    ...
} finally {
    // 4. Release only if held by the current thread
    if (locked && lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

If `leaseTime` is omitted, Redisson automatically renews the held lock via its Watchdog; if `leaseTime` is explicitly specified, the lock auto-expires after the lease duration. The `30` seconds above is only an illustration—in production, choose it based on your maximum business execution time, typically 2–3 times the estimated duration.

When using distributed locks, also watch out for these issues:

- Lock granularity: Lock by order ID, user ID, or resource ID—never use a coarse global lock.
- Lock timeout: If execution exceeds `leaseTime`, the lock may expire prematurely.
- Lock release: Always verify the current thread / owner before unlocking to avoid releasing another caller's lock.
- Lock acquisition failure: Decide clearly whether to return "processing," advise retrying later, or query historical processing results.
- Business safeguard: Always re-check order status or idempotency logs inside the lock rather than relying purely on the lock.

### Token Mechanism

The core idea of the Token mechanism is generating a unique credential token for each operation. Tokens should be generated on the server side with randomness, unpredictability, and a short TTL. If stored server-side, Redis can store the token for one-time consumption; only when building stateless tokens do you need signatures, tamper protection, and expiration claims.

This pattern requires two requests to complete one business operation:

1. Request a server-issued token with a short expiration window; the server stores that token (typically in cache).
2. Execute the actual business request, passing the token in an HTTP header or request parameter. The server validates the token: if valid, it executes the business logic; if invalid, it rejects the request and returns an error prompt.

When validating the token on the server side, never perform a separate `GET` followed by `DEL`. On Redis 6.2.0+, use `GETDEL`; on older versions, use a Lua script to execute "validate + delete" atomically so the same token can only be consumed by a single request.

Dewu Tech's article [Concurrent Access Solutions in Distributed System Design](https://mp.weixin.qq.com/s/yvKASWcRLfOok-NFPrIRsw) illustrates this workflow clearly:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/distributed-system/idempotent-token-20d48518.png)

Should you execute the business logic first and then delete the token, or delete the token first and then execute the business logic? Both orders appear to carry risks:

- Deleting the token after executing business logic allows a concurrent second request carrying the same token to pass validation while the token still exists.
- Deleting the token before executing business logic means that if business execution times out or encounters a network blip and the client needs to retry, the token can no longer be used.

In general, atomically consuming the token before executing business logic is recommended—paired with clear failure prompts, re-acquiring a token, transaction rollbacks, and idempotency log records. Financial scenarios must never rely solely on tokens; always back them up with order states and transaction logs.

Because the Token mechanism depends on Redis for token lifecycle storage, you must also plan a fallback strategy when Redis is unavailable. Ordinary forms can ask the user to retry later; financial APIs should NOT bypass checks via circuit-breaker fail-open—better to fail closed and return an error than risk duplicate debits or duplicate credits.

### Payment Callback Idempotency Workflow

Payment callbacks are a textbook scenario for idempotency design, because third-party payment platforms may invoke the same callback repeatedly due to network timeouts or dropped responses. A resilient workflow looks like this:

1. The callback request carries the third-party transaction serial number `transaction_id`.
2. A callback records table enforces a unique index on `transaction_id`.
3. Query the order status and allow updates only for valid state transitions such as `UNPAID -> PAID`.
4. Put updating the order status, inserting the ledger/fund record, and writing the callback record inside the same database transaction.
5. Return success immediately on duplicate callbacks so the third party stops retrying.

## How Do You Verify an Idempotency Solution?

Idempotency cannot be verified by reading code alone—you must prove it works through testing and data reconciliation. Especially for orders, payments, and inventory, never test only the "happy path succeeds once"; deliberately trigger duplicate requests, timeouts, failures, and rollbacks.

Practical verification methods include:

1. **Concurrent load testing**: Send 50–100 concurrent requests with the same order ID, payment serial number, or idempotency key; only one request may actually execute the business logic. All others must either return the same outcome, return "processing," or return "already processed," without creating multiple orders, multiple ledger entries, or repeated inventory deductions.
2. **Retry testing**: Simulate client timeout retries, gateway retries, third-party callback retries, and duplicate MQ deliveries. Focus on verifying whether incoming retries hit the idempotency record or business state rather than re-executing business logic.
3. **Fault-injection / anomaly testing**: Inject failures midway through execution—for example, order status updated while ledger insertion fails, token consumed while transaction rolls back, or service restart after acquiring a distributed lock. Re-sending the request after recovery must still keep data consistent with no "half-succeeded, half-failed" dirty states.
4. **Data reconciliation**: After concurrent load or fault tests complete, cross-check the order table, ledger table, inventory table, and deduplication table. For instance, one payment must correspond to only one successful ledger record, an order may transition `UNPAID -> PAID` only once, and total deducted inventory must match the count of successful orders.
5. **Log auditing**: Ensure logs record the idempotency key, request ID, business order number, processing status, and response outcome. When a production issue occurs, these fields let engineers tell whether a request was processed for the first time, retried, in progress, or blocked by idempotency checks.

Put simply, verifying idempotency is not about checking "whether the API returns success"—it is about proving that under duplicate requests and failure paths, business data is always processed accurately once and only once.

## References

- How to Guarantee API Idempotency Under High Concurrency?: <https://mp.weixin.qq.com/s/7P2KbWjjX5YPZCInoox-xQ>
- Solving Idempotency Issues—Just Remember This Rule of Thumb!: <https://mp.weixin.qq.com/s/EatpiCzNlTw1viO_flQIpg>
