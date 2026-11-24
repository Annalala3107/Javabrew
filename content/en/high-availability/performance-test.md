---
title: "Introduction to Performance Testing and Stress Testing: RPS, QPS, TPS, P99, and Load Testing Tools"
description: "An introductory guide to performance testing covering RPS, QPS, TPS, RT, P90/P99/P999, Little's Law, capacity estimation, the Hockey Stick Curve, backpressure and self-healing verification, as well as load testing, stress testing, soak testing, and tools including JMeter, Gatling, k6, Locust, ab, and wrk."
category: High Availability
icon: "mdi:speedometer"
tag:
  - Performance Testing
  - Stress Testing
lang: en
sourceRef: zh-ref/high-availability/performance-test.md
head:
  - - meta
    - name: keywords
      content: performance testing,stress testing,load testing,stability testing,RPS,QPS,TPS,RT response time,P99,capacity estimation,concurrency,throughput,backpressure,Little's Law,JMeter,Gatling,k6,Locust,ab load test,wrk load test,performance testing interview questions
---

Performance testing is usually handled by a dedicated QA/testing team, so why do developers need to learn it as well? Understanding performance metrics, test classifications, and testing tools helps us write higher-performing software. Furthermore, as a developer, knowing how to conduct performance testing will definitely be a strong plus on your resume.

This article combines my practical experience with insights learned from QA teams, along with takeaways from several great books. Hopefully you'll find it helpful.

When people casually say "load testing" or "stress testing", they are often referring broadly to performance testing work: using tools to simulate user requests and observing the system's throughput, response time, error rate, and resource utilization under varying levels of load. When actually running a test, always clarify upfront what this run is meant to verify.

## How Different Roles View Website Performance

### Users

When a user opens a website, what do they care about most? Naturally, **how fast the website responds**. For example, when we click on Taobao's homepage, how long does it take for Taobao to render the homepage content in front of us? When we click the submit order button, how long does it take to return the result? And so on.

Therefore, when users experience our system, they usually judge our website's performance based on its response speed.

### Developers

Both users and developers care about speed, which in essence is **how fast our system processes user requests**.

Developers usually find it hard to judge a website's performance intuitively at a glance; instead, we estimate an approximate baseline based on the current architecture and infrastructure, asking questions such as:

1. Is the project architecture distributed?
2. Are caches and message queues being used?
3. Are high-concurrency business scenarios handled with special care?
4. Is the database schema/design reasonable?
5. Do the algorithms used in the system still need optimization?
6. Does the system have any memory leaks?
7. How large is the Redis cache used by the project? How powerful are the servers? Are they using HDDs or SSDs?
8. ...

### Testers / QA Engineers

QA engineers typically run tests using performance testing tools and produce a report/table. This table usually covers key metrics such as:

1. Response time;
2. Request success rate;
3. Throughput;
4. ...

### Operations (Ops) Engineers

Ops engineers tend to evaluate website performance based on **infrastructure and resource utilization**—for instance, whether server resources are used appropriately and whether database resources are being overused or abused. Of course, that describes traditional Ops; with the rise of DevOps, fewer people do pure Ops nowadays, though we'll still keep this role distinct here.

## Key Points to Keep in Mind for Performance Testing

Hardly any article on performance testing mentions these points—most articles only talk about how to run tests and what performance metrics exist.

### Clarify the Testing Goal

Think through your objective before running a load test; otherwise it easily turns into "the tool ran, a report was generated, yet nobody knows what the conclusion is."

Common goals fall into three categories:

1. **Pre-launch capacity estimation**: Verify whether the current machine specs, instance count, database configuration, and caching strategy can support expected traffic.
2. **Post-optimization verification**: Confirm whether changes such as fixing slow SQL, adding caching, tuning thread pools, adjusting JVM flags, or refactoring architecture actually improved throughput, RT, and error rates.
3. **Bottleneck identification**: Gradually ramp up load while observing CPU, memory, GC, database connection pools, thread pools, MQ backlog, and other metrics to pinpoint which component hits its limit first.

These three goals correspond to different testing approaches. Capacity estimation focuses on peak watermarks and safety headroom; optimization verification focuses on before-and-after comparisons; and bottleneck identification requires finer-grained monitoring and distributed tracing.

### Understand the System's Business Scenarios

**Before running performance tests, you especially need to understand the system's current business scenarios.** If you don't understand the business deeply enough, it's easy to test in the wrong direction and overlook the parts of the system that truly need performance testing.

For instance, suppose our system provides an email-sending feature: after configuring an email account, a user only needs to enter a recipient address to send an email, and the system processes tens of thousands of email requests per day. Many people seeing this might immediately start load-testing the email-sending endpoint. However, sending emails might not be the actual bottleneck of the system at all—if so many people use our system to send emails, and many send emails concurrently, user management might actually be the real performance bottleneck!

### Historical Data Is Extremely Valuable

Historical data accumulated by the live system is very important. Generally, we can use historical data to determine beforehand which endpoints are called most frequently and which services bear the heaviest load, allowing us to conduct more targeted performance testing and analysis on those areas.

Moreover, these hotspots act like the weakest links of the system—optimizing them well will deliver a qualitative leap in overall system performance.

### Make the Request Model Match Real Traffic as Closely as Possible

Single-endpoint load testing only shows how that single endpoint behaves under the test conditions; it cannot directly represent the real capacity of the system. When real users visit a system, they typically log in, browse, search, place an order, pay, or submit forms—different endpoints have ordering, traffic ratios, and data dependencies between them.

Therefore, load-test scripts should be designed around real business flows: hit high-frequency endpoints more heavily and low-frequency endpoints less; do not inflate the write ratio on a read-heavy system; and prepare valid test data in advance for endpoints requiring authentication, inventory, or order state transitions. Otherwise, you might measure a very high QPS in testing and still run into failures once real production traffic arrives.

### Prepare an Exit/Abort Mechanism First

Before starting a load test—especially an online/production load test—you must prepare stop controls and protection thresholds, such as maximum QPS, maximum concurrency, error-rate threshold, P99 RT threshold, CPU/memory thresholds, and database connection pool thresholds.

As soon as the system exhibits massive 5xx errors, continuously spiking RT, growing queue backlogs that fail to drain, or exhausted database connections, you must be able to stop the load test immediately or trigger automatic circuit breaking. The goal of performance testing is to uncover issues, not to knock out production services.

## Common Performance Metrics

When running load tests, metrics must not be viewed in isolation. RT, throughput, and concurrency must be examined together to determine whether the system is processing requests normally or has already started queuing.

![Relationship Between QPS, Concurrency, and RT](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/performance-test-metrics-relation-f97d288a.png)

### Response Time (RT / Latency)

First distinguish where response time is measured. For backend API load testing, **Response Time (RT)** usually refers to the time from when the load-test client sends a request until it receives the response, encompassing network transmission, API gateway, server-side processing, and response return. For frontend web pages, user-perceived latency is also affected by HTML parsing, JS execution, asset loading, rendering, and interaction delay—issues better analyzed with tools like Lighthouse, Chrome DevTools, and WebPageTest.

Average RT only reflects the overall trend; user experience is much more sensitive to long-tail requests like P95 and P99. API load tests and production monitoring generally look at **P50, P90, P95, and P99** together, and for core chains with sufficiently large request samples, **P999** as well.

For example, P99 = 500ms means 99% of requests return within 500ms. The remaining 1% of slow requests may stem from cache misses, slow SQL queries, or GC Stop-The-World (STW) pauses, tying up connections and worker threads for extended periods. Under high concurrency, thread pools fill up, new requests start queuing or getting rejected, and if upstream callers keep retrying on timeout, traffic is amplified even further. Meanwhile, large volumes of ultra-fast responses pull the average down, masking these long-tail issues behind average RT.

Below are merely example targets for a low-latency online API—not universal standards for every system:

| Percentile | Example Target | Description                                           |
| ---------- | -------------- | ----------------------------------------------------- |
| P90        | < 200ms        | Normal experience for the majority of users           |
| P99        | < 500ms        | Long-tail experience and thread-occupancy risk        |
| P999       | < 1s           | Extreme long tail on high-traffic core request chains |

Thresholds are best derived from business SLOs, user experience requirements, upstream timeouts, downstream dependency capabilities, and historical baselines. Also, P999 is quite sensitive to sample size: if a test only executes a few thousand requests, P999 can easily be skewed by occasional jitter; if an endpoint itself has very low QPS, P999 has limited statistical significance. For such endpoints, start by looking at P99, or run the load test longer to gather more samples.

> **Failure mode**: When occasional downstream jitter causes P999 to spike, if upstream lacks proper timeouts, rate limiting, and circuit breaking, requests will hold onto connections, threads, or coroutines for too long. Combined with retries, this can lead to thread pool exhaustion, connection pool exhaustion, queue backlogs, rising error rates, and in severe cases even trigger OOM.

### Concurrency

**Concurrency refers to the number of requests the system is actively processing at the same instant.**

Concurrency reflects the system's **load-handling capacity**. Be careful to distinguish the following concepts:

- **Concurrent users**: The number of users online at the same time.
- **Concurrent requests**: The number of requests actively being processed by the system at the same instant.
- **Maximum concurrency**: The maximum number of concurrent requests the system can sustain; exceeding this value may cause performance degradation or a crash.

### RPS, QPS, and TPS

- **RPS (Requests Per Second)**: The number of HTTP/RPC requests processed by a server per second—more suitable for API load testing.
- **QPS (Queries Per Second)**: The number of queries handled per second, commonly used for database or search queries, and also broadly used as a synonym for request throughput.
- **TPS (Transactions Per Second)**: The number of business transactions completed by a server per second—for example, placing an order, completing a payment, or registering an account.

> QPS vs. TPS: TPS carries stronger business semantics. For instance, placing an order counts as 1 TPS, yet behind the scenes it might involve querying inventory, creating an order, deducting stock, and calling the payment service—4 HTTP/RPC requests, which translates to 4 RPS for backend services and potentially even more database QPS.

### Throughput

**Throughput** refers to the number of requests a system processes per unit of time. RPS, QPS, and TPS are all common quantitative metrics for throughput.

**Little's Law**: In a steady, unsaturated system, `Average in-flight requests ≈ Throughput × Average response time`. Here, concurrency refers to the average number of requests currently being processed or queued inside the system (not online users); RT uses the *average* response time (not P99); and throughput uses the average rate of completed requests.

For example, if average QPS is 500 and average RT is 200ms (0.2s), the average number of in-flight requests inside the system is approximately `500 × 0.2 = 100`.

This formula only applies in the linear response region. As concurrency continues to climb, CPU scheduling, lock contention, and queuing delays amplify one another, causing RT to surge nonlinearly while throughput hits an inflection point, plateaus, or even drops. The "Hockey Stick Curve" in the diagram illustrates this phenomenon: past the knee/inflection point, QPS drops instead of rising, indicating that the system has entered the nonlinear zone.

![Hockey Stick Curve of QPS vs. Concurrency](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/performance-test-hockey-stick-curve-1b133478.png)

Therefore, production capacity cannot rely solely on formula estimates—you must validate the true limit via full-link performance testing.

## System Activity Metrics

### PV (Page View)

**Page Views**, or page visits/clicks, measure how many web pages users visit. Every time a user opens or refreshes a page within a given statistical period, 1 PV is recorded; opening or refreshing the same page multiple times accumulates multiple PVs. PV counts from the perspective of page opens/refreshes.

### UV (Unique Visitor)

**Unique Visitors** count the number of distinct users visiting a site within a day. Even if the same visitor accesses the website multiple times in one day, they are counted as only 1 unique visitor. UV counts from the perspective of individual users.

### DAU (Daily Active Users)

**Daily Active Users** refers to the deduplicated number of users who log in or use the product within a single day.

### MAU (Monthly Active Users)

**Monthly Active Users** refers to the deduplicated number of users who log in or use the product within a month.

### Practical Estimation Example

> **Production-grade capacity estimation**: Estimating peak traffic simply by multiplying DAU by a fixed factor easily underestimates promotional spikes. In scenarios like top-of-the-hour flash sales or major promotional launches, peak traffic is often orders of magnitude higher than daily average traffic. You can first estimate daily average QPS from historical daily average request volume, multiply by a business peak multiplier (e.g., 3x to 10x the daily average, depending on the business) to obtain an initial peak QPS estimate, and then use Little's Law to back-calculate target concurrency while adding a 1.5x to 2x safety margin. Even then, this result serves only as a starting point for your load-test target—ultimately, you should determine true throughput via **full-link performance testing** (combined with production traffic recording and replay tools such as [GoReplay](https://goreplay.org/)) rather than stopping at back-of-the-envelope calculations.

## Types of Performance Testing

| Test Type                        | Purpose                                                | Common Practice                                                 |
| -------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| **Benchmark Test**               | Establish a performance baseline for before/after comparison | Fixed environment, fixed scripts, fixed data                    |
| **Load Test**                    | Verify whether targets are met under expected load     | Gradually ramp up to target level using the estimated traffic model |
| **Capacity Test**                | Find the maximum capacity limit of the current system  | Continuously ramp up load to observe throughput inflection points and resource bottlenecks |
| **Stress Test**                  | Observe degradation, protection, and recovery beyond limits | Push past expected load to verify rate limiting, circuit breaking, and self-healing |
| **Stability (Soak/Endurance) Test** | Verify stability over prolonged execution           | Run continuously for a long duration at near-production load    |
| **Spike Test**                   | Verify ability to withstand sudden traffic surges      | Rapidly spike load in a short window, then drop back and observe recovery |

![Performance Testing Types: How Load Levels Differ](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/performance-test-type-boundaries-a21ebedb.webp)

These test types mainly differ in how far the load is pushed: load testing checks whether the system holds up under target traffic; capacity testing pushes higher to locate the inflection point; and stress testing goes beyond expected load to observe how the system fails and recovers.

### Benchmark Testing

Benchmark testing emphasizes keeping the environment, scripts, data, and parameters fixed so that changes before and after an optimization can be compared cleanly. For example, running the same endpoint on the same machine before and after adding a database index to see how average RT, P99, throughput, and CPU utilization change.

### Load Testing

Load testing verifies whether the system meets requirements under an expected traffic model. For instance, combining login, query, order placement, and payment requests according to historical production ratios and ramping up to the target QPS to verify that response times, error rates, and resource utilization meet expectations.

### Capacity Testing

Capacity testing keeps increasing request pressure until a server resource reaches saturation or response times and error rates no longer meet requirements. It focuses on finding the upper carrying limit under the current architecture and resource configuration.

### Stress Testing

Stress testing deliberately pushes traffic past the design threshold. During this phase, failing fast—such as returning `429` or `503`—is acceptable; what is *not* acceptable is requests hanging indefinitely, unreleased connections, backing up thread pools, ever-growing queues, and upstream callers endlessly retrying. During stress testing, verify whether protective mechanisms like token buckets, semaphores, queue capacity limits, circuit breaking, and degradation actually kick in—and whether connections, threads, queues, and throughput return to normal once the traffic subsides.

### Stability (Soak) Testing

Stability testing focuses on long-term trends. Issues that remain invisible right after startup often surface only after running for several hours. Run traffic matching production ratios for several hours, a full day, or longer, watching trends closely: does heap memory keep climbing without dropping back down? Are Full GCs becoming more frequent? Are connection pools staying saturated for long periods? Does the thread count grow continuously? Are MQ or local queues accumulating steadily? Is the error rate creeping up bit by bit? Running 24/7 is merely a common practice for high-demand scenarios, not a fixed requirement.

### Spike Testing

Spike testing is suited for simulating sudden traffic surges such as promotional openings, flash sales on the hour, or push notification broadcasts. During the test, ramp traffic up sharply in a very short time, then drop it back down to normal levels, observing whether rate limiting, queuing, and degradation trigger as expected—and whether RT, error rate, thread pools, and queues recover once traffic subsides.

## Full-Link Performance Testing

Single-endpoint load testing only tells you how much throughput a specific endpoint can achieve under a given script. When complex systems fail, the bottleneck is often not the entry endpoint itself: gateway authentication looks fine, while the inventory service begins queuing; the order endpoint is still returning responses, while MQ is already piling up; application CPU is low, while the database connection pool hits max capacity first. A single order placement might traverse the gateway, authentication, catalog, inventory, order, payment, message queue, cache, and database—if any single link hits a bottleneck first, it ultimately impacts the user request.

![Full-Link Performance Testing: Build the Guardrails First](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/full-link-performance-test-guardrails-303bda92.webp)

In full-link performance testing, traffic enters from the system's front door and flows down the real business call chain, putting load on every service, middleware component, and piece of infrastructure. Because this mirrors production traffic much more closely than single-endpoint testing, it also carries a higher risk of accidentally impacting real data and services—so prepare these safeguards first:

1. **Test data isolation**: Use dedicated load-test accounts, test flags/tags, shadow tables, or shadow databases to avoid polluting real orders, payments, inventory, and other core data.
2. **Test traffic identification**: Ensure the gateway, services, logs, monitoring, and distributed tracing can all identify load-test traffic for accurate reporting and rapid mitigation.
3. **Complete end-to-end observability**: Simultaneously monitor application metrics, host metrics, database metrics, cache metrics, MQ backlogs, slow SQL, GC, and thread pool states.
4. **Verified circuit breaking and rate limiting**: Confirm before testing that protective mechanisms—rate limiting, degradation, circuit breaking, and queue bounds—are active and working.
5. **Reviewable test records**: Record concurrency, QPS, P90/P99, error rate, resource utilization, and bottleneck points for every test round so results can be compared cleanly after optimization.

If your business has not yet reached the stage of needing a production full-link load-testing platform, simply getting core-chain scripts running cleanly with tools like JMeter, Gatling, or wrk—with bottleneck identification, data protection, and quick abort controls—already covers most capacity evaluation and bottleneck discovery needs. Once the business grows complex enough to require frequent production load testing, consider investing in a dedicated platform.

## Common Performance Testing Tools

### Common Backend Tools

Since system design inevitably involves system performance, interviewers are very likely to ask: **How do you conduct performance testing?**

Here are several widely used performance testing tools:

| Tool           | Language / Scripting                        | Key Features                                                        | Best-Fit Scenarios                                          |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| **JMeter**     | Java, GUI + CLI                             | Feature-rich; GUI works well for authoring/debugging scripts, CLI recommended for formal runs | Complex enterprise scenarios, API chain load testing        |
| **Gatling**    | Java, JavaScript, TypeScript, Scala, Kotlin | Code-driven; strong reporting and CI integration                    | Developer-maintained test scripts, CI/CD integration        |
| **k6**         | JavaScript scripts, Go engine               | Friendly metrics, thresholds, and CI integration                    | API load testing, SLO regression checks                     |
| **Locust**     | Python                                      | Define user behavior in Python; supports distributed scaling        | Python teams, complex user-behavior modeling                |
| **wrk**        | C, supports Lua scripts                     | Lightweight and high-performance                                    | High-concurrency HTTP API benchmarking                      |
| **ab**         | C                                           | Simple and lightweight; bundled with Apache                         | Quick smoke checks or rough benchmarks                      |
| **LoadRunner** | Commercial suite                            | Strong protocol support and test management                         | Large-scale enterprise testing                              |

If I recall correctly, aside from **LoadRunner**, all of the tools above offer open-source or free versions.

**Selection recommendations:**

- **Quick verification**: Use `ab` or `wrk` for straightforward API load testing.
- **Complex scenarios**: Use `JMeter`, which supports script recording, parameterization, assertions, and more.
- **Code-driven workflows**: Use `Gatling` or `k6`, ideal for developers maintaining scripts in code and integrating with CI.
- **Complex user-behavior modeling**: Use `Locust`, great for describing user workflows in Python.

### Common Frontend Tools

| Tool                            | Primary Purpose                                                                |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **Chrome DevTools Performance** | Record and analyze runtime page performance, long tasks, JS execution, and rendering bottlenecks |
| **Lighthouse**                  | Automatically audit page performance, accessibility, best practices, SEO, etc., and generate reports |
| **WebPageTest**                 | Test page loading experience from real browsers across different networks and regions |
| **Fiddler/Charles**             | Packet capture, request/response modification, and HTTP debugging              |

## Common Performance Optimization Strategies

Before optimizing, trace through the entire request path clearly: API gateway, application thread pools, cache, database, MQ, external APIs—look first at whichever stage starts queuing up first.

Below are questions I often ask myself when optimizing performance:

| Optimization Area | Checklist                                                                              |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Caching**       | Does the system need caching? Is hot data cached?                                      |
| **Architecture**  | Is the system architecture itself problematic? Do we need read-write splitting or sharding? |
| **Concurrency**   | Are there deadlocks in the system? Is lock granularity appropriate?                    |
| **Memory**        | Are there memory leaks? Is GC happening too frequently?                                |
| **Database**      | Are database indexes used properly? Are there slow SQL queries?                        |
| **Algorithms**    | Can the time complexity of core algorithms be optimized?                               |
| **I/O**           | Are there unnecessary network calls? Can operations be batched?                        |
