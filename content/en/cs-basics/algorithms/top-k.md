---
title: "Top K Problem Interview Summary: Heaps, Quickselect Partitioning, Bucket Counting, and Data Streams"
description: "A summary of Top K interview problems covering K-th largest, top K frequent, min-heaps, quickselect partitioning, bucket counting, data stream median, PriorityQueue, and frequent LeetCode questions."
category: Computer Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: TopK,Top K,Kth largest,top K frequent,heap,min-heap,quickselect partition,bucket counting,PriorityQueue,stream median,LeetCode
lang: en
sourceRef: zh-ref/cs-basics/algorithms/top-k.md
---

Top K problems are prevalent in backend interviews because they test both algorithmic knowledge and naturally lead to follow-up questions about engineering scenarios: leaderboards, hot query statistics, stream medians, and most frequent error codes in logs can all be modeled as Top K problems.

Do not memorize only a single approach for these questions. Interviewers often ask follow-ups: What if the data volume is enormous? What if data arrives as an unbounded stream? What if we need the top K frequent elements? The optimal approach changes under different constraints.

## Key Interview Focus Points

- Capable of solving the K-th largest and top K frequent elements using heaps.
- Capable of clearly articulating when to choose a min-heap versus a max-heap.
- Capable of comparing the complexities of heaps, quickselect partitioning, and bucket counting.
- Capable of handling data stream scenarios.
- Capable of writing custom comparators for Java's `PriorityQueue`.

## How to Choose an Approach for Top K Problems?

First examine 3 key conditions:

1. Do you only need the single K-th element, or the complete set of top K elements?
2. Is the dataset provided all at once, or does it arrive continuously as a data stream?
3. Does the final result need to be sorted?

If you only need the K-th largest element in a one-time array, quickselect partitioning is on average faster; if data arrives continuously, maintaining a heap of size K is more natural; if the question asks for the top K frequent elements, you must first tally frequencies and then solve Top K over those frequencies.

## Comparison of Approaches

| Approach | Suitable Scenario | Time Complexity | Space Complexity |
| --- | --- | --- | --- |
| Sorting | Modest data size, simplicity prioritized | `O(nlogn)` | Depends on sorting implementation |
| Min-Heap | Finding top K largest or K-th largest | `O(nlogk)` | `O(k)` |
| Quickselect Partitioning | Finding K-th largest, high average efficiency | Average `O(n)` | `O(1)` to `O(logn)` |
| Bucket Counting | Bounded frequency range, top K frequent | `O(n)` | `O(n)` |
| Dual Heaps | Median in a data stream | `O(logn)` per insertion | `O(n)` |

Here is how you can explain trade-offs during an interview:

- Sorting is simplest, suitable when data size is small or optimal complexity is not required.
- Heaps are suitable when K is much smaller than n, requiring only `O(k)` space.
- Quickselect partitioning is suitable for finding the K-th largest in a one-time array, running in average `O(n)`, but can degrade in the worst case.
- Bucket counting is ideal for frequency-based problems, especially when frequencies cannot exceed `n`.

## Using a Min-Heap to Find the K-th Largest Element

```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int num : nums) {
        heap.offer(num);
        if (heap.size() > k) {
            heap.poll();
        }
    }
    return heap.peek();
}
```

The heap consistently retains the K largest elements seen so far; the heap top is the smallest among these K elements, which corresponds to the global K-th largest element.

Why a min-heap? Because the heap must retain the K largest elements overall. When a new element enters and the heap size exceeds K, we must discard the smallest of these K + 1 elements. In a min-heap, the root is precisely the minimum element.

If asked to find the K-th smallest element, the strategy is reversed: maintain a max-heap of size K, and poll the maximum element whenever size exceeds K.

## Featured Problem Walkthrough: Top K Frequent Elements

[347. Top K Frequent Elements](https://leetcode.cn/problems/top-k-frequent-elements/) is the most common frequency-based Top K problem. Given an integer array and an integer `k`, return the `k` most frequent elements. The order of the output usually does not matter.

Do not sort the original array directly, because what needs comparing is the "frequency", not the element values themselves. The standard decomposition consists of two steps:

1. Use a `HashMap` to count the occurrences of each element.
2. Maintain a min-heap ordered ascendingly by frequency, keeping only the `k` elements with the highest frequencies.

Why still use a min-heap? Because once the heap is full, whenever a new element causes the heap size to exceed `k`, the element with the lowest frequency is evicted. After traversing all distinct elements, what remains in the heap are the top `k` frequent elements.

```java
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) {
        freq.put(num, freq.getOrDefault(num, 0) + 1);
    }
    PriorityQueue<int[]> heap = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
        heap.offer(new int[] {entry.getKey(), entry.getValue()});
        if (heap.size() > k) {
            heap.poll();
        }
    }
    int[] ans = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        ans[i] = heap.poll()[0];
    }
    return ans;
}
```

Here the heap is ordered ascendingly by frequency; when the heap size exceeds K, the element with the lowest frequency is polled.

Taking `nums = [1,1,1,2,2,3]`, `k = 2` as an example: the frequency map is `{1=3, 2=2, 3=1}`. The heap first accepts `1` and `2`. When `3` is inserted, size exceeds 2, so `3` (lowest frequency) is polled, leaving `1` and `2`.

If `k` equals the number of distinct elements, the heap ultimately retains all elements; if the interviewer requires output sorted by descending frequency, you must sort the result afterwards.

If the interviewer requires breaking frequency ties by value size or lexicographical order, the comparator must include the secondary sorting rule. For example, Top K frequent words typically requires higher frequencies first, with lexicographical ties broken alphabetically.

## Quickselect Partitioning Approach

Quickselect partitioning is suited for finding the single K-th largest element when an ordered list of all top K elements is not required. The idea is to partition the array around a pivot in each step, deciding which half to explore further based on the pivot's resulting rank. The average time complexity is `O(n)`, but can degrade to `O(n^2)` in the worst case; practical implementations typically choose pivots randomly.

The advantage of quickselect is that it avoids maintaining a heap and achieves low average time complexity; its limitation is that it works best on one-time in-memory data. If data streams continuously or exceeds memory capacity, heap-based solutions are much easier to implement.

## Data Stream Scenarios

In data stream problems, you cannot re-sort all data every time an element arrives. The standard practice is to continuously maintain a dynamic data structure:

- **K-th largest in a stream:** Maintain a min-heap of size K.
- **Median of a data stream:** Maintain two heaps: a max-heap on the left for the smaller half, and a min-heap on the right for the larger half.
- **Sliding window median:** Must also handle expiring elements; since standard heaps cannot delete arbitrary elements efficiently, this typically requires lazy deletion or balanced ordered collections.

## Process Illustration and Boundary Test Cases

Using array `[3, 2, 1, 5, 6, 4]` to find the 2nd largest element as an example, maintain a min-heap of size 2. For readability, elements inside the heap are shown in ascending order below, which does not represent the internal array ordering of Java's `PriorityQueue`.

| Incoming Element | Candidate Elements | Handling after exceeding K |
| --- | --- | --- |
| 3 | `[3]` | Do nothing |
| 2 | `[2, 3]` | Do nothing |
| 1 | `[1, 2, 3]` | Poll 1, keep `[2, 3]` |
| 5 | `[2, 3, 5]` | Poll 2, keep `[3, 5]` |
| 6 | `[3, 5, 6]` | Poll 3, keep `[5, 6]` |
| 4 | `[4, 5, 6]` | Poll 4, keep `[5, 6]` |

Finally, the heap root is `5`, which is the 2nd largest element.

Common erroneous implementation:

```java
PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> b - a);
```

This comparator can cause integer overflow with extreme values. A safer implementation is:

```java
PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> Integer.compare(b, a));
```

## Common Pitfalls

- Finding the top K largest typically uses a min-heap; finding the top K smallest typically uses a max-heap.
- `PriorityQueue` defaults to a min-heap.
- Top K frequent problems require calculating frequencies first before applying Top K logic.
- If sorted output is required, extra sorting is needed after heap or quickselect processing.
- Data stream scenarios cannot re-sort all historical data upon each arrival.

## High-Frequency Self-Assessment Questions

- Why do we typically maintain a min-heap of size K to find the K-th largest element?
- Which Top K scenarios are min-heaps and max-heaps each suited for?
- What are the differences in time and space complexity between heap-based and quickselect partitioning approaches?
- Why must top K frequent element problems count frequencies first?
- Why is a dual-heap structure suitable for maintaining the median of a data stream?

## Recommended Practice Problems

- [215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/)
- [347. Top K Frequent Elements](https://leetcode.cn/problems/top-k-frequent-elements/)
- [692. Top K Frequent Words](https://leetcode.cn/problems/top-k-frequent-words/)
- [703. Kth Largest Element in a Stream](https://leetcode.cn/problems/kth-largest-element-in-a-stream/)
- [295. Find Median from Data Stream](https://leetcode.cn/problems/find-median-from-data-stream/)
