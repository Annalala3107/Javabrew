---
title: "Greedy Algorithm Interview Guide: Interval Greedy, Jump Game, and Proof Strategies"
description: "A comprehensive guide to greedy algorithm interview questions, covering pattern recognition, sorting greedy, interval greedy, Jump Game, proof techniques, and high-frequency LeetCode problems."
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: Greedy Algorithm,Greedy Template,Interval Greedy,Sorting Greedy,Jump Game,Greedy Proof,LeetCode Greedy,Algorithm Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/algorithms/greedy.md
---

Greedy algorithms often have short and concise code; the real difficulty lies in explaining why making a locally optimal choice at each step guarantees a globally optimal solution. If you only write the code during an interview without articulating your greedy choice strategy, follow-up questions from the interviewer can easily catch you off guard.

A useful rule of thumb: if a problem can be organized by sorting or maintaining a dynamic boundary of current optimal reach, allowing you to make a local choice at each step without invalidating future optimal choices, it is worth attempting a greedy approach.

## Key Interview Assessment Points

- Ability to identify the appropriate greedy choice property.
- Ability to validate the strategy using exchange arguments, contradiction (reductio ad absurdum), or boundary intuition.
- Ability to handle traversal conditions accurately after sorting.
- Ability to clearly distinguish between greedy algorithms and Dynamic Programming.

## How to Think Through Greedy Problems?

The biggest pitfall in greedy problems is picking a strategy based on pure guesswork. Before writing code, you should be able to clearly articulate two things:

1. **What is being greedily optimized at each step?** Examples: picking the earliest end time, jumping to the farthest reachable position, or accumulating any positive price delta.
2. **Why does this choice not compromise subsequent options?**

A proof does not necessarily have to be strictly formal, but it must explain the trade-offs. For example, in interval scheduling, choosing the interval with the earliest finish time leaves the maximum possible remaining time window for future intervals. Choosing an interval that finishes later can never yield more non-overlapping intervals than choosing the one that finishes earliest.

## Common Problem Types

| Problem Type | Greedy Strategy | Representative Problems |
| --- | --- | --- |
| Allocation | Prioritize satisfying the easiest demand first | Assign Cookies |
| Stock Trading | Accumulate all positive daily price differences | Best Time to Buy and Sell Stock II |
| Jump Problems | Maintain the farthest reachable position dynamically | Jump Game |
| Interval Problems | Sort by end points or start points | Non-overlapping Intervals, Minimum Number of Arrows to Burst Balloons |
| String Partitioning | Maintain the farthest boundary of occurrences for seen characters | Partition Labels |

Greedy strategies frequently appear alongside sorting, because sorting makes the "current locally optimal choice" unambiguous. Interval problems commonly sort by start or end points; allocation problems often sort both demands and resources before pairing them with two pointers.

## Jump Game Template

```java
boolean canJump(int[] nums) {
    int farthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > farthest) {
            return false;
        }
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}
```

`farthest` represents the furthest index reachable so far. When iterating to index `i`, if `i > farthest`, it means the current position is unreachable, so we immediately return `false`.

The greedy insight here is: we do not care about the exact sequence of jumps that got us to `i`; we only care about the maximum boundary reachable. As long as index `i` is within that reachable boundary, it can serve as a launching pad to extend `farthest` further.

In "Jump Game II", the goal is to find the minimum number of jumps. It maintains two boundaries:

- `curEnd`: The farthest reach possible with the current number of jumps.
- `farthest`: The maximum position reachable with one additional jump from anywhere within `curEnd`.

When the loop reaches `curEnd`, the reach of the current jump count is exhausted; we must increment the step count by one and update `curEnd` to `farthest`.

## Interval Greedy Template

Taking Non-overlapping Intervals as an example, sort by end points in ascending order, always keeping the interval that finishes earliest:

```java
int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) {
        return 0;
    }
    Arrays.sort(intervals, Comparator.comparingInt(a -> a[1]));
    int count = 1;
    int end = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= end) {
            count++;
            end = intervals[i][1];
        }
    }
    return intervals.length - count;
}
```

Finishing earlier leaves maximum room for subsequent intervals. This is the cornerstone greedy logic for this family of problems.

The most common mistake in interval problems is sorting by the wrong dimension. Useful general rules:

- **Maximize non-overlapping intervals:** Sort by end point ascending.
- **Merge overlapping intervals:** Sort by start point ascending.
- **Minimum arrows to burst balloons:** Sort by end point ascending to cover as many balloons as possible with the current arrow.

If a greedy heuristic is hard to explain, try constructing a small counterexample. For instance, "always picking the shortest interval" sounds plausible, but easily fails to maximize the total number of non-overlapping intervals.

## Deep Dive: Minimum Number of Arrows to Burst Balloons

[452. Minimum Number of Arrows to Burst Balloons](https://leetcode.cn/problems/minimum-number-of-arrows-to-burst-balloons/) is a quintessential interval greedy problem. Given balloon intervals `[start, end]`, an arrow shot at coordinate `x` bursts all balloons where `start <= x <= end`. The goal is to burst all balloons using the minimum number of arrows.

The greedy insight: **Shoot each arrow at the rightmost boundary of the current overlapping cluster.** First, sort intervals by end points in ascending order. Place the first arrow at the end coordinate of the first balloon. For subsequent balloons, if `balloon[0] <= arrow`, the existing arrow already bursts it; if `balloon[0] > arrow`, the current arrow cannot reach it, requiring a new arrow positioned at the right boundary of that new balloon.

Boundary considerations in code: return `0` for empty inputs; use `Integer.compare(a[1], b[1])` instead of subtraction `a[1] - b[1]` to prevent integer overflow with extreme coordinate values.

```java
int findMinArrowShots(int[][] points) {
    if (points.length == 0) {
        return 0;
    }
    Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
    int arrows = 1;
    int arrow = points[0][1];
    for (int i = 1; i < points.length; i++) {
        if (points[i][0] > arrow) {
            arrows++;
            arrow = points[i][1];
        }
    }
    return arrows;
}
```

For instance, given `[[10,16],[2,8],[1,6],[7,12]]`, sorting by end point yields `[1,6]`, `[2,8]`, `[7,12]`, `[10,16]`. The first arrow at `6` bursts the first two balloons. When encountering `[7,12]`, its start point exceeds `6`, requiring a new arrow at `12`, which also bursts `[10,16]`. The final answer is `2`.

## How to Distinguish Between Greedy and Dynamic Programming?

| Dimension | Greedy | Dynamic Programming |
| --- | --- | --- |
| Decision Process | Decides immediately at each step | Evaluates multiple prior subproblems |
| Historical Dependency | Usually never looks back | Requires state transitions from previous results |
| Core Proof Focus | Current local choice preserves global optimality | Optimal substructure and overlapping subproblems |
| Typical Problem Types | Intervals, Jumps, Resource Allocation | Knapsack, Subsequences, Grid Paths |

If a local choice appears reasonable at first glance but fails on a simple counterexample, the problem almost certainly demands Dynamic Programming or search.

## Common Pitfalls

- Greedy problems frequently require sorting first; sorting on the wrong field produces incorrect results.
- In interval problems, pay close attention to whether boundary touching counts as overlapping (e.g., whether `[1,2]` and `[2,3]` overlap).
- In Jump Game II, the timing of incrementing the step counter is strictly coupled with reaching `curEnd`.
- Always be prepared to explain your greedy intuition; never just say "I always pick the best option at each step."

## Self-Check Questions for Interviews

- How do you distinguish between problems suited for Greedy vs. Dynamic Programming?
- Why are interval scheduling problems commonly sorted by their end points?
- In Jump Game, why is maintaining only the farthest reachable position sufficient?
- How do you use exchange arguments or proof by contradiction to justify a greedy choice?
- When interval boundaries are allowed to touch, how should the comparison condition be written?

## Recommended Practice Problems

- [455. Assign Cookies](https://leetcode.cn/problems/assign-cookies/)
- [122. Best Time to Buy and Sell Stock II](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-ii/)
- [55. Jump Game](https://leetcode.cn/problems/jump-game/)
- [45. Jump Game II](https://leetcode.cn/problems/jump-game-ii/)
- [435. Non-overlapping Intervals](https://leetcode.cn/problems/non-overlapping-intervals/)
- [763. Partition Labels](https://leetcode.cn/problems/partition-labels/)
