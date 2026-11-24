---
title: "MiniMax M3 + Claude Code in Practice: Redis Troubleshooting, SCAN Algorithm Porting, and Monitoring Dashboard Construction"
description: "Connecting MiniMax M3 to Claude Code to complete three hands-on tasks: production Redis SCAN troubleshooting and degradation, cross-language reimplementation of the SCAN cursor algorithm from C to Go, and building an end-to-end Redis monitoring dashboard."
category: AI Coding in Practice
head:
  - - meta
    - name: keywords
      content: MiniMax M3,Claude Code,AI Coding,Redis SCAN,Troubleshooting,Monitoring Dashboard,Cross-Language Porting,Agent Coding,cc-switch
lang: en
sourceRef: zh-ref/ai-coding/cases/cc-m3.md
---

Hello, I'm Xiao G. MiniMax M3 was released a few days ago. Many friends tried it out right away and gave positive feedback, and quite a few readers left messages asking me to run a hands-on evaluation.

It wasn't that I didn't want to test it; I was simply too busy optimizing JavaGuide ahead of the autumn recruitment season, an annual ritual I always undertake.

![Reader messages requesting a hands-on review of MiniMax M3](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/image-20260604122811898-7f0a9215.png)

According to MiniMax's official announcements, M3 is their first open-weights model to simultaneously provide a 1M context window, native multimodality, and frontier coding capabilities. That is the vendor's positioning; whether it suits a specific codebase still requires validation on actual engineering tasks.

Officially released benchmark figures include: SWE-Bench Pro 59.0%, Terminal-Bench 2.1 66.0%, and MCP Atlas 74.2%. These figures correspond to specific benchmark suites and evaluation configs, and are not independently replicated results of this article.

![MiniMax M3 official capability intro: Coding Frontier/SOTA + 1M Context + Native Multimodal](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/HJsWydIbIAAFAZL-ecccc1b8.jpg)

What I care about more is its performance once integrated into real-world software engineering.

Therefore, I used an actual production incident from my past experience as a testbed. The observed symptom was that front-facing user requests experienced widespread latency spikes during peak business hours. Diagnostic clues pointed to a complete Redis `SCAN` loop inside a background asynchronous task; whether it was the primary culprit by occupying connections long-term needed to be verified against monitoring and controlled reproduction.

This case involves complex business chain reasoning and holistic diagnosis. Furthermore, after completing fault localization and remediation, I continued to test M3 by reimplementing core Redis C source code in Go, followed by constructing a full-stack Redis monitoring dashboard, examining M3 across both cross-language refactoring and end-to-end full-stack delivery.

This article unfolds across three tasks:

1. Troubleshooting and Incident Remediation
2. Low-Level Core Algorithm Reimplementation
3. Monitoring Dashboard Implementation

## Preparation

I routinely use Claude Code for development and use cc-switch to manage models uniformly. Below are the setup steps for MiniMax M3. First, open cc-switch and click the plus icon to add a model configuration:

![cc-switch click plus icon to add model configuration](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/cc-switch-add-model-16878ea3.png)

Select MiniMax M3 and populate your API key in the api key field:

![Select MiniMax M3 and fill in API Key](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/cc-switch-select-minimax-m3-37582ee9.png)

Finally, click to fetch the model list to finish model configuration. In my setup, I configured the main model directly as MiniMax M3:

![Fetch model list and set main model to MiniMax M3](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/cc-switch-set-main-model-5ebb3a22.png)

Once configured, open Claude Code and verify in the chat panel that the model is active:

![Verify MiniMax M3 model is active in Claude Code](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/claude-code-verify-model-98f2098f.png)

## Troubleshooting: Verifying Performance Issues Around an Application-Layer SCAN Loop

The first case replicates a production outage I experienced in the past. To make it easy to follow, we reconstruct it using a classic e-commerce scenario: an asynchronous task for "auto-cancelling timed-out orders" was running during a major promotional campaign, while large volumes of users were simultaneously browsing products. At a certain moment, pages experienced massive timeouts—sold counts, inventory, view counts, and favorites—all hotspot data completely failed to load:

![Widespread page timeouts during major promotion, product hotspot data failing to load](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/ecommerce-page-timeout-dc1e8ab2.png)

To evaluate MiniMax M3's diagnostic reasoning across complex business chains, I submitted screenshots of the symptoms (in Claude Code, you can paste screenshots via Ctrl+V, or Alt+V on Windows) alongside the error descriptions:

![Submit fault symptom screenshot and error description to M3](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/submit-error-to-m3-57a8c68e.png)

After a moment of analysis, MiniMax M3 pinpointed the issue to the complete `SCAN` loop in the background task. Initially, it summarized the cause as "SCAN causing Redis server-side blocking". This phrasing is not entirely accurate: an individual `SCAN` call is an incremental iterator specifically designed to avoid the prolonged blocking of commands like `KEYS`; what actually needed checking was loop iteration count, `COUNT` hints, keyspace size, per-call latency, and whether the application was monopolizing connection pool resources long-term.

![M3 locates root cause: SCAN operations causing Redis blocking and queuing read/write requests](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-root-cause-scan-blocking-58604783.png)

To further cross-check the business flow, I asked MiniMax M3 to illustrate the failure process using an ASCII diagram. The diagram traced from the order timeout task entering the `SCAN` loop, to connection pool exhaustion and subsequent page request queuing. Note that "keyspace traversal blocking the main thread" should be treated as a working hypothesis to be validated, not an immutable property of `SCAN`:

![M3 ASCII fault chain diagram: end-to-end causal chain from SCAN trigger to page timeout](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/fault-chain-ascii-diagram-b8b33cd5.png)

M3 subsequently provided recommendations across four dimensions: data structure adjustments, atomic operations, graceful degradation, and monitoring:

![M3 provides remediation suggestions across data structure, atomicity, degradation, and monitoring](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-four-dimension-fix-8179fd46.png)

For the affected business endpoints, M3 optimized serial Redis commands into a single atomic operation and attached a degradation fallback policy to control the blast radius in extreme cases:

![Serial Redis commands optimized into a single atomic operation with degradation strategy](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/atomic-operation-optimization-cfc26629.png)

On the operational side, M3 also recommended instrumentation metrics, suggesting 200 ms as an example alert threshold. This number cannot simply be justified by "human-perceivable lag"; Redis background task thresholds should be set according to endpoint SLOs, connection pool capacity, task frequency, and historical latency percentiles:

![Monitoring instrumentation advice and alert thresholds: SCAN red line set to 200ms](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitoring-alert-thresholds-d1410dd8.png)

Here is the diff of the modification:

![Diff of fix code, M3 incorporates degradation and monitoring concepts into implementation](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/fix-code-diff-7596eb93.png)

Below is the core degradation code. M3 used concurrency atomic primitives to handle some concurrent states, but this only guarantees atomicity for that specific variable or operation; it does not prove that the full chain spanning Redis, local cache, and database fallback is thread-safe or strictly consistent. Cache breakdowns, stampedes, and stale-value overwrites must still be validated through synchronization protocols, rate limiters, and concurrency tests:

![Core degradation code: using atomic concurrency classes to ensure multi-level cache thread safety](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/degradation-code-atomic-d2a5cf4c.png)

M3 also generated tests covering normal degradation, exceptional fallbacks, and race conditions. The screenshot demonstrates that all test cases compiled and passed; "100% logic coverage" merely indicates coverage over the measured code, not proof that all real-world failure scenarios have been validated:

![M3 test cases: covering normal degradation, error fallback, and race conditions, compiling and passing cleanly](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/test-cases-all-pass-616356a7.png)

## Diving into the Internals: Reimplementing Redis SCAN Cursor Algorithm and Binary Bit-Reversal (rev)

Google Engineering Director Addy Osmani recently pointed out a phenomenon worthy of reflection in his article "Don't Outsource the Learning": having AI write code while skipping the learning phase is all too easy—bugs get resolved, but your mental model never evolves. He cited an Anthropic randomized trial: when learning a new library, the AI-assisted group completed tasks at the same speed as the manual group, but scored only 50% on subsequent comprehension tests, far below the manual group's 67%. Interestingly, variance existed within the AI group: engineers who used AI to ask conceptual questions scored over 65%, whereas those who copy-pasted code scored under 40%. Osmani's conclusion: tools won't learn for you; what matters is how you use them.

![Addy Osmani Don't Outsource the Learning core insight: tools won't learn for you, difference lies in how you use them](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/addy-osmani-dont-outsource-learning-7e946f63.png)

Returning to our incident: troubleshooting and degradation remediation were only the first step. To truly understand how `SCAN` iterates across dicts, the true meaning of `COUNT`, and how binary bit-reversal (`rev`) advances cursors without duplicating or missing keys during rehashing, one must read documentation and source code. Official docs clarify that `COUNT` is merely a workload hint, while source code reveals how specific versions implement it. With MiniMax M3's help, I set out to reimplement the core `SCAN` algorithm and verify it within the mini-redis learning project maintained by my friend sharkchili.

To supply sufficient context, I passed the Redis SCAN source files directly into the mini-redis project via `add-dir`:

![Passing Redis SCAN source files into mini-redis project via add-dir](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/add-dir-redis-source-64164575.png)

Then I entered the requirement. After scanning the provided Redis source, M3 identified this as a long task and invoked the `plan-with-files` skill to break down and plan the task:

![M3 autonomously invokes plan-with-files skill for task decomposition and planning](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-plan-with-files-skill-c09f431c.png)

Upon completing planning, M3 proactively initiated clarifications. The first point was confirming the scope of requirements; I chose to reimplement the SCAN command:

![M3 proactively initiates requirement clarification, confirming scope of SCAN reimplementation](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-clarify-requirements-5e1d57a2.png)

The second point was algorithm selection. M3 discovered that mini-redis had already implemented Redis's custom `dict` data structure rather than simply using native Go maps. It therefore suggested reimplementing cursor progression directly on top of the existing `dict`. This preserves the primary behavior and educational value of Redis's algorithm. Whether bucket ordering, memory locality, and performance match depends on the Go implementation's data layout and runtime, and cannot be deduced purely from data structure names:

![M3 recommends full reimplementation of Redis SCAN cursor based on existing dict rather than native Go map](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/algorithm-selection-dict-vs-map-65189615.png)

After several rounds of interaction and clarification, we established the following plan:

![Final reimplementation plan after multi-round clarification](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/final-replication-plan-b0c2ada8.png)

With alignment reached, M3 completed function implementations bottom-up, first constructing the basic dict iteration framework, then bridging cursor progression with parameter parsing, and finally updating the project's README roadmap:

![M3 implements functions bottom-up and proactively updates project README roadmap](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-bottom-up-implementation-f85429ed.png)

The final delivered code structure is shown below. The SCAN implementation covers match/count parameter parsing as well as cursor looping logic:

![M3 SCAN implementation code structure: covering match, count parameter parsing and cursor looping logic](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/scan-implementation-code-cdbd66e4.png)

Through this reimplementation and code comments, I observed a key implementation detail of `SCAN`: in current Redis source code (`scanGenericCommand`), `count * 10` is used as the maximum iteration limit to bound single-call workload on sparse hash tables. It does not mean "iterating buckets is permanently multiplied tenfold", nor does it guarantee collecting exactly `COUNT` returned elements:

![dictScan detail bounding iteration to count x 10](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/dict-scan-count-detail-4111207d.png)

Another noteworthy detail: in Go, `^` carries dual semantics as both bitwise XOR and bitwise NOT, whereas in C they are separate operators (`^` and `~`). The `rev` algorithm involves extensive bit-reversal operations, requiring precise differentiation between "flipping a specific bit" and "inverting the entire binary number"—a single semantic mix-up causes cursor progression to derail completely. This section required careful review to verify that M3 did not mechanically replace `~` with `^`:

![M3 hand-writing rev algorithm correctly distinguishing Go ^ operator XOR and NOT semantics](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/go-xor-not-semantics-f7070437.png)

Backed by this implementation rigor, compilation and unit tests passed on the first run:

![SCAN reimplementation code passes compilation and unit tests on first attempt](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/scan-test-pass-3d0d3952.png)

## Applying Knowledge: Building a Lightweight Redis Monitoring Dashboard

Following incident mitigation and retrospective analysis, monitoring capabilities needed to be introduced into the existing architecture to ensure real-time observability over Redis runtime states and facilitate rapid detection and containment should issues recur.

In this phase, I passed the existing project as context into a new workspace, asking M3 to design and implement a visual Redis monitoring dashboard from scratch, testing its full-stack end-to-end delivery performance.

![Passing existing project context into new workspace for M3 to design Redis monitoring dashboard](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/build-redis-monitor-5f4cb83d.png)

Following brief clarifications, M3 produced an architectural ASCII diagram outlining the data flow:

1. Ingestion Layer (metrics instrumentation and reporting)
2. Buffer Layer (ring buffer for traffic smoothing)
3. Presentation Layer (HTTP API + frontend dashboard)

Responsibilities across the three tiers were decoupled with low interdependence:

![M3 three-tier monitoring system ASCII architecture diagram: ingestion, buffer, and presentation](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-three-layer-architecture-41407bb8.png)

Code directory layout:

![Monitoring dashboard project directory structure](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-code-structure-45fa2097.png)

Although created as a rapid MVP prototype, the ring buffer data structure design for metrics ingestion is worth highlighting—featuring a pre-allocated fixed-size array, mutex-protected concurrent access, and automatic overwriting of the oldest records upon buffer saturation:

![Ring buffer data structure design: preallocated fixed array, mutex protection, overwriting oldest on full](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/ring-buffer-design-0c1842e0.png)

The resulting monitoring dashboard is displayed below. Built with a dark theme, its layout is partitioned into several panels: real-time Redis instance metrics (memory usage, connection count, QPS), command type distribution charts, and a chronological slow query timeline:

![Final Redis monitoring dashboard: real-time status, command distribution, and slow query timeline](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-dashboard-final-931f79ab.png)

On the Redis server side, the dashboard also rendered comprehensive breakdowns for slow queries and key distributions, ready for daily operational monitoring:

![Detailed display of Redis server-side slow queries and key distribution](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-slow-query-detail-f22c7289.png)

## Summary

In this hands-on test, we tackled three tasks with M3: analyzing a Redis connection pool outage, porting the `SCAN` cursor algorithm from C to Go, and building a full-stack Redis monitoring dashboard. The takeaways and observed boundaries:

1. During troubleshooting, it proposed viable directions across data structures, atomicity, degradation, and monitoring, but its initial explanation of `SCAN` blocking mechanisms was inaccurate.
2. During low-level reimplementation, it recognized the project's custom `dict` structure and correctly distinguished Go's `^` operator between XOR and NOT semantics; correctness must still be validated against source code and comprehensive tests.
3. The monitoring dashboard covered ingestion, buffering, and presentation, but architectural trade-offs like using a ring buffer were not deeply defended.

In the C-to-Go porting of Redis SCAN, M3 recognized that the repo reimplemented `dict` rather than relying on Go maps, recommending a faithful reimplementation of the SCAN cursor on that basis. It also handled line-by-line semantic distinctions for Go's `^` operator.

In the monitoring dashboard scenario, M3 revealed an important boundary: in greenfield 0-to-1 situations, the architecture it provides tends to be a "functional, safe default" rather than a "thoroughly evaluated optimal solution". Taking the ring buffer as an example: why choose a ring buffer over a lock-free queue? Under high QPS, does overwriting the oldest data drop critical metrics? M3 defaulted to a standard answer without actively raising trade-offs. If developers lack underlying domain knowledge, they cannot make informed decisions during brainstorming—ending up with a prototype that "runs" rather than one that is "well-architected".

This echoes Addy Osmani's insight: tools will not learn for you. M3 generated degradation code and the rev algorithm, but the model's explanations of `SCAN` blocking and `count * 10` still required docs, source code, and stress testing to calibrate. For me, that is the true value of this evaluation—it accelerates reading and implementation, but engineering conclusions must always be verified by yourself.
