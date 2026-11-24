---
title: "Claude Code User Guide: Configuration, Workflows, and Advanced Techniques"
description: "Combining Anthropic's official documentation and real-world project practices, this guide clarifies Claude Code configuration, permissions, MCP, Skills, Sub-Agents, context management, and common workflows."
category: AI Coding in Practice
head:
  - - meta
    - name: keywords
      content: Claude Code, AI coding, CLAUDE.md, MCP, Skills, Sub-Agent, Agentic Coding, AI-assisted development
lang: en
sourceRef: zh-ref/ai-coding/practices/claudecode-tips.md
---

Hello, I'm Xiao G. A few days ago, I posted [Practical Tricks for Vibe Coding](./the-cool-tricks-for-vibe-coding.md), and within two days it reached over 60k reads on WeChat, with many readers in the comments asking specifically about Claude Code.

So this article is dedicated entirely to Claude Code.

I'm not sure if you experienced the same initial friction as I did, but when I first started using it, it felt genuinely awkward and even off-putting. Having grown accustomed to Cursor and IntelliJ IDEA's sidebars, file trees, and diff panels, stepping back into a terminal to collaborate with an AI felt distinctly unnatural.

However, after using it extensively, I came to realize that the CLI abstraction is exceptionally well-suited for long-running, autonomous engineering tasks. It can run locally, but it can just as easily be transplanted to remote machines, ephemeral containers, and CI/CD pipelines. The exact same commands, permissions, and verification flows can be reused without needing to re-engineer steps for a GUI.

Nowadays, when I use Claude Code, I simply define the directory boundaries, objectives, and acceptance criteria upfront, let it inspect the codebase and run commands autonomously, and review the final diff and test results at the end.

That is also where the pitfalls lie. Bloated `CLAUDE.md` files, overly permissive permissions, blown context windows, and misdefined Sub-Agent boundaries can easily send Claude spiraling off course.

The following notes are drawn from my personal experience over more than a year of intensive usage. They emphasize practical production engineering rather than merely rehashing the official documentation.

PS: Claude Code evolves rapidly. This article is organized around v2.1.218 (2026-07-24) official documentation and personal operational experience. Commands, permission modes, plugins, Auto Mode, Sub-Agents, and Worktree behaviors may vary depending on your version, operating system, subscription tier, provider, and distribution channel. Before practical use, always check `claude --version`, `claude --help`, `/help`, and the official docs. For instance, `/run` and `/verify` require v2.1.145+; `/code-review` supports effort tiers, `--comment`, and `--fix`; `/simplify` is currently positioned as a cleanup-only review rather than a comprehensive correctness bug hunter.

Developers outside standard access regions must also factor in account policies, network latency, costs, and third-party API gateway stability. Domestic models like GLM, MiniMax, Kimi, and DeepSeek can serve as viable alternatives or supplements. However, when tackling massive refactoring, deep architectural changes, and complex multi-module debugging, Claude remains uniquely capable and worthy of deep study.

## `CLAUDE.md` Is Paramount

`CLAUDE.md` should never be written as a second README. Think of it instead as an operational cheat sheet for Claude Code: rules invisible from the raw code, commands it consistently misguesses, directories it must never touch, and specific test suites it must execute after altering particular code paths.

![CLAUDE.md and AGENTS.md in a multi-agent stock analysis project](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

In my projects, I generally only include: **rules Claude tends to misguess, unspoken conventions absent from the code, non-negotiable team standards, tech stack versions, common commands, architectural trade-offs, and known project pitfalls.**

Official documentation recommends keeping each `CLAUDE.md` under 200 lines. Oversized instruction files consume excessive context and degrade rule compliance. As instructions grow, partition them into path-scoped `.claude/rules/`, and offload low-frequency references into Skills.

![Claude Code official documentation recommendation for CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudemd-claude-docs-95f47141.png)

When deciding whether a rule belongs in `CLAUDE.md`, I ask myself:

> If I delete this line, will Claude become noticeably more prone to mistakes?

If yes, keep it. If no, delete it immediately.

### File Locations and Precedence

`CLAUDE.md` can be placed at multiple filesystem levels. The official loading hierarchy cascades from global down to local—never look solely at the project root:

![CLAUDE.md hierarchy and priority](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-file-hierarchy-8abb6c01.png)

At the outermost level are enterprise/organization-wide files, typically managed by IT or DevOps to enforce company-wide compliance. The path is `/Library/Application Support/ClaudeCode/CLAUDE.md` on macOS, `/etc/claude-code/CLAUDE.md` on Linux/WSL, and `C:\Program Files\ClaudeCode\CLAUDE.md` on Windows. You rarely touch these in individual projects.

Next is the user-level configuration at `~/.claude/CLAUDE.md`, ideal for your personal cross-project habits. Project-level instructions reside at `./CLAUDE.md` or `./.claude/CLAUDE.md` and should be checked into Git for the whole team to share. Local machine configurations belong in `./CLAUDE.local.md`, which must be added to `.gitignore`. Subdirectory `CLAUDE.md` files are not loaded upfront into context; they load on demand only when Claude touches files inside that directory.

All these files enter the context together; later files do not replace earlier files wholesale. However, rules closer to the active project and narrower in scope appear later in the context sequence and are naturally favored by Claude when resolving instructions.

For instance, if your user-level rule states "use space indentation" but a project-level rule specifies "use tabs for this repository," Claude will prioritize the project rule for that repository. Official docs confirm this cascading precedence from organization down to local level.

My personal workflow is to commit project-level `CLAUDE.md` to Git, containing only shared team standards. Personal preferences—such as wanting commit messages in a specific language—belong in `CLAUDE.local.md` and `.gitignore`.

For larger repositories, decompose the file hierarchy:

```text
my-project/
├── CLAUDE.md
├── backend/
│   └── CLAUDE.md
├── frontend/
│   └── CLAUDE.md
└── .claude/
    ├── rules/
    ├── skills/
    └── agents/
```

Keep global invariants at the root, and place localized rules in subdirectories. When Claude inspects files in a subdirectory, it loads the relevant instructions on demand. This approach works exceptionally well in monorepos, preventing backend, frontend, and admin dashboard rules from crowding into one giant document.

Don't misunderstand `@path` imports either. They do not magically save context tokens—imported contents are still pulled into context; they simply make instructions cleaner to organize. When rules only apply to specific subdirectories, use path-scoped `.claude/rules/` rather than cramming them into the root file.

### Initialization and Ongoing Maintenance

For a new project, start by running:

```bash
/init
```

Claude will inspect the repository and draft an initial `CLAUDE.md`. Treat this purely as a starting draft; do not commit it unreviewed. It might guess build commands incorrectly or redundantly transcribe sections from your existing README.

The greatest risk during maintenance is continuous, unchecked expansion.

When Claude makes an occasional mistake, resist the impulse to immediately append a new rule. Only add a rule when the same error recurs two or three times and you can formulate a crisp, definitive instruction to prevent it. Conversely, facts self-evident from the code, things the model already handles correctly, and obsolete conventions should be pruned regularly. When rules proliferate, the most critical instructions get drowned out.

If Claude reads a rule but fails to follow it, evaluate whether the phrasing is too vague. "Strive to maintain comprehensive testing" is weak; "When modifying a Service, you must run its corresponding unit tests and print the command and output" is concrete and enforceable. If a rule consistently fails across multiple sessions, check whether the file is too long or placed in the wrong directory scope.

I categorize rules into two distinct tiers: team-level, long-term, non-negotiable requirements belong in `CLAUDE.md`; personal preferences, transient debugging findings, and temporary reminders belong in Auto Memory or local settings. A good `CLAUDE.md` stems from real mistakes and is regularly pruned of stale directives.

Never assume a rule has taken effect just because you wrote it down. Use `/context` to inspect which `CLAUDE.md`, `CLAUDE.local.md`, and rules files are actively loaded into the current session; `/memory` is used to view and edit configurations and stored memories. If a file is absent from `/context`, Claude cannot see it. In complex repositories utilizing path-scoped `.claude/rules/`, you can configure an `InstructionsLoaded` Hook to log precisely when and why rule files get loaded.

## Take Permission Management Seriously

### Tiered Authorizations

By default, Claude Code prompts for human confirmation on sensitive actions, including writing files, executing Bash commands, and calling MCP tools. While this may feel tedious at first, keeping confirmations enabled is far safer until you become familiar with its execution patterns.

I typically start by whitelisting commands that are read-only and non-destructive. Commands like `git diff`, `git status`, and `rg` can be granted freely; deterministic verification commands like `mvn test`, `pnpm test`, or `npm run lint` can also be whitelisted depending on the project.

Conversely, destructive commands such as `rm -rf`, `git push --force`, and modifications to `.git/` should never be whitelisted. Sensitive targets like `.env`, `secrets/`, build artifacts, certificate directories, and database dumps should be explicitly blocked using `deny` rules.

Permissions can be configured via `/permissions` or declared in `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Bash(git status*)", "Bash(git diff*)", "Bash(rg *)"],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(rm -rf *)"
    ]
  }
}
```

These rules are enforced by the Claude Code execution runtime. In other words, writing "please never read `.env`" in a prompt is merely a polite suggestion; only a `deny` rule guarantees that the runtime blocks the operation.

Auto Mode's classifier also factors in conversational boundaries, but this is not a hard cryptographic guarantee. Inviolable constraints must be encoded in `permissions.deny` or enforced before tool execution using Hooks. Furthermore, when long sessions undergo context compression, temporary conversational instructions can easily be summarized away.

### Auto Mode

If frequent confirmation dialogs disrupt your flow, consider Auto Mode.

In current official documentation, the CLI toggles permission modes via `Shift+Tab`. The `auto` mode only appears in the mode cycle when your account tier, model, provider, and organizational settings permit it. In Team/Enterprise environments, administrators can explicitly enable or lock this feature.

Auto Mode uses an auxiliary classifier to assess operational risk, automatically approving low-risk operations. Actions such as downloading and executing unvetted scripts, transmitting sensitive data to external endpoints, production deployments, force pushes, or direct pushes to `main` are automatically blocked or escalated for human approval.

However, Auto Mode is not a security sandbox and does not guarantee zero false negatives. Its goal is to minimize repetitive confirmation prompts, not to isolate filesystems, networks, or credentials. High-stakes tasks still require container isolation, ephemeral credentials, least privilege, deny rules, Hooks, and human review.

If you wish to make Auto Mode your default, avoid setting `"defaultMode": "auto"` in project-level `.claude/settings.json` or `.claude/settings.local.json`. Versions v2.1.142+ deliberately ignore `auto` declared in repository files to prevent untrusted repos from granting themselves autonomous execution. Place it instead in user-level `~/.claude/settings.json` or organization managed settings. Providers like Bedrock, Vertex AI, and Microsoft Foundry may also require `CLAUDE_CODE_ENABLE_AUTO_MODE=1`.

Do not hardcode startup flags indiscriminately. Support for permission modes varies across versions, package managers, and providers; check `claude --help` or official docs to confirm valid flags. During interactive work, I prefer cycling modes with `Shift+Tab` over embedding elevated flags in scripts.

I strongly discourage using `--dangerously-skip-permissions` in daily work. Unless your environment has isolated filesystems, networks, and secrets completely, a single hallucinated command could alter unintended files or expose sensitive credentials.

## Security Boundaries

Never expose production credentials, database passwords, or long-lived cloud tokens directly to Claude. Never grant direct access to production environments without formal change management, multi-person approvals, and audit trails.

Lock down Git operations. Never permit default pushes to `main`, and never make remote force-pushes a routine capability. Never run arbitrary remote scripts—especially `curl | bash` patterns—outside disposable sandboxes.

Restrict file read scopes rigorously. Directories containing `.env`, `secrets/`, certificates, SSH keys, database dumps, and production logs must never be accessible to Claude by default.

This extends beyond `.env`. Paths like `~/.aws/`, `~/.gcp/`, `~/.kube/`, `~/.ssh/`, Maven `settings.xml`, npm tokens, and production logs should never be exposed. If you must have Claude inspect logs, sanitize, truncate, and isolate the snippets first.

When high-privilege automated tasks are unavoidable, run them inside containers with ephemeral tokens and least-privilege accounts. If a command goes awry, the blast radius remains strictly contained.

## Differentiating MCP, Skills, Sub-Agents, and Plugins

Claude Code has a rich ecosystem of extensions that can easily confuse newcomers. Here is how I delineate them:

| Mechanism | Problem It Solves | Best Used For | Not Suited For |
| --- | --- | --- | --- |
| `CLAUDE.md` | Persistent baseline context needed in every session | Build commands, directory conventions, team rules | Multi-step task execution workflows |
| Rules | Path-scoped localized rules | Frontend rules, backend rules, security invariants | Universal core conventions needed project-wide |
| Skills | Reusable multi-step workflows | TDD, Code Review, technical writing, UI implementation | Permanent background knowledge |
| MCP | Connecting to external systems | GitHub, Sentry, Notion, Figma, databases | Local plain file rules |
| Sub-Agent | Context isolation for side investigations | Code search, dedicated audits, parallel research | Tiny, single-file trivial edits |
| Hooks | Guaranteed deterministic execution | Blocking dangerous commands, auto-formatting, pre-exit tests | Advisory hints or guidelines |
| Plugins | Bundled distribution of extensions | Curated packages of Skills, MCP, Hooks, and scripts | Unvetted third-party bundles with broad permissions |

For example, writing "run formatter after every edit" in `CLAUDE.md` merely reminds Claude to try to remember; configuring it as a Hook guarantees it triggers after every file edit. Similarly, multi-step procedures for fixing GitHub issues will pollute all conversations if placed in `CLAUDE.md`, making them far better suited as a Skill.

### Code Intelligence: Avoiding Raw Full-Text Search

If your project supports Code Intelligence, configure it. It connects Claude to a Language Server Protocol (LSP) backend: inspecting type errors, jumping to symbol definitions, and tracing references without forcing Claude to grep through dozens of files blindly.

In a Java or TypeScript codebase, when Claude needs to know where a class is defined or where a method is invoked, it doesn't need to grep keywords across the entire project and open files one by one. With LSP, it jumps directly to the definition, views call hierarchies, and catches type errors immediately upon editing.

While it does not replace full-text search entirely, it drastically reduces unnecessary file reads. In large codebases, this keeps the context clean and prevents Claude from getting distracted by candidate search hits. Anthropic explicitly recommends Code Intelligence plugins for typed languages because a single symbol jump often replaces a broad search and several file reads.

Keep in mind that Code Intelligence plugins are not self-contained magic: they require the corresponding language server binary installed on your host machine (e.g., `jdtls` for Java, `typescript-language-server` for TypeScript). If you see `Executable not found in $PATH` in `/plugin`'s Errors tab, the system binary is missing.

### MCP: Connecting Claude to the Real World

MCP (Model Context Protocol) governs connections to external systems. An external system exposes an MCP Server; when an MCP client like Claude Code connects, it discovers and invokes the exposed tools.

![MCP diagram](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

This is the primary way Claude Code interacts with external tools: querying databases, reading Sentry errors, controlling headless browsers, fetching Notion documents, or inspecting Figma designs.

Adding a remote MCP server looks something like this:

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp \
  --header "Authorization: Bearer your-token"
```

Here, `your-token` is illustrative. Never write raw tokens directly into your shell history in production.

In team repositories, shareable MCP configurations should be placed in `.mcp.json` and committed to Git. For instance, if a project integrates Notion, Sentry, and internal doc portals, commit the server names, URLs, and transport types as shared project infrastructure.

Never commit configurations containing tokens, secrets, or database connection strings to `.mcp.json`. Place secrets in user-level settings, local environment variables, a secrets manager, or authenticate via OAuth flows supported by the server.

Exercise restraint with MCP servers. The more tools exposed, the higher the likelihood Claude picks the wrong tool, and the harder auditing becomes. Use `/mcp` to inspect connection statuses and toggle servers; use `/usage` to view cost and token breakdowns across skills, subagents, plugins, and MCP servers. Disconnect rarely used servers promptly.

### Skills: Codifying Reusable Procedures

Keep rule files and Skills distinctly separated.

Rule files hold persistent invariants: tech stack versions, startup commands, folder structures, error code formats, and forbidden paths.

Skills hold actionable workflows: performing code reviews, writing tests, implementing frontend pages, researching the web, or drafting technical articles. Because these tasks follow identical steps every time, there's no need to restate them in chat prompts repeatedly.

A Skill is an on-demand instruction playbook. How to tackle a specific task, what constraints apply, what checklist to run through, and what pitfalls to avoid are documented in `SKILL.md`.

A key distinction between Skills and `CLAUDE.md` is the loading lifecycle. By default, Claude only sees the Skill's name and description, which it uses to decide whether invocation is warranted; only when invoked do the full `SKILL.md` body and bundled resources load into context. User-level Skills live in `~/.claude/skills/`, while project-level Skills live in `.claude/skills/`.

Note a recent structural evolution: custom commands in Claude Code have merged into Skills. Both `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` can create commands like `/deploy`. While the legacy `.claude/commands/` directory remains supported, organizing new workflows as Skills is recommended.

![Agent execution flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

Highly repeatable processes should be codified into Skills: running TDD before writing features (failing test first, then implementation); checking security, transactions, performance, and edge cases during code review; verifying source citations, headers, and AI phrasing when drafting documentation.

This is far more reliable than pasting a giant checklist into every prompt. Anthropic defines a Skill similarly: a reusable bundle of instructions, scripts, and resources that enables Claude to execute specific task types through consistent steps.

Off-the-shelf Skills are also available—for instance, Superpowers packages TDD, Code Review, Spec-Driven Development, Git Worktree isolation, and subagent orchestration into ready-made skills.

Never run third-party Skills blindly. A `SKILL.md` is executable prompt instruction; if it includes dangerous commands, suspicious scripts, or excessive permissions, the agent will execute them. Always review the text, `scripts/`, and `references/` before installing.

### Plugins: Explore the Official Marketplace First

If you don't want to wire up Skills, MCP, and Hooks from scratch, explore Claude Code's official plugin marketplace at [`claude-plugins-official`](https://github.com/anthropics/claude-plugins-official).

Installation is straightforward:

```bash
/plugin install <name>@claude-plugins-official
```

Plugins save setup time by packaging Skills, MCP Servers, Hooks, and helper scripts together.

However, plugins ultimately execute locally on your machine, and some touch filesystems, browsers, GitHub, databases, or third-party services. Always inspect their documentation, permissions, and source code before installing, and uninstall unused plugins to reduce tool clutter. Refer to the official [Discover plugins](https://code.claude.com/docs/en/discover-plugins) documentation for discovery and usage instructions.

### Sub-Agents: Keeping the Main Context Clean

I use Sub-Agents extensively.

![Claude Code Sub-Agent: keeping main conversation clean](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

When debugging complex issues, Claude often needs to inspect dozens of files, run extensive searches, and execute multiple terminal commands. The main session quickly becomes congested with logs, search results, and file dumps, leading to context drift when it returns to writing code.

Offload these exploratory side quests to a Sub-Agent. It possesses an isolated context window to read files, search logs, and analyze problems independently, reporting only its distilled findings back to the main conversation.

Among Claude Code's built-in subagents, the most common are Explore, Plan, and general-purpose. All inherit parent permissions while applying specific tool constraints:

| Subagent | Model | Tools / Permissions | Purpose |
| --- | --- | --- | --- |
| **Explore** | Haiku, optimized for low latency | Read-only; no Write / Edit | File discovery, code searching, repo exploration |
| **Plan** | Inherits main model | Read-only; no Write / Edit | Codebase research during Plan Mode |
| **general-purpose** | Inherits main model | Inherits parent tools; bound by permissions | Complex research, multi-step actions, code editing |

Explore and Plan focus purely on read-only research without modifying code directly. An important nuance in official documentation: Explore and Plan skip loading `CLAUDE.md` and the parent session's git status, making them lightweight and fast for search and context gathering; other built-in and custom subagents load these by default.

The general-purpose subagent has a broader mandate, capable of exploring, running commands, and modifying code. Before dispatching it, clearly define which directories are readable, which files are off-limits, whether writes are permitted, and whether you want only conclusions or full implementation. Hard constraints must be enforced via subagent `tools`/`disallowedTools`, permission modes, `permissions.deny`, or Hooks.

You can also create custom subagents. Project-level configurations reside in `.claude/agents/` for team sharing; user-level configurations live in `~/.claude/agents/` for personal cross-project reuse. Each subagent can define custom system prompts, tool permissions, models, and trigger conditions.

My common use cases include dispatching a subagent to run test suites and return only failing assertions and errors, or dispatching separate subagents to analyze auth, database, and API layers simultaneously before aggregating findings. In complex pipelines, a code-reviewer subagent can identify performance bottlenecks while an optimizer subagent attempts fixes.

Avoid spawning subagents for trivial tasks with fuzzy boundaries or rapidly changing code. Keep overall goals, architectural decisions, and acceptance verification in the primary session, delegating only well-bounded, self-contained investigations to subagents.

When working with Agent teams, view them as multi-session collaboration. Sub-Agents isolate exploratory side quests, while Agent teams coordinate independent sessions around a shared backlog. Start simple: master Worktrees, atomic commits, and iterative verification first.

Here is an example of a custom security reviewer subagent:

```markdown
---
name: security-reviewer
description: Reviews Java and Spring Boot code for security risks.
tools: Read, Grep, Glob, Bash
model: opus
---

Review the target diff for:

- SQL injection and unsafe dynamic queries.
- Authentication and authorization bypass.
- Secrets or credentials committed to code.
- Unsafe deserialization or command execution.

Return concrete file and line references. Do not rewrite code unless explicitly asked.
```

In real projects, restrict subagent tools as tightly as possible. If an agent only performs code review, omit `Edit` and `Write`. When both `tools` and `disallowedTools` are defined, `disallowedTools` takes precedence; if a tool appears in both, it will be excluded.

### Hooks: Enforcing Mandatory Rules

Hooks are often overlooked, but they are indispensable in production. They execute actions at key lifecycle events in Claude Code: before tool invocation, after file edits, before session completion, and before/after context compression.

Suppose Claude Code attempts to execute:

```bash
rm -rf /tmp/build
```

A `PreToolUse` Hook intercepts this Bash invocation first, evaluating whether it violates safety policies. If it matches a forbidden pattern, the Hook returns `deny`. Claude Code cancels the execution and feeds the rejection rationale back to Claude.

The following diagram from official documentation illustrates this interception pipeline:

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

I delegate several deterministic actions to Hooks: auto-formatting after edits, executing tests before session termination, barring edits to `migrations/` or `.github/workflows/`, intercepting `curl | bash` or `rm -rf`, preventing data exfiltration, or injecting extra context when Sub-Agents spawn.

Deterministic actions belong in Hooks; contextual background belongs in `CLAUDE.md`.

If you implement HTTP Hooks, beware of a subtle trap: you cannot block tool calls by returning HTTP 4xx or 5xx status codes. Non-2xx responses, connection drops, and timeouts are treated as non-blocking errors, allowing execution to proceed. To block a tool call, return HTTP 2xx with `decision: "block"` in the JSON payload, or `permissionDecision: "deny"` under `hookSpecificOutput`.

## Most Common Workflows

### Explore, Plan, Execute, Verify

Never ask Claude to write code immediately for complex tasks. First, instruct it to inspect the codebase without touching files:

```text
Enter plan mode. Read src/auth and related tests to understand the login session refresh flow.
Do not write or edit any code. Report only the current call chain, relevant files, and potential modification points.
```

Once it completes its review, ask for a structured plan:

```text
I need to fix the issue where token refresh fails after user session timeout.
Based on your reading, outline the files to modify, the testing strategy, and risk factors.
```

Review and confirm the plan before executing:

```text
Implement according to this plan. First write a failing test reproducing the bug, then update the implementation.
After completing, run the relevant tests and print the command and output.
```

This cadence may seem slower at first, but it prevents costly rework. Especially when working in an unfamiliar codebase or spanning multiple modules, forcing Claude to articulate call chains, risks, and test strategies upfront eliminates the frustration of discovering you built in the wrong direction.

Skip formal planning for minor edits. Fixing a typo, adding a log line, or inserting an obvious null check can be done directly. Over-planning trivial tasks wastes context.

### Test-Driven Development (TDD)

The biggest challenge with AI-generated code is that it excels at writing code that "looks plausible." TDD pins down expected behavior first, forcing the implementation to conform to the test assertions.

Keep the prompt straightforward:

```text
Do not modify the implementation yet. Write a failing test for TokenRefreshService,
covering the scenario where the session has expired but the refresh token remains valid.
Once the test fails, modify the implementation until the test passes.
```

If a test never failed in the first place, you cannot be confident the new implementation actually solved the problem. Otherwise, Claude might rewrite code indiscriminately and prematurely declare the issue resolved.

### Make Claude Verify Its Own Work

A core tenet from Anthropic's official best practices resonates deeply with me: **Give Claude an executable verification check—unit tests, builds, linters, screenshot comparisons, or script outputs.**

Avoid vague instructions like:

```text
Write an email validation function.
```

A concrete prompt eliminates ambiguity:

```text
Write an email validation function. Test cases:

- hello@gmail.com should pass
- hello@ should fail
- @domain.com should fail
- a@b.co should pass

Run the test suite after writing, and print the command and output.
```

The more concrete your acceptance criteria, the less likely Claude stops at "it looks finished."

For tasks that might iterate indefinitely, add a constraint: "Attempt at most 3 rounds; if still failing, stop and report the blockers," preventing excessive token burn in rabbit holes.

### Codebase Q&A

When onboarding to an unfamiliar codebase, use Claude Code as an interactive guide. Don't rush to modify files; interrogate the architecture first:

```text
What is the end-to-end call chain for user login? From HTTP request entry to session persistence,
list all involved classes and methods. Do not modify any files.
```

Or:

```text
Where is the order state machine defined in this project? How do transitions occur between states?
Point out any implicit constraints.
```

Always spot-check its conclusions. Cross-service calls, feature flags, and legacy backward-compatibility shims are prime candidates where Claude will construct a fluent explanation that inadvertently skips a branch.

### Bug Fixing Requires Raw Error Data

Never report bugs with a single vague sentence:

```text
Login is broken, please fix it.
```

This forces Claude into blind guessing. Providing raw error materials yields drastically better results:

```text
Below are the production error logs, reproduction steps, and request parameters.
Identify potential root causes first; do not modify code immediately.
Once the root cause is confirmed, write a reproducing test, then fix the implementation.
```

Stack traces, request logs, Slack threads, Docker outputs, and failing test runs are infinitely more valuable than paraphrasing "I think it's a caching issue." Paraphrasing biases Claude toward your assumptions.

### Multi-Instance Collaboration and Git Worktrees

Never force a single Claude session to do everything. Independent tasks should be split across concurrent sessions.

Claude Code natively supports Git Worktrees to isolate sessions:

```bash
claude --worktree feature-auth
claude --worktree bugfix-payment
```

`--worktree` creates an isolated worktree under `.claude/worktrees/<name>/` on a dedicated branch (typically `worktree-<name>`) and launches a session. If you prefer manual control, create worktrees natively with Git:

```bash
git worktree add ../project-auth -b feature-auth
cd ../project-auth
claude
```

Each worktree possesses its own directory and branch. One session can refactor authentication while another fixes payment bugs, completely eliminating file collisions. The Claude desktop app similarly creates worktrees for concurrent sessions.

![Claude Code Git Worktree](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-git-worktree-685b1929.png)

When running multiple background sessions, launch Agent View:

```bash
claude agents
```

Agent View consolidates background sessions into a unified dashboard, showing which are running, which await input, and which have finished.

A subtle pitfall: background sessions automatically isolate themselves into `.claude/worktrees/` before modifying files. If your project generates massive build artifacts or has path-sensitive pre-commit hooks, this repeated isolation overhead can become painful. In such cases, set `worktree.bgIsolation` to `"none"` in `.claude/settings.json` (requires v2.1.143+), allowing background sessions to edit the workspace directly. The trade-off is potential file collision across concurrent sessions.

If you use `.worktreeinclude` to copy ignored files like `.env`, `.env.local`, or `config/secrets.json` into new worktrees, ensure they contain only local development credentials. Worktrees isolate file changes, not credential exposure risks.

### Keep Commits and PRs Atomic

Never let Claude commit giant, sprawling diffs in one shot.

Decompose changes into small, atomic commits. Each commit should represent one logical change. Before committing, have Claude provide a diff summary, verification commands, and residual risks, and review `git diff --stat` and key file diffs yourself.

Claude drafts commit messages and PR descriptions rapidly, but never rely solely on its self-assessment. Its claim that "only auth logic was changed" is far less reliable than verifying the diff yourself. A great PR description needs only three elements: what changed, how it was verified, and what edge cases remain unhandled.

## Essential Commands

You don't need to memorize commands; typing `/` opens the menu. I group them into two mental buckets:

First, basic utilities: `/help` lists available commands in your current setup; `/diff` displays modified files and lines; when long sessions slow down or drift, inspect `/context`, and run `/compact` if space is exhausted; manage permissions via `/permissions`, check rule and memory paths via `/memory`, inspect MCP servers via `/mcp`, and review token breakdowns via `/usage`.

Second, bundled skills and workflows: `/code-review` scans current diffs for correctness bugs, edge conditions, and risks, accepting effort flags like `/code-review high`; `--comment` posts findings as inline GitHub PR comments; `--fix` applies review suggestions directly to the workspace.

`/simplify` is currently positioned as a cleanup-only review, targeting reuse, simplification, and efficiency while automatically applying fixes—it is not an exhaustive bug hunter. Commands evolve across releases; always refer to local `/help` and official docs if behaviors diverge.

`/batch` coordinates multi-module, decoupled initiatives by splitting requirements into units and spawning background Workers in isolated worktrees. `/loop` runs prompts on a recurring interval for polling CI or periodic housekeeping; when you need continuous execution until tests pass or migrations finish, use `/goal` with explicit acceptance criteria. `/run` boots the application to observe live behavior; `/verify` provides lightweight build and sanity checks.

A critical note on `/compact`: after compression, certain nested rules do not immediately reload. While root `CLAUDE.md` re-injects automatically, subdirectory rules wait until Claude accesses matching files again. After compacting a long session, ask Claude to restate its active objective, modified files, residual risks, and next verification steps before continuing.

## Crafting Effective Prompts

### Using English and Native Language Where Each Fits Best

For programming tasks, English is generally more precise. Technical libraries, error traces, API specs, and programming constructs (`modal`, `debounce`, `retry policy`, `transaction boundary`) are native to English, and translating them can introduce ambiguity.

However, business requirements, domain rules, and user-facing copy are best expressed in your team's native language. My standard pattern: write coding actions, technical constraints, and terminology in English; express business semantics, acceptance criteria, and UI copy in the native language.

### Constrain the Exploration Scope

Beware open-ended prompts like "Investigate this project." Claude will scour the entire repository, quickly saturating your context window.

Scope it down:

```text
Investigate only the src/payment and src/order directories.
The goal is to verify where inventory deduction is triggered after successful payment.
Do not modify any files. List only the call chain and involved classes.
```

Clear boundaries, specific goals, and explicit negative constraints dramatically narrow its search and edit footprint.

### Provide Gold-Standard Code Examples

When asking Claude to conform to project conventions, avoid saying "follow best practices"—this is too broad and often yields generic patterns alien to your repository.

Provide an existing exemplar file:

```text
Read UserController.java, UserService.java, and UserDTO.java.
Follow their layering structure, constructor injection, Result<T> response format, and exception handling.
Implement OrderController for order queries without introducing new response envelopes.
```

Existing codebase patterns carry far more normative weight than external "best practices." In legacy projects with historical idiosyncrasies, anchoring Claude to existing examples guarantees outputs match repository conventions.

### For Frontend, Never Just Say "Make It Look Good"

When requesting frontend implementations, never rely on adjectives like "modern, clean, sleek."

These empty descriptors almost invariably result in a generic template: Inter font, purple gradients, oversized rounded cards, and a landing-page aesthetic. Internal admin dashboards suffer the most, turning high-density operational tools into marketing pages.

Provide concrete design constraints:

```text
Use existing Ant Design components; do not introduce new UI libraries.
This is an internal operational tool: prioritize information density; avoid marketing-page styling.
Use project CSS variables for primary colors; do not add purple gradient backgrounds.
Mirror the filter bar and table layout from src/pages/UserList.tsx.
```

Codify design constraints into a Skill so Claude consults visual rules before writing UI code. For internal tools, information density, scannability, and clear operational feedback trump aesthetic flair every time.

## Common Failure Modes

The most common trap is running dirty, multi-topic sessions. Juggling requirements, debugging, refactoring, and deployments in a single conversation causes Claude to carry conversational momentum into unrelated tasks. Use `/clear` when switching tasks, or write a `HANDOFF.md` checkpoint.

The second trap is the corrective death spiral. If an error persists after 3 rounds of correction, stop haggling in the polluted context. Terminate the session, write a clean initial prompt with clear evidence, goals, and constraints, and start fresh.

Instruction bloat in `CLAUDE.md` is equally pervasive. When rules accumulate, compliance degrades. Prune self-evident facts and retain only constraints proven necessary by real mistakes.

Unbounded exploration is another hazard. Asking Claude to "look into the project" reads hundreds of files, exhausting context. Constrain directories and goals, or delegate to a Sub-Agent.

Green tests do not guarantee correct behavior. Require evidence, inspect diffs against `main`, check logs, and run manual sanity checks.

Excessive permissions are the most dangerous. Bypassing confirmations to save clicks makes diagnosing accidental modifications agonizing. Enforce tiered allow/deny rules, Auto Mode, container isolation, and ephemeral credentials.

## Summary

When starting out, it is easy to focus solely on "getting Claude to generate more code." Over time, you realize that reliable outcomes depend on sound engineering hygiene: defining project boundaries in `CLAUDE.md`, planning complex tasks before executing, verifying after edits, isolating deep research in Sub-Agents, using Worktrees for concurrency, and maintaining strict permission boundaries.

In production, start with a single directory, a single module, and a verifiable task pipeline. Enable Claude to succeed consistently within a small scope, then scale task complexity gradually.
