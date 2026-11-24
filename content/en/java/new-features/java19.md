---
title: Java 19 New Features Overview
description: Overview of JDK 19 preview features and concurrency updates, paving the way for Virtual Threads.
category: Java
tag:
  - Java New Features
head:
  - - meta
    - name: keywords
      content: Java 19,JDK19,Virtual Threads Preview,Structured Concurrency,Foreign Function API,JEP
lang: en
sourceRef: zh-ref/java/new-features/java19.md
---

JDK 19 was officially released on September 20, 2022, and is a non-LTS (non-Long-Term Support) release.

JDK 19 introduces 7 new features in total. This article selects several of the more important ones for a detailed introduction:

- [JEP 424: Foreign Function & Memory API](https://openjdk.org/jeps/424) (Preview)
- [JEP 425: Virtual Threads](https://openjdk.org/jeps/425) (Preview)
- [JEP 426: Vector API](https://openjdk.java.net/jeps/426) (Fourth Incubator)
- [JEP 428: Structured Concurrency](https://openjdk.org/jeps/428) (Incubator)

The chart below shows the number of new features and release dates for each JDK version from JDK 8 to JDK 25:

![Number of new features and release dates for each version from JDK 8 to JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 424: Foreign Function & Memory API (Preview)

This API allows Java programs to interoperate with code and data outside the Java runtime. By efficiently invoking foreign functions (code outside the JVM) and safely accessing foreign memory (memory not managed by the JVM), it enables Java programs to call native libraries and process native data without the danger and fragility of JNI.

The Foreign Function & Memory API completed its first incubator round in Java 17 via [JEP 412](https://openjdk.java.net/jeps/412). Its second incubator round was proposed in [JEP 419](https://openjdk.org/jeps/419) and integrated into Java 18, and its first preview was proposed in [JEP 424](https://openjdk.org/jeps/424) and integrated into Java 19.

Before the Foreign Function & Memory API:

- Java provided low-level, unsafe operations (such as direct access to system memory resources and manual memory management) through [`sun.misc.Unsafe`](https://hg.openjdk.java.net/jdk/jdk/file/tip/src/jdk.unsupported/share/classes/sun/misc/Unsafe.java). While the `Unsafe` class gave Java C-pointer-like capabilities to manipulate memory directly, it also made Java less safe—improper use of `Unsafe` greatly increases the likelihood of program errors.
- Java 1.1 already supported native method calls via the Java Native Interface (JNI), but it was awkward to use. JNI is overly complex to implement and involves tedious steps (see [Guide to JNI (Java Native Interface)](https://www.baeldung.com/jni) for details); it bypasses JVM language safety checks and compromises Java's cross-platform nature. Moreover, JNI suffers from poor performance because JNI method calls cannot benefit from many common JIT optimizations (such as inlining). Although frameworks such as [JNA](https://github.com/java-native-access/jna), [JNR](https://github.com/jnr/jnr-ffi), and [JavaCPP](https://github.com/bytedeco/javacpp) improved upon JNI, the results were still far from ideal.

The Foreign Function & Memory API was introduced specifically to address the pain points of accessing foreign functions and foreign memory in Java.

The Foreign Function & Memory API (FFM API) defines classes and interfaces to:

- Allocate foreign memory: `MemorySegment`, `MemoryAddress`, and `SegmentAllocator`
- Manipulate and access structured foreign memory: `MemoryLayout`, `VarHandle`
- Control the allocation and deallocation of foreign memory: `MemorySession`
- Invoke foreign functions: `Linker`, `FunctionDescriptor`, and `SymbolLookup`

Below is an example using the FFM API. This code obtains a `MethodHandle` to the C library function `radixsort`, and then uses it to sort four strings in a Java array:

```java
// 1. Find foreign function on the C library path
Linker linker = Linker.nativeLinker();
SymbolLookup stdlib = linker.defaultLookup();
MethodHandle radixSort = linker.downcallHandle(
                             stdlib.lookup("radixsort"), ...);
// 2. Allocate on-heap memory to store four strings
String[] javaStrings   = { "mouse", "cat", "dog", "car" };
// 3. Allocate off-heap memory to store four pointers
SegmentAllocator allocator = implicitAllocator();
MemorySegment offHeap  = allocator.allocateArray(ValueLayout.ADDRESS, javaStrings.length);
// 4. Copy the strings from on-heap to off-heap
for (int i = 0; i < javaStrings.length; i++) {
    // Allocate a string off-heap, then store a pointer to it
    MemorySegment cString = allocator.allocateUtf8String(javaStrings[i]);
    offHeap.setAtIndex(ValueLayout.ADDRESS, i, cString);
}
// 5. Sort the off-heap data by calling the foreign function
radixSort.invoke(offHeap, javaStrings.length, MemoryAddress.NULL, '\0');
// 6. Copy the (reordered) strings from off-heap to on-heap
for (int i = 0; i < javaStrings.length; i++) {
    MemoryAddress cStringPtr = offHeap.getAtIndex(ValueLayout.ADDRESS, i);
    javaStrings[i] = cStringPtr.getUtf8String(0);
}
assert Arrays.equals(javaStrings, new String[] {"car", "cat", "dog", "mouse"});  // true
```

## JEP 425: Virtual Threads (Preview)

A Virtual Thread is a lightweight thread implemented by the JDK rather than the OS. Many virtual threads share the same operating system thread, allowing the number of virtual threads to be vastly larger than the number of operating system threads.

Lightweight threads have already proven highly useful in other concurrent languages, such as Goroutines in Go and processes in Erlang.

Virtual threads generally do not require creating or switching an operating system thread per task, thereby reducing thread resource and scheduling overhead caused by large numbers of blocking tasks, and reducing the effort required to write, maintain, and observe high-throughput concurrent applications.

There is a Zhihu discussion on Java 19 Virtual Threads if you are interested: <https://www.zhihu.com/question/536743167>.

For detailed explanations and underlying principles of Java Virtual Threads, you can read the following articles:

- [Virtual Thread Principles and Performance Analysis | Dewu Tech](https://mp.weixin.qq.com/s/vdLXhZdWyxc6K-D3Aj03LA)
- [Java 19 Officially GA! See How Virtual Threads Dramatically Boost System Throughput](https://mp.weixin.qq.com/s/yyApBXxpXxVwttr01Hld6Q)
- [Virtual Threads - Inside VirtualThread Source Code](https://www.cnblogs.com/throwable/p/16758997.html)

## JEP 426: Vector API (Fourth Incubator)

The Vector API was initially proposed in [JEP 338](https://openjdk.java.net/jeps/338) and integrated into Java 16 as an [Incubator API](http://openjdk.java.net/jeps/11). Its second incubator round was proposed in [JEP 414](https://openjdk.java.net/jeps/414) and integrated into Java 17; its third incubator round was proposed in [JEP 417](https://openjdk.java.net/jeps/417) and integrated into Java 18; and its fourth incubator round was proposed in [JEP 426](https://openjdk.java.net/jeps/426) and integrated into Java 19.

I have covered the Vector API in detail in [Java 18 New Features Overview](./java18.md), so it will not be repeated here.

## JEP 428: Structured Concurrency (Incubator)

JDK 19 introduces Structured Concurrency, an approach to multithreaded programming aimed at simplifying concurrent programming through a structured concurrency API—not to replace `java.util.concurrent`—and it is currently in the incubator stage.

Structured Concurrency treats multiple tasks running in different threads as a single unit of work, streamlining error handling and cancellation, improving reliability, and enhancing observability. In other words, structured concurrency preserves the readability, maintainability, and observability of single-threaded code.

The foundational API for Structured Concurrency is [`StructuredTaskScope`](https://download.java.net/java/early_access/loom/docs/api/jdk.incubator.concurrent/jdk/incubator/concurrent/StructuredTaskScope.html). `StructuredTaskScope` allows a task to be split into multiple concurrent subtasks that execute in their own threads, and the subtasks must complete before the main task continues.

Basic usage of `StructuredTaskScope` is as follows:

```java
    try (var scope = new StructuredTaskScope<Object>()) {
        // Fork threads to execute subtasks
        Future<Integer> future1 = scope.fork(task1);
        Future<String> future2 = scope.fork(task2);
        // Wait for threads to complete
        scope.join();
        // Result handling may include processing or rethrowing exceptions
        ... process results/exceptions ...
    } // close
```

Structured Concurrency is a great fit for Virtual Threads, which are lightweight threads implemented by the JDK. Many virtual threads share the same operating system thread, allowing a huge number of virtual threads to run concurrently.
