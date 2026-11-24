---
title: "CLAUDE.md Best Practices: What to Include, What to Exclude, and How to Scale"
description: "A guide on what project rules belong in CLAUDE.md, and how to manage and maintain them alongside .claude/rules and Auto Memory."
category: AI Coding in Practice
head:
  - - meta
    - name: keywords
      content: CLAUDE.md, Claude Code, AI coding, AI project standards, Agentic Coding, AI-assisted development, CLAUDE.md best practices, .claude/rules
lang: en
sourceRef: zh-ref/ai-coding/practices/claude-md-best-practices.md
---

Hello, I'm Xiao G. When I recently shared [Claude Code Practical Tips](https://javaguide.cn/ai-coding/practices/claudecode-tips.html), I touched briefly upon `CLAUDE.md`. Several readers asked in the comments whether I could dedicate an entire piece to this file.

Many developers, upon encountering `CLAUDE.md` for the first time, mistake it for just another README. While a README introduces a project to humans, `CLAUDE.md` provides operational instructions for Claude Code: how the project builds and runs, which files must never be edited, what the standard API response format looks like, and what checks must run after modifying code.

You could theoretically explain these details at the start of every new conversation, but it's easy to forget things. Enduring rules that Claude cannot reliably infer from the source code alone are far better codified upfront in `CLAUDE.md`.

Drawing on [Claude Code's official documentation](https://code.claude.com/docs/en/best-practices) and hands-on experience, this article explains what belongs in `CLAUDE.md`, how to decompose it as your project expands, and how to maintain it over time.

A quick heads-up: Claude Code iterates rapidly, with `.claude/rules/` and Auto Memory particularly subject to changes across versions. This article reflects official documentation verified as of 2026-07-24. Before adopting these patterns, run `claude --version` to check your version, and inspect `/context` to see which instructions are actively loaded in your current session; use `/memory` to view and configure rules and memory storage paths.

## What Is CLAUDE.md?

`CLAUDE.md` is Claude Code's persistent instruction file, which can be placed at user, project, or directory levels. Once read, Claude Code tailors its actions to the commands, conventions, and constraints defined within it for the current repository.

Content well-suited for `CLAUDE.md` includes:

- Rules Claude frequently misguesses
- Unspoken conventions not obvious from code
- Non-negotiable team standards
- Tech stack versions, common commands, architectural rationale, and project pitfalls

To decide whether a rule deserves to stay, ask:

> If I delete this line, will Claude become noticeably more prone to mistakes?

If yes, keep it. If no, it is most likely just wasting context.

## How Does CLAUDE.md Differ from Other Rule Files?

![How CLAUDE.md and other rule files divide responsibilities](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-rule-files-relationship-66d1a6af.png)

### CLAUDE.md vs. AGENTS.md

| Dimension | CLAUDE.md | AGENTS.md |
| --- | --- | --- |
| **Intended Consumer** | Claude Code exclusive | Open standard adopted across tools like OpenAI Codex, Cursor, Google Jules |
| **Role** | Project rulebook tailored for Claude Code | Universal agent instructions across diverse coding tools |

![CLAUDE.md and AGENTS.md](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

**AGENTS.md** targets multiple coding agents, while **CLAUDE.md** is Claude Code's dedicated entry point. When a repository uses both, they can share a single foundational instruction set.

Teams may designate a "Confirmed Common Mistakes" section in `AGENTS.md`, but agents will not automatically log mistakes simply because the file exists, nor is there any guarantee that adding a rule will permanently prevent future occurrences. What gets added, who reviews it, and when it gets pruned must be explicitly defined in your team's workflow.

If your repository already maintains an `AGENTS.md` for other coding agents, you can create a `CLAUDE.md` that imports `AGENTS.md`, enabling both tools to reuse the same baseline rules without duplicate maintenance:

```markdown
@AGENTS.md

## Claude Code Specific Instructions

- Use plan mode when modifying code under `src/billing/`
```

In [Demystifying Harness Engineering](https://javaguide.cn/ai/agent/harness-engineering.html), I highlighted an example: OpenAI's internal `AGENTS.md` is only about 100 lines long, functioning primarily as an index pointing to detailed design documents, architecture diagrams, execution plans, and quality rubrics in `docs/`. The agent reads the index first, loading deep references on demand when touching relevant tasks, preventing the entire context window from being flooded upfront.

### CLAUDE.md vs. .claude/rules/

| Dimension | CLAUDE.md | `.claude/rules/` |
| --- | --- | --- |
| **Loading Mechanism** | Root/project-level files load at session startup; subdirectory files load on demand when accessing that directory | Rules without `paths` load at startup; rules with `paths` load only when Claude reads matching files |
| **Scope** | Universal, repository-wide rules | Localized rules scoped strictly to specific files or directories |
| **Context Consumption** | Root/project-level rules consume context continuously | Path-scoped rules consume context on demand; global rules in `.claude/rules/` consume context continuously |

Rules that apply only to specific areas—such as backend API specifications or test configurations—can be placed in `.claude/rules/` instead of crowding the root `CLAUDE.md`.

Keep two nuances in mind:

1. `.claude/rules/` is not automatically scaffolded upon installing Claude Code; create it manually when needed.
2. Path-scoped rules with frontmatter `paths` load based on file matches; rules lacking `paths` load globally into context. Therefore, merely creating a `.claude/rules/` folder does not automatically reduce context consumption.

### CLAUDE.md vs. SPEC.md

| Dimension | CLAUDE.md | SPEC.md |
| --- | --- | --- |
| **Purpose** | Project standards (how to work) | Feature specification (what to build) |
| **Content** | Coding conventions, commands, pitfalls, team agreements | Scope boundaries, functional requirements, acceptance criteria (an AI-oriented PRD) |
| **Consumer** | AI coding assistant (daily engineering) | Spec Coding workflows (spec-driven development) |

`SPEC.md` is a filename used by teams practicing **Spec Coding**, structured along `Specify → Design → Implement → Test`. Different toolchains may use alternative filenames and phases like requirements, design, tasks, or plan; there is no single mandatory four-phase standard.

![Spec Coding specification-driven programming pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

In the diagram above, `requirements.md` is the specification produced during the `Specify` phase; other teams may consolidate similar specifications into `SPEC.md`.

In short: **CLAUDE.md governs long-term engineering hygiene, while Spec files govern the task at hand.**

### Which One Should You Choose?

- **CLAUDE.md**: Claude Code's dedicated behavioral guide; root/user levels load at session start, while subdirectory rules activate on demand.
- **AGENTS.md**: Tool-agnostic "how-to-work" standards, which `CLAUDE.md` can import and reuse.
- **`.claude/rules/`**: Localized rule folder; files without `paths` act globally, while files with `paths` activate only when touching matched files.
- **SPEC.md**: Requirement specification file defining what to build for a specific feature, forming an integral part of Spec Coding.

## What Exactly Belongs in CLAUDE.md?

Let's look at an antipattern I encounter frequently. Many developers run `/init`, see the generated `CLAUDE.md`, think "having something is better than nothing," and commit it without editing:

```markdown
# Project Overview

This is a Spring Boot project using Java 17 and Maven.

# Code Style

- Write clean code
- Follow best practices
- Ensure code readability

# Workflow

- Run tests before committing
- Maintain good code organization
```

While none of these statements are incorrect, they do little to influence Claude's behavior. Take "Write clean code": even if you delete that sentence, Claude will still strive to generate readable code. Leaving it in simply burns context tokens for zero behavioral gain.

`CLAUDE.md` shares the context window with system prompts, conversation history, and tool outputs. Anthropic explicitly highlights in its official documentation: **As the context window fills up, Claude's overall performance degrades.**

![Why context degrades over time](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

The longer the instruction file, the less headroom remains for actual code and conversation, and the more likely critical constraints are drowned out.

Anthropic advises keeping `CLAUDE.md` under 200 lines, focusing strictly on information Claude cannot easily deduce from the source code. If content expands, partition it into path-scoped `.claude/rules/` or offload situational references into Skills.

![Claude Code official recommendation on CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudemd-claude-docs-95f47141.png)

When auditing `CLAUDE.md`, review each line: "If I delete this, will Claude make this specific mistake more often?" Keep rules with demonstrable impact; delete empty assertions, and add concrete rules later if actual mistakes emerge.

### What to Include

Five categories of information genuinely belong in `CLAUDE.md`:

**1. Tech Stack and Version Information.**

Framework version discrepancies heavily influence generated code. For example, Spring Boot 2 and 3 differ in configuration semantics; without explicit versions, Claude may output incompatible patterns. While dependencies like MyBatis-Plus can be read from `pom.xml`, the underlying rationale for choosing it over JPA requires explicit explanation.

**2. Frequently Used Commands.**

Provide exact compile, test, lint, and run commands. Use code blocks or backticks to preserve exact flags so Claude doesn't have to translate natural language into commands:

```markdown
# Commands

- Build: `mvn clean package -DskipTests`
- Test: `mvn test -pl module-name`
- Run: `mvn spring-boot:run -pl bootstrap`
- Lint: `mvn checkstyle:check`
```

**3. Architectural Decisions and Underlying Rationale.**

The rationale behind a rule dictates how Claude handles adjacent edge cases. In one of my projects, I initially wrote: "Do not write raw SQL; use QueryWrapper." Claude still wrote raw SQL in some queries. Once I added the rationale: "Our SQL audit infrastructure parses QueryWrapper ASTs to record audit logs," the boundary became clear, and Claude consistently adopted QueryWrapper for all queries.

**4. Team Conventions and Project Pitfalls.**

Commit message formats (e.g., `feat(scope): message`), branch naming conventions, and required environment variables cannot be inferred from code alone. Any tribal knowledge an onboarding engineer would need to ask about belongs in `CLAUDE.md`.

**5. Cross-Session Task Information.**

When task scope, acceptance criteria, priorities, dependencies, and blockers must persist across multiple conversations, maintain a dedicated task file and point to it from `CLAUDE.md` or `AGENTS.md`. This preserves active task status without polluting permanent rules with transient state.

### What to Exclude

**1. Code Formatting Rules.**

Indentation width, import sorting, trailing semicolons—leave these entirely to formatting tools.

If your project lacks Checkstyle or Prettier, configure the linter instead of attempting to enforce code formatting through natural language.

**2. Default Language or Framework Behavior.**

For example:

- "Vue uses `ref` / `reactive` for reactive state."
- "JPA entity classes map to database tables."
- "SQL uses `WHERE` for filtering."

These are baseline language facts. Stating them adds zero value and merely consumes tokens.

**3. Large Reference Documentation.**

Never embed external API docs or SDK parameter tables wholesale. Provide links instead; Claude can fetch and read them when needed.

### Exemplary CLAUDE.md Files

#### User-Level Example: Curbing Universal Bad Habits

[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) is a community curated collection of Claude Code rules and skills inspired by Andrej Karpathy's observations on LLM coding tendencies. Because these rules are repo-agnostic, they are ideal for user-level `~/.claude/CLAUDE.md` to prevent agent drift across all projects.

Here is an illustrative screenshot from that repository:

![andrej-karpathy-claudemd](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/andrej-karpathy-claudemd-9bac8393.png)

This file targets high-frequency pitfalls: verify assumptions before coding, avoid over-abstraction, confine edits strictly to the task scope, and run verification against acceptance criteria upon completion. Concise, actionable, and tied directly to observable behaviors.

#### Project-Level Example: A Quick-Reference Card

My [interview-guide](https://javaguide.cn/zhuanlan/interview-guide.html) project uses a project-level `CLAUDE.md`. The root file maintains tech stack versions, essential commands, layering boundaries, exception handling, transaction rules, and forbidden patterns, delegating deep guidelines to `.claude/rules/`.

A concise root file looks like this:

```markdown
# AI Interview Platform Rules

Spring Boot 4.0 + Java 21 + Spring AI 2.0 + React interview platform.

## Tech Stack

- Backend: Spring Boot 4.0 / Java 21 / Gradle / Spring AI 2.0
- Database: PostgreSQL + pgvector (1024-dim COSINE)
- Cache & MQ: Redis / Redisson / Redis Stream
- Frontend: React 18 + TypeScript + Vite + TailwindCSS 4 (`frontend/`)
- Mapping & Docs: MapStruct / OpenAPI / iText 8 / Apache Tika

## Commands

- Build: `./gradlew build`
- Test: `./gradlew test`
- Backend Run: `./gradlew bootRun`
- Frontend Run: `cd frontend && npm run dev`
- Frontend Lint: `cd frontend && npm run lint`

## Architecture

- Single-module Gradle project, organized by feature packages.
- Backend strictly follows `Controller -> Service -> Repository` layering.
- Shared infrastructure resides in `common/`, including rate limiting, AI calls, async tasks, config, exceptions, unified responses.
- Frontend code resides in `frontend/`.
- Detailed project structure in `docs/architecture.md`.

## Must Follow

- Controllers handle only request validation and response wrapping; no business logic.
- Services handle business orchestration; `@Transactional` belongs strictly in the Service layer.
- Repositories handle data access only; no business logic.
- External responses must wrap payloads in `Result<T>`.
- Business exceptions must throw `BusinessException(ErrorCode.XXX, "message")`.
- Entity mapping must use MapStruct; manual converter logic is prohibited.
- LLM, S3, and external HTTP calls must never run inside a database transaction.
- Retrieve `ChatClient` instances exclusively through `LlmProviderRegistry`.
- Structured outputs must use `StructuredOutputInvoker` for retry encapsulation.
- Redis Stream produce/consume must extend `AbstractStreamProducer` / `AbstractStreamConsumer` templates.
- Rate limiting must use `@RateLimit`; do not write ad-hoc Redis limiting logic.
- Vector searches must use PostgreSQL + pgvector (1024-dimension, COSINE distance).

## Never Do

- Never throw raw `RuntimeException(...)`; use `BusinessException`.
- Never return Entity instances directly to the frontend.
- Never scatter `@Value` across Services; centralize configuration in `@ConfigurationProperties`.
- Never inline fully qualified class names; use imports.
- Never invoke LLM, S3, or external HTTP within a database transaction.
- Never self-invoke `@Transactional` methods within the same class.
- Never swallow exceptions with empty `catch (Exception e) {}`.
- Never query the DB in loops; use batch operations.
- Never hardcode secrets or keys.
- Never use `Executors.newXxxThreadPool()`; declare explicit `ThreadPoolExecutor`.

## More Rules

- Error Codes: `.claude/rules/error-handling.md`
- Rate Limiting: `.claude/rules/rate-limit.md`
- Redis Stream: `.claude/rules/redis-stream.md`
- AI Service Invocation: `.claude/rules/ai-service.md`
- Database Conventions: `.claude/rules/database.md`
- Frontend Conventions: `.claude/rules/frontend.md`
```

## How to Write Rules That Claude Actually Follows

Rules must describe concrete actions and specify verifiable outcomes.

### Rules Must Be Concrete and Verifiable

"Ensure code is readable" provides no testable criteria. Replacing it with "Function names must start with a verb, and single functions must not exceed 40 lines" gives Claude clear boundaries that can be verified during review.

### Pair Prohibitions with Alternatives

Always state: Do not do X; use Y instead.

In my own project, Claude repeatedly used `@Autowired` field injection, whereas team conventions required constructor injection.

Initially, I wrote: "Do not use `@Autowired` field injection." Results were poor: it stopped using field injection, but sometimes hand-wrote verbose constructors, and other times reverted to setter injection. I refined the rule:

```markdown
# Dependency Injection

- Do not use @Autowired field injection
- Use constructor injection via Lombok's @RequiredArgsConstructor
- Reference example: see UserController.java
```

By providing both the preferred pattern and an in-repo reference file, Claude gained an exact template to follow.

### Use Emphatic Markers Sparingly

When Claude repeatedly violates a rule, prefix it with `IMPORTANT:` or `YOU MUST:`. Reserve these markers for a small handful of critical rules; when every rule is emphasized, nothing stands out.

If Claude continues to ignore a rule, check whether the file is too long or the rule is in the wrong scope. Adding more exclamation points won't fix structural file issues.

### Use Standard Heading Names

Headings like Commands, Structure, Conventions, and Testing clearly communicate their intent. Claude parses standard headings reliably, and team members can navigate them without learning custom terminology.

### Hooks

`CLAUDE.md` provides instructions, but cannot mechanically halt a tool invocation. Sensitive file edits or dangerous commands should be governed by Hooks. For example, `PreToolUse` intercepts invocations before execution, evaluating permissions and risk:

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

Mechanically verifiable checks belong in Linters, Hooks, or CI. To prevent edits to `.env`, have a `PreToolUse` Hook inspect target paths and reject matches; relying solely on a note in `CLAUDE.md` carries risk of oversight.

Ideal use cases for Hooks:

- Auto-formatting after edits
- Running tests before session completion
- Barring modifications to `migrations/` or `.github/workflows/`
- Intercepting `curl | bash`, `rm -rf`, or outbound transmission of secrets
- Injecting context when Sub-Agents spawn

Requirements where a single failure creates unacceptable risk belong in Hooks. Guidelines aimed at helping Claude understand architecture remain in `CLAUDE.md`.

## Where Does CLAUDE.md Live?

Claude Code supports placing `CLAUDE.md` at multiple filesystem locations:

![CLAUDE.md hierarchy and priority](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-file-hierarchy-8abb6c01.png)

| Location | Path | Purpose |
| --- | --- | --- |
| **Organization** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br/>Linux/WSL: `/etc/claude-code/CLAUDE.md`<br/>Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Mandatory enterprise policies, compliance rules, and data handling requirements enforced by IT/DevOps; cannot be excluded by personal settings |
| **User** | `~/.claude/CLAUDE.md` | Personal developer preferences applying across all local projects |
| **Project** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Shared team standards committed to Git |
| **Local** | `./CLAUDE.local.md` | Personal project-specific preferences; added to `.gitignore` |
| **Subdirectory** | `./subdir/CLAUDE.md` | Scoped instructions loaded on demand when Claude touches files in that directory |

Different levels load concurrently; later files do not replace earlier files wholesale. Rules closer to the active directory and narrower in scope naturally exert stronger influence on current tasks.

If user rules prescribe spaces while project rules require tabs, Claude will prioritize the project rule. However, conflicting directives introduce ambiguity and should be cleaned up immediately.

My pattern is simple: commit project-level `CLAUDE.md` to Git for team standards; put personal preferences (like commit message language) in `CLAUDE.local.md` and `.gitignore`.

## Scaling CLAUDE.md as Projects Grow

Small projects need only a single `CLAUDE.md`. As modules multiply, cramming every rule into the root file forces every session to load irrelevant guidelines.

![CLAUDE.md scaling evolution](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-scaling-evolution-8b6b3a7b.png)

### Small Projects: Keep a Single File

Keep global architecture, essential commands, and boundaries in the root file. For most small to mid-sized projects, a concise file under 50 lines is plenty.

### Expanding Projects: Use the Root File as a Router

Retain project overviews and commands in root `CLAUDE.md`, moving deep architectural rules, API conventions, and test requirements into separate files referenced via `@path/to/file`:

```markdown
## Project

Order management service built with Spring Boot 3.2 + MyBatis-Plus + MySQL 8.0.

## Commands

- Build: `mvn clean package`
- Test: `mvn test`

## Rules

- API Conventions: @docs/api-conventions.md
- Database Rules: @docs/database-rules.md
```

### Localized Rules: Scope by Path

Use frontmatter in `.claude/rules/` to match specific file paths:

```markdown
---
paths:
  - "src/main/java/**/controller/**/*.java"
---

# Controller Conventions

- Wrap all responses in Result<T>
- Annotate all endpoints with Swagger documentation
```

Editing a Controller loads Controller rules, while editing a Service leaves that context free. In practice, be mindful of three nuances:

**When creating new files, path rules may not load yet.** Path-scoped rules inject when Claude **reads** a matching file. When creating a new file from scratch, path rules may not have entered context yet. Invariants like "all new controllers must include a header" belong in global rules, root `CLAUDE.md`, or Hooks.

**After context compression, path rules must re-trigger.** Following `/compact`, root `CLAUDE.md` re-injects, but subdirectory rules and path-scoped rules require Claude to read matching files again to reactivate. Check `/context` before resuming edits.

**Verify rule loading directly.** Use `/context` to inspect which `CLAUDE.md`, `CLAUDE.local.md`, and rule files are loaded; use `/memory` to view and configure storage locations. Configure an `InstructionsLoaded` Hook if you need detailed audit logs of rule loading.

> **Engineering Note**: `@path/to/file` embeds the target file entirely into context. Importing massive files consumes substantial token budget upfront. Official docs limit recursive imports to 4 layers. For large files, write "See `docs/architecture.md` for architectural details" instead, letting Claude read it on demand.

## Maintenance and Hygiene

When project architectures, commands, or workflows change, outdated rules in `CLAUDE.md` must be pruned.

`CLAUDE.md` stores actively maintained, long-term instructions. Auto Memory (Claude Code v2.1.59+) automatically captures debugging takeaways, preferences, and operational habits discovered during collaboration.

My mental model: requirements that impact the team and apply to every session belong in `CLAUDE.md`; transient debugging tips belong in Auto Memory.

For example, "All API endpoints must return `Result<T>`" belongs in `CLAUDE.md`; "Redis Stream tests in this project require a local Redis instance running" is an operational detail best captured by Auto Memory. Auto Memory is enabled by default and can be inspected or edited via `/memory`; it maintains independent storage per project, but it is not a committed team standard and cannot replace `CLAUDE.md`.

![CLAUDE.md maintenance decision workflow](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-maintenance-flow-f46367ef.png)

### When to Add Rules

Add a rule when Claude makes an error and a concise instruction significantly reduces the likelihood of recurrence. Remember that rule files only guide behavior; mechanically enforceable checks belong in tests, linters, Hooks, or CI.

### When to Delete Rules

Delete a rule when its underlying constraint is deprecated, or when removing it causes no observable change in Claude's behavior. Self-evident facts already obvious from code do not need restating.

### How to Adjust Rules

If Claude says "Apologies, I overlooked rule X," first verify the file actually loaded, then check if the rule defines an actionable behavior. Vague advice ("pay attention to," "strive to") should be replaced with testable, concrete instructions.

If a rule is repeatedly violated across sessions, investigate whether the file is too long, rules are conflicting, or the rule is placed in the wrong scope.

### Periodic Audits

Periodically pick a few rules and ask Claude: "If I delete this rule, how would your behavior change?" While not foolproof, this helps filter candidates. When unsure, run parallel sessions with and without the rule using the same prompt, comparing outputs.

Never instruct Claude to immediately record every mistake into `CLAUDE.md`. Evaluate whether the mistake is recurring, relevant to the team, and likely to happen again. Codify recurring mistakes into rules; leave local quirks in Auto Memory.

## Common Pitfalls

- **Adding rules without pruning.** Continuously appending rules without deleting obsolete ones leads to massive files. When Claude starts missing rules, bolding or exclamation marks won't help—prune stale content first.
- **Importing massive files via `@`.** `@` embeds the entire file into context. Importing hundreds of lines upfront wastes token budget before work begins. Point to docs ("See `docs/architecture.md`") so Claude reads on demand.
- **Relying solely on path-scoped rules for file creation.** Path rules activate when Claude reads an existing file. When creating new files, rules may not be loaded yet. Put creation invariants in root `CLAUDE.md`, global rules, or Hooks.
- **Contradictory rules across files.** When user, project, and directory rules conflict, Claude won't warn you and may choose unpredictably. Audit all levels when updating standards.
- **Creating permanent rules for one-off mistakes.** Turning rare, transient mistakes into permanent rules penalizes every subsequent session with extra context overhead. Only codify issues that recur and can be prevented by crisp instructions.

## Summary

When writing `CLAUDE.md`, avoid the temptation to document every conceivable rule.

My standard litmus test is: Can Claude deduce this accurately just by reading the code? If it can't, and misguessing will derail the task, document it.

Tech stack versions, build and test commands, architectural boundaries, and subtle project constraints belong in `CLAUDE.md`. Indentation and import ordering belong in formatting tools.

Keep the file short and focused initially. As the codebase grows, split localized rules into `.claude/rules/` or separate documentation. Verify active rules with `/context`.

`CLAUDE.md` is a living document, not static scripture. Add rules when errors recur, delete rules when project realities change, and automate enforcement with Linters, Hooks, and CI. A concise, precise instruction file is far more effective than an exhaustive, unwieldy manifesto.
