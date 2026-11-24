---
title: "Load Balancing Principles and Algorithms Explained"
description: "An in-depth guide to the core principles of Load Balancing, covering differences between Layer 4 and Layer 7 Load Balancing, server-side vs. client-side Load Balancing, common scheduling algorithms such as round-robin, weighted round-robin, random, and consistent hashing, as well as mainstream implementations like Nginx and LVS."
category: High Performance
head:
  - - meta
    - name: keywords
      content: Load Balancing,Layer 4 Load Balancing,Layer 7 Load Balancing,Nginx Load Balancing,LVS,Load Balancing Algorithms,Round Robin,Consistent Hashing,Client-Side Load Balancing
lang: en
sourceRef: zh-ref/high-performance/load-balancing.md
---

## What Is Load Balancing?

**Load Balancing** refers to distributing user requests across multiple servers for processing in order to improve the system's overall concurrent processing capacity and reliability. Load Balancing can be implemented using dedicated software or hardware; generally speaking, hardware offers higher performance while software is far more cost-effective (detailed below).

The diagram below comes from an article in the "High Concurrency" chapter of [*Java Interview Guidebook*](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247519384&idx=1&sn=bc7e71af75350b755f04ca4178395b1a&chksm=cea1c353f9d64a458f797696d4144b4d6e58639371a4612b8e4d106d83a66d2289e7b2cd7431&token=660789642&lang=zh_CN&scene=21#wechat_redirect). As shown, the system's product service is deployed across multiple servers, and Load Balancing is used to distribute incoming traffic to the product service.

![Multiple Service Instances - Load Balancing](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/multi-service-load-balancing.drawio-ff318ce3.png)

Load Balancing is a common and relatively straightforward way to improve system concurrency and reliability, and is used in nearly every monolithic or microservice architecture.

However, Load Balancing solves the problem of "spreading requests across multiple nodes"—it does not automatically fix business bottlenecks such as slow SQL, exhausted thread pools, cache breakdown, or slow downstream services. If every backend node is slow, Load Balancing only distributes slow requests more evenly; it cannot make the system faster out of thin air.

## What Types of Load Balancing Exist?

Load Balancing can be broadly divided into two categories: **Server-Side Load Balancing** and **Client-Side Load Balancing**.

Server-side Load Balancing involves more concepts and is encountered more frequently in daily work, so we will spend more time covering it.

### Server-Side Load Balancing

**Server-side Load Balancing** is primarily placed between **external client requests** and the **API gateway layer**, and can be implemented using either **software** or **hardware**.

Below is a simple Nginx-based server-side Load Balancing diagram I drew:

![Nginx-Based Server-Side Load Balancing](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/server-load-balancing-00788c20.png)

**Hardware Load Balancing** relies on dedicated physical appliances (such as **F5, A10, Array**) to provide Load Balancing capabilities.

The advantage of hardware Load Balancing is extremely high performance and stability; the downside is that it is prohibitively expensive. Even an entry-level F5 appliance costs over 200,000 RMB at minimum, which most companies simply cannot afford. Unless traffic volume is massive, there is no real need to buy dedicated hardware—software Load Balancing is more than sufficient!

In day-to-day engineering, we rarely interact directly with hardware load balancers and work far more often with **software Load Balancing**. Software Load Balancing implements balancing via software (such as **LVS, Nginx, HAProxy**). Although its raw performance is slightly lower, it is vastly cheaper—an entry-level Linux server costs only a few thousand RMB, and a high-performance server at 20,000–30,000 RMB is already very capable.

According to the OSI model, server-side Load Balancing can also be categorized into:

- Layer 2 Load Balancing
- Layer 3 Load Balancing
- Layer 4 Load Balancing
- Layer 7 Load Balancing

The most common ones are Layer 4 and Layer 7 Load Balancing, which are the focus of this article.

> The official Nginx website provides detailed introductions to Layer 4 and Layer 7 Load Balancing if you want to explore further:
>
> - [What Is Layer 4 Load Balancing?](https://www.nginx.com/resources/glossary/layer-4-load-balancing/)
> - [What Is Layer 7 Load Balancing?](https://www.nginx.com/resources/glossary/layer-7-load-balancing/)

![OSI 7-Layer Model](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-7-model-955bfdf5.png)

- **Layer 4 Load Balancing** operates at Layer 4 of the OSI model—the Transport Layer—where the primary protocols are TCP and UDP. At this layer, the load balancer inspects source and destination IP addresses and ports in network packets and forwards packets to backend real servers according to a Load Balancing algorithm. In short, Layer 4 Load Balancing works at the IP + port level without inspecting application message payloads.
- **Layer 7 Load Balancing** operates at Layer 7 of the OSI model—the Application Layer—where the primary protocol is HTTP. Routing decisions at this layer are more sophisticated than at Layer 4: the load balancer reads the application payload (such as HTTP message content) and routes requests based on attributes like URL or Cookie. In other words, Layer 7 Load Balancing operates at the message-content level (URL, Cookie, etc.), and devices performing Layer 7 Load Balancing are commonly called **reverse proxy servers**.

Layer 7 Load Balancing consumes more compute resources than Layer 4 Load Balancing, but it is far more flexible and can intelligently route requests as well as apply content-aware optimizations such as caching, compression, and encryption.

Put simply: **Layer 4 Load Balancing delivers higher raw performance, while Layer 7 Load Balancing offers richer features!** That said, for the vast majority of business workloads, the performance gap between Layer 4 and Layer 7 Load Balancing is practically negligible.

In practice, you can choose between them using the following criteria:

| Comparison Dimension | Layer 4 Load Balancing                         | Layer 7 Load Balancing                                        |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| Operating Layer      | TCP/UDP                                        | HTTP/HTTPS                                                    |
| Forwarding Basis     | IP, port                                       | Domain, path, Header, Cookie                                  |
| Performance Overhead | Lower                                          | Higher                                                        |
| Flexibility          | Limited                                        | Stronger                                                      |
| Typical Use Cases    | High-traffic ingress, database proxy, TCP services | API gateways, reverse proxies, canary releases, path routing  |

If you only need to forward TCP traffic, Layer 4 is more direct; if you need routing based on URL, Header, or Cookie, or features like compression, caching, and TLS termination, Layer 7 is a better fit.

The following quote is taken from Nginx's official article [What Is Layer 4 Load Balancing?](https://www.nginx.com/resources/glossary/layer-4-load-balancing/):

> Layer 4 load balancing was a popular architectural approach to traffic handling when commodity hardware was not as powerful as it is now, and the interaction between clients and application servers was much less complex. It requires less computation than more sophisticated load balancing methods (such as Layer 7), but CPU and memory are now sufficiently fast and cheap that the performance advantage for Layer 4 load balancing has become negligible or irrelevant in most situations.

In practice, we typically use **Nginx** for Layer 7 Load Balancing and **LVS** (Linux Virtual Server, kernel-level Layer 4 Load Balancing on Linux) for Layer 4 Load Balancing.

If you want to review common Nginx interview knowledge points, [*Java Interview Guidebook*](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html) already covers them in the "Technical Interview Questions" section.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220328105759300-ce19b4b7.png)

However, most companies rarely need LVS—typically only giant tech companies like Alibaba, Baidu, Tencent, or eBay use it, whereas Nginx is by far the most widely adopted choice.

### Client-Side Load Balancing

**Client-side Load Balancing** is primarily used between internal microservices within a system and can be implemented using ready-made Load Balancing libraries.

In client-side Load Balancing, the client maintains a list of server addresses locally and selects a specific backend server according to a Load Balancing algorithm before sending a request.

The client-side load balancer runs inside the same process (i.e., the same Java application) as the caller service, eliminating an extra network hop. However, client-side Load Balancing implementations are tied to the programming language—for example, Spring Cloud Load Balancer only works for Java.

Mainstream Java microservice frameworks such as Dubbo and Spring Cloud ship with out-of-the-box client-side Load Balancing. Dubbo includes built-in Load Balancing by default, whereas Spring Cloud provides it via modular components—most commonly Spring Cloud Load Balancer (official, recommended) and Ribbon (Netflix, deprecated).

Below is a simple diagram of client-side Load Balancing based on Spring Cloud Load Balancer (Ribbon works similarly):

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/spring-cloud-lb-gateway-382ba3b4.png)

## What Are Common Load Balancing Algorithms?

### Random

**Random** is the simplest and most straightforward Load Balancing algorithm.

Without weights configured, every server has an equal probability of being selected. With weights configured, servers with higher weights have a higher probability of receiving requests.

Unweighted random works well for clusters where servers have similar hardware capacity and share load equally. Weighted random suits heterogeneous clusters with unequal server capacities, allowing a more reasonable traffic distribution.

However, the random algorithm has a notable drawback: because selection is probabilistic, some servers may receive no requests at all for a period of time—even when all servers have identical weights.

That brings us to **Round-Robin**!

### Round-Robin

Round-Robin cycles through servers one by one to handle requests, and also supports weights.

Without weights, requests are assigned sequentially to each server in turn over time. With weights, servers with higher weights are selected more frequently.

Unweighted round-robin suits homogeneous clusters with similar server performance. Weighted round-robin suits heterogeneous clusters with varying server performance for fairer request distribution.

Building on basic weighted round-robin, further improvements exist, such as the **smooth weighted round-robin** algorithm.

Smooth weighted round-robin was first implemented in Nginx (see this commit: <https://github.com/phusion/nginx/commit/27e94984486058d73157038f7950a0a36ecc6e35>). If you have studied Dubbo's Load Balancing strategies closely, you will recognize that Dubbo's weighted round-robin borrows from this algorithm and optimizes it further.

![Dubbo Weighted Round-Robin Load Balancing Algorithm](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/dubbo-round-robin-load-balance-15f096cd.png)

### Power of Two Random Choices (2-Random)

The Power of Two Random Choices builds on the random algorithm by picking two candidate servers at random instead of one, then comparing their current loads (or other metrics) to pick the better server.

The advantage of this approach is that it dynamically balances load across backend nodes. Single random selection can leave some servers overloaded while others sit idle.

### Hashing

Hashing applies a hash function to request attributes to produce a hash value, then uses that hash value to determine which server handles the request.

As long as the number of servers stays constant, requests with the same parameters (such as the same client IP or the same user) are always routed to the same server.

### Consistent Hashing

Like standard hashing, Consistent Hashing routes requests with the same parameters to the same server, while solving key limitations of standard modulo hashing.

With standard hashing, when the number of servers changes, hash mappings shift across different servers, defeating the purpose of sticky routing. Consistent Hashing maps both data keys and server nodes onto a hash ring, assigning requests clockwise to the nearest node on the ring. When a server is added or removed, only keys belonging to that node's segment are affected rather than reshuffling mappings across the entire cluster.

### Least Connections

When a new request arrives, this algorithm iterates over the server list and picks the server with the fewest active connections. If multiple servers tie for the fewest connections, weighted random selection can be used as a tiebreaker.

Least connections relies on the idealized assumption that more connections mean higher load. In reality, connection count does not always reflect true server load—some connections consume heavy system resources while others are nearly idle.

### Least Active

Least Active is similar to Least Connections, but more accurate. It uses the number of active requests (i.e., requests currently being processed) as its metric. Fewer active requests indicate greater available capacity, steering more traffic toward faster-processing servers. When servers tie in active count, weighted random selection can be applied.

### Shortest Response Time

Unlike Least Connections and Least Active, Shortest Response Time selects the target server based on observed response latency. The client tracks each server's response time and routes each request to the server with the shortest response time (using weighted random on ties).

This algorithm speeds up request processing, though it can risk concentrating excessive traffic onto high-performance servers.

## How Can Layer 7 Load Balancing Be Implemented?

Here are two widely used Layer 7 Load Balancing approaches in real-world projects: DNS resolution and reverse proxy.

Aside from these two approaches, techniques like HTTP redirects can also implement Load Balancing, but DNS resolution and reverse proxies are much more common and generally recommended.

### DNS Resolution

DNS resolution is an early and very simple way to achieve Layer 7 Load Balancing.

Its principle is straightforward: configure multiple IP addresses for the same host record in the DNS server, each pointing to a different server. When a user queries the domain, the DNS server returns IP addresses in a round-robin sequence, achieving round-robin Load Balancing.

![](/media/jg/ext/oss.javaguide.cn/javaguide/high-performance/load-balancing/6997605302452f07e8b28d257d349bf0-ed281abd.png)

Almost all modern DNS services support weighted IP records, allowing more balanced traffic distribution across clusters with unequal server capacities. For instance, Alibaba Cloud DNS supports weight configuration.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/aliyun-dns-weight-setting-5dd72ad3.png)

### Reverse Proxy

Clients send requests to a reverse proxy server, which selects a target backend server, retrieves the response, and returns it to the client. Externally, only the reverse proxy's address is exposed, hiding real backend server IPs. The reverse proxy acts on behalf of the target servers transparently to the client.

Nginx is the most widely used reverse proxy server; it evenly distributes incoming client requests across all servers in a backend cluster according to configured rules (Load Balancing policies).

Reverse-proxy Load Balancing also belongs to Layer 7 Load Balancing.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/nginx-load-balance-b7de5ca7.png)

### Health Checks and Traffic Draining

Once Load Balancing goes live in production, health checks matter even more than the scheduling algorithm itself. Algorithms determine "how traffic is split under normal conditions," whereas health checks determine "whether unhealthy nodes are allowed to keep receiving traffic."

Common health check methods:

- **TCP check**: Considers a node healthy if its port accepts connections; suitable for Layer 4 Load Balancing, though it cannot tell whether business logic is actually working.
- **HTTP check**: Periodically probes endpoints like `/health` or `/actuator/health` and judges node availability based on status codes and response payloads.
- **Business readiness probe**: Verifies critical dependencies such as databases, caches, and downstream services; suitable for core paths, though the probe logic must remain lightweight.

In production, configure warm-up and graceful draining for backend nodes. When a new node just starts up, its JIT compiler, connection pools, and local caches are still cold—sending full traffic immediately can easily cause latency spikes. Likewise, when taking a node offline, stop sending new requests first and wait for in-flight requests to finish before shutting down.

## How Is Client-Side Load Balancing Typically Implemented?

As mentioned earlier, client-side Load Balancing can be implemented with ready-made Load Balancing libraries.

**Netflix Ribbon** and **Spring Cloud Load Balancer** are the two most popular Load Balancing components in the Java ecosystem.

Ribbon is a veteran Load Balancing library developed by Netflix, offering comprehensive features and a rich set of Load Balancing strategies. Spring Cloud Load Balancer is Spring's official replacement for Ribbon, with simpler functionality and fewer built-in strategies.

The 7 Load Balancing strategies supported by Ribbon:

- `RandomRule`: Random strategy.
- `RoundRobinRule` (default): Round-robin strategy.
- `WeightedResponseTimeRule`: Weighted strategy (assigns weights based on response time).
- `BestAvailableRule`: Least-connections strategy.
- `RetryRule`: Retry strategy (selects instances using round-robin; if the selected instance is `null` or unavailable, continuously retries within a configured timeout window, returning `null` if still unsuccessful).
- `AvailabilityFilteringRule`: Availability-filtering strategy (filters out unhealthy instances first, then chooses among instances with fewer concurrent connections).
- `ZoneAvoidanceRule`: Zone-avoidance strategy (selects service instances based on zone performance and service availability).

The 2 built-in Load Balancing strategies supported by Spring Cloud Load Balancer:

- `RandomLoadBalancer`: Random strategy.
- `RoundRobinLoadBalancer` (default): Round-robin strategy.

```java
public class CustomLoadBalancerConfiguration {

    @Bean
    ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(Environment environment,
            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new RandomLoadBalancer(loadBalancerClientFactory
                .getLazyProvider(name, ServiceInstanceListSupplier.class),
                name);
    }
}
```

However, Spring Cloud Load Balancer actually supports more than just these two strategies—implementations of `ServiceInstanceListSupplier` enable Ribbon-like Load Balancing capabilities as well. This was gradually added in later releases and is easy to miss without reading the official docs, which shows why reading official documentation matters so much!

Here are two official examples:

- `ZonePreferenceServiceInstanceListSupplier`: Implements zone-preference Load Balancing.
- `HintBasedServiceInstanceListSupplier`: Implements hint-based Load Balancing.

```java
public class CustomLoadBalancerConfiguration {
    // Use a zone-preference load balancing approach
    @Bean
    public ServiceInstanceListSupplier discoveryClientServiceInstanceListSupplier(
            ConfigurableApplicationContext context) {
        return ServiceInstanceListSupplier.builder()
                    .withDiscoveryClient()
                    .withZonePreference()
                    .withCaching()
                    .build(context);
    }
}
```

For more detailed and up-to-date information on Spring Cloud Load Balancer, refer to the official documentation: <https://docs.spring.io/spring-cloud-commons/docs/current/reference/html/#spring-cloud-loadbalancer>. Always treat the official docs as the primary source of truth.

Round-robin meets the needs of the vast majority of projects, so in practice, if there are no special requirements, the default round-robin strategy is usually used. Furthermore, both Ribbon and Spring Cloud Load Balancer support custom Load Balancing strategies.

Personally, unless you specifically require a Ribbon-only feature or strategy, I recommend preferring Spring's official Spring Cloud Load Balancer.

Finally, let's explain why Ribbon is no longer recommended.

Spring Cloud 2020.0.0 removed all Netflix components except Eureka. Spring Cloud Hoxton.M2 was the first release to support Spring Cloud Load Balancer as the replacement for Netflix Ribbon.

When learning microservices early on, we all encountered Netflix's famous open-source components essential for building microservice systems—such as Feign, Ribbon, Zuul, Hystrix, and Eureka—and many companies still use them today. It is no exaggeration to say Netflix pioneered microservice adoption in the Java ecosystem.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/SpringCloudNetflix-edb76676.png)

**So why was Spring Cloud so eager to remove Netflix components?** Primarily because in 2018, Netflix announced that its core open-source projects—Hystrix, Ribbon, Zuul, Eureka, and others—were entering maintenance mode, receiving only bug fixes with no new feature development. Consequently, the Spring team had no choice but to move away from Netflix components.

**Spring Cloud Alibaba** is also a solid choice, especially for companies and individual developers in China.

## Production Rollout Recommendations

- **Check metrics before tuning algorithms**: Focus on each node's QPS, RT, P99, error rate, active connections, and CPU/memory rather than merely checking whether request counts look even.
- **Isolate slow nodes promptly**: Strategies like shortest response time or least active can help when a node slows down, but root remediation still requires health checks, circuit breaking, and traffic draining.
- **Avoid sticky-session dependencies**: If you must pin sessions via Cookie or IP Hash, assess user impact during auto-scaling and node failures. Storing sessions in shared storage like Redis is strongly preferred.
- **Ensure canary releases are instantly reversible**: Layer 7 Load Balancing is often used for canary routing by Header, Cookie, or user ID; canary rules must support immediate disablement/rollback.
- **Route cross-region traffic to nearby zones**: Nationwide or global applications typically combine DNS/GSLB to direct users to closer data centers or availability zones.

## References

- Deep Dive | eBay's Layer 4 Software Load Balancing Implementation: <https://mp.weixin.qq.com/s/bZMxLTECOK3mjdgiLbHj-g>
- HTTP Load Balancing (Official Nginx Documentation): <https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/>
- Demystifying Load Balancing - vivo Internet Tech: <https://www.cnblogs.com/vivotech/p/14859041.html>
