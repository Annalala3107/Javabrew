---
title: "Inter-Process Communication (IPC) Deep Dive: Pipes, Message Queues, Shared Memory, Sockets, and Binder"
description: "High-frequency interview questions summary on inter-process communication (IPC), starting from address space isolation, detailing pipes, message queues, shared memory, semaphores, signals, sockets, Android Binder, and microkernel IPC design trade-offs."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Linux
  - IPC
head:
  - - meta
    - name: keywords
      content: Inter-Process Communication,IPC,Linux IPC,Pipes,FIFO,Message Queues,Shared Memory,Semaphores,Signals,Sockets,Unix Domain Sockets,Android Binder,Microkernel IPC,OS Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/ipc.md
---

When two processes want to exchange data, the most intuitive assumption might be: Process A simply writes the data into its own memory, and Process B directly reads that memory.

However, modern operating systems do not work that way. Every process has its own independent virtual address space. Address `0x7f...` in Process A does not refer to the same physical memory location as address `0x7f...` in Process B. User-space processes cannot arbitrarily peek into or tamper with another process's memory; otherwise, security and permission isolation would completely collapse.

Consequently, **IPC (Inter-Process Communication)** must inevitably involve the operating system kernel.

Rather than overcomplicating it, think of IPC as solving three fundamental challenges: **how to transfer data, how to synchronize control flow, and how to handle naming and permission checks**. Memorizing names like "pipes, message queues, shared memory" without this mental model is why candidates forget them soon after memorizing.

![Process address space isolation requires inter-process communication to rely on kernel-provided IPC mechanisms](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-why-ipc-d8d99cce.png)

## What Problems Does IPC Actually Solve?

![IPC must simultaneously resolve data transmission, synchronization control, naming and addressing, and permission checks](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/what-problem-does-ipc-solve-81fa7a5a.png)

1. **How data crosses process boundaries**: Pipes and byte-stream sockets transmit unstructured streams of continuous bytes, where message framing boundaries must be established by the application protocol. Message queues, datagram sockets, and Binder transactions transmit discrete messages with inherent message boundaries. Shared memory allows multiple processes to map the exact same physical memory pages into their address spaces; once mapped, reading and writing the shared region avoids trapping into the kernel on every operation.
2. **Synchronization**: Shared memory only solves "seeing the same data"; it does not solve "who writes first and who reads second." If multiple processes modify a shared circular buffer concurrently without a mutex, semaphore, futex, or condition variable, the data will quickly become corrupted.
3. **Naming, Addressing, and Permissions**: Anonymous pipes rely on file descriptor inheritance across a `fork()` call; named pipes (FIFOs) rely on filesystem paths; System V IPC relies on numeric keys and kernel object IDs; Unix Domain Sockets can bind to filesystem paths or Linux abstract namespaces; Android Binder utilizes the Service Manager to resolve service names to Binder object references.

## Pipes: Byte Streams, Simple, but Minimal Framing

Pipes are the most familiar IPC mechanism. In the shell command `ps aux | grep java`, the vertical bar `|` connects the standard output of the first process directly into the standard input of the second.

In Linux, calling the `pipe()` system call yields two file descriptors: a read end and a write end. If a parent process creates a pipe and then calls `fork()`, the child process inherits these file descriptors, allowing parent and child to exchange data through the shared pipe. Anonymous pipes have no name in the filesystem and are restricted to processes that share an ancestor.

![Pipes transfer a unidirectional byte stream between parent and child processes via a kernel buffer](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-pipe-flow-274e7ebf.png)

A pipe is a unidirectional byte stream. POSIX mandates only unidirectional transmission; bidirectional communication requires creating two separate pipes. Pipes are oblivious to message boundaries: if the writer calls `write()` 3 times, the reader might read all the data in a single `read()`. Pipe buffers reside in the kernel: when full, blocking writes sleep until space frees up, while non-blocking writes return `EAGAIN`. Finally, a pipe is not a regular file and cannot be randomly traversed using `lseek()`.

A frequently asked Linux constant is `PIPE_BUF` (4096 bytes on Linux). For pipes and FIFOs, writes of up to `PIPE_BUF` bytes are guaranteed by the kernel to be atomic—meaning data will not be interleaved with writes from other concurrent writers. In blocking mode, the call may block waiting for sufficient buffer space; in non-blocking mode, if space is insufficient, it returns `EAGAIN`. Writes exceeding `PIPE_BUF` may be fragmented and interleaved with other writers' bytes. Note that atomicity does not imply message framing.

**Named pipes (FIFOs)** use `mkfifo` to create a special file in the filesystem. Two completely unrelated processes can open this path and communicate. While a FIFO has a filesystem path, data is not persisted to disk; the path serves purely as a rendezvous entry point in the namespace, with the actual data buffered in kernel memory.

Pipes excel at chaining command-line tools and transferring small streams between parent and child processes. They are unsuited for complex application protocols and massive payloads. When framing with length prefixes, checksums, and sequence numbers is needed, switching to sockets or message queues is generally cleaner.

## Message Queues: Kernel-Maintained Messages with Built-in Framing

Message queues store data as discrete, structured messages inside kernel objects. A sender calls `msgsnd()` or `mq_send()` to insert a message into the queue, and a receiver calls `msgrcv()` or `mq_receive()` to extract it. While System V and POSIX message queues have different APIs, both adhere to the model of "the kernel manages the queue, and processes read/write discrete messages."

Compared to pipes, the primary advantage is **message framing**. Receivers do not need to parse packet boundaries from a raw stream. System V message queues support filtering and retrieval based on message type tags; POSIX message queues support priority ordering, where `sysconf(_SC_MQ_PRIO_MAX)` on Linux typically yields 32,768 distinct priorities (surpassing the minimum POSIX requirement of 0 to 31).

The trade-off is copying overhead: sending copies data from user space into the kernel queue, and receiving copies it from the kernel queue into the recipient's user-space buffer. Furthermore, queues are bounded by kernel limits—such as POSIX queue parameters `/proc/sys/fs/mqueue/msg_max` and `msgsize_max`.

Thus, message queues are best suited for small, structured control messages, event notifications, and command dispatching. They are not intended for large images, raw video frames, or massive serialized blobs. Note also that Linux OS message queues are fundamentally different from distributed middleware like Kafka or RocketMQ—they lack persistent disk logs, consumer groups, and cross-node replication.

## Shared Memory: Minimal Copying, but Synchronization Is on You

Shared memory enables multiple processes to map the exact same physical memory frames into their respective virtual address spaces. Once mapped, when Process A writes to this memory, Process B immediately observes the update.

Linux provides two standard API families: System V shared memory (`shmget()`, `shmat()`, `shmdt()`, `shmctl()`), and POSIX shared memory (`shm_open()` to create an object, `ftruncate()` to configure size, and `mmap()` to map it into process virtual memory).

![Shared memory allows multiple processes to map the same physical memory, but requires coordination with synchronization primitives like semaphores and futex](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-shared-memory-06c62e54.png)

Shared memory is the fastest IPC mechanism because its data path eliminates intermediary copies. Pipes, message queues, and sockets require data to be copied into kernel space and then copied back out to the destination process. With shared memory, once mapping is complete, both processes read and write the exact same physical pages directly; no repeated data copying between user and kernel space occurs. High-throughput scenarios like local telemetry collection, real-time video processing, and in-memory database caching are prime use cases.

However, mapping the same physical memory only resolves *visibility*; it does not resolve *synchronization* or *access ordering*.

Consider a shared ring buffer: the producer writes data and increments `tail`; the consumer reads data based on `head` and `tail`. If the producer updates `tail` before the data payload is completely written and flushed, the consumer will read a corrupt, partial record. Shared memory cannot solve this on its own. Access ordering, memory visibility, and wakeup signaling must be orchestrated explicitly: simple setups use inter-process mutexes or POSIX semaphores; high-performance systems employ `eventfd`, `futex`, atomic variables, and memory barriers.

Another crucial trap: **never store raw process-local pointers inside shared memory**. A shared memory region may be mapped at virtual address `0x7000...` in Process A, but mapped at `0x5000...` in Process B. A pointer written by Process A is meaningless and dangerous if dereferenced by Process B. Production implementations store relative byte offsets, array indices, or well-defined flat structs.

Therefore, do not evaluate shared memory based solely on copy count. End-to-end performance depends on CPU cache coherency, lock contention, memory barrier overhead, notification latency, and data layout. Shared memory is ideal for massive payloads between local processes where developers are prepared to manage memory layout and synchronization carefully. For simple status flags or command dispatching, message queues, pipes, or Unix Domain Sockets are far simpler and safer.

## Difference Between Semaphores and Signals

**Semaphores** frequently appear alongside shared memory, but they do not transfer business data payloads. A semaphore is an integer counter used to throttle concurrency in a critical section or notify a peer that "data is ready for consumption." POSIX semaphores can be named or unnamed; `sem_post()` increments the counter, while `sem_wait()` attempts to decrement it, blocking when the counter is zero.

**Signals** are asynchronous event notifications delivered by the kernel to a process: `SIGINT` signals terminal interruption (Ctrl+C), `SIGTERM` requests graceful shutdown, and `SIGCHLD` notifies a parent that a child process has changed state. Linux supports standard signals and real-time signals. Signals carry minimal payload data, and signal handlers are strictly constrained to async-signal-safe functions. Production handlers typically do nothing more than set a `volatile sig_atomic_t` flag, or use async-signal-safe `write(2)` to write a byte to a self-pipe or a `uint64_t` value to an `eventfd`, deferring processing to the main event loop.

## Sockets: Local and Cross-Host Communication

Sockets are not limited to networking; they are a first-class local IPC mechanism.

When processes reside on different hosts, TCP/UDP network sockets are mandatory. When processes reside on the same machine, **Unix Domain Sockets (UDS)** provide superior local performance. Operating within the `AF_UNIX` (or `AF_LOCAL`) address family, they support stream (`SOCK_STREAM`), datagram (`SOCK_DGRAM`), and sequenced packet (`SOCK_SEQPACKET`) semantics.

Unix Domain Sockets share the standard socket API, supporting communication between unrelated processes. On Linux, they can bind to filesystem pathname entries or leverage Linux's abstract namespace (which bypasses the filesystem). Crucially, UDS supports passing open file descriptors across process boundaries via `sendmsg()` using auxiliary control data (`SCM_RIGHTS`). For authentication, stream-oriented Unix sockets retrieve peer credentials (PID, UID, GID) via `SO_PEERCRED`, while datagram sockets pass credentials alongside messages using `SO_PASSCRED` and `SCM_CREDENTIALS`.

Choosing between pipes and Unix Domain Sockets:
- For simple unidirectional byte streams between parent and child processes, pipes suffice.
- For bidirectional communication, client-server listening, request-response RPC, or passing file descriptors, Unix Domain Sockets are the standard choice.
- For cross-host communication, transition to TCP/UDP or higher-level RPC frameworks (such as gRPC).

## Android Binder: IPC as a System Service Invocation

![Android Binder encapsulates IPC into system service calls via AIDL, Parcel, Binder driver, and Service Manager](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/android-binder-turning-ipc-into-system-service-c-6cd21610.png)

In Android, **Binder** is the architectural backbone of IPC. Application interactions with system services, cross-process Service communication, and AIDL-generated remote interfaces all rely on Binder under the hood.

Key design highlights of Binder:
- **AIDL & Code Generation**: AIDL allows clients and services to define strong interface contracts. Android build tooling generates serialization, deserialization, and proxy/stub code. Clients invoke remote services as if they were local Java objects.
- **Parcel & Binder Driver**: Arguments are serialized into a `Parcel` and passed to the Linux kernel `/dev/binder` driver, which executes the transaction.
- **Service Manager**: Acts as the global context manager registered with the Binder driver, resolving string service names to Binder references.
- **Rich Objects & FD Passing**: Binder transactions can pass Binder object references, tokens, and file descriptors. Passing file descriptors allows Binder to pair with shared memory (ashmem/memfd): Binder transmits lightweight control messages and descriptors, while bulk data streams through shared memory.
- **Thread Pools**: AIDL calls are dispatched into a platform-managed thread pool within the server process; service implementations must ensure thread safety.

Binder is not designed for bulk data payloads. Android documentation for `TransactionTooLargeException` explicitly notes that the Binder transaction buffer is currently capped at **1 MB**, and this buffer is shared across all in-flight transactions within the process. The exception itself is heuristic: clients cannot reliably determine whether failure occurred during request transmission or response return. Best practice dictates using Binder strictly for method parameters, return tokens, pagination metadata, and file descriptors.

## Why Microkernels Are Obsessed with IPC Performance

Monolithic kernels like Linux place the virtual filesystem, network stack, and device drivers inside kernel space. In contrast, **microkernels** push as many services as possible into user-space processes (e.g., filesystem servers, network drivers, device managers). While this yields superior fault isolation and modularity, it causes IPC frequency to skyrocket.

Reading a file in a monolithic kernel typically involves a single system call trap into the kernel. In a microkernel, that same read might require multiple round-trip IPC messages between the application, the filesystem server, and the block device driver. If IPC is slow, the entire operating system grinds to a halt.

Consequently, microkernel research focuses heavily on IPC optimization:
- **Mach**: Pioneered the `port` abstraction—a kernel-protected message queue and capability handle. A task must hold an explicit port right to send or receive messages.
- **L4 Family**: Radically optimized IPC fast paths. Small messages are passed directly via CPU registers; synchronous IPC uses rendezvous semantics; direct process switching allows the calling thread to switch CPU context directly to the receiver, bypassing general-purpose scheduler queues.
- **LRPC (Lightweight Remote Procedure Call)**: Re-engineers cross-protection-domain calls on the same host to minimize thread context switching, buffer copying, and scheduling overhead.

## Choosing the Right IPC Mechanism

Avoid asking "which is fastest." The proper architectural questions are: How large is the payload? Are message boundaries required? Do the processes share ancestry? Is bidirectional request-response required? Does communication span machines? Are authentication and credential verification required?

| IPC Mechanism | Data Form | Preserves Message Boundaries? | Suitable for Large Payloads? | Cross-Host Capable? | Typical Scenarios |
| --- | --- | --- | --- | --- | --- |
| Anonymous Pipe | Byte stream | No | No | No | Parent-child processes, shell pipelines |
| FIFO (Named Pipe) | Byte stream | No | No | No | Simple communication between unrelated processes |
| Message Queue | Discrete messages | Yes | No | No | Control commands, state events, alerts |
| Shared Memory | Shared memory region | Application-defined | Yes | No | High-throughput bulk data exchange |
| Unix Domain Socket | Byte stream, datagram, sequenced packet | Depends on type | Moderate | No | Local service daemons, passing file descriptors |
| TCP/UDP Socket | Byte stream or datagram | Depends on protocol | Protocol-dependent | Yes | Distributed cross-host communication |
| Android Binder | Transactions, object references, FDs | Yes | No (direct payloads) | No (Android local) | Android system service invocations |

![Horizontal comparison of common IPC mechanisms across data form, message boundaries, large payload handling, and cross-host capabilities](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-ipc-comparison-0315c5c3.png)

Summary:
- Simple byte stream between parent and child: **Pipes**.
- Bidirectional request-response between unrelated local processes: **Unix Domain Sockets**.
- Structured, discrete event notifications: **Message Queues**.
- High-throughput bulk data sharing: **Shared Memory** paired with notification mechanisms.
- Cross-host distributed communication: **TCP/UDP Sockets** or RPC frameworks (gRPC).
- Android inter-process components: **Binder**.

![Selecting an IPC mechanism based on payload size, message framing, cross-host requirements, and process relationships](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/ipc-ipc-selection-d8d08e8b.png)

## How to Answer IPC Questions in an Interview

Structure your interview response conceptually:

> Processes are isolated by default within independent virtual address spaces. IPC mechanisms allow processes to communicate either by having the kernel mediate data transmission, or by having the kernel establish a shared memory region.

Follow with the classification:

> - **Pipes and FIFOs**: Unidirectional byte streams without inherent message boundaries, suited for pipelines and related processes.
> - **Message Queues**: Kernel-managed queues preserving discrete message boundaries, ideal for small structured control commands.
> - **Shared Memory**: Maps identical physical pages into multiple address spaces, eliminating kernel copying overhead for large payloads—though synchronization (semaphores, mutexes, futexes) must be managed by the application.
> - **Unix Domain Sockets**: Versatile bidirectional communication for local processes, supporting credential passing and file descriptor transfer (`SCM_RIGHTS`).
> - **Android Binder**: A transaction-oriented IPC mechanism built for system service invocations, supporting AIDL code generation, reference passing, and file descriptor forwarding.

If asked *why shared memory still needs semaphores*:

> Shared memory only guarantees visibility—it provides no synchronization. Without primitives like semaphores, mutexes, or futexes to enforce access order, concurrent reads and writes will cause race conditions and data corruption.

If asked *why Binder is unsuitable for large payloads*:

> Android enforces a strict 1 MB transaction buffer limit for Binder per process, shared across all active transactions. Exceeding this triggers `TransactionTooLargeException`. Large payloads should be chunked, paginated, or transferred using shared memory (ashmem/memfd) while passing only the file descriptor over Binder.

Framing IPC around data size, message framing, communication scope, and synchronization guarantees a comprehensive, professional technical response.
