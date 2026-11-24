---
title: "What is Harness? The Six-Layer Architecture of Harness Engineering and Agent Engineering Practices"
description: "What is Harness? Starting from Agent = Model + Harness, this article explains the six-layer architecture of an Agent Harness, context management, tool calling, verification feedback loops, and failure recovery, illustrating design trade-offs through engineering practices from OpenAI, Anthropic, Stripe, and others."
category: AI Application Development
head:
  - - meta
    - name: keywords
      content: What is Harness,Harness Engineering,Agent Harness,Harness Architecture,Harness Engineering Practices,AI Agent,Claude Code,Codex,AGENTS.md,Context Engineering,Agent Architecture
lang: en
sourceRef: zh-ref/ai/agent/harness-engineering.md
---


An Agent Harness is an execution system that runs externally to a large language model. It is responsible for organizing context, providing tools and runtime environments, and integrating authorization control, state management, result verification, and failure recovery into the task execution pipeline. Harness Engineering investigates how this external system should be architected and built.

In a coding evaluation conducted by Can.ac, simply swapping the file-editing interface boosted Grok Code Fast 1's benchmark score [from 6.7% to 68.3%](https://blog.can.ac/2026/02/12/the-harness-problem/). The model parameters remained completely unchanged; the dramatic difference stemmed entirely from what operations the interface exposed, how results were returned, and whether errors could be leveraged by downstream steps.

Such disparities explain common failure modes in AI Agents: repetitive tool invocations, ignoring constraints, or dropping state during long-running tasks can rarely be fixed merely by swapping models or adding a single prompt instruction. Tool interfaces, execution environments, feedback loops, and recovery mechanisms equally dictate whether a task can successfully proceed.

This article first examines the components and hierarchical layers of a Harness, followed by an in-depth comparison of real-world implementation trade-offs from OpenAI, Anthropic, Stripe, and Mitchell Hashimoto.

## What is Harness?

### Agent = Model + Harness

In engineering practice, the formula `Agent = Model + Harness` is frequently used to distinguish between two distinct halves. The model handles reasoning and generation; the Harness manages system prompts, tool invocations, file systems, sandboxes, orchestration workflows, middleware hooks, feedback loops, and behavioral constraints.

The model itself does not persist state across sessions, nor can it execute shell commands or inspect test outputs. The Harness must bridge task state, operational entry points, execution environments, and security perimeters so that model outputs translate into verifiable actions.

Vivek Trivedi of LangChain offered a highly practical framework in *The Anatomy of an Agent Harness*: first enumerate what the model can do, and then systematically supply what it cannot. Diagnosing failures along this axis anchors problems to concrete gaps—such as whether tool outputs are human-and-machine readable, whether task states are persisted, or whether failures return actionable remediation guidance.

![Agent = Model + Harness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-agent-equals-model-harness-arch-fe29369b.png)

### The Relationship Between Harness, Prompt Engineering, and Context Engineering

Prompt Engineering, Context Engineering, and Harness Engineering are ill-suited for flat, one-to-one comparison. Instead, they represent nested layers, each addressing an expanding scope of responsibility.

![Relationship Between Harness, Prompt Engineering, and Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-layers-arch-f559e799.png)

| Layer | Problem Solved | Core Focus | Typical Work |
| ----- | -------------- | ---------- | ------------ |
| Prompt Engineering | How to articulate instructions clearly | Helping the model understand intent and reducing local ambiguity | System prompt design, Few-shot examples, Chain-of-Thought guidance |
| Context Engineering | What the Agent should see | Providing the model with correct and necessary information at the right time | Context window management, RAG, memory injection, token optimization |
| Harness Engineering | How the system sustains execution, correction, observability, and recovery | Ensuring continuous correctness, drift correction, and fault recovery in long-chain tasks | File systems, sandboxes, constraint enforcement, feedback loops, observability |

For simple tasks, Prompt Engineering is often sufficient. If you are asking a model to polish copy, clear instructions usually yield good results. When external domain knowledge is required, Context Engineering takes center stage: you must place reference materials, retrieval outputs, and historical state in the right slots. But once tasks enter long-horizon, executable, low-tolerance commercial workflows, Harness Engineering becomes the principal bottleneck. Here, the Agent needs far more than the ability to "answer well"—it must execute, verify, rollback, and push forward autonomously.

A prompt can clarify local intent, but it cannot provide file access, test execution, state persistence, or failure recovery; these execution challenges must be borne by the Harness.

### What Components Does a Harness Contain?

To understand what belongs inside a Harness, invert the question: what is the model incapable of doing on its own?

Although modern LLMs appear versatile, from a systems standpoint they fundamentally operate as input-output functions. Given a block of context, they output text or structured function calls. A model does not natively remember history, cannot run commands on its own, does not know if code truly compiles or passes tests, and cannot automatically distinguish which pieces of information must be preserved and which should be discarded.

| What the Model Cannot Do | How the Harness Compensates | Corresponding Component |
| ------------------------ | --------------------------- | ----------------------- |
| Retain multi-turn conversation history | Maintains conversation history and injects it into context per request | Memory System |
| Execute code and run shell commands | Provides Bash and sandboxed code execution environments | Universal Execution Environment |
| Fetch real-time info (new library versions, API changes) | Connects Web Search, MCP tools | External Knowledge Retrieval |
| Manipulate files and operating environments | Abstracted file system, Git version control | File System |
| Verify whether its actions were correct | Provides sandboxes, testing tools, browser automation | Verification Loop |
| Maintain coherence during long-running tasks | Context compression, memory files, progress trackers | Context Management |

Assembling these components that "the model cannot do, but you require the Agent to achieve" yields the essential Harness inventory. LangChain similarly breaks it down: the file system handles persistence, Bash execution provides universal tooling, sandboxes isolate risks, memory mechanisms accumulate insights across sessions, and context compression combats quality degradation caused by bloated context windows.

## Advanced Harness Concepts

### What Does a Mature Harness Look Like?

The preceding breakdown viewed the Harness through the lens of "what the model lacks, the system supplies." Shifting to a systems architecture perspective, a mature Harness exhibits clean, decoupled layering.

To facilitate gap analysis, this article synthesizes these components into a six-layer architecture. Note that this is an analytical framework rather than an industry standard or formal specification:

![Six-Layer Architecture of Harness Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-six-layer-architecture-dad9b4cb.svg)

| Layer | Name | Problem Solved | Key Design Elements |
| ----- | ---- | -------------- | ------------------- |
| L1 | Information Boundary Layer | What the Agent should and should not know | Define roles and goals, prune extraneous information, structure task state |
| L2 | Tool System Layer | How the Agent interacts with the external world | Select tools, govern invocation timing, distill tool outputs, and feed back results |
| L3 | Execution Orchestration Layer | How multi-step workflows are sequenced | Guide the model along a structured track: understand goals, evaluate data, analyze, generate, verify |
| L4 | Memory & State Layer | How intermediate artifacts are managed in long tasks | Independently manage active task state, intermediate artifacts, and long-term memory to prevent state contamination |
| L5 | Evaluation & Observability Layer | How the Agent verifies whether it succeeded | Establish verification mechanisms decoupled from the generation process |
| L6 | Constraints, Validation & Recovery Layer | What happens when things go wrong | Predefined rules intercept errors; provide retry, rollback, or fallback paths on failure |

You can conceptualize this as setting up a workplace for a new employee. L1 is the job description, defining what they should focus on; L2 is their toolbox; L3 is the standard operating procedure (SOP); L4 is the project management board and notebook; L5 is quality assurance; and L6 represents compliance guardrails and incident response plans.

These six layers span the entire journey from information boundaries to automated fault recovery. Although OpenAI, Anthropic, and Stripe adopted differing technical designs, their architectures can all be systematically mapped onto these layers.

When starting out, you do not need to construct all six layers at once. Begin with L1 and L6: L1 defines task boundaries and inputs, while L6 intercepts unauthorized actions, catches failures, and provides recovery when outputs fall short. As tasks grow into multi-step sequences requiring intermediate artifact persistence or iterative verification, layer in tool orchestration, state management, and observability.

### Why Is the Bottleneck Rarely the Model?

Can.ac's benchmark demonstrates that tool invocation schemas alone dramatically sway task completion rates. Similarly, after LangChain refined system prompts, tool schemas, and middleware, and leveraged trace analytics to optimize its verification loops, its score on Terminal Bench 2.0 jumped [from 52.8% to 66.5%](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering), climbing from outside the top 30 into the top 5—without changing the underlying model.

Consequently, when an Agent behaves unreliably, inspect its tool interfaces, error outputs, and verification loops first. If interfaces make it difficult for the model to convey operational intent, or if test failures return cryptic, uninformative errors, switching to a more powerful model merely causes it to repeatedly stumble over the exact same hurdles.

Beware also of model-harness coupling. Products like Claude Code and Codex co-tune models and tool logic concurrently; once a model grows accustomed to a specific tooling harness, its performance may degrade when ported to another. LangChain observed on the Terminal Bench 2.0 leaderboard that Opus scored lower inside Claude Code's Harness than it did under alternative harnesses.

The most effective Harness for your specific workload is not necessarily the one bundled with the model during post-training. Selection should be anchored to your task's tooling requirements, constraints, and verification needs, rather than blindly defaulting to the vendor's out-of-the-box harness.

### Why Does Feeding More Context Make the Agent Dumber?

During a public demonstration, Dex Horthy observed a revealing phenomenon: once context window usage crosses approximately 40% of its 168K token capacity, Agent output quality begins to degrade noticeably. While this percentage stems from specific models and benchmarks and should not be treated as a universal constant, the trend is unmistakable:

![The 40% Threshold Phenomenon in Context Utilization](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

| Zone | Usage | Behavior |
| ---- | ----- | -------- |
| Smart Zone | 0 - ~40% | Focused reasoning, accurate tool calls, high-quality code generation |
| Dumb Zone | > ~40% | Increased hallucinations, circular reasoning, broken formatting, degraded code |

Anthropic encountered a similar hurdle, which they termed "context anxiety." As context windows filled up, Sonnet 4.5 grew hesitant, often attempting to wrap up early even with tasks unfinished. Compression alone proved inadequate; they ultimately turned to context resets: clearing the active context window entirely while preserving critical state via structured handoff documents.

Context management must actively retain materials required for the immediate task while promptly evicting stale or irrelevant history. Frontline engineering teams adopt progressive disclosure and tiered context architectures precisely to prevent verbose tool logs, superseded decisions, and duplicate documentation from drowning the model's attention.

In production, monitor context utilization and run empirical benchmarks to identify optimal trigger points for compression, segmented execution, or handoffs. The 40% threshold serves well as an initial hypothesis to test, but should not be codified into hard alerting rules without empirical replay data.

### Where Should You Begin Building a Harness?

Drawing from frontline engineering practices, action items can be sequenced by priority. There is no need to engineer a monolithic system from day one; getting P0 right usually delivers immediate, tangible improvements in Agent performance.

#### P0: Do Immediately

| Action | Rationale | Reference Practice |
| ------ | --------- | ------------------ |
| Create and continuously maintain `AGENTS.md` | Loaded automatically on agent startup, updated after failures to form a feedback loop | Hashimoto: each line corresponds to a historical failure case |
| Build custom Linters + fix instructions | Error messages instruct the Agent exactly how to rectify issues | OpenAI: linter errors bundle remediation steps |
| Move team knowledge into the repository | Knowledge stranded in Slack, Wikis, or Docs is poorly accessible to Agents | OpenAI: repository as the single source of truth |

A common pitfall here: do not turn `AGENTS.md` into a bloated super-system prompt. Many teams attempt to pack every conceivable rule into it from the outset, exhausting the context window and causing the Agent to drift. OpenAI's approach is far more disciplined: `AGENTS.md` serves strictly as a directory of approximately 100 lines, pointing to modular sub-documents loaded on demand.

#### P1: Add Once P0 Is Stable

| Action | Rationale | Reference Practice |
| ------ | --------- | ------------------ |
| Tiered context management | Avoid dumping all information into a single file; disclose progressively | OpenAI: treats AGENTS.md as an index of ~100 lines |
| Establish progress files and feature matrices | Track state via JSON; Agents rarely corrupt structured data | Anthropic: two-phase Initializer Agent + Coding Agent |
| End-to-end verification capabilities | Allow the Agent to validate functionality just like an end-user | Anthropic: utilizes Playwright / Puppeteer MCP |
| Regulate context utilization | Use internal evaluations to establish compression and handoff thresholds, preventing historical bloat | Dex Horthy: Smart Zone vs. Dumb Zone observations |

#### P2: Consider When Bandwidth Permits

| Action | Rationale | Reference Practice |
| ------ | --------- | ------------------ |
| Agent specialization and division of labor | Each Agent carries less irrelevant context, staying within the Smart Zone | Carlini: specialized deduplication, optimization, and documentation agents |
| Periodic garbage collection | Cleanup velocity must keep pace with generation velocity | OpenAI: background cleanup agents |
| Observability integration | Transforms performance tuning from intuition into measurable metrics | OpenAI: integrates Chrome DevTools |

### What Maturity Stage Is Your Harness In?

The following rubric helps pinpoint your current Harness maturity stage. Advancing from Level 0 to Level 1—with `AGENTS.md`, basic linters, and manual verification—already catches a major fraction of high-frequency errors; there is no need to target Level 4 out of the gate.

| Stage | Characteristics | Engineer Role |
| ----- | --------------- | ------------- |
| Level 0: No Harness | Raw prompts given directly to Agent; no structured constraints | Manually writes code, uses AI sporadically |
| Level 1: Basic Constraints | `AGENTS.md`, basic linters, manual testing | Primarily writes code, assisted by AI |
| Level 2: Feedback Loops | CI/CD integration, automated testing, progress tracking | Focuses on planning and code review |
| Level 3: Specialized Agents | Multi-agent division of labor, tiered context, persistent memory | Designs environments and supervises execution |
| Level 4: Autonomous Loops | Unattended parallel execution, auto-cleanup, self-healing | Architectural design and quality assurance |

## Unsolved Challenges in Harness Engineering

Alongside these practical successes, unresolved challenges must also be laid bare. While public case studies abound, mature, universally applicable methodologies remain scarce—especially when applied to legacy codebases.

| Challenge | Current State | Who Is Focusing on It |
| --------- | ------------- | --------------------- |
| Brownfield project modernization | Public practices exist in legacy repos, but cross-team playbooks remain immature | Stripe Minions operates in massive legacy codebases; Böckeler highlights that ambient affordances (type systems, module boundaries, framework abstractions) heavily impact modernization costs |
| Verifying that the Agent did the right thing | Teams are adept at constraining errors, but verifying true functional correctness remains weak | Böckeler critiques: validating AI-generated code with AI-generated tests is akin to "checking your own homework with the same set of eyes" |
| Long-term maintainability of AI-generated code | LLMs frequently reinvent existing wheels; long-term maintainability remains unproven | Raised by Greg Brockman; currently lacks clear answers |
| Thick vs. Thin Harness | Manus rewrote its harness five times to make it simpler; OpenAI grew increasingly complex over five months | Driven by scenario. General-purpose tools lean minimal; domain-specific products require deep customization. As models improve, harnesses should be pruned; Anthropic has verified this |
| Single-Agent vs. Multi-Agent | Hashimoto insists on single-agent; Carlini runs 16 parallel agents | Dictated by scale. Single-agent is sufficient for small projects; large endeavors naturally migrate toward specialized roles |

Greenfield and brownfield projects represent classic software engineering paradigms. A greenfield project starts from scratch with zero legacy baggage, like constructing a building on an open plot with total architectural freedom. A brownfield project involves remodeling an existing codebase steeped in legacy architecture, technical debt, and historical logic, akin to urban renewal where underground utilities cannot be disturbed.

Stripe Minions operates inside massive legacy repositories. For a decade-old codebase lacking clean modular boundaries and burdened by technical debt, the first imperative is making compilation and test pipelines deterministically reproducible, followed by attaching localized rules and structural checks to high-churn directories, and finally expanding automated execution boundaries.

## Case Studies: How Frontline Teams Build Harnesses

While these teams tackled problems of varying scales, all had to solve for context, constraints, and verification. The difference lies in posture: some teams reacted by adding safeguards after failures occurred, while others proactively embedded constraints and feedback loops throughout the execution path.

### OpenAI: 3 Engineers, 5 Months, 1 Million Lines, Zero Handwritten Code

Consider the [data disclosed by OpenAI](https://openai.com/index/harness-engineering/):

| Metric | Value |
| ------ | ----- |
| Team Size | 3 engineers, later expanded to 7 |
| Duration | 5 months, starting August 2025 |
| Codebase Scale | ~1,000,000 lines of code |
| Handwritten Code | 0 lines; engineers authored design constraints |
| Merged PRs | ~1,500 PRs |
| PRs/Engineer/Day | 3.5 PRs |
| Productivity Gain | Team estimates time spent was ~1/10th of manual authoring |

These numbers reflect intensive, specialized organizational investment and should not be used as baseline expectations for general engineering teams. The analysis below deconstructs their underlying engineering techniques.

#### Give the Agent a Map, Not a 1,000-Page Manual

OpenAI's `AGENTS.md` spans approximately 100 lines. It functions as an index pointing to modular design documents, architecture diagrams, execution plans, and quality rubrics housed in `docs/`. The Agent first loads the index relevant to its immediate task, and then selectively fetches deeper documents as needed, preventing the complete rulebook from polluting every session.

Agent Skills adopts the exact same progressive disclosure paradigm: lightweight metadata like names and descriptions permanently reside in the context, while comprehensive schemas and workflows load only when a matching scenario triggers. This standardizes the index-style pattern of `AGENTS.md`. For related reading, see [Agent Skills Deep Dive: What Are They? How to Use Them? How Do They Differ from Prompts and MCP?](https://javaguide.cn/ai/agent/skills.html).

#### Architectural Constraints Must Be Mechanically Enforced

OpenAI defined a strict, immutable layer hierarchy for each domain:

```text
Types → Config → Repo → Service → Runtime → UI
```

Dependency direction cannot be inverted. How is this guaranteed? Via custom linters and structural tests. When a rule is breached, tools do not merely throw errors—they explicitly output instructions on how the Agent should refactor the code. In fixing these violations, the Agent is continuously steered toward the team's architectural idioms.

OpenAI stated this principle plainly: *If it cannot be enforced mechanically, agents will deviate.* Constraints documented merely in text will inevitably be ignored; if they cannot be enforced mechanically, drift is guaranteed.

#### Observability Must Be Accessible to the Agent

The team wired the Chrome DevTools Protocol directly into the Agent's runtime, enabling it to capture DOM snapshots and screenshots autonomously. Metrics, logs, and distributed traces were likewise exposed to the Agent via a localized observability stack.

Consequently, an optimization objective like "reduce application startup latency below 800ms" becomes a goal that the Agent can independently measure, benchmark, and verify.

#### Entropy Does Not Disappear on Its Own

The more code AI generates, the more low-quality implementations, duplicated logic, and documentation drift accumulate. Initially, OpenAI engineers spent 20% of their Fridays manually cleaning up these artifacts. Eventually, this process was automated: background cleanup agents continuously scan for documentation drift, architectural violations, and dead code, submitting automated cleanup PRs.

When code generation outpaces cleanup velocity, duplicate logic and stale documentation steadily degrade repository hygiene, poisoning the context retrieved by future Agent runs.

#### Knowledge Trapped in Slack Is Unusable by Agents

Knowledge shared in Slack channels or Google Docs is inherently unstable and fragmented from an Agent's perspective. OpenAI mandated storing all institutional knowledge as version-controlled artifacts directly in the repository, making the repo the single verifiable, auditable source of truth.

OpenAI acknowledged that without comparable organizational investment, teams should not expect to mirror these productivity multiples. For general engineering teams, establishing index-based documentation, mechanically enforceable constraints, and automated cleanup routines offers far more immediate utility than attempting to clone their entire pipeline.

### Anthropic: From Context Anxiety to a Three-Agent Architecture

Anthropic contributed two noteworthy engineering explorations: Nicholas Carlini building a complete C compiler with multi-agent parallelism, and Anthropic Labs pioneering a three-agent architecture inspired by GANs.

![Anthropic Three-Agent Collaborative Architecture (GAN-Inspired)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/anthropic-three-agent-collaborative-architecture-6a3be1b2.svg)

#### Building a C Compiler with 16 Parallel Agents

Nicholas Carlini spent approximately two weeks orchestrating 16 parallel Claude Opus instances across roughly 2,000 Claude Code sessions, producing a full C compiler achieving a 99% pass rate on the GCC torture test suite.

| Metric | Value |
| ------ | ----- |
| Duration | ~2 weeks |
| Parallel Agents | 16 Claude Opus instances |
| Total Sessions | ~2,000 sessions |
| Output | 100,000 lines of Rust |
| GCC Torture Test | 99% pass rate |
| Compilable Projects | 150+ major codebases (PostgreSQL, Redis, FFmpeg, CPython, Linux 6.9 Kernel, etc.) |
| API Cost | ~$20,000 |

Crucial Harness design choices in this project included:

- Directing logs to disk files rather than stdout, formatted into grep-friendly single lines such as `ERROR: [reason]`. Agents grep files only when diagnosing failures, preventing verbose test logs from consuming context.
- Sub-sampling tests: each Agent executed only a 1%–10% deterministic slice of the test suite. An individual Agent's slice was fixed across runs to track local regressions, while slices across virtual machines differed, collectively covering the entire suite. This prevented testing from becoming a multi-hour blocking operation for any single Agent.
- Progressive role specialization: Agents evolved into dedicated roles for compiler implementation, deduplication, performance optimization, code quality, and documentation. Because LLMs exhibit a strong tendency to re-implement existing utilities, deduplication was isolated into an independent stage.

Carlini reflected: *"I had to constantly remind myself that I was writing this testing framework for Claude, not for myself."* The core lesson: log formats, test partitioning, and error feedback must be engineered for automated Agent consumption, rather than optimized solely for human readability.

#### Why Anthropic Took Inspiration from GANs

In March 2026, Anthropic Labs unveiled a three-agent architecture inspired by Generative Adversarial Networks (GANs). As they clarified, *taking inspiration from GANs* meant borrowing the structural balance of generator versus evaluator, not training models adversarially:

```ebnf
Planner → Generator ⇄ Evaluator
```

The Planner receives a 1-to-4 sentence concept and expands it into an exhaustive specification, under explicit instructions to "be bold in scope." The Generator executes sprints feature by feature, each bounded by strict completion criteria. The Evaluator uses Playwright MCP to drive the running application, scoring it across product depth, functionality, visual fidelity, and code quality.

This architecture directly tackled two chronic issues:

| Problem | Manifestation | Resolution |
| ------- | ------------- | ---------- |
| Context Anxiety | Sonnet 4.5 rushes to finish prematurely as context fills up | Context resets + structured handoffs; compression alone is insufficient |
| Self-Evaluation Bias | Agents confidently over-praise their own mediocre work | Decouple generation and evaluation into independent agents |

In frontend tasks, design originality and visual polish were weighted more heavily than pure functionality, counteracting the model's tendency to settle for functional but aesthetically mediocre implementations.

#### Resetting Context in Response to Context Anxiety

Anthropic discovered that as context limits approached, Sonnet 4.5 became hesitant and prone to wrapping up prematurely before tasks were finished. Consequently, they instituted hard context resets.

Before triggering a reset, the system distills current task state, completed work, and pending items into a structured handoff document. A fresh Agent instance is then initialized, receiving only this handoff document and the assets required to continue. Historical conversation transcripts no longer consume tokens in the new session.

This approach hinges entirely on handoff fidelity: omitting modified files, failure rationales, or next-step verification commands causes the new Agent to resume from an invalid state. While Carlini structured his compiler project across ~2,000 discrete, isolated sessions, Anthropic formalized resets and handoffs into a first-class architectural mechanism.

Cost and outcome comparisons across configurations were stark:

| Configuration | Duration | Cost | Outcome |
| ------------- | -------- | ---- | ------- |
| Solo Harness: Single Agent + Minimal Tools | 20 mins | $9 | Unusable, broken prototype |
| Full Harness: Three Agents + Complete Toolchain | 6 hours | $200 | Fully functional, production-ready app |

For complex tasks, the gap widened further. For example, building a full in-browser digital audio workstation (DAW) under the Full Harness ran for nearly 4 hours and cost $124.70, producing a fully functional DAW complete with arrangement views, mixing consoles, and playback controls.

Crucially, they noted a vital takeaway: upgrading the model from Sonnet 4.5 to Opus 4.6 allowed the sprint mechanism to be discarded entirely, and the Evaluator was reduced from checking every sprint to validating once at the very end. Anthropic summarized this elegantly: *Every component in a harness encodes an assumption about what the model can't do on its own, and those assumptions are worth stress testing.*

When underlying model capabilities expand, previously essential Harness safeguards may become redundant overhead. Harness architectures must be continuously re-evaluated against new model baselines.

### Stripe: Unattended Mode Merging 1,300+ PRs Weekly

Stripe's Minions system represents an alternative extreme: fully autonomous, unattended execution. An engineer issues a Slack request, and the Agent takes over end-to-end—writing code, running CI, and submitting PRs—leaving humans to step in only for final code review. Over 1,300 pull requests generated entirely by Minions without human-written code are merged every week.

![Stripe Hybrid State Machine Orchestration Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/stripe-hybrid-state-machine-orchestration-archit-51d0f3ff.svg)

This volume is underpinned by a mature engineering ecosystem rather than an infallible, all-powerful Agent.

| Component | Role | Key Design Elements |
| --------- | ---- | ------------------- |
| Devbox | Development Environment | AWS EC2 with pre-baked source trees and services; allocated from warm pools in ~10s; "cattle, not pets" |
| Orchestration State Machine | Workflow Control | Hybrid deterministic nodes (lint, git push) and agentic nodes (feature implementation, fixing CI); rigid where required, flexible where creative |
| Toolshed MCP | Tool Services | Centralized MCP platform hosting nearly 500 tools; each Minion receives a scoped, filtered subset |
| Feedback Loops | Quality Assurance | Pre-push hooks fix lint errors in seconds; post-push allows up to 2 rounds of CI over 3M+ tests |

Stripe's orchestration embodies a hybrid pipeline: deterministic operations like linting and pushing code follow rigid code paths, whereas creative challenges like implementing features or parsing CI failures are delegated to the Agent.

Their governing philosophy is straightforward: *What's good for humans is good for agents.* Prior investments in Devbox environments, robust developer tooling, and developer experience (DX) yield immediate dividends when leveraged by Agents. Agents do not necessarily require separate infrastructure; they should simply be treated as first-class citizens of the existing development environment.

Minions is built as an internal fork of Block's open-source [goose](https://github.com/block/goose), heavily customized for unattended enterprise execution.

### Mitchell Hashimoto: One-Person Harness Engineering

Mitchell Hashimoto, creator of Vagrant, Terraform, and Ghostty, pursues an approach radically different from Stripe's. He strictly runs a single Agent at a time and maintains deep, hands-on involvement, explicitly stating: *"I don't run multiple agents, nor do I want to."*

His methodology unfolds across six disciplined steps:

| Step | Principle | Practice |
| ---- | --------- | -------- |
| 1 | Abandon chat interfaces | Embed the Agent directly into environments where it can read files, execute binaries, and issue HTTP requests |
| 2 | Reproduce your own work | Perform tasks twice: once manually, once via the Agent—a process he describes as "excruciatingly painful" |
| 3 | Dispatch tasks before signing off | Use the final 30 minutes of the workday to assign tasks (deep research, exploratory prototyping, issue triage) |
| 4 | Outsource deterministic tasks | Offload tasks the Agent is virtually guaranteed to succeed at; mute desktop notifications to eliminate context switching |
| 5 | Engineer the Harness iteratively | Every time the Agent fails, engineer a system-level safeguard so it never repeats that specific class of error |
| 6 | Keep an Agent running constantly | Strive to have background Agents actively working for 10%–20% of your total working hours |

Ghostty's `AGENTS.md` is iconic: virtually every line maps directly to a historical failure case. It acts as an evolving, cumulative error-prevention system. Whenever the Agent commits a novel error, a corresponding rule is committed, systematically extinguishing that error class for future sessions.

![Continuously Evolving Harness Error-Prevention Feedback Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/continuously-evolving-harness-error-prevention-f-44ff3a27.svg)

### Birgitta Böckeler's Synthesis of Harness Engineering

Birgitta Böckeler, Distinguished Engineer at Thoughtworks, analyzed OpenAI's practices on Martin Fowler's site. Rather than enumerating features, she synthesized the problem into three fundamental engineering motions: controlling information ingested by the Agent, delegating constraints to mechanical tools, and actively managing generated entropy.

She categorizes Harness components into three pillars:

| Category | Core Focus | Typical Practice |
| -------- | ---------- | ---------------- |
| Context Engineering | Governing what the Agent sees and when | Evolving from monolithic AGENTS.md to index files + tiered documentation |
| Architectural Constraints | Preventing the Agent from drifting | Custom linters, structural tests, LLM-based constraint checkers |
| Garbage Collection | Combating entropy accumulation | Scheduled cleanup agents scanning for drift, violations, and dead code |

This taxonomy clarifies the apparent divergence across industry implementations: index-based `AGENTS.md` architectures belong to Context Engineering; linters, structural tests, and state machines constitute Architectural Constraints; and background cleanup agents handle Garbage Collection. They target separate failure modes and cannot be replaced by an overgrown system prompt.

She also posits that Harnesses will eventually crystallize into standardized service scaffolds. When an organization standardizes on a handful of technology stacks, development environments, linting suites, and toolsets can be pre-packaged; new services then dynamically load rules based on directory paths and task profiles. Yet scaffolds only streamline configuration—they can never replace comprehensive test suites, modular boundaries, or real runtime telemetry.

Brownfield projects expose these boundaries most starkly. Introducing an Agent into an aged codebase devoid of architectural guardrails often triggers an avalanche of type errors, dependency violations, and test failures. Böckeler uses the term *Ambient Affordances* to describe the structural properties provided natively by the codebase: strong typing enables compiler checks, crisp module boundaries allow enforceable dependency rules, and frameworks like Spring encapsulate implementation details. Stripe proved that legacy codebases can successfully host autonomous Agents; these ambient affordances must nonetheless be evaluated repository by repository.

Independent verification of functional correctness remains the final frontier. Architectural checks block illegal dependency directions, and cleanup routines purge duplicated code, but neither proves that end-to-end user journeys behave as expected. When tests and implementation code are authored by the same class of model, passing tests merely prove that shared assumptions were not violated. As Böckeler observed: *"This approach places heavy trust in AI-generated tests, which at present remains insufficient."* See her discussion on [functional behavior verification](https://martinfowler.com/articles/harness-engineering.html).

## Summary

Transforming an LLM's raw output into dependable, production-grade engineering deliverables requires information boundaries, tool interfaces, execution state, and verification loops working in unison. Can.ac's interface experiments, OpenAI's indexed documentation and mechanical constraints, Anthropic's state handoffs, and Stripe's deterministic orchestration all target the critical execution phase *after* the model generates tokens.

In practice, start with the shortest viable feedback loop: provide clear entry points and constraints, grant the Agent the ability to compile and run tests, and format failure outputs into actionable instructions for the next turn. As tasks expand in scope, introduce state persistence, context compression, and end-to-end verification; as code volumes grow, automate periodic cleanup for duplicated logic, stale docs, and architectural drift.

Finally, continuously re-evaluate your Harness as model capabilities evolve. That a linter, evaluator, or multi-agent pipeline was once indispensable does not mean it must be retained forever. Preserving mechanisms that catch genuine errors while pruning components that merely inflate context and orchestration overhead is the true hallmark of effective Harness Engineering.

## References

- [Can.ac: The Harness Problem in Coding Evaluations](https://blog.can.ac/2026/02/12/the-harness-problem/)
- [LangChain: Improving Deep Agents with Harness Engineering](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)
- [OpenAI: Harness Engineering in Practice](https://openai.com/index/harness-engineering/)
- [Birgitta Böckeler: Harness Engineering for Coding Agent Users](https://martinfowler.com/articles/harness-engineering.html)
