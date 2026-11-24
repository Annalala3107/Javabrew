---
title: Maven Core Concepts Summary
description: "Apache Maven is essentially a software project management and comprehension tool. Based on the concept of a project object model (POM), Maven can manage a project's build, reporting, and documentation from a central piece of information."
category: Developer Tools
head:
  - - meta
    - name: keywords
      content: Maven Coordinates,Maven Repository,Maven Lifecycle,Maven Multi-Module Management
lang: en
sourceRef: zh-ref/tools/maven/maven-core-concepts.md
---

> This content is primarily compiled from the official Maven documentation with selective trimming to retain the most important parts. It does not cover hands-on practice and focuses mainly on introducing key concepts.

## Introduction to Maven

The official [Maven](https://github.com/apache/maven) documentation introduces Maven as follows:

> Apache Maven is a software project management and comprehension tool. Based on the concept of a project object model (POM), Maven can manage a project's build, reporting and documentation from a central piece of information.

**What is POM?** Every Maven project has a `pom.xml` file in its root directory containing detailed information about the project's build lifecycle. Through `pom.xml`, we can define project coordinates, project dependencies, project metadata, plugin configurations, and more.

For developers, Maven serves 3 main roles:

1. **Project Building**: Provides a standardized, cross-platform, automated way to build projects.
2. **Dependency Management**: Conveniently and quickly manages the resources (JAR packages) a project depends on, avoiding version conflicts between dependencies.
3. **Unified Development Structure**: Provides a standard, unified project directory structure.

We will not cover basic Maven usage here; it is recommended to check out the official 5-minute getting-started tutorial: [Maven in 5 Minutes](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html).

## Maven Coordinates

Third-party libraries and plugins that a project depends on can collectively be called artifacts. Every artifact can be uniquely identified using Maven coordinates, which include the following elements:

- **groupId** (required): Defines the organization or company to which the current Maven project belongs. A `groupId` is generally divided into multiple segments; typically, the first segment is the domain and the second segment is the company name. Common domains include `org`, `com`, `cn`, etc., where `org` stands for non-profit organizations, `com` for commercial organizations, and `cn` represents China. Taking Apache's open-source Tomcat project as an example, its `groupId` is `org.apache`—its domain is `org` (because Tomcat is a non-profit project), its organization name is `apache`, and its `artifactId` is `tomcat`.
- **artifactId** (required): Defines the name of the current Maven project; it is the project's unique identifier and corresponds to the name of the project's root directory.
- **version** (required): Defines the current version of the Maven project.
- **packaging** (optional): Defines the packaging format of the Maven project (such as `jar`, `war`, etc.); `jar` is used by default.
- **classifier** (optional): Often used to distinguish artifacts built from the same POM that have different contents; it can be any arbitrary string appended after the version number.

As long as you provide the correct coordinates, you can locate and use the corresponding artifact from a Maven repository.

For example (importing Alibaba's open-source EasyExcel):

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>easyexcel</artifactId>
    <version>3.1.1</version>
</dependency>
```

You can find almost all available artifacts on <https://mvnrepository.com/>. If your project uses Maven as its build tool, you will definitely visit this website frequently.

![Maven Repository](/media/jg/ext/oss.javaguide.cn/javaguide/tools/maven/mvnrepository.com-e0948598.png)

## Maven Dependencies

If an artifact produced by a Maven build (for example, a JAR file) is referenced by another project, that artifact becomes a dependency of the other project.

### Dependency Configuration

**Configuration Example**:

```xml
<project>
    <dependencies>
        <dependency>
            <groupId></groupId>
            <artifactId></artifactId>
            <version></version>
            <type>...</type>
            <scope>...</scope>
            <optional>...</optional>
            <exclusions>
                <exclusion>
                  <groupId>...</groupId>
                  <artifactId>...</artifactId>
                </exclusion>
          </exclusions>
        </dependency>
      </dependencies>
</project>
```

**Configuration Explanation**:

- `dependencies`: Only one such tag can exist in a `pom.xml` file; it is the container tag used to manage dependencies.
- `dependency`: Contained inside the `dependencies` tag; there can be multiple of them, each representing one dependency of the project.
- `groupId`, `artifactId`, `version` (required): The basic coordinates of a dependency. For any dependency, its basic coordinates are the most important part, because Maven uses them to locate the required dependency. We already explained what these elements mean above, so we will not repeat them here.
- `type` (optional): The type of the dependency, corresponding to the `packaging` defined in the artifact's coordinates. In most cases, this element does not need to be declared, and its default value is `jar`.
- `scope` (optional): The scope of the dependency; the default value is `compile`.
- `optional` (optional): Marks whether the dependency is optional.
- `exclusions` (optional): Used to exclude transitive dependencies, such as when resolving JAR version conflicts.

### Dependency Scope

The **classpath** specifies the locations where `.class` files are stored; the ClassLoader loads the required `.class` files from those paths into memory.

Maven uses three different classpaths for compilation, running tests, and actual runtime execution:

- **Compile classpath**: Active when compiling main source code.
- **Test classpath**: Active when compiling and running test code.
- **Runtime classpath**: Active when the project is running.

Maven's dependency scopes are as follows:

- **compile**: Compile dependency scope (default). A dependency with this scope is active across all three classpaths—compile, test, and runtime—meaning the JAR package is needed during compilation, testing, and execution.
- **test**: Test dependency scope. As the name implies, this scope is only used for testing and cannot be used when compiling or running the main project. A typical example is JUnit, which is only needed when compiling and running test code.
- **provided**: This scope is active for compilation and testing, but not at runtime. For example, `servlet-api.jar` is already provided by Tomcat, so we only need it available during compilation.
- **runtime**: Runtime dependency scope. It is active for testing and runtime, but not when compiling main source code. A typical example is a JDBC driver implementation.
- **system**: System dependency scope. When using a `system`-scoped dependency, you must explicitly specify the path to the dependency file via the `systemPath` element. It does not rely on Maven repository resolution, so it can make builds non-portable.

### Transitive Dependencies

### Dependency Conflicts

**1. For Maven, under the same `groupId` and same `artifactId`, only one `version` can be used.**

```xml
<dependency>
    <groupId>in.hocg.boot</groupId>
    <artifactId>mybatis-plus-spring-boot-starter</artifactId>
    <version>1.0.48</version>
</dependency>
<!-- Only version 1.0.49 of this dependency will be used -->
<dependency>
    <groupId>in.hocg.boot</groupId>
    <artifactId>mybatis-plus-spring-boot-starter</artifactId>
    <version>1.0.49</version>
</dependency>
```

If dependencies of the same type (`groupId` and `artifactId`) with different versions exist in the same `pom.xml` file, only the later declared dependency will be imported.

**2. Two dependencies of a project simultaneously pull in a certain dependency.**

For example, suppose a project has the following dependency relationships:

```plain
Dependency chain 1: A -> B -> C -> X(1.0)
Dependency chain 2: A -> D -> X(2.0)
```

There are two versions of `X` along these two dependency paths. To avoid duplicate dependencies, Maven will only select one of them for resolution.

**Which version of `X` will Maven resolve and use?**

When encountering this situation, Maven follows two principles: **Shortest Path First** and **Declaration Order First**. The process of resolving this issue is also known as **Maven Dependency Mediation**.

**Shortest Path First**

```plain
Dependency chain 1: A -> B -> C -> X(1.0) // dist = 3
Dependency chain 2: A -> D -> X(2.0) // dist = 2
```

Dependency chain 2 has the shortest path, so `X(2.0)` will be resolved and used.

However, as you can see, the Shortest Path First principle does not cover all cases—situations with equal path lengths like the one below cannot be resolved by it alone:

```plain
Dependency chain 1: A -> B -> X(1.0) // dist = 2
Dependency chain 2: A -> D -> X(2.0) // dist = 2
```

Therefore, Maven also defines the Declaration Order First principle.

The first dependency mediation principle cannot solve every case—for instance, in a dependency graph like `A->B->Y(1.0)` and `A->C->Y(2.0)`, the path lengths of `Y(1.0)` and `Y(2.0)` are equal, both being 2. Maven defines the second principle of dependency mediation:

**Declaration Order First**

Assuming equal dependency path lengths, the order of dependency declarations in `pom.xml` determines which one gets resolved and used—the dependency declared earliest wins. In this example, if `B` is declared before `D`, then `X(1.0)` will be resolved and used.

```xml
<!-- A pom.xml -->
<dependencies>
    ...
    dependency B
    ...
    dependency D
</dependencies>
```

### Excluding Dependencies

Relying solely on Maven's dependency mediation is unsuitable in many situations and requires us to manually exclude dependencies.

For example, suppose the current project has the following dependency relationships:

```plain
Dependency chain 1: A -> B -> C -> X(1.5) // dist = 3
Dependency chain 2: A -> D -> X(1.0) // dist = 2
```

According to the Shortest Path First principle, `X(1.0)` will be resolved and used—meaning version 1.0 of `X` is actually used.

HOWEVER!!! This causes problems: if dependency `C` uses a class that only exists in version 1.5 of `X`, running the project will throw a `NoClassDefFoundError`. If dependency `C` uses a method that only exists in version 1.5 of `X`, running the project will throw a `NoSuchMethodError`.

Now you know why your Maven projects keep throwing `NoClassDefFoundError` and `NoSuchMethodError`, right?

**How do we fix this?** We can manually exclude `X(1.0)` using the `exclusion` tag.

```xml
<dependency>
    ......
    <exclusions>
      <exclusion>
        <artifactId>x</artifactId>
        <groupId>org.apache.x</groupId>
      </exclusion>
    </exclusions>
</dependency>
```

Generally, when resolving dependency conflicts, we prioritize keeping the higher version. This is because most JARs maintain backward compatibility when upgrading.

If a newer version modifies some classes or methods from an older version, you cannot simply keep the higher version—instead, you should consider optimizing the upper-level dependency, such as upgrading the version of the upper-level dependency.

Taking the same example above:

```plain
Dependency chain 1: A -> B -> C -> X(1.5) // dist = 3
Dependency chain 2: A -> D -> X(1.0) // dist = 2
```

We kept version 1.5 of `X`, but suppose version 1.5 removed certain classes present in version 1.0. In that case, we can consider upgrading `D` to a version compatible with `X(1.5)`.

## Maven Repositories

In the Maven world, any dependency, plugin, or build output of a project can be called an **artifact**.

Coordinates and dependencies are the logical representation of artifacts in the Maven world, while the physical representation of an artifact is a file; Maven manages these files uniformly through repositories. Any artifact has a set of coordinates that uniquely identifies it. With repositories, there is no need to import artifacts manually—we simply specify an artifact's coordinates and Maven can locate it in a Maven repository.

Maven repositories are categorized into:

- **Local Repository**: A directory on the machine running Maven that caches artifacts downloaded from remote repositories and stores temporary artifacts that have not yet been published remotely. You can see the local repository path configuration in `settings.xml`; by default, the local repository path is `${user.home}/.m2/repository`.
- **Remote Repositories**: Maven repositories maintained by official providers or other organizations.

Maven remote repositories can be categorized into:

- **Central Repository**: Maintained by the Maven community, it hosts the vast majority of open-source software packages and serves as Maven's default configuration without requiring extra setup from developers. In addition, for convenient lookup, a [search portal](https://central.sonatype.com/) is provided so developers can quickly search for the coordinates of required artifacts.
- **Private Repository (Nexus/Artifactory)**: A special kind of remote Maven repository deployed on a local area network (LAN). A private repository is typically configured as a mirror of internet remote repositories for Maven users within the LAN.
- **Other Public Repositories**: Some public repositories exist to speed up access (such as the Alibaba Cloud Maven mirror repository) or to host certain artifacts that do not exist in the Central Repository.

Maven dependency resolution order:

1. Check the local repository first; if found, use it directly.
2. If not found in the local repository, search remote repositories and download the package into the local repository.
3. If not found in remote repositories either, an error is reported.

## Maven Lifecycle

The Maven lifecycle exists to abstract and unify all build processes, encompassing nearly every build step such as cleaning, initializing, compiling, testing, packaging, integration testing, verification, deployment, and site generation.

Maven defines 3 lifecycles in `META-INF/plexus/components.xml`:

- `default` lifecycle
- `clean` lifecycle
- `site` lifecycle

These lifecycles are independent of one another, and each lifecycle contains multiple phases. Furthermore, these phases are ordered—meaning later phases depend on earlier ones. When a given phase is executed, all preceding phases in that lifecycle are executed first.

The command format for executing a Maven lifecycle is as follows:

```bash
mvn phase [phase2] ...[phasen]
```

### default Lifecycle

The `default` lifecycle is defined without any bound plugins by itself; it is Maven's primary lifecycle for building applications and consists of 23 phases in total.

```xml
<phases>
  <!-- Validate that the project is correct and all necessary information is available to complete the build process -->
  <phase>validate</phase>
  <!-- Initialize build state, e.g. set properties -->
  <phase>initialize</phase>
  <!-- Generate any source code for inclusion in compilation -->
  <phase>generate-sources</phase>
  <!-- Process the source code -->
  <phase>process-sources</phase>
  <!-- Generate resources for inclusion in the package -->
  <phase>generate-resources</phase>
  <!-- Copy and process the resources into the destination directory, ready for packaging -->
  <phase>process-resources</phase>
  <!-- Compile the source code of the project -->
  <phase>compile</phase>
  <!-- Post-process the generated files from compilation, for example to do bytecode enhancement/optimization on Java classes -->
  <phase>process-classes</phase>
  <!-- Generate any test source code for inclusion in compilation -->
  <phase>generate-test-sources</phase>
  <!-- Process the test source code -->
  <phase>process-test-sources</phase>
  <!-- Generate test source code to be included in the compilation phase -->
  <phase>generate-test-resources</phase>
  <!-- Process files compiled from test code files -->
  <phase>process-test-resources</phase>
  <!-- Compile the test source code -->
  <phase>test-compile</phase>
  <!-- Process files compiled from test code files -->
  <phase>process-test-classes</phase>
  <!-- Run tests using a suitable unit testing framework (JUnit is one of them) -->
  <phase>test</phase>
  <!-- Perform any operations necessary to prepare a package before the actual packaging -->
  <phase>prepare-package</phase>
  <!-- Take the compiled code and package it in its distributable format, such as a JAR, WAR, or EAR file -->
  <phase>package</phase>
  <!-- Perform actions required before integration tests are executed, e.g. setting up the required environment -->
  <phase>pre-integration-test</phase>
  <!-- Process and deploy the package if necessary into an environment where integration tests can be run -->
  <phase>integration-test</phase>
  <!-- Perform actions required after integration tests have been executed, e.g. cleaning up the environment -->
  <phase>post-integration-test</phase>
  <!-- Run any checks to verify the package is valid and meets quality criteria -->
  <phase>verify</phase>
  <!-- Install the package into the local repository, for use as a dependency in other projects locally -->
  <phase>install</phase>
  <!-- Copy the final package to the remote repository for sharing with other developers and projects -->
  <phase>deploy</phase>
</phases>
```

Based on the inter-phase dependency theory mentioned earlier, when we run `mvn test`, all phases from `validate` through `test` are executed—which explains why the project's source code is automatically compiled when running tests.

### clean Lifecycle

The purpose of the `clean` lifecycle is to clean the project, consisting of 3 phases in total:

1. `pre-clean`
2. `clean`
3. `post-clean`

```xml
<phases>
  <!-- Execute processes needed prior to the actual project cleaning -->
  <phase>pre-clean</phase>
  <!-- Remove all files generated by the previous build -->
  <phase>clean</phase>
  <!-- Execute processes needed immediately after the project cleaning -->
  <phase>post-clean</phase>
</phases>
<default-phases>
  <clean>
    org.apache.maven.plugins:maven-clean-plugin:2.5:clean
  </clean>
</default-phases>
```

Based on the inter-phase dependency theory mentioned earlier, when we run `mvn clean`, the `pre-clean` and `clean` phases in the `clean` lifecycle are executed.

### site Lifecycle

The purpose of the `site` lifecycle is to build and publish project documentation sites, consisting of 4 phases in total:

1. `pre-site`
2. `site`
3. `post-site`
4. `site-deploy`

```xml
<phases>
  <!-- Execute processes needed prior to the actual project site generation -->
  <phase>pre-site</phase>
  <!-- Generate the project's site documentation -->
  <phase>site</phase>
  <!-- Execute processes needed after site generation, and prepare for deployment -->
  <phase>post-site</phase>
  <!-- Deploy the generated site documentation to the specified web server -->
  <phase>site-deploy</phase>
</phases>
<default-phases>
  <site>
    org.apache.maven.plugins:maven-site-plugin:3.3:site
  </site>
  <site-deploy>
    org.apache.maven.plugins:maven-site-plugin:3.3:deploy
  </site-deploy>
</default-phases>
```

Maven can automatically generate a friendly project site based on the information contained in `pom.xml`, making it convenient for teams to communicate and publish project information.

## Maven Plugins

Maven is essentially a plugin execution framework; every execution step is carried out independently by plugins. Commands we use every day such as `install`, `clean`, and `deploy` are all implemented by individual Maven plugins under the hood. For Maven's core plugins, you can refer to the official documentation: <https://maven.apache.org/plugins/index.html>.

Default local plugin path: `${user.home}/.m2/repository/org/apache/maven/plugins`

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/maven/maven-plugins-7653c222.png)

Besides Maven's built-in plugins, there are also third-party plugins such as the unit test coverage plugin `jacoco-maven-plugin`, the code style checking plugin `maven-checkstyle-plugin`, and the code quality analysis plugin `sonar-maven-plugin`. Moreover, we can build custom plugins to meet our own needs.

Example usage of `jacoco-maven-plugin`:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.jacoco</groupId>
      <artifactId>jacoco-maven-plugin</artifactId>
      <version>0.8.8</version>
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

You can think of a Maven plugin as a collection of tasks (goals): users can run a specific plugin goal directly from the command line, or bind plugin goals to build lifecycle phases so they execute along with the lifecycle.

Maven plugins are divided into the following two types:

- **Build plugins**: Executed during the build.
- **Reporting plugins**: Executed during site generation.

## Maven Multi-Module Management

Multi-module management simply means splitting a project into multiple modules, where each module is responsible for a single cohesive set of functionality. Visibly, a multi-module Maven project has more than one `pom.xml` file—there are multiple `pom.xml` files across different subdirectories to implement multi-module management.

In addition to making project development and management easier, multi-module management provides the following benefits:

1. Reduces coupling between codebases (elevating coupling from class-level to JAR-level);
2. Reduces duplication and improves reusability;
3. Makes every module self-explanatory (through its module name or module documentation);
4. Standardizes code boundaries, making it easy for developers to identify the exact scope they are responsible for through modules.

Under multi-module management, there is one parent module, and the rest are child modules. The parent module usually contains only a `pom.xml` file and nothing else. The parent module's `pom.xml` typically defines the versions of dependencies, lists the included child modules, and declares plugins. However, note that if a dependency is only used in one specific child module, it should be imported directly in that child module's `pom.xml` to keep the parent POM from becoming bloated.

As shown below, the Dubbo project is divided into multiple submodules such as `dubbo-common` (common logic module), `dubbo-remoting` (remote communication module), and `dubbo-rpc` (remote procedure call module).

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/maven/dubbo-maven-multi-module-dc124c7e.png)

## Recommended Articles

- [Security Engineer Explains Maven's Mediation Mechanism in Transitive Dependency Scenarios - Alibaba Developer - 2022](https://mp.weixin.qq.com/s/flniMiP-eu3JSBnswfd_Ew)
- [Using Java Build Tools Efficiently | Maven Edition - Alibaba Developer - 2022](https://mp.weixin.qq.com/s/Wvq7t2FC58jaCh4UFJ6GGQ)
- [Security Engineer Tells the Story of Maven Repackaging - Alibaba Developer - 2022](https://mp.weixin.qq.com/s/xsJkB0onUkakrVH0wejcIg)

## References

- *Maven in Action*
- Introduction to Repositories - Official Maven Documentation: <https://maven.apache.org/guides/introduction/introduction-to-repositories.html>
- Introduction to the Build Lifecycle - Official Maven Documentation: <https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html#Lifecycle_Reference>
- Maven Dependency Scope: <https://www.mvnbook.com/maven-dependency.html>
- Resolving Maven Dependency Conflicts—This Post Is Enough!: <https://www.cnblogs.com/qdhxhz/p/16363532.html>
- Multi-Module Project with Maven: <https://www.baeldung.com/maven-multi-module>
