---
title: Maven Best Practices
description: "Summary of common Maven best practices in Java projects, covering standard directory structure, compilation version, dependency management, Profiles, Maven Wrapper, CI builds, and plugin usage."
category: Developer Tools
head:
  - - meta
    - name: keywords
      content: Maven Coordinates,Maven Repository,Maven Lifecycle,Maven Multi-Module Management,Maven Wrapper,Dependency Management
lang: en
sourceRef: zh-ref/tools/maven/maven-best-practices.md
---

> This article was translated and refined by JavaGuide. Original article: <https://medium.com/@AlexanderObregon/maven-best-practices-tips-and-tricks-for-java-developers-438eca03f72b>.

Maven is a widely used build automation tool for Java projects. It simplifies the build process and helps us manage dependencies. For a detailed introduction to Maven, refer to this article: [Maven Core Concepts Summary](./maven-core-concepts.md).

Rather than expanding on Maven's basic concepts, this article focuses on practical areas where projects are prone to pitfalls: directory structure, compilation versions, dependency versions, environment configurations, Wrapper, CI, and plugin management.

## Maven Standard Directory Structure

Maven follows a standard directory structure to maintain consistency across projects. Adhering to this layout makes it easier for other developers to understand our projects.

The standard directory structure of a Maven project is as follows:

```groovy
src/
  main/
    java/
    resources/
  test/
    java/
    resources/
pom.xml
```

- `src/main/java`: Source code directory
- `src/main/resources`: Resource files directory
- `src/test/java`: Test code directory
- `src/test/resources`: Test resource files directory

This is only the simplest example of a Maven project layout. In real-world projects, we also subdivide directories further based on project conventions.

## Explicitly Specify the Java Compilation Version

Do not rely on Maven's or a plugin's default compilation version—projects should explicitly declare the target Java version in `pom.xml`. For modern Java projects, prefer `maven.compiler.release`, which corresponds to `javac --release` and is safer than configuring `source` and `target` separately.

Note that `javac --release` was introduced in JDK 9; Maven Compiler Plugin 3.13.0 and later also support `maven.compiler.release` on JDK 8 by automatically converting it to `source` and `target`. If the project still uses an older plugin or build environment, explicitly configure `source` and `target` instead.

For example, if a project needs to be compiled targeting Java 17, you can write:

```xml
<properties>
  <maven.compiler.release>17</maven.compiler.release>
</properties>
```

If you need to configure the Maven Compiler Plugin directly, you can also write:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <version>3.15.0</version>
      <configuration>
        <release>17</release>
      </configuration>
    </plugin>
  </plugins>
</build>
```

Avoid writing `release` values in the legacy `1.8` format. For example, write `8` for Java 8, `17` for Java 17, and `21` for Java 21.

## Manage Dependencies Effectively

Maven's dependency management system is one of its most powerful features. Defining shared dependency versions in the parent POM via `dependencyManagement` avoids repeating version numbers across multiple modules and reduces the likelihood of dependency conflicts.

For example, suppose we have one parent module and two child modules A and B, and we want to use JUnit 5 across all modules. We can define JUnit's version in the parent module's `pom.xml` using `<dependencyManagement>`:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.10.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

In the `pom.xml` files of child modules A and B, you only need to reference JUnit's `groupId` and `artifactId`:

```xml
<dependencies>
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
  </dependency>
</dependencies>
```

For ecosystems that already provide a BOM—such as Spring Boot and Spring Cloud—prioritize importing the official BOM and omitting specific dependency versions in business modules. This helps reduce compatibility issues caused by manually piecing versions together.

## Use Profiles for Different Environments

Maven Profiles allow us to configure build settings for different environments, such as development, testing, and production. Define profiles in `pom.xml` and activate them using command-line flags:

```xml
<profiles>
  <profile>
    <id>development</id>
    <activation>
      <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
      <environment>dev</environment>
    </properties>
  </profile>
  <profile>
    <id>production</id>
    <properties>
      <environment>prod</environment>
    </properties>
  </profile>
</profiles>
```

Activate a profile via the command line:

```bash
mvn clean install -P production
```

## Keep pom.xml Clean and Well-Organized

A well-organized `pom.xml` file is much easier to maintain and understand. Here are some tips for maintaining a clean `pom.xml`:

- Group similar dependencies and plugins together.
- Use comments to describe the purpose of specific dependencies or plugins.
- Put shared version numbers inside `<properties>`, or manage them centrally in the parent POM's `dependencyManagement` / `pluginManagement`.

```xml
<properties>
  <junit.version>5.10.2</junit.version>
  <mockito.version>5.12.0</mockito.version>
</properties>
```

It is also recommended to declare plugin versions explicitly. Do not rely on Maven's default plugin versions, otherwise behavioral differences may occur across different Maven versions or build environments.

## Use Maven Wrapper

Maven Wrapper is a tool for managing and using Maven that allows running and building Maven projects without having Maven pre-installed.

The official Maven documentation describes Maven Wrapper as follows:

> The Maven Wrapper is an easy way to ensure a user of your Maven build has everything necessary to run your Maven build.

Maven Wrapper ensures that the build process uses the exact right Maven version, which is very convenient. To use Maven Wrapper, run the following command in the project directory:

```bash
mvn wrapper:wrapper
```

This command generates the Maven Wrapper files in our project. Now we can use `./mvnw` (or `./mvnw.cmd` on Windows) instead of `mvn` to run Maven commands.

Team projects are advised to commit `mvnw`, `mvnw.cmd`, and the `.mvn/wrapper/` directory. This way, new team members or CI environments do not need to pre-install a specific Maven version and can still complete builds using the Maven version declared by the project.

## Automate Builds with Continuous Integration

Integrating a Maven project with a Continuous Integration (CI) system (such as Jenkins or GitHub Actions) ensures that our code is automatically built, tested, and deployed. CI helps catch issues early and provides a consistent build process across the entire team. Below is a simple GitHub Actions workflow example for a Maven project:

```yaml
name: Java CI with Maven

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
          cache: "maven"

      - name: Build with Maven
        run: ./mvnw -B clean verify
```

In CI, it is recommended to use `clean verify`, which runs tests and necessary verification checks. `install` installs the build artifacts into the local repository and is only needed when subsequent steps actually depend on those locally installed artifacts.

## Leverage Maven Plugins for Additional Capabilities

Many Maven plugins are available to extend Maven's functionality. Some popular plugins include (the first three are built-in Maven plugins, and the last three are third-party plugins):

- `maven-surefire-plugin`: Configures and runs unit tests.
- `maven-failsafe-plugin`: Configures and runs integration tests.
- `maven-javadoc-plugin`: Generates project documentation in Javadoc format.
- `maven-checkstyle-plugin`: Enforces coding standards and best practices.
- `jacoco-maven-plugin`: Unit test code coverage.
- `sonar-maven-plugin`: Analyzes code quality.
- ...

Example usage of `jacoco-maven-plugin`:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.jacoco</groupId>
      <artifactId>jacoco-maven-plugin</artifactId>
      <version>0.8.12</version>
      <executions>
        <execution>
          <goals>
            <goal>prepare-agent</goal>
          </goals>
        </execution>
        <execution>
          <id>generate-code-coverage-report</id>
          <phase>test</phase>
          <goals>
            <goal>report</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

If existing plugins cannot meet our needs, we can also create custom plugins.

Explore available plugins and configure them in `pom.xml` to enhance our development workflow.

## Summary

The most important thing about Maven is not just "whether the project can run," but ensuring the team uses a consistent build process across local machines, CI, and deployment environments. In real projects, prioritize these practices: use the standard directory structure, explicitly declare Java and plugin versions, manage dependency versions via a parent POM, BOM, and `dependencyManagement`, commit the Maven Wrapper, and pin the JDK and Maven build commands in CI.
