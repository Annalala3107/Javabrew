---
title: "Operating Systems: Processes & Threads, Memory Management, File Systems, I/O Multiplexing, Linux & Shell"
description: "Operating system interview guide and learning roadmap, covering processes and threads, inter-process communication (IPC), locking and synchronization, deadlock, virtual memory, zero-copy, I/O multiplexing, file systems, Linux fundamentals, Shell scripting, and common OS interview questions."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Linux
  - Shell
sidebar: false
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Operating System,OS Interview Questions,Process,Thread,Inter-Process Communication,IPC,Locks and Synchronization,Mutex,Semaphore,Condition Variable,futex,Deadlock,Memory Management,Virtual Memory,Zero-Copy,I/O Multiplexing,select,poll,epoll,File System,Linux,Shell,Backend Interview
lang: en
sourceRef: zh-ref/cs-basics/operating-system/README.md
---

This **Operating Systems Topic Guide** is designed for backend learning and interview preparation. It covers OS fundamentals, processes and threads, inter-process communication (IPC), locks and synchronization, memory management, virtual memory, zero-copy, I/O multiplexing, file systems, Linux, and Shell.

## Target Audience

- Backend developers systematically learning operating system fundamentals.
- Candidates preparing for campus recruiting, experienced hire, and tech company OS interview questions.
- Readers who only memorize disconnected points about processes, threads, deadlocks, memory management, and Linux commands.
- Engineers looking to build a solid foundation for Java concurrency, the JVM, databases, and network programming.

## Key Learning Objectives

- The operating system manages the CPU, memory, files, I/O, and processes, serving as the foundational underpinning for understanding higher-level software runtime mechanisms.
- Processes, threads, and inter-process communication are core concepts in concurrent programming, server-side performance, and troubleshooting.
- Locks and synchronization, deadlock, context switching, and CPU scheduling are frequent interview focus areas.
- Memory management, virtual memory, paging, and page replacement build deep understanding of the JVM, databases, and caching layers.
- Zero-copy and I/O multiplexing help demystify high-performance middleware such as Kafka, RocketMQ, Redis, Nginx, and Netty.
- Linux and Shell skills are essential everyday competencies for backend development, deployment, troubleshooting, and automation scripting.

## Recommended Reading Order

1. [Common Operating System Interview Questions Summary (Part 1)](./operating-system-basic-questions-01.md): Establish a baseline checklist of high-frequency questions covering OS basics, processes, threads, deadlocks, and memory management.
2. [Common Operating System Interview Questions Summary (Part 2)](./operating-system-basic-questions-02.md): Continue filling out coverage on file systems, I/O, Linux, and related topics.
3. [Deep Dive into Processes and Threads: Differences, States, Communication, Context Switching, and Virtual Threads](./process-and-thread.md): Systematically understand processes, threads, PCB/TCB, fork/exec/wait, threading models, and context switching.
4. [Deep Dive into Interrupts, Exceptions, and System Calls: From Kernel Entry to Page Faults](./interrupt-exception-syscall.md): Trace hardware interrupts, synchronous exceptions, system calls, signals, page faults, and thread switching using `read()` as a cohesive thread.
5. [Deep Dive into CPU Scheduling and System Load](./cpu-scheduling-and-load.md): Understand scheduling algorithms, CFS/EEVDF, load average, CPU utilization, and production troubleshooting strategies.
6. [Deep Dive into Inter-Process Communication (IPC): Pipes, Message Queues, Shared Memory, Sockets, and Binder](./ipc.md): Compare IPC mechanisms including pipes, message queues, shared memory, semaphores, sockets, and Binder.
7. [Deep Dive into Operating System Locks and Synchronization: Mutex, Semaphore, Condition Variable, Spinlock, and Futex](./os-lock-and-sync.md): Clarify boundaries and responsibilities across critical sections, mutexes, semaphores, condition variables, spinlocks, and futexes.
8. [Deep Dive into Deadlock: Four Necessary Conditions, Java Deadlock Troubleshooting, and Database Deadlock Handling](./dead-lock.md): Clearly explain circular wait, the four necessary conditions, Java thread deadlock troubleshooting, and database transaction retries.
9. [Deep Dive into OS Memory Management: Paging, Segmentation, Page Replacement, Swap, and OOM](./memory-management.md): Understand memory allocation, fragmentation, page tables, page reclamation, and OOM.
10. [Deep Dive into Virtual Memory: Address Translation, TLB, Page Faults, and Page Replacement](./virtual-memory.md): Connect the dots between paging, page tables, TLB, page faults, and page replacement.
11. [Deep Dive into File Systems: Inodes, VFS, Page Cache, and Journaling](./file-system.md): Understand files, directories, inodes, VFS, Page Cache, and crash recovery with journaling.
12. [Deep Dive into I/O Multiplexing: Principles and Differences of select, poll, and epoll](./io-multiplexing.md): Understand the kernel mechanisms that allow a single thread to handle massive concurrent connections.
13. [Deep Dive into Zero-Copy: mmap, sendfile, and splice](./zero-copy.md): Master the exact data copying paths and ideal use cases for traditional I/O, mmap, sendfile, and splice.
14. [Linux Fundamentals Summary](./linux-intro.md): Master the directory hierarchy, file permissions, essential commands, and basic troubleshooting skills.
15. [Shell Scripting Fundamentals Summary](./shell-intro.md): Learn variables, conditionals, loops, functions, and common script patterns.

## Core Articles

- [Common Operating System Interview Questions Summary (Part 1)](./operating-system-basic-questions-01.md): Covers OS fundamentals, processes, threads, deadlocks, memory management, and other high-frequency questions.
- [Common Operating System Interview Questions Summary (Part 2)](./operating-system-basic-questions-02.md): Consolidates knowledge across file systems, I/O, multiplexing, Linux, and more.
- [Deep Dive into Processes and Threads: Differences, States, Communication, Context Switching, and Virtual Threads](./process-and-thread.md): Explains resource boundaries between processes and threads, state transitions, Linux creation mechanisms, and Java virtual threads.
- [Deep Dive into Interrupts, Exceptions, and System Calls: From Kernel Entry to Page Faults](./interrupt-exception-syscall.md): Explains the relationships between hardware interrupts, synchronous exceptions, system calls, signals, and page faults.
- [Deep Dive into CPU Scheduling and System Load](./cpu-scheduling-and-load.md): Explains task scheduling, CFS/EEVDF, load average, CPU utilization, and standard diagnostic commands.
- [Deep Dive into Inter-Process Communication (IPC): Pipes, Message Queues, Shared Memory, Sockets, and Binder](./ipc.md): Explains the mechanics, trade-offs, and architecture selection criteria for major IPC mechanisms.
- [Deep Dive into Operating System Locks and Synchronization: Mutex, Semaphore, Condition Variable, Spinlock, and Futex](./os-lock-and-sync.md): Explains critical sections, mutexes, semaphores, condition variables, spinlocks, futexes, memory ordering, and kernel lock contexts.
- [Deep Dive into Deadlock: Four Necessary Conditions, Java Deadlock Troubleshooting, and Database Deadlock Handling](./dead-lock.md): Explains conditions for deadlock formation, resource allocation graphs, Java diagnostic tools, database deadlock detection, and application retry strategies.
- [Deep Dive into OS Memory Management: Paging, Segmentation, Page Replacement, Swap, and OOM](./memory-management.md): Explains VSZ/RSS/PSS, contiguous allocation, memory fragmentation, buddy allocator, page tables, TLB, page faults, page reclamation, and OOM.
- [Deep Dive into Virtual Memory: Address Translation, TLB, Page Faults, and Page Replacement](./virtual-memory.md): Explains virtual addresses, physical addresses, paging, multi-level page tables, TLB, page faults, and page replacement algorithms.
- [Deep Dive into File Systems: Inodes, VFS, Page Cache, and Journaling](./file-system.md): Explains files, directories, inodes, dentries, file descriptors, VFS, Page Cache, fsync, and journaling mechanisms.
- [Deep Dive into I/O Multiplexing: Principles and Differences of select, poll, and epoll](./io-multiplexing.md): Explains the two stages of network I/O, five I/O models, and key architectural differences between select, poll, and epoll.
- [Deep Dive into Zero-Copy: mmap, sendfile, and splice](./zero-copy.md): Explains what zero-copy actually eliminates and highlights real-world applications in Java NIO, Kafka, and RocketMQ.
- [Linux Fundamentals Summary](./linux-intro.md): Explains the Linux directory tree, file permissions, standard commands, users, and process management.
- [Shell Scripting Fundamentals Summary](./shell-intro.md): Explains Shell variables, conditional statements, loops, functions, text processing, and real-world scripting practices.

## Frequently Asked Questions

- What are the differences between a process and a thread? What resources are shared between threads?
- What are the common inter-process communication (IPC) mechanisms? What scenarios are they best suited for?
- What is context switching? What is the impact of frequent context switches?
- What problems do mutexes, semaphores, condition variables, spinlocks, and futexes each solve?
- What are the four necessary conditions for deadlock? How do you diagnose and resolve deadlocks in Java and databases?
- What is virtual memory? What is the difference between paging and segmentation?
- What specific problems do TLB, page faults, and page replacement solve?
- What are common page replacement algorithms? What actually happens during a page fault?
- Why is zero-copy fast? What are the differences between mmap, sendfile, and splice?
- What are file system inodes, hard links, and symbolic links?
- What are the differences between select, poll, and epoll?
- How do Linux file permissions work? What are the most common troubleshooting commands?
- What kinds of automation problems are Shell scripts best suited to solve?

## Related Topics

- [Computer Science Fundamentals System](../)
- [Computer Networking](../network/)
- [Data Structures](../data-structure/)
- [Java Concurrent Programming](../../java/concurrent/java-concurrent-questions-01.md)
- [JVM Memory Areas](../../java/jvm/memory-area.md)
