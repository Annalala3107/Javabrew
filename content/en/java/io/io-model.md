---
title: "Detailed Explanation of Java IO Models"
description: "Detailed explanation of Java IO models: in-depth analysis of BIO (Blocking I/O), NIO (Non-blocking I/O), and AIO (Asynchronous I/O), I/O multiplexing mechanisms, Reactor/Proactor patterns, and clarification of synchronous vs. asynchronous and blocking vs. non-blocking concepts."
category: Java
tag:
  - Java IO
  - Java Basics
head:
  - - meta
    - name: keywords
      content: Java IO Models,BIO,NIO,AIO,Blocking IO,Non-blocking IO,I/O Multiplexing,Reactor Pattern,Proactor Pattern
lang: en
sourceRef: zh-ref/java/io/io-model.md
---

I/O models are genuinely quite difficult to understand because they require a lot of low-level computer systems knowledge. It took me quite a while to write this article, and I really hope I can share everything I know! I hope you find it helpful! While writing this article, I also consulted the book *UNIX Network Programming*—man, it is tough! My head hurts~

_My personal knowledge is limited. If there is anything in this article that needs to be supplemented, improved, or corrected, feel free to point it out in the comments so we can all improve together!_

## Preface

I/O has always been a topic that many developers find hard to grasp. In this article, I will walk you through my understanding of I/O and hope it helps you.

## I/O

### What Is I/O?

I/O (**I**nput/**O**utput) stands for **Input/Output**.

**Let's first interpret I/O from the perspective of computer architecture.**

According to the Von Neumann architecture, a computer system is divided into 5 major components: Arithmetic Logic Unit (ALU), Control Unit, Memory, Input Devices, and Output Devices.

![Von Neumann Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/watermark-type_ZmFuZ3poZW5naGVpdGk-shadow_10-tex-580962d6.jpg)

Input devices (such as a keyboard) and output devices (such as a monitor) are both external devices. Devices such as network interface cards (NICs) and hard disks can serve as both input devices and output devices.

Input devices feed data into the computer, while output devices receive data output by the computer.

**From the perspective of computer architecture, I/O describes the communication process between a computer system and external devices.**

**Next, let's interpret I/O from the perspective of an application.**

According to operating systems fundamentals: to ensure the stability and security of the operating system, a process's address space is divided into **User space** and **Kernel space**.

The applications we normally run execute in User space; only Kernel space can perform operations involving system-level resources, such as file management, inter-process communication, memory management, and so on. In other words, whenever we want to perform I/O operations, we must rely on the capabilities of Kernel space.

Moreover, programs in User space cannot directly access Kernel space.

When a program wants to perform an I/O operation, because it lacks the privileges to execute those operations directly, it can only issue a system call to ask the operating system to carry it out.

Therefore, if a user process wants to perform an I/O operation, it must indirectly access Kernel space via **system calls**.

In daily development, the ones we encounter most often are **Disk I/O (reading and writing files)** and **Network I/O (network requests and responses)**.

**From the application's perspective, our application initiates an I/O call (system call) to the operating system kernel, and the kernel executes the actual I/O operation. In other words, our application only initiates the I/O call; the actual execution of the I/O is carried out by the OS kernel.**

Taking a traditional read operation as an example, after an application initiates an I/O call, it typically goes through two steps:

1. The kernel waits for the I/O device to prepare the data.
2. The kernel copies the data from Kernel space to User space.

### What Are the Common I/O Models?

Under UNIX systems, there are 5 I/O models in total: **Synchronous Blocking I/O**, **Synchronous Non-blocking I/O**, **I/O Multiplexing**, **Signal-driven I/O**, and **Asynchronous I/O**.

These are the 5 I/O models we frequently refer to.

## 3 Common I/O Models in Java

### BIO (Blocking I/O)

**BIO belongs to the Synchronous Blocking I/O model**.

In the synchronous blocking I/O model, after an application initiates a `read` call, it remains blocked until the kernel copies the data into User space.

![Source: Deep Dive into Tomcat & Jetty](/media/jg/ext/oss.javaguide.cn/p3-juejin/6a9e704af49b4380bb686f0c96d33b81-tplv-k3u1fbpfcp-7b382797.png)

When the number of client connections is small, this works fine. However, when facing hundreds of thousands or even millions of connections, the traditional BIO model cannot cope. Therefore, we need a more efficient I/O processing model to handle higher concurrency.

### NIO (New I/O)

NIO in Java was introduced in Java 1.4, corresponding to the `java.nio` package, which provides abstractions such as `Channel`, `Selector`, and `Buffer`. The "N" in NIO stands for "New", and NIO provides both blocking and non-blocking channels; among them, selectable channels (`SelectableChannel`) can be configured in non-blocking mode. It supports buffer-oriented, channel-based I/O operations.

In Java NIO, network programming based on non-blocking `SelectableChannel` and `Selector` corresponds to the **I/O Multiplexing model**. However, the entire `java.nio` package should not be equated with I/O Multiplexing, as it also includes file I/O, blocking channels, and other APIs.

Follow along with my train of thought below, and I'm sure you'll find the answer!

Let's first take a look at the **Synchronous Non-blocking I/O model**.

![Source: Deep Dive into Tomcat & Jetty](/media/jg/ext/oss.javaguide.cn/p3-juejin/bb174e22dbe04bb79fe3fc126aed0c61-tplv-k3u1fbpfcp-351b2b45.png)

In the synchronous non-blocking I/O model, the application repeatedly initiates `read` calls; during the period while waiting for data to be copied from Kernel space to User space, the thread is still blocked until the kernel finishes copying the data to User space.

Compared to the synchronous blocking I/O model, the synchronous non-blocking I/O model is indeed a huge improvement. Through polling, it avoids staying blocked the entire time.

> In synchronous non-blocking I/O, when a `read` call is initiated and the data is not ready, the application does not have to block and wait; instead, it can switch to doing some small computation tasks and quickly return to issue the `read` call again—this is polling. This
> polling is not issued continuously without pause; there are intervals in between, and utilizing these intervals is what makes synchronous non-blocking I/O more efficient than synchronous blocking I/O.

However, this I/O model also has a problem: **the process of the application continuously making I/O system calls to poll whether data is ready consumes a great deal of CPU resources.**

At this point, the **I/O Multiplexing model** enters the scene.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/88ff862764024c3b8567367df11df6ab-tplv-k3u1fbpfcp-4971162d.png)

In the I/O Multiplexing model, the thread first initiates a `select` call to ask the kernel whether the data is ready; once the kernel prepares the data, the user thread then initiates a `read` call. The `read` call phase (data from Kernel space -> User space) is still blocking.

> Currently, system calls that support I/O Multiplexing include `select`, `epoll`, and so on. The `select` system call is supported on almost all operating systems.
>
> - **`select` call**: A system call provided by the kernel that supports querying the availability status of multiple system calls at once. Supported on almost all operating systems.
> - **`epoll` call**: Introduced in the Linux 2.6 kernel, an enhanced version of `select` that optimizes I/O execution efficiency.

**The I/O Multiplexing model reduces CPU resource consumption by minimizing invalid system calls.**

In Java NIO, there is a very important concept called the **Selector**, which can also be referred to as a **Multiplexer**. Through it, just a single thread can manage multiple client connections. A client is only served once its data arrives.

![Relationship among Buffer, Channel, and Selector](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-buffer-selector-35b44f0d.png)

### AIO (Asynchronous I/O)

AIO usually refers to the asynchronous channel API introduced with NIO.2 in Java 7. Besides asynchronous channels, NIO.2 also includes a new file system API.

Operations on asynchronous channels return immediately; the caller can obtain the result via a `Future`, or pass in a `CompletionHandler` to execute a callback after the operation completes.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/3077e72a1af049559e81d18205b56fd7-tplv-k3u1fbpfcp-7d15ae54.png)

Currently, AIO is still not widely adopted. Netty previously tried using AIO as well, but eventually abandoned it. This was because after Netty used AIO, performance on Linux systems did not show much improvement.

Finally, here is a diagram that briefly summarizes BIO, NIO, and AIO in Java.

![Comparison of BIO, NIO, and AIO](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/bio-aio-nio-d63f4d9c.png)

## References

- *Deep Dive into Tomcat & Jetty*
- How an I/O Operation Is Completed: <https://llc687.top/126.html>
- How Programmers Should Understand I/O: [https://www.jianshu.com/p/fa7bdc4f3de7](https://www.jianshu.com/p/fa7bdc4f3de7)
- Understand the Underlying Principles of Java NIO in 10 Minutes: <https://www.cnblogs.com/crazymakercircle/p/10225159.html>
- How Much Do You Know About I/O Models | Theory: <https://www.cnblogs.com/sheng-jie/p/how-much-you-know-about-io-models.html>
- *UNIX Network Programming, Volume 1: The Sockets Networking API*, Section 6.2: I/O Models
