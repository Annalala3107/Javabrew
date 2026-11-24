---
title: MySQL Indexes Explained
description: "A deep dive into MySQL indexes, covering B+ Tree index structures, the difference between Clustered Index and Secondary Index, Composite Index and the Leftmost Prefix Principle, Covering Index, Index Condition Pushdown (ICP), and common index invalidation scenarios."
category: Database
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Index,B+ Tree Index,Clustered Index,Covering Index,Composite Index,Index Condition Pushdown,Table Lookup,Index Invalidation,Leftmost Prefix Principle
lang: en
sourceRef: zh-ref/database/mysql/mysql-index.md
---

> Thanks to [WT-AHA](https://github.com/WT-AHA) for improving this article. Related PR: <https://github.com/Snailclimb/JavaGuide/pull/1648>.

Anyone who has been through a few technical interviews knows that database indexes appear at an extraordinarily high frequency in interviews.

Beyond being critical for interview preparation, using indexes effectively delivers substantial SQL performance improvements and is a highly cost-effective SQL optimization technique.

## Introduction to Indexes

**An index is a data structure used for fast querying and data retrieval; in essence, it can be viewed as a sorted data structure.**

An index serves a role similar to a book's table of contents. For analogy: when looking up a word in a dictionary without an index, you would have to flip through page by page to find the character you need, which is very slow; with an index, you simply look up the location of the character in the index first and flip directly to that page.

Many types of underlying data structures can be used for indexes, with common ones including B-Tree, B+ Tree, Hash, and Red-Black Tree. In MySQL, both InnoDB and MyISAM use B+ Tree as their index structure.

## Pros and Cons of Indexes

**Advantages of Indexes:**

1. **Dramatically faster queries (primary purpose)**: Through an index, the database can **significantly reduce the amount of data it needs to scan**, directly locating matching records, thereby noticeably accelerating data retrieval and reducing disk I/O operations.
2. **Enforcing data uniqueness**: By creating a **Unique Index**, you can ensure that the values of a column (or combination of columns) in a table are unique—for example, user ID, email, etc. A primary key itself is a type of unique index.
3. **Accelerating sorting and grouping**: If the columns referenced in a query's `ORDER BY` or `GROUP BY` clauses have an index, the database can often take direct advantage of the already-sorted nature of the index, avoiding extra sorting operations and improving performance.

**Disadvantages of Indexes:**

1. **Time-consuming to create and maintain**: Creating an index takes time, especially on large tables. More importantly, when performing **insert, delete, or update (DML) operations** on table data, not only must the data itself be modified, but the associated indexes must also be dynamically updated and maintained, which **reduces the execution efficiency of these DML operations**.
2. **Consumes storage space**: An index is fundamentally a data structure that must be stored in physical files (or memory structures), so it **takes up additional disk space**. The more indexes you have and the larger they are, the more space they consume.
3. **Can be misused or become ineffective**: If indexes are poorly designed or queries are poorly written, the database optimizer may choose not to use an index (or choose the wrong index), actually degrading performance.

**So, does using an index always improve query performance?**

**Not necessarily.** In most cases, proper index usage is indeed much faster than a full table scan. However, there are exceptions:

- **Dataset is too small**: If the table contains very few rows (for example, only a few hundred), a full table scan may be faster than using an index, because traversing the index itself carries overhead.
- **Query result set accounts for too large a proportion**: If the data to be queried accounts for most of the entire table (for example, more than 20%–30%), the optimizer may decide that a full table scan is more economical, because the cost of multiple table lookups (random I/O) via the index may exceed a single sequential full table scan.
- **Improper index maintenance or stale statistics**: Causes the optimizer to make inaccurate decisions.

## Index Underlying Data Structure Selection

### Hash Table

A hash table is a collection of key-value pairs where the corresponding value can be quickly retrieved by key, enabling fast data lookup (close to O(1)).

**Why can a value be quickly retrieved via a key?** The reason lies in the **hashing algorithm** (also known as a scatter algorithm). Using a hashing algorithm, we can quickly compute the index corresponding to a key, and finding the index gives us the corresponding value.

```java
hash = hashfunc(key)
index = hash % array_size
```

![Hash Table Lookup](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210513092328171-4bc73353.png)

However! Hashing algorithms suffer from the **Hash Collision** problem—meaning multiple different keys end up mapping to the same index. Typically, the common solution is **Separate Chaining**, which stores colliding entries in a linked list. For instance, prior to JDK 1.8, `HashMap` used separate chaining to resolve hash collisions. Starting in JDK 1.8, `HashMap` introduced Red-Black Trees to improve search efficiency when a linked list grows too long.

![Hash Collision Separate Chaining](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210513092224836-57f2e345.png)

To reduce the occurrence of hash collisions, a good hash function should distribute data "evenly" across the entire space of possible hash values.

MySQL's InnoDB storage engine does not directly support conventional hash indexes. However, InnoDB includes a special "Adaptive Hash Index" (AHI). The Adaptive Hash Index is not a pure hash index in the traditional sense; rather, it combines characteristics of B+ Tree and hash indexing to better adapt to real-world data access patterns and performance requirements. Each hash bucket in the Adaptive Hash Index is actually a small B+ Tree structure that can store multiple key-value pairs rather than just a single key. This helps shorten hash collision chains and improves index efficiency. For a detailed introduction to the Adaptive Hash Index, see the article [MySQL Various "Buffers": Adaptive Hash Index](https://mp.weixin.qq.com/s/ra4v1XR5pzSWc-qtGO-dBg).

If hash tables are so fast, **why doesn't MySQL use them as its primary index data structure?** Mainly because Hash indexes do not support sequential and range queries. If we want to sort data in a table or perform a range query, a Hash index simply cannot do the job. Moreover, each I/O can only retrieve one entry.

Consider the following scenario:

```java
SELECT * FROM tb1 WHERE id < 500;
```

In such a range query, the advantage is huge—you only need to directly traverse the leaf nodes smaller than 500. By contrast, a Hash index locates records using a hash algorithm; surely you wouldn't run a hash computation for every number from 1 to 499 just to locate them? That is the biggest drawback of Hash indexes.

### Binary Search Tree (BST)

A Binary Search Tree (BST) is a binary-tree-based data structure with the following properties:

1. All nodes in the left subtree have values less than the root node's value.
2. All nodes in the right subtree have values greater than the root node's value.
3. Both the left and right subtrees are themselves binary search trees.

When a binary search tree is balanced—meaning the depth difference between the left and right subtrees of every node is at most 1—the query time complexity is O(log2(N)), which offers relatively high efficiency. However, when a binary search tree becomes unbalanced, such as in the worst case (inserting nodes in sorted order), the tree degenerates into a linear linked list (also called a skewed tree), causing query efficiency to plummet and time complexity to degrade to O(N).

![Skewed Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/oblique-tree-db81ef30.png)

In other words, **the performance of a binary search tree depends heavily on how balanced it is, making it unsuitable as the underlying index data structure for MySQL.**

To solve this problem and improve query efficiency, people invented several improved data structures built on top of binary search trees, such as balanced binary trees, B-Trees, and B+ Trees.

### AVL Tree

The AVL tree is the earliest self-balancing binary search tree invented in computer science, named after its inventors G.M. Adelson-Velsky and E.M. Landis. An AVL tree guarantees that the height difference between the left and right subtrees of any node never exceeds 1, so it is also called a height-balanced binary tree. Its average and worst-case time complexity for search, insertion, and deletion is O(logn).

![AVL Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/avl-tree-f1110dca.png)

AVL trees use rotation operations to maintain balance. There are four main rotations: LL rotation, RR rotation, LR rotation, and RL rotation. LL and RR rotations handle left-left and right-right imbalances respectively, while LR and RL rotations handle left-right and right-left imbalances.

Because AVL trees require frequent rotations to maintain strict balance, they incur high computational overhead, which degrades database write performance. Furthermore, in an AVL tree, each node stores only one data item, and each disk I/O can only read one node's data. If the data being queried is spread across multiple nodes, multiple disk I/O operations are required. **Disk I/O is a time-consuming operation; when designing database indexes, we must prioritize minimizing the number of disk I/O operations.**

In practical applications, AVL trees are rarely used.

### Red-Black Tree

A Red-Black Tree is a self-balancing binary search tree that maintains balance during node insertions and deletions through color changes and rotations. It has the following properties:

1. Every node is either red or black;
2. The root node is always black;
3. Every leaf node is a black null node (NIL node);
4. If a node is red, its children must be black (the converse is not necessarily true);
5. Every path from any node to its descendant leaf nodes or null child nodes must contain the same number of black nodes (i.e., the same black-height).

![Red-Black Tree](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/red-black-tree-31d96234.png)

Unlike AVL trees, Red-Black Trees do not pursue strict balance, but rather approximate balance. As a result, query efficiency is slightly lower because weaker balance can lead to a taller tree, meaning some data may require multiple disk I/O operations to retrieve—which is the primary reason MySQL did not choose Red-Black Trees. Conversely, insertion and deletion efficiency in a Red-Black Tree is greatly improved, because a Red-Black Tree only needs O(1) rotations and recolorings to restore basic balance upon insertion or deletion, rather than O(logn) rotations as in an AVL tree.

**Red-Black Trees are still widely used—`TreeMap`, `TreeSet`, and JDK 1.8's `HashMap` all use Red-Black Trees under the hood. For scenarios where data resides in memory, Red-Black Trees perform exceptionally well.**

For a foundational comparison of Binary Search Trees, AVL Trees, Red-Black Trees, B-Trees, and B+ Trees, you can first read [Tree Data Structures Explained](../../cs-basics/data-structure/tree.md) and [Red-Black Tree Explained](../../cs-basics/data-structure/red-black-tree.md).

### B-Tree & B+ Tree

A B-Tree (also written B Tree) stands for **Balanced Multi-way Search Tree**, and a B+ Tree is a variant of the B-Tree. The "B" in both B-Tree and B+ Tree stands for `Balanced`.

Currently, most database systems and file systems use B-Tree or its variant B+ Tree as their index structure.

**What are the similarities and differences between B-Tree and B+ Tree?**

- In a B-Tree, all nodes store both keys and data, whereas in a B+ Tree, only leaf nodes store keys and data, and internal (non-leaf) nodes store only keys.
- In a B-Tree, leaf nodes are independent of one another; in a B+ Tree, leaf nodes have a linked-list pointer chain connecting adjacent leaf nodes.
- Searching in a B-Tree involves performing a binary search on the keys of each node along the path, and the search may terminate before reaching a leaf node. In a B+ Tree, search efficiency is very stable because every lookup traverses from the root node to a leaf node, and sequential scanning across leaf nodes is straightforward.
- When performing a range query in a B-Tree, you first find the lower bound and then perform an in-order traversal of the B-Tree until you reach the upper bound; in a B+ Tree, a range query simply traverses the leaf-node linked list.

In summary, compared with B-Tree, B+ Tree offers fewer disk I/O operations, more stable query performance, and superior support for range queries.

If you only want a quick review of B-Trees and B+ Trees from a data-structures perspective, you can revisit the interview review section in [Tree Data Structures Explained](../../cs-basics/data-structure/tree.md).

In MySQL, both the MyISAM engine and the InnoDB engine use B+ Tree as their index structure, but they implement it differently. (The following content is adapted from *The Path of Java Engineer Cultivation* / 《Java The Way of Software Engineering》.)

> In the MyISAM engine, the `data` field of a B+ Tree leaf node stores the address of the data record. During index lookup, MyISAM first searches the index using the B+ Tree search algorithm; if the specified key exists, it retrieves the value of the `data` field and uses that address to read the corresponding data record. This is called a "**Non-Clustered Index**".
>
> In the InnoDB engine, the table data file itself is the index file. In contrast to MyISAM, where the index file and data file are separate, an InnoDB table's data file itself is an index structure organized as a B+ Tree, where the `data` field of the leaf nodes holds the complete data record. The key of this index is the table's primary key, so the InnoDB table data file itself is the primary index. This is called a "**Clustered Index**", while all other indexes act as **Secondary Indexes** (Auxiliary Indexes). The `data` field of a secondary index stores the primary key value of the corresponding record rather than its physical address—which is also where InnoDB differs from MyISAM. When searching by the primary index, locating the key's node directly yields the data; when searching by a secondary index, you must first retrieve the primary key value and then traverse the primary index. Therefore, when designing tables, it is not recommended to use overly long fields or non-monotonic fields as the primary key, as doing so causes frequent splits in the primary index.

## Summary of Index Types

Classified by data structure:

- B-Tree Index: The default and most commonly used index type in MySQL. Only leaf nodes store values, while non-leaf nodes hold only pointers and keys. Both MyISAM and InnoDB implement B-Tree indexes using B+ Tree, though their internal implementations differ (as introduced above).
- Hash Index: Resembles key-value pairs and can locate entries in a single step.
- R-Tree Index: Rarely used; only supports `geometry` data types. Its strength is spatial range queries, though efficiency is low, so search engines like Elasticsearch are usually used instead.
- Full-Text Index: Tokenizes text content for searching. Currently can only be created on `CHAR`, `VARCHAR`, and `TEXT` columns. Rarely used due to lower efficiency; search engines like Elasticsearch are typically used instead.

Classified by underlying storage layout:

- Clustered Index: An index where the index structure and data are stored together; the primary key index in InnoDB is a clustered index.
- Non-Clustered Index: An index where the index structure and data are stored separately; secondary indexes (auxiliary indexes) are non-clustered indexes. In MySQL's MyISAM engine, both primary and non-primary indexes are non-clustered indexes.

Classified by application/usage:

- Primary Key Index: Accelerates queries + unique column values (`NULL` is not allowed) + only one per table.
- Normal Index: Solely accelerates queries.
- Unique Index: Accelerates queries + unique column values (`NULL` is allowed).
- Covering Index: An index that contains (or "covers") the values of all columns needed by a query.
- Composite Index: An index formed from multiple columns, designed specifically for multi-column searches; its efficiency is greater than Index Merge.
- Full-Text Index: Tokenizes text content for searching. Currently can only be created on `CHAR`, `VARCHAR`, and `TEXT` columns. Rarely used due to lower efficiency; search engines like Elasticsearch are typically used instead.
- Prefix Index: Creates an index on the first few characters of a text column, resulting in a smaller index size compared to a normal index since only the leading characters are indexed.

New index features introduced in MySQL 8.x:

- Invisible Index (Hidden Index): Not used by the optimizer, yet still maintained by the engine. Commonly used in soft-deletion of indexes and canary rollouts. Primary keys cannot be set to invisible (either explicitly or implicitly).
- Descending Index: Earlier versions supported specifying `DESC` on an index, but actually still created a standard ascending index. True descending indexes were only supported starting in MySQL 8.x. Additionally, MySQL 8.x no longer performs implicit sorting for `GROUP BY` statements.
- Functional Index: Introduced in MySQL 8.0.13, allowing indexes to be created on the values of functions or expressions.

## Primary Key Index

The index used by a table's primary key column is the Primary Key Index.

A table can have only one primary key, and the primary key cannot be `NULL` or duplicated.

In a MySQL InnoDB table, when no primary key is explicitly specified, InnoDB first automatically checks whether there is a unique index on a column that does not allow `NULL` values. If one exists, it selects that column as the default primary key; otherwise, InnoDB automatically creates a hidden 6-byte auto-increment primary key.

![Primary Key Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/cluster-index-a7e95938.png)

## Secondary Index

The leaf nodes of a Secondary Index store primary key values—meaning a secondary index locates the position of the primary key. Secondary indexes are also known as auxiliary indexes or non-primary key indexes.

Unique indexes, normal indexes, prefix indexes, and the like all belong to secondary indexes.

P.S.: If anything here is unclear, keep it in mind as you read further—the answers are coming below, or you can look them up yourself.

1. **Unique Index (`Unique Key`)**: A unique index is also a constraint. Values in the indexed column cannot be duplicated, though `NULL` values are permitted, and a table can have multiple unique indexes. Most of the time, the purpose of creating a unique index is to enforce uniqueness on the attribute column rather than for query speed.
2. **Normal Index (`Index`)**: The sole purpose of a normal index is fast data querying. A table can have multiple normal indexes, and duplicate values as well as `NULL` are allowed.
3. **Prefix Index (`Prefix`)**: A prefix index applies only to string-type data. It builds an index on the first few characters of text, taking up less space than a normal index because only those leading characters are stored.
4. **Full-Text Index (`Full Text`)**: A full-text index is primarily used to search for keywords within large text fields and is a technique used by search engine databases. Prior to MySQL 5.6, only the MyISAM engine supported full-text indexes; since 5.6, InnoDB also supports full-text indexes.

Secondary Index:

![Secondary Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/no-cluster-index-8c58e1fd.png)

## Clustered Index vs. Non-Clustered Index

### Clustered Index

#### Introduction to Clustered Index

A Clustered Index is an index where the index structure and the data are stored together—it is not a separate index type by itself. In InnoDB, the primary key index is a clustered index.

In MySQL, the `.ibd` file of an InnoDB table contains both the table's indexes and its data. For an InnoDB table, each non-leaf node of the index (B+ Tree) stores index keys, while the leaf nodes store both the index keys and the corresponding row data.

#### Pros and Cons of Clustered Index

**Advantages:**

- **Extremely fast queries**: Clustered index lookups are very fast because the entire B+ Tree is a balanced multi-way tree and the leaf nodes are ordered—locating the index node is equivalent to locating the data itself. Compared with a non-clustered index, a clustered index requires one fewer disk I/O operation to read the data.
- **Optimized for sorting and range lookups**: Clustered indexes are very fast for sorting and range queries on the primary key.

**Disadvantages:**

- **Relies on ordered data**: Because a B+ Tree is a balanced multi-way tree, if the indexed data is not ordered, it must be sorted upon insertion. For integer keys this is manageable, but for long and hard-to-compare values like strings or UUIDs, insertion and lookup speeds will naturally be slower.
- **High update cost**: When an indexed column's value is modified, the corresponding index must also be updated. Since the leaf nodes of a clustered index also store the full row data, the update cost is high—which is why primary keys are generally kept immutable.

### Non-Clustered Index

#### Introduction to Non-Clustered Index

A Non-Clustered Index is an index where the index structure and the data are stored separately—it is not a separate index type by itself. Secondary indexes (auxiliary indexes) are non-clustered indexes. In MySQL's MyISAM engine, both primary and non-primary indexes are non-clustered indexes.

The leaf nodes of a non-clustered index do not necessarily store data pointers directly—in InnoDB, a secondary index's leaf nodes store the primary key, and data is retrieved via a table lookup using that primary key.

#### Pros and Cons of Non-Clustered Index

**Advantages:**

Lower update cost than a clustered index. Because the leaf nodes of a non-clustered index do not store the actual row data, the cost of updating them is much smaller than that of a clustered index.

**Disadvantages:**

- **Relies on ordered data**: Just like clustered indexes, non-clustered indexes rely on ordered data.
- **May require a secondary lookup (table lookup)**: This is arguably the biggest drawback of non-clustered indexes. After locating the pointer or primary key corresponding to the index entry, the engine may still need to query the data file or primary table again using that pointer or primary key.

Here is a screenshot of MySQL table files:

![MySQL Table Files](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210420165311654-a6455c73.png)

Clustered Index vs. Non-Clustered Index:

![Clustered Index and Non-Clustered Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210420165326946-c52cd37b.png)

#### Does a Non-Clustered Index Always Require a Table Lookup (Covering Index)?

**A non-clustered index does not always require a table lookup.**

Consider a case where a user runs a SQL query to fetch usernames, and the `name` column happens to have an index:

```sql
 SELECT name FROM table WHERE name='guang19';
```

Here, the key of the index itself is `name`. Once the matching `name` is found, it can be returned directly without performing a table lookup.

Even in MyISAM this holds true: although MyISAM's primary key index normally requires looking up the record because its leaf nodes store pointers, **what if the SQL query only selects the primary key?**

```sql
SELECT id FROM table WHERE id=1;
```

The key of the primary key index itself is the primary key, so once found, it can be returned directly. This situation is known as a **Covering Index**.

## Covering Index and Composite Index

### Covering Index

If an index contains (or "covers") the values of all fields required by a query, we call it a **Covering Index**.

In the InnoDB storage engine, the leaf nodes of a non-primary-key index contain the primary key values. This means that when querying through a non-primary-key index, the database first finds the corresponding primary key value and then traverses the primary key index to locate and retrieve the complete row data. This process is known as a **table lookup**.

**A Covering Index means that the columns needed by the query happen to be the indexed columns themselves, so the data can be retrieved directly from that index without performing a table lookup.**

> For example, with a primary key index, if a SQL query selects only the primary key, the primary key can be fetched directly from the primary key index. Similarly, with a normal index, if a SQL query selects `name` and `name` has an index, the data can be fetched directly from that index without a table lookup.

![Covering Index](/media/jg/ext/oss.javaguide.cn/github/javaguide/database/mysql20210420165341868-1c1d4c30.png)

Let's briefly demonstrate the effect of a covering index.

1. Create a table named `cus_order` to test this sorting behavior. For convenience, the `cus_order` table has only 3 columns: `id`, `score`, and `name`.

```sql
CREATE TABLE `cus_order` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `score` int(11) NOT NULL,
  `name` varchar(11) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100000 DEFAULT CHARSET=utf8mb4;
```

2. Define a simple stored procedure (`PROCEDURE`) to insert 1 million test rows.

```sql
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `BatchinsertDataToCusOder`(IN start_num INT,IN max_num INT)
BEGIN
      DECLARE i INT default start_num;
      WHILE i < max_num DO
          insert into `cus_order`(`id`, `score`, `name`)
          values (i,RAND() * 1000000,CONCAT('user', i));
          SET i = i + 1;
      END WHILE;
  END;;
DELIMITER ;
```

Once the stored procedure is defined, we simply execute it!

```sql
CALL BatchinsertDataToCusOder(1, 1000000); # Insert 1M+ random rows
```

After waiting a short while, the 1 million test rows will be inserted!

3. Create a covering index and analyze the query using `EXPLAIN`.

To sort these 1 million rows by `score`, we execute the following SQL statement:

```sql
# Descending sort
SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
```

Analyzing this SQL statement with `EXPLAIN`, we see `Using filesort` in the `Extra` column, indicating that a covering index is not being used.

![EXPLAIN output without covering index](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/not-using-covering-index-demo-73bd79b3.png)

Of course, that makes complete sense since we haven't created any index yet!

Now let's create a composite index on the `score` and `name` columns:

```sql
ALTER TABLE `cus_order` ADD INDEX id_score_name(score, name);
```

After creating the index, analyze the SQL statement again using `EXPLAIN`.

![EXPLAIN output with covering index](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/using-covering-index-demo-a7f0c456.png)

Seeing `Using index` in the `Extra` column confirms that this SQL statement successfully used the covering index.

For a detailed introduction to the `EXPLAIN` command, see: [MySQL Execution Plan Analysis](./mysql-query-execution-plan.md).

### Composite Index

Creating an index on multiple columns of a table is called a **Composite Index** (also referred to as a combined index or multi-column index).

Creating a composite index on the `score` and `name` columns:

```sql
ALTER TABLE `cus_order` ADD INDEX id_score_name(score, name);
```

### Leftmost Prefix Matching Principle

The Leftmost Prefix Matching Principle states that when using a composite index, MySQL matches query condition columns sequentially from left to right according to the order of columns defined in the index. If the query conditions match the leftmost column(s) of the index, MySQL uses the index to filter data, improving query efficiency.

Leftmost prefix matching continues matching rightward until it encounters a range query (such as `>` or `<`). Range queries using `>=`, `<=`, `BETWEEN`, and prefix-matching `LIKE` do not stop further matching.

Suppose there is a composite index `(column1, column2, column3)`. Its prefixes from left to right are `(column1)`, `(column1, column2)`, and `(column1, column2, column3)` (creating 1 composite index is equivalent to creating 3 indexes). Any query involving these column prefixes will use the index instead of performing a full table scan.

When using a composite index, placing columns with higher selectivity (cardinality) on the far left helps filter out more data.

Let's briefly demonstrate the effect of leftmost prefix matching.

1. Create a table named `student` with only 3 columns: `id`, `name`, and `class`.

```sql
CREATE TABLE `student` (
  `id` int NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name_class_idx` (`name`,`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

2. Next, let's test three different SQL statements.

![Leftmost Prefix Matching Rule](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/leftmost-prefix-matching-rule-a8a5555c.png)

```sql
# Hits the index
SELECT * FROM student WHERE name = 'Anne Henry';
EXPLAIN SELECT * FROM student WHERE name = 'Anne Henry' AND class = 'lIrm08RYVk';
# Cannot hit the index
SELECT * FROM student WHERE class = 'lIrm08RYVk';
```

Now let's look at a common interview question: Given a composite index `(a, b, c)`, will querying `a=1 AND c=1` use the index? What about `c=1`? What about `b=1 AND c=1`? What about `b = 1 AND a = 1 AND  c = 1`?

Don't look at the answers right away—take 3 minutes to think about it.

1. Query `a=1 AND c=1`: According to the leftmost prefix matching principle, the query can use the prefix portion of the index. Therefore, this query uses the index only on `a=1`, and then filters the resulting rows for `c=1`.
2. Query `c=1`: Because the query does not include the leftmost column `a`, the entire index cannot be used according to the leftmost prefix principle.
3. Query `b=1 AND c=1`: Same as the second case—the index will not be used at all.
4. Query `b=1 AND a=1 AND c=1`: This query **can** use the index. When the query optimizer analyzes a SQL statement with a composite index, it reorders the query conditions so the index can be used—reordering `b=1` and `a=1` into `a=1 AND b=1 AND c=1`.

MySQL 8.0.13 introduced Index Skip Scan (ISS), which can improve query efficiency in certain index lookup scenarios. Before ISS, a query on a composite index that did not satisfy the leftmost prefix matching principle would execute a full table scan. ISS allows MySQL to avoid a full table scan in certain situations even when the query conditions do not match the leftmost prefix. However, this feature is rather niche and cannot compare with Oracle's implementation; MySQL 8.0.31 even reported a bug: [Bug #109145 Using index for skip scan cause incorrect result](https://bugs.mysql.com/bug.php?id=109145) (fixed in later versions). Personally, I recommend just knowing it exists without digging too deeply—you may not even end up using it in real projects.

## Index Condition Pushdown

**Index Condition Pushdown (ICP)** is an index optimization feature introduced in **MySQL 5.6**. It allows the storage engine to evaluate parts of the `WHERE` clause conditions while traversing the index, directly filtering out records that do not meet the criteria, thereby reducing table lookups and improving query efficiency.

Suppose we have a table named `user` containing 4 columns—`id`, `username`, `zipcode`, and `birthdate`—with a composite index `(zipcode, birthdate)`.

```sql
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `zipcode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `birthdate` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_zipcode_birthdate` (`zipcode`,`birthdate`) ) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8mb4;

# Query users whose zipcode is 431200 and whose birthday is in March
SELECT * FROM user WHERE zipcode = '431200' AND MONTH(birthdate) = 3;
```

- Before Index Condition Pushdown, even though the `zipcode` index helped us quickly locate users with `zipcode = '431200'`, we still had to perform a table lookup for every matching user to fetch the complete user record before checking `MONTH(birthdate) = 3`.
- With Index Condition Pushdown, while the storage engine looks up users with `zipcode = '431200'` using the `zipcode` index, it simultaneously evaluates `MONTH(birthdate) = 3`. Thus, only records satisfying both conditions are fetched via table lookup, reducing the number of table lookups.

![Index Condition Pushdown Comparison](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/index-condition-pushdown-783bf797.png)

![Index Condition Pushdown Graphic Illustration](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/index-condition-pushdown-graphic-illustration-cbcca262.png)

Now let's explain the exact mechanism behind Index Condition Pushdown, starting with the simplified MySQL architecture diagram below.

![MySQL Architecture Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

MySQL can simply be divided into two layers: the Server layer and the Storage Engine layer. The Server layer handles query parsing, analysis, optimization, caching, and client interaction, while the Storage Engine layer is responsible for data storage and retrieval. MySQL supports multiple storage engines including InnoDB, MyISAM, and Memory.

The **"Pushdown"** in Index Condition Pushdown literally means pushing part of the work originally handled by the upper layer (Server layer) down to the lower layer (Storage Engine layer).

Let's re-explain the example above in light of ICP's internal principle.

Before Index Condition Pushdown:

- The Storage Engine layer first uses the `zipcode` index column to find the primary key IDs of all users with `zipcode = '431200'`, then performs secondary table lookups to retrieve complete user records;
- The Storage Engine layer sends all user records with `zipcode = '431200'` up to the Server layer, and the Server layer further filters them based on `MONTH(birthdate) = 3`.

With Index Condition Pushdown:

- The Storage Engine layer first uses the `zipcode` index column to find all users with `zipcode = '431200'`, and directly evaluates `MONTH(birthdate) = 3` to filter out qualifying primary key IDs;
- It then performs table lookups only for those qualifying primary key IDs to retrieve complete user records;
- The Storage Engine layer passes only the matching user records up to the Server layer.

As we can see, **in addition to reducing table lookups, Index Condition Pushdown also reduces the amount of data transferred between the Storage Engine layer and the Server layer.**

Finally, let's summarize the applicable scope of Index Condition Pushdown:

1. Applies to queries on the InnoDB and MyISAM engines.
2. Applies to range-access queries whose execution plan access type (`type`) is `range`, `ref`, `eq_ref`, or `ref_or_null`.
3. For InnoDB tables, it applies only to non-clustered indexes. The goal of ICP is to reduce full-row reads and thus reduce I/O operations. For an InnoDB clustered index, the full record is already read into the InnoDB buffer pool, so using ICP in that case would not reduce I/O.
4. Subqueries cannot use ICP, because subqueries typically create temporary tables to process results, and temporary tables have no indexes.
5. Stored procedures cannot use ICP, because the storage engine cannot invoke stored functions.

## Recommendations for Using Indexes Properly

### Choose Appropriate Columns for Indexing

- **`NOT NULL` columns**: Indexed columns should avoid `NULL` values whenever possible, because databases have a harder time optimizing columns containing `NULL`. If a column is frequently queried and `NULL` cannot otherwise be avoided, it is recommended to use short, semantically clear values or characters like `0`, `1`, `true`, or `false` instead.
- **Frequently queried columns**: Columns that we index should be those queried very frequently.
- **Columns used in query conditions**: Columns used in `WHERE` clauses should be considered for indexing.
- **Columns frequently used for sorting**: Indexes are already sorted, so queries can leverage the index's ordering to speed up sorting queries.
- **Columns frequently used in joins**: Columns often used in joins may be foreign-key columns. You do not necessarily have to create an actual foreign-key constraint on them; it simply means the column models a relationship between tables. Consider indexing frequently joined columns to improve multi-table join query performance.

### Avoid Index Invalidation

Index invalidation is one of the leading causes of slow queries. Common causes of index invalidation fall into two categories:

**1. SQL Syntax Conflicts with Underlying Logic (Breaking B+ Tree Ordering)**

This is the most common category, where the query condition essentially causes the underlying B+ Tree to lose its fast "binary search" locating capability.

- **Violating the Leftmost Prefix Principle**: Skipping leading columns of a composite index, or hitting a range query (such as `>`, `<`, `BETWEEN`, `LIKE "abc%"`) that breaks exact positioning for subsequent columns, downgrading the access to a range scan plus filtering.
- **Operating on indexed columns**: Applying mathematical calculations or functions to the indexed column on the left side of a `WHERE` condition alters the original logical values, rendering the values unordered with respect to the index tree.
- **Implicit type conversion (subtle yet fatal)**: When a "string-type column" is compared against a "numeric value", MySQL implicitly wraps the column in a conversion function, directly breaking the ordering of the tree.
- **Leading wildcard in `LIKE` fuzzy queries**: For example `LIKE "%abc"`, where the uncertainty of leading characters prevents the optimizer from locking onto a starting point for the scan range.
- **`ORDER BY` sorting pitfalls**: Sorting columns that miss the index, or mismatching sort directions against the index structure, triggering extra in-memory or on-disk sorting (`Using filesort`).

**2. Optimizer Cost-Based Decisions (I/O Cost Trade-Offs)**

In this category, the index itself is not unusable; rather, after cost calculation, the MySQL optimizer determines that "not using the secondary index" has a lower overall cost.

- **Indiscriminate `SELECT *` overloading table lookup costs**: When querying many non-covered columns and matching a large portion of rows (typically over 20%–30%), the optimizer determines that the sequential I/O of a full table scan beats the random I/O of frequent table lookups, and proactively abandons the index.
- **`OR` conditions causing full table scans**: Whenever either side of an `OR` condition lacks an index, a full table scan is triggered. Even if both sides are indexed, the index will still be abandoned if the estimated cost of Index Merge is too high.
- **Overly long `IN` lists distorting cost estimates**: When an `IN` list exceeds the system threshold (default 200), the optimizer switches from accurate probing (Index Dive) to rough statistical estimation, easily causing misjudgments in execution cost when statistics are stale.

For more details: [Summary of MySQL Index Invalidation Scenarios](https://javaguide.cn/database/mysql/mysql-index-invalidation.html).

### Be Cautious When Indexing Frequently Updated Columns

While indexes improve query efficiency, the cost of maintaining them is non-trivial. If a column is rarely queried yet frequently modified, you should definitely avoid creating an index on it.

### Limit the Number of Indexes per Table

More indexes are not better; it is recommended to keep the number of indexes on a single table to no more than 5! Indexes can improve efficiency, and they can also reduce efficiency.

Indexes improve query performance, but they also degrade insert and update performance—and in some cases even degrade query performance.

This is because when the MySQL optimizer decides how to optimize a query, it evaluates every usable index based on statistics in order to generate the best execution plan. If too many indexes can potentially be used for a query, it increases the time the MySQL optimizer spends generating the execution plan, which also reduces query performance.

### Prefer Composite Indexes Over Single-Column Indexes Whenever Possible

Because indexes consume disk space, you can roughly think of each index as corresponding to a B+ Tree. If a table has many columns and many indexes, once the table grows to a significant size, the indexes will consume a large amount of disk space and take considerable time to update. With a composite index, multiple columns share one index, saving substantial disk space and improving data modification efficiency.

### Watch Out for Redundant Indexes

Redundant indexes are indexes with overlapping functionality: if a query can hit index `(a, b)`, it can definitely hit index `(a)`, making index `(a)` a redundant index. For instance, `(name, city)` and `(name)` are redundant indexes because any query hitting the former can also hit the latter. In most cases, you should extend existing indexes rather than creating new ones.

### Use Prefix Indexes Instead of Normal Indexes for String Columns

Prefix indexes apply only to string types and take up less space than normal indexes, so consider using prefix indexes instead of normal indexes.

### Remove Long-Unused Indexes

Remove indexes that have not been used for a long time; keeping unused indexes around causes unnecessary performance overhead.

In MySQL 5.7+, you can query the `schema_unused_indexes` view in the `sys` schema to check which indexes have never been used.

### Know How to Analyze Whether a SQL Query Uses an Index

We can use the `EXPLAIN` command to analyze the **execution plan** of a SQL statement and determine whether it hits an index. An execution plan describes the exact way a SQL statement will be executed after being processed by the MySQL query optimizer.

`EXPLAIN` does not actually execute the statement; instead, it lets the **query optimizer** analyze the statement, determine the optimal query plan, and display the corresponding details.

The output format of `EXPLAIN` is as follows:

```sql
mysql> EXPLAIN SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | cus_order | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 997572 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)
```

The meaning of each column is as follows:

| **Column Name** | **Meaning** |
| --------------- | ----------------------------------------------------------------- |
| id | Sequence identifier of the `SELECT` query |
| select_type | Query type corresponding to the `SELECT` keyword |
| table | Name of the table accessed |
| partitions | Matched partitions; `NULL` for unpartitioned tables |
| type | Access method for the table |
| possible_keys | Indexes that could potentially be used |
| key | Index actually chosen |
| key_len | Length of the selected index |
| ref | Column or constant compared against the index during equality lookups |
| rows | Estimated number of rows to be examined |
| filtered | Percentage of rows remaining after filtering by table conditions |
| Extra | Additional execution details |

Due to space constraints, this is only a brief introduction to MySQL execution plans. For a detailed walkthrough, please read: [MySQL Execution Plan Analysis](./mysql-query-execution-plan.md).

## Further Reading on Data Structures

When studying MySQL indexes, it is helpful to revisit the tree data structures themselves:

- [Tree Data Structures Explained](../../cs-basics/data-structure/tree.md): Compares Binary Search Trees, AVL Trees, Red-Black Trees, B-Trees, and B+ Trees.
- [Red-Black Tree Explained](../../cs-basics/data-structure/red-black-tree.md): Understand the trade-offs of in-memory self-balancing search trees, and compare why B+ Trees are better suited for disk-based indexes.
