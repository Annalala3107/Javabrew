---
title: "Message Queue Topic: Asynchronous Processing, Peak Shaving, Reliability, Ordering, Kafka, RocketMQ, and RabbitMQ"
description: "Message queue interview and MQ learning roadmap covering asynchronous processing, application decoupling, peak shaving, message reliability, idempotency, ordering, message backlog, Kafka, RocketMQ, and RabbitMQ."
category: High Performance
tag:
  - Message Queue
  - Kafka
  - RocketMQ
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Message Queue,Message Queue Interview Questions,Kafka,RocketMQ,RabbitMQ,Disruptor,Message Reliability,Message Idempotency,Message Ordering,Message Backlog,Asynchronous Processing,Peak Shaving,Backend Interviews
lang: en
sourceRef: zh-ref/high-performance/message-queue/README.md
---

Message queues are ubiquitous middleware in high-performance and high-availability systems, primarily used for asynchronous processing, application decoupling, peak shaving (load leveling), and traffic buffering. When studying message queues, you cannot merely memorize the feature lists of Kafka, RocketMQ, and RabbitMQ—you must thoroughly understand message reliability, ordering, idempotency, backlog mitigation, and technology selection.

If you are preparing for interviews, start with [Message Queue Interview Questions Summary](./message-queue-interview-questions.md) to review MQ topics along the production, storage, consumption, acknowledgment, and compensation pipeline, then dive into the dedicated topic articles matching the middleware used in your projects.

## Who Should Read This?

- Backend developers looking to learn message queues systematically.
- Candidates preparing for interview questions on Kafka, RocketMQ, RabbitMQ, and message reliability.
- Readers already using MQ in projects who want deeper mastery of message loss, duplicate consumption, ordered consumption, and message backlog handling.
- Engineers making technology choices among Kafka, RocketMQ, RabbitMQ, and Disruptor.

## Key Learning Focus

- Message queues solve problems of asynchrony, decoupling, peak shaving, and buffering—not every call chain should introduce an MQ.
- Message reliability must be evaluated separately across the producer, broker, consumer, and business-layer idempotency.
- Message ordering typically requires coordinated design across topics, queues, partitions, consumer threads, and business keys.
- A message backlog is rarely a single-point issue; it can stem from consumption capacity, downstream dependencies, rate-limiting policies, or data skew.
- Kafka, RocketMQ, RabbitMQ, and Disruptor serve distinct roles—technology selection must weigh throughput, latency, messaging semantics, ecosystem, and operational overhead.

## Recommended Reading Order

1. [Message Queue Interview Questions Summary](./message-queue-interview-questions.md): Build a checklist of questions covering reliability, idempotency, ordering, backlogs, and selection first.
2. [Message Queue Fundamentals Summary](./message-queue.md): Understand general MQ models, use cases, and common pitfalls.
3. [Kafka Common Questions Summary](./kafka-questions-01.md): Learn high-throughput log streaming, partitions, replicas, Consumer Groups, and Rebalance.
4. [RocketMQ Common Questions Summary](./rocketmq-questions.md): Learn business messaging scenarios, transactional messages, scheduled messages, ordered messages, and message storage.
5. [RabbitMQ Common Questions Summary](./rabbitmq-questions.md): Learn AMQP, Exchanges, acknowledgment mechanisms, dead-letter queues, and delay queues.
6. [Disruptor Common Questions Summary](./disruptor-questions.md): Learn high-performance in-memory queues, lock-free design, and low-latency scenarios.

## Core Articles

- [Message Queue Interview Questions Summary](./message-queue-interview-questions.md): Connects universal high-frequency questions, mainstream middleware internals, technology selection, and project follow-up questions along the message lifecycle.
- [Message Queue Fundamentals Summary](./message-queue.md): Systematically explains use cases, messaging models, message reliability, idempotency, ordering, backlog mitigation, and selection.
- [Kafka Common Questions Summary](./kafka-questions-01.md): Covers Brokers, Topics, Partitions, Consumer Groups, zero-copy, sequential writes, ACKs, ISR, and Rebalance.
- [RocketMQ Common Questions Summary](./rocketmq-questions.md): Covers NameServer, Broker, Proxy, standard messages, ordered messages, transactional messages, scheduled messages, and storage mechanisms.
- [RabbitMQ Common Questions Summary](./rabbitmq-questions.md): Covers AMQP, Exchange types, confirmation mechanisms, dead-letter queues, delay queues, priority queues, and high-availability clusters.
- [Disruptor Common Questions Summary](./disruptor-questions.md): Covers RingBuffer, Sequencer, WaitStrategy, lock-free design, cache-line padding, and pre-allocated memory.

## High-Frequency Questions

- Why use a message queue? Which scenarios are unsuitable for introducing an MQ?
- How do you guarantee that messages are never lost?
- How do you handle duplicate consumption and business idempotency?
- How do you guarantee message ordering?
- How do you diagnose and resolve a message backlog?
- Why does Kafka achieve such high throughput? What roles do zero-copy and sequential writes play?
- How do RocketMQ transactional messages work?
- What Exchange types does RabbitMQ offer, and what scenarios fit each type?
- How should you choose among Kafka, RocketMQ, and RabbitMQ?

## Quick Selection Reference

| Scenario | Common Choices | Key Focus Areas |
| -------------------- | ------------- | ---------------------------------- |
| Logs, tracking events, stream processing | Kafka, Pulsar | Throughput, partition scaling, ecosystem |
| Orders, transactions, business events | RocketMQ | Transactional messages, delayed messages, ordered messages |
| Flexible routing, lightweight integration | RabbitMQ | Exchanges, acknowledgment mechanisms, queue types |
| In-process low-latency event handling | Disruptor | RingBuffer, WaitStrategy, lock-free design |

When choosing a solution, do not compare throughput alone. Your team's operational experience, existing tech stack, messaging semantics, latency requirements, message retention periods, and replay needs all influence the final choice.

## Related Topics

- [High-Performance Systems Knowledge Base](../)
- [High-Availability Systems Knowledge Base](../../high-availability/)
- [Distributed Systems Knowledge Base](../../distributed-system/)
- [System Design](../../system-design/)
