---
title: Understanding AQS Principles and Applications Through ReentrantLock Implementation
description: "Deep dive into ReentrantLock and AQS principles: detailed explanation of ReentrantLock reentrant lock implementation, differences between fair and non-fair locks, AQS-based locking and unlocking flows, and performance comparison with synchronized."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/reentrantlock.md
head:
  - - meta
    - name: keywords
      content: ReentrantLock,AQS,fair lock,non-fair lock,reentrant lock,lock unlock,ReentrantLock principles,synchronized comparison
---

> Reprinted from: <https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html>
>
> Author: Meituan Technical Team

Most synchronizer classes in Java (`Semaphore`, `ReentrantLock`, etc.) are implemented based on `AbstractQueuedSynchronizer` (abbreviated as AQS). AQS is a simple framework that provides atomic management of synchronization state, thread blocking and wake-up capabilities, and a queue model.

This article progresses gradually from the application layer down to the principle layer. Through the basic characteristics of `ReentrantLock` and the relationship between `ReentrantLock` and AQS, we will interpret the core concepts of exclusive locks in AQS, using a Q&A format to help everyone understand AQS. Due to space constraints, this article mainly explains the exclusive lock logic and Sync Queue in AQS, without covering Shared Locks and the Condition Queue (the core focus of this article is analyzing AQS principles; `ReentrantLock` is only briefly introduced, and interested readers can inspect the `ReentrantLock` source code).

> The source code analysis in this article is based on JDK 8. The internal implementation of AQS has continued to evolve since then: the main fields and methods covered in this article can still be seen in JDK 11, whereas in JDK 17 and current versions, node fields as well as enqueueing and waiting implementations have changed significantly. However, the core ideas of synchronization state, wait queues, and acquiring/releasing resources still serve as a solid foundation for understanding.

## 1 ReentrantLock

### 1.1 Overview of ReentrantLock Characteristics

`ReentrantLock` means a reentrant lock, which allows a single thread to acquire the same critical resource lock multiple times. To help everyone better understand the characteristics of `ReentrantLock`, let's first compare `ReentrantLock` with the commonly used `Synchronized`. Its characteristics are as follows (the parts highlighted in blue are the main focus of this article):

![](/media/jg/ext/p0.meituan.net/travelcube/412d294ff5535bbcddc0d979b2a339e6102264-2c011342.png)

Let's make a more intuitive comparison using pseudocode below:

```java
// ************************** How Synchronized Is Used **************************
// 1. Used on a code block
synchronized (this) {}
// 2. Used on an object
synchronized (object) {}
// 3. Used on a method
public synchronized void test () {}
// 4. Reentrant
for (int i = 0; i < 100; i++) {
  synchronized (this) {}
}
// ************************** How ReentrantLock Is Used **************************
public void test () throws Exception {
  // 1. Choose fair lock or non-fair lock at initialization
  ReentrantLock lock = new ReentrantLock(true);
  // 2. Can be used on a code block
  lock.lock();
  try {
    // 3. Supports multiple locking modes, more flexible; has reentrant characteristics
    if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
      try {
        // Logic executed after acquiring the lock a second time
      } finally {
        // Every successful lock acquisition must have a corresponding release
        lock.unlock();
      }
    }
  } finally {
    lock.unlock();
  }
}
```

### 1.2 Relationship Between ReentrantLock and AQS

From the discussion above, we already know that `ReentrantLock` supports both Fair Locks and Non-fair Locks (for a principle-level analysis of Fair Locks and Non-fair Locks, you can refer to "[Everything You Need to Know About Java 'Locks'](https://mp.weixin.qq.com/s?__biz=MjM5NjQ5MTI5OA==&mid=2651749434&idx=3&sn=5ffa63ad47fe166f2f1a9f604ed10091&chksm=bd12a5778a652c61509d9e718ab086ff27ad8768586ea9b38c3dcf9e017a8e49bcae3df9bcc8&scene=38#wechat_redirect)"), and `ReentrantLock` is implemented on top of AQS under the hood. So how does `ReentrantLock` connect with AQS through Fair Locks and Non-fair Locks? Let's focus on the lock acquisition process of both to understand their relationship with AQS (the connection with AQS is quite obvious during locking; the unlocking process will be introduced later).

The locking process in the source code of the Non-fair Lock is as follows:

```java
// java.util.concurrent.locks.ReentrantLock#NonfairSync

// Non-fair lock
static final class NonfairSync extends Sync {
  ...
  final void lock() {
    if (compareAndSetState(0, 1))
      setExclusiveOwnerThread(Thread.currentThread());
    else
      acquire(1);
    }
  ...
}
```

This snippet means:

- If setting the `State` (synchronization state) variable via CAS succeeds—meaning lock acquisition succeeds—then the current thread is set as the exclusive owner thread.
- If setting the `State` (synchronization state) variable via CAS fails—meaning lock acquisition fails—then it enters the `Acquire` method for subsequent processing.

The first step is easy to understand, but in the second step, after failing to acquire the lock, what is the subsequent handling strategy? This raises the following questions:

- What is the subsequent flow when a thread fails to acquire the lock? There are two possibilities:

(1) Mark the lock acquisition result of the current thread as failed and end the locking flow. This design would drastically reduce system concurrency and does not meet practical needs. Therefore, we need the second approach below, which is the processing flow of the AQS framework.

(2) There exists some kind of queuing and waiting mechanism where the thread continues to wait, retaining the possibility of acquiring the lock while the lock acquisition flow continues.

- Regarding the second case of Question 1, since there is a queuing and waiting mechanism, some kind of queue must be formed. What data structure is this queue?
- When does a thread in the queuing and waiting mechanism get a chance to acquire the lock?
- If a thread in the queuing and waiting mechanism remains unable to acquire the lock, does it have to wait forever, or is there another strategy to solve this problem?

Keeping these questions about the Non-fair Lock in mind, let's look at how the Fair Lock acquires the lock in the source code:

```java
// java.util.concurrent.locks.ReentrantLock#FairSync

static final class FairSync extends Sync {
  ...
  final void lock() {
    acquire(1);
  }
  ...
}
```

Looking at this code, we might have this question: the `Lock` function acquires the lock via the `Acquire` method, but how exactly does it acquire the lock?

Comparing the locking flows of Fair Locks and Non-fair Locks, although their flows differ slightly, both call the `Acquire` method, and `Acquire` is a core method in AQS, which is the superclass of `FairSync` and `UnfairSync`.

For the questions raised above, none of them can actually be answered within the `ReentrantLock` class source code itself. All the answers lie in `AbstractQueuedSynchronizer`, the class where the `Acquire` method resides—that is, the core topic of this article: AQS. Below, we will explain AQS and the connection between `ReentrantLock` and AQS in detail (answers to these questions will be provided in Section 2.3.5).

## 2 AQS

First, let's get an overall understanding of the AQS framework through the architecture diagram below:

![](/media/jg/ext/p1.meituan.net/travelcube/82077ccf14127a87b77cefd1ccf562d3253591-9543192d.png)

- In the diagram above, the colored boxes represent Methods, and the uncolored boxes represent Attributes.
- Overall, the AQS framework is divided into five layers, going from top to bottom and from high-level to low-level, from the APIs exposed externally by AQS down to the underlying foundational data.
- When integrating a custom synchronizer, you only need to override some of the methods required in the first layer, without needing to worry about the specific underlying implementation flow. When a custom synchronizer performs a lock or unlock operation, it first goes through the first-layer API into internal AQS methods, then passes through the second layer to acquire the lock. For failed lock acquisitions, it enters the third and fourth layers for wait queue handling, and all of this handling depends on the fifth layer, which provides the foundational data.

Below, we will dissect the AQS framework one step at a time—from overall structure to details, and from flows to methods. The main analysis sequence is as follows:

![](/media/jg/ext/p1.meituan.net/travelcube/d2f7f7fffdc30d85d17b44266c3ab05323338-776adf5d.png)

### 2.1 Overview of Principles

The core idea of AQS is: if the requested shared resource is idle, it sets the current requesting thread as the active worker thread and marks the shared resource as locked; if the shared resource is occupied, a blocking, waiting, and wake-up mechanism is needed to ensure proper lock allocation. This mechanism is mainly implemented using a variant of the CLH queue, adding threads that temporarily fail to acquire the lock into the queue.

CLH: Craig, Landin, and Hagersten queue, which is a singly-linked list. The queue in AQS is a CLH-variant virtual doubly-linked queue (FIFO). AQS implements lock allocation by encapsulating each thread requesting the shared resource into a node.

The main principle diagram is as follows:

![](/media/jg/ext/p0.meituan.net/travelcube/7132e4cef44c26f62835b197b239147b18062-bb51f9e2.png)

AQS uses a `volatile` `int` member variable to represent synchronization state, performs queuing for resource acquisition through a built-in FIFO queue, and updates the `State` value via CAS.

#### 2.1.1 AQS Data Structure

First, let's look at the most fundamental data structure in AQS—`Node`. `Node` is a node in the CLH-variant queue mentioned above.

![](/media/jg/ext/p1.meituan.net/travelcube/960271cf2b5c8a185eed23e98b72c75538637-2bc2c0fe.png)

Let's explain the meaning of several methods and attribute values:

| Method / Attribute | Meaning |
| :--- | :--- |
| `waitStatus` | Status of the current node in the queue |
| `thread` | Represents the thread associated with this node |
| `prev` | Predecessor pointer |
| `predecessor` | Returns the predecessor node; throws NPE if none exists |
| `nextWaiter` | Points to the next node in the `CONDITION` state (since this article does not cover the Condition Queue, this pointer will not be discussed further) |
| `next` | Successor pointer |

The two lock modes for threads:

| Mode | Meaning |
| :--- | :--- |
| `SHARED` | Indicates that the thread is waiting for the lock in shared mode |
| `EXCLUSIVE` | Indicates that the thread is waiting for the lock in exclusive mode |

`waitStatus` has the following enum values:

| Enum Value | Meaning |
| :--- | :--- |
| `0` | Default value when a `Node` is initialized |
| `CANCELLED` | Value `1`, indicating that the thread's lock acquisition request has been cancelled |
| `CONDITION` | Value `-2`, indicating that the node is in the condition wait queue and its thread is waiting to be woken up |
| `PROPAGATE` | Value `-3`, used only when the current thread is in `SHARED` mode |
| `SIGNAL` | Value `-1`, indicating that the thread is ready and waiting for the resource to be released |

#### 2.1.2 Synchronization State (`State`)

After understanding the data structure, let's look at the synchronization state of AQS—`State`. AQS maintains a field named `state`, meaning synchronization state, modified with `volatile`, which represents the current locking status of the critical resource.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private volatile int state;
```

Several methods are provided below to access this field:

| Method Signature | Description |
| :--- | :--- |
| `protected final int getState()` | Gets the value of `State` |
| `protected final void setState(int newState)` | Sets the value of `State` |
| `protected final boolean compareAndSetState(int expect, int update)` | Updates `State` using CAS |

All these methods are modified with `final`, meaning subclasses cannot override them. We can implement multi-threaded exclusive mode and shared mode (the locking process) by modifying the synchronization state represented by the `State` field.

![](/media/jg/ext/p0.meituan.net/travelcube/27605d483e8935da683a93be015713f331378-8678d705.png)

![](/media/jg/ext/p0.meituan.net/travelcube/3f1e1a44f5b7d77000ba4f9476189b2e32806-0dee12a2.png)

For our custom synchronization tools, we need to customize how synchronization state is acquired and released, which corresponds to the first layer in the AQS architecture diagram: the API layer.

### 2.2 Important AQS Methods and Their Connection to ReentrantLock

From the architecture diagram, we can see that AQS provides a large number of `protected` methods for implementing custom synchronizers. The methods implemented by a custom synchronizer simply modify the `State` field to achieve multi-threaded exclusive mode or shared mode. A custom synchronizer needs to implement the following methods (the ones `ReentrantLock` needs to implement are included below, though not necessarily all of them):

| Method Signature | Description |
| :--- | :--- |
| `protected boolean isHeldExclusively()` | Whether the current thread is exclusively holding the resource. Only needs to be implemented when `Condition` is used. |
| `protected boolean tryAcquire(int arg)` | Exclusive mode. `arg` is the number of lock acquisitions; attempts to acquire the resource, returning `True` on success and `False` on failure. |
| `protected boolean tryRelease(int arg)` | Exclusive mode. `arg` is the number of lock releases; attempts to release the resource, returning `True` on success and `False` on failure. |
| `protected int tryAcquireShared(int arg)` | Shared mode. `arg` is the number of acquisitions; attempts to acquire the resource. Negative means failure; `0` means success with no remaining available resources; positive means success with remaining resources. |
| `protected boolean tryReleaseShared(int arg)` | Shared mode. `arg` is the number of releases; attempts to release the resource. Returns `True` if waking subsequent waiting nodes is allowed after release; otherwise returns `False`. |

Generally speaking, a custom synchronizer uses either exclusive mode or shared mode, so it only needs to implement one pair: `tryAcquire`–`tryRelease` or `tryAcquireShared`–`tryReleaseShared`. AQS also supports custom synchronizers implementing both exclusive and shared modes simultaneously, such as `ReentrantReadWriteLock`. `ReentrantLock` is an exclusive lock, so it implements `tryAcquire`–`tryRelease`.

Taking the Non-fair Lock as an example, here we mainly explain the connection points between the methods of `NonfairSync` and AQS. The exact role of each core method will be explained in detail later in the article.

![](/media/jg/ext/p1.meituan.net/travelcube/b8b53a70984668bc68653efe9531573e78636-42bbd33b.png)

> 🐛 Correction (see: [issue#1761](https://github.com/Snailclimb/JavaGuide/issues/1761)): There is a minor error in the diagram: after `(AQS) CAS` modifies the shared resource `State` successfully, it should mean lock acquisition succeeded (for the non-fair lock).
>
> The corresponding source code is as follows:
>
> ```java
> final boolean nonfairTryAcquire(int acquires) {
>          final Thread current = Thread.currentThread();// Get the current thread
>          int c = getState();
>          if (c == 0) {
>              if (compareAndSetState(0, acquires)) {// Compete for the lock via CAS
>                  setExclusiveOwnerThread(current);// Set the current thread as the exclusive owner thread
>                  return true;// Lock acquired successfully
>              }
>          }
>          else if (current == getExclusiveOwnerThread()) {
>              int nextc = c + acquires;
>              if (nextc < 0) // overflow
>                  throw new Error("Maximum lock count exceeded");
>              setState(nextc);
>              return true;
>          }
>          return false;
>      }
> ```

To help everyone understand the interaction process of methods between `ReentrantLock` and AQS, using the Non-fair Lock as an example, we isolate and highlight the locking and unlocking interaction flows to facilitate understanding of the subsequent content.

![](/media/jg/ext/p1.meituan.net/travelcube/7aadb272069d871bdee8bf3a218eed8136919-734aa4af.png)

Locking:

- Locking is performed through `ReentrantLock`'s `Lock` method.
- It calls the `Lock` method of the inner class `Sync`. Since `Sync#lock` is an abstract method, depending on whether `ReentrantLock` was initialized as a Fair Lock or Non-fair Lock, the `Lock` method of the corresponding inner class is executed; essentially, both execute AQS's `Acquire` method.
- AQS's `Acquire` method calls the `tryAcquire` method. Since `tryAcquire` must be implemented by the custom synchronizer, the `tryAcquire` method in `ReentrantLock` is executed. Because `ReentrantLock` implements `tryAcquire` via its Fair Lock and Non-fair Lock inner classes, different `tryAcquire` implementations are executed depending on the lock type.
- `tryAcquire` is the lock-acquisition logic. If acquisition fails, the subsequent logic of the AQS framework executes, which is independent of `ReentrantLock`'s custom synchronizer.

Unlocking:

- Unlocking is performed through `ReentrantLock`'s `Unlock` method.
- `Unlock` calls the `Release` method of the inner class `Sync`, which is inherited from AQS.
- `Release` calls `tryRelease`. `tryRelease` must be implemented by the custom synchronizer, and `tryRelease` is implemented only in `Sync` inside `ReentrantLock`. Therefore, we can see that the lock-release process does not distinguish between Fair Locks and Non-fair Locks.
- After release succeeds, all remaining handling is completed by the AQS framework, independent of the custom synchronizer.

From the description above, we can roughly summarize the mapping between core API-layer methods during `ReentrantLock` locking and unlocking.

![](/media/jg/ext/p0.meituan.net/travelcube/f30c631c8ebbf820d3e8fcb6eee3c0ef18748-fdbdf51e.png)

## 3 Understanding AQS Through ReentrantLock

In `ReentrantLock`, Fair Locks and Non-fair Locks share the same underlying foundation; here we use the Non-fair Lock as an example for analysis.

In the Non-fair Lock, there is a piece of code like this:

```java
// java.util.concurrent.locks.ReentrantLock

static final class NonfairSync extends Sync {
  ...
  final void lock() {
    if (compareAndSetState(0, 1))
      setExclusiveOwnerThread(Thread.currentThread());
    else
      acquire(1);
  }
  ...
}
```

Let's see how this `Acquire` method is written:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final void acquire(int arg) {
  if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
    selfInterrupt();
}
```

Let's also look at the `tryAcquire` method:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

protected boolean tryAcquire(int arg) {
  throw new UnsupportedOperationException();
}
```

As we can see, this is only a placeholder implementation in AQS; the specific lock-acquisition logic is implemented separately by the respective Fair Lock and Non-fair Lock (taking `ReentrantLock` as an example). If this method returns `True`, it means the current thread has succeeded in acquiring the lock, and nothing further needs to execute; if acquisition fails, the thread must be added to the wait queue. Below we will explain in detail when and how a thread is added to the wait queue.

### 3.1 Adding a Thread to the Wait Queue

#### 3.1.1 When It Joins the Queue

When `Acquire(1)` is executed, it tries to acquire the lock via `tryAcquire`. In this situation, if lock acquisition fails, `addWaiter` is called to add the thread into the wait queue.

#### 3.1.2 How It Joins the Queue

After failing to acquire the lock, `addWaiter(Node.EXCLUSIVE)` is executed to join the wait queue. Its implementation is as follows:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private Node addWaiter(Node mode) {
  Node node = new Node(Thread.currentThread(), mode);
  // Try the fast path of enq; backup to full enq on failure
  Node pred = tail;
  if (pred != null) {
    node.prev = pred;
    if (compareAndSetTail(pred, node)) {
      pred.next = node;
      return node;
    }
  }
  enq(node);
  return node;
}
private final boolean compareAndSetTail(Node expect, Node update) {
  return unsafe.compareAndSwapObject(this, tailOffset, expect, update);
}
```

The main flow is as follows:

- Create a new node using the current thread and lock mode.
- The `Pred` pointer points to the tail node `Tail`.
- Point the `Prev` pointer of the new `Node` to `Pred`.
- Complete setting the tail node via `compareAndSetTail`. This method mainly compares `tailOffset` against `Expect`; if the `Node` at `tailOffset` and the `Expect` `Node` have the same address, then `Tail` is set to the value of `Update`.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

static {
  try {
    stateOffset = unsafe.objectFieldOffset(AbstractQueuedSynchronizer.class.getDeclaredField("state"));
    headOffset = unsafe.objectFieldOffset(AbstractQueuedSynchronizer.class.getDeclaredField("head"));
    tailOffset = unsafe.objectFieldOffset(AbstractQueuedSynchronizer.class.getDeclaredField("tail"));
    waitStatusOffset = unsafe.objectFieldOffset(Node.class.getDeclaredField("waitStatus"));
    nextOffset = unsafe.objectFieldOffset(Node.class.getDeclaredField("next"));
  } catch (Exception ex) {
    throw new Error(ex);
  }
}
```

From AQS's static initializer block, we can see that all of them obtain the memory offset of an object's field relative to that object, so we can locate that field in object memory using this offset. `tailOffset` refers to the offset corresponding to `tail`, so at this point the newly created `Node` is set as the tail node of the current queue. At the same time, because it is a doubly-linked list, the previous node also needs to point to the tail node.

- If the `Pred` pointer is `Null` (indicating there are no elements in the wait queue), or if the current `Pred` pointer and `Tail` point to different locations (indicating it was already modified by another thread), we need to look at the `Enq` method.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private Node enq(final Node node) {
  for (;;) {
    Node t = tail;
    if (t == null) { // Must initialize
      if (compareAndSetHead(new Node()))
        tail = head;
    } else {
      node.prev = t;
      if (compareAndSetTail(t, node)) {
        t.next = node;
        return t;
      }
    }
  }
}
```

If it has not been initialized, a head node must be initialized. Note, however, that the initialized head node is not the current thread's node, but rather a node created by calling the no-arg constructor. If it has already undergone initialization or concurrency resulted in elements in the queue, it proceeds the same way as before. In fact, `addWaiter` is simply an operation that appends a tail node to a doubly-linked list; keep in mind that the head node of the doubly-linked list is a dummy head node created with the no-arg constructor.

To summarize, when threads acquire a lock, the process generally goes as follows:

1. When no thread holds the lock, Thread 1 acquires the lock successfully.

2. Thread 2 requests the lock, but the lock is currently occupied by Thread 1.

![img](/media/jg/ext/p0.meituan.net/travelcube/e9e385c3c68f62c67c8d62ab0adb613921117-35a65eeb.png)

3. If more threads try to acquire the lock later, they simply line up in order behind it in the queue.

Returning to the earlier code, `hasQueuedPredecessors` is the method used by a Fair Lock during acquisition to check whether any valid nodes exist in the wait queue. If it returns `False`, the current thread may contend for the shared resource; if it returns `True`, there are valid nodes in the queue, and the current thread must join the wait queue.

```java
// java.util.concurrent.locks.ReentrantLock

public final boolean hasQueuedPredecessors() {
  // The correctness of this depends on head being initialized
  // before tail and on head.next being accurate if the current
  // thread is first in queue.
  Node t = tail; // Read fields in reverse initialization order
  Node h = head;
  Node s;
  return h != t && ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

Seeing this, let's understand `h != t && ((s = h.next) == null || s.thread != Thread.currentThread());`: why does it check the node after the head node? What data is stored in the first node?

> In the doubly-linked list, the first node is a dummy node that actually stores no information and serves only as a placeholder. The real first node holding data starts from the second node. When `h != t`: if `(s = h.next) == null`, another thread is currently initializing the wait queue, and has only progressed to the point where `Tail` points to `Head` without `Head` pointing to `Tail`; at this time there is an element in the queue, so it needs to return `True` (see the code analysis below for details). If `(s = h.next) != null`, there is at least one valid node in the queue at this time. If `s.thread == Thread.currentThread()`, it means the thread in the first valid node of the wait queue is the same as the current thread, so the current thread can acquire the resource; if `s.thread != Thread.currentThread()`, it means the thread in the first valid node of the wait queue is different from the current thread, so the current thread must join the wait queue.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer#enq

if (t == null) { // Must initialize
  if (compareAndSetHead(new Node()))
    tail = head;
} else {
  node.prev = t;
  if (compareAndSetTail(t, node)) {
    t.next = node;
    return t;
  }
}
```

Node enqueueing is not an atomic operation, so a brief state where `head != tail` can occur: at that moment `Tail` points to the last node, and `Tail` points to `Head`. If `Head` does not point to `Tail` (see lines 5, 6, and 7), in this case the relevant thread also needs to be added to the queue. Thus, this piece of code is designed to solve concurrency issues under extreme conditions.

#### 3.1.3 When Threads in the Wait Queue Leave the Queue

Returning to the initial source code:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final void acquire(int arg) {
  if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
    selfInterrupt();
}
```

We explained the `addWaiter` method above, which essentially inserts the corresponding thread into the doubly-linked queue in the form of a `Node` data structure and returns a `Node` containing that thread. This `Node` is then passed as an argument into the `acquireQueued` method. `acquireQueued` performs the "lock acquisition" operation for threads waiting in the queue.

Overall, after failing to acquire a lock, a thread is placed into the wait queue, and `acquireQueued` makes it continuously wait and attempt to acquire the lock until it succeeds. `acquire(int)` is a non-interruptible acquisition method: if an interrupt occurs during waiting, it first records the interrupt status and restores it via `selfInterrupt()` after successfully acquiring the lock, rather than cancelling the acquisition because of the interrupt.

Below, we analyze the `acquireQueued` source code from two perspectives: "When does it leave the queue?" and "How does it leave the queue?":

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

final boolean acquireQueued(final Node node, int arg) {
  // Flag indicating whether the resource was successfully acquired
  boolean failed = true;
  try {
    // Flag indicating whether an interrupt occurred while waiting
    boolean interrupted = false;
    // Start spinning: either acquire the lock or get interrupted
    for (;;) {
      // Get the predecessor node of the current node
      final Node p = node.predecessor();
      // If p is the head node, the current node is at the front of the real data queue, so try to acquire the lock (remember the head node is a dummy node)
      if (p == head && tryAcquire(arg)) {
        // Lock acquired successfully; move the head pointer to the current node
        setHead(node);
        p.next = null; // help GC
        failed = false;
        return interrupted;
      }
      // This means either p is the head node and the lock wasn't acquired (possibly preempted under non-fair locking) or p is not the head node; now check whether the current node should be blocked (blocking condition: predecessor's waitStatus is -1) to avoid wasting resources in an infinite loop. The two methods are analyzed in detail below
      if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
        interrupted = true;
    }
  } finally {
    if (failed)
      cancelAcquire(node);
  }
}
```

Note: The `setHead` method turns the current node into a dummy node, but does not modify `waitStatus` because it is data that will still be needed continuously.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private void setHead(Node node) {
  head = node;
  node.thread = null;
  node.prev = null;
}

// java.util.concurrent.locks.AbstractQueuedSynchronizer

// Determine whether the current thread should be blocked based on its predecessor node
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
  // Get the node status of the predecessor node
  int ws = pred.waitStatus;
  // Indicates that the predecessor node is in a state ready to wake up its successor
  if (ws == Node.SIGNAL)
    return true;
  // From the enum values, we know waitStatus > 0 represents the cancelled state
  if (ws > 0) {
    do {
      // Loop backward to find cancelled nodes and remove them from the queue
      node.prev = pred = pred.prev;
    } while (pred.waitStatus > 0);
    pred.next = node;
  } else {
    // Set the predecessor node's waitStatus to SIGNAL
    compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
  }
  return false;
}
```

`parkAndCheckInterrupt` is mainly used to suspend the current thread, block the call stack, and return the interrupt status of the current thread.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    return Thread.interrupted();
}
```

The flowchart of the methods above is as follows:

![](/media/jg/ext/p0.meituan.net/travelcube/c124b76dcbefb9bdc778458064703d1135485-14478dce.png)

From the diagram above, we can see that the condition for breaking out of the current loop is when "the predecessor node is the head node, and the current thread successfully acquires the lock." To prevent CPU resources from being wasted by an infinite spin loop, we check the status of the predecessor node to decide whether to suspend the current thread. The exact suspension flow is shown in the flowchart below (`shouldParkAfterFailedAcquire` flow):

![](/media/jg/ext/p0.meituan.net/travelcube/9af16e2481ad85f38ca322a225ae737535740-19e9ad5b.png)

Now that the questions about removing nodes from the queue are cleared up, new questions arise:

- How are cancelled nodes in `shouldParkAfterFailedAcquire` generated? When is a node's `waitStatus` set to `-1`?
- At what point is a node released and the suspended thread notified?

### 3.2 Generation of `CANCELLED` State Nodes

The `Finally` code in the `acquireQueued` method:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

final boolean acquireQueued(final Node node, int arg) {
  boolean failed = true;
  try {
    ...
    for (;;) {
      final Node p = node.predecessor();
      if (p == head && tryAcquire(arg)) {
        ...
        failed = false;
        ...
      }
      ...
  } finally {
    if (failed)
      cancelAcquire(node);
    }
}
```

Through the `cancelAcquire` method, the status of `Node` is marked as `CANCELLED`. Next, let's analyze the principle of this method line by line:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private void cancelAcquire(Node node) {
  // Filter out invalid nodes
  if (node == null)
    return;
  // Set this node to have no associated thread, i.e., make it a dummy node
  node.thread = null;
  Node pred = node.prev;
  // Skip cancelled nodes by traversing predecessor nodes
  while (pred.waitStatus > 0)
    node.prev = pred = pred.prev;
  // Get the successor node of the filtered predecessor node
  Node predNext = pred.next;
  // Set the current node's status to CANCELLED
  node.waitStatus = Node.CANCELLED;
  // If the current node is the tail node, set the first non-cancelled node from back to front as the tail node
  // If the update fails, enter else; if the update succeeds, set the tail's next node to null
  if (node == tail && compareAndSetTail(node, pred)) {
    compareAndSetNext(pred, predNext, null);
  } else {
    int ws;
    // If the current node is not the successor of head: 1) check whether the predecessor's status is SIGNAL; 2) if not, try setting the predecessor to SIGNAL and check if it succeeds
    // If either 1 or 2 is true, then check whether the predecessor node's thread is not null
    // If all conditions above are met, point the current node's predecessor's next pointer to the current node's successor
    if (pred != head && ((ws = pred.waitStatus) == Node.SIGNAL || (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) && pred.thread != null) {
      Node next = node.next;
      if (next != null && next.waitStatus <= 0)
        compareAndSetNext(pred, predNext, next);
    } else {
      // If the current node is the successor of head, or the conditions above are not met, wake up the successor of the current node
      unparkSuccessor(node);
    }
    node.next = node; // help GC
  }
}
```

The current flow:

- Get the predecessor of the current node; if the predecessor's status is `CANCELLED`, keep traversing backward until finding the first node with `waitStatus <= 0`, link the found `Pred` node with the current `Node`, and set the current `Node` to `CANCELLED`.
- Depending on the position of the current node, consider the following three cases:

(1) The current node is the tail node.

(2) The current node is the successor of `Head`.

(3) The current node is neither the successor of `Head` nor the tail node.

Based on the second bullet above, let's analyze the flow for each case.

The current node is the tail node.

![](/media/jg/ext/p1.meituan.net/travelcube/b845211ced57561c24f79d56194949e822049-e5269cbd.png)

The current node is the successor of `Head`.

![](/media/jg/ext/p1.meituan.net/travelcube/ab89bfec875846e5028a4f8fead32b7117975-19128a86.png)

The current node is neither the successor of `Head` nor the tail node.

![](/media/jg/ext/p0.meituan.net/travelcube/45d0d9e4a6897eddadc4397cf53d6cd522452-b7756457.png)

Through the flow above, we now have a general understanding of how `CANCELLED` node state is generated and changes. However, why do all the changes manipulate the `Next` pointer instead of the `Prev` pointer? Under what circumstances is the `Prev` pointer modified?

> When `cancelAcquire` executes, the predecessor of the current node may have already left the queue (having already executed the `shouldParkAfterFailedAcquire` method in the `Try` block). Modifying the `Prev` pointer at this time could cause `Prev` to point to another `Node` that has already been removed from the queue, so changing the `Prev` pointer here is unsafe. In the `shouldParkAfterFailedAcquire` method, the following code is executed, which actually handles the `Prev` pointer. `shouldParkAfterFailedAcquire` is only executed when lock acquisition fails; entering this method means the shared resource has already been acquired by someone else, and the nodes preceding the current node will not change, so modifying the `Prev` pointer at that time is relatively safe.
>
> ```java
> do {
>   node.prev = pred = pred.prev;
> } while (pred.waitStatus > 0);
> ```

### 3.3 How Unlocking Works

We have already dissected the basic flow during locking; next, let's analyze the basic flow of unlocking. Since `ReentrantLock` does not distinguish between Fair Locks and Non-fair Locks when unlocking, we can look directly at the unlocking source code:

```java
// java.util.concurrent.locks.ReentrantLock

public void unlock() {
  sync.release(1);
}
```

As we can see, the actual place where the lock is released is handled by the framework.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final boolean release(int arg) {
  if (tryRelease(arg)) {
    Node h = head;
    if (h != null && h.waitStatus != 0)
      unparkSuccessor(h);
    return true;
  }
  return false;
}
```

`Sync`, the superclass of both the Fair Lock and Non-fair Lock inside `ReentrantLock`, defines the lock-release mechanism for the reentrant lock.

```java
// java.util.concurrent.locks.ReentrantLock.Sync

// Returns whether the current lock is no longer held by any thread
protected final boolean tryRelease(int releases) {
  // Decrease the reentrant count
  int c = getState() - releases;
  // Throw an exception if the current thread is not the thread holding the lock
  if (Thread.currentThread() != getExclusiveOwnerThread())
    throw new IllegalMonitorStateException();
  boolean free = false;
  // If all holds by the thread are released, set the current exclusive owner thread to null and update state
  if (c == 0) {
    free = true;
    setExclusiveOwnerThread(null);
  }
  setState(c);
  return free;
}
```

Let's explain the source code below:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final boolean release(int arg) {
  // If the custom tryRelease above returns true, it means the lock is not held by any thread
  if (tryRelease(arg)) {
    // Get the head node
    Node h = head;
    // If the head node is not null and its waitStatus is not the initial node state, unpark the suspended thread
    if (h != null && h.waitStatus != 0)
      unparkSuccessor(h);
    return true;
  }
  return false;
}
```

Why is the condition check here `h != null && h.waitStatus != 0`?

> `h == null`: `Head` has not been initialized yet. Initially `head == null`; when the first node enters the queue, `Head` is initialized as a dummy node. So if no thread has managed to enqueue yet, `head == null` will occur.
>
> `h != null && waitStatus == 0`: indicates that the thread corresponding to the successor node is still running and does not need to be woken up.
>
> `h != null && waitStatus < 0`: indicates that the successor node may be blocked and needs to be woken up.

Let's look at the `unparkSuccessor` method as well:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private void unparkSuccessor(Node node) {
  // Get the waitStatus of the head node
  int ws = node.waitStatus;
  if (ws < 0)
    compareAndSetWaitStatus(node, ws, 0);
  // Get the next node of the current node
  Node s = node.next;
  // If the next node is null or cancelled, find the earliest non-cancelled node in the queue
  if (s == null || s.waitStatus > 0) {
    s = null;
    // Start searching from the tail node toward the head to find the first node in the queue with waitStatus < 0.
    for (Node t = tail; t != null && t != node; t = t.prev)
      if (t.waitStatus <= 0)
        s = t;
  }
  // If the next node is not null and its status <= 0, unpark that node's thread
  if (s != null)
    LockSupport.unpark(s.thread);
}
```

Why does it search from back to front for the first non-`Cancelled` node? Here is the reason.

The earlier `addWaiter` method:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private Node addWaiter(Node mode) {
  Node node = new Node(Thread.currentThread(), mode);
  // Try the fast path of enq; backup to full enq on failure
  Node pred = tail;
  if (pred != null) {
    node.prev = pred;
    if (compareAndSetTail(pred, node)) {
      pred.next = node;
      return node;
    }
  }
  enq(node);
  return node;
}
```

As we can see here, node enqueueing is not an atomic operation. That is, `node.prev = pred; compareAndSetTail(pred, node)` can be viewed as the atomic operation for `Tail` enqueueing, while `pred.next = node;` has not executed yet at that instant. If `unparkSuccessor` executes right then, it would be impossible to traverse from front to back, so it must search from back to front. Another reason is that when a `CANCELLED` node is produced, the `Next` pointer is unlinked first while the `Prev` pointer is not unlinked; therefore, traversing from back to front is also necessary to traverse all `Node`s.

In summary, searching from front to back might fail to traverse all nodes due to the non-atomic enqueueing operation in edge cases and the unlinking of `Next` pointers when `CANCELLED` nodes are created. Thus, after waking up the corresponding thread, that thread continues executing downward. After continuing inside the `acquireQueued` method, how are interrupts handled?

### 3.4 Execution Flow After Resuming from an Interrupt

After waking up, `return Thread.interrupted();` is executed; this function returns the interrupt status of the currently executing thread and clears it.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private final boolean parkAndCheckInterrupt() {
  LockSupport.park(this);
  return Thread.interrupted();
}
```

Returning to the `acquireQueued` code, whether `parkAndCheckInterrupt` returns `True` or `False`, the value of `interrupted` differs, but both execute the next loop iteration. If lock acquisition succeeds at this point, the current `interrupted` value is returned.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

final boolean acquireQueued(final Node node, int arg) {
  boolean failed = true;
  try {
    boolean interrupted = false;
    for (;;) {
      final Node p = node.predecessor();
      if (p == head && tryAcquire(arg)) {
        setHead(node);
        p.next = null; // help GC
        failed = false;
        return interrupted;
      }
      if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
        interrupted = true;
      }
  } finally {
    if (failed)
      cancelAcquire(node);
  }
}
```

If `acquireQueued` returns `True`, the `selfInterrupt` method will be executed.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

static void selfInterrupt() {
  Thread.currentThread().interrupt();
}
```

This method is meant to interrupt the thread. But why interrupt the thread after already acquiring the lock? This belongs to Java's cooperative interruption mechanism, which interested readers can look up further. Here is a brief explanation:

1. When an interrupted thread is woken up, it does not know the reason it was woken up—it might have been interrupted while waiting, or woken up after the lock was released. Therefore, we check the interrupt flag using `Thread.interrupted()` (which returns the current thread's interrupt status and sets the interrupt flag to `False`) and record it; if we find that the thread was interrupted, we interrupt it once more afterward.
2. When a thread is woken up while waiting for a resource, after waking up it still continuously tries to acquire the lock until it gets the lock. That is, throughout the entire process, it does not respond to interrupts immediately—it only records the interrupt history. Finally, once it acquires the lock and returns, if it was interrupted earlier, a supplemental interrupt is issued.

This handling approach is also used in `runWorker` of `Worker`, the basic execution unit in a thread pool, which performs additional checks via `Thread.interrupted()`; interested readers can inspect the `ThreadPoolExecutor` source code.

### 3.5 Summary

We raised several questions in Section 1.3; let's answer them now.

> Q: What is the subsequent flow when a thread fails to acquire the lock?
>
> A: There exists a queuing and waiting mechanism where the thread continues waiting, retains the possibility of acquiring the lock, and the lock acquisition flow continues.
>
> Q: Since there is a queuing and waiting mechanism, some kind of queue must be formed. What data structure is this queue?
>
> A: It is a CLH-variant FIFO double-ended queue.
>
> Q: When does a thread in the queuing and waiting mechanism get a chance to acquire the lock?
>
> A: You can check Section 2.3.1.3 for details.
>
> Q: If a thread in the queuing and waiting mechanism remains unable to acquire the lock, does it have to wait forever, or is there another strategy to solve this problem?
>
> A: The state of the node where the thread resides becomes `CANCELLED`, and cancelled nodes are released from the queue; see Section 2.3.2 for details.
>
> Q: The `Lock` function acquires the lock via the `Acquire` method, but how exactly does it acquire the lock?
>
> A: AQS's `Acquire` calls the `tryAcquire` method, and `tryAcquire` is implemented by each custom synchronizer, completing the lock-acquisition process through `tryAcquire`.

## 4 AQS Applications

### 4.1 Reentrant Application in ReentrantLock

The reentrancy of `ReentrantLock` is one of the prime applications of AQS. After understanding the concepts above, it is easy to see how `ReentrantLock` implements reentrancy. Inside `ReentrantLock`, both the Fair Lock and the Non-fair Lock contain a specific piece of logic.

Fair Lock:

```java
// java.util.concurrent.locks.ReentrantLock.FairSync#tryAcquire

if (c == 0) {
  if (!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {
    setExclusiveOwnerThread(current);
    return true;
  }
}
else if (current == getExclusiveOwnerThread()) {
  int nextc = c + acquires;
  if (nextc < 0)
    throw new Error("Maximum lock count exceeded");
  setState(nextc);
  return true;
}
```

Non-fair Lock:

```java
// java.util.concurrent.locks.ReentrantLock.Sync#nonfairTryAcquire

if (c == 0) {
  if (compareAndSetState(0, acquires)){
    setExclusiveOwnerThread(current);
    return true;
  }
}
else if (current == getExclusiveOwnerThread()) {
  int nextc = c + acquires;
  if (nextc < 0) // overflow
    throw new Error("Maximum lock count exceeded");
  setState(nextc);
  return true;
}
```

From both snippets above, we can see that there is a synchronization state `State` controlling the overall reentrant behavior. `State` is modified with `volatile` to guarantee visibility and ordering.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private volatile int state;
```

Next, let's look at the main lifecycle of the `State` field:

1. When `State` is initialized, its value is `0`, indicating that no thread holds the lock.
2. When a thread holds the lock, the value increments by `+1` on top of its existing value; when the same thread acquires the lock multiple times, it increments by `+1` multiple times—this is the concept of reentrancy.
3. Unlocking likewise decrements this field by `-1` until it reaches `0`, at which point the thread releases the lock.

### 4.2 Application Scenarios in JUC

In addition to `ReentrantLock`'s reentrant application above, AQS, as a framework for concurrent programming, provides solid solutions for many other synchronization utilities. Below are several synchronization utilities in JUC, briefly introducing how AQS is applied:

| Synchronization Utility | Relationship Between the Utility and AQS |
| :--- | :--- |
| `ReentrantLock` | Uses AQS to store the number of times the lock is repeatedly held. When a thread acquires the lock, `ReentrantLock` records the identifier of the thread currently holding the lock to detect repeated acquisitions and handle exceptional cases when the wrong thread attempts to unlock. |
| `Semaphore` | Uses the AQS synchronization state to store the current permit count of the semaphore. `tryRelease` increases the count, and `acquireShared` decreases the count. |
| `CountDownLatch` | Uses the AQS synchronization state to represent the count. Only when the count reaches `0` can all `Acquire` operations (`CountDownLatch`'s `await` method) proceed. |
| `ReentrantReadWriteLock` | Uses 16 bits of the AQS synchronization state to store the hold count of the write lock, and the remaining 16 bits to store the hold count of the read lock. |
| `ThreadPoolExecutor` | `Worker` uses the AQS synchronization state to implement setting the exclusive owner thread variable (`tryAcquire` and `tryRelease`). |

### 4.3 Custom Synchronization Utility

After understanding the basic principles of AQS, let's implement a synchronization utility ourselves following the AQS concepts described above.

```java
public class LeeLock  {

    private static class Sync extends AbstractQueuedSynchronizer {
        @Override
        protected boolean tryAcquire (int arg) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }

        @Override
        protected boolean tryRelease (int arg) {
            if (getState() == 0 || getExclusiveOwnerThread() != Thread.currentThread()) {
                throw new IllegalMonitorStateException();
            }
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }

        @Override
        protected boolean isHeldExclusively () {
            return getState() == 1 && getExclusiveOwnerThread() == Thread.currentThread();
        }
    }

    private final Sync sync = new Sync();

    public void lock () {
        sync.acquire(1);
    }

    public void unlock () {
        sync.release(1);
    }
}
```

Let's achieve synchronization functionality using the `Lock` we defined ourselves.

```java
public class LeeMain {

    static int count = 0;
    static LeeLock leeLock = new LeeLock();

    public static void main (String[] args) throws InterruptedException {

        Runnable runnable = new Runnable() {
            @Override
            public void run () {
                try {
                    leeLock.lock();
                    for (int i = 0; i < 10000; i++) {
                        count++;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    leeLock.unlock();
                }

            }
        };
        Thread thread1 = new Thread(runnable);
        Thread thread2 = new Thread(runnable);
        thread1.start();
        thread2.start();
        thread1.join();
        thread2.join();
        System.out.println(count);
    }
}
```

The code above will output `20000` on every run. Achieving synchronization functionality with just a few lines of code—that is the power of AQS.

## 5 Summary

In daily development we encounter concurrency scenarios constantly, yet relatively few people understand the underlying framework principles behind concurrency. Due to space limitations, this article only introduced the principles of the reentrant lock `ReentrantLock` and AQS; we hope it can serve as a stepping stone for everyone to understand AQS, `ReentrantLock`, and other synchronizers.

## References

- Lea D. The java. util. concurrent synchronizer framework\[J]. Science of Computer Programming, 2005, 58(3): 293-309.
- *Java Concurrency in Practice*
- [Everything You Need to Know About Java "Locks"](https://tech.meituan.com/2018/11/15/java-lock.html)
