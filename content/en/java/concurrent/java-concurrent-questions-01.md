---
title: "Java Concurrency Common Interview Questions Summary (Part 1)"
description: "Fundamental Java concurrency interview questions: in-depth explanation of the differences between threads and processes, ways to create multiple threads, thread lifecycle states, the four conditions and prevention of deadlock, concurrency vs. parallelism, and other core concepts."
category: Java
tag:
  - Java Concurrency
head:
  - - meta
    - name: keywords
      content: Java Concurrency,Threads and Processes,Multithreading,Deadlock,Thread Lifecycle,Concurrent Programming,Java Interview Questions,Thread Creation
lang: en
sourceRef: zh-ref/java/concurrent/java-concurrent-questions-01.md
---

## Threads

### ⭐️ What Are a Thread and a Process?

#### What Is a Process?

A process is a single execution of a program and the basic unit for the system to run a program; therefore, a process is dynamic. Running a program in the system corresponds to the lifecycle of a process from creation, through execution, to termination.

In Java, when we start the `main` method, we are actually starting a JVM process, and the thread executing the `main` method is a thread within this process, also known as the main thread.

As shown in the figure below, by viewing Task Manager in Windows, we can clearly see the processes currently running on Windows (executions of `.exe` files).

![Process example - Windows](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/Windows-4993191f.png)

#### What Is a Thread?

A thread is similar to a process, but a thread is a smaller unit of execution than a process. A process can spawn multiple threads during its execution. Unlike processes, multiple threads of the same type within a process share the process's **Heap** and **Method Area** resources, while each thread has its own **Program Counter Register**, **VM Stack**, and **Native Method Stack**. Therefore, the system incurs much lower overhead when creating a thread or switching between threads compared to processes; for this reason, a thread is also called a lightweight process.

A Java program is inherently multithreaded. We can inspect what threads exist in an ordinary Java program via JMX, as shown in the code below.

```java
public class MultiThread {
	public static void main(String[] args) {
		// Get the Java thread management MXBean
	ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
		// Do not get locked monitor and synchronizer info; only get thread and thread stack info
		ThreadInfo[] threadInfos = threadMXBean.dumpAllThreads(false, false);
		// Traverse thread info and print only thread ID and thread name
		for (ThreadInfo threadInfo : threadInfos) {
			System.out.println("[" + threadInfo.getThreadId() + "] " + threadInfo.getThreadName());
		}
	}
}
```

The output of the program above is as follows (the exact output may vary; don't worry too much about what each thread below does—just know that the `main` thread executes the `main` method):

```plain
[5] Attach Listener // Add events
[4] Signal Dispatcher // Thread that dispatches and handles signals sent to the JVM
[3] Finalizer // Thread that invokes the finalize method of objects
[2] Reference Handler // Thread that clears references
[1] main // main thread, program entry point
```

From the output above, we can see that **the execution of a Java program runs the `main` thread alongside multiple other threads simultaneously**.

### What Is the Difference Between Java Threads and OS Threads?

Early JDK versions used Green Threads to implement user-level threads. Later, traditional threads created via `new Thread()` in HotSpot are implemented using Platform Threads, which are typically mapped 1:1 to OS threads and scheduled by the operating system. Virtual Threads, officially introduced in Java 21, are scheduled by the JVM, allowing a large number of virtual threads to multiplex onto a smaller number of platform threads as carriers; therefore, you can no longer equate all Java threads with OS threads.

We mentioned user threads and kernel threads above. Since many readers may not be familiar with the difference between the two, here is a brief introduction:

- User Threads: Threads managed and scheduled by user-space programs, running in user space (dedicated to applications).
- Kernel Threads: Threads managed and scheduled by the operating system kernel, running in kernel space (accessible only to kernel programs).

Let's briefly summarize the differences and characteristics of user threads and kernel threads: User-level threads are typically scheduled in user space by the runtime, with lower creation and switching costs; whether they can utilize multiple cores depends on the mapping model between user threads and kernel threads—a many-to-one model cannot utilize multiple cores in parallel, whereas a many-to-many model can. Kernel threads are scheduled by the operating system, typically have higher creation and switching costs, and can directly utilize multiple cores.

To summarize the relationship between Java threads and OS threads in one sentence: **Platform threads are typically mapped to OS threads, whereas virtual threads are scheduled by the JVM and mounted onto platform threads for execution.**

A threading model defines the association between user threads and kernel threads. There are three common threading models:

1. One-to-One (one user thread corresponds to one kernel thread)
2. Many-to-One (multiple user threads map to one kernel thread)
3. Many-to-Many (multiple user threads map to multiple kernel threads)

![Three common threading models](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/three-types-of-thread-models-6adf6f60.png)

On mainstream operating systems such as Windows and Linux, HotSpot platform threads typically use the one-to-one model—that is, one platform thread corresponds to one OS thread. Virtual threads do not use this one-to-one mapping; instead, they are scheduled by the JVM to execute on a pool of platform threads.

### ⭐️ Briefly Describe the Relationship, Differences, and Pros/Cons of Threads and Processes

The diagram below shows the Java memory areas. Using this diagram, let's explain the relationship between threads and processes from the JVM perspective.

![Java Runtime Data Areas (after JDK 1.8)](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/java-runtime-data-areas-jdk1.8-6401fdf0.png)

As seen in the diagram above, a single process can contain multiple threads. Multiple threads share the process's **Heap** and **Method Area (Metaspace since JDK 1.8)** resources, while each thread has its own **Program Counter Register**, **VM Stack**, and **Native Method Stack**.

**Summary:** A thread is a smaller execution unit subdivided from a process. The biggest difference between threads and processes is that processes are basically independent of one another, whereas threads are not necessarily so, since threads within the same process are very likely to affect each other. Threads have lower execution overhead, but are less conducive to resource management and protection; processes are the exact opposite.

Below is extended material on this topic!

Let's think about this question: Why are the **Program Counter Register**, **VM Stack**, and **Native Method Stack** thread-private, while the **Heap** and **Method Area** are shared across threads?

#### Why Is the Program Counter Register Private?

The Program Counter Register primarily serves the following two purposes:

1. The bytecode interpreter reads instructions sequentially by changing the Program Counter Register, thereby implementing control flow such as sequential execution, branching, looping, and exception handling.
2. In a multithreaded environment, the Program Counter Register is used to record the current thread's execution position, so that when the thread is switched back in, it knows where it left off last time.

Note that if a `native` method is being executed, the Program Counter Register holds an `undefined` address; only when executing Java code does the Program Counter Register record the address of the next instruction.

Therefore, the Program Counter Register is thread-private mainly **so that a thread can resume at the correct execution position after a thread switch**.

#### Why Are the VM Stack and Native Method Stack Private?

- **VM Stack:** Before each Java method executes, a stack frame is created to store the local variable table, operand stack, constant pool references, and other information. The process from method invocation to completion corresponds to pushing and popping a stack frame on the Java Virtual Machine Stack.
- **Native Method Stack:** Plays a very similar role to the VM Stack; the difference is that **the VM Stack serves the JVM executing Java methods (i.e., bytecode), whereas the Native Method Stack serves Native methods used by the JVM**. In the HotSpot VM, it is combined with the Java VM Stack into one.

Therefore, to **ensure that a thread's local variables cannot be accessed by other threads**, the VM Stack and Native Method Stack are thread-private.

#### A One-Sentence Overview of the Heap and Method Area

The Heap and Method Area are resources shared by all threads. The Heap is the largest block of memory in a process, primarily used to store newly created objects (almost all objects are allocated memory here), while the Method Area is primarily used to store loaded class information, constants, static variables, code compiled by the JIT compiler, and other data.

### How Do You Create a Thread?

Generally speaking, there are many ways to create threads, such as extending the `Thread` class, implementing the `Runnable` interface, implementing the `Callable` interface, using a thread pool, using the `CompletableFuture` class, and so on.

However, these approaches do not actually create a thread on their own. More accurately, they are all ways to use multithreading in Java code.

Strictly speaking, Java only has one way to create a thread, which is via `new Thread().start()`. Regardless of which approach you use, it ultimately relies on `new Thread().start()`.

### ⭐️ Describe the Lifecycle and States of a Thread

At any given moment during its execution lifecycle, a Java thread can only be in one of the following 6 states:

- NEW: Initial state; the thread has been created, but `start()` has not yet been called on it.
- RUNNABLE: Runnable/running state; `start()` has been called on the thread and it is running or waiting to run.
- BLOCKED: Blocked state; waiting for a lock to be released.
- WAITING: Waiting state; indicates the thread needs to wait for other threads to perform certain specific actions (notification or interruption).
- TIMED_WAITING: Timed waiting state; can return automatically after a specified period rather than waiting indefinitely like WAITING.
- TERMINATED: Terminated state; indicates the thread has finished executing.

A thread is not fixed in a single state throughout its lifecycle; rather, it transitions between different states as code executes.

Java thread state transition diagram (Image source: [Correction | Three Errors Regarding Thread States in *The Art of Java Concurrency Programming*](https://mp.weixin.qq.com/s/0UTyrJpRKaKhkhHcQtXAiA)):

![Java thread state transition diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/640-8103777c.png)

As shown in the diagram above, after a thread is created, it is in the **NEW** state. After calling the `start()` method, it begins running and enters the **READY** state. Once a thread in the READY state obtains a CPU timeslice, it enters the **RUNNING** state.

> At the operating system level, threads have READY and RUNNING states; at the JVM level, however, only the RUNNABLE state is visible (Image source: [HowToDoInJava](https://howtodoinJava.com/ "HowToDoInJava"): [Java Thread Life Cycle and Thread States](https://howtodoinJava.com/Java/multi-threading/Java-thread-life-cycle-and-thread-states/ "Java Thread Life Cycle and Thread States")), so Java systems generally group these two states together under **RUNNABLE**.
>
> **Why doesn't the JVM distinguish between these two states?** Java's `Thread.State` describes thread states at the JVM level and is not intended to reflect all internal states of the OS scheduler. The specific scheduling policy, timeslice length, and whether round-robin scheduling is used are all determined by the OS and its configuration, and cannot be generalized as a fixed 10–20 ms round-robin schedule.

![RUNNABLE-VS-RUNNING](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/RUNNABLE-VS-RUNNING-497c7636.png)

- After a thread executes the `wait()` method, it enters the **WAITING** state. A thread in the WAITING state relies on notifications from other threads to return to the RUNNABLE state.
- The **TIMED_WAITING** state builds on the WAITING state by adding a timeout limit—for example, calling `sleep(long millis)` or `wait(long millis)` places the thread into the TIMED_WAITING state. When the timeout expires, the thread returns to the RUNNABLE state.
- When a thread attempts to enter a `synchronized` method/block, or re-enters a `synchronized` method/block after calling `wait()` (and being `notify()`-ed), while the lock is held by another thread, the thread enters the **BLOCKED** state.
- After a thread finishes executing its `run()` method, it enters the **TERMINATED** state.

### What Is Thread Context Switching?

During execution, a thread maintains its own execution conditions and state (also called its context), such as the Program Counter Register and stack information mentioned earlier. A thread yields control of the CPU when any of the following occurs:

- Voluntarily yielding the CPU, such as calling `sleep()`, `wait()`, etc.
- Timeslice exhaustion, because the OS prevents a single thread or process from occupying the CPU for too long and starving other threads or processes.
- Invoking a blocking system interrupt, such as requesting I/O, which blocks the thread.
- Being terminated or finishing execution.

The first three cases trigger a thread switch. Thread switching means saving the current thread's context so that its state can be restored the next time it occupies the CPU, and loading the context of the next thread about to occupy the CPU. This is what is called a **context switch**.

Context switching is a fundamental function of modern operating systems. Because each switch requires saving and restoring state, it consumes CPU, memory, and other system resources to process, meaning there is a certain efficiency overhead. Frequent switching degrades overall performance.

### Comparison Between Thread#sleep() and Object#wait()

**Commonality:** Both can pause the execution of a thread.

**Differences:**

- **`sleep()` does not release the lock, whereas `wait()` releases the lock.**
- `wait()` is typically used for inter-thread interaction/communication, whereas `sleep()` is typically used to pause execution.
- After `wait()` is called, the thread does not wake up automatically; another thread must call `notify()` or `notifyAll()` on the same object. Once `sleep()` finishes, the thread wakes up automatically—or you can use `wait(long timeout)`, after which the thread wakes up automatically upon timeout.
- `sleep()` is a `static native` method of the `Thread` class, whereas `wait()` is a `native` method of the `Object` class. Why was it designed this way? The next question addresses this.

### Why Is wait() Not Defined in Thread?

`wait()` puts a thread that holds an object lock into a waiting state and automatically releases the object lock currently held by that thread. Every object (`Object`) has an object lock. Since it needs to release the object lock currently held by the thread and put the thread into the WAITING state, it naturally must operate on the corresponding object (`Object`) rather than the current thread (`Thread`).

A similar question: **Why is `sleep()` defined in `Thread`?**

Because `sleep()` simply pauses execution of the current thread; it does not involve any object class and does not require acquiring an object lock.

### Can You Call the Thread Class's run() Method Directly?

This is another very classic Java multithreading interview question that comes up frequently in interviews. It is very simple, yet many people fail to answer it properly!

When you instantiate a `Thread` with `new`, the thread enters the NEW state. Calling the `start()` method starts a thread and places it in the ready state, allowing it to begin running once allocated a timeslice. `start()` performs the necessary thread initialization and then automatically executes the contents of `run()`—this is true multithreaded execution. However, calling `run()` directly treats `run()` as an ordinary method executed on the calling thread, so it is not multithreaded execution.

**Summary: Only calling the `start()` method starts a thread and places it in the ready state; calling `run()` directly will not execute it in a multithreaded manner.**

## Multithreading

### Difference Between Concurrency and Parallelism

- **Concurrency:** Two or more tasks executing within the same **time interval**.
- **Parallelism:** Two or more tasks executing at the exact same **instant**.

The key distinction is whether they execute **at the exact same instant**.

### Difference Between Synchronous and Asynchronous

- **Synchronous:** After issuing a call, the call cannot return until a result is obtained; it keeps waiting.
- **Asynchronous:** After issuing a call, it returns immediately without waiting for the return result.

### ⭐️ Why Use Multithreading?

First, looking at the big picture:

- **From the underlying computer perspective:** Threads can be thought of as lightweight processes and are the smallest unit of program execution; the cost of switching and scheduling between threads is far smaller than that of processes. Additionally, the multi-core CPU era means multiple threads can run simultaneously, reducing thread context-switching overhead.
- **From modern internet development trends:** Today's systems routinely require millions or even tens of millions of concurrent requests. Multithreaded concurrent programming is the foundation for building high-concurrency systems, and leveraging multithreading mechanisms effectively can greatly improve overall system concurrency capacity and performance.

Diving deeper into the underlying computer architecture:

- **Single-core era:** In the single-core era, multithreading was primarily used to improve a single process's efficiency in utilizing both the CPU and I/O systems. Suppose only one Java process is running: when making an I/O request, if the Java process has only one thread, that thread gets blocked by I/O and the entire process blocks. Only one of the CPU and I/O devices is active at a time, so overall system efficiency could loosely be described as 50%. When using multithreading, while one thread is blocked on I/O, other threads can continue using the CPU, thereby improving the Java process's overall resource utilization efficiency.
- **Multi-core era:** In the multi-core era, multithreading is primarily used to improve a process's ability to utilize multi-core CPUs. For example, suppose we need to compute a complex task. If we only use one thread, regardless of how many CPU cores the system has, only one CPU core will be utilized. By creating multiple threads, those threads can be mapped onto multiple underlying CPU cores for execution. Provided there is no resource contention among the threads in the task, execution efficiency improves significantly, roughly equal to `(single-core execution time / number of CPU cores)`.

### ⭐️ Does a Single-Core CPU Support Java Multithreading?

Yes, a single-core CPU supports Java multithreading. The operating system allocates CPU time to different threads through time-slice round-robin scheduling. Even though a single-core CPU can only execute one task at any given instant, switching rapidly between multiple threads creates the illusion for the user that multiple tasks are running simultaneously.

While we're here, let's also mention the thread scheduling mechanism used by Java.

Operating systems primarily manage multithreaded execution through two thread scheduling strategies:

- **Preemptive Scheduling:** The operating system decides when to pause the currently running thread and switch to another thread. Such switches are typically triggered by system clock interrupts (time-slice round-robin) or other high-priority events (such as I/O completion). This approach incurs context-switching overhead, but provides good fairness and CPU utilization and is less prone to stalling.
- **Cooperative Scheduling:** After a thread finishes its work, it voluntarily notifies the system to switch to another thread. This approach reduces performance overhead from context switching, but has poorer fairness and is prone to blocking.

Java uses preemptive thread scheduling. That is, the JVM itself is not responsible for thread scheduling; instead, it delegates thread scheduling to the operating system. The OS typically schedules thread execution based on thread priority and timeslices, with higher-priority threads generally getting more opportunities to receive CPU timeslices.

### ⭐️ Does Running Multiple Threads on a Single-Core CPU Always Improve Efficiency?

Whether running multiple threads concurrently on a single-core CPU improves efficiency depends on the type of threads and the nature of the tasks. Generally, there are two types of threads:

1. **CPU-intensive (CPU-bound):** CPU-intensive threads primarily perform computation and logic processing, consuming a large amount of CPU resources.
2. **I/O-intensive (I/O-bound):** I/O-intensive threads primarily perform input/output operations—such as reading/writing files or network communication—waiting for responses from I/O devices without consuming much CPU.

On a single-core CPU, only one thread can run at any given instant, while other threads must wait for CPU timeslices to be allocated. If the threads are CPU-intensive, running multiple threads concurrently leads to frequent thread switching, increasing system overhead and lowering efficiency. If the threads are I/O-intensive, running multiple threads concurrently takes advantage of CPU idle time while waiting for I/O, thereby improving efficiency.

Therefore, on a single-core CPU, if tasks are CPU-intensive, spawning many threads hurts efficiency; if tasks are I/O-intensive, spawning many threads improves efficiency. Of course, "many" here must still be within reason and not exceed what the system can handle.

### What Problems Can Multithreading Cause?

The purpose of concurrent programming is to improve program execution efficiency and thus execution speed. However, concurrent programming does not always increase speed, and it can introduce many issues, such as memory leaks, deadlocks, thread safety bugs, and more.

### How Do You Understand Thread-Safe vs. Thread-Unsafe?

Thread-safe and thread-unsafe describe whether access to the same piece of data in a multithreaded environment can guarantee its correctness and consistency.

- Thread-safe means that in a multithreaded environment, no matter how many threads access the same data simultaneously, the correctness and consistency of that data are guaranteed.
- Thread-unsafe means that in a multithreaded environment, simultaneous access to the same data by multiple threads may cause data corruption, errors, or data loss.

## ⭐️ Deadlock

### What Is Thread Deadlock?

Thread deadlock describes a situation where multiple threads are blocked simultaneously, with one or all of them waiting for a resource to be released. Because the threads are blocked indefinitely, the program cannot terminate normally.

As shown in the figure below, Thread A holds resource 2 and Thread B holds resource 1; both want to request each other's resource at the same time, so the two threads wait on each other and enter a deadlock state.

![Deadlock scenario diagram: Thread A holds resource1 and waits for resource2, Thread B holds resource2 and waits for resource1, forming a closed wait cycle](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/dead-lock-deadlock-scenario-13be7e13.png)

Let's illustrate thread deadlock with an example. The code below simulates the deadlock scenario shown above (code sourced from *The Beauty of Concurrent Programming*):

```java
public class DeadLockDemo {
    private static Object resource1 = new Object();// Resource 1
    private static Object resource2 = new Object();// Resource 2

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "线程 1").start();

        new Thread(() -> {
            synchronized (resource2) {
                System.out.println(Thread.currentThread() + "get resource2");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource1");
                synchronized (resource1) {
                    System.out.println(Thread.currentThread() + "get resource1");
                }
            }
        }, "线程 2").start();
    }
}
```

Output

```plain
Thread[线程 1,5,main]get resource1
Thread[线程 2,5,main]get resource2
Thread[线程 1,5,main]waiting get resource2
Thread[线程 2,5,main]waiting get resource1
```

Thread A acquires the monitor lock of `resource1` via `synchronized (resource1)`, then sleeps for 1 second via `Thread.sleep(1000);` so that Thread B gets a chance to run and acquire the monitor lock of `resource2`. Once Thread A and Thread B finish sleeping, both try to acquire each other's resource, causing the two threads to wait indefinitely on one another—and thus a deadlock occurs.

The example above satisfies all four necessary conditions for deadlock:

1. **Mutual Exclusion Condition:** Each resource can only be occupied by one thread at any given time.
2. **Hold and Wait Condition:** When a thread is blocked requesting a resource, it holds onto the resources it has already acquired.
3. **No Preemption Condition:** Resources already acquired by a thread cannot be forcibly taken away by other threads before the thread finishes using them; they are released only when the thread itself is done with them.
4. **Circular Wait Condition:** A closed head-to-tail chain of threads forms, where each thread waits for a resource held by the next.

### How Do You Detect Deadlock?

- Use `jstack <pid>` or `jcmd <pid> Thread.print -l` to inspect thread stacks and concurrent lock information. If a Java-level deadlock is detected, the output will list the involved threads along with the locks they hold and wait for. `jmap` is primarily used to inspect heap information or generate heap dumps, and is not a thread deadlock diagnostic tool.
- Use tools such as VisualVM or JConsole to investigate.

Here we demonstrate using the JConsole tool.

First, locate the JDK's `bin` directory, find `jconsole`, and double-click to open it.

![jconsole](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jdk-home-bin-jconsole-2cf07489.png)

For Mac users, you can check JDK installation directories via `/usr/libexec/java_home -V`, and once found, open it via `open .` + the folder path. For example, a local JDK path on my machine is:

```bash
 open . /Users/guide/Library/Java/JavaVirtualMachines/corretto-1.8.0_252/Contents/Home
```

After opening `jconsole`, connect to the target program, go to the Threads tab, and select "Detect Deadlock"!

![jconsole detect deadlock](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-29a7f927.png)

![jconsole deadlock detected](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jconsole-check-deadlock-done-3ff1d402.png)

### How Do You Prevent and Avoid Thread Deadlock?

**How to prevent deadlock?** Simply break one of the necessary conditions for deadlock:

1. **Break the Hold and Wait condition:** Request all required resources at once.
2. **Break the No Preemption condition:** When a thread holding some resources requests additional resources and cannot obtain them, it proactively releases the resources it currently holds.
3. **Break the Circular Wait condition:** Prevent it by acquiring resources in a fixed order. Acquire resources in a designated order, and release them in the reverse order—this breaks the circular wait condition.

**How to avoid deadlock?**

Deadlock avoidance means using algorithms (such as the Banker's Algorithm) during resource allocation to evaluate and compute allocations so that the system stays in a safe state.

> **Safe State** means the system can find some progression order of threads (`P1, P2, P3, ..., Pn`) to allocate the needed resources to each thread until every thread's maximum resource demand is satisfied, allowing every thread to complete smoothly. Such a sequence `<P1, P2, P3, ..., Pn>` is called a safe sequence.

If we modify the code for Thread 2 as shown below, deadlock will no longer occur.

```java
new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "线程 2").start();
```

Output:

```plain
Thread[线程 1,5,main]get resource1
Thread[线程 1,5,main]waiting get resource2
Thread[线程 1,5,main]get resource2
Thread[线程 2,5,main]get resource1
Thread[线程 2,5,main]waiting get resource2
Thread[线程 2,5,main]get resource2

Process finished with exit code 0
```

Let's analyze why the code above avoids deadlock:

Thread 1 first acquires the monitor lock of `resource1`, so Thread 2 cannot acquire it at that moment. Then Thread 1 proceeds to acquire the monitor lock of `resource2` and succeeds. Once Thread 1 releases its monitor locks on `resource1` and `resource2`, Thread 2 can acquire them and execute. This breaks the circular wait condition and therefore avoids deadlock.
