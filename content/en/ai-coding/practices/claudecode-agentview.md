---
title: "Claude Code Agent View: Managing Parallel Multi-Session Workflows"
description: "Anthropic's Agent View provides terminal-native multi-session management for Claude Code, enabling centralized monitoring of Agent statuses, direct input handling, and background session orchestration."
category: AI Coding in Practice
head:
  - - meta
    - name: keywords
      content: Claude Code, Agent View, multi-session management, parallel agents, AI coding, CLI tool, session orchestration
lang: en
sourceRef: zh-ref/ai-coding/practices/claudecode-agentview.md
---

Hello everyone, I'm Xiao G.

In my daily workflow with Claude Code, I often run several sessions simultaneously: one implementing a new feature, one refactoring, one running test suites, one diagnosing an error trace, and another triaging PR comments or drafting documentation.

![Opening multiple terminal windows to run multiple Agents in parallel across different sessions](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/multi-agent-parallel-sessions-c335f852.png)

Working like this used to be mentally exhausting. I would typically split Ghostty into multiple panes across several terminal tabs. The screen was packed with windows, giving the illusion of peak parallel productivity, but my brain was constantly tracking: Which session is still running? Which one finished? Which one is blocked waiting for permission approval? Which one crashed?

Worst of all, an Agent would often be waiting on confirmation without me noticing. By the time I switched back to check on it, it had been sitting idle for fifteen minutes.

Anthropic recently released **Agent View**, which takes over this operational burden. It aggregates all background sessions into a single list: working, awaiting input, completed, or failed—you can see everything at a glance. Claude is still the same Claude, but I no longer have to maintain that "session state matrix" in my head.

As I mentioned in [AI Coding: CLI or IDE?](https://mp.weixin.qq.com/s/6a3f2U6ZAJa2N7Cp10S01Q), novel AI coding workflows often debut in CLI environments first. Agent View is a prime example. However, note that it is primarily a "background session manager"—it is not yet a fully autonomous multi-agent orchestration platform that automatically decomposes tasks, delegates roles, and resolves merge conflicts.

If you are not yet familiar with Claude Code fundamentals, check out these two guides first:

- [Claude Code User Guide](https://javaguide.cn/ai-coding/practices/claudecode-tips.html): Sub-Agents, multi-instance collaboration (Multi-Claude), CLAUDE.md configuration, etc.
- [Claude Code Core Commands Deep Dive](https://javaguide.cn/ai-coding/practices/claudecode-commands.html): Practical usage of `/simplify`, `/loop`, `/batch`, etc.

## How to Launch Agent View

Agent View is currently in Research Preview and requires Claude Code `v2.1.139` or higher. You can verify your version:

```bash
claude --version
```

The most direct way to open it is by running in your terminal:

```bash
claude agents
```

![Launch directly from terminal with claude agents](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-d7153338.png)

Once launched, each background session occupies one line. On the left is the status icon, in the middle is the session name and its recent execution summary, and on the right is the runtime duration. Sessions are grouped by status by default, with sessions requiring your attention prioritized at the top.

Standard open Claude Code sessions do not appear here automatically. To background an active session, type:

```text
/bg
```

Alternatively, press the left arrow key `←` when the prompt input is empty. Both actions detach the session into the background without terminating the task. Later, use arrow keys to highlight the session and press `Enter` or `→` to resume the full conversation.

![Entering a specific Agent session](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/enter-agent-session-fb97ad7b.png)

## Check Yellow First, Then Check Red

When Agent View opens, I usually scan the status icons on the left first. They are far more informative than session names because they tell you exactly where your intervention is needed.

![Claude Code Agent View](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-20260518102539932-7c769093.png)

| Status | Visual Indicator | Action Required |
| --- | --- | --- |
| `Needs Input` | Yellow | Waiting for answers, permissions, or login; handle with highest priority |
| `Working` | Animated | Actively calling tools or generating output; leave it running |
| `Completed` | Green | Task finished normally; inspect diff, tests, and execution results |
| `Failed` | Red | Runtime error encountered; open summary or logs to diagnose root cause |
| `Idle` | Dimmed | Currently idle with no active task; ready for new prompts |
| `Stopped` | Gray | Manually stopped, or process was terminated externally |

A common misconception: the `Completed` section in the UI also groups failed and stopped sessions; the group header does not mean every task succeeded. Whether a task truly succeeded must be verified from the icon color and execution results.

Yellow is the most valuable status. In the past, I'd assume a session was still grinding away, only to switch tabs and find it had been stuck waiting on "Allow this command?" for twenty minutes. Now, if I see yellow, I attend to it immediately; if there is no yellow, I stay focused on my own work.

## Reply Without Switching Context

Highlight any session and press `Space` to pop up the Peek Panel at the bottom, displaying recent outputs or the question Claude is actively asking.

![Agent View: highlight a session and press Space to open Peek Panel](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/peek-panel-reply-7adc329a.png)

If it is just asking "Allow modifying this file?" or "Proceed with running tests?", you can reply directly inside the panel. The session receives the message and continues execution without forcing you to switch into the full conversation view.

Previously, you had to hunt down the right terminal tab, see what was blocking it, reply, and switch back. Now, a single tap of the spacebar handles it cleanly.

To inspect the full context, press `Enter` or `→` to enter the session; press `←` when finished to return to Agent View.

You don't need to memorize shortcuts; keybindings are shown at the bottom of the interface, and pressing `?` displays the complete reference list. Everyday essentials include:

| Shortcut | Function |
| --- | --- |
| `↑` / `↓` | Navigate session list |
| `Space` | Toggle Peek Panel |
| `Enter` | Enter session, or dispatch task if input box contains text |
| `Shift+Enter` | Dispatch task and immediately enter the new session |
| `Alt+1` ~ `Alt+9` | Jump directly to the N-th session |
| `Ctrl+T` | Pin or unpin current session |
| `Ctrl+R` | Rename current session |
| `Ctrl+X` | Stop session; press again within 2 seconds to delete |

Be cautious with pressing `Ctrl+X` twice. If the session uses an automatically created Claude Code Worktree, deleting the session may delete uncommitted changes inside that worktree as well.

## Offloading Tasks to the Background

In an active session, typing `/bg` immediately sends the task to the background:

```text
/bg
```

This backgrounds the current session and returns you to Agent View.

![/bg sends task to run in the background](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/bg-background-session-eb4d9f59.png)

You can also append an instruction before backgrounding:

```text
/bg Run all tests and fix failing test cases
```

If a task hasn't started yet, spawning a background session directly from your shell is even cleaner:

```bash
claude --bg "Fix all failing unit tests in auth module until all pass"
```

Tasks that are time-consuming but don't require continuous supervision are ideal candidates for the background:

- Running a test suite and attempting fixes on failures
- Checking a module for type errors
- Batch documentation cleanup
- Triaging PR reviews and drafting responses
- Applying small, coordinated changes across multiple repositories

Mitchell Hashimoto (co-founder of HashiCorp, author of Ghostty) shared an interesting habit in [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey): during the final 30 minutes of each workday, offload deep research, fuzzy idea explorations, and issue/PR triage to an Agent, and review the results the next morning.

He also wrote with realistic restraint: in an ideal world, an Agent would continuously handle useful work, but in practice, that only happens about 10% to 20% of the working day, usually running just one Agent at a time. This proportion reflects real-world software engineering far better than artificially forcing a dozen parallel tasks.

## Shell Commands

If you prefer not to enter the interactive Agent View UI, you can manage background sessions directly from your shell:

```bash
claude agents          # Open Agent View

claude attach <id>     # Switch into specified session

claude logs <id>       # Print recent output from specified session

claude stop <id>       # Stop session (claude kill also works)

claude respawn <id>    # Restart specified session, preserving conversation history

claude respawn --all   # Restart all running background sessions

claude rm <id>         # Remove session from list
```

A command that is rarely used but easily misunderstood is `respawn`:

```bash
claude respawn <id>
```

It restarts the specified session process while preserving the existing conversation transcript. It is useful when Claude Code updates and you want a background session to run on the new binary, or when a session process terminates unexpectedly.

`respawn` is not a Context Reset, nor does it generate a clean context. If the old session is already polluted with irrelevant logs and obsolete ideas, restarting the process will not cure context pollution. In that scenario, launching a fresh session with a verified task summary is much safer.

Furthermore, `claude rm <id>` primarily removes the session from the background list. The conversation history remains preserved on disk and can be retrieved via `claude --resume`; automatically generated worktrees are only cleaned up when confirmed safe.

## Dispatching Tasks Directly from Agent View

Agent View features an input bar at the bottom. Typing a task and pressing `Enter` creates a new background session; typing another task creates another new session rather than continuing the conversation in the previous one. To add instructions to an existing session, reply via the Peek Panel or enter the session directly.

The input bar supports several special prefixes:

| Input Format | Effect |
| --- | --- |
| `<agent-name> <prompt>` | If the first word matches a custom subagent, uses it as the primary agent |
| `@<agent-name>` | Specifies a custom subagent in the prompt |
| `@<repo>` | Selects another repository or directory to launch the session in |
| `/<command>` | Searches and runs a dispatchable Skill or command |
| `! <command>` | Launches a background shell task directly without calling a model |
| `#<number>` or PR URL | If an existing session is processing that PR, selects that session |

Custom subagents are typically placed in the project's `.claude/agents/` or user home `~/.claude/agents/`. Having a specialized agent for recurring tasks like code reviews or test analysis saves you from redefining tools and boundaries every time.

`#<number>` and PR URLs are also very practical. If a session is already handling that PR, Agent View highlights the original session to prevent duplicate modifications.

## Where It Fits Best

When deciding whether to delegate a task to Agent View, I evaluate two criteria: Can it progress independently without me for a while, and can its output be verified through diffs, test suites, or logs upon return? When both hold true, backgrounding it is very effective.

### Handling Independent Small Tasks Concurrently

For example, when you have 5 small tasks, you can delegate them across 5 sessions: one fixing a test, one checking type errors, one updating documentation, and two fixing unrelated bugs. Once dispatched, you stay focused on your primary task, then check statuses later: answer yellow items first, inspect logs on red items, and systematically review green items.

This assumes the tasks are genuinely independent. If five sessions modify the same files simultaneously, even with Worktree isolation, you will eventually have to reconcile merge conflicts and redundant implementations. Any time saved will be swallowed by code integration.

[Nicholas Carlini's C compiler experiment](https://www.anthropic.com/engineering/building-c-compiler) took concurrency to another scale: 16 Claude Opus 4.6 instances ran nearly 2,000 Claude Code sessions over two weeks, producing approximately 100,000 lines of code at a cost near $20,000. That experiment relied on Agent Teams and custom execution harnesses, rather than showcasing Agent View alone.

For everyday development, the key takeaways are task decomposition, role specialization, and test constraints. Without these foundations, opening more sessions merely accelerates conflict creation.

### Waiting on CI, Long Tests, and PR Reviews

CI pipelines, integration test runs, and PR reviews often involve waiting on external processes. Keeping the session in the foreground tempts you to constantly check on it; backgrounding it lets you ignore it until the status turns yellow, red, or green.

To check CI on an interval, use `/loop`; for tasks with a definitive stopping point (e.g., "keep fixing until tests pass"), use `/goal`. Agent View merely displays session statuses; the actual scheduling and continuous execution are handled by these commands.

[Stripe's Minions](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents) turned this pattern into an internal platform: developers dispatch tasks from Slack, Agents write code, run verifications, and submit PRs, with over 1,000 such PRs merged weekly—always reviewed by human engineers. Minions and Agent View are distinct architectures, but both depend heavily on testing, CI, and code review. Without these gates, a green status on the dashboard does not mean the code is safe to merge.

### Multi-Repository Concurrency

`@<repo>` dispatches tasks to a different repository or directory. One session updates backend APIs, one updates frontend pages, and another updates documentation—all consolidated within the same dashboard without juggling multiple terminal windows.

Inside a Git repository, when a background session prepares to modify files for the first time, Claude Code moves it into an isolated Worktree under `.claude/worktrees/` by default to prevent concurrent sessions from overwriting the same workspace. Non-Git directories, sessions already inside worktrees, or projects that disable background isolation will behave differently.

If frontend and backend tasks depend on a shared contract, lock down request parameters, response schemas, and acceptance criteria first. Agent View does not synchronize these changes between sessions automatically.

## Scenarios to Avoid

### Tasks Requiring Constant Synchronization

Every session maintains its own context and reports progress only to you. If one session alters an API contract, another session does not automatically know; if two sessions refactor the same core module, they will not negotiate ownership.

Use Subagents for side tasks like fetching documentation or running tests; when multiple agents must share a backlog and communicate bidirectionally, consider Agent Teams. Agent View is best suited for humans delegating independent tasks and reviewing results centrally.

Parallel sessions also consume subscription quotas independently. The more tasks running, the faster tokens burn and rate limits hit. If tasks inherently block on each other, serialized execution is far more efficient.

### Tasks Requiring Autonomous Cloud Execution

Background sessions are managed by a local supervisor process on your machine. When you close Agent View, your shell, or the terminal window, tasks continue running; if the machine sleeps, sessions are suspended and reconnect upon wake.

However, shutting down or restarting your computer terminates running tasks. The next time you open Agent View, those sessions will show as failed, though you can enter, preview, or reply to resume the conversation. Tasks that must run reliably while your machine is offline should be hosted in cloud environments. See the [official Agent View documentation](https://code.claude.com/docs/en/agent-view) for details.

## Avoid Hardcoding Workflows During Research Preview

Agent View is currently in Research Preview; UI layouts, status groupings, and keybindings are subject to change. When adopting it into team workflows, review official documentation upon updating Claude Code, and avoid hardcoding ephemeral shortcuts into permanent onboarding guides.

If you prefer to disable it temporarily, configure `.claude/settings.json`:

```json
{
  "disableAgentView": true
}
```

## Summary

I view Agent View as an actionable task dashboard for Claude Code. It gathers background sessions scattered across terminals into a unified list, letting me know instantly which are running, which are blocked awaiting input, and which are ready for review.

Task decomposition, multi-agent synchronization, and code verification still rely on Git Worktrees, automated tests, CI, and human judgment.

For me, its most practical benefit remains solving that annoying problem: never again having to hunt across five terminal tabs to find a permission prompt that has been waiting for fifteen minutes.
