---
title: "Detailed Analysis of Linear Data Structures (Arrays, Linked Lists, Stacks, Queues)"
description: "Summarizes the characteristics and operations of arrays, linked lists, stacks, and queues, combined with complexity analysis and typical applications to master linear structure selection and implementation."
category: Computer Science Basics
tag:
  - Data Structure
head:
  - - meta
    - name: keywords
      content: Array,Linked List,Stack,Queue,Deque,Complexity Analysis,Random Access,Insertion and Deletion
lang: en
sourceRef: zh-ref/cs-basics/data-structure/linear-data-structure.md
---

# Linear Data Structures

## 1. Array

An **Array** is a very common data structure. It consists of elements of the same type and uses a contiguous block of memory for storage.

We can directly compute the memory address corresponding to any element using its index.

The key characteristics of an array are: **providing random access** and having a fixed capacity.

```java
// Assuming the array length is n.
Access: O(1)    // Accessing an element at a specific index
Insertion: O(n) // The worst case occurs when inserting at the beginning of the array, requiring all elements to shift
Deletion: O(n)  // The worst case occurs when deleting from the beginning of the array, requiring all elements after the first to shift
```

![Array](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/array-02250d02.png)

## 2. Linked List

### 2.1. Introduction to Linked List

Although a **Linked List** is a linear list, it does not store data in physical linear order and does not use contiguous memory space to store data.

Insertion and deletion operations in a linked list have a time complexity of O(1), requiring only knowledge of the preceding element at the target position. However, searching for a node or accessing a node at a specific position has an O(n) complexity.

Using a linked list overcomes the drawback of arrays requiring the data size to be predetermined. The linked list structure can make full use of computer memory space to achieve flexible dynamic memory management. However, linked lists do not save space; compared to arrays, they consume more memory because each node in a linked list also stores pointers pointing to other nodes. In addition, linked lists do not have the advantage of random access like arrays.

### 2.2. Classification of Linked Lists

**Common types of linked lists:**

1. Singly Linked List
2. Doubly Linked List
3. Circular Linked List
4. Circular Doubly Linked List

```java
// Assuming there are n elements in the linked list.
Access: O(n)            // Accessing an element at a specific position
Insertion/Deletion: O(1) // The position of the element must already be known
```

#### 2.2.1. Singly Linked List

A **Singly Linked List** has only one direction. Each node has only one successor pointer (`next`) pointing to the subsequent node. Therefore, this data structure is typically non-contiguous in physical memory. We conventionally call the first node the head node. A linked list often has a `head` node that stores no value, through which we can traverse the entire linked list. The tail node typically points to `null`.

![Singly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/single-linkedlist-43224706.png)

#### 2.2.2. Circular Linked List

A **Circular Linked List** is essentially a special form of singly linked list. Unlike a singly linked list, the tail node of a circular linked list does not point to `null`; instead, it points to the head node of the linked list.

![Circular Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/circular-linkedlist-6d008def.png)

#### 2.2.3. Doubly Linked List

A **Doubly Linked List** contains two pointers: a `prev` pointer pointing to the previous node and a `next` pointer pointing to the next node.

![Doubly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-linkedlist-a47e8dae.png)

#### 2.2.4. Circular Doubly Linked List

In a **Circular Doubly Linked List**, the `next` pointer of the last node points to `head`, while the `prev` pointer of `head` points to the last node, forming a closed ring.

![Circular Doubly Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-circular-linkedlist-236d879c.png)

### 2.3. Application Scenarios

- If random access is required, a linked list cannot support it.
- If the number of data elements to be stored is undetermined and frequent additions and deletions are required, using a linked list is more appropriate.
- If the number of data elements to be stored is fixed and frequent additions and deletions are not needed, using an array is more appropriate.

### 2.4. Array vs. Linked List

- Arrays support random access, whereas linked lists do not.
- Arrays use contiguous memory space, which is friendly to CPU caching mechanisms; linked lists are the opposite.
- Array sizes are fixed, whereas linked lists naturally support dynamic expansion. If a declared array is too small, a larger memory block must be allocated and the elements copied over, which is a costly operation!

## 3. Stack

### 3.1. Introduction to Stack

A **Stack** allows data addition (`push`) and data removal (`pop`) only at one end of an ordered linear collection of data (called the `top`). Thus, it operates on the principle of **Last In, First Out (LIFO)**. **In a stack, both push and pop operations occur at the top of the stack.**

Stacks are commonly implemented using one-dimensional arrays or linked lists. A stack implemented with an array is called a **sequential stack**, and a stack implemented with a linked list is called a **linked stack**.

```java
// Assuming there are n elements in the stack.
Access: O(n)             // Worst case
Insertion/Deletion: O(1) // Inserting and deleting elements at the top
```

![Schematic of the Last In, First Out structure of a stack](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/stack-d5d8374d.png)

### 3.2. Common Application Scenarios for Stacks

When the data we need to process only involves insertions and deletions at one end and satisfies the **Last In, First Out (LIFO)** characteristic, we can use the stack data structure.

#### 3.2.1. Implementing Browser Back and Forward Navigation

We only need two stacks (Stack1 and Stack2) to implement this functionality. For example, suppose you browse pages 1, 2, 3, and 4 in order. We push pages 1, 2, 3, and 4 into Stack1 sequentially. When you want to return to page 2, you click the back button; we pop pages 4 and 3 from Stack1 and push them into Stack2. If you then want to move forward to page 3, you click the forward button; we pop page 3 from Stack2 and push it into Stack1. The illustration is shown below:

![Implementing browser back and forward navigation using two stacks](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/stack-browser-back-forward-91296277.png)

#### 3.2.2. Checking Matching Brackets / Parentheses

> Given a string containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['`, and `']'`, determine if the input string is valid.
>
> An input string is valid if:
>
> 1. Open brackets must be closed by the same type of brackets.
> 2. Open brackets must be closed in the correct order.
>
> For example, `"()"`, `"()[]{}"`, and `"{[]}"` are all valid strings, while `"(]"` and `"([)]"` are not.

This problem is a classic LeetCode problem, and we can solve it using a `Stack`.

1. First, store the bracket matching rules in a `Map`, which is straightforward;
2. Create a stack. Iterate through the string; if the character is an open bracket, push it directly onto the `stack`. Otherwise, compare the top element of the `stack` with the corresponding opening bracket for this closing bracket; if they do not match, return `false` immediately. After traversal, if the `stack` is empty, return `true`.

```java
public boolean isValid(String s){
    // Matching rules between brackets
    HashMap<Character, Character> mappings = new HashMap<Character, Character>();
    mappings.put(')', '(');
    mappings.put('}', '{');
    mappings.put(']', '[');
    Stack<Character> stack = new Stack<Character>();
    char[] chars = s.toCharArray();
    for (int i = 0; i < chars.length; i++) {
        if (mappings.containsKey(chars[i])) {
            char topElement = stack.empty() ? '#' : stack.pop();
            if (topElement != mappings.get(chars[i])) {
                return false;
            }
        } else {
            stack.push(chars[i]);
        }
    }
    return stack.isEmpty();
}
```

#### 3.2.3. Reversing a String

Push each character of the string onto the stack, and then pop them all out.

#### 3.2.4. Managing Function Call Stacks

The last function called must complete execution first, matching the **Last In, First Out (LIFO)** characteristic of a stack.
For instance, recursive function calls can be implemented via a call stack, where each recursive invocation pushes its arguments and return address onto the stack.

#### 3.2.5. Depth-First Search (DFS)

During depth-first search, a stack is used to store the search path to facilitate backtracking to previous levels.

### 3.3. Implementation of a Stack

A stack can be implemented using either an array or a linked list. Regardless of whether it is based on an array or a linked list, the time complexity of both push and pop operations is O(1).

Below, we implement a stack using an array. This stack provides basic methods such as `push()`, `pop()` (returns and removes the top element), `peek()` (returns the top element without removing it), `isEmpty()`, and `size()`.

> Tip: Before each push, check whether the stack capacity is sufficient. If not, expand it using `Arrays.copyOf()`.

```java
public class MyStack {
    private int[] storage; // Array storing the elements in the stack
    private int capacity;  // Capacity of the stack
    private int count;     // Number of elements in the stack
    private static final int GROW_FACTOR = 2;

    // Constructor without initial capacity. Default capacity is 8
    public MyStack() {
        this.capacity = 8;
        this.storage = new int[8];
        this.count = 0;
    }

    // Constructor with initial capacity
    public MyStack(int initialCapacity) {
        if (initialCapacity < 1)
            throw new IllegalArgumentException("Capacity too small.");

        this.capacity = initialCapacity;
        this.storage = new int[initialCapacity];
        this.count = 0;
    }

    // Push an element onto the stack
    public void push(int value) {
        if (count == capacity) {
            ensureCapacity();
        }
        storage[count++] = value;
    }

    // Ensure sufficient capacity
    private void ensureCapacity() {
        int newCapacity = capacity * GROW_FACTOR;
        storage = Arrays.copyOf(storage, newCapacity);
        capacity = newCapacity;
    }

    // Return the top element and pop it from the stack
    public int pop() {
        if (count == 0)
            throw new IllegalArgumentException("Stack is empty.");
        count--;
        return storage[count];
    }

    // Return the top element without popping it
    public int peek() {
        if (count == 0){
            throw new IllegalArgumentException("Stack is empty.");
        } else {
            return storage[count - 1];
        }
    }

    // Check if the stack is empty
    public boolean isEmpty() {
        return count == 0;
    }

    // Return the number of elements in the stack
    public int size() {
        return count;
    }

}
```

Verification:

```java
MyStack myStack = new MyStack(3);
myStack.push(1);
myStack.push(2);
myStack.push(3);
myStack.push(4);
myStack.push(5);
myStack.push(6);
myStack.push(7);
myStack.push(8);
System.out.println(myStack.peek()); // 8
System.out.println(myStack.size()); // 8
for (int i = 0; i < 8; i++) {
    System.out.println(myStack.pop());
}
System.out.println(myStack.isEmpty()); // true
myStack.pop(); // Error: java.lang.IllegalArgumentException: Stack is empty.
```

## 4. Queue

### 4.1. Introduction to Queue

A **Queue** is a **First In, First Out (FIFO)** linear list. In practice, it is usually implemented using a linked list or an array. A queue implemented with an array is called a **sequential queue**, and one implemented with a linked list is called a **linked queue**. **A queue only permits insertion operations at the rear (enqueue) and deletion operations at the front (dequeue).**

Queue operations resemble those of a stack, with the only difference being that a queue only permits new data to be appended at the rear.

```java
// Assuming there are n elements in the queue.
Access: O(n)             // Worst case
Insertion/Deletion: O(1) // Enqueue at rear, dequeue at front
```

![Queue](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/queue-169f6d44.png)

### 4.2. Classification of Queues

#### 4.2.1. Simple Queue

A simple queue is the standard queue where elements are always added to the tail. Simple queues are divided into **sequential queues (array-based)** and **linked queues (linked list-based)**.

**Sequential queues suffer from the "false overflow" problem, where elements cannot be added even though empty space exists.**

Suppose the figure below represents a sequential queue. We dequeue the first two elements 1 and 2, and enqueue two elements 7 and 8. As enqueue and dequeue operations proceed, both `front` and `rear` keep moving backward. When `rear` reaches the end of the array, we cannot add any more data to the queue, even though there is still unused space at the front of the array. This phenomenon is called **"false overflow"**. In addition, as shown in the diagram, when adding element 8, the `rear` pointer moves outside the array bounds (out of bounds).

> To avoid ambiguity when there is only one element left where the head and tail coincide, two pointers are introduced: the `front` pointer points to the head element, and the `rear` pointer points to the position following the last element in the queue. Thus, when `front` equals `rear`, the queue does not have one element left; it is empty. — From *Big Talk Data Structures*

![Sequential queue false overflow](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/seq-queue-false-overflow-b31f2974.png)

#### 4.2.2. Circular Queue

A circular queue solves the false overflow and out-of-bounds issues of sequential queues. The solution is: start over from the beginning, thereby forming an end-to-end circular structure, which is how circular queues get their name.

Using the same figure as above, if we wrap the `rear` pointer back to index 0 of the array, there will be no out-of-bounds issue. As we add more elements to the queue, `rear` moves backward again.

![Circular Queue](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/circular-queue-739efe49.png)

In a sequential queue, we say the queue is empty when `front == rear`. In a circular queue, however, `front == rear` could mean either empty or full, as shown above. There are two solutions:

1. Maintain a flag variable `flag`. When `front == rear` and `flag == 0`, the queue is empty; when `front == rear` and `flag == 1`, the queue is full.
2. An empty queue is defined as `front == rear`. For a full queue, we reserve one empty slot in the array, with `rear` pointing to this empty slot as shown below. Under this condition, the check for a full queue becomes: `(rear + 1) % QueueSize == front`.

#### 4.2.3. Deque (Double-Ended Queue)

A **Deque (Double-Ended Queue)** is a queue where insertion and deletion operations can be performed at both ends, making it much more flexible than a simple queue.

Generally, we can perform `addFirst`, `addLast`, `removeFirst`, and `removeLast` operations on a deque.

#### 4.2.4. Priority Queue

A **Priority Queue** is fundamentally not a linear data structure in terms of its underlying implementation; it is typically implemented using a heap.

1. When each element is enqueued, the priority queue inserts the new element into the heap and reheapifies.
2. When dequeuing from the head, the priority queue returns the top element of the heap and reheapifies.

For the concrete implementation of a heap, refer to the [Heap](https://javaguide.cn/cs-basics/data-structure/heap.html) section.

A priority queue only guarantees that the head element has the current highest (or lowest) priority; it does not guarantee that the underlying array, iterator, or entire collection is globally sorted. Only after the current head is retrieved does the next highest-priority element become the new head.

Although priority queues are typically backed by non-linear structures like heaps, they expose the ability to dequeue in priority order via a queue interface. Here, "priority" merely describes the dequeuing order and should not be misinterpreted as all elements in the collection being automatically sorted.

### 4.3. Common Application Scenarios for Queues

When we need to process data in a specific sequential order, we can consider using a queue.

- **Blocking Queue:** A blocking queue can be seen as a queue enhanced with blocking operations. When the queue is empty, dequeue operations block; when the queue is full, enqueue operations block. Using a blocking queue makes it very easy to implement the "Producer-Consumer" pattern.
- **Request/Task Queues in Thread Pools:** When no idle threads are available in a thread pool, how are new task requests handled? The answer is that these tasks are placed into a task queue, waiting until threads in the pool become idle to pick up tasks from the queue for execution. Task queues can be unbounded (based on linked lists) or bounded (based on arrays). An unbounded queue has virtually no capacity limit, allowing tasks to be queued continuously until system memory is exhausted. For example, `FixedThreadPool` uses the blocking queue `LinkedBlockingQueue` with a default capacity of `Integer.MAX_VALUE`, effectively functioning as an "unbounded queue." Bounded queues, by contrast, reject new tasks when the queue is full, throwing a `java.util.concurrent.RejectedExecutionException` because the queue cannot accommodate additional work.
- **Stack:** A deque can implement all functionalities of a stack (`push`, `pop`, and `peek`), and the relevant methods are already defined in the `Deque` interface. Although `Stack` is not deprecated, it is a legacy subclass of `Vector`. JDK documentation recommends preferring `Deque` and its implementations (such as `ArrayDeque`) for stack operations.
- **Breadth-First Search (BFS):** During breadth-first search on graphs, queues are used to store pending nodes, ensuring that graph nodes are traversed level by level.
- Linux kernel process queues (prioritized scheduling).
- Real-world lines/queues, playlists in media players.
- Message queues.
- And more...

## Key Takeaways for Interview Review

Linear data structures form the foundation for algorithmic coding questions and Java Collections. In interviews, arrays, linked lists, stacks, and queues are frequently compared side-by-side.

| Structure | Lookup | Insertion/Deletion | Typical Java Types | High-Frequency Problem Types |
| --------- | ------ | ------------------ | ------------------ | ---------------------------- |
| Array | By index `O(1)` | Intermediate positions `O(n)` | Underlying array of `ArrayList` | Binary search, two pointers, prefix sums |
| Linked List | `O(n)` | `O(1)` when node is known | `LinkedList` | Reverse linked list, fast-slow pointers, merge lists |
| Stack | Top `O(1)` | Top `O(1)` | `ArrayDeque` | Bracket matching, monotonic stack, DFS |
| Queue | Head `O(1)` | Enqueue/Dequeue `O(1)` | `ArrayDeque`, Blocking queues | BFS, producer-consumer, task queuing |

A few key points that are very helpful when answering interview questions:

- Array random access is fast because memory is contiguous, allowing memory addresses to be directly calculated using the base address and index.
- Linked list insertion and deletion are fast under a prerequisite: you already hold a reference to the node at the operation location; if you still have to search for it first, the overall complexity remains `O(n)`.
- In Java, continuing to use `Stack` is discouraged; the more standard choice is `Deque`, such as `ArrayDeque`.
- In engineering, queues are not only used for BFS algorithms, but also extensively in thread pool task queues, message queues, rate limiting, and traffic peak smoothing.
- The key to a circular queue is distinguishing between empty and full states; common approaches include leaving one empty slot or maintaining an explicit element count.

## Recommended Practice Problems

- Array: [704. Binary Search](https://leetcode.cn/problems/binary-search/), [26. Remove Duplicates from Sorted Array](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/)
- Linked List: [206. Reverse Linked List](https://leetcode.cn/problems/reverse-linked-list/), [19. Remove Nth Node From End of List](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)
- Stack: [20. Valid Parentheses](https://leetcode.cn/problems/valid-parentheses/), [739. Daily Temperatures](https://leetcode.cn/problems/daily-temperatures/)
- Queue: [102. Binary Tree Level Order Traversal](https://leetcode.cn/problems/binary-tree-level-order-traversal/), [239. Sliding Window Maximum](https://leetcode.cn/problems/sliding-window-maximum/)
