---
title: IoC & AOP Explained (Quickly Master the Core)
description: "Detailed guide to the core principles of Spring IoC and AOP, covering Inversion of Control, Dependency Injection, Aspect-Oriented Programming, and dynamic proxy mechanisms."
category: Frameworks
tag:
  - Spring
head:
  - - meta
    - name: keywords
      content: "IoC,DI,AOP,Spring IoC Container,Dependency Injection,Aspect-Oriented Programming,Dynamic Proxy,Spring Principles"
lang: en
sourceRef: zh-ref/system-design/framework/spring/ioc-and-aop.md
---

This article explains IoC & AOP around the following questions:

- What is IoC?
- What problems does IoC solve?
- What is the difference between IoC and DI?
- What is AOP?
- What problems does AOP solve?
- What are the application scenarios of AOP?
- Why is AOP called Aspect-Oriented Programming?
- What are the ways to implement AOP?

First, a clarification: IoC & AOP were not invented by Spring—they already existed prior to Spring, though back then they leaned more toward theory. Spring simply provided a clean, practical technical implementation of both ideas.

## IoC (Inversion of Control)

### What Is IoC?

IoC (Inversion of Control) means inverting control. It is a design philosophy rather than a specific technical implementation, describing how objects are created and managed in Java development.

For example, suppose class A depends on class B:

- **Traditional development**: In class A, you manually instantiate an object of class B using the `new` keyword.
- **Development with IoC**: Instead of creating objects with `new`, an IoC container (such as the Spring framework) instantiates and manages them for you. Whenever you need an object, you simply retrieve it from the IoC container.

Comparing the two approaches: we "give up a power" (the power to create and manage objects) and in return gain a major benefit (never having to worry about the boilerplate of creating and managing objects).

**Why is it called Inversion of Control?**

- **Control**: Refers to the authority to create (instantiate and manage) objects.
- **Inversion**: That control is handed over to an external environment (the IoC container).

![IoC Illustration](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-00567db2.png)

### What Problems Does IoC Solve?

The core idea of IoC is that two collaborating parties do not directly depend on each other's concrete instantiation; instead, a third-party container manages the relevant resources. What benefits does this bring?

1. Coupling—or dependency—between objects is reduced.
2. Resources become easy to manage; for instance, using the Spring container makes implementing a singleton trivial.

For example, suppose we have operations on `User` built using a two-layer Service and DAO architecture.

Without IoC, if the Service layer wants to use a concrete implementation of the DAO layer, `UserServiceImpl` has to manually instantiate `UserDaoImpl` (a concrete implementation of the `IUserDao` interface) using `new` (since you cannot directly `new` an interface).

That works fine at first, yet consider the following scenario:

During development, a new requirement suddenly arrives to create another concrete implementation of the `IUserDao` interface. Because the Service layer depends on the concrete implementation of `IUserDao`, we have to change the `new` expression in `UserServiceImpl`. If only one class references `IUserDao`'s concrete implementation, changing it is manageable; however, if dozens of places instantiate it directly, swapping out the `IUserDao` implementation becomes a major headache.

![IoC & AOP - DAO and Service Illustration](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-service-d83e5d28.png)

With IoC, we hand control over object creation and management to the IoC container, and simply "ask" the IoC container for the object whenever we need it.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-5c2d69f4.png)

### Is There a Difference Between IoC and DI?

IoC (Inversion of Control) is a design philosophy or pattern. The essence of this design philosophy is **handing control over object creation—which was previously done manually in code—to a third party such as an IoC container.** In the Spring framework we use daily, the IoC container is essentially a `Map` (key-value store) holding various managed objects. However, IoC is also used in other languages and is not unique to Spring.

The most common and natural implementation of IoC is called Dependency Injection (DI).

In a well-known article, Martin Fowler proposed renaming IoC to DI; the excerpt is shown below (original URL: <https://martinfowler.com/articles/injection.html>).

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/martin-fowler-injection-b5c323e6.png)

Martin Fowler's point is essentially that "IoC" is too generic and not descriptive enough, which confuses many people, so using "DI" names the pattern far more precisely.

## AOP (Aspect-Oriented Programming)

This section avoids overly dense terminology; the main goal is to explain the philosophy behind AOP clearly.

### What Is AOP?

AOP (Aspect-Oriented Programming) is a continuation of OOP (Object-Oriented Programming)—the two complement each other rather than stand in opposition.

AOP aims to separate cross-cutting concerns (such as logging, transaction management, authorization checks, API rate limiting, and API idempotency) from core business logic via techniques like dynamic proxies and bytecode manipulation, achieving code reuse and decoupling while improving maintainability and extensibility. OOP, by contrast, encapsulates business logic through object state and behavior using classes, objects, inheritance, and polymorphism to modularize and structure code (which also enables code reuse), improving readability and maintainability.

### Why Is AOP Called Aspect-Oriented Programming?

AOP is called Aspect-Oriented Programming because its core idea is to extract cross-cutting concerns out of core business logic into independent **Aspects**.

![Aspect-Oriented Programming Illustration](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/aop-program-execution-d5c9954f.jpg)

Let's also summarize the key AOP terms along the way (don't worry if some aren't completely clear yet—keep reading):

- **Cross-cutting concerns**: Common behaviors shared across multiple classes or objects (such as logging, transaction management, authorization checks, API rate limiting, API idempotency, etc.).
- **Aspect**: A class that encapsulates cross-cutting concerns—one aspect is one class. An aspect can define multiple advices to implement specific behaviors.
- **JoinPoint**: A specific moment during method invocation or execution (such as calling a method or throwing an exception).
- **Advice**: The action an aspect performs at a given join point. There are five advice types: `Before`, `After`, `AfterReturning`, `AfterThrowing`, and `Around`. The first four run before or after the target method, while `Around` advice can control the execution of the target method itself.
- **Pointcut**: An expression that specifies which join points should be enhanced by an aspect. Pointcuts can be defined using annotations, regular-like patterns, logical expressions, and more—for example, `execution(* com.xyz.service..*(..))` matches classes or interfaces in `com.xyz.service` and its subpackages.
- **Weaving**: The process of linking an aspect to a target object—applying advice to the join points matched by a pointcut. There are two common weaving times: Compile-Time Weaving (e.g., AspectJ) and Runtime Weaving (e.g., AspectJ, Spring AOP).

### What Are the Common Advice Types in AOP?

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/aspectj-advice-types-ace45b9f.jpg)

- **Before**: Triggered before the target object's method is invoked.
- **After**: Triggered after the target object's method invocation finishes.
- **AfterReturning**: Triggered after the target object's method completes and returns a result.
- **AfterThrowing**: Triggered after the target object's method throws/triggers an exception during execution. `AfterReturning` and `AfterThrowing` are mutually exclusive: if the method succeeds with no exception, a return value is produced; if it throws an exception, there is no return value.
- **Around**: Programmatically controls the invocation of the target object's method. `Around` advice has the widest scope of control among all advice types because it has direct access to both the target object and the method to be executed, allowing it to run arbitrary logic before and after the target method—or even skip invoking the target method altogether.

### What Problems Does AOP Solve?

OOP cannot cleanly handle common behaviors scattered across many classes or objects (such as logging, transaction management, authorization checks, API rate limiting, API idempotency, etc.), which are commonly known as **cross-cutting concerns**. Implementing these behaviors repeatedly inside every class or object leads to code duplication, complexity, and poor maintainability.

AOP separates cross-cutting concerns (such as logging, transaction management, authorization checks, API rate limiting, API idempotency, etc.) from **core concerns (core business logic)**, achieving separation of concerns.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/crosscut-logic-and-businesslogic-separation--9d4036a7.png)

Take logging as an example. Suppose we need to log certain methods in a uniform format. Without AOP, we have to write logging logic inside every single method—pure boilerplate duplication:

```java
public CommonResponse<Object> method1() {
      // Business logic
      xxService.method1();
      // Specific business processing logic omitted
      // Logging
      ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
      HttpServletRequest request = attributes.getRequest();
      // Specific logging logic omitted, e.g., collecting metadata, writing to database, etc.
      return CommonResponse.success();
}

public CommonResponse<Object> method2() {
      // Business logic
      xxService.method2();
      // Specific business processing logic omitted
      // Logging
      ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
      HttpServletRequest request = attributes.getRequest();
      // Specific logging logic omitted, e.g., collecting metadata, writing to database, etc.
      return CommonResponse.success();
}

// ...
```

With AOP, we can encapsulate the logging logic into an aspect, and use a pointcut and advice to specify which methods should perform logging:

```java

// Logging annotation
@Target({ElementType.PARAMETER,ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Log {

    /**
     * Description
     */
    String description() default "";

    /**
     * Method type: INSERT, DELETE, UPDATE, OTHER
     */
    MethodType methodType() default MethodType.OTHER;
}

// Logging aspect
@Component
@Aspect
public class LogAspect {
  // Pointcut: all methods annotated with @Log
  @Pointcut("@annotation(cn.javaguide.annotation.Log)")
  public void webLog() {
  }

   /**
   * Around advice
   */
  @Around("webLog()")
  public Object doAround(ProceedingJoinPoint joinPoint) throws Throwable {
    // Specific processing logic omitted
  }

  // Other code omitted
}
```

Then a single annotation adds logging cleanly:

```java
@Log(description = "method1",methodType = MethodType.INSERT)
public CommonResponse<Object> method1() {
      // Business logic
      xxService.method1();
      // Specific business processing logic omitted
      return CommonResponse.success();
}
```

### What Are the Application Scenarios of AOP?

- **Logging**: Define a custom logging annotation and use AOP to enable logging with a single annotation.
- **Performance profiling**: Use AOP to measure execution time before and after target methods for optimization and analysis.
- **Transaction management**: The `@Transactional` annotation lets Spring handle transaction management such as rolling back on exceptions, eliminating repetitive transaction code. `@Transactional` is built on AOP.
- **Authorization checks**: Use AOP to verify before method execution whether the user has required permissions; if so, proceed, otherwise reject. For instance, Spring Security's `@PreAuthorize` enables custom permission checks with one line.
- **API rate limiting**: Use AOP to enforce rate-limiting algorithms on requests before the target method runs.
- **Cache management**: Use AOP to read and update cache entries before and after target method execution.
- ...

### What Are the Ways to Implement AOP?

Common AOP implementation techniques include dynamic proxies and bytecode manipulation.

Spring AOP is built on dynamic proxies. If the target object implements an interface, Spring AOP uses **JDK Proxy** to create the proxy object; for objects that do not implement an interface, JDK Proxy cannot be used, so Spring AOP uses **CGLIB** to generate a subclass of the target class as the proxy, as illustrated below:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/230ae587a322d6e4d09510161987d346-1e9492d2.jpg)

**Do Spring Boot and Spring follow the exact same dynamic proxy strategy?** Actually, no—many developers misunderstand this.

Before Spring Boot 2.0, `spring.aop.proxy-target-class` defaulted to `false`: when a target class implemented user interfaces, **JDK Dynamic Proxy** was normally used; if the target class had no usable interface, Spring AOP still fell back to **CGLIB Dynamic Proxy** rather than throwing an exception solely for lacking an interface. The Spring Boot 1.5.x AOP auto-configuration code looks like this:

```java
@Configuration
@ConditionalOnClass({ EnableAspectJAutoProxy.class, Aspect.class, Advice.class })
@ConditionalOnProperty(prefix = "spring.aop", name = "auto", havingValue = "true", matchIfMissing = true)
public class AopAutoConfiguration {

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = false)
 // Active only when spring.aop.proxy-target-class=false or omitted.
 // In other words, if no proxy mode is specified, Spring loads JDK Dynamic Proxy by default.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "false", matchIfMissing = true)
	public static class JdkDynamicAutoProxyConfiguration {

	}

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = true)
 // Active only when spring.aop.proxy-target-class=true.
 // Loaded when the developer explicitly specifies CGLIB Dynamic Proxy via configuration.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "true", matchIfMissing = false)
	public static class CglibAutoProxyConfiguration {

	}

}
```

Starting from Spring Boot 2.0, if nothing is configured, **CGLIB Dynamic Proxy** is used by default. If you need to force JDK Dynamic Proxy, add `spring.aop.proxy-target-class=false` to your configuration file. The Spring Boot 2.0 AOP auto-configuration code looks like this:

```java
@Configuration
@ConditionalOnClass({ EnableAspectJAutoProxy.class, Aspect.class, Advice.class,
		AnnotatedElement.class })
@ConditionalOnProperty(prefix = "spring.aop", name = "auto", havingValue = "true", matchIfMissing = true)
public class AopAutoConfiguration {

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = false)
 // Active only when spring.aop.proxy-target-class=false.
 // Loaded when the developer explicitly requests JDK Dynamic Proxy via configuration.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "false", matchIfMissing = false)
	public static class JdkDynamicAutoProxyConfiguration {

	}

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = true)
 // Active when spring.aop.proxy-target-class=true or omitted.
 // In other words, if no proxy mode is specified, Spring loads CGLIB Proxy by default.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "true", matchIfMissing = true)
	public static class CglibAutoProxyConfiguration {

	}

}
```

Of course, you can also use **AspectJ**! Spring AOP already integrates with AspectJ, which is arguably the most complete AOP framework in the Java ecosystem.

**Spring AOP performs runtime enhancement, whereas AspectJ supports compile-time, post-compile, and load-time weaving.** Spring AOP is based on proxying, while AspectJ is based on bytecode manipulation.

Spring AOP already integrates with AspectJ, which is arguably the most complete AOP framework in the Java ecosystem. AspectJ is more powerful than Spring AOP, whereas Spring AOP is simpler to use.

If there are relatively few aspects, the performance difference between the two is negligible. However, if there are many aspects, it is better to choose AspectJ, which is significantly faster than Spring AOP.

## References

- AOP in Spring Boot, is it a JDK dynamic proxy or a Cglib dynamic proxy?: <https://www.springcloud.io/post/2022-01/springboot-aop/>
- Spring Proxying Mechanisms: <https://docs.spring.io/spring-framework/reference/core/aop/proxying.html>
