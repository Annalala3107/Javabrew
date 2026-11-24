---
title: "Claude Code Context Management in Depth: Window Budget, Compaction, and Long-Running Task Governance"
description: "Starting from Claude Code's context window, this article clarifies fixed and dynamic overhead, Context Rot, tool result cleanup, AutoCompact, Context Reset, sub-agent isolation, and handoff to help you govern information flow and task states in long-running tasks."
category: AI Coding Principles
tag:
  - Claude Code
  - Context Engineering
  - Context Management
  - AI Coding
head:
  - - meta
    - name: keywords
      content: Claude Code,Context Management,Context Engineering,Context Window,Context Rot,AutoCompact,/compact,Sub-agent,Context Reset,Long-Running Tasks,AI Coding
lang: en
sourceRef: zh-ref/ai-coding/principles/claude-code-context-management.md
---

Hello everyone, I'm Xiao G. Recently, many friends in our community have shared their interview experiences for Agent positions. Looking through them, I noticed that questions regarding context management come up quite frequently.

![Interview question records on Claude Code, Skills, and Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/claude-code-context-management-interview-questio-5db54df1.png)

In a previous article, I shared: [What is Context Engineering? How does it differ from Prompt Engineering?](https://javaguide.cn/ai/agent/context-engineering.html), which introduced the core aspects of context management.

Therefore, this article aims to take the top-tier Coding Agent—Claude Code—to further explore its underlying philosophy.

It is not just about how to compress chat logs; it is fundamentally about where task goals, tool outputs, file records, and handover information should respectively reside.

When Claude Code executes `/compact`, it replaces the preceding conversation history with a structured summary and reloads parts of the persistent instructions.

The summary typically retains task objectives, important constraints, key decisions, current progress, and relevant code clues, but does not guarantee preserving complete file contents, retrieval results, or test outputs. If exact details from those materials are required later, they should be re-read or re-executed.

What long-running tasks truly need to solve is placing information in the right place: the window should only retain materials needed for immediate reasoning; verifiable and reusable content should be written to files; and when switching sessions, only the conclusions and clues needed for the next step should be handed over. Cleaning tool outputs, compacting history, persisting files, using sub-agents, and conducting session handoffs all serve this single objective.

This article draws upon two types of materials. Behaviors verifiable from official documentation are described according to the docs; "reverse-engineered observations" and "visible in source code" mentioned herein mainly come from non-public source code materials around Claude Code 2.1.x and community compilations, and do not constitute official stable interfaces.

## Claude Code Architecture Overview

![Claude Code Architecture Overview](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-arch-arch-90e1b9c7.png)

When the window is under pressure, you can directly clean tool results, compact history, reset context, or isolate side tasks into sub-agents. On-demand loading of Skills, writing task state to the filesystem, and independent execution of background tasks also change the available budget.

A running Claude Code instance requires direct access to system prompts, tool definitions, project rules, conversation history, tool results, and recently read files. The context window is the working memory that hosts these materials.

When mixed with stale logs, duplicated search results, or mutually conflicting historical judgments, the Agent becomes more prone to missing constraints, repeating exploration, or wrapping up prematurely.

In the formula `Agent = Model + Harness`, the model provides reasoning capabilities, while the Harness handles information retrieval, tool invocation, and task progression. Context management belongs to the Harness: it determines which states are retained in the current window, which temporary results are cleared, and what content should be written outside the window.

![Agent = Model + Harness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-agent-equals-model-harness-arch-fe29369b.png)

When such questions are asked in interviews, interviewers are usually assessing whether you can view an Agent as a stateful system. It shares several similarities with traditional backend systems (the following analogies are for intuitive understanding, not mechanical equivalence):

| Agent Concept | Backend Analogy | Commonality |
| --- | --- | --- |
| Context Window | JVM Heap Memory | Finite capacity; quality degrades when saturated |
| Compaction | Garbage Collection (GC) | Reclaims stale content while retaining live state |
| Context Reset | Process Restart + Checkpoint Recovery | Drops dirty history and resumes from a handover state |
| Sub-agent Isolation | Microservices Decomposition | Independent contexts handle localized tasks |
| Context Rot | Cache Pollution / Memory Leak | Stale information accumulates, dragging down decision quality |
| Tool Result Cleanup | LRU Cache Eviction | Retains recent content, purges expired content |

This is also where the difference between Prompt Engineering and Context Engineering lies. The former concerns how a single prompt input is written; the latter concerns how information flows across the entire session lifecycle.

No matter how detailed you write your System Prompt, it cannot solve context management. In fact, it often backfires by increasing fixed overhead, pushing the window into high-pressure/critical zones earlier.

![Difference between Context Engineering and Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

## Window Budget and Information Loading

### What Overhead Exists in the Window

In ordinary chat, a user usually sends a paragraph per turn, occasionally pasting a snippet of code. Claude Code is different. It starts with tools and rules, and as it executes tasks, it autonomously reads files, runs tests, inspects Git history, and calls MCP servers.

File contents, command outputs, and conversation histories continuously enter the window. Discussing a single issue versus reading dozens of files and running a full test suite introduce vastly different context increments; the latter is much more likely to cause Claude to overlook early constraints, repeat searches, or keep circling in directions that were already ruled out.

Stronger models merely delay such degradation; they do not alter the fact that input is continuously growing.

Window consumption can be divided into two parts: the System Prompt, rules, and tool registrations present at startup, versus tool results and conversation history continuously appended during the task. The former determines the headroom at the start of a session; reading files, executing commands, and collecting logs continuously push up the latter.

![Context Window = LLM Working Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-context-window-e2089807.png)

Startup overhead mainly stems from the System Prompt, `CLAUDE.md`, Skill descriptions, and some tool information. Observed implementations attempt to lazily load some MCP tool definitions:

- When ToolSearch is enabled and tools are not configured to "force-load on startup", some MCP tools will initially expose only their names;
- Only when the model actually selects the tool is the full JSON Schema pulled in;
- Certain tools still load their full descriptions at startup.

The longer the rule files and the more Skills and MCP Servers configured, the less space remains at initialization.

To inspect the actual usage of the current session, you can run the `/context` command. It lists the current model window size, tokens used, remaining space, and itemized breakdowns for the System Prompt, tools, Skills, messages, etc.

![Claude Code /context command output](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-context-command-result-e75460f7.png)

Among dynamic content, tool invocations usually constitute the largest portion. A source file of several hundred lines can easily consume thousands of tokens; search results and test logs can be even longer. Tool invocation arguments and results enter the current session, and file contents, command outputs, and search hits accumulate continuously as the task progresses. As the window approaches its limit, Claude Code first purges older tool results; if space is still insufficient, it then compacts the session.

Growing context also impairs information utilization. Increased input typically drives up latency and cost. Furthermore, models do not utilize every piece of content in the window equally: when relevant information is located in the middle of a long context, the model's retrieval and question-answering performance can degrade—a positional sensitivity phenomenon commonly referred to as **Lost in the Middle**. A larger window can hold more information, but cannot guarantee that all of it will be utilized reliably.

This is what we commonly refer to as **Context Rot**. **The longer and noisier the context, the less stable the model's ability to leverage that context becomes.**

![Context Rot](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

Whenever Claude Code invokes the LLM, the window typically contains the following components:

| Component | Content | Nature |
| --- | --- | --- |
| Session Initialization Context | System Prompt, `CLAUDE.md`, unconditional `.claude/rules/`, Auto Memory | Fixed overhead |
| Path Rules | `.claude/rules/` with `paths` | Loaded upon reading matching files |
| MCP & Tool Descriptions | Built-in tool definitions, MCP tool names, and loaded schemas | Fixed or on-demand |
| Hook Injected Content | Explicit `additionalContext`, hints, or tool feedback returned by Hooks | Dynamically injected |
| Skills | Short descriptions loaded by default; full body enters context after invocation | On-demand loading |
| Conversation History | User messages, Claude responses | Continuously growing |
| Tool Invocations & Results | Call parameters, return values, logs, file contents | Continuously growing |
| Environment & IDE State | Workspace, selected code, and other info provided by client/integration | Injected per configuration |
| Sub-agent Reports | Summaries and minimal metadata returned by sub-agents | On-demand |

Fixed overhead generally does not scale with conversation turns, but it dictates how much headroom remains when the task begins. Dynamic content is the primary driver of growth in long tasks. For the same 20 conversation turns, pure chatting versus reading files and running tests on every turn can yield drastically different token consumption. Therefore, you cannot gauge context pressure solely by turn count.

Prompt Caching saves cost and latency, but does not free up context space. Even if the System Prompt, tool definitions, and `CLAUDE.md` hit cache, they still count as input content for the current request.

Extended Thinking must also be factored into this equation. The thinking budget of the current turn is part of `max_tokens`; it is billed as output tokens and counts against rate limits.

Even more easily overlooked are historical Thinking Blocks. According to current API documentation, Opus 4.5 and subsequent Opus models, Sonnet 4.6 and subsequent Sonnet models, Fable 5, Mythos 5, and Mythos Preview retain historical Thinking Blocks by default.

Earlier Opus / Sonnet and Haiku models automatically strip these historical blocks from the context. Thus, whether Thinking continues to occupy the window in long sessions depends on the specific model and configuration.

If tools are used concurrently, the rules are even stricter: when returning `tool_result`, the Thinking Block corresponding to that turn's tool call must be passed back intact, including its `signature`. After the tool loop finishes, whether to keep retaining it depends on model default behavior or context editing configurations.

### Effective Window and Trigger Thresholds

Conceptually, the effective window can be estimated as follows:

```text
Effective Context ≈ Total Window Capacity - Fixed Overhead - History Overhead
```

The source code roughly reflects the following logic:

```typescript
function getEffectiveContextWindowSize(
  modelWindowSize: number,
  maxOutputTokens: number,
): number {
  const reservedForSummary = Math.min(maxOutputTokens, 20000);
  return modelWindowSize - reservedForSummary;
}
```

The return value here is used for subsequent warning, auto-compaction, and blocking determinations. `getEffectiveContextWindowSize()` is only responsible for deducting the summary output reservation from the model window. System prompts, rules, message history, and tool results are already accounted for in actual token usage and are not deducted item by item in this function.

These thresholds are also derived from observed materials and do not represent public stable APIs; subsequent versions may adjust them.

Several key constant values:

| Constant | Value | Purpose |
| --- | --- | --- |
| `AUTOCOMPACT_BUFFER_TOKENS` | 13,000 | Buffer band triggering AutoCompact ahead of the effective window limit, allowing compaction to start while headroom remains |
| `WARNING_THRESHOLD_BUFFER_TOKENS` | 20,000 | Pre-request warning prompting the user that manual `/compact` can be performed |
| `ERROR_THRESHOLD_BUFFER_TOKENS` | 20,000 | Marks context entering the danger zone |
| `MANUAL_COMPACT_BUFFER_TOKENS` | 3,000 | Minimum safety margin for manual compaction |

Two numbers here are easily confused.

`reservedForSummary = min(maxOutputTokens, 20000)` handles **reserving summary output space**. Source code comments note that summary p99.99 is around 17.3K tokens, so a 20K ceiling covers such extreme outputs.

`AUTOCOMPACT_BUFFER_TOKENS` (13K) leaves a buffer zone before the effective window ceiling and triggers AutoCompact while there is still breathing room. The summary output space is handled by the 20K reservation.

13K is only the buffer for AutoCompact; the p99.99 summary comment corresponds to the 20K summary output reservation. The advantage of this design is predictability: when the model window expands from 200K to 500K, the summary output budget does not inflate proportionally.

The truly distinct phases are primarily warning, AutoCompact, and the blocking limit. `isAboveAutoCompactThreshold` triggers AutoCompact; `isAtBlockingLimit` prevents new requests and forces compaction or a reset.

Reference implementations also maintain two status fields: `isAboveWarningThreshold` and `isAboveErrorThreshold`. In observed versions, both use the same 20K threshold, meaning their token trigger points coincide. They may serve different purposes across different UIs or call paths, but do not represent two independent occupancy brackets.

The pre-request decision chain roughly looks like this (the following is based on community-extracted source mirrors, not Anthropic's guaranteed stable API). This chain assumes AutoCompact is enabled by default; if AutoCompact is disabled, warning/error fallback to using the effective window as the baseline:

```typescript
reservedForSummary = min(maxOutputTokens, 20_000)
effectiveWindow = modelWindow - reservedForSummary

autoCompactThreshold = effectiveWindow - 13_000
warningThreshold = autoCompactThreshold - 20_000
errorThreshold = autoCompactThreshold - 20_000
blockingLimit = effectiveWindow - 3_000

if currentUsageEstimate >= warningThreshold:
  // emit context warning

if currentUsageEstimate >= autoCompactThreshold:
  // trigger AutoCompact

if currentUsageEstimate >= blockingLimit:
  // block new request, require manual compact or reset
```

Taking a 200K window and a 20K summary reservation as an example, the effective window is 180K. AutoCompact triggers at 167K; the warning/error threshold is at 147K; and the blocking limit is at 177K. The warning and error lines are derived by subtracting another 20K from the AutoCompact line.

### How Information Enters Context

When locating the callers of `TokenRefreshService`, one first uses `Grep` to find symbols, then evaluates file roles based on paths like `tests/test_utils.py` versus `src/core_logic/test_utils.py`. Only after confirming relevance does one open snippets with `Read`; `ls`, `find`, `git log`, and test commands are executed when additional evidence is required.

Read, Glob, Grep, Bash, and sub-agents progressively gather material along the task trajectory; there is no need to build a vector index for the entire repository at the start. Paths, symbols, import relationships, and up-to-date file states help narrow the scope; call relationships are still verified against source code and execution results.

Natural language Q&A or conceptual search can integrate RAG (Retrieval-Augmented Generation) via MCP, plugins, or custom Skills. During code exploration, snippets retrieved via RAG still need to be verified alongside keyword search, symbol analysis, and direct file inspection.

This progressive localization begins with directories and file names, drills down to key lines, and expands to full content only when necessary:

| Design Decision | Concrete Practice | Benefit |
| --- | --- | --- |
| Metadata as Information | File paths, directory structure, timestamps, and file sizes are valuable signals | Make preliminary judgments without reading file bodies |
| On-Demand Loading | Read specific files only when needed; avoid preloading everything | Context contains only necessary information at all times |
| Progressive Disclosure | Coarse to fine: directory → file name → key lines → full content | Reduces context waste caused by unfruitful exploration |
| Direct Workspace Exploration | Progressively locate targets using Glob, Grep, Read, Git, and test tools | Eliminates the need to maintain an independent index; results match current workspace |

The Skills we have frequently discussed follow a similar sequence: only metadata is loaded at startup, and specific documentation is fetched only after the model decides to invoke them. For detailed mechanics, refer to my article: [What are Agent Skills? How do they differ from Prompt and MCP?](https://javaguide.cn/ai/agent/skills.html).

Documentation, knowledge bases, and historical records are well-suited for RAG recall. However, code repositories—where paths, configs, dependencies, and test outcomes change constantly—require continuous searching, reading, and verification. Choosing the wrong search terms may cost a few extra rounds, whereas cross-repo retrieval, conceptual queries, or massive monoliths may benefit more from semantic indexing.

| Scenario | More Suitable Approach |
| --- | --- |
| Querying knowledge bases, docs, history | RAG |
| Exploring code repos, configs, directories | Progressive Disclosure |
| Large projects with both extensive docs and code | Hybrid of both |

AI IDEs like Cursor perform Codebase Indexing, utilizing indices to assist low-latency completions and rapid Q&A. Claude Code tasks must go through reading, evaluation, and verification, which is why tool-driven multi-turn exploration accounts for a much higher proportion.

## Why Context Degrades

In long-running tasks, as the window expands, it accommodates more constraints, logs, and outdated conclusions simultaneously, making it harder to reliably access materials required for the current decision. Community best practices often treat roughly 40% utilization as a reminder threshold for cleanup or compaction; because models, task types, and context structures differ, the point at which fluctuations occur varies.

![Context utilization management line in community practice](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

If you write "Do not modify the database schema" in turn 3, by turn 30 this constraint may be sandwiched between search results and test logs. This phenomenon—where beginning and ending tokens are remembered more easily while intermediate content is overlooked—is commonly known as **Lost in the Middle**.

Root-level `CLAUDE.md` and unconditional rules are re-injected after compaction; current user input and recent tool results sit at the tail of messages; and stale tool return values and outdated dialog are prioritized for eviction. Together, these three mechanisms reduce the probability of critical constraints being buried by old content. Note that rules remain model instructions; strict safety enforcement should be delegated to permission policies, Sandboxes, or `PreToolUse` Hooks.

As the window nears its limit, remaining space must be reserved for output generation and error recovery. If history continues to expand, the model may abruptly wrap up before the task is complete; Anthropic refers to this phenomenon as **Context Anxiety**.

The full description in the article [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) is shown below:

![context-anxiety-harness-design-long-running-apps](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/context-anxiety-harness-design-long-running-apps-fa58ff7a.png)

Outdated decisions, redundant search outputs, resolved issues, and useless logs also deplete attention, even if the window is not yet critical. They reappear on every turn, while new decisions might only need a single sentence; this state of declining signal-to-noise ratio is termed **Context Rot**. Enlarging the window merely postpones the pressure; excessive noise still causes middle-positioned constraints to be forgotten and can ultimately trigger Context Anxiety.

## How Claude Code Governs Context

Tool results can be re-fetched, so they do not need to occupy the window indefinitely. Claude Code addresses this layer first before compacting history; only when the task still cannot proceed does it reset context or offload side branches to sub-agents.

### Clear Tool Results First

A single `Read` call can return 500 lines, and a test run can spit out thousands of log lines. They occupy substantial space, but the original content can be re-read at any time. Evicting this portion incurs relatively low information loss and requires no additional model calls.

In the implementation around version 2.1.x referenced in this article, large tool results are written to `tool-results` within session storage, usually located under the session data directory corresponding to `~/.claude/projects/...`; only a preview and a file reference are retained in the window.

The default threshold is roughly 50,000 characters (not 50KB). Different tools may have lower thresholds—for example, Bash / PowerShell around 30,000 characters, and Grep around 20,000 characters. When the aggregate tool results in a single message exceed roughly 200,000 characters, the largest results are written to disk first.

There is an exception: `Read` tool results are exempt with `maxResultSizeChars = Infinity`. Tools without a finite ceiling are generally not treated as large results by the Tool Result Budget. Otherwise, a cycle would emerge: "Read file -> too large, written to disk -> summary sees path -> re-reads file".

Tool results may also be processed by the Tool Result Budget. This path is governed by versioning and feature flags, and is not enabled in all environments. Its states can be classified as `mustReapply`, `frozen`, and `fresh`.

`mustReapply` indicates a tool result that was previously persisted or substituted and needs the replacement reapplied; `frozen` refers to results already seen and not currently handled; `fresh` denotes newly generated tool results that may be selected for disk spillover and substitution when the single-message budget is exceeded.

Reference implementations also include Snip and MicroCompact. After Snip removes a historical range, it reconnects the message chain and passes the freed token count to subsequent AutoCompact evaluations, preventing over-compaction immediately after space has just been freed.

MicroCompact replaces old tool results with `[Old tool result content cleared]`. The call and reference associations remain in the message chain, while verbose return content is excised.

**Why not delete the entire message outright?**

Subsequent messages may still reference earlier `tool_use` IDs. If the call record were removed completely, the message chain would break, and the model would be unable to determine which operations had already been completed. The trade-off is losing granular content; if exact line numbers are needed later, the file must be re-read.

Before a request is dispatched or when context pressure warnings appear, MicroCompact retains the most recent tool results and replaces older ones. If the current environment, model, or sub-agent path does not support it, the flow skips this step, leaving handling to subsequent AutoCompact.

Another entry point relates to Prompt Cache expiration. When two API calls are separated by a long gap and server-side cache may have expired, clearing old tool results before transmission avoids full re-transmission payload inflation. This path is disabled by default and controlled by a GrowthBook gate.

Reference implementations also exhibit a cache prefix / cache sharing path: during compaction, it attempts to reuse the cache prefix, falling back to standard compaction upon failure. This represents a version-dependent caching optimization and should not be considered a stable capability.

The boundary for this layer of cleanup depends on whether information can be re-acquired. Outputs from Read, Grep, Glob, and log queries can mostly be re-run if needed later. For tools with side effects like Edit and Write, state recovery should never rely on replaying outputs, but rather on checking the filesystem. Disposable artifacts like sub-agent analysis findings and task status snapshots should not be casually discarded either; once lost, they are gone for good, and must be safeguarded via summaries or attachments.

### Then Compact History

If cleaning tool results is insufficient, history compaction takes over. AutoCompact is not the only compaction mechanism. Before nearing the window ceiling, Claude Code first tries to clean older tool outputs; only when freed space is still inadequate does it compact the conversation into a summary.

Even after tool results are cleared, dialogue history continues to grow. At a certain point, old history must be rewritten into a state summary. In the implementation observed here, this proceeds through a multi-stage pipeline. What official documentation confirms is: as the limit approaches, old tool results are cleared first, and if that is insufficient, the session is summarized.

![Five-stage progressive compaction pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-pipeline-flow-98901029.png)

| Level | Name | Action | Information Loss | API Cost |
| --- | --- | --- | --- | --- |
| 0 | Large Result Disk Spillover | Tool outputs exceeding threshold written to session storage | Extremely Low | None |
| 1 | Snip | Removes a slice of history range and reconnects message chain | Extremely Low | None |
| 2 | MicroCompact | Clears old tool result content, or executes API-layer cache edit | Low to Medium | None |
| 3 | Collapse | Collapses completed message groups into state snapshots | Medium | Low |
| 4 | AutoCompact | Schedules Session Memory or full LLM summarization | Route-dependent | High |

Disk spillover of large results, Snip, and MicroCompact can handle a portion of sessions. When window occupancy continues to rise, execution enters Collapse or AutoCompact.

Collapse is part of this implementation and is lighter than AutoCompact. When calling the API, it dynamically generates a compressed view: the complete history remains locally, while the model receives a folded version.

This concept can be understood as **separation of view and storage**. Based on observed thresholds in that implementation, around 90% utilization Collapse begins handling completed message groups; around 95% utilization, it blocks spawning new sub-agents to avoid adding further context pressure.

Because Collapse incurs less information loss, it typically activates before AutoCompact. If folding is still insufficient, the heavier full summarization is engaged. Layering details like Collapse should not be assumed as public stable interfaces.

AutoCompact replaces old chat logs with a fresh state summary. Objectives, progress, decisions, and todos are preserved, whereas the exact files read, keywords searched, and full test outputs are generally not; when those details are needed, the Agent re-reads them from the filesystem.

![Comparison before and after AutoCompact](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-compare-25500bd6.png)

Manual `/compact` and automatic compaction utilize similar underlying mechanisms, but accept different input parameters. A manual invocation allows you to explicitly specify what the summary must preserve; automatic calls turn on `suppressFollowUpQuestions` to prevent the summarizer from asking clarifying questions halfway through.

When a phase finishes, `/context` shows significantly elevated usage, or tool calls begin to repeat, you can proactively run `/compact` specifying key retention targets:

```text
/compact Preserve database schema, payment state machine, and currently failing test cases
```

### Compaction Recovery and Fallbacks

The third layer handles post-compaction recovery and failure fallbacks.

**Session Memory** is a fast path before Full Compact. The Session Memory mentioned here is an internal compaction helper state, distinct from Auto Memory in Claude Code's official docs. It refreshes structured session notes based on token growth and tool invocation cadence; when AutoCompact triggers, if these notes combined with recent messages, attachments, and Hook results can already compress usage below the threshold, Full Compact can be bypassed.

These two names are easily conflated, so let's distinguish them:

| Comparison | Session Memory | Auto Memory |
| --- | --- | --- |
| Positioning | In-session compaction helper notes | Cross-session project experience memory |
| Source | Refreshed by internal processes based on token growth and tool call cadence | Written by Claude based on corrections, preferences, and project learnings |
| Role | Reused by AutoCompact to reduce probability of Full Compact | Loaded at session startup to provide long-term preferences and experience |
| Storage | Internal implementation detail, version-dependent | `~/.claude/projects/<project>/memory/`, indexed by `MEMORY.md` |

It also carries costs: updating Session Memory itself requires background model invocations. What it reduces is the probability of executing an expensive, full-scale summarization near the window ceiling, amortizing compaction overhead across the session execution lifecycle.

In the implementation observed, Session Memory does not start immediately at session inception. It initializes only after roughly 10,000 tokens are first reached.

Subsequent updates follow a cadence: typically requiring another ~5,000 token growth along with an accumulated number of tool calls, or occurring at a natural breakpoint devoid of tool calls, before refreshing the notes.

The note template is structured into fixed sections, such as Current State, Task specification, Files and Functions, Errors & Corrections, etc. Each section has a soft cap of ~2,000 tokens, with an overall document hard cap of 12,000 tokens; exceeding the hard cap prompts the model with `MUST condense`.

When Session Memory compact is enabled and valid Session Memory exists, AutoCompact prioritizes reusing it: assembling a new message chain from the notes, recent messages, attachments, and Hook results, then estimating whether the token count falls below the threshold. If it drops below the threshold, Full Compact is skipped; if the notes are empty, message boundaries cannot be found, or the assembly is still too large, it falls back to full summarization.

**Full Compact** itself can also fail with `prompt_too_long` if the input is excessively long. When a manual `/compact` or AutoCompact triggers Full Compact and the summarization request itself throws `prompt_too_long`, the system enters the **PTL (Prompt Too Long)** fallback path.

The purpose of grouping by API round is to ensure `tool_use` and `tool_result` are not torn apart. If the error includes `tokenGap`, the system can discard tokens more precisely according to the excess; without `tokenGap`, it drops older message groups by a coarser percentage, such as shedding roughly the oldest 20%. Reactive Compact is another recovery path from API `prompt_too_long` errors, also truncating messages and retrying; the exact truncation direction and strategy belong to version-dependent implementations and should not be hardcoded as universal.

**Partial Compact** in this implementation addresses two challenges simultaneously: compacting only a slice of history to minimize state loss, and preserving cache prefixes in specific directions where possible. Full Compact typically rebuilds the primary message chain, largely invalidating the original cache prefix; Partial Compact compresses only a segment of history, striving to preserve one end of messages to reuse cache. Compaction must not solely look at compression ratio; it must balance caching, continuity, and information loss.

Partial Compact has two directions:

1. `from`: Compacts messages after the pivot, preserving earlier parts. Suitable for long sessions that already have an early summary, and more conducive to reusing cache prefixes;
2. `up_to`: Compacts messages before the pivot, preserving recent parts. Suitable when the Agent is actively editing a file or bug where intermediate state should not be interrupted by summarization. However, because the summary is inserted before preserved messages, original cache prefixes are generally invalidated.

Full Compact employs a structured summarization prompt, rather than simply asking the model to "summarize".

The Full Compact summarization prompt restricts tool usage at both ends: this step should only generate text and must not execute `Read`, `Write`, or `Bash`, which would introduce fresh tool results. The model first organizes information inside `<analysis>`, then writes content required for subsequent conversation into `<summary>`; only the latter becomes handover material.

`<summary>` is structured into fixed sections, including Primary Request and Intent, Key Technical Concepts, Files and Code Sections, Errors and fixes, Problem Solving, All user messages, Pending Tasks, Current Work, and Optional Next Step.

`All user messages` records more than just history: supplementary user requirements, directions, and constraints alter subsequent judgments; omitting them can lead the Agent to take over the wrong task. `Current Work` must explicitly specify file names, function names, failing cases, and the next command; "Investigating module issues" is insufficient for a post-compaction Agent to resume work directly.

Reference implementations also indicate that different model versions adhere to compaction prompts to varying degrees. For instance, under certain configurations, newer model versions attempt tool calls at a noticeably higher frequency than older versions. That is, compaction rules must be re-verified across model versions; one cannot assume an instruction like "do not call tools" works identically across all models.

Once compaction completes, Claude Code writes a system record with `subtype: "compact_boundary"` into local session events / JSONL. The sample `compactMetadata` mainly records `trigger`, `preTokens`, etc., and some paths also carry `preservedSegment`. Post-compaction token counts may appear in compaction results or telemetry, but are not suitable as stable boundary metadata fields. The boundary marker indicates to subsequent loaders: history here has been replaced by a summary; do not assemble it as regular continuous conversation.

A structure like the following can be observed in local logs, with fields varying across versions:

```json
{
  "type": "system",
  "subtype": "compact_boundary",
  "content": "Conversation compacted",
  "compactMetadata": {
    "trigger": "manual",
    "preTokens": 160442,
    "preservedSegment": {
      "headUuid": "...",
      "anchorUuid": "...",
      "tailUuid": "..."
    }
  }
}
```

After Full / Partial Compact finishes, the new message chain typically contains boundary markers, the summary message, attachments, and Hook results. Session Memory compact restores a narrower scope, mainly centered on summary, preserved messages, plan, and hooks. Recently accessed files, active plans, current Skills, and background task statuses are subject to count and token budget limits; System Prompts do not participate in summarization and are reassembled after compaction with up-to-date tool lists, permission settings, and MCP Server lists.

After compaction, previously read files should not be reloaded en masse, which easily triggers a "compact -> inflate -> compact again" cycle. Restoring only files strictly necessary for the immediate task is sufficient.

The system re-evaluates the actual message payload comprising boundary markers, summary, restored attachments, and Hook results; if it remains close to the threshold, the next turn may trigger another compaction immediately. Certain temporary states and caches are also reset according to the implementation path, with specific purged items varying by version.

Attachment restoration requires trade-offs based on relevance. Recently accessed files, active Plans, Skills in use, and background task states can all help the Agent resume tasks, but they also occupy the window. Source paths often filter by recency, file count / token budgets, exclusion rules, and preserved tail deduplication constraints. For example, when working on a payment state machine, you should restore the state machine file, failing tests, and related plan, rather than incidental logs or unrelated modules read earlier.

Project root-level `CLAUDE.md` and unconditional rules are re-injected from disk after compaction, without needing duplication in the summary. Subdirectory `CLAUDE.md` and rules with `paths` are reloaded only upon reading matching files again.

When selecting a cheaper model for compaction, one must simultaneously evaluate summary fidelity, additional exploration cost, and cache hit rates. Model pricing is merely one variable; the true criterion is whether the task can be accurately resumed after compaction.

### Reset, Isolation, and Circuit Breakers

The fourth layer ceases attempting to "salvage the old window". Compaction patches old context; as patching repeats, loss of detail compounds. At a certain point, continuing to compact is inferior to starting afresh. Context Reset empties the window, writes the current state into a handover document, and allows a fresh Agent to resume from that document.

![Context Reset handover flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-reset-flow-bc479b3f.png)

Anthropic observed in a long-running Harness based on Sonnet 4.5 that when the model neared the context ceiling, it tended to wrap up prematurely—namely, Context Anxiety. In this scenario, Compaction alone proved inadequate.

Reset paired with structured handoff discards dirty context, retaining critical information solely via handoff so that a new Agent can carry on.

However, this is not a mandatory, fixed step for all long tasks. Later, after switching to Opus 4.5, the same Harness was able to remove Reset and rely purely on automatic compaction. Therefore, Reset serves more as a model- and task-dependent engineering technique than a universal workflow.

The risks of Reset are also evident: the handover material is the primary bridge. It need not be a single Markdown document; it can also include progress files, failing test logs, Git diffs, task lists, and key logs. If edge conditions, temporary decisions, or failure causes are missed, the new Agent will execute in an information-deprived state.

To enable a new session to resume from the last execution point, the handoff must preserve at least objectives and acceptance criteria, completed work, current files and functions, ruled-out approaches, failing test cases or error logs, and the very first step upon takeover:

```text
1. Current Task Objective: One sentence stating what must ultimately be delivered
2. Completed Work: List of modified and verified components
3. Current Breakpoint: Pinpointed to file, function, test case, or command
4. Key Constraints: What cannot be changed, what must remain compatible, what user emphasized
5. Ruled-out Approaches: What was attempted and why it was abandoned
6. Current Failure: Failure logs, error stack traces, reproduction steps
7. Initial Action: Which file to inspect or command to run first upon taking over
```

If the handoff contains merely "Continue completing remaining tasks", modified files, failing tests, and ruled-out approaches will not carry over into the new session.

When analyzing thousands of log lines, performing cross-file symbol tracking, or conducting independent reviews, the primary session rarely needs to witness the entire process. Sub-agents handle these branches in isolated windows and return only summaries and necessary evidence; verbose logs and intermediate trial-and-error remain in the sub-agent's private history.

![Claude Code Sub-Agent: Keeping the primary conversation clean](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

Log tasks where the main session only needs root causes and evidence are ideal for delegation. Conversely, when tasks can be completed in just a few steps, subtasks frequently block waiting for each other, or boundaries are ill-defined, scheduling and summarization overhead outweigh benefits.

Sub-agents also receive different context depending on launch mode:

| Mode | Context Behavior | Suitable Scenarios |
| --- | --- | --- |
| Named / non-fork Subagent | Does not inherit parent session message history; still loads tools/permissions, `CLAUDE.md`/memory, Git status, etc. | Isolating search noise, log analysis, independent reviews |
| Fork | Inherits parent session context rather than starting from an empty window | Side tasks with heavy background dependencies needing parent state |

Both modes return results solely to the primary session. Sub-agents equipped with the `Agent` tool can continue spawning recursively up to a depth of 5, after which the tool is withdrawn; Fork sub-agents cannot spawn additional Forks.

After the primary session compacts, it does not reload the full transcript of sub-agents, restoring only summaries and minimal metadata.

### Circuit Breakers

The Circuit Breaker serves as a hard guardrail for automatic compaction. Official documentation states: when a massive file or tool output causes the window to immediately fill up again after every summary, Claude Code stops auto-compacting after multiple attempts to avoid burning API calls in a loop.

Reference implementations employ a consecutive failure counter: reset to zero upon successful AutoCompact, and once consecutive failures reach `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES` (3), subsequent requests bypass AutoCompact.

```text
Automatic Compaction
  -> Fills up again quickly after summary, or compaction fails
Consecutive failure count increments
  -> After reaching 3 times, bypass AutoCompact
```

Without this protection, a session falls into a "compact -> immediate inflation -> compact again" loop. If AutoCompact fails to trigger in time and the API returns `prompt_too_long`, Reactive Compact recovers from the error by truncating messages and retrying.

### Summary

The sequence of interventions can be arranged according to whether information is re-acquirable:

| Source of Context Pressure | Preferred Handling | Cost |
| --- | --- | --- |
| Excessive tool outputs | Disk spillover, MicroCompact; Snip historical fragments if necessary | Low information loss, typically requires no extra model calls |
| Excessive conversation history | Collapse, AutoCompact, Full Compact | Loses some process detail; relies on summary quality |
| Main session polluted by search and logs | Sub-agent branch task isolation | Adds scheduling step; main session receives only summary |
| Still unable to sustain task after compaction | handoff + Context Reset | Missing items in handover leave the new session starved of info |

In daily usage: first clear re-acquirable tool results; compact history when it grows too long; delegate search, review, and log analysis to Sub-agents; and if the session still cannot stably continue after compaction, draft a handoff and restart the session. The further down the line you go, the higher the information loss and scheduling cost, which is why one should never jump straight to Reset.

## How to Implement Long-Running Tasks

### Two Extreme Cases

In 2026, the Anthropic Labs team published a tri-agent architecture inspired by **GAN (Generative Adversarial Network)** concepts:

![Anthropic Tri-Agent Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-triagent-arch-f9bb6584.png)

The Planner expands a 1-4 sentence product description into full specifications; the Generator implements features on a per-Sprint basis; and the Evaluator drives the running application via Playwright MCP, scoring product design depth, functionality, visual design, and code quality. Role division ensures planning, implementation, and evaluation maintain isolated contexts.

Early long-running Harnesses based on Sonnet 4.5 used Context Reset to alleviate Context Anxiety. In the tri-agent Harness powered by Opus 4.5, Anthropic switched to continuous sessions, using the Claude Agent SDK's automatic compaction to govern context growth.

- Planner plans only, unburdened by implementation minutiae;
- Generator controls history length after each Sprint using automatic compaction, preventing history from dragging down subsequent implementation;
- Evaluator evaluates independently, unpolluted by Generator context.

Cost and outcome comparisons across the two configurations:

| Configuration | Duration | Cost | Outcome |
| --- | --- | --- | --- |
| Solo Harness, single Agent + minimal tools | 20 minutes | \$9 | Non-functional half-finished artifact |
| Full Harness, three Agents + complete toolchain | 6 hours | \$200 | Fully functional, complete application |

Carlini's case is even more extreme: 16 parallel Claude Opus instances, ~2,000 independent sessions, spanning ~2 weeks.

It ultimately produced 100,000 lines of Rust code, achieving a 99% pass rate on GCC torture tests with an API cost of ~$20,000.

The key here was distributing work across numerous independent sessions executing in parallel. Logs were written to files rather than flushed to the console, and tests were subsampled: each Agent ran only 1%-10% of cases, preventing test outputs from flooding the window.

Carlini later wrote in [Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler):

> "I had to constantly remind myself that I was writing this test harness for Claude and not for myself."

In Carlini's division of labor, core compiler development, deduplication, performance optimization, code quality, and documentation were progressively assigned to distinct roles. Because LLMs tend to re-implement existing features, assigning a dedicated deduplication role alleviated the primary Agent's burden of concurrently coding, checking for duplication, and maintaining history.

Model upgrades also shift Harness trade-offs. After Anthropic upgraded from Opus 4.5 to Opus 4.6, they eliminated the original Sprint mechanism and collapsed per-Sprint heavy evaluations into end-of-run centralized QA / minimal evaluation rounds. Splitting, inspection, and reset strategies all depend on assumptions about model capability; version transitions require re-verification.

Daily projects certainly do not need tri-agent systems or 2,000 independent sessions. First evaluate how much code context your task will consume.

### How to Choose for Daily Projects

I once ran into a pitfall in an interview platform project. A task spanned several modules, and I initially assumed a single Agent could carry it through. Midway, Claude Code stalled because context had blown up. I subsequently pivoted to parallel Sub-agents: each subtask inspected only its assigned module, returning summaries to the main Agent, which allowed the task to finish cleanly in one shot.

| Task Scale | Recommended Strategy | Context Management Method |
| --- | --- | --- |
| Small: Single-file edit, adding a function | Single Agent | Automatic tool result cleanup is sufficient |
| Medium: A single module or feature | Single Agent + Proactive Compaction | Run `/compact` at phase end or when `/context` indicates elevated usage |
| Large: Cross-module refactor, new subsystem | Main Agent + Sub-agents | Delegate search, review, and log analysis to sub-agents |
| Very Large: Long-term iteration or standalone system | Multi-Agent + handoff / Reset, or Continuous Session + AutoCompact | Write handoffs during phase transitions; whether to Reset depends on model and task |

For command details on `/compact`, Sub-agents, and `/context`, refer to our earlier [Claude Code User Guide](https://javaguide.cn/ai-coding/claudecode-tips.html) and [Claude Code Core Commands in Depth](https://javaguide.cn/ai-coding/claudecode-commands.html).

I generally do not wait for AutoCompact to hit its ceiling. When `/context` reaches around 70%, or when signs of redundant searching or forgotten constraints appear, manually executing `/compact` with explicit preservation targets gives the summarizer clear priorities. If you wait for passive triggers, the window is already contaminated with old logs, outdated judgments, and clutter.

When the exploration phase concludes, write module boundaries, critical files, ruled-out schemes, and failing tests into the compact directive:

```text
/compact Preserve module boundaries, critical files, ruled-out approaches, and currently failing tests
```

For database tasks, specify the schemas, migrations, and failing SQL needed for continuity:

```text
/compact Preserve all database schemas, migration scripts, entity relationships, and currently failing SQL
```

For cross-module tasks, execute compaction once files are read and boundaries are confirmed; compact again once architecture, constraints, and risks are settled; and update status once code edits and verification are complete. Keep critical state in `PLAN.md` or `design.md`, while the summary conveys goals, trade-offs, and next steps; line numbers, failing SQL, and interface details remain in files.

Multi-file projects can choose strategies by scenario:

| Scenario | Recommended Practice |
| --- | --- |
| Read massive files at once | Clear analyzed historical content using MicroCompact / Snip / compaction |
| Resuming after prolonged interruption | Allow system to clean expired tool results; re-read key files if necessary |
| Implementing multiple standalone features sequentially | Compact once after completing each feature |
| Major overhaul spanning multiple modules | Break into phases; compact and update notes at the end of each phase |
| Heavy log or test output | Retain only failure summaries, repro commands, and key stack traces; discard raw output |
| Parallel searching or auditing required | Delegate to Sub-agents; main Agent receives only summaries |

Massive files read during exploration generally only require retaining final conclusions; constraints and trade-offs from design phases must be preserved; reproducible failure logs do not need raw dumps retained long-term. Compaction is best performed when information has stabilized to this degree.

### State Externalization, Memory, and Hooks

Tasks APIs such as `TaskCreate` and `TaskUpdate` decompose large objectives into task nodes, recording `pending`, `in_progress`, `completed` states along with dependencies, persisting them into a structured task list (internal storage format is not a stable interface). The Agent reads current progress via Task Tools, eliminating reliance on conversation history to recall "where we left off".

When multiple Agents write to the same repository simultaneously, worktree isolation ensures each `git status` displays only its own changes. Full test runs, cross-file searches, and large module analysis can run in the background, reporting only summaries upon completion; task states still running during compaction are re-injected as attachments into the fresh context.

The same principle applies to memory: record only what cannot be derived from source code.

| What to Record | What NOT to Record |
| --- | --- |
| User preferences, e.g., coding style and language habits | Project directory structure (discoverable via `glob`) |
| Project-specific conventions, e.g., API prefixes | Interface method signatures (present in source code) |
| Reasons behind a specific technical decision | Dependency versions (present in `package.json` / `pom.xml`) |
| Pitfalls encountered and applied fixes | Git commit history (inspectable via `git log`) |

Session history serves only the current session and may be compacted later. Persistent instructions authored by users or projects belong in `CLAUDE.md` / Rules; Auto Memory maintains experience notes per Git repository, defaulting to `~/.claude/projects/<project>/memory/`, overridable via `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE` or trusted settings' `autoMemoryDirectory`. At session startup, only the first 200 lines or 25KB of `MEMORY.md` are loaded.

![Claude Code Auto Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-auto-memory-437c2c64.png)

As memory files multiply, only an index is loaded at startup; specific files are opened only when details are required.

Some Agent projects also employ `AGENTS.md` as an index.

![CLAUDE.md and AGENTS.md](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Refer to [Harness Engineering: Why Coding Agents Need Infrastructure](https://alexlavaee.me/blog/harness-engineering-why-coding-agents-need-infrastructure/). Such files tell the Agent "where materials are and when to read them", rather than cramming all materials into context in advance.

Official Auto Memory stores data per Git repository; different worktrees of the same repository share the same memory.

Personal rules, project rules, and organization rules layer into the window; do not assume later-loaded rules automatically override earlier preferences. If project rules must supersede personal habits, state the priority explicitly in project rules.

In an interview, answering "how does an Agent implement cross-session memory" simply with "stores it in files" is too shallow. A comprehensive response is: persist only information unobtainable from source code, tier it by scope, load a lightweight index at startup, read details on demand, and avoid packing the entire memory into the window.

According to official docs, three categories of persistent information can be arranged as follows:

| Type | Purpose | Storage |
| --- | --- | --- |
| Session History | Temporary state of current task, subject to compaction | In-memory `messages[]` |
| CLAUDE.md / Rules | Persistent instructions from user, project, or organization | Project `.claude/` or `~/.claude/` |
| Auto Memory | Experience notes maintained by Claude per Git repo | Default `~/.claude/projects/<project>/memory/`, overridable by `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE` or trusted settings; `MEMORY.md` is index entry point, shared across worktrees |

![Claude Code /memory command](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claudecode-memory-command-51dac2f1.png)

If a temporary workaround for a bug is written into project memory, future sessions may continue building on that faulty premise. File paths, dependency versions, and function signatures can be queried directly from code without redundant recording; growing entries inflate fixed overhead, and incorrect entries perpetuate flawed judgments.

Another portion of fixed overhead stems from configuration. Claude Code standard configuration keys follow this precedence:

```text
Managed (Org Policy) > CLI Flags > Project Local > Project Shared > User Settings
```

Array-type configurations like permissions and Sandbox paths are exceptions; they may adopt merging and deduplication rules rather than simple replacement.

When project config adds 5 rules, user config adds 3, and MCP introduces 2 more servers, rules, permissions, and tool definitions combined can consume thousands of tokens. Placing generic rules globally and project-specific rules at the project level minimizes duplicate injection.

Hooks allow intervention in context at designated lifecycle nodes: `SessionStart` injects memory; `PreCompact` appends compaction instructions; `PostCompact` handles notifications or display; `PostToolUse` adjusts MCP tool outputs; and `PreToolUse` determines whether tool execution is permitted.

Hook outputs enter context, meaning they are not cost-free. If external web pages, script outputs, or temporary files mix in malicious instructions, they can also introduce prompt injection risks. Standard coding projects generally find built-in cleanup, compaction, and circuit breakers sufficient.

The table below lists when these Hooks intervene in context:

| Event | Trigger Point | Context Management Role |
| --- | --- | --- |
| `SessionStart` | Session begins | Injects memory, environment info |
| `InstructionsLoaded` | After rules load | Notification, audit logging |
| `PreToolUse` | Before tool call | Evaluates if tool is allowed to execute |
| `PostToolUse` | After MCP tool returns | Adjusts MCP tool output |
| `PreCompact` / `PostCompact` | Before/after compaction | Appends directives before compaction; notifies or displays after summary |

Each added Hook introduces another output that may enter context. Configure Hooks for these scenarios only when team projects have strict domain constraints, compliance auditing, or tool output sanitization requirements.

## Interview Answer Template

We can view context management as the governance of finite working memory. When an Agent tackles long-running tasks, it must reason while simultaneously carrying task objectives, project rules, read code, tool outputs, plans, and intermediate conclusions. As the window accumulates, stale logs, duplicate search hits, and resolved problems compete for attention; near the limit, the model may also terminate tasks prematurely due to insufficient available output space.

I would first distinguish between two classes of information. Dozens of search results, full test logs, and confirmed long file contents can all be re-fetched later and do not warrant occupying the window indefinitely. Task objectives, business constraints, key decisions, failing test cases, modified files, and next steps must be retained; these are condensed into actionable summaries and written into `PLAN.md`, design documents, or task files, avoiding reliance on a single conversational turn.

In Claude Code, I let it first clear re-acquirable tool results, and when history becomes overly long, trigger `/compact` to preserve goals, constraints, decisions, and todos. If a session switch is still required after compaction, the handoff must clearly outline current modifications, failing tests, ruled-out approaches, and next-step verification procedures. For side tasks like log analysis, cross-file searches, and independent reviews, I offload them to Sub-agents so the main session receives only conclusions and necessary evidence without pulling the entire exploratory process back in.

Therefore, judging whether context management is well executed is not measured by how much information is packed into the window, but by whether tasks can smoothly resume across compactions, session switches, and task decompositions: the window serves current reasoning, while the filesystem preserves reusable, auditable task state.

## Summary

When the window becomes saturated, first handle re-acquirable temporary materials such as tool results, test logs, and search outputs; compact conversational history after a phase concludes. Delegate side tasks like searching, reviewing, and log analysis to Sub-agents, keeping only conclusions in the primary session.

If a compacted session still cannot continue smoothly, the handoff must document failing cases, temporary constraints, files under modification, and ruled-out approaches before handing over to a new session. Information that will still be referenced later—such as Plans, Specs, failing SQL, and design trade-offs—should be written into `PLAN.md`, `design.md`, `NOTES.json`, or the project's own task files. In this way, the window retains only temporary materials, while the filesystem reliably preserves task state.
