---
title: Spring Boot Auto-Configuration Principles Explained
description: "In-depth analysis of Spring Boot auto-configuration principles, detailing @EnableAutoConfiguration, the SpringFactories loading mechanism, and how conditional annotations work."
category: Framework
tag:
  - SpringBoot
lang: en
sourceRef: zh-ref/system-design/framework/spring/spring-boot-auto-assembly-principles.md
head:
  - - meta
    - name: keywords
      content: Spring Boot Auto-Configuration,AutoConfiguration,EnableAutoConfiguration,SpringFactories,Conditional Annotations,Starter,Spring Boot Principles
---

> Authors: [Miki-byte-1024](https://github.com/Miki-byte-1024) & [Snailclimb](https://github.com/Snailclimb)

Whenever Spring Boot comes up in an interview, interviewers love asking: "Explain how Spring Boot auto-configuration works."

I think we can structure the answer around the following points:

1. What is Spring Boot auto-configuration?
2. How does Spring Boot implement auto-configuration? How does it achieve on-demand loading?
3. How do you implement a custom Starter?

Due to space limitations, this article does not go too deep into every detail; you can also step directly into the Spring Boot auto-configuration source code using a debugger.

## Preface

Anyone who has used classic Spring has likely experienced the dread of XML configuration overload. Even after Spring introduced annotation-based configuration, enabling certain Spring features or integrating third-party dependencies still required explicit configuration in XML or Java.

For example, without Spring Boot, writing a RESTful Web service required setting up configurations like the following first:

```java
@Configuration
public class RESTConfiguration
{
    @Bean
    public View jsonTemplate() {
        MappingJackson2JsonView view = new MappingJackson2JsonView();
        view.setPrettyPrint(true);
        return view;
    }

    @Bean
    public ViewResolver viewResolver() {
        return new BeanNameViewResolver();
    }
}
```

`spring-servlet.xml`

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:context="http://www.springframework.org/schema/context"
    xmlns:mvc="http://www.springframework.org/schema/mvc"
    xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
    http://www.springframework.org/schema/context/ http://www.springframework.org/schema/context/spring-context.xsd
    http://www.springframework.org/schema/mvc/ http://www.springframework.org/schema/mvc/spring-mvc.xsd">

    <context:component-scan base-package="com.howtodoinjava.demo" />
    <mvc:annotation-driven />

    <!-- JSON Support -->
    <bean name="viewResolver" class="org.springframework.web.servlet.view.BeanNameViewResolver"/>
    <bean name="jsonTemplate" class="org.springframework.web.servlet.view.json.MappingJackson2JsonView"/>

</beans>
```

In a Spring Boot project, however, we only need to add the relevant dependencies—no manual boilerplate configuration required—and start the `main` method below:

```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

Moreover, through Spring Boot's global configuration file `application.properties` or `application.yml`, we can easily configure the application, such as changing the server port or setting JPA properties.

**Why is Spring Boot so pleasant to use?** Because of its auto-configuration. **Auto-configuration is arguably the core of Spring Boot—so what exactly is auto-configuration?**

## What Is Spring Boot Auto-Configuration?

Nowadays, when we mention auto-configuration, we usually associate it with Spring Boot. In fact, however, the Spring Framework had already provided the underlying capability long before. Spring Boot simply built on top of it and streamlined it further via SPI.

> In Spring Boot 2.6 and earlier, auto-configuration classes were mainly registered via `META-INF/spring.factories` inside external JARs. Spring Boot 2.7 introduced `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` while maintaining backward compatibility with the legacy registration approach. Spring Boot 3.0 removed support for registering auto-configuration classes via the `EnableAutoConfiguration` key in `spring.factories`, though other uses of `spring.factories` remain unaffected.

Without Spring Boot, integrating a third-party dependency required tedious manual configuration. In Spring Boot, by contrast, we simply pull in a starter. For example, if you want to use Redis in your project, you just add the corresponding starter dependency:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

After adding the starter, we can use the capabilities provided by the third-party component with just a few annotations and minimal configuration.

In my view, auto-configuration can be understood simply as: **enabling and configuring a piece of functionality with the help of Spring Boot using only annotations and minimal configuration.**

## How Does Spring Boot Implement Auto-Configuration?

Let's start by looking at Spring Boot's core annotation, `SpringBootApplication`.

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
<1.>@SpringBootConfiguration
<2.>@ComponentScan
<3.>@EnableAutoConfiguration
public @interface SpringBootApplication {

}

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Configuration // In fact, it is also a configuration class
public @interface SpringBootConfiguration {
}
```

Roughly speaking, `@SpringBootApplication` can be viewed as a composite of `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. According to the official Spring Boot documentation, these three annotations serve the following purposes:

- `@EnableAutoConfiguration`: Enables Spring Boot's auto-configuration mechanism.
- `@Configuration`: Allows registering extra beans in the application context or importing additional configuration classes.
- `@ComponentScan`: Scans for beans annotated with `@Component` (`@Service`, `@Controller`, etc.). By default, it scans all classes under the package of the main startup class, and you can customize filters to exclude certain beans. As shown below, `TypeExcludeFilter` and `AutoConfigurationExcludeFilter` are excluded in the container.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/bcc73490afbe4c6ba62acde6a94ffdfd-tplv-k3u1fbpfcp-12946f5e.png)

`@EnableAutoConfiguration` is the key annotation that drives auto-configuration, so let's begin with it.

### @EnableAutoConfiguration: The Core Annotation Enabling Auto-Configuration

`EnableAutoConfiguration` itself is just a straightforward annotation; the core auto-configuration logic is actually implemented by the `AutoConfigurationImportSelector` class.

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage // Registers all components under the main package into the container
@Import({AutoConfigurationImportSelector.class}) // Loads auto-configuration classes (xxxAutoConfiguration)
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    Class<?>[] exclude() default {};

    String[] excludeName() default {};
}
```

Now let's examine what the `AutoConfigurationImportSelector` class actually does.

### AutoConfigurationImportSelector: Loading Auto-Configuration Classes

Below, we analyze `AutoConfigurationImportSelector` using source code excerpts from Spring Boot 2.1.x. Some parts that do not affect the overall flow are omitted, so these snippets cannot be compiled directly as standalone classes. In Spring Boot 2.7 and later, candidate auto-configuration classes are primarily read from the `AutoConfiguration.imports` file, so the exact source layout differs from the older version shown below.

The inheritance hierarchy of `AutoConfigurationImportSelector` is as follows:

```java
public class AutoConfigurationImportSelector implements DeferredImportSelector, BeanClassLoaderAware, ResourceLoaderAware, BeanFactoryAware, EnvironmentAware, Ordered {

}

public interface DeferredImportSelector extends ImportSelector {

}

public interface ImportSelector {
    String[] selectImports(AnnotationMetadata var1);
}
```

As you can see, `AutoConfigurationImportSelector` implements the `ImportSelector` interface and therefore its `selectImports` method, whose primary job is to **obtain the fully qualified class names of all qualifying classes that need to be loaded into the IoC container**.

```java
private static final String[] NO_IMPORTS = new String[0];

public String[] selectImports(AnnotationMetadata annotationMetadata) {
        // <1>. Check whether auto-configuration is enabled
        if (!this.isEnabled(annotationMetadata)) {
            return NO_IMPORTS;
        } else {
          // <2>. Retrieve all beans that need to be auto-configured
            AutoConfigurationMetadata autoConfigurationMetadata = AutoConfigurationMetadataLoader.loadMetadata(this.beanClassLoader);
            AutoConfigurationImportSelector.AutoConfigurationEntry autoConfigurationEntry = this.getAutoConfigurationEntry(autoConfigurationMetadata, annotationMetadata);
            return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
        }
    }
```

Here, we should pay special attention to the `getAutoConfigurationEntry()` method, which is responsible for loading the auto-configuration classes.

Its call chain is as follows:

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/3c1200712655443ca4b38500d615bb70-tplv-k3u1fbpfcp-664260af.png)

Now let's walk through the source code of `getAutoConfigurationEntry()` in detail:

```java
private static final AutoConfigurationEntry EMPTY_ENTRY = new AutoConfigurationEntry();

AutoConfigurationEntry getAutoConfigurationEntry(AutoConfigurationMetadata autoConfigurationMetadata, AnnotationMetadata annotationMetadata) {
        // <1>.
        if (!this.isEnabled(annotationMetadata)) {
            return EMPTY_ENTRY;
        } else {
            // <2>.
            AnnotationAttributes attributes = this.getAttributes(annotationMetadata);
            // <3>.
            List<String> configurations = this.getCandidateConfigurations(annotationMetadata, attributes);
            // <4>.
            configurations = this.removeDuplicates(configurations);
            Set<String> exclusions = this.getExclusions(annotationMetadata, attributes);
            this.checkExcludedClasses(configurations, exclusions);
            configurations.removeAll(exclusions);
            configurations = this.filter(configurations, autoConfigurationMetadata);
            this.fireAutoConfigurationImportEvents(configurations, exclusions);
            return new AutoConfigurationImportSelector.AutoConfigurationEntry(configurations, exclusions);
        }
    }
```

**Step 1**:

Check whether the auto-configuration switch is enabled. By default, `spring.boot.enableautoconfiguration=true`, which can be configured in `application.properties` or `application.yml`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/77aa6a3727ea4392870f5cccd09844ab-tplv-k3u1fbpfcp-9a7db9da.png)

**Step 2**:

Retrieve the `exclude` and `excludeName` attributes from the `@EnableAutoConfiguration` annotation.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3d6ec93bbda1453aa08c52b49516c05a-tplv-k3u1fbpfcp-2075997d.png)

**Step 3**:

In the Spring Boot 2.1.x source code used in this article, collecting all configuration classes to be auto-configured reads `META-INF/spring.factories`:

```plain
spring-boot/spring-boot-project/spring-boot-autoconfigure/src/main/resources/META-INF/spring.factories
```

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/58c51920efea4757aa1ec29c6d5f9e36-tplv-k3u1fbpfcp-55908136.png)

As shown in the figure below, all configuration entries in this file have been read. The role of `XXXAutoConfiguration` is to load components on demand.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/94d6e1a060ac41db97043e1758789026-tplv-k3u1fbpfcp-ca00402b.png)

It is not only the `META-INF/spring.factories` under this single dependency that gets read—resources with the same name in other JARs on the classpath are also merged and loaded by `SpringFactoriesLoader`. Note that a Starter is usually just a JAR that aggregates dependencies; the auto-configuration code and registration file can live in a separate `autoconfigure` module or be bundled directly into the Starter, so not every Starter is required to contain `spring.factories`.

As you can clearly see, the Spring Boot Starter for the Druid database connection pool creates a `META-INF/spring.factories` file.

If you are writing auto-configuration for Spring Boot 2.6 or earlier, you need to use this registration mechanism; for Spring Boot 3.x, auto-configuration should use `AutoConfiguration.imports` instead.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/68fa66aeee474b0385f94d23bcfe1745-tplv-k3u1fbpfcp-6062303a.png)

**Step 4**:

At this point, an interviewer might ask you: "There are so many configurations in `spring.factories`—does every single one get loaded on every startup?"

Obviously, that would be impractical. When we debug further, you will notice that the size of `configurations` becomes much smaller.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/267f8231ae2e48d982154140af6437b0-tplv-k3u1fbpfcp-5b518089.png)

That is because this step runs a filtering pass: a class only takes effect when all conditions specified by its `@ConditionalOnXXX` annotations are satisfied.

```java
@Configuration
// Checks whether the relevant classes, RabbitTemplate and Channel, exist
// Only loaded if they are present
@ConditionalOnClass({ RabbitTemplate.class, Channel.class })
@EnableConfigurationProperties(RabbitProperties.class)
@Import(RabbitAnnotationDrivenConfiguration.class)
public class RabbitAutoConfiguration {
}
```

If you are interested, you can take a closer look at the conditional annotations provided by Spring Boot:

- `@ConditionalOnBean`: When the specified Bean exists in the container
- `@ConditionalOnMissingBean`: When the specified Bean does not exist in the container
- `@ConditionalOnSingleCandidate`: When only one instance of the specified Bean exists in the container, or when multiple exist but one is designated as the primary Bean
- `@ConditionalOnClass`: When the specified class exists on the classpath
- `@ConditionalOnMissingClass`: When the specified class does not exist on the classpath
- `@ConditionalOnProperty`: Whether the specified property has the specified value
- `@ConditionalOnResource`: Whether the specified resource exists on the classpath
- `@ConditionalOnExpression`: Uses a SpEL expression as the condition
- `@ConditionalOnJava`: Uses the Java version as the condition
- `@ConditionalOnJndi`: When JNDI exists, looks up the specified location
- `@ConditionalOnNotWebApplication`: When the current project is not a Web application
- `@ConditionalOnWebApplication`: When the current project is a Web application

## How to Implement a Starter

Talk is cheap—let's build a starter right now to implement a custom thread pool.

Step 1: Create the `threadpool-spring-boot-starter` project.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/1ff0ebe7844f40289eb60213af72c5a6-tplv-k3u1fbpfcp-4b964b99.png)

Step 2: Add the relevant Spring Boot dependencies.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/5e14254276604f87b261e5a80a354cc0-tplv-k3u1fbpfcp-b700e257.png)

Step 3: Create `ThreadPoolAutoConfiguration`.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/1843f1d12c5649fba85fd7b4e4a59e39-tplv-k3u1fbpfcp-9d898354.png)

Step 4: Register the auto-configuration class. For Spring Boot 2.6 and earlier, create a `META-INF/spring.factories` file under the `resources` directory of the `threadpool-spring-boot-starter` project; for Spring Boot 2.7 and later, use `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, and when targeting Spring Boot 3.x, the auto-configuration class is typically annotated with `@AutoConfiguration`.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/97b738321f1542ea8140484d6aaf0728-tplv-k3u1fbpfcp-27bcba77.png)

Finally, create a new project and add `threadpool-spring-boot-starter` as a dependency.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/edcdd8595a024aba85b6bb20d0e3fed4-tplv-k3u1fbpfcp-b4161c16.png)

Tests passed!

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/9a265eea4de742a6bbdbbaa75f437307-tplv-k3u1fbpfcp-4d687394.png)

## Summary

Spring Boot enables auto-configuration through `@EnableAutoConfiguration` and loads candidate auto-configuration classes registered on the classpath. Spring Boot 2.6 and earlier primarily register them via `spring.factories`, while Spring Boot 2.7 and later use `AutoConfiguration.imports`. Auto-configuration classes take effect on demand by combining `@Conditional`-series annotations; the primary role of a Starter is to aggregate commonly used dependencies, rather than being a fixed package-naming requirement for auto-configuration to take effect.
