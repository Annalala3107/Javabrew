---
title: "Operating System Locks and Synchronization Mechanisms: Mutex, Semaphore, Condition Variable, Spinlock, and Futex"
description: "High-frequency interview questions summary on operating system locks and synchronization mechanisms, explaining critical sections, mutex, spinlock, semaphore, condition variable, futex, atomic instructions, memory ordering, priority inversion, and the differences between user-space and Linux kernel locks."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Linux
  - Concurrent Programming
head:
  - - meta
    - name: keywords
      content: Operating System Locks,Synchronization Mechanisms,Critical Section,Mutex,Spinlock,Semaphore,Condition Variable,futex,Atomic Instructions,Memory Barrier,Priority Inversion,Linux Kernel Locks,OS Interview Questions,Concurrent Programming
lang: en
sourceRef: zh-ref/cs-basics/operating-system/os-lock-and-sync.md
---

Two threads incrementing the same counter concurrently seems like a trivial operation, yet the final count can easily end up short by one or more increments.

The reason is simple: `count++` is a single line in source code, but at the hardware level it typically decomposes into three separate steps: read, calculate, and write back. Thread A reads the old value and before it writes back, Thread B reads the exact same old value. Both compute the new value independently, and both write back identical results, overwriting each other.

To prevent such concurrency bugs, operating systems provide locks and a comprehensive suite of synchronization mechanisms. The problems they solve extend beyond whether a code section can execute concurrently—they govern whether threads should block, how resource capacity is controlled, and how threads wait when specific conditions are not yet met. Down in the kernel, synchronization must further account for hardware interrupts, preemption, multi-core processors, real-time constraints, and scheduling latency.

This article examines synchronization mechanisms strictly from the operating system perspective. Java's `synchronized`, `ReentrantLock`, AQS, CAS, and JVM lock optimizations have already been thoroughly covered in [Java Locks Explained](../../java/concurrent/java-lock.md) and will not be repeated here. This article focuses on what distinct problems primitives like mutex, semaphore, condition variable, spinlock, and futex solve. Once you master these synchronization primitives, reading [Deep Dive into Deadlock](./dead-lock.md) makes it much easier to understand why "wait relationships form cycles."

Here is a high-level overview of the problems solved by these synchronization mechanisms:

| Mechanism | Primary Problem Solved | Waiting Method | Common Scenarios |
| --- | --- | --- | --- |
| mutex | Mutual exclusion in critical sections | Semantically waits for lock availability; spin or sleep in implementation | Protecting shared data structures |
| spinlock | Mutual exclusion in ultra-short critical sections | Busy-waiting (spinning) | Kernel execution paths where sleeping is prohibited |
| semaphore | Resource counting, concurrency throttling | Blocks when counter reaches 0 | Buffer slots, connection pools, concurrent task limits |
| condition variable | Waiting for a shared condition to become true | Atomically releases mutex and waits | Queue non-empty, task completion, buffer non-full |
| futex | Foundation for user-space blocking and waking | Fast path in user space, slow path in kernel | pthread mutex, language runtime synchronizers |
| memory barrier | Enforces memory access ordering and visibility | Typically does not block threads | Lock-free structures, kernel synchronization, device register MMIO |

## What Does a Critical Section Actually Protect?

A **critical section** is a segment of code that accesses shared mutable state and cannot be interleaved arbitrarily by multiple execution streams. It might be a simple counter increment in a user-space application, or kernel code updating runqueues, file descriptor tables, page tables, or hardware device states.

![Critical section protection access protocol: Multiple threads access shared state through a unified lock entry; bypassing the lock or switching lock targets breaks mutual exclusion](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-critical-section-67226b1b.png)

When evaluating any lock or synchronization mechanism, analyze it across 4 dimensions: correctness, progress, fairness, and performance.

1. **Correctness**: Multiple execution streams must never arbitrarily interleave updates to shared state. In multi-CPU environments, proper memory synchronization semantics must ensure that modifications written by a thread before releasing a lock are visibly and predictably observed by subsequent threads acquiring that lock.
2. **Progress**: The synchronization mechanism itself must not dead-end all waiting entities, causing the system to freeze indefinitely.
3. **Fairness**: When multiple threads contend for the same lock, starvation should be prevented so that no thread is starved indefinitely. Production systems may not enforce strict FIFO ordering, but starvation must be mitigated.
4. **Performance**: In the absence of contention, lock acquisition and release should have negligible overhead. Under heavy contention, waiting threads must not excessively waste CPU cycles in futile spin loops.

OSTEP (Operating Systems: Three Easy Pieces) highlights these same concerns: Does the lock guarantee mutual exclusion? Can waiting threads starve? What is the overhead in uncontended cases? How does performance scale between single-core and multi-core systems? Asking "which lock is fastest" in isolation is meaningless: for the same lock, answers change dramatically across hardware architectures, critical section durations, and contention levels.

## Mutex: Close the Door Before Modifying Shared State

Returning to the `count++` example: if this increment must be computed correctly, the most straightforward approach is wrapping the read-modify-write sequence inside a **mutual exclusion lock (mutex)**. Whichever thread acquires the lock enters the critical section; any thread that fails to acquire the lock waits outside the door.

In POSIX threads (pthreads), this is written as:

```c
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
int count = 0;

void increase(void) {
    pthread_mutex_lock(&mutex);
    count++;
    pthread_mutex_unlock(&mutex);
}
```

In this code, `pthread_mutex_lock()` does more than flip a flag. From a POSIX semantic standpoint, if the lock is held by another thread, the calling thread blocks until the lock becomes available, returning only once it owns the lock.

Concrete implementations can be adaptive. Many pthread mutexes or language runtime locks first spin briefly in user space; if contention persists, they transition to a blocking path such as a futex call. As a developer, focus on the semantics: you cannot enter the critical section until you acquire the lock, and only after acquiring it do you possess authorized access to the protected state.

A mutex is ideal for guarding well-defined state mutations: updating reference counts, modifying linked-list pointers, updating process tables, or refreshing an in-memory cache segment. When writing such code, first clarify which piece of state the lock protects and verify that every code path accessing that state adheres strictly to the same locking protocol.

A common anti-pattern: an object has 5 access paths. Four paths diligently acquire the mutex, but the fifth path modifies the field directly "for convenience." That single shortcut bypasses mutual exclusion entirely, invalidating the diligence of the other four paths. Locks protect an access protocol; merely placing a variable near a lock does nothing on its own.

Another key semantic detail: a mutex carries **ownership semantics**. The thread that acquires the lock must be the thread that unlocks it. The Linux kernel locking documentation explicitly highlights owner semantics—most locks require the acquiring context to release them. A semaphore is fundamentally different: it operates as a counter, a distinction that becomes clear when we discuss semaphores next.

## Spinlock: Don't Sleep, Spin on the CPU for a Moment

When a thread cannot acquire a mutex, it can sleep, allowing the kernel to wake it up later. A **spin lock (spinlock)** does the opposite: instead of putting the thread to sleep, it busy-waits in a tight loop on the CPU, continually polling whether the lock has been released.

This might sound inefficient, but its efficacy depends entirely on the expected wait duration.

![Comparison of waiting mechanisms between mutex and spinlock: Mutex sleeps in blockable paths; spinlock busy-waits briefly in non-sleepable short paths](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-mutex-spinlock-54933375.png)

If a lock protects only a few instructions, the thread currently holding the lock will exit the critical section almost immediately. Putting the waiting thread to sleep would be counterproductive: sleeping and waking require scheduler intervention and context switches. On multi-core systems, the lock holder is likely running on an adjacent CPU core and will release the lock within a handful of clock cycles. In this scenario, spinning for a few cycles incurs far less latency and overhead than a full context switch.

However, spinlocks impose two strict constraints:

1. **The critical section must be ultra-short.** If the lock holder accesses disk I/O, waits for network packets, or allocates memory that could trigger page reclamation/sleep, waiting threads will incinerate CPU cycles spinning fruitlessly.
2. **Be cautious in single-CPU or preemptible scenarios.** If the lock-holding thread is preempted and the waiting thread spins on that same single CPU core, the waiting thread can spin forever without the lock holder ever getting CPU time to release the lock.

In a non-PREEMPT_RT Linux kernel, acquiring a standard `spinlock_t` implicitly disables kernel preemption on the local CPU. If you also need to prevent local hardware interrupt handlers from interrupting the critical section on the current core, you must use variants like `spin_lock_irq()` or `spin_lock_irqsave()`. In other words, a plain `spin_lock()` does NOT automatically disable hardware interrupts.

Linux kernel documentation categorizes locks into sleeping locks, CPU-local locks, and spinning locks. `mutex`, `semaphore`, and `rw_semaphore` are sleeping locks. `raw_spinlock_t` remains a strict spinlock across both standard and PREEMPT_RT kernels. The semantics of `spinlock_t`, however, change under PREEMPT_RT: on non-PREEMPT_RT kernels, it maps directly to `raw_spinlock_t`; under PREEMPT_RT, it is implemented on top of `rt_mutex`, no longer implicitly disables preemption, and the `_irq` / `_irqsave` suffixes no longer directly toggle hardware interrupt states.

Application-level user-space business code should virtually never hand-roll spinlocks. Libraries and runtimes can employ adaptive spinning on ultra-short execution paths, but writing a manual `while` spin loop in business logic usually succeeds only in turning your CPU into a space heater.

## Semaphore: More Than Just a Binary 0 and 1 Lock

A **semaphore** is conceptually an integer counter that never drops below zero. `sem_wait()` decrements the counter: if the current value is greater than 0, it decrements and continues; if the current value is 0, the calling thread blocks. `sem_post()` increments the counter and wakes up waiting threads if any exist.

When initialized to 1, a semaphore can mimic a mutex:

```c
sem_t sem;

sem_init(&sem, 0, 1);

sem_wait(&sem);
// critical section
sem_post(&sem);
```

However, the primary intended use case for semaphores is **resource counting and capacity throttling**—for example, tracking N empty slots in a bounded buffer, restricting a connection pool to at most N active connections, or capping concurrent worker jobs at N. In these cases, the initial semaphore value represents the total quantity of available resources.

While a binary semaphore can emulate mutual exclusion, it is NOT identical to a mutex. A mutex enforces ownership and critical section boundaries; a semaphore enforces quotas and permits. In a bounded buffer, these two concerns are explicitly separated: semaphores manage slot availability, while a mutex protects the internal data structure of the buffer.

![Semaphore managing bounded buffer resource counts: empty_slots tracks available slots, filled_slots tracks consumable items, buffer_mutex protects buffer structure](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-semaphore-buffer-28f42541.png)

The following code omits `item_t` and buffer ring details to focus purely on the synchronization skeleton:

```c
#include <errno.h>
#include <pthread.h>
#include <semaphore.h>
#include <stdlib.h>

#define BUFFER_SIZE 1024

sem_t empty_slots;
sem_t filled_slots;
pthread_mutex_t buffer_mutex = PTHREAD_MUTEX_INITIALIZER;

void init_buffer(void) {
    if (sem_init(&empty_slots, 0, BUFFER_SIZE) == -1) {
        abort();
    }
    if (sem_init(&filled_slots, 0, 0) == -1) {
        abort();
    }
}

static void wait_sem(sem_t *sem) {
    while (sem_wait(sem) == -1) {
        if (errno == EINTR) {
            continue;
        }
        abort();
    }
}

void producer(void) {
    item_t item = produce_item();

    wait_sem(&empty_slots);
    pthread_mutex_lock(&buffer_mutex);
    put_item(item);
    pthread_mutex_unlock(&buffer_mutex);
    sem_post(&filled_slots);
}

void consumer(void) {
    wait_sem(&filled_slots);
    pthread_mutex_lock(&buffer_mutex);
    item_t item = take_item();
    pthread_mutex_unlock(&buffer_mutex);
    sem_post(&empty_slots);

    consume(item);
}
```

`empty_slots` tracks remaining available buffer space, while `filled_slots` tracks the number of items ready for consumption. The producer first decrements an empty slot, places data into the buffer under lock, and then increments `filled_slots`. The consumer executes the exact reciprocal flow. `buffer_mutex` is strictly dedicated to protecting the pointers and structures manipulated by `put_item()` and `take_item()`.

Retrying on `EINTR` in `wait_sem()` is essential. Linux man-pages explicitly state that `sem_wait()` can return `-1` with `errno` set to `EINTR` if interrupted by a signal handler. Omitting this check introduces intermittent, hard-to-reproduce production bugs.

Linux kernel locking documentation explicitly notes that semaphores can be used for serialization and sleeping waits. However, for new code, kernel guidelines recommend separating mutual exclusion and event completion into dedicated primitives such as `mutex` and `completion`. One key reason is that semaphores lack an explicit owner; PREEMPT_RT cannot provide priority inheritance for semaphores, meaning threads blocked on a semaphore remain vulnerable to priority inversion.

## Condition Variable: Waiting for a Condition, Not Just a Lock

A mutex answers the question: "Who is allowed into the critical section at this exact moment?" But frequently, a thread enters a critical section only to discover that the necessary business condition is not yet satisfied.

For example, a consumer thread acquires the mutex, inspects the queue, and finds it empty. It cannot consume an item, nor can it hold the mutex while sleeping. If the consumer holds the lock while sleeping, producers can never acquire the lock to insert new items, deadlocking the system.

A **condition variable** is specifically designed to solve this waiting problem. It is used in tandem with a mutex:

```c
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t not_empty = PTHREAD_COND_INITIALIZER;
queue_t queue;

void consumer(void) {
    pthread_mutex_lock(&mutex);

    while (queue_empty(&queue)) {
        pthread_cond_wait(&not_empty, &mutex);
    }

    item_t item = queue_pop(&queue);
    pthread_mutex_unlock(&mutex);

    consume(item);
}

void producer(item_t item) {
    pthread_mutex_lock(&mutex);
    queue_push(&queue, item);
    pthread_cond_signal(&not_empty);
    pthread_mutex_unlock(&mutex);
}
```

`pthread_cond_wait()` performs a critical atomic sequence: it atomically releases the associated mutex and suspends the calling thread on the condition variable; before returning to the caller after waking, it reacquires the mutex. Atomically releasing the lock and sleeping is indispensable: without atomicity, a missed wakeup race condition can occur—the consumer prepares to sleep, the producer signals the condition variable before the consumer actually enters the wait state, and the consumer subsequently sleeps indefinitely with no one left to wake it.

![Condition variable waiting process flowchart: Thread checks shared state in a while loop; if condition is unsatisfied, releases mutex and sleeps; upon signal wakeup, rechecks condition](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-condition-variable-400a44aa.png)

Three operational rules for condition variables are vital:

1. **Always evaluate the condition inside a `while` loop, never an `if`.** POSIX explicitly permits **spurious wakeups**, meaning a thread can wake up even if no thread signaled the condition variable. Moreover, even under legitimate signals, if multiple consumers are awakened simultaneously, only one might successfully pop an item, leaving the queue empty for the others.
2. **Condition variables do not store state; true state must reside in shared variables guarded by the mutex.** `pthread_cond_signal()` is not a persistent token deposited into a mailbox. If no thread is waiting when `signal` is invoked, the notification is discarded. What truly dictates whether a consumer can proceed is the actual queue length returned by `queue_empty()`.
3. **A condition variable must be paired with the same mutex while waiters exist.** POSIX calls this dynamic binding: while threads are blocked on a condition variable, attempting to wait on that same condition variable using a different mutex results in undefined behavior. This explains why production code routinely bundles state variables, mutex, and condition variable within a single coherent data structure.

Most condition variable bugs stem from confusing signals with state or neglecting to recheck conditions after waking up.

## Futex: Try in User Space First, Fall Back to Kernel on Failure

In Linux systems programming, you will frequently encounter the term **futex** (fast userspace mutex). Despite containing "mutex" in its name, a futex is fundamentally a building block for constructing locks rather than a high-level application lock.

The design philosophy of futex is: under uncontended conditions, acquire or release the lock purely in user space using atomic instructions on a 32-bit integer; only when contention occurs—requiring a thread to sleep or be awakened—does execution trap into the kernel via the `futex()` system call. This avoids the severe overhead of issuing a system call for every uncontended lock and unlock.

A simplified conceptual flow:
1. A thread attempts an atomic compare-and-swap on a 32-bit integer in user space, transitioning it from 0 to 1.
2. If successful (uncontended), the thread immediately enters the critical section with zero kernel involvement.
3. If CAS fails (the lock is contested), the thread issues a `futex()` system call with `FUTEX_WAIT`, requesting the kernel to suspend it.
4. When the lock holder releases the lock, if it detects waiting threads, it invokes `futex()` with `FUTEX_WAKE` to wake one or more suspended threads.

![Futex user-space fast path and kernel slow path: Acquire lock via user-space atomic operation when uncontended; enter FUTEX_WAIT on contention; wake waiting threads via FUTEX_WAKE on release](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-futex-e072e8d9.png)

`FUTEX_WAIT` implements a **compare-and-block** guarantee: the kernel atomically verifies that the 32-bit futex word still matches the expected value supplied by the caller. If and only if the values match does the kernel suspend the calling thread. This atomic verification bridges user-space atomic operations with kernel wait queues, eliminating race windows.

Linux man-pages emphasize this architecture: futex operations center around a 32-bit integer residing in user-space virtual memory, with core operations centered on wait and wake primitives. Applications do not interact directly with futex system calls; rather, runtime libraries such as `glibc` pthreads, C++ standard libraries, Go runtimes, and the JVM leverage futex as the underlying engine for their mutexes, condition variables, and semaphores.

Summary: **Keep the fast path entirely in user space; enter the kernel only for the slow path of queuing and sleeping.**

## Atomic Instructions: Locks Require an Indivisible Starting Point

Whether mutex, spinlock, or futex, all synchronization primitives ultimately rest upon hardware-enforced atomic instructions. Without hardware support, the actions of "checking if a lock is free" and "marking the lock as acquired" would be vulnerable to race conditions between threads.

Standard hardware atomic primitives include test-and-set, compare-and-swap (CAS), and fetch-and-add. They guarantee that read-modify-write operations on a specific memory address cannot be observed in a partial, torn state by other CPU cores.

Introductory textbooks sometimes mention "disabling interrupts to implement locks." In a single-core kernel, disabling interrupts prevents the current execution stream from being interrupted by hardware interrupt handlers, safeguarding critical kernel paths. However, this technique has a strict boundary: it affects only the local CPU core. It cannot prevent a second CPU core in a multi-core machine from reading or writing the same memory address concurrently. On multi-core architectures, cross-CPU mutual exclusion relies on atomic instructions, cache coherence protocols (such as MESI), and memory bus locking.

This explains why operating system curricula introduce atomic instructions before lock implementations: locks expose `lock()` and `unlock()` APIs to programmers, but beneath the surface, hardware and kernel collaborate to execute indivisible atomic updates.

## Locks Enforce Memory Ordering

Locks do far more than manage queues at the entrance of a critical section. In multi-core architectures, modern CPUs and optimizing compilers aggressively reorder memory accesses. Without proper synchronization semantics, modifications written by one CPU core will not necessarily be observed in program order by another CPU core.

Consequently, lock acquisition and release carry strict memory ordering semantics:

- **Acquire semantics**: Memory operations occurring *after* acquiring a lock cannot be reordered *before* the lock acquisition.
- **Release semantics**: Memory operations occurring *before* releasing a lock cannot be reordered *after* the lock release.

Linux kernel memory barrier documentation categorizes LOCK operations as acquiring semantics and UNLOCK operations as releasing semantics. By correctly utilizing established primitives like mutexes and spinlocks, application developers rarely need to manually insert memory barriers. Only when developing lock-free data structures, device drivers, or custom low-level synchronization engines do developers interact with memory barriers directly.

One architectural caveat: acquire and release represent one-way barrier constraints; combining them does NOT automatically constitute a full two-way memory barrier across all possible reordering scenarios. While standard business logic rarely needs to worry about this subtlety, it is critical when implementing lock-free queues, RCU (Read-Copy Update), drivers, or memory-mapped I/O (MMIO).

## Priority Inversion: Locks Impact CPU Scheduling

Locks introduce complex scheduling interactions.

The classic problem is **priority inversion**: a low-priority thread L acquires a shared lock. A high-priority thread H needs that lock and blocks waiting for L. Suddenly, an unrelated medium-priority thread M becomes runnable and preempts L because M has a higher priority than L. As a result, high-priority thread H is prevented from executing indefinitely while medium-priority thread M runs—inverting the scheduling priorities.

A primary solution is **priority inheritance**: the low-priority thread L temporarily inherits the priority of the highest-priority waiting thread (H) while holding the contested lock. This allows L to complete its critical section promptly without preemption by intermediate threads like M, releasing the lock so H can proceed.

POSIX mutexes support protocol attributes including `PTHREAD_PRIO_INHERIT` and `PTHREAD_PRIO_PROTECT`. The Linux kernel provides `rt_mutex`, built specifically around priority inheritance, powering priority-inheriting futexes (PI-futex) and real-time pthread mutexes.

This also illustrates why semaphores' lack of owner semantics is a disadvantage: lacking an identifiable owner, the kernel cannot determine whose priority should be boosted. As the Linux kernel locking documentation notes, semaphores cannot provide priority inheritance under PREEMPT_RT, meaning blocking on a semaphore can trigger uncontrolled priority inversion.

## Differences Between User-Space and Kernel-Space Locks

User-space applications focus on coordinating concurrent threads. Pthreads provides mutexes, condition variables, and semaphores; languages like Java, C++, Go, and Rust wrap these in ergonomic runtime constructs.

Kernel-space locking operates under vastly more complex execution constraints. Kernel code executes across standard process contexts, hardware interrupt contexts (top halves), software interrupts (bottom halves/softirqs), and non-preemptible regions. Some contexts are permitted to sleep; other contexts are strictly forbidden from sleeping. Holding certain locks requires disabling local preemption or interrupts. Furthermore, real-time kernels must manage priority inversion and bounded scheduling latency.

When analyzing kernel locks, always ask:
- Can the current execution context sleep?
- Can the thread be preempted while holding this lock?
- Can this critical section be re-entered by an interrupt handler?
- Does this lock protect per-CPU data or cross-CPU shared data?
- Is the kernel running standard Linux or PREEMPT_RT?
- Is priority inheritance required to satisfy hard real-time latency deadlines?

![Contextual differences between user-space and kernel-space locks: User space focuses on thread coordination; kernel space must assess sleepability, preemption, interrupt paths, and multi-CPU data sharing](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-kernel-context-85016b1b.png)

Key distinctions to remember:
- Sleeping locks like `mutex` put tasks to sleep and are suited for longer critical sections, but they must **never** be used in interrupt context.
- `spinlock` is reserved for ultra-short, non-sleepable kernel paths; while holding a spinlock, code must never invoke functions that might block or sleep.
- `rw_semaphore` and `rwlock` support multi-reader single-writer semantics, but fairness and real-time behaviors shift under different kernel configurations.
- Local locks, disabling preemption, and disabling local interrupts protect per-CPU data, but do not replace cross-CPU locks in multi-core systems.

Linux kernel documentation details these rules extensively, especially regarding semantic shifts under PREEMPT_RT. Application developers do not need to memorize every kernel internal, but must grasp this core reality: kernel locks cannot be viewed merely as "mutex vs spinlock"—they are inextricably tied to whether an execution context can sleep, be preempted, or handle interrupts.

## Choosing the Right Synchronization Primitive

- **Protecting shared mutable state**: Default to a **mutex**. It has unambiguous ownership semantics, sleeps while waiting, and handles the vast majority of user-space critical sections cleanly.
- **Throttling resource capacity**: Use a **semaphore**. Examples include limiting concurrent downloads to 10 or capping database connections at 50. The core metric is resource capacity, not critical section entry.
- **Waiting for state changes**: Use a **condition variable**. Examples include queue transitioning from empty to non-empty, task completion, or buffer availability. Always maintain state in shared variables, guard them with a mutex, and wait inside a `while` loop.
- **Ultra-short, non-sleepable kernel paths**: Use a **spinlock**. Long spinning in user-space business code is almost always an architectural defect.
- **Designing runtimes, thread libraries, or high-performance synchronizers**: Primitives like **futex** become relevant. Application-level code should always rely on mature concurrency libraries rather than invoking the raw `futex()` system call directly.

These trade-offs explain why Java documentation discusses `synchronized`, `ReentrantLock`, AQS, and CAS as an interconnected ecosystem. Java developers work with high-level language abstractions, while the operating system orchestrates thread scheduling, blocking, waking, atomic CPU instructions, and kernel contexts.

## Common Mistakes

1. **Treating locks as performance toggles.** Locks guarantee correctness first; performance comes second. If shared state is corrupted by data races, removing a lock merely outsources bugs to non-deterministic thread scheduling.
2. **Waiting on condition variables with `if`.** Waking from a condition variable does not guarantee that the condition is currently met. Threads must recheck the condition in a `while` loop to safeguard against spurious wakeups and race conditions among multiple awakened threads.
3. **Using semaphores as universal locks.** While semaphores can technically emulate locks, doing so erodes code readability and semantic clarity. Use a mutex for mutual exclusion, completions for one-shot events, and semaphores when counting resources.
4. **Performing slow operations inside a critical section.** Performing disk I/O, network requests, or RPC calls while holding a lock stretches the critical section duration. Under load, lock contention multiplies, causing cascading request queues, throughput collapse, and deadlocks.
5. **Ignoring lock acquisition ordering.** If Thread 1 acquires `A -> B` while Thread 2 acquires `B -> A`, a circular wait deadlock is inevitable. This affects operating systems, database transactions, and Java threads alike. For an exhaustive breakdown, see [Deep Dive into Deadlock](./dead-lock.md).

## Summary

Operating system locks cannot be understood solely through individual API calls. They represent an integrated family of synchronization mechanisms designed around shared mutable state, waiting conditions, resource quantities, and CPU scheduling contexts.

- **Mutex** enforces mutual exclusion with sleep-based waiting.
- **Spinlock** trades busy CPU spinning for context-switch latency.
- **Semaphore** manages resource counts and concurrency limits.
- **Condition variable** allows threads to sleep cleanly until conditions change.
- **Futex** unites user-space atomic fast paths with kernel blocking slow paths.

They all involve "waiting," but what they wait for differs: some wait for critical section entry, some for resource tokens, some for state transitions, and some for the kernel to return them to the runnable queue.

When learning Java locks, many of these mechanics are encapsulated by the JVM. At the operating system layer, the questions become concrete: When should a thread sleep? When should it spin? Who wakes it? Which execution paths are non-preemptible? And which contexts are strictly forbidden from blocking?

## References

- [OSTEP: Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf)
- [OSTEP: Condition Variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf)
- [OSTEP: Semaphores](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf)
- [POSIX Programmer's Manual: pthread_mutex_lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)
- [POSIX Programmer's Manual: pthread_cond_wait](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html)
- [POSIX Programmer's Manual: pthread_mutexattr_getprotocol](https://man7.org/linux/man-pages/man3/pthread_mutexattr_getprotocol.3p.html)
- [Linux man-pages: sem_wait](https://man7.org/linux/man-pages/man3/sem_wait.3.html)
- [Linux man-pages: futex](https://man7.org/linux/man-pages/man2/futex.2.html)
- [Linux Kernel Documentation: Lock types and their rules](https://docs.kernel.org/locking/locktypes.html)
- [Linux Kernel Documentation: Memory Barriers](https://www.kernel.org/doc/Documentation/memory-barriers.txt)
- [Linux Kernel Documentation: RT-mutex subsystem with PI support](https://docs.kernel.org/locking/rt-mutex.html)
