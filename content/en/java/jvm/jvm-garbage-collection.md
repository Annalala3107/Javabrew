---
title: Detailed Explanation of JVM Garbage Collection (Key Focus)
description: "Detailed explanation of JVM Garbage Collection: comprehensive guide to GC algorithms (Mark-and-Sweep, Copying, Mark-and-Compact), generational collection mechanisms, common garbage collectors (Serial, Parallel, CMS, G1, ZGC, Shenandoah), and GC tuning practices."
category: Java
tag:
  - JVM
lang: en
sourceRef: zh-ref/java/jvm/jvm-garbage-collection.md
head:
  - - meta
    - name: keywords
      content: JVM Garbage Collection,GC algorithms,garbage collectors,generational collection,Mark-and-Sweep,Copying algorithm,G1 GC,ZGC,Shenandoah,GC tuning
---

> Unless otherwise specified, all discussions below refer to the HotSpot Virtual Machine.
>
> This article is summarized and supplemented based on *Understanding the Java Virtual Machine: JVM Advanced Features and Best Practices*.
>
> Common interview questions:
>
> - How to determine whether an object is dead (two methods).
> - Briefly introduce Strong Reference, Soft Reference, Weak Reference, and Phantom Reference (differences between Phantom Reference vs. Soft and Weak References, and the benefits of using Soft Reference).
> - How to determine whether a constant is an obsolete constant.
> - How to determine whether a class is a useless (unloadable) class.
> - What garbage collection algorithms exist, and what are their respective characteristics?
> - Why does HotSpot divide the heap into Young Generation and Old Generation?
> - What are the common garbage collectors?
> - Introduce the CMS and G1 collectors.
> - What are the differences between Minor GC and Full GC?

## Introduction

When troubleshooting various OutOfMemory issues, or when garbage collection becomes a bottleneck preventing the system from achieving higher concurrency, we need to apply necessary monitoring and tuning to these "automated" technologies.

## Basic Structure of Heap Space

Java's automatic memory management primarily handles object memory reclamation and object memory allocation. At the same time, the core function of Java's automatic memory management is the allocation and reclamation of objects in **Heap** memory.

The Java Heap is the main region managed by the garbage collector, so it is also called the **GC Heap (Garbage Collected Heap)**.

From the perspective of garbage collection, because modern collectors basically adopt generational garbage collection algorithms, the Java Heap is divided into several different regions so that we can choose suitable garbage collection algorithms based on the characteristics of each region.

In HotSpot JDK 7 and earlier versions, GC is usually introduced in terms of the following three parts, where the Permanent Generation (PermGen) is an implementation of the Method Area and does not belong to the Java Heap:

1. Young Generation memory (Young Generation)
2. Old Generation memory (Old Generation)
3. Permanent Generation (Permanent Generation)

In the figure below, the Eden space and the two Survivor spaces S0 and S1 all belong to the Young Generation, the middle layer belongs to the Old Generation, and the bottom layer belongs to the Permanent Generation.

![Heap Memory Structure](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/hotspot-heap-structure-7a56204a.png)

**JDK 8 removed PermGen (Permanent Generation), and class metadata was moved to Metaspace, which uses native memory.**

For a more detailed introduction to the heap space structure, you can revisit the article [Detailed Explanation of Java Memory Areas](./memory-area.md).

## Memory Allocation and Reclamation Principles

### Objects Are Prioritized for Allocation in the Eden Space

In most cases, objects are allocated in the Eden space of the Young Generation. When the Eden space does not have enough space for allocation, the virtual machine triggers a Minor GC. Let's run a practical test below.

Test code:

```java
public class GCTest {
  public static void main(String[] args) {
    byte[] allocation1, allocation2;
    allocation1 = new byte[30900*1024];
  }
}
```

Run it in the following way:
![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/25178350-2ef3c14f.png)

Added flag: `-XX:+PrintGCDetails`
![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/run-with-PrintGCDetails-72268fa2.png)

Execution result (the red text annotation in the screenshot is inaccurate; it should correspond to PermGen in JDK 1.7):

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/28954286-ae903960.png)

From the figure above, we can see that the Eden space is almost completely allocated (even if the program does nothing, the Young Generation still uses over 2,000 KB of memory).

What happens if we allocate memory for `allocation2` as well?

```java
allocation2 = new byte[900*1024];
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/28128785-41382a8a.png)

When allocating memory for `allocation2`, the Eden space is almost completely full.

When the Eden space does not have enough space for allocation, the virtual machine initiates a Minor GC. During GC, the virtual machine finds that `allocation1` cannot fit into the Survivor space, so it has to move the Young Generation object early into the Old Generation through the **Space Allocation Guarantee mechanism**. Since there is enough space in the Old Generation to hold `allocation1`, no Full GC occurs. After executing Minor GC, subsequent allocated objects will still be allocated in the Eden space if they can fit in Eden. You can run the following code to verify:

```java
public class GCTest {

  public static void main(String[] args) {
    byte[] allocation1, allocation2,allocation3,allocation4,allocation5;
    allocation1 = new byte[32000*1024];
    allocation2 = new byte[1000*1024];
    allocation3 = new byte[1000*1024];
    allocation4 = new byte[1000*1024];
    allocation5 = new byte[1000*1024];
  }
}

```

### Large Objects Directly Enter the Old Generation

Large objects are objects that require a large amount of contiguous memory space (for example: long strings or large arrays).

Whether large objects enter the Old Generation directly is dynamically decided by the virtual machine and depends on the specific garbage collector used and related parameters. Having large objects enter the Old Generation directly is an optimization strategy designed to avoid placing large objects into the Young Generation, thereby reducing the frequency and cost of Young Generation garbage collections.

- The G1 garbage collector treats objects whose size is greater than or equal to half a Region as Humongous Objects, and allocates them directly into contiguous Humongous Regions belonging to the Old Generation. Region size can be set via `-XX:G1HeapRegionSize`.
- Whether and under what conditions other collectors allocate large objects directly into the Old Generation depends on the specific collector and JDK version, and cannot be generalized with a single universal threshold.

### Long-Lived Objects Enter the Old Generation

Since the virtual machine adopts generational collection to manage memory, during memory reclamation it must be able to identify which objects belong in the Young Generation and which belong in the Old Generation. To achieve this, the virtual machine maintains an Age counter for each object.

In most cases, objects are initially allocated in the Eden region. If an object is born in Eden, survives its first Minor GC, and can fit into the Survivor space, it is moved into the Survivor space (`S0` or `S1`), and its object age is set to 1 (moving from Eden -> Survivor sets the initial age of the object to 1).

Each time an object survives a Minor GC in the Survivor space, its age increases by 1. When its age reaches the promotion threshold, it is promoted to the Old Generation. `-XX:MaxTenuringThreshold` sets the maximum promotion age threshold for objects, and its default value depends on the garbage collector. For example, in JDK 8, the default is 15 for Parallel GC and 6 for CMS; the actual promotion threshold can also be dynamically adjusted by the JVM.

> Correction ([issue552](https://github.com/Snailclimb/JavaGuide/issues/552)): "When HotSpot traverses all objects, it accumulates their occupied sizes in ascending order of age. When the cumulative size up to a certain age exceeds 50% of the Survivor space (the default is 50%, configurable via `-XX:TargetSurvivorRatio=percent`, see [issue1199](https://github.com/Snailclimb/JavaGuide/issues/1199)), the smaller value between that age and `MaxTenuringThreshold` is taken as the new promotion age threshold."
>
> Official JDK 8 documentation reference: <https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html>.
>
> ![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210523201742303-085e10c9.png)
>
> **The code for dynamic age calculation is as follows:**
>
> ```c++
> uint ageTable::compute_tenuring_threshold(size_t survivor_capacity) {
> // survivor_capacity is the size of the survivor space
> size_t desired_survivor_size = (size_t)((((double)survivor_capacity)*TargetSurvivorRatio)/100);
> size_t total = 0;
> uint age = 1;
> while (age < table_size) {
> // sizes array holds the total object size for each age
> total += sizes[age];
> if (total > desired_survivor_size) {
> break;
> }
> age++;
> }
> uint result = age < MaxTenuringThreshold ? age : MaxTenuringThreshold;
> ...
> }
>
> ```
>
> Additional note ([issue672](https://github.com/Snailclimb/JavaGuide/issues/672)): **The claim that the default promotion age is 15 mostly originates from the book *Understanding the Java Virtual Machine*.**
> If you read the [relevant JVM options](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html) on Oracle's official site, you will find a note under `-XX:MaxTenuringThreshold=threshold`:
>
> **"Sets the maximum tenuring threshold for use in adaptive GC sizing. The largest value is 15. The default value is 15 for the parallel (throughput) collector, and 6 for the CMS collector." The default promotion age is not always 15—it depends on the garbage collector; for CMS, it is 6.**

### Target Regions of Garbage Collection

In the 2nd edition of *Understanding the Java Virtual Machine*, page 92, Zhou Zhiming wrote:

> ~~_"Old Generation GC (Major GC/Full GC) refers to GC occurring in the Old Generation..."_~~

That statement was corrected in the 3rd edition of *Understanding the Java Virtual Machine*. Thanks to RednaxelaFX (R) for the answer:

![RednaxelaFX (R)'s Answer](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/rf-hotspot-vm-gc-62b1d756.png)

**Summary:**

For the HotSpot VM implementation, GC is accurately classified into only two major categories:

Partial GC:

- Young Generation collection (Minor GC / Young GC): collects only the Young Generation;
- Old Generation collection (Major GC / Old GC): collects only the Old Generation. Note that in some contexts, Major GC is also used to refer to whole-heap collection;
- Mixed collection (Mixed GC): collects the entire Young Generation and part of the Old Generation.

Full GC (whole-heap collection): collects the entire Java Heap; whether class metadata in the Method Area is reclaimed at the same time depends on the collector, JDK version, and class unloading conditions.

### Space Allocation Guarantee

Space Allocation Guarantee ensures that before a Minor GC occurs, the Old Generation itself has enough remaining space to accommodate all objects from the Young Generation.

Chapter 3 of *Understanding the Java Virtual Machine* describes Space Allocation Guarantee as follows:

> Before JDK 6 Update 24, prior to a Minor GC, the virtual machine had to first check whether the largest available contiguous space in the Old Generation was greater than the total space of all objects in the Young Generation. If this condition held, the Minor GC was guaranteed to be safe. If not, the virtual machine checked the setting of `-XX:HandlePromotionFailure` to see whether promotion failure was allowed; if allowed, it continued to check whether the largest available contiguous space in the Old Generation was greater than the average size of objects previously promoted to the Old Generation. If greater, it attempted a Minor GC, even though this Minor GC carried risk; if smaller, or if `-XX:HandlePromotionFailure` disallowed taking the risk, a Full GC would be performed instead.
>
> After JDK 6 Update 24, the rule became: as long as the contiguous space in the Old Generation is greater than either the total size of Young Generation objects or the average size of previous promotions, Minor GC is performed; otherwise, Full GC is performed.

## Methods for Determining Dead Objects

Almost all object instances reside in the heap. The very first step before heap garbage collection is to determine which objects are dead (i.e., objects that can no longer be used by any means).

### Reference Counting

Add a reference counter to each object:

- Whenever a reference points to it, increment the counter by 1;
- When a reference becomes invalid, decrement the counter by 1;
- Any object whose counter is 0 at any time cannot be used anymore.

**Although this method is simple to implement, mainstream Java virtual machines do not choose this algorithm to manage object lifecycles. One of the major reasons is that it cannot solve circular references between objects on its own.**

![Circular Reference Between Objects](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/object-circular-reference-c35aadba.png)

The mutual reference problem between objects is shown in the code below: besides `objA` and `objB` referencing each other, there are no other references to these two objects. Because they reference each other, neither reference counter drops to 0, so the Reference Counting algorithm cannot notify the GC collector to reclaim them.

```java
public class ReferenceCountingGc {
    Object instance = null;
    public static void main(String[] args) {
        ReferenceCountingGc objA = new ReferenceCountingGc();
        ReferenceCountingGc objB = new ReferenceCountingGc();
        objA.instance = objB;
        objB.instance = objA;
        objA = null;
        objB = null;
    }
}
```

### Reachability Analysis

The basic idea of this algorithm is to use a series of objects called **"GC Roots"** as starting points and search downward from these nodes. The path traversed by references is called a Reference Chain. When an object has no Reference Chain connected to any GC Roots, it proves that the object is unusable and needs to be reclaimed.

In the diagram below, although `Object 6 ~ Object 10` have reference relationships among themselves, they are unreachable from GC Roots, so they are objects that need to be reclaimed.

![Reachability Analysis Algorithm](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/jvm-gc-roots-bf900163.png)

**Which objects can serve as GC Roots?**

- Objects referenced in the JVM Stack (local variable table in stack frames)
- Objects referenced in the Native Method Stack (Native methods)
- Objects referenced by class static fields in the Method Area
- Objects referenced by constants in the Method Area
- All objects held by synchronization locks
- Objects referenced by JNI (Java Native Interface)

**If an object can be reclaimed, does that guarantee it will definitely be reclaimed?**

For an object that overrides the `finalize()` method and has not had `finalize()` executed yet, after HotSpot confirms the object is unreachable, it may add the corresponding finalizer reference to a pending queue to be processed asynchronously by the Finalizer thread. If the object re-establishes an association with an object on a reference chain inside `finalize()`, it can temporarily escape reclamation; otherwise, subsequent garbage collection will reconfirm its reclaimable status. This process is often summarized as "two markings," though it does not mean the garbage collector synchronously waits for `finalize()` to run, nor is there any guarantee that `finalize()` will ever be invoked.

> The `finalize` method in `Object` has long been regarded as a poor design, becoming a burden on the Java language and negatively impacting Java's security and GC performance. `Object.finalize()` was deprecated starting in JDK 9, and JEP 421 marked finalization for removal in JDK 18. New code should not rely on it.
>
> References:
>
> - [JEP 421: Deprecate Finalization for Removal](https://openjdk.java.net/jeps/421)
> - [It's Time to Forget the finalize Method](https://mp.weixin.qq.com/s/LW-paZAMD08DP_3-XCUxmg)

### Summary of Reference Types

Whether using Reference Counting to track an object's reference count or Reachability Analysis to check whether an object's reference chain is reachable, determining an object's liveness relates to "references."

Before JDK 1.2, the definition of a reference in Java was very traditional: if the value stored in a `reference`-type piece of data represents the starting address of another block of memory, then that block of memory is said to represent a reference.

Since JDK 1.2, Java expanded the concept of references into four types—Strong Reference, Soft Reference, Weak Reference, and Phantom Reference (with decreasing reference strength). Strong references are the ordinary reference assignments ubiquitous in program code, while Soft, Weak, and Phantom references are defined in the JDK as the classes `SoftReference`, `WeakReference`, and `PhantomReference`, respectively.

![Summary of Java Reference Types](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/java-reference-type-67e6062d.png)

**1. Strong Reference (`StrongReference`)**

A strong reference is simply the common reference assignment found throughout program code. It is the most widely used type of reference, as shown below:

```java
String strongReference = new String("abc");
```

If an object is still accessible via strong references, it is like an **essential daily necessity**—the garbage collector will not reclaim it. When memory space is insufficient, the Java Virtual Machine would rather throw an `OutOfMemoryError` and terminate the program abnormally than arbitrarily reclaim strongly reachable objects to resolve the memory shortage.

**2. Soft Reference (`SoftReference`)**

If an object only has soft references, it is like a **nice-to-have item**. Example code for a soft reference:

```java
// --- Example 1 ---
String str = new String("abc");
SoftReference<String> softReference1 = new SoftReference<>(str);
str = null; // Remove strong reference

// --- Example 2 ---
SoftReference<String> softReference2 = new SoftReference<>(new String("def")); // Anonymous object
```

Softly referenced objects may be reclaimed under memory pressure, but the JVM does not guarantee they are cleared *only* when memory is low. The only strong guarantee is that before throwing an `OutOfMemoryError`, all objects reachable solely via soft references are guaranteed to be cleared. As long as the garbage collector has not reclaimed it, the object can still be used by the program. Soft references can be used to implement memory-sensitive caches.

A soft reference can be used together with a `ReferenceQueue`. After clearing a soft reference, the garbage collector enqueues the soft reference (if registered with a queue) at that time or later. Enqueuing indicates that the garbage collector has detected the corresponding reachability change; it is not meant to prove that the physical memory occupied by the object has already been freed.

**3. Weak Reference (`WeakReference`)**

If an object only has weak references, it is also like a **nice-to-have item**. Example code for a weak reference:

```java
// --- Example 1 ---
String str = new String("abc");
WeakReference<String> weakReference1 = new WeakReference<>(str);
str = null; // Remove strong reference

// --- Example 2 ---
WeakReference<String> weakReference2 = new WeakReference<>(new String("abc")); // Anonymous object
```

The difference between weak references and soft references is that objects with only weak references have a shorter lifecycle. Once the garbage collector determines that an object is only weakly reachable, it atomically clears the weak references pointing to that object. However, this clearing occurs only when garbage collection runs, so there is no guarantee that an object will be reclaimed immediately after becoming weakly reachable.

A weak reference can be used together with a `ReferenceQueue`. After clearing a weak reference, the garbage collector enqueues the registered weak reference into the corresponding queue at that time or later.

**4. Phantom Reference (`PhantomReference`)**

As the name "phantom reference" implies, it is virtually nonexistent as a link to keep the object alive. Unlike the other reference types, a phantom reference does not prevent the garbage collector from reclaiming the object it points to. Example code for a phantom reference:

```java
// --- Example 1 ---
String str = new String("abc");
ReferenceQueue queue = new ReferenceQueue();
// Create a phantom reference; it must be associated with a ReferenceQueue
PhantomReference phantomReference1 = new PhantomReference(str, queue);
str = null; // Remove strong reference

// --- Example 2 ---
PhantomReference phantomReference2 = new PhantomReference(new String("abc"), queue); // Anonymous object
```

**Phantom references are mainly used to receive notifications when an object's reachability changes, and to schedule cleanup actions in conjunction with a `ReferenceQueue`.**

**One difference between phantom references and soft/weak references is:** a phantom reference is always used together with a `ReferenceQueue`. Once the garbage collector determines that an object has become phantom-reachable, it clears the phantom reference and enqueues the registered phantom reference into the queue at that time or later. `PhantomReference.get()` always returns `null`, so the program cannot retrieve the object again through a phantom reference; it is primarily used to schedule cleanup work after the object can no longer be accessed.

Note in particular that although soft references are mainly used for memory-sensitive caches, they cannot guarantee that an application will never encounter an `OutOfMemoryError`; out-of-memory errors can also result from exhaustion of resources outside the heap.

### How to Determine Whether a Constant Is an Obsolete Constant?

The String Constant Pool primarily reclaims obsolete constants. So how do we determine whether a constant is an obsolete constant?

~~**In JDK 1.7 and later versions, the JVM moved the Runtime Constant Pool out of the Method Area and allocated an area in the Java Heap to store the Runtime Constant Pool.**~~

> **🐛 Correction (see [issue747](https://github.com/Snailclimb/JavaGuide/issues/747), [reference](https://blog.csdn.net/q5706503/article/details/84640762))**:
>
> 1. **Before JDK 1.7, the Runtime Constant Pool logically included the String Constant Pool and was stored in the Method Area, which in HotSpot was implemented as PermGen.**
> 2. **In JDK 1.7, the String Constant Pool was moved out of the Method Area into the Heap. Note that this did not refer to the Runtime Constant Pool—meaning only the String Constant Pool was moved separately to the Heap, while the rest of the Runtime Constant Pool remained in the Method Area (PermGen in HotSpot).**
> 3. **In JDK 1.8, HotSpot removed PermGen and replaced it with Metaspace. At that point, the String Constant Pool remained in the Heap, and the Runtime Constant Pool remained in the Method Area, except that the Method Area's implementation changed from PermGen to Metaspace.**

Suppose the string `"abc"` exists in the String Constant Pool. If no `String` object currently references this string constant, then `"abc"` is an obsolete constant. If garbage collection occurs and reclamation is necessary, `"abc"` will be cleared out of the constant pool by the system.

### How to Determine Whether a Class Is a Useless Class?

The Method Area mainly reclaims useless classes. So how do we determine whether a class is a useless class?

Determining whether a constant is an "obsolete constant" is relatively simple, whereas the conditions for determining whether a class is a "useless class" are much stricter. A class must simultaneously satisfy all 3 of the following conditions to be considered a **"useless class"**:

- All instances of the class have been reclaimed, meaning no instance of the class exists in the Java Heap.
- The `ClassLoader` that loaded the class has been reclaimed.
- The `java.lang.Class` object corresponding to the class is not referenced anywhere, and methods of the class cannot be accessed anywhere via Reflection.

> Be especially careful with the 3rd condition in JNI scenarios: a `jclass` global reference created via `NewGlobalRef` also prevents the class from being unloaded. A common pitfall is caching reflection results at the JNI layer: `jmethodID`/`jfieldID` are only guaranteed to remain valid while the class remains loaded, so long-running programs often create a global reference for `jclass` to keep it alive. This also means that as long as that global reference is not released, the corresponding class can never be unloaded (see [issue#2908](https://github.com/Snailclimb/JavaGuide/issues/2908)).

The virtual machine *may* reclaim a useless class that satisfies the 3 conditions above. Note that it says "may"—unlike unused objects, a useless class is not guaranteed to be reclaimed automatically.

## Garbage Collection Algorithms

### Mark-and-Sweep Algorithm

The Mark-and-Sweep algorithm is divided into two phases: "Mark" and "Sweep". First, it marks all objects that do not need to be reclaimed, and after marking is complete, it uniformly reclaims all unmarked objects.

It is the most fundamental collection algorithm, and subsequent algorithms were developed by improving upon its shortcomings. This garbage collection algorithm brings two obvious problems:

1. **Efficiency problem**: Both the marking and sweeping processes have low efficiency.
2. **Space problem**: After mark-and-sweep, a large amount of non-contiguous memory fragmentation is produced.

![Mark-and-Sweep Algorithm](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/mark-and-sweep-garbage-collection-algorithm-d9b7977d.png)

There are different descriptions regarding whether it marks reclaimable (unreachable) objects or non-reclaimable (reachable) objects. Both explanations work fine, though I personally prefer the latter.

Following that interpretation, the overall Mark-and-Sweep process roughly works as follows:

1. When an object is created, assign it a mark bit, say `0` (`false`);
2. In the marking phase, set the mark bit of all reachable objects (or objects referenceable by the user) to `1` (`true`);
3. In the sweeping phase, clear all objects whose mark bit is `0` (`false`).

### Copying Algorithm

To solve the efficiency and memory fragmentation issues of the Mark-and-Sweep algorithm, the Copying collection algorithm emerged. It divides memory into two equal-sized blocks and uses only one block at a time. When this block's memory is used up, the still-living objects are copied to the other block, and then the used space is cleaned up all at once. In this way, each memory collection reclaims half of the memory region.

![Copying Algorithm](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/copying-garbage-collection-algorithm-76d3bcef.png)

Although it improves on the Mark-and-Sweep algorithm, it still has the following drawbacks:

- **Reduced usable memory**: Usable memory is halved.
- **Unsuitable for Old Generation**: If the number of surviving objects is large, copying performance becomes very poor.

### Mark-and-Compact Algorithm

The Mark-and-Compact algorithm was proposed based on the characteristics of the Old Generation. Its marking process is the same as the "Mark-and-Sweep" algorithm, but the subsequent step does not directly reclaim collectable objects; instead, it moves all surviving objects toward one end and then directly clears all memory beyond the boundary.

![Mark-and-Compact Algorithm](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/mark-and-compact-garbage-collection-algorithm-09426872.png)

Because of the extra compaction step, its efficiency is also not high, making it suitable for scenarios like the Old Generation where garbage collection frequency is relatively low.

### Generational Collection Algorithm

Classic generational garbage collectors divide memory into several blocks according to differences in object lifecycles. Typically, the Java Heap is divided into the Young Generation and Old Generation so that appropriate garbage collection algorithms can be selected according to the characteristics of each generation. Note that garbage collectors do not always adopt a generational design—for example, early ZGC was a non-generational collector.

For instance, in the Young Generation, a large number of objects die during each collection, so the "Copying" algorithm can be chosen, completing each garbage collection at the small cost of copying only the few surviving objects. By contrast, objects in the Old Generation have a relatively high survival rate, and there is no extra space to act as an allocation guarantee for it, so we must choose the "Mark-and-Sweep" or "Mark-and-Compact" algorithm for garbage collection.

**Extended interview question:** Why does HotSpot divide the heap into Young Generation and Old Generation?

Answer based on the introduction to the Generational Collection algorithm above.

## Garbage Collectors

**If collection algorithms are the methodology for memory reclamation, then garbage collectors are the concrete implementations of memory reclamation.**

Although we compare various collectors, the goal is not to pick a single "best" collector. Because up to now no single best garbage collector exists—much less a universal one—**all we can do is choose the garbage collector that best fits the specific application scenario**. Just think: if there existed a perfect collector applicable across all scenarios worldwide, then the HotSpot Virtual Machine would not have implemented so many different garbage collectors.

Default garbage collectors in Oracle/OpenJDK HotSpot under typical Server VM environments (the actual selection also depends on platform and runtime environment; you can inspect it using `java -XX:+PrintCommandLineFlags -version`):

- JDK 8: Parallel Scavenge (Young Generation) + Parallel Old (Old Generation)
- JDK 9 and later: G1

### Serial Collector

The Serial collector is the most basic and oldest garbage collector. As you can tell from its name, it is a single-threaded collector. The meaning of **"single-threaded"** goes beyond using only a single garbage collection thread to perform GC work—more importantly, it must pause all other worker threads (**"Stop The World"**) while collecting garbage until the collection finishes.

**It uses the Mark-Copying algorithm in the Young Generation and the Mark-Compact algorithm in the Old Generation.**

![Serial Collector](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/serial-garbage-collector-0d0ad081.png)

Of course, virtual machine designers were well aware of the poor user experience caused by Stop The World, so subsequent garbage collector designs have continuously shortened pause times (pauses still exist, and the search for the best garbage collector continues).

Does the Serial collector have any advantages over other garbage collectors? Yes—it is **simple and efficient (compared to the single-thread performance of other collectors)**. Because the Serial collector has no thread-interaction overhead, it naturally achieves high single-threaded collection efficiency. The Serial collector is a good choice for virtual machines running in Client mode.

### ParNew Collector

The ParNew collector is essentially the multi-threaded version of the Serial collector. Aside from using multiple threads for garbage collection, all other behaviors (control parameters, collection algorithms, reclamation strategies, etc.) are identical to those of the Serial collector.

ParNew is responsible only for the Young Generation and uses the Mark-Copying algorithm; it is typically used in conjunction with the CMS collector, which handles the Old Generation.

![ParNew Collector](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/parnew-garbage-collector-027ab521.png)

In JDK versions where CMS was still supported, ParNew served as the Young Generation companion to CMS; CMS was removed in JDK 14, so this pairing applies only to older HotSpot versions.

**Supplementary definitions of Parallel vs. Concurrent:**

- **Parallel**: Multiple garbage collection threads work in parallel, while user threads remain in a waiting state.

- **Concurrent**: User threads and garbage collection threads execute simultaneously (though not necessarily in parallel; they may alternate execution)—user programs continue running while the garbage collector runs on another CPU.

### Parallel Scavenge Collector

The Parallel Scavenge collector is also a multi-threaded collector using the Mark-Copying algorithm, and on the surface it looks almost identical to ParNew. **So what makes it special?**

```bash
-XX:+UseParallelGC

    Use the Parallel collector (paired with Parallel Old by default in JDK 8)

-XX:+UseParallelOldGC

    Use the Parallel collector + parallel Old Generation collection
```

The Parallel Scavenge collector focuses on throughput (efficiently utilizing the CPU), whereas collectors like CMS focus more on minimizing the pause time of user threads (improving user experience). Throughput is the ratio of CPU time spent running user code to the total CPU time consumed. Parallel Scavenge provides many parameters for users to find the most suitable pause time or maximum throughput. If you are unfamiliar with how collectors work and find manual tuning difficult, using Parallel Scavenge together with adaptive sizing policies—letting the virtual machine optimize memory management—is also a good choice.

**It uses the Mark-Copying algorithm in the Young Generation and the Mark-Compact algorithm in the Old Generation.**

![Parallel Old Collector Execution Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/parallel-scavenge-garbage-collector-daa50325.png)

**This is the default collector in JDK 1.8.**

Check using the `java -XX:+PrintCommandLineFlags -version` command:

```bash
-XX:InitialHeapSize=262921408 -XX:MaxHeapSize=4206742528 -XX:+PrintCommandLineFlags -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseParallelGC
java version "1.8.0_211"
Java(TM) SE Runtime Environment (build 1.8.0_211-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.211-b12, mixed mode)
```

JDK 1.8 uses Parallel Scavenge + Parallel Old by default. Specifying `-XX:+UseParallelGC` enables `-XX:+UseParallelOldGC` by default, which can be disabled with `-XX:-UseParallelOldGC`.

### Serial Old Collector

**The Old Generation version of the Serial collector**, it is likewise a single-threaded collector. It has two main uses: one is working with the Parallel Scavenge collector in JDK 1.5 and earlier versions, and the other is serving as a fallback collector for the CMS collector.

![Serial Collector](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/serial-garbage-collector-0d0ad081.png)

### Parallel Old Collector

**The Old Generation version of the Parallel Scavenge collector.** It uses multiple threads and the "Mark-and-Compact" algorithm. In scenarios that prioritize throughput and CPU resources, Parallel Scavenge and Parallel Old collectors can be prioritized.

![Parallel Old Collector Execution Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/parallel-scavenge-garbage-collector-daa50325.png)

### CMS Collector

**The CMS (Concurrent Mark Sweep) collector is a collector aimed at achieving the shortest possible reclamation pause time. It is very well suited for applications that prioritize user experience.**

**The CMS (Concurrent Mark Sweep) collector was the first truly concurrent collector in the HotSpot Virtual Machine—it achieved, for the first time, letting garbage collection threads and user threads (mostly) work simultaneously.**

As indicated by the words **Mark Sweep** in its name, the CMS collector is implemented based on the **"Mark-and-Sweep" algorithm**, and its operation process is more complex than the previous collectors. The entire process consists of four steps:

- **Initial Mark**: A short pause to mark objects directly connected to GC Roots (root objects);
- **Concurrent Mark**: GC threads and user threads run concurrently, recording reachable objects using a closure structure. However, when this phase ends, the closure cannot guarantee it contains all currently reachable objects, because user threads may constantly update reference fields, preventing GC threads from maintaining real-time accuracy in reachability analysis. Therefore, the algorithm tracks where reference updates occur.
- **Remark**: The Remark phase corrects the marking records for those objects whose marks changed during Concurrent Mark due to continued execution of the user program. The pause time in this phase is generally slightly longer than Initial Mark, and far shorter than Concurrent Mark.
- **Concurrent Sweep**: User threads run while GC threads begin sweeping unmarked regions.

![CMS Collector](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/cms-garbage-collector-1d9958f0.png)

As its name suggests, it is an excellent garbage collector with major advantages: **concurrent collection and low pauses**. However, it has three obvious drawbacks:

- **Sensitive to CPU resources;**
- **Unable to handle floating garbage;**
- **Its reclamation algorithm—the "Mark-and-Sweep" algorithm—leaves a large amount of memory fragmentation at the end of collection.**

**The CMS garbage collector was marked as deprecated in Java 9 and removed in Java 14.**

### G1 Collector

**G1 (Garbage-First) is a server-oriented garbage collector primarily targeting machines equipped with multiple processors and large memory capacities. It satisfies GC pause time goals with very high probability while also maintaining high throughput performance characteristics.**

It was regarded as an important evolutionary feature of the HotSpot Virtual Machine in JDK 1.7. It has the following characteristics:

- **Parallel and Concurrent**: G1 can fully leverage hardware advantages in multi-CPU and multi-core environments, using multiple CPUs (or CPU cores) to shorten Stop-The-World pause times. Some GC actions that would require pausing Java threads in other collectors can continue executing concurrently alongside Java programs in G1.
- **Generational Collection**: Although G1 can independently manage the entire GC Heap without needing cooperation from other collectors, it still retains the concept of generations.
- **Space Compaction**: Unlike CMS's "Mark-and-Sweep" algorithm, G1 is based on the "Mark-and-Compact" algorithm from an overall perspective, and on the "Mark-Copying" algorithm from a local perspective.
- **Predictable Pauses**: This is another major advantage of G1 over CMS. Reducing pause times is a shared goal of both G1 and CMS, and G1 builds a prediction model based on the user-configured pause time target to select the collection set—though this target is a soft goal and does not guarantee every pause stays under the specified limit.

The operation of the G1 collector roughly involves the following steps:

- **Initial Mark**: A short pause (Stop-The-World, STW) to mark objects directly referenced from GC Roots—that is, directly reachable live objects.
- **Concurrent Mark**: Runs concurrently with the application to mark all reachable objects. This phase may take a relatively long time depending on heap size and object count.
- **Final Mark (Remark)**: A short pause (STW) to process the small number of remaining unhandled reference changes left after Concurrent Mark finishes.
- **Live Data Counting and Evacuation (Mixed/Cleanup)**: Based on marking results, selects regions with high collection value, copies live objects to new regions, and reclaims the memory of old regions. This phase includes one or more pauses (STW), depending on the complexity of reclamation.

![G1 Collector](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/g1-garbage-collector-f94fc978.png)

**The G1 collector maintains a priority list in the background and, each time based on the permitted collection time, preferentially selects the Regions with the highest reclamation value (which is where its name, Garbage-First, comes from).** This approach of dividing memory into Regions and prioritizing region reclamation ensures that G1 achieves as high a collection efficiency as possible within a limited time (breaking memory into smaller pieces).

**Starting from JDK 9, the G1 garbage collector became the default garbage collector.**

### ZGC Collector

ZGC is a garbage collector targeting low latency. It executes major tasks such as marking and object relocation concurrently with application threads, using colored pointers and load barriers to ensure objects remain properly accessible after being moved. It still has STW phases, but its design goal is to keep pauses very short without growing significantly as heap size, live object count, or thread count increases.

Here, different JDK versions need to be distinguished. Early ZGC still had thread-stack processing affecting pause times; JDK 16's [JEP 376](https://openjdk.org/jeps/376) moved work such as thread-stack processing into concurrent phases, so when describing JDK 17 ZGC, one should no longer apply the pause model of earlier versions.

#### ZGC Versions and Enabling Options

| JDK Version | ZGC Changes | Enabling Flag |
| ----------- | ----------- | ------------- |
| JDK 11–14 | Introduced as an experimental feature ([JEP 333](https://openjdk.org/jeps/333)) | `-XX:+UnlockExperimentalVMOptions -XX:+UseZGC` |
| JDK 15–20 | Became a production feature, using non-generational mode ([JEP 377](https://openjdk.org/jeps/377)) | `-XX:+UseZGC` |
| JDK 21, 22 | Added generational mode; default remained non-generational mode | Use `-XX:+UseZGC -XX:+ZGenerational` for generational mode |
| JDK 23 | When ZGC is selected, generational mode is used by default | `-XX:+UseZGC` |
| JDK 24+ | Removed non-generational mode | `-XX:+UseZGC` |

**ZGC using generational mode by default does not mean the JVM uses ZGC by default.** In a typical Server-class environment, HotSpot still selects G1 by default, so using ZGC requires explicit configuration. For example, running on JDK 17:

```bash
java -XX:+UseZGC -jar app.jar
```

JDK 17 does not support `-XX:+ZGenerational`, nor can tuning experience from Generational ZGC be applied directly to it. For the evolution of generational mode, refer to [JEP 439](https://openjdk.org/jeps/439), [JEP 474](https://openjdk.org/jeps/474), and [JEP 490](https://openjdk.org/jeps/490).

#### If Pause Times Are Very Short, Will API Responses Definitely Be Faster?

Not necessarily. GC pauses are only part of request latency. If slow requests mainly come from databases, lock contention, downstream services, or CPU saturation, switching to ZGC may not noticeably change an API's P99 latency. Concurrent GC also consumes CPU; in services with tight CPU quotas, this contention can affect throughput and request latency.

Furthermore, **low STW pauses do not mean application threads will never wait due to insufficient memory**. If objects are allocated too quickly, heap space is insufficient, or concurrent collection cannot keep up with the allocation rate, ZGC can experience Allocation Stalls. In addition to accommodating live objects, heap capacity must reserve space for new allocations during concurrent collection.

When evaluating the actual benefit of a collector, it is recommended to first compare G1 and ZGC on the same JDK, and then separately evaluate the benefits of a JDK upgrade, avoiding mixing the effects of version upgrades, code changes, and collector switches. During canary rollout, observe simultaneously:

- **Business metrics**: Throughput, P99/P999 latency, timeout rate, and error rate under the same load.
- **GC metrics**: Pause distribution, collection cycles, allocation rate, live set size after collection, and whether allocation stalls occur.
- **Resource metrics**: CPU utilization and container throttling, process memory, off-heap memory, and headroom under peak load.

For parameter configuration and common pitfalls, see [JDK 17 ZGC Parameters in the JVM Parameters Guide](./jvm-parameters-intro.md#jdk-17-zgc-parameters). Before switching in production, you should also keep a verified configuration of the previous collector and application version, and clearly define the business metrics that trigger a rollback.

For detailed introductions to the ZGC collector, the following articles are recommended:

- [Analyzing ZGC from the Perspective of Generations of GC Algorithms - JD Tech](https://mp.weixin.qq.com/s/ExkB40cq1_Z0ooDzXn7CVw)
- [Exploration and Practice of the New-Generation Garbage Collector ZGC - Meituan Tech Team](https://tech.meituan.com/2020/08/06/ZGC-in-Meituan.html)
- [Ultimate Interview Guide: Detailed Explanation of JVM Collectors G1 & ZGC - Alibaba Cloud Developer](https://mp.weixin.qq.com/s/Ywj3XMws0IIK-kiUllN87Q)

### Shenandoah Collector

Similar to ZGC, Shenandoah is also a collector targeting low latency. Led by Red Hat, it was introduced as an experimental feature in Java 12 via [JEP 189](https://openjdk.org/jeps/189) and became a production feature starting in Java 15 ([JEP 379](https://openjdk.org/jeps/379)).

Shenandoah's core idea is **concurrent compaction**: most heap compaction work runs concurrently with application threads, keeping pause times in the sub-millisecond range and independent of heap size. It primarily relies on **forwarding pointers (Brooks Pointers)** and **read barriers** (load reference barriers) to keep object movement transparent to application threads during concurrent compaction.

Note that like early ZGC, early Shenandoah was a non-generational collector, which comes with a certain throughput trade-off. Generational Shenandoah is still evolving (such as [JEP 535](https://openjdk.org/jeps/535) and [JEP 521](https://openjdk.org/jeps/521)), and is worth following continuously.

You can enable Shenandoah with the following flag:

```bash
java -XX:+UseShenandoahGC className
```

> Note: Shenandoah is not on Oracle JDK's default support list; it is mainly provided with OpenJDK distributions (such as Red Hat, Amazon Corretto, etc.). Before using it, confirm whether your JDK distribution includes and enables Shenandoah support (`-XX:+PrintFlagsFinal -version | grep UseShenandoahGC`).

## References

- *Understanding the Java Virtual Machine: JVM Advanced Features and Best Practices (2nd Edition)*
- The Java® Virtual Machine Specification - Java SE 8 Edition: <https://docs.oracle.com/javase/specs/jvms/se8/html/index.html>
