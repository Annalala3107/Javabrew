---
title: Generics & Wildcards Explained
description: "A comprehensive analysis of Java Generics and wildcards: deeply understand the type erasure mechanism, upper and lower bounded wildcard usage, and the PECS principle to master generic programming techniques."
category: Java
tag:
  - Java Basics
lang: en
sourceRef: zh-ref/java/basis/generics-and-wildcards.md
head:
  - - meta
    - name: keywords
      content: Java generics,wildcards,type erasure,generic bounds,PECS principle,generic methods,upper and lower bounded wildcards,generic interfaces
---

## Generics

### What are Generics? What are they used for?

**Java Generics** is a new feature introduced in JDK 5. Using generic parameters improves code readability and stability. **Unless otherwise specified, the following behaviors are based on Java 8.**

The compiler can check generic parameters, and generic parameters allow you to specify the type of objects passed in. For example, `ArrayList<Person> persons = new ArrayList<Person>()` specifies that this `ArrayList` can only accept objects of type `Person`; passing any other type will cause an error (starting from JDK 7, you can write `new ArrayList<>()`, letting the compiler infer the type arguments).

```java
ArrayList<E> extends AbstractList<E>
```

Moreover, a raw `List` returns `Object`, requiring manual type casting before use, whereas with generics the compiler handles the cast automatically.

### What are the ways to use Generics?

Generics are generally used in three ways: **generic classes**, **generic interfaces**, and **generic methods**.

**1. Generic Classes**:

```java
// Here T can be written as any identifier; common parameter names like T, E, K, V are often used to represent generics
// When instantiating a generic class, the concrete type for T must be specified
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
// Starting from JDK 7, you can write: new Generic<>(123456)
```

**2. Generic Interfaces**:

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

Implementing a generic interface with a specified type:

```java
class GeneratorImpl implements Generator<String> {
    @Override
    public String method() {
        return "hello";
    }
}
```

**3. Generic Methods**:

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

### Where have you used Generics in your projects?

- Custom universal API response wrapper `CommonResult<T>`, where the parameter `T` dynamically specifies the data type of the returned result based on the concrete return type
- Defining an `Excel` processing class `ExcelUtil<T>` to dynamically specify the data type for `Excel` exports
- Building collection utility classes (refer to `sort` and `binarySearch` in `Collections`).
- ……

### What is the Type Erasure mechanism in Generics? Why erase types?

**Java generics are implemented via type erasure: generic instances do not retain concrete type arguments at runtime, though class files can still preserve generic declaration metadata in attributes such as `Signature`, which can be read via the Reflection API.**

During compilation, the compiler dynamically erases generic `T` to `Object`, or erases `T extends xxx` to its bounding type `xxx`.

Type erasure allows generic code to remain compatible with Java libraries and binary code written before generics were introduced. The compiler inserts necessary type casts and bridge methods to maintain type safety and polymorphic semantics.

That description might sound a bit abstract, so let me give an example:

```java
List<Integer> list = new ArrayList<>();

list.add(12);
// 1. Adding directly at compile time causes an error
list.add("a");
Class<? extends List> clazz = list.getClass();
Method add = clazz.getDeclaredMethod("add", Object.class);
// 2. Adding via reflection at runtime succeeds
add.invoke(list, "kl");

System.out.println(list)
```

Let's look at another example: because of type erasure, the following method overloading causes a compile error.

```java
public void print(List<String> list)  { }
public void print(List<Integer> list) { }
```

![Type erasure issue in generics](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/generics-runtime-erasure-1383a1a3.png)

The reason is very simple: after type erasure, both `List<String>` and `List<Integer>` compile to `List`.

**If the compiler erases generics anyway, why use generics at all? Wouldn't using `Object` suffice?**

This question is really asking about the benefits of generics in disguise:

- Using generics enables compile-time type checking.

- Using `Object` requires manual explicit casts, reducing code readability and increasing the probability of errors.

- Generics allow self-bounded types such as `T extends Comparable`.

### What is a Bridge Method?

A bridge method (`Bridge Method`) is used to preserve polymorphism when inheriting from a generic class.

```java
class Node<T> {
    public T data;
    public Node(T data) { this.data = data; }
    public void setData(T data) {
        System.out.println("Node.setData");
        this.data = data;
    }
}

class MyNode extends Node<Integer> {
    public MyNode(Integer data) { super(data); }

  	// After type erasure, Node<T> has setData(Object data), which MyNode does not override, so the compiler inserts this bridge method to preserve polymorphism
   	public void setData(Object data) {
        setData((Integer) data);
    }

    public void setData(Integer data) {
        System.out.println("MyNode.setData");
        super.setData(data);
    }
}
```

⚠️**Note**: Bridge methods are automatically generated by the compiler, not hand-written.

### What are the limitations of Generics? Why?

The limitations of generics are generally caused by the type erasure mechanism. Once erased to `Object`, runtime type inspection is impossible.

- You can declare a variable of type `T`, but you cannot directly instantiate a type parameter with `new T()`.
- Generic type arguments cannot be primitive types. Because primitive types are not subclasses of `Object`, their corresponding wrapper reference types must be used instead.
- You cannot instantiate an array of a generic type parameter. After erasure to `Object`, type checking cannot be performed.
- You cannot instantiate generic arrays.
- Generics cannot use `instanceof` to check a type parameter `T` at runtime; `getClass()` also cannot distinguish between different generic type arguments after erasure (e.g., both `List<String>` and `List<Integer>` yield `List.class`).
- A class cannot implement the same generic interface with two different type arguments, because after erasure the bridge methods for the multiple superinterfaces would conflict.
- A class's `static` context cannot reference type parameters declared by that class, though a static generic method can declare and use its own type parameters.
- ……

### Can the following code compile, and why?

```java
public final class Algorithm {
    public static <T> T max(T x, T y) {
        return x > y ? x : y;
    }
}
```

It cannot compile, because both `x` and `y` are erased to `Object`, and `Object` cannot be compared using `>`.

```java
public class Singleton<T> {

    public static T getInstance() {
        if (instance == null)
            instance = new Singleton<T>();

        return instance;
    }

    private static T instance = null;
}
```

It cannot compile, because static fields and static methods of a class cannot reference the type parameter `T` declared by the class. A static method can declare its own type parameter, for example `public static <T> T getInstance()`.

## Wildcards

### What are Wildcards? What are they used for?

Generic types are invariant (fixed), making them somewhat inflexible in certain scenarios—that's where wildcards come in! Wildcards allow type arguments to vary, solving the problem that generics are not covariant.

For example:

```java
// Restrict type to subclasses of Person
<? extends Person>
// Restrict type to superclasses of Manager
<? super Manager>
```

### What is the difference between the wildcard `?` and the commonly used generic `T`?

- `T` can be used to declare variables or constants, whereas `?` cannot.
- `T` is typically used to declare generic classes or methods, while the wildcard `?` is typically used in call-site code and formal parameters of generic methods.
- `T` is erased at compile time to its bounding type or `Object`. Inside a method, the wildcard `?` is "captured" by the compiler as a specific but unknown type (wildcard capture); therefore you cannot insert any element other than `null` into a `List<?>`, though it can be paired with a generic helper method.

### What is an Unbounded Wildcard?

An unbounded wildcard can accept any generic type and is used to implement simple methods that do not depend on a specific type parameter; it can capture the parameter type and delegate processing to a generic method.

```java
void testMethod(Person<?> p) {
  // Handled by a generic method
}
```

**Is there a difference between `List<?>` and `List`?** Definitely yes!

- `List<?> list` means the element type of `list` is **some unknown yet fixed type** (i.e., "there exists some type `T` such that `list` is `List<T>`"), so the compiler prohibits adding any element other than `null` to prevent type unsafety.
- `List list` is a raw type that bypasses part of generic type checking and is not equivalent to `List<Object>`. Adding elements to it usually produces an unchecked warning and may defer type errors until runtime.

```java
List<?> list = new ArrayList<>();
list.add("sss");// Compile error
List list2 = new ArrayList<>();
list2.add("sss");// Warning message
```

### What is an Upper Bounded Wildcard? What is a Lower Bounded Wildcard?

When using generics, we can also constrain the upper or lower bounds of the passed generic type arguments, such as: **allowing only a supertype of a certain type or a subtype of a certain type as the type argument**.

**Upper bounded wildcard `extends`** means the type argument must be the specified type or one of its subtypes.

For example:

```java
// Restrict to subclasses of Person
<? extends Person>
```

Multiple type bounds can be specified, and they can also constrain type parameter `T`.

```java
<T extends T1 & T2>
<T extends XXX>
```

**Lower bounded wildcard `super`** means the type argument must be the specified type or one of its supertypes.

For example:

```java
// Restrict to superclasses of Employee
List<? super Employee>
```

**What is the difference between `? extends xxx` and `? super xxx`?**

They accept different ranges of type arguments. For `List<? extends Xxx>`, elements can be read as `Xxx`, but nothing other than `null` can be safely written; for `List<? super Xxx>`, `Xxx` and its subtypes can be written, while read results can only be safely treated as `Object`.

**The PECS Principle (Producer Extends, Consumer Super)**: Use `extends` when **reading** elements from a data structure (Producer); use `super` when **writing** elements into a data structure (Consumer). For example: from `List<? extends Number>` you can only read `Number` and cannot write; into `List<? super Integer>` you can write `Integer` and its subtypes, while reading yields `Object`. `Collections.copy(List<? super T> dest, List<? extends T> src)` is a classic example: reading from `src` and writing to `dest`.

**What is the difference between `T extends xxx` and `? extends xxx`?**

`T extends xxx` is used to declare a type parameter with an upper bound, which erases to `xxx`; `? extends xxx` is a wildcard type argument inside a parameterized type, which can appear in positions such as fields, local variables, method parameters, and return types.

**What is the difference between `Class<?>` and `Class`?**

Using `Class` directly produces a raw-type warning, whereas using `Class<?>` does not, because `Class` is a generic class and using the raw type triggers a compiler warning.

### Can the following code compile, and why?

```java
class Shape { /* ... */ }
class Circle extends Shape { /* ... */ }
class Rectangle extends Shape { /* ... */ }

class Node<T> { /* ... */ }

Node<Circle> nc = new Node<>();
Node<Shape>  ns = nc;
```

No, because `Node<Circle>` is not a subtype of `Node<Shape>`.

```java
class Shape { /* ... */ }
class Circle extends Shape { /* ... */ }
class Rectangle extends Shape { /* ... */ }

class Node<T> { /* ... */ }
class ChildNode<T> extends Node<T>{

}
ChildNode<Circle> nc = new ChildNode<>();
Node<Circle>  ns = nc;
```

Yes, it compiles, because `ChildNode<Circle>` is a subtype of `Node<Circle>`.

```java
public static void print(List<? extends Number> list) {
    for (Number n : list)
        System.out.print(n + " ");
    System.out.println();
}
```

Yes, it compiles. You can read elements out of `List<? extends Number>`, though you cannot call `add()` to insert elements into it.

## References

- Official Java Documentation: https://docs.oracle.com/javase/tutorial/java/generics/index.html
- Java Basics — Understanding Generics in One Article: https://www.cnblogs.com/XiiX/p/14719568.html
