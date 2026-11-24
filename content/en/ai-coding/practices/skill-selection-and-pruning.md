---
title: "In the Era of Strong Models, Do We Still Need to Install AI Coding Skills?"
description: "Drawing from real-world usage of Codex, Superpowers, and grilling to explore which Skills can be safely pruned in the era of strong models and which workflows remain worth retaining long term."
category: AI Coding in Practice
tag:
  - AI Coding
  - Codex
  - Skills
  - Superpowers
lang: en
sourceRef: zh-ref/ai-coding/practices/skill-selection-and-pruning.md
head:
  - - meta
    - name: keywords
      content: AI coding,Codex,Skills,Superpowers,grilling,AGENTS.md,Subagent,Plugin
---

A few days ago on Zhihu, I saw a question: **With Codex now powered by GPT-5.6, how much necessity is there for Skills?**

![Zhihu question regarding whether Skills are still needed after Codex adopted GPT-5.6](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/zhihu-codex-gpt56-skills-question-d4addea4.png)

A single question and my personal shifts in usage cannot represent industry-wide trends. More accurately: I noticed that returns on a subset of my development-oriented Skills were noticeably diminishing, prompting me to re-evaluate what should stay and what should be pruned.

Nowadays, whenever I encounter a Skill, I evaluate what concrete capability it truly delivers first. If it lacks an unmistakable purpose, I definitely will not install it.

Over the past two years, models frequently skipped steps, so writing more granular Skills brought greater peace of mind. Now that models like GPT-5.6, Kimi K3, and Claude Fable 5 natively handle baseline mechanics reliably, I have started pruning my collection of Skills.

> Below, I will use Codex as the reference Coding Agent; other agents follow similar principles.

## Many Basic Steps No Longer Need Explicit Coaching

Earlier development Skills were often formatted like procedural checklists: how to read a project, how to trace call chains, which tests to run after edits, and what to check before opening a PR. When model capabilities were unstable, these guardrails were undeniably useful.

Today, when asking Codex to fix a bug, as long as the symptom, expected behavior, and acceptance criteria are relatively clear, it can usually inspect relevant code on its own, trace call hierarchies to localize the issue, and complete implementation alongside basic verification. When project structures are unusually complex, test runners are idiosyncratic, or changes carry high blast radius, you must still explicitly tell it which checks to run—never leave verification entirely up to model guesswork.

Codex itself natively supports long-running tasks, approvals, and multi-agent collaboration. When workflow extensions or external capabilities are needed, one can still leverage Skills, Plugins, MCP, and Hooks. The previous pain point where "things easily derail unless every step is pre-scripted" has diminished substantially.

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

If a `SKILL.md` contains no project-specific constraints, scripts, templates, or distinct checklist items, and merely reiterates conventional development steps, I generally do not keep it. It adds virtually no new information for the model, yet risks adding procedural friction to simple tasks.

## Installing Too Many Skills Incurs Overhead

Codex does not ingest the full text of every `SKILL.md` at session startup. It first reads each Skill's name, description, and path, loading the body text only after a task match is established—a mechanism known as progressive disclosure.

According to [Codex Skills Documentation](https://learn.chatgpt.com/docs/build-skills), the initial Skill index consumes at most 2% of the model's context window; when the context size cannot be determined, the budget caps at 8,000 characters. Once this budget is exceeded, Codex truncates descriptions first. If numbers continue to swell, certain Skills may even be evicted from the initial manifest entirely.

When you install 100 Skills, what the Agent inspects before starting work may no longer be 100 intact descriptions.

If descriptions are drafted too broadly, an ordinary code edit might trigger multiple Skills simultaneously. When rules conflict, Codex has to arbitrate which workflow takes precedence. Factor in unmaintained legacy instructions, and diagnosing why a task went off course becomes frustratingly difficult.

Expanding context windows does not erase this friction. Old chat turns, tool schemas, and Skill descriptions can all fit inside, but the rules that truly matter in a project often boil down to a handful of sentences. The more cluttered the context, the more easily vital constraints get buried.

![Why context fails](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

Skills are a lot like browser bookmarks. At first, you want to bookmark everything, thinking you'll need it someday. Six months later when you look back, the ones you actually use are still just those few.

From when Skills first debuted until today, the ones I use frequently and actively maintain number fewer than 20. For example, the [draw.io charting Skill](https://mp.weixin.qq.com/s/rAKCSFHB407v6fe35ix0rg) I use when writing: it locks down diagram styling and circumvents layout quirks I stepped into repeatedly. This type of Skill crystallizes personal tastes and concrete empirical heuristics that a model improvising on the fly struggles to replicate consistently.

## Where Rules Actually Belong

Many Skills bloat excessively because developers dump every rule imaginable into them. Today, I categorize rules based on their operational scope:

- Project conventions that must be obeyed in every round: place in `AGENTS.md` or project rules files.
- Specialized workflows invoked only during specific tasks: package as Skills.
- Time-consuming sub-investigations generating massive intermediate noise: delegate to Subagents.
- Unified bundles of Skills, Hooks, MCP servers, and connectors distributed to a team: package as Plugins.
- Deterministic mechanical constraints where a single miss causes outages: delegate to Hooks, CI pipelines, linters, or test suites.

Rules files govern *how this project is always maintained*; Skills govern *how to execute a specific category of tasks*. Conflating the two typically yields a monstrous, over-reaching, unmaintainable `SKILL.md`.

Skills can bundle scripts, references, and templates, loading them on demand once triggered. When teams require centralized distribution, bundle those capabilities via Plugins.

![Progressive Disclosure (Three-Layer Model)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-three-layer-model-81f54306.png)

If you want a systematic breakdown of how Skills, Prompts, MCP, and Function Calling divide labor, check out [What Are Agent Skills? How Do They Differ from Prompts and MCP?](https://javaguide.cn/ai/agent/skills.html). This article focuses strictly on selection and pruning without rehashing low-level implementations.

## Why I Rarely Use Superpowers Anymore

Comprehensive development methodology suites like [Superpowers](https://github.com/obra/superpowers) are tools I rarely touch nowadays.

When I floated this topic in my discussion groups, community feedback was remarkably aligned: **Superpowers tends to saddle small tasks with disproportionate procedural overhead; while `grilling` asks relentless questions, it nails requirements down far more clearly.**

![Community discussion on Superpowers' heavy overhead and Grilling reducing rework](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/group-chat-superpowers-grilling-feedback-935c5501.png)

Superpowers delivers a full-fledged software engineering methodology: clarify requirements via brainstorming, break down tasks with writing-plans, implement features and tests through test-driven-development, isolate development in Git worktrees, execute across stages using Subagents, and conclude with code reviews and pre-completion verification.

Large-scale projects, completely unfamiliar codebases, and high-risk refactorings remain well-suited for this comprehensive workflow.

However, if you merely need to tweak validation logic or patch a minor unit test, stepping through the full "Clarify → Design → Plan → Execute → Review → Verify" gauntlet easily lets procedural ceremony devour all your time. The more exhaustive a process, the more critical the timing of its activation becomes; when applied to simple tasks, protection quickly turns into a tax.

Modern Codex can dynamically adjust steps during execution and actively request clarification when critical information is missing. Many small tasks simply need a few project constraints added, without needing an entire operating manual clamped on top.

Third-party Skills also introduce security risks. `SKILL.md` consists of executable instructions; if it conceals dangerous commands, abnormal scripts, or overly permissive scopes, an Agent will faithfully execute them. Always inspect `SKILL.md`, `scripts/`, and `references/` before installing; the larger the suite, the more vital it is to understand exactly what it authorizes an Agent to do.

## I Prefer Lightweight Composability Like mattpocock/skills

While Superpowers wraps the development cycle in a monolithic methodology, [mattpocock/skills](https://github.com/mattpocock/skills) feels more like a toolbox of modular components.

Skills in this repository are architected as small, easily modifiable, composable units. If requirements are hazy, trigger `grill-me` or `grilling` to cross-examine; if a bug proves difficult to isolate, spin up `diagnosing-bugs`; if you must adhere strictly to red-green refactoring, invoke `tdd` in isolation; when preparing to merge, let `code-review` inspect the diff. They do not force every task onto the exact same railway.

This modularity suits today's capable models exceptionally well. Steps Codex handles natively don't need redundant coaching; you only plug in reinforcements where errors recur. As tasks scale in complexity, combine multiple Skills on demand.

![Community discussion on experiences with lightweight Skills versus Superpowers](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/group-chat-lightweight-skills-feedback-ce048c69.png)

Among them, I am particularly fond of [`grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md).

Its directives are remarkably concise: cross-examine relentlessly before coding until plans, decisions, and dependencies are crystal clear; ask only one question at a time, waiting for the user's response before proceeding; inspect facts directly from the environment whenever possible, reserving questions for trade-offs that require human judgment.

## Which Skills Are Still Worth Keeping?

I currently prioritize retaining three categories of Skills.

The first category covers personal preferences and fixed deliverables that models cannot guess out of thin air, such as writing tone, diagram styles, internal company templates, and repository-specific release runbooks. With these constraints codified, deliverables maintain consistent standards.

The second category covers tasks requiring domain expertise, automation scripts, or reference datasets. Security audits, intricate document parsing, framework migrations, and production readiness checklists are difficult to capture fully in a one-line prompt. Skills bundle checklists, execution scripts, and evidence sources together, loading them only when invoked.

The third category covers workflows that actively prevent heading in the wrong direction. `grilling` belongs here: it doesn't write code on Codex's behalf, but standardizes pre-implementation requirement clarification. The faster models execute, the more valuable these direction-locking workflows become.

## Using grilling to Clarify a Real-World Feature

This case study comes from my open-source project [SpringAI Intelligent Interview Platform (v2.0 open-sourced)](https://javaguide.cn/zhuanlan/interview-guide.html). At the time, I planned to bridge mock interviews with custom knowledge bases. My prompt to `grilling` was direct: help me think this through completely.

The existing implementation was closer to integrated than I anticipated: both knowledge-base interviews and standard mock interviews shared `InterviewSession`, and answer evaluation and portions of the frontend UI were already reused. Rebuilding low-level plumbing was unnecessary; the immediate priority was pinning down Phase 1 product scope.

![Using Grilling to clarify the integration plan between mock interviews and knowledge bases](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grilling-springai-interview-platform-case-31a812ef.png)

The first question it posed was whether Phase 1 should deliver "targeted interviews based purely on uploaded user materials," or allow users to select standard domains like Java or System Design while the knowledge base merely supplements context.

It advised pursuing the former first. Existing question generation, categorization, difficulty scaling, dynamic follow-ups, and scoring rubrics aligned closely with that pipeline; simply unifying entry points and session history would complete the loop. The latter approach would introduce question mix ratios, real-time RAG, conflicting knowledge sources, evaluation criteria drift, and deduplication, drastically broadening the engineering scope.

Once I confirmed the Phase 1 target, it asked the next question: should an interview bind to a single knowledge base, or allow combining multiple knowledge bases? Because existing request DTOs, session fields, and question filters only supported a single `knowledgeBaseId`, it recommended scoping Phase 1 strictly to single-base sessions, deferring multi-base associations until the baseline stabilized.

Next came entry points. Knowledge-base interviews had a dedicated page, while mock interviews were launched from the Mock Interview Center. We ultimately agreed to retain dual entry points while sharing the same configuration component and creation endpoint, avoiding maintaining parallel interaction logic.

Before a single line of code was touched, product scope, data models, and component reuse patterns were completely settled.

I retain `grilling` because models already code with tremendous speed; rework almost invariably stems from starting too early—when scope is undefined, exception flows are unaddressed, and technical trade-offs remain murky. If an Agent rushes ahead on its own assumptions, the final output often has to be scrapped entirely.

**The more powerful the model, the faster it executes, and the more punishing the cost of heading in the wrong direction.**

`grilling` doesn't teach the model how to write code—it simply cements "clarify before acting" into a repeatable discipline. Strong models do not eliminate the necessity of this workflow.

## My Rules for Pruning Skills

Whenever I consider installing a Skill today, I ask several questions:

- Does the model already perform this natively?
- Without this Skill, do I repeatedly stumble in the exact same place?
- Does it package concrete scripts, templates, specialized references, or personal preferences?
- Once rules become obsolete, can I easily identify and prune them?

Skills that merely echo "read the project first, then write code, and run tests last" are ones I delete outright. Special project requirements belong inside `AGENTS.md`; deterministic testing, linting, and security constraints belong in CI, Hooks, or linters.

Only when you repeatedly fail in the exact same spot—especially on tasks with non-trivial blast radiuses—is authoring a standalone Skill justified. Keep only critical judgment criteria and verification steps; stop once the problem is solved, rather than inflating it into a bloated, monolithic workflow.

To see which off-the-shelf Skills currently exist and what tasks they best serve, continue to [AI Coding Skills Selection Checklist](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html). For the division of labor between `AGENTS.md`, permissions, MCP, Skills, and Scheduled Tasks in Codex, refer to the [OpenAI Codex Best Practices Guide](https://javaguide.cn/ai-coding/practices/codex-best-practices.html).

Although this article asks "Do we still need them?", I have no intention of purging Skills entirely. I simply no longer install them reflexively.

Today, when encountering a new Skill, I test the task without it first. If it succeeds cleanly, I don't install it; if the exact same flaw recurs, I keep that specific slice of workflow. Pruning this way may shrink your list considerably, but for every Skill that remains, you'll know precisely why it's there.
