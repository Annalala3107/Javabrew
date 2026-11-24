---
title: ThreadLocal Explained in Detail
description: "In-depth analysis of ThreadLocal: explaining thread-local variable principles, ThreadLocalMap implementation mechanisms, weak references and memory leaks, use cases, and best practices."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/threadlocal.md
head:
  - - meta
    - name: keywords
      content: ThreadLocal,thread-local variables,ThreadLocalMap,memory leak,weak reference,ThreadLocal principles,thread isolation
---

> This article was contributed by Yizhihua Suanbusuan Langman (`一枝花算不算浪漫`). Original URL: [https://juejin.cn/post/6844904151567040519](https://juejin.cn/post/6844904151567040519).

### Preface

![](/media/jg/local/java/concurrent/images/thread-local/1-385ee6.png)

**This full article contains 10,000+ words and 31 diagrams. Creating it took considerable time and effort—original writing is not easy, so please follow and support the author. Thank you.**

For `ThreadLocal`, your first reaction might be that it is very simple—just a per-thread variable copy isolated for each thread. Here are a few questions worth thinking about:

- The key of `ThreadLocal` is a **weak reference**. When calling `ThreadLocal.get()` after **GC** occurs, does the key become **`null`**?
- What is the **data structure** of `ThreadLocalMap` in `ThreadLocal`?
- What is the **hash algorithm** of `ThreadLocalMap`?
- How are **hash collisions** resolved in `ThreadLocalMap`?
- What is the **resizing mechanism** of `ThreadLocalMap`?
- How does `ThreadLocalMap` **clean up stale keys**? What are the **probing cleanup** and **heuristic cleanup** flows?
- How does `ThreadLocalMap.set()` work under the hood?
- How does `ThreadLocalMap.get()` work under the hood?
- How is `ThreadLocal` used in real-world projects, and what pitfalls have you encountered?
- ……

Have you already mastered all of the questions above? This article will walk through these questions with diagrams and source code to dissect every detail of `ThreadLocal`.

### Table of Contents

**Note:** The source code in this article is based on `JDK 1.8`.

### `ThreadLocal` Code Demo

Let's first look at a usage example of `ThreadLocal`:

```java
public class ThreadLocalTest {
    private List<String> messages = Lists.newArrayList();

    public static final ThreadLocal<ThreadLocalTest> holder = ThreadLocal.withInitial(ThreadLocalTest::new);

    public static void add(String message) {
        holder.get().messages.add(message);
    }

    public static List<String> clear() {
        List<String> messages = holder.get().messages;
        holder.remove();

        System.out.println("size: " + holder.get().messages.size());
        return messages;
    }

    public static void main(String[] args) {
        ThreadLocalTest.add("一枝花算不算浪漫");
        System.out.println(holder.get().messages);
        ThreadLocalTest.clear();
    }
}
```

Output:

```java
[一枝花算不算浪漫]
size: 0
```

A `ThreadLocal` object provides thread-local variables: each `Thread` has its own **copy of the variable**, so multiple threads do not interfere with one another.

### Data Structure of `ThreadLocal`

![](/media/jg/local/java/concurrent/images/thread-local/2-ac0f33.png)

The `Thread` class has an instance variable `threadLocals` of type `ThreadLocal.ThreadLocalMap`, meaning every thread has its own `ThreadLocalMap`.

`ThreadLocalMap` has its own independent implementation. You can conceptually think of its `key` as `ThreadLocal` and its `value` as the value stored in code (in reality, the `key` is not `ThreadLocal` itself, but a **weak reference** to it).

When each thread puts a value into a `ThreadLocal`, it stores it in its own `ThreadLocalMap`; when reading, it also uses the `ThreadLocal` as the reference to look up the corresponding `key` in its own `map`, thereby achieving **thread isolation**.

`ThreadLocalMap` is somewhat similar in structure to `HashMap`, except that `HashMap` is implemented using **an array + linked lists**, whereas `ThreadLocalMap` does **not** have a **linked list** structure.

We should also pay attention to `Entry`: its `key` is `ThreadLocal<?> k` and it extends `WeakReference`, which is what we commonly refer to as a weak reference type.

### Is the Key `null` After GC?

Returning to the question at the beginning: the `key` of `ThreadLocal` is a weak reference, so when calling `ThreadLocal.get()` after `GC` happens, is `key` `null`?

To clarify this question, we first need to understand Java's **four reference types**:

- **Strong Reference**: Objects we normally instantiate with `new` are strongly referenced. As long as a strong reference exists, the garbage collector will never reclaim the referenced object, even when memory is insufficient.
- **Soft Reference**: Objects wrapped with `SoftReference` are soft references. Objects pointed to by soft references are reclaimed when memory is about to overflow (`OutOfMemoryError`).
- **Weak Reference**: An object referenced by `WeakReference` becomes weakly reachable if no strong or soft references to it remain; when the garbage collector decides to process such objects, it clears the corresponding weak references. A specific GC cycle does not guarantee immediate processing of all candidate objects.
- **Phantom Reference**: A phantom reference is the weakest reference type, defined in Java using `PhantomReference`. Its sole purpose is to receive notifications via a reference queue when an object is about to be reclaimed.

Next, let's look at the code below, where we use reflection to inspect the data inside `ThreadLocal` after `GC` (the following code is sourced from <https://blog.csdn.net/thewindkee/article/details/103726942> to demonstrate a GC reclamation scenario locally):

> `System.gc()` is only a suggestion to the JVM to perform garbage collection. The output below illustrates the underlying principle, but cannot be relied upon as guaranteed behavior on every run.

```java
public class ThreadLocalDemo {

    public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException, InterruptedException {
        Thread t = new Thread(()->test("abc",false));
        t.start();
        t.join();
        System.out.println("--gc后--");
        Thread t2 = new Thread(() -> test("def", true));
        t2.start();
        t2.join();
    }

    private static void test(String s,boolean isGC)  {
        try {
            new ThreadLocal<>().set(s);
            if (isGC) {
                System.gc();
            }
            Thread t = Thread.currentThread();
            Class<? extends Thread> clz = t.getClass();
            Field field = clz.getDeclaredField("threadLocals");
            field.setAccessible(true);
            Object ThreadLocalMap = field.get(t);
            Class<?> tlmClass = ThreadLocalMap.getClass();
            Field tableField = tlmClass.getDeclaredField("table");
            tableField.setAccessible(true);
            Object[] arr = (Object[]) tableField.get(ThreadLocalMap);
            for (Object o : arr) {
                if (o != null) {
                    Class<?> entryClass = o.getClass();
                    Field valueField = entryClass.getDeclaredField("value");
                    Field referenceField = entryClass.getSuperclass().getSuperclass().getDeclaredField("referent");
                    valueField.setAccessible(true);
                    referenceField.setAccessible(true);
                    System.out.println(String.format("弱引用key:%s,值:%s", referenceField.get(o), valueField.get(o)));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

The output is as follows:

```java
弱引用key:java.lang.ThreadLocal@433619b6,值:abc
弱引用key:java.lang.ThreadLocal@418a15e3,值:java.lang.ref.SoftReference@bf97a12
--gc后--
弱引用key:null,值:def
```

![](/media/jg/local/java/concurrent/images/thread-local/3-68a191.png)

As shown in the figure, because the `ThreadLocal` created here does not have anything pointing to it—meaning there are no references to it:

```java
new ThreadLocal<>().set(s);
```

In this example run, the garbage collector processed the `ThreadLocal` that only had a weak reference left, so we see `referent=null`. However, this depends on whether the JVM actually executes and completes the corresponding garbage collection. If we **modify the code slightly**:

![](/media/jg/local/java/concurrent/images/thread-local/4-e0f271.png)

When you first see this question without thinking too deeply—seeing **weak reference** and **garbage collection**—it is easy to assume the answer is `null`.

In fact, that is incorrect. Because the question states that `ThreadLocal.get()` is being called, that proves a **strong reference** still exists, so `key` is not `null`. As shown in the figure below, the **strong reference** to `ThreadLocal` still exists.

![](/media/jg/local/java/concurrent/images/thread-local/5-b548b8.png)

If no **strong reference** exists, the garbage collector can clear the `key` inside the weak reference. At that point, the `Entry` still holds a strong reference to `value`, until the stale entry is cleaned up by subsequent `ThreadLocalMap` operations, or until the owning thread terminates and the entire `ThreadLocalMap` becomes unreachable. In long-lived threads such as those in a thread pool, this retention period can be very long, which creates a memory leak risk.

### `ThreadLocal.set()` Method Source Code Explained

![](/media/jg/local/java/concurrent/images/thread-local/6-e82bfd.png)

The principle of the `set` method in `ThreadLocal` is shown in the figure above. It is very simple: it mainly checks whether `ThreadLocalMap` exists, and then uses the `set` method to handle the data.

The code is as follows:

```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}

void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

The main core logic still resides inside `ThreadLocalMap`. Keep reading step by step—a more detailed dissection follows below.

### `ThreadLocalMap` Hash Algorithm

Since it is a `Map` structure, `ThreadLocalMap` naturally also implements its own `hash` algorithm to resolve collisions in the hash table array.

```java
int i = key.threadLocalHashCode & (len-1);
```

The `hash` algorithm in `ThreadLocalMap` is very simple: here `i` is the array index corresponding to the current `key` in the hash table.

The most critical part here is the calculation of `threadLocalHashCode`. `ThreadLocal` has a constant `HASH_INCREMENT = 0x61c88647`:

```java
public class ThreadLocal<T> {
    private final int threadLocalHashCode = nextHashCode();

    private static AtomicInteger nextHashCode = new AtomicInteger();

    private static final int HASH_INCREMENT = 0x61c88647;

    private static int nextHashCode() {
        return nextHashCode.getAndAdd(HASH_INCREMENT);
    }

    static class ThreadLocalMap {
        ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
            table = new Entry[INITIAL_CAPACITY];
            int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);

            table[i] = new Entry(firstKey, firstValue);
            size = 1;
            setThreshold(INITIAL_CAPACITY);
        }
    }
}
```

Every time a `ThreadLocal` object is created, `ThreadLocal.nextHashCode` is incremented by `0x61c88647`.

This constant is not a Fibonacci number, but a 32-bit hash increment derived from the golden ratio. When successively created `ThreadLocal` instances use this increment to generate hash codes and take the lower bits against a power-of-two array length, the slot distribution is fairly uniform.

We can test this ourselves:

![](/media/jg/local/java/concurrent/images/thread-local/8-438265.png)

We can see that the generated hash codes are distributed fairly uniformly. If you are interested, you can look further into multiplicative hashing based on the golden ratio.

### `ThreadLocalMap` Hash Collisions

> **Note:** In all the example diagrams below, a **green block** `Entry` represents **valid data**, a **gray block** represents an `Entry` whose `key` is `null` and **has been garbage collected**, and a **white block** represents a `null` `Entry`.

Although `ThreadLocalMap` uses the **golden ratio constant** as a `hash` calculation factor—greatly reducing the probability of `Hash` collisions—collisions can still occur.

The way `HashMap` resolves collisions is by building a **linked list** structure at each array bucket: colliding entries are attached to the linked list, and if the linked list length exceeds a certain threshold, it is converted into a **Red-Black Tree**.

However, `ThreadLocalMap` has no linked list structure, so it cannot use `HashMap`'s collision resolution approach.

![](/media/jg/local/java/concurrent/images/thread-local/7-4f53bf.png)

As shown in the figure above, if we insert data with `value=27` and its `hash` calculation maps it to slot 4, but slot 4 already contains an `Entry`,

it will scan forward linearly until it finds a slot where `Entry` is `null`, and place the current element in that slot. Of course, other situations may occur during iteration—such as encountering a non-`null` `Entry` with a matching `key`, or an `Entry` whose `key` is `null`—each of which is handled differently, as explained in detail below.

The diagram also shows an `Entry` whose `key` is `null` (the **gray block at Entry=2**). Because the `key` is a **weak reference**, such entries can exist. During `set`, if a stale `Entry` whose `key` has expired is encountered, a round of **probing cleanup** is actually triggered, which we will explain later.

### `ThreadLocalMap.set()` Explained in Detail

#### Visual Walkthrough of `ThreadLocalMap.set()`

After covering `ThreadLocal`'s **hash algorithm**, let's see how `set` is implemented.

Setting data into `ThreadLocalMap` (**inserting** or **updating** data) falls into several cases. Let's illustrate each case with diagrams.

**Case 1:** The `Entry` at the slot computed by `hash` is empty:

![](/media/jg/local/java/concurrent/images/thread-local/9-5a4866.png)

Here, the data is placed directly into that slot.

**Case 2:** The slot is not empty, and its `key` matches the current `ThreadLocal` `key` obtained from `hash` calculation:

![](/media/jg/local/java/concurrent/images/thread-local/10-885243.png)

Here, the data at that slot is updated directly.

**Case 3:** The slot is not empty; while scanning forward, no stale `Entry` (`key == null`) is encountered before finding a slot where `Entry` is `null`:

![](/media/jg/local/java/concurrent/images/thread-local/11-14fd05.png)

It traverses the hash table array linearly forward: if it finds a slot where `Entry` is `null`, it places the data there; or if it encounters an entry with an **equal key** while scanning forward, it simply updates that entry.

**Case 4:** The slot is not empty; while scanning forward, a stale `Entry` (`key == null`) is encountered before finding a slot where `Entry` is `null`—as shown below, during forward traversal it encounters a slot at `index=7` whose `Entry` has `key=null`:

![](/media/jg/local/java/concurrent/images/thread-local/12-964696.png)

The `Entry` at hash table array index 7 has `key == null`, indicating that its `key` has already been garbage collected. At this point, the `replaceStaleEntry()` method is executed—meaning **the logic for replacing stale data**—starting from `index=7` to perform probing data cleanup.

It initializes the starting scan position for probing cleanup of stale entries: `slotToExpunge = staleSlot = 7`.

Starting from the current `staleSlot`, it iterates backward to search for other stale entries and updates the starting scan index `slotToExpunge`. The `for` loop iterates until it hits a slot where `Entry` is `null`.

If stale data is found, it continues iterating backward until it hits a slot where `Entry=null`. As shown in the figure below, **`slotToExpunge` is updated to 0**:

![](/media/jg/local/java/concurrent/images/thread-local/13-554973.png)

Starting from the current node (`index=7`), it iterates backward to check whether there are any stale `Entry` elements, updating `slotToExpunge` if found, and stops probing when it hits `null`. Using the diagram above as an example, `slotToExpunge` is updated to 0.

The purpose of iterating backward above is to update `slotToExpunge`, the starting index for probing cleanup of stale entries. We will explain this value further below—it is used to determine whether there are any stale elements before the current stale slot `staleSlot`.

Next, it starts iterating forward from `staleSlot` (`index=7`). **If an `Entry` with the same `key` is found:**

![](/media/jg/local/java/concurrent/images/thread-local/14-242683.png)

Starting from `staleSlot`, it searches forward for an `Entry` with an equal `key`. Once found, it updates the `Entry`'s value, swaps its position with `staleSlot` (where `staleSlot` holds the stale entry), updates the `Entry` data, and then begins cleaning up stale `Entry` elements, as shown below:

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/view-fbd8d7e9.png)

If no `Entry` with the same `key` is found while traversing forward:

![](/media/jg/local/java/concurrent/images/thread-local/15-1f6b38.png)

Starting from `staleSlot`, it searches forward for an `Entry` with an equal `key` until it reaches an `Entry` that is `null`. As shown in the figure above, there is no `Entry` with the same `key` in `table`.

A new `Entry` is created to replace the `table[staleSlot]` position:

![](/media/jg/local/java/concurrent/images/thread-local/16-bee02e.png)

After the replacement is complete, stale-element cleanup is also performed. Cleanup mainly relies on two methods: `expungeStaleEntry()` and `cleanSomeSlots()`, whose details will be covered later—please keep reading.

#### `ThreadLocalMap.set()` Source Code Explained

The diagrams above have already made the principle of `set()` very clear. Now let's look at the source code:

`java.lang.ThreadLocal`.`ThreadLocalMap.set()`:

```java
private void set(ThreadLocal<?> key, Object value) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1);

    for (Entry e = tab[i];
         e != null;
         e = tab[i = nextIndex(i, len)]) {
        ThreadLocal<?> k = e.get();

        if (k == key) {
            e.value = value;
            return;
        }

        if (k == null) {
            replaceStaleEntry(key, value, i);
            return;
        }
    }

    tab[i] = new Entry(key, value);
    int sz = ++size;
    if (!cleanSomeSlots(i, sz) && sz >= threshold)
        rehash();
}
```

Here, it computes the corresponding bucket position in the hash table from `key`, and then searches forward from that bucket to find a usable bucket.

```java
Entry[] tab = table;
int len = tab.length;
int i = key.threadLocalHashCode & (len-1);
```

Under what conditions can a bucket be used?

1. `k == key`: this is a replacement/update operation, so the bucket can be used.
2. A stale bucket (`k == null`) is encountered: replacement logic is executed to take over the stale bucket.
3. During the search, a bucket with `Entry == null` is encountered: it is used directly.

Next, it enters the `for` loop to scan forward. Let's first look at the implementations of `nextIndex()` and `prevIndex()`:

![](/media/jg/local/java/concurrent/images/thread-local/17-ec720c.png)

```java
private static int nextIndex(int i, int len) {
    return ((i + 1 < len) ? i + 1 : 0);
}

private static int prevIndex(int i, int len) {
    return ((i - 1 >= 0) ? i - 1 : len - 1);
}
```

Now let's trace the remaining logic in the `for` loop:

1. If the bucket corresponding to `key` has a `null` `Entry`, there is no collision at this slot in the hash table array; it skips the `for` loop and directly `set`s the data into that bucket.
2. If the bucket corresponding to `key` is not empty:
   - 2.1 If `k == key`, the current `set` operation is an update; it replaces the value and returns directly.
   - 2.2 If `k == null`, the `Entry` at the current bucket is stale data; it executes `replaceStaleEntry()` (a core method) and returns.
3. After the `for` loop exits, execution continues because a `null` `Entry` was encountered while iterating forward:
   - 3.1 Creates a new `Entry` object in the bucket where `Entry` is `null`.
   - 3.2 Executes `++size`.
4. Calls `cleanSomeSlots()` to perform a heuristic cleanup of stale `Entry` items whose `key` has expired in the hash table array:
   - 4.1 If cleanup fails to remove any entries and `size` reaches or exceeds the threshold (`2/3` of the array length), it calls `rehash()`.
   - 4.2 Inside `rehash()`, a round of probing cleanup is first executed to clear stale keys; if `size >= threshold - threshold / 4` after cleanup, actual resizing is triggered (resizing logic is explained later).

Next, let's focus on `replaceStaleEntry()`, which handles replacing stale entries. You can review **Case 4**'s diagram above alongside the code:

`java.lang.ThreadLocal.ThreadLocalMap.replaceStaleEntry()`:

```java
private void replaceStaleEntry(ThreadLocal<?> key, Object value,
                                       int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;
    Entry e;

    int slotToExpunge = staleSlot;
    for (int i = prevIndex(staleSlot, len);
         (e = tab[i]) != null;
         i = prevIndex(i, len))

        if (e.get() == null)
            slotToExpunge = i;

    for (int i = nextIndex(staleSlot, len);
         (e = tab[i]) != null;
         i = nextIndex(i, len)) {

        ThreadLocal<?> k = e.get();

        if (k == key) {
            e.value = value;

            tab[i] = tab[staleSlot];
            tab[staleSlot] = e;

            if (slotToExpunge == staleSlot)
                slotToExpunge = i;
            cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
            return;
        }

        if (k == null && slotToExpunge == staleSlot)
            slotToExpunge = i;
    }

    tab[staleSlot].value = null;
    tab[staleSlot] = new Entry(key, value);

    if (slotToExpunge != staleSlot)
        cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
}
```

`slotToExpunge` represents the starting index for probing cleanup of stale data, defaulting to the current `staleSlot`. Starting from the current `staleSlot`, it iterates backward to check whether there are stale entries; the `for` loop stops only when it hits a `null` `Entry`. If stale data is found while scanning backward, it updates the starting index for probing cleanup to `i`, i.e., `slotToExpunge = i`.

```java
for (int i = prevIndex(staleSlot, len);
     (e = tab[i]) != null;
     i = prevIndex(i, len)){

    if (e.get() == null){
        slotToExpunge = i;
    }
}
```

Next, it starts scanning forward from `staleSlot`, likewise terminating when it hits a bucket whose `Entry` is `null`.
If **`k == key` is encountered** during iteration, this is an update/replacement case: it sets the new value and swaps it with the current `staleSlot` position. If `slotToExpunge == staleSlot`, that means `replaceStaleEntry()` found no stale `Entry` when scanning backward initially, nor any stale `Entry` while scanning forward up to this point, so it sets the starting index for probing cleanup to the current loop index, i.e., `slotToExpunge = i`. Finally, it calls `cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);` to perform heuristic cleanup of stale data.

```java
if (k == key) {
    e.value = value;

    tab[i] = tab[staleSlot];
    tab[staleSlot] = e;

    if (slotToExpunge == staleSlot)
        slotToExpunge = i;

    cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
    return;
}
```

We will explain `cleanSomeSlots()` and `expungeStaleEntry()` in detail later. Both are cleanup methods: one performs heuristic cleanup of stale-`key` `Entry` elements (`Heuristically scan`), and the other performs probing cleanup of stale-`key` `Entry` elements.

**If `k != key`**, execution continues: `k == null` indicates that the currently visited `Entry` is stale, and `slotToExpunge == staleSlot` indicates that the initial backward scan did not find any stale `Entry`. If both conditions hold, `slotToExpunge` is updated to the current position (on the premise that no stale data was found while scanning preceding slots).

```java
if (k == null && slotToExpunge == staleSlot)
    slotToExpunge = i;
```

If no entry with `k == key` is found during forward iteration and a `null` `Entry` is reached, the loop finishes. This means it is an insertion case, so the new entry is placed into the slot corresponding to `table[staleSlot]`.

```java
tab[staleSlot].value = null;
tab[staleSlot] = new Entry(key, value);
```

Finally, if any other stale `slot` besides `staleSlot` was found, cleanup logic is triggered:

```java
if (slotToExpunge != staleSlot)
    cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
```

### `ThreadLocalMap` Probing Cleanup Flow for Stale Keys

Earlier we mentioned the two stale-`key` cleanup mechanisms in `ThreadLocalMap`: **probing cleanup** and **heuristic cleanup**.

Let's first talk about probing cleanup, namely the `expungeStaleEntry` method. It traverses the hash table array forward from the starting position to probe and clean up stale entries, setting stale `Entry` slots to `null`. When it encounters non-stale entries along the way, it rehashes and repositions them in the `table` array; if the computed target slot is already occupied, it places the non-stale entry in the nearest `Entry=null` bucket after that position, moving the rehashed `Entry` closer to its ideal bucket position. The logic works as follows:

![](/media/jg/local/java/concurrent/images/thread-local/18-186170.png)

As shown above, `set(27)` hashes to bucket `index=4`. Since bucket `index=4` is already occupied, it scans forward and finally places the entry at `index=7`. After some time, the `key` of the `Entry` at `index=5` becomes `null`.

![](/media/jg/local/java/concurrent/images/thread-local/19-c026f2.png)

If another entry is later `set` into the `map`, it triggers a **probing cleanup** operation.

As shown above, after executing **probing cleanup**, the entry at `index=5` is cleared. Continuing forward to the element at `index=7`, rehashing shows that its ideal position is `index=4`. Since `index=4` is already occupied, it searches forward for the nearest `Entry=null` node starting from `index=4` (which is `index=5`, just cleared by probing cleanup), and moves the data from `index=7` to `index=5`. This brings the bucket position closer to its ideal position `index=4`.

After a round of probing cleanup, entries with stale keys are cleared, and non-stale entries are rehashed and relocated closer in theory to `i = key.hashCode & (tab.len - 1)`. This optimization improves overall lookup performance across the hash table.

Next, let's examine the concrete flow of `expungeStaleEntry()`, walking through diagrams first and source code second:

![](/media/jg/local/java/concurrent/images/thread-local/20-b0b370.png)

Suppose we invoke `expungeStaleEntry(3)`. As shown above, we can see the state of `table` in `ThreadLocalMap`. Now the cleanup runs:

![](/media/jg/local/java/concurrent/images/thread-local/21-99a31f.png)

The first step clears the data at the current `staleSlot` position: the `Entry` at `index=3` becomes `null`. Then it continues probing forward:

![](/media/jg/local/java/concurrent/images/thread-local/22-997db4.png)

After executing the second step, the element at `index=4` is moved into the `index=3` slot.

It continues scanning forward: whenever it encounters a valid entry, it checks whether its position is offset from its ideal slot, and if so, recalculates its `slot` position so that valid entries stay as close as possible to (or directly in) their ideal positions.

![](/media/jg/local/java/concurrent/images/thread-local/23-404130.png)

When it hits an empty slot while scanning forward, probing terminates, completing one round of probing cleanup. Now let's look at the **implementation source code**:

```java
private int expungeStaleEntry(int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;

    tab[staleSlot].value = null;
    tab[staleSlot] = null;
    size--;

    Entry e;
    int i;
    for (i = nextIndex(staleSlot, len);
         (e = tab[i]) != null;
         i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();
        if (k == null) {
            e.value = null;
            tab[i] = null;
            size--;
        } else {
            int h = k.threadLocalHashCode & (len - 1);
            if (h != i) {
                tab[i] = null;

                while (tab[h] != null)
                    h = nextIndex(h, len);
                tab[h] = e;
            }
        }
    }
    return i;
}
```

Still using `staleSlot=3` as our example: first it clears the data in `tab[staleSlot]` and decrements `size--`.
Then it iterates forward from `staleSlot`. If it encounters stale data with `k == null`, it also clears that slot and decrements `size--`:

```java
ThreadLocal<?> k = e.get();

if (k == null) {
    e.value = null;
    tab[i] = null;
    size--;
}
```

If the `key` has not expired, it recalculates whether the `key`'s ideal index equals the current slot index. If not, a `hash` collision previously occurred; it clears the current slot and scans forward from the newly calculated ideal slot index to find the nearest available slot to store the `entry`:

```java
int h = k.threadLocalHashCode & (len - 1);
if (h != i) {
    tab[i] = null;

    while (tab[h] != null)
        h = nextIndex(h, len);

    tab[h] = e;
}
```

This handles valid entries that experienced `Hash` collisions. After re-probing, colliding `Entry` items end up closer to their ideal positions, resulting in higher lookup efficiency.

### `ThreadLocalMap` Resizing Mechanism

At the end of `ThreadLocalMap.set()`, if heuristic cleanup fails to remove any entries and the number of `Entry` elements in the hash table has reached the table's resizing threshold `(len*2/3)`, the `rehash()` logic is executed:

```java
if (!cleanSomeSlots(i, sz) && sz >= threshold)
    rehash();
```

Let's examine the concrete implementation of `rehash()`:

```java
private void rehash() {
    expungeStaleEntries();

    if (size >= threshold - threshold / 4)
        resize();
}

private void expungeStaleEntries() {
    Entry[] tab = table;
    int len = tab.length;
    for (int j = 0; j < len; j++) {
        Entry e = tab[j];
        if (e != null && e.get() == null)
            expungeStaleEntry(j);
    }
}
```

First, it performs a full probing cleanup starting from the beginning of `table`—the detailed cleanup flow was analyzed above. After cleanup, some `Entry` items with `key == null` may have been removed from `table`, so it then checks `size >= threshold - threshold / 4` (i.e., `size >= threshold * 3/4`) to decide whether to resize.

Remember that the threshold to enter `rehash()` above is `size >= threshold`. So when an interviewer asks tricky questions about the resizing mechanism of `ThreadLocalMap`, we must be sure to explain both steps clearly:

![](/media/jg/local/java/concurrent/images/thread-local/24-322f02.png)

Next, let's look at the `resize()` method itself. For ease of demonstration, we use `oldTab.len=8` as an example:

![](/media/jg/local/java/concurrent/images/thread-local/25-add7da.png)

The resized `tab` has capacity `oldLen * 2`. It iterates through the old hash table, recalculates each entry's `hash` index, and places it into the new `tab` array; if a `hash` collision occurs, it scans forward for the nearest slot with `entry == null`. Once traversal completes, all valid `entry` data from `oldTab` has been placed into the new `tab`, and the next resizing **threshold** for `tab` is recalculated. The concrete code is as follows:

```java
private void resize() {
    Entry[] oldTab = table;
    int oldLen = oldTab.length;
    int newLen = oldLen * 2;
    Entry[] newTab = new Entry[newLen];
    int count = 0;

    for (int j = 0; j < oldLen; ++j) {
        Entry e = oldTab[j];
        if (e != null) {
            ThreadLocal<?> k = e.get();
            if (k == null) {
                e.value = null;
            } else {
                int h = k.threadLocalHashCode & (newLen - 1);
                while (newTab[h] != null)
                    h = nextIndex(h, newLen);
                newTab[h] = e;
                count++;
            }
        }
    }

    setThreshold(newLen);
    size = count;
    table = newTab;
}
```

### `ThreadLocalMap.get()` Explained in Detail

Having covered the source code of `set()`—including inserting data, cleaning up data, and optimizing bucket positions—let's now examine how `get()` works.

#### Visual Walkthrough of `ThreadLocalMap.get()`

**Case 1:** The `slot` computed from `key` contains an `Entry` whose `Entry.key` matches the target `key`, so it is returned directly:

![](/media/jg/local/java/concurrent/images/thread-local/26-a9068e.png)

**Case 2:** The `Entry.key` at the `slot` does not match the target `key`:

![](/media/jg/local/java/concurrent/images/thread-local/27-5e85b6.png)

Taking `get(ThreadLocal1)` as an example: after `hash` calculation, the ideal `slot` position is 4, but `index=4` already contains data whose `key` is not equal to `ThreadLocal1`, so it must continue scanning forward.

When scanning reaches `index=5`, `Entry.key=null`, which triggers a probing cleanup (`expungeStaleEntry()`). After execution, the entries at `index 5` and `8` are reclaimed, while the entries at `index 6` and `7` shift earlier. Once `index 6` and `7` have shifted, iteration continues forward from `index=5`, finding the `Entry` with the matching `key` at `index=6`, as shown below:

![](/media/jg/local/java/concurrent/images/thread-local/28-03351d.png)

#### `ThreadLocalMap.get()` Source Code Explained

`java.lang.ThreadLocal.ThreadLocalMap.getEntry()`:

```java
private Entry getEntry(ThreadLocal<?> key) {
    int i = key.threadLocalHashCode & (table.length - 1);
    Entry e = table[i];
    if (e != null && e.get() == key)
        return e;
    else
        return getEntryAfterMiss(key, i, e);
}

private Entry getEntryAfterMiss(ThreadLocal<?> key, int i, Entry e) {
    Entry[] tab = table;
    int len = tab.length;

    while (e != null) {
        ThreadLocal<?> k = e.get();
        if (k == key)
            return e;
        if (k == null)
            expungeStaleEntry(i);
        else
            i = nextIndex(i, len);
        e = tab[i];
    }
    return null;
}
```

### `ThreadLocalMap` Heuristic Cleanup Flow for Stale Keys

We have mentioned the two ways `ThreadLocalMap` cleans up stale keys several times: **probing cleanup (`expungeStaleEntry()`)** and **heuristic cleanup (`cleanSomeSlots()`)**.

Probing cleanup starts from the current `Entry` and cleans forward until it hits `null`, which is a **linear probing cleanup**.

Heuristic cleanup is described by the JDK author as: **Heuristically scan some cells looking for stale entries**.

![](/media/jg/local/java/concurrent/images/thread-local/29-f76822.png)

The concrete code is as follows:

```java
private boolean cleanSomeSlots(int i, int n) {
    boolean removed = false;
    Entry[] tab = table;
    int len = tab.length;
    do {
        i = nextIndex(i, len);
        Entry e = tab[i];
        if (e != null && e.get() == null) {
            n = len;
            removed = true;
            i = expungeStaleEntry(i);
        }
    } while ( (n >>>= 1) != 0);
    return removed;
}
```

### `InheritableThreadLocal`

When using `ThreadLocal`, in asynchronous scenarios a child thread cannot share the thread-local variable copies created in its parent thread.

To solve this problem, the JDK also provides the `InheritableThreadLocal` class. Let's look at an example:

```java
public class InheritableThreadLocalDemo {
    public static void main(String[] args) {
        ThreadLocal<String> ThreadLocal = new ThreadLocal<>();
        ThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();
        ThreadLocal.set("父类数据:threadLocal");
        inheritableThreadLocal.set("父类数据:inheritableThreadLocal");

        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("子线程获取父类ThreadLocal数据：" + ThreadLocal.get());
                System.out.println("子线程获取父类inheritableThreadLocal数据：" + inheritableThreadLocal.get());
            }
        }).start();
    }
}
```

Output:

```java
子线程获取父类ThreadLocal数据：null
子线程获取父类inheritableThreadLocal数据：父类数据:inheritableThreadLocal
```

The underlying principle is that a child thread is created from the parent thread by calling `new Thread()`, and `Thread#init` is invoked inside the `Thread` constructor. Inside `init`, the parent thread's data is copied to the child thread:

```java
private void init(ThreadGroup g, Runnable target, String name,
                      long stackSize, AccessControlContext acc,
                      boolean inheritThreadLocals) {
    if (name == null) {
        throw new NullPointerException("name cannot be null");
    }

    if (inheritThreadLocals && parent.inheritableThreadLocals != null)
        this.inheritableThreadLocals =
            ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
    this.stackSize = stackSize;
    tid = nextThreadID();
}
```

However, `InheritableThreadLocal` still has a flaw: in practice, asynchronous processing usually relies on thread pools, whereas `InheritableThreadLocal` assigns values inside `init()` during `new Thread`. Because thread pools reuse threads, problems arise here.

Of course, where there is a problem, there is a solution: Alibaba open-sourced a `TransmittableThreadLocal` component that solves this issue. We will not expand on it here—interested readers can look up its documentation.

### Using `ThreadLocal` in Real-World Projects

#### `ThreadLocal` Use Cases

In our current projects, logging uses `ELK+Logstash`, with final display and search in `Kibana`.

Nowadays, distributed systems provide services externally in a unified manner, and call chains across services can be correlated using a `traceId`. But how do we pass `traceId` between different services/projects?

Here we use `org.slf4j.MDC` to implement this capability, which internally relies on `ThreadLocal`. Specifically:

When the frontend sends a request to **Service A**, **Service A** generates a `UUID`-like `traceId` string and places it into the current thread's `ThreadLocal`. When calling **Service B**, it writes `traceId` into the request `Header`. When **Service B** receives the request, it first checks whether `traceId` exists in the request `Header`; if so, it writes it into its own thread's `ThreadLocal`.

![](/media/jg/local/java/concurrent/images/thread-local/30-9557f8.png)

In the diagram, `requestId` is the `traceId` that correlates our call chains across systems—through this `requestId`, calls between systems can be traced along the corresponding link. There are also some other scenarios:

![](/media/jg/local/java/concurrent/images/thread-local/31-bc02a8.png)

For these scenarios, we can apply corresponding solutions, as shown below:

#### Feign Remote Call Solution

**Service sending the request:**

```java
@Component
@Slf4j
public class FeignInvokeInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        String requestId = MDC.get("requestId");
        if (StringUtils.isNotBlank(requestId)) {
            template.header("requestId", requestId);
        }
    }
}
```

**Service receiving the request:**

```java
@Slf4j
@Component
public class LogInterceptor extends HandlerInterceptorAdapter {

    @Override
    public void afterCompletion(HttpServletRequest arg0, HttpServletResponse arg1, Object arg2, Exception arg3) {
        MDC.remove("requestId");
    }

    @Override
    public void postHandle(HttpServletRequest arg0, HttpServletResponse arg1, Object arg2, ModelAndView arg3) {
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        String requestId = request.getHeader(BaseConstant.REQUEST_ID_KEY);
        if (StringUtils.isBlank(requestId)) {
            requestId = UUID.randomUUID().toString().replace("-", "");
        }
        MDC.put("requestId", requestId);
        return true;
    }
}
```

#### Passing `requestId` in Thread Pool Asynchronous Calls

Because `MDC` is implemented based on `ThreadLocal`, during asynchronous execution a child thread cannot obtain data stored in the parent thread's `ThreadLocal`. Therefore, we can customize the thread pool executor and wrap its execution with `run()`:

```java
public class MyThreadPoolTaskExecutor extends ThreadPoolTaskExecutor {

    @Override
    public void execute(Runnable runnable) {
        Map<String, String> context = MDC.getCopyOfContextMap();
        super.execute(() -> run(runnable, context));
    }

    @Override
    private void run(Runnable runnable, Map<String, String> context) {
        if (context != null) {
            MDC.setContextMap(context);
        }
        try {
            runnable.run();
        } finally {
            MDC.remove();
        }
    }
}
```

#### Sending Messages to Third-Party Systems via MQ

Include a custom property `requestId` in the MQ message payload; after the consumer receives and consumes the message, it simply parses and uses `requestId`.
