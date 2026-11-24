---
title: "Spec Coding in Practice: From Vibe Coding to AI Code Specifications"
description: "A systematic guide to the core concepts and implementation workflow of Spec Coding (Specification-Driven Programming), covering the differences between Vibe Coding and Spec Coding, a 4-step adoption method, AI IDE rule configuration, 3-color permission control, layered Spec management, and lessons learned in multi-agent collaboration."
category: AI Coding Practices
lang: en
sourceRef: zh-ref/ai-coding/practices/spec-coding.md
head:
  - - meta
    - name: keywords
      content: Spec Coding,Vibe Coding,Specification-Driven Development,AI code specifications,AI coding,Cursor,Claude Code,Copilot,multi-agent collaboration,AI-assisted development
---

Hello, I'm Xiao G. After putting it off for quite a while, I'm finally delivering on this promise.

Community members suggested writing about Spec Coding a long time ago. It is indeed quite important—widely applicable at work, and interviewers have started asking about it as well.

![Readers urging Spec Coding to be written](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/readers-urging-spec-coding-to-be-written-0e03d257.webp)

Last week, when chatting with a colleague about Spec Coding, he asked: "Claude Code can already write code on its own, so why spend time writing specifications?"

This is a very practical question. AI writes code quickly indeed; demos, scripts, and disposable pages can be rapidly validated with relatively loose constraints.

However, when moving the same playbook into long-term maintained, multi-person collaborative projects, missing information quickly turns into risk: areas where requirements are not clearly defined get filled in by the model, boundary conditions are guessed based on common patterns, and team-specific error codes and permission conventions might never make it into the context. Output is generated based on patterns the model learned and the current context, not an automatic discovery of your project's real-world constraints.

This article mainly addresses three questions:

1. The actual difference between Vibe Coding and Spec Coding, and when to use which
2. The complete Spec Coding implementation workflow, from writing requirements to having AI execute according to rules
3. How to configure, manage, and prevent AI from overstepping boundaries using Specs across mainstream AI IDEs (Cursor, Claude Code, Copilot, etc.)

## Vibe Coding Isn't Unusable

Vibe Coding means going with the vibe. You give the AI a vague intent, and it immediately starts churning out code.

When Karpathy first coined this term, he referred to tossing requirements to the AI, tweaking things continuously based on feeling, and even largely ignoring code details for the moment.

Vibe Coding is not an inherent sin. In fact, it is very suitable for the following scenarios:

- Validating an idea: whip up a quick demo to see how it looks
- Writing one-off scripts: run once and throw away
- Building small internal tools with very limited blast radius
- When complete tests provide a safety net after AI finishes writing, without exposing the code directly to external users

Under these conditions, rigidly writing a massive Spec is just a waste of time.

The real problem is: after validating an idea, many people casually push their "vibed" code straight to production.

That is an entirely different story.

During the demo stage, you can rely on intuition because if it's wrong, you fix it, and if it's broken, you delete it. Production code doesn't work that way—it connects to databases, payment gateways, user data, and other engineers' maintenance costs. The 30 minutes you save today could turn into several days of debugging later.

My rule of thumb is simple: **How long does this code need to live?**

- Scripts **thrown away in two days**: Vibe is plenty. Writing a Spec will only hurt efficiency.
- The middle ground of **3–5 days**: write a lightweight Spec. No need for a full design document—just write down key constraints and acceptance criteria; it can usually be done in half an hour.
- Code living **more than a week**: as long as other people need to maintain it, data needs to be persisted, or external APIs are integrated, never "naked-vibe" it. At the very least, write down constraints, boundaries, and acceptance criteria clearly.

Furthermore, pairing with lightweight Specs is completely fine in most cases; there is no need to be dogmatic.

A lightweight Spec can be as simple as this:

```markdown
## Task Objective

Implement an order export endpoint supporting CSV export by time range.

## Key Constraints

- Maximum 5,000 records per export
- Time range must not exceed 31 days
- Must validate user permissions; only export data belonging to the current tenant
- Query must hit the composite index `order_tenant_time_idx`
- If export fails, record the failure reason; do not just return an "unknown error"

## Acceptance Criteria

- Successfully export CSV with field ordering conforming to product conventions
- Return an explicit error when records exceed 5,000
- Unauthorized tenant data cannot be exported
- Unit tests cover four scenarios: empty time range, out-of-bounds time range, unauthorized access, and no data
```

## What Exactly Is Spec Coding?

Spec Coding literally translates to Specification-Driven Programming. Simply put: write the specifications clearly first, then let AI do the work.

When usually asking AI to write code, many people directly toss out a single line:

> Help me build a user system.

AI can certainly write it, and it will look decent on the surface. But that's precisely the problem: you didn't tell it what the user system should actually look like, so it can only guess.

How do users register? Can emails be duplicated? How are passwords stored? What format is returned when an API fails? Which features are out of scope for this release? Do administrators have the ability to ban users? If these aren't clarified from the start, AI won't pause to ask you clarifying questions; it will likely fill in a solution it considers reasonable.

Spec Coding simply writes these rules down in advance.

The "Spec" here is not just a couple of casually jotted requirements, but an actionable technical contract that AI can follow. Interfaces, data structures, error codes, boundary conditions, security requirements, tech stack constraints, and even operations that are strictly off-limits should all be documented inside.

That is where the difference between it and Vibe Coding lies.

Vibe Coding is more like giving AI a broad direction and letting it improvise freely. Once code is generated, you go in to accept, fix bugs, and patch details. For short, quick scripts, this works fine and can feel great.

However, once a project gets slightly more complex, things easily break down. By the time you notice AI misunderstood something, a pile of code has already been written. Looking back, it's hard to tell whether the requirements were unclear or AI went off the rails on its own.

To briefly summarize the difference between Spec Coding and Vibe Coding: **Is AI's behavior defined by you, or guessed by it?**

## A 4-Step Implementation Workflow

This article uses the four steps from the GitHub [Spec Kit](https://github.github.com/spec-kit/index.html) example—Specify, Plan, Tasks, and Implement—for explanation. It represents an actionable workflow rather than a universal standard followed by all Spec Coding tools; some teams merge design and task phases, while some tools add clarification, verification, or change management phases.

| Phase | What to Do | Output | Key Actions |
| --- | --- | --- | --- |
| **Specify** | Product Definition | `requirements.md` | Clarify features, users, pain points; determine "what to do" |
| **Plan** | Technical Planning | `design.md` | Choose tech stack, architecture, contracts; determine "how to do it" |
| **Tasks** | Task Breakdown | `tasks.md` | Break down into atomic tasks; write acceptance criteria |
| **Implement** | AI Execution | - | AI works per Spec; humans verify and accept |

It is very straightforward to understand. The core is **first clarify what to do, then clarify how to do it, then break down tasks, and finally hand over to AI for execution**.

![Spec Coding Pipeline Flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

### Specify: First Figure Out What to Do

The first step is `Specify`, which typically outputs `requirements.md`, or `spec.md`.

This step is somewhat like writing a PRD, but the target audience is AI.

Therefore, it cannot just describe a general direction; boundaries must be explicitly stated.

For example, if you write:

> Build a user system.

A human might find it okay, but AI will start guessing: How do users register? Can emails duplicate? What are the password requirements? Is third-party OAuth supported? Can admins ban users? What happens to their data when banned?

If you don't write it down, it will decide for itself.

A much safer way to write it:

> Support email registration and login; email must be unique; single-factor passwords must be at least 15 characters; third-party login is not supported in this phase; administrators can ban users; banned users cannot log in, but historical data is preserved.

This sentence tells AI what can be done, what cannot be done, and which boundaries cannot be crossed.

### Plan: Finalize the Technical Solution

The second step is `Plan`, which typically lands in `design.md` or `plan.md`.

Many people skip this step, thinking AI can write code anyway, so let it improvise.

And then problems arise.

If you don't specify the Java version, it might write Java 8 code; if you don't specify the Spring Boot version, it might use outdated conventions; if you don't define the error code format, it will return a different structure for each endpoint; if you don't define the layering strategy, it might dump business logic straight into the Controller; if you don't define database column naming conventions, it will follow its own habits.

Therefore, `design.md` does not need to be overly heavy, but several key constraints must be established first.

For instance, writing something like this is sufficient:

```markdown
## Tech Stack

- Language: Java 21 (LTS)
- Framework: Spring Boot 3.2.x (snapshot of existing project; new projects should choose versions per the current support matrix)
- Database: PostgreSQL 16
- Cache: Redis 7.x

## Architecture Design

- Layering: Controller → Service → Repository
- Communication: REST API + gRPC (internal services)
- Deployment: Docker + Kubernetes

## Interface Conventions

- API Spec: OpenAPI 3.0
- Error Code: Unified format {"code": "USER_NOT_FOUND", "message": "..."}
- Log Format: JSON, must include trace_id
```

You might think: isn't this just a design document?

It is indeed quite similar.

The difference is that traditional design docs are primarily written for humans. After reading it, a human understands the broad direction, and many remaining details can be filled in via team habits. For example, passwords must not be stored in plain text, error codes must be unified, logs must include `trace_id`—in a mature team, these things rarely need repeated emphasis.

AI is different.

If you don't write it, it guesses. If it guesses right, great; if it guesses wrong, you're the one left reworking the code.

Take password storage as an example. If you only write "login must be secure", the scope is too broad, and the model might choose an outdated scheme or one unsuitable for the current system.

A new system can specify rules like this, and then determine parameters based on server benchmarks:

```text
Passwords are saved using Argon2id hashes, with parameters determined via target server benchmarks, and algorithm versions recorded for future migrations.
If existing systems must maintain bcrypt compatibility, retain legacy hash verification and migrate incrementally to Argon2id upon successful user login.
The database stores salted hashes only, never plain text passwords; use maintained cryptographic libraries to generate random salts.
Single-factor passwords must be at least 15 characters, supporting a maximum length of at least 64 characters, without enforcing arbitrary uppercase, lowercase, numeric, or special character combinations.
Check against a leaked password blocklist during registration and password changes; enforce rate limiting on login endpoints.
```

These requirements come from the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html). Security parameters still require architecture review and empirical testing; do not simply copy example numbers directly into your Spec.

Error handling follows the same principle. Don't write "return friendly messages when API fails"—this statement carries virtually zero constraint. AI might return `error` on one endpoint, `message` on another, and throw raw exceptions elsewhere.

Write it explicitly:

```json
{
  "code": "USER_NOT_FOUND",
  "message": "User not found",
  "trace_id": "xxx"
}
```

Then add status code conventions:

```text
Return 400 for parameter errors.
Return 401 when unauthenticated.
Return 403 when unauthorized.
Return 404 when resources do not exist.
Return 409 for conflicts like duplicate emails or usernames.
```

This way, AI at least knows which direction to head.

Ultimately, `design.md` serves to reduce AI guessing and improvising. By stating rules for tech stack, interface formats, error codes, logging, concurrency, and security upfront, AI is far less likely to veer off track when coding later.

### Tasks: Make Tasks Small Enough to Accept

The third step is `Tasks`, usually written into `tasks.md`.

Do not immediately ask AI to "complete the user module" right away. That scope is far too broad. Registration, login, query, disabling, permissions, parameter validation, exception handling, and unit testing all crammed into one task will easily cause AI to miss things as it writes. When reviewing code at the end, you'll have to manually trace and patch missing items one by one.

On the flip side, don't break tasks down too finely either. "Create UserDTO", "Add email field", "Write an empty Service method"—tasks like these look detailed, but in practice they wear you down. You might spend more time maintaining task lists than letting AI write code.

The granularity I prefer is: one Task corresponds to one API endpoint, core operations on a single table, or a small feature that can be independently accepted.

For example, a user registration API task can be written as:

```markdown
### Task-001: User Registration Endpoint

Description: Implement user registration, including parameter validation, password hashing, and user persistence.

Acceptance Criteria:

- [ ] POST /api/v1/users returns 201 on success
- [ ] New passwords stored as Argon2id hashes with benchmarked parameters
- [ ] Single-factor passwords at least 15 characters, maximum length supporting at least 64 characters, and checked against a leaked password blocklist
- [ ] Login and registration related endpoints have rate limiting
- [ ] Email uniqueness enforced; duplicate registration returns 409
- [ ] Response body must include user_id, email, created_at
- [ ] Branch coverage meets project baseline (80% in this example), with assertions on all critical security branches

Estimated Time: 2h
```

What is truly valuable here is the acceptance criteria. Phrases like "ensure security", "code gracefully", and "good performance"—writing these is virtually equivalent to writing nothing. AI does not know what you define as secure, nor what degree of "grace" you expect.

However, things like storing passwords using benchmarked Argon2id parameters, returning `409` for duplicate emails, including `user_id`, `email`, and `created_at` in response bodies, and providing tests for critical branches—these can all be verified objectively without relying on intuition.

Do not mechanically apply coverage thresholds. Teams should determine baselines according to module risk, defect history, and test types; having effective assertions on critical branches such as permissions, financial amounts, state transitions, retries, and exception compensation is far more important than a single percentage figure.

### Implement: Let AI Do the Work

Prompts don't need to be mystical; simply inject the relevant Specs directly:

```text
Please implement Task-001 according to the following Spec.

Requirements Specification:
[Paste relevant sections from requirements.md]

Technical Constraints:
[Paste relevant sections from design.md]

Task Acceptance Criteria:
[Paste Task-001 from tasks.md]
```

Here lies a common pitfall: do not dump all Specs into the context all at once.

In a single session, I prioritize three types of content:

- Global constraints, such as code style, error code formats, logging rules;
- Requirements for the current task;
- Acceptance criteria for the current task.

Other content is supplemented on demand; do not paste every single document just for the sake of "completeness".

Regarding token limits per session, there is no universal threshold like 3,000–8,000 tokens across all models and tasks. A more practical approach is to inject global hard constraints, current task, and acceptance criteria first, and retrieve evidence on demand via indexes or file paths. Split sessions when irrelevant material begins to degrade reasoning quality or when tasks can be decoupled cleanly.

Don't expect a model to track everything within an excessively long context. The longer the context, the more likely key information gets buried in the middle, ultimately causing the most critical constraints to be overlooked.

I adhere to three principles myself:

First, write conventions into documents, not just in chat. Chat history can easily get lost or detached next time, whereas documents provide reusable context.

Second, quantify acceptance criteria wherever possible. "High performance" cannot be verified; `QPS > 1000`, `P95 < 200 ms`, and `branch coverage >= 80%` can be verified.

Third, keep Specs in Git, tracking them alongside code. When code changes, Spec must change too. Otherwise, when AI continues development later, it will be working off an outdated specification.

Once this workflow is running smoothly, AI won't magically become a genius, but its room for wild guessing will shrink drastically.

Next comes a very practical question: where should these Specs actually be stored, and how can tools automatically load them every time?

## How Spec Lands in AI IDEs

After writing a Spec, a frequently neglected question arises: **Where do these files actually go? How do we let AI read them automatically?**

Mainstream tools each have their own specification file mechanisms:

| Tool | Spec File Location | Scope | Loading Mechanism |
| --- | --- | --- | --- |
| **Cursor** | `.cursor/rules/*.mdc` (current) or `.cursorrules` (Legacy) | Project-level / Global | Rules can be set to Always Apply or attached via glob |
| **Claude Code** | `CLAUDE.md`, `.claude/rules/*.md` | Project-level / Directory-level | Root rules always resident; subdirectories or rules with `paths` loaded upon file access |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md` | Repo-level / Path-level | Repo instructions, path-level instructions, and Agent instructions loaded per client capabilities |
| **Windsurf** | `.windsurf/rules/*.md`, `AGENTS.md` (legacy projects may still have `.windsurfrules`) | Project-level / Directory-level | Workspace Rules and directory-level `AGENTS.md` loaded by scope |
| **Aider** | `CONVENTIONS.md` (repo root) | Project-level | Loaded via `--read CONVENTIONS.md`, or automatically via `read:` in `.aider.conf.yml` |

At this point, another question pops up: Cursor, Claude Code, and Copilot are daily coding entry points, so how should one choose among tools specifically built around Spec Coding like Superpowers, Spec-Kit, Open Spec, Kiro, and BMAD-METHOD?

That is a broader topic that warrants its own dedicated article. Here, let's first focus on how to write, store, and govern AI with Specs.

Once you know where to place them, another question follows: **Which Specs should be injected every time, and which should be brought in on demand?**

In practice, I typically divide them into two layers.

**Included in almost every session (Must Inject):**

- **Tech Stack**: Specify versions and key libraries clearly, e.g., Go 1.21 + Gin + GORM + PostgreSQL 14. Don't let AI guess version numbers.
- **Code Style**: Provide a few "gold standard" file paths or short code snippets demonstrating naming, error handling, and return formats. Do not permanently stuff 150–200 lines of code into every session's context.
- **Boundary Conditions**: Use three-color labels (explained below) to clearly delineate what can be done, what requires asking, and what is strictly forbidden.

These reside in the tool's always-on rules file, automatically injected into each session.

**Included only when relevant to the current task (Inject on Demand):**

- **Project Vision**: One or two sentences explaining why this project exists, e.g., "Extract user service from monolith, rewrite in Go, maintain API compatibility." Bring it up once when starting a new major task.
- **Command List**: List build, test, and run commands, like `make build`, `go test ./...`. Bring in when execution tasks are involved.
- **Directory Structure**: A tree diagram clarifying where code, tests, and documentation live. Only needed when adding new files.
- **Git Conventions**: Branch naming, commit messages, PR requirements. Bring in when Git operations are involved.

This division is based on frequency of use: global constraints must be followed in almost every session and deserve constant residency. Others are added per task, preventing unnecessary clutter in context. The more bloated a Spec becomes, the easier it is for AI to overlook the few truly essential rules.

## Three-Color Labels: What AI Can and Cannot Do

When AI encounters an operation it is unsure of, should it decide on its own or pause and ask you?

Three colors, three permission tiers.

![Three-Color Labels: Risk Control Mechanism for AI Decision Permissions](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-three-color-labels-2c376f8e.png)

- ✅ **Always (Auto-execute)**: Code checks, tests, formatting—AI can make the call directly. For example, automatically running `make lint` before committing.
- ⚠️ **Ask first (Requires confirmation)**: Changes that may affect other modules; AI drafts a plan and waits for review. Modifying database indexes or altering API routes falls into this category.
- 🚫 **Never (Strictly forbidden)**: Direct connection to production databases, committing secret keys, deleting production data. AI must stop and report an error immediately upon encountering these.

A few things are easy to overlook during implementation.

**Be strict rather than lenient at the start.** Put more operations under Ask First. After running for a week, see which operations AI gets right every single time, and then promote them to Always.

**Rules must be concrete.** "Important changes require confirmation" cannot be executed by AI—it doesn't know what counts as "important". It must be written as "Modifying existing API URL paths requires confirmation". "Be careful operating on databases" is also ineffective; write "ALTER TABLE operations require confirmation".

**Never rules cannot rely solely on AI's self-discipline.** Merely stating "Direct connection to production database is prohibited" in documentation cannot reliably stop it. AI will not proactively inspect its own output for violations. Never rules require defense-in-depth:

1. **Spec Declaration**: Influences AI generation propensity, but cannot act as a hard barrier
2. **Configuration Templates**: Do not include real secrets in `.env.example`, so AI has nothing to copy
3. **Pre-commit Hooks**: Regex scans for hardcoded secrets and production connection strings, intercepting commits automatically
4. **AI IDE Configuration**: Restrict read scope via permission rules and sandboxes; `.cursorignore` can reduce indexing and context access, but is not a comprehensive security boundary
5. **Secret Isolation**: Production credentials never reside in agent-accessible workspaces; use short-lived, least-privilege credentials

The more critical a Never rule is, the more it must be pushed down to the CI layer as a hard check. Stopping at "it's written in the documentation" will lead to disaster sooner or later.

**Review weekly**. Is AI pausing to ask too frequently? If so, some Ask First actions can be promoted. Has AI sneaked in unwanted actions? If so, add Never rules. Have new sensitive operations emerged in the project? Add them in.

## Managing Specs as Projects Grow

Small projects have few Specs, so tossing them manually into context works fine. Once modules multiply, stuffing everything into context fails completely; faced with a mountain of constraints unrelated to the current task, AI is more prone to straying.

Choose strategies based on scale.

![Spec Management Strategy: Layered Filtering + Precise Retrieval](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-spec-management-strategy-4ded0946.png)

### When Rules Are Few: Multi-File Storage

Splitting by domain is sufficient:

```text
specs/
├── global/              # Global constraints
│   ├── conventions.md   # Code conventions
│   └── architecture.md  # Architecture overview
├── backend/             # Backend specifications
│   ├── api/
│   ├── service/
│   └── persistence/
├── frontend/            # Frontend specifications
└── shared/              # Shared contracts
    └── dto.md
```

Inject only the two or three files relevant to the current task each time. Don't be greedy.

### When Manual Selection Becomes Strenuous: Summary Index

When picking files manually becomes tiring, have AI generate a catalog and keyword index first:

```markdown
## Spec Index

- [Database Design](specs/db/schema.md) - Keywords: PostgreSQL, index optimization
- [User API](specs/backend/api/user.md) - Keywords: REST, JWT, authentication
- [Order Service](specs/backend/service/order.md) - Keywords: transactions, idempotency
```

When details are needed, let AI proactively request them rather than dumping everything in upfront.

### When Keyword Indexes Frequently Miss: Evaluate RAG

The number of modules alone cannot determine whether to introduce RAG. Observe key signals first: the same concept is scattered across numerous documents, keyword searches frequently miss synonymous expressions, manual context selection is impairing delivery speed, and the team has the capacity to maintain permissions, index updates, and evaluation datasets. Once these conditions are met, evaluate full-text search, vector search, or hybrid retrieval.

Chunk size, Top-K, and similarity thresholds must all be tuned according to the embedding model, document structure, and task evaluation. Similarity distributions vary across models; `Top-K 3–5` and `> 0.7` cannot be reused directly across different models. Before going live, prepare at least one set of real questions to evaluate recall, precision, latency, and cost, while ensuring permission filtering occurs before results reach the model.

### One Rule That Works Regardless of Scale: Single Session, Single Task

```text
Session 1: Database Design
├── Input: global/conventions.md + backend/db/
├── Output: Complete entity design
└── Close Session

Session 2: API Implementation
├── Input: Session 1 output + backend/api/
├── Output: Complete Controller
└── Close Session
```

With a clean context, AI won't get derailed by leftover scraps from previous tasks. This single rule is more effective than any fancy retrieval strategy.

## Why Domain Knowledge Is So Critical

No matter how much data AI was trained on, it does not know the unique rules specific to your project; you must tell it proactively.

For example: in an e-commerce project, there is a business rule stating that discount coupons and flash-sale discounts cannot be stacked. If you don't write this rule into the Spec, AI will very likely apply both discounts. The code compiles, tests might even pass, but business logic is completely broken.

Such knowledge generally falls into several categories:

- **Business Rules**: Coupons and flash-sales cannot be combined; a single user can only claim a reward once per day
- **Technical Constraints**: Order pagination must use designated composite indexes; deep pagination (> 100 pages) switches to cursor-based queries, full-table scans prohibited
- **Historical Debt**: A third-party upload API only supports up to 5 MB and throws errors if exceeded, so validation must happen upfront in code
- **Performance Baselines**: Single-table queries kept within 50 ms; critical endpoints exceeding 200 ms must consider degradation or fallbacks

These items form the guardrails when AI writes code.

Today, many Spec-Driven Development philosophies treat Specs not merely as "documents written for humans", but as "executable constraints governing AI code generation".

Do not view Specs as something used only in early stages; they are required throughout subsequent implementation, verification, and maintenance.

However, writing rules in is not quite enough—it's best to append a completion self-checklist. AI tends to consider its job done the moment functionality is written, without proactively verifying these implicit constraints.

## Completion Self-Checklist

After completing a task, do not let AI simply announce "Completed".

At minimum, require it to run through a checklist itself. For instance, after finishing `Task-001`, it must confirm item by item:

- [ ] All API error responses conform to the unified format
- [ ] Database queries hit designated composite indexes
- [ ] Mutual exclusion logic between coupons and flash-sales is correctly implemented
- [ ] Unit tests cover boundary conditions including nulls, out-of-bounds, and concurrency
- [ ] Branch coverage meets project baseline, with assertions on all critical boundary branches
- [ ] Cyclomatic complexity does not exceed project static analysis thresholds; exceptions have review records

If any item cannot be confirmed, it cannot be glossed over; the reason must be stated explicitly.

AI easily confuses "code written" with "task completed". Yet in real-world projects, working code is only the first step. Error formatting, index hits, boundary tests, and complexity control are what keep you from taking the blame later.

## Pitfalls in Multi-Agent Collaboration

Some might ask: if one AI is not enough, can we deploy multiple agents?

Yes, but there are more pitfalls than you might expect.

![Multi-Agent 3-Agent Collaboration Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-multi-agent-pipeline-f6ec4d47.png)

The concept behind 3-agent collaboration is dividing responsibilities into coding, testing, and reviewing in a pipeline. The Coding Agent receives a Task and implements features; once done, it hands off to the Testing Agent to create test cases and run suites; after passing, it hands off to the Review Agent to inspect code quality; finally, humans perform final review and merge.

Here is a pitfall that must be highlighted upfront: the Testing Agent writes tests on its own branch, but the code under test resides on the Coding Agent's branch. If these two branches run in parallel, the Testing Agent either merges the coding branch first or cannot run tests at all.

Two working patterns:

**Serial Same-Branch (Recommended for Getting Started).** All three agents commit sequentially on the same feature branch, distinguishing roles via commit message prefixes. Simple, zero merge conflicts, and fits most projects.

```bash
git commit -m "[code] implement user registration API"
git commit -m "[test] add unit tests for user registration"
git commit -m "[review] fix null check in email validation"
```

**Chained Inheritance (Once Agent Capabilities Are Proven).** Testing Agent checks out from the coding branch, Review Agent checks out from the testing branch, and finally merges back into mainline from the review branch. Branches maintain an inheritance relationship rather than a parallel one, allowing each agent to see the output of its predecessor.

Scenarios where multi-agent setups crash are common: deadlocks (A waits for B, B waits for A; design dependencies as a DAG), infinite loops (agents iterate endlessly without stopping; enforce Max 3 rounds), and malformed outputs (JSON parsing errors; add validation and retries, up to 3 times). Setting up these guardrails in advance prevents the majority of issues.

To be honest, I am still exploring multi-agent workflows myself. Current experience indicates that the serial same-branch pattern covers 80% of scenarios. Complex orchestration carries a high probability of failure unless a dedicated team member maintains it.

## Specs Are Not Fire-and-Forget

After running several projects, a few habits have solidified.

**Progressive Refinement.** Don't try to draft a perfect Spec in one go. Start with a high-level outline, let AI get the skeleton running, and then flesh out details module by module.

**Modular Organization.** Keep APIs, database schemas, styling rules, error codes, and permission rules in separate files. Give AI only the context required for the current task each time.

**Continuous Iteration.** Whenever a Code Review uncovers an issue, or AI steps on the exact same rake again, update the Spec. Fixing only the code without fixing the spec ensures the same mistake will recur next time.

A high-frequency pitfall deserves special mention: when Task-001 was completed, the Spec defined the error format as `{"code": "USER_NOT_FOUND", "message": "..."}`. Two weeks later, the Spec was updated to add a `trace_id` field, but Task-001's code was left unattended. Spec and implementation quietly diverged.

Solution: perform blast radius assessments on Spec changes. Maintain a "modules depending on this file" list within each Spec file, and automatically trigger regression tests for affected modules when Specs update. In CI pipelines, add a check: whenever Spec files change, automatically run tests for associated modules.

## Useful Spec Templates

Here are the three templates I use most frequently; pick one based on your scenario.

**Template 1: OpenAPI Style, Suitable for API Development**

````markdown
## API: POST /api/v1/users

### Basic Information

- **Endpoint**: `/api/v1/users`
- **Method**: POST

### Request Parameters

| Field | Type | Required | Constraints | Example |
| --- | --- | --- | --- | --- |
| email | string | Yes | Email format | user@example.com |
| password | string | Yes | Single-factor password at least 15 chars, max at least 64 chars; no mandatory character composition | - |

### Response Format

- **201 Created**: User created successfully

  ```json
  { "id": "uuid", "email": "user@example.com", "created_at": "..." }
  ```

- **409 Conflict**: Email already exists
  ```json
  { "code": "EMAIL_ALREADY_EXISTS", "message": "Email already exists" }
  ```

### Acceptance Criteria

- [ ] New passwords use Argon2id parameters benchmarked on target servers
- [ ] Passwords checked against leaked password blocklist; rate limiting on registration and login endpoints
- [ ] Email uniqueness guaranteed by database unique index
- [ ] Branch coverage meets project baseline (example: 80%), with assertions on critical security branches
````

**Template 2: Gherkin Style, Suitable for BDD**

```gherkin
Feature: User Login

  Scenario: Log in with valid credentials
    Given the user has registered with email "test@example.com" and password "CorrectHorse123!"
    When the user submits a login request
    Then return a 200 status code and a JWT token
    And token validity is 24 hours

  Scenario: Log in with invalid password
    Given the user has registered with email "test@example.com"
    When the user submits login with an incorrect password
    Then return 401
    And error message is "Invalid credentials"
    And do not disclose whether the email or password was incorrect
```

**Template 3: Checklist Style, Suitable for Code Review**

```markdown
## Code Review Checklist

### Functionality

- [ ] Implementation matches Spec description
- [ ] Boundary conditions handled: nulls, out-of-bounds, concurrency
- [ ] Error handling is complete

### Quality

- [ ] Function length <= 50 lines
- [ ] Cyclomatic complexity meets project static analysis thresholds; exceptions have review records
- [ ] No duplicated code (DRY)

### Security

- [ ] No hardcoded sensitive credentials
- [ ] Inputs validated / escaped
- [ ] Permission checks in place
```

## Pitfalls Experienced Firsthand

Here are several mistakes I made personally.

Constraints were written too rigidly, depriving AI of normal flexibility. For instance, fixing every method signature in the Service layer left AI afraid to even rename a parameter. Specs define boundaries, not line-by-line pseudo-code.

Conversely, under-specifying constraints is far more common. When critical boundaries aren't defined, AI guesses. Guessing right is luck; guessing wrong is the norm. In one project, AI used MD5 to store passwords simply because the Spec didn't specify which cryptographic hash algorithm to use.

Specs updated without synchronization—this is the stealthiest trap. Code and documentation gradually drift apart, so the next time AI works, it receives an outdated specification and produces mismatched code.

One more: writing without verifying. A mountain of Specs written, but none integrated into CI, eventually devolves into empty formalism. If no one checks it after writing, it's virtually the same as not writing it at all.

That merge button should forever remain firmly in your own hands.
