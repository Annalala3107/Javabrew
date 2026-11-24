---
title: "Tree Data Structure In-Depth (Binary Trees, AVL, B/B+ Trees)"
description: "A systematic explanation of core concepts and traversal methods for trees and binary trees, combined with metrics like height and depth to solidify data structure foundations and algorithmic thinking."
category: Computer Science Basics
tag:
  - Data Structure
head:
  - - meta
    - name: keywords
      content: Tree,Binary Tree,Binary Search Tree,Balanced Tree,Traversal,Preorder,Inorder,Postorder,Level Order,Height,Depth
lang: en
sourceRef: zh-ref/cs-basics/data-structure/tree.md
---

A tree is a data structure resembling an inverted tree in the real world. Any non-empty tree has exactly one root node.

A tree possesses the following properties:

1. Between any two nodes in a tree, there is one and only one unique connecting path.
2. If a tree has n nodes, it must have exactly n - 1 edges.
3. A tree contains no cycles.

The figure below illustrates a tree, specifically a binary tree.

![Binary Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/2-fb8dd0b3.png)

As shown in the figure above, here are the common concepts associated with trees:

- **Node**: Every element in a tree is collectively termed a node.
- **Root Node**: The top-level node, or the node without a parent. In the figure above, node A is the root node.
- **Parent Node**: If a node has child nodes, it is called the parent node of those child nodes. In the figure above, node B is the parent node of node D and node E.
- **Child Node**: The root node of a subtree contained within a node is called a child node of that node. In the figure above, node D and node E are child nodes of node B.
- **Sibling Node**: Nodes sharing the same parent node are called sibling nodes. In the figure above, node D and node E share node B as their parent, so D and E are siblings.
- **Leaf Node**: A node with no children. In the figure above, D, F, H, and I are leaf nodes.
- **Height of a Node**: The number of edges on the longest path from that node down to a leaf node.
- **Depth of a Node**: The number of edges on the path from the root node to that node.
- **Level of a Node**: The depth of the node + 1.
- **Height of the Tree**: The height of the root node.

> Regarding definitions of tree depth and height, see this Stack Overflow discussion: [What is the difference between tree depth and height?](https://stackoverflow.com/questions/2603692/what-is-the-difference-between-tree-depth-and-height).

## Classification of Binary Trees

A **Binary Tree** is a tree structure where each node has at most two branches (i.e., no node has a branching degree greater than 2).

The branches of a **Binary Tree** are conventionally referred to as the "**left subtree**" and the "**right subtree**". Moreover, branches of a binary tree are strictly ordered from left to right and cannot be arbitrarily reversed.

The i-th level of a **Binary Tree** has at most `2^(i-1)` nodes. Following this article's convention where "the root node has a depth of 0," a binary tree of depth k has at most `2^(k+1) - 1` nodes (in the case of a full binary tree) and at least `k + 1` nodes (when degenerate into a single linked list). Different conventions exist regarding the definition of node depth across literature; this article follows Wikipedia's [definition of tree depth and terminology](https://zh.wikipedia.org/wiki/%E6%A0%91_(%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84)#/%E6%9C%AF%E8%AF%AD).

![Wikipedia definition of node depth](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220119112736158-63744f50.png)

### Full Binary Tree (Perfect Binary Tree)

A binary tree where the number of nodes at every level reaches the theoretical maximum is called a **Full Binary Tree** (often referred to as a **Perfect Binary Tree** in Western literature). That is, if a binary tree has K levels and the total number of nodes is `2^K - 1`, it is a full binary tree, as shown below:

![Full Binary Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/full-binary-tree-eb6e9991.png)

### Complete Binary Tree

Except possibly for the last level, all levels are completely filled, and all nodes in the last level are as far left as possible (i.e., filled from left to right without internal gaps). Such a binary tree is called a **Complete Binary Tree**.

You can visualize this as a tree expanding level by level starting from the root: a right child can only be added after the left child is in place, and the next level can only begin after the current level is fully populated. As illustrated below:

![Complete Binary Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/complete-binary-tree-896f64b4.png)

A complete binary tree has a remarkable property: **there is a deterministic mathematical relationship between the indices of parent and child nodes.**

As attentive readers may notice, when the root node is indexed at 1, if a parent node has index i, its left child is at index 2i, and its right child is at index 2i + 1. This property allows complete binary trees to be stored compactly in an array without wasting memory, enabling parent and child nodes to be located directly by index calculations. Binary tree storage will be explored in detail in the following sections.

### AVL Tree (Height-Balanced Binary Search Tree)

An **AVL Tree** is a height-balanced binary search tree with the following properties:

1. It can be an empty tree.
2. If non-empty, the absolute difference between the heights of its left and right subtrees does not exceed 1, and both the left and right subtrees are themselves AVL trees.

Red-Black trees, scapegoat trees, and weight-balanced trees are also used to prevent binary search trees from severely degenerating, but their balance conditions differ from AVL's strict "subtree height difference does not exceed 1." Splay trees, meanwhile, achieve amortized complexity guarantees through structural adjustments upon each access.

Before presenting balanced binary trees, take a look at the following tree:

![Skewed Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/oblique-tree-db81ef30.png)

**You call this thing a tree???**

Indeed, this really is a tree, but one that has completely degenerated into a linked list. We call it a **skewed tree**.

**If that's the case, why wouldn't I just use a linked list?**

Exactly!

A standard binary tree does not inherently guarantee faster searches than a linked list. Only when leveraging the ordering invariants of a binary search tree (BST) or other indexing relationships can a tree structure make data **search** and **modification** more efficient; an unbalanced binary search tree can still degenerate to `O(n)` in the worst case.

However, when a binary search tree degenerates into a linear chain, the query advantages of an ordered structure evaporate, severely undermining efficiency. AVL trees apply a much stricter height-balancing constraint to eliminate this risk: the height difference between the left and right subtrees of every node is at most 1, as shown below:

![Balanced Binary Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/balanced-binary-tree-8e0e5a16.png)

## Storage of Binary Trees

Binary trees are primarily stored using two representations: **Linked Storage** and **Sequential Storage**.

### Linked Storage

Similar to a linked list, linked storage of a binary tree connects nodes via pointers/references, requiring no contiguous block of memory.

Each node contains three attributes:

- Data `data`: `data` is not limited to a single scalar value; depending on the use case, it can contain multiple attributes of diverse types.
- Left child pointer `left`.
- Right child pointer `right`.

Wait, Java doesn't have pointers!

Then simply use object references (and don't ask where to find a partner/object).

![Linked Storage of a Binary Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/chain-store-binary-tree-1b311e10.png)

### Sequential Storage

Sequential storage utilizes an array. Each position in the array stores only the node's `data`, without storing pointers to the left and right children; children are located entirely via array index arithmetic. The root node is assigned index 1. For each node stored at array index i, its left child is stored at index 2i, and its right child is stored at index 2i + 1.

The array sequential storage of a complete binary tree is shown below:

![Sequential storage of a complete binary tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/sequential-storage-6b566b21.png)

You can try filling in the array representation for the following binary tree and observe how it differs from a complete binary tree:

![Sequential storage of a non-complete binary tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/sequential-storage2-e2781cc7.png)

As you can see, when the binary tree we wish to store is not complete, empty gaps appear throughout the array, resulting in degraded memory utilization.

## Binary Tree Traversals

### Preorder Traversal

![Preorder Traversal](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/preorder-traversal-83a26c45.png)

Preorder traversal of a binary tree visits the root node first, then traverses the left subtree, and finally traverses the right subtree. When traversing the left and right subtrees, the exact same preorder rule applies recursively.

The code is as follows:

```java
public void preOrder(TreeNode root){
    if(root == null){
        return;
    }
    System.out.println(root.data);
    preOrder(root.left);
    preOrder(root.right);
}
```

### Inorder Traversal

![Inorder Traversal](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/inorder-traversal-c654e3a9.png)

Inorder traversal of a binary tree recursively traverses the left subtree first, outputs the root node's value, and then recursively traverses the right subtree. You can visualize this as flattening the tree vertically: the parent node is squashed directly between its left and right children, as illustrated below:

![Inorder Traversal Flattened Analogy](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/inorder-traversal2-b24785bc.png)

The code is as follows:

```java
public void inOrder(TreeNode root){
    if(root == null){
        return;
    }
    inOrder(root.left);
    System.out.println(root.data);
    inOrder(root.right);
}
```

### Postorder Traversal

![Postorder Traversal](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/postorder-traversal-7f6c2d2d.png)

Postorder traversal of a binary tree recursively traverses the left subtree first, then recursively traverses the right subtree, and finally outputs the root node's value.

The code is as follows:

```java
public void postOrder(TreeNode root){
    if(root == null){
        return;
    }
    postOrder(root.left);
    postOrder(root.right);
    System.out.println(root.data);
}
```

## Key Takeaways for Interview Review

Interviews on tree data structures typically begin with binary tree traversals and progressively delve into binary search trees (BST), balanced trees, B-trees, and B+ trees.

| Structure | Characteristics | Common Follow-ups |
| --------- | --------------- | ----------------- |
| Binary Tree | Each node has at most two children | Traversals, path problems, Lowest Common Ancestor (LCA), tree construction |
| Binary Search Tree (BST) | Left subtree < root, right subtree > root | Inorder traversal yields sorted order; degenerating into a linked list |
| AVL Tree | Strictly height-balanced | Fast search; rotations are more frequent during insertions and deletions |
| Red-Black Tree | Approximately balanced | Java `TreeMap`, `HashMap` treeification |
| B-Tree | Multi-way balanced search tree | Disk I/O friendly |
| B+ Tree | All data stored in leaves; leaf nodes linked in sorted order | MySQL indexes, range queries |

The binary tree recursive DFS template must be mastered:

```java
void dfs(TreeNode root) {
    if (root == null) {
        return;
    }
    // Preorder position
    dfs(root.left);
    // Inorder position
    dfs(root.right);
    // Postorder position
}
```

High-frequency BST interview points:

- Inorder traversal of a binary search tree produces a strictly increasing sequence.
- If inserted data is already sorted, a naive BST degenerates into a linear linked list.
- AVL trees maintain a stricter balance than Red-Black trees, providing more consistent lookup times; Red-Black trees relax balance constraints slightly, reducing the cost of adjustment rotations during inserts and deletes.
- B+ trees are ideal for database indexes because internal nodes store more keys, yielding a much lower tree height, while sorted leaf chains facilitate sequential range scanning.

Binary tree algorithm problems can be categorized by the role the current node plays during recursion:

- Path-based: The current node is added to the active path and popped after recursive calls (backtracking); common in root-to-leaf paths and path sum problems.
- Subtree aggregation: Left and right subtrees compute sub-results first, and the current node combines them; common in computing height, diameter, and balance checks.
- Bifurcation/Convergence: Search independently in the left and right subtrees; the current node determines if it is the convergence point; common in Lowest Common Ancestor (LCA).
- Construction: Identify the root node first, then partition the intervals for left and right subtrees; common in constructing trees from preorder + inorder arrays.

## Java Code Templates

Level order traversal (BFS) is the most ubiquitous non-recursive template in tree interviews; problems like "find largest value in each row," "zigzag traversal," and "minimum depth" are all variations of it.

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> ans = new ArrayList<>();
    if (root == null) {
        return ans;
    }
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) {
                queue.offer(node.left);
            }
            if (node.right != null) {
                queue.offer(node.right);
            }
        }
        ans.add(level);
    }
    return ans;
}
```

When validating a BST, do not simply compare the current node with its direct left and right children. The correct approach propagates valid upper and lower bounds down to each subtree:

```java
boolean isValidBST(TreeNode root) {
    return check(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean check(TreeNode node, long lower, long upper) {
    if (node == null) {
        return true;
    }
    if (node.val <= lower || node.val >= upper) {
        return false;
    }
    return check(node.left, lower, node.val) && check(node.right, node.val, upper);
}
```

Lowest Common Ancestor (LCA) uses a postorder thought process: search for target nodes in left and right subtrees first, then evaluate return values at the current node:

```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) {
        return root;
    }
    return left != null ? left : right;
}
```

The logic here is: if `p` and `q` are found in the left and right subtrees respectively, the current node is their lowest common ancestor; if found on only one side, propagate that result up.

When constructing a binary tree from preorder and inorder sequences, the first element of the preorder array is the root node. In the inorder array, elements to the left of the root form the left subtree, and elements to the right form the right subtree. To avoid repeated linear searches for the root in the inorder array, pre-populate a hash table with inorder indices.

```java
TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> index = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) {
        index.put(inorder[i], i);
    }
    return build(preorder, 0, preorder.length - 1, 0, inorder.length - 1, index);
}

TreeNode build(
    int[] preorder,
    int preLeft,
    int preRight,
    int inLeft,
    int inRight,
    Map<Integer, Integer> index
) {
    if (preLeft > preRight) {
        return null;
    }
    int rootVal = preorder[preLeft];
    int rootIndex = index.get(rootVal);
    int leftSize = rootIndex - inLeft;
    TreeNode root = new TreeNode(rootVal);
    root.left = build(preorder, preLeft + 1, preLeft + leftSize, inLeft, rootIndex - 1, index);
    root.right = build(preorder, preLeft + leftSize + 1, preRight, rootIndex + 1, inRight, index);
    return root;
}
```

The most frequent bug in tree construction problems is interval boundary calculation. It is strongly recommended to clearly define the semantics of `preLeft/preRight` and `inLeft/inRight` first, and then slice the preorder array based on the calculated `leftSize`.

## Process Intuition and Edge Cases

When solving binary tree problems, determine "what the current node needs to do" first, and then select preorder, inorder, postorder, or level-order traversal accordingly.

```text
Preorder: Process current node first, then traverse left and right subtrees. Ideal for cloning trees and constructing root-to-leaf paths.
Inorder: Left -> Root -> Right. Traversal of a BST produces sorted output.
Postorder: Process left and right subtrees first, then process current node. Ideal for computing height, diameter, and bottom-up deletions.
Level-order: Process level by level. Ideal for minimum depth, level-based metrics, and serialization.
```

Several boundary edge cases to run through before writing code:

- Empty tree: Many problems should return an empty list, `0`, or `true`.
- Single-node tree: Recursion base cases and level-order queues must handle this gracefully.
- Skewed tree (degenerate chain): Recursion depth can reach `n`; do not mistakenly assume `O(log n)` complexity.
- BST values containing `Integer.MIN_VALUE` / `Integer.MAX_VALUE`: Use `long` for boundary variables.
- LCA where one target node is the ancestor of the other: The recursion should return the current node immediately upon encountering a target node.
- Empty input arrays when constructing trees: The recursion interval becomes `preLeft > preRight`, which should return `null`.

## Recommended Practice Problems

- [144. Binary Tree Preorder Traversal](https://leetcode.cn/problems/binary-tree-preorder-traversal/)
- [102. Binary Tree Level Order Traversal](https://leetcode.cn/problems/binary-tree-level-order-traversal/)
- [98. Validate Binary Search Tree](https://leetcode.cn/problems/validate-binary-search-tree/)
- [236. Lowest Common Ancestor of a Binary Tree](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)
- [105. Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)
