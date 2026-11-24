---
title: Summary of the Most Important JVM Parameters
description: A summary of commonly used JVM parameters and configuration methods, along with practical recommendations for memory and GC tuning.
category: Java
tag:
  - JVM
lang: en
sourceRef: zh-ref/java/jvm/jvm-parameters-intro.md
head:
  - - meta
    - name: keywords
      content: JVM parameters,heap size,stack size,GC settings,performance tuning,XX parameters
---

> This article was translated by JavaGuide from [https://www.baeldung.com/jvm-parameters](https://www.baeldung.com/jvm-parameters) and has been extensively supplemented and expanded.
> Documentation parameters: [https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html)
>
> JDK Version: Primarily JDK 1.8, with commonly used parameters from newer versions also added.

In this article, we will go through the most commonly used configuration parameters of the Java Virtual Machine (JVM) to help you better understand and tune the runtime environment of Java applications.

## Heap Memory Related

> The Java Heap is the largest memory area managed by the JVM, **shared by all threads**, and created when the virtual machine starts up. **The sole purpose of this memory area is to store object instances; almost all object instances as well as arrays are allocated on the heap.**

![Common configuration parameters for memory areas](/media/jg/local/java/jvm/pictures/asset-13fc3a.png)

### Setting Heap Memory Size (`-Xms` and `-Xmx`)

Setting the initial and maximum heap memory sizes according to the actual needs of the application is one of the most common practices in performance tuning. Setting both to the same value can reduce the overhead of dynamically resizing the heap at runtime; if you want unused heap memory to be returned during low-load periods, you need to leave room for expansion and shrinking. For example, ZGC cannot return heap memory via Uncommit when `-Xms` equals `-Xmx`, so you should choose based on your latency goals and memory budget.

Use the following parameters for configuration:

```bash
-Xms<heap size>[unit]  # Set the JVM initial heap size
-Xmx<heap size>[unit]  # Set the JVM maximum heap size
```

- `<heap size>`: Specifies the numeric memory value.
- `[unit]`: Specifies the memory unit, such as `g` (GB), `m` (MB), or `k` (KB).

**Example:** Set both the JVM initial heap and maximum heap to 4GB:

```bash
-Xms4G -Xmx4G
```

### Setting Young Generation Memory Size (Young Generation)

According to the [Oracle Official Documentation](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/sizing.html), after the total available heap memory is configured, the second biggest influencing factor is the proportion of heap memory occupied by the `Young Generation`. The default size of the Young Generation is affected by the JVM implementation, platform, garbage collector, heap size, and adaptive ergonomics—there is no fixed "minimum 1310 MB" applicable to all environments; `NewSize` and `MaxNewSize` constrain the lower and upper bounds of the Young Generation size respectively.

For generational collectors that support fixed Young Generation size parameters, you can configure the Young Generation memory size in two ways:

**1. Specify via `-XX:NewSize` and `-XX:MaxNewSize`**

```bash
-XX:NewSize=<young size>[unit]    # Set the initial Young Generation size
-XX:MaxNewSize=<young size>[unit] # Set the maximum Young Generation size
```

**Example:** Set the Young Generation minimum to 512MB and maximum to 1024MB:

```bash
-XX:NewSize=512m -XX:MaxNewSize=1024m
```

**2. Specify via `-Xmn<young size>[unit]`**

**Example:** Fix the Young Generation size at 512MB:

```bash
-Xmn512m
```

Explicitly setting the Young Generation size restricts the garbage collector's adaptive sizing capability. The [Oracle Official Documentation](https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html#extra-options-for-java) explicitly recommends against setting `-Xmn` for G1; whether and how to adjust it should be determined based on the specific collector and GC logs.

A very important empirical rule of thumb in GC tuning strategies states:

> Try to allocate newly created objects in the Young Generation and collect them there, because the cost of Minor GC is usually much lower than that of Full GC. Analyze GC logs to judge whether Young Generation space allocation is reasonable. If a large number of new objects are prematurely promoted to the Old Generation (Promotion), you can appropriately adjust the Young Generation size via `-Xmn` or `-XX:NewSize/-XX:MaxNewSize`, with the goal of minimizing objects entering the Old Generation directly.

In addition, you can use the **`-XX:NewRatio=<int>`** parameter to set **the memory size ratio between the Old Generation and the entire Young Generation (including Eden and the two Survivor spaces)**.

For example, `-XX:NewRatio=2` means Old Generation : Young Generation = 2 : 1, i.e., the Young Generation accounts for 1/3 of the entire heap size. The default value depends on the JVM, collector, and platform.

```bash
-XX:NewRatio=2
```

### Setting PermGen/Metaspace Size (PermGen/Metaspace)

**Starting from Java 8, class metadata uses native memory. If no upper limit is set via `-XX:MaxMetaspaceSize`, continuously growing class metadata can consume a large amount of native memory; PermGen, by contrast, is constrained by the `-XX:MaxPermSize` upper limit.**

Prior to JDK 1.8, when PermGen had not yet been completely removed, the Method Area size was typically tuned using the following parameters:

```bash
-XX:PermSize=N # Initial size of the Method Area (PermGen)
-XX:MaxPermSize=N # Maximum size of the Method Area (PermGen); exceeding this value throws OutOfMemoryError: java.lang.OutOfMemoryError: PermGen
```

Relatively speaking, garbage collection occurs less frequently in this area, though data does not "exist permanently" once it enters the Method Area.

**In JDK 1.8, the Method Area (HotSpot's PermGen) was completely removed (the transition had already begun in JDK 1.7) and replaced by Metaspace, which uses native memory.**

Here are some commonly used parameters:

```bash
-XX:MetaspaceSize=N # Sets Metaspace's high-water mark threshold (often mistaken for initial capacity, explained below)
-XX:MaxMetaspaceSize=N # Sets the maximum size of Metaspace
```

**🐛 Correction (see: [issue#1947](https://github.com/Snailclimb/JavaGuide/issues/1947))**:

**1. `-XX:MetaspaceSize` is NOT the initial capacity:** The initial capacity of Metaspace is not set by `-XX:MetaspaceSize`. Regardless of what value `-XX:MetaspaceSize` is configured to, for a 64-bit JVM, the initial capacity of Metaspace is usually a fixed small value (Oracle documentation mentions roughly between 12MB and 20MB, and observed values are around 20.8MB).

You can refer to the Oracle official documentation [Other Considerations](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/considerations.html), which states:

> Specify a higher value for the option MetaspaceSize to avoid early garbage collections induced for class metadata. The amount of class metadata allocated for an application is application-dependent and general guidelines do not exist for the selection of MetaspaceSize. The default size of MetaspaceSize is platform-dependent and ranges from 12 MB to about 20 MB.

Additionally, you can take a look at this experiment: [Misunderstandings About the JVM Parameter MetaspaceSize](https://mp.weixin.qq.com/s/jqfppqqd98DfAJHZhFbmxA).

**2. Expansion and Metadata GC:** When the committed space of Metaspace reaches the high-water mark threshold corresponding to `-XX:MetaspaceSize`, the JVM triggers a garbage collection to try unloading classes and releasing class metadata. Afterward, the JVM dynamically raises or lowers the threshold for triggering the next GC based on how much space was freed; which specific collection cycle is used depends on the garbage collector and JDK version and cannot be generalized as a Full GC. Internally, the garbage collector determines whether the Metaspace region has reached the threshold using the variable `_capacity_until_GC`, whose initialization code is shown below:

```c
void MetaspaceGC::initialize() {
  // Set the high-water mark to MaxMetapaceSize during VM initialization since
  // we can't do a GC during initialization.
  _capacity_until_GC = MaxMetaspaceSize;
}
```

**3. Role of `-XX:MaxMetaspaceSize`:** If `-XX:MaxMetaspaceSize` is not explicitly set, Metaspace has no fixed upper limit by default, and continuously growing class metadata may consume a large amount of native memory. Whether to set this parameter and how large to set it should be decided based on class metadata usage and the process's native memory budget. Setting the limit too small increases metadata GC frequency and may trigger `OutOfMemoryError: Metaspace` prematurely, so there is no universal recommended value applicable to all applications.

Related reading: [Issue Correction: If MaxMetaspaceSize is not specified, it will not exhaust memory #1204](https://github.com/Snailclimb/JavaGuide/issues/1204).

## Garbage Collection Related

### Choosing a Garbage Collector

Choosing an appropriate Garbage Collector (GC) is crucial to an application's throughput and response latency. For a detailed introduction to garbage collection algorithms and collectors, you can read my article: [JVM Garbage Collection Explained (Key Focus)](https://javaguide.cn/java/jvm/jvm-garbage-collection.html).

The JVM provides multiple GC implementations suited for different scenarios:

- **Serial GC:** Executes GC on a single thread; suitable for client mode or single-core CPU environments. Parameter: `-XX:+UseSerialGC`.
- **Parallel GC:** Executes Young and Old Generation garbage collection with multiple threads, focusing on throughput; it is the default GC for JDK 8 Server VM. When `-XX:+UseParallelGC` is enabled in JDK 8, it pairs with Parallel Old by default. Parameter: `-XX:+UseParallelGC`.
- **CMS GC (Concurrent Mark Sweep Collector):** Targets the shortest possible collection pause times, allowing most GC phases to run concurrently with user threads. Suitable for applications with strict response-time requirements. Deprecated in JDK 9 and removed in JDK 14. Parameter: `-XX:+UseConcMarkSweepGC`.
- **G1 GC (Garbage-First Garbage Collector):** The default GC for HotSpot on typical server-class machines in JDK 9 and later; default choices in other environments may differ. It divides the heap into multiple Regions, balancing throughput and pause time, and attempts to meet user-specified pause time goals. Parameter: `-XX:+UseG1GC`.
- **ZGC:** A low-latency GC requiring a relatively recent JDK version. Parameter: `-XX:+UseZGC`.
- **Shenandoah GC:** Another low-pause collector; availability depends on the specific JDK distribution. Parameter: `-XX:+UseShenandoahGC`.

### JDK 17 ZGC Parameters

ZGC in JDK 17 is a non-generational collector, enabled with `-XX:+UseZGC`. When tuning, first determine the heap and CPU budgets based on actual workload, then adjust parameters according to GC logs—do not copy an entire configuration from another service blindly.

| Parameter | Meaning and Things to Watch Out For |
| --- | --- |
| `-Xmx`, `-Xms` | Maximum heap and initial/minimum heap capacity. The heap must accommodate live objects and reserve headroom for allocations during concurrent collection; `-Xmx` is also not the memory limit for the entire Java process. |
| `-XX:ConcGCThreads` | Number of concurrent GC threads. Too few may fail to keep up with collection; too many will contend with business threads for CPU. Start with the JVM's adaptive selection, then verify against allocation stalls, CPU quotas, and workload whether manual tuning is needed. |
| `-XX:ZAllocationSpikeTolerance` | Tolerance factor for sudden spikes in allocation rate, defaulting to `2.0` in JDK 17, which influences prediction of when to start collection. It is not a heap expansion ratio and cannot substitute for sufficient memory headroom. |
| `-XX:ZCollectionInterval` | Maximum interval between GC cycles in seconds. The default value `0` means GC is not triggered by this timer—**it does not disable GC**. Do not mistake it for a minimum wait time required between two GCs. |
| `-XX:+ZUncommit`, `-XX:ZUncommitDelay` | Allows returning unused heap memory; enabled by default in JDK 17 with a default delay of `300` seconds. Uncommitting will not shrink the heap below `-Xms`; when `-Xms` equals `-Xmx`, this mechanism has no practical effect. |

The semantics above can be cross-checked against the [JDK 17 `java` Command Documentation](https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html) and [OpenJDK 17 ZGC Parameter Definitions](https://github.com/openjdk/jdk17u/blob/master/src/hotspot/share/gc/z/z_globals.hpp). Parameters may vary across JDK versions—in particular, do not pass the generational ZGC parameter `-XX:+ZGenerational` to JDK 17.

For example, the command below logs both GC and safepoint information; the heap size still needs to be configured separately according to the application's resource budget:

```bash
java -XX:+UseZGC \
  '-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags:filecount=5,filesize=20M' \
  -jar app.jar
```

If `Allocation Stall` appears in the logs, identify the cause by examining allocation rate, live set size, available heap space, and CPU resources available to concurrent GC. Simply shortening the timed collection interval may not be effective and can increase CPU overhead. The container memory budget must also cover Metaspace, thread stacks, direct memory, and JVM native overhead—never size container limits solely based on `-Xmx`.

### GC Logging

In production environments or during GC troubleshooting, **always enable GC logging**. Detailed GC logs are critical evidence for analyzing and resolving GC issues.

Here are some GC logging parameters for JDK 8:

```bash
# --- Recommended basic configuration ---
# Print detailed GC information
-XX:+PrintGCDetails
# Print GC timestamps (relative to JVM startup time)
# -XX:+PrintGCTimeStamps
# Print the date and time when GC occurs (more commonly used)
-XX:+PrintGCDateStamps
# Specify the output path of the GC log file; %t outputs the date/timestamp
-Xloggc:/path/to/gc-%t.log

# --- Recommended advanced configuration ---
# Print object age distribution (helps determine object promotion to the Old Generation)
-XX:+PrintTenuringDistribution
# Print heap information before and after GC
-XX:+PrintHeapAtGC
# Print processing information for various reference types (strong/soft/weak/phantom)
-XX:+PrintReferenceGC
# Print application pause time (Stop-The-World, STW)
-XX:+PrintGCApplicationStoppedTime

# --- GC log file rotation configuration ---
# Enable GC log file rotation
-XX:+UseGCLogFileRotation
# Set the number of rotated log files (e.g., keep the latest 14 files)
-XX:NumberOfGCLogFiles=14
# Set the maximum size of each log file (e.g., 50MB)
-XX:GCLogFileSize=50M

# --- Optional auxiliary diagnostic configuration ---
# Print safepoint statistics (helps analyze STW causes)
# -XX:+PrintSafepointStatistics
# -XX:PrintSafepointStatisticsCount=1
```

In JDK 9 and later, you should use the unified JVM logging framework `-Xlog`. For example, the following configuration records detailed GC information and enables size-based rotation:

```bash
-Xlog:gc*:file=/path/to/gc-%t.log:time,uptime,level,tags:filecount=14,filesize=50M
```

Not all legacy parameters continue to work: some are mapped, deprecated, or no longer recognized at all. For instance, `PrintGCDetails` corresponds to `-Xlog:gc*`, `PrintTenuringDistribution` corresponds to `-Xlog:gc+age*=debug`, and `PrintGCApplicationStoppedTime` corresponds to `-Xlog:safepoint`. Always refer to the target JDK's `java` command documentation and `java -Xlog:help` output as the authoritative reference.

## Handling OOM

For large applications, encountering OutOfMemoryError is very common and in turn causes the application to crash. This is a critical scenario that is often very difficult to reproduce and debug directly.

That is why the JVM provides parameters to dump heap memory to a physical file on disk, which can later be used to investigate leaks:

```bash
# Generate a heap dump file when the Java heap is exhausted and throws OOME
-XX:+HeapDumpOnOutOfMemoryError

# Specify the heap dump file or directory. If a directory is specified, the JVM uses the default name java_pid<pid>.hprof
-XX:HeapDumpPath=/data/dumps/

# (Optional) Execute a specified command or script when OOM occurs
# For example, send an alert notification or attempt to restart the service (use with caution)
# -XX:OnOutOfMemoryError="<command> <args>"
# Example: -XX:OnOutOfMemoryError="sh /path/to/notify.sh"

# (Optional) Enable GC overhead limit checking
# If GC time accounts for too high a proportion of total time (default 98%) while reclaiming very little memory (default less than 2% of the heap),
# throw OOM early to prevent the application from staying stuck in GC for a long time.
-XX:+UseGCOverheadLimit
```

## Other Commonly Used Parameters

- `-server`: Explicitly enables Server mode for HotSpot VM (usually the default on 64-bit JVMs).
- `-XX:+UseStringDeduplication`: (JDK 8u20+) Attempts to identify `String` objects with identical contents and share their underlying character data arrays to reduce memory consumption. In JDK 8, the underlying array is `char[]`; in modern JDKs with Compact Strings enabled, it is usually `byte[]`. This option also requires using a collector that supports string deduplication, such as G1.
- `-XX:SurvivorRatio=<ratio>`: Sets the size ratio between the Eden space and a single Survivor space. For example, `-XX:SurvivorRatio=8` means Eden : Survivor = 8 : 1.
- `-XX:MaxTenuringThreshold=<threshold>`: Sets the maximum age threshold for objects promoted from the Young Generation to the Old Generation (each time an object survives a Minor GC, its age increments by 1). The default depends on the collector and JDK version; for example, in the JDK 8 documentation, Parallel GC defaults to 15 while CMS defaults to 6.
- `-XX:+DisableExplicitGC`: Instructs the JVM to ignore explicit GC requests such as `System.gc()`, though the JVM will still run GC on its own when necessary. Explicit requests are not guaranteed to trigger a Full GC; whether to enable this parameter should be evaluated based on direct memory cleanup, framework behavior, and the collector in use rather than generalized.
- `-XX:+UseLargePages`: (Requires OS support) Attempts to use large memory pages (such as 2MB instead of 4KB), which may improve performance for memory-intensive applications, though it requires careful testing.
- `-XX:MinHeapFreeRatio=<percent>` / `-XX:MaxHeapFreeRatio=<percent>`: For collectors supporting this pair of parameters, controls the desired free heap percentage after GC and participates in heap capacity resizing. Exact behavior depends on the collector, and these parameters cannot replace ZGC's sizing and uncommit policies.

**Note:** The following parameters may be **deprecated, removed, or enabled by default without needing manual configuration** in modern JVM versions:

- `-XX:+UseLWPSynchronization`: An older synchronization policy option; modern JVMs typically have more optimized implementations.
- `-XX:LargePageSizeInBytes`: Usually determined automatically by `-XX:+UseLargePages` or configured via the OS.
- `-XX:+UseStringCache`: Has been removed.
- `-XX:+UseCompressedStrings`: An old experimental option that has been removed; Compact Strings introduced in JDK 9 is a different implementation.
- `-XX:+OptimizeStringConcat`: An older HotSpot C2 string concatenation optimization option; since JDK 9, string concatenation is primarily implemented via `invokedynamic` and `StringConcatFactory`, so the two should not be treated as the same switch.

## Summary

This article provides Java developers with a practical guide to configuring commonly used JVM parameters, aiming to help readers understand and optimize the performance and stability of Java applications. Key takeaways emphasized in the article include:

1. **Heap Memory Configuration:** Configure initial and maximum heap memory (`-Xms`, `-Xmx`) based on your deployment environment, balancing the performance benefits of fixed heap capacity against the need for elastic memory uncommit. Whether Young Generation size should be set explicitly depends on the garbage collector and GC logs; G1 generally advises against setting `-Xmn`, while JDK 17's non-generational ZGC has no Young Generation.
2. **Metaspace Management (Java 8+):** `-XX:MetaspaceSize` sets the initial high-water mark threshold for triggering metadata GC, rather than the initial capacity of Metaspace. `-XX:MaxMetaspaceSize` limits the native memory used by class metadata, though the exact cap must be decided according to the application's actual behavior.
3. **Garbage Collector Selection and Logging:** Introduces suitable scenarios for different GC algorithms and emphasizes the necessity of enabling detailed GC logs in production and testing environments for troubleshooting; JDK 8 uses legacy GC logging flags, whereas JDK 9 and later use `-Xlog`.
4. **OOM Troubleshooting:** Explains how parameters such as `-XX:+HeapDumpOnOutOfMemoryError` automatically generate heap dump files when OOM occurs to facilitate subsequent memory leak analysis.
5. **Other Parameters:** Briefly introduces other useful flags such as string deduplication and notes the current status of several older parameters.

For specific troubleshooting and tuning case studies, refer to this article I compiled: [JVM Production Troubleshooting and Performance Tuning Case Studies](https://javaguide.cn/java/jvm/jvm-in-action.html).
