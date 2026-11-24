---
title: Java 25 New Features Overview
description: Overview of key new features and preview changes in JDK 25, focusing on concurrency, GC, and language/platform enhancements.
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java25.md
head:
  - - meta
    - name: keywords
      content: Java 25,JDK25,LTS,Scoped Values,Compact Object Headers,Generational Shenandoah,Module Import,Structured Concurrency
---

JDK 25 was released on September 16, 2025—a very important, milestone release.

JDK 25 is designated as an LTS (Long-Term Support) release by Oracle and most other JDK vendors. Oracle's current LTS releases include JDK 8, JDK 11, JDK 17, JDK 21, and JDK 25.

JDK 25 includes a total of 18 new features. This article selects several of the more important features for a detailed overview:

- [JEP 506: Scoped Values](https://openjdk.org/jeps/506)
- [JEP 512: Compact Source Files and Instance Main Methods](https://openjdk.org/jeps/512)
- [JEP 519: Compact Object Headers](https://openjdk.org/jeps/519)
- [JEP 521: Generational Shenandoah](https://openjdk.org/jeps/521)
- [JEP 507: Primitive Types in Patterns, instanceof, and switch (Third Preview)](https://openjdk.org/jeps/507)
- [JEP 505: Structured Concurrency (Fifth Preview)](https://openjdk.org/jeps/505)
- [JEP 511: Module Import Declarations](https://openjdk.org/jeps/511)
- [JEP 513: Flexible Constructor Bodies](https://openjdk.org/jeps/513)
- [JEP 508: Vector API (Tenth Incubator)](https://openjdk.org/jeps/508)

The chart below shows the number of new features and release dates for each update from JDK 8 to JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JDK 25

### JEP 506: Scoped Values

Scoped Values enable sharing immutable data within and across threads and are superior to `ThreadLocal`, especially when using large numbers of virtual threads.

```java
final static ScopedValue<...> V = ScopedValue.newInstance();

// In some method
ScopedValue.where(V, <value>)
           .run(() -> { ... V.get() ... call methods ... });

// In a method called directly or indirectly from the lambda expression
... V.get() ...
```

Scoped values provide one-way immutable data transfer from caller to callee. Child threads created via structured concurrency can inherit bindings from the parent thread without copying those bindings, thereby reducing time and space overhead when large numbers of threads share context.

### JEP 512: Compact Source Files and Instance Main Methods

This feature was first previewed in JDK 21 via [JEP 445](https://openjdk.org/jeps/445 "JEP 445"), refined across JDK 22, JDK 23, and JDK 24, and finally became a finalized feature in JDK 25.

This improvement greatly simplifies writing simple Java programs by allowing classes and the main method to be written in a file without a top-level `public class`, and allowing the `main` method to be a non-static instance method.

```java
class HelloWorld {
    void main() {
        System.out.println("Hello, World!");
    }
}
```

Further simplification:

```java
void main() {
    System.out.println("Hello, World!");
}
```

This is a major step toward lowering Java's learning curve and increasing productivity when writing small programs and scripts. Beginners no longer need to understand the long and complex `public static void main(String[] args)` declaration. For rapid prototyping and scripting, this also makes Java a much more attractive option.

### JEP 519: Compact Object Headers

Introduced as an experimental feature in [JEP 450](https://openjdk.org/jeps/450 "JEP 450") (JDK 24), this feature became a production feature in JDK 25.

By optimizing the internal structure of object headers, in 64-bit HotSpot JVMs the object header size is reduced from 96–128 bits (12–16 bytes) down to 64 bits (8 bytes), resulting in reduced heap memory footprint, higher deployment density, and improved data locality.

Compact object headers are not the default JVM object header layout and must be explicitly enabled via configuration:

- In JDK 24, enable with the combination of CLI flags:
  `$ java -XX:+UnlockExperimentalVMOptions -XX:+UseCompactObjectHeaders ...`;
- From JDK 25 onward, only `-XX:+UseCompactObjectHeaders` is needed.

### JEP 521: Generational Shenandoah

Shenandoah GC was introduced as an experimental feature in JDK 12 and became a production feature in JDK 15. It is disabled by default and can be enabled via `-XX:+UseShenandoahGC`.

Shenandoah is a low-pause garbage collector led by Red Hat, aiming to keep pause times short and largely independent of heap size even when the heap is large.

Traditional Shenandoah performs concurrent marking and compaction over the entire heap. Although its pause times are extremely short, it is less efficient than generational GCs when handling young-generation objects. By introducing generations, Shenandoah can more frequently and efficiently reclaim large numbers of short-lived objects in the young generation, achieving higher throughput and lower CPU overhead while preserving ultra-low pause times.

Shenandoah GC must be enabled via command-line flags:

- In JDK 24, enable with the combination of flags: `-XX:+UseShenandoahGC -XX:+UnlockExperimentalVMOptions -XX:ShenandoahGCMode=generational`
- From JDK 25 onward, only `-XX:+UseShenandoahGC -XX:ShenandoahGCMode=generational` is needed.

### JEP 507: Primitive Types in Patterns, instanceof, and switch (Third Preview)

This feature was first previewed in JDK 23 via [JEP 455](https://openjdk.org/jeps/455 "JEP 455").

Pattern matching can handle all primitive data types (`int`, `double`, `boolean`, etc.) in `switch` and `instanceof` statements:

```java
static void test(Object obj) {
    if (obj instanceof int i) {
        System.out.println("This is an int type: " + i);
    }
}
```

This enables safer and more concise type matching and conversion for primitive types just like object types, further eliminating boilerplate code in Java.

### JEP 505: Structured Concurrency (Fifth Preview)

JDK 19 introduced Structured Concurrency as an incubator API. In JDK 25, the API is in its fifth preview stage, aiming to simplify multithreaded programming rather than replace `java.util.concurrent`.

Structured concurrency treats multiple tasks running in different threads as a single unit of work, thereby simplifying error handling, improving reliability, and enhancing observability. In other words, structured concurrency preserves the readability, maintainability, and observability of single-threaded code.

The fundamental API of structured concurrency is `StructuredTaskScope`, which supports splitting a task into multiple concurrent subtasks that execute in their own threads, and subtasks must complete before the main task continues.

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

### JEP 511: Module Import Declarations

This feature was first previewed in JDK 23 via [JEP 476](https://openjdk.org/jeps/476 "JEP 476"), refined in JDK 24 via [JEP 494](https://openjdk.org/jeps/494 "JEP 494"), and finalized in JDK 25.

Module import declarations allow concisely importing all exported packages of an entire module in Java code without having to declare package imports one by one. This feature simplifies reusing modular libraries—especially when working with multiple modules—by avoiding large numbers of package import statements, making it easier for developers to access third-party libraries and fundamental Java classes.

This feature is particularly useful for beginners and prototyping because it does not require developers to modularize their own code, while retaining compatibility with traditional import styles, thereby improving development productivity and code readability.

```java
// Import the entire java.base module so developers can directly access classes such as List, Map, and Stream without manually importing each package
import module java.base;

public class Example {
    public static void main(String[] args) {
        String[] fruits = { "apple", "berry", "citrus" };
        Map<String, String> fruitMap = Stream.of(fruits)
            .collect(Collectors.toMap(
                s -> s.toUpperCase().substring(0, 1),
                Function.identity()));

        System.out.println(fruitMap);
    }
}
```

### JEP 513: Flexible Constructor Bodies

This feature was first previewed in JDK 22 via [JEP 447](https://openjdk.org/jeps/447 "JEP 447"), went through further previews in [JEP 482 ](https://openjdk.org/jeps/482 "JEP 482 ") (JDK 23) and [JEP 492](https://openjdk.org/jeps/492 "JEP 492") (JDK 24), and was finalized in JDK 25.

Java previously required that a `super(...)` or `this(...)` call appear as the first statement in a constructor. This meant we could not directly initialize fields in a subclass constructor before invoking the superclass constructor.

Flexible constructor bodies solve this problem by allowing statements inside a constructor body before invoking `super(..)` or `this(..)`. These statements can initialize fields, though they cannot reference the instance being constructed. This prevents subclass fields from being uninitialized when a superclass constructor invokes a subclass method, strengthening the reliability of class construction.

This feature removes previous Java syntax restrictions on how constructor code is organized, enabling developers to express constructor behavior more freely and naturally—such as validating parameters, preparing state, and sharing logic directly in the constructor without relying on helper methods or auxiliary constructors—thereby improving code readability and maintainability.

```java
class Person {
    private final String name;
    private int age;

    public Person(String name, int age) {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative.");
        }
        this.name = name; // Initialize fields before calling the superclass constructor
        this.age = age;
        // ... other initialization code
    }
}

class Employee extends Person {
    private final int employeeId;

    public Employee(String name, int age, int employeeId) {
        this.employeeId = employeeId; // Initialize fields before calling the superclass constructor
        super(name, age); // Call the superclass constructor
        // ... other initialization code
    }
}
```

### JEP 508: Vector API (Tenth Incubator)

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

Although still in incubation, its tenth iteration suffices to demonstrate its importance. It enables Java, in performance-sensitive fields such as scientific computing, machine learning, and big data processing, to achieve code performance approaching or even matching native languages like C++. This is key for Java to remain competitive in high-performance computing.
