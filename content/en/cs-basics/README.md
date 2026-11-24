---
title: "Computer Science Fundamentals Knowledge System: Computer Networks, Operating Systems, Data Structures, and Algorithms"
description: "Computer Science fundamentals interview and learning roadmap covering Computer Networks, Operating Systems, Data Structures, Algorithms, Linux, TCP/IP, HTTP, DNS, and more, suitable for campus recruiting and experienced-hire review."
icon: "mdi:desktop-classic"
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: "Computer Science Fundamentals,CS Basics Summary,CS Interview Questions,Computer Networks,Network Interview Questions,Operating Systems,OS Interview Questions,Data Structures,Data Structure Interview Questions,Algorithms,Algorithm Interview Questions,Linux,TCP/IP,HTTP,DNS,Backend Interview,Java Interview,Technical Interview Prep"
  - - meta
    - property: og:title
      content: "Computer Science Fundamentals Knowledge System: Computer Networks, Operating Systems, Data Structures, and Algorithms"
  - - meta
    - property: og:description
      content: "Organizes core Computer Science fundamentals including Computer Networks, Operating Systems, Data Structures, and Algorithms for backend developers preparing for campus recruiting and experienced-hire interviews."
lang: en
sourceRef: zh-ref/cs-basics/README.md
---


This **Computer Science Fundamentals Knowledge System** is designed for backend learning and interview preparation, organizing all CS fundamentals articles on this site in the order of "Computer Networks -> Operating Systems -> Data Structures -> Algorithms".

If your time is limited, we recommend starting with [Common Computer Networks Interview Questions Summary](./network/other-network-questions.md) and [Common Operating Systems Interview Questions Summary](./operating-system/operating-system-basic-questions-01.md) to quickly build a checklist of high-frequency questions; if you want to systematically build up your fundamentals, you can follow the topic order below.

The site comes with **300+ technical diagrams**, using visual illustrations to explain abstract concepts clearly rather than piling up dry text.

![Overview of the Computer Science Fundamentals Summary](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/cs-basics-overview-34f37343.png)

## Who Is This For

- Backend developers systematically reinforcing their Computer Science fundamentals.
- Candidates preparing for campus recruiting, experienced-hire, or mid-to-large tech company backend interviews.
- Readers who want to connect Computer Networks, Operating Systems, Data Structures, and Algorithms into a complete knowledge system.
- Engineers who have already written business code, but whose foundations in TCP/IP, HTTP, processes and threads, memory management, trees and graphs, sorting, etc. are not yet solid enough.

## Learning Focus

- For Computer Networks, focus on understanding layered models, TCP/UDP, HTTP/HTTPS, DNS, ARP, NAT, and common network security issues.
- For Operating Systems, focus on understanding processes and threads, locks and synchronization, memory management, virtual memory, zero-copy, I/O multiplexing, file systems, Linux basics, and Shell usage.
- For Data Structures, focus on understanding the characteristics and applicable scenarios of arrays, linked lists, stacks, queues, hash tables, trees, graphs, heaps, Tries, Union-Find, skip lists, Red-Black trees, Bloom filters, and LRU.
- For Algorithms, focus on understanding complexity analysis, binary search, two pointers, sliding window, DFS/BFS, backtracking, dynamic programming, greedy algorithms, Top K, sorting, strings, linked lists, and high-frequency LeetCode problems.
- In interviews, you should be able to weave "Concept -> Principle -> Comparison -> Scenario -> Common Issues" into a complete answer.

## Recommended Reading Order

1. [Computer Networks](./network/): Start with layered models, HTTP, TCP, DNS, and common networking interview questions to build an overall understanding of network communication.
2. [Operating Systems](./operating-system/): Understand processes and threads, memory, file systems, Linux, and Shell to lay the groundwork for concurrency programming, the JVM, and databases.
3. [Data Structures](./data-structure/): Master common structures including linear structures, hash tables, trees, graphs, heaps, Tries, Union-Find, skip lists, Red-Black trees, Bloom filters, and LRU.
4. [Algorithms](./algorithms/): Practice by combining complexity analysis, core algorithm templates, and high-frequency LeetCode problems.
5. Return to interview questions to fill in gaps: Focus on reviewing high-frequency networking and operating system questions, then practice data structure and algorithm problems by category.

If your target companies place heavy emphasis on algorithms, it is recommended to combine steps 3 and 4 during your review: study one data structure first, then immediately solve its corresponding problem types. For example, after reading [Hash Tables](./data-structure/hash-table.md), solve Two Sum and Prefix Sum problems; after reading [Heaps](./data-structure/heap.md), solve [Top K](./algorithms/top-k.md); after reading [Trees](./data-structure/tree.md) and [Graphs](./data-structure/graph.md), focus on practicing [DFS & BFS](./algorithms/dfs-bfs.md), [Backtracking](./algorithms/backtracking.md), and [Dynamic Programming](./algorithms/dynamic-programming.md).

## Core Articles

### Computer Networks

- [Computer Networks](./network/): Organizes core computer networking knowledge and high-frequency interview questions by protocol layer.
- [Common Computer Networks Interview Questions Summary (Part 1)](./network/other-network-questions.md): Covers foundational topics such as the OSI/TCP-IP models, HTTP, HTTPS, and DNS.
- [Common Computer Networks Interview Questions Summary (Part 2)](./network/other-network-questions2.md): Continues with common questions on TCP, UDP, network security, and Sockets.
- [OSI Seven-Layer Model and TCP/IP Four-Layer Model Explained](./network/osi-and-tcp-ip-model.md): Establishes understanding of network layering and protocol responsibilities.
- [What Actually Happens from Entering a URL to Displaying the Page?](./network/the-whole-process-of-accessing-web-pages.md): Connects DNS, TCP, HTTP, browser rendering, and more through a single complete request.
- [HTTP vs HTTPS](./network/http-vs-https.md), [HTTP 1.0 vs HTTP 1.1](./network/http1.0-vs-http1.1.md), [Common HTTP Status Codes Summary](./network/http-status-codes.md): Focused coverage of high-frequency HTTP interview topics.
- [TCP Three-Way Handshake and Four-Way Wavehand](./network/tcp-connection-and-disconnection.md), [TCP Reliable Transmission Guarantees](./network/tcp-reliability-guarantee.md): Master TCP's core connection management and reliable transmission mechanisms.

### Operating Systems

- [Operating Systems](./operating-system/): Covers everything from OS fundamentals to common Linux interview questions.
- [Common Operating Systems Interview Questions Summary (Part 1)](./operating-system/operating-system-basic-questions-01.md): Covers OS basics, processes and threads, deadlocks, memory management, and related topics.
- [Common Operating Systems Interview Questions Summary (Part 2)](./operating-system/operating-system-basic-questions-02.md): Further organizes interview topics on file systems, I/O, Linux, and more.
- [Processes and Threads Explained: Differences, States, Communication, Context Switching, and Virtual Threads](./operating-system/process-and-thread.md): Explains resource boundaries, state transitions, context switching, and Java Virtual Threads for processes and threads.
- [Inter-Process Communication (IPC) Explained: Pipes, Message Queues, Shared Memory, Sockets, and Binder](./operating-system/ipc.md): Compares IPC mechanisms including pipes, message queues, shared memory, Sockets, and Binder.
- [OS Locks and Synchronization Mechanisms Explained: mutex, semaphore, condition variable, spinlock, and futex](./operating-system/os-lock-and-sync.md): Explains critical sections, mutexes, semaphores, condition variables, spinlocks, and futex.
- [OS Memory Management Explained: Paging, Segmentation, Page Replacement, Swap, and OOM](./operating-system/memory-management.md): Explains memory allocation, memory fragmentation, page tables, TLB, page replacement, Swap, and OOM.
- [Virtual Memory Explained: Address Translation, TLB, Page Faults, and Page Replacement](./operating-system/virtual-memory.md): Explains paging, page tables, TLB, page faults, and page replacement.
- [OS File System Explained: inode, VFS, Page Cache, and Journaling Mechanisms](./operating-system/file-system.md): Explains inode, dentry, file descriptors, VFS, Page Cache, and journaling mechanisms.
- [I/O Multiplexing Explained: Principles and Differences of select, poll, and epoll](./operating-system/io-multiplexing.md): Explains the implementation principles, performance differences, and applicable scenarios of select, poll, and epoll.
- [Zero-Copy Explained: mmap, sendfile, and splice](./operating-system/zero-copy.md): Explains the copy paths and engineering applications of traditional I/O, mmap, sendfile, and splice.
- [Linux Fundamentals Summary](./operating-system/linux-intro.md): Master Linux directories, file permissions, common commands, and system basics.
- [Shell Scripting Fundamentals Summary](./operating-system/shell-intro.md): Strengthen skills in script writing, variables, control flow, and common commands.

### Data Structures

- [Data Structures](./data-structure/): Organizes common data structures with visual diagrams by structure type.
- [Linear Data Structures Explained](./data-structure/linear-data-structure.md): Understand the storage characteristics and operation complexities of arrays, linked lists, stacks, and queues.
- [Hash Table Interview Questions Summary](./data-structure/hash-table.md): Understand hash functions, hash collisions, resizing, and their connection to Java `HashMap`.
- [Tree Structures Explained](./data-structure/tree.md): Master common tree structures including binary trees, binary search trees, AVL, B-trees, and B+ trees.
- [Graphs Explained](./data-structure/graph.md): Understand fundamental algorithms such as graph representations, DFS, BFS, and shortest paths.
- [Heaps Explained](./data-structure/heap.md), [Red-Black Trees Explained](./data-structure/red-black-tree.md), [Bloom Filters Explained](./data-structure/bloom-filter.md): Fill in high-frequency engineering structures and interview topics.
- [Trie Prefix Tree Interview Questions Summary](./data-structure/trie.md), [Union-Find Interview Questions Summary](./data-structure/union-find.md), [Skip List Interview Questions Summary](./data-structure/skip-list.md), [LRU Cache Interview Questions Summary](./data-structure/lru-cache.md): Cover high-frequency scenarios such as string sets, connectivity, Redis ZSet, and cache eviction.

When reviewing data structures, you can cross-reference the Java and Database topics at the same time: arrays/linked lists/hash tables correspond to [Java Collections](../java/collection/), B+ trees correspond to [MySQL Indexes](../database/mysql/mysql-index.md), skip lists correspond to [Redis Skip Lists](../database/redis/redis-skiplist.md), and LRU and Bloom filters correspond to caching scenarios.

### Algorithms

- [Algorithms](./algorithms/): Organizes common algorithmic paradigms, high-frequency LeetCode problems, and classic sorting algorithms.
- [Time and Space Complexity Interview Guide](./algorithms/complexity-analysis.md): Master Big O, recursive complexity, and common complexity misjudgments.
- [Binary Search Interview Questions Summary](./algorithms/binary-search.md), [Two Pointers and Sliding Window Interview Questions Summary](./algorithms/two-pointers-and-sliding-window.md): Master the most common hand-written templates for array, string, and linked list problems.
- [DFS & BFS Interview Questions Summary](./algorithms/dfs-bfs.md), [Backtracking Algorithm Interview Questions Summary](./algorithms/backtracking.md): Master tree, graph, and matrix search, permutations/combinations, and path enumeration.
- [Dynamic Programming Interview Questions Summary](./algorithms/dynamic-programming.md), [Greedy Algorithm Interview Questions Summary](./algorithms/greedy.md), [Top K Problem Interview Questions Summary](./algorithms/top-k.md): Strengthen optimal value, interval greedy, heap, and data stream problem types.
- [Classic Algorithmic Paradigms Summary](./algorithms/classical-algorithm-problems-recommendations.md): Covers common paradigms such as binary search, two pointers, sliding window, backtracking, and dynamic programming.
- [Recommended Classic LeetCode Problems for Common Data Structures](./algorithms/common-data-structures-leetcode-recommendations.md): Organizes a problem-solving roadmap by data structure type.
- [Several Common String Algorithm Problems](./algorithms/string-algorithm-problems.md), [Several Common Linked List Algorithm Problems](./algorithms/linkedlist-algorithm-problems.md): Focused practice on high-frequency problem types.
- [Selected Coding Problems from Coding Interviews (Jianzhi Offer)](./algorithms/the-sword-refers-to-offer.md), [Summary of 10 Classic Sorting Algorithms](./algorithms/10-classical-sorting-algorithms.md): Ideal for pre-interview review.

For algorithm practice, it is recommended to get solid at writing each category's template before working through problem lists: [Classic Algorithmic Paradigms Summary](./algorithms/classical-algorithm-problems-recommendations.md) is suitable for practicing by problem pattern, while [Recommended Classic LeetCode Problems for Common Data Structures](./algorithms/common-data-structures-leetcode-recommendations.md) is suitable for practicing by structure.

## High-Frequency Questions

- What are the OSI seven-layer model and the TCP/IP four-layer model? What problem does each layer solve?
- What steps take place from entering a URL to displaying the page?
- What is the difference between HTTP and HTTPS? Why is HTTPS more secure?
- What problems do the TCP three-way handshake and four-way wavehand solve respectively? Why does `TIME_WAIT` exist?
- How does TCP guarantee reliable transmission? How do you choose between TCP and UDP?
- What is the difference between a process and a thread? What is a deadlock, and how can it be avoided?
- What are OS memory management, virtual memory, paging, and segmentation?
- What scenarios are arrays, linked lists, stacks, queues, trees, graphs, and heaps each suited for?
- Where are hash tables, Red-Black trees, B+ trees, skip lists, Bloom filters, and LRU commonly used in engineering?
- How do you build problem-solving templates by pattern when practicing algorithm problems?

## Related Topics

- [Java Knowledge System](../java/)
- [Database Knowledge System](../database/)
- [Distributed Systems Knowledge System](../distributed-system/)
- [High-Performance Systems Knowledge System](../high-performance/)
- [System Design](../system-design/)
