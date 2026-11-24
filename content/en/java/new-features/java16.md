---
title: Java 16 New Features Overview
description: Introduction to JDK 16 language and platform updates, including Record classes and other JEP changes.
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java16.md
head:
  - - meta
    - name: keywords
      content: Java 16,JDK 16,Record Improvements,New APIs,JEP,Performance
---

Java 16 was officially released on March 16, 2021. It is a non-Long-Term Support (LTS) release.

JDK 16 includes 17 new features in total. This article selects and explains several of the more important new features in detail:

- [JEP 338: Vector API (Incubator)](https://openjdk.java.net/jeps/338)
- [JEP 376: ZGC: Concurrent Thread-Stack Processing](https://openjdk.java.net/jeps/376)
- [JEP 387: Elastic Metaspace](https://openjdk.java.net/jeps/387)
- [JEP 390: Warnings for Value-Based Classes](https://openjdk.java.net/jeps/390)
- [JEP 394: Pattern Matching for instanceof](https://openjdk.java.net/jeps/394)
- [JEP 395: Records](https://openjdk.java.net/jeps/395)
- [JEP 396: Strongly Encapsulate JDK Internals by Default](https://openjdk.java.net/jeps/396)
- [JEP 397: Sealed Classes (Second Preview)](https://openjdk.java.net/jeps/397)

The chart below shows the number of new features and release dates for each version from JDK 8 to JDK 25:

![Number of new features and release dates for each version from JDK 8 to JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Related reading: [OpenJDK Java 16 Documentation](https://openjdk.java.net/projects/jdk/16/).

## JEP 338: Vector API (Incubator)

The Vector API was first proposed by [JEP 338](https://openjdk.java.net/jeps/338) and integrated into Java 16 as an [Incubator API](http://openjdk.java.net/jeps/11). The second round of incubation was proposed by [JEP 414](https://openjdk.java.net/jeps/414) and integrated into Java 17; the third round was proposed by [JEP 417](https://openjdk.java.net/jeps/417) and integrated into Java 18; and the fourth round was proposed by [JEP 426](https://openjdk.java.net/jeps/426) and integrated into Java 19.

This incubator API provides an initial iteration of an API for expressing vector computations that reliably compile at runtime to optimal vector hardware instructions on supported CPU architectures, thereby achieving better performance than equivalent scalar computations by taking full advantage of Single Instruction, Multiple Data (SIMD) technology (an instruction capability available on most modern CPUs). Although HotSpot supports auto-vectorization, the set of scalar operations that can be transformed is limited and fragile with respect to code changes. This API enables developers to easily write portable, high-performance vector algorithms in Java.

I have already covered the Vector API in detail in [Java 18 New Features Overview](./java18.md), so I will not repeat the explanation here.

## JEP 347: Enable C++ 14 Language Features

Java 16 allows the use of C++ 14 language features in the JDK's C++ source code, and provides specific guidance on which features may be used in HotSpot code.

In Java 15, the language features used in the JDK's C++ code were restricted to the C++98/03 language standards. This change requires updating the minimum acceptable compiler versions across various platforms.

## JEP 376: ZGC: Concurrent Thread-Stack Processing

Java 16 moves ZGC thread-stack processing out of safepoints into a concurrent phase, allowing GC safepoint pauses to remain under a millisecond even on large heaps. Eliminating the last remaining source of latency in the ZGC garbage collector greatly improves application performance and efficiency.

## JEP 387: Elastic Metaspace

Since Metaspace was introduced, feedback showed that Metaspace frequently occupied excessive off-heap memory, leading to memory waste. Elastic Metaspace returns unused HotSpot class metadata (i.e., Metaspace) memory back to the operating system more promptly, thereby reducing the memory footprint of Metaspace.

Moreover, this proposal simplifies the Metaspace codebase to reduce maintenance costs.

## JEP 390: Warnings for Value-Based Classes

> The following introduction is excerpted from: [Hands-on | Dissecting Java 16's New Syntax Features](https://xie.infoq.cn/article/8304c894c4e38318d38ceb116) (in Chinese). The original article is very well written and recommended reading.

Back in Java 9, Java's designers upgraded the `@Deprecated` annotation by adding two new elements: `since` and `forRemoval`. Specifically, `since` specifies the version in which the `@Deprecated`-annotated API was deprecated, while `forRemoval` further clarifies the semantics of marking an API with `@Deprecated`: if `forRemoval=true`, it indicates that the API will definitely be removed in a future version and developers should migrate to the new API, reducing ambiguity (before Java 9, marking an API with `@Deprecated` could mean several different things, such as usage risks, potential future compatibility errors, future removal, or simply that a better alternative should be used).

If you examine the primitive wrapper classes (such as `java.lang.Integer` and `java.lang.Double`), it is easy to see that their constructors are already marked with `@Deprecated(since="9", forRemoval = true)`. This means these constructors are scheduled for removal in the future, and code such as `new Integer(10)` should no longer be used (instead, use `Integer a = 10` or `Integer.valueOf()`). If you continue using them, the compiler will emit the warning `'Integer(int)' is deprecated and marked for removal`. In addition, these wrapper types—along with `java.util.Optional` and `java.time.LocalDateTime`—have been designated as value-based classes (not to be confused with value types in Project Valhalla).

Second, using instances of value-based classes in a `synchronized` block causes the JDK 16 compiler to produce a warning. HotSpot can also log or forbid such synchronization at runtime via diagnostic flags. Even without runtime diagnostics enabled, instances of value-based classes should never be used as locks. For example:

```java
private Integer count = 0;

public void inc() {
    synchronized (count) {
        count++;
    }
}
```

`Integer` is an immutable object; `count++` performs unboxing, increments by one, re-boxes, and reassigns the field reference to a different `Integer` instance. Therefore, different threads may lock on different objects, failing to provide stable mutual exclusion for this compound operation. If concurrent incrementing is needed, a fixed lock object or `AtomicInteger` should be used instead.

## JEP 392: Packaging Tool (Standard)

In Java 14, JEP 343 introduced the packaging tool with the command `jpackage`. It continued incubating in Java 15, and now in Java 16, it has finally become a standard feature.

This packaging tool makes it possible to package self-contained Java applications. It supports native packaging formats to deliver a natural installation experience for end users, including `msi` and `exe` on Windows, `pkg` and `dmg` on macOS, and `deb` and `rpm` on Linux. It also allows launch-time parameters to be specified during packaging and can be invoked directly from the command line or programmatically via the `ToolProvider` API. Note that the `jpackage` module name changed from `jdk.incubator.jpackage` to `jdk.jpackage`. This improves the end-user installation experience and simplifies deployment under the "app store" model.

For hands-on usage of this packaging tool, you can watch the video [Playing with Java 16 jpackage](https://www.youtube.com/watch?v=KahYIVzRIkQ) (may require VPN/proxy access depending on your region).

## JEP 393: Foreign Memory Access API (Third Incubator)

Introduces the Foreign-Memory Access API to allow Java programs to safely and efficiently access off-heap foreign memory outside the Java Heap.

The Foreign-Memory Access API underwent its first incubation in Java 14 ([JEP 370](https://openjdk.org/jeps/370)), its second incubation in Java 15 ([JEP 383](https://openjdk.org/jeps/383)), and its third incubation in Java 16.

The goals of introducing the Foreign-Memory Access API are as follows:

- **Generality**: A single API should be able to operate on various kinds of foreign memory (such as native memory, persistent memory, heap memory, etc.).
- **Safety**: Regardless of the type of memory accessed, the API must never compromise JVM safety.
- **Control**: Developers can freely choose how memory is deallocated (explicitly, implicitly, etc.).
- **Usability**: For programs that need to access foreign memory, the API should provide an easy-to-use alternative sufficient to replace `sun.misc.Unsafe`.

## JEP 394: Pattern Matching for instanceof (Standard)

| JDK Version | Update Type       | JEP                                     | Changes                                                      |
| ----------- | ----------------- | --------------------------------------- | ------------------------------------------------------------ |
| Java SE 14  | preview           | [JEP 305](https://openjdk.org/jeps/305) | First introduced pattern matching for `instanceof`.          |
| Java SE 15  | Second Preview    | [JEP 375](https://openjdk.org/jeps/375) | No changes compared to the previous version; continued collecting feedback. |
| Java SE 16  | Permanent Release | [JEP 394](https://openjdk.org/jeps/394) | Pattern variables are no longer implicitly `final`.          |

Starting from Java 16, you can modify the value of the pattern variable in `instanceof`.

```java
// Old code
if (o instanceof String) {
    String s = (String)o;
    ... use s ...
}

// New code
if (o instanceof String s) {
    ... use s ...
}
```

## JEP 395: Records (Standard)

History of changes to `record` types:

| JDK Version | Update Type       | JEP                                          | Changes                                                                                    |
| ----------- | ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Java SE 14  | Preview           | [JEP 359](https://openjdk.java.net/jeps/359) | Introduced the `record` keyword, providing a compact syntax for immutable data classes.    |
| Java SE 15  | Second Preview    | [JEP 384](https://openjdk.org/jeps/384)      | Supported using `record` inside local methods and interfaces.                              |
| Java SE 16  | Permanent Release | [JEP 395](https://openjdk.org/jeps/395)      | Non-static inner classes can declare non-constant static members.                          |

Starting from Java SE 16, non-static inner classes can define non-constant static members.

```java
public class Outer {
  class Inner {
    static int age;
  }
}
```

> Before JDK 16, if you wrote code like the snippet above, the IDE would warn you that the static field `age` cannot be declared in a non-static inner type unless initialized with a constant expression.

## JEP 396: Strongly Encapsulate JDK Internals by Default

This feature strongly encapsulates all internal elements of the JDK by default, except for critical internal APIs (such as `sun.misc.Unsafe`). Code that compiled successfully in earlier releases and accesses JDK internal APIs may no longer work by default. Developers are encouraged to migrate from internal elements to standard APIs so that both they and their users can upgrade seamlessly to future Java releases. Strong encapsulation is controlled by the JDK 9 launcher option `--illegal-access`, which defaulted to `warn` through JDK 15 and defaults to `deny` starting in JDK 16. It is still possible (for now) to relax encapsulation across all packages with a single command-line option, whereas in the future only `--add-opens` will be available to open specific packages.

## JEP 397: Sealed Classes (Second Preview)

Sealed classes were first proposed for preview in [JEP 360](https://openjdk.java.net/jeps/360) and integrated into Java 15. In JDK 16, sealed classes were refined (with stricter reference checks and inheritance rules for sealed classes) and proposed for a second preview in [JEP 397](https://openjdk.java.net/jeps/397).

I have already covered sealed classes in detail in [Java 14 & 15 New Features Overview](./java14-15.md), so I will not repeat the explanation here.

## Other Optimizations and Improvements

- **JEP 380: Unix-Domain Socket Channels**: Unix-domain sockets have long been a feature of most Unix platforms, and support is now also available on Windows 10 and Windows Server 2019. This feature adds Unix-domain (`AF_UNIX`) socket support to the socket channel and server-socket channel APIs in the `java.nio.channels` package, and extends the inherited channel mechanism to support Unix-domain socket channels and server-socket channels. Unix-domain sockets are used for inter-process communication (IPC) on the same host. They are largely similar to TCP/IP, except that sockets are addressed via filesystem pathnames rather than Internet Protocol (IP) addresses and port numbers. For local IPC, Unix-domain sockets are more secure and more efficient than TCP/IP loopback connections.
- **JEP 389: Foreign Linker API (Incubator)**: This incubator API provides statically typed, pure-Java access to native code, greatly simplifying the traditionally complex and error-prone process of binding native libraries. Java has supported native method calls via the Java Native Interface (JNI) since Java 1.1, but JNI is cumbersome to use. Java developers should be able to bind specific native libraries for specific tasks. It also provides foreign-function support without any intermediate JNI glue code.
- **JEP 357: Migrate from Mercurial to Git**: Previously, OpenJDK source code was managed using the Mercurial version control tool; it has now been migrated to Git.
- **JEP 369: Migrate to GitHub**: Consistent with JEP 357's migration from Mercurial to Git, after moving version control to Git, the OpenJDK community chose to host its Git repositories on GitHub. However, only JDK 11 and later JDK versions were migrated.
- **JEP 386: Alpine Linux Port**: Alpine Linux is an independent, non-commercial Linux distribution that is extremely small—requiring no more than 8 MB for a container and roughly 130 MB for a minimal disk installation—while remaining simple and security-focused. This proposal ports the JDK to Alpine Linux; because Alpine Linux is a lightweight Linux distribution based on `musl libc`, it also applies to other Linux distributions on x64 and AArch64 architectures that use `musl libc`.
- **JEP 388: Windows/AArch64 Port**: The focus of these JEPs is not the porting work itself, but integrating them into the main JDK repository. JEP 386 ports the JDK to Alpine Linux and other distributions using `musl` as the primary C library on x64, while JEP 388 ports the JDK to Windows AArch64 (ARM64).

## References

- [Java Language Changes](https://docs.oracle.com/en/java/javase/16/language/java-language-changes.html)
- [Consolidated JDK 16 Release Notes](https://www.oracle.com/java/technologies/javase/16all-relnotes.html)
- [Java 16 Officially Released: Feature-by-Feature Analysis](https://www.infoq.cn/article/IAkwhx7i9V7G8zLVEd4L)
- [Hands-on | Dissecting Java 16's New Syntax Features](https://xie.infoq.cn/article/8304c894c4e38318d38ceb116) (great write-up)
