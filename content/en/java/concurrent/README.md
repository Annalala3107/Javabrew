---
title: "Java Concurrency Topic: Threads, Locks, JMM, CAS, AQS, Thread Pools & Virtual Threads"
description: "Java concurrency interview and learning roadmap covering threads, locks, synchronized, ReentrantLock, JMM, CAS, AQS, ThreadLocal, thread pools, CompletableFuture, and virtual threads."
category: Java
tag:
  - Java
  - Java Concurrency
  - Java Interview
lang: en
sourceRef: zh-ref/java/concurrent/README.md
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Java concurrency,Java locks,synchronized,ReentrantLock,JMM,CAS,AQS,ThreadLocal,Thread Pool,CompletableFuture,concurrent collections,Atomic,Virtual Thread
---

Java concurrent programming is one of the most important—and most easily confused—modules in backend development and interviews. Learning concurrency cannot rely on merely memorizing APIs; you need to understand thread lifecycles, lock mechanisms, the memory model, atomic operations, thread pools, and concurrency utilities along a single unified thread of reasoning.

## Who Is This For

- Backend developers who want to systematically learn Java concurrent programming.
- Candidates preparing for interview questions on threads, locks, JMM, CAS, AQS, Thread Pools, and related topics.
- Readers who already use multithreading in projects, but are not yet sufficiently familiar with issues such as Deadlock, Thread Pool parameters, and `ThreadLocal` memory leaks.
- Engineers who want to understand engineering practices and capabilities around concurrent collections, `CompletableFuture`, Virtual Threads, and more.

## Learning Focus

- Thread creation, lifecycle, context switching, thread safety, and common concurrency issues.
- Applicable boundaries of `synchronized`, `volatile`, `ReentrantLock`, mutual exclusion locks, read-write locks, Optimistic Locking, and Pessimistic Locking.
- JMM, happens-before, Instruction Reordering, Visibility, Atomicity, and Ordering.
- Underlying ideas behind CAS, `Atomic` classes, AQS, concurrent collections, and Blocking Queues.
- Thread Pool core parameters, Rejection Policies, task queues, parameter configuration, and production best practices.
- Usage patterns and risks of `CompletableFuture`, `ThreadLocal`, and Virtual Threads in real-world projects.

## Recommended Reading Order

1. [Java Concurrency Common Interview Questions Summary (Part 1)](./java-concurrent-questions-01.md): Start by building a foundational checklist of questions on threads, locks, and thread safety.
2. [Java Concurrency Common Interview Questions Summary (Part 2)](./java-concurrent-questions-02.md) and [Java Concurrency Common Interview Questions Summary (Part 3)](./java-concurrent-questions-03.md): Continue filling in JMM, CAS, AQS, Thread Pools, and concurrency utilities.
3. [Detailed Explanation of Java Locks](./java-lock.md), [Detailed Explanation of Optimistic Locking and Pessimistic Locking](./optimistic-lock-and-pessimistic-lock.md), [Detailed Explanation of CAS](./cas.md), and [Detailed Explanation of JMM (Java Memory Model)](./jmm.md): Establish the lock system first, then understand the low-level semantics of concurrency control.
4. [Detailed Explanation of AQS](./aqs.md) and [Understanding AQS Principles and Applications from the Implementation of ReentrantLock](./reentrantlock.md): Gain a deep understanding of Java locks and synchronizers.
5. [Java Thread Pool Summary](./java-thread-pool-summary.md) and [Java Thread Pool Best Practices](./java-thread-pool-best-practices.md): Master the most commonly used concurrency infrastructure in production.

## Core Articles

### Concurrency Interview Questions

- [Java Concurrency Common Interview Questions Summary (Part 1)](./java-concurrent-questions-01.md): Covers thread fundamentals, thread safety, locks, and common concurrency issues.
- [Java Concurrency Common Interview Questions Summary (Part 2)](./java-concurrent-questions-02.md): Continues organizing core knowledge around JMM, `volatile`, CAS, AQS, and more.
- [Java Concurrency Common Interview Questions Summary (Part 3)](./java-concurrent-questions-03.md): Rounds out Thread Pools, concurrency utility classes, `CompletableFuture`, Virtual Threads, and more.

### Locks, Memory Model, and Synchronizers

- [Detailed Explanation of Java Locks](./java-lock.md): Builds the Java lock hierarchy from mutual exclusion locks, read-write locks, and Spin Locks to `synchronized`, `ReentrantLock`, and AQS.
- [Detailed Explanation of Optimistic Locking and Pessimistic Locking](./optimistic-lock-and-pessimistic-lock.md): Understands different concurrency conflict handling strategies.
- [Detailed Explanation of CAS](./cas.md): Understands Compare-And-Swap, the ABA problem, and spin overhead.
- [Detailed Explanation of JMM (Java Memory Model)](./jmm.md): Masters Visibility, Atomicity, Ordering, and happens-before.
- [Detailed Explanation of AQS](./aqs.md): Understands the synchronization queue, exclusive/shared modes, and the internals of common synchronizers.
- [Understanding AQS Principles and Applications from the Implementation of ReentrantLock](./reentrantlock.md): Deeply understands AQS through `ReentrantLock`.

### Concurrency Utilities and Engineering Practices

- [Java Thread Pool Summary](./java-thread-pool-summary.md): Understands core parameters, task queues, Rejection Policies, and execution flow.
- [Java Thread Pool Best Practices](./java-thread-pool-best-practices.md): Summarizes recommendations for Thread Pool isolation, parameter configuration, and monitoring in production environments.
- [Summary of Common Java Concurrent Collections](./java-concurrent-collections.md): Organizes containers such as `ConcurrentHashMap`, `CopyOnWriteArrayList`, and `BlockingQueue`.
- [Summary of Atomic Classes](./atomic-classes.md): Understands atomic updates for primitive types, arrays, references, and fields.
- [Detailed Explanation of ThreadLocal](./threadlocal.md): Understands thread-local variables, `ThreadLocalMap`, and memory leak risks.
- [Detailed Explanation of CompletableFuture](./completablefuture-intro.md): Masters asynchronous orchestration, exception handling, and Thread Pool usage.
- [Summary of Common Questions on Virtual Threads](./virtual-thread.md): Understands the positioning, applicable scenarios, and usage limitations of Virtual Threads.

## High-Frequency Questions

- What is the difference between a Thread and a Process? What states does a Thread have?
- What is thread safety? How do you locate a Deadlock?
- What are the differences between mutual exclusion locks, read-write locks, and Spin Locks?
- What are the differences between `synchronized` and `ReentrantLock`?
- Can `volatile` guarantee Atomicity? What problems does it solve?
- What is JMM? What is the purpose of happens-before rules?
- What are the pros and cons of CAS? How is the ABA problem solved?
- What is the core idea of AQS? Which utility classes are built on AQS?
- How should core parameters of a Thread Pool be configured? How do you choose a Rejection Policy?
- Why is it not recommended to create Thread Pools directly using `Executors`?
- Why can `ThreadLocal` cause a memory leak?
- What are the risks of `CompletableFuture`'s default Thread Pool?
- Are Virtual Threads suitable for CPU-intensive tasks?

## Related Topics

- [Java Knowledge System](../)
- [Java Collections Topic](../collection/)
- [JVM Topic](../jvm/)
- [Java IO Topic](../io/)
- [Operating Systems](../../cs-basics/operating-system/)
