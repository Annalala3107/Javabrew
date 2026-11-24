---
title: Java 18 New Features Overview
description: Overview of JDK 18 updates and preview/incubator features, highlighting the improvements brought by the new APIs.
category: Java
tag:
  - Java New Features
head:
  - - meta
    - name: keywords
      content: Java 18,JDK18,Preview Features,API Updates,JEP
lang: en
sourceRef: zh-ref/java/new-features/java18.md
---

Java 18 was officially released on March 22, 2022, and is a non-LTS (non-Long-Term Support) release.

JDK 18 introduces 8 new features in total. This article selects several of the more important ones for a detailed introduction:

- [JEP 400: UTF-8 by Default](https://openjdk.java.net/jeps/400)
- [JEP 408: Simple Web Server](https://openjdk.java.net/jeps/408)
- [JEP 413: Code Snippets in Java API Documentation](https://openjdk.java.net/jeps/413)
- [JEP 416: Reimplement Core Reflection with Method Handles](https://openjdk.java.net/jeps/416)
- [JEP 417: Vector API (Third Incubator)](https://openjdk.java.net/jeps/417)
- [JEP 418: Internet-Address Resolution SPI](https://openjdk.java.net/jeps/418)
- [JEP 419: Foreign Function & Memory API (Second Incubator)](https://openjdk.java.net/jeps/419)

The chart below shows the number of new features and release dates for each JDK version from JDK 8 to JDK 25:

![Number of new features and release dates for each version from JDK 8 to JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Related reading:

- [OpenJDK Java 18 Documentation](https://openjdk.java.net/projects/jdk/18/)
- [IntelliJ IDEA | Java 18 Feature Support](https://mp.weixin.qq.com/s/PocFKR9z9u7-YCZHsrA5kQ)

## JEP 400: UTF-8 by Default (Finalized)

The JDK has finally set UTF-8 as the default charset.

In Java 17 and earlier versions, the default charset was determined at runtime by the Java Virtual Machine based on the operating system, locale settings, and other factors, which introduced potential risks. For example, a Java program that prints text to the console properly on macOS might produce garbled characters on Windows unless you explicitly specify the charset.

## JEP 408: Simple Web Server (Finalized)

Starting with Java 18, you can use the `jwebserver` command to start a minimal static web server.

```bash
$ jwebserver
Binding to loopback by default. For all interfaces use "-b 0.0.0.0" or "-b ::".
Serving /cwd and subdirectories on 127.0.0.1 port 8000
URL: http://127.0.0.1:8000/
```

This server does not support CGI or Servlets; it is limited to static files only.

## JEP 413: Code Snippets in Java API Documentation (Finalized)

Before Java 18, if we wanted to embed code snippets in Javadoc, we could use `<pre>{@code ...}</pre>`:

```java
<pre>{@code
    lines of source code
}</pre>
```

The rendered output of `<pre>{@code ...}</pre>` was rather mediocre.

Starting with Java 18, you can use the `@snippet` tag instead:

```java
/**
 * The following code shows how to use {@code Optional.isPresent}:
 * {@snippet :
 * if (v.isPresent()) {
 *     System.out.println("v: " + v.get());
 * }
 * }
 */
```

The `@snippet` approach produces better-formatted output and is more convenient to use.

## JEP 416: Reimplement Core Reflection with Method Handles (Finalized)

Java 18 improves the internal implementation of `java.lang.reflect.Method` and `Constructor` to make them faster and better-performing. This change does not alter any public APIs, meaning developers can benefit from faster Reflection without modifying any reflection-related code.

OpenJDK published benchmark results comparing the reflection performance of the new and old implementations:

![Reflection performance benchmark results comparing the new and old implementations](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/JEP416Benchmark-8f2760d5.png)

## JEP 417: Vector API (Third Incubator)

The Vector API was initially proposed in [JEP 338](https://openjdk.java.net/jeps/338) and integrated into Java 16 as an [Incubator API](http://openjdk.java.net/jeps/11). Its second incubator round was proposed in [JEP 414](https://openjdk.java.net/jeps/414) and integrated into Java 17; its third incubator round was proposed in [JEP 417](https://openjdk.java.net/jeps/417) and integrated into Java 18; and its fourth incubator round was proposed in [JEP 426](https://openjdk.java.net/jeps/426) and integrated into Java 19.

Vector computation consists of a sequence of operations on vectors. The Vector API is designed to express vector computations that reliably compile at runtime to optimal vector instructions on supported CPU architectures, achieving superior performance compared to equivalent scalar computations.

The goal of the Vector API is to provide users with a clean, easy-to-use, platform-independent way to express a wide range of vector computations.

Here is a simple scalar computation over array elements:

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

In JDK 18, the performance of the Vector API was further optimized.

## JEP 418: Internet-Address Resolution SPI (Finalized)

Java 18 defines a new SPI (Service Provider Interface) for host name and address resolution so that `java.net.InetAddress` can make use of third-party resolvers other than the platform's built-in resolver.

## JEP 419: Foreign Function & Memory API (Second Incubator)

This API allows Java programs to interoperate with code and data outside the Java runtime. By efficiently invoking foreign functions (code outside the JVM) and safely accessing foreign memory (memory not managed by the JVM), it enables Java programs to call native libraries and process native data without the danger and fragility of JNI.

The Foreign Function & Memory API completed its first incubator round in Java 17 via [JEP 412](https://openjdk.java.net/jeps/412). Its second incubator round was proposed in [JEP 419](https://openjdk.org/jeps/419) and integrated into Java 18, and its first preview was proposed in [JEP 424](https://openjdk.org/jeps/424) and integrated into Java 19.

I have covered the Foreign Function & Memory API in detail in [Java 19 New Features Overview](./java19.md), so it will not be repeated here.
