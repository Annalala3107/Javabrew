---
title: "Java IO Topic: BIO, NIO, AIO, I/O Models, and Design Patterns"
description: "Java IO and NIO learning roadmap covering BIO, NIO, AIO, blocking/non-blocking, synchronous/asynchronous, I/O multiplexing, the Reactor model, and I/O design patterns."
category: Java
tag:
  - Java
  - Java IO
  - Java Interview
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Java IO,Java NIO,BIO,NIO,AIO,IO Model,I/O Multiplexing,Reactor,Selector,Channel,Buffer,Java IO Interview Questions
lang: en
sourceRef: zh-ref/java/io/README.md
---

Java IO is an essential foundation for understanding file read/write operations, network programming, Netty, RPC frameworks, and high-performance servers. When learning IO, it is recommended to understand Java APIs, operating system I/O models, and common design patterns together so you can connect BIO, NIO, AIO, `Selector`, `Channel`, `Buffer`, and Reactor into a cohesive whole.

## Who Is This For

- Backend developers looking to systematically learn Java IO/NIO.
- Candidates preparing for interview questions related to BIO, NIO, AIO, I/O Multiplexing, and Reactor.
- Readers who want to continue learning network communication frameworks such as Netty, RPC, message queues, and database drivers.
- Engineers who tend to confuse concepts like blocking/non-blocking, synchronous/asynchronous, `Selector`, `Channel`, and `Buffer`.

## Learning Focus

- The Java IO stream hierarchy, Byte Streams, Character Streams, Buffered Streams, and common file operations.
- Applications of design patterns such as the Decorator pattern and Adapter pattern in IO.
- Differences, applicable scenarios, and pros and cons of BIO, NIO, and AIO models.
- Synchronous/asynchronous, blocking/non-blocking, I/O Multiplexing, Reactor, and Proactor.
- The collaborative relationship among `Buffer`, `Channel`, and `Selector`, as well as their roles in network programming.

## Recommended Reading Order

1. [Java IO Basics Summary](./io-basis.md): First master the IO stream hierarchy, commonly used classes, and file read/write basics.
2. [Java IO Design Patterns Summary](./io-design-patterns.md): Understand how design patterns like Decorator and Adapter are applied in the IO APIs.
3. [Detailed Explanation of Java IO Models](./io-model.md): Clarify BIO, NIO, AIO, synchronous/asynchronous, blocking/non-blocking, and I/O Multiplexing.
4. [Java NIO Core Knowledge Summary](./nio-basis.md): Dive deep into `Buffer`, `Channel`, `Selector`, and the NIO programming model.

## Core Articles

- [Java IO Basics Summary](./io-basis.md): Systematically introduces Byte Streams, Character Streams, Buffered Streams, random access files, and common IO classes.
- [Java IO Design Patterns Summary](./io-design-patterns.md): Explains applications of the Decorator pattern, Adapter pattern, and other design patterns in IO.
- [Detailed Explanation of Java IO Models](./io-model.md): Distinguishes BIO, NIO, AIO, synchronous/asynchronous, blocking/non-blocking, and I/O Multiplexing.
- [Java NIO Core Knowledge Summary](./nio-basis.md): Understand `Buffer`, `Channel`, `Selector`, `SelectionKey`, and NIO server programming.

## High-Frequency Questions

- What is the difference between a Byte Stream and a Character Stream? When should you use a Buffered Stream?
- Why is the Decorator pattern used so extensively in Java IO?
- What are the differences between BIO, NIO, and AIO?
- What do synchronous vs. asynchronous and blocking vs. non-blocking mean respectively?
- What problem does I/O Multiplexing solve?
- What are the differences between `select`, `poll`, and `epoll`?
- What is the Reactor model? How does it differ from Proactor?
- What responsibilities do `Buffer`, `Channel`, and `Selector` each take on in NIO?
- Why is Netty built on top of NIO instead of directly using traditional BIO?

## Related Topics

- [Java Knowledge System](../)
- [Java Concurrent Programming Topic](../concurrent/)
- [JVM Topic](../jvm/)
- [Computer Networks](../../cs-basics/network/)
