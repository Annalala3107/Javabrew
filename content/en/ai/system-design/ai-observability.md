---
title: "AI Observability and Tracing: How to Reconstruct the Complete Agent Execution Process"
description: "Starting from a request where the API succeeded but returned an incorrect answer, this article explains Trace design, Span breakdown, context propagation, sampling, sensitive data handling for AI applications, and implementation in Spring AI projects."
category: "AI Application Development"
tag:
  - "AI Observability"
  - "OpenTelemetry"
  - "AI Agent"
  - "Spring AI"
  - "AI System Design"
head:
  - - meta
    - name: keywords
      content: "AI Observability,Agent Trace,OpenTelemetry,Spring AI,LLM Observability,RAG Observability,LLM Monitoring"
lang: en
sourceRef: zh-ref/ai/system-design/ai-observability.md
---

The API returned 200, latency looked completely normal, yet the AI customer service gave an entirely incorrect refund rule.

Opening the monitoring dashboard, all you can see is that this request called the LLM and generated a response normally. Digging deeper immediately becomes tricky: Did the knowledge base fail to retrieve the right documents? Was the prompt formatted incorrectly? Did the model ignore the context? Or did some tool return stale data? Traditional API logs usually cannot answer these questions.

A single AI request may go through query rewriting, knowledge base retrieval, reranking, model invocation, tool calling, and output validation. An Agent might even repeat several of these steps in loops. Every single step appears to execute successfully, yet erroneous results are passed down to subsequent steps, ultimately yielding an answer that has a normal format but incorrect content.

When troubleshooting, you must trace backward along this execution path: Which model and prompt were used at the time? Which documents were retrieved? What tools were invoked? How many times did the Agent retry? What intermediate results did the final answer actually reference?

Only when all this information is captured within the same call trace can you accurately pinpoint the root cause.

## Why Can AI Applications Not Rely Solely on API Success?

Traditional backend monitoring primarily tracks QPS, error rates, P99 latency, CPU, memory, and database slow queries. While these metrics indicate whether a service is experiencing anomalies, they cannot explain why a model generated a particular answer.

Take RAG as an example: If query rewriting drifts off-topic, the downstream recall results typically follow suit. Even if the correct document was retrieved, it might drop out of `topK` during reranking. Even if the document ordering is fine, the context might still get truncated because the prompt exceeded token limits. Throughout this entire sequence, no exception was thrown, and the API still returned 200 OK.

In Agent scenarios, additional complications arise around tools and execution state. A tool API call might succeed, but the business data it fetched could already be stale. A timeout retry might re-execute an operation with side effects. During multi-Agent aggregation, the system might miss an already-completed result.

To trace an issue down to a specific step, the Trace must cover at least the model, retrieval, tools, Agent orchestration, and final results. Furthermore, confirmed failed Traces can be accumulated as bad cases for subsequent regression evaluations.

Note that a Trace can reconstruct the actual execution steps taken by the system, but it cannot inspect the internal reasoning mechanisms inside the model weights. The reasoning text returned by a model is also just a piece of output and cannot be treated directly as a complete explanation of decision-making.

## What Are the Differences Among Metrics, Logs, Trace, Evaluation, and Audit?

In AI observability, five concepts frequently appear together: Metrics, Logs, Trace, Evaluation, and Audit.

Each of these concepts solves a distinct problem.

| Signal | Core Question Answered | Typical Content |
| --- | --- | --- |
| Metrics | Is the system as a whole healthy? | Request volume, error rate, P95 latency, token usage, tool failure rate |
| Logs | What event occurred at a specific point in time? | Exception stack traces, state changes, retry reasons, business alerts |
| Trace | What did a specific request go through? | Model calls, retrieval, tool calls, Agent execution, and upstream/downstream relationships |
| Evaluation | Is the output quality acceptable? | Correctness, faithfulness, tool selection accuracy, task completion rate, safety |
| Audit | Who executed what operation under what permissions? | User identity, approval records, permission decisions, external write operations |

![Problems Solved by Different AI Observability Signals](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-signals-overview-be8a9c44.webp)

Their collaborative relationship can be summarized in one sentence: **Metrics discover anomalies, Traces pinpoint execution paths, Evaluation assesses output quality, and Audit tracks accountability.**

For example, when token consumption surges suddenly, Metrics quickly trigger an alert. Tracing back along the anomalous time window to locate high-consumption Traces reveals that a certain Agent invoked the model 12 consecutive times. As to whether these 12 invocations were necessary and whether the final answer was correct, that must be judged by evaluation rules.

Logs cannot be entirely replaced by Traces either. Traces excel at illustrating call relationships and latencies, whereas logs are better suited for recording discrete events and detailed exceptions. A practical best practice is to automatically attach `traceId` and `spanId` to logs. This allows you to jump directly from a Trace to correlated logs, or inspect the full call trace starting from an error log.

## How to Distinguish Trace, Span, Session, Run, and Attempt?

These concepts are often easily confused. OpenTelemetry clearly defines Trace and Span, while Session, Run, and Attempt are typically defined at the application level.

| Concept | Meaning | Example |
| --- | --- | --- |
| Session | A continuous conversational session | An 8-turn conversation between a user and a customer service Agent |
| Run | A single task execution | In turn 5, the user requests: "Help me apply for a refund" |
| Trace | An end-to-end call trace | From receiving the API request to returning the processed result |
| Span | A single operation within a Trace | Retrieving the knowledge base, calling the model, executing the refund tool |
| Attempt | A single try of a specific step | The 2nd retry after a model call timed out |

Synchronous requests are straightforward to understand: a Trace is created when the task begins and finishes when the response returns; a single Run typically maps cleanly to a single Trace.

For long-running tasks involving human-in-the-loop approvals or asynchronous resumption, this 1:1 mapping breaks down. For example, after an Agent submits an application, it may wait several hours for approval results. There is no need to keep the original Span open during this entire wait. When entering the waiting state, finish the current Trace and persist the `runId`; once approved, create a new Trace while continuing to reuse the original `runId`. This links both execution phases together without creating a Trace that spans hours or days.

A Session operates at an even higher scope. It is responsible for stringing together multi-turn conversations, where each turn or task execution can generate its own Trace. These IDs manage distinct layers:

```text
sessionId: Chains together the same multi-turn conversation
runId: Chains together a single task execution, including pause and resume
traceId: Identifies the call trace generated by an actual execution
spanId: Identifies an operation within the call trace
attempt: Identifies which attempt of the same step
```

![Hierarchical Relationship of Session, Run, Trace, Span, and Attempt](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-id-hierarchy-dcfffe2c.webp)

Retries must also be handled individually. Each attempt should create a new Span tagged with an `attempt` attribute indicating the iteration count. Otherwise, an initial timeout and a subsequent success will be conflated in the same record, making it difficult to reconstruct the real execution history later.

## How Should Spans Be Broken Down in an Agent Request?

The granularity of Span decomposition determines whether a Trace is genuinely useful. If broken down too coarsely, all you see is "Agent executed for 8 seconds." If broken down too finely, where every utility method becomes a Span, the trace will be cluttered with noise that does not help with troubleshooting.

Taking an Agent capable of querying orders and applying for refunds as an example, a Trace can be structured as follows:

```text
agent.run
├── ai.intent.classify
│   └── gen_ai.client.operation
├── ai.rag.retrieve
│   ├── gen_ai.client.operation        # Generate query embedding
│   ├── db.vector.client.operation     # Vector retrieval
│   └── ai.rag.rerank
├── invoke_agent                       # Execute customer service Agent
│   ├── gen_ai.client.operation        # First model call
│   ├── execute_tool                   # Query order
│   │   └── HTTP GET /orders/{id}
│   ├── gen_ai.client.operation        # Reasoning based on tool results
│   └── execute_tool                   # Create refund application
│       └── POST /refunds
└── ai.output.validate
```

![Span Breakdown Diagram for an Agent Request](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-agent-span-trace-c6f921f0.webp)

Notice that we do not create separate Spans for trivial methods like prompt template rendering or string concatenation. Generally, an operation deserves an independent Span only if it meets at least one of the following criteria:

- It calls an external system, such as a model provider, vector database, or business API;
- It represents a major business stage, such as retrieval, reranking, planning, or output validation;
- It has an independent timeout, retry, or fallback strategy;
- It requires separate tracking of latency, cost, error rate, or quality;
- When an issue occurs, developers genuinely need to verify whether it executed and how many times it ran.

At minimum, a Span must answer four questions: what was executed, when it started and ended, whether it succeeded, and what its relationship is to other steps.

### How Should Parent-Child Relationships Be Designed?

Synchronous calls typically use direct parent-child Spans. The parent Span represents a broader phase, while child Spans represent specific operations within that phase.

When an Agent calls multiple specialist agents in parallel, each specialist Span can be attached under the same orchestration parent Span. Their time intervals will naturally overlap, allowing the Trace UI to visually reflect their concurrency.

```text
invoke_workflow
├── invoke_agent: technical-analysis   ──────────┐
├── invoke_agent: sentiment-analysis   ───────┐  │ Parallel
└── invoke_agent: portfolio-manager            └── Aggregation
```

A Span can have only one parent Span. If an aggregation task is triggered jointly by multiple independent messages, you can select the current consumption operation as the parent Span and use Span Links to link other upstream contexts. Do not manually stitch together an unnatural tree that violates the Trace model just to represent "multiple parents."

### How Should Span Names Be Defined?

Span names should be stable and low-cardinality. Avoid placing user queries, order IDs, or full URLs directly into Span names.

Recommended:

```text
invoke_agent customer-service
execute_tool query_order
ai.rag.retrieve
POST /refunds
```

Not recommended:

```text
Answer user question: Why has my order 202608160001 not been refunded yet
Query order 202608160001
```

The latter pattern causes the number of unique Span names to grow boundlessly with user input, making them difficult to aggregate and significantly increasing storage and indexing overhead. Order IDs can be preserved as controlled attributes or hashed; they should never become part of the Span name.

### Has OpenTelemetry Unified Agent Spans?

OpenTelemetry already provides GenAI semantic conventions covering models, agents, and certain workflow operations. The current Agent Span documentation includes operation names such as `invoke_agent`, `invoke_workflow`, `plan`, and `execute_tool`.

However, as of this writing, both the [OpenTelemetry GenAI Semantic Conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/README.md) and the [Agent Spans Conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md) are marked as `Development`. This indicates that attributes and naming conventions are still subject to changes.

In engineering practice, prioritize reusing established standard fields, and introduce custom namespaces (e.g., `ai.rag.*`, `ai.guardrail.*`) for your own business phases. Simultaneously, record the convention version inside your instrumentation libraries so that future upgrades can be adapted centrally, rather than scattering vendor-proprietary fields throughout your business codebase as pseudo-standards.

## What Information Should Be Recorded in a Trace?

While recording more information makes troubleshooting easier, storage costs and data leak risks increase in tandem. In production, prioritize recording structured metadata first, and decide whether to capture raw content based on environment and access permissions.

### Request and Version Information

Every AI request should at least allow identifying the code and configuration that were running at that moment:

- `service.name`, environment, and service version;
- `sessionId`, `runId`, and tenant identifier;
- Versions of the Agent, Workflow, Prompt, and knowledge base;
- Canary groups, experiment buckets, and feature flags;
- Request entry point, caller identity, and region.

Recording only the prompt template text is insufficient. Even if the template has not changed, variations in the system prompt, few-shot examples, retrieved context, or model parameters can yield completely different outputs. Therefore, it is best to persist the version or hash of the final effective configuration.

### Model Invocation Information

A model Span typically needs to record:

- Model provider, requested model, and actual response model;
- Temperature, maximum output tokens, and whether streaming was enabled;
- Input tokens, output tokens, and cached tokens;
- Time to first token (TTFT) and total duration;
- Finish reason, rate limits, timeouts, and retry counts;
- Estimated cost or billing correlation ID.

Model aliases may resolve to different underlying versions. Recording only `model=smart-model` in business config makes it hard to verify which model actually executed. Whenever the provider response includes a specific model version or response ID, preserve it.

### RAG Retrieval Information

Valuable fields during the retrieval phase include:

- Knowledge base and index versions;
- Hashes or sanitized text of the original and rewritten queries;
- Retrieval strategy, filter conditions, `topK`, and similarity threshold;
- Recalled document IDs, scores, rankings, and data versions;
- Reranking model and pre-/post-rerank ordering;
- Document IDs actually injected into the final prompt;
- Query latency, returned count, and empty recall flags.

If you only log "vector database query succeeded," you still cannot determine whether the correct material was recalled when an erroneous answer occurs. At a minimum, retain document identifiers, versions, and scores. Whether full document text enters the Trace should be determined separately based on data classification levels.

### Tool Invocation Information

Tools represent an Agent's gateway to real business systems. It is recommended to record:

- Tool name, version, and call ID;
- Parameter summary or parameter hash;
- Permission verification and human approval results;
- Timeout, retries, idempotency key, and execution status;
- Result summary, business error code, and side-effect indicator;
- Downstream service Trace context.

A successful tool call does not necessarily mean business success. An HTTP 200 response body might contain `stock=0`, or a refund endpoint might return "duplicate request." Span status, HTTP status, and business outcome should be recorded separately.

### Agent and Workflow Information

Agent or workflow Spans should also capture:

- Agent role, version, and allowed toolset;
- Current step, loop count, and maximum iteration limit;
- Routing decisions, stop reasons, and fallback causes;
- Whether parallel branches succeeded, timed out, or were canceled;
- Which upstream results were actually utilized during aggregation;
- Structured validation results of the final output.

These fields answer a concrete question: on what information was the final answer actually generated? Especially in multi-Agent architectures, "specialist A completed" and "aggregation Agent utilized specialist A's result" are two distinct events that should be recorded individually.

## How to Distinguish Low-Cardinality and High-Cardinality Fields?

Observability systems must aggregate and index telemetry data. Improper field design will cause metric time series and Trace indexes to explode rapidly.

Low-cardinality fields have a bounded set of values and are ideal for metrics and Trace tags:

```text
model.provider = openai
model.name = gpt-x
agent.role = customer-service
tool.name = query_order
result.status = success
environment = production
```

High-cardinality fields have an enormous range of possible values; they belong primarily in Traces, and some should be kept unindexed:

```text
user.id
session.id
document.id
model.response.id
tool.call.id
```

Prompts, completions, tool parameters, and document bodies are not only high-cardinality; they can also be very long and contain sensitive data. They are better suited as controlled events, external content storage, or retained solely as hashes and object references.

Spring AI's observability design follows this exact principle: [low-cardinality keys go into Metrics and Traces, while high-cardinality keys go exclusively into Traces](https://docs.spring.io/spring-ai/reference/observability/index.html). When adding custom business telemetry, maintain this boundary.

## Which Metrics Should AI Applications Focus On?

Metrics should be designed around user experience, stability, cost, and quality. The following metrics are practical across most AI applications.

### Request-Level Metrics

- Request volume, success rate, and concurrency;
- End-to-end P50, P95, and P99 latencies;
- Timeout rate, cancellation rate, and fallback rate;
- Time to First Token (TTFT) and total response time;
- Traffic distribution across entry points, tenants, and versions.

Streaming interfaces must distinguish TTFT from total duration. Users typically care most about how quickly they see the first chunk of content, whereas batch tasks care about when the entire job finishes.

### Model-Level Metrics

- Model call count, error rate, and rate-limit throttling rate;
- Input, output, and total tokens;
- Per-request token distribution;
- Cache-hit tokens;
- Model retry and fallback frequencies;
- Cost broken down by model, scenario, and tenant.

Average token usage easily conceals long-tail anomalies; always monitor P95 and maximum values. When an Agent occasionally falls into a loop, the average may not shift noticeably, but high percentiles will expose the problem immediately.

### RAG-Level Metrics

- Zero-recall rate and effective document count;
- Latency for retrieval, reranking, and context assembly;
- Similarity score distribution;
- Document truncation rate and context tokens;
- Offline/online evaluation metrics like citation coverage and faithfulness.

A high similarity score does not guarantee a correct answer; it only reflects proximity in vector space. Ultimately, retrieval quality must be validated against labeled evaluation benchmarks and answer scoring.

### Agent and Tool-Level Metrics

- Model calls, tool calls, and iterations per Run;
- Tool success rate, business failure rate, and timeout rate;
- Invalid tool calls, duplicate calls, and rejected calls;
- Human-in-the-loop takeover rate and approval wait duration;
- Task completion rate, partial success rate, and failure cause distribution;
- Multi-Agent branch latency, missing result count, and aggregation fallback ratio.

Metric thresholds cannot be copied blindly from other projects. Invoking a model 6 times for a simple Q&A might be an obvious bug, whereas 6 model calls for a complex technical investigation could be completely normal. Establishing baselines by scenario and version first, and then alerting on deviations from baseline, is far more reliable than applying a single rigid threshold to all Agents.

## How to Use Traces to Locate Common AI Badcases?

A well-instrumented Trace allows you to troubleshoot layer by layer along the actual execution order. The following three common scenarios illustrate how this works.

### When RAG Returns an Incorrect Answer, Where Should You Look First?

Follow this inspection sequence:

1. Check the query rewriting Span to verify whether the search query drifted from the user's original intent;
2. Check the retrieval Span to confirm whether the correct document was recalled;
3. Check reranking results to see if the correct document was dropped outside `topK`;
4. Check context assembly records to verify whether documents were truncated due to token budget limits;
5. Check the final model Span to confirm which prompt version and document IDs were actually sent;
6. Finally, check citation verification and faithfulness evaluation to judge whether the model hallucinated beyond the provided materials.

This sequence dissects "the answer is wrong" into retrieval failure, ranking failure, context truncation, or generation hallucination, allowing targeted fixes.

### Why Did the Refund Tool Execute Twice?

First examine the count of `execute_tool` Spans and their `attempt` values. If the first call timed out and the Agent initiated a second call, verify:

- Whether both requests utilized the same stable idempotency key;
- Whether the downstream system actually processed the refund despite the first call timing out;
- Where the retry policy originated: the model, the Agent framework, or the HTTP client;
- Whether the Agent mistook an "unknown" status for a "failure" when tool results were lost;
- Whether downstream business ledgers and audit logs confirm that two side-effects occurred.

A Trace proves what calls the application initiated, but it cannot substitute for the refund system's internal transaction log. If an invocation times out, even if the Span status is `ERROR` or application attributes mark the task as `CANCELED`, you cannot assume that the remote operation has stopped.

### Why Did Multi-Agent Aggregation Miss One Result?

First locate the workflow Span, then inspect each sub-Agent's status and time interval:

- Did the sub-Agent actually start?
- Did it succeed, fail, time out, or get canceled?
- Was the result written back via message queue or shared state?
- When the aggregation Agent started, were all prerequisite results ready?
- Which sub-Agent result IDs were actually present in the aggregation input payload?
- When results were missing, did the system take the failure, wait, or fallback branch?

Many post-mortems overlook the "aggregation input." Having only the completion Spans of sub-Agents without the input manifest of the aggregation stage leaves you unable to tell whether the result was lost in transit or simply discarded by the aggregation Agent.

## How to Maintain Traces Across Multi-Agent Systems, Async Tasks, and Message Queues?

In single-threaded synchronous code, Trace context typically propagates automatically down the call stack. Once you switch threads, processes, or message queues, context propagation must be handled explicitly.

![Propagation of Trace Context Across Thread, Process, and Message Boundaries](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-context-propagation-17f1ed57.webp)

### How Does Context Propagate Across Services?

The [W3C Trace Context](https://www.w3.org/TR/trace-context/) specification defines the universal `traceparent` and `tracestate` headers. `traceparent` transmits the Trace ID, parent Span ID, and sampling flags, while `tracestate` carries vendor-specific metadata.

When calling downstream services via HTTP, RPC, or message queues, the sender must inject the context, and the receiver must extract it to create child Spans. Message queues typically place these fields in message headers rather than the business payload body.

Neither `traceparent` nor `tracestate` should ever carry business data such as user identity or order numbers. The W3C specification explicitly mandates avoiding personally identifiable information (PII) in these headers.

### Why Does Switching Threads Break the Trace Chain?

OpenTelemetry Java's current context is stored in `ThreadLocal` by default. When a task is submitted to an ordinary thread pool without auto-instrumentation or explicit wrapping, child threads cannot see the caller thread's context.

When using the OpenTelemetry API, capture the context before submitting the task:

```java
Context context = Context.current();

executorService.submit(context.wrap(() -> {
    supplementalAgent.run(task);
}));
```

`Runnable`, `Callable`, and `ExecutorService` all have corresponding context wrapper utilities; refer to the [OpenTelemetry Java API](https://opentelemetry.io/docs/languages/java/api/) for details.

If your project uses Spring Boot, prioritize using framework-autoconfigured HTTP clients, `TaskExecutor` instances, and Micrometer Context Propagation capabilities. When manually instantiating (`new`) clients or thread pools, automatic context propagation will frequently fail.

Virtual threads do not eliminate the fundamental requirement for Trace context propagation. While they resolve thread allocation costs and blocking concurrency constraints, they do not automatically deduce causal relationships between asynchronous tasks. Whether manual propagation is required still depends on your instrumentation library, executor setup, and context mechanisms.

### Can Streaming Invocations Always Correlate Automatically?

You cannot assume this blindly.

Taking Spring AI 2.0.0 documentation as an example, synchronous OpenAI and Anthropic calls correctly attach HTTP Spans under the model Span. However, the asynchronous path for streaming calls switches execution to `ForkJoinPool.commonPool()`, causing HTTP Spans to be recorded without becoming child nodes of the model Span. This is an explicit current limitation documented in the [Spring AI Official Observability Documentation](https://docs.spring.io/spring-ai/reference/observability/index.html#_chat_model).

This example highlights that even with framework-provided auto-instrumentation, you must verify the actual topology with integration tests. Cover synchronous calls, streaming calls, thread pools, virtual threads, message queues, and cross-service tool invocations to ensure `traceId` is never lost at boundaries.

### How to Correlate a Task Spanning Multiple Traces?

Asynchronous Agent tasks can run for a long time, often pausing to await human input. There is no need to keep a single Span open indefinitely.

Handle it as follows:

- Use a `runId` to correlate the entire business task;
- Create a new Trace for each actual execution phase;
- Save the previous Trace ID in the task state;
- Upon resuming execution, link the prior Trace via attributes or Span Links;
- Reconstruct task sequence using event timestamps and state versioning.

This preserves business continuity while avoiding ultra-long Spans that strain sampling logic and backend storage.

## Can Full Prompts and Tool Results Be Saved in Traces?

From a troubleshooting perspective, storing full content is most convenient. From security and compliance perspectives, it is usually the riskiest practice.

Prompts, model completions, and tool results may contain:

- User names, phone numbers, addresses, and ID credentials;
- Proprietary internal code, contracts, and financial data;
- System prompts, tool schemas, and security guardrails;
- Access tokens, session cookies, and database credentials;
- Copyrighted or permission-restricted material from third-party knowledge bases.

Therefore, production environments should default to capturing metadata and summaries, enabling raw content capture only on demand. Consider adopting this tiered strategy:

1. **Default Tier**: Capture structured information like versions, tokens, latency, status, document IDs, and parameter hashes.
2. **Sanitized Tier**: Capture prompts and outputs scrubbed of phone numbers, emails, tokens, and other PII.
3. **Restricted Debug Tier**: Temporarily enable full content only for specified environments, tenants, or Trace IDs, with significantly shorter retention windows.
4. **Audit Tier**: Log who requested, who approved, and who accessed sensitive Trace payloads.

Spring AI disables exporting prompts, completions, tool parameters, tool results, and vector search results by default precisely because these payloads can be voluminous and contain sensitive information. Similarly, content attributes in OpenTelemetry GenAI like `gen_ai.input.messages`, `gen_ai.output.messages`, and `gen_ai.system_instructions` are opt-in fields.

Beyond sanitization, you must simultaneously implement access control, in-transit and at-rest encryption, retention lifecycles, tenant isolation, and data deletion mechanisms. Microsoft's [Observability for Generative AI and Agentic Systems Guide](https://learn.microsoft.com/en-us/security/zero-trust/sfi/observability-ai-systems) similarly emphasizes that collection and retention scopes must strike explicit agreements between forensic requirements, data minimization, data residency, compliance, and permissions.

Certain data must never enter Traces under any circumstances, including plaintext passwords, long-lived secret keys, and full authentication tokens. Even with "admin-only" view permissions, the liability risk is never worth it.

## How Should Trace Sampling Be Designed?

While staging environments can run 100% trace sampling for short durations, continuous full-volume recording in production is prohibitively expensive. AI requests incur far higher Span counts, attribute sizes, and execution durations than typical APIs, necessitating a tailored sampling strategy.

### What Is the Difference Between Head Sampling and Tail Sampling?

Head sampling makes decisions the moment a request enters the system (e.g., randomly retaining 10% based on Trace ID). Its advantages are simplicity and predictable overhead; its drawback is that at decision time, it is unknown whether the request will ultimately fail or be unusually slow.

Tail sampling waits until more Spans of a Trace arrive before making a retention decision. It can selectively retain:

- Traces with errors or timeouts;
- Slow requests exceeding scenario-specific latency thresholds;
- Requests with abnormal token consumption or billing costs;
- Requests triggering fallbacks, rollbacks, or human takeovers;
- Requests tripping security policies or executing high-risk tools;
- Requests from canary versions and experimental groups.

Tail sampling requires the Collector to buffer Traces temporarily, increasing memory and latency overhead, and requires routing mechanisms to ensure all Spans of a given Trace reach the same Collector instance. OpenTelemetry Collector's [Tail Sampling Processor](https://explorer.opentelemetry.io/collector/components/contrib-tailsamplingprocessor?type=processor) is currently marked Beta for Traces; load-test capacity and drop behaviors thoroughly before production use.

![Differences Between Head and Tail Trace Sampling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-head-tail-sampling-0b2b02e6.webp)

### What Is a Practical Hybrid Sampling Strategy?

Production systems can adopt a tiered strategy:

```text
Ordinary successful requests: Low sampling rate
Errors, timeouts, and high-latency requests: Retain as much as possible
High Token, high cost, and abnormal loop iterations: Retain as much as possible
High-risk write tools, human approval, and security events: Route to independent audit pipeline
Canary versions and priority tenants: Increase sampling rate for a controlled duration
```

Ensure that sampling decisions remain consistent across a single Trace. If a root Span is retained but critical child Spans are dropped, you end up with an uninterpretable, broken call trace.

Do not rely on Trace sampling for audit data. For high-risk operations like refunds, wire transfers, or resource deletions, audit records must be retained independently per business and compliance mandates, even if the operational Trace was sampled out.

## How to Feed Production Traces Back into the Evaluation System?

The utility of Traces should not end at "looking up errors when things break." Production bad cases should continuously flow back through the following lifecycle:

```text
Production alert or user feedback
        ↓
Locate abnormal Trace
        ↓
Identify root cause and add manual annotations
        ↓
Sanitize and add to Badcase dataset
        ↓
Fix Prompt, RAG, tools, or orchestration logic
        ↓
Offline replay and regression evaluation
        ↓
Canary release and continuous observation
```

When replaying, distinguish between two goals.

The first is **reproducing the original bug**. This replay must freeze model versions, prompts, document snapshots, tool responses, stochastic parameters (temperature), and timeout settings to recreate initial conditions as faithfully as possible.

The second is **evaluating new versions**. Here, the same batch of historical inputs is fed to updated prompts, new models, or an overhauled knowledge base to compare correctness, task completion rate, latency, and cost.

Saving only the user's initial question makes precise reproduction nearly impossible later. At minimum, persist versions and snapshots of external dependencies. For dynamic data like live order states or stock prices, store the tool results returned at that time or trackable data versions; do not expect repeating the query days later to yield identical outputs.

For detailed discussion on Golden Sets, Agent evaluation, bad case feedback loops, and release gates, continue reading [How to Evaluate LLM Applications?](../llm-basis/llm-evaluation.md).

## How to Integrate Observability into Java / Spring AI Projects?

Spring AI provides out-of-the-box observation capabilities for `ChatClient`, Advisors, `ChatModel`, `EmbeddingModel`, `ImageModel`, tool calling, and `VectorStore`. When integrating, establish foundational tracing first, then supplement custom business Spans, followed by evaluation and audit integrations.

The following configuration examples are based on **Spring AI 2.0.0 and current Spring Boot 4.x configuration keys**. Dependencies and properties may vary across versions; always consult the corresponding official documentation when upgrading.

### How to Enable Spring AI's Built-in Tracing?

Spring Boot 4 can use `spring-boot-starter-opentelemetry` to export Traces via OTLP to an OpenTelemetry Collector or compatible backend. Key application-side configurations look like this:

```yaml
management:
  tracing:
    sampling:
      probability: 0.1
    export:
      otlp:
        enabled: true
  opentelemetry:
    tracing:
      export:
        otlp:
          endpoint: http://otel-collector:4318/v1/traces

spring:
  ai:
    chat:
      client:
        observations:
          log-prompt: false
          log-completion: false
      observations:
        log-prompt: false
        log-completion: false
        include-error-logging: false
    tools:
      observations:
        include-content: false
    vectorstore:
      observations:
        log-query-response: false
```

Spring Boot defaults to a sampling probability of 0.1. In development environments, you can temporarily raise this to 1.0 to inspect Trace topologies; in production, calibrate sampling based on traffic, payload size, and backend capacity.

All content-logging switches above are intentionally left disabled (`false`). Verifying that metadata and call traces are sufficient for troubleshooting before selectively opting in to content capture is much safer than dumping all prompts and completions into the observability platform from day one.

### Which Spans Must Be Added Manually?

Framework auto-instrumentation covers standard AI building blocks, leaving custom business orchestration for developers to instrument. Examples include:

- A complete Agent Run;
- Query rewriting, reranking, and context trimming;
- Workflow routing, parallel aggregation, and fallbacks;
- Structured output validation and safety checks;
- Human-in-the-loop approvals, task suspension, and resumption;
- Final business outcomes (e.g., whether a refund application was successfully created).

Spring Boot projects can directly leverage the Micrometer Observation API to wrap business phases:

```java
@Component
public class RagObservationService {

    private final ObservationRegistry observationRegistry;
    private final DocumentRetriever documentRetriever;

    public RagObservationService(ObservationRegistry observationRegistry,
                                 DocumentRetriever documentRetriever) {
        this.observationRegistry = observationRegistry;
        this.documentRetriever = documentRetriever;
    }

    public List<DocumentHit> retrieve(RagQuery query) {
        Observation observation = Observation
                .createNotStarted("ai.rag.retrieve", observationRegistry)
                .lowCardinalityKeyValue(
                        "ai.rag.strategy",
                        query.strategy().name()
                )
                .highCardinalityKeyValue(
                        "ai.rag.knowledge_base_id",
                        query.knowledgeBaseId().toString()
                );

        return observation.observe(() -> {
            List<DocumentHit> hits = documentRetriever.retrieve(query);
            observation.lowCardinalityKeyValue(
                    "ai.rag.result",
                    hits.isEmpty() ? "empty" : "hit"
            );
            observation.highCardinalityKeyValue(
                    "ai.rag.result_count",
                    Integer.toString(hits.size())
            );
            return hits;
        });
    }
}
```

This code snippet demonstrates the distinction between Span boundaries and cardinality keys. `ai.rag.result` takes only `empty` or `hit`, making it suitable for metric aggregations, whereas the hit count goes into the Trace. Real-world projects should also standardize error types and tag naming conventions, avoiding setting raw queries or document bodies as default tags.

If you simply want to add a Span over a stable method, you can also use [`@WithSpan` provided by the OpenTelemetry Java Agent](https://opentelemetry.io/docs/zero-code/java/agent/annotations/):

```java
@WithSpan("ai.output.validate")
public ValidationResult validate(AgentResponse response) {
    return outputValidator.validate(response);
}
```

When business code already uses Micrometer Observation, do not manually create duplicate OpenTelemetry Spans for the same operation. Standardize on one instrumentation entry point to avoid cluttered traces with duplicate nodes.

### How to Verify the Instrumentation Results?

Prepare an integration test suite covering at least these scenarios:

1. Standard RAG question answering;
2. Model timeout and subsequent retry;
3. Tool returning a business failure;
4. Parallel execution via thread pools or virtual threads;
5. Streaming model responses;
6. Calling downstream services via HTTP or message queues;
7. Agent suspension and subsequent resumption;
8. Prompts and tool payloads containing sensitive data.

When verifying, do not just check that "traces show up in the platform." Specifically confirm:

- Parent-child hierarchies and parallel timelines are rendered correctly;
- Each retry has an independent Attempt record;
- Error statuses, business outcomes, and cancellations are reflected accurately;
- Tokens, model versions, and document IDs can be queried;
- `traceId` remains consistent across thread and service boundaries;
- Sensitive fields are properly sanitized or completely excluded;
- Sampling policies preserve critical anomalous traces end-to-end.

Note that Spring Boot's current documentation points out that `@SpringBootTest` does not auto-configure tracing exporter components by default. If traces do not export in test environments, confirm that exporter beans are explicitly configured before suspecting context propagation failures.

## How to Choose an AI Observability Platform?

Before choosing a platform, clarify what capabilities your project actually lacks. Common capabilities fall into four categories:

1. **General APM Capabilities**: Distributed tracing, log correlation, metric alerting, and infrastructure monitoring;
2. **LLM Tracing Capabilities**: Visualization of prompts, models, tokens, costs, retrieval, and tool executions;
3. **Evaluation Capabilities**: Datasets, evaluators/scorers, experiment comparisons, bad case management, and release gating;
4. **Governance Capabilities**: Data masking, multi-tenancy isolation, RBAC permissions, retention policies, and auditing.

If your organization already has an established OpenTelemetry and APM infrastructure, configure your application to emit standard OTLP data and connect dedicated LLM visualization or evaluation tools as needed. This keeps network calls, database queries, and AI invocations within a unified distributed Trace.

If your project is still in early exploration, you can start with framework-native observability tools and an OpenTelemetry-compatible backend to validate essential Span hierarchies. Binding early to vendor-proprietary fields makes future migrations painful.

Looking at commercial and open-source offerings:

- [Alibaba Cloud ARMS](https://help.aliyun.com/zh/arms/application-monitoring/developer-reference/llm-trace-field-definition-description) showcases fields for Completion, RAG, Agent, and Tool, explicitly noting extensions built upon OpenTelemetry GenAI conventions;
- [Tencent Cloud CLS](https://cloud.tencent.com/document/product/614/133517) brings metrics, Trace call trees, and Session views together within a unified Agent observability console;
- [Apache SkyWalking 10.4 articles](https://skywalking.apache.org/zh/2026-04-05-virtual-genai-monitoring/) emphasize Java client data collection, TTFT, token consumption, and cost tracking. While these resources show real-world implementations, their Span types and extensions reflect specific product implementations rather than finalized universal standards.

When evaluating platforms, verify the following questions:

- Does it support standard OpenTelemetry, and which fields are proprietary extensions?
- Can it correlate standard HTTP, database, and message queue Spans?
- Do prompts and tool parameters support masking, encryption, and granular access controls?
- Can sampling rules be tailored by error status, latency, token count, and business attributes?
- Can Traces be easily exported into datasets for offline evaluation?
- Can data be isolated by tenant, deleted on demand, and governed by retention policies?
- If the observability platform experiences an outage, will it degrade or block core business requests?

Telemetry exports must be asynchronous, bounded in time, and throttled with queue limits. When the observability backend is unavailable, dropping non-critical telemetry is acceptable; dragging down the core Agent workflow is not. Where audit data demands strict reliability, rely on an independent, durable pipeline.

## What Are the Most Common Pitfalls When Implementing AI Observability?

### Only Recording a Single Model Invocation

An Agent Run often involves multiple model calls, retrieval phases, and tool invocations. Logging only a single "model invocation succeeded" at the outermost layer makes it impossible to locate root causes or detect internal loops and retries.

### Equating HTTP Success with Task Success

A tool returning HTTP 200 may indicate business rejection; a model completing its generation may produce an invalid answer. Transport status, execution status, business status, and quality ratings must be tracked independently.

### Exporting All Payloads by Default

While full prompts and tool outputs facilitate debugging, they create data leak risks, index bloat, and runaway storage costs. Default to recording metadata in production, enabling raw content capture selectively based on environment, permissions, and retention windows.

### Placing User Input into Metric Labels

User IDs, Session IDs, query texts, and order numbers create high-cardinality time series explosions. They belong in Traces or controlled logs, never as default metric tags.

### Relying on Auto-Instrumentation Without Verifying Context

Thread pools, asynchronous streams, message queues, and custom HTTP clients can all sever the trace chain. Auto-instrumentation reduces manual boilerplate, but you must still verify call topologies via integration tests.

### Losing Audit Records Along with Trace Sampling

Traces are meant for diagnostics and can be sampled. Audit logs for high-risk operations exist for compliance and accountability; their retention cannot depend on probabilistic trace sampling.

### Collecting Mountains of Traces Without Badcase Ingestion

If bad cases never enter evaluation datasets and fixes are not gated by regression testing, engineering teams will endlessly resolve recurring issues. Connect abnormal Traces, evaluation datasets, and release gates together.

## How to Answer AI Observability Questions in an Interview?

### What is the biggest difference between AI observability and traditional observability?

Traditional observability focuses on services, requests, and infrastructure resources. AI observability must additionally track models, prompts, tokens, retrieval, tools, and non-deterministic Agent execution paths. Because AI outputs are probabilistic and API success does not guarantee correctness, Tracing must be combined with Evaluation.

### Why are Metrics and Logs alone insufficient?

Metrics discover macro-level anomalies, while logs capture discrete events. An Agent request often involves multiple iterative model calls and tool executions; only Traces can intuitively reconstruct their sequence, concurrency, latencies, and causal dependencies.

### How should Spans be broken down in an Agent Trace?

Start with a root Span representing the Run, then create child Spans along key phases: model calls, retrieval, reranking, tool execution, sub-Agents, and output validation. Instrument operations that require independent tracking, retries, timeouts, or debugging; avoid cluttering traces with trivial utility methods.

### How do you diagnose an incorrect RAG answer?

Follow the Trace to inspect query rewriting, recalled documents, rerank ordering, context clipping, prompt version, and raw model output. Then evaluate citations and faithfulness to distinguish whether the error stemmed from retrieval failure or model hallucination.

### How do you preserve the call chain across parallel multi-Agent executions?

Have all sub-Agent Spans inherit from the same workflow parent context. Explicitly propagate Context across thread switches (or leverage framework context propagation), and inject/extract W3C Trace Context when crossing service and message boundaries. At the aggregation phase, record which sub-Agent outputs were actually consumed.

### Should full prompts and model answers be written into Traces?

Not by default in production. Record versions, tokens, latencies, hashes, and status codes first. Enable full content temporarily only in controlled environments or for specific requests, combined with data masking, RBAC, encryption, retention limits, and access auditing.

### How do you choose between head sampling and tail sampling?

Head sampling is simple and has predictable overhead, but it cannot know in advance whether a request will fail or be slow. Tail sampling can selectively retain errors, slow requests, and high-token traces, at the expense of Collector buffering and memory overhead. Real-world systems typically use low-ratio head sampling combined with tail rules for anomalies and high-risk traffic.

### What is the relationship between Trace and Evaluation?

Trace reconstructs "what the system did," while Evaluation assesses "how well it performed." Production bad cases captured in Traces can be sanitized and fed into evaluation sets for offline replay, version comparisons, and release gating.

## Summary

Successful AI observability ensures that an AI request can be fully reconstructed. Adding another monitoring dashboard does not fix missing data or severed trace chains.

A production-grade troubleshooting solution must at least accomplish the following:

- Differentiate Session, Run, Trace, Span, and Attempt;
- Cover the model, RAG, tools, Agent logic, and ultimate business outcomes;
- Propagate Trace context correctly across threads, services, and message queues;
- Layer low/high-cardinality fields, metadata, and sensitive content appropriately;
- Combine head and tail sampling to control costs while retaining critical anomalies;
- Channel production Traces back into badcase datasets, evaluation suites, and release gates;
- Keep observability tracing separate from compliance business auditing.

When production once again encounters "the API returned 200, but the answer is wrong," an HTTP 200 log is completely useless. Only by tracing back to the exact model, materials, tools, versions, and intermediate execution results can an Agent system have a solid foundation for continuous troubleshooting and improvement.

## References

- [OpenTelemetry: Generative AI Semantic Conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/README.md)
- [OpenTelemetry: Semantic Conventions for GenAI Agent Spans](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md)
- [OpenTelemetry: Semantic Conventions for GenAI Metrics](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-metrics.md)
- [OpenTelemetry: Java API and Context Propagation](https://opentelemetry.io/docs/languages/java/api/)
- [OpenTelemetry: Java Agent Instrumentation Annotations](https://opentelemetry.io/docs/zero-code/java/agent/annotations/)
- [OpenTelemetry Collector: Tail Sampling Processor](https://explorer.opentelemetry.io/collector/components/contrib-tailsamplingprocessor?type=processor)
- [W3C: Trace Context](https://www.w3.org/TR/trace-context/)
- [Spring AI: Observability](https://docs.spring.io/spring-ai/reference/observability/index.html)
- [Spring Boot: Tracing](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)
- [OpenAI Agents SDK: Tracing](https://openai.github.io/openai-agents-python/zh/tracing/)
- [Microsoft: Observability for Generative AI and agentic AI systems](https://learn.microsoft.com/en-us/security/zero-trust/sfi/observability-ai-systems)
- [Microsoft Foundry: Set up tracing in Microsoft Foundry](https://learn.microsoft.com/zh-cn/azure/foundry/observability/how-to/trace-agent-setup)
- [Alibaba Cloud ARMS: LLM Trace Field Definition Description](https://help.aliyun.com/zh/arms/application-monitoring/developer-reference/llm-trace-field-definition-description)
- [Tencent Cloud CLS: Agent Observability Application Details](https://cloud.tencent.com/document/product/614/133517)
- [Apache SkyWalking: LLM Application Monitoring Based on SkyWalking 10.4](https://skywalking.apache.org/zh/2026-04-05-virtual-genai-monitoring/)
