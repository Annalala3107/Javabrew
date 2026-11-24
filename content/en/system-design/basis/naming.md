---
title: Code Naming Guide
description: A guide to code naming conventions covering principles and techniques for naming variables, methods, and classes to improve code readability and maintainability.
category: Code Quality
head:
  - - meta
    - name: keywords
      content: Code Naming,Naming Conventions,Variable Naming,Function Naming,Class Naming,Readability,Code Quality,Code Review
lang: en
sourceRef: zh-ref/system-design/basis/naming.md
---

I still remember when I first started working—during project Code Reviews, I was frequently criticized for poor variable naming!

Looking back, it was largely due to my lack of experience at the time. Moreover, when building projects in college, I rarely paid attention to these details and just focused on getting features to work.

In a professional environment, however, things are different. For the sake of code readability and maintainability, engineering teams hold high standards for code quality!

Not long ago, a new intern on our team also kept getting called out in Code Reviews for non-standard variable naming, which reminded me of my early days writing code at a company.

So I put together this short article on variable naming conventions, hoping it can help fellow developers facing the same struggle.

Indeed, there are plenty of headaches in programming—such as naming, maintaining someone else's code, writing tests, and communicating with teammates.

It is said that in a Quora poll of nearly 5,000 programmers, the hardest thing in programming was voted to be "naming."

Martin Fowler, the renowned author of *Refactoring*, once wrote in his article [TwoHardThings](https://martinfowler.com/bliki/TwoHardThings.html) that there are only two hard things in Computer Science: **cache invalidation** and **naming things**.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/marting-naming-fb3105be.png)

In fact, Martin Fowler was quoting someone else, and there are many similar sayings in the industry. For instance, there are two hard things in distributed systems: **guaranteed message ordering** and **exactly-once delivery**.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/20210629104844645-f379029e.png)

Today, let's zoom in specifically on "**naming**" and talk about it!

This article pairs even better with my earlier post: [*5 Minutes Coding, 2 Hours Naming? The Most Comprehensive Java Naming Convention Reference!*](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486449&idx=1&sn=c3b502529ff991c7180281bcc22877af&chksm=cea2443af9d5cd2c1c87049ed15ccf6f88275419c7dbe542406166a703b27d0f3ecf2af901f8&token=999884676&lang=zh_CN#rd).

## Why Does Naming Matter?

First, we need to understand why we should care about naming in programming and what it means for our day-to-day coding.

**Why is naming so important?** Because **good naming is self-documenting—someone looking at your names immediately knows what your variable, method, or class does!**

Simply put, **others can understand what your code intends to express just from your names** (assuming, of course, they have basic English proficiency and familiarity with common programming vocabulary).

Let's look at a simple example that illustrates the importance of naming.

The book *Clean Code* explicitly states:

> **Good code itself is the best documentation. We should standardize and polish our code as much as possible to reduce unnecessary comments.**
>
> **If a programming language is expressive enough, comments are unnecessary—strive to explain things through code.**
>
> For example:
>
> Remove the convoluted comment below by simply creating a function that says the exact same thing as the comment:
>
> ```java
> // check to see if the employee is eligible for full benefits
> if ((employee.flags & HOURLY_FLAG) && (employee.age > 65))
> ```
>
> Should be replaced with:
>
> ```java
> if (employee.isEligibleForFullBenefits())
> ```

## Common Naming Styles and Use Cases

Here we introduce only the 3 most common naming conventions.

### CamelCase

CamelCase is probably the naming convention we see most often. It separates words using mixed uppercase and lowercase letters, without spaces or connecting characters between words.

#### UpperCamelCase (PascalCase)

**Class names must use UpperCamelCase.**

Good examples:

```java
ServiceDiscovery, ServiceInstance, LruCacheFactory
```

Bad examples:

```java
serviceDiscovery, Serviceinstance, LRUCacheFactory
```

#### lowerCamelCase

**Method names, parameter names, member variables, and local variables must use lowerCamelCase.**

Good examples:

```java
getUserInfo()
createCustomThreadPool()
setNameFormat(String nameFormat)
UserService userService;
```

Bad examples:

```java
GetUserInfo(), CreateCustomThreadPool(), setNameFormat(String NameFormat)
UserService user_service;
```

### snake_case

**Test method names may use `snake_case` depending on team conventions, while constants and enum constants typically use UPPER_SNAKE_CASE.**

In `snake_case`, words are connected with an underscore `_`, such as `should_get_200_status_code_when_request_is_valid` and `CLIENT_CONNECT_SERVER_FAILURE`.

The advantage of `snake_case` shines when a name requires many words. For comparison, here is that same name written in lowerCamelCase: `shouldGet200StatusCodeWhenRequestIsValid`.

How does that feel? Compared to `snake_case`, isn't it noticeably harder to read?

Good example:

```java
@Test
void should_get_200_status_code_when_request_is_valid() {
  ......
}
```

Another common style:

```java
@Test
void shouldGet200StatusCodeWhenRequestIsValid() {
  ......
}
```

### kebab-case

In `kebab-case`, words are connected with a hyphen `-`, such as `dubbo-registry`.

It is recommended to use `kebab-case` for project folder names. For example, the modules in the Dubbo project are named as shown below:

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/dubbo-naming-0e2bf261.png)

## Common Naming Conventions

### Basic Java Naming Conventions

**1. Class names must use UpperCamelCase. Method names, parameter names, member variables, and local variables must use lowerCamelCase.**

**2. There is no single mandatory rule for test method names—they may use `snake_case` according to team conventions**, such as `should_get_200_status_code_when_request_is_valid`. Constants and enum constants generally use UPPER_SNAKE_CASE, such as `CLIENT_CONNECT_SERVER_FAILURE`; enum type names themselves still use UpperCamelCase.

**3. Project folder names use `kebab-case`, such as `dubbo-registry`.**

**4. Package names must be all lowercase, use single nouns wherever possible, separate words with `.`, and keep each word singular.**

Good example: `org.apache.dubbo.common.threadlocal`

Bad example: ~~`org.apache_dubbo.Common.threadLocals`~~

**5. Abstract class names start with `Abstract`.**

```java
// An abstract class extracted for the remote transport layer (source: Dubbo source code)
public abstract class AbstractClient extends AbstractEndpoint implements Client {

}
```

**6. Exception class names end with `Exception`.**

```java
// Custom NoSuchMethodException (source: Dubbo source code)
public class NoSuchMethodException extends RuntimeException {
    private static final long serialVersionUID = -2725364246023268766L;

    public NoSuchMethodException() {
        super();
    }

    public NoSuchMethodException(String msg) {
        super(msg);
    }
}
```

**7. Test class names start with the name of the class being tested and end with `Test`.**

```java
// Test class written for AnnotationUtils (source: Dubbo source code)
public class AnnotationUtilsTest {
  ......
}
```

Whether a boolean field in a POJO class should use the `is` prefix depends on accessor generation rules and serialization frameworks. Typically, you can name a primitive `boolean` field `active` and provide `isActive()`, and name a wrapper `Boolean` field `active` and provide `getActive()`. If a framework infers a property name differently than expected, lock down the property name via explicit accessors or serialization annotations.

If a module, interface, class, or method implements a design pattern, its name should reflect that specific pattern.

### Readability Conventions for Naming

**1. To keep names easy to understand and read, avoid abbreviating or shortening words unless the abbreviation is universally recognized. For instance, `CustomThreadFactory` must not be written as ~~`CustomTF`~~.**

**2. Unlike functions, names do not need to be kept as short as possible—a more readable name takes priority over a shorter one, even if it ends up slightly longer.** This aligns with point 1 above.

**3. Avoid meaningless names—every name you choose should clearly express its intent.**

Good examples: `UserService userService;` `int userCount;`

Bad examples: ~~`UserService service`~~ ~~`int count`~~

**4. Avoid overly long names (keeping them within 50 characters is best); excessively long names are hard to read and look awkward.**

**5. Do not use Pinyin (romanized Chinese), and certainly never use Chinese characters.** However, internationally recognized proper nouns such as `alibaba`, `wuhan`, and `taobao` can be treated as English words.

Good example: `discount`

Bad example: ~~`dazhe`~~ (Chinese pinyin for "discount")

## Codelf: A Magic Tool for Naming Variables?

Codelf is a website developed by a Chinese developer that many people online hail as a "magic tool for variable naming." After using it for a few days myself, I felt it wasn't quite as handy as claimed. You can try it out for yourself and form your own opinion.

Codelf offers an online web version at [https://unbug.github.io/codelf/](https://unbug.github.io/codelf/). Here is how it works in practice:

I selected the Java programming language and searched for the keyword "serialization," and it returned many naming suggestions related to serialization.

![](/media/jg/local/system-design/basis/pictures/Codelf-637d0a.png)

In addition, Codelf provides a VS Code extension. Judging from the ratings, developers seem quite fond of this naming tool.

![](/media/jg/local/system-design/basis/pictures/vscode-codelf-89ace4.png)

## Recommended Further Reading

1. *Alibaba Java Coding Guidelines*
2. *Clean Code*
3. Google Java Style Guide: <https://google.github.io/styleguide/javaguide.html>
4. [5 Minutes Coding, 2 Hours Naming? The Most Comprehensive Java Naming Convention Reference!](https://www.cnblogs.com/liqiangchn/p/12000361.html)

## Summary

As a competent programmer, you should already appreciate how important expressive, self-explanatory code is. To write high-quality code, good naming is the very first step!

Good names make it dramatically easier for others (including your future self) to understand your code. The easier your code is to understand, the more maintainable it becomes—which also reflects how well-designed your code is!

In daily coding, keep common naming conventions in mind, such as using UpperCamelCase for class names and avoiding Pinyin or Chinese characters in identifiers.

Also, the website called Codelf (built by a Chinese developer) is widely known as a "variable naming tool"—whenever you're stuck trying to come up with a good name, you can check out the naming examples it offers.

Finally, I hope none of you ever have to struggle with naming again!
