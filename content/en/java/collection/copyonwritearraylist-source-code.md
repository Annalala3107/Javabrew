---
title: CopyOnWriteArrayList Source Code Analysis
description: "In-depth analysis of CopyOnWriteArrayList source code: explaining the Copy-On-Write (COW) mechanism, suitability for read-heavy write-light scenarios, thread-safe List implementation, snapshot consistency guarantees, and memory overhead trade-offs."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/copyonwritearraylist-source-code.md
head:
  - - meta
    - name: keywords
      content: CopyOnWriteArrayList source code,Copy-On-Write COW,thread-safe List,read-heavy write-light,concurrent container,snapshot consistency
---

## Introduction to CopyOnWriteArrayList

Before JDK 1.5, if you wanted to use a concurrency-safe `List`, you could choose `Vector` or the synchronized wrapper returned by `Collections.synchronizedList()`. However, `Vector` is a legacy collection that has been superseded. `Vector` essentially adds `synchronized` to almost every CRUD method—while this ensures synchronization, it is equivalent to placing a coarse-grained lock on the entire `Vector`, forcing every method invocation to acquire the lock and resulting in very poor performance.

JDK 1.5 introduced the `java.util.concurrent` (JUC) package, which provides many thread-safe containers with strong concurrency performance. Among them, the only thread-safe `List` implementation is `CopyOnWriteArrayList`. For a summary of common concurrent containers under the `java.util.concurrent` package, you can read this article: [Summary of Common Java Concurrent Containers](https://javaguide.cn/java/concurrent/java-concurrent-collections.html).

### What Makes CopyOnWriteArrayList So Powerful?

For most business scenarios, read operations far outnumber write operations. Because read operations do not modify the underlying data, acquiring a lock on every single read is actually a waste of resources. Instead, we should allow multiple threads to access the internal data of the `List` simultaneously, since reading is inherently safe.

This idea is very similar to the design philosophy of `ReentrantReadWriteLock`—namely, read-read is non-mutually exclusive, while read-write and write-write are mutually exclusive (only read-read does not block). `CopyOnWriteArrayList` takes this idea even further. To maximize read performance, read operations in `CopyOnWriteArrayList` require no locking at all. Even more impressively, write operations do not block read operations either—only write-write operations are mutually exclusive. As a result, read performance is dramatically improved.

The core reason `CopyOnWriteArrayList` is thread-safe lies in its **Copy-On-Write** strategy, as you can tell right from the name `CopyOnWriteArrayList`.

### What Is the Idea Behind Copy-On-Write?

"Copy-On-Write" in the name `CopyOnWriteArrayList` is abbreviated as COW.

Here is Wikipedia's description of Copy-On-Write, which explains it quite well:

> Copy-on-write (COW) is an optimization strategy in computer programming. Its core idea is that if multiple callers simultaneously request the same resource (such as data stored in memory or on disk), they all obtain the same pointer referring to the same resource. Only when a caller attempts to modify the content of the resource does the system actually create a private copy for that caller, while the original resource seen by other callers remains unchanged. This process is transparent to the other callers. The main advantage of this approach is that if callers do not modify the resource, no private copy is created, allowing multiple callers to share the same resource when performing read-only operations.

Using `CopyOnWriteArrayList` as an example: when its contents need to be modified (via `add`, `set`, `remove`, etc.), it does not mutate the original array directly. Instead, it first creates a copy of the underlying array, performs the modification on the copied array, and then assigns the modified array back. This guarantees that write operations do not interfere with read operations.

As you can see, the Copy-On-Write mechanism is well suited for read-heavy, write-light concurrent scenarios and can greatly improve system concurrency performance.

However, Copy-On-Write is not a silver bullet and still has several drawbacks, listed below:

1. Memory consumption: Every write operation copies the original data, occupying extra memory space. When the data volume is large, this may lead to insufficient memory resources.
2. Write overhead: Every write operation must copy the original data, modify it, and replace the reference, so the cost of writing is relatively high. In write-heavy scenarios, performance may suffer.
3. Snapshot consistency: An iterator retains a snapshot of the underlying array at the time the iterator was created; subsequent modifications are not reflected in that iterator.
4. ...

## CopyOnWriteArrayList Source Code Analysis

Taking JDK 1.8 as an example, let's analyze the core underlying source code of `CopyOnWriteArrayList`.

The class definition of `CopyOnWriteArrayList` is as follows:

```java
public class CopyOnWriteArrayList<E>
extends Object
implements List<E>, RandomAccess, Cloneable, Serializable
{
  //...
}
```

`CopyOnWriteArrayList` implements the following interfaces:

- `List`: Indicates that it is a list supporting add, remove, search, and other operations, as well as index-based access.
- `RandomAccess`: A marker interface indicating that a `List` collection implementing it supports **fast random access**.
- `Cloneable`: Indicates that it supports copying via the `clone()` method; `CopyOnWriteArrayList#clone()` returns a shallow copy.
- `Serializable`: Indicates that it supports serialization, meaning the object can be converted into a byte stream for persistent storage or network transmission, which is very convenient.

![CopyOnWriteArrayList Class Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/copyonwritearraylist-class-diagram-613f0797.png)

### Initialization

`CopyOnWriteArrayList` has one no-arg constructor and two parameterized constructors.

```java
// Creates an empty CopyOnWriteArrayList
public CopyOnWriteArrayList() {
    setArray(new Object[0]);
}

// Creates a CopyOnWriteArrayList containing the elements of the specified collection, in the order returned by its iterator
public CopyOnWriteArrayList(Collection<? extends E> c) {
    Object[] elements;
    if (c.getClass() == CopyOnWriteArrayList.class)
        elements = ((CopyOnWriteArrayList<?>)c).getArray();
    else {
        elements = c.toArray();
        // c.toArray might (incorrectly) not return Object[] (see 6260652)
        if (elements.getClass() != Object[].class)
            elements = Arrays.copyOf(elements, elements.length, Object[].class);
    }
    setArray(elements);
}

// Creates a list containing a copy of the specified array
public CopyOnWriteArrayList(E[] toCopyIn) {
    setArray(Arrays.copyOf(toCopyIn, toCopyIn.length, Object[].class));
}
```

### Inserting Elements

The `add()` method of `CopyOnWriteArrayList` has three variants:

- `add(E e)`: Inserts an element at the end of the `CopyOnWriteArrayList`.
- `add(int index, E element)`: Inserts an element at the specified position in the `CopyOnWriteArrayList`.
- `addIfAbsent(E e)`: Appends the element if it is not already present; returns `true` if the element was successfully added.

Here we take `add(E e)` as an example:

```java
// Appends an element to the end of the CopyOnWriteArrayList
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    // Acquire the lock
    lock.lock();
    try {
        // Get the original array
        Object[] elements = getArray();
        // Length of the original array
        int len = elements.length;
        // Create a new array of length len + 1 and copy elements from the original array
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        // Place the element at the end of the new array
        newElements[len] = e;
        // Point array to the new array
        setArray(newElements);
        return true;
    } finally {
        // Release the lock
        lock.unlock();
    }
}
```

From the source code above, we can see:

- Internally, the `add` method uses a `ReentrantLock` to acquire a lock, ensuring synchronization and preventing multiple threads from performing write operations concurrently. The lock field is marked `final`, so its reference cannot be reassigned after initialization, and releasing the lock inside `finally` guarantees that the lock will always be released.
- `CopyOnWriteArrayList` implements writes by copying the underlying array: it first creates a new array to hold the newly added element, performs the write in the new array, and finally assigns the new array to the underlying array reference, replacing the old array. This confirms what we stated earlier: the core of `CopyOnWriteArrayList`'s thread safety is its **Copy-On-Write** strategy.
- Every write operation must copy the underlying array via `Arrays.copyOf`, which has O(n) time complexity and consumes extra memory space. Therefore, `CopyOnWriteArrayList` is suited for read-heavy, write-light scenarios where writes are infrequent and memory resources are sufficient, allowing it to improve system performance.
- `CopyOnWriteArrayList` does not have a capacity-expansion method like `ArrayList`'s `grow()`.

> The time complexity of `Arrays.copyOf` is O(n), where n represents the length of the array to be copied. Its implementation creates a new array, copies the data from the source array into the new array, and returns the new array. Because this method copies the entire array, its time complexity is proportional to the array length, i.e., O(n). It is worth noting that because it invokes system-level memory copy instructions under the hood, its performance in practice is quite good—though you still need to keep the amount of copied data under control to avoid excessive memory usage.

### Reading Elements

Read operations in `CopyOnWriteArrayList` rely on the fact that the internal array `array` is never actually modified in place, so no synchronization control or locking is needed during reads while still guaranteeing data safety. Under this mechanism, multiple threads can read elements from the list concurrently.

```java
// Underlying array, accessible only via getArray and setArray
private transient volatile Object[] array;

public E get(int index) {
    return get(getArray(), index);
}

final Object[] getArray() {
    return array;
}

private E get(Object[] a, int index) {
    return (E) a[index];
}
```

However, the `get` method provides weak consistency and may read stale element values in certain situations.

`get(int index)` executes in two steps:

1. Obtain the reference to the current array via `getArray()`;
2. Directly retrieve the element at `index` from that array.

Because this process does not acquire a lock, the following situation can occur in a concurrent environment:

1. Thread 1 calls `get(int index)` and retrieves the `array` field via `getArray()`;
2. Thread 2 calls a mutating method on `CopyOnWriteArrayList` such as `add`, `set`, or `remove`, updating the `array` field internally via `setArray`;
3. Thread 1 still reads the value from the old `array`.

### Getting the Number of Elements in the List

```java
public int size() {
    return getArray().length;
}
```

In `CopyOnWriteArrayList`, the `array` is always copied to the exact size needed to hold all elements—unlike `ArrayList`, it does not reserve extra unused capacity. Therefore, `CopyOnWriteArrayList` has no `size` field; the length of the underlying array is the number of elements, so `size()` simply returns the array length.

### Removing Elements

`CopyOnWriteArrayList` has 4 methods related to removing elements:

1. `remove(int index)`: Removes the element at the specified position in this list and shifts any subsequent elements to the left (subtracts 1 from their indices).
2. `boolean remove(Object o)`: Removes the first occurrence of the specified element from this list, returning `false` if it is not present.
3. `boolean removeAll(Collection<?> c)`: Removes from this list all elements contained in the specified collection.
4. `void clear()`: Removes all elements from this list.

Here we take `remove(int index)` as an example:

```java
public E remove(int index) {
    // Get the reentrant lock
    final ReentrantLock lock = this.lock;
    // Acquire the lock
    lock.lock();
    try {
        // Get the current array
        Object[] elements = getArray();
        // Get the current array length
        int len = elements.length;
        // Get the element at the specified index (old value)
        E oldValue = get(elements, index);
        int numMoved = len - index - 1;
        // Check whether the element being removed is the last element
        if (numMoved == 0)
            // If removing the last element, directly copy all elements before it into a new array
            setArray(Arrays.copyOf(elements, len - 1));
        else {
            // Copy in two segments: elements before index and elements after index + 1 into a new array
            // Length of the new array is old array length - 1
            Object[] newElements = new Object[len - 1];
            System.arraycopy(elements, 0, newElements, 0, index);
            System.arraycopy(elements, index + 1, newElements, index,
                             numMoved);
            // Assign the new array to the array reference
            setArray(newElements);
        }
        return oldValue;
    } finally {
        // Release the lock
        lock.unlock();
    }
}
```

### Checking Whether an Element Exists

`CopyOnWriteArrayList` provides two methods to check whether specified element(s) exist in the list:

- `contains(Object o)`: Checks whether the list contains the specified element.
- `containsAll(Collection<?> c)`: Checks whether the list contains all elements of the specified collection.

```java
// Checks whether the specified element is contained
public boolean contains(Object o) {
    // Get the current array
    Object[] elements = getArray();
    // Call indexOf to search for the specified element; return true if >= 0, otherwise false
    return indexOf(o, elements, 0, elements.length) >= 0;
}

// Checks whether all elements of the specified collection are contained
public boolean containsAll(Collection<?> c) {
    // Get the current array
    Object[] elements = getArray();
    // Get the array length
    int len = elements.length;
    // Iterate through the specified collection
    for (Object e : c) {
        // Call indexOf in a loop; if any element is missing, return false immediately
        if (indexOf(e, elements, 0, len) < 0)
            return false;
    }
    // All elements are contained (or the specified collection is empty), so return true
    return true;
}
```

## Testing Common Methods of CopyOnWriteArrayList

Code:

```java
// Create a CopyOnWriteArrayList object
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();

// Add elements to the list
list.add("Java");
list.add("Python");
list.add("C++");
System.out.println("Initial list: " + list);

// Use get to retrieve the element at the specified position
System.out.println("Second element in the list: " + list.get(1));

// Use remove to delete the specified element
boolean result = list.remove("C++");
System.out.println("Removal result: " + result);
System.out.println("List after removing element: " + list);

// Use set to update the element at the specified position
list.set(1, "Golang");
System.out.println("List after update: " + list);

// Use add to insert an element at the specified position
list.add(0, "PHP");
System.out.println("List after inserting element: " + list);

// Use size to get the size of the list
System.out.println("List size: " + list.size());

// Use removeAll to remove all occurrences of elements in the specified collection
result = list.removeAll(List.of("Java", "Golang"));
System.out.println("Batch removal result: " + result);
System.out.println("List after batch removal: " + list);

// Use clear to remove all elements from the list
list.clear();
System.out.println("List after clear: " + list);
```

Output:

```plain
List after update: [Java, Golang]
List after inserting element: [PHP, Java, Golang]
List size: 3
Batch removal result: true
List after batch removal: [PHP]
List after clear: []
```
