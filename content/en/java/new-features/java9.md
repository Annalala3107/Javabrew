---
title: Java 9 New Features Overview
description: "An overview of Java 9's module system, jlink, and other updates, explaining their impact on runtime images and library usage."
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java9.md
head:
  - - meta
    - name: keywords
      content: Java 9,JDK 9,Modules,JPMS,jlink,Collection Factory Methods,New APIs
---

**Java 9** was released on September 21, 2017. As a major release arriving 3.5 years after Java 8, Java 9 brought many significant changes—the most important being the introduction of the Java Platform Module System, along with enhancements to Collections, `Stream`, and more.

JDK 9 is not an LTS (Long-Term Support) release. The LTS releases currently listed by Oracle include JDK 8, JDK 11, JDK 17, JDK 21, and JDK 25.

This article highlights some of the more important new features in detail:

- [JEP 222: Java Shell Tool (JShell)](https://openjdk.org/jeps/222)
- [JEP 261: Module System](https://openjdk.org/jeps/261)
- [JEP 248: G1 Becomes the Default Garbage Collector](https://openjdk.org/jeps/248)
- [JEP 254: Compact Strings](https://openjdk.org/jeps/254)
- [JEP 193: Variable Handles](https://openjdk.org/jeps/193)

The chart below shows the number of new features and release dates for each version from JDK 8 to JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 222: Java Shell Tool (JShell)

JShell is a new utility added in Java 9, providing Java with an interactive real-time command-line tool similar to Python's REPL.

In JShell, you can enter expressions directly and see their execution results immediately.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210816083417616-fb59a20e.png)

**What benefits does JShell bring us?**

1. It lowers the barrier to printing your first Java `"Hello World!"`, helping boost beginners' enthusiasm for learning.
2. When testing small pieces of logic or verifying simple problems, it is more efficient than an IDE (it is not meant to replace IDEs; for verifying complex logic, an IDE is still better, so the two complement each other).
3. ...

**How does JShell code differ from ordinary compilable Java code?**

1. Once a statement is entered, JShell compiles and executes the code in the background and immediately returns the result, without requiring the user to manually run `javac` and `java`.
2. JShell supports redeclaring variables; later declarations overwrite earlier ones.
3. JShell supports standalone expressions, such as a simple addition `1 + 1`.
4. ...

## JEP 261: Module System

The module system is part of [Project Jigsaw](https://openjdk.java.net/projects/jigsaw/), introducing modular development practices into the Java platform so our code can achieve better reusability.

**What is a module system?** The official definition is:

> A uniquely named, reusable group of related packages, as well as resources (such as images and XML files) and a module descriptor.

Put simply, you can think of a module as a uniquely named, reusable collection of packages, resources, and a module descriptor file (`module-info.java`).

Any JAR file can be upgraded into a module simply by adding a module descriptor file (`module-info.java`).

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/module-structure-49f281d9.png)

After the module system was introduced, the JDK itself was reorganized into 94 modules. Java applications can use the newly added **[jlink](http://openjdk.java.net/jeps/282) tool** (`jlink` is a new command-line tool released with Java 9 that allows developers to create lightweight, customized JREs for modular Java applications) to build custom runtime images containing only the JDK modules they actually depend on. This can greatly reduce the size of the Java runtime environment.

We can use the `exports` keyword to control which packages are exposed externally and which specific modules are allowed to access them.

```java
module my.module {
    // exports exposes all public members of the specified package
    exports com.my.package.name;
}

module my.module {
    // exports ... to selectively exports the specified package to a target module
    exports com.my.package.name to com.specific.module;
}
```

If you want to learn more deeply about Java 9 modularity, you can refer to the following articles:

- [Project Jigsaw: Module System Quick-Start Guide](https://openjdk.java.net/projects/jigsaw/quick-start)
- [Java 9 Modules: part 1](https://stacktraceguru.com/java9/module-introduction)
- [Java 9 Demystified (2. Module System) [Chinese]](http://www.cnblogs.com/IcanFixIt/p/6947763.html)

## JEP 248: G1 Becomes the Default Garbage Collector

In Java 8, the default Garbage Collector was Parallel Scavenge (Young Generation) + Parallel Old (Old Generation). In Java 9, the CMS garbage collector was deprecated, and **G1 (Garbage-First Garbage Collector)** became the default garbage collector.

G1 was originally introduced in Java 7 and became the default collector after demonstrating strong performance across two major releases.

## JEP 193: Variable Handles

A Variable Handle is a reference to a variable or a family of variables, including static fields, non-static fields, array elements, or components of off-heap data structures.

The concept of a Variable Handle is similar to the existing `MethodHandle`, represented by the Java class `java.lang.invoke.VarHandle`. You can create `VarHandle` objects using lookup methods on a `java.lang.invoke.MethodHandles.Lookup` instance, among other approaches.

`VarHandle` replaces part of the functionality of `java.util.concurrent.atomic` and `sun.misc.Unsafe`, and provides a standard set of Memory Barrier operations for finer-grained control over memory ordering. It outperforms the existing APIs in safety, usability, and performance.

## API Enhancements

Not all API changes are released through a JEP (Java Enhancement Proposal).

In the JDK development workflow, a **JEP** is typically used for major changes, such as introducing new language features, new JVM mechanisms, or large-scale library refactoring. Operations like adding a few factory methods such as `List.of()` to existing classes are generally treated as routine library maintenance. They are submitted and reviewed directly by JDK developers via tickets in the **JBS (JDK Bug System)** and shipped directly with the release.

### Collection Enhancements

Factory methods such as `List.of()`, `Set.of()`, `Map.of()`, and `Map.ofEntries()` were added to create immutable collections (somewhat inspired by Guava):

```java
List.of("Java", "C++");
Set.of("Java", "C++");
Map.of("Java", 1, "C++", 2);
```

Collections created with `of()` are immutable—you cannot perform add, remove, replace, or sort operations on them, or a `java.lang.UnsupportedOperationException` will be thrown.

### Stream Enhancements

`Stream` gained new methods `ofNullable()`, `dropWhile()`, `takeWhile()`, as well as an overloaded `iterate()` method.

In Java 9, `ofNullable()` creates a single-element or empty `Stream` from a value that may be `null`. Java 8 could already create an empty stream via `Stream.empty()`, but lacked this convenient method to convert a nullable value directly into a stream.

```java
Stream<String> stringStream = Stream.ofNullable("Java");
System.out.println(stringStream.count());// 1
Stream<String> nullStream = Stream.ofNullable(null);
System.out.println(nullStream.count());//0
```

The `takeWhile()` method takes elements sequentially from a `Stream` while a predicate holds, and stops as soon as an element fails the condition.

```java
List<Integer> integerList = List.of(11, 33, 66, 8, 9, 13);
integerList.stream().takeWhile(x -> x < 50).forEach(System.out::println);// 11 33
```

The `dropWhile()` method has the opposite effect of `takeWhile()`.

```java
List<Integer> integerList2 = List.of(11, 33, 66, 8, 9, 13);
integerList2.stream().dropWhile(x -> x < 50).forEach(System.out::println);// 66 8 9 13
```

The new overload of `iterate()` takes a `Predicate` parameter (a termination condition) to decide when iteration should stop:

```java
public static<T> Stream<T> iterate(final T seed, final UnaryOperator<T> f) {
}
// Newly added overloaded method
public static<T> Stream<T> iterate(T seed, Predicate<? super T> hasNext, UnaryOperator<T> next) {

}
```

A usage comparison between the two is shown below; the new `iterate()` overload is more flexible.

```java
// Print numbers 1~10 using the original iterate() method
Stream.iterate(1, i -> i + 1).limit(10).forEach(System.out::println);
// Print numbers 1~10 using the new iterate() overload
Stream.iterate(1, i -> i <= 10, i -> i + 1).forEach(System.out::println);
```

### Optional Enhancements

The `Optional` class added methods such as `ifPresentOrElse()`, `or()`, and `stream()`.

The `ifPresentOrElse()` method accepts two parameters, a `Consumer` and a `Runnable`: if the `Optional` is non-empty, it invokes the `Consumer`; if empty, it invokes the `Runnable`.

```java
public void ifPresentOrElse(Consumer<? super T> action, Runnable emptyAction)

Optional<Object> objectOptional = Optional.empty();
objectOptional.ifPresentOrElse(System.out::println, () -> System.out.println("Empty!!!"));// Empty!!!
```

The `or()` method accepts a `Supplier` parameter; if the `Optional` is empty, it returns the `Optional` produced by the `Supplier`.

```java
public Optional<T> or(Supplier<? extends Optional<? extends T>> supplier)

Optional<Object> objectOptional = Optional.empty();
objectOptional.or(() -> Optional.of("java")).ifPresent(System.out::println);//java
```

### String Enhancements

In Java 8 and earlier versions, `String` always stored characters using `char[]`. Starting in Java 9, the internal representation of `String` changed to a `byte[]` array, saving memory space.

```java
public final class String implements java.io.Serializable,Comparable<String>, CharSequence {
    // The @Stable annotation indicates that the field is modified at most once, i.e., "stable".
    @Stable
    private final byte[] value;
}
```

### Interface Enhancements

Java 9 allows private methods inside interfaces. This makes interfaces more flexible to use, somewhat like a simplified abstract class.

```java
public interface MyInterface {
    private void methodPrivate(){
    }
}
```

### IO Enhancements

Before Java 9, we could only declare resource variables inside the `try-with-resources` header:

```java
try (Scanner scanner = new Scanner(new File("testRead.txt"));
    PrintWriter writer = new PrintWriter(new File("testWrite.txt"))) {
    // omitted
}
```

Starting in Java 9, `try-with-resources` statements can use effectively-final variables declared outside the block:

```java
final Scanner scanner = new Scanner(new File("testRead.txt"));
PrintWriter writer = new PrintWriter(new File("testWrite.txt"));
try (scanner; writer) {
    // omitted
}
```

**What is an effectively-final variable?** Simply put, it is a variable that is not modified with the `final` keyword, yet its value is never changed after initialization.

As demonstrated in the code above, even though the `writer` variable is not explicitly declared `final`, it is never reassigned after its initial assignment—making it an effectively-final variable.

### Process API

Java 9 added the `java.lang.ProcessHandle` interface to manage native operating system processes, which is especially well suited for managing long-running processes.

```java
// Get the process handle for the currently running JVM
ProcessHandle currentProcess = ProcessHandle.current();
// Print the process ID
System.out.println(currentProcess.pid());
// Print process information
System.out.println(currentProcess.info());
```

Overview of the `ProcessHandle` interface:

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210816104614414-333a551d.png)

### Other API Enhancements

**Reactive Streams**

In Java 9, the core interfaces of the Reactive Streams specification were added to `java.util.concurrent.Flow`.

`Flow` contains four core interfaces: `Flow.Publisher`, `Flow.Subscriber`, `Flow.Subscription`, and `Flow.Processor`. Java 9 also provides `SubmissionPublisher` as an implementation of `Flow.Publisher`.

For a more detailed explanation of Reactive Streams in Java 9, we recommend reading [Java 9 Demystified (17. Reactive Streams) - Lin Bentuo [Chinese]](https://www.cnblogs.com/IcanFixIt/p/7245377.html).

## Others

- **Platform Logging API Improvements**: Java 9 allows the JDK and applications to be configured to use the same logging implementation. `System.LoggerFinder` was introduced to manage the logger implementation used by the JDK. The JVM has a single system-wide `LoggerFinder` instance at runtime. You can plug in your own `System.LoggerFinder` implementation so both the JDK and your application use logging frameworks such as SLF4J.
- **`CompletableFuture` Class Enhancements**: Several new methods were added (such as `completeAsync`, `orTimeout`, etc.).
- **Nashorn Engine Enhancements**: Nashorn is the JavaScript engine introduced in Java 8; Java 9 enhanced Nashorn with support for some ES6 features (it was later deprecated in Java 11).
- **New I/O Stream Features**: New methods were added to read and copy data contained in an `InputStream`.
- **Improved Application Security**: Java 9 added four SHA-3 hash algorithms: SHA3-224, SHA3-256, SHA3-384, and SHA3-512.
- **Method Handle Improvements**: Method Handles were introduced in Java 7; Java 9 added more static methods in `java.lang.invoke.MethodHandles` to create different types of method handles.
- ...

## References

- Java version history: <https://en.wikipedia.org/wiki/Java_version_history>
- Release Notes for JDK 9 and JDK 9 Update Releases: <https://www.oracle.com/java/technologies/javase/9-all-relnotes.html>
- *Deep Dive into Java New Features* (GeekTime) — JShell: How to quickly verify simple small problems?
- New Features in Java 9: <https://www.baeldung.com/new-java-9>
- Java – Try with Resources: <https://www.baeldung.com/java-try-with-resources>
