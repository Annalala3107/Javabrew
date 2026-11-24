---
title: Java Collections Common Interview Questions Summary (Part 2)
description: "High-frequency Java Collections interview questions: in-depth analysis of HashMap underlying principles, Red-Black Tree conversion, hash collision resolution, ConcurrentHashMap thread-safety mechanisms, differences from Hashtable, and other core concepts."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/java-collection-questions-02.md
head:
  - - meta
    - name: keywords
      content: HashMap,ConcurrentHashMap,Hashtable,Red-Black Tree,hash collision,thread safety,collections interview questions
---


## Map (Important)

### ⭐️ Differences between HashMap and Hashtable

- **Thread safety:** `HashMap` is not thread-safe, whereas `Hashtable` is thread-safe because most methods inside `Hashtable` are decorated with `synchronized`. (If you need thread safety, use `ConcurrentHashMap` instead!)
- **Efficiency:** Because of thread-safety overhead, `HashMap` is somewhat faster than `Hashtable`. Moreover, `Hashtable` is basically obsolete—do not use it in your code.
- **Support for Null keys and Null values:** `HashMap` can store `null` keys and `null` values, though there can only be one `null` key while there can be multiple `null` values; `Hashtable` does not allow `null` keys or `null` values, otherwise it throws a `NullPointerException`.
- **Initial capacity and resizing growth:** (1) When created without specifying an initial capacity, `Hashtable` has a default initial size of 11, and on each subsequent resize the capacity becomes `2n+1`. `HashMap` has a default initial size of 16, and on each subsequent resize the capacity doubles (`2x`). (2) When an initial capacity is provided upon creation, `Hashtable` directly uses the size you specified, whereas `HashMap` expands it to a power of two (guaranteed by the `tableSizeFor()` method in `HashMap`, whose source code is shown below). In other words, `HashMap` always uses a power of 2 as the size of its hash table—we will explain why it is a power of 2 later on.
- **Underlying data structure:** `HashMap` since JDK 1.8 underwent major changes in resolving hash collisions: when the linked list length exceeds the threshold (default is 8), it converts the linked list into a Red-Black Tree (before converting the linked list to a Red-Black Tree, it checks whether the current array length is less than 64; if so, it chooses to resize the array first rather than converting to a Red-Black Tree) to reduce search time (we will analyze this process with source code later). `Hashtable` does not have such a mechanism.
- **Hash function implementation:** `HashMap` performs high-bit and low-bit perturbation mixing on the hash value to reduce collisions, whereas `Hashtable` directly uses the key's `hashCode()` value.

**Constructor in `HashMap` with initial capacity:**

```java
    public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal load factor: " +
                                               loadFactor);
        this.loadFactor = loadFactor;
        this.threshold = tableSizeFor(initialCapacity);
    }
     public HashMap(int initialCapacity) {
        this(initialCapacity, DEFAULT_LOAD_FACTOR);
    }
```

The method below ensures that `HashMap` always uses a power of 2 as the size of its hash table.

```java
/**
 * Returns a power of two size for the given target capacity.
 */
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

### Differences between HashMap and HashSet

If you have read the `HashSet` source code, you should know that `HashSet` is implemented based on `HashMap` underneath. (The source code of `HashSet` is very, very small, because aside from `clone()`, `writeObject()`, and `readObject()` which `HashSet` has to implement itself, all other methods directly call methods in `HashMap`.)

|                     `HashMap`                     |                                                              `HashSet`                                                               |
| :-----------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------: |
|           Implements the `Map` interface          |                                                  Implements the `Set` interface                                                      |
|               Stores key-value pairs              |                                                         Stores only objects                                                          |
|       Calls `put()` to add elements to the map    |                                              Calls `add()` to add elements to the `Set`                                              |
| `HashMap` uses the Key to compute the `hashCode`  | `HashSet` uses member objects to compute the `hashCode`; since two objects may have the same `hashCode`, `equals()` determines equality |

### ⭐️ Differences between HashMap and TreeMap

Both `TreeMap` and `HashMap` inherit from `AbstractMap`, but notably `TreeMap` also implements the `NavigableMap` and `SortedMap` interfaces.

![TreeMap Inheritance Hierarchy](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/treemap_hierarchy-5b937ea2.png)

Implementing the `NavigableMap` interface gives `TreeMap` the capability to search for elements within the collection.

The `NavigableMap` interface provides rich methods for navigating and operating on key-value pairs:

1. **Directional search:** Methods such as `ceilingEntry()`, `floorEntry()`, `higherEntry()`, and `lowerEntry()` can locate the closest key-value pair greater than or equal to, less than or equal to, strictly greater than, or strictly less than a given key.
2. **Subset operations:** Methods such as `subMap()`, `headMap()`, and `tailMap()` can efficiently create subset views of the original collection without copying the entire collection.
3. **Reverse view:** The `descendingMap()` method returns a reverse-order `NavigableMap` view, allowing the entire `TreeMap` to be iterated in reverse.
4. **Boundary operations:** Methods such as `firstEntry()`, `lastEntry()`, `pollFirstEntry()`, and `pollLastEntry()` make it convenient to access and remove boundary elements.

These methods are all implemented based on the properties of the Red-Black Tree data structure, which maintains balance and thereby guarantees O(log n) time complexity for search operations, making `TreeMap` a powerful tool for handling ordered collection search problems.

Implementing the `SortedMap` interface gives `TreeMap` the ability to sort elements in the collection by key. By default, sorting is in ascending order of keys, though we can also specify a custom sorting comparator. Example code is shown below:

```java
/**
 * @author shuang.kou
 * @createTime 2020-06-15 17:02:00
 */
public class Person {
    private Integer age;

    public Person(Integer age) {
        this.age = age;
    }

    public Integer getAge() {
        return age;
    }


    public static void main(String[] args) {
        TreeMap<Person, String> treeMap = new TreeMap<>(new Comparator<Person>() {
            @Override
            public int compare(Person person1, Person person2) {
                int num = person1.getAge() - person2.getAge();
                return Integer.compare(num, 0);
            }
        });
        treeMap.put(new Person(3), "person1");
        treeMap.put(new Person(18), "person2");
        treeMap.put(new Person(35), "person3");
        treeMap.put(new Person(16), "person4");
        treeMap.entrySet().stream().forEach(personStringEntry -> {
            System.out.println(personStringEntry.getValue());
        });
    }
}
```

Output:

```plain
person1
person4
person2
person3
```

As can be seen, the elements in `TreeMap` are sorted in ascending order of `Person`'s `age` field.

Above, we implemented this by passing an anonymous inner class; you can replace that code with a Lambda expression:

```java
TreeMap<Person, String> treeMap = new TreeMap<>((person1, person2) -> {
  int num = person1.getAge() - person2.getAge();
  return Integer.compare(num, 0);
});
```

**In summary, compared with `HashMap`, `TreeMap` mainly adds the ability to sort elements in the collection by key as well as the ability to search elements within the collection.**

### How does HashSet check for duplicates?

The following content is excerpted from my Java introductory book *Head First Java* (2nd Edition):

> When you put an object into a `HashSet`, `HashSet` first computes the object's `hashCode` value to determine where the object should be placed, and also compares it against the `hashCode` values of other objects already added. If there is no matching `hashCode`, `HashSet` assumes the object is not a duplicate. However, if an object with the same `hashCode` value is found, it then calls `equals()` to check whether the objects with equal `hashCode` are truly equal. If they are equal, `HashSet` will not allow the add operation to succeed.

In JDK 1.8, `HashSet`'s `add()` method simply calls `HashMap`'s `put()` method and checks the return value to ensure there are no duplicate elements. Let's look directly at the source code in `HashSet`:

```java
// Returns: true if this set did not already contain the specified element
// Return value: returns true when the set did not already contain the element being added
public boolean add(E e) {
        return map.put(e, PRESENT)==null;
}
```

And in `HashMap`'s `putVal()` method, we can also see the following comment:

```java
// Returns : previous value, or null if none
// Return value: returns null if there was no element at the insertion position, otherwise returns the previous value
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
...
}
```

In other words, in JDK 1.8, if an identical element already exists in `HashSet`, the underlying `HashMap` keeps the original key and `HashSet#add()` returns `false`; only when it does not exist does it add the new element and return `true`.

### ⭐️ Underlying Implementation of HashMap

#### Before JDK 1.8

Prior to JDK 1.8, `HashMap` combined an **array and linked lists** underneath, i.e., **separate-chaining hashing (hash array with linked lists)**. `HashMap` processes the key's `hashCode` through a perturbation function to obtain the `hash` value, and then determines the storage slot of the current element via `(n - 1) & hash` (where `n` refers to the array length). If an element already exists at the current position, it checks whether that existing element has the same `hash` value and `key` as the element to be inserted: if identical, it directly overwrites; if not, it resolves the collision via separate chaining.

The perturbation function (`hash` method) in `HashMap` is used to optimize the distribution of hash values. By performing additional bit-mixing on the raw `hashCode()`, the perturbation function reduces collisions caused by poor `hashCode()` implementations, thereby improving the uniformity of data distribution.

**JDK 1.8 HashMap `hash` method source code:**

The JDK 1.8 `hash` method is simpler than JDK 1.7's `hash` method, while keeping the same principle.

```java
    static final int hash(Object key) {
      int h;
      // key.hashCode(): returns the hash value, i.e., hashcode
      // ^: bitwise XOR
      // >>>: unsigned right shift, ignoring the sign bit and filling empty bits with 0
      return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
  }
```

Compare this with JDK 1.7's `HashMap` `hash` method source code:

```java
static int hash(int h) {
    // This function ensures that hashCodes that differ only by
    // constant multiples at each bit position have a bounded
    // number of collisions (approximately 8 at default load factor).

    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
```

Compared with JDK 1.8's `hash` method, JDK 1.7's `hash` method has slightly lower performance because it performs 4 rounds of bit-perturbation shifts.

So-called **"separate chaining"** means combining linked lists and an array—that is, creating an array of linked lists where each slot in the array is a linked list. When a hash collision occurs, the colliding entry is simply added to the linked list.

![Internal Structure of HashMap Before JDK 1.8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.7_hashmap-6222a2fe.png)

#### After JDK 1.8

Compared with earlier versions, JDK 1.8 and later introduced major changes in resolving hash collisions: when the linked list length exceeds the threshold (default is 8) (before converting the linked list into a Red-Black Tree, it checks whether the current array length is less than 64; if so, it chooses to resize the array first instead of converting into a Red-Black Tree), the linked list is converted into a Red-Black Tree.

The purpose of doing so is to reduce search time: the lookup efficiency of a linked list is O(n) (where n is the length of the linked list), whereas a Red-Black Tree is a self-balancing binary search tree with a lookup efficiency of O(log n). When the linked list is short, the performance difference between O(n) and O(log n) is not obvious. However, when the linked list becomes long, lookup performance degrades significantly.

![Internal Structure of HashMap After JDK 1.8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.8_hashmap-9d03cb2d.png)

**Why prioritize resizing rather than converting directly to a Red-Black Tree?**

Resizing the array reduces the probability of hash collisions (by redistributing elements into a new, larger array), which in most cases is more efficient than converting directly into a Red-Black Tree.

A Red-Black Tree must maintain self-balance, which incurs higher maintenance overhead. Moreover, introducing a Red-Black Tree prematurely actually increases complexity.

**Why choose the thresholds 8 and 64?**

1. The Poisson distribution shows that the probability of a linked list reaching length 8 is extremely low (less than one in ten million). In the vast majority of cases, linked list lengths will not exceed 8. Setting the threshold to 8 ensures a good balance between performance and space efficiency.
2. The array length threshold of 64 is likewise an empirical value validated in practice. For small arrays, resizing is inexpensive, and prioritizing resizing avoids introducing Red-Black Trees prematurely. Once the array size reaches 64, collision probability becomes higher, at which point the performance advantage of Red-Black Trees begins to show.

> `TreeMap`, `TreeSet`, and JDK 1.8+ `HashMap` all use Red-Black Trees underneath. Red-Black Trees exist to solve the flaw of binary search trees, because a binary search tree can degenerate into a linear structure in certain cases.

Let's analyze the conversion from a linked list to a Red-Black Tree in `HashMap` alongside the source code.

**1. Judgment logic in `putVal` for converting a linked list to a Red-Black Tree.**

When the linked list length is greater than 8, the `treeifyBin` (convert to Red-Black Tree) logic is executed.

```java
// Traverse the linked list
for (int binCount = 0; ; ++binCount) {
    // Reached the last node of the linked list
    if ((e = p.next) == null) {
        p.next = newNode(hash, key, value, null);
        // If the number of nodes in the linked list reaches TREEIFY_THRESHOLD (8)
        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
            // Convert to Red-Black Tree (does not immediately convert directly into a Red-Black Tree)
            treeifyBin(tab, hash);
        break;
    }
    if (e.hash == hash &&
        ((k = e.key) == key || (key != null && key.equals(k))))
        break;
    p = e;
}
```

**2. Checking whether to actually convert to a Red-Black Tree in `treeifyBin`.**

```java
final void treeifyBin(Node<K,V>[] tab, int hash) {
    int n, index; Node<K,V> e;
    // Check whether the current array length is less than 64
    if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
        // If the current array length is less than 64, choose to resize the array first
        resize();
    else if ((e = tab[index = (n - 1) & hash]) != null) {
        // Otherwise convert the linked list into a Red-Black Tree

        TreeNode<K,V> hd = null, tl = null;
        do {
            TreeNode<K,V> p = replacementTreeNode(e, null);
            if (tl == null)
                hd = p;
            else {
                p.prev = tl;
                tl.next = p;
            }
            tl = p;
        } while ((e = e.next) != null);
        if ((tab[index] = hd) != null)
            hd.treeify(tab);
    }
}
```

Before converting a linked list into a Red-Black Tree, it checks whether the current array length is less than 64; if so, it chooses to resize the array first rather than converting to a Red-Black Tree.

### ⭐️ Why is the length of HashMap a power of 2?

To keep `HashMap` fast for both access and storage while minimizing collisions, we need to ensure data is distributed as evenly as possible. Hash values in Java are usually represented using `int`, whose range is `-2147483648 ~ 2147483647`—a mapping space of roughly 4 billion values. As long as the hash function distributes hashes relatively evenly and sparsely, collisions rarely happen in ordinary applications. However, the problem is that a 4-billion-element array cannot fit in memory. Therefore, this hash value cannot be used directly; before using it, we must take the modulo with respect to the array length, and the resulting remainder gives the storage position—the corresponding array index.

**How should this algorithm be designed?**

We might first think of using the `%` modulo operator. For a non-negative `hash`, when `length` is a power of 2, `hash % length` is equivalent to `hash & (length - 1)`. `HashMap` uses the latter to compute the array index.

Beyond the higher efficiency of bitwise operations over modulo mentioned above, I believe an even more important reason is: **having a length that is a power of 2 enables `HashMap` to distribute elements more evenly when resizing**. For example:

- When `length = 8`, the binary representation of `length - 1 = 7` is `0111`
- When `length = 16`, the binary representation of `length - 1 = 15` is `1111`

At this point, when elements already in `HashMap` compute their new array positions via `hash&(length-1)`, depending on the 4th binary bit of `hash` (counting from the right), two cases occur:

1. If the 4th binary bit is 0, the array index remains unchanged—meaning the element has the same position in the new array as in the old array.
2. If the 4th binary bit is 1, the array index moves into the newly expanded upper half of the new array.

Here is an example:

```plain
Suppose an element has a hash value of 10101100

Old array position calculation:
hash        = 10101100
length - 1  = 00000111
& -----------------
index       = 00000100  (4)

New array position calculation:
hash        = 10101100
length - 1  = 00001111
& -----------------
index       = 00001100  (12)

Look at the 4th bit (counting from the right):
1. High bit is 0: position remains unchanged.
2. High bit is 1: moves to new position (original index + original capacity).
```

⚠️ Note: The example above inspects the 4th binary bit; more accurately, it inspects the newly added high-order bit (counting from the right). For instance, when `length = 32`, `length - 1 = 31`, which is `11111` in binary, so here we look at the 5th binary bit.

That is to say, after resizing, provided the hash values of elements in the old array are fairly uniform (which depends on the object's `hashCode()` method and the perturbation function discussed earlier), the elements in the new array will also be distributed relatively evenly—in the best case, half in the lower half of the new array and half in the upper half.

This also makes the resizing mechanism simple and efficient: after resizing, it only needs to check the newly uncovered high bit of the hash value to determine each element's new position—either staying at the same index (high bit is 0) or moving to a new index (high bit is 1, `original index + original capacity`).

Finally, to briefly summarize the reasons why `HashMap` uses a power-of-2 length:

1. Higher bitwise efficiency: Bitwise AND (`&`) is more efficient than modulo (`%`). For non-negative `hash`, when length is a power of 2, `hash % length` is equivalent to `hash & (length - 1)`.
2. Better guarantees uniform hash distribution: After resizing, when hash values in the old array are fairly evenly distributed, elements in the new array are also evenly distributed—ideally half in the first half and half in the second half of the new array.
3. Simpler and more efficient resizing mechanism: After resizing, it only needs to check the change in the high-order bit of the hash value to determine an element's new position: either unchanged (high bit is 0) or moved to a new position (high bit is 1, `original index + original capacity`).

### ⭐️ Infinite Loop Problem Caused by Multi-threaded Operations on HashMap

In JDK 1.7 and earlier versions of `HashMap`, resizing in a multi-threaded environment could suffer from an infinite loop problem. This happens because when a bucket contains multiple elements that need to be resized, multiple threads operating on the linked list concurrently with head-insertion can cause node pointers in the linked list to point to the wrong positions, forming a circular linked list and causing lookup operations to fall into an endless loop.

To solve this problem, JDK 1.8's `HashMap` switched to tail-insertion instead of head-insertion to avoid reversing the linked list, ensuring that inserted nodes are always placed at the tail of the linked list and preventing circular structures. However, using `HashMap` in a multi-threaded environment is still not recommended, because data overwriting issues still occur under concurrency. In concurrent environments, `ConcurrentHashMap` is recommended.

In interviews, explaining it at this level is usually sufficient—there is no need to memorize every tiny detail, and personally I don't think memorizing them is necessary. If you want to understand the `HashMap` resize infinite loop issue in detail, you can read Uncle Haozi's article: [Infinite Loop in Java HashMap](https://coolshell.cn/articles/9606.html).

### ⭐️ Why is HashMap not thread-safe?

`HashMap` is not thread-safe. Performing concurrent write operations on `HashMap` in a multi-threaded environment can lead to two primary problems:

1. **Data loss:** Concurrent `put` operations may cause one thread's write to be overwritten by another thread.
2. **Infinite loop:** In JDK 7 and earlier versions, during concurrent resizing, head-insertion can cause linked lists to form cycles, triggering an infinite loop during `get` operations and driving CPU usage to 100%.

Data loss exists in both JDK 1.7 and JDK 1.8; here we use JDK 1.8 as an example.

In JDK 1.8 and later, multiple key-value pairs in `HashMap` may be assigned to the same bucket and stored as a linked list or a Red-Black Tree. Multiple threads performing `put` operations on `HashMap` cause thread unsafety—specifically, the risk of data overwriting.

For example:

- Suppose two threads 1 and 2 perform `put` operations concurrently, and a hash collision occurs (the insertion bucket index computed by the hash function is identical).
- Different threads may receive CPU time slices at different moments. Suppose thread 1 finishes checking for a hash collision and gets suspended because its time slice expires. Thread 2 then completes its insertion operation first.
- Subsequently, thread 1 regains a time slice; since it had already performed the hash-collision check earlier, it proceeds directly to insert its node, causing thread 2's inserted data to be overwritten by thread 1.

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    // ...
    // Check whether a hash collision occurs
    // (n - 1) & hash determines which bucket the element goes into; if the bucket is empty, create a new node and place it in the bucket (stored in the array)
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    // Bucket already contains elements (handle hash collision)
    else {
    // ...
}
```

Another scenario is where two concurrent `put` operations cause the `size` value to become incorrect:

1. Thread 1 executes the `if(++size > threshold)` check, reads `size` as 10, and gets suspended due to time-slice expiration.
2. Thread 2 also executes `if(++size > threshold)`, reads `size` as 10 as well, inserts its element into the bucket, and updates `size` to 11.
3. Subsequently, thread 1 regains a time slice, also inserts its element into the bucket, and updates `size` to 11.
4. Both threads 1 and 2 executed a `put` operation, yet `size` only increased by 1. Here a lost update occurred on the counter, so one cannot rely solely on `size` to determine how many elements were actually inserted.

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    // ...
    // Resize if actual size exceeds threshold
    if (++size > threshold)
        resize();
    // Post-insertion callback
    afterNodeInsertion(evict);
    return null;
}
```

### Common ways to traverse a HashMap?

[7 Ways to Traverse a HashMap and Performance Analysis!](https://mp.weixin.qq.com/s/zQBN3UvJDhRTKP6SzcZFKw)

**🐛 Correction (see: [issue#1411](https://github.com/Snailclimb/JavaGuide/issues/1411)):**

That article's performance analysis of `parallelStream` traversal was inaccurate. To state the conclusion upfront: **when blocking exists, `parallelStream` has the highest performance; when non-blocking, `parallelStream` has the lowest performance.**

When traversal does not involve blocking, `parallelStream` has the lowest performance:

```plain
Benchmark               Mode  Cnt     Score      Error  Units
Test.entrySet           avgt    5   288.651 ±   10.536  ns/op
Test.keySet             avgt    5   584.594 ±   21.431  ns/op
Test.lambda             avgt    5   221.791 ±   10.198  ns/op
Test.parallelStream     avgt    5  6919.163 ± 1116.139  ns/op
```

After adding blocking code `Thread.sleep(10)`, `parallelStream` achieves the highest performance:

```plain
Benchmark               Mode  Cnt           Score          Error  Units
Test.entrySet           avgt    5  1554828440.000 ± 23657748.653  ns/op
Test.keySet             avgt    5  1550612500.000 ±  6474562.858  ns/op
Test.lambda             avgt    5  1551065180.000 ± 19164407.426  ns/op
Test.parallelStream     avgt    5   186345456.667 ±  3210435.590  ns/op
```

### ⭐️ Differences between ConcurrentHashMap and Hashtable

The differences between `ConcurrentHashMap` and `Hashtable` mainly lie in how they implement thread safety.

- **Underlying data structure:** JDK 1.7 `ConcurrentHashMap` uses a **segmented array + linked list** underneath, whereas in JDK 1.8 it uses the same data structure as `HashMap`: array + linked list / Red-Black Tree. `Hashtable` has a similar underlying structure to `HashMap` prior to JDK 1.8, using **array + linked list**, where the array is the main body and linked lists exist mainly to resolve hash collisions.
- **How thread safety is implemented (Important):**
  - In JDK 1.7, `ConcurrentHashMap` partitions the entire bucket array into segments (`Segment`, segmented locking). Each lock only locks a portion of the data in the container (diagram shown below); when multiple threads access data in different segments of the container, there is no lock contention, improving concurrent access throughput.
  - By JDK 1.8, `ConcurrentHashMap` discarded the `Segment` concept and instead directly uses a `Node` array + linked list + Red-Black Tree data structure, using `synchronized` and CAS for concurrency control. (After JDK 1.6, `synchronized` locks received extensive optimizations.) Overall it looks like an optimized, thread-safe `HashMap`; although `Segment` still exists in JDK 1.8 code, its fields have been simplified and it is kept solely for backward compatibility with older versions.
  - **`Hashtable` (a single lock):** Uses `synchronized` to ensure thread safety, which is very inefficient. When one thread accesses a synchronized method, other threads trying to access synchronized methods may enter a blocked or polling state—for instance, if one thread uses `put` to add an element, another thread cannot use `put` to add elements nor use `get`, making contention increasingly intense and efficiency lower.

Let's look at the comparison diagrams of their underlying data structures below.

**Hashtable**:

![Internal Structure of Hashtable](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.7_hashmap-6222a2fe.png)

<p style="text-align:right;font-size:13px;color:gray">https://www.cnblogs.com/chengxiao/p/6842045.html></p>

**ConcurrentHashMap in JDK 1.7**:

![Java 7 ConcurrentHashMap Storage Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

`ConcurrentHashMap` consists of a `Segment` array structure and `HashEntry` array structures.

Each element in the `Segment` array contains a `HashEntry` array, and each `HashEntry` array belongs to a linked list structure.

**ConcurrentHashMap in JDK 1.8**:

![Java 8 ConcurrentHashMap Storage Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

JDK 1.8 `ConcurrentHashMap` is no longer **Segment array + HashEntry array + linked list**, but rather **Node array + linked list / Red-Black Tree**. However, `Node` is only used for linked lists; for Red-Black Trees, **`TreeNode`** is used. When a collision chain reaches a certain length, the linked list is converted into a Red-Black Tree.

`TreeNode` stores Red-Black Tree nodes and is wrapped by `TreeBin`. `TreeBin` maintains the root node of the Red-Black Tree via its `root` field. Because during Red-Black Tree rotations the root node may be replaced by one of its original child nodes—at which point if another thread tried to write to this Red-Black Tree, thread-safety issues would arise—`TreeBin` in `ConcurrentHashMap` maintains the thread currently using this Red-Black Tree via its `waiter` field to prevent other threads from entering.

```java
static final class TreeBin<K,V> extends Node<K,V> {
        TreeNode<K,V> root;
        volatile TreeNode<K,V> first;
        volatile Thread waiter;
        volatile int lockState;
        // values for lockState
        static final int WRITER = 1; // set while holding write lock
        static final int WAITER = 2; // set when waiting for write lock
        static final int READER = 4; // increment value for setting read lock
...
}
```

### ⭐️ Concrete Implementation of Thread Safety / Underlying Implementation of ConcurrentHashMap

#### Before JDK 1.8

![Java 7 ConcurrentHashMap Storage Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

First, data is divided into segments (this "segment" is `Segment`) for storage, and each segment of data is assigned a lock. When one thread acquires the lock to access data in one segment, data in other segments can still be accessed by other threads.

**`ConcurrentHashMap` consists of a `Segment` array structure and `HashEntry` array structures**.

`Segment` inherits from `ReentrantLock`, so `Segment` is a reentrant lock playing the role of a lock. `HashEntry` is used to store key-value pair data.

```java
static class Segment<K,V> extends ReentrantLock implements Serializable {
}
```

A `ConcurrentHashMap` contains one `Segment` array, and the number of `Segment`s **cannot be changed once initialized**. The default size of the `Segment` array is 16, meaning it can support up to 16 threads performing concurrent writes simultaneously by default.

The structure of a `Segment` is similar to `HashMap`—an array and linked list structure. A `Segment` contains a `HashEntry` array, where each `HashEntry` is an element of a linked list structure. Each `Segment` guards the elements inside a `HashEntry` array; when modifying data in a `HashEntry` array, the corresponding `Segment`'s lock must be acquired first. That is to say, concurrent writes to the same `Segment` are blocked, while writes to different `Segment`s can execute concurrently.

#### After JDK 1.8

![Java 8 ConcurrentHashMap Storage Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

Java 8 almost completely rewrote `ConcurrentHashMap`; the codebase grew from over 1,000 lines in Java 7 to more than 6,000 lines today.

`ConcurrentHashMap` eliminated `Segment` segmented locking and uses `Node + CAS + synchronized` to guarantee concurrency safety. Its data structure is similar to `HashMap` 1.8—array + linked list / Red-Black Tree. Java 8 converts a linked list (lookup time complexity O(N)) into a Red-Black Tree (lookup time complexity O(log(N))) when the linked list length exceeds a certain threshold (8).

In Java 8, lock granularity is much finer: when updating a non-empty bucket, `synchronized` is typically used to lock the head node of that bucket; updates on different buckets can generally execute in parallel, and read operations do not acquire these bucket locks.

### ⭐️ How do the implementations of ConcurrentHashMap differ between JDK 1.7 and JDK 1.8?

- **Thread-safety implementation:** JDK 1.7 uses `Segment` segmented locks to guarantee safety, where `Segment` inherits from `ReentrantLock`. JDK 1.8 abandoned the `Segment` segmented lock design and uses `Node + CAS + synchronized` to guarantee thread safety with finer lock granularity—`synchronized` only locks the head node of the current linked list or Red-Black Tree.
- **Hash collision resolution:** JDK 1.7 uses separate chaining, while JDK 1.8 uses separate chaining combined with Red-Black Trees (when linked list length exceeds a threshold, the linked list is converted to a Red-Black Tree).
- **Concurrency level:** In JDK 1.7, concurrent updates were mainly limited by the number of `Segment`s, which defaults to 16. JDK 1.8 no longer uses a fixed number of `Segment`s, so updates on different buckets can usually execute in parallel.

### Why cannot keys and values in ConcurrentHashMap be null?

Keys and values in `ConcurrentHashMap` cannot be `null` mainly to avoid ambiguity. `null` is a special value indicating no object or no reference. If you used `null` as a key, you could not distinguish whether the key exists in `ConcurrentHashMap` or does not exist at all. Similarly, if you used `null` as a value, you could not distinguish whether that value is actually stored in `ConcurrentHashMap` or returned because the corresponding key was not found.

Take the `get` method as an example—returning `null` has two possible interpretations:

- The value is not in the collection;
- The value itself is `null`.

This is where the ambiguity comes from.

For details, refer to [ConcurrentHashMap Source Code Analysis](https://javaguide.cn/java/collection/concurrent-hash-map-source-code.html).

In a multi-threaded environment, while one thread is operating on `ConcurrentHashMap`, other threads may modify that `ConcurrentHashMap`, so you cannot use `containsKey(key)` to determine whether that key-value pair exists, and thus there is no way to resolve the ambiguity.

By contrast, `HashMap` can store `null` keys and values, though there can only be one `null` key while there can be multiple `null` values. If `null` is passed in as a key, it returns the value at the bucket whose hash value is 0. In a single-threaded environment, there is no case where other threads modify the `HashMap` while one thread is operating on it, so `containsKey(key)` can be used to check whether the key-value pair exists and handle it accordingly, avoiding any ambiguity.

In other words, in a multi-threaded setting it is impossible to accurately determine whether a key-value pair exists (since other threads may modify it), whereas in a single-threaded setting it is possible (since no other thread is modifying it).

If you truly need to represent `null` in `ConcurrentHashMap`, you can use a special static empty sentinel object in place of `null`:

```java
public static final Object NULL = new Object();
```

Finally, let's share what the author of `ConcurrentHashMap` himself (Doug Lea) answered on this question:

> The main reason that nulls aren't allowed in ConcurrentMaps (ConcurrentHashMaps, ConcurrentSkipListMaps) is that ambiguities that may be just barely tolerable in non-concurrent maps can't be accommodated. The main one is that if `map.get(key)` returns `null`, you can't detect whether the key explicitly maps to `null` vs the key isn't mapped. In a non-concurrent map, you can check this via `map.contains(key)`, but in a concurrent one, the map might have changed between calls.

In essence, his meaning is still that ambiguity can be tolerated in a single-threaded environment, whereas it cannot be tolerated in a multi-threaded environment.

### ⭐️ Can ConcurrentHashMap guarantee the atomicity of compound operations?

`ConcurrentHashMap` is thread-safe, meaning it guarantees that when multiple threads perform read and write operations on it concurrently, data inconsistency will not occur, nor will it suffer from the infinite loop issue seen in JDK 1.7 and earlier `HashMap` under multi-threading. However, this does NOT mean it guarantees that all compound operations are atomic—make sure not to confuse the two!

A compound operation refers to an operation composed of multiple basic operations (such as `put`, `get`, `remove`, `containsKey`, etc.)—for example, first checking whether a key exists via `containsKey(key)`, and then inserting or updating via `put(key, value)` based on the result. Such an operation may be interleaved by other threads during execution, leading to unexpected results.

For example, suppose two threads A and B concurrently perform compound operations on a `ConcurrentHashMap` as follows:

```java
// Thread A
if (!map.containsKey(key)) {
map.put(key, value);
}
// Thread B
if (!map.containsKey(key)) {
map.put(key, anotherValue);
}
```

If the execution order of threads A and B is as follows:

1. Thread A checks that `key` does not exist in `map`
2. Thread B checks that `key` does not exist in `map`
3. Thread B inserts `(key, anotherValue)` into `map`
4. Thread A inserts `(key, value)` into `map`

Then the final result is `(key, value)` instead of the expected `(key, anotherValue)`. This is the problem caused by the non-atomicity of compound operations.

**So how do we guarantee the atomicity of compound operations in `ConcurrentHashMap`?**

`ConcurrentHashMap` provides several atomic compound operations, such as `putIfAbsent`, `compute`, `computeIfAbsent`, `computeIfPresent`, and `merge`. These methods can take a function as an argument to compute a new value based on the given key and value and update it into the map.

The code above can be rewritten as:

```java
// Thread A
map.putIfAbsent(key, value);
// Thread B
map.putIfAbsent(key, anotherValue);
```

Or:

```java
// Thread A
map.computeIfAbsent(key, k -> value);
// Thread B
map.computeIfAbsent(key, k -> anotherValue);
```

Many learners might say: can't we also use explicit locking for synchronization in this case? Indeed you can, but using explicit locking defeats the purpose of using `ConcurrentHashMap`. When using `ConcurrentHashMap`, try to use these atomic compound operation methods to guarantee atomicity.

## Collections Utility Class (Less Important)

**Common methods in the `Collections` utility class:**

- Sorting
- Searching and replacing operations
- Synchronization control (not recommended; when thread-safe collection types are needed, consider using concurrent collections in the JUC package)

### Sorting Operations

```java
void reverse(List list)// Reverse the list
void shuffle(List list)// Randomize order (shuffle)
void sort(List list)// Sort in ascending order according to natural ordering
void sort(List list, Comparator c)// Custom sorting; sorting logic is controlled by Comparator
void swap(List list, int i , int j)// Swap elements at two index positions
void rotate(List list, int distance)// Rotate: when distance is positive, move the last distance elements of list to the front; when distance is negative, move the first distance elements of list to the back
```

### Searching and Replacing Operations

```java
int binarySearch(List list, Object key)// Perform binary search on List and return index; note that List must be sorted
int max(Collection coll)// Return the maximum element according to natural ordering; similarly int min(Collection coll)
int max(Collection coll, Comparator c)// Return the maximum element according to custom Comparator ordering; similarly int min(Collection coll, Comparator c)
void fill(List list, Object obj)// Replace all elements in the specified list with the specified element
int frequency(Collection c, Object o)// Count the number of occurrences of an element
int indexOfSubList(List list, List target)// Find the index of the first occurrence of target in list, returning -1 if not found; similarly int lastIndexOfSubList(List source, list target)
boolean replaceAll(List list, Object oldVal, Object newVal)// Replace old elements with new elements
```

### Synchronization Control

`Collections` provides several `synchronizedXxx()` methods that wrap a given collection into a thread-synchronized collection, thereby solving thread-safety issues during concurrent multi-threaded access to collections.

All access should go through the returned wrapper; when traversing with an `Iterator`, `Spliterator`, or `Stream`, you must also manually synchronize on that wrapper.

We know that `HashSet`, `TreeSet`, `ArrayList`, `LinkedList`, `HashMap`, and `TreeMap` are all not thread-safe. `Collections` provides static methods to wrap them into thread-synchronized collections.

**It is best not to use the methods below as their efficiency is very low; when thread-safe collection types are needed, consider using concurrent collections from the JUC package.**

The methods are as follows:

```java
synchronizedCollection(Collection<T>  c) // Return a synchronized (thread-safe) collection backed by the specified collection.
synchronizedList(List<T> list)// Return a synchronized (thread-safe) List backed by the specified list.
synchronizedMap(Map<K,V> m) // Return a synchronized (thread-safe) Map backed by the specified map.
synchronizedSet(Set<T> s) // Return a synchronized (thread-safe) Set backed by the specified set.
```
