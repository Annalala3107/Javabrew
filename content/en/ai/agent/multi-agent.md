---
title: "Multi-Agent Collaborative System Design: Task Decomposition, State Sharing, Conflict Resolution, and Failure Recovery"
description: "Drawing on scenarios such as AgentInvest, technical research, customer service, and code review, this article clarifies the differences between Multi-Agent systems and Prompt Chains, covering orchestration, communication, state, conflicts, recovery, and evaluation."
category: AI Application Development
tag:
  - AI Agent
  - Multi-Agent
  - System Design
head:
  - - meta
    - name: keywords
      content: Multi-Agent,Multi-Agent Stock System,AgentInvest,AgentScope Java,ReActAgent,Task Decomposition,State Sharing,Conflict Resolution,Failure Recovery,A2A
lang: en
sourceRef: zh-ref/ai/agent/multi-agent.md
---


When developing the AgentInvest multi-agent stock analysis system, I divided the workload among four distinct roles: a researcher first completes fundamental research; a technical analyst and a sentiment analyst run in parallel to supply supplemental insights; and an investment manager synthesizes the final recommendation. Internally, each role invokes tools using the ReAct pattern, while an outer pipeline governs execution ordering, concurrency, and failure criteria.

Only after these roles were up and running did the real engineering challenges emerge. How finely subtasks should be partitioned, whether two workers can concurrently write to state, and whether to proceed when a branch times out all directly impact the final output. When interviewers probe multi-agent projects, they typically follow this exact line of inquiry.

The article [Core Concepts of AI Agents](./agent-basis.md#multi-agent) introduced collaboration patterns such as Orchestrator-Subagent and Peer-to-Peer. This article continues that discussion by exploring how tasks, state, conflicts, and failure recovery should be handled when these patterns are brought into real-world production projects.

In addition to AgentInvest, examples from technical research, customer service routing, and code review are woven throughout.

## What Is the Difference Between Multi-Agent Systems and Multi-Stage Prompt Chains?

A Prompt Chain manages procedural processing steps, whereas a Multi-Agent system manages autonomous executors capable of independently achieving sub-goals. The two can coexist: an outer fixed workflow can govern node transitions, with individual nodes executing their own internal Agents.

| Comparison Item | Multi-Stage Prompt Chain | Multi-Agent System |
| --------------- | ------------------------ | ------------------ |
| Execution Unit | Processing nodes within a Workflow | Autonomous Agents capable of fulfilling sub-goals |
| Mode of Operation | Nodes process inputs and generate outputs according to predetermined logic | Agents select tools, observe results, and iterate autonomously |
| Control Mechanism | Workflow controls node transitions and state progression | Can utilize deterministic orchestration or dynamic LLM delegation |
| Context Management | Context is typically forwarded along the pipeline | Context, tools, permissions, and state can be isolated per Agent |
| Execution State | Primarily tracks which node the pipeline has reached | Distinctly tracks each Agent's task, status, attempt count, and delivered artifacts |
| Artifact Delivery | Node outputs typically serve directly as the next node's input | Delivers messages, shares state, or submits structured artifacts |
| Failure Handling | Retries failed nodes or resumes from workflow checkpoints | Decides which roles can degrade, skip, or re-execute |

![Difference Between Multi-Agent Systems and Multi-Stage Prompt Chains](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/multi-agent-vs-prompt-chain-b97efc01.webp)

If the four roles in AgentInvest were merely four sequential model calls sharing a single context and toolset—where each step simply polished the text from the previous step—the system would still fundamentally be a multi-stage Prompt Chain.

In reality, each role in the project is an independent `ReActAgent` equipped with its own Prompt, Toolkit, `maxIters`, and context. The researcher queries market quotes, research reports, news, and financials; the technical analyst inspects candlestick charts and technical indicators; the sentiment analyst gauges market sentiment; and the investment manager ingests the upstream `<core_thesis>` to synthesize a holistic thesis. The outer Workflow manages the execution processes of four independent Agents, rather than merely passing raw text strings between four sequential calls.

Whether execution happens in parallel only indicates *how* tasks run. Multi-agent systems can execute sequentially with handoffs, just as prompt chains can branch out in parallel.

## What Questions Should You Address First When Designing a Multi-Agent System?

First establish what each role is responsible for, who governs the next step, how results are handed off, and how failures are mitigated. Only then should you decide how many Agents are required and which tasks can execute concurrently.

| Core Question | Specific Considerations | Common Example |
| ------------- | ----------------------- | -------------- |
| What is each Agent responsible for? | Do sub-goals, prompts, tools, contexts, and permissions need isolation? | Technical research can be split into literature retrieval, data analysis, and conclusion auditing |
| Who decides what to do next? | Is the process controlled by deterministic code or dynamic model selection? | Deterministic audit pipelines belong to code; open-ended research directions belong to the model |
| How do multiple Agents collaborate? | Sequential, parallel, router, handoff, loop, or hybrid patterns? | Parallel literature search, followed by a reviewer auditing once all materials arrive |
| What do Agents deliver to one another? | Full conversation history, shared state, or structured results with evidence? | Search agents deliver conclusions, citations, and Artifact URIs rather than full chat transcripts |
| How are state tracking and failures handled? | Track per-role state? On timeout: retry, skip, degrade, or terminate? | On search branch timeout: retain other results and explicitly flag the missing component |
| Where are Agents deployed? | In-process, or distributed over network across services, teams, or security zones? | Local roles can be called directly; remote roles require identities, protocols, and task state |

Taking technical research as an example, the outer workflow can be deterministically fixed into four stages: planning, information retrieval, analysis, and auditing. During retrieval, the Agent autonomously selects search keywords, data sources, and tools, creating new retrieval paths when necessary. Roles hand off conclusions, citations, and artifacts, with no need to broadcast full conversational transcripts.

## When Is It Worth Using Multi-Agent Architecture?

I generally start with a single Agent or a deterministic workflow. When a single Agent can complete a task within acceptable cost and latency envelopes, splitting it into multiple roles only inflates the engineering burden of scheduling, context handoff, result aggregation, and failure recovery.

Multi-agent architectures become worthwhile when distinct phases require noticeably different toolsets, permissions, and context windows, or when a task branches into relatively independent exploratory paths. Each role must also produce crisp, verifiable deliverables—such as structured conclusions, citations, code diffs, or test reports. If roles merely pass unstructured free-form text back and forth, you will spend disproportionate engineering effort debugging inconsistent string formatting and stitching outputs together.

Anthropic's public [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) employs this design. A primary Agent decomposes a research inquiry into multiple exploratory angles, dispatching sub-agents to search concurrently, and then aggregates findings upon completion. Each branch explores independently, making it ideal for concurrency; if branches constantly depend on each other's intermediate conclusions or repeatedly sync full conversation contexts, communication overhead quickly erodes any gains from specialization.

![Multi-Agent System Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-multi-agent-arch-f7551234.png)

In software development workflows, a coding Agent modifies the workspace and produces a diff; a testing Agent executes tests and reports failures; and a reviewer evaluates the diff against requirements and architectural guidelines. Because their toolsets, context scopes, and acceptance criteria differ completely, separating them into distinct roles provides clear boundaries. Conversely, if all three roles simply read the same diff and generate similar summaries, the only thing being multiplied is token consumption.

Before deploying to production, run A/B benchmark evaluations comparing single-agent against multi-agent setups on identical task suites, measuring quality, end-to-end latency, token consumption, and failure rates. If the multi-agent approach provides no measurable margin of improvement, stick to the simpler architecture.

## How Do the Four Agents in AgentInvest Collaborate?

Consider a stock analysis task in AgentInvest where a user asks:

> Help me analyze whether Kweichow Moutai is still worth buying right now.

General parametric knowledge cannot answer this reliably. The system must query live ticker quotes, analyst reports, financial ratios, candlestick patterns, and market sentiment, while factoring in the user's current portfolio holdings. AgentInvest executes this workflow in the following sequence:

1. The researcher queries market quotes, research reports, news, and financials, delivering foundational research conclusions encapsulated in a `<core_thesis>`.
2. Once the researcher finishes, the technical analyst examines candlestick trends and technical indicators while the sentiment analyst measures market sentiment, executing in parallel.
3. The investment manager reads the upstream thesis, integrates the user's portfolio holdings, historical memory, and investment strategy skills, and synthesizes the final recommendation.

The outer layer employs a customized `AgentScopePipelineExecutionStrategy` to govern the deterministic sequencing of stages. ReAct is delegated internally to each role, letting the model determine what data is missing, which tool to invoke, and whether to proceed with analysis upon receiving tool outputs. This guarantees workflow stability while preventing each role from devolving into a rigid, non-adaptive prompt chain.

![Sub-agents Decomposing Tasks and Isolating Context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/sub-agent-task-splitting-context-isolation--635196e8.png)

Transitioning to the investment manager requires satisfying two prerequisites: the researcher must have produced the core thesis, and at least one of the technical or sentiment analysts must have succeeded. If upstream inputs are demonstrably inadequate, the pipeline skips the investment manager entirely and returns an error via Server-Sent Events (SSE), preventing the model from hallucinating a seemingly complete investment report from thin air.

The researcher must execute first and the investment manager must execute last, while the two intermediate, mutually independent analysts run concurrently. Role boundaries are established by multi-agent specialization, while execution precedence is strictly governed by a Directed Acyclic Graph (DAG).

## Which Orchestration Pattern Should You Choose?

Orchestration patterns depend on who holds control authority, when roles are determined, how tasks depend on one another, and who directly faces the end user:

| Pattern | Control Mechanism | Applicable Scenarios | Primary Cost / Trade-off |
| ------- | ----------------- | -------------------- | ------------------------ |
| Sequential | Deterministic code invokes agents in fixed order | Fixed steps, clear linear dependencies | Accumulated latency, limited flexibility |
| Parallel | Deterministic code fans out independent tasks and merges outputs | Multi-dimensional review, independent retrieval, voting | State merging and partial failure handling |
| Router | Rules or classifiers route requests to one or more specialists | Distinct business domains, stable taxonomy | Misrouting selects the wrong expert entirely |
| Supervisor / Manager | Primary Agent dynamically delegates to sub-agents, retaining final control | Subtasks cannot be predetermined; requires unified response | Primary agent becomes a bottleneck; high coordination overhead |
| Handoff | Active Agent transfers control and necessary context to another Agent | Customer service triage, phased dialogues, domain expert facing user | Difficult to maintain conversation history and permission boundaries |
| Evaluator-Optimizer | Generator and reviewer iterate in a feedback loop | Objective rubrics exist; iteration demonstrably improves output | Risk of infinite refinement loops; requires stopping criteria |
| Group Chat | Agents share a conversation, speaking via round-robin or dynamic selector | Open brainstorming, panel reviews, mutual correction | Context explodes rapidly; stopping criteria hard to define |
| Debate | Multiple Agents propose, challenge, and refine arguments across rounds | Hypotheses testable against empirical evidence; disagreement has intrinsic value | Can devolve into repetitive circular debate; no guarantee of truth |
| Event-driven / Peer-to-Peer | Agents react autonomously to incoming events based on local logic | Cross-service, cross-team decentralized collaboration | Consistency, security, and distributed debugging are highly complex |

AgentInvest uses a **Sequential + Parallel + Aggregator** hybrid orchestration model. The researcher and investment manager form sequential bookends, while the technical and sentiment analysts execute in parallel in between, with the investment manager performing the final aggregation.

This setup avoids using a Supervisor to dynamically adjust agent counts, nor does it hand off user sessions between agents. Stock analysis follows relatively stable stages, making code-governed outer flows far more reliable; dynamic reasoning is kept strictly within each role's internal ReAct loop.

These patterns compose naturally. A router can direct a request to an expert who in turn invokes sub-agents; a supervisor can complete preparatory setup before fanning out work to parallel workers.

### Should Roles Be Decomposed Statically or Delegated Dynamically?

Static decomposition means roles, dependencies, and execution topologies are established prior to runtime. Fixed sequences, parallel fan-outs, and conditional DAGs fall into this category. The advantage is straightforward testability, tight budget control, and predictable partial-failure handling, making it ideal for business workflows with stable procedural structures.

Dynamic delegation empowers a Manager or Supervisor to inspect the user's query and intermediate findings at runtime, dynamically deciding which sub-agents to invoke, how many subtasks to spawn, and whether further exploration is required. Anthropic's Multi-Agent Research embodies this model: because distinct inquiries require divergent research vectors, drawing a static DAG beforehand is impractical.

Hybrid arrangements are common. For instance, an outer workflow can deterministically fix three phases—data collection, analysis, and review—while the data collection phase permits a primary Agent to dynamically spawn specialized sub-agents based on the inquiry. Review and publication thresholds remain enforced by deterministic gates, while discovery vectors adapt dynamically.

![Difference Between Deterministic DAG and Dynamic Delegation in Multi-Agent Systems](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/multi-agent-static-vs-dynamic-orchestration-6ce0bc0f.webp)

## How Do You Formalize Subtasks into Executable Contracts?

Merely instructing an Agent with "You are a technical research agent" leaves it blind to what it must investigate, what data it may access, and what constitutes acceptable completion. When dispatching work, an orchestrator must specify sub-goals, acceptance criteria, upstream dependencies, permitted tools, authorization scopes, output schemas, and artifact storage locations. Budgets for time, tokens, iteration counts, and retry policies also form integral parts of the task contract, enforced mechanically by the runtime.

The following `AgentTask` record illustrates a streamlined task contract:

```java
public record AgentTask(
        String taskId,
        String parentTaskId,
        AgentRole role,
        TaskContext context,
        List<AgentRole> dependencies,
        Set<String> allowedTools,
        String outputSchema,
        int maxIters,
        Duration modelTimeout,
        Duration toolTimeout,
        Instant deadline,
        int maxAttempts) {
}
```

In production, add task schema versions, idempotent keys, concrete success criteria, and artifact storage URIs. Tool whitelists (`allowedTools`), timeouts, and retry limits are strictly enforced by the runtime harness; the model receives only the minimal information required to complete its immediate subtask.

### How Do You Determine Whether Subtasks Can Run in Parallel?

In technical research, once the core question is established, "inspecting official documentation" and "querying academic papers and benchmarks" can launch concurrently. Both branches possess sufficient inputs and do not depend on each other's intermediate findings. Conversely, synthesizing comparative conclusions requires evidence from both sides and must be sequenced downstream.

Parallel branches must avoid concurrently writing to the same authoritative state fields. Two search Agents should each submit their own independent manifest of sources, leaving the aggregation node to compile the final synthesis. External side effects—such as dispatching notifications or mutating database records—should be assigned to a single executor, or guarded by idempotency keys and unique constraints. Furthermore, whether a branch failure triggers a wait, degradation, or pipeline abort must be defined in the contract before execution begins.

In Java, these branches can be dispatched via thread pools, virtual threads, or structured concurrency; the specific threading abstraction is secondary. The orchestration layer must cap maximum concurrency, enforce a unified deadline across the stage, cancel lingering tasks upon expiration, preserve successful partial outputs, and evaluate whether downstream gates are satisfied.

### How Do You Prevent Redundant Work and Missing Outputs Across Roles?

Role boundaries must be enforced simultaneously across task scopes and tool definitions. In code modification workflows, the coding Agent modifies the workspace, the testing Agent runs tests and returns structured failure diagnostics, and the reviewer inspects diffs against acceptance criteria. Merely changing system prompt role descriptions without restricting tool permissions leads multiple agents to redundantly re-check the same things.

Each role must adhere to a strict delivery protocol. A generic `RoleResult` should at minimum encapsulate findings, supporting evidence, observation timestamps, artifact URIs, identified gaps, and confidence boundaries, with the orchestrator validating required fields. Structured outputs resolve schema compliance and handoff integrity, but whether a conclusion is trustworthy still requires evaluating evidence and timeliness.

AgentInvest currently passes core findings via `<core_thesis>`. While lightweight and easy to implement, it risks dropping timestamps and key evidentiary citations. For stronger auditability, progressively replace ad-hoc tags with validated JSON schemas rather than relying on natural language fallback heuristics.

## How Should Agents Communicate and Share State?

Agents do not need to default to conversational chat messages. In-process deterministic workflows typically transfer results through method arguments, return values, and shared state boards. Network messaging and remote protocols should be introduced only when crossing service boundaries or conducting open-ended negotiations.

| Communication Mechanism | Implementation | Best Suited For |
| ----------------------- | -------------- | --------------- |
| Arguments and Return Values | Orchestrator invokes Agent, passing upstream outputs as downstream inputs | In-process fixed workflows with simple linear dependencies |
| Shared State / Blackboard | Agents read public state, mutating only their designated fields | Graph-based orchestration where nodes incrementally populate results |
| Messaging | Point-to-point dispatch or broadcast to Group Chat | Dynamic negotiation, handoffs, or asynchronous collaboration |
| Structured Artifacts | Deliver schema-validated reports or file references | Large outputs requiring validation, reuse, and auditability |
| Remote Agent Protocols | Discover agents, transfer tasks and artifacts via protocols like A2A | Cross-process, cross-team, or cross-security-domain orchestration |

As communication mechanisms grow in complexity, authentication, retries, message ordering, and at-least-once delivery become exponentially harder to manage. If artifact delivery can be achieved through a direct method invocation, do not introduce a message queue prematurely.

Shared state should store only information necessary for cross-role collaboration. An Agent's internal tool traces and ReAct iterations should remain private to its local session; user metadata, tenant boundaries, resource references, and permissions enter explicitly via `TaskContext`. Upon completion, the role writes its conclusions, evidence summaries, missing elements, and artifact URIs into its assigned state slot, while the orchestrator tracks role lifecycles (started, completed, failed, timed out).

Raw assets—such as crawled HTML, verbose query logs, and code diffs—should remain in local role context or artifact object storage. SSE and WebSockets push real-time telemetry to frontends, but they must not serve as the system of record for task state.

Business context should always be passed explicitly to Agents and tools. Relying on implicit `ThreadLocal` context leads to data leakage across concurrent threads, asynchronous boundaries, or virtual thread contexts, while obscuring what data a tool actually consumes.

### How Do You Regulate the Size of Shared State?

In technical research, a retrieval Agent has no reason to copy dozens of crawled web pages, intermediate search queries, and raw tool logs to the reviewer. Instead, it persists raw data into an Artifact store, forwarding only distilled conclusions, citations, collection timestamps, and an Artifact URI. When the reviewer must audit a specific claim, it resolves the raw evidence on demand via the URI.

Summarization must remain anchored to evidence. For time-sensitive information—such as pricing, versions, regulations, or empirical metrics—collection timestamps, source attributions, and exact key fields must be preserved.

### What Operational State Should a Multi-Agent System Record?

```java
public record AgentRunState(
        String runId,
        String subject,
        RunStatus status,
        Map<AgentRole, RoleState> roles,
        Map<AgentRole, ArtifactRef> artifacts,
        BudgetUsage usage,
        List<FailureRecord> failures,
        ArtifactRef finalOutput) {
}

public record RoleState(
        AgentRole role,
        TaskStatus status,
        int attempt,
        String providerId,
        String modelName,
        Instant startedAt,
        Instant updatedAt,
        FailureRecord lastFailure) {
}
```

This data structure provides a conceptual baseline. Single-agent conversational state, shared business state, and outer workflow orchestration state must be stored separately. Conversational storage tracks prompts, observations, and tool history; workflow state tracks pipeline progress across roles. Neither can replace the other.

When roles are decoupled into independent microservices, add `ownerAgentId`, `version`, `leaseUntil`, and `fencingToken` to manage task ownership handoffs. These fields belong to distributed worker coordination and need not be prematurely introduced into in-process systems.

## What Can A2A Solve, and What Can It Not Solve?

When multiple roles execute within the same process, direct method calls are almost always simpler. When Agents are deployed independently, maintained by separate teams, or partitioned across security perimeters, the Agent-to-Agent (A2A) protocol provides standardized capability discovery, task lifecycle management, and artifact delivery.

An A2A interaction typically begins with reading an Agent Card. The caller verifies the remote Agent's capabilities, interfaces, and authentication requirements, and then creates a Task with a unique ID. Both sides exchange context via Messages, deliver reports or structured data via Artifacts, and link related operations through Context identifiers.

In [A2A 1.0](https://a2a-protocol.org/latest/announcing-1.0/), `TaskState` defines states including `TASK_STATE_UNSPECIFIED`, `TASK_STATE_SUBMITTED`, `TASK_STATE_WORKING`, `TASK_STATE_INPUT_REQUIRED`, `TASK_STATE_AUTH_REQUIRED`, `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED`, and `TASK_STATE_REJECTED`. Notably, `INPUT_REQUIRED` and `AUTH_REQUIRED` model suspended states waiting on external input or authorization before execution resumes. This granularity is far superior to binary success/failure flags for long-running workflows.

A2A solves how remote Agents discover each other, exchange messages, monitor tasks, and hand off artifacts. It does not dictate execution topology, nor does it guarantee internal business consistency. Handling concurrent worker updates, lease timeouts, failover ownership, or duplicate financial transactions remains the responsibility of your underlying application.

## How Do You Handle Concurrency Conflicts in Multi-Agent Systems?

When two Agents produce differing outputs, you cannot simply let the last writer overwrite the first. First diagnose the specific class of conflict:

| Conflict Type | Common Example | Resolution Strategy |
| ------------- | -------------- | ------------------- |
| State Write Conflict | Two search agents overwrite the report's `sources` field concurrently | Partition slots by role, use append-only sets, or apply versioned CAS |
| Perspective Conflict | Two agents reach opposite conclusions based on differing sources | Preserve source, timestamp, and scope; delegate judgment to aggregator |
| Ownership Conflict | A presumed-dead worker and its replacement submit outputs simultaneously | Distributed leases + versioning/CAS + fencing tokens |
| Side-Effect Conflict | Two agents issue duplicate refund requests or notifications | Single executor pattern, idempotency keys, and database unique constraints |

### How Should Parallel State Be Merged?

Parallel Agents should update their own isolated state slots, with results and errors segregated by role. Counters like token consumption and runtime duration can be aggregated via event streams, but authoritative fields like `finalOutput` must be restricted to a single aggregation node. Telemetry events carry role tags and sequence numbers for UI rendering, but must never directly mutate canonical backend task state.

If multiple Agents can write to `finalOutput`, thread-safe concurrent collections merely prevent memory corruption—they cannot discern which business payload is authoritative. Segregating results by role and designating a single aggregator to commit authoritative fields prevents late-arriving writes from obliterating preceding outputs.

### What Should You Do When Agents Reach Conflicting Factual Conclusions?

In equity research, "conflict" does not necessarily mean an Agent made a computational error. A technical analyst might discern a bullish trend on a 60-day candlestick chart, while a sentiment analyst flags mounting short-term negative social sentiment. Because their temporal scopes and evidentiary sources diverge, you cannot simply vote to pick a winner.

To ensure auditability, structure contentious claims into verifiable assertions:

```json
{
  "claimId": "claim-17",
  "subject": "600519",
  "predicate": "technical-trend",
  "value": "BULLISH",
  "scope": "daily-kline-60d",
  "sourceTool": "get_technical_indicators",
  "observedAt": "2026-08-15T10:00:00+08:00",
  "evidenceStatus": "VERIFIED"
}
```

Here, `scope` distinguishes daily trends from minute-level ticks, `observedAt` captures data timeliness, and `sourceTool` anchors the finding to a specific tool. The investment manager can synthesize "medium-term technical posture is bullish, but short-term sentiment is bearish," without artificially forcing them into alignment.

When evidence is incomplete, final recommendations must reflect wider confidence intervals. ReAct minimizes ungrounded hallucinations, but it cannot guarantee the financial correctness of an investment thesis.

### Why Must Distributed Leases Be Paired with Fencing Tokens?

When in-process tasks can be cancelled and awaited directly, distributed leases are unnecessary. Leases become indispensable only when roles run as remote workers, where network partitions cause old instances and failover instances to run simultaneously.

Consider Worker A acquiring a task lease and subsequently encountering a long stop-the-world pause. The lease expires, and the orchestrator reassigns the task to Worker B. When Worker A recovers and writes to storage, if the database only checks "did A hold the lock previously?", A's stale result will overwrite B's newer result.

Now consider Worker A receiving a `fencingToken` of 7, while Worker B receives 8 upon failover. The database registers 8 as the current acceptable version. When Worker A wakes up and attempts a write with token 7, the version constraint fails, and the stale write is rejected.

Leases ensure abandoned tasks are released, while Fencing Tokens or optimistic version checks block delayed writes from resurrected former owners. Setting a TTL on a distributed lock does not protect downstream storage on its own.

## How Should Task Lifecycles Be Modeled?

Role lifecycles must be governed by an outer execution harness, rather than determined arbitrarily by the model. The orchestrator determines whether downstream tasks may proceed based on upstream state transitions. Below is a robust state machine design:

| State | Semantic Meaning | Permitted Successor States |
| ----- | ---------------- | -------------------------- |
| `PENDING` | Created; upstream dependencies unmet | `READY`, `CANCELED` |
| `READY` | Eligible for scheduling | `RUNNING`, `CANCELED` |
| `RUNNING` | Currently executing | `WAITING_INPUT`, `SUCCEEDED`, `RETRYABLE_FAILED`, `FINAL_FAILED` |
| `WAITING_INPUT` | Suspended awaiting human input, approval, or credentials | `READY`, `CANCELED`, `FINAL_FAILED` |
| `RETRYABLE_FAILED` | Identified as transient, retryable failure | `READY`, `FINAL_FAILED` |
| `SUCCEEDED` | Output persisted and passed schema validation | Terminal state |
| `FINAL_FAILED` | Unrecoverable failure | Terminal state (or manually reopened) |
| `CANCELED` | Aborted by user or system | Terminal state |

In an in-process pipeline, tracking state per role provides sufficient control. When decomposing into distributed workers, updating a task upon completion must atomically validate task status, ownership, fencing tokens, and versions:

```sql
UPDATE agent_task
SET status = 'SUCCEEDED',
    artifact_uri = :artifactUri,
    version = version + 1
WHERE task_id = :taskId
  AND status = 'RUNNING'
  AND owner_agent_id = :ownerAgentId
  AND fencing_token = :fencingToken
  AND version = :expectedVersion;
```

An affected row count of 0 indicates the task was reassigned, cancelled, or concurrently modified. The worker must not attempt blind compensation, but must re-read state from the database.

## How Do You Recover from Failures in Multi-Agent Systems?

Failures in multi-agent architectures must not be treated with blanket retries. Malformed inputs, authorization rejections, tool timeouts, and evidentiary gaps demand tailored responses:

| Failure Mode | Common Example | Recommended Action |
| ------------ | -------------- | ------------------ |
| Contract / Input Error | Missing target resource; output violates schema | Attempt single schema correction or fail fast; avoid blind network retries |
| Permission / Business Rejection | Service Agent lacks refund authorization | Terminate execution or suspend for human authorization |
| Transient Network Fault | Search API reset, rate limits, temporary 5xx errors | Bounded exponential backoff with jitter |
| Invocation Timeout | Model or tool exceeds single-call budget | Abort active call; handle according to role retry policy |
| Role Timeout | Research branch exceeds stage deadline | Cancel incomplete tasks; preserve successful outputs |
| Quality Failure | Report lacks citations, required fields, or artifacts | Attempt single revision, degrade, or skip downstream |
| Deterministic Code Bug | Event deserialization failure, illegal state transition | Fail fast, raise alerts, patch code |

Remediation must be handled at the appropriate architectural tier. Role executors handle model parameters, tool retries, and local iteration counts. The orchestrator decides whether to cancel sister branches, which partial artifacts to preserve, and whether downstream steps can proceed. When roles run as remote workers, the distributed scheduler handles leases, reassignment, and delayed writes.

### How Do You Enforce Retry Budgets and Timeouts?

Budgets must be enforced hierarchically across four tiers: single model calls, single tool invocations, maximum ReAct iterations per Agent, and global deadlines across a stage or pipeline. Lower tiers cap localized resource burn, while the outermost deadline ensures runaway internal retries never stall the entire pipeline indefinitely.

Retry budgets should have a single authoritative owner. If model SDKs, agent harnesses, and API gateways all retry independently, a single fault cascades into dozens of nested calls. The orchestration layer must track consumed attempts, tokens, latency, and cost, validating remaining budget before approving any retry.

### Where Should Checkpoints Be Persisted?

Checkpoints belong at boundaries where artifacts are persisted and independently verifiable. In technical research, persist the citation manifest after retrieval completes; persist analysis artifacts after data analysis concludes; and log approval or rejection rationales after the review stage. Operations requiring human approval must persist invocation parameters prior to entering a suspended state.

Single-agent conversational state and workflow orchestration checkpoints represent distinct operational data. Conversational checkpoints capture dialogue turns, tool observations, and local iteration counters; workflow checkpoints track current stage, completed roles, artifact URIs, model versions, prompt hashes, budget utilization, and failure ledgers.

Merely storing chat transcripts in Redis does not allow an orchestrator to resume a pipeline where two search tasks succeeded but data analysis timed out. Recovery requires reconstructing dependency graphs and validated artifacts.

Recovery rarely resumes from a specific line of Java code. An Agent restarts from a clean ReAct node or before a specific tool execution. Idempotency is straightforward for read-only tools; when mutating external state (orders, funds, notifications), external actions must be strictly idempotent.

### How Do You Handle Agent Timeouts?

In-process concurrency can cancel incomplete Futures upon deadline expiration, log timeout states, and retain completed artifacts. Cancellation sends a cancellation signal to local tasks; if the Agent is waiting on a remote model call or third-party API, verify whether the external invocation terminated and whether side effects were produced.

When roles run as independent microservices, caller-side timeouts do not prove the remote worker has halted. When a lease expires, the scheduler queries whether the worker or downstream systems produced valid artifacts. If a valid artifact exists and passes validation, the task advances. If the state remains indeterminate, the scheduler increments `attempt` and `fencingToken`, resets the task to `READY`, and dispatches a new worker to resume from the latest checkpoint and Artifact URI.

When the original worker eventually recovers and attempts to commit, the stale fencing token or version will cause the write to fail. If a task exceeds its maximum attempt count, it transitions to `FINAL_FAILED`, preserving execution context and completed artifacts for human intervention.

Track `lastProgressAt` alongside `lastHeartbeatAt` to detect scenarios where a process remains healthy but the Agent is stuck in an unproductive ReAct loop.

### On Partial Failure: Wait, Degrade, or Return Partial Results?

The appropriate strategy is defined by the task's acceptance criteria and encoded into the task contract before execution begins. When a mandatory component fails, abort the pipeline; when multiple homogenous branches need only reach a threshold, aggregate via Quorum; for tasks permitting partial completion, return available findings while explicitly annotating missing items. Secondary tools, models, and data sources act as fallbacks; high-stakes workflows can route to human operators.

AgentInvest enforces threshold-gated best-effort execution: the researcher must succeed, and at least one analyst must succeed, before the investment manager proceeds. If the technical analyst fails but sentiment analysis succeeds, the manager generates a thesis from available data while the operational record explicitly marks technical analysis as failed. If both supplemental analysts fail, the manager is blocked from generating an ungrounded conclusion.

![Handling Strategies for Partial Branch Failures in Multi-Agent Systems](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/multi-agent-partial-failure-strategies-d5c8085b.webp)

### How Do You Compensate for External Side Effects?

Operations that alter external state—such as issuing refunds, sending emails, filing tickets, modifying code, or deploying releases—should be delegated to a dedicated Action Executor. Analytical and generative Agents should submit only intent payloads and parameters.

Upon receiving an action request, the Action Executor validates identity, permissions, and risk tiers, routing high-risk actions to human approval gates. Execution uses idempotency keys and database constraints, tracking transactions via Outbox or Saga patterns as required. After execution, the system verifies external state and logs audit records; upon failure, it initiates compensating actions or escalates to human review.

Compensation is not synonymous with database rollback. An email that has been sent cannot be un-sent; the system can only issue a clarifying notification. Compensating transactions can themselves fail, requiring idempotency, retries, and manual fallbacks. For detailed distributed architecture principles, see [Distributed Transactions](../../distributed-system/distributed-transaction.md).

## How Does Human-in-the-Loop Suspend and Resume Tasks?

Human-in-the-Loop (HITL) occurs mid-flight. When a customer service Agent determines an order is eligible for a refund but the amount exceeds automated thresholds, the orchestrator transitions the task to `WAITING_INPUT`, persists a checkpoint containing the refund rationale and invocation parameters, and releases active compute resources.

When a human approver inspects the task later, they can approve, reject, or adjust parameters. The system resumes execution using the original `runId/taskId`, re-authenticating the approver's permissions, order status, refund amount, and task version. If any prerequisite condition changed during the suspension window, the prior approval is invalidated.

High-risk operations like deploying code or deleting records follow the same suspension pattern. Tasks also suspend when an Agent lacks necessary inputs, requires additional tool authorization, or when findings from conflicting roles cannot be automatically resolved. The framework provides interruption and resumption infrastructure; business logic dictates who can approve, the scope of authority, and approval expiration.

## How Do You Observe a Multi-Agent Execution?

Because a single multi-agent run spawns multiple tasks, distributed traces must reflect hierarchical parent-child relationships:

```text
ResearchRun
├── Planner
│   └── ModelCall
├── SourceResearchStage
│   ├── OfficialDocsResearcher
│   │   └── WebSearchTool
│   └── PaperResearcher
│       └── PaperSearchTool
├── Analyst
│   └── DataAnalysisTool
└── Reviewer
    └── ModelCall
```

The root span represents the overarching `ResearchRun`, recording `runId`, tenant ID, research topic, and code/prompt versions. Each role task attaches as a child span, carrying parent task IDs, agent roles, models, skills, statuses, `attempt` counts, and termination reasons. Model invocations and tool executions nest beneath their respective role spans, capturing parameters, response summaries, error classifications, token consumption, cost, and latency.

This hierarchy reveals whether latency bottlenecks reside in queue scheduling, role execution, or final aggregation, and clarifies why downstream stages were skipped. Retried attempts attach under their original role task with an incremented `attempt` index, rather than masquerading as clean new invocations.

Frontends can visualize stage transitions, tool calls, and result summaries via SSE or WebSockets, but streaming event buses must not serve as the authoritative system of record. Reconnection, replay, and auditing must always query persistent agent state, workflow run records, and artifact stores.

Model routing decisions should be recorded into the trace at the instant of invocation, capturing the exact provider and model selected. Deferring logging until after execution risks attributing telemetry to an incorrect fallback model.

OpenTelemetry's [GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/) define operation names such as `invoke_agent`, `invoke_workflow`, and `execute_tool`, alongside standard attributes for agents, conversations, tools, and token metrics. These specifications are currently in development. Tool arguments and outputs frequently contain sensitive information, and conventions caution against logging them by default. Production architectures must enforce summarization, redaction, sampling, and role-based access control.

### What Metrics Are Unique to Multi-Agent Systems?

When a multi-agent run fails, first evaluate success rates, timeout frequencies, and retry distributions across individual roles, and then drill down into per-model and per-tool error rates and P95 latencies. A role consistently hitting its ReAct iteration ceiling will simultaneously inflate token burn, financial cost, and stage latency.

Parallel stages require tracking queue wait times, actual concurrency levels, and slowest-branch latencies. Following role delivery, track schema validation failures, rework cycles, and downstream skip rates. Finally, measure end-to-end task token consumption, cost, P95 latency, and Time to First Event versus Time to Complete Result.

When branches execute concurrently, end-to-end latency remains bounded by the slowest branch plus final aggregation. If parallelization fails to reduce latency, inspect concurrency caps, external API rate limits, long-tail tool calls, and aggregation overhead.

## How Do You Evaluate Multi-Agent Systems?

Because ReAct may vary tool selection sequences across runs, evaluation should not rigidly match against a fixed trace trajectory. First verify whether sub-agents delivered outputs matching their task contracts; next verify whether the orchestrator respected dependencies, concurrency limits, and skip criteria; and finally ensure the aggregation node faithfully reflected upstream conflicts, citations, and failures.

In technical research, automated assertions can validate citation formats, source timestamps, mandatory fields, and artifact existence, before assessing whether materials substantiate the conclusions. Tool registrations, role authorizations, task dependencies, concurrency ceilings, timeout cancellations, and context isolation are governed by deterministic rules, fully verifiable via unit and integration tests.

Fault recovery must be verified through fault injection: inject timeouts into a search Agent to confirm whether partial artifacts survive and the reviewer proceeds per threshold rules; inject corrupted payloads into tools to verify the Agent does not falsely report success; and inject conflicting source data to confirm the aggregator preserves disagreement and citations.

Evaluating the qualitative excellence of final recommendations still requires curated task suites, repeated trials, and human calibration. For definitions of Task, Trial, Grader, Outcome, and Transcript, see [AI Application Evaluation Architecture](../llm-basis/llm-evaluation.md).

Multi-agent architectures also require control baselines: evaluate a single Agent equipped with all tools against a deterministic multi-agent workflow and a dynamic supervisor-led architecture, holding inputs, models, and budgets constant. Only after comparing tool utilization efficiency, citation coverage, factual error rates, P95 latency, token consumption, and dollar costs can you definitively prove whether multi-agent decomposition added net value.

Role ablation provides immediate clarity: re-run evaluations after removing a search Agent, reviewer, or aggregation node. If quality, coverage, and fault resilience remain unchanged, that role likely contributed nothing more than extra token bills.

## Common Pitfalls in Multi-Agent System Design

### Can Role Names Serve as Architectural Agent Boundaries?

Titles like Researcher, Analyst, and Reviewer denote conceptual divisions of labor; they do not prove a system is genuinely multi-agent. If these personas share a single context window and toolset, and each step merely paraphrases the previous output, the system remains a prompt chain.

A true multi-agent boundary exists when each role independently receives sub-goals, operates within constrained context and tool boundaries, and delivers validated results matching strict schemas. Without these operational boundaries, changing system prompt descriptions provides zero architectural isolation.

### Must Multi-Agent Systems Always Run in Parallel?

In AgentInvest, the researcher must produce core findings first, and the investment manager must wait for upstream completion before synthesizing recommendations; only the independent technical and sentiment analysts run in parallel. Concurrency is governed by task dependencies, not the mere presence of multiple agents. Reviewers, handoffs, and round-based group chats execute sequentially. Forcing concurrency without verifying whether inputs are ready or how outputs merge only inflates state complexity and error handling.

### Should Deterministic Steps Be Delegated to an Agent?

Validating input schemas, verifying tool whitelists, and checking artifact completeness follow deterministic rules and should be handled by code and state machines. Timeout cancellations, retry limits, and stage ordering must be enforced mechanically by the runtime. Agents should be reserved for semantic interpretation—such as choosing search directions, reconciling conflicting evidence, and synthesizing multi-faceted conclusions. Stuffing deterministic logic into prompts makes execution slower and turns reproducible behaviors into probabilistic gambles.

### Should All Agents Share the Full Conversation Context?

In technical research, a search Agent might crawl dozens of web pages and generate extensive tool logs. The reviewer typically needs only synthesized findings, citations, identified gaps, and artifact URIs—replaying the entire raw search history is unnecessary and wasteful. If raw evidence must be verified, resolve it via the Artifact URI. Restricting each Agent to its own task parameters, permitted tools, and minimal upstream artifacts conserves tokens and shields the model from distracting noise.

### Can Concurrent State Conflicts Be Resolved via Model Discussion?

Distinguish between perspective conflicts and state write conflicts. Two analyst Agents interpreting identical data differently can preserve their respective evidence for a reviewer or aggregator to evaluate. However, two branches concurrently overwriting `finalOutput` is a raw concurrency conflict that conversational negotiation cannot resolve.

Parallel outputs must be stored into segregated, role-specific slots, with final reports written exclusively by the aggregation node. Side effects like sending notifications, creating tickets, or issuing refunds must be guarded by idempotency keys, unique constraints, and database transactions—never rely on prompt instructions to prevent duplicate execution.

### What Goes Wrong When You Design Only for the Happy Path?

Suppose two search Agents execute in parallel; one succeeds, while the other times out. Whether to forward available materials to the reviewer or abort the pipeline depends on predefined acceptance thresholds. Task contracts must explicitly handle partial success, timeouts, cancellations, missing artifacts, and downstream skips. Otherwise, while your happy-path architecture diagram looks clean on paper, the orchestrator will stall the moment the first real-world production error occurs.

### Why Must You Inspect Execution Traces Rather Than Just Final Responses?

Even when a search tool fails completely, an LLM can still hallucinate a fluent, seemingly comprehensive report. Evaluating only final prose easily mistakes an ungrounded hallucination for operational success.

Rigorous verification requires auditing whether mandatory tools executed successfully, whether each role satisfied its contract, whether citations trace to verified source materials, and whether the aggregator suppressed failure notices from upstream branches. The final textual output is merely one artifact; it can never substitute for end-to-end verification of the execution process.
