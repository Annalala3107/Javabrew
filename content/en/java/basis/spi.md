---
title: Detailed Guide to Java SPI Mechanism
description: "Comprehensive explanation of the Java SPI mechanism, its principles, and applications: understanding ServiceLoader service discovery, SPI in JDBC/Dubbo/Spring, comparison with APIs, and best practices."
category: Java
tag:
  - Java Basics
head:
  - - meta
    - name: keywords
      content: Java SPI,SPI mechanism,ServiceLoader,service discovery,plugin architecture,JDBC driver loading,Dubbo extension,SPI applications
lang: en
sourceRef: zh-ref/java/basis/spi.md
---

> This article was contributed by [Kingshion](https://github.com/jjx0708). More contributors are welcome to join the maintenance of JavaGuide — it is a very meaningful endeavor. For more details, please see the [JavaGuide Contribution Guide](https://javaguide.cn/javaguide/contribution-guideline.html).

Object-oriented design encourages modules to program against interfaces rather than concrete implementations in order to reduce coupling between modules, follow the Dependency Inversion Principle, and support the Open-Closed Principle (open for extension, closed for modification). However, directly depending on a concrete implementation requires modifying code whenever the implementation is replaced, which violates the Open-Closed Principle. To solve this problem, SPI emerged, providing a service discovery mechanism that allows concrete implementations to be specified dynamically outside the program. This is similar to the idea of Inversion of Control (IoC), transferring control of component assembly outside the application.

The SPI mechanism also addresses the limitations imposed by the Parent Delegation Model in Java's class loading hierarchy. Although the [Parent Delegation Model](https://javaguide.cn/java/jvm/classloader.html) ensures the security and consistency of core libraries, it also restricts core or extension libraries from loading classes on the application classpath (which are typically implemented by third parties). SPI allows core or extension libraries to define service interfaces while third-party developers provide and deploy implementations, and the SPI service loading mechanism dynamically discovers and loads these implementations at runtime. For example, JDBC 4.0 and later versions use SPI to automatically discover and load database drivers; developers only need to place the driver JAR on the classpath without explicitly loading the driver class via `Class.forName()`.

## Introduction to SPI

### What Is SPI?

SPI stands for Service Provider Interface, which literally means "an interface for service providers." In my understanding, it is an interface specifically provided for service providers or developers extending framework functionality.

SPI separates the service interface from concrete service implementations, decoupling the service caller from the service provider and improving program extensibility and maintainability. Modifying or replacing a service implementation does not require modifying the caller.

Many frameworks use Java's SPI mechanism, such as the Spring framework, database driver loading, logging interfaces, and Dubbo's extension implementations.

<img src="/media/jg/ext/oss.javaguide.cn/java/basis/spi/22e1830e0b0e4115a882751f6c417857tplv-k3u1fbpfcp--cf39285f.jpg" style="zoom:50%;" />

### What Is the Difference Between SPI and API?

**So what is the difference between SPI and API?**

When talking about SPI, we also have to mention API (Application Programming Interface). Broadly speaking, both are interfaces and are easy to confuse. Let's first illustrate this with a diagram:

![SPI vs API](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/spi-vs-api-b7a94519.png)

Generally, modules communicate through interfaces, so we introduce an "interface" between the service caller and the service implementer (also called the service provider).

- When the implementer provides both the interface and the implementation, and we gain the capabilities offered by the implementer by calling its interface, this is an **API**. In this case, both the interface and the implementation reside in the implementer's package. The caller invokes the implementer's functionality through the interface without needing to care about the concrete implementation details.
- When the interface resides on the caller's side, this is **SPI**. The interface caller defines the interface specification, and different vendors implement this interface according to that specification to provide services.

Here is an easy-to-understand analogy: Company H is a tech company that has designed a new chip and now needs to mass-produce it. There are several chip manufacturing companies on the market. As long as Company H defines the manufacturing standard for this chip (defines the interface specification), these partner chip companies (service providers) can deliver chips with their own distinctive implementations following the standard (providing implementations with different approaches while producing the same expected outcome).

## Hands-on Demo

SLF4J (Simple Logging Facade for Java) is a logging facade (interface) in Java. It has several concrete implementations, such as Logback, Log4j, Log4j2, and so on, and they can be switched seamlessly. When switching concrete logging implementations, we do not need to change project code — we only need to modify the Maven dependencies in `pom.xml`.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/image-20220723213306039-165858318917813-1623720d.png)

This is achieved through the SPI mechanism. Next, let's implement a simplified logging framework.

### Service Provider Interface

Create a new Java project `service-provider-interface` with the following directory structure: (Note: just create a plain Java project directly rather than a Maven project. A Maven project involves build configuration; if you have a private repository, deploying directly is convenient, otherwise you might encounter strange issues along the way.)

```plain
│  service-provider-interface.iml
│
├─.idea
│  │  .gitignore
│  │  misc.xml
│  │  modules.xml
│  └─ workspace.xml
│
└─src
    └─edu
        └─jiangxuan
            └─up
                └─spi
                        Logger.java
                        LoggerService.java
                        Main.class
```

Create the `Logger` interface. This is the SPI (Service Provider Interface), and subsequent service providers will implement this interface.

```java
package edu.jiangxuan.up.spi;

public interface Logger {
    void info(String msg);
    void debug(String msg);
}
```

Next is the `LoggerService` class, which provides specific functionality to service consumers (callers). This class is also the key to implementing the Java SPI mechanism; if anything seems unclear right now, you can keep reading further.

```java
package edu.jiangxuan.up.spi;

import java.util.ArrayList;
import java.util.List;
import java.util.ServiceLoader;

public class LoggerService {
    private static final LoggerService SERVICE = new LoggerService();

    private final Logger logger;

    private final List<Logger> loggerList;

    private LoggerService() {
        ServiceLoader<Logger> loader = ServiceLoader.load(Logger.class);
        List<Logger> list = new ArrayList<>();
        for (Logger log : loader) {
            list.add(log);
        }
        // loggerList holds all ServiceProviders
        loggerList = list;
        if (!list.isEmpty()) {
            // logger only takes the first one
            logger = list.get(0);
        } else {
            logger = null;
        }
    }

    public static LoggerService getService() {
        return SERVICE;
    }

    public void info(String msg) {
        if (logger == null) {
            System.out.println("info 中没有发现 Logger 服务提供者");
        } else {
            logger.info(msg);
        }
    }

    public void debug(String msg) {
        if (loggerList.isEmpty()) {
            System.out.println("debug 中没有发现 Logger 服务提供者");
        }
        loggerList.forEach(log -> log.debug(msg));
    }
}
```

Create the `Main` class (the service consumer / caller), run the program, and check the output.

```java
package org.spi.service;

public class Main {
    public static void main(String[] args) {
        LoggerService service = LoggerService.getService();

        service.info("Hello SPI");
        service.debug("Hello SPI");
    }
}
```

Program output:

> No Logger service provider found in info
> No Logger service provider found in debug

At this point we only have an empty interface and have not provided any implementation for `Logger`, so the output does not print the expected logging results.

You can use commands or directly use IntelliJ IDEA to package the entire program into a JAR file.

### Service Provider

Next, create a new project to implement the `Logger` interface.

Create the project `service-provider` with the following directory structure:

```plain
│  service-provider.iml
│
├─.idea
│  │  .gitignore
│  │  misc.xml
│  │  modules.xml
│  └─ workspace.xml
│
├─lib
│      service-provider-interface.jar
|
└─src
    ├─edu
    │  └─jiangxuan
    │      └─up
    │          └─spi
    │              └─service
    │                      Logback.java
    │
    └─META-INF
        └─services
                edu.jiangxuan.up.spi.Logger

```

Create the `Logback` class:

```java
package edu.jiangxuan.up.spi.service;

import edu.jiangxuan.up.spi.Logger;

public class Logback implements Logger {
    @Override
    public void info(String s) {
        System.out.println("Logback info 打印日志：" + s);
    }

    @Override
    public void debug(String s) {
        System.out.println("Logback debug 打印日志：" + s);
    }
}

```

Import the `service-provider-interface` JAR into the project.

Create a `lib` directory, copy the JAR file over, and add it to the project.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/523d5e25198444d3b112baf68ce49daetplv-k3u1fbpfcp--e9033589.png)

Then click OK.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/f4ba0aa71e9b4d509b9159892a220850tplv-k3u1fbpfcp--5f2c8df8.png)

Now you can import classes and methods from the JAR file in your project, just like importing JDK utility classes.

To implement the `Logger` interface, create a `META-INF/services` folder under the `src` directory, and create a file named `edu.jiangxuan.up.spi.Logger` (the fully qualified class name of the SPI interface). Inside the file, write: `edu.jiangxuan.up.spi.service.Logback` (the fully qualified class name of `Logback`, i.e., package name + class name of the SPI implementation class).

**This is the standard convention defined by JDK's SPI mechanism `ServiceLoader`.**

Let's briefly explain how it works here: calling `ServiceLoader.load()` creates a service loader. When iterating over `ServiceLoader`, the loader locates and instantiates providers on demand; when calling `stream()`, it returns a stream of `ServiceLoader.Provider`, allowing you to inspect the provider type first via `type()`, and only invoking `Provider.get()` obtains the corresponding service provider instance. `ServiceLoader` caches loaded providers. For providers on the classpath, the configuration file is located under `META-INF/services`; for named modules in Java 9 and later, service relationships can also be declared in the module descriptor using `uses` and `provides ... with ...`.

Therefore, there are specific conventions to follow: the file name must be the fully qualified name of the interface, and the file content must be the fully qualified name(s) of the implementation class(es). Multiple implementation classes can be listed on separate lines, and when there are multiple implementations, they will be loaded iteratively one by one.

Next, package the `service-provider` project into a JAR file as well. This JAR is the service provider's implementation. Normally, adding a Maven `pom` dependency works similarly to this, except here we haven't published this JAR to a public Maven repository, so we manually add it to projects where it is needed.

### Demonstration

To demonstrate the effect more intuitively, let's create another project dedicated to testing: `java-spi-test`.

Import the `Logger` interface JAR first, and then import the concrete implementation JAR.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/image-20220723215812708-165858469599214-2951f8e6.png)

Create a `main` method for testing:

```java
package edu.jiangxuan.up.service;

import edu.jiangxuan.up.spi.LoggerService;

public class TestJavaSPI {
    public static void main(String[] args) {
        LoggerService loggerService = LoggerService.getService();
        loggerService.info("你好");
        loggerService.debug("测试Java SPI 机制");
    }
}
```

The execution output is as follows:

> Logback info log: Hello
> Logback debug log: Testing Java SPI mechanism

This shows that the implementation class from the imported JAR took effect.

If we do not import the concrete implementation JAR, the program output will be:

> No Logger service provider found in info
> No Logger service provider found in debug

By using the SPI mechanism, we can see that the coupling between the service (`LoggerService`) and the service provider is very low. If we want to switch to another implementation, we only need to modify the concrete implementation of the `Logger` interface in the `service-provider` project — just swap a JAR file — and we can also have multiple implementations in one project. Isn't this the very principle behind SLF4J?

If requirements change one day and we need to send logs to a message queue or perform some other operations, we don't need to modify the Logback implementation at all; we simply add a new service implementation (`service-provider`), either within the current project or by introducing a new external service implementation JAR. We can then choose a concrete service implementation (`service-provider`) inside our service (`LoggerService`) to accomplish what we need.

Next, let's examine the core mechanism behind how Java SPI works — **ServiceLoader**.

## ServiceLoader

### Concrete Implementation of ServiceLoader

> Below is the JDK 8 implementation of `ServiceLoader`. Java 9 and later versions added module layers, `stream()`, `findFirst()`, provider methods, and other mechanisms, so the current source code structure differs.

Using Java's SPI mechanism relies on `ServiceLoader`, so let's take a closer look at how `ServiceLoader` actually works:

`ServiceLoader` is a utility class provided by the JDK under the `package java.util;` package.

```plain
A facility to load implementations of a service.
```

This is the official JDK Javadoc description: **a facility to load implementations of a service.**

Looking further down, we see that this class is `final`, so it cannot be subclassed or modified, and it implements the `Iterable` interface. It implements `Iterable` so that we can subsequently obtain the corresponding service implementations through iteration.

```java
public final class ServiceLoader<S> implements Iterable<S>{ xxx...}
```

We can see a familiar constant definition:

`private static final String PREFIX = "META-INF/services/";`

Below are the `load` methods. Notice that `load` supports two overloaded parameter forms:

```java
public static <S> ServiceLoader<S> load(Class<S> service) {
    ClassLoader cl = Thread.currentThread().getContextClassLoader();
    return ServiceLoader.load(service, cl);
}

public static <S> ServiceLoader<S> load(Class<S> service,
                                        ClassLoader loader) {
    return new ServiceLoader<>(service, loader);
}

private ServiceLoader(Class<S> svc, ClassLoader cl) {
    service = Objects.requireNonNull(svc, "Service interface cannot be null");
    loader = (cl == null) ? ClassLoader.getSystemClassLoader() : cl;
    acc = (System.getSecurityManager() != null) ? AccessController.getContext() : null;
    reload();
}

public void reload() {
    providers.clear();
    lookupIterator = new LazyIterator(service, loader);
}
```

Its mechanism for solving third-party class loading lies in `ClassLoader cl = Thread.currentThread().getContextClassLoader();`, where `cl` is the **Thread Context ClassLoader**. This is a `ClassLoader` held by each thread; the JDK design allows applications or containers (such as web application servers) to set this `ClassLoader` so that core libraries can use it to load application classes.

By default, the Thread Context ClassLoader is the Application ClassLoader, which is responsible for loading classes on the classpath. When a core library needs to load classes provided by an application, it can use the Thread Context ClassLoader to do so. In this way, even core library code loaded by the Bootstrap ClassLoader can load and use classes loaded by the Application ClassLoader.

Following the execution flow, inside `reload()`, loading is implemented via an inner class `LazyIterator`. Let's continue reading below.

Because `ServiceLoader` implements `Iterable`, it supports iteration. When `iterator()` is called, it first searches in `ServiceLoader`'s `providers` cache; if there is a cache miss, it delegates to `LazyIterator` for lookup.

```java

public Iterator<S> iterator() {
    return new Iterator<S>() {

        Iterator<Map.Entry<String, S>> knownProviders
                = providers.entrySet().iterator();

        public boolean hasNext() {
            if (knownProviders.hasNext())
                return true;
            return lookupIterator.hasNext(); // Delegate to LazyIterator
        }

        public S next() {
            if (knownProviders.hasNext())
                return knownProviders.next().getValue();
            return lookupIterator.next(); // Delegate to LazyIterator
        }

        public void remove() {
            throw new UnsupportedOperationException();
        }

    };
}
```

When `LazyIterator` is invoked, its concrete implementation is as follows:

```java

public boolean hasNext() {
    if (acc == null) {
        return hasNextService();
    } else {
        PrivilegedAction<Boolean> action = new PrivilegedAction<Boolean>() {
            public Boolean run() {
                return hasNextService();
            }
        };
        return AccessController.doPrivileged(action, acc);
    }
}

private boolean hasNextService() {
    if (nextName != null) {
        return true;
    }
    if (configs == null) {
        try {
            // Combine PREFIX (META-INF/services/) and class name to locate the configuration file and obtain concrete implementation classes
            String fullName = PREFIX + service.getName();
            if (loader == null)
                configs = ClassLoader.getSystemResources(fullName);
            else
                configs = loader.getResources(fullName);
        } catch (IOException x) {
            fail(service, "Error locating configuration files", x);
        }
    }
    while ((pending == null) || !pending.hasNext()) {
        if (!configs.hasMoreElements()) {
            return false;
        }
        pending = parse(service, configs.nextElement());
    }
    nextName = pending.next();
    return true;
}


public S next() {
    if (acc == null) {
        return nextService();
    } else {
        PrivilegedAction<S> action = new PrivilegedAction<S>() {
            public S run() {
                return nextService();
            }
        };
        return AccessController.doPrivileged(action, acc);
    }
}

private S nextService() {
    if (!hasNextService())
        throw new NoSuchElementException();
    String cn = nextName;
    nextName = null;
    Class<?> c = null;
    try {
        c = Class.forName(cn, false, loader);
    } catch (ClassNotFoundException x) {
        fail(service,
                "Provider " + cn + " not found");
    }
    if (!service.isAssignableFrom(c)) {
        fail(service,
                "Provider " + cn + " not a subtype");
    }
    try {
        S p = service.cast(c.newInstance());
        providers.put(cn, p);
        return p;
    } catch (Throwable x) {
        fail(service,
                "Provider " + cn + " could not be instantiated",
                x);
    }
    throw new Error();          // This cannot happen
}
```

Many people may find this a bit complicated when reading it. That's fine — I have implemented a simple toy `ServiceLoader` model here to demonstrate the core idea of reading implementation class names from classpath configuration files and creating instances. It does not cover the full behavior of the JDK implementation such as lazy loading, deduplication, error handling, or module providers:

### Implementing Your Own ServiceLoader

Let's post the code first:

```java
package edu.jiangxuan.up.service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Constructor;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;

public class MyServiceLoader<S> {

    // Class object of the corresponding interface
    private final Class<S> service;

    // Multiple implementation classes can exist; stored in a List
    private final List<S> providers = new ArrayList<>();

    // ClassLoader
    private final ClassLoader classLoader;

    // Public entry method; calling this starts the custom loading process
    public static <S> MyServiceLoader<S> load(Class<S> service) {
        return new MyServiceLoader<>(service);
    }

    // Private constructor
    private MyServiceLoader(Class<S> service) {
        this.service = service;
        this.classLoader = Thread.currentThread().getContextClassLoader();
        doLoad();
    }

    // Core method: logic for loading concrete implementation classes
    private void doLoad() {
        try {
            // Read files under META-INF/services in all JARs; the file name is the interface name, and the content is the fully qualified name of each implementation class
            Enumeration<URL> urls = classLoader.getResources("META-INF/services/" + service.getName());
            // Iterate through each retrieved file
            while (urls.hasMoreElements()) {
                // Get the current file URL
                URL url = urls.nextElement();
                System.out.println("File = " + url.getPath());
                // Open connection
                URLConnection urlConnection = url.openConnection();
                urlConnection.setUseCaches(false);
                // Obtain input stream for the file
                InputStream inputStream = urlConnection.getInputStream();
                // Wrap input stream in a BufferedReader
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
                // Read the fully qualified class name of the implementation from the file content
                String className = bufferedReader.readLine();

                while (className != null) {
                    // Load the implementation class via Reflection
                    Class<?> clazz = Class.forName(className, false, classLoader);
                    // If the declared interface is assignable from this concrete class (polymorphism in Java: interface/implementation, superclass/subclass), instantiate it
                    if (service.isAssignableFrom(clazz)) {
                        Constructor<? extends S> constructor = (Constructor<? extends S>) clazz.getConstructor();
                        S instance = constructor.newInstance();
                        // Add the constructed instance to the providers list
                        providers.add(instance);
                    }
                    // Continue reading the next implementation class on the next line; multiple implementations can be separated by newlines
                    className = bufferedReader.readLine();
                }
            }
        } catch (Exception e) {
            System.out.println("读取文件异常。。。");
        }
    }

    // Return the list of concrete implementation instances for the SPI interface
    public List<S> getProviders() {
        return providers;
    }
}
```

The key details have already been explained in the code comments.

The main workflow is:

1. Use `URL` / `ClassLoader.getResources()` to locate the corresponding file under `/META-INF/services` in JAR packages;
2. Match the file name to the corresponding SPI interface;
3. Read the fully qualified class names of the concrete implementations from the file via `InputStream`;
4. Check whether each loaded class is type-compatible with the SPI interface, and if so, instantiate the object via Reflection;
5. Add the constructed instance to the `providers` list.

## Summary

It is easy to see that the SPI mechanism works by dynamically locating and instantiating service providers. Providers on the classpath must be declared in `META-INF/services/` configuration files, whereas providers in named modules are declared via `provides ... with ...` in the module descriptor.

In addition, the SPI mechanism is used across many frameworks: the Spring framework's core approach follows a similar pattern, and the Dubbo framework also provides an SPI extension mechanism. Although the concrete implementations in Dubbo and Spring differ subtly from what we learned today, the overall principle is consistent. By understanding JDK's SPI mechanism, you will be able to grasp those advanced frameworks much more easily.

Using the SPI mechanism can greatly improve the flexibility of interface design, though SPI also has some drawbacks, such as:

1. `ServiceLoader` loads providers lazily; however, if the caller iterates through all providers in order to select an implementation, extra overhead may still occur;
2. A single `ServiceLoader` instance does not guarantee thread safety; if shared across threads, synchronization must be handled by the caller. Calling `load` concurrently to create separate `ServiceLoader` instances does not inherently cause concurrency conflicts.
