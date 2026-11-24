---
title: Design Patterns in Spring Explained
description: "Detailed guide to design patterns in the Spring Framework, covering Factory, Proxy, Singleton, Template Method, Observer, Adapter, and Decorator patterns in Spring source code."
category: Framework
tag:
  - Spring
lang: en
sourceRef: zh-ref/system-design/framework/spring/spring-design-patterns-summary.md
head:
  - - meta
    - name: keywords
      content: Spring Design Patterns,Factory Pattern,Proxy Pattern,Template Method,Singleton,Strategy Pattern,Adapter Pattern,Spring Source Code
---

"Which design patterns are used in the JDK? Which design patterns are used in Spring?" These two questions are very common in technical interviews.

I searched online for explanations of design patterns in Spring, and almost all of them were cookie-cutter summaries, mostly quite dated. So I spent a few days putting together my own summary.

Since my own knowledge has limits, feel free to point out any mistakes in this article. In addition, due to space constraints, I only touch briefly on the design patterns themselves and parts of the source code—the main goal of this article is to review the design patterns used in Spring.

## Inversion of Control (IoC) and Dependency Injection (DI)

**IoC (Inversion of Control)** is a critically important concept in Spring. It is not a specific technology, but a design philosophy for decoupling. The main goal of IoC is to decouple objects with dependency relationships by relying on a "third party" (the IoC container in Spring)—the IoC container manages the objects, and you simply use them—thereby reducing coupling in your code.

**IoC is a principle, not a design pattern; the following patterns (among others) implement the IoC principle.**

![ioc-patterns](/media/jg/ext/oss.javaguide.cn/github/javaguide/ioc-patterns-fbb73446.png)

**The Spring IoC container acts like a factory: when we need to create an object, we only need to configure the configuration file or annotations, without worrying at all about how the object is constructed.** The IoC container is responsible for creating objects, wiring them together, configuring them, and managing their entire lifecycle from creation until they are completely destroyed.

In a real-world project, a `Service` class might sit on top of hundreds or even thousands of underlying classes. If we had to instantiate this `Service` manually, we might have to trace the constructors of all its underlying classes every time—which would drive anyone crazy. With IoC, you simply configure everything once and inject/reference it wherever needed, greatly improving project maintainability and reducing development effort.

> To better understand Spring IoC, I recommend reading this Zhihu answer: <https://www.zhihu.com/question/23277575/answer/169698662>—it is very well written.

**How should we understand Inversion of Control?** Consider an example: "Object `a` depends on object `b`. Traditionally, when object `a` needs to use object `b`, it has to create `b` itself. However, once an IoC container is introduced into the system, object `a` and object `b` lose their direct link. Now, when object `a` needs to use object `b`, we can instruct the IoC container to create object `b` and inject it into object `a`." The process by which object `a` obtains its dependency `b` shifts from active creation to passive injection—control is inverted, which is where the name "Inversion of Control" comes from.

**DI (Dependency Injection) is a design pattern that implements Inversion of Control; dependency injection simply means passing instance dependencies into an object.**

## Factory Design Pattern

Spring uses the Factory pattern to create bean objects via `BeanFactory` or `ApplicationContext`.

**Comparison between the two:**

- `BeanFactory`: Provides the foundational capabilities of the Spring IoC container. When using a basic `BeanFactory` directly, the container typically does not eagerly pre-instantiate all singleton beans; instead, a bean is created when it is first requested.
- `ApplicationContext`: Extends `BeanFactory` with additional features such as event publishing, internationalization, and resource loading, and by default eagerly pre-instantiates non-lazy singleton beans during container startup; `prototype` beans and beans marked as lazy are not all instantiated upfront.

Three common implementations of `ApplicationContext`:

1. `ClassPathXmlApplicationContext`: Treats the context configuration file as a classpath resource.
2. `FileSystemXmlApplicationContext`: Loads context definitions from an XML file in the filesystem.
3. `XmlWebApplicationContext`: Loads context definitions from an XML file in a Web application.

Example:

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;

public class App {
  public static void main(String[] args) {
    ApplicationContext context = new FileSystemXmlApplicationContext(
        "C:/work/IOC Containers/springframework.applicationcontext/src/main/resources/bean-factory-config.xml");

    HelloApplicationContext obj = (HelloApplicationContext) context.getBean("helloApplicationContext");
    obj.getMsg();
  }
}
```

## Singleton Design Pattern

In our systems, there are certain objects of which we only ever need a single instance—for example, thread pools, caches, dialog boxes, registries, logger objects, or device drivers acting for printers or graphics cards. In fact, such classes must only have one instance; creating multiple instances can lead to problems such as erratic program behavior, excessive resource consumption, or inconsistent results.

**Benefits of using the Singleton pattern**:

- For frequently used objects, it eliminates the time spent recreating objects, which represents a substantial system-overhead saving for heavyweight objects.
- Because fewer `new` operations occur, memory allocation frequency drops as well, easing GC pressure and shortening GC pause times.

**The default scope of a bean in Spring is `singleton`.** Aside from the `singleton` scope, Spring beans also support the following scopes:

- **prototype**: Creates a new bean instance every time it is requested. That is, calling `getBean()` twice in a row returns two distinct bean instances.
- **request** (Web applications only): Every HTTP request produces a new bean (request bean), which is valid only within the current HTTP request.
- **session** (Web applications only): Every HTTP request from a new session produces a new bean (session bean), which is valid only within the current HTTP session.
- **application** (Web applications only): One bean instance per `ServletContext`, valid only for the lifecycle of the current Web application. Older versions of Spring also offered a separate `globalSession` scope for Portlet applications, which is no longer part of the standard scope list.
- **websocket** (Web applications only): Creates a new bean for each WebSocket session.

Spring implements the Singleton pattern in a special way through a singleton registry backed by `ConcurrentHashMap`.

The core Spring code for implementing singletons is as follows:

```java
// Implement the singleton registry via ConcurrentHashMap (thread-safe)
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<String, Object>(64);

public Object getSingleton(String beanName, ObjectFactory<?> singletonFactory) {
        Assert.notNull(beanName, "'beanName' must not be null");
        synchronized (this.singletonObjects) {
            // Check whether an instance exists in the cache
            Object singletonObject = this.singletonObjects.get(beanName);
            if (singletonObject == null) {
                //... many lines of code omitted
                try {
                    singletonObject = singletonFactory.getObject();
                }
                //... many lines of code omitted
                // If the instance does not exist, register it into the singleton registry.
                addSingleton(beanName, singletonObject);
            }
            return (singletonObject != NULL_OBJECT ? singletonObject : null);
        }
    }
    // Add the object to the singleton registry
    protected void addSingleton(String beanName, Object singletonObject) {
            synchronized (this.singletonObjects) {
                this.singletonObjects.put(beanName, (singletonObject != null ? singletonObject : NULL_OBJECT));

            }
        }
}
```

**Do singleton beans have thread-safety issues?**

Most of the time we do not use multithreading explicitly in simple business code, so few developers pay attention to this issue. Thread-safety issues in singleton beans arise primarily because resource contention occurs when multiple threads manipulate the same object concurrently.

There are two common solutions:

1. Avoid defining mutable member variables inside the bean whenever possible.
2. Define a `ThreadLocal` member variable in the class and store the required mutable state inside `ThreadLocal` (recommended approach).

That said, most beans in practice are stateless (containing no mutable instance variables)—such as DAOs and Services—in which case those beans are thread-safe.

## Proxy Design Pattern

### Application of the Proxy Pattern in AOP

**AOP (Aspect-Oriented Programming)** encapsulates cross-cutting logic or responsibilities that are unrelated to core business logic yet shared across multiple business modules (such as transaction management, logging, and access control), helping reduce code duplication, lower coupling between modules, and improve future extensibility and maintainability.

Spring AOP is built on dynamic proxies. If the target object to be proxied implements one or more interfaces, Spring AOP uses **JDK Proxy** to create the proxy object; if the target object does not implement any interface, JDK Proxy cannot be used, so Spring AOP uses **CGLIB** to generate a subclass of the target object as the proxy, as shown below:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/github/javaguide/SpringAOPProcess-59a6425d.jpg)

Of course, you can also use AspectJ. Spring AOP already integrates AspectJ, which is arguably the most complete AOP framework in the Java ecosystem.

With AOP, we can extract common cross-cutting concerns and apply them wherever needed, greatly reducing boilerplate code. Adding new features becomes much easier as well, improving overall extensibility. Scenarios such as logging and transaction management rely heavily on AOP.

### What Is the Difference Between Spring AOP and AspectJ AOP?

**Spring AOP performs runtime enhancement, whereas AspectJ performs compile-time (or load-time) enhancement.** Spring AOP is based on proxying, whereas AspectJ is based on bytecode manipulation.

Spring AOP already integrates AspectJ, and AspectJ is arguably the most comprehensive AOP framework in the Java ecosystem. AspectJ is more powerful than Spring AOP, while Spring AOP is comparatively simpler to use.

When you only have a small number of aspects, the performance difference between the two is negligible. However, if you have a large number of aspects, AspectJ is a much better choice because it is significantly faster than Spring AOP.

## Template Method Pattern

The Template Method pattern is a behavioral design pattern that defines the skeleton of an algorithm in an operation while deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's overall structure.

```java
public abstract class Template {
    // This is our template method
    public final void TemplateMethod(){
        PrimitiveOperation1();
        PrimitiveOperation2();
        PrimitiveOperation3();
    }

    protected void  PrimitiveOperation1(){
        // Implemented by the base class
    }

    // Methods to be implemented by subclasses
    protected abstract void PrimitiveOperation2();
    protected abstract void PrimitiveOperation3();

}
public class TemplateImpl extends Template {

    @Override
    public void PrimitiveOperation2() {
        // Implemented by the subclass
    }

    @Override
    public void PrimitiveOperation3() {
        // Implemented by the subclass
    }
}

```

In Spring, database-access classes ending with `Template`—such as `JdbcTemplate` and `HibernateTemplate`—apply the Template Method pattern. Ordinarily, we implement the Template Method pattern using inheritance, but Spring takes a different approach: it combines the Callback pattern with the Template Method pattern, achieving both code reuse and greater flexibility.

## Observer Pattern

The Observer pattern is an object behavioral pattern. It represents a one-to-many dependency relationship between objects so that when one object changes state, all objects that depend on it are notified and react automatically. Spring's event-driven model is a classic application of the Observer pattern. The Spring event-driven model is very useful for decoupling code in many scenarios—for instance, whenever a product is added and we need to update the product search index, we can use the Observer pattern to handle it cleanly.

### Three Roles in Spring's Event-Driven Model

#### Event Role

`ApplicationEvent` (under the `org.springframework.context` package) acts as the event role. It is an abstract class that extends `java.util.EventObject` and implements the `java.io.Serializable` interface.

Spring comes with the following built-in events, all of which extend `ApplicationContextEvent`:

- `ContextStartedEvent`: Triggered after the `ApplicationContext` is started.
- `ContextStoppedEvent`: Triggered after the `ApplicationContext` is stopped.
- `ContextRefreshedEvent`: Triggered after the `ApplicationContext` is initialized or refreshed.
- `ContextClosedEvent`: Triggered after the `ApplicationContext` is closed.

![ApplicationEvent-Subclass](/media/jg/ext/oss.javaguide.cn/github/javaguide/ApplicationEvent-Subclass-f53f4c0b.png)

#### Event Listener Role

`ApplicationListener` acts as the event listener role. It is an interface defining only a single method, `onApplicationEvent()`, to handle `ApplicationEvent`. Looking at the source code of `ApplicationListener` below, you can see that any event type extending `ApplicationEvent` is supported. Thus, in Spring, you simply implement the `onApplicationEvent()` method of `ApplicationListener` to listen for events.

```java
package org.springframework.context;
import java.util.EventListener;
@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
    void onApplicationEvent(E var1);
}
```

#### Event Publisher Role

`ApplicationEventPublisher` acts as the event publisher role, and it is also an interface.

```java
@FunctionalInterface
public interface ApplicationEventPublisher {
    default void publishEvent(ApplicationEvent event) {
        this.publishEvent((Object)event);
    }

    void publishEvent(Object var1);
}

```

The `publishEvent()` method of `ApplicationEventPublisher` is implemented in `AbstractApplicationContext`. Reading its implementation reveals that events are actually broadcast by `ApplicationEventMulticaster`. Since the details are quite extensive, we will not analyze them here and may cover them in a separate article later.

### Summary of Spring's Event Flow

1. Define an event: Create a class extending `ApplicationEvent` and write an appropriate constructor.
2. Define an event listener: Implement the `ApplicationListener` interface and override the `onApplicationEvent()` method.
3. Publish the message using an event publisher: Call the `publishEvent()` method of `ApplicationEventPublisher`.

Example:

```java
// Define an event extending ApplicationEvent with a corresponding constructor
public class DemoEvent extends ApplicationEvent{
    private static final long serialVersionUID = 1L;

    private String message;

    public DemoEvent(Object source,String message){
        super(source);
        this.message = message;
    }

    public String getMessage() {
         return message;
          }


// Define an event listener implementing ApplicationListener and overriding onApplicationEvent()
@Component
public class DemoListener implements ApplicationListener<DemoEvent>{

    // Receive messages via onApplicationEvent
    @Override
    public void onApplicationEvent(DemoEvent event) {
        String msg = event.getMessage();
        System.out.println("Received message: "+msg);
    }

}
// Publish an event via ApplicationEventPublisher's publishEvent() method
@Component
public class DemoPublisher {

    @Autowired
    ApplicationContext applicationContext;

    public void publish(String message){
        // Publish the event
        applicationContext.publishEvent(new DemoEvent(this, message));
    }
}

```

When you call `DemoPublisher`'s `publish()` method—for example, `demoPublisher.publish("Hello")`—the console prints: `Received message: Hello`.

## Adapter Pattern

The Adapter pattern converts the interface of a class into another interface that clients expect, allowing classes with incompatible interfaces to work together.

### Adapter Pattern in Spring AOP

We know that Spring AOP is implemented using the Proxy pattern, while Spring AOP's advice (enhancements) uses the Adapter pattern, centered around the `AdvisorAdapter` interface.

Common types of advice include `BeforeAdvice` (runs before target method invocation), `AfterAdvice` (runs after target method invocation), `AfterReturningAdvice` (runs after target method execution completes and before returning), and so on. Each advice type has a corresponding interceptor: `MethodBeforeAdviceInterceptor`, `AfterReturningAdviceInterceptor`, `ThrowsAdviceInterceptor`, etc.

Spring's predefined advice types are adapted through their corresponding adapters into objects implementing the `MethodInterceptor` interface (for instance, `MethodBeforeAdviceAdapter` adapts `MethodBeforeAdvice` into `MethodBeforeAdviceInterceptor` via `getInterceptor`).

### Adapter Pattern in Spring MVC

In Spring MVC, `DispatcherServlet` invokes `HandlerMapping` based on the incoming request to resolve the corresponding `Handler`. Once the `Handler` (commonly what we refer to as a `Controller`) is resolved, a `HandlerAdapter` takes over to execute it. Here, `HandlerAdapter` serves as the target interface expected by the client, concrete adapter implementations adapt specific handler types, and `Controller` acts as the adaptee.

**Why use the Adapter pattern in Spring MVC?**

Spring MVC supports many different kinds of `Controller`, and different `Controller` types process requests using different methods. Without the Adapter pattern, `DispatcherServlet` would have to inspect the exact `Controller` type directly and branch with conditional logic like the code below:

```java
if(mappedHandler.getHandler() instanceof MultiActionController){
   ((MultiActionController)mappedHandler.getHandler()).xxx
}else if(mappedHandler.getHandler() instanceof XXX){
    ...
}else if(...){
   ...
}
```

Whenever a new `Controller` type is added, another conditional branch would have to be inserted into the code above—making the codebase hard to maintain and violating the Open-Closed Principle of software design (open for extension, closed for modification).

## Decorator Pattern

The Decorator pattern dynamically attaches additional attributes or responsibilities to an object. Compared to inheritance, the Decorator pattern offers greater flexibility. Put simply, when we need to modify or extend existing behavior without altering the original source code directly, we wrap a Decorator around the original object. The JDK uses the Decorator pattern extensively—for example, in the `InputStream` hierarchy, subclasses such as `FileInputStream` (reading files) and `BufferedInputStream` (adding buffering to dramatically speed up file reads) extend `InputStream`'s capabilities without modifying `InputStream` itself.

![Decorator Pattern Diagram](/media/jg/ext/oss.javaguide.cn/github/javaguide/Decorator-675bb5dc.png)

## Summary

Which design patterns are used in the Spring Framework?

- **Factory Design Pattern**: Spring uses the Factory pattern to create bean objects via `BeanFactory` and `ApplicationContext`.
- **Proxy Design Pattern**: Powers the implementation of Spring AOP.
- **Singleton Design Pattern**: Beans in Spring default to singleton scope.
- **Template Method Pattern**: Database-access classes ending with `Template`, such as `JdbcTemplate` and `HibernateTemplate`, use the Template Method pattern.
- **Observer Pattern**: Spring's event-driven model is a classic application of the Observer pattern.
- **Adapter Pattern**: Spring AOP advice uses the Adapter pattern, and Spring MVC also uses the Adapter pattern to adapt `Controller` handlers.
- ...

## References

- *Spring Technology Insider*
- <https://blog.eduonix.com/java-programming-2/learn-design-patterns-used-spring-framework/>
- <https://www.tutorialsteacher.com/ioc/inversion-of-control>
- <https://design-patterns.readthedocs.io/zh_CN/latest/behavioral_patterns/observer.html>
- <https://juejin.im/post/5a8eb261f265da4e9e307230>
- <https://juejin.im/post/5ba28986f265da0abc2b6084>
