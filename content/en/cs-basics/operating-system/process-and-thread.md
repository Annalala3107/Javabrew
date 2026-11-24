---
title: "Processes and Threads Deep Dive: Differences, States, Communication, Context Switching, and Virtual Threads"
description: "High-frequency interview questions summary on processes and threads, breaking down concepts, resource models, state transitions, PCB/TCB, fork/exec/wait, threading models, context switching, and Java virtual threads from an operating system perspective."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Processes and Threads
  - Java Concurrency
head:
  - - meta
    - name: keywords
      content: Process,Thread,Difference Between Process and Thread,Process State,Thread State,PCB,TCB,fork,exec,wait,clone,pthread,Context Switch,Threading Models,Java Virtual Threads,OS Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/process-and-thread.md
---

Processes and threads are the most foundational—and frequently conflated—concepts in operating systems.

When interviewers ask about their differences, many candidates simply recite: *"A process is the basic unit of resource allocation, while a thread is the basic unit of CPU scheduling."* While this statement is an acceptable starting point, it is far from sufficient.

Digging deeper reveals a chain of concrete questions: Why are processes isolated by default? What do threads actually share? After `fork()`, what state is shared between parent and child, and what is separated? Why does arbitrarily calling `fork()` inside a multithreaded program cause critical issues? Do Java virtual threads qualify as operating system threads?

This article unpacks these questions step by step. We first clarify the boundaries between programs, processes, and threads, examine `fork`, `exec`, `wait`, and `clone` in Linux, and conclude with context switching, threading models, and Java virtual threads. Throughout your reading, keep this central guideline in mind: **a process represents a resource and isolation boundary, whereas a thread represents a schedulable execution path.**

## What Are Programs, Processes, and Threads?

![Relationship between Program, Process, and Thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/relationship-between-program-process-and-thread-97be3e79.png)

A **program** is a collection of instructions and data stored on disk, such as an executable file or a JAR package. It is not yet running; it is merely a static file.

When the operating system loads the program into memory, establishes process-level resources (such as a virtual address space and a file descriptor table), and sets up the execution context (such as the stack and register context) for an initial thread, that running instance becomes a **process**. The same program can be launched multiple times, corresponding to multiple processes; for example, opening two terminal windows typically creates two distinct process instances.

A **thread** is an execution stream within a process. A process contains at least one thread. Multiple threads within a process share the process's allocated resources, but each thread retains its own private execution context. In modern operating systems, what the scheduler actually dispatches to CPU cores is typically the thread: whichever thread is in a runnable state may be allocated a CPU time slice by the scheduler.

A helpful rule of thumb to remember: **Processes focus on resource boundaries; threads focus on execution and scheduling.**

To determine whether a concept leans towards a process or a thread, ask: Does it describe a resource boundary, or an execution path? Address spaces, open file tables, and security credentials lean towards processes; stacks, registers, and program counters lean towards threads.

![WeChat factory analogy for the difference between processes and threads](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/wechat-factory-process-thread-b3457524.png)

However, this rule serves primarily as a mental anchor rather than an absolute rule across every OS implementation. For instance, the Linux kernel internally uses `task_struct` to represent scheduling entities, treating processes and threads as tasks that simply share resources to varying degrees. Windows documentation, on the other hand, explicitly defines threads as the fundamental units to which the operating system allocates processor time. Terminology varies across systems, but the underlying abstractions remain broadly consistent.

## What Resources Does a Process Own?

A process is much more than executing code. A process typically encompasses:

- **Virtual address space**: A contiguous virtual memory space visible to the process, including code (text) segments, data segments, heap, stack, and memory-mapped regions.
- **Open files and handles**: File descriptors, network sockets, pipes, and device handles.
- **Security and identity context**: User ID (UID), group ID (GID), permissions, credentials, and security contexts.
- **Scheduling metadata**: Priority, CPU execution metrics, CPU affinity, and scheduling status.
- **Runtime context**: Signal handlers, environment variables, current working directory, and more.

Processes are isolated from each other by default. One process cannot arbitrarily read or write the virtual address space of another process. This boundary is the bedrock upon which operating systems safeguard independent programs. When two processes need to exchange data, they must rely on Inter-Process Communication (IPC) mechanisms such as pipes, message queues, shared memory, sockets, files, or signals.

Isolation provides security, but comes at a performance cost. Because each process maintains its own address space and resource tables, switching, communicating, creating, and destroying processes are all substantially heavier operations than doing so for threads.

## What Are the Common Process States?

The classic 5-state model taught in textbooks is sufficient for handling most technical interview discussions:

- **New (Created)**: The process is being initialized and has not yet been placed into the ready queue.
- **Ready**: All prerequisites for execution are satisfied except for CPU allocation.
- **Running**: The process is actively executing instructions on a CPU core.
- **Blocked (Waiting)**: The process is waiting for an event to occur, such as I/O completion, lock acquisition, or timer expiration.
- **Terminated (Exit)**: The process has finished execution, and the operating system is reclaiming its associated resources.

![Process state transition diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/state-transition-of-process-d4bbabcd.png)

The key to understanding state transitions lies not in memorizing the names, but in understanding their triggering causes. A process in the Ready state transitions to Running when granted CPU time; a Running process transitions back to Ready if its allotted time slice expires; a Running process transitions to Blocked upon issuing a blocking I/O operation; and once the awaited event completes, the Blocked process transitions back to Ready to await its next scheduling opportunity.

Some textbooks also introduce the **Suspended state**. "Suspended" emphasizes that a process has been temporarily swapped out of physical memory or paused by a user/system signal, whereas "Blocked" emphasizes that it is waiting on an event. They are distinct concepts: a process can be blocked while still residing in physical RAM, or it can be swapped out to disk, entering a blocked-suspended state.

## What Is a PCB?

A PCB (Process Control Block) is the primary data structure an operating system uses to manage a process. Runtime metadata for a process is not lost; it is preserved and managed within kernel structures analogous to the PCB.

A PCB typically records:

- **Process identification**: PID, parent process ID (PPID), user ID (UID), etc.
- **Process state and scheduling information**: Ready, running, blocked, priority, and CPU execution accounting.
- **CPU context**: Program counter (PC), stack pointer (SP), general-purpose registers, etc., enabling the CPU to resume execution seamlessly when switched back.
- **Memory management information**: Page tables, virtual memory areas, and memory mappings.
- **Resource accounting**: Open file descriptor tables, signal disposition tables, working directory, and pending I/O status.

During a context switch, the operating system saves the CPU registers and execution context of the currently running entity, and then restores the execution context of the next entity. Structures like PCB/TCB provide the definitive blueprint for "where to resume execution next."

The Linux implementation is noteworthy: it treats both processes and threads as tasks. Rather than embedding every resource directly inside `task_struct`, it uses pointers pointing to separate resource descriptors (memory descriptors, file tables, signal handling tables, etc.). When multiple threads belong to the same process, they point to the exact same resource structures; separate processes point to distinct resource structures. This architectural nuance makes understanding `clone()` in Linux remarkably straightforward.

## What Do fork, exec, and wait Do in Linux?

![Call chain of fork, exec, and wait](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/fork-exec-wait-call-chain-4d2918b1.png)

In Unix/Linux systems programming, process creation routinely revolves around three core primitives: `fork()`, `exec()`, and `wait()`.

`fork()` creates a child process. Upon successful invocation, both parent and child processes continue executing from the exact same instruction point, differentiated only by their return value: the parent receives the child's PID, while the child receives 0. The parent and child processes possess independent virtual address spaces that initially mirror each other. Modern operating systems implement Copy-on-Write (COW): physical memory pages are initially shared read-only and are duplicated by the kernel only when one process attempts to write to a page.

Pay close attention to file descriptors. After `fork()`, the child inherits an exact duplicate of the parent's file descriptor table; however, matching descriptors point to the same underlying open file description in the kernel. Consequently, file offsets, open file status flags, and access modes are shared. In engineering practice, flags like `FD_CLOEXEC` or `O_CLOEXEC` are widely applied to prevent leaking unneeded file descriptors across an `exec()` boundary to new programs.

The `exec()` family of functions replaces the current process image with a new program. It does not spawn a new process or alter the PID; instead, it overwrites the user-space text, data, heap, and stack with those of the target program. The standard command-line execution pattern is: the shell invokes `fork()` to create a child process, which subsequently calls `exec()` to transform into the requested executable.

`wait()` / `waitpid()` suspends the calling parent process until one of its child processes changes state, allowing the parent to collect the child's exit status code and enabling the kernel to reclaim the child's remaining metadata. If a child terminates and the parent never calls `wait()`, the child becomes a **zombie process**. A zombie process executes no code, but it occupies a PID slot and retains an exit status record in the kernel process table.

When a shell executes an external command, the classic sequence is:
1. The shell calls `fork()` to create a child process.
2. The child process calls `exec()` to load and execute the target program.
3. The parent shell calls `wait()` or `waitpid()` to block until completion and reap the child's exit status.

A critical, easily overlooked caveat: when a multithreaded process calls `fork()`, only the calling thread is duplicated in the child process. Any locks, condition variables, malloc heap state, or stdio buffer states held by other threads in the parent process at the moment of `fork()` are copied into the child, but the threads that held those locks do not exist in the child. Consequently, deadlocks are common if the child touches those shared resources. Strictly speaking, between `fork()` and `exec()` in a multithreaded application, the child should invoke only async-signal-safe functions. Performing complex operations in this narrow execution window is a frequent source of subtle bugs.

## What Do Threads Share, and What Is Private to a Thread?

![Thread shared resources and private execution context](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/thread-shared-and-private-content-c8d5ff09.png)

From an operating system viewpoint, threads within the same process share the vast majority of process-level resources:

- Memory regions within the process virtual address space: text/code segment, data segment, and heap.
- Open file descriptors, network sockets, and current working directory.
- Process ID, parent process ID, and signal dispositions.
- Global variables, static variables, and heap-allocated objects.

In a Java/JVM context, Java threads additionally share runtime data areas within the JVM process, notably the Java Heap and Method Area / Metaspace. Keep in mind that Method Area / Metaspace is a JVM specification concept rather than a native operating system construct.

In Linux user space, multiple threads in the same process calling `getpid()` will observe the same thread group ID (TGID)—which corresponds to the familiar Process ID (PID). However, each thread maintains its own unique kernel task identifier (TID), which can be retrieved via `gettid()`.

Conversely, each thread retains its own private state:

- **Stack**: Stores stack frames, function call parameters, local variables, and return addresses.
- **Registers and Program Counter (PC)**: Tracks the precise CPU instruction currently being executed by that thread.
- **Thread ID (TID), scheduling priority, and Thread-Local Storage (TLS)**.
- **Thread state and kernel context**: Minimal execution context required by the kernel to suspend and resume the thread.

Resource sharing makes inter-thread communication extraordinarily efficient: when one thread writes data to a heap object, another thread can observe that change almost immediately. However, shared mutable state introduces data races: if multiple threads read and write mutable data concurrently without synchronization primitives (such as locks, atomic variables, or condition variables), program behavior becomes unpredictable.

This highlights a fundamental engineering difference between processes and threads: a crash in one process typically does not affect other processes. In contrast, an out-of-bounds write or memory corruption caused by a single errant thread can corrupt shared address space and crash the entire process.

## What Is a TCB?

A TCB (Thread Control Block) represents control and state metadata at the thread level. It typically contains the thread ID, thread execution state, saved CPU register context, stack pointer, scheduling priority, and thread-local storage pointers.

In certain textbooks and operating systems, PCB and TCB are maintained as separate structures: the PCB manages process-level resources, while the TCB tracks thread-level execution context. In Linux, however, the unified `task_struct` represents all schedulable entities as tasks, distinguishing processes from threads purely based on whether resource structures (address space, open files) are shared. When learning these concepts, avoid getting bogged down in naming semantics; focus instead on differentiating what constitutes a resource boundary versus an execution context.

## Why Do We Need Threads Given That Processes Already Exist?

The primary motivation is achieving concurrency within an application at significantly lower resource overhead.

If a server needs to simultaneously handle network I/O, business processing, and disk logging, it could theoretically spawn separate processes. However, sharing state across processes requires complex IPC mechanisms, and processes demand higher memory and lifecycle overhead. By leveraging multiple threads, workers share heap memory and open sockets directly. Provided synchronization is implemented correctly, coordination overhead drops dramatically.

Threads also maximize CPU utilization. On a single-core CPU, when one thread blocks on disk or network I/O, other threads can proceed with execution. On multi-core architectures, multiple threads execute concurrently across distinct CPU cores in true parallelism. Keep in mind that CPU-bound and I/O-bound workloads exhibit entirely different thread count requirements; more threads do not automatically yield higher throughput.

Threads are not free. Under Linux NPTL, if the process's soft `RLIMIT_STACK` limit is not `unlimited` at startup, it defines the default stack size for newly created threads. A common `ulimit -s` setting is 8192 KB, which sets the default thread stack to 8 MB. If `RLIMIT_STACK` is `unlimited`, architecture-specific defaults apply (typically 2 MB on most architectures). You can also set explicit thread stack sizes using `pthread_attr_setstacksize()`, provided it is not lower than `PTHREAD_STACK_MIN` (16,384 bytes in Linux man-pages). Furthermore, threads are bounded by PID limits, `threads-max`, and physical memory. Blindly spawning massive numbers of platform threads in production frequently leads to memory exhaustion, scheduler thrashing, and severe context-switching overhead.

## How Do User Threads, Kernel Threads, and Threading Models Differ?

Categorized by "who handles scheduling," threads are divided into user-level threads and kernel-level threads.

**User-level threads (ULT)** are managed entirely by user-space runtimes or thread libraries; the OS kernel is unaware of their existence. The advantage is that thread creation and switching avoid the overhead of kernel traps and system calls. The drawback is that if multiple user threads map to a single kernel scheduling entity, a single thread issuing a blocking system call blocks the entire process, preventing true multi-core hardware parallel execution.

**Kernel-level threads (KLT)** are created, scheduled, and managed directly by the operating system kernel. If one thread blocks, the kernel schedules other threads within the same process. Multiple threads can execute in parallel across multiple CPU cores. The trade-off is that thread creation, destruction, blocking, unblocking, and context switching require crossing user/kernel space boundaries.

There are three classic threading models:

![Three common threading models](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/process-and-thread-three-thread-models-8bb78c39.png)

| Model | Mapping | Advantages | Key Drawbacks |
| --- | --- | --- | --- |
| Many-to-One | Multiple user threads map to a single kernel thread | Fast user-space switching, minimal implementation overhead | A single blocking call halts all threads; cannot leverage multi-core CPUs |
| One-to-One | Each user thread maps to a separate kernel thread | Exploits multi-core parallelism; isolated blocking | Thread count bounded by system resources; higher creation and context-switching costs |
| Many-to-Many | Multiple user threads multiplex across multiple kernel threads | Balances flexibility and hardware parallelism | Substantially more complex runtime and scheduler implementation |

Linux POSIX threads (pthreads) and Windows system threads adhere to the **one-to-one** model. In Linux, `pthread_create()` invokes the `clone()` system call under the hood, using flags such as `CLONE_VM`, `CLONE_FILES`, `CLONE_FS`, and `CLONE_THREAD` to specify shared resources. In Linux, processes and threads do not represent two fundamentally disconnected creation mechanisms; they are merely tasks created via `clone()` with different resource-sharing flags.

## How Do Thread Context Switching and Process Context Switching Differ?

![Cost comparison between thread context switching and process context switching](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/context-switch-cost-comparison-63e31c11.png)

A context switch occurs when a CPU core transitions from executing one task to another. The operating system must preserve the current entity's register values, program counter, and stack pointer, and subsequently restore the saved execution context of the incoming entity.

Both thread and process context switches incur performance overhead, but process switches are inherently heavier. Because each process possesses an independent address space, switching between processes involves changing the page table base pointer (e.g., reloading CR3 on x86), invalidating the Translation Lookaside Buffer (TLB), and degrading CPU cache locality. In contrast, threads in the same process share an address space, eliminating the need to reload page directory registers.

In summary: Switching between threads within the same process primarily entails swapping thread-private execution context (stack pointer, registers, program counter); switching across processes requires swapping execution contexts AND switching address spaces, triggering TLB flushes and cache misses.

However, thread switching should not be dismissed as merely "saving a few registers." Under heavy thread contention, cross-core migration, lock competition, and cache line bouncing consume significant CPU cycles when the thread count vastly exceeds physical core count. In performance profiling, if substantial CPU time is spent on scheduling, lock waits, system calls, and context switches, adding more threads will only degrade performance further.

## Are Fibers, Coroutines, and Virtual Threads Considered Threads?

Fibers and coroutines typically run in user space and are scheduled by an application runtime. What the operating system actually dispatches are the underlying kernel threads hosting them, rather than individual fibers or coroutines. Consequently, switching between these lightweight execution units does not require trapping into the kernel, resulting in significantly lower latency.

However, they are not "free threads." If the runtime cannot transform blocking I/O into suspendable and resumable operations, a user-space task executing a blocking system call will stall the underlying host carrier thread, impacting all other coroutines sharing that carrier. Furthermore, context switch costs vary across programming languages, runtimes, CPU architectures, and call-stack depths; nanosecond figures from microbenchmarks should never be taken as universal constants.

Java 21's **Virtual Threads** (Project Loom) represent a prominent example. A virtual thread is still an instance of `java.lang.Thread`, but it does not permanently monopolize an operating system thread. During execution, a virtual thread is mounted onto a carrier platform thread, which corresponds directly to an OS kernel thread. When a virtual thread encounters JDK-supported blocking I/O, the JDK runtime unmounts the virtual thread, freeing the carrier thread to execute other virtual threads.

Thus, virtual threads are ideally suited for I/O-intensive workloads involving extensive waiting, such as high-concurrency web requests, database transactions, and microservice RPCs. They enhance concurrent capacity and throughput scalability—they do not magically make raw CPU calculations execute faster. Long-running CPU-bound tasks are still constrained by physical CPU cores, computational load, and scheduling overhead, and should not be dumped indiscriminately into virtual threads.

Relationship between virtual threads, platform threads, and OS kernel threads:

![Relationship between virtual threads, platform threads, and system kernel threads](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/virtual-threads-platform-threads-kernel-threads--57103066.png)

One critical consideration is **thread pinning**. In Java 21, when a virtual thread performs a blocking operation inside a `synchronized` block/method, a native method, or a foreign function call, it becomes pinned to its carrier thread and cannot be unmounted. Consequently, the carrier platform thread is held hostage and cannot execute other virtual threads. While rare, transient pinning does not cause functional errors, frequent or long-lasting pinning severely bottlenecks scalability. Subsequent JDK releases have optimized `synchronized`-related pinning, but developers must verify behavior against their specific JDK version. Native and foreign function boundaries continue to demand careful scrutiny.

## How Should You Summarize the Differences Between Processes and Threads?

In an interview, address this comparison across 5 dimensions: resources, scheduling, communication, overhead, and reliability.

| Dimension | Process | Thread |
| --- | --- | --- |
| Basic Role | Fundamental unit of resource allocation and isolation | Fundamental unit of CPU scheduling and execution |
| Address Space | Independent by default | Shared among threads within the same process |
| Private State | PID, address space, file descriptor table, etc. | Stack, registers, program counter, TLS, etc. |
| Communication | Requires IPC (pipes, sockets, shared memory) | Direct access to shared memory, requiring synchronization |
| Creation & Switching Cost | Substantially higher | Substantially lower |
| Failure Impact | Strong isolation; one process crashing rarely affects others | One thread crashing from an illegal memory access can bring down the entire process |

A well-structured summary can be articulated as follows:

> A process acts as a resource container during program execution, owning an independent virtual address space, file descriptors, and security credentials. A thread is an execution path within a process; multiple threads share the process's allocated resources while maintaining private stacks, registers, and program counters. Processes provide strong fault isolation at the expense of higher communication and context-switching overhead. Threads offer lightweight concurrency and effortless data sharing, but shared mutable state introduces concurrency hazards, and an unhandled crash in one thread can terminate the entire process.

## Common Misconceptions

**Misconception 1: Processes run in parallel, while threads run concurrently.**
Concurrency and parallelism describe execution timing relationships, not intrinsic properties of processes versus threads. On a single-core CPU, both processes and threads can only execute concurrently. On a multi-core CPU, multiple processes or multiple threads can execute in true hardware parallelism.

**Misconception 2: More threads always yield better performance.**
Threads are effective for masking I/O latency and taking advantage of multiple cores. However, an excessive number of threads consumes excessive stack memory, intensifies lock contention, invalidates CPU caches, and causes scheduler thrashing. CPU-bound workloads perform best when thread counts are kept close to physical CPU core counts; only I/O-bound tasks benefit from larger thread pools.

**Misconception 3: Processes cannot share memory under any circumstances.**
Default isolation does not imply an inability to share memory. Shared memory is an explicit IPC mechanism designed specifically to map the same physical memory pages into the virtual address spaces of multiple processes. Developers must manage synchronization and memory lifecycles explicitly.

**Misconception 4: Java virtual threads are operating system threads.**
Java platform threads are thin wrappers around operating system threads. Virtual threads are managed and scheduled entirely by the Java runtime, mounting dynamically onto carrier platform threads. While both implement `java.lang.Thread`, their underlying resource models and scheduling mechanisms are fundamentally different.
