---
title: Detailed Explanation of Optimistic Locking and Pessimistic Locking
description: "In-depth comparison of Optimistic Locking vs. Pessimistic Locking: explaining Pessimistic Locking implementations with synchronized/ReentrantLock, Optimistic Locking mechanisms via CAS/version numbers, applicable scenarios, performance comparison, and selection guidance."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/optimistic-lock-and-pessimistic-lock.md
head:
  - - meta
    - name: keywords
      content: Optimistic Locking,Pessimistic Locking,synchronized,ReentrantLock,CAS,versioning mechanism,concurrency control,lock optimization
---

If we map Pessimistic Locking and Optimistic Locking to real life: a Pessimistic Lock is like a rather pessimistic person (or one who prepares for a rainy day) who always assumes the worst-case scenario to prevent problems from occurring; an Optimistic Lock is like a rather optimistic person who always assumes the best-case scenario and resolves issues quickly right before they occur.

## What Is Pessimistic Locking?

Pessimistic Locking always assumes the worst-case scenario, believing that problems (such as shared data being modified) will occur every time a shared resource is accessed. Therefore, every time a thread acquires the resource to perform operations, it acquires a lock first, so any other thread trying to access the resource will block until the lock is released by the previous holder. In other words, **a shared resource is given to only one thread at a time, while other threads block and wait for the resource to be handed over after that thread finishes**.

Exclusive locks in Java such as `synchronized` and `ReentrantLock` are implementations of the Pessimistic Locking philosophy.

```java
public void performSynchronisedTask() {
    synchronized (this) {
        // Operations that require synchronization
    }
}

private Lock lock = new ReentrantLock();
lock.lock();
try {
   // Operations that require synchronization
} finally {
    lock.unlock();
}
```

Under high-concurrency scenarios, intense lock contention causes threads to block, and a large number of blocked threads lead to system context switching, increasing system performance overhead. Moreover, Pessimistic Locking can also suffer from Deadlock issues (when threads acquire locks in an improper order), affecting normal code execution.

## What Is Optimistic Locking?

Optimistic Locking always assumes the best-case scenario, believing that no problems will occur when a shared resource is accessed. Threads can continue executing without locking or waiting, and only verify when committing modifications whether the corresponding resource (i.e., the data) has been modified by other threads (specifically via a versioning mechanism or the CAS algorithm).

In Java, the atomic variable classes under the `java.util.concurrent.atomic` package (such as `AtomicInteger` and `LongAdder`) are implemented using **CAS**, one of the implementation approaches of Optimistic Locking.
![Overview of JUC Atomic Classes](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/JUC-20230814005211968-8956b754.png)

```java
// LongAdder performs better than AtomicInteger and AtomicLong under high concurrency
// The trade-off is higher memory consumption (trading space for time)
LongAdder sum = new LongAdder();
sum.increment();
```

In high-concurrency scenarios, compared with Pessimistic Locking, Optimistic Locking has no thread blocking caused by lock contention and no Deadlock issues, so it often outperforms Pessimistic Locking. However, if conflicts occur frequently (when the write ratio is very high), operations will fail and retry repeatedly, which also severely degrades performance and causes CPU usage to spike.

`LongAdder` distributes updates across multiple internal cells when contention is intense, reducing the probability of all threads contending for the same value; however, internal updates may still use CAS and retries, so contention is not completely eliminated. Furthermore, the value returned by `sum()` is not an atomically consistent snapshot with respect to concurrent updates.

Theoretically speaking:

- Pessimistic Locking is typically used more in write-heavy scenarios (many writes, intense contention) to avoid performance degradation caused by frequent failures and retries. However, approaches like `LongAdder` that reduce retry probability by dispersing contention can also be considered when only specific semantics such as accumulation are needed, though they still need to be evaluated based on the actual scenario.
- Optimistic Locking is typically used more in read-heavy scenarios (many reads, low contention) to avoid the performance impact of frequent locking. However, Optimistic Locking primarily targets a single shared variable (refer to the atomic variable classes under the `java.util.concurrent.atomic` package).

## How to Implement Optimistic Locking?

Optimistic Locking is generally implemented using a versioning mechanism or the CAS algorithm, with the CAS algorithm being more common—special attention should be paid here.

### Versioning Mechanism

Typically, a data version field `version` is added to the database table to represent the number of times the data has been modified. Whenever the data is modified, the `version` value is incremented by one. When Thread A wants to update a data value, it reads the `version` value along with the data. When submitting the update, it updates the data only if the `version` value read earlier equals the current `version` value in the database; otherwise, it retries the update operation until the update succeeds.

**Let's look at a simple example**: Suppose an account information table in the database has a `version` field whose current value is 1, and the current account balance field (`balance`) is \$100.

1. Operator A reads it at this moment (`version`=1) and deducts \$50 from the account balance (\$100-\$50).
2. While Operator A is performing the operation, Operator B also reads this user record (`version`=1) and deducts \$20 from its account balance (\$100-\$20).
3. Operator A finishes the modification and submits the data version (`version`=1) together with the post-deduction balance (`balance`=\$50) to the database for update. At this point, because the submitted data version equals the current version of the database record, the data is updated, and the database record's `version` is updated to 2.
4. Operator B finishes its operation and also tries to submit the data (`balance`=\$80) with version (`version`=1) to the database. However, when comparing against the database record version, it finds that the data version submitted by Operator B is 1 while the current version of the database record is 2. This does not satisfy the Optimistic Locking policy that "the submitted version must equal the current version to perform the update," so Operator B's submission is rejected.

This prevents Operator B from overwriting the result of Operator A's operation with a modification based on stale data where `version`=1.

### CAS Algorithm

CAS stands for **Compare And Swap**. It is used to implement Optimistic Locking and is widely applied across major frameworks. The idea behind CAS is very simple: compare an expected value with the variable value to be updated, and update it only if the two values are equal.

CAS is an atomic operation that relies at the bottom level on a single atomic CPU instruction.

> An **atomic operation** is the smallest indivisible operation; that is, once the operation begins, it cannot be interrupted until it completes.

CAS involves three operands:

- **V**: The variable value to be updated (Var)
- **E**: The expected value (Expected)
- **N**: The new value to be written (New)

If and only if the value of V equals E, CAS atomically updates the value of V to the new value N. If they are not equal, it means another thread has already updated V, so the current thread aborts the update.

**Let's look at a simple example**: Thread A wants to modify the value of variable `i` to 6, and the original value of `i` is 1 (V = 1, E = 1, N = 6, assuming no ABA problem exists).

1. `i` is compared with 1. If they are equal, it means `i` has not been modified by other threads and can be set to 6.
2. `i` is compared with 1. If they are not equal, it means `i` has been modified by other threads; the current thread aborts the update, and the CAS operation fails.

When multiple threads simultaneously operate on a variable using CAS, only one thread wins and successfully updates it, while the rest fail. However, the failing threads are not suspended; they are simply notified of the failure and allowed to try again—or of course, allowed to give up the operation.

For further introduction to CAS, you can read the author's article: [Detailed Explanation of CAS](./cas.md), which covers in detail how CAS is implemented in Java as well as some of the issues that exist with CAS.

## Summary

This article introduced the concepts of Optimistic Locking and Pessimistic Locking as well as common implementation approaches for Optimistic Locking in detail:

- Pessimistic Locking is based on a pessimistic assumption that shared resources will encounter conflicts every time they are accessed, so it acquires a lock on every operation. This locking mechanism causes other threads to block until the lock is released. `synchronized` and `ReentrantLock` in Java are typical implementations of Pessimistic Locking. Although Pessimistic Locking effectively avoids data races, under high-concurrency scenarios it causes thread blocking and frequent context switches, thereby impacting system performance, and may also trigger Deadlock issues.
- Optimistic Locking is based on an optimistic assumption that shared resources will not encounter conflicts every time they are accessed, so no locking is required; it only verifies when committing modifications whether the data has been modified by other threads. Classes such as `AtomicInteger` and `LongAdder` in Java implement Optimistic Locking via the CAS (Compare-And-Swap) algorithm. Optimistic Locking avoids thread blocking and Deadlock issues and offers superior performance in read-heavy, write-light scenarios. However, when write operations are frequent, it can cause heavy retries and failures, degrading performance.
- Optimistic Locking is primarily implemented via a versioning mechanism or the CAS algorithm. The versioning mechanism ensures data consistency by comparing version numbers, whereas CAS implements atomic operations through hardware instructions, directly comparing and swapping variable values.

Pessimistic Locking and Optimistic Locking each have pros and cons and are suitable for different application scenarios. In real-world development, choosing the right locking mechanism can effectively improve a system's concurrency performance and stability.

## References

- *78 Core Lectures on Java Concurrent Programming*
- Easy-to-Understand Guide to Pessimistic Lock, Optimistic Lock, Reentrant Lock, Spin Lock, Biased Lock, Lightweight/Heavyweight Lock, Read-Write Lock, and Their Java Implementations: <https://zhuanlan.zhihu.com/p/71156910>
