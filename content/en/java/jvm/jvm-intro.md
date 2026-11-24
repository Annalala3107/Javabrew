---
title: Getting to Know the JVM in Plain English
description: An accessible introduction to the core components of the JVM and the class loading and execution flow, helping you quickly get started with virtual machine fundamentals.
category: Java
tag:
  - JVM
lang: en
sourceRef: zh-ref/java/jvm/jvm-intro.md
head:
  - - meta
    - name: keywords
      content: JVM basics,class loading,Method Area,Heap and Stack,Program Counter,Runtime Data Areas
---

> Contributed by [Say Your Wish](https://juejin.im/user/5c2400afe51d45451758aa96); original article: <https://juejin.im/post/5e1505d0f265da5d5d744050>.

## Preface

If there are any issues with wording or understanding in this article, feedback is always welcome. This article aims to cover the concepts without going overly deep, while introducing all the key knowledge points as efficiently as possible.

## 1. Basic Introduction to the JVM

JVM stands for Java Virtual Machine. It is a virtualized computer—a specification—implemented by emulating various computer functions on a physical machine...

Putting that formal definition aside, you can simply think of the JVM as a small computer running inside an operating system such as Windows or Linux. It interacts directly with the operating system rather than directly with the hardware, and the operating system handles communicating with the hardware for us.

![](/media/jg/ext/static001.geekbang.org/infoq/da/da0380a04d9c04facd2add5f6dba06fa-387f1eb5.webp)

### 1.1 How a Java File Is Executed

Suppose we write a file named `HelloWorld.java`. Setting everything else aside, isn't `HelloWorld.java` basically just a plain text file written in English with some indentation?

However, our **JVM** cannot understand plain text files directly, so it needs **compilation** to turn it into a binary file that the JVM can read: **`HelloWorld.class`**.

#### ① ClassLoader

If the **JVM** wants to execute this **`.class`** file, we need to pass it into a **ClassLoader**, which acts like a mover that carries all **`.class`** files into the JVM.

![](/media/jg/ext/static001.geekbang.org/infoq/2f/2f012fde94376f43a25dbe1dd07e0dd8-d2df0eec.webp)

#### ② Method Area

The **Method Area** is used to store metadata-like information, such as class metadata, constants, static variables, compiled code, etc.

When the ClassLoader brings `.class` files in, this is the first place they are placed.

#### ③ Heap

The **Heap** primarily stores object instances, arrays, and similar data. Like the Method Area, it is a **thread-shared region**. Being thread-shared only means that multiple threads can access these regions—it does not mean the region itself is "thread-unsafe"; whether a data race occurs depends on how the program accesses the data inside it.

#### ④ Stack

The **Stack** is the execution space for our code. Every method we write runs inside the **Stack**.

You may also hear the terms Native Method Stack or Java Native Interface (JNI). Native methods are implemented in native code outside Java—commonly in C or C++, though the exact implementation depends on the virtual machine and native libraries.

#### ⑤ Program Counter

The Program Counter records the address of the JVM instruction currently being executed by the current thread. After executing branches, loops, exception handling, or thread context switches, the virtual machine relies on it to resume execution. Like the Stack, it is a **thread-private** region. When executing a `native` method, the specification leaves its value undefined.

![](/media/jg/ext/static001.geekbang.org/infoq/c6/c602f57ea9297f50bbc265f1821d6263-bdeb46e3.webp)

#### Summary

1. A `.java` file is compiled into a `.class` bytecode file.
2. The bytecode file is carried into the JVM by the ClassLoader.
3. Among the JVM Runtime Data Areas, the Method Area and Heap are thread-shared regions, while the JVM Stack, Native Method Stack, and Program Counter are thread-private regions. Whether a region is shared indicates its visibility scope across threads, and does not directly equate to being thread-safe or thread-unsafe.

### 1.2 A Simple Code Example

A simple `Student` class:

![](/media/jg/ext/static001.geekbang.org/infoq/12/12f0b239db65b8a95f0ce90e9a580e4d-7a8040a0.webp)

A `main` method:

![](/media/jg/ext/static001.geekbang.org/infoq/0c/0c6d94ab88a9f2b923f5fea3f95bc2eb-bcb0f4fa.webp)

The steps for executing the `main` method are as follows:

1. After compiling `App.java` into `App.class` and running `App.class`, the system launches a JVM process, locates the binary file named `App.class` on the classpath, and loads the class information of `App` into the Method Area of the Runtime Data Areas. This process is called loading the `App` class.
2. The JVM finds the main entry point of `App` and executes the `main` method.
3. The first statement in `main` is `Student student = new Student("tellUrDream")`, which tells the JVM to create a `Student` object. However, at this point there is no information about the `Student` class in the Method Area yet, so the JVM immediately loads the `Student` class and places its class information into the Method Area.
4. After loading the `Student` class, the JVM allocates memory in the Heap for a new `Student` instance and calls the constructor to initialize it. This `Student` instance holds a reference **pointing to the type information of the `Student` class in the Method Area**.
5. When `student.sayName();` is executed, the JVM locates the `student` object via the `student` reference, follows the reference held by the `student` object to locate the method table in the `Student` class's type information in the Method Area, and obtains the bytecode address of `sayName()`.
6. Execute `sayName()`.

You don't need to overcomplicate it—just remember that when an object instance is initialized, it looks up class information in the Method Area, and then methods are executed on the Stack. Methods are looked up via the method table.

## 2. Introduction to ClassLoaders

As mentioned earlier, the ClassLoader is responsible for loading `.class` files (which have a specific magic header at the beginning of the file), loading the bytecode content of the class file into memory, and converting that content into runtime data structures in the Method Area. Moreover, the `ClassLoader` is only responsible for loading `.class` files; whether they can be executed is determined by the Execution Engine.

### 2.1 The ClassLoader Process

From the moment a class is loaded into virtual machine memory until its memory is freed, there are 7 stages in total: Loading, Verification, Preparation, Resolution, Initialization, Using, and Unloading. Among them, **Verification, Preparation, and Resolution are collectively called Linking**.

#### 2.1.1 Loading

1. Load the `.class` file into memory.
2. Convert the static data structure into a runtime data structure in the Method Area.
3. Generate a `java.lang.Class` object representing this class on the Heap as the access entry point to the data.

#### 2.1.2 Linking

1. Verification: Ensures the loaded class conforms to the JVM specification and is safe, guaranteeing that the verified class's methods will not harm the virtual machine at runtime—essentially a security check.
2. Preparation: Allocates storage space for class variables (`static` fields) and sets their default initial values. For example, `static int a = 3` typically receives the default value `0` during Preparation, and is assigned `3` during Initialization. The exact storage location is a virtual machine implementation detail.
3. Resolution: The virtual machine converts symbolic references in the runtime constant pool into direct references. Note that `import` in source code is only a compile-time name resolution mechanism, not a constant pool symbolic reference; likewise, the concrete representation of a direct reference is not necessarily an object address.

#### 2.1.3 Initialization

Initialization is the process of executing the class constructor method `<clinit>()`, and the JVM ensures that the superclass's `<clinit>()` method finishes executing first. This method is generated by the compiler collecting and sequentially executing all explicit initializations of class variables (`static`-modified member variables) and statements inside static initializer blocks (`static { ... }`). At this point, the `static int a` from Preparation changes from its default value `0` to the explicitly initialized value `3`. Because of execution order, if a class variable is reassigned inside a static block, it overwrites the explicit initialization of the class variable, and the final value will be the one assigned in the static block.

> Note: There are two initialization methods in a bytecode file: `<init>` for initializing non-static resources, and `<clinit>` for initializing static resources. The class initializer method `<clinit>()` is different from a class's constructor; these are special methods in bytecode files recognized only by the JVM.

#### 2.1.4 Unloading

Class unloading refers to the virtual machine reclaiming class metadata and its associated resources that are no longer reachable, which usually requires that the ClassLoader that defined the class is also no longer reachable. It differs from Garbage Collection of ordinary objects, and whether and when unloading occurs depends on the virtual machine implementation and the Garbage Collector.

### 2.2 ClassLoader Loading Order

Taking JDK 8 HotSpot as an example, the typical ClassLoader hierarchy is as follows. After JDK 9 modularization, `Extension ClassLoader` was replaced by `Platform ClassLoader`, and `rt.jar` no longer exists:

1. BootStrap ClassLoader: `rt.jar`
2. Extension ClassLoader: loads extension JAR packages
3. App ClassLoader: JAR packages on the specified classpath
4. Custom ClassLoader: user-defined ClassLoaders

### 2.3 Parent Delegation Mechanism

When a class receives a loading request, it does not try to load the class itself first; instead, it delegates the request to its parent ClassLoader. For example, if we want to `new Person()`—where `Person` is our custom class—loading it first delegates up from `App ClassLoader`. Only when all parent ClassLoaders report that they cannot fulfill the request (meaning none of the parent ClassLoaders found the required `Class`) will the child ClassLoader attempt to load it itself.

The benefit of this is that when loading classes located in `rt.jar`, regardless of which ClassLoader initiates the load, it will ultimately be delegated to `BootStrap ClassLoader`, ensuring that different ClassLoaders always obtain the exact same result.

This also provides isolation, preventing our code from interfering with JDK code. For instance, suppose I define my own `java.lang.String`:

```java
package java.lang;
public class String {
    public static void main(String[] args) {
        System.out.println();
    }
}
```

When trying to run this class's `main` method, our code will definitely fail with an error. That is because during loading, the JVM actually finds `java.lang.String` inside `rt.jar` and discovers that it does not contain a `main` method.

## 3. Runtime Data Areas

### 3.1 Native Method Stack and Program Counter

For example, if we open the source code of the `Thread` class, we see its `start0` method is declared with the `native` keyword and has no Java method body. Such methods are implemented by native code outside Java—commonly C or C++; the virtual machine uses the Native Method Stack to support the execution of `native` methods.

The Program Counter records the address of the JVM instruction currently being executed by the current thread. It is also the only Runtime Data Area in the *Java Virtual Machine Specification* that does not define any `OutOfMemoryError` conditions. The bytecode interpreter selects the next bytecode instruction to execute by changing the value of the Program Counter.

If the currently executing method is a `native` method, the specification leaves the Program Counter's value undefined.

### 3.2 Method Area

The primary role of the Method Area is to store class metadata, constants, static variables, etc. When the data it stores grows too large and memory allocation can no longer be satisfied, it throws an error.

### 3.3 JVM Stack and JVM Heap

In one sentence: the Stack handles execution, and the Heap handles storage. That is, the JVM Stack is responsible for running code, while the JVM Heap is responsible for storing data.

#### 3.3.1 Concept of the JVM Stack

It is the memory model for Java method execution. Every method call creates a stack frame containing the local variable table, operand stack, dynamic linking, method return address, and other information, and it is private to each thread. The local variable table is part of a stack frame.

```java
public class Person{
    int a = 1;

    public void doSomething(){
        int b = 2;
    }
}
```

#### 3.3.2 Exceptions in the JVM Stack

If the stack depth requested by a thread exceeds the maximum depth allowed by the JVM Stack, a **`StackOverflowError`** is thrown (this error frequently occurs in recursion). A JVM may also support dynamic stack expansion, continuously requesting memory as it expands; when sufficient memory cannot be allocated, an **`OutOfMemoryError`** is thrown.

#### 3.3.3 Lifecycle of the JVM Stack

For the Stack, there is no Garbage Collection. Once execution finishes, the Stack space is naturally released. The lifecycle of a Stack is identical to that of the thread it belongs to.

One additional clarification here: method parameters and primitive variables or object references declared inside a method are typically stored in the local variable table of the current stack frame, while object instances are typically allocated on the Heap. Method bytecode belongs to class metadata and is not allocated on the Stack as "instance methods."

#### 3.3.4 Execution of the JVM Stack

A stack frame is not the method itself, but the runtime data structure corresponding to a single method invocation, used to hold the local variable table, operand stack, dynamic linking, and so on. Method bytecode and metadata are not stored in the JVM Stack.

All data in the Stack exists in the form of stack frames—each is a dataset for a method and its runtime data. For example, when we execute method `a`, a corresponding stack frame `A1` is created and pushed onto the Stack. Similarly, method `b` creates `B1`, and method `c` creates `C1`. As the thread finishes executing them, the Stack pops `C1` first, followed by `B1` and `A1`. It follows a Last-In, First-Out (LIFO) principle.

#### 3.3.5 Reuse of Local Variables

The local variable table stores method parameters and local variables defined inside a method. Its capacity is measured in units of Slots, where one Slot can hold a data type up to 32 bits wide.

The virtual machine locates Slots in the local variable table by index. If the local variable table capacity is `n`, valid indices are in the range `[0, n)`; `long` and `double` occupy two consecutive Slots. Method parameters are arranged in the local variable table in the order specified by the JVM specification. To save stack frame space, once execution moves beyond a local variable's scope, its Slot can be reused by other variables; object references in the local variable table that are still considered live participate in GC Roots scanning.

#### 3.3.6 Concept of the JVM Heap

Taking HotSpot's generational Garbage Collectors as an example, the Heap is typically divided into the **Young Generation** and the **Old Generation**, and the Young Generation can be further divided into **Eden** and two **Survivor** spaces. During a copying collection, one Survivor space serves as `from` and the other as `to`. The default ratio of Eden to each Survivor space is typically **8:1:1**, though actual sizes may be affected by the chosen collector and adaptive ergonomics. The Permanent Generation (PermGen) was HotSpot's implementation of the Method Area in JDK 7 and earlier, and is not synonymous with all "non-heap memory."

Objects are mainly stored in Heap memory, where Garbage Collectors determine and reclaim unreachable objects. What HotSpot calls non-heap memory includes not only the Method Area implementation, but also regions such as the Code Cache. After JDK 8 removed the Permanent Generation, class metadata moved to Metaspace managed by the JVM; Metaspace uses native memory rather than the Java Heap. Related parameters include:

```plain
MetaspaceSize: Initial high-water mark threshold that triggers metadata GC; the JVM adjusts it dynamically afterward
MaxMetaspaceSize: Limits the upper bound of Metaspace size
```

After removing the Permanent Generation, `java.lang.OutOfMemoryError: PermGen space` caused by PermGen exhaustion no longer occurs. However, Metaspace can still throw `OutOfMemoryError: Metaspace` if there is excessive class metadata or if limits such as `MaxMetaspaceSize` are reached.

#### 3.3.7 Introduction to Eden and the Young Generation

When we `new` an object, it is first placed in a memory block carved out of Eden. However, because Heap memory is shared across threads, two objects could potentially compete for the same memory location. To handle this, the JVM pre-allocates a contiguous block of memory for each thread and designates where objects are placed; if that space runs out, additional memory blocks are allocated. This mechanism is called **TLAB** (Thread Local Allocation Buffer)—feel free to look into it if you're interested.

When Eden no longer has enough space to allocate new objects, a Minor GC (a GC occurring in the Young Generation) is usually triggered; surviving objects may be copied to a Survivor space or promoted directly to the Old Generation. Once copying completes, the `from` and `to` Survivor spaces swap roles. An object can enter the Old Generation once its age reaches the promotion threshold. In common HotSpot generational collectors, the default value of `-XX:MaxTenuringThreshold` is usually `15`, though the actual promotion age is also influenced by dynamic age evaluation, Survivor capacity, and collector policies—not every object strictly undergoes 15 Minor GCs.

> 🐛 Correction: When the Eden space becomes full, Minor GC is triggered; Survivor0 becoming full does not trigger Minor GC.
>
> **So when are objects in Survivor0 garbage-collected?**
>
> Suppose Survivor0 is currently full, and a Minor GC is triggered again and discovers that Survivor0 is still full and cannot fit more objects. At that point, the JVM performs Reachability Analysis on the objects in both S0 and Eden together, identifies live objects, copies them to S1, and clears S0 and Eden—thereby reclaiming unreachable objects—and then swaps S0 and S1.

The Old Generation mainly stores long-lived objects or objects promoted directly. Insufficient space in the Old Generation may trigger an Old Generation collection or a Full GC, with exact behavior depending on the Garbage Collector; pause scopes also vary across collectors and cannot be generalized as stopping all application threads for the entire duration.

Furthermore, if object allocation still cannot be satisfied after a Full GC in the Old Generation, an OOM occurs. This indicates insufficient Heap memory in the virtual machine—either because the configured Heap size is too small (which can be adjusted with `-Xms` and `-Xmx`), or because the code creates large and numerous objects that remain continuously referenced so Garbage Collection cannot reclaim them for a long time.

![](/media/jg/ext/static001.geekbang.org/infoq/39/398255141fde8ba208f6c99f4edaa9fe-1930adc5.webp)

Additional note on `-XX:TargetSurvivorRatio`: An object does not necessarily have to reach `-XX:MaxTenuringThreshold` before moving to the Old Generation. For example, suppose objects of age 5 occupy 30%, age 6 occupy 36%, and age 7 occupy 34%. When adding up through a certain age (age 6 in this example) causes total occupancy to exceed `Survivor space * TargetSurvivorRatio`, objects of that age and older (age 6 and age 7 here) are promoted directly to the Old Generation without waiting to reach the `15` required by `MaxTenuringThreshold`.

#### 3.3.8 How to Determine Whether an Object Should Be Collected

![](/media/jg/ext/static001.geekbang.org/infoq/1b/1ba7f3cff6e07c6e9c6765cc4ef74997-55677e4a.webp)

In the diagram, three regions—the Program Counter, JVM Stack, and Native Method Stack—live and die alongside their thread. Their memory allocation and reclamation are deterministic: when the thread terminates, the memory is naturally reclaimed, so there is no need to consider Garbage Collection for them. In contrast, the Java Heap and Method Area are shared among threads, and their memory allocation and reclamation are dynamic. Therefore, Garbage Collectors focus on the Heap and Method Area memory.

Before collecting memory, the JVM must determine which objects are still alive and which are dead. Below are two foundational algorithms:

1. **Reference Counting**: Attach a reference counter to each object. Whenever a reference to the object is added, the counter increments by 1; when a reference becomes invalid, it decrements by 1. When the counter equals 0, the object will not be used again. However, this approach has a flaw: when circular references occur between objects, GC cannot reclaim them.

2. **Reachability Analysis**: Starting from a set of objects called **GC Roots**, search along the reference chains between objects (the path traversed is called a reference chain). The reference relationships between objects form a graph, not a binary tree. When no reference chain connects an object to any GC Root, the object is unreachable. Mainstream commercial programming languages such as Java and C# use this approach to determine object liveness.

(Good to know) In Java, objects that can act as GC Roots fall into the following categories:

1. Objects referenced in the JVM Stack (local variable table in stack frames—local variables)
2. Objects referenced by static variables in the Method Area (static variables)
3. Objects referenced by constants in the Method Area
4. Objects referenced by JNI in the Native Method Stack (i.e., `native`-modified methods; JNI is how the JVM calls corresponding C functions, which can also create new Java objects, and both local and global JNI references mark the referenced objects as non-collectible)
5. Active Java threads that have started and have not yet terminated

The advantage of this method is that it solves the circular reference problem. Collectors need a consistent snapshot of object reference relationships during certain phases, which typically incurs Stop-The-World pauses; modern concurrent collectors can perform much of the marking work concurrently with application threads, rather than stopping all threads throughout the entire Reachability Analysis process.

#### 3.3.9 How an Object Is Officially Declared Dead

First, we must mention a method named **`finalize()`**.

`finalize()` is a method of the `Object` class. An object's `finalize()` method will be automatically invoked by the system at most once; if the object re-establishes reachability during that method, `finalize()` will not be called again the next time it is deemed unreachable.

One extra note: using `finalize()` in application code for self-rescue is strongly discouraged. Its execution timing is unpredictable—it is not even guaranteed to run—its runtime cost is high, and the invocation order across objects cannot be guaranteed. `finalize()` was deprecated in Java 9 and marked for removal in Java 18. When managing off-heap resources, you should use `try-with-resources` or `java.lang.ref.Cleaner` depending on the scenario (`Cleaner` itself is not an umbrella term for strong, soft, weak, and phantom references).

![](/media/jg/ext/static001.geekbang.org/infoq/8d/8d7f0381c7d857c7ceb8ae5a5fef0f4a-e101993a.webp)

For an object that overrides `finalize()` and has not yet executed it, its handling is typically summarized as a two-marking process:

1. If no reference chain to GC Roots is found during Reachability Analysis, the object is marked for the first time and screened. For objects for which executing `finalize()` is deemed necessary, HotSpot may place the corresponding finalizer reference into a pending queue to be processed asynchronously by the Finalizer thread.
2. If the object re-establishes an association with an object on a reference chain inside `finalize()`, subsequent Garbage Collection will remove it from the "to-be-reclaimed" set; otherwise, the object can still be reclaimed. This process does not mean the Garbage Collector synchronously waits for `finalize()` to run, nor does it guarantee that the method will ever be called.

Once an object is confirmed dead, how do we reclaim that garbage?

### 3.4 Garbage Collection Algorithms

For a detailed introduction to common Garbage Collection algorithms, we recommend reading: [Detailed Explanation of JVM Garbage Collection (Key Topic)](https://javaguide.cn/java/jvm/jvm-garbage-collection.html).

### 3.5 (Good to Know) Various Garbage Collectors

Garbage Collectors in HotSpot VM and their applicable scenarios:

![](/media/jg/ext/static001.geekbang.org/infoq/9f/9ff72176ab0bf58bc43e142f69427379-070e8963.webp)

In typical JDK 8 Server HotSpot configurations, the default combination is usually Parallel Scavenge and Parallel Old; actual defaults may still vary depending on the VM implementation, execution mode, and platform.

JDK 9 made G1 the default Garbage Collector for Server HotSpot. Different collectors make different trade-offs among throughput, latency, memory footprint, and CPU overhead, so you cannot assert that a particular collector always has the shortest pauses without considering the application workload and JVM configuration.

### 3.6 (Good to Know) Common JVM Parameters

There are a huge number of JVM parameters; here we only list several of the more important ones—you can easily look up more via search engines.

| Parameter Name               | Meaning                                              | Notes                                                                                                           |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `-Xms`                       | Initial Heap size                                    | The default is computed by HotSpot's adaptive ergonomics based on the runtime environment; avoid treating it as a fixed fraction of physical RAM |
| `-Xmx`                       | Maximum Heap size                                    | The default is computed by HotSpot's adaptive ergonomics based on the runtime environment                       |
| `-Xmn`                       | Young Generation size                                | Applies only to collectors with a fixed Young Generation concept; setting it explicitly restricts adaptive resizing |
| `-XX:NewSize`                | Initial Young Generation size                        | Effective only for generational collectors that support this parameter                                          |
| `-XX:MaxNewSize`             | Maximum Young Generation size                        | Effective only for generational collectors that support this parameter                                          |
| `-XX:PermSize`               | Initial Permanent Generation size                    | Applies only to HotSpot JDK 7 and earlier; PermGen was removed in JDK 8                                         |
| `-XX:MaxPermSize`            | Maximum Permanent Generation size                    | Applies only to HotSpot JDK 7 and earlier; PermGen was removed in JDK 8                                         |
| `-Xss`                       | Stack size per thread                                | Default depends on platform and JVM version; tune based on thread count, call depth, and test results           |
| `-XX:NewRatio`               | Ratio of Old Generation to Young Generation capacity | For example, a value of `4` sets Old:Young = 4:1; whether it takes effect depends on the collector              |
| `-XX:SurvivorRatio`          | Ratio of Eden to a single Survivor space capacity    | For example, `8` typically sets Eden:From:To = 8:1:1; adaptive ergonomics may adjust actual sizes               |
| `-XX:+DisableExplicitGC`     | Ignore explicit GC requests via `System.gc()`        | Does not disable automatic JVM Garbage Collection; evaluate direct memory and similar scenarios before enabling |
| `-XX:PretenureSizeThreshold` | Threshold for large objects to allocate directly in Old Gen | Whether it is supported and how it behaves depends on the Garbage Collector                                    |
| `-XX:ParallelGCThreads`      | Number of GC threads during Stop-The-World parallel phases | Default is calculated by the JVM based on available processors and other factors                               |
| `-XX:MaxGCPauseMillis`       | Target maximum GC pause time                         | This is a soft goal rather than a hard guarantee; actual effect depends on the Garbage Collector used           |

There are also parameters for logging and CMS, which we won't list one by one here.

## 4. Aspects of JVM Tuning

Based on the JVM knowledge just covered, we can try tuning the JVM—mainly focusing on Heap memory.

For collectors using a fixed generational layout, the Java Heap can be roughly viewed as the sum of the Young Generation and Old Generation; PermGen or Metaspace does not belong to the Java Heap. When the total Heap size is fixed, increasing the Young Generation shrinks the Old Generation space, but there is no single "official optimal ratio" for all applications—it must be tested based on object allocation patterns, object lifetimes, and the collector in use.

### 4.1 Adjusting Maximum and Minimum Heap Memory

`-Xmx` and `-Xms` specify the maximum and initial sizes of the Java Heap, respectively. When not explicitly configured, the defaults are adaptively computed by HotSpot based on the JVM version, available memory, container limits, and runtime environment, and should not be estimated using fixed ratios of physical memory.

HotSpot can resize the committed Heap space between `-Xms` and `-Xmx`; `MinHeapFreeRatio` and `MaxHeapFreeRatio` are parameters used by some collectors to control the free-space ratio after GC. Actual expansion/shrinking behavior and default ratios depend on the collector, JDK version, and adaptive ergonomics, and cannot be uniformly summarized as fixed 40% and 70% thresholds.

Setting `-Xms` and `-Xmx` to the same value avoids resizing the committed Heap at runtime, but reserves a larger Heap capacity right from startup; whether to do so should still be evaluated against your deployment environment and workload.

Let's run the following code:

```java
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");    // Maximum memory of the system
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Free memory of the system
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");  // Total currently available memory
```

Note: What is configured here is the Java Heap size, i.e., Young Generation size + Old Generation size.

![](/media/jg/ext/static001.geekbang.org/infoq/11/114f32ddd295b2e30444f42f6180538c-7d9aeca7.webp)

Set VM options:

```plain
-Xmx20m -Xms5m -XX:+PrintGCDetails
```

![](/media/jg/ext/static001.geekbang.org/infoq/7e/7ea0bf0dec20e44bf95128c571d6ef0e-37f29f07.webp)

Launch the `main` method again:

![](/media/jg/ext/static001.geekbang.org/infoq/c8/c89edbd0a147a791cfabdc37923c6836-134b48a9.webp)

Here GC logged an `Allocation Failure`, which occurred in `PSYoungGen`—that is, the Young Generation.

At this point, the maximum allocated memory is 18M, and free memory is 4.214195251464844M.

Now let's create a byte array and run the following code:

```java
byte[] b = new byte[1 * 1024 * 1024];
System.out.println("Allocated 1M space for the array");
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");  // Maximum memory of the system
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Free memory of the system
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");
```

![](/media/jg/ext/static001.geekbang.org/infoq/db/dbeb6aea0a90949f7d7fe4746ddb11a3-d1bef71a.webp)

At this time, `free memory` shrank again, while `total memory` did not change. Java tries to keep `total mem` close to the minimum Heap size as much as possible.

```java
byte[] b = new byte[10 * 1024 * 1024];
System.out.println("Allocated 10M space for the array");
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");  // Maximum memory of the system
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Free memory of the system
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");  // Total currently available memory
```

![](/media/jg/ext/static001.geekbang.org/infoq/b6/b6a7c522166dbd425dbb06eb56c9b071-96fafe0f.webp)

Here we created a 10M byte array, which the minimum Heap memory cannot hold. We can see that `total memory` has now become 15M, which is the result of requesting additional memory.

Now let's run this code as well:

```java
System.gc();
System.out.println("Xmx=" + Runtime.getRuntime().maxMemory() / 1024.0 / 1024 + "M");    // Maximum memory of the system
System.out.println("free mem=" + Runtime.getRuntime().freeMemory() / 1024.0 / 1024 + "M");  // Free memory of the system
System.out.println("total mem=" + Runtime.getRuntime().totalMemory() / 1024.0 / 1024 + "M");  // Total currently available memory
```

![](/media/jg/ext/static001.geekbang.org/infoq/8d/8dd6e8fccfd1394b83251c136ee44ceb-f05cdfe0.webp)

Calling `System.gc()` here only submits a Garbage Collection suggestion to the JVM and does not guarantee a Full GC will run; in the run shown in the screenshot, it indeed triggered the corresponding collection and shrank the committed Heap space, though results may differ under other JVM flags and collectors.

### 4.2 Adjusting the Ratio of Young Generation to Old Generation

```plain
-XX:NewRatio --- Ratio of Young Generation (eden + 2*Survivor) to Old Generation (excluding PermGen)

For example: -XX:NewRatio=4 means Young Generation : Old Generation = 1:4, i.e., Young Generation occupies 1/5 of the entire Heap. When Xms=Xmx and Xmn is set, this parameter does not need to be set.
```

### 4.3 Adjusting the Ratio of Survivor Spaces to Eden Space

```plain
-XX:SurvivorRatio --- Sets the ratio of the two Survivor spaces to Eden

For example: 8 means two Survivor : Eden = 2:8, i.e., one Survivor occupies 1/10 of the Young Generation
```

### 4.4 Setting the Size of Young Generation and Old Generation

```plain
-XX:NewSize --- Sets the Young Generation size
-XX:MaxNewSize --- Sets the maximum Young Generation size
```

You can test different scenarios by configuring various parameters. A common initial ratio for Eden and the two Survivor spaces is `8:1:1`, but this is not the optimal solution for every application and collector; likewise, having `-Xms` differ from `-Xmx` does not necessarily mean it will cause many GCs.

### 4.5 Summary

You should adjust Young Generation and Survivor sizes based on actual workloads, the Garbage Collector in use, and GC logs—there is no single fixed recommended ratio that applies to all applications.

When an OOM occurs, remember to dump the Heap so you can investigate the issue on site. You can output a `.dump` file with the command below, which can be analyzed using tools like VisualVM. Starting from JDK 9, VisualVM is no longer bundled with Oracle JDK and must be installed separately.

```plain
-Xmx20m -Xms5m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=<your-output-log-path>
```

Usually we can also write a script so that when an OOM occurs, it notifies us by sending an email or automatically restarting the application to resolve the incident.

### 4.6 Permanent Generation Settings (Applies Only to HotSpot JDK 7 and Earlier)

```plain
-XX:PermSize -XX:MaxPermSize
```

`PermSize` sets the initial size of the Permanent Generation, and `MaxPermSize` sets its upper bound; exact defaults depend on the JVM version and platform and cannot be stated uniformly as a fixed fraction of physical memory. On JDK 8 and later, you should focus on Metaspace-related parameters rather than these two PermGen parameters.

Tip: If an OOM is thrown even though the Heap space has not been exhausted, it might be caused by the Permanent Generation. Even when actual Heap usage is very small, an overflow in PermGen still throws an OOM.

### 4.7 JVM Stack Parameter Tuning

#### 4.7.1 Adjusting the Stack Size Per Thread

You can adjust the stack size per thread via `-Xss`.

The default thread stack size depends on the JVM version, platform, and execution mode—it is not uniformly 1 MB since JDK 5. All else being equal, reducing thread stack size leaves address space for more platform threads, though thread count is also constrained by the OS, and making the stack too small increases the risk of `StackOverflowError`.

#### 4.7.2 Setting the Thread Stack Size

```plain
-XX:ThreadStackSize=<size>:
Sets the thread stack size (0 means use default stack size)
```

All of these parameters can easily be tested by writing small programs yourself; due to space constraints, no demos are provided here.

### 4.8 (You Can Skip This) Other JVM Parameters

There are all kinds of parameters, so I won't drag through every single one of them, because most people don't actually need to dig that deep.

#### 4.8.1 Setting Large Memory Page Size

```plain
-XX:LargePageSizeInBytes=<size>
```

This parameter sets the large memory page size; whether it takes effect depends on the operating system, JVM build, and huge-page configuration.

#### 4.8.2 Historical Parameter `UseFastAccessorMethods`

```plain
-XX:+UseFastAccessorMethods
```

This legacy HotSpot parameter targeted optimization of reflection accessors, not "fast optimization of primitive types"; modern JDKs no longer provide this parameter.

#### 4.8.3 Disabling Manual GC

```plain
-XX:+DisableExplicitGC:
Disables System.gc() (this parameter requires strict testing)
```

#### 4.8.4 Setting Maximum Object Tenuring Age

```plain
-XX:MaxTenuringThreshold
Sets the upper limit for object promotion age. When set to 0, generational collectors that support this flag promote surviving Young Generation objects directly without passing through Survivor spaces. Increasing this value may allow objects to undergo more copy cycles in Survivor spaces, though actual promotion is also influenced by dynamic age evaluation, Survivor capacity, and collector policies.
```

Not all Garbage Collectors use the same generational and age-promotion mechanisms; check the documentation for your current collector to verify whether it takes effect.

#### 4.8.5 Historical Parameter `AggressiveOpts`

```plain
-XX:+AggressiveOpts
```

This was a flag in older HotSpot versions used to enable experimental performance optimizations; it cannot simply be understood as "speeding up compilation," and it was removed in JDK 12.

#### 4.8.6 Historical Parameter `UseBiasedLocking`

```plain
-XX:+UseBiasedLocking
```

Biased Locking was disabled by default and deprecated in JDK 15, and its implementation was subsequently removed from HotSpot; it should not be used as a general tuning flag in modern JDKs.

#### 4.8.7 Disabling Class Unloading

```plain
-Xnoclassgc
```

This parameter disables Garbage Collection of classes, not Garbage Collection of objects.

#### 4.8.8 Setting Heap Free-Space Retention Time for SoftReferences

```plain
-XX:SoftRefLRUPolicyMSPerMB
Sets the survival time of a SoftReference per megabyte of free Heap space; the default is 1s.
```

#### 4.8.9 Allocating Objects Directly in the Old Generation

```plain
-XX:PretenureSizeThreshold
Sets the size threshold beyond which an object is allocated directly in the Old Generation; the default is 0.
```

#### 4.8.10 Setting TLAB Percentage of Eden

```plain
-XX:TLABWasteTargetPercent
Sets the percentage of the Eden space that a TLAB can occupy; the default is 1%.
```

## Finally

I really rambled on about this for a long time, drawing on multiple sources—including GeekTime's *In-Depth Analysis of Virtual Machine* and *Core Java Interview Essentials*, Baidu searches, and my own notes from online courses I've studied. Hope this helps you—thank you!
