---
title: "Deep Dive into I/O Multiplexing: Principles and Differences Between select, poll, and epoll"
description: "A comprehensive summary of high-frequency I/O multiplexing interview questions, starting from the two phases of network reads to dissecting the implementation principles, data structures, performance differences, and LT/ET trigger modes of select, poll, and epoll, as well as real-world applications in Redis, Nginx, Java NIO, and Netty."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Network Programming
  - Linux
head:
  - - meta
    - name: keywords
      content: I/O Multiplexing,IO Multiplexing,select,poll,epoll,Linux epoll,LT,ET,Java NIO,Netty,Redis,Nginx,OS Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/io-multiplexing.md
---

When writing a TCP network server, the most intuitive approach is: the main thread calls `accept()` on an incoming connection and immediately spins up or delegates to a new thread to handle `read()`, business processing, and `write()`. When concurrency is low, this simple model works reasonably well.

However, the moment concurrent connections surge into the tens of thousands, severe bottlenecks emerge. On many Linux distributions, each new thread reserves several megabytes of virtual stack space by default—typically 8 MB (the exact value depends on `ulimit -s`, runtime libraries, and thread attributes). Even though stack memory pages are committed on demand, reserving address spaces, allocating committed stack pages, and maintaining thread metadata for ten thousand connections adds up to substantial memory consumption. Worse still, packing thousands of active threads across a handful of CPU cores means CPU cycles are devoured almost entirely by thread context switching, leaving minimal time for actual business processing. Compounding the issue, the vast majority of network connections remain idle at any given moment—each ties up an entire operating system thread merely to wait for incoming bytes.

This is the classic **C10K problem**: **How can a single thread (or a small pool of threads) simultaneously monitor tens of thousands of connections, processing only those connections that actually have data ready?**

The definitive answer is **I/O Multiplexing**.

Below, we examine the evolution through `select`, `poll`, and `epoll`. They tackle the exact same problem, but each iteration does so with substantially greater sophistication.

## What Is I/O Multiplexing?

To understand I/O multiplexing, we must first break down a network read operation into its two fundamental phases inside the operating system kernel:

1. **Waiting for data readiness**: Data is still traversing the network or arriving at the network interface card (NIC); the kernel must wait for packets to arrive and be assembled into the kernel socket receive buffer. This phase is typically slow.
2. **Copying data**: Once data lands in the kernel buffer, it must be copied from kernel space into the application buffer in user space. This memory transfer is fast.

![The Two Phases of a Network Read: Waiting for NIC data to enter the kernel buffer, then copying to the user buffer via copy_to_user](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-io-two-phases-4cdb6dd8.png)

In the traditional one-thread-per-connection blocking model, the bottleneck occurs in Phase 1: the thread calls `recv()` and blocks indefinitely, dedicated solely to waiting for that single connection to receive data, unable to do anything else in the meantime.

I/O multiplexing introduces a paradigm shift: instead of blocking on an individual socket, the application delegates all file descriptors (fds) it wishes to monitor to the kernel, and the thread blocks on a dedicated monitoring system call. As soon as any one or more of these fds become ready (readable or writable), the system call returns, informing the application exactly which fds are ready so the thread can process them immediately.

Consider a real-world analogy: a single waiter attends to ten dining tables. Instead of standing rigidly at Table 1 waiting for the guest to decide what to order, the waiter watches the entire dining room, immediately stepping over to whichever table raises a hand.

**Multiplexing** means handling multiple concurrent network connections; **Multiplexed** means multiplexing a single thread to drive them all.

Note a critical distinction that is frequently confused: I/O multiplexing itself remains **Synchronous I/O**. System calls like `select` merely notify the application that an fd is ready; the application must still proactively invoke `recv()` or `read()` to execute the actual data transfer. Synchronous does not mean blocking: whether that subsequent `recv()` call blocks depends on whether the socket is configured as non-blocking and whether data availability shifted prior to reading. High-performance event loops invariably pair multiplexing with non-blocking file descriptors.

## Positioning Multiplexing Across the Five I/O Models

In *UNIX Network Programming* (UNP), W. Richard Stevens categorized Unix I/O into five distinct models. Identifying where I/O multiplexing sits clarifies its architecture:

- **Blocking I/O**: After calling `recv()`, the thread sleeps throughout both phases—waiting for data readiness and copying data. It is the simplest model, but the most wasteful of threads.
- **Non-blocking I/O**: If no data is available, `recv()` returns immediately with `EWOULDBLOCK`. The thread does not sleep, but the application must repeatedly poll in a busy loop asking "Is it ready yet?", wasting massive CPU cycles.
- **I/O Multiplexing**: The thread blocks on `select`/`poll`/`epoll`, waiting on multiple fds simultaneously. The thread wakes up to handle whichever fd becomes ready. This is the subject of this article.
- **Signal-driven I/O**: The application registers a `SIGIO` signal handler. The kernel emits a signal when data is ready, leaving the thread free to perform other work in the interim. Rarely used in production servers.
- **Asynchronous I/O (AIO)**: The application submits an I/O request and returns immediately; the kernel handles both waiting and data copying, notifying the application only after the entire operation completes. Note that this defines the conceptual model; concrete implementations depend on platform APIs. For example, POSIX `aio_read` in Linux glibc is largely implemented via user-space worker threads rather than true kernel-native async I/O.

![Comparison of the Five I/O Models: Blocking I/O, Non-blocking I/O, I/O Multiplexing, Signal-driven I/O, and Asynchronous I/O](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-five-io-models-4f34464f.png)

The crucial dividing line between synchronous and asynchronous is: **who performs the physical copying of data from the kernel buffer to the user buffer?** In the first four models, the application itself must explicitly issue a `read()` or `recv()` system call to transfer the payload into user space; execution cannot proceed with the data until that call completes, making them all **synchronous** (whether that call actually sleeps depends on socket non-blocking flags and buffer state). Only asynchronous I/O delegates both waiting and payload copying entirely to the kernel before notifying user space. The value of I/O multiplexing is not in accelerating single read operations, but in amortizing the cost of "waiting" across thousands of connections using a single thread.

## How Does select Work?

`select` is the earliest multiplexing implementation, universally supported across virtually all platforms. Its function signature is:

```c
#include <sys/select.h>

int select(int nfds, fd_set *readfds, fd_set *writefds,
           fd_set *exceptfds, struct timeval *timeout);
```

The core data structure is `fd_set`, which is fundamentally a **bitmap**: each bit corresponds to a file descriptor, and setting a bit to 1 indicates interest in events on that fd. Four macros manage this bitmap:

```c
void FD_ZERO(fd_set *set);          // Clear all bits in the set
void FD_SET(int fd, fd_set *set);   // Set the bit corresponding to fd to 1
void FD_CLR(int fd, fd_set *set);   // Clear the bit corresponding to fd to 0
int  FD_ISSET(int fd, fd_set *set); // Test whether the bit for fd is set to 1
```

A simplified echo server event loop using `select` looks like this:

```c
fd_set rset;
int maxfd = listenfd;

while (1) {
    FD_ZERO(&rset);                       // Must clear and rebuild the set every iteration
    FD_SET(listenfd, &rset);              // Re-insert monitored fds one by one
    for (int i = 0; i < n; i++)
        if (conns[i] >= 0) FD_SET(conns[i], &rset);

    // Pass NULL for unneeded write/except sets; trailing NULL blocks indefinitely
    int ready = select(maxfd + 1, &rset, NULL, NULL, NULL);

    if (FD_ISSET(listenfd, &rset)) {      // Listener fd ready: accept incoming connection
        int connfd = accept(listenfd, NULL, NULL);
        // Store connfd into conns[], update maxfd
    }
    for (int i = 0; i < n; i++)           // O(N) scan: poll every fd to check if ready
        if (conns[i] >= 0 && FD_ISSET(conns[i], &rset)) {
            // Handle incoming read event on this connection
        }
}
```

This code snippet exposes several fatal architectural flaws in `select`. Understanding these limitations reveals exactly why `poll` and `epoll` were created:

**First, the hard limit on the number of file descriptors.** In Linux/glibc environments, the size of the `fd_set` bitmap is governed by glibc's `FD_SETSIZE` constant, which defaults to 1024. Consequently, it can only safely represent file descriptors numbered 0 through 1023. This constraint stems from user-space glibc fixed-size data structures and the `FD_*` macros, rather than the underlying Linux kernel itself. Passing an fd beyond this range invokes undefined behavior; attempting to hack around it by redefining `FD_SETSIZE` or recompiling the kernel is fragile and discouraged. To monitor more connections, the proper solution is migrating to `poll` or `epoll`.

**Second, every invocation copies the entire bitmap back and forth between user space and kernel space.** Before each call, you populate the bitmap in user space, and `select` copies it into kernel space. Upon returning, the kernel modifies the bitmap in place (clearing unready bits) and copies it back to user space. The kernel must inspect and write back bits up to `nfds`, meaning higher fd numbers and larger monitored sets inflate this copy overhead linearly.

**Third, the bitmap is a value-result parameter modified in place.** Because the kernel clears all unready bits upon return, you cannot reuse the original interest list for the next iteration. You are forced to perform `FD_ZERO` and re-populate the entire set using `FD_SET` on every single loop iteration.

**Fourth, the application must perform an $O(N)$ linear scan after returning.** The return value of `select` only reports the total count of ready descriptors; which specific fds are ready is recorded by in-place modifications across the `fd_set`. The application must iterate through the candidate range up to `maxfd` calling `FD_ISSET`; if only 1 out of 10,000 connections is ready, the application still has to check 10,000 bits.

The `timeout` parameter controls blocking behavior: passing `NULL` blocks indefinitely, passing a zeroed `timeval` returns immediately (polling), and passing a positive duration specifies the maximum wait time.

## What Improvements Did poll Introduce?

`poll` belongs to the same technological generation as `select`. While its high-level design remains similar, it replaced the rigid bitmap with an array of `struct pollfd`:

```c
#include <poll.h>

struct pollfd {
    int   fd;       // File descriptor to monitor
    short events;   // Requested events to watch (filled before call, e.g., POLLIN)
    short revents;  // Returned events that actually occurred (filled by kernel)
};

int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

The main event loop takes this form:

```c
struct pollfd fds[MAX];
fds[0].fd = listenfd;
fds[0].events = POLLIN;
// Remaining fds initialized: fds[i].fd = connfd; fds[i].events = POLLIN;

while (1) {
    int ready = poll(fds, nfds, -1);      // Passing -1 for timeout blocks indefinitely
    for (int i = 0; i < nfds; i++) {
        if (fds[i].revents & POLLIN) {    // Kernel writes results into revents
            // Handle ready read event
        }
    }
}
```

Compared to `select`, `poll` introduced two critical improvements:

**It eliminated the 1024 descriptor hard ceiling.** The number of fds you can monitor is limited only by the size of the array you allocate and pass, freed from `FD_SETSIZE`. The practical limit is governed by process file descriptor limits (`RLIMIT_NOFILE`) and memory.

**It decoupled requested events from returned events.** `events` represents user input, while `revents` represents kernel output. Because the kernel leaves `events` untouched and writes solely to `revents`, you do not need to rebuild your interest list from scratch on every iteration like `select`.

However, `poll` failed to resolve the two most debilitating performance bottlenecks: every call still requires copying the entire array from user space to kernel space, and after waking up, the application must still perform an $O(N)$ linear traversal across the entire array to discover which fds fired. As concurrent connections grow, overhead continues to scale linearly.

In short, `poll` cleaned up the API syntax of `select`, but left the underlying $O(N)$ performance model unchanged. The true architectural revolution arrived with `epoll`.

## Why Is epoll a True Architectural Revolution?

`epoll` is exclusive to Linux. Designed and implemented by Davide Libenzi, it was introduced in Linux kernel **2.5.44**, with glibc wrappers arriving in glibc 2.3.2. It split the monolithic "do-everything-in-one-call" design into three specialized system calls:

```c
#include <sys/epoll.h>

int epoll_create1(int flags);  // Create an epoll instance; returns an fd (replaces legacy epoll_create(int size))
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);  // Add, modify, or delete monitored fds
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);  // Wait for ready I/O events
```

`epoll_ctl` supports three operations (`op`): `EPOLL_CTL_ADD` (register), `EPOLL_CTL_MOD` (modify), and `EPOLL_CTL_DEL` (unregister). Events are encapsulated via `struct epoll_event`:

```c
typedef union epoll_data {
    void     *ptr;
    int       fd;
    uint32_t  u32;
    uint64_t  u64;
} epoll_data_t;

struct epoll_event {
    uint32_t     events;   // Event flags, e.g., EPOLLIN, EPOLLOUT, EPOLLET
    epoll_data_t data;     // User data returned verbatim by epoll_wait, typically storing the fd
};
```

A complete production event loop operates as follows:

```c
int epfd = epoll_create1(0);              // Step 1: Create the epoll instance

struct epoll_event ev;
ev.events = EPOLLIN;                       // Monitor readability; level-triggered by default
ev.data.fd = listenfd;
epoll_ctl(epfd, EPOLL_CTL_ADD, listenfd, &ev);  // Step 2: Register once

struct epoll_event events[MAX_EVENTS];
while (1) {
    // Step 3: Returns ONLY descriptors that are genuinely ready; n is ready count
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
    for (int i = 0; i < n; i++) {          // Iterate exclusively over ready events, never the full set
        int fd = events[i].data.fd;
        if (fd == listenfd) {
            int connfd = accept(listenfd, NULL, NULL);
            ev.events = EPOLLIN;
            ev.data.fd = connfd;
            epoll_ctl(epfd, EPOLL_CTL_ADD, connfd, &ev);  // Register new connection into interest list
        } else {
            // Process ready read event on connfd
        }
    }
}
```

Contrasting this with `select` highlights the architectural distinction immediately: registering fds and waiting for events are cleanly decoupled. The `events` array populated by `epoll_wait` contains **strictly those fds that are ready**. The application loops exclusively over active events, without ever needing to query the entire monitored universe.

This improvement is driven by radical changes to underlying kernel data structures. Inside the Linux kernel, an epoll instance is represented by a `struct eventpoll` containing two foundational components:

- **A Red-Black Tree (`rbr`)**: Stores all fds registered via `epoll_ctl` (each represented by an `epitem` node). Adding, modifying, or deleting an fd is an $O(\log N)$ tree operation. An fd is registered once and resides in the kernel permanently until removed, eliminating the need to copy the entire list on every wait call.
- **A Ready List (`rdllist`)**: A doubly linked list that stores only those fds that have fired and are ready for processing.

![epoll Internal Architecture: epoll_ctl maintains the interest list; when fds become ready, callbacks insert them into the ready list; epoll_wait returns active events](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-epoll-architecture-3236afce.png)

The magic lies in the kernel **callback mechanism**. When an application registers an fd via `epoll_ctl`, the kernel attaches a callback handler to that file descriptor's wait queue. When network packets arrive at the NIC and data lands in the socket buffer, this callback fires automatically. The callback inserts the corresponding `epitem` into the ready list and wakes up any thread sleeping on `epoll_wait`. Consequently, `epoll_wait` only needs to check whether the ready list is non-empty: if events exist, it copies them to user space; if not, it sleeps until the callback wakes it up. (Note: the red-black tree and linked list are current kernel implementation details; `epoll` guarantees user space the semantic contract of an interest set and ready list, so do not treat internal tree layouts as an immutable ABI.)

This explains the exceptional efficiency of `epoll`: in high-concurrency environments with massive connections but low active ratios, `epoll_wait` processes only the subset of events that fired in that batch, completely decoupled from the total number of registered fds. If 100,000 connections are monitored and only 3 receive packets, `epoll_wait` returns exactly those 3. However, keep in mind: epoll's overall overhead is not zero—registration changes (`epoll_ctl`), callback execution, concurrency locking, and copying ready events back to user space all incur costs. When the percentage of active connections approaches 100%, its performance gap over select/poll narrows. To summarize: select and poll must submit the full interest set on every wait and scan it linearly; epoll persists the interest set in kernel memory and retrieves only ready events, making it ideal for massive connections with sparse activity.

Memory copying is also dramatically reduced. An fd is registered once into the red-black tree via `epoll_ctl`, so subsequent invocations of `epoll_wait` never re-transmit the interest list.

We must debunk an extremely widespread myth: *"epoll is fast because it uses mmap to share memory between user space and kernel space, eliminating data copying."* **This claim is completely false.** Examining the Linux kernel source reveals that `epoll_wait` copies ready events into the user-space `events` array using standard `__put_user` / `copy_to_user` routines; there is no shared mmap buffer. The copy that epoll eliminates is the repetitive copying of the full descriptor interest set on every invocation, NOT the copying of ready events upon wake-up. These two concepts must not be conflated.

## Level Triggered vs. Edge Triggered: What Is the Difference?

`epoll` supports two event notification modes. This capability sets it apart from select and poll, and represents the most common trap for engineers in interviews and production code.

**Level Triggered (LT)** is the default mode. As long as unread data remains in an fd's receive buffer (or space remains in a write buffer), every call to `epoll_wait` will continuously notify you. `select` and `poll` support only this mode.

**Edge Triggered (ET)** is enabled by explicitly adding the `EPOLLET` flag during registration. It notifies the application **only at the exact instant a state transition occurs**.

Consider a concrete scenario (the classic example from the Linux man pages): suppose a remote peer writes 2 KB of data to a socket:

- **LT Mode**: `epoll_wait` notifies you that the socket is readable. You read 1 KB, leaving 1 KB in the kernel buffer. On the next call to `epoll_wait`, it immediately notifies you again: *"There is still unread data here!"*, and will continue doing so until the buffer is drained completely.
- **ET Mode**: `epoll_wait` notifies you once. If you read only 1 KB and return to your event loop, `epoll_wait` will **never notify you again for that remaining 1 KB** unless the remote peer sends additional data, triggering a new state change. That orphaned 1 KB can languish in the buffer indefinitely, causing the connection to hang.

![Comparison of Level Triggered and Edge Triggered Modes: LT continuously notifies while unread data remains; ET notifies only on state transitions](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-lt-vs-et-6c7d8e92.png)

Therefore, using ET mode mandates two strict programming rules: **the file descriptor must be configured as non-blocking**, and the application must **loop `read()` until it receives `EAGAIN` or `EWOULDBLOCK`**, ensuring the buffer is drained dry in one shot. A canonical ET read loop looks like this:

```c
// Prerequisite: connfd is non-blocking and registered with EPOLLET
while (1) {
    ssize_t n = read(connfd, buf, sizeof(buf));
    if (n > 0) {
        // Process the payload, then loop again to drain remaining bytes
    } else if (n == 0) {
        close(connfd);                 // Remote peer closed connection
        break;
    } else {  // n < 0
        if (errno == EAGAIN || errno == EWOULDBLOCK)
            break;                      // Buffer completely drained; proper exit point
        if (errno == EINTR)
            continue;                   // Interrupted by signal; retry
        close(connfd);                  // Genuine error occurred
        break;
    }
}
```

If the fd were left blocking, the final `read()` call that encounters an empty buffer would freeze the entire worker thread indefinitely—which is why ET and non-blocking sockets must always go hand in hand.

The primary benefit of ET is reducing the frequency of `epoll_wait` wake-ups, catering to extreme throughput requirements where read/write logic is impeccably implemented. The trade-off is significantly higher programming complexity: failing to loop until `EAGAIN` leads to silent connection stalls, which is the most notorious bug in ET applications. Conversely, continuously reading a single hyper-active fd inside the loop can starve other connections; production servers frequently enforce per-connection read budgets and yield to user-space ready queues. LT is simpler, robust, and less prone to edge-case bugs. For the vast majority of applications, LT is more than fast enough. Ultra-performance-critical servers like Nginx are classic adopters of ET.

When writing production-grade event loops, additional edge cases must be handled: `epoll_wait` returning `EINTR` due to signals must be retried; under ET, `accept()` must also loop until `EAGAIN`; `EPOLLERR`, `EPOLLHUP`, and `EPOLLRDHUP` must be evaluated alongside read/write flags; `read()` returning 0 indicates the remote peer closed the write half of the connection; `write()` calls may produce partial writes, requiring user-space buffering and on-demand `EPOLLOUT` registration; and when multiple threads monitor the same fd, `EPOLLONESHOT` paired with explicit re-arming should be considered.

## Side-by-Side Comparison

The following table summarizes the key architectural dimensions across `select`, `poll`, and `epoll`:

| Dimension | `select` | `poll` | `epoll` |
| --- | --- | --- | --- |
| **Platform Support** | Broadest cross-platform support (Unix, Windows socket layer) | Primarily Unix-like systems | Linux-exclusive (Linux 2.6+) |
| **Kernel Management** | Inspects temporary fd set on each call | Inspects temporary fd array on each call | Persistently maintains interest list and ready list (currently red-black tree and ready list) |
| **Descriptor Limit** | Capped by `FD_SETSIZE` (glibc default 1024; safely handles fds 0–1023) | Uncapped by `FD_SETSIZE`; limited by `RLIMIT_NOFILE` and memory | Uncapped by `FD_SETSIZE`; limited by system fds, RAM, and `max_user_watches` |
| **Parameter Passing** | Full bitmap passed every iteration; modified in place, must rebuild | Full `pollfd` array passed every iteration; kernel updates `revents` | Monitored set maintained via `epoll_ctl`; `epoll_wait` receives only ready events |
| **Ready Search Cost** | Scans up to `nfds - 1`; $O(N)$ linear scan | Traverses full array; $O(N)$ linear scan | Wakes up with active list; return cost scales with number of ready events |
| **Trigger Modes** | Level Triggered only | Level Triggered only | Level Triggered (default) and Edge Triggered (`EPOLLET`) |

![Comparison of select, poll, and epoll: Data structures, descriptor limits, parameter passing, search costs, and trigger modes](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-select-poll-epoll-6d5bee4f.png)

## epoll Is Not a Silver Bullet

It is tempting to assume `epoll` dominates in all possible scenarios, but engineering involves trade-offs:

**When connection counts are low and all are continuously active, epoll is not necessarily faster.** Maintaining red-black trees, registering callbacks, and synchronizing ready lists introduces fixed overhead. If you only monitor dozens of sockets and nearly all of them have data ready on every cycle, a straightforward linear scan via select/poll is simpler and often faster. epoll excels in **massive connection counts where most connections are idle**—holding tens of thousands of connections while only a few dozen fire at any moment.

**It is strictly Linux-specific.** macOS and BSD use `kqueue`, while Windows uses IOCP. To build cross-platform network software, engineers rarely invoke epoll directly; they rely on abstraction libraries like libevent, libuv, or Netty, which map to epoll on Linux and native equivalents elsewhere.

**The Thundering Herd Problem.** When multiple processes or threads wait on the same listening socket via epoll, an incoming connection can wake them all up simultaneously, even though only one can successfully `accept()` it, wasting CPU cycles. Linux 4.5 introduced the `EPOLLEXCLUSIVE` flag to mitigate this, instructing the kernel to wake only one (or a few) exclusive waiters, though it is not a strict guarantee across all mixed deployment topologies.

**ET Pitfalls.** As noted, failing to read until `EAGAIN` leaves remaining bytes stranded without further notifications, creating silent, hard-to-debug application hangs. When in doubt, stick to LT.

## Where Are They Used in Practice?

I/O multiplexing is the foundational engine powering nearly every modern high-performance infrastructure component:

**Redis** is the quintessential single-threaded event loop paired with I/O multiplexing. Instead of spawning a thread per client, Redis uses a single thread to monitor thousands of sockets via multiplexing, dispatching ready sockets to file event handlers. Redis wraps this in an internal abstraction layer (`ae.c`), selecting epoll, kqueue, or select depending on the host platform. This design eliminates thread context switching and lock contention, allowing Redis to deliver immense throughput on a single core.

![File Event Handler Architecture in Redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-event-handler-2997bc21.png)

A common misconception: Redis 6.0 introduced multi-threading, but threads were added strictly to parallelize network I/O reading, socket writing, and protocol parsing. Core command execution remains strictly single-threaded. Multi-threading offloads the CPU-heavy tasks of socket parsing without altering the single-threaded multiplexing event loop core.

**Nginx** employs a master-worker multi-process model paired with epoll in ET mode, using non-blocking sockets to maximize event processing efficiency per wake-up. This architecture enables Nginx to handle hundreds of thousands of concurrent connections with minimal memory and CPU footprints.

**Java NIO's** `Selector` is the Java abstraction over native OS multiplexing. On Linux, `Selector` maps directly to epoll via `EPollSelectorImpl`. The abstraction allows Java code to remain cross-platform while unlocking OS-native performance underneath.

![Selector Architecture in Java NIO](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/selector-channel-selectionkey-005fb037.png)

Beyond standard Java NIO, Netty provides a native epoll transport (`EpollEventLoop`) that bypasses JDK JNI layers to interface directly with epoll system calls, extracting maximum throughput on Linux. Note version nuances: Netty 4.0's native transport championed Edge Triggered mode; by Netty 4.2, `EpollMode` was deprecated, with documentation stating that the native transport operates exclusively in Level Triggered mode. Consult specific Netty 4.1 point releases for interim behaviors.

## How to Answer in an Interview

When asked *"What problem does I/O multiplexing solve?"*, avoid answering "it makes a single read faster." It solves the problem of **waiting**: a single thread does not block on an individual connection, but delegates a set of fds to `select`, `poll`, or `epoll`, waking up only when fds become ready. The subsequent transfer of payload data from kernel space to user space via `read()`/`recv()` is still executed by the application itself, which is why multiplexing belongs to the synchronous I/O family.

Structure the differences between `select`, `poll`, and `epoll` across three pillars:

First, **data structures**: `select` uses a fixed-size `fd_set` bitmap, constrained to 1024 by default in Linux glibc; `poll` switches to a `pollfd` array, bypassing `FD_SETSIZE` but still passing the full array on every call; `epoll` maintains the interest set persistently in the kernel via a red-black tree, using `epoll_ctl` for incremental mutations and `epoll_wait` to retrieve ready events.

Second, **performance scaling**: `select` and `poll` pass the full descriptor set on every wait and scan it linearly after wake-up, degrading severely when connections are numerous but sparse. `epoll` scales with the number of active events rather than total connections. However, acknowledge that when connections are few and continuously active, select/poll may perform just as well without epoll's internal bookkeeping.

Third, **trigger modes (LT vs. ET)**: LT is default, continuously notifying as long as unread data remains; ET notifies only on state transitions, requiring non-blocking sockets and looping `read()` until `EAGAIN`. Emphasize real-world production nuances like `EINTR` retries, partial writes, and `EPOLLONESHOT` to demonstrate genuine engineering depth beyond textbook theory.

## References

- [W. Richard Stevens, *UNIX Network Programming*, Chapter 6 (select/poll and Five I/O Models)](https://notes.shichao.io/unp/ch6/)
- [epoll(7) - Linux manual page](https://man7.org/linux/man-pages/man7/epoll.7.html)
- [epoll_create(2) / epoll_ctl(2) / epoll_wait(2) - Linux manual pages](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html)
- [epoll final interface (LWN, documenting epoll's introduction in 2.5.44)](https://lwn.net/Articles/16026/)
