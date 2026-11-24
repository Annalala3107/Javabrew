---
title: Why Redis Uses Skip Lists to Implement Sorted Sets
description: An in-depth explanation of why Redis implements Sorted Sets (ZSet) with skip lists rather than Red-Black trees or B+ trees, covering skip list data structure principles, time complexity analysis, and implementation details.
category: Databases
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Skip List,SkipList,Sorted Set,Zset,Skip List Principles,Balanced Tree Comparison,Redis Data Structures
lang: en
sourceRef: zh-ref/database/redis/redis-skiplist.md
---

## Introduction

In recent years, Redis interviews often touch on the underlying design of common data structures, and one particularly interesting interview question frequently comes up: "Why does Redis implement Sorted Sets under the hood using skip lists instead of balanced trees, Red-Black trees, or B+ trees?"

Using this frequently asked big-tech interview question as our starting point, this article walks you through the skip list data structure in detail.

If you want a quick overview of skip lists' multi-level indexes, query complexity, and an interview answer framework first, you can check out [Skip List Interview Questions Summary](../../cs-basics/data-structure/skip-list.md), then come back here to look at the implementation behind Redis ZSet.

The overall structure of this article is shown in the figure below. Starting from basic Sorted Set usage and moving through skip list analysis and implementation, you will gain a deeper understanding and mastery of the skip list powering Redis Sorted Sets.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005468-6a3fe807.png)

## How Skip Lists Are Used in Redis

First, we need to understand how Redis uses Sorted Sets, the data structure backed by skip lists. Redis has a widely used data structure called a **Sorted Set (`zset`)**. Just as its name implies, it is a collection that guarantees both ordering and element uniqueness, so it is commonly used for leaderboards and other scenarios requiring statistical ranking.

Let's demonstrate a leaderboard implementation via the Redis CLI. As you can see, we insert three users—**xiaoming**, **xiaohong**, and **xiaowang**—with **scores** of 60, 80, and 60 respectively, and ultimately display them sorted in descending order by score.

```bash

127.0.0.1:6379> zadd rankList 60 xiaoming
(integer) 1
127.0.0.1:6379> zadd rankList 80 xiaohong
(integer) 1
127.0.0.1:6379> zadd rankList 60 xiaowang
(integer) 1

# Return members within the specified index range of the sorted set, ordered from highest to lowest score
127.0.0.1:6379> ZREVRANGE rankList 0 100 WITHSCORES
1) "xiaohong"
2) "80"
3) "xiaowang"
4) "60"
5) "xiaoming"
6) "60"
```

If we inspect the underlying encoding of this `zset` using the `object` command, we can see that the sorted set is currently stored as a **ziplist (compressed list)**.

```bash
127.0.0.1:6379> object encoding rankList
"ziplist"
```

Because Redis stores data in memory, its designers opted to use `ziplist` to save precious memory space whenever the sorted set elements are smaller than 64 bytes and the total number of elements is fewer than 128. The default values for these thresholds come from the following two configuration options:

```bash
zset-max-ziplist-value 64
zset-max-ziplist-entries 128
```

Once any element or the entry count in the sorted set exceeds either threshold, it converts to **skiplist** (in practice, `dict + skiplist`, also leveraging a dictionary to improve the efficiency of looking up a specific element).

Let's add another element larger than 64 bytes and observe how the underlying storage of the sorted set converts to `skiplist`:

```bash
127.0.0.1:6379> zadd rankList 90 yigemingzihuichaoguo64zijiedeyonghumingchengyongyuceshitiaobiaodeshijiyunyong
(integer) 1

# Exceeded threshold; converted to skip list
127.0.0.1:6379> object encoding rankList
"skiplist"
```

In other words, ZSet has two different underlying implementations: `ziplist` and `skiplist`. The rules governing which structure is used are as follows:

- A sorted set object uses `ziplist` when both of the following conditions are satisfied:
  1. The number of key-value pairs (entries) stored in the ZSet is fewer than 128;
  2. The length of each element is less than 64 bytes.
- If either of the above two conditions is not met, `skiplist` is used instead.

## Implementing a Skip List from Scratch

To better answer the interview question above and truly understand and master skip lists, let's build a simple skip list by hand to illustrate how this data structure works.

As we all know, a sorted linked list has an average time complexity of **O(n)** (linear growth) for insertion, lookup, and deletion, so once the number of nodes reaches a certain scale, its performance becomes very poor. A skip list can simply be understood as building multi-level indexes on top of the original linked list—by searching and locating via these multi-level indexes, the time complexity of CRUD operations improves to **O(log n)**.

If that sounds somewhat abstract, let's walk through an example. Take the skip list in the figure below: its base linked list stores values 1–10 in sorted order, and it has 2 levels of indexes, where each index level contains half as many nodes as the level immediately below it.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005436-095a198c.png)

Suppose we want to search for element 6. The workflow is as follows:

1. Start from the level-2 index and first move to node 4.
2. Check 4's successor node, which is 8 in the level-2 index. Since this value is greater than 6, all subsequent index nodes on level 2 must also be greater than 6, so there is no need to search further right; we drop down one index level.
3. Move down to 4 in the level-1 index, check its successor node, which is 6, and the search finishes.

Compared with the original sorted linked list, which would take 6 steps, our skip list builds multi-level indexes and locates the target element in just two steps, directly optimizing lookup complexity to **O(log n)**.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005524-d66751de.png)

Insertion works on the same principle. Suppose we want to insert element 7 into this sorted set. We need to use the skip list to find **the largest element smaller than 7**—which is element 6 in the figure below—insert 7 right after element 6, and update the pointers accordingly. The workflow is as follows:

1. Start from the level-2 index and locate the index node for element 4.
2. Check index 4's successor index, which is 8, so move down an index level.
3. Arrive at the level-1 index, find that index 4's successor index is 6 (which is less than the inserted element 7), and advance the pointer to index 6.
4. Continue comparing 6's successor node, which is index 8 (greater than element 7), so move the index pointer down again.
5. Finally, we reach base node 6, check its successor position (where 7 belongs, as there is no lower level for the pointer to descend to), confirm that element 6 is the largest value smaller than 7, and insert element 7 right after it.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005480-351cc69a.png)

Here we run into another question: should we build an index for element 7, and how tall should the index be?

As mentioned earlier, the ideal scenario is that each index level has half as many elements as the level below it. Suppose we have 16 elements in total; the number of nodes at each index level should be:

```bash
1. Level-1 index: 16/2=8
2. Level-2 index: 8/2 =4
3. Level-3 index: 4/2=2
```

By mathematical induction, we get:

```bash
1. Level-1 index: 16/2=16/2^1=8
2. Level-2 index: 8/2 => 16/2^2 =4
3. Level-3 index: 4/2=>16/2^3=2
```

Assuming there are `n` elements, the formula for calculating the number of elements `r` at the `k`-th index level is:

```bash
r=n/2^k
```

Similarly, let's derive the maximum height of the index. Generally, the topmost index level has 2 elements. Let `n` be the total number of elements and `h` be the index height; substituting into the formula above gives:

```bash
2= n/2^h
=> 2*2^h=n
=> 2^(h+1)=n
=> h+1=log2^n
=> h=log2^n -1
```

Since Redis is an in-memory database, suppose the maximum number of elements is **65536**. Plugging **65536** into the formula above gives a maximum height of 16. Therefore, we recommend capping the index height generated for a newly inserted element at 16.

Because we want to ensure as closely as possible that each upper index level has half the elements of the level below it, we can design the height-generation algorithm as follows:

1. Skip list height calculation starts from the base linked list—that is, by default an inserted element has a height of 1, meaning no index levels, only the data node itself.
2. Design a method to generate the index height `level` for an inserted node.
3. Perform a random operation generating a random value between 0 and 1.
4. If the random number is greater than 0.5, add one index level for the current element. This ensures a **50%** probability of generating a level-1 index, meaning ideally only half of the elements will have a level-1 index.
5. Similarly, each subsequent time the random roll exceeds 0.5, we increment the index height by 1. This guarantees a **25%** probability of a node reaching a level-2 index, **12.5%** for a level-3 index, and so on.

Returning to our example above: after inserting 7, suppose the random algorithm returns 2, meaning we build a level-1 index for it:

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005505-9afaa2bb.png)

Finally, let's talk about deletion. Suppose we want to delete element 10 here. We must locate the largest value smaller than 10 at **every level** of the skip list, so the execution steps are:

1. In the level-2 index, node 4's successor is 8, so advance the pointer to 8.
2. Index 8 has no successor node, so there is no element to delete on this level; drop the pointer down.
3. In the level-1 index, index 8's successor is 10, indicating that during deletion, level-1 index 8 must disconnect its pointer from level-1 index 10 to remove 10.
4. After locating the position on the level-1 index, drop down to the base level; the successor node is 9, so advance the pointer to 9.
5. Node 9's successor is 10, so similarly point 9 to `null` to delete 10.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005503-97e7628d.png)

### Node Template Definition

With the overall concept in place, we can start implementing a skip list. First, let's define the `Node` in the skip list. From the walkthrough above, each `Node` contains the following parts:

1. The stored **value**.
2. The address of the successor node.
3. Multi-level indexes.

To manage each **Node**'s successor address and multi-level index pointers uniformly, we define a **forwards** array inside **Node** to record the successor pointers at the base linked list level as well as across all index levels.

Take the figure below as an example: our **forwards** array has a length of 5, where **index 0** stores the successor node address in the base linked list, and the remaining entries from bottom to top represent the successor pointers for index levels 1 through 4.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005347-71f13c21.png)

This gives us the following code definition. Notice that the array length is fixed at 16 **(matching the recommended maximum height of 16 derived earlier)**, `data` defaults to `-1`, and the node's `maxLevel` is initialized to 1 (note that `maxLevel` represents the total height of the base linked list plus indexes).

```java
/**
 * Maximum skip list index height is 16
 */
private static final int MAX_LEVEL = 16;

class Node {
    private int data = -1;
    private Node[] forwards = new Node[MAX_LEVEL];
    private int maxLevel = 0;

}
```

### Element Insertion

Once the node is defined, let's implement element insertion. When adding an element, the first step is naturally setting **data** by assigning the passed-in **value** directly to **data**.

Next comes setting the height **maxLevel**. As outlined earlier, the default height is 1 (just a single base linked list node), and a randomized algorithm increments the height by 1 each time a random value exceeds 0.5, giving us the height-generation method `randomLevel()`:

```java
/**
 * Theoretically, the number of elements in the level-1 index should be 50% of the raw data,
 * level-2 index 25%, level-3 index 12.5%, and so on up to the top level.
 * Because the promotion probability at each level is 50%, for every newly inserted node,
 * randomLevel must be called to generate a reasonable level count.
 * This randomLevel method randomly generates a number between 1 and MAX_LEVEL, where:
 * 50% probability of returning 1
 * 25% probability of returning 2
 * 12.5% probability of returning 3 ...
 * @return
 */
private int randomLevel() {
    int level = 1;
    while (Math.random() > PROB && level < MAX_LEVEL) {
        ++level;
    }
    return level;
}
```

Next, we set the successor pointers for the newly inserted **Node** and its index levels. This step is slightly more involved. Suppose the current node's height is 4 (1 base node plus 3 index levels); we create an array **maxOfMinArr** of length 4 to track the largest node smaller than the current **value** at each index level.

Suppose the **value** we want to insert is 5. The array lookup reveals that the predecessor at the base level, level-1 index, and level-2 index is 4, while the level-3 index predecessor is empty (head).

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005299-d0c1aeff.png)

Then, using this **maxOfMinArr** array, we locate the successor nodes at every level, point the newly inserted element 5 to those successor nodes, and point **maxOfMinArr** entries to 5. The result is shown below:

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005369-df8a1b7c.png)

Translated into code, it looks like this—pretty straightforward, right? Let's continue:

```java
/**
 * Default height is 1, i.e., only the head node itself
 */
private int levelCount = 1;

/**
 * Bottommost head node of the skip list
 */
private Node h = new Node();

public void add(int value) {
    int level = randomLevel(); // Random height for the new node

    Node newNode = new Node();
    newNode.data = value;
    newNode.maxLevel = level;

    // Array used to record the predecessor node at each level
    Node[] update = new Node[level];
    for (int i = 0; i < level; i++) {
        update[i] = h;
    }

    Node p = h;
    // Key fix: start searching from the current highest level of the skip list
    for (int i = levelCount - 1; i >= 0; i--) {
        while (p.forwards[i] != null && p.forwards[i].data < value) {
            p = p.forwards[i];
        }
        // Only record predecessors for levels that need updating
        if (i < level) {
            update[i] = p;
        }
    }

    // Insert the new node
    for (int i = 0; i < level; i++) {
        newNode.forwards[i] = update[i].forwards[i];
        update[i].forwards[i] = newNode;
    }

    // Update the total height of the skip list
    if (levelCount < level) {
        levelCount = level;
    }
}
```

### Element Lookup

The lookup logic is relatively simple: start from the highest index level of the skip list and locate the largest value smaller than the target `value`. Taking the figure below as an example, suppose we want to find node 8:

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005323-5ea607cd.png)

- **Start at the highest level (level-3 index)**: The search pointer `p` begins at the head node. On the level-3 index, `p`'s successor `forwards[2]` (assuming 3 levels in total, 0-indexed) points to node `5`. Since `5 < 8`, pointer `p` moves right to node `5`. Node `5`'s successor `forwards[2]` on the level-3 index is `null` (or points to a node greater than `8`, not shown in the diagram). Searching right on the current level stops; pointer `p` stays at node `5` and **moves down to the level-2 index**.
- **At the level-2 index**: Pointer `p` is currently at node `5`. `p`'s successor `forwards[1]` points to node `8`. Because `8` is not less than `8` (i.e., `8 < 8` is `false`), searching right on this level stops (`p` does not advance to node `8`). Pointer `p` stays at node `5` and **moves down to the level-1 index**.
- **At the level-1 index**: Pointer `p` is currently at node `5`. `p`'s successor `forwards[0]` points to base-layer node `5`. Since `5 < 8`, pointer `p` moves right to base-layer node `5`. At that point, pointer `p` is at base-layer node `5`, and its successor `forwards[0]` points to base-layer node `6`. Since `6 < 8`, pointer `p` moves right to base-layer node `6`. Pointer `p` is now at base-layer node `6`, and its successor `forwards[0]` points to base-layer node `7`. Since `7 < 8`, pointer `p` moves right to base-layer node `7`. Pointer `p` is now at base-layer node `7`, and its successor `forwards[0]` points to base-layer node `8`. Because `8` is not less than `8` (i.e., `8 < 8` is `false`), searching right on this level stops. At this point, all levels have been traversed and the `for` loop terminates.
- **Final positioning and check**: After traversing all levels, pointer `p` ends up at node `7` on the bottommost layer (level-0 index), which is the largest node in the entire skip list whose value is less than the target `8`. Check node `7`'s **successor node** (i.e., `p.forwards[0]`): `p.forwards[0]` points to node `8`. Verify whether `p.forwards[0].data` (node `8`'s value) equals the target `8`. The condition holds (`8 == 8`), so **the search succeeds and node `8` is found**.

Our code implementation follows essentially the same steps: start from the highest index level and advance forward while the next node is non-null and smaller than the search value; when encountering a node that is not smaller, move down one level. Repeat this process until obtaining the largest node in the skip list smaller than the search value, then check whether its successor (`p.forwards[0]`) equals the search value:

```java
public Node get(int value) {
    Node p = h; // Start from the head node

    // Start from the highest index level and move down level by level
    for (int i = levelCount - 1; i >= 0; i--) {
        // Search right at the current level until p.forwards[i] is null
        // or p.forwards[i].data is greater than or equal to target value
        while (p.forwards[i] != null && p.forwards[i].data < value) {
            p = p.forwards[i]; // Move right
        }
        // At this point p.forwards[i] is null, or p.forwards[i].data >= value
        // meaning p is the largest node at the current level smaller than value (if one exists)
    }

    // After searching all levels, p is now the largest node in the base linked list (level-0 index)
    // smaller than target value (or the head node if all elements >= value)

    // Check whether p's next node in the base linked list is the target value
    if (p.forwards[0] != null && p.forwards[0].data == value) {
        return p.forwards[0]; // Found, return the node
    }

    return null; // Not found
}
```

### Element Deletion

Finally, let's cover deletion logic. We need to find the largest node smaller than the target node to be deleted at every level. Suppose we want to delete 10:

1. On the level-3 index, the largest value smaller than 10 is 5; move down.
2. On the level-2 index, starting from index 5, we find the largest value smaller than 10 is 8; move down.
3. Similarly, on the level-1 index we get 8; move down.
4. On the base layer, we find 9.
5. Starting from the highest index level, check whether the successor of each node smaller than 10 equals 10. If it equals 10, point that node to 10's successor, leaving node 10 and its index references to be reclaimed by GC.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005350-e88ca7ec.png)

```java
/**
 * Delete
 *
 * @param value
 */
public void delete(int value) {
    Node p = h;
    // Find the largest node smaller than value at every level
    Node[] updateArr = new Node[levelCount];
    for (int i = levelCount - 1; i >= 0; i--) {
        while (p.forwards[i] != null && p.forwards[i].data < value) {
            p = p.forwards[i];
        }
        updateArr[i] = p;
    }
    // Check whether the next node at the base layer equals value; if so, the value to delete exists
    if (p.forwards[0] != null && p.forwards[0].data == value) {
        // Starting from the highest index level, check if its next node equals value; if so, link to value's successor
        for (int i = levelCount - 1; i >= 0; i--) {
            if (updateArr[i].forwards[i] != null && updateArr[i].forwards[i].data == value) {
                updateArr[i].forwards[i] = updateArr[i].forwards[i].forwards[i];
            }
        }
    }

    // Starting from the highest level, check if any top index level is empty; if empty, decrement levelCount
    while (levelCount > 1 && h.forwards[levelCount - 1] == null) {
        levelCount--;
    }

}
```

### Complete Code and Testing

The complete code is provided below for your reference:

```java
public class SkipList {

    /**
     * Maximum skip list index height is 16
     */
    private static final int MAX_LEVEL = 16;

    /**
     * Probability of adding one index level for each node is 1/2
     */
    private static final float PROB = 0.5f;

    /**
     * Default height is 1, i.e., only the head node itself
     */
    private int levelCount = 1;

    /**
     * Bottommost head node of the skip list
     */
    private Node h = new Node();

    public SkipList() {
    }

    public class Node {

        private int data = -1;
        /**
         *
         */
        private Node[] forwards = new Node[MAX_LEVEL];
        private int maxLevel = 0;

        @Override
        public String toString() {
            return "Node{"
                    + "data=" + data
                    + ", maxLevel=" + maxLevel
                    + '}';
        }
    }

    public void add(int value) {
        int level = randomLevel(); // Random height for the new node

        Node newNode = new Node();
        newNode.data = value;
        newNode.maxLevel = level;

        // Array used to record the predecessor node at each level
        Node[] update = new Node[level];
        for (int i = 0; i < level; i++) {
            update[i] = h;
        }

        Node p = h;
        // Key fix: start searching from the current highest level of the skip list
        for (int i = levelCount - 1; i >= 0; i--) {
            while (p.forwards[i] != null && p.forwards[i].data < value) {
                p = p.forwards[i];
            }
            // Only record predecessors for levels that need updating
            if (i < level) {
                update[i] = p;
            }
        }

        // Insert the new node
        for (int i = 0; i < level; i++) {
            newNode.forwards[i] = update[i].forwards[i];
            update[i].forwards[i] = newNode;
        }

        // Update the total height of the skip list
        if (levelCount < level) {
            levelCount = level;
        }
    }

    /**
     * Theoretically, the number of elements in the level-1 index should be 50% of the raw data,
     * level-2 index 25%, level-3 index 12.5%, and so on up to the top level.
     * Because the promotion probability at each level is 50%, for every newly inserted node,
     * randomLevel must be called to generate a reasonable level count. This randomLevel
     * method randomly generates a number between 1 and MAX_LEVEL, where:
     * 50% probability of returning 1, 25% probability of returning 2, 12.5% probability of returning 3 ...
     *
     * @return
     */
    private int randomLevel() {
        int level = 1;
        while (Math.random() > PROB && level < MAX_LEVEL) {
            ++level;
        }
        return level;
    }

    public Node get(int value) {
        Node p = h;
        // Find the largest node smaller than value
        for (int i = levelCount - 1; i >= 0; i--) {
            while (p.forwards[i] != null && p.forwards[i].data < value) {
                p = p.forwards[i];
            }
        }
        // If p's next node equals value, return it directly
        if (p.forwards[0] != null && p.forwards[0].data == value) {
            return p.forwards[0];
        }

        return null;
    }

    /**
     * Delete
     *
     * @param value
     */
    public void delete(int value) {
        Node p = h;
        // Find the largest node smaller than value at every level
        Node[] updateArr = new Node[levelCount];
        for (int i = levelCount - 1; i >= 0; i--) {
            while (p.forwards[i] != null && p.forwards[i].data < value) {
                p = p.forwards[i];
            }
            updateArr[i] = p;
        }
        // Check whether the next node at the base layer equals value; if so, the value to delete exists
        if (p.forwards[0] != null && p.forwards[0].data == value) {
            // Starting from the highest index level, check if its next node equals value; if so, link to value's successor
            for (int i = levelCount - 1; i >= 0; i--) {
                if (updateArr[i].forwards[i] != null && updateArr[i].forwards[i].data == value) {
                    updateArr[i].forwards[i] = updateArr[i].forwards[i].forwards[i];
                }
            }
        }

        // Starting from the highest level, check if any top index level is empty; if empty, decrement levelCount
        while (levelCount > 1 && h.forwards[levelCount - 1] == null) {
            levelCount--;
        }

    }

    public void printAll() {
        Node p = h;
        // Traverse the bottommost non-index layer; while the successor node is not null, print the current node and advance
        while (p.forwards[0] != null) {
            System.out.println(p.forwards[0]);
            p = p.forwards[0];
        }

    }
}

```

Test code:

```java
public static void main(String[] args) {
        SkipList skipList = new SkipList();
        for (int i = 0; i < 24; i++) {
            skipList.add(i);
        }

        System.out.println("********** Insertion Result **********");
        skipList.printAll();

        SkipList.Node node = skipList.get(22);
        System.out.println("********** Query Result:" + node+" **********");

        skipList.delete(22);
        System.out.println("********** Deletion Result **********");
        skipList.printAll();


    }
```

**Characteristics of Redis Skip Lists**:

1. It uses a **doubly linked list**—unlike the example above, it includes a backward pointer. This primarily simplifies operations; for example, when deleting an element, you also need to locate its predecessor node, and a backward pointer makes this very convenient.
2. `score` values can be duplicated; if two elements have the same `score`, they are ordered lexicographically by `ele` (the value stored in the node, represented as an `sds`).
3. The default maximum number of levels allowed in a Redis skip list is 32, defined in the source code as `ZSKIPLIST_MAXLEVEL`.

## Comparison with the Other Three Data Structures

Finally, let's return to the interview question at the beginning of this article: "Why does Redis implement Sorted Sets under the hood using skip lists instead of balanced trees, Red-Black trees, or B+ trees?"

### Balanced Trees vs. Skip Lists

Let's start by comparing skip lists with balanced trees, also known as **AVL trees**. An AVL tree is a strictly balanced binary tree whose balancing condition requires that the height difference between the left and right subtrees of every node must not exceed 1 (i.e., the balance factor lies in `[-1, 1]`). The insertion, deletion, and lookup time complexities of a balanced tree are all **O(log n)**, the same as a skip list.

For range queries, an AVL tree can achieve the same effect as a skip list via in-order traversal. However, every insertion or deletion must maintain strict balance across the left and right subtrees of the entire tree—whenever an imbalance occurs, rotation operations are required to restore balance, which is a relatively expensive process.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005312-838df80e.png)

Skip lists were originally invented precisely to overcome these drawbacks of balanced trees, as detailed by the inventor of skip lists in the paper [Skip lists: a probabilistic alternative to balanced trees](https://15721.courses.cs.cmu.edu/spring2018/papers/08-oltpindexes1/pugh-skiplists-cacm1990.pdf):

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/skiplist-a-probabilistic-alternative-to-balanced-98c9963d.png)

> Skip lists are a data structure that can be used in place of balanced trees. Skip lists use probabilistic balancing rather than strictly enforced balancing and as a result the algorithms for insertion and deletion in skip lists are much simpler and significantly faster than equivalent algorithms for balanced trees.

Here is the core insertion code for an AVL tree as well. As you can see, every addition requires recursively locating the insertion position, then backtracking up toward the root to check whether any node along the path has become imbalanced, and adjusting via node rotations.

```java
// Add a new element (key, value) to the binary search tree
public void add(K key, V value) {
    root = add(root, key, value);
}

// Insert element (key, value) into the binary search tree rooted at node (recursive)
// Returns the root of the binary search tree after inserting the new node
private Node add(Node node, K key, V value) {

    if (node == null) {
        size++;
        return new Node(key, value);
    }

    if (key.compareTo(node.key) < 0)
        node.left = add(node.left, key, value);
    else if (key.compareTo(node.key) > 0)
        node.right = add(node.right, key, value);
    else // key.compareTo(node.key) == 0
        node.value = value;

    node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));

    int balanceFactor = getBalanceFactor(node);

    // LL case requires right rotation
    if (balanceFactor > 1 && getBalanceFactor(node.left) >= 0) {
        return rightRotate(node);
    }

    // RR imbalance requires left rotation
    if (balanceFactor < -1 && getBalanceFactor(node.right) <= 0) {
        return leftRotate(node);
    }

    // LR requires left rotation into LL first, then right rotation
    if (balanceFactor > 1 && getBalanceFactor(node.left) < 0) {
        node.left = leftRotate(node.left);
        return rightRotate(node);
    }

    // RL
    if (balanceFactor < -1 && getBalanceFactor(node.right) > 0) {
        node.right = rightRotate(node.right);
        return leftRotate(node);
    }
    return node;
}
```

### Red-Black Trees vs. Skip Lists

A Red-Black tree is also a self-balancing binary search tree. Its lookup performance is slightly lower than that of an AVL tree, but its insertion and deletion efficiency is higher. The insertion, deletion, and lookup time complexities of a Red-Black tree are all **O(log n)**, matching those of a skip list.

A Red-Black tree is a **black-balanced tree**—meaning every path from any node to any descendant leaf node passes through the same number of black nodes. On insertion, it uses rotations and recoloring (red-black flipping) to preserve black balance, though the overhead of maintaining balance is smaller than that of an AVL tree. For a detailed introduction to Red-Black trees, see [Red-Black Trees](https://javaguide.cn/cs-basics/data-structure/red-black-tree.html).

Compared with Red-Black trees, skip lists are simpler to implement. Furthermore, for range-based data lookups, Red-Black trees are less efficient than skip lists.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005709-eef796b6.png)

The core insertion code for a Red-Black tree is shown below for reference:

```java
private Node < K, V > add(Node < K, V > node, K key, V val) {

    if (node == null) {
        size++;
        return new Node(key, val);

    }

    if (key.compareTo(node.key) < 0) {
        node.left = add(node.left, key, val);
    } else if (key.compareTo(node.key) > 0) {
        node.right = add(node.right, key, val);
    } else {
        node.val = val;
    }

    // Left child is not red and right child is red -> left rotate
    if (isRed(node.right) && !isRed(node.left)) {
        node = leftRotate(node);
    }

    // Left-leaning consecutive red links -> right rotate
    if (isRed(node.left) && isRed(node.left.left)) {
        node = rightRotate(node);
    }

    // Flip colors
    if (isRed(node.left) && isRed(node.right)) {
        flipColors(node);
    }

    return node;
}
```

### B+ Trees vs. Skip Lists

Readers who have used MySQL are certainly familiar with the B+ tree data structure. A B+ tree is a widely used data structure with the following characteristics:

1. **Multi-way tree structure**: It is an n-ary tree where each node can contain multiple child nodes, reducing tree height and providing high lookup efficiency.
2. **High storage efficiency**: Non-leaf nodes store multiple keys while leaf nodes store values, enabling each node to hold more keys and making index-based range queries much faster.
3. **Strict balance**: It is strictly balanced, meaning the heights of all branches in the tree remain uniform, ensuring **O(log n)** lookup and insertion time complexity.
4. **Sequential access**: Leaf nodes are connected via linked list pointers, yielding excellent range-query performance.
5. **Even data distribution**: Insertions in a B+ tree may trigger data redistribution, keeping data evenly distributed across the tree and ensuring reliable range-query and deletion efficiency.

![](/media/jg/ext/oss.javaguide.cn/database/redis/skiplist/202401222005649-d3798b6b.png)

Therefore, B+ trees are much better suited as an indexing structure in disk-based databases and file systems, where the core idea is to locate as many index entries as possible with as few I/O operations as possible to fetch query results. For an in-memory database like Redis, this is not a major concern: because Redis keeps data in memory, it does not store massive disk-scale datasets, so indexes do not need the strict structural maintenance of a B+ tree—probabilistic random maintenance is sufficient and saves memory. Moreover, implementing `zset` with a skip list is simpler than with a B+ tree: on insertion, you only need to traverse the index to place the data into the right spot in the linked list and randomly assign an index height, without needing to split or merge nodes upon imbalance as B+ trees do.

### Reasons Given by the Creator of Redis

Of course, we can also look at the reasons given directly by the creator of Redis:

> There are a few reasons:
> 1. They are not very memory intensive. It's up to you basically. Changing parameters about the probability of a node to have a given number of levels will make then less memory intensive than btrees.
> 2. A sorted set is often target of many ZRANGE or ZREVRANGE operations, that is, traversing the skip list as a linked list. With this operation the cache locality of skip lists is at least as good as with other kind of balanced trees.
> 3. They are simpler to implement, debug, and so forth. For instance thanks to the skip list simplicity I received a patch (already in Redis master) with augmented skip lists implementing ZRANK in O(log(N)). It required little changes to the code.

## Summary

This article spent significant space introducing how skip lists work and how they are implemented to help you become more familiar with the strengths and weaknesses of the skip list data structure, and then compared it against the operational characteristics of other data structures to help you better answer this interview question. When studying and implementing skip lists, it is strongly recommended to trace through insertion, deletion, lookup, and update operations on paper by hand to fully grasp the step-by-step mechanics.

## Further Reading on Data Structures

If you want to review skip lists quickly from an interview perspective, see [Skip List Interview Questions Summary](../../cs-basics/data-structure/skip-list.md). If you also want to compare the other structures behind Redis ZSet, you can review [Detailed Guide to Red-Black Trees](../../cs-basics/data-structure/red-black-tree.md) and [Hash Table Interview Questions Summary](../../cs-basics/data-structure/hash-table.md).

## References

- Why does Redis use skiplist instead of red-black tree?: <https://www.zhihu.com/question/20202931/answer/16086538>
- Skip List (One of the most detailed skip list articles on the web): <https://www.jianshu.com/p/9d8296562806>
- Detailed explanation of Redis objects and underlying data structures: <https://blog.csdn.net/shark_chili3007/article/details/104171986>
- Redis Sorted Set: <https://www.runoob.com/redis/redis-sorted-sets.html>
- Comparison between Red-Black Trees and Skip Lists: <https://zhuanlan.zhihu.com/p/576984787>
- Why does Redis ZSet use Skip List instead of B+ Tree?: <https://blog.csdn.net/f80407515/article/details/129136998>
