---
title: "Service Rate Limiting Explained: Fixed Window, Sliding Window, Token Bucket, Leaky Bucket, and Distributed Rate Limiting"
description: "A detailed guide to the principles and implementations of service rate limiting, systematically covering rate limiting algorithms such as Fixed Window, Sliding Window, Token Bucket, and Leaky Bucket, as well as single-node and distributed rate limiting solutions using Guava RateLimiter, Bucket4j, Sentinel, Redis Lua, and Redisson."
category: High Availability
icon: "mdi:speedometer-slow"
tag:
  - Rate Limiting
  - High Concurrency
lang: en
sourceRef: zh-ref/high-availability/limit-request.md
head:
  - - meta
    - name: keywords
      content: service rate limiting,rate limiting algorithms,Fixed Window,Sliding Window,Token Bucket,Leaky Bucket,single-node rate limiting,distributed rate limiting,Guava RateLimiter,Bucket4j,Sentinel,Redis Lua,Redisson rate limiting,rate limiting interview questions
---

For a software system, rate limiting means restricting the rate of incoming requests to prevent sudden bursts of heavy traffic from overwhelming and crashing the system. After all, a software system has finite processing capacity. If the request volume exceeds what the system can handle, the system may go down immediately.

Rate limiting may cause some user requests to fail or not be processed immediately; however, this is often the optimal trade-off for preserving overall system stability.

In everyday life, practical applications of rate limiting are everywhere—for example, queuing to buy tickets prevents a huge crowd from rushing the ticket counter and overwhelming the ticket seller.

## What Are the Common Rate Limiting Algorithms?

Let's briefly introduce 4 rate limiting algorithms that are very easy to understand and straightforward to implement!

> The diagrams below are sourced from the InfoQ article ["Distributed Service Rate Limiting in Practice: All the Pitfalls Mapped Out for You"](https://www.infoq.cn/article/Qg2tX8fyw5Vt-f3HH673).

### Fixed Window Counter Algorithm

A Fixed Window is essentially a fixed time window. Its principle is to divide time into fixed-size windows and limit the number or rate of requests within each window—that is, the Fixed Window Counter algorithm specifies the maximum number of requests the system can process per unit of time.

Suppose we specify that a certain endpoint in the system can only be accessed 33 times per minute. The implementation idea using the Fixed Window Counter algorithm is as follows:

- Divide time into fixed-size windows—in this case, one window per 1 minute.
- Maintain a variable `counter` to record the number of requests currently processed by the endpoint, with an initial value of 0 (indicating no requests have been processed yet in the current 1-minute window).
- Within that 1-minute window, increment `counter + 1` after processing each request. Once `counter = 33` (meaning the endpoint has already been accessed 33 times within this 1-minute window), all subsequent requests are rejected.
- After the 1-minute window ends, reset `counter` to 0 and start counting again.

![Fixed Window Counter Algorithm](/media/jg/ext/static001.infoq.cn/image/8d/15/8ded7a2b90e1482093f92fff555b3615-86289ab1.webp)

Pros: Simple to implement and easy to understand.

Cons:

- Rate limiting is not smooth enough. For instance, if we limit an endpoint to 30 requests per minute and 30 requests arrive in the first 30 seconds, no requests can be processed during the remaining 30 seconds. This is undesirable and leads to a terrible user experience!
- Susceptible to the boundary burst problem. For example, if we limit an endpoint to 1,000 requests per minute, and 1,000 requests arrive in the last second of minute 1 followed by another 1,000 requests in the first second of minute 2, because the counter resets for the new window, 2,000 requests can be allowed through in just 2 seconds—an effective QPS far exceeding the expected `1000 / 60 ≈ 16.7`.

### Sliding Window Counter Algorithm

The **Sliding Window Counter algorithm** can be considered an upgraded version of the Fixed Window Counter algorithm with finer rate-limiting granularity.

The improvement over the Fixed Window Counter algorithm is that **it divides a fixed window into multiple smaller sub-windows (buckets/slots)**.

For example, if our endpoint rate limit is 60 requests per minute, we can split 1 minute into 60 sub-windows. Every 1 second, the window slides forward by one slot. Each 1-second sub-window can handle no more than `60 (requests) / 60 (windows)` on average, or more generally, if the total request count across all sub-windows currently inside the sliding window exceeds the limit, additional requests are no longer processed.

Clearly, **the more slots a sliding window is divided into, the smoother the window rolls forward, and the more accurate the rate-limiting statistics become.**

![Sliding Window Counter Algorithm](/media/jg/ext/static001.infoq.cn/image/ae/15/ae4d3cd14efb8dc7046d691c90264715-bdce06fb.webp)

Pros:

- Compared with the Fixed Window algorithm, the Sliding Window Counter algorithm significantly mitigates traffic bursts at window boundaries.
- Compared with the Fixed Window algorithm, it offers finer granularity and more accurate rate-limiting control.

Cons:

- Similar to the Fixed Window Counter algorithm, the Sliding Window Counter algorithm still suffers from uneven/non-smooth traffic shaping.
- Compared with the Fixed Window Counter algorithm, it is slightly more complex to understand and implement.

### Leaky Bucket Algorithm

We can compare sending requests to pouring water into a bucket, and processing requests to water leaking out of a leaky bucket. Water flows into the bucket at an arbitrary rate, while leaking out at a constant rate. When the incoming water exceeds the capacity of the bucket, the excess water overflows and is discarded; because the bucket's capacity and leak rate are fixed, the overall outflow rate is guaranteed.

Implementing this algorithm is also very simple: prepare a queue to hold incoming requests, and periodically pull requests from the queue for execution (the exact same idea as using a message queue for peak shaving and rate limiting).

![Leaky Bucket Algorithm](/media/jg/ext/static001.infoq.cn/image/75/03/75938d1010138ce66e38c6ed0392f103-d3177ace.webp)

Pros:

- Simple to implement and easy to understand.
- Strictly controls the outflow rate, preventing network congestion and system overload.

Cons:

- Cannot handle sudden traffic bursts because requests can only be processed at a fixed rate, which is suboptimal for system resource utilization.
- If the inflow rate (incoming requests) consistently exceeds the outflow rate (request processing), the bucket remains full and new requests will continuously be dropped, degrading service quality.

In real-world business scenarios, the Leaky Bucket algorithm has a relatively narrower range of use cases. When a business needs to accommodate a certain degree of burst traffic, the Token Bucket is usually a better fit; however, in scenarios requiring strict output rate control (such as integrating with third-party APIs that enforce strict QPS caps), the Leaky Bucket remains an appropriate choice.

### Token Bucket Algorithm

The Token Bucket algorithm is also fairly simple. Just like the Leaky Bucket algorithm, the centerpiece is still a bucket. This time, however, the bucket holds tokens: before a request can be processed, it must acquire (and consume) one token from the bucket. If there are no tokens in the bucket, the request must either wait or be rejected. Tokens are added to the bucket at a fixed rate configured according to the rate limit. Once the bucket is full, no additional tokens are added.

![Token Bucket Algorithm](/media/jg/ext/static001.infoq.cn/image/ec/93/eca0e5eaa35dac938c673fecf2ec9a93-fa3e492e.webp)

Pros:

- Caps the average request rate while still allowing short-term bursts up to the bucket capacity.
- Supports dynamically adjusting the token generation rate.

Cons:

- If the token generation rate and bucket capacity are configured improperly, issues such as excessive request drops or system overload may occur.
- Slightly more complex to implement and understand compared to some simpler rate limiting algorithms.

## What Should Rate Limiting Target?

In real-world projects, you also need to decide the target/dimension of rate limiting—that is, what to limit against. Common rate-limiting targets include:

- IP: Rate limiting by IP address has broad applicability and is simple and straightforward.
- Business ID: Selecting a unique business identifier enables more targeted rate limiting—for example, limiting based on user ID.
- Personalized/Dynamic strategies: Applying different rate-limiting policies based on user attributes or behavior—for example, no rate limits for VIP users while rate-limiting regular users—or dynamically adjusting policies based on system runtime metrics (such as QPS, concurrent calls, or system load). For instance, when system load is high, reduce the number of requests allowed per second.

Rate limiting by IP is currently one of the most widely used approaches. However, in practice, you must be careful to obtain the user's real IP address accurately. Common methods include reading the `X-Forwarded-For` header or carrying source IP information in TCP Options fields. Although the `X-Forwarded-For` header can be spoofed, many projects still use it directly due to its simplicity and convenience.

Beyond the targets mentioned above, there are more sophisticated rate-limiting policies. For example, Alibaba's Sentinel supports [flow control based on invocation relationships](https://github.com/alibaba/Sentinel/wiki/流量控制#基于调用关系的流量控制) (including caller-based limiting, entry-point limiting, and associated flow limiting) as well as finer-grained [hot-spot parameter flow control](https://github.com/alibaba/Sentinel/wiki/热点参数限流) (which tracks hot parameter values in real time and applies flow control to invocations carrying those hot parameters).

In addition, a project can combine multiple different rate-limiting dimensions depending on specific business requirements.

## How to Implement Single-Node Rate Limiting?

Single-node rate limiting is designed for monolithic applications.

For single-node rate limiting, you can directly use Google Guava's built-in `RateLimiter` utility class. `RateLimiter` is based on the Token Bucket algorithm and can handle burst traffic.

> Guava repository: <https://github.com/google/guava>

In addition to the basic Token Bucket implementation (smooth bursting), Guava's `RateLimiter` also provides a **SmoothWarmingUp** rate limiting implementation.

Smooth bursting places tokens into the bucket at a specified steady rate, whereas smooth warm-up includes a warm-up period during which the token generation rate gradually ramps up to the configured target rate.

Let's understand both through two simple examples.

We can simply include the Guava dependency in our project to use it.

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>31.0.1-jre</version>
</dependency>
```

> The examples in this article are based on Guava 31.x; the core API of `RateLimiter` remains compatible in newer versions.

Below is a simple demo of Guava smooth bursting (`SmoothBursty`) rate limiting.

```java
import com.google.common.util.concurrent.RateLimiter;

/**
 * Search "JavaGuide" on WeChat and reply "Interview Sprint" to get the original Java interview handbook for free
 *
 * @author Guide
 * @date 2021/10/08 19:12
 **/
public class RateLimiterDemo {

    public static void main(String[] args) {
        // Put 5 tokens into the bucket per second, i.e., 1 token every 0.2s
        RateLimiter rateLimiter = RateLimiter.create(5);
        for (int i = 0; i < 10; i++) {
            double sleepingTime = rateLimiter.acquire(1);
            System.out.printf("get 1 tokens: %ss%n", sleepingTime);
        }
    }
}

```

Output:

```bash
get 1 tokens: 0.0s
get 1 tokens: 0.188413s
get 1 tokens: 0.197811s
get 1 tokens: 0.198316s
get 1 tokens: 0.19864s
get 1 tokens: 0.199363s
get 1 tokens: 0.193997s
get 1 tokens: 0.199623s
get 1 tokens: 0.199357s
get 1 tokens: 0.195676s
```

Note that `acquire()` acquires a token in a blocking manner. In production environments, it is generally recommended to use `tryAcquire(timeout)` with a wait upper bound to avoid blocking threads for too long. The wait time in the first output line is `0.0s` because `RateLimiter.create(5)` starts with available tokens already in the bucket (or rather, the initial permit is granted immediately without delay).

Below is a simple demo of Guava smooth warm-up (`SmoothWarmingUp`) rate limiting.

```java
import com.google.common.util.concurrent.RateLimiter;
import java.util.concurrent.TimeUnit;

/**
 * Search "JavaGuide" on WeChat and reply "Interview Sprint" to get the original Java interview handbook for free
 *
 * @author Guide
 * @date 2021/10/08 19:12
 **/
public class RateLimiterDemo {

    public static void main(String[] args) {
        // Put 5 tokens into the bucket per second, i.e., 1 token every 0.2s
        // With a 3s warm-up period, the token issuance rate gradually ramps up to 1 token per 0.2s over the first 3s
        RateLimiter rateLimiter = RateLimiter.create(5, 3, TimeUnit.SECONDS);
        for (int i = 0; i < 20; i++) {
            double sleepingTime = rateLimiter.acquire(1);
            System.out.printf("get 1 tokens: %sds%n", sleepingTime);
        }
    }
}
```

Output:

```bash
get 1 tokens: 0.0s
get 1 tokens: 0.561919s
get 1 tokens: 0.516931s
get 1 tokens: 0.463798s
get 1 tokens: 0.41286s
get 1 tokens: 0.356172s
get 1 tokens: 0.300489s
get 1 tokens: 0.252545s
get 1 tokens: 0.203996s
get 1 tokens: 0.198359s
```

In addition, **Bucket4j** is an excellent rate limiting library based on the Token Bucket / Leaky Bucket algorithms.

> Bucket4j repository: <https://github.com/vladimir-bukhtoyarov/bucket4j>

Compared with Guava's `RateLimiter`, Bucket4j provides much more comprehensive rate limiting features. It supports both single-node and distributed rate limiting, and also integrates with monitoring tools such as Prometheus and Grafana.

Still, Guava is a comprehensive general-purpose utility library, and its out-of-the-box rate limiting capability remains very practical for many single-node scenarios.

Spring Cloud Gateway's built-in rate limiter `RedisRateLimiter` is implemented based on Redis + Lua. Bucket4j and Resilience4j typically integrate with gateways through standalone extensions or Spring ecosystem components rather than being evolutionary replacements for Spring Cloud Gateway's built-in rate limiter.

Resilience4j is a lightweight fault-tolerance library inspired by Hystrix. Since [Netflix announced that Hystrix is no longer under active development](https://github.com/Netflix/Hystrix/commit/a7df971cbaddd8c5e976b3cc5f14013fe6ad00e6), both the Spring team and Netflix recommend using Resilience4j for rate limiting and circuit breaking.

> Resilience4j repository: <https://github.com/resilience4j/resilience4j>

In general, to ensure high availability, rate limiting and circuit breaking are implemented together in projects.

Resilience4j provides not only rate limiting, but also out-of-the-box high-availability features such as circuit breaking, bulkhead/load protection, and automatic retries. Furthermore, Resilience4j has a strong ecosystem and is used by many API gateways for rate limiting and circuit breaking.

Therefore, in the vast majority of scenarios, Resilience4j may be the better choice. For simpler rate limiting needs, Guava or Bucket4j are also solid options.

## How to Implement Distributed Rate Limiting?

Distributed rate limiting targets distributed and microservice architectures. Under such architectures, a single service is often deployed across multiple instances; if you need to enforce a global quota, those instances must share rate-limiting state. However, not every microservice scenario requires distributed rate limiting: if the quota can be evenly split across instances (for example, a total quota of 1,000 QPS across 10 instances, capped at 100 QPS per instance), single-node rate limiting actually has advantages in both performance and implementation simplicity.

Common approaches for distributed rate limiting include:

- **Middleware-based rate limiting**: Use Sentinel, or build your own rate limiting logic using Redis.
- **Gateway-layer rate limiting**: A very common approach that enforces rate limiting directly at the API gateway layer. However, gateway-layer rate limiting typically still relies on middleware or frameworks underneath. For example, Spring Cloud Gateway's distributed rate limiter `RedisRateLimiter` is built on Redis + Lua, and Spring Cloud Gateway can also integrate with Sentinel for rate limiting.

If you implement rate limiting manually on top of Redis, it is recommended to pair it with Lua scripts.

**Why is Redis + Lua recommended?** There are two main reasons:

- **Reduced network overhead**: You can execute multiple Redis commands in batch inside a single Lua script, submitting them to the Redis server to run all at once, which significantly reduces network round-trip overhead.
- **Atomicity**: A Lua script is executed as a single atomic command; while it runs, no other scripts or Redis commands execute concurrently, ensuring the rate-limiting operations cannot be interleaved or corrupted by other commands.

Note that because Lua scripts execute atomically in Redis, they also block other Redis operations while running. Therefore, rate-limiting scripts should be kept lightweight, avoiding complex computations or large scans, and paired with Redis's `lua-time-limit` setting to prevent runaway script execution times.

I won't include specific Lua script code here, as there are many battle-tested open-source implementations available for reference—for example, Apache ShenYu gateway's RateLimiter plugin implements Token Bucket / Concurrent Token Bucket, Leaky Bucket, and Sliding Window algorithms using Redis + Lua.

> ShenYu repository: <https://github.com/apache/incubator-shenyu>

![ShenYu Rate Limiting Lua Scripts](/media/jg/ext/oss.javaguide.cn/javaguide/high-availability/limit-request/shenyu-ratelimit-lua-scripts-ccd3a01f.png)

Additionally, if you prefer not to write Lua scripts yourself, you can directly use Redisson's `RRateLimiter` to implement distributed rate limiting, which is powered under the hood by Lua scripts + the Token Bucket algorithm.

Redisson is an open-source Java Redis client that offers many out-of-the-box features, such as distributed implementations of standard Java data structures, distributed locks, delayed queues, and more. Redisson also supports multiple Redis deployment topologies including standalone, Redis Sentinel, and Redis Cluster.

Using `RRateLimiter` is very straightforward. First obtain an `RRateLimiter` object directly from the Redisson client, and then configure the rate-limiting rule.

```java
// Create a Redisson client instance
RedissonClient redissonClient = Redisson.create();
// Obtain a rate limiter named "javaguide.limiter"
RRateLimiter rateLimiter = redissonClient.getRateLimiter("javaguide.limiter");
// Try setting the rate limiter to 100 permits per hour
// RateType has two modes: OVERALL for global rate limiting, and PER_CLIENT for per-client rate limiting (effectively single-node)
rateLimiter.trySetRate(RateType.OVERALL, 100, 1, RateIntervalUnit.HOURS);
```

Next, call `acquire()` or `tryAcquire()` to obtain permits.

```java
// Acquire 1 permit; blocks/waits if the rate limit is exceeded
// acquire() is synchronous; the corresponding async method is acquireAsync()
rateLimiter.acquire(1);
// Try to acquire 1 permit within 5 seconds; returns true if successful, false otherwise
// tryAcquire() is synchronous; the corresponding async method is tryAcquireAsync()
boolean res = rateLimiter.tryAcquire(1, 5, TimeUnit.SECONDS);
```

The precision of `RRateLimiter` is affected by Redis performance and network latency, so slight over-limits may occur under ultra-high concurrency. During Redis failures or primary-replica failovers, `tryAcquire()` may throw exceptions; the application layer should define its fallback strategy in advance—whether to fall back to local rate limiting, reject directly, or allow requests through briefly—depending on the business trade-off between stability and availability.

## Summary

This article introduced common rate limiting algorithms, how to choose rate-limiting targets, and how to implement both single-node and distributed rate limiting.

## References

- Service Governance with the Lightweight Fault-Tolerance Framework Resilience4j: <https://xie.infoq.cn/article/14786e571c1a4143ad1ef8f19>
- Detailed Analysis of Guava RateLimiter Principles: <https://cloud.tencent.com/developer/article/1408819>
- Spring Cloud Gateway in Action: Rate Limiting 👍: <https://www.aneasystone.com/archives/2020/08/spring-cloud-gateway-current-limiting.html>
- Deep Dive into Redisson Distributed Rate Limiting Implementation Principles: <https://juejin.cn/post/7199882882138898489>
- Java Rate Limiting Interface Implementations Explained - Alibaba Cloud Developer: <https://mp.weixin.qq.com/s/A5VYjstIDeVvizNK2HkrTQ>
- Exploration and Practice of Distributed Rate Limiting Solutions - Tencent Cloud Developer: <https://mp.weixin.qq.com/s/MJbEQROGlThrHSwCjYB_4Q>
