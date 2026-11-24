---
title: "API Gateway Explained: Core Features, Working Principles, and Choosing Between Spring Cloud Gateway / Kong / APISIX"
category: Distributed Systems
description: "Comprehensive guide to API Gateway core concepts, covering request routing, authentication and authorization, rate limiting and circuit breaking, load balancing, canary releases, dual-layer gateway architecture, and a selection comparison of Spring Cloud Gateway, Kong, APISIX, ShenYu, and more."
tag:
  - API Gateway
head:
  - - meta
    - name: keywords
      content: API Gateway,Microservices Gateway,Spring Cloud Gateway,Kong,APISIX,ShenYu,Zuul,Rate Limiting and Circuit Breaking,Load Balancing,Gateway Selection,Gateway Interview Questions
lang: en
sourceRef: zh-ref/distributed-system/api-gateway.md
---

## What Is a Gateway?

An API Gateway is a **unified entry point** positioned between clients and backend services. All client requests arrive at the gateway first, and the gateway then routes them to the specific target services.

Within this series of distributed systems articles, the gateway sits at the "traffic entry" layer. [RPC](./rpc/) focuses on how services call one another internally, whereas the gateway addresses how external requests entering the system are routed, authenticated, rate-limited, canary-routed, and protocol-adapted. If you only want to look into the details of Spring Cloud Gateway's routes, Predicates, Filters, and rate limiting, you can continue reading [Spring Cloud Gateway Interview Questions Summary](./spring-cloud-gateway-questions.md).

### Core Value

In a microservices architecture, a system is split into multiple services. Capabilities such as **security authentication, traffic control, logging, and monitoring** are needed by every service. Without a gateway, we would have to implement these capabilities individually in every service, leading to:

- **Code duplication**: Identical logic implemented redundantly across multiple services
- **Fragmented management**: Lack of a unified view for configuration and monitoring
- **High maintenance cost**: Changing a shared capability requires modifying all services

![API Gateway Overview Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gateway-overview-ee8b371d.png)

### Core Responsibilities

Although a gateway offers many features, its core responsibilities can be summarized into two things:

| Responsibility      | Description                                                                   | Typical Features                                                  |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Request Routing** | Route client requests to the correct target service                           | Dynamic routing, load balancing, protocol conversion              |
| **Request Filtering** | Intercept and process requests before/after they reach backend services     | Identity authentication, authorization checks, rate limiting & circuit breaking, logging |

The table above represents the two core responsibilities at an abstract level; when broken down into concrete capabilities, they branch into the dozen-plus gateway features listed in the next section.

A gateway can provide request forwarding, security authentication (identity/permission verification), traffic control, load balancing, degradation and circuit breaking, logging, monitoring, parameter validation, protocol conversion, and more.

**The gateway's position in a microservices architecture**: All client requests hit the gateway first; the gateway handles unified authentication and authorization, traffic control, and route dispatching, while backend services focus on business logic processing.

### High-Availability Deployment

Introducing a gateway adds an extra network hop (whose performance overhead is usually negligible in an intranet environment), while also introducing a new single point of failure risk. Therefore, the gateway service itself must guarantee high availability:

As shown in the figure below, an outer layer of Nginx (or other load-balancing hardware/software) forwards traffic to the gateway instances to achieve high availability. When deploying Nginx, you should also ensure its own high availability to avoid creating a single point of failure.

![Nginx-Based Server-Side Load Balancing](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/server-load-balancing-00788c20.png)

## What Features Can a Gateway Provide?

Most gateways can provide the following features (some features require assistance from other frameworks or middleware):

- **Request Forwarding**: Forward requests to target microservices.
- **Load Balancing**: Dynamically balance requests across microservice instances based on their load or configured load-balancing strategies.
- **Security Authentication**: Authenticate user requests, permit only trusted clients to access APIs, and support authorization models such as RBAC.
- **Parameter Validation**: Support parameter mapping and validation logic.
- **Logging**: Record behavioral logs for all requests for subsequent analysis and auditing.
- **Monitoring and Alerting**: Monitor business metrics, host metrics, JVM metrics, etc., and provide corresponding alerting mechanisms.
- **Traffic Control**: Control incoming request traffic—in other words, limit the number of requests within a given time window.
- **Circuit Breaking and Degradation**: Monitor request statistics in real time and automatically trip the circuit breaker to return a default response once configured failure thresholds are reached.
- **Response Caching**: When user requests fetch static or infrequently updated data, multiple requests over a period of time often receive the exact same response. In such cases, the response can be cached at the gateway layer so requests are served directly from the gateway without hitting backend business services, reducing their load.
- **Response Aggregation**: In some cases, the response content a user needs comes from multiple business services. General-purpose gateways can handle simple aggregation, whereas complex aggregation is better placed in a BFF (Backend For Frontend) or GraphQL layer to avoid burying business orchestration logic inside the infrastructure layer.
- **Canary Release**: Dynamically split traffic across different service versions (the most fundamental form of canary release).
- **Exception Handling**: Transform error responses returned by backend business services at the gateway layer before sending them back to users. This hides internal business-side exception details and returns user-friendly error messages.
- **API Documentation**: If you plan to expose APIs to developers outside your organization, you must consider providing API documentation such as Swagger or OpenAPI.
- **Protocol Conversion**: Integrate backend microservices built on different styles and technologies (such as REST, AMQP, Dubbo) via protocol conversion to provide a unified interface for specific clients like Web/Mobile or open platforms.
- **Certificate Management**: Deploy SSL certificates on the API gateway and manage them from a single entry point, reducing the complexity of certificate rotation.

It is worth noting that a gateway is not the right place for all logic. Strict business rule validation, complex field mapping, long-running transactions, long-lived connection business logic, and fine-grained business authorization should generally remain in business services, BFF, or GraphQL layers. A gateway is best suited for protocol-level, general-purpose, cross-service capabilities—avoid turning it into an unmaintainable "monolithic gateway."

The diagram below is taken from the article [Design and Implementation of Shepherd, a Ten-Billion-Scale API Gateway Service - Meituan Tech Team - 2021 (in Chinese)](https://mp.weixin.qq.com/s/iITqdIiHi3XGKq6u6FRVdg).

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/up-35e102c633bbe8e0dea1e075ea3fee5dcfb-e881b19b.png)

## What Are the Common Gateway Systems?

### Netflix Zuul

Zuul is a gateway service developed by Netflix that provides dynamic routing, monitoring, resiliency, and security. Built on the Java tech stack, it integrates with components such as Eureka, Ribbon, and Hystrix.

Zuul's core architecture is as follows:

![Zuul Core Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/zuul-core-architecture-888530a3.webp)

Zuul mainly filters requests through filters (similar to AOP) to implement essential gateway capabilities.

![Zuul Request Lifecycle](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/zuul-request-lifecycle-74745293.webp)

We can write custom filters to process requests, and the Zuul ecosystem itself comes with many ready-to-use filters. For example, rate limiting can use the community extension [spring-cloud-zuul-ratelimit](https://github.com/marcosbarbero/spring-cloud-zuul-ratelimit) (shown here merely as an example). Note the distinction: Hystrix primarily handles circuit breaking, timeouts, fallback degradation, and thread-pool/semaphore isolation—it is not strictly a QPS rate-limiting component.

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
</dependency>
<dependency>
    <groupId>com.marcosbarbero.cloud</groupId>
    <artifactId>spring-cloud-zuul-ratelimit</artifactId>
    <version>2.2.0.RELEASE</version>
</dependency>
```

[Zuul 1.x](https://netflixtechblog.com/announcing-zuul-edge-service-in-the-cloud-ab3af5be08ee) is based on synchronous I/O, which limits performance. [Zuul 2.x](https://netflixtechblog.com/open-sourcing-zuul-2-82ea476cb2b3) implements asynchronous I/O on top of Netty, delivering a substantial performance improvement.

![Zuul 2 Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/zuul2-core-architecture-adf8b865.png)

> **Important Note**: Modules in Spring Cloud Netflix such as Zuul 1.x, Ribbon, and Hystrix have entered maintenance mode, and mainstream Spring Cloud releases have long since moved to Spring Cloud Gateway. Although Netflix open-sourced Zuul 2.x, Zuul 2.x was never integrated into mainstream Spring Cloud releases. For new projects on the Spring Cloud stack, Zuul 1.x is no longer recommended; existing projects should gradually migrate to Spring Cloud Gateway or another modern gateway alongside planned refactoring windows.

- GitHub Repository: <https://github.com/Netflix/zuul>
- Official Wiki: <https://github.com/Netflix/zuul/wiki>

### Spring Cloud Gateway

Spring Cloud Gateway is the gateway project within the Spring Cloud ecosystem, created to replace the legacy gateway **Zuul** (specifically Zuul 1.x). Note that Spring Cloud Gateway started earlier than Zuul 2.x, and the two followed separate technological evolution paths.

#### Why Does Spring Cloud Gateway Perform Better?

| Version                  | I/O Model                  | Thread Model        | Throughput | Latency |
| ------------------------ | -------------------------- | ------------------- | ---------- | ------- |
| **Zuul 1.x**             | Synchronous blocking (Servlet) | Thread-per-request | Low        | High    |
| **Zuul 2.x**             | Asynchronous non-blocking (Netty) | Event loop     | High       | Low     |
| **Spring Cloud Gateway** | Asynchronous non-blocking (Netty) | Event loop     | High       | Low     |

Spring Cloud Gateway is built on **Spring WebFlux** rather than traditional Spring Web MVC. Spring WebFlux uses the **Reactor** library to implement a reactive programming model, backed by **Netty** for asynchronous, non-blocking I/O.

**Advantages of Reactive Programming**:

- **Non-blocking I/O**: No need to allocate a dedicated thread per request; a small number of threads can handle massive concurrent connections
- **Backpressure Mechanism**: Reactor's backpressure primarily operates along the reactive pipeline inside the gateway process, preventing in-flight requests from overwhelming the gateway itself. End-to-end overload protection still requires explicit rate limiting, bulkheads, timeouts, and circuit breakers—such as the `RequestRateLimiter` and `CircuitBreaker` filters
- **High Resource Utilization**: Thread context-switching overhead is drastically reduced

#### Core Concepts

The core building blocks of Spring Cloud Gateway consist of three parts:

1. **Route**: The basic building block of the gateway, composed of an ID, a destination URI, a collection of predicates, and a collection of filters
2. **Predicate**: Implemented on top of the Java 8 `Predicate` functional interface to match HTTP requests (such as path, method, headers, etc.). For example, `Path=/api/users/**`, `Method=GET`, `Header=X-Request-Id, \d+`; multiple Predicates are combined with logical AND
3. **Filter**: Instances of `GatewayFilter` used to modify requests and responses before or after a request is forwarded to a downstream service

Both Spring Cloud Gateway and Zuul 2.x process requests via filters, but Spring Cloud Gateway integrates much more tightly with the Spring ecosystem (such as Eureka, Consul, and Config). Currently, for new projects on the Java stack, Spring Cloud Gateway is usually the more mainstream choice. Note that Spring Cloud Gateway 4.x/5.x documentation now provides both Server and Proxy Exchange forms, with separate WebFlux and Web MVC compatible paths. Teams familiar with the Servlet stack that do not want to adopt reactive programming complexity yet can also evaluate Spring Cloud Gateway Server MVC.

It is also important to clarify its capability boundaries: Spring Cloud Gateway includes a built-in `RequestRateLimiter` filter whose common Redis implementation uses the token bucket algorithm, though Redis rate limiting requires pulling in the corresponding reactive Redis dependency; circuit-breaking capabilities are adapted via Spring Cloud CircuitBreaker to Resilience4j, requiring additional dependencies such as `spring-cloud-starter-circuitbreaker-reactor-resilience4j`. Nor is route configuration strictly "in-memory only": by default routes can be defined in YAML, or wired to external stores via `RouteDefinitionRepository`, a Redis route repository, or custom implementations combined with refresh mechanisms for dynamic updates.

- GitHub Repository: <https://github.com/spring-cloud/spring-cloud-gateway>
- Official Site: <https://spring.io/projects/spring-cloud-gateway>

### OpenResty

According to the official introduction:

> OpenResty is a high-performance web platform based on Nginx and Lua, bundling a wide collection of well-crafted Lua libraries, third-party modules, and most dependencies. It makes it convenient to build dynamic web applications, web services, and dynamic gateways capable of handling ultra-high concurrency with high extensibility.

![Relationship Between OpenResty, Nginx, and Lua](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gatewaynginx-lua-openresty-31f10ba6.png)

OpenResty is built on Nginx mainly to leverage its outstanding high-concurrency capabilities. However, because Nginx is written in C, the barrier to secondary development is high: implementing custom logic or features in Nginx requires writing C modules and recompiling Nginx.

To solve this problem, OpenResty integrates and maintains modules such as `ngx_http_lua_module` and `ngx_stream_lua_module`, embedding Lua/LuaJIT into Nginx. This allows us to embed Lua scripts inside Nginx and easily extend gateway functionality using Lua—such as implementing custom routing rules, filters, caching policies, and more.

> Lua is a very fast dynamic scripting language whose execution speed approaches that of C. LuaJIT is a Just-In-Time compiler for Lua that significantly improves the execution efficiency of Lua code. LuaJIT precompiles and caches commonly used Lua functions and utility libraries so that subsequent calls can directly execute the cached bytecode, greatly accelerating execution speed.

For an introduction to OpenResty and practical gateway security, this article is recommended: [OpenResty Fundamentals and Practical Gateway Security Every Backend Engineer Should Know (in Chinese)](https://mp.weixin.qq.com/s/3HglZs06W95vF3tSa3KrXw).

- GitHub Repository: <https://github.com/openresty/openresty>
- Official Site: <https://openresty.org/>

### Kong

Kong is a high-performance, cloud-native, extensible gateway system with a rich ecosystem built on [OpenResty](https://github.com/openresty/) (Nginx + Lua). It primarily consists of three components:

- Kong Server: An Nginx-based server responsible for receiving API requests.
- PostgreSQL: Stores operational data (traditional database mode). Early versions of Kong also supported Cassandra, but Kong Gateway 3.4 removed Cassandra DB support, so Cassandra is no longer recommended for new deployments.
- Kong Manager: The official UI management tool providing visual API management, monitoring, and configuration (available in OSS open-source and Enterprise editions). Management can also be performed via the RESTful Admin API.

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/kong-way-23c45e6f.webp)

In traditional mode, Kong relies on an external database to store configuration, making the architecture relatively complex and requiring high availability for the database layer as well. However, since **Kong 1.1**, **DB-less mode** has been supported:

- **Traditional Mode**: Uses PostgreSQL to store configuration; suitable for scenarios requiring persistent API management via the Admin API
- **DB-less Mode**: Managed through declarative configuration files without deploying a database, resulting in a lighter architecture
- **Hybrid Mode**: The control plane uses a database to manage configuration while data planes do not connect directly to the database, making it ideal for multi-cluster and cross-region configuration distribution
- **Kubernetes Ingress Mode**: Manages configuration via ConfigMaps or CRDs (Kubernetes Custom Resource Definitions) with no database required, which is the mainstream approach in Kubernetes environments

> **Note**: Subsequent discussions in this article about Kong high availability mainly apply to traditional database mode. When running in Kubernetes Ingress Controller mode, DB-less mode, or Hybrid mode, architecture and operational concerns differ significantly.

Kong provides a plugin mechanism to extend its functionality; plugins execute during the lifecycle of an API request-response cycle. For example, enabling the Zipkin plugin on a service:

```shell
$ curl -X POST http://kong:8001/services/{service}/plugins \
    --data "name=zipkin"  \
    --data "config.http_endpoint=http://your.zipkin.collector:9411/api/v2/spans" \
    --data "config.sample_ratio=0.001"
```

Kong itself is a Lua application wrapped on top of OpenResty. Ultimately, by embedding Lua into Nginx, it makes Nginx programmable—allowing plugins to implement nearly anything at the Nginx layer, such as rate limiting, security access policies, routing, load balancing, and more. Writing a Kong plugin simply means writing a custom Lua script following Kong's plugin specification, loading it into Kong, and referencing it.

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/kong-gateway-overview-d0df05c1.png)

In addition to Lua, Kong supports developing plugins in languages such as Go, JavaScript, and Python thanks to the corresponding PDKs (Plugin Development Kits).

For detailed documentation on Kong plugins, refer to the official docs: <https://docs.konghq.com/gateway/latest/kong-plugins/>, which cover the topic thoroughly.

- GitHub Repository: <https://github.com/Kong/kong>
- Official Site: <https://konghq.com/kong>

### APISIX

APISIX is a high-performance, cloud-native, extensible gateway system built on OpenResty and etcd.

> etcd is an open-source, highly available distributed key-value store written in Go that uses the Raft consensus protocol.

Compared with traditional API gateways, APISIX supports dynamic routing and hot-reloading of plugins, making it particularly well suited for API management in microservices architectures. Moreover, APISIX integrates conveniently with DevOps ecosystem tools such as SkyWalking (distributed tracing), Zipkin (distributed tracing), and Prometheus (monitoring).

![APISIX Architecture Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/apisix-architecture-a09329cb.png)

Positioned as an alternative to Nginx and Kong, APISIX became an Apache Top-Level Project on July 15, 2020. Many well-known companies in China (such as Kingsoft, Youzan, iQIYI, Tencent, and Beike) already use APISIX to handle core business traffic.

APISIX competes strongly with Kong in dynamic routing, etcd-based hot configuration updates, plugin ecosystem, and dashboard capabilities. However, performance comparisons across API gateways depend heavily on software versions, deployment topology, route counts, plugin chain length, request payload size, TLS settings, and connection reuse strategies—you should benchmark against your own workload rather than blindly taking any vendor's marketing claims at face value.

APISIX also supports custom plugin development. Besides writing plugins in Lua, developers can avoid the learning curve of Lua through two additional approaches:

- Supporting mainstream programming languages (such as Java, Python, Go, etc.) via **Plugin Runner**. Backend engineers can develop APISIX plugins in familiar languages over local RPC communication. This lowers development cost and boosts productivity, at the trade-off of some performance overhead.
- Developing plugins with **Wasm (WebAssembly)**. Wasm is embedded into APISIX, enabling users to compile plugins into Wasm bytecode and execute them inside APISIX.

> Wasm is a binary instruction format for a stack-based virtual machine—a low-level assembly-like target designed to approach compiled machine code and near-native performance. Originally built for browsers, Wasm has seen growing adoption on the server side as the technology has matured.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/up-a240d3b113cde647f5850f4c7cc55d4ff5c-a3815934.png)

- GitHub Repository: <https://github.com/apache/apisix>
- Official Site: <https://apisix.apache.org/zh/>

### ShenYu

ShenYu is an extensible, high-performance, reactive gateway built on WebFlux and is an Apache Top-Level open-source project.

![ShenYu Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/api-gateway/shenyu-architecture-0d715a80.png)

ShenYu extends its capabilities through plugins—plugins are the soul of ShenYu, and they are extensible and hot-pluggable, with different plugins implementing different features. ShenYu comes with built-in plugins for rate limiting, circuit breaking, forwarding, rewriting, redirection, route monitoring, and more.

- GitHub Repository: <https://github.com/apache/shenyu>
- Official Site: <https://shenyu.apache.org/>

### Gateway Comparison Overview

| Feature                 | Zuul 1.x                                      | Zuul 2.x            | Spring Cloud Gateway                                           | Kong                           | APISIX            | ShenYu                       |
| ----------------------- | --------------------------------------------- | ------------------- | -------------------------------------------------------------- | ------------------------------ | ----------------- | ---------------------------- |
| **I/O Model**           | Synchronous blocking                          | Asynchronous non-blocking | Asynchronous non-blocking                                | Asynchronous non-blocking      | Asynchronous non-blocking | Asynchronous non-blocking |
| **Underlying Tech**     | Servlet                                       | Netty               | WebFlux/Server MVC + Netty/Servlet container                   | OpenResty (Nginx + Lua)        | OpenResty + etcd  | WebFlux + Netty              |
| **Performance**         | Low                                           | High                | High                                                           | Very high                      | Very high         | High                         |
| **Dynamic Config**      | Restart required by default; extensible       | Supported; custom setup needed | Supported                                         | Supported                      | Supported (hot reload) | Supported               |
| **Config Storage**      | Local config / memory                         | Custom              | YAML/memory by default; extensible to Redis or custom route repo | PostgreSQL / YAML / K8s CRD    | etcd (distributed) | Memory / DB / registry      |
| **Rate Limit & Circuit Break** | Rate limit via extensions; circuit break via Hystrix | Requires integration | Built-in `RequestRateLimiter`; circuit break via CircuitBreaker | Plugins                        | Plugins           | Plugins                      |
| **Ecosystem**           | Netflix (maintenance mode)                    | Netflix             | Spring Cloud                                                   | Kong / plugin ecosystem        | Apache            | Apache                       |
| **Ops Complexity**      | Low                                           | Medium              | Low to medium                                                  | Medium (DB-less) / High (DB Mode) | Medium         | Medium                       |
| **Learning Curve**      | Gentle                                        | Gentle              | Gentle to medium                                               | Steep (Lua)                    | Steep (Lua)       | Gentle (Java)                |
| **Best Fit**            | Legacy system maintenance                     | Existing Netflix stack | Spring Cloud ecosystem                                      | Cloud-native, polyglot         | Cloud-native, high performance | Java ecosystem      |

The "Performance" row above is only a rule-of-thumb classification and cannot replace real benchmarking. Actual performance depends on route count, plugin chain length, request body size, TLS toggle, connection reuse rate, logging sampling rate, downstream latency, and more. Before making a final decision, run load tests under your own traffic profile using tools such as `wrk2`, `vegeta`, or `k6`, paying close attention to P99/P999 latency, error rates, and CPU/memory consumption rather than looking solely at raw QPS.

## How to Choose?

Choosing an API gateway requires weighing your tech stack, performance requirements, team capabilities, and operational costs.

### Dual-Layer Gateway Architecture

In medium-to-large microservices systems, a common practice is to split the gateway into two layers:

- **Traffic Gateway**: Typically deployed at the edge layer. Options include Kong, APISIX, Nginx/OpenResty, Envoy Gateway, etc., handling infrastructure-oriented capabilities such as SSL termination, WAF, global rate limiting, IP allowlists/denylists, DDoS protection, and protocol adaptation.
- **Business Gateway**: Typically deployed inside the internal network. Options include Spring Cloud Gateway, ShenYu, or an in-house gateway, handling business-adjacent capabilities such as microservice routing, fine-grained authentication/authorization, parameter validation, canary routing, and business-side observability.

If the system scale is small, the business domain is cohesive, and team headcount is limited, a single-layer gateway is usually simpler. Once external traffic governance and internal business routing responsibilities begin interfering with each other, splitting into two layers becomes much cleaner. If your team has already fully adopted a Service Mesh, you can also evaluate using Envoy/Istio Ingress directly for north-south traffic entry to avoid stacking too many proxy hops.

| Scenario                        | Recommended Option                                                      | Rationale                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Spring Cloud Ecosystem**      | Spring Cloud Gateway                                                    | Seamless integration with Spring Boot/Spring Cloud, simple configuration                               |
| **High Performance / Cloud-Native** | APISIX                                                              | etcd-based hot updates, strong performance, cloud-native architecture                                  |
| **Polyglot Ecosystem**          | Kong                                                                    | Rich plugin catalog, multi-language plugin support, mature community                                   |
| **Existing Netflix Stack**      | Maintain current setup and plan migration                               | Zuul 1.x, Ribbon, Hystrix, etc. are in maintenance mode; do not expand new projects on top of them     |
| **Dual-Layer Architecture**     | Kong/APISIX/Envoy (Traffic Gateway) + Spring Cloud Gateway (Business Gateway) | Traffic gateway handles SSL, WAF, global rate limiting; business gateway handles service auth, validation, canary routing |

## References

- Spring Cloud Gateway Official Documentation: <https://docs.spring.io/spring-cloud-gateway/reference/>
- Spring Cloud Netflix Maintenance Mode Announcement: <https://cloud.spring.io/spring-cloud-netflix/multi/multi__modules_in_maintenance_mode.html>
- Kong Gateway 3.4 Breaking Changes: <https://docs.konghq.com/gateway/latest/breaking-changes/34x/>
- ASF Announces Apache APISIX as a Top-Level Project: <https://news.apache.org/foundation/entry/the-apache-software-foundation-announces66>
- RFC 9113 HTTP/2: <https://www.ietf.org/rfc/rfc9113.html>
- Kong Plugin Development Tutorial [Easy-to-Follow] (in Chinese): <https://cloud.tencent.com/developer/article/2104299>
- API Gateway Kong in Practice (in Chinese): <https://xie.infoq.cn/article/10e4dab2de0bdb6f2c3c93da6>
- Spring Cloud Gateway Principles and Applications (in Chinese): <https://blog.fintopia.tech/60e27b0e2078082a378ec5ed/>
- Why Do Microservices Need an API Gateway? (in Chinese): <https://apisix.apache.org/zh/blog/2023/03/08/why-do-microservices-need-an-api-gateway/>
