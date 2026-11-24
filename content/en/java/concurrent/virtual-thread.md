---
title: "Summary of Common Questions on Virtual Threads"
description: "A detailed guide to Java 21 Virtual Threads: covering the positioning of Virtual Threads, scheduling principles, differences from platform threads, suitable scenarios, creation methods, performance boundaries, Spring Boot integration, and practical caveats."
category: Java
tag:
  - Java Concurrency
head:
  - - meta
    - name: keywords
      content: Java Virtual Threads,Virtual Threads,Project Loom,Java 21 New Features,Lightweight Threads,Coroutines,Virtual Thread Principles
lang: en
sourceRef: zh-ref/java/concurrent/virtual-thread.md
---

When a web request arrives, the code needs to query a database, call remote APIs, and read/write files. With the traditional synchronous programming style, this request occupies a platform thread even though most of its time is spent waiting on I/O.

Thread pools alleviate the cost of thread creation, but they cannot change one fundamental fact: the number of platform threads is still constrained by OS thread limits, memory, and scheduling overhead. As concurrent requests keep rising, the threads in the pool fill up with queued tasks and throughput quickly hits a wall.

Virtual threads exist to solve this problem. They allow us to keep writing simple, synchronous blocking code while ensuring that tasks waiting on I/O no longer tie up expensive platform threads for long durations.

## What Are Virtual Threads?

A Virtual Thread is a lightweight thread officially introduced in Java 21 and is an implementation of `java.lang.Thread`. It is managed and scheduled by the JDK rather than being bound 1:1 to a specific OS thread.

A Platform Thread is typically a thin wrapper around an OS thread. While running, a platform thread occupies an OS thread for its entire lifecycle. Virtual threads work differently: a virtual thread must mount onto a platform thread to execute Java code; when it performs a suspendable blocking operation, the JDK can unmount it from the platform thread, freeing that platform thread to execute other virtual threads.

Therefore, the number of virtual threads can far exceed the number of platform threads. The official documentation draws an analogy with virtual memory: just as the OS maps a large virtual address space onto limited physical memory, the Java runtime maps a large number of virtual threads onto a smaller number of platform threads.

Key points about virtual threads:

- A virtual thread is still a `Thread`, supporting `ThreadLocal`, interruption, exception stack traces, debugging, and JFR observability.
- Virtual threads are suited for tasks involving heavy blocking waits, such as HTTP calls, database queries, message queue access, and file or network I/O.
- Virtual threads are not faster CPU execution units; they will not make a piece of pure computational code run faster.
- Virtual threads are very cheap; you should generally adopt a "one virtual thread per task" model rather than pooling and reusing them like platform threads.

## What Is the Relationship Between Virtual Threads and Platform Threads?

In Java, the relationship among virtual threads, platform threads, and OS threads looks roughly like this:

![Relationship among virtual threads, platform threads, and OS kernel threads](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/virtual-threads-platform-threads-kernel-threads--57103066.png)

On mainstream operating systems such as Windows and Linux, HotSpot JVM platform threads typically follow a one-to-one threading model—one platform thread corresponds to one OS thread. With the introduction of virtual threads, the JDK adds another scheduling layer on top of platform threads:

- The virtual thread is the bearer of the task; `Thread.currentThread()` observed by business code returns the virtual thread itself.
- The platform thread acts as the carrier thread for the virtual thread, responsible for actually executing the Java code inside the virtual thread.
- The operating system still only schedules platform threads and is unaware of the existence of virtual threads.

When a virtual thread starts executing, the JDK scheduler mounts it onto a platform thread. When it reaches a suspendable blocking point—such as blocking I/O, `BlockingQueue.take()`, or `Future.get()`—the virtual thread can unmount, releasing the platform thread to continue executing other virtual threads. Once the blocking operation becomes ready, the virtual thread is resubmitted to the scheduler and mounted onto a platform thread to resume execution.

This mounting and unmounting process is transparent to business code. You still write ordinary synchronous code:

```java
String body = httpClient.send(request, BodyHandlers.ofString()).body();
Result result = repository.query(body);
return service.handle(result);
```

If blocking occurs inside these calls, the virtual thread can suspend itself; with a platform thread, that thread would continuously tie up the underlying OS thread.

## What Is the Relationship Between Project Loom and Virtual Threads?

Project Loom is an OpenJDK project aimed at improving Java's concurrency model, and virtual threads are one of Loom's most important deliverables. Virtual threads were previewed in JDK 19 and JDK 20 before becoming a permanent feature in JDK 21 via [JEP 444](https://openjdk.org/jeps/444).

Loom did more than just add a lightweight thread API. It also drove updates to JDK blocking I/O, debugging, JFR, thread dumps, and related tooling so that the traditional thread-per-request programming style becomes scalable again under high-concurrency I/O workloads.

This is also a major difference between virtual threads and ordinary "coroutine libraries": virtual threads are integrated into the Java platform's thread model. Debuggers, profilers, JFR, and thread dumps can all understand them as threads, rather than splitting business call chains into fragments of callback stages.

## What Problem Do Virtual Threads Solve?

Many server-side applications naturally fit a "one thread per request" model. Its advantages are clear: code executes sequentially, exceptions propagate cleanly along the call stack, debuggers can step through line by line, and thread dumps clearly show where a request is stuck.

The problem is that platform threads are too expensive.

Suppose an endpoint has an average latency of 50 ms and the system needs to achieve 2,000 QPS; roughly estimating via Little's Law, it needs to handle about 100 concurrent requests at the same time. If the endpoint's average latency rises to 500 ms, the same 2,000 QPS requires about 1,000 concurrent requests. When each request occupies a platform thread, thread count easily becomes the bottleneck before CPU, network bandwidth, or database connections do.

Asynchronous and Reactive programming can free threads from waiting on I/O, but the trade-offs are equally apparent: call chains are broken into callbacks, `CompletableFuture` chains, or reactive pipelines, making exception handling, debugging, flame graphs, and thread context propagation much more complex.

Virtual threads aim to preserve the readability of synchronous code while lowering the cost of tying up platform threads during blocking waits. What they primarily improve is throughput and concurrency capacity—not the execution speed of a single request.

## What Scenarios Are Virtual Threads Suitable For?

Virtual threads are best suited for tasks with the following characteristics:

- High number of concurrent tasks, typically in the thousands or tens of thousands.
- Tasks spend most of their time waiting on I/O, such as databases, Redis, HTTP/RPC calls, message queues, and file or network reads/writes.
- Existing code mainly uses a synchronous blocking model, and you do not want to rewrite it into complex async chains just for scalability.
- You want to preserve traditional call stacks for easier debugging, load-test analysis, and production troubleshooting.

Typical scenarios include:

- Spring MVC / Servlet endpoints calling databases and external HTTP services.
- Background jobs calling third-party APIs in batches.
- Gateways or aggregation services concurrently invoking multiple downstream services.
- Message consumption logic containing blocking database writes or remote calls.

Virtual threads are not suited for making CPU-intensive tasks "run faster." If a task mainly computes hashes, compresses images, sorts large arrays, or evaluates complex rule engines, adding threads beyond the number of CPU cores generally will not increase throughput further. CPU-intensive workloads should still focus on algorithms, data structures, batching, parallel streams, dedicated compute thread pools, or native optimizations.

## How Do You Create Virtual Threads?

There are four common ways to create virtual threads in JDK 21.

### Using `Thread.startVirtualThread()`

Suitable for quickly starting a simple virtual thread:

```java
public class VirtualThreadDemo {
  public static void main(String[] args) throws InterruptedException {
    Thread thread = Thread.startVirtualThread(() -> {
      System.out.println(Thread.currentThread());
    });

    thread.join();
  }
}
```

Note that virtual threads are daemon threads. If the `main` method does not wait for them to finish, the JVM may exit immediately before the task has had a chance to complete.

### Using `Thread.ofVirtual()`

`Thread.ofVirtual()` returns a `Thread.Builder.OfVirtual`, which allows setting a thread name and choosing whether to start immediately upon creation or leave it unstarted:

```java
public class VirtualThreadDemo {
  public static void main(String[] args) throws InterruptedException {
    Thread unstarted = Thread.ofVirtual()
        .name("order-query")
        .unstarted(() -> System.out.println("query order"));

    unstarted.start();
    unstarted.join();

    Thread started = Thread.ofVirtual()
        .name("payment-query")
        .start(() -> System.out.println("query payment"));

    started.join();
  }
}
```

### Using `ThreadFactory`

If you want consistent thread naming or need to pass a thread factory to a framework, you can create virtual threads via `ThreadFactory`:

```java
import java.util.concurrent.ThreadFactory;

public class VirtualThreadDemo {
  public static void main(String[] args) throws InterruptedException {
    ThreadFactory factory = Thread.ofVirtual()
        .name("worker-", 0)
        .factory();

    Thread thread = factory.newThread(() -> {
      System.out.println(Thread.currentThread().getName());
    });

    thread.start();
    thread.join();
  }
}
```

### Using `Executors.newVirtualThreadPerTaskExecutor()`

This is the most common approach in business application development. It creates a new virtual thread for each submitted task:

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class VirtualThreadDemo {
  public static void main(String[] args) throws Exception {
    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
      Future<String> future = executor.submit(() -> {
        return "hello virtual thread";
      });

      System.out.println(future.get());
    }
  }
}
```

Here, `ExecutorService` is not a thread pool in the traditional sense. It does not maintain a fixed set of virtual threads for reuse; instead, it creates a new virtual thread per task. When the `try-with-resources` block exits, `close()` is called, waiting for submitted tasks to finish.

## Should Virtual Threads Be Pooled?

Do not pool virtual threads.

The main goal of a thread pool is to reuse expensive platform threads while incidentally bounding concurrency. Virtual threads themselves are not a scarce resource, so pooling them generally makes no sense and drags the "one thread per task" model back into old patterns.

If your real goal is to limit concurrency when accessing a specific resource, you should limit the resource itself rather than the number of virtual threads. For example, if a legacy system can only handle at most 20 concurrent requests, you can use a `Semaphore` to control concurrency:

```java
import java.util.concurrent.Semaphore;

public class OldServiceClient {
  private static final Semaphore LIMIT = new Semaphore(20);

  public String call() throws InterruptedException {
    LIMIT.acquire();
    try {
      return doCall();
    } finally {
      LIMIT.release();
    }
  }

  private String doCall() {
    return "ok";
  }
}
```

If the bottleneck is database connections, adjust the connection pool size; if the bottleneck is downstream API rate limiting, implement rate limiting, circuit breaking, and retry with backoff. Virtual threads make waiting cheap, but they do not make database connections, downstream capacity, CPU, or memory infinite.

## Performance Comparison: Virtual Threads vs. Platform Threads

Conclusion first: virtual threads are not "threads that run faster," but rather "threads that can be created in large numbers with much lower blocking cost." They typically boost throughput for I/O-intensive services, but they do not reduce the inherent latency of a single database query or HTTP call.

The following example simulates 10,000 tasks that each block for 1 second:

```java
import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

public class VirtualThreadCompareDemo {
  public static void main(String[] args) {
    long start = System.currentTimeMillis();

    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
      IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
          Thread.sleep(Duration.ofSeconds(1));
          return i;
        });
      });
    }

    System.out.println("cost: " + (System.currentTimeMillis() - start) + "ms");
  }
}
```

If you replace it with `Executors.newFixedThreadPool(200)`, at most 200 tasks can execute at the same time, so the 10,000 tasks are processed in batches. Roughly estimating at 1 second per batch, total elapsed time approaches 50 seconds. The virtual thread version allows all 10,000 tasks to enter the waiting state almost simultaneously, freeing platform threads during the wait so total elapsed time is much closer to the wait time of a single task.

This example only illustrates that virtual threads are friendly to "blocking waits"; it is not a rigorous benchmark. Real-world services depend on database connection pools, HTTP client connection pools, downstream rate limits, GC, object allocation, lock contention, container CPU quotas, and more.

## What Are the Underlying Principles of Virtual Threads?

The execution of virtual threads can be broken down into three aspects: scheduling, mounting/unmounting, and stack management.

### Scheduling

Platform threads rely on OS scheduling. Virtual threads are scheduled by the JDK's own scheduler and carried for execution by platform threads. As described in JEP 444, the virtual thread scheduler is a work-stealing `ForkJoinPool` operating in FIFO mode, which is separate from the common pool used by parallel streams.

By default, the scheduler's parallelism is tied to the number of available processors and can be tuned via the following system properties:

- `jdk.virtualThreadScheduler.parallelism`: Target parallelism of the scheduler.
- `jdk.virtualThreadScheduler.maxPoolSize`: Maximum number of platform threads the scheduler can expand to.

Most business systems do not need to tune these two properties. Investigating connection pools, rate limits, locks, and blocking points first is usually far more effective than tweaking scheduler parameters.

### Mounting and Unmounting

When a virtual thread executes Java code, it mounts onto a platform thread. When it encounters a suspendable blocking operation, the virtual thread can save its current execution state and unmount, allowing the platform thread to serve other virtual threads.

Common JDK blocking operations have already been adapted for virtual threads. For example, network I/O, `BlockingQueue`, `Future.get()`, etc., typically do not tie up the underlying platform thread for long when blocking inside a virtual thread.

Not all blocking operations can unmount. From JDK 21 through JDK 23, if a virtual thread blocks inside a `synchronized` block or method, **Pinning** occurs—meaning it gets pinned to its carrier thread. [JEP 491](https://openjdk.org/jeps/491) in JDK 24 improved this so that virtual threads blocking inside `synchronized` can also release the underlying platform thread, eliminating the vast majority of `synchronized`-related pinning scenarios. Remaining pinning risks still deserve attention when calling native methods or code using the Foreign Function & Memory API.

### Stack Management

Platform threads typically use fixed-size OS thread stacks. Virtual thread stacks are stored on the Java Heap as stack chunk objects that grow and shrink dynamically as execution progresses. This is one of the key reasons virtual threads can be created in massive numbers.

However, this does not mean virtual threads have zero memory cost. Every virtual thread is still an object and incurs memory overhead for stack chunks, local variables, `ThreadLocal`, and so on. Millions of virtual threads are not free—just vastly more realistic than millions of platform threads.

## What Is Pinning?

Pinning can be understood as "a virtual thread temporarily unable to unmount from its carrier thread." Once a virtual thread is pinned to a platform thread, it holds onto the underlying OS thread for the duration of the block, degrading scalability as well.

From JDK 21 through JDK 23, the most typical pinning scenario is a virtual thread performing blocking I/O inside a `synchronized` block or method:

```java
public synchronized String load() throws IOException {
  return remoteClient.get("/config"); // In JDK 21-23, blocking here may pin the carrier thread
}
```

Short, purely in-memory `synchronized` blocks are generally fine. What really needs attention is holding a lock while performing slow I/O on a hot path—such as querying a database, calling a remote API, or reading large files while holding an object monitor.

If you are on JDK 21 through JDK 23, consider:

- Avoiding slow I/O inside `synchronized`.
- Using `ReentrantLock` with `try/finally` unlock for high-frequency blocking lock scenarios.
- Monitoring `jdk.VirtualThreadPinned` events via JFR.
- Temporarily enabling `-Djdk.tracePinnedThreads=full` to locate pinned call stacks.

If you are on JDK 24 or later, the primary pinning issues caused by `synchronized` have been resolved by JEP 491. Choosing between `synchronized` and `java.util.concurrent.locks` can go back to being decided by code semantics, maintainability, and locking features themselves.

## What Caveats Should You Keep in Mind When Using Virtual Threads?

### Do Not Treat Virtual Threads as a CPU Speedup Tool

Virtual threads improve concurrency capacity for I/O-waiting tasks. CPU-intensive tasks still compete for actual CPU timeslices; no matter how many virtual threads you spawn, they cannot bypass the physical limit of CPU cores.

### Do Not Constrain Virtual Threads with a Thread-Pool Mindset

Do not create fixed-size pools of virtual threads. When you need to limit concurrency, use `Semaphore`, connection pools, rate limiters, or queue capacities to constrain the specific resource.

### Be Careful Caching Large Objects in `ThreadLocal`

Java 21 GA guarantees that virtual threads support `ThreadLocal`, which helps maintain compatibility with legacy code and frameworks. However, do not use `ThreadLocal` to cache large objects per virtual thread.

Previously in a thread pool, a `ThreadLocal<SimpleDateFormat>` might correspond to only dozens or hundreds of platform threads. After migrating to virtual threads, if you use one virtual thread per task, the exact same code may allocate a cached object for every single task, amplifying memory consumption and allocation pressure.

Passing request context, user IDs, or Trace IDs is usually fine. Caching database connections, large arrays, heavy formatters, or client objects should be re-evaluated. JDK 25 finalized Scoped Values via JEP 506, which is much better suited for passing immutable context across massive numbers of virtual threads.

### Virtual Threads Do Not Eliminate Thread-Safety Issues

Virtual threads make thread creation cheap, which also means you are much more likely to run huge numbers of concurrent tasks simultaneously. Data races that previously remained hidden due to smaller thread pools may surface much more easily after switching to virtual threads.

You must still follow the fundamental rules of concurrent programming: shared mutable state requires locking or isolation, and database connections, session objects, or non-thread-safe clients must not be misused concurrently across multiple virtual threads.

### Watch Connection Pools and Downstream Capacity

After migrating a service to virtual threads, the first bottleneck is often no longer the business thread pool, but rather the database connection pool, HTTP connection pool, Redis connections, or downstream rate limits.

This is not a flaw in virtual threads. Virtual threads simply allow more tasks to advance concurrently; actual shared resources still need capacity management. During load testing, monitor these metrics together:

- Application QPS, latency, and error rate.
- Database connection pool active connections, wait queue, and timeouts.
- HTTP client connection pool and downstream 429/5xx responses.
- CPU, heap memory, GC, and object allocation rate.
- Virtual thread events and lock contention in JFR.

### Do Not Mix Too Many Asynchronous Models

Virtual threads are best suited for synchronous blocking code. Systems already written end-to-end asynchronously with Reactive/WebFlux/Netty will not necessarily see noticeable gains simply from turning on virtual threads.

Even worse is mixing models: virtual threads on the outer layer combined with heavy use of async callbacks and thread pools inside, leaving you juggling virtual threads, event loops, business thread pools, and connection pools simultaneously during troubleshooting. When migrating, it is best to pilot on synchronous blocking call chains first rather than flipping the entire system at once.

## How Do You Migrate from a Traditional Thread Pool to Virtual Threads?

For existing synchronous blocking code, idioms like `submit()` and `Future.get()` can typically be kept as-is. During migration, inspect what other responsibilities the original thread pool was handling—such as capping downstream concurrency, bounding queued tasks, or rejecting overload requests.

Oracle's [Virtual Threads Migration Guide](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html) recommends this pattern: create one virtual thread per task, and use tools like `Semaphore` to limit concurrency when accessing constrained resources.

### Before Migration: Executing HTTP Calls with a Platform Thread Pool

Suppose an application shares a dedicated thread pool for calling a downstream service, using at most 20 platform threads and queuing at most 100 tasks. Below we show only task submission and result retrieval, omitting imports, HTTP client initialization, exception handling, and resource cleanup on application shutdown:

```java
ExecutorService executor = new ThreadPoolExecutor(
    20, 20,
    0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(100),
    Thread.ofPlatform().name("remote-call-", 0).factory(),
    new ThreadPoolExecutor.AbortPolicy());

Future<String> future = executor.submit(() ->
    httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body());

String body = future.get(3, TimeUnit.SECONDS);
```

Here, the 20 threads also cap how many calls run simultaneously. When all threads are busy, new tasks enter the queue; once the queue is full as well, `AbortPolicy` throws a `RejectedExecutionException`.

If you directly replace this thread pool with `Executors.newVirtualThreadPerTaskExecutor()`, the original concurrency and queuing limits disappear. As stated in the [`Executors` API documentation](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html#newVirtualThreadPerTaskExecutor()>), this executor places no bound on the number of virtual threads created, though the application remains bounded by resources such as CPU and memory.

### After Migration: One Virtual Thread per Task, Limiting Downstream Concurrency Separately

The example below uses standard Java 21 APIs, preserves synchronous HTTP calls and `Future`, and uses a `Semaphore` to limit simultaneous downstream calls locally. The 20 permits, 200 ms wait time, and subsequent timeouts are merely example values; in practice, configure them according to downstream capacity and endpoint latency. The example returns the response body directly; real business code also needs to handle outcomes based on HTTP status codes.

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class RemoteServiceClient implements AutoCloseable {
  private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
  private final Semaphore limit = new Semaphore(20);
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(1))
      .build();

  public String fetch(URI uri)
      throws InterruptedException, ExecutionException, TimeoutException {
    Future<String> future = executor.submit(() -> {
      if (!limit.tryAcquire(200, TimeUnit.MILLISECONDS)) {
        throw new RejectedExecutionException("等待下游调用许可超时");
      }

      try {
        HttpRequest request = HttpRequest.newBuilder(uri)
            .timeout(Duration.ofSeconds(2))
            .GET()
            .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body();
      } finally {
        limit.release();
      }
    });

    try {
      return future.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException | InterruptedException e) {
      future.cancel(true);
      throw e;
    }
  }

  @Override
  public void close() {
    executor.close();
    httpClient.close();
  }
}
```

Calls to the same downstream service should share this `RemoteServiceClient` instance—for example, managed by Spring as a singleton Bean with `close()` called on application shutdown. Creating a new instance on every request would give each instance its own 20 permits, failing to enforce a unified concurrency limit. When multiple application instances are deployed, each instance's permits are also independent.

When permit acquisition fails, the `RejectedExecutionException` inside the task is wrapped in an `ExecutionException`, and the caller can inspect `getCause()` to determine the reason. Its handling location differs from a rejection exception thrown directly at task submission time prior to migration.

This example bounds call concurrency and sets a timeout for acquiring a permit, but it does not preserve the original limit of at most 100 queued tasks. If a burst of requests arrives in a short window, a large number of virtual threads waiting for permits can still be created. Systems that previously relied on a bounded queue to protect memory also need to limit in-flight requests at the ingress, or use bounded queues / fast rejection to handle overload.

### What Else Should You Watch Out for with Timeouts and Task Cancellation?

[`Future.get(3, TimeUnit.SECONDS)`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html) begins counting the wait timeout when `get()` is called, and the task may still be running after it times out. When waiting times out or the caller is interrupted, the example calls `future.cancel(true)` to attempt to cancel the task before rethrowing the exception to the caller. Platform thread pools require handling both of these cases as well.

Here, rethrowing `InterruptedException` directly is sufficient; if you catch it and cannot rethrow it, you typically need to call `Thread.currentThread().interrupt()` to restore the interrupt flag so upper layers do not lose the interruption signal.

The timeouts in the example have different starting points: 200 ms applies to waiting for a permit, connect timeout and HTTP request timeout are handled by the HTTP client, and 3 seconds covers waiting for the overall task result—which may overlap with both permit waiting and the HTTP call. Their durations can overlap and cannot simply be summed together. When multiple downstream calls are involved, you also need to allocate timeout budgets based on the request's remaining time.

Exceptions must also be distinguished carefully: a timeout in `get()` throws `TimeoutException` directly; an `HttpTimeoutException` triggered by [`HttpRequest.Builder.timeout()`](<https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html#timeout(java.time.Duration)>) occurs inside the task, so the caller receives an `ExecutionException` wrapping it. Catching only `TimeoutException` will miss HTTP client request timeouts.

`cancel(true)` relies on the task responding to interruption and does not guarantee immediate termination. The JDK's default [`HttpClient.send()` implementation](<https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html#send(java.net.http.HttpRequest,java.net.http.HttpResponse.BodyHandler)>) attempts to cancel the HTTP exchange when interrupted, yet the request may already have reached the server and remote business logic may continue executing. When switching to JDBC drivers or third-party SDKs, check their timeout and interruption behaviors; for write operations, also consider idempotency.

Additionally, [`ExecutorService.close()`](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html#close()>) waits for submitted tasks to complete. If you create an executor using `try-with-resources` inside a single request, even after `get()` times out, exiting the block may still wait for the task. The example above reuses the executor as a client field and releases it uniformly on application shutdown. `close()` itself has no timeout limit, so services with strict shutdown time requirements also need a shutdown flow with a timeout.

## How Do You Enable Virtual Threads in Spring Boot?

Starting from Spring Boot 3.2, a fairly direct toggle is provided. When running on Java 21 or later, you can enable it in configuration:

```properties
spring.threads.virtual.enabled=true
```

The official Spring Boot documentation also notes several practical points:

- Once virtual threads are enabled, certain properties configuring traditional thread pool sizes no longer take effect in the same way, because virtual thread scheduling relies on the JVM-wide platform thread pool.
- Virtual threads are daemon threads. If your application relies on background tasks such as `@Scheduled` to keep the JVM alive, setting `spring.main.keep-alive=true` is recommended.
- The Spring Boot team currently recommends Java 24 or later for a better virtual threads experience, mainly due to Pinning improvements.

A simple configuration looks like this:

```yaml
spring:
  threads:
    virtual:
      enabled: true
  main:
    keep-alive: true
```

Enabling it does not mean every endpoint becomes faster. It is much more likely to improve synchronous blocking endpoints with noticeable I/O waiting and high concurrency. If an endpoint is mainly bottlenecked by CPU, lock contention, slow SQL itself, or downstream rate limiting, virtual threads will only expose those bottlenecks sooner.

## How Do You Troubleshoot Virtual Thread Issues?

The JDK has added significant observability support for virtual threads.

### Exporting Thread Dumps Using `jcmd`

Traditional `jstack` is ill-suited when dealing with tens of thousands of virtual threads. The JDK provides a new thread dump capability:

```bash
jcmd <pid> Thread.dump_to_file -format=json thread-dump.json
```

You can also export in text format:

```bash
jcmd <pid> Thread.dump_to_file -format=text thread-dump.txt
```

JSON format is much better suited for tooling analysis, especially when there are huge numbers of virtual threads.

### Observing Virtual Thread Events with JFR

JFR events related to virtual threads include:

- `jdk.VirtualThreadStart`
- `jdk.VirtualThreadEnd`
- `jdk.VirtualThreadPinned`
- `jdk.VirtualThreadSubmitFailed`

Among these, `jdk.VirtualThreadPinned` is especially useful for diagnosing pinning. From JDK 24 onward, most `synchronized`-related pinning is resolved, though remaining cases such as native/FFM calls can still be observed via JFR.

### Temporarily Enabling Pinning Stack Traces

In JDK 21 through JDK 23, you can temporarily use:

```bash
-Djdk.tracePinnedThreads=full
```

It prints call stacks whenever a virtual thread blocks while pinned, which is helpful for locating issues in local or test environments. After JDK 24's JEP 491, the main `synchronized`-related pinning scenarios are improved; for remaining boundaries like native/FFM, it is still advisable to combine JFR and thread dumps for diagnosis.

## Common Virtual Thread Interview Questions

### What Is the Difference Between Virtual Threads and Platform Threads?

Platform threads typically map 1:1 to OS threads, have higher creation and context-switching costs, and are limited in number. Virtual threads are scheduled by the JDK, allowing large numbers of virtual threads to be mapped onto a small number of platform threads. When a virtual thread blocks waiting on I/O, it can usually unmount from its carrier thread so the platform thread can execute other virtual threads.

### Why Are Virtual Threads Well-Suited for I/O-Intensive Tasks?

I/O-intensive tasks spend most of their time waiting on external resources. A platform thread ties up an OS thread while waiting; a virtual thread can suspend itself and release its carrier thread while waiting. Consequently, the same number of platform threads can handle far more concurrent tasks.

### Are Virtual Threads Suitable for CPU-Intensive Tasks?

They should not be used as a CPU speedup tool. CPU-intensive tasks require actual CPU time, and having more threads than CPU cores only increases scheduling contention. Virtual threads improve high-concurrency waiting, not the speed of an individual computation task.

### Do Virtual Threads Need to Be Pooled?

No, and pooling is discouraged. Virtual threads are cheap and should be created per task. When you need to limit concurrency, constrain the specific resource—such as a database connection pool, HTTP connection pool, `Semaphore`, or rate limiter—rather than pooling virtual threads.

### Are Virtual Threads the Same as Coroutines?

Both belong to the lightweight concurrency paradigm, but Java virtual threads are an implementation of `java.lang.Thread` integrated into Java's existing thread model. Business code does not need `async/await` or manual `yield` calls. Compared to Go goroutines, virtual threads emphasize compatibility with Java's existing thread APIs, debugging tools, and blocking code style. To developers, they feel more like "much cheaper threads."

### Do We Still Need Reactive Programming After Virtual Threads?

It depends on the scenario. Many synchronous blocking server-side APIs can achieve better readability and sufficient throughput with virtual threads without writing complex callback chains just to avoid blocking threads. However, Reactive remains well-suited for streaming processing, backpressure, event-driven architectures, long-lived connections, and systems already built asynchronously end-to-end. Virtual threads are not a silver bullet replacing every asynchronous model.

### Can `synchronized` Still Be Used in JDK 21?

Yes, but mind its boundaries. In JDK 21 through JDK 23, executing blocking operations inside `synchronized` on a virtual thread can cause pinning. Short in-memory synchronization is fine; avoid holding a `synchronized` lock while performing slow I/O on hot paths. After JDK 24's improvements in JEP 491, `synchronized`-related pinning is largely resolved.

## References

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [Oracle Java 21 Documentation: Virtual Threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
- [Java 21 API: Executors](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html)
- [Java 21 API: Future](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html)
- [Java 21 API: ExecutorService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html)
- [Java 21 API: HttpClient](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html)
- [Java 21 API: HttpRequest.Builder](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html)
- [JEP 491: Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491)
- [JEP 506: Scoped Values](https://openjdk.org/jeps/506)
- [Spring Boot Reference Documentation: Virtual threads](https://docs.spring.io/spring-boot/reference/features/spring-application.html#features.spring-application.virtual-threads)
- [Spring Blog: Embracing Virtual Threads](https://spring.io/blog/2022/10/11/embracing-virtual-threads/)
- [Inside Java: Managing Throughput with Virtual Threads](https://inside.java/2024/02/04/sip094/)
- [Quarkus Blog: When Quarkus meets Virtual Threads](https://quarkus.io/blog/virtual-thread-1/)
