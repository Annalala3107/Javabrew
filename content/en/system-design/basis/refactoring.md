---
title: Code Refactoring Guide
description: A practical guide to code refactoring covering the definition of refactoring, refactoring principles, identifying code smells, and common refactoring techniques and best practices.
category: Code Quality
head:
  - - meta
    - name: keywords
      content: Code Refactoring,Refactoring Techniques,Refactoring Principles,Design Patterns,SOLID,Code Smells,Maintainability,Unit Testing
lang: en
sourceRef: zh-ref/system-design/basis/refactoring.md
---

Not long ago, I reread [*Refactoring: Improving the Design of Existing Code*](https://book.douban.com/subject/30468597/) and gained a lot from it. So I wrote this brief article to share my thoughts on refactoring.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220311155746549-102ce4a8.png)

## What Is Refactoring?

The must-read classic on refactoring, *Refactoring: Improving the Design of Existing Code*, defines refactoring from two perspectives:

> - Refactoring (noun): A change made to the internal structure of software to make it easier to understand and cheaper to modify without changing its observable behavior.
> - Refactoring (verb): To restructure software by applying a series of refactorings without changing its observable behavior.

Put in more down-to-earth engineering terms: **Refactoring is improving the internal structure of code through a series of small steps without changing the software's observable behavior, making the code easier to understand and easier to modify.** Design patterns and software design principles provide direction for refactoring, while automated tests serve as a vital safety net.

Software design principles guide how we organize and standardize code, and at the same time, refactoring aims to bring our software closer to satisfying those design principles.

The key to proper refactoring is **taking small steps—each step must not break the normal functioning of the software, and you can stop refactoring at any time.**

**Common design patterns are shown below**:

![Common design patterns](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/common-design-patterns-d21b921f.png)

For a more comprehensive summary of design patterns, check out the open-source project **[java-design-patterns](https://github.com/iluwatar/java-design-patterns)**.

**Common software design principles are shown below**:

![Common software design principles](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/programming-principles-27e032f4.png)

For a more comprehensive summary of design principles, check out the two open-source projects **[java-design-patterns](https://github.com/iluwatar/java-design-patterns)** and **[hacker-laws-zh](https://github.com/nusr/hacker-laws-zh)**.

## Why Refactor?

When introducing the definition of refactoring above, I described its benefits somewhat abstractly: the primary goal of refactoring is to make code easier to understand and reduce the cost of future changes.

In the context of a real project, what concrete benefits does refactoring bring us?

1. **Makes code easier to understand**: Through clearer comments, standardized naming, and simplified logic, code becomes much easier for everyone to read and grasp.
2. **Prevents code rot**: Eliminates code smells through targeted refactoring.
3. **Deepens understanding of the codebase**: The process of refactoring naturally forces you to understand how a piece of code actually works.
4. **Uncovers hidden bugs**: Indeed, many subtle bugs are discovered precisely while refactoring.
5. ......

Looking at the benefits listed above, you'll realize that the ultimate goal of refactoring is **to improve both software development speed and quality**.

Refactoring does not slow down software development. On the contrary, if code quality and software design are poor, development speed will gradually grind to a halt whenever you try to add new features. Eventually, you may even feel the urge to rewrite the entire system from scratch.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/bad-good-design-039e0129.png)

As *Refactoring: Improving the Design of Existing Code* puts it:

> The sole purpose of refactoring is to make us develop faster, creating greater value with less effort.

## Is Performance Optimization the Same as Refactoring?

The goal of refactoring is to improve code readability, maintainability, and flexibility. It focuses on the internal structure of the code—making it easier for developers to understand and making future feature development and maintenance more efficient. Performance optimization, on the other hand, aims to make code run faster and consume fewer resources. It focuses on the program's external behavior—reducing response times, lowering resource consumption, and increasing system throughput. While the two may seem at odds, their overarching objective is the same: improving overall software quality.

In real-world development, the ideal approach is to first **ensure code readability and maintainability**, and then apply appropriate performance optimizations based on actual requirements. Great software design does not blindly chase maximum performance; rather, it strikes a balance between maintainability and performance. That way, we can build software systems that are both **easy to manage** and **performant**.

## When Should You Refactor?

Refactoring can happen at any time during development on an opportunistic basis—there is no need to set aside one or two dedicated days solely for refactoring.

### Before Committing Code

*Refactoring: Improving the Design of Existing Code* introduces the concept of the **Boy Scout Rule (Campground Rule)**:

> When programming, follow the Boy Scout Rule: always leave the codebase healthier than you found it.

The core idea is simple: before you commit your code, take a moment to ask yourself—does this commit leave the project code healthier, more decayed, or roughly unchanged?

Only when every member of the team ensures their commits do not make the codebase deteriorate will the project evolve in a healthy direction.

**When we leave the campground (the codebase), let's not leave litter (code smells) behind! Do our best to leave the campsite cleaner than before!**

### Before and After Developing a New Feature

After finishing a new feature, we should look back to see if anything can be improved. And before adding a new feature, we should consider whether refactoring the existing code first would make implementing the new feature easier.

Developing a new feature shouldn't end as soon as functional tests pass—we should also strive to uphold code quality.

There is a "Two Hats" metaphor: before implementing a new feature, if I realize refactoring will make the feature easier to build, I put on the refactoring hat. Once refactoring is done, I switch back to the original hat and continue building the feature. After the feature is complete, if I notice my new code is hard to understand, I put the refactoring hat back on. The healthiest development rhythm is switching smoothly back and forth between refactoring and feature development like this.

![Two Hats of Refactoring](/media/jg/ext/oss.javaguide.cn/github/javaguide/refractor-two-hats-50767619.png)

### After Code Review

Code Review is remarkably effective at raising overall code quality—it helps us spot code smells and potential bugs. Moreover, Code Review helps other engineers on the team understand the business modules you own, effectively eliminating single-person knowledge silos.

Going through a Code Review will often give you plenty of constructive suggestions to improve your code.

### Litter-Pickup Refactoring

When we spot code smells (litter) while working, if we don't want to interrupt our current task yet don't want to ignore the mess either, we can handle it like this:

- If the mess is easy to clean up, refactor it right away.
- If it isn't easy to refactor on the spot, jot it down and come back to refactor it once your current task is finished.

### While Reading to Understand Code

As developers, you know this feeling well: we constantly have to read code written by teammates as well as code we wrote ourselves in the past. In fact, we usually spend far more time reading code than writing it.

While reading code to understand it, if you discover code smells, that is a great moment to refactor them.

For example, when reading a piece of code written by a teammate and finding the logic overly convoluted and hard to follow, if you see a cleaner way to express it, you can refactor that block of logic right then.

## What Should You Watch Out For When Refactoring?

### Automated Tests Are Your Safety Net for Refactoring

**Automated tests give you confidence to refactor and lower the cost of refactoring. Unit tests typically provide the fastest feedback loop, while integration tests and acceptance tests together form a broader safety net. We must value test code just as much as production code.**

On a related note, Continuous Integration (CI) also relies on fast, reliable automated tests. When a CI service automatically builds new code, it runs tests automatically to catch bugs early.

**What counts as a unit test?** Definitions online can be numerous and abstract, making it easy to get confused. In my view, what constitutes a unit test depends primarily on your project—a single function or even an entire class can be treated as a unit. For instance, if you write a method that calculates personal stock returns and write a unit test specifically to verify its correctness, or if you have a class dedicated to data masking and write unit tests to verify the masking behavior matches expectations, those are unit tests.

**Unit tests also need to be refactored and updated.** As [*Clean Code: A Handbook of Agile Software Craftsmanship*](https://book.douban.com/subject/4199741/) puts it:

> Test code must evolve alongside production code. If tests are not kept clean, they will become increasingly difficult to change.

### Don't Refactor Just for the Sake of Refactoring

**Refactoring must always deliver value to the project!** In certain situations, we should avoid refactoring:

- Blindly forcing a newly learned design pattern or engineering practice onto a project regardless of actual needs (avoid cargo cult programming).
- When project deadlines are tight, refactoring the underlying implementation of an API the project calls when doing so brings no meaningful benefit to how the project uses that API.
- When rewriting from scratch is simpler and cheaper than refactoring.
- ......

### Follow Proven Methods

*Refactoring: Improving the Design of Existing Code* catalogs common code smells (such as Duplicated Code and Long Function) and refactoring techniques (such as Extract Function, Extract Variable, and Extract Class). We should invest time in studying this refactoring theory and applying those techniques in real codebases.

## How to Practice Refactoring?

Beyond practicing and honing your refactoring skills directly inside your project codebases, you can also explore these resources:

- [What I Think About When I Refactor](https://mp.weixin.qq.com/s/pFaFKMXzNCOuW2SD9Co40g): This article from Zhuanzhuan Tech summarizes common refactoring scenarios and approaches.
- [Hands-On Refactoring Exercises](https://linesh.gitbook.io/refactoring/): Guides you step by step through refactoring using small practical case studies!
- [Refactoring & Design Patterns Learning Site](https://refactoringguru.cn/): Free online resource for learning code refactoring, design patterns, and SOLID principles (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion).
- [Official IntelliJ IDEA Code Refactoring Guide](https://www.jetbrains.com/help/idea/refactoring-source-code.html#popular-refactorings): Teaches you how to use IntelliJ IDEA's built-in refactoring tools.

## References

- [Rereading *Refactoring* - ThoughtWorks Insights - 2020](https://insights.thoughtworks.cn/reread-refactoring/): Covers key refactoring concepts in detail, such as small-step refactoring and litter-pickup refactoring.
- [Common Code Refactoring Techniques - VectorJin - 2021](https://juejin.cn/post/6954378167947624484): Introduces how to refactor from the perspectives of software design principles, design patterns, code layering, and naming conventions, with a practical focus.
