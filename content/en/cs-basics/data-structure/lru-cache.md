---
title: "LRU Cache Interview Summary: Hash Table, Doubly Linked List, and LinkedHashMap"
description: Summary of LRU Cache interview questions, explaining LRU eviction policy, implementation using Hash Table and Doubly Linked List, Java LinkedHashMap usage, complexity, and practical caching scenarios.
category: Computer Science Fundamentals
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: LRU Cache,LRU,Cache Eviction,Hash Table,Doubly Linked List,LinkedHashMap,Java LRU,Page Replacement,Data Structure Interview
lang: en
sourceRef: zh-ref/cs-basics/data-structure/lru-cache.md
---

LRU is an acronym for Least Recently Used. When cache capacity is reached, the data that has not been accessed for the longest time needs to be evicted.

Handwriting an LRU Cache is a very high-frequency interview topic because it elegantly combines a Hash Table and a Doubly Linked List: the Hash Table is responsible for `O(1)` node lookup, while the Doubly Linked List is responsible for `O(1)` node movement and tail eviction.

Table of Contents:

1. What is an LRU Cache?
2. Why is LRU suitable for cache eviction?
3. Why do we need Hash Table + Doubly Linked List?
4. How to handwrite `get` and `put`?
5. How does Java `LinkedHashMap` implement LRU?
6. What else must be considered in real-world engineering LRU?

![LRU Cache maintains recent access order using a Hash Table and a Doubly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/lru-cache-6035d197.png)

## What is an LRU Cache?

The core conflict of caching is: space is limited, but we want to retain the data most likely to be accessed again in memory.

The problem is that programs cannot predict the future. LRU's approach is to use "recently accessed" as an approximation to predict "likely to be accessed in the near future." If a piece of data was accessed just now, it is likely to be accessed again soon; if a piece of data has not been accessed for a long time, it should be prioritized for eviction when the cache is full.

For example, given a cache with a capacity of 2, consider the following sequence of accesses:

```text
put(1, 1)
put(2, 2)
get(1)
put(3, 3)
```

Before `put(3, 3)`, the cache contains `1` and `2`. Although `1` was inserted earlier, it was just accessed via `get(1)`, making `2` the least recently used item; thus `2` should be evicted.

This example highlights a key point: LRU focuses not on "who was inserted first," but on "who has not been accessed for the longest time."

## Why Do We Need a Cache Eviction Policy?

Caches are not infinite in size. Whether it is local in-memory caches, Redis, database Buffer Pools, or OS page caches, all must deal with capacity limits.

Once capacity is exhausted, without an eviction policy, the system could only reject incoming data or delete items at random. Random deletion is simple, but it might evict very hot data, drastically degrading cache hit rates. LRU leverages temporal access patterns to make an empirical judgment: data that hasn't been touched for a long time generally has a lower probability of being accessed again in the short term.

A brief comparison of common eviction policies:

| Policy | Eviction Basis | Characteristics |
| --- | --- | --- |
| FIFO | Earliest data entered into cache | Simple to implement, but ignores subsequent access frequency |
| LRU | Data not accessed for the longest time | Well-suited for access patterns with temporal locality |
| LFU | Data with the fewest access counts | Suitable for long-term hot spots, but requires maintaining frequency counters |
| TTL | Expiration timestamp | Ideal for data with explicit lifespans; distinct from capacity eviction |

LRU is frequently featured in technical interviews because it represents real-world engineering while cleanly testing data structure synthesis.

## Interview Focus Points

- Clearly explain why using only a Hash Table or only a Linked List is insufficient.
- Write the logic for `get` and `put`.
- Explain what the head and tail of the Doubly Linked List represent.
- Handle edge cases such as reaching capacity, updating existing keys, and removing tail nodes.
- Understand how Java's `LinkedHashMap` can be leveraged to implement LRU.

## How is LRU Access Order Maintained?

In an LRU cache, every access alters the recency of data.

Conventionally:

- The head of the linked list represents the most recently used (MRU) data.
- The tail of the linked list represents the least recently used (LRU) data.
- On a `get(key)` hit, move the corresponding node to the head.
- In `put(key, value)`, if it is a new key, insert the new node at the head.
- In `put(key, value)`, if it is an existing key, update the value and also move it to the head.
- When capacity exceeds the limit, remove the tail node.

The step most commonly omitted is in `get()`. Many candidates assume `get()` only reads data and should not mutate the structure. However, in LRU, a read constitutes an access; as long as there is a cache hit, the recency timestamp of this key must be refreshed.

## Data Structure Design

| Component | Responsibility |
| --- | --- |
| `HashMap<Integer, Node>` | Quickly look up linked list nodes by key |
| Doubly Linked List | Orders elements by access time: head is MRU, tail is LRU |
| Dummy Head & Tail Nodes | Simplifies edge case handling for insertions and deletions |

After accessing a key, it must be moved to the head of the list. When inserting a new key, it is also placed at the head. When capacity is exceeded, the node immediately preceding the dummy tail is removed.

Why must both structures work in tandem?

Using only a Hash Table allows `O(1)` value lookups, but does not track which key was least recently used. You would need to separately maintain access ordering.

Using only a Linked List allows maintaining access order, where the tail is the eviction candidate. However, looking up a node by key requires a linear scan from head to tail with `O(n)` complexity.

Hash Table + Doubly Linked List perfectly complement each other:

- The Hash Table gives us direct `O(1)` access to any linked list node by key.
- The Doubly Linked List allows us to move nodes and delete the tail node in `O(1)`.
- Nodes store both key and value so that when the tail node is evicted, its corresponding key can be removed from the Hash Table.

## Step-by-Step Implementation Strategy for Interviews

LRU code involves numerous pointer details. Avoid writing the entire class all at once during an interview. Deconstruct the operations first:

1. Define the linked list order: head represents most recently used; tail represents least recently used.
2. Define `get`: return `-1` if not found; if found, move the node to head.
3. Define `put`: for an existing key, update value and move to head; for a new key, insert at head.
4. Handle eviction: when capacity is exceeded, delete the node before the dummy tail and remove its key from the Hash Table.
5. Encapsulate linked list operations into `addToHead`, `remove`, `moveToHead`, and `removeTail`.

The benefit of this modular structure is that `get` and `put` simply combine basic linked list primitives without repetitively juggling raw pointers in the main flow, drastically reducing mistakes.

## Why Use a Doubly Linked List?

To move an existing node to the head, you must detach it from its current position and insert it right after the dummy head.

If a singly linked list were used, deleting the current node would require knowing its predecessor node. Even if the Hash Table locates the current node directly, it cannot identify the preceding node, requiring an `O(n)` scan from the head.

Nodes in a Doubly Linked List have both `prev` and `next` pointers, making node removal a 4-pointer re-link:

```java
node.prev.next = node.next;
node.next.prev = node.prev;
```

This is the decisive reason why LRU requires a Doubly Linked List: it must not only evict the tail node, but also move arbitrary internal nodes to the head on `get()` hits and `put()` key updates.

Dummy head and tail nodes (sentinels) are equally critical. With `head` and `tail` sentinels, inserting at the head, deleting at the tail, and handling an empty list all share identical logic, avoiding scattered `null` checks.

## Handwritten LRU Implementation

```java
class LRUCache {
    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0);
    private final Node tail = new Node(0, 0);

    LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    int get(int key) {
        Node node = map.get(key);
        if (node == null) {
            return -1;
        }
        moveToHead(node);
        return node.value;
    }

    void put(int key, int value) {
        Node node = map.get(key);
        if (node != null) {
            node.value = value;
            moveToHead(node);
            return;
        }
        Node newNode = new Node(key, value);
        map.put(key, newNode);
        addToHead(newNode);
        if (map.size() > capacity) {
            Node removed = removeTail();
            map.remove(removed.key);
        }
    }

    private void moveToHead(Node node) {
        remove(node);
        addToHead(node);
    }

    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private Node removeTail() {
        Node node = tail.prev;
        remove(node);
        return node;
    }

    private static class Node {
        int key;
        int value;
        Node prev;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }
}
```

The time complexity of both `get` and `put` is `O(1)`, and the space complexity is `O(capacity)`.

## Step-by-Step Operation Walkthrough

Assume a capacity of 2, executed sequentially:

```text
put(1, 1)
put(2, 2)
get(1)
put(3, 3)
```

The linked list transitions are as follows (the left side represents MRU):

| Operation | List State | Description |
| --- | --- | --- |
| Initial State | Empty | Dummy head and tail connected; cache is empty |
| `put(1, 1)` | `1` | Insert new node at head |
| `put(2, 2)` | `2 -> 1` | `2` is MRU |
| `get(1)` | `1 -> 2` | After accessing `1`, move it to head |
| `put(3, 3)` | `3 -> 1` | Capacity exceeded; evict `2` at tail |

This table clarifies two essential points: accessing an existing node must refresh its usage order; when evicting, remove the least recently used tail node, not the newly inserted node.

## LinkedHashMap Implementation

Java's `LinkedHashMap` natively supports ordering elements by access order:

```java
class LRUCacheWithLinkedHashMap extends LinkedHashMap<Integer, Integer> {
    private final int capacity;

    LRUCacheWithLinkedHashMap(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}
```

The third argument in the constructor, `accessOrder`, is set to `true`, indicating that entries are ordered by access order rather than insertion order.

The official `LinkedHashMap` documentation explicitly highlights that this access-order mode is well-suited for building LRU caches. Keep two rules in mind:

1. When `accessOrder = false`, iteration follows insertion order; when `accessOrder = true`, iteration follows access order.
2. `removeEldestEntry()` is invoked after inserting a new mapping; when it returns `true`, the eldest entry is deleted.

However, `LinkedHashMap` is not thread-safe. If used directly in a multithreaded environment as a local cache, you must synchronize access externally or choose a mature caching library.

## How Does LRU Relate to Redis?

When Redis is used as a cache, it also needs an eviction policy once memory reaches the `maxmemory` ceiling. Redis supports policies such as `allkeys-lru` and `volatile-lru`:

- `allkeys-lru`: Evicts least recently used keys among all keys.
- `volatile-lru`: Evicts least recently used keys only among keys configured with an expiration TTL.

However, Redis's LRU is not the "exact LRU" asked in coding interviews. To save memory overhead and CPU cycles, Redis uses an approximate LRU: it randomly samples a small batch of keys and evicts the one with the oldest access time among them. The sample size can be adjusted via `maxmemory-samples`.

This distinction highlights the gap between interview problems and production engineering: interview problems typically demand exact LRU using Hash Table + Doubly Linked List; production systems make pragmatic trade-offs balancing memory overhead, throughput, concurrency, and hit ratios.

## Engineering Scenarios

- Local cache eviction.
- Operating system page replacement.
- Hotspot data caching.
- Low-capacity response caches in API gateways, client SDKs, or middleware.

Production implementations must also consider thread safety, expiration policies, memory limits, metrics instrumentation, and eviction callbacks. Coding interviews emphasize data structure design and pointer manipulation, so these production concerns do not need to be written into the code.

For local caching in Java applications, teams rarely handwrite an LRU cache from scratch, instead relying on libraries like Caffeine. The reason is pragmatic: production caches must handle expiration, concurrency, automatic loading, statistics, asynchronous refresh, and weighted entries. Caffeine's documentation categorizes eviction into size-based, time-based, and reference-based strategies.

## Interview Follow-up Questions

| Follow-up Question | Key Answer Focus |
| --- | --- |
| Why not use `HashMap` alone? | `HashMap` provides value lookup, but cannot track which key was least recently used. |
| Why not use a Linked List alone? | A Linked List maintains order, but finding a node by key takes `O(n)`. |
| Why use a Doubly Linked List? | Removing an arbitrary node requires rewiring both predecessor and successor; singly linked lists cannot find predecessors in `O(1)`. |
| Why use dummy head and tail nodes? | Unifies insertion and deletion logic for empty lists, head nodes, and tail nodes, avoiding branching logic. |
| How does `LinkedHashMap` implement LRU? | Enables `accessOrder` in the constructor and overrides `removeEldestEntry` to bound capacity. |
| What else must production caches handle? | Concurrency, TTL, maximum memory limits, eviction listeners, hit-rate metrics, and cache breakdown prevention. |

## Common Pitfalls

- When updating an existing key, remember to move it to the head.
- After removing the tail node, remember to delete its key from the Hash Table.
- When deleting a node from a Doubly Linked List, both forward and backward pointers must be updated.
- Dummy head and tail nodes eliminate tricky null checks on empty list boundaries.
- Set `accessOrder` to `true` when using `LinkedHashMap`.

## High-Frequency Self-Check Questions

- Why does LRU require both a Hash Table and a Doubly Linked List?
- Why must `get` operations also relocate nodes?
- When updating an existing key, why can't you simply overwrite the value?
- After evicting the tail node, why must its key be removed from the Hash Table?
- What is the difference between insertion order and access order in `LinkedHashMap`?

## Recommended Practice Problems

- [146. LRU Cache](https://leetcode.cn/problems/lru-cache/)
- [460. LFU Cache](https://leetcode.cn/problems/lfu-cache/)

## References

- [Java SE 17 API: LinkedHashMap](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/LinkedHashMap.html)
- [Redis Docs: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)
- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/)
- [Caffeine Wiki: Eviction](https://github.com/ben-manes/caffeine/wiki/Eviction)
