---
title: "RabbitMQ Common Interview Questions Summary"
description: "A summary of common RabbitMQ interview questions and core concepts, covering the AMQP protocol, Exchange types (Direct, Topic, Fanout, Headers), message confirmation mechanisms, Dead-Letter Queues, Delay Queues, Priority Queues, Quorum Queues, Streams, high availability, production metrics, and common pitfalls."
category: High Performance
tag:
  - Message Queue
head:
  - - meta
    - name: keywords
      content: RabbitMQ,AMQP Protocol,Exchange,Message Confirmation,Dead-Letter Queue,Delay Queue,Priority Queue,RabbitMQ Cluster,Message Queue Interview
lang: en
sourceRef: zh-ref/high-performance/message-queue/rabbitmq-questions.md
---

You can no longer prepare for RabbitMQ interviews using only the old "Exchange + Queue" boilerplate answer. RabbitMQ 4.0 has already removed classic mirrored queues; when you need replication and high availability, look primarily at Quorum Queues; when you need log-style storage, historical replay, or massive message backlogs, evaluate Streams.

This article centers on the latest RabbitMQ 4.x releases while retaining context on mirrored queues that you may still encounter in legacy 3.x clusters. Focus on four core areas: how the AMQP model works, how Exchanges route messages, how message reliability is guaranteed, and how to choose among Classic Queues, Quorum Queues, and Streams.

## What Is RabbitMQ?

RabbitMQ is an open-source message middleware written in Erlang. Its most widely used protocol is AMQP 0-9-1, and it also supports AMQP 1.0, MQTT, STOMP, and others.

It plays the Broker role in a system: Producers send messages to an Exchange, the Exchange routes messages to Queues according to Binding rules, and Consumers pull messages from Queues. RabbitMQ's strengths lie primarily in its routing capabilities, acknowledgment mechanisms, plugin ecosystem, and multi-language client ecosystem.

## RabbitMQ Features

- **Reliability**: Supports message persistence, manual consumer Ack, Publisher Confirms, Dead-Letter Exchanges (DLX), and other mechanisms.
- **Flexible routing**: Messages enter an Exchange first and are then delivered to Queues by the Exchange based on Routing Keys and Binding rules. Built-in Exchanges suffice for common routing needs; for complex scenarios, you can chain multiple Exchanges or use plugins.
- **Scalability**: Multiple RabbitMQ nodes can form a cluster, while queue replication capability is determined by the queue type—you shouldn't look solely at the word "cluster."
- **High availability**: Quorum Queues replicate data using the Raft protocol; Streams are also replicated data structures, better suited for log-style storage and replay scenarios.
- **Multiple protocols**: Besides native AMQP support, RabbitMQ supports multiple messaging middleware protocols such as STOMP and MQTT.
- **Multi-language clients**: RabbitMQ supports nearly all mainstream programming languages, including Java, Python, Ruby, PHP, C#, and JavaScript.
- **Management UI**: The Management UI allows you to inspect queues, connections, Channels, Exchanges, node statuses, and common runtime metrics.
- **Plugin mechanism**: RabbitMQ extends capabilities such as MQTT, STOMP, and Prometheus monitoring through plugins.

## What Are the Important Concepts in RabbitMQ?

Overall, RabbitMQ follows a Producer-Consumer model and is primarily responsible for receiving, storing, and forwarding messages. You can imagine message delivery like this: when you drop a package off at a post office, the post office temporarily stores it and eventually delivers it via a mail carrier to the recipient's hands. RabbitMQ is like a system composed of the post office, mailboxes, and mail carriers. In computer science terms, the RabbitMQ model resembles a switch/exchange routing model.

The overall architectural model of RabbitMQ is shown below:

![RabbitMQ 4.0 Core Architecture and Message Lifecycle Flow](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/rabbitmq/rabbitmq-core-architecture-and-message-lifecycle-fc6dd9c3.png)

Let's examine the main components.

### Producer and Consumer

- **Producer**: The party that produces/sends messages (the mail sender).
- **Consumer**: The party that consumes messages (the mail recipient).

A message generally consists of 2 parts: the **message header** (also called Labels/Properties) and the **message body** (also referred to as the **payload**). The message body is opaque, whereas the message header consists of a set of optional attributes, including `routing-key`, `priority` (relative to other messages), `delivery-mode` (indicating the message may require persistent storage), and so on. Once a Producer hands a message over to RabbitMQ, RabbitMQ dispatches the message to interested Consumers based on the message header.

### Exchange

In RabbitMQ, messages are not delivered directly to a **Queue**; instead, they must pass through an **Exchange** layer first, and the **Exchange** distributes messages to the corresponding **Queues**.

An **Exchange** receives messages sent by Producers and routes them to one or more Queues. If routing fails (no matching queue), the message may be returned to the Producer, routed to an Alternate Exchange, or silently dropped, depending on publishing flags and Exchange settings.

**RabbitMQ has 4 Exchange types, each corresponding to a different routing strategy**: **direct**, **fanout**, **topic**, and **headers**. Each Exchange type forwards messages differently, as detailed in the **Exchange Types** section below.

> Note: AMQP 0-9-1 defines a Default Exchange, which is a pre-declared `direct` Exchange named with the empty string `""`. When creating your own business Exchanges, you must explicitly specify the Exchange type.

When sending a message to an Exchange, a Producer typically specifies a **RoutingKey** to indicate the routing rule for the message. This **RoutingKey works together with the Exchange type and BindingKey to take effect**.

In RabbitMQ, a **Binding** associates an **Exchange** with a **Queue**. When creating a Binding, a **BindingKey** is usually specified, and RabbitMQ uses it to decide which Queue a message should enter. A Binding can be thought of as a routing rule, and Exchanges and Queues have a many-to-many relationship.

When a Producer sends a message to an Exchange, it typically attaches a RoutingKey. When the BindingKey and RoutingKey match according to the Exchange's type, the message is routed to the corresponding Queue. Multiple Queues can be bound to the same Exchange, and multiple Bindings are allowed to share the same BindingKey. Whether the BindingKey participates in matching depends on the Exchange type—for example, a `fanout` Exchange ignores the BindingKey and delivers messages to every bound Queue.

### Queue

A **Queue** stores messages until they are delivered to Consumers. It is both the container for messages and their destination. A single message can be placed into one or more Queues. Messages remain in the Queue waiting for Consumers to connect and fetch them.

In its classic architecture, **RabbitMQ** can only store messages in **Queues**, which is the opposite of messaging middleware like **Kafka**. Kafka stores messages at the logical **topic** level, and logical queues correspond merely to consumer offset markers within the topic's underlying storage files. RabbitMQ Producers publish messages that are eventually routed into Queues, and Consumers retrieve and consume messages from those Queues.

> Starting in RabbitMQ 3.9, Streams are available. Streams use an append-only log: messages are not deleted from the log after consumption, and Consumers can replay historical messages by offset. Use cases like event sourcing, log fan-out, and large message backlogs are better suited for Streams; regular asynchronous tasks should still prefer Classic Queues or Quorum Queues.

**Multiple Consumers can subscribe to the same Queue**, and messages in the Queue are distributed among them so that one message is processed by one Consumer rather than every Consumer receiving a copy.

> Note: Actual distribution behavior is affected by `prefetch_count`. In AMQP 0-9-1, `prefetch_count=0` means unlimited unacknowledged messages, so one Consumer might grab a huge batch at once. When business processing latency fluctuates, set an appropriate prefetch value on Consumers to avoid messages piling up locally on a single Consumer.

**RabbitMQ** does not support queue-level broadcast consumption. If you want every Consumer to receive a copy of each message, the standard approach is to give each Consumer its own Queue and bind all of those Queues to the same `fanout` or `topic` Exchange.

### Broker (Message Middleware Server Node)

For RabbitMQ, a RabbitMQ Broker can simply be viewed as a RabbitMQ server node or service instance. In most cases, you can think of one RabbitMQ Broker as one RabbitMQ server.

### Exchange Types

Common Exchange Types in RabbitMQ are **fanout**, **direct**, **topic**, and **headers** (the AMQP specification also mentions two other types—`system` and custom—which are omitted here).

![Comparison of the Four RabbitMQ Exchange Types](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/rabbitmq/rabbitmq-exchange-types-7f9832f1.png)

| Type | Routing Rule | Common Scenarios |
| --- | --- | --- |
| `fanout` | Ignores RoutingKey; sends to all bound Queues | Config refresh, cache invalidation, fanning out logs to multiple Consumers simultaneously |
| `direct` | Exact match between BindingKey and RoutingKey | Precise dispatch by severity level, business type, or service name |
| `topic` | RoutingKey segmented by `.`; BindingKey supports `*` and `#` | Multi-level filtering by region, business module, and event type |
| `headers` | Matches against message headers; supports `x-match=all` and `any` | Rarely used; generally avoid `headers` whenever `topic` can express the rule |

The two `topic` wildcards are easy to confuse: `*` matches exactly one word, while `#` matches zero or more words. For example, `order.china.*` matches `order.china.beijing`, but does not match `order.china.beijing.created`; `#.client.#` matches `com.rabbitmq.client`.

## What Is AMQP?

RabbitMQ was originally built around AMQP 0-9-1, so concepts like Producers, Exchanges, Queues, Bindings, and Routing Keys all come from the AMQP model. RabbitMQ also supports AMQP 1.0, MQTT, STOMP, and other protocols, though feature details vary across protocols.

In RabbitMQ, Exchanges, Exchange Types, Queues, Bindings, and Routing Keys all follow the corresponding concepts defined in the AMQP protocol.

> Starting in RabbitMQ 4.0, AMQP 1.0 is natively supported and enabled by default, no longer relying on the legacy AMQP 1.0 plugin for protocol translation. AMQP 0-9-1 continues to be supported, and existing Java and Spring AMQP ecosystems still revolve mostly around it. Whether a new project should adopt AMQP 1.0 depends on client library maturity, interoperability needs, and RabbitMQ's actual feature support for AMQP 1.0.

**Within AMQP 0-9-1, distinguish between the AMQ model and protocol layers:**

- **AMQ model**: Defines core entities such as Exchanges, Queues, and Bindings, as well as how messages are routed from Producers to Consumers.
- **Functional Layer**: Defines protocol commands grouped into logical classes such as `exchange`, `queue`, `basic`, and `tx`.
- **Transport Layer**: Handles framing, Channel multiplexing, heartbeats, error handling, and data representation.

**Three major components of the AMQP model:**

- **Exchange**: The component in the message broker that routes messages to Queues.
- **Queue**: The data structure that stores messages, residing on disk or in memory.
- **Binding**: A set of rules telling the Exchange which Queue a message should be delivered to.

## Explain Producer and Consumer

**Producer**:

- The message producer, i.e., the party sending messages.
- A message generally contains two parts: the **message body** (`payload`) and the **message headers** (Labels/Headers).

**Consumer**:

- Consumes messages, i.e., the party receiving messages.
- A Consumer connects to the RabbitMQ server and subscribes to a Queue. Business logic typically processes the message body; routing key, headers, delivery tag, and similar fields are routing or delivery metadata that can be used for logging, idempotency, and acknowledgment handling, rather than being treated as the business payload itself.

## Explain Broker, Queue, and Exchange

- **Broker**: Can be thought of as a RabbitMQ server node. Generally, one Broker corresponds to one RabbitMQ server.
- **Queue**: An internal RabbitMQ object used to store messages. Multiple Consumers can subscribe to the same Queue, in which case messages in the Queue are distributed (round-robin) across those Consumers for processing.
- **Exchange**: Producers send messages to an Exchange, which routes them to one or more Queues. When no route matches, the message is either returned to the Producer or dropped.

## What Is a Dead-Letter Queue? What Causes Dead Letters?

DLX stands for `Dead-Letter-Exchange`. When a message becomes a dead letter (`dead message`) inside a Queue, it can be republished to another Exchange—that Exchange is the DLX, and a Queue bound to the DLX is called a Dead-Letter Queue (DLQ).

**Common causes of dead letters:**

- The message is rejected (`Basic.Reject` or `Basic.Nack`) with `requeue = false`.
- The message's TTL expires.
- The Queue reaches its maximum length limit and messages are evicted/dropped.
- In a Quorum Queue, the message's redelivery count exceeds `delivery-limit`.

## What Is a Delay Queue? How Does RabbitMQ Implement It?

A delay queue holds delayed messages: the message has already been sent to RabbitMQ, but the business wants Consumers to receive it only after a period of time has elapsed.

RabbitMQ does not have a native delay queue out of the box. There are generally two ways to implement delayed messages:

1. **Using TTL + DLX**: Messages first enter a Queue configured with a TTL; once expired, they are routed to a Dead-Letter Exchange and delivered into the actual target consumption Queue. The drawback is susceptibility to head-of-line blocking; additionally, creating a dedicated queue pair for every distinct delay duration drives up maintenance cost.
2. **Using the `rabbitmq-delayed-message-exchange` plugin**: It provides an `x-delayed-message` Exchange type allowing per-message delay configuration. Per the plugin's official README, it is intended for delays measured in seconds, minutes, or hours (up to a day or two); if you need scheduling over days, weeks, or months, or expect backlogs of hundreds of thousands or millions of delayed messages, use external storage and a dedicated scheduling system instead.

In short, delayed messaging in RabbitMQ is not a native feature of ordinary queues; both TTL + DLX and the delay plugin can work, depending on delay scale and recoverability requirements.

## What Is a Priority Queue?

RabbitMQ supports **message priority**—Queues themselves do not have priority tiers relative to each other. A priority queue delivers messages within the same Queue according to message priority, handing higher-priority messages to Consumers earlier.

Classic Queues can be declared as priority queues via the `x-max-priority` argument, and Quorum Queues also support priorities. Note that if consumption speed consistently exceeds production speed and no messages accumulate in the Queue, priority ordering will barely be observable.

## What Working Modes Does RabbitMQ Have?

- Simple mode
- Work Queues mode
- Publish/Subscribe (`pub/sub`) mode
- Routing mode
- Topic mode

## How Does RabbitMQ Transmit Messages?

Because creating and tearing down TCP connections is expensive (three-way handshake, slow start, etc.) and concurrent connection counts are constrained by OS resources, RabbitMQ multiplexes TCP connections using **Channels**. A Channel is a virtual communication path established over a TCP connection.

> Notes:
>
> - A single TCP connection can carry multiple Channels, though the official guideline recommends keeping it under 100–200 Channels per connection.
> - Each Channel has an independent ID, but all Channels share the flow control of the underlying TCP connection.
> - **Channels are not thread-safe**; multiple threads should use separate Channel instances.

## How to Ensure Message Reliability?

![RabbitMQ 4.0 Message Reliability and Queue Architecture Overview](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/rabbitmq/rabbitmq-message-reliability-and-queue-architect-8c876432.png)

Messages can run into trouble at three stages: Producer to Broker, during Broker storage, and Broker to Consumer.

**1. Producer to Broker**

The Producer side normally handles both "whether the Broker received the message" and "whether it was successfully routed to a Queue":

- **Publisher Confirms**: Confirms whether the Broker accepted the message. For persistent messages routed to durable queues, confirmation waits until the message is persisted; for Quorum Queues, confirmation waits until a majority of replicas accept it.

  ```java
  channel.confirmSelect();
  channel.addConfirmListener((sequenceNumber, multiple) -> {
      // Broker has processed the message(s) for this sequence number
  }, (sequenceNumber, multiple) -> {
      // Broker could not handle the message; log and retry per business policy
  });
  ```

- **mandatory + Return Listener**: When a message reaches an Exchange but matches no Queue, the Producer can receive a return callback.

  ```java
  channel.basicPublish("exchange", "routingKey",
      true,  // mandatory=true
      null,
      messageBody);

  channel.addReturnListener((replyCode, replyText, exchange, routingKey, properties, body) -> {
      // Message reached the Exchange, but was not routed to any Queue
      log.error("Message returned: {}", replyText);
  });
  ```

Enabling Confirms alone is not enough. A message that fails routing can still receive a `basic.ack`, because the Broker did process the publish command; whether the message actually entered a business Queue must be guarded by `mandatory` return or an Alternate Exchange.

- **Transaction mechanism** (not recommended): Synchronous and blocking; throughput is typically far worse than Publisher Confirms.
  - Note: Transactions and Publisher Confirms are mutually exclusive and cannot coexist on the same Channel.

**2. During Broker Storage**

- `delivery_mode=2`: Treats the message as persistent.
- `durable=true`: Ensures Queue metadata can be restored after a Broker restart.
- Replicated queues: In RabbitMQ 4.x, mirrored queues have been removed; when replication is needed, consider Quorum Queues or Streams.

Simply enabling persistence does not guarantee zero message loss. The Producer must still wait for Publisher Confirms, and the Consumer must use manual Ack; otherwise Broker crashes, dropped connections, or processing failures can still cause data loss or duplicate consumption.

**3. Broker to Consumer**

- **Manual Ack**: `basicAck(deliveryTag, multiple)`—only acknowledge after business processing succeeds.
- **Retry mechanism**: When consumption fails, call `basicNack` or `basicReject`, and decide whether to `requeue` based on the exception type.
- **Dead-Letter Queue**: Route messages to a DLQ after exceeding maximum retries or being rejected, followed by alerting, compensation, or manual intervention.
- **Idempotency guarantee**: Implemented at the business layer to prevent data inconsistency from duplicate consumption. For specific idempotency implementation approaches, refer to: [API Idempotency Solutions Summary](https://javaguide.cn/high-availability/idempotency.html).

> Note: An Alternate Exchange can also handle routing failures. Once configured, unroutable messages are forwarded to the Alternate Exchange; only if the Alternate Exchange also cannot route the message and `mandatory` is set will the Producer receive a return.

## How to Ensure Message Ordering in RabbitMQ?

RabbitMQ's FIFO ordering holds only within a single Queue and is further affected by the number of Consumers, `prefetch`, retries, and requeuing. There are three common approaches:

**1. Single-Consumer mode**: Bind only one Consumer to a Queue. This makes ordering easiest to preserve, though throughput can quickly become a bottleneck.

**2. Partitioned ordering**: Hash messages by a business key (such as Order ID) into different Queues, each handled by an independent Consumer. Messages with the same business key always land in the same Queue, preserving local ordering while increasing throughput.

Partitioning has two pitfalls: scaling Queues up or down changes the hash mapping, causing old and new messages for the same business key to land in different Queues; additionally, requeuing on failure can alter subsequent delivery order. For strict ordering requirements, maintain a state machine, version number, or unique constraint in the database rather than relying solely on MQ delivery order.

**3. In-consumer local queuing**: A single Consumer pulls messages and dispatches them by business key into local in-memory queues and worker threads. This approach requires you to handle in-memory backlogs, data loss on process crash, Ack timing, and backpressure yourself—use with caution in production.

## How to Ensure High Availability in RabbitMQ?

RabbitMQ high availability should be viewed in two layers: a cluster only allows multiple nodes to jointly manage metadata and connections; whether messages inside a Queue are replicated depends on the Queue type.

In RabbitMQ 4.x, Classic Queues are non-replicated queues; mirrored queues have been removed; replicated data structures are primarily Quorum Queues and Streams. You will only encounter mirrored queue maintenance issues on legacy 3.x clusters.

Network partitions must also be handled separately. Ordinary clusters and legacy mirrored queues can both suffer from network flaps; a common policy is setting `cluster_partition_handling = pause_minority`, pausing minority-side nodes so both sides do not keep accepting writes independently. Quorum Queues use Raft, giving clearer consistency semantics, though they still require a majority of replicas to be available—do not assume they can keep serving through every arbitrary network failure.

**Standalone Mode**

Demo-grade only—typically launched locally for testing and experimentation; nobody runs standalone mode in production.

**Ordinary Cluster Mode**

Multiple RabbitMQ instances are started across multiple machines (one per machine). A Queue you declare resides physically on only one RabbitMQ instance, while every instance synchronizes Queue metadata (configuration information allowing any node to locate the instance hosting that Queue).

When consuming, if a client connects to a different instance, that instance fetches the data over from the instance hosting the Queue. This setup mainly improves throughput by letting multiple nodes in the cluster serve read/write operations for Queues.

**Mirrored Cluster Mode** (Classic Queue Mirroring, Removed)

Mirrored queues were removed in RabbitMQ 4.0. RabbitMQ 3.8 introduced Quorum Queues as the replacement, and while 3.13 still supported mirrored queues, they were already deprecated. Do not choose mirrored queues for new projects.

This mode was the high-availability solution in earlier RabbitMQ versions. Unlike ordinary cluster mode, in mirrored cluster mode both metadata and messages inside a declared Queue exist across multiple instances—each participating RabbitMQ node maintains a full mirror containing all data of that Queue. Every write to the Queue is automatically synchronized to the Queue replicas on those instances.

Roughly how it worked:

- The Queue leader/master node receives messages and synchronizes them to `N` mirror nodes.
- If the primary node goes down, the oldest mirror node is promoted to primary.
- Policies configured via the management console specify synchronizing data to all nodes or a designated number of nodes.

Pros:

- If any node crashes, other nodes retain the complete data of that Queue.
- Consumers can fail over to other nodes and continue consuming.

Cons:

- High performance overhead because messages must be synchronized across all nodes.
- Heavy network bandwidth pressure and consumption.
- Not a true distributed consensus architecture—it is primary-mirror replication.

**Quorum Queue** (3.8+)

A Quorum Queue is a replicated Queue based on the Raft protocol, suitable for long-lived queues with high data-safety requirements:

- **Raft-based**: Achieves consistency via log replication and leader election.
- **Quorum writes**: Requires a majority of nodes (`N/2 + 1`) to confirm before a write succeeds.
- **Clearer replication semantics**: Handles leader failures and network partitions much more cleanly than mirrored queues.
- **Suitable scenarios**: Critical business pipelines that cannot afford message loss, such as orders, payments, and inventory deduction.

Quorum Queues are not suitable for every scenario. For temporary queues, high-frequency queue creation/deletion, ultra-low latency, massive long-term backlogs (especially over millions of messages), or large-scale fanout, evaluate Classic Queues or Streams first. The official documentation also recommends running upgrade and failover drills regardless of queue count.

**Client-side declaration:**

Java:

```java
Map<String, Object> args = new HashMap<>();
args.put("x-queue-type", "quorum");
channel.queueDeclare("my-queue", true, false, false, args);
```

Python:

```python
channel.queue_declare(
    queue='my-queue',
    durable=True,
    arguments={'x-queue-type': 'quorum'}
)
```

> `x-queue-type` must be provided at queue declaration time and cannot be changed afterward via Policy. Once a queue's type is set, an existing Classic Queue cannot be converted in-place to a Quorum Queue.

## How to Handle Message Queue Delays and Expiration Issues?

RabbitMQ allows configuring a message Time-To-Live (TTL). If a message stays in a Queue longer than its TTL, it expires; if a DLX is configured, it is routed to the Dead-Letter Exchange, otherwise it is discarded.

If the data can be recovered from a source of truth such as a database, you can use batch re-import for compensation:

1. During peak traffic, drop messages that cannot be processed in time to preserve system availability.
2. During off-peak hours, run a temporary job to query the missing records from the database.
3. Re-publish the queried data to the MQ so Consumers can process it as compensation.

**Example scenario:**

- Suppose 10,000 orders are backed up in the MQ awaiting processing.
- 1,000 of those orders expire due to TTL and are discarded.
- Solution: Query those 1,000 orders from the database and re-publish them to the MQ for compensation.

This approach comes with prerequisites: complete historical data must exist in the database, compensation consumption must be idempotent, and message backlogs must have monitoring and alerts. Otherwise, a temporary compensation script can easily replay duplicate or dirty data.

## What Metrics Should Be Monitored in Production?

**1. Memory Watermark**

- Monitor the `rabbitmq_memory_limit` usage ratio.
- Alert threshold: Default high watermark is `0.4` (40%).
- Impact: Once the high watermark is reached, RabbitMQ blocks publishing connections, causing Producer writes to slow down or stall completely.
- Recommended configuration:

  ```ini
  vm_memory_high_watermark.relative = 0.4
  vm_memory_high_watermark_paging_ratio = 0.5
  ```

**2. File Descriptor Consumption**

- Monitor File Descriptors utilization.
- During connection spikes, exhausting file descriptors causes new connections to fail and can severely impact node stability.
- In high-connection environments, raise OS limits ahead of time, e.g., `ulimit -n 100000`.

**3. Channel Creation and Destruction Rate**

- Monitor the rate at which Channels are created and destroyed.
- High-frequency Channel creation and teardown incurs extra CPU and Erlang process overhead.
- Channels should be reused, though you should not pile an unlimited number onto a single connection—typically keep them within a few dozen up to 100–200 per connection.

**4. Message Backlog Depth**

- Monitor Queue message counts and Consumer Lag.
- Alert threshold: Define based on business needs (e.g., > 10,000 messages).
- Tools: RabbitMQ Management UI, Prometheus + Grafana.

**5. Disk Space and I/O**

- Monitor free disk space and IOPS.
- Alert threshold: Trigger an alert when remaining disk space falls below 20%.
- Quorum Queues impose higher disk I/O demands; NVMe SSDs are recommended.

## What Are Common Pitfalls When Using RabbitMQ?

**Pitfall 1: Using Quorum Queues for every queue**

Quorum Queues replicate messages across multiple replicas and confirm writes under Raft semantics. They are well suited for high-reliability queues, but poorly suited for temporary queues, ultra-low latency, large numbers of short-lived queues, massive backlogs, and large-scale fanout. When throughput is the priority, evaluate non-replicated Classic Queues or Streams; when reliability is the priority, use Quorum Queues.

**Pitfall 2: Thinking a larger `Prefetch Count` is always better**

When `prefetch` is too large, a Consumer fetches a huge batch of messages upfront. The server-side Queue appears to have no backlog, yet messages sit stuck in `Unacked` state locally on that Consumer—other Consumers cannot pick them up, and the client's memory may even be exhausted.

Start with a conservative value, then tune via load testing based on processing time and throughput:

```java
channel.basicQos(20);
```

**Pitfall 3: Using the delay queue plugin as a scheduled task system**

`rabbitmq-delayed-message-exchange` is suitable for short-term delays, not long-term job scheduling or accumulating hundreds of thousands to millions of delayed messages. For large-scale delayed tasks, store scheduling state in a database, Redis, a timing wheel, or a dedicated scheduler, and publish to MQ only when the trigger time arrives.

**Pitfall 4: Assuming network partitions won't happen in our environment**

Cross-DC deployments, cross-AZ deployments, or switch flaps can all trigger network partitions. Ordinary clusters and legacy mirrored queues require configuring a partition recovery policy; when replicated queues are needed, evaluate Quorum Queues first, while also ensuring a majority of replicas sit across a reliable Availability Zone topology.

**Pitfall 5: Skipping Publisher Confirms after enabling transactions**

The transaction mechanism is synchronous and blocking, and official documentation explicitly notes that it significantly degrades throughput. On the Producer side, normally prefer Publisher Confirms paired with `mandatory` return or an Alternate Exchange to handle routing failures.
