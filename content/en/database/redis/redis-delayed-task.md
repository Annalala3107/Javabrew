---
title: How to Implement Delayed Tasks Based on Redis?
description: An in-depth look at two approaches to implementing delayed tasks with Redis: expired event notifications and Redisson's delayed queue, analyzing their pros and cons, reliability concerns, and suitable use cases.
category: Database
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis delayed task,delayed queue,expired event listening,Redisson DelayedQueue,order timeout,scheduled task
lang: en
sourceRef: zh-ref/database/redis/redis-delayed-task.md
---

Implementing delayed tasks based on Redis generally boils down to the following two solutions:

1. Redis expired event listening (Keyspace Notifications)
2. Redisson's built-in delayed queue (`RDelayedQueue`)

During an interview, you can first mention that you evaluated both approaches, but discovered that listening to Redis expired events comes with numerous inherent flaws. Consequently, you chose Redisson's built-in `DelayedQueue` as your production solution.

At that point, the interviewer may ask follow-up questions regarding the details of these two approaches. We will cover them below so you can prepare in advance.

Additionally, beyond the questions outlined below, it is highly recommended that you review common Redis interview topics, as interviewers often branch out into broader Redis discussions.

### What is the principle behind implementing delayed tasks using Redis expired event listening?

Redis 2.0 introduced the Publish/Subscribe (pub/sub) pattern. In pub/sub, there is the concept of a **channel**, which is analogous to a **topic** in traditional message queues.

The pub/sub model involves two primary roles: publishers and subscribers (also referred to as consumers):

- A publisher sends messages to a designated channel via `PUBLISH`.
- A subscriber listens to channels of interest via `SUBSCRIBE`. A subscriber can subscribe to one or multiple channels simultaneously.

![Redis Publish/Subscribe (pub/sub) Pattern](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-pub-sub-a9065911.png)

Under pub/sub, producers must designate which channel messages are routed to, while consumers subscribe to the matching channel to receive those messages.

Redis defines several built-in default channels to which Redis itself publishes messages rather than your application code. Among these, `__keyevent@0__:expired` is a default channel responsible for listening to key expiration events. Specifically, when a key expires, Redis publishes an expiration event message to the `__keyevent@<db>__:expired` channel.

By having our service listen to this channel, we can capture notifications about expired keys and trigger delayed business logic, thereby achieving delayed task execution.

This feature is officially known in Redis as **keyspace notifications**, designed to provide real-time visibility into changes occurring on Redis keys and values.

### What are the drawbacks of implementing delayed tasks using Redis expired event listening?

**1. Poor Timeliness**

An excerpt from the official Redis documentation explains why timeliness is poor (documentation URL: <https://redis.io/docs/manual/keyspace-notifications/#timing-of-expired-events>):

![Redis Expired Events](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-timing-of-expired-events-5dfb5ee7.png)

The core takeaway is: **expired event messages are published only when the Redis server actually deletes the key, NOT at the exact moment the key's TTL expires.**

As we know, Redis uses two primary strategies to delete expired keys:

1. **Lazy deletion (passive)**: Expiration checks are performed only when a key is accessed. This is very friendly to CPU resources, but can leave many expired keys lingering in memory if they are never accessed again.
2. **Periodic deletion (active)**: At periodic intervals, Redis samples a random batch of keys and deletes expired ones. Redis internally bounds the duration and frequency of this routine to prevent it from consuming excessive CPU cycles.

Periodic deletion is more memory-friendly, whereas lazy deletion is more CPU-friendly. Each has trade-offs, so Redis adopts a combination of **periodic deletion + lazy deletion**.

Consequently, even though you configure a TTL on a key, the key might not be deleted at the exact second it expires, meaning the expired event will not be fired on time.

**2. Message Loss**

Messages in Redis pub/sub do not support persistence, fundamentally distinguishing pub/sub from full-fledged message brokers. In Redis pub/sub, publishers send messages to a channel, and subscribers receive them in real time. If no subscribers are connected when a message is published, the message is dropped immediately and is not retained anywhere in Redis.

**3. Duplicate Message Consumption Across Multiple Service Instances**

Redis pub/sub only operates in broadcast mode. When a message is published to a channel, every subscriber connected to that channel receives a copy.

In a distributed environment with multiple microservice instances, all instances will receive the same expiration event. Extra coordination (such as distributed locking or deduplication logic) is required to prevent duplicate execution, increasing development and maintenance complexity.

### What is the principle behind Redisson's delayed queue, and what advantages does it offer?

Redisson is an open-source Redis client for Java that provides numerous production-ready features out of the box, including multiple distributed lock implementations and delayed queues.

We can leverage Redisson's built-in `RDelayedQueue` to implement robust delayed tasks.

Redisson's `RDelayedQueue` is built on top of Redis's `SortedSet` data structure. A `SortedSet` is an ordered collection where each element is associated with a score representing its weight or ranking. Redisson takes advantage of this property by inserting delayed tasks into a `SortedSet`, using their scheduled execution timestamps (expiration times) as their scores.

Redisson periodically executes the `ZRANGEBYSCORE` command to scan for expired elements in the `SortedSet`. Once identified, these expired elements are removed from the `SortedSet` and transferred into a ready list (a blocking queue). Consumers listen to this blocking queue and process tasks as soon as they arrive. This approach avoids continuous polling across the entire `SortedSet` by consumers, significantly enhancing execution efficiency.

Compared to listening to Redis expiration events, this approach provides the following advantages:

1. **Reduced risk of message loss**: Messages in `DelayedQueue` are persisted in Redis. Even if Redis crashes, the loss is limited to what wasn't synced under the persistence policy. In addition, you can maintain a database scanning job as an auxiliary compensation mechanism.
2. **No duplicate consumption**: All consumer instances pull tasks from the same underlying target queue, naturally avoiding duplicate consumption across instances.

Compared to Redisson's delayed queue, dedicated message queues (such as RocketMQ or RabbitMQ) can achieve higher throughput and greater reliability through features like guaranteed message delivery, dead-letter queues, and granular control over consumer/producer parallelism. In production systems with strict reliability standards, delayed messages via a dedicated message queue remain the preferred choice.
