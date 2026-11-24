---
title: "Binary Search Interview Questions Summary: Left/Right Boundaries, Search on Answers, and Java Templates"
description: "A comprehensive summary of binary search interview questions, systematically covering basic binary search, left boundary, right boundary, binary search on answers, Java handwritten templates, complexity analysis, and LeetCode high-frequency problems."
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: binary search,binary search template,left right boundaries,binary search on answers,Java binary search,LeetCode binary search,algorithm interview questions
lang: en
sourceRef: zh-ref/cs-basics/algorithms/binary-search.md
---

The place where binary search most often trips people up is not the underlying intuition, but boundary conditions. If any one of `left`, `right`, `mid`, loop conditions, or return values is not completely clear, it is remarkably easy to introduce infinite loops or miss valid answers.

To determine whether binary search applies in an interview, keep one key rule in mind: **Does the solution space possess monotonicity?** A sorted array is merely the most intuitive manifestation; problems asking for minimum speed, minimum capacity, or minimum days can also be solved by binary searching over the range of possible answers.

## Key Interview Focus Areas

- Writing out clean, bug-free basic binary search templates from memory.
- Handling left and right boundary searches correctly.
- Recognizing binary search on answers instead of only searching for values in an array.
- Explaining why the loop terminates and why no candidate answers are accidentally missed.
- Articulating that time complexity is `O(logn)` and space complexity is typically `O(1)`.

## When to Think of Binary Search?

Never narrow binary search down to "searching for a number in a sorted array." What it fundamentally relies on is **monotonicity**.

Monotonicity typically appears in two primary forms:

| Type | Example | Decision Rationale |
| ---- | ------- | ------------------ |
| Array Monotonicity | Searching for `target` in a sorted array | Comparing `nums[mid]` with `target` eliminates half the search space |
| Answer Monotonicity | Finding minimum speed, minimum capacity, minimum days | If answer `x` is feasible, all larger answers are also feasible (or vice versa) |

For example, in "Koko Eating Bananas," the faster the eating speed, the easier it is to finish within the allowed time. Here, the piles array itself does not need to be sorted; what is monotonic is the relationship between "eating speed" and "feasibility of finishing on time."

In an interview, you can evaluate applicability through three questions:

1. Is the problem asking for a specific position, boundary, or minimum/maximum feasible value?
2. If we guess a candidate answer `x`, can we check whether it is feasible in `O(n)` or faster time?
3. As `x` increases or decreases, does feasibility change monotonically?

If you can answer yes to all three questions, binary search is almost certainly applicable.

## Basic Binary Search Template

Best suited for finding an exact target value in a sorted array:

```java
int binarySearch(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}
```

In this template, the search interval is the closed interval `[left, right]`, which is why the loop condition is `left <= right`. Each iteration explicitly rules out `mid`, updating bounds to `mid + 1` or `mid - 1`.

Remember this template with one phrase: **Every index in the interval could still be the answer; when the loop ends, the interval is empty.**

For example, searching for `7` in the array `[1, 3, 5, 7, 9]`:

1. `left = 0`, `right = 4`, `mid = 2`, `nums[mid] = 5`; the target lies to the right.
2. Update `left = mid + 1 = 3`.
3. `mid = 3`, `nums[mid] = 7`, target found.

If searching for `6`, the loop will eventually reach `left > right`, indicating that the closed interval has been completely exhausted without a match, returning `-1`.

## Left Boundary Template

Find the first index where elements are greater than or equal to `target`:

```java
int lowerBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}
```

The search interval for this template is half-open `[left, right)`. `right` is initialized to `nums.length`, and the return value may equal `nums.length`, signifying that no element in the array is greater than or equal to `target`.

The essence of the left boundary template is not "finding target", but "finding the first index that satisfies the condition." This formulation naturally handles cases where the target does not exist.

For instance, finding the first index `>= 2` in `[1, 2, 2, 2, 4]`:

- When `nums[mid] >= 2`, `mid` itself could be the answer, so `mid` cannot be discarded; we update `right = mid`.
- When `nums[mid] < 2`, neither `mid` nor anything to its left can be the answer; we update `left = mid + 1`.

When the loop terminates, `left == right`, and this index represents the first position satisfying the condition.

## Right Boundary Template

To find the last index where elements are less than or equal to `target`, you can find the first index greater than `target`, and then subtract 1:

```java
int upperBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] > target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left - 1;
}
```

The major advantage of this approach is maintaining a single unified mental model: finding the first position satisfying a condition.

Right boundaries are notoriously prone to off-by-one errors. Converting them into left boundary problems is highly recommended:

- Last position `<= target` = First position `> target` - 1.
- Last position `< target` = First position `>= target` - 1.

This eliminates the need to memorize multiple divergent templates and ensures stability during interviews.

## Binary Search on Answers

Binary search on answers does not search for an element inside an array; rather, it searches across the range of possible answers to find the minimum or maximum feasible value.

Typical scenario: Given several piles of bananas and a total time `h`, find the minimum eating speed. The faster Koko eats, the easier it is to finish within `h` hours — this represents the underlying monotonicity.

Such problems generally break down into two steps:

1. Determine the answer range. For instance, the minimum eating speed is `1`, and the maximum speed does not need to exceed the largest single pile of bananas.
2. Write a `check` function. Given a candidate speed, determine whether all bananas can be consumed within `h` hours.

The validity of this upper bound relies on the problem constraint: `h >= piles.length`. At a speed equal to the largest pile, each pile takes at most 1 hour, so total time will never exceed the number of piles.

```java
int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = 0;
    for (int pile : piles) {
        right = Math.max(right, pile);
    }
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canFinish(piles, h, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

boolean canFinish(int[] piles, int h, int speed) {
    long hours = 0;
    for (int pile : piles) {
        hours += (pile + speed - 1) / speed;
    }
    return hours <= h;
}
```

Why do we return `left` here? Because the loop continually seeks the "first feasible speed". When `canFinish(mid)` returns true, `mid` is feasible, but a smaller speed might also work, so we shrink the right boundary. The position where the boundaries converge is precisely the minimum feasible speed.

The `check` function in binary search on answers is often more critical than the binary search framework itself. In an interview, clearly explain what `check` validates before writing the binary search scaffolding.

## How to Choose Between the Three Binary Search Types?

| Objective | Recommended Template | Return Value |
| --------- | -------------------- | ------------ |
| Finding an index exactly equal to `target` | Basic Binary Search | Returns index if found, `-1` if not found |
| Finding the first index satisfying a condition | Left Boundary | Returns `left`, potentially equal to array length |
| Finding the minimum feasible answer | Binary Search on Answer | Returns final `left` |

If a problem asks for "first", "last", "minimum feasible", or "maximum feasible", do not rush into writing basic binary search; determine whether it is a boundary search problem first.

## Interview Handwritten Coding Progression

Binary search implementations are concise, which means interviewers frequently ask: "Why are you confident in discarding this half?" When writing code on a whiteboard or online editor, follow this structured sequence:

1. First state the search space: Are you searching array indices, or searching a range of answers?
2. Next demonstrate monotonicity: Why can either the left or right side of `mid` be safely eliminated?
3. Define interval semantics clearly: Closed interval `[left, right]` or half-open interval `[left, right)`.
4. Formulate the update rule: Can `mid` itself still be the answer? That dictates whether to write `right = mid` or `right = mid - 1`.
5. Finally explain the return value: What do `left` and `right` represent when the loop terminates?

A very practical self-check question: **When `nums[mid]` happens to satisfy the condition, did I accidentally eliminate a possible answer?** In left boundary and answer searches, `mid` could very well be the target answer, so you cannot casually write `right = mid - 1`.

## Representative Problem Deep Dive: Find First and Last Position

[34. Find First and Last Position of Element in Sorted Array](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) is the classic benchmark problem for boundary binary search. It requires returning the starting and ending indices of a given `target`, or `[-1, -1]` if not found.

Avoid solving this by finding any matching target and scanning outwards linearly. While that passes basic cases, it degrades to `O(n)` in the worst case (e.g., all elements are identical). The robust approach performs two boundary searches:

- First, find the first index greater than or equal to `target`.
- Second, find the first index strictly greater than `target`, and subtract 1.

The two helper methods below match the templates discussed earlier, and the full code is shown here for easy comparison between return value semantics and main logic:

```java
int[] searchRange(int[] nums, int target) {
    int left = lowerBound(nums, target);
    if (left == nums.length || nums[left] != target) {
        return new int[] {-1, -1};
    }
    int right = upperBound(nums, target) - 1;
    return new int[] {left, right};
}

int lowerBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

int upperBound(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] > target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}
```

Common interview follow-ups for this problem include: What if all elements in the array equal `target`? What if `target` does not exist but belongs in the middle? Both questions test whether you understand return value semantics. `lowerBound` returns the first position satisfying the condition, but does not guarantee the value at that position equals `target`. Therefore, a post-check is mandatory before returning.

## Execution Trace and Boundary Test Cases

Using the left boundary template, tracing `[1, 2, 2, 2, 4]` to find the first index `>= 2`:

| Round | `left` | `right` | `mid` | Condition Check | Next Step |
| ----- | ------ | ------- | ----- | --------------- | --------- |
| 1 | 0 | 5 | 2 | `nums[2] >= 2` | `right = 2` |
| 2 | 0 | 2 | 1 | `nums[1] >= 2` | `right = 1` |
| 3 | 0 | 1 | 0 | `nums[0] < 2` | `left = 1` |
| End | 1 | 1 | - | `left == right` | Return 1 |

Several edge cases worth walking through before coding:

| Input | Target | Expected Output |
| ----- | ------ | --------------- |
| `[]` | `1` | Return `-1` or insertion index `0`, depending on problem spec |
| `[1]` | `1` | Successfully hits single element |
| `[1, 1, 1]` | Left boundary of `1` | Returns `0` |
| `[1, 3, 5]` | Left boundary of `4` | Returns `2` |
| `[1, 3, 5]` | Left boundary of `6` | Returns `3` |

Common incorrect implementation:

```java
while (left < right) {
    int mid = (left + right) / 2;
    if (nums[mid] >= target) {
        right = mid - 1; // Incorrect: mid could be the left boundary itself and cannot be eliminated
    } else {
        left = mid + 1;
    }
}
```

In left boundary search, when `nums[mid] >= target`, `mid` itself could still be the answer, so you must write `right = mid`.

## Common Pitfalls

- `mid = (left + right) / 2` can cause integer overflow; always write `left + (right - left) / 2`.
- Do not mix update rules between closed intervals and half-open intervals.
- When searching for boundaries, do not return immediately upon hitting target; continue shrinking the interval.
- Binary search on answers requires proving monotonicity first; do not blindly force it just because a problem asks for a "minimum" value.
- Helper check functions like `canFinish` often require `long` variables to prevent cumulative integer overflow.

## High-Frequency Self-Test Questions

- What is the difference between `left < right` and `left <= right`?
- Why is binary search `O(logn)`?
- When searching for a left boundary, why do we move `right` upon matching?
- What is binary search on answers? How does it differ from standard binary search?
- Does binary search strictly require the underlying array to be sorted?

## Recommended Practice Problems

- [704. Binary Search](https://leetcode.cn/problems/binary-search/)
- [35. Search Insert Position](https://leetcode.cn/problems/search-insert-position/)
- [34. Find First and Last Position of Element in Sorted Array](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/)
- [875. Koko Eating Bananas](https://leetcode.cn/problems/koko-eating-bananas/)
- [1011. Capacity To Ship Packages Within D Days](https://leetcode.cn/problems/capacity-to-ship-packages-within-d-days/)
