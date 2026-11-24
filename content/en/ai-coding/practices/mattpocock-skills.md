---
title: "mattpocock/skills: The 4 AI Coding Skills I Recommend Most"
description: "An in-depth introduction to grilling, research, diagnosing-bugs, and code-review from mattpocock/skills, demonstrating with real-world project cases which AI coding failure modes they solve, and how to install and use them on demand."
category: AI Coding in Practice
tag:
  - AI Coding
  - Skills
  - Codex
  - Claude Code
lang: en
sourceRef: zh-ref/ai-coding/practices/mattpocock-skills.md
head:
  - - meta
    - name: keywords
      content: AI coding,Agent Skills,mattpocock skills,grilling,research,diagnosing-bugs,code-review,Codex,Claude Code,AI-assisted development,code review,requirements clarification,bug diagnosis
---

Hello, I'm Xiao G.

In both [AI Coding Skills Selection Checklist](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html) and [In the Era of Strong Models, Do We Still Need to Install AI Coding Skills?](https://javaguide.cn/ai-coding/practices/skill-selection-and-pruning.html), I mentioned [mattpocock/skills](https://github.com/mattpocock/skills), and specifically illustrated `grilling` with an actual project example.

Quite a few readers expressed strong interest in `grilling`. Looking back, however, both earlier mentions were somewhat too brief. They left only the vague impression of "prompting the Agent to ask follow-up questions," without elaborating on asking only one question at a time, what facts the Agent should look up itself, or when it is finally permitted to execute.

Therefore, I re-read every `SKILL.md` in that repository. `mattpocock/skills` decomposes common engineering friction into smaller, easily modifiable, composable Skills: if requirements are vague, add requirement clarification; if a bug is tricky, add a diagnostic pipeline; when preparing to deliver, plug in code review.

This modular separation fits my workflow naturally. The baseline behaviors that Codex and Claude Code already perform reliably don't need redundant re-teaching every time; you simply attach a focused micro-workflow to whichever phase frequently causes rework.

In community discussions, members repeatedly echoed the same sentiment: full-scale suites easily weigh down minor tasks with excessive ceremony, whereas `grilling`, despite its relentless cross-examination, pins down requirements far more cleanly.

![Community discussion on Superpowers' heavy overhead and Grilling reducing rework](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/group-chat-superpowers-grilling-feedback-935c5501.png)

Beyond `grilling`, three other Skills—`research`, `diagnosing-bugs`, and `code-review`—are equally outstanding, and I will share all of them in this article.

## `grilling` Is Far More Than "Having the Agent Ask a Few Extra Questions"

In my previous two articles, I oversimplified `grilling`: telling the Agent not to rush into code and to ask a few clarifying questions first. A standard prompt with that instruction can achieve roughly that.

The current version of [`grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) is remarkably concise, yet strictly specifies how the interview unfolds.

![Complete interview rules of the grilling Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grilling-skill-content-c1d7f787.png)

It traverses a decision tree, tackling only one decision at a time. Earlier answers frequently alter downstream branches, so it never dumps a dozen questions at once like a survey form.

It rigorously separates facts from decisions. What framework the project uses, how existing endpoints are designed, or whether a database table contains a specific column are facts the Agent must look up in code and documentation itself. Which technical option to adopt for Phase 1, whether to maintain legacy backward compatibility, and how much complexity the team is willing to shoulder are trade-offs left to the user.

Crucially, until both sides confirm that mutual understanding has been reached, the Agent is strictly forbidden from initiating work based on its own assumptions.

## What Are the Differences Among `grilling`, `grill-me`, and `grill-with-docs`?

`grilling` is the reusable underlying interview Skill that models can invoke autonomously, users can call directly, and other Skills can compose. `/grill-me` is an explicit human entry point whose sole responsibility is initiating a `/grilling` session.

When discussions produce lasting domain terminology or architectural choices, switch to [`/grill-with-docs`](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md). It invokes `domain-modeling`: finalized terminology is committed to `CONTEXT.md`, and irreversible decisions that might look counter-intuitive to future maintainers are documented as Architecture Decision Records (ADRs).

![Invocation flow of the grill-with-docs Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grill-with-docs-skill-content-2fa82ba5.png)

![Domain modeling guidelines in domain-modeling Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/domain-modeling-skill-content-90f1f2a7.png)

Their structural relationship can be summarized as:

```text
grill-me ──────────> grilling
grill-with-docs ───> grilling + domain-modeling
```

Interview discipline is centralized in `grilling`, while companion Skills reuse it directly.

In [v1.1.0](https://github.com/mattpocock/skills/releases/tag/v1.1.0), confirmation steps were revised into explicit stopping criteria, sharpening the distinction between environmental facts and user decisions. Earlier versions occasionally allowed composite Agents to casually decide product trade-offs on the user's behalf; now, such decisions must be asked individually.

## Using grilling to Clarify Knowledge Base Interview Requirements

This real-world case study comes from my open-source project [SpringAI Intelligent Interview Platform](https://javaguide.cn/zhuanlan/interview-guide.html).

At the time, I was preparing to bridge mock interviews with custom knowledge bases. I selected `grilling` and gave it a single instruction: help me think this through completely.

The existing codebase was already closer to integrated than I anticipated: both standard mock interviews and knowledge-base interviews utilized `InterviewSession`, and answer processing, asynchronous evaluation, and parts of the frontend UI were already shared. Continuing to redesign the database schema right away would likely have rewritten code worth keeping, while Phase 1 product scope remained unpinned.

![Using Grilling to clarify integration between mock interviews and knowledge bases](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grilling-springai-interview-platform-case-31a812ef.png)

The first decision `grilling` asked about was the role the knowledge base should play in the interview.

One option was generating targeted interviews derived entirely from uploaded materials; another was selecting standard domains like Java or System Design as usual, using the knowledge base strictly to augment context. I chose the former, allowing existing question generation, taxonomy, difficulty levels, dynamic follow-ups, and grading rubrics to remain intact. The latter option would have dragged in question ratios, real-time RAG pipelines, deduplication, knowledge conflicts, and evaluation criteria drift.

Once that decision was locked in, it branched to the next question: should an interview bind to a single knowledge base, or permit combining multiple knowledge bases?

Request parameters, session fields, and question filters were all designed around a single `knowledgeBaseId`. Supporting multiple knowledge bases would require merged recall, ranking weights, deduplication, and multi-tenant permission validation. Phase 1 was therefore scoped strictly to a single knowledge base, avoiding premature database migrations and interface changes.

The third decision was the entry point. Knowledge-base interviews already had a dedicated page, whereas mock interviews originated from the Mock Interview Center. We ultimately decided to preserve dual entry points while sharing the underlying `InterviewSession`, configuration components, and creation endpoints, avoiding duplicate maintenance.

Before writing a single line of code, Phase 1 scope had been narrowed down to three concrete choices: pure knowledge-base interviews, a single `knowledgeBaseId`, and shared session creation capabilities across dual entry points.

`grilling` didn't write a product spec on my behalf. It provided recommended answers backed by code citations, leaving trade-offs to my discretion. Had my first answer been "standard Skills + knowledge base context," subsequent questions wouldn't have been about single vs. multiple databases, but would have shifted toward question blending and scoring heuristics.

Today's models code fast enough. When scope is unbounded, an Agent will happily churn out code, tests, and documentation with great speed. If the direction was flawed, every single one of those deliverables must be discarded.

Naturally, not every task demands an interrogation gauntlet. Tweaking UI copy, adding an explicit null check, or appending a field per existing patterns have clear acceptance criteria—jumping straight to execution saves time. Nor does `grilling` replace testing or code review; its sole duty is surfacing unresolved ambiguities before implementation starts.

Currently, `grilling` does not enforce an upper limit on questions, meaning complex features can spark extended discussions. If you are concerned about interviews dragging on, set a budget of 3–5 questions per round. Once a round concludes, have it summarize confirmed vs. unconfirmed decisions, leaving it up to you whether to proceed.

Do not merely write "ask at most 5 questions." When the quota runs out, the Agent is still not authorized to guess remaining decisions or start coding unilaterally.

## `research`: Offloading the Information-Gathering Branch

When upgrading an SDK, questions like what parameters the current release supports, when legacy endpoints deprecate, or how streaming events changed shouldn't rely on user memory, nor should the primary Agent juggle reading massive docs while writing code.

[`research`](https://github.com/mattpocock/skills/blob/main/skills/engineering/research/SKILL.md) delegates the investigation to a background Agent instructed strictly to consult official documentation, source code, specifications, and primary APIs. Findings are recorded into a dedicated Markdown file in the repo with citations, allowing the primary Agent to continue uninterrupted.

![Information retrieval and result recording rules in research Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/research-skill-content-3c49456c.png)

What I value most is that it locks down evidence sources and deliverables: it never substitutes secondhand blog posts for official docs, nor dumps dozens of pages of search transcripts back into the main conversation, leaving only verifiable conclusions.

Using it requires two conditions: the Agent must support background or subagent investigations, and the repository must tolerate an additional research document. If you only need a single method signature, opening official docs directly is faster; when handling version migrations, protocol divergences, or unfamiliar libraries, delegate the investigation out.

## `diagnosing-bugs`: Build a Red Feedback Loop First

When troubleshooting bugs, Agents are prone to premature conclusions. Spotting a suspicious branch, they immediately alter code and rerun the suite; if unfixed, they jump to the next guess. As changes accumulate, the original failure becomes even harder to reproduce consistently.

[`diagnosing-bugs`](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md) invests the majority of its effort into Phase 1: constructing a tight feedback loop that reliably catches the current bug.

![Bug diagnosis workflow in diagnosing-bugs Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/diagnosing-bugs-skill-content-176ba348.png)

The feedback loop can be a failing test, a `curl` invocation, a CLI command with fixed inputs, a Playwright script, or replayed production traffic. It must capture the original defect, run fast and deterministically, and be executable by the Agent independently.

If reproduction is genuinely impossible, it documents attempted approaches and requests a reproducible environment, HAR file, server logs, core dumps, or temporary production instrumentation privileges.

Once the feedback loop is solid, it reproduces repeatedly to minimize input surface. Next, it enumerates 3–5 falsifiable hypotheses stating: "If X is the cause, altering Y will change the symptom in manner Z," adding breakpoints or targeted logging based on predictions.

During the fix phase, the minimal reproduction is converted into a regression test, verified red at the appropriate module boundary, and turned green by the fix. Before concluding, it reruns the original scenario, cleans up temporary logs and debug scaffolding marked with unique prefixes, and documents the root cause in the commit message or PR.

This discipline shines for hard-to-reproduce bugs, performance regressions, and issues where multiple guesses already failed. For compilation errors or obvious typos, spinning up a formal diagnosis loop is unnecessary. When code lacks testable seams, minimal reproductions cannot turn into reliable tests; rather than hacking together a fragile unit test divergent from real call patterns, this Skill records architectural shortcomings honestly.

## `code-review`: Auditing Standards and Spec Separately

Code reviews often focus solely on implementation quality: clean naming, DRY code, proper exception handling, and adequate test coverage. Code itself can look pristine while implementing the wrong requirement.

[`code-review`](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md) divides review into two parallel tracks: `Standards` and `Spec`.

![Dual-axis code review workflow in code-review Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/code-review-skill-content-88775bd3.png)

`Standards` reads the repository's `CONTRIBUTING.md` and coding conventions, checking whether changes respect agreed standards. The current release also bundles a catalog of `Fowler Code Smells`. Explicit repo rules take precedence; smells serve as investigation leads, never instant violations.

`Spec` loops back to the original Issue, PRD, or technical proposal, verifying whether deliverables actually fulfill the original requirements. Both review tracks run across parallel Subagents before results merge, preventing code style context from contaminating requirement verification.

Before reviewing, it anchors a `commit`, branch, `tag`, or `main` as a comparison baseline. The Skill inspects `diff` starting from the `merge base` up to `HEAD`, rather than skimming the entire codebase indiscriminately.

If a project lacks PRDs, Issues, or acceptance criteria, the `Spec` track must be skipped; if a repo has no coding conventions, `Standards` relies primarily on general code smells. Parallel review also mandates host Agent support for Subagents. CI pipelines, static analysis, and manual domain review must still be retained.

## How to Install

This repository connects to tools supporting Agent Skills—such as Codex and Claude Code—via the `skills.sh` installer:

```bash
npx skills@latest add mattpocock/skills
```

The installer prompts you to select specific Skills and target Agents. If you only want to experience requirement interviews, select `grill-me` and `grilling`. If you want to maintain `CONTEXT.md` and ADRs during discussions, select `grill-with-docs` and `domain-modeling`.

Per current project instructions, before running engineering workflows, execute `/setup-matt-pocock-skills` once in the target repo to configure GitHub, Linear, or local issue tracking, confirming `Triage` labels and Agent document directories.

You can also ask your Coding Agent to install them directly, as shown here with Codex:

```text
Please install 4 Agent Skills from the mattpocock/skills repository: grilling, research, diagnosing-bugs, code-review.
```

![Codex installing mattpocock skills using skill-installer](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/codex-install-mattpocock-skills-2adbd954.png)

Once installed, newly registered Skills typically appear in the available list on the next turn.

`tdd`, `to-spec`, and `to-tickets` are not singled out here. TDD, specifications, and task breakdown are already standard engineering practices that many Agents handle natively. Compose them only when adopting the complete "Discussion → Spec → Tickets → Implement → Review" pipeline.

The four Skills highlighted in this article target the failure modes I care about most today: starting without clear direction, unverified documentation sources, guessing bugs before reproducing them, and writing code that drifts from the original requirements.

Initial installations don't need to be global. Restrict them to a single repository first, evaluating rework counts, turnaround time, and output quality across two or three real tasks. If the model accomplishes tasks cleanly without a Skill, remove it; if the exact same flaw recurs, keep that specific slice of workflow.

Third-party Skills are executable instructions given to an Agent. Read `SKILL.md` and check `scripts/`, `references/`, and permission scopes before installing. A shorter tool list is completely fine—knowing exactly why each Skill remains brings far greater peace of mind.
