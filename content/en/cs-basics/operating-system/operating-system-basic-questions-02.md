---
title: Operating System Common Interview Questions Summary (Part 2)
description: Summary of the latest high-frequency operating system interview questions (Part 2), covering memory management, VSZ/RSS/PSS, virtual memory, TLB, Page Faults, page replacement, blocking I/O, I/O multiplexing, zero-copy, file systems, Page Cache, fsync, and disk scheduling.
category: CS Basics
tag:
  - Operating System
head:
  - - meta
    - name: keywords
      content: operating system interview questions, memory management, VSZ, RSS, PSS, virtual memory, process address space, process isolation, shared memory, paging vs segmentation, page replacement algorithms, memory fragmentation, buddy system, TLB, Page Fault, SIGSEGV, Swap, OOM, blocking I/O, read system call, zero-copy, mmap, sendfile, splice, I/O multiplexing, select, poll, epoll, file system, inode, VFS, Page Cache, fsync
lang: en
sourceRef: zh-ref/cs-basics/operating-system/operating-system-basic-questions-02.md
---

This article, *Operating System Common Interview Questions Summary (Part 2)*, builds upon Part 1, focusing specifically on **memory management, virtual memory, paging and segmentation, TLB, page faults, page replacement, I/O multiplexing, zero-copy, file systems, and disk scheduling**.

While Part 1 leaned toward "processes, threads, and concurrency control," Part 2 shifts toward "how programs actually utilize memory, conduct I/O, and interact with the file system at runtime." Although these concepts may seem distant from daily business code, many backend engineering questions ultimately trace back to them: Why does `mmap` eliminate one data copy? Why can `epoll` handle millions of concurrent connections? Why do identical virtual addresses in different processes not interfere with each other? Why does frequent page faulting severely slow down a system?

When reading, follow one central thread: **The operating system manages addressing and isolation via virtual memory, coordinates data movement through I/O mechanisms, and manages persistent data through the file system**. Connecting these core concepts makes individual terms intuitive rather than isolated definitions.

## Memory Management

### What Does Memory Management Primarily Do?

![Memory Management Responsibilities Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-management-responsibilities-33a411e9.webp)

When answering "what does memory management do" in an interview, you can structure your answer around five core tasks:

- **Allocating and Reclaiming Memory**: User-space allocators request or release virtual address regions from the kernel via interfaces like `brk()` and `mmap()`; the kernel then manages physical pages and kernel data structures.
- **Address Translation**: When a program accesses a virtual address, the CPU's MMU works with page tables and the TLB to translate the virtual address into a physical address.
- **Process Isolation and Permission Protection**: Each process possesses its own address space, and page table entries store permission flags such as read, write, execute, and user/kernel mode access.
- **Page Reclamation and Swapping**: Under physical memory pressure, the kernel reclaims file-backed pages or anonymous pages, swapping anonymous pages out to disk when necessary.
- **Sharing and Memory Mapping**: Shared dynamic libraries, shared-memory IPC, `mmap()` file mappings, and Copy-On-Write (COW) all rely on mapping virtual addresses to underlying physical pages.

In an interview, keep this main thread in mind: memory management separates the address viewed by a program from actual physical memory, governing memory through allocation, mapping, protection, and reclamation.

### What Is the Difference Between VSZ, RSS, and PSS?

When monitoring process memory in Linux, VSZ, RSS, and PSS are most frequently confused:

- **VSZ (Virtual Memory Size)**: The total size of the virtual address space mapped by the process. It includes anonymous mappings not yet resident in physical RAM, file mappings, shared libraries, and reserved address ranges. It cannot be treated as actual physical memory consumption.
- **RSS (Resident Set Size)**: The total amount of physical RAM currently allocated and mapped to the process. Shared libraries, shared memory, and shared pages in the Page Cache are also counted toward the RSS of all referencing processes.
- **PSS (Proportional Set Size)**: The process's actual memory footprint after dividing shared pages proportionally among the processes sharing them. If a physical page is shared among 4 processes, each process's PSS accounts for only one-fourth of that page.

Therefore, RSS is useful when evaluating a single process's resident memory footprint; when estimating the combined physical memory usage of multiple processes, PSS is much more accurate. Naively summing the RSS of multiple processes invariably double-counts shared memory pages.

Useful diagnostic commands:

```bash
grep -E 'VmSize|VmRSS|RssAnon|RssFile|RssShmem|VmSwap' /proc/<pid>/status
cat /proc/<pid>/smaps_rollup
```

### What Is Memory Fragmentation?

Memory fragmentation is generated through repeated memory allocation and deallocation, generally categorized into two forms:

- **Internal Memory Fragmentation**: Memory allocated to a process that remains unused by it. The main cause is fixed-granularity allocation (e.g., powers of two), where allocated space exceeds actual process requirements. For example, if a process requests 65 bytes but is assigned 128 (2^7) bytes, the remaining 63 bytes constitute internal fragmentation.
- **External Memory Fragmentation**: Small, unallocated continuous memory chunks that are too fragmented to satisfy any single allocation request. In other words, external fragmentation refers to memory that is unallocated to any process yet cannot be utilized. The segmentation mechanism discussed later is a classic cause of external fragmentation.

![Continuous Memory Allocation and Fragmentation](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-fragmentation-953d5791.webp)

Memory fragmentation reduces overall memory utilization. Mitigating memory fragmentation is a fundamental objective in memory management design.

### What Are Common Memory Management Approaches?

Memory management approaches can be broadly classified into two categories:

- **Contiguous Memory Management**: Allocates a single contiguous memory block to a user program, typically resulting in poor memory utilization.
- **Non-Contiguous Memory Management**: Allows memory assigned to a single program to reside in disjoint or non-adjacent physical frames, providing far greater flexibility.

#### Contiguous Memory Management

**Block-Based Allocation** was an early contiguous memory management scheme that suffered from severe fragmentation. It divided physical memory into several fixed-size blocks, each hosting a single process. When an application required memory, the OS allocated an entire block; if the program needed only a fraction of that block, the remainder was wasted as internal fragmentation. Furthermore, small unused spaces between blocks formed external fragmentation that could not be repurposed for new allocations.

In Linux, contiguous memory allocation at the physical page level is implemented using the **Buddy System Algorithm**, a classic algorithm designed to combat external memory fragmentation. The buddy system divides memory into blocks sized in powers of two (e.g., 2^6 = 64 KB) and pairs adjacent blocks of identical size into "buddies" (note: **they must be adjacent to qualify as buddies**).

When an allocation request arrives, the buddy system locates a block of the best-fitting power-of-two size. If available blocks are larger, the algorithm splits a block in half, creating two equal buddy blocks. If still too large, it continues halving recursively until the ideal size is reached.

When two adjacent buddy blocks are both freed, the system merges them back into a single larger block, making it available for subsequent larger requests. This coalescing mechanism mitigates external fragmentation and elevates memory utilization.

![Buddy System Memory Management](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/linux-buddy-system-36d2b5a0.png)

Although it resolves external fragmentation, the buddy system still produces internal fragmentation. Because it allocates exclusively in sizes of 2^n, requesting any size that is not an exact power of two leaves memory wasted. For instance, allocating 65 bytes still necessitates reserving a 2^7 = 128 byte block.

![Buddy System Memory Waste](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/buddy-system-memory-waste-ad263360.png)

To address the internal fragmentation and performance penalties caused by frequent allocations of small objects, Linux utilizes **SLAB/SLUB** allocators on top of the buddy system. These allocators cache commonly used kernel objects, reusing pre-initialized memory chunks categorized by object type, avoiding repetitive allocation, initialization, and deallocation cycles.

#### Non-Contiguous Memory Management

Non-contiguous memory management includes three primary mechanisms:

- **Segmentation**: Manages and allocates physical memory in variable-sized segments representing contiguous physical chunks. The application's virtual address space is split into logically meaningful segments (e.g., main program segment MAIN, subprogram segment X, data segment D, and stack segment S).
- **Paging**: Divides physical memory into contiguous, fixed-size physical frames, while partitioning the application's virtual address space into contiguous, fixed-size virtual pages. This is the dominant memory management architecture used in modern operating systems.
- **Segmented Paging**: Combines segmentation with paging. A program's address space is first divided logically into segments, and each segment is then subdivided into fixed-size pages. Physical memory is allocated strictly in page frames.

### Virtual Memory

#### What Is Virtual Memory? What Is Its Purpose?

**Virtual Memory** is a memory abstraction layer provided by the operating system. Applications perceive a contiguous, private virtual address space, while the actual physical placement of data in RAM is orchestrated jointly by the operating system and hardware MMU.

In essence, virtual memory decouples the addresses used by programs from physical addresses on RAM sticks. When a process accesses a virtual address, the MMU in the CPU translates it into a physical address via page tables before accessing actual physical memory.

![Virtual Memory as a Bridge for Process Access to Main Memory](/media/jg/ext/oss.javaguide.cn/xingqiu/virtual-memory-8588d30a.png)

In summary, virtual memory delivers several critical capabilities:

- **Process Isolation**: Each process possesses its own virtual address space and page tables. Even if two processes reference the exact same numerical virtual address, they map to distinct physical pages, preventing memory corruption across processes.
- **Improved Physical Memory Utilization**: The OS does not need to load a program's entire code and dataset into RAM at once; it loads only the pages actively referenced.
- **Simplified Memory Management**: A process sees a simple contiguous virtual address space, while underlying physical memory can be scattered across non-contiguous page frames. The translation is handled by page tables and the MMU.
- **Physical Memory Sharing**: Shared dynamic libraries loaded across multiple processes can map to the exact same physical pages; processes can also explicitly establish shared memory regions via IPC for high-performance data exchange.
- **Enhanced Security and Protection**: The OS controls access rights (read/write/execute) at page granularity, enforcing boundaries between processes and safeguarding kernel memory.
- **Larger Usable Address Space**: When physical RAM is exhausted, inactive pages can be paged out to disk, bringing them back only when requested. The address space accessible to programs can logically surpass physical RAM capacity, though excessive paging degrades performance.

#### What Problems Would Arise Without Virtual Memory?

Without virtual memory, programs would directly reference and manipulate physical memory addresses. While removing an intermediary layer might sound simpler, it introduces severe vulnerabilities:

1. Applications could access arbitrary physical memory addresses, accidentally tampering with critical OS structures, triggering system crashes, and destroying security boundaries.
2. Concurrent programs would routinely collide. For example, if both WeChat and QQ Music run concurrently and WeChat writes a value to address `0x1000`, followed by QQ Music writing to `0x1000`, QQ Music overwrites WeChat's data, causing WeChat to malfunction or crash.
3. All code and data for every running program would have to be loaded entirely into physical RAM. Based on the principle of locality, much of that data may never be touched, wasting scarce RAM resources.
4. ...

#### What Are Virtual Addresses and Physical Addresses?

A **Physical Address** is the actual address referencing physical RAM, specifically the address presented to the memory controller and bus. Memory addresses manipulated by user-space programs are **Virtual Addresses**.

Whenever we write software, our code interacts exclusively with virtual addresses. For instance, in C or C++, the value stored in a pointer is a virtual address.

The operating system converts virtual addresses to physical addresses using the **MMU (Memory Management Unit)** on the CPU, a process termed **Address Translation**. In modern architectures, translation relies on page tables, while the TLB caches recent translations to minimize memory lookup latency.

![Address Translation Process](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/physical-virtual-address-translation-c2c78161.png)

After the MMU translates the virtual address into a physical address, the CPU accesses the corresponding physical memory location. Because of this abstraction, the exact same virtual address in two separate processes maps to entirely different physical RAM pages.

This forms the cornerstone of process isolation and IPC: by default, one process cannot read or write another process's user-space memory. To exchange data, processes must leverage IPC mechanisms like pipes, message queues, shared memory, or sockets. For a detailed guide on IPC, see: [Detailed Explanation of Inter-Process Communication (IPC): Pipes, Message Queues, Shared Memory, Sockets, and Binder](./ipc.md).

The two primary mechanisms the MMU uses to translate virtual addresses to physical addresses are **Segmentation** and **Paging**.

#### What Are Virtual Address Space and Physical Address Space?

- **Virtual Address Space**: The set of all virtual addresses accessible to a process, representing the total addressable range of virtual memory. Each process has its own private, uniform virtual address space.
- **Physical Address Space**: The set of all actual physical addresses representing installed physical RAM.

#### How Are Virtual Addresses Mapped to Physical Memory Addresses?

The MMU employs three main mapping mechanisms:

1. Segmentation
2. Paging
3. Segmented Paging

Modern general-purpose operating systems overwhelmingly use paging, making it the primary focus for technical interviews!

### Segmentation Mechanism

**Segmentation** partitions the address space according to a program's logical structure, such as code segments, data segments, heaps, and stacks. Each segment can vary in length, carries distinct semantic meaning, and supports segment-level permission controls.

#### What Is the Segment Table? What Is the Address Translation Process?

Segmentation maps virtual addresses to physical addresses via a **Segment Table**. Each segment table entry records the segment base address, segment limit (length), and access permissions.

Under segmentation, a virtual address consists of two parts:

- **Segment Number**: Identifies which segment within the virtual address space the address belongs to.
- **Segment Offset**: The relative displacement from the start of that segment.

The address translation flow proceeds as follows:

1. The MMU extracts the segment number from the virtual address;
2. It uses the segment number to index into the process's segment table, retrieving the corresponding segment descriptor;
3. It checks whether the segment offset exceeds the segment limit, and verifies access permissions;
4. If valid, the MMU adds the segment base address to the segment offset to yield the physical address.

![Segmentation Address Translation Diagram: Virtual address consists of segment number and offset, segment table retrieves base address to compute physical address](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-segmentation-d95fae8f.png)

For example, to access segment 3 at offset 500: if segment 3 has a base address of 7000 and the offset is within limits, the physical address is 7000 + 500 = 7500.

If a segment selector is invalid, an offset exceeds the limit, or permissions are violated, the CPU raises an architectural exception. Whether pages reside in physical memory is a paging and page fault concern, not part of pure segmentation.

#### Why Does Segmentation Lead to External Memory Fragmentation?

Segmentation produces external fragmentation because **segments have variable lengths and each segment requires a contiguous block of physical RAM**. As processes continually allocate and deallocate segments of varying sizes, physical RAM develops scattered holes. Although the sum of free memory across holes may be ample, no individual contiguous hole is large enough to satisfy a new segment request.

For example, suppose a system with 5 GB of RAM uses pure segmentation across 4 processes:

- Process 1: 0–1 GB (Segment 1)
- Process 2: 1–3 GB (Segment 2)
- Process 3: 3–4.5 GB (Segment 3)
- Process 4: 4.5–5 GB (Segment 4)

If Process 1 and Process 4 terminate, Segments 1 and 4 are freed, leaving 1.5 GB of free RAM. Because this 1.5 GB is split into two non-contiguous chunks (1 GB and 0.5 GB), the system cannot accommodate a new process requiring a contiguous 1.5 GB segment.

![Segmentation Causing External Memory Fragmentation](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/segment-external-memory-fragmentation-c8b8e745.png)

External fragmentation can be mitigated through memory compaction (moving active segments together to consolidate free space). However, copying large memory segments is computationally expensive, especially when accompanied by disk swapping.

### Paging Mechanism

**Paging** slices both the virtual address space and physical RAM into fixed-size blocks. Blocks in virtual address space are called virtual pages; blocks in physical RAM are called physical pages or page frames. In Linux, standard page size is typically 4 KB.

**Note: Pages are contiguous and uniformly sized, unlike variable-length segments.**

Under paging, any virtual page can map to any arbitrary physical page frame, allowing physical memory to be allocated non-contiguously. Managing memory in fixed-size units virtually eliminates external fragmentation. However, because a process's final page is rarely filled completely, a minor amount of internal fragmentation occurs.

Paging also provides demand paging: a program does not need all pages loaded into RAM at startup; pages are loaded dynamically only when referenced.

#### What Is the Page Table? What Is the Address Translation Process?

Paging maps virtual addresses to physical addresses using a **Page Table**. Each page table entry (PTE) maps a virtual page number (VPN) to a physical frame number (PFN), alongside status flags like referenced bit, dirty bit, permission bits, and present bit.

![Single-Level Page Table](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/page-table-2cb227df.png)

Under paging, every process has its own page table. Because page tables are process-private, the same virtual page number in different processes maps to different physical frames, achieving address space isolation.

A virtual address under paging consists of two components:

- **Page Number**: Used to index the page table and retrieve the corresponding physical frame number.
- **Page Offset**: The displacement within the page (Physical Frame Base + Page Offset = Physical Memory Address).

The address translation steps:

1. The MMU extracts the virtual page number from the virtual address;
2. It uses the page number to locate the corresponding entry in the process's page table;
3. It combines the physical frame base address with the page offset to construct the physical address.

![Paging Address Translation Diagram: Virtual address splits into page number and offset, page table maps virtual page to physical frame](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-paging-5dd75b37.png)

If the PTE does not exist, the page is not resident in physical RAM, or permissions do not match, the CPU generates a Page Fault. The kernel then decides whether the fault can be resolved (e.g., loading from disk or zeroing a page) or if it is illegal, in which case it delivers `SIGSEGV` to the current thread.

**Can a virtual page number always find a corresponding physical frame number? Once a physical address is computed, is the physical page guaranteed to exist?**

Not necessarily. The PTE may be marked invalid (page not resident), or the access type may violate permissions. All these scenarios trigger a Page Fault.

#### What Is the Issue with Single-Level Page Tables? Why Are Multi-Level Page Tables Needed?

Consider a 32-bit architecture with a 4 GB (2^32) virtual address space. With 4 KB (2^12) pages, the address space comprises 4 GB / 4 KB = 2^20 pages. If each PTE consumes 4 bytes, a single-level page table requires 4 MB of contiguous memory per process. Even if a process uses only a tiny fraction of its address space, the single-level table must reserve entries for the entire 4 GB range.

When hundreds of processes run concurrently, page table overhead becomes prohibitive. Worse, most processes use only small, fragmented portions of their virtual space, leaving the vast majority of entries unused.

To solve this, operating systems use **Multi-Level Page Tables**. The core concept: top-level tables cover the entire address space, but lower-level tables are allocated on demand. If a virtual address range is never referenced, its lower-level page tables are never instantiated.

Take a two-level page table as an example: the Level-1 page table has 1,024 entries, each pointing to a Level-2 page table with 1,024 entries. Only when a virtual address range covered by a Level-1 entry is actively used is the corresponding Level-2 table created.

If a process only uses 2 Level-2 tables, total page table overhead is: 4 KB (Level-1) + 4 KB * 2 (Level-2) = 12 KB, compared to 4 MB for a single-level table.

![Multi-Level Page Table Diagram: PGD, PUD, PMD, PTE hierarchy allocating lower tables only for used address ranges](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-multi-level-page-table-26a60ff3.png)

Multi-level page tables trade traversal steps for reduced memory overhead. Modern architectures employ the TLB to cache page table entries, ensuring the multi-level traversal penalty is paid only on TLB misses.

#### What Is the Purpose of the TLB? What Is the Address Translation Flow with TLB?

To accelerate virtual-to-physical address translation, the CPU/MMU incorporates a hardware cache called the **TLB (Translation Lookaside Buffer)**.

![Address Translation with TLB](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/physical-virtual-address-translation-mmu-c9371c91.png)

On modern architectures like AArch64 and x86-64, the TLB is a dedicated hardware cache within the MMU. It functions conceptually as a high-speed associative cache mapping virtual page numbers to physical frame numbers. The OS maintains the page tables in memory; whenever page mappings change, the OS issues architecture-specific instructions to invalidate stale TLB entries.

The translation flow with a TLB:

1. The CPU looks up the virtual page number and address space tag in the TLB;
2. If matched, the physical frame is retrieved immediately without accessing memory-resident page tables—a **TLB Hit**.
3. If not found, a **TLB Miss** occurs; the MMU traverses multi-level page tables in main memory, translates the address, and inserts the mapping into the TLB.
4. When the TLB fills up, replacement policies evict an older entry to make room for the new one.

![TLB Translation Flow: CPU checks TLB first; hits access memory directly; misses traverse page tables and populate TLB](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-tlb-cache-b470e575.png)

Because page tables reside in main memory, without a TLB, every memory reference requires multiple memory accesses just to traverse page tables before accessing actual data. The TLB bypasses page table walks on hits, drastically speeding up execution.

The TLB achieves very high hit rates due to the **principle of locality**: programs repeatedly reference a concentrated set of memory pages over short intervals.

This hardware cache behaves conceptually just like application-layer caches (e.g., Redis). Operating system design patterns continually reappear across software layers.

#### What Is the Purpose of Paging / Swapping?

When physical memory is exhausted, the operating system can select inactive physical pages and write them to secondary storage (Swap). When a process references those pages again, the OS swaps them back into RAM. In this way, swapping logically expands the available memory beyond physical RAM limits.

This explains why a system can run processes whose combined memory requirements exceed physical RAM, albeit at the expense of performance.

This is a classic time-for-space trade-off. However, when physical memory is severely overcommitted, frequent disk swapping causes **Thrashing**, where the CPU spends the vast majority of its time servicing page faults and disk I/O rather than executing application code.

#### What Is a Page Fault?

A Page Fault is a **synchronous exception** raised by the CPU when an address translation or page-level permission check cannot be satisfied by hardware. It is triggered directly by the executing instruction, is not an external hardware interrupt, and does not necessarily indicate a bug.

The kernel handles the fault by evaluating whether the faulting address lies within a legitimate Virtual Memory Area (VMA) and whether access permissions match:

- **Recoverable Page Fault**: Examples include first-time access to an anonymous page requiring physical frame allocation, unmapped file-backed pages, pages swapped out to disk, or writes to Copy-On-Write (COW) pages. The kernel allocates a frame, reads data from storage, or duplicates the page, updates the page table, and prompts the CPU to re-execute the faulting instruction.
- **Unrecoverable Page Fault**: Examples include referencing unmapped address spaces, writing to read-only mappings, or executing non-executable pages. In Linux, the kernel delivers `SIGSEGV` to the offending thread, terminating the process by default.

From a performance standpoint, page faults are classified into:

- **Major Page Fault**: Servicing the fault requires reading data from disk or Swap, incurring real disk I/O overhead.
- **Minor Page Fault**: Servicing the fault requires no disk I/O (e.g., establishing a mapping to an existing page in Page Cache, mapping a zero-filled page, or handling a local COW copy).

Out-of-bounds pointer operations in C/C++ do not guarantee an immediate `SIGSEGV`. If the invalid address happens to fall inside an already-mapped, permission-compatible page within the process's address space, the hardware executes the write silently, corrupting adjacent program memory without raising a fault.

![Page Fault Handling Flow: MMU encounters incomplete translation or permission violation, traps to kernel, validates VMA, allocates/swaps page, updates page table, and retries instruction](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-page-fault-08944e3c.png)

For details on the interplay between page faults, system calls, and signals, see: [Detailed Explanation of Interrupts, Exceptions, and System Calls: From Kernel Entry to Page Faults](./interrupt-exception-syscall.md).

#### What Are Common Page Replacement Algorithms?

When a major page fault occurs and no free physical page frames exist, the operating system must evict an existing page from memory to accommodate the incoming page.

The heuristic used to decide which page to evict is called a **Page Replacement Algorithm**.

Because excessive page faults degrade performance, effective page replacement algorithms aim to minimize the fault rate.

The five classic algorithms include:

![Page Replacement Algorithms Comparison](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-page-replacement-f68a779f.webp)

1. **Optimal (OPT)**: Evicts the page that will not be accessed for the longest time in the future. It achieves the lowest possible theoretical fault rate. However, because it requires future knowledge, it is impossible to implement in practice and serves only as a benchmark.
2. **First-In, First-Out (FIFO)**: Evicts the page that has been in memory the longest. While simple, it frequently evicts heavily used pages and can suffer from Belady's Anomaly.
3. **Least Recently Used (LRU)**: Evicts the page that has not been accessed for the longest period. Capitalizing on temporal locality, its performance approaches OPT, but precise tracking requires linked lists or timestamps, imposing high runtime overhead.
4. **Least Frequently Used (LFU)**: Evicts the page with the fewest accesses over a time window. It focuses on access frequency, but old hot pages that become inactive may linger indefinitely unless paired with frequency decay.
5. **Clock (Second-Chance)**: A low-cost approximation of LRU. Pages are arranged in a circular buffer, each associated with an access bit (R bit). When inspecting a page, if R=1, the algorithm clears R to 0 and advances; if R=0, the page is evicted.

![CLOCK Algorithm Diagram: Circular queue where pointer checks access bit R to grant a second chance or evict page](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-clock-algorithm-80ebda22.png)

**Why does the FIFO algorithm perform poorly?**

Two primary reasons:

1. **Frequently referenced pages are evicted repeatedly**: Early-loaded pages are often hot, foundational pages; FIFO blindly evicts them, causing repeated reloads.
2. **Belady's Anomaly**: Allocating more physical frames can counter-intuitively increase the page fault rate. This occurs because FIFO relies strictly on entry sequence rather than access frequency or recency.

**Which page replacement algorithm is actually used in production?**

LRU approximations are widely used because they align well with the principle of locality. However, production systems rarely implement textbook algorithms directly: Linux uses active/inactive LRU lists, workingset refault detection, and multigen LRU (MGLRU); MySQL's InnoDB Buffer Pool splits its LRU list into young and old sublists to prevent read-ahead and full-table scans from evicting hot pages.

![Linux Page Reclamation Strategy](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-page-reclaim-208f962f.webp)

### What Are Swap, Working Set, and Thrashing?

**Swap** is auxiliary storage space on disk. Anonymous pages have no backing file; when RAM is constrained, the kernel can evict anonymous pages by writing them to Swap, reading them back only when referenced again.

Swap is not free RAM expansion. Disks are orders of magnitude slower than RAM; when Swap activity spikes, application latency degrades sharply.

A **Working Set** is the set of pages actively referenced by a process during a given time window. As long as physical RAM accommodates the working sets of active processes, page fault rates remain low; if working sets exceed physical RAM, pages are swapped out and in continuously.

This pathological state is called **Thrashing**. During thrashing, the CPU spends virtually all its cycles handling page faults, page reclamation, and disk I/O rather than executing application code.

Helpful diagnostic commands:

```bash
free -h
vmstat 1
grep -E 'pgfault|pgmajfault|pswpin|pswpout|pgscan|pgsteal' /proc/vmstat
cat /proc/pressure/memory
```

### What Is the Relationship Between Overcommit and OOM?

Linux allows processes to allocate more virtual memory than the combined capacity of physical RAM and Swap—a policy known as **Overcommit**. This accommodates software that reserves vast virtual address ranges without utilizing all of them.

Consequently, a successful `malloc()` or `mmap()` call only confirms virtual address space reservation, not physical RAM backing. Physical pages are mapped on demand upon first write.

When actual memory access outstrips physical RAM and the kernel cannot free sufficient pages via reclamation, writeback, or swapping, the **OOM Killer (Out-of-Memory Killer)** is triggered, terminating selected processes to reclaim memory.

In containerized environments, cgroup memory limits apply. Even if host RAM remains available, exceeding a container's `memory.max` triggers a cgroup-level OOM kill.

### What Is the Relationship Between mmap, COW, and Shared Memory?

`mmap()` creates a new memory mapping in a process's virtual address space, supporting both file-backed and anonymous mappings. Pages are mapped lazily: memory is allocated and populated only when page faults occur upon actual access.

When multiple processes map the same file, the kernel shares the underlying physical pages in the Page Cache. Shared memory IPC operates similarly: different processes map their virtual addresses to identical physical frames, allowing data exchange without intermediate kernel-space copying.

**COW (Copy-On-Write)** is prominently used in `fork()`. When a child process is spawned, parent and child initially share identical physical pages marked read-only in their page tables. When either process attempts to write to a shared page, a page fault is raised, prompting the kernel to allocate a private copy of the page for the writing process.

Detailed guide: [Detailed Explanation of Operating System Memory Management: Paging, Segmentation, Page Replacement, Swap, and OOM](./memory-management.md).

### What Are the Similarities and Differences Between Paging and Segmentation?

**Similarities**:

- Both are non-contiguous memory management schemes.
- Both use address translation structures to map virtual addresses to physical addresses, providing memory protection and process isolation.

**Differences**:

- **Partitioning Principle**: Paging divides memory into fixed-size units representing physical granularity; segmentation partitions memory along logical program boundaries (code, data, heap, stack), reflecting application semantics.
- **Block Size**: Page size is fixed (typically 4 KB); segment size is variable, determined by the size of the logical code or data module.
- **Fragmentation**: Segmentation creates external fragmentation due to variable contiguous allocations; paging eliminates external fragmentation, leaving only minor internal fragmentation on final pages.
- **Address Structure**: Paging addresses consist of Page Number and Page Offset translated via page tables; segmentation addresses consist of Segment Number and Segment Offset translated via segment tables.
- **Modern Adoption**: Modern general-purpose operating systems rely primarily on paging. On x86 architectures, hardware historically supported both, but Linux sets segment base addresses to 0, relegating segmentation to a basic privilege and compatibility layer while relying on paging for actual memory management.

### Segmented Paging Mechanism

A hybrid memory management scheme combining segmentation with paging. From the application perspective, memory is organized into logical segments; each segment is subsequently subdivided into fixed-size pages.

Address translation involves two stages:

1. **Segment Translation (Virtual Address -> Linear Address)**:
   - Virtual Address = Segment Selector (Segment Number) + Segment Offset.
   - Look up the segment table to obtain the segment base address; add the offset to produce the linear address.
2. **Page Translation (Linear Address -> Physical Address)**:
   - Linear Address = Page Number + Page Offset.
   - Look up the page table to obtain the physical frame number; add the page offset to produce the final physical address.

### Locality Principle

Understanding virtual memory requires familiarity with the **Principle of Locality**, a fundamental concept applicable to both program execution patterns and data structure design.

The principle of locality states that during program execution, instructions and data references exhibit strong temporal and spatial clustering:

- **Temporal Locality**: Recently referenced instructions or data items are highly likely to be referenced again in the near future (e.g., loops and repeated function calls).
- **Spatial Locality**: Accessing a particular memory location makes nearby memory locations likely to be accessed soon (e.g., sequential array traversal).

In paging systems, the locality principle is exploited in two ways:

- **Leveraging Temporal Locality**: Caching recently translated page table entries in the TLB and caching recently accessed pages in RAM/Page Cache ensures subsequent references hit fast caches rather than slow storage.
- **Leveraging Spatial Locality**: Operating systems utilize read-ahead (prefetching) algorithms to load adjacent pages into memory ahead of time, ensuring future references find data already resident.

In summary, the principle of locality is a foundational design tenet across computer architecture and software engineering.

### How Does Virtual Memory Achieve Address Translation and Process Isolation?

In an interview, avoid merely stating that virtual memory "isolates processes." Structure your answer as follows: **Virtual memory decouples the address space seen by a process from physical RAM, with address translation coordinated by the MMU, page tables, and the TLB**.

Processes manipulate virtual addresses (VA), whereas physical RAM operates on physical addresses (PA). Each process maintains its own private virtual address space and page tables. Consequently, even when two processes reference identical virtual addresses, their page tables map them to distinct physical pages, enforcing process isolation.

![Virtual Address to Physical Address Mapping Process: Identical virtual addresses in different processes map to distinct physical pages via MMU and page tables](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-virtual-physical-mapping-27d34efc.png)

Isolation does not preclude controlled sharing. The OS can deliberately map shared physical pages into multiple processes' address spaces (e.g., shared dynamic libraries, `mmap` file mappings, shared memory IPC). The distinction is that default isolation is enforced by page table permissions, whereas sharing must be explicitly constructed by the kernel; shared-memory IPC further requires application-level concurrency synchronization.

Paging divides both virtual and physical spaces into fixed-size pages, using page tables to track "VPN -> PFN" mappings. This eliminates external fragmentation and allows physical pages to be allocated non-contiguously. To prevent page tables from consuming excessive memory, multi-level page tables create lower-level tables strictly on demand.

The TLB acts as a page table entry cache. The CPU consults the TLB first; hits yield physical frame numbers instantly, while misses trigger page table traversals that backfill the TLB. When a page table entry indicates a page is not resident, a Page Fault exception traps into the kernel. The kernel validates the access, allocates a physical frame, swaps data in from disk or Swap if needed, updates page tables, and re-executes the faulting instruction.

For page replacement, the rule of thumb is: **evict the page that will not be accessed until furthest in the future**. OPT is the theoretical ceiling, LRU approaches OPT with higher overhead, CLOCK approximates LRU using access bits, and FIFO is simple but susceptible to Belady's Anomaly.

Detailed guide: [Detailed Explanation of Virtual Memory: Address Translation, TLB, Page Faults, and Page Replacement](./virtual-memory.md).

## I/O

### What Happens During a Blocking read()?

Taking `read(fd, buf, count)` as an example, user space invokes the glibc wrapper function. The wrapper sets up the system call number and parameters according to the ABI, and issues a `syscall` instruction to enter the kernel. The kernel validates the file descriptor, user buffer pointer, and permissions, routing the request to the VFS, file system, socket, or device driver.

If data is already available in the Page Cache or socket buffer, the kernel copies it into user buffer memory and returns the byte count immediately. If data is not ready, a blocking fd places the calling thread into a sleeping/waiting state, freeing the CPU scheduler to run other tasks. When disk I/O completes or network packets arrive, the hardware triggers an interrupt, prompting the kernel to wake the waiting thread. Once rescheduled, the thread completes `read()` and returns to user space.

This path may involve system calls, hardware interrupts, and thread context switches—or only a subset of them. For instance, if requested data is already present in Page Cache, `read()` returns immediately without waiting for hardware interrupts or triggering a thread context switch.

Detailed guide: [Detailed Explanation of Interrupts, Exceptions, and System Calls: From Kernel Entry to Page Faults](./interrupt-exception-syscall.md).

### What Is I/O Multiplexing?

I/O multiplexing is not designed to make individual read/write operations faster; rather, it allows **a single thread to monitor multiple file descriptors (fds) for readiness events simultaneously**.

A network read typically unfolds across two phases: waiting for data to arrive over the network into the kernel buffer, and copying data from the kernel buffer into the user-space buffer. The limitation of blocking I/O lies in Phase 1: if a thread calls `recv()` on an idle connection, it remains blocked, unable to service other connections.

![Two Phases of Network Read: Waiting for network data to enter kernel buffer, then copying to user buffer via copy_to_user](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-io-two-phases-4cdb6dd8.png)

I/O multiplexing passes a collection of fds to the kernel, allowing a thread to block on a single system call like `select`, `poll`, or `epoll`. As soon as any monitored fd becomes ready, the call unblocks, allowing the application to process that specific connection. A single thread can thus manage tens of thousands of connections, making it ideal for architectures characterized by high concurrency with sparse activity per connection (e.g., Redis, Nginx, Netty).

Note: I/O multiplexing is still **Synchronous I/O**. The kernel merely signals that an fd is ready to be read or written; the application must still invoke `read()`/`recv()` explicitly, and copying data from the kernel buffer to the user buffer is not eliminated.

Detailed guide: [Detailed Explanation of I/O Multiplexing: Principles and Differences of select, poll, and epoll](./io-multiplexing.md).

### What Are the Differences Between select, poll, and epoll?

Summary: **`select` and `poll` require passing the entire monitored fd set into the kernel on every call and perform linear scans upon return; `epoll` maintains the interest set inside the kernel, and `epoll_wait` returns only ready events, making it vastly superior for high-connection, low-activity workloads**.

`select` uses a fixed-size `fd_set` bitmap, capped in Linux glibc by `FD_SETSIZE` (typically 1024), meaning it can only safely monitor fds numbered 0–1023. The entire bitmap must be reset before each call, and upon return, the application must iterate through the entire set to locate active fds.

`poll` replaces the bitmap with an array of `pollfd` structures, removing the `FD_SETSIZE` limitation. However, it still passes the entire array to the kernel on every call and iterates across the entire array upon return to inspect `revents`. When connection counts are large and active connections few, scanning overhead remains substantial.

`epoll` registers and maintains monitored fds in the kernel via `epoll_ctl`, retrieving ready events via `epoll_wait`. Internally, the kernel maintains an interest list (red-black tree) and a ready list (linked list). When an fd becomes ready, its callback places it onto the ready list, and `epoll_wait` simply drains this ready list. It supports Level-Triggered (LT) and Edge-Triggered (ET) modes: LT repeatedly notifies as long as unread data remains in buffers; ET notifies only on state transitions, requiring non-blocking fds read in a loop until `EAGAIN`.

![Comparison of select, poll, and epoll: Data structures, fd limits, argument passing, lookup overhead, and trigger modes](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-select-poll-epoll-6d5bee4f.png)

However, epoll is not universally faster in every scenario. If connection counts are small, or if virtually all monitored connections are simultaneously active, the management overhead of `epoll_ctl`, internal callbacks, and ready lists may outweigh benefits. Epoll shines brightest in high-volume, long-connection server architectures with predominantly idle connections.

Detailed guide: [Detailed Explanation of I/O Multiplexing: Principles and Differences of select, poll, and epoll](./io-multiplexing.md).

### What Is Zero-Copy?

Zero-copy does not imply the absolute absence of data copies; rather, it means **avoiding redundant CPU copies between kernel-space buffers and user-space buffers**, thereby minimizing CPU copying overhead and user/kernel mode transitions.

In a traditional file transfer using `read + write`, data undergoes 4 copies: disk to kernel buffer (DMA), kernel buffer to user buffer (CPU), user buffer to socket buffer (CPU), and socket buffer to network card (DMA). The two intermediate CPU copies are wasteful because the application never modifies the payload—it merely routes data through user memory.

![Traditional read/write Data Copy Path: Disk to kernel buffer, kernel to user buffer, user to socket buffer, socket to network card](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-traditional-read-write-d7c9db35.png)

Zero-copy techniques allow data to remain entirely within kernel space during forwarding. For instance, `sendfile` transmits file data directly from the Page Cache to the socket; if the network interface card supports Scatter-Gather DMA (SG-DMA), the socket buffer only holds descriptor metadata, while packet payload is copied directly from Page Cache to the network card via DMA.

Zero-copy is ideally suited for static file serving, bulk file transfers, and message queue log transmission. For example, Kafka consumers streaming log segments rely on `FileChannel.transferTo`, which utilizes `sendfile`.

Detailed guide: [Detailed Explanation of Zero-Copy: mmap, sendfile, and splice](./zero-copy.md).

### What Are the Differences Between mmap, sendfile, and splice?

Summary: **Use `mmap` if you need to inspect or modify the payload; use `sendfile` for straight file-to-socket transfers; consider `splice` for general descriptor-to-descriptor forwarding**.

`mmap + write` maps a file directly into a process's virtual address space. When accessing this memory, the application interacts directly with physical pages in the Page Cache, eliminating the CPU copy from kernel buffer to user buffer. However, the subsequent `write` to the socket buffer still incurs one CPU copy. It is ideal when data must be parsed, cached, or altered before transmission.

`sendfile` is purpose-built for "file -> socket" streaming. Data never crosses into user space, and system call overhead is reduced. When paired with an SG-DMA network interface, CPU payload copies drop to zero. Static web servers and Kafka log segment transmission are classic use cases.

`splice` moves page references between arbitrary file descriptors using pipes within kernel space (e.g., socket to socket, or file to pipe to socket). Its constraint is that one end of the transfer must typically be a pipe, and file-to-socket transfers often require two `splice` invocations, increasing code complexity.

![Comparison of Copies and Mode Switches across Traditional read/write, mmap + write, sendfile + SG-DMA, and splice](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-four-ways-comparison-520d4d0b.png)

Zero-copy is not applicable everywhere: operations like TLS encryption, data compression, format transformation, content filtering, or digital watermarking require the application to process payload bytes directly, making it impossible for data to stay exclusively within kernel space. For small files or random accesses, the fixed setup costs of memory mappings, page faults, and pipes can outweigh the performance gains.

Detailed guide: [Detailed Explanation of Zero-Copy: mmap, sendfile, and splice](./zero-copy.md).

## File Systems

### What Does a File System Primarily Do?

A file system organizes raw storage blocks into files and directories that applications can navigate and manipulate. When answering in an interview, summarize these six core responsibilities:

![File System Responsibilities Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-system-responsibilities-e613f01c.webp)

1. **Naming**: Locating target files via human-readable paths and filenames (e.g., `/var/log/app.log`).
2. **Organization**: Structuring files and folders into hierarchical directory trees.
3. **Locating**: Mapping the N-th byte of a file to underlying storage blocks on disk.
4. **Space Management**: Allocating, releasing, and tracking free versus allocated disk blocks.
5. **Access Protection**: Storing owner credentials, permissions, and timestamps, enforcing security checks upon access.
6. **Caching and Recovery**: Leveraging the Page Cache to boost read/write performance, and using journaling to prevent structural corruption following system crashes.

Not all file systems map to physical disks: `tmpfs` stores data in RAM, `procfs` exposes live kernel diagnostics, and NFS mounts remote file systems into the local directory tree. Linux provides a unified interface across all file systems through the **VFS (Virtual File System)**.

### What Is the Relationship Between File, Directory, inode, and dentry?

In Linux/Unix file systems, filenames are not stored inside the inode.

![Relationship Between Filename, dentry, and inode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-inode-dentry-relation-9ed196c7.webp)

- **Directory Entry**: Stores the mapping from filename to inode number.
- **inode (Index Node)**: Stores metadata including file type, permissions, owner, file size, timestamps, link count, and block/extent location pointers.
- **dentry (Directory Entry Cache)**: An in-memory cache maintained by VFS to accelerate pathname resolution. A dentry points to its corresponding inode, and can also cache lookups for non-existent files ("negative dentry").
- **Data Blocks / Extents**: Store the actual payload content of regular files.

This separation explains why a single file can possess multiple names: multiple directory entries can point to the same inode. When executing `mv a.txt b.txt` within the same file system, only directory entries are updated—file payload data is never moved.

Useful commands for inspecting inodes and metadata:

```bash
ls -li app.log
stat app.log
df -i
```

### What Happens When Opening a File?

`open()` does not read file contents into memory; it performs path resolution and initializes kernel file structures.

![Path to File Descriptor Resolution](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-path-to-fd-2e2e40b2.webp)

The general workflow:

1. Starting from the root directory or current working directory, the kernel resolves the path component by component, consulting directory entries and dentry caches.
2. Upon locating the target inode, it verifies access permissions, open flags, and file types.
3. It creates an open file description object in kernel space, recording file offset, open status, and read/write flags.
4. It allocates the lowest available non-negative integer in the process's file descriptor table—the file descriptor (fd).

An fd is merely an index into the process's file descriptor table, not an inode. After `dup()` or `fork()`, multiple fds can reference the same underlying open file description, sharing the file offset. Conversely, two separate processes independently calling `open()` on the same file receive distinct file descriptions, maintaining independent offsets.

### How Are Files Stored on Disk?

A file system divides a partition into blocks, tracking file contents via metadata structures. Textbooks commonly identify three block allocation strategies:

![File Data Block Allocation Methods](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-block-allocation-19a7c361.webp)

- **Contiguous Allocation**: Files occupy a contiguous sequence of disk blocks, providing high sequential and random access speed; disadvantages include difficult file growth and external fragmentation.
- **Linked Allocation**: Each block stores a pointer to the next block, eliminating contiguous requirements; disadvantage is poor random access performance.
- **Indexed Allocation**: Block addresses are gathered inside dedicated index blocks, facilitating fast random access; disadvantage is the storage overhead of index blocks.

Classic ext2/ext3 systems use direct pointers, single indirect, double indirect, and triple indirect blocks to locate file data. ext4 typically uses extent trees: an extent records the logical start, physical start, and length of a contiguous block sequence. For large continuous files, extents dramatically reduce metadata overhead compared to tracking individual block addresses.

### What Is the Difference Between Hard Links and Symbolic Links?

Both hard links and symbolic (soft) links associate a path with a target file, but they point to different entities.

![Comparison of Hard Links and Symbolic Links](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-hardlink-symlink-0dd2c4bf.webp)

| Comparison Item | Hard Link | Symbolic Link (Soft Link) |
| --- | --- | --- |
| Target Object | Points to an inode directly | Points to another pathname string |
| Creates New inode | No new inode; creates a new directory entry and increments link count | Yes; a symlink is an independent file with its own inode |
| Deleting Original File | Data persists as long as at least one hard link remains | Symlink becomes broken (dangling link) |
| Cross-Filesystem Support | No | Yes |
| Linking Directories | Disallowed for unprivileged users in Linux | Allowed |

Demonstration commands:

```bash
echo hello > a.txt
ln a.txt hard.txt
ln -s a.txt soft.txt

ls -li a.txt hard.txt soft.txt
```

`a.txt` and `hard.txt` share the same inode number, whereas `soft.txt` has a distinct inode. If `a.txt` is deleted, `hard.txt` still reads the data, while `soft.txt` points to a non-existent path.

### Why Can't Hard Links Cross File Systems?

Hard links point to an inode number, and inode numbers are unique only within a specific file system. Every file system maintains its own independent inode table; the same inode number in a different file system refers to an entirely unrelated file.

Symbolic links store a pathname string. During resolution, the kernel traverses paths across mount points, allowing symlinks to span distinct file systems seamlessly.

### Does a Successful write Guarantee That Data Is Flushed to Disk?

Not necessarily. With standard buffered I/O, a successful `write()` only indicates that data was received by the kernel, typically residing in the Page Cache as dirty pages. It does not guarantee persistence to underlying hardware.

![File Write to Persistence Path](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-write-persistence-edfe5461.webp)

Applications requiring guaranteed persistence must invoke:

- `fsync()`: Flushes file data and associated metadata to storage.
- `fdatasync()`: Flushes file data and metadata strictly required for subsequent reads (e.g., file size).
- Open flags with synchronous semantics, such as `O_SYNC` or `O_DSYNC`.

Two subtle engineering details:

1. `write()` may write only a portion of the requested bytes; callers must handle partial writes.
2. After creating, renaming, or deleting a file, ensuring directory entries survive power outages requires calling `fsync()` on the parent directory's fd.

### What Problem Do Journaling File Systems Solve?

A single file system operation often modifies multiple metadata structures. For instance, creating a file requires allocating an inode, allocating data blocks, updating directory entries, and modifying allocation bitmaps. A sudden power loss midway leaves the file system in an inconsistent state.

Journaling file systems write intended metadata modifications to a dedicated journal log area before applying them to permanent locations. Upon crash recovery, the kernel replays fully committed journal transactions and discards incomplete ones.

In ext4, three journaling modes exist:

| Mode | Description |
| --- | --- |
| `data=writeback` | Journals metadata only; does not guarantee data blocks are written before metadata |
| `data=ordered` | Default mode; ensures associated data blocks are flushed to main storage before metadata commits to the journal |
| `data=journal` | Both data and metadata are written to the journal before updating permanent storage, incurring high write amplification |

Journaling guarantees file system structural consistency, not application-level zero data loss. Transactional durability still requires correct application usage of `fsync()`, write ordering, and recovery protocols.

### What Are the Methods to Improve File System Performance?

Consider access patterns, caching, metadata, and hardware:

- **Prefer Sequential I/O**: Sequential I/O leverages read-ahead, write merging, and extent-based block mapping.
- **Utilize Page Cache**: Standard file I/O traverses the Page Cache; cache hits eliminate disk access. However, monitor memory pressure and dirty page writeback throttling.
- **Minimize Small Files and Metadata Churn**: Large volumes of tiny files multiply inode lookups, permission checks, directory entries, and creation/deletion overhead.
- **Tune Flush Frequency**: Overly frequent `fsync()` throttles throughput, while never flushing widens data-loss exposure during crashes; tune according to business durability requirements.
- **Select Optimal File Systems and Mount Options**: File systems (ext4, XFS, Btrfs) differ in architecture; options like `noatime`, journaling mode, and write barriers significantly impact throughput.
- **Upgrade Hardware**: SSDs, NVMe drives, hardware RAID, and battery-backed write caches drastically reduce latency and elevate throughput.

Diagnostic commands:

```bash
df -h
df -i
lsof +L1
iostat -x 1
```

If `df` reports full disk usage while `du` cannot locate large files, check for deleted files still held open by running processes (`lsof +L1`); when handling millions of small files, `df -i` may uncover inode exhaustion long before storage space runs out.

Detailed guide: [Detailed Explanation of Operating System File Systems: inode, VFS, Page Cache, and Journaling Mechanisms](./file-system.md).

### What Are Common Disk Scheduling Algorithms?

Algorithms like SCAN, SSTF, and LOOK were formulated for mechanical hard disk drives (HDDs). An HDD read/write involves seek time, rotational delay, and transfer time; disk schedulers reorder pending requests to minimize head movement and latency.

The six classic disk scheduling algorithms include:

![Common Disk Scheduling Algorithms](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/disk-scheduling-algorithms-d978c14f.png)

1. **First-Come, First-Served (FCFS)**: Services requests in arrival order. Simple to implement, but ignores head positioning, resulting in prolonged average seek times. While it avoids starvation, requests queued behind long seeks experience high latency.
2. **Shortest Seek Time First (SSTF)**: Also termed Shortest Service Time First, it services the request closest to the current head position. While it minimizes seek distance, it is prone to starvation: continuous requests near the head can indefinitely postpone distant requests.
3. **SCAN (Elevator Algorithm)**: The head moves continuously in one direction across the disk, servicing requests along its path until it reaches the disk boundary, where it reverses direction. SCAN guarantees service for all requests, eliminating starvation, but requests arriving just behind the head must wait for a full round-trip sweep.
4. **Circular SCAN (C-SCAN)**: A variant of SCAN that scans in only one direction. Upon reaching the boundary, the head returns directly to the beginning without servicing requests on the return journey, providing more uniform wait times.
5. **LOOK**: In SCAN, the head travels all the way to the physical disk boundary regardless of pending requests. LOOK inspects ahead and reverses direction as soon as no further requests exist in the current direction.
6. **C-LOOK**: Modifies C-SCAN similarly: the head travels only as far as the final request in the scan direction, and returns only as far as the lowest pending request, eliminating unnecessary edge sweeps.

Example: If the head is at track 50 and requests arrive for 82, 170, 43, 140, 24: FCFS visits them in arrival order, causing excessive seek sweeps; SSTF visits 43 first, minimizing immediate seek distance but risking starvation for distant tracks; SCAN/LOOK maintains a unidirectional sweep before reversing, providing consistent fairness.

Solid-state drives (SSDs) and NVMe devices have no physical heads or rotational mechanics, rendering mechanical head models obsolete. However, modern Linux block layers still merge and reorder requests via blk-mq and block I/O schedulers to optimize throughput, fairness, and QoS latencies based on hardware capabilities.

## References

- *Computer Operating Systems* (Tang Xiaodan, 4th Edition)
- *Computer Systems: A Programmer's Perspective* (CS:APP)
- *Relearning Operating Systems*
- *Principles and Implementation of Modern Operating Systems*
- Wangdao Post-Graduate Exam OS Study Notes: <https://wizardforcel.gitbooks.io/wangdaokaoyan-os/content/13.html>
- Memory Management: Buddy System and SLAB: <https://blog.csdn.net/qq_44272681/article/details/124199068>
- Why Linux Needs Virtual Memory: <https://draveness.me/whys-the-design-os-virtual-memory/>
- Self-Cultivation of a Programmer (7): Page Fault Errors: <https://liam.page/2017/09/01/page-fault/>
- Things You Should Know About Virtual Memory: <https://juejin.cn/post/6844903507594575886>
