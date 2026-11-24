---
title: Detailed Explanation of CAS
description: "In-depth analysis of CAS (Compare-And-Swap): explaining CAS atomic operation principles, Unsafe class implementation, the ABA problem and its solutions, the Spin Lock mechanism, and performance comparison with Pessimistic Locking."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/cas.md
head:
  - - meta
    - name: keywords
      content: CAS,Compare-And-Swap,atomic operation,ABA problem,Spin Lock,Optimistic Locking,Unsafe,CAS principle
---

For an introduction to Optimistic Locking and Pessimistic Locking as well as common implementation approaches for Optimistic Locking, you can read the author's article: [Detailed Explanation of Optimistic Locking and Pessimistic Locking](https://javaguide.cn/java/concurrent/optimistic-lock-and-pessimistic-lock.html).

This article mainly introduces: how CAS is implemented in Java and some issues that exist with CAS.

## How Is CAS Implemented in Java?

In Java, a key class for implementing CAS (Compare-And-Swap) operations is `Unsafe`.

Located in the `sun.misc` package, the `Unsafe` class provides low-level, unsafe operations. Because of its powerful capabilities and potential risks, it is typically used inside the JVM or in libraries that require extreme performance and low-level access, and is not recommended for ordinary developers to use in application code. For a detailed introduction to the `Unsafe` class, you can read this article: 📌[Detailed Explanation of the Magic Class Unsafe in Java](https://javaguide.cn/java/basis/unsafe.html).

The `Unsafe` class in the `sun.misc` package provides the `compareAndSwapObject`, `compareAndSwapInt`, and `compareAndSwapLong` methods to perform CAS operations on `Object`, `int`, and `long` types:

```java
/**
 * Atomically updates the value of an object field.
 *
 * @param o        the object to operate on
 * @param offset   the memory offset of the object field
 * @param expected the expected old value
 * @param x        the new value to set
 * @return true if the value was successfully updated; false otherwise
 */
boolean compareAndSwapObject(Object o, long offset, Object expected, Object x);

/**
 * Atomically updates the value of an int object field.
 */
boolean compareAndSwapInt(Object o, long offset, int expected, int x);

/**
 * Atomically updates the value of a long object field.
 */
boolean compareAndSwapLong(Object o, long offset, long expected, long x);
```

These CAS methods provided by `Unsafe` in JDK 8 are `native` methods. Java code expresses atomic compare-and-swap semantics through them, and HotSpot usually recognizes the relevant calls as JVM intrinsics, mapping them to atomic instructions or equivalent implementations supported by the target processor. The specific implementation depends on the JVM and CPU architecture, and cannot simply be summarized as "calling C++ inline assembly via JNI."

The `java.util.concurrent.atomic` package provides several classes for atomic operations.

![Overview of JUC Atomic Classes](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/JUC-064976d1.png)

For an introduction and usage guide to these Atomic classes, you can read this article: [Summary of Atomic Classes](https://javaguide.cn/java/concurrent/atomic-classes.html).

Atomic classes rely on CAS Optimistic Locking to guarantee the atomicity of their methods, without using traditional locking mechanisms (such as `synchronized` blocks or `ReentrantLock`).

`AtomicInteger` is one of Java's atomic classes, mainly used to perform atomic operations on variables of type `int`. The JDK 8 implementation below utilizes the low-level atomic operation methods provided by `Unsafe`; in newer JDK versions, the relevant APIs and internal implementation details may differ, and application code can also use the standard `VarHandle` to express atomic access semantics.

Below, by analyzing the core source code of `AtomicInteger` (JDK 1.8), we illustrate how Java uses the methods of the `Unsafe` class to implement atomic operations.

The core source code of `AtomicInteger` is as follows:

```java
// Obtain the Unsafe instance
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long valueOffset;

static {
    try {
        // Get the memory offset of the "value" field in the AtomicInteger class
        valueOffset = unsafe.objectFieldOffset
            (AtomicInteger.class.getDeclaredField("value"));
    } catch (Exception ex) { throw new Error(ex); }
}
// Ensure the visibility of the "value" field
private volatile int value;

// If the current value equals the expected value, atomically set the value to update
// Uses Unsafe#compareAndSwapInt to perform the CAS operation
public final boolean compareAndSet(int expect, int update) {
    return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
}

// Atomically add delta to the current value and return the old value
public final int getAndAdd(int delta) {
    return unsafe.getAndAddInt(this, valueOffset, delta);
}

// Atomically increment the current value by 1 and return the value before incrementing (old value)
// Uses Unsafe#getAndAddInt to perform the CAS operation.
public final int getAndIncrement() {
    return unsafe.getAndAddInt(this, valueOffset, 1);
}

// Atomically decrement the current value by 1 and return the value before decrementing (old value)
public final int getAndDecrement() {
    return unsafe.getAndAddInt(this, valueOffset, -1);
}
```

Source code of `Unsafe#getAndAddInt`:

```java
// Atomically get and increment an integer value
public final int getAndAddInt(Object o, long offset, int delta) {
    int v;
    do {
        // Read the int value of object o at memory offset using volatile semantics
        v = getIntVolatile(o, offset);
    } while (!compareAndSwapInt(o, offset, v, v + delta));
    // Return the old value
    return v;
}
```

As we can see, `getAndAddInt` uses a `do-while` loop: when the `compareAndSwapInt` operation fails, it keeps retrying until it succeeds. That is, `getAndAddInt` tries to update `value` via `compareAndSwapInt`; if the update fails (the current value was modified by another thread during this time), it re-reads the current value and tries updating again until the operation succeeds.

Because a CAS operation may fail due to concurrent conflicts, it is typically paired with a `while` loop to keep retrying after failure until the operation succeeds. This is the **Spin Lock mechanism**.

## What Problems Exist with the CAS Algorithm?

The ABA problem is the most common issue with the CAS algorithm.

### The ABA Problem

If a variable V has value A when first read, and is checked to still be value A when preparing to assign a new value, can we conclude that its value has never been modified by other threads? Obviously not, because during that interval its value could have been changed to another value and then changed back to A, causing the CAS operation to mistakenly assume it was never modified. This issue is known as the **"ABA" problem** of CAS operations.

The solution to the ABA problem is to prepend a **version number or timestamp** to the variable. Since JDK 1.5, the `AtomicStampedReference` class has been provided to solve the ABA problem. Its `compareAndSet()` method first checks whether the current reference equals the expected reference and whether the current stamp equals the expected stamp; if both match, it atomically updates the reference and the stamp to the given new values.

```java
public boolean compareAndSet(V   expectedReference,
                             V   newReference,
                             int expectedStamp,
                             int newStamp) {
    Pair<V> current = pair;
    return
        expectedReference == current.reference &&
        expectedStamp == current.stamp &&
        ((newReference == current.reference &&
          newStamp == current.stamp) ||
         casPair(current, Pair.of(newReference, newStamp)));
}
```

### High Overhead from Long Loop Times

CAS frequently uses spinning to retry—that is, looping continuously until it succeeds. If it fails to succeed for a long time, it imposes very high execution overhead on the CPU.

If the JVM supports the `pause` instruction provided by the processor, the efficiency of spin operations will be improved. The `pause` instruction serves two important purposes:

1. **Delays pipeline instruction execution**: The `pause` instruction can delay instruction execution, thereby reducing CPU resource consumption. The exact delay depends on the processor's implementation version; on some processors, the delay may be zero.
2. **Avoids memory order violations**: When exiting a loop, the `pause` instruction can avoid flushing the CPU pipeline caused by memory order violations, thereby improving CPU execution efficiency.

### Can Only Guarantee Atomicity of a Single Shared Variable

CAS operations are only effective on a single shared variable. When multiple shared variables need to be operated on together, CAS falls short. However, starting from JDK 1.5, Java provided the `AtomicReference` class, enabling us to guarantee atomicity across referenced objects. By encapsulating multiple variables inside a single object, we can use `AtomicReference` to perform CAS operations.

Aside from using `AtomicReference`, locking can also be used to guarantee atomicity.

## Summary

In Java, APIs such as atomic classes and `VarHandle` can express CAS operations; the JVM then implements them using processor-supported atomic instructions or equivalent mechanisms depending on the target platform. The exact implementation depends on the JVM and CPU architecture and is not restricted by the Java specification to JNI or any particular assembly syntax.

While CAS offers efficient lock-free characteristics, issues such as ABA and high overhead from prolonged spinning must also be kept in mind.
