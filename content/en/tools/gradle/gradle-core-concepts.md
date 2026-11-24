---
title: Gradle Core Concepts Summary
description: "Gradle is an automated build tool running on the JVM that supports flexible task orchestration, dependency management, plugin extensions, and multi-project builds."
category: Developer Tools
head:
  - - meta
    - name: keywords
      content: Gradle,Groovy,Gradle Wrapper,Gradle Plugin
lang: en
sourceRef: zh-ref/tools/gradle/gradle-core-concepts.md
---

> This content is primarily compiled from the official Gradle documentation with selective trimming to retain the most important parts. It does not cover hands-on practice and focuses mainly on introducing key concepts.

This Gradle section is optional—you can decide whether to learn it based on your own needs. In domestic Java backend projects, Maven is still more common, but Gradle is also widely used in Android, some Spring Boot projects, and projects that require highly customized build pipelines.

## Introduction to Gradle

The official Gradle documentation introduces Gradle as follows:

> Gradle is an open-source [build automation](https://en.wikipedia.org/wiki/Build_automation) tool flexible enough to build almost any type of software. Gradle makes few assumptions about what you’re trying to build or how to build it. This makes Gradle particularly flexible.

Simply put, Gradle is an automated project build tool running on the JVM that helps us complete build tasks such as compiling, testing, packaging, and publishing.

For developers, Gradle serves 3 main roles:

1. **Project Building**: Provides a standardized, cross-platform, automated way to build projects.
2. **Dependency Management**: Conveniently and quickly manages the resources (JAR packages) a project depends on, avoiding version conflicts between dependencies.
3. **Unified Development Structure**: Provides a standard, unified project directory structure.

Gradle build scripts can be written using Groovy DSL or Kotlin DSL. Nowadays, Kotlin DSL is also very common in new projects, and its type hints and IDE support are generally better.

## Introduction to Groovy

Gradle is a program running on the JVM, and its build scripts can be written in Groovy or Kotlin. Historically, many Gradle examples use Groovy DSL, so learning a bit of Groovy syntax first is very helpful for reading legacy projects.

Groovy is a scripting language running on the JVM. It is a dynamic language extended from Java whose syntax is very similar to Java and can use Java's class libraries. Groovy can be used for object-oriented programming as well as purely as a scripting language. In language design, it incorporates strong features from Java, Python, Ruby, and Smalltalk, such as dynamic type conversion, closures, and metaprogramming support.

We can learn Groovy the way we learn Java, so the learning curve is relatively low—even if you forget Groovy syntax during development, you can still keep coding using Java syntax.

There are many JVM-based languages, such as Groovy, Kotlin, Java, and Scala; they are all ultimately compiled into Java bytecode files and run on the JVM.

## Advantages of Gradle

Gradle is a next-generation build system with many advantages such as high efficiency and flexibility, and it is widely used in Java development. Not only has Android adopted it as its official build system, more and more Java projects such as Spring Boot have gradually migrated to Gradle as well.

- **Flexibility**: Gradle supports writing scripts in Groovy, emphasizing flexibility in the build process; it is well suited for projects with high build complexity and can accomplish very complex builds.
- **Granularity**: Gradle's build granularity goes down to each individual Task. Moreover, all of its Task source code is open source—once we master the entire packaging flow, we can dynamically alter its execution flow by modifying its Tasks.
- **Extensibility**: Gradle supports a plugin mechanism, so we can reuse plugins just as easily and conveniently as reusing libraries.

## Introduction to Gradle Wrapper

The official Gradle documentation introduces the Gradle Wrapper as follows:

> The recommended way to execute any Gradle build is with the help of the Gradle Wrapper (in short just “Wrapper”). The Wrapper is a script that invokes a declared version of Gradle, downloading it beforehand if necessary. As a result, developers can get up and running with a Gradle project quickly without having to follow manual installation processes saving your company time and money.

We can think of the Gradle Wrapper as a wrapper around Gradle that wraps Gradle again so that all Gradle build commands run with the help of the Gradle Wrapper.

The workflow diagram of the Gradle Wrapper is shown below (image source: [Official Gradle Wrapper Documentation](https://docs.gradle.org/current/userguide/gradle_wrapper.html)):

![Wrapper workflow](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/efa7a0006b04051e2b84cd116c6ccdfc-6b4abbc2.png)

The entire workflow is mainly divided into the following 3 steps:

1. First, when we start out, if the specified version has not been downloaded yet, it downloads the archive for the corresponding version from Gradle's servers;
2. Once the download completes, it unpacks the archive and executes the batch/shell script;
3. Every subsequent build of the project reuses this unpacked Gradle version.

Gradle Wrapper brings us the following benefits:

1. Standardizes a project on a given Gradle version, leading to more reliable and robust builds.
2. Allows running a Gradle project without having Gradle installed on our machine.
3. Provisioning a new Gradle version for different users and execution environments (such as IDEs or Continuous Integration servers) is as simple as changing the Wrapper definition.

### Generating the Gradle Wrapper

To generate the Gradle Wrapper for the first time, you need an available Gradle installation locally. Gradle already includes a built-in `wrapper` Task—simply run the `gradle wrapper` command in the project root directory to generate the Gradle Wrapper.

When running the `gradle wrapper` command, you can specify parameters to control how the wrapper is generated. Specifically, the following configuration parameters are available:

- `--gradle-version`: Specifies the Gradle version to use.
- `--gradle-distribution-url`: Specifies the URL from which to download the Gradle distribution; this value typically looks like `https://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`.
- `--gradle-distribution-sha256-sum`: Specifies the SHA-256 checksum of the distribution archive to reduce the risk of downloading a tampered file.

After running the `gradle wrapper` command, the Gradle Wrapper is generated, producing the following files in the project root directory:

```plain
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
└── gradlew.bat
```

The meaning of each file is as follows:

- `gradle-wrapper.jar`: Contains the runtime logic for the Gradle Wrapper.
- `gradle-wrapper.properties`: Defines the Gradle version and runtime behavior properties for the Wrapper.
- `gradlew`: The wrapper script for executing Gradle commands on Linux/macOS platforms.
- `gradlew.bat`: The wrapper script for executing Gradle commands on Windows platforms.

The contents of `gradle-wrapper.properties` look like this:

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-6.0.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

- `distributionBase`: The parent directory where unpacked Gradle distributions are stored.
- `distributionPath`: A subdirectory under `distributionBase`. `distributionBase + distributionPath` is the exact directory where unpacked Gradle is stored.
- `distributionUrl`: The download URL for the specified Gradle version's archive.
- `zipStoreBase`: The parent directory where downloaded Gradle archives are stored.
- `zipStorePath`: A subdirectory under `zipStoreBase`. `zipStoreBase + zipStorePath` is the storage location for the Gradle archive.

### Updating the Gradle Wrapper

There are 2 ways to update the Gradle Wrapper:

1. Directly modify the `distributionUrl` field, then run a Gradle command.
2. Run `./gradlew wrapper --gradle-version [version]`.

The following command upgrades the Gradle version to `9.5.1`.

```shell
./gradlew wrapper --gradle-version 9.5.1
```

The `distributionUrl` property in `gradle-wrapper.properties` changes accordingly:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.5.1-bin.zip
```

Once the project has generated the Wrapper, prefer using `./gradlew build` for daily builds instead of running a locally installed `gradle build` directly. This ensures team members and CI use the same Gradle version.

### Customizing the Gradle Wrapper

Gradle comes with a built-in `wrapper` Task, so generating the Gradle Wrapper creates its properties file, and that properties file can be configured by customizing the `wrapper` Task. For example, if we want to change the Gradle version to download to `9.5.1`, we can configure it like this:

```groovy
tasks.wrapper {
    gradleVersion = '9.5.1'
}
```

You can also configure settings such as the download URL for the Gradle distribution archive and the local storage path for the unpacked Gradle distribution:

```groovy
tasks.wrapper {
    gradleVersion = '9.5.1'
    distributionUrl = '../../gradle-9.5.1-bin.zip'
    distributionPath = 'wrapper/dists'
}
```

The `distributionUrl` property can be set to a local project directory path, or you can set it to a remote network URL.

## Gradle Tasks

In Gradle, a **Task** represents a single atomic unit of work performed by a build.

Gradle builds are Task-based: when you run a project, you are actually executing a series of Tasks—such as the Task that compiles Java source code or the Task that generates a JAR file.

A Task is declared as follows (there are several other declaration styles as well):

```groovy
// Declare a Task named helloTask
task helloTask{
     doLast{
       println "Hello"
     }
}
```

After creating a Task, you can add different Actions to it as needed. The `doLast` above appends an Action to the end of the Action queue.

```groovy
 // Add an Action to the front of the Action queue
 Task doFirst(Action<? super Task> action);
 Task doFirst(Closure action);

 // Add an Action to the end of the Action queue
 Task doLast(Action<? super Task> action);
 Task doLast(Closure action);

 // Remove all Actions
 Task deleteAllActions();
```

A Task can contain multiple Actions, which are executed sequentially from the front of the queue to the end of the queue.

Actions represent individual functions or methods, and each Task is an execution graph composed of Actions ordered sequentially.

The keyword for declaring Task dependencies is `dependsOn`, which supports declaring one or multiple dependencies:

```groovy
task first {
 doLast {
        println "+++++first+++++"
    }
}
task second {
 doLast {
        println "+++++second+++++"
    }
}

// Specify multiple task dependencies
task print(dependsOn :[second,first]) {
 doLast {
      logger.quiet "Specifying multiple task dependencies"
    }
}

// Specify a single task dependency
task third(dependsOn : print) {
 doLast {
      println '+++++third+++++'
    }
}
```

Before executing a Task, its dependent Tasks will be executed first.

We can also configure default Tasks; even if we do not explicitly invoke a default Task in the script or command, it will still run:

```groovy
defaultTasks 'clean', 'run'

task clean {
    doLast {
        println 'Default Cleaning!'
    }
}

task run {
    doLast {
        println 'Default Running!'
    }
}
```

Gradle also includes many built-in Task types, such as `Copy` (copying files) and `Delete` (deleting files):

```groovy
task deleteFile(type: Delete) {
    delete "C:\\Users\\guide\\Desktop\\test"
}
```

## Gradle Plugins

Gradle provides a core build mechanism, while Gradle plugins implement specific build logic on top of that mechanism—essentially, they serve the same purpose as `.gradle` script files. You can view a Gradle plugin as a tool that encapsulates and executes a series of Tasks.

Gradle plugins are mainly divided into two categories:

- **Script plugins**: A script plugin is simply a regular script file that can be imported into other build scripts.
- **Binary plugins / Object plugins**: Defined in a separate plugin module and applied by other modules via a Plugin ID. Because this approach is much friendlier for publishing and reuse, the Gradle plugins we generally encounter are binary plugins.

Although there is no fundamental difference between a Gradle plugin and a `.gradle` file—and a `.gradle` file can achieve similar functionality—Gradle plugins encapsulate build logic in standalone modules, providing a noticeably better experience from development through usage:

- **Logic Reuse**: Makes the same logic reusable across multiple similar projects, reducing the overhead of maintaining duplicate logic. While `.gradle` files can also reuse logic, Gradle plugins offer better encapsulation.
- **Component Publishing**: Plugins can be published to a Maven repository for management, allowing other projects to depend on them via Plugin ID. While `.gradle` files can also be placed at a remote URL for other projects to reference, plugins are cleaner to manage.
- **Build Configuration**: Gradle plugins can declare plugin extensions to expose configurable properties and provide customization capabilities. While `.gradle` files can achieve this as well, the implementation is more cumbersome.

## Gradle Build Lifecycle

The Gradle build lifecycle has three phases: the **Initialization phase**, the **Configuration phase**, and the **Execution phase**.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/dadbdf59fccd9a2ebf60a2d018541e52-7b92535e.png)

We can register custom hooks between the Initialization phase and Configuration phase, after the Configuration phase completes, and after the Execution phase completes.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/5c297ccc4dac83229ff3e19caee9d1d2-7361439b.png)

### Initialization Phase

Gradle supports single-project and multi-project builds. During the Initialization phase, Gradle determines which projects will participate in the build and creates a [`Project` instance](https://docs.gradle.org/current/dsl/org.gradle.api.Project.html) for each project. Essentially, this means executing the `settings.gradle` script to determine how many `Project` instances exist across the entire build.

### Configuration Phase

During the Configuration phase, Gradle parses each project's `build.gradle` file, builds the subset of tasks to be executed, determines the relationships among various tasks so they can be executed in order during the Execution phase, and performs initialization configuration for those tasks.

Each `build.gradle` corresponds to a `Project` object; the code executed during the Configuration phase includes statements, closures, and task configuration blocks inside `build.gradle`.

After the Configuration phase finishes, Gradle constructs a **Directed Acyclic Graph (DAG)** based on the dependency relationships among Tasks.

### Execution Phase

During the Execution phase, Gradle executes the subset of tasks created and configured during the Configuration phase.

## References

- Official Gradle Documentation: <https://docs.gradle.org/current/userguide/userguide.html>
- Gradle Beginner Tutorial: <https://www.imooc.com/wiki/gradlebase>
- This Article Is Enough for a Quick Start with Groovy: <https://cloud.tencent.com/developer/article/1358357>
- [Gradle] Detailed Explanation of the Gradle Lifecycle: <https://juejin.cn/post/7067719629874921508>
- Step-by-Step Guide to Customizing Gradle Plugins — Gradle Series (2): <https://www.cnblogs.com/pengxurui/p/16281537.html>
- Gradle Pitfall Guide — Understanding Plugins, Tasks, and the Build Flow: <https://juejin.cn/post/6889090530593112077>
