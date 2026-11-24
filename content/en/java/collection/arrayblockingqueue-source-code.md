---
title: ArrayBlockingQueue Source Code Analysis
description: "Deep dive into ArrayBlockingQueue source code: bounded blocking queue implementation, Producer-Consumer pattern usage, ReentrantLock + Condition concurrency control, and ThreadPoolExecutor workQueue mechanism."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/arrayblockingqueue-source-code.md
head:
  - - meta
    - name: keywords
      content: ArrayBlockingQueue source code,Blocking Queue,bounded queue,Producer-Consumer pattern,ReentrantLock,Condition,thread pool workQueue
---

## Introduction to Blocking Queues

### History of Blocking Queues

The history of Java blocking queues dates back to JDK 1.5, when the Java platform introduced `java.util.concurrent`—commonly referred to as the JUC package—which includes various concurrency flow-control utilities, concurrent containers, atomic classes, and more. Naturally, this also includes the blocking queues discussed in this article.

To address data sharing across multiple threads in high-concurrency scenarios, JDK 1.5 introduced `ArrayBlockingQueue` and `LinkedBlockingQueue`, which are concurrent containers implemented with the Producer-Consumer pattern. Among them, `ArrayBlockingQueue` is a bounded queue: once the number of added elements reaches its upper limit, further additions either block or throw an exception. In contrast, `LinkedBlockingQueue` is a queue backed by a linked list; precisely because of the nature of linked lists, `LinkedBlockingQueue` does not impose as many constraints on adding elements as `ArrayBlockingQueue`, so configuring `LinkedBlockingQueue` as bounded is optional (note that "unbounded" here does not mean an arbitrary number of elements can be added, but rather that the default size of the queue is `Integer.MAX_VALUE`, which is virtually infinite).

`SynchronousQueue` and `DelayQueue` were also introduced in JDK 1.5, and JDK 1.7 added the `TransferQueue` interface supporting transfer operations.

### Philosophy Behind Blocking Queues

A blocking queue embodies the classic Producer-Consumer model and can achieve the following behaviors:

1. When the blocking queue is empty, all consumer threads are blocked, waiting for the queue to become non-empty.
2. After a producer puts data into the queue, the queue notifies consumers that the queue is non-empty, and consumers can then proceed to consume elements.
3. When the blocking queue becomes full and cannot accommodate new elements—because consumers consume too slowly or producers insert elements too quickly—the producer is blocked, waiting for the queue to become non-full before continuing to insert elements.
4. After a consumer consumes an element from the queue, the queue notifies producers that the queue is non-full, and producers can continue adding data.

In summary: a blocking queue coordinates interactions between producers and consumers based on two conditions—not-empty and not-full. Although the implementation of these interaction flows and wait/notify mechanisms is very complex, Doug Lea has fortunately encapsulated all the details of blocking queues, so we only need to call APIs such as `put`, `take`, `offer`, and `poll` to achieve multi-threaded production and consumption.

This also gives blocking queues wide application in multi-threaded development. The most common example is our Thread Pool; from its source code we can see that when core threads cannot process tasks promptly, those tasks are all placed into `workQueue`.

```java
public ThreadPoolExecutor(int corePoolSize,
                            int maximumPoolSize,
                            long keepAliveTime,
                            TimeUnit unit,
                            BlockingQueue<Runnable> workQueue,
                            ThreadFactory threadFactory,
                            RejectedExecutionHandler handler) {// ...}
```

## Common Methods and Testing of ArrayBlockingQueue

After briefly reviewing the history of blocking queues, let's begin focusing on the concurrent container featured in this article—`ArrayBlockingQueue`. To gain a deeper understanding of `ArrayBlockingQueue` later on, let's first learn how `ArrayBlockingQueue` is used based on the following examples.

Let's look at the first example. Here we will use two threads to simulate a producer and a consumer respectively. After producing elements, the producer uses the `put` method to produce 10 elements for the consumer to consume; when the queue elements reach our configured upper limit of 5, the `put` method will block.
Similarly, the consumer consumes elements via the `take` method; when the queue is empty, the `take` method blocks the consumer thread. Here, to ensure the consumer can exit promptly after consuming all 10 elements, I use a `CountDownLatch` to control when the consumer finishes. The producer here only produces 10 elements; once the consumer finishes consuming all 10 elements and counts down the latch, all threads will stop.

```java
public class ProducerConsumerExample {

    public static void main(String[] args) throws InterruptedException {

        // Create an ArrayBlockingQueue with capacity 5
        ArrayBlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);

        // Create the producer thread
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    // Add an element to the queue; block and wait if the queue is full
                    queue.put(i);
                    System.out.println("Producer added element: " + i);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

        });

        CountDownLatch countDownLatch = new CountDownLatch(1);

        // Create the consumer thread
        Thread consumer = new Thread(() -> {
            try {
                int count = 0;
                while (true) {

                    // Retrieve an element from the queue; block and wait if the queue is empty
                    int element = queue.take();
                    System.out.println("Consumer took element: " + element);
                    ++count;
                    if (count == 10) {
                        break;
                    }
                }

                countDownLatch.countDown();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

        });

        // Start the threads
        producer.start();
        consumer.start();

        // Wait for the threads to finish
        producer.join();
        consumer.join();

        countDownLatch.await();

        producer.interrupt();
        consumer.interrupt();
    }

}
```

The output of the code is shown below. As you can see, the consumer can only consume after the producer puts elements into the queue, which means that when there is no data in the queue, the consumer blocks and waits for the queue to become non-empty before continuing to consume.

```cpp
Producer added element: 1
Producer added element: 2
Consumer took element: 1
Consumer took element: 2
Producer added element: 3
Consumer took element: 3
Producer added element: 4
Producer added element: 5
Consumer took element: 4
Producer added element: 6
Consumer took element: 5
Producer added element: 7
Producer added element: 8
Producer added element: 9
Producer added element: 10
Consumer took element: 6
Consumer took element: 7
Consumer took element: 8
Consumer took element: 9
Consumer took element: 10
```

After understanding the blocking insertion and retrieval methods `put` and `take`, let's look at the non-blocking enqueue and dequeue methods `offer` and `poll` in a blocking queue.

As shown below, we configure a blocking queue of size 3, attempt to store 4 elements into the queue using the `offer` method, and then attempt to retrieve 4 times from the queue using `poll`.

```cpp
public class OfferPollExample {

    public static void main(String[] args) {
        // Create an ArrayBlockingQueue with capacity 3
        ArrayBlockingQueue<String> queue = new ArrayBlockingQueue<>(3);

        // Add elements to the queue
        System.out.println(queue.offer("A"));
        System.out.println(queue.offer("B"));
        System.out.println(queue.offer("C"));

        // Attempt to add an element to the queue, but the queue is full, so return false
        System.out.println(queue.offer("D"));

        // Retrieve elements from the queue
        System.out.println(queue.poll());
        System.out.println(queue.poll());
        System.out.println(queue.poll());

        // Attempt to retrieve an element from the queue, but the queue is empty, so return null
        System.out.println(queue.poll());
    }

}
```

The final output of the code is shown below. As you can see, because the size of the queue is 3, our first 3 insertions into the queue return `true`, and on the 4th insertion, because the queue is full, the insertion result returns `false`. This is also why our subsequent `poll` calls only obtained 3 element values.

```cpp
true
true
true
false
A
B
C
null
```

After understanding blocking and non-blocking insertion/retrieval, let's look at a rather special operation of blocking queues. In certain scenarios, we want to dump all contents of a blocking queue into a list at once before performing batch operations. In such cases, we can use the blocking queue's `drainTo` method. This method moves all elements in the queue into a list in one go: if there are elements in the queue and they are successfully stored into the list, `drainTo` returns the number of elements transferred to the list this time; conversely, if the queue is empty, `drainTo` returns `0` directly.

```java
public class DrainToExample {

    public static void main(String[] args) {
        // Create an ArrayBlockingQueue with capacity 5
        ArrayBlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);

        // Add elements to the queue
        queue.add(1);
        queue.add(2);
        queue.add(3);
        queue.add(4);
        queue.add(5);

        // Create a List to store elements retrieved from the queue
        List<Integer> list = new ArrayList<>();

        // Retrieve all elements from the queue and add them to the List
        queue.drainTo(list);

        // Print elements in the List
        System.out.println(list);
    }

}
```

The output of the code is as follows:

```cpp
[1, 2, 3, 4, 5]
```

## ArrayBlockingQueue Source Code Analysis

Now that we have a basic impression of how blocking queues are used, we can proceed to understand the internal working mechanism of `ArrayBlockingQueue` in greater detail.

### Overall Design

Before learning the concrete details of `ArrayBlockingQueue`, let's first examine the class diagram of `ArrayBlockingQueue`.

![ArrayBlockingQueue Class Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/arrayblockingqueue-class-diagram-55a92a80.png)

From the diagram we can see that `ArrayBlockingQueue` implements the `BlockingQueue` interface. It is not hard to guess that by implementing the `BlockingQueue` interface, `ArrayBlockingQueue` gains the common behavioral operations of a blocking queue.

At the same time, `ArrayBlockingQueue` also extends the abstract class `AbstractQueue`, which extends `AbstractCollection` and implements `Queue`. From the characteristics and semantics of this abstract class, we can also see that this inheritance relationship gives `ArrayBlockingQueue` common queue operations.

So can we draw such a conclusion: by extending `AbstractQueue`, it obtains all the operational templates for queues, which implement the overall framework for enqueue and dequeue operations. Then `ArrayBlockingQueue` implements `BlockingQueue` to obtain the common blocking queue operations and fills the implementations of those operations into the details of `AbstractQueue`'s template methods, thereby making `ArrayBlockingQueue` a complete blocking queue.

To verify this, let's check the source code. First let's look at `AbstractQueue`. From the class inheritance relationship, we can roughly conclude that it acquires common collection operations through `AbstractCollection` and queue characteristics through the `Queue` interface.

```java
public abstract class AbstractQueue<E>
    extends AbstractCollection<E>
    implements Queue<E> {
       //...
}
```

Operations on a collection are essentially adding, removing, modifying, and querying, so let's start from the `add` method. From the source code we can see that it implements `AbstractCollection`'s `add` method with the following internal logic:

1. Call the `offer` method inherited from the `Queue` interface; if `offer` succeeds, return `true`.
2. If `offer` fails, meaning the current element failed to enqueue, throw an exception directly.

```java
public boolean add(E e) {
  if (offer(e))
      return true;
  else
      throw new IllegalStateException("Queue full");
}
```

However, `AbstractQueue` does not implement `Queue`'s `offer` method. Clearly, the purpose is to define the core logic of `add` and leave the details of `offer` to its subclasses—namely our `ArrayBlockingQueue`—to implement.

With that, our analysis of the abstract class `AbstractQueue` is complete. Let's continue looking at another important interface implemented by `ArrayBlockingQueue`: `BlockingQueue`.

Opening `BlockingQueue`, we can see that this interface also extends the `Queue` interface, which means it also possesses all the behaviors of a queue. At the same time, it defines the methods that it requires implementations to provide.

```java
public interface BlockingQueue<E> extends Queue<E> {

     // Returns true if the element is enqueued successfully; otherwise throws IllegalStateException
    boolean add(E e);

     // Returns true if the element is enqueued successfully; otherwise returns false
    boolean offer(E e);

     // Returns immediately if the element is enqueued successfully; if the queue is full and the element cannot be enqueued, blocks the thread; because it may be interrupted while blocked, the method signature throws InterruptedException
    void put(E e) throws InterruptedException;

   // Same as the previous method, except when the queue is full it only blocks for a duration of timeout in unit; if enqueueing fails within the wait duration, returns false directly
    boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException;

    // Retrieves an element from the head of the queue; blocks and waits if the queue is empty; because it blocks the thread, the method may be interrupted, so the signature defines InterruptedException
    E take() throws InterruptedException;

      // Retrieves and returns the head element of the queue; if the queue is currently empty, blocks and waits for timeout in unit; if there is no element during this period, returns null directly
    E poll(long timeout, TimeUnit unit)
        throws InterruptedException;

      // Gets the remaining capacity of the queue
    int remainingCapacity();

     // Removes our specified object; returns true if successful, otherwise false
    boolean remove(Object o);

    // Checks whether the queue contains the specified element
    public boolean contains(Object o);

     // Stores all elements from the queue into the specified collection
    int drainTo(Collection<? super E> c);

    // Transfers up to maxElements elements into the collection
    int drainTo(Collection<? super E> c, int maxElements);
}
```

After understanding the common operations of `BlockingQueue`, we know that `ArrayBlockingQueue` implements and overrides the methods of `BlockingQueue` and fills them into `AbstractQueue`'s methods. Thus we know where the `offer` method in `AbstractQueue`'s `add` method above is implemented.

```java
public boolean add(E e) {
  // AbstractQueue's offer comes from the lower-level ArrayBlockingQueue implementing and overriding BlockingQueue's offer method
  if (offer(e))
      return true;
  else
      throw new IllegalStateException("Queue full");
}
```

### Initialization

Before exploring the details of `ArrayBlockingQueue`, let's look at its constructors to understand its initialization process. From the source code we can see that `ArrayBlockingQueue` has 3 constructors, and the most core constructor is the one below.

```java
// capacity indicates initial queue capacity; fair indicates lock fairness
public ArrayBlockingQueue(int capacity, boolean fair) {
  // If the configured queue size is less than 0, throw IllegalArgumentException directly
  if (capacity <= 0)
      throw new IllegalArgumentException();
  // Initialize an array to store queue elements
  this.items = new Object[capacity];
  // Create the lock for flow control of the blocking queue
  lock = new ReentrantLock(fair);
  // Create two conditions with lock to control queue production and consumption
  notEmpty = lock.newCondition();
  notFull =  lock.newCondition();
}
```

In this constructor, there are two fairly core member variables `notEmpty` (not empty) and `notFull` (not full) that require special attention. They are the key to achieving orderly cooperation between producers and consumers, which I will explain in detail in the subsequent source code analysis. Here we only need an initial understanding of the construction of the blocking queue.

The other two constructors are both built on top of the constructor above. By default, we use the following constructor, which means `ArrayBlockingQueue` uses a non-fair lock—that is, after various producer or consumer threads receive notifications, competition for the lock is random.

```java
 public ArrayBlockingQueue(int capacity) {
        this(capacity, false);
    }
```

There is also a less commonly used constructor. After initializing capacity and lock fairness, it also provides a `Collection` parameter. From the source code, it is easy to see that this constructor directly places the elements of the externally passed collection into the blocking queue during initialization.

```java
public ArrayBlockingQueue(int capacity, boolean fair,
                              Collection<? extends E> c) {
  // Initialize capacity and lock fairness
  this(capacity, fair);

  final ReentrantLock lock = this.lock;
  // Acquire lock and store elements of c into ArrayBlockingQueue's backing array
  lock.lock();
  try {
      int i = 0;
      try {
                // Iterate and add elements into the array
          for (E e : c) {
              checkNotNull(e);
              items[i++] = e;
          }
      } catch (ArrayIndexOutOfBoundsException ex) {
          throw new IllegalArgumentException();
      }
      // Record current queue element count
      count = i;
                      // Update the position in the queue's backing array for the next addition via put, offer, or add
      putIndex = (i == capacity) ? 0 : i;
  } finally {
      // Release lock after completing iteration
      lock.unlock();
  }
}
```

### Blocking Retrieval and Insertion of Elements

Blocking retrieval and insertion in `ArrayBlockingQueue` correspond to the Producer-Consumer model. Although it also supports non-blocking retrieval and insertion (such as the `poll()` and `offer(E e)` methods, which will be introduced later), they are generally not used.

The blocking retrieval and insertion methods of `ArrayBlockingQueue` are:

- `put(E e)`: Inserts an element into the queue. If the queue is full, this method blocks until space is available in the queue or the thread is interrupted.
- `take()`: Retrieves and removes the head element of the queue. If the queue is empty, this method blocks until the queue is non-empty or the thread is interrupted.

The key to implementing these two methods lies in the two condition objects `notEmpty` (not empty) and `notFull` (not full), which we mentioned in the constructor above.

Next, I will use two diagrams to help you understand how these two conditions are utilized in a blocking queue.

![ArrayBlockingQueue notEmpty Condition](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-notEmpty-take-09a7e944.png)

Suppose in our code the consumer starts first. When it discovers there is no data in the queue, the not-empty condition suspends this thread—that is, it suspends while waiting for the condition to become non-empty. Then CPU execution reaches the producer; the producer sees that data can be stored in the queue, stores the data, and notifies that the condition is now non-empty. At this moment, the consumer is awakened to retrieve values from the queue using `take` or similar methods.

![ArrayBlockingQueue notFull Condition](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-notFull-put-8854a63b.png)

During subsequent execution, the producer's production speed far exceeds the consumer's consumption speed, so after filling the queue, the producer attempts to store data into the queue again and finds the queue is full. Thus the blocking queue suspends the current thread to wait for the queue to be non-full. Then the consumer holds CPU execution and consumes an element, so the queue can store new data again and issues a non-full notification. At this point, the suspended producer waits for CPU execution to arrive and attempts to store data into the queue again.

After briefly understanding the interaction flow of a blocking queue based on these two conditions, let's examine the source code of the `put` and `take` methods.

```java
public void put(E e) throws InterruptedException {
    // Ensure the inserted element is not null
    checkNotNull(e);
    // Acquire lock
    final ReentrantLock lock = this.lock;
    // lockInterruptibly() is used here instead of lock() to respond to interrupt operations; if interrupted while waiting to acquire the lock, this method throws InterruptedException
    lock.lockInterruptibly();
    try {
            // If count equals the array length, the queue is full; the current thread is suspended and placed into the AQS queue, waiting to insert when the queue is non-full (not-full condition)
       // During the wait, the lock is released so other threads can continue operating on the queue
        while (count == items.length)
            notFull.await();
           // If the queue can accommodate elements, call enqueue to enqueue the element
        enqueue(e);
    } finally {
        // Release lock
        lock.unlock();
    }
}
```

Internally, `put` calls the `enqueue` method to enqueue the element. Let's look further into the implementation details of `enqueue`:

```java
private void enqueue(E x) {
   // Get the backing array of the queue
    final Object[] items = this.items;
    // Set the value at putIndex to the passed-in x
    items[putIndex] = x;
    // Update putIndex; if putIndex equals the array length, reset it to 0
    if (++putIndex == items.length)
        putIndex = 0;
    // Queue length + 1
    count++;
    // Notify that the queue is non-empty so threads blocked on retrieving elements can continue working
    notEmpty.signal();
}
```

From the source code, we can see that the logic of the enqueue operation is to append a new element in the array. The overall execution steps are:

1. Obtain `ArrayBlockingQueue`'s backing array `items`.
2. Store the element at the `putIndex` position.
3. Update `putIndex` to the next position; if `putIndex` equals the queue length, it means `putIndex` has reached the end of the array, so the next insertion must start from `0`. (`ArrayBlockingQueue` uses the concept of a circular queue, i.e., cyclically reusing a single array from beginning to end.)
4. Update the value of `count`, indicating the current queue length increased by 1.
5. Call `notEmpty.signal()` to notify that the queue is non-empty, so consumers can retrieve values from the queue.

With that, we have understood the flow of the `put` method. To understand `ArrayBlockingQueue`'s design for the Producer-Consumer model more completely, let's continue looking at the `take` method for blocking retrieval of queue elements.

```java
public E take() throws InterruptedException {
       // Acquire lock
     final ReentrantLock lock = this.lock;
     lock.lockInterruptibly();
     try {
             // If the number of elements in the queue is 0, suspend the current thread and store it in the AQS queue, waiting to retrieve and remove an element when the queue is non-empty (not-empty condition)
         while (count == 0)
             notEmpty.await();
            // If the queue is not empty, call dequeue to retrieve the element
         return dequeue();
     } finally {
          // Release lock
         lock.unlock();
     }
}
```

Once you understand `put`, looking at `take` is very simple—its core logic is the exact opposite of `put`. For example, `put` waits for the queue to be non-full when full before inserting an element (not-full condition), whereas `take` waits for the queue to be non-empty when empty before retrieving and removing an element (not-empty condition).

Internally, `take` calls the `dequeue` method to dequeue an element, and its core logic is likewise the opposite of `enqueue`.

```java
private E dequeue() {
  // Get the backing array of the blocking queue
  final Object[] items = this.items;
  @SuppressWarnings("unchecked")
  // Retrieve the element at takeIndex from the queue
  E x = (E) items[takeIndex];
  // Set takeIndex slot to null
  items[takeIndex] = null;
  // Advance takeIndex forward; if it equals the array length, reset it to 0
  if (++takeIndex == items.length)
      takeIndex = 0;
  // Decrement queue length by 1
  count--;
  if (itrs != null)
      itrs.elementDequeued();
  // Notify those waiting threads that the queue is currently not full and can continue storing elements
  notFull.signal();
  return x;
}
```

Because the steps of the `dequeue` method (dequeuing) are roughly similar to the `enqueue` method (enqueuing) introduced above, we will not repeat them here.

To help with understanding, I drew a diagram showing how the two condition objects `notEmpty` (not empty) and `notFull` (not full) control storing into and taking from `ArrayBlockingQueue`.

![ArrayBlockingQueue notEmpty and notFull](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-notEmpty-notFull-c0b39e45.png)

- **Consumer**: When a consumer removes an element from the queue through `take`, `poll`, or other operations, it notifies that the queue is non-full. At that time, producers waiting on non-full are awakened and wait to acquire a CPU time slice to perform the enqueue operation.
- **Producer**: When a producer puts an element into the queue, it triggers a non-empty notification. At that time, consumers are awakened and wait for a CPU time slice to attempt retrieving an element. Back and forth like this, the two condition objects form a loop controlling multi-threaded insertion and retrieval.

### Non-Blocking Retrieval and Insertion of Elements

The non-blocking retrieval and insertion methods of `ArrayBlockingQueue` are:

- `offer(E e)`: Inserts an element at the tail of the queue. If the queue is full, this method immediately returns `false` without waiting and blocking the thread.
- `poll()`: Retrieves and removes the head element of the queue. If the queue is empty, this method immediately returns `null` without waiting and blocking the thread.
- `add(E e)`: Inserts an element at the tail of the queue. If the queue is full, it throws an `IllegalStateException`; internally it is based on the `offer(E e)` method.
- `remove()`: Removes the head element of the queue. If the queue is empty, it throws a `NoSuchElementException`; internally it is based on `poll()`.
- `peek()`: Retrieves, without removing, the head element of the queue. If the queue is empty, this method immediately returns `null` without waiting and blocking the thread.

First let's look at the `offer` method. Its logic is similar to `put`, with the only difference being that when enqueueing fails, it does not block the current thread, and instead directly returns `false`.

```java
public boolean offer(E e) {
        // Ensure the inserted element is not null
        checkNotNull(e);
        // Acquire lock
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
             // Return false immediately if the queue is full
            if (count == items.length)
                return false;
            else {
                // Otherwise enqueue the element and return true immediately
                enqueue(e);
                return true;
            }
        } finally {
            // Release lock
            lock.unlock();
        }
    }
```

The `poll` method works the same way: when retrieving an element fails, it also returns `null` directly without blocking the thread trying to retrieve the element.

```java
public E poll() {
        final ReentrantLock lock = this.lock;
        // Acquire lock
        lock.lock();
        try {
            // If the queue is empty, return null immediately; otherwise dequeue and return the element value
            return (count == 0) ? null : dequeue();
        } finally {
            lock.unlock();
        }
    }
```

The `add` method is actually just a wrapper layer over `offer`. As shown in the code below, `add` calls the untimed `offer` and directly throws an exception if enqueueing fails.

```java
public boolean add(E e) {
        return super.add(e);
    }


public boolean add(E e) {
        // Call offer and throw an exception directly if it fails
        if (offer(e))
            return true;
        else
            throw new IllegalStateException("Queue full");
    }
```

The `remove` method works the same way: it calls `poll`, and if it returns `null`, that indicates the queue has no elements, so it throws an exception directly.

```java
public E remove() {
        E x = poll();
        if (x != null)
            return x;
        else
            throw new NoSuchElementException();
    }
```

The logic of the `peek()` method is also very simple; internally it calls the `itemAt` method.

```java
public E peek() {
        // Acquire lock
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            // Returns null when the queue is empty
            return itemAt(takeIndex);
        } finally {
            // Release lock
            lock.unlock();
        }
    }

// Return the element at the specified position in the queue
@SuppressWarnings("unchecked")
final E itemAt(int i) {
    return (E) items[i];
}
```

### Timed Blocking Retrieval and Insertion of Elements

On top of the non-blocking retrieval and insertion methods `offer(E e)` and `poll()`, the designers provided `offer(E e, long timeout, TimeUnit unit)` and `poll(long timeout, TimeUnit unit)` with wait durations, used for adding and retrieving elements in a blocking manner within a specified timeout.

```java
 public boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException {

        checkNotNull(e);
        long nanos = unit.toNanos(timeout);
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
        // Queue is full, enter the loop
            while (count == items.length) {
            // Time is up and queue is still full, return false immediately
                if (nanos <= 0)
                    return false;
                 // Block for nanos time, waiting for non-full
                nanos = notFull.awaitNanos(nanos);
            }
            enqueue(e);
            return true;
        } finally {
            lock.unlock();
        }
    }
```

As you can see, when the queue is full, the `offer` method with a timeout waits for the time period passed by the user; if it still cannot insert the element within the specified time, it returns `false` directly.

```java
public E poll(long timeout, TimeUnit unit) throws InterruptedException {
        long nanos = unit.toNanos(timeout);
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
          // Queue is empty, loop and wait; if time is up and still empty, return null immediately
            while (count == 0) {
                if (nanos <= 0)
                    return null;
                nanos = notEmpty.awaitNanos(nanos);
            }
            return dequeue();
        } finally {
            lock.unlock();
        }
    }
```

Similarly, the `poll` method with a timeout works the same way: when the queue is empty, it waits for the specified time, and if it is still empty when the time expires, it returns `null` directly.

### Checking Whether an Element Exists

`ArrayBlockingQueue` provides `contains(Object o)` to check whether a specified element exists in the queue.

```java
public boolean contains(Object o) {
    // If target element is null, return false immediately
    if (o == null) return false;
    // Get the element array of the current queue
    final Object[] items = this.items;
    // Acquire lock
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        // If the queue is non-empty
        if (count > 0) {
            final int putIndex = this.putIndex;
            // Start traversing from the head of the queue
            int i = takeIndex;
            do {
                if (o.equals(items[i]))
                    return true;
                if (++i == items.length)
                    i = 0;
            } while (i != putIndex);
        }
        return false;
    } finally {
        // Release lock
        lock.unlock();
    }
}
```

## Comparison of ArrayBlockingQueue Retrieval and Insertion Methods

To help understand `ArrayBlockingQueue`, let's compare the retrieval and insertion methods mentioned above.

Inserting elements:

| Method                                    | Handling When Queue Is Full                                                      | Return Value |
| ----------------------------------------- | -------------------------------------------------------------------------------- | ------------ |
| `put(E e)`                                | Blocks thread until interrupted or awakened                                      | void         |
| `offer(E e)`                              | Returns false immediately                                                        | boolean      |
| `offer(E e, long timeout, TimeUnit unit)` | Blocks within specified timeout; returns false if not added after specified time | boolean      |
| `add(E e)`                                | Throws `IllegalStateException` immediately                                       | boolean      |

Retrieving/removing elements:

| Method                              | Handling When Queue Is Empty                                           | Return Value |
| ----------------------------------- | ---------------------------------------------------------------------- | ------------ |
| `take()`                            | Blocks thread until interrupted or awakened                            | E            |
| `poll()`                            | Returns null                                                           | E            |
| `poll(long timeout, TimeUnit unit)` | Blocks within specified timeout; returns null if still empty after     | E            |
| `peek()`                            | Returns null                                                           | E            |
| `remove()`                          | Throws `NoSuchElementException` immediately                            | boolean      |

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/ArrayBlockingQueue-get-add-element-methods-75b69ca9.png)

## ArrayBlockingQueue Interview Questions

### What is ArrayBlockingQueue? What are its characteristics?

`ArrayBlockingQueue` is a bounded queue implementation class of the `BlockingQueue` interface, commonly used for data sharing across multiple threads. Internally it is backed by an array, as can be seen from its name.

`ArrayBlockingQueue` has a limited capacity; once created, its capacity cannot be changed.

To guarantee thread safety, `ArrayBlockingQueue` uses the Reentrant Lock `ReentrantLock` for concurrency control—whether performing an insertion operation or a read operation, the lock must be acquired before proceeding. Moreover, it supports both fair and non-fair lock access modes, with non-fair lock as the default.

Although named a blocking queue, `ArrayBlockingQueue` also supports non-blocking retrieval and insertion (for example, `poll()` and `offer(E e)`). When the queue is full, `offer(E e)` returns `false`; when the queue is empty, `poll()` returns `null`.

### What are the differences between ArrayBlockingQueue and LinkedBlockingQueue?

`ArrayBlockingQueue` and `LinkedBlockingQueue` are two commonly used blocking queue implementations in the Java concurrency package, and both are thread-safe. However, there are also the following differences between them:

- Underlying implementation: `ArrayBlockingQueue` is backed by an array, whereas `LinkedBlockingQueue` is backed by a linked list.
- Bounded vs. unbounded: `ArrayBlockingQueue` is a bounded queue whose capacity size must be specified at creation time. `LinkedBlockingQueue` can be created without specifying a capacity size, defaulting to `Integer.MAX_VALUE`, which is unbounded. However, a queue size can also be specified to make it bounded.
- Lock separation: Locks in `ArrayBlockingQueue` are not separated—that is, production and consumption use the same lock; locks in `LinkedBlockingQueue` are separated—that is, production uses `putLock` and consumption uses `takeLock`, which prevents lock contention between producer and consumer threads.
- Memory footprint: `ArrayBlockingQueue` needs to allocate array memory in advance, whereas `LinkedBlockingQueue` dynamically allocates linked-list node memory. This means `ArrayBlockingQueue` occupies a certain amount of memory space upon creation—and often allocates more memory than is actually used—whereas `LinkedBlockingQueue` gradually occupies memory space as elements are added.

### What are the differences between ArrayBlockingQueue and ConcurrentLinkedQueue?

`ArrayBlockingQueue` and `ConcurrentLinkedQueue` are two commonly used queue implementations in the Java concurrency package, and both are thread-safe. However, there are also the following differences between them:

- Underlying implementation: `ArrayBlockingQueue` is backed by an array, whereas `ConcurrentLinkedQueue` is backed by a linked list.
- Bounded vs. unbounded: `ArrayBlockingQueue` is a bounded queue whose capacity size must be specified at creation time, whereas `ConcurrentLinkedQueue` is an unbounded queue whose capacity can grow dynamically.
- Blocking support: `ArrayBlockingQueue` supports both blocking and non-blocking ways to retrieve and insert elements (typically only the former is used), whereas `ConcurrentLinkedQueue` is unbounded and only supports non-blocking retrieval and insertion.

### What is the implementation principle of ArrayBlockingQueue?

The implementation principle of `ArrayBlockingQueue` mainly consists of the following points (explained here using blocking retrieval and insertion as an example):

- `ArrayBlockingQueue` internally maintains a fixed-length array for storing elements.
- It synchronizes read and write operations by using a `ReentrantLock` lock object—that is, achieving thread safety through a locking mechanism.
- It implements waiting and waking operations between threads through `Condition`.

Here is a more detailed introduction to the concrete implementation of waiting and waking between threads (there is no need to memorize specific method names; covering the key points is sufficient in an interview):

- When the queue is full, producer threads call `notFull.await()` to put the producer into wait mode, waiting to insert when the queue becomes non-full (the not-full condition).
- When the queue is empty, consumer threads call `notEmpty.await()` to put the consumer into wait mode, waiting to consume when the queue becomes non-empty (the not-empty condition).
- When a new element is added, the producer thread calls `notEmpty.signal()` to wake up consumer threads waiting to consume.
- When an element is removed from the queue, the consumer thread calls `notFull.signal()` to wake up producer threads waiting to insert elements.

Additional notes on the `Condition` interface:

> `Condition` was only introduced in JDK 1.5 and onward. It offers great flexibility—for instance, it can implement multi-way notification, meaning multiple `Condition` instances (i.e., object monitors) can be created within one `Lock` object. **Thread objects can be registered on designated `Condition` instances, enabling selective thread notification and greater flexibility in thread scheduling. When using `notify()/notifyAll()` for notification, the thread to be notified is chosen by the JVM, whereas combining `ReentrantLock` with `Condition` instances enables "selective notification"**—a crucial feature provided by default by the `Condition` interface. By contrast, the `synchronized` keyword is equivalent to having only a single `Condition` instance in the entire `Lock` object, with all threads registered on that one instance. Executing `notifyAll()` will notify all waiting threads, causing major efficiency issues; whereas a `Condition` instance's `signalAll()` method only wakes up all waiting threads registered on that specific `Condition` instance.

## References

- Deep Dive into Java Series | Detailed Usage of BlockingQueue: <https://juejin.cn/post/6999798721269465102>
- Demystifying BlockingQueue and Its Classic Implementation ArrayBlockingQueue: <https://zhuanlan.zhihu.com/p/539619957>
- Concurrent Programming Crash Course: Underlying Principles and Practice of ArrayBlockingQueue: <https://zhuanlan.zhihu.com/p/339662987>
