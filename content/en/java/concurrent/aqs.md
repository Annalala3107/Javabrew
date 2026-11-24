---
title: AQS In-Depth Analysis
description: "Deep dive into AQS (AbstractQueuedSynchronizer): core principles, CLH queue structure, exclusive and shared lock implementations, synchronizers such as ReentrantLock and Semaphore, and thread blocking and wakeup mechanisms."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/aqs.md
head:
  - - meta
    - name: keywords
      content: AQS,AbstractQueuedSynchronizer,queued synchronizer,exclusive lock,shared lock,CLH queue,ReentrantLock implementation principles
---

<!-- markdownlint-disable MD024 -->

## Introduction to AQS

AQS stands for `AbstractQueuedSynchronizer`, which literally means Abstract Queued Synchronizer. This class resides in the `java.util.concurrent.locks` package.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/AQS-10959fb3.png)

AQS is an abstract class primarily used to build locks and synchronizers.

```java
public abstract class AbstractQueuedSynchronizer extends AbstractOwnableSynchronizer implements java.io.Serializable {
}
```

AQS provides implementations of common functionality for building locks and synchronizers. As a result, AQS makes it simple and efficient to construct a wide variety of widely used synchronizers, such as `ReentrantLock`, `Semaphore`, `ReentrantReadWriteLock`, and more. Although `SynchronousQueue` also uses a wait queue and CAS to pair threads, it is not based on AQS.

## AQS Principles

> Note: The AQS source code and node state analysis below are primarily based on JDK 8. AQS's internal implementation has continued to evolve since then: fields and methods covered in this article such as `waitStatus`, `addWaiter()`, and `acquireQueued()` can still be found in JDK 11, whereas in JDK 17 and current versions, node fields as well as enqueueing and waiting implementations have undergone substantial changes. However, the overall design of building synchronizers around synchronization state, a wait queue, and template methods remains unchanged.

In concurrency interviews, candidates are very often asked: "Please explain your understanding of how AQS works." Below is an example for your reference. An interview is not about reciting answers from memory—be sure to incorporate your own understanding, and even if you don't add original insights, make sure you can explain it in plain, accessible terms rather than parroting it word for word.

### Quick Overview of AQS

Before diving directly into the AQS source code, you need a high-level understanding of AQS. Here, we will first examine a few questions to understand AQS holistically and see where it sits within Java concurrency. Once you have that context, studying the AQS source code will make the relationship between synchronizers and AQS much clearer.

#### What Is the Purpose of AQS?

AQS solves the complexity developers face when implementing synchronizers. It provides a general-purpose framework for implementing various synchronizers, such as **reentrant locks** (`ReentrantLock`), **semaphores** (`Semaphore`), and **countdown latches** (`CountDownLatch`). By encapsulating low-level thread synchronization mechanisms, AQS hides complex thread management logic so developers can focus solely on specific synchronization semantics.

Put simply, AQS is an abstract class that provides a general **execution framework** for synchronizers. It defines the **common workflow for acquiring and releasing resources**, while the specific resource-acquisition logic is implemented by concrete synchronizers overriding its template methods. Therefore, AQS can be viewed as the **foundational base** of synchronizers, while specific synchronizers are the **concrete applications** built on top of AQS.

#### Why Does AQS Use a Variant of the CLH Lock Queue?

A CLH lock is an optimized implementation based on **spin locks**.

First, let's look at the problem with spin locks: a spin lock attempts to acquire the lock by having threads repeatedly execute `compareAndSet` (`CAS` for short) operations on an atomic variable. Under high concurrency, multiple threads compete for the same atomic variable simultaneously, which can easily cause a thread's `CAS` operations to fail for a long time, leading to **starvation** (some threads may never acquire the lock).

The CLH lock improves upon spin locks by introducing a queue to organize competing threads:

- Each thread joins the queue as a node and spins while monitoring the state of its predecessor node, rather than competing directly on a shared variable.
- Threads line up in order, ensuring fairness and thereby avoiding the starvation problem.

AQS (`AbstractQueuedSynchronizer`) builds further optimizations on top of the CLH lock to form its internal **CLH queue variant**. There are two main improvements:

1. **Spinning + Blocking**: A CLH lock waits for lock release using pure spinning, but heavy spinning consumes excessive CPU resources. AQS introduces a hybrid **spin + block** mechanism:
   - If a thread fails to acquire the lock, it briefly spins to try acquiring it;
   - If it still fails, the thread enters a blocked state and waits to be woken up, thereby reducing CPU waste.
2. **Changing from a Singly Linked Queue to a Doubly Linked Queue**: A CLH lock uses a singly linked queue where each node only knows about its predecessor's state, whereas when a node releases the lock, it needs to wake up the subsequent node via the queue. AQS turns the queue into a **doubly linked queue** by adding a `next` pointer so that a node not only knows its predecessor, but can also directly wake up its successor, simplifying queue operations and improving wakeup efficiency.

#### Why Does AQS Have Good Performance?

Because AQS makes extensive use of `CAS` operations internally.

AQS uses a queue internally to store waiting thread nodes. Since the queue is a shared resource, synchronized access to the queue must be guaranteed in multithreaded scenarios.

AQS uses `CAS` operations internally to control concurrent access to the queue—specifically, `CAS` is primarily used to ensure thread safety for two operations: `queue initialization` and `thread node enqueueing`. While using `CAS` for concurrency control delivers strong performance, it also introduces relatively high **implementation complexity**.

#### Why Do Node Objects in AQS Need Different States?

The `waitStatus` field in AQS works much like a **state machine**: different states represent different meanings for a `Node`, and transitions between states are driven by different operations.

- State `0`: When a new node joins the queue, its initial state is `0`.

- State `SIGNAL`: When a new node joins the queue, its predecessor's state is updated from `0` to `SIGNAL`, indicating that after the predecessor releases the lock, it must wake up the new node. When waking up the successor of a `SIGNAL` node, the `SIGNAL` state is reset to `0`—that is, clearing the `SIGNAL` state indicates that the wakeup operation has been performed.

- State `CANCELLED`: If a node fails while waiting in the queue to acquire a lock for some reason, its state becomes `CANCELLED`, indicating that it has canceled lock acquisition. A node in this state is abnormal—it can neither be woken up nor wake up its successor.

### Core Idea of AQS

The core idea of AQS is that if the requested shared resource is free, the thread currently requesting the resource is set as the active worker thread, and the shared resource is marked as locked. If the requested shared resource is occupied, a mechanism is needed for blocking waiting threads and allocating the lock when they are woken up. AQS implements this mechanism by further optimizing **CLH locks** (Craig, Landin, and Hagersten locks).

A **CLH lock** improves on spin locks and is a singly linked list-based spin lock. In a multithreaded scenario, threads requesting the lock are organized into a unidirectional queue; each waiting thread spins while polling the state of the previous thread node, and only after the predecessor node releases the lock can the current node acquire it. The queue structure of a **CLH lock** is shown below.

![CLH Lock Queue Structure](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/clh-lock-queue-structure-229709df.png)

The **wait queue** used in AQS is a variant of the CLH lock queue (hereafter referred to as the CLH variant queue).

The CLH variant queue in AQS is a doubly linked queue. Threads that temporarily fail to acquire the lock are added to this queue. There are two main differences between the CLH variant queue and the original CLH lock queue:

- **Optimized from spinning to spinning + blocking**: Spinning offers high performance, but excessive spinning consumes substantial CPU resources. Therefore, in the CLH variant queue, a thread first attempts to acquire the lock by spinning, and if that fails, blocks and waits.
- **Optimized from a unidirectional queue to a doubly linked queue**: In the CLH variant queue, waiting threads are blocked, and when a preceding thread in the queue releases the lock, it needs to wake up the trailing thread. Therefore, a `next` pointer is added, turning it into a doubly linked queue.

AQS encapsulates each thread requesting a shared resource as a node (`Node`) in the CLH variant queue to manage lock allocation. In the CLH variant queue, one node represents one thread and holds a reference to the thread (`thread`), the current node's status in the queue (`waitStatus`), its predecessor node (`prev`), and its successor node (`next`).

The structure of the CLH variant queue in AQS is shown below:

![CLH Variant Queue Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/clh-queue-structure-bianti-877c7ae8.png)

For a detailed explanation of the CLH lock—the core data structure of AQS—we strongly recommend reading [Java AQS Core Data Structure - CLH Lock - Qunar Tech Salon](https://mp.weixin.qq.com/s/jEx-4XhNGOFdCo4Nou5tqg).

Core architecture diagram of AQS (`AbstractQueuedSynchronizer`):

![CLH Variant Queue](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/clh-queue-state-7830440b.png)

AQS uses an **`int` member variable `state` to represent synchronization state**, and uses a built-in **FIFO thread wait queue** to handle the queuing of threads requesting resources.

The `state` variable is modified with `volatile` to represent the current acquisition status of the critical resource. Here, the role of `volatile` is not merely to ensure visibility; more importantly, through the happens-before rule (a write to a `volatile` variable happens-before every subsequent read of that same variable), it prevents compilers and processors from reordering instructions, thereby guaranteeing the correctness of lock semantics.

```java
// Shared variable modified with volatile to guarantee thread visibility and prevent instruction reordering
private volatile int state;
```

In addition, the state information `state` can be accessed and modified via the `protected` methods `getState()`, `setState()`, and `compareAndSetState()`. Moreover, all of these methods are declared `final` and cannot be overridden by subclasses.

```java
// Returns the current value of synchronization state
protected final int getState() {
     return state;
}
 // Sets the value of synchronization state
protected final void setState(int newState) {
     state = newState;
}
// Atomically (via CAS) sets synchronization state to the given update value if the current value equals expect
protected final boolean compareAndSetState(int expect, int update) {
      return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```

Take the reentrant mutex `ReentrantLock` as an example: it internally maintains a `state` variable to represent the lock's occupancy status. The initial value of `state` is 0, indicating that the lock is unlocked. When thread A calls `lock()`, it attempts to exclusively acquire the lock via `tryAcquire()` and increments `state` by 1. If it succeeds, thread A acquires the lock. If it fails, thread A is added to a wait queue (the CLH variant queue) until another thread releases the lock. Assuming thread A acquires the lock successfully, before releasing it, thread A itself can acquire the same lock repeatedly (`state` accumulates). This demonstrates reentrancy: a thread can acquire the same lock multiple times without being blocked. However, this also means that the thread must release the lock the same number of times it acquired it so that `state` returns to 0—that is, returning the lock to the unlocked state. Only then do other waiting threads have a chance to acquire the lock.

The process of thread A attempting to acquire the lock is shown below (image source: [Understanding AQS Principles and Applications from ReentrantLock's Implementation - Meituan Tech Team](./reentrantlock.md)):

![AQS Exclusive Mode Lock Acquisition](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-exclusive-mode-acquire-lock-3dddd84f.png)

As another example, with the countdown latch `CountDownLatch`, `state` can be initialized to `N`, indicating that `N` calls to `countDown()` must be waited on. Here `N` represents the number of events or countdown steps and does not have to match the number of threads; the same thread may call `countDown()` multiple times, or multiple threads may each call it once. When `state` reaches 0, AQS wakes up the threads in the wait queue that are blocked on `await()`, allowing them to continue execution.

### Meanings of Node `waitStatus` States

The `waitStatus` field in AQS acts like a **state machine**: different values represent different meanings for a `Node`, and different operations drive transitions between states.

| Node State  | Value | Meaning                                                                                                                                                                             |
| ----------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CANCELLED` | 1     | Indicates that the thread has canceled lock acquisition. A node transitions to this state if the thread is interrupted or times out while waiting for the resource.                 |
| `SIGNAL`    | -1    | Indicates that the successor node needs to be woken up by the current node. After the current thread's node releases the lock, it must unpark its successor node.                   |
| `CONDITION` | -2    | Indicates that the node is waiting on a `Condition`. Once another thread calls `Condition.signal()`, the node is transferred from the condition queue to the sync queue to wait for the resource. |
| `PROPAGATE` | -3    | Used in shared mode. Under shared mode, a situation may occur where threads in the queue fail to get woken up; `PROPAGATE` was introduced to resolve this issue.                    |
|             | 0     | Initial state of a new node when it joins the queue.                                                                                                                                |

In the AQS source code, `> 0` and `< 0` are frequently used to check `waitStatus`:

If `waitStatus > 0`, it indicates that the node has canceled waiting to acquire the resource.

If `waitStatus < 0`, it indicates that the node is in a normal state—that is, it has not canceled waiting.

Among these, `SIGNAL` is the most important state. The node state transitions and corresponding operations are as follows:

| State Transition | Corresponding Operation                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`              | When a new node is enqueued, its initial state is `0`.                                                                                                                                                  |
| `0 -> SIGNAL`    | When a new node is enqueued, its predecessor node's state is updated from `0` to `SIGNAL`. The `SIGNAL` state indicates that the node's successor needs to be woken up.                                 |
| `SIGNAL -> 0`    | When waking up a successor node, the current node's state must be cleared. This typically happens on the `head` node—for example, updating `head`'s state from `SIGNAL` to `0` indicates its successor has been woken up. |
| `0 -> PROPAGATE` | AQS internally introduced the `PROPAGATE` state to prevent missed wakeups of thread nodes under concurrent scenarios (covered in the shared-mode source code analysis below).                           |

### Custom Synchronizers

Custom synchronizers can be built on top of AQS, which provides 5 template methods (Template Method Pattern). The typical way to build a custom synchronizer is as follows (a classic application of the Template Method Pattern):

1. Have your custom synchronizer extend `AbstractQueuedSynchronizer`.
2. Override the template methods exposed by AQS.

**AQS uses the Template Method Pattern; when creating a custom synchronizer, you override the following hook methods provided by AQS:**

```java
// Exclusive mode. Attempts to acquire the resource; returns true on success, false on failure.
protected boolean tryAcquire(int)
// Exclusive mode. Attempts to release the resource; returns true on success, false on failure.
protected boolean tryRelease(int)
// Shared mode. Attempts to acquire the resource. Negative means failure; 0 means success with no remaining available resource; positive means success with remaining resource.
protected int tryAcquireShared(int)
// Shared mode. Attempts to release the resource; returns true on success, false on failure.
protected boolean tryReleaseShared(int)
// Whether the current thread holds the resource exclusively. Only needs to be implemented when using Condition.
protected boolean isHeldExclusively()
```

**What is a hook method?** A hook method is a method declared in an abstract class—typically modified with `protected`—which can either be an empty method (to be implemented by subclasses) or have a default implementation. The Template Method Pattern controls the execution of fixed steps through hook methods.

Due to space constraints, we will not go into detail on the Template Method Pattern here. If you are not very familiar with it, you can check out this article: [The Template Method Pattern Refactored with Java 8 Is Truly Awesome!](https://mp.weixin.qq.com/s/zpScSCktFpnSWHWIQem2jg).

Aside from the hook methods mentioned above, all other methods in the AQS class are `final` and therefore cannot be overridden by other classes.

### AQS Resource Sharing Modes

AQS defines two resource-sharing modes: `Exclusive` (exclusive—only one thread can execute at a time, such as `ReentrantLock`) and `Share` (shared—multiple threads can execute simultaneously, such as `Semaphore` / `CountDownLatch`).

Generally, a custom synchronizer uses either exclusive mode or shared mode, so it only needs to implement either `tryAcquire-tryRelease` or `tryAcquireShared-tryReleaseShared`. However, AQS also allows a custom synchronizer to implement both exclusive and shared modes simultaneously, as `ReentrantReadWriteLock` does.

### In-Depth Comparison Between Exclusive Mode and Shared Mode

We briefly introduced AQS's two resource-sharing modes above. Next, let's systematically compare exclusive mode and shared mode across several dimensions to gain a deeper understanding of their differences.

#### Feature Comparison

| Comparison Dimension         | Exclusive Mode                                                | Shared Mode                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Concurrency**              | Only one thread can acquire the resource at any given moment  | Multiple threads can acquire the resource simultaneously                                                                                  |
| **Acquisition Entry Point**  | `acquire(int arg)`                                            | `acquireShared(int arg)`                                                                                                                  |
| **Release Entry Point**      | `release(int arg)`                                            | `releaseShared(int arg)`                                                                                                                  |
| **Template Methods**         | `tryAcquire(int)` / `tryRelease(int)`                         | `tryAcquireShared(int)` / `tryReleaseShared(int)`                                                                                         |
| **`tryXxx` Return Value**    | `boolean`, where `true` indicates acquire/release succeeded   | `int` (for acquire): negative means failure, `0` means success with no remaining resource, positive means success with remaining resource; `boolean` (for release) |
| **Waking Successor Nodes**   | Wakes up one successor node when releasing the resource       | After acquiring the resource, if remaining resources exist, continues waking subsequent nodes (propagated wakeup)                         |
| **Node Mode Indicator**      | `Node.EXCLUSIVE` (`null`)                                     | `Node.SHARED` (a static `Node` instance)                                                                                                  |
| **Typical Implementations**  | `ReentrantLock`, write lock of `ReentrantReadWriteLock`       | `Semaphore`, `CountDownLatch`, read lock of `ReentrantReadWriteLock`                                                                      |

#### Semantics of `state` in Different Synchronizers

`state` in AQS is a general-purpose synchronization state variable, and different synchronizers assign different meanings to it:

| Synchronizer             | Mode               | Semantics of `state`                                                                                                      |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `ReentrantLock`          | Exclusive          | Represents the lock's reentrant count. `state == 0` means unlocked; `state > 0` means locked, and the value is the reentrant count |
| `ReentrantReadWriteLock` | Exclusive + Shared | Upper 16 bits represent the read-lock hold count (shared); lower 16 bits represent the write-lock reentrant count (exclusive) |
| `Semaphore`              | Shared             | Represents the number of available permits. Decrements on `acquire()` and increments on `release()`                       |
| `CountDownLatch`         | Shared             | Represents the remaining count to wait for. Decrements by 1 on `countDown()`, and wakes all waiting threads when it reaches 0 |

Let's look at a code example to feel the difference between exclusive mode and shared mode in practice:

```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.locks.ReentrantLock;

public class ExclusiveVsSharedDemo {
    public static void main(String[] args) {
        // Exclusive mode: at most 1 thread can enter the critical section at a time
        ReentrantLock lock = new ReentrantLock();

        // Shared mode: at most 3 threads can enter the critical section at a time
        Semaphore semaphore = new Semaphore(3);

        // Exclusive mode example
        Runnable exclusiveTask = () -> {
            lock.lock();
            try {
                System.out.println(Thread.currentThread().getName()
                        + " acquired the exclusive lock and is executing...");
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                lock.unlock();
            }
        };

        // Shared mode example
        Runnable sharedTask = () -> {
            boolean acquired = false;
            try {
                semaphore.acquire();
                acquired = true;
                System.out.println(Thread.currentThread().getName()
                        + " acquired a permit and is executing...");
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                if (acquired) {
                    semaphore.release();
                }
            }
        };

        System.out.println("=== Exclusive Mode (ReentrantLock) ===");
        for (int i = 0; i < 5; i++) {
            new Thread(exclusiveTask, "Exclusive-Thread-" + i).start();
        }

        try { Thread.sleep(3000); } catch (InterruptedException e) { }

        System.out.println("\n=== Shared Mode (Semaphore) ===");
        for (int i = 0; i < 5; i++) {
            new Thread(sharedTask, "Shared-Thread-" + i).start();
        }
    }
}
```

Running the code above shows that in exclusive mode, only one thread executes at a time, though the default non-fair `ReentrantLock` does not guarantee threads acquire the lock strictly in start or wait order; in shared mode, up to 3 threads execute concurrently.

### AQS Resource Acquisition Source Code Analysis (Exclusive Mode)

The entry method for acquiring resources in exclusive mode in AQS is `acquire()`, as shown below:

```java
// AQS
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

In `acquire()`, the thread first attempts to acquire the shared resource; if it fails, the thread is wrapped into a `Node` and added to AQS's wait queue; once enqueued, the thread in the wait queue attempts to acquire the resource and is blocked if unsuccessful. These steps correspond to the following three methods:

- `tryAcquire()`: Attempts to acquire the lock (template method). `AQS` provides no concrete implementation; subclasses implement it.
- `addWaiter()`: If lock acquisition fails, wraps the current thread into a `Node` and appends it to AQS's CLH variant queue to wait for the lock.
- `acquireQueued()`: Blocks the thread and invokes `tryAcquire()` so threads in the queue can attempt to acquire the lock.

#### `tryAcquire()` Analysis

The `tryAcquire()` template method in AQS is defined as follows:

```java
// AQS
protected boolean tryAcquire(int arg) {
    throw new UnsupportedOperationException();
}
```

`tryAcquire()` is a template method provided by AQS without a default implementation.

Therefore, when analyzing `tryAcquire()`, we use `ReentrantLock`'s non-fair lock (exclusive lock) as an example. `ReentrantLock`'s implementation of `tryAcquire()` calls `nonfairTryAcquire()` below:

```java
// ReentrantLock
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    // 1. Read the state field in AQS
    int c = getState();
    // 2. If state is 0, the lock is not held by any other thread
    if (c == 0) {
        // 2.1. Update state using CAS
        if (compareAndSetState(0, acquires)) {
            // 2.2. If CAS succeeds, set the current thread as the lock owner
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    // 3. If the current thread is already the lock owner, this is a reentrant acquisition
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        // 3.1. Increment the reentrant count of the lock
        setState(nextc);
        return true;
    }
    // 4. If the lock is held by another thread, return false to indicate acquisition failure
    return false;
}
```

Inside `nonfairTryAcquire()`, resource acquisition is mainly performed via two core operations:

- Updating `state` via `CAS`: `state == 0` means the resource is free; `state > 0` means the resource is occupied, in which case `state` represents the reentrant count.
- Setting the thread holding the resource via `setExclusiveOwnerThread()`.

If the thread successfully updates `state`, it means it has acquired the resource, so it simply records the current thread as the resource owner.

#### `addWaiter()` Analysis

After failing to acquire the resource via `tryAcquire()`, `addWaiter()` is called to wrap the current thread as a `Node` and add it to AQS's internal queue. The code for `addWaiter()` is as follows:

```java
// AQS
private Node addWaiter(Node mode) {
    // 1. Wrap the current thread into a Node.
    Node node = new Node(Thread.currentThread(), mode);
    Node pred = tail;
    // 2. If pred != null, the tail node has already been initialized, so append the Node directly to the queue.
    if (pred != null) {
        node.prev = pred;
        // 2.1. Ensure thread safety using CAS.
        if (compareAndSetTail(pred, node)) {
            pred.next = node;
            return node;
        }
    }
    // 3. Initialize the queue and insert the newly created Node into the queue.
    enq(node);
    return node;
}
```

**Concurrency Safety When Enqueueing Nodes:**

In `addWaiter()`, the `Node` needs to be **enqueued**. Because this happens in a multithreaded environment, `CAS` operations are required to guarantee concurrency safety.

By using `CAS` to update the `tail` pointer to point to the newly enqueued `Node`, `CAS` guarantees that only one thread can successfully modify `tail` at a time, thereby ensuring thread safety during enqueueing.

**Initialization of AQS's Internal Queue:**

When executing `addWaiter()`, if `pred == null`—meaning `tail` is `null`—the queue has not yet been initialized, so `enq()` is called to initialize the queue and insert the `Node` into the initialized queue. The code is as follows:

```java
// AQS
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        if (t == null) {
            // 1. Ensure thread safety of queue initialization via CAS
            if (compareAndSetHead(new Node()))
                tail = head;
        } else {
            // 2. Same node-enqueueing operation as in addWaiter()
            node.prev = t;
            if (compareAndSetTail(t, node)) {
                t.next = node;
                return t;
            }
        }
    }
}
```

Initializing the queue inside `enq()` also uses `CAS` to ensure concurrency safety.

Queue initialization consists of two steps: initializing the `head` node and pointing `tail` to the `head` node.

**The initialized queue is shown below:**

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/clh-queue-structure-init-e0d2df20.png)

#### `acquireQueued()` Analysis

For ease of reading, here is the `acquire()` resource acquisition code in `AQS` again:

```java
// AQS
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

In `acquire()`, once the `Node` is added to the queue via `addWaiter()`, `acquireQueued()` is invoked. The code is as follows:

```java
// AQS: Have the queued node attempt to acquire the lock, and block the thread if unsuccessful.
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            // 1. Attempt to acquire the lock.
            final Node p = node.predecessor();
            if (p == head && tryAcquire(arg)) {
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            // 2. Check whether the thread can be parked; if so, block the current thread.
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        // 3. If lock acquisition fails, cancel the acquisition and update the node state to CANCELLED.
        if (failed)
            cancelAcquire(node);
    }
}
```

In `acquireQueued()`, two main things are done:

- **Attempting to acquire the resource:** Once the current thread joins the queue, if it finds that its predecessor is `head`, that means the current thread is the first waiting node in the queue, so it calls `tryAcquire()` to try acquiring the resource.

- **Blocking the current thread**: If acquiring the resource fails, the current thread must be blocked and wait to be woken up before trying to acquire the resource again.

**1. Attempting to Acquire the Resource**

In `acquireQueued()`, attempting to acquire the resource involves two conditions:

- `p == head`: Indicates that the current node's predecessor is the `head` node, meaning the current node is the first waiting node in the AQS queue.
- `tryAcquire(arg) == true`: Indicates that the current thread succeeded in acquiring the resource.

After acquiring the resource, the current thread's node must be **removed from the wait queue**. Removal is done by setting the current waiting thread node as the new `head` node (the `head` node is a dummy node and does not participate in queuing to acquire the resource).

**2. Blocking the Current Thread**

In `AQS`, waking up the current node depends on its predecessor node. If the predecessor cancels lock acquisition, its state becomes `CANCELLED`; a `CANCELLED` node has not acquired the lock and therefore cannot perform an unlock operation to wake up the current node. Thus, before blocking the current thread, `CANCELLED` nodes must be skipped.

`shouldParkAfterFailedAcquire()` determines whether the current thread node can be parked:

```java
// AQS: Determine whether the current thread node can be blocked.
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    int ws = pred.waitStatus;
    // 1. Predecessor node state is normal; return true directly.
    if (ws == Node.SIGNAL)
        return true;
    // 2. ws > 0 indicates the predecessor node is abnormal (CANCELLED) and must be skipped.
    if (ws > 0) {
        do {
            node.prev = pred = pred.prev;
        } while (pred.waitStatus > 0);
        pred.next = node;
    } else {
        // 3. If the predecessor's state is neither SIGNAL nor CANCELLED, set it to SIGNAL.
        compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
    }
    return false;
}
```

The logic in `shouldParkAfterFailedAcquire()`:

- If the predecessor node's state is `SIGNAL`, the current thread can safely block.
- If the predecessor node's state is `CANCELLED`, `CANCELLED` nodes must be skipped.
- If the predecessor node's state is neither `SIGNAL` nor `CANCELLED`, the predecessor is in a normal waiting state, so its state is set to `SIGNAL` to indicate that it needs to wake up its successor.

Once it is determined that the current thread can block, `parkAndCheckInterrupt()` is called to block the current thread. Internally, it uses `LockSupport` to block, and `LockSupport` under the hood relies on `Unsafe` to park the thread:

```java
// AQS
private final boolean parkAndCheckInterrupt() {
    // 1. Thread blocks here
    LockSupport.park(this);
    // 2. After the thread wakes up, return its interrupt status
    return Thread.interrupted();
}
```

**Why return the thread's interrupt status after the thread wakes up?**

In `parkAndCheckInterrupt()`, once `LockSupport.park(this)` executes, the thread is blocked:

```java
// AQS
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    // After the thread wakes up, its interrupt status needs to be returned
    return Thread.interrupted();
}
```

When the thread wakes up, `Thread.interrupted()` is called to return the thread's interrupt status. Why is this needed?

This relates to Java's thread interruption cooperation mechanism: after a thread wakes up, it is unclear whether it was woken up due to an interrupt or via `LockSupport.unpark()`, so it must check the thread's interrupt status to determine which happened.

**Why does `acquire()` need to call `selfInterrupt()`?**

The `acquire()` method code is as follows:

```java
// AQS
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

In `acquire()`, when the `if` condition evaluates to `true`, `selfInterrupt()` is called to interrupt the current thread. Why is it necessary to interrupt the current thread?

For the `if` condition to be `true`, `tryAcquire()` must return `false` and `acquireQueued()` must return `true`.

`acquireQueued()` returns the thread's **interrupt status** after waking up, obtained via `Thread.interrupted()`. This method clears the thread's interrupt flag while returning the status.

Therefore, if the `if` condition evaluates to `true`, it means the thread was interrupted, yet calling `Thread.interrupted()` cleared its interrupt status back to `false`. Consequently, `selfInterrupt()` must be called to restore the thread's interrupt flag.

### AQS Resource Release Source Code Analysis (Exclusive Mode)

The entry method for releasing resources in exclusive mode in AQS is `release()`, as shown below:

```java
// AQS
public final boolean release(int arg) {
    // 1. Attempt to release the lock
    if (tryRelease(arg)) {
        Node h = head;
        // 2. Wake up the successor node
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```

In `release()`, two main tasks are performed: attempting to release the lock and waking up the successor node. The corresponding methods are as follows:

**1. Attempting to Release the Lock**

`tryRelease()` attempts to release the lock. Since it is a template method implemented by custom synchronizers, we again use `ReentrantLock` as an example.

The `tryRelease()` method implemented in `ReentrantLock` is as follows:

```java
// ReentrantLock
protected final boolean tryRelease(int releases) {
    int c = getState() - releases;
    // 1. Check whether the current thread is the lock holder
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    boolean free = false;
    // 2. If state becomes 0, the current thread has no remaining reentrant acquisitions, so set free to true indicating full release.
    if (c == 0) {
        free = true;
        // 3. Clear the resource owner thread to null
        setExclusiveOwnerThread(null);
    }
    // 4. Update state
    setState(c);
    return free;
}
```

In `tryRelease()`, it first computes the new `state` value after releasing and checks whether `state` equals 0:

- If `state == 0`, the thread has no remaining reentrant acquisitions, so it sets `free = true` and sets the owner thread to `null`, indicating that the thread has completely released the lock.
- If `state != 0`, the thread still holds reentrant acquisitions, so `free` remains `false`, indicating that the lock has not been completely released.

It then updates `state` and returns `free`, which indicates whether the thread has fully released the lock.

**2. Waking Up the Successor Node**

If `tryRelease()` returns `true`, the thread has no remaining reentrant count and the lock has been completely released, so the successor node needs to be woken up.

Before waking up the successor node, AQS checks whether a successor can be woken up using the condition: `h != null && h.waitStatus != 0`. Let's explain why this check is written this way:

- `h == null`: Indicates that the `head` node has not been initialized—meaning AQS's queue is not initialized—so no queued thread node needs to be woken up.
- `h != null && h.waitStatus == 0`: Indicates that the head node has just been initialized (a node's initial state is 0) and no successor thread has completed enqueueing yet, so no successor needs to be woken up. (Once a successor enqueues, it updates its predecessor's status to `SIGNAL` to indicate that the successor needs to be woken up.)
- `h != null && h.waitStatus != 0`: Here `waitStatus` may be either greater than 0 or less than 0. `> 0` indicates the node has canceled waiting for the resource, while `< 0` indicates the node is in a normal waiting state.

Next, let's examine `unparkSuccessor()` to see how the successor node is woken up:

```java
// AQS: Here the input parameter node is the queue's head node (dummy head node)
private void unparkSuccessor(Node node) {
    int ws = node.waitStatus;
    // 1. Clear the head node's status in preparation for waking up the successor.
    if (ws < 0)
        compareAndSetWaitStatus(node, ws, 0);

    Node s = node.next;
    // 2. If the successor node is abnormal, traverse backward from tail to find the earliest node in a normal state to wake up.
    if (s == null || s.waitStatus > 0) {
        s = null;
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null)
        // 3. Wake up the successor node
        LockSupport.unpark(s.thread);
}
```

In `unparkSuccessor()`, if the head node's status is `< 0` (normally, whenever there is a successor node, the head node's status should be `SIGNAL`, i.e., -1), that means its successor needs to be woken up. Therefore, it first clears the head node's status flag by updating it to 0, indicating that the wakeup operation for the successor has been performed.

If `s == null` or `s.waitStatus > 0`, the immediate successor node is abnormal; it cannot wake up an abnormal node, and instead must find a valid node in a normal state to wake up.

Hence it traverses backward starting from the `tail` pointer to find the first normal node (`waitStatus <= 0`) closest to `node` and wakes it up.

**Why traverse backward from `tail` instead of forward from `head` to find a node in a normal state?**

The traversal direction is tied to **how nodes are enqueued**. Look at the enqueue method:

```java
// AQS: Node enqueue method
private Node addWaiter(Node mode) {
    Node node = new Node(Thread.currentThread(), mode);
    Node pred = tail;
    if (pred != null) {
        // 1. Update the prev pointer first.
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {
            // 2. Update the next pointer afterward.
            pred.next = node;
            return node;
        }
    }
    enq(node);
    return node;
}
```

In `addWaiter()`, enqueueing a `node` requires updating two pointers—`node.prev` and `pred.next`—but these two updates are **not atomic**: `node.prev` is set first, and `pred.next` is set afterward.

In an extreme race condition, the node immediately after `head` might be in the `CANCELLED` state while a newly enqueued node has only updated its `node.prev` pointer and has not yet updated `pred.next`, as shown below:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-addWaiter-0f34ed0a.png)

In that case, traversing forward from `head` would fail to reach the newly enqueued node, whereas traversing backward from `tail` can always find the newly enqueued node.

### Visual Walkthrough of How AQS Works (Exclusive Mode)

At this point, we have covered the AQS source code for acquiring and releasing resources in exclusive mode. To build a clearer mental model of how AQS works and how node states transition, let's walk through the entire process with diagrams.

Since AQS is a low-level synchronization framework that leaves the acquire and release logic abstract, we illustrate this using `ReentrantLock`.

Suppose 3 threads attempt to acquire the lock: `T1`, `T2`, and `T3`.

Suppose thread `T1` acquires the lock first, and thread `T2` queues up to wait for the lock. Before `T2` enters the queue, AQS's internal queue must be initialized. Once initialized, the `head` node has status `0`. The initialized AQS queue is shown below:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-a624a1bb.png)

Next, thread `T2` attempts to acquire the lock. Since `T1` holds the lock, `T2` enters the queue to wait for it, and updates its predecessor (`head` node) status from `0` to `SIGNAL`, indicating that `head`'s successor needs to be woken up. At this point, the AQS queue looks like this:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-2-f9c98303.png)

Next, thread `T3` attempts to acquire the lock. Since `T1` still holds the lock, `T3` enters the queue to wait for it, and updates its predecessor (`T2`'s node) status from `0` to `SIGNAL`, indicating that `T2`'s node needs to wake up its successor. At this point, the AQS queue looks like this:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-3-6b417ddc.png)

Now suppose thread `T1` releases the lock and wakes up its successor node `T2`. Once woken up, `T2` acquires the lock and exits the wait queue.

Here, `T2`'s node does not exit the wait queue by directly deleting itself from the list; instead, `T2`'s node becomes the new `head` node, thereby exiting resource-acquisition waiting. At this point, the AQS queue looks like this:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-4-3965bc62.png)

Now suppose thread `T2` releases the lock and wakes up its successor node `T3`. After `T3` acquires the lock, it likewise exits the wait queue by making `T3`'s node the new `head` node. At this point, the AQS queue looks like this:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-5-ddd173bc.png)

### AQS Resource Acquisition Source Code Analysis (Shared Mode)

The entry method for acquiring resources in shared mode in AQS is `acquireShared()`, as shown below:

```java
// AQS
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
```

In `acquireShared()`, the thread first attempts to acquire the shared lock; if it fails, it adds the current thread to the queue and blocks until woken up to retry acquiring the shared lock. These correspond to two methods: `tryAcquireShared()` and `doAcquireShared()`.

`tryAcquireShared()` is a template method provided by AQS whose concrete logic is implemented by specific synchronizers. Here we use `Semaphore` as an example to analyze how resources are acquired in shared mode.

#### `tryAcquireShared()` Analysis

`Semaphore` implements both fair and non-fair modes. Below, we take the non-fair version as an example to analyze the `tryAcquireShared()` source code.

`Semaphore`'s overridden `tryAcquireShared()` calls `nonfairTryAcquireShared()` below:

```java
// Semaphore overriding AQS's template method
protected int tryAcquireShared(int acquires) {
    return nonfairTryAcquireShared(acquires);
}

// Semaphore
final int nonfairTryAcquireShared(int acquires) {
    for (;;) {
        // 1. Get the number of available resources.
        int available = getState();
        // 2. Calculate the remaining resources.
        int remaining = available - acquires;
        // 3. If remaining < 0, resources are insufficient so return immediately; if CAS succeeds in updating state, the thread acquired the shared resource so return immediately.
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;
    }
}
```

In shared mode, AQS's `state` value represents the count of shared resources.

In `nonfairTryAcquireShared()`, an infinite loop repeatedly attempts to acquire resources and exits when either "remaining resources are insufficient" or "the current thread successfully acquires the resource". The method returns the **remaining resource count**, falling into three cases:

- **Remaining resources > 0**: Acquisition succeeded, and subsequent threads may also be able to acquire resources.
- **Remaining resources = 0**: Acquisition succeeded, but no resources remain for subsequent threads.
- **Remaining resources < 0**: Acquisition failed.

#### `doAcquireShared()` Analysis

For convenience, here is the resource acquisition entry method `acquireShared()` again:

```java
// AQS
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
```

In `acquireShared()`, `tryAcquireShared()` is called first to attempt to acquire the resource.

If its return value is `< 0` (meaning remaining resources are less than 0), the current thread failed to acquire the resource and enters `doAcquireShared()` to add itself to the AQS queue and wait:

```java
// AQS
private void doAcquireShared(int arg) {
    // 1. Add the current thread to the queue to wait.
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            final Node p = node.predecessor();
            if (p == head) {
                // 2. If the current thread is the first waiting node in the queue, attempt to acquire the resource.
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    // 3. Remove the current thread's node from the wait queue and wake up subsequent thread nodes.
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        // 3. If acquiring the resource fails, cancel the acquisition and update the node state to CANCELLED.
        if (failed)
            cancelAcquire(node);
    }
}
```

Because the current thread already failed to acquire the resource, `doAcquireShared()` wraps it in a `Node` and inserts it into the queue to wait.

The biggest difference between acquiring resources in **shared mode** and **exclusive mode** is that in shared mode, the available resource count can be greater than 1—meaning multiple threads can hold resources simultaneously.

Therefore, in shared mode, once a thread is woken up and acquires the resource, if remaining resources still exist, it also attempts to wake up subsequent threads so they can try to acquire resources. The corresponding `setHeadAndPropagate()` method is as follows:

```java
// AQS
private void setHeadAndPropagate(Node node, int propagate) {
    Node h = head;
    // 1. Remove the current thread's node from the wait queue.
    setHead(node);
    // 2. Wake up subsequent waiting nodes.
    if (propagate > 0 || h == null || h.waitStatus < 0 ||
        (h = head) == null || h.waitStatus < 0) {
        Node s = node.next;
        if (s == null || s.isShared())
            doReleaseShared();
    }
}
```

In `setHeadAndPropagate()`, waking up subsequent nodes requires satisfying certain conditions, primarily two main conditions:

- `propagate > 0`: `propagate` represents the remaining resource count after acquisition; if `> 0`, subsequent threads can be woken up to acquire resources.
- `h.waitStatus < 0`: Here `h` is the `head` node prior to calling `setHead()`. Checking `head.waitStatus < 0` checks whether `head`'s state is `SIGNAL` or `PROPAGATE`. If `head` is `SIGNAL`, subsequent nodes should be woken up; if `head` is `PROPAGATE`, subsequent nodes should also be woken up (to handle a concurrency edge case explained in detail below).

The `if` condition for **waking up subsequent waiting nodes** is slightly subtle; let's unpack why it is written like this:

```java
if (propagate > 0 || h == null || h.waitStatus < 0 ||
    (h = head) == null || h.waitStatus < 0)
```

- `h == null || h.waitStatus < 0`: `h == null` guards against a `NullPointerException`. Normally `h` will not be `null` because before reaching this point, the current node was already added to the queue, so the queue must already be initialized.

  `h.waitStatus < 0` mainly checks whether the `head` node's state is `SIGNAL` or `PROPAGATE`; using `< 0` is a concise way to cover both.

- `(h = head) == null || h.waitStatus < 0`: Reaching this branch means the previous `h.waitStatus < 0` check was false, indicating potential concurrency.

  Another thread may be concurrently waking up subsequent nodes and may have already changed the old `head` node's status from `SIGNAL` to `0`. Therefore, AQS re-reads the new `head` node—which is now the current thread's node set by `setHead()`—and checks its `waitStatus` again.

If the `if` condition passes, execution proceeds to `doReleaseShared()` to wake up subsequent waiting nodes:

```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        // 1. There must be at least one waiting thread node in the queue.
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            // 2. If head's state is SIGNAL, its successor node can be woken up.
            if (ws == Node.SIGNAL) {
                // 2.1 Clear head's SIGNAL state to 0, indicating the successor has been woken up.
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;
                // 2.2 Wake up the successor node
                unparkSuccessor(h);
            }
            // 3. If head's state is 0, update it to PROPAGATE. This fixes a concurrency edge case explained next.
            else if (ws == 0 &&
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;
        }
        if (h == head)
            break;
    }
}
```

In `doReleaseShared()`, it inspects `head`'s `waitStatus` to decide the next action, with two cases:

- `head` has state `SIGNAL`: Indicates `head` has a successor that needs to be woken up, so it uses `CAS` to update `head`'s `SIGNAL` state to `0`. Clearing `SIGNAL` signifies that the wakeup for `head`'s successor has been initiated.
- `head` has state `0`: Indicates concurrent activity, so it updates `0` to `PROPAGATE` to ensure waiting threads can still be woken up properly under concurrency.

#### Why Is the `PROPAGATE` State Needed?

In step 3 of `doReleaseShared()`, when releasing resources, if `head`'s status is `0`, why does AQS change `head`'s status from `0` to `PROPAGATE`? That part is not immediately obvious.

In AQS, the `PROPAGATE` state on a `Node` exists specifically to prevent missed wakeups of queued thread nodes in concurrent scenarios. `PROPAGATE` is only ever set once, inside `doReleaseShared()`.

**Next, let's walk through an example to see why `PROPAGATE` is needed.**

In shared mode, the call chains for acquiring and releasing resources are as follows:

- Thread resource acquisition call chain: `acquireShared() -> tryAcquireShared() -> thread blocks waiting for wakeup -> tryAcquireShared() -> setHeadAndPropagate() -> if (remaining resources > 0 || head.waitStatus < 0) wake up subsequent node`.

- Thread resource release call chain: `releaseShared() -> tryReleaseShared() -> doReleaseShared()`.

**Suppose when releasing resources, we did NOT change `head`'s status from `0` to `PROPAGATE`:**

Assume 4 threads attempt to acquire resources in shared mode, and there are 2 total resources. Initially `T3` and `T4` acquire the resources, while `T1` and `T2` fail and wait in the queue.

- At Time 1, threads `T1` and `T2` are in the wait queue while `T3` and `T4` hold the resources. The queue nodes and their `waitStatus` values (in parentheses) are:

  `head(-1) -> T1(-1) -> T2(0)`.

- At Time 2, thread `T3` releases its resource, updates `head`'s status from `SIGNAL` to `0` in `doReleaseShared()`, wakes up `T1`, and exits.

  After waking up, `T1` acquires the resource via `tryAcquireShared()`, but has not yet executed `setHeadAndPropagate()` to set itself as `head`. The queue state is now:

  `head(0) -> T1(-1) -> T2(0)`.

- At Time 3, thread `T4` releases its resource. Because `head`'s status is `0`, if `doReleaseShared()` did nothing when `ws == 0` (i.e., without `PROPAGATE`), `T4` would not wake up `head`'s successor, and `T4` would exit.

- At Time 4, thread `T1` resumes executing `setHeadAndPropagate()`. It saves the old `head` (`waitStatus == 0`), then calls `setHead(T1)` to make itself the new `head`.

  At this point, `propagate == 0` and old `head.waitStatus == 0`, so the first two checks fail. However, because `setHead()` does not reset `waitStatus`, the new `head` (originally `T1`'s node) still has `waitStatus == -1` (`SIGNAL`), so the second check `(h = head).waitStatus < 0` still succeeds and calls `doReleaseShared()` to wake up `T2`.

  Under this interleaving, the second `head` check catches it. So what problem does `PROPAGATE` actually solve?

- At Time 5 (a more extreme interleaving), consider this sequence: right after `T1` finishes `setHead(T1)` and **before** it checks the new `head.waitStatus`, suppose `T4`'s `doReleaseShared()` happened to run `unparkSuccessor()` and woke up `T2`, and `T2` quickly acquired the resource and called `setHead(T2)` to make itself the new `head`. Because `T2` was previously the tail node of the queue, its `waitStatus` is `0`. When `T1` resumes and reads the new `head`, it reads `T2`'s node (`waitStatus == 0`), so the second check fails as well!

  Under this extreme concurrent interleaving, `propagate == 0`, old `head.waitStatus == 0`, and new `head.waitStatus == 0`—all three conditions are false, so `T1` will not call `doReleaseShared()`. If there are still waiting nodes further back in the queue, the wakeup signal will be lost.

The corresponding timeline table is as follows:

| Time   | Thread T1                                                                                             | Thread T2                                                                      | Thread T3             | Thread T4                                                                                | Wait Queue                         |
| ------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- |
| Time 1 | In wait queue                                                                                         | In wait queue                                                                  | Holds resource        | Holds resource                                                                           | `head(-1) -> T1(-1) -> T2(0)`      |
| Time 2 | (Runs) Woken up, acquires resource, but has not yet set itself as `head`                              | In wait queue                                                                  | (Runs) Releases resource | Holds resource                                                                        | `head(0) -> T1(-1) -> T2(0)`       |
| Time 3 |                                                                                                       | In wait queue                                                                  | Exited                | (Runs) Releases resource; `head` is `0`, so fails to wake successor                      | `head(0) -> T1(-1) -> T2(0)`       |
| Time 4 | (Runs) Finishes `setHead(T1)`, has not yet checked new `head.waitStatus`                              | In wait queue                                                                  | Exited                | Exited                                                                                   | `head(-1, Thread T1 node) -> T2(0)` |
| Time 5 |                                                                                                       | (Runs) Woken up by T4, acquires resource, runs `setHead(T2)` to become new `head` | Exited                | (Runs) `doReleaseShared()` wakes up T2                                                   | `head(0, Thread T2 node)`          |
| Time 6 | (Runs) Reads new `head` as T2's node (`waitStatus == 0`), second check fails, skips waking successors | Acquired resource                                                              | Exited                | Exited                                                                                   | `head(0, Thread T2 node)`          |

**If, when releasing resources, `head`'s status is changed from `0` to `PROPAGATE`, the concurrency issue above is solved as follows:**

The key to `PROPAGATE` is that it modifies the status of the **old `head`**, whose reference was already saved into the local variable `h` at the very start of `setHeadAndPropagate()`, so subsequent concurrent updates cannot overwrite that reference.

- At Time 1–2, the scenario is the same as above:

  Time 1: `head(-1) -> T1(-1) -> T2(0)`.

  Time 2: `T3` releases its resource, `head` becomes `0`, and `T1` is woken up.

- At Time 3, thread `T4` releases its resource. Because `head`'s status is `0`, `doReleaseShared()` updates `head`'s status from `0` to `PROPAGATE(-3)` and `T4` exits. The wait queue state is now:

  `head(PROPAGATE) -> T1(-1) -> T2(0)`.

- At Time 4, thread `T1` continues executing `setHeadAndPropagate()`. First it saves the old `head` in local variable `h`, where `h.waitStatus == PROPAGATE(-3)`. Then it calls `setHead(T1)` to make itself the `head` node.

- At Time 5, even if the same extreme interleaving happens (`T4` wakes `T2`, and `T2` becomes the new `head`), when `T1` evaluates the condition:

  - `propagate > 0` → `0 > 0` → false
  - `h == null` → false
  - `h.waitStatus < 0` → `PROPAGATE(-3) < 0` → **true**!

  Because the old `head` reference `h` was saved at the beginning of the method and is unaffected by subsequent `setHead()` calls or concurrent operations, the `PROPAGATE` state guarantees that `h.waitStatus < 0` passes. Therefore `T1` calls `doReleaseShared()` inside `setHeadAndPropagate()` to wake up subsequent nodes.

With the `PROPAGATE` state, missed wakeups under extreme concurrent interleavings are avoided. The corresponding timeline table is as follows:

| Time   | Thread T1                                                                                                  | Thread T2                                                                   | Thread T3                | Thread T4                                                                                  | Wait Queue                              |
| ------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------- |
| Time 1 | In wait queue                                                                                              | In wait queue                                                               | Holds resource           | Holds resource                                                                             | `head(-1) -> T1(-1) -> T2(0)`           |
| Time 2 | (Runs) Woken up, acquires resource, but has not yet set itself as `head`                                   | In wait queue                                                               | (Runs) Releases resource | Holds resource                                                                             | `head(0) -> T1(-1) -> T2(0)`            |
| Time 3 | Has not continued executing                                                                                | In wait queue                                                               | Exited                   | (Runs) Releases resource; updates `head` status from `0` to `PROPAGATE`                    | `head(PROPAGATE) -> T1(-1) -> T2(0)`    |
| Time 4 | (Runs) Saves old `head` (`waitStatus == PROPAGATE`), calls `setHead(T1)`                                   | In wait queue                                                               | Exited                   | Exited                                                                                     | `head(-1, Thread T1 node) -> T2(0)`     |
| Time 5 | (Runs) Old `h.waitStatus < 0` (`PROPAGATE(-3) < 0`) evaluates to true; calls `doReleaseShared()` to wake successors | In wait queue                                                               | Exited                   | Exited                                                                                     | `head(0, Thread T1 node) -> T2(0)`      |
| Time 6 | Exited                                                                                                     | (Runs) Woken up, acquires resource, and sets itself as the `head` node      | Exited                   | Exited                                                                                     | `head(0, Thread T2 node)`               |

In short: the `PROPAGATE` state and the second `head` check in `setHeadAndPropagate()` serve as a **double safeguard** introduced by the same bug fix in JDK 7 ([JDK-6801020](https://bugs.openjdk.org/browse/JDK-6801020)). `PROPAGATE` provides stronger protection by mutating the old `head`'s status, since the reference to the old `head` is captured in a local variable at the start of the method and cannot be replaced by concurrent `setHead()` updates.

### AQS Resource Release Source Code Analysis (Shared Mode)

The entry method for releasing resources in shared mode in AQS is `releaseShared()`, as shown below:

```java
// AQS
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```

Here `tryReleaseShared()` is a template method provided by AQS. Again using `Semaphore` as an example:

```java
// Semaphore
protected final boolean tryReleaseShared(int releases) {
    for (;;) {
        int current = getState();
        int next = current + releases;
        if (next < current) // overflow
            throw new Error("Maximum permit count exceeded");
        if (compareAndSetState(current, next))
            return true;
    }
}
```

In `Semaphore`'s implementation of `tryReleaseShared()`, an infinite loop repeatedly attempts to release permits by updating `state` via `CAS`.

If the update succeeds, the resource release succeeded, and execution proceeds to `doReleaseShared()`.

`doReleaseShared()` was already analyzed in detail in the shared-mode resource acquisition section above, so we will not repeat it here.

### How the Condition Queue Works

Earlier, in the `waitStatus` state table, we mentioned the `CONDITION` state (value -2), which indicates that a node is waiting in a `Condition` queue. Here we explain systematically how `Condition` queues work.

#### What Is `Condition`?

`Condition` is an interface defined in the `java.util.concurrent.locks` package. It provides a thread wait/notification mechanism similar to `Object.wait()` / `Object.notify()`, but with greater power and flexibility. `Condition` must be used together with a `Lock`, just as `wait/notify` must be used together with `synchronized`.

Compared with `Object`'s `wait/notify`, the main advantages of `Condition` are:

- **Support for multiple wait queues**: A single `Lock` can create multiple `Condition` instances, allowing different threads to wait on different conditions for finer-grained thread coordination. In contrast, `synchronized` has only a single wait set.
- **Support for uninterruptible waiting**: `Condition` provides the `awaitUninterruptibly()` method.
- **Support for timed waiting**: `Condition` provides `awaitNanos(long)` and `await(long, TimeUnit)` methods to specify waiting deadlines.

#### Two Types of Queues in AQS

AQS actually maintains **two types of queues** internally:

1. **Sync Queue (CLH variant queue)**: The doubly linked queue analyzed in detail above, used to hold thread nodes waiting after failing to acquire the resource.
2. **Condition Queue**: A singly linked list used to hold thread nodes that are waiting after calling `Condition.await()`. Each `Condition` instance maintains its own independent condition queue.

Nodes in a condition queue are linked via `Node`'s `nextWaiter` pointer to form a singly linked list, with `firstWaiter` pointing to the head node and `lastWaiter` pointing to the tail node.

#### Core Workflow of `Condition`

AQS's inner class `ConditionObject` implements the `Condition` interface, with core methods `await()` and `signal()`.

**Workflow of `await()`:**

1. Wrap the current thread into a `Node` (with `waitStatus` set to `CONDITION`) and append it to the tail of the condition queue.
2. Fully release the lock held by the current thread (setting `state` to 0), saving the prior `state` value.
3. Block the current thread until woken up by `signal()` or interrupted.
4. Once woken up, re-enter the sync queue via `acquireQueued()` to contend for the lock, and restore the previously saved `state` value (reentrant count).

**Workflow of `signal()`:**

1. Verify that the thread calling `signal()` holds the lock (otherwise throw `IllegalMonitorStateException`).
2. Remove the first waiting node from the condition queue.
3. Change that node's `waitStatus` from `CONDITION` to `0`, and append it to the tail of the sync queue via `enq()`.
4. If the predecessor node in the sync queue is in an abnormal state (`CANCELLED`) or CAS fails when setting the predecessor's state to `SIGNAL`, directly unpark that thread.

`signalAll()` is similar to `signal()`, except that it transfers **all** nodes in the condition queue into the sync queue.

The code example below demonstrates a classic use of `Condition`—implementing a simple bounded blocking queue:

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class SimpleBlockingQueue<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    // Two separate condition queues: one for "not full" and one for "not empty"
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public SimpleBlockingQueue(int capacity) {
        this.capacity = capacity;
    }

    /**
     * Adds an element to the queue; waits if the queue is full.
     */
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            // Wait on the notFull condition when the queue is full
            while (queue.size() == capacity) {
                notFull.await();
            }
            queue.offer(item);
            // After adding an element, signal a consumer thread waiting on notEmpty
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    /**
     * Removes an element from the queue; waits if the queue is empty.
     */
    public T take() throws InterruptedException {
        lock.lock();
        try {
            // Wait on the notEmpty condition when the queue is empty
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            T item = queue.poll();
            // After taking an element, signal a producer thread waiting on notFull
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        SimpleBlockingQueue<Integer> blockingQueue = new SimpleBlockingQueue<>(5);

        // Producer thread
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    blockingQueue.put(i);
                    System.out.println("Produced: " + i);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Producer");

        // Consumer thread
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    int item = blockingQueue.take();
                    System.out.println("Consumed: " + item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Consumer");

        producer.start();
        consumer.start();
    }
}
```

In the example above, `notFull` and `notEmpty` are two independent `Condition` instances, each maintaining its own condition queue. Producers wait on `notFull` when the queue is full, and consumers wait on `notEmpty` when the queue is empty. Separating wait conditions like this avoids unnecessary thread wakeups and is more efficient than `synchronized` + `wait/notifyAll`.

#### Core Source Code Analysis of `await()`

```java
// AQS inner class ConditionObject
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    // 1. Wrap the current thread into a Node and add it to the condition queue
    Node node = addConditionWaiter();
    // 2. Fully release the lock and save the prior state value
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    // 3. While the node is not on the sync queue, block the current thread
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this);
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    // 4. After waking up, re-enter the sync queue to contend for the lock
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;
    if (node.nextWaiter != null)
        unlinkCancelledWaiters();
    if (interruptMode != 0)
        reportInterruptAfterWait(interruptMode);
}
```

There are two critical operations in `await()`:

- `fullyRelease(node)`: Completely releases the lock (rather than releasing it just once), so even if a thread has acquired the lock multiple times reentrantly, other threads can acquire the lock while it waits. Once woken up, `acquireQueued(node, savedState)` restores the previous reentrant count.
- `isOnSyncQueue(node)`: Checks whether the node has been transferred to the sync queue. When another thread calls `signal()`, the node is moved from the condition queue to the sync queue, at which point `isOnSyncQueue()` returns `true`, the thread exits the `while` loop, and it begins contending for the lock.

### Performance Difference Analysis Between Fair Locks and Non-fair Locks

In our earlier source code analysis, we used `ReentrantLock`'s non-fair lock to explain `tryAcquire()`. In fact, `ReentrantLock` supports both fair and non-fair modes. Below is an in-depth analysis of their implementation differences and performance impact.

#### Differences at the Source Code Level

`ReentrantLock` uses a non-fair lock by default, and can be switched to a fair lock via a constructor argument:

```java
// Non-fair lock (default)
ReentrantLock unfairLock = new ReentrantLock();
// Fair lock
ReentrantLock fairLock = new ReentrantLock(true);
```

The core difference lies in the implementation of `tryAcquire()`. We already analyzed the non-fair lock's `nonfairTryAcquire()` earlier; now let's look at the fair lock implementation:

```java
// ReentrantLock.FairSync
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // Key difference: call hasQueuedPredecessors() first to check whether any thread has been waiting longer in the sync queue
        if (!hasQueuedPredecessors() &&
            compareAndSetState(0, acquires)) {
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
    return false;
}
```

**The only difference** is that before modifying `state` with CAS, a fair lock performs an extra `hasQueuedPredecessors()` check:

```java
// AQS
public final boolean hasQueuedPredecessors() {
    Node t = tail;
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

This method checks whether there are other threads queued ahead of the current thread. If so, the current thread cannot acquire the lock directly and must wait in the queue, thereby guaranteeing **FIFO** fairness.

By contrast, a non-fair lock does not perform this check: as soon as the lock is released, a newly arriving thread can immediately grab the lock via CAS even if other threads are already waiting in the sync queue.

#### Performance Comparison

| Comparison Dimension | Non-fair Lock (Default)                                                                                                  | Fair Lock                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Throughput**       | Higher. Newly arriving threads can directly acquire the lock, reducing thread context switches                           | Lower. Every thread must queue up, increasing context-switching overhead                                         |
| **Thread Starvation** | Possible. In extreme cases, some threads may fail to acquire the lock for a long time                                   | Generally less likely, though a fair lock does not guarantee OS thread scheduling fairness                       |
| **Context Switches** | Fewer. After the holder releases the lock, an arriving thread may acquire it directly without waking a queued thread     | More. Every lock release must wake up the next thread in the queue                                               |
| **Use Cases**        | Most scenarios (where latency and throughput matter)                                                                     | Scenarios with strict fairness requirements (e.g., resource allocation, task scheduling)                         |

**Why do non-fair locks generally achieve better performance?**

The key reason is **reducing the number of thread context switches**. When thread A holding the lock releases it:

- **Non-fair lock**: If thread B happens to be attempting to acquire the lock right then (before entering the sync queue), thread B can acquire the lock directly via CAS and start executing immediately, avoiding the overhead of waking up a queued thread. Even if a queued thread wakes up only to find the lock taken and blocks again—which looks like a "wasted" wakeup—overall there are fewer context switches.
- **Fair lock**: Thread B must append itself to the tail of the queue, and the thread at the head of the queue must be woken up. Between the moment a thread is unparked and the moment it actually starts running, there is a **scheduling delay** (transitioning from blocked to runnable/running), during which the lock sits idle, reducing lock utilization.

Doug Lea notes in the `ReentrantLock` documentation that programs using fair locks generally have lower overall throughput (i.e., are slower) under multithreaded contention than those using non-fair locks, which is why `ReentrantLock` defaults to non-fair mode. However, in scenarios where request processing order must be guaranteed or thread starvation must be avoided (such as connection pool allocation), a fair lock is the better choice.

Below is a code example demonstrating the behavioral difference between fair and non-fair locks:

```java
import java.util.concurrent.locks.ReentrantLock;

public class FairVsUnfairLockDemo {
    // Test fair lock and non-fair lock separately
    private static void testLock(ReentrantLock lock, String lockType) {
        System.out.println("=== " + lockType + " ===");
        Runnable task = () -> {
            for (int i = 0; i < 2; i++) {
                lock.lock();
                try {
                    System.out.println(Thread.currentThread().getName() + " acquired the lock");
                } finally {
                    lock.unlock();
                }
            }
        };

        Thread[] threads = new Thread[5];
        for (int i = 0; i < 5; i++) {
            threads[i] = new Thread(task, lockType + "-Thread-" + i);
        }
        for (Thread t : threads) {
            t.start();
        }
        for (Thread t : threads) {
            try { t.join(); } catch (InterruptedException e) { }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        // Non-fair lock: the same thread may acquire the lock multiple times consecutively
        testLock(new ReentrantLock(false), "Non-fair Lock");

        // Fair lock: when contention exists, tends to grant the lock to threads waiting longer
        testLock(new ReentrantLock(true), "Fair Lock");
    }
}
```

Running the code above usually shows that in non-fair mode, the same thread more easily acquires the lock consecutively multiple times (because immediately after releasing the lock it competes again and can grab it before a queued thread finishes waking up); in fair mode, when waiters exist, the lock tends to be granted in queue order. However, lock fairness does not equate to OS scheduling fairness—if other threads have not yet reached the wait point, the same thread can still acquire the lock consecutively.

## Common Synchronization Utilities

### Semaphore

#### Introduction

Both `synchronized` and `ReentrantLock` allow only one thread to access a resource at a time, whereas `Semaphore` can be used to control the number of threads allowed to access a specific resource concurrently.

`Semaphore` is simple to use. Suppose there are `N (N > 5)` threads trying to acquire shared resources from a `Semaphore`. The code below allows only 5 of those `N` threads to acquire the resource at any given time; the remaining threads block until an acquiring thread releases a permit so other blocked threads can acquire it.

```java
// Initial number of shared permits
final Semaphore semaphore = new Semaphore(5);
// Acquire 1 permit
semaphore.acquire();
// Release 1 permit
semaphore.release();
```

When the initial permit count is 1, `Semaphore` degenerates into an exclusive lock.

`Semaphore` has two modes:

- **Fair mode:** Under contention, blocking `acquire` calls select threads in FIFO order at the internal queuing point; this does not strictly equate to wall-clock invocation order. Furthermore, the no-argument `tryAcquire()` does not honor the fairness setting and can still barge ahead.
- **Non-fair mode:** Preemptive / barging.

`Semaphore` has the following two constructors:

```java
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}

public Semaphore(int permits, boolean fair) {
    sync = fair ? new FairSync(permits) : new NonfairSync(permits);
}
```

**Both constructors require specifying the number of permits; the second constructor lets you choose between fair and non-fair mode, with non-fair mode as the default.**

`Semaphore` is typically used in scenarios where access to a resource has an explicit concurrency limit, such as rate limiting (limited to single-node deployments; in real-world projects, Redis + Lua is recommended for rate limiting).

#### Principles

`Semaphore` is a shared-mode synchronizer implementation that initializes AQS's `state` to `permits`. You can think of `permits` as the number of available permits—only threads that obtain a permit can proceed.

Taking the no-argument `acquire()` method as an example: when calling `semaphore.acquire()`, the thread attempts to obtain a permit. If `state > 0`, acquisition can succeed; if `state <= 0`, permits are insufficient and acquisition fails.

If permits are available (`state > 0`), it tries to decrement `state` using CAS (`state = state - 1`). If acquisition fails, it creates a `Node`, appends it to the wait queue, and parks the current thread.

```java
// Acquire 1 permit
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}

// Acquire one or more permits
public void acquire(int permits) throws InterruptedException {
    if (permits < 0) throw new IllegalArgumentException();
    sync.acquireSharedInterruptibly(permits);
}
```

`acquireSharedInterruptibly` is a default implementation in `AbstractQueuedSynchronizer`:

```java
// Acquire permits in shared mode; return on success, or enqueue and park the thread on failure
public final void acquireSharedInterruptibly(int arg)
    throws InterruptedException {
    if (Thread.interrupted())
      throw new InterruptedException();
        // Attempt to acquire arg permits; on failure, create a node, add it to the wait queue, and park the current thread.
    if (tryAcquireShared(arg) < 0)
      doAcquireSharedInterruptibly(arg);
}
```

Taking non-fair mode (`NonfairSync`) as an example, let's inspect `tryAcquireShared`:

```java
// Attempt to acquire resources in shared mode (for Semaphore, permits):
protected int tryAcquireShared(int acquires) {
    return nonfairTryAcquireShared(acquires);
}

// Acquire permits in non-fair shared mode
final int nonfairTryAcquireShared(int acquires) {
    for (;;) {
        // Current number of available permits
        int available = getState();
        /*
         * Attempt to acquire permits. When available permits <= 0 (or remaining < 0), return a negative value indicating failure.
         * Only when remaining >= 0 can acquisition succeed; if CAS fails, loop and re-read the latest value to retry.
         */
        int remaining = available - acquires;
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;
    }
}
```

Taking the no-argument `release()` method as an example: calling `semaphore.release()` attempts to release a permit by incrementing `state` (`state = state + 1`) via CAS. Once the permit is released, it wakes up a waiting thread in the queue. The woken thread retries updating `state = state - 1`; if `state >= 0` after decrementing (i.e., permits were `> 0`), it acquires the permit; otherwise it goes back into the wait queue and parks.

```java
// Release 1 permit
public void release() {
    sync.releaseShared(1);
}

// Release one or more permits
public void release(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    sync.releaseShared(permits);
}
```

`releaseShared` is a default implementation in `AbstractQueuedSynchronizer`:

```java
// Release shared lock
// If tryReleaseShared returns true, wake up one or more threads in the wait queue.
public final boolean releaseShared(int arg) {
    // Release shared lock
    if (tryReleaseShared(arg)) {
      // Unpark waiting successor nodes
      doReleaseShared();
      return true;
    }
    return false;
}
```

`tryReleaseShared` is overridden in `Semaphore`'s inner class `Sync` (the default implementation in `AbstractQueuedSynchronizer` simply throws `UnsupportedOperationException`).

```java
// Method overridden in inner class Sync
// Attempt to release resources
protected final boolean tryReleaseShared(int releases) {
    for (;;) {
        int current = getState();
        // Increment available permits
        int next = current + releases;
        if (next < current) // overflow
            throw new Error("Maximum permit count exceeded");
         // Update state via CAS
        if (compareAndSetState(current, next))
            return true;
    }
}
```

As shown above, these methods all work under the hood through the synchronizer `sync`. `Sync` is an inner class of `Semaphore` that extends `AbstractQueuedSynchronizer` and overrides certain methods. In addition, `Sync` has two subclasses: `NonfairSync` (for non-fair mode) and `FairSync` (for fair mode).

```java
private static final class Sync extends AbstractQueuedSynchronizer {
  // ...
}
static final class NonfairSync extends Sync {
  // ...
}
static final class FairSync extends Sync {
  // ...
}
```

#### In Practice

```java
public class SemaphoreExample {
  // Number of requests
  private static final int threadCount = 550;

  public static void main(String[] args) throws InterruptedException {
    // Create a thread pool with a fixed number of threads (if too few threads are given here, execution will be very slow)
    ExecutorService threadPool = Executors.newFixedThreadPool(300);
    // Initial number of permits
    final Semaphore semaphore = new Semaphore(20);

    for (int i = 0; i < threadCount; i++) {
      final int threadnum = i;
      threadPool.execute(() -> {// Using a lambda expression
        try {
          semaphore.acquire();// Acquire 1 permit, so the number of concurrent running threads is 20/1=20
          test(threadnum);
          semaphore.release();// Release 1 permit
        } catch (InterruptedException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }

      });
    }
    threadPool.shutdown();
    System.out.println("finish");
  }

  public static void test(int threadnum) throws InterruptedException {
    Thread.sleep(1000);// Simulate a time-consuming request operation
    System.out.println("threadnum:" + threadnum);
    Thread.sleep(1000);// Simulate a time-consuming request operation
  }
}
```

Calling `acquire()` blocks until a permit is available and then takes one permit; each `release()` adds one permit, potentially unblocking a waiting `acquire()` call. However, no actual permit objects exist—`Semaphore` merely maintains a count of available permits. `Semaphore` is frequently used to limit the number of threads accessing a given resource.

Of course, you can also acquire and release multiple permits at once, though this is generally unnecessary:

```java
semaphore.acquire(5);// Acquire 5 permits, so the number of concurrent running threads is 20/5=4
test(threadnum);
semaphore.release(5);// Release 5 permits
```

Besides `acquire()`, another commonly used counterpart is `tryAcquire()`, which immediately returns `false` if a permit cannot be acquired.

[Supplementary note from issue #645](https://github.com/Snailclimb/JavaGuide/issues/645):

> `Semaphore` is built on AQS to control the number of threads concurrently accessing a resource, though it differs conceptually from a shared lock. `Semaphore`'s constructor uses the `permits` parameter to initialize AQS's `state` variable, which represents the number of available permits. When a thread calls `acquire()` to obtain a permit, `state` is atomically decremented by 1. If `state` after decrementing is greater than or equal to 0, `acquire()` returns successfully and the thread continues executing. If `state` after decrementing is less than 0, it means the number of concurrently accessing threads has reached the `permits` limit, so the thread is placed into AQS's wait queue and blocked, **rather than spin-waiting**. When another thread finishes its task and calls `release()`, `state` is atomically incremented by 1. The `release()` operation wakes up one or more blocked threads in AQS's wait queue, and those woken threads retry `acquire()` to contend for available permits. Therefore, `Semaphore` limits concurrent thread access by controlling the permit count, rather than through spinning or shared locking alone.

### CountDownLatch

#### Introduction

`CountDownLatch` allows a thread (or `count` tasks/events) to block at a point until all tasks have finished executing.

`CountDownLatch` is one-shot: the counter value can only be initialized once in its constructor, and there is no mechanism to reset or set its value again afterward. Once `CountDownLatch` has been used, it cannot be reused.

#### Principles

`CountDownLatch` is a shared-mode synchronizer implementation that sets AQS's `state` to `count` by default, as can be seen from `CountDownLatch`'s constructor:

```java
public CountDownLatch(int count) {
    if (count < 0) throw new IllegalArgumentException("count < 0");
    this.sync = new Sync(count);
}

private static final class Sync extends AbstractQueuedSynchronizer {
    Sync(int count) {
        setState(count);
    }
  //...
}
```

When a thread calls `countDown()`, it actually uses `tryReleaseShared` to decrement `state` via CAS until `state` reaches 0. When `state` reaches 0, meaning all tasks have called `countDown`, the threads waiting on `CountDownLatch` are woken up and continue executing.

```java
public void countDown() {
    // Sync is an inner class of CountDownLatch that extends AbstractQueuedSynchronizer
    sync.releaseShared(1);
}
```

`releaseShared` is a default implementation in `AbstractQueuedSynchronizer`:

```java
// Release shared lock
// If tryReleaseShared returns true, wake up one or more threads in the wait queue.
public final boolean releaseShared(int arg) {
    // Release shared lock
    if (tryReleaseShared(arg)) {
      // Unpark waiting successor nodes
      doReleaseShared();
      return true;
    }
    return false;
}
```

`tryReleaseShared` is overridden in `CountDownLatch`'s inner class `Sync` (the default implementation in `AbstractQueuedSynchronizer` simply throws `UnsupportedOperationException`).

```java
// Decrement state until state reaches 0;
// Only when count is decremented to 0 does tryReleaseShared return true
protected boolean tryReleaseShared(int releases) {
    // Spin to check whether state is 0
    for (;;) {
        int c = getState();
        // If state is already 0, return false directly
        if (c == 0)
            return false;
        // Decrement state
        int nextc = c-1;
        // Update state using CAS
        if (compareAndSetState(c, nextc))
            return nextc == 0;
    }
}
```

Taking the no-argument `await` method as an example: when `await()` is called, if `state` is not 0, the tasks have not yet finished, so `await()` keeps blocking—meaning statements after `await()` will not execute yet (the `main` thread is added to the wait queue, i.e., the CLH variant queue). Then `CountDownLatch` checks `state == 0` via CAS/sync flow, and once `state == 0`, all waiting threads are released and statements after `await()` execute.

```java
// Wait (can also be viewed as acquiring the lock)
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
// Wait with a timeout
public boolean await(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireSharedNanos(1, unit.toNanos(timeout));
}
```

`acquireSharedInterruptibly` is a default implementation in `AbstractQueuedSynchronizer`:

```java
// Attempt to acquire the lock; return on success, or enqueue and park the thread on failure
public final void acquireSharedInterruptibly(int arg)
    throws InterruptedException {
    if (Thread.interrupted())
      throw new InterruptedException();
        // Attempt to acquire the lock; return if successful
    if (tryAcquireShared(arg) < 0)
      // On failure, add to the wait queue and park the thread
      doAcquireSharedInterruptibly(arg);
}
```

`tryAcquireShared` is overridden in `CountDownLatch`'s inner class `Sync`. Its purpose is simply to check whether `state` is 0—returning `1` if so, and `-1` otherwise.

```java
protected int tryAcquireShared(int acquires) {
    return (getState() == 0) ? 1 : -1;
}
```

#### In Practice

**Two typical usage patterns of `CountDownLatch`**:

1. Having one thread wait for `n` threads to finish before proceeding: Initialize `CountDownLatch`'s counter to `n` (`new CountDownLatch(n)`). Whenever a worker thread completes its task, decrement the counter by 1 (`countDownLatch.countDown()`). When the counter reaches 0, the thread waiting on `CountDownLatch.await()` is woken up. A typical use case is during service startup, where the main thread must wait for multiple components to finish loading before continuing.
2. Maximizing parallelism so multiple threads begin executing a task together: Note that this means parallelism rather than concurrency—emphasizing that multiple threads begin executing at the exact same moment. Much like a race, multiple threads gather at the starting line waiting for the starting pistol, and then take off together. To do this, initialize a shared `CountDownLatch` with a counter of 1 (`new CountDownLatch(1)`). Before starting their tasks, each thread calls `countDownLatch.await()`. When the main thread calls `countDown()`, the counter reaches 0 and all threads are woken up simultaneously.

**`CountDownLatch` code example:**

```java
public class CountDownLatchExample {
  // Number of requests
  private static final int THREAD_COUNT = 550;

  public static void main(String[] args) throws InterruptedException {
    // Create a thread pool with a fixed number of threads (if too few threads are given here, execution will be very slow)
    // Only for testing; in real-world scenarios, configure thread pool parameters manually
    ExecutorService threadPool = Executors.newFixedThreadPool(300);
    final CountDownLatch countDownLatch = new CountDownLatch(THREAD_COUNT);
    for (int i = 0; i < THREAD_COUNT; i++) {
      final int threadNum = i;
      threadPool.execute(() -> {
        try {
          test(threadNum);
        } catch (InterruptedException e) {
          e.printStackTrace();
        } finally {
          // Indicate that one request has completed
          countDownLatch.countDown();
        }

      });
    }
    countDownLatch.await();
    threadPool.shutdown();
    System.out.println("finish");
  }

  public static void test(int threadnum) throws InterruptedException {
    Thread.sleep(1000);
    System.out.println("threadNum:" + threadnum);
    Thread.sleep(1000);
  }
}
```

In the code above, we defined the number of requests as 550; only after all 550 requests have been processed will `System.out.println("finish");` execute.

The first interaction with `CountDownLatch` is the main thread waiting for the other threads. The main thread must call `CountDownLatch.await()` immediately after starting the other threads, causing the main thread to block on this call until the other threads finish their tasks.

The other `N` threads must hold a reference to the latch object because they need to notify the `CountDownLatch` object once they have completed their respective tasks. This notification is performed via `CountDownLatch.countDown()`; each call decrements the `count` value initialized in the constructor by 1. Thus, once all `N` threads have called this method, `count` equals 0, and the main thread resumes execution past `await()`.

One quick note: improper use of `CountDownLatch.await()` can easily cause a deadlock—for example, if we change the `for` loop in the code above to:

```java
for (int i = 0; i < threadCount-1; i++) {
.......
}
```

Then `count` can never reach 0, causing the thread to wait forever.

### CyclicBarrier

#### Introduction

`CyclicBarrier` is very similar to `CountDownLatch`, as it also implements count-based waiting between threads, but its functionality is more complex and powerful. Its primary use cases are similar to `CountDownLatch`.

> `CountDownLatch` is implemented directly on top of AQS, whereas `CyclicBarrier` is built on `ReentrantLock` (`ReentrantLock` is also an AQS-based synchronizer) and `Condition`.

Literally, `CyclicBarrier` means a reusable (**Cyclic**) **Barrier**. What it does is block a group of threads when they reach a barrier (also called a synchronization point) until the last thread arrives at the barrier; only then does the barrier open, allowing all threads held at the barrier to resume working.

#### Principles

Internally, `CyclicBarrier` uses a `count` variable as a counter whose initial value comes from `parties`. Each time a thread reaches the barrier, the counter is decremented by 1. When `count` reaches 0, it means the last thread of the current generation has reached the barrier, so it tries to run the task passed to the constructor.

```java
// Number of threads to wait for per barrier cycle
private final int parties;
// Counter
private int count;
```

Let's examine its source code briefly.

1. The default constructor of `CyclicBarrier` is `CyclicBarrier(int parties)`, whose parameter specifies the number of threads to intercept at the barrier. Each thread calls `await()` to tell `CyclicBarrier` it has reached the barrier, and is then blocked.

```java
public CyclicBarrier(int parties) {
    this(parties, null);
}

public CyclicBarrier(int parties, Runnable barrierAction) {
    if (parties <= 0) throw new IllegalArgumentException();
    this.parties = parties;
    this.count = parties;
    this.barrierCommand = barrierAction;
}
```

Here `parties` represents the number of threads waited on at the barrier; once the number of waiting threads reaches this value, the barrier opens and lets all threads pass.

2. Calling `await()` on a `CyclicBarrier` object actually invokes `dowait(false, 0L)`. Calling `await()` acts like putting up a barrier that holds threads back; only when the number of intercepted threads reaches `parties` does the barrier open so the threads can proceed.

```java
public int await() throws InterruptedException, BrokenBarrierException {
  try {
      return dowait(false, 0L);
  } catch (TimeoutException toe) {
      throw new Error(toe); // cannot happen
  }
}
```

The source code analysis of `dowait(false, 0L)` is as follows:

```java
    // Statements after await() execute only once the number of threads or requests reaches count. In the example above, count is 5.
    private int count;
    /**
     * Main barrier code, covering the various policies.
     */
    private int dowait(boolean timed, long nanos)
        throws InterruptedException, BrokenBarrierException,
               TimeoutException {
        final ReentrantLock lock = this.lock;
        // Acquire the lock
        lock.lock();
        try {
            final Generation g = generation;

            if (g.broken)
                throw new BrokenBarrierException();

            // Throw an exception if the thread was interrupted
            if (Thread.interrupted()) {
                breakBarrier();
                throw new InterruptedException();
            }
            // Decrement count by 1
            int index = --count;
            // Once count reaches 0, the last thread has arrived at the barrier, meeting the condition to proceed past await()
            if (index == 0) {  // tripped
                boolean ranAction = false;
                try {
                    final Runnable command = barrierCommand;
                    if (command != null)
                        command.run();
                    ranAction = true;
                    // Reset count to the initial value of parties
                    // Wake up previously waiting threads
                    // Start the next generation
                    nextGeneration();
                    return 0;
                } finally {
                    if (!ranAction)
                        breakBarrier();
                }
            }

            // loop until tripped, broken, interrupted, or timed out
            for (;;) {
                try {
                    if (!timed)
                        trip.await();
                    else if (nanos > 0L)
                        nanos = trip.awaitNanos(nanos);
                } catch (InterruptedException ie) {
                    if (g == generation && ! g.broken) {
                        breakBarrier();
                        throw ie;
                    } else {
                        // We're about to finish waiting even if we had not
                        // been interrupted, so this interrupt is deemed to
                        // "belong" to subsequent execution.
                        Thread.currentThread().interrupt();
                    }
                }

                if (g.broken)
                    throw new BrokenBarrierException();

                if (g != generation)
                    return index;

                if (timed && nanos <= 0L) {
                    breakBarrier();
                    throw new TimeoutException();
                }
            }
        } finally {
            lock.unlock();
        }
    }
```

#### In Practice

Example 1:

```java
public class CyclicBarrierExample1 {
  // Number of requests
  private static final int threadCount = 550;
  // Number of threads to synchronize
  private static final CyclicBarrier cyclicBarrier = new CyclicBarrier(5);

  public static void main(String[] args) throws InterruptedException {
    // Create a thread pool
    ExecutorService threadPool = Executors.newFixedThreadPool(10);

    for (int i = 0; i < threadCount; i++) {
      final int threadNum = i;
      Thread.sleep(1000);
      threadPool.execute(() -> {
        try {
          test(threadNum);
        } catch (InterruptedException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        } catch (BrokenBarrierException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      });
    }
    threadPool.shutdown();
  }

  public static void test(int threadnum) throws InterruptedException, BrokenBarrierException {
    System.out.println("threadnum:" + threadnum + "is ready");
    try {
      /**Wait for 60 seconds to ensure child threads finish completely*/
      cyclicBarrier.await(60, TimeUnit.SECONDS);
    } catch (Exception e) {
      System.out.println("-----CyclicBarrierException------");
    }
    System.out.println("threadnum:" + threadnum + "is finish");
  }

}
```

Output is as follows:

```plain
threadnum:0is ready
threadnum:1is ready
threadnum:2is ready
threadnum:3is ready
threadnum:4is ready
threadnum:4is finish
threadnum:0is finish
threadnum:1is finish
threadnum:2is finish
threadnum:3is finish
threadnum:5is ready
threadnum:6is ready
threadnum:7is ready
threadnum:8is ready
threadnum:9is ready
threadnum:9is finish
threadnum:5is finish
threadnum:8is finish
threadnum:7is finish
threadnum:6is finish
......
```

As shown above, the code after `await()` only executes once the number of threads (requests) reaches the 5 we defined.

In addition, `CyclicBarrier` provides an advanced constructor `CyclicBarrier(int parties, Runnable barrierAction)` that executes `barrierAction` first when the threads reach the barrier, making it convenient for handling more complex business scenarios.

Example 2:

```java
public class CyclicBarrierExample2 {
  // Number of requests
  private static final int threadCount = 550;
  // Number of threads to synchronize
  private static final CyclicBarrier cyclicBarrier = new CyclicBarrier(5, () -> {
    System.out.println("------Executed first once the thread count is reached------");
  });

  public static void main(String[] args) throws InterruptedException {
    // Create a thread pool
    ExecutorService threadPool = Executors.newFixedThreadPool(10);

    for (int i = 0; i < threadCount; i++) {
      final int threadNum = i;
      Thread.sleep(1000);
      threadPool.execute(() -> {
        try {
          test(threadNum);
        } catch (InterruptedException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        } catch (BrokenBarrierException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      });
    }
    threadPool.shutdown();
  }

  public static void test(int threadnum) throws InterruptedException, BrokenBarrierException {
    System.out.println("threadnum:" + threadnum + "is ready");
    cyclicBarrier.await();
    System.out.println("threadnum:" + threadnum + "is finish");
  }

}
```

Output is as follows:

```plain
threadnum:0is ready
threadnum:1is ready
threadnum:2is ready
threadnum:3is ready
threadnum:4is ready
------Executed first once the thread count is reached------
threadnum:4is finish
threadnum:0is finish
threadnum:2is finish
threadnum:1is finish
threadnum:3is finish
threadnum:5is ready
threadnum:6is ready
threadnum:7is ready
threadnum:8is ready
threadnum:9is ready
------Executed first once the thread count is reached------
threadnum:9is finish
threadnum:5is finish
threadnum:6is finish
threadnum:8is finish
threadnum:7is finish
......
```

## References

- Java Concurrency — AQS In-Depth Explanation: <https://www.cnblogs.com/waterystone/p/4920797.html>
- Understanding AQS Principles and Applications from ReentrantLock's Implementation: <https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html>
