---
title: Java Collections Common Interview Questions Summary (Part 1)
description: "Java Collections Framework interview questions summary: in-depth analysis of Collection/List/Set/Queue interfaces, comparison of common collection classes such as ArrayList/LinkedList/HashMap, and mastery of underlying data structures and use cases."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/java-collection-questions-01.md
head:
  - - meta
    - name: keywords
      content: Java Collections,Collection,List,Set,Queue,ArrayList,LinkedList,HashMap,Collections Framework,Java interview questions
---

<!-- markdownlint-disable MD024 -->

## Collections Overview

### Java Collections Overview

Java collections, also known as containers, are primarily derived from two main interfaces: the `Collection` interface, which is mainly used to store single elements, and the `Map` interface, which is mainly used to store key-value pairs. Under the `Collection` interface, there are three major sub-interfaces: `List`, `Set`, and `Queue`.

The Java Collections Framework is illustrated in the diagram below:

![Java Collections Framework Overview](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java-collection-hierarchy-04d68439.png)

Note: The diagram only lists the main inheritance and derivation relationships and does not enumerate every relationship. For example, abstract classes such as `AbstractList` and `NavigableSet` as well as other helper classes are omitted; if you wish to explore further, you can inspect the source code directly.

### ⭐️ What are the differences between List, Set, Queue, and Map?

- `List` (a great helper for managing order): Stores elements that are ordered and may contain duplicates.
- `Set` (focused on uniqueness): Stores elements that cannot contain duplicates.
- `Queue` (a ticket-calling machine for queuing): Determines ordering according to specific queuing rules; stores elements that are ordered and may contain duplicates.
- `Map` (an expert at searching by key): Stores key-value pairs, similar to the mathematical function y=f(x), where "x" represents the key and "y" represents the value. Keys are unordered and non-duplicate, values are unordered and may be duplicated, and each key maps to at most one value. Note that "unordered" here refers to implementations like `HashMap`—there is no explicit ordering relationship between key-value pairs. Implementations such as `LinkedHashMap` and `TreeMap`, on the other hand, are ordered; they maintain the order of key-value pairs via additional data structures (a doubly linked list or a Red-Black Tree).

### Summary of Underlying Data Structures in the Collections Framework

First, let's look at the collections under the `Collection` interface.

#### List

- `ArrayList`: `Object[]` array. For details, see: [ArrayList Source Code Analysis](./arraylist-source-code.md).
- `Vector`: `Object[]` array.
- `LinkedList`: Doubly linked list (circular linked list prior to JDK 1.6; circularity was removed in JDK 1.7). For details, see: [LinkedList Source Code Analysis](./linkedlist-source-code.md).

#### Set

- `HashSet` (unordered, unique): Implemented based on `HashMap`, using `HashMap` underneath to store elements.
- `LinkedHashSet`: `LinkedHashSet` is a subclass of `HashSet`, and internally it is implemented via `LinkedHashMap`.
- `TreeSet` (ordered, unique): Red-Black Tree (a self-balancing sorted binary tree).

#### Queue

- `PriorityQueue`: Uses an `Object[]` array to implement a min-heap (see `java.util.PriorityQueue`).
- `DelayQueue`: `PriorityQueue`. For details, see: [DelayQueue Source Code Analysis](./delayqueue-source-code.md).
- `ArrayDeque`: Resizable dynamic double-ended array.

Next, let's look at the collections under the `Map` interface.

#### Map

- `HashMap`: Prior to JDK 1.8, `HashMap` consisted of an array + linked lists, where the array was the main body of `HashMap` and linked lists existed primarily to resolve hash collisions ("separate chaining" for collision resolution). Starting from JDK 1.8, there was a major change in resolving hash collisions: when the linked list length exceeds the threshold (default is 8) (before converting the linked list to a Red-Black Tree, it checks whether the current array length is less than 64; if so, it chooses to resize the array first instead of converting to a Red-Black Tree), the linked list is converted into a Red-Black Tree to reduce search time. For details, see: [HashMap Source Code Analysis](./hashmap-source-code.md); for basic concepts, you can read [Hash Table Interview Questions Summary](../../cs-basics/data-structure/hash-table.md) first.
- `LinkedHashMap`: `LinkedHashMap` inherits from `HashMap`, so its underlying structure is still based on a separate-chaining hash structure, i.e., composed of an array and linked lists or Red-Black Trees. Additionally, `LinkedHashMap` adds a doubly linked list on top of that structure so it can preserve the insertion order of key-value pairs. At the same time, by performing corresponding operations on the linked list, it implements access-order related logic. For details, see: [LinkedHashMap Source Code Analysis](./linkedhashmap-source-code.md); for LRU coding problems, see [LRU Cache Interview Questions Summary](../../cs-basics/data-structure/lru-cache.md).
- `Hashtable`: Composed of an array + linked lists, where the array is the main body of `Hashtable` and linked lists exist primarily to resolve hash collisions.
- `TreeMap`: Red-Black Tree (a self-balancing sorted binary tree).

### How to Choose a Collection?

We mainly select an appropriate collection based on the characteristics of the collections. For example:

- When we need to retrieve an element value based on a key, choose a collection under the `Map` interface: select `TreeMap` when sorting is needed, `HashMap` when sorting is not needed, and `ConcurrentHashMap` when thread safety is required.
- When we only need to store element values, choose a collection implementing the `Collection` interface: select a collection implementing `Set` such as `TreeSet` or `HashSet` when element uniqueness must be guaranteed; otherwise select an implementation of `List` such as `ArrayList` or `LinkedList`, and then choose among them based on the specific characteristics of those implementations.

### Why Use Collections?

When we need to store a group of data of the same type, an array is one of the most common and fundamental containers. However, using arrays to store objects has some shortcomings, because in real-world development, the types of data to store are diverse and the quantities are uncertain. This is where Java collections come into play. Compared with arrays, Java collections provide a more flexible and effective way to store multiple data objects. The various collection classes and interfaces in the Java Collections Framework can store objects of different types and quantities, while also offering diverse ways to operate on them. Compared to arrays, the advantages of Java collections lie in their variable size, support for generics, built-in algorithms, and more. Overall, Java collections improve the flexibility of data storage and processing, can better adapt to diverse data requirements in modern software development, and support writing high-quality code.

## List

### ⭐️ What are the differences between ArrayList and Array?

`ArrayList` is internally implemented based on a dynamic array, making it more flexible to use than `Array` (a static array):

- `ArrayList` dynamically resizes according to the elements actually stored, and can also proactively shrink the underlying array via `trimToSize()`, whereas once an `Array` is created, its length cannot be changed.
- `ArrayList` allows you to use generics to ensure type safety, whereas `Array` does not.
- `ArrayList` can only store objects. For primitive data types, their corresponding wrapper classes (such as `Integer`, `Double`, etc.) must be used. `Array` can directly store primitive data types as well as objects.
- `ArrayList` supports common operations such as insertion, deletion, and traversal, and provides rich API methods such as `add()`, `remove()`, etc. `Array` is only a fixed-length array that allows accessing elements by index and does not have the capability to dynamically add or remove elements.
- `ArrayList` does not require specifying a size upon creation, whereas `Array` must have its size specified when created.

Below is a simple comparison of how the two are used:

`Array`:

```java
 // Initialize an array of type String
 String[] stringArr = new String[]{"hello", "world", "!"};
 // Modify the value of an array element
 stringArr[0] = "goodbye";
 System.out.println(Arrays.toString(stringArr));// [goodbye, world, !]
 // Delete an element from the array; subsequent elements must be shifted manually
 for (int i = 0; i < stringArr.length - 1; i++) {
     stringArr[i] = stringArr[i + 1];
 }
 stringArr[stringArr.length - 1] = null;
 System.out.println(Arrays.toString(stringArr));// [world, !, null]
```

`ArrayList`:

```java
// Initialize an ArrayList of type String
 ArrayList<String> stringList = new ArrayList<>(Arrays.asList("hello", "world", "!"));
// Add an element to the ArrayList
 stringList.add("goodbye");
 System.out.println(stringList);// [hello, world, !, goodbye]
 // Modify an element in the ArrayList
 stringList.set(0, "hi");
 System.out.println(stringList);// [hi, world, !, goodbye]
 // Remove an element from the ArrayList
 stringList.remove(0);
 System.out.println(stringList); // [world, !, goodbye]
```

### What are the differences between ArrayList and Vector? (Good to know)

- `ArrayList` is the primary implementation class of `List`; it uses `Object[]` underneath for storage, is suitable for frequent lookup operations, and is not thread-safe.
- `Vector` is a legacy implementation class of `List`; it uses `Object[]` underneath for storage and is thread-safe.

### What are the differences between Vector and Stack? (Good to know)

- Both `Vector` and `Stack` are thread-safe, and both use the `synchronized` keyword for synchronization.
- `Stack` inherits from `Vector` and is a Last-In-First-Out (LIFO) stack, whereas `Vector` is a list.

With the development of Java concurrent programming, `Vector` and `Stack` have become obsolete; it is recommended to use concurrent collection classes (such as `ConcurrentHashMap`, `CopyOnWriteArrayList`, etc.) or manually implement thread-safe approaches to provide safe multi-threaded operation support.

### Can ArrayList store null values?

`ArrayList` can store objects of any type, including `null`. However, adding `null` values to `ArrayList` is not recommended; `null` values are meaningless and make code harder to maintain—for instance, forgetting to perform a null check can lead to a `NullPointerException`.

Example code:

```java
ArrayList<String> listOfStrings = new ArrayList<>();
listOfStrings.add(null);
listOfStrings.add("java");
System.out.println(listOfStrings);
```

Output:

```plain
[null, java]
```

### ⭐️ What is the time complexity of inserting and deleting elements in ArrayList?

For insertion:

- Inserting at the head: Because all elements must be shifted one position backward in sequence, the time complexity is O(n).
- Inserting at the tail: When `ArrayList` has not reached its capacity limit, inserting an element at the end of the list takes O(1) time, because it simply appends an element at the end of the array; when the capacity limit is reached and resizing is required, an O(n) operation is needed to copy the original array into a new larger array, followed by an O(1) operation to add the element.
- Inserting at a specified position: All elements after the target position must be shifted one position backward, and then the new element is placed at the specified position. This process requires shifting an average of n/2 elements, so the time complexity is O(n).

For deletion:

- Deleting from the head: Because all elements must be shifted one position forward in sequence, the time complexity is O(n).
- Deleting from the tail: When the element being deleted is at the end of the list, the time complexity is O(1).
- Deleting at a specified position: All elements after the target element must be shifted one position forward to fill the gap left by the deleted element, so an average of n/2 elements need to be moved, giving a time complexity of O(n).

Here is a simple example:

```java
// The underlying array size of ArrayList is 10, and 7 elements are currently stored
+---+---+---+---+---+---+---+---+---+---+
| 1 | 2 | 3 | 4 | 5 | 6 | 7 |   |   |   |
+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9
// Insert element 8 at index 1; all elements after it must shift one position to the right
+---+---+---+---+---+---+---+---+---+---+
| 1 | 8 | 2 | 3 | 4 | 5 | 6 | 7 |   |   |
+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9
// Delete the element at index 1; all elements after it must shift one position to the left
+---+---+---+---+---+---+---+---+---+---+
| 1 | 2 | 3 | 4 | 5 | 6 | 7 |   |   |   |
+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9
```

### ⭐️ What is the time complexity of inserting and deleting elements in LinkedList?

- Head insertion/deletion: Only the head node's pointer needs to be modified to complete the insertion/deletion operation, so the time complexity is O(1).
- Tail insertion/deletion: Only the tail node's pointer needs to be modified to complete the insertion/deletion operation, so the time complexity is O(1).
- Insertion/deletion at a specified position: You must first traverse to the specified position and then modify the pointers of the specified node to complete the insertion/deletion. However, since both head and tail pointers exist, traversal can start from whichever pointer is closer, requiring traversal of an average of n/4 elements, so the time complexity is O(n).

Here is a simple example: if we want to delete node 9, we first need to traverse the linked list to find that node. Then, we update the pointers of the corresponding nodes. For specific source code, refer to: [LinkedList Source Code Analysis](https://javaguide.cn/java/collection/linkedlist-source-code.html).

![unlink method logic](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedlist-unlink-e57a9bf4.jpg)

### Why cannot LinkedList implement the RandomAccess interface?

`RandomAccess` is a marker interface used to indicate that classes implementing this interface support random access (i.e., elements can be accessed quickly by index). Since the underlying data structure of `LinkedList` is a linked list whose memory addresses are not contiguous, it can only locate elements via pointers and does not support fast random access; therefore, it cannot implement the `RandomAccess` interface.

### ⭐️ What are the differences between ArrayList and LinkedList?

- **Thread safety:** Neither `ArrayList` nor `LinkedList` is synchronized, meaning neither guarantees thread safety.
- **Underlying data structure:** `ArrayList` uses an **`Object` array** underneath; `LinkedList` uses a **doubly linked list** data structure underneath (prior to JDK 1.6 it was a circular linked list, and JDK 1.7 removed the circularity. Note the difference between a doubly linked list and a circular doubly linked list, which is explained below!).
- **Whether insertion and deletion are affected by element position:**
  - `ArrayList` uses array storage, so the time complexity of inserting and deleting elements is affected by element position. For example, when calling `add(E e)`, `ArrayList` appends the specified element to the end of the list by default, in which case the time complexity is O(1). However, if inserting or deleting an element at a specified position `i` (`add(int index, E element)`), the time complexity is O(n), because during this operation the i-th element and the (n-i) elements after it in the collection all need to be shifted one position backward/forward.
  - `LinkedList` uses linked list storage, so inserting or deleting elements at the head or tail is unaffected by element position (`add(E e)`, `addFirst(E e)`, `addLast(E e)`, `removeFirst()`, `removeLast()`), with a time complexity of O(1). If inserting or deleting an element at a specified position `i` (`add(int index, E element)`, `remove(Object o)`, `remove(int index)`), the time complexity is O(n), because it must first move to the specified position before inserting or deleting.
- **Whether fast random access is supported:** `LinkedList` does not support efficient random access to elements, whereas `ArrayList` (which implements the `RandomAccess` interface) does. Fast random access means quickly retrieving an element object by its index (corresponding to the `get(int index)` method).
- **Memory space consumption:** The space overhead of `ArrayList` mainly lies in reserving a certain amount of capacity at the end of the list, whereas the space cost of `LinkedList` lies in the fact that each of its elements consumes more space than in `ArrayList` (because it needs to store the direct successor, the direct predecessor, and the data itself).

In real projects, we generally do not use `LinkedList`; almost every scenario where `LinkedList` might be used can be replaced by `ArrayList`, and performance is usually better! Even `LinkedList`'s author, Josh Bloch himself, said he never uses `LinkedList`.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redisimage-20220412110853807-8b87ce5d.png)

In addition, do not subconsciously assume that `LinkedList` is the best choice for insertion and deletion scenarios simply because it is a linked list. As mentioned above, `LinkedList` only achieves roughly O(1) time complexity when inserting or deleting elements at the head or tail; in other cases, the average time complexity of inserting or deleting elements is O(n).

#### Supplementary Content: Doubly Linked List and Circular Doubly Linked List

**Doubly linked list:** Contains two pointers—a `prev` pointer pointing to the previous node and a `next` pointer pointing to the next node.

![Doubly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-linkedlist-a47e8dae.png)

**Circular doubly linked list:** The `next` of the last node points to `head`, and the `prev` of `head` points to the last node, forming a cycle.

![Circular Doubly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-circular-linkedlist-236d879c.png)

#### Supplementary Content: The RandomAccess Interface

```java
public interface RandomAccess {
}
```

Inspecting the source code, we find that nothing is actually defined inside the `RandomAccess` interface. So in my view, the `RandomAccess` interface is merely a marker. What does it mark? It marks that a class implementing this interface has random access capability.

In the `binarySearch()` method, it checks whether the passed-in `list` is an instance of `RandomAccess`; if it is, it calls `indexedBinarySearch()`, and if not, it calls `iteratorBinarySearch()`:

```java
    public static <T>
    int binarySearch(List<? extends Comparable<? super T>> list, T key) {
        if (list instanceof RandomAccess || list.size()<BINARYSEARCH_THRESHOLD)
            return Collections.indexedBinarySearch(list, key);
        else
            return Collections.iteratorBinarySearch(list, key);
    }
```

`ArrayList` implements the `RandomAccess` interface, while `LinkedList` does not. Why? I think it still comes down to the underlying data structure! `ArrayList` is backed by an array, whereas `LinkedList` is backed by a linked list. An array naturally supports random access with O(1) time complexity, which is why it is called fast random access. A linked list must traverse to a specific position to access the element at that position, with O(n) time complexity, so it does not support fast random access. `ArrayList` implements the `RandomAccess` interface to indicate that it possesses fast random access capability. The `RandomAccess` interface is just a marker—it is not that implementing `RandomAccess` gives `ArrayList` its fast random access capability!

### ⭐️ Explain the resizing mechanism of ArrayList

For details, see the author's article: [ArrayList Resizing Mechanism Analysis](https://javaguide.cn/java/collection/arraylist-source-code.html#arraylist-扩容机制分析).

### ⭐️ What are fail-fast and fail-safe in collections?

`fail-fast` and `fail-safe` are two diametrically opposed design philosophies and fault-tolerance strategies in the Java Collections Framework when handling concurrent modification issues.

Regarding `fail-fast`, here is a quote from an article on Medium about `fail-fast` and `fail-safe`:

> Fail-fast systems are designed to immediately stop functioning upon encountering an unexpected condition. This immediate failure helps to catch errors early, making debugging more straightforward.

The idea of fail-fast is to surface failures early and stop execution when a potential exception occurs; by detecting and halting errors as early as possible, it reduces the risk of cascading system failures.

Most collections under the `java.util` package (such as `ArrayList` and `HashMap`) are not thread-safe. In order to detect thread-safety risks caused by concurrent operations early, they maintain a `modCount` field to record the number of modifications. During iteration, they compare whether the expected modification count `expectedModCount` matches `modCount` to determine whether concurrent modification has occurred, thereby achieving fail-fast behavior and avoiding executing unnecessary complex code under abnormal conditions.

**ArrayList (fail-fast) example:**

```java
     // Use the non-thread-safe ArrayList, which is a fail-fast collection
      List<Integer> list = new ArrayList<>();
      CountDownLatch latch = new CountDownLatch(2);

      for (int i = 0; i < 5; i++) {
          list.add(i);
      }
      System.out.println("Initial list: " + list);

      Thread t1 = new Thread(() -> {
          try {
              for (Integer i : list) {
                  System.out.println("Iterator Thread (t1) sees: " + i);
                  Thread.sleep(100);
              }
          } catch (ConcurrentModificationException e) {
              System.err.println("!!! Iterator Thread (t1) caught ConcurrentModificationException as expected.");
          } catch (InterruptedException e) {
              e.printStackTrace();
          } finally {
              latch.countDown();
          }
      });

      Thread t2 = new Thread(() -> {
          try {
              Thread.sleep(50);
              System.out.println("-> Modifier Thread (t2) is removing element 1...");
              list.remove(Integer.valueOf(1));
              System.out.println("-> Modifier Thread (t2) finished removal.");
          } catch (InterruptedException e) {
              e.printStackTrace();
          } finally {
              latch.countDown();
          }
      });

      t1.start();
      t2.start();
      latch.await();

      System.out.println("Final list state: " + list);
```

Output:

```
Initial list: [0, 1, 2, 3, 4]
Iterator Thread (t1) sees: 0
-> Modifier Thread (t2) is removing element 1...
-> Modifier Thread (t2) finished removal.
!!! Iterator Thread (t1) caught ConcurrentModificationException as expected.
Final list state: [0, 2, 3, 4]
```

After thread `t2` modifies the list, thread `t1` immediately throws a `ConcurrentModificationException` on its next iteration step. This is because `ArrayList`'s iterator checks whether `modCount` has changed on every `next()` call. Once it discovers that the collection was modified without the iterator's knowledge, it immediately "fails fast" to prevent continuing operations on inconsistent data and causing unpredictable consequences.

To illustrate this, here is the `next` method used by the underlying iterator of a `for` loop to retrieve the next element, where `checkForComodification` implements the modification-count comparison logic:

```java
 public E next() {
 			// Check whether concurrent modification occurred
            checkForComodification();
            //......
            // Return the next element
            return (E) elementData[lastRet = i];
        }

final void checkForComodification() {
		// When the current modification count differs from the expected modification count, throw ConcurrentModificationException
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }

```

In contrast, `fail-safe` aims to recover and continue running even in the face of unexpected situations, making it especially suitable for uncertain or volatile environments:

> Fail-safe systems take a different approach, aiming to recover and continue even in the face of unexpected conditions. This makes them particularly suited for uncertain or volatile environments.

This idea is commonly used in concurrent containers, with the most classic implementation being `CopyOnWriteArrayList`. Through the Copy-On-Write concept, when a modification operation is performed, a snapshot copy is created; after completing the add or remove operation on this snapshot, the underlying array reference of `CopyOnWriteArrayList` is pointed to this new array space. This avoids concurrency-safety issues caused by concurrent modifications interfering with iteration. Of course, this approach also has a drawback: real-time results cannot be observed during traversal:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/fail-fast-and-fail-safe-copyonwritearraylist-2217c50a.png)

Accordingly, here is the core code by which `CopyOnWriteArrayList` implements `fail-safe`. We can see that it retrieves the array reference via `getArray`, creates a snapshot of the array via `Arrays.copyOf`, performs the add operation on this snapshot, and then updates the underlying `array` variable to point to the new array reference, thereby completing Copy-On-Write:

```java
public boolean add(E e) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
        	// Get the original array
            Object[] elements = getArray();
            int len = elements.length;
            // Copy a memory snapshot based on the original array
            Object[] newElements = Arrays.copyOf(elements, len + 1);
            // Perform the add operation
            newElements[len] = e;
            // Point array to the new array
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
```

## Set

### Differences between Comparable and Comparator

Both the `Comparable` interface and the `Comparator` interface are interfaces used for sorting in Java, and they play an important role in comparing and sorting objects of implementing classes:

- The `Comparable` interface comes from the `java.lang` package and has a `compareTo(Object obj)` method used for sorting.
- The `Comparator` interface comes from the `java.util` package and has a `compare(Object obj1, Object obj2)` method used for sorting.

Generally, when we need to apply custom sorting to a collection, we override the `compareTo()` method or the `compare()` method. When we need to implement two sorting criteria for a collection—for instance, sorting a `song` object separately by song title and by singer name—we can override the `compareTo()` method and use a custom `Comparator`, or use two `Comparator` instances to implement sorting by song title and sorting by singer name; the second approach means we can only use the two-argument version of `Collections.sort()`.

#### Custom Sorting with Comparator

```java
ArrayList<Integer> arrayList = new ArrayList<Integer>();
arrayList.add(-1);
arrayList.add(3);
arrayList.add(3);
arrayList.add(-5);
arrayList.add(7);
arrayList.add(4);
arrayList.add(-9);
arrayList.add(-7);
System.out.println("原始数组:");
System.out.println(arrayList);
// void reverse(List list): reverse the list
Collections.reverse(arrayList);
System.out.println("Collections.reverse(arrayList):");
System.out.println(arrayList);

// void sort(List list): sort in ascending natural order
Collections.sort(arrayList);
System.out.println("Collections.sort(arrayList):");
System.out.println(arrayList);
// Usage of custom sorting
Collections.sort(arrayList, new Comparator<Integer>() {
    @Override
    public int compare(Integer o1, Integer o2) {
        return o2.compareTo(o1);
    }
});
System.out.println("定制排序后：");
System.out.println(arrayList);
```

Output:

```plain
原始数组:
[-1, 3, 3, -5, 7, 4, -9, -7]
Collections.reverse(arrayList):
[-7, -9, 4, 7, -5, 3, 3, -1]
Collections.sort(arrayList):
[-9, -7, -5, -1, 3, 3, 4, 7]
定制排序后：
[7, 4, 3, 3, -1, -5, -7, -9]
```

#### Overriding the compareTo Method to Sort by Age

```java
// The Person class does not implement Comparable by default, so it must implement it to avoid errors and allow TreeMap data to be ordered
// The String class in the previous example already implements Comparable by default; see the String API docs for details, and others
// like Integer also implement Comparable, so no extra implementation is needed
public  class Person implements Comparable<Person> {
    private String name;
    private int age;

    public Person(String name, int age) {
        super();
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    /**
     * Override compareTo method to sort by age
     */
    @Override
    public int compareTo(Person o) {
        if (this.age > o.getAge()) {
            return 1;
        }
        if (this.age < o.getAge()) {
            return -1;
        }
        return 0;
    }
}

```

```java
    public static void main(String[] args) {
        TreeMap<Person, String> pdata = new TreeMap<Person, String>();
        pdata.put(new Person("张三", 30), "zhangsan");
        pdata.put(new Person("李四", 20), "lisi");
        pdata.put(new Person("王五", 10), "wangwu");
        pdata.put(new Person("小红", 5), "xiaohong");
        // Get the key values along with the values corresponding to each key
        Set<Person> keys = pdata.keySet();
        for (Person key : keys) {
            System.out.println(key.getAge() + "-" + key.getName());

        }
    }
```

Output:

```plain
5-小红
10-王五
20-李四
30-张三
```

### What do unorderedness and non-duplicability mean?

- Unorderedness does not equal randomness. Unorderedness means that stored data is not added to the underlying array in the order of array indices, but rather determined by the hash value of the data.
- Non-duplicability means that when an added element is compared via `equals()`, it returns `false`; both `equals()` and `hashCode()` need to be overridden.

### Compare the similarities and differences among HashSet, LinkedHashSet, and TreeSet

- `HashSet`, `LinkedHashSet`, and `TreeSet` are all implementation classes of the `Set` interface, all guarantee element uniqueness, and none of them are thread-safe.
- The main difference among `HashSet`, `LinkedHashSet`, and `TreeSet` lies in their underlying data structures. The underlying data structure of `HashSet` is a hash table (implemented based on `HashMap`). The underlying data structure of `LinkedHashSet` is a linked list and a hash table, so element insertion and retrieval order follow FIFO. The underlying data structure of `TreeSet` is a Red-Black Tree; its elements are ordered, and sorting can be done via natural ordering or custom ordering.
- Different underlying data structures lead to different use cases for these three classes. `HashSet` is used when element insertion and retrieval order do not need to be guaranteed; `LinkedHashSet` is used when element insertion and retrieval order must satisfy FIFO; and `TreeSet` is used when custom sorting rules for elements need to be supported.

## Queue

### Differences between Queue and Deque

`Queue` is a single-ended queue where elements can only be inserted at one end and removed from the other end, generally following the **First-In-First-Out (FIFO)** rule in its implementation.

`Queue` extends the `Collection` interface and provides two sets of methods depending on **how failure due to capacity constraints is handled**: one throws an exception upon failure, while the other returns a special value.

| `Queue` Interface | Throws Exception | Returns Special Value |
| ----------------- | ---------------- | --------------------- |
| Insert at tail    | add(E e)         | offer(E e)            |
| Remove from head  | remove()         | poll()                |
| Inspect head      | element()        | peek()                |

`Deque` is a double-ended queue in which elements can be inserted or removed at both ends of the queue.

`Deque` extends the `Queue` interface and adds methods for inserting and removing at the head and tail, likewise divided into two categories depending on how failure is handled:

| `Deque` Interface | Throws Exception | Returns Special Value |
| ----------------- | ---------------- | --------------------- |
| Insert at head    | addFirst(E e)    | offerFirst(E e)       |
| Insert at tail    | addLast(E e)     | offerLast(E e)        |
| Remove from head  | removeFirst()    | pollFirst()           |
| Remove from tail  | removeLast()     | pollLast()            |
| Inspect head      | getFirst()       | peekFirst()           |
| Inspect tail      | getLast()        | peekLast()            |

In fact, `Deque` also provides methods such as `push()` and `pop()`, which can be used to simulate a stack.

### Differences between ArrayDeque and LinkedList

Both `ArrayDeque` and `LinkedList` implement the `Deque` interface and both provide queue functionality, so what are the differences between them?

- `ArrayDeque` is implemented based on a resizable array and two pointers, whereas `LinkedList` is implemented via a linked list.

- `ArrayDeque` does not support storing `NULL` data, whereas `LinkedList` does.

- `ArrayDeque` was introduced in JDK 1.6, whereas `LinkedList` has existed since JDK 1.2.

- `ArrayDeque` may undergo resizing during insertion, though the amortized insertion operation is still O(1). Although `LinkedList` does not require resizing, each insertion requires allocating new heap memory, making its amortized performance slower by comparison.

From a performance perspective, choosing `ArrayDeque` to implement a queue is better than `LinkedList`. In addition, `ArrayDeque` can also be used to implement a stack.

### Explain PriorityQueue

`PriorityQueue` was introduced in JDK 1.5. Its difference from `Queue` is that the dequeue order of elements is related to priority—that is, the element with the highest priority is always dequeued first.

Here are some key points about it:

- `PriorityQueue` is implemented using a binary heap data structure and uses a resizable array underneath to store data.
- Through sifting up (percolate up) and sifting down (percolate down) heap elements, `PriorityQueue` achieves O(logn) time complexity for inserting elements and deleting the top element of the heap.
- `PriorityQueue` is not thread-safe and does not support storing `NULL`. When no `Comparator` is provided, elements must implement `Comparable`; when a `Comparator` is provided, elements must be mutually comparable by that comparator.
- `PriorityQueue` defaults to a min-heap, but it can accept a `Comparator` as a constructor argument to customize the priority ordering of elements.

In interviews, `PriorityQueue` appears more frequently in live coding algorithm problems—typical problems include heap sort, finding the K-th largest element, weighted graph traversal, etc.—so you need to be proficient in using it.

If you want to review heap and Top K algorithm templates first, you can check out [Heap Explained](../../cs-basics/data-structure/heap.md) and [Top K Problem Interview Questions Summary](../../cs-basics/algorithms/top-k.md).

### What is BlockingQueue?

`BlockingQueue` (blocking queue) is an interface that extends `Queue`. For insertion and removal operations, it provides four handling modes: throwing an exception, returning a special value, blocking indefinitely, and waiting with a timeout. Among these, `take()` can block when the queue is empty, and `put()` can block when a capacity-bounded queue is full.

```java
public interface BlockingQueue<E> extends Queue<E> {
  // ...
}
```

`BlockingQueue` is commonly used in the producer-consumer model, where producer threads add data to the queue and consumer threads take data from the queue for processing.

![BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-860d78a6.png)

### What are the implementation classes of BlockingQueue?

![Implementation classes of BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-hierarchy-755d1cd5.png)

Common blocking queue implementation classes in Java include the following:

1. `ArrayBlockingQueue`: A bounded blocking queue implemented using an array. Its capacity size must be specified upon creation, and it supports both fair and non-fair lock access mechanisms.
2. `LinkedBlockingQueue`: An optionally bounded blocking queue implemented using a singly linked list. Its capacity size can be specified upon creation; if not specified, it defaults to `Integer.MAX_VALUE`. Unlike `ArrayBlockingQueue`, it only supports a non-fair lock access mechanism.
3. `PriorityBlockingQueue`: An unbounded blocking queue that supports priority-based ordering. Elements must implement the `Comparable` interface or a `Comparator` object must be passed into the constructor, and null elements cannot be inserted.
4. `SynchronousQueue`: A synchronous queue—a blocking queue that does not store elements. Every insert operation must wait for a corresponding remove operation, and conversely every remove operation must wait for an insert operation. Therefore, `SynchronousQueue` is typically used to pass data directly between threads.
5. `DelayQueue`: A delay queue in which elements can only be dequeued once their specified delay time has elapsed.
6. ……

In daily development, these queues are actually not used very often; having a general understanding is sufficient.

### ⭐️ What are the differences between ArrayBlockingQueue and LinkedBlockingQueue?

`ArrayBlockingQueue` and `LinkedBlockingQueue` are two commonly used blocking queue implementations in the Java concurrency package, and both are thread-safe. However, there are still the following differences between them:

- Underlying implementation: `ArrayBlockingQueue` is implemented based on an array, whereas `LinkedBlockingQueue` is implemented based on a linked list.
- Boundedness: `ArrayBlockingQueue` is a bounded queue whose capacity size must be specified upon creation. `LinkedBlockingQueue` does not require specifying capacity upon creation and defaults to `Integer.MAX_VALUE` (making it unbounded), though a queue size can also be specified to make it bounded.
- Lock separation: In `ArrayBlockingQueue`, locks are not separated—that is, production and consumption share the same lock; in `LinkedBlockingQueue`, locks are separated—production uses `putLock` and consumption uses `takeLock`, which prevents lock contention between producer and consumer threads.
- Memory consumption: `ArrayBlockingQueue` pre-allocates array memory upfront, whereas `LinkedBlockingQueue` dynamically allocates linked list node memory. This means `ArrayBlockingQueue` occupies a certain amount of memory upon creation and often allocates more memory than actually used, whereas `LinkedBlockingQueue` gradually consumes memory as elements are added.

## Further Reading on Data Structures

Java collection interviews frequently drill down into underlying data structures. It is recommended to review the following articles together:

- [Linear Data Structures Explained](../../cs-basics/data-structure/linear-data-structure.md): Understand arrays, linked lists, stacks, queues, and their relationship with `ArrayList`, `LinkedList`, and `ArrayDeque`.
- [Hash Table Interview Questions Summary](../../cs-basics/data-structure/hash-table.md): Understand hash collisions, resizing, and the underlying ideas of `HashMap`.
- [Red-Black Tree Explained](../../cs-basics/data-structure/red-black-tree.md): Understand the Red-Black Tree involved in `TreeMap`, `TreeSet`, and when `HashMap` treeifies linked lists.
- [Heap Explained](../../cs-basics/data-structure/heap.md): Understand the underlying structure of `PriorityQueue` and Top K problem patterns.
