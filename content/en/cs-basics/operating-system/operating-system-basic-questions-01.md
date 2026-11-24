---
title: Operating System Common Interview Questions Summary (Part 1)
description: Summary of the latest high-frequency operating system interview questions (Part 1), covering core topics including user mode vs. kernel mode, interrupts, exceptions, system calls, processes and threads, context switching, CPU scheduling algorithms, Linux CFS/EEVDF, system load, and deadlock.
category: CS Basics
tag:
  - Operating System
head:
  - - meta
    - name: keywords
      content: operating system interview questions, user mode vs kernel mode, interrupt, exception, system call, process vs thread, process states, PCB, TCB, fork, exec, wait, inter-process communication IPC, CPU scheduling algorithms, CFS, EEVDF, load average, context switch, deadlock necessary conditions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/operating-system-basic-questions-01.md
---

<!-- markdownlint-disable MD033 -->

Many readers complain that operating system concepts are numerous and intricate, and that they lack the patience to read through them all—yet these questions appear frequently in technical interviews. To help with this, I have compiled this structured guide to common operating system interview questions!

This article, *Operating System Common Interview Questions Summary (Part 1)*, starts with the fundamentals of operating systems, followed by an in-depth review of high-frequency interview topics: **user mode/kernel mode, system calls, processes and threads, inter-process communication (IPC), process scheduling, and deadlock**. It is designed both as a quick checklist for interview preparation and as a handy guide to fill knowledge gaps during review.

Learning operating systems is not just about memorizing theoretical interview questions. Concepts such as caching, scheduling, synchronization, memory mapping, zero-copy, and I/O multiplexing can be seen everywhere in Redis, Kafka, Nginx, Netty, JVM, and database engines. Once you understand the underlying operating system mechanisms, grasping upper-layer frameworks and diagnosing production performance bottlenecks will become significantly easier.

This article emphasizes a "quick interview lookup + conceptual interconnection" approach. For deeper exploration, we recommend reading standard textbooks alongside specialized topic articles. Portions of this text reference *Modern Operating Systems* (3rd Edition), for which we express our sincere gratitude.

## Operating System Basics

![Operating System Basics Mind Map](/media/jg/ext/oss.javaguide.cn/2020-8/image-20200807161118901-88f3b07c.png)

### What Is an Operating System?

What an operating system is can be summarized in four key points:

1. An Operating System (OS) is a program that manages computer hardware and software resources, serving as the cornerstone of computing systems.
2. Fundamentally, an operating system is a software program running on the computer, primarily designed to manage hardware and software resources. For example: all applications running on your machine allocate system memory and access storage disks through the operating system.
3. The presence of an operating system shields upper layers from hardware complexity. The OS acts like an administrator for hardware usage, coordinating all related activities.
4. The Kernel is the core component of an operating system. It is responsible for managing memory, hardware devices, file systems, and running applications. The kernel acts as a bridge connecting applications to the underlying hardware, dictating overall system performance and stability.

Many people easily confuse the operating system's Kernel with the Central Processing Unit (CPU). You can easily distinguish them via these two points:

1. The Kernel belongs to the software layer (operating system), whereas the CPU belongs to hardware.
2. The CPU primarily provides raw computation and instruction processing capabilities. The Kernel is mainly responsible for system management (such as memory management) and abstracts away low-level operations on hardware.

The diagram below clearly illustrates the relationship among applications, the kernel, and the CPU.

![Relationship between Applications, Kernel, and CPU](/media/jg/ext/oss.javaguide.cn/2020-8/Kernel_Layout-38e67253.png)

### What Are the Main Functions of an Operating System?

From the perspective of resource management, an operating system provides six primary functions:

1. **Process and Thread Management**: Creation, termination, blocking, and waking of processes, as well as inter-process communication.
2. **Memory Management**: Allocation and reclamation of memory, address translation, process isolation, page reclamation, and secondary storage space management.
3. **File Management**: Organizing underlying storage blocks into files and directories, handling file reads and writes, creation, deletion, access control, and crash recovery.
4. **Device Management**: Handling requests for and releases of devices (input/output devices and external storage devices), device initialization, and driver operations.
5. **Network Management**: Managing the utilization of computer networks. As networking connects disparate machines within a computing environment, the OS manages network configuration, connections, communication protocols, and security to provide efficient and reliable networking services.
6. **Security Management**: User authentication, access control lists, and file encryption to prevent unauthorized users from accessing or tampering with system resources.

Memory management and file systems are the two areas most frequently explored with follow-up interview questions; they are covered in depth in [Operating System Common Interview Questions Summary (Part 2)](./operating-system-basic-questions-02.md).

### What Are Common Operating Systems?

#### Windows

The most popular personal desktop operating system today. It needs little introduction: clean and easy-to-use GUI, with an exceptionally rich software ecosystem.

*For PC gaming, Windows remains essential. That is why I currently use a Windows machine for gaming and a Mac for daily software development and study.*

![Windows Desktop Operating System Interface](/media/jg/local/cs-basics/operating-system/images/windows-359ae2.png)

#### Unix

Unix was one of the earliest and most influential multi-user, multitasking operating systems; subsequent Unix-like systems such as Linux and BSD were heavily shaped by it. While traditional commercial Unix has seen its market share decline significantly, Unix standards, POSIX certification, and its architectural design philosophies remain widely used today.

![Unix Operating System Logo](/media/jg/local/cs-basics/operating-system/images/unix-044fe7.png)

#### Linux

**Linux is a free, open-source Unix-like operating system.** While numerous different distributions exist, they all share the **Linux Kernel**.

> Strictly speaking, the word "Linux" refers only to the Linux kernel. In a GNU/Linux system, Linux is the kernel, while the remainder of the system consists largely of utilities and programs developed and provided by the GNU Project. The Linux kernel alone cannot function as a standalone, usable operating system.
>
> **Many people prefer using the term "GNU/Linux" to refer to what is commonly called "Linux".**

![Linux Operating System Desktop and Command-Line Interface](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-95faaf8a.jpg)

#### Mac OS

Apple's proprietary operating system. Its software development experience matches Linux, while its user interface, software ecosystem, and overall user experience surpass typical Linux desktop distributions.

![macOS Desktop Operating System Interface](/media/jg/local/cs-basics/operating-system/images/macos-677c23.png)

### User Mode and Kernel Mode

#### What Are User Mode and Kernel Mode?

User mode and kernel mode describe the privilege levels of the CPU when executing code. Application code typically runs in user mode. When an application needs to access protected system resources, the CPU transitions into kernel mode through designated architectural entry points, allowing the kernel to execute operations on behalf of the current thread.

![User Mode and Kernel Mode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/usermode-and-kernelmode-7ac25c26.png)

- **User Mode**: Lower privilege level. Code cannot directly execute privileged instructions, nor can it freely access kernel address space or manipulate hardware peripherals. When an application reads files or sends network packets, it must request kernel services via system calls.
- **Kernel Mode**: Higher privilege level. Code can execute privileged operations such as managing page tables, handling interrupts, and accessing hardware devices. When entering the kernel via a system call, interrupt, or synchronous exception, the CPU runs kernel code; this does not mean the user process itself has transformed into a "kernel process."

Switching between user mode and kernel mode requires entering via architecturally mandated entry points, saving essential registers, and verifying privileges and parameters. It is therefore heavier than a regular user-space function call. However, a mode switch is not equivalent to a thread context switch: a thread context switch occurs only when the scheduler selects a different execution entity to run.

#### Why Are User Mode and Kernel Mode Needed? Wouldn't Kernel Mode Alone Suffice?

This privilege separation exists primarily for **security** and **system stability**.

- **Restricting Privileged Operations**: Actions such as modifying page tables, masking interrupts, and writing directly to device registers impact the entire operating system, and must be strictly confined to the kernel.
- **Fault and Privilege Isolation**: If all applications ran with kernel privileges, an out-of-bounds memory write or a malicious program could corrupt other processes and kernel data structures, completely undermining process isolation.

This privilege hierarchy confines regular applications inside a controlled environment, while hardware and critical system resources are centrally governed by the kernel.

#### How Are User Mode and Kernel Mode Switched?

![Three Ways to Switch from User Mode to Kernel Mode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/the-way-switch-between-user-mode-and-kernel-mode-59692e9a.png)

There are three primary categories of events that cause the CPU to transition from user mode to kernel mode:

1. **System Call (Trap)**: An application actively executes instructions such as `syscall` or `ecall` to request kernel services (e.g., `read()`, `send()`). Triggered directly by the current instruction, this is a synchronous event.
2. **Hardware Interrupt (Interrupt)**: Triggered by external hardware devices such as timers, network cards, or storage controllers. It has no direct relationship to the currently executing instruction, making it an asynchronous event.
3. **Synchronous Exception (Exception)**: Triggered directly by the current instruction during execution, such as division by zero, invalid instructions, or a Page Fault. An exception does not necessarily indicate a software crash: lazy allocation, Copy-On-Write (COW), and demand paging from files also trigger recoverable page faults.

Interrupts, exceptions, and system calls explain *why* the CPU enters the kernel. Signals, on the other hand, are a software mechanism through which the kernel notifies a process or thread. An illegal memory access may first trigger a Page Fault; after the kernel determines it cannot be fixed, it delivers a `SIGSEGV` signal to the offending thread.

While the low-level hardware entry details differ across CPU architectures, all of them jump to corresponding kernel entry handlers based on the event type. For a complete conceptual comparison and execution path breakdown, see: [Detailed Explanation of Interrupts, Exceptions, and System Calls: From Kernel Entry to Page Faults](./interrupt-exception-syscall.md).

### System Calls

#### What Is a System Call?

A system call is a controlled service interface provided by the kernel to user-space applications. Because applications cannot directly operate on protected resources like disks, page tables, and network cards, they must issue system calls to let the kernel act on their behalf.

![User Programs Requesting Kernel Services via System Calls](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/system-call-e64b6ca1.png)

System calls can be categorized broadly by functionality into:

- Device Management: Requesting or releasing devices (input/output and external storage devices), device initialization, etc.
- File Management: Reading, writing, creating, and deleting files.
- Process Management: Creating, terminating, blocking, and waking processes, as well as inter-process communication.
- Memory Management: Allocating and freeing memory, querying memory segment sizes and addresses.
- Network Communication: Creating sockets, establishing connections, sending and receiving data.

System calls and standard library functions operate at different layers. Regular function calls execute entirely in user space. Wrapper functions provided by runtime libraries like glibc (e.g., `read()`) set up the system call number and arguments according to the ABI, and then execute special CPU instructions to enter the kernel. Many library functions do not require system calls at all.

#### Do You Understand the Process of a System Call?

Taking `read(fd, buf, count)` on Linux x86-64 as an example, the system call execution flow can be summarized as follows:

1. The glibc wrapper function follows the calling convention, placing the system call number and arguments into designated CPU registers, and executes the `syscall` instruction.
2. The CPU switches to kernel privilege level and jumps to the architectural kernel entry. The kernel entry routine saves the registers needed for later resumption, and dispatches to the corresponding `read` handler based on the system call number.
3. The kernel validates the file descriptor, user buffer pointer, permissions, and file state, and then proceeds into the VFS, file system, network stack, or device driver layer.
4. If the requested data is already available, the kernel completes the read and returns the result; if data is not yet ready, the current thread may transition into a waiting state, allowing the scheduler to run other runnable tasks.
5. Once the call finishes, the return value is passed back to user mode via registers. On error, glibc typically converts the kernel error code into `-1` and sets `errno`.

![System Call Execution Procedure](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/system-call-procedure-4f5c448a.png)

#### Does a System Call Always Cause a Context Switch?

A system call causes the CPU to enter kernel mode. If the kernel processes the request quickly and returns immediately to the original thread, the entire sequence involves only a user-mode/kernel-mode switch, without switching threads.

Only when the system call must wait for I/O, a lock, or other unavailable resources does the current thread block. The scheduler then selects another runnable task, triggering a thread context switch. Conversely, when a timer interrupt enters the kernel, if the scheduler decides to let the current thread continue running, no thread context switch occurs.

For a deeper dive into the `read()` call chain, signal interruptions, and system call restarts, see: [Detailed Explanation of Interrupts, Exceptions, and System Calls: From Kernel Entry to Page Faults](./interrupt-exception-syscall.md).

## Processes and Threads

Processes and threads are unavoidable core concepts in operating system interviews. Below are concise answers to high-frequency interview questions. For comprehensive study, read these detailed articles:

- [Detailed Explanation of Processes and Threads: Differences, States, Communication, Context Switching, and Virtual Threads](./process-and-thread.md), path: `./process-and-thread.md`
- [Detailed Explanation of Inter-Process Communication (IPC): Pipes, Message Queues, Shared Memory, Sockets, and Binder](./ipc.md), path: `./ipc.md`
- [Detailed Explanation of CPU Scheduling and System Load](./cpu-scheduling-and-load.md), path: `./cpu-scheduling-and-load.md`

### What Is the Difference Between a Process and a Thread?

Processes and threads are the two core concepts of concurrent execution in operating systems. Their relationship can be intuitively understood through the analogy of a **factory and workers**.

![Relationship between Program, Process, and Thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/relationship-between-program-process-and-thread-97be3e79.png)

**A Process is like a factory**. The operating system allocates resources using the process as the fundamental unit. For instance, when I launch WeChat, the operating system establishes an independent factory for it, assigning dedicated memory space, file handles, and other resources. This factory is strictly isolated from other factories (such as my web browser process).

**A Thread is like a worker inside the factory**. A factory can have many workers. They share the resources within the factory, but each worker has their own toolbox and task list, enabling them to execute different tasks independently. For example, inside the WeChat factory, one worker (thread) can be responsible for receiving messages while another handles rendering the UI.

Here is an illustrative graphic generated with AI that visualizes this distinction clearly:

![Analogy of WeChat Factory Comparing Processes and Threads](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/wechat-factory-process-thread-b3457524.png)

The diagram below shows the Java memory areas—let us examine the relationship between threads and processes from a JVM perspective!

![Java Runtime Data Areas (JDK 1.8 and Later)](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/java-runtime-data-areas-jdk1.8-6401fdf0.png)

As seen above: a process can contain multiple threads. These threads share the process's **Heap** and **Method Area (Metaspace in JDK 1.8+)**, but each thread has its own private **Program Counter**, **JVM Stack**, and **Native Method Stack**.

![Shared and Private Contents of Threads](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/thread-shared-and-private-content-c8d5ff09.png)

The differences can be summarized across five dimensions: resources, scheduling, communication, overhead, and reliability:

| Dimension | Process | Thread |
| --- | --- | --- |
| Basic Role | Fundamental unit of resource allocation and isolation | Fundamental unit of CPU scheduling and execution |
| Address Space | Has its own independent virtual address space by default | Threads within the same process share the process's address space |
| Private Content | Process-level resources like PID, address space, open file table, security credentials | Execution context like thread ID, stack, registers, Program Counter, Thread-Local Storage |
| Communication | Requires IPC (e.g., pipes, message queues, shared memory, sockets) | Can directly read/write shared memory, but requires synchronization and thread safety handling |
| Creation / Switch Cost | Higher; switching processes may involve page table switches, TLB invalidation, etc. | Lower; switching threads within the same process does not require switching the entire address space |
| Failure Impact | Better isolation; a crash in one process typically does not affect other processes | An unhandled exception or crash in one thread can terminate the entire process |

A well-rounded interview response can be structured like this:

> A process is a runtime container for resources, possessing an independent virtual address space, file descriptors, and credentials. A thread is an execution flow within a process; multiple threads share process resources while each maintaining its own execution context such as stack, registers, and program counter. Processes have stronger isolation at the expense of higher communication and switching costs; threads coordinate more easily with lighter creation and switching costs, but shared memory introduces thread safety challenges.

### Why Are Threads Needed When Processes Already Exist?

The core motivation is **to achieve low-overhead, high-efficiency concurrency within a single application**.

If a server application needs to handle network I/O, business computation, and log flushing simultaneously, multiple processes could technically be used. However, sharing state across processes is cumbersome, communication requires IPC, and resource footprints are high. With multithreading, threads directly share heap memory and open connections; as long as synchronization is implemented correctly, coordination overhead is significantly lower.

Threads also improve hardware resource utilization. On a single-core CPU, when one thread blocks on disk or network I/O, other threads can continue running. On a multi-core CPU, multiple threads can execute in parallel across different cores. However, more threads are not always better. Excessive threads cause excessive stack memory consumption, scheduling overhead, lock contention, and cache invalidation. Thread pool sizing must be tailored differently for CPU-bound versus I/O-bound workloads.

### Does Multithreading Always Improve Performance?

Whether multithreading accelerates performance depends on the workload characteristics, available CPU cores, and contention over shared resources:

- **I/O-Bound Tasks**: While one thread waits on disk, network, or lock acquisition, other runnable threads can utilize the CPU, effectively overlapping computation with waiting time.
- **CPU-Bound Tasks**: Computations that can be partitioned independently can run in parallel across multiple CPU cores. However, speedup is bounded by serial bottlenecks (Amdahl's Law), data dependencies, CPU cache thrashing, and scheduling overhead.
- **Excessive Threads**: When runnable threads vastly outnumber physical CPU cores, the run queue lengthens, leading to elevated context switching, cache invalidation, and severe lock contention, degrading both throughput and latency.

Thread counts should be determined based on task characteristics, CPU quota, blocking ratios, and stress testing, rather than naively mapping to physical core counts or incoming request volume.

### What Are the Synchronization Mechanisms Between Threads?

Thread synchronization coordinates the concurrent execution of two or more threads accessing shared critical resources, preventing conflicting resource access.

Common thread synchronization primitives include:

1. **Mutex (Mutual Exclusion Lock)**: Uses an exclusive ownership mechanism where only the thread holding the mutex has permission to access the shared resource. Because there is only one mutex object, simultaneous access is prevented. For example, Java's `synchronized` keyword and various `Lock` implementations adopt this mechanism.
2. **Read-Write Lock**: Allows multiple threads to concurrently read shared resources, but permits only a single thread to perform write operations at any time.
3. **Semaphore**: Permits multiple threads to access a resource concurrently up to a specified maximum capacity.
4. **Barrier**: A synchronization primitive where threads wait until all participating threads reach a synchronization point before proceeding together. When a thread arrives at the barrier, it stops and waits; once all threads have arrived, they are released simultaneously. Java's `CyclicBarrier` is an example.
5. **Condition Variable / Event Notification**: Threads wait when a condition is not met, and other threads notify them when the condition changes. This is typically paired with a mutex to avoid lost wake-up bugs (where a signal occurs before waiting begins). Java's `Object.wait()/notify()` and `Condition.await()/signal()` follow this pattern; Windows Event objects are another implementation of event-notification primitives.

### What Is a PCB? What Information Does It Contain?

A **PCB (Process Control Block)** is a data structure used by the operating system to manage and track a process. Every process has a unique, dedicated PCB. You can think of the PCB as the process's brain or identity dossier.

When the OS creates a new process, it assigns a unique Process ID (PID) and allocates a corresponding PCB. As the process executes, information in its PCB is updated continuously, allowing the OS to manage and schedule it.

A PCB typically includes:

- **Identification Information**: PID, Parent PID (PPID), User ID (UID), etc.
- **Process State and Scheduling Information**: Ready, running, blocked, priority, time slice, accumulated CPU runtime statistics, etc.
- **CPU Context**: Program counter, stack pointer, general-purpose registers, Program Status Word (PSW), etc., used to restore execution after context switching.
- **Memory Management Information**: Virtual address space bounds, page table base pointers, memory mappings, etc.
- **Resource Information**: Open file descriptors, I/O device status, current working directory, signal handling tables, etc.
- ...

During a context switch, the OS saves the current process's register states into its PCB, and loads the saved state from the next process's PCB so it can resume execution seamlessly from where it paused.

### What Is a TCB? What Is Its Relationship with a PCB?

A **TCB (Thread Control Block)** saves thread-level control information, including thread ID, thread state, register context, stack pointers, scheduling priority, and thread-local storage pointers.

In many textbooks and traditional OS architectures, PCB and TCB are separated: the PCB handles process-level resource boundaries, while the TCB manages thread-level execution context. Linux takes a unique approach: it treats both processes and threads as tasks, representing each schedulable entity with `task_struct`, and distinguishes threads from processes by whether resource structures (address space, file tables) are shared via `clone()`. When studying, do not get caught up in naming; simply understand the boundary: **address spaces and file tables belong to resource containers; stacks, registers, and program counters belong to execution contexts**.

### What Are the States of a Process?

Processes are generally categorized into five primary states, very similar to threads:

- **New**: The process is being created and has not yet entered the ready queue.
- **Ready**: The process is prepared to run, possessing all necessary resources except the CPU. Once assigned a CPU time slice, it can run immediately.
- **Running**: The process is currently executing on a CPU core (on a single-core CPU, at most one process is running at any instant).
- **Waiting / Blocked**: The process is paused, waiting for an event to occur (e.g., waiting for I/O completion or lock availability). Even if the CPU becomes idle, the process cannot run.
- **Terminated**: The process has finished executing or was aborted, and is being cleaned up by the operating system.

![Process State Transition Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/state-transition-of-process-d4bbabcd.png)

Focus on the transition triggers: Ready enters Running upon being scheduled; Running may return to Ready when its time slice expires; Running enters Blocked when issuing blocking I/O, acquiring a contested lock, or awaiting an event; once the awaited event completes, the process transitions to Ready, waiting to be scheduled again.

Some textbooks also include a **Suspended** state. Suspension emphasizes that the process has been swapped out of physical memory or paused by the user/system, whereas Blocking means the process is waiting on an event. They are orthogonal concepts: a process can be blocked while resident in memory, or swapped out to disk in a blocked-suspended state.

### What Are the Inter-Process Communication (IPC) Mechanisms?

Because processes have independent virtual address spaces by default and cannot directly access each other's user-space memory, they rely on **IPC (Inter-Process Communication)**.

For interview purposes, organize your answer by practical use case:

- Small byte streams between parent and child processes: Anonymous pipes.
- Local communication between unrelated processes: Named pipes (FIFO), Unix Domain Sockets.
- Small structured messages: Message queues.
- High-throughput local data exchange: Shared memory, paired with synchronization mechanisms like semaphores, mutexes, `futex`, or `eventfd`.
- Asynchronous event notification: Signals.
- Cross-machine communication: TCP/UDP Sockets or higher-level RPC frameworks.

For a systematic breakdown, boundary analysis, and selection guide, see: [Detailed Explanation of Inter-Process Communication (IPC): Pipes, Message Queues, Shared Memory, Sockets, and Binder](./ipc.md), path: `./ipc.md`.

### What Do fork, exec, and wait Do?

In Unix/Linux programming, process creation and program execution revolve around `fork()`, `exec()`, and `wait()`. Below is a concise summary; for details on file descriptor inheritance, copy-on-write, and multi-threaded `fork`, see: [Detailed Explanation of Processes and Threads](./process-and-thread.md), path: `./process-and-thread.md`.

![Call Chain of fork, exec, and wait](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/fork-exec-wait-call-chain-4d2918b1.png)

- **`fork()`**: Creates a child process. Both parent and child resume execution from the same instruction, distinguished by different return values.
- **`exec()`**: Loads and executes a new program within the current process. It does not create a new process; rather, it replaces the current process's user-space code and data segments.
- **`wait()` / `waitpid()`**: Waits for a child process's state to change and reaps the termination status information retained in the kernel.

When a shell runs an external command, the typical sequence is: the shell calls `fork()` to create a child process, the child calls `exec()` to load the target program, and the parent shell calls `wait()` or `waitpid()` to wait for and reap its exit status. If a parent process never reaps terminated child processes, zombie processes accumulate.

### What Is a Context Switch?

A context switch refers to the CPU switching from one execution entity to another. The operating system must save the current entity's registers, program counter, and stack pointer, and restore the execution context of the next entity.

![Cost Comparison between Thread Context Switch and Process Context Switch](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/context-switch-cost-comparison-63e31c11.png)

Both thread switching and process switching incur overhead, but process switching is substantially more expensive. A process has an independent address space, meaning a switch can involve updating page table base registers, flushing or invalidating the TLB, and degrading CPU cache locality. Threads within the same process share an address space, so switching between them generally avoids switching memory mappings.

In simple terms: switching threads within the same process switches only thread-private execution context (stack, registers, PC); switching across processes switches both execution context and virtual address space, incurring severe TLB and cache penalties. In production performance tuning, if excessive CPU time is consumed by scheduling, lock contention, system calls, and context switches, blindly adding more threads will only exacerbate the issue.

Also distinguish a **context switch** from a **user-mode/kernel-mode switch**. System calls, page faults, and hardware interrupts transition into kernel mode; if the kernel finishes handling the event and returns directly to the original thread, no thread context switch has occurred.

### What Are Process Scheduling Algorithms?

![Common Process Scheduling Algorithms](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/scheduling-algorithms-of-process-f1a8c27a.png)

Process scheduling algorithms in textbooks address the question: when runnable tasks outnumber available CPU cores, who runs first? Schedulers strike trade-offs among **throughput, turnaround time, response time, fairness**, and context switching overhead.

These algorithms fall into two broad categories: **Non-Preemptive** and **Preemptive**.

**Category 1: Non-Preemptive Scheduling**

Once CPU time is allocated to a process, it runs continuously until it finishes or voluntarily relinquishes the CPU (e.g., waiting for I/O).

1. **First-Come, First-Served (FCFS)**: Executes tasks in arrival order. Simple to implement, but when long tasks arrive early, subsequent short tasks experience long waits—known as the convoy effect.
2. **Shortest Job First (SJF)**: Prioritizes tasks with the shortest estimated execution time, minimizing average waiting time. However, predicting job duration in practice is difficult, and long jobs may suffer starvation.

**Category 2: Preemptive Scheduling**

The operating system can interrupt the currently running task to reassign the CPU to a more suitable runnable task. Modern general-purpose operating systems almost universally support preemption.

- **Round-Robin (RR)**: Each task executes in turn for a designated time slice. If the time slice is too short, context-switching overhead escalates; if too long, it degrades into FCFS.
- **Priority Scheduling**: Prioritizes higher-priority tasks to reflect urgency, but requires aging mechanisms to prevent lower-priority starvation.

**Multi-Level Feedback Queue (MLFQ)** establishes multiple priority queues and dynamically adjusts a task's queue position based on observed execution behavior. New tasks usually start in high-priority queues; CPU-bound tasks that repeatedly exhaust their full time slices are gradually demoted, whereas interactive tasks that yield frequently for I/O retain high priority. Specific promotion, demotion, and starvation-prevention rules depend on implementation details.

FCFS, SJF, RR, Priority, and MLFQ are simplified textbook models. Modern Linux schedules tasks or schedulable entities: standard tasks were traditionally scheduled by CFS using task weights and `vruntime`; starting in Linux 6.6, EEVDF was introduced into the fair scheduling class, using lag and virtual deadlines to optimize task selection. Which implementation is active depends on your kernel version and distribution patches.

Detailed guide: [Detailed Explanation of CPU Scheduling and System Load](./cpu-scheduling-and-load.md).

### Who Actually Schedules the Process?

The component responsible for scheduling is the **Scheduler** inside the operating system kernel. The kernel may trigger scheduling when a task blocks, voluntarily yields the CPU, exhausts its time slice or runtime allocation, has its priority modified, or when a higher-priority task wakes up.

Textbooks often introduce the **Dispatcher** to describe applying the scheduling decision to the CPU:

- The Scheduler selects the next task from the runnable queue.
- The Dispatcher performs the actual context switch:
  - Saves the current process's context (CPU registers, program counter, etc.) into its PCB.
  - Loads the selected process's context from its PCB back into CPU registers.
  - Formally transfers CPU control to the new process, resuming its execution.

Modern Linux kernels do not strictly divide these into two independent components; for interviews, understanding the dual responsibilities of "selecting the next task" and "performing the context switch" is sufficient.

### What Is the Difference Between Load Average and CPU Utilization?

Load average reflects the average number of runnable tasks (R state) and uninterruptible sleeping tasks (D state) in the system over a given time interval. CPU utilization describes the percentage of CPU time spent across user mode, kernel mode, I/O wait, hardware/software interrupts, idle time, or virtualization steal.

A high load average can stem from runnable tasks competing for CPU cycles, or from numerous tasks stuck waiting on block devices, network storage, file system operations, or Swap; in the latter scenario, the CPU may remain mostly idle. Interpreting load average requires factoring in the number of logical CPU cores: a load of 8 imposes drastically different pressure on 1 logical core versus 64 logical cores.

When troubleshooting, check 1-, 5-, and 15-minute load trends with `uptime`, and combine findings with `top`, `vmstat 1`, `pidstat`, and `mpstat` to determine whether tasks are competing for CPU cycles, stalling on I/O, or incurring excessive context switches. For full metric definitions and diagnostics, see: [Detailed Explanation of CPU Scheduling and System Load](./cpu-scheduling-and-load.md).

## Deadlock

### What Is Deadlock?

Deadlock describes a state in which a set of processes or threads are blocked because each is waiting for a resource or action that can only be released or satisfied by another participant in the set. Because the waiting relationships form a closed circular chain, none of the participants can ever resume execution on their own.

Specifically, deadlock is more than just "waiting for a long time." Normal blocking unblocks once a lock is released, an I/O operation returns, or a transaction commits; in a deadlock, the dependency chain forms a closed loop, and without external intervention, the cycle will never break.

For in-depth analysis on deadlock formation, Java thread deadlock diagnostics, and database deadlock resolution, refer to: [Detailed Explanation of Deadlock: Four Necessary Conditions, Java Deadlock Diagnostics, and Database Deadlock Handling](./dead-lock.md).

The classic example is **cross-holding locks**. Imagine two threads and two locks:

- Thread 1 acquires Lock A, then attempts to acquire Lock B.
- Almost simultaneously, Thread 2 acquires Lock B, then attempts to acquire Lock A.

Thread 1 waits for Thread 2 to release Lock B, while Thread 2 waits for Thread 1 to release Lock A. Both hold what the other needs while waiting for what the other holds, creating a circular wait loop.

![Deadlock Scenario Illustration: Thread A holds resource1 and waits for resource2, Thread B holds resource2 and waits for resource1, forming a closed dependency loop](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-scenario-13be7e13.png)

### What Are the Four Necessary Conditions for Deadlock?

Deadlock does not occur randomly; it requires all **four necessary conditions** to hold concurrently:

1. **Mutual Exclusion**: Resources must be held in a non-shareable mode; only one process can use the resource at any given time. If another process requests it, that process must wait until it is released.
2. **Hold and Wait**: A process must hold at least one resource while concurrently waiting to acquire another resource currently held by another process.
3. **No Preemption**: Resources cannot be forcibly preempted. A resource can only be released voluntarily by the process holding it after that process has completed its task.
4. **Circular Wait**: A closed chain of waiting processes `{P0, P1, ..., Pn}` must exist such that `P0` waits for a resource held by `P1`, `P1` waits for a resource held by `P2`, ..., and `Pn` waits for a resource held by `P0`.

![Four Necessary Conditions for Deadlock: Mutual exclusion, hold and wait, no preemption, and circular wait must all hold simultaneously to produce deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-four-conditions-79f8adec.png)

**Note**: These four conditions are necessary conditions—all must be satisfied simultaneously for a deadlock to occur. Satisfying only one or two conditions will not create a deadlock; conversely, reliably breaking any single condition fundamentally prevents deadlocks from forming.

### Can You Write Code That Simulates Deadlock?

Here is a concrete Java example reproducing the cross-holding locks scenario:

```java
public class DeadLockDemo {
    private static final Object resource1 = new Object(); // Resource 1
    private static final Object resource2 = new Object(); // Resource 2

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "Thread 1").start();

        new Thread(() -> {
            synchronized (resource2) {
                System.out.println(Thread.currentThread() + "get resource2");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println(Thread.currentThread() + "waiting get resource1");
                synchronized (resource1) {
                    System.out.println(Thread.currentThread() + "get resource1");
                }
            }
        }, "Thread 2").start();
    }
}
```

Output:

```text
Thread[Thread 1,5,main]get resource1
Thread[Thread 2,5,main]get resource2
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 2,5,main]waiting get resource1
```

Thread 1 acquires the monitor lock on `resource1` via `synchronized (resource1)`, while Thread 2 acquires the monitor lock on `resource2` via `synchronized (resource2)`. `Thread.sleep(1000)` is not the root cause of the deadlock; it merely widens the interleaved execution window so the deadlock reproduces reliably. When sleep completes, both threads request the resource held by the other, entering a mutual deadlock state.

### Methods to Resolve Deadlock

In interviews, your answer should cover the four classic strategies: **Prevention, Avoidance, Detection, and Recovery**.

- **Prevention**: Preemptively eliminate one of the four necessary conditions. Common engineering practices include enforcing a strict global lock acquisition ordering, reducing lock scope, and never holding locks during slow external operations.
- **Avoidance**: Dynamically evaluate whether granting a resource request leaves the system in a safe state before allocation, with the Banker's Algorithm being the classic example. This approach is largely academic; general-purpose business applications rarely implement it directly.
- **Detection**: Allow resource contention and waiting to occur, then periodically inspect the Wait-For Graph (WFG) or Resource Allocation Graph (RAG) for cycles. In Java, tools like `jcmd <pid> Thread.print -l`, `jstack -l <pid>`, or `ThreadMXBean.findDeadlockedThreads()` assist in diagnostics; database engines also continuously detect transaction wait cycles.
- **Recovery**: Break detected circular waits by terminating processes, rolling back transactions, preempting resources, or initiating application-level retries. Database engines natively support rollbacks, making detection and recovery particularly suitable for database transactions.

![Deadlock Handling Strategies Diagram: Positions and common engineering adoption of prevention, avoidance, detection, and recovery](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-strategies-b7623bee.png)

Keep the interview response focused on the architectural hierarchy. For further details on resource allocation graphs, wait-for graphs, Java thread stack analysis, and database deadlock retries, see: [Detailed Explanation of Deadlock: Four Necessary Conditions, Java Deadlock Diagnostics, and Database Deadlock Handling](./dead-lock.md).

## References

- *Computer Operating Systems* (Tang Xiaodan, 4th Edition)
- *Computer Systems: A Programmer's Perspective* (CS:APP)
- *Relearning Operating Systems*
- Why Operating Systems Separate User Mode and Kernel Mode: <https://blog.csdn.net/chen134225/article/details/81783980>
- Fundamental Understanding of User Mode and Kernel Mode: <https://juejin.cn/post/6923863670132850701>
- What Are Zombie and Orphan Processes: <https://blog.csdn.net/a745233700/article/details/120715371>
