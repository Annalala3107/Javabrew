---
title: "High Availability System Design Guide: SLA, Rate Limiting, Circuit Breaker, Degradation, Disaster Recovery, Caching, and Canary Release"
description: "A comprehensive guide to high-availability system design covering SLA and availability nines, single point of failure elimination, rate limiting, circuit breaking, service degradation, cache high availability, asynchronous peak shaving, redundancy and disaster recovery, canary releases, and failure recovery."
category: High Availability
icon: "mdi:palette-swatch-outline"
tag:
  - High Availability
  - System Design
head:
  - - meta
    - name: keywords
      content: High Availability,High Availability System Design,High Availability Architecture,SLA,Number of Nines,Single Point of Failure,Rate Limiting and Circuit Breaker,Service Degradation,Cache High Availability,Redundancy and Disaster Recovery,Canary Release,Failure Recovery,System Stability
lang: en
sourceRef: zh-ref/high-availability/high-availability-system-design.md
---

Whether it is an e-commerce site people browse every day, an online payment service, or a company's internal core business system, users have increasingly low tolerance for "service unavailability." A single outage lasting just a few minutes can cause significant user churn or even direct financial loss.

Therefore, keeping a system stable and operational under all kinds of abnormal conditions has become an unavoidable topic in backend development and architecture design. This article walks through the core ideas and common solutions in high-availability system design, including SLA metrics, eliminating single points of failure, rate limiting and circuit breaking, service degradation, cache high availability, asynchronous peak shaving, redundancy and disaster recovery, canary releases, and failure recovery.

## What Is High Availability? How Is Availability Measured?

**High Availability (HA)** refers to a system's ability to continuously provide normal service for the vast majority of the time. High availability means that even when hardware failures or system upgrades occur, the service remains available.

Generally, we use **the number of nines** to evaluate a system's availability. For example, 99.9999% means the system is unavailable for only 0.0001% of its total operating time—an extremely high-availability system! Systems with poor availability may not even reach 90% (1 nine).

| Availability Tier | Availability Percentage | Annual Downtime | Typical Scenario         |
| ----------------- | ----------------------- | --------------- | ------------------------ |
| 1 Nine            | 90%                     | 36.5 days       | Personal blog            |
| 2 Nines           | 99%                     | 3.65 days       | Standard enterprise app  |
| 3 Nines           | 99.9%                   | 8.76 hours      | Online services          |
| 4 Nines           | 99.99%                  | 52.6 minutes    | Financial trading system |
| 5 Nines           | 99.999%                 | 5.26 minutes    | Telecom-grade system     |

In addition, system availability can also be measured by **the ratio of failed requests to total requests** for a specific feature. For example, if a website receives 1,000 requests and 10 of them fail, the availability is 99%.

**SLA (Service Level Agreement)** is a formal commitment between a service provider and its customers that typically specifies availability targets. For instance, a cloud provider promising a 99.95% SLA allows at most around 22 minutes of downtime per month.

## What Causes a System to Become Unavailable?

Causes of system unavailability can be analyzed from two dimensions: **internal factors** and **external factors**:

**Internal Factors:**

1. **Code defects**: Code quality issues such as memory leaks, deadlocks, circular dependencies, and `NullPointerException` are among the most common causes of production incidents.
2. **Architectural design flaws**: Architectural issues such as single points of failure, missing rate-limiting protection, and tight coupling between services often surface during traffic peaks.
3. **Resource exhaustion**: Exhaustion of CPU, memory, disk, connection pools, and similar resources directly renders a service unavailable.
4. **Configuration errors**: Incorrect configuration changes (such as bad database connection strings or improper timeout settings) can cause service failures.

**External Factors:**

1. **Hardware failures**: Server crashes, disk corruption, network equipment failures, etc.
2. **Traffic surges**: Sudden spikes in user requests (such as flash sales) exceeding the system's capacity.
3. **Cyberattacks**: Malicious attacks such as DDoS and CC attacks exhausting system resources.
4. **Dependent service failures**: Unavailability of dependencies such as databases, caches, message queues, or third-party APIs.
5. **Natural disasters**: Force majeure events such as data center power outages, fires, or earthquakes.

## How Can System Availability Be Improved?

Approaches to improving system availability can be considered across three stages: **Prevention**, **Fault Tolerance**, and **Recovery**:

![Three Resilience Stages of High Availability Systems](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/ha-system-design-resilience-stages-1c8e56e0.png)

### Focus on Code Quality and Rigorous Testing

**Code quality is the foundation of system availability.** Common code quality issues like memory leaks and circular dependencies severely harm system availability. Everyone likes talking about rate limiting, service degradation, and circuit breaking, but guarding quality at the source—code quality itself—is the very first essential step.

How do you improve code quality? A practical and effective method is **Code Review**—don't hesitate to spend an extra hour or so on it each day; the payoff is huge!

In addition, here are several practical tools for improving code quality:

- [SonarQube](https://www.sonarqube.org/): A static code analysis platform that detects code smells, security vulnerabilities, and bugs.
- [Arthas](https://arthas.aliyun.com/doc/), an open-source Java diagnostic tool by Alibaba: Enables live troubleshooting of JVM issues and supports hot-swapping code.
- [Alibaba Java Code Guidelines](https://github.com/alibaba/p3c): Comes with an IDEA plugin to check coding standards in real time.
- Built-in code analysis tools in IntelliJ IDEA.

### Use Clusters to Eliminate Single Points of Failure

A **Single Point of Failure (SPOF)** is the arch-enemy of high availability. Take Redis caching as an example: using cluster deployments to eliminate single points of failure is critical to ensuring high availability.

When we use a single Redis instance as our cache, if that instance goes down, the entire caching service may become unavailable. With a cluster, even if one Redis instance crashes, failover allows other instances to take over. Switchover time depends on the deployment mode and configuration parameters—Redis Sentinel/Cluster typically takes from several seconds to tens of seconds, and should not simply be assumed to take "less than one second."

Common clustering modes:

- **Master-Slave Replication**: One master with multiple replicas; the master handles writes and replicas handle reads. When the master fails, failover must be triggered manually or via Sentinel.
- **Sentinel Mode**: Adds Sentinel nodes on top of Master-Slave replication to enable automatic failure detection and failover.
- **Redis Cluster Mode**: The official data sharding solution supported since Redis 3.0+, where each shard has master-replica copies, balancing high availability and horizontal scalability.

### Rate Limiting

**Rate Limiting** is the first line of defense protecting a system. Its principle is to monitor metrics such as application QPS or concurrent thread count, and throttle traffic once a specified threshold is reached so the application is not overwhelmed by sudden traffic spikes, thereby ensuring high availability.—from the [alibaba-Sentinel](https://github.com/alibaba/Sentinel "Sentinel") wiki.

Common rate-limiting algorithms include:

- **Fixed Window Counter**: Simple to implement, but suffers from boundary burst spikes.
- **Sliding Window Counter**: Solves the boundary issue of fixed windows and provides smoother control.
- **Leaky Bucket Algorithm**: Processes requests at a fixed rate, well suited for traffic shaping.
- **Token Bucket Algorithm**: Permits a certain degree of burst traffic and is more flexible.

### Timeout and Retry Mechanisms

When a user request receives no response within a certain time limit, an exception should be thrown. This is critical—many production incidents occur because **timeouts were not configured or were configured improperly**.

When calling third-party services, configuring timeouts and retries is especially important. Most RPC frameworks come with built-in timeout and retry settings. Without timeouts, slow responses can cause requests to pile up until the system can no longer process any incoming traffic.

**The retry count is generally set to 3**; retrying too many times brings no benefit and instead puts extra pressure on the server (and retries are unsuitable in some scenarios). Retries should also be paired with an **exponential backoff** strategy to prevent retry storms.

Special care must be taken to ensure that retried APIs support **idempotency**. For non-idempotent write operations such as order creation or fund deduction, duplicate execution must be prevented via unique request IDs, business unique keys, state machines, and similar mechanisms rather than simply resending the failed request. Read operations can be retried relatively aggressively, whereas write operations should ideally query whether the previous request already took effect before retrying.

### Circuit Breaker Mechanism

Beyond timeouts and retries, a **Circuit Breaker** mechanism is also essential. A circuit breaker automatically collects resource usage and performance metrics of dependent services; when a dependency degrades or its failure rate/count hits a threshold, the circuit breaker transitions to the `Open` state, causing subsequent requests to fail fast without calling the downstream service, preventing the failure from spreading. Circuit breaking is usually paired with a **Fallback** strategy, such as returning default data or calling a backup service.

A circuit breaker has three states:

- **Closed**: Normal state where requests pass through normally.
- **Open**: Tripped state where requests fail immediately without calling the downstream service.
- **Half-Open**: Recovery-probing state that allows a small number of requests through to test whether the downstream service has recovered.

Historically, widely used traffic-control and circuit-breaking frameworks include Netflix Hystrix (now in maintenance mode) and Alibaba Sentinel. For new projects, Sentinel or Resilience4j is generally recommended.

### Service Degradation

**Service Degradation** means temporarily disabling non-core features when system pressure is excessive or some services are unavailable, in order to preserve the availability of core features.

Degradation strategies include:

- **Feature degradation**: Disabling non-core features such as recommendations or comments.
- **Data degradation**: Returning cached data or default values (Fallback) instead of performing real-time queries.
- **Page degradation**: Serving static pages or simplified page versions.

### Asynchronous Calls

Asynchronous invocation means the caller initiates a request without blocking to wait for the processing result, returning immediately while the actual work is completed later—a pattern widely used in flash-sale scenarios.

However, adopting asynchronous processing may require **adjusting the business workflow accordingly**. For example, **after a user submits an order, the system should not immediately return that the order succeeded; instead, it should wait until the message queue order consumer has actually finished processing the order—or even after warehouse dispatch—before notifying the user of success via email or SMS**.

In addition to implementing asynchronous calls directly in code, we frequently use **Message Queues (MQ)**. Message queues improve system performance through asynchronous processing (peak shaving and reducing response time) and reduce coupling between systems.

### Using Caches

In high-concurrency scenarios, if every request hits the database directly, the database can easily crash under heavy load. Using a cache to store hot data keeps data in memory, making access dramatically faster!

Typical caching use cases:

- **Hot data caching**: Storing frequently accessed data in caches such as Redis.
- **Page caching**: Caching rendered pages to reduce server load.
- **Local caching**: Using local caches like Caffeine or Guava Cache to cut network overhead.

Caches themselves also introduce classic failure modes under high availability that must be handled:

- **Cache Penetration**: Querying non-existent data causes every request to hit the database. Common mitigations include parameter validation, caching null values, and Bloom filters.
- **Cache Breakdown**: At the instant a hot key expires, a massive burst of requests hits the database simultaneously. Common mitigations include mutex locks, logical expiration, and never expiring hot keys + asynchronous refresh.
- **Cache Avalanche**: A large number of keys expire at the same time or the cache cluster becomes unavailable. Common mitigations include adding random jitter to expiration times, multi-level caching, and high-availability cache clusters.

### Other Practices

- **Allocate better hardware to core applications and services**: Deploy core services on higher-spec servers, SSD drives, etc.
- **Monitor system resource usage and configure alerts**: Use monitoring stacks such as Prometheus + Grafana with well-calibrated alert thresholds.
- **Maintain backups and prepare for rollbacks**: Back up databases regularly, keep code versions traceable, and support rapid rollbacks.
- **Canary Release (Gray Release)**: Split the server cluster into several groups and deploy to only a subset of machines each day; observe stability with no issues before rolling out the next batch over several days. If a problem occurs, only the updated subset of servers needs to be rolled back.
- **Inspect and replace hardware regularly**: If you are not running entirely on managed cloud services, inspect hardware periodically and replace or upgrade aging components promptly.
