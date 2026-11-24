---
title: Java Reflection Mechanism Explained
description: "An in-depth guide to Java's Reflection mechanism principles and applications: mastering the core APIs of Class, Method, and Field, understanding how reflection is used in frameworks like Spring and MyBatis, and learning how dynamic proxies are implemented."
category: Java
tag:
  - Java Fundamentals
lang: en
sourceRef: zh-ref/java/basis/reflection.md
head:
  - - meta
    - name: keywords
      content: Java reflection,reflection mechanism,Class class,Method,Field,dynamic proxy,framework internals,runtime manipulation
---

## What Is Reflection?

If you have studied the underlying principles of frameworks or written a framework yourself, you are definitely familiar with the concept of reflection.

The reason reflection is called the soul of frameworks is mainly because it gives us the ability to analyze classes and invoke methods inside classes at runtime.

Through reflection, we can inspect a class's fields, methods, constructors, and other metadata, and invoke methods or read/write fields where access controls and module boundaries permit. Different APIs also have different scopes: for example, `getMethods()` returns accessible `public` methods (including inherited ones), whereas `getDeclaredMethods()` returns all methods declared by the current class itself without including inherited methods.

## Do You Know the Use Cases of Reflection?

In day-to-day work, we spend most of our time writing business logic and rarely encounter scenarios where we need to invoke the reflection mechanism directly.

However, that does not mean reflection is useless. On the contrary, it is precisely because of reflection that you can use various frameworks so effortlessly. Frameworks like Spring/Spring Boot and MyBatis all make heavy use of reflection.

**These frameworks also make heavy use of dynamic proxies, and the implementation of dynamic proxies relies on reflection as well.**

For example, the sample code below implements a JDK dynamic proxy, in which the reflection class `Method` is used to invoke the target method.

```java
public class DebugInvocationHandler implements InvocationHandler {
    /**
     * The real target object in the proxy class
     */
    private final Object target;

    public DebugInvocationHandler(Object target) {
        this.target = target;
    }


    public Object invoke(Object proxy, Method method, Object[] args) throws InvocationTargetException, IllegalAccessException {
        System.out.println("before method " + method.getName());
        Object result = method.invoke(target, args);
        System.out.println("after method " + method.getName());
        return result;
    }
}

```

In addition, another powerful feature in Java—**annotations**—also relies on reflection for its implementation.

When using Spring, why does a single `@Component` annotation declare a class as a Spring Bean? Why does a `@Value` annotation allow you to read a value from a configuration file? How does all of that actually work?

It works because you can analyze classes via reflection and retrieve annotations placed on classes, fields, methods, or method parameters. Once you obtain an annotation, you can perform further processing based on it.

## Pros and Cons of the Reflection Mechanism

**Pros**: Makes our code much more flexible and makes it convenient for various frameworks to provide out-of-the-box functionality.

**Cons**: Giving us the ability to analyze and manipulate classes at runtime also introduces security concerns—for example, bypassing generic type safety checks (since generic parameter type checking happens at compile time). Additionally, reflection has slightly lower performance, though in practice the impact on frameworks is negligible. Related reading: [Java Reflection: Why is it so slow?](https://stackoverflow.com/questions/1392351/java-reflection-why-is-it-so-slow)

## Reflection in Action

### Four Ways to Obtain a Class Object

To dynamically retrieve class metadata, we rely on the `Class` object. A `Class` object exposes a class's methods, fields, and other information to the running program. Java provides four ways to obtain a `Class` object:

**1. When the concrete class is known at compile time, you can use a class literal:**

```java
Class alunbarClass = TargetObject.class;
```

This approach applies when the exact type is already known at compile time; accessing a class literal itself does not trigger class initialization.

**2. Passing the fully qualified class name via `Class.forName()`:**

```java
Class alunbarClass1 = Class.forName("cn.javaguide.TargetObject");
```

**3. Through an object instance via `instance.getClass()`:**

```java
TargetObject o = new TargetObject();
Class alunbarClass2 = o.getClass();
```

**4. Passing the class name through a class loader via `xxxClassLoader.loadClass()`:**

```java
ClassLoader.getSystemClassLoader().loadClass("cn.javaguide.TargetObject");
```

Obtaining a `Class` object via a `ClassLoader` does not initialize the class—meaning initialization steps are skipped, and static initializer blocks and static field initializers will not be executed.

### Basic Reflection Operations

1. Create a class `TargetObject` that we will manipulate using reflection.

```java
package cn.javaguide;

public class TargetObject {
    private String value;

    public TargetObject() {
        value = "JavaGuide";
    }

    public void publicMethod(String s) {
        System.out.println("I love " + s);
    }

    private void privateMethod() {
        System.out.println("value is " + value);
    }
}
```

2. Use reflection to inspect and manipulate the methods and fields of this class.

```java
package cn.javaguide;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class Main {
    public static void main(String[] args) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InstantiationException, InvocationTargetException, NoSuchFieldException {
        /**
         * Obtain the Class object of TargetObject and create an instance of TargetObject
         */
        Class<?> targetClass = Class.forName("cn.javaguide.TargetObject");
        TargetObject targetObject = (TargetObject) targetClass.getDeclaredConstructor().newInstance();
        /**
         * Retrieve all methods declared in TargetObject
         */
        Method[] methods = targetClass.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println(method.getName());
        }

        /**
         * Retrieve a specific method and invoke it
         */
        Method publicMethod = targetClass.getDeclaredMethod("publicMethod",
                String.class);

        publicMethod.invoke(targetObject, "JavaGuide");

        /**
         * Retrieve a specific field and modify its value
         */
        Field field = targetClass.getDeclaredField("value");
        // Disable access checks in order to modify the private field in the class
        field.setAccessible(true);
        field.set(targetObject, "JavaGuide");

        /**
         * Invoke the private method
         */
        Method privateMethod = targetClass.getDeclaredMethod("privateMethod");
        // Disable access checks in order to invoke the private method
        privateMethod.setAccessible(true);
        privateMethod.invoke(targetObject);
    }
}

```

Output:

```plain
publicMethod
privateMethod
I love JavaGuide
value is JavaGuide
```

**Note**: Some readers have mentioned that running the code above throws a `ClassNotFoundException`. The exact reason is that you did not replace the package name in the snippet below with the package where your own `TargetObject` class resides.
You can refer to this article: <https://www.cnblogs.com/chanshuyi/p/head_first_of_reflection.html>.

```java
Class<?> targetClass = Class.forName("cn.javaguide.TargetObject");
```
