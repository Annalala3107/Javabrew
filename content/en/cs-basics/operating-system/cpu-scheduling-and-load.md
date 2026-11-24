---
title: Detailed Explanation of CPU Scheduling and System Load
description: A comprehensive summary of high-frequency interview questions on CPU scheduling and system load. Starting with why processes and threads need scheduling, this guide explains preemption, time slices, priorities, context switching, classic scheduling algorithms, Linux CFS/EEVDF, load average, CPU utilization, I/O wait, and common troubleshooting commands.
category: CS Basics
tag:
  - Operating System
  - Linux
  - CPU Scheduling
head:
  - - meta
    - name: keywords
      content: CPU scheduling, process scheduling, thread scheduling, system load, load average, CPU utilization, iowait, CFS, EEVDF, top, uptime, vmstat, pidstat, mpstat, perf top, operating system interview questions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/cpu-scheduling-and-load.md
---

CPU scheduling is more than just algorithmic acronyms like FCFS, RR, and CFS. When troubleshooting production issues, you also need to understand why threads get swapped out, what context switching costs, and what it means when the load average is very high but CPU utilization remains low.

Behind these questions lies the same set of constraints: CPU cores are finite, tasks need to queue up, and the scheduler decides who runs first; system metrics then help determine whether tasks are competing for CPU, waiting on I/O, or stuck in the kernel, interrupts, or virtualization layers.

For example, consider a machine with 8 logical CPUs where the load average has climbed to 40, yet CPU capacity is still largely idle, and `wa` in `%Cpu(s)` stays persistently elevated. Searching directly for CPU hotspot functions at this point will likely yield nothing; the machine is far more likely stacked with tasks waiting on I/O. CPU utilization and load average must be evaluated separately.

## Why CPU Scheduling Is Needed

CPU cores are limited, while runnable tasks can be numerous.

In a Java service, business threads, GC threads, JIT compiler threads, and Netty event loop threads may all need to run; co-located on the same host might be log collectors, monitoring agents, cron jobs, and database clients. If the system has 8 logical CPUs available, at any given moment at most about 8 runnable tasks can occupy a CPU. The remaining tasks must queue up, sleep, or wait for I/O. In containerized environments, you must also consider the CPU quota rather than just the host's physical core count.

Different systems name the scheduled entity differently. When troubleshooting backend services, you can think of a Linux scheduling entity as any execution unit that the kernel can independently dispatch to run on a CPU.

A process can contain multiple threads. They share the process address space and file descriptors, but each thread maintains its own execution context including stack, registers, and program counter.

![Relationship between program, process, and thread](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/relationship-between-program-process-and-thread-97be3e79.png)

Inside the Linux kernel, both processes and threads are represented as `task`s; what the scheduler actually schedules is a task or a scheduling entity. A thread seen in user space almost always corresponds to a schedulable task in the kernel.

Without scheduling, an infinite loop on a single-core machine could monopolize the CPU indefinitely, leaving other programs no chance to respond. Multi-core machines merely increase the number of tasks running simultaneously from 1 to N; once the number of tasks exceeds the core count, queueing and switching are still inevitable.

The scheduler must balance interactive responsiveness, fairness, throughput, priority, real-time tasks, power consumption, and cache locality. These goals often conflict with one another: a longer time slice reduces switching overhead, but interactive tasks may wait longer; a shorter time slice improves responsiveness, but context switching overhead increases.

![CPU scheduler tradeoff relationship diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/scheduler-tradeoff-triangle-1f064b3b.webp)

## Several Scenarios Where a Task Leaves the CPU

A task departs from the CPU for several broad reasons. Expiring its time slice is only one of them.

The most common reason is that the task voluntarily yields the CPU. For instance, when a thread invokes `read()` on a disk and data is not yet ready, it enters a waiting state; when waiting on locks, condition variables, or timers, it also leaves the running state. The CPU should not sit idle waiting alongside it, so the scheduler picks another runnable task.

Another category is preemption. General-purpose operating systems typically adopt preemptive scheduling. After a task runs for a period of time, a timer interrupt provides the kernel with an opportunity to check; if the current task has run long enough, or if a more suitable task has become runnable, the kernel may swap the current task out.

To explain preemption clearly, many textbooks simplify this process as: a timer periodically generates a clock/timer interrupt.

This model illustrates the general mechanics of preemption well. However, modern Linux supports `NO_HZ` / tickless mode, which reduces scheduling clock ticks on idle CPUs or under specific configurations. While timers and scheduling ticks remain vital mechanisms for giving the kernel preemption check opportunities, production machines do not necessarily fire ticks at a fixed frequency all the time.

Priority also influences scheduling. Higher-priority tasks are placed further ahead in the queue, making lower-priority tasks wait more easily. If the system favors high-priority tasks completely, low-priority tasks may be starved of CPU time for extended periods—this is starvation. Textbook algorithms often mitigate starvation via dynamic priorities, aging, or queue promotions; real-world systems handle this depending on their scheduling classes and specific implementations.

Context switching occurs at the exact moment tasks are swapped. The kernel must save the current task's execution context—registers, program counter, stack pointer, etc.—and restore those of the next task. Switching across different processes brings additional costs from updating page tables, flushing/invalidating TLBs, and losing cache locality. When there are too many threads, severe lock contention, or frequent task sleeping and waking, CPU time may be drained by scheduling and synchronization before much business logic ever executes.

Thread pool size must be tuned based on task characteristics and CPU core counts. Threads can mask I/O latency and leverage multiple cores; however, when thread counts massively exceed CPU cores, run queues, context switching, cache invalidation, and lock contention all escalate accordingly.

## Classic Scheduling Algorithms

Interviews frequently ask about FCFS, SJF, RR, Priority Scheduling, and Multi-Level Feedback Queue (MLFQ).

Placing these algorithms in scenarios where short tasks, long tasks, and interactive tasks queue together makes their differences much easier to see. Keep in mind that these are simplified textbook models; real-world Linux general task scheduling does not copy any single one directly, but instead incorporates CFS/EEVDF, real-time scheduling classes, cgroups, CPU affinity, NUMA, and other mechanisms.

| Algorithm | Selection Strategy | Common Follow-Up Questions |
| --- | --- | --- |
| FCFS | First-Come, First-Served | When long tasks queue first, short tasks must also wait (convoy effect) |
| SJF | Shortest Job First | Difficult to predict how long a task will run in advance; long tasks may starve |
| RR | Round Robin: each task runs for one time slice in turn | Too short a time slice magnifies context switching; too long approaches FCFS |
| Priority Scheduling | Highest-priority task runs first | Low-priority tasks may wait indefinitely for CPU (starvation) |
| Multi-Level Feedback Queue (MLFQ) | Multiple priority queues, adjusting positions based on runtime behavior | Many rules and parameters, more complex implementation |

For example, if several large file compression tasks sit at the front of a thread pool queue, numerous subsequent requests that only query a cache will be forced to wait, dragging down average response times due to long tasks. SJF can alleviate this scenario, but with a strict prerequisite: the system must know in advance how long each task will run. Real systems do not possess such omniscience; they can only guess based on historical behavior, I/O waits, and interactive patterns.

Round Robin (RR) acts as the introductory model for time-sharing systems. Each task runs for one time slice and is placed back at the tail of the queue once finished. When a user types a command, moves a mouse, or sends a request, they don't have to wait for long tasks to finish completely before receiving a response. Because context switching incurs a fixed cost, shorter time slices mean switching overhead occupies a higher proportion of CPU time; lengthening the time slice amortizes switching costs, but interactive latency may increase.

Multi-Level Feedback Queue balances the response time of short tasks and the forward progress of long tasks simultaneously. New tasks generally enter a high-priority queue first; if a task consistently exhausts its entire time slice, resembling a CPU-intensive long task, it is gradually demoted; if it frequently yields voluntarily to wait on I/O, resembling an interactive or I/O-bound task, it retains higher priority. The number of queues, time slices, and promotion/demotion rules all affect scheduling performance, and real systems layer on even more mechanisms.

## From CFS to EEVDF

Linux general task scheduling relied on CFS (Completely Fair Scheduler) for a long time.

When understanding CFS, start with `vruntime`.

`vruntime` records how much a task has already run along a standardized "fairness timeline." After a task runs for an actual duration, the kernel scales this time into its virtual runtime; different nice values correspond to different weights, and thus different scaling rates. The scheduler prefers to select the task with the smallest `vruntime`, ensuring that tasks share CPU time proportionally according to their weights over the long run.

CFS does not have the fixed timeslice concept of legacy schedulers; it is closer to dividing CPU shares by weight over a period of time. When runnable tasks are few, each task can run a bit longer; when runnable tasks are numerous, the slices allocated to each task become shorter. CFS maintains runnable tasks ordered by virtual runtime in a red-black tree, typically picking the leftmost node—the task that has received relatively less CPU time on the fairness timeline.

Beginning with Linux 6.6, EEVDF (Earliest Eligible Virtual Deadline First) was introduced for general task scheduling.

EEVDF still revolves around fair CPU allocation, but introduces lag and virtual deadlines into task selection. A positive lag indicates that the task is owed CPU time; among eligible tasks, the task with the earliest virtual deadline is dispatched first. Latency-sensitive tasks requesting shorter time slices get scheduled sooner.

In Linux kernel code and tool output, general tasks still belong to the `fair` scheduling class. EEVDF changes the task selection logic within the fair class, but does not rename all scheduling concepts wholesale.

Whether a production machine is already using EEVDF depends on the actual kernel version and whether the distribution backported or tuned the relevant patches. During production troubleshooting, never assume all machines run the exact same scheduling implementation.

In backend interviews, you generally need to explain CFS's `vruntime`, weights, and fair shares, as well as EEVDF's lag, virtual deadline, and latency-sensitive tasks. Going deeper touches internal kernel implementation details.

![CFS vs. EEVDF comparison diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/cfs-eevdf-comparison-898fc546.webp)

## Load Average and CPU Utilization Are Not the Same Thing

The three load average figures seen in `uptime` correspond to average load across 1, 5, and 15-minute timescales. They are exponentially decaying averages, not simple arithmetic means of sampled values over the last N minutes.

Load average counts runnable tasks in the `R` state as well as uninterruptible sleep tasks in the `D` state. The `D` state is frequently related to I/O, but troubleshooting cannot focus solely on local disks; block devices, network storage, file systems, Swap, and other uninterruptible wait paths must all be taken into account.

Therefore, high load does not equate to the CPU being maxed out. It can stem from runnable tasks contending for CPU, or from a large number of tasks trapped in uninterruptible sleep.

Interpreting load must always be paired with the logical CPU core count. On a machine with 8 logical CPUs, a load around 8 might just mean the CPUs are fully saturated; a load of 40 usually indicates that a large batch of tasks is queueing or stuck in uninterruptible sleep. On a 1-core machine, a load of 8 is already under severe strain, whereas on a 64-core machine, a load of 8 is relatively light.

The fourth field of `/proc/loadavg` looks like `3/1024`. The number before the slash is the current count of runnable kernel scheduling entities, and the number after the slash is the total number of scheduling entities currently existing in the system. This field supplements the momentary task count at sampling time and can be evaluated alongside the first three average load values.

CPU utilization reflects where CPU time is actually spent. The common fields under `%Cpu(s)` in `top` can be read as follows:

- `us`: User-space time without adjusted nice values. Business logic computations, JSON serialization, regex matching, compression, and encryption/decryption typically fall here.
- `ni`: User-space time with adjusted nice values. Commonly seen in user processes whose priority has been lowered.
- `sy`: Kernel-space time. System calls, network protocol stacks, file systems, and kernel lock contention drive this up.
- `wa`: I/O wait. It indicates the time CPU is idle while the system has outstanding I/O requests. It serves well as a troubleshooting clue, but cannot be used in isolation for precise attribution.
- `id`: Idle time. The CPU has nothing to do, or tasks are blocked on other resources.
- `hi` / `si`: Hard interrupt / Soft interrupt time. Worth watching during heavy network packet volume, NIC interrupt concentration, or protocol stack processing pressure.
- `st`: Steal time taken by the hypervisor in virtualized environments. When this value spikes on cloud VMs, don't rush to rewrite business code first.

![Load average vs. CPU utilization comparison diagram](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/load-average-vs-cpu-usage-baef20d7.webp)

`wa` is especially prone to misinterpretation. `iowait` is not a reliable attribution: the CPU does not actually wait for I/O completion; in multi-core systems, tasks waiting on I/O are not actively running on any CPU either. Thus, a high `wa` only indicates a clue that I/O wait exists in the system—it does not directly prove the CPU is busy doing I/O.

The next step should be checking `vmstat`'s `b`, `bi/bo`, and `si/so`, and then using `pidstat -d` and `iostat -x` to locate specific processes and block devices.

## Troubleshooting Starting from a CPU Alert

When troubleshooting, do not dive blindly into Java thread dumps right away. First classify the type of pressure, then drill down into processes, threads, CPU cores, and hotspot functions.

![CPU alert troubleshooting flowchart](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/load-cpu-alert-triage-4a1773db.webp)

Run `uptime` first to inspect the load trend. If the 1-minute load is high while the 5-minute and 15-minute loads are low, it might be a temporary spike; if all three values are high, pressure has persisted for a while. Then open `top` and observe whether `%Cpu(s)` is dominated by `us`, `ni`, `sy`, `wa`, `si`, or `st`, while checking process sorting and task statuses.

If `us` is very high, locate business hotspots first. For Java processes, press `H` in `top` to toggle thread view, find the high-CPU thread, convert its thread ID (TID) to hexadecimal, and search for the matching stack in `jstack` or `jcmd Thread.print`. A single `jstack` captures only a split second, so it is best to take 2–3 consecutive dumps; if the same thread repeatedly stops in the same business stack trace, confidence is much higher. You can also run:

```bash
pidstat -u -t -p <pid> 1
```

This displays CPU utilization broken down by thread. Once the thread is pinned down, examine whether it is spinning in a business loop, serialization, regex, encryption/decryption, or stuck in GC/JIT. `jstack` is good for checking instantaneous stack frames; to find true CPU hotspots, sampling profilers like `perf top` or async-profiler are far more dependable.

If `sy` or `si` is high, do not fixate on Java stacks alone. High volumes of short-lived connections, network packet reception, file I/O, frequent system calls, and soft interrupts can all push CPU time into kernel mode. You can run:

```bash
mpstat -P ALL 1
sudo perf top
```

`mpstat` checks whether specific CPU cores are disproportionately busy, while `perf top` reveals whether hotspot symbols reside in user-space functions, the kernel network stack, softirq handlers, or lock paths. When one core hits 100% while others sit idle, watch out for single-thread bottlenecks, softirq concentration on a single core, CPU pinning configurations, or queue skew.

If load is high and `wa` is also high, first run:

```bash
vmstat 1
```

Pay special attention to `r`, `b`, `wa`, `bi`, `bo`, `si`, and `so`. `r` is the number of runnable tasks; `b` is not the count of all sleeping threads, but the number of tasks blocked waiting for I/O; `bi/bo` represents block device read/write throughput (typically in KiB/s, not I/O operations count); `si/so` represents Swap paging in and out. If `wa` is high while `b` and `bi/bo` are high, inspect the disks further; if `wa` is high while `si/so` is high, memory exhaustion and Swap swapping may have already crippled service performance.

Then use:

```bash
pidstat -d -p ALL 1
iostat -x 1
```

See which process is performing read/write operations and which block device exhibits high latency. In `iostat -x`, focus on `await`, `aqu-sz`, read/write throughput, and IOPS. `%util` has reference value for spinning hard disks; however, because RAID arrays, SSDs, and NVMe drives can process requests concurrently, you cannot rely on `%util` alone to determine if a drive is saturated. The first line of `iostat` is typically an average since boot, so troubleshooting active problems requires observing subsequent samples; if needed, use `iostat -x -y 1` to skip the first report.

If business processes show low I/O but system `wa` is high, check log compression, backups, local database operations, container image pulls, and other containers on the same node.

If the system supports PSI (Pressure Stall Information), you can also check:

```bash
cat /proc/pressure/cpu
cat /proc/pressure/io
cat /proc/pressure/memory
```

PSI measures how long tasks were stalled due to CPU, memory, or I/O pressure. `some` indicates that at least one task stalled due to a shortage of the corresponding resource; for memory and I/O, `full` indicates that all non-idle tasks stalled simultaneously. System-level `full` in `/proc/pressure/cpu` has no diagnostic meaning, so look primarily at `some` when diagnosing CPU pressure. PSI directly reflects whether services are stalling due to resource pressure—information that CPU utilization alone cannot provide.

In containerized environments, remember to check cgroup limits. A container might only be allocated a 2-core quota; even if the host machine has 64 cores, tasks inside the container may already be queueing up. Troubleshooting requires checking cgroup metrics such as `cpu.max`, `cpu.stat`, `cpu.pressure`, `memory.current`, `memory.events`, `memory.pressure`, `io.stat`, and `io.pressure`, rather than only examining total host CPU. The file names listed here reflect cgroup v2; if the system still uses cgroup v1, paths and filenames are split across different controller directories.

If load is high while `wa` is not high, and `r` in `vmstat 1` is consistently noticeably greater than the CPU core count, runnable tasks are piling up in the queue. Next, investigate thread counts, thread pools, lock contention, and context switches:

```bash
vmstat 1
pidstat -w -p ALL 1
ps -eo pid,ppid,stat,ni,pri,psr,pcpu,comm --sort=-pcpu | head
```

The `cs` column in `vmstat` shows the system context switch rate; in `pidstat -w`, focus on `cswch/s` and `nvcswch/s`. The former represents voluntary context switches, commonly seen when waiting on I/O, locks, or condition variables; the latter represents involuntary context switches, commonly seen when a task is preempted after its time slice expires. When thread pools are oversized, `r`, `cs`, and CPU utilization rise together while request latency deteriorates; adding more threads only exacerbates the congestion.

The `time` command is helpful for analyzing where an individual command spends its execution time:

```bash
/usr/bin/time -p <command>
```

`real` is wall-clock time, `user` is user-mode CPU time, and `sys` is kernel-mode CPU time. If `real` is very long but `user + sys` is low, the process spent time waiting on I/O, network, or locks; if `user` is high, the computation itself consumed CPU; if `sys` is high, look closely at system calls and kernel code paths.

## Common Troubleshooting Commands

The following commands can quickly categorize the direction of most CPU and load problems:

| Command | Typical Usage | Key Metrics to Watch |
| --- | --- | --- |
| `uptime` | `uptime` | 1, 5, and 15-minute load average |
| `top` | `top`, then press `H` | Total CPU, process/thread CPU, task states, load |
| `vmstat` | `vmstat 1` | `r`, `b`, `us/sy/wa/id/st`, `cs`, `bi/bo`, `si/so` |
| `pidstat` | `pidstat -u -d -w -t -p <pid> 1` | Per-process/thread CPU, I/O, context switching |
| `iostat` | `iostat -x 1` | Block device throughput, queue size, average wait time, utilization |
| `mpstat` | `mpstat -P ALL 1` | Per-CPU core utilization, iowait, softirq, steal |
| `ps` | `ps -eo pid,stat,ni,pri,psr,pcpu,comm --sort=-pcpu` | Process state, nice, priority, CPU core, CPU % |
| `perf top` | `sudo perf top` | Real-time CPU hotspot functions, distinguishing user-space from kernel hotspots |
| `PSI` | `cat /proc/pressure/{cpu,io,memory}` | Proportion of task stall time caused by CPU, I/O, and memory pressure |

The effectiveness of `perf top` depends on perf privileges and whether kernel symbols, user-space symbols, and JIT symbols can be resolved; in Java environments, combine it with async-profiler when necessary.

## Key Interview Takeaways

When answering questions about CPU scheduling, clarify why tasks queue, when the kernel switches tasks, and what costs those switches incur. This provides a much more complete answer than merely reciting algorithm names.

### CPU Scheduling

> CPU core counts are limited, while runnable processes and threads can be numerous. The scheduler picks tasks from the run queue to run on CPUs; when a task blocks, exhausts its time slice, changes priority, or a more suitable task emerges, the kernel performs scheduling and a context switch. Scheduling balances response time, throughput, fairness, and switching overhead; creating excessive threads can backfire by spending CPU time mostly on queueing and switching.

### How to Answer Classic Scheduling Algorithms

> FCFS is simple, but long tasks block short tasks (convoy effect); SJF offers optimal average turnaround time, but predicting task duration is difficult and long tasks can starve; RR uses time slices to improve responsiveness, though overly short slices amplify context switching overhead; Priority Scheduling captures urgency, but requires mechanisms to handle low-priority starvation; Multi-Level Feedback Queue adjusts queue positioning based on runtime behavior, favoring interactive tasks while allowing long tasks to make forward progress.

### Linux Scheduling

> Linux general task scheduling does not map directly onto a single textbook algorithm. CFS uses virtual runtime (`vruntime`) and weights to allocate CPU shares, prioritizing tasks that have received relatively less CPU time; EEVDF continues allocating based on fair shares, using lag to determine if a task is owed CPU time, and choosing tasks based on virtual deadlines. For general backend engineering roles, explaining at this level is sufficient.

### Load Average vs. CPU Utilization

> Load average counts runnable tasks in the `R` state and uninterruptible sleep tasks in the `D` state, and must be interpreted relative to the CPU core count. CPU utilization describes where CPU execution time is spent, where `us/ni/sy/wa/id/hi/si/st` represent normal user mode, nice user mode, kernel mode, I/O wait, idle, hardware interrupts, software interrupts, and virtualization steal time respectively. High load with low CPU utilization commonly stems from many tasks in uninterruptible sleep; high CPU utilization with moderate load often indicates a small number of threads saturating CPU cores.

If followed up with questions on troubleshooting methodology, you can explain: use `uptime` and `top` to identify the symptom, use `vmstat` to assess whether the issue is run queue saturation, I/O, or context switching, use `pidstat` and `mpstat` to isolate specific processes and CPU cores, and turn to `perf top` or profilers to identify hotspot functions when necessary.
