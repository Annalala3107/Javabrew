---
title: "Distributed Theory, Algorithms, and Protocols: CAP, BASE, Centralization vs. Decentralization, Paxos, Raft, and Consistent Hashing"
description: "A learning roadmap for distributed systems theory and protocols covering CAP, BASE, centralized vs. decentralized coordination, the Byzantine Generals Problem, Paxos, Raft, ZAB, Gossip, and Consistent Hashing—helping you understand consistency, fault tolerance, consensus, state propagation, and data distribution."
category: Distributed Systems
tag:
  - Distributed Theory
  - Distributed Protocols & Algorithms
  - Consensus Algorithms
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: distributed theory,distributed algorithms,distributed protocols,centralized,decentralized,CAP,BASE,Byzantine Generals Problem,Paxos,Raft,ZAB,Gossip,Consistent Hashing,consensus algorithms,Byzantine Fault Tolerance,BFT,eventual consistency,distributed systems interview questions
lang: en
sourceRef: zh-ref/distributed-system/protocol/README.md
---

Distributed theory, algorithms, and protocols form the foundation for understanding distributed systems. When studying this topic, it is best not to simply memorize conclusions; more importantly, you should understand the trade-offs between different approaches across consistency, availability, fault tolerance, consensus, performance, and engineering complexity.

## Who Is This For?

- Backend developers looking to systematically understand distributed consistency, consensus algorithms, and data distribution.
- Engineers preparing for interviews in distributed systems, system design, and backend architecture.
- Readers who currently only have a rote-memorized grasp of concepts like CAP, BASE, Paxos, Raft, ZAB, and Gossip.
- Engineers who need to understand the underlying mechanisms of ZooKeeper, Redis Cluster, distributed caches, and service discovery.

## Key Learning Points

- CAP and BASE are not just slogans—what real engineering trade-offs do they represent behind the scenes?
- What problems do centralized and decentralized designs solve? Which scenarios fit Leader-based, Quorum-based, and Gossip-based approaches?
- Paxos, Raft, and ZAB all solve consensus—why do they differ in engineering complexity and use cases?
- Why is Gossip well-suited for propagating state across large-scale nodes, and how does it differ from strong-consistency protocols?
- How does Consistent Hashing reduce data migration costs when nodes scale out or scale in?
- In an interview, how do you clearly explain a protocol using the structure: "Problem Background -> Core Idea -> Workflow -> Pros & Cons -> Use Cases"?

## How Do These Articles Complement Each Other?

[CAP Theorem and BASE Theory Explained](./cap-and-base-theorem.md) explains the trade-offs around "consistency, availability, and partition tolerance" in distributed systems. [Distributed Coordination Explained](./centralized-and-decentralized.md) moves further into engineering scenarios, discussing who makes decisions, why a stale Leader causes problems, and when Gossip should be used.

Paxos, Raft, and ZAB form the consensus protocol track. It is recommended to read [Raft Algorithm Explained](./raft-algorithm.md) first, followed by [Paxos Algorithm Explained](./paxos-algorithm.md) and [ZAB Protocol Explained](./zab.md). Raft is easier to start with, Paxos is closer to classical theory, and ZAB corresponds directly to ZooKeeper's atomic broadcast and crash recovery.

[Gossip Protocol Explained](./gossip-protocol.md) and [Consistent Hashing Algorithm Explained](./consistent-hashing.md) are not responsible for strongly consistent write ordering; instead, they solve state propagation and data mapping respectively. Reading these two after the consensus protocols helps avoid confusing "propagating state" with "reaching consensus."

## Recommended Reading Order

1. [CAP Theorem and BASE Theory Explained](./cap-and-base-theorem.md): First build a trade-off perspective on consistency, availability, and partition tolerance.
2. [Distributed Coordination Explained](./centralized-and-decentralized.md): Connect Leader, Quorum, split-brain, Lease, Fencing Token, and Gossip along a single storyline.
3. [Byzantine Generals Problem Explained](./byzantine-generals-problem.md): Understand malicious nodes, conflicting messages, the `3m + 1` node requirement, and BFT fault-tolerance boundaries.
4. [Raft Algorithm Explained](./raft-algorithm.md): Get started with consensus algorithms through relatively approachable Leader election and log replication.
5. [Paxos Algorithm Explained](./paxos-algorithm.md): Understand the roles, phases, and challenges of the classic consensus algorithm.
6. [ZAB Protocol Explained](./zab.md): Ground consensus algorithms in ZooKeeper's message broadcast and crash recovery scenarios.
7. [Gossip Protocol Explained](./gossip-protocol.md) and [Consistent Hashing Algorithm Explained](./consistent-hashing.md): Understand state propagation and data distribution in large-scale systems.

## Core Articles

### Consistency and Distributed Theory

- [CAP Theorem and BASE Theory Explained](./cap-and-base-theorem.md): Understand the trade-offs among consistency, availability, and partition tolerance, as well as the engineering meaning of BASE theory and eventual consistency.
- [Distributed Coordination Explained](./centralized-and-decentralized.md): Understand why distributed systems require coordination, and how Leader/Quorum, Gossip, Lease, and Fencing Token each address coordination problems.
- [Byzantine Generals Problem Explained](./byzantine-generals-problem.md): Understand how healthy nodes agree on the same result when malicious or faulty nodes exist.

### Consensus Algorithms

- [Paxos Algorithm Explained](./paxos-algorithm.md): Understand the Proposer, Acceptor, and Learner roles, the two-phase workflow, and Multi-Paxos optimizations.
- [Raft Algorithm Explained](./raft-algorithm.md): Understand Leader election, log replication, safety constraints, membership changes, and differences from Paxos.
- [ZAB Protocol Explained](./zab.md): Understand ZooKeeper Atomic Broadcast, message broadcast, crash recovery, ZXID, and transaction logs.

### Data Propagation and Data Distribution

- [Gossip Protocol Explained](./gossip-protocol.md): Understand anti-entropy, rumor mongering, Push/Pull modes, the SWIM protocol, and eventual consistency.
- [Consistent Hashing Algorithm Explained](./consistent-hashing.md): Understand the hash ring, virtual nodes, node scaling, data skew, and distributed cache applications.

## Frequently Asked Questions

- What do C, A, and P in CAP stand for? Why can partition tolerance usually not be sacrificed?
- What problems do BASE theory and eventual consistency solve?
- What is the difference between centralized and decentralized designs? Why does having a Leader not necessarily mean a single point of failure?
- Why is Paxos hard to understand? What is the difference between Basic Paxos and Multi-Paxos?
- Why is Raft easier to implement in engineering? How do Leader election and log replication ensure safety?
- What are the similarities and differences between ZAB and Raft?
- Which scenarios are suitable for the Gossip protocol? Why does it usually not provide strong consistency?
- Why does Consistent Hashing need virtual nodes?

## Related Topics

- [Distributed Systems Knowledge Map](../)
- [ZooKeeper Deep Dive](../distributed-process-coordination/zookeeper/)
- [Distributed Configuration Center Explained](../distributed-configuration-center.md)
- [Distributed ID Generation Solutions Explained](../distributed-id.md)
