---
title: Java Keywords Summary
description: A systematic summary of commonly used Java keywords, detailing the usage and differences of final, static, this, super, volatile, transient, synchronized, and more to help Java developers master core syntax.
category: Java
tag:
  - Java Basics
lang: en
sourceRef: zh-ref/java/basis/java-keyword-summary.md
head:
  - - meta
    - name: keywords
      content: Java keywords,final keyword,static keyword,this keyword,super keyword,volatile,transient,synchronized
---

# Summary of `final`, `static`, `this`, and `super` Keywords

## The `final` Keyword

**The `final` keyword means "final" or "immutable"—it resists change and is used to modify classes, methods, and variables, with the following characteristics:**

1. A class modified by `final` cannot be inherited, and all member methods inside a `final` class are implicitly designated as `final` methods;

2. A method modified by `final` cannot be overridden;

3. A variable modified by `final` can only be assigned once. For a primitive data type variable, its value cannot be changed after initialization; for a reference type variable, once initialized, it cannot be reassigned to point to another object, though the referenced object itself may still be mutable. Only a `final` variable that satisfies the JLS "constant variable" conditions is a compile-time constant.

Note: There are two reasons for using `final` methods:

1. To lock the method and prevent any subclass from altering its meaning;
2. Efficiency. In earlier Java implementations, `final` methods were converted into inline calls. However, if a method is too large, no performance improvement from inlining may be seen (modern Java versions no longer need `final` methods for such optimizations).

## The `static` Keyword

**The `static` keyword has four main use cases:**

1. **Modifying member variables and member methods:** Members modified by `static` belong to the class rather than to any individual object of that class. They are shared across all objects of the class and can—and should—be accessed via the class name. The exact storage location of static variables is a JVM implementation detail; taking HotSpot in JDK 8 and later as an example, class metadata resides in Metaspace in native memory, while static class variables reside in the Java Heap. Calling syntax: `ClassName.staticVariableName` and `ClassName.staticMethodName()`
2. **Static code blocks:** Static code blocks are defined inside a class and outside any method. They execute before non-static code blocks (static code block —> non-static code block —> constructor). Regardless of how many objects are created from the class, the static code block executes only once.
3. **Static nested classes (when `static` modifies a class, it can only modify a nested class):** There is one major difference between a static nested class and a non-static inner class: after compilation, a non-static inner class implicitly holds a reference pointing to the outer class that created it, whereas a static nested class does not. Not having this reference means: 1. Its instantiation does not depend on creating an instance of the outer class. 2. It cannot access any non-`static` member variables or methods of the outer class.
4. **Static imports (used to import static resources from a class, a new feature since JDK 1.5):** The syntax is `import static`. Using these two keywords together lets you import specified static resources from a class so you can use its static member variables and methods directly without prefixing them with the class name.

## The `this` Keyword

The `this` keyword is used to refer to the current instance of a class. For example:

```java
class Manager {
    Employees[] employees;
    void manageEmployees() {
        int totalEmp = this.employees.length;
        System.out.println("Total employees: " + totalEmp);
        this.report();
    }
    void report() { }
}
```

In the example above, the `this` keyword is used in two places:

- `this.employees.length`: accesses the variable of the current instance of class `Manager`.
- `this.report()`: invokes the method of the current instance of class `Manager`.

This keyword is optional, meaning the example above behaves identically without it. However, using `this` can make code easier to read and understand.

## The `super` Keyword

The `super` keyword is used to access variables and methods of a superclass from a subclass. For example:

```java
public class Super {
    protected int number;
    protected void showNumber() {
        System.out.println("number = " + number);
    }
}
public class Sub extends Super {
    void bar() {
        super.number = 10;
        super.showNumber();
    }
}
```

In the example above, the `Sub` class accesses the superclass member variable `number` and invokes the `showNumber()` method of its superclass `Super`.

**Issues to note when using `this` and `super`:**

- When using `super()` in a constructor to call another constructor in the superclass, that statement must be the first line of the constructor; otherwise, the compiler reports an error. Likewise, when using `this(...)` to call another constructor in the same class, it must also be placed on the first line.
- `this` and `super` cannot be used inside `static` methods.

**A brief explanation:**

Members modified by `static` belong to the class, and there is no current instance in a static context, so `this` cannot be used. Nor is `super` an independent reference pointing to a "superclass object"; rather, it is a restricted syntactic form used to access superclass members or invoke superclass constructors, so it likewise cannot be used in a static context.

## References

- <https://www.codejava.net/java-core/the-java-language/java-keywords>
- <https://blog.csdn.net/u013393958/article/details/79881037>

# Detailed Guide to the `static` Keyword

## The Four Main Use Cases of the `static` Keyword

1. Modifying member variables and member methods
2. Static code blocks
3. Modifying classes (can only modify nested classes)
4. Static imports (used to import static resources from a class, a new feature since JDK 1.5)

### Modifying Member Variables and Member Methods (Commonly Used)

Members modified by `static` belong to the class rather than to any single object of the class. They are shared by all objects of the class and can—and are recommended to—be invoked via the class name. The exact storage location of static variables is a JVM implementation detail.

Like the Java Heap, the Method Area is a runtime data area shared across all threads. The JVM specification states that it stores per-class structural information, such as the runtime constant pool, field and method data, and the code for methods and constructors. The concrete storage layout is determined by the JVM implementation.

In HotSpot of JDK 7 and earlier, the Method Area was mainly implemented by the Permanent Generation (PermGen), though the Method Area and PermGen are not equivalent. JDK 8 removed PermGen: class metadata was moved to Metaspace in native memory, while string constants and class static variables reside in the Java Heap.

Calling syntax:

- `ClassName.staticVariableName`
- `ClassName.staticMethodName()`

If a variable or method is marked `private`, that property or method can only be accessed inside the class and cannot be accessed from outside the class.

Test example:

```java
public class StaticBean {
    String name;
    // static variable
    static int age;
    public StaticBean(String name) {
        this.name = name;
    }
    // static method
    static void sayHello() {
        System.out.println("Hello i am java");
    }
    @Override
    public String toString() {
        return "StaticBean{"+
                "name=" + name + ",age=" + age +
                "}";
    }
}
```

```java
public class StaticDemo {
    public static void main(String[] args) {
        StaticBean staticBean = new StaticBean("1");
        StaticBean staticBean2 = new StaticBean("2");
        StaticBean staticBean3 = new StaticBean("3");
        StaticBean staticBean4 = new StaticBean("4");
        StaticBean.age = 33;
        System.out.println(staticBean + " " + staticBean2 + " " + staticBean3 + " " + staticBean4);
        //StaticBean{name=1,age=33} StaticBean{name=2,age=33} StaticBean{name=3,age=33} StaticBean{name=4,age=33}
        StaticBean.sayHello();//Hello i am java
    }
}
```

### Static Code Blocks

Static code blocks are defined inside a class and outside methods. A static code block executes before non-static code blocks (static code block —> non-static code block —> constructor). No matter how many objects are created for that class, the static code block executes only once.

The syntax of a static code block is:

```plain
static {
// statements;
}
```

A class can contain multiple static code blocks placed anywhere outside any method body. Static code blocks execute during class initialization; if there are multiple blocks, the JVM executes them sequentially in the order they appear in the class, and each block runs only once. Class loading may occur earlier than initialization.

![Execution order of static code blocks](/media/jg/ext/oss.javaguide.cn/github/javaguide/88531075-cb28c446.jpg)

A static code block can assign values to static variables declared after it, but it cannot read/access them.

### Static Nested Classes

There is a major difference between static nested classes and non-static inner classes. As we know, after compilation, a non-static inner class implicitly retains a reference pointing to the outer class that created it, whereas a static nested class does not. Not having this reference means:

1. Its creation does not depend on creating the outer class.
2. It cannot use any non-`static` member variables or methods of the outer class.

Example (implementing the Singleton pattern using a static nested class):

```java
public class Singleton {
    // Declare as private to prevent creating objects via the default constructor
    private Singleton() {
    }
   // Declare as private so this static nested class can only be accessed inside Singleton
    private static class SingletonHolder {
        private static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getUniqueInstance() {
        return SingletonHolder.INSTANCE;
    }
}
```

When `getUniqueInstance()` is called and `SingletonHolder.INSTANCE` is actively used for the first time, `SingletonHolder` is initialized, which initializes `INSTANCE`. The JVM may load `SingletonHolder` earlier without executing its static initialization, and it guarantees that the class is initialized only once.

This approach not only provides the benefit of lazy initialization, but also relies on the JVM to guarantee thread safety.

### Static Imports

Syntax: `import static`

Using these two keywords together lets you import specified static resources from a class, and you can directly use the class's static member variables and methods without prefixing them with the class name.

```java
 // Import all static resources in Math so you can call its static methods directly without the class name
 // To import only a single static method, replace * with that method's name
import static java.lang.Math.*;// Change to import static java.lang.Math.max; to import only the static max method
public class Demo {
  public static void main(String[] args) {
    int max = max(1,2);
    System.out.println(max);
  }
}
```

## Additional Topics

### Static Methods vs. Non-Static Methods

Static methods belong to the class itself, while non-static methods belong to each object created from the class. If the operation performed by your method does not depend on individual instance variables or methods of its class, make it static (which reduces the program's memory footprint). Otherwise, it should be non-static.

Example:

```java
class Foo {
    int i;
    public Foo(int i) {
       this.i = i;
    }
    public static String method1() {
       return "An example string that doesn't depend on i (an instance variable)";
    }
    public int method2() {
       return this.i + 1;  //Depends on i
    }
}
```

You can invoke a static method like this: `Foo.method1()`. Attempting to invoke `method2` this way will fail. Instead, this works:

```java
Foo bar = new Foo(1);
bar.method2();
```

Summary:

- When calling a static method from outside, you can use either `"ClassName.methodName"` or `"objectName.methodName"`, whereas instance methods only support the latter form. In other words, calling a static method does not require creating an object.
- When accessing members of the same class, a static method is only allowed to access static members (i.e., static member variables and static methods) and cannot access instance member variables or instance methods; instance methods have no such restriction.

### `static{}` Static Code Blocks vs. `{}` Non-Static Code Blocks (Instance Initializer Blocks)

Similarities: Both can be defined multiple times within a class; multiple static blocks in the same class are incorporated into class initialization in textual order, and multiple instance initializer blocks are incorporated into instance initialization in textual order.

Differences: A static code block executes once during class initialization, and its trigger is not necessarily the first `new`; a non-static code block (instance initializer block) executes every time a new instance is initialized, and is incorporated into instance initialization together with instance field initializers in textual order. They run after the superclass constructor returns and before the remaining statements of the constructor execute; if a constructor delegates to another constructor in the same class via `this(...)`, this initialization process is performed by the constructor in the delegation chain that actually calls the superclass constructor. A bare block inside a normal method is merely a local block, not an instance initializer block.

> **🐛 Correction (see [issue #677](https://github.com/Snailclimb/JavaGuide/issues/677))**: A static code block may execute on the first `new` of an object, but not necessarily only on the first `new`. For instance, creating a `Class` object via `Class.forName("ClassDemo")` also executes the static code block—that is, either `new` or `Class.forName("ClassDemo")` triggers the static code block.
> Generally, if certain code—such as commonly used variables or objects in a project—must execute at project startup, a static code block should be used, as such code runs proactively. On the other hand, if we want to design methods that can be called without creating an object, such as in the `Arrays`, `Character`, or `String` classes, we use static methods. The difference between the two is that static code blocks execute automatically, whereas static methods execute only when called.

Example:

```java
public class Test {
    public Test() {
        System.out.print("Default constructor!--");
    }
    // Non-static code block
    {
        System.out.print("Non-static code block!--");
    }
    // Static code block
    static {
        System.out.print("Static code block!--");
    }
    private static void test() {
        System.out.print("Content in static method!--");
        {
            System.out.print("Code block in static method!--");
        }
    }
    public static void main(String[] args) {
        Test test = new Test();
        Test.test();//Static code block!--Content in static method!--Code block in static method!--
    }
}
```

Output of the code above:

```plain
Static code block!--Non-static code block!--Default constructor!--Content in static method!--Code block in static method!--
```

When executing only `Test.test();`, the output is:

```plain
Static code block!--Content in static method!--Code block in static method!--
```

When executing only `Test test = new Test();`, the output is:

```plain
Static code block!--Non-static code block!--Default constructor!--
```

The difference between a non-static code block and a constructor is: a non-static code block performs uniform initialization for all objects, whereas a constructor initializes the specific object—since a class can have multiple constructors, whichever constructor runs determines how the object is initialized, yet regardless of which object is created, the same constructor/initializer block always executes first. In other words, constructor code blocks define initialization logic shared across different objects.

### References

- <https://blog.csdn.net/chen13579867831/article/details/78995480>
- <https://www.cnblogs.com/chenssy/p/3388487.html>
- <https://www.cnblogs.com/Qian123/p/5713440.html>
