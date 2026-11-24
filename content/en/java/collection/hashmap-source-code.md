---
title: HashMap Source Code Analysis
description: "In-depth HashMap source code analysis: detailed explanation of structural differences between JDK 1.7 and 1.8, the hash perturbation function, 0.75 load factor, resize/rehash mechanism, linked list to Red-Black Tree conversion thresholds, and other core HashMap principles."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/hashmap-source-code.md
head:
  - - meta
    - name: keywords
      content: HashMap Source Code,Hash Table,Red-Black Tree,Linked List,Perturbation Function,Load Factor,HashMap Resize,Hash Collision,JDK 1.8 Optimization
---


> Thanks to [changfubai](https://github.com/changfubai) for contributing improvements to this article!

## Introduction to HashMap

`HashMap` is primarily used to store key-value pairs. It is a `Map` interface implementation based on a hash table, one of the most commonly used Java collections, and is **not** thread-safe.

`HashMap` can store `null` keys and `null` values, though there can be at most one `null` key, while there can be multiple `null` values.

Before JDK 1.8, `HashMap` consisted of an array + linked lists: the array served as the main body of `HashMap`, while linked lists existed mainly to resolve hash collisions ("separate chaining"). In JDK 1.8 and later, `HashMap` introduced a major change in how hash collisions are handled: when a linked list's length reaches or exceeds a threshold (default `8`)—before converting to a Red-Black Tree, it checks whether the current array length is less than `64`; if so, it chooses to resize the array first instead of converting to a Red-Black Tree—it converts the linked list into a Red-Black Tree to reduce search time.

`HashMap` has a default initial capacity of `16`. On each subsequent expansion, the capacity doubles (`2x`). Furthermore, `HashMap` always uses a power of 2 as the size of its hash table.

## Underlying Data Structure Analysis

### Before JDK 1.8

Before JDK 1.8, `HashMap` used an **array combined with linked lists** under the hood—that is, **linked-list hashing (separate chaining)**.

`HashMap` computes a hash value by passing the key's `hashCode` through a perturbation function, and then determines the element's storage index via `(n - 1) & hash` (where `n` is the length of the array). If an element already exists at that index, it checks whether the existing element's hash value and key match the element being inserted; if they match, the value is overwritten directly, and if not, the collision is resolved via separate chaining.

The so-called perturbation function refers to `HashMap`'s `hash` method. Using the `hash` method (perturbation function) prevents poorly implemented `hashCode()` methods from causing excessive collisions—in other words, applying the perturbation function reduces hash collisions.

**JDK 1.8 `HashMap` `hash` method source code:**

Compared with JDK 1.7, JDK 1.8's `hash` method is much simpler, while keeping the same principle.

```java
    static final int hash(Object key) {
      int h;
      // key.hashCode(): returns the hash code
      // ^: bitwise XOR
      // >>>: unsigned right shift, ignoring the sign bit and padding vacated bits with 0
      return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
  }
```

Compare this with the JDK 1.7 `HashMap` `hash` method source code:

```java
static int hash(int h) {
    // This function ensures that hashCodes that differ only by
    // constant multiples at each bit position have a bounded
    // number of collisions (approximately 8 at default load factor).

    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
```

Compared with JDK 1.8's `hash` method, JDK 1.7's `hash` method has slightly lower performance because it performs 4 bit-perturbation shifts.

**"Separate chaining"** means combining linked lists with an array: creating an array of linked lists, where each slot in the array holds a linked list. Whenever a hash collision occurs, the colliding entry is simply added to that linked list.

![Internal structure of HashMap before JDK 1.8](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.7_hashmap-6222a2fe.png)

### JDK 1.8 and Later

Compared with earlier versions, JDK 1.8 and later introduced a major change in resolving hash collisions.

When the linked list length exceeds the threshold (default `8`), `treeifyBin()` is called first. This method decides whether to convert to a Red-Black Tree based on the `HashMap` array size. Only when the array length is greater than or equal to `64` will it perform the conversion to a Red-Black Tree to reduce search time; otherwise, it simply invokes `resize()` to expand the array. We won't paste all of that source code here—just focus on `treeifyBin()`!

![Internal structure of HashMap in JDK 1.8 and later](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/jdk1.8_hashmap-9d03cb2d.png)

**Class Fields:**

```java
public class HashMap<K,V> extends AbstractMap<K,V> implements Map<K,V>, Cloneable, Serializable {
    // Serial version UID
    private static final long serialVersionUID = 362498820763181265L;
    // Default initial capacity is 16
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;
    // Maximum capacity
    static final int MAXIMUM_CAPACITY = 1 << 30;
    // Default load factor
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // When the number of nodes in a bucket >= this value, convert to a Red-Black Tree
    static final int TREEIFY_THRESHOLD = 8;
    // When the number of nodes in a bucket <= this value, untreeify back to a linked list
    static final int UNTREEIFY_THRESHOLD = 6;
    // Minimum table capacity required to treeify buckets into Red-Black Trees
    static final int MIN_TREEIFY_CAPACITY = 64;
    // Array storing elements, always a power of 2
    transient Node<k,v>[] table;
    // Set view containing all key-value mappings
    transient Set<map.entry<k,v>> entrySet;
    // Number of stored key-value pairs; note this does not equal the array length
    transient int size;
    // Counter for each resize and structural modification of the map
    transient int modCount;
    // Threshold (capacity * load factor); resize occurs when actual size exceeds threshold
    int threshold;
    // Load factor
    final float loadFactor;
}
```

- **loadFactor (Load Factor)**

  `loadFactor` controls how densely entries are stored in the array. The closer `loadFactor` is to 1, the more entries are stored in the array and the denser it becomes, which increases linked list lengths; the smaller `loadFactor` is (closer to 0), the fewer entries are stored in the array and the sparser it becomes.

  **A `loadFactor` that is too large lowers lookup efficiency, while one that is too small wastes array space because stored data is too sparse. The default `loadFactor` of `0.75f` is a well-balanced threshold chosen by the JDK authors.**

  With a default capacity of 16 and a load factor of 0.75, as entries are continuously inserted into the `Map`, once the count exceeds `16 * 0.75 = 12`, the current capacity of 16 must be expanded. Because resizing requires creating a new array and migrating nodes, it is very expensive in performance.

- **threshold**

  **threshold = capacity \* loadFactor**. When `size > threshold`, the array needs to be expanded; in other words, `threshold` serves as **the criterion for determining whether the array needs resizing**.

**Node Class Source Code:**

```java
// Implements Map.Entry<K,V>
static class Node<K,V> implements Map.Entry<K,V> {
       final int hash;// Hash value, used to compare against other elements' hash values when storing in HashMap
       final K key;// Key
       V value;// Value
       // Pointer to the next node
       Node<K,V> next;
       Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }
        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }
        // Override hashCode()
        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }
        // Override equals()
        public final boolean equals(Object o) {
            if (o == this)
                return true;
            if (o instanceof Map.Entry) {
                Map.Entry<?,?> e = (Map.Entry<?,?>)o;
                if (Objects.equals(key, e.getKey()) &&
                    Objects.equals(value, e.getValue()))
                    return true;
            }
            return false;
        }
}
```

**TreeNode Class Source Code:**

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
        TreeNode<K,V> parent;  // Parent node
        TreeNode<K,V> left;    // Left child
        TreeNode<K,V> right;   // Right child
        TreeNode<K,V> prev;    // needed to unlink next upon deletion
        boolean red;           // Node color flag
        TreeNode(int hash, K key, V val, Node<K,V> next) {
            super(hash, key, val, next);
        }
        // Return the root node
        final TreeNode<K,V> root() {
            for (TreeNode<K,V> r = this, p;;) {
                if ((p = r.parent) == null)
                    return r;
                r = p;
       }
```

## HashMap Source Code Analysis

### Constructors

`HashMap` provides four constructors, listed below:

```java
    // Default constructor
    public HashMap() {
        this.loadFactor = DEFAULT_LOAD_FACTOR; // all   other fields defaulted
     }

     // Constructor taking another Map
     public HashMap(Map<? extends K, ? extends V> m) {
         this.loadFactor = DEFAULT_LOAD_FACTOR;
         putMapEntries(m, false);// Analyzed below
     }

     // Constructor specifying initial capacity
     public HashMap(int initialCapacity) {
         this(initialCapacity, DEFAULT_LOAD_FACTOR);
     }

     // Constructor specifying initial capacity and load factor
     public HashMap(int initialCapacity, float loadFactor) {
         if (initialCapacity < 0)
             throw new IllegalArgumentException("Illegal initial capacity: " + initialCapacity);
         if (initialCapacity > MAXIMUM_CAPACITY)
             initialCapacity = MAXIMUM_CAPACITY;
         if (loadFactor <= 0 || Float.isNaN(loadFactor))
             throw new IllegalArgumentException("Illegal load factor: " + loadFactor);
         this.loadFactor = loadFactor;
         // Temporarily store initial capacity in threshold; assigned to newCap in resize() to initialize table
         this.threshold = tableSizeFor(initialCapacity);
     }
```

> Note carefully: the `initialCapacity` passed in is **not** the final array capacity. `HashMap` calls `tableSizeFor()` to **round it up to the smallest power of 2 greater than or equal to that value**, and temporarily stores it in the `threshold` field. The actual `table` array is only initialized to this size during the first `resize()`.
>
> For example: `initialCapacity = 9` -> `threshold = 16` -> final `table` length is `16`.

**`putMapEntries` Method:**

```java
final void putMapEntries(Map<? extends K, ? extends V> m, boolean evict) {
    int s = m.size();
    if (s > 0) {
        // Check whether table is initialized
        if (table == null) { // pre-size
            /*
             * Not yet initialized: s is the actual element count of m, ft=s/loadFactor => s=ft*loadFactor,
             * just like threshold = capacity * loadFactor mentioned earlier; ft is the minimum capacity needed to add s elements
             */
            float ft = ((float)s / loadFactor) + 1.0F;
            int t = ((ft < (float)MAXIMUM_CAPACITY) ?
                    (int)ft : MAXIMUM_CAPACITY);
            /*
             * Per the constructor, when table is uninitialized, threshold actually holds the initial capacity.
             * If the minimum capacity required for s elements exceeds threshold, expand it to the nearest power of 2 as initial capacity.
             * Note: this is not initializing the threshold itself.
             */
            if (t > threshold)
                threshold = tableSizeFor(t);
        }
        // Already initialized and m's size exceeds threshold: resize
        else if (s > threshold)
            resize();
        // Add all entries from m into HashMap; if table is uninitialized, putVal calls resize to initialize or expand
        for (Map.Entry<? extends K, ? extends V> e : m.entrySet()) {
            K key = e.getKey();
            V value = e.getValue();
            putVal(hash(key), key, value, false, evict);
        }
    }
}
```

### The `put` Method

`HashMap` only exposes `put` for inserting elements; `putVal` is an internal helper method called by `put` and is not exposed to callers.

**Analysis of how `putVal` inserts elements:**

1. If the targeted array slot has no element, insert directly.
2. If the targeted array slot already has an element, compare keys with the key to insert. If the keys match, overwrite the value directly; if not, check whether `p` is a `TreeNode`—if so, call `e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value)` to add it into the tree. Otherwise, traverse the linked list and insert at the tail.

![ ](/media/jg/ext/oss.javaguide.cn/javaguide/database/sql/put-cf8095b4.png)

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    // If table is uninitialized or length is 0, resize
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    // (n - 1) & hash determines the bucket; if bucket is empty, create a new node in the bucket (stored directly in the array)
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    // Bucket already has elements (handle hash collision)
    else {
        Node<K,V> e; K k;
        // Quickly check if the key of the first node table[i] matches the inserted key; if so, record p in e to replace the old value
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
        // Check if the node is a Red-Black Tree node
        else if (p instanceof TreeNode)
            // Insert into the tree
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        // Not a TreeNode, so it is a linked list node
        else {
            // Insert at the tail of the linked list
            for (int binCount = 0; ; ++binCount) {
                // Reached the tail of the linked list
                if ((e = p.next) == null) {
                    // Insert new node at the tail
                    p.next = newNode(hash, key, value, null);
                    // Node count reaches threshold (default 8); execute treeifyBin
                    // This method decides whether to convert to a Red-Black Tree based on the HashMap array size.
                    // Only when array length >= 64 is treeification performed to reduce search time; otherwise, it only resizes the array.
                    if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                        treeifyBin(tab, hash);
                    // Break out of loop
                    break;
                }
                // Check if the linked list node's key matches the inserted key
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    // Match found, break out of loop
                    break;
                // Advance p to traverse the bucket's linked list together with e = p.next above
                p = e;
            }
        }
        // Found a node in the bucket whose key and hash match the inserted element
        if (e != null) {
            // Save e's old value
            V oldValue = e.value;
            // onlyIfAbsent is false or old value is null
            if (!onlyIfAbsent || oldValue == null)
                // Replace old value with new value
                e.value = value;
            // Post-access callback
            afterNodeAccess(e);
            // Return old value
            return oldValue;
        }
    }
    // Structural modification
    ++modCount;
    // Resize if actual size exceeds threshold
    if (++size > threshold)
        resize();
    // Post-insertion callback
    afterNodeInsertion(evict);
    return null;
}
```

**Now let's compare with the JDK 1.7 `put` method code**

**Analysis of JDK 1.7 `put`:**

- ① If the targeted array slot has no element, insert directly.
- ② If the targeted array slot has an element, traverse the linked list starting from that element as head, comparing keys in sequence; if a key matches, overwrite directly, otherwise insert at the head (head insertion).

```java
public V put(K key, V value)
    if (table == EMPTY_TABLE) {
    inflateTable(threshold);
}
    if (key == null)
        return putForNullKey(value);
    int hash = hash(key);
    int i = indexFor(hash, table.length);
    for (Entry<K,V> e = table[i]; e != null; e = e.next) { // Traverse first
        Object k;
        if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue;
        }
    }

    modCount++;
    addEntry(hash, key, value, i);  // Then insert
    return null;
}
```

### The `get` Method

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}

final Node<K,V> getNode(int hash, Object key) {
    Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (first = tab[(n - 1) & hash]) != null) {
        // First element in the bucket matches
        if (first.hash == hash && // always check first node
            ((k = first.key) == key || (key != null && key.equals(k))))
            return first;
        // Bucket has more than one node
        if ((e = first.next) != null) {
            // Search in Red-Black Tree
            if (first instanceof TreeNode)
                return ((TreeNode<K,V>)first).getTreeNode(hash, key);
            // Search in linked list
            do {
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    return e;
            } while ((e = e.next) != null);
        }
    }
    return null;
}
```

### The `resize` Method

During resizing, `HashMap` traverses elements in the hash table and uses each node's existing `hash` value together with the old capacity to determine its position in the new array, which is very time-consuming. When writing programs, try to avoid resizing as much as possible. The `resize` method actually unifies `table` initialization and `table` expansion—at the lowest level, both assign a newly allocated array to `table`.

```java
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;
    if (oldCap > 0) {
        // If capacity already exceeds maximum, stop expanding and let collisions occur
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        // Within maximum capacity, double the capacity (2x)
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY && oldCap >= DEFAULT_INITIAL_CAPACITY)
            newThr = oldThr << 1; // double threshold
    }
    else if (oldThr > 0) // initial capacity was placed in threshold
        // Initial capacity provided at creation was stored in threshold; use it directly as the new array capacity
        newCap = oldThr;
    else {
        // signifies using defaults; objects created by the no-arg constructor compute capacity and threshold here
        newCap = DEFAULT_INITIAL_CAPACITY;
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
    }
    if (newThr == 0) {
        // Initialize threshold when initial capacity or load factor was specified at creation,
    	// or compute the new resize threshold when oldCap < 16
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ? (int)ft : Integer.MAX_VALUE);
    }
    threshold = newThr;
    @SuppressWarnings({"rawtypes","unchecked"})
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    table = newTab;
    if (oldTab != null) {
        // Move each bucket into the new buckets array
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                if (e.next == null)
                    // Single node: directly compute its new index
                    newTab[e.hash & (newCap - 1)] = e;
                else if (e instanceof TreeNode)
                    // Split the Red-Black Tree into 2 subtrees; if a subtree has <= UNTREEIFY_THRESHOLD (default 6) nodes, convert it back to a linked list.
                    // If the subtree has > UNTREEIFY_THRESHOLD nodes, keep its tree structure.
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                else {
                    Node<K,V> loHead = null, loTail = null;
                    Node<K,V> hiHead = null, hiTail = null;
                    Node<K,V> next;
                    do {
                        next = e.next;
                        // Original index
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null)
                                loHead = e;
                            else
                                loTail.next = e;
                            loTail = e;
                        }
                        // Original index + oldCap
                        else {
                            if (hiTail == null)
                                hiHead = e;
                            else
                                hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);
                    // Place into bucket at original index
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    // Place into bucket at original index + oldCap
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

## Testing Common HashMap Methods

```java
package map;

import java.util.Collection;
import java.util.HashMap;
import java.util.Set;

public class HashMapDemo {

    public static void main(String[] args) {
        HashMap<String, String> map = new HashMap<String, String>();
        // Keys cannot be duplicated, values can be duplicated
        map.put("san", "张三");
        map.put("si", "李四");
        map.put("wu", "王五");
        map.put("wang", "老王");
        map.put("wang", "老王2");// 老王 is overwritten
        map.put("lao", "老王");
        System.out.println("-------直接输出hashmap:-------");
        System.out.println(map);
        /**
         * Traverse HashMap
         */
        // 1. Get all keys in the Map
        System.out.println("-------foreach获取Map中所有的键:------");
        Set<String> keys = map.keySet();
        for (String key : keys) {
            System.out.print(key+"  ");
        }
        System.out.println();// Newline
        // 2. Get all values in the Map
        System.out.println("-------foreach获取Map中所有的值:------");
        Collection<String> values = map.values();
        for (String value : values) {
            System.out.print(value+"  ");
        }
        System.out.println();// Newline
        // 3. Get both each key and its corresponding value
        System.out.println("-------得到key的值的同时得到key所对应的值:-------");
        Set<String> keys2 = map.keySet();
        for (String key : keys2) {
            System.out.print(key + "：" + map.get(key)+"   ");

        }
        /**
         * If you need to iterate over both keys and values, this approach is recommended,
         * because fetching keySet first and then calling map.get(key) traverses the map twice internally:
         * once when obtaining keySet, and once when iterating over all keys.
         */
        // When put(key, value) is called, key and value are first wrapped into a
        // static inner Entry object, and that Entry object is added to the array.
        // Therefore, to obtain all key-value pairs in the map, we simply get all Entry objects
        // from the array and call getKey() and getValue() on each Entry.
        Set<java.util.Map.Entry<String, String>> entrys = map.entrySet();
        for (java.util.Map.Entry<String, String> entry : entrys) {
            System.out.println(entry.getKey() + "--" + entry.getValue());
        }

        /**
         * Other common HashMap methods
         */
        System.out.println("after map.size()："+map.size());
        System.out.println("after map.isEmpty()："+map.isEmpty());
        System.out.println(map.remove("san"));
        System.out.println("after map.remove()："+map);
        System.out.println("after map.get(si)："+map.get("si"));
        System.out.println("after map.containsKey(si)："+map.containsKey("si"));
        System.out.println("after containsValue(李四)："+map.containsValue("李四"));
        System.out.println(map.replace("si", "李四2"));
        System.out.println("after map.replace(si, 李四2):"+map);
    }

}
```
