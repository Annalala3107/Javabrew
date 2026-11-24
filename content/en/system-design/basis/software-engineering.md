---
title: A Concise Guide to Software Engineering
description: A detailed explanation of software engineering fundamentals, covering the software crisis, software development process models, the Waterfall model, and Agile development.
category: System Design
head:
  - - meta
    - name: keywords
      content: Software Engineering,Software Crisis,Software Development Process,Waterfall Model,Agile Development,Requirements Analysis,Software Lifecycle,Engineering Approach
lang: en
sourceRef: zh-ref/system-design/basis/software-engineering.md
---

Most software development practitioners tend to overlook some of the most basic, foundational concepts in software development. However, these concepts are critically important—they act as the cornerstone of software development. That is why I wrote this article.

## What Is Software Engineering?

In 1968, NATO (the North Atlantic Treaty Organization) coined the term **Software Crisis**. That same year, to solve the software crisis, the concept of **Software Engineering** was born, giving rise to an academic and engineering discipline of the same name.

Over time, the discipline of software engineering has gone through round after round of refinement, and its core elements—such as software development models—have grown increasingly rich and practical!

**What is the software crisis?**

Put simply, the software crisis described a major pain point in software development at the time: it was extremely difficult to develop high-quality software efficiently.

Dijkstra (creator of Dijkstra's algorithm) also spoke about the software crisis in his 1972 Turing Award acceptance lecture, saying: "The major cause of the software crisis is that the machines have become several orders of magnitude more powerful! To put it quite bluntly: as long as there were no machines, programming was no problem at all; when we had a few weak computers, programming became a mild problem, and now we have gigantic computers, programming has become an equally gigantic problem."

**With all that said, what exactly is software engineering?**

Engineering is about applying theory to practice to solve real-world problems. Software engineering refers to applying engineering principles and discipline to software development.

That is my own take on software engineering; now let's look at a more authoritative definition. The definition given in IEEE Std 610.12-1990 (*IEEE Standard Glossary of Software Engineering Terminology*) is: (1) The application of a systematic, disciplined, quantifiable approach to the development, operation, and maintenance of software; that is, the application of engineering to software. (2) The study of approaches as in (1).

In short, the ultimate goal of software engineering is: **to create better, more maintainable software while consuming fewer resources.**

## Software Development Process

[Wikipedia defines the software development process](https://zh.wikipedia.org/wiki/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91%E8%BF%87%E7%A8%8B) as follows:

> A software development process, or software process, is the software development life cycle (SDLC) whose stages carry out requirements definition and analysis, design, implementation, testing, delivery, and maintenance. A software process consists of the steps to follow when developing and building a system, serving as a roadmap for software development.

- Requirements Analysis: Analyze user requirements and establish a logical model.
- Software Design: Design the software architecture based on the results of requirements analysis.
- Coding: Write the source code that runs the program.
- Testing: Define test cases and prepare test reports.
- Delivery: Deliver the completed software to the customer.
- Maintenance: Maintain the software, such as fixing bugs and enhancing features.

The software development process defines, at a fairly broad level, the stages that software development may involve.

Software development models define the software development process more concretely and provide solid theoretical backing for carrying it out.

## Software Development Models

There are many software development models and methodologies, such as the Waterfall Model, Rapid Prototype Model, V-model, W-model, and Agile development methodologies. Among them, the most representative are still the **Waterfall Model** and **Agile Development**.

The **Waterfall Model** defines a complete software development cycle and thoroughly depicts a software product's full lifecycle.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/up-264f2750a3d30366e36c375ec3a30ec2775-e828743b.png)

**Agile Development** is not a single software development model, but rather a set of values and principles; common concrete methodologies include Scrum, Extreme Programming (XP), and Kanban. Agile emphasizes individuals and interactions, working software, customer collaboration, and responding to change, continuously gathering feedback through iterations and frequent delivery.

**Continuous Integration**, **Refactoring**, **Small Releases**, **Pair Programming**, and **Test-Driven Development (TDD)** are common technical practices in Extreme Programming, while **Stand-up Meetings** are common in Scrum—none of these are universally mandatory across every Agile methodology. Agile development does not mean "low documentation" either; rather, it values working software more while keeping necessary and valuable documentation.

## Basic Software Development Strategies

### Software Reuse

When building new software, we do not need to start from scratch. By reusing existing building blocks (frameworks, third-party libraries, etc.), design patterns, design principles, and other ready-made artifacts, we can build software that meets requirements much faster.

The open-source projects we work with every day are the best example. Without open source, the effort and time required to build software that meets our needs would be vastly greater than it is today!

### Divide and Conquer

While building software, we run into many complex challenges. We can break complex problems down into smaller sub-problems and tackle them one by one.

Let's illustrate this with a popular software design methodology today—Domain-Driven Design (DDD).

In Domain-Driven Design, a crucial concept is the **Domain**, which represents the problem space we aim to solve. What we do in DDD is decompose a relatively large domain (problem) into several smaller domains (subdomains).

Beyond design methodology, divide and conquer is also a widely used algorithmic paradigm—namely, the divide-and-conquer algorithm. If you want to learn more about divide-and-conquer algorithms, I recommend Peking University's [*Design and Analysis of Algorithms*](https://www.coursera.org/learn/algorithms).

### Incremental Evolution

Software development is a process of gradual evolution: we need to carry out iterative and incremental development continuously to eventually deliver a product that delivers real customer value.

Here is another critical concept in software development: **MVP (Minimum Viable Product)**.

A Minimum Viable Product is the version of a product that gathers the maximum amount of validated learning about customers with the least effort. Its purpose is to validate key hypotheses as quickly as possible, and it does not necessarily have to be a product that fulfills every customer requirement in full. The image below captures this idea brilliantly.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/up-a99961ff7725106c0592abca845d555568a-48620d5b.png)

By using an MVP, we can also conduct market validation early—which is tremendously helpful as we navigate product uncertainty and can effectively guide where we should head next.

### Optimization and Trade-offs

Software development is a continuous process of optimization and improvement. Any software has plenty of areas that can be improved and can never be completely perfect. We must keep refining and raising the quality of our software.

At the same time, don't fall into the perfectionism trap. Learn to make trade-offs and improve the quality of existing software in the most effective way possible within finite budgets and resources.

## References

- [IEEE Std 610.12-1990: IEEE Standard Glossary of Software Engineering Terminology](https://standards.ieee.org/ieee/610.12/855/)
- [Manifesto for Agile Software Development](https://agilemanifesto.org/)
- [Minimum Viable Product: a guide - Eric Ries](https://www.startuplessonslearned.com/2009/08/minimum-viable-product-guide.html)
- Basic Concepts of Software Engineering - Liu Qiang, School of Software, Tsinghua University: <https://www.xuetangx.com/course/THU08091000367>
- Software Development Process - Wikipedia: <https://zh.wikipedia.org/wiki/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91%E8%BF%87%E7%A8%8B>
