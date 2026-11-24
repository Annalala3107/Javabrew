---
title: "Service Degradation and Circuit Breaker Explained: Fallback, Circuit Breaker State Machine, and Choosing Between Sentinel / Hystrix / Resilience4j"
description: "In-depth guide to service degradation and circuit breaking covering Fallback handling, degradation switches, Closed/Open/Half-Open circuit breaker state machines, cascading avalanche effects, isolation strategies, and a comparison of Sentinel, Hystrix, and Resilience4j."
category: High Availability
icon: "mdi:electric-switch"
tag:
  - Service Degradation
  - Circuit Breaker
head:
  - - meta
    - name: keywords
      content: Service Degradation,Circuit Breaker,Circuit Breaking Mechanism,Fallback,Circuit Breaker State Machine,Sentinel,Hystrix,Resilience4j,Rate Limiting vs Degradation vs Circuit Breaker,Avalanche Effect,Thread Pool Isolation,Semaphore Isolation,High Availability Interview Questions
lang: en
sourceRef: zh-ref/high-availability/fallback-and-circuit-breaker.md
---

In a microservices architecture, a single request often traverses a call chain spanning several services. If one service along that chain runs into trouble—such as slow responses, timeouts, or a complete crash—it can quickly drag down upstream resources as well, eventually escalating into an avalanche across the entire call chain. Service degradation and circuit breaking serve as two defensive lines against these problems: degradation proactively sheds non-critical features under heavy load to protect the core path, while circuit breaking cuts off calls in time to stop the bleeding when a downstream service fails persistently.

This article explains the core principles of service degradation and circuit breaking, covering Fallback strategies, degradation switches, the circuit breaker state machine, isolation strategies, and how to choose among Sentinel, Hystrix, and Resilience4j.

## What Is Service Degradation?

Service degradation, put simply, means: **when the system can barely hold up, sacrifice less important features first and reserve resources for core call paths.**

For example, during major e-commerce promotions, non-core features such as recommendation modules, ad slots, and campaign decorative banners can be turned off first, while core flows like order placement, payment, and inventory deduction must be preserved at all costs. Users can tolerate seeing fewer recommendations, whereas failing to place an order is a real production incident.

Therefore, degradation is a pre-planned contingency mechanism—not something where you hastily return an arbitrary default value after the system crashes. When to trigger, which features to disable, what responses to return, and how to recover must all be designed in advance.

### Under What Circumstances Is Degradation Typically Triggered?

Many people assume degradation only happens when "server load is too high," but that is far from the only trigger.

Common trigger scenarios include:

- Excessive overall system pressure, such as surging CPU, saturated thread pools, or significantly degraded API response times;
- Abnormalities in a downstream service, such as sudden spikes in timeouts from the inventory, pricing, or recommendation service;
- Failures affecting a specific data center, availability zone, or network link;
- Pre-planned disabling of selected non-core features ahead of major promotions, flash sales, or high-traffic campaigns;
- Ad-hoc operational needs to restrict access to specific feature entry points.

Regardless of the trigger, the core goal of degradation remains identical: **protect the core, shed the non-core.**

### How Fine-Grained Can Degradation Be?

Degradation granularity can be coarse or fine.

At a coarse level, you can degrade an entire service—for example, when the recommendation service fails, all recommendation queries immediately return an empty list.

At a finer level, you can degrade a single widget on a page—for instance, keeping the product detail page normal while hiding the "You May Also Like" section.

Even finer, you can degrade a specific API endpoint, a feature toggle, a particular user segment, or a single business scenario.

In real projects, features are usually assigned priority tiers. For example:

- Recommendations, ads, leaderboards: lower priority, disabled first when trouble hits;
- Product details, shopping cart: higher priority, preserved as much as possible;
- Order placement, payment, inventory: core flows, degraded only as a last resort.

Labels like `L0–L4` or `Tier 1–10` are merely internal team conventions rather than industry-wide standards. What matters is not the naming scheme, but clearly defining beforehand: **which features can be sacrificed and which features must be protected.**

### What Are the Common Degradation Approaches?

#### 1. Deferred Processing

Some operations do not need to finish synchronously and can be placed into a message queue (MQ) to be processed later.

Examples include awarding loyalty points after a comment, recording user analytics, and generating reports. Even if such tasks complete a few seconds late, users rarely notice. The main flow simply returns success immediately, leaving the rest to asynchronous workers.

There is a pitfall here, though: MQs can also build up a backlog. If consumers are already falling behind while producers keep retrying aggressively, the system gets hammered even harder. Retries should therefore include backoff with random jitter, and rate limiting should be applied when needed.

#### 2. Page Fragment Degradation

This is the most intuitive approach: keep the main page intact while turning off non-core sections.

On a product detail page, for instance, the title, price, and stock availability must stay visible, whereas the recommendations block, ad banners, and promotional widgets can be hidden.

This is simple and effective, provided the feature toggles and fallback logic were built ahead of time. Trying to modify code and deploy once an incident is already unfolding is almost always too late.

#### 3. API Fallback Degradation

Some sections on a page load asynchronously, such as delivery ETA, price estimation, or recommendation feeds. If those endpoints time out, they can immediately return default or cached values.

For example, when the delivery ETA service fails, display "Estimated delivery in 2–3 days"; when the recommendation API fails, return cached popular items.

One critical detail here: fallback data should be prepared in advance. Never wait until the API is already down to query the database or rebuild the cache on the fly—doing so only amplifies the outage.

#### 4. Page Redirect Degradation

If a full page is too heavy, route users to a lightweight or static version of the page.

For example, during overwhelming traffic to a promotional campaign page, temporarily switch traffic to a static campaign page; during system maintenance, redirect to a maintenance notice page.

While conceptually simple, static pages, routing rules, and toggle switches must be prepared ahead of time. Improvising this during a live outage is practically impossible.

#### 5. Write Degradation

Write degradation fits scenarios where data "can be persisted to the database a little later."

For operations like issuing loyalty points, sending notifications, or recording inventory ledger entries, writes can first go into Redis, a local transactional message table, or a local persistent queue, and then be synced asynchronously to the database via MQ or scheduled jobs.

However, write degradation carries an obvious trade-off: you must handle eventual consistency—including preventing message loss, handling duplicate writes, compensating failed syncs, and performing reconciliation.

Above all, **pure in-memory queues are unsuitable for critical data.** As soon as a node restarts, that data is gone.

#### 6. Read Degradation

Read degradation typically means "read only from cache and stop calling backend services."

Read-heavy, write-light data such as product details, store profiles, and trending rankings are ideal for cache fallback. When backend services fail, serving slightly stale cached data ensures the page still loads.

If the cache misses as well, do not force a call downstream. Return a default value, an empty result, or a degraded page directly—otherwise a single user request can drag down a whole chain of backend services.

### How Are Degradation Switches Implemented?

Degradation switches must turn on and off rapidly—never requiring code changes, redeployments, and restarts every time.

Common approaches include:

| **Approach**                | **Characteristics**                               | **Best-Fit Scenario**                             |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Config file + restart       | Simple, but slow to take effect                   | Non-urgent, rarely changed switches               |
| Database toggle table       | Supports audit trails, but modest real-time speed | Need to track who changed what and when           |
| Configuration center        | Great real-time updates; standard in production   | Core degradation switches, dynamic toggles        |
| Redis switch                | Lightweight implementation, fast integration      | Simple business flows, temporary controls         |

In production environments, configuration centers such as Nacos or Apollo are strongly preferred for degradation switches. They are far more reliable than "editing config files and restarting" and much better suited to emergencies.

Even so, do not mistake "real-time push" for "every machine takes effect instantaneously at the exact same moment." With Nacos 2.x, for instance, gRPC persistent connections push config updates to clients, yet actual propagation still depends on client count, network conditions, server load, and local cache refresh timing.

Therefore, design degradation switches assuming one baseline reality: **brief inconsistency across different machines may occur.**

### What Should You Watch Out for When Using Nacos for Degradation Switches?

If your project uses Nacos, keep several gotchas in mind beforehand.

First, Nacos 2.x and 1.x differ in transport mechanisms. Nacos 2.x adds gRPC communication, meaning beyond the main port `8848`, it also uses ports such as `9848` and `9849`. The official documentation explicitly notes that `9848` handles client-to-server gRPC requests, while `9849` handles server-to-server cluster communication.

Second, pay attention to version compatibility during upgrades. A Nacos 2.0 server supports 1.x clients, whereas a 2.x client cannot connect to a 1.x server because 2.x clients rely on gRPC.

Third, if Docker, firewalls, security groups, Nginx, or VIPs sit in between, configure port forwarding properly in advance. In particular, if port `9848` is blocked, clients may fail to connect or fail to pull configuration updates. Official docs also note that VIP/Nginx setups require TCP forwarding rather than plain HTTP proxying.

Fourth, during network partitions or persistent connection disruptions, clients may have no choice but to continue using stale local configs. Runbooks should clearly define how the system behaves if a degradation switch fails to reach every node immediately.

This is also why degradation must never rely on a single switch alone. Critical paths should combine timeouts, circuit breaking, rate limiting, and cache fallbacks together.

### How Is Service Degradation Categorized?

Based on whether it is automated, degradation falls into two categories:

- **Automatic switch degradation** (triggered by rule engines, circuit breakers, rate limiters, or monitoring alerts)
- **Manual switch degradation** (triggered by on-call engineers or operations playbooks via configuration consoles, e.g., flash sales or major e-commerce events)

Automatic degradation includes several common trigger types:

- **Timeout degradation**: Triggered when RT stays above a threshold (baselines like P99/P999 monitoring help choose thresholds, though frameworks actually evaluate per-request RT aggregated over a statistical window rather than comparing P99 directly), returning a default value. Be sure to enforce idempotency, or a retry storm can become worse than the original fault.
- **Failure-rate degradation**: Triggered when the exception rate exceeds a threshold (e.g., 50%), returning fallback data. Fallback data must be pre-warmed into the cache beforehand.
- **Fault degradation**: Triggered on hard downstream errors such as HTTP 5xx, RPC exceptions, or DNS resolution failures, returning cached data. On a cache miss, return a default value immediately instead of continuing downstream.
- **Rate-limit degradation**: Triggered when QPS exceeds a threshold, returning a queuing page, out-of-stock notice, or error page. Queuing pages need re-entry protection (idempotency tokens); otherwise users furiously refreshing defeat the purpose.

> Retry storm: Just as a service starts recovering, all clients retry simultaneously and knock it down again. Mitigations: exponential backoff with Jitter, token-bucket rate limiting, and batched/grouped recovery.

## How Do Large-Scale Distributed Systems Degrade?

Large-scale distributed systems often comprise hundreds or thousands of services. Before major promotional events, teams typically perform batch degradation based on business criticality and inter-service dependencies.

### Degradation Platform Capabilities

Large tech companies usually maintain a unified degradation platform with the following capabilities:

- **Tiered management**: Services are categorized by priority (`Tier 1–10` or `L0–L4`, depending on team convention); core business paths require formal review, and dependency graphs must be mapped out beforehand.
- **Batch degradation**: Execute in batches by tier or group with orchestrated ordering, versioned pushes, and one-click rollback. Run canary validation, dry-run previews, and approvals before acting—never shut everything off blindly and accidentally sever a core flow. Strict 2PC atomicity is generally unnecessary.
- **Dynamic switches**: Real-time push via configuration centers (Nacos 2.x gRPC or Apollo) without restarts.
- **Effect verification**: Canary + monitoring, comparing metrics to verify degradation took effect without collateral damage.
- **One-click rollback**: Versioned configs with change audit logs to revert rapidly if anything goes wrong.

### Designing a Degradation Playbook

1. **Business tiering**: First separate services that must never be touched (e.g., order placement, payment) from those that can be disabled (e.g., recommendations, comments) and assign priorities.
2. **Dependency analysis**: Map the call graph to identify critical paths and single-point dependencies—knowing which failure would trigger widespread fallout.
3. **Degradation strategy**: Design a degradation plan for every non-core service, including how failure paths behave.
4. **Drill verification**: Run degradation drills regularly—an untested paper plan inspires zero confidence.

> During a network partition, do not get bogged down in abstract theory; just answer these concrete questions: should each service read local cache or reject requests during the partition, should cross-zone writes pause, how is the core flow preserved, and should it switch to read-only mode.
>
> **Detailed reading:** [CAP & BASE Theorem Explained](https://javaguide.cn/distributed-system/protocol/cap-and-base-theorem.html).

## What Is Fallback?

**Fallback** can be understood as: **a safety-net / backup result.**

Under normal conditions, a request invokes real business logic—such as fetching recommendations, product details, or user profiles. If that call fails, or gets intercepted by rate-limiting or circuit-breaking rules, the system cannot simply dump an unhandled exception on the user; instead, it returns a pre-prepared response.

For instance, if the recommendation service is down, return an empty list; if the product detail API times out, return stale data from cache; if the campaign page API fails, fall back to a static page.

That is the role of Fallback: **prevent one failure from dragging down the entire call chain.**

Keep in mind, though, that Fallback does not "fix the underlying problem"—it merely keeps the system minimally usable under abnormal conditions. What users see may be incomplete or slightly out of date, yet at least the page does not blow up outright.

### What Is the Difference Between `blockHandler` and `fallback` in Sentinel?

In Sentinel, `blockHandler` and `fallback` are easily confused. Both look like they provide "fallback behavior," yet they are triggered by different causes.

In short:

| **Scenario**                                                              | **Method Invoked** | **Typical Exception** |
| ------------------------------------------------------------------------- | ------------------ | --------------------- |
| Intercepted by Sentinel rules (rate limiting, circuit breaking, sys guard) | `blockHandler`     | `BlockException`      |
| Business code throws an exception (NPE, remote call failure, runtime err) | `fallback`         | `Throwable`           |

Let's walk through an example.

If an API is rate-limited, Sentinel decides the request cannot proceed further and routes it to `blockHandler`.

If the request enters the business method, calls the inventory service, and fails with a `RuntimeException`, execution routes to `fallback`.

If both `blockHandler` and `fallback` are configured, exceptions triggered by Sentinel rules enter `blockHandler` first; business exceptions go to `fallback`. Do not mix these up, or troubleshooting production issues will become needlessly confusing.

![Sentinel: Difference Between blockHandler and Fallback](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-blockHandler-vs-Fal-62f17196.png)

### Common Fallback Implementations

Typical Fallback patterns include:

- **Default value return**: Directly return a static default object. Return `[]` if recommendations fail, or a default config if config lookup fails. Ensure the default payload structure matches the normal return schema—never return `null`, or upstream callers may throw `NullPointerException`.
- **Cache fallback**: Read the latest successful result from local cache or Redis. Well suited for read scenarios like product details or user info. Since caches may expire, indicate data freshness when possible; on cache penetration, never brute-force downstream—fall back to a default value.
- **Degraded page**: Return static HTML or a simplified page, commonly used for campaign or marketing modules. Static assets also need redundancy—plan ahead for CDN origin-fetch failures.
- **Write degradation**: Write first to Redis or a local message table and sync to DB asynchronously. Common in high-concurrency writes like flash-sale deductions or points issuance. The trade-off is maintaining eventual consistency (reconciliation/compensation); pure in-memory queues will lose data on node crashes.

### Common Fallback Pitfalls

Fallback logic itself can fail—and those failures are often harder to detect than ordinary bugs. Common pitfalls include:

- **Hiding remote calls inside Fallback**: Calling Redis, a DB, or another service inside fallback logic when those dependencies are also degraded makes the avalanche worse. Prefer Caffeine, a local `Map`, or static defaults; if Redis is genuinely required, isolate it with a dedicated connection pool, strict timeout, and separate circuit breaker—and return defaults on a miss without chaining deeper.
- **Returning `null` from Fallback**: Callers expecting an object immediately hit `NullPointerException`, triggering a brand-new exception chain. Keep the return structure identical to normal responses using an Empty Object instead of `null`.
- **Overly complex Fallback logic**: The fallback itself becomes slow and blocks caller threads. Fallback logic must be ultra-minimal—complex business logic is forbidden.
- **Sharing a single cache across multiple Fallbacks**: If that cache fills up or saturates, every fallback fails together. Isolate caches by business domain and give core paths dedicated cache instances.

Put bluntly: Fallback is your last line of defense—it must be faster and simpler than the normal call. If your fallback hides a synchronous remote call with no timeout guard, it is not a safety net; it is a landmine.

## What Is Circuit Breaking?

**Circuit Breaking** sounds slightly abstract, yet it simply means cutting losses promptly. It is a link-protection mechanism designed to counter cascading avalanche effects in microservices—much like an electrical fuse in a circuit.

In microservices, one service frequently calls another. Normally, requests flow smoothly down the chain:

```text
Service A -> Service B -> Service C
```

If Service C suddenly slows down, Service B's threads calling C get stuck waiting. Once B's thread pool fills up, A's calls to B begin timing out as well. Further upstream, callers of A get bogged down too.

This leads to a classic failure pattern: **only Service C actually broke, yet the entire call chain collapsed.**

A **Circuit Breaker** exists to solve this exact problem.

The idea is straightforward: once a downstream dependency is clearly unhealthy, stop hammering it and return a Fallback immediately. After a cool-down period, let a small trickle of probe requests through. Once the downstream service recovers, gradually resume normal traffic.

Just like a fuse in an electrical circuit: disconnect first when current surges abnormally so the rest of the equipment does not burn out too.

### How Does an Avalanche Happen?

Most production avalanches do not happen instantaneously—they propagate layer by layer.

Take the same call chain:

```text
Service A -> Service B -> Service C
```

At first, only Service C slows down—say, from 50ms to 3 seconds.

Next, Service B's threads calling C begin queuing up. Every thread in the pool is stuck waiting on C, so incoming requests stack up in the queue.

Soon after, Service A's calls to B start timing out. A's own threads get pinned down too, and API latency climbs steadily.

If clients, RPC frameworks, or business code keep retrying on top of this, total request volume multiplies further. Ultimately, instead of one slow service, an entire chain of services grinds down and becomes unavailable.

That is the **cascading avalanche effect**.

![Cascading Avalanche Effect Propagation](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-avalanche-effect-sp-daf4f810.png)

### A More Realistic Example

Suppose we have an ad-click processing chain:

```text
Ad Click Service A -> Channel Filtering Service B -> Redis
```

Normally, A handles 30,000–40,000 clicks per minute. One day, traffic jumps above 80,000 per minute.

The trouble begins at B. B needs to read a filtering dataset from Redis, except the value has grown huge and a single `get` takes over 3 seconds.

Consequently, A's calls to B start timing out heavily.

If an RPC interface like Dubbo also has retry-on-failure enabled—say, 1 initial attempt plus 2 retries—then 1 logical call can turn into 3 calls. (Whether this happens in practice depends on the Dubbo version, interface configuration, and call semantics; write APIs in particular should generally avoid default retries or exercise extreme caution.)

With retries surging, B receives even more requests, its thread pool saturates even faster, and it starts rejecting traffic. Meanwhile A keeps receiving timeouts and exceptions, exhausting connections, file descriptors, and thread resources.

In the end, what started purely as slow Redis reads takes down A, B, and upstream callers alike.

In incidents like this, retries act as an "accelerant." Without rate limiting and circuit breaking, retries amplify a localized slowdown into a system-wide outage.

So production systems are not forbidden from retrying—rather, retries must stay strictly bounded: enforce timeouts, max retry counts, and backoff policies, and pair them with rate limiting and circuit breaking.

### What States Does a Circuit Breaker Have?

A circuit breaker has three states:

| State                   | Description                          | Behavior                                              | State Transition Condition                                                                                                            |
| ----------------------- | ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Closed**              | Normal state; requests pass through  | Records failure rate / slow-call ratio                | Failure rate or slow-call ratio > threshold → `Open`                                                                                  |
| **Open**                | Tripped state; rejects requests      | Returns Fallback fast; skips calling downstream       | After cool-down duration (naming varies: `sleepWindow` in Hystrix, `waitDurationInOpenState` in Resilience4j; typically ~10s) → `Half-Open` |
| **Half-Open**           | Probes whether service has recovered | Permits a small number of probe requests (framework-dependent) | Probe requests satisfy success criteria → `Closed`; failure → `Open`                                                                  |

![Circuit Breaker State Machine](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-fuse-state-machine-48c9741c.png)

### Half-Open and Warm Up Are Not the Same Thing

These two concepts are easy to confuse.

`Half-Open` answers: **Has the downstream service recovered yet?**

`Warm Up` answers: **Once recovered, should traffic be ramped up gradually?**

In other words, `Half-Open` is about "probing," whereas `Warm Up` is about "gradual traffic ramp-up."

Consider a freshly restarted service: its caches are still cold, JIT compilation has not stabilized, and database connection pools are still warming up. Even if a few probe requests succeed, the service cannot immediately absorb 100% of production traffic.

A safer progression is:

1. Let `Half-Open` send a small number of probe requests first;
2. Once probes succeed, do not unleash full traffic immediately;
3. Use `Warm Up`, rate limiting, or staged ramp-up so the service recovers smoothly.

In Sentinel, `Warm Up` belongs to flow-control cold-start strategies, with a default `coldFactor` of `3`—meaning QPS starts around `threshold / 3` and ramps smoothly up to the configured threshold.

During recovery, never rely solely on average latency. Averages easily hide a small tail of extremely slow requests. Monitor P99, P999, active thread counts, database connection pool active counts, and error rates together.

### What Circuit Breaking Strategies Does Sentinel Support?

Since Sentinel 1.8.0, circuit breaking and degradation center on three strategies: slow-call ratio, exception ratio, and exception count. The official `DegradeRule` documentation details fields such as `count`, `timeWindow`, `minRequestAmount`, `statIntervalMs`, and `slowRatioThreshold`.

**1. Slow-Call Ratio**

This strategy tracks the proportion of slow requests.

Suppose you configure max RT as 500ms—any request exceeding 500ms counts as a slow call. Sentinel then calculates the slow-call ratio within a statistical window.

If total requests in the window meet the minimum request count and the slow-call ratio exceeds the threshold, the circuit breaker trips.

This handles cases where "the downstream isn't throwing errors yet, it's just getting slower and slower."

**2. Exception Ratio**

This strategy tracks the proportion of failed requests.

For example, if requests over a recent interval meet the minimum count and the exception ratio exceeds 50%, the circuit breaker trips.

This fits cases where downstream errors surge—such as RPC exceptions, runtime exceptions, or HTTP 5xx responses.

**3. Exception Count**

This strategy tracks the raw number of exceptions.

For example, if exceptions exceed 50 within 1 minute, the circuit breaker trips.

It is more intuitive than exception ratio, though sensitive to traffic volume. High-QPS and low-QPS endpoints cannot share the exact same threshold.

### Can P99 Be Used Directly as a Circuit Breaker Condition?

That is not an accurate way to think about it.

P99 is a monitoring metric—great for observing overall API health and choosing sensible circuit-breaking thresholds.

However, Sentinel does not evaluate P99 directly against a threshold to trip. Its mechanism works more like this:

1. Check each individual request to determine whether it is a slow call or an exception;
2. Aggregate the ratio or count across a statistical window;
3. Once the request count reaches the minimum threshold, evaluate whether to trip the circuit breaker.

So P99 answers the question: **Is my configured threshold reasonable?**

If an API's baseline P99 is 120ms and you set the slow-call threshold to 100ms, you will likely trip falsely.

If baseline P99 is 120ms and suddenly spikes to 800ms, that signals real downstream trouble, and your circuit-breaking threshold should be calibrated against that baseline.

Low-QPS endpoints require extra care. If the statistical window is too short and `minRequestAmount` is too small, one or two stray slow requests can trip the breaker unnecessarily. A safer approach is lengthening the statistical window or raising the minimum request count.

## What Is the Difference Between Service Degradation and Circuit Breaking?

Degradation and circuit breaking are often mentioned together, yet they solve different problems.

**Service degradation** focuses on: once the system runs into trouble, how can it continue serving users?

For example, if the recommendation service goes down, don't let the product detail page render blank—hide the recommendation section; if a campaign API times out, serve a static campaign page; if user tags fail to load, treat the user as a regular user temporarily.

In other words, degradation is a business-level trade-off: which features can be sacrificed first, and which core paths must survive.

**Circuit breaking** focuses on: once a downstream dependency is clearly unhealthy, should we keep calling it?

For instance, when the order service calls the inventory service and inventory starts timing out heavily, continuing to hammer inventory only slows it down more while starving the order service's own thread pool. Once the circuit breaker detects downstream failure, it blocks requests immediately, returns a fallback fast, and probes again with a few requests after a cool-down period.

One sentence to remember it: **Degradation is "how to keep serving after something breaks," while circuit breaking is "whether to stop calling a failing dependency."**

### What Do Rate Limiting, Circuit Breaking, and Degradation Each Govern?

These three concepts are also easy to blur together.

**Rate limiting governs ingress.** It answers: "Too many requests are coming in—should we let them all through?" During a flash sale with 100,000 requests arriving simultaneously when the system can handle 10,000, excess traffic must be turned away at the door.

**Circuit breaking governs downstream calls.** It answers: "The downstream dependency is already slow or down—should we keep calling it?" Continuing to call prevents the downstream from recovering and drags your own service down with it.

**Degradation governs the outcome.** It answers: "When a request gets rate-limited, a downstream circuit trips, or business code throws an error, what do we return to the user?" You can return defaults, cached data, static pages, or disable a non-core feature.

In plainer terms:

- **Rate Limiting**: Don't let too many requests in
- **Circuit Breaking**: Stop hitting an already unhealthy downstream dependency
- **Service Degradation**: Serve users in an alternative/reduced way when something goes wrong
- **Fallback**: The actual safety-net result returned to the caller

Fallback is not an independent governance strategy on its own—it is the "fallback action" executed once rate limiting, circuit breaking, or degradation triggers.

> Analogy: Think of the system as a shopping mall. Rate limiting controls how many shoppers enter the mall—when it gets too crowded, people queue at the door; degradation temporarily closes the food court and cinema while keeping core areas like the supermarket and pharmacy open; circuit breaking notices a supplier has broken down, stops placing orders with that supplier for now, and tests a couple of small orders later to see if they have recovered.

### How Do They Coordinate Within a Single Request?

Along a real request path, rate limiting, circuit breaking, and degradation usually operate in layers:

1. **Gateway / Ingress rate limiting**: As soon as a request arrives, check whether ingress traffic exceeds overall system capacity. If exceeded, immediately return "System busy, please try again later" instead of forwarding traffic downstream.
2. **In-service rate limiting**: Some requests pass the gateway, yet a particular service's own thread pool, connection pool, or database is nearing saturation—the service can also enforce local rate limiting to protect its critical resources.
3. **Circuit breaker check**: Before calling a downstream dependency, check whether that dependency's circuit breaker is tripped (`Open`). If tripped, skip the remote call and execute fallback logic immediately.
4. **Business execution & Fallback**: When a downstream call fails, business code throws an exception, or a governance rule blocks the request, return the pre-prepared fallback result—such as an empty list, cached data, a default object, or a static page.

One-line summary: **Rate limiting guards the entrance, circuit breaking cuts off unhealthy downstream dependencies, degradation preserves the core, and Fallback supplies the safety-net response.**

![Request Protection Flow](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-request-protection--ba6e9c6d.png)

### Minimal Annotation-Based Sentinel Example

Focus on understanding the division of labor between `blockHandler` and `fallback` in the example below:

```java
@RestController
public class OrderController {

    @SentinelResource(
        value = "createOrder",
        blockHandler = "createOrderBlockHandler",
        fallback = "createOrderFallback",
        exceptionsToIgnore = {IllegalArgumentException.class}
    )
    @PostMapping("/order")
    public OrderVO createOrder(@RequestBody OrderDTO dto) {
        return orderService.create(dto);
    }

    // Invoked when Sentinel rules trigger (rate limiting, circuit breaking, system protection)
    public OrderVO createOrderBlockHandler(OrderDTO dto, BlockException ex) {
        return OrderVO.degraded("Too many order requests right now, please retry later");
    }

    // Invoked on business exceptions
    // Method signature must match the original method, optionally adding a Throwable parameter
    public OrderVO createOrderFallback(OrderDTO dto, Throwable t) {
        return OrderVO.failure("Order placement failed, please try again later");
    }
}
```

Several points need to be crystal clear:

`blockHandler` handles Sentinel interception exceptions—`BlockException` thrown when rules such as rate limiting, circuit breaking, or system protection trigger. `fallback` handles exceptions thrown by business code, such as remote call failures or runtime exceptions. Its method signature must match the original method (optionally with an extra `Throwable` parameter).

When both `blockHandler` and `fallback` are configured, exceptions triggered by Sentinel rules enter ONLY `blockHandler`, never `fallback`. Mixing this up is a very common bug.

Also, not every business exception should trigger a fallback. Invalid parameters, insufficient permissions, or out-of-stock errors should be communicated clearly back to the caller rather than masked behind a generic "System busy" fallback. Exclude such exceptions using `exceptionsToIgnore`.

## What Off-the-Shelf Solutions Exist?

In the Spring Cloud ecosystem, the main frameworks for circuit breaking, rate limiting, and degradation are:

- **Hystrix 1.5.18**: A veteran library used across many legacy Spring Cloud Netflix projects. However, it has entered maintenance mode with no active development and is generally not recommended for new projects.
- **Sentinel 1.8.x**: Alibaba's open-source traffic governance component, widely used in Spring Cloud Alibaba projects. Beyond circuit breaking, it provides rate limiting, traffic shaping, hot-parameter rate limiting, and system adaptive protection.
- **Resilience4j 2.x**: A lightweight fault-tolerance library split into granular modules covering circuit breaking, rate limiting, retries, and bulkhead isolation. Frequently chosen for Spring Boot 3 / Java 17+ projects.
- **Spring Retry**: Primarily solves retries rather than acting as a full circuit-breaking/degradation suite. Usually paired with Spring Cloud CircuitBreaker or service timeout policies.

Avoid hardcoding version numbers as permanent truths. Both Sentinel and Resilience4j continue to evolve; version notes here reflect releases available at the time of writing—always check each project's GitHub Releases page and compatibility matrix.

### How Do You Choose Among Hystrix, Sentinel, and Resilience4j?

Instead of memorizing feature comparison charts right away, assess your project context first.

**Legacy Hystrix projects: If it runs stably, leave it alone for now, but plan a migration.**

Hystrix was huge in its day—popularizing thread-pool isolation, circuit breaking, and Fallback patterns. However, Netflix officially announced that Hystrix is in maintenance mode and no longer actively developed.

If an existing legacy system already runs Hystrix stably, there is no need to tear everything out just to chase something newer. Keep it running while scheduling migration into your upcoming Spring Boot / Spring Cloud upgrade roadmap. For new projects, though, there is no reason to start with Hystrix—compatibility pain will only grow as you upgrade Java, Spring Boot, and Spring Cloud.

**Spring Cloud Alibaba / Dubbo projects: Look at Sentinel first.**

Sentinel's strength is not just "it can break circuits," but its comprehensive traffic-governance suite: rate limiting, circuit breaking and degradation, hot-parameter throttling, system adaptive protection, and a console for real-time monitoring and rule management. Integration costs are usually much lower in Spring Cloud Alibaba and Dubbo stacks.

Just avoid treating Sentinel Dashboard as a production configuration center. The Dashboard is great for inspecting rules and live metrics, whereas production rule persistence typically belongs in Nacos, Apollo, or similar data sources—otherwise rules may vanish after restarts.

**New Spring Boot 3 / Java 17+ projects: Look at Resilience4j first.**

Resilience4j stands out for being lightweight and modular. Need circuit breaking? Pull in `CircuitBreaker`. Need rate limiting? Pull in `RateLimiter`. Need retries? Pull in `Retry`. Need isolation? Pull in `Bulkhead`.

It blends cleanly with functional programming, Reactor, and Spring Boot 3. If your project runs Spring Boot 3 on Java 17+ and does not depend on the Spring Cloud Alibaba ecosystem, Resilience4j is usually the cleaner fit.

### Quick Comparison

| Dimension                   | Sentinel                                           | Hystrix                              | Resilience4j                              |
| --------------------------- | -------------------------------------------------- | ------------------------------------ | ----------------------------------------- |
| **Maintenance Status**      | Actively maintained                                | Maintenance mode                     | Actively maintained                       |
| **Primary Positioning**     | Traffic governance component                       | Circuit breaker & degradation lib    | Lightweight fault-tolerance library       |
| **Circuit Breaking**        | Slow-call ratio, exception ratio, exception count  | Primarily exception ratio            | Exception ratio, slow calls, exception count, etc. |
| **Rate Limiting**           | Strong (QPS, concurrent threads, hot params, etc.) | Weak                                 | Provides `RateLimiter` module             |
| **Isolation**               | Concurrent thread count control                    | Thread-pool / Semaphore isolation    | `SemaphoreBulkhead` / `ThreadPoolBulkhead` |
| **Traffic Shaping**         | Supports Warm Up, rate-limited queuing             | Not prominent                        | Not prominent                             |
| **System Adaptive Guard**   | Supported                                          | Not supported                        | Not supported                             |
| **Dashboard / Console**     | Sentinel Dashboard                                 | Hystrix Dashboard (outdated)         | Typically wired into external monitoring  |
| **Best-Fit Scenarios**      | Spring Cloud Alibaba, Dubbo, domestic Java stacks  | Legacy existing projects             | Spring Boot 3, Java 17+, lightweight apps |

As a beginner, remember three takeaways: leave stable legacy Hystrix projects alone while planning migration; pick Sentinel first for Spring Cloud Alibaba / Dubbo stacks; pick Resilience4j first for new Spring Boot 3 / Java 17+ projects.

### How Do Isolation Strategies Work?

Circuit breaking only means "stop calling a broken downstream"; isolation solves "don't let one dependency consume all shared resources."

**Thread-Pool Isolation**: Dedicate a separate thread pool to a specific downstream dependency. For example, when the order service calls the inventory service, route inventory calls through their own thread pool. Even if inventory slows down, at worst only that dedicated pool saturates without taking down the order service's main thread pool. Its advantage is stronger isolation; its downside is higher cost—more threads create context-switching overhead, pool sizes are tricky to tune, and P99 latency can worsen. Hystrix uses thread-pool isolation by default.

**Semaphore Isolation**: Limit how many requests can run concurrently. For instance, allow at most 100 concurrent calls to the inventory service and reject or degrade any excess immediately. Its advantage is low overhead with no cross-thread-pool handoff. Its disadvantage is that if the downstream call blocks indefinitely, the calling business thread remains tied up—so semaphore isolation usually must be paired with strict timeouts. Sentinel's concurrent thread count control works closer to semaphore isolation.

> The real cost of thread-pool isolation is not "GC scanning" as many assume—it is context switching. With too many threads, the CPU constantly schedules, wakes, and suspends threads, driving system CPU (`sy`) up and degrading P99 tail latency. Whether the cost is severe depends on thread count, CPU `sy/us` ratio, queue wait times, and P99 metrics—never guess blindly.

![Isolation Strategy Comparison](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-isolation-strategy--7d38074c.png)

### What Is Sentinel's System Adaptive Protection?

Regular rate limiting relies on static manual thresholds—for example, throttling whenever QPS exceeds 1,000. Yet real systems are not that simple: CPU, Load, RT, thread count, and ingress QPS all determine whether a machine is approaching capacity limits.

Sentinel's System Adaptive Protection addresses this by evaluating system-wide load rather than just individual endpoints when deciding whether to shed requests. Official documentation notes that its design draws inspiration from TCP BBR, aiming to maximize throughput while maintaining reliability. Still, do not mistake it for a full TCP BBR implementation—Sentinel borrows the core concept and applies real-time metrics plus rule thresholds rather than dynamically probing network bandwidth and adjusting congestion windows like TCP.

Roughly, you can think of it as:

**`Current Concurrent Requests > System Max QPS × Min RT`**

Once in-flight requests exceed the system's estimated capacity, excess ingress traffic begins getting rejected. System rules can be configured against the following metrics:

| Metric                     | Description                     | Typical Usage                                           |
| -------------------------- | ------------------------------- | ------------------------------------------------------- |
| **Load**                   | Linux `load1` value             | Trigger protection when Load clearly exceeds CPU cores  |
| **Average RT**             | Average RT of ingress traffic   | Protect the system when average latency keeps climbing  |
| **Concurrent Threads**     | Number of in-flight requests    | Prevent thread resources from filling up                |
| **Ingress QPS**            | Incoming request rate           | Control overall ingress pressure                        |

Watch out for one catch: Sentinel's system rules evaluate average RT, not P99. Averages mask tail latency, so production systems should also wire up monitoring for P99, P999, thread pools, connection pools, and error rates.

### Selection Recommendations

| Scenario                          | Recommended Choice                           | Reason                                                          |
| --------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Legacy Hystrix project            | Keep running for now, plan migration         | Don't swap just for the sake of swapping; prioritize stability  |
| Spring Cloud Alibaba project      | Sentinel                                     | Seamless ecosystem fit, richer dashboard and rule model         |
| Dubbo project                     | Sentinel                                     | Mature integration and traffic governance capabilities          |
| New Spring Boot 3 / Java 17+ app  | Resilience4j or Sentinel                     | Resilience4j is lighter; Sentinel offers fuller governance      |
| Need retries only                 | Spring Retry / Resilience4j Retry            | Avoid pulling in a heavy governance framework just for retries  |
| Need system-level overload guard  | Sentinel, or Gateway / Service Mesh / custom | Most complete among the three, though not the only option       |

If your team already uses Nacos and Spring Cloud Alibaba, Sentinel has lower adoption friction. If your team aligns more closely with vanilla Spring Boot 3, Micrometer, and Prometheus, Resilience4j often feels much more natural.

### What Should You Watch Out for When Migrating from Hystrix to Sentinel?

Migrating a legacy project from Hystrix to Sentinel is not just swapping annotations.

**1. Separate Fallback handling.** Many Hystrix projects have a single `fallbackMethod` where rate limits, circuit breaks, and business errors all go into one bucket. In Sentinel, separate `blockHandler` (handling Sentinel rule rejections such as rate limiting, circuit breaking, and system guard) from `fallback` (handling exceptions thrown by business code). Cleanly split your old fallback logic during migration rather than mixing them together.

**2. Different isolation models.** Hystrix defaults to thread-pool isolation, meaning many downstream calls actually ran inside Hystrix thread pools. Sentinel more commonly relies on concurrent thread count limits, which do not automatically offload downstream calls to separate thread pools. After migrating, re-verify timeouts, interruption handling, and thread-pool isolation—especially for slow downstream services, where Sentinel's concurrency count alone is insufficient without explicit timeouts.

**3. Different rule configuration models.** Hystrix often keeps rules in code or static config files. Sentinel favors dynamic rules—managed via Dashboard and persisted/pushed through Nacos, Apollo, or similar data sources. Never rely solely on in-memory Dashboard rules in production, or rules may be lost when either the application or the console restarts.

**4. Re-wire monitoring.** In the Hystrix era, Hystrix Dashboard + Turbine were common. When moving to Sentinel, Sentinel Dashboard works well for real-time call stats and rule tuning, while production setups normally export metrics to Prometheus, Grafana, or an internal observability platform. If using cluster rate limiting, you must also plan deployment and availability for the Token Server.

> Ideally, align the migration with a major Spring Boot / Spring Cloud upgrade—migrating in isolation invites dependency compatibility headaches. If Hystrix annotations are scattered everywhere in a legacy codebase, you can test Sentinel's [Hystrix adapter](https://github.com/alibaba/Sentinel/tree/master/sentinel-adapter/sentinel-hystrix) as a stepping stone, though check the adapter's current maintenance status before committing.

### Summary

For new projects, Hystrix is generally no longer recommended—since it is in maintenance mode, treat it as a legacy transition component only. If your stack centers on Spring Cloud Alibaba, Nacos, and Dubbo, Sentinel is usually the smoother fit. For new Spring Boot 3 / Java 17+ projects aligned with Micrometer, Prometheus, and Reactor, Resilience4j offers a lighter footprint.

When choosing in practice, don't just ask "which tool has more features"—weigh your team's tech stack, Spring Cloud version, observability stack, dynamic rule requirements, and who will own maintenance long term.
