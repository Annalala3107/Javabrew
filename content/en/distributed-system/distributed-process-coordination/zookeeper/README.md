---
title: "ZooKeeper Topic: Core Concepts, ZNode, Watcher, ZAB, Cluster Deployment, Curator, and Distributed Locks"
description: "ZooKeeper interview and distributed coordination learning roadmap covering ZNode, node types, Watcher, ACL, the ZAB protocol, Leader election, cluster deployment, Curator, and distributed locks."
category: Distributed Systems
tag:
  - ZooKeeper
  - Distributed Coordination
  - Distributed Lock
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: ZooKeeper,ZooKeeper Getting Started,ZooKeeper Advanced,ZNode,Watcher,ZAB Protocol,Leader Election,Curator,Distributed Coordination,Distributed Lock,Service Registry,Backend Interview
lang: en
sourceRef: zh-ref/distributed-system/distributed-process-coordination/zookeeper/README.md
---

ZooKeeper is a classic distributed coordination component commonly used as a service registry, configuration management system, distributed lock provider, Leader election coordinator, and cluster metadata store. When learning ZooKeeper, start by mastering its data model and Watcher mechanism, and then move on to the ZAB protocol, Leader election, and engineering practices.

## Who Is This For

- Backend developers looking to study ZooKeeper systematically.
- Candidates preparing for interviews involving ZooKeeper, service registries, distributed locks, or distributed coordination.
- Readers who have used ZooKeeper or Curator before, yet are not sufficiently familiar with ZNode, Watcher, ZAB, or Leader election.
- Engineers who need to compare ZooKeeper with Eureka, Nacos, and other service registries or coordination components.

## Learning Focus

- Why does ZooKeeper use a tree-structured ZNode data model?
- Which problems are ephemeral nodes, sequential nodes, and the Watcher mechanism each suited to solve?
- How does ZooKeeper handle message broadcast, primary-backup synchronization, and crash recovery via the ZAB protocol?
- Why is a ZooKeeper cluster generally recommended to be deployed with an odd number of nodes?
- How does Curator simplify native ZooKeeper client development and distributed lock implementations?

## Relationship with Other Articles

[Distributed Coordination Explained](../../protocol/centralized-and-decentralized.md) first explains general concepts such as Leader, Quorum, split-brain, and leases; this ZooKeeper topic grounds those problems in ZNode, Watcher, Session, and ZAB.

[ZAB Protocol Explained](../../protocol/zab.md) focuses strictly on ZooKeeper's atomic broadcast and crash recovery without diving into ZNode, Curator commands, or application scenarios. To see real commands and client code, continue reading [ZooKeeper Hands-On Tutorial](./zookeeper-in-action.md).

## Recommended Reading Order

1. [Distributed Coordination Explained](../../protocol/centralized-and-decentralized.md): First understand common problems in distributed coordination such as Leader, Quorum, split-brain, and leases.
2. [ZooKeeper Getting Started Guide](./zookeeper-intro.md): Next understand ZNode, Watcher, ACL, and typical application scenarios.
3. [ZooKeeper Advanced Guide](./zookeeper-plus.md): Continue filling in ZAB, Leader election, cluster deployment, and session mechanisms.
4. [ZooKeeper Hands-On Tutorial](./zookeeper-in-action.md): Finally practice with Docker, zkCli, four-letter commands, and Curator.

## Core Articles

- [ZooKeeper Getting Started Guide](./zookeeper-intro.md): Covers core ZooKeeper concepts, the ZNode data model, node types, the Watcher event-listening mechanism, ACL access control, and typical application scenarios.
- [ZooKeeper Advanced Guide](./zookeeper-plus.md): Dives deep into the ZAB protocol, Leader election, cluster deployment strategies, the odd-node-count principle, session management, and comparisons with registries such as Eureka and Nacos.
- [ZooKeeper Hands-On Tutorial](./zookeeper-in-action.md): Covers Docker installation and deployment, common zkCli commands, four-letter commands, Curator Java client CRUD operations, and distributed lock examples.

## High-Frequency Questions

- Which distributed coordination problems is ZooKeeper well-suited to solve?
- What types of ZNodes exist? Why are ephemeral sequential nodes commonly used for distributed locks?
- Why is a Watcher a one-time trigger? What caveats should you keep in mind when using it?
- How does the ZAB protocol relate to Raft and Paxos?
- Why is a ZooKeeper cluster usually deployed with an odd number of nodes?
- What are the differences between ZooKeeper, Eureka, and Nacos when used as a service registry?
- Which development pain points does Curator solve compared to the native ZooKeeper client?

## Related Topics

- [Distributed Systems Knowledge Base](../../)
- [Distributed Theory, Algorithms, and Protocols Topic](../../protocol/)
- [Distributed Coordination Explained](../../protocol/centralized-and-decentralized.md)
- [ZAB Protocol Explained](../../protocol/zab.md)
- [Distributed Lock Implementations Explained](../../distributed-lock-implementations.md)
- [Distributed Configuration Center Explained](../../distributed-configuration-center.md)
