---
title: Java Scheduled Tasks Explained
category: System Design
icon: "mdi:clock-outline"
description: "A systematic guide to scheduled and delayed tasks in Java: Timer, ScheduledThreadPoolExecutor, DelayQueue, Time Wheel, Spring @Scheduled (Cron expressions), and a comparison of distributed job scheduling frameworks including Quartz, XXL-JOB, ElasticJob, and PowerJob with their use cases (order timeout cancellation, scheduled backups, periodic scraping)."
head:
  - - meta
    - name: keywords
      content: Scheduled Tasks,Quartz,Elastic-Job,XXL-JOB,PowerJob
lang: en
sourceRef: zh-ref/system-design/schedule-task.md
---

## Why Do We Need Scheduled Tasks?

Let's look at several very common business scenarios:

1. A system needs to back up data at 1:00 AM every day.
2. On an e-commerce platform, if a user places an order and does not pay within half an hour, the order must be canceled automatically.
3. A media aggregation platform dynamically scrapes data from a website every 10 minutes for its own use.
4. A blogging platform supports scheduled post publishing.
5. A fund platform calculates users' daily earnings every night and pushes the latest data to users.
6. ...

These scenarios all require us to perform a certain action at a specific time—that is, to execute something on a schedule or after a delay.

- Scheduled tasks: Execute a specific task at a designated point in time, such as 8:00 AM every day or 3:00 PM every Monday. Scheduled tasks can handle periodic work such as data backups, log cleanup, and report generation.
- Delayed tasks: Execute a specific task after a certain delay, such as 10 minutes later or 3 hours later. Delayed tasks can handle asynchronous work such as order cancellation, push notifications, and red packet recall.

Although their use cases differ, the core idea behind both is the same: scheduling a task's execution time at some future point to achieve the desired scheduling behavior.

## Single-Node Scheduled Tasks

### `Timer`

`java.util.Timer` is a scheduled task implementation supported since JDK 1.3.

Internally, `Timer` uses a class called `TaskQueue` to store scheduled tasks—a priority queue implemented on top of a min-heap. `TaskQueue` orders tasks by the time remaining until their next execution, ensuring that the task at the top of the heap always runs first. Thus, whenever a task needs to run, `Timer` simply retrieves the task at the top of the heap and executes it.

`Timer` is straightforward to use; in the following way, we can create a scheduled task that runs 1 second later:

```java
// Example code:
TimerTask task = new TimerTask() {
    public void run() {
        System.out.println("Current time: " + new Date() + "\n" +
                "Thread name: " + Thread.currentThread().getName());
    }
};
System.out.println("Current time: " + new Date() + "\n" +
        "Thread name: " + Thread.currentThread().getName());
Timer timer = new Timer("Timer");
long delay = 1000L;
timer.schedule(task, delay);


// Output:
Current time: Fri May 28 15:18:47 CST 2021
Thread name: main
Current time: Fri May 28 15:18:48 CST 2021
Thread name: Timer
```

However, it has quite a few drawbacks. Each `Timer` uses only a single background thread to execute all tasks serially, so a slow task delays all other tasks. If `TimerTask#run()` throws an uncaught runtime exception or error, that `Timer`'s single execution thread terminates, and subsequent tasks can no longer be scheduled. That behavior cannot simply be summarized accurately as "`Timer` only catches `InterruptedException`."

There is a Javadoc comment on the `Timer` class that reads as follows:

```java
 * This class does not offer real-time guarantees: it schedules
 * tasks using the <tt>Object.wait(long)</tt> method.
 *Java 5.0 introduced the {@code java.util.concurrent} package and
 * one of the concurrency utilities therein is the {@link
 * java.util.concurrent.ScheduledThreadPoolExecutor
 * ScheduledThreadPoolExecutor} which is a thread pool for repeatedly
 * executing tasks at a given rate or delay.  It is effectively a more
 * versatile replacement for the {@code Timer}/{@code TimerTask}
 * combination, as it allows multiple service threads, accepts various
 * time units, and doesn't require subclassing {@code TimerTask} (just
 * implement {@code Runnable}).  Configuring {@code
 * ScheduledThreadPoolExecutor} with one thread makes it equivalent to
 * {@code Timer}.
```

In short, `ScheduledThreadPoolExecutor` supports multi-threaded execution of scheduled tasks and is much more powerful, serving as the replacement for `Timer`.

### `ScheduledExecutorService`

`ScheduledExecutorService` is an interface with multiple implementations, the most commonly used being `ScheduledThreadPoolExecutor`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/20210607154324712-748f068e.png)

`ScheduledThreadPoolExecutor` itself is a thread pool that supports concurrent task execution. Internally, it uses `DelayedWorkQueue` as its task queue.

```java
// Example code:
TimerTask repeatedTask = new TimerTask() {
    @SneakyThrows
    public void run() {
        System.out.println("Current time: " + new Date() + "\n" +
                "Thread name: " + Thread.currentThread().getName());
    }
};
System.out.println("Current time: " + new Date() + "\n" +
        "Thread name: " + Thread.currentThread().getName());
ScheduledExecutorService executor = Executors.newScheduledThreadPool(3);
long delay  = 1000L;
long period = 1000L;
executor.scheduleAtFixedRate(repeatedTask, delay, period, TimeUnit.MILLISECONDS);
Thread.sleep(delay + period * 5);
executor.shutdown();
// Output:
Current time: Fri May 28 15:40:46 CST 2021
Thread name: main
Current time: Fri May 28 15:40:47 CST 2021
Thread name: pool-1-thread-1
Current time: Fri May 28 15:40:48 CST 2021
Thread name: pool-1-thread-1
Current time: Fri May 28 15:40:49 CST 2021
Thread name: pool-1-thread-2
Current time: Fri May 28 15:40:50 CST 2021
Thread name: pool-1-thread-2
Current time: Fri May 28 15:40:51 CST 2021
Thread name: pool-1-thread-2
Current time: Fri May 28 15:40:52 CST 2021
Thread name: pool-1-thread-2
```

Neither `Timer` nor `ScheduledExecutorService` supports specifying exact task execution schedules using Cron expressions.

### `DelayQueue`

`DelayQueue` is a delay queue provided by the JUC (`java.util.concurrent`) package, used to implement delayed tasks such as canceling an order automatically if it remains unpaid 15 minutes after placement. It is a type of `BlockingQueue` backed by a `PriorityQueue`, making it an unbounded, thread-safe queue. For details on `PriorityQueue`, refer to my article: [PriorityQueue Source Code Analysis](https://javaguide.cn/java/collection/priorityqueue-source-code.html).

![Implementations of BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-hierarchy-755d1cd5.png)

Both `DelayQueue` and `Timer/TimerTask` can serve as foundations for delayed scheduling. `DelayQueue` uses a priority queue to manage elements implementing the `Delayed` interface, allowing elements to be taken only after their delay expires; however, it does not create threads to execute tasks on its own—you typically need to write a consumer loop and choose an appropriate executor. `Timer`, by contrast, comes with its own execution thread. Both allow adding tasks after creation, and both support canceling or removing tasks; claiming that "`Timer` can only specify tasks at creation time" is false.

For a detailed introduction to `DelayQueue`, refer to my article: [`DelayQueue` Source Code Analysis](https://javaguide.cn/java/collection/delayqueue-source-code.html).

### Spring Task

We can define scheduled tasks directly using the `@Scheduled` annotation provided by Spring, which is very convenient!

```java
/**
 * cron: Uses a Cron expression. Runs at seconds 1 and 2 of every minute
 */
@Scheduled(cron = "1-2 * * * * ? ")
public void reportCurrentTimeWithCronExpression() {
  log.info("Cron Expression: The time is now {}", dateFormat.format(new Date()));
}

```

Back in college when I built an enterprise-level SSM project, I used Spring Task for scheduled jobs.

Moreover, Spring Task supports **Cron expressions**. Cron expressions are used in job scheduling systems to define execution times or frequencies; they are very powerful and allow you to configure tasks to run at specific times every day or every month. If you are learning scheduled tasks, Cron expressions definitely deserve close attention. Here is a recommended online Cron expression generator: <http://cron.qqe2.com/>.

However, Spring's built-in scheduler only supports single-node execution and offers relatively basic functionality. I previously wrote an article: [5 Minutes to Master Scheduling Tasks in Spring Boot](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485563&idx=1&sn=7419341f04036a10b141b74624a3f8c9&chksm=cea247b0f9d5cea6440759e6d49b4e77d06f4c99470243a10c1463834e873ca90266413fbc92&token=2133161636&lang=zh_CN#rd), which you can check out if you are unfamiliar with it.

Spring provides scheduling abstraction through `TaskScheduler` rather than locking into a single underlying implementation. The commonly used `ThreadPoolTaskScheduler` delegates internally to `ScheduledExecutorService`; in environments such as Jakarta EE, container-managed schedulers can also be used. `@Scheduled` itself provides no cluster coordination—when multiple instances of the same application are deployed, every instance may trigger the task.

**Pros and Cons Summary:**

- Pros: Simple, lightweight, supports Cron expressions
- Cons: Limited functionality

### Time Wheel

Kafka, Dubbo, ZooKeeper, Netty, Caffeine, and Akka all include implementations of a Time Wheel.

Put simply, a Time Wheel is a circular queue (typically backed by an array), where each element (time slot / bucket) holds a list of scheduled tasks.

Each slot in a Time Wheel represents its basic time span, or time precision. If time advances one slot per second, the wheel's finest precision is 1 second (meaning 3 s and 3.9 s fall into the same slot).

Below is a Time Wheel with 12 slots, taking 12 s for a full revolution. When we need to create a scheduled task that runs 3 s later, we simply place it in slot index 3. When we need to create a task that runs 9 s later, we place it in slot index 9.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/one-layers-of-time-wheel-52b302cf.png)

What if we need to create a scheduled task that runs 13 s later? Here we can introduce the concept of **rounds / laps**. The task still resides in slot index 1, while recording the number of remaining rounds to wait, executing only after completing one full revolution plus another 1 s. Different implementations may adopt different conventions on whether the current slot counts toward the round count, so it should not be hardcoded as "2 rounds" independently of a specific implementation.

Besides adding round counts, there is also a **hierarchical (multi-level) Time Wheel** (similar to a wristwatch), which is the approach Kafka uses.

Let's walk through an example based on the Time Wheel shown below so it is easy to understand.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/three-layers-of-time-wheel-29645300.png)

In the Time Wheel above (ms -> s), Layer 1 has a time precision of 1, Layer 2 has a precision of 20, and Layer 3 has a precision of 400. Suppose we need to add Task A to execute 350 s later (current time is 0 s): this task is placed into Layer 2 (because Layer 2 spans 20 * 20 = 400 > 350) at slot index 350 / 20 = 17.

After Layer 1 completes 17 revolutions, 340 s have elapsed and Layer 2's pointer reaches slot 17. At that moment, the task in slot 17 of Layer 2 is moved down into Layer 1.

Task A now has 10 s remaining before execution, so it is moved to slot 10 of Layer 1.

Moving tasks between layers like this is also called Time Wheel promotion/demotion (cascading). Just think of how a mechanical watch works!

**A Time Wheel is particularly well suited for managing a large number of timers. In typical implementations with a bounded number of levels and slots per level, locating a slot, inserting a task, and advancing the pointer can usually achieve near-O(1) overhead; however, the actual execution cost at a given tick still depends on the number of expired tasks, cascading migrations, and the specific implementation.**

## Distributed Scheduled Tasks

### Redis

Redis can be used to implement delayed tasks. There are essentially two approaches based on Redis:

1. Listening to Redis key expiration events
2. Using Redisson's built-in `RDelayedQueue`

I covered this part in detail in [*High-Frequency System Design & Scenario Questions for Backend Interviews*](https://javaguide.cn/zhuanlan/back-end-interview-high-frequency-system-design-and-scenario-questions.html), which members can read in the knowledge planet. Because it is quite lengthy, I will not repeat it here.

### MQ

Most message queues, such as RocketMQ and RabbitMQ, support scheduled/delayed messages. Scheduled messages and delayed messages are essentially the same: the broker delivers a message to consumers at a fixed future point in time according to the delay or scheduled timestamp set on the message.

However, before using MQ scheduled messages, be sure to check the limits of the specific product and version. For example, RocketMQ 4.x's official implementation provides 18 fixed delay levels with a maximum of 2 hours; RocketMQ 5.x changed to setting delivery time using millisecond-level Unix timestamps, with a default maximum timer window of 24 hours. The mechanisms of these two version lines must not be conflated into a single rule.

**Pros and Cons Summary:**

- **Pros**: Integrates cleanly with Spring, supports distributed and clustered deployments, and offers solid performance
- **Cons**: Limited scheduling features, less flexible, requires guaranteeing message reliability

## Distributed Job Scheduling Frameworks

If we need advanced capabilities such as task sharding and high availability in distributed environments, we need a dedicated distributed job scheduling framework.

Typically, executing a distributed scheduled task involves the following roles:

- **Task (Job)**: First, the task to execute—that is, the concrete business logic such as scheduled article publishing.
- **Scheduler (Admin / Coordinator)**: The scheduling center responsible for job management and assigning tasks to executors.
- **Executor**: Receives tasks dispatched by the scheduler and executes them.

### Quartz

A very popular open-source job scheduling framework written completely in Java. Quartz can be considered the pioneer or de facto reference standard in Java job scheduling; many other scheduling frameworks were originally built on top of Quartz—for instance, Dangdang's `elastic-job` is a distributed scheduling solution secondary-developed on Quartz.

Quartz integrates easily with Spring and supports dynamic job addition and clustering. However, Quartz is somewhat cumbersome to use, with verbose APIs.

In addition, Quartz does not come with a built-in UI management console, though you can use the open-source project [quartzui](https://github.com/zhaopeiym/quartzui) to solve that.

Furthermore, although Quartz supports distributed jobs, it does so at the database layer via database locking mechanisms, which brings numerous drawbacks such as heavy system intrusiveness and uneven load across nodes—making it feel somewhat "pseudo-distributed."

**Pros and Cons Summary:**

- Pros: Integrates with Spring, supports dynamic job addition and clustering.
- Cons: Unfriendly distributed support, lacks visual task management UI, cumbersome to use (compared to similar frameworks)

### Elastic-Job

ElasticJob was originally open-sourced by Dangdang and historically split into two subprojects: ElasticJob-Lite and ElasticJob-Cloud. That split, along with ElasticJob-Cloud's dependency on Mesos, belongs to an earlier version era and should not be treated as a current selection matrix. Today, the official project describes ElasticJob as a lightweight, decentralized solution offering distributed task sharding, supporting both ZooKeeper and etcd as registry centers.

`ElasticJob` supports features such as distributed task sharding, high availability, and visual task management.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/elasticjob-feature-list-56ba3f1c.png)

Below is the earlier architecture diagram of ElasticJob-Lite using ZooKeeper as the registry center, useful for understanding its decentralized scheduling design; current versions also support etcd, so the components in the diagram should not be regarded as the only deployment model.

![ElasticJob-Lite Architecture Design](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/elasticjob-lite-architecture-design-dea99a80.png)

In this deployment, ElasticJob has no centralized scheduling server; instead, it uses ZooKeeper to coordinate task shards across nodes. Current versions can also use etcd as the registry center.

Scheduled triggers in Elastic-Job are initiated independently by each executor—an approach also known as a decentralized design (both scheduling and processing are completed by the executors themselves).

The current official Spring Boot Starter registers jobs via Spring Beans and configuration files and does not provide the `@ElasticJobConf` annotation. Below is an example using ZooKeeper as the registry center:

```java
@Component
public class TestJob implements SimpleJob {
    @Override
    public void execute(ShardingContext context) {
        System.out.printf("Job name: %s, total shards: %d, current sharding parameter: %s%n",
                context.getJobName(),
                context.getShardingTotalCount(),
                context.getShardingParameter());
    }
}
```

```yaml
elasticjob:
  regCenter:
    serverLists: localhost:2181
    namespace: elasticjob-demo
  jobs:
    dayJob:
      elasticJobClass: com.example.job.TestJob
      cron: 0/10 * * * * ?
      shardingTotalCount: 2
      shardingItemParameters: 0=AAAA,1=BBBB
```

Configuration properties and registry center types evolve across versions, so when integrating, always refer to the official [Spring Boot Starter documentation](https://shardingsphere.apache.org/elasticjob/current/en/user-manual/usage/job-api/spring-boot-starter/) and [Registry Center documentation](https://shardingsphere.apache.org/elasticjob/current/en/user-manual/configuration/registry-center/) for your exact version.

**Related Links:**

- GitHub Repository: <https://github.com/apache/shardingsphere-elasticjob>.
- Official Website: <https://shardingsphere.apache.org/elasticjob/index_zh.html>.

**Pros and Cons Summary:**

- Pros: Integrates with Spring, supports distributed execution and clustering, good performance, supports visual task management
- Cons: Requires deploying an external registry center such as ZooKeeper or etcd, increasing system complexity and maintenance cost

### XXL-JOB

Open-sourced in 2015, `XXL-JOB` is an excellent lightweight distributed task scheduling framework supporting visual job management, elastic scaling, failure retries and alerts, task sharding, and more.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/xxljob-feature-list-9bb2bec9.png)

According to the official `XXL-JOB` website, it addresses many of Quartz's shortcomings:

> As a leading open-source job scheduler, Quartz is a top choice for job scheduling. However, in clustered environments Quartz manages jobs through APIs, which avoids some issues while still suffering from the following problems:
>
> - Issue 1: Managing jobs via API calls is not user-friendly;
> - Issue 2: Business `QuartzJobBean` instances must be persisted into underlying database tables, making system intrusiveness quite severe.
> - Issue 3: Scheduling logic and `QuartzJobBean` are coupled in the same project, which causes a problem: as the number of scheduled jobs grows and job logic becomes heavier, the scheduler's performance becomes severely constrained by business workloads;
> - Issue 4: Quartz acquires DB locks "competitively," and whichever node wins the lock runs the job, leading to severe load imbalance across nodes; by contrast, XXL-JOB uses executors to run jobs in a "collaboratively distributed" manner, making full use of cluster capacity and balancing load across nodes.
>
> XXL-JOB remedies these shortcomings of Quartz.

The architecture of `XXL-JOB` is shown below:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/xxljob-architecture-design-v2.1.0-3abf925a.png)

As shown above, `XXL-JOB` consists of two major parts: the **Scheduling Center (Admin)** and **Executors**. The Scheduling Center is responsible for job management, executor management, and log management, while Executors receive and process dispatch signals. In addition, the Scheduling Center dispatches jobs over a custom-built RPC mechanism.

Unlike Elastic-Job's decentralized design, `XXL-JOB`'s design is called a centralized design (a Scheduling Center dispatches tasks to multiple Executors).

Similar to `Quartz`, `XXL-JOB` also schedules jobs based on database locks, which poses performance bottlenecks. However, as long as the task volume is not extremely huge, there is little noticeable impact, and it satisfies the needs of the vast majority of companies.

Current versions recommend placing `@XxlJob` on a parameterless `void` method in a Spring Bean, handling job parameters, logging, and execution results via `XxlJobHelper`; `@JobHandler` and methods taking a `String` argument and returning `ReturnT` belong to the legacy API.

```java
@Component
public class MyApiJobHandler {

    @XxlJob("myApiJobHandler")
    public void execute() {
        String param = XxlJobHelper.getJobParam();
        XxlJobHelper.log("Job parameter: {}", param);
        // Execute business logic; default result is success, call XxlJobHelper.handleFail(...) on failure
    }
}
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/xxljob-admin-task-management-e968a1f8.png)

**Related Links:**

- GitHub Repository: <https://github.com/xuxueli/xxl-job/>.
- Official Introduction: <https://www.xuxueli.com/xxl-job/>.

**Pros and Cons Summary:**

- Pros: Ready out of the box (low learning curve), Spring integration, distributed and cluster support, visual task management.
- Cons: Does not support adding jobs dynamically by default (though if dynamic job creation is strictly needed, see [xxl-job issue #277](https://github.com/xuxueli/xxl-job/issues/277)).

### PowerJob

A distributed task scheduling framework well worth paying attention to—a rising star in the distributed scheduling space. Many companies have already adopted it, including OPPO, JD.com, ZTO Express, and Cisco.

Its origin story is quite interesting as well: the author of PowerJob previously interned at Alibaba, where Alibaba internally used its proprietary SchedulerX (a paid Alibaba Cloud product). After finishing the internship and leaving Alibaba, the author wanted to build an open-source alternative to SchedulerX in case SchedulerX couldn't meet future needs—and thus PowerJob was born.

For more about PowerJob's story, check out the author's video [*Me and My Job Scheduling Middleware*](https://www.bilibili.com/video/BV1SK411A7F3/). Put simply: "Gaming isn't fun anymore—I'm going to carry the banner for next-generation distributed job scheduling and computing frameworks!"

Since SchedulerX is a paid commercial product, I won't elaborate too much on it here. The PowerJob team has also published a comparison against Quartz, XXL-JOB, and SchedulerX. The table below is the project team's feature comparison, not an independent benchmark; performance and capacity still need to be validated against specific versions, databases, deployment scales, and business workloads.

| | Quartz | xxl-job | SchedulerX 2.0 | PowerJob |
| --- | --- | --- | --- | --- |
| Schedule Types | CRON | CRON | CRON, fixed rate, fixed delay, OpenAPI | **CRON, fixed rate, fixed delay, OpenAPI** |
| Job Types | Built-in Java | Built-in Java, GLUE Java, Shell, Python, and other scripts | Built-in Java, external Java (FatJar), Shell, Python, and other scripts | **Built-in Java, external Java (container), Shell, Python, and other scripts** |
| Distributed Computing | None | Static sharding | MapReduce dynamic sharding | **MapReduce dynamic sharding** |
| Online Job Governance | Not supported | Supported | Supported | **Supported** |
| Web-based Log Viewing | Not supported | Supported | Not supported | **Supported** |
| Scheduling & Performance | Database-lock based, has performance bottlenecks | Database-lock based, has performance bottlenecks | Unspecified | **Project claims lock-free design; actual capacity requires load testing** |
| Alert Monitoring | None | Email | SMS | **WebHook, Email, DingTalk, and custom extensions** |
| System Dependencies | Any JDBC-supported relational database (MySQL, Oracle...) | MySQL | Paid commercial service | **Any relational database supported by Spring Data JPA (MySQL, Oracle...)** |
| DAG Workflows | Not supported | Not supported | Supported | **Supported** |

## Summary of Scheduled Task Solutions

Common single-node scheduled task solutions include `Timer`, `ScheduledExecutorService`, `DelayQueue`, Spring Task, and Time Wheels. For ordinary periodic or delayed Java tasks, `ScheduledExecutorService` or Spring Task is usually preferred; a Time Wheel is better suited for scenarios with a massive number of timers where trading a degree of time precision for scheduling performance is acceptable—it is not automatically the best default for all single-node tasks.

While Redis and MQ can achieve distributed delayed triggering, they generally do not provide full job orchestration, sharding, failure compensation, and visual management. Reliable MQs commonly offer "at-least-once" delivery semantics, meaning duplicate deliveries can occur during timeouts, retries, or failovers, so consumers must implement idempotency. Periodic tasks require the scheduler to continuously generate new trigger events, which has no direct relationship with whether a single message can be "consumed multiple times." MQ remains very suitable for one-off delayed triggers such as order timeout cancellation, and can also decouple scheduling from execution.

Whichever solution you choose, make sure the following semantics are clearly defined before going to production:

- Whether tasks are idempotent and how duplicate executions are handled;
- After application downtime or missed trigger windows, whether missed runs should be caught up, skipped, or coalesced;
- Policies for timeouts, retries, backoff, maximum attempts, and dead-letter / manual compensation;
- Handling of time zones, daylight saving time, clock rollback, and cluster clock skew;
- How unintended duplicate scheduling is prevented across the cluster, along with monitoring and alerting on latency, success rate, retries, and backlogs.

Quartz, Elastic-Job, XXL-JOB, and PowerJob are frameworks built specifically for distributed scheduling, offering more comprehensive and powerful distributed scheduling features that are much better suited for periodic jobs. Aside from Quartz, the other three all support visual job management.

XXL-JOB (launched in 2015) has a relatively low barrier to entry and uses centralized scheduling; ElasticJob uses decentralized scheduling and coordinates task shards via ZooKeeper or etcd. The two differ in architecture and operational dependencies, so one cannot simply assert that one framework "has better performance" than the other. When selecting a solution, run load tests matching your target version, task count, trigger frequency, shard scale, fault recovery requirements, and database or registry center load. PowerJob and other frameworks should be evaluated along the same dimensions rather than drawing conclusions solely from a project's feature comparison table.

This article did not walk through hands-on code usage in full, which does not mean practical usage is unimportant. Before writing this article, I built demo projects myself. For example, I used Quartz back in college with Spring, and to get a fresher feel for it, I tried it again in Spring Boot. If you claim a framework is hard to use without ever trying it yourself, that argument won't hold water.
