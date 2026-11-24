---
title: "Dubbo Interview Questions Summary: Architectural Principles, SPI, Load Balancing, Service Governance, and Cluster Fault Tolerance"
category: Distributed Systems
description: "Summary of high-frequency Dubbo interview questions covering Dubbo architectural principles, service export and reference, SPI extension mechanism, load balancing, cluster fault tolerance, service governance, service registry, and common production issues."
tag:
  - RPC
  - Dubbo
head:
  - - meta
    - name: keywords
      content: Dubbo,Dubbo interview questions,Dubbo architecture,Dubbo SPI,load balancing,cluster fault tolerance,service governance,service registry,RPC framework,distributed service framework
lang: en
sourceRef: zh-ref/distributed-system/rpc/dubbo.md
---

::: tip

- Dubbo3 has already been released, whereas this article was written based on Dubbo2. Dubbo3 evolved from Dubbo2: while preserving the original core features and capabilities, Dubbo3 provides comprehensive upgrades in usability, ultra-large-scale microservice practices, cloud-native infrastructure adaptation, security design, and related areas.
- Many links in this article have become invalid, mainly because the official Dubbo documentation underwent URL restructuring.

:::

This article assumes you already understand the basic RPC call flow. If you are not yet familiar with concepts such as dynamic proxies, serialization, network transport, and service discovery, it is recommended to read [RPC (Remote Procedure Call) Explained](./rpc-intro.md) first. Dubbo involves service registries, load balancing, and cluster fault tolerance, so this part can also be studied alongside the [ZooKeeper Topic](../distributed-process-coordination/zookeeper/).

This article is a summary of Dubbo based on the official documentation and my own day-to-day usage experience. Contributions and additions are welcome!

## Dubbo Basics

### What Is Dubbo?

![Dubbo Official Website](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/rpc/dubbo.org-overview-f4056db0.png)

[Apache Dubbo](https://github.com/apache/dubbo) |ˈdʌbəʊ| is a high-performance, lightweight open-source Web and RPC framework.

According to the [Dubbo Official Documentation](https://dubbo.apache.org/zh/), Dubbo provides six core capabilities:

1. Interface-proxy-oriented high-performance RPC invocation.
2. Intelligent fault tolerance and load balancing.
3. Automatic service registration and discovery.
4. High extensibility.
5. Runtime traffic scheduling.
6. Visualized service governance and operations.

![Six Core Capabilities Provided by Dubbo](/media/jg/ext/oss.javaguide.cn/asset/dubbo/dubbo-c5bde0f9.png)

Put simply: **Dubbo not only helps us invoke remote services, but also provides out-of-the-box features such as intelligent load balancing.**

Dubbo currently has close to 34.4k Stars on GitHub.

In the **2020 OSC China Open Source Project** selection, Dubbo ranked 7th among development framework and foundational component projects. Compared with a few years earlier, its popularity and ranking had declined somewhat.

![](/media/jg/ext/oss.javaguide.cn/asset/dubbo/image-20210107153159545-6de63285.png)

Dubbo was open-sourced by Alibaba and later joined Apache. It was precisely because of Dubbo's emergence that more and more companies began adopting and embracing distributed architectures.

### Why Use Dubbo?

As the internet developed, websites grew larger in scale and user traffic increased continuously. Single-application architectures and vertical application architectures could no longer meet requirements, giving rise to distributed service architectures.

Under a distributed service architecture, a system is split into different services—such as an SMS service and a security service—where each service independently provides a core capability of the system.

We can use remote-invocation frameworks like Java RMI (Java Remote Method Invocation) or Hessian to simply export and reference remote services. However, as the number of services grows, service call relationships become increasingly complex. As application traffic pressure rises, demands for load balancing and service monitoring become urgent. While we could use hardware like F5 for load balancing, doing so increases cost and introduces single-point-of-failure risks.

Dubbo's emergence solved these problems. **What problems does Dubbo help us solve?**

1. **Load Balancing**: Deciding which machine's service instance to call when the same service is deployed across multiple machines.
2. **Service Call Chain Generation**: As a system evolves, services proliferate and inter-service dependencies become intricately tangled—to the point where it is unclear which application must start before another, and even architects cannot fully describe the system's architectural relationships. Dubbo helps track and resolve how services invoke one another.
3. **Service Access Load & Latency Statistics, Resource Scheduling, and Governance**: Managing cluster capacity in real time based on access load to improve cluster utilization.
4. ...

![Dubbo Capabilities Overview](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/rpc/dubbo-features-overview-6436964c.jpg)

In addition, besides distributed systems, Dubbo can also be used in today's popular microservice architectures. However, since Spring Cloud is more widely adopted for microservices, generally speaking when we mention Dubbo, we are mostly referring to distributed system scenarios.

**Now that we just mentioned the concept of "distributed," let's briefly explain what a distributed system is and why we distribute systems.**

## Distributed Systems Basics

### What Is a Distributed System?

In distributed systems—or SOA-based distributed architectures—the key idea is service orientation. Put simply, being distributed means splitting an entire system into different services and deploying them across different servers to relieve pressure on a monolithic service and improve concurrency and performance. For example, an e-commerce system can be split into an order system, a product system, a login system, and so on. Each split service can be deployed on a separate machine, and if a particular service experiences heavy traffic, it can also be deployed across multiple machines simultaneously.

![Distributed Transaction Diagram](/media/jg/ext/oss.javaguide.cn/java-guide-blog/.png-8032541f.png)

### Why Go Distributed?

From a development perspective, all code in a monolithic application sits together, whereas in a distributed system the code is split according to business domains. As a result, each team can own the development of one service, improving development efficiency. Moreover, splitting code by business boundaries makes it easier to maintain and scale.

In addition, I believe splitting a system into distributed services not only facilitates scaling and maintenance, but also improves overall system performance. Just think about it: splitting the entire system into separate services/subsystems and deploying each service/subsystem independently on its own server greatly boosts overall system performance, doesn't it?

## Dubbo Architecture

### What Are the Core Roles in Dubbo's Architecture?

The [Framework Design chapter in the official documentation](https://dubbo.apache.org/zh/docs/v2.7/dev/design/) already covers this in great detail; here I will highlight the key points.

![Core Roles in Dubbo Architecture](/media/jg/ext/oss.javaguide.cn/asset/dubbo/dubbo-relation-f627b8d6.jpg)

A brief introduction to the nodes above and their relationships:

- **Container**: The service runtime container responsible for loading and running service providers. Required.
- **Provider**: The service provider that exposes services and registers the services it provides with the registry. Required.
- **Consumer**: The service consumer that invokes remote services and subscribes to the services it needs from the registry. Required.
- **Registry**: The registry for service registration and discovery, which returns the list of service provider addresses to consumers. Optional.
- **Monitor**: The monitoring center that collects statistics on service call counts and call durations. Both service consumers and providers periodically send statistical data to the monitoring center. Optional.

### Do You Know the `Invoker` Concept in Dubbo?

`Invoker` is a very important concept in Dubbo's domain model. If you have ever read Dubbo's source code, you will see this thing countless times—for instance, `Invoker` appears heavily in the load-balancing source code we will discuss below.

Simply put, `Invoker` is Dubbo's abstraction of a remote invocation.

![dubbo_rpc_invoke.jpg](/media/jg/ext/oss.javaguide.cn/java-guide-blog/dubbo_rpc_invoke-32e1e208.jpg)

According to Dubbo's official terminology, `Invoker` is divided into:

- Service Provider `Invoker`
- Service Consumer `Invoker`

Suppose we need to invoke a remote method—we rely on a dynamic proxy to hide the details of the remote call! Those hidden details rely on the corresponding `Invoker` implementation, and `Invoker` performs the actual remote service invocation.

### Do You Know How Dubbo Works?

The diagram below shows Dubbo's overall design, divided into ten layers from bottom to top, with each layer having unidirectional dependencies.

> Interfaces with a light blue background on the left are used by the service consumer; interfaces with a light green background on the right are used by the service provider; interfaces along the center axis are shared by both sides.

![dubbo-framework](/media/jg/ext/oss.javaguide.cn/source-code/dubbo/dubbo-framework-2d522035.jpg)

- **config (Configuration Layer)**: Dubbo-related configuration. Supports programmatic configuration as well as Spring-based configuration, centered around `ServiceConfig` and `ReferenceConfig`.
- **proxy (Service Proxy Layer)**: A key layer that makes calling a remote method as simple as calling a local method; the actual invocation relies on proxy classes, centered around `ServiceProxy`.
- **registry (Registry Layer)**: Encapsulates registration and discovery of service addresses.
- **cluster (Routing / Cluster Layer)**: Encapsulates routing and load balancing across multiple providers and bridges to the registry, centered around `Invoker`.
- **monitor (Monitoring Layer)**: Monitors RPC invocation counts and durations, centered around `Statistics`.
- **protocol (Remote Invocation Layer)**: Encapsulates RPC invocations, centered around `Invocation` and `Result`.
- **exchange (Information Exchange Layer)**: Encapsulates request-response semantics and converts synchronous to asynchronous execution, centered around `Request` and `Response`.
- **transport (Network Transport Layer)**: Abstracts Mina and Netty behind a unified interface, centered around `Message`.
- **serialize (Data Serialization Layer)**: Serializes data that needs to be transmitted over the network.

### Do You Know Dubbo's SPI Mechanism? How Do You Extend Dubbo's Default Implementations?

The SPI (Service Provider Interface) mechanism is widely used in open-source projects to help us dynamically discover implementations of a service or feature (such as a load-balancing strategy).

The specific principle of SPI is as follows: we place the implementation classes of an interface in a configuration file, and during program runtime we read the configuration file and load the implementation classes via reflection. This enables us to dynamically swap out interface implementations at runtime, similar to the decoupling philosophy of IoC.

Java itself provides an SPI implementation. However, Dubbo did not use it directly; instead, it enhanced Java's native SPI mechanism to better satisfy its own requirements.

**So how do we extend Dubbo's default implementations?**

For example, if we want to implement our own load-balancing strategy, we create an implementation class `XxxLoadBalance` that implements the `LoadBalance` interface or extends `AbstractLoadBalance`.

```java
package com.xxx;

import org.apache.dubbo.rpc.cluster.LoadBalance;
import org.apache.dubbo.rpc.Invoker;
import org.apache.dubbo.rpc.Invocation;
import org.apache.dubbo.rpc.RpcException;

public class XxxLoadBalance implements LoadBalance {
    public <T> Invoker<T> select(List<Invoker<T>> invokers, Invocation invocation) throws RpcException {
        // ...
    }
}
```

We simply write the fully qualified path of this implementation class into the file `META-INF/dubbo/org.apache.dubbo.rpc.cluster.LoadBalance` under the `resources` directory.

```java
src
 |-main
    |-java
        |-com
            |-xxx
                |-XxxLoadBalance.java (implements LoadBalance interface)
    |-resources
        |-META-INF
            |-dubbo
                |-org.apache.dubbo.rpc.cluster.LoadBalance (plain text file containing: xxx=com.xxx.XxxLoadBalance)
```

`org.apache.dubbo.rpc.cluster.LoadBalance`

```plain
xxx=com.xxx.XxxLoadBalance
```

Many other extension points are available, which you can find in the [official documentation](https://cn.dubbo.apache.org/zh-cn/overview/home/).

### Do You Know Dubbo's Microkernel Architecture?

Dubbo adopts the Microkernel + Plugin pattern—simply put, a microkernel architecture. The microkernel is solely responsible for assembling plugins.

**What is the microkernel architecture?** The book *Software Architecture Patterns* introduces it as follows:

> The microkernel architecture pattern (sometimes referred to as the plug-in architecture pattern) is a natural pattern for implementing product-based applications. A product-based application is one that is packaged and made available for download in versions as a typical third-party installable product. However, many companies also develop and release their internal business applications like commercial software, complete with versions, release notes, and pluggable features (which is also a characteristic of this pattern). The microkernel architecture pattern allows you to add additional application features as plug-ins to the core application, providing extensibility as well as feature separation and isolation.

A microkernel architecture consists of two types of components: a **core system** and **plug-in modules**.

![](/media/jg/ext/oss.javaguide.cn/source-code/dubbo/.png-f25cef81.png)

The core system provides the minimal core capabilities required by the system, while plug-in modules extend the system's functionality. Therefore, systems built on a microkernel architecture are very easy to extend.

Many IDEs we commonly use can be viewed as designed on a microkernel architecture. The vast majority of IDEs, such as IntelliJ IDEA and VSCode, provide plugins to enrich their functionality.

Precisely because Dubbo is based on a microkernel architecture, we can freely replace Dubbo's functional components. For example, if you feel Dubbo's built-in serialization module doesn't meet your needs—no problem! You can simply implement your own serialization module!

Typically, a microkernel manages plugin lifecycles using Factory, IoC, OSGi, or similar approaches. Dubbo did not want to depend on an IoC container like Spring, nor did it want to build its own small IoC container (which would be over-engineering), so it adopted the simplest Factory approach to manage plugins: **the JDK standard SPI extension mechanism** (`java.util.ServiceLoader`).

### Self-Check Questions on Dubbo Architecture

#### What Is the Role of the Registry?

The registry is responsible for registering and looking up service addresses, acting like a directory service. Service providers and consumers only interact with the registry at startup.

#### What Does the Registry Do When a Service Provider Crashes?

The registry immediately pushes an event notification to consumers.

#### What Is the Role of the Monitor?

The monitor is responsible for collecting statistics such as invocation counts and invocation durations for each service.

#### If Both the Registry and the Monitor Crash, Will All Services Go Down?

No. Even if both go down, already-running providers and consumers are unaffected because consumers cache the provider list locally. Both the registry and the monitor are optional, and service consumers can connect directly to service providers.

## Dubbo Load Balancing Strategies

### What Is Load Balancing?

Let's start with a somewhat official definition. The following excerpt is taken from Wikipedia's definition of load balancing:

> Load balancing improves the distribution of workloads across multiple computing resources, such as computers, a computer cluster, network links, central processing units, or disk drives. Load balancing aims to optimize resource use, maximize throughput, minimize response time, and avoid overload of any single resource. Using multiple components with load balancing instead of a single component may increase reliability and availability through redundancy. Load balancing usually involves dedicated software or hardware.

**The explanation above might be a bit abstract, so let's put it in plain language.**

When a service in our system receives very heavy traffic, we deploy it across multiple servers. When a client sends a request, multiple servers are capable of handling that request. Choosing the right server to process the request then becomes critical. If you let just one server handle every request for that service, deploying the service across multiple servers loses its purpose. Load balancing prevents a single server from handling all requests and becoming prone to crashes or downtime—you can tell its purpose right from the name "load balancing."

### What Load Balancing Strategies Does Dubbo Provide?

For cluster load balancing, Dubbo provides several balancing strategies, defaulting to `random` (random invocation). We can also implement custom load-balancing strategies (refer to Dubbo's SPI mechanism).

In Dubbo, all load-balancing implementation classes extend `AbstractLoadBalance`, which implements the `LoadBalance` interface and encapsulates some common logic.

```java
public abstract class AbstractLoadBalance implements LoadBalance {

    static int calculateWarmupWeight(int uptime, int warmup, int weight) {
    }

    @Override
    public <T> Invoker<T> select(List<Invoker<T>> invokers, URL url, Invocation invocation) {
    }

    protected abstract <T> Invoker<T> doSelect(List<Invoker<T>> invokers, URL url, Invocation invocation);


    int getWeight(Invoker<?> invoker, Invocation invocation) {

    }
}
```

The subclasses implementing `AbstractLoadBalance` are shown below:

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210326105257812-3419eb17.png)

The official documentation explains load balancing in great detail—I recommend checking it out at: [https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#m-zhdocsv27devsourceloadbalance](https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#m-zhdocsv27devsourceloadbalance).

#### RandomLoadBalance

Selects randomly based on weight (an implementation of the weighted random algorithm). This is Dubbo's default load-balancing strategy.

The implementation principle of `RandomLoadBalance` is very straightforward. Suppose two servers S1 and S2 provide the same service, where S1 has weight 7 and S2 has weight 3.

Distributing these weights along a number-line interval gives: `S1 -> [0, 7)` and `S2 -> [7, 10)`. We generate a random number in `[0, 10)`, and whichever interval it falls into determines the server chosen to handle the request.

![RandomLoadBalance](/media/jg/ext/oss.javaguide.cn/java-guide-blog/RandomLoadBalance-2a137e63.png)

The source code of `RandomLoadBalance` is very simple—take a few minutes to walk through it.

> The source code below is from version 2.7.9 on the Dubbo `master` branch.

```java
public class RandomLoadBalance extends AbstractLoadBalance {

    public static final String NAME = "random";

    @Override
    protected <T> Invoker<T> doSelect(List<Invoker<T>> invokers, URL url, Invocation invocation) {

        int length = invokers.size();
        boolean sameWeight = true;
        int[] weights = new int[length];
        int totalWeight = 0;
        // The main purpose of this for loop is to calculate totalWeight across all providers of this service,
        // and also check whether every service provider has the same weight
        for (int i = 0; i < length; i++) {
            int weight = getWeight(invokers.get(i), invocation);
            totalWeight += weight;
            weights[i] = totalWeight;
            if (sameWeight && totalWeight != weight * (i + 1)) {
                sameWeight = false;
            }
        }
        if (totalWeight > 0 && !sameWeight) {
            // Randomly generate a number within the range [0, totalWeight)
            int offset = ThreadLocalRandom.current().nextInt(totalWeight);
            // Determine which service provider's interval the number falls into
            for (int i = 0; i < length; i++) {
                if (offset < weights[i]) {
                    return invokers.get(i);
                }
            }

        return invokers.get(ThreadLocalRandom.current().nextInt(length));
    }

}

```

#### LeastActiveLoadBalance

`LeastActiveLoadBalance` literally translates to **least-active load balancing**.

This name isn't very intuitive—if you don't carefully read the official definition of "active count," you would have no idea what it actually means.

Let me put it this way: initially, the active count of every service provider is 0 (each specific method on each service provider has its own active count, as I'll show in the source code below). Every time a provider receives a request, its active count increases by 1; once the request finishes processing, its active count decreases by 1.

Therefore, **Dubbo considers a provider with a lower active count to be processing faster and performing better, so it prioritizes dispatching requests to service providers with fewer active calls.**

**What if multiple service providers have the same least active count?**

Simple—it falls back to `RandomLoadBalance`.

```java
public class LeastActiveLoadBalance extends AbstractLoadBalance {

    public static final String NAME = "leastactive";

    @Override
    protected <T> Invoker<T> doSelect(List<Invoker<T>> invokers, URL url, Invocation invocation) {
        int length = invokers.size();
        int leastActive = -1;
        int leastCount = 0;
        int[] leastIndexes = new int[length];
        int[] weights = new int[length];
        int totalWeight = 0;
        int firstWeight = 0;
        boolean sameWeight = true;
        // This for loop traverses the invokers list to find the Invoker(s) with the smallest active count.
        // If multiple Invokers share the same least active count, it also records their indices in invokers, accumulates their weights, and checks whether their weights are equal.
        for (int i = 0; i < length; i++) {
            Invoker<T> invoker = invokers.get(i);
            // Get the active count corresponding to the invoker
            int active = RpcStatus.getStatus(invoker.getUrl(), invocation.getMethodName()).getActive();
            int afterWarmup = getWeight(invoker, invocation);
            weights[i] = afterWarmup;
            if (leastActive == -1 || active < leastActive) {
                leastActive = active;
                leastCount = 1;
                leastIndexes[0] = i;
                totalWeight = afterWarmup;
                firstWeight = afterWarmup;
                sameWeight = true;
            } else if (active == leastActive) {
                leastIndexes[leastCount++] = i;
                totalWeight += afterWarmup;
                if (sameWeight && afterWarmup != firstWeight) {
                    sameWeight = false;
                }
            }
        }
       // If only one Invoker has the least active count, return that Invoker directly
        if (leastCount == 1) {
            return invokers.get(leastIndexes[0]);
        }
        // If multiple Invokers share the same least active count but have different weights,
        // the handling here is identical to RandomLoadBalance
        if (!sameWeight && totalWeight > 0) {
            int offsetWeight = ThreadLocalRandom.current().nextInt(totalWeight);
            for (int i = 0; i < leastCount; i++) {
                int leastIndex = leastIndexes[i];
                offsetWeight -= weights[leastIndex];
                if (offsetWeight < 0) {
                    return invokers.get(leastIndex);
                }
            }
        }
        return invokers.get(leastIndexes[ThreadLocalRandom.current().nextInt(leastCount)]);
    }
}

```

The active count is stored in a `ConcurrentMap` inside `RpcStatus`. Based on the URL and the invoked method name on the service provider, we can retrieve its corresponding active count—meaning the active count for each method on a service provider is tracked independently.

```java
public class RpcStatus {

    private static final ConcurrentMap<String, ConcurrentMap<String, RpcStatus>> METHOD_STATISTICS =
            new ConcurrentHashMap<String, ConcurrentMap<String, RpcStatus>>();

   public static RpcStatus getStatus(URL url, String methodName) {
        String uri = url.toIdentityString();
        ConcurrentMap<String, RpcStatus> map = METHOD_STATISTICS.computeIfAbsent(uri, k -> new ConcurrentHashMap<>());
        return map.computeIfAbsent(methodName, k -> new RpcStatus());
    }
    public int getActive() {
        return active.get();
    }

}
```

#### ConsistentHashLoadBalance

You are probably already familiar with `ConsistentHashLoadBalance`, which is widely used in database/table sharding and various clustered systems.

`ConsistentHashLoadBalance` is the **consistent hashing load-balancing strategy**. There is no concept of weight in `ConsistentHashLoadBalance`; which service provider handles a request is determined by the request parameters—meaning requests with identical parameters are always routed to the same service provider.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/consistent-hash-data-incline-c077116d.jpg)

In addition, to avoid data skew (where nodes are not sufficiently distributed and a large volume of requests hits the same node), Dubbo introduces the concept of virtual nodes. Virtual nodes distribute nodes more evenly across the hash ring and effectively balance request traffic across nodes.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/consistent-hash-invoker-96b945c2.jpg)

The official documentation provides a detailed source-code analysis: [https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#23-consistenthashloadbalance](https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/#23-consistenthashloadbalance). There is also a related [PR#5440](https://github.com/apache/dubbo/pull/5440) that fixed several bugs in older versions of `ConsistentHashLoadBalance`. If you are interested, take some time to study it—I won't go into detail here and will leave that as an exercise for you!

#### RoundRobinLoadBalance

Weighted round-robin load balancing.

Round-robin distributes requests sequentially to each service provider. Weighted round-robin builds on this by directing more requests to service providers with higher weights. For instance, suppose two servers S1 and S2 provide the same service, with S1 having weight 7 and S2 having weight 3.

Out of 10 requests, 7 will be handled by S1 and 3 by S2.

By contrast, with `RandomLoadBalance`, it is entirely possible for 9 out of 10 requests to be routed to S1 (a probabilistic issue).

The implementation of `RoundRobinLoadBalance` in Dubbo has been rewritten and refactored several times; starting from Dubbo 2.6.5, `RoundRobinLoadBalance` uses a smooth weighted round-robin algorithm.

## Dubbo Serialization Protocols

### Which Serialization Methods Does Dubbo Support?

![Serialization Protocols Supported by Dubbo](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/watermark-type_ZmFuZ3poZW5naGVpdGk-shadow_10-tex-fad891d9.png)

Dubbo supports multiple serialization formats: JDK built-in serialization, hessian2, JSON, Kryo, FST, Protostuff, ProtoBuf, and more.

Dubbo's default serialization format is **hessian2**.

### Share Your Understanding of These Serialization Protocols

We generally avoid using JDK's built-in serialization directly for two main reasons:

1. **No cross-language support**: If you invoke a service implemented in another programming language, JDK serialization will not work.
2. **Poor performance**: Compared with other serialization frameworks, its performance is much lower—primarily because the serialized byte array is significantly larger, increasing network transmission overhead.

JSON serialization is also generally not considered due to performance concerns.

Formats such as Protostuff, ProtoBuf, and hessian2 are cross-language serialization methods and are suitable when cross-language interoperability is required.

Kryo and FST were introduced to Dubbo later and offer outstanding performance; however, both are designed specifically for Java. An article on Dubbo's official website specifically recommends using Kryo as the serialization method in production environments.

The official Dubbo documentation also includes a [performance comparison chart of these serialization protocols](https://dubbo.apache.org/zh/docs/v2.7/user/serialization/#m-zhdocsv27userserialization) for reference.

![Serialization Protocol Performance Comparison](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/dubbo-serialization-protocol-performance-compari-bb34673b.png)
