---
title: Java Basics Common Interview Questions Summary (Part 3)
description: "Summary of Java advanced feature interview questions: in-depth explanation of exception handling, generics principles, reflection applications, annotations, SPI mechanism, serialization, I/O stream models (BIO/NIO/AIO), syntactic sugar, and other core topics."
category: Java
tag:
  - Java Basics
head:
  - - meta
    - name: keywords
      content: Java exceptions,generics,reflection,annotations,SPI,serialization,IO streams,syntactic sugar,try-with-resources,BIO NIO AIO,Java interview questions
lang: en
sourceRef: zh-ref/java/basis/java-basic-questions-03.md
---

## Exceptions

**Overview of the Java Exception Class Hierarchy**:

![Java Exception Class Hierarchy Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/types-of-exceptions-in-java-3b100929.png)

### What Is the Difference Between Exception and Error?

In Java, all exceptions share a common ancestor: the `Throwable` class in the `java.lang` package. The `Throwable` class has two important subclasses:

- **`Exception`**: Exceptions that the program itself can handle and catch via `catch`. `Exception` can be further divided into Checked Exceptions (must be handled) and Unchecked Exceptions (do not have to be explicitly handled).
- **`Error`**: `Error` refers to serious problems that the program cannot normally handle; ~~we have no way to catch them with `catch`~~ it is not recommended to catch them with `catch`. Examples include Java Virtual Machine runtime errors (`Virtual MachineError`), out-of-memory errors (`OutOfMemoryError`), and class definition errors (`NoClassDefFoundError`). When these errors occur, the Java Virtual Machine (JVM) generally terminates the thread.

### Difference Between ClassNotFoundException and NoClassDefFoundError

- `ClassNotFoundException` is an `Exception` that occurs when a class cannot be found during dynamic loading (such as via reflection); it is foreseeable and can be caught and handled.
- `NoClassDefFoundError` is an `Error`, indicating that the JVM or a class loader attempted to load a class definition and could not find it. In addition to missing a JAR at runtime, it can also be triggered when a class fails static initialization and is subsequently used again. It usually terminates the current thread, though this does not necessarily mean the entire JVM cannot continue running.

### ⭐️ What Is the Difference Between Checked Exception and Unchecked Exception?

**Checked Exception** refers to checked exceptions. During Java compilation, if a checked exception is not handled with `catch` or declared with the `throws` keyword, the code will fail to compile.

For example, consider the following I/O operation code:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/checked-exception-0d2526e0.png)

Except for `RuntimeException` and its subclasses, all other `Exception` classes and their subclasses belong to checked exceptions. Common checked exceptions include I/O-related exceptions, `ClassNotFoundException`, `SQLException`, etc.

**Unchecked Exception** refers to **unchecked exceptions**. During Java compilation, the code can compile normally even if we do not explicitly handle unchecked exceptions.

`RuntimeException` and its subclasses belong to unchecked exceptions; from the perspective of the JLS classification, `Error` and its subclasses also belong to unchecked exceptions. Common `RuntimeException` classes include:

- `NullPointerException` (null pointer error)
- `IllegalArgumentException` (argument error, such as an invalid method parameter type)
- `NumberFormatException` (string-to-number format conversion error, a subclass of `IllegalArgumentException`)
- `ArrayIndexOutOfBoundsException` (array index out-of-bounds error)
- `ClassCastException` (type casting error)
- `ArithmeticException` (arithmetic error)
- `SecurityException` (security error, such as insufficient permissions)
- `UnsupportedOperationException` (unsupported operation error, such as repeatedly creating the same user)
- ...

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/unchecked-exception-3bbef05c.png)

### Do You Prefer Using Checked Exceptions or Unchecked Exceptions?

Use Unchecked Exceptions by default, and only use Checked Exceptions when necessary.

We can treat Unchecked Exceptions (such as `NullPointerException`) as code bugs. For bugs, the best approach is to let them surface so we can fix the code, rather than hiding them with `try-catch`.

Generally speaking, Checked Exceptions are only used in one scenario: when the exception is part of the business logic and the caller must handle it. For example, an insufficient balance exception. This is not a bug, but a normal business branch—we need a Checked Exception to force the caller to handle this situation, such as prompting the user to top up. This preserves the integrity of critical business logic while keeping the code as concise as possible.

### What Are the Commonly Used Methods of the Throwable Class?

- `String getMessage()`: Returns detailed information about the exception when it occurred
- `String toString()`: Returns a brief description of the exception when it occurred
- `String getLocalizedMessage()`: Returns localized information for the exception object. Subclasses of `Throwable` can override this method to generate localized messages. If a subclass does not override this method, it returns the same result as `getMessage()`
- `void printStackTrace()`: Prints the exception information encapsulated in the `Throwable` object to the console

### How Are `try-catch-finally` Used?

- `try` block: Used to catch exceptions. It can be followed by zero or more `catch` blocks; if there is no `catch` block, it must be followed by a `finally` block.
- `catch` block: Used to handle exceptions caught by `try`.
- `finally` block: Statements in the `finally` block will be executed regardless of whether an exception is caught or handled. When a `return` statement is encountered in the `try` block or `catch` block, the `finally` block will be executed before the method returns.

Code example:

```java
try {
    System.out.println("Try to do something");
    throw new RuntimeException("RuntimeException");
} catch (Exception e) {
    System.out.println("Catch Exception -> " + e.getMessage());
} finally {
    System.out.println("Finally");
}
```

Output:

```plain
Try to do something
Catch Exception -> RuntimeException
Finally
```

**Note: Do not use `return` inside a `finally` block!** When both the `try` statement and the `finally` statement contain a `return` statement, the `return` statement in the `try` block is ignored. This is because the return value from the `try` statement is first temporarily saved in a local variable, and once the `return` in the `finally` statement executes, the value of that local variable becomes the return value from the `finally` statement.

Code example:

```java
public static void main(String[] args) {
    System.out.println(f(2));
}

public static int f(int value) {
    try {
        return value * value;
    } finally {
        if (value == 2) {
            return 0;
        }
    }
}
```

Output:

```plain
0
```

### Is the Code in `finally` Always Executed?

Not necessarily! In certain situations, the code inside `finally` will not be executed.

For example, if the JVM is terminated before reaching `finally`, the code in `finally` will not be executed.

```java
try {
    System.out.println("Try to do something");
    throw new RuntimeException("RuntimeException");
} catch (Exception e) {
    System.out.println("Catch Exception -> " + e.getMessage());
    // Terminate the currently running Java Virtual Machine
    System.exit(1);
} finally {
    System.out.println("Finally");
}
```

Output:

```plain
Try to do something
Catch Exception -> RuntimeException
```

In addition, if the JVM process is forcefully terminated—for instance, by calling `Runtime.halt()`, the operating system killing the process directly, or a power outage on the machine—the `finally` block may also not get a chance to execute. An ordinary uncaught exception, even if it ultimately causes the current thread to terminate, will still execute `finally` before the thread terminates according to the language specification.

Related issue: <https://github.com/Snailclimb/JavaGuide/issues/190>.

🧗🏻 Go deeper: Analyze the underlying implementation mechanism of the `try catch finally` syntactic sugar from a bytecode perspective.

### How to Use `try-with-resources` Instead of `try-catch-finally`?

1. **Scope of application (definition of resources):** Any object that implements `java.lang.AutoCloseable` or `java.io.Closeable`
2. **Execution order of closing resources and the `finally` block:** In a `try-with-resources` statement, any `catch` or `finally` block runs after the declared resources have been closed

*Effective Java* explicitly states:

> Always prefer `try-with-resources` to `try-finally` when working with resources that must be closed. The resulting code is shorter and clearer, and the exceptions that it generates are more useful. The `try-with-resources` statement makes it easy to write correct code using resources that must be closed, which was practically impossible using `try-finally`.

Resources in Java such as `InputStream`, `OutputStream`, `Scanner`, and `PrintWriter` require us to call the `close()` method to close them manually. Normally, we implement this using a `try-catch-finally` statement, as shown below:

```java
// Read the contents of a text file
Scanner scanner = null;
try {
    scanner = new Scanner(new File("D://read.txt"));
    while (scanner.hasNext()) {
        System.out.println(scanner.nextLine());
    }
} catch (FileNotFoundException e) {
    e.printStackTrace();
} finally {
    if (scanner != null) {
        scanner.close();
    }
}
```

Refactoring the above code using the `try-with-resources` statement introduced in Java 7:

```java
try (Scanner scanner = new Scanner(new File("test.txt"))) {
    while (scanner.hasNext()) {
        System.out.println(scanner.nextLine());
    }
} catch (FileNotFoundException fnfe) {
    fnfe.printStackTrace();
}
```

Of course, when multiple resources need to be closed, implementing this with `try-with-resources` is also very simple, whereas still using `try-catch-finally` can introduce many issues.

By separating declarations with semicolons, you can declare multiple resources in a `try-with-resources` block.

```java
try (BufferedInputStream bin = new BufferedInputStream(new FileInputStream(new File("test.txt")));
     BufferedOutputStream bout = new BufferedOutputStream(new FileOutputStream(new File("out.txt")))) {
    int b;
    while ((b = bin.read()) != -1) {
        bout.write(b);
    }
}
catch (IOException e) {
    e.printStackTrace();
}
```

### ⭐️ What Precautions Should Be Taken When Using Exceptions?

- Do not define exceptions as static variables, because this will corrupt the exception stack trace. Every time we manually throw an exception, we must instantiate a new exception object with `new`.
- The thrown exception message must be meaningful.
- It is recommended to throw more specific exceptions; for example, when a string fails to convert into a number due to formatting issues, you should throw `NumberFormatException` rather than its parent class `IllegalArgumentException`.
- Avoid duplicate logging: if sufficient information (including the exception type, error message, stack trace, etc.) has already been logged where the exception is caught, you should not log the same error information again when rethrowing the exception in business code. Duplicate logging bloats log files and may mask the actual cause of the problem, making it harder to trace and resolve.
- ...

## Generics

### What Are Generics? What Are Their Benefits?

**Java Generics** is a new feature introduced in JDK 5. Using generic parameters enhances code readability and stability.

The compiler can type-check generic parameters, and generic parameters allow you to specify the type of objects passed in. For example, `ArrayList<Person> persons = new ArrayList<Person>()` specifies that this `ArrayList` object can only accept `Person` objects; passing in objects of other types will result in an error.

```java
ArrayList<E> extends AbstractList<E>
```

Furthermore, a raw `List` returns `Object`, requiring manual type casting before use, whereas with generics the compiler performs the cast automatically.

### What Are the Ways to Use Generics?

Generics generally have three usage forms: **generic classes**, **generic interfaces**, and **generic methods**.

**1. Generic Class**:

```java
// Here T can be written as any identifier; common parameter names such as T, E, K, and V are often used to represent generics
// When instantiating a generic class, the concrete type of T must be specified
public class Generic<T>{

    private T key;

    public Generic(T key) {
        this.key = key;
    }

    public T getKey(){
        return key;
    }
}
```

How to instantiate a generic class:

```java
Generic<Integer> genericInteger = new Generic<Integer>(123456);
```

**2. Generic Interface**:

```java
public interface Generator<T> {
    public T method();
}
```

Implementing a generic interface without specifying a type:

```java
class GeneratorImpl<T> implements Generator<T>{
    @Override
    public T method() {
        return null;
    }
}
```

Implementing a generic interface while specifying a type:

```java
class GeneratorImpl implements Generator<String> {
    @Override
    public String method() {
        return "hello";
    }
}
```

**3. Generic Method**:

```java
   public static < E > void printArray( E[] inputArray )
   {
         for ( E element : inputArray ){
            System.out.printf( "%s ", element );
         }
         System.out.println();
    }
```

Usage:

```java
// Create arrays of different types: Integer, Double, and Character
Integer[] intArray = { 1, 2, 3 };
String[] stringArray = { "Hello", "World" };
printArray( intArray  );
printArray( stringArray  );
```

> Note: `public static <E> void printArray(E[] inputArray)` is a static generic method. A static context has no current instance, so it cannot reference the type parameters declared by the class; this has nothing to do with "static methods being loaded first." A static method can declare and use its own type parameter `<E>`.

### Where Are Generics Used in Projects?

- A custom unified API response wrapper `CommonResult<T>` uses parameter `T` to dynamically specify the data type of the result based on the concrete return type
- Defining an `Excel` processing class `ExcelUtil<T>` to dynamically specify the data type for `Excel` export
- Building collection utility classes (refer to the `sort` and `binarySearch` methods in `Collections`).
- ...

## ⭐️ Reflection

For a detailed explanation of reflection, please read this article: [Java Reflection Mechanism Explained](https://javaguide.cn/java/basis/reflection.html).

### What Is Reflection?

Simply put, Java Reflection is the **ability to dynamically obtain class information and manipulate classes or objects (methods, fields) at runtime**.

Normally, the types in the code we write are already determined at compile time, so which method to call and which field to access are explicit. However, reflection allows us to inspect at **runtime** what methods and fields a class has and what its constructors look like, and—where access control and module boundaries permit—dynamically create objects, invoke methods, or modify fields.

It is precisely this ability to "introspect itself" and operate dynamically at runtime that makes reflection the **cornerstone of many general-purpose frameworks and libraries**. It makes code more flexible and capable of handling types that are unknown at compile time.

### What Are the Pros and Cons of Reflection?

**Pros:**

1. **Flexibility and Dynamism**: Reflection allows a program to dynamically load classes, create objects, invoke methods, and access fields at runtime, dynamically adapting and extending program behavior based on actual requirements (such as configuration files, user input, annotations, etc.). Many modern Java frameworks (such as Spring, Hibernate, and MyBatis) rely on this feature to implement core capabilities like Dependency Injection (DI), Aspect-Oriented Programming (AOP), Object-Relational Mapping (ORM), and annotation processing. It can be said that reflection is an indispensable foundation for framework development.
2. **Decoupling and Generality**: Through reflection, you can write more generic, reusable, and highly decoupled code, reducing dependencies between modules. For example, reflection can be used to implement generic object copying, serialization, Bean utilities, and more.

**Cons:**

1. **Performance Overhead**: Reflective operations are generally slower than direct code invocations because they involve dynamic type resolution, method lookup, and limited JIT compiler optimizations. However, for most framework scenarios, this performance penalty is usually acceptable, or the framework itself performs caching optimizations.
2. **Security Issues**: When conditions such as access checks and module opening rules are satisfied, reflection can suppress some Java language access checks (such as accessing `private` fields and methods), potentially breaking encapsulation. In addition, reflection may bypass compile-time generic checks, introducing type-safety hazards. From Java 9 onward, module boundaries may reject such deep reflective access and throw `InaccessibleObjectException`.
3. **Code Readability and Maintainability**: Excessive use of reflection makes code complex, hard to understand, and difficult to debug. Errors typically surface only at runtime rather than being easily detected at compile time.

Further reading: [Java Reflection: Why is it so slow?](https://stackoverflow.com/questions/1392351/java-reflection-why-is-it-so-slow).

### What Are the Use Cases of Reflection?

When writing business code day to day, we rarely deal directly with Java Reflection. Yet you may not realize that you benefit from reflection every single day! **Many popular frameworks, such as Spring/Spring Boot and MyBatis, rely heavily on reflection under the hood**, which is what makes them so flexible and powerful.

Below are a few of the most common use cases to help you understand.

**1. Dependency Injection and Inversion of Control (IoC)**

IoC frameworks represented by Spring/Spring Boot scan classes carrying specific annotations (such as `@Component`, `@Service`, `@Repository`, `@Controller`) at startup, use reflection to instantiate objects (Beans), and inject dependencies via reflection (such as `@Autowired`, constructor injection, etc.).

**2. Annotation Processing**

An annotation itself is merely a "marker"—something has to read that marker to know what to do. Reflection is that "reader." Frameworks use reflection to check whether classes, methods, or fields carry specific annotations, and then execute corresponding logic based on the annotation metadata. For instance, upon encountering `@Value`, the framework uses reflection to read the annotation content, looks up the matching value in the configuration file, and then uses reflection to set that value on the field.

**3. Dynamic Proxy and AOP**

Want to automatically add extra behavior before and after calling a method (such as logging, starting a transaction, or checking permissions)? That is what AOP (Aspect-Oriented Programming) does, and dynamic proxy is a common way to implement AOP. The JDK's built-in dynamic proxy (`Proxy` and `InvocationHandler`) relies on reflection. When the proxy object invokes the real object's method internally, it does so via reflection's `Method.invoke`.

```java
public class DebugInvocationHandler implements InvocationHandler {
    private final Object target; // Real target object

    public DebugInvocationHandler(Object target) { this.target = target; }

    // proxy: proxy object, method: invoked method, args: method arguments
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("切面逻辑：调用方法 " + method.getName() + " 之前");
        // Invoke the method of the same name on the real object via reflection
        Object result = method.invoke(target, args);
        System.out.println("切面逻辑：调用方法 " + method.getName() + " 之后");
        return result;
    }
}
```

**4. Object-Relational Mapping (ORM)**

Frameworks such as MyBatis and Hibernate can automatically turn rows queried from a database into Java objects. How do they know which database column corresponds to which Java field? Once again, via reflection. They use reflection to retrieve the list of fields on a Java class, map the query results by name or configuration, and then use reflection to invoke setters or modify field values directly. Conversely, when saving an object to a database, they also use reflection to read field values to assemble SQL statements.

## Proxy

For a detailed introduction to Java proxies, you can read the author's article [Java Proxy Pattern Explained](https://javaguide.cn/java/basis/proxy.html).

### How Is Dynamic Proxy Implemented?

Dynamic proxy is a very powerful design pattern that allows us to perform **feature enhancement** on the methods of a class or object **without modifying the source code**.

In Java, there are two mainstream ways to implement dynamic proxies: **JDK Dynamic Proxy** and **CGLIB Dynamic Proxy**.

**First: JDK Dynamic Proxy**

Provided officially by Java, its core requirement is that the target class must implement one or more interfaces. At runtime, JDK Dynamic Proxy uses the `Proxy.newProxyInstance()` method to dynamically create an instance of a proxy class that implements these interfaces. This proxy class is generated in memory—you cannot see its `.java` or `.class` file.

Whenever you call any method on the proxy object, that call is forwarded to the `invoke` method of an `InvocationHandler` interface that we provide. Inside the `invoke` method, we can add our own enhancement logic before or after calling the original method (the target method).

**Second: CGLIB Dynamic Proxy**

CGLIB is a third-party code generation library. Its principle is completely different from JDK's: it does not require the proxied class to implement an interface. At runtime, it dynamically generates a subclass of the target class as the proxy class (via ASM bytecode manipulation). It then overrides all non-`final`, non-`private`, and non-`static` methods in the parent class (i.e., the proxied class).

Whenever you call any method on the proxy object, that call is intercepted by the `intercept` method of CGLIB's `MethodInterceptor` interface. Just like `InvocationHandler`'s `invoke` method, we can add our enhancement logic inside `intercept` before or after invoking the original superclass method.

### What Is the Difference Between Static Proxy and Dynamic Proxy?

The core differences between static proxy and dynamic proxy lie in **when the proxy relationship is determined, implementation flexibility, and maintenance cost**.

| Comparison Dimension | Static Proxy | Dynamic Proxy |
| --- | --- | --- |
| When Proxy Relationship Is Determined | Compile time (generates fixed `.class` bytecode files after compilation) | Runtime (dynamically generates proxy class bytecode and loads it into the JVM) |
| Implementation Approach | Manually write proxy classes before compilation, often delegating calls to the target object via composition | No need to manually write concrete proxy classes; encapsulate enhancement logic via `Handler`/`Interceptor` |
| Interface Dependency | Not strictly required; interface-based static proxies usually have the proxy class and target class follow the same interface | JDK Dynamic Proxy targets interfaces; subclass-based proxies like CGLIB target inheritable implementation classes |
| Code Volume & Maintainability | High code volume (more target classes mean more proxy classes), high maintenance cost; when an interface adds methods, target and proxy classes must be updated in sync | Very little code (generic enhancement logic can be reused), good maintainability; decoupled from interfaces so interface changes do not affect proxy logic |
| Core Advantage | Simple to implement, straightforward logic, no extra framework dependencies | Strong flexibility, high reusability, reduces repetitive coding, adapts to complex scenarios |
| Typical Use Cases | Simple Decorator pattern, enhancement needs for a small number of fixed classes | Spring AOP, RPC frameworks (such as Dubbo), ORM frameworks |

### ⭐️ What Is the Difference Between JDK Dynamic Proxy and CGLIB Dynamic Proxy?

1. JDK Dynamic Proxy is official and requires the proxied class to implement an interface. Its principle is to dynamically generate an implementation class of the interface as the proxy. CGLIB is third-party and does not require an interface. Its principle is to dynamically generate a subclass of the proxied class as the proxy. Precisely because it uses inheritance, it cannot proxy `final` classes, and the proxied methods cannot be `final` or `private`.
2. Regarding the efficiency of the two, JDK Dynamic Proxy performs better in most situations, and with newer JDK versions, this advantage becomes even more evident.

### ⭐️ Describe Practical Use Cases of Dynamic Proxy in Frameworks

The most classic use case of dynamic proxy is **Spring AOP**.

AOP (Aspect-Oriented Programming) can encapsulate logic or responsibilities that are unrelated to business logic yet commonly invoked across business modules (such as transaction processing, log management, permission control, etc.), making it easier to reduce duplicate system code, lower coupling between modules, and improve future extensibility and maintainability.

Spring AOP is based on dynamic proxies. If the object to be proxied implements an interface, Spring AOP uses **JDK Proxy** to create the proxy object; for objects that do not implement an interface, JDK Proxy cannot be used, so Spring AOP uses **CGLIB** to generate a subclass of the proxied object as the proxy, as shown in the figure below:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/230ae587a322d6e4d09510161987d346-1e9492d2.jpg)

## Annotations

### What Is an Annotation?

`Annotation` is a new feature introduced starting in Java 5. It can be viewed as a special kind of comment, mainly used to decorate classes, methods, or variables, providing certain information for programs to use at compile time or runtime.

An annotation is essentially a special interface that extends `Annotation`:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface Override {

}

public interface Override extends Annotation{

}
```

The JDK provides many built-in annotations (such as `@Override` and `@Deprecated`), and at the same time, we can also define custom annotations.

### What Are the Ways to Parse Annotations?

Annotations only take effect after being parsed. There are two common parsing approaches:

- **Direct scanning at compile time**: The compiler scans and processes the corresponding annotations while compiling Java code. For example, when a method uses the `@Override` annotation, the compiler checks during compilation whether the current method overrides the corresponding method in the parent class.
- **Processing via reflection at runtime**: Built-in annotations in frameworks (such as Spring's `@Value` and `@Component`) are processed through reflection.

## ⭐️ SPI

For a detailed explanation of SPI, please read this article: [Java SPI Mechanism Explained](https://javaguide.cn/java/basis/spi.html).

### What Is SPI?

SPI stands for Service Provider Interface—literally "the interface of the service provider." In my understanding, it is an interface specifically provided for service providers or developers who extend framework functionality.

SPI separates the service interface from concrete service implementations, decoupling the service caller from the service implementer and improving program extensibility and maintainability. Modifying or replacing a service implementation does not require modifying the caller.

Many frameworks use Java's SPI mechanism, such as the Spring framework, database driver loading, logging interfaces, Dubbo extension implementations, and so on.

<img src="/media/jg/ext/oss.javaguide.cn/java/basis/spi/22e1830e0b0e4115a882751f6c417857tplv-k3u1fbpfcp--cf39285f.jpg" style="zoom:50%;" />

### What Is the Difference Between SPI and API?

**So what is the difference between SPI and API?**

Speaking of SPI, we must mention API (Application Programming Interface). Broadly speaking, both belong to interfaces and are easily confused. Let's first illustrate this with a diagram:

![SPI VS API](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/spi-vs-api-b7a94519.png)

Generally, modules communicate with one another via interfaces, so we introduce an "interface" between the service caller and the service implementer (also called the service provider).

- When the implementer provides both the interface and the implementation, and we obtain the capabilities provided by the implementer by calling its interface, this is an **API**. In this case, both the interface and the implementation reside in the implementer's package. The caller invokes the implementer's functionality through the interface without needing to care about the concrete implementation details.
- When the interface exists on the caller's side, this is an **SPI**. The interface caller defines the interface rules, and then different vendors implement this interface according to those rules to provide services.

To give a plain and easy-to-understand example: Company H is a tech company that has designed a new chip and now needs mass production, and there are several chip manufacturing companies on the market. At this point, as long as Company H specifies the production standard for this chip (defines the interface standard), these partner chip manufacturers (service providers) deliver their own distinctive chips according to the standard (providing implementations with different approaches, yet producing the same result).

### What Are the Pros and Cons of SPI?

The SPI mechanism can greatly enhance the flexibility of interface design, but the SPI mechanism also has some drawbacks, such as:

- `ServiceLoader` locates and instantiates providers on demand; if the caller iterates through all providers in order to select an implementation, it will trigger the loading of all available providers.
- A single `ServiceLoader` instance does not guarantee multi-thread safety; there is no rule between different instances that "calling `load` concurrently will inevitably conflict."

## ⭐️ Serialization and Deserialization

For a detailed explanation of serialization and deserialization, please read [Java Serialization Explained](https://javaguide.cn/java/basis/serialization.html), where the topics and interview questions covered are more comprehensive.

### What Is Serialization? What Is Deserialization?

If we need to persist Java objects—such as saving Java objects in files—or transmit Java objects over a network, these scenarios all require serialization.

Simply put:

- **Serialization**: Converting a data structure or object into a form that can be stored or transmitted, usually a binary byte stream, or text formats such as JSON or XML
- **Deserialization**: The process of converting the data generated during serialization back into the original data structure or object

For an object-oriented programming language like Java, what we serialize are objects—namely instantiated classes. However, in a semi-object-oriented language like C++, `struct` defines a data structure type, whereas `class` corresponds to an object type.

Below are common application scenarios for serialization and deserialization:

- Before an object is transmitted over a network (such as during Remote Procedure Calls, RPC), it must first be serialized; after receiving the serialized object, it must be deserialized;
- Before storing an object into a file, serialization is required; when reading the object out from the file, deserialization is required;
- Before storing an object into a database (such as Redis), serialization is needed; when reading the object out from a cache database, deserialization is needed;
- When converting an object into a byte representation that needs long-term storage or cross-component transfer, serialization is typically required; ordinary Java objects used inside JVM memory do not need serialization.

Wikipedia describes serialization as follows:

> In computing, **serialization** is the process of translating a data structure or object state into a format that can be stored (e.g. in a file or memory data buffer) or transmitted (e.g. over a computer network) and reconstructed later (possibly in a different computer environment). When the resulting series of bits is reread according to the serialization format, it can be used to create a semantically identical clone of the original object. For many objects, such as complex objects that make extensive use of references, this reconstruction process is not easy. Object serialization in object-oriented programming does not encompass the methods originally associated with the object. This process is also known as marshalling. The reverse operation of extracting a data structure from a series of bytes is deserialization (also known as unmarshalling).

In summary: **The main purpose of serialization is to convert objects into a representation suitable for network transmission or persistence to file systems, databases, caches, and other storage media.**

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/a478c74d-2c48-40ae-9374-87aacf05188c-92692fb2.png)

<p style="text-align:right;font-size:13px;color:gray">https://www.corejavaguru.com/java/serialization/interview-questions-1</p>

**Which layer of the TCP/IP 4-layer model does a serialization protocol correspond to?**

We know that both parties in network communication must adopt and follow the same protocol. The TCP/IP 4-layer model is as follows—which layer does a serialization protocol belong to?

1. Application Layer
2. Transport Layer
3. Network Layer
4. Network Interface Layer

![TCP/IP Four-Layer Model](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

As shown in the figure above, in the OSI 7-layer protocol model, what the Presentation Layer does is primarily process the Application Layer's user data and convert it into a binary stream. Conversely, it converts the binary stream into user data for the Application Layer. Doesn't that correspond to serialization and deserialization?

Because the Application Layer, Presentation Layer, and Session Layer in the OSI 7-layer protocol model all correspond to the Application Layer in the TCP/IP 4-layer model, serialization protocols belong to part of the Application Layer of the TCP/IP protocol suite.

### What If Certain Fields Should Not Be Serialized?

For variables that should not be serialized, modify them with the `transient` keyword.

The role of the `transient` keyword is to prevent variables in an instance modified with this keyword from being serialized; when the object is deserialized, the values of variables modified with `transient` will not be persisted and restored.

A few points to note about `transient`:

- `transient` can only modify variables, not classes or methods.
- A variable modified with `transient` will be set to the default value of its type after deserialization. For example, if it modifies an `int` type, the result after deserialization will be `0`.
- Because `static` variables do not belong to any object (`Object`), they will not be serialized regardless of whether they are modified with the `transient` keyword.

### What Are the Common Serialization Protocols?

The JDK's built-in serialization mechanism is generally not used because its serialization efficiency is low and it has security issues. More commonly used serialization protocols include Hessian, Kryo, Protobuf, and ProtoStuff, which are binary-based serialization protocols.

Formats like JSON and XML are text-based serialization approaches. Although their readability is relatively good, their performance is poor, so they are generally not chosen.

### Why Is JDK Built-in Serialization Not Recommended?

We rarely or almost never use the JDK's built-in serialization directly, mainly for the following reasons:

- **Lack of cross-language support**: If calling services developed in other languages, it is not supported.
- **Poor performance**: Compared with other serialization frameworks, its performance is lower, mainly because the serialized byte array is relatively large, increasing transmission costs.
- **Security issues**: Serialization and deserialization themselves have no issues. However, when the incoming data to be deserialized can be controlled by a user, an attacker can craft malicious input so that deserialization produces unexpected objects and executes crafted arbitrary code in the process. Further reading: [Application Security: The Tragedy of Java Deserialization Vulnerabilities](https://cryin.github.io/blog/secure-development-java-deserialization-vulnerability/).

## I/O

For a detailed explanation of I/O, please refer to the following articles, which cover the topics and interview questions more thoroughly.

- [Java I/O Fundamentals Summary](https://javaguide.cn/java/io/io-basis.html)
- [Java I/O Design Patterns Summary](https://javaguide.cn/java/io/io-design-patterns.html)
- [Java I/O Models Explained](https://javaguide.cn/java/io/io-model.html)

### Are You Familiar with Java I/O Streams?

I/O stands for `Input/Output`—input and output. The process of inputting data into computer memory is input, whereas outputting to external storage (such as databases, files, or remote hosts) is output. The data transfer process resembles flowing water, hence it is called an I/O stream. I/O streams in Java are divided into input streams and output streams, and according to how data is processed, they are further divided into byte streams and character streams.

The more than 40 classes of Java I/O streams are all derived from the following 4 abstract base classes:

- `InputStream`/`Reader`: The base classes for all input streams; the former is a byte input stream, and the latter is a character input stream.
- `OutputStream`/`Writer`: The base classes for all output streams; the former is a byte output stream, and the latter is a character output stream.

### Why Are I/O Streams Divided into Byte Streams and Character Streams?

What the question essentially asks is: **Whether reading/writing files or sending/receiving over a network, the smallest storage unit of information is always the byte, so why are I/O stream operations divided into byte stream operations and character stream operations?**

Personally, I think there are two main reasons:

- Character streams are obtained by the Java Virtual Machine converting bytes, and this process is relatively time-consuming;
- If we do not know the encoding type, garbled text issues can easily occur when using byte streams.

### What Design Patterns Are Used in Java I/O?

Reference answer: [Java I/O Design Patterns Summary](https://javaguide.cn/java/io/io-design-patterns.html)

### ⭐️ Differences Between BIO, NIO, and AIO?

Reference answer: [Java I/O Models Explained](https://javaguide.cn/java/io/io-model.html)

## Syntactic Sugar

### What Is Syntactic Sugar?

**Syntactic sugar** refers to a special syntax designed by a programming language to facilitate developer programming; this syntax has no impact on the functionality of the programming language. To achieve the same functionality, code written based on syntactic sugar is often simpler, more concise, and easier to read.

For example, `for-each` in Java is a commonly used syntactic sugar whose underlying principle is actually based on a normal `for` loop and an iterator.

```java
String[] strs = {"JavaGuide", "公众号：JavaGuide", "博客：https://javaguide.cn/"};
for (String s : strs) {
    System.out.println(s);
}
```

However, the JVM actually cannot recognize syntactic sugar. For Java syntactic sugar to execute properly, it must first be desugared by the compiler—that is, converted into basic syntax that the JVM understands during the compilation phase. This also indirectly shows that what truly supports syntactic sugar in Java is the Java compiler rather than the JVM. If you inspect the source code of `com.sun.tools.javac.main.JavaCompiler`, you will find a step in `compile()` that calls `desugar()`, which is the method responsible for implementing desugaring.

### What Are the Common Syntactic Sugars in Java?

The most commonly used syntactic sugars in Java mainly include generics, autoboxing/unboxing, variable-length arguments, enums, inner classes, enhanced `for` loops, `try-with-resources` syntax, lambda expressions, and so on.

For a detailed explanation of these syntactic sugars, please read [Detailed Guide to Java Syntactic Sugar](./syntactic-sugar.md).
