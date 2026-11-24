---
title: "What Is Context Engineering? How Does It Differ from Prompt Engineering?"
description: "In-depth analysis of Context Engineering core concepts, covering static rule orchestration, dynamic information mounting, Token budget degradation, on-demand loading strategies, and long-task context persistence to build high signal-to-noise Agent context delivery systems."
category: AI Application Development
head:
  - - meta
    - name: keywords
      content: Context Engineering, Agent, LLM, RAG, Prompt Engineering, Compaction, Sub-agent
lang: en
sourceRef: zh-ref/ai/agent/context-engineering.md
---

An expanding context window does not imply that an Agent will utilize information stably. When a single invocation is cluttered with stale state, irrelevant logs, or dozens of competing tool descriptions, the model can easily overlook the critical variables that truly dictate decisions.

Context Engineering governs the assembly of information prior to model invocation: which rules enter messages, which evidence is retrieved on demand, which tools remain visible during the active phase, when history is compacted, and how raw results preserve citations. For long-running tasks, it also manages cross-window state handoffs, preventing critical constraints, version identifiers, and pending action items from vanishing after summarization.

## Why Does the Same Agent Perform So Differently?

![Illustration of Why the Same Agent Performs So Differently in an E-commerce After-Sales Scenario](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-the-same-agent-performs-so-differently-1c2b4b4f.png)

Consider an e-commerce after-sales support scenario.

A user sends a message: "The right earbud of the headphones I bought last week has no sound. How do I resolve this?"

If the Agent receives minimal context, it will likely reply generically: "We apologize for the inconvenience. Which headphone model did you purchase? What is your order number? Could you describe the specific malfunction in more detail?"

While polite, this response is frustrating in a customer support workflow. It merely loops through canned questionnaires without proactively resolving the issue.

Now consider the response when the Agent is backed by comprehensive context.

Prior to invoking the LLM, the system proactively gathers relevant operational data:

- Queries the order management system: Sony WH-1000XM5, purchased on March 25
- Checks warranty status: within the 7-day unconditional return/exchange window
- Reviews historical tickets: established customer with no prior return disputes
- Mounts relevant tools: `create_return_order` and `check_inventory`

The Agent can now respond proactively: "Hello! We located your purchase of the Sony WH-1000XM5 on March 25, which is currently within the return and exchange window. I can initiate an exchange request for you right away. Our warehouse confirms replacement units are in stock and can be dispatched within 2–3 days. Would you like me to proceed with this request?"

The contrast is immediate: the latter response actively resolves the problem rather than bouncing clarifying questions back to the user.

While many Agent failures stem from context deficiencies, context is not the sole failure vector. Tool design, task decomposition, state management, and verification mechanisms must be evaluated holistically.

Nonetheless, one principle holds: **When context is insufficient, even the most capable model must resort to guesswork; when context is curated effectively, a mid-tier model can successfully complete the task.**

## What Does Context Engineering Actually Do?

![Differences Between Context Engineering and Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

### Differences from Prompt Engineering

Tobi Lütke encapsulated Context Engineering as:

> the art of providing all the context for the task to be plausibly solvable by the LLM

In other words: equipping the LLM with the complete context required to solve a task, ensuring the task becomes solvable within the model's capabilities. Here, **plausibly** denotes preconditions: lacking order status, authorization boundaries, or legacy dependencies, the model lacks sufficient ground truth to form reliable judgments.

Prompt Engineering governs instruction phrasing; Context Engineering governs what data enters the invocation, how it is structured, and when it enters or exits the window.

- Prompt Engineering focuses on how the instruction itself is written—phrasing, sequencing, formatting, and tone.
- Context Engineering focuses on a broader operational problem: prior to this invocation, what information should inhabit the model's window, how should it be structured, when should it be injected, and when should it be evicted?

Anthropic's engineering blog illustrates this distinction:

![Prompt engineering vs. context engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-prompt-engineering-1c13a869.webp)

By analogy: If Prompt Engineering is "instructing the chef how to prepare a dish," Context Engineering is "preparing the kitchen for the chef"—arranging ingredients, organizing cutlery, categorizing spices, and posting cooking reference charts within reach.

![Prompt vs Context Engineering Dimensional Comparison](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/prompt-vs-context-engineering-dimension-comparis-2aad305a.svg)

Another compelling analogy is: **Context Engineering is memory management for LLMs.**

The context window functions like finite RAM. Context Engineering manages what occupies this memory, what gets paged out, when it is read, and when it is updated. When the window nears capacity, content must be evicted—mirroring page replacement algorithms in operating systems like LRU or priority-based policies. Token degradation strategies fundamentally address this exact challenge.

### What Does It Specifically Manage?

![Context Window = LLM Working Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-context-window-e2089807.png)

Deconstructed into components, Context Engineering oversees several distinct areas:

System Prompts represent high-priority instructions delivered in API messages. Configuration files such as `.cursor/rules`, `.claude/rules`, and `AGENTS.md` are rule sources parsed by host environments, which inject subsets into model context based on internal loading logic; they are distinct from the API-level System Prompt role. Cursor's legacy `.cursorrules` file has been superseded; modern projects should use `.cursor/rules`.

User Prompts supply end-user instructions and operational payloads. While seemingly straightforward, production inputs often intermingle conversational text, business metadata, historical state, and file attachments, which risk contaminating the context if not sanitized.

Memory encompasses short-term and long-term storage. Short-term memory generally operates as a sliding window over session messages. Long-term memory is not restricted to vector databases—files, key-value stores, relational databases, graph databases, and hybrid vector layers are all viable. The central challenges are: what to persist, when to write, how to update, how to evict, and how retrieved memories re-enter the active context.

RAG & Tools represent external integration points. RAG retrieves relevant passages from external documentation to inject into context, while Tools mount tool schemas, parameter definitions, and execution results. RAG can be viewed as an implementation pattern of Context Engineering—it operationalizes what to retrieve, how to retrieve it, and how to format results for the window.

JSON Schemas, Function Calling parameter structures, and output constraints bound the active invocation, forming an integral part of context. Post-execution Observations require deliberate handling: whether to retain raw payloads, write compressed summaries, or evict outputs in subsequent rounds. Without upfront design, parsing and replay phases accumulate unwieldy operational debt.

Summarization, historical pruning, and Context Caching constitute core Token management techniques, balancing information retention against invocation latency and cost.

## Why Does Context Fail?

![Why Does Context Fail](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

Expanding window sizes does not eliminate retrieval and attention challenges. When inputs exceed the scope required for the active task, supplementary text often acts as distracting noise.

![Context Utilization 40% Threshold Phenomenon](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

The 40% threshold depicted reflects empirical observations across specific models and tasks rather than a universal rule. Positional bias ("Lost in the Middle") and degradation in information utilization as context expands are distinct phenomena that should not be conflated.

Consider refactoring a legacy user login system: product specifications, API documentation, and meeting transcripts are dumped into the window simultaneously. Within these documents lies a single critical constraint: "Legacy token verification logic remains mandatory and cannot be immediately cut over to the new auth module." Even if the model processes all tokens, it may easily fail to treat this isolated line as a governing premise.

**Context Rot** describes precisely this degradation: as inputs lengthen and noise multiplies, the model's reliability in identifying and leveraging critical evidence declines.

![Context Rot Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

Closely related is **Lost in the Middle**—models exhibit heightened sensitivity to content placed at the beginning and end of prompts, frequently overlooking details buried in the center. Even when critical documentation is provided, errors occur because crucial details fail to stand out within lengthy contexts.

In Transformer architectures, models do not read text sequentially like humans. Attention mechanisms calculate relevance scores across tokens, determining which elements deserve priority. When asking "Why did this endpoint time out?", the model searches the context for tokens associated with endpoints, latency, logs, SQL, caching, and external dependencies. Short contexts minimize noise, making critical signals easy to isolate.

When hundreds of pages of documentation, extensive log streams, and lengthy background narratives are injected simultaneously, attention scatters across vast candidate pools. Under standard full self-attention, computational complexity scales quadratically with token count, increasing screening overhead. Modern long-context architectures utilize sparse attention, chunking, caching, and compression to control costs, meaning long contexts do not automatically produce degraded outputs in every circumstance.

A more precise framing is: **Long contexts increase the difficulty of filtering critical information and elevate inference costs, but the degree of degradation depends on model architecture, context structure, and task complexity.**

This explains why models advertising 100K or 200K token windows often struggle to reason reliably when their windows are saturated.

Accepting tokens into a window is entirely different from reasoning effectively over them.

In real-world workflows, this occurs constantly: developers supply project documentation, interface contracts, meeting notes, and legacy tickets, asking: "Will this change impact the legacy user login flow?"

The critical insight may be a single sentence: "The legacy user login flow still depends on legacy token validation logic and cannot be migrated directly to the new auth service." Buried amidst background noise, the model frequently overlooks it, producing a superficially plausible yet risky implementation plan.

The central challenge in long-context engineering is surfacing critical content reliably. Context assemblies should strip redundant text and place governing task constraints in prominent locations. Lengthy documents should be chunked, indexed, or summarized, preserving traceable citations for key evidence. Concrete retention budgets should be evaluated against target models and real task trajectories.

## How to Evaluate Context Engineering Improvements?

Evaluation cannot rely on subjective impressions. A common trap is observing an Agent that appears more polished on the surface, while actual task success rates remain flat and operating costs climb.

Track these five core metric categories:

| Metric Category | Target Observations |
| --- | --- |
| Task Success Rate | Goal completion, human intervention frequency, deterministic reproducibility of success paths |
| Tool Quality | Erroneous tool selection, omitted tool calls, parameter errors, redundant calls, hazardous action interception rate |
| Context Cost | Input tokens, output tokens, cache hit rates, post-compaction information retention ratio |
| Latency Metrics | Time-to-first-token (TTFT), end-to-end duration, tool execution wait times, p95 / p99 response times |
| Result Quality | Hallucination rate, citation accuracy, summary loss rate, omission rate of critical fields |

Curate an evaluation dataset of 20–50 real-world task trajectories before tuning retrieval algorithms, compaction prompts, tool schemas, or prompt templates. Modify only one variable per experiment to isolate the root cause of observed performance shifts.

## How to Load Runtime Context?

![How to Retrieve Runtime Context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-run-time-retrieval-b8f9e4ab.png)

### Why Pre-retrieval Is Not Enough

Pre-retrieval fetches passages based on vector embedding similarity prior to invoking the LLM, packing them into the initial prompt. While effective for simple FAQ question-answering, complex Agent tasks require information that dynamically evolves throughout execution.

Pre-retrieval can only index against goals known prior to execution. Clues discovered dynamically after an Agent executes tools cannot be anticipated in the initial retrieval pass.

### Just-in-Time On-Demand Loading

Just-in-Time loading retains lightweight references—such as file paths, database query handles, or web URLs—fetching full contents via tools only when the active task requires them.

Consider Claude Code analyzing an extensive codebase: the Agent first narrows its search space using directory structures, file names, and pattern searches, subsequently inspecting code snippets via `head`, `tail`, or `grep`. File paths, sizes, and modification timestamps act as navigational markers without requiring full source files to saturate the window upfront.

Metadata itself informs decision-making. The path semantics of `tests/test_utils.py` versus `src/core_logic/test_utils.py` immediately indicate distinct testing scopes.

Anthropic refers to this layered information retrieval paradigm as **Progressive Disclosure**. The Agent enriches context iteratively: file sizes signal complexity, timestamps indicate recency, and directory hierarchies provide spatial context. Agent Skills leverage this exact design; see [In-Depth Guide to Agent Skills: Differences from Prompts and MCP](https://javaguide.cn/ai/agent/skills.html).

On-demand loading incurs additional tool invocation latency and depends on reliable navigation utilities (`glob`, `grep`, `tree`). If navigation tools prove deficient or heuristics fail, the Agent may explore unproductive paths, squandering token budgets. Pre-structured indices, clear tool boundaries, and navigational strategies remain essential.

### More Realistic: Hybrid Strategy

Production systems typically implement hybrid strategies: static, deterministic knowledge is pre-retrieved, while dynamic discoveries are fetched on demand during execution. Claude Code exemplifies this: project guidelines in `CLAUDE.md` are preloaded into context, while concrete source files are explored dynamically at runtime.

Selection patterns align with task characteristics: exploratory tasks with wide search spaces (e.g., codebase audits, open-ended research) favor Just-in-Time approaches. Structured tasks with stable contexts (e.g., legal document review, financial report analysis) operate effectively with pre-retrieval complemented by light runtime lookups.

| Strategy | Advantages | Trade-offs | Best-Suited Tasks |
| --- | --- | --- | --- |
| Pre-retrieval | Fast, simple, stable pipeline | Prone to noise injection; inflexible during runtime | FAQs, fixed knowledge base QA, stable document reviews |
| Just-in-Time | Cleaner context; evidence loaded on demand | Increased tool calls; higher overall latency | Codebase exploration, troubleshooting, open-ended research |
| Hybrid Strategy | Balances startup speed with runtime discovery | Demands budget management and navigation tools | Complex enterprise Agents, long tasks, multi-source retrieval |

Evaluate retrieval strategies based on material stability, search space scope, real-time constraints, and auditability requirements rather than pursuing architectural novelty.

## How Does Context Hold Up in Long Tasks?

![Long-Task Context Persistence: Three Weapons Against Rot](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/long-task-context-persistence-three-weapons-agai-8f1648d5.svg)

### Compaction: Compressing History When Window Fills

Multi-turn tasks accumulate early inferences, intermediate tool outputs, and shifting objectives within message history. When approaching context capacity, Compaction summarizes historical turns, resuming execution using the synthesized summary paired with fresh messages across window boundaries.

Anthropic documented an implementation in Claude Code: summaries retain architectural decisions, unresolved bugs, and critical implementation details while stripping verbose tool outputs. The compacted context restores task state alongside recently accessed files. Note that "retaining 5 files" serves as an illustrative implementation detail; concrete retention parameters should reflect task needs and window budgets.

![Claude Code Context Compression Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/claude-code-context-compression-thinking-50657317.png)

The central challenge lies in trade-offs: over-compressing loses vital context; under-compressing defeats the purpose of compaction. A practical approach involves tuning compaction prompts against complex Agent trajectories, ensuring critical information is preserved before pruning extraneous prose.

A lightweight optimization involves clearing raw tool results: once a tool executes and its findings are integrated, retaining raw payloads is unnecessary. Platforms like Anthropic Developer Platform offer context editing and tool-result clearing capabilities, preserving `tool_use` invocations while purging historical `tool_result` bodies. Specific trigger thresholds should be calibrated against workload profiles.

### Structured Note-taking: Letting the Agent Take Notes

Structured Note-taking externalizes critical progress into persistent files (e.g., `NOTES.md`). Following context resets, the Agent reads these notes to resume work seamlessly.

This mirrors human engineering workflows involving to-do lists and technical scratchpads. Claude Code automatically maintains to-do lists during long tasks; custom Agents can similarly maintain a root `NOTES.md` tracking active progress, blockers, and upcoming milestones.

A notable demonstration occurred with Claude playing Pokémon: across thousands of gameplay turns, the Agent maintained quantitative tracking notes, such as: "Past 1,234 steps: training Pikachu on Route 1, gained 8 levels, 2 levels to milestone." It autonomously developed maps, achievement lists, and combat strategies. Because these notes persisted across context resets, gameplay progressed continuously across hours. Anthropic's Memory Tool beta operationalizes this pattern via filesystem persistence, enabling cross-session knowledge bases.

### Sub-agent: Don't Let One Agent Carry All State

Information retrieval and code examination can be offloaded to Sub-agents operating in isolated context windows, returning concise syntheses to the primary Agent. Even if a Sub-agent consumes tens of thousands of tokens exploring files, its summary returned to the orchestrator typically occupies only 1,000–2,000 tokens, protecting the primary window from bloat.

Anthropic detailed this isolated-retrieval pattern in *How we built our multi-agent research system*. Adoption depends on task modularity, inter-subtask dependencies, and the risk of summary loss.

![Sub-agents Decomposing Tasks and Isolating Context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/sub-agent-task-splitting-context-isolation--635196e8.png)

Choosing among these persistence strategies:

| Technique | Applicable Scenarios |
| --- | --- |
| Compaction | Continuous, long-running conversational flows requiring contextual cohesion |
| Note-taking | Iterative software development with clear milestones and sequential progress |
| Sub-agents | Complex research tasks requiring parallel exploration with aggregated synthesis |

## How to Actually Implement Context Engineering?

Engineering architectures can establish a Context Assembler to uniformly orchestrate rules, goals, evidence, memory, tool schemas, and compacted history prior to each LLM call.

### What the System Assembles Prior to an LLM Turn

```text
# Input: user task information, current session state, business context
input: user_task, session_state, business_context

# 1. Load system constraints (limits, policy rules, permissions, etc.)
constraints = load_system_constraints()

# 2. Extract concrete goal to achieve based on user task and session state
goal = extract_current_goal(user_task, session_state)

# 3. Retrieve relevant evidence or context using RAG
#    - Query knowledge bases, databases, or documentation based on active goal
#    - Refer to "How to Load Runtime Context" for retrieval strategies
evidence = retrieve_rag(goal, business_context)

# 4. Recall historical memory or existing session information
#    - Includes user preferences, past interactions, and persistent memory
memory = recall_memory(goal, session_state)

# 5. Select appropriate tools based on goal, evidence, and memory
#    - Encompasses APIs, browser automation, data computation, etc.
tools = select_tools(goal, evidence, memory)

# 6. Compact session message history for cross-window context management
#    - Refer to "How Does Context Hold Up in Long Tasks?"
#    - Prunes history to reduce token burn while retaining critical facts
history = compact_history(session_state.messages)

# 7. Aggregate all context information and rank by importance
#    - Ensures the model attends to mission-critical guidance first
context = rank([
  constraints,
  goal,
  evidence,
  memory,
  tools,
  history
])

# 8. Truncate / fit context against model token budget
#    - Maximizes critical information retention within token limits
context = fit_token_budget(context)

# Output: generated messages, available tool schema, additional metadata
output: messages, tool_schema, metadata
```

Two stages demand rigorous engineering:

1. `rank` determines positional ordering within the context window.
2. `fit_token_budget` decides what remains verbatim, what compresses into summaries, and what downgrades to lightweight references.

Deficiencies in these two steps degrade Agent performance. Avoid indiscriminately dumping retrieved passages into prompts or appending unbounded conversation histories until the window saturates with noise.

Context Assembler inputs partition cleanly into static rules, tool schemas, dynamic evidence, canonical examples, and token budgets.

### Static Rules: Clearly Define System Prompt First

Static rules represent an Agent's baseline configuration—invariants that remain stable across dialogue turns. Best practices structure System Prompts using Markdown, decomposing guidelines into Role, Objectives, Constraints, Execution Flow, and Output Formats rather than monolithic paragraphs.

Example for a backend incident troubleshooting Agent:

```markdown
## Role

You are a backend service troubleshooting specialist, skilled in isolating root causes using logs and telemetry metrics.

## Constraints

- Invoke only necessary tools; do not execute redundant calls with duplicate logic.
- Stop searching immediately upon discovering critical evidence and output conclusions.
- Prioritize real-time diagnostic data over speculative historical inferences.

## Execution Flow

1. Inspect telemetry metrics (CPU / memory / network).
2. Query logs matching the incident time window.
3. If anomalous call chains are identified, trace upstream and downstream dependencies.
4. Output a structured report: Incident Summary → Root Cause → Recommended Remediation.

## Output Format

Output in JSON format with fields: incident_summary, root_cause, evidence, recommendation.
```

These rules can reside in `.cursor/rules`, `.claude/rules`, or `AGENTS.md`, loaded by host environments according to directory scopes. While rule files facilitate version control and code reviews, their injection timing and message categorization depend on host implementations.

Avoid two common extremes when authoring System Prompts:

**1. Over-engineering:** Embedding exhaustive if-else logic into prompts attempts to micromanage every step. This produces fragile, bloated prompts that incur steep maintenance costs while still failing on unforeseen edge cases.

**2. Over-abstraction:** Stating vague directives like "You are a helpful assistant" deprives the model of operational decision criteria, leading to endless clarifying questions or off-target outputs.

Strive for the "Goldilocks zone" highlighted by Anthropic engineering: concrete enough to guide behavior, yet abstract enough to accommodate operational variance.

![System Prompt Calibration in Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/calibrating-the-system-prompt-9112754b.webp)

A disciplined approach measures baseline performance using a minimal prompt, adding targeted rules incrementally based on observed failure cases. Anthropic terms this *Calibrating the system prompt*—viewing prompts as iteratively tuned parameters rather than static specification documents.

### Tool Context: Tool Descriptions Must Define Boundaries First

Tool descriptions directly dictate whether an Agent invokes the correct tool. An effective description answers two questions: When should this tool be called? When should it NOT be called? If a human engineer cannot discern whether a tool applies, an Agent will inevitably err.

When a tool bundles query, mutation, and approval capabilities into a single schema, the Agent must parse disparate parameters and side effects simultaneously, escalating the risk of misrouting. Clarify applicable and prohibited conditions, decouple discrete actions into atomic endpoints, and provide parameter formatting examples to ensure invocation boundaries are predictable.

### Dynamic Context: Don't Shovel RAG, Memory, and Tool Results All at Once

Retrieval mechanics and on-demand strategies were explored under "How to Load Runtime Context." Here, we address handling retrieved data once inside the window.

Manage short-term memory via sliding windows, retrieving long-term facts from external storage. While API error traces and tool outputs can be trimmed and summarized, diagnostic investigations must retain raw citations: `traceId`, request timestamps, error codes, log file locations, invocation parameters, and URLs linking to full payloads. Stating merely "the endpoint failed" breaks the investigation chain, yet flooding the window with raw logs drowns model attention.

Common failures in dynamic context include retrieval misses, stale memories, tool timeouts, and omitted evidence in summaries. Implement structured fallbacks:

| Failure Mode | Typical Manifestation | Fallback Strategy |
| --- | --- | --- |
| RAG Empty Result | No relevant documents found, or returned snippets are overly fragmented | Fall back to keyword search; prompt the Agent to request clarification from the user |
| Tool Timeout | External API hangs, causing the Agent to stall | Enforce timeouts, retry limits, and circuit breakers; provide human escalation paths |
| Summary Loss | Compaction drops exception stack traces, version numbers, or boundary values | Retain traceId, evidence paths, critical fields, and verifiable reference links |
| Memory Contamination | Obsolete preferences or historical states treated as current ground truth | Validate before writing; annotate records with timestamps, source, and confidence scores |
| Multi-Tool Conflict | Multiple tools offer overlapping capabilities, leading to misrouting | Enforce invocation priority using state machines and side-effect classifications |

### Example Context: Don't Pile Up Too Many Few-Shot Examples

Few-shot examples should cover distinct canonical scenarios. Preserving 3–5 representative examples demonstrating strategic principles is far more effective than attempting to cram dozens of edge cases into prompts. Examples must convey operational strategy for handling categories of input, rather than superficial input-output mapping.

### Token Budget: Prioritizing Content Within a Single Call

This section addresses content prioritization within a single invocation; cross-window histories are managed via Compaction. As windows fill, both strategies operate simultaneously.

![Context Is Not Better Merely by Being Larger](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-eviction-strategy-3d3850d6.png)

| Priority Tier | Content Type | Management Strategy |
| --- | --- | --- |
| Low Priority (Foldable) | Early conversational history | AI summarization and compaction |
| Medium Priority (Prunable) | RAG background materials, historical tool returns | Secondary pruning, retaining core passages and verifiable citations |
| High Priority (Fixed) | System constraints, active task objectives, safety boundaries | Maintained in fixed high-priority sections to ensure logical consistency |
| Phase-Specific Priority | Active tool schemas, immediate task definitions, key examples | Loaded per execution phase, ensuring rediscoverability upon eviction |

Under high concurrency, leverage Prompt / Context Caching. Models supporting caching can designate stable System Prompts and tool schemas as cache prefixes, reducing token costs and latency. Hit rates depend on provider implementations, prefix stability, and cache lifecycles, requiring validation under production workloads.

## What Tools Are Used for Context Engineering?

Orchestration frameworks, retrieval engines, vector stores, tool protocols, and memory layers address distinct operational concerns; adopt only components required by your active architecture:

- LangChain and LangGraph govern control flow, state management, and cycle scheduling, organizing tool invocations and node rollbacks.
- LlamaIndex specializes in data ingestion, indexing, and retrieval optimization for RAG-centric workflows.
- Pinecone, Weaviate, Chroma, and Qdrant provide embedding storage and semantic search. Small initiatives can prototype on embedded Chroma before evaluating Qdrant, Milvus, or Pinecone for scale.
- MCP standardizes tool connectivity to host applications, decoupling Hosts, Clients, and Servers while exposing Resources, Prompts, and Tools. Refer to [MCP Guide](https://javaguide.cn/ai/agent/mcp.html) for protocol specifications and examples.
- Mem0, LETTA (formerly MemGPT), and ZEP target the Agent memory tier, abstracting memory persistence, retrieval, and forgetting lifecycles above raw vector storage.

Tools connected via MCP introduce side effects. Reading files, querying databases, initiating network requests, and modifying configurations demand strict authorization, operational boundaries, and audit logging to ensure actions remain traceable and replayable.

## Record Each Turn's Context During Implementation

![Core Logic of Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-core-logic-1a8e57ed.png)

When evaluating Context Engineering, record the exact messages entering the window on every turn. Only by preserving this ground truth can shifts in success rates, token costs, and tool quality be accurately benchmarked against baselines following adjustments to retrieval, summarization, or tool schemas.

### High Signal-to-Noise Ratio Over Raw Volume

Dex Horthy highlighted an empirical context utilization range of 40%–60%, though this does not represent an absolute law. Analyze real execution traces to isolate the minimum sufficient information set required for decision-making: preserve governing constraints and empirical evidence while stripping extraneous noise.

### Long Tasks Must Actively Clean Expired State

As long-running tasks append messages, early assumptions, resolved blockers, and redundant tool returns accumulate in history. Compaction compresses messages, structured notes externalize state, and Sub-agents isolate exploratory subtasks. Combine these techniques based on observed failure modes; short tasks free of context bloat do not warrant complex memory architectures.

### Start with the Simplest Working Solution

Anthropic repeatedly emphasizes: `do the simplest thing that works`.

Introducing tiered memory, complex retrieval, and long-term state tracking before establishing a basic baseline makes failures difficult to diagnose across retrieval, summarization, tool definitions, and base model reasoning.

Stabilize System Prompts and tool boundaries first, validate RAG retrieval second, and introduce summarization and context budgets third. Evaluate persistent memory, Sub-agents, or complex runtime retrieval only when long-running workflows expose concrete operational bottlenecks.

## Start from a Replayable Baseline

Anchor high-priority directives and tool definitions, recording every outbound message, tool schema, token count, and retrieval payload across a suite of representative tasks. Future revisions should target observed failure modes in isolation, adjusting one variable at a time (e.g., retrieval ranking, summarization framing, tool mounting order).

Capabilities like extended context windows, Prompt Caching, native structured outputs, and MCP evolve across model and SDK releases. Architectural documentation should record model IDs, interface versions, and verification dates, avoiding treating transient client behaviors as universal truths. Introduce RAG, Compaction, caching, or persistent memory only after baseline traces expose stale state, budget exhaustion, or cross-window state loss.

## Summary

In every invocation, static rules, active goals, retrieved evidence, available tools, historical state, and token budgets must be prioritized systematically. Larger context windows do not automatically yield sounder judgments; obsolete history, duplicate tool payloads, and stale state continue to compromise decision accuracy.

Capture production invocation traces to build a replayable baseline before fine-tuning retrieval, tool definitions, summarization, or eviction heuristics. Only when baseline traces uncover clear issues with long-running tasks, stale state, or window capacity should teams introduce layered memory, Compaction, caching, or Sub-agents—ensuring that unnecessary architectural complexity does not obscure root causes of failure.

## References

- [Effective context engineering for AI agents - Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [OpenAI API Models Compare](https://developers.openai.com/api/docs/models/compare)
- [Claude API Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [DeepSeek V4 Preview Release](https://api-docs.deepseek.com/news/news260424)
- [MCP: Protocol Versions, Capabilities, and Invocation Examples](https://javaguide.cn/ai/agent/mcp.html)
- [Context Rot: How Increasing Input Tokens Impacts LLM Performance](https://www.trychroma.com/research/context-rot)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)
- [Context Engineering: The New Frontier of AI Development](https://medium.com/techacc/context-engineering-a8c3a4b39c07)
- [The New Skill in AI is Not Prompting, It Is Context Engineering](https://www.philschmid.de/context-engineering)
- [Context Engineering by Simon Willison](https://simonwillison.net/2025/jun/27/context-engineering/)
- [12 Factor Agents - Own Your Context Window](https://www.humanlayer.dev/blog/12-factor-agents)
