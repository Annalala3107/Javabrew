---
title: "ZooKeeper Getting Started Guide: Core Concepts, ZNode, Watcher, ACL, and Typical Application Scenarios"
category: Distributed Systems
description: "ZooKeeper getting started guide explaining core ZooKeeper concepts, the ZNode data model, node types, the Watcher event-listening mechanism, ACL access control, and typical scenarios such as service registries, distributed locks, and configuration centers."
tag:
  - ZooKeeper
head:
  - - meta
    - name: keywords
      content: ZooKeeper,ZooKeeper Getting Started,ZNode,Watcher,ACL,Distributed Lock,Service Registry,Configuration Center,Distributed Coordination,ZAB,Ephemeral Node,Persistent Node
lang: en
sourceRef: zh-ref/distributed-system/distributed-process-coordination/zookeeper/zookeeper-intro.md
---

I believe most people have at least heard of ZooKeeper. However, do you truly understand what ZooKeeper is actually used for? If someone or an interviewer asked you to explain your understanding of ZooKeeper, how deep could your answer go?

Take me, for example! Back in college, when I built a distributed project with Dubbo, I used ZooKeeper as the service registry. To ensure that a distributed system could synchronize access to a shared resource, I also built a distributed lock with ZooKeeper. In addition, while studying Kafka, I learned that many of Kafka's features relied on ZooKeeper.

A few days ago, while summarizing my project experience, I suddenly asked myself: what exactly is ZooKeeper? After thinking for a while, only a few simple sentences came to mind:

1. ZooKeeper can be used as a service registry and a distributed lock;
2. ZooKeeper is part of the Hadoop ecosystem;
3. When building a ZooKeeper cluster, it is best to use an odd number of servers.

Clearly, my understanding of ZooKeeper stayed purely on the surface.

Therefore, through this article, I hope to walk you through ZooKeeper in greater detail. If you have never studied ZooKeeper before, this article will serve as your stepping stone into the world of ZooKeeper. If you have already worked with ZooKeeper, it will help you review some of its foundational concepts.

Moreover, beyond covering ZooKeeper's concepts, the subsequent articles will introduce commonly used ZooKeeper commands as well as using Apache Curator as a ZooKeeper client.

_If there is anything in this article that can be improved or refined, feel free to point it out in the comments so we can learn together!_

## Introduction to ZooKeeper

### Origin of ZooKeeper

Before formally introducing ZooKeeper, let's take a look at how ZooKeeper came to be—it's quite interesting.

The following excerpt is taken from Chapter 4, Section 1 of *From Paxos to ZooKeeper*, which I highly recommend reading:

> ZooKeeper originated in a research group at Yahoo! Research. At the time, researchers found that many large-scale systems inside Yahoo! relied on similar systems for distributed coordination, yet those systems often suffered from distributed single-point-of-failure issues. Therefore, Yahoo!'s developers set out to build a general-purpose distributed coordination framework free of single points of failure, allowing developers to focus their energy on business logic.
>
> There is also an interesting story behind the name "ZooKeeper." In the early days of the project, given that many previous internal projects had been named after animals (such as the famous Pig project), Yahoo!'s engineers wanted to pick an animal-related name for this project as well. Raghu Ramakrishnan, then Chief Scientist at Yahoo! Research, joked: "If we keep going like this, our place is going to turn into a zoo!" Hearing that, everyone agreed to call it the ZooKeeper—because placing all those animal-named distributed components together made Yahoo!'s entire distributed system look like a giant zoo, and ZooKeeper was meant to coordinate the distributed environment—thus, the name ZooKeeper was born.

### ZooKeeper Overview

ZooKeeper is an open-source **distributed coordination service**. Its design goal is to encapsulate complex and error-prone distributed consistency services into an efficient, reliable set of primitives, exposed to users through a suite of simple, easy-to-use interfaces.

> **Primitive:** A term used in operating systems or computer networking. It refers to a procedure composed of several instructions designed to accomplish a specific function. It is indivisible—meaning the execution of a primitive must be continuous and cannot be interrupted mid-execution.

ZooKeeper provides us with a high-availability, high-performance, and stable distributed data consistency solution. It is commonly used to implement capabilities such as data publish/subscribe, load balancing, naming services, distributed coordination/notification, cluster management, Master election, distributed locks, and distributed queues. These capabilities rely primarily on ZooKeeper's **data storage + event listening** features (detailed later in this article).

ZooKeeper stores data in memory, delivering solid performance. It achieves especially high performance in read-heavy workloads, because writes require synchronizing state across all servers (and read-heavy workloads are typical for coordination services).

Additionally, many top open-source projects rely on ZooKeeper, such as:

- **Kafka**: ZooKeeper primarily provided Kafka with Broker and Topic registration as well as load balancing across multiple Partitions. However, starting in Kafka 2.8, KRaft mode (based on the Raft protocol) was introduced, removing the dependency on ZooKeeper and greatly simplifying Kafka's architecture.
- **HBase**: ZooKeeper ensures there is only a single active Master in the entire HBase cluster and stores and serves regionserver status information (such as whether they are online).
- **Hadoop**: ZooKeeper provides high-availability support for the NameNode.

### Characteristics of ZooKeeper

- **Sequential Consistency:** Transactional requests initiated from the same client are ultimately applied to ZooKeeper strictly in the order they were sent.
- **Atomicity:** The outcome of processing any transactional request is consistent across every machine in the cluster—meaning either every machine in the cluster successfully applies the transaction, or none of them does.
- **Single System Image:** Regardless of which ZooKeeper server a client connects to, it sees the exact same server-side data model.
- **Reliability:** Once a state-changing request is applied, the result is persisted until it is overwritten by a subsequent update.
- **Sequential Consistency:** All clients observe the same order of data changes, updated according to the global FIFO order in which operations are committed. However, this does not guarantee that changes propagate to all nodes immediately.
- **Cluster Deployment:** A cluster can be formed with 3–5 machines (preferably an odd number). Every machine stores the entire ZooKeeper dataset in memory and communicates with the others to synchronize data; clients can connect to any machine.
- **High Availability:** If a machine crashes, no data is lost. As long as fewer than half of the machines in the cluster fail, the cluster remains available. For example, a 3-node cluster tolerates 1 failure, and a 5-node cluster tolerates 2 failures.

### ZooKeeper Application Scenarios

In the ZooKeeper overview, we mentioned that it is commonly used to implement data publish/subscribe, load balancing, naming services, distributed coordination/notification, cluster management, Master election, distributed locks, and distributed queues.

Let's focus on 3 typical application scenarios:

1. **Naming Service**: You can generate globally unique IDs using ZooKeeper's sequential nodes.
2. **Data Publish/Subscribe**: Data publish/subscribe can be easily implemented via the **Watcher mechanism**. When you publish data to a watched znode in ZooKeeper, other machines can listen for changes on that node to dynamically update their configuration.
3. **Distributed Lock**: A distributed lock is acquired by creating a unique node, and released when the lock holder finishes executing its code or crashes. Implementing distributed locks also relies on the **Watcher mechanism**. I covered how to implement distributed locks on ZooKeeper in detail in [Distributed Locks Explained](https://javaguide.cn/distributed-system/distributed-lock.html).

In fact, all of these capabilities benefit from ZooKeeper's ability to store data, though note that ZooKeeper is not suitable for storing large volumes of data.

## Key ZooKeeper Concepts

_Voice-over: Grab your notebook—the following content is very important!_

### Data Model

ZooKeeper's data model adopts a hierarchical multi-way tree structure. Each node can store data, which can be numbers, strings, or binary byte sequences. Furthermore, each node can have N child nodes, with the top-level root node represented by `/`. Each data node in ZooKeeper is called a **znode**, which is the smallest unit of data in ZooKeeper. Moreover, every znode has a unique path identifier.

To emphasize: **ZooKeeper is primarily meant for service coordination rather than storing business data, so do not put large amounts of data in a znode. ZooKeeper enforces an upper limit of 1 MB per node.**

As shown in the diagram below, ZooKeeper's node path notation is very similar to Unix file system paths—a sequence separated by slashes `/`. Developers can write data into a node or create child nodes beneath it. We will introduce these operations later.

![ZooKeeper Data Model](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/znode-structure-f11c2c56.png)

### znode (Data Node)

After introducing ZooKeeper's tree-shaped data model, we know that each data node in ZooKeeper is called a **znode** and is the smallest unit of data in ZooKeeper. The data you want to store resides on it, making it a concept you will interact with constantly when using ZooKeeper.

We generally classify znodes into 4 main categories:

- **Persistent (`PERSISTENT`) Node**: Once created, it remains until explicitly deleted, even if the ZooKeeper cluster restarts or crashes.
- **Ephemeral (`EPHEMERAL`) Node**: The lifecycle of an ephemeral node is bound to the **client session**; **when the session ends, the node disappears**. Additionally, **ephemeral nodes can only be leaf nodes** and cannot have child nodes.
- **Persistent Sequential (`PERSISTENT_SEQUENTIAL`) Node**: In addition to having the properties of a persistent (`PERSISTENT`) node, its child node names carry sequential ordering, such as `/node1/app0000000001` and `/node1/app0000000002`.
- **Ephemeral Sequential (`EPHEMERAL_SEQUENTIAL`) Node**: In addition to having the properties of an ephemeral (`EPHEMERAL`) node, its child node names carry sequential ordering.

Each znode consists of 2 parts:

- **stat**: Status metadata
- **data**: The actual payload stored in the node

As shown below, I retrieved the contents of the `dubbo` node under the root directory using the `get` command (the `get` command is introduced later).

```shell
[zk: 127.0.0.1:2181(CONNECTED) 6] get /dubbo
# The data content associated with this data node is empty
null
# Below is the status metadata of this data node, which is the formatted output of the Stat object
cZxid = 0x2
ctime = Tue Nov 27 11:05:34 CST 2018
mZxid = 0x2
mtime = Tue Nov 27 11:05:34 CST 2018
pZxid = 0x3
cversion = 1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 0
numChildren = 1
```

The `Stat` class contains fields for all status metadata of a data node, including the transaction ID (`cZxid`), node creation time (`ctime`), number of child nodes (`numChildren`), and more.

Let's examine what each znode status field represents (the table below is sourced from *From Paxos to ZooKeeper: Principles and Practice of Distributed Consistency*, because Guide wasn't 100% certain about all of them either—learning to consult reference materials is essential!):

| znode Status Field | Explanation                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| cZxid              | create ZXID, i.e., the transaction ID when this data node was created                                                                            |
| ctime              | create time, i.e., the creation timestamp of this node                                                                                           |
| mZxid              | modified ZXID, i.e., the transaction ID when this node was last updated                                                                          |
| mtime              | modified time, i.e., the last update timestamp of this node                                                                                      |
| pZxid              | The transaction ID when this node's child node list was last modified; only changes to the child list update pZxid, not updates to child content |
| cversion           | Child node version number; increments by 1 whenever this node's child nodes change                                                               |
| dataVersion        | Data content version number; initialized to 0 upon creation and increments by 1 on every data update (even if the content stays identical)       |
| aclVersion         | ACL version number of the node, indicating the number of times this node's ACL metadata has changed                                              |
| ephemeralOwner     | The `sessionId` of the session that created this ephemeral node; if the node is persistent, `ephemeralOwner=0`                                   |
| dataLength         | Byte length of the node's data payload                                                                                                           |
| numChildren        | Number of direct child nodes of the current node                                                                                                 |

### Version

As mentioned earlier, for every znode, ZooKeeper maintains a data structure called **Stat**, which records three versions associated with that znode:

- **dataVersion**: Version number of the current znode's data
- **cversion**: Version number of the current znode's children
- **aclVersion**: Version number of the current znode's ACL

### ACL (Access Control)

ZooKeeper uses an ACL (Access Control Lists) policy for permission control, similar to Unix file system permissions.

For operations on znodes, ZooKeeper provides the following 5 permissions:

- **CREATE**: Allows creating child nodes
- **READ**: Allows reading node data and listing child nodes
- **WRITE**: Allows setting/updating node data
- **DELETE**: Allows deleting child nodes
- **ADMIN**: Allows setting ACL permissions on the node

In particular, note that both **CREATE** and **DELETE** permissions apply to **child nodes**.

For identity authentication, ZooKeeper provides the following schemes:

- **world**: Default mode; all users have unconditional access.
- **auth**: Does not use any ID; represents any authenticated user.
- **digest**: Username and password authentication: _username:password_.
- **ip**: Restricts access to specific IP addresses.

### Watcher (Event Listener)

Watcher (event listener) is a crucial feature in ZooKeeper. ZooKeeper allows users to register Watchers on specified nodes; when specific events are triggered, the ZooKeeper server pushes event notifications to interested clients. This mechanism is a vital feature enabling ZooKeeper to deliver distributed coordination services.

![ZooKeeper Watcher Mechanism](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/zookeeper-watcher-e6a12ced.png)

_Voice-over: This is an extraordinarily useful feature—write it down in your notebook! Practically anything you build with ZooKeeper relies on the Watcher (event listener) mechanism._

### Session

A Session can be viewed as a persistent TCP connection between a ZooKeeper server and a client. Over this connection, the client maintains an active session via heartbeats, sends requests to the ZooKeeper server and receives responses, and receives Watcher event notifications pushed from the server.

A Session has an attribute called `sessionTimeout`, which represents the session timeout duration. When a client disconnects due to heavy server load, network failures, or an active client-side disconnect, as long as the client reconnects to any server in the cluster within `sessionTimeout`, the previously established session remains valid.

Additionally, before creating a session for a client, the server first assigns each client a `sessionID`. Since `sessionID` is a critical identifier for ZooKeeper sessions—and many session-related mechanisms depend on it—whichever server allocates the `sessionID` must guarantee that it is globally unique.

## ZooKeeper Cluster

To guarantee high availability, it is best to deploy ZooKeeper as a cluster. That way, as long as a majority of machines in the cluster remain available (tolerating a certain number of machine failures), ZooKeeper itself remains operational. Typically, 3 servers are enough to form a ZooKeeper cluster. The official architecture diagram from ZooKeeper shows a ZooKeeper cluster providing service as a unified whole.

![ZooKeeper Cluster Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/zookeeper-cluster-8e75087e.png)

Each Server in the diagram above represents a server running the ZooKeeper service. Every server forming the ZooKeeper cluster maintains the current server state in memory, and all servers communicate with one another. Data consistency across the cluster is maintained via the **ZAB (ZooKeeper Atomic Broadcast)** protocol.

**Most classic cluster pattern: Master/Slave mode (Primary/Backup mode).** In this pattern, the Master server typically acts as the primary server handling write requests, while Slave servers obtain the latest data from the Master via asynchronous replication to serve read requests.

### ZooKeeper Cluster Roles

However, ZooKeeper does not adopt the traditional Master/Slave terminology; instead, it introduces three roles: Leader, Follower, and Observer, as shown below.

![Roles in a ZooKeeper Cluster](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/zookeeper-cluser-roles-966ab3dc.png)

All machines in a ZooKeeper cluster elect one machine as the "**Leader**" through a **Leader election process**. The Leader handles both write and read requests for clients. Aside from the Leader, both **Follower** and **Observer** nodes can only serve read requests directly. The sole difference between a Follower and an Observer is that Observer machines do not participate in Leader election and do not participate in the "majority write acknowledgment" strategy for write operations; therefore, Observers can scale cluster read throughput without degrading write performance.

| Role     | Description                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Leader   | Serves both read and write requests for clients, initiates proposals and voting, and updates system state.                                                                                                   |
| Follower | Serves read requests for clients and forwards write requests to the Leader. Participates in voting during Leader election.                                                                                   |
| Observer | Serves read requests for clients and forwards write requests to the Leader. Does not participate in election voting or the majority-write quorum, boosting read performance without impacting write latency. Introduced in ZooKeeper 3.3. |

### ZooKeeper Cluster Leader Election Process

When the Leader server encounters abnormal conditions such as a network outage, crash/exit, or restart, the cluster enters the Leader election process to elect a new Leader server.

The process roughly consists of the following phases:

1. **Leader election**: Initially, all nodes enter the election phase. Once a node receives votes from more than half of the nodes, it becomes the prospective Leader.
2. **Discovery**: In this phase, Followers communicate with the prospective Leader to synchronize the latest transaction proposals recently received by the Followers.
3. **Synchronization**: The synchronization phase uses the latest proposal history obtained by the Leader in the previous phase to synchronize all replicas across the cluster. Only after synchronization completes does the prospective Leader become the true Leader.
4. **Broadcast**: Once this phase is reached, the ZooKeeper cluster can officially serve transactional requests externally, and the Leader can broadcast messages. Meanwhile, if a new node joins, it must also synchronize with the cluster.

Servers in a ZooKeeper cluster have the following states:

- **LOOKING**: Looking for a Leader.
- **LEADING**: Leader state; the corresponding node is the Leader.
- **FOLLOWING**: Follower state; the corresponding node is a Follower.
- **OBSERVING**: Observer state; the corresponding node is an Observer and does not participate in Leader election.

### Why Is an Odd Number of Servers Best for a ZooKeeper Cluster?

After several ZooKeeper servers go down, the cluster remains available only if the number of surviving ZooKeeper servers is greater than the number of failed ones. Suppose we have `n` ZooKeeper servers in our cluster; the number of remaining live servers must be strictly greater than `n/2`. To state the conclusion upfront: clusters of size `2n` and `2n - 1` have the exact same fault tolerance—namely `n - 1`. Think carefully through this for a moment; it's a straightforward math problem.

For example, if we have 3 servers, the cluster can tolerate at most 1 failed ZooKeeper server; if we have 4 servers, it still tolerates at most 1 failure.
If we have 5 servers, the cluster can tolerate at most 2 failed ZooKeeper servers; if we have 6 servers, it still tolerates at most 2 failures.

In short, why add an extra, unnecessary ZooKeeper server?

### How ZooKeeper's Quorum Election Mechanism Prevents Split-Brain

**What is cluster split-brain?**

For a cluster, multiple machines are often deployed across different data centers (server rooms) to improve availability. While aiming for high availability, a network link failure between data centers can cut off inter-DC connectivity, splitting the cluster into several isolated sub-clusters. At that point, sub-clusters might each elect their own leader—a situation known as "split-brain."

For example, suppose a cluster consists of 6 servers deployed across 2 data centers, 3 in each. Normally there is only 1 leader. However, if the network between the two data centers disconnects, the 3 servers in each data center assume the 3 servers in the other data center are offline, elect their own leader, and serve requests independently. Without a majority quorum mechanism, when the network recovers, there would be 2 leaders—as if 1 brain (leader) had split into 2 brains, hence "split-brain." During the split-brain period, both leaders might serve traffic, leading to data inconsistency and other issues.

**How does the majority quorum mechanism prevent split-brain?**

ZooKeeper's majority quorum requirement makes it impossible to elect 2 leaders, because less than or equal to half of the nodes can never elect a leader. As a result, no matter how machines are distributed across data centers, split-brain cannot occur.

## ZAB Protocol and Paxos Algorithm

You could say the Paxos algorithm is the soul of ZooKeeper. However, ZooKeeper did not adopt Paxos directly in full; instead, it uses the ZAB protocol as its core algorithm for ensuring data consistency. Additionally, the official ZooKeeper documentation notes that unlike Paxos, ZAB is not a general-purpose distributed consensus algorithm—it is a crash-recoverable atomic message broadcast algorithm designed specifically for ZooKeeper.

### Introduction to the ZAB Protocol

The ZAB (ZooKeeper Atomic Broadcast) protocol is an atomic broadcast protocol supporting crash recovery, designed specifically for the distributed coordination service ZooKeeper. In ZooKeeper, distributed data consistency relies primarily on the ZAB protocol; based on it, ZooKeeper implements a primary-backup system architecture to maintain data consistency across all replicas in the cluster.

### Two Basic Modes of the ZAB Protocol: Crash Recovery and Message Broadcast

The ZAB protocol includes two fundamental modes:

- **Crash Recovery**: During cluster startup, or when the Leader server suffers a network outage, crash/exit, restart, or similar anomaly, the ZAB protocol enters recovery mode and elects a new Leader server. Once a new Leader is elected and more than half of the machines in the cluster have completed state synchronization with that Leader, ZAB exits recovery mode. Here, **state synchronization refers to data synchronization, ensuring that a majority of machines in the cluster maintain a data state consistent with the Leader server**.
- **Message Broadcast**: **Once more than half of the Follower servers have completed state synchronization with the Leader server, the entire service framework can enter message broadcast mode.** When a newly started server following the ZAB protocol joins the cluster while a Leader server is already broadcasting messages, the new server automatically enters data recovery mode: it locates the Leader server, synchronizes data with it, and then participates in the message broadcast workflow together.

### Recommended Articles on ZAB Protocol & Paxos Algorithm

There is a lot to explain and understand about the **ZAB protocol & Paxos algorithm**. For details, check out these articles:

- [Paxos Algorithm Explained](https://javaguide.cn/distributed-system/protocol/paxos-algorithm.html)
- [ZAB Protocol Explained](https://javaguide.cn/distributed-system/protocol/zab.html)
- [Raft Algorithm Explained](https://javaguide.cn/distributed-system/protocol/raft-algorithm.html)

## ZooKeeper vs. ETCD

[ETCD](https://etcd.io/) is a strongly consistent distributed key-value store that provides a reliable way to store data needed by distributed systems or machine clusters. Internally, ETCD uses the [Raft algorithm](https://javaguide.cn/distributed-system/protocol/raft-algorithm.html) for consensus and is implemented in Go.

Similar to ZooKeeper, ETCD can also be used for data publish/subscribe, load balancing, naming services, distributed coordination/notification, distributed locks, and more. So how should you choose between the two?

Dewu Tech's article [Brief Analysis on Building High-Availability Architectures Based on ZooKeeper](https://mp.weixin.qq.com/s/pBI3rjv5NdS1124Z7HQ-JA) provides the following comparison table (further refined by me) as a reference:

|                      | ZooKeeper                                                                                                  | ETCD                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Language**         | Java                                                                                                       | Go                                                                              |
| **Protocol**         | TCP                                                                                                        | gRPC                                                                            |
| **API Invocation**   | Requires using its own dedicated client                                                                    | Supports HTTP transport, so commands like `curl` can invoke it directly         |
| **Consensus Algorithm** | ZAB protocol                                                                                            | Raft algorithm                                                                  |
| **Watcher Mechanism** | Relatively limited; one-time trigger                                                                      | A single Watch can monitor all events continuously                              |
| **Data Model**       | Directory-based hierarchical tree model                                                                    | Inspired by ZK's model, implemented as a flat key-value model                   |
| **Storage**          | KV storage using `ConcurrentHashMap`, stored in memory; generally not recommended for large datasets       | KV storage using the `bbolt` storage engine; capable of handling several GBs    |
| **MVCC**             | Not supported                                                                                              | Supported, with version control managed via two B+ Trees                        |
| **Global Session**   | Has design flaws                                                                                           | More flexible implementation that avoids security issues                        |
| **Access Control**   | ACL                                                                                                        | RBAC                                                                            |
| **Transactions**     | Provides simple transactional capabilities                                                                 | Only provides version-check conditional operations                              |
| **Ops & Maintenance** | Complex                                                                                                   | Simple                                                                          |

ZooKeeper has certain limitations in storage performance, global Sessions, and its Watcher mechanism. More and more open-source projects are replacing ZooKeeper with Raft implementations or other distributed coordination services, such as [Kafka Needs No Keeper - Removing ZooKeeper Dependency (confluent.io)](https://www.confluent.io/blog/removing-zookeeper-dependency-in-kafka/) and [Moving Toward a ZooKeeper-Less Apache Pulsar (streamnative.io)](https://streamnative.io/blog/moving-toward-zookeeper-less-apache-pulsar).

Overall, ETCD is more polished—it delivers more stable high-load read/write capabilities and improves upon many issues exposed by ZooKeeper. Moreover, ETCD can essentially cover all of ZooKeeper's use cases and serve as a drop-in replacement.

## Summary

1. ZooKeeper itself is a distributed program (as long as more than half of the nodes stay alive, ZooKeeper continues serving requests).
2. To ensure high availability, ZooKeeper should be deployed as a cluster so that as long as a majority of machines remain healthy (tolerating some machine failures), ZooKeeper stays available.
3. ZooKeeper stores data in memory, ensuring high throughput and low latency (however, memory limits total storage capacity—another reason to keep the payload stored inside each znode small).
4. ZooKeeper delivers high performance, particularly in read-heavy workloads, because writes require synchronizing state across all servers (and read-heavy traffic is typical for coordination services).
5. ZooKeeper features ephemeral nodes. As long as the client session that created an ephemeral node remains active, the ephemeral node persists; when the session terminates, the ephemeral node is deleted. Persistent nodes, once created, remain stored in ZooKeeper unless explicitly removed.
6. Under the hood, ZooKeeper essentially provides just two core functions: (1) managing (storing and reading) data submitted by user programs; (2) providing data node event-listening services to user programs.

## References

- *From Paxos to ZooKeeper: Principles and Practice of Distributed Consistency*
- Discussing the Limitations of ZooKeeper: <https://wingsxdu.com/posts/database/zookeeper-limitations/>
