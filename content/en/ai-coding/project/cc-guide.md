---
title: "Using Claude Code and Codex in IDEA: CC GUI Getting Started Guide"
description: "CC GUI is an open-source JetBrains plugin providing a visual interface for Claude Code and OpenAI Codex. Taking v0.4.7 as a snapshot, this article introduces installation, authentication, Diff, Agent, MCP, and their practical boundaries."
category: AI Coding in Practice
lang: en
sourceRef: zh-ref/ai-coding/project/cc-guide.md
head:
  - - meta
    - name: keywords
      content: CC GUI,Claude Code,Codex,IDEA Plugin,JetBrains,AI Coding,Agent,MCP,Visual Programming
---

Hello everyone, I'm Xiao G. Earlier I shared a practical guide on [Using the Qoder Plugin in IDEA](https://mp.weixin.qq.com/s/vz5A7fQh8WxqVBHscqHzQA). In this article, let's look at another JetBrains plugin: **CC GUI**.

> **Version Note**: The features and screenshots below are based on CC GUI v0.4.7 (2026-07-24). The plugin iterates rapidly, so please refer to the project's README and your current UI for the latest installation and authentication procedures.

## What Is CC GUI?

**CC GUI** (formerly Claude Code GUI) is an open-source JetBrains plugin licensed under MIT, providing a graphical user interface (GUI) for Claude Code and OpenAI Codex.

![CC GUI GitHub Project Interface](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-gui-github-project-917b1486.png)

Project Repository: [zhukunpenglinyutong/jetbrains-cc-gui](https://github.com/zhukunpenglinyutong/jetbrains-cc-gui).

If you have read my previous articles, you should already be familiar with the **ACP (Agent Client Protocol)**. It defines a standard interaction interface between an Agent and an IDE; whether they can actually connect depends on protocol versions, capabilities, and authentication methods implemented on both sides.

JetBrains built-in Agent integrations, ACP Registry Agents, and manually configured ACP Agents represent different capability tiers and cannot all be lumped together as "official plugins." Available agents also vary with IDE versions, plugins, and user accounts.

CC GUI and ACP represent two different paths:

- **JetBrains / ACP Path**: Uses IDE built-in integrations, Registry Agents, or custom ACP Agents, focusing on reusing JetBrains's native AI Chat, Diff, and context capabilities; functionality depends on the specific Agent implementation.
- **CC GUI Path**: Uses an independent community plugin to add session management, image input, Agent, MCP, and other GUI features to Claude Code and Codex; supported features are subject to CC GUI's current version.

These two approaches do not conflict; you can choose according to your preferences.

Taking v0.4.7 as a snapshot, the capabilities covered in this article include:

- **Dual-Engine Support**: Simultaneously connects to Claude Code and OpenAI Codex, switchable on demand in provider settings.
- **Visual Chat**: Supports `@file` references, sending images, and conversation rollbacks, which is far more intuitive than the CLI.
- **Agent + MCP**: Built-in Agent system and Slash commands (such as [/loop scheduling](https://mp.weixin.qq.com/s/apkuuxHmC1c6bR0kWhgmUA), [/simplify code review](https://mp.weixin.qq.com/s/Np3oaBmdJAE319wuT7zHBw)), supporting MCP extensions.
- **Diff Comparison**: Code modifications show side-by-side Diff directly in IDEA, supporting file navigation and code jumping.
- **Session Management**: History records, search, favorites, and export.

## Installation and Configuration

### Step 1: Install Plugin and SDK

Open IDEA, go to **Settings → Plugins** (shortcut `Cmd + ,` or `Ctrl + Alt + S`), and search for **CC GUI** to install.

![IDEA Plugin CC GUI](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/idea-plugin-cc-gui-2a5e3d62.png)

After installation, you can find the CC GUI entry icon on the right toolbar of IDEA. Click the icon to open the panel.

![IDEA CC GUI Entry](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/idea-cc-gui-entry-c260760d.png)

When first used, it prompts you to install the Claude Code/Codex SDK. This is the foundation for running the Agent; click it and follow the UI prompts to complete installation. Duration depends on your network and local environment.

![Claude Code/Codex SDK Installed Successfully](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/sdk-installed-success-1d7848b8.png)

**Encountering a Black Screen?** Some users on IDEA 2026.1 encounter a black screen when opening the CC GUI panel.

First, try clearing the IDE's built-in browser cache. If the issue persists, users in the project's GitHub Issues bypassed it via **Help → Edit Custom VM Options** by adding the following parameters:

```bash
-Dide.browser.jcef.out-of-process.enabled=false
-Dide.browser.jcef.gpu.disable=true
```

Restart IDEA after adding these lines and verify again. This parameter is only a workaround effective under certain JCEF/GPU environments. As of 2026-07-24, the associated issue remains open, so it should not be treated as a definitive fix; the flags may also affect JCEF process isolation or hardware acceleration. See: <https://github.com/zhukunpenglinyutong/jetbrains-cc-gui/issues/813>.

### Step 2: Configure Model Providers

Click Provider Settings and configure authentication according to the plugin's currently supported methods:

- **Claude.ai OAuth Login**: Uses a Claude subscription authorized through your Claude.ai account to use Claude Code.
- **Anthropic API Key**: API Key obtained from Anthropic Console, billed separately based on API usage; Claude.ai subscriptions do not automatically provide an API Key.
- **Reuse Claude Code CLI Login State**: If supported by the current plugin version, you can reuse an existing Claude.ai OAuth login session; this is not the same as reading credentials from `settings.json`.
- **Import Local Provider Config**: `settings.json` serves as the config carrier and may contain models, endpoints, or API-related settings. Verify the fields actually read by the plugin and how keys are stored before importing.
- **Import cc-switch Config**: cc-switch is a widely-used community tool for managing Claude Code providers. CC GUI is compatible with its configuration; simply import to use immediately.
- **Third-Party Proxy Endpoints**: Custom endpoints can be configured, but compatibility, data handling, and secret security are determined by the proxy service.

For Claude Code authentication methods, refer to the [official authentication documentation](https://code.claude.com/docs/en/authentication). Codex officially supports both ChatGPT login and API Keys, each with different tiers and billing; whether CC GUI supports the corresponding login flow depends on the current plugin version, detailed in the [Codex Auth Documentation](https://developers.openai.com/codex/auth).

The screenshots in this article use the direct import of cc-switch configuration.

![Directly Import cc-switch Configuration](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-switch-config-import-a4adec2d.png)

### Step 3: Start Using

Once configured, start chatting directly in the right-side panel. It's recommended to start with a simple task, such as "Analyze the directory structure of the current project," to get a feel for its context-awareness.

Here, let's take a common, high-frequency daily development scenario as an example: **Review existing code against standards and batch-fix issues**. Doing this manually is tedious—opening files, comparing code line by line against specifications, finding bugs, modifying manually, moving to the next file...

CC GUI supports **Skills (slash commands)**, allowing specific review workflows to be consolidated into reusable instructions. For instance, I configured a `java-coding-standards` Skill containing project review rules for Java and Spring Boot.

Taking the [AI Smart Interview Platform](https://javaguide.cn/zhuanlan/interview-guide.html) project as an example, simply input the following into the chat box:

```
/java-coding-standards Check the code under @infrastructure
```

`/java-coding-standards` loads the review rules, while `@infrastructure` specifies the scope. In this demonstration, the Agent read 14 Java files under that directory and output a structured report:

| Severity | Issue | Affected Files | Count |
| -------- | ----- | -------------- | ----- |
| High | Log `log.error("xxx: {}", e.getMessage())` loses stack trace | FileHashService | 3 places |
| High | BusinessException missing ErrorCode | RedisService | 1 place |
| Medium | Inlined fully-qualified class names (`java.util.function.Function`) | InterviewMapper, ResumeMapper | 7 places |
| Medium | Returns `Map<String, Object>` instead of dedicated DTO | InterviewMapper | 2 places |
| Low | Font resources not using try-with-resources | PdfExportService | 1 place |
| Low | DateTimeFormatter repeatedly recreated on each invocation | FileStorageService | 1 place |

![Structured Review Report from java-coding-standards](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/java-coding-standards-structured-review-report-d7a4b769.webp)

After receiving the report, you can ask the AI to generate candidate fixes file by file and review each change and its justification in the Diff panel.

This demo involved 9 files and more than 20 changes. From review to fix generation and completing a compilation verification took under five minutes. This timeframe only represents this specific sample; code scale, model choice, caching status, and acceptance requirements will vary.

**The Value of Skills**: It packages "what to review and what steps to follow" into a reusable entry point, reducing repetitive instructions each time. While it improves consistency in review criteria, it cannot guarantee identical results across different models and contexts; team standards should still reside in versioned rules, static analysis, and code review processes.

For recommended Vibe Coding Skills and FAQs, check out these two articles:

1. [AI Coding Skills Selection Checklist: Requirements Clarification, TDD, Code Review, and UI Design](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html)
2. [What Are Agent Skills? How Do They Truly Differ from Prompts and MCP?](https://mp.weixin.qq.com/s/5iaTBH12VTH55jYwo4wmwA)

## CC GUI Built-In Features

CC GUI also includes built-in usage statistics, providing clear visibility into token consumption, cost metrics, and usage trend analysis.

![CC GUI Usage Statistics](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-gui-usage-stats-50e5d0f9.png)

It also supports Commit AI, custom agents, maintaining prompt libraries, adding MCP servers, and more.

![CC GUI Commit AI](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-gui-commit-ai-c5b569b1.png)

Furthermore, you can view conversation history with search and deletion capabilities:

![Claude Code History Messages](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/claude-code-history-c09b7b98.png)

## Choosing Between CC GUI and Qoder

These two plugins have different positionings; here is a quick comparison:

| Dimension | CC GUI | Qoder |
| --------- | ------ | ----- |
| **Positioning** | GUI wrapper for Claude Code / Codex | Independent AI coding Agent |
| **Open Source** | MIT license, fully open-source | Closed-source, by Alibaba |
| **Models** | Claude Code + Codex, support depends on version | Built-in and currently selectable models |
| **Context** | `@file` references + image input | `@database` + `@file` |
| **Best For** | Wanting to use existing CLI workflows inside JetBrains | Wanting an all-in-one integrated Agent |
| **Java Optimization** | General | Highly optimized for the Java ecosystem |

**My Recommendations:**

- **Already have a Claude Code or Codex workflow** → Evaluate CC GUI, but first confirm supported authentication methods and feature mappings; a GUI is not guaranteed to fully inherit all CLI capabilities.
- **Want out-of-the-box convenience without fiddling with API configs** → Choose Qoder; just sign up and start using.
- **Installing both is fine too** → They do not conflict and can be switched depending on the scenario.

## Summary

The core value of CC GUI is **completing the visual workflow for JetBrains users**. It brings operations that were previously scattered across terminals, editors, screenshot tools, and file managers into one place inside the IDE.

If you primarily use JetBrains IDEs and want to manage Claude Code or Codex sessions within your editor, test CC GUI in a non-critical project first, then decide whether to incorporate it into your daily routine based on authentication, feature compatibility, and team security requirements.
