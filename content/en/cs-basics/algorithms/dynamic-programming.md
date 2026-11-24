---
title: "Dynamic Programming Interview Guide: State Transitions, Knapsack, Subsequences, and Java Templates"
description: "A comprehensive guide to dynamic programming interview questions, covering state definitions, state transitions, initialization, iteration orders, 0-1 knapsack, unbounded knapsack, subsequences, interval DP, and high-frequency LeetCode problems."
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: Dynamic Programming,DP,State Transition,Knapsack Problem,0-1 Knapsack,Unbounded Knapsack,Subsequence,Interval DP,Java Dynamic Programming,LeetCode Dynamic Programming
lang: en
sourceRef: zh-ref/cs-basics/algorithms/dynamic-programming.md
---

Dynamic Programming (DP) is challenging not because the code is necessarily long, but because if your state definition is incorrect, the transition equation, base case initialization, and iteration order will inevitably collapse as well.

In an interview, avoid jumping straight into reciting templates. First ask yourself two questions: Can this problem be broken down into subproblems? Does the current answer depend on previously computed subproblems? If both conditions hold true, only then consider Dynamic Programming.

## Key Interview Assessment Points

- Ability to articulate the precise semantic meaning of `dp[i]` or `dp[i][j]`.
- Ability to derive and write the state transition equation.
- Ability to handle initialization and iteration order correctly.
- Ability to determine whether space optimization (rolling array/variables) is possible.
- Ability to distinguish between common DP categories: Knapsack, Subsequences, Intervals, Grid paths, etc.

## When Should You Consider Dynamic Programming?

Do not reach for DP simply because you see an "optimum" (maximum or minimum) requested. A more reliable criterion is checking two properties:

1. **Optimal Substructure:** Can the problem be decomposed into smaller subproblems of the same nature?
2. **Overlapping Subproblems:** Are the same subproblems calculated repeatedly?

Take the Fibonacci sequence as a basic example: `f(n)` depends on `f(n - 1)` and `f(n - 2)`, and `f(n - 2)` is evaluated multiple times across the recursion tree. Storing these intermediate results to eliminate redundant calculations is the essence of DP.

In an interview, start by explaining the brute-force recursive approach, point out exactly where redundant subcomputations occur, and then transition to memoization (top-down) or a tabular approach (bottom-up). This problem-solving progression proves to the interviewer that you genuinely understand the principles rather than merely memorizing formulas.

## The 5-Step DP Method

1. **Define the state:** What does `dp[i]` explicitly represent?
2. **Formulate the state transition:** From which previous states can the current state be derived?
3. **Initialize base cases:** What are the answers when there are no prior states?
4. **Determine iteration order:** Which states must be computed first, and which come later?
5. **Verify with examples:** Trace the array by hand using a small concrete input.

Step 1 is the most critical. If the meaning of `dp[i]` is ambiguous, writing the remaining code becomes trial and error.

A solid state definition typically satisfies:

- It directly covers or leads to the answer requested by the problem.
- It can be derived cleanly from smaller states.
- It keeps dimensions as minimal as possible without muddying the semantic meaning.

## 1D DP Example

The Climbing Stairs problem:

```java
int climbStairs(int n) {
    if (n <= 2) {
        return n;
    }
    int prev2 = 1;
    int prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int cur = prev1 + prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```

State semantics: the number of distinct ways to reach step `i`. State transition equation: `dp[i] = dp[i - 1] + dp[i - 2]`.

This can also be deduced intuitively:

```text
To make the final step to reach rung i, you either take 1 step from i - 1, or 2 steps from i - 2.
```

Thus, `dp[i]` only depends on the preceding two states, allowing the array to be compressed into two scalar variables. The prerequisite for space compression is confirming that older states will never be accessed again.

## 0-1 Knapsack Template

Each item can be selected at most once:

```java
int knapsack01(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int j = capacity; j >= weights[i]; j--) {
            dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

The capacity loop must iterate in **reverse order** to prevent the same item from being reused within the same outer iteration.

The reverse traversal order is the most frequently questioned detail in 0-1 Knapsack problems. If capacity were traversed in forward order, calculating `dp[j]` could use `dp[j - weight]` that was already updated during the *current* round, effectively selecting the same item multiple times—which turns it into an Unbounded Knapsack problem.

Typical 0-1 knapsack problems do not always mention a "knapsack" explicitly. For example, "Can an array be partitioned into two subsets of equal sum?" can be transformed into: Can we pick a subset of numbers such that their sum equals half of the total sum?

## Unbounded Knapsack Template

Each item can be selected an unlimited number of times:

```java
int unboundedKnapsack(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int j = weights[i]; j <= capacity; j++) {
            dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

The capacity loop iterates in **forward order**, explicitly allowing the current item to be reused.

In an Unbounded Knapsack, forward traversal allows multiple picks of the current item. In coin change problems, for example, each coin denomination is available in infinite supply; when calculating larger amounts, the transition builds upon states where the current coin has already been considered.

If the problem asks for the number of combinations vs. permutations, the order of loops changes:

- **Combinations:** Typically loop over items first, then over capacities.
- **Permutations:** Typically loop over capacities first, then over items.

While not every interviewer probes deeply into this nuance, it is critical for problems like Coin Change II.

## Common Problem Types

| Problem Type | State Formulation | Representative Problems |
| --- | --- | --- |
| Climbing Stairs / House Robber | `dp[i]` represents the optimal value for the first `i` positions | 70, 198 |
| Knapsack | `dp[j]` represents the optimal value or combination count for capacity `j` | 416, 518, 322 |
| Subsequences | `dp[i]` or `dp[i][j]` represents the answer ending at a position or for two prefixes | 300, 1143 |
| Palindromes | `dp[i][j]` represents whether interval `[i, j]` satisfies conditions or its optimal value | 647, 516 |
| Grid Paths | `dp[i][j]` represents the answer when reaching grid coordinate `(i, j)` | 62, 64 |

## Memoized Search vs. Tabulation

Both approaches store answers to overlapping subproblems.

| Approach | Characteristics | Best Suited For |
| --- | --- | --- |
| Memoized Search (Top-down) | Recurses down from the target state, computing on demand | Complex state transitions, natural recursive formulations |
| Tabulation (Bottom-up) | Fills a table starting from base states upwards | Clear iteration order, easy space optimization |

If determining the bottom-up iteration order is difficult at first, start with memoized recursion. Once state dependencies are crystal clear, convert it to iterative tabulation. For many Tree DP and Interval DP problems, memoized search is often much easier to implement correctly.

## The Interview Thought Process

When tackling DP problems in an interview, do not begin directly with code. Articulate these 4 statements clearly beforehand:

1. What the `dp` array semantically represents, and which index holds the final result.
2. Which previous states the current state depends on, and why those previous states are guaranteed to be evaluated beforehand.
3. Why the base cases are initialized that way—especially what `0`, `1`, or infinity signify.
4. Why the chosen loop direction avoids premature state overwrites or invalid state reuse.

If these four points cannot be clearly articulated, the implementation is likely based on memory rather than comprehension, making it vulnerable when variations are introduced.

## Deep Dive: Coin Change

[322. Coin Change](https://leetcode.cn/problems/coin-change/) is an exemplary Unbounded Knapsack problem frequently asked in interviews. Given coin denominations and a target amount, find the fewest coins needed to make up that amount, with an infinite supply of each coin denomination.

State definition:

```text
dp[j] represents the minimum number of coins needed to make up amount j.
```

Initialization is crucial: `dp[0] = 0`, as zero coins are required to make up amount 0. All other amounts are initialized to an impossible large value (such as `amount + 1`) to signify that they are initially unreachable.

Note: `Arrays.fill` requires importing `java.util.Arrays`.

```java
int coinChange(int[] coins, int amount) {
    int max = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, max);
    dp[0] = 0;

    for (int coin : coins) {
        for (int j = coin; j <= amount; j++) {
            dp[j] = Math.min(dp[j], dp[j - coin] + 1);
        }
    }

    return dp[amount] == max ? -1 : dp[amount];
}
```

Why is capacity traversed in forward order? Because each coin can be used multiple times. When computing `dp[j]`, we reference `dp[j - coin]`. If `dp[j - coin]` has already been updated by the current coin in the same pass, it indicates that the current coin can be chosen again, matching the Unbounded Knapsack pattern.

If the problem stated "each coin denomination can only be used once", capacity would need to be traversed in reverse order. Traversal direction is not a syntactic style preference—it controls whether the same entity can participate in state transitions repeatedly.

## Comparing State Definitions

DP difficulties rarely arise from inability to write a transition; they usually stem from choosing the wrong state definition. The following states appear similar but require completely different formulations:

| Problem Type | State Semantics | Transition Focus |
| --- | --- | --- |
| Longest Increasing Subsequence (LIS) | `dp[i]` represents LIS length **ending with** `nums[i]` | Must include `nums[i]`; look back for smaller previous values |
| House Robber | `dp[i]` represents maximum profit across the **first `i` houses** | Rob or skip house `i` |
| Longest Common Subsequence (LCS) | `dp[i][j]` represents LCS length of two prefixes | Compare the last characters of both prefixes |
| Palindromic Substrings | `dp[i][j]` represents whether interval `[i, j]` is a palindrome | Depends on inner interval `[i + 1, j - 1]` |

In an interview, proactively state: *"Here `dp[i]` represents ending strictly at index i, not the optimal value among the first i elements."* This distinction prevents errors in subsequence problems.

## Step-by-Step Walkthrough and Boundary Test Cases

Using Climbing Stairs as an example, state changes for `n = 5` are as follows:

| `i` | `dp[i - 2]` | `dp[i - 1]` | `dp[i]` |
| --- | --- | --- | --- |
| 3 | 1 | 2 | 3 |
| 4 | 2 | 3 | 5 |
| 5 | 3 | 5 | 8 |

The key takeaway is that each state only depends on the two preceding positions, allowing the entire array to be compressed into two variables.

Recommended boundary test cases for DP problems:

| Input | Key Verification |
| --- | --- |
| `n = 0` or empty array | Verify if initialization handles it gracefully |
| Array with only 1 element | Check for out-of-bounds access like `dp[1]` |
| Target cannot be formed | Ensure initial values properly represent "unreachable" |
| Counting total combinations | Verify that initialization and loop orders correctly prevent duplicates |

Common incorrect pattern:

```java
for (int j = weights[i]; j <= capacity; j++) {
    dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]); // Incorrect for 0-1 Knapsack
}
```

In 0-1 Knapsack, the capacity loop must run in reverse. Forward traversal causes newly updated states from the current iteration to be reused, resulting in an item being picked multiple times.

## Common Pitfalls

- Keep the semantic meaning of `dp` consistent throughout derivation.
- Do not blindly initialize arrays with 0; the values must strictly reflect the state semantics.
- Traverse capacity in reverse order for 0-1 Knapsack, and in forward order for Unbounded Knapsack.
- Counting combinations versus finding optimal extrema requires different initialization logic.
- In subsequence problems, clearly distinguish between "ending strictly at `i`" versus "within the first `i` elements".

## Self-Check Questions for Interviews

- Why must the first step of Dynamic Programming always be defining the state?
- What is the difference between memoized recursion and tabulation? When is it safer to write memoization first?
- Why must capacity be traversed in reverse in 0-1 Knapsack?
- Why can capacity be traversed forward in Unbounded Knapsack?
- How does the transition equation differ when `dp[i]` means "ending at `i`" versus "within the first `i` elements"?
- What initialization considerations apply when finding minimum steps, maximum values, or total combinations?

## Recommended Practice Problems

- [70. Climbing Stairs](https://leetcode.cn/problems/climbing-stairs/)
- [198. House Robber](https://leetcode.cn/problems/house-robber/)
- [322. Coin Change](https://leetcode.cn/problems/coin-change/)
- [416. Partition Equal Subset Sum](https://leetcode.cn/problems/partition-equal-subset-sum/)
- [300. Longest Increasing Subsequence](https://leetcode.cn/problems/longest-increasing-subsequence/)
- [1143. Longest Common Subsequence](https://leetcode.cn/problems/longest-common-subsequence/)
