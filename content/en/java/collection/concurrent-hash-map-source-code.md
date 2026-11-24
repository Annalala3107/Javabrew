---
title: ConcurrentHashMap Source Code Analysis
description: "In-depth analysis of ConcurrentHashMap source code: comparing JDK 1.7 Segment lock with JDK 1.8 CAS + Synchronized implementation to understand thread-safety mechanisms and performance optimizations in high-concurrency Maps."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/concurrent-hash-map-source-code.md
head:
  - - meta
    - name: keywords
      content: ConcurrentHashMap source code,thread-safe Map,Segment lock,CAS operation,concurrent container,JDK 7 vs JDK 8
---

> This article was contributed by Modu Code: <https://mp.weixin.qq.com/s/AHWzboztt53ZfFZmsSnMSw>. JavaGuide has made extensive improvements and optimizations to the original text.

The previous article introduced the `HashMap` source code, which received a great response with many readers sharing their thoughts. This time we are back with `ConcurrentHashMap`. As a thread-safe `HashMap`, it is also very frequently used. So what do its storage structure and implementation principles look like?

## 1. ConcurrentHashMap 1.7

### 1. Storage Structure

![Java 7 ConcurrentHashMap Storage Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java7_concurrenthashmap-7779115b.png)

The storage structure of `ConcurrentHashMap` in Java 7 is shown in the figure above. `ConcurrentHashMap` is composed of multiple `Segment`s, and each `Segment` is a structure similar to `HashMap`, so each internal `HashMap` can perform resizing independently. However, once initialized, the number of `Segment`s **cannot be changed**. By default, there are 16 `Segment`s, which means at most 16 segments can perform update operations concurrently by default.

### 2. Initialization

Let's explore the initialization flow of `ConcurrentHashMap` starting from its no-argument constructor.

```java
    /**
     * Creates a new, empty map with a default initial capacity (16),
     * load factor (0.75) and concurrencyLevel (16).
     */
    public ConcurrentHashMap() {
        this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR, DEFAULT_CONCURRENCY_LEVEL);
    }
```

The no-argument constructor calls the parameterized constructor, passing default values for the three parameters. Their values are:

```java
    /**
     * Default initial capacity
     */
    static final int DEFAULT_INITIAL_CAPACITY = 16;

    /**
     * Default load factor
     */
    static final float DEFAULT_LOAD_FACTOR = 0.75f;

    /**
     * Default concurrency level
     */
    static final int DEFAULT_CONCURRENCY_LEVEL = 16;
```

Next, let's examine the internal implementation logic of this parameterized constructor.

```java
@SuppressWarnings("unchecked")
public ConcurrentHashMap(int initialCapacity,float loadFactor, int concurrencyLevel) {
    // Parameter validation
    if (!(loadFactor > 0) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();
    // Validate concurrencyLevel; if greater than 1<<16, reset to 65536
    if (concurrencyLevel > MAX_SEGMENTS)
        concurrencyLevel = MAX_SEGMENTS;
    // Find power-of-two sizes best matching arguments
    // Power exponent of 2
    int sshift = 0;
    int ssize = 1;
    // This loop finds the nearest power of 2 >= concurrencyLevel
    while (ssize < concurrencyLevel) {
        ++sshift;
        ssize <<= 1;
    }
    // Record segment shift offset
    this.segmentShift = 32 - sshift;
    // Record segment mask
    this.segmentMask = ssize - 1;
    // Set capacity
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    // c = capacity / ssize, default 16 / 16 = 1; computes HashMap-like capacity per Segment
    int c = initialCapacity / ssize;
    if (c * ssize < initialCapacity)
        ++c;
    int cap = MIN_SEGMENT_TABLE_CAPACITY;
    // HashMap-like capacity inside a Segment is at least 2 or a power-of-2 multiple
    while (cap < c)
        cap <<= 1;
    // create segments and segments[0]
    // Create Segment array and initialize segments[0]
    Segment<K,V> s0 = new Segment<K,V>(loadFactor, (int)(cap * loadFactor),
                         (HashEntry<K,V>[])new HashEntry[cap]);
    Segment<K,V>[] ss = (Segment<K,V>[])new Segment[ssize];
    UNSAFE.putOrderedObject(ss, SBASE, s0); // ordered write of segments[0]
    this.segments = ss;
}
```

Let's summarize the initialization logic of `ConcurrentHashMap` in Java 7:

1. Validate required parameters.
2. Check `concurrencyLevel`; if it exceeds the maximum value, reset it to the maximum value. In the no-argument constructor, **the default value is 16.**
3. Find the nearest **power of 2** greater than or equal to `concurrencyLevel` as the length of the `segments` array; **the default is 16**.
4. Record the `segmentShift` offset, which equals **32 - sshift** (used later during `put` to compute the segment index); the default is 28.
5. Record `segmentMask`, which defaults to `ssize - 1 = 16 - 1 = 15`.
6. **Initialize `segments[0]`**, with **default size 2**, **load factor 0.75**, and **resize threshold `2\*0.75=1.5`**—meaning resizing only happens when inserting the second element.

### 3. put

Continuing from the initialization parameters above, let's inspect the `put` method source code.

```java
/**
 * Maps the specified key to the specified value in this table.
 * Neither the key nor the value can be null.
 *
 * <p> The value can be retrieved by calling the <tt>get</tt> method
 * with a key that is equal to the original key.
 *
 * @param key key with which the specified value is to be associated
 * @param value value to be associated with the specified key
 * @return the previous value associated with <tt>key</tt>, or
 *         <tt>null</tt> if there was no mapping for <tt>key</tt>
 * @throws NullPointerException if the specified key or value is null
 */
public V put(K key, V value) {
    Segment<K,V> s;
    if (value == null)
        throw new NullPointerException();
    int hash = hash(key);
    // Unsigned right-shift hash by 28 bits (from init), then AND with segmentMask=15
    // Essentially ANDing the upper 4 bits with segmentMask (1111)
    int j = (hash >>> segmentShift) & segmentMask;
    if ((s = (Segment<K,V>)UNSAFE.getObject          // nonvolatile; recheck
         (segments, (j << SSHIFT) + SBASE)) == null) //  in ensureSegment
        // Initialize the Segment if it is null
        s = ensureSegment(j);
    return s.put(key, hash, value, false);
}

/**
 * Returns the segment for the given index, creating it and
 * recording in segment table (via CAS) if not already present.
 *
 * @param k the index
 * @return the segment
 */
@SuppressWarnings("unchecked")
private Segment<K,V> ensureSegment(int k) {
    final Segment<K,V>[] ss = this.segments;
    long u = (k << SSHIFT) + SBASE; // raw offset
    Segment<K,V> seg;
    // Check if the Segment at offset u is null
    if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) {
        Segment<K,V> proto = ss[0]; // use segment 0 as prototype
        // Get initial HashEntry<K,V> array length from segment 0
        int cap = proto.table.length;
        // Get loadFactor from segment 0's hash table (same across all segments)
        float lf = proto.loadFactor;
        // Calculate resize threshold
        int threshold = (int)(cap * lf);
        // Create a HashEntry array of capacity cap
        HashEntry<K,V>[] tab = (HashEntry<K,V>[])new HashEntry[cap];
        if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) { // recheck
            // Recheck whether Segment at offset u is null, as another thread might have initialized it
            Segment<K,V> s = new Segment<K,V>(lf, threshold, tab);
            // Spin-check whether Segment at offset u is null
            while ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
                   == null) {
                // Assign via CAS; succeeds only once
                if (UNSAFE.compareAndSwapObject(ss, u, null, seg = s))
                    break;
            }
        }
    }
    return seg;
}
```

The source code above illustrates the handling flow when `ConcurrentHashMap` puts an entry. Let's walk through the specific steps:

1. Compute the position of the key to be put and obtain the `Segment` at that position.

2. If the `Segment` at that position is `null`, initialize this `Segment`.

   **Flow for initializing a `Segment`:**

   1. Check whether the `Segment` at the computed position is `null`.
   2. If `null`, continue initialization by creating a `HashEntry` array using the capacity and load factor of `Segment[0]`.
   3. Recheck whether the `Segment` at the computed position is `null`.
   4. Initialize this `Segment` using the newly created `HashEntry` array.
   5. Spin-check whether the `Segment` at the computed position is `null`, and assign it as the `Segment` via CAS.

3. Call `Segment.put` to insert the key and value.

Above, we examined how a `Segment` is retrieved and initialized. We haven't looked at `Segment`'s `put` method on the last line yet—let's analyze it next.

```java
final V put(K key, int hash, V value, boolean onlyIfAbsent) {
    // Acquire ReentrantLock exclusive lock; if failed, acquire via scanAndLockForPut
    HashEntry<K,V> node = tryLock() ? null : scanAndLockForPut(key, hash, value);
    V oldValue;
    try {
        HashEntry<K,V>[] tab = table;
        // Calculate the target index for put
        int index = (tab.length - 1) & hash;
        // Get the HashEntry at index via CAS/volatile read
        HashEntry<K,V> first = entryAt(tab, index);
        for (HashEntry<K,V> e = first;;) {
            if (e != null) {
                // Check if key already exists; traverse list and replace value if found
                K k;
                if ((k = e.key) == key ||
                    (e.hash == hash && key.equals(k))) {
                    oldValue = e.value;
                    if (!onlyIfAbsent) {
                        e.value = value;
                        ++modCount;
                    }
                    break;
                }
                e = e.next;
            }
            else {
                // If first is non-null, a collision occurred at index; insert at list head
                if (node != null)
                    node.setNext(first);
                else
                    node = new HashEntry<K,V>(hash, key, value, first);
                int c = count + 1;
                // If count exceeds threshold and table length < MAXIMUM_CAPACITY, rehash
                if (c > threshold && tab.length < MAXIMUM_CAPACITY)
                    rehash(node);
                else
                    // Assign node at index (may be a single element or head of a linked list)
                    setEntryAt(tab, index, node);
                ++modCount;
                count = c;
                oldValue = null;
                break;
            }
        }
    } finally {
        unlock();
    }
    return oldValue;
}
```

Because `Segment` extends `ReentrantLock`, a `Segment` can conveniently acquire a lock internally, and the `put` flow takes advantage of this feature:

1. Call `tryLock()` to acquire the lock; if that fails, use **`scanAndLockForPut`** to keep trying to acquire the lock.

2. Calculate the `index` position where the data should be placed, and retrieve the `HashEntry` at that position.

3. Traverse and insert the new element. Why traverse? Because the retrieved `HashEntry` might be an empty slot (`null`) or an existing linked list, so the two cases must be handled differently:

   If **no `HashEntry` exists** at that position:

   1. If the current count exceeds the resize threshold and is below the maximum capacity, **perform resizing**.
   2. Otherwise, insert directly using head insertion.

   If **a `HashEntry` exists** at that position:

   1. Check whether the current linked list element's key and hash match the key and hash being put. If they match, replace the value.
   2. If they do not match, advance to the next node in the linked list until a matching key is found and its value is replaced, or the entire linked list has been traversed with no match found:
      1. If the current count exceeds the resize threshold and is below the maximum capacity, **perform resizing**.
      2. Otherwise, insert directly at the head of the linked list.

4. If an entry already existed at the target position, return the old value after replacing it; otherwise, return `null`.

In step 1 above, we haven't yet explained `scanAndLockForPut`. What this method does is continuously spin and call `tryLock()` to acquire the lock. Once the spin count exceeds a specified limit, it calls `lock()` to block until the lock is acquired. While spinning, it also opportunistically fetches the `HashEntry` at the hash position.

```java
private HashEntry<K,V> scanAndLockForPut(K key, int hash, V value) {
    HashEntry<K,V> first = entryForHash(this, hash);
    HashEntry<K,V> e = first;
    HashEntry<K,V> node = null;
    int retries = -1; // negative while locating node
    // Spin to acquire the lock
    while (!tryLock()) {
        HashEntry<K,V> f; // to recheck first below
        if (retries < 0) {
            if (e == null) {
                if (node == null) // speculatively create node
                    node = new HashEntry<K,V>(hash, key, value, null);
                retries = 0;
            }
            else if (key.equals(e.key))
                retries = 0;
            else
                e = e.next;
        }
        else if (++retries > MAX_SCAN_RETRIES) {
            // After reaching max spin retries, block until lock is acquired
            lock();
            break;
        }
        else if ((retries & 1) == 0 &&
                 (f = entryForHash(this, hash)) != first) {
            e = first = f; // re-traverse if entry changed
            retries = -1;
        }
    }
    return node;
}

```

### 4. Resizing (`rehash`)

`ConcurrentHashMap` always doubles its capacity when resizing. When elements from the old array are moved into the new array, each element's index either remains unchanged or becomes `index + oldSize`. The `node` passed as a parameter is inserted into its target position after resizing using linked-list **head insertion**.

```java
private void rehash(HashEntry<K,V> node) {
    HashEntry<K,V>[] oldTable = table;
    // Old capacity
    int oldCapacity = oldTable.length;
    // New capacity, doubled
    int newCapacity = oldCapacity << 1;
    // New resize threshold
    threshold = (int)(newCapacity * loadFactor);
    // Create new array
    HashEntry<K,V>[] newTable = (HashEntry<K,V>[]) new HashEntry[newCapacity];
    // New mask; e.g., default 2 doubles to 4, minus 1 is 3 (binary 11)
    int sizeMask = newCapacity - 1;
    for (int i = 0; i < oldCapacity ; i++) {
        // Traverse old array
        HashEntry<K,V> e = oldTable[i];
        if (e != null) {
            HashEntry<K,V> next = e.next;
            // Compute new index: either unchanged or old index + old capacity
            int idx = e.hash & sizeMask;
            if (next == null)   //  Single node on list
                // Not a linked list yet (single node), assign directly
                newTable[idx] = e;
            else { // Reuse consecutive sequence at same slot
                // It is a linked list
                HashEntry<K,V> lastRun = e;
                int lastIdx = idx;
                // New index can only be unchanged or old index + old capacity
                // After traversal, all nodes following lastRun share the same new index
                for (HashEntry<K,V> last = next; last != null; last = last.next) {
                    int k = last.hash & sizeMask;
                    if (k != lastIdx) {
                        lastIdx = k;
                        lastRun = last;
                    }
                }
                // Nodes after lastRun all map to the same index; assign sublist directly
                newTable[lastIdx] = lastRun;
                // Clone remaining nodes
                for (HashEntry<K,V> p = e; p != lastRun; p = p.next) {
                    // Traverse remaining nodes and head-insert at target index k
                    V v = p.value;
                    int h = p.hash;
                    int k = h & sizeMask;
                    HashEntry<K,V> n = newTable[k];
                    newTable[k] = new HashEntry<K,V>(h, p.key, v, n);
                }
            }
        }
    }
    // Head-insert the new node
    int nodeIndex = node.hash & sizeMask; // add the new node
    node.setNext(newTable[nodeIndex]);
    newTable[nodeIndex] = node;
    table = newTable;
}
```

Some readers may find the last two `for` loops puzzling. Here, the first `for` loop finds a node (`lastRun`) such that all subsequent `next` nodes after it map to the exact same new index, and then assigns that tail chain directly to the new slot as a linked list. The second `for` loop clones the remaining preceding nodes and inserts them at the head of their respective target slots. ~~This implementation may be based on probability statistics; readers who have studied this further are welcome to share their insights.~~

In the inner second `for` loop, `new HashEntry<K,V>(h, p.key, v, n)` is used to create a new `HashEntry` instead of reusing the existing node. That is because reusing the existing node would modify its `next` pointer, preventing any concurrently traversing threads (such as threads executing `get`) from continuing traversal properly. As stated in the source comment:

> The nodes they replace will be garbage collectable as soon as they are no longer referenced by any reader thread that may be in the midst of concurrently traversing table

And why use an extra `for` loop to find `lastRun`? It is actually to reduce the number of object allocations, as explained in the source comment:

> Statistically, at the default threshold, only about one-sixth of them need cloning when a table doubles.

### 5. get

By this point, `get` is very straightforward and only requires two steps:

1. Compute the storage position of the key.
2. Traverse the specified position to look up the `value` of the matching key.

```java
public V get(Object key) {
    Segment<K,V> s; // manually integrate access methods to reduce overhead
    HashEntry<K,V>[] tab;
    int h = hash(key);
    long u = (((h >>> segmentShift) & segmentMask) << SSHIFT) + SBASE;
    // Compute the key's storage position
    if ((s = (Segment<K,V>)UNSAFE.getObjectVolatile(segments, u)) != null &&
        (tab = s.table) != null) {
        for (HashEntry<K,V> e = (HashEntry<K,V>) UNSAFE.getObjectVolatile
                 (tab, ((long)(((tab.length - 1) & h)) << TSHIFT) + TBASE);
             e != null; e = e.next) {
            // Traverse the linked list to find the value for the matching key
            K k;
            if ((k = e.key) == key || (e.hash == h && key.equals(k)))
                return e.value;
        }
    }
    return null;
}
```

## 2. ConcurrentHashMap 1.8

Overall, `ConcurrentHashMap` underwent substantial changes in Java 8 compared to Java 7.

### 1. Storage Structure

![Java 8 ConcurrentHashMap Storage Structure (Image from javadoop)](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java8_concurrenthashmap-294aa9f0.png)

As shown, `ConcurrentHashMap` in Java 8 changed significantly compared to Java 7: instead of **Segment array + HashEntry array + linked list**, it uses a **Node array + linked list / Red-Black Tree**. When a colliding linked list reaches a certain length, it is converted into a Red-Black Tree.

### 2. Initialization: initTable

```java
/**
 * Initializes table, using the size recorded in sizeCtl.
 */
private final Node<K,V>[] initTable() {
    Node<K,V>[] tab; int sc;
    while ((tab = table) == null || tab.length == 0) {
        // If sizeCtl < 0, another thread won the CAS and is initializing
        if ((sc = sizeCtl) < 0)
            // Yield CPU execution
            Thread.yield(); // lost initialization race; just spin
        else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
            try {
                if ((tab = table) == null || tab.length == 0) {
                    int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                    @SuppressWarnings("unchecked")
                    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                    table = tab = nt;
                    sc = n - (n >>> 2);
                }
            } finally {
                sizeCtl = sc;
            }
            break;
        }
    }
    return tab;
}
```

From the source code, we can see that `ConcurrentHashMap` initialization is performed using **spinning and CAS** operations. Pay special attention to the variable `sizeCtl` (short for `sizeControl`), whose value determines the current initialization/resizing state:

1. `-1`: Indicates that initialization is in progress, so other threads must spin and wait.
2. `-N`: Indicates that the table is undergoing resizing; the upper 16 bits store the resize stamp, and the lower 16 bits minus 1 represent the number of threads currently assisting in resizing.
3. `0`: Indicates that the table has not yet been initialized; the default capacity will be used during initialization.
4. `>0`: Indicates the table's resize threshold once the table has been initialized (or the initial capacity before initialization).

### 3. put

Let's walk straight through the `put` source code.

```java
public V put(K key, V value) {
    return putVal(key, value, false);
}

/** Implementation for put and putIfAbsent */
final V putVal(K key, V value, boolean onlyIfAbsent) {
    // key and value cannot be null
    if (key == null || value == null) throw new NullPointerException();
    int hash = spread(key.hashCode());
    int binCount = 0;
    for (Node<K,V>[] tab = table;;) {
        // f = element at target bucket
        Node<K,V> f; int n, i, fh;// fh holds hash value of target element
        if (tab == null || (n = tab.length) == 0)
            // Bucket array is empty; initialize it (spin + CAS)
            tab = initTable();
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            // Bucket is empty; insert via CAS without locking, break if succeeded
            if (casTabAt(tab, i, null,new Node<K,V>(hash, key, value, null)))
                break;  // no lock when adding to empty bin
        }
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);
        else {
            V oldVal = null;
            // Lock bin head using synchronized before inserting node
            synchronized (f) {
                if (tabAt(tab, i) == f) {
                    // Linked list bin
                    if (fh >= 0) {
                        binCount = 1;
                        // Traverse to insert new node or overwrite existing node
                        for (Node<K,V> e = f;; ++binCount) {
                            K ek;
                            if (e.hash == hash &&
                                ((ek = e.key) == key ||
                                 (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent)
                                    e.val = value;
                                break;
                            }
                            Node<K,V> pred = e;
                            if ((e = e.next) == null) {
                                pred.next = new Node<K,V>(hash, key,
                                                          value, null);
                                break;
                            }
                        }
                    }
                    else if (f instanceof TreeBin) {
                        // Red-Black Tree bin
                        Node<K,V> p;
                        binCount = 2;
                        if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                       value)) != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent)
                                p.val = value;
                        }
                    }
                }
            }
            if (binCount != 0) {
                if (binCount >= TREEIFY_THRESHOLD)
                    treeifyBin(tab, i);
                if (oldVal != null)
                    return oldVal;
                break;
            }
        }
    }
    addCount(1L, binCount);
    return null;
}
```

1. Compute the hash code based on `key`.

2. Check whether initialization is needed.

3. If the `Node` at the current key's bucket position is `null`, data can be written directly at this slot. Attempt to write via CAS; if it fails, re-enter the loop and inspect the latest state.

4. If the node's hash at the current position equals `MOVED == -1`, resizing is in progress (so the thread helps transfer nodes).

5. If none of the above apply, acquire a `synchronized` lock on the bucket's head node to write the data.

6. If the node count reaches `TREEIFY_THRESHOLD`, run treeification (`treeifyBin`), which first checks whether the current array length is >= 64 before converting the linked list into a Red-Black Tree.

### 4. get

The `get` flow is fairly simple—let's go straight through the source code.

```java
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
    // Spread hash for the key's bucket position
    int h = spread(key.hashCode());
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (e = tabAt(tab, (n - 1) & h)) != null) {
        // If bucket exists and head node hash matches
        if ((eh = e.hash) == h) {
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                // Hash and key both match; return value directly
                return e.val;
        }
        else if (eh < 0)
            // Head hash < 0 means resizing (ForwardingNode) or Red-Black Tree; delegate to find
            return (p = e.find(h, key)) != null ? p.val : null;
        while ((e = e.next) != null) {
            // Linked list: traverse to look up
            if (e.hash == h &&
                ((ek = e.key) == key || (ek != null && key.equals(ek))))
                return e.val;
        }
    }
    return null;
}
```

Let's summarize the `get` process:

1. Compute the bucket position based on the hash value.
2. Look up the specified bucket; if the head node is the target entry, return its `value` directly.
3. If the head node's hash is less than 0, it indicates either ongoing resizing or a Red-Black Tree; look up via `find`.
4. If it is a linked list, traverse it to find the matching key.

### 5. size Counting

The `size()` method of `ConcurrentHashMap` retrieves the total number of elements currently in the Map. However, in high-concurrency scenarios, accurately and efficiently counting elements is a nontrivial technical challenge. Java 8 solves this using an ingenious segmented counting mechanism.

#### 5.1 Why Segmented Counting Is Needed

In a concurrent environment, when multiple threads execute `put` operations simultaneously, they all need to update the total element count. If a single shared counter variable were used, it would trigger severe contention—all threads competing for the right to modify the same variable—which would severely degrade performance.

To solve this problem, `ConcurrentHashMap` adopts a **hotspot-dispersion** design: instead of using a single counter, it distributes the count across multiple variables. Just like a bank opens multiple service windows to distribute customers rather than funneling everyone into one window, this greatly reduces contention.

#### 5.2 Design of baseCount and counterCells

`ConcurrentHashMap` internally maintains two key counting-related fields:

- **baseCount**: The base counter. When there is no contention, this variable is updated directly via CAS. You can think of it as the "main counter."
- **counterCells**: An array of counters. When multiple threads fail in contending for `baseCount`, they attempt to distribute their count increments across different slots of the `counterCells` array.
  - Each thread maps to a specific slot in the array based on its **Probe value** (essentially a hash code generated from the thread) and prioritizes accumulating into this "preferred cell."
  - **Note**: This cell is not strictly "thread-private." When hash collisions occur, multiple threads may still map to the same slot and update it concurrently.

**For example**: Suppose 10 threads add elements to the Map simultaneously. The first thread succeeds in updating `baseCount` via CAS, while the remaining 9 threads encounter contention when trying to update `baseCount`. They then switch to finding a slot in the `counterCells` array to accumulate their increments. These 9 threads may be spread across different array positions (e.g., Thread 2 at `counterCells[1]`, Thread 3 at `counterCells[2]`), dispersing contention from a single point across multiple points.

#### 5.3 How the Count Is Updated When Putting Elements

At the end of the `putVal` method, we can see a call to `addCount(1L, binCount)`, which is responsible for updating the element count.

The execution logic of `addCount` can be broadly summarized as follows:

1. **Prioritize updating `baseCount`**

   - If `counterCells` has not yet been enabled (`counterCells == null`), the thread first tries to update `baseCount` directly via CAS.
   - If the CAS succeeds, contention is low, so it returns right away.

2. **Switch to `counterCells` when contention occurs**

   - If updating `baseCount` via CAS fails (meaning other threads are competing) or `counterCells` already exists (meaning the system has already experienced contention earlier), the thread tries updating inside `counterCells`:
     - Map to a slot based on the thread's probe value;
     - Perform a CAS increment on the `CounterCell` in that slot.
   - If that slot is empty or the CAS still collides, the thread enters a "heavier" path called `fullAddCount`, which handles initializing slots, re-selecting slots, and so on.

3. **Dynamic initialization and resizing of `counterCells`**
   - When heavy contention is detected (for example, CAS on a cell also fails frequently), `fullAddCount`, protected by a lightweight spin lock `cellsBusy`, will:
     - Initialize a small array (e.g., length 2) if `counterCells` has not been initialized yet;
     - Double its size if it already exists and has not reached its upper limit (usually capped at the number of CPU cores), adding more counter slots to further disperse competing threads.

This design guarantees a very short path using simple `baseCount` under low concurrency, while automatically switching to segmented counting under high concurrency—amortizing contention through `counterCells` and resizing—to balance both performance and accuracy.

#### 5.4 How sumCount Calculates the Total Element Count

When we call `size()`, it ultimately invokes `sumCount()` to compute the total element count. The logic of `sumCount()` is very simple and direct:

1. Read the value of `baseCount` as the base total.
2. Traverse the `counterCells` array and add the count values from all non-null slots onto the base total.
3. Return the accumulated sum.

**Note**:

- **Weak consistency**: `sumCount()` uses **no locks** throughout. If other threads insert data during the calculation, the returned result is only an **approximate value**. However, in high-concurrency scenarios, pursuing an "exact instantaneous count" is prohibitively expensive and meaningless; an approximate value is generally sufficient.
- **Integer overflow**: The `size()` method returns an `int`. If the number of elements exceeds `Integer.MAX_VALUE`, it simply returns `Integer.MAX_VALUE`. The **`mappingCount()`** method introduced in Java 8 returns a `long`, making it suitable for representing larger counts, though during concurrent updates it still returns an estimate.

## 3. Summary

In Java 7, `ConcurrentHashMap` uses segmented locking—meaning only one thread at a time can operate on each `Segment`. Each `Segment` is a `HashMap`-like array structure that can resize, and collisions within it form linked lists. However, once initialized, the number of `Segment`s cannot be changed.

In Java 8, `ConcurrentHashMap` uses `Synchronized` locks combined with CAS. Its underlying structure evolved from Java 7's **`Segment` array + `HashEntry` array + linked list** into a **Node array + linked list / Red-Black Tree**, where `Node` is a structure similar to `HashEntry`. When collisions reach a certain threshold (`TREEIFY_THRESHOLD = 8`), the linked list is converted into a Red-Black Tree; when collisions drop below a threshold (`UNTREEIFY_THRESHOLD = 6`), it reverts back to a linked list.

Some readers may wonder about the performance of `Synchronized`. In fact, ever since `Synchronized` introduced lock escalation strategies, its performance is no longer a bottleneck—interested readers can look further into **lock escalation** in `Synchronized`.
