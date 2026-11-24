---
title: Detailed Explanation of the Class Loading Process
description: Breaks down the stages and key details of JVM class loading to help you understand the exact behaviors of Verification, Preparation, Resolution, and Initialization.
category: Java
tag:
  - JVM
lang: en
sourceRef: zh-ref/java/jvm/class-loading-process.md
head:
  - - meta
    - name: keywords
      content: class loading,Loading,Verification,Preparation,Resolution,Initialization,clinit,Constant Pool
---

## Class Lifecycle

From the moment a class is loaded into virtual machine memory until it is unloaded from memory, its entire lifecycle can be summarized into 7 stages: Loading, Verification, Preparation, Resolution, Initialization, Using, and Unloading. Among them, Verification, Preparation, and Resolution are collectively referred to as Linking.

The sequence of these 7 stages is shown in the figure below:

![Complete lifecycle of a class](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/lifecycle-of-a-class-3bd4c6b2.png)

## The Class Loading Process

**A Class file must be loaded into the virtual machine before it can run and be used. How does the virtual machine load these Class files?**

The system loads Class-type files in three main steps: **Loading -> Linking -> Initialization**. The Linking process can be further divided into three steps: **Verification -> Preparation -> Resolution**.

![Class loading process](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-loading-procedure-a4b72893.png)

For more details, see [Java Virtual Machine Specification - 5.3. Creation and Loading](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-5.html#jvms-5.3 "Java Virtual Machine Specification - 5.3. Creation and Loading").

### Loading

The first step of the class loading process mainly accomplishes the following 3 tasks:

1. Obtain the binary byte stream defining this class using its fully qualified class name.
2. Convert the static storage structure represented by the byte stream into the runtime data structure of the Method Area.
3. Generate a `Class` object representing this class in memory to serve as the access entry point for these data structures in the Method Area.

The 3 points above in the JVM specification are deliberately not overly concrete, making them very flexible. For example, "obtain the binary byte stream defining this class using its fully qualified class name" does not specify exactly where to obtain it from (`ZIP`, `JAR`, `EAR`, `WAR`, network, runtime generation via dynamic proxy techniques, generation from other files such as `JSP`, etc.) or how to obtain it.

The Loading step is primarily performed by a **ClassLoader**, which we will discuss later. There are many kinds of ClassLoaders; when we want to load a class, which specific ClassLoader loads it is determined by the **Parent Delegation Model** (though we can also break the Parent Delegation Model).

> ClassLoaders and the Parent Delegation Model are also very important topics, which are covered in detail in the article [Detailed Explanation of ClassLoader](https://javaguide.cn/java/jvm/classloader.html "Detailed Explanation of ClassLoader"). While reading this article, it is enough to know that such mechanisms exist.

Every non-array class or interface is created by some ClassLoader. Array classes are not created via a `ClassLoader`, but are instead created automatically by the JVM when needed; the defining ClassLoader of a reference-type array is the same as the defining ClassLoader of its component type, whereas `getClassLoader()` on a primitive-type array returns `null`.

The Loading stage of a non-array class (the action of obtaining the binary byte stream of the class) offers strong controllability. Typically, you can extend `ClassLoader` and override `findClass()` to control how the byte stream is obtained, while preserving the Parent Delegation flow implemented by `loadClass()`; you only need to override `loadClass()` when you truly intend to change the delegation rules.

Parts of the Loading stage and the Linking stage (such as certain bytecode file format verification actions) interleave—before the Loading stage has completely finished, the Linking stage may already have begun.

### Verification

**Verification is the first step of the Linking stage. Its purpose is to ensure that the information contained in the byte stream of a Class file complies with all constraints of *The Java Virtual Machine Specification*, guaranteeing that executing this information as code will not compromise the security of the virtual machine itself.**

The Verification stage consumes relatively more resources across the entire class loading process, but it is essential because it effectively prevents the execution of malicious code. Program security always comes first.

HotSpot previously provided `-Xverify:none` and `-noverify` to disable most class verification, but doing so weakens bytecode security checks and should not be used as a general production optimization. Both options were deprecated in JDK 13, and modern JDKs may ignore or remove them.

The Verification stage mainly consists of four inspection phases:

1. File Format Verification (Class file format check)
2. Metadata Verification (Bytecode semantic check)
3. Bytecode Verification (Program semantic check)
4. Symbolic Reference Verification (Class correctness check)

![Illustration of the Verification stage](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-loading-process-verification-71298c86.png)

The File Format Verification phase operates directly on the class's binary byte stream. Its main purpose is to ensure that the input byte stream can be properly parsed and stored inside the Method Area, and that its format meets the requirements for describing a Java type. Aside from this phase, the remaining three verification phases operate on the storage structures in the Method Area and no longer directly read or manipulate the byte stream.

> The Method Area is a logical region within the JVM runtime data areas that is shared across all threads. When the virtual machine needs to use a class, it reads and parses the Class file to obtain relevant information, and then stores that information in the Method Area. The Method Area stores **class information, field information, method information, constants, static variables, JIT-compiled code caches, and other data** that have been loaded by the virtual machine.
>
> For a detailed introduction to the Method Area, we recommend reading [Detailed Explanation of Java Memory Areas](https://javaguide.cn/java/jvm/memory-area.html "Detailed Explanation of Java Memory Areas").

Symbolic Reference Verification occurs during the Resolution stage of class loading—specifically, when the JVM converts symbolic references into direct references (symbolic references and direct references are introduced in the Resolution section).

The main purpose of Symbolic Reference Verification is to ensure that the Resolution stage can execute normally. If Symbolic Reference Verification fails, the JVM throws an exception, such as:

- `java.lang.IllegalAccessError`: Thrown when a class attempts to access or modify a field it does not have permission to access, or invoke a method it does not have permission to call.
- `java.lang.NoSuchFieldError`: Thrown when a class attempts to access or modify a specified object field, and the object no longer contains that field.
- `java.lang.NoSuchMethodError`: Thrown when a class attempts to invoke a specified method, and that method does not exist.
- ...

### Preparation

**The Preparation stage formally allocates memory for class variables and sets their initial values**, and all such memory will be allocated in the Method Area. Note the following points regarding this stage:

1. Memory allocation at this time includes only class variables (static variables—variables modified with the `static` keyword, which belong only to the class and are therefore called class variables), and does not include instance variables. Instance variables are allocated on the Java Heap along with the object when the object is instantiated.
2. Conceptually, all memory used by class variables should be allocated in the **Method Area**. However, one detail to note is that prior to JDK 7, when HotSpot used PermGen (Permanent Generation) to implement the Method Area, the implementation matched this logical concept completely. Starting from JDK 7, HotSpot moved the String Constant Pool, static variables, and similar data originally placed in PermGen into the Heap; at that point, class variables are stored in the Java Heap together with the `Class` object. Related reading: [Understanding the Java Virtual Machine (3rd Edition) Errata #75](https://github.com/fenixsoft/jvm_book/issues/75 "Understanding the Java Virtual Machine (3rd Edition) Errata #75")
3. The initial value set here is usually the default zero value of the data type (such as `0`, `0L`, `null`, `false`, etc.). For example, if you define `public static int value=111`, `value` typically gets `0` during Preparation and is only assigned `111` during Initialization. A special case is when a field has a `ConstantValue` attribute, in which case it is directly assigned the value specified by that attribute during Preparation; compile-time constants such as `public static final int value=111` are typical examples, though not all `static final` fields carry a `ConstantValue` attribute.

**Zero values of primitive data types**: (Image from *Understanding the Java Virtual Machine*, 3rd Edition, Section 7.3.3)

![Zero values of primitive data types](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/.png-bbe42f86.png)

### Resolution

**The Resolution stage is the process by which the virtual machine dynamically determines concrete values from symbolic references in the Runtime Constant Pool.** The current specification involves symbolic references for classes or interfaces, fields, methods, interface methods, method types, method handles, dynamically-computed call sites, and dynamically-computed constants.

*Understanding the Java Virtual Machine* (3rd Edition, Section 7.3.4) explains Symbolic References and Direct References as follows:

![Symbolic references and direct references](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/symbol-reference-and-direct-reference-cc13b560.png)

For example, when a program invokes a method, the virtual machine must determine the actual method to call based on the method symbolic reference. HotSpot and other virtual machines may use method tables, entry addresses, or other internal structures to accelerate invocation, but these representations are implementation details rather than a fixed method-table offset mandated by *The Java Virtual Machine Specification*.

In summary, Resolution is the process by which the virtual machine determines concrete targets—such as classes, fields, methods, or dynamically-computed call sites—based on symbolic references in the Runtime Constant Pool; the internal representation of a direct reference is not necessarily a raw memory pointer or fixed offset.

### Initialization

**The Initialization stage executes the class or interface initialization method `<clinit>()` (if the compiler generated one). This is the final step of the class loading process.**

> Note: The compiler generates `<clinit>()` based on static field initialization expressions and static initialization blocks; if there is no class initialization code to execute, this method does not need to exist in the Class file.

The JVM synchronizes the initialization of a class or interface to ensure that only one thread executes its initialization method at any given time; this does not mean that the `<clinit>()` method itself carries a Java-level lock. Other threads may block while waiting for the class initialization to complete.

For the Initialization stage, the main active-use scenarios listed by the specification include:

1. Encountering any of the 4 bytecode instructions `new`, `getstatic`, `putstatic`, or `invokestatic`:
   - `new`: Creating an instance object of a class.
   - `getstatic`, `putstatic`: Reading or setting a static field of a type (except for static fields modified with `final` whose values have already been placed into the Constant Pool at compile time).
   - `invokestatic`: Invoking a static method of a class.
2. Making reflective calls on a class using methods from the `java.lang.reflect` package, such as `Class.forName("...")`, `newInstance()`, etc. If the class has not been initialized, its initialization must be triggered.
3. When initializing a class, if its superclass has not yet been initialized, trigger the initialization of the superclass first.
4. When the virtual machine starts up, the user specifies a main class to execute (the class containing the `main` method); the virtual machine initializes this class first.
5. Upon first invoking a `MethodHandle` whose resolved target is `REF_getStatic`, `REF_putStatic`, `REF_invokeStatic`, or `REF_newInvokeSpecial`, the class or interface declaring that target must be initialized.
6. **Supplement (from [issue745](https://github.com/Snailclimb/JavaGuide/issues/745 "issue745"))**: When an interface defines a default method introduced in JDK 8 (an interface method modified with the `default` keyword), if an implementation class of that interface is initialized, the interface must be initialized before it.

## Class Unloading

> The Class Unloading section was supplemented and improved from [issue#662](https://github.com/Snailclimb/JavaGuide/issues/662 "issue#662") by **[guang19](https://github.com/guang19 "guang19")**.

Class Unloading is the process by which the JVM reclaims the Method Area representation of a class or interface along with its associated resources. According to *The Java Language Specification*, a class or interface may be unloaded only if its defining ClassLoader can be garbage collected; classes or interfaces defined by the Bootstrap ClassLoader cannot be unloaded. In typical HotSpot applications, this usually happens with collectible custom ClassLoaders and the classes they define.

When determining whether a class may be unloaded in HotSpot, it can generally be understood through the following three conditions:

1. All instance objects of this class have been garbage collected—meaning no instance objects of this class exist on the Heap.
2. This class is not referenced anywhere else.
3. The instance of this class's ClassLoader has been garbage collected.

Meeting these conditions only indicates that the class is eligible to be unloaded; it does not guarantee that the JVM will unload it immediately or definitely. Classes created by the Bootstrap ClassLoader will not be unloaded, whereas classes created by custom ClassLoaders may be unloaded.

Normally, the JDK's built-in Bootstrap ClassLoader, Platform ClassLoader, and Application ClassLoader stay alive for the lifetime of the JVM; instances of custom ClassLoaders, however, can become unreachable, making the classes they define eligible for unloading. Since JDK 9, the original Extension ClassLoader has been replaced by the Platform ClassLoader.

**References**

- *Understanding the Java Virtual Machine*
- *Practical Java Virtual Machine*
- Chapter 5. Loading, Linking, and Initializing - Java Virtual Machine Specification: <https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-5.html#jvms-5.4>
