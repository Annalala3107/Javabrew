---
title: "Disruptor Common Interview Questions Summary"
description: "A summary of core concepts and key interview points for the Disruptor high-performance in-memory queue, covering Disruptor architecture (RingBuffer, Sequencer, WaitStrategy), high-performance design principles (lock-free design, cache-line padding, pre-allocated memory), comparison with ArrayBlockingQueue, producer-consumer patterns, and more."
category: High Performance
tag:
  - Message Queue
head:
  - - meta
    - name: keywords
      content: Disruptor,High-Performance Queue,RingBuffer,Lock-Free Queue,Cache Line Padding,LMAX,In-Memory Queue,Disruptor Interview
lang: en
sourceRef: zh-ref/high-performance/message-queue/disruptor-questions.md
---

Disruptor is a relatively niche topic; however, if your project experience includes Disruptor, it is very likely to come up in interviews.

An experienced-hire interview write-up shared earlier by a community member included several questions about Disruptor; here is the link to that post: [Dream Achieved! Successfully Landed Offers from ByteDance, Taobao, Pinduoduo, and Other Top Tech Giants!](https://mp.weixin.qq.com/s/C5QMjwEb6pzXACqZsyqC4A).

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/disruptor-interview-questions-7b03082f.png)

You can treat this article as a concise summary of Disruptor—none of the questions dive overly deep, making it ideal for interview preparation or a quick overview of Disruptor.

## What Is Disruptor?

Disruptor is an open-source, high-performance in-memory queue originally created by the UK foreign-exchange trading company LMAX to solve performance and memory-safety issues in in-memory queues.

According to Disruptor's official documentation, the LMAX system built on Disruptor (a next-generation retail financial trading platform) can sustain 6 million orders per second on a single thread. In 2011, Martin Fowler wrote an article titled [The LMAX Architecture](https://martinfowler.com/articles/lmax.html) specifically introducing the architecture of this LMAX system—check it out if you are interested.

After LMAX presented on it at QCon in 2010, Disruptor gained widespread industry attention and won Oracle's official 2011 Duke's Choice Award.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/640-ace7512f.png)

> Hosted by Oracle, the "Duke's Choice Awards" recognize the most influential Java technology applications developed by individuals or companies worldwide over the past year. It carries very high prestige!

I tracked down Oracle's original blog post announcing the Duke's Choice Award winners that year (article URL: <https://blogs.oracle.com/java/post/and-the-winners-arethe-dukes-choice-award>). As you can see from the article, other famous projects honored that same year included Netty and JRebel.

![2011 Official Oracle Duke's Choice Awards](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211015152323898-b9c97800.png)

Disruptor provides functionality somewhat similar to distributed queues like Kafka and RocketMQ, except its scope is within a single JVM (in-memory).

- GitHub repository: <https://github.com/LMAX-Exchange/disruptor>
- Official user guide: <https://lmax-exchange.github.io/disruptor/user-guide/index.html>

To learn how to use Disruptor in a Spring Boot project, check out this article: [Spring Boot + Disruptor Hands-On Getting Started](https://mp.weixin.qq.com/s/0iG5brK3bYF0BgSjX4jRiA).

## Why Use Disruptor?

Disruptor primarily solves the performance and memory-safety issues of the JDK's built-in thread-safe queues.

**Common thread-safe queues in the JDK are listed below:**

| Queue Name | Locking | Bounded? |
| --- | --- | --- |
| `ArrayBlockingQueue` | Locked (`ReentrantLock`) | Bounded |
| `LinkedBlockingQueue` | Locked (`ReentrantLock`) | Bounded |
| `LinkedTransferQueue` | Lock-free (`CAS`) | Unbounded |
| `ConcurrentLinkedQueue` | Lock-free (`CAS`) | Unbounded |

As shown in the table above, these JDK queues are either locked and bounded, or lock-free and unbounded. Locked queues inevitably hurt performance, while unbounded queues carry the risk of Out Of Memory (OOM).

Therefore, in general scenarios, we do not recommend using the JDK's built-in thread-safe queues for ultra-high-performance pipelines.

**Disruptor is different! It guarantees a bounded queue while remaining lock-free and thread-safe.**

The chart below from Disruptor's official website compares the latency histogram of Disruptor versus `ArrayBlockingQueue`.

![disruptor-latency-histogram](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/disruptor-latency-histogram-59e1549c.png)

Disruptor really is remarkably fast; why it is so fast will be explained later in this article.

In addition, Disruptor provides rich extension capabilities, such as batch operations and multiple wait strategies.

## What Is the Difference Between Kafka and Disruptor?

- **Kafka**: A distributed message queue, typically used for message passing across systems or services, and also used as a stream processing platform.
- **Disruptor**: An in-memory message queue, typically used for message passing between threads inside a single system.

They solve problems at completely different layers:

| Comparison Dimension | Kafka / RocketMQ / RabbitMQ | Disruptor |
| --- | --- | --- |
| Scope of use | Cross-process, cross-machine, cross-service | Within a single JVM process |
| Persistence | Usually supported | Does not handle persistence |
| Replay support | Usually supported | Does not handle historical replay |
| Core strengths | Reliable delivery, peak shaving, decoupling, consumer groups | Low latency, minimal lock contention, high-throughput event processing |
| Typical scenarios | Order events, log collection, asynchronous decoupling | Asynchronous logging, matching engines, in-process pipelines |

Therefore, Disruptor cannot replace distributed message queues such as Kafka or RocketMQ. Rather, it is better suited inside a service to make a high-frequency event-processing pipeline run much faster.

## Which Components Use Disruptor?

Quite a few open-source projects use Disruptor. Here are a few examples:

- **Log4j2**: A widely used logging framework that implements asynchronous logging on top of Disruptor.
- **SOFATracer**: An open-source distributed tracing tool from Ant Financial that uses Disruptor for asynchronous logging.
- **Storm**: An open-source distributed real-time computation system that uses Disruptor for intra-worker message passing (between threads on the same Storm node, without network communication).
- **HBase**: A distributed column-oriented database that leverages Disruptor to improve write concurrency performance.
- ...

## What Are the Core Concepts of Disruptor?

- **Event**: You can think of an `Event` as the message object placed in the queue waiting to be consumed.
- **EventFactory**: The event factory produces event instances and is needed when initializing the `Disruptor` class.
- **EventHandler**: An `Event` is processed in its corresponding `EventHandler`, which you can think of as the consumer in the Producer-Consumer model.
- **EventProcessor**: An `EventProcessor` holds the `Sequence` of a specific consumer and provides an Event Loop for invoking the event-handling implementation.
- **Disruptor**: Producing and consuming events uses the `Disruptor` object.
- **RingBuffer**: The `RingBuffer` (circular array) stores the events.
- **WaitStrategy**: Determines how an event consumer waits for new events to arrive when no events are available to consume.
- **Producer**: Simply refers generally to user code that calls the `Disruptor` object to publish events; Disruptor does not define a specific interface or type for it.
- **ProducerType**: Specifies whether the pattern uses a single event publisher or multiple event publishers ("publisher" and "producer" mean essentially the same thing; I personally prefer "publisher").
- **Sequencer**: The true core of Disruptor. This interface has two implementations—`SingleProducerSequencer` and `MultiProducerSequencer`—which define the concurrency algorithms for passing data quickly and correctly between producers and consumers.

The diagram below, taken from Disruptor's official website, illustrates an example of the LMAX system using Disruptor.

![Example of the LMAX System Using Disruptor](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/disruptor-models-14717ea7.png)

## What Wait Strategies Does Disruptor Provide?

A **WaitStrategy** determines how an event consumer waits for new events when none are currently available to consume.

Common wait strategies include:

![Disruptor Wait Strategies](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/DisruptorWaitStrategy-152c9c2f.png)

- `BlockingWaitStrategy`: Uses `ReentrantLock` + `Condition` for waiting and signaling; very simple to implement and is Disruptor's default wait strategy. Although it is the slowest, it has the lowest CPU usage and is the most stable option—recommended for production environments.
- `BusySpinWaitStrategy`: Offers excellent performance, but carries the risk of continuous busy spinning; improper use can push CPU load to 100%, so use with caution.
- `LiteBlockingWaitStrategy`: A lightweight wait strategy based on `BlockingWaitStrategy` that omits wakeup signaling when there is no lock contention; however, the author notes it has not been sufficiently tested, so it is not recommended.
- `TimeoutBlockingWaitStrategy`: A wait strategy with a timeout that executes business-specified handling logic once the timeout elapses.
- `LiteTimeoutBlockingWaitStrategy`: Based on `TimeoutBlockingWaitStrategy`, omitting wakeup signaling when there is no lock contention.
- `SleepingWaitStrategy`: A three-stage strategy—the first stage spins, the second stage calls `Thread.yield` to give up the CPU, and the third stage sleeps repeatedly for short intervals.
- `YieldingWaitStrategy`: A two-stage strategy—the first stage spins, and the second stage calls `Thread.yield` to yield the CPU.
- `PhasedBackoffWaitStrategy`: A four-stage strategy—the first stage spins for a specified number of iterations, the second stage spins for a specified duration, the third stage calls `Thread.yield` to yield the CPU, and the fourth stage delegates to the `waitFor` method of a member strategy, which can be set to one of `BlockingWaitStrategy`, `LiteBlockingWaitStrategy`, or `SleepingWaitStrategy`.

Wait strategies are fundamentally a trade-off between latency and CPU consumption:

- When latency is extremely sensitive and dedicated machine resources are available, you can evaluate `BusySpinWaitStrategy` or `YieldingWaitStrategy`.
- For ordinary business services, it is safer to start with `BlockingWaitStrategy`, where stability and resource usage are more predictable.
- If you want both to reduce busy spinning and to respond quickly within short windows, you can evaluate `SleepingWaitStrategy` or `PhasedBackoffWaitStrategy`.

Never blindly use busy-waiting strategies on shared application servers, as they can easily saturate the CPU and degrade co-located services.

## Why Is Disruptor So Fast?

- **RingBuffer (Circular Array)**: Disruptor's internal `RingBuffer` is backed by an array. Because all elements in this array are instantiated all at once during initialization, their memory addresses are generally contiguous. Consequently, as the producer continuously inserts new event objects into the `RingBuffer`, those event objects retain contiguous memory locality, allowing the CPU to exploit cache spatial locality and load adjacent event objects into cache together—boosting performance. This is analogous to MySQL's read-ahead mechanism, which preloads consecutive pages into memory. Moreover, being array-backed, `RingBuffer` supports batch operations (processing multiple elements at once) and avoids frequent memory allocation and Garbage Collection (`RingBuffer` is a fixed-size array: when adding new elements to a full array, new slots overwrite the oldest consumed slots).
- **Eliminates False Sharing**: CPU caches are managed in Cache Lines, typically around 64 bytes in size. To ensure target fields occupy their own Cache Line exclusively, Disruptor adds byte padding before and after target fields (56 bytes before and 56 bytes after), avoiding Cache Line false sharing. Likewise, to ensure the array backing `RingBuffer` sits on exclusive cache lines, the array layout uses invalid padding (128 bytes) + valid data.
- **Lock-Free Design**: Disruptor adopts a lock-free design, avoiding the contention and latency introduced by traditional locking mechanisms. Implementing lock-free coordination in Disruptor is fairly sophisticated, relying primarily on CAS, Memory Barriers, and the `RingBuffer`.

In summary, Disruptor achieves its speed through the combined effect of multiple optimizations that both leverage modern CPU cache architecture and avoid common concurrency pitfalls and performance bottlenecks.

However, Disruptor's performance advantages come with prerequisites: event-processing logic must not be too heavy, consumers must not block for long periods, and `RingBuffer` capacity must be sized according to peak traffic. If consumers invoke slow APIs, slow SQL queries, or hold locks for extended durations, even the fastest queue will be bottlenecked by downstream processing speed.

For a deeper explanation of the principles behind Disruptor's high-performance queue, read: [Brief Analysis of Disruptor High-Performance Queue Principles](https://qin.news/disruptor/) (referencing Meituan Tech Team's article [High-Performance Queue — Disruptor](https://tech.meituan.com/2016/11/18/disruptor.html)).

🌈 Here is an extra note: **Why do contiguous object element addresses in an array improve performance?**

CPU caches achieve faster reads by storing recently accessed data in high-speed cache memory and using prefetching mechanisms to load adjacent memory ahead of time, taking advantage of the principle of locality.

In computer systems, the CPU primarily accesses high-speed caches and main memory. High-speed cache is extremely fast but relatively small memory, typically organized into multiple levels—L1, L2, and L3 representing Level 1, Level 2, and Level 3 caches, respectively. The closer a cache is to the CPU, the faster it is and the smaller its capacity. By contrast, main memory has a much larger capacity but is significantly slower.

![CPU Cache Model Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-f9ad1aa3.png)

To accelerate data reads, the CPU first loads data from main memory into the high-speed cache; the next time it needs to access that same data, it can read directly from cache without accessing main memory again. This is called a **cache hit**. Furthermore, leveraging the **principle of locality**, the CPU prefetches adjacent memory addresses based on previously accessed addresses; because contiguous memory addresses are often accessed sequentially in programs, this raises the cache hit rate and improves overall program performance.

## References

- The Path to Disruptor High Performance — Wait Strategies: <http://wuwenliang.net/2022/02/28/Disruptor>
- *Java Concurrency in Practice* — Lecture 40 | Case Study (Part 3): High-Performance Queue Disruptor: <https://time.geekbang.org/column/article/98134>
