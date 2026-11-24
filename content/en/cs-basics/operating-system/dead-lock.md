---
title: "Deadlock Deep Dive: Four Necessary Conditions, Java Deadlock Troubleshooting, and Database Deadlock Handling"
description: "High-frequency interview questions summary on deadlock, starting from definitions and the four Coffman conditions, combined with Java synchronized, ReentrantLock, ThreadMXBean, jstack, jcmd, JConsole, and practical PostgreSQL/MySQL database deadlock diagnosis and transaction retry strategies."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Java Concurrency
  - Database
head:
  - - meta
    - name: keywords
      content: Deadlock,Four Necessary Conditions of Deadlock,Java Deadlock,Thread Deadlock,synchronized,ReentrantLock,ThreadMXBean,jstack,jcmd,JConsole,Database Deadlock,MySQL Deadlock,PostgreSQL Deadlock,OS Interview Questions,Java Concurrency Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/dead-lock.md
---

Thread A has acquired Resource 1, and Thread B has acquired Resource 2. Next, Thread A needs Resource 2 to proceed, while Thread B needs Resource 1 to proceed.

Neither thread throws an exception, nor is the CPU pinned at 100%. In production, the observable symptoms might simply be a few incoming requests failing to respond, with worker threads in a thread pool gradually becoming occupied and frozen.

This is precisely what makes such issues tricky: the application hasn't executed invalid arithmetic or thrown an error; it is simply stuck in a mutual dependency wait cycle that it cannot resolve on its own.

**Thread deadlock** describes this exact scenario: a set of threads are each waiting for resources held by other threads in the set. Because the wait relationships form a closed circular chain, none of the involved threads can make forward progress on their own.

If these threads happen to process critical business workflows like ordering, payments, or inventory reservations, the external symptoms go beyond individual threads in a `BLOCKED` state—they manifest as API timeouts, cascading request queue backlogs, and even applications that refuse to shut down cleanly.

![Deadlock scenario: Thread A holds resource1 and waits for resource2; Thread B holds resource2 and waits for resource1, forming a closed wait cycle](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-scenario-13be7e13.png)

Expanding our perspective, deadlock is not unique to Java threads. Operating system processes, database transactions, and distributed workflows can all become trapped in this exact same topology whenever they hold resources while waiting for others. Here, "resources" are not limited to classic textbook examples like printers and magnetic tape drives; they can be Java object monitors, `ReentrantLock` instances, database row-level locks, distributed locks, database connections in a connection pool, worker threads in a thread pool, or even IPC pipe buffers.

We use Java code examples below because they are the easiest to reproduce reliably. Keep in mind, however, that deadlock is a universal concurrency problem. Whenever a system simultaneously exhibits exclusive resources, hold-and-wait conditions, non-preemptible allocation, and circular waiting, threads, processes, and transactions will inevitably deadlock.

If you want to first clarify the boundaries and responsibilities across synchronization primitives like mutex, semaphore, condition variable, and futex, see: [Operating System Locks and Synchronization Mechanisms: Mutex, Semaphore, Condition Variable, Spinlock, and Futex](./os-lock-and-sync.md). This deadlock article focuses specifically on how wait cycles form and how to diagnose and recover from them in production.

This article is structured around the practical diagnostic workflow: first, how wait cycles form; second, the four necessary Coffman conditions; third, Java reproduction code; fourth, resource allocation graphs; fifth, remediation strategies; and finally, production thread dump analysis and database lock diagnostics.

## How Does a Deadlock Form?

Consider the most classic scenario in concurrent programming, involving two threads and two resources:

- Thread A acquires Resource 1 first, then attempts to acquire Resource 2.
- Thread B acquires Resource 2 first, then attempts to acquire Resource 1.

If the two threads interleave execution at runtime, the system enters the following state:

- Thread A holds Resource 1, waiting for Resource 2.
- Thread B holds Resource 2, waiting for Resource 1.

For Thread A to proceed, it must wait for Thread B to release Resource 2; for Thread B to proceed, it must wait for Thread A to release Resource 1. Both are waiting on the other to make a move, but neither can execute to the point where it releases its held resource.

Deadlock is fundamentally different from a simple "long wait." With ordinary blocking, the thread will eventually make progress: another thread releases a lock, a database transaction commits, or network I/O completes. In a deadlock, there is a closed cycle where every participant is waiting on another participant in the cycle.

Another common diagnostic pitfall: **Deadlocks do not necessarily cause high CPU usage.** In fact, threads stuck in a deadlock are often idling quietly in `BLOCKED` or `WAITING` states, causing CPU utilization to drop. When API requests time out, thread pools fill up, or database connections are exhausted, CPU usage is merely one data point, not the sole diagnostic indicator.

## The Four Necessary Conditions for Deadlock

Operating system literature defines the classic Coffman conditions. For a deadlock to occur, the following 4 conditions must hold simultaneously:

| Condition | Meaning | Mapping to Java or Databases |
| --- | --- | --- |
| Mutual Exclusion | A resource can only be held by one execution unit at a time | `synchronized` object monitor, row-level exclusive lock (`FOR UPDATE`), exclusive file lock |
| Hold and Wait | A thread holds at least one resource while waiting to acquire additional resources | Thread holds `resource1` while requesting `resource2` |
| No Preemption | Resources cannot be forcibly revoked from a holder; they can only be released voluntarily | A Java intrinsic lock cannot be ripped away from a thread by an external entity |
| Circular Wait | A closed chain of threads exists such that each thread waits for a resource held by the next | Thread 1 waits for Thread 2, and Thread 2 waits for Thread 1 |

![Four necessary conditions for deadlock: Mutual exclusion, hold-and-wait, no-preemption, and circular wait must all hold simultaneously to produce a deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-four-conditions-79f8adec.png)

Do not treat this table as a checklist where "meeting any one condition causes deadlock." Rather, it states that all four must be satisfied simultaneously for a deadlock to exist; breaking even a single condition prevents the wait cycle from closing.

When writing business code, the most practical conditions to target are Condition 2 (Hold and Wait) and Condition 4 (Circular Wait).

Mutual exclusion is rarely negotiable: inventory rows, account balances, and shared memory structures cannot permit concurrent, unsynchronized writes. Non-preemption is equally difficult to break arbitrarily: a lock usually protects an in-flight, multi-step state change; forcibly stealing the lock would leave shared state corrupt and half-baked. In contrast, acquiring all required resources atomically, or enforcing a strict global lock acquisition order across all call sites, translates smoothly into enforceable engineering conventions.

## Reproducing a Deadlock in Java

The following code translates the scenario above into Java. Two `Object` instances act as Resource 1 and Resource 2, and two threads enter nested `synchronized` blocks in opposite orders.

`Thread.sleep(1000)` is not the cause of the deadlock; it merely widens the execution window to guarantee that the threads interleave, making the deadlock reliably reproducible.

```java
public class DeadLockDemo {
    private static final Object resource1 = new Object();
    private static final Object resource2 = new Object();

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "Thread 1").start();

        new Thread(() -> {
            synchronized (resource2) {
                System.out.println(Thread.currentThread() + "get resource2");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println(Thread.currentThread() + "waiting get resource1");
                synchronized (resource1) {
                    System.out.println(Thread.currentThread() + "get resource1");
                }
            }
        }, "Thread 2").start();
    }
}
```

A typical console output:

```text
Thread[Thread 1,5,main]get resource1
Thread[Thread 2,5,main]get resource2
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 2,5,main]waiting get resource1
```

The program halts indefinitely. `sleep()` finishes, but execution blocks permanently at the second `synchronized` block: Thread 1 cannot acquire `resource2`, and Thread 2 cannot acquire `resource1`.

Mapping this back to the four Coffman conditions:
- **Mutual Exclusion**: `resource1` and `resource2` can only be locked by one thread at a time.
- **Hold and Wait**: Thread 1 holds `resource1` while waiting for `resource2`; Thread 2 holds `resource2` while waiting for `resource1`.
- **No Preemption**: Java will not forcibly confiscate `resource1` from Thread 1.
- **Circular Wait**: Thread 1 waits for Thread 2, and Thread 2 waits for Thread 1.

All four conditions are met; whether the deadlock triggers depends purely on thread scheduling timing. Because timing determines manifestation, some deadlocks do not happen on every run—under load testing, a deadlock may occur once or twice out of ten runs.

### How to Fix This Code to Eliminate Deadlock?

The most direct fix is to enforce a consistent lock acquisition order. If all threads acquire `resource1` before `resource2`, a circular wait condition cannot form:

```java
public class OrderedLockDemo {
    private static final Object resource1 = new Object();
    private static final Object resource2 = new Object();

    public static void main(String[] args) {
        Runnable task = () -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");

                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        };

        new Thread(task, "Thread 1").start();
        new Thread(task, "Thread 2").start();
    }
}
```

This fix breaks the **Circular Wait** condition. As long as every code path adheres strictly to the same acquisition order, a circular dependency cannot arise.

The challenge in production systems lies in ensuring *every* code path follows the order. In a toy example with two locks, the order is obvious. In enterprise systems, locks are scattered across order, inventory, and payment modules. Service A might acquire the Order lock followed by the Inventory lock; Service B might acquire the Inventory lock followed by the Order lock. Inspected in isolation, each method looks reasonable; only when combined at runtime does deadlock emerge.

In production development, adopt this concurrent code review checklist:

- **Enforce a stable ordering for resources.** Sort by immutable business keys such as database primary keys, account numbers, or order IDs. Avoid sorting by `System.identityHashCode()`, which does not guarantee business consistency.
- **Keep critical sections minimal.** Move slow operations like RPCs, heavy SQL queries, and file I/O outside of locks. Slow calls stretch critical sections and increase contention windows.
- **Back off if you cannot acquire all resources.** If you acquire Resource A but cannot acquire Resource B, releasing Resource A and retrying later is far safer than holding Resource A while waiting indefinitely for Resource B.
- **Apply timeouts when business logic permits failure.** Use `tryLock(timeout, unit)` to bound waiting time and prevent threads from hanging forever.
- **Coarsen locks when appropriate.** If two locks are always acquired together, consider consolidating them into a single coarser lock. While this slightly reduces concurrency, it provides easily provable correctness.

This final guideline may seem counter-intuitive, but it is effective in engineering. Finer-grained locking is not inherently superior; when multiple pieces of state are inextricably linked, splitting locks merely invites deadlocks.

## Resource Allocation Graphs and Wait-For Graphs

Operating system literature utilizes Resource Allocation Graphs (RAG) to model deadlock. A RAG contains two types of nodes:
- Process or thread nodes.
- Resource nodes.

And two types of directed edges:
- **Request edge**: From thread to resource, indicating the thread is waiting for that resource.
- **Assignment edge**: From resource to thread, indicating the resource has been allocated to that thread.

A fundamental theorem: **If the resource allocation graph contains no cycles, no deadlock exists.**

If the graph contains a cycle, the outcome depends on the number of instances per resource:
- **Single-unit resources** (1 instance per resource type): A cycle is a **necessary and sufficient** condition for deadlock—a cycle means deadlock exists.
- **Multi-unit resources** (multiple instances per resource type): A cycle indicates only that deadlock is *possible*; you must determine whether some thread can still complete and release its resources to resolve the cycle.

Consider database row locks as an example. Transaction T1 locks order `id=1` and requests `id=2`; Transaction T2 locks `id=2` and requests `id=1`. Abstracting away the resource nodes leaves purely the wait relationships between transactions:

```text
T1 -> T2
T2 -> T1
```

A directed graph containing only "who is waiting for whom" is called a **Wait-For Graph (WFG)**, which is a reduced projection of a Resource Allocation Graph. Java thread deadlock detection, database deadlock engines, and the Linux kernel's `lockdep` validator all rely on graph cycle detection. Their timing differs: databases check for wait cycles dynamically when a transaction blocks; `lockdep` tracks lock acquisition order combinations statically and dynamically to identify latent deadlock hazards before they happen.

![Resource Allocation Graph and Wait-For Graph: The Resource Allocation Graph contains thread and resource nodes; the Wait-For Graph retains only wait dependencies between threads](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-resource-allocation-graph-d834fca8.png)

## Prevention, Avoidance, Detection, and Recovery

When discussing deadlock handling, literature identifies four strategies: Prevention, Avoidance, Detection, and Recovery. Although their names sound similar, they intervene at distinct lifecycle stages.

In business applications, **Prevention** (such as enforcing lock ordering or minimizing lock hold times) is the most common approach. Databases rely predominantly on **Detection and Recovery** because database transactions have transactional boundaries that support rollbacks. Dijkstra's Banker's Algorithm represents **Avoidance**; while excellent for academic understanding of safe states, it is rarely implemented in general-purpose backend services.

| Strategy | Mechanism | Cost / Trade-off | Engineering Prevalence |
| --- | --- | --- | --- |
| Prevention | Invalidate at least one of the four necessary conditions structurally | May reduce concurrency or impose strict coding constraints | Very common |
| Avoidance | Evaluate whether each resource allocation steers the system into an unsafe state | Requires knowing maximum resource demands in advance; high runtime check overhead | Common in textbooks; rare in general software |
| Detection | Allow deadlocks to occur; inspect the system periodically or on-demand for wait cycles | Graph traversal overhead during detection | Common in databases, JVM tooling, and kernel debugging |
| Recovery | Terminate, roll back, or preempt resources once a deadlock is detected | Discards work completed prior to rollback | Natural and standard in database transactions |

![Deadlock handling strategies: Position and engineering prevalence of prevention, avoidance, detection, and recovery](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-strategies-b7623bee.png)

### Deadlock Prevention

Prevention works by ensuring the four Coffman conditions can never hold simultaneously:

1. **Break Mutual Exclusion**: Make resources shareable. Read-only data, immutable objects, lock-free structures, and append-only logging reduce mutual exclusion requirements. However, this is often impossible: inventory deductions, file write offsets, and account balances inherently prohibit concurrent, uncoordinated writes.
2. **Break Hold and Wait**: Require execution units to acquire all required resources atomically upfront, or hold nothing. This eliminates holding Resource A while waiting for Resource B. The cost: resource utilization drops, and callers must know their full resource set in advance.
3. **Break No Preemption**: If an execution unit cannot acquire an additional resource, it must proactively release all currently held resources and retry later. Java intrinsic locks (`synchronized`) do not support timeouts or external preemption, but the `Lock` interface's `tryLock()` allows developers to implement backoff logic directly:

```java
boolean gotA = false;
boolean gotB = false;

try {
    gotA = lockA.tryLock(100, TimeUnit.MILLISECONDS);
    if (!gotA) {
        return;
    }

    gotB = lockB.tryLock(100, TimeUnit.MILLISECONDS);
    if (!gotB) {
        return;
    }

    // Process shared state only after acquiring both locks
    updateSharedState();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    // Do not swallow interrupt signals; return or throw depending on business requirements
} finally {
    if (gotB) {
        lockB.unlock();
    }
    if (gotA) {
        lockA.unlock();
    }
}
```

The benefit of this pattern is that threads never block indefinitely. However, understand the trade-off: it transforms blocking waits into failure returns. How to retry, how many times to retry, and whether the operation has an idempotency key must be handled at the application layer. Otherwise, you eliminate deadlocks only to introduce livelocks or high failure rates.

4. **Break Circular Wait**: Impose a global linear ordering on all resources, requiring all threads to request resources strictly in ascending order. In backend applications, a classic implementation is sorting row IDs before executing batch updates.

### Deadlock Avoidance

Deadlock avoidance does not dismantle the four conditions. Instead, before granting a resource request, the system asks: *If this request is granted, will the system remain in a safe state where every process can still eventually finish?*

The Banker's Algorithm is the textbook implementation. It requires each process to declare its maximum resource claims upfront. Before granting an allocation, the OS runs a safety algorithm:
- If a safe execution sequence exists post-allocation, the request is granted.
- If no safe sequence exists, the requesting process must wait.

A safe state guarantees that deadlock will not occur; an unsafe state is not yet deadlocked, but may lead to deadlock depending on future requests.

While foundational for conceptual understanding, the Banker's Algorithm is rarely used in application services. The reasons are pragmatic: most enterprise applications cannot predict their maximum resource requirements upfront; execution paths branch dynamically; and evaluating high-dimensional matrices on every resource allocation incurs steep performance overhead.

### Deadlock Detection

Detection takes an alternative approach: let threads and transactions run unimpeded, and inspect for wait cycles after blocking occurs.

Databases excel at this. Transactions possess clear rollback boundaries: upon detecting a deadlock cycle, the database aborts one transaction, rolling it back so the remaining transaction can finish. The application simply catches the deadlock error and decides whether to retry the transaction.

In Java, diagnostic inspection is built into the JDK via `ThreadMXBean`:

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;

public class DeadlockDetector {
    public static void printDeadlocks() {
        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        long[] threadIds = bean.findDeadlockedThreads();

        if (threadIds == null || threadIds.length == 0) {
            System.out.println("No deadlock found");
            return;
        }

        ThreadInfo[] threadInfos = bean.getThreadInfo(threadIds, true, true);
        for (ThreadInfo threadInfo : threadInfos) {
            System.out.println(threadInfo);
        }
    }
}
```

`findDeadlockedThreads()` inspects object monitors (`synchronized`) as well as `java.util.concurrent` ownable synchronizers (like `ReentrantLock`). It is designed for diagnostics and troubleshooting scripts rather than hot business paths, as cycle detection carries non-trivial overhead.

Its limitations must also be understood: `ThreadMXBean` only inspects monitors and ownable synchronizers within that specific JVM. If Thread A holds a Java lock and blocks waiting on a database row lock, while Thread B holds the database row lock and blocks on an application action, `ThreadMXBean` cannot detect this cross-system wait cycle. Diagnosing such scenarios requires correlating Java thread dumps, database lock views, and distributed traces.

In production environments, capturing thread dumps from the CLI is standard practice:

```bash
jcmd <pid> Thread.print -l
jstack -l <pid>
```

If the dump contains markers such as `Found one Java-level deadlock`, `waiting to lock`, and `which is held by`, you can trace the wait chain directly to the culprit business code. Always append `-l`: many enterprise systems use JUC locks (`ReentrantLock`, `ReentrantReadWriteLock`), and without `-l`, ownable synchronizer information is omitted.

For local reproduction, GUI tools like JConsole and VisualVM are effective. In JConsole, navigate to the JDK `bin` directory and launch `jconsole`:

![jconsole](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jdk-home-bin-jconsole-2cf07489.png)

Connect to the target Java process, switch to the "Threads" tab, and click "Detect Deadlock":

![jconsole detect deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-29a7f927.png)

If a Java thread deadlock exists, JConsole isolates and displays the deadlocked threads:

![jconsole deadlock detected](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-done-3ff1d402.png)

In production environments, CLI tools like `jcmd` and `jstack` remain superior. They execute over SSH, generate text outputs easily archived for incident reviews, and incur minimal overhead. JConsole is better suited for local debugging and QA staging environments. Connecting JConsole to production introduces security risks, firewall hurdles, and runtime overhead; exporting thread dumps for offline analysis is far safer.

When using Java 21+ Virtual Threads, be aware: virtual threads are not permanently bound to operating system platform threads. Traditional `jstack` or `Thread.print` outputs may not surface virtual thread states clearly. Use `jcmd` to export dedicated virtual thread dumps:

```bash
jcmd <pid> Thread.dump_to_file -format=text thread-dump.txt
jcmd <pid> Thread.dump_to_file -format=json thread-dump.json
```

Virtual thread dumps differ in structure from platform thread dumps; information like memory addresses, locks, JNI accounting, and heap metrics standard in traditional dumps may not appear identically. Always cross-reference dumps with application logs, JFR (Java Flight Recorder), database metrics, and external dependency health.

### Deadlock Recovery

Recovery is more challenging than detection because the system must choose a victim to terminate or roll back.

Three standard recovery approaches:
1. **Terminate all deadlocked execution units.**
2. **Terminate one execution unit at a time**, re-running deadlock detection after each termination until the cycle breaks.
3. **Preempt resources**, rolling back selected units to an earlier checkpoint from which they can resume.

Database transactions are well-suited for recovery because transaction boundaries are explicit and rollbacks leave clean state. Standard Java threads are far less forgiving: a thread holding a lock may have modified in-memory state halfway, written partial disk blocks, or dispatched external RPCs. Abruptly terminating it leaves memory corrupt. This is why `Thread.stop()` was deprecated and removed.

In application development, the goal is to avoid writing code into dead ends that require process restarts to recover.

## Deadlocks in Databases

Deadlocks are frequent in relational databases, particularly when concurrent transactions update multiple rows across tables.

Consider an orders table:

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  status VARCHAR(32) NOT NULL
);
```

Two transactions execute concurrently:

```sql
-- Transaction T1
BEGIN;
UPDATE orders SET status = 'PAID' WHERE id = 1;
UPDATE orders SET status = 'PAID' WHERE id = 2;
COMMIT;
```

```sql
-- Transaction T2
BEGIN;
UPDATE orders SET status = 'CANCELLED' WHERE id = 2;
UPDATE orders SET status = 'CANCELLED' WHERE id = 1;
COMMIT;
```

If T1 locks `id=1` and T2 locks `id=2`, their subsequent updates will wait on each other indefinitely.

Databases do not leave these transactions hung forever. PostgreSQL uses the `deadlock_timeout` setting (default `1s`); the database waits this duration before constructing and scanning the wait-for graph, avoiding the overhead of continuous cycle checks on short lock waits. MySQL InnoDB enables deadlock detection by default; upon discovering a cycle, it rolls back one of the transactions (typically the one with fewer row modifications).

The application layer must implement two complementary practices:

1. **Transaction retry handling**: The application must catch deadlock errors and retry the entire transaction. PostgreSQL returns SQLSTATE `40P01`; MySQL InnoDB rolls back the transaction with error 1213. The application must restart the *entire* business transaction, not merely re-execute the single failing SQL statement.
2. **Consistent lock ordering**: When performing batch updates across multiple rows, sort the primary keys or business identifiers ascending first. This simple practice prevents cross-dependency wait cycles.

Ensure business operations are **idempotent** before adding retries. Use unique request IDs, transaction serial numbers, or state machine validations. Otherwise, resolving the database deadlock via blind retry can introduce duplicate charges or double dispatches.

Strategies to minimize and diagnose database deadlocks:
- Keep transactions short; never wait for user input, external HTTP calls, or slow file processing inside a database transaction.
- Ensure queries use proper indexes; unindexed updates trigger full-table scans, locking unintended rows and gap locks.
- Avoid unnecessary `SELECT ... FOR UPDATE` queries.
- In MySQL, execute `SHOW ENGINE INNODB STATUS` to inspect the most recent InnoDB deadlock report. Under frequent contention, enable `innodb_print_all_deadlocks` to record all deadlocks in the error log.
- In PostgreSQL, query `pg_locks` and `pg_stat_activity` to inspect active lock contention.

To identify blocked sessions and their blockers in PostgreSQL:

```sql
SELECT
    a.pid,
    a.usename,
    a.state,
    a.wait_event_type,
    a.wait_event,
    pg_blocking_pids(a.pid) AS blocking_pids,
    a.query
FROM pg_stat_activity a
WHERE a.wait_event_type = 'Lock';
```

This query captures active lock contention. To analyze a historical deadlock, inspect the database error log for transaction lock dumps, correlate with application `traceId` / `requestId`, and reconstruct the SQL execution sequence of both transactions.

Database deadlocks do not mean "the database is broken." They are a signal that the application layer is accessing shared records in an inconsistent order.

## Differences Between Deadlock, Starvation, and Livelock

All three manifest as "the program is not making forward progress," but their runtime dynamics are fundamentally different.

| Issue | Manifestation | Typical Root Cause |
| --- | --- | --- |
| Deadlock | Multiple execution units wait on each other in a closed cycle | Opposite lock acquisition orders, cross-row transaction updates |
| Starvation | An execution unit is starved of resources indefinitely while the system continues to make progress | Unfair lock contention, persistently depressed scheduling priority |
| Livelock | Execution units continuously change state in response to each other, but make zero progress | Overly synchronized retry logic without randomized backoff |

![Comparison of Deadlock, Starvation, and Livelock: Deadlock is a wait cycle; Starvation is indefinite resource starvation; Livelock is continuous activity without forward progress](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-vs-starvation-livelock-0659685e.png)

Use these mental pictures:
- **Deadlock** is two cars meeting on a narrow bridge, neither reversing.
- **Starvation** is someone at the end of a queue continuously pushed back by people cutting in line.
- **Livelock** is two polite pedestrians trying to pass each other in a hallway, repeatedly stepping to the same side simultaneously.

When diagnosing production issues, do not equate every freeze with deadlock. For deadlock, search for a closed wait cycle; for starvation, evaluate fairness and priority biasing; for livelock, check whether retry and backoff logic lack jitter.

## What Types of Freezes Are NOT Deadlocks?

Many production hangs resemble deadlocks, but investigation reveals no circular wait dependencies:

- **Thread pool exhaustion**: All worker threads are executing long-running tasks; new incoming requests queue indefinitely.
- **Connection pool exhaustion**: All threads are blocked waiting for database connections, but there is no circular dependency between threads.
- **Slow SQL queries**: Threads are blocked inside JDBC drivers waiting for the database server to process an unindexed query.
- **External service timeouts**: Threads are stalled waiting for slow upstream HTTP or RPC responses.
- **GC or safepoint pauses**: Stop-The-World (STW) pauses halt all Java application threads.
- **Starvation**: A specific thread is starved by greedy competitors, while the rest of the application runs normally.

The definitive proof of deadlock is the presence of an unbroken wait cycle.

## How to Troubleshoot a Java Deadlock in Production

When production APIs hang, avoid restarting prematurely. If the JVM process is alive, capture thread dumps and diagnostics first.

### 1. Confirm It Is Not a Total Outage

Verify whether the symptoms indicate held, unreleased resources:
- Certain endpoints time out continuously while the JVM process remains running.
- CPU usage is low or normal, while thread counts, connection counts, and request queues accumulate.
- Thread pools have maxed-out active thread counts that never decrease.
- Database connection pools are exhausted and never returned.

These symptoms prove threads are waiting, but do not prove deadlock. Slow SQL, stalled external microservices, and thread pool misconfigurations produce identical symptoms.

### 2. Capture 2 to 3 Thread Dumps in Succession

Capture consecutive thread dumps separated by 10 to 30 seconds. A single dump can easily cause a transient lock wait to be misdiagnosed as a permanent deadlock:

```bash
jcmd <pid> Thread.print -l > thread-1.log
sleep 10
jcmd <pid> Thread.print -l > thread-2.log
sleep 10
jcmd <pid> Thread.print -l > thread-3.log
```

Comparing multiple dumps reveals the truth: if threads are halted on the exact same lock, connection pool, or code line across all three snapshots, the diagnosis is reliable.

If a Java-level deadlock exists, the JVM thread dump will explicitly flag it. Even if no automatic deadlock header appears, you can identify whether dozens of threads are accumulated waiting on the same synchronization primitive or business method.

### 3. Trace Holders via `waiting to lock`

When reading thread dump text, extract:
- Thread name and state (e.g., `BLOCKED`, `WAITING`).
- The lock object identity the thread is waiting for.
- Lock objects currently held by the thread.
- The top business frame on the call stack.
- `parking to wait for <...>` corresponding to `Lock` instances or condition queues.

If Thread A is waiting for a lock held by Thread B, and Thread B is waiting for a lock held by Thread A, the cycle is confirmed.

For `synchronized` deadlocks, dumps output `waiting to lock <...>` and `locked <...>`. For JUC locks like `ReentrantLock`, dumps output `parking to wait for <...>` and list `Locked ownable synchronizers`. This is why the `-l` flag is critical.

### 4. Review Source Code for Lock Acquisition Ordering

Once call stacks pinpoint the business methods, examine the codebase for:
- Multiple entry points acquiring the same locks in conflicting orders.
- Slow network or database operations executed while holding locks.
- Locking excessively broad objects (e.g., static singletons, global maps, `Class` objects).
- Mixing Java-level locks with database transaction locks across boundaries.
- Unfair locks without timeouts.

Most deadlocks do not originate from a single buggy line of code, but from the runtime combination of two separate, well-intentioned call paths.

## Best Practices to Prevent Deadlocks in Code

Use these guidelines during code reviews, especially when managing multiple locks, transactions, or resources.

### Enforce Global Lock Acquisition Ordering

When operating on multiple users, orders, or accounts, sort them before acquiring locks. In this fund transfer example, assume account IDs are globally unique and immutable:

```java
public void transfer(Account from, Account to, long amount) {
    if (from == to) {
        return;
    }

    Account first;
    Account second;
    int compare = Long.compare(from.id(), to.id());
    if (compare < 0) {
        first = from;
        second = to;
    } else if (compare > 0) {
        first = to;
        second = from;
    } else {
        throw new IllegalStateException("Account id must be unique");
    }

    synchronized (first) {
        synchronized (second) {
            from.withdraw(amount);
            to.deposit(amount);
        }
    }
}
```

Whether transferring from A to B or B to A, both threads always lock the lower account ID first, then the higher ID. By enforcing uniform lock ordering, circular wait is mathematically impossible.

### Avoid Slow Operations Inside Critical Sections

Never perform the following operations while holding a lock:
- Remote RPC or HTTP requests.
- Heavy SQL queries or long-lived database transactions.
- File uploads or downloads.
- Awaiting message queue acknowledgments.
- Invoking third-party libraries whose locking behaviors are unknown.

Locks should guard minimal in-memory state transitions. Calculate data before acquiring the lock; enter the lock only for the instantaneous state swap.

### Use Timeouts and Graceful Fallbacks

`synchronized` does not support timed acquisition. When business logic permits retries, leverage `ReentrantLock.tryLock()`:

```java
try {
    if (!lock.tryLock(200, TimeUnit.MILLISECONDS)) {
        throw new IllegalStateException("System busy, please try again later");
    }

    try {
        updateSharedState();
    } finally {
        lock.unlock();
    }
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw new IllegalStateException("Interrupted while acquiring lock", e);
}
```

Timeouts limit wait duration, but do not automatically ensure business consistency. You must plan retry thresholds, backoff strategies, idempotency keys, and error signaling upfront.

### Avoid Mixing Locking Layers

Cross-layer deadlocks are difficult to diagnose:
- Thread A holds a JVM monitor lock while waiting for a database row lock.
- Thread B holds the database row lock while invoking an application callback that waits for the JVM monitor lock.

This circular dependency spans the JVM thread stack and database engine lock tables, invisible when viewing either system in isolation. Keep locks scoped to a single architectural layer. When cross-layer locking is unavoidable, enforce timeouts, comprehensive logging, and strict ordering.

### Name Your Threads and Locks

During production incidents, few things are as frustrating as deciphering `Thread-17 waiting on Object@4afcd809`. Use meaningful thread names in thread pools, associate lock objects with business IDs, and log resource sequences.

For custom thread pools:

```java
private static final AtomicInteger THREAD_INDEX = new AtomicInteger();

ThreadFactory factory = runnable -> {
    Thread thread = new Thread(runnable);
    thread.setName("order-worker-" + THREAD_INDEX.incrementAndGet());
    return thread;
};
```

Using `AtomicInteger` from `java.util.concurrent.atomic` ensures thread-safe, predictable naming across Java 8, 11, 17, and 21. Descriptive naming does not prevent deadlocks, but it slashes incident resolution time.

## How to Answer Deadlock in an Interview

Avoid reciting dry dictionary definitions. Begin with a concrete, two-thread scenario:

> Deadlock occurs when multiple threads or processes are blocked indefinitely, each waiting for resources held by another in the group, forming a closed dependency cycle. A classic example is Thread A holding Lock 1 while waiting for Lock 2, while Thread B holds Lock 2 while waiting for Lock 1.

Then articulate the four necessary conditions:

> For deadlock to occur, four Coffman conditions must hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any single condition structurally prevents deadlock from occurring.

Follow up with real-world solutions:

> In production engineering, Prevention is the primary tool—such as enforcing global lock acquisition ordering, shrinking critical sections, and using timed acquisitions with `tryLock`. Operating systems also define Banker's Algorithm for Deadlock Avoidance, which evaluates safe states based on declared maximum claims. Relational databases use Detection and Recovery: when wait-for graphs detect a cycle, the engine rolls back one transaction, allowing the application to retry.

If asked about Java troubleshooting:

> In Java, capture thread dumps using `jcmd <pid> Thread.print -l` or `jstack -l <pid>`, or run programmatic checks via `ThreadMXBean.findDeadlockedThreads()`. In the thread dump, inspect thread states (`BLOCKED`), identified lock objects, and `Locked ownable synchronizers` to reconstruct the wait cycle, then verify source code for conflicting lock acquisition sequences or slow operations inside critical sections.

This response covers conceptual foundations, necessary conditions, mitigation architectures, and production diagnostics.

## Summary

The most important takeaway about deadlock is **the wait relationship**.

Whenever code holds one resource while requesting another, ask: *Can these wait relationships ever form a circular dependency?* If so, enforce a global acquisition order, minimize hold duration, implement timeout fallbacks, or delegate synchronization to transaction engines capable of cycle detection and automatic rollback.

Zero-deadlock guarantees are impossible in complex distributed systems with high-concurrency batch updates. A pragmatic engineering goal is to reduce probability, ensure telemetry captures clear evidence, and design transactional operations to be safely retryable without requiring emergency service restarts.

## References

- [JavaGuide: Common Operating System Interview Questions Summary (Part 1)](https://github.com/Snailclimb/JavaGuide)
- [Explaining Deadlock with an Intuitive Example - Zhihu Column](https://zhuanlan.zhihu.com/p/26945588)
- [Yale CS: Deadlock](https://www.cs.yale.edu/homes/aspnes/pinewiki/Deadlock.html)
- [University of Wisconsin CS 537 Notes: Deadlock](https://pages.cs.wisc.edu/~bart/537/lecturenotes/s12.html)
- [Oracle Java Tutorials: Deadlock](https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html)
- [Oracle JDK API: ReentrantLock](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [Oracle JDK API: ThreadMXBean](https://docs.oracle.com/javase/8/docs/api/java/lang/management/ThreadMXBean.html)
- [Oracle Troubleshooting Guide: The jstack Utility](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/tooldescr016.html)
- [Oracle Java Documentation: Virtual Threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
- [Linux Kernel Documentation: Runtime locking correctness validator](https://docs.kernel.org/locking/lockdep-design.html)
- [PostgreSQL Documentation: Lock Management](https://www.postgresql.org/docs/current/runtime-config-locks.html)
- [PostgreSQL Documentation: Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [PostgreSQL Documentation: pg_locks](https://www.postgresql.org/docs/current/view-pg-locks.html)
- [MySQL 8.4 Reference Manual: Deadlock Detection](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-detection.html)
- [MySQL 8.4 Reference Manual: InnoDB Error Handling](https://dev.mysql.com/doc/refman/8.4/en/innodb-error-handling.html)
