---
title: Why RPC When We Already Have HTTP? A Comparison Between HTTP and RPC
category: Computer Basics
description: An in-depth comparison of the essential differences between HTTP and RPC, analyzing technology selection for microservice communication. Covers serialization performance, connection reuse, gRPC, RESTful, service governance, and other core concepts.
head:
  - - meta
    - name: keywords
      content: HTTP,RPC,HTTP vs RPC differences,microservice communication,RPC protocol,TCP communication,serialization protocol,RESTful,gRPC,Dubbo,Protobuf,service invocation,remote procedure call,HTTP protocol,microservice technology selection
lang: en
sourceRef: zh-ref/cs-basics/network/http-vs-rpc.md
---

Hello, I'm Xiao G. During the second semester of my sophomore year, while watching free Heima tutorials, I first came across RPC and was quite bewildered at the time.

Can't we already make calls using HTTP interfaces?

Frontends call backends via HTTP, and server-to-server calls can also use HTTP. Writing a `/user/getById` endpoint, passing a user ID, and returning user information—doesn't that also accomplish a remote call?

Why invent another concept like RPC, adding to the learning curve? Isn't that just creating unnecessary trouble?

What makes it even more confusing is that many articles love to put HTTP and RPC side-by-side for comparison, as if they were two protocols at the exact same layer. After reading them, you might remember a few catchy phrases: **HTTP is resource-oriented, RPC is method-oriented; HTTP is external-facing, RPC is internal; RPC has better performance.**

These statements aren't completely wrong, but they are too broad and superficial.

When you work on real production projects, you will still run into questions: **Is HTTP good enough? Is using RPC over-engineering? If gRPC is clearly based on HTTP/2, why is it called RPC?**

This article dives deep into these questions to clarify them thoroughly.

## RPC Is Not a Specific Protocol

This is a common misconception, and before going further into the article, it is very necessary to address it first.

**HTTP is a protocol. RPC is not a single specific protocol; it is more like an invocation model.**

RPC stands for Remote Procedure Call. The problem it seeks to solve is very simple: **to let you invoke remote services as seamlessly as calling local methods.**

![RPC hides remote call details via local proxies](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-overview-088d1554.png)

For example, calling a user service in local code:

```java
User user = userService.getUser(1001);
```

If `userService` resides within the current process, this is just a regular local method call.

However, if the user service is deployed on a different machine, things become complicated. You need to send a network request, pass the method name and parameters, serialize data, handle timeouts, failures, and retries, and deserialize the received return result.

What an RPC framework aims to do is encapsulate all these complexities as much as possible. The caller's code still looks like:

```java
User user = userService.getUser(1001);
```

Underneath the hood, however, network communication, serialization, service addressing, and result returning have all been handled.

Therefore, the more accurate statement is not "which is stronger, HTTP or RPC?", but rather:

**HTTP is an application layer protocol, while RPC is a remote invocation model.**

![HTTP: Hypertext Transfer Protocol Overview](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

In terms of concrete implementations, there are many varieties of RPC. Dubbo is an RPC framework, Thrift is an RPC framework, and gRPC is an RPC framework. The official gRPC documentation also states very directly: a client application can directly call a method on a server application on a different machine as if it were a local object; the server defines methods that can be called remotely with their parameters and return types.

![Dubbo3 uses the Triple protocol supporting HTTP/1, HTTP/2, and HTTP/3 simultaneously](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/image-20220716111545343-d4b8a0b2.png)

This explains a point that often confuses people: **gRPC is RPC, but it is built on top of HTTP/2.**

It is not the opposite of HTTP; rather, it provides RPC invocations layered on top of HTTP/2.

On gRPC's GitHub repository, there is an article dedicated to introducing this: [gRPC over HTTP2 — Protocol Documentation](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md):

![gRPC over HTTP2 protocol on GitHub](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/grpc-over-http2-github-d0037df6.png)

## Having TCP Alone Is Not Enough

To understand the difference between HTTP and RPC, it is best to look one layer down first.

Many developers know that HTTP is based on TCP, and RPC is often based on TCP as well. Naturally, they might wonder: Can't I just use TCP directly?

In theory, yes; in practice, it is full of friction.

TCP is responsible for reliable transmission, delivering a continuous stream of bytes. It does not know or care where your business message begins or where it ends.

For instance, suppose the client sends two consecutive requests:

```text
getUser:1001
getOrder:8888
```

What the server receives might not be two neatly separated messages, but rather an unbroken byte stream. You must determine on your own: Where does the first message end? Where does the second message start? You also have to handle packet fragmentation, packet sticking (sticky packets), encoding, timeouts, error codes, request IDs, and more.

![Message boundaries in TCP vs UDP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-udp-message-boundary-ff2c1ad3.png)

This is precisely why application layer protocols must define message formats.

HTTP defines a standardized format: request line, headers, body, status codes, etc. MDN's definition of HTTP is also very clear: it is an application layer protocol originally designed for communication between web browsers and web servers, but can also be used for machine-to-machine communication and API access.

RPC frameworks also define their own message formats. However, instead of being designed around URLs and resources, they are designed around services, methods, arguments, and return values.

At the end of the day, both HTTP and RPC solve one fundamental problem:

**How two processes separated by a network clearly articulate a business invocation.**

It's just that their modeling approaches differ.

## HTTP Is More Like Accessing Resources; RPC Is More Like Calling Methods

A typical HTTP / REST interaction looks like this:

```http
GET /users/1001
POST /orders
PUT /orders/888/status
DELETE /comments/9527
```

Its mental model is the resource.

`/users/1001` is a user resource, and `GET` indicates reading it; `POST /orders` indicates creating an order; `PUT /orders/888/status` indicates updating the order status.

This approach is exceptionally well-suited for publicly exposed APIs.

Because it is universal, intuitive, and easy to debug. Browsers can access it, Postman can call it, curl can test it, and API gateways can easily process it. When you provide APIs to third parties, asking them to integrate according to HTTP documentation carries a very low barrier to entry.

In contrast, RPC code looks more like this:

```java
userService.getUser(1001);
orderService.createOrder(request);
inventoryService.deductStock(skuId, count);
```

Its mental model is method invocation.

The caller is concerned with: Which service do I want to call? Which method? What parameters should I pass? What object is returned?

![RPC Principle Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/rpc-principle-b5556f7a.png)

This aligns much more closely with daily Java backend coding habits. Especially in internal microservice calls, services collaborate around business methods—such as creating an order, deducting inventory, querying a balance, or verifying permissions. RPC expresses this invocation relationship much more directly.

Therefore, the biggest difference between HTTP and RPC is not that one works and the other doesn't.

Both can make successful calls.

The distinction lies in: **whether you model the remote interaction as a resource access or as a method call.**

## Why Is RPC More Prevalent Inside Enterprises?

HTTP can certainly be used for internal service-to-service calls.

Many companies use HTTP for all their internal services, and everything runs smoothly. Especially when service scale is modest and call chains are simple, HTTP is straightforward.

However, as the number of services grows, the advantages of RPC gradually become apparent.

**The first obvious shift: callers don't want to care where the peer machine is located.**

When writing business code, you ideally only want to think about "I want to call the user service", rather than how many instances the user service has, what their IP addresses are, which one just went offline, or which one has a higher weight.

This requires service discovery.

Dubbo's official documentation provides a classic description of service discovery: the Provider registers addresses with the registry, the Consumer reads and subscribes to the address list from the registry, and when addresses change, the registry notifies consumers. Dubbo supports popular registries such as Nacos, Consul, and ZooKeeper.

![Core roles in Dubbo architecture](/media/jg/ext/oss.javaguide.cn/asset/dubbo/dubbo-relation-f627b8d6.jpg)

These capabilities can of course also be built with HTTP. You can assemble your own stack using registries, gateways, load balancers, and client SDKs.

However, RPC frameworks typically integrate these features directly into their service invocation system.

The caller writes code against service interfaces, and underneath, service discovery, load balancing, connection management, and timeout control happen automatically. Business code doesn't have to piece together URLs everywhere.

**The second shift: interface contracts become far more critical.**

HTTP + JSON is flexible, but flexibility also means it can easily become loose.

A field name is changed, a type is altered, or an extra enum value is added, and the caller might only discover the failure at runtime. If API documentation isn't updated in time, joint debugging can be painful.

RPC frameworks usually constrain both parties with stronger contracts. Taking gRPC as an example, it commonly uses Protocol Buffers as its Interface Definition Language (IDL) and message exchange format. The official Protocol Buffers documentation explains that it is a language-neutral, platform-neutral, extensible mechanism for serializing structured data, allowing structures to be defined in `.proto` files and generating code across different languages.

The benefit this brings is that interface breaking changes are more readily caught and exposed during code generation and compilation.

Of course, a strong contract does not mean incidents will never happen.

How to maintain backward compatibility for fields, how older client versions should behave, whether new fields can be safely deleted, and whether enums can be altered still require careful engineering design. It's just that compared to "informal JSON field agreements", an IDL provides much firmer enforcement.

**The third shift: high-frequency internal calls care much more about machine processing efficiency.**

The beauty of HTTP + JSON is high human readability. However, when machines process it, it is not the most frugal approach. Field names, text formatting, and parsing overhead all incur extra costs.

RPC frameworks commonly use binary serialization, such as Protobuf or Thrift. The payload is smaller, and parsing is far better suited for machine execution.

However, we should not make absolute claims here.

Saying "RPC is always faster than HTTP" is inaccurate. HTTP/2, connection reuse, compression, different JSON parsing libraries, and different network environments will all influence the results. gRPC itself is based on HTTP/2; its advantages cannot simply be explained away by saying "it's not HTTP".

A more balanced summary would be:

**In high-frequency service-to-service communication scenarios, RPC frameworks typically tailor serialization, connection reuse, timeouts, retries, load balancing, and distributed tracing to be much closer to internal service invocation needs.**

That is the true reason why RPC is so common within enterprise architectures.

## The Value of RPC Extends Far Beyond "Slightly Faster Calls"

When discussing RPC, many people like to focus exclusively on performance.

Performance is certainly important, but in my view, the greater value of RPC lies in service governance.

Once an internal call actually goes to production, it involves far more than simply sending a request and receiving a response. You will quickly encounter a barrage of operational questions:

- What should the timeout be for this call? If it fails, should it retry? Could retrying cause duplicate deductions?
- If a downstream service goes down, should the upstream degrade gracefully?
- Which endpoint's error rate has spiked recently?
- How many services did a single user request traverse?

If all these questions depend on business code to handle, the codebase will quickly descend into chaos.

RPC frameworks are usually tightly coupled with governance capabilities, such as timeout control, load balancing, service discovery, circuit breaking and degradation, distributed tracing, and call statistics. gRPC's official overview also notes that it supports pluggable capabilities for load balancing, tracing, health checking, and authentication.

HTTP can accomplish these too.

Many companies fill these gaps using API Gateways, service meshes, HTTP client SDKs, interceptors, and distributed tracing components. When done well, there is nothing wrong with that.

Therefore, do not view RPC as something "inherently superior to HTTP". Rather, it organizes the common set of problems in internal service invocation along the path of "remote method invocation".

## Does That Mean HTTP Is Unsuited for Internal Calls?

Not at all. If the service scale is modest and the team is small, using HTTP is actually much more hassle-free.

For example, in a backend management system split into just a few services with modest call frequencies, writing a few REST endpoints with Spring Boot, paired with OpenAPI documentation, unified error codes, gateway authentication, and log tracing, is entirely sufficient.

Forcing RPC into such an environment may introduce unnecessary overhead without real benefit.

You would need to introduce a service registry, maintain IDL files, manage code generation, train the team, and resolve local debugging and gateway forwarding challenges. When you have only a few services and a simple call chain, these costs may not be justified.

HTTP is well-suited for these scenarios:

- Publicly exposed APIs, such as Web, Mobile App, and third-party partner integrations;
- Teams that prioritize universality and debugging convenience;
- Services with modest invocation frequencies;
- Environments lacking mature RPC infrastructure;
- Systems that already possess unified HTTP gateways, client SDKs, rate limiting, authentication, and monitoring ecosystems.

Here is a simple rule of thumb to share with everyone:

**If your system is already running stably on HTTP and does not have clear governance pain points, there is no need to switch to RPC just to look "more microservice-native".**

Technology selection is not about attaching buzzword labels.

Solving problems reliably is what truly matters.

## Why Does gRPC Often Confuse People?

The reason gRPC often creates confusion is that it straddles two distinct concepts at the same time.

**On one hand, it is an RPC framework.**

You define services and methods, generate client and server code, and invoke remote services just like calling local methods.

**On the other hand, it transmits over HTTP/2.**

![gRPC over HTTP2 protocol on GitHub](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/rpc/grpc-over-http2-github-d0037df6.png)

Therefore, you cannot simply view it as "the antithesis of HTTP".

More accurately: **gRPC uses HTTP/2 for transport, defaults to Protobuf as its IDL and serialization format, and organizes invocations using an RPC model.**

Note that while Protobuf is gRPC's most common default pairing, it is not the definition of gRPC itself. The gRPC protocol layer permits `application/grpc+proto`, `application/grpc+json`, or custom encodings.

Another easily overlooked point: in a normal gRPC response, the HTTP layer usually returns `:status: 200`, while the actual invocation result resides in HTTP/2 Trailers under `grpc-status` and `grpc-message`.

This introduces a very practical debugging difference.

When inspecting HTTP endpoints, we are used to checking the HTTP status code first. `200` generally indicates success, `404` means the resource doesn't exist, and `500` indicates a server exception.

However, when inspecting gRPC, you cannot look solely at the HTTP status code. An HTTP status of 200 does not mean this RPC business call succeeded; you must continue inspecting `grpc-status`.

This also introduces an engineering consideration: whether gateways, load balancers, proxies, and Service Meshes properly support HTTP/2 Trailers will directly impact gRPC invocations. If any component along the chain handles Trailers improperly, issues can be very subtle and hard to diagnose.

Thus, gRPC is not as simple as "HTTP/2 + Protobuf".

At the HTTP layer, it runs on HTTP/2.

In encoding, it defaults to Protobuf, though the protocol allows alternatives.

In invocation experience, it lets you call remote services like local methods.

In status reporting, it utilizes HTTP/2 Trailers to carry RPC execution results.

It is the combination of all these elements together that makes it prone to confusing newcomers.

## In Real Technology Selection, Don't Ask Which Is More "Advanced"

I recommend choosing based on the invocation relationship:

- For calls originating from browsers, mobile apps, or third-party systems, prioritize HTTP. The reason is simple: universality, low integration cost, and abundant debugging tools. The worst thing for external interfaces is having others struggle to connect. HTTP holds an insurmountable advantage here.
- For high-frequency internal microservice communication within a company, consider RPC. Especially when service counts are high, endpoint counts are large, call chains are complex, and requirements for timeouts, retries, registration/discovery, tracing, and load balancing are stringent, an RPC framework eliminates a tremendous amount of redundant plumbing.
- If your team already possesses mature HTTP infrastructure, there is no need to force RPC adoption. If unified gateways, service discovery, client SDKs, distributed tracing, and rate-limiting/circuit-breaking are already established and the team is accustomed to HTTP, continuing with HTTP is completely fine.

If you decide to adopt gRPC, think through these questions in advance:

- Browsers cannot consume standard gRPC directly like backend services do; they typically require gRPC-Web or a proxy layer;
- Whether gateways and load balancers support it; whether local debugging remains convenient;
- Whether the team embraces `.proto` files and code generation workflows;
- Whether binary messages will increase cognitive overhead during production troubleshooting.

gRPC is powerful, but it does not come with zero cost.

This point must be made clear upfront.

## Common Misconceptions

### Which Performs Better, HTTP or RPC?

You cannot make a blanket statement.

If you compare HTTP/1.1 + JSON against gRPC based on HTTP/2 + Protobuf in high-frequency internal invocation scenarios, the latter is usually much more resource-efficient.

However, change the implementation, and the outcome may differ.

Message size, serialization method, connection reuse, compression, framework implementation, and network conditions all influence the benchmark. To make a true comparison, you should run load tests with your own endpoints, data payloads, and deployment environments, rather than reciting "RPC is faster".

### Can RPC Only Run Over TCP?

No.

RPC is an invocation model, not a transport protocol. It can run over TCP, or over HTTP/2. gRPC is a prime example.

### Are REST and RPC Mutually Exclusive?

Not completely mutually exclusive.

REST leans toward resource modeling, whereas RPC leans toward method invocation. In real projects, they are frequently mixed: external APIs use REST, while internal services use RPC. This is completely standard practice.

### Now That We Have HTTP/2, Do We Still Need RPC?

HTTP/2 introduced frames, streams, multiplexing, header compression, and other capabilities at the HTTP layer, boosting concurrency utilization over a single TCP connection.

However, it does not automatically define service interfaces for you, does not automatically generate client code, and does not automatically solve service discovery, timeout retries, invocation governance, and version contracts.

There is another easily overlooked difference: invocation patterns.

Standard HTTP APIs are predominantly request-response (one question, one answer). In addition to the common Unary invocation, gRPC natively supports server streaming, client streaming, and bidirectional streaming. The official gRPC documentation explicitly lists these four invocation modes: Unary, Server streaming, Client streaming, and Bidirectional streaming.

For scenarios such as log subscriptions, long-task progress notifications, batch uploads, and real-time synchronization, streaming is much more natural. You could certainly use SSE, WebSocket, or roll your own wrapper on HTTP/2, but that effectively means you are re-implementing the capabilities that RPC frameworks have already built.

Therefore, while HTTP/2 is vital, it does not constitute the entirety of an RPC framework.

### Does gRPC Equal HTTP/2 + Protobuf?

No.

This phrase can only help beginners quickly form an initial mental model; it cannot serve as a rigorous definition.

A more accurate statement: gRPC carries RPC invocations on top of HTTP/2, defaults to Protobuf for describing interfaces and messages (while the protocol itself permits JSON or custom encodings), and defines a complete set of conventions including request paths, Content-Type, Length-Prefixed-Message, and `grpc-status` in Trailers.

Thus, gRPC is not merely a change of serialization format; it is a full RPC protocol and engineering convention suite.

## Conclusion

HTTP and RPC are not in a replacement relationship, nor is one fundamentally superior to the other.

HTTP can call services, and RPC can call services. The true distinction lies in whether you want to treat remote invocation as "resource access" or as "method invocation".

For external interfaces—such as Web, Mobile App, or third-party integrations—HTTP is generally more appropriate. It is universal, easy to debug, and low in integration friction; anyone can test it with Postman or curl.
For internal service-to-service communication—especially with numerous services, long call chains, high invocation frequency, and operational demands for discovery, timeouts, retries, load balancing, and tracing—RPC is considerably more convenient. It is not purely about raw speed; it packages and handles many thorny operational burdens of internal communication together.

So, stop simply memorizing "HTTP for external, RPC for internal".

That phrase helps you get started, but when building real projects, you must weigh your callers, team infrastructure, troubleshooting overhead, performance needs, and ongoing maintenance costs.

If your system is modest in scale and runs stably on HTTP, don't force RPC adoption just to "look more microservice-like".

If internal calls grow increasingly intricate and you find yourself piling on more HTTP SDKs, custom gateways, monitoring glue, and retry logic, then it is time to seriously consider RPC.

In short: **HTTP is not that weak, and RPC is not that magical. Which one to choose primarily depends on which solves your current problem at a lower cost.**
