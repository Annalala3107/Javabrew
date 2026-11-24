---
title: "System Design Knowledge Base: Design Patterns, Engineering Fundamentals, Authentication & Authorization, Data Security, and Common Frameworks"
description: "System design interview and knowledge roadmap covering design patterns, RESTful API, software engineering, code refactoring, unit testing, authentication and authorization, data security, Spring, and real-time messaging."
category: System Design
tag:
  - System Design
  - Design Patterns
  - Backend Interview
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: System Design,System Design Interview Questions,Design Patterns,RESTful API,Software Engineering,Code Refactoring,Unit Testing,Authentication and Authorization,JWT,SSO,Permission System,Data Security,Spring,Spring Boot,MyBatis,Netty,Scheduled Tasks,Real-Time Messaging,Backend Interview
lang: en
sourceRef: zh-ref/system-design/README.md
---

This **System Design Knowledge Base** is designed for backend engineering study, hands-on practice, and interview preparation. It curates the site's system design articles around turning business requirements into stable, maintainable, and extensible engineering solutions.

System design is not just about memorizing scenario questions like flash sales, URL shorteners, or news feeds. In real-world backend development, you also need solid foundational skills across API design, code quality, design patterns, framework internals, authentication and authorization, data security, scheduled tasks, and real-time message push. Follow the recommended reading order below to build your fundamentals systematically.

## Who Is This For

- Developers systematically studying backend system design.
- Candidates preparing for campus recruiting, experienced-hire roles, or backend interviews at mid-to-large tech companies.
- Engineers who want to level up from "writing business code" to "designing modules and technical solutions."
- Readers who have already worked with Spring, MyBatis, permission systems, or scheduled tasks, yet lack a structured overview.

## Learning Focus

- In a system design interview, how do you structure your answer across requirements clarification, core workflows, data models, API design, scalability, and risk points?
- How do engineering fundamentals such as RESTful APIs, naming, refactoring, and unit testing impact long-term maintenance costs?
- Design patterns are not about memorizing UML diagrams—they are about understanding how common points of change are encapsulated.
- What engineering complexities do frameworks like Spring, MyBatis, and Netty solve respectively?
- Which parts of the security chain are covered by authentication and authorization, JWT, SSO, permission systems, and data security?
- What technology choices and stability challenges arise with scheduled tasks and real-time message push in production environments?

## Recommended Reading Order

1. [System Design Fundamentals Topic](./basis/): Fill in gaps across RESTful APIs, software engineering, code naming, code refactoring, and unit testing.
2. [Design Patterns Common Interview Questions Summary](./design-pattern.md): Understand which points of variation common design patterns are suited to solve.
3. [Spring & Spring Boot Topic](./framework/spring/): Master IoC, AOP, transactions, auto-configuration, common annotations, and design patterns used in frameworks.
4. [Authentication, Authorization & Data Security Topic](./security/): Build a systematic understanding of authentication and authorization, JWT, SSO, permission systems, encryption, data masking, and data validation.
5. Then read [Java Scheduled Tasks Explained](./schedule-task.md) and [Web Real-Time Message Push Explained](./web-real-time-message-push.md) as needed for your projects.

## Core Articles

### System Design & Engineering Fundamentals

- [System Design Fundamentals Topic](./basis/): Walks through RESTful APIs, software engineering, code naming, code refactoring, and unit testing.
- [A Concise Guide to RESTful APIs](./basis/RESTfulAPI.md): Understand resource modeling, HTTP methods, status codes, and API design conventions.
- [Code Refactoring Guide](./basis/refactoring.md): Understand code smells, refactoring principles, and common refactoring techniques.
- [What Is Unit Testing and How Should You Do It?](./basis/unit-test.md): Understand unit testing, Mock, Stub, the test pyramid, and JUnit basics.
- [Design Patterns Common Interview Questions Summary](./design-pattern.md): Reviews common design patterns including Singleton, Factory, Proxy, Chain of Responsibility, Strategy, and Observer.
- [State Machines and Workflow Orchestration](./state-machine-and-workflow.md): Understand conditional transitions, parallel fan-in/convergence, task retries, idempotency, and workflow version management.

### Common Frameworks

- [Spring & Spring Boot Topic](./framework/spring/): Connects common questions across Spring, Spring MVC, and Spring Boot.
- [Spring Common Interview Questions Summary](./framework/spring/spring-knowledge-and-questions-summary.md): Covers core topics such as IoC, AOP, Bean lifecycle, and dependency injection.
- [MyBatis Common Interview Questions Summary](./framework/mybatis/mybatis-interview.md): Understand `#{}` vs. `${}`, dynamic SQL, caching, pagination plugins, and Mapper mapping.

### Authentication, Authorization & Data Security

- [Authentication, Authorization & Data Security Topic](./security/): Focuses on authentication and authorization, JWT, SSO, permission systems, encryption, data masking, and data validation.
- [Authentication & Authorization Fundamentals Explained](./security/basis-of-authority-certification.md): Understand foundational concepts such as authentication, authorization, Session, Token, and OAuth2.
- [JWT Fundamentals Explained](./security/jwt-intro.md): Understand JWT structure, signatures, workflows, and login/authentication scenarios.
- [Permission System Design Explained](./security/design-of-authority-system.md): Understand the RBAC permission model and permission system design.
- [Summary of Common Encryption Algorithms](./security/encryption-algorithms.md): Understand symmetric encryption, asymmetric encryption, hashing algorithms, and common use cases.
- [Summary of Data Masking Solutions](./security/data-desensitization.md): Understand common sensitive data masking rules and engineering implementations.

### Task Scheduling & Message Push

- [Java Scheduled Tasks Explained](./schedule-task.md): Reviews `Timer`, `ScheduledThreadPoolExecutor`, `DelayQueue`, timing wheels, Spring `@Scheduled`, and distributed task scheduling frameworks.
- [Web Real-Time Message Push Explained](./web-real-time-message-push.md): Understand short polling, long polling, SSE, WebSocket, and message push technology selection.
- [J2EE Fundamentals](./J2EE基础知识.md): Reviews Java Web fundamentals such as Servlets, request forwarding vs. redirection, Sessions, and Cookies.

## High-Frequency Questions

- How should you structure your answer to a system design question?
- In RESTful API design, how should resource paths, HTTP methods, and status codes be used?
- Why do code naming, refactoring, and unit testing affect system maintainability?
- What problems do common design patterns solve, and where are they applied in Spring?
- Which scenarios suit state machines vs. workflow orchestration? How do parallel tasks converge reliably?
- How do you explain Spring IoC, AOP, Bean lifecycle, and transaction mechanisms?
- What is the core workflow of Spring Boot auto-configuration?
- What is the difference between `#{}` and `${}` in MyBatis? How do the first-level and second-level caches work?
- What is the difference between authentication and authorization? Which scenarios suit Session, Token, JWT, and OAuth2?
- How should an RBAC permission system be designed?
- What security problems do data masking, data validation, and encryption algorithms solve respectively?
- How should you choose a scheduled task framework, and what pitfalls must you watch out for in distributed task scheduling?
- What options exist for real-time web message push? How do you weigh short polling, SSE, and WebSocket?

## Related Topics

- [High-Performance System Knowledge Base](../high-performance/)
- [High-Availability System Knowledge Base](../high-availability/)
- [Distributed Systems Knowledge Base](../distributed-system/)
- [Databases](../database/)
- [Computer Networks](../cs-basics/network/other-network-questions.md)
