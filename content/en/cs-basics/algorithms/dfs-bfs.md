---
title: "DFS and BFS Interview Guide: Trees, Graphs, Matrix Search, and Shortest Path Templates"
description: "A comprehensive guide to DFS and BFS interview questions, covering Depth-First Search, Breadth-First Search, tree traversal, graph traversal, matrix search, level-order traversal, shortest path, and Java templates."
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: DFS,BFS,Depth-First Search,Breadth-First Search,Tree Traversal,Graph Traversal,Matrix Search,Level-Order Traversal,Shortest Path,Java DFS,Java BFS,LeetCode
lang: en
sourceRef: zh-ref/cs-basics/algorithms/dfs-bfs.md
---

DFS (Depth-First Search) and BFS (Breadth-First Search) form the foundation for solving tree, graph, and matrix problems. In interviews, you will rarely just be asked "What is DFS?" More commonly, you will be given an island grid, course dependencies, shortest step count, or binary tree level-order traversal, and be expected to choose the right search strategy and handle boundary conditions cleanly.

A rule of thumb: when you need to explore a path all the way to the end, enumerate all possible paths, or process connected components, prioritize **DFS**. When you need to expand level by level or find the shortest number of steps, prioritize **BFS**.

## Key Interview Assessment Points

- Ability to implement recursive DFS and queue-based BFS.
- Ability to explain the time and space complexity of tree and graph searches.
- Ability to manage `visited` structures to prevent duplicate visits and infinite loops.
- Ability to distinguish between "traversing all nodes" and "finding the shortest number of steps".
- Ability to model matrix problems as graph search problems.

## How to Choose Between DFS and BFS?

Both DFS and BFS can visit all nodes, but they have different natural strengths:

| Goal | Preferred Approach | Reason |
| --- | --- | --- |
| Traverse all nodes | Either DFS or BFS | As long as no nodes are visited repeatedly |
| Find connected component area | DFS is more convenient | Recursively expands all the way; concise code |
| Shortest steps in an unweighted graph | BFS | Expands level by level; the first time a node is reached is the shortest path |
| Enumerate all paths | DFS | Paths naturally live in the call stack |
| Binary tree level-order traversal | BFS | Queue handles nodes layer by layer naturally |

If a problem asks for "minimum steps", "shortest path", or "spreading/diffusing to all locations", think of BFS first. If a problem asks for "all possible combinations/paths", "whether a path exists", or "size of a connected component", think of DFS first.

## DFS Template

A common implementation for matrix DFS:

```java
void dfs(char[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) {
        return;
    }
    if (grid[i][j] != '1') {
        return;
    }
    grid[i][j] = '2';
    dfs(grid, i + 1, j);
    dfs(grid, i - 1, j);
    dfs(grid, i, j + 1);
    dfs(grid, i, j - 1);
}
```

Here, visited land cells are modified directly to `'2'`, which uses the original array as an in-place visited marker. If the problem does not allow modifying the input, instantiate a separate `boolean[][] visited` array.

Before writing a recursive DFS function, define its semantics clearly. The code above can be interpreted as: *Starting from `(i, j)`, visit and mark all connected land cells.*

These semantics dictate the sequence of code execution:

1. Return immediately if coordinates are out of bounds.
2. Return immediately if the current cell is not land (`'1'`).
3. Mark the current cell to prevent repeated visits.
4. Continue recursively in all 4 adjacent directions (up, down, left, right).

Many DFS bugs stem from performing step 3 too late. If you recurse into neighbors before marking the current node, two adjacent cells may endlessly recurse back and forth into each other.

## BFS Template

BFS is well-suited for level-order traversal and shortest-path problems. The following template assumes a non-empty rectangular matrix where `0` represents a walkable cell and `1` represents an obstacle. The function returns the minimum number of steps from start to target, or `-1` if coordinates are invalid or the target is unreachable:

```java
int bfs(int[][] grid, int startX, int startY, int targetX, int targetY) {
    if (grid == null || grid.length == 0 || grid[0].length == 0) {
        return -1;
    }
    int rows = grid.length;
    int columns = grid[0].length;
    if (startX < 0 || startX >= rows || startY < 0 || startY >= columns
            || targetX < 0 || targetX >= rows || targetY < 0 || targetY >= columns
            || grid[startX][startY] == 1 || grid[targetX][targetY] == 1) {
        return -1;
    }
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    Queue<int[]> queue = new ArrayDeque<>();
    queue.offer(new int[] {startX, startY});
    boolean[][] visited = new boolean[rows][columns];
    visited[startX][startY] = true;
    int step = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int k = 0; k < size; k++) {
            int[] cur = queue.poll();
            if (cur[0] == targetX && cur[1] == targetY) {
                return step;
            }
            for (int[] dir : dirs) {
                int x = cur[0] + dir[0];
                int y = cur[1] + dir[1];
                if (x < 0 || x >= rows || y < 0 || y >= columns
                        || visited[x][y] || grid[x][y] == 1) {
                    continue;
                }
                visited[x][y] = true;
                queue.offer(new int[] {x, y});
            }
        }
        step++;
    }
    return -1;
}
```

This code returns the current level (`step`) as soon as the target node is polled from the queue, rather than waiting for the queue to empty. Specific problems might use different values instead of `0` and `1` to indicate walkable paths, so adjust according to the problem requirements.

The core idea of BFS is **level-by-level processing**. Initially, the queue contains nodes at level 0. In each iteration, take the current queue size `size` and only process nodes belonging to that level; newly discovered valid neighbors belong to the next level.

Why can BFS find the shortest path in an unweighted graph? Because every edge has equal weight (cost). When BFS reaches a node for the first time, it has traversed the minimum number of edges. Any subsequent visit to that node would require at least as many edges, so it is safe to mark it visited immediately.

Multi-source BFS is also common. For instance, in "Rotting Oranges", all rotten oranges begin rotting adjacent fresh oranges simultaneously. The standard approach is to enqueue all initial rotten oranges together at the start, and then expand layer by layer.

## Difference Between Tree Search and Graph Search

Trees have no cycles, so a `visited` set is often unnecessary. Graphs may contain cycles, so preventing duplicate visits is mandatory.

| Scenario | Is `visited` Typically Needed? | Explanation |
| --- | --- | --- |
| Binary tree recursive traversal | Usually No | Nodes do not have edges leading back to their parents |
| Undirected graph traversal | Yes | Otherwise two connected nodes would visit each other infinitely |
| Directed graph traversal | Usually Yes | Directed cycles may exist |
| Matrix search | Yes | Up, down, left, right steps could loop back to previous cells |

## Complexity

In graph algorithms, `V` typically denotes the number of vertices and `E` denotes the number of edges. With an adjacency list representation, the time complexity of both DFS and BFS is typically `O(V + E)`, and the space complexity is `O(V)`.

For matrix search on an `m * n` grid where each cell is visited at most once, the time complexity is `O(m * n)`. The space complexity for the visited markers or the queue in the worst case is also `O(m * n)`.

## How to Convert Matrix Problems into Graphs?

Each cell in a matrix can be viewed as a vertex in a graph. The 4 adjacent directions (up, down, left, right) represent outgoing edges connected to that vertex.

Common direction array:

```java
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
```

When traversing neighbors, you only need to perform 3 actions:

1. Calculate the new coordinates.
2. Check if the coordinates are out of bounds.
3. Check whether the cell has already been visited or violates problem constraints.

If diagonal moves are permitted, expand the direction array to 8 directions. Avoid writing 4 separate, nearly identical blocks of recursive calls; a direction array is cleaner and reduces edge-case bugs.

## Step-by-Step Walkthrough and Boundary Test Cases

Taking "Number of Islands" as an example: whenever an unvisited land cell is encountered, initiate DFS/BFS from it to mark the entire island.

| Step | Operation | Purpose |
| --- | --- | --- |
| 1 | Scan the matrix to find a `'1'` | Discover a new island |
| 2 | Increment island count by 1 | Record the connected component |
| 3 | Run DFS/BFS from the current cell | Mark all land cells of this island |
| 4 | Continue scanning subsequent cells | Avoid counting the same island multiple times |

Recommended boundary test cases for matrix search:

| Input | Key Verification |
| --- | --- |
| Empty matrix | Check whether row and column lengths are verified first |
| All water | The result should be 0 |
| All land | Should be counted as exactly 1 connected component |
| Diagonally adjacent only | Cannot be considered connected if only 4 directions are allowed |

Common incorrect pattern:

```java
void dfs(char[][] grid, int i, int j) {
    dfs(grid, i + 1, j);
    grid[i][j] = '2'; // Error: marked too late, may cause back-and-forth recursion
}
```

Visited marks must be set before recursing into neighboring cells. In graphs and matrices, wherever reciprocal edges exist, delaying the mark leads to duplicate visits or StackOverflowError.

## Common Pitfalls

- Mark nodes as visited **at the time of enqueueing** in BFS, rather than when polling, to avoid enqueueing the same node multiple times.
- Deep recursion in DFS can cause `StackOverflowError`; in interviews, mention that it can be rewritten using an explicit stack.
- In matrix problems, check bounds before accessing array elements.
- In undirected graphs, take care not to traverse backwards from a child node to its parent node.
- When computing the shortest path, ensure the step count in BFS is strictly synchronized with each level (`queue.size()`).

## Recommended Practice Problems

- [102. Binary Tree Level Order Traversal](https://leetcode.cn/problems/binary-tree-level-order-traversal/)
- [200. Number of Islands](https://leetcode.cn/problems/number-of-islands/)
- [695. Max Area of Island](https://leetcode.cn/problems/max-area-of-island/)
- [994. Rotting Oranges](https://leetcode.cn/problems/rotting-oranges/)
- [207. Course Schedule](https://leetcode.cn/problems/course-schedule/)
