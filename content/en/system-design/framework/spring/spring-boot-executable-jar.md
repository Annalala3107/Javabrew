---
title: Why Can a Spring Boot JAR Run Directly?
description: "Explaining executable JAR packaging and startup mechanisms through java -jar, Main-Class, Start-Class, BOOT-INF, and Spring Boot Loader, while distinguishing the responsibilities of embedded containers and auto-configuration."
category: Frameworks
tag:
  - Spring Boot
  - Java
head:
  - - meta
    - name: keywords
      content: "Spring Boot,Executable JAR,java -jar,JarLauncher,Main-Class,Start-Class,BOOT-INF,repackage"
lang: en
sourceRef: zh-ref/system-design/framework/spring/spring-boot-executable-jar.md
---

**The keys to a Spring Boot executable JAR are the startup entry point declared in the manifest and the Boot Loader capable of loading nested dependencies.** An embedded Tomcat server handles HTTP traffic and is simply one component initialized after a web application starts; command-line applications without any web container can be packaged and run in the exact same way.

## Can a Regular JAR Also Run via `java -jar`?

Yes. JAR is an archive format, not a Spring Boot-exclusive format. When you run `java -jar app.jar`, the Java launcher reads `Main-Class` from `META-INF/MANIFEST.MF` and invokes that entry point. Any regular application can start this way as long as it provides an entry point compatible with the target JDK and ensures its dependencies are loadable. See the [Java 17 `java` command documentation](https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html).

What Spring Boot additionally solves is how dependencies are distributed together with the application and loaded from inside the outer JAR. Standard Java classloading mechanisms do not recursively load JARs nested inside another JAR, so merely copying dependency JARs into an archive is not enough.

## What Is Inside a Boot Executable JAR?

Below is the typical Boot Loader layout (with some files omitted):

```text
app.jar
├── META-INF/MANIFEST.MF
├── org/springframework/boot/loader/...
└── BOOT-INF/
    ├── classes/
    │   ├── com/example/Application.class
    │   ├── application.yml
    │   └── static/...
    └── lib/
        ├── spring-context-*.jar
        └── other-dependency-*.jar
```

Application classes and classpath resources reside in `BOOT-INF/classes/`, dependencies remain intact as separate JARs under `BOOT-INF/lib/`, and the Loader classes are placed where the outer JAR can load them directly. Dependencies are not unpacked and merged into a single flat set of class files, unlike the common shaded JAR (fat/uber JAR) approach. See the [Spring Boot Nested JARs Specification](https://docs.spring.io/spring-boot/specification/executable-jar/nested-jars.html).

## What Is the Difference Between `Main-Class` and `Start-Class`?

With the new Loader introduced by default in Spring Boot 3.2, these two entries in the manifest look like this:

```text
Main-Class: org.springframework.boot.loader.launch.JarLauncher
Start-Class: com.example.Application
```

- **`Main-Class`**: The bootstrap class invoked first by the Java launcher.
- **`Start-Class`**: The application's main class ultimately invoked by the Boot Launcher.

Older Loader versions typically used `org.springframework.boot.loader.JarLauncher`, without the intermediate `launch` package. Spring Boot 3.2 rewrote the Loader and changed the default launcher class name; when troubleshooting, always inspect the manifest inside the actual build artifact. See the [Spring Boot 3.2 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.2-Release-Notes).

`Start-Class` is metadata consumed by Spring Boot, not an application entry point automatically recognized by the Java launcher. Likewise, `@SpringBootApplication` cannot replace the entry-point configuration in the manifest.

## What Happens Between `java -jar` and Application Startup?

1. The Java launcher reads `Main-Class` and runs `JarLauncher`.
2. The Launcher sets up loading paths for application classes and nested dependencies according to the Boot layout and creates the corresponding `ClassLoader`.
3. The Launcher reads `Start-Class`, loads the application main class, and calls its `main` method.
4. The application main class typically calls `SpringApplication.run(...)`, creating the application context, registering Beans, and running auto-configuration.
5. If the application satisfies the conditions for a web application and its configured server, it creates and starts the embedded server.

Thus, `JarLauncher` is a bootstrap launcher, not the `ClassLoader` itself; neither auto-configuration nor the embedded web server is why the JVM recognizes an executable JAR. For launch mechanics, see [Launching Executable Jars](https://docs.spring.io/spring-boot/specification/executable-jar/launching.html); for auto-configuration details, see [Spring Boot Auto-Configuration Principles](./spring-boot-auto-assembly-principles.md).

The Boot Loader can read nested entries directly by their offset within the outer archive, usually without extracting the entire JAR to disk first or loading every dependency into memory all at once. Special cases where certain dependencies require unpacking are targeted adaptations and cannot be generalized as "Boot startup unpacks all JARs first." See the [`NestedJarFile` documentation](https://docs.spring.io/spring-boot/specification/executable-jar/jarfile-class.html).

## How Do You Verify That the Packaged Artifact Is an Executable JAR?

In Maven projects, the `repackage` goal of `spring-boot-maven-plugin` normally repackages the standard JAR. When using `spring-boot-starter-parent`, its execution is preconfigured, yet you still must declare the plugin; merely importing the dependency BOM does not automatically bind that packaging goal. Gradle projects use the `bootJar` task provided by the Spring Boot plugin.

For example, build in a project with the Maven plugin properly configured, then inspect the resulting artifact:

```bash
mvn package
jar tf target/app.jar
unzip -p target/app.jar META-INF/MANIFEST.MF
java -jar target/app.jar
```

Replace `app.jar` with the actual filename produced by your project. The Maven plugin may keep an `.original` archive by default, and Gradle projects may generate a plain JAR alongside the boot JAR—before deploying, verify you selected the Boot-repackaged artifact. See the [Maven Plugin Packaging Documentation](https://docs.spring.io/spring-boot/maven-plugin/packaging.html) and [Gradle Plugin Packaging Documentation](https://docs.spring.io/spring-boot/gradle-plugin/packaging.html).

When startup fails, troubleshoot along the same path:

| Symptom                        | Check First                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| Missing main manifest attribute | Whether a plain JAR was run instead, or whether repackaging actually ran           |
| `JarLauncher` not found        | Whether the class name in the manifest matches the Loader version and JAR contents |
| Application or dependency class not found | Whether `Start-Class`, application classes directory, and runtime dependencies were packaged properly |
| App starts with no HTTP port   | Whether it is a web application and whether the corresponding server is included and enabled |
| `UnsupportedClassVersionError` | Whether the runtime JDK is older than the version required by the class files       |

An executable JAR packages the application and its included Java dependencies, yet it still requires a compatible Java runtime—and environmental dependencies such as databases, external configuration, and OS-native libraries do not disappear either.
