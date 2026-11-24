---
title: Detailed Explanation of Red-Black Tree (Properties, Rotations, Applications)
description: An in-depth explanation of the five essential properties and rotation balancing procedures of Red-Black Trees, understanding self-balancing mechanisms and applications in standard libraries and index structures.
category: CS Basics
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Red-Black Tree,self-balancing,rotation,insertion and deletion,properties,black height,time complexity
lang: en
sourceRef: zh-ref/cs-basics/data-structure/red-black-tree.md
---

# Red-Black Tree

## Introduction to Red-Black Tree

A Red-Black Tree is a self-balancing binary search tree. It was invented in 1972 by Rudolf Bayer, who originally named it "symmetric binary B-trees." Later, in 1978, it was refined into its modern form and named "Red-Black Tree" by Leo J. Guibas and Robert Sedgewick.

Due to its self-balancing property, it guarantees worst-case $O(\log n)$ time complexity for search, insertion, and deletion operations, delivering stable and consistent performance.

In the JDK, `TreeMap`, `TreeSet`, and the underlying structure of `HashMap` (since JDK 1.8) all utilize Red-Black Trees.

## Why Do We Need Red-Black Trees?

The Red-Black Tree was created to solve the fundamental shortcomings of binary search trees.

A binary search tree (BST) is a comparison-based data structure where each node holds a key value, such that the key of any left child node is smaller than its parent's key, and the key of any right child node is larger than its parent's key. Such a structure facilitates convenient search, insertion, and deletion operations, because simply comparing keys allows one to determine the location of the target node. However, a major issue with binary search trees is that their shape depends entirely on the sequence in which nodes are inserted. If nodes are inserted in strictly ascending or descending order, the binary search tree degrades into a linear structure—essentially a linked list. In this scenario, the performance of the BST drops drastically, and its time complexity degrades from $O(\log n)$ to $O(n)$.

The birth of the Red-Black Tree aims precisely to overcome this flaw of binary search trees, preventing them from degrading into linear structures under skewed insertion sequences.

## Characteristics of Red-Black Tree

1. Every node is either red or black.
2. The root node is always black.
3. Every null child link is treated as a black NIL leaf node.
4. If a node is red, both of its children must be black, meaning there cannot be two consecutive red nodes.
5. For each node, all simple paths from that node to its descendant NIL leaf nodes contain the same number of black nodes, meaning they have the same black height.

In the correspondence between Red-Black Trees and 2-3 trees, a black node together with its connected red node(s) can collectively represent a multi-key node. This is purely a structural mapping; each Red-Black Tree node itself still has at most two children.

It is precisely these properties that ensure the balance of a Red-Black Tree, guaranteeing that the tree's height will never exceed $2\log(n+1)$.

## Red-Black Tree Data Structure

Both AVL trees and Red-Black Trees are self-balancing binary search trees, whereas 2-3 trees are multi-way search trees. A Red-Black Tree can establish structural correspondences with a 2-3 tree or a 2-3-4 tree, but they cannot be collectively referred to simply as B-trees. Compared to AVL trees, Red-Black Trees have more relaxed balance constraints, controlling tree height through coloring rules and black height invariants.

## Red-Black Tree Structural Implementation

```java
public class Node {

    public Class<?> clazz;
    public Integer value;
    public Node parent;
    public Node left;
    public Node right;

    // Properties required for AVL tree
    public int height;
    // Properties required for Red-Black tree
    public Color color = Color.RED;

}
```

### 1. Left-Leaning Recoloring

![Red-Black Tree left-leaning recoloring diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-1-ba1fe751.png)

- During recoloring, locate the uncle node of the current node based on its grandparent node.
- Next, recolor both the parent node and the uncle node to black, and recolor the grandparent node to red. Note that recoloring the grandparent node to red is temporary; after the tree height balancing operations complete, the root node will always be recolored to black.

### 2. Right-Leaning Recoloring

![Red-Black Tree right-leaning recoloring diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-2-930178e0.png)

### 3. Left-Rotation Balancing

#### 3.1 Single Left Rotation

![Red-Black Tree single left rotation balancing diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-3-518f3fb1.png)

#### 3.2 Right Rotation + Left Rotation

![Red-Black Tree right rotation plus left rotation balancing diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-4-25b343c7.png)

### 4. Right-Rotation Balancing

#### 4.1 Single Right Rotation

![Red-Black Tree single right rotation balancing diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-5-f3429fe3.png)

#### 4.2 Left Rotation + Right Rotation

![Red-Black Tree left rotation plus right rotation balancing diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-6-bc294253.png)

## Key Interview Review Points

In interview settings, you will rarely be asked to handwrite the entire insertion and deletion rebalancing code for a Red-Black Tree from scratch. Instead, interviewers typically expect you to explain its core properties clearly, why it achieves approximate balance, how it differs from an AVL tree, and where it is applied in Java.

| Comparison Point | AVL Tree | Red-Black Tree |
| ---------------- | -------- | -------------- |
| Balance Requirement | Stricter | Relatively relaxed |
| Query Performance | More stable | Also maintains $O(\log n)$ |
| Insertion & Deletion | Rotation adjustments may be more frequent | Typically fewer adjustment operations |
| Common Applications | Search structures with frequent reads and few writes | `TreeMap`, `TreeSet`, `HashMap` treeification |

When answering in an interview, you can structure your explanation in this sequence:

1. A standard binary search tree degrades into a linked list when elements are inserted in sorted order.
2. The Red-Black Tree restricts tree height via color rules, guaranteeing that search, insertion, and deletion operations remain $O(\log n)$.
3. It does not enforce strict balance, but rather approximate balance; hence the adjustment cost during insertion and deletion is lower than that of an AVL tree.
4. In Java, `TreeMap` and `TreeSet` are built upon Red-Black Trees, and in JDK 8 and later, `HashMap` also transforms linked lists into Red-Black Trees when chain lengths exceed a threshold.

Note that `HashMap` treeification also requires meeting a minimum table capacity condition; treeification does not automatically occur purely because the linked list length hits the threshold. This subtle detail is frequently followed up on during Java Collections interviews.
