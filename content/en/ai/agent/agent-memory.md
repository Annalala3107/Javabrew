---
title: "AI Agent Memory System: Short-Term Memory, Long-Term Memory, and Memory Evolution Mechanisms"
description: "Clarify the hierarchy and representations of Agent memory (Token/Parametric/Latent), read/write pipelines for short/long-term memory, vector vs. Markdown selection, and lightweight implementations such as Claude Code."
category: AI Application Development
head:
  - - meta
    - name: keywords
      content: AI Agent,Memory System,Memory,Short-Term Memory,Long-Term Memory,Context Engineering,Mem0,MemGPT,ZEP,Agent Skills
lang: en
sourceRef: zh-ref/ai/agent/agent-memory.md
---


As long-running tasks get underway, they quickly hit several hard constraints: context windows have upper limits, token bills climb steadily, and once a session terminates without database persistence, the execution trajectory from the previous round disappears alongside the process by default. Even if the model can complete its current reasoning step, it lacks a dedicated location to store and reuse historical records.

The memory layer must simultaneously retain critical facts from the ongoing conversation and enable new sessions to retrieve user preferences, background context, and historical decisions. This article systematically discusses the representations and functional taxonomy of memory, read-write lifecycles, short-term and long-term implementations, mainstream products, retrieval optimization, and Markdown-based memory. How to trim sliding windows and how to offload context overlaps with ["What is Context Engineering? How Does it Differ from Prompt Engineering?"](./context-engineering.md) on this site; these two articles can be read side by side.

## How Is an Agent's Memory System Designed?

![Agent Memory Taxonomy Landscape](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-memory-taxonomy-81b25fc2.svg)

A memory system is typically divided into two layers: short-term memory and long-term memory. Short-term memory is session-level and serves the current task; long-term memory spans across sessions and is responsible for precipitating user preferences, historical decisions, and past experiences. The two should be kept separate both physically and logically, rather than lumped together.

![AI Agent Memory System Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-arch-3b774c14.png)

### What Storage Forms Does Memory Take?

Beyond splitting memory along the temporal dimension, memory can also be categorized into three classes based on storage location and representation form:

| Storage Form | Description | Typical Implementation |
| ------------ | ----------- | ---------------------- |
| Token-level Memory | Stored in external databases in the form of natural language or discrete symbols | Text chunks in vector databases, structured JSON |
| Parametric Memory | Encodes information directly into model parameters | Pre-trained knowledge, LoRA adapters, SFT fine-tuning |
| Latent Memory | Carried implicitly within the model's internal representations | KV Cache, activation values, Hidden States |

These three forms are not entirely isolated. The "Memory Cube" framework proposed by MemOS supports dynamic flow from plaintext memory to activation memory (KV Cache), and onward to parametric memory. Simply put, frequently used "hot" memory is placed closer at hand, while stable, long-term "cold" memory is solidified using heavier, more durable means.

### How Is Memory Categorized Functionally?

From the perspective of functional purpose, Agent memory can be divided into three categories:

| Functional Type | Core Question | Stored Content | Typical Scenario |
| --------------- | ------------- | -------------- | ---------------- |
| Factual Memory | What does the agent know? | User preferences, environmental state, explicit facts | Remembering a user's tech stack preferences |
| Experiential Memory | How can the agent improve? | Past trajectories, lessons from successes/failures, strategic knowledge | Learning from failed code reviews |
| Working Memory | What is the agent currently thinking? | Current reasoning context, task progress | Intermediate states in multi-step reasoning |

Memory can be further subdivided by the nature of its content:

- Episodic Memory: Records specific events under specific times and scenarios, answering "What happened?". For example: "Last Wednesday, the user reported an order timeout issue."
- Semantic Memory: Distills generalized knowledge, facts, or patterns extracted from multiple episodes, answering "What does it mean?". For example: "This user is more sensitive to performance issues than feature requirements."
- Procedural Memory: Stores skills, rules, and learned behaviors, enabling the Agent to execute a sequence of tasks automatically rather than reasoning from scratch every time. For example: "When handling this user's code review, check for OOM risks first."

### What Is the Lifecycle of Memory Operations?

![Lifecycle of Memory Operations](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-lifestyle-e8865143.png)

From the moment a piece of memory enters the system until it is eventually phased out, it generally passes through the following stages. Terminology varies across academic papers, but their semantics align consistently:

```text
Encode → Storage → Retrieval → Consolidation → Reflection → Forgetting
```

| Operation | Description | Engineering Implementation |
| --------- | ----------- | -------------------------- |
| Encode | Converts raw interactions into storable structured information | LLM extracts factual triples, generates summaries |
| Storage | Persists encoded information | Writes to vector databases / graph databases / model parameters |
| Retrieval | Retrieves relevant memories based on context | Vector search + BM25 + graph traversal |
| Consolidation | Transforms short-term memory into long-term memory | Async tasks: conversation summaries → entity stores |
| Reflection | Proactively reviews and evaluates memory content to optimize decisions | Extracts meta-knowledge upon task completion |
| Forgetting | Retires low-value or outdated memories | Weight decay + conflict-based deprecation marking |

If every turn of dialogue is sent for extraction, pleasantries, temporary guesses, and redundant statements will all flood into the database. Using reinforcement learning to determine the timing of reads and writes can reduce these unnecessary writes, but the training, replay, and explanation costs behind retention decisions are far from trivial.

Many systems first use rules like `importance` to filter out useless content, and then leave conflict resolution, deduplication, and expiration to offline jobs. Rules must closely align with business logic, but every write and cleanup action leaves an auditable, verifiable trace.

### What Is Short-Term Memory (Working Memory)?

Short-term memory refers to temporary information held by the Agent within a single active session, including user prompts, model responses across turns, and intermediate results from tool invocations (Observations). These contents directly enter the prompt for the current turn and serve as the primary carrier of the ongoing task state. If host-side hidden states or a `state` JSON exist, they should also remain aligned with this narrative.

Short-term memory primarily relies on the LLM's own context window. The upper limits vary substantially across model variants and even shift within the same product family. For instance, the official context window for [Grok 4](https://x.ai/news/grok-4) is 256K tokens, whereas 2M tokens corresponds to [Grok 4 Fast](https://x.ai/news/grok-4-fast); one cannot simply reuse parameter specs under an umbrella product family name. When selecting models, check the official model card or API documentation for the exact model ID and record the verification date. This article intentionally avoids maintaining a window-length table prone to quick obsolescence.

A larger window does not mean you can stuff context into it indefinitely. Inference costs scale linearly with the number of tokens. Furthermore, research from *Lost in the Middle* shows that in multi-document retrieval tasks, models exploit information at the beginning and end of the context much more effectively, while the utilization rate for information in the middle drops significantly. The longer the window, the more pronounced this positional bias becomes. Therefore, context engineering must actively manage the distribution of input information.

![The 40% Threshold Phenomenon in Context Utilization](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

The 40% threshold shown in the figure originates from observations on specific models and tasks, not a universal law. Positional bias in *Lost in the Middle* and the decline in information utilization as context expands are two distinct phenomena and should not be conflated.

To control the expansion of short-term memory, frameworks commonly adopt three practices, which share the same philosophical lineage as token degradation and JIT offloading in context engineering:

1. Context Reduction: When conversation history hits a preset token threshold, the framework automatically discards the oldest N turns of messages (a sliding window), or calls a lightweight model to compress historical conversations into a summary, trading information loss for context space.
2. Context Offloading: Tool or Skill calls can return massive payloads, such as raw webpage HTML or full CSV files. Here, heavy outputs can be moved to external temporary storage, leaving only a compact reference (such as a UUID or file path) in the prompt. When the model needs to drill into details, it retrieves them via internal tools through constrained function calling. Read interfaces must define timeouts and size caps; exceeding these limits should return truncated results or explicit fallback indicators to prevent a single tool call from dragging down downstream steps.
3. Context Isolation: The primary Agent only hands down subtask instructions and essential fragments to sub-agents. Broadcasting the entire conversation history along with tasks causes redundant token consumption and leaks irrelevant messages into the sub-agent's judgment process.

### What Is Long-Term Memory?

Long-term memory lives outside the session. Once a conversation concludes, preferences, facts, and decisions are written to persistent storage. When a new session begins, the system retrieves only the entries relevant to the current query, rather than dragging back the entire raw chat history.

Long-term memory can be understood as two distinct pipelines: Record and Retrieve.

Memory Recording (Record) typically occurs after a conversation ends. The framework triggers a background asynchronous task that invokes an LLM to perform semantic distillation on the current round's short-term memory: filtering out conversational noise and extracting high-value structured facts—such as "User's preferred tech stack is Python + FastAPI" or "User reports to the CFO, requiring a non-technical presentation style"—before persisting them into storage.

This write pipeline is best designed as best-effort. LLM extraction might miss critical facts or mistakenly log hypothetical statements as firm preferences. Write operations must also carry idempotent keys to avoid duplicate memories during retries. In LLM extraction scenarios, idempotent keys are better generated from `source_message_id + extraction_batch_id` rather than the text of the extracted result, because temperature sampling or prompt tweaks can produce identical semantics with differing wording, rendering simple string hashing unreliable. In concurrent multi-client conversations, merging and overwriting entity records also requires optimistic locking or multi-version concurrency control (MVCC).

Memory Retrieval (Retrieve) typically takes place at the start of a new session. The system vectorizes the user's query, performs semantic similarity search against entries in the long-term memory store, and prepends the top-ranking entries into the system prompt or places them into parallel slots. Running a vector search on the critical path to the first token is common, but VectorStore P99 latency feeds directly into Time to First Token (TTFT). Common mitigation techniques include using Redis as a warm cache, preloading shallow preferences and static user profiles in full, offloading deep memory to asynchronous re-ranking, or overlapping retrieval with the generation pipeline to compress perceived waiting time.

### How Does Long-Term Memory Differ from RAG?

![Difference Between Long-Term Memory and RAG (Retrieval-Augmented Generation)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-rag-vs-memory-455ff42b.svg)

Long-term memory and RAG are technically very similar; both rely on vector databases and semantic retrieval. However, they serve different targets.

RAG frequently mounts shared knowledge bases like company policies, product documentation, and real-time database queries, but it is not inherently "non-personalized." Retrieval pipelines can filter data by tenant, user, role, or session, and can re-rank results using user preferences. Compared to long-term memory, RAG emphasizes retrieving evidence from external knowledge sources; whether the knowledge source is shared or personalized depends on index and authorization design.

Long-term memory manages personalized experiences that dynamically accumulate through an Agent's interactions with a specific user, such as user preferences, habits, historical decisions, and private background context. It is highly personalized and varies from person to person.

During retrieval, one can separately recall external evidence (such as company policies and product docs) and personal memories (such as user preferences and past decisions), and then unify them during ranking. Entities in long-term memory can also expand RAG queries, and user preferences can participate in result re-ranking.

## What Are the Mainstream Memory Architectures?

Vector storage, semantic retrieval, and memory management are often decoupled into standalone components: the primary Agent handles orchestration, while memory modules take charge of writing, querying, and maintenance.

### What Layers Are Typically Included in the Underlying Storage Architecture?

Underlying responsibilities typically divide into three layers:

- VectorStore handles vector storage. It converts extracted memory text into embeddings and stores them in a vector database. Taking a single-node Qdrant 1.x instance with local SSD, HNSW index ef=128, and Recall@10 ≥ 0.95 as a baseline, P99 latency under low concurrency (e.g., QPS < 50) can be kept within tens of milliseconds. Across different products at the same QPS, P99 variance can reach 5–10x (for example, between Pinecone Serverless, self-hosted Qdrant, and Milvus). For actual selection, consult [ann-benchmarks.com](https://ann-benchmarks.com/) or vendor benchmark reports. Common solutions include Pinecone, Weaviate, Chroma, and Qdrant.
- GraphStore handles graph storage. In advanced scenarios, memory can be modeled as an entity-relationship knowledge graph (e.g., using Neo4j). It is better suited for complex queries requiring multi-hop reasoning, such as "What is the connection between colleague A and project B mentioned by the user?"
- Reranker handles re-ranking. Vector search provides only preliminary recall; semantic relevance is not always precisely ordered. A Reranker typically uses a Cross-Encoder to perform a secondary fine-grained ranking on candidate results, placing more relevant memories at the top and minimizing irrelevant noise in the context.

When selecting a vector database, balance index types, filtering, isolation, consistency, and cost:

| Dimension | Key Considerations | Notes |
| --------- | ------------------ | ----- |
| Index Type | HNSW / IVF / DiskANN | Impacts the tradeoff between recall rate and latency |
| Metadata Filtering | pre-filter vs. post-filter | Under high filtering selectivity, pre-filtering can easily degrade graph connectivity |
| Multi-tenant Isolation | Namespace / Collection / Physical isolation | Affects recall rate and data security |
| Persistence Consistency | Strong consistency vs. Eventual consistency | Directly impacts write reliability |
| Cost Model | Serverless pay-as-you-go vs. Self-hosted cluster | Dictates operational overhead |

A statement like "I might do..." extracted by a model should not be instantly solidified as a stable preference. Before writing, enforce field constraints with JSON Schema and review low-confidence entries. Entries with high `importance` should also retain the source conversation and extraction results to facilitate provenance tracking.

### How Do Mainstream Memory Products Compare?

The table below outlines the focal points of several public projects or products. Selection should be grounded in latency, compliance requirements, and data patterns, rather than matching by feature names alone:

| Product | Core Philosophy | Technical Highlights | Applicable Scenarios |
| ------- | --------------- | -------------------- | -------------------- |
| [Mem0](https://github.com/mem0ai/mem0) | Single ADD-only extraction + Multi-signal fusion retrieval | Single LLM call completes entity extraction and cross-memory linking; parallel scoring via semantics + BM25 + Entity Linking; optional GraphStore backend enables graph memory (Mem0g) | General conversational memory |
| LETTA (formerly MemGPT) | OS virtual memory paging | Dynamic swapping between Main Context ↔ External Context; recursive summarization compression | Long-dialogue context management |
| ZEP | Temporal-aware knowledge graph | Proprietary Graphiti engine; three-layer subgraphs (episodic, semantic, community); edge invalidation mechanism | Enterprise multi-tenant scenarios |
| A-MEM | Zettelkasten knowledge management | Slip-box note method; automatically builds semantic connections between memories | Knowledge-intensive tasks |
| MemOS | Dynamic transition between three memory types | Plaintext ↔ Activation memory (KV Cache) ↔ Parametric memory (LoRA) | Full-stack memory management |
| MIRIX | Six-module division of labor and collaboration | Meta-memory manager routing; distinct memory components employ specialized storage structures | Complex decision support |

### How Do LETTA, ZEP, and MemOS Differ?

LETTA conceptualizes context like pages in an operating system. The Main Context holds system instructions and the current workspace, with FIFO keeping the latest messages; when capacity is exceeded, older passages are recursively summarized and swapped into External Context. This concept is intuitive, but it is fundamentally a lossy path. After multiple rounds of recursive summarization, fine details like exact secret literals, error call stacks, and trailing decimal places are easily washed away first. What appears to be "memory loss" is often an artifact of compression.

ZEP introduces three granular layers onto its graph: an episodic subgraph that captures raw payloads, a semantic subgraph that extracts entity relationships, and a community subgraph that clusters tightly connected components into high-level summaries. This approach resembles the community layer in GraphRAG. Even more valuable in ZEP is its edge invalidation mechanism: when a new fact overlaps temporally with an old edge, the old edge is flagged as invalid and timestamped. This preserves new facts while leaving past decisions readily auditable.

MemOS sketches a gradient across "Text → KV Cache (Activation) → LoRA (Parameters)" in its research and documentation. Pre-populating the cache with hot items reduces cold-start latency; if memory must be solidified into weights, it requires offline SFT, introducing a separate training bill.

There is a very real limitation here: once written into LoRA, memory cannot be easily deleted. Deleting a row in a vector database is trivial, but carving out a specific fact from model parameters runs headfirst into the uncharted waters of Machine Unlearning. Consequently, parametric memory is only suitable for slow-changing preferences. In multi-tenant setups, it also depends on runtimes like vLLM or TGI that support dynamic mounting and unmounting of adapters.

```text
Plaintext Memory ──(High-frequency use)──→ Activation Memory (KV Cache) ──(Long-term solidification)──→ Parametric Memory (LoRA)
      ↑                                                                                                        │
      └───────────────────────────────────(Knowledge Obsolete / Unload)────────────────────────────────────────┘
```

## What Are Advanced Memory Evolution Mechanisms?

Writing and retrieval alone are not enough. Production-grade Agent systems require a metabolic mechanism that allows memories to be reflected upon, consolidated, pruned, and forgotten; otherwise, as the database grows, noise grows with it.

![Advanced Evolution Mechanisms of Memory Systems](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-evolution-f9e42930.png)

### How Are Memory Reflection and Synthesis Implemented?

If a system only appends data, long-term memory rapidly degenerates into an unorganized running ledger. Real value comes from distilling reusable rules, preferences, and lessons from that ledger.

Production systems typically add an offline or near-real-time introspection task:

1. Self-Reflection: After a task concludes, the Agent triggers an asynchronous job to review the reasons behind success or failure, extracting "lessons learned" into a unit of Meta-Knowledge. This mechanism was first systematically introduced by Park et al. (2023) in *Generative Agents*, and can be viewed as an engineering emulation of human "sleep memory consolidation." For example, if code review logs repeatedly show that a user prioritizes OOM risks, this preference can be solidified into the inspection order for future reviews, provided the source and applicability scope are preserved. A single feedback instance cannot warrant a definitive, permanent preference.
2. Fine-grained Reflection Loop (Reflect Loop): Following a high-risk subtask, the system independently verifies whether factual evidence, acceptance criteria, and critical metrics were dropped between nodes. If gaps exist, the task is routed back to the execution node for completion, writing to long-term memory only after passing verification. Applying this layer to low-risk tasks indiscriminately will inflate latency and cost.
3. Clustering & Consolidation: When a user repeatedly mentions the same project context, fragmented records are merged into unified entity entries with source attribution, preventing retrieval results from being dominated by repetitive variants of the same underlying fact.

### How Do Memory Pruning and Forgetting Mechanisms Work?

More memory is not always better. Useless noise and obsolete information severely degrade LLM decision quality.

A common technique is weight decay. The system maintains a composite score for each memory:

```text
score = relevance × importance × decay(t)
```

Here, `decay(t)` typically follows an exponential form, such as `e^{-λt}`. This mechanism originates from the three-dimensional retrieval model proposed in *Generative Agents*. In production engineering, recalculating time decay across the entire vector database on every query is discouraged; a more robust pattern is to perform static semantic recall in the vector database first, and then apply dynamic score adjustments during the Reranker phase.

Another technique is conflict resolution. When new facts contradict old ones—such as a user upgrading from Java 8 last year to Java 21 this year—the old memory should be flagged as deprecated. Note that soft deletes in mainstream vector databases can break HNSW graph connectivity, necessitating scheduled Vacuum jobs to clean up records and rebuild indexes.

Teams often underestimate this initially. Engineers hesitate to "forget," believing that keeping information is always better than discarding it. The result is hundreds of thousands of memories cluttering the vector store, where every Top-K search returns outdated noise, leaving the Agent's recommendations stuck three years in the past. This produces a poor user experience that cannot be fixed simply by tuning prompts.

## How Can Long-Term Memory Retrieval Be Optimized?

Beyond VectorStore and GraphStore, production environments usually require a hybrid retrieval strategy.

![Retrieval Optimization Strategies for Long-Term Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-retrieval-optimization-30686755.png)

### How Are Hybrid Search and Metadata Filtering Implemented?

Relying solely on vector search easily triggers "false associations." Dense retrieval assesses semantic similarity and sometimes recalls content that sounds related on the surface but has no operational business relevance.

Hybrid Search combines candidate sets from BM25 / Sparse and Dense retrieval. Queries containing proper nouns benefit from higher BM25 weighting; when intent is vague or conceptual, the system relies more on vector recall. Common fusion methods include:

- RRF (Reciprocal Rank Fusion): Requires almost no parameter tuning, ideal for cold starts, and fuses results weighted by inverse rank.
- Linear Weighted (`α · dense + (1 - α) · sparse`): Tunable, but requires labeled datasets to calibrate weights.
- Cross-encoder Reranker: Takes the union during recall and scores candidates uniformly during fine ranking, proving especially helpful for long-tail queries.

When multi-tenant requests enter the retrieval layer, they must carry hard filters such as UserID, Organization ID, time windows, and business tags. Without these constraints, one user's preferences might bleed into another's results; isolation conditions must therefore be injected systematically by the data access layer.

Strong filtering on HNSW also comes at a cost: retaining only a sparse set of tenant tags in a massive graph reduces reachable paths, which can degrade recall. For highly active core tenants, dedicated Collections provide cleaner physical isolation.

### Why Does Retrieval Pipeline Optimization Often Precede Write Strategies?

When the candidate pool already contains the necessary information, fixing the retrieval pipeline is usually more direct than expanding writes.

Mem0 achieved 91.6 on LoCoMo (+20 points over older algorithms), 93.4 on LongMemEval (+26 points), and 64.1 on BEAM (1M); each retrieval consumed ~7K tokens compared to 25K+ for full-context alternatives, delivering notable savings. See the [Mem0 official benchmark](https://docs.mem0.ai/core-concepts/memory-evaluation).

When memory fails to take effect, inspect the trace first: how the query was rewritten, whether filter conditions were correct, which entries entered the candidate set, and how the Reranker scored them. Only when the candidate pool demonstrably lacks the necessary information should you alter extraction rules or increase the write budget.

## What Key Factors Must Production-Grade Memory Architectures Address?

In true production environments, what matters is not merely "can it remember," but recall accuracy, compliance, performance, and cost:

| Dimension | Core Problem | Solution |
| --------- | ------------ | -------- |
| Multi-dimensional Indexing | Recall accuracy | Combine Vector + Graph + Keyword indexing |
| Privacy & Compliance | GDPR and related regulations | PII desensitization before writing |
| Hot/Cold Tiering | Performance and cost | Cache high-frequency preferences + RAG for low-frequency background |

Every item in this table carries real costs. Multiple indexing pipelines bring heavier maintenance overhead, PII policies require legal review, and hot/cold boundaries often trigger internal debate. Before reaching multi-tenant scale, a single vector pipeline that gets write idempotency, retrieval tracing, and re-ranking working smoothly is usually the more cost-effective choice.

## How Can Markdown Be Used to Store Agent Memory?

When a vector pipeline feels too heavy, there is an unglamorous yet highly effective alternative: writing what the Agent needs to remember into Markdown files in the repository. Operating without embeddings is perfectly fine—as long as the information volume remains manageable and human readability takes precedence over semantic search, this approach holds up remarkably well.

### Why Can Markdown Serve as Agent Memory?

Markdown can be viewed as human-agent co-authored, plaintext long-term memory. Without forcing vector retrieval into the stack, relying solely on directory organization and mechanisms like `@` references and `rules` in Claude Code is sufficient to get up and running.

It eliminates visibility and operational overhead:

- Transparent and Auditable: Open the file anytime to see exactly what the Agent remembered and what it wrote, with no black box.
- Persistence: Files reside on disk independent of process lifecycles. They remain readable after process crashes or restarts; moving across machines simply requires Git, syncing drives, or shared storage.
- Version Control: Memory can be committed to Git, making rollbacks, branching, and code reviews completely natural.
- Zero Migration Cost: Standard format with zero vendor lock-in. Changing models or frameworks requires nothing more than copying files.
- Low Cost: Hosted vector databases and complete RAG pipelines incur non-trivial operational complexity and infrastructure costs, whereas local Markdown files introduce virtually zero overhead.

Manus uses the file system as structured external memory; Claude Code integrates `CLAUDE.md` and Auto Memory directly into its product capabilities. While their mechanisms differ, both keep a portion of auditable information in files. For bounded content like project conventions and operating preferences, a file system plus Markdown is more than sufficient; when dealing with massive volumes of free-form text, a retrieval layer remains indispensable.

### How Does Claude Code's `CLAUDE.md` Mechanism Work?

Claude Code's memory system operates on a dual-track model: human-authored `CLAUDE.md` files and automatically accumulated Auto Memory.

#### What Should and Shouldn't Be Written in `CLAUDE.md`?

Official guidelines recommend keeping each `CLAUDE.md` under 200 lines. Exceeding this limit degrades Claude's instruction compliance. Splitting files via `@` references improves maintainability, but it does not reduce token consumption because referenced files are loaded in full at startup. If instructions are lengthy, prefer path-scoped rules in the `.claude/rules/` directory, which load rules only when editing matching file paths.

The purpose of `CLAUDE.md` is to convey project conventions that cannot be inferred from general programming knowledge. When the file becomes bloated, critical rules get diluted, lowering instruction effectiveness.

Tech stacks and versions should be stated explicitly; for instance, omitting the Spring Boot version might cause the Agent to fall back on conventions from older training data. Enclosing build, lint, and test commands in code blocks prevents them from being mangled when paraphrased.

Architectural rules should include rationale. For example, alongside "Use QueryWrapper," add "The SQL audit system relies on Wrapper parsing to record audit logs," enabling the Agent to understand why similar queries should adopt that pattern. Project conventions like commit message formats, branch naming, and environment variable requirements should also be documented.

Code formatting styles enforced by linters need not be repeated; default behaviors of languages or frameworks do not warrant consuming context. For lengthy reference materials, keeping links is sufficient.

When reviewing `CLAUDE.md`, check line by line: if this line is deleted, will recent errors recur? Rules without matching failure histories can generally be pruned.

#### How Should Instructions Be Written to Ensure Compliance?

Rules must be verifiable. "Pay attention to code readability" is untestable; "Function names must start with a verb, and individual functions must not exceed 40 lines" provides clear criteria for compliance.

When field injection is banned, the rule should explicitly designate constructor injection and point to an existing reference implementation:

```markdown
# Dependency Injection

- Do not use @Autowired field injection
- Use constructor injection combined with Lombok's @RequiredArgsConstructor
- Reference example: Implementation in UserController.java
```

Signal words can be used, but sparingly. If Claude repeatedly violates a rule, prefixing it with `IMPORTANT:` or `YOU MUST:` can slightly heighten attention. But if the entire file is peppered with "IMPORTANT", nothing remains important.

When a rule is consistently ignored, check whether it has been pushed down by extraneous content or conflicts with other rules. Adding exclamation points will not resolve loading scope or priority issues; deleting defunct rules and relocating local conventions into targeted rules files is far more effective.

Section headers should follow standard conventions like Commands, Structure, Conventions, and Testing. Matching common README layouts makes rule purposes easier to recognize.

#### What Is the Hierarchy of `CLAUDE.md` Files?

| Level | Location | Scope | Applicable Scenario |
| ----- | -------- | ----- | ------------------- |
| Organization | System directory, e.g., `/etc/claude-code/CLAUDE.md` | All users | Company-wide coding standards, security policies; cannot be bypassed |
| User | `~/.claude/CLAUDE.md` | All personal projects | Personal code style preferences, tooling habits |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Shared team-wide | Project architecture, coding standards, workflows; committed to Git |
| Local | `./CLAUDE.local.md` | Personal current project | Sandbox URLs, test data preferences; gitignored, auto-added via `/init` |

File loading traverses upward through the directory tree from the current working directory. Within the same directory, `CLAUDE.local.md` appends after `CLAUDE.md`; rules closer to the working directory take higher precedence.

`CLAUDE.md` is not meant for massive logs or raw conversation transcripts, nor should it contain sensitive secrets, tokens, or credentials. High-frequency runtime data and dynamic information that can be queried in real time should also be kept out.

As projects grow, tiered management becomes essential. For single-developer projects, a single `CLAUDE.md` is usually enough; team projects should be decomposed.

```markdown
# `CLAUDE.md` (Project root directory)

## Project

Order management service built with Spring Boot 3.2 + MyBatis-Plus + MySQL 8.0.

## Commands

- Build: `mvn clean package`
- Test: `mvn test`

## Rules

- API conventions: @docs/api-conventions.md
- Database standards: @docs/database-rules.md
```

You can reference external files using `@path/to/file`. Note that `@` references support a maximum recursion depth of 5 layers. When an external reference is first used in a project, Claude Code prompts an approval dialogue. If accidentally rejected, the reference is permanently disabled and must be reset manually. Because `@` references embed full file content into the context at startup, they do not reduce context consumption.

For finer-grained control, use the `.claude/rules/` directory for path-scoped rules. The difference between rules and `@` references is critical: rules load on demand only when matching specified paths, whereas `@` references load entirely at startup. When rules target specific files or directories (such as backend API standards or test configurations), favor rules over stuffing more content into `CLAUDE.md`.

```yaml
---
paths:
  - "src/main/java/**/controller/**/*.java"
---
# Controller Specifications
- Uniformly use Result<T> to wrap return values
- All endpoints must include Swagger annotations
```

This ensures Controller rules load only when editing Controllers, and Service rules load only when editing Services.

#### What Is the Relationship Between AGENTS.md and CLAUDE.md?

Claude Code automatically reads `CLAUDE.md`, not `AGENTS.md`. Conventions shared across multiple coding agents can be housed in `AGENTS.md` and imported by `CLAUDE.md`; rules exclusive to Claude Code remain in the latter, keeping baseline conventions maintained in a single place.

```markdown
@AGENTS.md

## Claude Code Specific Instructions

- Use plan mode to handle changes under `src/billing/`
```

#### What Is Auto Memory?

Auto Memory logs debugging techniques, coding habits, and workflow preferences discovered during conversations into notes. It resides in `~/.claude/projects/<project>/memory/`, with `MEMORY.md` serving as the entry point and details broken down into topic files.

`MEMORY.md` only loads its first 200 lines or 25KB; content beyond this will not enter context, and details are partitioned into topic files. After 20–30 sessions, notes may accumulate conflicting or outdated entries. Community projects like `dream-skill` organize consolidation across four phases (Orient, Gather Signal, Consolidate, Prune), though this is not an official feature.

To disable Auto Memory, use `/memory`, configure `autoMemoryEnabled`, or set the environment variable `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. CI/CD runs rarely need to persist transient notes and can safely disable it.

Auto Memory requires Claude Code v2.1.59+ and is enabled by default.

### How Should Markdown Memory Be Structured Hierarchically?

A comprehensive Markdown memory system is typically structured across several tiers:

- User-level Memory: Stores personal preferences and long-term habits in `~/.claude/CLAUDE.md`, such as 2-space indentation, writing tests before implementation, or avoiding emojis.
- Project-level Memory: Stores project conventions, tech stacks, and directory structures in the repository root `CLAUDE.md`, shared across team members and synced via Git.
- Subdirectory-level Memory: Stores module-specific rules in subdirectory `CLAUDE.md` files, such as API design rules under `backend/` or documentation styling under `docs/`.
- Team-shared Memory: Shared agreements committed to the repository, typically project-level `CLAUDE.md` and versioned rules files under `.claude/rules/`.
- Private Memory: Personal workflows that should not be committed, such as `CLAUDE.local.md`, kept strictly local via `.gitignore`.

### Where Are the Boundaries Between Markdown Memory and Traditional Long-Term Memory?

![Applicable Boundaries Between Markdown Memory and Traditional Long-Term Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-markdown-memory-boundary-e58817aa.svg)

Markdown and vector stores each have distinct boundaries; a one-size-fits-all mindset should be avoided:

| Dimension | Markdown Memory | Vector Database Memory | RAG Knowledge Base | Database Frameworks (Mem0, etc.) |
| --------- | --------------- | ---------------------- | ------------------ | -------------------------------- |
| Retrieval Precision | Full injection, no retrieval mechanism, loaded entirely at startup | High, semantic similarity | High, semantic retrieval | High, hybrid strategies |
| Context Cost | Scales linearly with file size; large files crowd out context | Retrieved on demand, context-efficient | Retrieved on demand, context-efficient | Retrieved on demand, context-efficient |
| Debugging Experience | Excellent, inspect and edit files directly | Moderate, requires vector query tooling | Moderate, requires retrieval logs | Complex, requires understanding framework logic |
| Deployment Cost | Minimal, requires only file I/O | High, requires running vector services | High, requires RAG pipeline | High, requires framework runtime |
| Version Control | Native Git integration | Requires external sync mechanisms | Requires external sync mechanisms | Requires external sync mechanisms |
| Migration Cost | Zero, simply copy files | High, locked to proprietary formats | High, locked to pipeline | Extremely high, tied to framework |
| Applicable Scenarios | Preferences, conventions, post-mortem notes | Diverse memory retrieval | Shared knowledge queries | Complex multi-source memory management |

As file counts and content expand, directory paths and manual naming can no longer guarantee pinpointing relevant fragments every time. When content must be retrieved semantically from large volumes of unstructured records, delegate to vector search; piling such data into Markdown only slows down full-context loading and ongoing maintenance.

Conversely, if memory requirements involve clear, structured information like "remember this project's coding standards" or "remember the user's reporting preferences," Markdown's simplicity and maintainability make it far more suitable than complex systems.

### How Should Markdown Memory Be Maintained?

Taking `CLAUDE.md` as an example, as a project evolves, legacy rules must be periodically re-examined:

1. Add rules only when concrete errors have occurred and the new rule demonstrably prevents similar recurrences. Note clues from each correction first, formulate a concise rule once a repeating pattern is confirmed, and discard rules whose removal does not alter behavior.
2. If a rule is explicitly written yet Claude still apologizes for violating it, the rule's phrasing, placement, or loading scope needs review. When a rule repeatedly fails across sessions, it is often because the file is overly long and key points are diluted. In such cases, shortening the file or extracting localized rules into scoped files works best.
3. Conduct conversational audits during maintenance: every few weeks, select a few rules from `CLAUDE.md` and ask Claude: "If I delete this rule, will your behavior change?" If it says no, the rule may be a candidate for deletion.
4. However, treat this conversational audit purely as a heuristic; do not trust Claude's self-evaluation blindly. Claude cannot reliably predict whether its behavior will change in the absence of a rule. A more dependable method is backing up the rule, deleting it, and observing behavior across real-world tasks.
5. Use `/init` as a starting point, but do not accept it as-is. Auto-generated `CLAUDE.md` files provide a helpful baseline but may contain inaccurate project descriptions. Review them line by line against the principles above, pruning redundancies and filling in gaps.
6. Finally, updates to team-shared memory should always go through Git. Committing significant memory updates enables rollbacks and transparent PR reviews for team consensus.

## When Troubleshooting Memory Issues, Check the Retrieval Trace First

Short-term memory is bounded by context window capacity, managed via sliding windows, summarization compression, and heavy payload offloading; long-term memory must handle write idempotency, conflicts, expiration, and retrieval ranking.

Bounded project conventions and coding standards belong in auditable, version-controlled Markdown. When large volumes of unstructured records need semantic retrieval, bring in vector search. The two can coexist harmoniously.

When an Agent fails to utilize existing memory, inspecting the Trace reveals the culprit: errors in query rewriting, filtering, candidate pooling, or re-ranking can all render written entries ineffective. Only after verifying that the candidate pool genuinely lacks information should you adjust extraction rules or increase write budgets.

## Summary

Short-term memory serves the current task, whereas long-term memory preserves information that retains value across sessions. The former is constrained by window limits, while the latter must manage write timing, conflicts, expiration, and privacy—raw chat transcripts should never simply be retained forever.

Small volumes of manually maintained project conventions are ideal for Markdown; when semantic retrieval across large unstructured records is needed, turn to vector search or dedicated memory frameworks. Starting troubleshooting from retrieval Traces ensures you first distinguish between a recall problem and a write problem.
