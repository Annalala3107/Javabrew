---
title: "Distributed Lock Implementations Explained: Redis, Redlock, ZooKeeper, and Redisson Watch Dog"
category: Distributed Systems
description: "Detailed guide to distributed lock implementations, covering Redis SET NX EX, Lua safe lock release, Redisson Watch Dog, Redlock, ZooKeeper ephemeral sequential nodes, Curator reentrant locks, Fencing Tokens, and production practices."
tag:
  - Distributed Lock
head:
  - - meta
    - name: keywords
      content: Distributed Lock,Redis Distributed Lock,ZooKeeper Distributed Lock,Redisson,Watch Dog,SETNX,Redlock,Fencing Token,Curator,Distributed Lock Implementation,Distributed Lock Interview Questions
lang: en
sourceRef: zh-ref/distributed-system/distributed-lock-implementations.md
---

In practice, distributed locks are typically implemented using either Redis or ZooKeeper, with Redis being more widely used. Let us start by looking at how distributed locks are implemented with Redis.

This article assumes you already understand why distributed locks are needed. If you are not yet clear on lock granularity, owner tokens, lock timeouts, and business critical sections, we recommend reading [Introduction to Distributed Locks](./distributed-lock.md) first. If you want to place lock expiration, stale client recovery, and Fencing Tokens into a broader coordination model, you can read this alongside [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md).

## Implementing Distributed Locks with Redis

### How to Implement the Simplest Distributed Lock Based on Redis?

Whether it is a local lock or a distributed lock, the core principle is **mutual exclusion**.

In Redis, the `SETNX` command helps us achieve mutual exclusion. `SETNX` stands for **SET** if **N**ot e**X**ists (corresponding to the `setIfAbsent` method in Java): it sets the key's value only if the key does not already exist. If the key already exists, `SETNX` does nothing.

```bash
> SETNX lockKey uniqueValue
(integer) 1
> SETNX lockKey uniqueValue
(integer) 0
```

To release the lock, you simply delete the corresponding key using the `DEL` command.

```bash
> DEL lockKey
(integer) 1
```

To prevent accidentally deleting another client's lock, we recommend using a Lua script to first verify that the value corresponding to the key matches the unique value written when the lock was acquired, and only delete it after the check passes.

Choosing a Lua script ensures the atomicity of the unlock operation. Because Redis executes Lua scripts atomically, the atomicity of lock release is guaranteed.

```lua
-- When releasing the lock, first compare whether the key's value matches the unique value written upon acquisition; delete only if it matches, avoiding accidental deletion of locks held by other clients
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

![Simple distributed lock implemented with Redis](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-setnx-24920263.png)

This is the simplest Redis distributed lock implementation—easy to build and very fast. However, this implementation has flaws. For instance, if the application crashes unexpectedly right before executing the lock-release logic, the lock may never be released, preventing other threads or processes from ever accessing the shared resource.

### Why Should We Set an Expiration Time on a Lock?

To avoid a lock never being released, an intuitive solution is to **set an expiration time on this key (the lock)**.

```bash
127.0.0.1:6379> SET lockKey uniqueValue EX 3 NX
OK
```

- **lockKey**: The name of the lock being acquired;
- **uniqueValue**: A random string that uniquely identifies the lock holder;
- **NX**: Succeeds in `SET` only when the key `lockKey` does not exist;
- **EX**: Expiration time setting (in seconds). `EX 3` gives the lock an automatic 3-second expiration time. Its counterpart is `PX` (in milliseconds); both configure expiration time.

**You must guarantee that setting the key's value and setting its expiration time happen as a single atomic operation!!!** Otherwise, the lock can still end up unreleasable.

Why use `SET NX EX` instead of `SETNX` followed by `EXPIRE`? In early implementations, `SETNX` followed by `EXPIRE` were two separate operations: if a client crashed after `SETNX` succeeded but before `EXPIRE` ran, it would leave behind a permanent lock. Since Redis 2.6.12, atomic syntax like `SET key value NX EX seconds` has been supported and should always be preferred to avoid deadlock risks.

This solves the crash-before-unlock issue, yet it introduces another pitfall: **if operating on the shared resource takes longer than the expiration time, the lock expires prematurely, causing the distributed lock to fail directly. Conversely, setting the timeout too long degrades performance.**

This is also the root reason why Fencing Tokens are needed later: simply extending TTL cannot eliminate the window in which "Client A still believes it holds the lock, while the lock has actually expired and been acquired by Client B."

You might be thinking: **If only the lock's expiration time could automatically renew itself when operations on the shared resource are not yet finished!**

### How to Implement Graceful Lock Renewal?

For Java developers, there is already a ready-made solution: **[Redisson](https://github.com/redisson/redisson)**. Solutions for other languages can be found in the official Redis documentation at <https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/>.

![Distributed locks with Redis](/media/jg/ext/oss.javaguide.cn/github/javaguide/redis-distributed-lock-c6e6e1a9.png)

Redisson is an open-source Java Redis client that provides many out-of-the-box features—not just multiple distributed lock implementations. Moreover, Redisson supports standalone Redis, Redis Sentinel, Redis Cluster, and other deployment topologies.

Distributed locks in Redisson come with an automatic renewal mechanism that is both simple to use and straightforward in principle: it provides a **Watch Dog** dedicated to monitoring and renewing locks. If the thread operating on the shared resource has not finished executing, the Watch Dog continuously extends the lock's expiration time so that the lock will not be released due to timeout.

![Redisson Watch Dog automatic renewal](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-redisson-renew-expiration-1be699dd.png)

The name "Watch Dog" comes from the `getLockWatchdogTimeout()` method, which returns the expiration duration used by the Watch Dog when renewing locks—30 seconds by default (based on [redisson-3.17.6](https://github.com/redisson/redisson/releases/tag/redisson-3.17.6)). Redisson has now entered the 4.x series; for exact configuration semantics, refer to the source code of `Config#getLockWatchdogTimeout` and `RedissonBaseLock#renewExpiration` in the version your project actually uses.

```java
// Default is 30 seconds; configurable
private long lockWatchdogTimeout = 30 * 1000;

public Config setLockWatchdogTimeout(long lockWatchdogTimeout) {
    this.lockWatchdogTimeout = lockWatchdogTimeout;
    return this;
}
public long getLockWatchdogTimeout() {
   return lockWatchdogTimeout;
}
```

The `renewExpiration()` method contains the core Watch Dog logic:

```java
private void renewExpiration() {
         //......
        Timeout task = commandExecutor.getConnectionManager().newTimeout(new TimerTask() {
            @Override
            public void run(Timeout timeout) throws Exception {
                //......
                // Asynchronous renewal based on Lua script
                CompletionStage<Boolean> future = renewExpirationAsync(threadId);
                future.whenComplete((res, e) -> {
                    if (e != null) {
                        // Unable to renew
                        log.error("Can't update lock " + getRawName() + " expiration", e);
                        EXPIRATION_RENEWAL_MAP.remove(getEntryName());
                        return;
                    }

                    if (res) {
                        // Trigger next renewal via timer callback chaining rather than stack recursion, avoiding unbounded call stack growth
                        renewExpiration();
                    } else {
                        // Cancel renewal
                        cancelExpirationRenewal(null);
                    }
                });
            }
         // Delayed by internalLockLeaseTime/3 (default 10s, i.e., 30/3) before invoking
        }, internalLockLeaseTime / 3, TimeUnit.MILLISECONDS);

        ee.setTimeout(task);
    }
```

By default, every 10 seconds, the Watch Dog performs a renewal operation that resets the lock's timeout to 30 seconds. Before renewing, it checks whether renewal is still needed; it renews only if required and cancels renewal otherwise.

The Watch Dog implements asynchronous lock renewal by invoking `renewExpirationAsync()`:

```java
protected CompletionStage<Boolean> renewExpirationAsync(long threadId) {
    return evalWriteAsync(getRawName(), LongCodec.INSTANCE, RedisCommands.EVAL_BOOLEAN,
            // Check whether the lock is still held by this thread; if so, renew the lock expiration to 30s (default)
            "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
                    "redis.call('pexpire', KEYS[1], ARGV[1]); " +
                    "return 1; " +
                    "end; " +
                    "return 0;",
            Collections.singletonList(getRawName()),
            internalLockLeaseTime, getLockName(threadId));
}
```

As shown above, `renewExpirationAsync` executes a Lua script to renew the lock, primarily to ensure the atomicity of the renewal operation.

Let us use Redisson's reentrant lock implementation `RLock` as an example of how to use Redisson for distributed locking:

```java
// 1. Obtain the specified distributed lock object
RLock lock = redisson.getLock("lock");
// 2. Acquire the lock without specifying a lease time to enable Watch Dog auto-renewal
lock.lock();
// 3. Execute business logic
...
// 4. Release the lock
lock.unlock();
```

The Watch Dog automatic renewal mechanism is activated only when no lock lease timeout is explicitly specified.

```java
// Manually setting an expiration time disables Watch Dog automatic renewal
lock.lock(10, TimeUnit.SECONDS);
```

When implementing distributed locks with Redis, using Redisson directly is strongly recommended.

### How to Implement a Reentrant Lock?

A **reentrant lock** allows the same thread to acquire the same lock multiple times. For example, if a thread executes a locked method that calls another method requiring the same lock, the thread can enter that method directly without having to re-acquire the lock. Both `synchronized` and `ReentrantLock` in Java are reentrant locks.

**Non-reentrant distributed locks are sufficient for the vast majority of business scenarios, while certain specialized scenarios require reentrant distributed locks.**

The core idea of a reentrant distributed lock is that when a thread attempts to acquire a lock, it checks whether it already owns the lock; if so, it does not need to acquire it anew. To achieve this, we associate each lock with a reentrancy counter and an owning thread identifier. When the counter is greater than 0, the lock is held, and we check whether the thread holding the lock is the same as the thread requesting it.

In real-world projects, we do not need to build this manually—we recommend using **Redisson** mentioned above, which comes with built-in lock types including Reentrant Lock, Spin Lock, Fair Lock, MultiLock, RedLock, and ReadWriteLock.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/redisson-readme-locks-f664da3d.png)

### How Does Redis Address Distributed Lock Reliability in Cluster Setups?

To eliminate single points of failure, Redis services in production are typically deployed in clusters.

Under a Redis cluster, the distributed lock implementations described above suffer from a critical flaw. Redis master-replica replication is asynchronous by default: once the master writes the lock successfully, it returns immediately to the client and replicates asynchronously to replicas. If the master crashes before replication completes, Sentinel or Redis Cluster failover may promote a replica that has not yet received the lock data to be the new master. Consequently, the original lock is lost, and another client can acquire the lock again, breaking mutual exclusion.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/redis-master-slave-distributed-lock-a2db96f4.png)

To address this problem, Redis creator antirez designed the [Redlock algorithm](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/).

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-redis.io-realock-4a999396.png)

The core idea of the Redlock algorithm is to have the client sequentially request the lock from multiple mutually independent Redis master instances. If the client succeeds in acquiring the lock on a strict majority of instances, it is considered to have obtained the distributed lock; otherwise, lock acquisition fails.

The complete conditions for Redlock are as follows:

- Use N mutually independent Redis masters (not Redis Cluster shards).
- The client records the start time.
- Sequentially request the lock from each node using the same key, value, and TTL, with a short timeout per request so a single slow node does not stall the entire acquisition.
- Lock acquisition succeeds only if at least `N/2 + 1` nodes succeed and the total elapsed time is less than the TTL.
- The effective validity time of the lock is approximately `TTL - acquisition elapsed time - clock drift allowance`.
- Upon failure, release requests must be sent to all nodes, including nodes where acquisition failed or timed out.

Redlock operates directly against independent Redis nodes rather than through Redis Cluster, thereby avoiding lock loss caused by failover within a single master-replica shard.

Redlock is relatively complex to implement, delivers lower performance, and still carries safety hazards under clock jumps. Martin Kleppmann, author of *Designing Data-Intensive Applications*, wrote a famous critique ([How to do distributed locking - Martin Kleppmann - 2016](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)) arguing that Redlock is a poor distributed lock design. Interested readers can check out this article ([From Interview Grilling on Redis Locks to a Clash of Titans](https://mp.weixin.qq.com/s?__biz=Mzg3NjU3NTkwMQ==&mid=2247505097&idx=1&sn=5c03cb769c4458350f4d4a321ad51f5a&source=41#wechat_redirect)), which details the debate between antirez and Martin Kleppmann over Redlock.

How do you decide whether to use Redlock? The key is to distinguish the use case of the lock first:

1. **Efficiency-oriented locking**: Where lock failure only leads to acceptable consequences such as duplicate computation or duplicate task execution, you can use single-instance Redis, Sentinel, or Cluster, while explicitly accepting the rare risk of concurrent execution under extreme failures.
2. **Correctness-oriented locking**: Where lock failure causes unacceptable consequences such as inventory corruption, financial discrepancies, or data corruption, you should prefer ZooKeeper or etcd paired with Fencing Tokens rather than relying on Redis master-replica failover for strict mutual exclusion.
3. Redlock depends on bounded network delay, bounded process pauses, and bounded clock drift. Long GC pauses, clock jumps, and delayed packets all undermine its correctness.
4. Martin Kleppmann's core argument is that correctness-oriented locks must be paired with Fencing Tokens; antirez's rebuttal focuses on the view that in engineering practice clock drift has limited impact and random values prevent accidental deletion. You should distinguish the scenario first before choosing a solution.

## Implementing Distributed Locks with ZooKeeper

Compared with Redis-based distributed locks, ZooKeeper offers higher reliability and also provides a very useful feature at the functional level: the **Watch mechanism**, which enables fair distributed locks. However, ZooKeeper-based distributed locks have relatively lower performance, so ZooKeeper may not be suitable when high throughput and low latency are paramount.

### How to Implement a Distributed Lock Based on ZooKeeper?

ZooKeeper distributed locks are built using **ephemeral sequential nodes** and **Watchers (event listeners)**.

Acquiring a lock:

1. First, there is a persistent node `/locks`. When a client wants to acquire the lock, it creates an ephemeral sequential node under `/locks`.
2. Suppose Client 1 creates `/locks/lock1`. After creation succeeds, it checks whether `lock1` is the smallest child node under `/locks`.
3. If `lock1` is the smallest child node, lock acquisition succeeds. Otherwise, lock acquisition fails.
4. If lock acquisition fails, it means another client already holds the lock. Instead of spinning in a loop to retry locking, Client 1 registers a Watcher on the immediately preceding node—for example, `/locks/lock0`. This listener notifies Client 1 once the preceding node releases the lock (avoiding wasteful spinning), allowing Client 1 to acquire the lock.

Releasing a lock:

1. After the client holding the lock finishes executing its business logic, it deletes its corresponding child node.
2. If the client holding the lock crashes, its child node is automatically deleted because it is an ephemeral sequential node, preventing permanent lock retention.
3. The Watcher mentioned earlier specifically listens for this child-node deletion event; deletion of the child node signifies that the lock has been released.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-lock/distributed-lock-zookeeper-f61bc28a.png)

In real-world projects, we recommend using Curator to implement ZooKeeper distributed locks. Curator is an open-source ZooKeeper Java client framework originally developed by Netflix; compared with ZooKeeper's built-in `zookeeper` client, Curator provides much cleaner encapsulation and convenient APIs.

`Curator` primarily implements the following four types of locks:

- `InterProcessMutex`: Distributed reentrant exclusive lock
- `InterProcessSemaphoreMutex`: Distributed non-reentrant exclusive lock
- `InterProcessReadWriteLock`: Distributed read-write lock
- `InterProcessMultiLock`: A container that manages multiple locks as a single entity—acquiring it acquires all locks, and releasing it releases all lock resources (ignoring locks that fail to release).

```java
CuratorFramework client = ZKUtils.getClient();
client.start();
// Distributed reentrant exclusive lock
InterProcessLock lock1 = new InterProcessMutex(client, lockPath1);
// Distributed non-reentrant exclusive lock
InterProcessLock lock2 = new InterProcessSemaphoreMutex(client, lockPath2);
// Combine multiple locks into a single entity
InterProcessMultiLock lock = new InterProcessMultiLock(Arrays.asList(lock1, lock2));

if (!lock.acquire(10, TimeUnit.SECONDS)) {
   throw new IllegalStateException("Unable to acquire multiple locks");
}
System.out.println("Acquired multiple locks");
System.out.println("Holds the first lock: " + lock1.isAcquiredInThisProcess());
System.out.println("Holds the second lock: " + lock2.isAcquiredInThisProcess());
try {
    // Resource operations
    resource.use();
} finally {
    System.out.println("Releasing multiple locks");
    lock.release();
}
System.out.println("Holds the first lock: " + lock1.isAcquiredInThisProcess());
System.out.println("Holds the second lock: " + lock2.isAcquiredInThisProcess());
client.close();
```

### Why Use Ephemeral Sequential Nodes?

Every data node in ZooKeeper is called a **znode**, which is the smallest unit of data in ZooKeeper.

Znodes are typically divided into 4 main categories:

- **PERSISTENT node**: Once created, it persists even if the ZooKeeper cluster goes down, until explicitly deleted.
- **EPHEMERAL node**: The lifecycle of an ephemeral node is tied to the **client session**; **when the session ends, the node disappears**. Moreover, **ephemeral nodes can only be leaf nodes** and cannot have child nodes.
- **PERSISTENT_SEQUENTIAL node**: In addition to the properties of a PERSISTENT node, child node names have an ordered sequence suffix, such as `/node1/app0000000001` and `/node1/app0000000002`.
- **EPHEMERAL_SEQUENTIAL node**: In addition to the properties of an EPHEMERAL node, child node names have an ordered sequence suffix.

As we can see, the main difference between ephemeral and persistent nodes lies in how session termination is handled: when a session disappears, the corresponding ephemeral node disappears too. Thus, if a client experiences an exception and fails to release the lock in time, the node is automatically deleted upon session expiration, preventing a crashed client process from holding the lock forever.

However, ZooKeeper must still account for GC pauses, network partitions, and session timeouts. When a long GC pause or network partition causes a client's session to expire, ZooKeeper deletes the ephemeral node and lets a new client acquire the lock, while the old client may not yet realize its session has expired and still believe it holds the lock. For scenarios with strict correctness requirements, Fencing Tokens should still be used to prevent stale clients from writing outdated data after recovery.

When implementing a distributed lock with Redis, we rely on expiration times to prevent unreleasable locks from causing deadlocks; with ZooKeeper, we leverage the properties of ephemeral nodes to handle lock release after client crashes.

If sequential nodes were not used, every client attempting to acquire the lock would register a Watcher on the single lock-holding child node. Once that lock is released, all waiting clients would rush to contend for the lock at once (herd effect), hurting performance. Using sequential nodes allows each client to watch only the immediately preceding node, which is far more efficient.

### Why Register a Watcher on the Preceding Node?

> Watcher (event listener) is a very important feature of ZooKeeper. ZooKeeper allows users to register Watchers on specified nodes, and when specific events are triggered, the ZooKeeper server pushes event notifications to interested clients. This mechanism is fundamental to ZooKeeper's role as a distributed coordination service.

At any given time, many clients may try to acquire the lock simultaneously, yet only one can succeed. Failure to acquire means another client already holds the lock. Instead of continuously polling in a loop to retry, a client that failed to acquire registers an event listener on its immediately preceding node.

The role of this Watcher is: **once the client corresponding to the preceding node releases the lock (i.e., when the preceding node is deleted—the listener watches the deletion event), it notifies the waiting client (waking up the waiting thread, via `wait/notifyAll` in Java), allowing it to attempt lock acquisition and succeed.**

### How to Implement a Reentrant Lock?

Let us explain this using Curator's `InterProcessMutex` reentrant lock implementation (source code: [InterProcessMutex.java](https://github.com/apache/curator/blob/master/curator-recipes/src/main/java/org/apache/curator/framework/recipes/locks/InterProcessMutex.java)).

When we call `InterProcessMutex#acquire`, it invokes `InterProcessMutex#internalLock`.

```java
// Acquire the reentrant mutex lock, blocking until acquired
@Override
public void acquire() throws Exception {
  if (!internalLock(-1, null)) {
    throw new IOException("Lost connection while trying to acquire lock: " + basePath);
  }
}
```

The `internalLock` method first gets the current requesting thread and looks up the corresponding `lockData` in `threadData` (of type `ConcurrentMap<Thread, LockData>`). `lockData` stores lock metadata and the reentrancy count, making it the key to reentrancy.

On the first lock acquisition, `lockData` is `null`. After successfully acquiring the lock, the current thread and its `lockData` are stored in `threadData`.

```java
private boolean internalLock(long time, TimeUnit unit) throws Exception {
  // Get the current thread requesting the lock
  Thread currentThread = Thread.currentThread();
  // Retrieve the corresponding lockData
  LockData lockData = threadData.get(currentThread);
  // On first acquisition, lockData is null
  if (lockData != null) {
    // This thread has already acquired the lock once
    // Since an entry exists for the current thread, increment lockCount and return to achieve reentrancy
    lockData.lockCount.incrementAndGet();
    return true;
  }
  // Attempt to acquire the lock
  String lockPath = internals.attemptLock(time, unit, getLockNodeBytes());
  if (lockPath != null) {
    LockData newLockData = new LockData(currentThread, lockPath);
    // After acquiring the lock, put the current thread and its lockData into threadData
    threadData.put(currentThread, newLockData);
    return true;
  }

  return false;
}
```

`LockData` is a static inner class inside `InterProcessMutex`.

```java
private final ConcurrentMap<Thread, LockData> threadData = Maps.newConcurrentMap();

private static class LockData
{
    // Thread currently holding the lock
    final Thread owningThread;
    // Child node path corresponding to the lock
    final String lockPath;
    // Reentrancy acquisition count
    final AtomicInteger lockCount = new AtomicInteger(1);

    private LockData(Thread owningThread, String lockPath)
    {
      this.owningThread = owningThread;
      this.lockPath = lockPath;
    }
}
```

If the thread has already acquired the lock once, subsequent acquisition attempts are intercepted at `if (lockData != null)` and simply execute `lockData.lockCount.incrementAndGet();` to increment the acquisition count by 1.

The entire reentrant lock logic is straightforward: check on the client side whether the current thread already holds the lock, and if so, increment the acquisition count by 1.

Note the boundary of reentrancy: reentrancy in Curator's `InterProcessMutex` applies only to the same thread within the same JVM. Similarly, Redisson's `RLock` tracks the lock-holding thread and reentrancy count via `UUID:threadId`, which does not imply natural reentrancy across different JVMs or threads for the same business user. If business-level reentrancy across processes or JVMs is required, you must design business identity, idempotency, and deduplication logic at the application layer.

## Engineering Implementation of Fencing Tokens

A Fencing Token by itself is merely a monotonically increasing version number; it only takes effect when the target resource validates it. Clients must attach the token when accessing a database, object storage, or external resource, and the resource side must persist the highest token seen so far and reject any write carrying a smaller token. Otherwise, generating a token alone serves no purpose.

Common implementation patterns are as follows:

| Storage / System | Token Source | Validation Method |
| --- | --- | --- |
| MySQL | Add a `fencing_token` column to the business table | `UPDATE ... SET fencing_token = ? WHERE id = ? AND ? > fencing_token`, ensuring the new token is greater than the stored token |
| Object Storage | Pass a token or version condition on write | Use Conditional Write or object version constraints |
| ZooKeeper | Consider using `zxid` or znode stat version | The resource side rejects writes with older versions |
| etcd | `revision` / `mod_revision` | Validate the version using a conditional transaction (`Txn`) |

Note: If an external resource does not support conditional writes or version validation, it is not suitable for correctness-oriented distributed locking scenarios. You should either switch to a stronger-consistency coordination service or refactor the resource write path to support token validation.

This goes back to the root cause of "premature lock expiration" mentioned earlier: simply extending TTL cannot eliminate the window where "Client A still believes it holds the lock, while the lock has actually expired and been acquired by Client B." Fencing Tokens provide a safety net via version validation on the resource side.

## Brief Comparison with etcd and Consul

- **etcd**: Built on Raft, offering capabilities such as Lease, Txn, and `revision`, making it naturally well-suited for coordination with fencing. etcd is more common in cloud-native and Kubernetes ecosystems.
- **Consul**: Provides Session + Lock, though you still need to account for session TTL misjudgment and fencing.

In the Java ecosystem, ZooKeeper + Curator is more mature; in the cloud-native/Kubernetes ecosystem, etcd is more common.

In practice, technology selection should consider your team's existing infrastructure, client ecosystem, performance requirements, and failure-handling capabilities.

## Summary

In this article, we mainly introduced two common ways to implement distributed locks—**Redis** and **ZooKeeper**—along with a brief comparison against etcd and Consul. Which solution to choose depends on your specific business requirements.

- If you need high performance and can tolerate the rare risk of concurrent execution under extreme failures, you can implement distributed locks with Redis. It is recommended to prefer the ready-made distributed locks provided by **Redisson** rather than rolling your own.
- If you have high reliability and correctness requirements, use ZooKeeper or etcd paired with Fencing Tokens. For ZooKeeper, building on the **Curator** framework is recommended. However, many modern projects do not use ZooKeeper at all, and introducing ZooKeeper solely for distributed locking is generally undesirable—avoid adding unnecessary system complexity just for a small feature.

Keep in mind that regardless of which approach you choose—including Redis, ZooKeeper, or etcd—under anomalies such as process GC pauses, network latency, network partitions, or clock drift, any lease-based distributed lock has a window where a client mistakenly believes it still holds the lock. To further improve system reliability, it is recommended to introduce resource-side safeguards such as Fencing Tokens to prevent writes from stale clients.
