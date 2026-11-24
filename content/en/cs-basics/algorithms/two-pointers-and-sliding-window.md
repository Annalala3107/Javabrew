---
title: "Two Pointers and Sliding Window Interview Questions Summary: High-Frequency Templates for Arrays, Linked Lists, and Strings"
description: "A comprehensive summary of two pointers and sliding window interview questions, covering opposite pointers, fast-slow pointers, read-write pointers, fixed-size windows, variable-size windows, Java templates, and LeetCode high-frequency problems."
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: two pointers,sliding window,fast slow pointers,opposite pointers,read write pointers,fixed window,variable window,array algorithms,linked list algorithms,string algorithms,LeetCode
lang: en
sourceRef: zh-ref/cs-basics/algorithms/two-pointers-and-sliding-window.md
---

Two pointers and sliding window are frequently reviewed together, yet the types of problems they solve are not entirely identical. Two pointers is more of a pointer movement strategy, whereas sliding window emphasizes maintaining dynamic state within a contiguous range.

A practical rule of thumb: If the problem focuses on the relationship between two specific indices or nodes, think of two pointers first. If the problem focuses on contiguous subarrays or contiguous substrings where conditions inside the window must be maintained, think of sliding window first.

## Key Interview Focus Areas

- Distinguishing clearly between opposite (left-right) pointers, fast-slow pointers, and read-write pointers.
- Maintaining window states such as character counts, running sums, extrema, or match criteria.
- Explaining why pointers advancing in a single monotonic direction results in an overall time complexity of `O(n)`.
- Handling edge cases such as empty arrays, single elements, duplicate values, and window shrinking boundaries.

## What Exactly Is the Difference Between the Two?

Two pointers is a broader conceptual paradigm: whenever two pointers coordinate to advance through a data structure, it qualifies as two pointers. Sliding window is more specific: it maintains a contiguous interval `[left, right]` where a set of dynamic states is maintained within the window, such as character frequency maps, running sums, running maximums, or the count of satisfied conditions.

| Problem Characteristic | More Likely Approach |
| ---------------------- | -------------------- |
| Finding two numbers in a sorted array | Opposite (Left-Right) Pointers |
| Finding cycles, midpoints, or the K-th node from end in a linked list | Fast-Slow Pointers |
| In-place element removal or overwriting | Read-Write Pointers |
| Finding longest, shortest, or counting contiguous subarrays/substrings | Sliding Window |

In an interview, articulating the exact semantic meaning of each pointer before writing code ensures high stability. For example: "Here, `left` represents the left boundary of the window, and `right` represents the newly added character being evaluated." This prevents confusion when shrinking the window later.

## Opposite (Left-Right) Pointers

Opposite pointers are commonly employed on sorted arrays or problems requiring inward shrinking from both ends:

```java
int[] twoSumSorted(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) {
            return new int[] {left, right};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return new int[] {-1, -1};
}
```

If the original array is unsorted, it is usually sorted first before applying opposite pointers. Remember that sorting increases the time complexity to `O(nlogn)`.

The fundamental reason opposite pointers work is that each comparison safely eliminates a subset of candidate solutions. Taking Two Sum on a sorted array as an example:

- If the current sum is too small, the value at the left pointer is too small; moving the right pointer further left would only produce an even smaller sum, so the only valid move is incrementing `left`.
- If the current sum is too large, the value at the right pointer is too large; moving the left pointer further right would only produce an even larger sum, so the only valid move is decrementing `right`.

3Sum follows the exact same intuition: fix one number first, and then run Two Sum on the remaining subarray. The main challenge lies in deduplication: deduplicate the fixed number, and once a valid triplet is found, advance both pointers to skip duplicate values.

## Fast-Slow Pointers

Fast-slow pointers are extensively applied in linked lists:

```java
boolean hasCycle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            return true;
        }
    }
    return false;
}
```

In linked list problems, the challenge is rarely code length, but rather ensuring pointer invariant semantics remain rock solid. The condition order `fast != null && fast.next != null` must never be reversed.

Fast-slow pointers typically leverage two common velocity differentials:

- `fast` moves 2 steps per iteration while `slow` moves 1 step: Used for cycle detection and locating the linked list midpoint.
- One pointer advances `k` steps ahead first, after which both pointers advance in unison: Used to locate the `k`-th node from the end.

When finding the `k`-th node from the end, maintaining a gap of `k` nodes between the two pointers ensures that when the leading pointer hits the tail, the trailing pointer rests exactly on the target node. When deleting the `N`-th node from the end, introducing a dummy head node simplifies edge-case handling when the head itself is deleted.

## Read-Write Pointers

Read-write pointers are commonly used for in-place array modification:

```java
int removeDuplicates(int[] nums) {
    if (nums.length == 0) {
        return 0;
    }
    int write = 1;
    for (int read = 1; read < nums.length; read++) {
        if (nums[read] != nums[read - 1]) {
            nums[write] = nums[read];
            write++;
        }
    }
    return write;
}
```

`read` is responsible for scanning the original array, while `write` points to the next available position to write retained elements. In an interview, stating the role of both variables upfront demonstrates clear algorithmic structure.

The core principle of read-write pointers is: "Scan the entire array, but write back only the elements that must be preserved." These problems typically require modifying the array in-place and returning the new logical length without allocating a new array.

To determine when to write, ask: Should the element currently pointed to by `read` be preserved? If yes, write it to index `write` and increment `write++`; if not, simply increment `read`.

## Variable-Size Sliding Window

Take "Longest Substring Without Repeating Characters" as an example:

```java
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> count = new HashMap<>();
    int left = 0;
    int ans = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        count.put(c, count.getOrDefault(c, 0) + 1);
        while (count.get(c) > 1) {
            char d = s.charAt(left);
            count.put(d, count.get(d) - 1);
            left++;
        }
        ans = Math.max(ans, right - left + 1);
    }
    return ans;
}
```

In this template, the right pointer expands the window, while the left pointer shrinks the window whenever its state becomes invalid. Because each character enters the window at most once and exits at most once, the time complexity is strictly `O(n)`.

Variable-size sliding window problems follow a consistent cadence:

1. The right pointer incorporates a new element, updating the window's internal state.
2. While the window condition is violated, continuously advance the left pointer and synchronize the state.
3. Update the optimal answer when the window satisfies problem requirements.

The timing of updating the answer differs between longest and shortest window problems:

- Finding the longest valid window: Typically update the answer after the window is restored to a valid state.
- Finding the shortest satisfying window: Typically update the answer as soon as the window satisfies the condition, before continuing to shrink the left boundary.

For example, in "Minimum Window Substring", as soon as the window covers all required characters, we update our best answer and then try shrinking the window. In "Longest Substring Without Repeating Characters", whenever duplicate characters appear, we must first shrink until the window is valid again before updating the maximum length.

## Fixed-Size Sliding Window

Fixed-size windows are tailored for problems specifying "subarrays or substrings of length k":

```java
int maxSum(int[] nums, int k) {
    int window = 0;
    for (int i = 0; i < k; i++) {
        window += nums[i];
    }
    int ans = window;
    for (int right = k; right < nums.length; right++) {
        window += nums[right];
        window -= nums[right - k];
        ans = Math.max(ans, window);
    }
    return ans;
}
```

The core mechanic of a fixed window is that one element enters on the right as one element exits on the left.

Fixed windows do not require a `while` loop for shrinking because the window length remains constant. It acts as a rolling accumulator:

- A new element enters the window.
- The obsolete element falling outside the window is evicted.
- The metric for the current window is evaluated against the answer.

If the window must track dynamic extrema (maximum or minimum), simple scalar variables are insufficient, and a monotonic queue is generally required. For example, in "Sliding Window Maximum", the queue stores indices of potential maximum candidates, with the front of the queue representing the current window's maximum.

## Interview Handwritten Coding Progression

In two pointers and sliding window problems, the most critical mistake during an interview is letting pointer semantics drift halfway through writing code. Follow this structured progression:

1. Identify the pattern first: Opposite shrinking, fast-slow chasing, read-write overwriting, or contiguous sliding window.
2. Define pointer semantics explicitly: Where do `left`, `right`, `slow`, `fast`, and `write` point?
3. Define the window state: Is the window maintaining a sum, frequency map, extreme value, or match count?
4. Define the movement criteria: When does the right pointer expand, and when does the left pointer contract?
5. Determine the answer update timing: Update longest after validity is restored; update shortest while criteria are satisfied.

Remember this distinction in one sentence: **Longest window problems repair the window before updating the answer; shortest window problems record the answer before continuing to shrink.**

## Representative Problem Deep Dive: Minimum Window Substring

[76. Minimum Window Substring](https://leetcode.cn/problems/minimum-window-substring/) is the ultimate test of sliding window mechanics. The problem asks for the shortest substring in `s` that covers all characters in `t` along with their corresponding frequencies.

The key to this problem is not merely knowing how to move pointers, but managing three tracking structures clearly:

- `need`: Required frequencies for each character in target string `t`.
- `window`: Current frequencies of each character within the active window.
- `valid`: The count of unique characters whose required frequencies are currently satisfied.

When `valid == need.size()`, the current window fully covers `t`. At this moment, record/update the minimum answer and attempt to contract the left boundary.

```java
String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    Map<Character, Integer> window = new HashMap<>();
    for (char c : t.toCharArray()) {
        need.put(c, need.getOrDefault(c, 0) + 1);
    }

    int left = 0;
    int valid = 0;
    int start = 0;
    int minLen = Integer.MAX_VALUE;

    for (int right = 0; right < s.length(); right++) {
        char in = s.charAt(right);
        if (need.containsKey(in)) {
            window.put(in, window.getOrDefault(in, 0) + 1);
            if (window.get(in).equals(need.get(in))) {
                valid++;
            }
        }

        while (valid == need.size()) {
            if (right - left + 1 < minLen) {
                start = left;
                minLen = right - left + 1;
            }
            char out = s.charAt(left);
            left++;
            if (need.containsKey(out)) {
                if (window.get(out).equals(need.get(out))) {
                    valid--;
                }
                window.put(out, window.get(out) - 1);
            }
        }
    }

    return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
}
```

Two critical details where bugs frequently occur:

- `valid--` must occur before decrementing `window.get(out)`, because at that exact moment the window just ceased meeting the character's required quota.
- Updating the answer must reside inside the `while (valid == need.size())` loop, because only windows that currently cover `t` qualify for shortest-length comparisons.

## Execution Trace and Boundary Test Cases

Taking "Longest Substring Without Repeating Characters" on input string `abba`, the window state transitions as follows:

| Right Pointer Char | Window After Insertion | Valid? | Left Pointer Movement | Current Longest |
| ------------------ | ---------------------- | ------ | --------------------- | --------------- |
| `a` | `a` | Valid | Does not move | 1 |
| `b` | `ab` | Valid | Does not move | 2 |
| `b` | `abb` | Invalid | Evict `a` (still invalid), then evict first `b` | 2 |
| `a` | `ba` | Valid | Does not move | 2 |

Key boundary scenarios to verify for sliding window solutions:

| Input | Verification Focus |
| ----- | ------------------ |
| Empty string or empty array | Correctly returns 0 immediately |
| All characters identical | Left boundary continuously contracts |
| No duplicate characters | Window expands to full array length without premature contraction |
| Optimal window located at very beginning or very end | Answer update timing correctly captures extreme boundaries |

Common incorrect implementation:

```java
if (count.get(c) > 1) {
    left++; // Incorrect: moving once does not necessarily restore a valid window
}
```

When contracting a variable-size window, a `while` loop is generally required until the window condition is restored. Moving the left pointer only once fails on inputs like `abba` or `aaabc`.

## Common Pitfalls

- Define pointer semantics clearly before writing code rather than guessing mid-implementation.
- Verify answer update timing based on whether the problem asks for the longest or shortest window.
- When contracting the window, synchronize all tracking states (counts, sums, match counters) simultaneously.
- When applying fast-slow pointers to linked lists, always check `fast != null && fast.next != null`.
- In problems like 3Sum, remember to deduplicate both the fixed element and the two pointer targets after sorting.

## High-Frequency Self-Test Questions

- Why are two pointers and sliding window problems typically `O(n)` rather than `O(n^2)` like nested loops?
- Why does 3Sum require sorting first? At which specific points does deduplication take place?
- When finding the midpoint of a linked list with fast-slow pointers, does an even-length list return the first or second midpoint?
- When should sliding window contraction use `if`, and when must it use `while`?
- What is the difference in answer update timing between longest and shortest window problems?

## Recommended Practice Problems

- [26. Remove Duplicates from Sorted Array](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/)
- [15. 3Sum](https://leetcode.cn/problems/3sum/)
- [141. Linked List Cycle](https://leetcode.cn/problems/linked-list-cycle/)
- [3. Longest Substring Without Repeating Characters](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)
- [76. Minimum Window Substring](https://leetcode.cn/problems/minimum-window-substring/)
