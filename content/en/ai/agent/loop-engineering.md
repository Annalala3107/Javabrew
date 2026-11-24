---
title: What is Loop Engineering? Why is it Called "Old Wine in New Bottles"?
description: Explaining what problems Loop Engineering actually solves and when it is worth using, starting from Agent Loop, Context Engineering, Harness, Skills, MCP, Sub-agent, and Claude Code /loop, /goal.
category: AI Application Development
lang: en
sourceRef: zh-ref/ai/agent/loop-engineering.md
head:
  - - meta
    - name: keywords
      content: Loop Engineering,Agent Loop,AI Agent,Claude Code,/loop,/goal,Context Engineering,Harness Engineering,Agent Skills,MCP,AI Coding
---

After a CI failure, an Agent can read failure logs, locate relevant files, run minimal test suites, and write investigation findings back to an Issue. When the first round of investigation does not converge, the task faces a more practical question: who triggers the next round, what materials should continue to be read, and when should it stop and hand over to human intervention?

Loop Engineering focuses precisely on this outer-layer orchestration. It is responsible for stringing together successive executions of an Agent: CI, PR, or scheduled cron tasks trigger the next round, project rules and relevant evidence enter the context, tests and reviews determine whether the result is trustworthy, and state persistence allows subsequent runs to pick up right where the last one left off.

From public discussions, this term began gaining traction around **early June 2026**, with Addy Osmani publishing a notable article on June 7. In tools like Claude Code and Codex, capabilities such as `/loop`, `/goal`, and Automations—combined with Skills, Sub-agents, workspace isolation, and MCP/Connectors—can already form such pipelines.

## What Exactly is Loop Engineering?

Loop Engineering is used to organize multi-round tasks for Agents. It places the task's trigger mechanism, the materials readable and actions executable in each round, acceptance signals, state persistence locations, and stopping or human takeover conditions all into a single unified pipeline.

Taking an `auth` module as an example, a `goal` could be defined as "all tests pass, attempt up to 5 rounds maximum." The same task configuration will also record the trigger source, accessible files and rules, permitted scope of modifications, and where results should be written.

Suppose CI triggers this task: the Agent first reads project rules and failure logs, locates relevant files, and runs the target tests. Test output, linter results, type checks, screenshots, or review comments feed back into the next round to help determine whether to continue. Attempted approaches, failure causes, and next steps are written to an external file, Issue, Linear card, or database; when round or budget limits are reached, permissions are insufficient, or business judgment is required, the loop halts and hands over to humans.

![Loop Engineering Outer Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-outer-loop-d4043888.webp)

Prompts, context, and tool descriptions still determine how an individual model invocation executes. The Loop complements this before and after each invocation with task scheduling, material preparation, result verification, and state recovery, enabling the next round to build smoothly upon the previous one.

## What Old Concepts Does It Actually Borrow From?

### Agent Loop / ReAct: The Inner Loop Has Long Existed

![Agent Loop Workflow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-loop-flow-27c47f02.png)

The basic sequence of the Agent Loop has not changed: read the current context, pass it to the LLM to decide the next step, invoke tools or generate output, and write tool results back into the context; terminate upon reaching a stop condition.

ReAct follows this same paradigm: Reasoning and Acting alternate; the model proceeds step by step, deciding its next move only after receiving external feedback.

This loop was introduced in [AI Agent Fundamentals](https://javaguide.cn/ai/agent/agent-basis.html). Online incident troubleshooting, codebase exploration, and test failure localization do not have a predetermined, complete path; the model must continuously adjust its next steps based on the evidence acquired at each turn.

Here, two distinct layers of loops must be differentiated. The Agent Loop occurs within a single task run: model reasoning, tool calling, reading results, and deciding the next step. The outer Loop, on the other hand, operates after this run finishes—for example, awaiting the next CI event, inspecting test results, recording diagnostic logs, and deciding whether to re-invoke the Agent.

| Layer | Who Loops | What Each Round Does | Typical Stop Condition |
| --- | --- | --- | --- |
| Inner Agent Loop | The Agent itself | Think, call tools, observe results, proceed to next step | No more tools required; return final result |
| Outer Engineering Loop | Orchestration system or human-written workflow | Wake up Agent, assign tasks, verify results, persist state | Goal achieved, budget exceeded, failed and escalated to human |

### Workflow / Graph / Loop: Controllable Back Edges Have Long Existed

In workflow graphs, a Loop is typically represented by a back edge.

A back edge is a directed edge pointing from a downstream node back to an upstream node: the process has reached a "Review" node, but because a condition is unmet, it travels along this edge back to the "Revise" node to re-execute subsequent steps.

![Overview of the relationship between Workflow, Graph, and Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/workflow/workflow-graph-loop-relation-f4be2706.svg)

In the sequence "Generate draft → Review → If failed, revise → Re-review", the conditional edge for failed review is a back edge leading from "Review" back to "Revise"; passing the review exits the loop. [Workflow, Graph, and Loop in AI Workflows](https://javaguide.cn/ai/agent/workflow-graph-loop.html) provides a more comprehensive explanation of this structure. Runtime configurations must also specify maximum iterations, timeouts, token budgets, and fallback degradation paths upon failure to ensure back edges always have an exit.

Coding Agents extend this same back edge into Claude Code, Codex, CI, GitHub, issue tracking systems, and local repositories: after a test fails, they read the error, modify files, re-run commands, and let external signals decide whether to continue.

### Context Engineering: What Should the Agent See in Each Round?

When a CI issue reaches its third round without converging, raw logs, test outputs, change diffs, and conflicting intermediate judgments can easily pile up. Cramming all of them into the context drowns out project rules, and previously eliminated approaches might be executed all over again.

![Difference between Context Engineering and Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

Before each round's invocation, persistent rules such as `AGENTS.md`, `CLAUDE.md`, and coding conventions should be loaded first. Then, based on the current failure, relevant files, test outputs, Issue descriptions, or design documents should be introduced. Troubleshooting entry points like traceId, error codes, and log paths should retain raw values; verified conclusions should be condensed and persisted to external state.

When approaching context window limits, tradeoffs must be made between compressing history, pruning old tool execution results, and writing progress to disk. This ensures the next round can pick up evidence directly without re-reading the entire project, guessing rules, or repeatedly explaining the same error.

### Harness Engineering: The Execution Environment Outside the Model

In [Harness Engineering](https://javaguide.cn/ai/agent/harness-engineering.html), an Agent can be decomposed into Model + Harness. The model handles reasoning and generation, while the Harness provides the environment, tools, feedback, sandboxing, permissions, observability, and recovery.

![Relationship between Harness and Prompt/Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-layers-arch-f559e799.png)

The Harness can be viewed as the runtime environment for a single-round task. Which logs a CI triage task can read, whether it can modify files, and which test commands it can execute are all dictated by the Harness. The Loop then decides when to spin up this environment, where to store results, and whether to hand them over to another Agent for verification. Without file permissions, verification commands, and error handling, having a goal alone cannot enable unattended autonomous execution.

### Skills: Documenting Repetitive Experiential Knowledge for Every Round

![Agent Execution Chain](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

When CI troubleshooting recurs regularly, repository test commands, forbidden directories, formatting requirements, PR templates, and database migration confirmation rules should not need to be re-explained in every single round.

These details can be encoded into a Skill: the `description` matches CI troubleshooting tasks, while `SKILL.md` holds permissible directories, test commands, PR templates, and migration validation rules. Once a task matches, the body is loaded, and subsequent failures continue adhering to the exact same constraints.

![Skill Progressive Disclosure](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

Skills record operational instructions repeatedly needed across a project, rather than ephemeral prompts cobbled together on the fly for an ad-hoc conversation.

### MCP: Allowing the Loop to Access Real Tools

GitHub Actions, logging platforms, Linear, and Slack each have their own APIs. CI troubleshooting, PR babysitting, and task triage constantly switch across these systems. If every integration is built bespoke, the Agent faces multiple disparate tool descriptions and invocation protocols.

![MCP Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

An MCP Server exposes GitHub, issue trackers, logging platforms, internal documentation, and databases as discoverable tools; the Agent Runtime selects them, while underlying business systems still enforce authentication, permissions, and data validation.

Tool permissions must be configured based on side effects. When write permissions in an unattended Loop are too broad, the Agent might modify incorrect data, broadcast unintended messages, repeatedly invoke expensive APIs, or be tricked by prompt injection into reading unrelated files. Permissions, auditing, rate limiting, data redaction/sanitization, and human-in-the-loop confirmation should be deployed alongside MCP tools.

## What is Actually New About It?

TDD, CI, ReAct, and workflow graphs have featured loops for decades. Coding Agents now automate the outer actions previously executed manually by humans: reading errors, locating files, re-running commands, updating todo items, and feeding results back into the next round.

Taking a test failure as an example: a cron job or CI event can spawn an isolated worktree, load the project's Skills, have an implementation Agent modify code, have a verification Agent inspect it, and record the results into external state. If tests still fail, the next round continues guided by logs and test results; when permissions are insufficient, progress stalls, or high-risk operations arise, the process hands control back to humans.

Therefore, Loop Engineering actually focuses on three central questions: **What evidence is required to continue the next round, which actions must be paused for approval, and where is the previous round's state persisted?**

![Loop Engineering Outer Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-outer-loop-d4043888.webp)

## How Should We Understand Claude Code's /loop and /goal?

`/loop` re-executes a prompt based on time intervals, whereas `/goal` decides whether to continue based on completion criteria. For more details, refer to [Claude Code Commands in Depth](https://javaguide.cn/ai-coding/practices/claudecode-commands.html).

![Claude Code recommending the loop command](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudecode-father-loop-08b60d03.png)

`/loop` primarily addresses the need to "check back again in a little while." It repeatedly executes a prompt within the current session. You can specify a fixed interval, such as checking a deployment every 5 minutes; or omit the interval, allowing Claude to dynamically choose how long to wait based on observed results.

A bare `/loop` runs a built-in maintenance prompt, or reads `.claude/loop.md` or `~/.claude/loop.md` as the default prompt.

```bash
/loop 5m "Check if deployment is complete, and report current status"
/loop 30m /code-review
/loop "Check CI and review comments on the PR; process if there are changes, defer if there are none"
```

`/goal` primarily addresses the question: "Has this objective been accomplished?" You provide a verifiable completion condition, and Claude drives the task forward round by round. After each round, an independent smaller model determines whether the condition is met based on evidence already present in the conversation. If not met, it continues; if satisfied, it stops.

```bash
/goal all unit tests in the auth module pass, and npm test -- tests/auth exits with code 0; max 5 rounds, stop and report if the same failure reason occurs 2 times consecutively
/goal component migration under src/legacy is complete, npm run build passes, and git diff only touches src/legacy and corresponding test files
```

The difference can be summarized in one sentence: `/loop` decides when to wake up next, while `/goal` determines when the job is done.

Stop hooks or Agent SDKs can delegate continuation conditions to scripts, prompts, or external evaluators, executing deterministic checks, permission gates, and state persistence at the end of each round.

"Keep modifying until tests pass, up to 5 attempts maximum" is verified by `/goal` against completion conditions. Deployment polling, PR babysitting, long-running build monitoring, and scheduled code reviews are handled by `/loop` through periodic re-observation.

`/loop` acts as session-scoped ephemeral scheduling: tasks are triggered only while Claude Code is running and idle. Closing the terminal, exiting the session, or opening a new session disrupts it; `--resume` or `--continue` can only restore unexpired tasks; looping tasks automatically expire after at most 7 days.

When tasks must run stably long-term across machines and reboots, consider Routines, Desktop scheduled tasks, GitHub Actions, CI/CD pipelines, or dedicated task orchestration systems.

Before running `/loop`, tighten permissions and clearly document polling targets and stopping conditions. Before running `/goal`, frame completion criteria as verifiable outcomes and require Claude to display test, build, or diff outputs. Commit key paths first before letting the Agent edit, allowing clean rollbacks to explicit commit points if issues arise.

## How Can Loops Be Categorized?

The differences between Loops mainly lie in "who triggers the next round." `/loop` and `/goal` represent time-based wakeups and completion-condition continuations, respectively; CI events and human approvals can also act as triggers. The table below categorizes them along this dimension:

| Type | Trigger Mechanism | Suitable Tasks | Representative Tools |
| --- | --- | --- | --- |
| Time-Driven Loop | Every N minutes, daily, weekly | PR babysitting, CI checks, log inspections | `/loop`, Codex Automations, cron |
| Event-Driven Loop | CI failure, Issue created, PR updated | Incident triage, comment processing, alert summaries | GitHub Actions, Webhooks, Claude Code Channels |
| Goal-Driven Loop | Check if goal is met after each round | Fixing tests, API migrations, improving test coverage | `/goal`, Stop hooks, Agent SDK |
| Human Approval Loop | Pause for confirmation before critical actions | High-risk modifications, releases, permission changes | approval gate, draft PR, review queue |

This classification also explains why it is "old wine in new bottles": triggers, scheduling, validation, and approval are well-established engineering practices, now re-arranged around coding Agents.

## What Does a Production-Ready Loop Look Like?

Take "automatically handling CI failures daily" as an example. This workflow is modeled on standard debugging processes rather than a single company's proprietary implementation. The first version performs only triage—no automatic code changes or automated PR merges.

The initial version verifies three things only: whether the Agent can find the correct evidence, whether it can distinguish facts from assumptions, and whether it records state in a standardized format. Only after these three aspects stabilize should low-risk auto-remediation permissions be granted.

CI triage can be triggered at 9 AM daily or upon CI failure, reading the latest failed run, related PR, recent commits, and failed test logs. It loads the project's `AGENTS.md` and `ci-triage` Skill, reads only related module files, and distinguishes between environment flakiness, test instability, code regressions, and dependency conflicts.

If reproducible locally, it runs a minimal test suite; if not reproducible, it preserves raw evidence. Conclusions are written to `TODO.md`, a GitHub Issue, or a Linear card, tagged as "Auto-fixable", "Requires owner confirmation", or "Suspected sporadic/flaky". The workflow does not push code directly, does not modify production configurations, and caps consecutive retries at 3.

![CI Triage Loop Example](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-ci-triage-loop-30220744.webp)

Once this version proves stable, automatic remediation can be incrementally introduced:

- For low-risk issues like "dependency version conflicts", "formatting failures", or "obvious test snapshot updates", spawn an isolated worktree for the Agent to attempt fixes.
- After fixing, target tests must be executed.
- Once passing, create a draft PR only; never merge automatically.
- A secondary review Agent performs a second check against project Skills and the diff.
- Upon failure or uncertainty, route the task back to the human queue.

Several components discussed earlier appear within this Loop:

| Component | Role in This Example |
| --- | --- |
| Automation | Triggers daily or upon CI failure |
| Skill | Codifies CI triage workflow, test commands, repository rules |
| MCP / Connector | Reads GitHub, CI, Issues, logging platforms |
| Context Engineering | Ingests only failure-related logs, files, and rules |
| Worktree | Isolates auto-fix branch, preventing pollution of main workspace |
| Sub-agent | One responsible for implementation, one for verification |
| Memory / State | Records attempted approaches, failure causes, and next steps |
| Stop Condition | Tests pass, retry cap reached, high-risk operation encountered |

"Running at 9 AM daily" provides only the trigger time. CI links and failure logs establish the investigation entry point; minimal reproduction commands and test results govern whether to proceed; PR diffs and human confirmation statuses govern whether changes can move forward. Without this external evidence, a scheduled task would merely repeat the exact same prompt fruitlessly.

## What Scenarios Are Worth Building a Loop For?

Loop execution requires recurring tasks and inspectable acceptance signals. Logs, exit codes, coverage metrics, and diffs can all serve as grounds for continuation or termination. The following tasks typically allow such conditions to be formulated:

- Initial CI failure triage: clear logs, test results, and unambiguous failure signals.
- Dependency version upgrades: modified in isolated branches, validated by test exit codes and build outputs.
- Test coverage improvement: quantifiable targets, such as raising module coverage from 62% to 75%.
- Documentation synchronization: updating user or API documentation based on recent diffs, finalized via human review.
- Large-scale mechanical migrations: e.g., CommonJS to ESM, legacy component API replacements, code formatting fixes.
- PR / Issue triage: reading details, categorizing, generating summaries, and tagging priorities.

Conversely, the following tasks are difficult to validate using external signals alone:

- Highly subjective goals, e.g., "improve product experience" or "devise a growth strategy."
- Extremely weak verification signals, relying solely on the Agent saying "I think this looks good."
- Severe blast radius upon mistakes: production database writes, auth/permission system changes, payment pipeline modifications.
- Strong reliance on human aesthetic or business judgment: brand copywriting tone, complex product tradeoffs.
- Overhauling legacy codebases lacking tests, logs, or rollback mechanisms.

Phrases like "make it better" or "continue optimizing" cannot trigger reliable stop evaluations. Before looping, decompose the objective into inspectable subtasks with concrete evaluation criteria.

## Common Pitfalls to Avoid

### Goals Written Too Vaguely

"Keep optimizing" lacks modification boundaries, verification commands, and stop conditions, leaving the Agent unable to determine when its mission is accomplished.

Goal written with vague intent only:

```text
/goal "Optimize this project to make code quality better"
```

Goal written with explicit execution scope and exit criteria:

```text
/goal "All failing unit tests in the auth module pass, only allowed to modify src/auth and tests/auth; after each round run npm test -- tests/auth and display exit code; max 5 rounds; if failure reason is identical for 2 consecutive rounds, stop and report"
```

`src/auth`, `tests/auth`, test exit codes, a 5-round cap, and consecutive failure conditions can all be checked programmatically; the second command leaves no acceptance criteria to the Agent's imagination.

### Treating Agent Self-Assessment as Acceptance

Test exit codes, CI status, linters, type checks, or visual regression diffs constitute true evidence of completion; the Agent's self-description can only serve as supplementary context. Where semantic reviews are necessary, have one Agent implement changes and a separate Agent evaluate them in an isolated context; introduce human approvals for steps approaching production.

### Forgetting Cost and Resource Caps

Each round may re-read files, invoke tools, analyze error messages, compress context, or launch secondary review Agents. Task configurations must bound both budget and stop conditions:

- Maximum iteration count.
- Maximum tool call count.
- Daily or per-task token/dollar budget.
- No-progress detection (e.g., stopping if failure reasons remain identical across two rounds).
- Low-value tasks restricted to summarization without autonomous remediation.

No-progress detection halts unnecessary token drain when error causes remain unchanged.

### Granting Overly Broad Permissions

Reading logs, creating PRs, and auto-merging PRs entail vastly different risk tiers; they must never share a single blanket permission. Operations such as file deletion, production configuration changes, outbound messaging, and database writes must require human confirmation by default.

MCP Server origins, tool descriptions, return payloads, and prompt templates must also be audited, as any of them can carry prompt injections. Permissions should be unlocked progressively across execution tiers:

| Tier | What Agent Can Do | What Human is Responsible For |
| --- | --- | --- |
| L0 Read-Only Summary | Read logs, read issues, generate reports | Decide whether to adopt findings |
| L1 Local Reproduction | Run designated tests, localize failure | Decide whether to fix |
| L2 Draft Remediation | Edit code in worktree, run tests | Review diff |
| L3 PR Creation | Commit branch, author PR description | Review, merge |
| L4 Auto-Merge | Automatically merge upon policy pass | Handle exceptions only |

L1/L2 cover log inspection, reproduction, and draft modifications. L4 requires fixed failure archetypes, tests covering primary risks, and thoroughly verified rollback procedures; tasks involving business judgment, permissions, or database writes must retain human review.

![Safety Boundaries of a Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-safety-boundary-658e0391.webp)

## Do Not Rush into Auto-Fixing in V1

When building a Loop for the first time, avoid leaping directly into unattended auto-fixing. Start with read-only triage, detailing task instructions thoroughly:

```text
Task: Inspect CI failures over the past 24 hours daily and produce a triage summary for human engineers.

Allowed Actions:
- Read GitHub Actions, recent commits, failed test logs, and files directly related to errors.
- Upon isolating a specific test, run that test to confirm reproducibility.
- Append findings to TODO.md, including CI links, key errors, and suggested owners.

Prerequisites:
- Read AGENTS.md first.
- Load ci-triage Skill when matching CI troubleshooting tasks.

Forbidden Actions:
- Do NOT edit code, create PRs, or send Slack/email notifications.
- Do NOT read unrelated repository files or paste entire raw logs into context.
- Halt if failed items exceed 10; attempt reproduction at most 2 times per failure.
- Flag for human review immediately if permissions are missing, logs are absent, or business judgment is needed.
```

This version keeps tight guardrails: inspect only CI evidence and relevant files, modify no code, send no external messages, and cap both failure counts and reproduction attempts. In the triage summary, watch for three anomalies: irrelevant file reads, repetitive tool calls, and unauthorized actions. Before these are resolved, remediation permissions should remain locked.

When tasks span across days, newly opened sessions will not inherently know what was attempted yesterday. State that needs resuming must be written to external storage: goals, scope, evidence, executed actions, results, next steps, and stop conditions must all be readable by subsequent rounds.

```yaml
loop_id: ci-triage-2026-06-17
goal: "Investigate CI failures over the past 24 hours"
status: running
scope:
  repos: ["backend-service"]
  max_items: 10
attempts:
  - item: "auth-test failure"
    evidence: "GitHub Actions run #12345"
    action: "ran npm test -- tests/auth"
    result: "reproduced locally"
next_step: "ask auth owner to review"
stop_condition:
  max_attempts: 3
  require_human_when:
    ["permission_missing", "production_change", "uncertain_root_cause"]
```

Once this triage pipeline runs reliably, attach four hard constraints to auto-remediation:

- Create an isolated worktree or branch prior to editing.
- Whitelist allowable file modification paths.
- Permit only specified test and formatting commands.
- Open draft PRs upon success; never auto-merge.

## Before Integrating Loops into Production

### What Triggers the Next Round?

Daily cron tasks first locate failures over a recent time window; CI failure webhook events can directly feed the failing job, related PR, and recent commits to the triage pipeline. The task scope, readable files, and permitted commands should be passed along with the invocation, enabling fresh sessions to prepare their contexts accordingly.

### When to Continue, and When to Stop?

CI links, failure logs, minimal reproduction commands, and test exit codes demonstrate whether the investigation is making genuine headway; `attempts` and `stop_condition` maintain executed actions and termination reasons in external state. When permissions are inadequate, issues cannot be reproduced, business decisions are needed, or consecutive failures reach their ceiling, tasks should transition back to the human queue. Opening PRs, modifying production configurations, and auto-merging must never be default sequential actions within the same unattended Loop.

## Summary

Loop Engineering connects each model invocation with evidence, state, and constraints handed down from prior rounds.

The CI triage scenario discussed here starts with reading logs, pinpointing failures, and documenting findings, while YAML state records `evidence`, `action`, `result`, and `next_step`. These fields allow the next iteration to pick up where work stopped, while giving humans full visibility into historical actions upon taking over. Once read-only triage stabilizes, permissions for modifying code, creating PRs, and auto-merging can be unlocked gradually.
