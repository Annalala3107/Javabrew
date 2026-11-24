---
title: "Claude Code Memory System In-Depth: Markdown, Auto Memory, and Vector Retrieval"
description: "Starting from Claude Code's memory mechanisms, this article breaks down the division of responsibilities among CLAUDE.md, .claude/rules, Auto Memory, Subagent Memory, Agent Teams, and third-party memory plugins, clarifying what information is worth preserving long-term and when Markdown, claude-mem, memsearch, and vector retrieval are appropriate."
category: AI Coding Internals
tag:
  - Claude Code
  - Auto Memory
  - Agent Memory
  - AI Coding
lang: en
sourceRef: zh-ref/ai-coding/principles/claude-code-memory.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Auto Memory,CLAUDE.md,MEMORY.md,Agent Memory,Subagent Memory,Agent Teams,claude-mem,memsearch,Vector Retrieval
---

When you start a fresh Claude Code session, it somehow already knows how to run tests in your project, what the code style is, which directories shouldn't be touched, and even remembers that you previously corrected it: "Don't use H2 for integration tests; connect to a real MySQL instance."

Does this mean the model remembered your previous chats?

Almost certainly not. In every inference call, an LLM only sees the input of the current turn. Claude Code's ability to pick up where it left off across sessions relies on the set of files and loading logic built outside the model: which rules stay persistent, which lessons are kept in an index first, and which materials are read in only when relevant to the task.

This article complements [AI Agent Memory System](https://javaguide.cn/ai/agent/agent-memory.html). That article covers general Agent memory: short-term memory, long-term memory, and memory evolution mechanisms. Inside Claude Code, the question becomes much more specific: What actually goes into `CLAUDE.md`? What does Auto Memory capture? And how should `.claude/rules/`, `claude-mem`, and `memsearch` divide their responsibilities?

![AI Agent Memory System Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-arch-3b774c14.png)

## LLMs Do Not Persist Cross-Session State on Their Own

Let's make this crystal clear: The model itself never secretly persists state between two requests.

During an invocation, the client stitches together system prompts, conversation history, tool results, and the user's latest query, and the model produces the next output based solely on this assembled payload. If it appears to "remember" in the next turn, it is simply because the application layer bundled relevant context back in.

Ordinary chat rarely exposes this distinction. When you chat continuously for dozens of turns, the client includes the preceding conversation, so the model naturally continues the dialogue. The Agent scenario is far more demanding: it reads files, runs commands, invokes tools, and inspects logs—each step consuming context. Within a few turns, the window becomes clogged with temporary artifacts, burying long-term rules in the noise.

![LLMs Do Not Store Cross-Session State on Their Own](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/llm-no-cross-session-state-b1e56133.webp)

To draw an engineering analogy, Context Engineering is much like "memory management" for an LLM: the context window has a finite capacity, and what truly needs managing is what information remains persistent, what is loaded on demand, and what is evicted once stale. When tokens run tight, summarization, compression, retrieval, and priority trade-offs all address the exact same problem: **Do not let low-value noise crowd out the context genuinely needed for the current task.**

How context should be structured, when to load on demand, and when to compress were covered extensively in [What Is Context Engineering? How Does It Differ from Prompt Engineering?](https://javaguide.cn/ai/agent/context-engineering.html), so we won't repeat those general concepts here.

Returning to Claude Code, long-term memory must first answer these questions:

1. What information is truly worth retaining long-term?
2. Where is it stored, and who can see it?
3. How much is loaded at startup, and how is it replenished during tasks?
4. When memories expire, conflict, or are invalidated by codebase updates, how are they detected and purged?

Most issues get stuck on question one: **What is actually worth writing down?**

![Claude Code Memory Layers](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-memory-layers-2ecaa4a7.webp)

## Do Not Confuse Rules with Lessons Learned

Claude Code's long-term context can be divided into two main categories: **Rules written by humans for Claude, and lessons learned that Claude accumulates on its own during work.**

`CLAUDE.md` belongs to the first category. It functions like a work specification before a session starts: coding standards, common commands, directory constraints, team workflows, and off-limits areas should all live here. Official documentation categorizes this under instructions and rules.

![CLAUDE.md and AGENTS.md](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Auto Memory belongs to the second category. It records patterns Claude encounters within the project, such as build commands, debugging insights, user preferences, and recurring pitfalls. Official documentation categorizes this under learnings and patterns.

Both enter the session, but their duties are fundamentally different:

| Mechanism | Author | Best Stored Content | Default Loading Strategy |
| --------- | ------ | ------------------- | ------------------------ |
| `CLAUDE.md` | Human | Stable rules, project conventions, collaboration workflows | Loaded in every session |
| Auto Memory | Claude | Learnings, preferences, patterns discovered during work | Loads the first 200 lines or 25KB of `MEMORY.md` per session |

Keep these two categories distinct. Rules should be maintained by humans as much as possible because they represent team agreements; lessons learned can be recorded by Claude, but should ideally be verified against the current codebase before relying on them.

### `CLAUDE.md`: For Rules Needed on Every Turn

The specific authoring techniques for `CLAUDE.md` were detailed in my earlier article [CLAUDE.md Best Practices: What to Write, What Not to Write, and How to Split as Projects Grow](https://javaguide.cn/ai-coding/practices/claude-md-best-practices.html). Here, we skip repetitive templates and focus on its position within the memory architecture.

Rather than hunting across scattered sections of the official documentation, I recommend memorizing its hierarchy across five levels:

![CLAUDE.md Hierarchy and Precedence](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-file-hierarchy-8abb6c01.png)

| Level | Path | Suitable Content |
| ----- | ---- | ---------------- |
| Organization-level | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux/WSL: `/etc/claude-code/CLAUDE.md`; Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Centrally distributed coding standards, security policies, compliance mandates from IT/DevOps |
| User-level | `~/.claude/CLAUDE.md` | Personal tool habits and global preferences across all projects |
| Project-level | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team-shared project architecture, commands, code standards |
| Local-level | `./CLAUDE.local.md` | Personal settings for the current project, such as sandbox URLs, test data preferences |
| Subdirectory-level | `./subdir/CLAUDE.md`, plus `CLAUDE.local.md` in the same directory | Rules specific to a module or subdirectory, loaded on-demand when Claude reads files in that directory |

These files do not simply overwrite one another. Claude stitches together all `CLAUDE.md` and `CLAUDE.local.md` files visible along the startup path into context; broader scopes load first, while files closer to the current directory load later. Files in subdirectories are not loaded at startup; they are pulled in only when Claude reads files in that directory. Organizational managed policies cannot be overridden or excluded by personal configurations.

Each `CLAUDE.md` is best kept under 200 lines. Once a file becomes excessively long, the model tends to remember only portions of it.

![Claude Code Official Docs Recommendation on CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudemd-claude-docs-95f47141.png)

This is the classic Context Rot problem. **The longer and noisier the context, the more likely the model's reliability in adhering to context degrades.**

![Context Rot](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

`CLAUDE.md` is frequently misunderstood in the following scenarios:

1. `CLAUDE.md` is not hard enforcement.

`CLAUDE.md` is injected as a user message following the system prompt. It is very effective, but if rules are vague, outdated, or mutually contradictory across files, the model can still make the wrong choice.

2. Block-level HTML comments are merely stripped before injection into context.

You can write maintainer notes inside `CLAUDE.md`:

```markdown
<!-- For maintainers only; stripped before injecting into context -->
```

However, if Claude opens the file directly with a file reading tool, the comments remain fully visible.

3. `@path/to/file` can include external files, but does not save tokens.

Referenced files are expanded into the context at startup (recursing up to four hops), and referencing external files for the first time may require approval. Never rely on `@` file splitting to "save window space" for large blocks of rules.

What is truly suited for on-demand rule loading is `.claude/rules/`.

![Division Between CLAUDE.md and Other Rule Files](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-rule-files-relationship-66d1a6af.png)

### `.claude/rules/`: For File-Path Triggered Rules

Suppose you have a set of frontend guidelines that are only needed when working on `src/**/*.tsx`. Loading them on every backend task is a pure waste of context.

`.claude/rules/` is designed for such conditional rules. Each rule is a Markdown file that can declare `paths` in its frontmatter:

```markdown
---
paths:
  - "src/**/*.{ts,tsx}"
  - "tests/**/*.test.ts"
---

# TypeScript Rules

- Validate all API input parameters.
- Test files should reuse existing fixtures whenever possible.
```

Rules with `paths` are not loaded into context wholesale at startup. Only when Claude reads files matching the glob pattern are the corresponding rules activated. This ensures that rules that remain valid long-term but are only useful for specific tasks don't crowd into `CLAUDE.md`.

In practical project organization, I typically split rules by intent:

- Rules that must be visible in every session go into `CLAUDE.md`;
- Rules useful only for specific file types or directories go into `.claude/rules/`;
- Multi-step, reusable operational procedures become Skills, triggered on demand;
- Behaviors that must be strictly blocked must rely on Hooks or permissions configs, rather than mere Markdown instructions.

Directives like "never run `rm -rf`" or "always run a specific script before committing" act merely as gentle reminders when placed in `CLAUDE.md`. If you truly need to block tool calls, you must rely on hooks, permissions, or outer CI checks.

### Auto Memory: Capturing Experience Accumulated During Claude's Work

Auto Memory is the official automatic memory mechanism in Claude Code. Its "automation" primarily manifests in Claude independently taking notes during work: recording build commands, debugging insights, architectural details, styling preferences, and working habits.

However, it does not write notes in every turn; Claude autonomously determines what information might be useful in the future. You can use `/memory` to open the storage folder directly.

![Claude Code /memory Command](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claudecode-memory-command-51dac2f1.png)

According to official documentation, Auto Memory became available starting in Claude Code v2.1.59 and is enabled by default. It places project memory in `~/.claude/projects/<project>/memory/`, reading the first 200 lines or 25KB of `MEMORY.md` at startup. Finer details are not dumped in all at once; they are organized into topic files to be opened when needed; `/memory` allows viewing and editing.

![Claude Code Auto Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-auto-memory-437c2c64.png)

You can also disable it directly:

```json
{
  "autoMemoryEnabled": false
}
```

Or via environment variable:

```bash
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1
```

The default storage directory is:

```text
~/.claude/projects/<project>/memory/
```

The canonical structure given in official documentation is:

```text
~/.claude/projects/<project>/memory/
├── MEMORY.md
├── debugging.md
├── api-conventions.md
└── ...
```

`MEMORY.md` serves solely as the entry index. At startup, Claude automatically loads the first 200 lines or 25KB (whichever comes first). Detailed explanations reside in topic files, which Claude reads only when needed.

This design mirrors the progressive disclosure model of Skills: first let the model know "what exists," rather than swamping the context with "all content" upfront.

![Progressive Disclosure of Skills](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

Official documentation does not mandate a specific schema for topic files, nor does it guarantee that "memory types must strictly be user / feedback / project / reference."

The following four categories were deduced from community source analysis:

| Type | Suitable to Save | Unsuitable to Save |
| ---- | ---------------- | ------------------ |
| `user` | Long-term user preferences, background, communication style | One-off, passing thoughts mentioned just now |
| `feedback` | Explicit corrections given by the user | Assumptions or preferences guessed autonomously by the Agent |
| `project` | Project phases, architectural rationales, temporary freeze rules | Ephemeral facts like current line counts or file structures |
| `reference` | Where to look up info, authoritative reference sources | Massive copied text blocks from documentation |

While Auto Memory writes notes automatically, that doesn't mean it should be left completely unmonitored. Whether asking Claude to "remember something," auditing auto-written notes via `/memory`, or building a similar system yourself, establish clear filtering criteria. My principle is: better to record fewer items than to accumulate useless clutter.

Focus on three questions:

1. Will this be needed when making decisions next time?
2. Has this been explicitly confirmed by the user?
3. When it expires, will anyone notice?

If you cannot answer affirmatively, let it stay in the current conversation; do not write it into long-term memory.

When saving an entry, don't just dump a bare conclusion into a topic file. Include the factual context, the reasoning behind the decision, the creation/expiration dates, and whether it must be verified before use. When the Agent reads this memory later, it sees a bounded record with context, not a rigid, brittle rule.

![Memory Write Governance](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-memory-write-governance-3368db83.webp)

For example:

```markdown
---
type: feedback
created_at: 2026-06-17
updated_at: 2026-06-17
---

# Connect Integration Tests to Real MySQL

Whenever integration tests verify database behavior, connect to a real MySQL instance; do not substitute with an H2 in-memory database.

Reason: Test cases previously passed on H2 but failed in production due to differences in transaction semantics and SQL dialects in MySQL.

Applicable Scope: Parameter validation and pure branching logic tests may continue using lighter alternatives; when transactions, indexes, SQL dialects, and concurrency are involved, real MySQL is mandatory.
```

Simply writing "don't use H2 for integration tests" works, but the Agent tends to follow it blindly. Providing the rationale and applicable scope allows the Agent to make sensible trade-offs when encountering simple parameter validation or branching logic later.

## What Should NOT Be Stored in Long-Term Memory

Having discussed what is worth remembering, let's look at content that should strictly remain in the current turn.

I generally advise against putting the following into Auto Memory:

- How many lines a specific file currently has, or where a particular function currently lives;
- Command output from the current turn, temporary logs, one-off errors, and intermediate triage states;
- Modification history easily queried via Git, or stable content already present in READMEs or API specs;
- Guesses or preferences inferred by the Agent that the user has never confirmed.

These are valuable in the current turn, but meaningless inside long-term memory, where they will actively mislead the Agent.

Timestamps should also use concrete dates. If a user says "don't touch the order module before the end of the month," write "Do not modify the order module before 2026-06-30." Expressions like "end of the month," "next week," or "yesterday" are only meaningful in the moment; read days later, Claude will have no way of knowing what date was intended.

Once a memory is recorded, its cost goes beyond a few dozen tokens. It must be reviewed, updated, or purged; left unmanaged, the Agent will continue making decisions based on obsolete premises.

## How Auto Memory Recalls: Do Not Hardcode Assumptions

Official documentation only outlines the layer involving `MEMORY.md` and topic files: loading the index at startup and reading detailed files on demand.

Under the hood, whether Auto Memory uses grep, an LLM picker, vector search, or another strategy is not explicitly detailed by Anthropic.

![Auto Memory Recall Flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-memory-recall-flow-e436c3ca.webp)

Community source analysis and reverse-engineering suggest that Claude may first inspect `MEMORY.md` and summaries of various files, selecting relevant files based on the current task; others believe it leans more toward keyword matching.

In practical implementation, grasping a few principles is enough: keep the index short, split detailed bodies out, and avoid duplicate injection of memories already present in the current turn. More is not always better when recalling—injecting one stale, erroneous memory does far more damage than omitting one.

## Categorize Memory Upon Recall Before Trusting It

Once Auto Memory is pulled back into context, treat it as a timestamped clue: it tells you why things were done that way previously and where to begin investigating, but does not prove things are still that way today.

For example, if memory notes: "Order timeout scheduled tasks reside in the `order-job` module." That record was likely true when written; but if code was subsequently refactored, the task may have moved or been renamed. If the Agent blindly modifies files based on stale memory, it will likely go astray. The safer sequence is: use memory to find direction, then verify against the current repository, docs, or command outputs.

Different types of memory require different levels of trust.

Long-term user preferences should take precedence, but explicit instructions in the current turn always override them. Past architectural decisions provide context on why a choice was made, but don't mean that choice is forever immutable. File paths, module locations, and CLI flags are mere clues that must be verified against the current repository before use. Code freezes, deployment windows, and schedules require absolute dates, to be updated or deleted once expired. Third-party documentation conclusions similarly require verification against current official docs or installed versions.

The value of Auto Memory is eliminating repetitive explanations and preventing the Agent from starting from scratch every time. Before taking action, the current code, current documentation, and current command outputs always have the highest priority.

## Subagent Memory vs. Agent Teams: Different Problems Solved

In multi-agent documentation, Subagent Memory and Agent Teams are frequently mentioned together. The former governs a subagent's own long-term experience, while the latter coordinates how multiple Claude Code sessions collaborate during a single task.

Subagent Memory is still file-based long-term memory, except the memory owner shifts from the main session to a specific subagent. The official subagent documentation supports three scopes in its `memory` field: `user`, `project`, and `local`.

Depending on the scope, Claude Code utilizes the following directories:

```text
~/.claude/agent-memory/<agent-name>/
.claude/agent-memory/<agent-name>/
.claude/agent-memory-local/<agent-name>/
```

These directories are created on demand. If a subagent has no `memory` configured, it is completely normal not to see `agent-memory/` inside `~/.claude/`.

When enabled, the subagent loads the first 200 lines or 25KB of `MEMORY.md` from the corresponding directory upon startup. It is also granted the necessary file tools to read and write its memory directory to maintain its own experience.

This memory is ideal for dedicated workers. For instance, a subagent exclusively handling database migrations can accumulate migration script conventions, common failure reasons, and historical trade-offs in the project. Next time it tackles a similar task, it knows where to look first and what pitfalls to avoid.

Agent Teams focuses on collaboration and scheduling. The official documentation describes team leads, teammates, shared task lists, and mailboxes—mechanisms designed for how independent Claude Code sessions divide work, communicate, and synchronize task status. This is distinct from shared long-term memory.

Agent Teams can reference a subagent definition to spawn a teammate, but that only means the teammate reuses parts of that definition's configuration. The official documentation explicitly confirms that `tools` and `model` are inherited, and the definition body is appended to the teammate's system prompt; `skills` and `mcpServers` do not carry over via this path. How `memory` behaves in teammate scenarios should be verified against your current version rather than assuming it acts as shared team memory.

Therefore, I use them separately: Subagent Memory preserves the long-term domain experience of dedicated workers; Agent Teams coordinates parallel execution within a single task. If you want a team role to carry long-term experience, verify what it loads at startup, where it writes, and whether it survives across sessions before relying on it in formal workflows.

## What Problems Do Third-Party Memory Plugins Solve?

Built-in Auto Memory allows Claude Code to remember preferences, commands, and project learnings locally in files. It is lightweight, but does not attempt to archive entire session transcripts, nor does it unify history across multiple machines, developers, or agents into a single searchable store.

Third-party plugins exist to address these two gaps.

**[`claude-mem`](https://github.com/thedotmack/claude-mem) focuses on conversation transcripts.** It records sessions and tool observations via Lifecycle Hooks, handing them off to a local worker for processing.

It consists of key components: a Worker Service on default port `37777`, SQLite storing sessions / observations / summaries, a Chroma vector database, a `mem-search` skill, and MCP Tools.

This solution is ideal for auditing historical decision flows, such as: "Why was the payment module merge paused last time?" or "Which command was previously used to diagnose slow queries?"

The trade-off is added overhead: workers, databases, indexes, and permissions must all be maintained.

**[`memsearch`](https://github.com/zilliztech/memsearch) acts more like an external memory store.** It preserves raw content using daily Markdown files, utilizes Milvus for vector index caching, and combines semantic vectors, BM25, and RRF for retrieval.

It is suited for multi-tool, multi-member, long-horizon projects—such as Claude Code, OpenClaw, OpenCode, and Codex CLI sharing a unified memory layer.

This architecture is significantly heavier than local Markdown files. Indexes, embedding models, Milvus Lite or cloud Zilliz, sync policies, and data access control all require operational ownership. When you only have dozens of memory items, jumping to this tier is usually unnecessary.

**How to Choose?**

For solo projects where you want Claude to remember test commands, commit conventions, and project preferences, start with `CLAUDE.md` plus Auto Memory. For team-wide stable rules, place them in the repo's `CLAUDE.md`, `.claude/rules/`, or official documentation so changes go through code review.

If you need automated archiving of session trajectories, look into Hook-driven local database solutions like `claude-mem`.

If multiple Agents, machines, and developers need to share long-term memory, consider `memsearch`, Mem0, or a custom database.

As for BM25, vector search, and rerankers, they shine when searching across tens of thousands of mixed documents, tickets, and wikis.

## How to Build a Lightweight Memory System

If you want to build a lightweight memory system for your team, start by defining the file structure and write rules.

`CLAUDE.md` should only contain essentials needed in every session: test commands, commit standards, forbidden directories. Path- or filetype-specific rules should not crowd this file; place them in `.claude/rules/` and control their activation scope with `paths`.

Long-term memories go into a dedicated `memory/` directory. Keep the categorization simple initially—four types are plenty: `user` for long-term user preferences, `feedback` for explicit user corrections, `project` for milestone decisions and short-term freeze rules, and `reference` for documentation portals. In each topic file, include `created_at`, `updated_at`, the rationale, and the applicable scope; for items dependent on current code state, verify before use.

![Lightweight Memory System Implementation](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-lightweight-memory-system-a72a6152.webp)

This setup can be maintained manually at first. It may not look fancy, but it avoids dirty data, allows team review, and can be recovered via Git if accidentally deleted. When manual indexing genuinely begins to slow down work, it's not too late to layer in auto-summaries, full-text search, or vector search.

The directory layout doesn't need to be complex initially. Giving indexes, user preferences, explicit feedback, project decisions, and reference portals their own places is sufficient:

```text
memory/
├── MEMORY.md
├── feedback/
│   └── integration-test-real-mysql.md
├── project/
│   └── payment-freeze-before-2026-06-30.md
├── reference/
│   └── slow-query-wiki.md
└── user/
    └── backend-preferences.md
```

`MEMORY.md` doesn't explain the full backstory; it serves purely as an index. It tells Claude what memories currently exist and which file to open when details are needed:

```markdown
# Memory Index

- [Integration tests use real MySQL](feedback/integration-test-real-mysql.md): Integration tests verifying database behavior must connect to real MySQL.
- [Payment freeze before 2026-06-30](project/payment-freeze-before-2026-06-30.md): New payment module merges are frozen prior to 2026-06-30.
- [Slow query wiki](reference/slow-query-wiki.md): Online slow query troubleshooting entry point is on the internal Wiki's db-slow-log page.
```

Explanations, context, and scopes stay in topic files. This keeps `MEMORY.md` consistently short and suitable for persistent retention; subsequent edits, deletions, and reviews can be inspected directly in the diff of the relevant topic file.

## Summary

Claude Code's memory relies on external files, indexes, and loading rules—not on the model storing history inside its weights.

`CLAUDE.md` is suited for stable rules, `.claude/rules/` for path-triggered rules, and Auto Memory for capturing preferences and learnings discovered during Claude's work. Keep `MEMORY.md` concise as an index; push reasons, scopes, and expiration details into topic files.

Rather than obsessing over search accuracy, pay closer attention to what should NOT be recorded. Temporary logs, line numbers, one-off errors, and unconfirmed guesses should remain in the current turn. Once written into long-term memory, someone must verify, update, and prune them.

Add third-party tools only when requirements demand them—never adopt them just for the sake of using them; keeping things simple is always best. If you need session recording, `claude-mem` is a natural fit; if multiple tools and team members need shared memory, evaluate `memsearch`, Mem0, or custom stores. When you only have dozens of memories, don't rush into vector databases—file-based indexes are usually more than sufficient.

My advice is simple: Define `CLAUDE.md` and `.claude/rules/` clearly first, then let Auto Memory or a manual `memory/` directory store a small set of high-value lessons. Only when memories grow so numerous that manual indexing becomes a bottleneck and collaboration roles turn complex should you bring in databases, BM25, vector search, and rerankers.

Having an Agent remember everything is pointless. What is far more reliable is teaching it where to verify its next step.

## References

- Official Claude Code Docs: [How Claude remembers your project](https://code.claude.com/docs/en/memory)
- Official Claude Code Docs: [Subagents](https://code.claude.com/docs/en/sub-agents)
- Official Claude Code Docs: [Agent Teams](https://code.claude.com/docs/en/agent-teams)
- Official Claude Code Docs: [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- GitHub: [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
- MindStudio: [Claude Code Memory Systems Explained](https://www.mindstudio.ai/blog/claude-code-memory-systems-compared)
- Milvus: [Claude Code Memory System Explained: 4 Layers, 5 Limits, and a Fix](https://milvus.io/zh/blog/claude-code-memory-memsearch.md)
