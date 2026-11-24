---
title: "Claude Code Hooks In-Depth: Lifecycle Hooks and Automated Workflows"
description: "Starting from the Claude Code lifecycle, this article explains hook trigger points, handler types, inputs/outputs, security enforcement, auto-formatting, and notifications, helping you turn soft prompt suggestions into auditable, reusable automated actions."
category: AI Coding Internals
tag:
  - Claude Code
  - Hooks
  - AI Agent
  - AI Coding
lang: en
sourceRef: zh-ref/ai-coding/principles/claude-code-hooks.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Hooks,Lifecycle Hooks,AI Coding,Automated Workflows,PreToolUse,PostToolUse,UserPromptSubmit,SessionStart,Permission Control
---

After using Claude Code or Codex for a while, many developers run into the exact same challenge.

The problem usually isn't model capability.

Quite the contrary: the tool is too capable. It can edit files, run commands, inspect project trees, generate scripts, and execute long chains of tasks in one go. Naturally, you begin delegating more and more operations to it.

And that's when worries emerge: After modifying files, will it forget to format them this time? When preparing to run a Bash command, might it accidentally slip in `rm -rf`? Will it inadvertently modify `.env`, `.git/`, or production configurations? When it gets blocked on a permission confirmation popup, do I really have to babysit the terminal? ...

None of these concerns are well-suited to being solved solely by prompts, because prompt constraints lack determinism and cannot provide hard guarantees.

This is precisely where Hooks come in: they solve these problems through automatic, event-driven execution.

The difference between the two can be summarized in this diagram:

![Prompt reminders rely on context and model memory; Hook checkpoints guarantee actions via automatic triggers, script auditing, and risk interception](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-vs-prompts-guarantee-f27a3775.webp)

I prefer to think of Hooks as fixed checkpoints within Claude Code's workflow. When a session starts, when a user submits a prompt, before or after tool calls, and before or after context compaction—you can attach automated processing logic to any of these milestones.

## What Exactly Are Hooks?

Hook configuration revolves around events and handlers. The event determines when to fire; the handler receives the runtime input and executes the specific action.

For example, attaching a `command` handler to `PostToolUse`: After Claude successfully modifies a file, Claude Code passes the tool invocation JSON to your script via stdin, and the script decides whether to run a formatter. The entire process does not require Claude to re-read prompt instructions, and the script can be tested independently outside Claude Code.

Handlers are not limited to shell commands. Official documentation supports HTTP endpoints, MCP tools, LLM prompts, and more (see the "Hook handler fields" section in the official [Hooks reference](https://code.claude.com/docs/en/hooks)).

![Five Handler Types in Official Claude Code Docs: command, http, mcp_tool, prompt, and agent](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-handler-types-official-docs-cf27f8fc.png)

The diagram below maps common trigger points:

![Claude Code Hooks execute automatically around lifecycle events such as SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, and PreCompact](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-code-hooks-lifecycle-map-4584bd5a.webp)

There are five primary types of Hook handlers:

| Type | Action | Best Suited For |
| ---- | ------ | --------------- |
| `command` | Executes a shell command | Formatting, logging, security blocking, notifications |
| `http` | POSTs event JSON to a URL | Team audit services, remote alerts, centralized policy enforcement |
| `mcp_tool` | Invokes a tool on a connected MCP server | Reusing existing MCP server capabilities |
| `prompt` | Evaluates via a single model call returning yes/no JSON | Lightweight assertions, e.g., verifying task completion before `Stop` |
| `agent` | Spawns a subagent with tool access for validation | Complex verifications requiring reading files, searching code, or running commands |

However, not all five handler types are supported on every event:

- Events like `PreToolUse`, `PostToolUse`, `PermissionRequest`, and `Stop` support all five types;
- Events like `Notification`, `PreCompact`, and `ConfigChange` do not support `prompt` and `agent`;
- `SessionStart` and `Setup` only support `command` and `mcp_tool`.

Before employing non-command handlers, verify compatibility for that specific event.

You can delegate this check to an AI: provide this article or link the official docs directly to your Coding Agent.

Rules that can be expressed deterministically in scripts should prioritize `command`. Scripts can be executed independently outside Claude Code, making failure diagnosis much easier to reproduce.

Only consider `prompt` or `agent` when validation requires reading code, running test suites, and synthesizing holistic judgments. Note that `agent` hooks remain marked as experimental in official docs, so factor in extra debugging overhead before adopting them.

The relationships between the five handler types are depicted below:

![Hook handlers include command, http, mcp_tool, prompt, and agent; prioritize stable, auditable command scripts](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hook-handler-types-1c039791.webp)

## What Problems Do Hooks Actually Solve?

Suppose `CLAUDE.md` specifies "run Prettier after modifying code." That directive enters the context, and Claude will usually comply. But as tasks stretch out and new requirements are inserted mid-way, it easily forgets. If your project rules aren't organized yet, consult [CLAUDE.md Best Practices](https://javaguide.cn/ai-coding/practices/claude-md-best-practices.html) first.

"Do not modify `.env`" faces the same issue. Natural language conveys intent, but cannot enforce a hard path check prior to every file write. Hooking into `PreToolUse`, however, allows a script to inspect the target path and immediately abort if sensitive paths match; formatting can then live on `PostToolUse`, acting only on the modified files.

This mechanism closely mirrors pre-commit, CI, lint-staged, CODEOWNERS, and branch protection: locking formatting, risky command audits, and permission alerts into the workflow, leaving auditable execution trails. Hooks fill this exact gap in the Claude Code lifecycle.

## Minimal Hook Configuration

Hooks are configured in Claude Code settings files. There are three common scopes:

| Location | Scope | Suitable For |
| -------- | ----- | ------------ |
| `~/.claude/settings.json` | All projects for current user | Personal notifications, user habits |
| `.claude/settings.json` | Current project, committable to repo | Team-shared rules, project-level security guardrails |
| `.claude/settings.local.json` | Current project, local only | Personal overrides not suitable for committing |

Official documentation also supports managed policies, plugin `hooks/hooks.json`, and hooks declared in skill or agent frontmatter.

For day-to-day work, mastering the three paths above is plenty.

A minimal configuration looks like this:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

Breaking it down reveals three layers:

- `PostToolUse` is the event name, indicating it triggers after a tool executes successfully.
- `matcher` is the filter condition. Here, `Edit|Write` triggers only after Claude Code uses `Edit` or `Write` to mutate files. Tool name matchers can be separated by `|`; starting in Claude Code v2.1.191, they can also be separated by `,` with surrounding spaces. Exact matchers with hyphens require v2.1.195 or higher, while older versions can use `^...$` to bound complete matches.
- The `hooks` array contains the handlers to execute. Here, a `command` extracts the edited file path from stdin JSON and passes it to Prettier.

The example puts the command inline for brevity. In real projects, once commands grow longer or reference repository scripts, author them as standalone scripts and reference them via `${CLAUDE_PROJECT_DIR}`:

```json
{
  "type": "command",
  "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format-after-edit.sh",
  "args": []
}
```

Official documentation recommends using the exec form when referencing placeholders like project paths or plugin paths. Each item in `args` is passed as a distinct argument to the script without shell word-splitting, preventing spaces, parentheses, or special characters in paths from being mangled.

Omitting `matcher`, leaving it empty, or using `.*` matches every invocation of that event. For formatting, this could mean triggering after every single tool call; for permission events, it might subject every prompt to the same automated logic.

Matchers should be tightly aligned with actual inputs. Match `Edit|Write` for file formatting, match `Bash` for shell risk audits—reducing extraneous executions and simplifying log troubleshooting.

## How Hook Input and Output Work

When a Hook triggers, Claude Code passes the event context as JSON to the handler:

- For a `command` hook, this JSON arrives via stdin.
- For an `http` hook, this JSON is sent as the POST request body.

All events share several common fields:

| Field | Meaning |
| ----- | ------- |
| `session_id` | Current session ID |
| `transcript_path` | File path to session JSONL transcript |
| `cwd` | Working directory when the hook fired |
| `permission_mode` | Current permission mode (present on select events) |
| `hook_event_name` | Name of the triggering event |

Tool-related events also include `tool_name` and `tool_input`.

For example, when Claude Code is about to execute `npm test`, `PreToolUse` receives input like:

```json
{
  "session_id": "abc123",
  "cwd": "/Users/example/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

A common idiom inside Hook scripts is:

```bash
INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
COMMAND="$(echo "$INPUT" | jq -r '.tool_input.command // empty')"
```

Use `jq` to parse JSON here; avoid brittle grep regexes.

Pay close attention to script exit codes and stdout conventions.

Claude Code inspects stdout under all exit codes. If the first character after stripping leading whitespace is `{`, it attempts to parse it as JSON. When returning structured decisions, use `exit 0` and do not pollute stdout with debug logs. Write debugging messages and errors to `stderr`. To block execution, most events expect `exit 2`; a non-zero exit like `exit 1` is often treated merely as a hook execution failure, allowing the main workflow to proceed.

The most common trap is `exit 1`.

In ordinary shell scripting, `exit 1` signifies general failure. In Claude Code Hooks, if stdout is empty, plain text, or invalid JSON, `exit 1` is treated as a non-blocking error, and execution continues. If stdout contains schema-compliant JSON, standard decision events ignore the exit code and process the JSON outcome.

Now consider structured JSON output.

To exercise fine-grained control—such as returning `allow`, `deny`, `ask`, or `defer` in `PreToolUse`—use `exit 0` and output a single JSON object to stdout.

Example of denying a tool invocation:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Database writes are not allowed"
  }
}
```

For `PermissionRequest`, the structure differs, focusing on `decision.behavior`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
```

Never treat stdout as a dumping ground for logs.

If you output JSON, stdout must contain only JSON. Direct debug prints to stderr or a log file. Otherwise, you will encounter `JSON validation failed` and waste hours troubleshooting.

If a script exits with `exit 2`, Claude Code still parses schema-compliant JSON from stdout. For events that support blocking, an `exit 2` block cannot be overridden by JSON; Claude Code uses stderr only when no valid JSON rejection reason is found. `PermissionRequest` is an exception: it does not accept `exit 2` blocking; approval or rejection must be returned via the `decision` object.

When multiple Hooks match the same event, Claude Code executes them all before merging results. A `deny` from one Hook does not stop adjacent Hooks from logging, making HTTP requests, or editing files; when merging multiple decisions in `PreToolUse`, the strictest outcome prevails.

Therefore, any Hook that mutates state, sends requests, or writes logs must guard its own execution. Never assume a neighboring security Hook will run first or neutralize risks beforehand.

Modifying tool inputs requires similar prudence. The official documentation explicitly warns: **If multiple Hooks attempt to modify the same tool input, the last one to complete wins; but Hooks run in parallel, so completion order is non-deterministic.**

Additionally, `command` Hooks run shell commands with the current user's operating system privileges. They can read, edit, or delete any files the user has permission to touch. Always review and independently test third-party Hook scripts before integrating them.

![Official Docs Security Warning: command Hooks execute with current user permissions and can access, modify, or delete files](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-security-warning-official-docs-578464f0.png)

## Understanding Common Lifecycle Events

Official documentation enumerates many events, spanning sessions, tools, permissions, subagents, tasks, config changes, worktrees, and MCP elicitation.

While numerous, everyday development primarily revolves around a few key moments: session startup, user prompt submission, pre-tool execution, post-tool execution, permission decisions, response stopping, and context compaction.

| Event | Trigger Timing | Best Suited For |
| ----- | -------------- | --------------- |
| `SessionStart` | Session starts or resumes | Injecting dynamic context, loading environments, re-injecting rules after compaction |
| `UserPromptSubmit` | After user submits prompt, before Claude processes | Prompt auditing, lightweight interception, injecting dynamic context |
| `PreToolUse` | Before tool execution | Blocking dangerous commands, guarding sensitive files, modifying tool inputs |
| `PermissionRequest` | When tool call requires permission decision | Auditing permissions, narrow automated approvals |
| `PostToolUse` | After tool succeeds | Formatting, logging, linting, supplemental context |
| `Notification` | When Claude Code dispatches notification | Desktop notifications, mobile push alerts |
| `Stop` | When Claude finishes a turn response | Completion alerts, quality gates, prompting follow-up processing |
| `PreCompact` | Before context compaction | Backing up state, preventing unsuitable compaction |
| `PostCompact` | After context compaction | Recording summaries, syncing external state |

Beyond these, there is a tier of advanced events. Knowing they exist is sufficient; look them up in the official Reference or ask an AI when needed:

| Category | Events |
| -------- | ------ |
| Session & Config | `Setup`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `SessionEnd` |
| Prompt & Display | `UserPromptExpansion`, `MessageDisplay`, `TeammateIdle` |
| Tools & Permissions | `PermissionDenied`, `PostToolUseFailure`, `PostToolBatch` |
| Subagents & Tasks | `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted` |
| Worktree & MCP | `WorktreeCreate`, `WorktreeRemove`, `Elicitation`, `ElicitationResult` |
| Stop Supplemental | `StopFailure` |

Distinguish easily confused events by their actual execution order.

`PreToolUse` occurs before tool execution. Bash command audits, `.env` protection, and production config write blocks belong here, giving scripts the chance to reject before side effects occur.

`PostToolUse` occurs after tool success, making it suitable for cleanup, not security perimeters. Formatting belongs here, but sensitive file protection cannot rely on it, because the file has already been modified. It can provide feedback or replace output via JSON, but cannot undo the completed tool call.

`PermissionRequest` fires when a tool call enters permission resolution and Claude Code prepares to ask for authorization. In interactive mode, a confirmation dialog appears; non-interactive background subagents that cannot display dialogs still run this Hook, rejecting the tool call if no Hook grants approval. In `-p` non-interactive mode, only the Agent SDK's `canUseTool` callback provides this flow; standard `claude -p` should use `PreToolUse` for automated decisions. Keep security audits in `PreToolUse`, and ensure auto-approvals tightly scope both matcher and inputs.

`Stop` does not mean "task completed"; it triggers whenever Claude prepares to end its turn. If using a Stop hook as a quality gate, guard against infinite loops. Official docs provide a `stop_hook_active` field to check if the current turn was already continued by a Stop hook; after 8 consecutive blocks, Claude Code overrides the block and ends the turn.

`PreCompact` can block compaction; `PostCompact` cannot reverse compaction that already occurred. To re-inject rules after compaction, pair `SessionStart` with the `compact` matcher. Context compaction and rule replenishment belong to Context Engineering; explore [Context Engineering Practical Guide](https://javaguide.cn/ai/agent/context-engineering.html) for more.

## Three Minimal Working Examples

To get started, I recommend beginning with three examples: one for notifications, one for post-mutation cleanup, and one for pre-execution blocking.

They cover low risk, automation payoff, and security guardrails respectively.

### Notification: Desktop Alert When Claude Needs Input

This is the best first hook to configure: it touches no code and carries zero operational risk.

On macOS, add this to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

Here, `matcher` is `permission_prompt`, notifying you only when Claude awaits approval for a tool invocation. This alert typically fires after a prompt has lingered unaddressed for about 6 seconds, rather than instantly. To trigger on all notifications, omit matcher or set it empty. Official Notification matchers also include `idle_prompt`, `auth_success`, `elicitation_dialog`, and more.

If macOS displays no notification, test manually in your terminal first:

```bash
osascript -e 'display notification "test"'
```

Then ensure Script Editor has notification permissions in macOS System Settings. This is a common pitfall: the Hook fires properly, but the OS suppresses the popup.

### PostToolUse: Auto-Format After File Edits

In frontend projects, running Prettier after `Edit` or `Write` is standard:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

Three key elements define this configuration:

`matcher` matches only `Edit|Write`, so reading files, running Bash, or calling MCP tools never triggers formatting.

`command` extracts `.tool_input.file_path` from stdin JSON and pipes it to `npx prettier --write`.

This Hook sits on `PostToolUse`, acting as post-execution cleanup. If the formatter fails, you can expose errors or invoke a script that selects formatters based on file extensions.

A more robust script:

```bash
#!/usr/bin/env bash
set -euo pipefail

file="$(jq -r '.tool_input.file_path // empty')"

case "$file" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.md)
    npx prettier --write "$file"
    ;;
esac
```

Hooks possess no magic. In Java projects, swap in `spotlessApply`, `google-java-format`, or your existing format commands. In Python, use `ruff format`. Integrate with your existing toolchain; don't invent new formatting systems just to accommodate Hooks.

### PreToolUse: Blocking Risky Commands and Sensitive Files

`PreToolUse` provides `tool_name` and `tool_input` before execution. The script inspects commands and paths, aborting immediately upon detecting risk.

Create a script, such as `.claude/hooks/guard.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
tool="$(jq -r '.tool_name // empty' <<<"$input")"
command="$(jq -r '.tool_input.command // empty' <<<"$input")"
file="$(jq -r '.tool_input.file_path // empty' <<<"$input")"

if [[ "$tool" == "Bash" ]] && [[ "$command" =~ rm[[:space:]]+-rf|chmod[[:space:]]+-R[[:space:]]+777 ]]; then
  echo "Blocked risky shell command: $command" >&2
  exit 2
fi

if [[ "$tool" == "Edit" || "$tool" == "Write" ]]; then
  case "$file" in
    *.env|*.env.*|*/.env|*/.git/*|*id_rsa*|*id_ed25519*)
      echo "Blocked sensitive file edit: $file" >&2
      exit 2
      ;;
  esac
fi

exit 0
```

Make it executable:

```bash
chmod +x .claude/hooks/guard.sh
```

Attach it to project-level `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard.sh"
          }
        ]
      }
    ]
  }
}
```

This script executes prior to tool invocation. Upon matching risk, it writes the rationale to stderr and exits with `exit 2`; Claude Code aborts the tool invocation and returns the rejection reason to Claude.

In production repos, customize sensitive file patterns: production configs, credential files, migration scripts, lockfiles, and CI definitions can all be added incrementally.

Never rely solely on a single command blacklist. Blocking `rm *` does not stop `/bin/rm` or `find -delete`. High-risk operations should be defended using path restrictions, permission configs, Hooks, sandboxing, CI gates, and human review in concert.

## Choosing Non-Command Handlers

`command` is best for deterministic, local tasks like formatting, alerts, and command blocking. Scripts can be debugged independently and reviewed via standard PRs.

Use `http` when your team centrally aggregates audit records or enforces remote policies. Server response JSON bodies are processed identically to command JSON outputs. HTTP status codes themselves do not block tool execution; the server must return 2xx with schema-compliant decision fields in the response body.

`mcp_tool` invokes tools on connected MCP servers. It does not trigger OAuth or establish connections. If early lifecycle events like `SessionStart` or `Setup` trigger before an MCP server is ready, the invocation fails immediately.

`prompt` uses a single model call on hook inputs, such as verifying completion before `Stop`. If validation requires reading files, searching code, or running commands, use `agent` (currently experimental).

To choose, identify where the decision logic lives: if entirely determined by input fields and scripts, use `command`; if results route to team services, use `http`; if leveraging existing MCP capabilities, choose `mcp_tool`; introduce `prompt` or `agent` only when semantic judgment cannot be expressed as a deterministic script.

## Differentiating Hooks from Skills

These two concepts are frequently confused.

Skills extend a Coding Agent's capabilities via `SKILL.md`. During task execution, the Agent autonomously decides whether to use a skill, or you can invoke it manually via `/skill-name`.

A Skill's body is loaded into context only upon invocation (progressive disclosure), making it ideal for lengthy workflows, checklists, project domain knowledge, scripts, and references.

![Progressive Disclosure of Skills](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

For a systematic comparison of Skills with Prompts, MCP, and Function Calling, see [What Are Agent Skills? How Do They Truly Differ from Prompts and MCP?](https://javaguide.cn/ai/agent/skills.html).

![Agent Execution Pipeline](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

Hooks execute automated actions at lifecycle milestones; Skills provide instructions, scripts, and reference documentation to help Claude execute complex tasks. Contrast them as follows:

![Hooks suit automated triggers, fixed actions, and security blocks; Skills suit on-demand loading, contextual judgment, and complex workflows](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-vs-skills-responsibilities-6f7a35bc.webp)

| Dimension | Hooks | Skills |
| --------- | ----- | ------ |
| Trigger Mechanism | Automatically fires on Claude Code lifecycle events | Loaded when Claude deems relevant, or manually invoked via `/skill-name` |
| Core Value | Guarantees deterministic actions occur reliably | Equips Claude with specialized domain knowledge or procedural know-how |
| Ideal Scenarios | Formatting, dangerous command blocking, permission audits, alerts, quality gates | Code review procedures, deployment SOPs, troubleshooting, research |
| Model Dependence | Low, especially for `command` hooks | Higher; Claude must interpret and execute skill instructions |
| Suitable for Blocking | Yes, especially on `PreToolUse`, `UserPromptSubmit`, and `Stop` | Unsuitable as hard enforcement mechanisms |
| Common Pitfalls | Overly broad matchers, slow scripts, excessive auto-approvals | Vague descriptions, inaccurate triggers, bloated bodies |

In practice: When a file is modified by `Edit` or `Write`, pass the path directly to Prettier; when a tool attempts to write to `.env`, inspect the path and reject before execution. These inputs are directly available in event payloads without guesswork.

Code reviews or diagnosing API timeouts are far less rigid. Claude must read code, logs, and task constraints before deciding which files to inspect and commands to run—making them a natural fit for Skills.

Both can be chained in a single workflow: **The Skill dictates what the code review must inspect; Hooks run formatters after file mutations, block dangerous commands before execution, and ensure test results exist before ending the response.**

## Practical Rollout: Stabilize Three Hooks First

Don't rush to wire up every lifecycle event in your first iteration. Roll them out progressively: `Notification`, then `PostToolUse`, then `PreToolUse`.

![Progressive Rollout Recommendation for Claude Code Hooks: Notification -> PostToolUse -> PreToolUse](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-progressive-rollout-c7b531e8.webp)

The more Hooks you configure, the harder troubleshooting becomes when issues arise. If Claude suddenly stops responding, you must confirm: did `PreToolUse` return deny, did `PermissionRequest` fail to return a decision, is `Stop` looping endlessly, or did a `PostToolUse` script time out? While symptoms appear similar, root-cause resolutions differ completely.

Start with `Notification`. The earlier example alerts only when awaiting authorization, touching no code. Receiving an alert proves the config loaded and the event and matcher matched. Even if misconfigured, the impact is minimal.

Once notifications are verified, attach `PostToolUse` to your existing formatting tools: Prettier for frontend, Ruff for Python, or existing commands for Java. The matcher restricts the tool name, while the script filters by file extension, ensuring irrelevant Bash runs or read operations don't spin up formatters.

Finally, test `PreToolUse`, as it actively blocks tool invocations. Initially, target only unmistakable high-risk operations: recursive deletions, indiscriminate privilege escalations, and access to `.env`, `.git/`, private keys, and production secrets. Monitor logs for interception patterns, tuning rules based on false positives.

Command blacklists only catch exact patterns; alternate syntax can bypass them. Keep path boundaries, permission configs, sandboxing, and human review intact—never discard them just because `PreToolUse` is active.

Once these three are stable, add events based on real project pain points. If rules drop after context compaction, re-inject them using `SessionStart` with the `compact` matcher, using `PreCompact` to preserve state if needed. Use `ConfigChange` to track configuration drift; when working directories or files affect environments, pair `CwdChanged` or `FileChanged` with `CLAUDE_ENV_FILE`.

If using `Stop` as a completion gate, define explicit exit criteria in the script. Otherwise, if the Hook prompts Claude to continue, the subsequent response completion will hit the same rule, causing an infinite loop. While Claude Code forces a stop after 8 consecutive blocks, intermediate retries waste time and tokens.

`PermissionRequest` is equally easy to misapply. It fires when a tool call enters permission resolution, not when a dialog physically renders; non-interactive background subagents that cannot display dialogs still run this Hook.

Standard `claude -p` lacks this permission dialog flow; place rules in `PreToolUse` when automated decisions are required. The official example only auto-approves `ExitPlanMode`. When adopting examples, preserve matchers and input checks—never use a blanket allow rule. Deleting files, touching production, reading credentials, or invoking external mutating APIs should always remain with human approval.

## Troubleshooting Hooks When Things Go Wrong

You configured Hooks, but Claude Code doesn't react; or the Hook runs, but dangerous commands still execute. For details like available event fields or handler support, check current official documentation with AI assistance.

When troubleshooting, follow this systematic order:

![Troubleshooting Flow for Claude Code Hooks: Verify Config Loading -> Test Script Independently -> Check Matchers](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-troubleshooting-flow-ce2a8586.webp)

1. Run `/hooks` to confirm configurations loaded and attached to expected events. If missing here, inspect settings file locations and JSON syntax first, ignoring script logic for now.

   ![Official Docs Illustration of /hooks Menu for Viewing Events, Matchers, Handlers, and Config Origins](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-menu-official-docs-b4560e95.png)

2. Test the script independently outside Claude Code. Hook scripts read JSON from stdin; verify it parses fields and emits expected exit codes before wiring it into settings:

   ```bash
   printf '%s\n' '{"tool_name":"Bash","tool_input":{"command":"rm -rf /tmp/demo"}}' \
     | .claude/hooks/guard.sh

   echo $?
   # Expected output: 2
   ```

3. If the script runs fine standalone, record the actual event payload delivered by Claude Code. Write debug logs to stderr or a temporary file, never to stdout intended for JSON responses:

   ```bash
   input="$(cat)"
   printf '%s\n' "$input" >> /tmp/claude-hook-debug.log
   ```

   Remember to delete debug logs afterward, as they may contain file paths, commands, and prompts.

4. Enable one Hook at a time. Multiple matching Hooks execute in parallel, making it difficult to isolate issues from final outputs alone. Test scripts individually before enabling them together.

Match observed symptoms against this diagnostic checklist:

| Symptom | Primary Check |
| ------- | ------------- |
| Hook not listed in `/hooks` | Settings file path, JSON syntax errors |
| Registered, but never triggers | Correct event chosen; matcher matches actual inputs |
| Script errors, but tool call proceeds | Accidental use of `exit 1`; ensure blocking logic is in `PreToolUse` |
| Claude loops continuously without ending | Missing exit criteria in `Stop` Hook |
| Formatter runs on every operation | Matcher omitted or written too broadly |
| Notification script executes, but no popup | Run command manually; verify OS notification permissions |
| Works interactively, fails in `claude -p` | Do not rely on `PermissionRequest`; use `PreToolUse` for automated decisions |

If still unresolved, share your `claude --version` output, Hook configs, scripts, and observed behavior with an AI, instructing it to audit against official documentation. Scrub secrets, tokens, and proprietary information before pasting. Use a focused prompt:

```text
I configured the following Hook in Claude Code <version>.

Expected behavior: <what it should do>
Actual behavior: <what is happening now>

Hook config:
<paste config>

Script:
<paste script>

Please consult the official Claude Code documentation for this version, then systematically inspect the event, matcher, input fields, exit codes, and JSON output format.
Point out only the specific causes of this issue; do not expand into unrelated configuration suggestions.
```

## Summary

Hooks automatically execute deterministic actions at critical points in Claude Code's lifecycle: formatting, dangerous command audits, and permission alerts.

Place auto-formatting on `PostToolUse`, block dangerous commands and sensitive files on `PreToolUse`, and use `Notification` to alert you when stepping away from your machine.

In my experience, avoid configuring too many hooks at the start; it introduces unnecessary complexity and makes debugging painful.

Stabilize these three hooks first. Especially for security and permissions, err on the side of caution—start strict and expand gradually, rather than auto-approving operations indiscriminately. Hooks reinforce procedural consistency, but sandboxing, permissions, CI, and human review remain essential.

Keep the boundary clear: Delegate rules that can be expressed as deterministic scripts to Hooks; leave tasks requiring contextual reasoning, such as code reviews and incident investigations, inside Skills. This clean division keeps configuration simple and troubleshooting straightforward.
