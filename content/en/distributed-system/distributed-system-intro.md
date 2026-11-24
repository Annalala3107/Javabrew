---
title: "Distributed Systems Explained: Core Concepts, Architectural Evolution, Key Characteristics, and Learning Roadmap"
description: "Comprehensive introduction to distributed systems covering what a distributed system is, why distributed systems are needed, the evolution from monolith to distributed architecture, typical characteristics, common system types, core challenges, and a learning roadmap."
category: Distributed Systems
tag:
  - Distributed Systems
  - System Design
head:
  - - meta
    - name: keywords
      content: Distributed Systems,What Is a Distributed System,Distributed Architecture,Microservices,Cluster,Remote Invocation,Distributed Consistency,Data Sharding,Replication,Distributed Systems Learning Roadmap
lang: en
sourceRef: zh-ref/distributed-system/distributed-system-intro.md
---

When first encountering distributed systems, many people get hit by a wall of buzzwords: CAP, BASE, Paxos, Raft, distributed locks, distributed transactions.

None of these concepts can be skipped, yet diving straight into them at the beginning easily turns distributed systems into a pile of disconnected terminology. A better entry point is a much simpler, more practical question: Why would something that originally worked on one machine, in one process, with one database ever need to be split across multiple machines? And once it is split, why do a single timeout, a retry, or a duplicate message delivery trigger so many design challenges?

This article clarifies "what a distributed system is" first. It will not derive Paxos, Raft, or distributed transactions in detail; instead, it places them back on the main storyline so you understand what kinds of problems they exist to solve.

## What Is a Distributed System?

The textbook *Distributed Systems: Concepts and Design* defines a distributed system as:

> A distributed system is one in which hardware or software components located at networked computers communicate and coordinate their actions only by passing messages.

In engineering terms, you can think of it this way: **a distributed system consists of multiple relatively independent computing units that communicate and collaborate over a network to provide a complete service externally.**

Do not interpret "independent" to mean that every node exclusively owns its own CPU, memory, disk, and operating system. A node can be a physical server, a virtual machine, a container, or simply a software process. Two processes on the same machine share the underlying CPU and physical memory, and containers often share the host kernel. Calling a node independent primarily means it maintains its own execution state and local data, can run independently, and can also stall, restart, or lose connectivity independently.

That is also where the trouble begins.

Nodes do not share the same process address space. What used to be a local method call, once split out, becomes an RPC, an HTTP request, a message delivery, or a database replica synchronization. Networks have latency and drop packets; a request may reach the server while the response is lost—meaning a "timeout" observed by the client does not prove the server never executed the work.

Having multiple machines introduces another constraint: no single node can observe the true state of the entire system at an exact instant. Each node sees only its own local state and the messages it has already received. Node clocks also drift; even when synchronized with NTP, they cannot be treated as a perfectly consistent global clock.

For example, when a user clicks "Submit Order," the page only fires a single request, yet on the server side it may traverse the API gateway, user service, product service, order service, inventory service, coupon service, and payment service, while writing to databases, publishing messages, and updating caches. The user sees a single button; the backend orchestrates a chain of cross-node collaboration.

![Distributed System Overview](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-system-overview-748f94b5.webp)

| Dimension | Single-Machine or Single-Process System | Distributed System |
| --- | --- | --- |
| Communication | Method calls, shared memory | RPC, messaging, network protocols |
| Failure Scope | Typically shares a single failure boundary | Nodes can fail independently |
| Time View | Primarily relies on the same machine clock | Clocks across multiple nodes exhibit skew/drift |
| State Observation | Relatively easy to observe overall state | Nodes typically only have a local view |
| Transaction Handling | Local database transactions are more common | Cross-service coordination, compensation, or consensus |
| Scaling Approach | Primarily vertical scaling (scale-up) | Horizontal scaling by adding nodes |
| Troubleshooting | Single-process logs and call stacks | Logs, metrics, distributed tracing, and cross-node state |

## Why Do We Need Distributed Systems?

Monolithic applications are not inferior. For an admin portal or a business system with modest traffic, running one application with one database is far easier to develop, deploy, and troubleshoot. Many systems run into real trouble not because they started as a monolith, but because they split too early—complexity shoots up before any benefits materialize.

Distributed systems generally become necessary only after real pressure emerges.

**First comes compute pressure.** A single machine has hard limits on CPU, memory, and disk I/O. You can upgrade to bigger hardware, but cost, hardware ceilings, and single-point risk eventually block vertical scaling. Spreading requests across multiple machines is the path most business systems end up taking.

**Storage pressure follows a similar pattern.** When an orders table grows from 1 million rows to 1 billion rows, queries, backups, index maintenance, and failure recovery all become heavy. Keeping all data on a single machine drives up both cost and operational risk. Data sharding partitions different data across different nodes—for instance, by user ID or order ID—while replication keeps multiple copies of the same data to improve availability and disaster recovery, and incidentally offload some read traffic. They solve capacity and fault issues, while introducing cross-shard queries, replica synchronization, and data consistency challenges.

**Availability also pushes systems toward multiple nodes.** If there is only one application server, the service goes down when it crashes; if there is only one database, a disk failure or host outage directly impacts the business. Multiple instances, replicas, and availability zones ensure the system can at least keep serving—or preserve core capabilities—when some nodes run into trouble.

In business contexts, the common motivations generally fall into these categories:

- **Performance hits a wall**: A single machine cannot handle the request volume, so multiple machines are needed to share the compute load.
- **Data no longer fits comfortably**: Storage, indexing, backups, and recovery on a single machine become too costly, requiring sharding or replication.
- **Failures cannot be tolerated**: The blast radius of a single point of failure (SPOF) is too large, requiring redundancy, failover, and degradation.

Some systems are driven not by single-machine capacity limits, but by geography, organizational structure, and security boundaries. Deploying services and data closer to users reduces access latency and enables cross-region disaster recovery; deploying different teams, business domains, or security domains independently prevents every feature from sharing the same release window and failure boundary.

Therefore, **distributed systems are not as simple as "adding more machines." They solve capacity, availability, isolation, and collaboration problems while simultaneously bringing network issues, partial failures, data consistency challenges, and higher troubleshooting costs into the system.**

## From a Monolithic E-Commerce App to a Distributed E-Commerce System

Suppose an early-stage e-commerce system puts user, product, order, inventory, and payment logic inside a single Spring Boot application, with all data stored in a single MySQL instance.

When the business first launches, this structure feels great. Placing an order is just a local call chain: validate the user, check the product, deduct inventory, create the order, and initiate payment. All code runs in one process, and the transaction completes within a single database. When something goes wrong, checking one application log and one database is usually enough to pinpoint the issue.

As traffic grows, pressure accumulates in a few hotspots: high read traffic on product detail pages, heavy write traffic for order creation, intense concurrency contention on inventory deduction, and strict reliability requirements along the payment path. Keeping all logic crammed into one application means any slow module can drag down the entire system.

At this point, many teams first scale horizontally: deploying 3 or more application instances behind Nginx, a gateway, or a load balancer to distribute requests. As long as the application remains largely stateless, adding instances helps absorb part of the traffic.

Later on, the system may split further:

- The product service manages product metadata and pricing display;
- The order service manages order creation and order state transitions;
- The inventory service manages inventory deduction, rollbacks, and stock ledgers;
- The payment service integrates with third-party payment channels;
- A message queue asynchronously propagates events such as payment completion, inventory changes, and logistics notifications.

![Monolith to Distributed E-Commerce](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/monolith-to-distributed-ecommerce-7d010683.webp)

The benefits of splitting are immediate. The product service gets heavy read traffic, so it can scale independently; the payment service demands high stability, so dedicated rate limiting, retry, and circuit-breaking policies can be applied; the inventory service experiences intense concurrency contention, so specialized data structures and locking strategies can be designed around stock deduction.

Yet headaches appear just as quickly.

When the order service calls the inventory service to deduct stock and the request times out, should the order service retry? Did the previous deduction request never leave the caller, or did it succeed while the response got lost? If inventory deduction succeeded but order creation failed, how is the stock restored? If a payment-success message is delivered twice, will the order status be updated twice?

These problems can also occur in a monolith, only distributed systems amplify them. There is no longer a single process, a single memory space, or a single transaction context; many things that used to happen "automatically along the way" must be redesigned from scratch once split apart.

## What Are the Typical Characteristics of Distributed Systems?

Looking only at machine count is not enough. The characteristics below are the true sources of complexity in distributed systems.

### Multi-Node Collaboration

A single request often requires multiple nodes working together to complete. An order placement request may pass through the gateway, order service, inventory service, payment service, message queue, and databases. Each node handles only a small piece of logic, and together they form a complete business flow.

As call chains grow longer, both latency and failure probabilities get amplified. A saturated thread pool on one node, a slow database query, or network jitter may manifest to the end user simply as "checkout spinning forever."

### Concurrent Execution Without an Instantaneous Global View

Nodes execute concurrently. Each node can only directly observe its own local state and the messages it has received; it cannot read the true state of the entire system at a single instant.

This produces judgments that seem contradictory yet are each locally explainable: one node already received the latest configuration while another still holds the old version; one node believes the Leader is still alive while another has timed out and started an election. Many distributed bugs are not caused by incorrect code logic, but by different nodes observing different information at different times.

### Network Communication

Nodes exchange data over the network. A network is fundamentally different from local memory: it does not guarantee that requests will arrive, nor that responses will return within the expected time.

A single remote call can result in any of these outcomes:

- The request never left the client;
- The request reached the server, but execution has not finished;
- The server executed the operation successfully, but the response never reached the client;
- The client timed out while the server is still executing;
- The server failed to execute, and the error response also failed to make it back.

Timeouts, retries, idempotency, circuit breaking, and degradation exist precisely for these situations. Once remote calls enter the critical path, these mechanisms cannot wait until production incidents happen to be retrofitted.

### Partial Failures

In a single-machine system, when a process crashes, the failure boundary is relatively clear. In a distributed system, half-healthy, half-broken states happen constantly: some nodes are healthy while others fail; some requests succeed while others fail; Service A cannot reach Service B, while Service C can still reach Service B.

An unresponsive node is not necessarily dead either. Network jitter, GC pauses, exhausted thread pools, or stalled disk I/O can make it "appear dead" temporarily. Relying purely on "did it respond?" to detect failures easily leads to false positives.

### Data Replication and Data Sharding

As data volume and availability requirements grow, systems naturally adopt sharding and replication.

Sharding partitions different data across different nodes, commonly using rules based on user ID, order ID, region, or hash keys. After sharding, load per node decreases, while cross-shard queries, cross-shard transactions, and shard rebalancing/expansion become harder.

Replication stores multiple copies of the same data—such as MySQL primary-replica replication, Redis primary-replica replication, Kafka partition replicas, and ZooKeeper multi-node replicas. Replicas make it easier to keep serving when a node fails and allow read traffic to be distributed across replicas. The trade-off is replication lag: after a write succeeds on the primary, replicas may not have caught up yet; if a user writes data and their next read hits an out-of-date replica, they may read stale values.

![Sharding, Replication, and Consistency](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/sharding-replication-consistency-542736e5.webp)

### No Perfectly Synchronized Global Clock

Every machine has its own physical clock, and clocks experience skew and drift. Time synchronization mechanisms such as NTP or GPS can shrink the error, but cannot guarantee that all nodes share an identical time view at every moment.

Distributed systems rarely rely solely on wall-clock time to determine event ordering. When expressing causal relationships, logical clocks such as Lamport Clocks or Vector Clocks can be used; for replication, elections, and state transitions, terms, epochs, version numbers, or monotonically increasing sequences are commonly used.

Physical time remains useful—logging, timeouts, leases, and cache expiration all depend on it. Whenever you depend on physical time, you simply need to know how much clock error and drift your design can tolerate. Logical clocks solve event ordering, not physical-time requirements such as "expire this lock after how many seconds."

## Common Types of Distributed Systems

A distributed system is not a single piece of middleware, but a broad category of system architectures. Common types include:

| Type | Problems Solved | Common Examples |
| --- | --- | --- |
| Distributed Coordination Systems | Leader election, configuration management, service discovery, distributed locks | ZooKeeper, etcd, Consul |
| Distributed Databases | Data sharding, replication, horizontal scaling | TiDB, CockroachDB, Cassandra, HBase |
| Distributed Caches | Multi-node caching, hot-data acceleration, cache capacity scaling | Redis Cluster, Memcached clusters |
| Distributed Message Queues | Asynchronous decoupling, traffic peak shaving, event-driven architecture | Kafka, RocketMQ, Pulsar |
| Distributed File/Object Storage | Large file storage, multi-replica durability, high-throughput I/O | HDFS, Ceph, MinIO |
| RPC Frameworks | Interface definition, serialization, cross-service request/response | gRPC, Apache Thrift |
| Service Governance Suites | Service registration & discovery, load balancing, traffic management, circuit breaking, configuration | Dubbo, Spring Cloud |

These systems solve different problems, yet frequently appear together within the same business architecture. An order system might use Redis for caching, RocketMQ to publish order events, ZooKeeper or Nacos for service registration and discovery, sharded MySQL databases to store orders, and a distributed tracing system to inspect which services a request passed through.

When studying distributed systems, do not just memorize configuration flags for individual middleware tools. Always ask what problem a component solves in the system and what complexity it pushes back onto application developers.

## What Are the Differences Among Distributed Systems, Clusters, and Microservices?

These three terms are frequently mixed together, yet they refer to different things.

A **cluster** emphasizes deployment topology. Multiple machines working together to provide a service can be called a cluster—for example, 3 Nginx instances, 5 Redis nodes, or 3 application instances. They may all perform identical work, or split responsibilities such as primary-replica, sharding, or leader election.

A **distributed system** emphasizes collaboration among nodes. Multiple nodes communicate over a network to accomplish a task together and appear externally as a unified whole. A cluster can be one form of a distributed system, while distributed systems also encompass data replication, consistency, fault tolerance, scheduling, and coordination.

**Microservices** represent an application architecture style. It decomposes a business system into multiple services organized around business capabilities, where each service can be developed, deployed, and scaled independently. Microservice systems are generally also distributed systems because services communicate over the network. However, not all distributed systems are microservices—Kafka, HDFS, and ZooKeeper are all distributed systems, not business microservices.

Another scenario is very common too: a business application itself remains a monolith, yet relies on Redis Cluster, Kafka, Elasticsearch, and MySQL primary-replica databases. The business application has not been split into microservices, yet it runs atop a set of distributed infrastructure.

## Why Are Distributed Systems Hard?

Distributed systems are hard not because the concepts sound sophisticated, but because there are too many failure modes. The network makes the outcome of an operation uncertain, and independent failures cause different nodes to observe different system states at the same time.

A local call shares the same process and failure boundary as its caller, making execution outcomes relatively straightforward to determine. A remote call adds a layer of uncertainty: a timeout only means the client did not receive a response within the configured window—it does not prove the server did not execute the request. The request might never have been sent, or it might have succeeded while the response was dropped. That distinction directly dictates retry strategy.

![Remote Call Uncertainty](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/remote-call-uncertainty-64e92b93.webp)

For instance, when the order service calls the inventory service to deduct stock, the client configures a 2-second timeout. If the order service receives no response after 2 seconds, it has several options:

- Immediately treat stock deduction as failed and cancel the order;
- Call the inventory service again;
- Query the stock deduction ledger to verify whether the previous request succeeded;
- Mark the order as "processing" first and reconcile later via messages or scheduled jobs.

Every option carries a cost. Canceling the order directly risks a false negative because the inventory service may have already deducted the stock; blind retries risk double-deducting stock; querying the ledger requires the inventory service to support idempotency keys and queryable records; asynchronous reconciliation leaves the user seeing a "processing" state, which product UX must accommodate.

This is why idempotency becomes vital. Whenever timeouts and retries exist, the same business request can be processed multiple times. The server must recognize that "this is the same business operation" and avoid double-charging, double-deducting inventory, or double-issuing coupons due to client retries. Write operations with side effects also need business idempotency keys, result lookup endpoints, bounded retries, plus exponential backoff and random jitter so retry traffic does not crush an already struggling downstream service.

Data consistency raises a similar challenge. In a monolith, a single database transaction can update both the orders table and the inventory table together; once split into an order service and an inventory service, the order database and inventory database no longer live in the same transaction. Making them either both succeed or both fail requires distributed transactions, transactional messages, TCC, Saga, local message tables, or similar mechanisms.

Many cross-service workflows accept brief periods of state inconsistency and rely on transactional messages, retries, compensation, and reconciliation so that order, inventory, and payment states eventually satisfy business invariants. In engineering, this pattern is also commonly referred to as "eventual consistency." However, it differs in context from eventual consistency in replica consistency models: the latter emphasizes that multiple data replicas eventually converge once no new writes occur, whereas the former focuses more on asynchronous coordination across cross-service business workflows.

Troubleshooting also slows down. When a single request traverses 6 services, inconsistent logging, missing distributed tracing, or messy error codes in any one of them makes root-cause analysis painful. Without adequate observability in production, it is very hard to tell which node stalled or where an error originated.

## Common Foundational Capabilities in Business Distributed Systems

The capabilities below are common in microservices and online business systems. They belong to supporting engineering infrastructure rather than the strict definition of a distributed system. Even service membership does not strictly require a standalone registry—DNS, static configuration, Gossip, or cluster protocols may all be used.

**Service Discovery and Load Balancing**: Service instances scale out, scale in, and restart dynamically, so callers cannot hardcode service addresses. A service registry tracks active instances, and load balancing picks a healthy instance to handle each call.

**Timeouts, Retries, and Idempotency**: Remote calls must configure timeouts. Retries should be applied cautiously—only for retryable operations protected by idempotency. Actions like payments, stock deductions, and coupon issuance must always be backed by unique business keys or idempotency tables.

**Circuit Breaking, Rate Limiting, and Degradation**: When downstream services slow down or fail, upstream callers must not wait indefinitely or keep retrying; otherwise failures cascade up the call chain. Circuit breaking fails fast, rate limiting controls ingress load, and degradation protects core critical paths.

**Configuration Management and Dynamic Updates**: Once the number of services grows, configurations cannot be updated manually in local files alone. A configuration center centralizes configuration management while supporting canary releases, dynamic refresh, and rollback.

**Logs, Metrics, and Distributed Tracing**: Logs answer "what happened," metrics answer "is it healthy right now," and distributed tracing answers "which path did a request take." Bringing all three together gives you real leverage when debugging distributed issues.

**Data Consistency and Compensation Mechanisms**: When writing data across nodes, failure handling must be designed upfront. Should the operation be strongly consistent, eventually consistent, or tolerate brief inconsistencies? On failure, do you rely on retries, manual intervention, reconciliation repair, or business rollback? These questions cannot wait until production errors occur.

## How Should You Learn Distributed Systems?

When learning distributed systems, it is better not to start by memorizing algorithm names. Moving from engineering problems toward theory works much more smoothly.

Step one: study network communication. HTTP, RPC, TCP, timeouts, retries, connection pools, and serialization determine how services talk to one another. Without this foundation, service governance concepts later on will feel abstract.

Step two: study service decomposition and service governance. Understand why services are split, and once split, how registration and discovery, load balancing, rate limiting, circuit breaking, distributed tracing, version compatibility, and canary releases work. Most day-to-day microservices work happens at this layer.

Step three: master the data layer—replication, sharding, caching, message queues, distributed IDs, distributed locks, and distributed transactions. Keep asking about failure scenarios: what if a message is delivered twice, what if cache and database diverge, or what if a lock expires before business execution finishes?

Finally, study theories and protocols such as CAP, BASE, centralized vs. decentralized coordination, Paxos, Raft, ZAB, Gossip, and consistent hashing. Focus on understanding *why* systems like ZooKeeper, etcd, Kafka, Redis Cluster, and distributed databases are designed the way they are.

At this point, it helps to read [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md) first. It puts Leader, Quorum, split-brain, Lease, Fencing Token, and Gossip on one unified thread, helping you grasp "who makes decisions, how state propagates, and what goes wrong on failure" before diving into the mechanics of Raft, ZAB, and Gossip.

Also keep consensus and distributed transactions distinct. Paxos, Raft, and ZAB primarily solve how a group of replicas agree on log ordering, a Leader, or state transitions; TCC, Saga, and transactional messages primarily solve how multiple business participants coordinate commits and compensations. Both may exist in the same system, yet they address different problems.

In the introductory stage, being able to clearly explain these 6 questions is far more useful than memorizing a list of jargon:

1. Why does a single-machine system need to be split across multiple nodes?
2. What are the differences between remote calls and local calls?
3. Why can't a timeout in a distributed system simply be treated as a failure?
4. Why does having multiple replicas introduce consistency issues?
5. Why do cross-service data writes usually require idempotency, compensation, and eventual consistency?
6. Why do some systems need a Leader while others are better suited to Gossip for propagating state?

## References

- [What Is a Distributed System and How to Learn Distributed Systems](https://www.cnblogs.com/xybaby/p/7787034.html)
- [What Are the Mainstream Open-Source Distributed System Architectures Today?](https://www.zhihu.com/question/19832447/answer/91660607)
- [Illustrated Common Distributed System Designs (Summary)](https://www.raychase.net/6364)
- [A brief introduction to distributed systems](https://www.researchgate.net/publication/306241722_A_brief_introduction_to_Distributed_Systems)
- [MIT 6.824 Distributed Systems](https://pdos.csail.mit.edu/6.824/)
- [Time, Clocks, and the Ordering of Events in a Distributed System](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/)
- [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Eventually Consistent - Revisited](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html)
- [Raft Consensus Algorithm](https://raft.github.io/)
- *Designing Data-Intensive Applications*
- *Distributed Systems: Concepts and Design*
