---
title: "System Design Fundamentals: RESTful API, Software Engineering, Code Naming, Refactoring, and Unit Testing"
description: "System design fundamentals interview and backend engineering learning roadmap covering RESTful API, software engineering, code naming, code refactoring, and unit testing."
category: System Design
tag:
  - System Design
  - Engineering Fundamentals
  - RESTful API
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: System Design Fundamentals,RESTful API,Software Engineering,Code Naming,Code Refactoring,Unit Testing,JUnit,Backend Engineering Fundamentals,Backend Interview
lang: en
sourceRef: zh-ref/system-design/basis/README.md
---

The System Design Fundamentals topic focuses on the engineering capabilities in backend development that are easiest to overlook yet have the greatest long-term impact: how APIs are designed, how code is named, how code smells are identified, how tests are written, and how the process from requirements to delivery is organized.

These subjects may not look as "hardcore" as caching, message queues, or database sharding, but they determine whether a system can actually be maintained by a team over the long run.

## Who Is This For

- Developers looking to systematically fill gaps in backend engineering fundamentals.
- Candidates preparing for interview questions related to RESTful APIs, code quality, and unit testing.
- Readers who can already implement business features, yet want to improve their API design and code maintainability.
- Engineers who need to establish API conventions, naming conventions, or testing standards for a team.

## Learning Focus

- The core of RESTful APIs is not a rigid URL template, but designing clear, consistent, and evolvable interfaces centered around resources.
- Software engineering focuses on the entire process of requirements, design, development, testing, delivery, and maintenance.
- Good naming reduces communication overhead, while bad naming makes a system progressively harder to change.
- Refactoring is not "rewriting"—it is improving the internal structure of code while preserving its external behavior.
- Unit tests must serve code quality and confidence in making changes, rather than chasing coverage numbers alone.

## Recommended Reading Order

1. [A Concise Guide to Software Engineering](./software-engineering.md): First understand the software development process, development models, and foundational engineering concepts.
2. [A Concise Guide to RESTful APIs](./RESTfulAPI.md): Learn resource paths, HTTP methods, status codes, and API design conventions.
3. [Code Naming Guide](./naming.md): Build clear, consistent, and readable naming habits.
4. [Code Refactoring Guide](./refactoring.md): Identify code smells and understand common refactoring principles and techniques.
5. [What Is Unit Testing and How Should You Do It?](./unit-test.md): Finally, use testing to build confidence when making code changes.

## Core Articles

- [A Concise Guide to Software Engineering](./software-engineering.md): Reviews foundational concepts such as the software crisis, software development process models, the Waterfall model, and Agile development.
- [A Concise Guide to RESTful APIs](./RESTfulAPI.md): Explains REST architectural principles, resource path design, HTTP method usage, and status code conventions.
- [Code Naming Guide](./naming.md): Summarizes principles and tips for naming variables, methods, and classes to improve code readability and maintainability.
- [Code Refactoring Guide](./refactoring.md): Covers the definition of refactoring, refactoring principles, identifying code smells, and common refactoring techniques.
- [What Is Unit Testing and How Should You Do It?](./unit-test.md): Covers unit testing concepts, Mock vs. Stub, the test pyramid, and JUnit basics.

## High-Frequency Questions

- What is the difference between REST and RESTful API?
- How should resource paths be named in a RESTful API?
- Which scenarios suit GET, POST, PUT, PATCH, and DELETE respectively?
- Why is software engineering more than just writing code?
- What principles should good code naming follow?
- What are code smells, and when should you refactor?
- What is the difference between refactoring and rewriting?
- What are the differences among unit testing, integration testing, and end-to-end testing?
- What problems do Mock and Stub solve respectively?
- Is higher unit test coverage always better?

## Related Topics

- [System Design Knowledge Base](../)
- [Design Patterns Common Interview Questions Summary](../design-pattern.md)
- [Spring & Spring Boot Topic](../framework/spring/)
