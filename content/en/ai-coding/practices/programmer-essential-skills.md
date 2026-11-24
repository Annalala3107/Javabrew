---
title: "AI Coding Skills Selection Checklist: Requirements Clarification, TDD, Code Review, and UI Design"
description: "An organized selection checklist of AI coding Skills categorized by task scenario, covering requirements clarification, TDD, code review, UI design, React performance optimization, PostgreSQL, Claude API, and Skill development, along with guidance on which tools are best installed on demand."
category: AI Coding in Practice
lang: en
sourceRef: zh-ref/ai-coding/practices/programmer-essential-skills.md
head:
  - - meta
    - name: keywords
      content: AI coding,Skills,Superpowers,mattpocock,grilling,Claude Code,Cursor,code review,TDD,UI design,React,Next.js,PostgreSQL,Claude API,Skill development
---

Hello, I'm Xiao G. Recently, friends asked me: "Which Skills do you typically use every day? Could you share a list with the community?"

Of course! I started using Skills right when they first emerged, and later customized many Skills internally within our company; colleagues and friends who used them gave great feedback.

Logically, assembling a checklist should be fairly straightforward. Yet as I actually began organizing, I realized very few Skills truly made the cut. Moreover, in the process of compiling these Skills, I once again marveled at how blindingly fast technology evolves in the AI era—it's almost overwhelming!

Back when Skills first appeared, model capabilities weren't nearly as strong as they are today. Jumping straight to modifying code before understanding the repository, writing code without adding tests, or forgetting earlier requirements in long conversations were all common headaches.

Consequently, we crammed development workflows line-by-line into Skills: clarify requirements first, then break down the plan; write tests first, and review thoroughly after changes. The finer the rules, the safer we felt.

Yet models evolved at breakneck speed.

Today, assigning the same task to Codex or Claude Code sees them independently inspecting projects, tracing call chains, editing files, writing tests, and running validations in most cases. Many steps that previously required repeated reminders in `SKILL.md` have now become native baseline behaviors.

At this point, blindly stuffing an environment full of Skills is akin to handing a thick pile of operating manuals to someone who already knows how to do the job. Having to write plans, go through reviews, and execute full verification suites even for tiny edits ends up consuming all your time on ceremony, which becomes rather tedious.

Therefore, this checklist is deliberately restrained. The ones I am willing to keep today typically compensate for project conventions that models cannot guess, or package specialized workflows, scripts, templates, and reference materials. For Skills that merely remind the AI to "read code first, then modify, and run tests last," I basically no longer recommend them.

My previous in-depth guide [Comprehensive Guide to Agent Skills](https://javaguide.cn/ai/agent/skills.html) explains the differences between Skills, Prompts, and MCP; if you'd like to understand why I started pruning Skills, you can read my follow-up piece [In the Era of Strong Models, Do We Still Need to Install AI Coding Skills?](./skill-selection-and-pruning.md).

## Superpowers

Superpowers chains requirements clarification, planning, TDD, Git Worktrees, subagent collaboration, code review, and pre-completion verification into a unified development methodology. It is well-suited for unfamiliar codebases, complex features, and high-risk changes; for tweaking copy, adding a null check, or adjusting a validation rule, this workflow is typically far too heavy.

Superpowers invokes the following Skills in sequence:

| Skill | Primary Action |
| --- | --- |
| `brainstorming` | Clarify requirements, compare solutions, and record design before coding |
| `using-git-worktrees` | Create isolated workspaces and inspect test baselines |
| `writing-plans` | Break down designs into atomic tasks with file locations and verification steps |
| `subagent-driven-development` / `executing-plans` | Dispatch subagents or execute plans in batches |
| `test-driven-development` | Execute RED-GREEN-REFACTOR cycles |
| `requesting-code-review` | Review implementation graded by severity |
| `verification-before-completion` | Check hard evidence before declaring completion |
| `finishing-a-development-branch` | Verify tests and handle merges, PRs, or branch preservation |

This workflow is already adapted for Claude Code, Codex, Cursor, and OpenCode. The installation command for Claude Code plugin is:

```text
/plugin install superpowers@claude-plugins-official
```

In the Codex App, search for Superpowers under Plugins in the sidebar; in the Codex CLI, type `/plugins` to search and install. Installation methods are not interchangeable across different Agents, so each Agent requires separate installation when using multiple tools.

The Claude Code installation interface prompts you to choose the installation scope:

![Superpowers Download](/media/jg/ext/oss.javaguide.cn/javaguide/ai/superpowers/superpowers-download-61cbe482.png)

| Option | Scope | Recommendation |
| --- | --- | --- |
| Install for you | Active across all projects | Choose only after confirming you want to use the full workflow long term |
| Install for all collaborators | Shared with project members | Commit only after the team agrees to adopt the same methodology |
| Install for you, in this repo only | Active only in current repo | Recommended default for first-time use to evaluate if it slows down minor tasks |

I no longer advise beginners to install it globally right away. Run two or three real tasks in a single repository first to see whether requirements clarification, TDD, and code reviews genuinely cut down rework before deciding to expand its scope.

Repository: <https://github.com/obra/superpowers>

## mattpocock/skills

If you only want to reinforce a specific phase of your development workflow, check out [mattpocock/skills](https://github.com/mattpocock/skills). This project decomposes engineering experience into smaller, easily modifiable, composable Skills without forcing every task through the same monolithic pipeline.

Modules currently well-suited for programmers include:

| Skill | Best For |
| --- | --- |
| `grill-me` / `grilling` | Tenaciously cross-examining before coding to clarify requirements, decisions, and dependencies |
| `diagnosing-bugs` | Investigating bugs via reproduction, narrowing scope, hypothesizing, instrumenting, fixing, and regression testing |
| `tdd` | Developing features or fixing bugs using RED-GREEN-REFACTOR cycles |
| `code-review` | Inspecting code style and verifying implementation against original requirements separately |
| `to-spec` / `to-tickets` | Distilling discussions into specifications, then breaking them into dependency-linked tasks |
| `domain-modeling` | Unifying domain terminology and recording key decisions into `CONTEXT.md` and ADRs |

For cross-Agent installation, use:

```bash
npx skills@latest add mattpocock/skills
```

The installer will prompt you to select desired Skills and target Agents. Per the project's current installation instructions, check `/setup-matt-pocock-skills` and run it once in the target repo to configure Issue Tracker and document storage locations.

When using it for the first time, you don't need to install the whole suite. If requirements are often left vague, start with `grill-me` and `grilling`; if hard-to-locate bugs are frequent, supplement with `diagnosing-bugs`.

This collection suits developers who already have established habits and merely want to strengthen a few weak links. If a project already has stable requirement templates, TDD guidelines, and code review workflows, redundantly installing matching Skills brings little marginal value.

For practical usage and boundaries of these Skills, I wrote a dedicated article: [mattpocock/skills: The 4 AI Coding Skills I Recommend Most](https://javaguide.cn/ai-coding/practices/mattpocock-skills.html).

Repository: <https://github.com/mattpocock/skills>

## ECC (formerly Everything Claude Code)

Everything Claude Code has now been renamed to **ECC**.

The project has evolved from a Claude Code configuration set into a cross-Agent Harness system covering Codex, Claude Code, Cursor, OpenCode, and others.

The ECC repository hosts Skills, Agents, Hooks, Rules, along with memory management, security scanning, continuous learning, and multi-language engineering guidelines. Housing hundreds of Skills, it resembles a team-level Harness configuration library. When a team needs to standardize Agent operating modes, memory policies, and security checks, centralized management saves substantial repetitive setup.

![Context Rot](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

With more components comes higher selection cost. If your project only lacks code review or TDD, use ECC's selective installation to pull down only corresponding components—such as Java code review, context persistence, or security scanning—without stuffing the entire system into every repository.

Repository: <https://github.com/affaan-m/ECC>

## Doc Co-Authoring

Before developers write code, the step most easily underestimated is: explaining the requirements clearly.

When requirements are vague, AI coding Agents will charge forward enthusiastically, but not necessarily in the right direction. It might turn an unfinalized, unbounded concept directly into an implementation; the resulting code, tests, and documentation may look pristine, yet miss real needs by a wide margin.

**doc-coauthoring** from Anthropic's official Skills repository is crafted for exactly this situation. Its focus is concrete: breaking down the creation of PRDs, technical proposals, decision docs, and RFCs into a collaborative process that tackles context, structure, and reader comprehension first, leaving sentence polishing for last.

doc-coauthoring handles documents across three phases:

| Phase | What to Do |
| --- | --- |
| **Context Gathering** | Collect background, constraints, prior discussions, architecture dependencies, and stakeholder concerns |
| **Refinement & Structure** | Iterate section by section: question and brainstorm first, filter content, and draft readable paragraphs |
| **Reader Testing** | Test the draft with a fresh-context Claude instance to check for misunderstandings or omissions |

Take an order refund module as an example. Before a Coding Agent starts, use doc-coauthoring to organize a concise technical proposal, detailing the refund state machine, endpoint idempotency, inventory and coupon rollbacks, and manual fallback compensation item by item.

Once the document is finalized, small tasks can hand the technical solution and acceptance criteria directly to the Agent; when changes span multiple modules, chain in Superpowers to break down plans, write tests, and review code. Doing so resolves divergences during the documentation phase, avoiding scope rework after implementation is complete.

The installation command for Claude Code:

```bash
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

`example-skills` is a collection of sample Skills, of which doc-coauthoring is one. Installing this bundle also provides `skill-creator` mentioned later, avoiding duplicate installs.

Repository: <https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring>

## UI UX Pro Max

This is a specialized UI/UX design intelligence Skill designed specifically for AI programming Agents (Claude Code, Cursor, Windsurf, etc.).

![UI UX Pro Max](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/ui-ux-pro-max-skill-55c711eb.png)

It generates design systems based on product types and industry domains, handing color palettes, typography, layouts, animations, and anti-patterns over to Agents for implementation. Compared to lightweight Skills with only a few aesthetic prompts, it provides a searchable design dataset.

Key data provided in the current public release includes:

| Resource Type | Quantity | Description |
| --- | --- | --- |
| UI Styles | 84 | Glassmorphism, Neumorphism, Bento Grid, AI-Native UI, etc. |
| Product Categories & Palettes | 192 sets | Mapped to SaaS, finance, healthcare, e-commerce, etc. |
| Font Pairings | 74 sets | Includes Google Fonts combinations |
| Chart Types | 25 | Designed for dashboards and analytical pages |
| Reasoning Rules | 161 | Industry-specific design system generation |
| UX Guidelines | 98 | Covers anti-patterns, interactions, and accessibility |
| Supported Tech Stacks | 22 | React, Next.js, Vue, Nuxt, SwiftUI, Flutter, JavaFX, etc. |

For example, when prompted: "Help me build a landing page for a beauty SPA", it categorizes the page under health & wellness, applies a Soft UI direction, pairs pastel pink and sage green with gold accents, and selects Cormorant Garamond typography. The same output enumerates anti-patterns, such as avoiding generic purple-pink gradients.

Claude Code can install it from the plugin marketplace:

```text
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

For Codex, Cursor, and Windsurf, using the current official CLI is preferred. The package name is `ui-ux-pro-max-cli`; the legacy `uipro-cli` is no longer maintained:

```bash
npx ui-ux-pro-max-cli init --ai codex
npx ui-ux-pro-max-cli init --ai cursor
```

Its retrieval scripts rely on Python 3. Once installed, simply describe the page type and industry to trigger it:

```text
Build a landing page for a SaaS product
Design a healthcare analytics dashboard
Create a dark-themed financial mobile app
```

Delivery checks inspect icons, hover states, text contrast ratios, and `reduced-motion` compliance, including explicit rules like "do not use emojis as icons." Projects with existing design systems should use automated recommendations with caution, as newly generated palettes, fonts, and component rules might clash with existing brand guidelines. In such scenarios, authoring a project-level Skill embodying your team's established design tokens is far more suitable.

Repository: <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>

When a comprehensive design knowledge base is unnecessary, you can switch to Anthropic's official **frontend-design** Skill instead.

Current versions emphasize establishing a distinct visual direction first, then executing through typography, color, layout, motion, and craft, avoiding formulaic "AI template" aesthetics. It no longer imposes hard prohibitions against Inter, Roboto, or purple-white gradients; font and color choices should be driven by brand guidelines, content type, and existing design systems.

## Vercel React Best Practices

Having an Agent write a functional React page is no longer difficult. What is frequently overlooked are subtle performance issues: requests that could run in parallel written serially, clients inundated with massive unused payloads, components re-rendering unnecessarily due to poorly managed dependencies, or bloated bundles caused by carelessly imported packages.

Vercel's officially maintained **vercel-react-best-practices** targets these exact headaches. As of July 2026, it boasts approximately 570,000 cumulative installs on [skills.sh](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices), cataloging 70 React and Next.js performance rules classified into 8 categories by impact severity.

| Priority | Primary Focus |
| --- | --- |
| CRITICAL | Eliminate request waterfalls, control bundle sizes |
| HIGH | Server-side caching and request deduplication, parallel data fetching, minimize RSC serialization overhead |
| MEDIUM | Client-side request deduplication, dependency management, reduce wasteful re-renders, handle hydration pitfalls |
| LOW-MEDIUM | DOM batching, cache repetitive computations, optimize high-frequency lookups with Set or Map |

Each rule includes incorrect code, corrected code, and qualifying conditions. When building new pages, conducting performance audits, or refactoring React code, having an Agent inspect against these rules item-by-item is far more actionable than vague prompts like "help me optimize performance."

Installation command:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
```

This rule set applies strictly to React and Next.js projects; Vue, Svelte, or pure backend projects have no reason to install it. Performance optimization cannot rely on checklists alone—issues involving caching, serialization, and rendering must ultimately be verified via build artifacts, React Profiler, and real network traces.

Repository: <https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices>

## sanyuan-skills

`sanyuan-skills` currently bundles 6 independent Skills, selectable by directory during installation. If you only want an extra layer of code review before committing, install Code Review Expert without pulling in requirements clarification, TDD, or other workflows.

| Skill | Use Case |
| --- | --- |
| Code Review Expert | Review code across SOLID principles, security, performance, error handling, and boundaries |
| Sigma | Learn technical concepts via Socratic questioning |
| Skill Review | Audit Skill structure, description, workflow, and token efficiency |
| Skill Forge | Create new Skills |
| Wiki Ingest | Organize articles, documentation, or notes into cross-referenced Wikis |
| Book Study | Reading comprehension coaching, mastery quizzes, and spaced repetition |

Java developers can immediately benefit most from Code Review Expert. It provides a solid independent review layer prior to commits, but cannot substitute for project-specific rules. Transaction boundaries, error code conventions, logging fields, and backward compatibility must still reside in repository `AGENTS.md`, review guidelines, or test suites.

Each Skill can be installed individually:

```bash
npx skills add sanyuan0704/sanyuan-skills --skill code-review-expert
npx skills add sanyuan0704/sanyuan-skills --skill sigma
npx skills add sanyuan0704/sanyuan-skills --skill skill-review
npx skills add sanyuan0704/sanyuan-skills --skill skill-forge
```

After installation, invoke directly:

```text
/code-review-expert    # Review current git changes
/sigma <topic>         # Start learning tutorial, e.g., /sigma React Hooks
/skill-review          # Audit existing Skill
/skill-forge           # Scaffold a new Skill
```

Repository: <https://github.com/sanyuan0704/sanyuan-skills>

## Supabase Postgres Best Practices

**supabase-postgres-best-practices** is maintained officially by Supabase, centering around PostgreSQL, making it directly applicable to standard PostgreSQL projects. As of July 2026, it records approximately 300,000 cumulative installs on [skills.sh](https://skills.sh/supabase/agent-skills/supabase-postgres-best-practices).

It divides PostgreSQL rules into 8 categories: query performance, connection pooling, security & RLS, schema design, concurrency & locking, data access patterns, monitoring diagnostics, and advanced features. Each rule explains the root cause of an issue, providing problematic SQL, corrected SQL, `EXPLAIN` analysis, and performance metrics.

For example, when asking an Agent to review a query searching orders by user, status, and creation time, it checks composite index column ordering, index hit conditions, connection pool suitability, and potential lock contention on writes, rather than simply stating "add an index."

Installation command:

```bash
npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices
```

Java backend projects using PostgreSQL can directly employ it to audit SQL queries, table schemas, and database configurations. MySQL projects should not copy its RLS, indexing, or database configuration parameters directly. Creating indexes, altering columns, or tuning connection pools must still factor in data volume, `EXPLAIN ANALYZE`, and stress-test data; never let an Agent modify production databases directly.

Repository: <https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices>

## Claude API

The Claude API Skill targets AI application development. If you only use Coding Agents inside an IDE, you can safely skip this; when developing smart customer service bots, code generation platforms, document analysis tools, or internal Agent frameworks, it verifies SDK and API implementation details.

Model names, parameters, and streaming events can shift between versions; writing integration code from memory risks using deprecated interfaces. Anthropic's official **claude-api** Skill covers model selection, pricing, parameters, streaming outputs, tool calling, MCP, Agents, caching, token calculation, and model migration, with language-specific documentation:

| Language / Access Method | Notes |
| --- | --- |
| **Python** | Uses official Python SDK |
| **TypeScript** | Uses official TypeScript SDK and Zod |
| **Java** | Reference for Java / Kotlin / Scala projects |
| **Go** | Reference for Go server applications |
| **Ruby / PHP** | Suitable for respective language stacks |
| **C#** | Reference for .NET projects |
| **cURL** | Raw HTTP, Shell scripts, or debugging |

When encountering SDK method names, parameters, streaming events, or tool calling schemas, this Skill queries relevant documentation before generating code. Its primary role is curbing hallucinations stemming from outdated interface memory.

Repository: <https://github.com/anthropics/skills/tree/main/skills/claude-api>

## skill-creator

This is a meta-skill from Anthropic's official Skills repository, designed to create, modify, and evaluate Skills.

It provides a structured Skill development workflow:

| Phase | Description |
| --- | --- |
| **Intent Capture** | Understand what the Skill should accomplish, clarifying boundaries and goals |
| **Drafting SKILL.md** | Author the core instruction file, including frontmatter and directive content |
| **Testing & Verification** | Create test cases and run comparative experiments (With Skill vs Without Skill) |
| **Iterative Optimization** | Continuously refine directives based on test feedback |
| **Description Tuning** | Optimize Skill descriptions to improve trigger accuracy |

It also includes evaluation tooling to benchmark outputs between "Skill active" and "Skill inactive," recording time, token consumption, and assertion results before generating visual reports. If a model consistently completes a task reliably without a Skill, maintaining an extra layer of procedural overhead is unnecessary.

An ideal starting point for developers building bespoke Skills for their teams.

Repository: <https://github.com/anthropics/skills/tree/main/skills/skill-creator>

## How to Choose

| Frequent Problem Encountered | Consider First | When NOT Recommended to Install |
| --- | --- | --- |
| Complex features prone to missed requirements/tests | Superpowers | Handling mostly minor tweaks where current Agent succeeds reliably |
| Need only requirements clarification, bug diagnosis, TDD, or review | mattpocock/skills | Project already possesses equivalent stable workflows |
| Team needs unified Agents, Hooks, memory, and security policies | ECC | Only missing a single code review or TDD workflow |
| PRDs and technical proposals frequently lack clarity | Doc Co-Authoring | Only tweaking brief existing documentation |
| No design system; AI generates generic, monotonous pages | UI UX Pro Max | Project already has mature component libraries and design tokens |
| React / Next.js pages run but suffer from performance issues | Vercel React Best Practices | Project does not use React |
| Want general code review pass before committing | Code Review Expert | Project risks stem mainly from internal conventions that general checks cannot catch |
| PostgreSQL queries and schemas frequently require rework | Supabase Postgres Best Practices | Project uses MySQL or other database engines |
| Developing Claude API applications | Claude API | Only using Coding Agents inside an IDE |
| Want to solidify repeatedly failing tasks into a Skill | skill-creator | Baseline testing without Skills has not been conducted |

My standard practice is to run a task once without Skills first. If the model completes it reliably on its own, don't install anything; if the same issue recurs repeatedly, inspect candidate repositories' `SKILL.md`, `scripts/`, and `references/` to confirm they bridge the gap without dangerous commands or over-permissive scopes.

Restrict initial installations to the current repository. After running two or three real tasks, compare rework frequency, execution time, and outcome consistency. If there is no marked improvement, remove it; consider global installation only after long-term value is proven.

Where to start depends on which issue incurs the most rework recently: if code reviews regularly miss the same risks, try Code Review Expert; if Agents start coding before requirements are pinned down, try Doc Co-Authoring or the lighter [`grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md).

This checklist contains no mandatory defaults. Only when you can clearly articulate what problem a Skill solves, when it triggers, and how to remove it once ineffective does it earn a permanent place on your toolbelt.
