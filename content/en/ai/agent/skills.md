---
title: What Are Agent Skills? How Do They Really Differ from Prompts and MCP?
description: An engineering perspective on Agent Skills, exploring their connections and boundaries with Prompts, Function Calling, and MCP, how to write robust SKILL.md files, how to design lazy loading and progressive disclosure, and common pitfalls to avoid.
category: AI Application Development
lang: en
sourceRef: zh-ref/ai/agent/skills.md
head:
  - - meta
    - name: keywords
      content: Agent Skills,MCP,Function Calling,Prompt,AI Agent,Lazy Loading,Context Injection,SKILL.md
---

A single code review might need to scrutinize architecture, security, performance, and project conventions. Shoving these rules into an ad-hoc prompt works temporarily, but as soon as you switch sessions, you have to paste them all over again.

Global project conventions can reside in `AGENTS.md`, while the review inspection sequence, checklist items, and reference materials should be loaded specifically alongside the review task. Skills provide a dedicated entry point for this kind of specialized knowledge.

## What Are Agent Skills?

A Skill is an operational instruction set that can be discovered and read on demand by an Agent. Interface return schemas, logging fields, slow SQL troubleshooting workflows, and code review priorities can all be codified into a `SKILL.md` file.

A Skill itself does not provide executable tool capabilities. It addresses the question of "what rules and procedures should be followed when performing this category of task", with the host system passing the corresponding instructions to the Agent whenever a task triggers the Skill.

## How Do Skills Relate to Prompts, MCP, and Function Calling?

They occupy different positions within the same execution pipeline: a Prompt explains what the user wants to accomplish, Function Calling initiates actions, MCP connects to external capabilities, and a Skill defines the procedures and constraints governing task completion.

Take the request "help me analyze this report" as an example: what the user says is the **Prompt**. When the model decides to invoke `read_file` and generates structured arguments, it uses **Function Calling**; if `read_file` is provided by an external MCP server, **MCP** handles the connection and communication protocol.

Meanwhile, "first clarify column definitions, then detect anomalies, and finally formulate business conclusions—do not just dump raw statistical metrics" is governed by a **Skill**. It specifies the operational sequence and constraints, without replacing the user's initial request, the underlying tool calling mechanism, or external service connections.

![Comparison between Skill, Prompt, Function Calling, and MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-prompt-function-calling-mcp-comparison-0566edb1.webp)

Placed within a real execution pipeline, the flow looks like this:

![Agent Execution Chain](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

1. The user states a task (Prompt)
2. The host places short descriptions of available Skills into context (Skill Metadata)
3. The model determines that the current task matches a specific Skill (Skill Routing)
4. The host loads the full `SKILL.md` into context (Lazy Loading)
5. The model follows the workflow in the Skill to call tools, read materials, and write results (Execution)

Tools are not an obligatory part of a Skill. The Code Review Expert skill in [sanyuan-skills](https://github.com/sanyuan0704/sanyuan-skills) merely mandates reviewing code across SOLID principles, security, and performance; whereas the TDD Skill in [Superpowers](https://github.com/obra/superpowers) requires the Agent to run tests, inspect outputs, and determine next steps.

Consequently, Function Calling is a capability that might be leveraged when performing actions, whereas a Skill is essentially on-demand **context injection**. `load_skill()` is also a conceptual notion rather than a standardized cross-platform API name; discovery and loading mechanisms differ significantly across Claude Code, Cursor, Codex, and GitHub Copilot.

## ⭐️ How Should SKILL.md Actually Be Written?

### Basic Structure

A minimal working Skill is quite straightforward: just a directory containing a single Markdown file named `SKILL.md`.

Folders like `scripts/`, `references/`, and `assets/` are not mandatory, but complex Skills frequently employ them—for instance, placing utility scripts needed by the Skill inside `scripts/`.

```text
skill-name/
├── SKILL.md          # Main file, loaded upon activation
├── scripts/          # Utility scripts (executed, do not need to be loaded into context)
├── references/       # Reference documents (loaded on demand)
└── assets/           # Templates and static assets (loaded on demand)
```

A `SKILL.md` file comprises two parts:

1. The opening **YAML frontmatter metadata**, telling the host "who I am and when I should be used";
2. The subsequent **Body**, detailing concrete workflows, constraints, examples, and error handling.

To learn how to write high-caliber Skills, examining top open-source Skills is the best approach.

Here we look at [Superpowers' TDD Skill](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md) as an example.

Its frontmatter consists of only two lines:

```yaml
---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---
```

While TDD involves the Red-Green-Refactor cycle, the description of this TDD Skill does not mention it at all; it specifies when to use the skill in a single clear sentence. The body then elaborates on the exact procedure, simplified below:

```markdown
# TDD

## Rule

Write a failing test before production code.

If you did not watch the test fail, the test is not trusted.

## Flow

1. **RED**: Write one small failing test.
2. **VERIFY RED**: Run it. Confirm it fails for the expected reason.
3. **GREEN**: Write the smallest code to pass.
4. **REFACTOR**: Clean up without changing behavior.

## Use For

- Features
- Bug fixes
- Refactoring
- Behavior changes

## Ask Before Skipping

- Throwaway prototypes
- Generated code

## Done Checklist

- [ ] Test written first
- [ ] Failure observed
- [ ] Minimal code added
- [ ] Tests pass
```

### Examining the Official skill-creator First

[`skill-creator`](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) is a meta-skill provided by Anthropic's official Skills repository for crafting new Skills. It instructs an Agent to first clarify the target task, trigger conditions, and boundaries, before deciding which instructions remain in `SKILL.md` and which should be factored out into `scripts/` or `references/`.

It embodies two practical tradeoffs: the `description` must enable the host to accurately identify applicable tasks; steps that can be reliably executed by deterministic scripts and lengthy references needed only in specific scenarios should be separated from the main file. Claude's official guidance also recommends accessing such supplementary materials on demand.

### Metadata (Frontmatter)

Metadata determines whether a Skill can be properly discovered and triggered. Generally speaking, at least two fields must be clearly written: `name` and `description`.

`name` serves as the identifier for the Skill, primarily used by systems and humans for localization; `description` functions as a routing directive, informing the Agent when this Skill should be loaded into context—that is, when to use it.

First, consider `name`. It has several strict constraints:

- Maximum 64 characters
- Lowercase letters, numbers, and hyphens only
- No XML tags
- No reserved words such as `anthropic` or `claude`

When naming, gerunds ("verb + -ing") are strongly recommended. This makes it instantly obvious what capability the Skill provides.

| **Good Names** | **Poor Names** |
| --- | --- |
| `processing-pdfs` | `helper`, `utils` (too ambiguous) |
| `reviewing-code` | `documents` (too generic) |
| `test-driven-development` | `tools` (says nothing) |
| `analyzing-spreadsheets` | `anthropic-helper` (contains reserved word) |

`description` is even more critical. If the `description` is poorly formulated, the Skill will fail to trigger when it should. An Agent does not read every Skill's `SKILL.md` in advance; it evaluates descriptions to determine whether a Skill warrants loading.

A `description` should be neither too terse nor overly verbose. A well-crafted `description` needs to articulate two things clearly:

1. What this Skill does
2. Under what circumstances/scenarios it should be used

The Superpowers TDD skill cited earlier satisfies these criteria perfectly.

It is also helpful to include keywords users are likely to mention, such as PDF, forms, extraction, commit message, git diff, etc. This makes both rule-based pattern matching and semantic retrieval much more accurate.

```yaml
# ✓ Good: states capability, scenario, and trigger keywords
description: Extract text and tables from PDF files, fill out forms, and merge documents. Use when handling PDF files or when the user mentions PDFs, forms, or document extraction.

# ✗ Avoid: first-person phrasing + unclear trigger criteria
description: I can help you process PDF files.

# ✗ Avoid: states capability only, with no indication of when to use
description: Process Excel files.
```

Consider several real-world examples:

```yaml
# Superpowers TDD
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code

# sanyuan-skills Code Review Expert
name: code-review-expert
description: Expert code review of current git changes with a senior engineer lens. Detects SOLID violations, security risks, and proposes actionable improvements.

# Git Commit Assistant
description: Generate descriptive commit messages by analyzing git diff. Use when the user asks for help writing commit messages or reviewing staged changes.
```

Conversely, counter-examples that only state concepts, are excessively broad, or lack trigger conditions:

```yaml
# Anti-pattern for Superpowers TDD: explains concept only, omits trigger timing
name: test-driven-development
description: Helps with test-driven development and writing better tests.

# Anti-pattern for Code Review Expert: too generic
name: code-review-expert
description: Helps review code and improve quality.

# Anti-pattern for Git Commit Assistant: feature name only
description: Generate commit messages.
```

### The Body

The body contains the operational instructions that the Agent reads only after matching the Skill. During startup, typically only `name` and `description` participate in routing; once the body is loaded, it shares precious context window space with system prompts, user requests, and existing materials.

Therefore, the body should retain only default procedures, project conventions, inputs/outputs, and failure handling necessary for task execution. Burying operational rules within lengthy expository text makes them harder for the Agent to locate when needed.

![Why context degrades](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

When filtering body content, ask yourself:

- Does the Agent genuinely require this explanation?
- Is this private project-specific knowledge, or general background common sense?
- Is this paragraph worth consuming limited context tokens?

When processing PDF text, the body should provide the default library and invocation syntax directly:

````markdown
## Extracting PDF Text

Use pdfplumber for text extraction:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

A body that opens with a treatise on PDF formats and lists competing tools provides zero utility for the Agent's next step:

```markdown
## Extracting PDF Text

PDF (Portable Document Format) is a widespread file format commonly containing text, images, and other content.
To extract text from a PDF, specialized PDF processing libraries are required.
There are numerous libraries available for this purpose, such as pypdf, pdfplumber, PyMuPDF, etc.
Here we suggest using pdfplumber because it is easy to pick up and covers most general text extraction scenarios.
First, you need to install it via pip, and then write the following code...
```

What the Agent needs is: what to use by default, how to call it, how to handle outputs, and how to branch when edge cases arise. Private constraints unique to the project that cannot be inferred from general pre-training knowledge must be spelled out explicitly, for example:

```markdown
The users table employs soft deletes. All production queries must include `WHERE deleted_at IS NULL`.
```

This constraint directly impacts query correctness, whereas general definitions of soft deletion do not belong in a Skill:

```markdown
Soft deletion is a common data deletion pattern where database records are not permanently removed, but flagged via a status field.
```

When the main file becomes unwieldy, extract content required only during specific sub-steps into separate files. Anthropic recommends keeping `SKILL.md` body text under 500 lines, relying on progressive disclosure to read detailed references on demand.

![Keep SKILL.md content under 500 lines for best practice](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

For example, a Code Review Skill's main file need only indicate when to inspect SOLID rules:

```markdown
When performing SOLID design reviews, read `references/solid-checklist.md`.
```

`references/solid-checklist.md` stores the concrete checklist; when the task does not involve design reviews, the Agent does not need to load it.

These open-source Skill repositories demonstrate clean separation between main files and supplementary references:

- [Superpowers](https://github.com/obra/superpowers): Contains Skills for TDD, brainstorming, code review, etc.; the TDD structure is exceptionally clean, serving as a prime reference for body organization.
- [sanyuan-skills](https://github.com/sanyuan0704/sanyuan-skills): Code Review Expert splits granular check items into `references/`, keeping only trigger and loading instructions in the main file—a great model for progressive disclosure.
- [Anthropic Official Skills Repository](https://github.com/anthropics/skills): Baseline reference for directory hierarchies and conventions.

![Discover popular and essential Skills](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skillssh-b38444cf.png)

![Built-in skills in Superpowers](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/superpowers-skills-500a76a6.png)

In tools like Claude Code, Skills can be explicitly invoked via `/skill-name`, or the model can select them autonomously based on the task; once triggered, the workflow, constraints, scripts, and references are read.

## How to Balance Degree of Freedom?

Database migrations and production deployments demand fixed commands, parameters, verifications, and rollback steps within the Skill; mistakes in these operations often require recovering production data or restoring interrupted services.

Conversely, code reviews and architectural evaluations require nuanced judgment based on changes. The Skill need only fix review dimensions—security, performance, maintainability, project conventions—without prescribing a rigid file-by-file inspection order.

The table below delineates degrees of freedom based on task risk:

| **Degree of Freedom** | **Suitable Scenarios** | **Writing Style** |
| --- | --- | --- |
| High | Requires judgment and tradeoffs; no unique answer | Provide review directions; do not hardcode steps |
| Medium | Has a standardized template, but allows situational adjustments | Provide templates, parameters, and boundary conditions |
| Low | Fragile operations; high cost of failure | Provide exact commands; specify what must not be changed |

Superpowers' TDD Skill locks down execution sequence:

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Red, Green, and Refactor cannot be reordered; expected test failure must be observed before writing implementation code. The Skill further asserts:

```text
Write code before the test? Delete it. Start over.
```

The specific test subject, names, and assertions are determined by the feature at hand. Similarly, a Code Review framework can fix review axes around SOLID, security vulnerabilities, performance, and maintainability, while leaving specific issue identification to the Agent's analysis of the diff.

A low-freedom instruction set can look like this:

````markdown
## Database Migration

Run the following command:

```bash
python scripts/migrate.py --verify --backup
```

Do not modify the command; do not append additional flags.

If the command fails, halt execution immediately and return the error output to the user.
````

For code review tasks, specify inspection scopes rather than step-by-step commands:

```markdown
## Code Review

Key inspection dimensions:

1. Obvious bugs or unhandled edge cases
2. Security vulnerabilities
3. Performance impacts or resource leaks
4. Violations of established project conventions
5. Opportunities for simpler implementations

Prioritize issues that affect correctness and production stability; avoid nitpicking purely cosmetic formatting.
```

Here, no file reading sequence is mandated, but the review scope and reporting priorities are clearly bound. Restrict degrees of freedom when mutating data, dispatching requests, deploying, migrating, or deleting files; preserve latitude for analysis, review, summarization, and draft generation.

## ⭐️ Lazy Loading and Progressive Disclosure

![Skill Progressive Disclosure](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

### Why Can't We Cram All Skills into Context at Once?

An Agent's context window is finite, at least for now.

Furthermore, an expanded context window simply means it can hold more tokens, not that it automatically prioritizes critical signals. For instance, in a lengthy requirement document, the truly critical constraints might comprise just three sentences; buried among background narratives and supplementary descriptions, the model can easily overlook them.

This phenomenon is widely known as **Context Rot**: **as context lengthens and information becomes noisier, the model's reliability in leveraging context degrades.**

**Lost in the Middle** refers to the tendency of models to miss details positioned in the middle of long contexts (see [Why Context Degrades](./context-engineering.md#why-does-the-following-content-fail) for detailed explanations).

Therefore, a Skill must not be written as an exhaustive knowledge encyclopedia.

A far better approach is progressive disclosure: **provide the model with a lightweight index first, loading detailed contents only when actually required.**

![Progressive Disclosure](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-81bef310.svg)

Think of it like looking up information in a book: you do not memorize the entire book upfront; you scan the table of contents, locate the chapter, and turn directly to that page.

This is typically structured into three tiers:

![Progressive Disclosure (Three-Tier Model)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-three-layer-model-81f54306.png)

**1. Advertisement Tier: Informing the model that the Skill exists**

At initialization, only Skill metadata is loaded, such as `name` and `description`. This portion is brief, answering: who I am, and what scenarios I suit.

**2. Instruction Tier: Reading the body once matched**

Only when the Agent determines the current task is genuinely relevant does it load the corresponding `SKILL.md` body. The body contains procedures, rules, boundaries, and key examples. Keep it concise; Anthropic recommends keeping the body under 500 lines.

**3. Resource Tier: Reading granular details during execution**

If the body references files like `references/` or `scripts/`, the Agent reads or executes them on demand. For example, when executing a script, typically only script execution output needs to enter context; source code only enters context if it must be inspected or modified.

Hence, this pattern is commonplace:

```markdown
## Advanced Capabilities

**Form Filling**: For complete instructions, see [FORMS.md](FORMS.md)

**API Reference**: For all methods, see [REFERENCE.md](REFERENCE.md)
```

Only when the task involves form filling does the Agent read `FORMS.md`; standard text extraction bypasses it entirely.

### How to Organize Files in Real Projects

Taking a data analysis Skill as an example, files can be structured as follows:

```text
bigquery-analysis/
├── SKILL.md              # Overview and navigation, loaded upon match
└── reference/
    ├── finance.md        # Revenue, ARR, billing metrics
    ├── sales.md          # Opportunities, pipelines, accounts
    ├── product.md        # API usage, feature adoption
    └── marketing.md      # Campaigns, attribution, email metrics
```

The main file lists available datasets and corresponding documents, leaving metric definitions to individual reference files:

```markdown
# BigQuery Data Analysis

## Available Datasets

**Finance**: Revenue, ARR, billing → see [reference/finance.md](reference/finance.md)

**Sales**: Opportunities, pipeline, accounts → see [reference/sales.md](reference/sales.md)

**Product**: API usage, feature adoption → see [reference/product.md](reference/product.md)

**Marketing**: Campaigns, attribution, email → see [reference/marketing.md](reference/marketing.md)
```

When a user asks "how did the sales pipeline look last quarter?", the Agent opens only `reference/sales.md`; finance, product, and marketing documents remain unread.

Conversely, deeply nested references make it hard for the Agent to navigate:

```markdown
SKILL.md → advanced.md → details.md → the most critical rule is hidden here
```

Keep baseline usage and immediate references visible directly in the main file:

```markdown
SKILL.md
├── Contains baseline usage directly
├── Advanced features → advanced.md
└── API Reference → reference.md
```

The Agent reads the main file and can immediately locate required resources. When reference files are lengthy, include a table of contents at the top to facilitate quick orientation.

## How to Design Workflows and Feedback Loops?

For simple tasks, a few high-level rules suffice. But for complex workflows, that is rarely enough.

An Agent might skip steps—such as checking output quality or executing unit tests—and prematurely claim that the task is finished.

To prevent this, two things must be clearly defined:

1. The exact sequence of steps to follow
2. The specific checkpoints where execution must halt and verify

![Skill Workflow Design](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-workflow-design-c78b8df8.webp)

Complex Skills must embed task classification, conditional branching, validation gates, and fallback strategies directly into their workflows.

### Stringing Steps Together with Checklists

Superpowers' TDD Skill provides an excellent template.

It avoids vague admonitions like "write tests before writing code." Such phrasing is too coarse, allowing the Agent to cut corners during execution.

Instead, it splits the workflow into explicit phases:

```markdown
### RED - Write Failing Test

Write one minimal test showing what should happen.

### Verify RED - Watch It Fail

**MANDATORY. Never skip.**

Confirm:

- Test fails, not errors
- Failure message is expected
- Fails because feature missing, not typos

### GREEN - Minimal Code

Write simplest code to pass the test.
Don't add features.

### REFACTOR - Clean Up

After green only:

- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.
```

**Verify RED** dictates that the Agent must witness the expected failure before writing implementation code.

The failure must stem from missing functionality rather than broken paths, syntax errors, or defects in the test itself.

Without this explicit mandate, Agents frequently write implementation first and then fabricate a test designed to pass immediately—defeating the purpose of TDD.

Completion criteria should likewise be framed as an actionable checklist:

```markdown
## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output has no errors or warnings
```

Every item in the checklist must be an inspectable action, such as "all tests pass" or "every new method has a test." Subjective requirements like "ensure quality" or "follow testing best practices" provide no objective verification criteria.

### Feedback Loops

Complex tasks need intermediate validation checkpoints baked into the workflow:

```text
Run → Verify → Fix → Re-verify
```

For instance, if a code review instruction simply requests a "comprehensive review," the Agent tends to address naming conventions, formatting, and comments first, overlooking core architectural flaws.

Structure the review into two distinct passes:

```markdown
## Code Review Workflow

1. Obtain changed file list and git diff

2. Phase 1: Design Review
   - Check if overall architecture is sound
   - Check for SOLID principle violations
   - If severe architectural defects exist, report immediately without proceeding to implementation review

3. Phase 2: Implementation Review
   - Check security risks: SQL injection, XSS, unauthorized access
   - Check performance hotspots: database queries inside loops, missing indexes
   - Check exception handling and boundary conditions

4. Output Findings
   - Tag severity: Critical / Warning / Suggestion
   - Provide concrete, actionable remediation suggestions
```

This workflow reviews design first, examines implementation second, and concludes with actionable suggestions.

### Conditional Branching

When a Skill handles multiple task varieties, map out conditions and branches clearly. Creating a new document versus editing an existing one requires divergent paths:

```markdown
## Document Modification Workflow

1. Determine task category

   **Creating new document?**
   Follow creation workflow.

   **Editing existing document?**
   Follow editing workflow.

2. Creation Workflow
   - Generate document using template
   - Export to target format
   - Verify file opens cleanly

3. Editing Workflow
   - Unpack existing document
   - Modify targeted content
   - Validate after each change
   - Repack upon completion
```

As branches multiply, retain decision logic in the main file while moving branch workflows into separate documents:

```text
workflows/
├── create-document.md
├── edit-document.md
└── export-document.md
```

The Agent reads whichever file corresponds to the active branch. The workflow dictates execution sequence, while feedback checkpoints enforce validation timing; missing either leads to skipped steps.

## How to Handle Skill Routing?

![Skill Routing Flow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-routing-flow-fa3e5a57.webp)

When a user submits "frequent Full GC," the router should select the JVM diagnosis Skill, eliminating database troubleshooting and document processing Skills. Once routing finishes, an actionable set of Skills is returned for loading.

With only three to five Skills, having the model read `description` fields is generally sufficient. As the count scales to dozens, a pipeline of "Recall Candidates → Re-rank → Make Decision" proves far more stable:

| Phase | Input & Processing | Output |
| --- | --- | --- |
| Coarse Recall | Vectorize request alongside Skill name, `description`, and typical query samples; retrieve top-5 via cosine similarity. | Small candidate set of Skills |
| Re-ranking | Evaluate match quality across names, descriptions, and examples; apply stricter thresholds for high-risk Skills (security, databases). | Ranked candidates by relevance and risk |
| Decision | Load Skill if top score satisfies threshold; if scores are universally low, load no Skill and proceed with default flow. | One, multiple, or zero selected Skills |

When a single request contains independent tasks, decompose them before routing. For example, "analyze GC logs and update deployment documentation" touches JVM diagnosis and technical documentation; a single generic Skill cannot properly govern both workflows.

For "frequent Full GC," coarse recall might surface `jvm-metrics-analyzer`, distributed tracing, and K8s event inspection; re-ranking against examples like "Full GC" and "stack traces" places the JVM diagnosis Skill at the top. If the prompt merely says "help me fix this," lacking semantic clues, the router should retain the default workflow rather than speculating on database migrations or production operations.

![Skill Routing Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-router-0696db9e.svg)

When a new Skill lacks historical queries, an overly abstract `description` impairs recall quality. The [Agent Skills Specification](https://agentskills.io/specification) does not mandate a generic `triggers` frontmatter field, and hosts do not guarantee reading custom fields. When maintaining your own dispatcher, store typical queries in an independent routing index:

```yaml
skill: jvm-runtime-diagnosis
examples:
  - "Endpoint is hanging"
  - "Frequent Full GC"
  - "Help me analyze this Java stack trace"
  - "How to troubleshoot a service OOM"
```

A custom router vectorizes `examples` alongside the Skill's `name` and `description`. When using third-party hosts, stick strictly to supported fields; do not inject custom routing indexes into all `SKILL.md` files, and never assume every host will parse them.

For dozens of Skills, computing similarity in-memory using NumPy is fast enough, with latency dominated by external embedding APIs. Cache query vectors first; only evaluate ANN indices or vector databases once the library grows to hundreds or thousands of Skills.

A general-purpose dispatcher can be broken down into four components:

| Component | Responsibility |
| --- | --- |
| Registry | Stores Skill metadata, routing indices, and embeddings. |
| Routing Engine | Recalls candidates, computes similarity scores, and applies thresholds. |
| Loader | Reads `SKILL.md` and required reference documents based on routing decisions. |
| Context Assembler | Injects loaded materials into the context of the respective task. |

The routing engine does not read Skill bodies, and the loader does not participate in scoring. Consequently, editing body text does not perturb recall scores, and swapping vector stores requires no changes to loading logic.

## Common Pitfalls When Writing Skills

### Writing a Skill Like a Project README

A README chronicles project background, installation, and features, leaving the reader to decide what to do next. An Agent executing a task requires actionable boundaries: when to use, what sequence to follow, when to halt, and how to recover from failure.

![Keep SKILL.md content under 500 lines for best practice](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

### Trying to Make One Skill Do Everything

Stuffing JVM, databases, K8s, API gateways, and message queues into a single "system troubleshooting" Skill forces the Agent to arbitrate between container metrics, gateway logs, and JVM rules whenever GC logs are pasted. Decomposing by problem domains directs inputs directly to relevant materials:

- `jvm-metrics-analyzer`: Focuses exclusively on JVM metrics, GC, and thread stacks
- `distributed-trace-finder`: Traces end-to-end latency via TraceId
- `k8s-pod-event-viewer`: Focuses on Pod health, restart causes, and event logs

GC logs route to JVM metrics; TraceIds route to distributed tracing; Pod restarts route to K8s events. Each Skill maintains only the rules and references tailored to its domain.

### Giving the Agent Too Many Choices

Listing pypdf, pdfplumber, PyMuPDF, and pdf2image without guidance leaves the Agent unable to discern which tool suits standard text PDFs versus scanned PDFs, risking improper OCR usage on digital documents:

```markdown
# ✗ Anti-pattern: Too many choices

You can use pypdf, pdfplumber, PyMuPDF, or pdf2image to process PDFs.
```

Specify default paths and exception conditions concurrently:

```markdown
# ✓ Recommended: Default approach + fallback strategy

Use pdfplumber by default for text extraction.
If dealing with scanned PDFs requiring OCR, switch to pdf2image + pytesseract.
```

Skills should prescribe default choices under normal conditions while making transition conditions explicit.

### Inconsistent Terminology

A single entity should maintain a unified term throughout a Skill. If "API endpoint" is used initially, do not switch to URL, API route, or path later in the document. When decision conditions reference terms, inconsistency breeds ambiguity.

### Assigning Deterministic Tasks to LLMs

Offload format conversion, arithmetic calculation, batch file processing, and data mutations to scripts:

- LLMs excel at judgment: understanding tasks, extracting parameters, determining next steps, and interpreting results.
- Scripts excel at execution: parsing files, converting formats, batch processing, and validating outputs.

When reading mandatory input files, scripts should throw informative errors rather than generating empty files that mask missing inputs:

```python
# ✓ Recommended: Explicit error conditions
def process_file(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError as exc:
        raise FileNotFoundError(
            f"Required input file missing: {path}. Please verify path or generate the file first."
        ) from exc
```

The snippet below merely passes underlying exceptions, leaving the Agent guessing whether to check the path or generate the missing file:

```python
# ✗ Anti-pattern: Crashing blindly, forcing the Agent to guess
def process_file(path):
    return open(path).read()
```

Configuration parameters should explain rationale behind constraints:

```markdown
# ✓ Recommended: Rationale behind configuration is apparent

REQUEST_TIMEOUT = 30 # HTTP requests should typically complete within 30 seconds
MAX_RETRIES = 3 # Three retries strike an optimal balance between reliability and latency
```

## Summary

Returning to our initial code review scenario: the Prompt conveys the review request, Function Calling executes tool calls, MCP connects to external files, databases, or GitHub, and the Skill preserves the review procedures and constraints.

The `description` must clearly articulate both the task and its triggering conditions, while the body outlines project conventions, execution steps, failure handling, and verification gates. Keep primary workflows in the main file, extracting details into `references/` and `scripts/`. Tighten procedures around migrations, deployments, and file deletions, while reserving necessary latitude for reviews and evaluations.

## References

- Anthropic Official Skills Repository: <https://github.com/anthropics/skills>
- Anthropic Official skill-creator: <https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md>
- Superpowers: <https://github.com/obra/superpowers>
- sanyuan-skills: <https://github.com/sanyuan0704/sanyuan-skills>
- Everything Claude Code: <https://github.com/nicekid1/everything-claude-code>
- skills.sh (Platform for discovering community Skills): <https://skills.sh/>
