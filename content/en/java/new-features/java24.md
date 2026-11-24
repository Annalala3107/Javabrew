---
title: Java 24 New Features Overview
description: Summary of JDK 24 new features and changes to help track Java's evolution.
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java24.md
head:
  - - meta
    - name: keywords
      content: Java 24,JDK24,JEP Updates,Language Features,GC Improvements,Platform Enhancements
---

JDK 24 was released in March 2025 as a non-LTS (non-Long-Term Support) version. Its successor is the LTS version **JDK 25**, released in September 2025.

JDK 24 includes a total of 24 new features. This article selects several of the more important features for a detailed overview:

- [JEP 478: Key Derivation Function API (Preview)](https://openjdk.org/jeps/478)
- [JEP 483: Early Class-File Loading & Linking](https://openjdk.org/jeps/483)
- [JEP 484: Class File API](https://openjdk.org/jeps/484)
- [JEP 485: Stream Gatherers](https://openjdk.org/jeps/485)
- [JEP 486: Disable the Security Manager](https://openjdk.org/jeps/486)
- [JEP 487: Scoped Values (Fourth Preview)](https://openjdk.org/jeps/487)
- [JEP 495: Simplified Source Files and Instance Main Methods (Fourth Preview)](https://openjdk.org/jeps/495)
- [JEP 497: Quantum-Resistant Digital Signature Algorithm (ML-DSA)](https://openjdk.org/jeps/497)
- [JEP 499: Structured Concurrency (Fourth Preview)](https://openjdk.org/jeps/499)

The chart below shows the number of new features and release dates for each update from JDK 8 to JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 478: Key Derivation Function API (Preview)

The Key Derivation Function API provides a standard set of interfaces for deriving additional keys from an initial key and other data. It can generate multiple distinct keys for different cryptographic purposes (such as encryption, authentication, etc.), avoiding direct reuse of the same key. This API is in preview in JDK 24.

Through this API, developers can use key derivation algorithms implemented by security providers, such as HKDF:

```java
// Create a KDF object using the HKDF-SHA256 algorithm
KDF hkdf = KDF.getInstance("HKDF-SHA256");

// Create Extract and Expand parameter specifications
AlgorithmParameterSpec params =
    HKDFParameterSpec.ofExtract()
                     .addIKM(initialKeyMaterial) // Set initial key material
                     .addSalt(salt)             // Set salt value
                     .thenExpand(info, 32);     // Set info context and target length

// Derive a 32-byte AES key
SecretKey key = hkdf.deriveKey("AES", params);

// Additional key derivation operations can be performed using the same KDF object
```

## JEP 483: Early Class-File Loading & Linking

In a traditional JVM, an application must dynamically load and link classes on every startup. This feature caches already-loaded and linked classes to reduce redundant work on subsequent startups. In the Spring PetClinic benchmark cited in JEP 483, using an AOT cache reduced startup time by up to about 42%; actual gains depend on the application and runtime environment.

This optimization does not require modifying application, library, or framework code, but it does require recording a training run and creating an AOT cache first, then loading that cache during production startup. Relevant flags include `-XX:AOTMode=record`, `-XX:AOTConfiguration`, `-XX:AOTMode=create`, and `-XX:AOTCache`.

## JEP 484: Class File API

The Class-File API had its first preview in JDK 22 ([JEP 457](https://openjdk.org/jeps/457)) and was further refined in its second preview in JDK 23 ([JEP 466](https://openjdk.org/jeps/466)). Finally, the feature was finalized in JDK 24.

The goal of the Class-File API is to provide a standardized API for parsing, generating, and transforming Java class files, replacing previous reliance on third-party libraries (such as ASM) for class-file processing.

```java
// Create a ClassFile object, which is the entry point for operating on class files.
ClassFile cf = ClassFile.of();
// Parse the byte array into a ClassModel
ClassModel classModel = cf.parse(bytes);

// Build a new class file, removing all methods starting with "debug"
byte[] newBytes = cf.build(classModel.thisClass().asSymbol(),
        classBuilder -> {
            // Iterate over all class elements
            for (ClassElement ce : classModel) {
                // Check whether it is a method and its method name starts with "debug"
                if (!(ce instanceof MethodModel mm
                        && mm.methodName().stringValue().startsWith("debug"))) {
                    // Add to the new class file
                    classBuilder.with(ce);
                }
            }
        });
```

## JEP 485: Stream Gatherers

Stream Gatherers `Stream::gather(Gatherer)` is a powerful new feature that allows developers to define custom intermediate operations, enabling more complex and flexible data transformations. The `Gatherer` interface is at the core of this feature; it defines how elements are collected from a stream, how intermediate state is maintained, and how results are emitted during processing.

Unlike existing built-in operations such as `filter`, `map`, or `distinct`, `Stream::gather` empowers developers to implement tasks that are difficult to express with standard Stream operations. For example, `Stream::gather` can be used to implement sliding windows, deduplication with custom rules, or more complex stateful transformations and aggregations. This flexibility greatly expands the applicability of the Stream API, allowing developers to handle more complex data-processing scenarios.

Implementing string-length deduplication logic using `Stream::gather(Gatherer)`:

```java
var result = Stream.of("foo", "bar", "baz", "quux")
                   .gather(Gatherer.ofSequential(
                       HashSet::new, // Initialize state as a HashSet to store string lengths seen so far
                       (set, str, downstream) -> {
                           if (set.add(str.length())) {
                               return downstream.push(str);
                           }
                           return true; // Continue processing the stream
                       }
                   ))
                   .toList();// Convert to a list

// Output result ==> [foo, quux]
```

## JEP 486: Disable the Security Manager

JDK 24 no longer allows enabling the `Security Manager`, even via the `java -Djava.security.manager` command—a critical step toward completely removing the feature. Although `Security Manager` was once an important tool in Java for restricting code permissions (such as accessing the file system or network, reading or writing sensitive files, and executing system commands), the Java community decided to eventually remove it due to high complexity, low adoption, and heavy maintenance costs.

## JEP 487: Scoped Values (Fourth Preview)

Scoped Values enable sharing immutable data within and across threads and are superior to thread-local variables, especially when using large numbers of virtual threads.

```java
final static ScopedValue<...> V = ScopedValue.newInstance();

// In some method
ScopedValue.where(V, <value>)
           .run(() -> { ... V.get() ... call methods ... });

// In a method called directly or indirectly from the lambda expression
... V.get() ...
```

Scoped values allow safe and efficient data sharing between components in large programs without resorting to method parameters.

## JEP 491: Virtual Threads Synchronization Without Pinning

This optimizes how virtual threads interact with `synchronized`. When a virtual thread blocks inside a `synchronized` method or block, it can usually release the operating system thread (platform thread) it occupies, avoiding prolonged occupation of the platform thread and thus improving application concurrency. This mechanism prevents "pinning"—where a virtual thread holds onto a platform thread for a long time and prevents it from serving other virtual threads.

Existing Java code that uses `synchronized` can benefit from virtual thread scalability without modification. For example, in an I/O-bound application, using traditional platform threads may degrade concurrency due to thread blocking. With virtual threads, even if blocking occurs inside a `synchronized` block, the platform thread is not pinned, allowing it to continue serving other virtual threads and improving overall concurrency performance.

## JEP 493: Linking Run-Time Images Without JMOD Files

By default, the JDK includes both the run-time image (the modules needed at runtime) and JMOD files. This feature enables the `jlink` tool to create custom run-time images without requiring the JDK's JMOD files, reducing the JDK installation size (by about 25%).

Notes:

- `jlink` is a command-line tool introduced in Java 9. It allows developers to create their own lightweight, customized JREs for module-based Java applications.
- JMOD files are modular archive files that can contain class files, native libraries, configuration files, header files, legal notices, and other contents.

## JEP 495: Simplified Source Files and Instance Main Methods (Fourth Preview)

This feature mainly simplifies the declaration of the `main` method. For Java beginners, the traditional `main` method declaration introduces too many Java syntax concepts at once, making it harder to get started quickly.

Defining a `main` method before using this feature:

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

Defining a `main` method using this new feature:

```java
class HelloWorld {
    void main() {
        System.out.println("Hello, World!");
    }
}
```

Further simplification (unnamed classes allow omitting the class name):

```java
void main() {
   System.out.println("Hello, World!");
}
```

## JEP 497: Quantum-Resistant Digital Signature Algorithm (ML-DSA)

JDK 24 introduces support for the quantum-resistant Module-Lattice-Based Digital Signature Algorithm (**ML-DSA**) to prepare against potential threats from future quantum computers.

ML-DSA is a quantum-resistant algorithm standardized by the U.S. National Institute of Standards and Technology (NIST) in FIPS 204 for digital signatures and authentication.

## JEP 498: Warnings When Using `sun.misc.Unsafe` Memory Access Methods

JDK 23 ([JEP 471](https://openjdk.org/jeps/471)) proposed deprecating the memory-access methods in `sun.misc.Unsafe` for removal in future releases. In JDK 24, the runtime issues a warning the first time any memory-access method of `sun.misc.Unsafe` is called.

Safe and efficient alternatives already exist for these unsafe methods:

- `java.lang.invoke.VarHandle`: Introduced in JDK 9 (JEP 193), providing a safe and efficient way to manipulate heap memory, including object fields, static fields of classes, and array elements.
- `java.lang.foreign.MemorySegment`: Introduced in JDK 22 (JEP 454), providing a safe and efficient way to access off-heap memory, sometimes working in conjunction with `VarHandle`.

`MemorySegment` is one of the core types of the Foreign Function & Memory API, used for safely accessing on-heap or off-heap memory; `VarHandle` is a standalone standard API that can be used to access fields, array elements, or data according to memory layouts. The Foreign Function & Memory API became a final feature in JDK 22.

```java
import java.lang.foreign.*;
import java.lang.invoke.VarHandle;

// Class that manages an off-heap integer array
class OffHeapIntBuffer {

    // VarHandle for accessing integer elements
    private static final VarHandle ELEM_VH = ValueLayout.JAVA_INT.arrayElementVarHandle();

    // Memory manager
    private final Arena arena;

    // Off-heap memory segment
    private final MemorySegment buffer;

    // Constructor, allocates space for the specified number of integers
    public OffHeapIntBuffer(long size) {
        this.arena  = Arena.ofShared();
        this.buffer = arena.allocate(ValueLayout.JAVA_INT, size);
    }

    // Deallocate memory
    public void deallocate() {
        arena.close();
    }

    // Set the value at the specified index with volatile semantics
    public void setVolatile(long index, int value) {
        ELEM_VH.setVolatile(buffer, 0L, index, value);
    }

    // Initialize elements in the specified range to 0
    public void initialize(long start, long n) {
        buffer.asSlice(ValueLayout.JAVA_INT.byteSize() * start,
                       ValueLayout.JAVA_INT.byteSize() * n)
              .fill((byte) 0);
    }

    // Copy elements in the specified range to a new array
    public int[] copyToNewArray(long start, int n) {
        return buffer.asSlice(ValueLayout.JAVA_INT.byteSize() * start,
                              ValueLayout.JAVA_INT.byteSize() * n)
                     .toArray(ValueLayout.JAVA_INT);
    }
}
```

## JEP 499: Structured Concurrency (Fourth Preview)

JDK 19 introduced Structured Concurrency as an incubator API. In JDK 24, the API is in its fourth preview stage, aiming to simplify multithreaded programming rather than replace `java.util.concurrent`.

Structured concurrency treats multiple tasks running in different threads as a single unit of work, thereby simplifying error handling, improving reliability, and enhancing observability. In other words, structured concurrency preserves the readability, maintainability, and observability of single-threaded code.

The fundamental API of structured concurrency is `StructuredTaskScope`, which supports splitting a task into multiple concurrent subtasks that execute in their own threads, and subtasks must complete before the main task continues.

Basic usage of `StructuredTaskScope` is as follows:

```java
    try (var scope = new StructuredTaskScope<Object>()) {
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
