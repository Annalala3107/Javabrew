---
title: Java Proxy Pattern Explained
description: "Detailed explanation of the Java Proxy pattern principles and implementations: comparing static proxy and dynamic proxy, deeply analyzing JDK dynamic proxy and CGLIB proxy mechanisms, and understanding how AOP cross-cutting concerns are implemented."
category: Java
tag:
  - Java Basics
lang: en
sourceRef: zh-ref/java/basis/proxy.md
head:
  - - meta
    - name: keywords
      content: Java proxy pattern,static proxy,dynamic proxy,JDK dynamic proxy,CGLIB proxy,AOP,design pattern,proxy implementation
---

## 1. The Proxy Pattern

The Proxy pattern is a relatively easy-to-understand design pattern. Simply put, **we use a proxy object to stand in for access to the real object, allowing us to provide extra functional operations and extend the target object's capabilities without modifying the original target object.**

**The main purpose of the Proxy pattern is to extend the target object's functionality—for example, you can add custom operations before and after a method on the target object executes.**

For instance: a bride asks her aunt to handle the groom's questions on her behalf, so the questions the bride receives have all been processed and filtered by her aunt first. Here, the aunt acts as the proxy object representing you, and the proxied behavior (method) is receiving and replying to the groom's questions.

![Understanding the Proxy Design Pattern | by Mithun Sasidharan | Medium](/media/jg/ext/oss.javaguide.cn/2020-8/1-DjWCgTFm-xqbhbNQVsaWQw-dc7d1891.png)

<p style="text-align:right;font-size:13px;color:gray">https://medium.com/@mithunsasidharan/understanding-the-proxy-design-pattern-5e63fe38052a</p>

There are two ways to implement the Proxy pattern: static proxy and dynamic proxy. Let's look at the static proxy implementation first.

## 2. Static Proxy

In a static proxy, our enhancement for each method of the target object is written manually (demonstrated in code below), which is very inflexible (for instance, once an interface adds a new method, both the target object and the proxy object must be modified) and cumbersome (a separate proxy class must be written for every target class). Real-world use cases are extremely rare—you almost never see static proxies used in day-to-day development.

Above, we described static proxy from an implementation and usage perspective; from the JVM perspective, **a static proxy compiles the interface, implementation class, and proxy class into concrete `.class` files ahead of time.**

Steps to implement a static proxy:

1. Define an interface and its implementation class;
2. Create a proxy class that implements the same interface;
3. Inject the target object into the proxy class, and then invoke the corresponding method of the target class inside the corresponding method of the proxy class. In this way, we can shield direct access to the target object through the proxy class and perform whatever operations we want before and after the target method executes.

Let's demonstrate this in code!

**1. Define an interface for sending SMS**

```java
public interface SmsService {
    String send(String message);
}
```

**2. Implement the SMS-sending interface**

```java
public class SmsServiceImpl implements SmsService {
    public String send(String message) {
        System.out.println("send message:" + message);
        return message;
    }
}
```

**3. Create a proxy class that also implements the SMS-sending interface**

```java
public class SmsProxy implements SmsService {

    private final SmsService smsService;

    public SmsProxy(SmsService smsService) {
        this.smsService = smsService;
    }

    @Override
    public String send(String message) {
        // Before calling the method, we can add our own operations
        System.out.println("before method send()");
        smsService.send(message);
        // After calling the method, we can likewise add our own operations
        System.out.println("after method send()");
        return null;
    }
}
```

**4. Actual usage**

```java
public class Main {
    public static void main(String[] args) {
        SmsService smsService = new SmsServiceImpl();
        SmsProxy smsProxy = new SmsProxy(smsService);
        smsProxy.send("java");
    }
}
```

After running the code above, the console prints:

```bash
before method send()
send message:java
after method send()
```

From the output, we can see that we have enhanced the `send()` method of `SmsServiceImpl`.

## 3. Dynamic Proxy

Compared with static proxies, dynamic proxies are far more flexible. We do not need to create a separate proxy class for each target class, nor are we required to implement an interface—we can proxy an implementation class directly (via the CGLIB dynamic proxy mechanism).

**From the JVM perspective, a dynamic proxy dynamically generates class bytecode at runtime and loads it into the JVM.**

When talking about dynamic proxies, Spring AOP and RPC frameworks are two topics that must be mentioned—their implementations both rely on dynamic proxies.

**Dynamic proxies are used relatively little in daily application coding, yet they are almost an indispensable technology inside frameworks. Learning dynamic proxies is also very helpful for understanding how various frameworks work under the hood.**

In Java, there are multiple ways to implement dynamic proxies, such as **JDK Dynamic Proxy**, **CGLIB Dynamic Proxy**, and so on.

[guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework) uses JDK Dynamic Proxy; let's look at how JDK Dynamic Proxy is used first.

In addition, although [guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework) does not use **CGLIB Dynamic Proxy**, we will still briefly introduce its usage and compare it with **JDK Dynamic Proxy**.

### 3.1. JDK Dynamic Proxy Mechanism

#### 3.1.1. Introduction

**In Java's dynamic proxy mechanism, the `InvocationHandler` interface and the `Proxy` class are at the core.**

The most frequently used method in the `Proxy` class is `newProxyInstance()`, which is mainly used to generate a proxy object.

```java
    public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
        throws IllegalArgumentException
    {
        ......
    }
```

This method takes 3 parameters in total:

1. **loader**: ClassLoader, used to load the proxy object.
2. **interfaces**: Interfaces implemented by the proxied class;
3. **h**: An object implementing the `InvocationHandler` interface;

To implement a dynamic proxy, you must also implement `InvocationHandler` to define custom handling logic. When our dynamic proxy object calls a method, that method invocation is forwarded to the `invoke` method of the class implementing `InvocationHandler`.

```java
public interface InvocationHandler {

    /**
     * This method is actually invoked when you call a method on the proxy object
     */
    public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable;
}
```

The `invoke()` method has the following three parameters:

1. **proxy**: The dynamically generated proxy object
2. **method**: Corresponds to the method invoked on the proxy object
3. **args**: The arguments passed to the current `method`

In other words: **when a proxy object created via `Proxy.newProxyInstance()` invokes a method, it actually invokes the `invoke()` method of the class implementing `InvocationHandler`.** You can customize handling logic inside `invoke()`, such as performing actions before and after the method executes.

#### 3.1.2. Steps to Use JDK Dynamic Proxy

1. Define an interface and its implementation class;
2. Customize an `InvocationHandler` and override the `invoke` method, inside which we invoke the original method (the method of the proxied class) and add custom processing logic;
3. Create the proxy object via `Proxy.newProxyInstance(ClassLoader loader, Class<?>[] interfaces, InvocationHandler h)`;

#### 3.1.3. Code Example

Explaining it like that may feel a bit abstract and hard to grasp—let's look at an example so you can get a feel for it!

**1. Define an interface for sending SMS**

```java
public interface SmsService {
    String send(String message);
}
```

**2. Implement the SMS-sending interface**

```java
public class SmsServiceImpl implements SmsService {
    public String send(String message) {
        System.out.println("send message:" + message);
        return message;
    }
}
```

**3. Define a JDK dynamic proxy handler class**

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * @author shuang.kou
 * @createTime 2020-05-11 11:23:00
 */
public class DebugInvocationHandler implements InvocationHandler {
    /**
     * The real target object inside the proxy
     */
    private final Object target;

    public DebugInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws InvocationTargetException, IllegalAccessException {
        // Before calling the method, we can add our own operations
        System.out.println("before method " + method.getName());
        Object result = method.invoke(target, args);
        // After calling the method, we can likewise add our own operations
        System.out.println("after method " + method.getName());
        return result;
    }
}

```

`invoke()`: When our dynamic proxy object calls the target method, what ultimately gets called is `invoke()`, and then `invoke()` calls the original method of the proxied object on our behalf.

**4. Factory class for obtaining the proxy object**

```java
public class JdkProxyFactory {
    public static Object getProxy(Object target) {
        return Proxy.newProxyInstance(
                target.getClass().getClassLoader(), // ClassLoader of the target class
                target.getClass().getInterfaces(),  // Interfaces the proxy needs to implement; multiple can be specified
                new DebugInvocationHandler(target)   // Custom InvocationHandler corresponding to the proxy object
        );
    }
}
```

`getProxy()`: mainly obtains a proxy object for a given class via `Proxy.newProxyInstance()`.

**5. Actual usage**

```java
SmsService smsService = (SmsService) JdkProxyFactory.getProxy(new SmsServiceImpl());
smsService.send("java");
```

After running the code above, the console prints:

```plain
before method send
send message:java
after method send
```

### 3.2. CGLIB Dynamic Proxy Mechanism

#### 3.2.1. Introduction

**The biggest limitation of JDK Dynamic Proxy is that it can only proxy classes that implement an interface.**

**To solve this problem, we can use the CGLIB dynamic proxy mechanism instead.**

[CGLIB](https://github.com/cglib/cglib) (_Code Generation Library_) is a bytecode generation library built on top of [ASM](http://www.baeldung.com/java-asm) that allows us to modify and dynamically generate bytecode at runtime. CGLIB implements proxying through inheritance. Many well-known open-source frameworks use [CGLIB](https://github.com/cglib/cglib); for example, in Spring's AOP module: if the target object implements an interface, JDK Dynamic Proxy is used by default; otherwise, CGLIB Dynamic Proxy is used.

**In the CGLIB dynamic proxy mechanism, the `MethodInterceptor` interface and the `Enhancer` class are at the core.**

You need to implement a custom `MethodInterceptor` and override the `intercept` method, which is used to intercept and enhance methods of the proxied class.

```java
public interface MethodInterceptor
extends Callback{
    // Intercepts methods of the proxied class
    public Object intercept(Object obj, java.lang.reflect.Method method, Object[] args, MethodProxy proxy) throws Throwable;
}

```

1. **obj**: The proxied object (the object to be enhanced)
2. **method**: The intercepted method (the method to be enhanced)
3. **args**: Method arguments
4. **proxy**: Used to invoke the original method

You can dynamically obtain the proxied class's proxy through the `Enhancer` class; when the proxy object invokes a method, what actually executes is `intercept` in `MethodInterceptor`.

#### 3.2.2. Steps to Use CGLIB Dynamic Proxy

1. Define a class;
2. Implement a custom `MethodInterceptor` and override the `intercept` method, which is used to intercept and enhance methods of the proxied class—similar to `invoke` in JDK Dynamic Proxy;
3. Create the proxy object using `Enhancer.create()`;

#### 3.2.3. Code Example

Unlike JDK Dynamic Proxy, which requires no external dependencies, [CGLIB](https://github.com/cglib/cglib) (_Code Generation Library_) is an open-source project, so if you want to use it, you need to add the relevant dependency manually.

```xml
<dependency>
  <groupId>cglib</groupId>
  <artifactId>cglib</artifactId>
  <version>3.3.0</version>
</dependency>
```

**1. Implement a class that uses Alibaba Cloud to send SMS**

```java
package github.javaguide.dynamicProxy.cglibDynamicProxy;

public class AliSmsService {
    public String send(String message) {
        System.out.println("send message:" + message);
        return message;
    }
}
```

**2. Customize `MethodInterceptor`**

```java
import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;

import java.lang.reflect.Method;

/**
 * Custom MethodInterceptor
 */
public class DebugMethodInterceptor implements MethodInterceptor {


    /**
     * @param o           The proxy object itself (note: not the original target object; calling method.invoke(o, args) would cause infinite recursion)
     * @param method      The intercepted method (the method to enhance)
     * @param args        Method arguments
     * @param methodProxy High-performance method invocation mechanism that avoids reflection overhead
     */
    @Override
    public Object intercept(Object o, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
        // Before calling the method, we can add our own operations
        System.out.println("before method " + method.getName());
        Object object = methodProxy.invokeSuper(o, args);
        // After calling the method, we can likewise add our own operations
        System.out.println("after method " + method.getName());
        return object;
    }

}
```

**3. Obtain the proxy class**

```java
import net.sf.cglib.proxy.Enhancer;

public class CglibProxyFactory {

    public static Object getProxy(Class<?> clazz) {
        // Create dynamic proxy enhancer
        Enhancer enhancer = new Enhancer();
        // Set ClassLoader
        enhancer.setClassLoader(clazz.getClassLoader());
        // Set the superclass (the class being proxied)
        enhancer.setSuperclass(clazz);
        // Set the method interceptor
        enhancer.setCallback(new DebugMethodInterceptor());
        // Create the proxy instance
        return enhancer.create();
    }
}
```

**4. Actual usage**

```java
AliSmsService aliSmsService = (AliSmsService) CglibProxyFactory.getProxy(AliSmsService.class);
aliSmsService.send("java");
```

After running the code above, the console prints:

```bash
before method send
send message:java
after method send
```

### 3.3. Comparison Between JDK Dynamic Proxy and CGLIB Dynamic Proxy

1. JDK Dynamic Proxy is built into the standard library and requires the proxied class to implement an interface. Its mechanism dynamically generates an implementation class of the interface to act as the proxy. CGLIB is a third-party library and does not require an interface; its mechanism dynamically generates a subclass of the proxied class to act as the proxy. However, precisely because it uses inheritance, it cannot proxy `final` classes, and proxied methods cannot be `final` or `private`.
2. In terms of efficiency between the two, JDK Dynamic Proxy performs better in most scenarios, and this advantage becomes even more pronounced as JDK versions upgrade.

## 4. Comparison Between Static Proxy and Dynamic Proxy

The core differences between static proxies and dynamic proxies lie in **when the proxy relationship is determined, implementation flexibility, and maintenance cost**.

| Comparison Dimension | Static Proxy | Dynamic Proxy |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| When Proxy Relationship Is Determined | Compile time (fixed `.class` bytecode files are generated after compilation) | Runtime (proxy class bytecode is dynamically generated and loaded into the JVM) |
| Implementation Approach | Proxy classes are written manually before compilation, typically calling the target object via composition and delegation | No need to write concrete proxy classes manually; enhancement logic is encapsulated via a `Handler` / `Interceptor` |
| Interface Dependency | Not mandatory; interface-based static proxies typically have the proxy class and target class follow the same interface | JDK Dynamic Proxy is interface-oriented, while subclass-based proxies like CGLIB target inheritable implementation classes |
| Code Volume & Maintainability | High code volume (the more target classes, the more proxy classes) and high maintenance cost; when an interface adds methods, both target and proxy classes must be modified | Minimal code volume (generic enhancement logic is reusable) and good maintainability; decoupled from interfaces so interface changes do not affect proxy logic |
| Core Advantages | Simple to implement, straightforward logic, no extra framework dependencies | High flexibility, strong reusability, reduces boilerplate code, suitable for complex scenarios |
| Typical Use Cases | Simple Decorator-style patterns, enhancement needs for a small number of fixed classes | Spring AOP, RPC frameworks (such as Dubbo), ORM frameworks |

## 5. Summary

This article mainly introduced the two implementations of the Proxy pattern: static proxy and dynamic proxy. It covered static and dynamic proxies in practice, the differences between static and dynamic proxies, and the differences between JDK Dynamic Proxy and CGLIB Dynamic Proxy.

All source code referenced in this article can be found here: [https://github.com/Snailclimb/guide-rpc-framework-learning/tree/master/src/main/java/github/javaguide/proxy](https://github.com/Snailclimb/guide-rpc-framework-learning/tree/master/src/main/java/github/javaguide/proxy).
