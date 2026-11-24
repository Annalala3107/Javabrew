---
title: What Is Unit Testing and How Should You Do It?
description: An introductory guide to unit testing covering unit testing concepts, Mock and Stub techniques, the test pyramid, and how to use the JUnit testing framework.
category: Code Quality
head:
  - - meta
    - name: keywords
      content: Unit Testing,Mock,Stub,Fake,Test Pyramid,Testability,TDD,JUnit
lang: en
sourceRef: zh-ref/system-design/basis/unit-test.md
---

> This article is refactored and expanded from [On Why We Write Unit Tests - Jianpan Nan - 2016](https://www.jianshu.com/p/fa41fb80d2b8).

## What Is Unit Testing?

Wikipedia introduces unit testing as follows:

> In computer programming, unit testing is a software testing method by which individual units of source code (the smallest parts of software design) are tested to verify their correctness.
>
> A program unit is the **smallest testable part** of an application. In procedural programming, a unit may be an individual program, function, or procedure; in object-oriented programming, the smallest unit is a method—including methods in a base class (superclass), abstract class, or derived class (subclass).

Because each unit contains independent logic, when writing unit tests we often use Fakes, Stubs, and Mocks to isolate external dependencies so that those dependencies do not interfere with verifying the unit's logic.

For a clear explanation of the concepts behind Fake, Mock, and Stub, see this article: [Clarifying Fakes, Mocks, and Stubs in Testing - Wang Xiayaoyuexiong - 2018](https://zhuanlan.zhihu.com/p/26942686).

## Why Do We Need Unit Testing?

### Safeguarding Refactoring

As I wrote in [Code Refactoring Guide](./refactoring.md):

> Unit tests provide confidence for refactoring and lower the cost of refactoring. We must value unit tests just as much as production code.

Every developer goes through refactoring, and breaking code after refactoring is far from rare—sometimes modifying even a seemingly simple method can cause a serious bug elsewhere in the system.

Unit tests can catch a share of logic errors promptly and reduce the risk of introducing regressions during refactoring. Write one class, add unit tests for it; write a second class, keep adding unit tests... However, every class passing its own tests independently does not guarantee they will work seamlessly when wired together—issues involving interface contracts, configuration, databases, networking, and transactions still need to be uncovered through integration tests, end-to-end tests, and other layers of testing.

### Improving Code Quality

Because each unit has its own independent logic, unit testing requires isolating external dependencies so they do not affect logic verification. Having to decouple various dependencies encourages breaking a project into cleaner components and untangling dependency relationships, greatly reducing code coupling. Code written this way is easier to maintain and extend, thereby improving overall code quality.

### Reducing Bugs

A machine is made up of many tiny parts; if any single part breaks, the machine malfunctions. Every part must meet the specifications on the blueprint for the machine to run properly.

A unit-testable project divides business logic and features into smaller, logically independent components known as units. The goal of unit testing is to verify that each unit works as expected, thereby lowering the likelihood of localized logic errors and regressions. Whether the entire project runs properly as a whole still needs to be verified together by other layers of testing.

### Pinpointing Bugs Quickly

If a program has a bug, running the full unit test suite and finding the failing tests lets us quickly pinpoint the corresponding execution code. After fixing the code, we re-run the relevant unit tests; if they still fail, we keep adjusting and re-running... until **the tests pass**.

### Continuous Integration Relies on Automated Testing

Continuous Integration (CI) depends on fast, reliable automated tests. When a CI service automatically builds new code, it automatically runs unit tests, integration tests, and other checks to catch code errors—and unit tests are usually the fastest-feedback layer among them.

## Who Forces You to Write Unit Tests?

### Management Requirements

Experienced engineering leads will almost always require the team to write unit tests to some degree. For teammates with solid work experience, this expectation is quite reasonable; for less experienced developers or fresh graduates, though, it can feel agonizing—they're still struggling to write clean production code, and now they have to write unit tests too! *"Are you kidding me?"*

Training junior engineers in unit testing practices is an arduous task. Newcomers haven't yet developed a mature coding style and don't fully appreciate how important unit testing is; forcing unit tests on them can leave them confused and unable to implement code cleanly according to their own train of thought.

### Top Engineers All Write Unit Tests

Many well-known open-source projects abroad contain extensive unit tests—for example, [retrofit](https://link.jianshu.com?t=https://github.com/square/retrofit/tree/master/retrofit/src/test/java/retrofit2), [okhttp](https://link.jianshu.com?t=https://github.com/square/okhttp/tree/master/okhttp-tests/src/test/java/okhttp3), [butterknife](https://link.jianshu.com?t=https://github.com/JakeWharton/butterknife/tree/master/butterknife-compiler/src/test/java/butterknife)... Top engineers write unit tests, so we should too!

Many readers start off with that exact thought, full of enthusiasm. Yet when they actually try to add unit tests to their own projects, they run into endless roadblocks—largely because the project wasn't designed to be test-friendly. In the end, they only write unit tests for trivial utility classes, and over time, that admirable ambition quietly fizzles out.

### Saving Face

If you're a seasoned developer with several years of experience and QA engineers are still chasing you down over bugs every single day, isn't that embarrassing? Spending a bit more time writing unit tests to prevent silly bugs while demonstrating true senior engineering craftsmanship—why wouldn't you do it?

### Peace of Mind

I'm someone who doesn't fully trust my own code either—I always worry a mysterious bug might pop up out of nowhere, or that someone else might accidentally break my code (a touch of paranoia), leaving me anxious every time a new release goes out... Spending a little time writing unit tests and running them whenever needed to ensure existing logic remains intact at least lets you sleep a lot sounder at night.

## TDD: Test-Driven Development

### What Is TDD?

TDD stands for **Test-Driven Development**. It is both a core practice and technique of Agile development and a software design methodology.

The principle of TDD is to write test case code before writing feature code, and then write the feature code specifically to make those test cases pass.

The rhythm of TDD is: **"Red - Green - Refactor."**

![](/media/jg/ext/static001.geekbang.org/image/09/7f/090e1fc6aff08b4aa66376f776c2337f-6caf50c2.webp)

Because TDD demands a lot from developers and runs counter to traditional coding habits, it is quite difficult to put into practice.

In many people's eyes, TDD feels impractical: partly because they don't truly grasp what "test-driven" development means, and even more importantly, because they rarely practice task decomposition. Yet task decomposition is the key to doing TDD well. Only when a task is broken down into testable pieces can you write targeted tests.

### Pros and Cons of TDD

Test-Driven Development has both advantages and disadvantages. Because every test case stems from requirements—breaking a large requirement down into multiple small requirements to write test cases—once the tests are written, the implementation code must satisfy them. If a test fails, you revise the implementation code until the test passes.

**Pros**:

1. Helps you organize requirements and clarify your train of thought;
2. Helps you design cleaner, more sensible interfaces (designing interfaces out of thin air easily results in awful designs);
3. Reduces the probability of bugs appearing in code;
4. Improves development efficiency (provided TDD is used properly and proficiently).

**Cons**:

1. Very few developers can execute TDD well—it looks simple, yet has a high barrier to mastery;
2. Typically requires a greater upfront investment of development resources (time and effort);
3. Because test cases are written before the code is designed, they can potentially constrain the developer's overall architectural design;
4. May cause dissatisfaction among developers—I consider this a serious issue, since not everyone enjoys writing unit tests, even though unit tests bring substantial benefits.

Further reading: [How to Practice TDD the Right Way? - Chen Tian - 2017](https://zhuanlan.zhihu.com/p/24997923).

## How to Choose a Unit Testing Framework and Mocking Tool?

For unit testing, JUnit and Spock are testing frameworks, whereas Mockito, PowerMock, JMockit, and TestableMock are primarily used to create test doubles such as Mocks.

JUnit is virtually the default choice, though it does not include mocking capabilities on its own, so it is typically paired with a mocking library like Mockito. Spock, on the other hand, provides both testing specifications and built-in mocking capabilities.

Should you choose JUnit + Mockito or Spock? Here is a quick comparison:

- Spock 2.4 can mock Java and Groovy static methods using `SpyStatic()` together with a Mock Maker that supports static methods; Mockito 3.4.0 and later also support static method mocking. For details, see the [Spock 2.4 Release Notes](https://spockframework.org/spock/docs/2.4/release_notes.html) and the [Official Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org.mockito/org/mockito/Mockito.html).
- Spock is based on Groovy, resulting in cleaner, more readable, and well-structured test code (with built-in support for the standard `given-when-then` testing structure). Mockito does not enforce a structural convention, so the team must agree on one or follow solid testing practices. Generally speaking, for the same test case, Spock code is more concise.
- Mockito has a broader user base and is mature and reliable. Moreover, Mockito is the default mocking tool integrated into Spring Boot Test.

Both JUnit + Mockito and Spock are great choices, though comparatively speaking, JUnit + Mockito has broader applicability.

## Summary

Unit testing certainly brings substantial benefits, even if they are not immediately obvious. Just like buying critical illness insurance: you pay premiums for years, stay healthy, and might never make a claim for decades—ideally, you never have to file a claim at all, because staying healthy matters most. Unit testing works the same way: writing tests buys peace of mind and serves as a safeguard for your code—if bugs exist, you catch them early; if none exist, even better. After all, you wouldn't complain, *"I wrote all these unit tests and didn't catch a single bug—what a waste of time!"*

Here are a few personal tips on unit testing:

> - The more critical the code, the more essential it is to write unit tests;
> - When code seems impossible to unit test, think about how to improve the design rather than giving up;
> - Write unit tests alongside your business code instead of waiting until an entire new feature is finished;
> - Continuously think about how to improve and simplify your test code;
> - Test code must be refactored and updated alongside the evolution of production code—if tests are not kept clean, they will become increasingly hard to modify.

As an experienced programmer, writing unit tests is ultimately about **taking responsibility for your own code**. Code backed by test cases is easier for others to understand, and when teammates take over your code later, they can modify it with confidence.

**Practice writing more tests and talk with engineers experienced in unit testing**—you'll find the returns you get from writing unit tests grow even greater.
