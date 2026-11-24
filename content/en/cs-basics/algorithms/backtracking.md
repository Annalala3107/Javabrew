---
title: "Backtracking Algorithm Interview Guide: Combinations, Permutations, Subsets, Pruning, and Java Templates"
description: "A comprehensive guide to backtracking interview questions, covering problem pattern recognition, templates for combinations, permutations, and subsets, deduplication, pruning techniques, complexity analysis, and high-frequency LeetCode problems."
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: Backtracking,Backtracking Template,Combinations,Permutations,Subsets,N-Queens,Pruning,Java Backtracking,LeetCode Backtracking,Algorithm Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/algorithms/backtracking.md
---

Backtracking problems have very distinct characteristics: they typically ask you to find all possible solutions, all valid paths, all combinations, or to explore possibilities among a set of choices. Backtracking is very similar to DFS; the difference is that backtracking explicitly emphasizes the pattern: **"Make a choice -> Recurse -> Undo the choice (backtrack)"**.

In an interview, the most important step when writing backtracking is to clarify the exact semantics of your recursive function first. Once the function's contract is solid, parameters, termination conditions, and undo logic will naturally fall into place without confusion.

## Key Interview Assessment Points

- Ability to implement standard templates for combinations, permutations, and subsets.
- Ability to explain the roles of `path`, `startIndex`, and `used`.
- Ability to determine whether deduplication is needed based on the problem statement.
- Ability to perform pruning to eliminate invalid search branches.
- Ability to explain that time complexity depends directly on the scale of the solution space.

## How to Think Through Backtracking Problems?

A backtracking problem can be visualized as a **decision tree** (search tree). Each level of the tree represents a choice step: the root node represents the state before any choices are made, and the leaf nodes represent complete potential candidate solutions.

Before writing code, answer these 4 questions:

1. **What is the current path?** Typically the elements chosen so far, named `path` in code.
2. **What is the choice list?** What elements are currently available to choose from?
3. **What is the termination condition?** When should `path` be copied and added to the final results?
4. **Is pruning needed?** Which choices are guaranteed not to yield a valid solution?

"Undoing the choice" in a backtracking template is not mere ritual. Because `path` is reused across recursive branches, the current branch must restore the state after exploration so the next sibling branch can start with a clean slate.

## Combinations Template

Combinations do not care about element ordering; we typically use `startIndex` to govern where the next level should start picking from:

```java
List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> ans = new ArrayList<>();
    backtrack(1, n, k, new ArrayList<>(), ans);
    return ans;
}

void backtrack(int start, int n, int k, List<Integer> path, List<List<Integer>> ans) {
    if (path.size() == k) {
        ans.add(new ArrayList<>(path));
        return;
    }
    for (int i = start; i <= n; i++) {
        path.add(i);
        backtrack(i + 1, n, k, path, ans);
        path.remove(path.size() - 1);
    }
}
```

Because combination problems ignore order, `[1, 2]` and `[2, 1]` represent the exact same combination. The role of `start` is to ensure that subsequent choices can only pick numbers after the current position, preventing duplicate combinations.

When picking `k` numbers from `1..n`, pruning can be applied to the loop condition:

```java
for (int i = start; i <= n - (k - path.size()) + 1; i++) {
    // ...
}
```

The intuition is: if starting from `i`, the remaining numbers in the array are insufficient to assemble a combination of size `k`, there is no need to continue the search.

## Permutations Template

Permutations care about ordering; we typically use a boolean array `used` to mark whether an element has already been picked:

```java
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> ans = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(nums, used, new ArrayList<>(), ans);
    return ans;
}

void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> ans) {
    if (path.size() == nums.length) {
        ans.add(new ArrayList<>(path));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) {
            continue;
        }
        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, used, path, ans);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

Since order matters in permutations, each recursion level can choose from all available numbers, with the sole restriction that the same element cannot be reused. `used[i]` tracks whether `nums[i]` is already present in the current path.

If the input array contains duplicate numbers, deduplication in permutations is more error-prone than in combinations. The standard approach is to sort the array first, and then skip elements on the same level if the preceding identical number has not yet been used:

```java
if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) {
    continue;
}
```

This enforces a fixed relative selection order for duplicate numbers at the same tree level, preventing duplicate permutations from being generated.

## Subsets Template

In subset problems, every node on the decision tree represents a valid answer:

```java
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> ans = new ArrayList<>();
    backtrack(0, nums, new ArrayList<>(), ans);
    return ans;
}

void backtrack(int start, int[] nums, List<Integer> path, List<List<Integer>> ans) {
    ans.add(new ArrayList<>(path));
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(i + 1, nums, path, ans);
        path.remove(path.size() - 1);
    }
}
```

Subset problems are very similar to combination problems, but instead of collecting answers only when a fixed length is reached, we collect the answer at every single node visited. This is because paths of any length constitute valid subsets.

If the problem requires handling duplicate elements (e.g., input `[1, 2, 2]`), sort the array first, and then skip identical elements at the same tree level:

```java
if (i > start && nums[i] == nums[i - 1]) {
    continue;
}
```

## How to Handle Deduplication?

When the input contains duplicate elements, sort the input first, then choose a deduplication strategy according to the problem category:

- For problems like subsets and combinations where choices proceed forward by index, skip duplicate elements on the same level using: `i > start && nums[i] == nums[i - 1]`.
- For permutation problems where every level scans from index 0, combine the check with `used[]` to prevent reusing the same position.
- Distinguish carefully between **duplicate choices on the same level (tree branch)** versus **duplicate elements along the same vertical path**. The former generates redundant solutions, whereas the latter may be explicitly allowed by the problem.

## Step-by-Step Walkthrough and Boundary Test Cases

Taking the combination problem with `n = 3, k = 2` as an example, the decision tree can be simplified as follows:

| Level 1 Choice | Level 2 Available Choices | Result Generated |
| --- | --- | --- |
| Choose 1 | 2, 3 | `[1, 2]`, `[1, 3]` |
| Choose 2 | 3 | `[2, 3]` |
| Choose 3 | None | Fewer than 2 numbers remaining; pruned |

Recommended boundary test cases for backtracking problems:

| Input | Key Verification |
| --- | --- |
| Empty array | Subset problems should typically return `[[]]` |
| `k = 0` | Check if combination problems properly return an empty combination |
| Contains duplicate elements | Check whether sorting and same-level deduplication are performed |
| Only one result | Ensure `path` is copied correctly before adding to the result |

Common incorrect pattern:

```java
ans.add(path); // Error: subsequent operations will mutate path
```

It must be written as:

```java
ans.add(new ArrayList<>(path));
```

The `path` in backtracking is a reused object. Adding a reference directly means all entries in `ans` will be modified together by subsequent recursive calls and rollbacks.

## Common Pitfalls

- Always create a shallow/deep copy of `path` when adding it to the result list; never store the raw reference.
- Use `startIndex` for combinations and `used` for permutations—do not mix them up.
- Deduplication almost always requires sorting the array beforehand.
- Pruning conditions must never prune valid solutions.
- The complexity of backtracking is often proportional to the total number of valid solutions; do not casually write `O(n)`.

## Recommended Practice Problems

- [77. Combinations](https://leetcode.cn/problems/combinations/)
- [78. Subsets](https://leetcode.cn/problems/subsets/)
- [46. Permutations](https://leetcode.cn/problems/permutations/)
- [39. Combination Sum](https://leetcode.cn/problems/combination-sum/)
- [51. N-Queens](https://leetcode.cn/problems/n-queens/)
