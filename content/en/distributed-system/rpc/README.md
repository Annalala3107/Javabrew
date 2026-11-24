---
title: "RPC (Remote Procedure Call) Guide: Principles, Call Flow, Serialization, Service Discovery, Dubbo & gRPC"
description: "RPC interview and remote call learning roadmap covering RPC principles, call flow, dynamic proxy, serialization, network transport, service discovery, load balancing, Dubbo, gRPC, and HTTP vs. RPC comparison."
category: Distributed Systems
tag:
  - RPC
  - Dubbo
  - Distributed Systems
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: RPC,RPC principles,RPC frameworks,Dubbo,gRPC,Thrift,remote procedure call,service discovery,dynamic proxy,serialization protocols,load balancing,HTTP vs RPC,backend interview
lang: en
sourceRef: zh-ref/distributed-system/rpc/README.md
---

RPC (Remote Procedure Call) is one of the most common ways to invoke services in distributed systems. Its goal is to make invoking a remote service feel as natural as calling a local method, while encapsulating complex details such as network communication, serialization, service discovery, load balancing, timeout and retry, and fault-tolerance governance.

## Who Is This For

- Backend developers who want to understand how RPC frameworks work under the hood.
- Candidates preparing for interviews covering RPC, Dubbo, and microservice communication.
- Readers who have already used Feign, Dubbo, or gRPC, but are not yet familiar enough with the underlying call flow and service governance.
- Engineers who need to decide whether internal service calls should use HTTP or RPC.

## Key Learning Points

- RPC is a remote invocation model, not a single specific protocol.
- A single RPC call typically goes through steps such as dynamic proxy, serialization, network transport, service discovery, load balancing, and response deserialization.
- Frameworks like Dubbo, gRPC, and Thrift focus on different strengths; you should not reduce RPC merely to "better performance."
- HTTP and RPC are not mutually exclusive—gRPC is a classic example of carrying RPC calls over HTTP/2.
- In interviews, you should be able to answer across multiple layers: "why RPC is needed, how RPC works, how frameworks govern services, and how to choose a framework."

## Relationship with Other Distributed Systems Articles

RPC primarily solves **how services invoke one another**. It frequently appears alongside [API Gateways](../api-gateway.md), though the two sit in different positions: an API gateway handles external traffic ingress and unified governance, whereas RPC is more commonly used for communication between internal services.

RPC frameworks also typically rely on service registration and discovery, load balancing, timeout and retry, and cluster fault tolerance. To complete this end-to-end picture, you can read this topic together with [Distributed Configuration Centers Explained](../distributed-configuration-center.md) and the [ZooKeeper Topic](../distributed-process-coordination/zookeeper/).

## Recommended Reading Order

1. [Why Do We Still Need RPC When We Already Have HTTP?](../../cs-basics/network/http-vs-rpc.md): First clarify the relationship between HTTP and RPC.
2. [RPC (Remote Procedure Call) Explained](./rpc-intro.md): Next, systematically understand the RPC call flow, core components, and framework selection.
3. [Dubbo Interview Questions Summary](./dubbo.md): Finally, put RPC into the context of a mature framework like Dubbo to examine service governance and production practices.

## Core Articles

- [RPC (Remote Procedure Call) Explained](./rpc-intro.md): Understand the fundamentals of RPC from the perspectives of call flow, dynamic proxy, serialization protocols, network transport, and service discovery.
- [Dubbo Interview Questions Summary](./dubbo.md): Connects Dubbo's architectural principles, service export and reference, SPI extension mechanism, load balancing, cluster fault tolerance, service registry, and production practices.
- [Why Do We Still Need RPC When We Already Have HTTP?](../../cs-basics/network/http-vs-rpc.md): Explains the relationship between HTTP and RPC so you avoid reducing RPC to merely "a more advanced protocol than HTTP."

## Frequently Asked Questions

- What is the complete end-to-end flow of an RPC call?
- Why do RPC frameworks typically use dynamic proxies?
- What are the common serialization protocols in RPC, and how do you choose among them?
- How do Dubbo's service export and service reference processes work?
- How are Dubbo's SPI, load balancing, and cluster fault tolerance mechanisms implemented?
- What is the difference between HTTP and RPC? Why is RPC commonly used for internal service calls?
- Why is gRPC called RPC, and why is it built on top of HTTP/2?
- Across what dimensions should you decide between HTTP and RPC for internal service calls?

## Related Topics

- [Distributed Systems Knowledge Base](../)
- [API Gateway Explained](../api-gateway.md)
- [Spring Cloud Gateway Interview Questions Summary](../spring-cloud-gateway-questions.md)
- [Computer Networking](../../cs-basics/network/)
