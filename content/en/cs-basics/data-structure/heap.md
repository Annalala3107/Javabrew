---
title: Detailed Guide to Heap (Max-Heap, Min-Heap, Priority Queue)
description: Analyze the properties and operations of heaps, understand priority queue implementations and the performance advantages of heap sort, and master insertion/deletion complexity and practical scenarios.
category: Computer Science Fundamentals
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Heap,Max-Heap,Min-Heap,Priority Queue,Heapify,Sift-Up,Sift-Down,Heap Sort
lang: en
sourceRef: zh-ref/cs-basics/data-structure/heap.md
---

## What Is a Heap?

A heap is a tree that satisfies the following condition:

Every node's value in the heap is greater than or equal to (or less than or equal to) the values of all nodes in its subtree. In other words, any node's value is greater than or equal to (or less than or equal to) all of its child nodes' values.

> You can think of a heap (max-heap) as a company. This company is very fair: whoever is the most capable becomes the boss, no weak person can be the boss, and no subordinate under the boss can be stronger than the boss. This analogy helps you understand subsequent heap operations.

**!!! Special Note:**

- Many blogs claim that a heap is a complete binary tree, which is actually not true—**a heap is not necessarily a complete binary tree**. It is just that for convenient storage and indexing, we usually represent a heap in the form of a complete binary tree. In fact, well-known Fibonacci heaps and binomial heaps are not complete binary trees; they are not even binary trees.
- A (**binary**) heap is an array that can be viewed as a **nearly complete binary tree**. — *Introduction to Algorithms*, 3rd Edition

Try to determine whether the trees shown in the figure below are heaps:

![Example of checking whether trees satisfy the heap property](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-1-414f9c96.png)

The 1st and 2nd are heaps. The 1st is a max-heap, where every node is larger than all nodes in its subtree. The 2nd is a min-heap, where every node is smaller than all nodes in its subtree.

The 3rd is not. In the third tree, the root node `1` is smaller than `2` and `15`, yet `15` is larger than `3` and `19` is larger than `5`, which violates the heap property.

## Uses of a Heap

When we only care about the maximum or minimum value among all data, and we need to repeatedly retrieve the maximum or minimum value while repeatedly inserting or deleting data, we can use a heap.

Some might think of using a sorted array: initializing a sorted array takes `O(nlog(n))` time, and finding the maximum or minimum value takes `O(1)` time. However, when updating (inserting or deleting) data, the time complexity is `O(n)`—even if you use binary search with `O(log(n))` complexity to locate where to insert or delete, shifting elements still requires `O(n)` time.

**Compared with a sorted array, the main advantage of a heap is its higher efficiency in inserting and deleting data.** Because a heap is implemented based on a complete binary tree, inserting or deleting data only requires moving nodes up or down along the tree, taking `O(log(n))` time, which is much more efficient than `O(n)` for a sorted array.

However, note this: using Floyd's heap construction method, which performs sift-down sequentially starting from the last non-leaf node, has a time complexity of `O(n)`; whereas inserting `n` elements one by one starting from an empty heap has a time complexity of `O(nlogn)`.

## Classification of Heaps

Heaps are divided into **max-heaps** and **min-heaps**. The difference between them lies in how nodes are ordered.

- **Max-heap**: Every node's value in the heap is greater than or equal to the values of all nodes in its subtree.
- **Min-heap**: Every node's value in the heap is less than or equal to the values of all nodes in its subtree.

As shown below, Figure 1 is a max-heap, and Figure 2 is a min-heap:

![Max-heap and min-heap examples](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-2-54fdf932.png)

## Storage of a Heap

As mentioned earlier when introducing trees, thanks to the great properties of complete binary trees, storing a binary tree in an array saves space and makes indexing easy (if the root node is indexed at `1`, then for any node `i` in the tree, its left child has index `2*i` and its right child has index `2*i+1`).

For convenient storage and indexing, a (binary) heap can be stored in the form of a complete binary tree, as illustrated below:

![Sequential array storage diagram of a heap](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-storage-54382500.png)

## Heap Operations

Heap update operations mainly include two types: **inserting an element** and **deleting the top element of the heap**. You should focus on mastering and understanding both processes.

> Before diving in, let's reiterate: a heap is a fair company—capable people naturally rise to the positions that match their abilities.

### Inserting an Element

> Inserting an element is like a newly hired employee: new to the company, this employee has to start from the bottom.

**1. Place the element to be inserted at the end**

![Heap insertion: place the new element at the end of the array](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-insert-1-e099b811.png)

> Capable people will gradually get promoted and receive raises—gold will always shine!!!

**2. From bottom to top, if the parent node is smaller than this element, swap the node with its parent until no more swaps are possible**

![Heap insertion: compare with parent node and sift up](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-insert-2-30956baa.png)

![Heap insertion: heap property restored after sifting up](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-insert-3-315817b4.png)

### Deleting the Top Element

According to the heap property, the top element of a max-heap is the largest among all elements, and the top element of a min-heap is the smallest among all elements. When we need to find the maximum or minimum element multiple times, a heap is very useful.

After deleting the top element, in order to preserve the heap property, we must adjust the heap structure. We call this process "**heapify**". There are two common adjustment directions:

- Bottom-up heapify: When inserting an element, the new element moves upward from the end—also called **sift-up** (or bubbling up).
- Top-down heapify: When deleting the top element, the last element is moved to the top and then moves downward—also called **sift-down** (or sinking).

#### An Incomplete Hole-Shifting-Up Process

> In this company called a heap, sometimes the big boss resigns, leaving the top position vacant.

First, let's look at an intuitive but incomplete approach: directly deleting the top element, leaving array index `1` empty.

![Deleting heap top: remove the root node](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-1-03f3be69.png)

> So who takes over the boss's position? Naturally one of his direct reports—whichever one is more capable steps up.

Compare the root node's left child and right child (i.e., array elements at indices `2` and `3`), and move the larger element into the root node's position (index `1`).

![Deleting heap top: larger child moves up to root node](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-2-cc68826f.png)

> Now another position opens up—same rule as always, whoever is more capable moves up.

Repeat in a loop: compare the left and right children of the vacated position and move the larger one into the empty slot until reaching the bottom of the heap.

![Deleting heap top: empty hole left inside after bottom-up shifting](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-3-bc5fe5ab.png)

At this point, although the larger child nodes moved up along the path, an empty slot is left inside the array, so it no longer satisfies the structure of a complete binary tree. Therefore, this cannot count as a complete, valid top-element deletion. The standard approach is to first fill the top with the last element, and then let it sift downward.

#### Top-Down Heapify

Top-down heapify can be described with the idiom "a stone sinking into the sea." The first thing to do is lift the stone and drop it from the surface. This stone is the last element of the heap—we move the last element to the top of the heap.

![Deleting heap top: move the last element to the heap top](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-4-a3c8126e.png)

Then start letting this stone sink to the bottom of the sea: keep comparing it with the values of its left and right children, swapping it with the larger child until no further swaps can be made.

![Deleting heap top: heap top element sifts downward](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-5-96ab3ce6.png)

![Deleting heap top: top-down heapify completed](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-6-7d213d9d.png)

### Summary of Heap Operations

- **Insert an element**: First place the element at the end of the array, then perform bottom-up heapify to sift the last element up.
- **Delete the top element**: Swap the top element with the last element, shrink the heap size, and then adjust downward from the top until the heap property is restored.

## Heap Sort

The process of heap sort consists of two steps:

- The first step is building a heap: transforming an unsorted array into a heap.
- The second step is sorting: extracting the top element of the heap, then heapifying the remaining elements, repeating iteratively until all elements have been extracted.

### Building a Heap

Once you thoroughly understand the heapify process, building a heap becomes easy to grasp. Building a heap is simply performing top-down heapify on all non-leaf nodes.

First, we need to know which nodes are non-leaf nodes: the parent of the last node and all elements before it are non-leaf nodes. That is, if the number of nodes is `n`, we need to perform top-down (sift-down) heapify on nodes `n/2` down to `1`.

The detailed process is shown below:

![Heap construction: complete binary tree corresponding to initial unsorted array](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-1-4f8ae254.png)

Abstract the initial unsorted array into a tree. There are `6` nodes in the figure, so nodes `4`, `5`, and `6` are leaf nodes, while nodes `1`, `2`, and `3` are non-leaf nodes. Therefore, we perform top-down (sift-down) heapify on nodes `1` to `3`. Note that the order goes from back to front—starting from node `3` down to node `1`.

Result after heapifying node `3`:

![Heap construction: node 3 completes sift-down](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-2-9b2bfa01.png)

Result after heapifying node `2`:

![Heap construction: node 2 completes sift-down](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-3-44f0d89a.png)

Result after heapifying node `1`:

![Heap construction: node 1 completes sift-down and forms a max-heap](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-4-9da0cb4e.png)

At this point, the tree corresponding to the array has become a max-heap—heap construction is complete!

### Sorting

Since the top element of the heap is the largest among all elements, we can repeatedly take out the top element, place this largest top element at the end of the array, and heapify the remaining elements.

Now consider two questions:

- After deleting the top element, should we perform top-down (sift-down) heapify or bottom-up (sift-up) heapify?
- Where should the extracted top elements be stored—do we create a new array?

Let's answer the first question first: we need to perform top-down (sift-down) heapify. At the very beginning of this heapify step, the last element is moved to the top, which leaves the last slot empty. Because the heap size has decreased, that slot will no longer be used by the heap, so we can place the extracted element right there at the end.

Clever readers will have noticed that this is essentially a single swap operation—swapping the top element and the last element—thereby combining extracting the top element with the first step of heapify (moving the last element to the root node position).

The detailed process is illustrated below:

Extract the first element and heapify:

![Heap sort process: round 1 extracts top element and heapifies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-1-b09b4648.png)

Extract the second element and heapify:

![Heap sort process: round 2 extracts top element and heapifies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-2-197dfe5b.png)

Extract the third element and heapify:

![Heap sort process: round 3 extracts top element and heapifies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-3-2c5da8c5.png)

Extract the fourth element and heapify:

![Heap sort process: round 4 extracts top element and heapifies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-4-7bcf059d.png)

Extract the fifth element and heapify:

![Heap sort process: round 5 extracts top element and heapifies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-5-1ce576f5.png)

Extract the sixth element and heapify:

![Heap sort process: all elements sorted](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-6-9194349a.png)

Heap sort is complete!

## Key Interview Review Points

In interviews, heaps are often asked together with priority queues, Top K problems, scheduled tasks, and delayed queues.

| Operation       | Time Complexity | Notes                                                      |
| --------------- | --------------- | ---------------------------------------------------------- |
| Peek Heap Top   | `O(1)`          | Largest element in a max-heap; smallest in a min-heap      |
| Insert Element  | `O(logn)`       | Insert at the end, then sift up                            |
| Delete Heap Top | `O(logn)`       | Swap last element to the top, then sift down               |
| Build Heap      | `O(n)`          | Sift down starting from the last non-leaf node             |
| Heap Sort       | `O(nlogn)`      | In-place sorting, but not stable                           |

In Java, `PriorityQueue` is a min-heap by default:

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> Integer.compare(b, a));
```

Do not write `b - a`, because under extreme integer values it may overflow and produce incorrect comparison results.

Common choices for Top K problems:

- General scenarios or finding the K-th largest in a data stream: Maintain a min-heap of size `K`, with time complexity `O(nlogk)` and space complexity `O(k)`.
- Finding the K-th largest in a one-off array where linear time is required: Use Quickselect, which has an average time complexity of `O(n)`.
- Finding the Top K most frequent elements: Count frequencies with a hash table first, then use a min-heap to keep the `K` most frequent elements.
- Median of a data stream: Use a max-heap for the smaller half and a min-heap for the larger half.

Note that a min-heap is a general-purpose solution for finding the K-th largest element, but it does not satisfy the complexity requirements of every problem. For instance, [LeetCode 215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/) requires an `O(n)` time complexity algorithm, which typically calls for randomized Quickselect with expected `O(n)` time complexity; if worst-case `O(n)` time complexity is strictly required, the BFPRT algorithm is needed. For a detailed comparison of approaches, refer to [Top K Problem Interview Questions Summary](../algorithms/top-k.md#快排分区思路).

## Java Code Templates

For the K-th largest element problem, you can use a min-heap of size `K`. The heap top is always the smallest among the current top `K` largest elements; if a new element is larger than the heap top, replace the heap top. This implementation has `O(nlogk)` time complexity and `O(k)` space complexity, suitable for general Top K and data stream scenarios.

```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int num : nums) {
        if (heap.size() < k) {
            heap.offer(num);
        } else if (num > heap.peek()) {
            heap.poll();
            heap.offer(num);
        }
    }
    return heap.peek();
}
```

Top K frequent elements typically follow the "hash table counting + min-heap" pattern:

```java
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int num : nums) {
        count.put(num, count.getOrDefault(num, 0) + 1);
    }
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
    for (Map.Entry<Integer, Integer> entry : count.entrySet()) {
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

## Process Walkthrough and Edge Cases

When maintaining a min-heap of size `K`, you can think of the heap as a "candidate pool":

```text
1. Candidate pool is not full: insert directly.
2. Candidate pool is full, new element <= heap top: cannot enter top K, skip.
3. Candidate pool is full, new element > heap top: poll heap top, insert new element.
4. After traversal ends, the heap top is the K-th largest element.
```

Several edge cases to double-check beforehand:

- `k == 1`: Finding the maximum value.
- `k == nums.length`: Finding the minimum value.
- Duplicate elements in the array: The K-th largest is usually counted by sorted position, not the K-th distinct element.
- Do not write `b - a` in the comparator, as extreme values can overflow.

## Recommended Practice Problems

- [215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/) (the problem asks for `O(n)` time complexity—prioritize practicing Quickselect)
- [347. Top K Frequent Elements](https://leetcode.cn/problems/top-k-frequent-elements/)
- [703. Kth Largest Element in a Stream](https://leetcode.cn/problems/kth-largest-element-in-a-stream/)
- [295. Find Median from Data Stream](https://leetcode.cn/problems/find-median-from-data-stream/)
