---
title: Detailed Explanation of Graph (DFS, BFS, Shortest Path)
description: Introduces the fundamental concepts and common representations of graphs, combining core algorithms like DFS/BFS with application scenarios to master essential graph theory fundamentals.
category: CS Basics
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Graph,adjacency list,adjacency matrix,DFS,BFS,degree,directed graph,undirected graph,connectivity
lang: en
sourceRef: zh-ref/cs-basics/data-structure/graph.md
---

# Graph

A graph is a relatively complex non-linear data structure. **Why do we say it is relatively complex?**

Based on our previous studies, we know:

- Elements in linear data structures satisfy a unique linear relationship, where each element (except the first and the last) has exactly one direct predecessor and one direct successor.
- Elements in tree-like data structures have distinct hierarchical relationships.

However, the relationships among elements in a graph structure can be completely arbitrary.

**What is a graph?** Simply put, a graph is a collection composed of a finite, non-empty set of vertices and a set of edges connecting these vertices. It is commonly represented as: **G(V, E)**, where $G$ denotes a graph, $V$ represents the set of vertices, and $E$ represents the set of edges.

The image below illustrates a graph data structure, which is specifically a directed graph.

![Directed graph](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/directed-graph-d75b319e.png)

There are many examples of graphs in our daily lives! For instance, friendship relationships on social networking platforms can be naturally represented as a graph.

## Basic Concepts of Graphs

### Vertex

The data elements within a graph are called vertices. A graph must have at least one vertex (a non-empty finite set).

In a social network friendship graph, each user represents a vertex.

### Edge

The relationship between two vertices is represented by an edge.

In a social network friendship graph, if two users are friends, an edge exists between them.

### Degree

Degree indicates the number of edges connected to a vertex. In a directed graph, it is further divided into out-degree and in-degree. The out-degree represents the number of edges leaving that vertex, while the in-degree represents the number of edges entering that vertex.

In a friendship graph, a user's degree represents their total number of friends.

### Undirected Graph and Directed Graph

Edges represent relationships between vertices. Some relationships are bidirectional: for example, classmates. If A is B's classmate, B is certainly A's classmate. When representing the relationship between A and B, direction does not matter, and it is depicted by an edge without arrowheads. Such a graph is called an undirected graph.

Other relationships have directions: for instance, parent-child relationships, teacher-student relationships, or follower relationships on Weibo/Twitter. A is B's father, but B is certainly not A's father; A follows B, but B does not necessarily follow A. In these cases, we use edges with arrowheads to indicate the direction of the relationship. Such a graph is called a directed graph.

### Unweighted Graph and Weighted Graph

For a relationship, if we only care whether the relationship exists and do not care about its strength, we can represent it with an unweighted graph.

If we care about both the existence and the intensity of the relationship—for example, describing connections between two cities on a map where distance is required—we represent it using a weighted graph. Each edge in a weighted graph is assigned a numerical value called a weight, representing the strength or cost of the relationship.

The image below shows a weighted directed graph.

![Weighted directed graph](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/weighted-directed-graph-2a8ed8da.png)

## Graph Storage Representations

### Adjacency Matrix Storage

An adjacency matrix stores a graph using a two-dimensional matrix, providing an intuitive representation.

If a relationship exists between the $i$-th vertex and the $j$-th vertex with a weight of $n$, then `A[i][j] = n`.

In an unweighted graph, we only care whether a relationship exists. Thus, when vertex $i$ and vertex $j$ are connected, `A[i][j] = 1`; when they are not connected, `A[i][j] = 0`. As shown below:

![Adjacency matrix representation of undirected graph](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-matrix-representation-of-undirected-gr-ad668687.png)

It is worth noting that: **the adjacency matrix of an undirected graph is always a symmetric matrix, because in an undirected graph, if vertex $i$ is connected to vertex $j$, then vertex $j$ is inevitably connected to vertex $i$.**

![Adjacency matrix representation of directed graph](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-matrix-representation-of-directed-grap-c5354aee.png)

The advantage of adjacency matrix storage is that it is straightforward (using a simple 2D array), and checking whether a relationship exists between two vertices is extremely efficient ($O(1)$ by directly reading the array cell). However, its drawback is equally evident: it consumes substantial memory space ($O(V^2)$).

### Adjacency List Storage

To address the excessive memory consumption of adjacency matrices, another graph storage representation was created—the **adjacency list**.

An adjacency list uses a linked list (or dynamic array) to store all successor adjacent vertices of a given vertex. For each vertex $V_i$ in the graph, all vertices $V_j$ adjacent to $V_i$ are linked into a single linked list. This linked list is known as the **adjacency list** of vertex $V_i$. As shown below:

![Adjacency list representation of undirected graph](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-list-representation-of-undirected-grap-362f0a39.png)

![Adjacency list representation of directed graph](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/adjacency-list-representation-of-directed-graph-36413ea5.png)

If you count the number of elements stored in the adjacency list and compare them to the number of edges in the graph, you will observe:

- In an undirected graph, the number of elements stored across all adjacency lists equals twice the number of edges. For instance, in the undirected graph on the left, there are 7 edges, and the adjacency lists store a total of 14 elements.
- In a directed graph, the number of elements stored in the adjacency lists equals the number of edges. As shown in the directed graph on the right, there are 8 edges, and the adjacency lists store 8 elements.

## Graph Traversal and Search

### Breadth-First Search (BFS)

Breadth-First Search spreads outward layer by layer like ripples on the surface of water, as shown below:

![Breadth-First Search illustration](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search-9bb83b6f.png)

**The concrete implementation of Breadth-First Search relies on a linear data structure we previously studied—the Queue.** The step-by-step process is illustrated below:

**Step 1:**

![Breadth-First Search 1](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search1-0fd57731.png)

**Step 2:**

![Breadth-First Search 2](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search2-f6d81cda.png)

**Step 3:**

![Breadth-First Search 3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search3-42dff9dd.png)

**Step 4:**

![Breadth-First Search 4](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search4-8a6a4d74.png)

**Step 5:**

![Breadth-First Search 5](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search5-06b3e491.png)

**Step 6:**

![Breadth-First Search 6](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/breadth-first-search6-d79eb983.png)

### Depth-First Search (DFS)

Depth-First Search proceeds by "following a path all the way to a dead end": starting from the source vertex, it traverses forward until there are no unvisited successors, then backtracks to the previous vertex, and repeats the deep exploration, as shown below:

![Depth-First Search illustration](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search-b6825db5.png)

**Similar to BFS, the concrete implementation of Depth-First Search utilizes another linear data structure—the Stack (or call stack via recursion).** The step-by-step process is illustrated below:

**Step 1:**

![Depth-First Search 1](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search1-09d637ad.png)

**Step 2:**

![Depth-First Search 2](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search2-6a9b4e69.png)

**Step 3:**

![Depth-First Search 3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search3-b4617d69.png)

**Step 4:**

![Depth-First Search 4](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search4-7c5d3055.png)

**Step 5:**

![Depth-First Search 5](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search5-f0904aff.png)

**Step 6:**

![Depth-First Search 6](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/depth-first-search6-984f3ff6.png)

## Key Interview Review Points

When tackling graph problems, choose the storage representation first, then choose the traversal method. The four most common categories of graph interview questions are: connected components, shortest step count, dependencies, and cycle detection.

| Storage Representation | Space Complexity | Checking If Two Vertices Are Adjacent | Traversing Neighbors of a Vertex | Suitable Scenarios |
| ---------------------- | ---------------- | ------------------------------------- | -------------------------------- | ------------------ |
| Adjacency Matrix | $O(V^2)$ | $O(1)$ | $O(V)$ | Dense graphs, small number of vertices |
| Adjacency List | $O(V + E)$ | Depends on adjacency structure | Proportional to degree | Sparse graphs, standard for algorithmic problems |

For DFS/BFS templates, you can refer to [DFS and BFS Interview Questions Summary](../algorithms/dfs-bfs.md). Here are several key points to keep in mind when answering interview questions:

- With an adjacency list, the time complexity of both DFS and BFS is typically $O(V + E)$.
- To find the shortest number of steps in an unweighted graph, prioritize BFS.
- For dependency relationships in directed graphs, topological sorting is standard, with Course Schedule being a classic example.
- For connectivity and cycle detection in undirected graphs, you can use DFS/BFS or Union-Find.
- Finding the shortest path in a weighted graph cannot use standard BFS; common algorithms include Dijkstra, Bellman-Ford, and Floyd-Warshall, which should be selected based on the problem's constraints.

## Java Code Templates

In algorithmic problems, adjacency lists are most commonly used. Vertex labels are typically numbered `0` to `n - 1`, and can be represented using `List<Integer>[]`.

```java
List<Integer>[] buildGraph(int n, int[][] edges) {
    List<Integer>[] graph = new ArrayList[n];
    for (int i = 0; i < n; i++) {
        graph[i] = new ArrayList<>();
    }
    for (int[] edge : edges) {
        int from = edge[0];
        int to = edge[1];
        graph[from].add(to);
        // For an undirected graph, add a reverse edge as well:
        // graph[to].add(from);
    }
    return graph;
}
```

BFS is well-suited for finding the shortest step count in an unweighted graph:

```java
int bfs(List<Integer>[] graph, int start, int target) {
    boolean[] visited = new boolean[graph.length];
    Queue<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    visited[start] = true;
    int step = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int cur = queue.poll();
            if (cur == target) {
                return step;
            }
            for (int next : graph[cur]) {
                if (!visited[next]) {
                    visited[next] = true;
                    queue.offer(next);
                }
            }
        }
        step++;
    }
    return -1;
}
```

## Process Illustration and Boundary Test Cases

Taking the shortest path in an unweighted graph as an example, the layer-by-layer expansion of BFS can be understood as follows:

```text
Layer 0: start
Layer 1: all unvisited neighbors of start
Layer 2: all unvisited neighbors of Layer 1 nodes
...
When target is encountered for the first time, the current layer count is the shortest step count.
```

A few boundary cases should always be considered:

- `start == target`: the answer should be `0`.
- The graph is disconnected and the target vertex is unreachable: the answer should be `-1`.
- When constructing an undirected graph, forgetting to add the reverse edge will mistakenly treat a connected graph as disconnected.
- In a cyclic graph, failing to mark nodes as `visited` will cause BFS/DFS to revisit nodes repeatedly or get stuck in infinite loops.

## Recommended Practice Problems

- [200. Number of Islands](https://leetcode.cn/problems/number-of-islands/)
- [695. Max Area of Island](https://leetcode.cn/problems/max-area-of-island/)
- [994. Rotting Oranges](https://leetcode.cn/problems/rotting-oranges/)
- [207. Course Schedule](https://leetcode.cn/problems/course-schedule/)
- [547. Number of Provinces](https://leetcode.cn/problems/number-of-provinces/)
