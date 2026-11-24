---
title: "Java Locks Explained: Mutex Locks, Read-Write Locks, Spin Locks, and synchronized Lock Optimizations"
description: "A systematic overview of Java locking mechanisms: from mutex locks, read-write locks, and spin locks to synchronized, ReentrantLock, AQS, and StampedLock—clarifying lock classifications, implementation principles, JDK version differences, and selection guidelines."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/java-lock.md
head:
  - - meta
    - name: keywords
      content: Java locks,mutex lock,read-write lock,spin lock,synchronized,ReentrantLock,AQS,StampedLock,CAS,lock escalation,lock optimization,Java concurrency
---

When learning Java concurrency, lock-related terminology can easily get confusing: mutex locks, read-write locks, spin locks, pessimistic locks, optimistic locks, CAS, AQS, `synchronized`, `ReentrantLock`, `StampedLock`, biased locks, lightweight locks, and heavyweight locks.

These terms do not all belong to the same classification dimension.

Some describe "who can enter the critical section," such as mutex locks and read-write locks; some describe "how to wait when a lock is unavailable," such as spin locks and blocking locks; some describe "whether to lock shared data before modifying it or verify upon commit," such as pessimistic locking and optimistic locking; and others describe how HotSpot optimizes `synchronized` under different contention levels.

This article first establishes a coordinate system for locks, and then examines how common locking tools in Java are implemented in practice. Details on pessimistic locking, optimistic locking, and CAS are already covered in two dedicated articles on this site: [Detailed Explanation of Optimistic Locking and Pessimistic Locking](./optimistic-lock-and-pessimistic-lock.md) and [Detailed Explanation of CAS](./cas.md). Here we only keep the necessary context, focusing on how the lock system fits together.

PS: This article is primarily written from the perspective of HotSpot / OpenJDK. The monitor mutual exclusion and memory semantics of `synchronized` belong to the Java/JVM specification level; concepts like object headers, Mark Word, lightweight locks, and lock inflation belong to HotSpot implementation optimizations, and the Java Language Specification does not guarantee a fixed progression. Biased locking has been disabled by default with its flags deprecated since JDK 15, and those flags were obsoleted in JDK 18; conclusions regarding Virtual Threads and `synchronized` pinning also differ between JDK 21–23 and JDK 24+.

Let's start with a table to separate the classification dimensions:

| Dimension | Typical Names | Question Answered |
| --- | --- | --- |
| Critical Section Mutual Exclusion | Mutex Lock, Read-Write Lock | Who can enter the critical section |
| Waiting Strategy | Spin Lock, Blocking Lock | How to wait when failing to acquire a lock |
| Concurrency Control Approach | Pessimistic Locking, Optimistic Locking | Lock first before modifying, or validate upon commit |
| Atomic Update Mechanism | CAS, Atomic classes | How to update a single variable without blocking |
| JVM Implementation Optimization | Lightweight Lock, Heavyweight Lock, Lock Inflation | How HotSpot reduces `synchronized` overhead |
| Java Locking Tools | `synchronized`, `ReentrantLock`, `StampedLock` | What to actually use in code |

## What Does a Lock Actually Protect?

What locks solve is the critical section problem. A critical section refers to a piece of code that accesses shared mutable state and must not allow multiple execution units to interleave arbitrarily.

![Diagram of critical section protection access protocol: multiple threads access shared state through a unified locking entry point; bypassing the lock or switching lock objects breaks mutual exclusion](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-critical-section-67226b1b.png)

Take this increment as an example:

```java
count++;
```

It is only one line in source code, yet this line cannot be treated as an indivisible action. A thread usually needs to read `count`, add 1, and finally write it back. When two threads execute concurrently, both may read the old value `0`, each compute `1`, and finally both write `1` back. Both threads executed the increment, yet the result only increased once.

The lock approach is straightforward: acquire the lock before entering this code, and release it after execution completes. As long as all code accessing the same shared state abides by the same lock convention, reads and writes that could otherwise interleave can be serialized into mutually exclusive execution.

There is an easily overlooked point here: **what a lock truly protects is the protocol for accessing an object's state; an object does not automatically become safe simply because a lock is placed on it**.

`synchronized (account)` will not magically make all fields of `account` safe. If another piece of code bypasses this lock and directly modifies `account.balance`, thread safety is still broken. MIT 6.005's lecture on locks repeatedly emphasizes this very point: locks should guard the representation invariant of a data abstraction; casually wrapping an arbitrary object with a lock cannot ensure the invariant always holds.

## Mutex Lock: Only One Thread Can Enter at a Time

The rule of a Mutex Lock (Mutex) is simple: at any given time, at most one thread can hold the lock and enter the critical section.

In Java, both `synchronized` and `ReentrantLock` can be used as mutex locks:

```java
class Counter {
    private int count;

    public synchronized void increment() {
        count++;
    }

    public synchronized int get() {
        return count;
    }
}
```

Switching to `ReentrantLock` makes the code slightly more verbose, but gives you more control:

```java
class Counter {
    private final ReentrantLock lock = new ReentrantLock();
    private int count;

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();
        }
    }
}
```

`try/finally` must not be omitted. With `synchronized`, the JVM handles releasing the lock for you, releasing the monitor whether the code block exits normally or throws an exception; `ReentrantLock` is an explicit API, so you must pair lock acquisition and release yourself. Oracle's `ReentrantLock` documentation also recommends "entering a `try` block immediately after calling `lock`."

The truly difficult part of mutex locks is not the syntax, but lock granularity.

Wrapping all operations with one coarse-grained lock is the easiest to manage, but yields low concurrency; using multiple fine-grained locks to protect different data separately can improve throughput, yet lock ordering, deadlocks, and state consistency become harder to manage. OSTEP also mentions this trade-off when discussing POSIX mutexes: using different locks for different data can increase concurrency, but programmers must be clear about which exact piece of state each lock protects.

## Read-Write Lock: Shared Reads, Exclusive Writes

A mutex lock is strict even for read operations: as long as one thread is reading, another thread cannot enter to read either. However, many business objects share a characteristic: reads do not mutate state, so multiple reader threads executing concurrently will not corrupt each other.

Read-write locks are designed for this scenario.

They split access into two categories:

- Read Lock: A shared lock; multiple threads can hold it simultaneously.
- Write Lock: An exclusive lock; only one thread can hold it at a time, and write locks are mutually exclusive with read locks.

The corresponding rules are easy to remember:

- Read-Read: Not mutually exclusive.
- Read-Write: Mutually exclusive.
- Write-Write: Mutually exclusive.

The typical implementation in Java is `ReentrantReadWriteLock`:

```java
class ProfileCache {
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private final Map<Long, String> cache = new HashMap<>();

    public String get(long userId) {
        readLock.lock();
        try {
            return cache.get(userId);
        } finally {
            readLock.unlock();
        }
    }

    public void put(long userId, String profile) {
        writeLock.lock();
        try {
            cache.put(userId, profile);
        } finally {
            writeLock.unlock();
        }
    }
}
```

A read-write lock is suited for read-heavy, write-light scenarios where read operations are short enough and the data structure is not easily broken apart. It is not suitable for every cache, nor is it guaranteed to be faster than a mutex lock. If writes are frequent, reader and writer threads will constantly block one another, and the maintenance overhead of the read-write lock may outweigh its gains.

Java also provides `StampedLock`, which supports write locks, pessimistic read locks, and optimistic reads. An optimistic read does not actually acquire a traditional read lock; it first obtains a stamp, and after reading, validates whether any write occurred in the meantime:

```java
class Point {
    private final StampedLock lock = new StampedLock();
    private double x;
    private double y;

    double distanceFromOrigin() {
        long stamp = lock.tryOptimisticRead();
        double currentX = x;
        double currentY = y;
        if (!lock.validate(stamp)) {
            stamp = lock.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                lock.unlockRead(stamp);
            }
        }
        return Math.hypot(currentX, currentY);
    }
}
```

`StampedLock`'s optimistic read has boundaries: the data read may be briefly inconsistent, so it is only suitable for short reads that can be completed into local variables and can fall back to re-reading if `validate` fails. It is also difficult to drop in directly as a replacement for `ReentrantReadWriteLock`—in particular, note that it is not reentrant.

## Spin Lock: Wait in Place Briefly Without Blocking

When a thread fails to acquire a lock, there are usually two ways to wait:

- Blocking: Suspend the current thread and let the operating system wake it up later.
- Spinning: Do not suspend the thread; loop on the CPU to check whether the lock is available.

Spin locks are suited for scenarios where the critical section is very short. For instance, if the lock-holding thread is about to release the lock immediately, directly blocking the waiting thread incurs thread suspension and wake-up costs that can exceed "spinning in place for a few iterations."

That is also where the problem lies: spinning incurs CPU cost because it continuously occupies the CPU. If the lock is held for a long time, or if many threads are waiting, spinning wastes CPU cycles on busy-waiting.

In Java code, you can write a minimal spin lock example using CAS:

```java
class SpinLock {
    private final AtomicReference<Thread> owner = new AtomicReference<>();

    public void lock() {
        Thread current = Thread.currentThread();
        while (!owner.compareAndSet(null, current)) {
            Thread.onSpinWait();
        }
    }

    public void unlock() {
        Thread current = Thread.currentThread();
        if (!owner.compareAndSet(current, null)) {
            throw new IllegalMonitorStateException();
        }
    }
}
```

This snippet is only meant to illustrate the relationship between "spinning + CAS"; it is not recommended for direct use as a production business lock. A real-world lock must account for reentrancy, fairness, interruption, timeouts, exception-safe release, monitoring metrics, wait queues, and more. The JDK already encapsulates all this complexity in `synchronized`, `ReentrantLock`, AQS synchronizers, and Atomic classes.

## Where Pessimistic Locking, Optimistic Locking, and CAS Fit In

Pessimistic locking and optimistic locking describe two concurrency control philosophies rather than specific Java classes.

Pessimistic locking assumes conflicts are likely to occur, so it locks the resource first before operating on it. `synchronized`, `ReentrantLock`, and database `SELECT ... FOR UPDATE` are common examples.

Optimistic locking assumes conflicts are infrequent, so it does not block others upfront and checks whether the data was modified when committing changes. A `version` column in a database and CAS in Java's Atomic classes both fall under this approach.

CAS (Compare-And-Swap) can be understood as a hardware-supported atomic update mechanism: it updates the value in memory to a new value only if the current value still equals the expected old value. Otherwise, another thread modified it first, and the current thread can choose to retry, abort, or fall back to alternative logic.

There are three common issues with CAS:

- Failed retries consume CPU; the heavier the contention, the more pronounced this becomes.
- It naturally handles only a single variable; maintaining consistency across multiple variables requires additional design.
- The ABA problem: a value changes from A to B and back to A; looking only at the value makes it appear unchanged.

ABA can be solved using version numbers, timestamps, or marked references. Java provides tools such as `AtomicStampedReference` and `AtomicMarkableReference`, though in business code a more common practice is for the data model itself to carry a version field.

Expanding further here would overlap with existing articles. To see implementation approaches, version-number examples, ABA handling, and Atomic class source code, read on:

- [Detailed Explanation of Optimistic Locking and Pessimistic Locking](./optimistic-lock-and-pessimistic-lock.md)
- [Detailed Explanation of CAS](./cas.md)
- [Summary of Atomic Classes](./atomic-classes.md)

## Under the Hood of synchronized: Monitor, Bytecode, and Memory Semantics

`synchronized` is Java's built-in synchronization mechanism. It can modify instance methods, static methods, or wrap code blocks.

```java
class Account {
    private long balance;

    public synchronized void deposit(long amount) {
        balance += amount;
    }

    public long balance() {
        synchronized (this) {
            return balance;
        }
    }
}
```

Synchronized methods and synchronized blocks look somewhat different at the bytecode level:

- Synchronized methods rely on the method access flag `ACC_SYNCHRONIZED`.
- Synchronized blocks generate `monitorenter` and `monitorexit` instructions.

Regardless of syntactic form, the semantics are entering a monitor and exiting a monitor. The Java Language Specification also defines a happens-before relationship between releasing a lock and a subsequent acquisition of that lock: writes made by one thread before releasing a lock are visible to another thread that subsequently acquires the same lock.

This is also where `synchronized` differs from a conceptual lock that only provides mutual exclusion. It provides both mutual exclusion and memory visibility. If you only guard a critical section without establishing visibility, another thread might still read stale values.

Furthermore, `synchronized` is reentrant. When a thread already holds an object's monitor, it can re-enter code protected by the same lock; the JVM tracks the reentrancy count and decrements it layer by layer upon exit.

```java
class ReentrantDemo {
    public synchronized void outer() {
        inner();
    }

    public synchronized void inner() {
        // The same thread can re-enter the monitor of this
    }
}
```

## synchronized Lock Optimization: Don't Memorize "Lock Escalation" as a Fixed Formula

Many resources explain `synchronized` as "unlocked -> biased lock -> lightweight lock -> heavyweight lock." This progression helps understand early HotSpot optimizations, but it cannot be separated from the JDK version.

Since JDK 6, HotSpot has introduced substantial optimizations for `synchronized`. Biased locking targeted scenarios where "the same thread always enters the same lock"; lightweight locking targets scenarios where "contention is low and multiple threads take turns entering"; heavyweight locking uses an `ObjectMonitor`, where contending threads may block and be woken up.

Version differences should be remembered separately:

- JDK 6 to JDK 14: Biased locking was one of HotSpot's standard optimizations.
- JDK 15: JEP 374 disabled biased locking by default and deprecated the related flags.
- JDK 18: Biased locking flags were obsoleted; passing them causes them to be ignored with a warning.
- JDK 21 to JDK 23: Virtual threads blocking inside `synchronized` could pin their underlying platform thread.
- JDK 24: JEP 491 improved Virtual Thread interoperability with `synchronized`, allowing a Virtual Thread blocked on `synchronized` to unmount from its underlying platform thread and reducing pinning issues.

Therefore, in interviews or articles, you can state that "HotSpot historically reduced `synchronized` overhead via biased locks, lightweight locks, and heavyweight locks," rather than claiming biased locking is still the default path in modern JDKs.

Another more important engineering conclusion is that the old advice "avoid `synchronized` whenever possible" no longer fits modern Java. For ordinary mutual exclusion, its syntax is concise, exception-safe release is guaranteed, and JIT optimizations are mature. Only when you need fair locking, interruptible acquisition, timed acquisition, or multiple condition queues is it more natural to turn to `ReentrantLock`.

## How ReentrantLock, Condition, and AQS Connect

`ReentrantLock` provides finer-grained control than `synchronized`:

- You can choose between a Fair Lock and a Non-fair Lock.
- You can use `lockInterruptibly()` to respond to thread interruption.
- You can use `tryLock()` or `tryLock(timeout, unit)` to avoid indefinite waiting.
- You can create multiple `Condition` instances to manage different wait conditions separately.

A typical pattern looks like this:

```java
class BoundedBuffer<E> {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    private final Queue<E> queue = new ArrayDeque<>();
    private final int capacity;

    BoundedBuffer(int capacity) {
        this.capacity = capacity;
    }

    public void put(E item) throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (queue.size() == capacity) {
                notFull.await();
            }
            queue.add(item);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public E take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            E item = queue.remove();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}
```

The `while` loop here must not be carelessly replaced with `if`. When a thread wakes up, it only means "it has an opportunity to re-contend for the lock and check the condition"—not that the condition necessarily holds. Spurious wakeups, competition among multiple waiting threads, or another thread consuming the condition first all require re-checking upon waking up.

Under the hood, `ReentrantLock` relies on AQS (`AbstractQueuedSynchronizer`). AQS can be roughly understood as a synchronizer framework: it uses a `state` variable to represent synchronization state, a FIFO queue to manage threads that failed to acquire the resource, and combines CAS with `LockSupport.park/unpark` to handle queueing, blocking, and unparking.

Many concurrency utilities are built on top of AQS, such as `ReentrantLock`, `Semaphore`, `CountDownLatch`, and `ReentrantReadWriteLock`. If you want to unpack the queue, `state`, CAS, and blocking/unparking chain further, you can continue with [Detailed Explanation of AQS](./aqs.md) and [Understanding AQS Principles and Applications from the Implementation of ReentrantLock](./reentrantlock.md).

## How to Choose a Lock in Java?

When choosing a lock, do not rush into comparing "which one is fastest." A lock's behavior depends on critical section length, contention intensity, thread count, and how failures are handled. Ask a few questions first: Which shared state does this code protect? Roughly how long is the lock held? Can the caller wait if the lock is unavailable? After a failed wait, should it return, retry, or fail fast with an error?

If you are only protecting a small piece of state within a single JVM process—such as updating a few fields, maintaining an in-memory `Map`, or toggling object state—`synchronized` is often enough. It is concise, automatically releases the lock upon exiting the block, and eliminates the risk of forgetting a manual `unlock()`. When code requires timed acquisition, interruptible acquisition, fair locking, or multiple `Condition` objects to manage separate wait queues, switching to `ReentrantLock` becomes much more natural.

For read-heavy, write-light workloads, look at `ReentrantReadWriteLock`. The key here is "write-light"; simply having read methods is not enough. If writes are frequent, read and write locks will continually block one another, and maintaining read-write state also carries overhead, which may end up no better than a plain mutex lock. `StampedLock`'s optimistic read is even more selective: the read logic must be short, reading an intermediate state must not cause severe issues, and callers must accept re-reading upon validation failure.

If you are only updating a counter, status flag, or reference, look first at Atomic classes, `LongAdder`, and `LongAccumulator`. They are suited for very short atomic updates, not for stuffing an entire business workflow into a CAS retry loop. The longer the workflow, the easier it is for failed retries to burn CPU in futile loops and the harder it becomes to handle side effects.

Once the problem crosses JVM boundaries—for example, multiple application instances modifying the same database row concurrently—locks inside Java can no longer govern it. When conflicts are rare, you can use a version column for optimistic locking; when conflicts are frequent and strongly consistent modifications are required, you usually fall back to database row locks, `SELECT ... FOR UPDATE`, unique constraints, and similar database mechanisms. Going further out to cross-service mutual exclusion requires external systems such as Redis, ZooKeeper, or a database rather than relying on `synchronized` or `ReentrantLock`.

Also, do not blindly pursue "tiny" lock granularity. One coarse-grained lock makes correctness easy to preserve, though throughput may suffer; splitting into many fine-grained locks reduces contention, yet lock ordering, deadlock risks, and debugging costs all rise. In many cases, guarding invariants clearly with one lock first and splitting locks based on load-test results is far safer than designing a web of fine-grained locks upfront.

## Common Pitfalls

**Unstable lock object.**

Some code appears to acquire a lock, but actually locks on different objects. A common cause is a changing lock object—such as concatenated `String` instances, boxed primitives, or reassignable fields. Thread A enters and locks the old object while Thread B enters and locks the new object; neither interferes with the other, splitting the critical section apart.

```java
private Object lock = new Object();

public void update() {
    synchronized (lock) {
        lock = new Object(); // Subsequent threads may lock onto a different lock object
    }
}
```

If you need a dedicated lock object, normally declare it `private final` and never expose it to external code.

**Locking on externally visible objects.**

`synchronized (this)` and `synchronized (SomeClass.class)` are sometimes fine, yet they can also be locked by external code, leaving you unable to control the scope of lock contention. Library code in particular should be cautious and usually prefer a `private final` lock object.

```java
private final Object lock = new Object();
```

**Performing slow operations while holding a lock.**

Querying a database, calling an RPC, or writing large files while holding a lock prolongs lock hold time. The longer a lock is held, the more threads wait, driving up the risk of timeouts, thread pool exhaustion, and deadlocks.

**Inconsistent lock ordering.**

Two threads acquiring locks in `A -> B` and `B -> A` order respectively can easily form a deadlock. When using multiple locks concurrently, establish a globally consistent order across resources. For a full introduction to deadlocks, see [Detailed Explanation of Deadlock](../../cs-basics/operating-system/dead-lock.md).

**Confusing thread-safe classes with compound operations.**

Individual `get` and `put` calls on `ConcurrentHashMap` are thread-safe, yet "check for absence, then insert" is a compound operation that requires atomic methods such as `computeIfAbsent` or additional synchronization.

```java
// Not recommended: another thread may insert between containsKey and put
if (!map.containsKey(key)) {
    map.put(key, createValue());
}

// Recommended: delegate the compound logic to ConcurrentHashMap's atomic method
map.computeIfAbsent(key, ignored -> createValue());
```

**Looking only at locks while ignoring resource pools.**

Many production "hangs" have nothing to do with Java lock deadlocks—threads may all be waiting on database connections, HTTP connections, thread pool queues, or external service responses. Seeing `WAITING` in a thread dump only shows that threads are waiting; confirming a deadlock requires finding a stable wait cycle.

## Summary

"Lock" is a broad umbrella term covering a whole set of concurrency control tools.

Mutex locks and read-write locks answer "who can enter the critical section"; spin locks and blocking locks answer "how to wait when a lock is unavailable"; pessimistic locking and optimistic locking answer "how to handle contention before and after it occurs"; CAS and Atomic classes solve single-variable atomic updates; and `synchronized`, `ReentrantLock`, `StampedLock`, and AQS are how Java brings these ideas into code.

When actually writing code, first identify the shared state and invariants, then decide what the lock protects, how coarse or fine the lock granularity should be, whether waiting can be interrupted, and whether failures can be retried. Tools are merely the means; what truly must be upheld is a unified synchronization protocol that every code path accessing shared state strictly obeys.

## References

- [The Java Language Specification, Chapter 17. Threads and Locks](https://docs.oracle.com/javase/specs/jls/se24/html/jls-17.html)
- [The Java Virtual Machine Specification, monitorenter](https://docs.oracle.com/javase/specs/jvms/se24/html/jvms-6.html#jvms-6.5.monitorenter)
- [Oracle Java API: Lock](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/Lock.html)
- [Oracle Java API: ReentrantLock](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/ReentrantLock.html)
- [Oracle Java API: StampedLock](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/StampedLock.html)
- [OpenJDK JEP 374: Deprecate and Disable Biased Locking](https://openjdk.org/jeps/374)
- [OpenJDK JEP 491: Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491)
- [OSTEP (Chinese Edition): Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/Chinese/28.pdf)
- [MIT 6.005: Locks and Synchronization](http://web.mit.edu/6.005/www/fa15/classes/23-locks/)
