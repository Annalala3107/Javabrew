---
title: "Skip List Interview Summary: Multi-Level Indexing, Range Queries, and Redis ZSet"
description: Summary of Skip List interview questions, explaining SkipList multi-level indexing, search, insertion, deletion, complexity, range queries, comparison with Red-Black Trees, and underlying implementation of Redis ZSet.
category: Computer Science Fundamentals
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Skip List,SkipList,Redis ZSet,Sorted Set,Range Query,Multi-level Index,Red-Black Tree Comparison,Redis Interview,Data Structure Interview
lang: en
sourceRef: zh-ref/cs-basics/data-structure/skip-list.md
---

A Skip List can be understood as an "ordered linked list with multi-level indices." A standard ordered linked list requires scanning from head to tail for lookups, resulting in a time complexity of `O(n)`. A Skip List adds multiple layers of indices on top of the linked list; during lookups, it can quickly skip a batch of nodes from higher layers and then descend layer by layer.

Redis's sorted set (ZSet) uses a combination of a Skip List and a Hash Table at its core, which is why Skip Lists frequently appear alongside Redis in backend engineering interviews.

Table of Contents:

1. What is a Skip List?
2. Why can a Skip List reduce search time from `O(n)` to an average of `O(logn)`?
3. How does a Skip List perform search, insertion, and deletion?
4. How should you compare Skip Lists with Red-Black Trees?
5. Why does Redis ZSet use a Skip List?

![Skip List builds multi-level indices on top of an ordered linked list to accelerate search](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/skip-list-60942a9b.png)

## What is a Skip List?

A Skip List is a data structure based on ordered linked lists. Its bottom layer remains a complete ordered linked list where all elements reside; above this base linked list, the Skip List builds several sparser index layers.

You can think of it as a book's table of contents:

- The bottom-most linked list is like the page content: it has the most complete information, but flipping page-by-page from the first to the last page is very slow.
- The upper-layer indices are like the table of contents: they contain less information, but allow you to jump quickly near the target location.
- During a query, you jump rightward starting from the highest index layer; when you can no longer move right, descend one layer, until reaching the bottom layer.

This is the biggest difference between a Skip List and a standard linked list: a standard linked list can only advance one step at a time, whereas a Skip List can skip multiple nodes at once across high-level indices.

## What Does a Skip List Node Look Like?

A standard linked list node usually has only one `next` pointer, whereas a Skip List node has multiple forward pointers. If a node appears at level 3, it means it has corresponding pointers at levels 0, 1, and 2.

Abstractly, a Skip List node can be represented like this:

```java
class SkipListNode {
    int value;
    SkipListNode[] forward;
}
```

Here, `forward[i]` represents the next node that the current node points to at level `i`. In real-world engineering implementations, it may also store additional information such as score, member, backward pointer, span, etc., to support ranking, reverse traversal, and range queries.

## Where Do the Levels Come From?

A Skip List does not maintain balance through rotations or recoloring; it relies on randomized levels.

When inserting a new node, a random function is typically used to determine how many levels it can promote to. You can imagine this process as flipping a coin: a node is guaranteed to appear at the bottom level (level 0); if the first flip is heads, it goes up one level; if heads again, it goes up another level, repeating until tails is flipped or the maximum level limit is reached.

The result of this design is: higher levels have fewer nodes, while lower levels are denser. Ideally, level 1 retains about half the nodes, level 2 retains half of that, and level 3 decreases further. Although not strictly balanced, from a probabilistic standpoint, the overall height remains at the `O(logn)` level.

This is also the origin of "Skip" in its name: high-level indices allow search operations to skip entire segments of elements.

## Interview Focus Points

- Clearly explain why a Skip List is faster than a standard linked list for queries.
- Describe the general process of search, insertion, and deletion.
- Explain why average search, insertion, and deletion in a Skip List take `O(logn)`.
- Explain the trade-offs between a Skip List and a Red-Black Tree.
- Relate it to the range query scenarios in Redis ZSet.

## How Does a Skip List Search?

Searching starts from the highest index level:

1. If the value of the next node of the current node is smaller than the target value, move right.
2. If the next node is greater than the target value or is null, descend one level.
3. Continue the search upon reaching the bottom layer until the target node is found.

This process is somewhat similar to binary search in a sorted array, but the Skip List's underlying structure is still a linked list.

More precisely, each level of a Skip List is a sorted linked list. Queries always adhere to one principle: move right if possible; move down if you cannot move right.

Suppose you want to find `26`:

1. Start from the head node at the highest level.
2. If the value of the node to the right is less than `26`, it indicates the target is further right, so keep moving right.
3. If the value of the node to the right is greater than `26`, moving further right would overshoot the target, so descend one level.
4. Repeat this process, and finally confirm whether the target exists at the bottom level.

If the target does not exist, the Skip List can also find the position where it should be inserted: the last node in the bottom layer that is smaller than the target value is the predecessor node of the insertion position.

## Insertion and Deletion

When inserting a node, you first need to find its predecessor node at each level, and then link the new node in. The number of levels the new node can be promoted to is usually determined by a random function.

When deleting a node, you also need to find its predecessor nodes at each level, and then bypass the target node by updating the pointers.

A Skip List does not rely on rotations to maintain balance; instead, it relies on randomized levels to keep the index height within a reasonable range. This is also why it is much simpler to implement than a Red-Black Tree.

In actual insertion code, an `update` array is frequently maintained: `update[i]` records which node the new node should be inserted behind at level `i`. While searching for the insertion location, these predecessor nodes are recorded along the way. After obtaining the random level count, pointers can be modified layer by layer.

Deletion follows a similar approach: first locate the predecessor nodes at each level; if the next node at that level happens to be the target node, point the predecessor's `forward` pointer to the target node's next node.

Therefore, insertion and deletion in a Skip List do not merely modify the bottom linked list, but must also synchronously update all index levels where the target node appears.

## Complexity

| Operation | Average Complexity | Description |
| --- | --- | --- |
| Search | `O(logn)` | Skip nodes via multi-level indices |
| Insertion | `O(logn)` | Locate position, then update multi-level pointers |
| Deletion | `O(logn)` | Locate predecessor, then disconnect pointers |
| Range Query | `O(logn + k)` | Locate the start point first, then return k elements sequentially |

The space complexity is on the order of `O(n)`, but it consumes slightly more memory than a standard linked list due to extra index pointers.

The `O(logn)` here represents the average complexity, which relies on the probabilistic balance provided by randomized levels. Unlike Red-Black Trees, a Skip List does not guarantee strict worst-case balance constraints; however, under normal random functions and reasonable parameter settings, its performance is typically very stable.

Range queries are a sweet spot for Skip Lists: first locate the range's starting point in `O(logn)`, then traverse forward sequentially along the bottom-most linked list to collect `k` results.

## Skip List vs. Red-Black Tree: Which to Choose?

| Comparison Aspect | Skip List | Red-Black Tree |
| --- | --- | --- |
| Balance Mechanism | Randomized levels | Rotations and recoloring |
| Implementation Difficulty | Relatively straightforward | Insertion/deletion rebalancing is much more complex |
| Range Queries | Scan along the bottom linked list, very convenient | In-order traversal is possible, but more convoluted to implement |
| Worst-Case Complexity | Dependent on randomness | Strictly bounded by balance invariants |
| Engineering Examples | Redis ZSet | Java `TreeMap`, `HashMap` treeification |

## Why Does Redis ZSet Use a Skip List?

ZSet needs to support:

- Fast score lookup by member.
- Sorting by score.
- Range queries by score.
- Retrieving ranks.

A Hash Table is ideal for looking up scores by member, while a Skip List is ideal for sorting and range queries by score. By combining both, ZSet can simultaneously support fast key-based lookups and sorted traversals.

More specifically:

- Via the Hash Table, you can directly find the corresponding score for a member.
- Via the Skip List, elements are maintained in ascending order of their scores.
- When executing range queries such as `ZRANGE` and `ZRANGEBYSCORE`, the Skip List can locate the starting point and then return results consecutively along the linked list.
- If Skip List nodes maintain span information, rank-related operations can also be efficiently supported.

Note that Redis uses different internal encodings depending on data size and configuration to save memory. In interviews, stating that "ZSet uses a Hash Table + Skip List" generally refers to its core structure when handling larger sorted sets.

## Common Pitfalls

- A Skip List is neither an array nor a binary tree; its underlying structure is a linked list.
- The average `O(logn)` complexity of a Skip List is guaranteed by probability, not by strict structural balance.
- Range queries are a major strength of Skip Lists: first locate the starting point, then traverse along the bottom linked list.
- Redis ZSet does not rely solely on a Skip List; it pairs it with a Hash Table.

## High-Frequency Self-Check Questions

- Why are queries fast in a Skip List?
- What are the differences between a Skip List and a Red-Black Tree?
- Why doesn't Redis ZSet use a Red-Black Tree?
- How is the number of levels decided in a Skip List?
- What is the time complexity of a range query in a Skip List?

## References

- [Skip Lists: A Probabilistic Alternative to Balanced Trees](https://dl.acm.org/doi/10.1145/78973.78977)
- [William Pugh: A Skip List Cookbook](https://drum.lib.umd.edu/bitstreams/17176ef8-8330-4a6c-8b75-4cd18c570bec/download)
- [Redis Docs: Sorted Sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
- [Redis Source Code: t_zset.c](https://github.com/redis/redis/blob/unstable/src/t_zset.c)
