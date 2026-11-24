---
title: "Union-Find Interview Questions Summary: Path Compression, Connectivity, and Java Template"
description: Union-Find interview question summary covering Disjoint Set Union (DSU), find, union, path compression, union by size, connectivity, cycle detection, number of provinces, and high-frequency LeetCode questions.
category: CS Basics
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Union-Find,Disjoint Set Union,path compression,union by size,connectivity,graph algorithms,cycle detection,number of provinces,Java Union-Find,LeetCode
lang: en
sourceRef: zh-ref/cs-basics/data-structure/union-find.md
---

# Union-Find Interview Questions Summary: Path Compression, Connectivity, and Java Template

Union-Find is specifically designed to solve "grouping" and "connectivity" problems. Do two elements belong to the same group? How many connected components remain after merging two sets? Does adding an edge to a graph create a cycle? All of these can be efficiently handled with Union-Find.

In interviews, its implementation is concise, but failing to write `find` properly will directly hurt its time complexity.

Article Overview:

1. What is Union-Find?
2. How does Union-Find represent sets using an array?
3. What do `find`, `union`, and `connected` do respectively?
4. Why do path compression and union by size speed up operations?
5. Which connectivity problems are suitable for Union-Find?

![Union-Find forest structure representing connected components with parent pointers](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/union-find-9e44f9d8.png)

## What is Union-Find?

Union-Find (also known as Disjoint Set Union, or DSU) maintains a collection of mutually disjoint sets. It is best at answering two types of questions:

1. **Query**: Do two elements currently belong to the same set?
2. **Merge**: Merge the sets containing two given elements into a single set.

It does not care about the complete internal structure of a set, nor does it track the specific sequence of edges connecting two vertices. For example, in a social network, Union-Find can quickly tell you whether person A and person B belong to the same social circle; however, it will not tell you the shortest path between A and B.

This is the primary distinction between Union-Find and BFS/DFS: BFS and DFS explore the graph dynamically on the fly each time; Union-Find, on the other hand, maintains connectivity relationships incrementally throughout merge operations, so subsequent queries simply check whether the representative root nodes of two elements match.

## How Does Union-Find Represent Sets?

Union-Find typically uses a `parent` array to represent a forest composed of multiple trees:

- `parent[x]` denotes the parent node of element `x`.
- If `parent[x] == x`, it means `x` is the root node of its set.
- Each set is uniquely represented by its root node.

During initialization, each element forms an independent set, so every element's parent points to itself:

```text
parent[0] = 0
parent[1] = 1
parent[2] = 2
...
```

After executing `union(0, 1)`, the root node of `1` can be attached under the root node of `0`. At this point, `0` and `1` belong to the same set. When continuing with `union(1, 2)`, even though the arguments are `1` and `2`, what actually gets merged is the root node of `1` and the root node of `2`.

Therefore, the key in Union-Find is not "who the direct parent of the current node is," but rather "who the ultimate root node is when traveling up along parent pointers." This is exactly what `find(x)` achieves.

## Three Core Operations

Common Union-Find operations can be summarized into three methods:

| Operation | Purpose |
| --------- | ------- |
| `find(x)` | Finds the representative node (the root node) of the set containing `x` |
| `union(a, b)` | Merges the two sets containing `a` and `b` |
| `connected(a, b)` | Checks whether the representative nodes of `a` and `b` are identical |

If two elements share the same root node, they already belong to the same set. If their root nodes differ, `union` attaches one root node beneath the other.

## Key Interview Evaluation Points

- Ability to implement `find` and `union` correctly.
- Ability to explain the purpose and mechanics of path compression.
- Ability to use Union-Find to count connected components.
- Ability to handle cycle detection in graphs, friend circles, number of provinces, and equality equations.
- Ability to explain why Union-Find is well-suited for dynamic merging but ill-suited for frequent deletions.

## From Quick Find to Quick Union

When understanding Union-Find, it helps to examine two extreme designs:

- **Quick Find**: The array directly stores the set ID for each element. Checking whether two elements are in the same set is $O(1)$, but merging two sets requires scanning the entire array to update set IDs ($O(n)$).
- **Quick Union**: The array stores parent pointers, representing sets via root nodes. Merging only requires modifying a single root's parent pointer, but if the tree becomes tall and skewed, `find` degrades to $O(n)$.

In interviews and coding problems, the standard approach is an optimized version of Quick Union: **Path Compression + Union by Size/Rank**.

- **Path Compression**: During each `find(x)`, attach all visited nodes directly under the root node, making future lookups on these nodes much faster.
- **Union by Size**: When merging two sets, attach the smaller tree under the larger tree to prevent the tree height from growing unnecessarily.

Combining these two optimizations reduces the amortized cost of Union-Find operations to nearly constant time.

## Basic Template

```java
class UnionFind {
    private final int[] parent;
    private final int[] size;
    private int count;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }

    boolean union(int a, int b) {
        int rootA = find(a);
        int rootB = find(b);
        if (rootA == rootB) {
            return false;
        }
        if (size[rootA] < size[rootB]) {
            parent[rootA] = rootB;
            size[rootB] += size[rootA];
        } else {
            parent[rootB] = rootA;
            size[rootA] += size[rootB];
        }
        count--;
        return true;
    }

    boolean connected(int a, int b) {
        return find(a) == find(b);
    }

    int count() {
        return count;
    }
}
```

`parent[x]` represents the parent node of `x`. The root node's parent is itself. Path compression connects all nodes along the search path directly to the root node, accelerating subsequent queries.

Two details in this template are especially noteworthy:

1. In `find()`, `parent[x] = find(parent[x])` performs path compression. Once the recursion returns the root node, `x` is pointed directly to that root.
2. In `union()`, comparing `size` decides which root attaches to which, implementing union by size. This minimizes tree height growth.

`count` represents the current number of connected components. Only when `union()` successfully merges two previously disconnected sets is `count` decremented by 1; if the two elements were already connected, `count` must not be decremented.

## Complexity

With both path compression and union by size applied, the amortized time complexity of a single Union-Find operation is $O(\alpha(n))$, where $\alpha(n)$ is the inverse Ackermann function, which grows extremely slowly (remaining $\le 4$ for any practical value of $n$). In interviews, stating "nearly constant time $O(1)$" is generally sufficient.

The space complexity is $O(n)$, primarily consumed by the `parent` and `size` arrays.

## Typical Scenarios

| Scenario | Handling Approach |
| -------- | ----------------- |
| Check if two nodes are connected | Compare `find(a)` and `find(b)` |
| Merge two sets | `union(a, b)` |
| Count connected components | Initialize to `n`, decrement by 1 on each successful merge |
| Detect cycles in an undirected graph | If the endpoints of an edge are already connected, adding the edge forms a cycle |
| Satisfiability of equality equations | First merge all equality relations, then verify whether any inequality relations conflict |

Union-Find is especially well-suited for problems involving "incremental merging of relationships and querying set membership," such as Number of Provinces, Redundant Connection, Accounts Merge, and Kruskal's algorithm for Minimum Spanning Trees.

However, Union-Find is not suitable for handling edge deletions. Once two sets are merged, information about which specific edges created the connectivity is compressed away. If an edge is removed, determining whether the set remains connected cannot be resolved simply by altering the `parent` array.

## Common Pitfalls

- `find` must return the root node, not just the direct parent node.
- In path compression, ensure the recursive return value is assigned: `parent[x] = find(parent[x])`.
- In `union`, only decrement the connected component count when the two sets were not previously connected.
- Union-Find excels at merging but cannot easily handle relationship deletions.
- In 2D grid problems, map `(i, j)` coordinates to a 1D index, such as `i * cols + j`.

## Recommended Practice Problems

- [547. Number of Provinces](https://leetcode.cn/problems/number-of-provinces/)
- [684. Redundant Connection](https://leetcode.cn/problems/redundant-connection/)
- [990. Satisfiability of Equality Equations](https://leetcode.cn/problems/satisfiability-of-equality-equations/)
- [1319. Number of Operations to Make Network Connected](https://leetcode.cn/problems/number-of-operations-to-make-network-connected/)
- [200. Number of Islands](https://leetcode.cn/problems/number-of-islands/)

## References

- [Algorithms, 4th Edition: Union-Find](https://algs4.cs.princeton.edu/15uf/)
- [Algorithms, 4th Edition: WeightedQuickUnionPathCompressionUF](https://algs4.cs.princeton.edu/15uf/WeightedQuickUnionPathCompressionUF.java.html)
- [CP-Algorithms: Disjoint Set Union](https://cp-algorithms.com/data_structures/disjoint_set_union.html)
