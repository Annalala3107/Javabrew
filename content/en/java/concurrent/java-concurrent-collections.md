---
title: Summary of Common Java Concurrent Collections
description: "Comprehensive summary of Java concurrent containers: explaining the characteristics, applicable scenarios, and performance comparisons of JUC thread-safe containers such as ConcurrentHashMap, CopyOnWriteArrayList, and BlockingQueue."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/java-concurrent-collections.md
head:
  - - meta
    - name: keywords
      content: Java concurrent containers,ConcurrentHashMap,CopyOnWriteArrayList,BlockingQueue,ConcurrentLinkedQueue,thread-safe containers
---

Most of these containers provided by the JDK are in the `java.util.concurrent` package.

- **`ConcurrentHashMap`**: A thread-safe `HashMap`.
- **`CopyOnWriteArrayList`**: A thread-safe `List` that performs very well in read-heavy, write-light scenarios, far outperforming `Vector`.
- **`ConcurrentLinkedQueue`**: A high-efficiency concurrent queue implemented using a linked list. It can be regarded as a thread-safe `LinkedList` and is a non-blocking queue.
- **`BlockingQueue`**: An interface that the JDK implements internally using linked lists, arrays, and other structures. It represents a Blocking Queue and is very well suited as a channel for data sharing.
- **`ConcurrentSkipListMap`**: An implementation of a skip list. This is a `Map` that uses a skip list data structure for fast lookups.

## ConcurrentHashMap

As we know, `HashMap` is not thread-safe. If used in concurrent scenarios, a common workaround is to wrap `HashMap` via `Collections.synchronizedMap()` to make it thread-safe. However, this approach uses a single global lock to synchronize concurrent accesses across different threads, which causes severe performance bottlenecks, especially under high-concurrency scenarios.

To solve this problem, `ConcurrentHashMap` was created. As a thread-safe version of `HashMap`, it provides much more efficient concurrent processing capabilities.

In JDK 1.7, `ConcurrentHashMap` segmented the entire bucket array (`Segment`, segment locking), where each lock only locked a portion of the container's data (see diagram below). When multiple threads accessed data in different segments of the container, there was no lock contention, improving concurrent access rates.

![Java 7 ConcurrentHashMap Storage Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

In JDK 1.8, `ConcurrentHashMap` dropped `Segment` locking and adopted `Node + CAS + synchronized` to guarantee concurrent safety. Its data structure is similar to `HashMap` in 1.8: array + linked list / Red-Black Tree. Java 8 converts a linked list (lookup time complexity O(N)) into a Red-Black Tree (lookup time complexity O(log(N))) when the linked list length exceeds a certain threshold (8).

In Java 8, the lock granularity for update operations is finer: when locking is needed, `synchronized` locks the head node of the corresponding bucket, so updates on different buckets can generally proceed concurrently. Read operations generally do not require locking and can also proceed concurrently with update operations.

![Java 8 ConcurrentHashMap Storage Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

For a detailed introduction to `ConcurrentHashMap`, please read my article: [`ConcurrentHashMap` Source Code Analysis](./../collection/concurrent-hash-map-source-code.md).

## CopyOnWriteArrayList

Before `CopyOnWriteArrayList` was introduced in JDK 1.5, besides the earlier `Vector`, one could also wrap an ordinary `List` with `Collections.synchronizedList()` to obtain synchronized access. Nearly all CRUD methods on `Vector` have `synchronized` applied, so individual method calls are thread-safe, though compound operations still require additional synchronization.

JDK 1.5 introduced the `java.util.concurrent` (JUC) package, which provides many containers that are both thread-safe and offer strong concurrent performance; among them, the only thread-safe `List` implementation is `CopyOnWriteArrayList`.

For most business scenarios, read operations vastly outnumber write operations. Because read operations do not modify the underlying data, acquiring a lock on every read is actually a waste of resources. Instead, we should allow multiple threads to access the internal data of the `List` simultaneously—after all, doing so is safe for read operations.

This idea is very similar to the design philosophy of the `ReentrantReadWriteLock` read-write lock: read-read is non-mutually exclusive, while read-write and write-write are mutually exclusive (only read-read does not exclude each other). `CopyOnWriteArrayList` takes this idea even further. To maximize read performance, read operations in `CopyOnWriteArrayList` require no locking at all. Even more impressively, write operations do not block read operations either—only write-write operations are mutually exclusive. As a result, read performance can be greatly improved.

The core of `CopyOnWriteArrayList`'s thread safety lies in its **Copy-On-Write** strategy, as is evident from the name `CopyOnWriteArrayList`.

When the contents of a `CopyOnWriteArrayList` need to be modified (operations such as `add`, `set`, `remove`), it does not modify the original array directly. Instead, it first creates a copy of the underlying array, modifies the copied array, and then assigns the modified array back. This ensures that write operations do not affect read operations.

For a detailed introduction to `CopyOnWriteArrayList`, please read my article: [`CopyOnWriteArrayList` Source Code Analysis](./../collection/copyonwritearraylist-source-code.md).

## ConcurrentLinkedQueue

Thread-safe `Queue` implementations provided by Java can be divided into **Blocking Queues** and **Non-blocking Queues**. A typical example of a Blocking Queue is `BlockingQueue`, and a typical example of a Non-blocking Queue is `ConcurrentLinkedQueue`. In practical applications, you should choose a Blocking Queue or a Non-blocking Queue according to your actual needs. **Blocking Queues can be implemented via locking, while Non-blocking Queues can be implemented via CAS operations.**

As its name suggests, `ConcurrentLinkedQueue` uses a linked list as its underlying data structure. `ConcurrentLinkedQueue` can be considered the highest-performing queue in high-concurrency environments. The reason it achieves such strong performance is its sophisticated internal implementation.

We will not analyze the internal code of `ConcurrentLinkedQueue` here; you only need to know that `ConcurrentLinkedQueue` primarily uses CAS non-blocking algorithms to achieve thread safety.

`ConcurrentLinkedQueue` is suitable for scenarios where relatively high performance is required and multiple threads simultaneously read from and write to the queue—that is, when the cost of locking the queue is relatively high, it is suitable to use the lock-free `ConcurrentLinkedQueue` instead.

## BlockingQueue

### Introduction to BlockingQueue

We just mentioned `ConcurrentLinkedQueue` as a high-performance non-blocking queue. Next, let's talk about the Blocking Queue—`BlockingQueue`. Blocking Queues (`BlockingQueue`) are widely used in the "Producer-Consumer" problem because `BlockingQueue` provides blocking insertion and removal methods. When the queue container is full, producer threads are blocked until the queue is no longer full; when the queue container is empty, consumer threads are blocked until the queue becomes non-empty.

`BlockingQueue` is an interface that extends `Queue`, so its implementation classes can also be used as implementations of `Queue`, which in turn extends the `Collection` interface. Below are the implementation classes related to `BlockingQueue`:

![BlockingQueue Implementation Classes](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/51622268-4ec848dd.png)

Below we mainly introduce 3 common `BlockingQueue` implementation classes: `ArrayBlockingQueue`, `LinkedBlockingQueue`, and `PriorityBlockingQueue`.

### ArrayBlockingQueue

`ArrayBlockingQueue` is a bounded queue implementation of the `BlockingQueue` interface, backed by an array.

```java
public class ArrayBlockingQueue<E>
extends AbstractQueue<E>
implements BlockingQueue<E>, Serializable{}
```

Once created, the capacity of an `ArrayBlockingQueue` cannot be changed. Its concurrency control uses the reentrant lock `ReentrantLock`; both insertion and retrieval operations require acquiring the lock before proceeding. When the queue reaches capacity, attempting to put an element into the queue causes the operation to block; attempting to take an element from an empty queue likewise blocks.

By default, `ArrayBlockingQueue` does not guarantee fairness for waiting threads accessing the queue. When a fair policy is enabled, the queue grants access to waiting producers or consumers in FIFO order when contention exists; this describes the waiting order within the queue and does not mean the OS strictly schedules threads by wall-clock time. In non-fair mode, threads that have been blocked for a long time may still fail to access the queue promptly. A fair policy typically reduces throughput; if needed, you can use the following code:

```java
private static ArrayBlockingQueue<Integer> blockingQueue = new ArrayBlockingQueue<Integer>(10,true);
```

### LinkedBlockingQueue

`LinkedBlockingQueue` is a Blocking Queue implemented internally based on a **singly linked list**. It can be used as either an unbounded queue or a bounded queue and also satisfies FIFO characteristics. Compared with `ArrayBlockingQueue`, it offers higher throughput. To prevent `LinkedBlockingQueue`'s capacity from growing rapidly and consuming a large amount of memory, you usually specify its size when creating a `LinkedBlockingQueue` object; if unspecified, its capacity defaults to `Integer.MAX_VALUE`.

**Relevant constructors:**

```java
    /**
     * An unbounded queue in a certain sense
     * Creates a {@code LinkedBlockingQueue} with a capacity of
     * {@link Integer#MAX_VALUE}.
     */
    public LinkedBlockingQueue() {
        this(Integer.MAX_VALUE);
    }

    /**
     * A bounded queue
     * Creates a {@code LinkedBlockingQueue} with the given (fixed) capacity.
     *
     * @param capacity the capacity of this queue
     * @throws IllegalArgumentException if {@code capacity} is not greater
     *         than zero
     */
    public LinkedBlockingQueue(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException();
        this.capacity = capacity;
        last = head = new Node<E>(null);
    }
```

### PriorityBlockingQueue

`PriorityBlockingQueue` is an unbounded Blocking Queue that supports priority ordering. By default, elements are sorted in natural order; you can also specify the sorting rule by having a custom class implement the `compareTo()` method, or by passing a `Comparator` constructor argument during initialization.

`PriorityBlockingQueue` uses a reentrant lock `ReentrantLock` for concurrency control and is an unbounded queue (`ArrayBlockingQueue` is a bounded queue, and `LinkedBlockingQueue` can also specify a maximum capacity by passing `capacity` in its constructor, whereas `PriorityBlockingQueue` can only specify an initial queue size and **automatically expands capacity if space becomes insufficient** when inserting elements later).

Simply put, it is the thread-safe version of `PriorityQueue`. Null values cannot be inserted; meanwhile, objects inserted into the queue must be comparable, otherwise a `ClassCastException` is thrown. Its insertion method `put` does not block because it is an unbounded queue (whereas the `take` method blocks when the queue is empty).

**Recommended article:** [Interpreting Java Concurrent Queue BlockingQueue](https://javadoop.com/post/java-concurrent-queue)

## ConcurrentSkipListMap

> The following content references the GeekTime column [*Beauty of Data Structures and Algorithms*](https://time.geekbang.org/column/intro/126?code=zl3GYeAsRI4rEJIBNu5B/km7LSZsPDlGWQEpAYw5Vu0=&utm_term=SPoster "Beauty of Data Structures and Algorithms") as well as *Practical Java High-Concurrency Programming Design*.

To introduce `ConcurrentSkipListMap`, let's first briefly understand skip lists.

For a singly linked list, even if the list is sorted, if we want to look up a piece of data in it, we can only traverse the list from head to tail, which naturally results in low efficiency. A skip list is different. A skip list is a data structure capable of fast lookups, somewhat similar to a balanced tree. Both can perform fast lookups on elements, but an important difference is: insertion into and deletion from a balanced tree often require a global rebalancing of the entire balanced tree, whereas insertion into and deletion from a skip list only require local operations on the data structure. The resulting benefit is: under high concurrency, you would need a global lock to ensure the thread safety of an entire balanced tree, whereas for a skip list, you only need partial locks. Thus, in a high-concurrency environment, you can achieve better performance. As for lookup performance, the time complexity of a skip list is also **O(log n)**, so among concurrent data structures, the JDK uses a skip list to implement a `Map`.

The essence of a skip list is maintaining multiple linked lists simultaneously, with the linked lists organized in layers:

![2-Level Index Skip List](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/93666217-abaee06c.jpg)

The lowest-level linked list maintains all elements within the skip list, and each upper-level linked list is a subset of the level below it.

The elements in all linked lists within the skip list are sorted. When searching, you can start from the top-level linked list. Once you find that the target element is smaller than the successor of the currently visited node (or the successor is null), you drop down to the next lower-level linked list and continue searching. In other words, during the lookup process, the search jumps forward in skips. As shown in the figure above, searching for element 18 in the skip list:

![Searching for Element 18 in a Skip List](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/32005738-4bbbf9bd.jpg)

Searching for 18 originally required 18 traversals, and now only requires 7. When the linked list is relatively long, the lookup efficiency improvement from building indices becomes very pronounced.

From the above, it is easy to see that **a skip list is an algorithm that trades space for time.**

Another difference between implementing a `Map` using a skip list and implementing a `Map` using a hash algorithm is: hashing does not preserve element order, whereas all elements in a skip list are sorted. Therefore, when iterating over a skip list, you obtain an ordered result. So if your application requires ordering, a skip list is your best choice. The class in the JDK that implements this data structure is `ConcurrentSkipListMap`.

## References

- *Practical Java High-Concurrency Programming Design*
- <https://javadoop.com/post/java-concurrent-queue>
- <https://juejin.im/post/5aeebd02518825672f19c546>
