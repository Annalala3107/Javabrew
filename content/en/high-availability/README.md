---
title: "High Availability System Knowledge Base: SLA, Rate Limiting, Circuit Breaker, Degradation, Retry, Idempotency, Redundancy, and Load Testing"
description: "High availability system interview and architecture learning roadmap covering SLA, availability metrics, single points of failure, redundancy and disaster recovery, rate limiting, service degradation, circuit breaking, timeout and retry, API idempotency, load testing, and chaos engineering."
category: High Availability
tag:
  - High Availability
  - System Design
  - Backend Interview
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: High Availability System,High Availability System Design,High Availability Interview Questions,SLA,Availability Metrics,Rate Limiting,Circuit Breaker,Service Degradation,Timeout and Retry,API Idempotency,Redundancy Design,Disaster Recovery,Performance Testing,Chaos Engineering,Backend Interview
lang: en
sourceRef: zh-ref/high-availability/README.md
---

This **High Availability System Knowledge Base** is built for backend engineering learning, system design, and interview preparation. It organizes all high-availability articles on this site around four core goals: reducing failures, isolating failures, recovering quickly, and minimizing the impact of duplicate requests and abnormal traffic.

If you are short on time, start with the [High Availability System Design Interview Questions Summary](./high-availability-system-interview-questions.md) to quickly establish a checklist of high-frequency questions. If you want to build a solid foundation systematically, follow the reading order below.

## Who Is This For

- Backend developers systematically studying high-availability system design.
- Candidates preparing for campus recruiting, experienced hire, or mid-to-large tech company backend interviews.
- Engineers looking to strengthen their skills in rate limiting, service degradation, circuit breaking, retries, idempotency, disaster recovery, and load testing.
- Readers who have already encountered API timeouts, duplicate requests, downstream failures, traffic spikes, or cascading system avalanches, and want systematic engineering solutions.

## Learning Focus

- High availability does not mean "zero failures"; it means keeping failures controllable, isolated, and recoverable when they occur.
- SLA (Service Level Agreement), availability metrics, RTO, and RPO are the core vocabulary for measuring high-availability design.
- Rate limiting, service degradation, circuit breaking, and timeout/retry each solve stability problems at different layers.
- Idempotency design is the foundational capability for handling duplicate requests, automatic retries, duplicate message consumption, and payment callbacks.
- Redundancy and disaster recovery, performance load testing, failure drills (chaos engineering), and canary releases determine whether a system can withstand real production risks.

## Recommended Reading Order

1. [High Availability System Design Interview Questions Summary](./high-availability-system-interview-questions.md): First build a checklist of high-frequency interview questions across SLA, rate limiting, circuit breaking, retry, idempotency, disaster recovery, and load testing.
2. [High Availability System Design Guide](./high-availability-system-design.md): Systematically understand the overall architectural design methodology for high-availability systems.
3. [Service Rate Limiting Explained](./limit-request.md), [Service Degradation and Circuit Breaker Explained](./fallback-and-circuit-breaker.md), and [Timeout and Retry Mechanisms Explained](./timeout-and-retry.md): Master the core trio of stability governance.
4. [API Idempotency Design Explained](./idempotency.md): Understand duplicate requests, business idempotency, payment callbacks, and related scenarios.
5. [Redundancy Design Explained](./redundancy.md) and [Introduction to Performance Testing](./performance-test.md): Round out your knowledge of disaster recovery, load testing, capacity estimation, and failure verification.

## Core Articles

### Overview & Interview Roadmap

- [High Availability System Design Interview Questions Summary](./high-availability-system-interview-questions.md): Connects SLA, single points of failure, rate limiting, degradation, circuit breaking, timeout/retry, API idempotency, redundancy/disaster recovery, and performance load testing.
- [High Availability System Design Guide](./high-availability-system-design.md): Covers SLA, "how many nines," eliminating single points of failure, cache high availability, asynchronous peak shaving, canary releases, and failure recovery.

### Stability Governance

- [Service Rate Limiting Explained](./limit-request.md): Understand fixed window, sliding window, token bucket, leaky bucket, Sentinel, Redis Lua, and Redisson rate limiting.
- [Service Degradation and Circuit Breaker Explained](./fallback-and-circuit-breaker.md): Understand Fallback strategies, degradation switches, circuit breaker state machines, cascading avalanche effects, isolation strategies, and framework selection.
- [Timeout and Retry Mechanisms Explained](./timeout-and-retry.md): Understand connection timeouts, read timeouts, exponential backoff, random jitter, retry storms, and idempotency.

### Idempotency, Disaster Recovery & Verification

- [API Idempotency Design Explained](./idempotency.md): Covers idempotency keys, tokens, unique indexes, deduplication tables, optimistic locking, pessimistic locking, distributed locks, and payment callbacks.
- [Redundancy Design Explained](./redundancy.md): Covers hardware redundancy, service redundancy, data redundancy, geographic redundancy, intra-city disaster recovery, cross-region disaster recovery, and multi-active architectures.
- [Introduction to Performance Testing](./performance-test.md): Understand QPS, TPS, RT, P90/P99/P999, capacity estimation, stress testing, stability (soak) testing, and load testing tools.

## High-Frequency Questions

- How do high-availability systems define availability? What do different numbers of nines mean?
- What is the difference between RTO and RPO?
- What problems do rate limiting, service degradation, and circuit breaking each solve?
- What is the difference between the token bucket and leaky bucket algorithms? How is distributed rate limiting implemented?
- Why can timeouts and retries cause a cascading avalanche?
- What are the implementation approaches for API idempotency? How do payment callbacks guarantee idempotency?
- Which scenarios suit redundancy, disaster recovery, intra-city multi-active, and cross-region multi-active architectures?
- What are the differences between performance testing, stress testing, and stability testing?
- How can you verify whether a high-availability design works effectively through failure drills?

## Related Topics

- [High Performance System Knowledge Base](../high-performance/)
- [Distributed System Knowledge Base](../distributed-system/)
- [System Design](../system-design/)
- [Message Queue Topic](../high-performance/message-queue/)
