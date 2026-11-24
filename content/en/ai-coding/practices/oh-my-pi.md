---
title: "Hands-on Experience with oh-my-pi: The Open-Source Terminal AI Coding Agent"
description: "An introduction to the core capabilities of oh-my-pi, covering its Hashline patching mechanism, LSP and DAP integration, built-in tools, multi-model routing, setup configurations, and practical usage tips."
category: AI Coding in Practice
lang: en
sourceRef: zh-ref/ai-coding/practices/oh-my-pi.md
head:
  - - meta
    - name: keywords
      content: oh-my-pi,omp,AI coding,terminal AI coding agent,Claude Code alternative,OpenCode,Codex CLI,Hashline,LSP,DAP,multi-model routing
---

I verified with friends at Alibaba that starting from July 10, Alibaba placed Claude Code on its high-risk software list and recommended internal employees use Qoder as an alternative.

I won't dive deeper into that discussion here.

Although Anthropic frequently pulls controversial moves, the Claude model and Claude Code are genuinely well-crafted. Compared to peers in the same category, it remains the most stable one out there. After all, it is a commercialized venture backed by top-tier talent with a very rapid release cadence.

In this product category, prominent alternatives include OpenCode, Codex CLI, Cline, Trae, Qoder, and DeepSeek TUI (which later rebranded to CodeWhale).

A couple of days ago, a community member shared a GitHub link to **oh-my-pi**, mentioning that it felt quite comfortable to use recently.

At first, I didn't pay it much heed, internally thinking: **Yet another terminal Agent? What makes it distinct from Claude Code, OpenCode, and Codex CLI?**

After testing it for a few days, however, my attitude shifted.

## What Is It?

oh-my-pi is an open-source terminal AI coding agent.

Once installed, you run the `omp` command inside your project directory, and you can immediately have it read code, edit files, execute shell commands, explain error logs, and generate commit messages.

This sounds quite similar to tools like Claude Code and Codex CLI.

The primary differences lie in the **tooling layer**.

It packs LSP, DAP, Hashline, browser automation, GitHub integration, subagents, and multi-model routing directly into the terminal.

For example, when renaming a function, it can query the language server for references rather than blindly guessing with `grep`; when debugging a crash, it can step into a debugger to inspect stack frames and variables; when reviewing a PR, it treats the pull request as a readable resource scheme.

There's also a very subjective perk: I really like its terminal UI—it matches my personal aesthetic tastes.

While not a core functional capability, anyone who stares at a terminal all day knows that a visually pleasing interface genuinely boosts your mood.

## Hashline

Many Agents edit files using basic `old_string -> new_string` replacement.

They read a block of code, have the model repeat the original snippet, and then the tool attempts string matching to apply the substitution.

Everyone has likely bumped into the pitfalls of this approach.

Miss a single space, add an extra newline, or shift indentation by a fraction, and the patch fails to locate its anchor. Worse still, if you manually edit a file mid-session while the model operates on stale context, mixing old and new content throws the working tree into chaos.

In oh-my-pi's `edit` tool, there is a feature called **Hashline**.

`@oh-my-pi/hashline` describes it as a compact, line-anchored patch language. Roughly speaking, when reading a file, each line carries a content hash; when editing, the model anchors changes around hashes rather than reciting entire paragraphs of original code.

![Official explanation screenshot of oh-my-pi Hashline](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-hashline-doc-eb301523.png)

If the file changes midway through and hashes no longer match, the patch is preemptively rejected.

This isn't merely about keeping patches concise; more critically, it introduces a robust layer of deterministic positioning and validation. Models cannot recite original text flawlessly every single time, so adding insurance at the tool layer is essential.

Official benchmarks claim Grok 4 Fast outputs 61% fewer tokens on comparable tasks. Because I haven't independently reproduced this benchmark, treat this figure as project-reported data indicating the trend.

Rather than token savings, I care far more about whether bad patches are intercepted early. In real projects, preventing one messy edit matters infinitely more than saving a few hundred tokens.

## Its Most IDE-Like Quality

Where oh-my-pi feels most like an IDE is how it exposes LSP and DAP—two staple IDE capabilities—directly onto the Agent's tool surface.

Officially, they are divided into two categories:

- `lsp` handles diagnostics, navigation, symbols, renames, code actions, and raw requests;
- `debug` handles DAP sessions including breakpoints, stepping, threads, stack traces, and variables.

These acronyms sound low-level, but in daily coding they are very intuitive to grasp.

**LSP answers what the code structure looks like.** For instance, where a function is defined, where it is referenced, what diagnostics exist in the current file, and what imports or re-exports a rename will touch.

Previously, when an Agent wanted to rename a function, it often had to `grep` first, and then guess whether hits referred to the identical symbol. This easily pulled in comments, string literals, and identically named variables. Especially in TypeScript projects rife with barrel exports, path aliases, and re-exports, plain-text search quickly breaks down.

If it can leverage LSP's rename, references, and diagnostics, it receives code relationships as understood by the language server. The model can still make poor decisions, but it is no longer blindly guessing from outside the AST.

This matters significantly to me.

When an Agent codes, my biggest fear is watching it guess call relationships with complete confidence, branching deeper on false assumptions. LSP at least provides a map much closer to what an IDE sees.

**DAP handles the other dimension: runtime.**

Previously, debugging with an Agent fell into a predictable rut: add logs, run, read output, add more logs. While functional, tracking native crashes, stalled Go routines, or hanging Python processes purely through logging is agonizingly slow.

With DAP, it can set breakpoints, step through lines, inspect threads, examine call stacks, and evaluate variables. What it gathers here is live runtime state, not just textual pattern matches.

Naturally, this does not guarantee it will fix every bug. However, what it looks at during debugging begins to mirror what an experienced human developer inspects: where did it halt, how did variables mutate, and only then deciding what patch to write.

I view this as "IDE capabilities brought to the terminal." It exists on a different plane than raw tool counts.

Subsequent tools like `eval`, `task`, `browser`, and `github` act as Agent workbenches; LSP and DAP are the core that make it genuinely feel like an IDE.

## An Exceptionally Rich Toolset

Most Agents maintain a restrained set of built-in tools: read file, search text, edit file, run command. Heavier tasks are usually offloaded to external MCP servers.

omp takes a different path. It ships with 32 built-in tools. While this sounds heavy, several tools are quite distinctive.

First is `eval`. It embeds resident Python and Bun JS kernels rather than disposable sandboxes. More crucially, these runtimes can invert calls back into omp's own tools, such as `read`, `search`, and `task`. An Agent can read a CSV inside a Python cell, seamlessly switch to a JavaScript cell to transform data, and never leave the active session.

Current multi-agent orchestration tools are `task`, `hub`, `todo`, and `ask` (superseding older references to `task` / `irc`). `task` fans out subagents, where each worker can use its own toolset or isolate into a separate worktree; `hub` coordinates live Agent messaging, `todo` tracks state, and `ask` poses structured inquiries. Tool arguments evolve quickly; refer to active tool descriptions for specifics.

`browser` is built on Puppeteer, incorporates stealth evasions, and can drive Electron applications via CDP. Note that stealth mitigations only diminish common automation fingerprints—they do not guarantee websites will treat it as a human user, nor can they bypass terms of service, login walls, or anti-bot protections.

`github` is one of my personal favorites. Instead of forcing the model to learn disparate CLI calls like `gh_issue_view`, `gh_pr_view`, and `gh_search`, it reads PRs as filesystem paths. The data returned by `read pr://1428` follows the same mental model as `read src/foo.ts`; `search` traverses diffs just like traversing directories. This abstraction extends to internal schemes like `pr://`, `issue://`, `agent://`, `skill://`, `rule://`, and `conflict://`.

I tested this on an issue from JavaGuide. It read the issue, tracked down the corresponding Markdown file in the repository, and followed embedded image links to inspect context.

![oh-my-pi reading a GitHub issue and tracking repo files](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-github-issue-read-001790b4.png)

There is also `advisor`, which mounts a dedicated reviewer model. It monitors the primary Agent's output on each turn, injecting inline reminders. Running in its own context on its own model, its sole purpose is catching blind spots missed by the primary Agent—much like having a dedicated critic sitting beside you.

Viewed individually, these tools aren't necessarily novel, but unifying them on a single tool surface feels distinctly cohesive. Reading local files, reading PRs, and reading subagent results all converge toward the universal action of "reading a resource," saving the model from juggling conflicting API schemas.

Yet having many tools brings a flip side: the routing layer becomes more complex, and opportunities for tool misfires increase. I strongly discourage turning on everything on day one.

Multi-model, multi-tool, and persistent memory sound intoxicating, but setup overhead, token costs, and permission boundaries swell proportionally. Tools like `bash`, `write`, `edit`, `browser`, `github`, and `ssh` demand clear consideration of their blast radius before enabling.

Several tools are disabled by default; check current `/tools` output or help commands rather than relying on static documentation.

To narrow tool access, use `--tools read,edit,bash,...` to expose only a vetted subset. Hidden capabilities are exposed on demand via the `xd://` resource discovery mechanism, superseding the legacy `search_tool_bm25`.

This conservative default is sensible. The greatest friction with terminal Agents rarely stems from having too few capabilities, but from granting too many permissions until you lose track of what it can touch.

## Multi-Model Providers and Role-Based Routing

The supported provider list was far more comprehensive than I anticipated.

Beyond mainstream providers like OpenAI, Anthropic, and Gemini, it includes coding subscriptions like Cursor, Copilot, Kimi Code, Moonshot, Tongyi, Qwen Portal, GLM, Xiaomi MiMo, and Qianfan; for local runtimes, Ollama, LM Studio, llama.cpp, vLLM, and LiteLLM are supported out of the box.

Additionally, it supports 5 role routes: `default`, `smol`, `slow`, `plan`, and `commit`.

I assign `default` to the primary model for routine reading, editing, and querying. `smol` is best delegated to subagents handling low-level batch file searches and scans—cheap, fast, with zero expectation of high-order reasoning.

When encountering architectural trade-offs, nasty bugs, or long-context reasoning, delegate to `slow` powered by a stronger, more expensive model. `plan` focuses on mapping which files to modify and structuring steps upfront, while `commit` handles templated copywriting for changelogs and commit messages.

![oh-my-pi assigning the same model to different roles in the model panel](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-model-role-actions-52913b21.png)

This keeps routine chat, subagents, deep reasoning, planning, and commit messages from crowding onto a single model. It represents cost and quality optimization rather than magically making a model smarter. In the main session, press `Ctrl+P` to cycle roles, or use `/model` to swap manually.

I wouldn't configure all of these right away. Run `default` stably first, then consider `smol` and `slow`. Fallback chains, path-scoped model routing, and multi-key rotation look tempting, but turning everything on immediately makes it nearly impossible to isolate where a failure originated.

## Getting Started

Installation is a one-line command.

macOS / Linux:

```sh
curl -fsSL https://omp.sh/install | sh
```

Homebrew:

```sh
brew install can1357/tap/omp
```

Bun:

```sh
bun install -g @oh-my-pi/pi-coding-agent
```

Windows PowerShell:

```powershell
irm https://omp.sh/install.ps1 | iex
```

The project requires `bun >= 1.3.14`, and the root `package.json` specifies `packageManager: bun@1.3.14`. If installing via Bun, check your version to avoid environment hiccups.

Once installed, test it on a non-critical repository:

```sh
cd your-project
omp
```

On your first launch, it doesn't immediately open chat; it walks you through interactive setup.

First, select which model provider to log into. You can connect multiple providers, such as ChatGPT Plus/Pro, Anthropic, Z.AI, Kimi Code, OpenRouter, Copilot, and Cursor. Providers with configured environment variables will display as logged in automatically.

![oh-my-pi initial startup model provider selection](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-setup-provider-login-kimi-994b23d3.png)

![Kimi Code membership benefits page](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-kimi-code-home-e8221039.png)

Next, switch to Web search to configure which search backend the `web_search` tool prioritizes. The project currently supports approximately 25 backends, so static lists date quickly. Choosing `Auto` selects from already configured backends, while manual mode aligns with the active setup page.

![oh-my-pi initial startup Web search provider selection](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-setup-web-search-f7913a34.png)

Don't overthink this step. Getting one primary model and one search provider running cleanly is far more solid than trying to wire up every account upfront.

After completing setup and returning to the main screen, my default model was already preselected, displaying `DeepSeek V4 Flash` on the left.

![oh-my-pi automatically selecting default model upon launch](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-welcome-default-model-389507e0.png)

I paused for a second: I didn't remember manually selecting DeepSeek, so why was it preconfigured?

I asked it directly. Its explanation was: oh-my-pi bundles an internal model catalog, scanning for available credentials in sequence—CLI flags, `models.yml`, keys/OAuth saved via earlier `/login` sessions, environment variables, and `.env` files. Once it discovers matching variables like `DEEPSEEK_API_KEY`, it flags models under that provider as available and automatically picks an initial model.

![oh-my-pi explaining why models are configured automatically](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-model-auto-config-reason-849590a0.png)

To switch models later, no restart is required—run `/model`. It displays only models backed by active credentials, with tabs organized by provider. Here I can see DeepSeek, Z.AI, Ollama, LM Studio, and llama.cpp entries.

![oh-my-pi switching models via model command](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-model-switch-b7c99a0a.png)

To inspect current commands and flags, execute:

```sh
omp --help
```

If you previously used Claude Code, Codex CLI, Cursor, Windsurf, Gemini, or Cline, it also inspects existing rules, skills, and MCP servers on disk. Directories like `.claude`, `.cursor`, `.windsurf`, `.gemini`, `.codex`, `.cline`, `.github/copilot`, and `.vscode` fall within its scan scope.

## Summary

oh-my-pi's distinctive strengths center on its tooling layer: Hashline enhances patch anchoring reliability, LSP and DAP expose code structure and live runtime state, while tools like `github`, `browser`, `task`, and `eval` unify disparate resources within a single session.

More tools also imply a wider permission surface. Capabilities like `github`, `browser`, `memory`, and `ssh` should be enabled selectively per task. When dealing with user accounts, private messages, repository writes, and remote hosts, always verify permission scopes, audit logs, and terms of service beforehand.

For developers already comfortable with terminal workflows who enjoy experimenting with models, tools, and permissions, it's well worth trying on a personal project. If you simply want a stable, zero-config tool that works immediately out of the box, Claude Code remains the more effortless choice.

What currently impresses me most about oh-my-pi is that it pushes the tool layer of open-source Agents forward. It is feature-packed, ambitious, and features distinct highlights—though trust must be earned through steady, incremental testing.

Repository: [https://github.com/can1357/oh-my-pi](https://github.com/can1357/oh-my-pi)

Official Website: [https://omp.sh](https://omp.sh)
