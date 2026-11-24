---
title: Spring Common Interview Questions Summary
description: Detailed explanation of core Spring Framework interview questions covering the IoC container, AOP principles, Bean lifecycle, dependency injection, transactions, and other key Spring topics.
category: Framework
tag:
  - Spring
lang: en
sourceRef: zh-ref/system-design/framework/spring/spring-knowledge-and-questions-summary.md
head:
  - - meta
    - name: keywords
      content: Spring Interview Questions,Spring Framework,Bean Lifecycle,IoC,AOP,Dependency Injection,Transactions,Spring Common Questions
---

This article aims to deepen your understanding of Spring through a series of targeted questions, so it will not involve too much code!

Many of the questions below are things I didn't pay much attention to when using Spring myself, so I looked up plenty of materials and books to fill in the gaps. There are also many articles online summarizing common Spring questions/interview questions, most of which feel like copies of one another—many of the questions aren't great, and some answers are flawed. Therefore, I spent a week of my spare time organizing this guide, and I hope it helps you.

## Spring Basics

### What is the Spring Framework?

Spring is an open-source, lightweight Java development framework designed to improve developer productivity and system maintainability.

When we talk about the Spring Framework, we generally mean a collection of modules that work together to make development much easier. For example, Spring supports IoC (Inversion of Control) and AOP (Aspect-Oriented Programming), provides convenient database access, integrates easily with third-party components (email, task scheduling, caching, etc.), offers strong support for unit testing, and supports building RESTful Java applications.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/38ef122122de4375abcd27c3de8f60b4-d6c7da9d.png)

The core philosophy of Spring is not to reinvent the wheel—offering out-of-the-box capabilities that boost development efficiency.

The name "Spring" literally means the spring season, reflecting its goal and mission: bringing a fresh spring to Java developers! How touching!

🤐 One extra remark: **The popularity of a programming language often depends on a killer application, and Spring is a killer application framework for the Java ecosystem.**

The core capabilities provided by Spring are mainly IoC and AOP. When learning Spring, you must thoroughly understand the core ideas behind IoC and AOP!

- Spring Official Website: <https://spring.io/>
- GitHub Repository: <https://github.com/spring-projects/spring-framework>

### What modules does Spring include?

**Spring 4.x**:

![Spring 4.x Main Modules](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/jvme0c60b4606711fc4a0b6faf03230247a-e87ccaaa.png)

**Spring 5.x**:

![Spring 5.x Main Modules](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/20200831175708-a59422a9.png)

In Spring 5.x, the Portlet component in the Web module was removed/deprecated, and the WebFlux component for asynchronous reactive processing was added.

The dependencies among the various Spring modules are shown below:

![Dependencies Among Spring Modules](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/20200902100038-5bbb84c8.png)

#### Core Container

This is the core—or foundational—module of the Spring Framework, primarily providing support for IoC and dependency injection. Almost all other features in Spring depend on this module, as can be seen from the Spring module dependency diagram above.

- **spring-core**: Basic core utility classes of the Spring Framework.
- **spring-beans**: Provides support for creating, configuring, and managing beans.
- **spring-context**: Provides support for internationalization, event propagation, resource loading, and more.
- **spring-expression**: Provides support for the Spring Expression Language (SpEL). It only depends on the core module and not on other modules, so it can be used standalone.

#### AOP

- **spring-aspects**: Provides integration with AspectJ.
- **spring-aop**: Provides an implementation of aspect-oriented programming.
- **spring-instrument**: Provides support for adding JVM agents. Specifically, it provides a weaving agent for Tomcat that can pass class files to Tomcat as if they were loaded by a ClassLoader. Don't worry if this isn't immediately clear—the use cases for this module are very limited.

#### Data Access/Integration

The module list below is mainly based on Spring Framework 5.x. Modern versions of Spring Framework have removed integrations with some legacy technologies; when using them in practice, refer to the official module list for your target Spring version.

- **spring-jdbc**: Provides a JDBC abstraction layer for database access. Different databases each have their own independent APIs for database operations, whereas Java programs only need to interact with the JDBC API, shielding the application from database-specific differences.
- **spring-tx**: Provides transaction management support.
- **spring-orm**: In Spring Framework 5.x, provides support for ORM technologies such as Hibernate and JPA; earlier Spring versions also provided iBATIS integration.
- **spring-oxm**: Provides OXM (Object-to-XML Mapping) abstractions. Different Spring versions support different concrete implementations, such as JAXB; Castor, XMLBeans, and JiBX belong to older version integrations.
- **spring-jms**: Messaging services. Since Spring Framework 4.1, it also inherits support for the `spring-messaging` module.

#### Spring Web

- **spring-web**: Provides basic web-oriented integration features.
- **spring-webmvc**: Provides the Spring MVC implementation.
- **spring-websocket**: Provides WebSocket support, enabling bidirectional communication between client and server.
- **spring-webflux**: Provides WebFlux support. Introduced in Spring Framework 5.0, WebFlux is a reactive, non-blocking web framework that can run on Netty or on Servlet containers supporting non-blocking I/O. Whether an application is end-to-end non-blocking also depends on whether data access and other downstream calls contain blocking operations.

#### Messaging

**spring-messaging** was introduced in Spring 4.0, primarily responsible for integrating foundational messaging capabilities into the Spring Framework.

#### Spring Test

The Spring team advocates Test-Driven Development (TDD). With the help of Inversion of Control (IoC), unit testing and integration testing become much easier.

Spring's test module provides solid support for commonly used testing frameworks such as JUnit (unit testing framework), TestNG (similar to JUnit), Mockito (mainly for mocking objects), and PowerMock (addressing Mockito limitations such as mocking `final`, `static`, and `private` methods).

### ⭐️What is the relationship between Spring, Spring MVC, and Spring Boot?

Many people get completely confused about the relationship between Spring, Spring MVC, and Spring Boot! Let's briefly explain them—it's actually very simple and nothing esoteric.

Spring consists of multiple functional modules (mentioned just above), the most important of which is `spring-core` (primarily providing IoC and dependency injection support). Other modules in Spring (such as Spring MVC) generally rely on this module for their implementation.

The diagram below corresponds to Spring 4.x. Spring 5.0 introduced WebFlux for reactive processing and phased out Portlet-related support; please refer to the official documentation for the module composition of modern Spring versions.

![Spring Main Modules](/media/jg/ext/oss.javaguide.cn/github/javaguide/jvme0c60b4606711fc4a0b6faf03230247a-6446e28d.png)

Spring MVC is an important module within Spring that gives Spring the ability to rapidly build MVC-based web applications. MVC stands for Model, View, Controller, and its core idea is to organize code by separating business logic, data, and presentation.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210809181452421-6736fa66.png)

Developing with Spring involves cumbersome configuration—for example, enabling certain Spring features requires explicit XML or Java configuration. As a result, Spring Boot was born!

Spring aims to simplify J2EE enterprise application development. Spring Boot aims to simplify Spring development (reducing configuration files and providing out-of-the-box defaults!).

Spring Boot only simplifies configuration. If you need to build an MVC-based web application, you still use Spring MVC as your MVC framework—it's just that Spring Boot handles much of the Spring MVC configuration for you, making it truly ready out of the box!

## Spring IoC

### ⭐️What is IoC?

IoC (Inversion of Control) is a design principle/concept, not a specific technical implementation. It describes how objects are created and managed in Java development.

For example, suppose class A depends on class B:

- **Traditional approach**: Class A manually creates an instance of class B using the `new` keyword.
- **IoC approach**: Instead of creating objects via `new`, the IoC container (the Spring Framework) instantiates and manages objects for us. Whenever we need an object, we simply retrieve it directly from the IoC container.

Comparing the two approaches: we "give up a power" (the power to create and manage objects), and in return we gain a major benefit (we no longer have to worry about object creation, lifecycle management, and so on).

**Why is it called Inversion of Control?**

- **Control**: Refers to the authority over object creation (instantiation and management).
- **Inversion**: That control is handed over to an external environment (the IoC container).

![IoC Illustration](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-00567db2.png)

### ⭐️What problems does IoC solve?

The core idea of IoC is that two parties do not directly depend on each other's concrete instantiation; instead, a third-party container manages the relevant resources. What benefits does this bring?

1. Lower coupling (or dependency) between objects;
2. Easier resource management; for instance, using the Spring container makes implementing a singleton effortless.

For example, suppose we have operations for `User` developed with a two-layer Service and Dao architecture.

Without IoC, if the Service layer wants to use a concrete implementation of the Dao layer, it has to manually instantiate the concrete implementation class `UserDaoImpl` of `IUserDao` inside `UserServiceImpl` using `new` (you cannot instantiate an interface directly with `new`).

That works fine at first, but imagine the following scenario:

During development, a new requirement comes in to create another concrete implementation for the `IUserDao` interface. Because the Service layer depends on the concrete implementation of `IUserDao`, we must modify the `new` statement in `UserServiceImpl`. If only one class references the concrete implementation of `IUserDao`, modifying it isn't too bad; however, if many places reference that concrete implementation, changing the implementation of `IUserDao` becomes a huge headache.

![IoC&Aop-ioc-illustration-dao-service](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-service-d83e5d28.png)

With IoC, we hand over the control of objects (creation and management) to the IoC container, and simply "ask" the IoC container for them when needed.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-5c2d69f4.png)

### What is a Spring Bean?

Simply put, a Bean refers to an object managed by the IoC container.

We need to tell the IoC container which objects to manage for us, which is defined through configuration metadata. Configuration metadata can be XML files, annotations, or Java configuration classes.

```xml
<!-- Constructor-arg with 'value' attribute -->
<bean id="..." class="...">
   <constructor-arg value="..."/>
</bean>
```

The diagram below illustrates how the IoC container uses configuration metadata to manage objects.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/062b422bd7ac4d53afd28fb74b2bc94d-6ce3218e.png)

The two packages `org.springframework.beans` and `org.springframework.context` form the foundation of Spring's IoC implementation. If you want to explore the IoC source code, start by looking there.

### What annotations declare a class as a Bean?

- `@Component`: A generic annotation that marks any class as a Spring component. If you aren't sure which layer a Bean belongs to, you can annotate it with `@Component`.
- `@Repository`: Corresponds to the persistence layer (Dao layer), mainly used for database-related operations.
- `@Service`: Corresponds to the service layer, mainly involving complex business logic that uses the Dao layer.
- `@Controller`: Corresponds to the Spring MVC controller layer, mainly responsible for receiving user requests, invoking the `Service` layer, and returning data to the frontend.

### What is the difference between @Component and @Bean?

- `@Component` is applied at the class level, whereas `@Bean` is applied at the method level.
- `@Component` is typically auto-detected via classpath scanning and automatically registered into the Spring container (we can use `@ComponentScan` to specify the package paths to scan for classes annotated for registration into the Spring bean container). `@Bean` is usually placed on a method that defines how to produce the bean—telling Spring, "this is an instance of a certain class; give it back to me when I need it."
- `@Bean` offers much stronger customization than `@Component`, and in many cases `@Bean` is the only way to register a bean. For example, when we need to register a class from a third-party library into the `Spring` container, we can only do so via `@Bean`.

Example of using `@Bean`:

```java
@Configuration
public class AppConfig {
    @Bean
    public TransferService transferService() {
        return new TransferServiceImpl();
    }

}
```

The code above is equivalent to the following XML configuration:

```xml
<beans>
    <bean id="transferService" class="com.acme.TransferServiceImpl"/>
</beans>
```

The following example cannot be achieved with `@Component`:

```java
@Bean
public OneService getService(status) {
    case (status)  {
        when 1:
                return new serviceImpl1();
        when 2:
                return new serviceImpl2();
        when 3:
                return new serviceImpl3();
    }
}
```

### What annotations are used to inject Beans?

`@Autowired` provided by Spring, along with `@Resource` and `@Inject` provided by Jakarta specifications, can all be used to inject Beans.

| Annotation   | Package                                        | Source                                 |
| ------------ | ---------------------------------------------- | -------------------------------------- |
| `@Autowired` | `org.springframework.beans.factory.annotation` | Spring 2.5+                            |
| `@Resource`  | `jakarta.annotation` (Spring 6+)               | Jakarta Annotations / JSR-250          |
| `@Inject`    | `jakarta.inject` (Spring 6+)                   | Jakarta Dependency Injection / JSR-330 |

`@Autowired` and `@Resource` are used more frequently.

### ⭐️What is the difference between @Autowired and @Resource?

`@Autowired` is Spring's built-in annotation. Its default injection logic is to **match by type (`byType`) first; if multiple Beans of the same type exist, it then tries to filter by name (`byName`)**.

Specifically:

1. It first looks up matching Beans in the Spring container by the interface/class type. If only one matching Bean is found, it injects it directly without considering the name;
2. If multiple Beans of the same type are found (for example, an interface with multiple implementation classes), it attempts to match the Bean name against the **field name or parameter name** (by default, the Bean name is the class name with the first letter lowercased, unless explicitly specified via `@Bean(name = "...")` or `@Component("...")`).

When an interface has multiple implementation classes:

- If the property/field name matches one of the Bean names, that Bean is injected;
- If the property/field name matches none of the Bean names, a `NoUniqueBeanDefinitionException` is thrown. In this case, you must explicitly specify the target Bean name using `@Qualifier`.

For example:

```java
// The SmsService interface has two implementations: SmsServiceImpl1 and SmsServiceImpl2 (both managed by Spring)

// Error: byType matches multiple Beans, and field name "smsService" matches neither default Bean name (smsServiceImpl1, smsServiceImpl2)
@Autowired
private SmsService smsService;

// Valid: field name "smsServiceImpl1" matches the default Bean name of SmsServiceImpl1
@Autowired
private SmsService smsServiceImpl1;

// Valid: explicitly specifies Bean name "smsServiceImpl1" via @Qualifier
@Autowired
@Qualifier(value = "smsServiceImpl1")
private SmsService smsService;
```

In real-world development, it is recommended to explicitly specify the name via `@Qualifier` rather than relying on the variable name.

`@Resource` comes from the **JSR-250** specification. In JDK 6 through JDK 10, `javax.annotation.Resource` was bundled with the JDK; starting from JDK 11, an external API dependency is required. Spring 5 / Java EE 8 projects typically use `javax.annotation-api`, while Spring 6 / Jakarta EE 9+ projects use `jakarta.annotation-api`.

Spring's handling logic for `@Resource` (with no arguments) is as follows:

1. **Match by name (`byName`)**: By default, it uses the field name as the bean name to look up in the container. If a Bean with that name is found, it injects it directly.
2. **Fallback to matching by type (`byType`)**: If **no** Bean with the same name is found, Spring falls back to looking up by the field's **type**. **Result evaluation for `byType` matching**:
   - **1 Bean found**: Injection succeeds.
   - **0 Beans found**: Throws an exception (`NoSuchBeanDefinitionException`).
   - **>1 Beans found**: Throws an exception (`NoUniqueBeanDefinitionException`).

`@Resource` has two important and commonly used attributes in daily development: `name` and `type`.

```java
public @interface Resource {
    String name() default "";
    Class<?> type() default Object.class;
}
```

If only the `name` attribute is specified, the injection mode is `byName`; if only the `type` attribute is specified, the injection mode is `byType`; if both `name` and `type` are specified (not recommended), the injection mode is `byType` + `byName`.

```java
// Error: neither byName nor byType can uniquely match a bean
@Resource
private SmsService smsService;
// Correctly injects the bean corresponding to SmsServiceImpl1
@Resource
private SmsService smsServiceImpl1;
// Correctly injects the bean corresponding to SmsServiceImpl1 (recommended approach)
@Resource(name = "smsServiceImpl1")
private SmsService smsService;
```

**Brief summary**:

- `@Autowired` is an annotation provided by Spring, while `@Resource` is provided by the Jakarta Annotations / JSR-250 specification.
- `@Autowired` defaults to `byType` injection (matching by type), whereas `@Resource` defaults to `byName` injection (matching by name).
- When an interface has multiple implementation classes, both `@Autowired` and `@Resource` require a name to uniquely match the corresponding Bean. `@Autowired` can explicitly specify the name via `@Qualifier`, while `@Resource` can specify it via the `name` attribute.
- `@Autowired` can be used on constructors, methods, fields, and parameters. `@Resource` is mainly used for field and method injection, and is not supported on constructors or parameters.

Considering that `@Resource` has clearer semantics (name-first) and is a Java standard that reduces tight coupling to the Spring Framework, we generally **prefer using `@Resource`**, especially when injection by name is needed. Meanwhile, `@Autowired` combined with constructor injection has advantages in enforcing immutability and mandatory dependencies, and is also a very good practice.

### What are the ways to inject Beans?

Common ways of Dependency Injection (DI):

1. Constructor injection: Injecting dependencies through the class constructor.
2. Setter injection: Injecting dependencies through Setter methods of the class.
3. Field injection: Injecting dependencies directly on class fields using annotations (such as `@Autowired` or `@Resource`).

Constructor injection example:

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //...
}
```

Setter injection example:

```java
@Service
public class UserService {

    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //...
}
```

Field injection example:

```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    //...
}
```

### ⭐️Constructor injection or Setter injection?

Spring's official documentation addresses this question: <https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html#beans-setter-injection>.

Here I will mainly extract, summarize, and expand on Spring's official recommendation.

**Spring officially recommends constructor injection**, which offers the following advantages:

1. Dependency completeness: Ensures all required dependencies are injected when the object is created, avoiding the risk of `NullPointerException`.
2. Immutability: Helps create immutable objects, improving thread safety.
3. Initialization guarantee: Components are fully initialized before use, reducing potential bugs.
4. Testability: In unit tests, mock dependencies can be passed directly through the constructor without needing the Spring container to perform injection.

Constructor injection is suitable for **mandatory dependencies**, whereas **Setter injection** is better suited for **optional dependencies** that can have default values or be dynamically configured during the object's lifecycle. Although `@Autowired` can be used on Setter methods for required dependencies, constructor injection remains the better choice.

In certain cases (such as third-party classes that do not expose Setter methods), constructor injection may be the **only option**.

### ⭐️What are the Bean scopes in Spring?

Common Bean scopes in Spring include:

- **singleton**: Only a single bean instance exists in the IoC container. Beans in Spring are singleton by default, applying the Singleton design pattern.
- **prototype**: A new bean instance is created every time it is requested. That is, calling `getBean()` twice in a row returns two different Bean instances.
- **request** (Web applications only): Every HTTP request produces a new bean (request bean), which is valid only within the current HTTP request.
- **session** (Web applications only): Every HTTP request from a new session produces a new bean (session bean), which is valid only within the current HTTP session.
- **application/global-session** (Web applications only): One Bean is created per web application at startup (application bean), valid for the lifetime of the application.
- **websocket** (Web applications only): A new bean is created for each WebSocket session.

**How do you configure a bean's scope?**

XML configuration:

```xml
<bean id="..." class="..." scope="singleton"></bean>
```

Annotation configuration:

```java
@Bean
@Scope(value = ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public Person personPrototype() {
    return new Person();
}
```

### ⭐️Are Beans thread-safe?

Whether a Bean in the Spring Framework is thread-safe depends on its scope and state.

Let's use the two most common scopes, `prototype` and `singleton`, as examples. In almost all scenarios, Beans use the default `singleton` scope, so we should focus primarily on `singleton`.

Under the `prototype` scope, requesting a bean from the container creates a new bean instance each time, which reduces the likelihood of container-level sharing; however, the scope itself does not guarantee thread safety: if callers share the same `prototype` instance across multiple threads, resource contention can still occur. Under the `singleton` scope, only one bean instance exists in the IoC container, making shared-state contention issues much more likely (depending on whether the Bean is stateful).

Stateful Bean example:

```java
// Defines a shopping cart class containing a List that stores items in the user's cart
@Component
public class ShoppingCart {
    private List<String> items = new ArrayList<>();

    public void addItem(String item) {
        items.add(item);
    }

    public List<String> getItems() {
        return items;
    }
}
```

However, most Beans in practice are stateless (they define no mutable member variables), such as DAOs and Services; in this case, the Bean is thread-safe.

Stateless Bean example:

```java
// Defines a user service that contains only business logic without holding any state
@Component
public class UserService {

    public User findUserById(Long id) {
        //...
    }
    //...
}
```

For thread-safety issues in stateful singleton Beans, there are three common solutions:

1. **Avoid mutable member variables**: Design Beans to be stateless whenever possible.
2. **Use `ThreadLocal`**: Store mutable member variables inside `ThreadLocal` to ensure thread isolation.
3. **Use synchronization mechanisms**: Use `synchronized` or `ReentrantLock` for synchronization control to ensure thread safety.

Here is an example using `ThreadLocal` to store user login information:

```java
public class UserThreadLocal {

    private UserThreadLocal() {}

    private static final ThreadLocal<SysUser> LOCAL = ThreadLocal.withInitial(() -> null);

    public static void put(SysUser sysUser) {
        LOCAL.set(sysUser);
    }

    public static SysUser get() {
        return LOCAL.get();
    }

    public static void remove() {
        LOCAL.remove();
    }
}
```

### ⭐️Do you understand the Bean lifecycle?

1. **Bean instantiation**: The Bean container first locates the Bean definition in the configuration, then selects an appropriate instantiation strategy (factory method, constructor autowiring, or simple instantiation) and creates the Bean instance via Java Reflection API.
2. **Populating Bean properties**: Sets the relevant properties and dependencies for the Bean, such as processing `@Autowired`, `@Value`, `@Resource`, and other annotations on fields or Setter methods.
3. **Bean initialization**:
   - If the Bean implements `BeanNameAware`, calls `setBeanName()` and passes in the Bean's name.
   - If the Bean implements `BeanClassLoaderAware`, calls `setBeanClassLoader()` and passes in the `ClassLoader` instance.
   - If the Bean implements `BeanFactoryAware`, calls `setBeanFactory()` and passes in the `BeanFactory` instance.
   - Similarly, if it implements other `*.Aware` interfaces, their corresponding methods are called.
   - If there are `BeanPostProcessor` objects associated with the Spring container loading this Bean, executes their `postProcessBeforeInitialization()` method.
   - If the Bean implements `InitializingBean`, executes `afterPropertiesSet()`.
   - If the Bean definition in the configuration includes an `init-method` attribute, executes the specified method.
   - If there are `BeanPostProcessor` objects associated with the Spring container loading this Bean, executes their `postProcessAfterInitialization()` method.
4. **Bean destruction**: Destruction doesn't mean destroying the Bean immediately; rather, it registers the Bean's destruction callbacks so that when the Bean or the container needs to be destroyed later, these methods are invoked to release resources held by the Bean.
   - If the Bean implements `DisposableBean`, executes `destroy()`.
   - If the Bean definition in the configuration includes a `destroy-method` attribute, executes the specified destruction method. Alternatively, you can directly mark a method with `@PreDestroy` to run before the Bean is destroyed.

In the `doCreateBean()` method of `AbstractAutowireCapableBeanFactory`, you can see these four phases executed in sequence:

```java
protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
    throws BeanCreationException {

    // 1. Instantiate the Bean
    BeanWrapper instanceWrapper = null;
    if (instanceWrapper == null) {
        instanceWrapper = createBeanInstance(beanName, mbd, args);
    }

    Object exposedObject = bean;
    try {
        // 2. Populate Bean properties
        populateBean(beanName, mbd, instanceWrapper);
        // 3. Initialize the Bean
        exposedObject = initializeBean(beanName, exposedObject, mbd);
    }

    // 4. Bean destruction - register destruction callbacks
    try {
        registerDisposableBeanIfNecessary(beanName, bean, mbd);
    }

    return exposedObject;
}
```

The `Aware` interfaces allow a Bean to obtain Spring container resources.

The main `Aware` interfaces provided by Spring include:

1. `BeanNameAware`: Injects the `beanName` corresponding to the current bean;
2. `BeanClassLoaderAware`: Injects the `ClassLoader` that loaded the current bean;
3. `BeanFactoryAware`: Injects a reference to the current `BeanFactory` container.

The `BeanPostProcessor` interface is a powerful extension point provided by Spring for modifying Beans.

```java
public interface BeanPostProcessor {

	// Pre-initialization processing
	default Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

	// Post-initialization processing
	default Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

}
```

- `postProcessBeforeInitialization`: Executed after Bean instantiation and property injection, and before `InitializingBean#afterPropertiesSet` and custom `init-method` methods;
- `postProcessAfterInitialization`: Similar to the above, except it executes after `InitializingBean#afterPropertiesSet` and custom `init-method` methods.

`InitializingBean` and `init-method` are extension points provided by Spring for Bean initialization.

```java
public interface InitializingBean {
 // Initialization logic
	void afterPropertiesSet() throws Exception;
}
```

Specifying the `init-method` attribute to define an initialization method:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="demo" class="com.chaycao.Demo" init-method="init"/>

</beans>
```

**How to memorize it?**

1. Overall, it can simply be broken down into four steps: Instantiation -> Property Population -> Initialization -> Destruction.
2. The initialization step involves more sub-steps, including dependency injection of `Aware` interfaces, pre- and post-initialization processing by `BeanPostProcessor`, and initialization operations via `InitializingBean` and `init-method`.
3. The destruction step registers the relevant destruction callback interfaces, and finally destroys the Bean via `DisposableBean` and `destroy-method`.

Finally, here is a clear diagram (source: [How to Memorize the Spring Bean Lifecycle](https://chaycao.github.io/2020/02/15/如何记忆Spring-Bean的生命周期.html)).

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/spring-bean-lifestyle-b04e8cd5.png)

## Spring AOP

### ⭐️Share your understanding of AOP

AOP (Aspect-Oriented Programming) encapsulates cross-cutting logic or responsibilities that are unrelated to core business logic yet shared across multiple business modules (such as transaction management, logging, permission control, etc.). This reduces duplicate code, lowers coupling between modules, and improves future extensibility and maintainability.

Spring AOP is based on dynamic proxies. If the target object to be proxied implements at least one interface, Spring AOP uses **JDK Proxy** to create the proxy object. If the object does not implement any interface, JDK Proxy cannot be used, so Spring AOP uses **Cglib** to generate a subclass of the target object as the proxy, as shown below:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/230ae587a322d6e4d09510161987d346-1e9492d2.jpg)

Of course, you can also use **AspectJ**! Spring AOP already integrates with AspectJ, which is arguably the most complete AOP framework in the Java ecosystem.

Key terminology in Aspect-Oriented Programming (AOP):

| Term      |                                               Meaning                                               |
| :-------- | :-------------------------------------------------------------------------------------------------: |
| Target    |                                      The object being advised                                       |
| Proxy     |                   The proxy object created after applying advice to the target object                |
| JoinPoint |             All methods defined in the class of the target object are join points                   |
| Pointcut  | Join points intercepted/enhanced by an aspect (a pointcut is always a join point, but not vice versa) |
| Advice    |    The enhancement logic/code—what to execute when a join point on the target object is intercepted   |
| Aspect    |                                         Pointcut + Advice                                           |
| Weaving   |              The process of applying advice to a target object to create a proxy object              |

### ⭐️What is the difference between Spring AOP and AspectJ AOP?

| Feature             | Spring AOP                                                              | AspectJ                                                       |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Weaving Method**  | Runtime enhancement (based on dynamic proxies)                          | Compile-time or load-time enhancement (direct bytecode manipulation) |
| **Pointcut Support**| Method-level (within Spring Beans; does not support `final` and `static` methods) | Methods, fields, constructors, static methods, etc.          |
| **Performance**     | Relies on runtime proxies, incurring some overhead; slower with many aspects | No runtime proxy overhead; higher performance                 |
| **Complexity**      | Simple, easy to use, suitable for most scenarios                        | Powerful, but relatively complex                              |
| **Use Cases**       | Simpler AOP requirements in Spring applications                         | High-performance, high-complexity AOP requirements            |

**How to choose?**

- **Functional considerations**: AspectJ supports more complex AOP scenarios, while Spring AOP is simpler and easier to use. If you need to advise `final` methods, static methods, field access, constructor calls, etc., or apply advice to objects not managed by Spring, AspectJ is the only option.
- **Performance considerations**: When there are few aspects, the performance difference is minimal; however, when there are many aspects, AspectJ offers better performance.

**One-sentence summary**: Prefer Spring AOP for simple scenarios; choose AspectJ for complex scenarios or high-performance requirements.

### ⭐️What are the common advice types in AOP?

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/aspectj-advice-types-ace45b9f.jpg)

- **Before**: Triggered before the target object's method is invoked.
- **After**: Triggered after the target object's method invocation finishes.
- **AfterReturning**: Triggered after the target object's method finishes and returns a result value.
- **AfterThrowing**: Triggered after the target object's method throws an exception during execution. `AfterReturning` and `AfterThrowing` are mutually exclusive: if the method succeeds without throwing an exception, there is a return value; if it throws an exception, there is no return value.
- **Around**: Programmatically controls the invocation of the target object's method. Around advice is the most powerful advice type because it has direct access to both the target object and the method to be executed, allowing it to perform custom actions before and after the target method invocation—or even skip calling the target method altogether.

### How do you control the execution order of multiple aspects?

1. Usually, use the `@Order` annotation directly to define the aspect order:

```java
// Smaller value means higher priority
@Order(3)
@Component
@Aspect
public class LoggingAspect implements Ordered {
```

**2. Implement the `Ordered` interface and override the `getOrder` method.**

```java
@Component
@Aspect
public class LoggingAspect implements Ordered {

    // ....

    @Override
    public int getOrder() {
        // Smaller return value means higher priority
        return 1;
    }
}
```

## Spring MVC

### Share your understanding of Spring MVC

MVC stands for Model, View, and Controller. Its core idea is to organize code by separating business logic, data, and presentation.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210809181452421-6736fa66.png)

Many people online say that MVC is not a design pattern, only a software architectural specification. Personally, I tend to consider MVC one of the many design patterns. The **[java-design-patterns](https://github.com/iluwatar/java-design-patterns)** repository also includes an introduction to MVC.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/159b3d3e70dd45e6afa81bf06d09264e-302b7137.png)

To truly understand Spring MVC, let's first look back at the Model 1 and Model 2 eras before Spring MVC existed.

**Model 1 Era**

Many developers who started learning Java backend later may never have encountered JavaWeb application development in the Model 1 era. Under Model 1, almost the entire web application was made up of JSP pages, with only a small number of JavaBeans handling database connections, queries, and similar operations.

In this model, JSP acted as both the Controller layer and the View layer. Clearly, this approach had many problems: mixing control logic with presentation logic led to extremely low code reuse, while tight coupling between frontend and backend made testing and maintenance difficult and development efficiency very low.

![mvc-mode1](/media/jg/ext/oss.javaguide.cn/java-guide-blog/mvc-mode1-54ff9f98.png)

**Model 2 Era**

Developers who have studied Servlets and built small demos are likely familiar with the "JavaBean (Model) + JSP (View) + Servlet (Controller)" pattern—this was the early JavaWeb MVC development model.

- Model: Data involved in the system, namely DAOs and Beans.
- View: Displays the data from the model; used solely for presentation.
- Controller: Receives user requests, dispatches them to the Model, and finally returns data to JSP for rendering to the user.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/mvc-model2-b3630bee.png)

Model 2 still had many shortcomings. Its degree of abstraction and encapsulation was far from sufficient; developing with Model 2 inevitably meant reinventing the wheel, which greatly reduced maintainability and reusability.

As a result, many JavaWeb MVC frameworks emerged, such as Struts2, though Struts2 was rather heavyweight.

**Spring MVC Era**

With the rising popularity of the lightweight Spring framework, Spring MVC emerged within the Spring ecosystem and became the finest MVC framework available. Compared with Struts2, Spring MVC is simpler and easier to use, boosts development efficiency, and runs faster.

MVC is a design pattern, and Spring MVC is an excellent MVC framework. Spring MVC helps us write cleaner web-layer code and integrates natively with the Spring Framework. In Spring MVC projects, we typically structure the backend into the Service layer (handling business logic), DAO layer (database operations), Entity layer (entity classes), and Controller layer (controller layer that handles requests and returns data to the frontend).

### What are the core components of Spring MVC?

Remembering the following components means remembering how Spring MVC works:

- **`DispatcherServlet`**: **The core central dispatcher**, responsible for receiving requests, dispatching them, and returning responses to the client.
- **`HandlerMapping`**: **Handler mapper**, which looks up a matching `Handler` based on the request URL and wraps the associated interceptors together with the `Handler`.
- **`HandlerAdapter`**: **Handler adapter**, which adapts and executes the corresponding `Handler` found by `HandlerMapping`.
- **`Handler`**: **Request handler**, the actual component that processes the request.
- **`ViewResolver`**: **View resolver**, which resolves a logical view returned by the `Handler` into a concrete view, renders it, and passes it back to `DispatcherServlet` to respond to the client.

### ⭐️Do you know how Spring MVC works?

**The working principle of Spring MVC is shown below:**

> I didn't draw this Spring MVC workflow diagram myself—I took a shortcut and found a very clear, intuitive one online (original source unknown).

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/de6d2b213f112297298f3e223bf08f28-f647bc8f.png)

**Step-by-step workflow (important):**

1. The client (browser) sends a request, and `DispatcherServlet` intercepts it.
2. `DispatcherServlet` calls `HandlerMapping` based on the request details. `HandlerMapping` matches the URL to find a `Handler` (what we normally call a `Controller`) capable of handling the request, and packages the associated interceptors together with the `Handler`.
3. `DispatcherServlet` calls `HandlerAdapter` to execute the `Handler`.
4. After processing the user request, the `Handler` returns a `ModelAndView` object to `DispatcherServlet`. As the name suggests, `ModelAndView` contains both the data model and view information (`Model` is the returned data object, and `View` is a logical view).
5. `ViewResolver` locates the actual `View` based on the logical `View`.
6. `DispatcherServlet` passes the returned `Model` to the `View` (view rendering).
7. The rendered `View` is returned to the requester (browser).

The workflow above describes the traditional server-side rendering model (JSP, Thymeleaf, etc.). However, the mainstream approach today is frontend-backend separation, which changes the role of `View` in Spring MVC. Since the `View` is usually handled by frontend frameworks (Vue, React, etc.), the backend no longer renders HTML pages and only provides data. Therefore:

- In frontend-backend separated architectures, the backend typically no longer returns a concrete view, but instead returns **raw data** (usually in JSON format), leaving rendering and presentation to the frontend.
- The `View` part often doesn't need to be configured in frontend-backend separated scenarios. Spring MVC controller methods simply return data directly rather than returning `ModelAndView`, and Spring automatically converts it to JSON. Accordingly, `ViewResolver` is no longer used.

How is this achieved?

- Use the `@RestController` annotation instead of the traditional `@Controller` annotation, so all methods return JSON-formatted data by default instead of attempting to resolve a view.
- If you use `@Controller`, you can combine it with `@ResponseBody` to return JSON.

### How do you implement global exception handling?

Annotation-based unified exception handling is recommended, specifically using `@ControllerAdvice` + `@ExceptionHandler`.

```java
@ControllerAdvice
@ResponseBody
public class GlobalExceptionHandler {

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<?> handleAppException(BaseException ex, HttpServletRequest request) {
      //......
    }

    @ExceptionHandler(value = ResourceNotFoundException.class)
    public ResponseEntity<ErrorReponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
      //......
    }
}
```

This exception-handling mechanism does not create an AOP proxy for the `Controller`. After a `Controller` method throws an exception, Spring MVC searches through the `HandlerExceptionResolver` chain to find an `@ExceptionHandler` method capable of handling that exception.

The `getMappedMethod` method in `ExceptionHandlerMethodResolver` determines which `@ExceptionHandler`-annotated method handles the exception:

```java
@Nullable
  private Method getMappedMethod(Class<? extends Throwable> exceptionType) {
    List<Class<? extends Throwable>> matches = new ArrayList<>();
    // Find all matching exception types. mappedMethods stores the mapping between exceptions and handler methods
    for (Class<? extends Throwable> mappedException : this.mappedMethods.keySet()) {
      if (mappedException.isAssignableFrom(exceptionType)) {
        matches.add(mappedException);
      }
    }
    // If non-empty, there are methods that can handle this exception
    if (!matches.isEmpty()) {
      // Sort by matching specificity in ascending order
      matches.sort(new ExceptionDepthComparator(exceptionType));
      // Return the best-matching handler method
      return this.mappedMethods.get(matches.get(0));
    }
    else {
      return null;
    }
  }
```

From the source code, we can see: **`getMappedMethod()` first finds all methods capable of matching and handling the exception, sorts them in ascending order of inheritance depth, and finally picks the smallest match (i.e., the closest/most specific match).**

## What design patterns are used in the Spring Framework?

> For a detailed breakdown of these design patterns, check out my article [Detailed Explanation of Design Patterns in Spring](https://javaguide.cn/system-design/framework/spring/spring-design-patterns-summary.html).

- **Factory Pattern**: Spring uses the Factory pattern to create bean objects via `BeanFactory` and `ApplicationContext`.
- **Proxy Pattern**: Implementation of Spring AOP features.
- **Singleton Pattern**: Beans in Spring are singleton by default.
- **Template Method Pattern**: Database operation classes in Spring ending with `Template`, such as `JdbcTemplate` and `HibernateTemplate`, use the Template Method pattern.
- **Wrapper/Decorator Pattern**: When a project needs to connect to multiple databases and different clients need to access different databases per request, this pattern allows dynamically switching data sources based on client requirements.
- **Observer Pattern**: Spring's event-driven model is a classic application of the Observer pattern.
- **Adapter Pattern**: Spring AOP advices (enhancements) use the Adapter pattern, and Spring MVC also uses the Adapter pattern to adapt `Controller` handlers.
- ...

## ⭐️Circular Dependencies in Spring

### Do you know about circular dependencies in Spring, and how does Spring resolve them?

A circular dependency occurs when Bean objects reference each other in a cycle—meaning two or more Beans hold references to one another, for example: `CircularDependencyA` -> `CircularDependencyB` -> `CircularDependencyA`.

```java
@Component
public class CircularDependencyA {
    @Autowired
    private CircularDependencyB circB;
}

@Component
public class CircularDependencyB {
    @Autowired
    private CircularDependencyA circA;
}
```

Self-dependency of a single object can also cause a circular dependency, though this is extremely rare and represents a coding mistake.

```java
@Component
public class CircularDependencyA {
    @Autowired
    private CircularDependencyA circA;
}
```

The Spring Framework can resolve certain Setter/field-injection circular dependencies among singleton Beans via a three-level cache. Scenarios such as constructor circular dependencies and prototype Bean circular dependencies cannot be resolved by this mechanism.

The three-level cache in Spring is actually three `Map`s, as shown below:

```java
// Level-1 cache
/** Cache of singleton objects: bean name to bean instance. */
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

// Level-2 cache
/** Cache of early singleton objects: bean name to bean instance. */
private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);

// Level-3 cache
/** Cache of singleton factories: bean name to ObjectFactory. */
private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);
```

Briefly, Spring's three-level cache consists of:

1. **Level-1 Cache (`singletonObjects`)**: Stores fully formed Beans (instantiated, populated with properties, and initialized)—the singleton pool born for "Spring's singleton nature". Normally we retrieve Beans from here, though not all Beans reside in the singleton pool (for example, prototype Beans do not).
2. **Level-2 Cache (`earlySingletonObjects`)**: Stores transitional Beans (semi-finished objects whose properties have not yet been populated), i.e., objects produced by `ObjectFactory` in the level-3 cache. Working together with the level-3 cache, it prevents generating a new proxy object every time `ObjectFactory#getObject()` is called in AOP scenarios.
3. **Level-3 Cache (`singletonFactories`)**: Stores `ObjectFactory`. Its `getObject()` method (which ultimately calls `getEarlyBeanReference()`) can produce either the raw Bean object or a proxy object (if the Bean is proxied by an AOP aspect). The three-level cache only applies to singleton Beans.

Next, let's walk through Spring's Bean retrieval/creation flow:

1. First, look up the **level-1 cache `singletonObjects`**; if present, return it;
2. If not present or the object is currently under creation, check the **level-2 cache `earlySingletonObjects`**;
3. If still not found, check the **level-3 cache `singletonFactories`**, invoke `ObjectFactory.getObject()` to obtain the object, and upon success remove it from the level-3 cache and place it into the level-2 cache.

The level-3 cache stores `ObjectFactory`:

```java
public interface ObjectFactory<T> {
    T getObject() throws BeansException;
}
```

When Spring creates a Bean, if circular references are allowed, Spring exposes the newly instantiated Bean—whose properties have not yet been initialized—early by adding an `ObjectFactory` to the level-3 cache via `addSingletonFactory`:

```java
// AbstractAutowireCapableBeanFactory # doCreateBean #
public abstract class AbstractAutowireCapableBeanFactory ... {
	protected Object doCreateBean(...) {
        //...

        // Support circular dependencies: add ()->getEarlyBeanReference as the getObject() method of an ObjectFactory into the level-3 cache
		addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
    }
}
```

As mentioned in the Spring Bean creation flow above, when neither the level-1 nor the level-2 cache has the object, Spring queries the level-3 cache and obtains the object via `ObjectFactory`'s `getObject` method.

```java
class A {
    // Uses B
    private B b;
}
class B {
    // Uses A
    private A a;
}
```

Taking the circular dependency code above as an example, the entire resolution process works as follows:

- After Spring creates `A`, it discovers `A` depends on `B`, so it proceeds to create `B`; `B` depends on `A`, so it attempts to get/create `A`;
- When `B` needs `A`, a circular dependency occurs on `A`. Because `A` has not finished initializing yet, `A` is definitely not in the **level-1 or level-2 caches**;
- Therefore, Spring goes to the level-3 cache and invokes `getObject()` to obtain `A`'s **early-exposed object**—that is, calling the `getEarlyBeanReference()` method added earlier to generate an **early-exposed object** for `A`;
- Then this `ObjectFactory` is removed from the level-3 cache and the early-exposed object is placed into the level-2 cache, allowing `B` to inject that early-exposed object as its dependency and resolve the circular dependency.

**Is a two-level cache enough?** Without AOP, a level-1 and level-2 cache would indeed suffice to resolve circular dependencies. However, when AOP is involved, the level-3 cache becomes crucial because it ensures that even if multiple early-reference requests occur during Bean creation, the exact same proxy object is always returned—preventing the issue of creating multiple proxy objects for the same Bean.

**To summarize how Spring resolves circular dependencies with the three-level cache**:

For the three-level cache, the key takeaway is how Spring supports circular dependencies: when a circular dependency occurs, Spring retrieves the `ObjectFactory` stored in the **level-3 cache `singletonFactories`**, calls its `getObject()` method to obtain the early-exposed object of the circularly dependent Bean (even though initialization isn't complete yet, its heap address is already available), and puts this early-exposed object into the level-2 cache so that repeated initialization does not occur during circular dependency resolution!

However, this mechanism also has drawbacks, such as increased memory overhead (maintaining three caches, i.e., three Maps) and reduced performance (requiring multiple lookups and conversions). Moreover, it only applies to certain Setter/field-injection circular dependencies for singleton Beans; non-singleton Beans, constructor circular dependencies, and similar cases still cannot be resolved by the three-level cache.

### Can @Lazy resolve circular dependencies?

`@Lazy` is used to indicate whether a class or bean needs lazy initialization/lazy loading, and can be applied to classes, methods, constructors, method parameters, and fields.

Spring Boot 2.2 introduced a **global lazy initialization property**. When enabled, all beans globally are set to lazy initialization and are only created when needed.

Configuring global lazy initialization in a properties file:

```properties
# Defaults to false
spring.main.lazy-initialization=true
```

Configuring global lazy initialization programmatically:

```java
SpringApplication springApplication=new SpringApplication(Start.class);
springApplication.setLazyInitialization(true);
springApplication.run(args);
```

Unless necessary, avoid enabling global lazy initialization. It slows down the first use of Beans and delays surfacing application errors (issues only appear when the Bean is eventually initialized).

If a Bean is not marked as lazy, it is created and initialized during Spring IoC container startup. If a Bean is marked as lazy, it is not instantiated immediately when the IoC container starts, but only when first requested. This helps reduce startup initialization time and can also be used to break circular dependencies.

How does `@Lazy` resolve a circular dependency? Suppose two Beans, `A` and `B`, have a circular dependency. You can add `@Lazy` on `A`'s injection point for `B`—for example, on the constructor parameter `A(@Lazy B b)`. In this case, what gets lazily resolved is the dependency `B`, rather than simply putting `@Lazy` on `A`'s constructor or class.

- First, Spring creates Bean `A`, which needs `B` injected;
- Because `@Lazy` is placed on `A`'s injection point for `B`, Spring creates a lazy-resolution proxy object for `B` and injects that proxy into `A`;
- Next, Spring proceeds to instantiate and initialize `B`. When injecting `A` into `B`, `A` has already finished creating, so `A` can be injected directly into `B`.

From the loading flow above, the key to `@Lazy` resolving circular dependencies lies in using a proxy object:

- **Without `@Lazy`**: When initializing `A`, the Spring container immediately attempts to create `B`, and while creating `B` it attempts to create `A`, resulting in a circular dependency (infinite recursion that ultimately throws an exception).
- **With `@Lazy`**: Spring does not create `B` immediately, but instead injects a proxy object for `B`. Since `B` has not actually been initialized yet, `A`'s initialization completes smoothly. When the `A` instance later invokes a method on `B`, the proxy triggers the real initialization of `B`.

`@Lazy` injection-point proxies can break circular dependency chains to some extent, including certain constructor injection scenarios. However, this does not eliminate the circular dependency at the design level, and under complex dependency graphs it may introduce subtler initialization bugs; therefore, the best practice is still to avoid circular dependencies in your design whenever possible.

### Does Spring Boot allow circular dependencies?

Prior to Spring Boot 2.6.x, circular dependencies were allowed by default—meaning if your code had circular dependencies, it generally would not throw an error. Starting with Spring Boot 2.6.x, the Spring team officially discourages writing code with circular dependencies and recommends that developers reduce unnecessary mutual dependencies. This is indeed what we should do: circular dependencies themselves indicate a design flaw, and we shouldn't over-rely on Spring while neglecting coding standards and quality—who knows, a future Spring Boot version might forbid circular dependencies altogether.

In Spring Boot 2.6.x and later, if you don't want to refactor code with circular dependencies right away, you can use the following workarounds:

- Enable circular references globally in configuration: `spring.main.allow-circular-references=true`. This is the simplest brute-force option, though not recommended.
- Add the `@Lazy` annotation to the Bean/injection point causing the circular dependency—a relatively more recommended approach. `@Lazy` marks a dependency or bean for lazy initialization/loading and can be placed on classes, methods, constructors, method parameters, and fields.
- ...

## ⭐️Spring Transactions

For a detailed introduction to Spring transactions, see my article [Detailed Explanation of Spring Transactions](https://javaguide.cn/system-design/framework/spring/spring-transaction.html).

### What ways does Spring provide to manage transactions?

- **Programmatic transaction management**: Hardcoded in code (recommended in distributed systems)—manually managing transactions via `TransactionTemplate` or `TransactionManager`. If a transaction scope is too large, uncommitted transactions can cause timeouts, so transaction granularity should be smaller than lock granularity.
- **Declarative transaction management**: Configured in XML files or directly via annotations (recommended for monolithic applications or simple business systems)—implemented under the hood via AOP (the annotation-based `@Transactional` approach is the most widely used).

### What transaction propagation behaviors exist in Spring?

**Transaction propagation behaviors are designed to solve transaction handling issues when business-layer methods call one another.**

When a transactional method is invoked by another transactional method, we must specify how the transaction should propagate. For example, the method may continue running in the existing transaction, or it may start a new transaction and run within its own transaction.

The valid transaction propagation behavior values are as follows:

**1. `TransactionDefinition.PROPAGATION_REQUIRED`**

The most commonly used propagation behavior—and the default used by `@Transactional`. If a transaction currently exists, join that transaction; if no transaction currently exists, create a new one.

**2. `TransactionDefinition.PROPAGATION_REQUIRES_NEW`**

Create a new transaction, suspending the current transaction if one exists. In other words, regardless of whether the outer method has a transaction enabled, the inner method annotated with `Propagation.REQUIRES_NEW` starts its own independent transaction, and the two transactions do not interfere with each other.

**3. `TransactionDefinition.PROPAGATION_NESTED`**

If a transaction currently exists, run within a nested transaction inside the current transaction; if no transaction currently exists, it behaves identically to `TransactionDefinition.PROPAGATION_REQUIRED`.

**4. `TransactionDefinition.PROPAGATION_MANDATORY`**

If a transaction currently exists, join that transaction; if no transaction currently exists, throw an exception.

This one is rarely used.

The remaining 3 transaction propagation behaviors are also valid configurations and should be understood based on whether an outer transaction exists:

- **`TransactionDefinition.PROPAGATION_SUPPORTS`**: If a transaction currently exists, join that transaction; if no transaction currently exists, continue executing non-transactionally.
- **`TransactionDefinition.PROPAGATION_NOT_SUPPORTED`**: Execute non-transactionally; if a transaction currently exists, suspend it.
- **`TransactionDefinition.PROPAGATION_NEVER`**: Execute non-transactionally; if a transaction currently exists, throw an exception.

### What transaction isolation levels exist in Spring?

Just like transaction propagation behaviors, Spring defines a convenient enum for isolation levels: `Isolation`.

```java
public enum Isolation {

    DEFAULT(TransactionDefinition.ISOLATION_DEFAULT),
    READ_UNCOMMITTED(TransactionDefinition.ISOLATION_READ_UNCOMMITTED),
    READ_COMMITTED(TransactionDefinition.ISOLATION_READ_COMMITTED),
    REPEATABLE_READ(TransactionDefinition.ISOLATION_REPEATABLE_READ),
    SERIALIZABLE(TransactionDefinition.ISOLATION_SERIALIZABLE);

    private final int value;

    Isolation(int value) {
        this.value = value;
    }

    public int value() {
        return this.value;
    }

}
```

Let's examine each transaction isolation level in turn:

- **`TransactionDefinition.ISOLATION_DEFAULT`**: Uses the default isolation level of the underlying database. MySQL defaults to `REPEATABLE_READ`, while Oracle defaults to `READ_COMMITTED`.
- **`TransactionDefinition.ISOLATION_READ_UNCOMMITTED`**: The lowest isolation level and rarely used, because it allows reading uncommitted data changes, **which can lead to dirty reads, phantom reads, or non-repeatable reads**.
- **`TransactionDefinition.ISOLATION_READ_COMMITTED`**: Allows reading data committed by concurrent transactions. **It prevents dirty reads, but phantom reads and non-repeatable reads can still occur**.
- **`TransactionDefinition.ISOLATION_REPEATABLE_READ`**: Repeated reads of the same field return consistent results unless modified by the transaction itself. **It prevents dirty reads and non-repeatable reads, though phantom reads may still occur.**
- **`TransactionDefinition.ISOLATION_SERIALIZABLE`**: The highest isolation level, strictly complying with ACID. All transactions execute sequentially one after another so they cannot interfere with each other—meaning **it prevents dirty reads, non-repeatable reads, and phantom reads**. However, it severely degrades application performance and is rarely used in practice.

### Do you know `@Transactional(rollbackFor = Exception.class)`?

`Exception` is divided into runtime exceptions (`RuntimeException`) and non-runtime (checked) exceptions. Transaction management is critical for enterprise applications—it ensures data consistency even when exceptions occur.

When `@Transactional` is placed at the class level, all `public` methods of that class inherit those transaction attributes; we can also override the class-level definition at the method level.

The default rollback policy of `@Transactional` only rolls back when encountering a `RuntimeException` or an `Error`, and does not roll back on `Checked Exception`s. This is because Spring treats `RuntimeException` and `Error` as unexpected failures, whereas checked exceptions are considered expected conditions that can be handled by business logic.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/spring-transactional-rollbackfor-78674728.png)

To customize the default rollback strategy, use the `rollbackFor` and `noRollbackFor` attributes of `@Transactional` to specify which exceptions should trigger a rollback and which should not. For example, to roll back the transaction on all exceptions:

```java
@Transactional(rollbackFor = Exception.class)
public void someMethod() {
// some business logic
}
```

To prevent specific exceptions from rolling back the transaction:

```java
@Transactional(noRollbackFor = CustomException.class)
public void someMethod() {
// some business logic
}
```

## Spring Data JPA

With JPA, hands-on practice matters most; here we only summarize a small set of key points.

### How do you prevent a field from being persisted to the database in JPA?

Suppose we have the following class:

```java
@Entity(name="USER")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")
    private Long id;

    @Column(name="USER_NAME")
    private String userName;

    @Column(name="PASSWORD")
    private String password;

    private String secrect;

}
```

If we don't want the `secrect` field to be persisted (i.e., not stored in the database), we can use any of the following approaches:

```java
static String transient1; // not persistent because of static
final String transient2 = "Satish"; // not persistent because of final
transient String transient3; // not persistent because of transient
@Transient
String transient4; // not persistent because of @Transient
```

Generally, the last two approaches are used more often; personally, I prefer using the annotation.

### What is JPA auditing for, and why is it useful?

The auditing feature helps automatically record specific database operation details—such as who created a record, when it was created, who last modified it, and when it was last modified.

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
@MappedSuperclass
@EntityListeners(value = AuditingEntityListener.class)
public abstract class AbstractAuditBase {

    @CreatedDate
    @Column(updatable = false)
    @JsonIgnore
    private Instant createdAt;

    @LastModifiedDate
    @JsonIgnore
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    @JsonIgnore
    private String createdBy;

    @LastModifiedBy
    @JsonIgnore
    private String updatedBy;
}
```

- `@CreatedDate`: Indicates the creation timestamp field; its value is automatically set when the entity is inserted.

- `@CreatedBy`: Indicates the creator field; its value is automatically set when the entity is inserted.

  `@LastModifiedDate` and `@LastModifiedBy` work similarly.

### What are the entity relationship annotations in JPA?

- `@OneToOne`: One-to-one.
- `@ManyToMany`: Many-to-many.
- `@OneToMany`: One-to-many.
- `@ManyToOne`: Many-to-one.

You can also represent a many-to-many relationship by combining `@ManyToOne` and `@OneToMany`.

## Spring Security

With Spring Security, hands-on practice matters most; here we only summarize a small set of key points.

### What methods are available for controlling request access permissions?

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/image-20220728201854641-efc4be3a.png)

- `permitAll()`: Unconditionally allows any access, whether logged in or not.
- `anonymous()`: Allows anonymous access—only unauthenticated users can access.
- `denyAll()`: Unconditionally denies all forms of access.
- `authenticated()`: Allows only authenticated users.
- `fullyAuthenticated()`: Allows only fully authenticated users; anonymous or remember-me authentication is not accepted.
- `hasRole(String)`: Allows only users with the specified role.
- `hasAnyRole(String)`: Specifies one or more roles; users matching any of them can access.
- `hasAuthority(String)`: Allows only users with the specified authority/permission.
- `hasAnyAuthority(String)`: Specifies one or more authorities/permissions; users matching any of them can access.
- `hasIpAddress(String)`: Allows only users from the specified IP address.

### Is there a difference between `hasRole` and `hasAuthority`?

You can check out this detailed article by Song Ge: [Is there a difference between hasRole and hasAuthority in Spring Security?](https://mp.weixin.qq.com/s/GTNOa2k9_n_H0w24upClRw).

### ⭐️How should passwords be encrypted?

When storing sensitive data like passwords in a database, we should encode them using an adaptive one-way hash function before saving, rather than using reversible encryption.

Spring Security provides several out-of-the-box password encoding implementations. These implementations share the `PasswordEncoder` interface; if you need a custom password encoding scheme, you also implement `PasswordEncoder`.

The `PasswordEncoder` interface defines two abstract methods that must be implemented—`encode()` and `matches()`—and a default method `upgradeEncoding()` that can be overridden as needed.

```java
public interface PasswordEncoder {
    // Perform one-way encoding on the raw password
    String encode(CharSequence var1);
    // Compare the raw password against the encoded password stored in the database
    boolean matches(CharSequence var1, String var2);
    // Check whether the encoded password needs to be re-encoded/upgraded; defaults to false
    default boolean upgradeEncoding(String encodedPassword) {
        return false;
    }
}
```

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/image-20220728183540954-b4a81c28.png)

Spring Security officially recommends using an adaptive one-way function with a tunable work factor tuned to your system's performance for verification latency—such as bcrypt, PBKDF2, scrypt, or Argon2.

### How can you gracefully switch the password encryption algorithm used by a system?

If during development you find that the existing password encoding algorithm no longer meets your requirements and need to switch to another one, what should you do?

The recommended approach is to use `DelegatingPasswordEncoder` to stay compatible with multiple password encoding schemes and adapt to different business requirements.

As its name implies, `DelegatingPasswordEncoder` is actually a delegating proxy class rather than a brand-new encryption algorithm—it delegates to the `PasswordEncoder` implementations mentioned above. Since Spring Security 5.0, password encoding is based on `DelegatingPasswordEncoder` by default.

## References

- *Spring Internals*
- *Deep Dive into Spring from Scratch*: <https://juejin.cn/book/6857911863016390663>
- <http://www.cnblogs.com/wmyskxz/p/8820371.html>
- <https://www.journaldev.com/2696/spring-interview-questions-and-answers>
- <https://www.edureka.co/blog/interview-questions/spring-interview-questions/>
- <https://www.cnblogs.com/clwydjgs/p/9317849.html>
- <https://howtodoinjava.com/interview-questions/top-spring-interview-questions-with-answers/>
- <http://www.tomaszezula.com/2014/02/09/spring-series-part-5-component-vs-bean/>
- <https://stackoverflow.com/questions/34172888/difference-between-bean-and-autowired>
