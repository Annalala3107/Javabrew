---
title: "Deep Dive into Zero-Copy: mmap, sendfile, and splice"
description: "A comprehensive summary of high-frequency zero-copy interview questions, detailing the data copy paths, context switches, SG-DMA mechanisms, and trade-offs of traditional read/write, mmap, sendfile, and splice, alongside real-world applications in Java NIO, Kafka, and RocketMQ."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Linux
  - High Performance
head:
  - - meta
    - name: keywords
      content: Zero-Copy,mmap,sendfile,splice,SG-DMA,Page Cache,Java NIO,FileChannel,transferTo,Kafka,RocketMQ,OS Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/zero-copy.md
---

Technical interviews frequently follow a classic line of questioning: the interviewer begins by asking *"Why is Kafka so fast?"* or *"Why can RocketMQ withstand massive message backlogs?"* Once you cite sequential disk I/O, the Page Cache, and zero-copy, the interviewer immediately digs deeper: *"Exactly which copy operations does zero-copy eliminate?"*, *"What is the difference between mmap and sendfile?"*, and *"Where does splice fit into the picture?"*

At this stage, many candidates begin speaking in vague generalities. Plenty can parrot the slogan that *"zero-copy means data doesn't pass through user space,"* but few can clearly account for the ledger of four copies, two DMA transfers, and multiple context switches.

This article begins from the foundational scenario of transmitting a file over the network: **how many times traditional I/O copies data, what the "zero" in zero-copy genuinely eliminates, what mmap, sendfile, and splice individually optimize, and the architectural trade-offs each introduces.**

Before we dive into the details, we must establish our baseline calculation criteria.

Whenever we discuss *"how many copies and how many switches"* throughout this article, we evaluate them against the following standardized baseline model. If the scenario changes, the numbers change accordingly:

- The scenario involves transmitting a regular local file over an established TCP socket, where the data initially does not reside in the Page Cache (requiring an actual disk read).
- No user-space payload transformations—such as TLS encryption, compression, or protocol framing—are involved.
- The underlying hardware supports standard DMA and scatter-gather operations.
- The counted "number of copies" applies strictly to data payloads, excluding small descriptors and kernel metadata.
- Context switching refers specifically to **mode switches between user mode and kernel mode** (each system call incurs one entry and one exit switch); this is distinct from "thread context switching" where the OS scheduler swaps threads on and off a CPU core. Additional thread context switches only occur if a system call blocks and the thread is descheduled.

If data is already warm in the Page Cache, if TLS encryption is activated, or if hardware lacks scatter-gather support, these exact figures will vary. Our baseline assumptions exist to make the core architectural mechanisms clear; do not treat these numbers as static constants across every conceivable environment.

## How Many Times Does Traditional read/write Actually Copy Data?

Consider the most common file transmission scenario: a file download endpoint where the server reads a file from local storage and sends it across an established network socket to a client. The most straightforward implementation uses a simple `read` loop followed by `write`:

```c
while ((n = read(file_fd, buf, BUF_SIZE)) > 0)
    write(socket_fd, buf, n);
```

While this appears as just two simple lines of code, the underlying operating system executes a grueling sequence of steps. To complete a single round of "read from disk + send to network," the CPU and DMA engines transfer the data four separate times, while the CPU transitions between user mode and kernel mode four times.

![Data Copy Paths in Traditional read/write: Disk to kernel buffer, kernel to user buffer, user to socket buffer, and socket to NIC](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-traditional-read-write-d7c9db35.png)

Breaking down these two lines reveals what happens during the `read` phase:

1. The application invokes `read()`, issuing a system call that triggers a **mode switch from user mode to kernel mode** (Switch 1).
2. The DMA controller transfers data from disk into the kernel read buffer / Page Cache (Copy 1, DMA transfer).
3. The CPU copies data from the kernel read buffer into the user-space application buffer (Copy 2, CPU copy). The system call returns, **switching back to user mode** (Switch 2).

The `write` phase mirrors this sequence:

4. The application invokes `write()`, issuing a system call that **switches to kernel mode** (Switch 3).
5. The CPU copies data from the user-space application buffer into the kernel socket send buffer (Copy 3, CPU copy).
6. The DMA engine transfers data from the socket send buffer to the network interface card (NIC) (Copy 4, DMA transfer). The system call completes, **switching back to user mode** (Switch 4).

Summing up the ledger: **4 mode switches and 4 data copies**, consisting of 2 DMA transfers and 2 CPU copies. (Strictly speaking, `write()` typically returns as soon as data is queued in the socket send buffer; packet transmission over the wire by the NIC via DMA occurs asynchronously within the network stack. Illustrating it within a single synchronous flow here serves to keep the accounting complete.)

A quick note on **DMA (Direct Memory Access)**: DMA is a capability provided by device controllers or system DMA engines that transfers data directly between hardware peripherals and main memory with minimal CPU intervention (in modern hardware, it is integrated into device controllers, SoCs, or chipsets rather than existing as a standalone chip). Offloading repetitive physical transfers—such as disk-to-kernel-buffer and socket-buffer-to-NIC—to DMA frees the CPU to compute business logic, meaning DMA copies do not burn CPU cycles.

The true architectural bottleneck lies in the two **CPU copies**. Data is copied from the kernel read buffer into user space, only to be copied right back into the kernel socket buffer. In our file-serving scenario, the application never touched, inspected, or modified a single byte; the payload merely took an unnecessary round trip through user space. The CPU spent cycles acting as a glorified data mover, compounded by the register save/restore overhead of four user/kernel mode switches. In high-concurrency, large-file environments, this redundant overhead severely limits system throughput.

This is precisely what zero-copy is engineered to eliminate.

## What Does the "Zero" in Zero-Copy Actually Mean?

First, let us dispel a common misconception: zero-copy does not mean that zero data copying occurs anywhere in the system.

Under our baseline model (where a file misses the Page Cache and is transmitted via TCP), the payload must still be moved from disk to memory, and from memory to the NIC via two DMA transfers. **Zero-copy eliminates the CPU's involvement in copying payloads between memory buffers, while potentially reducing user/kernel mode transitions.** In alternative architectures—such as Page Cache hits or persistent memory devices—the transfer counts vary further.

More precisely, zero-copy refers to a family of techniques that eliminate CPU-driven data copying between memory buffers during I/O operations, drastically reducing CPU cycles and mode switches. Below, we examine the three primary evolutionary routes designed to eradicate CPU copying.

## Route 1: mmap + write

The first approach leverages virtual memory. Modern operating systems map virtual addresses to physical pages, which grants a key capability: **multiple virtual addresses can point to the exact same physical memory frame**.

`mmap()` takes direct advantage of this. Its function signature is:

```c
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
```

Here, `fd` is the target file descriptor, `length` is the byte length to map, and `offset` is the starting file offset. Once invoked, the kernel read buffer (Page Cache) and a virtual address range in user space are mapped to the same physical memory pages. In other words, the kernel buffer and user buffer "share" the identical physical data, eliminating separate copies.

The traditional `read + write` loop is thus replaced by `mmap + write`. Here we must clarify an essential nuance: **invoking `mmap` merely establishes the virtual address mapping; it does not immediately read file data from disk into memory**. Actual disk I/O occurs on demand: when the application subsequently touches a mapped virtual page that has not yet been committed to physical RAM, a hardware page fault exception is triggered, prompting the kernel to fetch the page from the Page Cache (or disk). The workflow proceeds as follows:

1. The application calls `mmap()`. The kernel sets up the virtual memory mapping, incurring one user-to-kernel-to-user round trip, and returns. No file bytes have been moved into RAM yet.
2. The application accesses the mapped memory region (typically passing the pointer as the data source to `write()`). Touching an uncommitted page triggers a page fault. If the page is not in the Page Cache, DMA streams the data from disk into the Page Cache (Copy 1, DMA transfer).
3. The page table entry is updated, making this Page Cache page simultaneously visible in user space. Both sides share the identical physical memory.
4. The application calls `write()`. The CPU copies data directly from the shared Page Cache into the socket send buffer (Copy 2, CPU copy)—because physical memory is shared, the traditional redundant copy from kernel to user space is bypassed entirely.
5. DMA transfers data from the socket send buffer to the NIC (Copy 3, DMA transfer), and `write()` returns.

![Data Copy Paths in mmap + write: Page Cache shares physical memory with the mmap region, then copies to Socket buffer](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-mmap-write-211643cf.png)

The accounting ledger (assuming a cache miss on the full path): approximately **2 DMA transfers + 1 CPU copy**. In terms of mode switches, there is one for `mmap` and one for `write`, plus page fault handling on initial access. Compared to traditional `read + write`, `mmap` eliminates the CPU copy from kernel space to user space.

Treating "mmap + write as strictly 4 switches and 3 copies" serves as an educational approximation—whether the Page Cache is hit and when page faults fire cause real-world numbers to fluctuate.

`mmap` offers an additional benefit: the user application does not need to allocate and maintain a dedicated user-space read buffer that duplicates the Page Cache, saving heap memory. How much physical RAM is saved depends on buffer sizing and access patterns; one cannot universally claim it "saves half the memory."

However, `mmap` carries notable caveats: creating and tearing down page tables and handling page faults incur non-trivial overhead. For very small files, this bookkeeping can actually be slower than standard `read`/`write`. Consequently, `mmap` is best suited for large files or scenarios with repeated random access. Furthermore, a hidden landmine exists: if another process truncates a file while you hold an active `mmap` reference, accessing the truncated address range will instantly trigger a `SIGBUS` signal, terminating your process unless explicitly caught. Debugging this in production requires rigorous defensive programming.

## Route 2: sendfile

While `mmap` eliminated one CPU copy, it still requires two separate system call types (`mmap` and `write`). If our sole goal is transmitting a file verbatim over the network, can the operating system execute the entire transfer inside the kernel using a single system call?

Linux kernel 2.1 introduced `sendfile` for precisely this purpose:

```c
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
```

- `in_fd`: The data source descriptor; must be an mmap-capable object (typically a regular file), not a socket.
- `out_fd`: The data destination descriptor; prior to Linux 2.6.33, this had to be a socket; later kernels allow arbitrary files. Always check restrictions against your target kernel version.
- `offset`: The file offset from which to begin reading; passing `NULL` uses the file's current offset.
- `count`: The number of bytes to transfer.

Its semantic contract is: stream data directly between two file descriptors entirely within kernel space, without data ever crossing the user-space boundary. The workflow simplifies to:

1. The application invokes `sendfile()`, **switching to kernel mode** (Switch 1).
2. DMA transfers data from disk into the kernel read buffer / Page Cache (Copy 1, DMA transfer).
3. The CPU copies data from the kernel read buffer into the socket send buffer (Copy 2, CPU copy).
4. DMA transfers data from the socket send buffer to the NIC (Copy 3, DMA transfer), **switching back to user mode** (Switch 2) as `sendfile()` returns.

The accounting ledger: **2 mode switches and 3 data copies (2 DMA transfers + 1 CPU copy)**.

Compared to `mmap`, `sendfile` consolidates the entire transfer into a single system call, eliminating a full user/kernel round trip. The trade-off is that data remains strictly inside the kernel, meaning user space cannot inspect or modify the payload. If payload transformation is required prior to transmission, `sendfile` cannot be used; applications must turn to `mmap`, standard `read`/`write`, or alternative user-space pipelines.

At this stage, one CPU copy remains: moving bytes from the kernel read buffer to the socket send buffer. Can we eliminate this final CPU copy as well?

## Route 3: sendfile + SG-DMA (True Zero-Copy)

Linux kernel 2.4 upgraded `sendfile` by introducing hardware support for **SG-DMA (Scatter-Gather DMA)**. This hardware capability allows the network interface card's DMA engine to read data directly from scattered kernel memory buffers, bypassing the need to consolidate data into a socket buffer first.

The upgraded workflow unfolds as follows:

1. The application calls `sendfile()`, **switching to kernel mode** (Switch 1).
2. DMA copies data from disk into the kernel read buffer / Page Cache (Copy 1, DMA transfer).
3. The CPU no longer copies payload bytes; instead, it writes only lightweight **buffer descriptors** (memory addresses and length offsets) into the socket send buffer.
4. The SG-DMA engine uses these descriptors to pull data directly from the kernel read buffer and stream it to the NIC (Copy 2, DMA transfer). The call completes and **switches back to user mode** (Switch 2).

![Data Copy Paths in sendfile + SG-DMA: Socket buffer holds only descriptor metadata; the NIC reads directly from the kernel buffer via SG-DMA](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-sendfile-sg-dma-43683cd7.png)

The accounting ledger: **2 mode switches, 2 data copies (both DMA), and 0 CPU payload copies**.

This is true, bona fide zero-copy: throughout the entire pipeline, the CPU never touches or moves a single payload byte—the journey from disk to network is handled end-to-end by DMA. The metadata descriptors written by the CPU in Step 3 are merely a few bytes of pointer offsets, which do not constitute payload data copying. Note, however, that unlocking this path requires hardware support: the NIC must support scatter-gather, the kernel version must be compatible, and the protocol stack must not require payload inspection. If user-space TLS encryption or formatting is required, the CPU must read the payload, rendering 0-CPU zero-copy impossible.

## Route 4: splice

`sendfile` is powerful, but it carries a rigid limitation: `in_fd` must support mmap-like semantics (typically regular files, never sockets), and `out_fd` was historically restricted to sockets. If an application needs zero-copy forwarding between two arbitrary sockets or generic descriptors, `sendfile` falls short.

Linux kernel 2.6.17 introduced `splice` (authored by Jens Axboe, requiring glibc 2.5) to bridge this gap. Its core design principle relies on **pipes**:

```c
ssize_t splice(int fd_in, loff_t *off_in, int fd_out, loff_t *off_out,
               size_t len, unsigned int flags);
```

`splice` mandates that **at least one of the two descriptors (`fd_in` or `fd_out`) must be a pipe**. Why bind to pipes? Because inside the Linux kernel, a pipe buffer is implemented as an array of **reference-counted page pointers**: the pipe buffer stores pointers to kernel memory pages rather than duplicating data bytes. Moving data through a pipe largely involves copying pointers and incrementing page reference counts, leaving the underlying payload untouched in memory. (Note: `SPLICE_F_MOVE` is merely a hint to the kernel; if underlying drivers or alignment constraints prevent moving pages, the kernel may gracefully fall back to copying.)

Using `splice` to transmit a file to a socket requires **two sequential system calls**:

```c
splice(file_fd, NULL, pipe_w, NULL, len, SPLICE_F_MOVE);   // File → Pipe write end
splice(pipe_r, NULL, socket_fd, NULL, len, SPLICE_F_MOVE); // Pipe read end → Socket
```

![Data Forwarding Flow in splice: File pages attach to pipe buffer, then forward from pipe to Socket](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-splice-flow-0d597fce.png)

The first call links Page Cache pages into the pipe buffer; the second call streams these page pointers as network packet fragments into the socket. The payload never enters user space, and the CPU never moves payload bytes. Notice, however: this requires **two distinct `splice` system calls**, totaling approximately 4 mode switches—contrary to articles claiming it requires only one system call like `sendfile`. In production, both descriptors must be configured as non-blocking, integrated into an epoll loop, and handle partial transfers alongside `EAGAIN`.

The distinction between `splice` and the previous approaches can be understood as:

- **More versatile than `sendfile`**: `sendfile` focuses on kernel-internal fd-to-fd streaming (typically file to socket); `splice` leverages pipes to transfer data across a broader spectrum of descriptors, including socket-to-socket forwarding. While certain kernel implementations share internal plumbing, they are distinct system calls with differing constraints.
- **Opposite intent of `mmap`**: `mmap` maps data into user space so you can inspect and modify it; the entire purpose of `splice` is ensuring data never touches user space, meaning you cannot read or alter it.

A version detail: in Linux 2.6.30 and earlier, exactly one descriptor had to be a pipe; starting with 2.6.31, both descriptors can be pipes.

## Side-by-Side Comparison of the Four Approaches

Consolidating our four routes provides a clear architectural summary:

| Approach | CPU Payload Copies | DMA Copies | Mode Switches | Typical System Calls |
| --- | --- | --- | --- | --- |
| **Traditional read + write** | 2 | 2 | 4 | `read` + `write` |
| **mmap + write** | 1 | 2 | Typically $\ge 2$ post-mapping, plus page faults | `mmap` once + `write` multiple |
| **sendfile** | 0 or 1 (depending on SG-DMA) | Typically 2 | 2 | `sendfile` |
| **splice (File $\to$ Pipe $\to$ Socket)** | 0 (typically avoided) | Typically 2 | 4 | `splice` twice |

![Comparison of Copy Counts and Mode Switches across Traditional read/write, mmap + write, sendfile + SG-DMA, and splice](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-four-ways-comparison-520d4d0b.png)

*(Note: `mmap` switches and copies vary with Page Cache hits and fault timing; `sendfile` achieves 0 CPU payload copies when the NIC supports SG-DMA).*

Two fundamental architectural conclusions emerge:

**First, in our cache-miss file-to-TCP baseline model, 2 DMA transfers always remain.** They correspond to reading data from disk into memory, and pushing data from memory out to the NIC. Zero-copy primarily reduces CPU payload copying and mode switches; do not blindly project these numbers onto fundamentally different I/O architectures.

**Second, choosing an approach hinges on whether the application needs to touch the payload.** If you must modify content before sending, `mmap` is the proper tool. If you simply stream files verbatim, `sendfile` is superior, driving CPU payload copying to 0 when paired with SG-DMA. `splice` is reserved for broader descriptor forwarding (such as socket-to-socket proxying), accepting the cost of two system calls.

Zero-copy is not an unconditional win. When TLS encryption, compression, framing, or content inspection are required, data must enter user space. For very small files or highly random access patterns, the overhead of mapping, page faulting, and pipe management can outweigh the savings.

Furthermore, `mmap` carries the risk of `SIGBUS` if underlying files are truncated, and massive zero-copy transmission bursts can evict active Page Cache pages, impacting other processes.

## How to Leverage Zero-Copy in Java

In Java NIO, zero-copy capabilities surface primarily through `mmap` and `sendfile`:

**MappedByteBuffer corresponds to `mmap`.** Calling `FileChannel.map` returns a `MappedByteBuffer`, mapping a file (or region thereof) directly into virtual memory. Reading and writing this buffer operates directly against mapped physical memory, bypassing JVM heap allocations:

```java
FileChannel channel = FileChannel.open(
        Paths.get("./data.bin"),
        StandardOpenOption.READ, StandardOpenOption.WRITE);
// Map file directly into memory; backed by mmap under the hood
MappedByteBuffer buffer = channel.map(
        FileChannel.MapMode.READ_WRITE, 0, channel.size());
```

**FileChannel.transferTo / transferFrom aligns with `sendfile`.** However, do not draw a direct equals sign between Java APIs and the underlying OS syscall: `transferTo` guarantees only that bytes are transferred to the target Channel; how it executes depends on the JDK, operating system, and target Channel type. When the target is a connected `SocketChannel` and the OS supports it, the JDK leverages kernel zero-copy (e.g., `sendfile`). If the target is a regular file or custom Channel, it may fall back to user-space copying. The canonical network transfer pattern is:

```java
FileChannel source = FileChannel.open(
        Paths.get("./in.dat"), StandardOpenOption.READ);
// socketChannel is an active, connected SocketChannel
// File -> Socket: JDK utilizes OS zero-copy (e.g., sendfile) on supported platforms
source.transferTo(0, source.size(), socketChannel);
```

A common pitfall: `transferTo` does not guarantee transferring all requested bytes in a single call; callers must loop based on the returned byte count. When backed by Linux `sendfile`, a single call caps out at `0x7ffff000` bytes (approx. 2 GB); actual limits and zero-copy fidelity should always be validated across JDK versions and deployment platforms (Windows behavior differs noticeably from Linux).

## How Kafka and RocketMQ Leverage These Techniques

Zero-copy is celebrated for powering the massive throughput of Kafka and RocketMQ, but their architectural choices diverge based on distinct I/O patterns:

**Kafka leverages zero-copy for message consumption.** When consumers pull messages, Kafka must stream raw commit log segment files from disk out over network sockets. Because message payloads are transmitted verbatim without modification, Kafka employs `FileChannel.transferTo`, pushing log segments directly from the Page Cache into network sockets without ever entering the JVM heap. Combined with sequential disk writes and the OS Page Cache, this enables astonishing throughput. (Kafka's index files, by contrast, rely on `mmap`.) However, zero-copy does not apply unconditionally: if Kafka must perform on-the-fly message format conversion, decompression, or user-space TLS encryption, the payload must be materialized in memory, forcing the transfer to fall back.

**RocketMQ relies predominantly on `mmap`.** RocketMQ's CommitLog utilizes `MappedByteBuffer` to read and write message data. This is a primary reason why RocketMQ structures CommitLog files in fixed sizes (typically 1 GB), facilitating smooth memory mapping lifecycle management. RocketMQ chose `mmap` over `sendfile` because its read/write engine requires granular programmatic manipulation of mapped memory, rather than simple verbatim file forwarding.

In summary: **Choose sendfile for pure verbatim forwarding; choose mmap when you need to manipulate mapped memory.** This mirrors our core selection rule based on whether user space needs to touch the data.

## Extension: Rust's zerocopy Crate Is a Different Concept

Searching for "zerocopy" online often leads to Google's open-source Rust library, [google/zerocopy](https://github.com/google/zerocopy). It is actively maintained with millions of downloads.

However, note this critical distinction: **the Rust `zerocopy` crate and operating system I/O zero-copy are entirely different concepts**. OS-level zero-copy focuses on eliminating CPU data movement between kernel and user buffers during I/O. The Rust `zerocopy` crate, by contrast, solves **type-safe in-memory casting (safe transmutation)**, allowing developers to convert between raw byte slices and structured types without memory copying and without writing `unsafe` blocks. Both share the phrase "zero copy," but one pertains to system calls and DMA, while the other governs language-level memory layouts and type safety. Do not conflate them in technical discussions.

## How to Answer in an Interview

When asked *"What is zero-copy?"*, clarify what "zero" means right away: it does not mean zero total copies—disk-to-memory and memory-to-NIC DMA transfers still occur. Zero-copy primarily eliminates the CPU's involvement in copying payloads between kernel and user buffers, along with reducing user/kernel mode switches.

Walk through traditional `read + write` as having 4 copies: disk to kernel buffer (DMA), kernel buffer to user buffer (CPU), user buffer to socket buffer (CPU), and socket buffer to NIC (DMA). Highlight that the two CPU copies represent pure waste because the application never touched the payload, forcing data to take an unnecessary detour through user space.

Present the evolutionary solutions in logical order: `mmap + write` maps user space and the Page Cache to the same physical pages, eliminating the kernel-to-user CPU copy (though still requiring a `write` into the socket buffer); `sendfile` encapsulates file-to-socket streaming into a single system call; when combined with SG-DMA, the socket buffer stores only lightweight descriptors, allowing DMA to stream payloads directly from the kernel read buffer to the NIC; and `splice` leverages pipe buffers to forward page references across arbitrary descriptors, though it requires two system calls.

When the interviewer pivots to Kafka and RocketMQ, distinguish their choices clearly: Kafka consumer streaming sends log segments verbatim to consumers, making it ideal for `FileChannel.transferTo` (`sendfile`); RocketMQ's CommitLog requires programmatic manipulation of mapped memory, making `mmap` the natural fit. Finally, note the operational boundaries: TLS encryption, compression, and payload transformation force data back into user space, causing zero-copy optimizations to fall back.
