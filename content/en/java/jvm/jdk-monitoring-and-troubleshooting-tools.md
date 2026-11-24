---
title: Summary of JDK Monitoring and Troubleshooting Tools
description: A summary of common JDK monitoring and troubleshooting tools with usage examples to help locate and analyze JVM issues.
category: Java
tag:
  - JVM
lang: en
sourceRef: zh-ref/java/jvm/jdk-monitoring-and-troubleshooting-tools.md
head:
  - - meta
    - name: keywords
      content: JDK tools,jps,jstat,jmap,jstack,jvisualvm,diagnostics,monitoring
---

## JDK Command-Line Tools

These commands are located in the `bin` directory under the JDK installation directory:

- **`jps`** (JVM Process Status): Similar to the UNIX `ps` command. Used to view information such as the startup class, passed arguments, and Java Virtual Machine parameters of all Java processes.
- **`jstat`** (JVM Statistics Monitoring Tool): Used to collect runtime data from various aspects of the HotSpot Virtual Machine.
- **`jinfo`** (Configuration Info for Java): Displays configuration information of the virtual machine.
- **`jmap`** (Memory Map for Java): Generates heap dump snapshots.
- **`jhat`** (JVM Heap Dump Browser): Used to analyze heapdump files. It launches an HTTP/HTML server so users can view analysis results in a browser. JDK 9 removed `jhat`.
- **`jstack`** (Stack Trace for Java): Generates a thread snapshot of the virtual machine at the current moment; a thread snapshot is a collection of the method call stacks currently being executed by every thread inside the virtual machine.

### `jps`: View All Java Processes

The `jps` (JVM Process Status) command is similar to the UNIX `ps` command. It lists JVM processes that the current user has permission to access and that can be discovered by the tool, and does not guarantee enumerating every Java process on the system.

`jps`: Displays the main class name executed by the virtual machine and the Local Virtual Machine Identifier (`LVMID`) of these processes. `jps -q`: Outputs only the local virtual machine unique IDs of the processes.

```powershell
C:\Users\SnailClimb>jps
7360 NettyClient2
17396
7972 Launcher
16504 Jps
17340 NettyServer
```

`jps -l`: Outputs the full name of the main class; if the process executes a JAR package, it outputs the JAR path.

```powershell
C:\Users\SnailClimb>jps -l
7360 firstNettyDemo.NettyClient2
17396
7972 org.jetbrains.jps.cmdline.Launcher
16492 sun.tools.jps.Jps
17340 firstNettyDemo.NettyServer
```

`jps -v`: Outputs the JVM arguments passed when the virtual machine process started.

`jps -m`: Outputs the arguments passed to the Java process's `main()` method.

### `jstat`: Monitor Various Runtime Status Information of the Virtual Machine

`jstat` (JVM Statistics Monitoring Tool) is a command-line tool used to monitor various runtime status information of the virtual machine. It can display runtime data such as class information, memory, garbage collection, and JIT compilation in local or remote (requiring RMI support on the remote host) virtual machine processes. On servers without a GUI that only provide a plain-text console environment, it is the tool of choice for locating virtual machine performance issues at runtime.

**`jstat` command syntax:**

```powershell
jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]
```

For example, `jstat -gc -h3 31736 1000 10` means analyzing the GC status of the process with ID `31736`, printing a record every `1000ms`, stopping after `10` prints, and printing the metric header after every `3` lines.

**Common options are as follows:**

- `jstat -class vmid`: Displays ClassLoader-related information.
- `jstat -compiler vmid`: Displays JIT compilation-related information.
- `jstat -gc vmid`: Displays GC-related heap information.
- `jstat -gccapacity vmid`: Displays the capacity and usage of each generation.
- `jstat -gcnew vmid`: Displays Young Generation information.
- `jstat -gcnewcapacity vmid`: Displays Young Generation size and usage.
- `jstat -gcold vmid`: Displays Old Generation behavior statistics; in modern JDKs, the output also includes statistics for Metaspace, Compressed Class Space, and similar areas.
- `jstat -gcoldcapacity vmid`: Displays Old Generation size.
- `jstat -gcpermcapacity vmid`: Displays Permanent Generation size; starting from JDK 8, this option no longer exists. Modern JDKs can use `-gcmetacapacity` to view Metaspace capacity statistics.
- `jstat -gcutil vmid`: Displays garbage collection information.

Additionally, adding the `-t` parameter adds a `Timestamp` column to the output, showing the uptime of the program.

### `jinfo`: View and Adjust Virtual Machine Parameters in Real Time

`jinfo vmid`: Outputs all parameters and system properties of the current JVM process (the first part consists of system properties, and the second part consists of JVM parameters).

`jinfo -flag name vmid`: Outputs the concrete value of the parameter with the corresponding name, such as `MaxHeapSize`. The examples below for inspecting and dynamically adjusting `PrintGC` target JDK 8; in JDK 9 and later, GC logging should use the unified logging flag `-Xlog`, which can be adjusted at runtime via `jcmd VM.log`.

```powershell
C:\Users\SnailClimb>jinfo  -flag MaxHeapSize 17340
-XX:MaxHeapSize=2124414976
C:\Users\SnailClimb>jinfo  -flag PrintGC 17340
-XX:-PrintGC
```

`jinfo` can dynamically modify a subset of JVM parameters marked as manageable without restarting the virtual machine; not all parameters support runtime modification. See the JDK 8 example below:

`jinfo -flag [+|-]name vmid` enables or disables the parameter with the corresponding name.

```powershell
C:\Users\SnailClimb>jinfo  -flag  PrintGC 17340
-XX:-PrintGC

C:\Users\SnailClimb>jinfo  -flag  +PrintGC 17340

C:\Users\SnailClimb>jinfo  -flag  PrintGC 17340
-XX:+PrintGC
```

### `jmap`: Generate Heap Dump Snapshots

The `jmap` (Memory Map for Java) command is used to generate heap dump snapshots. If you do not use the `jmap` command, to obtain a Java heap dump, you can use the `-XX:+HeapDumpOnOutOfMemoryError` parameter so the virtual machine automatically generates a dump file after an OOM error occurs. On Linux/macOS, `kill -3 <pid>` sends `SIGQUIT`, causing HotSpot to print Java thread stacks to standard error—this produces a thread dump rather than a heap dump.

`jmap` does more than just generate dump files; it can also query the finalizer queue, Java heap, ClassLoader information, and more, with specific subcommands varying across JDK versions. The Permanent Generation only existed in older versions of HotSpot; the corresponding output in modern JDKs covers Metaspace or ClassLoader statistics. Just like `jinfo`, some features of `jmap` are also restricted by the operating system and attachment permissions to the target process.

Example: Dump the heap snapshot of the specified application to the Desktop. Afterward, you can analyze this heap file with tools such as `jhat` or VisualVM.

```powershell
C:\Users\SnailClimb>jmap -dump:format=b,file=C:\Users\SnailClimb\Desktop\heap.hprof 17340
Dumping heap to C:\Users\SnailClimb\Desktop\heap.hprof ...
Heap dump file created
```

### **`jhat`**: Analyze `heapdump` Files

**`jhat`** is used to analyze `heapdump` files. It starts an HTTP/HTML server so users can inspect the analysis results in a browser.

```powershell
C:\Users\SnailClimb>jhat C:\Users\SnailClimb\Desktop\heap.hprof
Reading from C:\Users\SnailClimb\Desktop\heap.hprof...
Dump file created Sat May 04 12:30:31 CST 2019
Snapshot read, resolving...
Resolving 131419 objects...
Chasing references, expect 26 dots..........................
Eliminating duplicate references..........................
Snapshot resolved.
Started HTTP server on port 7000
Server is ready.
```

Visit <http://localhost:7000/>.

Note ⚠️: JDK 9 removed `jhat` ([JEP 241: Remove the jhat Tool](https://openjdk.org/jeps/241)). You can use its alternatives Eclipse Memory Analyzer Tool (MAT) and VisualVM, which are also officially recommended.

### **`jstack`**: Generate a Thread Snapshot of the Virtual Machine at the Current Moment

The `jstack` (Stack Trace for Java) command is used to generate a thread snapshot of the virtual machine at the current moment. A thread snapshot is a collection of the method call stacks currently being executed by every thread inside the virtual machine.

The main purpose of generating a thread snapshot is to locate the cause of prolonged thread pauses—such as deadlocks between threads, infinite loops, or long waits caused by external resource requests. When threads hang, using `jstack` to inspect the call stack of each thread lets you see what unresponsive threads are doing in the background or what resources they are waiting on.

**The code below uses sleep to increase the probability of two threads holding locks mutually, demonstrating how to inspect a deadlock via `jstack`. Thread scheduling is non-deterministic, so it cannot strictly guarantee reproducing the deadlock on every run.**

```java
public class DeadLockDemo {
    private static Object resource1 = new Object();// resource 1
    private static Object resource2 = new Object();// resource 2

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
        }, "Thread 1").start();

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
        }, "Thread 2").start();
    }
}
```

Output

```plain
Thread[Thread 1,5,main]get resource1
Thread[Thread 2,5,main]get resource2
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 2,5,main]waiting get resource1
```

Thread A acquires the monitor lock of `resource1` via `synchronized (resource1)`, and then calls `Thread.sleep(1000);` to let Thread A sleep for 1s so that Thread B gets scheduled and acquires the monitor lock of `resource2`. After Thread A and Thread B finish sleeping, both attempt to acquire each other's resource, causing the two threads to fall into a state of mutual waiting—resulting in a deadlock.

**Analyzing via the `jstack` command:**

```powershell
C:\Users\SnailClimb>jps
13792 KotlinCompileDaemon
7360 NettyClient2
17396
7972 Launcher
8932 Launcher
9256 DeadLockDemo
10764 Jps
17340 NettyServer

C:\Users\SnailClimb>jstack 9256
```

Part of the output is as follows:

```powershell
Found one Java-level deadlock:
=============================
"Thread 2":
  waiting to lock monitor 0x000000000333e668 (object 0x00000000d5efe1c0, a java.lang.Object),
  which is held by "Thread 1"
"Thread 1":
  waiting to lock monitor 0x000000000333be88 (object 0x00000000d5efe1d0, a java.lang.Object),
  which is held by "Thread 2"

Java stack information for the threads listed above:
===================================================
"Thread 2":
        at DeadLockDemo.lambda$main$1(DeadLockDemo.java:31)
        - waiting to lock <0x00000000d5efe1c0> (a java.lang.Object)
        - locked <0x00000000d5efe1d0> (a java.lang.Object)
        at DeadLockDemo$$Lambda$2/1078694789.run(Unknown Source)
        at java.lang.Thread.run(Thread.java:748)
"Thread 1":
        at DeadLockDemo.lambda$main$0(DeadLockDemo.java:16)
        - waiting to lock <0x00000000d5efe1d0> (a java.lang.Object)
        - locked <0x00000000d5efe1c0> (a java.lang.Object)
        at DeadLockDemo$$Lambda$1/1324119927.run(Unknown Source)
        at java.lang.Thread.run(Thread.java:748)

Found 1 deadlock.
```

As you can see, the `jstack` command has already located the detailed information about the deadlocked threads for us.

## JDK Visual Analysis Tools

### JConsole: Java Monitoring and Management Console

JConsole is a visual monitoring and management tool based on JMX. It can conveniently monitor the memory usage of Java processes on local and remote servers. You can start it by typing `jconsole` in the console, or find `jconsole.exe` in the `bin` directory under the JDK directory and double-click it to launch.

#### Connecting JConsole

![Connecting JConsole](/media/jg/local/java/jvm/pictures/jdk/1JConsole-13ef79.png)

If you need to use JConsole to connect to a remote process, you can add the following parameters when starting the remote Java program:

```properties
-Djava.rmi.server.hostname=<external IP address>
-Dcom.sun.management.jmxremote.port=60001   // monitoring port number
-Dcom.sun.management.jmxremote.authenticate=false   // disable authentication
-Dcom.sun.management.jmxremote.ssl=false
```

This example configuration disables both authentication and SSL, and is only suitable for controlled local development or isolated testing environments. Oracle's official documentation explicitly notes that this configuration allows any remote user who can access the port to monitor and control the application; in production environments, authentication and secure transport should be enabled, and exposure should be restricted through network access controls.

When connecting with JConsole, the remote process address is as follows:

```plain
<external IP address>:60001
```

#### Viewing Java Program Overview

![Viewing Java Program Overview](/media/jg/local/java/jvm/pictures/jdk/2Java-0f6650.png)

#### Memory Monitoring

JConsole can display detailed information about current memory usage. It includes not only overall heap/non-heap memory statistics, but also granular details such as the Eden space and Survivor spaces, as shown in the figure below.

Clicking the "Perform GC (G)" button on the right issues an explicit garbage collection request through the management interface, whose semantics are similar to calling `System.gc()`. The JVM does not guarantee that garbage collection will definitely run, nor does it guarantee that it will run as a specific form of Full GC.

> - **Young Generation GC (Minor GC)**: Refers to a garbage collection action occurring in the Young Generation. Minor GC runs very frequently, and its collection speed is generally relatively fast.
> - **Old Generation GC (Major GC / Old GC)**: Collection targeting only the Old Generation. Different sources are not completely consistent in how they use the term Major GC—sometimes it is also used to mean a whole-heap collection—so when reading logs, you should determine what occurred based on the specific collector and log events.
> - **Full-Heap Collection (Full GC)**: Collects the entire Java heap, which usually introduces a relatively long pause. Its duration depends on heap size, live objects, the collector, and other factors, and cannot be compared to Minor GC using a fixed multiplier.

![Memory Monitoring](/media/jg/local/java/jvm/pictures/jdk/3-17aa2e.png)

#### Thread Monitoring

Similar to the `jstack` command we discussed earlier, except this one is visual.

At the bottom there is a "Detect Deadlock (D)" button; clicking this button automatically finds the deadlocked threads and their detailed information for you.

![Thread Monitoring](/media/jg/local/java/jvm/pictures/jdk/4-f665b5.png)

### VisualVM: All-in-One Troubleshooting Tool

VisualVM provides detailed information about Java applications running on the Java Virtual Machine (JVM). In VisualVM's graphical user interface, you can conveniently and quickly inspect information about multiple Java applications. VisualVM official website: <https://visualvm.github.io/>. VisualVM Chinese documentation: <https://visualvm.github.io/documentation.html>.

The following excerpt is taken from *Understanding the Java Virtual Machine*.

> VisualVM (All-in-One Java Troubleshooting Tool) provides features such as runtime monitoring, troubleshooting, and performance profiling. Java VisualVM was previously bundled with Oracle JDK 6–8, and starting from Oracle JDK 9 it is no longer bundled with the JDK; nowadays it usually needs to be downloaded and installed separately. Whether to enable profiling directly in a production environment should be carefully evaluated based on sampling or instrumentation mode and actual overhead.

VisualVM is developed on top of the NetBeans platform, so it natively features plugin extensibility from the start. Through plugin extensions, VisualVM can:

- Display virtual machine processes along with their configuration and environment information (`jps`, `jinfo`).
- Monitor an application's CPU, GC, heap, method area, and thread information (`jstat`, `jstack`).
- Dump and analyze heap dump snapshots (`jmap`, `jhat`).
- Perform method-level application performance profiling to find the most frequently called and longest-running methods.
- Take offline application snapshots: gather the program's runtime configuration, thread dumps, memory dumps, and other information into a snapshot that can be sent to developers for bug reporting.
- Endless possibilities via other plugins……

We will not go into the detailed usage of VisualVM here. If you would like to learn more, you can check out:

- <https://visualvm.github.io/documentation.html>
- <https://www.ibm.com/developerworks/cn/java/j-lo-visualvm/index.html>

### MAT: Memory Analyzer Tool

MAT (Memory Analyzer Tool) is a fast, convenient, and feature-rich offline JVM heap memory analysis tool. By displaying the state of runtime heap dump snapshots recorded when a JVM encounters an anomaly (heap dump analysis can also be performed during normal operation), it helps locate memory leak issues or optimize memory-intensive logic.

When encountering OOM and GC issues, I generally prioritize using MAT to analyze dump files, which is also the most common scenario where this tool is used.

For a detailed introduction to MAT, the following two well-written articles are recommended:

- [In-Depth Explanation and Practice of the JVM Memory Analysis Tool MAT — Beginner's Guide](https://juejin.cn/post/6908665391136899079)
- [In-Depth Explanation and Practice of the JVM Memory Analysis Tool MAT — Advanced Guide](https://juejin.cn/post/6911624328472133646)
