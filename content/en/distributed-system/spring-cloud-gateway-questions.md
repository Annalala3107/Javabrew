---
title: "Spring Cloud Gateway Interview Questions Summary: Routing, Predicate, Filter, Rate Limiting, Circuit Breaking, and Working Principles"
category: Distributed Systems
description: "Summary of frequently asked Spring Cloud Gateway interview questions covering core concepts, route matching, Predicate, GatewayFilter, GlobalFilter, rate limiting and circuit breaking, load balancing, CORS handling, and common production issues."
tag:
  - API Gateway
  - Spring Cloud
head:
  - - meta
    - name: keywords
      content: Spring Cloud Gateway,Spring Cloud Gateway Interview Questions,API Gateway,Predicate,GatewayFilter,GlobalFilter,Gateway Rate Limiting,Gateway Circuit Breaking,Microservices Gateway
lang: en
sourceRef: zh-ref/distributed-system/spring-cloud-gateway-questions.md
---

> This article is refactored and expanded from [6,000 Words | 16 Diagrams | Deeply Understanding the Principles of Spring Cloud Gateway - Wukong Talks Architecture (in Chinese)](https://mp.weixin.qq.com/s/XjFYsP1IUqNzWqXZdJn-Aw).

This article focuses exclusively on high-frequency Spring Cloud Gateway interview topics. If you are not yet clear on why an API gateway exists, the relationship between gateways and RPC, or how to choose among Zuul, Gateway, Kong, and APISIX, it is recommended to read [API Gateway Explained](./api-gateway.md) first.

## What Is Spring Cloud Gateway?

Spring Cloud Gateway is the gateway project within the Spring Cloud ecosystem, created primarily to replace **Zuul 1.x**. Zuul 1.x is built on a Servlet blocking I/O architecture, which limits performance under high concurrency. Although Zuul 2.x adopted a Netty non-blocking architecture, Spring Cloud never officially integrated Zuul 2.x, and Spring Cloud Gateway started earlier than Zuul 2.x.

To boost gateway performance, Spring Cloud Gateway is built on Spring WebFlux. Spring WebFlux uses the Reactor library to implement a reactive programming model, backed by Netty for synchronous non-blocking I/O.

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/springcloud-gateway--demo-dd42f8cc.png)

Spring Cloud Gateway not only provides a unified routing mechanism, but also offers essential gateway capabilities through a Filter chain—such as security, monitoring/metrics, and rate limiting.

Spring Cloud Gateway does not differ drastically from Zuul 2.x in that both process requests via filters. However, Spring Cloud Gateway is currently much more strongly recommended than Zuul because it enjoys tighter and friendlier support across the Spring Cloud ecosystem.

- GitHub Repository: <https://github.com/spring-cloud/spring-cloud-gateway>
- Official Site: <https://spring.io/projects/spring-cloud-gateway>

## How Does Spring Cloud Gateway Work?

The workflow of Spring Cloud Gateway is shown in the diagram below:

![Spring Cloud Gateway Workflow](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-workflow-ebcb7ec4.png)

This diagram comes from the official Spring blog; original link: <https://spring.io/blog/2022/08/26/creating-a-custom-spring-cloud-gateway-filter>.

Step-by-step breakdown of the workflow:

1. **Route Matching**: After a client request reaches the gateway, it first passes through `Gateway Handler Mapping`, which evaluates Predicates to find a matching routing rule mapping to a backend service.
2. **Request Filtering**: The request then moves to `Gateway Web Handler`, where numerous filters form a Filter Chain. These filters can intercept and modify the request—such as adding request headers or validating parameters, much like purifying wastewater—before forwarding the request to the actual backend service. Logically, these filters are referred to as Pre-Filters ("Pre" meaning "before").
3. **Service Processing**: The backend service processes the request.
4. **Response Filtering**: Once the backend finishes processing, the response returns through the Gateway filters again for post-processing. Logically, these are referred to as Post-Filters ("Post" meaning "after").
5. **Response Return**: After filter processing, the final response is returned to the client.

Summary: A client request first matches an appropriate route via matching rules so it can map to a specific service. The request is then processed by filters, forwarded to the target service, processed by filters again on the way back, and finally returned to the client.

## What Is a Predicate in Spring Cloud Gateway?

The word Predicate may sound abstract, but it simply means evaluating a condition against the request: if true, it matches the current route; if false, evaluation continues to other routes.

In Spring Cloud Gateway, if a client request satisfies the Predicate conditions, it maps to the designated router and can be forwarded to the corresponding target service for processing.

Below is an example of Predicate configuration with two routing rules. Under the `predicates` configuration, when the request URL contains `api/thirdparty`, it matches the first route `route_thirdparty`.

![Predicate Configuration Example](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-predicate-example-efe81894.png)

Common route Predicate rules are illustrated below:

![Spring Cloud Gateway Route Predicate Rules](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-predicate-rules-bfea778e.webp)

## What Is the Relationship Between Routes and Predicates in Spring Cloud Gateway?

The mapping relationship between Routes and Predicates is shown below:

![Relationship Between Routes and Predicates](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-predicate-route-f0e47f1d.png)

- **One-to-Many**: A single route rule can contain multiple Predicates. For instance, in the diagram above, `Route1` is configured with three Predicates.
- **All Must Match (Logical AND)**: If a route rule contains multiple Predicates, all of them must be satisfied simultaneously to match. As shown for `Route2`, a client request must satisfy both Predicates in order to match `Route2`.
- **First Match Wins**: If a request can match multiple routes, it maps to the first matching route. As shown above, a client request satisfies the Predicates of both `Route3` and `Route4`, but because `Route3` appears earlier in the configuration file, only `Route3` is matched.

## How Does Spring Cloud Gateway Implement Dynamic Routing?

When using Spring Cloud Gateway, the approaches documented in official examples are typically based on static configuration files or programmatic configuration in code.

Because Spring Cloud Gateway serves as the entry point for microservices, restarts must be avoided whenever possible. Making configuration changes require service restarts cannot satisfy real production demands for dynamic refreshes and real-time updates, so we need to configure the gateway dynamically at runtime.

There are many ways to implement dynamic routing, and one recommended approach is building it on top of the Nacos service registry. Spring Cloud Gateway can retrieve service metadata (such as service name, paths, etc.) from the registry and automatically generate routing rules based on that information. That way, when service instances are added, removed, or updated, the gateway automatically detects the changes and adjusts routing rules accordingly without manual route maintenance.

In fact, we do not need to implement all these complex steps from scratch—combining Nacos Server with Spring Cloud Alibaba Nacos Config enables dynamic configuration updates out of the box. Official documentation: <https://github.com/alibaba/spring-cloud-alibaba/wiki/Nacos-config>.

## What Types of Filters Does Spring Cloud Gateway Have?

Filters can be categorized into two types according to request and response phases:

- **Pre-Type**: Intercept and modify requests before they are forwarded to microservices—for example, parameter validation, authorization checks, traffic monitoring, logging, and protocol conversion.
- **Post-Type**: After a microservice finishes handling the request and returns a response to the gateway, the gateway processes the response again—for example, modifying the response body or headers, logging, or traffic monitoring.

Another classification divides Filters by their scope of application:

- **GatewayFilter**: Local filters applied to a single route or a specific group of routes. Those highlighted in red represent commonly used filters.
- **GlobalFilter**: Global filters applied to all routes.

### Local Filters (GatewayFilter)

Common local filters are shown below:

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-gatewayfilters-8260032d.png)

How are they used in practice? Here is an example that strips `"api"` from the URL if the route matches:

```yaml
filters: # Filters
  - RewritePath=/api/(?<segment>.*),/$\{segment} # Replace "api" in the forwarded path with empty
```

Of course, we can also build custom filters, which will not be expanded upon in this article.

### Global Filters (GlobalFilter)

Common global filters are shown below:

![](/media/jg/ext/oss.javaguide.cn/system-design/distributed-system/api-gateway/spring-cloud-gateway-globalfilters-4f00588f.png)

The most common usage of a global filter is load balancing, configured as follows:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: route_member # Third-party / member microservice routing rule
          uri: lb://passjava-member # Load balance and forward requests to the passjava-member service registered in the registry
          predicates: # Predicates
            - Path=/api/member/** # Apply this routing rule if the frontend request path contains api/member
          filters: # Filters
            - RewritePath=/api/(?<segment>.*),/$\{segment} # Replace api in the forwarded path with empty
```

Notice the `lb` keyword here, which uses the global filter `LoadBalancerClientFilter`. Once this route is matched, requests are forwarded to the `passjava-member` service with load balancing—meaning `passjava-member` is first resolved into an actual microservice host and port, and then the request is forwarded to that microservice instance.

## Does Spring Cloud Gateway Support Rate Limiting?

Spring Cloud Gateway includes a built-in rate-limiting filter backed by the `RateLimiter` interface. The `RateLimiter` interface has only one built-in implementation class, `RedisRateLimiter` (implemented using Redis + Lua), which offers relatively basic functionality and is not especially ergonomic to use.

Starting from Sentinel 1.6.0, Sentinel introduced an adapter module for Spring Cloud Gateway that supports rate limiting across two resource dimensions: route-level and custom API-level. In other words, Spring Cloud Gateway can integrate with Sentinel to achieve much more powerful gateway traffic control.

## How Do You Customize Global Exception Handling in Spring Cloud Gateway?

In a standard Spring Boot application, catching global exceptions only requires configuring `@RestControllerAdvice` and `@ExceptionHandler`. However, that approach does not work in Spring Cloud Gateway.

Spring Cloud Gateway provides multiple ways to handle global exceptions; a relatively common approach is implementing `ErrorWebExceptionHandler` and overriding its `handle` method.

```java
@Order(-1)
@Component
@RequiredArgsConstructor
public class GlobalErrorWebExceptionHandler implements ErrorWebExceptionHandler {
    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
    // ...
    }
}
```

## References

- Spring Cloud Gateway Official Documentation: <https://cloud.spring.io/spring-cloud-gateway/reference/html/>
- Creating a Custom Spring Cloud Gateway Filter: <https://spring.io/blog/2022/08/26/creating-a-custom-spring-cloud-gateway-filter>
- Global Exception Handling (in Chinese): <https://zhuanlan.zhihu.com/p/347028665>
