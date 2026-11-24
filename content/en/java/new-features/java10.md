---
title: Java 10 New Features Overview
description: "An overview of major JDK 10 updates, focusing on var local-variable type inference and other platform improvements."
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java10.md
head:
  - - meta
    - name: keywords
      content: Java 10,JDK 10,var local-variable type inference,GC improvements,performance
---

**Java 10** was released on March 20, 2018. It was a non-LTS (Long-Term Support) release, with Oracle providing only six months of support.

The chart below shows the number of new features and release dates for each version from JDK 8 to JDK 25:

![Number of new features and release dates for each version from JDK 8 to JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

This article highlights some of the more important new features in detail:

- [JEP 286: Local-Variable Type Inference](https://openjdk.org/jeps/286)
- [JEP 304: Garbage-Collector Interface](https://openjdk.org/jeps/304)
- [JEP 307: Parallel Full GC for G1](https://openjdk.org/jeps/307)
- [JEP 310: Application Class-Data Sharing](https://openjdk.org/jeps/310)
- [JEP 317: Experimental Java-Based JIT Compiler](https://openjdk.org/jeps/317)

## JEP 286: Local-Variable Type Inference

Because so many Java developers wanted local-variable type inference introduced in Java, it finally arrived in Java 10—much to everyone's anticipation!

Java 10 introduced the `var` keyword for declaring local variables.

```java
var id = 0;
var codefx = new URL("https://mp.weixin.qq.com/");
var list = new ArrayList<>();
var list = List.of(1, 2, 3);
var map = new HashMap<String, String>();
var p = Paths.of("src/test/java/Java9FeaturesTest.java");
var numbers = List.of("a", "b", "c");
for (var n : numbers)
    System.out.print(n+ " ");
```

`var` can only be used for local-variable declarations with initializers, as well as index variables in basic or enhanced `for` loops and resource variables in `try`-with-resources. It cannot be used for fields, method parameters, or return types.

```java
var count = null; // ❌ Fails to compile; cannot be initialized to null
var r = () -> Math.random();// ❌ Fails to compile; cannot be used for a Lambda expression
var array = {1, 2, 3};// ❌ Fails to compile; cannot be used for an array initializer
```

`var` does not change the fact that Java is a statically typed language—the compiler is responsible for inferring the type.

In addition, Scala and Kotlin already have the `val` keyword (equivalent to combining `final var`).

## JEP 304: Garbage-Collector Interface

In earlier JDK structures, the components that made up a Garbage Collector (GC) implementation were scattered across different parts of the codebase. Java 10 introduced a clean Garbage-Collector interface to separate the source code of different garbage collectors.

## JEP 307: Parallel Full GC for G1

Starting in Java 9, G1 became the default garbage collector. G1 is designed as a low-latency garbage collector aimed at avoiding Full GC, yet in Java 9, G1's Full GC still used a single thread to perform the mark-sweep-compact algorithm, which could happen when the collector was unable to reclaim enough memory and triggered a Full GC.

To reduce application pauses caused by Full GC, starting from Java 10, G1's Full GC uses multiple parallel worker threads to perform marking, sweeping, and compaction. This change reduces the pause duration of a Full GC, rather than directly reducing the frequency of Full GC triggers.

## JEP 310: **Application Class-Data Sharing (Extending CDS)**

Java 5 introduced Class Data Sharing (CDS), allowing a set of system classes to be preprocessed into a shared archive file so it can be memory-mapped at runtime, reducing Java application startup time and memory footprint across multiple JVMs. AppCDS—which adds application classes to the shared archive—was previously only available as a commercial feature in Oracle JDK.

Java 10 extended the existing CDS capabilities and open-sourced AppCDS, allowing application classes to be placed into the shared archive. The typical workflow is to first generate a list of application classes, then build the shared archive from that class list, and load the archive via memory mapping on subsequent startups; the class list text file itself is not a cache directly loaded by the JVM on subsequent startups.

## JEP 317: **Experimental Java-Based JIT Compiler**

Graal is a JIT compiler written in Java, and it also served as the foundation for the experimental Ahead-of-Time (AOT) compiler introduced in JDK 9.

Oracle's HotSpot VM comes with two JIT compilers implemented in C++: C1 and C2. In Java 10 (Linux/x64, macOS/x64), HotSpot still uses C2 by default, but by passing `-XX:+UnlockExperimentalVMOptions -XX:+UseJVMCICompiler` to the `java` command, C2 can be replaced with Graal.

## API Enhancements

Not all API changes are released through a JEP (Java Enhancement Proposal).

In the JDK development workflow, a **JEP** is typically used for major changes, such as introducing new language features (like `var`), new JVM mechanisms (like ZGC), or large-scale library refactoring. Operations like adding a few static methods such as `List.copyOf()` to existing classes are generally treated as routine library maintenance. They are submitted and reviewed directly by JDK developers via tickets in the **JBS (JDK Bug System)** and shipped directly with the release.

### Collection Enhancements

`List`, `Set`, and `Map` gained a static `copyOf()` method that returns an unmodifiable copy of the given collection.

```java
static <E> List<E> copyOf(Collection<? extends E> coll) {
    return ImmutableCollections.listCopy(coll);
}
```

Collections created with `copyOf()` are immutable—you cannot perform add, remove, replace, or sort operations on them, or a `java.lang.UnsupportedOperationException` will be thrown. IntelliJ IDEA also provides a corresponding inspection warning.

![Collections created with `copyOf()` are immutable](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210816154125579-18a6d393.png)

In addition, `java.util.stream.Collectors` added new static methods to collect stream elements into unmodifiable collections.

```java
var list = new ArrayList<>();
list.stream().collect(Collectors.toUnmodifiableList());
list.stream().collect(Collectors.toUnmodifiableSet());
```

### Optional Enhancements

`Optional` gained a no-argument `orElseThrow()` method as a simplified version of `orElseThrow(Supplier<? extends X> exceptionSupplier)`, throwing a `NoSuchElementException` by default when no value is present.

```java
Optional<String> optional = Optional.empty();
String result = optional.orElseThrow();
```

## Others

- **Thread-Local Handshakes**: Java 10 introduced a JVM safepoint improvement for thread management, allowing callbacks to be executed on threads without running a global JVM safepoint—executed either by the thread itself or by a JVM thread while keeping the thread blocked. This makes it possible to stop an individual thread rather than only being able to resume or stop all threads at once.
- **Heap Allocation on Alternative Memory Devices**: Java 10 enables the JVM to allocate the object heap on an alternative memory device using a heap tailored to different types of storage mechanisms.
- ...

## References

- Java 10 Features and Enhancements: <https://howtodoinjava.com/java10/java10-features/>
- Guide to Java10: <https://www.baeldung.com/java-10-overview>
- 4 Class Data Sharing: <https://docs.oracle.com/javase/10/vm/class-data-sharing.htm#JSJVM-GUID-7EAA3411-8CF0-4D19-BD05-DF5E1780AA91>
