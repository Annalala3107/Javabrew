---
title: "Practical Tips for Vibe Coding: Git, Spec, Context Management, and Multi-Agent Collaboration"
description: "Combining Spec, Skills, context management, Git version control, multi-model division of labor, test verification, code review, and multi-agent collaboration to organize more controllable Vibe Coding practices in real-world projects."
category: AI Coding Practices
tag:
  - Vibe Coding
  - AI Coding
  - Claude Code
  - Codex
lang: en
sourceRef: zh-ref/ai-coding/practices/the-cool-tricks-for-vibe-coding.md
head:
  - - meta
    - name: keywords
      content: Vibe Coding,AI coding tips,Agent Skills,Claude Code,Codex,Spec Coding,Git version control,AI code review,multi-model collaboration
---

Hello, I'm Xiao G. Last weekend, I shared a few quick tips on Vibe Coding via text messages. This article fleshes out the details that weren't expanded upon back then, while also summarizing the pitfalls I've encountered over the past few years of real-world AI coding.

![Reader comments on Vibe Coding tips sharing](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/vibe-coding-practices-comments-e123b185.png)

Before diving into the main text, let me ask everyone: Do you still remember how you felt during your first Vibe Coding session?

I was completely hooked. In 2024, when I first tried Cursor, it blew my mind. It felt just like playing video games as a kid, yet even more exhilarating. The happiest thing every day was Vibe Coding—watching lines of code generated automatically. It felt as though I was accomplishing more in a single day than I used to in an entire week.

During that stretch, I didn't even want to touch games; my only thought was how much more work AI could take off my plate.

However, after that initial high, things went off the rails more and more frequently, and baffling issues began cropping up all the time. This made me realize that relying purely on intuition to Vibe Code simply isn't viable long-term.

Below are hard-won lessons Xiao G stepped into over years of AI coding. Nothing fancy, but all very practical.

## Get Git Ready First

If I could only choose one single most important Vibe Coding technique, I would pick Git without hesitation.

The reason is simple: an AI writing one wrong line of code isn't terrifying; what's terrifying is when it modifies 20 files in one breath, and by the time you realize it headed in the wrong direction, you no longer know what should be kept and what should be discarded. Git is not a ritual you patch in after code is written; it should stand guard before AI touches anything.

Before letting an Agent modify code, inspect the working directory first:

```bash
git status --short
```

If there are already uncommitted changes in the current directory, figure out whose changes they are and whether they should be kept. This step is especially crucial during multi-person collaboration or when multiple Agents run concurrently. Never let an AI roll back things it didn't write, nor mix someone else's half-baked code into your own task.

Once you confirm the working tree is clean, create a separate branch for the current task:

```bash
git switch -c feat/order-export
```

Even for very small tasks, creating a branch is recommended. Naked Vibe Coding directly on the main branch increases psychological burden over time; with branch isolation, even if AI writes code completely sideways, the damage is confined to that specific task branch.

After AI finishes modifications, don't rush to read its summary. Look at what the repository itself says first:

```bash
git diff --stat
git diff
```

Use `git diff --stat` to check the blast radius, and `git diff` to inspect the details. Once verified, stage and commit in logical chunks:

```bash
git add -p
git commit -m "feat: add order export"
```

One commit should do one thing. Stage and commit in chunks whenever possible—this makes subsequent code reviews, rollbacks, and bug isolation much lighter. AI claiming "I only changed the export logic" is never as trustworthy as `git diff`.

When things break, stick to controlled rollbacks whenever possible:

```bash
# Discard modifications to a specific uncommitted file
git restore path/to/file

# Unstage an already staged file
git restore --staged path/to/file

# If already committed and pushed, prefer generating a revert commit
git revert <commit>
```

`git reset --hard` isn't forbidden magic, but don't casually hand it over to an Agent. Unless the current branch is an expendable throwaway experiment, it can easily wipe out uncommitted changes you intended to keep.

Parallel tasks can be isolated using `git worktree`:

```bash
git worktree add ../project-order-export -b feat/order-export
git worktree add ../project-refactor-user -b feat/refactor-user
```

One Agent gets one directory, one branch, and one task. That way, even if they make a mess, the chaos remains isolated within their own workspace.

![Claude Code Git Worktree](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-git-worktree-685b1929.png)

## Narrow the Scope Before Starting

Whatever you need the AI to do, describe it as concretely as possible—never leave it guessing.

Take an order management scenario as an example. If you say: "Help me implement the order export feature."

That sentence is far too broad. AI doesn't know how many records to export per batch, what file format to output, which fields to include, or what the field ordering should be.

When information is insufficient, it will guess. The guessed outcome will run, but it might not be what you actually want.

Instead, spending a few minutes writing a lightweight Spec before starting is usually far cheaper than reworking later:

```markdown
## Objective

Implement an order export endpoint supporting CSV export by time range.

## Constraints

- Maximum 5,000 records per export
- Time range must not exceed 31 days
- Can only export data belonging to the current tenant
- Query must utilize `order_tenant_time_idx`
- If export fails, record failure reason; do not just return "unknown error"

## Acceptance Criteria

- Successfully export CSV with fields ordered: order_no, amount, status, created_at
- Return an explicit error when records exceed 5,000
- Unauthorized tenant data cannot be exported
- Unit tests cover 4 scenarios: empty data, unauthorized access, exceeding count limit, exceeding time range
```

This document doesn't need to look like an exhaustive design review paper.

![Spec Coding 4-Step Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

For small tasks, clearly writing objectives, constraints, and acceptance criteria is enough; for medium tasks, add interface formats, error codes, and table schemas; for larger requirements, break down into `requirements.md`, `design.md`, and `tasks.md`. There is no need to maximize the process right out of the gate; otherwise, you'll be deterred by document overhead before you even start coding.

For a detailed walkthrough of Spec Coding, refer to: [Spec Coding in Practice: From Vibe Coding to AI Code Specifications](https://javaguide.cn/ai-coding/practices/spec-coding.html).

There is another trick even more effective than abstract specs: show AI well-written code already in the project.

```text
First, read UserController, UserService, UserRepository, and their corresponding tests. Reference their layering structure, exception handling, response wrappers, logging style, and test writing patterns. Then implement OrderExportController.

Do not introduce new response formats.
Do not add new global exception handlers.
Do not bypass existing permission validation logic.
```

Phrases like "code should be elegant, maintainable, and adhere to best practices" look conscientious in a prompt, but have virtually zero binding constraint in practice.

Models are far better at mimicking concrete examples. When you point it to code in the repository that already meets standards, it is far more likely to produce output matching that identical style.

## Document Project Pitfalls in Rules Files

For long-term projects, place these rules where AI tools can reliably read them, such as:

- Claude Code: `CLAUDE.md`
- Codex: `AGENTS.md`
- Cursor: Project Rules, `.cursor/rules/*.mdc`, optionally combined with `AGENTS.md`
- GitHub Copilot / VS Code: Repo-level `.github/copilot-instructions.md`, path-level `.github/instructions/*.instructions.md`, also supporting `AGENTS.md`

Whatever you do, do not write a generic project manual! Write the rules that Claude easily misinterprets, that cannot be inferred from code, and that the team strictly adheres to. Focus on tech stack versions, frequent commands, architectural trade-offs, team conventions, and project traps; do not stuff in platitudes, default behaviors, or voluminous documentation.

The evaluation criterion is simple: If this line is deleted, is Claude more likely to make a mistake?

![CLAUDE.md and AGENTS.md in a multi-agent stock analysis project](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Whenever AI repeats a mistake, don't merely scold it in the chat window.

Chat logs disperse, while rules files follow the repository. When you patch traps into rules, it becomes far more likely to bypass them next time.

## Leverage Skills to Solidify Routine Playbooks

Rules files and Skills solve different problems.

Rules files are better suited for what the project must *always* follow: tech stack versions, startup commands, directory structure, error code formats, files that must not be touched.

Skills are better suited for *how* to execute a specific category of tasks when encountered. For instance, code review, test authoring, frontend page modification, web research, or technical writing—these tasks follow similar workflows each time, so there is no need to re-prompt them from scratch in chat every single run.

Xiao G previously wrote two related articles: [What Are Agent Skills? How Do They Differ from Prompts and MCP?](https://javaguide.cn/ai/agent/skills.html) and [AI Coding Skills Selection Checklist](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html).

Simply put, a Skill is an on-demand task instruction loadable by an Agent. It is not a plugin, nor is it an MCP tool itself; rather, it documents workflows, constraints, checklist items, and pitfall experiences for a specific task category inside a `SKILL.md` file.

![Agent Execution Link](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

For example, these tasks are prime candidates to solidify into Skills:

- Enforcing TDD before implementing features: write failing tests first, then write implementation.
- Standardizing checks for security, transactions, performance, boundary conditions, and project conventions during code reviews.
- Standardizing checks for responsiveness, hover states, accessibility, and design system compliance when modifying frontend pages.
- Enforcing the sequence of search, scraping, and browser automation tools during web research.
- Checking factual sources, citations, heading hierarchy, and AI-flavored tone during technical writing.

**Why use Skills?** Because reminding AI of these processes via chat every time is tedious. Remind it to write tests first today, and it will forget in a new session tomorrow; ask it to review permission risks this time, and it might only look at naming and formatting next time. That is the core value of Skills: turning repetitive prompts into reusable standard operating procedures.

However, do not write a Skill like a README.

A README is written for humans—it can discuss background, principles, and installation steps. A Skill is written for an Agent executing a task; its core focus is: when to use, in what order to execute, when NOT to use, and how to recover from failure.

The longer the text, the more context window it consumes. When drafting a Skill, ask yourself: Does this sentence directly influence what the Agent does next? If not, leave it out.

Anthropic recommends keeping `SKILL.md` body content under 500 lines; if it exceeds this length, break details out into separate files and use progressive disclosure so the Agent loads them only on demand.

![Keep SKILL.md content under 500 lines for best practices](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

Off-the-shelf Skills can also be used directly; for instance, Superpowers packages workflows like TDD, Code Review, Spec-Driven Development, Git Worktree, and subagent collaboration.

I have detailed recommendations in [AI Coding Skills Selection Checklist: Requirements Clarification, TDD, Code Review, and UI Design](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html).

However, never run third-party Skills blindly without inspection. `SKILL.md` contains instructions too; if it carries dangerous commands, suspicious scripts, or overly broad permissions, the Agent will faithfully execute them. Before installing, inspect the body text, `scripts/`, and `references/` to ensure no unauthorized operations exist.

## Don't Use Expensive Models for Bricklaying

Don't delegate everything to the most expensive model.

That is like hiring a senior architect and having him rename fields, write getters, and adjust CSS all day—you burn through cash without unlocking true value. Conversely, skimping on costs by tossing system design, security boundaries, and complex refactorings entirely to cheaper models will likely result in far higher rework expenses.

What Xiao G uses more frequently is: "Strong reasoning models clarify direction, low-cost models handle well-bounded tasks, and an independent model verifies at the end."

```text
Step 1: Have a model with strong reasoning and code review capabilities read requirements and the codebase.
Only let it design solutions, list risks, and break down tasks—do not rush it to write code.

Step 2: Once the plan is confirmed, hand individual Tasks over to an implementation model with suitable latency and cost.
Let it code per task, supplement tests, and run commands, outputting a diff summary when finished.

Step 3: Hand the git diff to an independent review model.
This time, let it review only: bugs, unauthorized access risks, transaction boundaries, performance bottlenecks, and test gaps.
```

Specific models evolve rapidly. As of 2026-07-24, selectable model families include Claude Fable 5, GPT-5.6, DeepSeek V4, GLM-5.2, MiniMax M3, and Kimi K3. This list reflects a point-in-time snapshot, not a fixed formula; actual selection depends on account availability, benchmark testing, pricing, context window limits, and tool compatibility.

Code audits can follow the same playbook. Have a cheaper model scan the project first to surface suspected issues; then have a stronger model verify whether those issues are legitimate. Letting high-cost models scan the entire codebase end-to-end is certainly possible, but money burns fast and returns may not be proportional.

![DeepSeek V4 Benchmark Data](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-benchmark-7b6548e4.png)

## Don't Just Take Its Word That It's Fixed—Look at Evidence

AI loves saying "Fixed," "Optimized," and "Looks good."

Take it with a grain of salt—never accept it blindly.

Xiao G prefers looking at three things: tests, command outputs, and diffs.

For example, when asking it to fix an order export bug, don't merely ask "Is it fixed?". Instruct it explicitly like this:

```text
Do not modify the implementation yet.
First add tests based on the Spec, covering happy path, invalid parameters, insufficient permissions, empty data, and concurrent duplicate requests.
The tests should fail initially.
After I confirm the tests are reasonable, modify the implementation until the tests pass.
```

This resembles TDD, but doesn't need to be dogmatic. The key is avoiding the scenario where AI modifies code and retrofits a test that is guaranteed to pass unconditionally. Making tests fail first, and then watching implementation turn them green, brings far greater confidence.

If you don't want full TDD, at least make it enumerate acceptance checklist items:

```markdown
- [ ] New endpoint includes permission checks
- [ ] Error responses follow unified format
- [ ] Database queries hit specified indexes
- [ ] Null values, out-of-bounds, and duplicate requests have tests
- [ ] Logs do not print tokens, passwords, or API keys
- [ ] All tests pass
```

Also require it to paste executed commands and outputs:

```bash
mvn test
npm test
go test ./...
pnpm lint
```

If not run, write "Not run" along with the reason. Uninstalled dependencies, unstarted databases, or missing test configs are all acceptable; the worst scenario is leaving tests unrun while glossing over with "Verified".

Performance optimizations especially cannot rely on claims alone. When it says "significant speedup," demand proof: SQL before and after optimization, `EXPLAIN` plans, test dataset size, P95/P99 latency, or endpoint execution times. Without real benchmark results, only document expected gains and pending verification items—never let it fabricate numbers.

## Don't Let Context Degrade Into a Mess

Xiao G previously wrote an article on [Context Engineering](https://javaguide.cn/ai/agent/context-engineering.html), in which a key takeaway applies equally to Vibe Coding: **A larger context window does not equal better output—the window can hold more stuff, but whether the model can consistently identify the focus is an entirely different matter.**

![Why context fails](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

If a single session implements login, then tweaks payments, then refactors cache, and finally asks why tests failed, the model will inevitably conflate obsolete constraints, failed attempts, and discarded designs. You think you gave it complete history, but what it actually received is a pile of noise.

In Vibe Coding, context management boils down to three things.

**First, don't dump the whole repository in.** The current task only requires the Spec, relevant files, error logs, acceptance commands, and a few reference implementations. Other contents should be linked via paths, filenames, and directory trees, loaded by the Agent only when necessary. Claude Code uses this exact strategy when analyzing large repos: pinpoint via search and directory listing first, then progressively inspect specific files, rather than swallowing the entire codebase upfront.

**Second, compact long-running tasks promptly.** In Claude Code, use `/compact` to condense context, and `/clear` to wipe it clean (refer to [Claude Code Core Commands Explained](https://javaguide.cn/ai-coding/practices/claudecode-commands.html) for details); Codex and other Agents possess similar summarization, compaction, and restart mechanisms. Compaction preserves key takeaways (e.g., architecture decisions, modified files, unresolved bugs, failed commands, and next tasks) while dropping repetitive chatter and already-digested tool outputs.

**Third, persist critical progress into files.** For instance, have the Agent maintain a `NOTES.md` or task handoff during long tasks, recording:

```markdown
## Completed

- Which files were modified
- Which tests have been executed
- Which issues have been confirmed as non-bugs

## Remaining Tasks

- Failing test cases yet to be fixed
- Boundary conditions yet to be confirmed
- Which files the next Agent should read first
```

This way, even when opening a fresh session, you don't need to spend ages re-explaining context. Chat logs grow long, messy, and stale, whereas structured notes remain stable.

Xiao G's habit: one session handles only one task; if more than two corrections fail to get things on track, open a fresh session; the new session carries only the current Spec, relevant files, failure logs, acceptance commands, and the previous handoff. There is no universal threshold for context packet size; the governing rule is whether the model can reliably pinpoint constraints, accomplish the task, and pass acceptance. Start from the minimum necessary material, supplementing only when needed.

A context packet can be very simple:

```markdown
## Current Task

Implement order export endpoint.

## Required Reading Files

- src/main/java/.../UserController.java
- src/main/java/.../OrderRepository.java
- docs/spec/order-export.md

## Strictly Forbidden Modifications

- Existing database column names
- Global exception response format
- Authentication logic

## Acceptance Commands

- mvn test
- mvn -Dtest=OrderExportServiceTest test
```

Documentation can also serve as context. After AI modifies multiple modules, have it generate a changelog: what endpoints were added, which tables or indexes were touched, key business rules, verification steps, and rollback instructions. This can then be directly fed to AI when continuing development next time.

In legacy-heavy projects, unmodifiable fields, endpoints backward-compatible with legacy clients, and enum values hardcoded by external systems—all these orally transmitted rules belong in documentation.

## Multi-Agent: Serial First, Parallel Later

Multi-agent collaborative division of labor is indeed appealing, but I genuinely advise against attempting multi-agent parallelism right out of the gate (e.g., one writes code, one writes tests, one conducts reviews, one drafts docs)—it easily throws the project into disarray.

Start with serial execution:

1. Plan Agent reads code only, outputting technical plans and task breakdowns;
2. Code Agent handles a single Task only, touching no other tasks;
3. Test Agent supplements tests and runs verification;
4. Review Agent inspects diffs and uncovers issues only, without directly making major edits.

Never let multiple Agents modify code simultaneously at the beginning. Have them commit sequentially on the same feature branch:

```bash
git commit -m "[plan] add order export design"
git commit -m "[code] implement order export api"
git commit -m "[test] add order export tests"
git commit -m "[review] fix tenant permission check"
```

Once the process runs smoothly and you've grown proficient, then consider **worktree parallelism and [Agent View](https://javaguide.cn/ai-coding/practices/claudecode-agentview.html)** patterns.

![Multi-agent parallel sessions](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/multi-agent-parallel-sessions-c335f852.png)

![Claude Code Agent View](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-20260518102539932-7c769093.png)

The most frightening aspect of parallelism isn't Git conflicts—those are at least visible. The real headache is when there are *no* conflicts: two Agents modify the same shared DTO concurrently; one adds fields for export, while the other deletes fields for querying. Merging looks clean, but interface semantics, serialization output, and frontend dependencies may have already silently broken.

Therefore, multi-agent workflows cannot rely on luck; they must be governed by task boundaries, branch isolation, and acceptance criteria. Which files can be modified, which modules are untouchable, which tests must be run after changes, and which diffs require human review must all be specified upfront.

## Subagents Are Well-Suited for Dedicated Tasks

This is also a good place to touch upon subagents.

Taking Claude Code as an example, a subagent can be understood as a "mini-assistant dedicated to a specific type of task." It has its own context, system prompt, and tool permissions, making it ideal for handling well-bounded tasks such as code reviews, test additions, log analysis, and documentation organization. Official documentation also notes that subagents can run in isolated contexts, reducing context pressure on the primary session, while allowing different tool access permissions tailored to different tasks.

![Claude Code Sub-Agent: Keeping Main Conversation Clean](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

This is distinct from the multi-agent parallelism mentioned earlier. Multi-agent leans toward collaborative organization, whereas subagents lean toward task delegation. For example, while the main session is implementing order export, you can delegate "check whether this diff contains permission bypass risks" to a Review subagent, and "supplement unit tests based on current code" to a Test subagent. Once they complete their work, they return their findings to the main session.

However, do not abuse subagents either. When tasks are too small, boundaries are blurry, or code is undergoing rapid churn, delegating out can actually increase communication overhead. A reliable pattern is: the primary Agent oversees overall context and decision-making, while subagents handle localized, explicit, verifiable tasks.

## Permission Control Is Paramount

AI coding cannot rely solely on writing a line in the prompt: "Please be careful and do not perform dangerous actions."

Tools like Claude Code no longer just answer questions; they read files, modify code, execute shell commands, and may invoke internal tools or external services via MCP. Risks are naturally no longer limited to code mistakes—more severe issues include accidentally deleting files, modifying configurations, running wrong migrations, pushing to remote repositories, or even exposing secrets, certificates, and production configurations.

Permissions must be reined in upfront.

Files like `.env.production`, secrets, and certificates should be inaccessible to AI reading or modification by default. Operations like file deletions, database migrations, remote pushes, and CI config edits must require manual confirmation. High-risk modules like login, payments, permissions, file uploads, and webhooks must undergo dedicated security reviews after modification.

Claude Code provides built-in permission mechanisms. For example, use `/permissions` to view and manage tool privileges. Permission rules configure `allow`, `ask`, and `deny`, denoting auto-execute, ask before executing, and direct denial, respectively. Low-risk commands like `git diff` and running unit tests can be granted leniently; operations like `git push`, file deletions, reading `.env`, and accessing `secrets/**` belong in `ask` or `deny`.

If permission rules alone feel insufficient, add Hooks and Sandboxes. Hooks execute custom checks before and after tool calls, such as intercepting hazardous commands, verifying whether sensitive paths were touched, and running formatters and tests before commits. Sandboxes provide execution environment isolation, restricting the filesystem and network scope accessible by Bash commands.

For example, suppose Claude Code attempts to execute:

```bash
rm -rf /tmp/build
```

The `PreToolUse` Hook intercepts this Bash invocation first, evaluating whether it is a hazardous command. If it triggers a rule, it returns `deny`; Claude Code cancels the tool call and feeds the denial reason back to Claude.

The diagram below illustrates this entire flow, sourced from Claude Code's official documentation on Hooks.

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

A more robust approach solidifies these rules into engineering workflows:

- Which commands can execute automatically;
- Which commands must require human confirmation;
- Which paths are prohibited from reading or modifying;
- Which MCP tools cannot be casually invoked;
- Which CI tasks require human approval;
- Which failing tests block merges.

Another easily overlooked point: permission rules are not silver bullets. Blocking `rm *` doesn't necessarily block variants like `/bin/rm` or `find -delete`. High-risk operations cannot rely solely on a single command blocklist; govern them holistically with path restrictions, Hooks, Sandboxes, CI pipelines, and manual review.

Engineering vigilance cannot be written in prompts—it must land in commands, scripts, permissions, tests, CI, and approval workflows.

## Sharing My Typical Workflow

When implementing requirements day-to-day, Xiao G typically follows this rhythm:

1. Create a new branch, confirming the working tree is clean.
2. Write a lightweight Spec clarifying objectives, constraints, and acceptance criteria.
3. Check if there are suitable Skills available, such as TDD, Code Review, frontend design, or web research.
4. Have a model with stronger capabilities formulate a technical plan first—discuss the approach without rushing to code.
5. Once the plan is confirmed, have a lower-cost model implement it step by step according to Tasks.
6. For each Task completed, run tests, review diffs, and commit in small steps.
7. Once the diff stabilizes, have an independent model perform a review.
8. Resolve legitimate issues raised in the review, and re-run tests.
9. Before merging, manually review critical diffs. When changes touch data schemas, permissions, payments, or scheduled jobs, supplement documentation, rollback procedures, or canary release notes.

This workflow is slightly slower than "generate code in one sentence."

However, the small amount of time spent here is usually earned back manifold later. At minimum, it drastically cuts down on rework, rollbacks, and online firefighting.

Short-term prototypes can vibe boldly—get things running first and worry later. But as long as code requires long-term maintenance, it must return to engineering discipline. GitHub Flow itself organizes collaboration around branches, pull requests, reviews, and merges, rather than having people shove code directly into main. Tools like Codex also support placing project-level rules in `AGENTS.md`, having AI act according to repo conventions rather than relying on ephemeral chat reminders every time.

Put plainly: the faster AI writes code, the less we can afford to discard battle-tested foundations like Git, tests, reviews, and Specs.

In the past, they were used to constrain humans; today, they conveniently constrain AI as well.
