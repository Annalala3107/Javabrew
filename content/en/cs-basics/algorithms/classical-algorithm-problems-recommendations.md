---
title: Summary of Classical Algorithm Paradigms (with LeetCode Recommendations)
description: Summarizes high-frequency algorithmic paradigms including binary search, two pointers, sliding window, DFS/BFS, backtracking, dynamic programming, greedy, divide-and-conquer, topological sort, union-find, and bit manipulation, providing pattern recognition, templates, representative problems, and review takeaways.
category: Computer Science Basics
tag:
  - Algorithms
  - LeetCode
  - Interview
head:
  - - meta
    - name: keywords
      content: algorithm paradigms,binary search,two pointers,sliding window,DFS,BFS,backtracking,dynamic programming,greedy,divide and conquer,topological sort,union-find,bit manipulation,LeetCode problem recommendations
lang: en
sourceRef: zh-ref/cs-basics/algorithms/classical-algorithm-problems-recommendations.md
---

Algorithmic paradigms should not be memorized in isolation. More effective questions to ask during interview preparation are: What signals indicate that I should use this technique? Where are the most error-prone spots in the template? If the interviewer alters the problem constraints, which variable or state transition should I adjust first?

This problem list is organized by paradigm. Each category provides "Identification Signals, Common Templates, Representative Problems, and Review Focus". The number of problems is kept within a scope that effectively represents standard templates; explaining these problems thoroughly is far more rewarding than mechanically grinding through hundreds of problems.

## How to Use This Problem List

Do not attempt to solve all problems sequentially from top to bottom right away. A more suitable approach for interview preparation is: first read the corresponding template articles to ensure you can handwrite the core code, then solve the "Must-Practice Problems", and finally use the "Advanced Problems" to test your grasp on edge cases and variations.

| Goal | Recommended Action |
| ---- | ------------------ |
| Quickly establish templates | First read high-frequency template articles: [Binary Search](./binary-search.md), [Two Pointers & Sliding Window](./two-pointers-and-sliding-window.md), and [DFS/BFS](./dfs-bfs.md) |
| Cover search and DP | Continue with [Backtracking](./backtracking.md) and [Dynamic Programming](./dynamic-programming.md), handwriting at least 2 foundational problems for each category |
| Check for gaps before interviews | Fill in common variants with [Greedy Algorithms](./greedy.md), [Top K Problems](./top-k.md), and [Union-Find](../data-structure/union-find.md) |
| Review your own solutions | For each problem, write down pattern identification signals, core variable semantics, complexity, and boundary test cases. If you cannot explain these clearly, you have not truly mastered the problem |

## Binary Search

| Item | Content |
| ---- | ------- |
| Identification Signal | Sorted array, monotonic conditions, boundary finding, finding minimum/maximum feasible value |
| Common Templates | Basic binary search, left boundary, right boundary, binary search on answers |
| Must-Practice Problems | [704. Binary Search](https://leetcode.cn/problems/binary-search/), [34. Find First and Last Position of Element in Sorted Array](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) |
| Advanced Problems | [35. Search Insert Position](https://leetcode.cn/problems/search-insert-position/), [875. Koko Eating Bananas](https://leetcode.cn/problems/koko-eating-bananas/) |
| Review Focus | Loop condition, `mid` calculation, whether boundary updates could lead to infinite loops |

## Two Pointers

| Item | Content |
| ---- | ------- |
| Identification Signal | Sorted array, in-place modification, shrinking from both ends towards the center, fast/slow pointer pursuit in linked lists |
| Common Templates | Left-right pointers, fast-slow pointers, read-write pointers |
| Must-Practice Problems | [26. Remove Duplicates from Sorted Array](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/), [977. Squares of a Sorted Array](https://leetcode.cn/problems/squares-of-a-sorted-array/) |
| Advanced Problems | [15. 3Sum](https://leetcode.cn/problems/3sum/), [142. Linked List Cycle II](https://leetcode.cn/problems/linked-list-cycle-ii/) |
| Review Focus | Fix pointer semantics firmly, do not miss deduplication conditions, draw 3 nodes first for linked list problems |

## Sliding Window

| Item | Content |
| ---- | ------- |
| Identification Signal | Contiguous subarray, contiguous substring, longest/shortest, satisfying a specific condition within the window |
| Common Templates | Fixed window, variable window, frequency counting Map |
| Must-Practice Problems | [3. Longest Substring Without Repeating Characters](https://leetcode.cn/problems/longest-substring-without-repeating-characters/), [209. Minimum Size Subarray Sum](https://leetcode.cn/problems/minimum-size-subarray-sum/) |
| Advanced Problems | [76. Minimum Window Substring](https://leetcode.cn/problems/minimum-window-substring/), [438. Find All Anagrams in a String](https://leetcode.cn/problems/find-all-anagrams-in-a-string/) |
| Review Focus | When to expand the right boundary, when to shrink the left boundary, how to maintain window internal state variables |

## DFS and BFS

| Item | Content |
| ---- | ------- |
| Identification Signal | Tree traversal, graph traversal, matrix connected components, shortest steps, level-order traversal |
| Common Templates | Recursive DFS, stack-simulated DFS, queue BFS, level-order BFS |
| Must-Practice Problems | [102. Binary Tree Level Order Traversal](https://leetcode.cn/problems/binary-tree-level-order-traversal/), [200. Number of Islands](https://leetcode.cn/problems/number-of-islands/) |
| Advanced Problems | [994. Rotting Oranges](https://leetcode.cn/problems/rotting-oranges/), [127. Word Ladder](https://leetcode.cn/problems/word-ladder/) |
| Review Focus | Visited markings, out-of-bounds checks, BFS level step counting |

## Backtracking

| Item | Content |
| ---- | ------- |
| Identification Signal | Enumerate all solutions, path choices, combinations, permutations, subsets, chessboard constraints |
| Common Templates | `path` state, choices list, recursion level, backtracking (undoing choice) |
| Must-Practice Problems | [77. Combinations](https://leetcode.cn/problems/combinations/), [78. Subsets](https://leetcode.cn/problems/subsets/) |
| Advanced Problems | [39. Combination Sum](https://leetcode.cn/problems/combination-sum/), [51. N-Queens](https://leetcode.cn/problems/n-queens/) |
| Review Focus | What recursion parameters represent, whether pruning conditions belong before or inside the loop |

## Dynamic Programming

| Item | Content |
| ---- | ------- |
| Identification Signal | Finding optimal values, counting combinations/ways, reachability, subsequences, knapsack, interval merging |
| Common Templates | 1D DP, 2D DP, rolling array, knapsack DP |
| Must-Practice Problems | [70. Climbing Stairs](https://leetcode.cn/problems/climbing-stairs/), [322. Coin Change](https://leetcode.cn/problems/coin-change/) |
| Advanced Problems | [300. Longest Increasing Subsequence](https://leetcode.cn/problems/longest-increasing-subsequence/), [416. Partition Equal Subset Sum](https://leetcode.cn/problems/partition-equal-subset-sum/) |
| Review Focus | Semantic definition of `dp[i]`, initialization, traversal order, space optimization feasibility |

## Greedy Algorithm

| Item | Content |
| ---- | ------- |
| Identification Signal | Making the locally optimal choice at each step; often paired with sorting, intervals, jumps, buy/sell transactions |
| Common Templates | Sort then pick, maintaining furthest reachable boundary, interval merging/covering |
| Must-Practice Problems | [455. Assign Cookies](https://leetcode.cn/problems/assign-cookies/), [55. Jump Game](https://leetcode.cn/problems/jump-game/) |
| Advanced Problems | [45. Jump Game II](https://leetcode.cn/problems/jump-game-ii/), [435. Non-overlapping Intervals](https://leetcode.cn/problems/non-overlapping-intervals/) |
| Review Focus | Why the greedy strategy is mathematically sound, whether counterexamples can invalidate the current strategy |

## Divide and Conquer

| Item | Content |
| ---- | ------- |
| Identification Signal | The problem can be divided into identical subproblems whose results can be combined |
| Common Templates | Recursive division, solving subproblems, merging results |
| Must-Practice Problems | [108. Convert Sorted Array to Binary Search Tree](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/), [148. Sort List](https://leetcode.cn/problems/sort-list/) |
| Advanced Problems | [23. Merge k Sorted Lists](https://leetcode.cn/problems/merge-k-sorted-lists/), [215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/) |
| Review Focus | Recursion base case, whether left and right intervals overlap, merge step complexity |

## Topological Sort

| Item | Content |
| ---- | ------- |
| Identification Signal | Course dependencies, task scheduling dependencies, directed acyclic graphs (DAG), checking completion feasibility |
| Common Templates | In-degree array + queue (Kahn's algorithm), or DFS three-color marking |
| Must-Practice Problems | [207. Course Schedule](https://leetcode.cn/problems/course-schedule/) |
| Advanced Problems | [210. Course Schedule II](https://leetcode.cn/problems/course-schedule-ii/), [269. Alien Dictionary](https://leetcode.cn/problems/alien-dictionary/) |
| Review Focus | When to decrement in-degree, whether the number of processed nodes equals the total node count |

## Union-Find

| Item | Content |
| ---- | ------- |
| Identification Signal | Connectivity, grouping, friend circles, redundant edges, equivalence relations |
| Common Templates | `find`, `union`, path compression, union by rank/size |
| Must-Practice Problems | [547. Number of Provinces](https://leetcode.cn/problems/number-of-provinces/) |
| Advanced Problems | [684. Redundant Connection](https://leetcode.cn/problems/redundant-connection/), [990. Satisfiability of Equality Equations](https://leetcode.cn/problems/satisfiability-of-equality-equations/) |
| Review Focus | Whether `find` performs path compression, when to detect conflicts |

## Bit Manipulation

| Item | Content |
| ---- | ------- |
| Identification Signal | Parity check, powers of two, single non-duplicate element, state compression (bitmasking) |
| Common Templates | XOR properties, clearing lowest set bit via `n & (n - 1)`, bitmask enumeration |
| Must-Practice Problems | [136. Single Number](https://leetcode.cn/problems/single-number/), [231. Power of Two](https://leetcode.cn/problems/power-of-two/) |
| Advanced Problems | [191. Number of 1 Bits](https://leetcode.cn/problems/number-of-1-bits/), [78. Subsets](https://leetcode.cn/problems/subsets/) |
| Review Focus | XOR mathematical properties, the semantic meaning of `n & (n - 1)`, binary representation of negative numbers |

## Review Roadmap Entry

This article focuses solely on classical algorithm paradigms and recommended problem lists. The 7-day sprint and 30-day systematic review roadmaps are uniformly maintained in the [Algorithm Interview Review Overview](./README.md). If study schedules are adjusted later, updating the central overview page is sufficient, preventing discrepancies between multiple recommendation lists.
