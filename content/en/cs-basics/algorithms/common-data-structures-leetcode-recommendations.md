---
title: Classical LeetCode Problem Recommendations for Common Data Structures
description: Curates high-frequency LeetCode problems categorized by arrays, linked lists, stacks, queues, hash tables, trees, graphs, heaps, tries, and union-find, providing problem types, templates, interview value, and review takeaways.
category: Computer Science Basics
tag:
  - Algorithms
  - Data Structures
  - LeetCode
head:
  - - meta
    - name: keywords
      content: LeetCode,data structures,array,linked list,stack,queue,hash table,binary tree,graph,heap,Trie,union-find,problem recommendations,problem-solving roadmap
lang: en
sourceRef: zh-ref/cs-basics/algorithms/common-data-structures-leetcode-recommendations.md
---

When practicing data structure problems, it is not recommended to simply solve them in order from Easy to Hard. A more robust approach is to establish problem patterns by structure: arrays focus on indices and intervals, linked lists focus on pointers, stacks and queues focus on order constraints, trees and graphs focus on traversal, heaps focus on priority, and hash tables focus on fast lookup.

The problem list below is curated within the scope of interview high-frequency and template representative problems. For each category, complete the "Must-Practice Problems" first, then tackle the "Advanced Problems". After completing each problem, make sure to write down its complexity, edge cases, and which template it belongs to.

## How to Use This Problem List

Do not simply memorize conclusions for data structure problems. Each time you practice a category, return to the corresponding structure to review "storage methods, core operations, and complexities" before writing code. This ensures that when interviewers probe deeper into Java collections, Redis, MySQL indices, or caching scenarios, your answers will extend far beyond surface-level problem solutions.

| Structure | What to Read First | Focus When Practicing Problems |
| --------- | ------------------ | ------------------------------ |
| Arrays, Linked Lists, Stacks & Queues | [Linear Data Structures Explained](../data-structure/linear-data-structure.md), [Two Pointers & Sliding Window](./two-pointers-and-sliding-window.md) | Indices, pointer updates, push/pop timing |
| Hash Tables | [Hash Table Interview Questions Summary](../data-structure/hash-table.md) | Key design, counting timing, collision resolution and resizing |
| Trees and Graphs | [Tree Data Structures Explained](../data-structure/tree.md), [Graph Data Structures Explained](../data-structure/graph.md), [DFS & BFS](./dfs-bfs.md) | Recursion return values, visited markings, BFS level counting |
| Heaps and Top K | [Heap Data Structures Explained](../data-structure/heap.md), [Top K Problems Interview Questions Summary](./top-k.md) | Heap size, comparator logic, data stream scenarios |
| Trie and Union-Find | [Trie Prefix Tree Interview Questions Summary](../data-structure/trie.md), [Union-Find Interview Questions Summary](../data-structure/union-find.md) | Node structure, end marker, path compression, connectivity checks |
| LRU | [LRU Cache Interview Questions Summary](../data-structure/lru-cache.md) | How hash tables and doubly-linked lists collaborate to maintain O(1) operations |

## Arrays

| Problem Type | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| ------------ | ---------------------- | ----------------- | --------------- | ------------ |
| Binary Search | [704. Binary Search](https://leetcode.cn/problems/binary-search/) | [34. Find First and Last Position of Element in Sorted Array](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) | Tests loop conditions and boundaries | `left <= right`, updating left/right boundaries |
| In-Place Modification | [26. Remove Duplicates from Sorted Array](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/) | [80. Remove Duplicates from Sorted Array II](https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/) | Tests two-pointer implementation | Slow pointer semantics, overwrite timing |
| Two Pointers | [977. Squares of a Sorted Array](https://leetcode.cn/problems/squares-of-a-sorted-array/) | [15. 3Sum](https://leetcode.cn/problems/3sum/) | High-frequency array problems | Sorting then deduplication, left/right pointer movement |
| Prefix Sum | [303. Range Sum Query - Immutable](https://leetcode.cn/problems/range-sum-query-immutable/) | [560. Subarray Sum Equals K](https://leetcode.cn/problems/subarray-sum-equals-k/) | Foundation for subarray problems | Prefix sum semantics, hash table frequency counting |

## Linked Lists

| Problem Type | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| ------------ | ---------------------- | ----------------- | --------------- | ------------ |
| Basic Operations | [707. Design Linked List](https://leetcode.cn/problems/design-linked-list/) | [24. Swap Nodes in Pairs](https://leetcode.cn/problems/swap-nodes-in-pairs/) | Tests basic node operation skills | Dummy head node, insertion and deletion order |
| List Reversal | [206. Reverse Linked List](https://leetcode.cn/problems/reverse-linked-list/) | [92. Reverse Linked List II](https://leetcode.cn/problems/reverse-linked-list-ii/) | High-frequency handwritten code questions | Update order of `prev`, `cur`, `next` |
| Fast & Slow Pointers | [141. Linked List Cycle](https://leetcode.cn/problems/linked-list-cycle/) | [142. Linked List Cycle II](https://leetcode.cn/problems/linked-list-cycle-ii/) | Common follow-up questions | Meeting point and cycle entrance mathematical derivation |
| Node Deletion | [19. Remove Nth Node From End of List](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/) | [61. Rotate List](https://leetcode.cn/problems/rotate-list/) | Tests edge case handling | List length, deletion of head node |

## Stacks and Queues

| Problem Type | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| ------------ | ---------------------- | ----------------- | --------------- | ------------ |
| Structure Simulation | [232. Implement Queue using Stacks](https://leetcode.cn/problems/implement-queue-using-stacks/) | [225. Implement Stack using Queues](https://leetcode.cn/problems/implement-stack-using-queues/) | Tests understanding of structural mechanics | In-stack and out-stack responsibilities |
| Parentheses Matching | [20. Valid Parentheses](https://leetcode.cn/problems/valid-parentheses/) | [394. Decode String](https://leetcode.cn/problems/decode-string/) | Entry point for string stack problems | When to push to stack, when to pop |
| Monotonic Stack | [739. Daily Temperatures](https://leetcode.cn/problems/daily-temperatures/) | [84. Largest Rectangle in Histogram](https://leetcode.cn/problems/largest-rectangle-in-histogram/) | Medium to high frequency problem type | Maintaining monotonic increasing vs decreasing in stack |
| Monotonic Queue | [239. Sliding Window Maximum](https://leetcode.cn/problems/sliding-window-maximum/) | [862. Shortest Subarray with Sum at Least K](https://leetcode.cn/problems/shortest-subarray-with-sum-at-least-k/) | Common template for Hard problems | Head expiration, tail maintaining monotonicity |

## Hash Tables

| Problem Type | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| ------------ | ---------------------- | ----------------- | --------------- | ------------ |
| Fast Lookup | [1. Two Sum](https://leetcode.cn/problems/two-sum/) | [49. Group Anagrams](https://leetcode.cn/problems/group-anagrams/) | Hash table introductory problems | Key design |
| Counting | [242. Valid Anagram](https://leetcode.cn/problems/valid-anagram/) | [347. Top K Frequent Elements](https://leetcode.cn/problems/top-k-frequent-elements/) | High-frequency frequency calculation problems | Choosing between array counting and Map counting |
| Prefix Sum + Hash | [560. Subarray Sum Equals K](https://leetcode.cn/problems/subarray-sum-equals-k/) | [974. Subarray Sums Divisible by K](https://leetcode.cn/problems/subarray-sums-divisible-by-k/) | Frequently tested in subarray problems | Query first then add, avoiding including current prefix prematurely |
| Cache Structures | [146. LRU Cache](https://leetcode.cn/problems/lru-cache/) | [460. LFU Cache](https://leetcode.cn/problems/lfu-cache/) | Handwritten design problems | Collaboration between hash table and doubly-linked list |

## Binary Trees

| Problem Type | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| ------------ | ---------------------- | ----------------- | --------------- | ------------ |
| Traversal | [144. Binary Tree Preorder Traversal](https://leetcode.cn/problems/binary-tree-preorder-traversal/) | [102. Binary Tree Level Order Traversal](https://leetcode.cn/problems/binary-tree-level-order-traversal/) | Tree problem foundation | Recursion boundaries, queue level counting |
| Path Problems | [112. Path Sum](https://leetcode.cn/problems/path-sum/) | [124. Binary Tree Maximum Path Sum](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) | DFS high frequency | Separating recursive return values from global answer |
| Tree Construction | [105. Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | [106. Construct Binary Tree from Inorder and Postorder Traversal](https://leetcode.cn/problems/construct-binary-tree-from-inorder-and-postorder-traversal/) | Tests recursive intervals | Never confuse index boundaries |
| Lowest Common Ancestor | [236. Lowest Common Ancestor of a Binary Tree](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/) | [235. Lowest Common Ancestor of a Binary Search Tree](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-search-tree/) | High-frequency follow-up | Solution differences between general binary trees and BSTs |

## Graphs

| Problem Type | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| ------------ | ---------------------- | ----------------- | --------------- | ------------ |
| Grid DFS/BFS | [200. Number of Islands](https://leetcode.cn/problems/number-of-islands/) | [695. Max Area of Island](https://leetcode.cn/problems/max-area-of-island/) | Graph search introduction | Out-of-bounds checks, visited markings |
| Topological Sort | [207. Course Schedule](https://leetcode.cn/problems/course-schedule/) | [210. Course Schedule II](https://leetcode.cn/problems/course-schedule-ii/) | Dependency relationship problems | In-degree array, queue |
| Shortest Path | [994. Rotting Oranges](https://leetcode.cn/problems/rotting-oranges/) | [127. Word Ladder](https://leetcode.cn/problems/word-ladder/) | BFS level-order application | Step counting per level |
| Connectivity | [547. Number of Provinces](https://leetcode.cn/problems/number-of-provinces/) | [684. Redundant Connection](https://leetcode.cn/problems/redundant-connection/) | Union-Find entry point | `find` and `union` templates |

## Heaps

| Problem Type | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| ------------ | ---------------------- | ----------------- | --------------- | ------------ |
| Kth Largest | [215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/) | [703. Kth Largest Element in a Stream](https://leetcode.cn/problems/kth-largest-element-in-a-stream/) | Top K high frequency | Keeping min-heap size bounded to K |
| Frequency Counting | [347. Top K Frequent Elements](https://leetcode.cn/problems/top-k-frequent-elements/) | [692. Top K Frequent Words](https://leetcode.cn/problems/top-k-frequent-words/) | Hash table + Heap | Writing comparators correctly |
| Dual Heaps | [295. Find Median from Data Stream](https://leetcode.cn/problems/find-median-from-data-stream/) | [480. Sliding Window Median](https://leetcode.cn/problems/sliding-window-median/) | Advanced design problems | Balancing max-heap and min-heap |

## Trie and Union-Find

| Structure | Must-Practice Problems | Advanced Problems | Interview Value | Review Focus |
| --------- | ---------------------- | ----------------- | --------------- | ------------ |
| Trie | [208. Implement Trie (Prefix Tree)](https://leetcode.cn/problems/implement-trie-prefix-tree/) | [211. Design Add and Search Words Data Structure](https://leetcode.cn/problems/design-add-and-search-words-data-structure/) | String collection problems | Node structure, end marker |
| Trie + DFS | [212. Word Search II](https://leetcode.cn/problems/word-search-ii/) | [648. Replace Words](https://leetcode.cn/problems/replace-words/) | Medium to high frequency problems | Prefix pruning |
| Union-Find | [547. Number of Provinces](https://leetcode.cn/problems/number-of-provinces/) | [1319. Number of Operations to Make Network Connected](https://leetcode.cn/problems/number-of-operations-to-make-network-connected/) | Connectivity template | Path compression |
| Union-Find Cycle Check | [684. Redundant Connection](https://leetcode.cn/problems/redundant-connection/) | [990. Satisfiability of Equality Equations](https://leetcode.cn/problems/satisfiability-of-equality-equations/) | Common graph variants | Union equality equations first, then check conflicts |

## Review Roadmap Entry

This article focuses solely on data-structure-related problem recommendations. The 7-day review roadmap and 30-day review roadmap are uniformly maintained in the [Data Structure Review Overview](../data-structure/README.md), avoiding duplicate maintenance of the same study plan across multiple overview and problem list articles.
