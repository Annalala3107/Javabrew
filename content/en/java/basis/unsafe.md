---
title: Java Magic Class Unsafe Explained
description: "An in-depth guide to Java's magic class Unsafe: covering direct memory operations, CAS atomic operations, object instantiation, and other low-level capabilities, as well as the implementation principles of JUC concurrency utilities and usage risks."
category: Java
tag:
  - Java Fundamentals
lang: en
sourceRef: zh-ref/java/basis/unsafe.md
head:
  - - meta
    - name: keywords
      content: Unsafe class,memory operations,CAS atomic operations,off-heap memory,direct memory,sun.misc.Unsafe,JUC internals
---

> This article is compiled and refined from the following two excellent articles:
>
> - [Java Magic Class: Unsafe Usage Analysis - Meituan Tech Team - 2019](https://tech.meituan.com/2019/02/14/talk-about-java-magic-class-unsafe.html)
> - [The Double-Edged Sword of Java: Unsafe Class Explained - Manong Canshang - 2021](https://xie.infoq.cn/article/8b6ed4195e475bfb32dacc5cb)

<!-- markdownlint-disable MD024 -->

Anyone who has read the JUC source code will surely have noticed that many concurrency utilities call a class named `Unsafe`.

So what is this class mainly used for? What are its use cases? This article will walk you through it!

## Introduction to Unsafe

`Unsafe` is a class in the `sun.misc` package that primarily provides methods for performing low-level, unsafe operations, such as directly accessing system memory resources and independently managing memory resources. These methods play a significant role in improving Java's runtime efficiency and enhancing Java's ability to manipulate low-level resources. However, because the `Unsafe` class gives Java the ability to manipulate memory space much like C pointers, it undoubtedly increases the risk of pointer-related bugs in programs. Excessive or improper use of the `Unsafe` class increases the probability of program errors and makes a safe language like Java no longer "safe," so `Unsafe` must be used with great caution.

In addition, the implementation of the capabilities provided by `Unsafe` relies on **Native Methods**. You can think of a native method as a method in Java written in another programming language. Native methods are modified with the **`native`** keyword: Java code only declares the method header, while the concrete implementation is delegated to **native code**.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717115231125-9fa85f9b.png)

**Why use native methods?**

1. When you need operating-system-dependent features that Java does not possess: while achieving cross-platform portability, Java needs the help of other languages to exercise low-level control.
2. When ready-made functionality has already been implemented in other languages, Java can invoke it directly.
3. When a program is time-sensitive or has extremely high performance requirements, it is necessary to use a lower-level language such as C/C++ or even assembly.

When implementing concurrency mechanisms, many concurrency utilities in the JUC package call native methods, breaking through the boundaries of the Java runtime to access certain low-level operating system features. For the same native method, different operating systems may implement it in different ways, but this is transparent to the user and ultimately produces the same result.

## Creating Unsafe

Part of the source code of `sun.misc.Unsafe` is as follows:

```java
public final class Unsafe {
  // Singleton instance
  private static final Unsafe theUnsafe;
  ......
  private Unsafe() {
  }
  @CallerSensitive
  public static Unsafe getUnsafe() {
    Class var0 = Reflection.getCallerClass();
    // Valid only when loaded by the bootstrap class loader `BootstrapClassLoader`
    if(!VM.isSystemDomainLoader(var0.getClassLoader())) {
      throw new SecurityException("Unsafe");
    } else {
      return theUnsafe;
    }
  }
}
```

The `Unsafe` class is implemented as a singleton and provides the static method `getUnsafe` to obtain an `Unsafe` instance. At first glance, this looks like a way to get an `Unsafe` instance. However, when we call this static method directly, a `SecurityException` is thrown:

```bash
Exception in thread "main" java.lang.SecurityException: Unsafe
 at sun.misc.Unsafe.getUnsafe(Unsafe.java:90)
 at com.cn.test.GetUnsafeTest.main(GetUnsafeTest.java:12)
```

**Why can't this `public static` method be called directly?**

This is because inside the `getUnsafe` method, the caller's `classLoader` is checked to determine whether the current class was loaded by the `Bootstrap classLoader`. If not, a `SecurityException` is thrown. In other words, only classes loaded by the bootstrap class loader are allowed to call methods in the `Unsafe` class, preventing these methods from being invoked in untrusted code.

**Why are there such cautious restrictions on using the `Unsafe` class?**

The capabilities provided by `Unsafe` are too low-level (such as directly accessing system memory resources and independently managing memory resources), carrying relatively high security risks; if misused, serious problems can easily occur.

**If we want to use the `Unsafe` class, how should we obtain an instance of it?**

Here are two feasible approaches.

1. Use reflection to obtain the already-instantiated singleton object `theUnsafe` in the `Unsafe` class.

```java
private static Unsafe reflectGetUnsafe() {
    try {
      Field field = Unsafe.class.getDeclaredField("theUnsafe");
      field.setAccessible(true);
      return (Unsafe) field.get(null);
    } catch (Exception e) {
      log.error(e.getMessage(), e);
      return null;
    }
}
```

2. Starting from the usage restriction of the `getUnsafe` method, append the path of the JAR containing class `A` (which calls `Unsafe`-related methods) to the default bootstrap path via the Java command-line option `-Xbootclasspath/a`, so that `A` is loaded by the bootstrap class loader and can safely obtain an `Unsafe` instance via `Unsafe.getUnsafe`.

```bash
java -Xbootclasspath/a: ${path}   // where path is the path to the JAR containing the class that calls Unsafe-related methods
```

## Unsafe Capabilities

Broadly speaking, the capabilities implemented by the `Unsafe` class can be divided into the following 8 categories:

1. Memory operations
2. Memory barriers
3. Object operations
4. Data operations
5. CAS operations
6. Thread scheduling
7. Class operations
8. System information

### Memory Operations

#### Introduction

If you are a programmer who has written C or C++, you are certainly no stranger to memory operations, whereas in Java direct manipulation of memory is not allowed—the allocation and reclamation of object memory are handled by the JVM itself. However, `Unsafe` provides the following interfaces to perform memory operations directly:

```java
// Allocate new native space
public native long allocateMemory(long bytes);
// Resize the memory space
public native long reallocateMemory(long address, long bytes);
// Set memory to a specified value
public native void setMemory(Object o, long offset, long bytes, byte value);
// Copy memory
public native void copyMemory(Object srcBase, long srcOffset,Object destBase, long destOffset,long bytes);
// Free memory
public native void freeMemory(long address);
```

Test using the following code:

```java
private void memoryTest() {
    int size = 4;
    // 1. Allocate initial memory
    long oldAddr = unsafe.allocateMemory(size);
    System.out.println("Initial address: " + oldAddr);

    // 2. Write data to the initial memory
    unsafe.putInt(oldAddr, 16843009); // Write 0x01010101
    System.out.println("Value at oldAddr: " + unsafe.getInt(oldAddr));

    // 3. Reallocate memory
    long newAddr = unsafe.reallocateMemory(oldAddr, size * 2);
    System.out.println("New address: " + newAddr);

    // 4. reallocateMemory has copied the data from oldAddr to newAddr
    // So the first 4 bytes of newAddr should match the contents of oldAddr
    System.out.println("Value at newAddr (first 4 bytes): " + unsafe.getInt(newAddr));

    // Key point: all subsequent operations should be based on newAddr; oldAddr is no longer valid!
    try {
        // 5. Write new data to the second half of the new memory block
        unsafe.putInt(newAddr + size, 33686018); // Write 0x02020202

        // 6. Read the entire 8-byte long value
        System.out.println("Value at newAddr (full 8 bytes): " + unsafe.getLong(newAddr));

    } finally {
        // 7. Only free the final valid memory address
        unsafe.freeMemory(newAddr);
        // Attempting freeMemory(oldAddr) will cause a double free error!
    }
}
```

First, look at the output:

```plain
Initial address: 140467048086752
Value at oldAddr: 16843009
New address: 140467048086752
Value at newAddr (first 4 bytes): 16843009
Value at newAddr (full 8 bytes): 144680345659310337
```

`reallocateMemory` behaves similarly to the `realloc` function in C: it tries to expand or shrink the memory block without moving data. Its behavior falls into two main cases:

1. **In-place expansion**: If there is enough contiguous free space after the current memory block, `reallocateMemory` expands the memory directly at the original address and returns the original address.
2. **Relocated expansion**: If there is insufficient space after the current memory block, it finds a new, sufficiently large memory region, copies the old data over, frees the old memory address, and returns the new address.

**Based on the output of this run, we can analyze it as follows:**

**Step 1: Initial allocation and write**

- `unsafe.allocateMemory(size)` allocates 4 bytes of off-heap memory at address `140467048086752`.
- `unsafe.putInt(oldAddr, 16843009)` writes the `int` value `16843009` (`0x01010101` in hexadecimal) to that address. `getInt` reads it back correctly, proving the write succeeded.

**Step 2: In-place memory expansion**

- `long newAddr = unsafe.reallocateMemory(oldAddr, size * 2)` attempts to expand the memory block to 8 bytes.
- Observing the output `New address: 140467048086752`, we find that `newAddr` and `oldAddr` have the **exact same** value.
- This indicates that this operation triggered an "in-place expansion." The system found enough space behind the original address `140467048086752` and expanded the memory block directly to 8 bytes. During this process, the old address `oldAddr` remained valid and equal to `newAddr`, and the data did not move.

**Step 3: Verify data and write new data**

- `unsafe.getInt(newAddr)` reads the first 4 bytes again and still returns `16843009`, verifying that the original data is intact.
- `unsafe.putInt(newAddr + size, 33686018)` writes the new `int` value `33686018` (`0x02020202` in hexadecimal) into the newly expanded last 4 bytes (at offset 4).

**Step 4: Read the full data**

- `unsafe.getLong(newAddr)` reads a `long` value (8 bytes) from the starting address. At this point, the 8 bytes in memory are the concatenation of `0x01010101` (low address) and `0x02020202` (high address).
- On a Little-Endian machine, these 8 bytes in memory are interpreted as the hexadecimal number `0x0202020201010101`.
- Converting this hexadecimal number to decimal gives `144680345659310337`, which perfectly explains the final output.

**Step 5: Safe memory deallocation**

- In the `finally` block, `unsafe.freeMemory(newAddr)` safely frees the entire 8-byte memory block.
- Because this was an in-place expansion (`oldAddr == newAddr`), even mistakenly writing an extra `freeMemory(oldAddr)` will cause a serious double-free error.

#### Typical Use Cases

`DirectByteBuffer` is an important class in Java used to implement off-heap memory. It is commonly used as a buffer pool during communication and is widely used in NIO frameworks such as Netty and MINA. `DirectByteBuffer`'s logic for creating, using, and destroying off-heap memory is all implemented using the off-heap memory APIs provided by `Unsafe`.

**Why use off-heap memory?**

- Improvement in garbage collection pauses. Because off-heap memory is managed directly by the operating system rather than the JVM, using off-heap memory allows us to keep the on-heap memory size relatively small, thereby reducing the impact of GC pauses on the application.
- Improved I/O performance. Typically, during I/O communication, data must be copied between on-heap memory and off-heap memory. For temporary data that requires frequent inter-memory copying and has a short lifecycle, storing it in off-heap memory is recommended.

Below is the `DirectByteBuffer` constructor. When creating a `DirectByteBuffer`, it allocates memory via `Unsafe.allocateMemory` and initializes it via `Unsafe.setMemory`, then constructs a `Cleaner` object to track garbage collection of the `DirectByteBuffer` object so that when the `DirectByteBuffer` is garbage collected, the allocated off-heap memory is freed along with it.

```java
DirectByteBuffer(int cap) {                   // package-private

    super(-1, 0, cap, cap);
    boolean pa = VM.isDirectMemoryPageAligned();
    int ps = Bits.pageSize();
    long size = Math.max(1L, (long)cap + (pa ? ps : 0));
    Bits.reserveMemory(size, cap);

    long base = 0;
    try {
        // Allocate memory and return the base address
        base = unsafe.allocateMemory(size);
    } catch (OutOfMemoryError x) {
        Bits.unreserveMemory(size, cap);
        throw x;
    }
    // Initialize memory
    unsafe.setMemory(base, size, (byte) 0);
    if (pa && (base % ps != 0)) {
        // Round up to page boundary
        address = base + ps - (base & (ps - 1));
    } else {
        address = base;
    }
    // Track garbage collection of the DirectByteBuffer object to free off-heap memory
    cleaner = Cleaner.create(this, new Deallocator(base, size, cap));
    att = null;
}
```

### Memory Barriers

#### Introduction

Before introducing memory barriers, you should know that compilers and CPUs may reorder code while ensuring the program's output remains consistent, in order to improve performance from an instruction-optimization perspective. However, instruction reordering can lead to an undesirable outcome: inconsistency between CPU caches and main memory. A **Memory Barrier** prevents improper compiler and hardware optimizations by prohibiting instruction reordering across both sides of the barrier.

At the hardware level, memory barriers are instructions provided by the CPU to prevent code reordering, and the methods for implementing memory barriers may differ across hardware platforms. In Java 8, three memory barrier methods were introduced; they shield underlying OS differences, allowing developers to define them in code and letting the JVM uniformly generate the memory barrier instructions to implement memory barrier functionality.

`Unsafe` provides the following three memory barrier methods:

```java
// Memory barrier prohibiting load reordering: load operations before the barrier cannot be reordered after it, and load operations after the barrier cannot be reordered before it
public native void loadFence();
// Memory barrier prohibiting store reordering: store operations before the barrier cannot be reordered after it, and store operations after the barrier cannot be reordered before it
public native void storeFence();
// Memory barrier prohibiting load and store reordering
public native void fullFence();
```

Memory barriers constrain the reordering and visibility semantics between specified memory accesses; they are not equivalent to "flushing the CPU cache" or forcing all data to be re-read from main memory. `loadFence()` only provides read-side ordering constraints and cannot on its own establish a `happens-before` relationship in the Java Memory Model between two ordinary field accesses.

Therefore, you cannot replace `volatile` with "an ordinary `boolean` field + `loadFence()`" to guarantee cross-thread visibility. Shared flags should use synchronization mechanisms such as `volatile`, locks, or `VarHandle` with matching read/write access modes; otherwise, the code still has a data race, and reading threads are not guaranteed to observe the writes.

#### Typical Use Cases

Java 8 introduced a new locking mechanism—`StampedLock`—which can be viewed as an improved version of a read-write lock. `StampedLock` provides an optimistic read lock implementation that behaves similarly to a lock-free operation and does not block writer threads from acquiring the write lock at all, thereby alleviating writer thread "starvation" in read-heavy, write-light scenarios. Because the optimistic read lock provided by `StampedLock` does not block writer threads from acquiring the write lock, data inconsistency can occur when shared variables are loaded from main memory into a thread's working memory.

To solve this problem, `StampedLock`'s `validate` method inserts a `load` memory barrier through `Unsafe`'s `loadFence` method.

```java
public boolean validate(long stamp) {
   U.loadFence();
   return (stamp & SBITS) == (state & SBITS);
}
```

### Object Operations

#### Introduction

**Example**

```java
import sun.misc.Unsafe;
import java.lang.reflect.Field;

public class Main {

    private int value;

    public static void main(String[] args) throws Exception{
        Unsafe unsafe = reflectGetUnsafe();
        assert unsafe != null;
        long offset = unsafe.objectFieldOffset(Main.class.getDeclaredField("value"));
        Main main = new Main();
        System.out.println("value before putInt: " + main.value);
        unsafe.putInt(main, offset, 42);
        System.out.println("value after putInt: " + main.value);
  System.out.println("value after putInt: " + unsafe.getInt(main, offset));
    }

    private static Unsafe reflectGetUnsafe() {
        try {
            Field field = Unsafe.class.getDeclaredField("theUnsafe");
            field.setAccessible(true);
            return (Unsafe) field.get(null);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

}
```

Output:

```plain
value before putInt: 0
value after putInt: 42
value after putInt: 42
```

**Object Fields**

We already tested obtaining the memory offset of an object's member field and modifying the field's value in the example above. In addition to the `putInt` and `getInt` methods shown earlier, `Unsafe` provides `put` and `get` methods for all 8 primitive data types as well as `Object`, and all `put` methods can bypass access permissions to directly modify data in memory. Reading the comments in the OpenJDK source code reveals that reading and writing primitive data types differs slightly from `Object`: primitive types operate directly on the field value (`value`), whereas `Object` operations are based on the reference value (`reference value`). Below are the read and write methods for `Object`:

```java
// Get an object reference at the specified offset of the object
public native Object getObject(Object o, long offset);
// Write an object reference at the specified offset of the object
public native void putObject(Object o, long offset, Object x);
```

In addition to ordinary reads and writes of object fields, `Unsafe` also provides **volatile read/write** and **ordered write** methods. The coverage of `volatile` read/write methods is the same as that of ordinary read/write methods, covering all primitive data types and `Object`. Taking `int` as an example:

```java
// Read an int value at the specified offset of the object, supporting volatile load semantics
public native int getIntVolatile(Object o, long offset);
// Write an int at the specified offset of the object, supporting volatile store semantics
public native void putIntVolatile(Object o, long offset, int x);
```

Compared with ordinary reads and writes, `volatile` reads and writes have higher cost because they must guarantee visibility and ordering. When executing a `get` operation, the field value is forced to be fetched from main memory; when setting the field value with `put`, the value is forced to be updated to main memory, thereby ensuring that these changes are visible to other threads.

There are three ordered write methods:

```java
public native void putOrderedObject(Object o, long offset, Object x);
public native void putOrderedInt(Object o, long offset, int x);
public native void putOrderedLong(Object o, long offset, long x);
```

Ordered writes have relatively lower cost than `volatile` writes because they only guarantee ordering on writes without guaranteeing visibility—that is, a value written by one thread is not guaranteed to be immediately visible to other threads. To understand this difference, we need to expand further on memory barriers by first understanding two instruction concepts:

- `Load`: copies data from main memory into the processor's cache
- `Store`: flushes data from the processor's cache to main memory

The difference between an ordered write and a `volatile` write is that an ordered write inserts a `StoreStore` memory barrier, whereas a `volatile` write inserts a `StoreLoad` memory barrier, as shown in the figure below:

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144834132-34351d0d.png)

In ordered write methods, a `StoreStore` barrier is used, which ensures that `Store1` flushes data to memory immediately before `Store2` and subsequent store instructions execute. In `volatile` writes, a `StoreLoad` barrier is used, which ensures that `Store1` flushes data to memory immediately before `Load2` and subsequent load instructions; furthermore, a `StoreLoad` barrier causes all memory access instructions before the barrier (including store instructions and access instructions) to complete completely before executing the memory access instructions after the barrier.

To summarize, among the three types of write methods above, in terms of write efficiency, efficiency decreases in the order of `put`, `putOrder`, and `putVolatile`.

**Object Instantiation**

Using `Unsafe`'s `allocateInstance` method allows us to instantiate objects in an unconventional way. First, define an entity class and assign a value to its member variable inside the constructor:

```java
@Data
public class A {
    private int b;
    public A(){
        this.b =1;
    }
}
```

Compare creating objects based on different approaches—constructor, reflection, and the `Unsafe` method:

```java
public void objTest() throws Exception{
    A a1=new A();
    System.out.println(a1.getB());
    A a2 = A.class.newInstance();
    System.out.println(a2.getB());
    A a3= (A) unsafe.allocateInstance(A.class);
    System.out.println(a3.getB());
}
```

The printed results are 1, 1, and 0, respectively, indicating that during object creation via `allocateInstance`, the class's constructor is not invoked. When creating an object this way, only the `Class` object is used; therefore, if you want to skip the object initialization phase or bypass constructor security checks, you can use this method. In the example above, if class `A`'s constructor is changed to `private`, it will no longer be possible to create the object via the constructor or reflection (though you can still create the object after calling `setAccessible` on the `Constructor` object), whereas the `allocateInstance` method remains effective.

#### Typical Use Cases

- **Conventional object instantiation**: The ways we normally create objects essentially all rely on the `new` mechanism to instantiate objects. However, a characteristic of the `new` mechanism is that when a class only provides parameterized constructors and does not explicitly declare a no-arg constructor, you must use a parameterized constructor to construct the object, and when using a parameterized constructor, you must pass the corresponding number of arguments to complete object instantiation.
- **Unconventional instantiation**: By contrast, `Unsafe` provides the `allocateInstance` method, which can create an instance of a class solely through its `Class` object without needing to call its constructor, initialization code, JVM security checks, and so on. It suppresses modifier checks—meaning even if the constructor is modified with `private`, it can still be instantiated via this method; you only need to provide the `Class` object to create the corresponding object. Because of this characteristic, `allocateInstance` has corresponding applications in `java.lang.invoke`, Objenesis (which provides a way to generate objects bypassing class constructors), and Gson (used during deserialization).

### Array Operations

#### Introduction

Using `arrayBaseOffset` and `arrayIndexScale` together allows locating the memory position of each element in an array.

```java
// Return the offset address of the first element in the array
public native int arrayBaseOffset(Class<?> arrayClass);
// Return the size occupied by one element in the array
public native int arrayIndexScale(Class<?> arrayClass);
```

#### Typical Use Cases

These two data-operation-related methods have a classic application in `AtomicIntegerArray` under the `java.util.concurrent.atomic` package (which enables atomic operations on each element of an `Integer` array). As shown in the `AtomicIntegerArray` source code below, `Unsafe.arrayBaseOffset` and `Unsafe.arrayIndexScale` obtain the base offset address `base` of the array's first element and the single-element size factor `scale`, respectively. Subsequent related atomic operations all depend on these two values to locate elements in the array; for example, the `getAndAdd` method shown in the second figure below obtains the offset address of a given array element via the `checkedByteOffset` method and then achieves atomic execution via CAS.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144927257-59852c31.png)

### CAS Operations

#### Introduction

This section mainly covers methods related to CAS operations.

```java
/**
  *  CAS
  * @param o         Object containing the field to modify
  * @param offset    Offset of the field in the object
  * @param expected  Expected value
  * @param update    Updated value
  * @return          true | false
  */
public final native boolean compareAndSwapObject(Object o, long offset,  Object expected, Object update);

public final native boolean compareAndSwapInt(Object o, long offset, int expected,int update);

public final native boolean compareAndSwapLong(Object o, long offset, long expected, long update);
```

**What is CAS?** CAS stands for **Compare And Swap**, a technique commonly used when implementing concurrent algorithms. A CAS operation involves three operands: the memory location, the expected original value, and the new value. When executing a CAS operation, if the value at the memory location equals the expected value, it is atomically updated to the new value; otherwise, no update is performed. HotSpot maps these operations to atomic primitives provided by the target platform; on x86 it typically uses `cmpxchg`, while other processor architectures may use different instructions or instruction sequences.

#### Typical Use Cases

CAS operations are used extensively in JUC concurrency utilities; as repeatedly mentioned in earlier articles introducing `synchronized` and `AQS`, CAS plays a wide role in concurrency utilities as an optimistic lock. In the `Unsafe` class, the `compareAndSwapObject`, `compareAndSwapInt`, and `compareAndSwapLong` methods are provided to perform CAS operations on `Object`, `int`, and `long` types. Taking `compareAndSwapInt` as an example:

```java
public final native boolean compareAndSwapInt(Object o, long offset,int expected,int x);
```

Among the parameters, `o` is the object to be updated, and `offset` is the offset of the integer field in object `o`. If the value of this field equals `expected`, the field is set to the new value `x`, and this update cannot be interrupted—that is, it is an atomic operation. Below is an example using `compareAndSwapInt`:

```java
private volatile int a;
public static void main(String[] args){
    CasTest casTest=new CasTest();
    new Thread(()->{
        for (int i = 1; i < 5; i++) {
            casTest.increment(i);
            System.out.print(casTest.a+" ");
        }
    }).start();
    new Thread(()->{
        for (int i = 5 ; i <10 ; i++) {
            casTest.increment(i);
            System.out.print(casTest.a+" ");
        }
    }).start();
}

private void increment(int x){
    while (true){
        try {
            long fieldOffset = unsafe.objectFieldOffset(CasTest.class.getDeclaredField("a"));
            if (unsafe.compareAndSwapInt(this,fieldOffset,x-1,x))
                break;
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        }
    }
}
```

Running the code outputs sequentially:

```plain
1 2 3 4 5 6 7 8 9
```

If you paste the snippet above into an IDE and run it, you will find that it does not produce the target output. A reader already pointed out this issue on GitHub: [issue#2650](https://github.com/Snailclimb/JavaGuide/issues/2650). Below is the corrected code:

```java
// Encapsulate the increment and print operations inside a method with stronger atomicity
private void incrementAndPrint(int targetValue) {
    while (true) {
        int currentValue = a; // Read the current value of a
        // If the current value has reached or exceeded targetValue, it has been handled by another thread; skip
        if (currentValue >= targetValue) {
            return;
        }
        // Attempt CAS: if currentValue equals targetValue - 1, atomically set it to targetValue
        if (currentValue == targetValue - 1) {
          if (unsafe.compareAndSwapInt(this, fieldOffset, currentValue, targetValue)) {
              // Print immediately after CAS succeeds, ensuring the printed value is the one set this time
              System.out.print(targetValue + " ");
              return;
          }
        }
        // CAS failed; re-read and retry
    }
}
```

In the example above, we created two threads that both attempt to modify the shared variable `a`. Each time a thread calls `incrementAndPrint(targetValue)`:

1. It first reads the current value `currentValue` of `a`.
2. It checks whether `currentValue` equals `targetValue - 1` (the expected previous value).
3. If the condition is met, it calls `unsafe.compareAndSwapInt()` to try updating `a` from `currentValue` to `targetValue`.
4. If the CAS operation succeeds (returns `true`), it prints `targetValue` and exits the loop.
5. If the CAS operation fails, it means another thread contended simultaneously, so it re-reads `currentValue` and retries until it succeeds.

This mechanism ensures that each number (from 1 to 9) is successfully set and printed only once, and in order.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144939826-ec576721.png)

Note the following points:

1. **Spinning logic:** The `compareAndSwapInt` method itself only performs a single compare-and-swap operation and immediately returns the result. Therefore, to ensure the operation eventually succeeds (when the value meets expectations), we need to explicitly implement spinning logic (such as a `while(true)` loop) in code, continuously retrying until the CAS operation succeeds.
2. **Implementation of `AtomicInteger`:** The `java.util.concurrent.atomic.AtomicInteger` class in the JDK internally uses similar CAS operations and spinning logic to implement its atomic `getAndIncrement()`, `compareAndSet()`, and other methods. Using `AtomicInteger` directly is usually safer and more recommended because it encapsulates the underlying complexity.
3. **The ABA problem:** CAS operations inherently have the ABA problem (a value changes from A to B and then back to A, causing the CAS check to assume the value has not changed). In certain scenarios where the change history of a value matters, `AtomicStampedReference` may be needed to solve it. However, in the simple incrementing scenario of this example, the ABA problem generally does not pose an impact.
4. **CPU consumption:** Prolonged spinning consumes CPU resources. Under intense contention or when conditions remain unmet for a long time, consider adding more sophisticated backoff strategies (such as `Thread.sleep()` or `LockSupport.parkNanos()`) for optimization.

### Thread Scheduling

#### Introduction

Currently, the main methods in `Unsafe` directly related to thread scheduling are `park` and `unpark`. The historical `monitorEnter`, `monitorExit`, and `tryMonitorEnter` methods were removed in JDK 9.

```java
// Unblock thread
public native void unpark(Object thread);
// Block thread
public native void park(boolean isAbsolute, long time);
```

The `park` and `unpark` methods enable suspending and resuming threads. Suspending a thread is accomplished through `park`: after calling `park`, the thread remains blocked until a timeout, an interrupt, or another wake-up condition occurs; `unpark` can terminate a suspended thread and restore it to normal execution.

The three `monitor`-related methods are only applicable when introducing older implementations; current JDK code can no longer call them. When an object monitor is needed, Java's `synchronized` statement or the locks and synchronizers in `java.util.concurrent` should be used.

#### Typical Use Cases

`AbstractQueuedSynchronizer` (AQS), the core class of Java's lock and synchronizer framework, implements thread blocking and waking by calling `LockSupport.park()` and `LockSupport.unpark()`, while `LockSupport`'s `park` and `unpark` methods are actually implemented by calling `Unsafe`'s `park` and `unpark` methods.

```java
public static void park(Object blocker) {
    Thread t = Thread.currentThread();
    setBlocker(t, blocker);
    UNSAFE.park(false, 0L);
    setBlocker(t, null);
}
public static void unpark(Thread thread) {
    if (thread != null)
        UNSAFE.unpark(thread);
}
```

`LockSupport`'s `park` method calls `Unsafe`'s `park` method under the hood. `park` may return because of an available permit, another thread calling `unpark`, thread interruption, or for no reason; timed variants also return after the timeout expires. Therefore, blocking logic that depends on a condition should re-check the condition in a loop. The example below demonstrates the case where another thread calls `unpark`:

```java
public static void main(String[] args) {
    Thread mainThread = Thread.currentThread();
    new Thread(()->{
        try {
            TimeUnit.SECONDS.sleep(5);
            System.out.println("subThread try to unpark mainThread");
            unsafe.unpark(mainThread);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }).start();

    System.out.println("park main mainThread");
    unsafe.park(false,0L);
    System.out.println("unpark mainThread success");
}
```

The program output is:

```plain
park main mainThread
subThread try to unpark mainThread
unpark mainThread success
```

The execution flow of the program is also quite easy to understand: after the child thread starts running, it sleeps first to ensure that the main thread can call `park` to block itself. After sleeping for 5 seconds, the child thread calls `unpark` to wake up the main thread, allowing the main thread to continue executing downward. The entire flow is shown in the figure below:

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144950116-7381d507.png)

### Class Operations

#### Introduction

`Unsafe`'s operations on `Class` mainly include methods for class loading and static field manipulation.

**Methods related to reading static fields**

> Version note: `shouldBeInitialized` and `ensureClassInitialized` were removed from `sun.misc.Unsafe` in JDK 22; the standard replacement is `MethodHandles.Lookup.ensureInitialized`, introduced in JDK 15. The relevant code below applies only to earlier JDK versions.

```java
// Get the offset of a static field
public native long staticFieldOffset(Field f);
// Get the object pointer of a static field
public native Object staticFieldBase(Field f);
// Determine whether a class needs initialization (used to check before accessing the class's static fields)
public native boolean shouldBeInitialized(Class<?> c);
```

Create a class containing a static field for testing:

```java
@Data
public class User {
    public static String name="Hydra";
    int age;
}
private void staticTest() throws Exception {
    User user=new User();
    // You can also trigger class initialization with the statements below
    // 1.
    // unsafe.ensureClassInitialized(User.class);
    // 2.
    // System.out.println(User.name);
    System.out.println(unsafe.shouldBeInitialized(User.class));
    Field sexField = User.class.getDeclaredField("name");
    long fieldOffset = unsafe.staticFieldOffset(sexField);
    Object fieldBase = unsafe.staticFieldBase(sexField);
    Object object = unsafe.getObject(fieldBase, fieldOffset);
    System.out.println(object);
}
```

Output:

```plain
false
Hydra
```

In `Unsafe`'s object operations, we learned how to obtain an object field's offset via `objectFieldOffset` and read or write the variable's value based on it, but that does not apply to static fields in a class; in that case, `staticFieldOffset` must be used. In the code above, `Class` is only relied upon when obtaining the `Field` object, while obtaining the static variable's value no longer depends on `Class`.

In the code above, a `User` object is created first because if a class has not been initialized, its static fields will not be initialized either, and the retrieved field value will end up being `null`. Therefore, before retrieving a static field, you need to call `shouldBeInitialized` to determine whether this class needs to be initialized first. If the statement creating the `User` object is deleted, the output becomes:

```plain
true
null
```

**Using the `defineClass` method allows a program to dynamically create a class at runtime**

> Version note: `sun.misc.Unsafe.defineClass` was removed in JDK 11. In JDK 9 and later, `MethodHandles.Lookup.defineClass` can be used depending on access-control requirements.

```java
public native Class<?> defineClass(String name, byte[] b, int off, int len, ClassLoader loader,ProtectionDomain protectionDomain);
```

In practice, you can simply pass in the byte array, the starting byte index, and the number of bytes to read; by default, the `ClassLoader` and `ProtectionDomain` come from the instance calling this method. The example below loads a compiled class file:

```java
private static void defineTest() {
    String fileName="F:\\workspace\\unsafe-test\\target\\classes\\com\\cn\\model\\User.class";
    File file = new File(fileName);
    try(FileInputStream fis = new FileInputStream(file)) {
        byte[] content=new byte[(int)file.length()];
        fis.read(content);
        Class clazz = unsafe.defineClass(null, content, 0, content.length, null, null);
        Object o = clazz.getDeclaredConstructor().newInstance();
        Object age = clazz.getMethod("getAge").invoke(o, null);
        System.out.println(age);
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

In the historical code above, a `class` file is first read and converted into a byte array through a file stream, and then `defineClass` is used to dynamically create and instantiate the class. A class defined in this way must still undergo the JVM's class file format checks, bytecode verification, and corresponding loading constraints; it does not bypass all security checks.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717145000710-f8f90243.png)

Older versions of `Unsafe` also provided the `defineAnonymousClass` method:

```java
public native Class<?> defineAnonymousClass(Class<?> hostClass, byte[] data, Object[] cpPatches);
```

This method could be used to dynamically create anonymous classes, but it was removed in JDK 17. `MethodHandles.Lookup.defineHiddenClass`, introduced in JDK 15, is the supported alternative. The exact implementation of Lambdas is a JDK implementation detail, and current versions can no longer be described as relying on the removed `Unsafe.defineAnonymousClass`.

#### Typical Use Cases

Historical versions of the JDK used `Unsafe.defineAnonymousClass` to support certain dynamic language implementations; current JDK versions use mechanisms such as hidden classes and no longer provide this `Unsafe` method.

### System Information

#### Introduction

This section contains two methods for obtaining system-related information.

```java
// Return the size of a system pointer. The return value is 4 (32-bit system) or 8 (64-bit system).
public native int addressSize();
// Size of a memory page; this value is a power of 2.
public native int pageSize();
```

#### Typical Use Cases

These two methods have relatively few use cases. In the `java.nio.Bits` class, when using `pageCount` to calculate the required number of memory pages, `pageSize` is called to obtain the size of a memory page. In addition, when using `copySwapMemory` to copy memory, `addressSize` is called to detect the 32-bit system case.

## Summary

In this article, we introduced the basic concepts, working principles, and some historical APIs of `Unsafe`. It should be noted that `sun.misc.Unsafe` is an unsupported internal API, and multiple methods have already been removed across different JDK versions. JDK 23 marked its memory-access methods for removal, and starting from JDK 24 a runtime warning is issued by default on the first invocation. New code should prefer standard APIs: use `VarHandle` for on-heap field and array access, the Foreign Function and Memory API (`MemorySegment`, etc.) for off-heap memory access, and `java.util.concurrent` for thread synchronization.
