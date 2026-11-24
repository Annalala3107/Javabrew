---
title: Java 20 New Features Overview
description: Summary of JDK 20 language and concurrency changes, continuing enhancements to Virtual Threads and pattern matching.
category: Java
tag:
  - Java New Features
head:
  - - meta
    - name: keywords
      content: Java 20,JDK20,Record Patterns Preview,Virtual Thread Improvements,Language Enhancements,JEP
lang: en
sourceRef: zh-ref/java/new-features/java20.md
---

JDK 20 was released on March 21, 2023, and is a non-LTS (non-Long-Term Support) release.

Its successor is JDK 21, an LTS release published in September 2023.

JDK 20 introduces 7 new features in total. This article selects the more important ones for a detailed introduction:

- [JEP 429: Scoped Values](https://openjdk.org/jeps/429) (Incubator)
- [JEP 432: Record Patterns](https://openjdk.org/jeps/432) (Second Preview)
- [JEP 433: Pattern Matching for switch](https://openjdk.org/jeps/433) (Fourth Preview)
- [JEP 434: Foreign Function & Memory API](https://openjdk.org/jeps/434) (Second Preview)
- [JEP 436: Virtual Threads](https://openjdk.org/jeps/436) (Second Preview)
- [JEP 437: Structured Concurrency](https://openjdk.org/jeps/437) (Second Incubator)
- [JEP 438: Vector API](https://openjdk.org/jeps/438) (Fifth Incubator)

The chart below shows the number of new features and release dates for each JDK version from JDK 8 to JDK 25:

![Number of new features and release dates for each version from JDK 8 to JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 429: Scoped Values (Incubator)

Scoped Values allow immutable data to be shared within and across threads, making them preferable to thread-local variables (`ThreadLocal`), especially when using large numbers of virtual threads.

```java
final static ScopedValue<...> V = ScopedValue.newInstance();

// In some method
ScopedValue.where(V, <value>)
           .run(() -> { ... V.get() ... call methods ... });

// In a method called directly or indirectly from the lambda expression
... V.get() ...
```

Scoped Values enable safe and efficient data sharing among components in large programs without resorting to passing extra method parameters.

For a detailed introduction to Scoped Values, we recommend reading [Scoped Values FAQ](https://www.happycoders.eu/java/scoped-values/).

## JEP 432: Record Patterns (Second Preview)

Record Patterns deconstruct record values, making it much more convenient to extract data from `record` classes. In addition, record patterns and type patterns can be nested together to enable powerful, declarative, and composable forms of data navigation and processing.

Record patterns cannot be used standalone; they must be used together with `instanceof` or `switch` pattern matching.

Let's first look at a simple example using `instanceof`.

Define a simple record class:

```java
record Shape(String type, long unit){}
```

Before Record Patterns:

```java
Shape circle = new Shape("Circle", 10);
if (circle instanceof Shape shape) {

  System.out.println("Area of " + shape.type() + " is : " + Math.PI * Math.pow(shape.unit(), 2));
}
```

With Record Patterns:

```java
Shape circle = new Shape("Circle", 10);
if (circle instanceof Shape(String type, long unit)) {
  System.out.println("Area of " + type + " is : " + Math.PI * Math.pow(unit, 2));
}
```

Now let's look at using Record Patterns with `switch`.

Define a few types:

```java
interface Shape {}
record Circle(double radius) implements Shape { }
record Square(double side) implements Shape { }
record Rectangle(double length, double width) implements Shape { }
```

Before Record Patterns:

```java
Shape shape = new Circle(10);
switch (shape) {
    case Circle c:
        System.out.println("The shape is Circle with area: " + Math.PI * c.radius() * c.radius());
        break;

    case Square s:
        System.out.println("The shape is Square with area: " + s.side() * s.side());
        break;

    case Rectangle r:
        System.out.println("The shape is Rectangle with area: " + r.length() * r.width());
        break;

    default:
        System.out.println("Unknown Shape");
        break;
}
```

With Record Patterns:

```java
Shape shape = new Circle(10);
switch(shape) {

  case Circle(double radius):
    System.out.println("The shape is Circle with area: " + Math.PI * radius * radius);
    break;

  case Square(double side):
    System.out.println("The shape is Square with area: " + side * side);
    break;

  case Rectangle(double length, double width):
    System.out.println("The shape is Rectangle with area: " + length * width);
    break;

  default:
    System.out.println("Unknown Shape");
    break;
}
```

Record Patterns avoid unnecessary type casts and make code cleaner and easier to read. Record Patterns themselves do not eliminate all `null` or `NullPointerException` risks: `null` does not match a record pattern, and record component references can still be `null`.

Record Patterns first entered preview in Java 19 via [JEP 405](https://openjdk.org/jeps/405). In JDK 20, it reached its second preview via [JEP 432](https://openjdk.org/jeps/432). The improvements in this round include:

- Added support for type argument inference in generic record patterns
- Added support for record patterns to appear in the header of an enhanced `for` statement
- Removed support for named record patterns

**Note:** Do not confuse Record Patterns with Record Classes, which were officially introduced in [JDK 16](./java16.md).

## JEP 433: Pattern Matching for switch (Fourth Preview)

Just like `instanceof`, `switch` has gained automatic type matching and conversion capabilities.

`instanceof` code example:

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

`switch` code example:

```java
// Old code
static String formatter(Object o) {
    String formatted = "unknown";
    if (o instanceof Integer i) {
        formatted = String.format("int %d", i);
    } else if (o instanceof Long l) {
        formatted = String.format("long %d", l);
    } else if (o instanceof Double d) {
        formatted = String.format("double %f", d);
    } else if (o instanceof String s) {
        formatted = String.format("String %s", s);
    }
    return formatted;
}

// New code
static String formatterPatternSwitch(Object o) {
    return switch (o) {
        case Integer i -> String.format("int %d", i);
        case Long l    -> String.format("long %d", l);
        case Double d  -> String.format("double %f", d);
        case String s  -> String.format("String %s", s);
        default        -> o.toString();
    };
}
```

Pattern Matching for `switch` was previewed in Java 17, Java 18, and Java 19, making Java 20 its fourth preview. Each preview introduced minor refinements, which will not be detailed here.

## JEP 434: Foreign Function & Memory API (Second Preview)

This API allows Java programs to interoperate with code and data outside the Java runtime. By efficiently invoking foreign functions (code outside the JVM) and safely accessing foreign memory (memory not managed by the JVM), it enables Java programs to call native libraries and process native data without the danger and fragility of JNI.

The Foreign Function & Memory API completed its first incubator round in Java 17 via [JEP 412](https://openjdk.java.net/jeps/412), its second incubator round in Java 18 via [JEP 419](https://openjdk.org/jeps/419), and its first preview in Java 19 via [JEP 424](https://openjdk.org/jeps/424).

In JDK 20, it reached its second preview via [JEP 434](https://openjdk.org/jeps/434), with improvements including:

- Unification of the `MemorySegment` and `MemoryAddress` abstractions
- Enhanced `MemoryLayout` hierarchy
- Splitting `MemorySession` into `Arena` and `SegmentScope` to facilitate sharing segments across maintenance boundaries

I have covered the Foreign Function & Memory API in detail in [Java 19 New Features Overview](./java19.md), so it will not be repeated here.

## JEP 436: Virtual Threads (Second Preview)

A Virtual Thread is a lightweight thread implemented and scheduled by the JDK rather than the OS. Many virtual threads share the same operating system thread, allowing the number of virtual threads to be vastly larger than the number of operating system threads.

Before Virtual Threads were introduced, `java.lang.Thread` already supported what are now called platform threads—the threads we have always used. The JVM scheduler manages virtual threads via platform threads (carrier threads). A single platform thread can execute different virtual threads at different times (multiple virtual threads are mounted onto one platform thread); when a virtual thread blocks or waits, the platform thread can switch to executing another virtual thread.

The relationship between virtual threads, platform threads, and OS kernel threads is shown below (image source: [How to Use Java 19 Virtual Threads](https://medium.com/javarevisited/how-to-use-java-19-virtual-threads-c16a32bad5f7)):

![Relationship between virtual threads, platform threads, and OS kernel threads](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/virtual-threads-platform-threads-kernel-threads--57103066.png)

A quick note on the mapping between platform threads and OS kernel threads: on mainstream operating systems such as Windows and Linux, Java threads adopt a 1:1 threading model, meaning one platform thread maps to one OS kernel thread. Solaris is an exception—HotSpot VM on Solaris supports both M:N and 1:1 models. For details, see RednaxelaFX's answer: [Is the Threading Model in the JVM User-Level?](https://www.zhihu.com/question/23096638/answer/29617153).

Compared to platform threads, virtual threads are cheap and lightweight and are discarded after use, so they do not need to be reused or pooled—each task can run on its own dedicated virtual thread. Suspending and resuming virtual threads generally does not require creating or switching an operating system thread per task, thereby reducing thread resource and scheduling overhead caused by large numbers of blocking tasks.

Lightweight threads have already proven highly useful in other concurrent languages, such as Goroutines in Go and processes in Erlang.

There is a Zhihu discussion on Java 19 Virtual Threads if you are interested: <https://www.zhihu.com/question/536743167>.

For detailed explanations and underlying principles of Java Virtual Threads, you can read the following articles:

- [A Minimalist Introduction to Virtual Threads](https://javaguide.cn/java/concurrent/virtual-thread.html)
- [Java 19 Officially GA! See How Virtual Threads Dramatically Boost System Throughput](https://mp.weixin.qq.com/s/yyApBXxpXxVwttr01Hld6Q)
- [Virtual Threads - Inside VirtualThread Source Code](https://www.cnblogs.com/throwable/p/16758997.html)

Virtual Threads entered their first preview in Java 19 via [JEP 425](https://openjdk.org/jeps/425). In JDK 20, they reached their second preview with some minor changes that will not be detailed here.

Finally, let's look at four ways to create a virtual thread:

```java
// 1. Create via Thread.ofVirtual()
Runnable fn = () -> {
  // your code here
};

Thread thread = Thread.ofVirtual()
                      .start(fn);

// 2. Create via Thread.startVirtualThread()
Thread thread = Thread.startVirtualThread(() -> {
  // your code here
});

// 3. Create via Executors.newVirtualThreadPerTaskExecutor()
var executorService = Executors.newVirtualThreadPerTaskExecutor();

executorService.submit(() -> {
  // your code here
});

class CustomThread implements Runnable {
  @Override
  public void run() {
    System.out.println("CustomThread run");
  }
}

// 4. Create via ThreadFactory
CustomThread customThread = new CustomThread();
// Obtain ThreadFactory
ThreadFactory factory = Thread.ofVirtual().factory();
// Create virtual thread
Thread thread = factory.newThread(customThread);
// Start thread
thread.start();
```

From the four ways of creating virtual threads shown above, you can see that the Java team intentionally reused the existing `Thread` class as much as possible to lower the barrier to entry and provide a smooth transition to Virtual Threads.

## JEP 437: Structured Concurrency (Second Incubator)

Java 19 introduced Structured Concurrency, an approach to multithreaded programming aimed at simplifying concurrent programming through a structured concurrency API—not to replace `java.util.concurrent`—and it is currently in the incubator stage.

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

The only change to Structured Concurrency in JDK 20 is updating `StructuredTaskScope` to support the inheritance of scoped values by threads created within a task scope, which simplifies sharing immutable data across threads; see [JEP 429](https://openjdk.org/jeps/429) for details.

## JEP 438: Vector API (Fifth Incubator)

Vector computation consists of a sequence of operations on vectors. The Vector API is designed to express vector computations that reliably compile at runtime to optimal vector instructions on supported CPU architectures, achieving superior performance compared to equivalent scalar computations.

The goal of the Vector API is to provide users with a clean, easy-to-use, platform-independent way to express a wide range of vector computations.

The Vector API was initially proposed in [JEP 338](https://openjdk.java.net/jeps/338) and integrated into Java 16 as an [Incubator API](http://openjdk.java.net/jeps/11). Its second incubator round was proposed in [JEP 414](https://openjdk.java.net/jeps/414) and integrated into Java 17; its third incubator round was proposed in [JEP 417](https://openjdk.java.net/jeps/417) and integrated into Java 18; and its fourth incubator round was proposed in [JEP 426](https://openjdk.java.net/jeps/426) and integrated into Java 19.

This fifth incubator round in Java 20 leaves the Vector API largely unchanged, focusing only on bug fixes and performance enhancements; see [JEP 438](https://openjdk.org/jeps/438) for details.
