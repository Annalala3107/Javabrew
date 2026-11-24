---
title: DelayQueue Source Code Analysis
description: "In-depth analysis of DelayQueue source code: explaining delay queue implementation principles, Delayed interface usage, delayed task scheduling, application scenarios such as order timeout cancellation, and thread-safe design based on PriorityQueue."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/delayqueue-source-code.md
head:
  - - meta
    - name: keywords
      content: DelayQueue source code,delay queue,Delayed interface,delayed task,scheduled task,order timeout,PriorityQueue implementation
---

## Introduction to DelayQueue

`DelayQueue` is a delay queue provided by the JUC (`java.util.concurrent`) package, commonly used to implement delayed tasks—for example, automatically canceling an order if it has not been paid within 15 minutes after placement. It is a type of `BlockingQueue`, backed by an unbounded queue implemented on top of `PriorityQueue`, and is thread-safe.

![Implementation Classes of BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-hierarchy-755d1cd5.png)

Elements stored in a `DelayQueue` must implement the `Delayed` interface and override the `getDelay()` method (to compute whether the element has expired).

```java
public interface Delayed extends Comparable<Delayed> {
    long getDelay(TimeUnit unit);
}
```

By default, `DelayQueue` orders tasks in ascending order of expiration time. An element can only be retrieved from the queue when it has expired (the return value of `getDelay()` is less than or equal to 0).

`DelayQueue` was first introduced in Java 5 and is a thread-safe, unbounded blocking queue.

## Example of a Common DelayQueue Use Case

Suppose we want tasks to become available according to their expected delays—for example, submitting 3 tasks with delays of 1s, 2s, and 3s respectively. Even if they are added out of order, the task whose delay expires earliest will become available first.

![Delayed Tasks](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayed-task-3af63966.png)

To implement this with `DelayQueue`, we first implement `Delayed` to create `DelayedTask`, overriding both `getDelay` and the priority comparison method `compareTo`.

```java
/**
 * Delayed task
 */
public class DelayedTask implements Delayed {
    /**
     * Task expiration timestamp
     */
    private long executeTime;
    /**
     * Task
     */
    private Runnable task;

    public DelayedTask(long delay, Runnable task) {
        this.executeTime = System.currentTimeMillis() + delay;
        this.task = task;
    }

    /**
     * Check how much time remains until this task expires
     * @param unit
     * @return
     */
    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert(executeTime - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
    }

    /**
     * DelayQueue needs tasks to be enqueued in ascending order of expiration time, so we implement compareTo to compare expiration times
     * @param o
     * @return
     */
    @Override
    public int compareTo(Delayed o) {
        return Long.compare(this.executeTime, ((DelayedTask) o).executeTime);
    }

    public void execute() {
        task.run();
    }
}
```

Once the task wrapper is defined, using it is very straightforward: configure how long until each task expires and submit them into the delay queue.

```java
// Create a delay queue and add tasks
DelayQueue < DelayedTask > delayQueue = new DelayQueue < > ();

// Add tasks expiring in 2s, 1s, and 3s respectively
delayQueue.add(new DelayedTask(2000, () -> System.out.println("Task 2")));
delayQueue.add(new DelayedTask(1000, () -> System.out.println("Task 1")));
delayQueue.add(new DelayedTask(3000, () -> System.out.println("Task 3")));

// Retrieve and execute tasks
while (!delayQueue.isEmpty()) {
  // Block until the earliest-expiring task is ready
  DelayedTask task = delayQueue.take();
  if (task != null) {
    task.execute();
  }
}
```

From the output below, we can see that even though we submitted the 2s task first, Task 1 (with a 1s delay) still executed first.

```java
Task 1
Task 2
Task 3
```

## DelayQueue Source Code Analysis

Taking JDK 1.8 as an example, let's analyze the core underlying source code of `DelayQueue`.

The class definition of `DelayQueue` is as follows:

```java
public class DelayQueue<E extends Delayed> extends AbstractQueue<E> implements BlockingQueue<E>
{
  //...
}
```

`DelayQueue` extends the `AbstractQueue` class and implements the `BlockingQueue` interface.

![DelayQueue Class Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-class-diagram-933c7629.png)

### Core Member Fields

The 4 core member fields of `DelayQueue` are as follows:

```java
// Reentrant lock, key to achieving thread safety
private final transient ReentrantLock lock = new ReentrantLock();
// Underlying collection storing elements in the delay queue, ensuring elements are ordered in ascending order of expiration time
private final PriorityQueue<E> q = new PriorityQueue<E>();

// Points to the thread waiting for the highest-priority (earliest-expiring) element
private Thread leader = null;
// Enables wait/notify signaling across multiple threads
private final Condition available = lock.newCondition();
```

- `lock`: As we know, reading and writing in `DelayQueue` are thread-safe. To guarantee thread safety when adding and retrieving elements, we must acquire a lock during those operations. `DelayQueue` uses an exclusive `ReentrantLock` to ensure thread safety for element access.
- `q`: A delay queue requires elements to be ordered in ascending order of expiration time, so elements must be prioritized when inserted. Therefore, `DelayQueue` delegates all underlying storage and retrieval of elements to this `PriorityQueue` field `q`.
- `leader`: Tasks in a delay queue only execute once they expire; un-expired tasks must wait. To ensure that the highest-priority task is executed immediately upon expiration, the designers introduced `leader` to coordinate delayed tasks: only the thread referenced by `leader` is allowed to perform a timed wait for the head element's expiration, while other threads wait indefinitely until the `leader` thread finishes taking its task and signals them.
- `available`: The wait-and-notify interaction mentioned when discussing the `leader` thread is implemented via `available`. For example, if thread 1 attempts to retrieve a task from an empty `DelayQueue`, `available` places it into the condition wait queue until another thread adds a delayed task and wakes it up via `available.signal()`.

### Constructors

Compared with other concurrent containers, `DelayQueue`'s constructors are very simple. It has only two constructors. Because all member fields are already initialized when the class/instance is constructed, the default no-arg constructor does nothing. There is also a constructor taking a `Collection` object, which invokes `addAll()` to insert the collection's elements into the priority queue `q`.

```java
public DelayQueue() {}

public DelayQueue(Collection<? extends E> c) {
    this.addAll(c);
}
```

### Adding Elements

Whether you call `add`, `put`, or `offer` on `DelayQueue`, they all essentially call `offer`. Therefore, to understand the insertion logic of `DelayQueue`, we only need to read the `offer` method.

The overall logic of `offer` is:

1. Try to acquire `lock`.
2. Once locked, call `q.offer` to insert the element into the priority queue.
3. Call `peek` to check whether the current head of the queue is the newly enqueued element. If so, this element is the soonest-to-expire task (the highest-priority element), so `leader` is reset to `null`, and any thread blocked in `take` (or similar methods) waiting for elements is signaled to compete for it.
4. Once the above steps complete, release `lock`.
5. Return `true`.

The source code with detailed comments is shown below:

```java
public boolean offer(E e) {
    // Try to acquire lock
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        // Once locked, call q.offer to insert the element into the priority queue
        q.offer(e);
        // Call peek to check if the current head element is the newly inserted element; if so, it is the earliest-expiring task (highest priority)
        if (q.peek() == e) {
            // Reset leader to null and notify blocked consumer threads to compete for this task
            leader = null;
            available.signal();
        }
        return true;
    } finally {
        // Release lock after the above steps finish
        lock.unlock();
    }
}
```

### Retrieving Elements

`DelayQueue` provides both blocking and non-blocking ways to retrieve elements. Let's first examine the more complex blocking retrieval method `take`. To make the full workflow of blocking retrieval easy to visualize, we will walk through an example with 3 threads (`t1`, `t2`, `t3`) concurrently attempting to retrieve elements.

> Understanding the following section requires knowledge of AQS. You are encouraged to read these two articles:
>
> - [Illustrated Guide to AQS: Walking Through AQS Source Code... (Long Read with Diagrams)](https://xie.infoq.cn/article/5a3cc0b709012d40cb9f41986)
> - [Finished Reading AQS? Don't Miss How Condition Works!](https://xie.infoq.cn/article/0223d5e5f19726b36b084b10d)

1. First, all 3 threads try to acquire the reentrant lock `lock`. Suppose the 3 threads are `t1`, `t2`, and `t3`; `t1` acquires the lock, while `t2` and `t3` fail to acquire it and are placed into the lock's wait queue.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-take-0-e892f631.png)

2. Next, `t1` enters the element retrieval logic.

3. Thread `t1` first checks whether the head element of `DelayQueue` is `null`.

4. If it is `null`, the queue currently has no elements, so `t1` is blocked and placed into the `conditionWaiter` queue.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-take-1-4d66e368.png)

Note that after calling `await`, `t1` releases `lock`. If `DelayQueue` remains empty, `t2` and `t3` will follow the exact same logic as `t1` and enter the `conditionWaiter` queue as well.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/delayqueue-take-2-f0c6ac83.png)

If the head element is not `null`, `take` checks whether the current task has expired. If it has expired, it polls and returns the element immediately. If the element has not expired yet, it checks whether the `leader` thread (the single thread reference in `DelayQueue` permitted to wait on a timed basis for the head element) is non-null. If `leader != null`, another thread is already waiting for a higher-priority task to expire, so the current thread calls `await` to enter an indefinite wait until it is woken up after the `leader` retrieves an element. Conversely, if `leader` is `null`, the current thread becomes the `leader` and enters a timed wait (`awaitNanos`), after which it loops back to poll and return the element upon expiration.

With the full blocking retrieval workflow covered, here is the annotated source code:

```java
public E take() throws InterruptedException {
    // Acquire the reentrant lock interruptibly (sets underlying AQS state to 1 as an exclusive lock)
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        for (;;) {
            // Inspect the first element in the queue
            E first = q.peek();
            // If null, place the current thread into ConditionObject's wait queue, reset AQS state to 0 (release lock), and wait indefinitely
            if (first == null)
                available.await();
            else {
                // If non-null, check how much time remains until the element expires
                long delay = first.getDelay(NANOSECONDS);
                // If <= 0, the element has expired; poll and return it directly
                if (delay <= 0)
                    return q.poll();
                // If > 0, the task has not expired yet; first clear the reference to this element
                first = null; // don't retain ref while waiting
                // Check if leader is non-null; if so, another thread is already the leader waiting for a task to expire, so wait indefinitely
                if (leader != null)
                    available.await();
                else {
                    // Otherwise, set the current thread as leader
                    Thread thisThread = Thread.currentThread();
                    leader = thisThread;
                    try {
                        // Enter a timed wait for the remaining delay
                        available.awaitNanos(delay);
                    } finally {
                        // When wait ends, clear the leader reference and proceed to the next loop iteration to return the task
                        if (leader == thisThread)
                            leader = null;
                    }
                }
            }
        }
    } finally {
        // Cleanup: if leader is null and there is still a task in the queue, wake up a waiting consumer thread
        if (leader == null && q.peek() != null)
            available.signal();
        // Release the lock
        lock.unlock();
    }
}
```

Now let's examine the non-blocking retrieval method `poll`. Its logic is relatively straightforward, with these steps:

1. Try to acquire the reentrant lock.
2. Inspect the first element in the queue and check if it is `null`.
3. If the element is `null` or has not expired yet, return `null` directly.
4. If the element is non-null and has expired, call `q.poll()` and return it.
5. Release the reentrant lock `lock`.

The annotated source code is as follows:

```java
public E poll() {
    // Try to acquire the reentrant lock
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        // Inspect the first element in the queue to check whether it is null
        E first = q.peek();

        // If null or not yet expired, return null directly
        if (first == null || first.getDelay(NANOSECONDS) > 0)
            return null;
        else
            // If non-null and expired, call poll and return it
            return q.poll();
    } finally {
        // Release the reentrant lock
        lock.unlock();
    }
}
```

### Peeking at Elements

Both retrieval methods above call `peek`. As the name suggests, `peek` simply looks at the head element in the queue without removing it, taking 4 steps:

1. Acquire the lock.
2. Call `q.peek()` on the priority queue to view the element at index 0.
3. Release the lock.
4. Return the element.

```java
public E peek() {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        return q.peek();
    } finally {
        lock.unlock();
    }
}
```

## Common DelayQueue Interview Questions

### What Is the Implementation Principle of DelayQueue?

Under the hood, `DelayQueue` uses a `PriorityQueue` to store elements. `PriorityQueue` adopts a binary min-heap design to ensure that elements with smaller values stay at the front, making it very convenient for `DelayQueue` to manage delayed task priorities. Meanwhile, to guarantee thread safety, `DelayQueue` uses a `ReentrantLock`, ensuring that only one thread can manipulate the delay queue at a time. Finally, to achieve efficient wait/notify coordination across multiple threads, `DelayQueue` uses a `Condition`, accomplishing inter-thread waiting and waking through `Condition`'s `await` and `signal` methods.

### Is the Implementation of DelayQueue Thread-Safe?

Yes, `DelayQueue` is thread-safe. It achieves mutually exclusive access via `ReentrantLock` and inter-thread waiting and waking via `Condition`, guaranteeing safety and reliability in multithreaded environments.

### What Are the Use Cases of DelayQueue?

`DelayQueue` is commonly used in scenarios such as scheduled task execution and cache expiration cleanup. For scheduled task execution, tasks to be executed are encapsulated as delayed task objects and added to `DelayQueue`; once the head element's delay expires, it can be taken from the queue (the exact execution time still depends on consumer thread scheduling). For cache expiration, after caching data in memory, we can wrap the cache key into a delayed deletion task and add it to `DelayQueue`; when the entry expires, the consumer retrieves the task's key and removes that key from memory.

### What Is the Role of the Delayed Interface in DelayQueue?

The `Delayed` interface defines both an element's remaining delay time (`getDelay`) and the comparison rule between elements (since `Delayed` extends `Comparable`). Any element stored in a `DelayQueue` must implement the `getDelay()` and `compareTo()` methods of the `Delayed` interface; otherwise, `DelayQueue` cannot determine the remaining delay of the task or compare task priorities.

### What Is the Difference Between DelayQueue and Timer/TimerTask?

Both `DelayQueue` and `Timer`/`TimerTask` can be used to implement delayed/scheduled task execution, but they work differently. `DelayQueue` is implemented on top of a priority queue and is only responsible for holding delayed elements and allowing them to be retrieved after expiration; whereas `Timer`/`TimerTask` uses a single background thread to execute tasks sequentially, so if one task takes too long, it delays the execution of subsequent tasks. Both support adding tasks at runtime, and `DelayQueue` also allows delayed elements to be removed directly.

## References

- *Deep Understanding of High-Concurrency Programming: JDK Core Technologies*:
- Name Java's 6 Delay Queue Implementations in One Breath (Even Interviewers Will Be Impressed): <https://www.jb51.net/article/186192.htm>
- Illustrated DelayQueue Source Code (Java 8) — The Little Secrets of DelayQueue: <https://blog.csdn.net/every__day/article/details/113810985>
