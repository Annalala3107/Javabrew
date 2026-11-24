---
title: "RPC (Remote Procedure Call) Explained: Principles, Call Flow, Serialization Protocols, and Framework Selection"
category: Distributed Systems
description: "An introductory deep dive into RPC (Remote Procedure Call), covering core RPC principles, call flow, dynamic proxy, serialization protocols, network transport, service discovery, and selecting among common frameworks like Dubbo, gRPC, and Thrift."
tag:
  - RPC
head:
  - - meta
    - name: keywords
      content: RPC,RPC principles,remote procedure call,dynamic proxy,serialization,service discovery,Dubbo,gRPC,Thrift,microservice communication,RPC interview questions
lang: en
sourceRef: zh-ref/distributed-system/rpc/rpc-intro.md
---

This article gives a brief introduction to the fundamental concepts related to RPC.

From a distributed systems perspective, RPC solves **how services invoke one another**. External requests entering the system usually pass through an [API Gateway](../api-gateway.md) first; once inside the internal services, those services continue collaborating via RPC, HTTP clients, message queues, and other mechanisms. If you want to examine the service governance details of a mature RPC framework like Dubbo, you can continue reading [Dubbo Interview Questions Summary](./dubbo.md).

## What Is RPC?

![RPC Overview](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-overview-088d1554.png)

**RPC (Remote Procedure Call)** stands for Remote Procedure Call. From the name itself, we can see that RPC focuses on remote calls rather than local calls.

**Why do we need RPC?** Because methods provided by services on two different servers do not reside in the same memory space, network programming is required to pass the parameters needed for a method invocation, and network programming is also required to receive the return result. However, if we manually implement this invocation process through raw network programming, the workload is huge—we would have to handle the underlying transport protocol (TCP vs. UDP), serialization format, and many other details ourselves.

**What can RPC do for us?** Simply put, RPC allows us to invoke a method on a service running on a remote machine in a way that feels just as simple as calling a local method—and we do not need to understand the low-level details of network programming!

For example: if two different services, Service A and Service B, are deployed on two different machines, and Service A wants to call a method in Service B, it can do so via RPC.

In one sentence: **RPC exists to make calling a remote method as simple as calling a local method.**

## What Is the Principle Behind RPC?

To help you understand how RPC works, we can view the core functionality of RPC as being implemented by the following 5 components 👇:

1. **Client (Service Consumer)**: The side that invokes the remote method.
1. **Client Stub**: This is actually a proxy class. What the proxy class does is straightforward: it transmits the information about the method, class, and method parameters you invoke over to the server.
1. **Network Transport**: Network transport sends your invocation details—such as method parameters—to the server, and after the server finishes executing, transmits the return result back to you over the network. There are many ways to implement network transport, such as basic Socket or Netty (recommended), which offers superior performance and cleaner abstractions.
1. **Server Stub**: This stub is not a proxy class. I actually feel "stub" isn't the best name here, so just keep that in mind. What the Server Stub actually refers to is the component that receives the client's method-execution request, invokes the corresponding local method, and returns the result to the client.
1. **Server (Service Provider)**: The side that provides the remote method.

The detailed architecture diagram is shown below, and next I will walk through the entire RPC process step by step.

![RPC Principle Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-principle-b5556f7a.png)

1. The service consumer (client) invokes the remote service just like a local method call.
1. Upon receiving the call, the Client Stub assembles the method, parameters, and related metadata into a message body ready for network transmission (Serialization): `RpcRequest`.
1. The Client Stub locates the address of the remote service and sends the message to the service provider.
1. The Server Stub receives the message and deserializes it back into a Java object: `RpcRequest`.
1. Based on the class, method, and method parameters inside `RpcRequest`, the Server Stub invokes the corresponding local method.
1. The Server Stub obtains the execution result, assembles it into a network-transmittable message body `RpcResponse` (Serialization), and sends it back to the consumer.
1. The Client Stub receives the message and deserializes it into a Java object: `RpcResponse`, thus obtaining the final result. Done!

After reading the explanation above, I believe you now understand the principles behind RPC.

Although the section is concise, it clearly covers the core principles of an RPC framework! In addition, I will introduce the technical details mentioned above in later chapters.

**Finally, regarding the principles of RPC, I hope you not only understand them, but can also draw the diagram yourself and explain it clearly to others—because whenever an interviewer asks about RPC, this question almost always comes up.**

## What Are the Common RPC Frameworks?

By "RPC frameworks" here, we mean frameworks that allow the client to invoke server methods directly as simply as calling local methods—such as Dubbo, Motan, and gRPC introduced below. Frameworks that work directly with the HTTP protocol by parsing and wrapping HTTP requests and responses cannot really be considered "RPC frameworks"—for example, Feign.

### Dubbo

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716111053081-f7eb2e02.png)

Apache Dubbo is a microservice framework that provides high-performance RPC communication, traffic governance, observability, and other solutions for large-scale microservice practices, with multi-language SDK implementations including Java and Golang.

Dubbo provides nearly all service governance capabilities—from service definition, service discovery, and service communication to traffic control—and supports features such as the Triple protocol (a next-generation RPC communication protocol defined on top of HTTP/2), application-level service discovery, and Dubbo Mesh (Dubbo3 introduced many cloud-native-friendly features).

![Dubbo3](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716111545343-d4b8a0b2.png)

Dubbo was open-sourced by Alibaba and later joined Apache. It was precisely because of Dubbo's emergence that more and more companies began adopting and embracing distributed architectures.

Dubbo is one of the more outstanding open-source projects originating from China, and its source code is well worth studying and reading!

- GitHub: [https://github.com/apache/incubator-dubbo](https://github.com/apache/incubator-dubbo "https://github.com/apache/incubator-dubbo")
- Official Website: <https://dubbo.apache.org/zh/>

### Motan

Motan is an RPC framework open-sourced by Sina Weibo, reportedly supporting hundreds of billions of calls at Sina Weibo. However, I have rarely seen other companies use it, and online resources about it are relatively scarce.

Many people like to compare Motan with Dubbo, as both were open-sourced by major Chinese tech companies. After reviewing plenty of materials and briefly reading its source code, I found that **Motan is more like a streamlined version of Dubbo—probably drawing inspiration from Dubbo's design, Motan has a simpler design and purer functionality.**

However, I do not recommend using Motan in real projects. If your company is choosing a framework for production use, I still recommend Dubbo, whose community activity and ecosystem are much stronger.

- Designing an RPC Framework from Motan: [http://kriszhang.com/motan-rpc-impl/](http://kriszhang.com/motan-rpc-impl/ "http://kriszhang.com/motan-rpc-impl/")
- Motan Chinese Documentation: [https://github.com/weibocom/motan/wiki/zh_overview](https://github.com/weibocom/motan/wiki/zh_overview "https://github.com/weibocom/motan/wiki/zh_overview")

### gRPC

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/2843b10d-0c2f-4b7e-9c3e-ea4466792a8b-2a0bca88.png)

gRPC is a high-performance, general-purpose open-source RPC framework developed by Google. Designed primarily for mobile application development and built on the HTTP/2 protocol standard (supporting features such as bidirectional streaming and header compression for better bandwidth efficiency), it uses the ProtoBuf serialization protocol and supports a wide range of programming languages.

**What is ProtoBuf?** [ProtoBuf (Protocol Buffer)](https://github.com/protocolbuffers/protobuf) is a flexible, efficient data format that can be used for communication protocols, data storage, and more. It supports virtually all mainstream programming languages and is platform-independent. That said, defining interfaces and data types with ProtoBuf can be somewhat verbose, which is a minor drawback.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716104304033-c11fc628.png)

It must be said that gRPC's communication layer design is outstanding—the communication layer improvements in [Dubbo-go 3.0](https://dubbogo.github.io/) largely drew inspiration from gRPC.

However, gRPC's design means it has almost no built-in service governance capabilities. If you need to address that, you will have to rely on external components such as Tencent's PolarisMesh.

- GitHub: [https://github.com/grpc/grpc](https://github.com/grpc/grpc "https://github.com/grpc/grpc")
- Official Website: [https://grpc.io/](https://grpc.io/ "https://grpc.io/")

### Thrift

Apache Thrift is a cross-language RPC communication framework open-sourced by Facebook and donated to the Apache Software Foundation. Thanks to its cross-language support and strong performance, it has been adopted by many internet companies; capable engineering teams even build their own distributed service frameworks on top of Thrift by adding features like service registration and service discovery.

`Thrift` supports many different **programming languages**, including `C++`, `Java`, `Python`, `PHP`, `Ruby`, and more (supporting even more languages than gRPC).

- Official Website: [https://thrift.apache.org/](https://thrift.apache.org/ "https://thrift.apache.org/")
- Brief Introduction to Thrift: [https://www.jianshu.com/p/8f25d057a5a9](https://www.jianshu.com/p/8f25d057a5a9 "https://www.jianshu.com/p/8f25d057a5a9")

### Summary

Although gRPC and Thrift support cross-language RPC calls, they only provide the most basic RPC framework capabilities and lack a full suite of supporting service-oriented components and service governance features.

Whether judged by feature completeness, ecosystem, or community activity, Dubbo is the strongest choice. Moreover, Dubbo has many successful production deployments in China—such as Dangdang and DiDi—making it a mature, battle-tested, and stable RPC framework. Most importantly, you can easily find abundant Dubbo reference materials, so the learning curve is relatively low.

The diagram below illustrates Dubbo's ecosystem.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/eee98ff2-8e06-4628-a42b-d30ffcd2831e-bece6606.png)

Dubbo is also a component within Spring Cloud Alibaba.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/0d195dae-72bc-4956-8451-3eaf6dd11cbd-fd20ff67.png)

However, Dubbo and Motan are primarily built for the Java ecosystem. While Dubbo and Motan now offer compatibility with some other languages, they are generally not recommended for polyglot usage. If you need cross-language RPC calls across multiple languages, consider using gRPC.

In summary, if you are on a Java backend tech stack and hesitating over which RPC framework to choose, I recommend considering Dubbo.

## How to Design and Implement an RPC Framework?

**"Building an RPC Framework from Scratch"** is an internal booklet in my [Knowledge Planet](https://javaguide.cn/about-the-author/zhishixingqiu-two-years.html) community, where I wrote 12 articles explaining how to build a lightweight RPC framework from zero based on Netty + Kryo + ZooKeeper.

Though compact, it has all the essential components, with well-commented code, clean structure, and Checkstyle integrated to enforce code formatting—making it ideal for reading and learning.

**Content Overview:**

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220308100605485-54b6c8de.png)

## If We Already Have HTTP, Why Do We Still Need RPC?

For a detailed answer to this question, please read this article: [Why Do We Still Need RPC When We Already Have HTTP?](../../cs-basics/network/http-vs-rpc.md).
