---
title: LinkedHashMap Source Code Analysis
description: "In-depth analysis of LinkedHashMap source code: detailed explanation of how LinkedHashMap maintains a doubly linked list to achieve insertion/access order, LRU cache implementation, differences from HashMap, and iteration efficiency optimization."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/linkedhashmap-source-code.md
head:
  - - meta
    - name: keywords
      content: LinkedHashMap source code,insertion order,access order,LRU cache,doubly linked list,ordered Map,LinkedHashMap implementation principles
---

## Introduction to LinkedHashMap

`LinkedHashMap` is a collection class provided by Java. It extends `HashMap` and maintains a doubly linked list on top of `HashMap`, giving it the following characteristics:

1. Supports iterating in insertion order during traversal.
2. Supports ordering by element access order, making it suitable for encapsulating LRU cache utilities.
3. Because it internally uses a doubly linked list to maintain all nodes, traversal efficiency is proportional to the number of elements, making iteration much more efficient than `HashMap`, whose traversal time is proportional to capacity.

The logical structure of `LinkedHashMap` is shown below. Built on top of `HashMap`, it maintains a doubly linked list connecting all nodes, so nodes, linked lists, and Red-Black Trees originally hashed across different buckets are linked together in order.

![LinkedHashMap Logical Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkhashmap-structure-overview-f60836d3.png)

## LinkedHashMap Usage Examples

### Insertion-Order Iteration

As shown below, we sequentially add elements to a `LinkedHashMap` and then iterate over it.

```java
HashMap < String, String > map = new LinkedHashMap < > ();
map.put("a", "2");
map.put("g", "3");
map.put("r", "1");
map.put("e", "23");

for (Map.Entry < String, String > entry: map.entrySet()) {
    System.out.println(entry.getKey() + ":" + entry.getValue());
}
```

Output:

```java
a:2
g:3
r:1
e:23
```

As can be seen, the iteration order of `LinkedHashMap` matches the insertion order—a property that `HashMap` does not have.

### Access-Order Iteration

`LinkedHashMap` defines an ordering mode field `accessOrder` (`boolean`, defaulting to `false`): `true` for access order and `false` for insertion order.

To achieve access-order iteration, we can use the `LinkedHashMap` constructor that accepts the `accessOrder` parameter and set `accessOrder` to `true`, enabling access-order semantics.

```java
LinkedHashMap<Integer, String> map = new LinkedHashMap<>(16, 0.75f, true);
map.put(1, "one");
map.put(2, "two");
map.put(3, "three");
map.put(4, "four");
map.put(5, "five");
// Access element 2; it will be moved to the tail of the linked list
map.get(2);
// Access element 3; it will be moved to the tail of the linked list
map.get(3);
for (Map.Entry<Integer, String> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " : " + entry.getValue());
}
```

Output:

```java
1 : one
4 : four
5 : five
2 : two
3 : three
```

As can be seen, the iteration order of `LinkedHashMap` matches the access order.

### LRU Cache

From the example above, we can see that `LinkedHashMap` lets us encapsulate a simple LRU (**L**east **R**ecently **U**sed) cache, ensuring that when the number of stored elements exceeds the container's capacity, the least recently accessed element is evicted.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/lru-cache-34d62be1.png)

The concrete implementation approach is as follows:

- Extend `LinkedHashMap`;
- Specify `accessOrder` as `true` in the constructor so that accessing an element moves it to the tail of the linked list, leaving the least recently accessed element at the head of the list;
- Override the `removeEldestEntry` method, which returns a `boolean` indicating whether `LinkedHashMap` should remove the head element of the linked list (since cache capacity is limited).

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    /**
     * Returns true when size exceeds capacity, instructing LinkedHashMap to remove the oldest entry (head of the list)
     */
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}
```

Here is the test code. The author initializes the cache capacity to 3 and then sequentially adds 4 elements:

```java
LRUCache<Integer, String> cache = new LRUCache<>(3);
cache.put(1, "one");
cache.put(2, "two");
cache.put(3, "three");
cache.put(4, "four");
cache.put(5, "five");
for (int i = 1; i <= 5; i++) {
    System.out.println(cache.get(i));
}
```

Output:

```java
null
null
three
four
five
```

Looking at the output, since the cache capacity is 3, adding the 4th element causes the 1st element to be removed, and adding the 5th element causes the 2nd element to be removed.

## LinkedHashMap Source Code Analysis

### Design of Node

Before formally diving into `LinkedHashMap`, let's discuss the design of `LinkedHashMap`'s node class `Entry`. As we all know, nodes in a `HashMap` bucket that form a linked list due to collisions are converted into a Red-Black Tree when both of the following conditions are met:

1. ~~The number of nodes in the linked list reaches the treeification threshold of 7, i.e., `TREEIFY_THRESHOLD - 1`.~~
2. The bucket array capacity reaches the minimum treeification capacity, i.e., `MIN_TREEIFY_CAPACITY`.

> **🐛 Correction (see [issue#2147](https://github.com/Snailclimb/JavaGuide/issues/2147))**:
>
> The treeification threshold for the number of nodes in a linked list is 8, not 7. Because the source code traverses starting from the head node with a 0-based index, the check is written as `8 - 1 = 7`, which actually checks at the tail node whether the total linked list length is greater than or equal to 8 before performing treeification.
>
> ![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/LinkedHashMap-putval-TREEIFY-87952fa6.png)

Since `LinkedHashMap` builds a doubly linked list across every node on top of `HashMap`, tree nodes converted into a Red-Black Tree must also possess the properties of doubly linked list nodes—that is, every tree node needs two references storing the addresses of its predecessor and successor nodes. This makes designing the tree node class `TreeNode` a somewhat tricky problem.

Let's examine the class diagram relating the two node hierarchies. We can see:

1. `LinkedHashMap`'s inner node class `Entry` builds on `HashMap`'s node by adding `before` and `after` pointers to give nodes doubly linked list capabilities.
2. `HashMap`'s tree node `TreeNode` extends `LinkedHashMap.Entry`, thereby inheriting its doubly linked list properties.

![Relationship Between LinkedHashMap and HashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/map-hashmap-linkedhashmap-e0970ec7.png)

Many readers might immediately wonder: why does `HashMap`'s `TreeNode` obtain doubly linked list capabilities through `LinkedHashMap`? Why not implement the predecessor and successor pointers directly on `Node`?

Let's answer the first question first. We know `LinkedHashMap` adds bidirectional pointers to nodes on top of `HashMap` to achieve doubly linked list behavior. When a linked list inside `LinkedHashMap` converts into a Red-Black Tree, its nodes become `TreeNode` instances. To ensure that tree nodes still retain doubly linked list properties when using `LinkedHashMap`, `TreeNode` needs to extend `LinkedHashMap.Entry`.

Now for the second question: why not implement the predecessor and successor pointers directly on `HashMap`'s `Node`, and have `TreeNode` extend `Node` directly to gain doubly linked list properties? In fact, that would also work. However, doing so would force `Node`—used by plain `HashMap` to store key-value pairs—to carry two unnecessary references, wasting memory space.

Therefore, to keep `HashMap`'s underlying `Node` class free of redundant references while ensuring `LinkedHashMap`'s `Entry` class has pointers for the linked list, the designers made `LinkedHashMap.Entry` extend `Node` and add the `before` and `after` references, restricting those fields to nodes that need linked-list behavior. Then `TreeNode` extends `Entry` to obtain both the `before` and `after` pointers.

```java
static class Entry<K,V> extends HashMap.Node<K,V> {
        Entry<K,V> before, after;
        Entry(int hash, K key, V value, Node<K,V> next) {
            super(hash, key, value, next);
        }
    }
```

Wait—doesn't doing this also give `TreeNode` two unnecessary references when used in plain `HashMap`? Isn't that still a waste of space?

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
  // omitted

}
```

Regarding this question, let's quote a comment from the JDK authors. The authors believe that with a well-distributed `hashCode` implementation, the probability of `HashMap` converting into a Red-Black Tree is low. Even when a bin converts into a Red-Black Tree using `TreeNode`, removals or resizing may convert `TreeNode` back into `Node`. Thus, `TreeNode` usage is relatively rare, and this small memory overhead is acceptable.

```bash
Because TreeNodes are about twice the size of regular nodes, we
use them only when bins contain enough nodes to warrant use
(see TREEIFY_THRESHOLD). And when they become too small (due to
removal or resizing) they are converted back to plain bins.  In
usages with well-distributed user hashCodes, tree bins are
rarely used.  Ideally, under random hashCodes, the frequency of
nodes in bins follows a Poisson distribution
```

### Constructors

`LinkedHashMap` has 4 constructors with simple implementations that directly delegate initialization to the superclass `HashMap` constructors.

```java
public LinkedHashMap() {
    super();
    accessOrder = false;
}

public LinkedHashMap(int initialCapacity) {
    super(initialCapacity);
    accessOrder = false;
}

public LinkedHashMap(int initialCapacity, float loadFactor) {
    super(initialCapacity, loadFactor);
    accessOrder = false;
}

public LinkedHashMap(int initialCapacity,
    float loadFactor,
    boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
```

As mentioned earlier, `accessOrder` defaults to `false`. If we want `LinkedHashMap` to order key-value pairs by access order (keeping least recently accessed elements at the head of the linked list and moving recently accessed elements to the tail), we must call the 4th constructor and pass `accessOrder` as `true`.

### The get Method

Among CRUD operations, `get` is the only method overridden by `LinkedHashMap`. When `accessOrder` is `true`, after looking up the element, it moves the accessed element to the tail of the linked list.

```java
public V get(Object key) {
     Node < K, V > e;
     // Look up entry by key; return null if not found
     if ((e = getNode(hash(key), key)) == null)
         return null;
     // If accessOrder is true, call afterNodeAccess to move element to list tail
     if (accessOrder)
         afterNodeAccess(e);
     // Return the value of the key-value pair
     return e.value;
 }
```

From the source code, the execution steps of `get` are very straightforward:

1. Call the superclass `HashMap`'s `getNode` method to obtain the key-value node; if `null`, return immediately.
2. Check whether `accessOrder` is `true`; if so, `LinkedHashMap` must maintain access ordering along the linked list, so proceed to step 3.
3. Call `LinkedHashMap`'s overridden `afterNodeAccess` method to move the current element to the tail of the linked list.

The key lies in the implementation of `afterNodeAccess`, which is responsible for moving an element to the tail of the linked list.

```java
void afterNodeAccess(Node < K, V > e) { // move node to last
    LinkedHashMap.Entry < K, V > last;
    // If accessOrder is true and the current node is not already the tail node
    if (accessOrder && (last = tail) != e) {

        // Get current node p, its predecessor b, and its successor a
        LinkedHashMap.Entry < K, V > p =
            (LinkedHashMap.Entry < K, V > ) e, b = p.before, a = p.after;

        // Set p's successor pointer to null, disconnecting it from its successor
        p.after = null;

        // If predecessor is null, p was the head node, so make successor a the new head
        if (b == null)
            head = a;
        else
            // Otherwise, link predecessor b to successor a
            b.after = a;

        // If successor a is not null, link a's before pointer to predecessor b
        if (a != null)
            a.before = b;
        else
            // If successor is null, p was at the tail, so point last to predecessor b (this else branch is actually unreachable since the outer if ensured p != tail, so a cannot be null)
            last = b;

        // If last is null, the list only had node p, so set head to p
        if (last == null)
            head = p;
        else {
            // Otherwise link p's before to last, and last's after to p
            p.before = last;
            last.after = p;
        }
        // Point tail to p, completing the move of node p to the tail
        tail = p;

        ++modCount;
    }
}
```

From the source code, `afterNodeAccess` performs the following operations:

1. If `accessOrder` is `true` and the list tail is not the current node `p`, we need to move `p` to the tail of the linked list.
2. Retrieve the current node `p`, along with its predecessor node `b` and successor node `a`.
3. Set `p`'s successor pointer to `null`, disconnecting it from its successor node.
4. Try linking predecessor node `b` to successor node `a`. If `b` is `null`, `p` was the head node of the list, so directly set `head` to successor node `a` (and later append `p` at the end after `a`).
5. Next, try pointing successor node `a`'s `before` reference to predecessor node `b`.
6. Once the predecessor and successor nodes are linked together and `p` is detached, append `p` to the end of the linked list. If the list end (`last`) is `null`, the list only contained node `p`, so directly point `head` to `p`.
7. Now that `p` is placed at the end of the list, update the `tail` pointer (which points to the end of the list) to `p`.

You can combine this with the diagram below, which illustrates the element with key `13` being moved to the tail of the linked list.

![LinkedHashMap Moving Element 13 to the Tail of the Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-get-872c9ba9.png)

Don't worry if it takes a little time to follow completely—just knowing what this method accomplishes is enough, and you can digest the pointer details gradually later.

### newNode — Appending New Nodes to the Tail of the Linked List

The section above explained how `afterNodeAccess` moves an **existing node** to the tail of the linked list. So how is a **newly inserted node** added to the linked list?

The answer lies in `LinkedHashMap` overriding `HashMap`'s `newNode` method. When `HashMap` inserts a new key-value pair, it calls `newNode` to create a node object. In its overridden version, `LinkedHashMap` not only creates an `Entry` node, but also calls `linkNodeLast` to link it to the tail of the doubly linked list:

```java
// HashMap's newNode is a plain implementation
Node<K,V> newNode(int hash, K key, V value, Node<K,V> next) {
    return new Node<>(hash, key, value, next);
}

// LinkedHashMap overrides newNode and additionally calls linkNodeLast
Node<K,V> newNode(int hash, K key, V value, Node<K,V> e) {
    LinkedHashMap.Entry<K,V> p =
        new LinkedHashMap.Entry<>(hash, key, value, e);
    linkNodeLast(p);  // Key step: link the new node to the tail of the list
    return p;
}
```

The implementation of `linkNodeLast` is as follows:

```java
// Link node to the tail of the doubly linked list
private void linkNodeLast(LinkedHashMap.Entry<K,V> p) {
    LinkedHashMap.Entry<K,V> last = tail;
    tail = p;  // tail points to the new node
    if (last == null)
        head = p;  // List is empty, so head also points to the new node
    else {
        p.before = last;  // New node's predecessor points to the previous tail
        last.after = p;   // Previous tail's successor points to the new node
    }
}
```

**This is the core mechanism by which `LinkedHashMap` achieves insertion-order preservation**: whenever a new node is inserted, overriding `newNode` and calling `linkNodeLast` appends the new node to the tail of the doubly linked list. Thus, when iterating from `head` along the `after` pointers, all elements are retrieved in insertion order.

Similarly, `LinkedHashMap` also overrides `newTreeNode` to ensure tree nodes are likewise linked to the tail of the list upon insertion:

```java
TreeNode<K,V> newTreeNode(int hash, K key, V value, Node<K,V> next) {
    TreeNode<K,V> p = new TreeNode<K,V>(hash, key, value, next);
    linkNodeLast(p);
    return p;
}
```

### Post-Removal Hook for remove — afterNodeRemoval

`LinkedHashMap` does not override the `remove` method; instead, it inherits `HashMap`'s `remove` method directly. To ensure that removing a key-value pair also removes its node from the doubly linked list synchronously, `LinkedHashMap` overrides `HashMap`'s empty hook method `afterNodeRemoval`.

```java
final Node<K,V> removeNode(int hash, Object key, Object value,
                               boolean matchValue, boolean movable) {
        // omitted
            if (node != null && (!matchValue || (v = node.value) == value ||
                                 (value != null && value.equals(v)))) {
                if (node instanceof TreeNode)
                    ((TreeNode<K,V>)node).removeTreeNode(this, tab, movable);
                else if (node == p)
                    tab[index] = node.next;
                else
                    p.next = node.next;
                ++modCount;
                --size;
                // After HashMap's removeNode removes the element, it calls afterNodeRemoval for post-removal cleanup
                afterNodeRemoval(node);
                return node;
            }
        }
        return null;
    }
// Empty implementation
void afterNodeRemoval(Node<K,V> p) { }
```

We can see that inside `removeNode`—invoked by the inherited `remove` method—after the node is deleted from its bucket, `afterNodeRemoval` is called.

```java
void afterNodeRemoval(Node<K,V> e) { // unlink

    // Get current node p, its predecessor b, and its successor a
        LinkedHashMap.Entry<K,V> p =
            (LinkedHashMap.Entry<K,V>)e, b = p.before, a = p.after;
    // Set p's before and after pointers to null to unlink it from predecessor and successor
        p.before = p.after = null;

    // If predecessor is null, p was the head node, so point head to successor a
        if (b == null)
            head = a;
        else
        // Otherwise, link predecessor b directly to successor a
            b.after = a;

    // If successor is null, p was at the tail, so point tail directly to predecessor b
        if (a == null)
            tail = b;
        else
        // Otherwise, point successor's before pointer directly to predecessor b
            a.before = b;
    }
```

From the source code, the overall operation of `afterNodeRemoval` is to detach node `p` from both its predecessor and successor nodes so it awaits Garbage Collection. The steps are:

1. Retrieve the current node `p`, along with `p`'s predecessor node `b` and successor node `a`.
2. Detach `p` from its predecessor and successor nodes.
3. Point predecessor node `b` to successor node `a`. If `b` is `null`, `p` was at the head of the list, so point `head` directly to successor node `a`.
4. Point successor node `a`'s `before` reference to predecessor node `b`. If `a` is `null`, `p` was at the tail of the list, so point `tail` directly to predecessor node `b`.

You can combine this with the diagram below, which shows the element with key `13` being deleted—i.e., unlinked and removed from the doubly linked list.

![LinkedHashMap Removing Element 13](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-remove-2699abef.png)

Don't worry if it takes a little time to digest completely—just knowing what this method does is enough, and you can revisit the details later.

### Post-Insertion Hook for put — afterNodeInsertion

Similarly, `LinkedHashMap` does not implement its own insertion methods; it directly inherits all of `HashMap`'s insertion methods. However, to maintain the ordering of the doubly linked list, it does two things:

1. Overrides `afterNodeAccess` (discussed above): if the inserted key already exists in the map, since `LinkedHashMap` places newly inserted nodes at the tail of the list, `afterNodeAccess` is called for an existing key to move it to the tail of the linked list.
2. Overrides `HashMap`'s `afterNodeInsertion` method: when `removeEldestEntry` returns `true`, it removes the head node of the linked list.

We can see both hooks inside `HashMap`'s core insertion method `putVal`:

```java
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
          // omitted
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                 // If the key already exists in the map, call afterNodeAccess
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
         // Call post-insertion hook, which is overridden by LinkedHashMap
        afterNodeInsertion(evict);
        return null;
    }
```

The earlier steps in the source code have already been explained, so here we focus on how `afterNodeInsertion` works. Suppose we override `removeEldestEntry` so that it returns `true` when the list `size` exceeds `capacity`.

```java
/**
 * Returns true when size exceeds capacity, instructing LinkedHashMap to remove the oldest entry (head of the list)
 */
protected boolean removeEldestEntry(Map.Entry < K, V > eldest) {
    return size() > capacity;
}
```

Take the diagram below as an example. Suppose the author just inserted a new non-existent node `19`, and `capacity` is 4, so `removeEldestEntry` returns `true` and we need to remove the head node of the linked list.

![Inserting New Element 19 into LinkedHashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-after-insert-1-4cd3c584.png)

The removal step is simple: check whether the head node exists; if so, break the link between the head node and its successor node, and advance the `head` pointer to the next node. Thus, `head` now points to `12`, leaving node `10` as an unreferenced object awaiting GC.

![Inserting New Element 19 into LinkedHashMap](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedhashmap-after-insert-2-aca094bd.png)

```java
void afterNodeInsertion(boolean evict) { // possibly remove eldest
        LinkedHashMap.Entry<K,V> first;
        // If evict is true, head is non-null, and removeEldestEntry returns true, we need to remove the oldest element (head of the list)
        if (evict && (first = head) != null && removeEldestEntry(first)) {
          // Get the key of the head key-value entry
            K key = first.key;
            // Call removeNode to remove the element from HashMap's bucket and unlink it from LinkedHashMap's doubly linked list for GC
            removeNode(hash(key), key, null, false, true);
        }
    }
```

From the source code, `afterNodeInsertion` performs the following operations:

1. Check whether `eldest` is `true`—only when it is `true` may the oldest entry (the element at the head of the list) need to be removed. To confirm whether removal should actually occur, it also verifies that the list is non-empty (`(first = head) != null`) and that `removeEldestEntry` returns `true`. Only when these conditions are met is the list known to be non-empty and in need of eviction.
2. Retrieve the key of the first element in the linked list.
3. Call `HashMap`'s `removeNode` method. As mentioned earlier, `removeNode` deletes the node from `HashMap`'s bucket and invokes `LinkedHashMap`'s overridden `afterNodeRemoval` method, thereby removing the element from the bucket, unlinking it from `LinkedHashMap`'s doubly linked list, and leaving it ready for GC.

## Iteration Performance Comparison Between LinkedHashMap and HashMap

`LinkedHashMap` maintains a doubly linked list to record data insertion order, so when iterating via its iterator, traversal follows the doubly linked list directly. Compared to `HashMap`'s approach of scanning across the entire bucket array, this is much more efficient.

We can verify this directly from the iterators of both classes. First let's look at `HashMap`'s iterator: when iterating over key-value pairs, `HashMap` uses a `nextNode` method, which returns the next element pointed to by `next` and, starting from `next`, scans through buckets to locate the next non-empty `Node` in the bucket table.

```java
 final class EntryIterator extends HashIterator
 implements Iterator < Map.Entry < K, V >> {
     public final Map.Entry < K,
     V > next() {
         return nextNode();
     }
 }

 // Get the next Node
 final Node < K, V > nextNode() {
     Node < K, V > [] t;
     // Get the next element
     Node < K, V > e = next;
     if (modCount != expectedModCount)
         throw new ConcurrentModificationException();
     if (e == null)
         throw new NoSuchElementException();
     // Advance next to the next non-empty Node in the buckets
     if ((next = (current = e).next) == null && (t = table) != null) {
         do {} while (index < t.length && (next = t[index++]) == null);
     }
     return e;
 }
```

By contrast, `LinkedHashMap`'s iterator directly uses the `after` pointer to jump immediately to the successor of the current node, which is far cleaner and faster.

```java
 final class LinkedEntryIterator extends LinkedHashIterator
 implements Iterator < Map.Entry < K, V >> {
     public final Map.Entry < K,
     V > next() {
         return nextNode();
     }
 }
 // Get the next Node
 final LinkedHashMap.Entry < K, V > nextNode() {
     // Get the next node
     LinkedHashMap.Entry < K, V > e = next;
     if (modCount != expectedModCount)
         throw new ConcurrentModificationException();
     if (e == null)
         throw new NoSuchElementException();
     // Point current to the current node
     current = e;
     // Point next directly via the current node's after pointer to locate the next node quickly
     next = e.after;
     return e;
 }
```

To verify this point, the author benchmarked both containers by measuring the time taken to insert 10 million entries and iterate over 10 million entries, using the following code:

```java
int count = 1000_0000;
Map<Integer, Integer> hashMap = new HashMap<>();
Map<Integer, Integer> linkedHashMap = new LinkedHashMap<>();

long start, end;

start = System.currentTimeMillis();
for (int i = 0; i < count; i++) {
    hashMap.put(ThreadLocalRandom.current().nextInt(1, count), ThreadLocalRandom.current().nextInt(0, count));
}
end = System.currentTimeMillis();
System.out.println("map time putVal: " + (end - start));

start = System.currentTimeMillis();
for (int i = 0; i < count; i++) {
    linkedHashMap.put(ThreadLocalRandom.current().nextInt(1, count), ThreadLocalRandom.current().nextInt(0, count));
}
end = System.currentTimeMillis();
System.out.println("linkedHashMap putVal time: " + (end - start));

start = System.currentTimeMillis();
long num = 0;
for (Integer v : hashMap.values()) {
    num = num + v;
}
end = System.currentTimeMillis();
System.out.println("map get time: " + (end - start));

start = System.currentTimeMillis();
for (Integer v : linkedHashMap.values()) {
    num = num + v;
}
end = System.currentTimeMillis();
System.out.println("linkedHashMap get time: " + (end - start));
System.out.println(num);
```

Judging from the output below, because `LinkedHashMap` has to maintain a doubly linked list, inserting elements takes longer than `HashMap`; however, thanks to the explicit predecessor/successor links of the doubly linked list, iteration efficiency is much higher than `HashMap`'s. Overall, though, the difference is not huge given such a large volume of data.

```bash
map time putVal: 5880
linkedHashMap putVal time: 7567
map get time: 143
linkedHashMap get time: 67
63208969074998
```

## Common LinkedHashMap Interview Questions

### What Is LinkedHashMap?

`LinkedHashMap` is a subclass of `HashMap` in the Java Collections Framework. It inherits all fields and methods of `HashMap` and overrides `afterNodeRemoval`, `afterNodeInsertion`, and `afterNodeAccess` on top of `HashMap`, equipping it with insertion-order and access-order capabilities.

### How Does LinkedHashMap Iterate Elements in Insertion Order?

Iterating over elements in insertion order is the default behavior of `LinkedHashMap`. Internally, `LinkedHashMap` maintains a doubly linked list that records the order in which elements were inserted. Therefore, when iterating with an iterator, the order of elements matches the order in which they were originally inserted.

### How Does LinkedHashMap Iterate Elements in Access Order?

`LinkedHashMap` can be configured to iterate in access order via the `accessOrder` parameter in its constructor. When `accessOrder` is `true`, each time an element is accessed, that element is moved to the tail of the linked list—so on the next access-order traversal, it becomes the last element in the list, thereby achieving iteration in access order.

### How Does LinkedHashMap Implement an LRU Cache?

Set `accessOrder` to `true` and override `removeEldestEntry` to return `true` when the map size exceeds the capacity. This way, every time an element is accessed, it is moved to the tail of the linked list. Whenever an insertion causes `removeEldestEntry` to return `true`—indicating that the cache is full—`LinkedHashMap` removes the head element of the linked list, allowing us to implement an LRU cache.

### What Are the Differences Between LinkedHashMap and HashMap?

Both `LinkedHashMap` and `HashMap` are implementations of the `Map` interface in the Java Collections Framework. Their biggest difference lies in element iteration order: `HashMap`'s iteration order is unpredictable, whereas `LinkedHashMap` provides iteration in either insertion order or access order. Furthermore, `LinkedHashMap` internally maintains a doubly linked list to track insertion order or access order, while `HashMap` does not have this linked list. Consequently, `LinkedHashMap` may have slightly lower insertion performance than `HashMap`, but it offers richer ordering functionality and faster iteration efficiency compared to `HashMap`.

## References

- Detailed Analysis of LinkedHashMap Source Code (JDK 1.8): <https://www.imooc.com/article/22931>
- HashMap vs. LinkedHashMap: <https://www.cnblogs.com/Spground/p/8536148.html>
- Derived from LinkedHashMap Source Code: <https://leetcode.cn/problems/lru-cache/solution/yuan-yu-linkedhashmapyuan-ma-by-jeromememory/>
