---
title: "Claude Code Skills Technical Implementation Details & Execution Mechanics"
description: "From Claude Code Skills file structure, discovery & loading, Front Matter, dynamic context, security restrictions, to Subagent coordination, this article explains how Skills transform reusable workflows into on-demand Agent capabilities."
category: AI Coding Internals
tag:
  - Claude Code
  - Skills
  - AI Agent
  - AI Coding
lang: en
sourceRef: zh-ref/ai-coding/principles/claude-code-skills.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Skills,Agent Skills,SKILL.md,Front Matter,dynamic context,Subagent,Plugin,AI coding
---

Many readers reported that Skills frequently appear in recent interviews. Having already written two earlier articles, I decided to dive in and put together this comprehensive deep dive.

Here is the full breakdown.

I still remember when I first started using Claude Code; I had a habit of cramming all kinds of rules into `CLAUDE.md`.

Code style, directory conventions, test commands—putting those in was completely fine. But later, code review checklists, PR summary workflows, and UI acceptance steps started piling in as well.

That's when problems started cropping up.

These workflows are certainly useful, but they aren't needed in every single task cycle. Including them every time adds massive amounts of irrelevant information, which ends up interfering with the model's judgment.

Content of this nature should no longer be shoved into `CLAUDE.md`. If you find yourself repeatedly pasting the same instructions, checklists, or multi-step procedures into conversations, or if a section of `CLAUDE.md` already reads like an operations manual, it's time to extract it.

The primary difference lies in the loading mechanism. `CLAUDE.md` is usually loaded at session initialization as persistent context; a Skill, on the other hand, normally exposes only its name and description, loading its full content only when actually triggered. Lengthy reference materials, checklists, and script documentations don't need to crowd the context from the very start.

This article delves into the technical implementation and execution mechanics of Claude Code Skills. I reference community source-code analysis materials for internal implementation details, while keeping current usage strictly aligned with official documentation and changelogs.

If you want a systematic understanding of the differences between Agent Skills and Prompts, MCP, and Function Calling first, read my earlier article [What Are Agent Skills? How Do They Truly Differ from Prompts and MCP?](https://javaguide.cn/ai/agent/skills.html). If you're more interested in which off-the-shelf Skills are worth installing, check out [Recommended Essential AI Coding Skills: TDD, Code Review, Web Automation, and MCP in Action](https://javaguide.cn/ai-coding/programmer-essential-skills.html).

## What Problems Do Skills Solve?

Let's look at the division of responsibilities between `CLAUDE.md` and Skills first.

`CLAUDE.md` is suited for project facts and long-standing rules needed across every turn: code styling, directory structure conventions, common commands, and architectural notes.

Skills are suited for workflows with distinct trigger conditions. They need to be reusable, but don't need to boot up with every conversation.

The most classic examples include:

- A code review checklist;
- A troubleshooting procedure for online production issues;
- A PR summary generation workflow;
- A design guideline needed only when touching the UI;
- A TDD workflow used only when writing tests.

What they have in common: fixed steps, substantial length, but only relevant to specific tasks. If everything is dumped into `CLAUDE.md`, it becomes startup overhead that grows heavier over time.

You can think of a Skill as an on-demand instruction booklet: Claude only needs to know the capability exists in everyday conversation; when the task truly calls for it, the complete instructions are pulled in.

![Comparison Between Skill, Prompt, MCP, and Function Calling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-prompt-function-calling-mcp-comparison-0566edb1.webp)

`CLAUDE.md` operates in reverse. The official recommendation is to reserve it for information that must be known in every turn: build commands, project conventions, directory layouts, and rules that must always be respected.

If a piece of content is already a multi-step workflow, or only affects a specific slice of the codebase, it is better migrated to a Skill or a path-scoped rule.

When splitting these up in a real project, I don't obsess over terminology first. Instead, I ask where the content actually creates friction:

- If the friction is "this rule must apply to every turn," it belongs in `CLAUDE.md`. If it's "a procedural routine is being repeatedly pasted," it's a Skill problem.
- If it's "the task is too long and the full process crowds out the main conversation context," only then consider a Subagent. If it's "everyone on the team needs this exact setup installed," consider a Plugin.

Here is a summary table comparing these concepts:

| Mechanism | Primary Problem Solved |
| --------- | ---------------------- |
| `CLAUDE.md` | Persistent project rules and long-term conventions |
| Skill | Workflows and checklists needed only for specific tasks |
| Subagent | Delegating long or side tasks to another Agent |
| Plugin | Distributing extensible capabilities like Skills, Agents, Hooks, and MCP |

A Skill in Claude Code can be understood as a "prompt-based command."

Custom commands have also been unified into the Skills system. Now both `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` can create `/deploy`; legacy `.claude/commands/` don't need immediate migration and remain backward compatible.

Subagents solve "who does it"; Skills solve "how to do it."

Plugins handle distribution. A Plugin can bundle Skills, Agents, Hooks, and MCP Servers. When an enterprise or team needs to standardize and roll out capabilities, Plugins are far more suitable than copying individual Skill files.

If a project contains `CLAUDE.md`, `AGENTS.md`, scoped rules, SPEC, and Skills simultaneously, follow this breakdown: keep persistent rules in rule files, delegate reusable workflows to Skills, and put acceptance criteria for the current task into the SPEC.

![Division of Responsibilities Between CLAUDE.md and Other Rule Files](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-rule-files-relationship-66d1a6af.png)

Content best suited to become a Skill usually shares several characteristics: frequently reused, triggered under specific conditions, fairly fixed procedures, relatively long, unsuitable for permanent context retention, and ideally accompanied by supporting files or scripts (e.g., `scripts/`, `references/`, `templates/`).

Code reviews, TDD, PR summaries, database schema migration checks, UI acceptance, and log investigations all belong in this category.

What shouldn't be made into a Skill are rigid, non-negotiable rules that the project must follow at all times. For example, "all Java code must follow Google Java Style"—such requirements belong in `CLAUDE.md` or scoped project rules.

For a detailed breakdown and best practices regarding `CLAUDE.md`, refer to my article [CLAUDE.md Best Practices: What to Write, What Not to Write, and How to Split as Projects Grow](https://javaguide.cn/ai-coding/practices/claude-md-best-practices.html).

## How to Author `SKILL.md`

A filesystem Skill typically follows this directory structure:

```text
.claude/skills/
  pr-summary/
    SKILL.md
    scripts/
      collect-pr-info.sh
    references/
      review-checklist.md
```

`SKILL.md` consists of two parts:

1. YAML frontmatter: Describes metadata such as name, trigger conditions, allowed tools, model, and execution context.
2. Markdown body: The actual operational instructions dispatched to Claude.

A minimal example:

```md
---
name: pr-summary
description: Summarize a pull request and list key risks
allowed-tools: Bash(gh *)
---

Read the pull request diff and comments, then summarize:

1. Main changes
2. Risky files
3. Missing tests
4. Suggested follow-up
```

When you invoke `/pr-summary`, Claude Code renders this Skill into a prompt and passes it to the model.

In the source code, `parseSkillFrontmatterFields()` supports many fields. Key common fields to know include:

| Field | Purpose |
| ----- | ------- |
| `name` | Display name; the directory name usually determines the command name |
| `description` | Helps the model determine when to invoke the skill |
| `when_to_use` | More granular trigger explanations |
| `allowed-tools` | Pre-approves tools available to this Skill |
| `model` | Specifies model alias |
| `effort` | Specifies reasoning / effort level |
| `user-invocable` | Whether users can invoke it directly via `/skill-name` |
| `disable-model-invocation` | Disables autonomous model invocation, allowing only manual user invocation |
| `paths` | Conditional trigger paths |
| `context` | Supports `fork`, running the Skill in a subagent context |
| `agent` | Binds to a specific Agent |
| `shell` | Specifies dynamic context commands to use bash or powershell |

Don't pile on every field right from the start. Most Skills only need `description`, `allowed-tools`, and clear instructions in the body. More fields mean higher maintenance overhead.

A few fields are easy to confuse:

| Field | Best Suited For |
| ----- | --------------- |
| `allowed-tools` | Narrowing the tool scope directly available to the current Skill |
| `context: fork` | Running long-running, research, or audit tasks in a forked context |
| `agent` | Specifying which Agent executes this Skill |

For example:

```yaml
context: fork
agent: Explore
allowed-tools: Bash(gh *)
```

This configuration is ideal for PR summaries, module audits, and documentation syntheses. The main conversation doesn't need to retain the entire intermediate process—getting the final output is sufficient.

Skills also support argument substitution. The simplest is `$ARGUMENTS`:

```md
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.
```

Execute:

```bash
/fix-issue 123
```

In the payload received by Claude, `$ARGUMENTS` is replaced with `123`.

To access positional arguments, you can use `$ARGUMENTS[0]` or the shorthand `$0`:

```md
Migrate the $0 component from $1 to $2.
```

Execute:

```bash
/migrate-component SearchBar React Vue
```

`$0`, `$1`, and `$2` are replaced with `SearchBar`, `React`, and `Vue` respectively.

## How Claude Code Discovers Skills

Claude Code loads Skills from multiple locations. Typical paths include:

```text
~/.claude/skills/
.claude/skills/
```

User-level Skills live in `~/.claude/skills/`, available across all projects. Project-level Skills live in the project's `.claude/skills/`, suitable for sharing with teammates.

![Example of .claude/skills Directory in a Project](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-project-skills-folder-31c3e95f.png)

From the source code, the Skills directory expects:

```text
skill-name/SKILL.md
```

This means a standalone `.md` file directly inside `/skills/` is not a standard Skill format; the directory must contain `SKILL.md`.

Skill sources in Claude Code can be categorized as follows:

| Type | Source | Description |
| ---- | ------ | ----------- |
| User-level Skills | `~/.claude/skills/` | Personal long-term reuse |
| Project-level Skills | `.claude/skills/` | Shared with the project or team |
| Managed Skills | Managed policy directory | Centrally distributed across an organization |
| Bundled Skills | Built into Claude Code | Such as `/code-review`, `/debug`, `/loop`, etc. |
| Plugin Skills | Provided by plugins | Installed and enabled alongside plugins |
| MCP Skills | MCP Server mapped capabilities | Exposed from MCP Servers |

Claude Code includes bundled skills like `/code-review`, `/batch`, `/debug`, `/loop`, and `/claude-api`. Unlike ordinary built-in commands, these are prompt-based skills.

![Bundled Skills Description in Official Claude Code Docs](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-bundled-skills-docs-d2142902.png)

Pay attention to nested `.claude/skills` directories.

Since v2.1.178, nested `.claude/skills` directories are also loaded when operating on files in corresponding subtrees. In case of name collisions, nested Skills appear in the format `<dir>:<name>`, preventing them from overwriting top-level Skills of the same name.

This mirrors the logic of project rules: **The closer a configuration is to the current working directory, the better it reflects localized context.**

However, avoid overusing nested Skills. Only split them when subdirectories truly have standalone workflows, such as:

- `frontend/.claude/skills/ui-review/SKILL.md`
- `backend/.claude/skills/api-contract-check/SKILL.md`
- `docs/.claude/skills/article-review/SKILL.md`

If it's purely for categorization, ordinary directories and filenames are sufficient.

Legacy `.claude/commands/` remain backward compatible. The source code includes a legacy commands loader: if a legacy command directory contains `SKILL.md`, it is processed as a Skill; otherwise, it loads as a standard Markdown command.

Official documentation explicitly states: custom commands have merged into Skills, but existing `.claude/commands/` files continue to work. When authoring new capabilities, using `.claude/skills/<name>/SKILL.md` directly is strongly advised.

## What Happens When a Skill Is Invoked?

Under normal conditions, a Skill does not inject its full body into the context.

Claude Code primarily relies on the Skill's name, description, `when_to_use`, and other frontmatter metadata to let the model know what capabilities are available.

The source code includes an `estimateSkillFrontmatterTokens()` function that only estimates tokens for name, description, and whenToUse, because full content is deferred until invocation.

When a user executes `/skill-name`, or when the model determines that a Skill is appropriate for the current task, Claude Code calls `getPromptForCommand()` to render the Skill body.

This is the main reason why Skills are vastly more context-efficient than giant `CLAUDE.md` files.

![Agent Execution Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

Once a Skill is invoked, Claude Code retrieves the Markdown body and performs several operations in sequence:

1. Expands arguments, such as `$ARGUMENTS` and `$0`.
2. Substitutes `${CLAUDE_SKILL_DIR}`.
3. Substitutes `${CLAUDE_SESSION_ID}`.
4. Executes embedded shell commands if the Skill does not originate from MCP.
5. Returns the final prompt to the model.

The underlying implementation in `createSkillCommand()` is `getPromptForCommand()`. It defers execution until actual invocation, rather than rendering all Skills at startup.

Skills can include supporting files, such as scripts, reference docs, and templates. The directory structure can look like:

```text
my-skill/
  SKILL.md
  scripts/
  references/
  templates/
```

If the body needs to reference a script path, use `${CLAUDE_SKILL_DIR}`:

```md
Run this helper:

!`${CLAUDE_SKILL_DIR}/scripts/collect-context.sh`
```

This prevents the Skill from breaking when its parent directory is moved.

However, supporting files should not be dumped into the body in their entirety. A better approach is: instruct Claude in `SKILL.md` on when to read which file. Read them only when needed; keep them out of the context otherwise.

This is progressive disclosure: first let the model know "this capability exists," read the body upon invocation, keep only the procedural skeleton in the body, and push truly detailed materials into supporting files.

![Progressive Disclosure (Three-Layer Model)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-three-layer-model-81f54306.png)

Therefore, `SKILL.md` should not be written as an ultra-long README. Prioritize when to use it, what order to follow, what not to do, and fallback recovery in the body; delegate large checklists, templates, and script documentations to `references/`, `templates/`, and `scripts/`.

![Keep SKILL.md Body Under 500 Lines for Best Practice](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

The distinction between `CLAUDE.md` and Skills can also be understood through loading strategies:

| Content | Best Placed In |
| ------- | -------------- |
| Project coding standards | `CLAUDE.md` |
| Directory layout explanations | `CLAUDE.md` |
| Code review workflows | Skill |
| PR summary workflows | Skill |
| UI acceptance checklists | Skill |
| Online incident triage scripts | Skill + supporting files |

Don't treat Skills as just another overgrown `CLAUDE.md`. The core value of a Skill is on-demand loading, not merely changing directory locations to keep piling up rules.

## Dynamic Context and Security Restrictions

Skills support dynamic context injection using the syntax:

```md
Current Git status:
!`git status --short`
```

Code block syntax is also supported:

````md
```!
git log --oneline -5
```
````

These commands execute before the Skill content is delivered to Claude. Command outputs replace original placeholders, meaning the model sees the final evaluated output rather than the command itself.

Official documentation underscores that this is preprocessing. Claude only sees the rendered prompt.

This differs fundamentally from Claude invoking Bash.

When Claude invokes Bash, the model makes an autonomous decision to use a tool within the agent loop. It generates a tool call, and tool outputs enter the conversation history.

Dynamic commands inside a Skill represent prompt preprocessing. Commands execute beforehand, and outputs are injected directly into the Skill prompt. The model never sees an "I am executing this command" step.

Content suitable for dynamic context is typically stable, read-only, low-risk context gathering, such as:

- `git status --short`
- `git diff --name-only`
- `gh pr view --comments`
- Project-provided read-only helper scripts

Never put commands that modify files, commit code, or delete resources into dynamic context. Dynamic context is responsible for "gathering material," not "executing mutations."

Skills originating from MCP are handled specially. The source check specifies that embedded shells only execute when `loadedFrom !== 'mcp'`.

MCP Skills arrive from remote MCP Servers and are not inherently trusted. If a remote server were allowed to return a Skill containing dynamic commands and execute them locally, it would constitute a Remote Code Execution (RCE) vector.

Therefore, MCP-sourced Skills bypass embedded shells entirely. Only filesystem, local project, and trusted-source Skills can proceed down this preprocessing path.

Furthermore, even for local Skills, command execution undergoes the same tool permission checks. `allowed-tools` can authorize certain commands for the current Skill, but execution is never unconditional.

Third-party Skills must be vetted with this exact mindset. Before installing, inspect `SKILL.md`, `scripts/`, and `references/` to ensure there are no dangerous commands, suspicious scripts, or overly permissive grants. Installing a Skill entrusts a workflow to an Agent; never rush it into a project without verifying its origin.

In enterprise environments, the official settings documentation provides a governance-related configuration: `strictPluginOnlyCustomization`.

It restricts allowed sources for skills, agents, hooks, and MCP servers. For instance:

```json
{
  "strictPluginOnlyCustomization": ["skills", "hooks"]
}
```

Once locked, user-level and project-level sources are bypassed; only capabilities provided by plugins, managed settings, or built-in defaults will load.

Such settings are ideal for team or enterprise environments. While personal projects rarely need them, companies seeking standardized governance over AI coding extensions cannot rely solely on verbal agreements.

## Coordinating Skills with Agents

Skills can run inside Subagents.

Official documentation covers "Run skills in a subagent," and Skill frontmatter supports `context: fork` and `agent`.

For example, a PR summary Skill can run the Explore agent in a forked context:

```yaml
context: fork
agent: Explore
allowed-tools: Bash(gh *)
```

This way, the main conversation doesn't have to carry the entire PR diff, comments, and file lists, receiving only the final summary.

`context: fork` is well-suited for three scenarios:

1. The Skill workflow is very lengthy;
2. The Skill needs to read extensive files or external information;
3. The main conversation only cares about the conclusion, not the full intermediate journey.

Examples include generating PR risk summaries, conducting read-only audits on a module, aggregating docs and issues, and drafting migration plans.

What shouldn't be forked are tasks requiring continuous back-and-forth interaction with the main conversation. For example, if you are actively tuning a core design and every step of the Skill requires your confirmation, do not fork it out.

Agent Teams also introduce extra context overhead. Official cost documentation warns that teammates automatically load `CLAUDE.md`, MCP servers, and Skills. In other words, Agent Teams don't just add a few prompts—each teammate incurs its own startup overhead.

This doesn't mean you should avoid Skills, but rather that you must govern Skill descriptions and trigger scopes:

- Write clear `description` fields to prevent false triggers;
- Place lengthy content into supporting files instead of bloating `SKILL.md`;
- Use `disable-model-invocation` to restrict manual-only Skills;
- Apply `strictPluginOnlyCustomization` in large enterprise repos to control origins.

The fundamental design goal of a Skill is on-demand loading. If descriptions are too vague and trigger too often, a Skill turns from a "context saver" into an "overhead tax."

In real-world projects, I usually split responsibilities according to this table:

| Content | Where to Place |
| ------- | -------------- |
| Rules that must be observed in every turn | `CLAUDE.md` |
| Rules active only under specific file paths | `.claude/rules/` or Skills with `paths` |
| Reusable operational workflows | Skill |
| Long reference materials | Skill supporting files |
| Search, audit, and validation side-tracks | Subagent |
| Multi-role collaborative tasks | Agent Teams |

Consider an example: Refactoring a backend API interface.

`CLAUDE.md` holds project coding standards and test commands; the `api-contract-check` Skill holds the interface compatibility verification workflow; the `code-review` Skill holds the review checklist; searching for legacy call sites is delegated to a Subagent; and if frontend, backend, and QA streams need to advance in parallel, Agent Teams is brought in.

The benefit of this separation is that rules, workflows, and executors remain distinct and transparent. Don't crowd everything into the main conversation, and don't spawn Agents everywhere just to look sophisticated.

## Summary

I prefer to treat a Skill as an **on-demand operations manual**.

Rules that must apply to every turn stay in rule files; workflows needed only for specific tasks are extracted into Skills; and long checklists, templates, and script references within those workflows are pushed further into supporting files.

The evaluation criterion is straightforward: If you find yourself repeatedly pasting the same prompt snippet, or if a section in `CLAUDE.md` is long enough to read like a manual, it should almost certainly become a Skill.

Conversely, if it's simply a coding standard, test command, or directory convention that must be followed across every turn, don't write a Skill just for the sake of using Skills. Keeping it in `CLAUDE.md` is far more direct and effective.
