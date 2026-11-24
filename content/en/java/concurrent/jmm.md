---
title: Detailed Explanation of JMM (Java Memory Model)
description: "In-depth analysis of the Java Memory Model (JMM): explaining the CPU cache model, instruction reordering mechanisms, happens-before rules, and memory visibility guarantees to understand the low-level specifications of multithreaded concurrent programming."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/jmm.md
head:
  - - meta
    - name: keywords
      content: JMM,Java Memory Model,CPU cache,instruction reordering,happens-before,memory visibility,concurrent programming model
---

For Java, you can think of **JMM (Java Memory Model)** as a set of specifications defined by Java for concurrent programming. In addition to abstracting the relationship between threads and main memory, it also stipulates the concurrency-related principles and specifications that must be followed during the transformation from Java source code to CPU-executable instructions. Its primary purpose is to **simplify multithreaded programming** and **enhance program portability**.

JMM primarily defines the **visibility** of a shared variable to other threads after one thread performs a write operation on it.

To understand JMM thoroughly, we need to start from the **CPU cache model** and **instruction reordering**.

## Starting from the CPU Cache Model

**Why create a CPU high-speed cache?** Analogous to how caches used in backend web systems we develop (such as Redis) solve the speed mismatch between program processing and accessing conventional relational databases, **CPU cache solves the speed mismatch between CPU processing and main memory access.**

We can even view **main memory as a high-speed cache for external storage**: when a program runs, we copy data from external storage into main memory; since memory's processing speed is far higher than external storage, this improves processing speed.

In summary: **CPU Cache caches data from main memory to solve the mismatch between CPU processing speed and main memory, while main memory caches data from the hard disk to solve the issue of slow hard disk access.**

To help you understand better, I drew a simple CPU Cache diagram as shown below.

> **🐛 Correction (see: [issue#1848](https://github.com/Snailclimb/JavaGuide/issues/1848))**: Refined imprecise parts of the CPU cache model diagram.

![CPU Cache Model Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-f9ad1aa3.png)

Modern CPU Caches are typically divided into three levels, called L1, L2, and L3 Cache. Some CPUs may also have an L4 Cache, which is uncommon and will not be discussed here.

**How CPU Cache works:** A copy of data is first loaded into the CPU Cache; when the CPU needs it, it can read the data directly from the CPU Cache, and once computation finishes, the computed data is written back to Main Memory. However, this causes **memory cache inconsistency issues**! For example, when executing an `i++` operation, if two threads execute simultaneously and both read `i = 1` from the CPU Cache, after both finish `i++` and write back to Main Memory, `i` becomes `2`, whereas the correct result should be `i = 3`.

**To resolve memory cache inconsistency issues, CPUs can establish cache coherence protocols (such as the [MESI protocol](https://zh.wikipedia.org/wiki/MESI%E5%8D%8F%E8%AE%AE)) or use other mechanisms.** A cache coherence protocol refers to the principles and rules that must be followed when CPU high-speed caches interact with main memory. Different CPUs often use different cache coherence protocols.

![Cache Coherence Protocol](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-protocol-5a080c3d.png)

CPU cache coherence is implemented collaboratively by the processor and its memory subsystem. Different processor architectures also specify the orders in which various memory accesses may appear to other processors; this is commonly referred to as the hardware memory model. JMM sits at a higher language level, and the JVM needs to map its requirements onto the instructions and barriers provided by the target processor.

## Instruction Reordering

After covering the CPU cache model, let's look at another important concept: **Instruction Reordering**.

To improve execution speed and performance, computers reorder instructions when executing program code.

**What is instruction reordering?** Simply put, when the system executes code, it does not necessarily execute instructions strictly in the order you wrote them.

Common cases of instruction reordering fall into the following 2 categories:

- **Compiler optimization reordering**: Without changing the semantics of a single-threaded program, the compiler (including the JVM, JIT compiler, etc.) rearranges the execution order of statements.
- **Instruction-level parallel reordering**: Modern processors use Instruction-Level Parallelism (ILP) to overlap the execution of multiple instructions. If no data dependency exists, the processor can change the execution order of machine instructions corresponding to statements.

In addition, the memory system also exhibits a form of "reordering," though it is not reordering in the strict literal sense. In JMM, it manifests as potential inconsistencies between the contents of main memory and local memory, which can cause issues when a program executes under multithreading.

Java source code undergoes bytecode compilation, interpreted execution, or JIT compilation, and is ultimately executed by the JVM as corresponding machine instructions on the target platform. Compiler optimizations, processor out-of-order execution, and memory subsystem behavior can all make the order observed across multiple threads differ from the intuitive order in source code; they do not form a fixed, strictly linear "reordering pipeline."

**Instruction reordering can preserve sequential semantics, but has no obligation to preserve multithreaded semantics**, so under multithreading, instruction reordering can cause problems.

Compiler optimization reordering and processor instruction reordering (both instruction-level parallel reordering and memory system reordering belong to processor-level instruction reordering) are handled differently:

- For compilers, reordering is prohibited by forbidding specific types of compiler reordering.
- For processors, specific types of processor reordering are prohibited by inserting Memory Barriers (also sometimes called Memory Fences).

> A Memory Barrier (also called a Memory Fence) is used to constrain ordering and visibility between specific memory accesses. Concrete implementations vary across processor architectures and should not be universally simplified as "flushing caches to physical memory" or "invalidating all caches"; the JVM selects instructions that satisfy JMM semantics according to the target platform.

## JMM (Java Memory Model)

### What Is JMM? Why Do We Need JMM?

Java was the first programming language to attempt to provide a memory model. Because early memory models had certain flaws (such as easily impairing compiler optimization capabilities), starting from Java 5, Java adopted a new memory model: [JSR-133: Java Memory Model and Thread Specification](http://www.cs.umd.edu/~pugh/java/memoryModel/CommunityReview.pdf).

Generally speaking, a programming language could also directly reuse the operating system's memory model. However, different operating systems have different memory models. If a language directly reused the OS memory model, the same codebase might fail to run properly when moved to another operating system. Java is cross-platform, so it needs to provide its own memory model to shield against OS differences.

That is only one reason why JMM exists. In reality, for Java, you can regard JMM as a set of specifications defined by Java for concurrent programming. Besides abstracting the relationship between threads and main memory, it specifies the concurrency-related principles and rules to be followed during the transformation from Java source code to CPU-executable instructions, with the primary goals of simplifying multithreaded programming and enhancing program portability.

**Why must these concurrency-related principles and rules be followed?** Because under concurrent programming, designs like multi-level CPU caches and instruction reordering can cause programs to behave abnormally. For example, instruction reordering mentioned above can cause errors in multithreaded program execution; therefore, JMM abstracts the happens-before principle (detailed later) to address this instruction reordering issue.

Put plainly, JMM defines a set of specifications to solve these issues, allowing developers to leverage them to write multithreaded programs more conveniently. For Java developers, you don't need to understand the underlying low-level details—just using concurrency-related keywords and classes (such as `volatile`, `synchronized`, and various `Lock` implementations) is enough to develop concurrency-safe programs.

### How Does JMM Abstract the Relationship Between Threads and Main Memory?

The **Java Memory Model (JMM)** abstracts the relationship between threads and main memory—for instance, shared variables among threads must reside in main memory.

Java has had a memory model since its early specifications; Java 5 made major revisions via JSR-133, clarifying and strengthening the semantics of `volatile`, `final`, and happens-before. JMM allows the JVM to use registers, caches, and compiler optimizations to implement accesses to shared variables; if a program does not establish the necessary synchronization relationships, one thread may fail to see the latest writes from another thread.

This is very similar to the CPU cache model we discussed above.

**What is main memory? What is local memory?**

- **Main Memory**: JMM uses it to abstract variables that can be shared among threads, including instance fields, static fields, and array elements. Local method variables, formal parameters, and exception handler parameters are not shared among threads and therefore are not considered shared variables here. Main memory is a specification-level abstraction, not equivalent to a particular region of physical memory.
- **Local Memory**: Each thread has a private local memory, which stores copies of the shared variables that the thread has read or written. Each thread can only operate on variables in its own local memory and cannot directly access another thread's local memory. If threads need to communicate, they must do so through main memory. Local memory is an abstract concept defined by JMM and does not physically exist; it encompasses caches, write buffers, registers, and other hardware and compiler optimizations.

The abstract diagram of the Java Memory Model is shown below:

![JMM (Java Memory Model)](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jmm-36d9b6ac.png)

From the diagram above, if Thread 1 and Thread 2 want to communicate, they must go through the following 2 steps:

1. Thread 1 synchronizes the modified shared variable copy from its local memory to main memory.
2. Thread 2 reads the corresponding shared variable value from main memory.

In other words, shared data between threads needs to follow JMM's rules for communication; JMM only provides visibility guarantees for relevant writes when a corresponding happens-before relationship is established through `volatile`, locks, thread startup and termination, and so on.

However, under multithreading, operating on a shared variable in main memory can trigger thread-safety issues. For example:

1. Thread 1 and Thread 2 both operate on the same shared variable—one performs a modification and the other performs a read.
2. Whether Thread 2 reads the value before Thread 1's modification or after Thread 1's modification is indeterminate; either is possible, because both Thread 1 and Thread 2 first copy the shared variable from main memory into their respective working memories.

Regarding the specific interaction protocol between main memory and working memory—that is, the implementation details of how a variable is copied from main memory to working memory and synchronized from working memory back to main memory—the Java Memory Model defines the following eight synchronization operations (good to be aware of; no need to memorize by rote):

- **lock**: Operates on a variable in main memory, marking it as exclusively owned by one thread.
- **unlock**: Operates on a variable in main memory, releasing its locked state so that only an unlocked variable can be locked by another thread.
- **read**: Operates on a variable in main memory, transferring the value of a variable from main memory into the thread's working memory for use by a subsequent `load` action.
- **load**: Places the variable value obtained from main memory by a `read` operation into a variable copy in working memory.
- **use**: Passes the value of a variable in working memory to the execution engine; the JVM executes this instruction whenever it encounters a bytecode instruction that uses the variable's value.
- **assign**: Operates on a variable in working memory, assigning a value received from the execution engine to the variable in working memory; this operation is executed whenever the JVM encounters a bytecode instruction that assigns a value to a variable.
- **store**: Operates on a variable in working memory, transferring the value of a variable in working memory to main memory for use by a subsequent `write` action.
- **write**: Operates on a variable in main memory, placing the variable value obtained from working memory by a `store` operation into the variable in main memory.

In addition to these 8 synchronization operations, the following synchronization rules are defined to guarantee the proper execution of these operations (good to be aware of; no need to memorize by rote):

- A thread is not allowed to synchronize data from its working memory back to main memory for no reason (without any `assign` operation having occurred).
- A new variable can only be "born" in main memory; it is not allowed to directly use an uninitialized variable (`load` or `assign`) in working memory—in other words, before performing `use` or `store` on a variable, `assign` and `load` must have been executed first.
- At any given moment, only one thread is allowed to perform a `lock` operation on a variable, though a `lock` operation can be executed repeatedly by the same thread; after multiple `lock` operations, the variable is only unlocked after executing the same number of `unlock` operations.
- If a `lock` operation is executed on a variable, the value of that variable in working memory is cleared; before the execution engine uses that variable, `load` or `assign` must be re-executed to initialize the variable's value.
- If a variable has not previously been locked by a `lock` operation, `unlock` is not allowed on it, nor is it allowed to `unlock` a variable locked by another thread.
- ……

### What Is the Difference Between Java Memory Areas and JMM?

This is a fairly common question, and many beginners easily confuse the two. **Java Memory Areas and the Java Memory Model are two completely different things**:

- The JVM memory structure relates to the runtime data areas of the Java Virtual Machine and defines how the JVM partitions and stores program data at runtime—for example, the Heap is primarily used to store object instances.
- The Java Memory Model relates to Java concurrent programming, abstracts the relationship between threads and main memory (such as requiring shared variables between threads to be stored in main memory), and specifies the concurrency-related principles and rules to follow during the transformation from Java source code to CPU-executable instructions. Its main purpose is to simplify multithreaded programming and enhance program portability.

### What Is the happens-before Principle?

The concept of happens-before originated in Leslie Lamport's 1978 paper ["Time, Clocks, and the Ordering of Events in a Distributed System"](https://lamport.azurewebsites.net/pubs/time-clocks.pdf). In this paper, Leslie Lamport proposed the concept of [logical clocks](https://writings.sh/post/logical-clocks), which became the first logical clock algorithm. In a distributed environment, a set of rules defines how logical clocks advance, making it possible to determine the ordering of events in a distributed system through logical clocks. **Logical clocks do not measure time itself; they only distinguish the precedence order of events, which essentially defines a happens-before relationship.**

The historical background of the happens-before concept above is not the main focus; a brief understanding is sufficient.

JSR-133 introduced the concept of happens-before to describe memory visibility between two operations.

**Why do we need the happens-before principle?** The happens-before principle was born as a balance between programmers on one side and compilers and processors on the other. Programmers want a strong memory model that is easy to understand and program with, where they only need to write code following established rules. Compilers and processors want a weak memory model with fewer constraints so they can optimize as aggressively as possible to maximize performance. The design philosophy of the happens-before principle is actually very simple:

- To impose as few constraints on compilers and processors as possible, as long as the execution result of the program (both single-threaded programs and properly synchronized multithreaded programs) is not altered, compilers and processors are free to perform any reordering optimizations they like.
- For reorderings that would alter the execution result of the program, JMM requires compilers and processors to prohibit such reorderings.

Below is a diagram I redrew based on the JMM design philosophy diagram in the book *The Art of Java Concurrency Programming*.

![JMM Design Philosophy](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jmm-design-idea-98712024.png)

Having understood the design philosophy of the happens-before principle, let's look at JSR-133's definition of the happens-before principle:

- If one operation happens-before another operation, then the execution result of the first operation will be visible to the second operation, and the execution order of the first operation comes before the second operation.
- The existence of a happens-before relationship between two operations does not mean that a concrete implementation of the Java platform must execute them strictly in the order specified by the happens-before relationship. If the execution result after reordering is consistent with the execution result according to the happens-before relationship, then JMM also permits such reordering.

Let's look at the following code snippet:

```java
int userNum = getUserNum();   // 1
int teacherNum = getTeacherNum();   // 2
int totalNum = userNum + teacherNum;  // 3
```

- 1 happens-before 2
- 2 happens-before 3
- 1 happens-before 3

Although 1 happens-before 2, reordering 1 and 2 will not affect the execution result of the code, so JMM allows the compiler and processor to perform this reordering. However, both 1 and 2 must occur before 3 executes—that is, 1, 2 happens-before 3.

**What the happens-before principle expresses is actually not that one operation physically occurs before another operation, even though thinking of it that way causes little harm from a programmer's perspective. More accurately, it expresses that the result of the preceding operation is visible to the subsequent operation, regardless of whether the two operations are in the same thread.**

For example: if Operation 1 happens-before Operation 2, even if Operation 1 and Operation 2 are not in the same thread, JMM guarantees that the result of Operation 1 is visible to Operation 2.

### What Are the Common happens-before Rules? Share Your Understanding.

There are multiple happens-before rules; below are the 5 most commonly used ones:

1. **Program Order Rule**: Within a single thread, following the code order, an action written earlier happens-before an action written later.
2. **Monitor Lock Rule**: An unlock on a monitor happens-before every subsequent lock on the same monitor.
3. **Volatile Variable Rule**: A write to a `volatile` variable happens-before every subsequent read of that same variable.
4. **Transitivity Rule**: If A happens-before B, and B happens-before C, then A happens-before C.
5. **Thread Start Rule**: A call to `start()` on a `Thread` object happens-before any action in the started thread.

This list is not exhaustive; it also includes rules for thread termination, thread interruption, and others. If no happens-before relationship can be derived between two conflicting accesses through the full set of rules, a data race may occur, and their visibility and ordering cannot be guaranteed by single-threaded intuition; this is not equivalent to the JVM being allowed to unconditionally swap any two instructions, as execution results are still constrained by JMM's consistency and causality rules.

### What Is the Relationship Between happens-before and JMM?

The relationship between happens-before and JMM is shown in the figure below:

![jmm-vs-happens-before](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jmm-vs-happens-before-624bca7e.png)

- JMM provides programmers with **"happens-before rules"** (such as the Program Order Rule, `volatile` Variable Rule, etc.). This creates the illusion of a **"strong memory model"**: programmers do not need to worry about complex underlying reordering details—simply writing code according to these rules guarantees memory visibility under multithreading.
- At runtime, the JVM maps happens-before rules to concrete implementations. To avoid sacrificing performance while guaranteeing correctness, JMM only **"prohibits reorderings that affect execution results."** For reorderings that do not affect single-threaded execution results, JMM permits them.
- At the lowest layer are the actual **"reordering rules"** of the compiler and processor.

In summary, JMM acts like an intermediate layer: upward, it provides programmers with a simple programming model via happens-before; downward, it leverages underlying hardware performance by prohibiting only specific reorderings. This design both ensures multithreaded safety and unleashes hardware performance to the fullest extent.

## Revisiting the Three Key Characteristics of Concurrent Programming

### Atomicity

For one operation or multiple operations, either all operations are executed completely without being interrupted by any factor, or none of them are executed at all.

In Java, Atomicity can be achieved with the help of `synchronized`, various `Lock` implementations, and atomic classes.

`synchronized` and various `Lock` implementations ensure that only one thread accesses the code block at any given moment, thereby guaranteeing Atomicity. Atomic classes use CAS (Compare-And-Swap) operations (and may also use the `volatile` or `final` keywords) to guarantee atomic operations.

### Visibility

When one thread modifies a shared variable, other threads can immediately see the latest modified value.

In Java, Visibility can be achieved with the help of `synchronized`, `volatile`, and various `Lock` implementations.

If a variable is declared as `volatile`, a happens-before relationship is established between a write to that variable and subsequent reads of it. The JVM must guarantee the corresponding visibility and ordering semantics, though concrete implementations are not required to access physical main memory every time.

### Ordering

Due to instruction reordering issues, the execution order of code is not necessarily the order in which the code was written.

As we mentioned above when discussing reordering:

> **Instruction reordering can preserve sequential semantics, but has no obligation to preserve multithreaded semantics**, so under multithreading, instruction reordering can cause problems.

In Java, `volatile` constrains reorderings related to reads and writes of that variable that could break its memory semantics, rather than prohibiting all instruction reordering optimizations.

## Summary

- Java was the first language to attempt to provide a memory model, primarily to simplify multithreaded programming and enhance program portability.
- CPUs can solve memory cache inconsistency issues by establishing cache coherence protocols (such as the [MESI protocol](https://zh.wikipedia.org/wiki/MESI%E5%8D%8F%E8%AE%AE)).
- To improve execution speed and performance, computers reorder instructions when executing program code. Simply put, the system does not necessarily execute code in the exact order it was written. **Instruction reordering can preserve sequential semantics, but has no obligation to preserve multithreaded semantics**, so under multithreading, instruction reordering can cause problems.
- You can view JMM as a set of specifications defined by Java for concurrent programming. Besides abstracting the relationship between threads and main memory, it also specifies the concurrency-related principles and rules that must be followed during the transformation from Java source code to CPU-executable instructions, primarily to simplify multithreaded programming and enhance program portability.
- JSR-133 introduced the concept of happens-before to describe memory visibility between two operations.

## References

- *The Art of Java Concurrency Programming*, Chapter 3: Java Memory Model
- *Demystifying Java Multithreading*: <http://concurrent.redspider.group/RedSpider.html>
- Research on Java Memory Access Reordering: <https://tech.meituan.com/2014/09/23/java-memory-reordering.html>
- Hey Classmate, Here Comes the Java Memory Model (JMM) You Asked For: <https://xie.infoq.cn/article/739920a92d0d27e2053174ef2>
- JSR 133 (Java Memory Model) FAQ: <https://www.cs.umd.edu/~pugh/java/memoryModel/jsr-133-faq.html>
