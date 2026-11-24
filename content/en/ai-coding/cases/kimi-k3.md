---
title: "Kimi K3 in Action: Full-Stack Project, Java Project Modernization, and 3A Game Demo"
description: "Through three real-world cases—a trending topic tracking system, Java project refactoring, and a third-person action game demo—evaluate Kimi K3's performance in long-horizon Agent coding, multimodal understanding, and complex engineering tasks."
category: AI Coding Practice
head:
  - - meta
    - name: keywords
      content: Kimi K3,Kimi Code,AI coding,Agent Coding,full-stack development,Java project modernization,multimodal,long-horizon tasks,game development
lang: en
sourceRef: zh-ref/ai-coding/cases/kimi-k3.md
---

Hello, I'm Xiao G. Kimi K3 was officially released last Friday!

Over the past few days, the most frequently asked question has been: How good is K3 really? How does it feel to write code with it?

Many prominent figures domestically and abroad have compared K3 with top-tier coding models, and the feedback has been overwhelmingly positive. The data doesn't lie either—K3's subscriptions and usage have surged recently, putting computing capacity under heavy load.

However, I'm more interested in seeing how it performs in real-world projects. I believe that is what matters most.

Therefore, this time I prepared three highly representative cases: a full-stack project, an existing Java project refactoring, and a 3A game demo built from scratch.

This release of K3 brings: **2.8T parameters, a 1M context window, native multimodality, and architectural optimizations tailored for long-horizon Agent coding.**

As we can see, its core purpose is enabling Agents to continuously read code, inspect screenshots, run tools, and fix issues across longer tasks.

![Kimi K3 official announcement](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-official-announcement-0de1f418.png)

This article follows my customary approach: first look at how to connect it, then examine its practical performance across several engineering tasks, and finally discuss the highlights of this K3 update.

## Connecting to Kimi K3

K3 supports almost all mainstream Coding Agent and general Agent frameworks, such as Claude Code, Roo Code, OpenCode, OMP, OpenClaw, and Hermes.

Here, let's take Kimi's official Kimi Code CLI as an example to introduce the shortest integration path. If you are already using Claude Code, Roo Code, OpenCode, or CC Switch, you can continue using your existing toolchain.

### Kimi Code CLI Integration

This is Kimi's official terminal Coding Agent, similar to Claude Code.

Once installed, running the `kimi` command in your project directory allows it to read code, modify code, execute commands, explain error logs, and generate commit messages.

The installation command for macOS and Linux is:

```bash
curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash
```

For Windows PowerShell:

```powershell
irm https://code.kimi.com/kimi-code/install.ps1 | iex
```

After installation completes, check the version number using `kimi --version`:

![Kimi Code CLI installation completed with version check](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-kimi-cli-install-7e1fa65b.png)

Once installed, navigate to the target project directory and run:

```bash
kimi
```

The first launch will prompt you to log in to your Kimi account. After entering Kimi Code CLI, type `/model` and select `k3`.

![Start with kimi -y and select k3 from the model list](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-kimi-y-model-list-06f60047.png)

Personally, before doing serious work, I usually run a quick read-only test:

```text
Read the current project's directory structure and core code, and explain the responsibilities of each module. Do not modify files or execute commands with side effects yet.
```

![Kimi reads Java project directory structure and core code first](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-read-java-project-2a6c1841.png)

### Using Existing Coding Agents

If you are already accustomed to Claude Code, Roo Code, or OpenCode, there's no need to rebuild your workflow for K3. After creating a Kimi Code API Key, you can plug in K3 through compatible interfaces.

General Agent frameworks like OpenClaw and Hermes can also invoke Kimi Code. K3 handles model inference, while reading files, invoking tools, and managing permissions remain under the external Agent framework.

Taking CC Switch as an example, when adding a new provider, you can directly select Kimi For Coding:

![Select Kimi For Coding when adding a provider](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-provider-select-5a774267.png)

Then fill in your API Key and endpoint URL, leaving the API format at its default:

![Configure Kimi For Coding API Key and endpoint URL](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-provider-config-73c9fabd.png)

Click to fetch the model list, and map the model role to `k3`:

![Select k3 in Kimi For Coding model mapping](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-provider-model-mapping-6229cf26.png)

No extra routing setup is required here:

![Directly select Kimi For Coding in CC Switch](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-cc-switch-direct-provider-11cdc0af.png)

Testing it out in practice:

![Claude Code connected to Kimi](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-claude-code-read-project-04dcd7a4.png)

## Case 1: Building a Trending Topic Tracking System

For the first case, I instructed K3 to build a **trending topic tracking system** named **HotPulse**.

I didn't ask it to just build a pretty frontend. While the frontend matters, I wanted to see if it could tie together the backend pipeline, database, queues, testing, and error recovery.

The acceptance target was a runnable MVP: users create keyword Monitors, the system periodically or manually scrapes Hacker News / RSS, writes raw content as Observations, generates Entries through an analyze stage, and dispatches them via Notify. The frontend needs to display Feeds, Monitor Runs, and Delivery statuses, while supporting reading, favoriting, and archiving.

In the system design brief given to K3, I emphasized these constraints: Backend using Hono, SQLite, Drizzle; Frontend using React 19, React Router, TanStack Query, plus Socket.IO. Tests must not depend on public internet access, notifications use a fake webhook server, and databases use temporary SQLite instances.

To bypass manual approval for file writes and command executions, we can use the `kimi -y` command.

Task progression utilized the `/goal` command. To evaluate the raw capability of the model in long-horizon tasks, I did not enable any Skills or provide project-specific plugins.

![Using goal to drive HotPulse task in Kimi Code CLI](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-goal-active-af01a260.png)

A minor detail: the screenshot displays over 8 hours, which does not mean the model worked continuously for that duration. I started running it around midnight, paused when it got stuck, and resumed in the morning. The actual effective completion time was roughly 1 hour.

### Running Backend Pipelines First

K3's progression sequence was remarkably steady: first building shared contracts, Zod schemas, and unit tests, followed by server configuration, databases, queues, and domain services, before connecting scraping, analysis, notifications, cron scheduling, background workers, and maintenance tasks.

It wasn't smooth sailing the whole way. K3 ran TypeScript checks and tests on its own, fixing helpers, handlers, and test cases whenever errors appeared.

![Kimi fixing server tests and TypeScript errors](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-server-tests-324ee500.png)

### Moving to Frontend Once Backend Was All Green

On the server side, it reached `94/94` passing tests before K3 proceeded to the client side.

![Switching to frontend SPA after server tests pass](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-client-stage-0cfd8a39.png)

For the frontend, it completed the Monitor, Feed, Targets, Deliveries, and System pages.

Here is the final delivery report for the HotPulse MVP:

![HotPulse MVP final delivery report](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-goal-complete-3d6a9dcb.png)

The delivered functional scope covered the MVP acceptance criteria I specified.

However, while version 1 was runnable, it was undeniably rough—strictly an MVP.

The Monitor edit page allows configuring names, keywords, run intervals, active status, and sources:

![HotPulse Monitor edit page](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-monitor-edit-df1abc02.png)

The Feed page displays scraped and analyzed Entries, supporting filtering by status, Monitor, sorting, and favorites:

![HotPulse Feed page](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-feed-65b5d1a5.png)

### Continuous Optimization

Next, I had Kimi iterate through several rounds of optimization.

![HotPulse MVP final report after further optimization](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-optimization-report-e655a7da.png)

This round primarily pushed what was merely "usable" toward a polished product form. Examples include a default home page, onboarding guides, manual run feedback, pending button states, duplicate submission prevention, toasts, delete confirmation modals, and unified localized copy.

Going further, I instructed it to perform **multi-source expansion**.

This was no longer just superficial UI tweaks. HotPulse no longer monitored only Hacker News / RSS; it integrated RSS, Webpages, GitHub, and Twitter into the same scrape → analyze → notify pipeline.

![HotPulse V1.1 multi-source expansion completed and verified](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-v11-multisource-complete-c6cce1b4.png)

The most intriguing aspect here wasn't merely writing extra scrapers, but that K3 unified these sources into a `source_items` intermediate layer, utilizing `(monitorId, externalId)` as unique keys and `contentFingerprint` for detecting content mutations.

In a real monitoring system, the challenge lies in whether the entire pipeline remains stable, degrades gracefully, continues running, and exposes exact error locations when a source goes down, a page structure alters, or an API slows down.

Here is the resulting demo, which now closely resembles a commercial product.

Demo video link: <https://www.zhihu.com/pin/2062834508802569097>

The greatest value demonstrated in this case is that **K3 consistently maintained its objective across an extended task: reading requirements, breaking down modules, modifying code, running tests, resolving errors, and delivering verifiable results.**

## Case 2: Existing Project Refactoring

For the second case, I selected two tasks involving bug fixes and feature additions to an existing codebase.

These tasks differ from the initial greenfield full-stack MVP. The priority is first understanding existing code, then tracing call chains, data sources, and implementation details based on observed symptoms. For a Coding Agent, this mirrors daily software engineering: discovering an issue in production or locally, diagnosing it accurately, applying minimal changes, and running verifications.

Here we use a multi-agent stock analysis practical project from our community as an example, which has been undergoing active refinements and tutorial updates.

Let's start with the first task: fixing garbled characters in stock search.

### Fixing Garbled Characters in Stock Search

The issue was immediately obvious: Chinese names in stock search results turned into garbled characters, leaving only stock ticker symbols readable.

![Garbled stock search results](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-stock-garbled-before-0d3d2a71.png)

After I provided the screenshot and symptoms to K3, it first traced from the search entry point to `marketDataService.searchStock`, and further into data source fallback logic.

Ultimately, the issue was pinpointed to the `HttpBodyFetcher` / `HttpUtils` call path: Sina's `suggest3.sinajs.cn` search API and `hq.sinajs.cn` quotes API return GBK encoding, whereas `SinaDataSource` in the project defaulted to `HttpUtils.get` with hardcoded UTF-8 decoding, causing Chinese characters to become corrupted.

The fix centered on decoding Sina's data source using GBK, and adding request methods supporting the `Referer` header.

![Kimi locates and fixes garbled stock search](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-stock-garbled-fixed-00a11d1d.png)

After the fix, K3 ran `mvn -pl stock-crawler -am install`, restarted the backend, and tested `GET /api/market/search?keyword=开`, confirming it returned normal Chinese names properly.

While this task seems minor, it highlights a model's engineering rigor far better than "write me a utility class": it traced from entry points, data sources, and HTTP decoding utilities all the way to external API encodings, without bloating unrelated modules.

### Developing a Portfolio Earnings Dashboard

The second task was adding a **Portfolio Earnings Dashboard** to this stock project.

Its goal was calculating total market value, floating PnL, today's PnL, maximum position size, and other metrics based on existing watchlist stocks' cost basis, share volume, and real-time quotes, while maintaining styling consistent with the existing UI.

![K3 receives portfolio earnings dashboard development task](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-task-55c9d5db.png)

While this requirement looks like a single page, it actually required completing backend calculations, API layering, frontend display, and tests simultaneously.

K3 first inspected the project's watchlist fields, quotes APIs, and existing layer conventions before implementing. Financial calculations uniformly used `BigDecimal`, and single-stock fallbacks were introduced when quote data was missing, preventing a single failure from crashing the entire page.

![K3 completes portfolio earnings dashboard with verification](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-complete-f5c24986.png)

The final delivery was a directly accessible dashboard: top summary cards for total market value, total cost, and floating PnL, with cost, current price, position, and return broken down for each stock below. Backend APIs, frontend routes, and tests were all provided.

![Portfolio earnings dashboard final page](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-dashboard-1dc3a112.png)

At this point, it was already fully functional.

However, I later reflected that in real projects, problems rarely stop at "does the page exist"; they involve metric consistency, exception handling, and deep metric drill-downs.

Therefore, I had K3 develop a V2 iteration of this dashboard.

This version expanded business metrics and risk indicators, such as fixing metric calculation discrepancies when partial quotes are unavailable, adding return contribution rankings, top 3 holdings concentration, HHI concentration index, annualized volatility, and maximum drawdown.

![K3 continues optimizing portfolio dashboard V2](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-v2-task-03ebea57.png)

What was interesting here was that instead of blindly piling fields into the frontend, it went back to the backend to verify candlestick fields, trading date alignment, suspension handling, and fallback behavior on insufficient data, before encapsulating the calculation logic into an independent `PortfolioRiskCalculator`.

This closely mirrors the working cadence of a seasoned engineer.

![K3 completes portfolio dashboard V2 with verification](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-v2-complete-07e6a5e9.png)

In the final V2 page, the original holdings details remained, supplemented below with return contributions and a risk overview.

Return contributions show which stocks truly drove portfolio gains/losses, while the risk overview presents annualized volatility, maximum drawdown, VaR, HHI concentration, and top 3 position percentages.

![Portfolio dashboard V2 page](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-v2-dashboard-f15c26c3.png)

In this case, it connected complete end-to-end chains within the constraints of an existing project: reusing data, adding calculations and APIs, running tests, and verifying pages. Crucially, in the second optimization round, it pursued business metrics deeply, elevating "can display" to "reliable and robust data semantics".

Additionally, after completion, I used GPT 5.6 Sol to audit the code; the overall implementation logic and code quality passed without issues, ready for direct commit.

## Case 3: Building a 3A-Quality Game Demo from Scratch

For the third case, I initially hesitated.

We already had a full-stack project and an existing Java project refactoring. Adding another common bug fix would feel redundant.

Then I decided on something far more visual and demanding:

Building a game.

This domain is entirely different. Business systems prioritize layering, APIs, tests, and data consistency; games evaluate an entirely different suite of capabilities: rendering, physics, input responsiveness, cameras, combat feedback, sound effects, UI, performance, and most importantly, playability.

Furthermore, K3's game development capability is astonishingly impressive.

I noticed similar feedback in overseas communities, with users reporting that K3 excels at one-shot game prompts, even replicating Minecraft-style 3D demos.

![Overseas community feedback on K3 game development capabilities](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-community-feedback-d78312cb.png)

So I thought: let's not just watch others play.

Let's test it myself.

My prompt was simple: build a 3A-quality third-person sci-fi action game demo from scratch in an empty directory. The setting is an abandoned futuristic industrial facility; the player must enter, defeat enemies along the way, retrieve an energy core, defeat a mechanical Boss, and evacuate.

Technically, I required Vite, TypeScript, Three.js, and Rapier. No hand-rolled physics engines; character movement, collision, and gravity had to be handled by Rapier. The game had to include movement, sprinting, dodging, aiming, shooting, taking damage, respawning on death, standard enemies, elite enemies, a multi-phase Boss, full quest loop, PBR materials, dynamic lighting, shadows, fog, particles, Bloom, hit feedback, and screen shake.

![Prompting K3 to develop 3A-quality third-person action game demo from scratch](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-prompt-f0c72141.jpg)

Frankly, when I wrote this prompt, my expectations weren't sky-high.

Games are not simple web pages.

If a web button is slightly misaligned, it's still readable; but if a game's camera, collision, shooting, enemy AI, Boss phases, visual effects, or audio miss a beat, players notice immediately.

K3 first provided a game design and technical blueprint. Named *STEEL HAVEN*, the sequence spanned: landing pad, breaching base gates, central courtyard elite guards, seizing energy core, awakening WARDEN-9 Boss, three-phase Boss fight, extraction point defense, and checkpoint respawning upon death.

![Game design and directory structure provided by K3](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-design-a4aa852e.jpg)

Then it began coding directly.

The initial delivery went far beyond "slapping a few cubes together and calling it a game."

It genuinely assembled the complete game loop: third-person character controls, WASD movement, Shift sprint, Space dodge, right-click aim, left-click shoot, R reload, E interact, standard enemies, elite enemies, three-phase Boss, mission objectives, Boss health bars, death respawns, victory screens, along with PBR materials, ambient reflections, shadows, fog, Bloom, muzzle flash, explosion particles, hit markers, and screen shake.

![STEEL HAVEN first iteration delivery report](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-report-v1-c23a6f0d.jpg)

Naturally, the first iteration wasn't flawless.

It documented several known issues in its delivery report, such as lack of jumping, Boss models momentarily occluding players when facing directly, and relatively large bundle sizes. More critically, playing it revealed that shooting feedback could be polished further.

This led to step two.

I directed it to optimize shooting animations and combat feel, refining the existing project rather than rebuilding from scratch. It analyzed screenshots and code, identifying 7 issues affecting game feel: left hand not holding the gun, muzzle and crosshair misalignment, character blocking the camera when aiming, muzzle flash obscured by body, continuous fire recoil not matching actual bullet spread, flat hit feedback, and desynchronized reload audio and animations.

It then updated the Player, PlayerController, CameraRig, Weapon, Game, Physics, AudioManager, HUD, and enemy modules.

![K3 second round optimizing shooting animations and combat feel](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-report-v2-89403bb6.jpg)

After this round of changes, the experience felt substantially more like a polished game.

When aiming, the character shifts from screen center to the bottom right, clearing the crosshair view; firing includes weapon kickback and camera elevation; sustained fire accumulates spread; reloading features phased motions of lowering, magazine ejection, insertion, and charging handle cocking; hits, critical strikes, and kills trigger distinct markers and sounds; wall sparks spray along surface normals rather than appearing as flat hardcoded decals.

Demo video link: <https://www.zhihu.com/pin/2062833196090275836>

Why did I feel this case had to be included?

Because it exceptionally demonstrates K3's multimodal understanding and long-horizon Agent capabilities.

In the first round, it extracted gameplay, levels, enemies, Bosses, physics, visuals, audio, UI, and tests from a single prompt. In the second round, it refined feel based on screenshots and actual gameplay feedback, elevating "playable" to "feeling like an authentic game."

This is far beyond generating a static frontend page.

This is translating nuanced subjective experiences into concrete code details.

Shooting feel cannot be easily defined with a unit test. Whether crosshairs are blocked by character models, whether gun recoil feels tactile, whether hit feedback is crisp, whether reloads have rhythm, and whether Boss battles feel intimidating—all must be judged via vision and feel.

This proves K3 is not only adept at business code, but can also handle multifaceted creative engineering tasks. As long as goals are clear and acceptance criteria are specific, it can journey from gameplay design all the way to a playable browser game demo, and continue refining based on experiential feedback.

This genuinely exceeded my expectations.

## Highlights of the K3 Update

Across several coding benchmarks, K3 firmly sits in the top tier, ranking first in some categories. Particularly in Terminal Bench, Program Bench, and SWE Marathon—which closely reflect daily development and long-horizon tasks—its performance is standout.

![Kimi K3 Coding benchmark comparison](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-coding-benchmarks-799b1adc.png)

Of course, benchmarks serve only as references.

In real-world projects, Agent environments are vastly more complex: tasks run longer, with requirements, code, logs, and test outputs all packing together.

Hence, the 1M context window is vital. It keeps extensive requirements, code, and terminal logs in context, avoiding losing earlier history after a few iterations.

However, 1M only addresses capacity, not comprehension. K3 introduced Kimi Delta Attention and Attention Residuals. In million-token contexts, it delivers up to 6.3x faster decoding and roughly 25% training efficiency gains at less than 2% extra overhead.

Without dwelling on technical jargon, the takeaway is simple: **K3's long-horizon task stability has taken a qualitative leap forward!**

Its Agent and multimodal performance are equally compelling. Across general Agent, tabular, and browser tasks, K3 consistently ranks in the top tier, taking first place in several benchmarks. Vision tasks keep pace as well, presenting a well-balanced profile.

![Kimi K3 General Agents and Visual Agents benchmark comparison](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-agent-visual-benchmarks-d818c4f5.png)

Ultimately, developers care about three things: **effectiveness, cost sustainability, and execution speed.**

My takeaway with K3 is that it is remarkably fast, priced competitively within its class—approaching Sonnet pricing while delivering an Opus-grade experience in complex tasks—offering exceptional value for money.

**⭐️ Recommended Reading:**

- [Backend Development Learning + Interview Guide](https://javaguide.cn/home.html): Covering core backend engineering and interview topics across Java, CS fundamentals, databases, frameworks, and system design.
- [AI Application Development Learning + Interview Guide](https://javaguide.cn/ai/): Covering LLMs, RAG, Agents, MCP, Prompts, evaluation, and system design.
- [AI Coding Practical Guide](https://javaguide.cn/ai-coding/): Covering tips and techniques for tools like Claude Code, Cursor, Codex, and Trae.

## Summary

After running through these cases, I believe you share a more concrete understanding of K3's capabilities beyond mere parameters and leaderboard scores.

Kimi has consistently ranked at the very top in frontend capabilities. With the K3 release, its overall versatility is significantly more comprehensive.

In full-stack MVPs, `/goal` effectively drives long-horizon tasks forward; in existing codebases, it traces seamlessly across entry points, service layers, data sources, and utility classes; in game development, it integrates gameplay, physics, cameras, shooting mechanics, and feedback loops.

I prefer deploying it in tasks with unambiguous goals, clear acceptance criteria, and permission to continuously run commands and apply fixes. Tasks like building an MVP, fixing cross-module bugs, or developing interactive demos reveal a Coding Agent's true caliber far better than static page generation.

What impressed me most is that K3 remains remarkably composed during long-horizon tasks, delivering results with virtually zero bugs upon completion across these cases.

If pricing, speed, and availability remain consistent moving forward, K3 stands as a top-tier model delivering both high capability and cost-efficiency.

I won't resort to hyperbole like "surpassing everyone" or "crushing the competition."

What developers look for is straightforward: Can it finish the task? Can it fix errors? Can the code pass review? Is the price affordable for daily use?

K3 has sparked intense discussions domestically, with some mixed reviews as well. My advice: don't rush to praise or dismiss it prematurely. Test it with your own real-world projects, and evaluate the model through hands-on practice and personal experience.
