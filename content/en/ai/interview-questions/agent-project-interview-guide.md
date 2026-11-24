---
title: "How to Pitch Agent Projects in Interviews: From System Architecture and Tech Stack Selection to Badcase Postmortems"
description: "A comprehensive, practical methodology for preparing Agent project interviews: from project review worksheets, system architecture, and request pipelines, to technical trade-offs across Agent/Workflow, RAG, Memory, and MCP, through tool governance, evaluation metrics, and badcase postmortems."
category: AI
tag:
  - AI Interview
  - Agent Interview
  - Project Experience
head:
  - - meta
    - name: keywords
      content: Agent project interview, Agent interview, AI project interview, Agent system architecture, Agent tech stack selection, Agent badcase, Agent evaluation, AI application development interview
lang: en
sourceRef: zh-ref/ai/interview-questions/agent-project-interview-guide.md
---

Interviews in the Agent / AI application track rarely stop at reciting basic concepts. Instead, interviewers will drill down deeply into your actual project: why you designed it this way, what production issues occurred, and how you diagnosed and resolved them.

If, prior to the interview, you only memorize core buzzwords like ReAct, RAG, Memory, MCP, and Function Calling, you will usually falter when faced with probing follow-ups:

1. Did you genuinely build an Agent, or could this problem have been solved with a standard API endpoint or a deterministic workflow?
2. When a request arrives, which components does it traverse, and how do state and data flow across them?
3. Under what specific constraints was each critical architectural choice made, and what was the trade-off cost?
4. What failures occurred in your project, and how did you locate the root cause, fix it, and prevent recurrences?

To make these concepts intuitive and concrete, this article uses an intelligent after-sales support ticket Agent as a running example to connect all these questions.

Whether your own project is similar or completely different does not matter—the methodology shared here is universal. When preparing your personal project, simply swap in your actual business context, responsibilities, data volumes, and quantitative metrics.

## What Are Interviewers Really Evaluating in an Agent Project?

First, understand why interviewers ask these questions. Unlike traditional CRUD applications with mature, standardized evaluation criteria, an interviewer cannot gauge your proficiency solely because you claim you "built an AI app." They rely on layered follow-up questions to verify three core things:

1. **Whether the project is authentic.** A candidate who truly built a production system can readily discuss real-world constraints, data distributions, and painful pitfalls; someone who merely memorized a tutorial can only recite architectural diagrams. By the third level of follow-up questions, the gap becomes instantly apparent.
2. **Whether you possess technical decision-making capability.** In the Agent domain, there is no silver bullet. The same problem could be solved via Prompts, deterministic workflows, RAG, tool calling, or Multi-Agent orchestration. The interviewer wants to know: given your specific business constraints, can you weigh the trade-offs and select a rational approach, rather than blindly copying what a blog post, tutorial, or LLM generated for you?
3. **Your awareness of system boundaries.** Model outputs are probabilistic, state can fall out of sync, and tools will inevitably fail. Engineers who anticipate these failure modes and implement robust engineering guardrails are the ones qualified to deploy AI to production.

Accordingly, why are answers like "our project achieved great results," "the architecture is highly scalable," or "model accuracy was high" ineffective? Because they are unsubstantiated assertions rather than rigorous arguments. The information conveyed to the interviewer is effectively zero: they can verify neither authenticity nor the depth of your personal involvement. A truly differentiated answer couples constraints, choices, costs, and empirical evidence together:

> Under [specific constraints], I chose [architectural decision]; it solved [specific problem] while introducing [specific trade-off cost]; and finally, I verified the effectiveness of this decision using [verifiable empirical evidence].

If any of these four elements is missing, the response collapses:

- Missing **constraints**: The choice degrades into "everyone does it this way," demonstrating no engineering judgment.
- Missing **trade-off costs**: This signals you never shipped to production—every architectural choice has costs; decomposing into Multi-Agent introduces significant debugging complexity, context handover overhead, and latency spikes.
- Missing **empirical evidence**: Performance remains subjective wishful thinking; only statements like "tool selection error rate dropped from 8% to 2% across a 200-sample evaluation dataset" can be audited.
- Missing **alternatives**: The interviewer cannot confirm whether you evaluated trade-offs or merely knew a single hammers-and-nails pattern.

For instance, asserting "We used Multi-Agent to improve performance" reveals nothing about why you decomposed the system or what trade-offs were incurred. Instead, explain the actual decision journey:

> Initially, we used a single Agent. As tool count expanded, the model frequently confused policy search with ticket creation tools. Rather than prematurely splitting into Multi-Agent, we first pruned the toolset, rewrote tool descriptions with strict contracts, and added routing evaluation suites, reducing selection errors from 8% to 3%. Later, when separate business domains required strictly isolated contexts and independent cross-team maintenance, we officially split the Agents by domain. The cost was adding an extra routing hop that introduced several hundred milliseconds of latency. To mitigate this, we implemented a lightweight intent classification router rather than introducing yet another heavy 'Manager Agent.'

Comparing the two reveals an immediate contrast: the original response only stated "what was used," whereas the expanded narrative conveyed the symptom (tool misselection), the intervention (governing tools before splitting), the alternative (improving single-agent without decomposition), the empirical basis (routing evaluation data), and the cost (added latency and its mitigation). The interviewer can simultaneously verify both the project's authenticity and your decision-making maturity—delivering vastly higher informational density than merely rattling off framework names.

Furthermore, this answer proactively embeds hooks for subsequent inquiries—how the routing evaluation was designed, why an LLM router was avoided in favor of intent classification, and how context was handed over. These hooks should all be areas you have prepared thoroughly in advance, steering deep inquiries onto your home turf rather than getting cornered in blind spots.

## What Belongs in a Project Review Worksheet?

Before preparing your narrative, we strongly recommend auditing your project against the review worksheet below. This worksheet documents hard facts you can produce when pressed during follow-ups; it is an internal audit tool, not a resume summary.

| Project Element | Content That Must Be Clarified | Common Vague Buzzwords |
| --------------- | ------------------------------ | ---------------------- |
| Business Problem | Who encountered what concrete problem in what scenario? | "Improved user experience" |
| Success Criteria | What precise outcome constitutes task completion? | "Delivered more accurate answers" |
| Input and Output | User input, final system artifact, whether external state is mutated | "Supported natural language interactions" |
| Legacy Baseline | Deficiencies of manual workflows, rule engines, or vanilla RAG | "Traditional approaches weren't smart" |
| Personal Role | Modules, architectural decisions, and troubleshooting you personally owned | "Participated in overall development" |
| Key Constraints | Latency, cost, permissions, data availability, model limits, and deadlines | "Required high availability" |
| Solution Choice | Candidate alternatives, rationale for selection, and known trade-off costs | "Chose a framework after investigation" |
| Quality Evidence | Datasets, metric definitions, baselines, sample sizes, and eval versions | "Boosted accuracy by 30%" |
| Failure Cases | User input, Trace, root cause, code fix, and regression test case | "Fixed after optimizing Prompts" |
| Evidence Artifacts | Code classes, test cases, Traces, datasets, or Git commit hashes | "Implemented in the codebase" |

If any cell lacks factual support, leave it blank for now. In particular, do not fabricate numbers for QPS, accuracy, or labor savings. When interviewers probe into statistical methodology, measurement windows, and baseline comparators, fabricated metrics will quickly unravel.

For personal projects not yet running in production, you can still provide credible evidence: fixed test suites, reproducible Traces, error classification taxonomies, load test benchmarks, and design trade-offs. The key is to be transparent: "This was measured on an offline benchmark dataset," rather than dressing it up as production telemetry.

State clearly which maturity stage the project occupies: getting a demo working, completing offline evaluations, running a canary pilot, and running full production traffic are vastly different. If you have no real end users, discuss evaluation test sets and fault injection; if you have had no production outages, discuss architectural risks identified during design reviews and failover runbooks, but never relabel simulated experiments as production incidents.

Your personal role can be crisply articulated in one sentence: what the team delivered as a whole, which specific slice you personally owned, which decisions or troubleshooting efforts you personally drove, and what parts were owned by teammates. This is far more credible than claiming "I built the entire Agent platform," and keeps all your subsequent answers grounded within a clear, defensible scope.

## How to Pitch an Agent Project with a Concrete Case Study

Suppose your project is an intelligent after-sales support ticket Agent. Users describe issues in natural language; the system queries order records, retrieves after-sales policies, identifies missing information, and creates a formal ticket after obtaining explicit user confirmation.

This case intentionally combines three distinct technical capabilities:

- Retrieving after-sales policies constitutes **RAG**;
- Querying orders and creating support tickets constitutes **Tool Calling**;
- Deciding whether to continue querying, ask clarifying questions, or finalize the workflow based on intermediate information constitutes **Agent Decision-Making**.

Critically, "creating a ticket" mutates external system state. It cannot rely merely on a model outputting valid JSON. Permission checks, user confirmation, idempotency, and execution verification must all be strictly guaranteed by the business backend.

The Agent Loop within the project can adopt a ReAct-style execution pattern: the model proposes the next action, receives the environment's returned Observation, and subsequently decides whether to invoke another tool or conclude the task.

ReAct means interleaving actions and observations sequentially; merely invoking a tool once does not constitute an Agent architecture. Production Traces should record actions, tool execution results, state summaries, and auditable evidence, rather than storing the model's internal chain-of-thought tokens.

### How to Deliver the 30-Second Elevator Pitch

The 30-second pitch answers only what the project is, why an Agent was required, what you personally owned, and what was the hardest engineering challenge.

Using the intelligent after-sales ticket Agent as an example:

> I built an intelligent after-sales ticket Agent. Beyond basic knowledge base Q&A, it dynamically queries orders, retrieves warranty policies, prompts users for missing details, and creates support tickets upon user confirmation. Architecturally, we adopted a hybrid model pairing deterministic workflows with local Agent Loops: authentication, permission validation, user confirmations, and ticket creation are deterministic workflow nodes, while the LLM handles intent understanding, slot filling, and next-step tool selection.
>
> I primarily owned Agent orchestration, tool governance, and evaluation harness design. The two most challenging issues were tool misselection among similar APIs and ambiguous ticket creation states during network timeouts, which we resolved via strict tool contracts and an 'idempotency key + status polling + reconciliation' protocol.

Never delve into excessive details here. The smart tactic is to deliberately leave hooks for areas you have prepared thoroughly: why a hybrid architecture was chosen, how tool governance was executed, why mutations cannot be blindly retried, and how evaluations were structured.

### How to Expand into the 3-Minute Version

The 3-minute version should follow this sequence:

1. Business problem and measurable success criteria;
2. End-to-end request lifecycle;
3. Two critical technical decisions with trade-offs;
4. One representative badcase postmortem;
5. Quantitative outcomes and your personal ownership boundaries.

Avoid reciting tech stacks like "Spring AI, Redis, Milvus, MCP..." in isolation. Technologies should only appear in the context of concrete architectural decisions, not as an abstract laundry list.

## How to Explain System Architecture Through a Single Request

Saying "we adopted a layered architecture" is too abstract. In an interview, guide the interviewer through the lifecycle of a single request first, then loop back to explain each tier's responsibilities.

![AI Agent Core Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-core-arch-dc0d3123.png)

Taking "My headphones from this order are broken, please help me file an after-sales ticket" as an example, a single request flows through the following stages:

1. **Ingress Layer:** Handles authentication, tenant identification, rate limiting, and assigns unique `requestId` and `runId` identifiers.
2. **Orchestration Layer:** Loads current task state and verifies whether mandatory prerequisites (e.g., order ID) are present.
3. **Agent Decision:** Based on available tools and context, the Agent selects the order lookup tool. The execution layer verifies that the authenticated user actually owns that order.
4. **Context Injection:** Based on the purchased SKU, purchase date, and reported malfunction, the system retrieves applicable warranty policies and injects the retrieved evidence into the active context.
5. **Slot Filling / Drafting:** If information is incomplete, the Agent asks clarifying questions; if prerequisites are satisfied, it generates a structured ticket draft.
6. **HITL Confirmation:** Before mutating external state, the system presents key ticket fields to the user and awaits confirmation. Once confirmed, backend permissions, business constraints, and idempotency keys are validated.
7. **Execution & State Mutation:** When the ticket service returns, the system does not simply trust a raw "success" string from the model; it validates and persists the business ticket ID and finalized status.
8. **Telemetry & Governance:** Logs the model calls, prompt versions, retrieved chunks, tool executions, user approvals, latencies, and outcomes to enable evaluation and badcase trace replay.

Mapped to system layering, this can be condensed into seven logical tiers:

| Layer | Primary Responsibility | Responsibilities That Must Never Be Delegated to LLMs |
| ----- | ---------------------- | ----------------------------------------------------- |
| Ingress Layer | Auth, tenant routing, rate limiting, streaming sessions, request IDs | Identity boundaries and tenant isolation |
| Orchestration Layer | Workflow, Graph, Agent Loop, termination conditions | Timeout budgets, max step limits, mandatory branching |
| Model Layer | Model routing, prompt templates, structured output parsing | Provider failover and hard token cost limits |
| Context Layer | RAG retrieval, chat history, Memory, context compaction | Access control filtering and ground-truth validation |
| Tool Layer | Tool discovery, parameter schema validation, execution, result serialization | Business invariant checks, authorization, transactions, idempotency |
| State Layer | Task state, checkpoints, business artifacts, memory store | Authoritative business state consistency |
| Governance Layer | Distributed tracing, evaluation, audit logging, alerting, canary rollouts | Release gates and high-risk action approval |

If your project does not feature this many independent services, do not artificially claim you have seven microservices. These describe logical responsibilities, which early on can comfortably reside in a single monolithic service. Interviewers value clear responsibility boundaries, not service bloat.

## What Questions Must Tech Stack Selection Answer?

The first five questions justify each architectural choice, while the sixth tests whether the solution withstands changing requirements:

1. What were the specific business constraints at the time?
2. What alternative candidate solutions were evaluated?
3. Why was the chosen approach superior under those constraints?
4. What trade-offs were sacrificed, and how were those costs mitigated?
5. What evaluation metrics or runtime telemetry verified this choice?
6. If constraints change, under what specific conditions would you migrate to an alternative?

### Why Use an Agent Instead of a Deterministic Workflow?

A deterministic Workflow can inspect intermediate state, follow conditional branching, and even host an Agent within a specific node. When deciding on an architecture, clarify whether the next step is governed by predefined code/graph rules, or whether an LLM must dynamically select actions, tools, and execution paths at runtime.

In our after-sales scenario, authentication, user confirmation, ticket submission, and audit logging are deterministic and must be governed by a Workflow. Conversely, user input can be wildly unpredictable—ranging from a brief "it's broken" to providing order IDs, malfunction photos, and previously attempted troubleshooting steps all at once. When candidate execution paths cannot be enumerated via static rules and empirical evaluations prove model decision-making delivers higher completion rates, the specific sub-loop of querying orders, retrieving policies, or prompting for clarifications is well-suited for an Agent.

Conversely, if ticket categories, mandatory form fields, and resolution rules are strictly defined and stable, a pipeline of "intent classification + form slot-filling + deterministic rules" is usually sufficient. A natural language interface by itself does not justify introducing an autonomous Agent.

This scenario is ideally served by a hybrid architecture:

> Enforce safety boundaries using deterministic Workflows, and embed localized Agent Loops only where execution paths are genuinely unpredictable.

For detailed comparisons between Workflows, Graphs, and Loops, see [Workflow, Graph, and Loop in AI Pipelines](../agent/workflow-graph-loop.md).

### Why Start with a Single Agent Before Multi-Agent?

A single Agent features simpler state management, shorter trace graphs, and significantly easier evaluation. Having many tools does not necessitate splitting into multiple Agents. Before introducing Multi-Agent complexity, try:

- Dynamically filtering tools based on scenario context;
- Merging overlapping tool capabilities;
- Rewriting tool names, descriptions, and argument JSON schemas;
- Using deterministic code routing for clearly bounded classifications;
- Isolating sub-contexts for complex subtasks.

Only when tasks can be decoupled into independent modules, and different roles require extensive specialized context, distinctly separated tool permissions, or independent team ownership, will the benefits of Multi-Agent outweigh its severe communication, latency, cost, and debugging overhead.

Multi-Agent does not imply parallel execution. It can execute in a fixed pipeline, run across independent parallel branches, rely on dynamic manager delegation, or execute turn-by-turn handoffs to domain specialists.

In an interview, clarify: is the topology hardcoded or model-driven, is context shared or isolated, what schema contract governs inter-agent communication, how are partial failures and concurrent write conflicts resolved, and who bears ultimate accountability for the final outcome.

For a comprehensive breakdown of Multi-Agent architectures, refer to [Multi-Agent Collaborative System Design](../agent/multi-agent.md).

### How Do You Distinguish RAG, Memory, Context, and State?

These four concepts are frequently blurred together in project overviews.

The table below presents the precise engineering taxonomy used in our after-sales project:

| Concept | Concrete Representation in After-Sales Scenario | Core Question It Answers |
| ------- | ----------------------------------------------- | ------------------------ |
| RAG | Warranty policies, product manuals, repair service center directories | What relevant evidence exists in external knowledge repositories? |
| Memory | User preferences, explicitly verified facts permitted for long-term retention | What must be remembered across turns or across independent sessions? |
| Context | Dynamic instructions, retrieved evidence, available tool schemas, and active history passed to the LLM in this turn | What can the model see during this specific invocation? |
| State | Current order ID, missing form slots, approval status, executed actions, generated ticket ID | What stage has the current business task reached? |

In some frameworks, short-term memory is implemented as part of Agent State, and checkpoints may serialize State snapshots. Terminology varies across frameworks, but architectural boundaries must remain strict: Memory, Agent State, and workflow checkpoints can never substitute for the authoritative transactional business database. Relying solely on raw conversation history to determine "whether a support ticket was already created" is an extremely fragile anti-pattern.

For in-depth principles, see [Context Engineering in Practice](../agent/context-engineering.md) and [AI Agent Memory Systems Deep Dive](../agent/agent-memory.md).

If your project genuinely employs long-term Memory, be prepared to answer: what data is allowed to be written, who confirms the ground truth, what is the TTL retention policy, how can users inspect and delete memories, and how is poisoned or malicious content purged. If you merely stored several turns of chat history, describe it honestly as conversation history rather than masquerading it as a long-term memory system.

Similarly, RAG cannot be described simply as "we connected a vector database." Be ready to explain document parsing and chunking strategies, index update cadences, hybrid retrieval fusion, whether a cross-encoder Reranker is used, how Top-K is tuned, where ACL filters are applied, and how citations and knowledge versions are audited. During evaluation, decouple retrieval recall from generation quality to pinpoint failure modes accurately.

### What Are the Respective Roles of Function Calling, MCP, and Agents?

Function Calling provides the structured protocol for a model to output arguments expressing "which function it wishes to invoke"; MCP standardizes context, resource, and tool interchange across Hosts, Clients, and Servers; an Agent orchestrates goals and state to determine what action to take next.

They operate at entirely different architectural tiers and cannot replace one another.

If tools only serve a single monolithic application, registering local native functions is far simpler. If identical capabilities must be shared across multiple independent Agents, IDEs, or client runtimes, evaluating MCP becomes worthwhile. Even with MCP, authorization, argument validation, and side-effect governance must still be enforced within your backend business layer.

![Function Calling Complete Invocation Chain: Model generates intent, backend executes tool](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-function-call-38a32aa6.png)

This topic is a frequent interview target; review [LLM Structured Output Deep Dive](../llm-basis/structured-output-function-calling.md) and [Model Context Protocol (MCP) Deep Dive](../agent/mcp.md) for full context.

### How Did You Select the Underlying Model?

Never use "model X had the best benchmark score" as your sole justification. Model selection must evaluate a multi-dimensional matrix:

- Task-specific completion rate on your domain evaluation set;
- Reliability in tool selection and argument generation;
- Long-context fidelity and multi-turn stability;
- Time-to-First-Token (TTFT) and end-to-end response latency;
- Input, output, and prompt caching token costs;
- Support for structured JSON schema outputs, tool calling, and multimodal inputs;
- Data compliance, data residency, and provider uptime SLAs.

The most robust engineering strategy is to first establish a quality ceiling using a top-tier flagship model, and then systematically benchmark smaller, cost-effective models on individual task nodes. Intent classification, slot extraction, and schema transformations rarely require flagship models; complex planning, multi-step reasoning, and synthesis often do. Every model switch must be validated against the identical Golden Set, rather than relying on qualitative manual spot checks.

### Why Introduce an AI Model Gateway?

When a project connects to a single model provider during early proof-of-concept stages, calling the provider's API directly is acceptable. Once multiple providers are introduced, or multiple microservices share model infrastructure, a dedicated Model Gateway is required to centralize authentication, dynamic routing, rate limiting, quotas, retries, fallbacks, cost attribution, and auditing.

For concrete architectural designs, refer to [Deep Dive into LLM Gateways](../system-design/llm-gateway.md).

### Which Capabilities Come from Frameworks vs. Custom Implementation?

When citing frameworks in interviews, explicitly specify versions and functional boundaries. Just because a framework manages a tool loop does not mean it handles business state persistence, authorization, idempotency, or auditing.

Taking the implementations audited for this guide: in Spring AI 2.0.0, `ToolCallingAdvisor` and `ToolCallingManager` handle the tool calling loop, and `ToolCallbackResolver` dynamically resolves tools; however, whether a user is authorized for a refund or requires manager approval remains entirely governed by custom business code. In AgentScope Java 2.0.1, `AgentStateStore` serializes session state, but it is not an enterprise order database or workflow checkpoint store; its `streamEvents()` emits runtime events, which is not equivalent to an end-to-end persistent distributed tracing pipeline.

If your project used different versions or frameworks, review their exact APIs. In interviews, divide your answer cleanly into two sentences: "What the framework provided out of the box" versus "What production infrastructure we built on top of it," avoiding attributing framework defaults to your own architectural design.

## Why Can't Tool Execution Rely Solely on Model Output?

A model outputting syntactically valid parameters merely proves schema compliance; it does not authorize the action for execution.

A production-grade tool execution pipeline enforces multiple defensive checkpoints:

1. **Schema Validation:** Verifies field types, enums, regex patterns, and mandatory keys.
2. **Business Rule Validation:** Verifies order status, refund eligibility windows, and field combinations against business invariants.
3. **Identity and Access Control:** Verifies that the authenticated caller has permission to operate on the target resource.
4. **Risk Categorization:** Applies differentiated execution strategies for read-only, reversible mutations, and irreversible mutations.
5. **Human-in-the-Loop Confirmation:** Prompts users with finalized parameters before triggering high-risk actions.
6. **Idempotency Control:** Prevents duplicate side effects from network retries or repeated user submissions.
7. **Execution Verification:** Queries downstream systems to verify that state mutations actually completed as expected.
8. **Audit Logging:** Immutably records who executed what action, with what arguments, at what timestamp.

![Tool Calling Security Risk Layering: Matching control strategies to risk levels](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-tool-call-sec-036eb7f8.png)

A practical tool risk taxonomy:

| Risk Level | Concrete Examples | Recommended Enforcement Strategy |
| ---------- | ----------------- | -------------------------------- |
| Low-Risk Read-Only | Querying public policies, fetching user's own orders | Permission checks, argument bounds, timeouts, and auditing |
| Medium-Risk Reversible Write | Saving draft tickets, adding tags | Idempotency, result verification, undo/rollback entrypoints |
| High-Risk Mutation | Processing refunds, canceling orders, dispatching customer notifications | Explicit confirmation, threshold limits, approvals or human takeover |
| Prohibited Auto-Execution | Operations exceeding auth scope or impossible to compensate | Outright rejection, providing explanations and human routing only |

Tool descriptions themselves must undergo evaluation. Ambiguous naming, overlapping responsibilities, and excessively verbose return payloads will cause the model to misselect tools or pollute the context window.

Tool outputs, RAG passages, web pages, and MCP server descriptions can all harbor indirect Prompt Injection payloads. When injected into downstream context turns, they remain untrusted user data and must never override backend identity, resource permissions, or tool risk levels. For a complete threat model, see [LLM/Agent Security in Practice](../system-design/llm-security.md).

## How Do You Architect Stability in Agent Projects?

### Why Can't a Timeout Be Treated as Execution Failure?

When interviewers ask "What happens when a model or tool times out?", many candidates reflexively reply "Just retry a few times." If the interviewer follows up with "What if the write operation succeeded on the backend server, but the HTTP response was lost in transit?", that naive answer breaks down.

Retrying blindly under that condition risks creating duplicate support tickets or processing double refunds.

The misconception lies in the definition of a timeout. A timeout merely indicates the caller did not receive an answer within its deadline; the server could be in any of three distinct states: the request never arrived, it is currently processing, or it completed successfully but the response dropped over the network. Because the caller cannot differentiate between these states, a timeout cannot be treated as a failure.

For read-only operations, idempotent retries within a bounded time budget are safe. For state-mutating write operations (such as creating a ticket or issuing a refund), blind retries cause disastrous duplicate side effects.

A robust architecture enforces:

1. When initiating a logical action, generate a deterministic, unique `actionId` and bind it into the business idempotency key; this same ID is reused across SDK retries, message redeliveries, and manual retries, while brand-new actions generate new IDs;
2. The destination service leverages unique database constraints or idempotency records to intercept duplicate requests;
3. If an identical idempotency key arrives with conflicting arguments, explicitly reject it with a client error rather than silently returning the cached response of the first call;
4. Following a timeout, query execution status using the idempotency key before attempting any further action;
5. If status remains indeterminate, escalate to async reconciliation or human review rather than executing endless retries;
6. Write the finalized business entity ID back into the task state and audit logs.

![Model Call Retry and Idempotency Workflow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-api-engineering-retry-idempotency-329ec34c.webp)

Retries also require exponential backoff, randomized jitter, maximum retry limits, overall deadline timeouts, and retry budgets. Model SDKs, API gateways, HTTP clients, tool adapters, and workflow nodes must never each retry three times independently, as this results in multiplicative amplification. The correct pattern is sharing a global deadline and retry budget across layers, recording the `attempt` counter within each span's trace.

Caller timeouts, cancelled Futures, or closed client SSE connections do not mean background writes have halted. Side effects may complete shortly thereafter, so cancellation handling must still preserve idempotency tracking, status verification, and reconciliation. Deterministic failures (validation errors, unauthorized access, business rule rejections) should fail fast immediately; only transient errors (rate limits, network drops) are eligible for bounded retries. For details, see [Timeout and Retry Mechanisms Deep Dive](../../high-availability/timeout-and-retry.md) and [API Idempotency Architecture](../../high-availability/idempotency.md).

### How Do You Degrade When Models or Tools Suffer Extended Outages?

Retries handle transient glitches like momentary rate limits or network blips. When a model provider suffers a sustained outage or a tool consistently errors out, exhausting retry budgets only inflates user latency. Systems must trip circuit breakers, cease routing traffic to the failing dependency, and—depending on task risk—switch to fallback models, return cached responses, degrade to partial answers, or transfer to human agents.

Before failing over to a backup model, ensure it has been evaluated against the identical Golden Set for the target task. Low-risk summarization can degrade to smaller, cheaper models; however, for sensitive write operations (refunds, notifications), degraded model capability can impair tool selection and argument generation. Such tasks should be paused or transferred to human queues rather than silently compromising safety to preserve uptime.

Tool degradation depends on its criticality. Non-essential tools can be dynamically removed from the active tool registry; for queries that can be answered without the tool, return partial results with clear disclaimers; if mandatory data (order records, identity verification, warranty policies) is unreachable, halt deterministic conclusions. Furthermore, the system must record the circuit-breaker trigger, fallback path, and degradation flag in the Trace to cleanly differentiate normal completions from degraded runs.

Under high load, monitor provider quotas, tool concurrency pools, worker threads, connection pools, and queue backlogs. Enforce rate limiting and backpressure near ingress, and assign slow third-party tools to isolated thread pools (bulkheads) so one lagging integration cannot exhaust all Agent workers. When parallel branches write to shared State, define strict merge and conflict resolution strategies in advance.

### How Do You Enforce Termination Boundaries on Agent Loops?

When an Agent fails to obtain crucial information, it may enter infinite loops: repeatedly querying the same order ID or re-invoking tools with identical parameters. While the model continues proposing next steps, zero real progress occurs. Without explicit termination boundaries, this loop burns execution time and token budgets unchecked.

At initialization, the execution harness must establish a hard deadline, maximum invocation limits for models and tools, and hard caps on token and financial budgets. Prior to each invocation, check the remaining budget; individual tools must also enforce localized timeouts so a single stalled call cannot consume the entire task deadline.

Even within iteration caps, runaway loops can occur. The harness should inspect the tool name, normalized arguments, and State version across consecutive steps. If identical actions repeat, or if multiple iterations yield zero state delta, terminate the task with a "no progress detected" status. If high-risk actions (such as refunds) are requested, pause the loop and await user confirmation.

Upon halting, log the specific termination reason and decide whether to return partial artifacts or escalate to a human agent. These constraints must be enforced programmatically by the execution runtime or business code; prompt instructions like "call tools at most 10 times" serve only as behavioral guidance and cannot substitute for hard system boundaries.

### How Do You Resume Long-Running Tasks and Human Confirmations?

Taking refunds as an example: after the Agent gathers all necessary data, it must pause and await user confirmation before executing. The user may respond hours later, meaning the system cannot rely on active processes or in-memory state. Upon pausing, the system must persist the `runId`, checkpoint, pending tool name, normalized parameters, active State, `actionId`, tool schema version, and policy version.

When the user confirms, the system first verifies the user's identity and permissions, and checks whether the confirmation window has expired. Upon resumption, re-query the order state from the database. If the refund amount, order status, tool schema, or business policy changed during the waiting period, the original confirmation is invalidated immediately, prompting the system to present updated parameters for re-confirmation.

Certain workflow engines replay from node entrypoints upon resumption. Write nodes must therefore reuse the identical `actionId`, inspect external state first, and only execute if uncommitted; confirmation events must follow strict once-and-only-once consumption semantics. This ensures that even if resumption triggers repeatedly, duplicate refunds or tickets are physically impossible.

## How Should You Present Agent Metrics in Interviews?

In interviews, begin with whether the task succeeded, then supplement with execution fidelity, cost, and safety. An unsubstantiated claim of "85% accuracy" without an evaluation dataset or statistical methodology reveals nothing about production viability.

| Core Question | Applicable Metrics |
| ------------- | ------------------ |
| Did the task succeed? | Task completion rate, final business state accuracy, factual groundedness rate |
| Was execution fidelity maintained? | Tool selection accuracy, argument validity rate, redundant tool call rate, unauthorized call count |
| Is the cost sustainable? | End-to-end P50/P95 latency, model calls per task, token consumption, cost per task |
| Are failures contained? | Fault recovery rate, human escalation rate, duplicate side-effect count, false positive rejection rate |

After citing metrics, specify where the evaluation set originated, how success was judged, how many trials were executed per task, and what baseline version served as the benchmark. Live production projects can further report business KPIs like self-service resolution rate and handle time, alongside measurement periods and control groups. For pre-launch projects, present the offline evaluation suite and error distribution taxonomy, avoiding misrepresenting offline results as production telemetry.

In our after-sales case, whether the ticket was correctly created is an **Outcome** metric; which tools were invoked, whether arguments were valid, and whether unauthorized or duplicate calls occurred are audited via the **Trace**. Open-ended tasks may possess multiple valid execution trajectories; evaluations should verify final business state and mandatory security constraints rather than requiring exact sequence matching against an arbitrary Golden Path.

A fixed input paired with explicit success criteria forms a **Task**, and each execution run constitutes a **Trial**. Due to LLM non-determinism, mission-critical tasks must run across multiple trials. Graders can employ deterministic code assertions, LLM-as-a-Judge rubrics, or human review, while the **Eval Harness** orchestrates these trials, captures traces, and aggregates statistical results.

![Eval Harness workflow from loading eval datasets to scoring and gating releases](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-evaluation-eval-harness-flow-0c25378d.webp)

For a complete methodology, see [AI Application Evaluation Architecture](../llm-basis/llm-evaluation.md).

## How Should You Structure an Agent Badcase Postmortem?

Simply stating "The model gave a wrong answer, so we tweaked the Prompt" demonstrates zero root-cause analysis. A rigorous badcase postmortem provides reproducible forensic evidence.

Follow this seven-step postmortem structure:

1. **Preserve Forensic Context:** Capture raw user inputs, model and prompt versions, context window contents, retrieved chunks, tool payloads, and external system states.
2. **Describe Symptoms:** Document expected behavior, actual behavior, and affected blast radius.
3. **Formulate Layered Hypotheses:** Sequentially inspect data, retrieval, context assembly, model inference, tool execution, orchestration logic, and third-party dependencies.
4. **Isolate Variables:** Modify only one variable at a time, avoiding simultaneous changes to models, prompts, and retrieval hyper-parameters.
5. **Confirm Root Cause:** Produce deterministic evidence that reliably reproduces the failure mode, avoiding confusing correlation with causation.
6. **Implement Multi-Layer Fixes:** Clarify which architectural layer hosts the fix, explaining why prompt tweaks alone are insufficient.
7. **Add Regression Test Cases:** Ingest the original badcase and adjacent boundary cases into the automated regression test suite, then monitor production telemetry.

Below are two high-frequency examples. When discussing your own project, clarify whether the case study represents an actual production incident, an offline fault-injection test, or a design-phase risk mitigation runbook. If no production logs exist, do not misrepresent a synthetic test as a live incident.

### Why Did the Agent Misselect Similar Tools?

The system features two closely named tools: `query_after_sale_policy` queries general warranty policies without requiring an order ID; `check_after_sale_eligibility` accepts an order ID to evaluate whether a specific order qualifies for support. When a user provided an order ID, the Agent repeatedly invoked the former instead of the latter. While the returned general policy was factually accurate, it failed to answer the user's core query: "Can my order be serviced?"

Forensic analysis began with the Trace. If the order ID was missing from the model's context, state assembly was broken; if the model saw the order ID but still selected the wrong tool, the names, descriptions, and argument schemas of both tools were ambiguous. By fixing the input and systematically varying only the tool description, the system prompt, or the model version, the team isolated which change eliminated the error.

To remediate, the team first refined each tool's functional boundaries and preconditions in their descriptions, and injected the order ID into a compact state summary. Furthermore, because routing could be determined deterministically via code—a specific order can only be checked if an order ID is present—the execution layer began dynamically filtering the active toolset exposed to the model. Code pre-filters tools lacking prerequisites, preventing queries without order IDs from being derailed by static prompt priorities.

Finally, four distinct scenarios—"Order ID present," "Order ID absent," "Order ID belongs to another user," and "Malformed order ID"—were added to the regression test suite. As sample volume grew, a tool confusion matrix was used to monitor whether the two tools continued to be conflated.

### Why Did Ticket Creation Timeouts Produce Duplicate Records?

The initial ticket creation request executed successfully within the ticket microservice, but the HTTP response timed out over the network. The Agent runtime only registered an HTTP timeout and generated a brand-new request to invoke the endpoint again. The ticket service failed to recognize that both requests represented the same business action, ultimately provisioning two duplicate support tickets.

This badcase originated within the tool execution layer. The caller recorded an ambiguous timeout as a failure, and the destination endpoint lacked idempotency enforcement. In reality, a timeout merely denotes an unknown result—the initial call could have failed, remained in-flight, or completed successfully.

To fix this, the system generates a stable `actionId` upon action initiation, which is reused across SDK retries, message redeliveries, and manual retries. The ticket service uses this key to enforce database unique constraints; if the same `actionId` arrives with differing parameters, it fails fast, preventing stale cached results from silently returning.

Following a timeout, the runtime queries execution status using the `actionId`. If confirmed successful, it backfills the ticket ID; if confirmed failed, it retries per policy; if status remains uncertain, it escalates to reconciliation or human queues. Traces now explicitly distinguish between `FAILED`, `TIMED_OUT_UNKNOWN`, and `SUCCEEDED`, rather than collapsing all anomalies into generic failures.

Regression tests deliberately inject network drops where the server writes data but drops the response packet, validating that repeated recovery attempts yield exactly one ticket.

## How Do You Use Traces to Reconstruct Agent Execution?

When traditional APIs fail, HTTP status codes and stack traces immediately pinpoint the failure location. An Agent, however, may run without throwing exceptions yet retrieve incorrect documents, misselect tools in early turns, and ultimately generate a plausible-sounding hallucination. A distributed Trace reconstructs this chronological journey, recording inputs, outputs, and actions observed by the system. It does not capture internal model reasoning, nor does it prove why an LLM made a specific probabilistic choice.

Taking an after-sales ticket request as an example, Traces should be structured chronologically:

1. **Ingress:** Upon arrival, generate `requestId` and `runId`, binding masked user/tenant IDs, along with Git commit hashes, prompt versions, and tool schema versions.
2. **Model Invocations:** Record masked input summaries and model outputs for each call, capturing token counts, latencies, and termination reasons, rather than retaining only final responses.
3. **Retrieval Operations:** Record search queries, returned chunk IDs, similarity scores, and the exact snippets injected into the prompt, tagged with knowledge base version IDs.
4. **Tool Calls:** Generate a `toolCallId`, recording argument summaries, authorization decisions, raw results, and error classifications. Retries must log the `attempt` counter, parent Span, and idempotency key summary to track repeated executions.
5. **Termination / Suspension:** Record state transitions, checkpoints, user confirmations, finalized Outcomes, total invocations, cumulative token cost, and degradation reasons.

When troubleshooting, trace backward from the final output to find the first point of divergence from expectations. If the retrieval phase pulled incorrect documents, inspect chunking, recall, and rerankers; if evidence was accurate but the Agent selected the wrong tool, inspect context assembly and model selection; if tools returned success but business state remained unchanged, inspect tool adapters and execution verifiers. This narrows "the answer was wrong" down to a specific retrieval, model invocation, or tool call.

Model inputs, tool arguments, and retrieved passages often contain PII or confidential business data. Production systems should retain only masked summaries, paired with sampling strategies, role-based access control, and retention TTLs. Diagnostic fields can be preserved, but raw payloads should not be stored indefinitely by default.

Use **Traces** to replay single requests, **Metrics** to monitor aggregated latency and error rates, **Audit Logs** to verify who authorized high-risk operations, and **Eval Records** to compare performance across model and prompt versions. Error logs attach directly to corresponding Spans. All these artifacts correlate via a shared `runId`, avoiding the need to cram all telemetry into a single monolithic table.

For detailed breakdowns of `Session`, `Run`, `Trace`, `Span`, and `Attempt` taxonomies, async context propagation, and sampling strategies, see [AI Observability and Tracing](../system-design/ai-observability.md).

## What Must You Prepare Before the Interview?

For every Agent project on your resume, prepare the following artifacts at minimum:

- A completed project review worksheet;
- 30-second, 3-minute, and 10-minute versions of your project pitch;
- An end-to-end architectural diagram tracing a request from ingress to final outcome;
- Two technical decisions justified with evaluated alternatives;
- Two badcases with distinct root causes (ideally one quality issue and one engineering issue);
- An evaluation dataset taxonomy and explicit metric definitions;
- A concrete Trace that you can explain node-by-node;
- Exact versions for models, frameworks, protocols, and tool schemas;
- Known limitations and planned next steps for the system;
- Clear boundaries separating what you personally owned from what you did not.

Finally, stress-test your preparation against this self-assessment checklist:

1. If the LLM were removed, what would the legacy workflow look like?
2. Why is this an Agent rather than a RAG Q&A bot or a deterministic Workflow?
3. Where are the exact boundaries between Model, Tool, Memory, RAG, and State?
4. Which decisions are made by the model, and which must be strictly governed by code?
5. How are write operations authorized, confirmed, made idempotent, and verified?
6. How do you prevent infinite loops, run-away costs, and latency spikes?
7. What are the mathematical formulas, sample sizes, and baselines for your metrics?
8. How do you reproduce your most critical system failure?
9. Following a fix, how do you prove no regressions were introduced elsewhere?
10. If traffic increased tenfold, where would the first architectural bottleneck appear?
11. What distinct problems do `requestId`, `runId`, `sessionId`, `toolCallId`, and `actionId` solve?
12. When paused for HITL confirmation, how is state persisted, expired, resumed, and re-validated?
13. Where are the trust boundaries for RAG, tool outputs, MCP Servers, and long-term Memory?
14. Which capabilities are provided natively by frameworks, and which reliability/security mechanisms did you build yourself?
15. Which of your claims stem from live production telemetry, which from offline experiments, and which are design runbooks?

If you can answer these questions with verifiable empirical evidence, your project presentation will stand far above typical "surface-level wrapper demos."
