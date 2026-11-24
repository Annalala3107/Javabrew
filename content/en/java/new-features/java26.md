---
title: Java 26 New Features Overview
description: Overview of key new features and preview changes in JDK 26, focusing on HTTP/3, GC performance optimization, AOT caching, and language/platform enhancements.
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java26.md
head:
  - - meta
    - name: keywords
      content: Java 26,JDK26,HTTP/3,G1 GC,AOT Caching,Lazy Constants,Structured Concurrency,Vector API,Pattern Matching
---

JDK 26 was released on March 17, 2026 as a non-LTS (non-Long-Term Support) release. The previous LTS release is **JDK 25**, and the next LTS release is expected to be **JDK 29**.

JDK 26 includes a total of 10 new features. This article selects several of the more important features for a detailed overview:

- [JEP 517: HTTP/3 for the HTTP Client API](https://openjdk.org/jeps/517)
- [JEP 522: G1 GC: Improve Throughput by Reducing Synchronization](https://openjdk.org/jeps/522)
- [JEP 516: Ahead-of-Time Object Caching with Any GC](https://openjdk.org/jeps/516)
- [JEP 500: Prepare to Make Final Mean Final](https://openjdk.org/jeps/500)
- [JEP 526: Lazy Constants (Second Preview)](https://openjdk.org/jeps/526)
- [JEP 525: Structured Concurrency (Sixth Preview)](https://openjdk.org/jeps/525)
- [JEP 530: Primitive Types in Patterns, instanceof, and switch (Fourth Preview)](https://openjdk.org/jeps/530)
- [JEP 524: PEM Encodings of Cryptographic Objects (Second Preview)](https://openjdk.org/jeps/524)
- [JEP 529: Vector API (Eleventh Incubator)](https://openjdk.org/jeps/529)
- [JEP 504: Remove the Applet API](https://openjdk.org/jeps/504)

The chart below shows the number of new features and release dates for each update from JDK 8 to JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 517: HTTP/3 for the HTTP Client API

JDK 26 officially adds **HTTP/3** support to the `java.net.http.HttpClient` API—a long-awaited and important update.

**Advantages of HTTP/3**:

- **Based on the QUIC protocol**: While HTTP/2 is implemented over TCP, HTTP/3 builds on the QUIC (Quick UDP Internet Connections) protocol for reliable transport, providing security comparable to TLS/SSL with lower connection and transmission latency. You can think of QUIC as an upgraded version of UDP that adds features such as encryption, retransmission, and more.
- **Eliminates Head-of-Line blocking**: HTTP/2 multiplexes multiple requests over a single TCP connection; once packet loss occurs, all HTTP requests are blocked. Due to QUIC's design, HTTP/3 mitigates Head-of-Line (HOL) blocking to a large extent by establishing multiple independent streams over one connection so that packet loss on one stream does not block other streams.
- **Faster connection establishment**: HTTP/2 requires the classic TCP three-way handshake (and because secure HTTPS connections also need a TLS handshake, about 3 RTTs in total). Thanks to QUIC's integration of TLS 1.3 (which supports 0-RTT as well as 1-RTT handshakes), connection setup takes only 0-RTT or 1-RTT. This means QUIC can establish a new connection with zero extra round-trip time in the best case.
- **Better mobile experience**: HTTP/3 supports QUIC connection migration. QUIC uses variable-length connection IDs chosen by endpoints to identify and route connections, and connection IDs can even change during a connection; after path validation and related handling, network address changes (such as switching from Wi-Fi to cellular data) do not require tearing down and re-establishing the entire connection as with a traditional TCP 4-tuple change.

For a detailed introduction, you can read this article: [Computer Networking Common Interview Questions Summary (Part 1)](https://javaguide.cn/cs-basics/network/other-network-questions.html) (Network layered models, summary of common network protocols, HTTP, WebSocket, DNS, etc.).

**Usage**:

In JDK 26, the default protocol for `HttpClient` remains HTTP/2. To use HTTP/3, you need to explicitly specify `HTTP_3` on `HttpClient` or on an individual `HttpRequest`:

```java
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_3)
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://example.com"))
    .build();

// Prefer HTTP/3; falls back to HTTP/2 or HTTP/1.1 by default if unsupported by the server
HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());

System.out.println(response.body());
```

If you want to specify HTTP/3 explicitly, you can configure it via the `version()` method:

```java
// All requests default to preferring HTTP/3
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_3)  // Explicitly specify HTTP/3
    .build();

// Set the preferred protocol version for an individual HttpRequest object
HttpRequest request = HttpRequest.newBuilder(URI.create("https://javaguide.cn/"))
                         .version(HttpClient.Version.HTTP_3)
                         .GET().build();
```

## JEP 522: G1 GC: Improve Throughput by Reducing Synchronization

**Since JDK 9, the G1 garbage collector has been the default GC.** It seeks a balance between latency and throughput. However, this balance can sometimes impact application performance. Compared with throughput-oriented Parallel GC, G1 does more concurrent work alongside the application to reduce GC pause times. That means application threads must share CPU and coordinate with GC threads, and such synchronization reduces throughput and adds latency.

JEP 522 introduces a **dual Card Table** mechanism:

1. **First Card Table**: Application threads' write barriers update this card table **without any synchronization**, making write-barrier code simpler and faster.
2. **Second Card Table**: Refinement threads process this initially empty card table in the background in parallel.

When G1 detects that scanning the first card table might exceed the pause-time target, it atomically swaps the two card tables. Application threads continue updating the empty table (originally the second), while refinement threads process the full table (originally the first) without further synchronization.

**Performance Improvements**:

- In applications that **frequently modify object reference fields**, throughput improves by **5–15%**
- Even in applications that do not modify reference fields frequently, simplified write barriers (reduced on x64 from ~50 instructions to just 12 instructions) can boost throughput by up to **5%**
- GC pause times also **decrease slightly**

**Memory Overhead**:

The second card table has the same capacity as the first; each card table requires 0.2% of the Java heap capacity—about 2 MB of extra native memory per 1 GB of heap.

## JEP 516: Ahead-of-Time Object Caching with Any GC

This is a major milestone for **Project Leyden**, enabling Ahead-of-Time (AOT) object caching to work with **any garbage collector**.

Previously, AOT class data sharing introduced in JDK 24 (JEP 483) only supported the G1 garbage collector and could not work with other GCs like ZGC. This was because object references stored in the AOT cache used physical memory addresses, whereas different GCs have different memory layouts and object-relocation strategies.

JEP 516 changes the storage of object references from **physical memory addresses** to **logical indices**:

- Stores the cache in a GC-agnostic streaming format
- Allows the cache to be loaded and resolved by any GC at runtime
- Has the JVM translate logical indices into actual memory addresses upon loading

**Performance Benefits**:

- **Startup time optimization**: Significantly reduces cold-start time of Java applications
- **ZGC support**: Low-latency ZGC can now also benefit from AOT cache startup acceleration
- **Cloud-native friendly**: Particularly valuable for startup-sensitive scenarios such as microservices and serverless functions

## JEP 500: Prepare to Make Final Mean Final

This feature paves the way for Java's "integrity by default" principle, preparing to make `final` fields genuinely immutable.

Since JDK 5, to support scenarios like serialization, the reflection API has allowed modifying certain `final` fields via **deep reflection**:

```java
import java.lang.reflect.Field;

class Example {
    private final String name;

    Example(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

// Modify a final field via reflection
Example example = new Example("Original");
Field field = Example.class.getDeclaredField("name");
field.setAccessible(true);
field.set(example, "Modified");  // Succeeds by default in JDK 26, while issuing a warning for illegal final field mutation
System.out.println(example.getName());  // Outputs "Modified"
```

Although used by some frameworks (such as serialization libraries, dependency-injection frameworks, and testing tools), this capability breaks the immutability guarantee of `final` and hinders compiler optimizations.

In JDK 26, when a `final` field is mutated via deep reflection, the JVM **issues a warning**. This prepares for disallowing such operations by default in future releases.

For scenarios that genuinely need to mutate `final` fields, JDK 26 provides an explicit opt-in mechanism, allowing developers to continue using this capability during the transition period while preparing for future strict enforcement.

## JEP 526: Lazy Constants (Second Preview)

This feature was first previewed in JDK 25 as [JEP 502: Stable Values (Preview)](https://openjdk.org/jeps/502); JDK 26's JEP 526 renames the API to Lazy Constants and conducts a second preview.

Traditional `static final` fields are typically initialized during class initialization, which:

- Increases startup time.
- Wastes memory if the constant is never used.
- Requires complex lazy-initialization patterns (such as double-checked locking, holder-class idiom, etc.).

JEP 526 introduces `LazyConstant<T>`, an object holding immutable data that the JVM treats as a true constant to achieve the same performance optimizations as a declared `final` field.

```java
// Traditional approach: initialized immediately during class initialization
static final ExpensiveObject TRADITIONAL = new ExpensiveObject();

// New approach: initialized only on first access
static final LazyConstant<ExpensiveObject> LAZY =
    LazyConstant.of(() -> new ExpensiveObject());

// At usage time
ExpensiveObject obj = LAZY.get();  // Initialized only at this point
```

**Advantages**:

- **On-demand initialization**: Initialized only upon first access, improving startup performance.
- **Thread-safe**: Built-in thread-safety guarantees without manual synchronization.
- **JVM optimization**: The JVM can optimize lazy constants just like `final` fields.
- **Simpler code**: Eliminates complex lazy-initialization patterns like double-checked locking.

## JEP 525: Structured Concurrency (Sixth Preview)

JDK 19 introduced Structured Concurrency as an incubator API. In JDK 26, the API is in its sixth preview stage, aiming to simplify multithreaded programming rather than replace `java.util.concurrent`.

Structured concurrency treats multiple tasks running in different threads as a single unit of work, thereby simplifying error handling, improving reliability, and enhancing observability. In other words, structured concurrency preserves the readability, maintainability, and observability of single-threaded code.

The fundamental API of structured concurrency is `StructuredTaskScope`, which supports splitting a task into multiple concurrent subtasks that execute in their own threads, and subtasks must complete before the main/parent task continues or be cancelled if the main/parent task fails.

Basic usage of `StructuredTaskScope` is as follows:

```java
    try (var scope = StructuredTaskScope.open()) {
        // Use the fork method to spawn threads to execute subtasks
        Subtask<Integer> subtask1 = scope.fork(task1);
        Subtask<String> subtask2 = scope.fork(task2);
        // Wait for threads to complete
        scope.join();
        // Result handling may include processing or rethrowing exceptions
        ... process results/exceptions ...
    } // close
```

Structured concurrency is well suited for virtual threads, which are lightweight threads implemented by the JDK. Many virtual threads share the same operating system thread, allowing a very large number of virtual threads.

**New Changes in Java 26**:

- **Joiner enhancement**: The `Joiner` interface adds an `onTimeout()` method, allowing a specific result to be returned when a timeout occurs.
- **Return type improvement**: `allSuccessfulOrThrow()` now directly returns a result list (`List`) instead of a stream of subtasks.
- **API simplification**: `anySuccessfulResultOrThrow()` is simplified and renamed to `anySuccessfulOrThrow()`.

## JEP 530: Primitive Types in Patterns, instanceof, and switch (Fourth Preview)

This feature was first previewed in JDK 23 via [JEP 455](https://openjdk.org/jeps/455 "JEP 455").

Pattern matching can handle all primitive data types (`int`, `double`, `boolean`, etc.) in `switch` and `instanceof` statements:

```java
static void test(Object obj) {
    if (obj instanceof int i) {
        System.out.println("This is an int type: " + i);
    }
}
```

JDK 26 further enhances this feature:

- Removes several restrictions related to primitive types, making pattern matching, `instanceof`, and `switch` more uniform and expressive.
- Strengthens the definition of unconditional exactness.
- Applies stricter dominance checks in `switch` constructs, enabling the compiler to detect and prevent a wider range of coding errors.

This enables safer and more concise type matching and conversion for primitive types just like object types, further eliminating boilerplate code in Java.

## JEP 524: PEM Encodings of Cryptographic Objects (Second Preview)

This feature was first previewed in JDK 25 via [JEP 518](https://openjdk.org/jeps/518).

PEM (Privacy-Enhanced Mail) is a widely used text format for storing and transmitting cryptographic objects such as certificates, private keys, and public keys. JEP 524 provides a new API for encoding cryptographic objects into PEM format and decoding from PEM format back into cryptographic objects.

```java
// Encode a key to PEM format
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(2048);
KeyPair keyPair = kpg.generateKeyPair();

// Encode to PEM
String pemEncoded = PEMEncoder.of().encodeToString(keyPair.getPrivate());

// Decode from PEM
PrivateKey decodedKey = PEMDecoder.of().decode(pemEncoded, PrivateKey.class);
```

This API reduces error risks, simplifies compliance requirements, and enhances the portability and interoperability of secure Java applications by streamlining cryptographic setup and integration for enterprise, cloud, and regulatory needs.

## JEP 529: Vector API (Eleventh Incubator)

Vector computations consist of a sequence of operations on vectors. The Vector API expresses vector computations that reliably compile at runtime to optimal vector instructions on supported CPU architectures, thus achieving performance superior to equivalent scalar computations.

The goal of the Vector API is to give users a concise, easy-to-use, platform-independent way to express a wide range of vector computations.

Here is a simple scalar computation on array elements:

```java
void scalarComputation(float[] a, float[] b, float[] c) {
   for (int i = 0; i < a.length; i++) {
        c[i] = (a[i] * a[i] + b[i] * b[i]) * -1.0f;
   }
}
```

Here is the equivalent vector computation using the Vector API:

```java
static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;

void vectorComputation(float[] a, float[] b, float[] c) {
    int i = 0;
    int upperBound = SPECIES.loopBound(a.length);
    for (; i < upperBound; i += SPECIES.length()) {
        // FloatVector va, vb, vc;
        var va = FloatVector.fromArray(SPECIES, a, i);
        var vb = FloatVector.fromArray(SPECIES, b, i);
        var vc = va.mul(va)
                   .add(vb.mul(vb))
                   .neg();
        vc.intoArray(c, i);
    }
    for (; i < a.length; i++) {
        c[i] = (a[i] * a[i] + b[i] * b[i]) * -1.0f;
    }
}
```

Although still in incubation, its eleventh iteration suffices to demonstrate its importance. It enables Java, in performance-sensitive fields such as scientific computing, machine learning, AI inference, and big data processing, to achieve code performance approaching or even matching native languages like C++.

## JEP 504: Remove the Applet API

The Applet API was deprecated in JDK 9 and marked for removal in JDK 17. In JDK 26, the Applet API has finally been **completely removed**. What great news!

This means:

- `java.applet.Applet` and its related classes have been deleted.
- The JDK installation and source-code footprint are reduced.
- Application performance, stability, and security are improved.

Applet technology has long been obsolete, as modern web development has moved entirely to other technology stacks. Removing this legacy API is a necessary step in modernizing the Java platform.

## Summary

Although JDK 26 is a non-LTS release, it includes several noteworthy important features:

| Category | Features |
| -------- | ---------------------------------------------------------- |
| **Networking** | HTTP/3 support |
| **Performance** | G1 GC throughput optimization, AOT caching with any GC |
| **Language** | Primitive types in pattern matching (Fourth Preview), Lazy Constants (Second Preview) |
| **Concurrency** | Structured Concurrency (Sixth Preview), Vector API (Eleventh Incubator) |
| **Security** | Preparing to make `final` truly immutable, PEM encoding support |
| **Cleanup** | Removal of the Applet API |

Oracle will provide updates until September 2026, at which point it will be superseded by Oracle JDK 27.
