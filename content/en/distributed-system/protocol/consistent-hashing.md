---
title: "Consistent Hashing Algorithm Explained: Hash Ring, Virtual Nodes, Data Skew, and Distributed Cache Applications"
category: Distributed Systems
description: "An in-depth guide to the Consistent Hashing algorithm, explaining the hash ring, node scaling, virtual nodes, data skew, and load-balancing principles, as well as typical applications in Redis, Memcached, distributed caches, and database sharding."
tag:
  - Distributed Protocols & Algorithms
  - Hashing Algorithms
head:
  - - meta
    - name: keywords
      content: consistent hashing,Consistent Hashing,hash ring,virtual nodes,data skew,distributed cache,Redis,Memcached,load balancing,distributed algorithms
lang: en
sourceRef: zh-ref/distributed-system/protocol/consistent-hashing.md
---

Before we begin, let us look at two common scenarios:

1. **Load Balancing**: Due to heavy traffic, our website deploys multiple servers together providing the same service, while each server stores different local data. To ensure correct responses, requests with the same parameter (`key`)—such as requests from the same IP or the same user—need to be routed to the same server for processing.
2. **Distributed Caching**: Because the volume of cached data is too large, we deploy multiple cache servers together to provide caching services. Cached data needs to be distributed as evenly as possible across these cache servers, and given a `key`, we must be able to locate its corresponding cache server.

The essence of both scenarios is establishing a **stable mapping from a key to a server/node**.

Within the distributed protocols topic, Consistent Hashing solves **how data or requests are distributed across nodes**, not how multiple replicas reach agreement. For state propagation, see [Gossip Protocol Explained](./gossip-protocol.md); for write ordering and majority commits, see [Raft Algorithm Explained](./raft-algorithm.md).

To achieve this goal, what solution comes to mind first?

## Standard Hash Algorithm

You can probably immediately think of the classic **"hash + modulo"** combination. Compute a hash value for the key using a hash function, then take the modulo by the number of servers to map the key onto a fixed server.

The formula is simple:

```java
node_number = hash(key) % N
```

- `hash(key)`: Use a hash function (fast non-cryptographic hash functions such as SipHash, MurMurHash3, CRC32, or DJB are recommended) to hash the unique key.
- `% N`: Take the modulo of the hash value to map it to an integer between `0` and `N - 1`, where `N` is the number of nodes/servers.

![Hash modulo mapping](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/hashqumo-e3dbee77.png)

However, the traditional hash-modulo algorithm has a major flaw: **it does not handle dynamic shrinking (e.g., a machine crashing) or expansion (e.g., adding a new machine) of nodes very well.**

Imagine starting with 4 servers (`N = 4`). If one server crashes, `N` becomes `3`. For the exact same key, `hash(key) % 3` is very likely to produce a completely different result from `hash(key) % 4`.

![Hash modulo after removing Node2](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/hashqumo-remove-node2-01fc17fc.png)

This means almost all data mappings become scrambled. In a distributed cache scenario, this causes **widespread cache invalidation and cache penetration**, sending a sudden flood of traffic straight to the backend database and triggering a system avalanche.

It is estimated that when the node count changes from `N` to `N - 1`, on average `(N - 1) / N` of all data must be migrated—a proportion that **approaches 100%**. This "pull one hair and the whole body moves" effect is completely unacceptable in production environments.

To solve this problem effectively, the Consistent Hashing algorithm was born.

## Consistent Hashing Algorithm

Consistent Hashing was proposed by MIT in 1997 (the paper PDF is available online at <https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf>). It is a special hashing algorithm designed so that adding or removing a server changes as few existing mappings between requests and handling servers as possible. Consistent Hashing resolves the dynamic scaling issues present in traditional hashing within Distributed [Hash Tables](https://baike.baidu.com/item/哈希表/5981869) (DHT).

The underlying principle of Consistent Hashing is quite simple—the key lies in introducing a **hash ring**.

### Hash Ring

Consistent Hashing organizes the hash space into a circular ring structure, maps both data and nodes onto this ring, and then determines which node owns a piece of data or request by walking clockwise. Typically, the hash ring starts at `0` and ends at `2^32 - 1`, with the start and end connected, giving an integer range of **[0, 2^32 - 1]**.

Whereas traditional hashing takes the modulo by the number of servers, Consistent Hashing takes the modulo by the fixed size of the hash ring—usually `2^32`:

```java
node_number = hash(key) % 2^32
```

How are servers/nodes mapped onto the hash ring? Also via hash + modulo. For example, we typically hash a server's IP address or hostname and take the modulo:

```java
hash(server_ip) % 2^32
```

As illustrated below:

![Hash ring](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-ed543dba.png)

We map both data and nodes onto the hash ring, where each node on the ring is responsible for an arc segment. In the diagram above, each node is responsible for the following data:

- **Node1:** Responsible for the region between Node4 and Node1 (containing `value6`).
- **Node2:** Responsible for the region between Node1 and Node2 (containing `value1`, `value2`).
- **Node3:** Responsible for the region between Node2 and Node3 (containing `value3`).
- **Node4:** Responsible for the region between Node3 and Node4 (containing `value4`, `value5`).

### Node Removal and Addition

When adding or removing nodes, the hash ring prevents the blast radius from spreading globally and minimizes the amount of data that needs to be migrated.

Using the hash ring illustration above, suppose `Node2` is removed. Then `Node3` takes over `Node2`'s data—you simply migrate `Node2`'s data to `Node3`, while all other nodes remain unaffected.

![Node removal on the hash ring](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-remove-node2-155b8c42.png)

Similarly, if we add a new node `Node5` between `Node1` and `Node2`, then part of the data previously owned by `Node2` (namely data whose hash falls between `Node1` and `Node5`, such as `value1` in the diagram) is now handled by `Node5`. We only need to migrate that portion of data from `Node2` to `Node5`—again affecting only adjacent nodes with a very small impact scope.

![Node addition on the hash ring](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-add-node5-92275514.png)

### Data Skew Problem

Ideally, nodes are evenly distributed around the ring. Reality, however, may look quite different—especially when the number of nodes is small. Nodes may happen to hash into adjacent regions, causing the vast majority of data to fall onto a single node.

![Data skew on the hash ring](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-unbalance-bbbbaff3.png)

In the diagram above, each node owns the following data:

- **Node1:** Responsible for the region between Node4 and Node1 (containing `value6`).
- **Node2:** Responsible for the region between Node1 and Node2 (containing `value1`).
- **Node3:** Responsible for the region between Node2 and Node3 (containing `value2`, `value3`, `value4`, `value5`).
- **Node4:** Responsible for the region between Node3 and Node4.

Beyond data skew, there is another hidden danger: uneven redistribution when nodes are added or removed. For instance, if `Node3` is removed, all of `Node3`'s data moves to `Node4`, and all subsequent requests hit `Node4`. If `Node4` has weaker hardware capacity, it may get knocked down immediately. Ideally, multiple nodes should share the load.

How do we solve these problems? The answer is introducing **virtual nodes**.

### Virtual Nodes

Virtual nodes are multiple logical replicas created on the hash ring for each real physical node. Any data landing on a virtual node actually maps to its underlying physical node, and by scattering virtual nodes evenly across all parts of the hash ring, distribution becomes balanced.

As shown below, each of the 4 nodes—Node1, Node2, Node3, and Node4—corresponds to 3 virtual nodes (the diagram is simplified for illustration; real-world placement will not look this uniformly spaced).

![Virtual nodes on the hash ring](/media/jg/ext/oss.javaguide.cn/distributed-system/protocol/consistent-hashing/consistent-hashing-circle-virtual-node-6e0f65a3.png)

In the diagram above, the data each physical node ultimately handles is:

- **Node1**: `value4`
- **Node2**: `value1`, `value3`
- **Node3**: `value5`
- **Node4**: `value2`, `value6`

**The benefits of introducing virtual nodes are huge:**

1. **Balanced Data Distribution:** The more virtual nodes there are, the denser the "server points" along the ring become, making data distribution naturally more uniform and fundamentally solving data skew. Typically, each physical node maps to between 100 and 200 virtual nodes—for example, Nginx allocates 160 virtual nodes per unit of weight. Weights differentiate server capacity: higher-capacity servers receive higher weights and therefore more virtual nodes, giving them a higher probability of being selected.
2. **Enhanced Fault Tolerance:** This is the most elegant aspect of virtual nodes. When a physical node crashes, it is equivalent to multiple virtual nodes across the ring going offline simultaneously. The data and traffic previously served by those virtual nodes are **naturally and evenly dispersed** across **multiple different** remaining physical nodes on the ring, rather than dumping all pressure onto a single neighbor. This dramatically improves system stability and fault tolerance.

## References

- [Deep Dive into Nginx Load Balancing Algorithms (in Chinese)](https://www.taohui.tech/2021/02/08/nginx/%E6%B7%B1%E5%85%A5%E5%89%96%E6%9E%90Nginx%E8%B4%9F%E8%BD%BD%E5%9D%87%E8%A1%A1%E7%AE%97%E6%B3%95/)
- [Reading Source Code to Learn Architecture Series: Consistent Hashing (in Chinese)](https://zhaoyang.me/posts/consistent-hash-algorithm/)
- [Summary of Consistent Hashing Algorithm Principles (in Chinese)](https://mp.weixin.qq.com/s/WTz1KA9kOGrqFVTtALJzjQ)
