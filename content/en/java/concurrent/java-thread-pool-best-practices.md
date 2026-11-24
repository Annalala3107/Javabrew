---
title: Java Thread Pool Best Practices
description: "Summary of Java Thread Pool best practices: estimating thread counts and queue capacity from business throughput, task duration, and downstream capacity, and covering production issues including queue backlog, rejection policies, task timeouts, exception handling, dynamic tuning, monitoring, and Virtual Threads."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/java-thread-pool-best-practices.md
head:
  - - meta
    - name: keywords
      content: Thread Pool best practices,ThreadPoolExecutor parameter configuration,Thread Pool monitoring,queue backlog,CallerRunsPolicy,dynamic Thread Pool,task timeout,Virtual Threads
---

Seeing a configuration like `corePoolSize = 8`, `maximumPoolSize = 16`, `queueCapacity = 1000`, knowing only that the machine has 8 CPU cores is still not enough to tell whether it is appropriate. Image compression, batch database queries, and calling external APIs have very different latency profiles, so the number of threads they require can differ dramatically. How fast tasks arrive, how long they take to execute, how long they are allowed to sit in the queue, and how much concurrency the database and downstream services can sustain all affect the final configuration.

For fundamentals on the seven constructor parameters, task execution flow, Blocking Queues, and Rejection Policies, refer first to [Detailed Explanation of Java Thread Pool](./java-thread-pool-summary.md). Production environments also have to handle parameter estimation, overload, task timeouts, and monitoring—problems that depend much more heavily on business capacity and runtime metrics.

## Declaring a Thread Pool Properly

Business Thread Pools usually need explicit settings for thread count, queue capacity, thread naming, and a Rejection Policy. While the factory methods in `Executors` are convenient, several of them create virtually unbounded queues or allow the thread count to grow indefinitely, making it easy to accumulate massive task backlogs or spawn too many threads during traffic peaks.

- `newFixedThreadPool()` and `newSingleThreadExecutor()` use an unbounded `LinkedBlockingQueue`; when tasks keep arriving, the queue can grow without bound.
- `newCachedThreadPool()` uses a `SynchronousQueue` with a maximum pool size of `Integer.MAX_VALUE`, which can spawn a huge number of threads if the submission rate stays higher than the processing rate over time.
- `newScheduledThreadPool()` uses an unbounded `DelayedWorkQueue`, which likewise requires watching out for continuous accumulation of delayed tasks.

Therefore, for general business Thread Pools, it is better to instantiate `ThreadPoolExecutor` directly and encode capacity limits explicitly in the configuration:

```java
ThreadFactory threadFactory = new NamingThreadFactory("order-query");

ThreadPoolExecutor executor = new ThreadPoolExecutor(
        8,
        16,
        60L,
        TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(200),
        threadFactory,
        new ThreadPoolExecutor.AbortPolicy()
);
```

The `8`, `16`, and `200` in the example are only shown to illustrate parameter positions and must not be copied straight into production. Parameters must be determined based on business capacity and load-test results.

At a minimum, a `ThreadFactory` should assign business-meaningful names to threads:

```java
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

public final class NamingThreadFactory implements ThreadFactory {

    private final AtomicInteger sequence = new AtomicInteger();
    private final String prefix;

    public NamingThreadFactory(String prefix) {
        this.prefix = prefix;
    }

    @Override
    public Thread newThread(Runnable task) {
        Thread thread = new Thread(task);
        thread.setName(prefix + "-" + sequence.incrementAndGet());
        thread.setDaemon(false);
        return thread;
    }
}
```

Thread names appear in thread dumps, logs, and monitoring data. `pool-1-thread-3` gives almost no clue about which business flow it belongs to, whereas `order-query-3` immediately narrows down the troubleshooting scope.

## How Should Thread Pool Parameters Be Estimated?

CPU-bound tasks typically start near the number of CPU cores, while I/O-bound tasks can be configured with more threads. Rules of thumb like this work well as an initial starting point, yet practical configuration also has to answer more concrete questions: How many tasks are submitted per second during peak hours? How long does a single task run? How much of that time is spent waiting on I/O? How much concurrency can downstream dependencies handle? What is the maximum time a task is allowed to wait in the queue?

Within a relatively stable peak window, suppose the number of tasks submitted per second is $\lambda$ and the average execution time per task is $T$ seconds. The number of concurrently executing tasks $L$ can first be estimated as:

$$
L \approx \lambda \times T
$$

For example, if an endpoint generates 400 asynchronous tasks per second at peak and each task executes in 80 ms on average, the corresponding average concurrency demand is roughly `400 × 0.08 = 32`. This is only an estimation baseline—you cannot blindly set the thread count to 32 for several reasons:

- Average latency hides slow tasks; P95 and P99 latencies can be much higher than the mean.
- When task latency rises, concurrency demand rises along with it.
- CPU, memory, and context switching constrain the number of platform threads.
- Database connection pools or downstream APIs may permit much lower concurrency.

*Java Concurrency in Practice* gives an estimation formula incorporating target CPU utilization. For workloads that mix computation and waiting, you can use it to help determine an initial value:

$$
N_{threads} \approx N_{cpu} \times U_{cpu} \times \left(1 + \frac{W}{C}\right)
$$

Here, $N_{cpu}$ is the number of CPU cores, $U_{cpu}$ is the target CPU utilization, and $W/C$ is the ratio of wait time to compute time.

In theory, the longer the wait time, the more threads you can schedule so that while some tasks wait on I/O, others keep using the CPU. However, when the wait comes from database connection pool exhaustion, downstream rate limiting, or lock contention, adding more threads only creates more waiting. The formula cannot tell those situations apart.

Once initial values are chosen, refine them incrementally through load tests that closely resemble real traffic. During load testing, monitor throughput, P95/P99 latency, CPU, context switches, queue wait time, and downstream connection pools together—never look only at application QPS.

## How Large Should a Bounded Queue Be?

A queue is mainly used to absorb short-term traffic fluctuations, not to store tasks long term when processing cannot keep up. If the queue is too small, minor spikes can trigger rejections; if the queue is too large, tasks are accepted only to exceed their business timeout before ever starting execution, while also consuming large amounts of heap memory.

You can first estimate the buffer needed for burst traffic, where $\lambda_{in}$ is the task arrival rate, $\lambda_{out}$ is the completion rate, and $\Delta t$ is the burst duration:

$$
Q \approx (\lambda_{in} - \lambda_{out}) \times \Delta t
$$

For example, if a Thread Pool can complete roughly 500 tasks per second and a traffic spike pushes the submission rate to 600 tasks per second for 2 seconds, about 200 extra tasks will accumulate during that interval. This number only reflects short-term buffering needs; the final capacity is still bounded by task expiration deadlines and memory constraints.

Queue wait time can also be roughly estimated: if 500 tasks sit in the queue and the Thread Pool completes 500 tasks per second, the task at the tail of the queue still has to wait around 1 second. When the endpoint's total timeout is only 800 ms, those tasks have little chance of returning on time even after being enqueued.

Once the worker thread count reaches `corePoolSize`, new tasks enter the queue first; only after the queue is full does the Thread Pool create additional threads up to `maximumPoolSize`. When the queue is set very large, the thread count may stay at `corePoolSize` for long periods, giving `maximumPoolSize` little chance to take effect. With an unbounded queue, `maximumPoolSize` effectively never participates in scaling.

When deciding queue capacity, perform at least four checks:

1. Estimate buffering needs using peak traffic and burst duration.
2. Verify whether the estimated wait time for a task at the tail of the queue exceeds the business deadline.
3. Measure the memory footprint of queued tasks, especially tasks carrying files, request payloads, or large collections.
4. Verify that degradation and alerting behave properly when the queue fills up and tasks are rejected.

## Why Must Thread Count Be Designed Together with Downstream Capacity?

Many I/O tasks ultimately access a database, Redis, or external APIs. A Thread Pool enables more tasks to initiate calls concurrently, yet it does not increase the downstream system's processing capacity.

Suppose an order service deploys 4 instances, and each instance configures 40 threads for a certain database task; in theory, up to 160 concurrent database requests can be issued simultaneously. If each instance's database connection pool has only 20 connections, large numbers of threads will block waiting to acquire a connection; if the database itself can stably handle only 80 concurrent queries, even expanding the connection pool will merely shift the pressure onto the database.

When configuring parameters, allocate concurrency budgets across the entire call chain:

- Database connections must reserve shares for web requests, scheduled jobs, and other business Thread Pools rather than dedicating everything to one Thread Pool.
- The per-route limit and total connection limit of HTTP client connection pools should match actual outgoing concurrency.
- When a downstream service enforces a rate limit, total concurrency across all upstream instances must not persistently exceed that threshold.
- When a single task accesses multiple dependencies serially or in parallel, calculate the occupancy time for each dependency separately.

If increasing thread count causes active connections, connection acquisition wait times, downstream P99 latency, and error rates to rise simultaneously, adding even more threads rarely helps. At that point, reduce ineffective concurrency and address slow SQL, downstream timeouts, or hot resources instead.

## How to Handle Queue Backlog?

A continuously growing queue means tasks are entering faster than they are completing. Sudden traffic surges cause backlogs, and slower task execution itself also causes backlogs—and the two require different remedies.

| Symptom | Evidence to Verify | Action Direction |
| --- | --- | --- |
| Submission rate rises while task execution time stays roughly flat | Ingress QPS, promotional traffic, caller retries | Apply ingress rate limiting, scale out instances, or smooth peaks with MQ |
| Submission rate stays stable while task execution time rises | Thread dumps, slow SQL, lock waits, downstream latency | Fix slow tasks and downstream failures; do not rush to add threads |
| Active threads are full and CPU remains near its ceiling | CPU utilization, run queue, context switches | Optimize computation, split tasks, or scale up/out machines |
| Many threads are waiting on database connections | Connection pool active/waiting counts, connection acquisition timeouts | Limit concurrency, optimize SQL, reallocate connection budgets |
| Queue wait time already exceeds task validity window | Queue wait P95/P99, business timeouts | Fail fast, discard expired tasks, or route to compensation flows |
| Queue depth and rejections increase while downstream still has headroom | Normal CPU, connection pool, and downstream metrics | Tune thread count, queue size, or instance count after load testing |

Scaling out machines fits cases where overall service capacity is insufficient and tasks can be partitioned horizontally. Increasing threads fits cases where a single instance still has CPU and downstream headroom, yet current concurrency is too low. Once tasks have already expired past their valid deadline, keeping them queued accomplishes little; asynchronous tasks that cannot be dropped should first be persisted to MQ or a database and processed by a retryable consumer pipeline.

When a Thread Pool backlog has already occurred in production, refer to [Java Backend Production Troubleshooting](../jvm/jvm-in-action.md#线程池队列堆积怎么排查) to pinpoint the cause using submission rate, completion rate, thread dumps, and downstream status.

## Can CallerRunsPolicy Provide Backpressure?

`CallerRunsPolicy` makes the thread calling `execute()` run the rejected task itself. Because the submitting thread slows down, the submission rate of subsequent tasks may drop as well, giving it a certain feedback-regulation effect.

Its effectiveness depends on who the submitter is. When a message consumer thread or batch scheduler thread is forced to execute the task, the upstream pull rate may naturally slow down; however, when a Tomcat request thread executes a long-running task, that request thread is tied up, driving up endpoint latency and pressure on the web server's request thread pool. And if the submitting thread holds a lock or a database transaction, running the task on the caller thread also extends how long that lock or transaction is held.

Once the Thread Pool has been shut down, `CallerRunsPolicy` no longer runs tasks and simply drops them. If the business cannot tolerate losing tasks, you need a custom rejection handler: record rejection metrics, return an explicit failure, or persist the task to durable storage. Never assume swapping the Rejection Policy alone solves task reliability for the caller.

## Should Different Business Flows Isolate Their Thread Pools?

Sharing a Thread Pool allows one type of slow task to consume execution resources needed by other business flows. Payment callbacks, report exports, and routine notifications differ in latency targets, failure handling, and downstream dependencies; putting them in the same Thread Pool makes it difficult to configure a single thread count, queue capacity, and Rejection Policy that fits all of them.

Isolation does not mean creating a dedicated Thread Pool for every single endpoint either. Pools are typically partitioned by task priority, latency profile, and downstream dependencies: tasks calling the same slow service can be isolated together; core transactions and non-core notifications should not share a queue; and CPU-bound tasks should not be mixed with large volumes of blocking I/O tasks. Too many Thread Pools increase thread, queue, monitoring, and configuration overhead, so similar tasks can share a pool.

Previous articles have cited a production incident where parent and child tasks shared the same Thread Pool (source: [A Production Incident Caused by Improper Thread Pool Usage](https://heapdump.cn/article/646639)):

![Overview of the incident code example](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/production-accident-threadpool-sharing-example-546d273a.png)

Suppose a Thread Pool has $n$ worker threads and $n$ parent tasks are running concurrently. After each parent task submits a child task, it synchronously waits for the child task to finish. The child tasks enter the queue, yet no idle threads are available to execute them; because the parent tasks never finish, the worker threads are never released either, ultimately resulting in thread starvation deadlock.

![Thread Pool misuse leading to deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/production-accident-threadpool-sharing-deadlock-75237ba7.png)

A parent task and the child tasks it synchronously waits on must not share that bounded Thread Pool in a way that creates a circular wait. You can let the parent task execute the child logic directly, switch to non-blocking task orchestration, or assign separate execution resources to child tasks that genuinely require isolation.

## Do Tasks Automatically Stop After Timing Out?

`Future.get(timeout, unit)` only bounds how long the calling thread waits for the result. When `TimeoutException` is thrown, the background task may still be running. Calling `cancel(true)` attempts to interrupt the executing thread, yet interruption is a cooperative mechanism—if the task does not check its interrupt status or the underlying call does not respond to interruption, the task may still continue executing.

```java
Future<String> future = executor.submit(this::callRemoteService);

try {
    return future.get(200, TimeUnit.MILLISECONDS);
} catch (TimeoutException e) {
    future.cancel(true);
    throw new IllegalStateException("调用超时", e);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw new IllegalStateException("等待任务时被中断", e);
} catch (ExecutionException e) {
    throw new IllegalStateException("任务执行失败", e.getCause());
}
```

This snippet is still no substitute for network timeouts. HTTP, database, and Redis clients must still configure connect, read, and overall call timeouts; otherwise threads may remain stuck indefinitely inside low-level operations that ignore interruption.

When task code catches `InterruptedException`, it should generally stop the current work; if it cannot terminate cleanly at that layer, it should restore the interrupt flag so upper layers can continue handling it:

```java
try {
    blockingCall();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    return;
}
```

`CompletableFuture.orTimeout()` completes the `CompletableFuture` exceptionally upon timeout, yet it does not automatically terminate the underlying task. Nor does the `mayInterruptIfRunning` argument in `CompletableFuture.cancel(true)` trigger thread interruption in that implementation. When orchestrating blocking tasks with `CompletableFuture`, you still need timeouts and cancellation strategies on the underlying calls.

## Why Do Exceptions in Asynchronous Tasks Easily Get Swallowed?

When a `Runnable` submitted via `execute()` throws an uncaught exception, the worker thread terminates abnormally and the exception can be logged by the thread's `UncaughtExceptionHandler`. When submitted via `submit()`, the task is typically wrapped in a `FutureTask`, storing the exception inside the returned `Future`; if the caller neither retains the `Future` nor calls `get()`, the exception may produce no business log at all.

`ThreadPoolExecutor.afterExecute()` shares this distinction. When using `submit()`, the `Throwable` passed to `afterExecute()` is normally `null`, so you must check whether the task is a completed `Future` and extract the exception via `get()`.

It is best to standardize exception handling across the project: either callers consume the `Future`, task entry points proactively catch and log exceptions, or a customized Thread Pool handles them centrally. Logs should include task type, business ID, and Trace ID rather than just printing a stack trace detached from business context.

## Which Metrics Should a Thread Pool Monitor?

`ThreadPoolExecutor`'s built-in statistics expose current pool size, active thread count, largest pool size, total task count, completed task count, and queue length. Most of these values are approximate—well suited for monitoring and trend analysis, not for business decisions requiring strict consistency.

Production monitoring should cover at least:

- **Task Throughput**: Submission rate, execution start rate, and completion rate.
- **Thread State**: Current thread count, active thread count, historical largest thread count, and active ratio.
- **Queue State**: Current length, total capacity, utilization ratio, and queue wait time.
- **Task Outcomes**: Execution duration, success count, exception count, timeout count, cancellation count, and rejection count.
- **Associated Resources**: CPU, heap memory, database connection pools, HTTP connection pools, and downstream latency.

Total task count and completed task count are cumulative values, so you need to compute deltas over a time window to obtain rates. Queue length must also be interpreted alongside its trend: two queues both at length 100—one draining from 500 down to 100, and the other climbing from 10 up to 100—carry very different risk profiles.

Queue wait time and execution time must not be lumped into a single metric. Rising queue wait time with stable execution time usually indicates insufficient capacity or a traffic spike; execution time rising first, followed by queue growth, points to checking task logic and downstream services first. You can record a timestamp upon submission and calculate both intervals separately when the task starts and finishes.

A queue growing abruptly within a single collection interval may simply be a brief spike that quickly subsides. Alerts should pair thresholds with sustained duration and verify whether the backlog can drain on its own. A queue lingering at a high watermark with completion rate continuously below submission rate means old tasks are piling up; when P99 queue wait time approaches the task's tolerable wait deadline, alert even if the queue is not yet full. Rejection counts should be tracked separately: alert immediately on rejections for core tasks, and apply rejection-ratio and duration thresholds to tasks where drops are acceptable.

## What Problems Can Dynamic Parameter Tuning Solve?

When task latency has not changed noticeably, and CPU, connection pools, and downstream dependencies still have headroom—yet current concurrency simply cannot keep up with submission speed—adjusting the thread count can help. Conversely, if threads are all stuck on database connections, slow SQL, or downstream timeouts, raising the thread count only adds more waiters.

Several parameters of `ThreadPoolExecutor` can be modified at runtime, though they take effect differently. While running, you can update `corePoolSize`, `maximumPoolSize`, `keepAliveTime`, the Rejection Policy, and the `ThreadFactory`. After increasing `corePoolSize`, as long as tasks remain in the queue, the pool creates new threads on demand. Reducing `corePoolSize` or `maximumPoolSize` does not interrupt running tasks; excess worker threads exit once they become idle. A newly assigned `ThreadFactory` only affects threads created afterward and does not rename existing worker threads.

Pay attention to ordering when modifying `corePoolSize` and `maximumPoolSize`:

- If the new `corePoolSize` is higher than the old `maximumPoolSize`, raise `maximumPoolSize` first, then update `corePoolSize`.
- If the new `maximumPoolSize` is lower than the old `corePoolSize`, lower `corePoolSize` first, then update `maximumPoolSize`.

Otherwise, parameter validation throws `IllegalArgumentException`.

The JDK does not provide a general-purpose API to resize an existing Blocking Queue's capacity. When queue resizing is needed, use a battle-tested resizable queue or dynamic Thread Pool framework; modifying `LinkedBlockingQueue` yourself requires handling concurrent visibility, enqueue conditions, and signal wake-up logic together rather than merely changing a capacity field.

The Meituan engineering team introduced design approaches for dynamic Thread Pool configuration, monitoring, and alerting in [Java Thread Pool Implementation Principles and Practices at Meituan](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html). Among open-source options, [Hippo4j](https://github.com/opengoofy/hippo4j) and [Dynamic TP](https://github.com/dromara/dynamic-tp) both offer dynamic configuration, monitoring, and alerting capabilities. Before adopting any of them, still verify compatibility with your project's Thread Pool types, configuration center, framework versions, and failure degradation behavior.

Pre-tuning parameters ahead of business peaks is best grounded in historical metrics or load-test results. If after an adjustment the completion rate fails to improve—and instead CPU climbs, connection pool waiting increases, or downstream error rates rise—roll back the parameters and keep investigating the task logic and dependencies.

For live production adjustments, enforce parameter upper/lower bounds, change audit logs, canary scope, and rollback values. Try to change only one major variable at a time, observe task completion rate, queue wait time, rejection counts, and downstream pressure, and only then decide whether to adjust further.

## What Other Easily Overlooked Issues Exist?

### Do Not Repeatedly Create Thread Pools

Thread Pools exist to reuse threads and must not be recreated on every request or every method call. Frequent creation adds thread startup and teardown overhead and easily omits shutdown logic. Application-level Thread Pools should typically have their lifecycle managed centrally by the container.

Spring's `@Async`, scheduled jobs, web containers, and certain client libraries also maintain internal Thread Pools. Just because a project has no explicit `new ThreadPoolExecutor()` call does not mean there are no Thread Pools that need configuration and monitoring.

### Do Not Let Long Tasks Saturate Shared Thread Pools

Long-blocking tasks occupy worker threads, forcing subsequent short tasks to wait in line. Report exports, file processing, and slow external API calls are better suited to dedicated execution resources, or converted into asynchronous jobs that return a task status to the user.

`CompletableFuture` only handles task orchestration—it does not turn blocking network calls into non-blocking I/O. Asynchronous methods without an explicit `Executor` typically default to the common pool (`ForkJoinPool.commonPool()`), and once the common pool is blocked, other asynchronous tasks across the application may be impacted as well.

### Clean Up Thread Context

Thread Pools reuse threads. If a previous task writes to `ThreadLocal` without clearing it, subsequent tasks running on the same thread may read stale values, and large objects may also remain referenced by worker threads for a long time.

Context propagation and cleanup should be handled by a unified task wrapper, restoring or clearing the original values inside a `finally` block. Logging MDC, login credentials, and tenant context all require attention here. For cross-thread propagation scenarios, you can also consider [TransmittableThreadLocal](https://github.com/alibaba/transmittable-thread-local), while still verifying the wrapping mechanism and cleanup timing.

### Shut Down Thread Pools Gracefully

`shutdown()` stops accepting new tasks while continuing to process already submitted ones; `shutdownNow()` attempts to interrupt running tasks and returns tasks that had not yet started. Neither waits for the Thread Pool to finish terminating.

```java
executor.shutdown();
try {
    if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
        executor.shutdownNow();
        if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
            System.err.println("线程池未能正常退出");
        }
    }
} catch (InterruptedException e) {
    executor.shutdownNow();
    Thread.currentThread().interrupt();
}
```

Tasks must respond properly to interruption; otherwise `shutdownNow()` cannot guarantee immediate termination either. During application shutdown, you also need to decide whether queued tasks may be discarded; business tasks that cannot be lost must never exist solely in process memory.

## Are Traditional Thread Pools Still Needed with Virtual Threads?

Virtual Threads are well suited for tasks involving substantial blocking waits. Creating and switching them is far cheaper than with platform threads, so the typical pattern is one Virtual Thread per task rather than pooling and reusing Virtual Threads in a fixed-size pool.

When you need to cap concurrency to databases or downstream APIs, continue using connection pools, `Semaphore`, rate limiters, and similar resource-bounding mechanisms. Having huge numbers of Virtual Threads does not increase database connections, CPU cores, or downstream API capacity.

Traditional platform Thread Pools remain appropriate for CPU-bound tasks, tasks requiring pinned/fixed scheduler threads, and components that must explicitly govern platform threads and work queues. Whether a project should migrate also depends on JDK version, framework support, observability tooling, and existing async models. For further details, refer to [Summary of Common Questions on Virtual Threads](./virtual-thread.md).

## How to Answer Thread Pool Configuration Questions in Interviews?

When answering Thread Pool parameter questions, start from task characteristics and system capacity: first estimate concurrency demand from peak task submission rate and task execution latency, then distinguish compute time from I/O wait time; thread count is also constrained by CPU, database connection pools, HTTP connection pools, and downstream rate limits. The queue only absorbs short bursts, and its capacity must satisfy both business wait deadlines and memory limits. Once initial parameters are set, refine them incrementally through load testing and production monitoring of submission rate, completion rate, queue wait time, execution time, and rejection counts.

When the interviewer follows up on queue backlogs, do not simply answer "enlarge the Thread Pool." First compare task submission rate against completion rate, then examine execution time, thread dumps, CPU, connection pools, and downstream latency. Traffic surges call for rate limiting or instance scaling; slow tasks call for fixing SQL, locks, or downstream faults; expired tasks call for failing fast or routing to compensation. Dynamic parameter tuning only fixes misconfigured capacity—it cannot replace timeouts, isolation, rate limiting, and downstream governance.

## References

- [ThreadPoolExecutor API Documentation](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
- [Future API Documentation](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Future.html)
- [CompletableFuture API Documentation](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [Java Thread Pool Implementation Principles and Practices at Meituan](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html)
- *Java Concurrency in Practice*
