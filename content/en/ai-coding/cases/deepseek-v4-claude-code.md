---
title: "DeepSeek V4 + Claude Code in Practice: Deep Evaluation of Coding Capabilities"
description: "In-depth hands-on experience integrating DeepSeek V4 with Claude Code, testing across code auditing, database migration, and model upgrades to evaluate the real-world coding performance of V4-Pro and V4-Flash."
category: AI Coding in Practice
head:
  - - meta
    - name: keywords
      content: DeepSeek V4,Claude Code,AI Coding,Code Audit,Agent Coding,V4-Pro,V4-Flash
lang: en
sourceRef: zh-ref/ai-coding/cases/deepseek-v4-claude-code.md
---

On April 24, 2026, DeepSeek announced and open-sourced V4 Preview. While technical reports and community benchmarks are plentiful, what I care about most is how it performs when deployed into an actual codebase.

Open-source models have become quite mature in conversational Q&A and technical writing, with providers racing ahead in rapid succession. But Agent Coding is an entirely different beast.

Requiring a model to autonomously analyze project structure, comprehend multi-file dependencies, and deliver actionable engineering solutions demands exceptional code capability and tool-calling stability.

Previous open-source models continually made strides in this direction, but anyone who has used them in production knows there was always that slight gap preventing you from "confidently delegating tasks to run autonomously".

So when V4 was released, my immediate instinct was to wire it directly into Claude Code and put it to work.

This article records four parts:

1. **Two Ways to Connect Claude Code to DeepSeek V4**: Configuration file method + CC Switch visual switcher
2. **Five Hands-On Engineering Tasks**: How V4-Pro truly performs on the job
3. **Core Parameters and Pricing for DeepSeek V4-Pro and Flash**: Is it worth the switch?
4. **Scenario Recommendations**: When to adopt and when to wait and see

## Connecting Claude Code to DeepSeek V4

Claude Code's tooling ecosystem is very mature, but official Anthropic model API costs add up quickly. DeepSeek V4 provides an **Anthropic-compatible endpoint**, allowing Claude Code to connect directly without requiring intermediary translation proxies. However, a compatible API does not guarantee identical behavior to Anthropic models; tool calling, context handling, and new capabilities still need verification on actual tasks.

### Method 1: Configuration File (Recommended)

If you haven't installed Claude Code locally, install it via npm (Node.js 18+ required):

```bash
npm install -g @anthropic-ai/claude-code
```

Edit or create the Claude Code configuration file `~/.claude/settings.json`, adding an `env` block with your endpoint, model, and API Key:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_deepseek_api_key",
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_EFFORT_LEVEL": "max",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

Remember to replace `your_deepseek_api_key` with your actual DeepSeek API Key.

API Key management portal: <https://platform.deepseek.com/>.

![DeepSeek API Key Creation](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/deepseek-api-keys-2a8410a0.png)

The `[1m]` suffix here is used to request the 1M context window version of V4 Pro. If you prefer using Flash for everyday lightweight tasks, change `ANTHROPIC_MODEL` to `deepseek-v4-flash`; refer to the [DeepSeek Official Integration Documentation](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/) for canonical model IDs and mapping schemes.

Once configured, launch Claude Code:

```bash
claude
```

On first launch, you will be prompted to trust the current folder.

### Method 2: CC Switch (Visual Switcher)

If you want to toggle seamlessly between DeepSeek, Claude, MiniMax, and other providers, installing **CC Switch** is recommended. This is a lightweight utility dedicated to managing Claude Code model switching with single-click swapping, as well as managing Skills, MCP servers, and prompt templates.

![CC Switch Main Interface](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/cc-switch-main-interface-e00b8821.png)

Open CC Switch, click the **"+"** in the top right corner, select Custom Provider, enter `https://api.deepseek.com/anthropic` as the Base URL, and paste your DeepSeek API Key.

![CC Switch Add DeepSeek Provider](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/cc-switch-add-deepseek-provider-8a5a71f0.png)

Set the model name to `deepseek-v4-pro[1m]` (or `deepseek-v4-flash`), and click "Add" in the bottom right corner.

### Verifying Activation

Run `claude` in your terminal to launch Claude Code, then type `/status` to confirm. If the model indicates `deepseek-v4-pro[1m]` or `deepseek-v4-flash`, your routing is active.

![Verify Activation](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/verify-deepseek-v4-ready-b8e5e2fc.png)

From then on, you can drive DeepSeek V4 through Claude Code. Whether a third-party model supports specific new Claude Code features depends on API compatibility and real-world testing.

## Task 1: Updating Multi-Provider LLM Preset Model Lists

I had a multi-agent stock analysis project on hand that hadn't been touched in almost a month. Booting it up again, the first task was updating its obsolete model presets.

Previously, the project's Settings page only provided a plain text box requiring users to type model names manually—not very user-friendly.

I needed two things done: **search for the latest model versions from each LLM provider**, and **add a dropdown selector to the frontend UI**.

The prompt was straightforward:

> /tavily-search Search for the latest models from deepseek, glm, and openai, then adjust the default model recommendations and examples in global configuration. Also, the current LLM icons look too generic and AI-like; swap them out for something cleaner and more professional.

It was a compact task, but with an important nuance: without the `/tavily-search` Skill, relying purely on training data cutoff dates to guess the latest models almost guarantees errors. In past tests with other models lacking Tavily, I had to reprompt multiple times before getting accurate version names.

For Tavily integration details, refer to: [Claude Code with Tavily AI Search Engine for High-Quality Web Retrieval](https://mp.weixin.qq.com/s/kAk7lLVgYzZrD9xJs3AUkQ).

This time, V4-Pro completed the modification in a single turn.

![Search and update latest LLM models](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/search-and-update-latest-models-ee43d18f.png)

The model configurations were updated cleanly, with recommended models updated to the latest versions across three modified files:

1. **`application.yml`**—Added DeepSeek preset provider; updated GLM default model to `glm-5`
2. **`.env.example`**—Added DeepSeek environment variables; updated Kimi default to `kimi-k2.6`
3. **`SettingsPage.tsx`**—Added `PROVIDER_PRESETS` constant; converted Model and Embedding Model fields to combo boxes

The resulting recommended models across the four providers (as of 2026.04.25):

| Provider | Recommended Models |
| --- | --- |
| DashScope | 8 models including `qwen3.6-flash`, `qwen3.5-plus`, `qwen3-max`, `qwq-32b` |
| DeepSeek | `deepseek-v4-flash`, `deepseek-v4-pro` |
| GLM | 8 models including `glm-5.1`, `glm-5`, `glm-4.7-flash` |
| Kimi | 5 models including `kimi-k2.6`, `kimi-k2.5`, `kimi-k2-thinking` |

![Edit DeepSeek model configuration](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/edit-deepseek-model-config-a2030406.png)

## Task 2: Database Migration Diagnosis and Flyway Integration

The second task posed a greater challenge.

Having switched to a new machine, all environments were rebuilt from scratch. The project had two SQL files: one executed automatically on startup, while the other did not. Having forgotten the original setup logic, I tasked the model with diagnosing the cause.

![Skill management interface error](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/skill-management-error-f4a6d813.png)

Prompt:

> The current project has two SQL files: `sql/init.sql` ran automatically on startup, but `sql/V2__knowledge_skill.sql` was not executed. Please analyze the root cause and propose a sound, structured solution to fix this issue.

V4-Pro identified the direct cause: **`V2__knowledge_skill.sql` was not mounted in Docker Compose, and the project lacked a database migration framework**, whereas `init.sql` was executed purely via a static mount in Docker Compose.

![Database table unexecuted root cause analysis](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/database-table-analysis-79b714d8.png)

The solution it proposed was **integrating Flyway as the database migration framework**.

Flyway is one of the most established database migration solutions in the Java ecosystem, using naming conventions (such as `V1__init.sql`, `V2__knowledge_skill.sql`) to manage migration execution orders automatically.

Throughout this process, DeepSeek V4-Pro executed the following steps:

1. Analyzed Docker Compose mount logic for `init.sql`
2. Discovered why `V2__knowledge_skill.sql` was skipped
3. Introduced Flyway dependencies and authored migration configurations
4. Refactored SQL file naming to enforce proper execution order

> Note on an incidental pitfall: I accidentally resized my iTerm2 window midway through, which caused the terminal conversation history display to glitch momentarily.

On the first run, Flyway failed to trigger migrations. I pasted the error logs back, and after two rounds of adjustments, it resolved cleanly.

![DeepSeek Flyway integration summary](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/deepseek-flyway-integration-summary-abda32a8.png)

This issue deserves special attention—even DeepSeek V4-Pro stumbled on it during initial integration, taking two debugging cycles to find the root cause:

**Spring Boot 4.x heavily modularized its autoconfiguration modules**, moving `FlywayAutoConfiguration` out of `spring-boot-autoconfigure` into a dedicated `spring-boot-flyway` module.

If you only import the third-party library `flyway-core`, Spring Boot **will not trigger any migrations automatically**. Crucially, **the startup logs will not show any Flyway-related messages either**—no errors, just silent inaction. This pitfall easily misleads engineers into thinking their YAML configuration is wrong, wasting time endlessly tweaking config files.

Using the official starter brings along the necessary autoconfiguration module:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-flyway</artifactId>
</dependency>
<!-- PostgreSQL dialect support must still be declared explicitly -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

The concrete takeaway here: when integrating Flyway in Spring Boot 4.x, use the official starter rather than importing `flyway-core` alone and assuming migrations will run automatically. Whether other third-party libraries require dedicated starters must be verified against their corresponding Spring Boot version documentation.

## Task 3: Integrating DeepSeek into an AI Interview Platform

Our intelligent AI interview assistant platform recently added multi-model switching, now including DeepSeek support.

Just like Task 1, connecting the latest model succeeded on the first attempt, so there is no need to repeat the detailed setup steps. Let's look directly at the outcome.

Via the settings UI, switch the default model to DeepSeek, selecting **deepseek-v4-flash**.

![Switch interview platform model to deepseek-v4-flash](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/interview-guide-model-deepseek-v4-flash-69a60ea0.png)

Next, upload a resume and generate a mock interview based on it to observe results.

Interview questions were generated via deepseek-v4-flash, and answers were produced in fast non-thinking mode (with two questions left unanswered).

![Mock interview evaluation results](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/interview-guide-model-deepseek-v4-flash-intervie-39f3466c.png)

In this resume-based interview generation task, Flash in non-thinking mode answered the primary questions, though two remained unaddressed. It suits cost-sensitive batch generation tasks where human review is part of the loop.

## Task 4: Codebase Auditing and Multi-Model Collaboration

My multi-agent stock analysis project had an operational MVP supporting stock analytics, multiple strategies, alerts, skills, multi-model routing, and notifications. However, rushed development meant code quality hadn't been thoroughly scrutinized.

This time, I experimented with a strategy: **use cheaper models for auditing, and capable models for decision-making and remediation**.

Inside Claude Code, I instructed DeepSeek V4-Pro to spin up multiple sub-agents to scan the codebase across security, functional correctness, and code quality, consolidating findings into a review document.

![DeepSeek V4-Pro scans and analyzes code](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/deepseek-v4-pro-scan-analyze-code-d661db74.png)

V4-Pro surfaced numerous valid issues, including the TOP 5 urgent findings:

1. **Plaintext API Key Storage**—Encryptor implemented but not wired into persistence
2. **Missing Authorization on Admin Endpoints**—Standard users could alter global LLM configs
3. **Redis Deserialization Vulnerability**—`activateDefaultTyping` enabled arbitrary class instantiation
4. **Hardcoded Third-Party API Key**—Real Bocha secret committed in codebase
5. **Functional Bug**—History page "Re-analyze" button broken due to unparsed route params

Reviewing the findings, all were legitimate issues. The security findings were especially critical; vulnerability #3 (Redis deserialization) could lead to severe remote code execution if exploited.

Next, I passed the issues identified by V4-Pro directly to **GPT-5.5** (accessible in my account at the time) for cross-verification.

![GPT5.5 fixes problems identified by DeepSeek V4-Pro](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/gpt5-5-fix-problems-found-by-deepseek-v4-pro-2e9efb16.png)

**Why not have V4-Pro fix them directly?** Code auditing and code fixing require different cognitive profiles; cross-validating across different model families is more reliable—one surfaces candidate issues, while the other verifies and implements fixes.

GPT-5.5 verified the findings and implemented fixes. This records the model choices used at the time and does not constitute a static recommendation; final verification must always rely on automated tests, code review, and secret rotation rather than treating a second model's confirmation as proof of correctness.

This pattern leverages **low-cost model screening, capable model verification, and human/test acceptance**. Cost savings depend on input size, cache hit rates, output volume, and current pricing; without full billing logs, claims of "orders of magnitude savings" cannot be broadly generalized.

## Task 5: Full Project Scanning and Architecture Analysis

This task was straightforward: verify V4-Pro's analysis quality and observe token consumption.

![Prompt V4-Pro to scan and analyze agent-invest](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/claudecode-deepseek-v4-pro-1m--88d2621f.png)

![V4-Pro scan and analysis results for agent-invest](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-pro-scan-analyze-result-of-agent-invest-a139d9ee.png)

Here is the document produced by V4-Pro, outlining architecture, major modules, and pending technical debt:

![V4-Pro final output agent-invest document](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-pro-final-output-agent-invest-document-dde6bce5.png)

## DeepSeek V4 at a Glance: Looking at Numbers After Practice

Having evaluated hands-on engineering performance, looking at DeepSeek V4's hard technical specs provides clearer context.

V4 Preview offers two model variants. The specifications and benchmarks below come from DeepSeek's official release report, representing vendor-published findings rather than independent evaluations of this article:

| Specification | `deepseek-v4-pro` | `deepseek-v4-flash` |
| --- | --- | --- |
| Total Parameters | **1.6T** | **284B** |
| Activated Parameters per Token | 49B | 13B |
| Context Window | **1M tokens** | **1M tokens** |
| Reasoning Modes | Non-thinking / Think High / Think Max | Non-thinking / Think High / Think Max |
| Open Source License | MIT | MIT |

Key figures from the official report:

- **V4-Pro Codeforces Rating: 3206**, ranking highest among comparison models in the report
- **SWE-bench Verified: 80.6%**, compared to Claude Opus 4.6 at 80.8% in the report; this does not directly equate capability or cost parity in specific custom codebases
- **In 1M Context Scenarios**, V4-Pro inference FLOPs per token dropped to **27%** of V3.2, with KV cache consumption at only **10%**

Note that comparison model names and scores reflect historical snapshots at V4 Preview launch, not current rankings as of reading.

![V4 Benchmark Data](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-benchmark-7b6548e4.png)

Looking at pricing:

| API Pricing (per million tokens, as of 2026-08-24) | `deepseek-v4-flash` | `deepseek-v4-pro` |
| --- | --- | --- |
| Input (Cache Miss) Off-Peak / Peak | $0.22 / $0.44 | $0.66 / $1.32 |
| Input (Cache Hit) Off-Peak / Peak | $0.007 / $0.014 | $0.022 / $0.044 |
| Output Off-Peak / Peak | $0.66 / $1.32 | $1.98 / $3.96 |

> Peak hours are Monday to Friday 9:00-12:00, 14:00-18:00 Beijing Time; all other hours (including weekends) are off-peak, priced at 50% of peak rates.

Actual invoices depend heavily on cache hit rates, context lengths, and output sizes. Cross-vendor cost comparisons require standardizing input, output, cache, and retry parameters; check the [DeepSeek Official Pricing Page](https://api-docs.deepseek.com/quick_start/pricing/) for current figures.

Flash is clearly geared towards cost-sensitive tasks with easily verifiable outputs; whether it suits conversational Q&A or content generation depends on latency and quality requirements.

Model ID migration itself is straightforward, but teams must still test context handling, tool calling, and error paths rather than assuming zero-friction transitions. The vendor-announced sunset date for legacy models was **2026-07-24 15:59 UTC (23:59 Beijing Time)**; if reading past this date, verify active IDs via the model list API.

## Scenario Recommendations

| Scenario | Recommendation | Validation Focus |
| --- | --- | --- |
| Everyday chat, content drafting, simple Q&A | Start with `deepseek-v4-flash` | Quality, latency, cache hit rate |
| Agent Coding, code refactoring, repo analysis | Start with `deepseek-v4-pro` | Tool calling, cross-file edits, test pass rate, net cost |
| High-risk complex coding and independent review | Compare against Claude Fable 5, GPT-5.6 | Account access, success rate, safety guardrails, total cost |

The final row reflects a model family snapshot as of 2026-07-24; verify exact model availability in your account and vendor documentation.

## Summary

Across the tasks evaluated here, V4-Pro handled model configuration updates, migration troubleshooting, and initial code audit screening effectively. Official benchmarks like SWE-bench Verified 80.6% and Codeforces 3206 serve as reference points, but cannot replace evaluations against your own engineering codebase.

Whether V4-Pro is cost-effective depends on cache hit rates and task length. V4-Flash is cheaper, but missed two answers in our mock interview generation task; it should not be relied upon as the primary coding driver without human review.

Complex coding, nuanced reasoning, and frontier technical tasks still require comparative evaluation across models. My operational rule of thumb: start with Flash for low-risk batch tasks, delegate cross-file modifications and critical fixes to stronger models, and always retain automated tests and human acceptance.
