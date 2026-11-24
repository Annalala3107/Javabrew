---
title: "AI Core Concepts Overview: LLMs, Agents, RAG, MCP, and System Design"
description: "A comprehensive summary of core concepts across the JavaGuide AI series, connecting Tokens, Function Calling, Agent Loops, MCP, Skills, Multi-Agent systems, Embeddings, Reranking, Model Gateways, Evaluation, Observability, and Security across four main tracks: LLM Fundamentals, Agents, RAG, and System Design."
category: AI
tag:
  - AI
  - LLM
  - AI Agent
  - RAG
  - MCP
  - AI System Design
head:
  - - meta
    - name: keywords
      content: AI Core Concepts, LLM Core Concepts, LLM, Token, Agent, Agent Loop, ReAct, Plan-and-Execute, RAG, Embedding, MCP, Skills, Multi-Agent, Prompt Engineering, Context Engineering, Function Calling, Tool Calling, GraphRAG, LLM Gateway, AI Evaluation, AI Observability, Prompt Injection, Voice Agent
lang: en
sourceRef: zh-ref/ai/ai-core-concepts.md
---

Why doesn't a model give the exact same answer every time? Why do Agents need loops? Why might RAG still give wrong answers even after successfully retrieving relevant documents? These questions lie across distinct stages: model generation, task execution, knowledge retrieval, and application governance.

This article brings together the related concepts from the JavaGuide AI series. Specific implementations and in-depth case studies are expanded in each dedicated topic article.

## LLM Fundamentals

Related original articles:

- [LLM Operation Mechanism: How Tokens, Context Windows, and Sampling Parameters Affect Output](./llm-basis/llm-operation-mechanism.md)
- [LLM API Invocation Engineering Practice: Streaming, Retries, Rate Limiting, and Structured Responses](./llm-basis/llm-api-engineering.md)
- [What Is Prompt Engineering? Common Prompting Techniques](./agent/prompt-engineering.md)
- [LLM Structured Outputs: From JSON Contracts to Function Calling Implementation](./llm-basis/structured-output-function-calling.md)
- [AI Application Evaluation Framework: From Golden Set Construction to Online Canary Rollouts](./llm-basis/llm-evaluation.md)

### LLM

When an input method sees "The weather today is really ", it might suggest "nice" as a candidate word. The generation process of an autoregressive large language model operates similarly: it predicts the next Token based on the current context, appends that result to the context, and predicts the next one, continuing until an end token is encountered or an output limit is reached. This process is known as **Autoregressive Generation**.

Within a single generation pass, a Token is the text unit that the model processes and outputs step by step; the context window limits the total number of Tokens that a single call can accommodate; parameters such as Temperature and Top-p influence candidate Token sampling; and Max Tokens controls the maximum number of Tokens this generation can produce.

### Token

The model first uses a Tokenizer to slice text into fragments of varying lengths. There is no fixed "one character per Token" or "one word per Token" rule: an English word might be split into multiple Tokens, Chinese characters or words might be split into several Tokens, while certain high-frequency words or phrases might be merged into one.

Character-by-character splitting produces overly long sequences, while whole-word splitting requires an enormous vocabulary. **Subword tokenization algorithms** like BPE (Byte Pair Encoding) and Unigram balance these tradeoffs: high-frequency fragments are preserved as single units, while low-frequency words are broken down further. The exact tokenization outcome depends on the Tokenizer used by the model provider.

Capacity planning can begin with empirical estimates, but billing and monitoring should always read the actual `usage` returned by the API.

**Tokenization Process Example**:

- Original text: `你好，我是小 G。`
- Tokens: `[你好]` `[，]` `[我是]` `[小 G]` `[。]`
- Statistics: 9 original characters → 5 Tokens → compression ratio of approx. 1.8x

![Tokenization Process Example](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-token-process-f3c248b4.png)

The tokenization above is for illustrative purposes only and does not represent the exact output of any specific model. Different providers or models use different Tokenizers, so the same text may yield different Token sequences.

### Context Window

The **Context Window** serves as the LLM's "Working Memory." It determines the total amount of text (measured in Tokens) that the model can process or "remember" at any given moment.

- Conversation continuity: Determines how many turns of dialogue a model can sustain without forgetting earlier details.
- Single-pass processing capacity: Determines the maximum document size, codebase, or data sample the model can process in one go.

Statements like "The model supports 128K/200K/1M" refer to the maximum total Token limit that can be fed into the model in a single invocation. In most models, the context window covers the sum of both input and output, though some providers (such as Google Gemini) set separate limits for inputs and outputs. Always consult specific API documentation before implementation.

The context window is often consumed by hidden overheads:

![Context Window = LLM Working Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-context-window-e2089807.png)

- System Prompt: Instructions that steer model behavior (hidden from end users, but consuming window space).
- User Prompt: Business data and instructions.
- Multi-turn conversation history: Records of past messages.
- RAG retrieval snippets: Supplementary context retrieved from external knowledge bases.
- Tool calling Schemas: Function definitions and parameter schemas.
- Formatting overhead: Special characters, line breaks, Markdown formatting tags, etc.
- Model-generated output Tokens: **Output also consumes the context window**.

Because all these components share the window, the space left for business text is often much smaller than the advertised headline capacity.

### Sampling Parameters

At each step, the model assigns a raw score (internally called **logits**) to **every** candidate Token in its vocabulary. A higher score indicates that the model considers the word more likely to appear next.

For example, suppose the model is completing "The weather today is really \_\_". It might produce scores like this:

| Candidate Token | Raw Score (Logit) |
| --- | --- |
| great | 5.0 |
| nice | 3.2 |
| wonderful | 2.1 |
| terrible | 0.5 |
| purple | -8.0 |

Raw scores are not probabilities. They must pass through a **softmax** function to yield a probability distribution. Assuming the candidate pool contains only these five options, the calculation yields roughly:

| Candidate Token | Probability |
| --- | --- |
| great | 81.21% |
| nice | 13.42% |
| wonderful | 4.47% |
| terrible | 0.90% |
| purple | < 0.001% |

The model then samples from this probability distribution to determine which Token to output.

Decoding parameters (Temperature, Top-p, Top-k, etc.) exert control over this "scoring → probability → sampling" pipeline:

- Temperature: Adjusts the "shape" of the probability distribution, making high-scoring options stand out more or evening out probabilities across options.
- Top-p / Top-k: Directly cuts off improbable candidates, shrinking the "sampling pool."
- Penalty series: Lowers scores for tokens that have already appeared, preventing repetition loops.

![Temperature Parameter: Controlling Model Output Randomness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-temperature-params-93a80dd5.png)

### Prompt

A Prompt is a task instruction passed to a Large Language Model (LLM). The LLM generates subsequent Tokens based on current context, exhibiting semantic understanding and instruction-following abilities; however, when task boundaries are ambiguous, it may still deviate from the topic or fabricate non-existent information.

The purpose of a Prompt is to constrain the model's generation scope. Quality does not correlate directly with length. Rather than stacking descriptive adjectives, it is far more important to clearly convey four key pieces of information: Role, Task, Context, and Format.

![Prompt Four-Element Framework](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/prompt-four-element-framework-4589e72c.svg)

| Element | Role | Common Phrasing |
| --- | --- | --- |
| Role | Informs the model which domain knowledge and tone to adopt | "You are a Java architect with 10 years of experience" |
| Task | Specifies what action to perform | "Please review the following code for performance bottlenecks" |
| Context | Provides relevant background information for the task | "Current production QPS is 2,000, with response latency exceeding 500ms" |
| Format | Dictates what the output should look like | "Output JSON containing two fields: bottleneck and solution" |

### Structured Output

Consider a very common Prompt:

```text
Please determine which category this user feedback belongs to, and return JSON.

User feedback: My payment succeeded, but the order still shows pending payment.
```

The model might return:

```json
{
  "category": "payment",
  "priority": "high",
  "reason": "Payment succeeded but order status was not updated"
}
```

While readable by humans, this is not yet a stable contract that backend services can reliably consume. The business side must define strict boundaries:

- `category` can only be `PAYMENT`, `LOGISTICS`, `AFTER_SALE`, or `ACCOUNT`.
- `priority` can only be `LOW`, `MEDIUM`, or `HIGH`.
- `confidence` must be a decimal between `0` and `1`.
- Can `reason` be null? What is its maximum length?
- If user input lacks information, should it return `NEED_MORE_INFO` or guess?

Natural language Prompts struggle to maintain these boundaries reliably over time. You must distinguish between what JSON Mode, JSON Schema, and Structured Outputs each accomplish:

- **JSON Mode** is an output mode that constrains the model to return syntactically valid JSON.
- **JSON Schema** is a structural description specification used to define which fields the JSON must contain, field types, required fields, enum values, and whether extra fields are allowed.
- **Structured Outputs** is a constrained generation capability provided by model providers. It accepts a JSON Schema or similar schema, forcing the model to adhere strictly or near-strictly to that structure during the generation process itself.

JSON Schema describes the contract, while model API capabilities like Structured Outputs, Function Calling, and Tool Calling enforce that contract during generation. Supplying schema text alone without generation constraints may still result in outputs that violate field specifications.

![Three-Layer Generation Constraints: JSON Mode governs syntax, JSON Schema governs contracts, Structured Outputs shifts contracts left into the generation stage](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-three-layer-c-985e2251.png)

### Function Calling / Tool Calling

When a model returns `query_order` with arguments `{"orderId": "1029384756"}`, no Java method has been executed yet. Function Calling / Tool Calling only enables the model to generate a structured invocation intent; the backend service, Agent Runtime, MCP Host, or provider-hosted environment is responsible for actually executing the tool.

A complete invocation flow encompasses intent generation, business validation, tool execution, and result backfilling:

![Complete Function Calling Flow: The model only generates intent; actual tool execution occurs on the business side](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-function-call-38a32aa6.png)

1. The server registers tool names, descriptions, and parameter Schemas.
2. The user asks: "Check where order 1029384756 is right now."
3. The model selects `query_order` and generates arguments `{"orderId": "1029384756"}`.
4. The business layer validates field types, required parameters, user permissions, order ownership, and idempotency keys.
5. Once validation passes, the business layer calls the order system, database, or HTTP API.
6. Tool results, along with the `tool_use_id`, are fed back to the model. Anthropic requires exact matching of `tool_use_id`, and Gemini 3 generates a unique `id` for each `functionCall`; in parallel calls, missing matching IDs can mispair results with tool requests.
7. The model organizes its final answer based on the tool results.

### Production-Grade LLM Invocations

Behind every response seen by a user lies business validation, context assembly, model routing, provider calls, response parsing, and persistence. If any link lacks state tracking or error handling, the user interface usually degrades to a generic "Model invocation failed."

A production system must track at least eight distinct stages:

1. Validate user identity, tenant, subscription tier, feature permissions, and request size.
2. Assemble System Prompt, user input, conversation history, RAG evidence, tool Schemas, and output format constraints.
3. Estimate input Tokens and reserve output budgets, pruning history, compressing context, or switching models if necessary.
4. Route requests through a unified client or model gateway to apply model selection, timeouts, retries, and rate-limiting policies.
5. Invoke provider APIs, consuming synchronous responses or streaming responses via SSE or WebSocket.
6. Parse delta text, finish reasons, tool calls, Token usage, refusals, and structured results.
7. Persist responses, call attempts, costs, error reasons, and business states.
8. Record Traces, TTFT (Time-To-First-Token), total latency, retry counts, rate-limiting ratios, and parse failure rates.

When implementing retries, differentiate error types. Transient network drops, certain provider 5xx errors, and rate limits can be retried within a global deadline; parameter errors, authentication failures, and safety refusals are pointless to retry without modification. Whenever retries exist, design idempotency keys and log business messages, model attempts, and provider requests separately to prevent duplicate answers or duplicate executions of side-effecting tools.

### AI Application Evaluation

Public benchmarks help weed out visibly inadequate models, but they cannot replace domain validation. Real-world queries carry typos, colloquial slang, screenshots, multiple languages, and contradictions, and high-risk edge cases can easily be obscured by high average benchmark scores.

Domain evaluation typically begins with a Golden Set. Every test case should include inputs, expected results or success criteria, scenario tags, and scoring methods. RAG requires evaluating retrieval and generation separately; Agents require inspecting tool selection, parameters, execution trajectories, and real external system state in addition to final answers.

Common evaluation methods have specialized roles:

| Method | Best Suited For | Main Limitations |
| --- | --- | --- |
| Rule-Based Evaluation | JSON format, field completeness, enum values, numerical boundaries, test suite results | Can only cover explicitly codeable conditions |
| LLM-as-Judge | Relevance, faithfulness, completeness, coherence, and tone | Subject to positional, length, and self-enhancement biases |
| Human Evaluation | High-risk samples, complex semantics, and disputed cases | Slow, expensive, difficult to maintain consistency |

A sustainable evaluation pipeline connects offline evaluation, production Trace replay, and online canary rollouts: use fixed datasets to compare versions during development, replay real traces before release, and collect samples from badcases and user feedback post-launch. Prompts, models, retrieval strategies, tool versions, and evaluation scores must be linked; otherwise, when scores fluctuate, identifying the root cause is impossible.

## Agent

Related original articles:

- [AI Agent Core Concepts: Agent Loop, Plan-and-Execute, A2A, Agentic Workflows, and Tool Registration](./agent/agent-basis.md)
- [Workflows, Graphs, and Loops in AI Workflows: From Concept to Implementation](./agent/workflow-graph-loop.md)
- [What Is Context Engineering? Differences Between Context and Prompt Engineering](./agent/context-engineering.md)
- [AI Agent Memory Systems: Short-Term, Long-Term, and Memory Evolution Mechanisms](./agent/agent-memory.md)
- [Multi-Agent Collaboration System Design: Task Decomposition, State Sharing, Conflict Resolution, and Failure Recovery](./agent/multi-agent.md)
- [What Is the Model Context Protocol (MCP)? Relationship to Function Calling and Agents](./agent/mcp.md)
- [What Are Agent Skills? Differences Between Skills, Prompts, and MCP](./agent/skills.md)
- [Harness Engineering: Six-Layer Inspection Framework, Context Management, and Engineering Practice](./agent/harness-engineering.md)
- [What Is Loop Engineering? Why Is It "Old Wine in New Bottles"?](./agent/loop-engineering.md)

### What Is an Agent?

A standard LLM invocation terminates once it generates a piece of text. An Agent Runtime, however, inspects whether the model produced a tool call, executes the tool, writes the result back into the context, and asks the model to decide the next step. Agent implementations in frameworks like LangChain therefore typically revolve around a loop.

This architecture is conventionally formalized as: **Agent = LLM + Planning + Memory + Tools**. The LLM handles task comprehension and decision-making, Planning manages steps and dependencies, Memory preserves current state or historical knowledge, and Tools connect to databases, APIs, filesystems, and code execution sandboxes.

![AI Agent Core Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-core-arch-dc0d3123.png)

Short-term memory typically holds the current session and task state, while long-term memory reuses user preferences, historical decisions, or task learnings across sessions. Return values from tool executions constitute Observations; the runtime appends them to the context so the model can continue reasoning based on actual outcomes.

### Agent Loop

The Agent Loop connects model decision-making and tool execution into a continuous feedback cycle. Each turn reads the current context, and the model chooses whether to respond directly or invoke tools; the runtime executes actions, records results, and advances to the next turn.

![Agent Loop Workflow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-loop-flow-27c47f02.png)

1. Initialize System Prompt, available tools, and user request.
2. The model inspects the context and returns text or a tool call intent.
3. The runtime executes tools and writes results and state back into the context.
4. The loop terminates when the model ceases calling tools, or is forcibly stopped by the runtime upon reaching turn, token, time, or cost ceilings.

The loop mechanism itself is straightforward. As tasks extend in duration, historical messages, tool outputs, and intermediate states consume increasing context space, diluting earlier constraints. Context Engineering is responsible for determining which information to retain, when to compress, and what the next turn actually needs to see.

### ReAct

ReAct stands for Reasoning + Acting, introduced by Shunyu Yao et al. in 2022 in the paper [*ReAct: Synergizing Reasoning and Acting in Language Models*](https://react-lm.github.io/). It alternates reasoning, acting, and observing along a unified trajectory: the model determines an action, the environment returns an observation, and the model reasons through the next turn based on that observation.

For example, when a model does not know an order's status, it can invoke an inquiry tool. After the order system returns "Paid, Pending Dispatch," the model decides whether to answer directly or query logistics tracking. External results provide evidence for subsequent judgments, though they do not automatically guarantee correctness.

![ReAct-LLM](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/ReAct-LLM-a5126f80.png)

When implementing ReAct, the runtime must persist execution history and current state, expose available tools or Skills to the model, and associate tool responses as Observations with corresponding calls. Environmental changes, such as system alerts or supplementary user input, must also be reflected in subsequent turns.

![ReAct Pattern Flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-react-flow-06e50bf7.png)

Multi-turn tool invocations increase response latency and Token consumption. Output quality is heavily influenced by tool descriptions, parameter validation, returned data quality, and stopping criteria. Tracing can log executed actions, but reasoning text generated by the model should not be conflated with genuine internal cognitive decision-making.

### Plan-and-Execute

Plan-and-Execute is a pattern proposed by the LangChain team in 2023. A planning stage first generates steps and dependencies, after which an execution engine works through them sequentially. This makes it well-suited for long tasks whose primary phases can be identified in advance.

A global plan exposes dependencies and completion criteria early. When environment conditions or task goals change during execution, earlier plans may become invalid, requiring replanning rather than blindly continuing along original steps.

In real-world projects, plans often control outer macro-phases, with ReAct sub-loops running inside individual steps. Deterministic dependencies are constrained by the plan, while local information gaps are filled via tool calling.

### Workflows, Graphs, and Loops

While an Agent delegates next-step decisions to the model, a Workflow predetermines node order, conditional branching, and error handling via deterministic code or graph definitions. Both can invoke models and tools; the key distinction lies in where execution control resides.

Processes with stable steps and strict permission boundaries should be handled by Workflows. When encountering retrieval, analysis, or tool selection tasks that cannot be exhaustively anticipated, an Agent sub-loop can be embedded inside a workflow node. In such Agentic Workflows, the outer workflow constrains the execution scope, while local decisions are delegated to the model.

An AI workflow's underlying data structure is a Directed Graph, built from three primitives: Nodes (responsible for execution), Edges (controlling flow), and State (sharing context across nodes).

### Multi-Agent

Multi-Agent systems manage autonomous executors capable of independently completing sub-goals, whereas multi-stage Prompt Chains manage sequential processing steps within a single workflow. A role warrants decomposition into an independent Agent only if it possesses its own Prompts, tools, context, permissions, runtime state, and deliverables.

Multi-Agent architectures yield benefits when different stages demand distinctly different tools, permissions, and contexts, or when a task can be partitioned into relatively autonomous parallel tracks. If multiple roles share identical contexts and tools and merely generate similar text from different personas, the architecture mostly adds model calls, latency, and consolidation overhead.

Common orchestration patterns include:

| Pattern | Control Mechanism | Typical Use Case |
| --- | --- | --- |
| Sequential | Code invokes multiple Agents in a fixed sequence | Deterministic steps with clear sequential dependencies |
| Parallel | Independent tasks execute concurrently and merge upon completion | Multi-source retrieval, multi-dimensional reviews, voting |
| Router | Rules or models route requests to one or more specialist Agents | Clear domain boundaries with stable classifications |
| Supervisor / Manager | A master Agent dynamically partitions tasks and coordinates sub-Agents | Subtasks cannot be fully predetermined; requires a consolidated answer |
| Handoff | The active Agent transfers control and necessary context to another role | Customer service routing, phased multi-stage dialogues |

Once roles are separated, you must define task contracts: sub-goals, success criteria, dependencies, permitted tools, output Schemas, artifact locations, timeouts, Token budgets, and failure strategies. When multiple Agents write to shared state or invoke side-effecting tools, consistency must be maintained through idempotency, versioning, distributed locks, compensation, and checkpoints—never leave write ordering to model negotiation.

### Context Engineering

When context becomes disorganized, even capable models miss constraints, repeat tool calls, or drift from the objective.

Context Engineering is responsible for selecting, organizing, and refreshing the information the model currently needs within a limited Token window—including rules, memory, tool definitions, session state, external observations, and Token budgets. Prompt Engineering focuses on how the instruction itself is phrased, representing a more localized concern.

![Differences Between Context Engineering and Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

For deeper architectural guidance, refer to [Prompt Engineering](./agent/prompt-engineering.md) and [Context Engineering](./agent/context-engineering.md).

### Memory

![Agent Memory Taxonomy Landscape](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-memory-taxonomy-81b25fc2.svg)

Memory systems typically comprise two tiers: short-term memory and long-term memory. Short-term memory is session-scoped, serving the current task; long-term memory spans sessions, preserving user preferences, historical decisions, and task learnings that require cross-session reuse. Because their lifecycles, permissions, and update mechanisms differ, they should be stored separately.

![AI Agent Memory System Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-arch-3b774c14.png)

By functional purpose, Agent memory can be divided into three categories:

| Functional Type | Core Question | Stored Content | Typical Scenario |
| --- | --- | --- | --- |
| Fact Memory | What does the Agent know? | User preferences, environment state, explicit facts | Remembering a user's preferred tech stack |
| Experience Memory | How does the Agent improve? | Past trajectories, lessons learned, strategic knowledge | Learning from failed code reviews |
| Working Memory | What is the Agent currently thinking? | Current reasoning context, task progress | Intermediate states in multi-step reasoning |

Long-term memory and RAG are technically similar, both utilizing vector databases and semantic retrieval. However, they serve different purposes.

RAG mounts searchable external knowledge sources, such as corporate policies, product manuals, or real-time database query results. It can serve a shared knowledge base or apply permission filters and personalization based on user, tenant, role, and session. The primary difference between RAG and long-term memory lies in data origin and lifecycle: RAG retrieves external knowledge, while long-term memory stores personalized information accumulated through interactions for cross-session reuse.

Long-term memory manages personalized experiences that crystallize dynamically from interactions with a specific user, such as preferences, habits, past decisions, and private context. It is highly individualized.

![Differences Between Long-Term Memory and RAG](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-rag-vs-memory-455ff42b.svg)

### MCP (Model Context Protocol)

MCP stands for Model Context Protocol. Its three components define its operational scope:

- Model: Designed for Large Language Model applications;
- Context: Delivers external context, tools, and data sources to models;
- Protocol: Standardizes interaction patterns via an open protocol.

MCP specifies **how an MCP Client communicates with an MCP Server**. The Host handles user interactions and model calls, the Client communicates with the Server, and the Server exposes concrete capabilities; integrating MCP does not inject built-in plugins into the model itself.

![MCP Conceptual Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

Function Calling, MCP, Agents, and Skills frequently coexist within the same system, but each addresses distinct challenges: Function Calling lets the model express tool invocation intent; MCP governs how hosts discover external capabilities and connect to backend services; Agents decide next actions over multi-turn execution; and Skills store the workflows and domain experience required to accomplish specific task types.

![Three-Layer Architecture: FC, MCP, and Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-fc-agent-layer-c857389e.png)

### Skills

When a user asks: "Help me analyze this financial report," the Prompt conveys only the immediate task. If the model needs to read a file, it generates structured arguments for `read_file` via Function Calling; this tool can be provided by an MCP Server. The analysis methodology—such as verifying field definitions first, checking for anomalies second, and interpreting business impacts last—is best encapsulated inside a Skill.

A Skill is an on-demand task specification discoverable and loadable by an Agent. Team practices such as API formats, logging conventions, slow SQL troubleshooting orders, and code review checklists can be stored in a `SKILL.md`, avoiding the need to inject complete rulebooks into every Prompt. Skills, Prompts, Function Calling, and MCP govern task input, calling intent, tool connectivity, and execution procedures respectively, and all four can operate in concert during a single task.

![Comparison: Skill vs. Prompt, MCP, and Function Calling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-prompt-function-calling-mcp-comparison-0566edb1.webp)

Skill loading and execution proceeds through five steps:

![Agent Execution Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

1. User submits a task (Prompt).
2. The Host injects brief descriptions of available Skills into the context (Skill Metadata).
3. The model determines that the current task matches a specific Skill (Skill Routing).
4. The Host loads the full `SKILL.md` into the context (Lazy Loading).
5. The model executes tools, reads data, and generates results following the Skill's workflow (Execution).

### Harness Engineering

Models handle reasoning and generation, but cannot independently persist task states, restrict filesystem permissions, run test suites, or handle tool timeouts. System prompts, tool calling, filesystems, sandboxes, orchestrators, hooks, feedback loops, and guardrails together constitute the Harness. In engineering practice, **Agent = Model + Harness** serves as a reminder: the surrounding runtime environment determines task viability just as much as the model does.

In *The Anatomy of an Agent Harness*, Vivek Trivedi emphasized isolating model responsibilities from the surrounding harness architecture. When troubleshooting an Agent, developers must verify context integrity, tool availability, environment containment, and failure recovery mechanisms alongside model outputs.

![Agent = Model + Harness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-agent-equals-model-harness-arch-fe29369b.png)

Prompt Engineering, Context Engineering, and Harness Engineering operate at distinct architectural levels. Prompt Engineering focuses on phrasing instructions, Context Engineering determines what information is supplied to a given invocation, and Harness Engineering manages external execution, verification, observability, and recovery systems.

![Relationship Between Harness, Context, and Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-layers-arch-f559e799.png)

| Layer | Problem Solved | Core Focus | Typical Tasks |
| --- | --- | --- | --- |
| Prompt Engineering | How to articulate instructions clearly | Enabling the model to understand intent and reducing ambiguity | System prompt design, Few-shot examples, Chain-of-Thought prompting |
| Context Engineering | What the Agent needs to see | Supplying correct and necessary information at the right time | Context management, RAG, memory injection, Token optimization |
| Harness Engineering | How the system executes, corrects, observes, and recovers | Sustained correctness, drift correction, and disaster recovery in long workflows | Filesystems, sandboxes, constraint enforcement, feedback loops, observability |

### Loop Engineering

Loop Engineering provides triggers, objectives, context, verification, state tracking, and stopping criteria for iterative Agent execution. Every iteration must yield verifiable artifacts, exiting when the task succeeds, fails, exhausts its budget, or requires human authorization.

From an engineering perspective, focus on these dimensions:

- Trigger: What initiates this run? Manual commands, cron schedules, CI failures, PR creation, Issue updates, or webhook events.
- Objective: What defines completion? All tests passing, CI green, code coverage thresholds met, screenshots matching designs, or generating a draft for review.
- Context: What files, rules, historical states, tool outputs, and conventions must the Agent inspect per turn?
- Action: Can the Agent modify code, run tests, query GitHub, inspect logs, and open PRs, or only propose recommendations?
- Observation: How does it verify that the previous step succeeded? Test outputs, linter reports, type checks, screenshots, review comments, and log digests serve as observations.
- State: What was attempted, where it failed, and what comes next must be written to external files, Issues, Linear cards, or databases—never relying solely on volatile conversation context.
- Stop: When to exit, when to escalate to human intervention, and when to terminate immediately due to budget or iteration caps.

![Loop Engineering Outer Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-outer-loop-d4043888.webp)

A minimal execution loop operates as: Read context → Decide next step → Invoke tool or generate answer → Persist results → Check stopping condition. ReAct alternates Reasoning and Acting within this loop; Loop Engineering additionally manages external triggers, verification, persistence, budgets, and human-in-the-loop handoffs outside it.

## RAG

Related original articles:

- [RAG Fundamentals: Retrieval, Generation, and Engineering Tradeoffs](./rag/rag-basis.md)
- [RAG Vector Indexing Algorithms and Vector Databases](./rag/rag-vector-store.md)
- [RAG Document Processing & Chunking Strategies: Parsing, Cleaning, Chunking, and Multimodal Content](./rag/rag-document-processing.md)
- [RAG Optimization: From Recall and Reranking to Context Engineering](./rag/rag-optimization.md)
- [GraphRAG: Augmenting Vector Retrieval with Graph Structures](./rag/graphrag.md)
- [Updating RAG Knowledge Base Documents: Incremental Updates, Versioning, Deduplication, and Full Rebuilds](./rag/rag-knowledge-update.md)

### What Is RAG?

**RAG (Retrieval-Augmented Generation)** integrates information retrieval directly into the LLM generation process. The system first searches databases, document repositories, or enterprise systems for content relevant to a query, then passes the retrieved evidence alongside the original question to the LLM. This equips the model with verifiable evidence beyond its internal parametric knowledge.

![RAG Schematic Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-simplified-architecture-diagram-cbeceba1.png)

RAG primarily addresses three critical information gaps:

- **Knowledge Timeliness**: Pre-trained model weights are frozen at their training cutoff date. RAG retrieves up-to-date events, policies, and product documentation at request time.
- **Private Data Access**: Proprietary enterprise documents, private knowledge bases, and customer records are absent from public training corpora. Applications can filter by user permissions and inject only the exact passages needed.
- **Verifiable Grounding**: Grounding responses in retrieved evidence reduces hallucinations. However, retrieval errors, context noise, mispaired citations, and instruction-following failures can still cause inaccuracies. Production systems must incorporate citation verification, answer evaluation, refusals, and human feedback.

### How RAG Works

A RAG engineering pipeline comprises two distinct phases: offline indexing and online retrieval-generation. The indexing phase processes raw documents into searchable data structures; the online phase handles query comprehension, retrieval recall, context construction, and answer generation when a user submits a query.

The simplified lifecycle is illustrated below:

![Simplified Lifecycle Diagram: Indexing and Retrieval Phases](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-rag-engineering-link-e1988667.png)

The indexing phase executes these key steps:

1. Document Ingestion: Text files, PDFs, web pages, or database records containing raw content.
2. Document Cleaning: Stripping HTML tags, special characters, and noise.
3. Metadata Enrichment: Adding timestamps, categories, and permission tags to enable pre-filtering during retrieval.
4. Chunking: Splitting documents into manageable segments using text splitters. This must balance semantic integrity, Embedding model input limits, LLM context windows, and recall granularity. Overly large chunks inject noise, while overly small chunks fragment context. Refer to [RAG Document Processing](./rag/rag-document-processing.md) for details.
5. Embedding Generation: Mapping text chunks into dense, high-dimensional semantic vectors using embedding models (e.g., OpenAI's `text-embedding-3-small` / `text-embedding-3-large` or open-source Hugging Face models).
6. Storage in Vector Databases or Indexes: Persisting embedding vectors, raw chunk texts, and metadata into vector stores or indexing systems such as Milvus, pgvector, Elasticsearch/OpenSearch vector search, or Faiss. For database selection and pgvector practices, see [RAG Vector Stores](./rag/rag-vector-store.md).

### Embedding

An Embedding converts text into a sequence of numbers. More precisely, it maps text into a high-dimensional dense vector space where semantically similar texts are placed in close proximity.

Consider these three queries:

- "How do I request a refund?"
- "What is the refund process?"
- "How can I cancel my order and get my money back?"

Although their wording differs, their underlying semantics are nearly identical. A well-trained Embedding model maps them to adjacent points in vector space, allowing vector search to retrieve relevant chunks.

![Embedding: Mapping Text to Semantic Space](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-2-embedding-map-text-to-semantic-space-8815378b.png)

Common embedding dimensions include 768, 1024, 1536, and 3072. Dimensionality is an architectural attribute of model design; higher dimensions do not automatically imply superior semantic performance, but do increase storage, indexing, and similarity calculation costs. For example, OpenAI's `text-embedding-3-small` outputs 1536 dimensions by default, while `text-embedding-3-large` outputs 3072 dimensions, with support for dimension reduction via the `dimensions` parameter.

### Vector Retrieval and Vector Databases

In a RAG retrieval pipeline, the fundamental workflow is: convert both user queries and document chunks into vectors, and perform similarity search to identify the most relevant passages.

The workflow proceeds as follows:

1. Documents enter the knowledge base and are segmented into Chunks.
2. Each Chunk is converted into a vector via an Embedding model.
3. Vectors are persisted alongside raw texts and metadata into a vector database.
4. When a user asks a question, the query is converted into a query vector.
5. The vector database retrieves the Top-K most similar document vectors.
6. The system injects these retrieved snippets into the Prompt for the LLM to generate an answer.

![Relationship Between Embedding and Vector Retrieval](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-embedding-vector-retrieval-7ea0d2d2.png)

Embeddings transform text into comparable vectors, enabling vector retrieval to surface semantically similar content. However, vector retrieval is only one retrieval mechanism; RAG can also utilize BM25, SQL, Knowledge Graphs, search APIs, or enterprise business queries for external grounding.

In small-scale demos, thousands of vectors can easily be searched via in-memory brute force. In production RAG systems, document volumes quickly scale to millions or tens of millions of records.

Vector databases handle engineering challenges far beyond raw vector storage, including approximate nearest neighbor (ANN) indexing, metadata filtering, updates, deletions, concurrent querying, and durable persistence:

![Why Are Vector Databases Necessary in RAG?](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-why-need-vector-store-9a2d40d9.png)

### Document Processing

From initial upload to database ingestion, documents pass through at least six critical stages:

![Overall RAG Document Processing Pipeline: The ingestion phase sets the upper bound for downstream performance](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-document-processing-overall-link-f699ae42.png)

Quality validation should not be deferred until after ingestion. Performing sample validations during the Chunking stage catches anomalies early, preventing low-quality data from polluting the vector database at scale.

Core risks across pipeline stages:

| Stage | Typical Issues | Ultimate Impact |
| --- | --- | --- |
| File Upload | Forged MIME types, oversized files, encoding issues | Parser crashes or silent failures |
| Format Validation | File extension mismatches real MIME type | Wrong parser selected |
| Layout Parsing | Multi-column PDFs, merged table cells, headers/footers | Structural loss, context misplacement |
| Cleaning & Denoising | Garbled text, special characters, blank lines, table-of-contents fragments | Index noise, distorted embeddings |
| Chunking | Semantic truncation, context fragmentation, oversized/undersized blocks | Poor retrieval recall, fragmented answers |
| Metadata | Missing sources, page numbers, versions, permissions | Inability to filter or cite |
| Ingestion | Vector dimension mismatch, token limit violations | Search failures, index corruption |

Many teams focus on upgrading embedding models, but if data is corrupted during ingestion, a better model only makes the errors more consistent.

### Chunking

![How to Choose the Right Chunking Strategy?](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-document-processing-chunking-strategy-634ecbe0.png)

When documents possess clear internal structure, chunking along structural boundaries is generally superior. In NVIDIA benchmark tests, Page-Level Chunking achieved the highest performance on financial and legal reports (average accuracy 0.648, lowest variance). Page boundaries in these documents naturally carry layout and section semantics that should be preserved.

However, do not blindly adopt page-level chunking. Its advantage over token chunking was only 0.3 to 4.5 percentage points, and on the FinanceBench dataset, 1024-token chunking actually outperformed page-level chunking (0.579 vs. 0.566). NVIDIA's test documents were formatted materials where pagination carries structural meaning—if your PDF is simply exported from Word, page-level chunking provides no extra benefit. Furthermore, query type dictates strategy: factual queries favor smaller chunks (256–512 Tokens), while analytical queries favor larger chunks (1024+ Tokens) or page-level splits.

Match initial chunking strategies to document structure, then evaluate with domain queries:

| Document Type | Recommended Strategy | Implementation Tool |
| --- | --- | --- |
| Markdown | Split by header levels (H1/H2/H3) | `MarkdownHeaderTextSplitter` |
| HTML | Split by tag hierarchy (h1~h6, p, div) | `HTMLHeaderTextSplitter` |
| PDF | Split by page or section | `chunk_by_title`, `chunk_by_page` |
| Code | Split by functions, classes, packages | `PythonCodeTextSplitter` |
| Academic Papers | Split by sections, paragraphs, tables | Layout-aware Parser |

Small chunks make it easier for vector search to hit precise sentences, but the context provided to the model may be incomplete; large chunks preserve paragraph context, but introduce irrelevant noise into the candidate pool.

Parent-Child Chunking decouples retrieval granularity from generation context. For instance, index 300-Token child chunks, each linked to a 1200-Token parent passage. When a query matches a child chunk, the system passes the corresponding parent passage to the model. Note that 300/1200 are starting parameters that must be tuned based on document layout and evaluation metrics.

### Hybrid Search

"How do I cancel my subscription?" and "Disable auto-renewal" use different words, making vector search ideal for establishing semantic connections; error codes and part numbers like `E1027` and `ABX-4421` require exact keyword matching via BM25. Hybrid Search retrieves candidates across both paths simultaneously.

| Query Type | Vector Retrieval | BM25 Performance | Recommendation |
| --- | --- | --- | --- |
| "How to cancel subscription" | Matches "disable auto-renewal" | May fail to match | Retain vector retrieval |
| "Error code E1027" | May recall generic faults | Exact match on error code | Must retain keyword retrieval |
| "ABX-4421 specifications" | Surfaces similar product models | Exact match on SKU | Must retain keyword retrieval |
| "Java ThreadPool rejection policy differences" | Good semantic comprehension | Matches key technical terms | Hybrid search is most stable |
| "Latest v3.2 pricing policy" | Requires semantic + temporal constraints | Matches version string | Metadata + Hybrid Search |

Both candidate streams must be fused before proceeding to reranking:

- Vector retrieval returns semantically similar candidates.
- BM25 or sparse vectors return keyword-matched candidates.
- RRF (Reciprocal Rank Fusion) or normalized score weighting merges the two lists.
- Merged candidates are deduplicated before entering Rerank.

Documentation from Microsoft Azure AI Search, Google Vertex AI Vector Search, and Weaviate all highlight Hybrid Search and RRF. RRF fuses candidate rankings based on their relative positions, avoiding the need to directly calibrate BM25 scores against vector cosine similarities.

Whether to introduce hybrid search depends on query distribution. If queries frequently contain error codes, SKUs, configuration keys, and domain terminology, keyword search cannot be omitted; if documents are highly structured and queries rarely contain exact terms, adding a BM25 pipeline may not justify the added complexity.

### Query Rewrite

Users often submit conversational, abbreviated queries:

- "How do I fix this error?"
- "Can I get my money back?"
- "Is that production rate limiting issue back again?"

Phrases like "this error," "money back," and "that issue" depend on conversation history, lacking entities and context when queried directly against a search index. Query Rewrite enriches queries with necessary entities, synonyms, and filter conditions to align them with knowledge base phrasing while preserving the user's core intent.

Common rewriting strategies:

| Strategy | Applicable Scenario | Example |
| --- | --- | --- |
| Normalization Rewrite | Colloquial language, acronyms, missing context | "Can I get money back" → "Refund policy, eligibility conditions, refund procedure" |
| Multi-Query | Multiple valid phrasings exist | Query simultaneously for "cancel subscription", "disable auto-renewal", and "terminate membership" |
| Query Decomposition | Complex multi-part questions | "Compare Stripe and Square transaction fees and dispute resolution" split into 4 sub-queries |
| Step-back Query | Query is overly specific, lacking broad context | Retrieve "Subscription billing guidelines" first, then answer specific cancellation question |
| HyDE | Queries are short and syntactically dissimilar to target documents | Generate a hypothetical answer first, then use its vector to retrieve real documents |
| Self-Query | Query contains structured filter attributes | Extract year (`2025`) and category filters from "Find 2025 Java policies" |

LangChain provides components like `MultiQueryRetriever` and `SelfQueryRetriever` for these patterns. Always retain the original query as one retrieval branch alongside rewritten variations; relying exclusively on rewrites risks catastrophic drift if the model misinterprets the user's intent.

### Rerank

Suppose a user asks: "Why does a thread pool trigger its rejection policy?"

Vector search might recall these passages:

1. Explanation of core thread pool parameters.
2. Enum listing of rejection policies.
3. Conditions under which rejection is triggered (queue full and active threads reach maximumPoolSize).
4. Code sample demonstrating thread pool configuration.

Passages 1 and 2 are semantically close to "thread pool" and "rejection policy," but only Passage 3 directly answers the trigger condition. Bi-encoder retrieval encodes queries and documents independently for rapid recall; Rerank employs a Cross-Encoder or specialized reranking model to score the query jointly with each candidate, elevating the most relevant answering passage to the top. Because Cross-Encoders are computationally intensive, they should only process a small candidate subset after initial coarse recall.

A standard pipeline proceeds as follows (candidate volumes should be tuned to latency budgets and evaluation scores):

1. Metadata pre-filtering.
2. Hybrid Search coarse recall of 30 to 100 candidates.
3. Deduplication and adjacent fragment merging.
4. Rerank selects the Top 5 to 10 candidates.
5. Context compression formats passages into the final Prompt.

### GraphRAG

![What Is GraphRAG?](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/graphrag-simplified-architecture-diagram-576e8a86.png)

GraphRAG (Graph-based Retrieval-Augmented Generation) utilizes graph structures for retrieval augmentation. Systems explicitly model entities, relationships, and structured context from documents, traverse graph relationships to collect evidence during querying, and supply that evidence to the LLM.

GraphRAG fundamentally alters the retrieval target. Graph databases can host this data, but the use of a specific graph database product is not the defining criterion of GraphRAG.

Traditional vector RAG primarily retrieves text Chunks. GraphRAG can retrieve nodes, edges, graph paths, and raw text evidence; community summaries are an indexing mechanism popularized by Microsoft GraphRAG, though not required by all graph-based retrieval architectures.

Consider this analogy:

- **Vector RAG** is like browsing a library by semantic similarity to find a few relevant pages.
- **GraphRAG** is like assembling an entity relationship chart, timeline, and topic taxonomy first, then tracing relational clues to gather evidence.

Vector RAG excels at answering "Does this text passage resemble my question?", while GraphRAG excels at answering "How are these distinct entities interconnected across documents?".

![Essential Differences: GraphRAG vs. Traditional Vector RAG](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/graphrag-vs-rag-1ca3a632.png)

| Dimension | Traditional Vector RAG | GraphRAG |
| --- | --- | --- |
| Retrieval Target | Text Chunks | Entities, relationships, paths, community summaries, raw snippets |
| Core Capability | Semantic similarity recall | Relational reasoning, graph traversal, global topic synthesis |
| Data Structures | Primarily vector indexes | Knowledge graph + vector index + full-text index |
| Best Suited For | Localized factual Q&A, document passage lookups | Multi-hop reasoning, cross-document summarization, complex domain analysis |

### Knowledge Base Updates

A production RAG knowledge base must continuously process insertions, updates, and deletions. After updates, retrieval results must reflect current documents, permission metadata must remain synchronized, and if an ingestion worker fails, the system must locate the affected document and fall back to the last known healthy index.

Indexing and querying must use the exact same Embedding model and version. Vector spaces generated by different models are incompatible; even if dimensionalities match, similarity scores cannot be compared. When upgrading embedding models or chunking strategies, create a new index, evaluate performance using identical benchmark datasets, switch aliases atomically, and retain the legacy index temporarily for rollback capability.

Routine updates and structural migrations require different strategies:

| Dimension | Incremental Update | Full Rebuild |
| --- | --- | --- |
| Scope | Only added, modified, or deleted documents | Rebuilds the entire knowledge base |
| Scenarios | High-frequency daily updates, minute-level syncing | Model upgrades, chunking strategy changes, disaster recovery |
| Key Mechanisms | Webhooks, CDC, polling, message queues | Source snapshots, dual-index staging, atomic alias switching |
| Primary Risks | Missed events, out-of-order execution, partial success | High computational cost; outages caused by incomplete rollback designs |

Production deployments often combine event-driven pipelines, polling fallbacks, and reconciliation jobs. A metadata database tracks document versions, content hashes, embedding versions, chunk versions, and per-index ingestion states. If partial failures occur across vector stores, search indexes, or metadata tables, background compensation tasks retry and reconcile based on state logs.

## AI System Design

Related original articles:

- [AI Application System Design: From Prompt Demo to Production Architecture](./system-design/ai-application-architecture.md)
- [Deep Dive into LLM Gateways: Multi-Model Routing, Fallbacks, Rate Limiting, and Cost Control](./system-design/llm-gateway.md)
- [AI Observability and Tracing: Reconstructing Complete Agent Execution Paths](./system-design/ai-observability.md)
- [LLM/Agent Security in Practice: From Prompt Injection and Tool Abuse to Sandbox Isolation](./system-design/llm-security.md)
- [AI Voice Technology Explained: Engineering Real-Time Voice Agents from ASR and TTS](./system-design/ai-voice.md)

### Production-Grade AI Application Architecture

A prototype AI demo has a simple pipeline: frontend submits a query, backend concatenates a Prompt, invokes the model API, and returns the response. While sufficient for proof-of-concept validation, it neglects stability, permissions, costs, observability, evaluation, and data governance.

A production-grade AI application is structured across specialized layers:

| Layer | Primary Responsibilities |
| --- | --- |
| Ingress Layer | Authentication, authorization, request normalization, rate limiting, idempotency, and sensitive content preprocessing |
| Business Orchestration Layer | Routes between basic Q&A, RAG, Agents, or async tasks; manages human confirmations, retries, and fallbacks |
| Prompt & Context Management | Manages template versioning, variable injection, Token budgets, canary releases, and rollbacks |
| Model Gateway | Unified model abstraction, routing, rate limiting, fallbacks, cost attribution, and invocation observability |
| Knowledge, Memory & Tool Layer | Manages external knowledge bases, personalized memory, and real-world business tool executions |
| Evaluation & Observability Layer | Tracks traces, versions, quality scores, latency, costs, and badcases; supports replays and release gates |

These modules do not all need to be deployed as separate microservices on day one. Early-stage projects can partition these responsibilities cleanly within a modular monolith, breaking them into microservices as traffic, team size, or governance requirements grow. The core requirement is decoupling non-deterministic model generation from deterministic business rules: models interpret intent and propose actions; authentication, permissions, billing, approvals, and idempotency must remain strictly governed by code and backend systems.

### LLM Gateway

An LLM Gateway serves as the centralized governance layer between application services and upstream model providers. Beyond standard API gateway tasks like authentication, rate limiting, and reverse proxying, it manages model selection, token budgets, context limits, provider-specific quirks, streaming protocols, tool calls, structured outputs, cost accounting, and prompt versioning.

An LLM Router selects a model for a given request, representing just one component within the gateway. The Gateway governs the complete lifecycle from request ingress to response egress, including unified connectivity, routing, fallback handling, observability, auditing, and cost attribution.

Internal tools with modest invocation volumes and a single provider can start with a shared `LLMClient` to standardize credentials, timeouts, retries, and logging. As multiple services, teams, or tenants share model access, gradually incorporate model registries, quotas, dynamic routing, caching, and auditing. An LLM Gateway represents a set of centralized responsibilities, not necessarily an independent service from day one.

### AI Observability and Tracing

An HTTP 200 response from an AI endpoint does not guarantee a correct answer or successful task completion. RAG pipelines can fail silently during query rewriting, retrieval recall, reranking, or context truncation; Agents can select wrong tools, execute side-effecting operations redundantly, or drop intermediate results during multi-agent synthesis.

Key observability signals answer distinct questions:

| Signal | Core Question Answered | Typical Contents |
| --- | --- | --- |
| Metrics | Is the overall system healthy? | Request volume, error rates, P95 latency, Token consumption, tool failure rates |
| Logs | What event occurred at a specific timestamp? | Exception stack traces, state transitions, retry causes, business alerts |
| Trace | What sequence of steps did a request undergo? | Relationships between models, retrievals, tools, agents, and dependencies |
| Evaluation | Did output quality and task outcomes meet criteria? | Correctness, faithfulness, tool selection accuracy, task completion, safety |
| Audit | Who performed what operation under which permissions? | User identity, approval records, permission decisions, external write operations |

Long-running tasks require distinguishing between Session, Run, Trace, Span, and Attempt. A Session spans multi-turn conversations, a Run represents an end-to-end task, a Trace tracks an execution chain, a Span represents a model call, retrieval, or tool operation, and an Attempt records individual retry attempts for a step. When human approval or asynchronous recovery resumes a task, a new Trace can be created while maintaining the original `runId`.

Confirmed failure traces should be sanitized and fed into badcase regression sets. When Prompts, RAG configurations, tools, or orchestration logic are patched, replay these real-world traces in offline regression tests before validating improvements via canary rollouts in production.

### LLM and Agent Security

When Agents connect to RAG, Memory, tools, MCP, Skills, web browsers, and code execution sandboxes, external content not only influences model reasoning, but can trigger real business mutations. User inputs, scraped web pages, emails, RAG chunks, memory records, tool outputs, messages from peer agents, and model-generated arguments must all be treated as untrusted data.

Prompt Injection refers to malicious instructions entering the application to alter designated tasks; Indirect Injection hides attack instructions within web pages, emails, documents, images, RAG snippets, or tool results; Jailbreaks seek to bypass the model's native safety alignments. These attack vectors frequently overlap, and adding "ignore external instructions" to a System Prompt cannot protect the end-to-end pipeline.

Security controls must be enforced outside the model:

- Apply permission filtering before retrieval based on user, tenant, and data classifications.
- Scope visible tools based on user identity and context, re-verifying permissions prior to tool execution.
- Deconstruct generic read/write interfaces into fine-grained tools with constrained parameters.
- Require explicit authorization for high-risk operations, binding approval tokens to specific tools, parameters, resource versions, and expiration timestamps.
- Record only necessary metadata in Prompts, logs, and Traces by default, retaining raw transcripts under strict retention and access policies.
- Execute code and network calls within isolated sandboxes, enforcing strict limits on filesystems, processes, memory, and outbound network traffic.
- Subject models, Prompts, MCP Servers, Skills, datasets, container images, and evaluators to software supply chain governance.

The model may propose operational intents, but final permissions, business logic, approvals, and side effects must be validated and executed by server-side code.

### Real-Time Voice Agents

Voice Agents introduce audio capture, preprocessing, VAD (Voice Activity Detection), ASR (Automated Speech Recognition), TTS (Text-to-Speech), streaming playback, and interruption handling around standard Agent pipelines:

```text
Audio Capture -> Noise Reduction/AEC -> VAD -> Streaming ASR -> Context Assembly
              -> LLM / Tool Calling -> Streaming TTS -> Audio Playback -> State Persistence
```

A 1-second latency in text chat is generally acceptable; a 1-second latency in voice conversations feels like an awkward pause. Latency optimization must target end-to-end P95/P99 latency, parallelizing pipeline stages wherever possible: predict user intent as soon as ASR produces stable partial transcripts, trigger TTS on the first completed clause from the LLM, and stream audio chunks to the client for playback as they arrive.

Interruption handling involves more than pausing an audio player. The system must abort active TTS synthesis, purge playback queues, cancel in-flight LLM generations, and determine whether triggered tools can be revoked or compensated. When tools perform external side effects, interruption strategies must be designed in tandem with idempotency, compensation transactions, and state management.
