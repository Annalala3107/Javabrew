---
title: "Message Queue Fundamentals Summary"
description: "A systematic summary of core message queue knowledge, covering use cases (asynchronous processing, decoupling, peak shaving), messaging models (Point-to-Point and Publish/Subscribe), preventing message loss, message idempotency, message ordering, handling message backlogs, and a technology selection comparison among Kafka, RocketMQ, and RabbitMQ."
category: High Performance
tag:
  - Message Queue
head:
  - - meta
    - name: keywords
      content: Message Queue,MQ,Async Decoupling,Peak Shaving,Message Loss,Message Idempotency,Message Ordering,Kafka,RocketMQ,RabbitMQ
lang: en
sourceRef: zh-ref/high-performance/message-queue/message-queue.md
---

::: tip

The message queues discussed in this article mainly refer to distributed message queues.

:::

"RabbitMQ?" "Kafka?" "RocketMQ?" ... In daily study and development, we frequently hear the term message queue. I have also mentioned this concept in many of my articles. You might be a seasoned developer who uses message queues proficiently, or a beginner who knows nothing about them yet. Regardless of how familiar you are with message queues, this article will help you thoroughly understand their fundamental theory.

If you are already experienced, you may pick up important concepts about message queues that you had previously overlooked. If you are a newcomer, I believe this article will serve as a solid stepping stone into the world of message queues.

## What Is a Message Queue?

You can think of a message queue as a container for storing messages. When we need to use a message, we simply take it out of the container for our own use. Because a Queue is a first-in, first-out (FIFO) data structure, messages are also consumed in order.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-small-dbd417cd.png)

The two parties involved in message delivery are called the **Producer** and the **Consumer**; the producer is responsible for sending messages, and the consumer is responsible for processing messages.

![Publish/Subscribe (Pub/Sub) Model](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-pub-sub-model-664193cf.png)

In operating systems, one very important mechanism for inter-process communication (IPC) is the message queue. What we are talking about here is slightly different: it mainly refers to communication between services as well as between components/modules inside a system, and belongs to a category of software known as **Middleware**.

Wikipedia describes middleware as follows:

> Middleware is a type of computer software that provides services to software applications beyond those available from the operating system, connecting system software and application software to facilitate communication between different software components. Application software can leverage middleware to share information and resources across different technical architectures. Middleware sits on top of the operating system in client-server architectures and manages computing resources and network communication.

Put simply: **Middleware is software that serves application software, whereas application software serves end users—end users do not directly interact with or use middleware.**

Beyond message queues, common middleware includes RPC frameworks, distributed components, HTTP servers, task scheduling frameworks, configuration centers, database sharding tools, and data migration tools.

For a relatively detailed introduction to middleware, you can refer to an answer from Alibaba's Taobao technology team: <https://www.zhihu.com/question/19730582/answer/1663627873>.

With the rise of distributed systems and microservices, message queues have gained far greater scope in system design. Using message queues reduces system coupling, enables asynchronous task execution, and performs effective traffic peak shaving, making them one of the most important components in distributed and microservice architectures.

## What Is a Message Queue Used For?

Generally speaking, using a message queue brings three main benefits to our systems:

1. Asynchronous processing
2. Peak shaving / rate limiting
3. Reducing system coupling

In addition to these three, message queues have other use cases such as implementing distributed transactions, ordering guarantees, and data stream processing.

If an interviewer asks you this question during an interview, it is usually because your resume mentions message queues. In that case, it is best to answer in the context of your own project.

### Asynchronous Processing

![Improving System Performance via Asynchronous Processing](/media/jg/ext/oss.javaguide.cn/github/javaguide/Asynchronous-message-queue-99767c5f.png)

Time-consuming operations included in a user request can be processed asynchronously through a message queue. Once the corresponding message is sent to the message queue, the result is returned immediately, reducing response time and improving user experience. Afterward, the system consumes and processes the message.

Because the system returns a response to the user right after writing the request data to the message queue, the request data might still fail during subsequent business validation, database writes, and other operations. Therefore, **after adopting a message queue for asynchronous processing, you must adjust your business workflow accordingly**. For example, after a user submits an order and the order data is written to the message queue, you cannot immediately return a response telling the user that the order succeeded. Instead, only after the order consumer process genuinely finishes processing the order—or even after shipment—should the system notify the user of order success via email or SMS, avoiding transaction disputes. This is similar to how we book train tickets or movie tickets on our phones in daily life.

### Peak Shaving / Rate Limiting

**First store transaction messages generated by short bursts of high concurrency in the message queue, and then let backend services slowly consume those messages according to their own processing capacity, thereby preventing sudden spikes from crashing the backend services directly.**

For example, in e-commerce flash sales and promotional campaigns, proper use of a message queue can effectively absorb the impact of a massive influx of orders at the start of a promotion. As shown in the diagram below:

![Peak Shaving](/media/jg/ext/oss.javaguide.cn/github/javaguide/.png-f7ce8315.png)

### Reducing System Coupling

Using a message queue also reduces system coupling. When modules do not directly invoke one another, adding new modules or modifying existing ones has minimal impact on other modules, which undoubtedly improves system extensibility.

The producer (client) sends messages to the message queue, and the consumer (server) processes them. Any system that needs to consume the data simply pulls messages from the message queue without coupling directly to other systems, which clearly improves system scalability and extensibility as well.

![Publish/Subscribe (Pub/Sub) Model](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-pub-sub-model-664193cf.png)

**The message queue operates using the Publish-Subscribe pattern: a message sender (producer) publishes messages, and one or more message receivers (consumers) subscribe to those messages.** As seen in the diagram above, **there is no direct coupling between the message sender (producer) and the message receivers (consumers)**. Once the sender pushes the message to the distributed message queue, its processing of that message ends. After retrieving the message from the distributed message queue, each receiver performs subsequent processing without needing to know where the message came from. **For new business features, as long as they are interested in that type of message, they can simply subscribe to it without affecting existing systems or business logic, thereby achieving extensible website architecture.**

For example, our e-commerce platform is divided into multiple services such as User, Order, Finance, Warehouse, Notification, Logistics, and Risk Control. After a user places an order, the system needs to invoke Finance (payment deduction), Warehouse (inventory management), Logistics (shipping), Notification (shipping notification), and Risk Control (risk assessment). With a message queue, placing the order is decoupled from subsequent operations such as payment deduction, shipping, and notifications. Upon order completion, a message is sent to the message queue, and whichever services need it simply subscribe to and consume that message.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-decouple-mall-example-722dfe40.png)

In addition, to prevent message loss if a message queue server goes down, messages successfully sent to the message queue can be stored on the producer server and deleted only after they are genuinely processed by the consumer server. If a message queue server crashes, the producer server can choose another server in the distributed message queue cluster to publish messages.

**Note:** Do not assume that message queues can only work in Publish-Subscribe mode; it is simply that in the specific context of decoupling, the Publish-Subscribe pattern is used. Besides Publish-Subscribe, there is also the Point-to-Point pattern (where a message has only one consumer), though Publish-Subscribe is more commonly used. Furthermore, these two messaging models are defined by JMS, while the AMQP protocol provides five other messaging models.

### Implementing Distributed Transactions

One solution for distributed transactions is MQ transactions.

RocketMQ, Kafka, Pulsar, and QMQ all provide transaction-related features. Transactions allow event-streaming applications to define the entire process of consuming, processing, and producing messages as a single atomic operation.

For a detailed introduction, see [Distributed Transactions Explained (Paid)](https://javaguide.cn/distributed-system/distributed-transaction.html).

![Distributed Transactions Explained - MQ Transactions](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/07b338324a7d8894b8aef4b659b76d92-c2aa0805.png)

### Ordering Guarantees

In many application scenarios, the order in which data is processed is critical. Message queues guarantee that data is processed in a specific order, making them suitable for scenarios with strict ordering requirements. Most message queues, such as RocketMQ, RabbitMQ, Pulsar, and Kafka, support ordered messages.

### Delayed / Scheduled Processing

A message is not consumed immediately after being sent; instead, a time or delay is specified, and it is consumed only when that time arrives. Most message queues, such as RocketMQ, RabbitMQ, and Pulsar, support scheduled/delayed messages.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/rocketmq-schedule-message-03057332.png)

### Instant Messaging

MQTT (Message Queuing Telemetry Transport) is a lightweight communication protocol based on the Publish/Subscribe model, making it ideal for IoT and other applications operating under low bandwidth, high latency, or unreliable network conditions. It supports instant message delivery and maintains communication stability even when network conditions are poor.

RabbitMQ includes a built-in MQTT plugin for implementing MQTT functionality (disabled by default; must be enabled manually).

### Data Stream Processing

For massive data streams generated by distributed systems—such as business logs, monitoring metrics, and user behavior—message queues can collect the data in real time or in batches and feed it into big data processing engines for efficient stream management and processing.

## What Problems Does Using a Message Queue Introduce?

- **Reduced system availability:** System availability decreases to some extent. Why? Before introducing an MQ, you didn't have to worry about message loss or the MQ going down; after introducing an MQ, you now have to account for all of those scenarios!
- **Increased system complexity:** Once you add an MQ, you must ensure messages are not consumed multiple times, handle message loss scenarios, guarantee message delivery ordering, and more!
- **Consistency issues:** As mentioned above, message queues enable asynchronous processing, which indeed improves system response times. However, what if the actual consumer fails to consume a message properly? That leads to data inconsistency!

To decide whether a call chain is suitable for introducing an MQ, consider the following questions:

- Does the caller need the downstream processing result immediately? If so, RPC is likely more appropriate.
- Can the business tolerate eventual consistency? If not, going asynchronous will incur significant compensation overhead.
- Does peak traffic significantly exceed downstream processing capacity? If so, an MQ can provide buffering and peak shaving.
- Does downstream failure require retries, compensation, and manual intervention? If so, an MQ can establish a durable recovery pipeline.
- Does the team have the operational, monitoring, and incident-handling capabilities to run an MQ? If not, the added complexity may outweigh the benefits.

Put simply, an MQ is suited for scenarios that "can finish a bit later, but must not lose data, must be recoverable, and need decoupling." You should never blindly convert every synchronous call chain to asynchronous.

## How to Ensure Message Reliability?

Message reliability should be broken down by each stage of the pipeline rather than just saying "enable persistence":

1. **Producer sending stage**: Enable send confirmations and retry on failure; for core business flows, persist a local outbox/message table or use transactional messages to avoid situations where the local transaction succeeds but the message is never sent.
2. **Broker storage stage**: Persist messages to disk, configure replication or high-availability queues for critical Topics/queues, and align disk flushing (`flush`) and replica acknowledgment policies with business reliability requirements.
3. **Consumer processing stage**: Only send ACK or commit the offset after business processing succeeds; on failure, retry, route to a Dead-Letter Queue (DLQ), or trigger a compensation workflow.
4. **Business fallback stage**: Use reconciliation jobs, compensation jobs, alerts, and manual intervention to catch extreme anomalies.

Different MQs vary in implementation details, but the underlying principle is identical: **confirmation, persistence, retry, idempotency, and compensation**.

## How to Handle Duplicate Consumption and Idempotency?

In production environments, it is usually very difficult to guarantee that a message is consumed strictly once. The more common delivery semantic is "at-least-once delivery," meaning messages may arrive multiple times and consumers must be idempotent.

Common idempotency solutions:

- **Unique index**: Use a business unique key such as order ID, payment ID, or message ID to prevent duplicate inserts.
- **State machine**: Only allow state transitions in valid directions—for example, an order can only transition from "Paid" to "Shipped."
- **Consumption record table**: Record the processing status of messages and skip duplicates directly.
- **Redis deduplication**: Suitable for deduplication within a short time window, though you must watch out for expiration time and persistence risks.

The key to idempotency is using a **business unique key** rather than relying on the message ID auto-generated by the MQ, because the same business event may receive different message IDs during retries, compensation, or re-sends.

## How to Handle Message Backlogs?

When a message backlog builds up, diagnose the root cause first before deciding whether to scale out:

- **Producer spike**: Promotions, major sales events, web crawlers, or upstream anomalies cause write throughput to surge.
- **Slow consumers**: Slow SQL queries, slow external APIs, lock contention, undersized thread pools, or overly small batch sizes.
- **Insufficient partitions or queues**: Even after adding consumer instances, messages in a single queue/partition can only be processed concurrently by a limited number of consumers.
- **Broker issues**: Disk, network, Controller/NameServer, or cluster replication problems.

The typical handling sequence is: first stop the bleeding and apply rate limiting, then scale out consumers and partitions, next pinpoint and optimize slow consumption logic, and finally run temporary batch processing or replay for the historical backlog. Never jump straight to "add more consumers"—if there aren't enough queues/partitions or the consumption logic is serialized, adding instances will not increase throughput.

## JMS and AMQP

### What Is JMS?

JMS (Java Message Service) is Java's messaging service API through which JMS clients can perform asynchronous message transmission via a JMS provider. **The JMS (Java Message Service) API is a standard or specification for messaging services**, allowing application components built on the Java EE platform to create, send, receive, and read messages. It makes distributed communication more loosely coupled, reliable, and asynchronous.

JMS defines five different message body formats and message types, allowing you to send and receive data in various forms:

- `StreamMessage`: A stream of Java primitive values
- `MapMessage`: A set of name-value pairs
- `TextMessage`: A String object
- `ObjectMessage`: A serialized Java object
- `BytesMessage`: A stream of uninterpreted bytes

**ActiveMQ (now obsolete) was implemented based on the JMS specification.**

### Two JMS Messaging Models

#### Point-to-Point (P2P) Model

![Queue Model](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-queue-model-a1a548ee.png)

Uses a **Queue** as the communication carrier; satisfies the **Producer-Consumer pattern**, where a single message can only be consumed by one consumer. Unconsumed messages remain in the queue until they are consumed or expire. For example, if a producer sends 100 messages and two consumers read from the queue, under normal circumstances the two consumers will consume them in order, each handling roughly half (taking turns one by one).

#### Publish/Subscribe (Pub/Sub) Model

![Publish/Subscribe (Pub/Sub) Model](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/message-queue-pub-sub-model-664193cf.png)

The Publish/Subscribe (Pub/Sub) model uses a **Topic** as the communication carrier, similar to a **broadcast mode**; a publisher publishes a message, and that message is delivered through the topic to all subscribers.

### What Is AMQP?

AMQP stands for Advanced Message Queuing Protocol—an application-layer standard providing unified messaging services (**a binary application-layer protocol**). It is an open standard designed for message-oriented middleware and is compatible with JMS. Clients and message brokers built on this protocol can exchange messages without being restricted by using the same vendor product or the same programming language.

**RabbitMQ is implemented based on the AMQP protocol.**

### JMS vs AMQP

| Comparison Aspect | JMS | AMQP |
| :---: | :--- | :--- |
| Definition | Java API | Protocol |
| Cross-language | No | Yes |
| Cross-platform | No | Yes |
| Supported Message Models | Provides two message models: 1) Peer-2-Peer; 2) Pub/Sub | Provides five message models: 1) direct exchange; 2) fanout exchange; 3) topic exchange; 4) headers exchange; 5) system exchange. Essentially, the latter four do not differ much from JMS's pub/sub model, merely offering finer-grained routing mechanisms |
| Supported Message Types | Supports multiple message types, as mentioned above | `byte[]` (binary) |

**Summary:**

- AMQP defines a wire-level protocol for messages, whereas JMS defines an API specification. Within the Java ecosystem, multiple clients can interact via JMS without modifying application code, but its cross-platform support is poor. AMQP is inherently cross-platform and cross-language.
- JMS supports rich message types such as `TextMessage` and `MapMessage`, whereas AMQP only supports `byte[]` payloads (complex types can be serialized before sending).
- Thanks to routing algorithms provided by Exchanges, AMQP supports diverse routing strategies to deliver messages to queues, whereas JMS only supports Queue and Topic/Subscription models.

## Differences Between RPC and Message Queues

Both RPC and message queues are vital components in distributed microservice systems. Below is a brief comparison between the two:

- **By purpose**: RPC primarily solves remote communication between two services without requiring knowledge of low-level network communication details. Through RPC, we can invoke a service method on a remote machine just as easily as calling a local method. Message queues are primarily used to reduce system coupling, enable asynchronous tasks, and perform effective traffic peak shaving.
- **By communication style**: RPC is direct bidirectional network communication, whereas a message queue is unidirectional network communication routed through an intermediary carrier.
- **By architecture**: A message queue must persist/store messages, whereas RPC has no such requirement because, as stated above, RPC is direct bidirectional network communication.
- **By request processing timeliness**: Calls issued via RPC are typically processed immediately, whereas messages placed in a message queue are not necessarily processed right away.

RPC and message queues are fundamentally two different implementation mechanisms for network communication with distinct purposes and must never be conflated.

## Distributed Message Queue Technology Selection

### What Are the Common Message Queues?

#### Kafka

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/kafka-logo-93ada41c.png)

Kafka is a distributed event-streaming platform open-sourced by LinkedIn and now an Apache Top-Level Project. Initially built to process massive volumes of logs, it gradually evolved into a full-featured, high-performance message queue.

A streaming platform has three key capabilities:

1. **Message queue**: Publishing and subscribing to streams of records, similar to a message queue—which is also why Kafka is categorized as a message queue.
2. **Fault-tolerant durable storage of record streams**: Kafka persists messages to disk, effectively preventing the risk of message loss.
3. **Stream processing**: Processing streams of records as they are published; Kafka provides a complete stream-processing library.

Kafka is a distributed system composed of servers and clients communicating over a high-performance TCP network protocol. It can be deployed on bare-metal hardware, virtual machines, and containers in both on-premises and cloud environments.

Before Kafka 2.8, Kafka was widely criticized for its heavy reliance on ZooKeeper for metadata management and cluster high availability. Starting with Kafka 2.8, KRaft mode (based on the Raft protocol) was introduced to remove the dependency on ZooKeeper, greatly simplifying Kafka's architecture and allowing a much more lightweight deployment.

However, note one caveat: migrating legacy clusters from ZooKeeper mode to KRaft mode requires following the official migration procedure rather than simply editing configuration files and restarting. For new clusters, it is recommended to deploy using the officially recommended mode.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/kafka3.3.1-kraft-production-ready-6ca66de2.png)

Kafka official website: <http://kafka.apache.org/>

Kafka release history (directly shows whether the project is still actively maintained): <https://kafka.apache.org/downloads>

#### RocketMQ

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/rocketmq-logo-7cef8492.png)

RocketMQ is a cloud-native real-time data processing platform for "messages, events, and streams" open-sourced by Alibaba. Inspired by Kafka, it has become an Apache Top-Level Project.

Core features of RocketMQ (excerpted from the RocketMQ official website):

- Cloud-native: Born in and built for the cloud, with elastic scaling and Kubernetes friendliness.
- High throughput: Guarantees trillion-level throughput, meeting both microservice and big data needs.
- Stream processing: Provides a lightweight, highly extensible, high-performance, feature-rich stream computing engine.
- Financial-grade: Financial-grade stability, widely used in core transaction pipelines.
- Minimalist architecture: Zero external dependencies, Shared-nothing architecture.
- Ecosystem-friendly: Seamlessly integrates with microservices, real-time computing, data lakes, and surrounding ecosystems.

According to the official website:

> Since its inception, Apache RocketMQ has been widely adopted by enterprise developers and cloud vendors due to its simple architecture, rich business features, and strong extensibility. Proven across more than a decade of massive-scale production workloads, RocketMQ has become an industry consensus choice for financial-grade reliable business messaging, widely used across internet, big data, mobile internet, IoT, and many other scenarios.

RocketMQ official website: <https://rocketmq.apache.org/> (Very detailed documentation—highly recommended)

RocketMQ release history (directly shows whether the project is still actively maintained): <https://github.com/apache/rocketmq/releases>

#### RabbitMQ

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/rabbitmq-logo-dd5d3861.png)

RabbitMQ is a message middleware implemented in Erlang that implements AMQP (Advanced Message Queuing Protocol). It originally emerged in financial systems for storing and forwarding messages across distributed systems.

Today, RabbitMQ has gained widespread recognition thanks to its outstanding usability, extensibility, reliability, and high availability. Its specific features can be summarized as follows:

- **Reliability:** RabbitMQ uses mechanisms such as persistence, delivery acknowledgments, and publisher confirms to guarantee message reliability.
- **Flexible routing:** Before messages enter a queue, they are routed through an Exchange. RabbitMQ provides built-in exchanges for typical routing needs. For more complex routing, multiple exchanges can be bound together, or custom exchanges can be implemented via plugins. We will cover this in detail later when introducing RabbitMQ's core concepts.
- **Scalability:** Multiple RabbitMQ nodes can form a cluster, and nodes in the cluster can be dynamically scaled according to actual business requirements.
- **High availability:** In RabbitMQ 4.x, Classic Queues no longer achieve high availability via mirrored queues; for high-reliability scenarios, prefer Quorum Queues or Streams.
- **Multi-protocol support:** Besides native AMQP support, RabbitMQ supports multiple messaging protocols such as STOMP and MQTT.
- **Multi-language clients:** RabbitMQ supports almost all popular languages, including Java, Python, Ruby, PHP, C#, and JavaScript.
- **Easy-to-use management UI:** RabbitMQ ships with an intuitive user interface for monitoring and managing messages, cluster nodes, and more. When installing RabbitMQ, the management UI comes built in.
- **Plugin mechanism:** RabbitMQ offers numerous plugins to extend functionality in various ways, and you can also write your own plugins—somewhat similar to Dubbo's SPI mechanism.

RabbitMQ official website: <https://www.rabbitmq.com/>.

RabbitMQ release history (directly shows whether the project is still actively maintained): <https://www.rabbitmq.com/news.html>

#### Pulsar

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/message-queue/pulsar-logo-3469f9d4.png)

Pulsar is a next-generation cloud-native distributed messaging and streaming platform, originally developed by Yahoo and now an Apache Top-Level Project.

Pulsar unifies messaging, storage, and lightweight functional computing, adopting a decoupled compute-and-storage architecture. It supports multi-tenancy, persistent storage, and cross-region geo-replication, offering strong consistency, high throughput, low latency, and high scalability, and is regarded as an ideal solution for real-time streaming transmission, storage, and computation in the cloud-native era.

Key features of Pulsar (excerpted from the official website):

- A next-generation cloud-native distributed messaging and streaming platform.
- Native support for multiple clusters within a single Pulsar instance, enabling seamless geo-replication across data centers.
- Extremely low publish latency and end-to-end latency.
- Seamlessly scales to over one million topics.
- Simple client APIs supporting Java, Go, Python, and C++.
- Multiple subscription modes for topics (Exclusive, Shared, and Failover).
- Guaranteed message delivery backed by persistent message storage via Apache BookKeeper.
- Stream-native data processing via the lightweight serverless compute framework Pulsar Functions.
- Serverless connector framework Pulsar IO built on Pulsar Functions, making it easy to move data in and out of Apache Pulsar.
- Tiered storage that offloads older data from hot storage to cold/long-term storage (such as S3 or GCS).

Pulsar official website: <https://pulsar.apache.org/>

Pulsar release history (directly shows whether the project is still actively maintained): <https://github.com/apache/pulsar/releases>

#### ActiveMQ

Now obsolete; not recommended for production use or further study.

### How to Choose?

> Reference: *Java Engineer Interview Sprint Season 1* by Instructor Zhonghua Shishan

| Comparison Aspect | Overview |
| --- | --- |
| Throughput | ActiveMQ and RabbitMQ at the tens-of-thousands level (ActiveMQ has the worst performance) are an order of magnitude lower in throughput than RocketMQ and Kafka at the hundreds-of-thousands or millions level. |
| Availability | All can achieve high availability. ActiveMQ and RabbitMQ achieve high availability via primary-replica (master-slave) architectures. RocketMQ uses a distributed architecture. Kafka is also distributed, with multiple replicas per piece of data so that a few machine failures do not lose data or cause unavailability. |
| Timeliness (Latency) | RabbitMQ is developed in Erlang, giving it very strong concurrency and performance with ultra-low latency down to the microsecond level, while the others are at the millisecond (ms) level. |
| Feature Support | Pulsar has more comprehensive features, supporting multi-tenancy, multiple consumption modes, and various persistence modes, positioning it as a next-generation cloud-native distributed messaging and streaming platform. |
| Message Loss | ActiveMQ and RabbitMQ have a very low probability of message loss, while Kafka, RocketMQ, and Pulsar can theoretically achieve zero message loss. |

**Summary:**

- ActiveMQ has a relatively mature community, but by today's standards its performance is poor and its release cadence is very slow. It is not recommended and is already obsolete.
- Although RabbitMQ trails slightly behind Kafka, RocketMQ, and Pulsar in raw throughput, its Erlang foundation gives it strong concurrency, excellent performance, and microsecond-level latency. However, precisely because RabbitMQ is built on Erlang, very few companies have the capability to study or customize its source code at the Erlang level. If your business scenario does not demand extreme concurrency (hundreds of thousands or millions of messages/sec), RabbitMQ may well be your top choice among these message queues.
- RocketMQ and Pulsar support strong consistency and can be used in scenarios with strict message consistency requirements.
- Built by Alibaba as a Java-ecosystem open-source project, RocketMQ allows us to read its source code directly and customize an internal MQ for our company, backed by real-world battle testing in Alibaba's production business scenarios.
- Kafka's distinguishing trait is clear: it offers a relatively focused core feature set, yet delivers ultra-high throughput, millisecond-level latency, extremely high availability and reliability, and virtually limitless horizontal scalability. At the same time, Kafka works best with a relatively modest number of topics to preserve its massive throughput. Kafka's one notable trade-off is the possibility of duplicate consumption, which has a negligible impact on data accuracy in big data analytics and log collection. These characteristics make it naturally suited for real-time big data computing and log aggregation. For real-time big data pipelines and log collection, Kafka is the undisputed industry standard with a vibrant community—it isn't going anywhere and is effectively the global de facto standard in this domain.

When choosing a solution, you can make the decision even more straightforward:

| Scenario | More Common Choice | Key Focus Areas |
| --- | --- | --- |
| Logs, tracking events, stream processing | Kafka, Pulsar | Throughput, partition scaling, ecosystem |
| Transactions, orders, business events | RocketMQ | Transactional messages, delayed messages, ordered messages |
| Flexible routing, simple integration | RabbitMQ | Exchange routing, acknowledgment mechanisms, queue types |
| In-process high-performance event pipeline | Disruptor | Low latency, lock-free, non-distributed |

There is no single "best" MQ—only the MQ that best fits your current team, business semantics, and operational capabilities.

## References

- *Large-Scale Website Technical Architecture*
- KRaft: Apache Kafka Without ZooKeeper: <https://developer.confluent.io/learn/kraft/>
- What Are the Use Cases of Message Queues?: <https://mp.weixin.qq.com/s/4V1jI6RylJr7Jr9JsQe73A>
