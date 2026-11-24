---
title: "Java Fundamentals Topic: Syntax, OOP, Generics, Reflection, Proxy & Serialization"
description: "Java fundamentals interview and learning roadmap covering basic syntax, OOP, keywords, pass-by-value, generics, reflection, proxy, serialization, SPI, Unsafe, and syntactic sugar."
category: Java
tag:
  - Java
  - Java Fundamentals
  - Java Interview
lang: en
sourceRef: zh-ref/java/basis/README.md
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Java fundamentals,Java basic interview questions,Java keywords,Java pass-by-value,Java generics,Java reflection,Java proxy,Java serialization,Java SPI,Java Unsafe,Java syntactic sugar
---

Java fundamentals are the prerequisite foundation for studying Collections, Concurrency, the JVM, Spring, and various middleware later on. This section is not just about memorizing syntax—more importantly, it is about understanding Java's object model, parameter passing, generic type erasure, reflective invocation, dynamic proxies, serialization boundaries, and framework extension mechanisms.

## Who Should Read This

- Readers who are just beginning to study Java systematically and want to connect basic syntax with core mechanisms.
- Candidates preparing for Java basic interview questions who want to quickly identify and fill knowledge gaps.
- Developers who have already built Java projects but do not yet deeply understand mechanisms such as reflection, proxies, generics, SPI, and serialization.
- Engineers who need to solidify prerequisite knowledge before diving into Collections, Concurrency, the JVM, or Spring source code.

## Key Learning Areas

- Basic Java syntax, Object-Oriented Programming (OOP), exceptions, commonly used classes, keywords, and coding details.
- The relationship between pass-by-value, reference variables, object mutability, and method invocation.
- Generics, wildcards, type erasure, and their impact on Collections, API design, and reflection.
- Common underlying framework mechanisms such as reflection, dynamic proxies, and SPI.
- Practical pitfalls frequently encountered in projects and interviews, including serialization, `BigDecimal`, `Unsafe`, and syntactic sugar.

## Recommended Reading Order

1. [Java Basics Common Interview Questions Summary (Part 1)](./java-basic-questions-01.md): Start by reviewing Java basic syntax, OOP, and commonly used classes.
2. [Java Basics Common Interview Questions Summary (Part 2)](./java-basic-questions-02.md) and [Java Basics Common Interview Questions Summary (Part 3)](./java-basic-questions-03.md): Fill in gaps around exceptions, generics, reflection, annotations, and common pitfalls.
3. [Java Keywords Summary](./java-keyword-summary.md) and [Java Pass-by-Value Explained](./why-there-only-value-passing-in-java.md): Clarify high-frequency misconceptions in foundational concepts.
4. [Generics & Wildcards Explained](./generics-and-wildcards.md), [Java Reflection Mechanism Explained](./reflection.md), and [Java Proxy Pattern Explained](./proxy.md): Understand the core capabilities underlying frameworks.
5. [Java Serialization Explained](./serialization.md), [Java SPI Mechanism Explained](./spi.md), and [Java Magic Class Unsafe Explained](./unsafe.md): Continue rounding out extension knowledge for engineering practice and source code reading.

## Core Articles

### Basic Interview Questions

- [Java Basics Common Interview Questions Summary (Part 1)](./java-basic-questions-01.md): Covers Java language features, basic syntax, OOP, commonly used classes, and common pitfalls.
- [Java Basics Common Interview Questions Summary (Part 2)](./java-basic-questions-02.md): Continues through exceptions, generics, reflection, annotations, and related foundational capabilities.
- [Java Basics Common Interview Questions Summary (Part 3)](./java-basic-questions-03.md): Covers more detail-oriented and advanced foundational interview questions.

### Language Mechanisms

- [Java Keywords Summary](./java-keyword-summary.md): Explains keywords such as `final`, `static`, `this`, and `super`.
- [Java Pass-by-Value Explained](./why-there-only-value-passing-in-java.md): Explains why Java only has pass-by-value and the true semantics when passing reference variables as arguments.
- [Generics & Wildcards Explained](./generics-and-wildcards.md): Understand generics syntax, upper/lower bounded wildcards, type erasure, and common use cases.
- [Java Syntactic Sugar Explained](./syntactic-sugar.md): Learn how the compiler handles syntactic sugar such as enhanced `for` loops, autoboxing/unboxing, enums, and Lambdas.

### Underlying Framework Mechanisms

- [Java Reflection Mechanism Explained](./reflection.md): Understand `Class` objects, reflective invocation, performance overhead, and use cases.
- [Java Proxy Pattern Explained](./proxy.md): Master static proxies, JDK dynamic proxies, and CGLIB proxies.
- [Java SPI Mechanism Explained](./spi.md): Understand service discovery and pluggable extension mechanisms.
- [Java Serialization Explained](./serialization.md): Understand the serialization workflow, `serialVersionUID`, security risks, and alternative solutions.

### Practical Details

- [BigDecimal Explained](./bigdecimal.md): Master monetary calculation, precision, rounding modes, and constructor caveats.
- [Should Java Use long or BigDecimal for Money?](./money-long-vs-bigdecimal.md): Distinguish between money storage and calculation scenarios, covering smallest currency units, rounding, overflow, and database column design.
- [Java Magic Class Unsafe Explained](./unsafe.md): Understand off-heap memory, CAS, object field offsets, and low-level capabilities in source code.

## Frequently Asked Questions

- Is Java pass-by-value or pass-by-reference? Why can an object's fields be modified when it is passed as a parameter?
- What is the difference between `==` and `equals()`? Why must `hashCode()` be overridden whenever `equals()` is overridden?
- How should you choose among `String`, `StringBuilder`, and `StringBuffer`?
- What are the roles of `final`, `static`, `this`, and `super` respectively?
- What is generic type erasure? What is the difference between `List<String>` and `List<Integer>` at runtime?
- Why is reflection slow? What are its typical use cases?
- What is the difference between JDK dynamic proxy and CGLIB dynamic proxy?
- Why is it not recommended to use Java's built-in serialization directly?
- Why is it recommended to construct `BigDecimal` from a `String`?
- Should monetary amounts use `long` to store the smallest unit, or use `BigDecimal`?

## Related Topics

- [Java Knowledge System](../)
- [Java Collections Topic](../collection/)
- [Java Concurrency Programming Topic](../concurrent/)
- [JVM Topic](../jvm/)
- [Spring](../../system-design/framework/spring/)
