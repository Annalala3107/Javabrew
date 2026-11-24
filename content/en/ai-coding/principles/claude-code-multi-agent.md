---
title: "Claude Code Multi-Agent Mechanics In-Depth: Subagent, Subtask, Fork, and Agent Teams"
description: "Combining Claude Code official documentation and community source code analysis, this article unpacks Subagents, Subtasks, Fork Sessions, Agent Teams, task collaboration, permission propagation, and cost control, helping you master how multi-agent architectures decompose tasks, isolate context, and coordinate work."
category: AI Coding Internals
tag:
  - Claude Code
  - Multi-Agent
  - AI Agent
  - AI Coding
lang: en
sourceRef: zh-ref/ai-coding/principles/claude-code-multi-agent.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Multi-Agent,Subagent,Subtask,Fork Session,Agent Teams,AI Agent,Context Isolation,Task Collaboration,AI Coding
---

Hello, I'm Xiao G. Recently, a reader asked me: Are Subagents, Fork, and Agent Teams in Claude Code actually the same thing under different names? If asked about the Claude Code Multi-Agent mechanism in an interview, how should one answer?

Initially, I also thought it was just confusing naming overlaps. But when examining the official documentation, changelogs, and community source analysis together, the differences are substantial.

A single Agent in Claude Code can already handle plenty of work—everyday code modifications, troubleshooting, and writing tests are well within its reach most of the time.

The issue is that tasks in real-world projects are rarely neat and tidy. When a single conversation tries to search, read, experiment, and ultimately produce code modifications, the context rapidly becomes cluttered and polluted.

Take troubleshooting an API performance bottleneck, for instance. It might first search for endpoints, inspect Mappers, read logs, check indexing, and try out a few SQL queries. By the time it actually needs to write code, the conversation history is crammed with unrelated files, stale assumptions, and discarded proposals.

It's exhausting for humans to read through, and the model is equally prone to being led astray by such intermediate noise.

The Claude Code Multi-Agent architecture targets precisely this **context pollution and task decomposition challenge**.

Instead of dumping all work into a single conversation, it decouples work based on task characteristics:

- One-off searches are offloaded to Subagents;
- Side explorations that require existing context are delegated to `/subtask`, while independent explorations that need to continue on their own use `/fork`;
- Tasks requiring multi-role collaboration are upgraded to Agent Teams.

I've organized the multi-agent mechanisms in Claude Code here. This article references community source analysis to explore internal mechanics, while strictly aligning current usage with official documentation and changelogs.

These features iterate very rapidly. The version information in this article has been verified up to Claude Code v2.1.218 (2026-07-24): Starting from v2.1.212, under normal circumstances, a forked subagent within the current session uses `/subtask`, whereas `/fork` duplicates the current conversation to create an independent background Session. When Agent View is disabled, it behaves as an exception: `/subtask` is unavailable, and `/fork` continues to spawn an in-session forked subagent. Older articles referred to both behaviors indiscriminately as Fork, causing common confusion.

## Why Does Claude Code Need Multiple Agents?

Writing a small function, modifying a config file, or adding a unit test rarely strains a single Agent.

However, when executing cross-module tasks, a single agent often falls short. For instance, when asking Claude Code to troubleshoot an online slow query, it might have to perform these actions in succession:

- Search for related API endpoints and SQL statements;
- Read ORM / Mapper layer code;
- Inspect indexes and execution plans;
- Modify the query logic;
- Add unit tests or load-testing scripts;
- Finally, summarize the root cause and changes.

If all these steps are executed by a single Agent in the main conversation, the friction concentrates around two points:

- Excessive process noise. Unrelated files matched during search, old logs, failed attempts, and tentative hypotheses all linger in context. When writing code later, the model must constantly dredge through obsolete material to find what matters now.
- Task inertia. Having just investigated a database issue, if you immediately ask it to review a frontend component in the next turn, it may carry over its database mindset into evaluating UI code.

Therefore, my understanding of Multi-Agent is: **First and foremost, protect the main conversation. The main conversation is responsible for judgment, planning, and landing changes; dirty work, noisy searches, and side-tracks should be offloaded whenever possible. Parallel speedup is merely a welcome byproduct of sound decomposition.**

This aligns directly with what Context Engineering refers to as "isolating side-track processes": the main conversation retains judgment, plans, and final decisions, delegating search, verification, and code review processes that easily bloat context to independent workers.

![Sub-agents Decompose Tasks and Isolate Context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/sub-agent-task-splitting-context-isolation--635196e8.png)

Here is a summary table I organized. In Claude Code, multi-agent mechanisms can be chosen according to the nature of the problem:

| Problem | Suitable Mechanism | Description |
| ------- | ------------------ | ----------- |
| Heavy side-track searches polluting main context | Subagent | Subagent reads files and gathers data autonomously; main session receives only results |
| Need to inherit current context for side exploration | `/subtask` | In-session forked subagent inherits context and returns results to main thread |
| Need to clone conversation and continue independently | `/fork` | Creates an independent background Session that can be managed and resumed on its own |
| Multiple roles require collaboration, messaging, and task claims | Agent Teams | Each teammate is an independent Claude Code instance, with a shared task list and mailbox |

> **Environment Differences**: This table reflects default behavior with Agent View enabled. When Agent View is disabled, `/subtask` is unavailable, and `/fork` spawns an in-session forked subagent.

Though all have "Agent" in their names, their actual jobs differ substantially:

- Subagent usage is akin to: "Go look this up and report back when you're done."
- `/subtask` duplicates context within the current session for side tasks; `/fork` creates an independent background Session.
- Agent Teams allows multiple independent instances to work together on a project, sending messages, claiming tasks, and having the lead consolidate results.

![Comparison Between Subagents and Agent Teams](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-subagents-vs-agent-teams-e56e9e6b.png)

There is also a key detail: You don't always have to invoke Subagents manually. Official documentation notes that Claude autonomously determines when to delegate based on a Subagent's `description`; built-in Subagents like Explore, Plan, and general-purpose are also invoked automatically for appropriate tasks.

After reviewing this table, a practical question arises: When should you explicitly specify a Subagent, and when should you upgrade to Agent Teams?

When deciding, ask this first: **Do these workers need to communicate with one another?**

If they only need to investigate and report back, a Subagent is sufficient. Code review, log analysis, and localized research all fall into this category.

If multiple workers need to message each other, claim tasks dynamically, and exchange intermediate findings, only then consider Agent Teams. For example, one teammate handles backend APIs, another handles frontend views, and another focuses on testing and QA acceptance.

Costs are also an important consideration: Each teammate maintains its own context window, meaning token consumption scales with the number of active teammates. For research, architecture audits, and feature decomposition, the cost is usually well justified; for everyday small edits, a single session remains far more economical.

## Subagent: Lightweight Delegation in the Main Session

### What Is a Subagent?

A Subagent is the most commonly used—and least prone to overengineering—delegation mechanism in Claude Code.

You can think of it as a temporary worker dispatched by the main conversation. It has its own context window and can use specified tools. When its task finishes, it returns the result to the main conversation without dumping its entire noisy search trajectory back in.

Most of the time, an Agent reading a few extra files is harmless. The real trouble is when it drags search history, tentative guesses, and invalidated ideas back into the main session. The beauty of a Subagent is right here: let it search on its own; the main session only receives the synthesized outcome.

This is extremely valuable: the main session avoids context exhaustion.

![Claude Code Explore Subagent: Background Search Execution](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-explore-subagent-demo-329fa6cd.png)

In the image above, the main session merely delegated login, auth, and permission-check searches to the Explore subagent. The search ran in the background, keeping the main line clean; once the subagent finished, the main session received the organized file list, call chains, and key areas for subsequent focus.

![Claude Code Sub-Agent: Keeping Main Conversation Clean](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

When should you define a custom Subagent?

My rule of thumb: When the same type of worker appears repeatedly and requires the same set of instructions each time, formalize it into a custom Subagent. For instance, if you frequently assign read-only code reviews, database query checks, security scans, or log attribution, those tasks have stable roles, tool permissions, and output formats that justify a dedicated subagent configuration.

If you only occasionally search files or inspect a log snippet, letting Claude Code use built-in subagents or manual delegation is more than enough; don't create files just to "look professional."

Custom definitions typically reside in:

```text
~/.claude/agents/
.claude/agents/
```

These directories do not necessarily exist by default. If you don't see them, it simply means no custom Subagents have been created locally or in the current project yet.

In recent versions, creation is more direct: ask Claude to write it for you, or create the directory and Markdown file yourself. Since v2.1.198, `/agents` no longer opens an interactive creation wizard; it simply reminds you to ask Claude to create one or edit `.claude/agents/` directly. If the `agents` directory was just created during the current session, Claude Code may need a restart to detect it.

User-level Subagents apply across all projects, while project-level Subagents are shared with your team.

A Subagent file is Markdown with YAML frontmatter, where you configure name, description, tools, model, permission mode, hooks, and skills. `name` and `description` are required; `description` is critical because Claude uses it to decide when to delegate automatically.

### How Does a Subagent Run?

From runtime logs and community source analysis, the following single-invocation parameters for the `Agent` tool are most noteworthy:

| Parameter | Purpose |
| --------- | ------- |
| `description` | Task summary displayed to the main session |
| `prompt` | The concrete instructions passed to the subagent |
| `subagent_type` | Specifies the subagent type; defaults to `general-purpose` when omitted (does not auto-fork) |
| `model` | Specifies model alias for the subagent |
| `run_in_background` | Whether to run in the background; defaults to background execution since v2.1.198 |
| `name` | Assigns an addressable name to a background Subagent or Agent Teams teammate |
| `team_name` | Legacy parameter used in older Agent Teams; accepted in newer versions but ignored |

This table shows the invocation parameters of the `Agent` tool, not the YAML frontmatter of `.claude/agents/*.md`. In subagent definition files, corresponding background and workspace settings use fields like `background` and `isolation`.

You don't need to memorize this table. The key takeaway is: never rely on outdated claims that "omitting `subagent_type` implicitly forks." Normal Agent invocations default to `general-purpose` when unspecified; to inherit context, use `/subtask` or the appropriate fork configuration provided by your current version.

Internally, `AgentTool` handles entry and routing, while `runAgent()` actually executes the subagent.

`runAgent()` carries out runtime preparations:

- Initializes MCP Servers required by the agent;
- Creates a dedicated `ToolUseContext` for the subagent;
- Triggers `SubagentStart` lifecycle hooks;
- Writes sidechain transcripts and agent metadata;
- Enters the main `query()` loop.

These details illustrate one thing: a Subagent is not a simple function call in the main session. It reuses Claude Code's full Agent runtime, complete with tools, permissions, context, message streams, and transcripts.

Hence, it is well suited for self-contained side tasks. Having it inspect a batch of files, run a review cycle, and deliver a conclusion is far cleaner than cramming those intermediate steps into the main conversation.

### What Tasks Are Suited for Subagents?

I typically delegate these tasks to Subagents:

- Read-only review of a module, returning a list of issues;
- Searching for specific error logs, returning only the conclusion to the main session;
- Synthesizing usage of an external library without polluting context with search steps;
- Conducting an independent verification of a code change, which can easily be re-run if it fails.

Tasks requiring continuous judgment and steering from the main session should not be split out.

For example, when modifying a core file, having both the main session and a subagent touch it simultaneously rarely speeds things up and often introduces merge conflicts. My habit is to use Subagents primarily for read-only exploration and verification, rarely for direct main-line code modifications.

## `/subtask`, `/fork`, and Background Agents: When to Inherit Context?

### Differences Between `/subtask` and Standard Subagents

A standard Subagent typically starts with a distinct prompt from the main session. By default, it should not inherit the entire conversation history; otherwise, the benefit of "isolating process noise" is lost.

`/subtask` takes another approach: it launches a forked subagent within the current session, inheriting the accumulated conversation context from the parent session, and returns the result to the current main thread. This path must be chosen explicitly; omitting `subagent_type` does not trigger an implicit fork.

This is ideal for a specific moment: the main session has established a high-quality context that you don't want to waste, but you want to branch out in several directions simultaneously.

For example, the main session has just analyzed an entire payment module, and now you want to branch out concurrently:

- Check state machine design flaws;
- Check idempotency logic edge cases;
- Check test coverage gaps.

Here, `/subtask` is far more suitable than standard Subagents. Each child receives the parent's freshly established context without re-reading the entire project from scratch.

![Claude Code Fork: Background Branch Based on Current Context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-fork-subagent-demo-76a196bf.png)

The screenshot above reflects legacy `/fork` behavior. Under the naming conventions introduced in v2.1.212, when Agent View is enabled, branching context within the current session is performed via `/subtask`; modern `/fork` duplicates the entire conversation into an independent background Session that can be viewed, resumed, and managed separately. When Agent View is disabled, `/subtask` is unavailable and `/fork` retains the legacy forked subagent behavior.

### Use Cases and Limits of the Two Duplication Modes

Community source analysis reveals that in-session forked subagents reuse the parent session's rendered system prompt and message history. This maximizes prompt cache reuse, though it remains an internal implementation detail rather than a guaranteed public API contract.

This design exists primarily for prompt caching.

If every fork child re-executed system prompt generation from scratch, even if the content seemed identical, minor variations in dynamic config, tool lists, or feature flags could cause byte mismatches.

Byte mismatches invalidate prompt cache hits.

Reusing parent context benefits prompt caching, but also ties Multi-Agent behavior deeply to underlying context and tool registration layers.

This explains why `/subtask` is ideal for "context is freshly prepared, spawn a side branch immediately." If a side branch requires independent management, later resumption, or isolated recovery, the modern `/fork` is more suitable. If you are concerned about file edits conflicting, configure `isolation: "worktree"` for the Agent to isolate changes in an independent Git Worktree.

**Background Agents solve the waiting dilemma.**

For example, you can dispatch one Agent to run a full code review and another to analyze logs, while the main session continues designing architecture and breaking down tasks. Once background Agents finish, their findings flow back in.

However, if too many background tasks are spawned, management overhead escalates quickly. In-session `/subtask` and background Subagents are monitored, resumed, or terminated via `/tasks`; independent background Sessions created via `/fork` are centrally managed via `claude agents` in Agent View. Both run in the background, but operate at different task layers.

![Claude Code Agent View](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-20260518102539932-7c769093.png)

Running in the background does not mean running for free. Background Agents still consume tokens, context, and state. When too many run concurrently, even if the main session isn't blocked, the human developer becomes overwhelmed managing a sprawling flock of tasks.

Claude Code enforces default guardrails: Claude can spawn at most 200 Subagents per Session via the `Agent` tool, with a default concurrency cap of 20. The former can be adjusted via `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`, and the latter via `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`; Ultracode Sessions do not enforce default concurrency limits.

These limits primarily prevent the `Agent` tool from autonomously spawning runaway Subagents. Manually invoked `/subtask` commands still count against quota and consume concurrency slots, but can still launch even after reaching limits; `/fork` creates independent Sessions that do not count against the current session's 200 quota and possess their own budgets.

Subagents cannot spawn nested Subagents by default; when nested delegation is required, depth can be configured via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`. Within Agent Teams, in-process teammates cannot spawn teammates, and their own Subagents can only run in the foreground. These restrictions are protective circuit breakers, not targets to aim for; everyday tasks rarely come close to these limits.

The common cost of both `/subtask` and `/fork` is that they copy the parent session's history.

The cleaner the parent session, the more valuable copying context becomes. Having just finished reading a module, structuring a task plan, and clarifying key files and constraints, invoking `/subtask` or `/fork` saves enormous redundant reading overhead.

Conversely, if the main session has been rambling for dozens of turns, cluttered with irrelevant files, stale hypotheses, failed attempts, and tentative hunches, forking merely duplicates that mess to every child.

In that state, duplicating conversations does not distribute work—it duplicates chaos.

## Agent Teams: A Cluster of Independent Claude Code Instances

### Differences Between Agent Teams and Subagents

Agent Teams represents a much heavier multi-agent architecture in Claude Code; avoid viewing it simply as an enhanced Subagent.

One session serves as the team lead (abbreviated as lead), coordinating work, delegating tasks, and synthesizing results; teammates work independently, each possessing their own context window, and can communicate with one another.

This is easily misunderstood: a teammate does not inherit the lead's conversation history. It resembles a freshly launched Claude Code session, loading the current project's `CLAUDE.md`, MCP servers, and Skills, while receiving the spawn prompt sent by the lead. The prior back-and-forth discussions, tentative theories, and rejected proposals are not automatically transferred.

Consequently, spawn prompts cannot simply say "go look at the backend." Critical paths, known constraints, and expected output formats must be explicitly spelled out. Otherwise, the teammate gets a clean context window, but one so clean that it has no idea what was discussed earlier.

Subagents follow a "finish and report back" model. Teammates collaborate via a shared task list and mailbox: members claim tasks, provide supplementary info, and the lead consolidates everything at the end.

Teammates can also reuse existing Subagent definitions. For example, if you already created a `security-reviewer`, you can specify this agent type when spawning a teammate. It inherits the `tools` and `model` from that definition, appending the definition body to the teammate's system prompt. Note that `skills` and `mcpServers` frontmatter fields do not take effect via this route; teammates load Skills / MCP servers per normal session settings.

Before using Agent Teams, enable the experimental feature flag. It is disabled by default:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or set the equivalent environment variable in your shell.

### Shared Task List, Mailbox, and Teammate Mode

Agent Teams does not have teammates spamming a single massive chat room. It coordinates work primarily through two components:

| Component | Purpose |
| --------- | ------- |
| Shared task list | Tracks team tasks; teammates can claim and complete items |
| Mailbox | Enables teammates to message each other, request information, and sync status |

What is added here goes far beyond reporting results. Agent Teams maintains a shared task list and mailbox, allowing teammates to claim work, synchronize progress, and supply each other with missing details.

Treating the shared task list as a basic TODO list underestimates this mechanism. Tasks have three states: `pending`, `in progress`, and `completed`, and can define dependencies; dependent tasks cannot be claimed until their prerequisites finish. When multiple teammates attempt to claim the same task simultaneously, Claude Code uses file locks to prevent race conditions.

Messaging functions similarly. The lead assigns a name to each teammate, which can then be addressed directly. When a teammate becomes idle or encounters a failure, it automatically notifies the lead, eliminating the need for the lead to poll constantly.

Source analysis shows the underlying architecture: mailboxes are file-based inboxes with concurrency locks during writes; the task list enables teammates not just to receive prompts, but to actively claim work items.

A standard Subagent behaves like a one-off errand. Agent Teams maintains shared tasks and messages, functioning more like a miniature work queue.

Prompt design shifts accordingly. With Subagents, the task should be fully specified upfront; with Agent Teams, the lead can break large goals into the shared task list first, and teammates push forward around task items and messages.

![Claude Code Agent Teams: Multiple Teammates Collaborating on End-to-End Review](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-agent-teams-agentinvest-review-46765823.png)

The image above illustrates a realistic project case: the team lead breaks AgentInvest's complete analysis flow into four workstreams—backend SSE, Agent orchestration, frontend rendering, and test/resilience risks—spawning 4 teammates to claim them. The focus isn't merely running more searches, but having teammates advance against a shared task list, with the lead synthesizing cross-module findings.

`--teammate-mode` controls how teammates are displayed:

| Mode | Meaning |
| ---- | ------- |
| `in-process` | Default mode; displays teammates within the current process |
| `auto` | Uses split panes when tmux / iTerm2 is available; falls back to in-process |
| `tmux` | Uses tmux or iTerm2 split panes |
| `iterm2` | Uses iTerm2 native split panes, added in v2.1.186 |

The default value of `teammateMode` was changed from `auto` to `in-process` in v2.1.179.

Be mindful of such version changes when writing scripts or team documentation. Many online tutorials still recommend tmux by default or follow legacy team creation flows, which clash with current releases.

### Evolution Since v2.1.178

Older implementations featured `TeamCreate` / `TeamDelete`, `team file`, `team_name`, and similar mechanics. These details are helpful for understanding how Agent Teams evolved, but cannot be treated as current stable usage.

Since v2.1.178, when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is enabled, the first spawned teammate automatically forms the Agent Team for the current Session, removing the need for a separate creation step. A Session can only have one Team at a time; additional named Teams cannot be created.

`TeamCreate` and `TeamDelete` tools have been removed, and runtime Team configurations are automatically cleaned up when the Session ends.

The `team_name` parameter in the `Agent` tool is still accepted for backward compatibility, but is ignored. Similarly, `team_name` fields in `TaskCreated`, `TaskCompleted`, and `TeammateIdle` hook payloads are legacy compatibility fields.

During execution, Agent Teams utilizes two local directories: Team runtime config resides in `~/.claude/teams/{team-name}/config.json`, and Task list in `~/.claude/tasks/{team-name}/`.

These directories are automatically managed by Claude Code. The config file stores ephemeral runtime state (Session ID, Pane ID, Members) and is deleted upon session termination; the task list persists locally so resumed sessions can continue, with retention governed by `cleanupPeriodDays`. Do not edit these files manually, and do not place `.claude/teams/teams.json` in a project expecting it to take effect.

When studying older source code, keep things separate:

- Legacy code clarifies why Agent Teams has task lists, mailboxes, and team directories;
- Modern usage must follow official documentation; do not instruct users to invoke `TeamCreate`.

## Permissions, Costs, and Evolution

**Permission Requests Route Back to the Lead**

The biggest hazard in multi-agent workflows is a worker bypassing the main session to modify files or execute commands autonomously.

Claude Code does not let teammates make unilateral decisions. Permission requests requiring user confirmation are routed back to the lead.

Source analysis highlights the leader permission bridge: when an in-process teammate needs user approval, it queues the request into the leader's `ToolUseConfirmQueue`, tagged with worker identification in the UI. If the bridge is unavailable, it falls back to the mailbox path.

Users make permission decisions in a single unified interface, rather than hunting across multiple teammate windows to approve popups.

Subagents can also configure their own tool boundaries and hooks.

The official Subagent documentation provides an example of restricting access to read-only database queries: using a `PreToolUse` hook to inspect Bash commands, aborting with a rejection if `INSERT`, `UPDATE`, or `DELETE` statements are detected.

This aligns with layered tool security: low-risk operations can be relaxed, high-risk operations require confirmation, and actions involving file deletions, commits, deployments, or database writes cannot rely solely on prompt reminders.

![Layered Tool Calling Security Risks: Matching Control Strategies to Risk Tiers](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-tool-call-sec-036eb7f8.png)

**Costs Stem Primarily from Multiple Independent Contexts**

Agent Teams is expensive mainly because every teammate is an independent Claude Code instance.

I condense cost control into several practical habits:

- Explicitly specify the teammate's model or set `Default teammate model` in `/config`; it does not automatically mirror the lead's `/model`;
- Start most workflows with 3–5 teammates; three focused teammates often outperform five unfocused ones;
- Don't slice tasks too fine or leave them so large that long intervals pass without check-ins; aim for self-contained units like a single function, test file, or review cycle;
- Beginners should start with read-only tasks like research, audits, and bug investigations that don't modify code;
- When modifying code concurrently, ensure teammates work on distinct files to prevent simultaneous edits on the same file.

Ultimately, this comes down to context management.

Spawning three teammates maintains three separate context windows, rather than dividing one window into three. When tasks can truly run in parallel, this investment pays off; when tasks have tight sequential dependencies, it creates needless overhead.

**Version Information as a Snapshot**

This article reflects Claude Code v2.1.218 (2026-07-24). Version details evolve; always consult official docs and changelogs. For fast-evolving features like Agent Teams, Subagents, and Skills, commands and tool names in older articles frequently become obsolete.

## Decision Guide for Real-World Workflows

**Use a Single Agent for Small Tasks**

When the task is straightforward, changes are localized, and context is simple, stick to a single Agent. Don't overcomplicate things.

Examples:

- Modifying a single function;
- Adding a unit test;
- Adjusting a configuration parameter;
- Explaining a snippet of code.

Spinning up Subagents or Agent Teams for such tasks only adds scheduling friction. Letting one conversation handle small edits is the most reliable approach.

**Use Subagents for Side Quests**

Treat a Subagent as an errand runner sent out on a mission.

Examples: read-only audit of a module, searching error logs, mapping out module context, or running an independent sanity check on newly modified code.

These tasks share a common trait: the intermediate journey isn't important; the conclusion is. The main session only needs to know where the issue lies, what the evidence is, and what to do next, without absorbing all search hits, guesses, and dead ends.

When modifying core code, keep the edits in the main session. Subagents find clues and verify outcomes; the main session exercises judgment and commits changes.

**Upgrade to Agent Teams Only When True Collaboration Is Needed**

Approach Agent Teams with care. It is suited for tasks that go beyond "investigate and report back."

For instance, rolling out a new feature that simultaneously impacts backend APIs, frontend UI, testing strategies, and cross-cutting reviews. Teammates must do more than work in silos; they must coordinate: "This API schema changed; does the frontend need updates? Do new tests need adding? Who is free to take the next chunk?"

Only in this scenario do the shared task list and mailbox deliver real value. Otherwise, if you just want multiple workers to report conclusions, Subagents are more than enough.

Avoid breaking these scenarios into parallel agents: sequential edits within the same file, tasks with strict ordering dependencies, or work requiring a single developer to maintain unbroken context. Forcing separation here only creates coordination headaches.

When multiple Agents must modify code, isolate their working trees first. A reliable practice is assigning one Git Worktree per Agent, keeping each branch dedicated to a distinct task, leaving final merging and verification to a human or the lead.

![Claude Code Git Worktree](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-git-worktree-685b1929.png)

**Decompose Tasks First, Add Agents Second**

When task boundaries are ambiguous, adding Agents merely produces conflicting intermediate outputs. Clarify goals and dependencies with a single Agent first; delegate verifiable side tasks to Subagents; choose `/subtask` or `/fork` when current context is worth reusing; and enable Agent Teams only when cross-role communication is genuinely required.

More specifically, start with a sequential pipeline: Plan creates read-only specs, Code implements single tasks, Test runs verification, and Review inspects diffs. Once this pipeline stabilizes, consider decoupling independent stages to different Agents.

![Multi-Agent Three-Agent Collaboration Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-multi-agent-pipeline-f6ec4d47.png)

## Summary

Returning to the initial question: How should you choose among Subagents, Fork, and Agent Teams in Claude Code?

Don't fixate on "will multi-agent make things faster." View it primarily as a context governance strategy: the main session oversees judgment, planning, and landing changes, while noisy side searches, reviews, and validations are offloaded wherever possible.

Subagents isolate intermediate noise. Let them read files, search logs, and run read-only reviews; the main session receives only conclusions and evidence.

`/subtask` reuses established context within the current session to execute a side task and return results; when Agent View is enabled, `/fork` copies the entire conversation into an independent background Session for standalone management. When the main session is already cluttered, both simply duplicate chaos.

Agent Teams is the heaviest layer. It is warranted only when tasks require teammates to claim work, communicate dynamically, and share a task list. It consumes multiple independent context windows and introduces coordination overhead.

My recommended progression: Single Agent for small tasks; standard Subagents for clean side tasks; choose between `/subtask` and `/fork` when context must be reused; and spin up Agent Teams only for true cross-module collaboration. Its primary value is isolating process noise and clarifying ownership; parallelism is merely the natural result of well-decomposed work.

For further reading, explore [Context Engineering Practical Guide](https://javaguide.cn/ai/agent/context-engineering.html) and [Spec Coding: Specification-Driven Development](https://javaguide.cn/ai-coding/practices/spec-coding.html) from [AIGuide: AI Application Development, AI Coding in Practice, and Interview Guide](https://mp.weixin.qq.com/s/le3RzJsaAH22auUoB05y1Q). The former focuses on context isolation, while the latter details multi-agent collaboration pipelines.

## References

- [Claude Code Commands](https://code.claude.com/docs/en/commands)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Run agents in parallel](https://code.claude.com/docs/en/agents)
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code Source Code Deep Research Report (Community analysis, non-official)](https://claudeai.dev/docs/mechanics/development/claude-code-source-deep-research/)
