---
title: Java Pass-by-Value Explained
description: "A deep dive into why Java only uses pass-by-value: analyzing Java's parameter-passing mechanism through examples, clearing up common misconceptions between pass-by-value and pass-by-reference, and understanding the fundamental difference between formal parameters and actual arguments."
category: Java
tag:
  - Java Fundamentals
lang: en
sourceRef: zh-ref/java/basis/why-there-only-value-passing-in-java.md
head:
  - - meta
    - name: keywords
      content: Java pass-by-value,pass-by-reference,parameter passing,formal parameters and actual arguments,object reference,method invocation,Java argument passing mechanism
---

Before we begin, let's clarify the following two pairs of concepts:

- Formal Parameters & Actual Arguments
- Pass-by-Value & Pass-by-Reference

## Formal Parameters & Actual Arguments

A method definition may make use of **parameters** (methods with parameters). In programming languages, parameters are categorized into:

- **Actual Arguments (Arguments)**: The values passed into a function/method; they must have definite values.
- **Formal Parameters (Parameters)**: Used when defining a function/method to receive actual arguments; they do not need to have definite values beforehand.

```java
String hello = "Hello!";
// hello is the actual argument
sayHello(hello);
// str is the formal parameter
void sayHello(String str) {
    System.out.println(str);
}
```

## Pass-by-Value & Pass-by-Reference

Programming languages pass actual arguments to methods (or functions) in one of two ways:

- **Pass-by-value**: The method receives a copy of the actual argument's value, creating a duplicate.
- **Pass-by-reference**: The method directly receives the memory address of the actual argument rather than the value inside it—this is a pointer/alias. Here, the formal parameter *is* the actual argument itself, so any modification to the formal parameter (including reassignment) is reflected in the actual argument.

Many programming languages (such as C++ and Pascal) support both parameter-passing mechanisms; however, Java only has pass-by-value.

## Why Does Java Only Have Pass-by-Value?

**Why do we say Java only has pass-by-value?** Without wasting words, let me prove it to you with 3 examples.

### Case 1: Passing Primitive-Type Parameters

Code:

```java
public static void main(String[] args) {
    int num1 = 10;
    int num2 = 20;
    swap(num1, num2);
    System.out.println("num1 = " + num1);
    System.out.println("num2 = " + num2);
}

public static void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
    System.out.println("a = " + a);
    System.out.println("b = " + b);
}
```

Output:

```plain
a = 20
b = 10
num1 = 10
num2 = 20
```

Explanation:

Inside the `swap()` method, swapping the values of `a` and `b` does not affect `num1` and `num2`. That is because the values of `a` and `b` are simply copied from `num1` and `num2`. In other words, `a` and `b` are copies of `num1` and `num2`—no matter how the contents of those copies are modified, the original values themselves are never affected.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/java-value-passing-01-2909fc2c.png)

From the example above, we already know that a method cannot modify a primitive-type parameter. When an object reference is passed as a parameter, however, things look different—let's examine Case 2.

### Case 2: Passing Reference-Type Parameters (1)

Code:

```java
  public static void main(String[] args) {
      int[] arr = { 1, 2, 3, 4, 5 };
      System.out.println(arr[0]);
      change(arr);
      System.out.println(arr[0]);
  }

  public static void change(int[] array) {
      // Set the first element of the array to 0
      array[0] = 0;
  }
```

Output:

```plain
1
0
```

Explanation:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/java-value-passing-02-ba12c098.png)

After seeing this example, many people inevitably think that Java uses pass-by-reference for reference-type parameters.

In fact, that is not true—what is passed here is still a value, except that this value is a copy of the object reference.

In other words, the parameter of the `change` method copies the reference value stored in `arr`, so both the formal parameter and `arr` point to the same array object. This explains why modifying the contents of the array through the formal parameter is visible to the caller.

To make an even stronger case refuting the claim that Java uses pass-by-reference for reference-type parameters, let's look at the next example!

### Case 3: Passing Reference-Type Parameters (2)

```java
public class Person {
    private String name;
   // Constructors, Getters & Setters omitted
}

public static void main(String[] args) {
    Person xiaoZhang = new Person("小张");
    Person xiaoLi = new Person("小李");
    swap(xiaoZhang, xiaoLi);
    System.out.println("xiaoZhang:" + xiaoZhang.getName());
    System.out.println("xiaoLi:" + xiaoLi.getName());
}

public static void swap(Person person1, Person person2) {
    Person temp = person1;
    person1 = person2;
    person2 = temp;
    System.out.println("person1:" + person1.getName());
    System.out.println("person2:" + person2.getName());
}
```

Output:

```plain
person1:小李
person2:小张
xiaoZhang:小张
xiaoLi:小李
```

Explanation:

Wait, what happened??? Swapping the two reference-type formal parameters did not affect the actual arguments at all!

The `swap` method's parameters `person1` and `person2` merely copy the reference values stored in the actual arguments `xiaoZhang` and `xiaoLi`. Therefore, swapping `person1` and `person2` only swaps the copies of the references held by the formal parameters and does not alter the values of the caller's variables `xiaoZhang` and `xiaoLi`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/java-value-passing-03-46cd446e.png)

## What Does Pass-by-Reference Look Like?

At this point, you should already know that Java only has pass-by-value and has no pass-by-reference.
Still, what does true pass-by-reference actually look like? Let's take `C++` code as an example so you can see the true face of pass-by-reference.

```C++
#include <iostream>

void incr(int& num)
{
    std::cout << "incr before: " << num << "\n";
    num++;
    std::cout << "incr after: " << num << "\n";
}

int main()
{
    int age = 10;
    std::cout << "invoke before: " << age << "\n";
    incr(age);
    std::cout << "invoke after: " << age << "\n";
}
```

Output:

```plain
invoke before: 10
incr before: 10
incr after: 11
invoke after: 11
```

Analysis: As you can see, modifying the formal parameter inside the `incr` function affects the value of the actual argument. Note carefully: here the formal parameter of `incr` uses the type `int&`, which is why it is pass-by-reference; if it used `int`, it would still be pass-by-value!

## Why Didn't Java Introduce Pass-by-Reference?

Pass-by-reference seems convenient because it can directly modify the actual argument's value inside a method. So why didn't Java introduce pass-by-reference?

**Note: The following represents personal viewpoints, not an official Java statement:**

1. For safety reasons: operations performed on values inside a method are opaque to the caller (a method is defined as an interface/contract, and the caller does not care about its internal implementation). Just imagine going to withdraw money with a bank card—if you request 100 and 200 gets deducted, how terrifying would that be!
2. When James Gosling, the father of Java, first designed the language, he saw many pitfalls in C and C++, which is why he wanted to design a new language called Java. While designing Java, he followed the principle of simplicity and ease of use, leaving out many "features" that could easily cause bugs if developers were momentarily careless. With fewer constructs in the language itself, developers also had less to learn.

## Summary

The mechanism Java uses to pass actual arguments into methods (or functions) is **pass-by-value**:

- If the parameter is a primitive type, it is straightforward: what is passed is a copy of the primitive literal value, creating a duplicate.
- If the parameter is a reference type, what is passed is a copy of the reference value. The formal parameter and actual argument initially point to the same object, but reassigning the formal parameter will not change the actual argument variable.

## References

- *Core Java, Volume I — Fundamentals*, 10th Edition, Chapter 4, Section 4.5
- [Is Java Pass-by-Value or Pass-by-Reference? - Hollis's Answer - Zhihu](https://www.zhihu.com/question/31203609/answer/576030121)
- [Oracle Java Tutorials - Passing Information to a Method or a Constructor](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html)
- [Interview with James Gosling, Father of Java](https://mappingthejourney.com/single-post/2017/06/29/episode-3-interview-with-james-gosling-father-of-java/)
