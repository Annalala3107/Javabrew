---
title: "Gossip Protocol Explained: Anti-Entropy, Rumor Mongering, SWIM, and Eventual Consistency"
category: Distributed Systems
description: "A detailed explanation of the Gossip protocol, covering decentralized information propagation models, anti-entropy, rumor mongering, Push/Pull modes, the SWIM protocol, eventual consistency, and applications in systems such as Redis Cluster and Cassandra."
tag:
  - Distributed Protocols & Algorithms
  - Data Replication Protocols
  - Eventual Consistency
head:
  - - meta
    - name: keywords
      content: Gossip protocol,SWIM protocol,anti-entropy,rumor mongering,eventual consistency,decentralized,Redis Cluster,Cassandra,distributed protocols,distributed algorithms
lang: en
sourceRef: zh-ref/distributed-system/protocol/gossip-protocol.md
---

## Background

In distributed systems, sharing state across different nodes is a fundamental requirement.

A straightforward approach is **centralized broadcast**: a central node synchronizes information to all other nodes. While this works well for centralized systems, it suffers from clear drawbacks: as the number of nodes grows, synchronization efficiency degrades (`O(N)` complexity), and heavy reliance on a central node introduces a single point of failure.

The **Gossip protocol**, built on **decentralized propagation**, offers a decentralized alternative.

If you are not yet clear on what problems Leader/Quorum and Gossip are each suited to solve, you can read [Distributed Coordination Explained](./centralized-and-decentralized.md) first. This Gossip article focuses strictly on "how state propagates and eventually converges," and does not cover strong-coordination topics such as Leader election, split-brain, or Fencing Tokens.

![Distributed System Communication Mechanisms: Centralized vs. Decentralized](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-centralized-vs-decentralized-c5a64d5a.png)

## Introduction to the Gossip Protocol

**Gossip** (also called the **Epidemic protocol**) draws inspiration from the stochastic nature of epidemic spread. Its core idea is simple: each node periodically and randomly selects a few other nodes to exchange information with, allowing data to spread across the entire network much like a virus.

![Gossip Meaning](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-04365d30.png)

The Gossip protocol was first proposed by Demers et al. in their 1987 paper [Epidemic Algorithms for Replicated Database Maintenance](https://dl.acm.org/doi/10.1145/41840.41841) to solve replica synchronization in distributed databases.

**Definition**: The Gossip protocol is a **decentralized** communication protocol in which nodes randomly exchange information so that—assuming a **non-Byzantine environment with no permanent network partitions** and continuous periodic exchanges—all nodes in the cluster reach **eventual consistency**.

> **Important Distinction**: Gossip is an information propagation protocol, **not a consensus algorithm** (such as Raft or Paxos). Consensus algorithms guarantee strong consistency and safety, whereas Gossip only guarantees eventual consistency and is unsuitable for scenarios requiring strong consistency, such as leader election or state machine replication.

**Key Characteristics**:

- **Decentralized**: No central node; all nodes are peers of equal standing.
- **High Fault Tolerance**: Tolerates node crashes, network partitions, and dynamic addition or removal of nodes.
- **Probabilistic Convergence**: Under the classic model with uniform random peer selection and a constant fanout, the expected number of propagation rounds is `O(log N)` (for example, around 5–7 rounds when `N = 100`, depending on fanout and packet loss).
- **Message Redundancy**: The same message may be received multiple times, requiring deduplication mechanisms.

## Applications of the Gossip Protocol

The Gossip protocol is widely used in distributed systems:

- **Redis Cluster**: Used for inter-node state synchronization and failure detection.
- **Apache Cassandra**: Used for propagating cluster membership and state information; replica repair uses anti-entropy / repair (based on Merkle Trees).
- **Consul**: Used for member discovery, failure probing, and event broadcasting (based on the SWIM protocol).
- **Amazon Dynamo**: Used to achieve eventual consistency in distributed storage.

Take **Redis Cluster** (3.0+) as an example:

Redis Cluster is a decentralized distributed caching solution where nodes exchange cluster state via the Gossip protocol, including node information, slot assignments, and node status (online / `PFAIL` / `FAIL`).

![Official Redis Cluster Solution](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/up-fcacc1eefca6e51354a5f1fc9f2919f51ec-5526f47c.png)

**Gossip Message Types**:

| Message Type | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| MEET         | Adds a specified node into the cluster               |
| PING         | Sent periodically to exchange node states            |
| PONG         | Responds to PING, carrying the sender's state info   |
| FAIL         | Broadcasts that a node has been marked as failed     |

> Note: In the implementation, `MEET`, `PING`, and `PONG` share the same message structure; `PONG` is the response to `PING`/`MEET`, and `MEET` acts like a `PING` that forces a handshake.

**Failure Detection Flow**:

1. If node A does not receive a response from node B within `cluster-node-timeout` (commonly 15s, depending on configuration), A marks B as **PFAIL** (Possibly Fail / suspected offline).
2. If A receives `PFAIL` reports about B from other master nodes, and **more than half of the master nodes** confirm B as `PFAIL` (with unexpired reports), A marks B as **FAIL** (confirmed offline) and broadcasts this to the cluster.

The diagram below illustrates a primary-replica Redis Cluster architecture: dashed lines represent Gossip communication among nodes, while solid lines represent primary-replica replication.

![Redis Cluster Nodes Communicating via Gossip](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/redis-cluster-gossip-94621dda.png)

> Note: Redis Cluster mainly propagates node, slot, and failure information via incremental Gossip inside `PING`/`PONG` messages (carrying timestamps, flags, etc.), rather than using a Merkle tree-based anti-entropy reconciliation process like Dynamo.

For a deeper look at Redis Cluster, see [Redis Cluster Explained (Paid)](https://javaguide.cn/database/redis/redis-cluster.html).

## Gossip Propagation Modes

The Gossip protocol has two primary propagation modes: **Anti-Entropy** and **Rumor Mongering**.

### Anti-Entropy

**Definition**: Nodes exchange **complete data** (or data digests) to eliminate discrepancies and achieve eventual consistency.

In physics, **entropy** measures the degree of disorder in a system; anti-entropy therefore means **reducing data divergence across nodes and improving consistency**.

According to Wikipedia:

> The concept of entropy originated in [physics](https://zh.wikipedia.org/wiki/%E7%89%A9%E7%90%86%E5%AD%A6) to measure the degree of disorder in a thermodynamic system. Entropy is best understood as a measure of uncertainty rather than certainty, because the more random an information source is, the higher its entropy.

Here, you can think of entropy in anti-entropy as the disorder or divergence of data across nodes; anti-entropy means eliminating data differences between nodes and increasing data similarity, thereby lowering entropy.

**Three Implementation Approaches**:

| Mode      | Description                                              | Suitable Scenario          |
| --------- | -------------------------------------------------------- | -------------------------- |
| Push      | The sender pushes all of its data to the receiver        | The sender has new data    |
| Pull      | The receiver pulls all data from the sender              | The receiver's data is stale |
| Push-Pull | Both sides exchange data and compare differences         | Most efficient and common  |

![Anti-Entropy Mechanism: Push-Pull Sequence Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-anti-entropy-pushpull-aa62b9bc.png)

The pseudocode is shown below:

![Anti-Entropy Pseudocode](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/up-df16e98bf71e872a7e1f01ca31cee93d77b-986bf4ca.png)

**Convergence Characteristics**: Under a model with uniform random peer selection and constant fanout, it takes an expected `O(log N)` rounds to cover all nodes (commonly estimated on the order of `log₂N`).

Some systems (such as InfluxDB) use **deterministic closed-loop scheduling** (e.g., a ring topology) instead of random selection so synchronization completes within a deterministic number of rounds. This is an **engineering derivative** of anti-entropy rather than the core mechanism of standard Gossip. Deterministic scheduling trades away the fault-tolerance benefits of randomness in exchange for predictable convergence time.

![Deterministic Closed-Loop Scheduling](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/raft-anti-entropyclosed-loop-77b7b3c0.png)

1. Node A pushes data to Node B, so Node B receives the latest data from Node A.
2. Node B pushes data to Node C, so Node C receives the latest data from Nodes A and B.
3. Node C pushes data to Node A, so Node A receives the latest data from Nodes B and C.
4. Node A then pushes data to Node B to close the loop, ensuring Node B receives the latest data from Node C.

**Trade-off**: Closed-loop scheduling completes synchronization within a bounded time, but sacrifices **fault tolerance** (a failed node in the ring disrupts the propagation path) and adapts poorly to dynamic node additions or removals.

**Suitable Scenarios**: Workloads requiring a very low residue rate (minimizing missed updates) where periodic background reconciliation and repair are acceptable; when data volume is large, digests or tree structures must be used for incremental diffing to control overhead.

> **Production Optimization**: In large-scale distributed storage systems (such as Cassandra and DynamoDB), a single node can hold terabytes of data, making full data exchange impractical. Production systems use a **Merkle Tree** for incremental diff comparison: two nodes first exchange their Merkle Tree root hashes; if they differ, they recursively compare child subtrees to pinpoint discrepancies across `O(log M)` tree levels (where `M` is the number of entries in that range), and then transmit only the incremental differences.

### Rumor Mongering

**Definition**: When a node has **new data**, it becomes an active node and periodically broadcasts that data to random peers until all nodes have received it.

**Differences from Anti-Entropy**:

- Propagates only **newly added data** (Delta), rather than full datasets.
- After receiving an update, a node enters an active state to propagate it periodically, and stops according to a policy (count, probability, or TTL) after repeatedly encountering peers that already know the update.
- Well-suited for scenarios with **large node counts** and **small incremental updates**.

> **Deduplication Mechanism**: Production environments (such as Redis Cluster) deduplicate using **version numbers** or **message IDs** to avoid reprocessing the same message.

As illustrated below (image from [INTRODUCTION TO GOSSIP](https://managementfromscratch.wordpress.com/2016/04/01/introduction-to-gossip/)):

![Gossip Propagation Illustration](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-rumor-mongering-fa010ea1.gif)

The pseudocode is shown below:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/20210605170707933-bf551c2f.png)

**Convergence Characteristics**: Under uniform random peer selection and constant fanout, all nodes are covered with high probability in `O(log N)` rounds.

**Precautions**:

- Keep packet sizes small and avoid fragmentation where possible (typically fitting within a single network packet, depending on path MTU).
- Pair with deduplication mechanisms (such as message IDs or version numbers).
- Avoid message storms caused by high-frequency updates.
- Use **Jitter (randomized delay)** to stagger synchronization timing and prevent thundering-herd spikes caused by many nodes initiating propagation simultaneously.

![Gossip Protocol: Random Propagation and Convergence Process](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/gossip-propagation-ce836438.png)

### Summary

| Aspect            | Anti-Entropy                                | Rumor Mongering                           |
| ----------------- | ------------------------------------------- | ----------------------------------------- |
| Payload           | Full data (or digests)                      | Incremental updates only (Delta)          |
| Suitable Scenario | Moderate number of nodes                    | Large or dynamically changing node counts |
| Message Overhead  | Higher                                      | Lower                                     |
| Convergence Scope | Converges to latest state (full sync)       | Converges to known updates (incremental)  |

## Pros and Cons of the Gossip Protocol

**Advantages**:

1. **Simple Implementation**: The protocol logic is straightforward and easy to understand.

2. **Strong Fault Tolerance**: Tolerates node crashes, network partitions, and dynamic node additions/removals. Newly added or restarted nodes will eventually reach consistency with other nodes under ideal conditions.

3. **Good Scalability**: Convergence time is `O(log N)`. When `N` is large (e.g., `N > 100`), parallel propagation is typically faster than central-node unicast (which requires `O(N)` rounds). In a typical rumor-spreading model, the cost is **`O(N log N)` total messages** (depending on implementation policies and stopping conditions), introducing redundant message overhead.

**Disadvantages**:

1. **Eventual Consistency**: Messages take multiple rounds to cover the entire network, creating an inconsistency window. The exact time to reach consistency depends on network conditions, the gossip interval (**implementation-dependent, commonly 100ms–1s**), and cluster size.

2. **Unsuitable for Byzantine Environments**: The Gossip protocol assumes a non-Byzantine environment and does not handle malicious nodes (nodes do not forge or tamper with messages).

3. **Message Redundancy**: Because propagation is random, a node may receive the same message repeatedly, requiring deduplication mechanisms.

## Summary

- The Gossip protocol is a **decentralized** communication protocol that brings all nodes in a cluster to **eventual consistency** through randomized information exchange.
- **Not a Consensus Algorithm**: Gossip does not guarantee strong consistency or linearizability and cannot be used for leader election or state machine replication; consensus algorithms (Raft/Paxos) are what guarantee safety and linearizability.
- Core traits: decentralized, highly fault-tolerant, `O(log N)` convergence.
- Two propagation modes: **Anti-Entropy** (full data/digests) and **Rumor Mongering** (incremental updates).
- Typical applications: metadata dissemination (Redis Cluster) and eventually consistent storage (Cassandra/DynamoDB).
- Trade-off: simplicity and fault tolerance vs. eventual-consistency latency and message redundancy.

## References

- [Epidemic Algorithms for Replicated Database Maintenance](https://dl.acm.org/doi/10.1145/41840.41841) - Demers et al., 1987
- [Amazon Dynamo: All Things Distributed](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) - DeCandia et al., 2007
- [Redis Cluster Specification](https://redis.io/docs/management/scaling/)
- A 10,000-Word Deep Dive into the Redis Cluster Gossip Protocol: <https://segmentfault.com/a/1190000038373546>
- *Distributed Protocols and Algorithms in Practice*
- *Redis Design and Implementation*
