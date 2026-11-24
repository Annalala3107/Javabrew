---
title: Java 11 New Features Overview (Important)
description: "A summary of JDK 11 updates, highlighting practical features such as the standardized HTTP Client and String API enhancements."
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java11.md
head:
  - - meta
    - name: keywords
      content: Java 11,JDK 11,LTS,HTTP Client,String API,Removed Features
---

Java 11 was officially released on September 25, 2018, and it is a very important release! Java 11 is the first Long-Term Support (LTS) release after Java 8. According to Oracle's current support roadmap, Extended Support for Java 11 will continue until January 2032.

The image below shows the official Oracle JDK support timeline provided by Oracle:

![Oracle's official Oracle JDK support timeline](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/4c1611fad59449edbbd6e233690e9fa7-08d369cd.png)

The chart below shows the number of new features and release dates for each version from JDK 8 to JDK 25:

![Number of new features and release dates for each version from JDK 8 to JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

This article highlights some of the more important new features in detail:

- [JEP 321: HTTP Client (Standard)](https://openjdk.org/jeps/321)
- [JEP 323: Local-Variable Syntax for Lambda Parameters](https://openjdk.org/jeps/323)
- [JEP 330: Launch Single-File Source-Code Programs](https://openjdk.org/jeps/330)
- [JEP 333: ZGC: A Scalable Low-Latency Garbage Collector (Experimental)](https://openjdk.org/jeps/333)

## JEP 321: HTTP Client (Standard)

Java 11 standardized the HTTP Client API that was introduced in Java 9 and updated in Java 10. While incubating in the previous two releases, the HTTP Client was almost completely rewritten and now fully supports asynchronous non-blocking I/O.

Moreover, in Java 11, the HTTP Client package name changed from `jdk.incubator.http` to `java.net.http`. The API provides non-blocking request and response semantics through `CompletableFuture`. It is also very simple to use, as shown below:

```java
var request = HttpRequest.newBuilder()
    .uri(URI.create("https://javastack.cn"))
    .GET()
    .build();
var client = HttpClient.newHttpClient();

// Synchronous
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());

// Asynchronous
client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println);
```

## JEP 333: ZGC (A Scalable Low-Latency Garbage Collector, Experimental)

**ZGC (Z Garbage Collector)** is a scalable, low-latency garbage collector.

ZGC was primarily designed to meet the following goals:

- GC pause times do not exceed 10 ms
- Able to handle both small heaps of a few hundred MB and large heaps of multiple TB
- Application throughput drops by no more than 15% (compared to the G1 collector)
- Lays the groundwork for introducing new GC features and leveraging colored pointers and load barriers for optimization
- Currently only supported on Linux/x64 platforms

ZGC was **in the experimental stage** in Java 11 and only supported Linux/x64. Note: ZGC became a production (standard) feature in Java 15, and Generational ZGC was introduced in Java 21.

Similar to ParNew in CMS and G1, ZGC also uses a mark-copy algorithm, though ZGC makes major improvements to this algorithm.

With ZGC, Stop-The-World pauses occur much less frequently!

For details, see: [Exploration and Practice of the Next-Generation Garbage Collector ZGC [Chinese]](https://tech.meituan.com/2020/08/06/new-zgc-practice-in-meituan.html)

## JEP 323: Local-Variable Syntax for Lambda Parameters

Starting in Java 10, the key feature of local-variable type inference was introduced. Type inference allows using the `var` keyword as the type of a local variable instead of the explicit type, with the compiler inferring the type from the value assigned to the variable.

In Java 10, the `var` keyword had several restrictions:

- Could only be used on local variables
- Had to be initialized at declaration
- Could not be used as method parameters
- Could not be used in Lambda expressions

Java 11 allows developers to use `var` for parameter declarations inside Lambda expressions.

```java
// The following two are equivalent
Consumer<String> consumer = (var i) -> System.out.println(i);
Consumer<String> consumer = (String i) -> System.out.println(i);
```

## JEP 330: Launch Single-File Source-Code Programs

This means we can run a single file of Java source code directly. This feature allows the Java launcher to execute Java source code directly: the source code is compiled in memory and then executed without generating `.class` files on disk. The only constraint is that all related classes must be defined in the same Java source file.

It is especially useful for Java beginners who want to try out simple programs, and when used together with `jshell`, it enhances Java's capability for writing quick scripts to some extent.

## API Enhancements

Not all API changes are released through a JEP (Java Enhancement Proposal).

In the JDK development workflow, a **JEP** is typically used for major changes, such as introducing new language features (like `var`), new JVM mechanisms (like ZGC), or large-scale library refactoring. Operations like adding a few methods such as `String.isBlank()` to existing classes are generally treated as routine library maintenance. They are submitted and reviewed directly by JDK developers via tickets in the **JBS (JDK Bug System)** and shipped directly with the release.

### String Enhancements

Java 11 added a set of new `String` manipulation methods:

```java
// Check if the string is blank
" ".isBlank();//true
// Strip leading and trailing whitespace
" Java ".strip();// "Java"
// Strip leading whitespace
" Java ".stripLeading();   // "Java "
// Strip trailing whitespace
" Java ".stripTrailing();  // "Java"
// Repeat the string N times
"Java".repeat(3);             // "JavaJavaJava"
// Return a collection of strings separated by line terminators.
"A\nB\nC".lines().count();    // 3
"A\nB\nC".lines().collect(Collectors.toList());
```

### Optional Enhancements

Added the `isEmpty()` method to check whether the specified `Optional` object is empty.

```java
var op = Optional.empty();
System.out.println(op.isEmpty());// Check whether the specified Optional object is empty
```

## Other New Features

- **New Garbage Collector Epsilon**: A completely passive (no-op) GC implementation that allocates finite memory resources, minimizing memory overhead and memory throughput latency.
- **Low-Overhead Heap Profiling**: Java 11 provides a low-overhead sampling method for Java heap allocations, enabling inspection of heap-allocated Java objects and access to heap information via JVMTI.
- **TLS 1.3 Protocol**: Java 11 includes an implementation of the Transport Layer Security (TLS) 1.3 specification (RFC 8446), updating previous TLS support including TLS 1.2, while also improving other TLS features such as OCSP stapling extensions (RFC 6066, RFC 6961) and session hash and extended master secret extensions (RFC 7627), bringing significant improvements in both security and performance.
- **Java Flight Recorder (JFR)**: Flight Recorder was previously a profiling tool available only in the commercial Oracle JDK, but in Java 11 its source code was contributed to the open-source repository so everyone can use this feature.
- ...

## References

- JDK 11 Release Notes: <https://www.oracle.com/java/technologies/javase/11-relnote-issues.html>
- Java 11 – Features and Comparison: <https://www.geeksforgeeks.org/java-11-features-and-comparison/>
