---
title: "Distributed Coordination Explained: Leader, Quorum, Lease, Fencing Token, and Gossip"
description: "An in-depth guide to distributed coordination mechanisms, explaining decision-making and state-propagation problems in centralized and decentralized designs, including Leader, Quorum, Majority, Term/Epoch, Lease, Fencing Token, Gossip, idempotency, and scheduled job execution semantics."
category: Distributed Systems
tag:
  - Distributed Theory
  - Distributed Protocols & Algorithms
  - System Design
head:
  - - meta
    - name: keywords
      content: distributed coordination,centralized,decentralized,Leader,Primary,Quorum,majority,Leader election,Lease,Fencing Token,Gossip,idempotency,eventual consistency,scheduled tasks
lang: en
sourceRef: zh-ref/distributed-system/protocol/centralized-and-decentralized.md
---

A scheduled job is deployed across 3 instances—at 2:00 AM, who should actually run this batch?

If all 3 instances run it, data may be processed twice; if all 3 wait for another instance to run it, the job gets missed. Cache clusters, message queues, configuration centers, and distributed locks run into similar problems: once there are multiple nodes, the system needs a way to decide "who is responsible for what," "who is still alive right now," and "in what order this change takes effect."

This is the coordination problem in distributed systems.

However, we first need to distinguish between two things: **electing a single executor** vs. **ensuring the business effect happens only once**.

Leader election, distributed locks, or database contention can reduce concurrent execution across multiple instances, yet they cannot by themselves guarantee end-to-end exactly-once semantics. An executing node might finish processing the business work and then crash before updating the job status; to avoid missing the job, the scheduler can only dispatch it again. The official Kubernetes CronJob documentation also cautions that the time a CronJob creates a Job is approximate, and in certain circumstances two Jobs might be created or no Job might be created—so Jobs themselves should be designed to be idempotent.

In production, scheduled jobs typically look closer to "at-least-once execution + business idempotency": using a task ID, business unique key, state machine, deduplication table, or transactional constraint to ensure repeated execution on the same batch produces no extra side effects.

![Scheduled job execution semantics](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/cronjob-execution-semantics-0d7c49e2.webp)

This article focuses solely on design trade-offs rather than walking through the full implementations of specific systems like ZooKeeper, etcd, Redis Cluster, or Eureka. For consensus algorithms, continue reading [Raft Algorithm Explained](./raft-algorithm.md) and [ZAB Protocol Explained](./zab.md); for state propagation, read [Gossip Protocol Explained](./gossip-protocol.md); and for business mutual exclusion, read [Distributed Lock Implementations Explained](../distributed-lock-implementations.md).

## How Does This Article Relate to Others?

[Introduction to Distributed Systems](../distributed-system-intro.md) addresses "why splitting a single-node system into multiple nodes introduces complexity." [CAP Theorem and BASE Theory Explained](./cap-and-base-theorem.md) addresses "how to trade off consistency and availability when a partition occurs." Raft, Paxos, and ZAB address "how a group of nodes agrees on a value or log order." Gossip addresses "how state spreads across a large number of nodes and eventually converges."

Sitting right between them, this article focuses on a more engineering-oriented question: **how does a distributed system actually coordinate multiple nodes?**

To keep concepts from getting tangled together, let us split this into two classes of problems:

- **Decision Problems**: Who can become the Leader? Should a log entry be committed? Who currently owns a resource? Can a specific task execute?
- **Propagation Problems**: How do membership states, failure reports, configuration versions, and cache metadata spread to other nodes?

![Decision making vs. propagation in distributed coordination](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-coordination-decision-vs-propagation-9ea61451.webp)

Leader, Quorum, Lease, Lock, and Fencing Token revolve primarily around decision making and execution eligibility; Gossip mainly solves state propagation. Real-world systems often combine these mechanisms rather than making a simplistic binary choice between "centralized" and "decentralized."

## Why Do Distributed Systems Need Coordination?

In a single-node system, many tasks can rely directly on local memory, database transactions, or in-process locks. In a distributed system, those tools suddenly fall short.

A distributed system adds a network layer, and with it comes uncertainty.

Each node can only observe its own local state and the messages it has received. When a node stops responding, it may genuinely have crashed—or it may simply be experiencing network jitter, a GC pause, stalled disk I/O, or an exhausted thread pool. A timeout seen by the caller only proves it did not receive a response within the allotted window; it does not prove the remote side failed to execute.

Coordination exists to solve these very problems:

- **Membership Management**: Which nodes are in the cluster? Which nodes are currently eligible to participate in work?
- **Task Assignment**: Which node should handle a particular shard, task, partition, or primary replica?
- **Ordering Control**: When multiple nodes submit changes concurrently, which goes first and which goes later?
- **Failover**: When a responsible node becomes unreachable, who takes over, and what state must be confirmed before taking over?
- **Version Advancement**: When configurations, metadata, or Leader election results change, how do nodes distinguish newer state from older state?

These problems can be driven centrally by the current Leader, decided jointly by a group of nodes via Quorum, or handled by propagating observed state via Gossip before deciding via voting, version numbers, or business rules.

## Leader/Quorum Coordination: Who Makes the Decisions?

Many systems introduce a Leader, Primary, or central coordinator. Other nodes primarily execute tasks or update their state based on the logs, configurations, and assignments driven by the Leader.

There is a common misconception here: having a Leader does not automatically mean a fragile single point of failure. In systems like Raft and ZAB, the Leader is simply the current role elected across multiple replicas, and its state remains protected by log replication and Quorum. What truly matters is whether the state behind the Leader is backed by replicas, whether a new Leader can be elected if the Leader crashes, and whether the new Leader can pick up the prior committed state and continue operating.

A Leader's common responsibilities fall into several categories.

First is maintaining the cluster view—such as which Workers are online, each Worker's load, which node owns which shard, and whether a replica has fallen too far behind. This information may come from heartbeats, reports, probes, or registration records in an underlying store.

Second is making assignment decisions—for example, a job scheduler dispatching a task to an executor, a distributed store migrating a shard to a machine, or a message queue switching a partition Leader to another replica. Workers do not need to guess on their own; they simply execute confirmed assignments.

Third is controlling write ordering. Many distributed systems do not struggle with distributing reads; the hard part is writes. If multiple nodes modify metadata concurrently without a unified order, two nodes can easily believe they both own the same shard or two tasks can both think they are the primary executor. A Leader serializes writes into an ordered log and replicates it to other nodes.

A Leader makes system behavior easier to reason about and gives troubleshooting a clear decision entry point. The cost is that the coordination path can become a bottleneck, and the system must handle false-positive failure detection, split-brain, and failover.

## What Problems Does Leader/Quorum Coordination Face?

The most obvious concern is the Leader becoming a single point of failure.

If the Leader keeps state only in its own memory, a Leader crash wipes out the cluster's knowledge of current task assignments, shard ownership, and latest metadata. That design is indeed dangerous. The more common engineering practice is for the Leader to act purely as the "current decision-maker," replicating metadata and logs across multiple replicas so remaining nodes can elect a new Leader from existing logs if the Leader goes down.

Another problem is bottlenecks. Every coordination request passes through the Leader, so the Leader's CPU, network, and disk log writes bound the whole system. Especially when metadata changes frequently, the Leader becomes the scaling ceiling. Many systems separate the data plane from the control plane: ordinary reads and writes are spread out as much as possible, while only operations like Leader election, metadata changes, and shard migration enter the coordination path.

Even trickier is misjudgment (false positives).

Heartbeat checks are common, yet a heartbeat is not a "proof of life or death." Failing to receive a Worker's heartbeat only tells the Leader that no response arrived within the current network conditions and timeout threshold. The Worker might still be running a task—just stalled in a Full GC, isolated on the network, or blocked on disk writes. If the Leader immediately reassigns the task to another Worker, and the old Worker later resumes and writes its output, duplicate writes can occur.

Split-brain stems from the same root.

During split-brain, multiple partitions simultaneously believe they have the authority to advance system state. For instance, the original Leader and a subset of nodes get isolated while the other nodes elect a new Leader. If both Leaders accept external writes, two conflicting state histories emerge once the partition heals. For configuration centers, distributed locks, primary-replica failover, and shard ownership, this is generally unacceptable.

Therefore, the challenge is not merely "electing a Leader"—it is also preventing the old Leader from causing damage once it loses authority.

## How to Mitigate Leader Single Points and Split-Brain?

Simply giving the Leader a standby node is not enough. For the standby to take over safely, it must know what decisions the Leader has already made, which decisions are committed, and which ones only the Leader itself thought succeeded.

That requires replicas, Quorums, and protocol constraints.

### Majority Is Not the Complete Answer

The majority rule is straightforward: a decision is considered valid only after more than half of the nodes agree. Assuming a cluster has `N` voting nodes, a majority is `floor(N/2) + 1`—3 nodes require 2 votes, and 5 nodes require 3 votes.

This formula assumes several preconditions:

- The membership set is relatively fixed;
- Every voting node carries equal weight;
- Only crash faults and network partitions are considered, not malicious nodes;
- A standard majority Quorum is used, rather than weighted Quorum, Flexible Quorum, or BFT Quorum.

Majorities have an important property: any two majority sets are guaranteed to intersect.

However, "guaranteed intersection" alone is not enough. The protocol must also constrain who is eligible to be elected and how a new Leader recovers state. Taking Raft as an example, each node votes at most once per Term, and a candidate's log must be at least as up-to-date as the voter's. Majority intersection combined with log freshness checks ensures that committed log entries are never lost in subsequent elections—a property Raft calls Leader Completeness.

Thus, majorities provide the intersection foundation; true safety also comes from election rules, log-matching rules, and commit rules.

Majorities also carry a cost. For coordinated state or replicated logs that rely on a majority for safety, new writes should generally stop being committed whenever a Quorum cannot be reached. Whether stale reads remain allowed depends on the specific protocol and consistency requirements. A 3-node cluster tolerates 1 voting-node failure and a 5-node cluster tolerates 2; a 4-node cluster still only tolerates 1 voting-node failure and a 6-node cluster still only tolerates 2—which is why coordination systems usually recommend an odd number of voting nodes.

### Term/Epoch Only Protects Protocol Internals

Leader election generally relies on a term concept—called `Term` in Raft and `Epoch` in ZAB. Each election enters a higher term; once nodes see a higher term, they reject requests from older terms, and an old Leader must step down to an ordinary node.

This primarily protects the internal state of the coordination protocol.

Terms do not propagate automatically to every external business resource. If an old Leader bypasses the replication protocol and writes directly to a database, object store, or third-party API, the resource side has no idea that the Raft Term or ZAB Epoch has changed. To genuinely reject late writes, the resource side must validate a version number or Fencing Token.

### Lease Solves Resource Reclamation, Not Proof That the Old Client Has Stopped

Suppose a client acquires a lock and then hits a long GC pause. The lock service considers it unreachable and grants the lock to another client. When the old client resumes, it may still hold its stale execution context and write to a database, object store, or external API. Just because the lock service switched Leaders or lock owners does not mean the business thread inside the old client vanishes immediately.

A **Lease** can be understood as an authorization with an expiration time. After acquiring a Lease, the client must renew it within the TTL; if renewal fails or the Lease expires, the coordination system can reclaim the associated resource. etcd's Lease API follows this model: the cluster grants a Lease with a TTL, and if no `keepAlive` arrives within the TTL, the Lease expires and keys attached to it are deleted. The TTL returned by etcd is governed by the server's clock and decision—not by the client checking its own local clock to decide whether the Lease is still valid.

The real danger is that the client's perception of its Lease state can go stale. Due to a long GC pause, network isolation, or thread blocking, it may fail to realize in time that its Lease has already expired.

Therefore, a Lease is suitable for liveness detection and automatic resource reclamation, but it cannot by itself prove that the old client has stopped executing. As long as the old client can still reach the shared resource, late writes remain possible.

### Fencing Token Rejects Stale Executors

**Fencing Tokens** take a more direct approach: every time permission is successfully granted, the coordination system issues a monotonically increasing token. When writing to a shared resource, the client must include this token; the resource records the highest token seen so far and rejects writes carrying any smaller token.

For example:

1. Client A acquires the lock and receives `token=10`.
2. Client A experiences a long pause and its lock expires.
3. Client B acquires the lock, receives `token=11`, and writes to the resource successfully.
4. Client A wakes up and attempts to write to the resource with `token=10`.
5. The resource sees `10 < 11` and rejects Client A's write.

The token number alone solves nothing—validation on the resource side is the key. Ideally, the resource atomically executes "compare token + update data + record latest token." If you first query the token and then separately write the data, a concurrent request can still slip in between.

Let us view Lease, Fencing Token, and Idempotency Key side by side:

| Mechanism | Problem Solved | What It Cannot Guarantee |
| --------- | -------------- | ------------------------ |
| Lease | Automatically reclaims credentials held by unreachable clients | That the old client has stopped running |
| Fencing Token | Rejects late writes from stale owners | That the business operation itself is retry-safe |
| Idempotency Key | Prevents duplicate side effects from the same business request | That the current executor is still the latest owner |

![Lease and Fencing Token](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/lease-fencing-token-late-write-71ae3731.webp)

## Gossip State Propagation: Letting Nodes Exchange Local Views

Gossip does not rely on a fixed node to maintain the complete cluster view. Every node keeps its own local view and exchanges state via peer-to-peer communication.

Nodes periodically pick other nodes to exchange information, causing state to diffuse across the cluster like a rumor. Once one node learns about a new member, a new failure, or a new version, it keeps passing that on to others. After multiple rounds of exchange, most nodes arrive at a similar view of the state.

Gossip itself is best suited for spreading "what I have observed," not for unilaterally deciding "what everyone must accept."

It typically offers eventual propagation and convergence rather than strict mutual exclusion or global write ordering. Gossip takes time to propagate, so different nodes may see different states at the same instant. The same message may also be delivered repeatedly, requiring version numbers, message IDs, timestamps, or similar mechanisms for deduplication. When a network partition occurs, separate partitions may reach different assessments and later rely on versions, epochs, or conflict-resolution policies to converge after recovery.

That said, not all Leaderless protocols are limited to eventual consistency. Leaderless consensus protocols like EPaxos can still provide strong consistency, though their implementation complexity and use cases differ from typical Leader-based protocols.

Real systems often mix multiple mechanisms. Redis Cluster is a classic example: nodes use the Cluster Bus and Gossip to propagate membership status, slot assignments, and failure observations; a node can first flag another node as `PFAIL`, and once a majority of Masters corroborate the failure observation, it upgrades to `FAIL`; Replica promotion additionally relies on majority voting, `currentEpoch`, and `configEpoch` to distinguish old configurations from new ones.

Thus, Gossip is better suited for "state propagation" and ill-suited to handling "strict mutual exclusion" or "strict write ordering" on its own. If a scenario demands a single owner at any point in time or linearizable writes, you still need consensus, majority voting, resource-side version checks, or Fencing Tokens.

## How to Choose Between These Mechanisms?

Start by looking at the consequence of a wrong decision.

If running a task an extra time merely consumes a bit more compute, or if it is acceptable for a node to briefly see slightly stale state, then state propagation and eventual convergence are usually sufficient. Examples include node discovery, health-status propagation, cache metadata dissemination, and non-critical state synchronization—all of which can consider Gossip or similar peer-to-peer propagation.

If a wrong decision leads to financial discrepancies, inventory corruption, metadata damage, or two primaries writing the same data simultaneously, prioritize Leader/Quorum, consensus algorithms, majority commits, and add Fencing Tokens when needed. Sacrificing a little availability and throughput here is almost always cheaper than fixing corrupted data afterward.

Next, look at system scale and write paths.

For a small control plane, managing via a Leader is usually simpler to maintain. When node counts are huge, state changes frequently, and each node only needs an approximate view, peer-to-peer propagation fits better. Gossip introduces redundant messages, yet avoids funneling all state updates through a single fixed node—at the cost of higher conflict-handling, message-deduplication, and state-debugging overhead.

You can use the table below for quick judgment:

| Mechanism | Primary Problem Solved | Consistency Characteristics | Typical Use Cases |
| --------- | ---------------------- | --------------------------- | ----------------- |
| Leader + Log Replication | Decides write order and metadata state | Can provide strong consistency | Config publishing, primary-replica failover, metadata changes |
| Quorum Voting | Determines whether a decision is valid | Depends on set intersection & protocol rules | Log commit, Leader election, failure confirmation |
| Lease / Lock | Temporarily grants execution eligibility | Eligibility can expire | Scheduled tasks, resource ownership, short critical sections |
| Fencing Token | Rejects late writes from stale owners | Relies on resource-side validation | Databases, object storage, external resource writes |
| Gossip | Disseminates membership and state info | Typically converges eventually | Service discovery, health state, cache metadata |
| Queue / Shard Claiming | Distributes work across multiple Workers | Typically at-least-once | Batch processing, consumer jobs, shard scanning |

![Distributed coordination mechanism selection](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-coordination-mechanism-selection-5334a00c.webp)

Real-world systems almost always combine these mechanisms.

For instance, the control plane uses a Leader and majority Quorum to protect metadata while the data plane spreads requests as widely as possible; cluster membership state spreads via Gossip, while actual failover still goes through voting and Epochs; task scheduling may have a central scheduler or let executors self-trigger, while still relying underneath on database conditional updates, ZooKeeper, etcd, or message queues.

## How Should the 3-Instance Scheduled Job Actually Be Designed?

For that 2:00 AM scheduled job from the beginning, there is more than one common approach:

1. Elect a scheduling Leader and let it create the job.
2. Have all instances trigger simultaneously, competing for execution rights via a database unique key, conditional update, or distributed lock.
3. Have the scheduler merely emit job messages, letting a consumer group claim and process shards.
4. Split the job into multiple shards so each instance only processes the shards it claims.

Regardless of the approach, you should never rely solely on "definitely only one instance will run this time." A sturdier design typically includes:

- A unique task ID on the scheduling record;
- Conditional updates, version numbers, or leases when claiming tasks;
- Idempotent business processing;
- Timeout-based reclamation and re-claiming of stalled tasks;
- Fencing Tokens or resource version checks when touching shared external resources;
- Persisted execution progress to resume from checkpoints after failures.

If tasks are short and re-running after failure is cheap, a database unique key or message queue is usually enough. If a task holds external resources for a long time, or if an old executor waking up and writing could cause corruption, you need Leases, Fencing Tokens, idempotency keys, and state machines.

## How to Answer This in an Interview?

If an interviewer asks "What is the difference between centralized and decentralized designs in distributed systems?", do not immediately pit Leader against Gossip as polar opposites. A better answer order is: first explain why coordination is needed, then split the problem into "decision" and "propagation," and finally cover split-brain, Lease, Fencing Token, and selection trade-offs.

You can answer like this:

> In a distributed system, for multiple nodes to accomplish work together, they must solve coordination problems such as membership management, task assignment, failover, and write ordering.
>
> I split the problem into two categories: decision problems—such as who is the Leader, whether a log entry is committed, and who currently owns a resource—and propagation problems—such as how membership status, failure observations, and configuration versions spread to other nodes.
>
> Leader, Quorum, and consensus protocols mainly solve decision problems. Having a Leader does not automatically mean a single point of failure; what matters is whether it is backed by log replication, multiple replicas, and majority election. To prevent split-brain, systems typically use majorities, Term/Epoch, election restrictions, and log-matching rules.
>
> Gossip mainly solves state propagation. It is well-suited for propagating membership and health status, but unsuitable on its own for strict mutual exclusion or global write ordering. Real systems frequently combine both—for example, Gossip spreads failure observations while majority voting and Epochs decide primary promotion.
>
> When locks or task ownership are involved, we also have to consider Leases and Fencing Tokens. A Lease reclaims credentials from disconnected clients, yet cannot prove an old client has stopped running; Fencing Tokens require validation on the resource side to reject late writes from an old owner. On the business side, idempotency keys, unique constraints, or state machines are also needed to handle duplicate executions.

This answer already covers most interview scenarios. If the interviewer follows up further, you can expand along the questions below.

### Does Having a Leader Always Mean a Single Point of Failure?

Not necessarily.

If a Leader keeps state only in its own memory and has no replica to take over upon crashing, then it is a single point of failure. In many distributed systems, however, the Leader acts more like a "current decision-maker": it receives write requests, advances logs, or assigns tasks, while replicating state to multiple nodes. When the Leader crashes, remaining nodes elect a new Leader using existing logs and a majority Quorum.

So to judge whether something is a single point of failure, do not just look at whether a Leader exists—check 3 things:

- Whether the Leader's state is persisted and replicated across multiple nodes;
- Whether a new Leader can be elected automatically if the Leader goes down;
- Whether the new Leader can retrieve all previously committed state.

### How Do You Prevent Split-Brain?

The risk of split-brain is that multiple partitions all believe they have the authority to accept writes.

The standard approach uses majorities and term control. Only a set of nodes holding a majority Quorum can elect a Leader or commit writes—at least 2 out of 3 nodes, or 3 out of 5 nodes. After a network partition, the minority side cannot reach a majority and therefore cannot keep committing new coordinated writes.

Terms distinguish new Leaders from old ones. `Term` in Raft and `Epoch` in ZAB follow the same idea. Once a node sees a higher term, it rejects protocol requests from older terms, so even if an old Leader recovers from network isolation or a long pause, it cannot keep advancing internal logs under its stale identity.

However, this mainly protects internal coordination-system state. Business resources can still suffer late writes when an old client resumes—that is where Fencing Tokens come in: each time a lock or permission is acquired, an incrementing token is issued and sent along with resource writes, and the resource side rejects older, smaller tokens.

### Can Gossip Only Provide Eventual Consistency?

Pure Gossip state propagation generally handles only information dissemination and eventual convergence, rather than directly providing strict mutual exclusion or global write ordering.

However, "no fixed Leader" cannot be equated with "eventual consistency." There are Leaderless consensus protocols that still provide strong consistency, though their engineering implementation is more complex. In real projects, the more common combination is: Gossip spreads membership states and failure reports, while Quorum, Epoch, log replication, or resource-side validation makes the final decisions.

### How Do You Frame Technology Choices in Your Projects?

When discussing project experience, do not simply say "We used ZooKeeper/Redis/etcd." Explain the reasoning behind your choice.

For scenarios like distributed locks, configuration updates, primary failover, and shard ownership, you can say:

> Errors in updating this kind of state are costly, so I prioritize coordination components with majority Quorum and session/lease semantics. After a lock or owner expires, we also account for late writes if an old client resumes. If the resource side supports version checking, we add Fencing Tokens as a safeguard.

For scenarios like service discovery, node state propagation, and cache cluster membership, you can say:

> This kind of information tolerates brief inconsistency and prioritizes scalability and propagation cost. We can accept gradual convergence via Gossip or similar mechanisms, while handling duplicate messages, stale state, and version conflicts after network partitions heal.

Answering at this level moves well beyond reciting definitions of "centralized vs. decentralized" and speaks directly to the most critical trade-offs in distributed systems: decision making, propagation, leases, idempotency, and failure recovery.

## References

- [Kubernetes CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [The Raft Consensus Algorithm](https://raft.github.io/)
- [In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf)
- [ZooKeeper Internals: Atomic Broadcast, Leader Activation, Quorums](https://zookeeper.apache.org/doc/current/zookeeperInternals.html)
- [ZooKeeper Administrator's Guide: Clustered Setup and Quorum Deployment Recommendations](https://zookeeper.apache.org/doc/current/zookeeperAdmin.html)
- [Redis Cluster Specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
- [etcd API: Lease API](https://etcd.io/docs/v3.7/learning/api/)
- [EPaxos](https://efficient.github.io/epaxos/)
- [How to do distributed locking - Martin Kleppmann](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Epidemic Algorithms for Replicated Database Maintenance](https://dl.acm.org/doi/10.1145/43921.43922)
