---
title: Detailed Explanation of Java Thread Pools
description: "Detailed explanation of Java thread pools: in-depth coverage of ThreadPoolExecutor core parameter configuration, the Executor framework hierarchy, task queue selection, rejection policies, thread pool working principles, and best practices."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/java-thread-pool-summary.md
head:
  - - meta
    - name: keywords
      content: Java Thread Pool,ThreadPoolExecutor,Executor Framework,Thread Pool Parameters,Rejection Policy,Task Queue,Thread Pool Principle
---

<!-- markdownlint-disable MD024 -->

Pooling technology is surely familiar to everyone—thread pools, database connection pools, HTTP connection pools, and the like are all applications of this idea. The core idea of pooling technology is mainly to reduce the overhead of acquiring resources each time and to improve resource utilization.

In this article, I will introduce the basic concepts and core principles of thread pools in detail.

## Introduction to Thread Pools

Pooling technology is surely familiar to everyone—thread pools, database connection pools, HTTP connection pools, and the like are all applications of this idea. The core idea of pooling technology is mainly to reduce the overhead of acquiring resources each time and to improve resource utilization.

A thread pool provides a way to limit and manage resources (including executing a task). Each thread pool also maintains some basic statistical information, such as the number of completed tasks. Using a thread pool mainly brings the following benefits:

1. **Reduce resource consumption**: Threads in a thread pool can be reused. Once a thread finishes a task, it is not destroyed immediately; instead, it returns to the pool to wait for the next task. This avoids the overhead caused by frequently creating and destroying threads.
2. **Improve response speed**: Because a thread pool typically maintains a certain number of core threads (or "resident workers"), when a task arrives, it can be handed directly to these already-existing idle threads for execution, eliminating the time needed to create threads and allowing tasks to be processed faster.
3. **Improve thread manageability**: A thread pool allows us to manage threads in the pool uniformly. We can configure the size of the thread pool (core pool size, maximum pool size), the type and size of the task queue, the rejection policy, and so on. This controls the total number of concurrent threads, prevents resource exhaustion, and ensures system stability. At the same time, thread pools usually provide monitoring interfaces, making it convenient to understand the runtime status of the thread pool (such as how many active threads there are, how many tasks are queued, etc.) for easier tuning.

## Introduction to the Executor Framework

The `Executor` framework was introduced in Java 5. Since Java 5, starting threads via `Executor` is better than using `Thread`'s `start` method: besides being easier to manage and more efficient (implemented with a thread pool to save overhead), there is also a key advantage—it helps avoid the `this` escape problem.

> `this` escape refers to the situation where other threads hold a reference to an object before its constructor returns; calling methods on an object that has not finished constructing can trigger puzzling errors.

The `Executor` framework not only includes thread pool management, but also provides thread factories, queues, rejection policies, and more. The `Executor` framework makes concurrent programming much simpler.

The `Executor` framework structure mainly consists of three major parts:

**1. Tasks (`Runnable` / `Callable`)**

Executing a task requires implementing the **`Runnable` interface** or the **`Callable` interface**. Implementation classes of either the **`Runnable` interface** or the **`Callable` interface** can be executed by **`ThreadPoolExecutor`** or **`ScheduledThreadPoolExecutor`**.

**2. Task Execution (`Executor`)**

As shown in the figure below, this includes **`Executor`**, the core interface of the task execution mechanism, as well as the **`ExecutorService` interface** which extends the `Executor` interface. The two key classes **`ThreadPoolExecutor`** and **`ScheduledThreadPoolExecutor`** implement the **`ExecutorService`** interface.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/executor-class-diagram-7f84e326.png)

Many underlying class relationships are shown here, but in practice we need to focus more on the `ThreadPoolExecutor` class, because this class is used very frequently when we actually work with thread pools.

**Note:** By inspecting the `ScheduledThreadPoolExecutor` source code, we find that `ScheduledThreadPoolExecutor` actually extends `ThreadPoolExecutor` and implements `ScheduledExecutorService`, while `ScheduledExecutorService` extends `ExecutorService`, just as shown in the class diagram above.

`ThreadPoolExecutor` class declaration:

```java
// AbstractExecutorService implements the ExecutorService interface
public class ThreadPoolExecutor extends AbstractExecutorService
```

`ScheduledThreadPoolExecutor` class declaration:

```java
// ScheduledExecutorService extends the ExecutorService interface
public class ScheduledThreadPoolExecutor
        extends ThreadPoolExecutor
        implements ScheduledExecutorService
```

**3. Results of Asynchronous Computation (`Future`)**

The **`Future`** interface and its implementation class **`FutureTask`** can both represent the result of an asynchronous computation.

When we submit an implementation class of the **`Runnable` interface** or **`Callable` interface** to **`ThreadPoolExecutor`** or **`ScheduledThreadPoolExecutor`** for execution, calling `submit()` returns an object that implements the `Future` interface. The concrete implementation is not necessarily `FutureTask`; for example, a scheduled thread pool returns a corresponding `RunnableScheduledFuture` implementation.

**Schematic diagram of using the `Executor` framework**:

![Schematic diagram of using the Executor framework](/media/jg/local/java/concurrent/images/java-thread-pool-summary/Executor-f61bc9.png)

1. The main thread first creates a task object that implements the `Runnable` or `Callable` interface.
2. The created object implementing `Runnable`/`Callable` is handed directly to `ExecutorService` for execution: `ExecutorService.execute(Runnable command)`, or the `Runnable` object or `Callable` object can be submitted to `ExecutorService` for execution (`ExecutorService.submit(Runnable task)` or `ExecutorService.submit(Callable<T> task)`).
3. If `ExecutorService.submit(...)` is executed, `ExecutorService` returns an object implementing the `Future` interface. Since `FutureTask` implements both `Runnable` and `Future`, we can also create a `FutureTask` ourselves and hand it directly to `ExecutorService` for execution.
4. Finally, the main thread can execute `Future.get()` to wait for the task execution to complete, or execute `Future.cancel(boolean mayInterruptIfRunning)` to attempt to cancel the task.

## Introduction to the ThreadPoolExecutor Class (Important)

The thread pool implementation class `ThreadPoolExecutor` is the most core class in the `Executor` framework.

### Thread Pool Parameter Analysis

`ThreadPoolExecutor` provides four constructors. Let's look at the longest one; the other three are derived from this constructor (to put it plainly, the other constructors just provide certain default parameters, such as specifying what the default rejection policy is).

```java
    /**
     * Creates a new ThreadPoolExecutor with the given initial parameters.
     */
    public ThreadPoolExecutor(int corePoolSize,// Number of core threads in the thread pool
                              int maximumPoolSize,// Maximum number of threads in the thread pool
                              long keepAliveTime,// Maximum time that excess idle threads will wait for new tasks before terminating when thread count > corePoolSize
                              TimeUnit unit,// Time unit
                              BlockingQueue<Runnable> workQueue,// Task queue used to hold tasks waiting to be executed
                              ThreadFactory threadFactory,// Thread factory used to create threads; the default is usually sufficient
                              RejectedExecutionHandler handler// Rejection policy; when too many tasks are submitted to be handled in time, we can customize a policy to handle them
                               ) {
        if (corePoolSize < 0 ||
            maximumPoolSize <= 0 ||
            maximumPoolSize < corePoolSize ||
            keepAliveTime < 0)
            throw new IllegalArgumentException();
        if (workQueue == null || threadFactory == null || handler == null)
            throw new NullPointerException();
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.workQueue = workQueue;
        this.keepAliveTime = unit.toNanos(keepAliveTime);
        this.threadFactory = threadFactory;
        this.handler = handler;
    }
```

The parameters below are very important—you will definitely use them when working with thread pools later! So be sure to take careful notes and remember them clearly.

The 3 most important parameters of `ThreadPoolExecutor`:

- `corePoolSize`: The number of worker threads that the thread pool prioritizes maintaining. By default, threads are created on demand; once the number of worker threads reaches this value, new tasks usually enter the queue first.
- `maximumPoolSize`: When the tasks stored in the task queue reach the queue's capacity, the number of threads that can run concurrently becomes the maximum pool size.
- `workQueue`: When a new task arrives, it first checks whether the number of currently running threads has reached `corePoolSize`; if it has, the new task is stored in the queue.

Other common parameters of `ThreadPoolExecutor`:

- `keepAliveTime`: When the number of threads in the thread pool exceeds `corePoolSize`, if no new tasks are submitted at this time, threads beyond the core threads are not destroyed immediately; instead, they wait until the waiting time exceeds `keepAliveTime` before being reclaimed and destroyed.
- `unit`: The time unit for the `keepAliveTime` parameter.
- `threadFactory`: Used when the executor creates new threads.
- `handler`: The rejection policy (which will be introduced separately in detail later).

The diagram below helps deepen your understanding of the relationships among the various parameters in a thread pool (Image source: *Java Performance Tuning in Practice*):

![Relationship between thread pool parameters](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/relationship-between-thread-pool-parameters-8e02c62d.jpg)

### Thread Pool Lifecycle States

`ThreadPoolExecutor` uses the `ctl` variable (of type `AtomicInteger`) to simultaneously manage the thread pool's run state and the number of worker threads. A thread pool has 5 states in total:

- **Running (`RUNNING`)**: Accepts new tasks and processes queued tasks. This is the initial state after the thread pool is created.
- **Shutdown (`SHUTDOWN`)**: Does not accept new tasks, but continues processing tasks already in the queue. Entered after calling `shutdown()`.
- **Stop (`STOP`)**: Does not accept new tasks, does not process queued tasks, and attempts to interrupt currently executing tasks. Entered after calling `shutdownNow()`.
- **Tidying (`TIDYING`)**: All tasks have terminated, the worker count is 0, and the `terminated()` hook method is about to be executed.
- **Terminated (`TERMINATED`)**: The `terminated()` method has completed execution, and the thread pool is completely terminated.

State transitions can only occur in one direction: `RUNNING` → `SHUTDOWN` → `TIDYING` → `TERMINATED`, or `RUNNING` → `STOP` → `TIDYING` → `TERMINATED`. Calling `shutdownNow()` while in the `SHUTDOWN` state also transitions it to `STOP`.

`shutdown()` is a "graceful shutdown"—it interrupts idle threads, while tasks in the queue will still run to completion. `shutdownNow()` is a "forceful shutdown"—it attempts to interrupt all running threads and returns the unexecuted tasks in the queue as a `List<Runnable>`. `terminated()` is an empty hook method that can be overridden by subclassing `ThreadPoolExecutor` to perform cleanup work after the thread pool terminates.

### Worker Thread Mechanism

`ThreadPoolExecutor` wraps each worker thread into an inner class `Worker`. `Worker` extends AQS and implements the `Runnable` interface.

**Why does `Worker` extend AQS?** `Worker` implements a **non-reentrant exclusive lock** to cooperate with `shutdown()` in distinguishing whether a thread is idle or actively working—a `Worker` executing a task holds the lock, and `shutdown()` attempts `tryLock()` on each `Worker`; if it fails, it indicates that the thread is currently working and will not be interrupted.

**Lifecycle of a `Worker`:**

1. **Creation**: When `execute()` determines that a new thread needs to be created, it calls `addWorker()` to create a `Worker` instance, which internally creates a thread via `ThreadFactory`.
2. **Execution**: After the thread starts, it enters the `while` loop in `runWorker()` and continuously fetches tasks from the queue to execute via `getTask()`. A `Worker` is not permanently tagged as "core" or "non-core"; `getTask()` only uses the timed `workQueue.poll(keepAliveTime, unit)` when core thread timeout is allowed or when the current worker count exceeds `corePoolSize`—otherwise it blocks waiting via `workQueue.take()`.
3. **Exit**: When `getTask()` returns `null`, the `Worker` exits the loop and cleans up. Cases where `null` is returned include: the thread pool is in the `STOP` state, the thread pool is in the `SHUTDOWN` state and the queue is empty, a non-core thread times out waiting, or `maximumPoolSize` was reduced at runtime. If the worker count drops below `corePoolSize` after exiting, a new thread is automatically replenished.

**`ThreadPoolExecutor` Rejection Policy Definitions:**

When the thread pool is already shut down, or when the current number of worker threads has reached the upper limit and the queue can no longer accept new tasks, `ThreadPoolExecutor` invokes the rejection policy:

- `ThreadPoolExecutor.AbortPolicy`: Throws `RejectedExecutionException` to reject processing of the new task.
- `ThreadPoolExecutor.CallerRunsPolicy`: Runs the task on the thread that called `execute()` itself—that is, directly executes (`run()`) the rejected task in the thread invoking `execute`; if the executor has been shut down, the task is discarded. Therefore, this policy slows down the submission rate of new tasks and affects the overall performance of the program. If your application can tolerate this latency and you require every single task request to be executed, you can choose this policy.
- `ThreadPoolExecutor.DiscardPolicy`: Does not process the new task and directly discards it.
- `ThreadPoolExecutor.DiscardOldestPolicy`: This policy discards the oldest unprocessed task request.

For example:

For example: When Spring creates a thread pool via `ThreadPoolTaskExecutor` or when we create one directly via `ThreadPoolExecutor`'s constructor without specifying a `RejectedExecutionHandler` rejection policy, `AbortPolicy` is used by default. Under this rejection policy, if the queue is full, `ThreadPoolExecutor` throws a `RejectedExecutionException` to reject incoming tasks, which means you will lose processing of that task. While the thread pool is still running, `CallerRunsPolicy` hands the rejected task over to the caller thread to execute; when the thread pool is already shut down, this policy discards the task directly.

```java
public static class CallerRunsPolicy implements RejectedExecutionHandler {

        public CallerRunsPolicy() { }

        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            if (!e.isShutdown()) {
                // Executed directly by the main thread, rather than by a thread in the thread pool
                r.run();
            }
        }
    }
```

### Practical Application Scenarios of the 4 Rejection Policies

The basic behaviors of the 4 built-in rejection policies were introduced above. Below, combined with practical production experience, let's explain what scenarios each is suited for:

**`AbortPolicy`**: Suitable for core business scenarios with zero tolerance for task loss (such as payments and fund transfers). When a task is rejected, the caller receives a `RejectedExecutionException`, which must be caught in business code for compensation (such as retrying or persisting to a database for later compensatory execution). The *Alibaba Java Coding Guidelines* points out that without any configuration, an exception will be thrown directly when the queue is full, and developers must handle it explicitly.

**`CallerRunsPolicy`**: Suitable for scenarios where dropping tasks is unacceptable and slowing down submission speed is permissible. Since the task executes in the caller thread, the caller cannot submit new tasks during that time, forming a natural **back-pressure** mechanism. In their article *Java Thread Pool Implementation Principles and Its Practice in Meituan's Business*, the Meituan tech team mentioned that this is the rejection policy they use relatively frequently in production services. However, note that if the thread submitting tasks is a web container's request-processing thread (such as a Tomcat Worker thread), it will significantly increase the response time of that request, so caution is needed in latency-sensitive scenarios.

**`DiscardPolicy`**: Suitable for non-critical paths where task loss is acceptable, such as asynchronous log writing or monitoring metric reporting. This policy is completely silent (an empty implementation); rejected tasks leave no trace, which may make it difficult to notice task loss when troubleshooting.

**`DiscardOldestPolicy`**: Suitable for scenarios where only the latest data matters and older tasks can be overwritten, such as real-time market quote pushing or sensor data collection. Note: If `PriorityBlockingQueue` is used, `poll()` pops the highest-priority task rather than the oldest task, which may cause important tasks to be mistakenly discarded.

**Common practices in production environments**: The 4 built-in policies above often cannot completely satisfy requirements. The Dubbo framework customizes an `AbortPolicyWithReport` policy that, in addition to throwing an exception, dumps information about the rejected task to a local file to facilitate post-mortem troubleshooting. The Meituan tech team recommends monitoring and alerting on the number of thread pool rejections. Common ideas for custom policies include: writing rejected tasks to a database or message queue for subsequent compensatory consumption, incrementing a monitoring counter reported to Prometheus, or calling `workQueue.put(r)` to block and wait until there is space in the queue (Netty has a similar implementation).

### Two Ways to Create a Thread Pool

In Java, there are mainly two ways to create a thread pool:

**Method 1: Creating directly via the `ThreadPoolExecutor` constructor (Recommended)**

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/threadpoolexecutor-construtors-c8527210.png)

The "default thread factory" and "default rejection policy" in the figure mean that when the corresponding parameter is not explicitly passed into the current constructor, `ThreadPoolExecutor` uses the default implementation—it is not a misalignment between methods and descriptions.

This is the most recommended approach because it allows developers to explicitly specify the core parameters of the thread pool and exercise finer control over the thread pool's runtime behavior, thereby avoiding the risk of resource exhaustion.

**Method 2: Creating via the `Executors` utility class (Not recommended for production environments)**

The methods provided by the `Executors` utility class for creating thread pools are shown in the figure below:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/executors-new-thread-pool-methods-49624012.png)

As can be seen, various types of thread pools can be created through the `Executors` utility class, including:

- `FixedThreadPool`: Uses at most a fixed number of worker threads during normal operation. A thread can be replaced after terminating due to an exception, and threads also exit when the thread pool shuts down, so the count is not strictly fixed throughout the entire lifecycle. When a new task is submitted, if there is an idle thread in the thread pool, it executes immediately. If not, the new task is temporarily stored in a task queue, and once a thread becomes idle, the task in the task queue is processed.
- `SingleThreadExecutor`: A thread pool with only one thread. If more than one task is submitted to this thread pool, the tasks are saved in a task queue and executed in FIFO (first-in, first-out) order once the thread is idle.
- `CachedThreadPool`: A thread pool that adjusts the number of threads according to actual needs. The number of threads in the pool is indeterminate, but if there are idle threads available for reuse, reusable threads will be used first. If all threads are busy and a new task is submitted, a new thread will be created to process the task. Once all threads finish executing their current tasks, they return to the pool for reuse.
- `ScheduledThreadPool`: A thread pool that runs tasks after a given delay or executes tasks periodically.

The *Alibaba Java Coding Guidelines* mandates that thread pools must not be created using `Executors`, and instead must be created via the `ThreadPoolExecutor` constructor. This approach makes the rules of how the thread pool operates clearer to the developer and avoids the risk of resource exhaustion.

The drawbacks of thread pool objects returned by `Executors` are as follows (which will be explained in detail later):

- `FixedThreadPool` and `SingleThreadExecutor`: Use the blocking queue `LinkedBlockingQueue` with a maximum queue length of `Integer.MAX_VALUE`, which can be regarded as unbounded and may accumulate a large number of requests, leading to OOM.
- `CachedThreadPool`: Uses the synchronous queue `SynchronousQueue` and allows creating up to `Integer.MAX_VALUE` threads; if there are too many tasks and execution is slow, a huge number of threads may be created, leading to OOM.
- `ScheduledThreadPool` and `SingleThreadScheduledExecutor`: Use the unbounded delayed blocking queue `DelayedWorkQueue` with a maximum queue length of `Integer.MAX_VALUE`, which may accumulate a large number of requests, leading to OOM.

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
    // Default capacity of LinkedBlockingQueue is Integer.MAX_VALUE, which can be treated as unbounded
    return new ThreadPoolExecutor(nThreads, nThreads,0L, TimeUnit.MILLISECONDS,new LinkedBlockingQueue<Runnable>());

}

public static ExecutorService newSingleThreadExecutor() {
    // Default capacity of LinkedBlockingQueue is Integer.MAX_VALUE, which can be treated as unbounded
    return new FinalizableDelegatedExecutorService (new ThreadPoolExecutor(1, 1,0L, TimeUnit.MILLISECONDS,new LinkedBlockingQueue<Runnable>()));

}

// SynchronousQueue has no capacity, and maximumPoolSize is Integer.MAX_VALUE
public static ExecutorService newCachedThreadPool() {

    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,60L, TimeUnit.SECONDS,new SynchronousQueue<Runnable>());

}

// DelayedWorkQueue (delayed blocking queue)
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
    return new ScheduledThreadPoolExecutor(corePoolSize);
}
public ScheduledThreadPoolExecutor(int corePoolSize) {
    super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
          new DelayedWorkQueue());
}
```

### Summary of Common Blocking Queues Used in Thread Pools

When a new task arrives, it first checks whether the number of currently running threads has reached `corePoolSize`; if it has, the new task is placed in the queue.

Different thread pools choose different blocking queues. We can analyze them alongside the built-in thread pools.

- `LinkedBlockingQueue` with capacity `Integer.MAX_VALUE` (unbounded queue): `FixedThreadPool` and `SingleThreadExecutor`. `FixedThreadPool` can create at most `corePoolSize` threads (`corePoolSize` and `maximumPoolSize` are equal), and `SingleThreadExecutor` can only create one thread (`corePoolSize` and `maximumPoolSize` are both 1). In actual usage, the task queues of both will almost never become full.
- `SynchronousQueue` (synchronous queue): `CachedThreadPool`. `SynchronousQueue` has no capacity and stores no elements; its purpose is to ensure that for a submitted task, if there is an idle thread, that idle thread processes it; otherwise a new thread is created to handle the task. In other words, `CachedThreadPool`'s `maximumPoolSize` is `Integer.MAX_VALUE`, which can be understood as allowing the thread count to expand infinitely, potentially creating a large number of threads and causing OOM.
- `DelayedWorkQueue` (delayed blocking queue): `ScheduledThreadPool` and `SingleThreadScheduledExecutor`. The elements inside `DelayedWorkQueue` are not ordered by insertion time, but rather sorted by delay duration; internally it uses a "heap" data structure, ensuring that each dequeued task is the one with the earliest execution time in the queue. When `DelayedWorkQueue` is full upon adding elements, it automatically expands by 1/2 of its original capacity—meaning it never blocks, expanding up to `Integer.MAX_VALUE`—so at most `corePoolSize` threads can be created.

## Thread Pool Principle Analysis (Important)

We explained the `Executor` framework and the `ThreadPoolExecutor` class above. Now let's put it into practice by writing a small `ThreadPoolExecutor` demo to review the content above.

### Thread Pool Example Code

First, create an implementation class of the `Runnable` interface (of course, it could also be the `Callable` interface—we will introduce the difference between the two later).

`MyRunnable.java`

```java
import java.util.Date;

/**
 * This is a simple Runnable class that takes about 5 seconds to execute its task.
 * @author shuang.kou
 */
public class MyRunnable implements Runnable {

    private String command;

    public MyRunnable(String s) {
        this.command = s;
    }

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + " Start. Time = " + new Date());
        processCommand();
        System.out.println(Thread.currentThread().getName() + " End. Time = " + new Date());
    }

    private void processCommand() {
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    public String toString() {
        return this.command;
    }
}

```

Write the test program; here we create the thread pool using the custom-parameter `ThreadPoolExecutor` constructor approach recommended by Alibaba.

`ThreadPoolExecutorDemo.java`

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class ThreadPoolExecutorDemo {

    private static final int CORE_POOL_SIZE = 5;
    private static final int MAX_POOL_SIZE = 10;
    private static final int QUEUE_CAPACITY = 100;
    private static final Long KEEP_ALIVE_TIME = 1L;
    public static void main(String[] args) {

        // Using the thread pool creation method recommended by Alibaba
        // Created with custom parameters via the ThreadPoolExecutor constructor
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                CORE_POOL_SIZE,
                MAX_POOL_SIZE,
                KEEP_ALIVE_TIME,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(QUEUE_CAPACITY),
                new ThreadPoolExecutor.CallerRunsPolicy());

        for (int i = 0; i < 10; i++) {
            // Create a WorkerThread object (the MyRunnable class implements the Runnable interface)
            Runnable worker = new MyRunnable("" + i);
            // Execute the Runnable
            executor.execute(worker);
        }
        // Shut down the thread pool
        executor.shutdown();
        while (!executor.isTerminated()) {
        }
        System.out.println("Finished all threads");
    }
}

```

As we can see, the code above specifies:

- `corePoolSize`: Core pool size is 5.
- `maximumPoolSize`: Maximum pool size is 10.
- `keepAliveTime`: Wait time is `1L`.
- `unit`: Wait time unit is `TimeUnit.SECONDS`.
- `workQueue`: Task queue is `ArrayBlockingQueue`, with a capacity of 100.
- `handler`: Rejection policy is `CallerRunsPolicy`.

**Output**:

```plain
pool-1-thread-3 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-5 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-2 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-1 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-4 Start. Time = Sun Apr 12 11:14:37 CST 2020
pool-1-thread-3 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-4 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-1 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-5 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-1 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-2 End. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-5 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-4 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-3 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-2 Start. Time = Sun Apr 12 11:14:42 CST 2020
pool-1-thread-1 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-4 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-5 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-3 End. Time = Sun Apr 12 11:14:47 CST 2020
pool-1-thread-2 End. Time = Sun Apr 12 11:14:47 CST 2020
Finished all threads  // Exits only after all tasks finish, because the while loop exits only when executor.isTerminated() evaluates to true—which returns true if and only if shutdown() has been called and all submitted tasks have completed

```

### Thread Pool Principle Analysis

From the code output above, we can see: **the thread pool executes 5 tasks first, and whenever any of those tasks finishes, it fetches a new task to execute.** You can first analyze why this happens based on the content explained above (think independently for a moment).

Now, let's analyze the output above to briefly examine how a thread pool works.

To understand the principle of a thread pool, we first need to analyze the `execute` method. In the example code, we used `executor.execute(worker)` to submit a task to the thread pool.

This method is very important. Let's look at its source code below:

```java
   // Stores the runState and the number of active worker threads (workerCount) in the thread pool
   private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));

    private static int workerCountOf(int c) {
        return c & CAPACITY;
    }
    // Task queue
    private final BlockingQueue<Runnable> workQueue;

    public void execute(Runnable command) {
        // Throw an exception if the task is null
        if (command == null)
            throw new NullPointerException();
        // Current state information of the thread pool stored in ctl
        int c = ctl.get();

        // 3 steps are involved below
        // 1. First check whether the total number of worker threads in the pool is less than corePoolSize.
        // If less, create a new thread via addWorker(command, true) and attach the task (command) to it; then start the thread to execute the task.
        if (workerCountOf(c) < corePoolSize) {
            if (addWorker(command, true))
                return;
            c = ctl.get();
        }
        // 2. If the current worker count >= corePoolSize, execution reaches here, indicating the core-thread creation branch was not taken.
        // Check the pool state via isRunning; only if the pool is RUNNING and the queue can accept the task will the task be added to the queue.
        if (isRunning(c) && workQueue.offer(command)) {
            int recheck = ctl.get();
            // Recheck the pool state; if it is no longer RUNNING, remove the task from the queue and run the rejection policy.
            if (!isRunning(recheck) && remove(command))
                reject(command);
                // If the current worker thread count is 0, create a new thread to execute tasks.
            else if (workerCountOf(recheck) == 0)
                addWorker(null, false);
        }
        // 3. Create a new thread via addWorker(command, false) and attach the task (command) to it; then start the thread to execute the task.
        // Passing false means checking whether the current thread count is less than maximumPoolSize when adding a thread.
        // If addWorker(command, false) fails, invoke the corresponding rejection policy via reject().
        else if (!addWorker(command, false))
            reject(command);
    }
```

Here is a brief analysis of the entire flow (simplifying the overall logic for easier understanding):

1. If the current total number of worker threads is less than `corePoolSize`, a new thread is created to execute the task.
2. If the current total number of worker threads has reached `corePoolSize`, it first tries to place the task into the task queue to wait for execution.
3. If offering the task to the task queue fails (the task queue is already full) and the current total number of worker threads is less than `maximumPoolSize`, a new non-core thread is created to execute the task.
4. If the current total number of worker threads already equals `maximumPoolSize` and the task queue cannot accept any more tasks either, the current task is rejected, and the rejection policy invokes `RejectedExecutionHandler.rejectedExecution()`.

> **Supplementary Note**: Many people mistakenly think that non-core threads are only created when the task queue is full, and then sit "idle" waiting to be destroyed. In reality, after a non-core thread finishes its initial task, it does not get destroyed immediately; instead, it **actively pulls tasks from the task queue to execute** (via the `getTask()` method). Specifically, core threads use `workQueue.take()` to block and wait for tasks, whereas non-core threads use `workQueue.poll(keepAliveTime, unit)`—if a task is retrieved from the queue within the keep-alive time, it continues executing; only if it times out without getting a task will the non-core thread be reclaimed. This means that even if a new task is placed into the queue, an idle non-core thread will also race to take tasks from the queue to execute, rather than waiting passively until the queue is full.

![Illustration of thread pool implementation principle](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/thread-pool-principle-aa009a67.png)

In the `execute` method, `addWorker` is called multiple times. This `addWorker` method is mainly used to create a new worker thread; returning `true` means the worker thread was created and started successfully, while otherwise it returns `false`.

```java
    // Global lock, required for concurrent operations
    private final ReentrantLock mainLock = new ReentrantLock();
    // Tracks the maximum pool size reached; this field can only be accessed while holding mainLock
    private int largestPoolSize;
    // Set of worker threads storing all active workers in the pool; can only be accessed while holding mainLock
    private final HashSet<Worker> workers = new HashSet<>();
    // Get thread pool run state
    private static int runStateOf(int c)     { return c & ~CAPACITY; }
    // Check whether the thread pool state is RUNNING
    private static boolean isRunning(int c) {
        return c < SHUTDOWN;
    }


    /**
     * Adds a new worker thread to the thread pool.
     * @param firstTask the task to execute first
     * @param core if true, uses corePoolSize as the bound; if false, uses maximumPoolSize
     * @return true if added successfully, otherwise false
     */
   private boolean addWorker(Runnable firstTask, boolean core) {
        retry:
        for (;;) {
            // These two lines get the current state of the thread pool
            int c = ctl.get();
            int rs = runStateOf(c);

            // Check if queue empty only if necessary.
            if (rs >= SHUTDOWN &&
                ! (rs == SHUTDOWN &&
                   firstTask == null &&
                   ! workQueue.isEmpty()))
                return false;

            for (;;) {
                // Get the number of active worker threads in the thread pool
                int wc = workerCountOf(c);
                // If core is false, the queue is also full and the pool limit becomes maximumPoolSize
                if (wc >= CAPACITY ||
                    wc >= (core ? corePoolSize : maximumPoolSize))
                    return false;
                // Atomically increment workerCount by 1
                if (compareAndIncrementWorkerCount(c))
                    break retry;
                // If the thread pool state changed, retry the outer loop
                c = ctl.get();
                if (runStateOf(c) != rs)
                    continue retry;
                // else CAS failed due to workerCount change; retry inner loop
            }
        }
        // Flag indicating whether the worker thread started successfully
        boolean workerStarted = false;
        // Flag indicating whether the worker thread was added successfully
        boolean workerAdded = false;
        Worker w = null;
        try {

            w = new Worker(firstTask);
            final Thread t = w.thread;
            if (t != null) {
                // Acquire lock
                final ReentrantLock mainLock = this.mainLock;
                mainLock.lock();
                try {
                    // Get thread pool run state
                    int rs = runStateOf(ctl.get());
                    // If rs < SHUTDOWN (i.e., pool is RUNNING) or (rs == SHUTDOWN && firstTask == null),
                    // add the worker to the workers set and start the new Worker.
                    // firstTask == null means creating a thread solely to process queued tasks without a new initial task.
                    if (rs < SHUTDOWN ||
                        (rs == SHUTDOWN && firstTask == null)) {
                        if (t.isAlive()) // precheck that t is startable
                            throw new IllegalThreadStateException();
                        workers.add(w);
                        // Update the largest pool size recorded so far
                        int s = workers.size();
                        if (s > largestPoolSize)
                            largestPoolSize = s;
                        // Mark worker as added successfully
                        workerAdded = true;
                    }
                } finally {
                    // Release lock
                    mainLock.unlock();
                }
                // If the worker was added successfully, call Thread#start() on the Worker's internal thread t to start the real thread
                if (workerAdded) {
                    t.start();
                    // Mark thread as started successfully
                    workerStarted = true;
                }
            }
        } finally {
            // If thread startup failed, remove the corresponding Worker from the worker set
            if (! workerStarted)
                addWorkerFailed(w);
        }
        return workerStarted;
    }
```

For more content on thread pool source code analysis, I recommend this article: Hardcore Deep Dive: [A 40,000-Word Source Code Analysis of the Implementation Principles of JUC ThreadPoolExecutor](https://www.cnblogs.com/throwable/p/13574306.html).

Now let's go back to the example code. Isn't it very easy to understand its principle now?

If you still haven't figured it out, no worries—you can look at my analysis:

> We simulated 10 tasks in the code, and configured `corePoolSize` as 5 and the waiting queue capacity as 100, so at most 5 tasks can execute simultaneously at any time, while the remaining 5 tasks are placed into the waiting queue. Whenever any of the current 5 tasks finishes executing, the thread pool picks up a new task to execute.

### Several Common Comparisons

#### `Runnable` vs `Callable`

`Runnable` has existed since Java 1.0, whereas `Callable` was introduced in Java 1.5 specifically to handle use cases that `Runnable` does not support. The `Runnable` interface does not return a result or throw checked exceptions, whereas the `Callable` interface can. Therefore, if a task does not need to return a result or throw an exception, it is recommended to use the `Runnable` interface, which makes the code look cleaner.

The `Executors` utility class can convert a `Runnable` object into a `Callable` object (`Executors.callable(Runnable task)` or `Executors.callable(Runnable task, Object result)`).

`Runnable.java`

```java
@FunctionalInterface
public interface Runnable {
   /**
    * Executed by a thread; has no return value and cannot throw checked exceptions.
    */
    public abstract void run();
}
```

`Callable.java`

```java
@FunctionalInterface
public interface Callable<V> {
    /**
     * Computes a result, or throws an exception if unable to do so.
     * @return computed result
     * @throws Exception if unable to compute a result
     */
    V call() throws Exception;
}

```

#### `execute()` vs `submit()`

`execute()` and `submit()` are two methods for submitting tasks to a thread pool, with some differences:

- **Return value**: The `execute()` method is used to submit `Runnable` tasks that do not require a return value. `submit()` can submit either `Runnable` or `Callable` tasks and returns a `Future` object. `Future.isDone()` only indicates that the task has ended in one of the states—normal completion, exception, or cancellation; calling `get()` is needed to retrieve the result or learn the exception thrown by the task (`get(long timeout, TimeUnit unit)` throws `TimeoutException` if not completed before the timeout).
- **Exception handling**: When using `submit()`, exceptions thrown during task execution can be handled through the `Future` object; whereas when using `execute()`, exception handling needs to be done via a custom `ThreadFactory` (setting an `UncaughtExceptionHandler` object when the thread factory creates threads) or `ThreadPoolExecutor`'s `afterExecute()` method.

Example 1: Using `get()` to retrieve the return value.

```java
// Shown for demonstration only; it is recommended to create thread pools using the ThreadPoolExecutor constructor.
ExecutorService executorService = Executors.newFixedThreadPool(3);

Future<String> submit = executorService.submit(() -> {
    try {
        Thread.sleep(5000L);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return "abc";
});

String s = submit.get();
System.out.println(s);
executorService.shutdown();
```

Output:

```plain
abc
```

Example 2: Using `get(long timeout, TimeUnit unit)` to retrieve the return value.

```java
ExecutorService executorService = Executors.newFixedThreadPool(3);

Future<String> submit = executorService.submit(() -> {
    try {
        Thread.sleep(5000L);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return "abc";
});

String s = submit.get(3, TimeUnit.SECONDS);
System.out.println(s);
executorService.shutdown();
```

Output:

```plain
Exception in thread "main" java.util.concurrent.TimeoutException
  at java.util.concurrent.FutureTask.get(FutureTask.java:205)
```

#### `shutdown()` VS `shutdownNow()`

- **`shutdown()`**: Shuts down the thread pool; the pool's state changes to `SHUTDOWN`. The thread pool stops accepting new tasks, but tasks in the queue will finish executing.
- **`shutdownNow()`**: Shuts down the thread pool; the pool's state changes to `STOP`. The thread pool attempts to interrupt currently executing tasks, stops processing queued tasks, and returns a list of tasks that have not yet started executing; when a task does not respond to interruption, immediate termination cannot be guaranteed.

#### `isTerminated()` VS `isShutdown()`

- **`isShutDown`**: Returns `true` after the `shutdown()` method has been called.
- **`isTerminated`**: Returns `true` after the `shutdown()` method has been called and all submitted tasks have completed.

## Several Common Built-in Thread Pools

### FixedThreadPool

#### Introduction

`FixedThreadPool` is known as a thread pool with a fixed number of reusable threads. Let's inspect its implementation through the relevant source code in the `Executors` class:

```java
   /**
     * Creates a thread pool that reuses a fixed number of threads.
     */
    public static ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>(),
                                      threadFactory);
    }
```

There is another implementation method for `FixedThreadPool`, similar to the one above, so we won't elaborate much here:

```java
    public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
    }
```

From the source code above, we can see that both `corePoolSize` and `maximumPoolSize` of a newly created `FixedThreadPool` are set to `nThreads`, which is passed in by us when using it.

Even if `maximumPoolSize` were larger than `corePoolSize`, at most `corePoolSize` threads would be created. This is because `FixedThreadPool` uses a `LinkedBlockingQueue` with capacity `Integer.MAX_VALUE` (an unbounded queue), so the queue will never become full.

#### Task Execution Process Introduction

Execution schematic diagram of `FixedThreadPool`'s `execute()` method (Image source: *The Art of Java Concurrency Programming*):

![Execution schematic diagram of FixedThreadPool's execute() method](/media/jg/local/java/concurrent/images/java-thread-pool-summary/FixedThreadPool-01d9ec.png)

**Explanation of the diagram above:**

1. If the current total number of worker threads is less than `corePoolSize`, when a new task arrives, a new thread is created to execute the task;
2. Once the current total number of worker threads reaches `corePoolSize`, when a new task arrives, the task is added to `LinkedBlockingQueue`;
3. After a thread in the thread pool finishes its current task, it repeatedly fetches tasks from `LinkedBlockingQueue` in a loop to execute;

#### Why is `FixedThreadPool` Not Recommended?

`FixedThreadPool` uses the unbounded queue `LinkedBlockingQueue` (with a queue capacity of `Integer.MAX_VALUE`) as the thread pool's work queue, which brings the following impacts to the thread pool:

1. When the number of threads in the thread pool reaches `corePoolSize`, new tasks will wait in the unbounded queue, so the number of threads in the thread pool will not exceed `corePoolSize`;
2. Because `maximumPoolSize` becomes an ineffective parameter when using an unbounded queue—since the task queue can never become full—we can see from the source code of `FixedThreadPool` that `corePoolSize` and `maximumPoolSize` are set to the same value;
3. Due to 1 and 2, `keepAliveTime` also becomes an ineffective parameter when using an unbounded queue;
4. A running `FixedThreadPool` (without calling `shutdown()` or `shutdownNow()`) will not reject tasks, which can cause OOM (Out of Memory) when there are many tasks.

### SingleThreadExecutor

#### Introduction

`SingleThreadExecutor` is a thread pool with only a single thread. Let's look at the **implementation of `SingleThreadExecutor`:**

```java
   /**
     * Returns a thread pool with only a single thread.
     */
    public static ExecutorService newSingleThreadExecutor(ThreadFactory threadFactory) {
        return new FinalizableDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>(),
                                    threadFactory));
    }
```

```java
   public static ExecutorService newSingleThreadExecutor() {
        return new FinalizableDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>()));
    }
```

From the source code above, we can see that both `corePoolSize` and `maximumPoolSize` of a newly created `SingleThreadExecutor` are set to 1, and other parameters are the same as `FixedThreadPool`.

#### Task Execution Process Introduction

Execution schematic diagram of `SingleThreadExecutor` (Image source: *The Art of Java Concurrency Programming*):

![Execution schematic diagram of SingleThreadExecutor](/media/jg/local/java/concurrent/images/java-thread-pool-summary/SingleThreadExecutor-275e95.png)

**Explanation of the diagram above:**

1. If the number of currently running threads is less than `corePoolSize`, a new thread is created to execute the task;
2. Once there is a running thread in the thread pool, tasks are added to `LinkedBlockingQueue`;
3. After the thread finishes its current task, it repeatedly fetches tasks from `LinkedBlockingQueue` in a loop to execute;

#### Why is `SingleThreadExecutor` Not Recommended?

Just like `FixedThreadPool`, `SingleThreadExecutor` uses a `LinkedBlockingQueue` with a capacity of `Integer.MAX_VALUE` (an unbounded queue). The impact of using an unbounded queue as the thread pool's work queue on `SingleThreadExecutor` is the same as on `FixedThreadPool`. Simply put, it may lead to OOM.

### CachedThreadPool

#### Introduction

`CachedThreadPool` is a thread pool that creates new threads as needed. Let's look at the implementation of `CachedThreadPool` through its source code:

```java
    /**
     * Creates a thread pool that creates new threads as needed, but will reuse previously constructed threads when they are available.
     */
    public static ExecutorService newCachedThreadPool(ThreadFactory threadFactory) {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>(),
                                      threadFactory);
    }

```

```java
    public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
```

`CachedThreadPool`'s `corePoolSize` is set to 0 and `maximumPoolSize` is set to `Integer.MAX_VALUE`, meaning it is unbounded. This means that if the main thread submits tasks faster than the threads in `maximumPool` process them, `CachedThreadPool` will continuously create new threads. In extreme cases, this will exhaust CPU and memory resources.

#### Task Execution Process Introduction

Execution schematic diagram of `CachedThreadPool`'s `execute()` method (Image source: *The Art of Java Concurrency Programming*):

![Execution schematic diagram of CachedThreadPool's execute() method](/media/jg/local/java/concurrent/images/java-thread-pool-summary/CachedThreadPool-execute-16353b.png)

**Explanation of the diagram above:**

1. First, `SynchronousQueue.offer(Runnable task)` is executed to submit the task to the task queue. If there is currently an idle thread in `maximumPool` executing `SynchronousQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS)`, then the `offer` operation executed by the main thread pairs successfully with the `poll` operation executed by the idle thread; the main thread hands the task over to the idle thread for execution, and `execute()` finishes. Otherwise, proceed to step 2 below;
2. When `maximumPool` is initially empty, or there are no idle threads in `maximumPool`, no thread will be executing `SynchronousQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS)`. In this case, step 1 fails, `CachedThreadPool` creates a new thread to execute the task, and `execute()` finishes;

#### Why is `CachedThreadPool` Not Recommended?

`CachedThreadPool` uses the synchronous queue `SynchronousQueue` and allows creating up to `Integer.MAX_VALUE` threads, which may create a large number of threads and lead to OOM.

### ScheduledThreadPool

#### Introduction

`ScheduledThreadPool` is used to run tasks after a given delay or execute tasks periodically. It is rarely used in actual projects and is not recommended either; you only need a brief understanding of it.

```java
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
    return new ScheduledThreadPoolExecutor(corePoolSize);
}
public ScheduledThreadPoolExecutor(int corePoolSize) {
    super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
          new DelayedWorkQueue());
}
```

`ScheduledThreadPool` is created via `ScheduledThreadPoolExecutor`, using `DelayedWorkQueue` (delayed blocking queue) as the thread pool's task queue.

The elements inside `DelayedWorkQueue` are not ordered by insertion time, but rather sorted by delay duration; internally it uses a "heap" data structure, ensuring that each dequeued task is the one with the earliest execution time in the queue. When `DelayedWorkQueue` is full upon adding elements, it automatically expands by 1/2 of its original capacity—meaning it never blocks, expanding up to `Integer.MAX_VALUE`—so at most `corePoolSize` threads can be created.

`ScheduledThreadPoolExecutor` extends `ThreadPoolExecutor`, so creating a `ScheduledThreadExecutor` is essentially also creating a `ThreadPoolExecutor` thread pool, just with different parameters passed in.

```java
public class ScheduledThreadPoolExecutor
        extends ThreadPoolExecutor
        implements ScheduledExecutorService
```

#### ScheduledThreadPoolExecutor vs Timer

- `Timer` is sensitive to changes in the system clock, whereas `ScheduledThreadPoolExecutor` is not;
- `Timer` has only a single execution thread, so a long-running task can delay other tasks. `ScheduledThreadPoolExecutor` can be configured with any number of threads. Furthermore, if you wish (by providing a `ThreadFactory`), you have complete control over the threads created;
- Runtime exceptions thrown inside a `TimerTask` will terminate `Timer`'s sole thread, preventing subsequent scheduled tasks from continuing to run. In `ScheduledThreadPoolExecutor`, an exception thrown by one task will not terminate other tasks; after a periodic task throws an exception, its subsequent executions will be suppressed. Tasks submitted via `submit()` or scheduled execution methods typically store the exception in the `Future`, which the caller can retrieve via `Future.get()`; if inspecting uniformly inside `afterExecute()`, you also need to read the exception from the passed-in `Future`.

For a detailed introduction to scheduled tasks, see this article: [Detailed Explanation of Java Scheduled Tasks](https://javaguide.cn/system-design/schedule-task.html).

## Thread Pool Best Practices

The article [Java Thread Pool Best Practices](https://javaguide.cn/java/concurrent/java-thread-pool-best-practices.html) summarizes things you should pay attention to when using thread pools, which you can look over before using thread pools in actual projects.

## References

- *The Art of Java Concurrency Programming*
- [Java Scheduler ScheduledExecutorService ScheduledThreadPoolExecutor Example](https://www.journaldev.com/2340/java-scheduler-scheduledexecutorservice-scheduledthreadpoolexecutor-example "Java Scheduler ScheduledExecutorService ScheduledThreadPoolExecutor Example")
- [java.util.concurrent.ScheduledThreadPoolExecutor Example](https://examples.javacodegeeks.com/core-java/util/concurrent/scheduledthreadpoolexecutor/java-util-concurrent-scheduledthreadpoolexecutor-example/ "java.util.concurrent.ScheduledThreadPoolExecutor Example")
- [ThreadPoolExecutor – Java Thread Pool Example](https://www.journaldev.com/1069/threadpoolexecutor-java-thread-pool-example-executorservice "ThreadPoolExecutor – Java Thread Pool Example")
