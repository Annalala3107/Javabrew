---
title: Common Cache Fundamentals Interview Questions Summary
description: An in-depth explanation of the core ideas behind caching, differences between local and distributed caches, and multi-level cache architecture design. Covers mainstream caching solutions such as Caffeine and Redis, as well as cache consistency solutions—ideal for Java developers learning cache architecture design.
category: Databases
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Cache,Local Cache,Distributed Cache,Multi-Level Cache,Caffeine,Redis,Cache Consistency,System Design,Java Cache,Guava Cache
lang: en
sourceRef: zh-ref/database/redis/cache-basics.md
---

> **Related Interview Questions**:
>
> - Why use caching?
> - How should local caching be implemented?
> - Why do we need distributed caching? / Why not just use local caching directly?
> - Why use multi-level caching?
> - Which business scenarios are multi-level caches suited for?

## The Core Idea Behind Caching

Many developers know that caching improves system performance and reduces request **Response Time**, yet are less clear about the fundamental idea behind caching.

The core idea of caching is actually very simple: it is an application of the classic performance optimization strategy we are all familiar with—**trading space for time**. Trading space for time means using additional storage space to hold data that may be reused or recomputed repeatedly, thereby reducing the time spent re-fetching or recomputing that data.

Speaking of trading space for time, besides caching, what other examples can you think of? Here are a few common ones:

- **Indexes**: An index organizes specific columns or fields of a database table into a separate data structure according to a defined ordering rule. Although it consumes extra storage space, it dramatically speeds up lookup efficiency and reduces the cost of sorting data.
- **Database Table Column Redundancy (Denormalization)**: Storing frequently joined data redundantly in the same table reduces multi-table join queries, improving query performance and easing database load.
- **CDN (Content Delivery Network)**: Distributing static assets across multiple edge nodes so clients can access nearby replicas accelerates static resource delivery and reduces the load on origin servers and bandwidth.

In programming, you should learn to summarize and connect what you learn! If you can bring up connections like these during an interview, the interviewer will definitely have a great impression of you.

Do not overcomplicate caching—even though it undeniably offers an extremely high return on investment for improving system performance. As you learn and apply caching, you will find that the idea of caching is actually used extensively in CPUs, operating systems, and many other places.

For example, **CPU Cache** caches main memory data to bridge the speed mismatch between **CPU** processing speed and main memory access speed; main memory caches disk data to mitigate slow disk **I/O** speeds.

![CPU Cache Model Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-f9ad1aa3.png)

As another example, to speed up virtual-to-physical address translation, operating systems introduce the **Translation Lookaside Buffer (TLB)** on top of the page table scheme.

![Address Translation After Adding TLB](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/physical-virtual-address-translation-mmu-c9371c91.png)

Take everyday web browsers as another example: they cache visited images and static files (browser cache) so that loading speed improves noticeably the next time you visit the same page.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/chrome-clear-cache-50690555.png)

In the caches we use in everyday development, data is typically stored in **RAM** (main memory), where access speeds are blazingly fast. To prevent in-memory data from being lost on restarts or crashes, many caching middleware systems (such as **Redis**) provide disk persistence mechanisms. Compared with relational databases (such as **MySQL**), caches offer access speeds and concurrency capacity that are several orders of magnitude higher. Adding a caching layer above the database is a core technique for protecting underlying storage and boosting system throughput.

## Types of Caches

Next, let's look at how the caches used in everyday development are typically categorized.

### Local Cache

#### What Is a Local Cache?

Local caching is used quite frequently in real projects, especially in monolithic architectures. When the data volume is small and there are no distributed requirements, using a local cache works well.

A local cache resides inside the application process itself. Its biggest advantage is that it lives in the same process as the application—requests to a local cache are extremely fast with zero additional network overhead.

A common monolithic deployment architecture is shown below: we use **Nginx** for **load balancing**, deploy two identical application instances onto servers, and both service instances share the same database while each using its own local cache.

![Local Cache Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/local-cache-6bcfccc4.png)

**Note:** When using a local cache in cluster mode, you must consider the **load balancing strategy**. If Nginx uses default **Round-Robin**, requests from the same user will land randomly on different machines, resulting in an extremely low local cache hit rate. Solutions include:

1. **Gateway Layer**: Use consistent hashing or Sticky Sessions to ensure requests from the same user consistently route to the same machine.
2. **Application Layer**: Only use local caching for **"globally almost-immutable"** data (such as configuration dictionaries), rather than user-scoped data.

#### What Local Caching Solutions Exist?

**1. Built-in JDK `HashMap` and `ConcurrentHashMap`.**

`ConcurrentHashMap` can be viewed as a thread-safe version of `HashMap`; both store key/value pairs. However, in most scenarios you should not use them directly as a cache, because they only provide basic storage and lack features such as expiration times. A reasonably complete caching framework should at minimum provide: **expiration time**, **eviction mechanism**, and **hit rate statistics**.

**2. `Ehcache`, `Guava Cache`, and `Spring Cache` are three widely used local caching frameworks.**

- `Ehcache` is heavier than the other two. However, compared with `Guava Cache` and `Spring Cache`, `Ehcache` supports embedding into Hibernate and MyBatis as a second-level/multi-level cache, can persist cached data to local disk, and also provides a clustering solution (which is rather mediocre and can be ignored).
- `Guava Cache` and `Spring Cache` are fairly similar. `Guava` is used a bit more widely than `Spring Cache`—it provides convenient APIs as well as features like setting cache expiration times. Its internal implementation is also clean, sharing many design ideas with `ConcurrentHashMap`.
- Using `Spring Cache` annotations makes code look clean and elegant, but it can easily run into issues such as cache penetration and Out of Memory (OOM).

**3. Rising star: Caffeine.**

Compared with `Guava`, `Caffeine` is superior in every aspect such as performance, and it is generally recommended to use it as a replacement for `Guava`. Moreover, `Guava` and `Caffeine` have very similar APIs!

Here is a code example of creating a local cache using `Caffeine`, utilizing the Builder pattern:

```java
// Example of creating a local cache using Caffeine
Cache<String, String> cache = Caffeine.newBuilder()
        // Expire 60 days after write
        .expireAfterWrite(60, TimeUnit.DAYS)
        // Initial capacity
        .initialCapacity(100)
        // Maximum entry limit
        .maximumSize(500)
        // Enable statistics recording
        .recordStats()
        .build();
```

#### What Are the Pain Points of Local Caching?

The advantages of local caching are obvious: **low dependency**, **lightweight**, **simple**, and **low cost**.

However, local caching suffers from the following drawbacks:

- **Coupled to the application and unfriendly to distributed architectures**: For example, when the same service is deployed across multiple machines, caches cannot be shared across instances because each local cache only exists on its own host machine.
- **Capacity is severely constrained by the host machine where the service is deployed.** If the application service itself consumes a lot of memory, very little memory remains available for the local cache.

### Distributed Cache

#### What Is a Distributed Cache?

We can think of a Distributed Cache as an in-memory database service whose ultimate purpose is to serve cached data.

A distributed cache exists independently outside the application, allowing multiple applications to directly share the same distributed caching service.

As shown in the diagram below, this is a simple architecture using a distributed cache: we use Nginx for load balancing, deploy two identical application instances on servers, and both instances share the same database and cache.

![Distributed Cache](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/distributed-cache-cfb344a2.png)

With a distributed cache, the caching service can be deployed on a standalone server. Even if identical service instances run across multiple machines, they all read from and write to the same shared cache. Furthermore, a dedicated distributed cache service offers far stronger performance, capacity, and features.

**There are no silver bullets in software system design—every introduced technology is a double-edged sword.** Used properly, it brings significant benefits to the system; otherwise, you expend effort with poor returns.

Put simply, introducing a distributed cache into a system typically brings the following challenges:

- **Increased system complexity**: After introducing a cache, you must maintain data consistency between the cache and database, manage hot cache keys, ensure high availability of the cache service, and so on.
- **Increased system development and infrastructure cost**: Introducing a cache means the system needs a dedicated caching service, which incurs corresponding hardware and operational costs—and those costs can be expensive, since it consumes precious RAM.

#### What Distributed Caching Solutions Exist?

Among distributed caches, the long-established and widely used options are **Memcached** and **Redis**. However, nowadays you almost never see new projects using **Memcached** for caching—almost everyone uses **Redis** directly.

Memcached was popular in the early days when distributed caching first emerged. Later, as Redis matured, teams gradually migrated to the far more powerful Redis.

Some major tech companies have also open-sourced Redis-like distributed high-performance KV stores—for example, Tencent's open-source [Tendis](https://github.com/Tencent/Tendis). Built on top of the well-known open-source storage engine [RocksDB](https://github.com/facebook/rocksdb), Tendis is 100% compatible with the Redis protocol and all Redis 4.0 data models. Regarding the comparison between Redis and Tendis, Tencent's official engineering team published an article: [Redis vs Tendis: Unveiling the Cold-Hot Hybrid Storage Architecture](https://mp.weixin.qq.com/s/MeYkfOIdnU6LYlsGb24KjQ), which you can check out as a reference.

However, judging by the GitHub commit history of Tendis, the open-source edition is barely maintained anymore, and given its low community traction and limited adoption, Tendis is not recommended for implementing a distributed cache.

Currently, the industry-recognized Redis alternatives are the following two open-source distributed caches (both gained attention by benchmarking against Redis):

- [Dragonfly](https://github.com/dragonflydb/dragonfly): An in-memory database built for modern application workloads, fully compatible with both Redis and Memcached APIs so migrations require zero code changes, billing itself as the fastest in-memory database in the world.
- [KeyDB](https://github.com/Snapchat/KeyDB): A high-performance fork of Redis focused on multithreading, memory efficiency, and high throughput.

Even so, Redis remains the recommended first choice for distributed caching given its years of battle-tested production reliability, rich ecosystem, and comprehensive documentation.

### Multi-Level Cache

#### What Is a Multi-Level Cache? Why Use It?

Here we will briefly discuss the **local cache + distributed cache** multi-level caching approach, which is the most commonly used multi-level cache implementation.

At this point, many developers may ask: **If we already use a distributed cache, why would we still use a local cache?**

Although both local caches and distributed caches are caches, accessing a local cache is far faster than accessing a distributed cache because, as mentioned earlier, local cache access incurs no extra network overhead.

However, under normal circumstances, multi-level caching is actually **not** recommended—it increases maintenance burden (for example, keeping L1 and L2 caches consistent), and for the vast majority of business scenarios, the actual performance gain is not substantial.

Here is a brief summary of two business scenarios suitable for multi-level caching:

- Cached data is rarely modified and remains relatively stable;
- Read traffic is extraordinarily high, such as in flash-sale (seckill) scenarios.

In a multi-level caching scheme, the first-level cache (L1) uses local memory (such as Caffeine), and the second-level cache (L2) uses a distributed cache (such as Redis).

![Multi-Level Cache](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/multilevel-cache-c6b861f9.png)

When reading cached data, we first read from L1 and return immediately on a hit; on an L1 miss, we read from L2. If L2 hits, the data should first be backfilled into the current instance's L1 before returning the result, avoiding repeated L2 lookups on every subsequent L1 miss. If L2 does not have the data either, we query the database and write the retrieved data into both L1 and L2. This reduces read calls to L2 and relieves pressure on L2.

Recommended open-source multi-level cache implementations:

- [J2Cache](https://gitee.com/ld/J2Cache): A two-level Java caching framework based on local memory and Redis.
- [JetCache](https://github.com/alibaba/jetcache): An open-source caching framework from Alibaba supporting multi-level caching, automatic refresh for distributed caches, TTL, and more.

#### How Is Multi-Level Cache Consistency Guaranteed?

Multi-level caches are typically designed for eventual consistency, requiring separate handling for changes along **DB → Redis** and **Redis → each instance's L1**. Simply deleting a key in Redis still leaves local copies in other JVMs readable; setting a short TTL on L1 bounds how long stale data can be read, but it cannot replace invalidation notifications.

Notification mechanisms must account for both delivery scope and failure recovery:

- **Redis Pub/Sub** can broadcast invalidation notifications, but it uses at-most-once delivery semantics—messages sent while a subscription is disconnected are not replayed upon reconnection. You should pair it with L1 TTL and clear the relevant local caches whenever the notification connection drops or enters an untrusted state. See [Redis Pub/Sub Delivery Semantics](https://redis.io/docs/latest/develop/pubsub/#delivery-semantics).
- **Redis Stream or a Message Queue** can persist messages and support retries, but you must configure the broadcast scope properly. For example, multiple consumers in the same Stream consumer group split messages among themselves, so you cannot notify every L1 instance by placing all JVMs into the same group. Instead, each instance can maintain independent consumption progress or use an independent consumer group, while also handling restarts, message backlogs, and message retention periods. See [XREADGROUP Consumer Group Semantics](https://redis.io/docs/latest/commands/xreadgroup/).
- **Redis Client Tracking** can notify clients to invalidate tracked Redis keys when they change, but it cannot detect database updates that have not yet been synced to Redis. Clients must also properly handle the ordering between invalidation notifications and read responses to avoid "receiving an invalidation notification first and then placing a delayed stale response into L1." See [Redis Client-Side Caching Reference](https://redis.io/docs/latest/develop/reference/client-side-caching/).

Zhengcaiyun Tech's solution uses Canal + broadcast messaging. Here is a brief overview:

1. DB data modification: First, data is updated in the database.
2. Listen to Canal messages to trigger cache updates: Canal listens for database change events, and upon detecting a change, triggers cache updates.
3. Sync Redis cache: For the Redis cache, since the cluster shares a single copy of the data, it can be updated directly.
4. Sync local caches: Because local caches live across different JVM instances, a broadcast message queue (MQ) mechanism is needed to broadcast update notifications to every service instance so each local cache stays in sync.

Detailed walkthrough: [Distributed Multi-Level Cache System Design and Practice](https://juejin.cn/post/7225634879152570405)

Flows like this also require strict conventions around message ordering and backfill behavior: if L1 invalidates first while Redis still holds the old value, read requests may reload the old value back into L1; if messages carry full payloads for updates, you must also prevent late-arriving older versions from overwriting newer ones. You can design compensating mechanisms around business version validation, invalidation retries, and TTLs—never equate "receiving a notification" with "every layer has finished syncing."

#### What Happens If Writers Delete the Cache While Readers Only Wait for Scheduled Refreshes?

When adopting Cache Aside, **cache deletion and miss-triggered origin backfill are paired read/write conventions**. If readers only read from the cache, deletion can directly make business data temporarily unavailable.

For example, suppose a campaign display service stores campaign configurations in L1 and Redis, while a background job periodically refreshes Redis. When an admin updates a configuration and deletes the old value from Redis, the display service immediately returns an empty result whenever both cache layers miss. Even though that configuration exists in the database the entire time, the page can still show "campaign does not exist" between the time L1 expires and the next refresh finishes.

In such scenarios, you must first complete the handling for cache misses:

- **Allow on-demand origin backfill**: When both L1 and Redis miss, the display service or a unified data service queries the DB and rebuilds the cache; coalesce concurrent load requests for the same hot key to prevent a flood of simultaneous origin queries.
- **Explicitly forbid request-path origin queries**: Then you must design reliable proactive refreshes, retries for refresh failures, and fallback behavior on cache misses. If the business allows brief usage of stale configurations, you can retain an older copy with a maximum staleness bound; never treat "delete and wait for the next scheduled job run" as a complete solution.

You must also distinguish among **cache miss, database-confirmed non-existence, and cache access errors**. Only when a database query confirms that a record does not exist should you write a short-TTL null marker; treating a Redis timeout or cache miss as "business data does not exist" risks caching a transient failure onward.

When multiple applications share a cache, they should standardize the instance, logical database, key prefixes, serialization format, and update ownership. When troubleshooting periodic faults, align error timestamps with scheduled jobs, TTLs, deletion logs, and backfill logs. For detailed read/write ordering and failure compensation, see [3 Commonly Used Cache Read and Write Strategies Explained](./3-commonly-used-cache-read-and-write-strategies.md).

## Further Reading on Data Structures

Caching questions often drill down into underlying data structures:

- [Bloom Filter Explained](../../cs-basics/data-structure/bloom-filter.md): Understand cache penetration, false positive rates, and deletion challenges.
- [LRU Cache Interview Questions Summary](../../cs-basics/data-structure/lru-cache.md): Understand local cache eviction policies, `LinkedHashMap` implementation, and page replacement concepts.
- [Hash Table Interview Questions Summary](../../cs-basics/data-structure/hash-table.md): Understand cache key mapping, hash collisions, and resizing.

## References

- All About Caching (Meituan Tech): https://tech.meituan.com/2017/03/17/cache-about.html
- Analysis of Distributed System Cache Design: https://segmentfault.com/a/1190000041689802
