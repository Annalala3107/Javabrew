---
title: LinkedList Source Code Analysis
description: "In-depth analysis of LinkedList source code: examining doubly linked list structure, Deque interface implementation, O(1) head/tail insertion and deletion time complexity, performance comparison with ArrayList, and applicable scenarios."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/linkedlist-source-code.md
head:
  - - meta
    - name: keywords
      content: LinkedList source code,doubly linked list,Deque interface,LinkedList vs ArrayList,insertion and deletion performance,linked list implementation
---


## Introduction to LinkedList

`LinkedList` is a collection class implemented on top of a doubly linked list, and is frequently compared with `ArrayList`. For a detailed comparison between `LinkedList` and `ArrayList`, we have covered it thoroughly in [Java Collections Common Interview Questions Summary (Part 1)](./java-collection-questions-01.md).

![Doubly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-linkedlist-a47e8dae.png)

However, in real-world projects we generally do not use `LinkedList`. Almost any scenario that calls for `LinkedList` can be replaced by `ArrayList`, and `ArrayList` will usually deliver better performance! Even `LinkedList`'s own author, Josh Bloch, admitted that he never uses `LinkedList`.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redisimage-20220412110853807-8b87ce5d.png)

Additionally, do not reflexively assume that `LinkedList` is the best fit for element insertion and deletion just because it is a linked list. As mentioned above, `LinkedList` only achieves approximately O(1) time complexity when inserting or deleting elements at the head or tail; in other cases, the average time complexity for insertion and deletion is O(n).

### What Is the Time Complexity of Insertion and Deletion in LinkedList?

- Head insertion/deletion: Only the head node pointer needs to be updated to complete the insertion/deletion, so the time complexity is O(1).
- Tail insertion/deletion: Only the tail node pointer needs to be updated to complete the insertion/deletion, so the time complexity is O(1).
- Insertion/deletion at a specified index: It must first traverse to the specified position and then update the pointers of the target node to complete the insertion/deletion. However, because it maintains both head and tail pointers, it can start from whichever pointer is closer, traversing an average of n/4 elements, so the time complexity is O(n).

### Why Cannot LinkedList Implement the RandomAccess Interface?

`RandomAccess` is a marker interface indicating that a class implementing it supports random access (i.e., fast access to elements by index). Because the underlying data structure of `LinkedList` is a linked list whose memory addresses are non-contiguous, elements can only be located by following pointers rather than fast random access—therefore, it cannot implement the `RandomAccess` interface.

## LinkedList Source Code Analysis

Taking JDK 1.8 as an example, let's analyze the core underlying source code of `LinkedList`.

The class definition of `LinkedList` is as follows:

```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{
  //...
}
```

`LinkedList` extends `AbstractSequentialList`, and `AbstractSequentialList` in turn extends `AbstractList`.

Anyone who has read the source code of `ArrayList` knows that `ArrayList` also extends `AbstractList`, so `LinkedList` shares many similar methods with `ArrayList`.

`LinkedList` implements the following interfaces:

- `List`: Indicates that it is a list supporting add, remove, search, and other operations, as well as index-based access.
- `Deque`: Extends the `Queue` interface and provides double-ended queue semantics, supporting insertion and deletion from both ends, making it convenient for implementing data structures like stacks and queues. Note that `Deque` is pronounced "deck" [dɛk], which most people mispronounce.
- `Cloneable`: Indicates that it supports copying, enabling deep copy or shallow copy operations.
- `Serializable`: Indicates that it supports serialization, meaning the object can be converted into a byte stream for persistent storage or network transmission, which is very convenient.

![LinkedList Class Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedlist--class-diagram-7c8a9c71.png)

Elements in `LinkedList` are defined via `Node`:

```java
private static class Node<E> {
    E item; // Node value
    Node<E> next; // Reference to the next node (successor node)
    Node<E> prev; // Reference to the previous node (predecessor node)

    // Initialization parameter order: predecessor node, current node value, successor node
    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```

### Initialization

`LinkedList` has one no-arg constructor and one parameterized constructor.

```java
// Creates an empty linked list object
public LinkedList() {
}

// Accepts a Collection parameter and creates a linked list containing the same elements as the passed collection
public LinkedList(Collection<? extends E> c) {
    this();
    addAll(c);
}
```

### Inserting Elements

In addition to the methods from the `List` interface, `LinkedList` also implements many methods from the `Deque` interface, so there are multiple ways to insert elements.

Here we walk through the insertion methods from the `List` interface, namely the `add()` method.

`add()` has two overloaded versions:

- `add(E e)`: Appends an element to the end of the `LinkedList` (making the new element the last node in the list), with O(1) time complexity.
- `add(int index, E element)`: Inserts an element at the specified position. This insertion first traverses to the specified position and then modifies the pointers of the target node to complete the insertion/deletion, thus traversing an average of n/4 elements, with O(n) time complexity.

```java
// Appends an element to the end of the linked list
public boolean add(E e) {
    linkLast(e);
    return true;
}

// Inserts an element at the specified position in the linked list
public void add(int index, E element) {
    // Index bounds check
    checkPositionIndex(index);

    // Check whether index is at the tail position of the list
    if (index == size)
        // If so, directly call linkLast to append the node to the end of the list
        linkLast(element);
    else
        // Otherwise, call linkBefore to insert it before the specified node
        linkBefore(element, node(index));
}

// Links an element node at the end of the linked list
void linkLast(E e) {
    // Assign the last node reference to l
    final Node<E> l = last;
    // Create the new node with predecessor set to tail node last and successor set to null
    final Node<E> newNode = new Node<>(l, e, null);
    // Point last to the new node
    last = newNode;
    // Check whether the previous tail node was null
    // If l is null, this is the first element added
    if (l == null)
        // If adding for the first time, assign first to newNode (list now has one element)
        first = newNode;
    else
        // Otherwise, set next of l (the previous last node) to newNode
        l.next = newNode;
    size++;
    modCount++;
}

// Inserts an element before the specified node succ
void linkBefore(E e, Node<E> succ) {
    // assert succ != null;
    // Save succ's prev reference (its predecessor node)
    final Node<E> pred = succ.prev;
    // Initialize the new node with predecessor and successor specified
    final Node<E> newNode = new Node<>(pred, e, succ);
    // Point succ's prev reference to the new node
    succ.prev = newNode;
    // Check whether predecessor is null; if null, succ was the first node
    if (pred == null)
        // The new node becomes the first node
        first = newNode;
    else
        // Point the predecessor's next reference to the new node
        pred.next = newNode;
    size++;
    modCount++;
}
```

### Retrieving Elements

`LinkedList` has 3 methods related to retrieving elements:

1. `getFirst()`: Returns the first element in the linked list.
2. `getLast()`: Returns the last element in the linked list.
3. `get(int index)`: Returns the element at the specified position in the linked list.

```java
// Returns the first element in the linked list
public E getFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return f.item;
}

// Returns the last element in the linked list
public E getLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return l.item;
}

// Returns the element at the specified position in the linked list
public E get(int index) {
  // Index bounds check; throws an exception if out of bounds
  checkElementIndex(index);
  // Return the element corresponding to index in the linked list
  return node(index).item;
}
```

The core here lies in the `node(int index)` method:

```java
// Returns the non-null node at the specified index
Node<E> node(int index) {
    // Assert index is within bounds
    // assert isElementIndex(index);
    // If index < size / 2, traverse forward from the head; otherwise, traverse backward from the tail
    if (index < (size >> 1)) {
        Node<E> x = first;
        // Traverse forward until i == index
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else {
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

Methods such as `get(int index)` and `remove(int index)` invoke this method internally to locate the corresponding node.

From the source code of this method, we can see that it compares `index` against half of the list's `size` to decide whether to start traversing from the head or from the tail. If the index is less than half of `size`, it traverses from the head; otherwise, it traverses from the tail. This locates the target node in shorter time, making full use of the doubly linked list's properties to improve efficiency.

### Removing Elements

`LinkedList` has 5 methods related to removing elements:

1. `removeFirst()`: Removes and returns the first element from the linked list.
2. `removeLast()`: Removes and returns the last element from the linked list.
3. `remove(E e)`: Removes the first occurrence of the specified element from the linked list; returns `false` if it does not exist.
4. `remove(int index)`: Removes the element at the specified index and returns its value.
5. `void clear()`: Removes all elements from this linked list.

```java
// Removes and returns the first element from the linked list
public E removeFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return unlinkFirst(f);
}

// Removes and returns the last element from the linked list
public E removeLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return unlinkLast(l);
}

// Removes the first occurrence of the specified element; returns false if absent
public boolean remove(Object o) {
    // If the target element is null, traverse the list and remove the first null item
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        // If non-null, traverse the list to find the matching node to remove
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}

// Removes the element at the specified position in the linked list
public E remove(int index) {
    // Index bounds check; throws an exception if out of bounds
    checkElementIndex(index);
    return unlink(node(index));
}
```

The core here lies in the `unlink(Node<E> x)` method:

```java
E unlink(Node<E> x) {
    // Assert x is not null
    // assert x != null;
    // Get the element of the current node (the node to be removed)
    final E element = x.item;
    // Get the next node of the current node
    final Node<E> next = x.next;
    // Get the previous node of the current node
    final Node<E> prev = x.prev;

    // If prev is null, the current node is the head node
    if (prev == null) {
        // Point first directly to the next node of the current node
        first = next;
    } else { // If prev is not null
        // Point the previous node's next pointer to the current node's next node
        prev.next = next;
        // Set the current node's prev pointer to null to help GC reclaim it
        x.prev = null;
    }

    // If next is null, the current node is the tail node
    if (next == null) {
        // Point last directly to the previous node of the current node
        last = prev;
    } else { // If next is not null
        // Point the next node's prev pointer to the current node's previous node
        next.prev = prev;
        // Set the current node's next pointer to null to help GC reclaim it
        x.next = null;
    }

    // Set the current node's item to null to help GC reclaim it
    x.item = null;
    size--;
    modCount++;
    return element;
}
```

The logic of the `unlink()` method is as follows:

1. First retrieve the predecessor and successor nodes of the node `x` to be removed;
2. Check whether the node to be removed is the head or tail node:
   - If `x` is the head node, point `first` to `x`'s successor node `next`
   - If `x` is the tail node, point `last` to `x`'s predecessor node `prev`
   - If `x` is neither the head nor the tail node, proceed to the next steps
3. Point the successor reference of `x`'s predecessor to `x`'s successor `next`, breaking the link between `x` and `x.prev`;
4. Point the predecessor reference of `x`'s successor to `x`'s predecessor `prev`, breaking the link between `x` and `x.next`;
5. Set the element of `x` to `null` and update the list size.

You can refer to the diagram below to understand this (Image source: [LinkedList Source Code Analysis (JDK 1.8)](https://www.tianxiaobo.com/2018/01/31/LinkedList-%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90-JDK-1-8/)):

![unlink method logic](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedlist-unlink-e57a9bf4.jpg)

### Traversing the Linked List

It is recommended to use a `for-each` loop to iterate over elements in `LinkedList`, as a `for-each` loop is compiled into iterator form under the hood.

```java
LinkedList<String> list = new LinkedList<>();
list.add("apple");
list.add("banana");
list.add("pear");

for (String fruit : list) {
    System.out.println(fruit);
}
```

The core of traversing a `LinkedList` lies in its iterator implementation.

```java
// Bidirectional iterator
private class ListItr implements ListIterator<E> {
    // Represents the node returned by the last call to next() or previous()
    private Node<E> lastReturned;
    // Represents the next node to be traversed
    private Node<E> next;
    // Represents the index of the next node to be traversed (i.e., the index of the current node's successor)
    private int nextIndex;
    // Represents the expected modification count during iteration, compared with LinkedList's modCount to detect concurrent modifications
    private int expectedModCount = modCount;
    ......
}
```

Let's examine the core methods of the `ListItr` iterator in detail.

First, let's look at forward iteration from head to tail:

```java
// Checks if there is a next node
public boolean hasNext() {
    // If nextIndex is less than the list size, there is still a next element to traverse
    return nextIndex < size;
}
// Returns the next node's element
public E next() {
    // Check whether the list was modified during iteration
    checkForComodification();
    // If there is no next node to traverse, throw NoSuchElementException
    if (!hasNext())
        throw new NoSuchElementException();
    // Point lastReturned to the current node
    lastReturned = next;
    // Advance next to the following node
    next = next.next;
    nextIndex++;
    return lastReturned.item;
}
```

Next, let's look at backward iteration from tail to head:

```java
// Checks if there is a previous node
public boolean hasPrevious() {
    return nextIndex > 0;
}

// Returns the previous node's element
public E previous() {
    // Check whether the list was modified during iteration
    checkForComodification();
    // If there is no previous node, throw an exception
    if (!hasPrevious())
        throw new NoSuchElementException();
    // Point both lastReturned and next to the previous node
    lastReturned = next = (next == null) ? last : next.prev;
    nextIndex--;
    return lastReturned.item;
}
```

If you need to remove or insert elements during traversal, you can also perform the operation through the iterator.

```java
LinkedList<String> list = new LinkedList<>();
list.add("apple");
list.add(null);
list.add("banana");

// Collection's removeIf method is still backed by an iterator under the hood
list.removeIf(Objects::isNull);

for (String fruit : list) {
    System.out.println(fruit);
}
```

The iterator's element-removal method is as follows:

```java
// Removes from the list the last element returned by the iterator
public void remove() {
    // Check whether the list was modified during iteration
    checkForComodification();
    // If lastReturned is null, throw an exception
    if (lastReturned == null)
        throw new IllegalStateException();

    // Get the node following lastReturned
    Node<E> lastNext = lastReturned.next;
    // Unlink the last returned node from the list
    unlink(lastReturned);
    // Update pointers
    if (next == lastReturned)
        next = lastNext;
    else
        nextIndex--;
    // Set lastReturned to null to help GC reclaim it
    lastReturned = null;
    expectedModCount++;
}
```

## Testing Common Methods of LinkedList

Code:

```java
// Create a LinkedList object
LinkedList<String> list = new LinkedList<>();

// Append elements to the end of the linked list
list.add("apple");
list.add("banana");
list.add("pear");
System.out.println("List contents: " + list);

// Insert an element at the specified position
list.add(1, "orange");
System.out.println("List contents: " + list);

// Get the element at the specified position
String fruit = list.get(2);
System.out.println("Element at index 2: " + fruit);

// Update the element at the specified position
list.set(3, "grape");
System.out.println("List contents: " + list);

// Remove the element at the specified position
list.remove(0);
System.out.println("List contents: " + list);

// Remove the first occurrence of the specified element
list.remove("banana");
System.out.println("List contents: " + list);

// Get the length of the linked list
int size = list.size();
System.out.println("List length: " + size);

// Clear the linked list
list.clear();
System.out.println("List after clear: " + list);
```

Output:

```plain
Element at index 2: banana
List contents: [apple, orange, banana, grape]
List contents: [orange, banana, grape]
List contents: [orange, grape]
List length: 2
List after clear: []
```
