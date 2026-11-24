---
title: "ZAB Protocol Explained: ZooKeeper Atomic Broadcast, Message Broadcast, Crash Recovery, and Leader Election"
category: Distributed Systems
description: "A detailed explanation of the ZAB protocol, covering ZooKeeper Atomic Broadcast message broadcasting, crash recovery, Leader election, ZXID, transaction logs, and the relationship among ZAB, Paxos, and Raft."
tag:
  - Distributed Protocols & Algorithms
  - Consensus Algorithms
head:
  - - meta
    - name: keywords
      content: ZAB protocol,ZooKeeper Atomic Broadcast,ZooKeeper,Leader election,message broadcast,crash recovery,ZXID,distributed consistency,distributed protocol
lang: en
sourceRef: zh-ref/distributed-system/protocol/zab.md
---

As an outstanding distributed coordination framework, ZooKeeper is widely praised for its high availability and data consistency. Many people mistakenly believe ZooKeeper uses the famous Paxos algorithm, whereas in reality its "soul" is a purpose-built consensus protocol—**ZAB (ZooKeeper Atomic Broadcast)**.

Unlike Paxos, which is a general-purpose distributed consensus algorithm, ZAB is an **atomic message broadcast algorithm with crash recovery designed specifically for ZooKeeper**. Built on the ZAB protocol, ZooKeeper implements a primary-backup architecture to maintain data consistency across all replicas in a cluster.

This article focuses exclusively on how the ZAB protocol works. If you are not yet familiar with ZooKeeper's `ZNode`, `Watcher`, `Session`, and use cases, consider reading the [ZooKeeper Getting Started Guide](../distributed-process-coordination/zookeeper/zookeeper-intro.md) first. If you want to understand general concepts such as Leader, Quorum, and split-brain beforehand, check out [Distributed Coordination Explained](./centralized-and-decentralized.md).

## Core Roles and States in a ZAB Cluster

Before diving into how the protocol operates, we first need to understand the three main roles in a ZooKeeper cluster:

- **Leader:** The **sole** handler of write requests in the cluster. It initiates proposals and coordinates transactions; all write operations must go through the Leader.
- **Follower:** Can serve client read requests directly. When it receives a write request, it forwards it to the Leader. During Leader election, Followers have both voting rights and eligibility to be elected.
- **Observer:** Functions similarly to a Follower, except it has **neither** voting rights nor eligibility to become Leader. It exists to scale cluster read throughput horizontally without degrading consensus performance (i.e., without increasing the quorum size required for writes).

Correspondingly, each node in the cluster is typically in one of four states:

- `LOOKING`: Searching for a Leader (an election is currently in progress).
- `LEADING`: The node is the Leader and is actively leading the cluster.
- `FOLLOWING`: The node is a Follower, following the Leader.
- `OBSERVING`: The node is an Observer.

## Core Identifiers: ZXID and Epoch

To guarantee strict global ordering of messages in a distributed environment, the ZAB protocol introduces a globally monotonically increasing transaction ID—**ZXID**.

`ZXID` is a 64-bit `long` integer:

- **Upper 32 bits (Epoch):** Represents the term/era of the current Leader. Whenever a new Leader is elected, the `Epoch` is incremented by 1—much like a change of dynasty.
- **Lower 32 bits (Transaction Counter):** A simple incrementing counter. For every client write request, this counter increases by 1. When a new Leader takes office, the lower 32 bits are reset to zero.

![ZXID Structure](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/zab-zxid-structure-322d6b4e.png)

## Two Basic Modes of ZAB

The operation of the ZAB protocol boils down to alternating between two basic modes: **Message Broadcast** (normal operating state) and **Crash Recovery** (abnormal or startup state).

### 1. Message Broadcast Mode (Normal Write Handling)

![ZAB Message Broadcast Mode](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/zab-message-broadcast-flow-43594a4f.png)

When a cluster has a healthy Leader and a majority of nodes have completed state synchronization, it enters Message Broadcast mode. This process resembles a simplified Two-Phase Commit (`2PC`):

1. **Proposal Generation:** Upon receiving a write request, the Leader converts it into a `Proposal` stamped with a `ZXID`.
2. **Sequential Delivery:** The Leader maintains a first-in, first-out (`FIFO`) network queue per Follower (over `TCP`), ensuring proposals are delivered in the exact order they were generated.
3. **Write & ACK (Mandatory WAL Disk Flush):** Upon receiving a proposal, a Follower must append it to its local transaction log (`TxnLog`) and invoke the `fsync` system call to physically flush kernel buffer data to disk. Only after confirming the data is durably persisted on disk does it send an `ACK` back to the Leader. This step is ZAB's primary defense against data loss on power failure. For physical deployment, it is strongly recommended to mount ZooKeeper's transaction log directory (`dataLogDir`) on a dedicated, uncontended SSD to avoid disk contention with other high-I/O processes and prevent `fsync` blocking from degrading `P99` latency. In production, you must closely monitor each node's `fsynctime` metric—if average disk flush times frequently exceed `100ms`, the cluster is at constant risk of instability or collapse.
4. **Broadcast Commit:** Once the Leader receives `ACK` responses from a **majority** of nodes, it considers the write successful. (When writing to its own local log, the Leader updates an internal quorum counter directly rather than sending an explicit `ACK` to itself.) After confirming a majority, it returns success to the client and broadcasts a `Commit` message to all nodes. Followers apply the committed data to their in-memory state upon receiving `Commit`.

### 2. Crash Recovery Mode (Leader Crash or Network Anomaly)

When the system first boots up, or when the Leader crashes or loses connectivity with a majority of Followers, the entire cluster pauses serving requests, enters the `LOOKING` state, and triggers Crash Recovery mode. Crash recovery consists of two phases: **Leader Election** and **Data Recovery**.

![ZAB Crash Recovery Flow](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/protocol/zab-crash-recovery-flow-d93e52ac.png)

#### Phase 1: Leader Election

The guiding rule of election is: **the node with the most up-to-date data wins priority**. Every node initially votes for itself with a ballot containing `(Epoch, ZXID, myid)`. Nodes then exchange ballots and compare them in the following priority order:

1. **Compare `Epoch`:** Higher `Epoch` wins.
2. **Compare `ZXID`:** If `Epoch` is tied, higher `ZXID` wins (indicating newer data).
3. **Compare `myid`:** If both are tied, the server with the larger unique identifier `myid` wins.

Once a node secures votes from a **majority** of servers, it becomes the new Leader. *(This is also why ZooKeeper recommends deploying an odd number of servers, allowing majority fault tolerance at the lowest hardware cost.)*

#### Phase 2: Data Recovery

Electing a new Leader is only the first step. To ensure data consistency, ZAB must enforce two critical guarantees during data synchronization:

1. **Ensure transactions already committed on the old Leader are eventually committed on all nodes.** *(Prevents data loss.)*
2. **Discard proposals that were only proposed on the old Leader and never committed.** *(Prevents dirty data from polluting the cluster.)*

The new Leader identifies the highest `Epoch` and increments it by 1 to form the new era, then compares state against every Follower. Each Follower sends the `lastZxid` recorded in its transaction log (including proposed-but-uncommitted proposals), and based on this value the Leader chooses a polymorphic synchronization strategy: **incremental diff sync (`DIFF`)**, **forced truncation of uncommitted logs (`TRUNC`)**, or **full snapshot transfer (`SNAP`)**.

This design is critical: the Leader must accurately detect whether a Follower's log still contains "phantom proposals" left behind uncommitted by the old Leader so it can issue a `TRUNC` command to roll them back. If Followers reported only committed `ZXID`s, those uncommitted dirty entries would remain invisible and the `TRUNC` branch would never be triggered.

Even more importantly, the new `Epoch` is now active. If the former Leader suffered a multi-second JVM `Full GC` pause ("apparent death") and later wakes up attempting to send proposals stamped with its old `Epoch`, those phantom proposals will be flatly rejected and discarded because a majority of nodes have already recorded the higher `Epoch` and joined the new Leader's quorum. By combining the **`Epoch` mechanism + majority quorum**, ZAB fundamentally prevents split-brain across network partitions—rejecting stale epochs alone is insufficient; a majority of nodes must also have connected to the new Leader so the old Leader loses all write capability.

Once a majority of nodes complete state and data synchronization with the new Leader, the ZAB protocol smoothly exits Crash Recovery mode and re-enters Message Broadcast mode.

## Comparison with Raft

**Strong Similarities Between ZAB and Raft:** If you are already familiar with the Raft algorithm, you will notice how closely they resemble each other. Both have a single Leader, both use an `Epoch`/`Term` to identify leadership eras, and both commit once a majority of nodes acknowledge an entry. This shows that across modern distributed consensus, architectures built on primary-backup replication and majority election have become the de facto standard.

In modern distributed systems practice, Raft is generally considered more practical and popular than ZAB. From the outset, Raft emphasized understandability and ease of implementation by cleanly separating Leader election, log replication, and safety—making it much easier for engineers to implement and debug correctly. In contrast, ZAB is a specialized protocol tailored for ZooKeeper's specific atomic broadcast requirements, giving it narrower general-purpose applicability.

Raft has been widely adopted across modern infrastructure—such as Kubernetes's `etcd`, HashiCorp `Consul`, Apache Kafka (removing ZooKeeper in `KIP-500` in favor of Raft-based `KRaft`), and `TiKV`—greatly "democratizing" distributed consensus development.

By comparison, ZAB remains primarily tied to ZooKeeper. While ZooKeeper is still a classic coordination service, many greenfield projects prefer Raft to avoid ZooKeeper's added operational complexity and potential scaling bottlenecks (such as consensus overhead at larger scales).

Moreover, Raft enjoys a more vibrant ecosystem and has spawned many specialized variants (including adaptations for blockchains), giving it an edge in versatility and optimization. That said, if your stack is already deeply integrated with ZooKeeper, ZAB remains the best-fit option; otherwise, for new architectures or general-purpose consensus needs, Raft is the more practical standard today.

## Summary

Through its carefully designed Leader election and majority acknowledgment mechanisms, the ZAB protocol chooses Consistency (`C`) alongside Partition Tolerance (`P`) in distributed systems (satisfying `CP` properties). When a network partition occurs, ZAB willingly sacrifices brief availability (`A`) for re-election in order to preserve data consistency.

It is important to emphasize that **by default, the ZAB protocol does not guarantee strict strong consistency (Linearizability); instead, it provides Sequential Consistency**.

Because Followers can serve client read requests directly without enforcing real-time synchronization, a client can very well read stale data lagging behind the Leader (a Stale Read). In production environments, if a workload such as distributed locking requires strict data freshness, you must explicitly invoke the `sync()` primitive before calling `read()`, forcing the connected Follower to catch up with the Leader's transaction state machine.

When a network partition occurs, a client connected to an isolated minority Follower will fail on write operations, yet can still read stale data—an edge case that must be accounted for when using the ZAB protocol.
