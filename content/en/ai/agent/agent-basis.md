---
title: "AI Agent Core Concepts: Agent Loop, Plan-and-Execute, Structured Task Contracts, Agentic Workflows, and Tools Registration"
description: "In-depth analysis of AI Agent core concepts, tracing the evolution from passive response to persistent autonomy, and comparing differences and use cases among Agents, traditional programming, and Workflows."
category: AI Application Development
head:
  - - meta
    - name: keywords
      content: AI Agent, Agent, ReAct, Function Calling, RAG, MCP, Multi-Agent Collaboration, Computer Use
lang: en
sourceRef: zh-ref/ai/agent/agent-basis.md
---

"Help me investigate why the `user-service` API slowed down this morning and send the findings to the service owner." A request like this has no predetermined answer: whether to check metrics, logs, or a heap dump first depends on the evidence gathered in the preceding step. Even after discovering a slow SQL query, one must still evaluate whether to inspect the execution plan, how to formulate conclusions, and whether sending a notification is permissible.

A chat model can provide a troubleshooting checklist, but it cannot traverse this path autonomously. To accomplish the task, the model needs to select tools, read tool execution results, and decide subsequent actions or conclude based on those results. An AI Agent handles precisely this continuous process of decision-making and execution.

The more tools integrated, the less the execution path can be left unconstrained. Tasks with well-defined, static steps—such as deducting inventory during order placement or approval routing—should still be governed by traditional software or Workflows. Agents should only participate in decision-making when intermediate steps hinge on real-time evidence that cannot be hardcoded in advance.

This article unpacks this pipeline across its evolution, execution loops, tool integration, and common paradigms, providing selection criteria across Agents, Workflows, and traditional programming.

## Evolution of AI Agents

Agent capabilities did not emerge overnight. Models first acquired external invocation capabilities, followed sequentially by orchestration, long-running task execution, and persistent availability requirements.

**In 2022, when products like ChatGPT first gained widespread popularity**, models answered questions primarily based on pre-trained parametric knowledge. They could not proactively call external tools or complete operations autonomously. [Prompt Engineering](https://javaguide.cn/ai/agent/prompt-engineering.html) was the predominant paradigm: clearly articulating constraints and context was essential for stable outputs.

**In mid-2023, with the arrival of Function Calling, things began to change.**

Function Calling enabled LLMs to invoke external APIs, while RAG integrated external knowledge bases into the generation process. Early attempts like AutoGPT surfaced around this time, but they frequently suffered from redundant tool calls and even infinite loops during multi-step tasks.

**By late 2023, the industry turned its attention to orchestration.**

ReAct gained widespread adoption: models selected actions based on their current state, read tool return values, and continued reasoning. Multi-Agent division of labor entered practice during this period, allocating planning, execution, and verification to specialized roles.

Platforms like Coze and Dify employed Directed Acyclic Graphs (DAGs) to constrain execution paths, introducing observable and controllable boundaries around previously autonomous solutions.

**By late 2024, standardization and multimodality came to the forefront.**

The [MCP Protocol](https://javaguide.cn/ai/agent/mcp.html) emerged to resolve tool integration fragmentation, while Computer Use expanded execution horizons to graphical user interfaces. Coding assistants such as Cursor, Claude Code, and Codex progressively unified codebase reading, modification, testing, and commits into a single task workflow, popularizing discussions around "Vibe Coding."

**In 2025, Agents advanced toward long-running task execution.**

During this phase, Agents began managing long tasks extending beyond a single dialogue session: receiving tasks, running workflows, and persisting deliverables. Because a single prompt could no longer reliably encompass such workflows, standardized routines, context, templates, scripts, and validation rules were encapsulated as Skills to be loaded on demand for similar tasks.

**By 2026, Agents increasingly resembled persistently online digital workforce units.**

Projects like OpenClaw brought Skills and Heartbeats into the spotlight.

Skills encapsulate capabilities, while a Heartbeat periodically awakens the Agent to check messages, process tasks, or update state. This represents scheduled wakeups rather than continuous consciousness; local data sovereignty does not guarantee absolute security. Agents empowered to install Skills, access file systems, and execute scripts must actively confront permission boundaries, sandboxing, and supply chain vulnerabilities.

This evolution propelled Harness Engineering forward, framed as `Agent = Model + Harness`: the model handles reasoning and generation, while the Harness provides an executable, observable, recoverable, and verifiable runtime environment. Consequently, focus expanded beyond model parameters, context window sizes, and prompting tricks to the engineering environment operating outside the model.

Built-in memory, predictive capabilities, and expansion from digital environments to physical robotics remain active frontiers. These chronological milestones serve merely as analytical lenses; real-world products typically exhibit characteristics spanning multiple stages. The clearest inflection point remains mid-2023, when models transitioned from generating text to executing external operations.

### Differences Among Agents, Traditional Programming, and Workflows

Looking at what determines the execution path clarifies the boundaries between Agents, automated scripts, and Workflows:

```text
Traditional Programming: Programmer writes code → Execution result
Workflow: Product manager draws flowchart → Execution result
Agent: User states intent → AI decision-making → Dynamic execution
```

Scenarios characterized by deterministic, high-frequency logic—such as inventory deduction, payment state transitions, and message queue consumption—are best suited for traditional programs; introducing an Agent adds unnecessary latency and non-determinism.

Processes with distinct, well-defined pathways—such as approval workflows, content publishing, and lead routing—are ideal for Workflows. Step ordering and branch logic are governed by a graph, allowing issues to be isolated to specific nodes.

Conversely, "investigating why the service slowed down this morning" requires dynamic decision-making: whether to query metrics, logs, or heap dumps depends on intermediate findings, making it impossible to predetermine every branch. This domain of natural language comprehension and dynamic judgment is where Agents excel. In long processes where only a few steps are non-deterministic, Plan-and-Execute can be employed, embedding dynamic subtasks within a structured framework.

### What Challenges Do Agents Face?

A grounded discussion of Agents must address concrete engineering hurdles alongside possibilities:

- In long-running tasks, historical context becomes truncated, causing the model to suffer from "amnesia." Worse, longer contexts do not guarantee better reasoning; many models exhibit degraded information retrieval efficiency for content placed in intermediate positions ("Lost in the Middle").
- Tool calling mitigates hallucinations but cannot eliminate them entirely. LLMs may still generate flawed assumptions during reasoning steps, and tool return data may fail to correct them.
- Multi-turn iterations, tool invocations, log round-trips, and context compression consume substantial Token budgets. A single complex task run can incur sobering costs.
- Agents capable of executing code, invoking APIs, and manipulating files inevitably face Prompt Injection and privilege escalation risks. Practical safeguards require least-privilege principles, sandboxing, and human authorization for high-risk actions.
- In deep multi-step reasoning, LLMs easily fall into local optima, appearing to make steady progress while drifting entirely off topic.
- Determining why an Agent made a specific decision, invoked a particular tool, or which step contaminated the context presents formidable debugging challenges.

Well-established directions addressing these hurdles include: expanded context windows, hierarchical memory architectures, multimodal GUI automation, sandboxing and permission frameworks, and inference efficiency optimizations.

## What Is an AI Agent?

Upon receiving a request regarding "service degradation," a troubleshooting Agent might first inspect metrics, query logs corresponding to triggered alerts, and finally deliver diagnostic findings to the responsible engineer. Each step is conditioned on evidence obtained in the previous one. Frameworks like LangChain encapsulate these workflows; underneath, the architecture fundamentally operates as a continuous loop that inspects state, chooses an action, and writes back the outcome.

An AI Agent is a software system capable of perceiving its environment, making decisions, and executing actions. An LLM interprets intent and decides actions, tools execute external operations, and memory preserves task progress and historical context. Unlike chatbots that merely generate conversational replies, an Agent continuously observes and adapts throughout task execution until completion criteria are met.

A widely adopted conceptual formula is: **Agent = LLM + Planning + Memory + Tools**.

![AI Agent Core Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-core-arch-dc0d3123.png)

**Reasoning / Planning** determines intermediate objectives and subsequent actions. The LLM breaks down objectives based on current task state; Chain-of-Thought (CoT) prompting decomposes reasoning into explicit steps, discouraging premature, unverified conclusions.

Short-term memory typically resides within the conversational context history to maintain dialogue continuity. Long-term memory is commonly backed by external repositories, such as vector databases or knowledge graphs, facilitating retrieval of past accumulated knowledge.

**Tools** handle data queries, API invocations, file operations, and code execution. Execution results must be appended back into the context as subsequent Observations; otherwise, the model remains blind to external feedback, leaving future actions ungrounded.

For the end-to-end tool calling pipeline, permissions, secondary confirmation, idempotency, auditing, timeouts, and Java examples, see [Structured Output and Function Calling](../llm-basis/structured-output-function-calling.md); for metrics like task completion rate, tool calls, and execution trajectories, see [How to Evaluate Agent Applications](../llm-basis/llm-evaluation.md#agent-应用怎么评测).

### What Is the Agent Loop?

The Agent Loop executes this feedback cycle continuously. In each iteration, the LLM selects an action based on context, executes the tool, and writes back the result, terminating when the task completes or a stop condition is reached.

![Agent Loop Workflow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-loop-flow-27c47f02.png)

During loop initialization, the System Prompt, available tool definitions, and user prompt are loaded. Subsequently, the model alternates between "direct response" and "tool invocation"; tool execution outputs are fed back into context until the model ceases requesting tools.

Setting a maximum iteration bound between 10 and 20 iterations is a common safeguard, alongside Token consumption caps. These thresholds prevent faulty reasoning loops from escalating into infinite executions.

Context expands with each iteration's results. As critical information dilutes, the model becomes prone to deviation. Context Engineering specifically addresses filtering and structuring this information. Although frameworks like LangChain, LlamaIndex, and Spring AI offer varied abstractions, all fundamentally center on this core Loop.

### What Are the Minimum Three Layers to Build an Agent System?

Code interfacing directly with models falls under **LLM Call**: this layer handles vendor API discrepancies (OpenAI, Anthropic, Hugging Face), streaming responses, token truncation, and retry mechanics.

**Tools Call** connects Function Calling, MCP, Skills, file I/O, web search, code sandboxes, and third-party APIs to the model. Tool availability and return payload formats directly dictate downstream decisions.

The prompt, dynamic memory, session state, and tool schemas delivered to the model are organized by **Context Engineering**. When the context lacks task-critical information or is overwhelmed by irrelevant noise, task progress stalls even if underlying model capabilities are sufficient.

## What Standard Formats Do Tool Registration and Invocations Follow?

Accurate tool invocation by an Agent relies on two foundational elements: OpenAI Schema and MCP.

OpenAI Schema resolves data serialization formats, while MCP resolves communication and protocol integration.

### Data Format: Function Calling Schema

External tools can be internally complex, but LLMs rely strictly on structured declarations during inference.

Mainstream data formats converge around the OpenAI Function Calling Schema, with Anthropic, Google, and others offering equivalent formats.

Using JSON Schema, it defines the tool name, operational purpose, parameter types, and required fields. The model relies on this metadata to determine whether to invoke the tool and how to serialize parameters.

Consider a common tool utilized in data engineering: querying slow SQL logs.

```json
{
  "type": "function",
  "function": {
    "name": "query_slow_sql",
    "description": "Query slow SQL logs for a specified microservice within a given time range. Use this when the service responds slowly, the database times out, or CPU spikes. Do not call this if the user asks about network or memory issues.",
    "parameters": {
      "type": "object",
      "properties": {
        "service_name": {
          "type": "string",
          "description": "Service name, e.g., user-service, order-service"
        },
        "time_range": {
          "type": "string",
          "description": "Time range in format HH:MM-HH:MM, e.g., 09:00-09:30"
        },
        "threshold_ms": {
          "type": "integer",
          "description": "Slow SQL threshold in milliseconds, default is 1000"
        }
      },
      "required": ["service_name", "time_range"]
    }
  }
}
```

The quality of a tool's description directly influences Agent decision accuracy.

Whether a model invokes a tool and how it formats arguments depends heavily on the `description`. The description should articulate both applicable and non-applicable conditions. For example, explicitly specifying that the slow SQL tool excludes network and memory issues prevents misdirected invocations.

### Advanced Encapsulation: Skills

Troubleshooting a slow query often requires reading logs, executing analysis scripts, and structuring recommendations in alignment with team guidelines. Relying on an Agent to plan these steps ad hoc on every run undermines consistency and reusability.

A Skill encapsulates this execution chain's sequence, constraints, and known edge-case resolutions in an on-demand instruction file. The host environment injects relevant contents into context only when task criteria match.

Two primary encapsulation models exist:

**Traditional Toolkits (Black Box)** bundle multiple atomic tools into a higher-level composite tool in code, exposing only a JSON Schema to the LLM while concealing internal execution paths. This approach suits deterministic logic requiring reduced reasoning overhead and Token consumption.

When execution transparency is required, **Agent Skills (White Box)** typically employ `SKILL.md` as an entrypoint, expressing operational instructions in natural language. A Skill typically resides in a self-contained directory:

```text
.claude/skills/code-reviewer/
├── SKILL.md          ← YAML frontmatter + detailed instructions
├── scripts/xxx.py    ← Optional: supporting scripts
└── reference.md      ← Optional: reference documentation
```

Lightweight metadata at the top of `SKILL.md` facilitates discovery, describing the Skill's purpose and trigger conditions; the body documents workflows, constraints, and examples. The host inspects metadata first, loading full documentation only when the model determines necessity. This lazy-loading mechanism constitutes the core distinction between Agent Skills and traditional Toolkits.

Tools such as Claude Code and Cursor scan `.claude/skills/` directories, delegating activation decisions to the model. Use Toolkits when execution paths are rigid; use Agent Skills when preserving team institutional knowledge while maintaining flexible task workflows. For routing design, `SKILL.md` authoring, and third-party Skill security audits, refer to [In-Depth Guide to Agent Skills](https://javaguide.cn/ai/agent/skills.html).

### Communication Access: The MCP Protocol

While Function Calling Schema specifies tool naming, parameters, and descriptions, MCP defines how tools interface with host runtime environments; the two solve distinct problems.

Anthropic introduced the Model Context Protocol (MCP) in November 2024 to address tool fragmentation. Previously, developers maintained repetitive manual mappings in application code, such as:

Tool name → Concrete execution function + JSON Schema definition

Integrating each new tool demanded bespoke glue code. As tool counts expanded, maintenance overhead escalated.

MCP introduces a standardized communication protocol based on JSON-RPC 2.0, frequently dubbed the "USB-C port" of the AI ecosystem. External systems expose capabilities via an MCP Server; upon connection, the host program automatically discovers and registers available tools.

![MCP Illustration](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

This decouples the AI application from underlying external execution code.

MCP defines three primary standard primitives:

| Primitive Type | Role | Example |
| --- | --- | --- |
| Tools | Functions proactively invoked by the LLM | Querying databases, sending emails, executing code |
| Resources | Read-only data fetched by the Agent on demand | Local files, database records, log streams |
| Prompts | Reusable prompt templates | Code review templates, incident report templates |

A common point of confusion: when an MCP Server exposes tools, it internally uses JSON Schema to specify parameter constraints.

JSON Schema governs data formatting; MCP operates at the communication protocol layer.

## What Is Prompt Engineering?

A Prompt represents the input instructions and context supplied to a large language model. Prompt Engineering governs task boundaries, output formats, and operational constraints: absent these boundaries, the model must guess; once clearly established, output stability improves. For concrete techniques, see [LLM Prompt Engineering](https://javaguide.cn/ai/agent/prompt-engineering.html).

## What Is Context Engineering?

When context contains excessive irrelevant information, model task performance degrades even when latent capabilities are sufficient.

Context Engineering ensures that within a finite Token window, the most relevant information reaches the model while noise is filtered out. It is easily conflated with Prompt Engineering.

Prompt Engineering focuses on the phrasing and structure of prompts, whereas Context Engineering exercises broader oversight, managing rules, memory, tool schemas, session state, external observations, and Token budgeting.

![Differences Between Context Engineering and Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

Because this topic encompasses substantial depth, detailed treatments are available in [LLM Prompt Engineering](https://javaguide.cn/ai/agent/prompt-engineering.html) and [Context Engineering](https://javaguide.cn/ai/agent/context-engineering.html).

## What Are the Core Agent Paradigms?

### ReAct

ReAct stands for Reasoning + Acting, proposed by Shunyu Yao et al. in 2022 in the paper [ReAct: Synergizing Reasoning and Acting in Language Models](https://react-lm.github.io/).

Agent implementations across frameworks like LangChain, LlamaIndex, and AgentScope prominently reflect this paradigm.

Its premise is intuitive: the model reasons, takes an action, receives environmental feedback, and reasons again, alternating cyclically.

LLMs inherently lack real-time data and remain susceptible to hallucinations. ReAct enforces an incremental "step-by-step" approach where each subsequent inference builds upon tool execution feedback.

![ReAct-LLM](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/ReAct-LLM-a5126f80.png)

Consider the task: investigate why the `user-service` API slowed down this morning and notify the service owner.

A ReAct execution unfolds along these lines:

First, it checks morning metrics for `user-service`, discovering that between 9:00 and 9:30 AM, CPU utilization surged to 98%, accompanied by numerous slow SQL alerts.

Tracing this lead, it queries logs to retrieve the offending slow SQL statement, identifying a full table scan missing an index.

Next, it queries the employee directory to locate the service owner, identifying Wang Jianguo with email `wangjianguo@company.com`.

Finally, it compiles a diagnostic report and dispatches an email notification.

This sequence is not hardcoded at the outset. If initial metrics had indicated memory OOM instead, the second step would have inspected a heap dump rather than slow queries.

Herein lies the value of ReAct: it continuously adjusts trajectory based on emerging evidence.

Deploying ReAct in production typically requires coordinating these components:

1. Historical context, capturing reasoning traces, executed actions, and feedback observations.
2. Real-time environmental inputs, such as system alerts and user feedback.
3. LLM reasoning module: responsible for logical analysis and next-step planning.
4. Tool and skill repository, encompassing atomic tools and composite Skills.
5. Feedback observation mechanism, capturing tool outputs and appending them back into context.

![ReAct Mode Flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-react-flow-06e50bf7.png)

Because each step in ReAct is driven by external observations, decision rationales are far easier to audit than one-shot generation, reducing ungrounded deductions. Conversely, multi-turn invocations increase end-to-end latency, and overall effectiveness depends heavily on tool and Skill reliability.

For instance, checking metrics, searching logs, and identifying bottlenecks can be encapsulated into a `diagnose_service_performance` Skill that returns a structured diagnostic summary to the LLM, eliminating the need to assemble atomic operations from scratch on every run.

### Plan-and-Execute

The LangChain team introduced Plan-and-Execute in 2023: an LLM first generates a comprehensive multi-step plan, which an execution engine then carries out sequentially. Long tasks with extensive steps and explicit dependencies benefit from this pattern by maintaining clear macro-level progress.

However, the plan also defines its operational boundary. If unexpected outcomes occur during execution, dynamic adaptation and fault tolerance lag behind the incremental reasoning of ReAct, behaving more like a static workflow.

These two patterns can be nested: CoT outlines global milestones, while an inner ReAct loop executes each individual milestone. The overarching plan provides structural alignment, while sub-loops resolve localized uncertainty.

### Reflection

Reflection adjusts Agent behavior through natural language feedback without modifying model weights. Common implementations address distinct phases:

- Reflexion logs retrospective critiques into a memory buffer following task failure. For example, if code debugging reveals that `count` was invoked prior to initialization, subsequent runs reference this critique to avoid recurrence.
- Self-Refine instructs the model to inspect its own draft responses, code, or copy against criteria before iterating on improvements.
- CRITIC verifies factual claims using external tools (e.g., search engines, code execution sandboxes), refining outputs based on verification feedback.

Reflection typically layers atop ReAct or Plan-and-Execute: validation and adjustments integrate into the workflow, while execution mechanics remain anchored in the primary paradigm.

### Multi-Agent

When tasks decompose cleanly into specialized responsibilities—such as planning, execution, and validation—they can be delegated to cooperating Agents. In the **Orchestrator-Subagent pattern**, an orchestrator Agent formulates a global plan and dispatches tasks, sub-agents execute tasks in parallel or sequence, and the orchestrator aggregates results.

When tasks benefit from debate, peer review, or cross-validation, a **Peer-to-Peer pattern** allows peer Agents to communicate and critique directly.

![Multi-Agent System Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-multi-agent-arch-f7551234.png)

When tasks genuinely map to specialized roles, Multi-Agent systems enable parallel execution, where individual subtask failures do not necessarily compromise the broader process. In exchange, inter-agent communication, coordination, and debugging overhead grow substantially, as does Token consumption.

Production implementations must address task contracts, shared state, concurrent write conflicts, worker handoffs, and checkpoint recovery. For in-depth design, see [Multi-Agent Collaboration System Design: Task Splitting, State Sharing, Conflict Handling, and Failure Recovery](./multi-agent.md).

### Structured Task Contracts

As single-agent setups scale to Multi-Agent architectures, inter-agent communication becomes an engineering bottleneck.

Relying on unconstrained natural language conversations incurs heavy Token overhead and invites parsing errors.

Structured task contracts alleviate these handoff frictions.

They mandate that roles exchange deliverables conforming to strict schemas rather than freeform text, using JSON or XML to define task fields, outcomes, and state transition directives.

By analogy, backend microservices do not parse HTML pages to exchange data; they transmit structured objects across RESTful or RPC interfaces.

A structured task contract explicitly defines what each role receives, what it delivers, and how outputs are validated.

For instance, when a "Product Manager Agent" finishes a specification, it should not merely output "I'm done, please proceed with development." Instead, it outputs a standardized JSON payload specifying `TaskID`, `Dependencies`, and `AcceptanceCriteria`. The developer Agent deserializes this payload directly and begins execution.

This structured handoff does not automatically equate to a full A2A protocol implementation; for cross-process Agent capability discovery, task status, and artifact delivery, see the [A2A section in the Multi-Agent article](./multi-agent.md#a2a-能解决什么-不能解决什么).

![A2A Protocol Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-a2a-f065a1d9.png)

### Agentic Workflows

Agentic Workflows, widely championed by Andrew Ng, emphasize using engineering orchestration to connect reasoning, tools, memory, reflection, and multi-entity collaboration into executable workflows, rather than waiting solely for base model capability advances.

![Agentic Workflows Core Patterns](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-agentic-workflows-b6f6e106.png)

Common architectural patterns include:

1. Reflection—enabling models to critique their own work.
2. Tool Use—equipping LLMs with web search, code execution, and data tools.
3. Planning—directing models to devise and execute multi-step plans.
4. Multi-agent Collaboration—coordinating multiple Agents to achieve complex objectives.

In real-world implementations, these patterns typically operate in combination. For example, a system might use Planning to decompose a task, run ReAct with Tool Use inside subtasks, and finish by applying Reflection to inspect final outputs. Agentic Workflows describes this compositional philosophy rather than a single isolated framework.

## What Is the Relationship Between AI Workflows and Agents?

In processes like "generate draft → quality review → revise based on feedback," step ordering and retry criteria can be codified into graph structures in advance; the LLM merely handles generation or evaluation at specific nodes. Such AI Workflows allow issues to be localized cleanly to concrete nodes and edges.

A pure Agent, by contrast, relies on the LLM at runtime to decide whether to invoke tools, which tools to call, and what trajectory to follow. It is ideal when investigation targets and search strategies depend dynamically on intermediate findings.

Agentic Workflows combine both: a global Workflow stabilizes the overarching process, while Agent sub-loops are embedded selectively where paths are non-deterministic.

### What Are Node, Edge, and State in a Workflow?

In a workflow runtime, Nodes execute logic, Edges dictate control flow, and State shares context across nodes; collectively, they form a directed graph.

A Node does one thing: reads state, executes logic, and writes back results. Inside a node, it can call an LLM, invoke a tool, or execute standard code. In an article generation workflow, canonical nodes include "Generate Draft," "Review Quality," and "Revise Based on Feedback." The more atomic a node's responsibility, the easier it is to troubleshoot. Edges determine where execution routes next—sequential edges advance linearly, conditional edges branch based on runtime state, and cyclic edges return to prior nodes for retries. State records artifacts such as the active draft, quality scores, and retry counts, which conditional edges inspect to make routing decisions.

Translating "if review fails, return to revision, retrying at most 3 times" into graph architecture yields a conditional edge from `ReviewNode` to `ReviseNode`, coupled with a safeguard routing to `ExitNode` when `iteration_count >= 3`. The `iteration_count` variable in State is the operational mechanism enabling this logic.

This graph-based design scales far better than monolithic if-else blocks and makes failures straightforward to trace to specific nodes and edges. LangGraph (Python) and Spring AI Alibaba Graph (Java) implement this paradigm. Detailed architecture and code implementations are covered in [Workflow, Graph, and Loop in AI Workflows](https://javaguide.cn/ai/agent/workflow-graph-loop.html).

### When to Use Agent, When to Use Workflow?

Whether the execution path can be predetermined is the most straightforward decision criterion:

If deterministic, use a Workflow. If non-deterministic, use an Agent. If both apply, use Agentic Workflows.

However, a common cognitive bias exists: many assume a task's "path is non-deterministic" when requirements simply have not been properly decomposed. Once decomposed thoroughly, most scenarios reveal themselves as "an LLM performing generation or evaluation at fixed nodes"—a setup far more stable and auditable under a Workflow.

Tasks genuinely suited for pure Agents are those where execution steps cannot be drafted in advance. For example, in "troubleshoot this production outage," what to inspect, how to inspect it, and how deep to probe cannot be rigidly scripted beforehand.

Another consideration is fault tolerance. Workflows have deterministic paths, making issues easy to isolate; Agents have dynamic paths, increasing debugging difficulty by an order of magnitude. Enterprise B2B scenarios generally favor Workflows or Agentic Workflows.

## How to Choose Among Paradigms?

Having examined ReAct, Plan-and-Execute, Reflection, Multi-Agent, and AI Workflows, choosing the right approach during project inception can feel overwhelming. Consider this reference matrix:

| Scenario Characteristics | Recommended Direction | Cost / Trade-offs |
| --- | --- | --- |
| Execution path predetermined; nodes require LLM reasoning | AI Workflow (Graph) | High stability and observability; higher upfront design cost |
| Execution path non-deterministic; requires dynamic planning | ReAct | Flexible; higher Token consumption; challenging to debug |
| Long-running task with many steps but clear global structure | Plan-and-Execute | Low drift risk; weaker dynamic adjustment capabilities |
| High output quality requirements; multi-turn iteration permitted | Layered Reflection | Pair with ReAct or P&E; do not use in isolation |
| Task decomposes naturally across specialized roles | Multi-Agent | Communication and debugging overhead multiply |
| Long-running task where select subtasks are unpredictable | Agentic Workflows | Global Workflow with localized nested ReAct loops |

Establish an end-to-end baseline using the simplest viable approach first, upgrading specific layers only as concrete failure modes emerge.

Jumping straight into Multi-Agent architectures that rely entirely on dynamic model reasoning without context governance creates an engineering quagmire that is difficult to untangle.

## Summary

Most Agent projects struggle with instability not because the underlying model is deficient, but because architectural foundations are weak. Across the four pillars—LLM + Planning + Memory + Tools—deficiencies in any area introduce noticeable bottlenecks. Without Tools, an Agent remains confined to giving passive advice; without Memory, tasks of modest length suffer amnesia; without Context governance, models easily drift off course.

Architectural choices are also easily misjudged. ReAct is versatile but difficult to debug and burns significant Tokens; Workflows are robust but demand rigorous upfront requirement decomposition, becoming cumbersome to modify if designed prematurely; Multi-Agent setups introduce communication and debugging overhead that frequently exceeds expectations. Adopting the most complex architecture at the outset remains the most common pitfall in engineering practice.

Another frequently neglected aspect is tool descriptions. While MCP standardizes connection mechanics and JSON Schema governs format definitions, whether a model invokes a tool and how it populates parameters ultimately depends on those few sentences in the `description`. Cutting corners here incurs steep downstream debugging costs.

Choosing between Agents and Workflows is ultimately straightforward: draft the execution path first. If it can be mapped deterministically, use a Workflow; if not, employ an Agent. Getting this architectural decision right yields far greater leverage than chasing framework hype.
