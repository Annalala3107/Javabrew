---
title: "Java Backend Production Troubleshooting: CPU, Memory, GC, Thread Pools, Databases, and Redis"
description: A Java backend production troubleshooting guide covering alert verification, mitigation and evidence preservation, CPU spikes, OOM, frequent GC, thread pool and connection pool exhaustion, slow SQL, Redis stalls, message backlog, and incident postmortems.
category: Java
tag:
  - JVM
  - Production Troubleshooting
  - Performance Tuning
  - Java Interviews
lang: en
sourceRef: zh-ref/java/jvm/jvm-in-action.md
sitemap:
  changefreq: monthly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Java production troubleshooting,JVM troubleshooting,CPU spike,OOM troubleshooting,Full GC,thread pool exhaustion,connection pool exhaustion,slow SQL,Redis incident,MQ backlog
---

As soon as an alert fires, troubleshooting can easily get pulled along by whichever curve looks most dramatic on the monitoring dashboard. You see high CPU and immediately grab thread dumps; you see Full GC and jump into inspecting the heap; a deployment just finished and you reach for a rollback. Yet these symptoms often propagate into one another: slow SQL holds onto database connections, waiting on the connection pool stalls business threads, and in the end you may see latency, error rate, and CPU rise all at once. Looking at any single metric in isolation rarely nails the root cause.

While an incident is still escalating, contain the blast radius according to your runbook first. If an instance still has headroom and you confirm that collecting diagnostics will not tip the service over, preserve logs, traces, thread dumps, and memory information. Restarting often restores service temporarily, but it also wipes out the scene; keeping an unhealthy instance serving live traffic just to capture a Heap Dump can equally make the outage worse. The live situation determines whether to drain traffic, roll back, or gather evidence first.

Below we only discuss common issues on the Java application side. If the evidence already points to container scheduling, the OS kernel, network equipment, or the cloud platform, switch to the corresponding platform's monitoring and operational runbooks to investigate further—we will not expand on those here.

::: warning Production Environment Operation Reminder
Before running diagnostic commands in production, first check whether the instance is still serving traffic, how much disk space remains, and the overhead of the command itself. Control the frequency when taking consecutive thread dumps; Heap Dumps, class histograms, and forced GCs can cause noticeable CPU, I/O, or pause spikes. When an instance is already close to unavailable, drain traffic or stop the bleeding first—do not keep serving live business traffic just to preserve evidence.
:::

## What Should You Confirm First After Receiving an Alert?

After receiving an alert, first check whether there are user-facing anomalies. High CPU on a single instance while requests are still handled normally by other instances is not on the same severity level as an error rate increase across the entire service. You also need to rule out false monitoring alerts, metric collection lag, and downstream timeouts blocking threads inside your own service.

Place request volume, error rate, P95/P99 latency, CPU, memory, GC, thread pool, and connection pool curves from roughly ten minutes before and after the alert side by side, and line them up against deployment times, configuration changes, scheduled jobs, and traffic spikes. Pull in alerts from databases, Redis, message queues, and external APIs as well. Trace along the timeline to confirm which endpoints and users were impacted, when the anomaly started, and which metric changed earliest.

A normal average response time does not mean every request is healthy. A small fraction of ultra-slow requests might be stuck right on critical paths like login, order placement, or payment—in these cases, P95/P99, timeout rate, and business success rate are far more informative.

## How Do You Balance Mitigation and Evidence Preservation?

When an incident is still expanding, stop the bleeding first according to your runbook. Common measures include rolling back the latest release, draining/removing unhealthy instances, disabling problematic scheduled jobs, rate limiting, circuit breaking, degrading non-core features, and scaling out. Every measure has side effects: scaling out may overwhelm the database even further, retries amplify downstream traffic, and a rollback might not be compatible with already-migrated data.

When conditions permit, preserve the following information before restarting or rolling back:

- Monitoring screenshots or the exact time window around the alert.
- Application logs, access logs, GC logs, and change records.
- One to three thread dumps taken a few seconds apart, rather than just a single snapshot.
- Slow calls, failed calls, and upstream/downstream timings from distributed tracing.
- Process CPU, RSS, heap usage, thread count, file descriptors, and network connection states.
- Database slow queries, lock waits, connection pool status, Redis slow commands, and MQ consumer lag.

Even after traffic has been drained from an instance, do not immediately assume it is safe to take a Heap Dump. Dumping a large heap requires sufficient disk space and I/O capacity, and certain commands can trigger lengthy pauses. A safer approach is to preconfigure automatic OOM heap dumping in your startup flags and write the dump file to a directory with adequate capacity and proper permissions.

```bash
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/with/enough/space
```

## How Can You Quickly Determine Which Layer Has the Issue?

When you do not yet have trace clues, choose your troubleshooting entry point by symptom first. The mappings in the table cannot replace subsequent verification.

| Symptom | Check First |
| --- | --- |
| High CPU with endpoints slowing down simultaneously | Hot threads, infinite loops, serialization, lock contention, frequent GC |
| Low/normal CPU with very high Load | Disk I/O, uninterruptible sleep, network storage, container CPU throttling/quotas |
| RSS rising continuously while Java heap stays stable | Direct memory, thread stacks, Metaspace, JNI, native libraries, and memory-mapped files |
| Old Generation keeps growing even after collection | Long-lived objects, unbounded caches, collection retention, listeners, or ThreadLocals |
| Thread count and queue depth rising | Slow downstream dependencies, lock waits, slower task processing, insufficient thread pool isolation |
| Database connection pool wait time rising | Slow SQL, long transactions, connection leaks, insufficient database capacity |
| Redis RT rising | Slow commands, Big Keys, Hot Keys, network jitter, connection pool waiting |
| MQ Lag rising continuously | Slower consumption, uneven partitions, failing message retries, insufficient downstream capacity |

Issues can also cascade across layers. A slow SQL query holds a database connection, business threads then block on the connection pool, the thread pool queue starts backing up, upstream callers time out and retry, and eventually you observe CPU, latency, and error rate climbing together. When investigating, follow the timeline to verify which metric changed first.

## How Do You Troubleshoot a CPU Spike?

First confirm which process the high CPU comes from, then identify which threads inside that process are consuming CPU. Below is a common troubleshooting flow on Linux:

```bash
# Find Java processes
jps -l

# Check CPU usage of each thread inside the process
top -H -p <pid>

# You can also inspect CPU usage per thread over an interval
pidstat -t -p <pid> 1
```

`top -H` displays decimal thread IDs, whereas `nid` in thread dumps is usually in hexadecimal. Convert first, then look up the corresponding thread in the thread dump:

```bash
printf '%x\n' <tid>
jcmd <pid> Thread.print > /tmp/thread-dump.txt
```

Take several thread dumps consecutively. If a thread appears to be executing JSON serialization in only one snapshot, it might just happen to be sampled there; only when multiple snapshots stay stuck in the same block of code is it worth investigating further. Common causes include:

- Non-terminating loops or recursion.
- Compute-heavy tasks such as large-object serialization, regex backtracking, and encryption/decryption.
- Heavy object allocation triggering frequent GC.
- Multiple threads contending for the same lock, accompanied by context switching.
- Traffic growth or retry amplification where the CPU is simply doing more legitimate work.

When CPU is already near 100%, do not launch multiple high-overhead diagnostic tasks simultaneously. Drain partial traffic or pick one unhealthy instance to collect evidence so diagnostic operations do not compete for resources.

## What If CPU Is Not High, Yet Load Is Very High?

Linux Load Average counts both runnable tasks and tasks in uninterruptible sleep. When disk I/O, network storage, or certain kernel I/O waits are severe, CPU utilization may stay low while Load keeps climbing.

```bash
vmstat 1
iostat -xz 1
pidstat -d -p <pid> 1
```

Focus on the run queue, I/O wait, and blocked tasks in `vmstat`, as well as device utilization, wait time, and queue depth in `iostat`. `iostat` and `pidstat` are typically provided by the `sysstat` package—check ahead of time whether they are available in your production environment.

## How Do You Troubleshoot Slow Endpoints When CPU Is Not High?

This class of issue usually stems from waiting: waiting for database connections, downstream responses, locks, thread pool tasks, or disk I/O.

First locate the slowest segment in distributed tracing. If tracing is unavailable, narrow down the scope by combining request latencies in access logs, database slow queries, client connection pool metrics, and thread dumps. Common thread states seen in thread dumps include:

- Many threads stuck in the database connection pool's `getConnection()`: inspect connection pool waits, active connections, slow SQL, and long transactions.
- Many threads stuck reading responses in an HTTP client: inspect downstream latency, timeout settings, and retry counts.
- Many threads in the `BLOCKED` state: inspect the lock holder and any slow operations inside the critical section.
- Worker threads idle while the task queue piles up: inspect consumer threads, task submission patterns, and executor status.

The total duration of a slow request should add up cleanly across stages. If tracing only instruments business method durations while omitting connection pool waiting, thread pool queueing, and client DNS/TLS time, an unexplained gap will appear in the middle, requiring additional monitoring or instrumentation.

## How Do You Troubleshoot Continuously Rising Memory and OOM?

First distinguish whether what is rising is the Java heap, process RSS, or total container memory. `-Xmx` only bounds the Java heap; the process also uses Metaspace, Code Cache, thread stacks, direct memory, GC's own data structures, and native library memory.

Check metrics on both the JVM and OS sides first:

```bash
jcmd <pid> GC.heap_info
jcmd <pid> VM.flags
jcmd <pid> VM.native_memory summary
```

`VM.native_memory` relies on Native Memory Tracking (NMT), which must be enabled at JVM startup, such as `-XX:NativeMemoryTracking=summary`. It introduces extra overhead and cannot be turned on retroactively after an incident happens.

NMT mainly tracks native memory managed by JVM/HotSpot itself and cannot cover all allocations made by JNI or third-party native libraries. When RSS keeps climbing without a corresponding change in NMT, you must continue investigating with OS-level and native memory profiling tools.

Common OOM messages point in different investigation directions:

| OOM Message | Common Troubleshooting Directions |
| --- | --- |
| `Java heap space` | Large objects, retained references, unbounded collections, caches, queries returning too much data at once |
| `GC overhead limit exceeded` | Heap near exhaustion, GC spending huge amounts of time while reclaiming very little |
| `Metaspace` | Dynamic class generation, ClassLoader leaks, Metaspace cap configured too small |
| `Direct buffer memory` | NIO direct memory, Netty Buffers, delayed release, or misconfigured upper limit |
| `unable to create native thread` | Too many threads, OS process limits, insufficient container memory, per-thread stack too large |

Heap Dumps can be analyzed with tools like MAT or VisualVM. Start by examining the largest objects, Dominator Tree, reference chains to GC Roots, and suspicious ClassLoaders—do not jump to conclusions based solely on object counts.

When a manual dump is needed, you can run:

```bash
jcmd <pid> GC.heap_dump filename=/path/with/enough/space/heap.hprof
```

This command can have a noticeable impact on the application. Before running it, evaluate heap size, free disk space, I/O capacity, and pause risk. While production instances are still serving live traffic, prefer running it on an unhealthy instance after draining traffic. `jmap -dump:live` may trigger a Full GC and should not be treated as a risk-free command to run casually.

## How Do You Distinguish a Memory Leak From Normal Growth?

Observe heap occupancy after full GCs. If business traffic and data volume are stable yet the Old Generation keeps trending upward after multiple complete collections, then you have strong reason to suspect objects cannot be reclaimed. Cache warm-up, class loading, and traffic growth can also cause heap usage to climb gradually after startup, which are not necessarily leaks.

During analysis, you must also determine why objects are being retained. Knowing a `Map` is huge only tells you it occupies memory; tracing further along the reference chain to find an unbounded cache, static collection, listener, `ThreadLocal`, or faulty session lifecycle is what confirms where to fix it.

## How Do You Troubleshoot Frequent Young GC?

Frequent Young GC usually indicates a high object allocation rate or insufficient Young Generation capacity. Look at allocation rate, survival size after each collection, and pause duration first before deciding whether to change code or tune flags.

```bash
jstat -gcutil <pid> 1000 10
jcmd <pid> GC.heap_info
```

Common causes include loading huge numbers of objects in a single query, endpoints returning oversized payloads, logging or serialization creating massive amounts of temporary objects, batch jobs without batch size limits, and a Young Generation configuration mismatched with the workload.

Adjusting Young Generation size only changes GC cadence—it cannot fix unbounded queries or high-allocation code. First confirm where objects are being allocated via GC logs, JFR, allocation profiling, or load testing. After changing flags, compare throughput, P95/P99 latency, GC count, and total pause time under identical traffic and data conditions.

## How Do You Troubleshoot Frequent Full GC?

First check the GC logs to confirm the trigger reason, heap occupancy before and after collection, and pause time. Log fields and trigger causes vary across collectors—do not attribute every Full GC to "the Old Generation is full."

Focus on these items during investigation:

- Whether Old Generation occupancy drops noticeably after collection.
- Whether there are too many large objects or promoted objects.
- Whether Metaspace is approaching its cap.
- Whether explicit `System.gc()` calls or diagnostic tools are triggering collections.
- Whether heap size, container memory limits, and collector settings match.
- Whether a traffic surge, batch job, or cache refresh happened right before GC.

If occupancy remains high after collection, continue analyzing object retention; if collection reclaims effectively yet fills right back up quickly, focus on allocation rate, promotion rate, and heap capacity. Confirm application behavior before changing JVM flags—otherwise, simply enlarging the heap only postpones the next failure while potentially increasing pause and dump costs.

## How Do You Troubleshoot Thread Pool Queue Backlog?

For thread pool issues, never look solely at the active thread count. At a minimum, monitor all of the following together:

- `corePoolSize`, `maximumPoolSize`, and current thread count.
- Active thread count, queue length, and queue capacity.
- Task submission rate, completion rate, queue wait time, and execution time.
- Rejection count and the specific rejection policy.

A continuously growing queue indicates that tasks are arriving faster than they are completed. The cause may be a traffic burst, or tasks themselves becoming slower—such as waiting for database connections, downstream timeouts, or lock contention. Blindly increasing thread count increases concurrent access to databases, Redis, and external APIs, potentially pushing the bottleneck downstream.

Investigate in this order:

1. Confirm which business tasks share this thread pool and whether unrelated tasks are mixed in.
2. Compare submission rate, completion rate, queue wait time, and execution time.
3. Sample thread stacks of currently executing tasks to see whether they are computing or waiting.
4. Check whether database, HTTP, and Redis connection pools are exhausting simultaneously.
5. Decide on rate limiting, degradation, scaling, isolation, or discard strategies according to task criticality.

`CallerRunsPolicy` makes the submitting thread execute the task itself, which can temporarily slow down submission, but once Web request threads get tied up by long-running tasks, endpoint latency rises as well. Whether it fits the current thread pool depends on the caller and task type.

## How Do You Troubleshoot Database Connection Pool Exhaustion?

When a connection pool is exhausted, check active connections, idle connections, waiting threads, and connection acquisition time first. When many business threads are waiting for connections, typically investigate along three directions:

- Slow SQL keeping connections from being returned promptly.
- Overly broad transactions containing remote calls, file processing, or heavy computation.
- Code failing to close connections across all branches, causing connection leaks.

On the database side, inspect active sessions, slow queries, lock waits, long transactions, and instance resources. For MySQL, combine `SHOW PROCESSLIST`, the slow query log, Performance Schema, `EXPLAIN`, and InnoDB transaction/lock information to pinpoint the issue. Execution plans depend on the actual SQL, parameters, and data distribution—seeing an index hit in a test database does not prove production behaves the same way.

Before enlarging a connection pool, verify that the database can sustain more concurrency. The number of application instances multiplied by each instance's max connection pool size is the total connections the database may face; when a service scales out, that total grows along with it.

Related reading: [MySQL Execution Plan Analysis](../../database/mysql/mysql-query-execution-plan.md), [SQL Optimization Summary](../../high-performance/sql-optimization.md).

## How Do You Troubleshoot Redis Slowdowns?

When application calls to Redis slow down, separate client-side waiting from server-side execution first. Connection pool exhaustion, network jitter, and DNS issues can all make a Redis call slow even when the command itself executes rapidly.

On the Redis server side, focus on:

- Command latency and the slow log.
- CPU, memory, network throughput, and connection count.
- Big Keys, Hot Keys, expiration deletion, and persistence operations.
- Primary-replica replication lag, cluster status, and failovers.

`SLOWLOG GET` records only the execution time of a command on the Redis server, excluding queueing and network transit. When total application latency is high while the Slow Log looks normal, keep checking connection pool waits, networking, and client-side processing.

When hunting for Big Keys, tools such as `redis-cli --bigkeys` can be used, though it scans the keyspace and adds extra load. In production, choose off-peak hours, a replica node, or controlled sampling, and verify the command's impact on your current version and cluster topology beforehand. Never run `KEYS *` directly in production.

Hot Keys must be confirmed by combining access frequency with node load. Looking only at key size will miss small keys with extremely high read counts; gather evidence using the proxy layer, client-side statistics, monitoring platforms, or controlled hot-key analysis features.

Related reading: [Common Redis Interview Questions](../../database/redis/redis-questions-02.md).

## How Do You Troubleshoot Message Queue Backlogs?

First compare production rate and consumption rate, and confirm which Topic, queue, or partition holds the backlog. Then check whether consumer instances are alive, whether consumer threads are blocked, whether per-message processing time has changed, and whether downstream databases or APIs have slowed down.

Common causes include:

- Traffic increases where production rate exceeds designed capacity.
- Slow processing on a certain class of messages stalling the entire partition or queue.
- Failing messages retrying endlessly, creating a retry storm.
- Uneven partition assignment or frequent consumer rebalances.
- Failures to commit offsets after successful consumption, causing duplicate consumption.
- Downstream databases, Redis, or external APIs becoming bottlenecks.

Whether adding consumers helps depends on the message queue model. Within the same Kafka consumer group, effective parallelism is bounded by the partition count; adding more consumers when no partitions remain to assign will not increase throughput. Even when increasing partitions and consumers, confirm downstream capacity so catching up on backlogged messages does not slam the database all at once.

While clearing a backlog, also ensure idempotency and monitor consumer errors and dead-letter queues. When an anomalous message must be skipped, preserve its payload and failure reason for later reconciliation instead of dropping it outright.

Related reading: [Common Message Queue Issues](../../high-performance/message-queue/message-queue.md).

## How Do You Troubleshoot Downstream API Timeouts?

First break down the time spent in a single call: connection pool waiting, DNS, TCP handshake, TLS handshake, request transmission, server processing, and response reading. Different stages require different timeout configurations; setting only a single overall timeout makes it hard to see where time went.

When inspecting the caller side, focus on:

- Connect timeout, read timeout, and total call-chain budget.
- Active connections, wait queues, and connection reuse in the HTTP connection pool.
- Retry counts, backoff strategy, and which errors trigger retries.
- Circuit breaker state, fallback behavior, and first-attempt success rate.

When a downstream service is already degraded, multi-layer retries amplify traffic rapidly. If the gateway, business service, and SDK each retry three times, the worst case generates far more requests than a single call. Cap retry layers and the overall budget first, and decide whether retries are safe based on whether the API is idempotent.

## Walking Through the Troubleshooting Flow With a Slow Endpoint

Suppose an order query endpoint sees its P99 latency rise and error rate climb after a release; investigate in the order below. This example illustrates the methodology and does not represent a real production incident.

1. Confirm from monitoring that the issue started after the deployment and is concentrated on the new-version instances and the order query endpoint.
2. Pause the rollout and drain some unhealthy instances; the error rate drops, containing the blast radius first.
3. Compare traces between old and new instances and discover most time is spent acquiring database connections and executing queries.
4. Connection pool metrics show rising waiting threads, and database slow query logs surface the same SQL statement.
5. Check the execution plan with query conditions matching production parameters and find that a newly added filter prevents the original composite index from filtering effectively, introducing an extra sort.
6. Modify the query and index in a test environment whose data distribution closely mirrors production, comparing rows scanned, P95/P99, CPU, and connection usage.
7. After a canary rollout of the fix, keep watching slow queries, connection pool waits, and business error rate before gradually restoring traffic.
8. During the postmortem, add performance tests covering this query pattern and post-release monitoring checks.

In this hypothetical scenario, thread pool and connection pool pile-ups appeared downstream of the slow SQL; the execution plan and slow query records pointed root cause back to the SQL. Had step 4 revealed the SQL itself was fast and time was spent outside the connection pool, you would return to other hypotheses and continue verifying.

## How Do You Verify After a Fix?

After applying a code or configuration fix, you still need to confirm that user-facing metrics have recovered, temporary mitigations can be rolled back safely, and no new data inconsistencies were introduced.

When verifying, compare the exact same set of metrics before, during, and after the incident: request volume, P95/P99, error rate, business success rate, CPU, memory, GC, thread pools, connection pools, and dependency latency. When duplicate consumption, inventory, orders, or financial state are involved, perform data reconciliation as well.

Performance changes must be compared under similar data volumes, traffic models, machine specs, and cache states. Running a single-endpoint load test once does not prove the entire business chain has recovered. For specifics, refer to: [Introduction to Performance Testing and Stress Testing](../../high-availability/performance-test.md).

## What Should an Incident Postmortem Record?

A postmortem should leave behind material that can be used directly in the next incident. At a minimum, the document should preserve:

- Incident timeline, blast radius, and user-facing impact.
- Direct cause, triggering conditions, and why the incident escalated.
- Evidence used during mitigation, root-cause localization, and remediation.
- Which alerts, runbooks, or tests failed to catch or contain the issue.
- Follow-up action items, owners, and due dates.

Action items like "developers should strengthen code review" are hard to verify. Action items should map to concrete mechanisms—for instance, adding an alert on connection pool wait time, capping batch query sizes, adding idempotency tests for message consumption, or adding key endpoint regression comparisons to the release pipeline.

## How Should You Answer Production Troubleshooting Questions in Interviews?

When an interviewer asks "How do you handle a production CPU spike?", give the general sequence first and then tie it to a case you have actually handled:

> I would first confirm the blast radius, traffic, and recent changes to decide whether to drain instances, rate-limit, or roll back. When conditions permit, I preserve monitoring metrics, logs, and multiple thread dumps. Once I confirm the CPU spike comes from the Java process, I use `top -H` or `pidstat -t` to find the hot threads, convert the thread IDs to hexadecimal, and match them against `nid` in the thread dumps. Consecutive samples confirm which code block the threads stay stuck in, and combined with GC, traces, and traffic, I determine whether it is a compute hotspot, infinite loop, lock contention, or frequent GC. After fixing, I validate under the same scenario and add monitoring and regression tests.

If you have not handled a real production incident, explain which scenarios you have practiced in a test environment and which case studies you have reviewed. Never present an article you read as an incident you personally owned.

## Quick Reference of Common Tools

| Tool | Common Uses | Usage Reminders |
| --- | --- | --- |
| `top`, `pidstat` | Process and thread CPU, I/O | Confirm container vs. host observation scope first |
| `vmstat`, `iostat` | System run queue, memory, and disk | Needs to be interpreted over a trend window |
| `jcmd` | Thread dumps, heap info, JFR, class histograms | Some commands have high overhead; assess before running |
| `jstat` | GC and memory region trends | Continuous sampling is much more useful than a single snapshot |
| JFR, JMC | CPU, allocation, lock, and I/O event analysis | Tune recording configuration to match production overhead |
| MAT, VisualVM | Heap Dump analysis | Focus on reference chains and GC Roots |
| Arthas | Method timing, threads, classes, and runtime diagnostics | Restrict scope when running Trace/Watch on high-traffic methods |
| Trace / Monitoring platforms | Request chains, error rates, latency, and dependencies | Pay attention to sampling rate, data masking, and clock sync |

## Recommended Reading

- [Summary of JDK Monitoring and Troubleshooting Tools](./jdk-monitoring-and-troubleshooting-tools.md)
- [Summary of the Most Important JVM Parameters](./jvm-parameters-intro.md)
- [JVM Garbage Collection Explained](./jvm-garbage-collection.md)
- [Java Thread Pools Explained](../concurrent/java-thread-pool-summary.md)
- [Deadlock Explained](../../cs-basics/operating-system/dead-lock.md)
- [Oracle Java Troubleshooting Guide: Memory Leaks](https://docs.oracle.com/en/java/javase/17/troubleshoot/troubleshooting-memory-leaks.html)
- [Redis Latency Troubleshooting](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)
- [Redis Slow Log](https://redis.io/docs/latest/commands/slowlog/)
- [Analysis of a Production OOM Incident](https://juejin.cn/post/7205141492264976445)
- [Analysis and Resolution of 9 Common CMS GC Issues in Java](https://tech.meituan.com/2020/11/12/java-9-cms-gc.html)
