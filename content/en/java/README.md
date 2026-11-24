---
title: "Java Knowledge System: Basics, Collections, Concurrency, JVM, I/O, and New Features"
description: "Java interview and knowledge system learning roadmap covering Java basics, collection source code, concurrent programming, JVM, IO/NIO, and Java new features—ideal for campus recruiting, experienced hires, and Java backend interview review."
category: Java
tag:
  - Java
  - Java Basics
  - Java Interview
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Java,Java Basics,Java Collections,Java Concurrency,JVM,Java IO,Java NIO,Java New Features,Java Interview Questions,Java Backend Interview
lang: en
sourceRef: zh-ref/java/README.md
---

This **Java Knowledge System** is designed for Java backend learning and interview preparation, organizing Java-related articles on this site in the order of "Basic Syntax -> Collections Framework -> Concurrent Programming -> IO/NIO -> JVM -> New Features".

If you are short on time, it is recommended to start with the interview question summaries on Java Basics, Collections, Concurrency, and JVM to quickly build a checklist of high-frequency questions; if you want to systematically strengthen your foundations, you can follow the topic order below.

## Who Is This For

- Backend developers systematically learning Java.
- Candidates preparing for campus recruiting, experienced hire, and mid-to-large tech company Java backend interviews.
- Readers looking to connect Java basics, collections, concurrency, JVM, I/O, and new features for structured review.
- Engineers who have already built Java projects, but lack a systematic understanding of underlying principles, source code design, and engineering practices.

## Learning Focus

- Core mechanisms such as Java basic syntax, Object-Oriented Programming (OOP), exceptions, Generics, Reflection, proxies, and Serialization.
- Usage boundaries, source code implementations, and common interview questions for `List`, `Map`, `Queue`, and concurrent collections.
- Java threads, locks, JMM, CAS, AQS, Thread Pools, `CompletableFuture`, and Virtual Threads.
- JVM memory areas, class loading, Garbage Collection (GC), parameter configuration, monitoring tools, and production troubleshooting.
- BIO, NIO, AIO, I/O models, and I/O-related design patterns such as Decorator and Adapter.
- Important new features from Java 8 to Java 26, and which features genuinely impact daily development.

## Recommended Reading Order

1. [Java Basics Topic](./basis/): Start by mastering syntax, OOP, Generics, Reflection, proxies, Serialization, and other foundational capabilities.
2. [Java Collections Topic](./collection/): Understand the usage and source code of commonly used containers such as `ArrayList`, `LinkedList`, `HashMap`, and `ConcurrentHashMap`.
3. [Java Concurrent Programming Topic](./concurrent/): Systematically learn threads, locks, JMM, CAS, AQS, Thread Pools, and concurrency utilities.
4. [JVM Topic](./jvm/): Understand memory areas, class loading, Garbage Collection, JVM flags, and production troubleshooting.
5. [Java IO Topic](./io/): Fill in the gaps on BIO, NIO, AIO, Reactor, I/O Multiplexing, and I/O design patterns.
6. [Java New Features Topic](./new-features/): Review key features version by version, including Lambda, Stream, modularity, `var`, `Record`, and Virtual Threads.

## Core Articles

### Java Basics

- [Java Basics Topic](./basis/): Covers everything from basic syntax to core mechanisms and common Java interview questions.
- [Java Basics Common Interview Questions Summary (Part 1)](./basis/java-basic-questions-01.md): Covers Java language features, basic syntax, OOP, and commonly used classes.
- [Java Basics Common Interview Questions Summary (Part 2)](./basis/java-basic-questions-02.md): Continues covering exceptions, Generics, Reflection, annotations, and common details.
- [Java Basics Common Interview Questions Summary (Part 3)](./basis/java-basic-questions-03.md): Rounds out advanced foundational knowledge and common pitfalls.
- [Detailed Explanation of Java Pass-by-Value](./basis/why-there-only-value-passing-in-java.md): Clarifies the relationship between pass-by-value, reference variables, and object mutation.
- [Detailed Explanation of Java Serialization](./basis/serialization.md): Understand the serialization mechanism, `serialVersionUID`, security risks, and alternatives.
- [Detailed Explanation of Java Reflection](./basis/reflection.md) and [Detailed Explanation of Java Proxy Pattern](./basis/proxy.md): Master mechanisms commonly used under the hood of frameworks.

### Java Collections

- [Java Collections Topic](./collection/): Connects the Collections Framework, usage precautions, and common source code analyses.
- [Java Collections Common Interview Questions Summary (Part 1)](./collection/java-collection-questions-01.md) and [Java Collections Common Interview Questions Summary (Part 2)](./collection/java-collection-questions-02.md): Cover high-frequency questions on `List`, `Set`, `Map`, `Queue`, and concurrent collections.
- [Summary of Precautions for Using Java Collections](./collection/java-collection-precautions-for-use.md): Summarizes key considerations regarding null checks, iteration, resizing, thread safety, and performance.
- [ArrayList Source Code Analysis](./collection/arraylist-source-code.md), [HashMap Source Code Analysis](./collection/hashmap-source-code.md), and [ConcurrentHashMap Source Code Analysis](./collection/concurrent-hash-map-source-code.md): Understand the design trade-offs of common containers from their source code.

### Java Concurrency

- [Java Concurrent Programming Topic](./concurrent/): Centers around threads, locks, memory models, Thread Pools, and concurrency utilities.
- [Java Concurrency Common Interview Questions Summary (Part 1)](./concurrent/java-concurrent-questions-01.md), [Java Concurrency Common Interview Questions Summary (Part 2)](./concurrent/java-concurrent-questions-02.md), and [Java Concurrency Common Interview Questions Summary (Part 3)](./concurrent/java-concurrent-questions-03.md): Build a concurrency interview checklist.
- [Detailed Explanation of JMM (Java Memory Model)](./concurrent/jmm.md): Understand Visibility, Atomicity, Ordering, and happens-before.
- [Detailed Explanation of CAS](./concurrent/cas.md), [Detailed Explanation of AQS](./concurrent/aqs.md), and [Java Thread Pool Summary](./concurrent/java-thread-pool-summary.md): Master high-frequency low-level concurrency exam points.
- [Summary of Common Questions on Virtual Threads](./concurrent/virtual-thread.md): Understand the impact of Project Loom on the concurrency model.

### JVM and I/O

- [JVM Topic](./jvm/): Centers around memory, class loading, GC, parameters, tools, and production troubleshooting.
- [Detailed Explanation of Java Memory Areas (Key Focus)](./jvm/memory-area.md): Understand the Program Counter Register, JVM Stack, Native Method Stack, Heap, and Method Area.
- [Detailed Explanation of JVM Garbage Collection (Key Focus)](./jvm/jvm-garbage-collection.md): Understand object liveness determination, garbage collection algorithms, and mainstream garbage collectors.
- [Detailed Explanation of the Class Loading Process](./jvm/class-loading-process.md) and [Detailed Explanation of ClassLoader (Key Focus)](./jvm/classloader.md): Master the class lifecycle and the Parent Delegation Model.
- [Java IO Topic](./io/): Covers BIO, NIO, AIO, I/O models, and I/O design patterns.
- [Java IO Basics Summary](./io/io-basis.md), [Java NIO Core Knowledge Summary](./io/nio-basis.md), and [Detailed Explanation of Java IO Models](./io/io-model.md): Complete the prerequisite knowledge for network programming and middleware studies.

### Java New Features

- [Java New Features Topic](./new-features/): Reviews important language, standard library, and JVM features introduced after Java 8 by version.
- [Java 8 New Features in Practice](./new-features/java8-common-new-features.md): Master Lambda, Stream, `Optional`, interface default methods, and the new Date/Time API.
- [Java 11 New Features Overview (Important)](./new-features/java11.md), [Java 17 New Features Overview (Important)](./new-features/java17.md), and [Java 21 New Features Overview (Important)](./new-features/java21.md): Prioritize long-term usable features in LTS releases.

## High-Frequency Questions

- Why is Java pass-by-value? What actually happens when an object reference is passed as a parameter?
- What are the differences between `String`, `StringBuilder`, and `StringBuffer`?
- What is the relationship between `equals()` and `hashCode()`?
- How do you choose between `ArrayList` and `LinkedList`? Why is `HashMap` not thread-safe?
- What changed in `ConcurrentHashMap` between JDK 7 and JDK 8?
- What are the differences between `synchronized` and `ReentrantLock`?
- How does JMM guarantee Visibility, Ordering, and Atomicity?
- How should core parameters of a Thread Pool be configured? Why is it not recommended to use `Executors` directly?
- How are JVM memory areas divided? Which areas can experience OOM?
- What scenarios are G1, ZGC, and Shenandoah each suited for?
- What are the differences between BIO, NIO, and AIO? What problem does the Reactor model solve?
- Which new features in Java 8, 11, 17, and 21 are most worth mastering?

## Related Topics

- [Computer Science Basics](../cs-basics/)
- [System Design](../system-design/)
- [Databases](../database/)
- [Distributed Systems Knowledge System](../distributed-system/)
- [High-Performance Systems Knowledge System](../high-performance/)
