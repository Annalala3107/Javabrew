---
title: "OpenAI Codex User Guide: Configuration, AGENTS.md, and Agentic Workflows"
description: "Combining OpenAI official documentation and Codex CLI community practices, this guide clarifies Codex task descriptions, planning phases, AGENTS.md, config.toml, permissions, MCP, Skills, Subagents, Hooks, and Scheduled Tasks."
category: AI Coding in Practice
head:
  - - meta
    - name: keywords
      content: OpenAI Codex, Codex CLI, AI coding, AGENTS.md, Agent Skills, MCP, Subagents, Hooks, Scheduled Tasks, AI-assisted development
lang: en
sourceRef: zh-ref/ai-coding/practices/codex-best-practices.md
---

Hello, I'm Xiao G. Following my earlier piece [Claude Code User Guide: Configuration, Workflows, and Advanced Techniques](./claudecode-tips.md), several readers asked: Now that you've covered Claude Code extensively, how can we use OpenAI Codex with equal stability?

When I first started using Codex, my expectations were honestly modest.

Given its historical naming, it was easy to assume it was merely a command-line assistant slightly better at writing code snippets. However, after using it for an extended period, my perception shifted: Codex behaves like an engineering assistant capable of autonomously reading repositories, modifying files, executing terminal commands, and reporting back with completed deliverables. It is ill-suited as a mere tab-completion tool; instead, it excels at handling well-bounded, verifiable engineering tasks with explicit acceptance criteria.

However, there is an essential prerequisite.

You must set up the workbench properly: task boundaries, permissions, project invariants, and acceptance criteria must be clearly defined in advance.

If task descriptions are too vague, Codex will guess wildly; if permissions are too broad, it may execute unauthorized actions; if `AGENTS.md` reads like marketing copy, it will struggle to understand the repository every turn; and without explicit acceptance criteria, it will routinely stop prematurely at "it looks finished."

This article does not recount product release histories or anchor to specific model release names. Models, subscription tiers, and command flags evolve rapidly and become outdated quickly. What remains enduring are battle-tested engineering practices: how to frame task briefs, when to enter the planning phase (Plan), what belongs in `AGENTS.md`, what `config.toml` governs, how to layer permissions, Rules, and Hooks, and when to leverage MCP, Skills, Subagents, and Scheduled Tasks.

A brief scope clarification: this article focuses primarily on daily development with **Codex CLI + Codex App**. Command palettes and feature sets may differ in IDE extensions or Web/Cloud interfaces.

## Never Describe Tasks in a Single Sentence

Many developers approach Codex with prompts like this:

```text
Help me optimize the login logic.
```

This instruction is insufficient even for a human engineer, and it is certainly inadequate for Codex. Where does the login logic live? Are you optimizing for latency, readability, security, or an active bug? Which files are off-limits? And what verifiable evidence proves the optimization succeeded?

OpenAI's official best practices prescribe an effective framework: **Goal, Context, Constraints, Done when**. In everyday terms: state what to do, where to look, what to leave untouched, and what constitutes completion. Never define "Done when" as merely "functions properly"—specify verifiable artifacts like test runs, build logs, linter passes, UI screenshots, or command outputs.

Reframing the login fix using this framework:

```text
Goal: Fix the issue where session refresh fails after user session timeout even though refresh token is valid.
Context: Focus on src/auth, src/session, and AuthControllerTest.
Constraints: Do not modify database schemas, do not introduce new dependencies, maintain the existing Result<T> response contract.
Done when: Write a reproducing test case, update the implementation until tests pass, and report the command and full test output.
```

This dramatically narrows Codex's guesswork.

Trivial tasks can be lighter: updating copy, adding a log line, or renaming a parameter requires only a direct goal. But the moment a task touches authorization, payments, state machines, data migrations, concurrency, or backward compatibility, never omit these instructions. Spending an extra two minutes upfront spares you hours of reviewing tangled diffs later.

Another golden rule: **Provide raw materials rather than personal conclusions.**

When reporting a production error, avoid saying "It's probably a stale cache." Paste the raw stack trace, request parameters, reproduction steps, failing test logs, and browser console output, letting Codex diagnose the root cause. If you lead with an assumption, Codex will bias toward confirming your hypothesis, potentially patching business logic for what was fundamentally a configuration issue.

## For Complex Tasks, Plan Before Modifying Code

Codex can edit code directly, but that does not mean it should always do so immediately.

I assess operational risk first. Updating copy, adding fields, or inserting an obvious null check can be executed directly—it reads, edits, runs tests, and delivers quickly.

High-risk tasks require a different approach: modifying an order state machine, breaking down a 600-line method, or diagnosing an intermittent timeout. When you haven't fully traced the execution path yourself, letting Codex code immediately often leads into an architectural dead end.

For such tasks, force it into a planning phase first:

```text
Enter the planning phase first; do not modify any files.
Read src/payment, src/order, and related tests to trace the invocation path for inventory deduction upon payment confirmation.
Output the key files, current flow, potential edit points, risk factors, and recommended verification commands.
```

Once it completes its analysis, request a phased implementation plan:

```text
Based on your analysis, propose a phased execution plan.
Detail the files to modify, tests to add, and verification steps for each phase.
Do not start implementing yet; wait for my confirmation.
```

This cadence may seem slow for the first ten minutes, but it accelerates everything that follows.

In legacy codebases, the real challenge is rarely writing a snippet of logic; it is navigating historical compatibility shims, feature toggles, fallback paths, and fragile boundaries. The true value of the Plan phase is surfacing these hidden constraints upfront.

Remember that Plan outputs are candidate proposals, not indisputable facts. High-stakes changes still require human verification of critical call chains, transaction boundaries, and compatibility implications.

Conversely, avoid turning planning into empty ritual. When tasks are small and acceptance criteria are crystal clear, direct execution is superior. As community practitioners note: standard Codex paired with bite-sized tasks produces far more reliable outcomes than convoluted multi-step workflows.

## `AGENTS.md` Is Paramount

### Never Write It as a Second README

Much like `CLAUDE.md` in Claude Code, `AGENTS.md` serves as a project-level instruction manual for autonomous agents. Put plainly, `AGENTS.md` is an **Agent Job Description**: instructing Codex how the project boots, how it runs tests, which directories are off-limits, and what proof of verification must be supplied.

![CLAUDE.md and AGENTS.md in a multi-agent stock analysis project](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

However, their roles differ slightly.

`CLAUDE.md` is exclusive to Claude Code; `AGENTS.md` is an open instruction format officially supported by OpenAI Codex. How other tools consume it depends on their respective documentation—never assume all agents parse instructions identically.

If your repository already maintains `AGENTS.md`, you rarely need an identical `CLAUDE.md`. Have `CLAUDE.md` import `AGENTS.md` and append Claude-specific directives:

```markdown
@AGENTS.md

## Claude Code Specific Instructions

- Use plan mode when modifying code under `src/billing/`
```

This maintains a single source of truth that both tools can leverage. Conversely, if your team currently relies on `CLAUDE.md` and wants Codex or Cursor to share the same conventions, extract the universal rules into `AGENTS.md` while keeping Claude-specific commands in `CLAUDE.md`.

Keep only actionable information in `AGENTS.md`:

- Rules Codex frequently misinterprets
- Conventions unreadable from raw code
- Non-negotiable team standards
- Tech stack versions, essential commands, architectural trade-offs, and project pitfalls

### Hierarchical Discovery and Precedence

Upon startup, Codex constructs an instruction chain. In current documentation, discovery proceeds as follows: it checks Codex home for `AGENTS.override.md`, falling back to `AGENTS.md`; it then traverses from the repository root down to the active working directory. Each directory evaluates `AGENTS.override.md`, `AGENTS.md`, and fallback filenames in order, loading at most one file per level. Instructions closest to the current working directory load last and exert the strongest influence on the task.

`AGENTS.override.md` is designed to temporarily override `AGENTS.md` in the same directory, perfect for short-term rule adjustments without altering shared repository files.

A subtle but critical parameter: `project_doc_max_bytes` caps the total merged size of project instructions (defaulting to 32 KiB in official docs). Even if configurable, avoid creating massive, encyclopedic rule files. Overloaded instructions drown out critical constraints and degrade compliance.

My rule of thumb remains:

> If I delete this line, will Codex become noticeably more prone to mistakes?

If yes, keep it. If no, delete it.

Some teams treat `AGENTS.md` as an agent error log—recording recurring missteps like broken test commands or unintended edits to generated directories. While the concept is sound, avoid pasting raw error transcripts. Distill each lesson into an actionable, positive rule; otherwise, the file degenerates into an unreadable changelog.

Running `/init` drafts a starter `AGENTS.md`, but treat it strictly as a draft. It often pulls boilerplate from your README or guesses test runners incorrectly. Always prune generated files down to rules that genuinely alter Codex's behavior.

For enterprise repositories, adopt the index pattern:

In [Demystifying Harness Engineering](https://javaguide.cn/ai/agent/harness-engineering.html), I noted that OpenAI's internal `AGENTS.md` is roughly 100 lines long, acting as a curated index: stating core engineering standards and linking out to detailed architectural RFCs, diagrams, execution plans, and quality rubrics in `docs/`. When Codex needs to touch a specific module, it follows the link on demand.

This is progressive disclosure.

Never flood the context window with complete project history upfront. Keep foundational invariants in root `AGENTS.md`, module-specific guidelines in subdirectory files, and deep architectural rationale in dedicated markdown documents linked for on-demand inspection.

## `config.toml` Governs Client Behavior

While `AGENTS.md` describes the project, `config.toml` configures the Codex client runtime.

Configuration paths include: user-level at `~/.codex/config.toml`, project-level at `.codex/config.toml`, named profiles at `~/.codex/<profile>.config.toml`, and system-wide at `/etc/codex/config.toml` on Unix.

Per official documentation, precedence resolves from highest to lowest: CLI flags and `--config` overrides, project-level `.codex/config.toml`, active `--profile` configuration, user-level `~/.codex/config.toml`, system-level `/etc/codex/config.toml`, and built-in defaults. Project-level configurations only load if the repository is trusted; if flagged as untrusted, project `.codex/` settings, Hooks, and Rules are bypassed entirely.

In daily engineering, the most critical configurations are sandbox and approval policies:

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
```

This baseline fits standard workflows: Codex can modify files and run tests inside the workspace, but pauses for human approval before executing sensitive operations.

Settings like `approval_policy = "never"` or broad sandboxes belong strictly inside isolated environments: ephemeral worktrees, containers, CI runners, or least-privilege sandboxes. Bypassing confirmations merely to save a few keystrokes introduces severe risks into production repositories.

Hooks are enabled by default. To disable them explicitly, declare:

```toml
[features]
hooks = false
```

Treat third-party configs with caution: settings, Rules, and Hooks checked into unfamiliar repositories run code locally and should never be trusted blindly.

Here is how these mechanisms divide responsibilities:

| Capability | Primary Purpose | Best Used For |
| --- | --- | --- |
| `AGENTS.md` | Agent job description | Project rules, common commands, directory conventions, acceptance criteria |
| `config.toml` | Codex client settings | Model selections, sandbox modes, approvals, profiles, MCP endpoints |
| Rules | Command-level allow/prompt/forbid | Explicitly whitelisting, prompting, or barring specific CLI commands |
| Hooks | Lifecycle event scripts | Validation, auditing, formatting, and dynamic context injection |
| Sandbox / Approval | Hard runtime boundaries | Enforcing filesystem, network, command, and human authorization boundaries |

## Layering Permissions, Rules, and Hooks

Codex provides layered security controls. Beginners often attempt to write all constraints into `AGENTS.md`.

This is fundamentally unreliable: `AGENTS.md` provides advisory instructions, not hard runtime enforcement.

Think of `AGENTS.md` as soft guidance; sandbox and approval define execution perimeters; Rules govern whether commands can execute; Hooks enforce mandatory lifecycle actions.

For example, stating "do not run `rm -rf`" in `AGENTS.md` is merely advice. Encoding it into Rules halts execution before the command can run. Rules remain an evolving feature; the syntax below reflects current documentation. If unsupported in your version, use `/permissions`, sandbox policies, approvals, or Hooks instead.

```python
prefix_rule(
    pattern = ["rm", "-rf"],
    decision = "forbidden",
    justification = "Do not let Codex perform recursive force deletion; please confirm the directory manually.",
    match = [
        "rm -rf dist",
    ],
)
```

Hooks address a different operational layer.

If you want Codex to run a validation script before stopping, scan prompts for leaked API keys before calling tools, or auto-format files after edits, use Hooks. Officially supported events include `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `UserPromptSubmit`, `SessionStart`, `SubagentStart`, `SubagentStop`, and `Stop`.

However, Hooks execute local scripts. Unmanaged command hooks require explicit review and trust, prompting for re-confirmation upon modification. Furthermore, multiple command hooks matching the same event execute concurrently, meaning you cannot rely on execution order for security assertions.

## Make Codex Prove Its Changes Are Correct

The greatest risk with AI-generated code is not that it fails to write code, but that it writes code that "looks remarkably convincing."

I rarely say "let me know when it's done." I embed verification directly into the prompt:

```text
First write a failing test reproducing this issue.
Confirm the test fails, then update the implementation.
After editing, execute the relevant tests.
If it fails for 2-3 consecutive rounds, stop and report the blockers and evidence; do not keep guessing.
```

This sequence prevents false fixes. It forces Codex to reproduce the failure, adjust the implementation, and prove the fix with green assertions.

When Codex completes a task, I audit three areas: which files changed, what commands ran, and what risks remain unaddressed. Use `/diff` for a rapid visual inspection, and `/review` to audit uncommitted changes, specific commits, or run custom checks.

Use this checklist for verification:

- Red-to-green test progression.
- `git diff` summary highlighting critical files.
- Command outputs for test, lint, and build runs.
- Uncovered edge cases and residual risks.
- Key areas requiring human code review.
- Rollback strategy if issues arise in production.

Two community prompt patterns are especially effective:

```text
Prove to me this works. Compare the diff against main and show the evidence.
```

```text
Knowing everything you know now, scrap this approach and propose the simpler implementation.
```

The first forces Codex to back its assertions with hard evidence rather than confident claims. The second is invaluable when a first-pass implementation works but feels needlessly convoluted: having absorbed full context, Codex often refactors the solution into a significantly cleaner architecture.

Always review the diff yourself. Summaries never replace human review. When Codex claims "only tests were modified," open the diff and verify; when it claims "zero risks," scrutinize transaction boundaries, concurrency, permissions, and compatibility yourself.

## Connect MCP Tools That Deliver Real Leverage

MCP (Model Context Protocol) standardizes external tool integration: **external systems expose capabilities as an MCP Server; compatible AI clients connect to discover and invoke those capabilities.**

![MCP diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

Engineering context extends far beyond the Git repository.

Production errors live in Sentry, requirements in Linear, API contracts in internal portals, design specs in Figma, bug reproductions in browsers, and review discussions in GitHub. Copying these snippets manually into chat windows quickly becomes tedious.

MCP bridges this gap. Codex supports STDIO MCP Servers and Streamable HTTP Servers (supporting Bearer tokens or OAuth). Refer to official documentation for configuration syntax.

For example, adding Context7 documentation MCP:

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

After adding, run `/mcp` in the TUI to view server status.

A crucial design trade-off: **More MCP tools does not equal better results.**

Prioritize high-frequency, well-defined, and preferably read-only tools. If you debug production issues often, connect Sentry or log platforms; if you build frontend features, connect headless browsers, Playwright, or Figma; if you triage PRs, connect GitHub. Exercise strict restraint with tools possessing write access, elevated tokens, or infrastructure modification rights.

Categorize tools by risk:

- Read-only MCP: Fetching docs, querying error logs, reading Sentry issues, inspecting PR metadata.
- Semi-write MCP: Creating issues, commenting on PRs, drafting documentation in staging.
- High-risk MCP: Deploying releases, updating production configs, deleting resources, modifying cloud databases.

Default to read-only tools. Scope semi-write tools tightly, mandate human approval for high-risk actions, and use least-privilege, short-lived tokens.

Exposing too many tools bloats the decision space, increasing tool selection errors.

When authoring custom MCP servers, don't just declare parameter schemas. Codex parses the `instructions` field returned during MCP initialization, with official docs advising that critical guidance be placed within the first 512 characters: clarify when to use the tool, when to avoid it, and how to interpret returned payloads.

## Skills: Codifying Repeatable Workflows

Rule files and Skills solve fundamentally different problems.

Rule files define persistent invariants: tech stack versions, build commands, directory layouts, error code formats, and forbidden paths.

Skills define procedural workflows: conducting code reviews, writing tests, implementing UI components, researching documentation, or writing technical specs. Because these workflows follow predictable steps, you shouldn't have to re-explain them in every prompt.

A Skill is an on-demand instruction playbook. Workflow steps, constraints, checklists, and known failure modes are documented in `SKILL.md`.

Unlike `AGENTS.md`, Skills do not flood the context window upfront. By default, Codex only reads the Skill's name and description to evaluate invocation; the full body of `SKILL.md` and bundled assets load only when the Skill is invoked.

![Agent execution flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

Codify repeatable processes into Skills: running TDD before implementing features; reviewing security, transactions, performance, and edge cases; or verifying factual citations and tone when drafting documentation.

Skills turn repetitive reminders into reusable operating manuals. While Codex Skills and Claude Skills share similar design philosophies, verify specific directory layouts, invocation triggers, and permission models in their respective official docs.

A minimal viable `SKILL.md` looks like this:

```markdown
---
name: java-service-review
description: Review Java service-layer changes for transaction boundaries, null handling, logging, and regression tests.
---

Use this skill when reviewing Java service-layer changes.

Input materials:

- Current diff or target files.
- Related tests and error logs, if available.

Steps:

1. Read the changed service methods and related tests.
2. Check transaction boundaries, null handling, logging, and regression coverage.
3. Return findings with file and line references.

Do not rewrite code unless the user explicitly asks.

Done when:

- Findings are ordered by severity.
- Each finding explains the risk and a concrete fix direction.
```

Pre-built community Skills like Superpowers package TDD, Code Review, Spec-Driven Development, and Worktree isolation into ready-to-use workflows.

Never run third-party Skills uninspected. `SKILL.md` contains executable instructions; if it bundles dangerous commands, suspicious scripts, or excessive permissions, the agent will execute them. Audit the markdown, `scripts/`, and `references/` before installing.

## Subagents for Isolated Explorations

In extended tasks, intermediate investigations consume far more context than final implementations.

When diagnosing a complex bug, Codex might inspect dozens of files, comb through logs, and test several hypotheses. Only a handful of conclusions are ultimately useful, yet the main conversation becomes congested with search hits and dead-end reasoning.

Use Subagents for these investigations.

Subagent workflows are supported out of the box, but Codex only spawns subagents when explicitly instructed. Because each subagent runs its own model calls and tool executions, they consume tokens at a higher rate than single-agent sessions.

Built-in agents include: `default` for general tasks, `worker` for execution and remediation, and `explorer` for read-only codebase discovery. Custom agents can be configured via TOML under `~/.codex/agents/` or `.codex/agents/`.

A prompt delegating parallel research looks like this:

```text
Review current branch against main.
Spawn one subagent for each topic: security, concurrency, tests, maintainability.
Wait for all agents, then summarize findings with file references and severity.
Do not modify files.
```

These tasks have clean boundaries and execute naturally in parallel.

Avoid spawning subagents for trivial edits. Opening four subagents to modify a single DTO field introduces coordination overhead far exceeding the task's complexity. Keep overall goals, architectural decisions, and acceptance verification in the primary session, delegating only well-bounded investigations to subagents.

Subagents inherit the active sandbox policy. In interactive CLI mode, approval prompts from background threads may surface—always verify which agent initiated the request before approving.

## Start Scheduled Tasks Conservatively

Capabilities previously called Automations in the Codex App are now presented in the UI as **Scheduled Tasks**. They are ideal for recurring maintenance: scanning recent commits daily, drafting weekly release notes, checking for CI failures, or aggregating alerts.

They are not meant to "fix everything automatically."

Understand their operational prerequisites: project-level tasks execute locally, requiring the host machine to be powered on, Codex running, and project paths accessible on disk. Tasks inside Git repos can run in the local workspace or a dedicated background worktree. Scheduled tasks use default sandbox settings; granting full access increases background operational risk.

Follow this progressive adoption path: run the workflow as an ad-hoc prompt first; if you repeatedly execute the exact same steps, codify it into a Skill; once the Skill proves reliable, schedule it as a Scheduled Task.

Skills define the method; Scheduled Tasks define the cadence. Write task prompts as durable, self-contained instructions that do not depend on implicit conversational memory.

For instance, "Automatically fix all bugs daily and submit PRs" sounds enticing, but in practice produces heaps of noisy diffs requiring human triage. A far sounder pattern is "Scan CI failures from the past 24 hours daily and summarize root causes." Have it report findings first; decide whether to modify code afterward.

## Essential Commands

Slash commands in Codex evolve, and capabilities vary between CLI, Codex App, and IDE extensions. Treat these as current operational conventions, referencing `/` and `/help` for exact local behaviors:

- Session & planning control: `/permissions`, `/model`, `/fast`, `/status`, `/clear`, `/plan`, `/goal`.
- Context, memory & diffs: `/diff`, `/compact`, `/copy`, `/memories`.
- Extensions & tools: `/agent`, `/mcp`, `/hooks`, `/plugins`, `/apps`, `/skills`.
- Review & recovery: `/review`, `/fork`, `/resume`.

Commands are mere entry points. Final engineering quality is governed by clear task boundaries, project rules, verification criteria, and sandbox configurations.

## Practical Daily Workflows

When onboarding to an unfamiliar codebase, use Codex as an interactive guide:

```text
Do not modify any files.
Explain the user authentication flow, from incoming HTTP request to session persistence.
List key classes, methods, configuration properties, and any implicit constraints requiring human verification.
```

Spot-check its conclusions—especially cross-service calls, feature flags, and legacy backward-compatibility shims. Having it enumerate exact files and methods is far more reliable than generic prose summaries.

When fixing bugs, provide comprehensive raw evidence:

```text
Below are failing test outputs, error logs, and reproduction steps.
Identify potential root causes first; do not modify code immediately.
Once the root cause is confirmed, write a reproducing test, then fix the implementation.
After completing, run the relevant tests and explain why this test reliably covers the issue.
```

If it loops in a wrong direction for two rounds, stop asking it to "try again." Pause the session and prompt it to reflect: What is confirmed? Which hypotheses were disproven? What evidence is missing?

TDD is equally potent with Codex:

```text
Do not modify the implementation yet.
Write a failing test for OrderStatusService covering the scenario where duplicate payment webhooks cannot deduct inventory twice.
Once the test fails, update the implementation until the test passes.
```

For frontend tasks, provide explicit constraints:

```text
This is an internal operational tool: prioritize information density; avoid marketing-page styling.
Use existing Ant Design components; do not introduce new UI libraries.
Reference the filter bar, table, and pagination layout from src/pages/UserList.tsx.
Use CSS variables for theme colors; do not add gradient backgrounds.
After completing, boot the local dev server and verify there is no text overlap on mobile or desktop viewports.
```

Narrow PR review scopes:

```text
Review current branch against main.
Focus only on correctness, transaction boundaries, null handling, and missing tests.
Return findings ordered by severity with file and line references.
Do not comment on style unless it can cause a bug.
```

Prioritize findings that threaten correctness, security, data integrity, backward compatibility, or test coverage.

## Security Boundaries

Codex reads files, writes code, executes commands, invokes MCP tools, and controls headless browsers. As capabilities expand, security boundaries must tighten.

Enforce these non-negotiable baselines:

- Never expose production database passwords, cloud tokens, or SSH keys to Codex.
- Never grant default read access to `.env`, certificates, database dumps, production logs, or private key directories.
- Never permit direct manipulation of production environments without temporary credentials, formal approvals, and audit trails.
- Never permit default pushes to `main` or force-pushes to remote branches.
- Never execute unvetted remote scripts (`curl | bash`) outside isolated sandboxes.
- Never grant indiscriminate write permissions across all MCP servers.

When elevated automation is necessary, isolate execution inside containers, ephemeral accounts, least-privilege credentials, and dedicated worktrees. Maintain operational logs, command outputs, diffs, and approval records, ensuring rapid rollback capabilities.

## Common Pitfalls

- **Vague task descriptions.** Stating only "optimize this" forces Codex into guesswork, resulting in scattered edits across peripheral files. Frame tasks with clear goals, context, constraints, and completion criteria.
- **Over-planning simple tasks.** Trivial edits do not warrant multi-phase plans. Edit directly, inspect the diff, and verify. Reserve Plan phases for multi-module, high-risk refactoring.
- **Bloated `AGENTS.md`.** Packing too many rules into instruction files drowns out critical invariants. Distill rules from real mistakes; prune facts self-evident from code.
- **Overly permissive tools and sandboxes.** Connecting too many MCP servers confuses tool selection; granting broad permissions risks unauthorized background actions. Enforce least privilege.
- **Missing verification.** Code that looks reasonable is not necessarily correct. Always require red-to-green tests, build outputs, or visual verification. When sessions degrade, run `/compact` or fork a fresh thread.

## Risk-Tiered Engineering Strategy

Calibrate your workflow to task risk:

- **Low-Risk Tasks**: Update copy, add log statements, or adjust straightforward field mappings directly. Inspect `/diff` and run unit tests upon completion.
- **Medium-Risk Tasks**: Follow Plan → Execute → Verify. When modifying business workflows, adding endpoints, or refactoring local services, have Codex inspect files, propose an edit plan, and await your confirmation before coding.
- **High-Risk Tasks**: Analyze in read-only mode first. For payments, authorization, data migrations, production configs, or concurrency, have Codex trace call graphs and identify test gaps. Confirm critical decisions manually, then proceed via TDD or atomic commits inside isolated worktrees or containers.
- **Automated Tasks**: Never automate immediately. Prove the workflow manually first, codify it into a Skill, and only then schedule it as a Scheduled Task with audit logging and rollback plans.

## Summary

Once mastered, working with Codex shifts from "asking an AI to generate code" to "orchestrating an engineering assistant that reads repositories, executes verification commands, and delivers clean diffs."

Achieving this requires looking beyond prompt phrasing.

Task boundaries, project invariants, permission controls, verification standards, external tools, and reusable workflows collectively dictate the quality of Codex's output. My core recommendation remains: enable Codex to succeed consistently within a tightly scoped boundary first, then expand its autonomy gradually.

Never leap directly to full automation.
