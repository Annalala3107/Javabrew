---
title: "Distributed Systems Knowledge Base: Fundamentals, Theory & Protocols, RPC, API Gateway, Locks, Transactions, and Distributed ID"
description: "Distributed systems interview and learning roadmap covering distributed system fundamentals, centralized vs. decentralized coordination, CAP, BASE, the Byzantine Generals Problem, Paxos, Raft, ZAB, Gossip, consistent hashing, RPC, API gateways, distributed locks, distributed transactions, and ZooKeeper."
category: Distributed Systems
tag:
  - Distributed Systems
  - System Design
  - Backend Interview
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Distributed Systems,Distributed Systems Fundamentals,Distributed Systems Interview Questions,Centralized,Decentralized,CAP,BASE,Byzantine Generals Problem,Paxos,Raft,ZAB,Gossip,RPC,Dubbo,API Gateway,Distributed ID,Distributed Lock,Distributed Transaction,Configuration Center,ZooKeeper,Backend Interview
lang: en
sourceRef: zh-ref/distributed-system/README.md
---

This **Distributed Systems Knowledge Base** is designed for backend engineering study, system design, and interview preparation. It organizes all distributed-systems articles on this site in the progression: "Distributed Fundamentals -> Communication & Calls -> Service Governance -> Consistency & Coordination -> Engineering Practice."

If you are just getting started with distributed systems, begin with [Distributed Systems Fundamentals](./distributed-system-intro.md) to build an overall mental model. If you are short on time, start with [Distributed Systems Interview Questions Summary](./distributed-system-interview-questions.md) to quickly establish a checklist of high-frequency topics. When the role specifically evaluates microservices, review [Microservices Interview Questions Summary](./microservices-interview-questions.md) next to connect service decomposition, communication, data consistency, and stability.

## Who Is This For

- Backend developers studying distributed systems systematically.
- Candidates preparing for campus recruiting, experienced-hire roles, or backend interviews at mid-to-large tech companies.
- Engineers looking to strengthen their grasp of distributed theory, engineering practice, and architectural trade-offs.
- Developers who have already written business code, yet lack a solid understanding of the underlying principles behind RPC, distributed locks, distributed transactions, and configuration centers.

## Learning Focus

- Why do distributed systems have to make trade-offs among consistency, availability, performance, and complexity?
- What problems do CAP, BASE, Paxos, Raft, ZAB, Gossip, and consistent hashing each solve?
- What responsibilities do RPC, API gateways, configuration centers, and service registries handle in a microservices architecture?
- What are the common solutions and pitfalls for distributed IDs, distributed locks, and distributed transactions in real-world business scenarios?
- How can you connect "concepts, principles, scenarios, solution comparisons, and production experience" into a cohesive interview answer?

## How These Articles Connect

You can follow this set of articles along four main tracks:

The first track is **Theory**: [Distributed Systems Fundamentals](./distributed-system-intro.md) starts by explaining why multi-node systems become complex; [CAP Theorem and BASE Theory Explained](./protocol/cap-and-base-theorem.md) explains how consistency and availability are traded off when network partitions occur; and [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md) connects Leader, Quorum, Lease, Fencing Token, and Gossip along the same line of reasoning.

The second track is **Service Calls**: [RPC Topic](./rpc/) addresses how services invoke one another; [API Gateway Explained](./api-gateway.md) explains how external traffic enters the system; and [Spring Cloud Gateway Interview Questions Summary](./spring-cloud-gateway-questions.md) dives into routing, predicates, filters, and rate limiting in Spring Cloud Gateway.

The third track is **Data Consistency**: [Distributed ID Generation Solutions Explained](./distributed-id.md) solves global uniqueness; [Distributed ID Design in Practice](./distributed-id-design.md) applies ID design to business entities such as order numbers, coupons, and short URLs; and [Distributed Locks](./distributed-lock.md) and [Distributed Transactions](./distributed-transaction.md) address cross-node mutual exclusion and cross-service write consistency.

The fourth track is **Coordination Components**: [Distributed Configuration Center Explained](./distributed-configuration-center.md) covers configuration publishing and client-side fault tolerance; and the [ZooKeeper Topic](./distributed-process-coordination/zookeeper/) covers coordination concepts, ZAB, sessions, Watchers, and hands-on Curator usage.

## Recommended Reading Order

1. [Distributed Systems Fundamentals](./distributed-system-intro.md): First understand what a distributed system is and why splitting across multiple nodes introduces communication, failure, and consistency challenges.
2. [Distributed Systems Interview Questions Summary](./distributed-system-interview-questions.md): Build a high-frequency question checklist so you know what interviewers test most often.
3. [Microservices Interview Questions Summary](./microservices-interview-questions.md): Understand service decomposition, inter-service communication, data consistency, stability, and migration issues.
4. [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md): Understand the relationships among Leader, Quorum, Gossip, Lease, split-brain, and Fencing Tokens.
5. [CAP Theorem and BASE Theory Explained](./protocol/cap-and-base-theorem.md): Grasp the core trade-off logic in distributed systems.
6. [Byzantine Generals Problem Explained](./protocol/byzantine-generals-problem.md): Understand malicious nodes, fault assumptions, and BFT fault-tolerance boundaries in consensus problems.
7. [RPC Remote Procedure Call Explained](./rpc/rpc-intro.md): Master how services communicate and which engineering challenges RPC frameworks solve.
8. [Distributed ID Generation Solutions Explained](./distributed-id.md), [Introduction to Distributed Locks](./distributed-lock.md), and [Distributed Transaction Solutions Explained](./distributed-transaction.md): Solidify high-frequency engineering practices.
9. [ZooKeeper Getting Started Guide](./distributed-process-coordination/zookeeper/zookeeper-intro.md) and [Distributed Configuration Center Explained](./distributed-configuration-center.md): Understand distributed coordination and configuration governance.

## Core Articles

### Distributed Fundamentals, Theory, and Protocols

This section builds foundational intuition for distributed systems, focusing on consistency, availability, partition tolerance, consensus algorithms, and data distribution.

- [Distributed Systems Fundamentals](./distributed-system-intro.md): Understand the definition of distributed systems, architectural evolution, typical characteristics, common system types, and a structured learning path.
- [Microservices Interview Questions Summary](./microservices-interview-questions.md): Connect service decomposition, RPC and messaging, data ownership, distributed transactions, fault tolerance, observability, and migration.
- [Distributed Theory, Algorithms, and Protocols Topic](./protocol/): Bring CAP, BASE, Paxos, Raft, ZAB, Gossip, and consistent hashing together onto a unified learning track.
- [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md): Connect Leader/Quorum, split-brain, Lease, Fencing Token, and Gossip to understand two key questions: "Who makes decisions?" and "How does state propagate?"
- [CAP Theorem and BASE Theory Explained](./protocol/cap-and-base-theorem.md): Understand consistency, availability, partition tolerance, and eventual consistency.
- [Byzantine Generals Problem Explained](./protocol/byzantine-generals-problem.md): Understand consensus challenges with malicious nodes, the `3m + 1` node requirement, and BFT fault tolerance.
- [Raft Algorithm Explained](./protocol/raft-algorithm.md): Start with a more approachable consensus algorithm to learn Leader election and log replication.
- [Paxos Algorithm Explained](./protocol/paxos-algorithm.md): Fill in the roles, workflow, and difficulties of the classic consensus algorithm.
- [ZAB Protocol Explained](./protocol/zab.md): Understand ZooKeeper's atomic broadcast, crash recovery, and transaction log mechanisms.
- [Gossip Protocol Explained](./protocol/gossip-protocol.md): Understand information dissemination and eventual consistency across large-scale node clusters.
- [Consistent Hashing Algorithm Explained](./protocol/consistent-hashing.md): Understand data distribution in distributed caches, load balancing, and database sharding.

### RPC and Service Invocation

RPC addresses the engineering complexity of remote service calls, including serialization, network transport, service discovery, load balancing, timeouts and retries, and service governance.

- [RPC Topic](./rpc/): Build a complete understanding of service invocation from RPC fundamentals and Dubbo to the relationship between HTTP and RPC.
- [RPC Remote Procedure Call Explained](./rpc/rpc-intro.md): Understand the RPC call flow, dynamic proxies, serialization, network transport, and framework selection.
- [Dubbo Interview Questions Summary](./rpc/dubbo.md): Connect Dubbo architecture, service export and reference, SPI, load balancing, and cluster fault tolerance.
- [With HTTP Already Available, Why Do We Still Need RPC?](../cs-basics/network/http-vs-rpc.md): Clarify the layering relationship and selection boundaries between HTTP and RPC.

### API Gateway and Traffic Entry

API gateways handle unified ingress, request routing, authentication and authorization, rate limiting and circuit breaking, canary releases, and CORS, serving as a critical entry layer in microservices architectures.

- [API Gateway Explained](./api-gateway.md): Understand request routing, authentication and authorization, rate limiting and circuit breaking, load balancing, and dual-layer gateway architectures.
- [Spring Cloud Gateway Interview Questions Summary](./spring-cloud-gateway-questions.md): Master Predicate, GatewayFilter, GlobalFilter, rate limiting and circuit breaking, and common production issues.

### Distributed ID, Locks, and Transactions

This section focuses on practical engineering implementation, commonly seen in orders, payments, flash sales, inventory deduction, data consistency, and cross-service collaboration.

- [Distributed ID Generation Solutions Explained](./distributed-id.md): Compare UUID, database auto-increment, segment mode, Redis, Snowflake, Leaf, Tinyid, and other approaches.
- [Distributed ID Design in Practice](./distributed-id-design.md): Explore business ID design through real scenarios such as order numbers, payment codes, coupons, and unified QR payments.
- [Introduction to Distributed Locks](./distributed-lock.md): Understand mutual exclusion semantics, lock granularity, safe release, timeout renewal, and Fencing Tokens.
- [Distributed Lock Implementations Explained](./distributed-lock-implementations.md): Compare Redis, Redisson, Redlock, ZooKeeper, and Curator distributed locks.
- [Distributed Transaction Solutions Explained](./distributed-transaction.md): Systematically understand XA, AT, TCC, Saga, local message tables, transactional messages, and best-effort notification.

### Configuration Center and ZooKeeper

Configuration centers and ZooKeeper primarily address service configuration, service registration and discovery, distributed coordination, and cluster consistency.

- [Distributed Configuration Center Explained](./distributed-configuration-center.md): Compare Apollo, Nacos, Spring Cloud Config, and Kubernetes ConfigMap.
- [ZooKeeper Topic](./distributed-process-coordination/zookeeper/): Progress from core ZooKeeper concepts to ZAB, Leader election, Curator, and practical distributed locks.
- [ZooKeeper Getting Started Guide](./distributed-process-coordination/zookeeper/zookeeper-intro.md): Master ZNode, Watcher, ACL, and typical application scenarios.
- [ZooKeeper Advanced Guide](./distributed-process-coordination/zookeeper/zookeeper-plus.md): Understand the ZAB protocol, Leader election, cluster deployment, and session management.
- [ZooKeeper Hands-On Tutorial](./distributed-process-coordination/zookeeper/zookeeper-in-action.md): Practice using Docker, zkCli, four-letter commands, and Curator.

## High-Frequency Questions

- Why can't a distributed system perfectly satisfy consistency, availability, and partition tolerance at the same time?
- What is the relationship between CAP and BASE? Which scenarios suit eventual consistency?
- Why do distributed systems need coordination? Which scenarios suit centralized vs. decentralized approaches?
- What are the differences among Paxos, Raft, and ZAB, and where is each used?
- What is the difference between RPC and HTTP? Why is RPC commonly used for internal service calls?
- How can a distributed ID guarantee global uniqueness, roughly monotonic growth, and business readability?
- What pitfalls exist with Redis distributed locks? Is Redlock always reliable?
- What distributed transaction solutions exist? Which scenarios fit TCC, Saga, and local message tables?
- What is the difference between a configuration center and a service registry? How do you choose among Apollo, Nacos, and Spring Cloud Config?
- How should microservices be split? Under what circumstances does decomposition turn into a distributed monolith?
- How do microservices handle communication failures, cross-service data consistency, and canary releases?

## Related Topics

- [System Design](../system-design/)
- [High Availability System Design](../high-availability/)
- [High Performance System Design](../high-performance/)
- [Computer Networks](../cs-basics/network/)
